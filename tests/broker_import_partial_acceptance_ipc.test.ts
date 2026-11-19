import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import { closeDatabase } from '../src/persistence/connection.js';
import { submitBrokerImport } from '../src/ipc/brokerImportConsumer.js';
import { createBrokerImportConsumer } from '../src/ipc/brokerImportConsumer.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import type { OwnerRef } from '../src/persistence/portfolio_store.js';
import type {
  BrokerImportRequest,
  BrokerImportOutcome,
  BrokerPartialAcceptanceSummary,
  BrokerSnapshotUnresolvedRow,
} from '../src/contracts/broker_import_ipc.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';
import {
  assessSnapshotAcceptance,
  deriveImportId,
} from '../src/persistence/daily_snapshot_import.js';
import { countOutstandingUnresolved, readUnresolvedEvidence } from '../src/persistence/broker_snapshot_ledger.js';

/**
 * The broker-import IPC surface now carries TWO payload generations on the one
 * `portfolio.importBroker` operation: the unchanged all-or-nothing request, and
 * the PR #177 daily-snapshot request whose resolved rows may be accepted
 * partially after explicit approval.
 *
 * These tests exercise the REAL dispatcher and the REAL persistence layer. Only
 * the identity resolver is a deterministic fixture, so assertion mode does not
 * depend on the governed P7 registry; the production resolver is exercised by
 * the existing broker-import suites and its contract is unchanged here.
 */

const OWNER: OwnerRef = { canonicalOwnerId: 'owner', tenantId: 'tenant' };
const DIGEST = '5263f2c69ddc35a05cc179a3e760396bc5cee1b12ed044dca006ca5ab9eb7303';
const OBSERVED_AT = '2026-11-19T08:29:10.578Z';

/** `UNK*` stays unresolved; everything else resolves. */
const fixtureResolver: BrokerObservationResolver = {
  resolve(observation) {
    const symbol = String((observation as { symbol: string }).symbol);
    if (symbol.startsWith('UNK')) {
      return {
        status: 'UNMAPPED',
        reason: `UNMAPPED_IDENTIFIER:${symbol}`,
        sourceRevision: 'P7_FIXTURE',
      } as ReturnType<BrokerObservationResolver['resolve']>;
    }
    return {
      status: 'RESOLVED',
      companyId: `company-${symbol}`,
      sourceRevision: 'P7_FIXTURE',
    } as ReturnType<BrokerObservationResolver['resolve']>;
  },
};

function call(path: string, op: string, payload?: unknown): Promise<Record<string, any> | null> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('close', () => {
      const b = Buffer.concat(chunks);
      resolve(b.length >= 4 ? JSON.parse(b.subarray(4, 4 + b.readUInt32BE()).toString()) : null);
    });
    socket.on('connect', () => {
      const b = Buffer.from(JSON.stringify({ v: 1, op, payload, requestId: 'r1' }));
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(b.length);
      socket.end(Buffer.concat([prefix, b]));
    });
  });
}

function seed(db: DatabaseSync, owner: OwnerRef = { canonicalOwnerId: 'ipd-owner', tenantId: 'ipd-tenant' }) {
  const now = '2026-11-19T00:00:00.000Z';
  db.prepare("INSERT INTO local_principal_bindings (binding_id,principal_label,status,created_at,updated_at,revoked_at) VALUES ('b','local','ACTIVE',?,?,NULL)").run(now, now);
  db.prepare("INSERT INTO local_principal_memberships (membership_id,binding_id,tenant_id,canonical_owner_id,status,created_at,updated_at,revoked_at) VALUES ('m','b',?,?,'ACTIVE',?,?,NULL)").run(owner.tenantId, owner.canonicalOwnerId, now, now);
}

function holding(symbol: string, quantity: number, extra: Record<string, unknown> = {}) {
  return {
    symbol,
    isin: `INE${symbol}P01010`,
    exchange: 'NSE' as const,
    series: 'EQ',
    quantity,
    averageBuyPrice: 5,
    currentPrice: 10,
    marketValue: quantity * 10,
    weightPercentage: 0,
    active: quantity > 0,
    sourceBroker: 'DHAN',
    lineageDigest: 'a'.repeat(64),
    ...extra,
  };
}

/**
 * Real governed P04 identities, used ONLY for the IPC-route tests so they run the
 * production resolver end to end. (`holding()` above uses synthetic symbols and is
 * paired with `fixtureResolver` in the unit tests.)
 */
function governedHolding(symbol: string, isin: string, quantity: number) {
  return {
    symbol, isin, exchange: 'NSE' as const, series: 'EQ',
    quantity, averageBuyPrice: 100, currentPrice: 110, marketValue: quantity * 110,
    weightPercentage: 0, active: true, sourceBroker: 'DHAN', lineageDigest: 'a'.repeat(64),
  };
}
const INFY_ISIN = 'INE009A01021';
const TCS_ISIN = 'INE467B01029';

/** Anchors an existing portfolio at revision 1 through the ordinary path. */
function anchorFirstRevision(port: DurablePortfolioStorePort, owner: OwnerRef) {
  const outcome = submitBrokerImport(port, owner, {
    portfolioId: 'BROKER-IPC',
    expectedRevision: 0,
    contentDigest: 'b'.repeat(64),
    fileName: 'day-1.csv',
    sourceBroker: 'DHAN',
    importedAt: '2026-11-18T10:00:00.000Z',
    holdings: [holding('AAA', 10), holding('BBB', 5)],
  } as BrokerImportRequest, {}, fixtureResolver);
  assert.equal(outcome.ok, true, 'anchor import must commit');
  return outcome.ok === true ? outcome.revision : 0;
}

function snapshotRequest(overrides: Partial<BrokerImportRequest> = {}): BrokerImportRequest {
  return {
    portfolioId: 'BROKER-IPC',
    expectedRevision: 1,
    contentDigest: DIGEST,
    fileName: 'dhan-holdings.csv',
    sourceBroker: 'DHAN',
    importedAt: OBSERVED_AT,
    importId: deriveImportId(DIGEST, OBSERVED_AT, ''),
    fullSnapshot: true,
    holdings: [holding('AAA', 12), holding('UNK1', 6)],
    ...overrides,
  } as BrokerImportRequest;
}

function revisions(db: DatabaseSync, owner: OwnerRef) {
  return (db
    .prepare('SELECT revision FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision')
    .all(owner.canonicalOwnerId, 'BROKER-IPC') as Array<{ revision: number }>).map((r) => r.revision);
}

function holdingsAt(db: DatabaseSync, owner: OwnerRef, revision: number) {
  return db
    .prepare('SELECT symbol, quantity FROM portfolio_holdings WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ? ORDER BY symbol')
    .all(owner.canonicalOwnerId, 'BROKER-IPC', revision) as Array<{ symbol: string; quantity: number }>;
}

/* ------------------------------------------------------------------ *
 * IPC route: acceptance, refusal, digest binding, closed validator
 * ------------------------------------------------------------------ */

test('IPC accepts a valid partial-acceptance request and reports PARTIALLY_ACCEPTED', async () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-ipc-'));
  const dbPath = join(root, 'db.sqlite');
  const db = new DatabaseSync(dbPath);
  ensureMigrations(db, GATE3_MIGRATIONS);
  seed(db);
  const env = { IIPS_LOCAL_PERSONAL_USE: '1', IIPS_G2_IPC_ENDPOINT: 'stage4', IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'), IIPS_G3_DATABASE_PATH: dbPath };
  const started = await startIpcServer({ env });
  assert.ok(started.ok, started.error);
  const path = started.target!.path;
  try {
    // Revision 1 exists first, so the snapshot is a genuine successor.
    const anchor = await call(path, 'portfolio.importBroker', {
      portfolioId: 'BROKER-IPC', expectedRevision: 0, contentDigest: 'b'.repeat(64), fileName: 'day-1.csv',
      sourceBroker: 'DHAN', importedAt: '2026-11-18T10:00:00.000Z',
      holdings: [governedHolding('INFY', INFY_ISIN, 10), governedHolding('TCS', TCS_ISIN, 5)],
    });
    assert.equal(anchor?.result.ok, true, JSON.stringify(anchor?.result));
    assert.equal(anchor?.result.revision, 1);

    const owner: OwnerRef = { canonicalOwnerId: 'ipd-owner', tenantId: 'ipd-tenant' };
    // A full snapshot: INFY observed, TCS still held, plus one genuinely
    // unmapped row. The governed resolver resolves the first two and refuses the
    // third, which is exactly the 64-of-65 shape.
    const request = snapshotRequest({
      holdings: [
        governedHolding('INFY', INFY_ISIN, 12),
        governedHolding('TCS', TCS_ISIN, 5),
        { ...governedHolding('UNMAPPED', 'INE999X01011', 6) },
      ],
    });
    const summary: BrokerPartialAcceptanceSummary = assessSnapshotAcceptance(request, undefined, OWNER.canonicalOwnerId);

    // No approval yet: written nowhere, and the prompt is returned over the wire.
    const pending = await call(path, 'portfolio.importBroker', request);
    assert.equal(pending?.result.ok, false);
    assert.equal(pending?.result.code, 'PARTIAL_ACCEPTANCE_REQUIRED');
    assert.equal(pending?.result.summary.unresolvedCount, 1);
    assert.equal(revisions(db, owner).length, 1);

    // Explicit approval bound to the summary the operator was shown.
    const approved = await call(path, 'portfolio.importBroker', {
      ...request,
      partialAcceptance: {
        approved: true,
        approvedAt: '2026-11-19T08:30:00.000Z',
        approvedBy: 'local-operator',
        summaryDigest: summary.summaryDigest,
      },
    });
    assert.equal(approved?.result.ok, true);
    assert.equal(approved?.result.snapshotState, 'PARTIALLY_ACCEPTED');
    assert.equal(approved?.result.unresolvedCount, 1);
    assert.equal(approved?.result.revision, 2);

    // Only the resolved rows were persisted at the new revision.
    assert.deepEqual(holdingsAt(db, owner, 2).map((h) => h.symbol), ['INFY', 'TCS']);
    // Revision 1 is preserved untouched.
    assert.deepEqual(holdingsAt(db, owner, 1).map((h) => h.symbol), ['INFY', 'TCS']);
  } finally {
    await started.handle!.stop();
    closeDatabase();
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('IPC rejects a mismatched assessment digest and writes nothing', async () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-digest-'));
  const dbPath = join(root, 'db.sqlite');
  const db = new DatabaseSync(dbPath);
  ensureMigrations(db, GATE3_MIGRATIONS);
  seed(db);
  const env = { IIPS_LOCAL_PERSONAL_USE: '1', IIPS_G2_IPC_ENDPOINT: 'stage4', IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'), IIPS_G3_DATABASE_PATH: dbPath };
  const started = await startIpcServer({ env });
  assert.ok(started.ok, started.error);
  const path = started.target!.path;
  try {
    await call(path, 'portfolio.importBroker', {
      portfolioId: 'BROKER-IPC', expectedRevision: 0, contentDigest: 'b'.repeat(64), fileName: 'day-1.csv',
      sourceBroker: 'DHAN', importedAt: '2026-11-18T10:00:00.000Z',
      holdings: [governedHolding('INFY', INFY_ISIN, 10), governedHolding('TCS', TCS_ISIN, 5)],
    });
    const owner: OwnerRef = { canonicalOwnerId: 'ipd-owner', tenantId: 'ipd-tenant' };
    const mismatched = await call(path, 'portfolio.importBroker', {
      ...snapshotRequest({ holdings: [governedHolding('INFY', INFY_ISIN, 12), governedHolding('UNMAPPED', 'INE999X01011', 6)] }),
      partialAcceptance: {
        approved: true,
        approvedAt: OBSERVED_AT,
        approvedBy: 'local-operator',
        summaryDigest: 'c'.repeat(64),
      },
    });
    assert.equal(mismatched?.result.ok, false);
    assert.equal(mismatched?.result.code, 'REFUSED_APPROVAL_MISMATCH');
    assert.deepEqual(revisions(db, owner), [1]);
  } finally {
    await started.handle!.stop();
    closeDatabase();
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('the wire validator accepts the authorised contract fields and still refuses unsupported ones', async () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-validator-'));
  const dbPath = join(root, 'db.sqlite');
  const db = new DatabaseSync(dbPath);
  ensureMigrations(db, GATE3_MIGRATIONS);
  seed(db);
  const env = { IIPS_LOCAL_PERSONAL_USE: '1', IIPS_G2_IPC_ENDPOINT: 'stage4', IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'), IIPS_G3_DATABASE_PATH: dbPath };
  const started = await startIpcServer({ env });
  assert.ok(started.ok, started.error);
  const path = started.target!.path;
  try {
    await call(path, 'portfolio.importBroker', {
      portfolioId: 'BROKER-IPC', expectedRevision: 0, contentDigest: 'b'.repeat(64), fileName: 'day-1.csv',
      sourceBroker: 'DHAN', importedAt: '2026-11-18T10:00:00.000Z',
      holdings: [governedHolding('INFY', INFY_ISIN, 10)],
    });

    // Authorised fields are structurally accepted (they reach persistence; the
    // identity outcome may still refuse, which is NOT a shape refusal).
    const accepted = await call(path, 'portfolio.importBroker', {
      ...snapshotRequest(),
      holdings: [{ ...governedHolding('INFY', INFY_ISIN, 12), dpQty: 12, availableQty: 10, profitLoss: 70, pnlPercentage: 11.6 }],
    });
    assert.notEqual(accepted?.outcome, 'INVALID_REQUEST', 'authorised fields must not be a shape refusal');

    // Genuinely unsupported fields are still refused as an invalid payload.
    const unsupportedTop = await call(path, 'portfolio.importBroker', { ...snapshotRequest(), somethingElse: 1 });
    assert.equal(unsupportedTop?.outcome, 'INVALID_REQUEST');

    const unsupportedHolding = await call(path, 'portfolio.importBroker', {
      ...snapshotRequest(),
      holdings: [{ ...governedHolding('INFY', INFY_ISIN, 12), notAField: 'x' }],
    });
    assert.equal(unsupportedHolding?.outcome, 'INVALID_REQUEST');

    // A malformed approval is a shape refusal, not a silent ignore.
    const badApproval = await call(path, 'portfolio.importBroker', {
      ...snapshotRequest(),
      partialAcceptance: { approved: 'yes', approvedAt: OBSERVED_AT, approvedBy: 'op', summaryDigest: 'c'.repeat(64) },
    });
    assert.equal(badApproval?.outcome, 'INVALID_REQUEST');

    const missingDigest = await call(path, 'portfolio.importBroker', {
      ...snapshotRequest(),
      partialAcceptance: { approved: true, approvedAt: OBSERVED_AT, approvedBy: 'op' },
    });
    assert.equal(missingDigest?.outcome, 'INVALID_REQUEST');

    // Non-caller-authority extras are refused by the shape check, while a
    // caller-supplied authority key is refused earlier by the C7 scan (Class P).
    assert.equal((await call(path, 'portfolio.importBroker', { ...snapshotRequest(), owner: 'spoof' })), null);
  } finally {
    await started.handle!.stop();
    closeDatabase();
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ *
 * Persistence-level behaviour through the routing function
 * ------------------------------------------------------------------ */

function portFor(db: DatabaseSync, root: string) {
  return new DurablePortfolioStorePort(db, {
    scope: 'BROKER_OBSERVED_IMPORT',
    env: { IIPS_LOCAL_PERSONAL_USE: '1' } as NodeJS.ProcessEnv,
  });
}

function freshDb(root: string) {
  const db = new DatabaseSync(join(root, 'unit.sqlite'));
  ensureMigrations(db, GATE3_MIGRATIONS);
  seed(db, OWNER);
  return db;
}

test('resolved holdings persist only after explicit approval; unresolved evidence stays durable', () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-unit-'));
  const db = freshDb(root);
  try {
    const port = portFor(db, root);
    const request = snapshotRequest({ partialAcceptance: undefined });

    // 1. No approval: nothing written, evidence not recorded.
    const pending = submitBrokerImport(port, OWNER, request, {}, fixtureResolver);
    assert.equal(pending.ok, false);
    assert.equal((pending as { code: string }).code, 'PARTIAL_ACCEPTANCE_REQUIRED');
    assert.deepEqual(revisions(db, OWNER), []);
    assert.equal(countOutstandingUnresolved(db, OWNER.canonicalOwnerId, 'BROKER-IPC'), 0);

    // 2. Approval: resolved rows persisted, unresolved retained verbatim.
    anchorFirstRevision(port, OWNER);
    const summary = assessSnapshotAcceptance(request, fixtureResolver, OWNER.canonicalOwnerId);
    const approved = submitBrokerImport(port, OWNER, {
      ...request,
      partialAcceptance: {
        approved: true,
        approvedAt: OBSERVED_AT,
        approvedBy: OWNER.canonicalOwnerId,
        summaryDigest: summary.summaryDigest,
      },
    }, {}, fixtureResolver);
    assert.equal(approved.ok, true);
    assert.equal(approved.ok === true ? approved.snapshotState : '', 'PARTIALLY_ACCEPTED');

    const evidence = readUnresolvedEvidence(db, OWNER.canonicalOwnerId, 'BROKER-IPC', (request as { importId: string }).importId);
    assert.equal(evidence.length, 1);
    const row: BrokerSnapshotUnresolvedRow = evidence[0];
    assert.equal(row.symbol, 'UNK1');
    assert.equal(row.quantity, 6);
    assert.match(row.reason, /UNMAPPED_IDENTIFIER/);
    assert.equal(countOutstandingUnresolved(db, OWNER.canonicalOwnerId, 'BROKER-IPC'), 1);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('a later resolution does not duplicate already accepted holdings, and retries are idempotent', () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-resolve-'));
  const db = freshDb(root);
  try {
    const port = portFor(db, root);
    anchorFirstRevision(port, OWNER);
    const request = snapshotRequest();
    const summary = assessSnapshotAcceptance(request, fixtureResolver, OWNER.canonicalOwnerId);
    const approval = {
      approved: true as const,
      approvedAt: OBSERVED_AT,
      approvedBy: OWNER.canonicalOwnerId,
      summaryDigest: summary.summaryDigest,
    };
    const first = submitBrokerImport(port, OWNER, { ...request, partialAcceptance: approval }, {}, fixtureResolver);
    assert.equal(first.ok, true);
    const acceptedRevision = first.ok === true ? first.revision : 0;
    const before = holdingsAt(db, OWNER, acceptedRevision);

    // Idempotent retry of the same operation: no new revision, no new rows.
    const retry = submitBrokerImport(port, OWNER, { ...request, expectedRevision: acceptedRevision, partialAcceptance: approval }, {}, fixtureResolver);
    assert.equal(retry.ok, true);
    assert.equal(retry.ok === true ? retry.disposition : '', 'ALREADY_IMPORTED_NO_OP');
    assert.deepEqual(revisions(db, OWNER), [1, acceptedRevision]);
    assert.deepEqual(holdingsAt(db, OWNER, acceptedRevision), before);

    // Resolving the outstanding row closes the evidence without writing a
    // duplicate holding for an already-accepted security.
    const resolved = db
      .prepare(
        `UPDATE broker_snapshot_unresolved_rows
            SET resolution_status = 'RESOLVED', resolved_at = ?, resolved_company_id = ?
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND resolution_status = 'OUTSTANDING'`,
      )
      .run(OBSERVED_AT, 'company-UNK1', OWNER.canonicalOwnerId, 'BROKER-IPC');
    assert.equal(Number(resolved.changes), 1);
    assert.equal(countOutstandingUnresolved(db, OWNER.canonicalOwnerId, 'BROKER-IPC'), 0);
    assert.deepEqual(holdingsAt(db, OWNER, acceptedRevision), before, 'resolution must not rewrite accepted holdings');
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('the existing all-resolved import path is unchanged and still refuses all-or-nothing', () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-legacy-'));
  const db = freshDb(root);
  try {
    const port = portFor(db, root);

    // Ordinary path: fully resolvable holdings commit exactly as before.
    const ordinary = submitBrokerImport(port, OWNER, {
      portfolioId: 'BROKER-IPC', expectedRevision: 0, contentDigest: 'b'.repeat(64), fileName: 'day-1.csv',
      sourceBroker: 'DHAN', importedAt: '2026-11-18T10:00:00.000Z',
      holdings: [holding('AAA', 10)],
    } as BrokerImportRequest, {}, fixtureResolver);
    assert.equal(ordinary.ok, true);
    assert.equal(ordinary.ok === true ? ordinary.revision : 0, 1);

    // Ordinary path with an unresolved row: still the unchanged all-or-nothing
    // refusal. Routing must not silently make the legacy path partial.
    const refused = submitBrokerImport(port, OWNER, {
      portfolioId: 'BROKER-IPC', expectedRevision: 1, contentDigest: 'd'.repeat(64), fileName: 'day-2.csv',
      sourceBroker: 'DHAN', importedAt: '2026-11-19T10:00:00.000Z',
      holdings: [holding('AAA', 12), holding('UNK2', 3)],
    } as BrokerImportRequest, {}, fixtureResolver);
    assert.equal(refused.ok, false);
    assert.equal((refused as { code: string }).code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.deepEqual(revisions(db, OWNER), [1]);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('the advertised consumer still authorizes through the same write gate', () => {
  const root = mkdtempSync(join(tmpdir(), 'partial-gate-'));
  const db = freshDb(root);
  try {
    // A consumer constructed WITHOUT authorization options keeps the historical
    // default-deny: the new partial path is not a way around the write gate.
    const consumer = createBrokerImportConsumer(db);
    // Governed holdings and a governed assessment, so the digest matches and the
    // refusal below can only come from the write gate — not from a mismatch.
    const request = snapshotRequest({
      holdings: [holding('AAA', 12), holding('UNK1', 6)],
    });
    const bound = assessSnapshotAcceptance(request, undefined, OWNER.canonicalOwnerId);
    const outcome = consumer(OWNER, {
      ...request,
      partialAcceptance: { approved: true, approvedAt: OBSERVED_AT, approvedBy: OWNER.canonicalOwnerId, summaryDigest: bound.summaryDigest },
    } as BrokerImportRequest);
    assert.equal(outcome.ok, false);
    assert.equal((outcome as { code: string }).code, 'WRITE_NOT_AUTHORIZED');
    assert.deepEqual(revisions(db, OWNER), []);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
