/**
 * D02/D03/D05 — durable holdings contract v2, isolated synthetic fixtures.
 *
 * Authority: IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01 (adopted
 * 2026-11-06), D02 `IIPS-V3-G2-HOLDINGS-OWNER-BINDING-2026-11-06-01`, D03
 * `IIPS-V3-G2-SNAPSHOT-CONTRACT-V2-2026-11-06-01` (consumer contract 2.0.0 /
 * frame v=2, four-revision cap retained, duplicate-before-cap), D05
 * `IIPS-V3-G2-BOUNDED-SNAPSHOT-ENGINEERING-2026-11-06-01` (bounded synthetic
 * engineering only).
 *
 * Every fixture below is SYNTHETIC and DISPOSABLE: temporary directories,
 * synthetic broker observations, stubbed identity resolvers and fixture
 * binding rows created directly in the test. No operational database, no
 * genuine broker evidence, no provisioning path. Synthetic results are not
 * native-host, genuine-broker, QE or admission evidence (H01–H12 all remain
 * NOT QUALIFIED); product writes remain WRITE_NOT_AUTHORIZED end to end.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection, type Socket } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import {
  DurablePortfolioStore,
  RevisionConflictError,
  InvalidPortfolioRequestError,
  ResourceUnavailableError,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import {
  persistHoldingsSnapshotV2,
  type SnapshotSaveV2Request,
} from '../src/persistence/brokerImportPersistence.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';

const HOLDINGS_OWNER = 'owner-4dc756b3';
const HOLDINGS_TENANT = 'ipd-personal-local';
const OWNER: OwnerRef = { canonicalOwnerId: HOLDINGS_OWNER, tenantId: HOLDINGS_TENANT };
const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-v2-contract-${process.pid}`;
const NOW = '2026-11-06T03:30:00.000Z';

function seedHoldingsBinding(
  db: DatabaseSync,
  options: { owner?: string; tenant?: string; bindingId?: string; membershipId?: string } = {},
): void {
  const { owner = HOLDINGS_OWNER, tenant = HOLDINGS_TENANT, bindingId = 'fx-b-1', membershipId = 'fx-m-1' } = options;
  const now = new Date().toISOString();
  // Synthetic fixture binding creation is authorized for tests only; no
  // provisioning code path runs and nothing here authorizes an operator.
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES (?, 'fixture-operator', 'ACTIVE', ?, ?, NULL)",
  ).run(bindingId, now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(membershipId, bindingId, tenant, owner, now, now);
}

function revokeHoldingsBinding(db: DatabaseSync, bindingId = 'fx-b-1', membershipId = 'fx-m-1'): void {
  const now = new Date().toISOString();
  db.prepare("UPDATE local_principal_bindings SET status = 'REVOKED', revoked_at = ? WHERE binding_id = ?").run(now, bindingId);
  db.prepare("UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ? WHERE membership_id = ?").run(now, membershipId);
}

const resolvedResolver: BrokerObservationResolver = {
  resolve(observation) {
    return { status: 'RESOLVED', companyId: `company-${observation.symbol}`, sourceRevision: 'a'.repeat(64) };
  },
};

const unresolvedResolver: BrokerObservationResolver = {
  resolve(observation) {
    return { status: 'UNMAPPED', reason: 'UNMAPPED_IDENTIFIER', sourceRevision: 'b'.repeat(64) };
  },
};

function observedHoldings() {
  return [
    {
      symbol: 'AAA',
      isin: 'INE000A01001',
      exchange: 'NSE' as const,
      quantity: 10,
      averageBuyPrice: 100,
      currentPrice: 110,
      marketValue: 1100,
      weightPercentage: 60,
      active: true,
      sourceBroker: 'broker-a',
    },
    {
      symbol: 'BBB',
      quantity: 4,
      averageBuyPrice: 100,
      currentPrice: 100,
      marketValue: 400,
      weightPercentage: 40,
      active: true,
      sourceBroker: 'broker-a',
    },
  ];
}

function snapshotRequest(overrides: Partial<SnapshotSaveV2Request> = {}): SnapshotSaveV2Request {
  return {
    portfolioId: 'unset-portfolio-id',
    expectedRevision: 1,
    holdings: observedHoldings(),
    contentDigest: 'a'.repeat(64),
    broker: 'broker-a',
    sourceEvidence: {
      fileName: 'fixture-2026-11-06.csv',
      sourceBroker: 'broker-a',
      importedAt: NOW,
      evidenceRecordDigest: 'b'.repeat(64),
    },
    ...overrides,
  };
}

function domainCounts(db: DatabaseSync): {
  portfolios: number;
  revisions: number;
  holdings: number;
  contributions: number;
} {
  const one = (sql: string) => Number((db.prepare(sql).get() as { n: number }).n);
  return {
    portfolios: one('SELECT COUNT(*) AS n FROM portfolios'),
    revisions: one('SELECT COUNT(*) AS n FROM portfolio_revisions'),
    holdings: one('SELECT COUNT(*) AS n FROM portfolio_holdings'),
    contributions: one('SELECT COUNT(*) AS n FROM portfolio_contributions'),
  };
}

function frameFor(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function parseWireResponse(buffer: Buffer): { v: number; ok: boolean; op: string; requestId?: string; outcome?: string; result?: unknown } {
  assert.ok(buffer.byteLength >= 4, 'a framed response was expected');
  const length = buffer.readUInt32BE(0);
  assert.equal(buffer.byteLength, 4 + length, 'the response must be exactly one frame');
  return JSON.parse(buffer.subarray(4).toString('utf8'));
}

describe('durable holdings / v2 contract (isolated synthetic fixture)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'dhd-contract-'));
  });

  afterEach(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  function freshDb(name = 'fixture.db'): DatabaseSync {
    const db = openDatabase(join(root, name));
    ensureMigrations(db, GATE3_MIGRATIONS);
    return db;
  }

  it('V2-C01: empty INITIAL, non-empty snapshot, stale-first duplicate-before-cap ordering, four-revision cap', () => {
    const db = freshDb();
    seedHoldingsBinding(db);
    const store = new DurablePortfolioStore(db);

    // Deliberate create: opaque IPD-generated ID, empty INITIAL revision 1.
    const created = store.createEmptySnapshot(OWNER, { portfolioName: 'synthetic fixture' });
    assert.match(created.portfolioId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.equal(created.revision, 1);

    const detail1 = store.getV2(OWNER, created.portfolioId);
    assert.equal(detail1.revision, 1);
    assert.equal(detail1.holdingsCount, 0);
    assert.deepEqual(detail1.holdings, []);
    assert.deepEqual(detail1.contributions, []);
    assert.equal(detail1.isSaved, false);
    assert.equal(Object.prototype.hasOwnProperty.call(detail1, 'durability'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(detail1, 'durable'), false);

    // Non-empty snapshot commits exactly revision 2 with lineage evidence.
    const first = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId }), resolvedResolver);
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.disposition, 'MERGED_INTO_EXISTING');
      assert.equal(first.revision, 2);
      assert.equal(first.storeEffect, 'REVISION_COMMITTED');
      assert.equal(first.holdingsPersisted, 2);
      assert.equal(first.durability, 'DURABLE');
      assert.equal(first.durable, true);
    }

    const detail2 = store.getV2(OWNER, created.portfolioId);
    assert.equal(detail2.revision, 2);
    assert.equal(detail2.holdings.length, 2);
    assert.equal(detail2.contributions.length, 1);
    assert.equal(detail2.contributions[0].contributionId, 'a'.repeat(64));
    assert.equal(detail2.contributions[0].fileName, 'fixture-2026-11-06.csv');
    assert.equal(detail2.contributions[0].sourceBroker, 'broker-a');
    assert.equal(detail2.contributions[0].importedAt, NOW);
    assert.equal(detail2.contributions[0].semantics, 'MERGED_INTO_EXISTING');
    assert.equal(detail2.isSaved, true);

    const historyAfterFirst = domainCounts(db);
    assert.deepEqual(historyAfterFirst, { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });

    // Duplicate at the current revision: no new rows, original lineage kept.
    const duplicate = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 2 }), resolvedResolver);
    assert.equal(duplicate.ok, true);
    if (duplicate.ok) {
      assert.equal(duplicate.disposition, 'ALREADY_IMPORTED_NO_OP');
      assert.equal(duplicate.revision, 2);
      assert.equal(duplicate.storeEffect, 'NONE');
      assert.equal(duplicate.noOp, true);
      assert.equal(duplicate.durability, 'DURABLE');
      assert.equal(duplicate.durable, true);
    }
    assert.deepEqual(domainCounts(db), historyAfterFirst);

    // Stale expected revision conflicts even for duplicate input.
    const stale = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 1 }), resolvedResolver);
    assert.equal(stale.ok, false);
    if (!stale.ok && stale.code) assert.equal(stale.code, 'REVISION_CONFLICT');
    assert.deepEqual(domainCounts(db), historyAfterFirst);

    // Drive the lifecycle to the retained four-revision cap.
    const third = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 2, contentDigest: 'c'.repeat(64) }), resolvedResolver);
    assert.equal(third.ok, true);
    const fourth = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 3, contentDigest: 'd'.repeat(64) }), resolvedResolver);
    assert.equal(fourth.ok, true);
    assert.equal(domainCounts(db).revisions, 4);

    // Duplicate at the cap is a no-op (duplicate BEFORE cap rejection).
    const duplicateAtCap = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 4 }), resolvedResolver);
    assert.equal(duplicateAtCap.ok, true);
    if (duplicateAtCap.ok) {
      assert.equal(duplicateAtCap.disposition, 'ALREADY_IMPORTED_NO_OP');
      assert.equal(duplicateAtCap.revision, 4);
    }
    assert.equal(domainCounts(db).revisions, 4);

    // A fresh mutation at the cap refuses.
    const freshAtCap = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 4, contentDigest: 'e'.repeat(64) }), resolvedResolver);
    assert.equal(freshAtCap.ok, false);
    if (!freshAtCap.ok && freshAtCap.code) assert.equal(freshAtCap.code, 'REVISION_CONFLICT');
    assert.equal(domainCounts(db).revisions, 4);

    // Unsafe and non-integer expected revisions are refused.
    for (const expectedRevision of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN]) {
      assert.throws(
        () => store.saveSnapshotV2(OWNER, {
          portfolioId: created.portfolioId,
          expectedRevision,
          holdings: observedHoldings().map((h) => ({
            ...h,
            companyId: `company-${h.symbol}`,
            lineageDigest: 'f'.repeat(64),
            identityStatus: 'RESOLVED',
            resolutionDisposition: 'CANONICAL_P04',
          })),
          contentDigest: 'a'.repeat(64),
          provenanceDigest: '9'.repeat(64),
          broker: 'broker-a',
          sourceEvidence: snapshotRequest().sourceEvidence,
        }),
        InvalidPortfolioRequestError,
      );
    }
  });

  it('V2-C02: evidence, forged identities and whole-import refusal with zero domain delta', () => {
    const db = freshDb();
    seedHoldingsBinding(db);
    const store = new DurablePortfolioStore(db);
    const created = store.createEmptySnapshot(OWNER, {});

    // Forged canonical-identity claims at the row level are refused outright.
    const forged = persistHoldingsSnapshotV2(
      store,
      OWNER,
      {
        ...snapshotRequest({ portfolioId: created.portfolioId }),
        holdings: observedHoldings().map((h) => ({ ...h, identityStatus: 'RESOLVED' }) as never),
      },
      resolvedResolver,
    );
    assert.equal(forged.ok, false);
    if (!forged.ok) assert.equal(forged.code, 'INVALID_REQUEST');
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });

    // Caller-supplied authority keys anywhere in the request are refused.
    const authorityInjected = persistHoldingsSnapshotV2(
      store,
      OWNER,
      { ...snapshotRequest({ portfolioId: created.portfolioId }), owner: 'attacker' } as never,
      resolvedResolver,
    );
    assert.equal(authorityInjected.ok, false);
    if (!authorityInjected.ok) assert.equal(authorityInjected.code, 'INVALID_REQUEST');
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });

    // Non-64-hex digests are refused.
    for (const patch of [
      { contentDigest: 'not-a-digest' },
      { contentDigest: 'A'.repeat(64) },
      { sourceEvidence: { ...snapshotRequest().sourceEvidence, evidenceRecordDigest: 'zz' } },
      { sourceEvidence: { ...snapshotRequest().sourceEvidence, importedAt: '2026-11-06 03:30:00' } },
      { sourceEvidence: { ...snapshotRequest().sourceEvidence, sourceBroker: 'broker-b' } },
      { broker: 'broker-b' },
    ]) {
      const outcome = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId, ...patch } as never), resolvedResolver);
      assert.equal(outcome.ok, false, `expected refusal for ${JSON.stringify(patch)}`);
      if (!outcome.ok) assert.equal(outcome.code, 'INVALID_REQUEST');
    }
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });

    // Whole-import refusal: any unresolved row refuses the import; zero delta.
    const unresolved = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId }), unresolvedResolver);
    assert.equal(unresolved.ok, false);
    if (!unresolved.ok) {
      assert.equal(unresolved.code, 'REFUSED_UNRESOLVED_IDENTITY');
      assert.equal(unresolved.storeEffect, 'NONE');
      assert.equal(unresolved.refusedHoldings?.length, 2);
    }
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });

    // Numeric guards: non-finite values, out-of-range weights, sum drift.
    const nanMarketValue = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        holdings: observedHoldings().map((h, i) => (i === 0 ? { ...h, marketValue: Number.NaN } : h)),
      }),
      resolvedResolver,
    );
    assert.equal(nanMarketValue.ok, false);

    const weightSumOff = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        holdings: observedHoldings().map((h, i) => (i === 1 ? { ...h, weightPercentage: 40.02 } : h)),
      }),
      resolvedResolver,
    );
    assert.equal(weightSumOff.ok, false);
    if (!weightSumOff.ok) assert.equal(weightSumOff.code, 'INVALID_REQUEST');

    const inactiveOnly = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        holdings: observedHoldings().map((h) => ({ ...h, active: false, quantity: 0 })),
      }),
      resolvedResolver,
    );
    assert.equal(inactiveOnly.ok, false);

    const duplicateSymbols = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        holdings: [observedHoldings()[0], { ...observedHoldings()[0], marketValue: 1, weightPercentage: 40 }],
      }),
      resolvedResolver,
    );
    assert.equal(duplicateSymbols.ok, false);

    // Weight boundary within ±0.01 is valid and commits.
    const boundary = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        holdings: [
          { ...observedHoldings()[0], weightPercentage: 33.33 },
          { ...observedHoldings()[1], weightPercentage: 66.67 },
        ],
      }),
      resolvedResolver,
    );
    assert.equal(boundary.ok, true);
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });
  });

  it('V2-C03: trusted binding — absent, foreign, revoked and pre-extension owners all fail closed', () => {
    const db = freshDb();
    // Absent binding: nothing resolves; the holdings path fails closed.
    assert.throws(() => new DurablePortfolioStore(db).createEmptySnapshot(OWNER, {}), ResourceUnavailableError);

    // Pre-extension (S1) owner on the same tenant is NOT the holdings owner.
    seedHoldingsBinding(db, { owner: 'ipd-owner-ramki-personal', tenant: HOLDINGS_TENANT });
    assert.throws(() => new DurablePortfolioStore(db).createEmptySnapshot(OWNER, {}), ResourceUnavailableError);
    const staleOwnerCounts = domainCounts(db);
    assert.deepEqual(staleOwnerCounts, { portfolios: 0, revisions: 0, holdings: 0, contributions: 0 });

    // SAIRAM evidence tenant is not holdings authority; foreign tenant refuses.
    closeDatabase();
    rmSync(join(root, 'fixture.db'));
    const db2 = freshDb();
    seedHoldingsBinding(db2, { owner: HOLDINGS_OWNER, tenant: 'irr-personal-073dd1c8' });
    assert.throws(() => new DurablePortfolioStore(db2).createEmptySnapshot(OWNER, {}), ResourceUnavailableError);

    // Revoked before the write: revocation committed first wins; zero delta.
    closeDatabase();
    rmSync(join(root, 'fixture.db'));
    const db3 = freshDb();
    seedHoldingsBinding(db3);
    const store3 = new DurablePortfolioStore(db3);
    const created = store3.createEmptySnapshot(OWNER, {});
    revokeHoldingsBinding(db3);
    const refused = persistHoldingsSnapshotV2(store3, OWNER, snapshotRequest({ portfolioId: created.portfolioId }), resolvedResolver);
    assert.equal(refused.ok, false);
    if (!refused.ok) assert.equal(refused.code, 'RESOURCE_UNAVAILABLE');
    assert.deepEqual(domainCounts(db3), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });

    // Foreign portfolio and unknown portfolio are indistinguishable from missing.
    closeDatabase();
    rmSync(join(root, 'fixture.db'));
    const db4 = freshDb();
    seedHoldingsBinding(db4);
    const store4 = new DurablePortfolioStore(db4);
    const owned = store4.createEmptySnapshot(OWNER, {});
    assert.throws(
      () => store4.getV2({ canonicalOwnerId: 'ipd-owner-ramki-personal', tenantId: HOLDINGS_TENANT }, owned.portfolioId),
      ResourceUnavailableError,
    );
    assert.throws(() => store4.getV2(OWNER, '00000000-0000-0000-0000-000000000000'), ResourceUnavailableError);

    // Storage-level single-ACTIVE rule: a second ACTIVE binding is refused by the partial-unique index.
    const now = new Date().toISOString();
    assert.throws(() =>
      db4.prepare(
        "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('fx-b-2', 'other', 'ACTIVE', ?, ?, NULL)",
      ).run(now, now),
    );
  });

  it('V2-C04: production dispatch — v2 reads and refusals only; v2 writes refuse; v1 preserved', async () => {
    const db = freshDb('dispatch.db');
    seedHoldingsBinding(db);
    const store = new DurablePortfolioStore(db);
    const created = store.createEmptySnapshot(OWNER, { portfolioName: 'dispatch fixture' });

    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state') },
      HOST_PLATFORM,
    );
    const endpointPath = target.path;
    const handle: IpcHandle = await listenIpc(
      target,
      createConnectionHandler(db, { settlement: settlementPolicyForEndpoint(target) }),
      { platform: HOST_PLATFORM },
    );

    const call = (envelope: unknown): Promise<Buffer> =>
      new Promise((resolve) => {
        const socket: Socket = createConnection({ path: endpointPath });
        const chunks: Buffer[] = [];
        socket.on('data', (chunk) => chunks.push(chunk));
        socket.on('error', () => resolve(Buffer.concat(chunks)));
        socket.on('close', () => resolve(Buffer.concat(chunks)));
        socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
      });

    try {
      // v2 list serves owner-scoped data with v=2.
      const listResponse = parseWireResponse(await call({ v: 2, op: 'portfolio.list', requestId: 'req-list' }));
      assert.equal(listResponse.v, 2);
      assert.equal(listResponse.ok, true);
      assert.equal(listResponse.requestId, 'req-list');
      assert.ok(Array.isArray(listResponse.result));
      assert.equal((listResponse.result as unknown[]).length, 1);

      // v2 get serves the detail; durability/durable remain absent (DR-3).
      const getResponse = parseWireResponse(await call({ v: 2, op: 'portfolio.get', payload: { portfolioId: created.portfolioId } }));
      assert.equal(getResponse.v, 2);
      assert.equal(getResponse.ok, true);
      const detail = getResponse.result as Record<string, unknown>;
      assert.equal(detail.portfolioId, created.portfolioId);
      assert.equal(Object.prototype.hasOwnProperty.call(detail, 'durability'), false);
      assert.equal(Object.prototype.hasOwnProperty.call(detail, 'durable'), false);
      assert.deepEqual(detail.contributions, []);

      // v2 revisions serves the immutable history.
      const revisionsResponse = parseWireResponse(await call({ v: 2, op: 'portfolio.revisions', payload: { portfolioId: created.portfolioId } }));
      assert.equal(revisionsResponse.v, 2);
      assert.equal(revisionsResponse.ok, true);
      assert.equal((revisionsResponse.result as Array<{ operation: string }>)[0].operation, 'INITIAL');

      // v2 create and save refuse with WRITE_NOT_AUTHORIZED; the W-1
      // hard-false conjunction covers v2 exactly as v1.
      const before = domainCounts(db);
      for (const op of ['portfolio.create', 'portfolio.save'] as const) {
        const response = parseWireResponse(
          await call({
            v: 2,
            op,
            payload:
              op === 'portfolio.create'
                ? { portfolioName: 'refused' }
                : {
                    portfolioId: created.portfolioId,
                    expectedRevision: 1,
                    mode: 'MERGE',
                    holdings: observedHoldings(),
                    contentDigest: 'a'.repeat(64),
                    broker: 'broker-a',
                    sourceEvidence: snapshotRequest().sourceEvidence,
                  },
          }),
        );
        assert.equal(response.v, 2);
        assert.equal(response.ok, false);
        assert.equal(response.outcome, 'WRITE_NOT_AUTHORIZED');
      }
      assert.deepEqual(domainCounts(db), before);

      // v2 has no reset/delete: the frame is an unknown operation, zero bytes.
      const resetResponse = await call({ v: 2, op: 'portfolio.reset', payload: { portfolioId: created.portfolioId, expectedRevision: 1 } });
      assert.equal(resetResponse.byteLength, 0);

      // Caller-supplied authority at any depth: zero bytes.
      const forgedResponse = await call({ v: 2, op: 'portfolio.get', payload: { portfolioId: created.portfolioId, owner: 'attacker' } });
      assert.equal(forgedResponse.byteLength, 0);

      // Unknown v2 operation and unknown version: zero bytes.
      const unknownOp = await call({ v: 2, op: 'portfolio.analytics' });
      assert.equal(unknownOp.byteLength, 0);
      const unknownVersion = await call({ v: 3, op: 'portfolio.list' });
      assert.equal(unknownVersion.byteLength, 0);

      // v1 behaviour is preserved: reads are served with v=1.
      const v1List = parseWireResponse(await call({ v: 1, op: 'portfolio.list' }));
      assert.equal(v1List.v, 1);
      assert.equal(v1List.ok, true);
    } finally {
      await handle.stop();
    }
  });

  it('V2-C05: stale-revision precedence — REVISION_CONFLICT precedes domain, provenance and identity rejection', () => {
    const db = freshDb();
    seedHoldingsBinding(db);
    const store = new DurablePortfolioStore(db);
    const created = store.createEmptySnapshot(OWNER, {});
    const first = persistHoldingsSnapshotV2(store, OWNER, snapshotRequest({ portfolioId: created.portfolioId }), resolvedResolver);
    assert.equal(first.ok, true);

    const storeHoldings = () => [
      {
        symbol: 'AAA',
        companyId: 'company-AAA',
        quantity: 10,
        averageBuyPrice: 100,
        currentPrice: 110,
        marketValue: 1100,
        weightPercentage: 60,
        active: true,
        sourceBroker: 'broker-a',
        lineageDigest: 'd'.repeat(64),
        identityStatus: 'RESOLVED',
        resolutionDisposition: 'CANONICAL_P04',
      },
      {
        symbol: 'BBB',
        companyId: 'company-BBB',
        quantity: 4,
        averageBuyPrice: 100,
        currentPrice: 100,
        marketValue: 400,
        weightPercentage: 40,
        active: true,
        sourceBroker: 'broker-a',
        lineageDigest: 'e'.repeat(64),
        identityStatus: 'RESOLVED',
        resolutionDisposition: 'CANONICAL_P04',
      },
    ];
    const storeRequest = (patch: Record<string, unknown> = {}) => ({
      portfolioId: created.portfolioId,
      expectedRevision: 99,
      holdings: storeHoldings(),
      contentDigest: 'f'.repeat(64),
      provenanceDigest: 'c'.repeat(64),
      broker: 'broker-a',
      sourceEvidence: {
        fileName: 'fixture-2026-11-06.csv',
        sourceBroker: 'broker-a',
        importedAt: NOW,
        evidenceRecordDigest: 'b'.repeat(64),
      },
      ...patch,
    });

    // A. stale + domain-invalid (NaN) -> REVISION_CONFLICT at the store boundary.
    assert.throws(
      () => store.saveSnapshotV2(OWNER, storeRequest({
        holdings: storeHoldings().map((h, i) => (i === 0 ? { ...h, marketValue: Number.NaN } : h)),
      })),
      RevisionConflictError,
    );
    // B. stale + provenance-invalid (importedAt not round-trippable) -> REVISION_CONFLICT.
    assert.throws(
      () => store.saveSnapshotV2(OWNER, storeRequest({
        sourceEvidence: { ...storeRequest().sourceEvidence, importedAt: '2026-11-06 03:30:00' },
      })),
      RevisionConflictError,
    );
    // C. stale + identity-field blank -> REVISION_CONFLICT.
    assert.throws(
      () => store.saveSnapshotV2(OWNER, storeRequest({
        holdings: storeHoldings().map((h, i) => (i === 0 ? { ...h, identityStatus: '' } : h)),
      })),
      RevisionConflictError,
    );
    // D. stale + lineage digest malformed -> REVISION_CONFLICT.
    assert.throws(
      () => store.saveSnapshotV2(OWNER, storeRequest({
        holdings: storeHoldings().map((h, i) => (i === 0 ? { ...h, lineageDigest: 'zz'.repeat(32) } : h)),
      })),
      RevisionConflictError,
    );
    // E. service boundary: stale + domain-invalid -> REVISION_CONFLICT refusal, zero delta.
    const serviceDomain = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 99,
        holdings: observedHoldings().map((h, i) => (i === 0 ? { ...h, marketValue: Number.NaN } : h)),
      }),
      resolvedResolver,
    );
    assert.equal(serviceDomain.ok, false);
    if (!serviceDomain.ok) assert.equal(serviceDomain.code, 'REVISION_CONFLICT');
    // F. service boundary: stale + unresolved identity -> REVISION_CONFLICT (identity gate runs after stale).
    const serviceIdentity = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 99 }),
      unresolvedResolver,
    );
    assert.equal(serviceIdentity.ok, false);
    if (!serviceIdentity.ok) assert.equal(serviceIdentity.code, 'REVISION_CONFLICT');
    // G. service boundary: stale + broker/evidence mismatch -> REVISION_CONFLICT.
    const serviceProvenance = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 99,
        sourceEvidence: { ...snapshotRequest().sourceEvidence, sourceBroker: 'broker-b' },
      }),
      resolvedResolver,
    );
    assert.equal(serviceProvenance.ok, false);
    if (!serviceProvenance.ok) assert.equal(serviceProvenance.code, 'REVISION_CONFLICT');
    // G2. stale + ISO-8601 offset instant that is NOT round-trippable -> REVISION_CONFLICT.
    const serviceInstant = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 99,
        sourceEvidence: { ...snapshotRequest().sourceEvidence, importedAt: '2026-11-06T03:30:00+00:00' },
      }),
      resolvedResolver,
    );
    assert.equal(serviceInstant.ok, false);
    if (!serviceInstant.ok) assert.equal(serviceInstant.code, 'REVISION_CONFLICT');

    // H. framing/security still precede stale: caller-supplied identity key + stale -> INVALID_REQUEST (never REVISION_CONFLICT).
    const framed = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 99, companyId: 'company-evil' } as never),
      resolvedResolver,
    );
    assert.equal(framed.ok, false);
    if (!framed.ok) assert.equal(framed.code, 'INVALID_REQUEST');
    // I. malformed digest + stale -> INVALID_REQUEST (framing precedes stale).
    const digest = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 99, contentDigest: 'not-a-digest' }),
      resolvedResolver,
    );
    assert.equal(digest.ok, false);
    if (!digest.ok) assert.equal(digest.code, 'INVALID_REQUEST');
    // J. expectedRevision 0 + stale-impossible request -> INVALID_REQUEST (framing precedes stale).
    const zero = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 0 }),
      resolvedResolver,
    );
    assert.equal(zero.ok, false);
    if (!zero.ok) assert.equal(zero.code, 'INVALID_REQUEST');

    // Zero domain delta after every refused path.
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });

    // K. current revision + domain-invalid -> INVALID_REQUEST (NOT REVISION_CONFLICT), zero delta.
    const currentDomain = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 2,
        contentDigest: '1'.repeat(64),
        holdings: observedHoldings().map((h, i) => (i === 0 ? { ...h, marketValue: Number.NaN } : h)),
      }),
      resolvedResolver,
    );
    assert.equal(currentDomain.ok, false);
    if (!currentDomain.ok) assert.equal(currentDomain.code, 'INVALID_REQUEST');
    // L. current revision + unresolved identity -> REFUSED_UNRESOLVED_IDENTITY.
    const currentIdentity = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 2, contentDigest: '2'.repeat(64) }),
      unresolvedResolver,
    );
    assert.equal(currentIdentity.ok, false);
    if (!currentIdentity.ok) assert.equal(currentIdentity.code, 'REFUSED_UNRESOLVED_IDENTITY');
    // M. current revision + already-committed contribution digest + INVALID payload -> INVALID_REQUEST (never a success no-op for an unverifiable payload).
    const replayed = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 2,
        contentDigest: 'a'.repeat(64),
        holdings: observedHoldings().map((h, i) => (i === 0 ? { ...h, marketValue: Number.NaN } : h)),
      }),
      resolvedResolver,
    );
    assert.equal(replayed.ok, false);
    if (!replayed.ok) assert.equal(replayed.code, 'INVALID_REQUEST');
    // M2. same offset-instant boundary at CURRENT revision -> INVALID_REQUEST (provenance strictness preserved post-stale).
    const currentInstant = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({
        portfolioId: created.portfolioId,
        expectedRevision: 2,
        contentDigest: '3'.repeat(64),
        sourceEvidence: { ...snapshotRequest().sourceEvidence, importedAt: '2026-11-06T03:30:00+00:00' },
      }),
      resolvedResolver,
    );
    assert.equal(currentInstant.ok, false);
    if (!currentInstant.ok) assert.equal(currentInstant.code, 'INVALID_REQUEST');
    // N. and at the store boundary the duplicate-no-op-before-cap rule is preserved for valid payloads at current revision.
    const noop = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 2, contentDigest: 'a'.repeat(64) }),
      resolvedResolver,
    );
    assert.equal(noop.ok, true);
    if (noop.ok) assert.equal(noop.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });
  });
});
