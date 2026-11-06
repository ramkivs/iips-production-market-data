/**
 * D02/D03/D05 — durable holdings recovery, isolated synthetic fixtures.
 *
 * Authority: IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01 (adopted
 * 2026-11-06), D03 `IIPS-V3-G2-SNAPSHOT-CONTRACT-V2-2026-11-06-01`, D05
 * `IIPS-V3-G2-BOUNDED-SNAPSHOT-ENGINEERING-2026-11-06-01` (bounded synthetic
 * engineering only), cap retained at four revisions.
 *
 * Isolation: temporary directories only, synthetic broker observations, stubbed
 * identity resolvers, fixture binding rows created directly in tests, child
 * processes used for commit-boundary and race behaviour. No operational
 * database, no power-loss claim, no genuine-broker claim; H01–H12 remain NOT
 * QUALIFIED. Product writes remain WRITE_NOT_AUTHORIZED on every live path.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { constants, copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations, MigrationIntegrityError } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStore,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import {
  persistHoldingsSnapshotV2,
  reconcileSnapshotV2ByRead,
  type SnapshotSaveV2Request,
} from '../src/persistence/brokerImportPersistence.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';
import { resolveActiveHoldingsBinding, BindingAbsentError } from '../src/persistence/binding.js';

const HOLDINGS_OWNER = 'owner-4dc756b3';
const HOLDINGS_TENANT = 'ipd-personal-local';
const OWNER: OwnerRef = { canonicalOwnerId: HOLDINGS_OWNER, tenantId: HOLDINGS_TENANT };
const NOW = '2026-11-06T03:30:00.000Z';
const HERE = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(HERE), '..', '..');
const DIST_SRC = join(REPO_ROOT, 'dist', 'src');

const resolvedResolver: BrokerObservationResolver = {
  resolve(observation) {
    return { status: 'RESOLVED', companyId: `company-${observation.symbol}`, sourceRevision: 'a'.repeat(64) };
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

function seedHoldingsBinding(db: DatabaseSync): void {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('fx-b-1', 'fixture-operator', 'ACTIVE', ?, ?, NULL)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('fx-m-1', 'fx-b-1', ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(HOLDINGS_TENANT, HOLDINGS_OWNER, now, now);
}

function revokeHoldingsBinding(db: DatabaseSync): void {
  const now = new Date().toISOString();
  db.prepare("UPDATE local_principal_bindings SET status = 'REVOKED', revoked_at = ? WHERE binding_id = 'fx-b-1'").run(now);
  db.prepare("UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ? WHERE membership_id = 'fx-m-1'").run(now);
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

const CHILD_SCRIPT = String.raw`
import { writeSync } from 'node:fs';
import { openDatabase, closeDatabase } from '${pathToFileURL(join(DIST_SRC, 'persistence', 'connection.js')).href}';
import { ensureMigrations } from '${pathToFileURL(join(DIST_SRC, 'persistence', 'migration_ledger.js')).href}';
import { GATE3_MIGRATIONS } from '${pathToFileURL(join(DIST_SRC, 'ipc', 'entrypoint.js')).href}';
import { DurablePortfolioStore } from '${pathToFileURL(join(DIST_SRC, 'persistence', 'portfolio_store.js')).href}';
import { persistHoldingsSnapshotV2 } from '${pathToFileURL(join(DIST_SRC, 'persistence', 'brokerImportPersistence.js')).href}';

const [dbPath, mode, portfolioIdArg, contentDigestArg] = process.argv.slice(2);
const owner = { canonicalOwnerId: 'owner-4dc756b3', tenantId: 'ipd-personal-local' };
const fault = process.env.DHD_FAULT ?? 'none';
const holdings = [
  { symbol: 'AAA', isin: 'INE000A01001', exchange: 'NSE', quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 60, active: true, sourceBroker: 'broker-a' },
  { symbol: 'BBB', quantity: 4, averageBuyPrice: 100, currentPrice: 100, marketValue: 400, weightPercentage: 40, active: true, sourceBroker: 'broker-a' },
];
const resolvedResolver = {
  resolve(observation) {
    return { status: 'RESOLVED', companyId: 'company-' + observation.symbol, sourceRevision: 'a'.repeat(64) };
  },
};
const db = openDatabase(dbPath);
ensureMigrations(db, GATE3_MIGRATIONS);
{
  // Synthetic fixture binding; children only ever run against disposable test databases.
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT COUNT(*) AS n FROM local_principal_bindings").get();
  if (Number(existing.n) === 0) {
    db.prepare("INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('fx-b-1', 'fixture-operator', 'ACTIVE', ?, ?, NULL)").run(now, now);
    db.prepare("INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('fx-m-1', 'fx-b-1', 'ipd-personal-local', 'owner-4dc756b3', 'ACTIVE', ?, ?, NULL)").run(now, now);
  }
}
const store = new DurablePortfolioStore(db, {
  afterMutation(step) {
    if (step === fault) process.exit(42);
  },
  afterCommit() {
    if (fault === 'post-commit') process.exit(43);
  },
});
const sourceEvidence = { fileName: 'fixture-2026-11-06.csv', sourceBroker: 'broker-a', importedAt: '2026-11-06T03:30:00.000Z', evidenceRecordDigest: 'b'.repeat(64) };
try {
  if (mode === 'create-and-save') {
    const created = store.createEmptySnapshot(owner, { portfolioName: 'exit-fixture' });
    writeSync(1, 'created ' + created.portfolioId + '\n');
    const outcome = persistHoldingsSnapshotV2(store, owner, {
      portfolioId: created.portfolioId,
      expectedRevision: 1,
      holdings,
      contentDigest: contentDigestArg ?? 'a'.repeat(64),
      broker: 'broker-a',
      sourceEvidence,
    }, resolvedResolver);
    writeSync(1, 'outcome ' + JSON.stringify(outcome) + '\n');
  } else if (mode === 'save') {
    const outcome = persistHoldingsSnapshotV2(store, owner, {
      portfolioId: portfolioIdArg,
      expectedRevision: 1,
      holdings,
      contentDigest: contentDigestArg,
      broker: 'broker-a',
      sourceEvidence,
    }, resolvedResolver);
    writeSync(1, 'outcome ' + JSON.stringify(outcome) + '\n');
  } else if (mode === 'hold-lock') {
    db.exec('BEGIN IMMEDIATE;');
    // The write lock is held from here until ROLLBACK; signal readiness and
    // let the timer own the exit so the lock is genuinely held meanwhile.
    writeSync(1, 'locked\n');
    setTimeout(() => {
      try { db.exec('ROLLBACK;'); } catch { /* the lock dies with the process */ }
      closeDatabase();
      process.exit(0);
    }, 1500);
  }
  if (mode !== 'hold-lock') {
    closeDatabase();
    process.exit(0);
  }
} catch (error) {
  writeSync(1, 'error ' + (error && error.message ? error.message : String(error)) + '\n');
  process.exit(1);
}
`;

interface ChildResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

function spawnChildSync(args: string[], env: NodeJS.ProcessEnv = {}): ChildResult {
  const result = spawnSync(process.execPath, [CHILD_PATH, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15000,
    env: { ...process.env, ...env },
  });
  return { code: result.status, signal: result.signal, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

let CHILD_PATH = '';

function logicalDigest(db: DatabaseSync): string {
  const tables = [
    'portfolios',
    'portfolio_revisions',
    'portfolio_holdings',
    'portfolio_contributions',
    'local_principal_bindings',
    'local_principal_memberships',
    'audit_events',
  ];
  const digest = createHash('sha256');
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all();
    digest.update(table);
    digest.update('\n');
    digest.update(JSON.stringify(rows));
    digest.update('\n');
  }
  return digest.digest('hex');
}

const sha256File = (filePath: string): string => createHash('sha256').update(readFileSync(filePath)).digest('hex');

describe('durable holdings / v2 recovery (isolated synthetic fixture)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'dhd-recovery-'));
    CHILD_PATH = join(root, 'child.mjs');
    writeFileSync(CHILD_PATH, CHILD_SCRIPT);
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

  function seedSavedSnapshot(dbPath: string): string {
    closeDatabase();
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    seedHoldingsBinding(db);
    const store = new DurablePortfolioStore(db);
    const created = store.createEmptySnapshot(OWNER, { portfolioName: 'backup fixture' });
    const outcome = persistHoldingsSnapshotV2(
      store,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId }),
      resolvedResolver,
    );
    assert.equal(outcome.ok, true);
    closeDatabase();
    return created.portfolioId;
  }

  it('V2-R01: fault injection at every mutation boundary rolls back completely', () => {
    for (const step of ['portfolio-update', 'revision-insert', 'holding-insert:AAA', 'contribution-insert']) {
      const name = `rollback-${step.replace(/[^A-Za-z0-9]/g, '_')}.db`;
      closeDatabase();
      const db = freshDb(name);
      seedHoldingsBinding(db);
      const setup = new DurablePortfolioStore(db);
      const created = setup.createEmptySnapshot(OWNER, {});
      const baseline = domainCounts(db);
      const faulty = new DurablePortfolioStore(db, {
        afterMutation(observed) {
          if (observed === step) throw new Error(`injected fault at ${step}`);
        },
      });
      assert.throws(
        () =>
          faulty.saveSnapshotV2(OWNER, {
            portfolioId: created.portfolioId,
            expectedRevision: 1,
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
        /injected fault/,
      );
      // Complete rollback: the failed save left no domain delta.
      assert.deepEqual(domainCounts(db), baseline, `expected zero delta after fault at ${step}`);
      const pointer = db.prepare('SELECT current_revision FROM portfolios WHERE portfolio_id = ?').get(created.portfolioId) as { current_revision: number };
      assert.equal(pointer.current_revision, 1);
      closeDatabase();
    }

    // Fault during create rolls back the whole creation, including the portfolio row.
    const createFaultDb = freshDb('create-rollback.db');
    seedHoldingsBinding(createFaultDb);
    const faultyCreate = new DurablePortfolioStore(createFaultDb, {
      afterMutation(step) {
        if (step === 'revision-insert') throw new Error('injected fault at revision-insert');
      },
    });
    assert.throws(() => faultyCreate.createEmptySnapshot(OWNER, {}), /injected fault/);
    assert.deepEqual(domainCounts(createFaultDb), { portfolios: 0, revisions: 0, holdings: 0, contributions: 0 });
  });

  it('V2-R02: commit acknowledgement loss yields UNKNOWN; exact settled readback reconciles', () => {
    const db = freshDb();
    seedHoldingsBinding(db);
    const setup = new DurablePortfolioStore(db);
    const created = setup.createEmptySnapshot(OWNER, {});

    // Fault AFTER COMMIT but BEFORE the acknowledgement is observed: the
    // acknowledged-but-lost outcome is UNKNOWN, and the write is exactly-once.
    const afterCommitFault = new DurablePortfolioStore(db, {
      afterCommit() {
        throw new Error('injected post-commit fault');
      },
    });
    const unknown = persistHoldingsSnapshotV2(
      afterCommitFault,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId }),
      resolvedResolver,
    );
    assert.equal(unknown.ok, 'unknown');
    if (unknown.ok === 'unknown') {
      assert.equal(unknown.code, 'OUTCOME_UNKNOWN');
      assert.equal(unknown.storeEffect, 'OUTCOME_UNKNOWN');
    }
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });

    // Exact settled readback: contribution ledger AND revision history agree.
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'COMMITTED');

    // A lost acknowledgement is never proof of failure and never a retry ticket.
    const resubmitted = persistHoldingsSnapshotV2(
      setup,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId, expectedRevision: 2 }),
      resolvedResolver,
    );
    assert.equal(resubmitted.ok, true);
    if (resubmitted.ok) assert.equal(resubmitted.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });

    // Partial visibility (ledger and history disagree) is UNRESOLVED, never guessed.
    db.prepare('DELETE FROM portfolio_holdings WHERE revision = 2').run();
    db.prepare('DELETE FROM portfolio_revisions WHERE revision = 2').run();
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'UNRESOLVED');
    db.prepare('DELETE FROM portfolio_contributions WHERE contribution_id = ?').run('a'.repeat(64));
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'NOT_COMMITTED');
    closeDatabase();

    // Fault BEFORE commit: consistent reads report NOT_COMMITTED.
    const preCommitDb = freshDb('precommit.db');
    seedHoldingsBinding(preCommitDb);
    const preCommitSetup = new DurablePortfolioStore(preCommitDb);
    const second = preCommitSetup.createEmptySnapshot(OWNER, {});
    const preCommitFault = new DurablePortfolioStore(preCommitDb, {
      afterMutation(step) {
        if (step === 'holding-insert:AAA') throw new Error('injected pre-commit fault');
      },
    });
    const failed = persistHoldingsSnapshotV2(
      preCommitFault,
      OWNER,
      snapshotRequest({ portfolioId: second.portfolioId }),
      resolvedResolver,
    );
    assert.equal(failed.ok, false);
    assert.equal(reconcileSnapshotV2ByRead(preCommitSetup, OWNER, second.portfolioId, 'a'.repeat(64), 2), 'NOT_COMMITTED');
    closeDatabase();

    // An unreadable store is UNRESOLVED, never an invented verdict.
    const unreadable = {
      proveSettledForReconciliation(): never {
        throw new Error('the settled store is unreadable');
      },
      contributionsValidated(): never {
        throw new Error('the settled store is unreadable');
      },
      revisions(): never {
        throw new Error('the settled store is unreadable');
      },
    };
    assert.equal(reconcileSnapshotV2ByRead(unreadable, OWNER, 'any', 'a'.repeat(64), 2), 'UNRESOLVED');
  });

  it('V2-R03: separate-process exit before and after COMMIT; reopen preserves exact state', () => {
    const dbPath = join(root, 'exit.db');
    closeDatabase();

    // Pre-commit process exit: no partial domain state survives.
    const preCommit = spawnChildSync([dbPath, 'create-and-save', '', 'a'.repeat(64)], { DHD_FAULT: 'holding-insert:AAA' });
    assert.equal(preCommit.code, 42, `child stdout: ${preCommit.stdout}\nchild stderr: ${preCommit.stderr}`);
    const createdId = /created ([0-9a-f-]{36})/.exec(preCommit.stdout)?.[1];
    assert.ok(createdId, `expected the child to report its created portfolio id, got: ${preCommit.stdout}`);
    let db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 1, holdings: 0, contributions: 0 });
    closeDatabase();

    // Post-COMMIT, pre-acknowledgement process exit: the commit is fully visible after reopen.
    const postCommit = spawnChildSync([dbPath, 'save', createdId, 'c'.repeat(64)], { DHD_FAULT: 'post-commit' });
    assert.equal(postCommit.code, 43, `child stdout: ${postCommit.stdout}\nchild stderr: ${postCommit.stderr}`);
    // The child never observed the acknowledgement, so no outcome line was printed.
    assert.equal(/outcome /.test(postCommit.stdout), false);
    db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });
    const reconciled = reconcileSnapshotV2ByRead(
      new DurablePortfolioStore(db),
      OWNER,
      createdId as string,
      'c'.repeat(64),
      2,
    );
    assert.equal(reconciled, 'COMMITTED');
    closeDatabase();

    // Unperturbed child: create + save + acknowledge.
    const dbPath2 = join(root, 'clean.db');
    const clean = spawnChildSync([dbPath2, 'create-and-save', '', 'd'.repeat(64)]);
    assert.equal(clean.code, 0, clean.stdout);
    db = openDatabase(dbPath2);
    ensureMigrations(db, GATE3_MIGRATIONS);
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });
    closeDatabase();
  });

  it('V2-R04: busy writer refuses without retry; two independent processes race to exactly one commit', async () => {
    const dbPath = join(root, 'race.db');
    closeDatabase();
    // Parent seeds binding + empty INITIAL; then closes its handle.
    let db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    seedHoldingsBinding(db);
    const setup = new DurablePortfolioStore(db);
    const created = setup.createEmptySnapshot(OWNER, {});
    closeDatabase();

    // (a) A writer holding the write lock is not waited on and never retried.
    const holder = spawn(process.execPath, [CHILD_PATH, dbPath, 'hold-lock'], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let holderOut = '';
    let holderErr = '';
    holder.stdout.on('data', (chunk: Buffer) => {
      holderOut += chunk;
    });
    holder.stderr.on('data', (chunk: Buffer) => {
      holderErr += chunk;
    });
    const deadline = Date.now() + 5000;
    while (!holderOut.includes('locked')) {
      if (Date.now() > deadline) {
        holder.kill('SIGKILL');
        throw new Error(`the lock holder did not report readiness; holder stdout: ${holderOut}; holder stderr: ${holderErr}`);
      }
      // Yield to the event loop so stdout 'data' events can fire.
      await new Promise((resolveYield) => setTimeout(resolveYield, 20));
    }
    db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    // The shipping writer path sets no busy timeout; pin the same posture in the
    // fixture so the write refuses immediately instead of waiting the lock out.
    db.exec('PRAGMA busy_timeout = 0;');
    const busyOutcome = persistHoldingsSnapshotV2(
      new DurablePortfolioStore(db),
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId }),
      resolvedResolver,
    );
    assert.equal(busyOutcome.ok, false);
    if (!busyOutcome.ok) assert.equal(busyOutcome.code, 'UNAVAILABLE');
    assert.equal(domainCounts(db).revisions, 1, 'a refused busy write committed nothing');
    closeDatabase();
    await new Promise<void>((resolveExit) => holder.on('exit', () => resolveExit()));

    // (b) Two independent processes race from revision 1 with different
    // snapshots: at most one commits; the loser refuses; no retry occurs.
    const spawnRacer = (digest: string): Promise<ChildResult> =>
      new Promise((resolvePromise) => {
        const child = spawn(process.execPath, [CHILD_PATH, dbPath, 'save', created.portfolioId, digest], {
          env: { ...process.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk;
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk;
        });
        child.on('exit', (code, signal) => resolvePromise({ code, signal, stdout, stderr }));
      });
    const racers = await Promise.all([spawnRacer('c'.repeat(64)), spawnRacer('d'.repeat(64))]);
    const outcomes = racers.map((racer) => /outcome (.*)/.exec(racer.stdout)?.[1]).filter(Boolean) as string[];
    const parsed = outcomes.map((raw) => JSON.parse(raw) as { ok: boolean; code?: string; storeEffect?: string; revision?: number });
    const commits = parsed.filter((o) => o.ok === true && o.storeEffect === 'REVISION_COMMITTED');
    const refusals = parsed.filter((o) => o.ok === false);
    assert.equal(commits.length, 1, `expected exactly one commit, got: ${JSON.stringify(parsed)}`);
    assert.equal(commits[0].revision, 2);
    assert.equal(refusals.length, 1);
    assert.ok(refusals[0].code === 'REVISION_CONFLICT' || refusals[0].code === 'UNAVAILABLE');

    db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    assert.deepEqual(domainCounts(db), { portfolios: 1, revisions: 2, holdings: 2, contributions: 1 });
    closeDatabase();
  });

  it('V2-R05: quiescent backup, exclusive copy, hash verify, isolated restore, tamper refusal', () => {
    const dbPath = join(root, 'backup-source.db');
    seedSavedSnapshot(dbPath);

    // Quiescent file copy: handles are closed; the copy is exclusive and hash-verified.
    const sourceHash = sha256File(dbPath);
    const backupPath = join(root, 'backup.db');
    copyFileSync(dbPath, backupPath, constants.COPYFILE_EXCL);
    assert.equal(sha256File(backupPath), sourceHash);

    // Exclusive new-path restore into an isolated location.
    const restorePath = join(root, 'restore-target.db');
    copyFileSync(backupPath, restorePath, constants.COPYFILE_EXCL);
    const collision = () => copyFileSync(backupPath, restorePath, constants.COPYFILE_EXCL);
    assert.throws(collision);

    // The restore verifies: integrity, foreign keys, migration checksums, logical equality.
    const backup = openDatabase(backupPath);
    ensureMigrations(backup, GATE3_MIGRATIONS);
    const integrity = backup.prepare('PRAGMA integrity_check').all() as unknown as Array<Record<string, string>>;
    assert.ok(integrity.every((row) => Object.values(row)[0] === 'ok'));
    const fkViolations = backup.prepare('PRAGMA foreign_key_check').all();
    assert.equal(fkViolations.length, 0);
    const backupDigest = logicalDigest(backup);
    closeDatabase();

    const restored = openDatabase(restorePath);
    ensureMigrations(restored, GATE3_MIGRATIONS);
    assert.equal(logicalDigest(restored), backupDigest, 'the isolated restore preserves exact history');

    // The holdings resolution boundary fails closed on the restored copy:
    // with both binding and membership revoked there is no ACTIVE binding.
    revokeHoldingsBinding(restored);
    assert.throws(() => resolveActiveHoldingsBinding(restored), BindingAbsentError);
    closeDatabase();

    // Migration-ledger checksum mismatch refuses startup/read, fail closed.
    const tamperedLedgerPath = join(root, 'tampered-ledger.db');
    copyFileSync(backupPath, tamperedLedgerPath, constants.COPYFILE_EXCL);
    const tampered = openDatabase(tamperedLedgerPath);
    tampered.prepare("UPDATE _migration_ledger SET checksum = ? WHERE migration_id = '001_initial_schema'").run('0'.repeat(64));
    closeDatabase();
    const verify = openDatabase(tamperedLedgerPath);
    assert.throws(() => ensureMigrations(verify, GATE3_MIGRATIONS), MigrationIntegrityError);
    closeDatabase();

    // Truncated/corrupt copy refuses to open cleanly; no silent repair.
    const truncatedPath = join(root, 'truncated.db');
    const original = readFileSync(backupPath);
    writeFileSync(truncatedPath, original.subarray(0, 64));
    let failed = false;
    try {
      const broken = openDatabase(truncatedPath);
      try {
        ensureMigrations(broken, GATE3_MIGRATIONS);
        const rows = broken.prepare('PRAGMA integrity_check').all() as unknown as Array<Record<string, string>>;
        failed = rows.every((row) => Object.values(row)[0] !== 'ok');
      } finally {
        closeDatabase();
      }
    } catch {
      failed = true;
    }
    assert.equal(failed, true, 'a truncated database must fail closed, never open silently');
  });

  it('V2-R06: UNKNOWN reconciliation requires writer settlement and exact ledger/revision/provenance correspondence', () => {
    // c. Settlement failure also applies when the committed state is ABSENT
    //    (own database; the process keeps one open connection per path).
    const dbEmpty = freshDb('recon-unsettled-absent.db');
    seedHoldingsBinding(dbEmpty);
    const emptyStore = new DurablePortfolioStore(dbEmpty);
    const emptyCreated = emptyStore.createEmptySnapshot(OWNER, {});
    const unsettledAbsent = {
      proveSettledForReconciliation(): never {
        throw new Error('busy store');
      },
      contributionsValidated(): never {
        throw new Error('must not be reached');
      },
      revisions(): never {
        throw new Error('must not be reached');
      },
    };
    assert.equal(reconcileSnapshotV2ByRead(unsettledAbsent, OWNER, emptyCreated.portfolioId, 'a'.repeat(64), 2), 'UNRESOLVED');
    // d. and absent+settled with no successor supplied -> ledger-only NOT_COMMITTED.
    assert.equal(reconcileSnapshotV2ByRead(emptyStore, OWNER, emptyCreated.portfolioId, 'a'.repeat(64)), 'NOT_COMMITTED');
    closeDatabase();

    const db = freshDb('recon-settlement.db');
    seedHoldingsBinding(db);
    const setup = new DurablePortfolioStore(db);
    const created = setup.createEmptySnapshot(OWNER, {});

    // Commit under a fault that loses the acknowledgement after COMMIT -> UNKNOWN.
    const afterCommitFault = new DurablePortfolioStore(db, {
      afterCommit() {
        throw new Error('injected post-commit fault');
      },
    });
    const unknown = persistHoldingsSnapshotV2(
      afterCommitFault,
      OWNER,
      snapshotRequest({ portfolioId: created.portfolioId }),
      resolvedResolver,
    );
    assert.equal(unknown.ok, 'unknown');

    // a. Settled, exact correspondence -> COMMITTED; reconciliation performs ZERO writes.
    const before = domainCounts(db);
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'COMMITTED');
    assert.deepEqual(domainCounts(db), before);

    // b. Settlement probe failure -> UNRESOLVED (never NOT_COMMITTED, never a retry ticket).
    const unsettled = {
      proveSettledForReconciliation(): never {
        throw new Error('a writer may still hold the lock');
      },
      contributionsValidated(): never {
        throw new Error('must not be reached when settlement is unproven');
      },
      revisions(): never {
        throw new Error('must not be reached when settlement is unproven');
      },
    };
    assert.equal(reconcileSnapshotV2ByRead(unsettled, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'UNRESOLVED');

    // e. Two consistent passes are required: a verdict change between them -> UNRESOLVED.
    const matchRow = {
      contributionId: 'a'.repeat(64),
      amount: 1500,
      contributedAt: NOW,
      createdAt: NOW,
      fileName: 'fixture-2026-11-06.csv',
      sourceBroker: 'broker-a',
      contentDigest: 'a'.repeat(64),
      lineageDigest: 'c'.repeat(64),
      importedAt: NOW,
      semantics: 'MERGED_INTO_EXISTING' as const,
    };
    const successorRow = {
      revision: 2,
      operation: 'MERGE' as const,
      committedAt: NOW,
      totalMarketValue: 1500,
      provenanceDigest: 'c'.repeat(64),
      holdingsCount: 2,
    };
    let pass = 0;
    const flickering = {
      proveSettledForReconciliation(): void {},
      contributionsValidated() {
        pass += 1;
        return pass % 2 === 1 ? [matchRow] : [];
      },
      revisions() {
        return [successorRow];
      },
    };
    assert.equal(reconcileSnapshotV2ByRead(flickering, OWNER, 'p', 'a'.repeat(64), 2), 'UNRESOLVED');

    // f. Successor present but EMPTY snapshot (holdingsCount 0) -> UNRESOLVED, never COMMITTED.
    const emptySnapshot = {
      proveSettledForReconciliation(): void {},
      contributionsValidated: () => [matchRow],
      revisions: () => [{ ...successorRow, holdingsCount: 0, totalMarketValue: 0 }],
    };
    assert.equal(reconcileSnapshotV2ByRead(emptySnapshot, OWNER, 'p', 'a'.repeat(64), 2), 'UNRESOLVED');

    // g. Successor present with a non-MERGE operation -> UNRESOLVED.
    const wrongOperation = {
      proveSettledForReconciliation(): void {},
      contributionsValidated: () => [matchRow],
      revisions: () => [{ ...successorRow, operation: 'INITIAL' as const }],
    };
    assert.equal(reconcileSnapshotV2ByRead(wrongOperation, OWNER, 'p', 'a'.repeat(64), 2), 'UNRESOLVED');

    // h. Revision/history present but provenance malformed -> UNRESOLVED.
    const weakRevision = {
      proveSettledForReconciliation(): void {},
      contributionsValidated: () => [matchRow],
      revisions: () => [{ ...successorRow, provenanceDigest: 'nope' }],
    };
    assert.equal(reconcileSnapshotV2ByRead(weakRevision, OWNER, 'p', 'a'.repeat(64), 2), 'UNRESOLVED');

    // i. Contribution row identity match with LEGACY/NULL provenance -> UNRESOLVED against a real store.
    db.prepare('UPDATE portfolio_contributions SET lineage_digest = NULL WHERE contribution_id = ?').run('a'.repeat(64));
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 2), 'UNRESOLVED');

    // j. Malformed inputs never yield a verdict of convenience.
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'zz'.repeat(32), 2), 'UNRESOLVED');
    assert.equal(reconcileSnapshotV2ByRead(setup, OWNER, created.portfolioId, 'a'.repeat(64), 1), 'UNRESOLVED');

    // k. Reconciliation still performed ZERO writes after every probe above.
    assert.deepEqual(domainCounts(db), before);
    closeDatabase();
  });
});
