/**
 * Local single-user broker import — INTEGRATED application-path verification.
 *
 * AUTHORITY
 *   Program Authority standing decision, 2026-11-09. This suite is the executed
 *   evidence for the eleven authorized behaviours, driven end-to-end through the
 *   REAL application components — not unit mocks:
 *
 *     broker CSV bytes → the shipped BI-05 ingress pipeline (detect/parse/
 *     normalize/validate) → governed P04 identity qualification → operator
 *     preview + resolution summary → the composed durable consumer from
 *     `startIpcServer` → the durable port's Gate E W-1 evaluation with the
 *     explicit local single-user authorization context → SQLite write →
 *     retrieval over the real IPC UDS socket → revisions / contributions /
 *     idempotency → restart on a fresh connection → cross-principal refusal →
 *     manual path intact.
 *
 * WHAT IT DOES NOT CLAIM
 *   Not a production acceptance, not a Gate 4 qualification, not a Gate 5
 *   admission, not an institutional or multi-user capability. W-1(3) and
 *   W-1(4) remain NOT MET for the governed path: with the switch absent, with
 *   no binding, or with a binding for another principal, every write is still
 *   refused with `WRITE_NOT_AUTHORIZED` and zero store effect. Identity
 *   qualification is never bypassed — an unresolved row still refuses the whole
 *   import.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection } from 'node:net';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import { verifyAuditChain } from '../src/persistence/audit.js';
import {
  listenIpc,
  resolveEndpointTarget,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { LOCAL_PERSONAL_USE_SETTING } from '../src/ipc/localPersonalUse.js';
import {
  DurablePortfolioStore,
  evaluatePortSaveGuard,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import {
  brokerImportPreview,
  executeBrokerCsvImport,
  parseBrokerCsvUpload,
} from '../src/ui/brokerImportApplicationPath.js';
import type { BrokerImportConsumer } from '../src/ipc/brokerImportConsumer.js';
import type { BrokerImportRequest } from '../src/persistence/brokerImportPersistence.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const OWNER: OwnerRef = { canonicalOwnerId: 'personal-owner', tenantId: 'personal-tenant' };
const OTHER_OWNER: OwnerRef = { canonicalOwnerId: 'someone-else', tenantId: 'personal-tenant' };
const PORTFOLIO = 'BROKER-PERSONAL';
const ON: NodeJS.ProcessEnv = { [LOCAL_PERSONAL_USE_SETTING]: '1' };

/**
 * A real Dhan detailed-holdings CSV. Both ISINs are registered in the governed
 * D05 authenticated universe, so both rows qualify — nothing here is a fixture
 * identity claim.
 */
const DHAN_CSV = [
  'Security Name,Trading Symbol,ISIN,Exchange,Quantity,Average Buy Price,Last Traded Price',
  'Reliance Industries,RELIANCE,INE002A01018,NSE,10,2400,2500',
  'Infosys,INFY,INE009A01021,NSE,5,1500,1600',
].join('\n');

/** The same file with a second batch (one extra row) — a distinct content digest. */
const DHAN_CSV_BATCH_2 = [
  'Security Name,Trading Symbol,ISIN,Exchange,Quantity,Average Buy Price,Last Traded Price',
  'Reliance Industries,RELIANCE,INE002A01018,NSE,10,2400,2500',
  'Infosys,INFY,INE009A01021,NSE,5,1500,1600',
  'Tata Consultancy Services,TCS,INE467B01029,NSE,3,3000,3200',
].join('\n');

/** An unregistered ISIN: the row must stay unresolved and refuse the whole import. */
const DHAN_CSV_UNRESOLVED = [
  'Security Name,Trading Symbol,ISIN,Exchange,Quantity,Average Buy Price,Last Traded Price',
  'Reliance Industries,RELIANCE,INE002A01018,NSE,10,2400,2500',
  'Unlisted Something,SOMETHING,INE999X01011,NSE,5,1500,1600',
].join('\n');

function frameFor(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function call(endpointPath: string, envelope: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path: endpointPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('close', () => {
      const raw = Buffer.concat(chunks);
      if (raw.byteLength < 5) {
        resolve({ __zeroBytes: true });
        return;
      }
      const length = raw.readUInt32BE(0);
      resolve(JSON.parse(raw.subarray(4, 4 + length).toString('utf8')));
    });
    socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
  });
}

const envelope = (op: string, payload?: unknown) => ({
  v: 1 as const,
  op,
  payload,
  requestId: `req-${op}-${Math.random().toString(36).slice(2, 10)}`,
});

function openRaw(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

function seedBinding(db: DatabaseSync, owner: OwnerRef = OWNER): void {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-personal', 'personal-operator', 'ACTIVE', ?, ?, NULL)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-personal', 'b-personal', ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(owner.tenantId, owner.canonicalOwnerId, now, now);
}

/** Evidence retention read straight from the durable store. */
function evidenceRows(db: DatabaseSync, portfolioId: string) {
  const revisions = db
    .prepare(
      `SELECT revision, operation, provenance_digest, content_digest, holdings_count, total_market_value
         FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision`,
    )
    .all(OWNER.canonicalOwnerId, portfolioId) as Array<Record<string, unknown>>;
  const contributions = db
    .prepare(
      `SELECT contribution_id, content_digest, file_name, source_broker, imported_at, contribution_semantics
         FROM portfolio_contributions WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY contributed_at`,
    )
    .all(OWNER.canonicalOwnerId, portfolioId) as Array<Record<string, unknown>>;
  return { revisions, contributions };
}

describe('local single-user broker import — integrated application path', () => {
  let root: string;
  let dbPath: string;
  let db: DatabaseSync | undefined;
  let handle: IpcHandle | undefined;
  let endpointPath: string;
  let consumer: BrokerImportConsumer;
  const master = getGovernedBroadSecurityMaster();

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'broker-app-path-'));
    dbPath = join(root, 'store', 'ipd.db');
    db = openRaw(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    seedBinding(db);

    // The shipped entrypoint: the ONE composed consumer, with the server-owned
    // environment supplied to the durable port's write gate.
    const outcome = await startIpcServer({
      env: {
        ...ON,
        IIPS_G2_IPC_ENDPOINT: `iips-broker-app-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
        IIPS_G3_DATABASE_PATH: dbPath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);
    handle = outcome.handle!;
    consumer = outcome.brokerImportConsumer!;
    assert.equal(typeof consumer, 'function');

    // A second, independently-bound server over the SAME file, so the UI read
    // path is exercised over a real socket rather than a direct store call.
    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: `iips-broker-app-read-${process.pid}`, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-read') },
      HOST_PLATFORM,
    );
    endpointPath = target.path;
    const readHandle = await listenIpc(
      target,
      createConnectionHandler(db, { env: { ...ON } }),
      { platform: HOST_PLATFORM },
    );
    readHandles.push(readHandle);
  });

  const readHandles: IpcHandle[] = [];

  after(async () => {
    await handle?.stop();
    for (const readHandle of readHandles) await readHandle.stop();
    db?.close();
    rmSync(root, { recursive: true, force: true });
  });

  /* ---------------------------------------------------------------- *
   * 1–5. Upload → parse → identity qualification → preview → summary
   * ---------------------------------------------------------------- */

  it('parses a real broker CSV, qualifies every row through the governed master, and previews without writing', () => {
    const before = evidenceRows(db!, PORTFOLIO);

    const parsed = parseBrokerCsvUpload({ content: DHAN_CSV, fileName: 'dhan-holdings.csv' }, master);
    const preview = brokerImportPreview(parsed);

    assert.equal(preview.broker, 'DHAN');
    assert.equal(preview.stageReached, 'COMPLETE');
    assert.equal(preview.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.equal(preview.saveable, true);
    assert.equal(preview.rowsParsed, 2);
    assert.equal(preview.rowsQualified, 2);
    assert.equal(preview.rowsRejected, 0);
    assert.deepEqual(preview.refusals, []);
    assert.deepEqual(
      preview.holdings.map((h) => `${h.symbol}:${h.companyId}:${h.identityStatus}`).sort(),
      ['INFY:EQ_INFY_IN:RESOLVED', 'RELIANCE:EQ_RELIANCE_IN:RESOLVED'],
    );
    // The resolution summary is the governed assessment's own counts.
    assert.equal(preview.identitySummary?.evaluated, 2);
    assert.equal(preview.identitySummary?.resolved, 2);
    assert.equal(preview.identitySummary?.unresolved, 0);
    assert.match(String(preview.identitySummary?.masterRevision), /^BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001:[a-f0-9]{64}$/);
    // Evidence identity of the uploaded bytes.
    assert.match(preview.contentDigest, /^[a-f0-9]{64}$/);
    assert.match(preview.lineageDigest, /^[a-f0-9]{64}$/);
    assert.ok(preview.totalMarketValue > 0);
    // Preview is a projection: nothing reached the store.
    assert.deepEqual(evidenceRows(db!, PORTFOLIO), before);
    assert.equal(db!.isTransaction, false);
  });

  it('keeps an unregistered ISIN unresolved, refuses the whole import, and writes nothing', () => {
    const before = evidenceRows(db!, PORTFOLIO);
    const parsed = parseBrokerCsvUpload({ content: DHAN_CSV_UNRESOLVED, fileName: 'dhan-unresolved.csv' }, master);
    const preview = brokerImportPreview(parsed);

    assert.equal(preview.saveable, false);
    assert.equal(preview.disposition, 'REJECTED');
    assert.equal(preview.holdings.length, 0, 'no holding may be invented to make the file saveable');
    assert.equal(preview.identitySummary?.unresolved, 1);
    assert.equal(preview.refusals.length, 1);
    assert.equal(preview.refusals[0]?.reason, 'UNMAPPED_IDENTIFIER');
    // The row keeps its own broker-supplied identity evidence, unresolved.
    assert.equal(preview.refusals[0]?.symbol, 'SOMETHING');
    assert.equal(preview.identitySummary?.refusalCodes?.UNMAPPED_IDENTIFIER, 1);

    // Even with a fully authorized consumer, an unqualified file never reaches
    // the store: the request builder refuses it first.
    const result = executeBrokerCsvImport(
      consumer,
      OWNER,
      { content: DHAN_CSV_UNRESOLVED, fileName: 'dhan-unresolved.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 0 },
    );
    assert.equal(result.request, undefined);
    assert.equal(result.outcome, undefined);
    assert.deepEqual(evidenceRows(db!, PORTFOLIO), before);
  });

  /* ---------------------------------------------------------------- *
   * 6. Authorized durable save through the shipped consumer
   * ---------------------------------------------------------------- */

  it('commits the qualified holdings durably through the composed consumer', () => {
    const result = executeBrokerCsvImport(
      consumer,
      OWNER,
      { content: DHAN_CSV, fileName: 'dhan-holdings.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 0 },
    );
    assert.equal(result.preview.saveable, true);
    assert.ok(result.request, 'a qualified file produces a durable request');
    assert.equal(result.outcome?.ok, true, JSON.stringify(result.outcome));
    const outcome = result.outcome as { disposition: string; revision: number; storeEffect: string; holdingsPersisted: number };
    assert.equal(outcome.disposition, 'SAVED_NEW_BATCH');
    assert.equal(outcome.revision, 1);
    assert.equal(outcome.storeEffect, 'REVISION_COMMITTED');
    assert.equal(outcome.holdingsPersisted, 2);

    const evidence = evidenceRows(db!, PORTFOLIO);
    assert.equal(evidence.revisions.length, 1);
    assert.equal(evidence.revisions[0]?.operation, 'INITIAL');
    // The request the application built carries raw broker identifiers only.
    const request = result.request as BrokerImportRequest;
    for (const holding of request.holdings) {
      assert.equal('companyId' in holding, false, 'the UI identity claim is never forwarded');
      assert.equal('identityStatus' in holding, false);
      assert.ok(holding.isin);
    }
    assert.equal(request.contentDigest, result.preview.contentDigest);
  });

  /* ---------------------------------------------------------------- *
   * 7. Retrieval through the normal read path (real IPC socket)
   * ---------------------------------------------------------------- */

  it('retrieves the saved broker portfolio through the normal IPC read path', async () => {
    const out = (await call(endpointPath, envelope('portfolio.get', { portfolioId: PORTFOLIO }))) as {
      result?: {
        revision: number;
        holdings: Array<{ symbol: string; companyId: string; securityIdentity?: { isin?: string } | null }>;
        totalMarketValue: number;
      };
    };
    assert.equal(out.result?.revision, 1);
    assert.equal(out.result?.holdings.length, 2);
    for (const holding of out.result?.holdings ?? []) {
      // Resolved governed identities, not the MANUAL: sentinel the manual path uses.
      assert.match(holding.companyId, /^EQ_[A-Z0-9_]+_IN$/);
      // The governed D114 identity is persisted and returned — the ISIN
      // evidence survives the round trip rather than being re-derived.
      assert.equal(typeof holding.securityIdentity, 'object');
      assert.match(String(holding.securityIdentity?.isin), /^INE[0-9A-Z]{9}$/);
    }
    const list = (await call(endpointPath, envelope('portfolio.list'))) as { result?: Array<{ portfolioId: string; holdingsCount: number }> };
    assert.equal(list.result?.length, 1);
    assert.equal(list.result?.[0]?.portfolioId, PORTFOLIO);
    assert.equal(list.result?.[0]?.holdingsCount, 2);
  });

  /* ---------------------------------------------------------------- *
   * 8–9. Update without duplication, revisions, audit, idempotency
   * ---------------------------------------------------------------- */

  it('updates an existing portfolio without duplicating holdings and adds one immutable revision', () => {
    const result = executeBrokerCsvImport(
      consumer,
      OWNER,
      { content: DHAN_CSV_BATCH_2, fileName: 'dhan-holdings-batch2.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 1 },
    );
    assert.equal(result.preview.saveable, true);
    assert.equal(result.outcome?.ok, true, JSON.stringify(result.outcome));
    const outcome = result.outcome as { disposition: string; revision: number; holdingsPersisted: number };
    assert.equal(outcome.disposition, 'MERGED_INTO_EXISTING');
    assert.equal(outcome.revision, 2);
    assert.equal(outcome.holdingsPersisted, 3);

    const store = new DurablePortfolioStore(db!);
    const detail = store.get(OWNER, PORTFOLIO);
    assert.equal(detail.holdings.length, 3);
    assert.equal(detail.revision, 2);
    assert.deepEqual(store.revisions(OWNER, PORTFOLIO).map((r) => r.revision), [1, 2]);
    assert.deepEqual(store.revisions(OWNER, PORTFOLIO).map((r) => r.operation), ['INITIAL', 'MERGE']);
    // Exactly one contribution row per committed import — no duplicate ledger entry.
    assert.equal(store.contributions(OWNER, PORTFOLIO).length, 2);
    assert.equal(verifyAuditChain(db!), true, 'the audit chain still verifies after two imports');
  });

  it('re-importing the identical file is an idempotent no-op: no new revision, no duplicate rows', () => {
    const before = evidenceRows(db!, PORTFOLIO);
    const result = executeBrokerCsvImport(
      consumer,
      OWNER,
      { content: DHAN_CSV_BATCH_2, fileName: 'dhan-holdings-batch2.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 2 },
    );
    assert.equal(result.outcome?.ok, true, JSON.stringify(result.outcome));
    const outcome = result.outcome as { disposition: string; revision: number; storeEffect: string; noOp: boolean };
    assert.equal(outcome.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.equal(outcome.noOp, true);
    assert.equal(outcome.revision, 2);
    assert.equal(outcome.storeEffect, 'NONE');
    assert.deepEqual(evidenceRows(db!, PORTFOLIO), before, 'the durable state is byte-identical');
  });

  /* ---------------------------------------------------------------- *
   * 10. Import evidence retained and retrievable
   * ---------------------------------------------------------------- */

  it('retains retrievable import evidence for every committed import', async () => {
    const preview = brokerImportPreview(parseBrokerCsvUpload({ content: DHAN_CSV, fileName: 'dhan-holdings.csv' }, master));
    const store = new DurablePortfolioStore(db!);
    const contributions = store.contributions(OWNER, PORTFOLIO);

    // Evidence is keyed by the uploaded file's own content digest — the same
    // value the operator saw in the preview — plus file name, broker and instant.
    const first = contributions.find((c) => c.contentDigest === preview.contentDigest);
    assert.ok(first, 'the original file bytes are identifiable in the durable ledger');
    assert.equal(first?.fileName, 'dhan-holdings.csv');
    assert.equal(first?.sourceBroker, 'DHAN');
    assert.ok(Number.isFinite(Date.parse(String(first?.importedAt))));
    assert.equal(first?.semantics, 'SAVED_NEW_BATCH');

    // The ordinary UI read path surfaces the same evidence to the operator.
    const wire = (await call(endpointPath, envelope('portfolio.get', { portfolioId: PORTFOLIO }))) as {
      result?: {
        contributions: unknown[];
        importEvidence?: Array<{
          contentDigest: string | null;
          fileName: string | null;
          sourceBroker: string | null;
          importedAt: string | null;
          semantics: string | null;
        }>;
      };
    };
    assert.deepEqual(wire.result?.contributions, [], 'governed rows stay off the wire');
    assert.equal(wire.result?.importEvidence?.length, 2);
    const fileA = wire.result?.importEvidence?.find((entry) => entry.contentDigest === preview.contentDigest);
    assert.ok(fileA, 'the uploaded file is identifiable from the wire by its own digest');
    assert.equal(fileA?.fileName, 'dhan-holdings.csv');
    assert.equal(fileA?.sourceBroker, 'DHAN');
    assert.equal(fileA?.semantics, 'SAVED_NEW_BATCH');
    assert.ok(Number.isFinite(Date.parse(String(fileA?.importedAt))));

    // The revision ledger retains the provenance digest of each batch, and the
    // current detail still projects the import provenance.
    const detail = store.get(OWNER, PORTFOLIO);
    assert.match(detail.provenanceDigest, /^[a-f0-9]{64}$/);
    for (const revision of store.revisions(OWNER, PORTFOLIO)) {
      assert.match(revision.provenanceDigest, /^[a-f0-9]{64}$/);
      assert.ok(Number.isFinite(Date.parse(revision.committedAt)));
    }
  });

  /* ---------------------------------------------------------------- *
   * 11. Restart durability
   * ---------------------------------------------------------------- */

  it('survives a full restart: close the connection, reopen, re-migrate, and read the same state', async () => {
    await handle?.stop();
    for (const readHandle of readHandles.splice(0)) await readHandle.stop();
    db?.close();

    // A brand-new process-equivalent: fresh handle, migrations re-run (they are
    // idempotent), a fresh server, a freshly composed consumer.
    const restarted = await startIpcServer({
      env: {
        ...ON,
        IIPS_G2_IPC_ENDPOINT: `iips-broker-app-restart-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-restart'),
        IIPS_G3_DATABASE_PATH: dbPath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(restarted.ok, true, restarted.error);
    handle = restarted.handle!;
    consumer = restarted.brokerImportConsumer!;
    db = openRaw(dbPath);
    assert.equal(verifyAuditChain(db), true);

    const store = new DurablePortfolioStore(db);
    const detail = store.get(OWNER, PORTFOLIO);
    assert.equal(detail.revision, 2);
    assert.equal(detail.holdings.length, 3);
    assert.deepEqual(store.revisions(OWNER, PORTFOLIO).map((r) => r.revision), [1, 2]);
    assert.equal(store.contributions(OWNER, PORTFOLIO).length, 2);

    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: `iips-broker-app-read-restart-${process.pid}`, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-read-restart') },
      HOST_PLATFORM,
    );
    endpointPath = target.path;
    readHandles.push(await listenIpc(target, createConnectionHandler(db, { env: { ...ON } }), { platform: HOST_PLATFORM }));
    const out = (await call(endpointPath, envelope('portfolio.get', { portfolioId: PORTFOLIO }))) as {
      result?: { revision: number; holdings: unknown[] };
    };
    assert.equal(out.result?.revision, 2);
    assert.equal(out.result?.holdings.length, 3);

    // And the restarted process can still commit the NEXT revision.
    const next = executeBrokerCsvImport(
      consumer,
      OWNER,
      { content: DHAN_CSV.replace('10,2400,2500', '12,2400,2500'), fileName: 'dhan-holdings-v3.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 2 },
    );
    assert.equal(next.outcome?.ok, true, JSON.stringify(next.outcome));
    assert.equal((next.outcome as { revision: number }).revision, 3);
  });

  /* ---------------------------------------------------------------- *
   * Cross-principal isolation and fail-closed authorization
   * ---------------------------------------------------------------- */

  it('refuses a write targeting a different principal, and a mismatched binding authorizes nothing', () => {
    const before = evidenceRows(db!, PORTFOLIO).revisions.length;

    // A different owner than the ACTIVE binding: refused, zero store effect.
    const foreign = executeBrokerCsvImport(
      consumer,
      OTHER_OWNER,
      { content: DHAN_CSV, fileName: 'dhan-holdings.csv' },
      master,
      { portfolioId: PORTFOLIO, expectedRevision: 3 },
    );
    assert.equal(foreign.outcome?.ok, false);
    assert.equal((foreign.outcome as { code: string }).code, 'WRITE_NOT_AUTHORIZED');
    assert.equal((foreign.outcome as { storeEffect: string }).storeEffect, 'NONE');

    // The port with an authorization context but a binding for another owner is
    // refused by the guard: the context is built from the DATABASE binding, and
    // it must equal the target owner.
    const port = new DurablePortfolioStorePort(db!, { env: { ...ON }, scope: 'BROKER_OBSERVED_IMPORT' });
    const request: BrokerImportRequest = {
      portfolioId: PORTFOLIO,
      expectedRevision: 3,
      holdings: [
        {
          symbol: 'RELIANCE', isin: 'INE002A01018', exchange: 'NSE', quantity: 10, averageBuyPrice: 2400,
          currentPrice: 2500, marketValue: 25000, weightPercentage: 100, active: true,
          sourceBroker: 'DHAN', lineageDigest: 'a'.repeat(64),
        },
      ],
      contentDigest: 'b'.repeat(64), fileName: 'x.csv', sourceBroker: 'DHAN',
      importedAt: new Date().toISOString(), mode: 'MERGE',
    };
    assert.throws(() => port.create(OTHER_OWNER, PORTFOLIO, { holdings: [], provenanceDigest: 'c'.repeat(64) }), /W-1/);

    // And a port with NO options — the historical construction — still refuses.
    const bare = new DurablePortfolioStorePort(db!);
    assert.throws(() => bare.create(OWNER, 'OTHER', { holdings: [], provenanceDigest: 'c'.repeat(64) }), /W-1/);
    assert.equal(evaluatePortSaveGuard().authorized, false, 'the no-context guard is unchanged');
    assert.deepEqual(evaluatePortSaveGuard().reasons, [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ]);

    assert.equal(evidenceRows(db!, PORTFOLIO).revisions.length, before, 'no refused attempt wrote a revision');
    assert.equal(request.expectedRevision, 3);
  });

  it('fails closed when the authorization context cannot be established', () => {
    const bare = new DurablePortfolioStorePort(db!);
    const saveable = { holdings: [], provenanceDigest: 'd'.repeat(64) };

    // Switch off → denied even though a valid binding exists.
    const offPort = new DurablePortfolioStorePort(db!, { env: { [LOCAL_PERSONAL_USE_SETTING]: '0' } });
    assert.throws(() => offPort.create(OWNER, 'X', saveable), /W-1/);

    // Binding present but an unrelated environment variable cannot authorize.
    const flagPort = new DurablePortfolioStorePort(db!, {
      env: { IIPS_PORT_SAVE_AUTHORIZED: 'true', IIPS_ALLOW_WRITES: '1', NODE_ENV: 'development' },
    });
    assert.throws(() => flagPort.create(OWNER, 'X', saveable), /W-1/);

    // No options at all → denied.
    assert.throws(() => bare.create(OWNER, 'X', saveable), /W-1/);

    // And a revoked binding denies the authorized-looking port.
    db!.prepare("UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ?").run(new Date().toISOString());
    const revokedPort = new DurablePortfolioStorePort(db!, { env: { ...ON } });
    assert.throws(() => revokedPort.create(OWNER, 'X', saveable), /W-1/);
    db!.prepare("UPDATE local_principal_memberships SET status = 'ACTIVE', revoked_at = NULL").run();
    // Restored: the same port now authorizes again.
    assert.throws(() => revokedPort.create(OWNER, 'X', saveable), /requires at least one holding/);
  });

  /* ---------------------------------------------------------------- *
   * The manual path remains functional and unaffected
   * ---------------------------------------------------------------- */

  it('leaves the manual personal portfolio path functional and distinguishable', async () => {
    const MANUAL = [
      { symbol: 'RELIANCE', quantity: 4, averageBuyPrice: 2300, currentPrice: 2500, active: true },
      { symbol: 'INFY', quantity: 2, averageBuyPrice: 1400, currentPrice: 1600, active: true },
    ];
    const created = (await call(endpointPath, envelope('portfolio.create', { portfolioId: 'manual-main', portfolioName: 'Manual', holdings: MANUAL }))) as {
      result?: { revision: number; portfolio: { holdings: Array<{ symbol: string; companyId: string }> } };
    };
    assert.equal(created.result?.revision, 1);
    for (const holding of created.result?.portfolio.holdings ?? []) {
      assert.equal(holding.companyId, `MANUAL:${holding.symbol}`);
    }

    const saved = (await call(endpointPath, envelope('portfolio.save', {
      portfolioId: 'manual-main', expectedRevision: 1,
      holdings: [{ symbol: 'RELIANCE', quantity: 8, averageBuyPrice: 2300, currentPrice: 2500, active: true }],
    }))) as { result?: { revision: number; disposition: string } };
    assert.equal(saved.result?.revision, 2);
    assert.equal(saved.result?.disposition, 'MERGED_INTO_EXISTING');

    // Both portfolios coexist under the same principal, each with its own
    // holdings semantics, and the broker portfolio is untouched by the manual work.
    const broker = new DurablePortfolioStore(db!).get(OWNER, PORTFOLIO);
    assert.equal(broker.revision, 3);
    for (const holding of broker.holdings) {
      assert.match(holding.companyId, /^EQ_[A-Z0-9_]+_IN$/);
    }
  });
});
