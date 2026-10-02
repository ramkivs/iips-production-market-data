/**
 * NP-04 — Common Governed Persistence: executable contract validation.
 *
 * Every test here is a REQUIREMENT, not a description. The seventeen mandated scenarios plus the
 * migration and frozen-engine guards are asserted directly against a real on-disk governed
 * database. There are no mocks and no in-memory substitute for a durable path.
 *
 * Ownership is always supplied by the authenticated principal argument, never by the payload.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { openDatabase, type GovernedDatabase } from '../src/persistence/db.js';
import { inspectLedger, MIGRATIONS, runMigrations } from '../src/persistence/schema.js';
import { GovernedArtifactStore, type ArtifactContent } from '../src/persistence/store.js';
import { canonicalizeReportKey, deriveReportKey } from '../src/persistence/reportKey.js';
import { mintReportId, type AuthenticatedOwner } from '../src/persistence/identity.js';
import {
  PersistenceError,
  PersistenceImmutableError,
  PersistenceNotFoundError,
  PersistenceOwnershipError,
  PersistenceSchemaError,
  PersistenceSupersessionError,
  PersistenceTransactionError,
  PersistenceValidationError,
} from '../src/persistence/errors.js';

const ALICE: AuthenticatedOwner = { tenantId: 'tenant-1', userId: 'user-alice' };
const BOB: AuthenticatedOwner = { tenantId: 'tenant-1', userId: 'user-bob' };
const CAROL: AuthenticatedOwner = { tenantId: 'tenant-2', userId: 'user-alice' };

let root: string;
let db: GovernedDatabase;
let store: GovernedArtifactStore;

function dbPath(name: string): string {
  return join(root, name, 'governed.db');
}

function open(name: string): GovernedDatabase {
  return openDatabase({ path: dbPath(name) });
}

function content(overrides: Partial<ArtifactContent> = {}): ArtifactContent {
  return {
    reportType: 'performance-attribution',
    portfolioId: 'PF-0001',
    scenario: 'base',
    parameters: { horizon: '1Y', currency: 'USD' },
    canonicalPayload: JSON.stringify({ rows: [{ symbol: 'AAA', return: 0.11 }] }),
    provenance: { engine: 'frozen-csip-reporting-engine', runId: 'run-1' },
    ...overrides,
  };
}

before(() => {
  root = mkdtempSync(join(tmpdir(), 'np04-'));
  db = open('primary');
  store = new GovernedArtifactStore(db);
});

after(() => {
  try {
    if (db.handle.isOpen) db.close();
  } catch {
    /* best effort */
  }
  rmSync(root, { recursive: true, force: true });
});

describe('NP-04 common governed persistence', () => {
  // ---------------------------------------------------------------------------------------------
  it('scenario 1 — creation returns a complete, governed first version', () => {
    const created = store.createInstance(ALICE, content());

    assert.ok(created.reportId.length > 0, 'a durable instance id is assigned');
    assert.equal(created.chainId, created.reportId, 'a new chain is rooted at its own instance id');
    assert.equal(created.artifactVersion, 1, 'the first artifact version is 1');
    assert.equal(created.supersedesReportId, null, 'the first version supersedes nothing');
    assert.equal(created.tenantId, ALICE.tenantId);
    assert.equal(created.userId, ALICE.userId);
    assert.equal(created.schemaVersion, 1);
    assert.ok(created.reportKey.length > 0, 'a content key is derived');
    assert.ok(Date.parse(created.generatedAt) > 0, 'generatedAt is an ISO-8601 instant');
  });

  it('scenario 2 — a created artifact is validly persisted and retrievable', () => {
    const created = store.createInstance(ALICE, content());
    const resolved = store.resolveById(ALICE, created.reportId);

    assert.deepEqual(resolved, created, 'the resolved artifact is byte-for-byte the created artifact');
    assert.equal(resolved.canonicalPayload, created.canonicalPayload);
    assert.deepEqual(resolved.provenance, created.provenance);
  });

  it('scenario 3 — reportId is globally unique and independent of canonical content', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const created = store.createInstance(ALICE, content());
      ids.add(created.reportId);
      // The content is identical on every iteration, so the content key is identical too.
      assert.equal(
        created.reportKey,
        deriveReportKey({
          reportType: content().reportType,
          portfolioId: content().portfolioId,
          scenario: content().scenario ?? null,
          parameters: content().parameters ?? null,
        }),
        'reportKey is content-derived and therefore stable',
      );
    }
    assert.equal(ids.size, 200, '200 identical-content creations yielded 200 distinct reportIds');
  });

  it('scenario 4 — identical canonical content produces separate durable instances', () => {
    const first = store.createInstance(ALICE, content());
    const second = store.createInstance(ALICE, content());

    assert.notEqual(first.reportId, second.reportId, 'instance identity is independent of content');
    assert.equal(first.reportKey, second.reportKey, 'content identity is shared');
    assert.equal(first.artifactVersion, 1);
    assert.equal(second.artifactVersion, 1, 'the second instance is NOT treated as a version of the first');
    assert.equal(second.supersedesReportId, null, 'the second instance starts a fresh, unrelated chain');

    // Both remain independently addressable and independently supersedable.
    const v2 = store.appendVersion(ALICE, first.reportId, content({ scenario: 'stressed' }));
    assert.equal(v2.artifactVersion, 2);
    assert.equal(store.resolveById(ALICE, second.reportId).artifactVersion, 1, 'the sibling instance is untouched');
  });

  it('scenario 5 — reportKey is deterministic across member ordering and representation', () => {
    const a = deriveReportKey({
      reportType: 'performance-attribution',
      portfolioId: 'PF-0001',
      scenario: 'base',
      parameters: { horizon: '1Y', currency: 'USD' },
    });
    const b = deriveReportKey({
      reportType: 'performance-attribution',
      portfolioId: 'PF-0001',
      scenario: 'base',
      parameters: { currency: 'USD', horizon: '1Y' },
    });
    assert.equal(a, b, 'parameter order does not affect content identity');
    assert.equal(a, a.toLowerCase(), 'the key is lowercase hex sha256');
    assert.equal(a.length, 64);

    assert.notEqual(
      a,
      deriveReportKey({
        reportType: 'performance-attribution',
        portfolioId: 'PF-0001',
        scenario: 'stressed',
        parameters: { currency: 'USD', horizon: '1Y' },
      }),
      'a different scenario is different content',
    );

    // An absent optional is canonicalised as explicit null, so it collides with an explicit null.
    assert.equal(
      deriveReportKey({ reportType: 'r', portfolioId: 'p' }),
      deriveReportKey({ reportType: 'r', portfolioId: 'p', scenario: null, parameters: null }),
    );
    assert.equal(
      deriveReportKey({ reportType: 'r', portfolioId: 'p', parameters: {} }),
      deriveReportKey({ reportType: 'r', portfolioId: 'p', parameters: null }),
      'an empty parameter set and an absent parameter set are the same content',
    );
  });

  it('scenario 5b — canonicalization is exact and does not fold case or normalise Unicode', () => {
    assert.equal(
      canonicalizeReportKey({ reportType: 'r', portfolioId: 'p', scenario: 'b', parameters: { b: 2, A: 1 } }),
      '{"reportType":"r","portfolioId":"p","scenario":"b","parameters":{"A":1,"b":2}}',
      'parameters sort by code point and the top-level order is fixed',
    );
    assert.notEqual(
      deriveReportKey({ reportType: 'R', portfolioId: 'p' }),
      deriveReportKey({ reportType: 'r', portfolioId: 'p' }),
      'no case folding',
    );
    assert.notEqual(
      deriveReportKey({ reportType: 'r', portfolioId: 'p', scenario: 'caf\u00e9' }),
      deriveReportKey({ reportType: 'r', portfolioId: 'p', scenario: 'cafe\u0301' }),
      'no Unicode normalisation: composed and decomposed forms are distinct content',
    );
    assert.equal(
      deriveReportKey({ reportType: 'r', portfolioId: 'p', scenario: 'caf\u00e9' }),
      createHash('sha256')
        .update('{"reportType":"r","portfolioId":"p","scenario":"caf\u00e9","parameters":null}', 'utf8')
        .digest('hex'),
      'the input is hashed exactly as given, with no normalisation applied on the way in',
    );
    assert.equal(
      canonicalizeReportKey({ reportType: 'r', portfolioId: 'p', parameters: { n: 1.5, z: 0, big: 1e21 } }),
      '{"reportType":"r","portfolioId":"p","scenario":null,"parameters":{"big":1e+21,"n":1.5,"z":0}}',
      'numbers use the shortest round-trip decimal representation',
    );
    assert.throws(
      () => deriveReportKey({ reportType: 'r', portfolioId: 'p', parameters: { nested: { a: 1 } as never } }),
      PersistenceValidationError,
      'nested values are rejected rather than silently flattened',
    );
  });

  it('scenario 6 — artifactVersion increments monotonically and append-only', () => {
    const rootArtifact = store.createInstance(ALICE, content({ reportType: 'risk', portfolioId: 'PF-RISK' }));
    assert.equal(rootArtifact.artifactVersion, 1);

    const versions = [rootArtifact];
    for (let i = 2; i <= 6; i += 1) {
      const next = store.appendVersion(ALICE, versions[i - 2]!.reportId, content({
        reportType: 'risk',
        portfolioId: 'PF-RISK',
        scenario: `run-${i}`,
      }));
      assert.equal(next.artifactVersion, i, 'the version increments by exactly one');
      assert.equal(next.chainId, rootArtifact.chainId, 'the chain identity is stable across versions');
      assert.equal(next.supersedesReportId, versions[i - 2]!.reportId);
      versions.push(next);
    }
    assert.equal(versions.length, 6);
  });

  it('scenario 7 — prior artifacts are immutable and every prior version remains readable', () => {
    const v1 = store.createInstance(ALICE, content({ reportType: 'holdings', portfolioId: 'PF-H' }));
    const snapshot = JSON.parse(JSON.stringify(v1));

    const v2 = store.appendVersion(ALICE, v1.reportId, content({ reportType: 'holdings', portfolioId: 'PF-H', scenario: 'q2' }));
    const v3 = store.appendVersion(ALICE, v2.reportId, content({ reportType: 'holdings', portfolioId: 'PF-H', scenario: 'q3' }));

    assert.deepEqual(store.resolveById(ALICE, v1.reportId), snapshot, 'the original object was not mutated');
    assert.equal(store.resolveById(ALICE, v1.reportId).canonicalPayload, v1.canonicalPayload);
    assert.equal(store.resolveById(ALICE, v1.reportId).supersedesReportId, null, 'v1 remains a root');
    assert.equal(v3.artifactVersion, 3);

    // Append-only is enforced at the storage layer, not merely by API convention.
    const raw = new DatabaseSync(dbPath('primary'));
    try {
      assert.throws(
        () => raw.prepare('UPDATE governed_artifacts SET canonical_payload = ? WHERE report_id = ?').run('tampered', v1.reportId),
        /append-only/,
        'a direct UPDATE is rejected by the database',
      );
      assert.throws(
        () => raw.prepare('DELETE FROM governed_artifacts WHERE report_id = ?').run(v1.reportId),
        /append-only/,
        'a direct DELETE is rejected by the database',
      );
      assert.throws(
        () => raw.prepare('UPDATE governed_artifacts SET user_id = ? WHERE report_id = ?').run('user-mallory', v1.reportId),
        /append-only/,
        'ownership is immutable too',
      );
    } finally {
      raw.close();
    }
  });

  it('scenario 8 — supersession is single-parent and only the current head may be superseded', () => {
    const v1 = store.createInstance(ALICE, content({ reportType: 'esg', portfolioId: 'PF-E' }));
    const v2 = store.appendVersion(ALICE, v1.reportId, content({ reportType: 'esg', portfolioId: 'PF-E', scenario: 'b' }));
    const v3 = store.appendVersion(ALICE, v2.reportId, content({ reportType: 'esg', portfolioId: 'PF-E', scenario: 'c' }));

    assert.throws(
      () => store.appendVersion(ALICE, v1.reportId, content({ reportType: 'esg', portfolioId: 'PF-E', scenario: 'fork' })),
      PersistenceSupersessionError,
      'v1 is no longer the head and cannot be superseded again',
    );
    assert.throws(
      () => store.appendVersion(ALICE, v1.reportId, content({ reportType: 'esg', portfolioId: 'PF-E', scenario: 'fork2' })),
      (error: unknown) => {
        assert.ok(error instanceof PersistenceSupersessionError);
        assert.equal((error as PersistenceSupersessionError).code, 'SUPERSESSION_CONFLICT');
        return true;
      },
    );

    // Only one child exists in the chain.
    const { current, versions } = store.listSupersededBy(ALICE, v3.reportId);
    assert.equal(current.reportId, v3.reportId, 'the current version is the chain head');
    assert.deepEqual(versions.map((v) => v.artifactVersion), [2, 1], 'the walk returns every superseded predecessor');
    assert.equal(versions[0]!.reportId, v2.reportId);
    assert.equal(versions[1]!.reportId, v1.reportId);

    const raw = new DatabaseSync(dbPath('primary'));
    try {
      const forks = raw.prepare('SELECT COUNT(*) AS n FROM governed_artifacts WHERE supersedes_report_id = ?').get(v2.reportId);
      assert.equal(Number(forks!.n), 1, 'exactly one artifact supersedes v2');
    } finally {
      raw.close();
    }
  });

  it('scenario 9 — ownership is scoped: a principal cannot read, list, or supersede another principal\'s artifact', () => {
    const aliceArtifact = store.createInstance(ALICE, content({ reportType: 'tax', portfolioId: 'PF-T' }));

    for (const other of [BOB, CAROL]) {
      assert.throws(
        () => store.resolveById(other, aliceArtifact.reportId),
        PersistenceNotFoundError,
        'a cross-owner resolve is reported as not-found, never as an ownership error',
      );
      assert.throws(
        () => store.appendVersion(other, aliceArtifact.reportId, content()),
        PersistenceNotFoundError,
        'a cross-owner append is refused',
      );
      assert.throws(
        () => store.listSupersededBy(other, aliceArtifact.reportId),
        PersistenceNotFoundError,
        'a cross-owner history walk is refused',
      );
    }

    const aliceList = store.queryByOwner(ALICE);
    assert.ok(
      aliceList.items.every((i) => i.tenantId === ALICE.tenantId && i.userId === ALICE.userId),
      'queryByOwner never widens beyond the authenticated principal',
    );
    const bobList = store.queryByOwner(BOB);
    assert.equal(
      bobList.items.filter((i) => i.reportId === aliceArtifact.reportId).length,
      0,
      "the other principal's artifact is not listed",
    );
  });

  it('scenario 9b — ownership is taken only from the authenticated principal and cannot be forged', () => {
    const created = store.createInstance(ALICE, content({
      reportType: 'forgery',
      portfolioId: 'PF-F',
      // A payload that attempts to claim a different owner is stored as content, not as ownership.
      provenance: { tenantId: 'tenant-9', userId: 'user-mallory' },
    }));
    assert.equal(created.tenantId, ALICE.tenantId, 'ownership comes from the principal, not the payload');
    assert.equal(created.userId, ALICE.userId);
    assert.throws(
      () => store.resolveById({ tenantId: ALICE.tenantId }, created.reportId),
      PersistenceOwnershipError,
      'a partial ownership pair is rejected',
    );
    assert.throws(
      () => store.createInstance({ tenantId: '', userId: 'u' }, content()),
      PersistenceOwnershipError,
    );
    assert.throws(
      () => store.createInstance({ tenantId: 't', userId: '' }, content()),
      PersistenceOwnershipError,
    );
    assert.throws(
      () => store.createInstance(null, content()),
      PersistenceOwnershipError,
    );

    // Ownership is exactly (tenantId, userId). A principal context may carry other members; none of
    // them participate in scoping, and none of them can widen access.
    const withExtras = { tenantId: ALICE.tenantId, userId: ALICE.userId, companyId: 'company-X', roles: ['admin'] };
    const resolvedWithExtras = store.resolveById(withExtras, created.reportId);
    assert.deepEqual(resolvedWithExtras, created, 'extra principal members do not change ownership resolution');
    assert.equal(resolvedWithExtras.tenantId, ALICE.tenantId);
    assert.equal(resolvedWithExtras.userId, ALICE.userId);
    assert.equal(
      store.queryByOwner(withExtras, { limit: 500 }).items.filter((i) => i.reportId === created.reportId).length,
      1,
      'queryByOwner scopes on (tenantId, userId) alone',
    );
    assert.deepEqual(
      store.resolveById({ ...withExtras, companyId: 'company-Y' }, created.reportId),
      created,
      'companyId is not part of ownership at all: changing it neither grants nor denies access',
    );
    assert.throws(
      () => store.resolveById({ ...withExtras, userId: 'user-mallory' }, created.reportId),
      PersistenceNotFoundError,
      'changing the ownership pair does deny access',
    );
  });

  it('scenario 10 — artifacts survive a process restart on the same durable path', () => {
    const durable = open('restart');
    const durableStore = new GovernedArtifactStore(durable);
    const before = durableStore.createInstance(ALICE, content({ reportType: 'durable', portfolioId: 'PF-D' }));
    const beforeV2 = durableStore.appendVersion(ALICE, before.reportId, content({
      reportType: 'durable',
      portfolioId: 'PF-D',
      scenario: 'after-restart',
    }));
    const beforeHistory = durableStore.listSupersededBy(ALICE, beforeV2.reportId);
    durable.close();

    assert.ok(existsSync(dbPath('restart')), 'the database file exists on disk');

    const reopened = open('restart');
    try {
      const reopenedStore = new GovernedArtifactStore(reopened);
      assert.equal(reopened.migrationsApplied, 0, 'a restart applies no duplicate migration');
      const afterV2 = reopenedStore.resolveById(ALICE, beforeV2.reportId);
      assert.deepEqual(afterV2, beforeV2, 'the stored artifact is identical after restart');
      assert.deepEqual(
        reopenedStore.listSupersededBy(ALICE, beforeV2.reportId),
        beforeHistory,
        'the supersession chain is intact after restart',
      );
      assert.equal(reopenedStore.appendVersion(ALICE, beforeV2.reportId, content({ reportType: 'durable', portfolioId: 'PF-D' })).artifactVersion, 3);
    } finally {
      reopened.close();
    }
  });

  it('scenario 11 — a failed transaction leaves no partial artifact', () => {
    const before = db.handle.prepare('SELECT COUNT(*) AS n FROM governed_artifacts').get() as { n: number };

    const exploding = new GovernedArtifactStore(db, {
      afterInsert: (reportId) => {
        throw new Error(`simulated failure immediately after writing ${reportId}`);
      },
    });

    assert.throws(
      () => exploding.createInstance(ALICE, content({ reportType: 'rollback', portfolioId: 'PF-RB' })),
      PersistenceTransactionError,
      'the failure is surfaced as a transaction error',
    );

    const after = db.handle.prepare('SELECT COUNT(*) AS n FROM governed_artifacts').get() as { n: number };
    assert.equal(Number(after.n), Number(before.n), 'the rolled-back insert left no row behind');

    // The store remains fully usable, and the next artifact is version 1 of its own chain.
    const recovered = store.createInstance(ALICE, content({ reportType: 'rollback', portfolioId: 'PF-RB' }));
    assert.equal(recovered.artifactVersion, 1);
  });

  it('scenario 12 — concurrent/colliding creation cannot mint a duplicate instance id', () => {
    const ids = new Set<string>();
    const errors: unknown[] = [];
    for (let i = 0; i < 64; i += 1) {
      try {
        ids.add(store.createInstance(ALICE, content({ reportType: 'concurrent', portfolioId: 'PF-C' })).reportId);
      } catch (error) {
        errors.push(error);
      }
    }
    assert.equal(errors.length, 0, 'no creation failed under repeated concurrent-style load');
    assert.equal(ids.size, 64, 'every concurrent creation produced a distinct reportId');
    assert.equal(
      store.queryByOwner(ALICE, { limit: 500 }).items.filter((i) => i.reportType === 'concurrent').length,
      64,
      'all 64 colliding-content instances are independently addressable',
    );
  });

  it('scenario 12b — a duplicate instance id is rejected by the storage layer', () => {
    const raw = new DatabaseSync(dbPath('primary'));
    try {
      const victim = store.createInstance(ALICE, content({ reportType: 'dup', portfolioId: 'PF-DU' }));
      assert.throws(
        () => raw
          .prepare(
            `INSERT INTO governed_artifacts
               (report_id, chain_id, tenant_id, user_id, report_key, report_type, portfolio_id, scenario,
                parameters_json, schema_version, artifact_version, supersedes_report_id, generated_at,
                canonical_payload, provenance_json, created_at)
             SELECT report_id, chain_id, tenant_id, user_id, report_key, report_type, portfolio_id, scenario,
                    parameters_json, schema_version, artifact_version, supersedes_report_id, generated_at,
                    canonical_payload, provenance_json, created_at
               FROM governed_artifacts WHERE report_id = ?`,
          )
          .run(victim.reportId),
        /UNIQUE|PRIMARY KEY/i,
        'reportId uniqueness is enforced by the primary key, not only by the API',
      );

      // A forged version-2 row in the same chain must be refused by the chain/version unique index.
      store.appendVersion(ALICE, victim.reportId, content({ reportType: 'dup', portfolioId: 'PF-DU', scenario: 'b' }));
      assert.throws(
        () => raw
          .prepare(
            `INSERT INTO governed_artifacts
               (report_id, chain_id, tenant_id, user_id, report_key, report_type, portfolio_id, scenario,
                parameters_json, schema_version, artifact_version, supersedes_report_id, generated_at,
                canonical_payload, provenance_json, created_at)
             VALUES (?, ?, ?, ?, ?, 'dup', 'PF-DU', NULL, 'null', 1, 2, ?, ?, '{}', '{}', ?)`,
          )
          .run(
            mintReportId(),
            victim.chainId,
            ALICE.tenantId,
            ALICE.userId,
            'k',
            victim.reportId,
            new Date().toISOString(),
            new Date().toISOString(),
          ),
        /UNIQUE constraint failed: governed_artifacts\.chain_id, governed_artifacts\.artifact_version/i,
        'a version number cannot be reused within an instance chain',
      );

      // A forged second child of the same parent must be refused by the single-parent index.
      assert.throws(
        () => raw
          .prepare(
            `INSERT INTO governed_artifacts
               (report_id, chain_id, tenant_id, user_id, report_key, report_type, portfolio_id, scenario,
                parameters_json, schema_version, artifact_version, supersedes_report_id, generated_at,
                canonical_payload, provenance_json, created_at)
             VALUES (?, ?, ?, ?, ?, 'dup', 'PF-DU', NULL, 'null', 1, 3, ?, ?, '{}', '{}', ?)`,
          )
          .run(
            mintReportId(),
            victim.chainId,
            ALICE.tenantId,
            ALICE.userId,
            'k',
            victim.reportId,
            new Date().toISOString(),
            new Date().toISOString(),
          ),
        /UNIQUE constraint failed: governed_artifacts\.supersedes_report_id/i,
        'supersession is single-parent at the storage layer',
      );
    } finally {
      raw.close();
    }
  });

  it('scenario 13 — invalid input is rejected before anything is written', () => {
    const before = db.handle.prepare('SELECT COUNT(*) AS n FROM governed_artifacts').get() as { n: number };
    const cases: Array<[string, () => unknown]> = [
      ['empty reportType', () => store.createInstance(ALICE, content({ reportType: '' }))],
      ['empty portfolioId', () => store.createInstance(ALICE, content({ portfolioId: '' }))],
      ['empty scenario', () => store.createInstance(ALICE, content({ scenario: '' }))],
      ['non-string canonicalPayload', () => store.createInstance(ALICE, content({ canonicalPayload: 42 as never }))],
      ['non-finite parameter', () => store.createInstance(ALICE, content({ parameters: { x: Number.NaN } }))],
      ['nested parameter', () => store.createInstance(ALICE, content({ parameters: { x: { y: 1 } as never } }))],
      ['unparseable generatedAt', () => store.createInstance(ALICE, content({ generatedAt: 'not-a-timestamp' }))],
      ['empty supersedesReportId', () => store.appendVersion(ALICE, '', content())],
      ['empty resolveById', () => store.resolveById(ALICE, '')],
      ['non-positive limit', () => store.queryByOwner(ALICE, { limit: 0 })],
    ];
    for (const [label, run] of cases) {
      assert.throws(run, PersistenceValidationError, `rejected: ${label}`);
    }
    assert.throws(
      () => store.appendVersion(ALICE, '00000000-0000-4000-8000-000000000000', content()),
      PersistenceNotFoundError,
      'superseding a non-existent artifact is not-found',
    );
    const after = db.handle.prepare('SELECT COUNT(*) AS n FROM governed_artifacts').get() as { n: number };
    assert.equal(Number(after.n), Number(before.n), 'no invalid input produced a row');
  });

  it('scenario 14 — migrations are deterministic, idempotent, and fail closed', () => {
    assert.equal(MIGRATIONS.length, 1);
    assert.equal(MIGRATIONS[0]!.ordinal, 1);
    assert.equal(MIGRATIONS[0]!.name, 'governed_persistence_baseline');

    const fresh = open('migrations');
    try {
      assert.equal(fresh.migrationsApplied, 1, 'a fresh database applies the baseline exactly once');
      const ledger = inspectLedger(fresh.handle);
      assert.equal(ledger.length, 1);
      assert.equal(ledger[0]!.checksum, createHash('sha256').update(MIGRATIONS[0]!.sql, 'utf8').digest('hex'));
      assert.equal(
        runMigrations(fresh.handle),
        0,
        're-running migrations on an up-to-date database is a no-op',
      );
    } finally {
      fresh.close();
    }

    // Fail closed on checksum drift.
    const drift = open('drift');
    drift.close();
    const driftRaw = new DatabaseSync(dbPath('drift'));
    try {
      driftRaw.prepare('UPDATE schema_migrations SET checksum = ? WHERE ordinal = 1').run('0'.repeat(64));
      assert.throws(
        () => openDatabase({ path: dbPath('drift') }),
        PersistenceSchemaError,
        'schema drift aborts startup rather than proceeding against an unverified schema',
      );
    } finally {
      driftRaw.close();
    }

    // Fail closed on an unknown applied ordinal.
    const unknown = open('unknown');
    unknown.close();
    const unknownRaw = new DatabaseSync(dbPath('unknown'));
    try {
      unknownRaw
        .prepare('INSERT INTO schema_migrations (ordinal, name, checksum, applied_at) VALUES (99, ?, ?, ?)')
        .run('rogue', '0'.repeat(64), new Date().toISOString());
      assert.throws(() => openDatabase({ path: dbPath('unknown') }), PersistenceSchemaError);
    } finally {
      unknownRaw.close();
    }

    // A relative path is refused rather than resolved against a working directory.
    assert.throws(() => openDatabase({ path: 'relative.db' }), PersistenceError);
  });

  it('scenario 15 — the frozen CSIP ReportingEngine is neither modified nor relied upon', () => {
    // The frozen engine lives in the integration repository, not here. This capability must not
    // import it, subclass it, or re-derive instance identity the way it does.
    const engine = 'iips-platform/src/sector-engines/cross-sector/reporting/ReportingEngine.ts';
    assert.ok(!existsSync(engine), 'no in-repo copy of the frozen engine exists in this package');

    const sources = readdirSync('src/persistence');
    assert.ok(sources.includes('store.ts') && sources.includes('identity.ts'), 'the capability is present');
    for (const file of sources) {
      const text = readFileSync(join('src/persistence', file), 'utf8');
      assert.ok(
        !/^\s*import\b[^\n]*ReportingEngine/m.test(text),
        `${file} does not import the frozen engine`,
      );
      assert.ok(
        !/^\s*(?:export|const|let|function|class)\b[^\n]*ReportingEngine/m.test(text),
        `${file} does not declare or re-export the frozen engine`,
      );
      assert.ok(
        !/require\s*\(\s*['"][^'"]*ReportingEngine/.test(text),
        `${file} does not require the frozen engine at runtime`,
      );
    }

    // The engine derives `report-${reportType}-${portfolioId}` from content. That form collides for
    // identical content, so it must never be used as a durable instance identity.
    const created = store.createInstance(ALICE, content());
    assert.notEqual(created.reportId, `report-${created.reportType}-${created.portfolioId}`);
    assert.equal(
      created.reportId.length,
      36,
      'the durable instance id is a minted UUID, not a content-derived string',
    );
  });

  it('scenario 16 — the exported surface is exactly the NP-04 capability', () => {
    const surface = readFileSync('src/persistence/index.ts', 'utf8');
    for (const required of [
      'openDatabase',
      'GovernedArtifactStore',
      'deriveReportKey',
      'mintReportId',
      'PersistenceValidationError',
    ]) {
      assert.ok(surface.includes(required), `${required} is exported`);
    }
    // Consumer-specific naming is prohibited: this is a common substrate, not a Reports store.
    assert.ok(!/Reports?Store|ReportsRepository/.test(surface), 'the substrate is not consumer-specific');
  });
});

describe('NP-04 durability characteristics', () => {
  it('durable writes are visible in the database file, not in process state', () => {
    const durable = open('file-proof');
    let journalMode: string;
    try {
      const s = new GovernedArtifactStore(durable);
      const a = s.createInstance(ALICE, content({ reportType: 'file-proof', portfolioId: 'PF-FP' }));
      s.appendVersion(ALICE, a.reportId, content({ reportType: 'file-proof', portfolioId: 'PF-FP' }));
      journalMode = String((durable.handle.prepare('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode);
      assert.ok(
        existsSync(`${durable.path}-wal`) || existsSync(`${durable.path}-shm`),
        'WAL sidecar files exist while the governed connection is open',
      );
    } finally {
      durable.close();
    }
    assert.equal(journalMode, 'wal', 'the governed connection runs in WAL mode');
    assert.equal(durable.handle.isOpen, false, 'close() actually released the handle');

    const file = dbPath('file-proof');
    assert.ok(statSync(file).size > 0, 'the database file has content and survives close');

    const raw = new DatabaseSync(file);
    try {
      const rows = raw
        .prepare('SELECT report_id, chain_id, artifact_version, report_key FROM governed_artifacts ORDER BY artifact_version ASC')
        .all();
      assert.equal(rows.length, 2);
      assert.equal(Number(rows[0]!.artifact_version), 1);
      assert.equal(Number(rows[1]!.artifact_version), 2);
      assert.equal(rows[0]!.chain_id, rows[1]!.chain_id, 'both versions belong to one instance chain');
      assert.equal(rows[0]!.report_key, rows[1]!.report_key, 'content identity is stable across versions');
      assert.notEqual(rows[0]!.report_id, rows[1]!.report_id, 'each version has its own durable id');
    } finally {
      raw.close();
    }
  });

  it('queryByOwner returns one current version per instance chain', () => {
    const durable = open('query');
    try {
      const s = new GovernedArtifactStore(durable);
      const a = s.createInstance(ALICE, content({ reportType: 'query', portfolioId: 'PF-Q' }));
      const v2 = s.appendVersion(ALICE, a.reportId, content({ reportType: 'query', portfolioId: 'PF-Q', scenario: 'b' }));
      s.appendVersion(ALICE, v2.reportId, content({ reportType: 'query', portfolioId: 'PF-Q', scenario: 'c' }));
      const b = s.createInstance(ALICE, content({ reportType: 'query', portfolioId: 'PF-Q2' }));

      const page = s.queryByOwner(ALICE);
      assert.equal(page.items.length, 2, 'two chains, three versions, two current entries');
      const current = page.items.find((i) => i.chainId === a.reportId);
      assert.equal(current?.artifactVersion, 3, 'the head of the three-version chain is returned');
      assert.ok(page.items.some((i) => i.reportId === b.reportId), 'the unrelated instance is also returned');
      assert.equal(page.nextCursor, null, 'a small result set reports no next cursor');

      const limited = s.queryByOwner(ALICE, { limit: 1 });
      assert.equal(limited.items.length, 1);
      assert.ok(limited.nextCursor !== null, 'a truncated result set reports a cursor');
    } finally {
      durable.close();
    }
  });

  it('the ledger and the migration SQL are byte-stable across databases', () => {
    const a = open('stable-a');
    const b = open('stable-b');
    try {
      const ledgerA = JSON.stringify(inspectLedger(a.handle).map((r) => ({ ...r, appliedAt: undefined })));
      const ledgerB = JSON.stringify(inspectLedger(b.handle).map((r) => ({ ...r, appliedAt: undefined })));
      assert.equal(ledgerA, ledgerB, 'two independent databases record an identical migration ledger');
      assert.equal(
        ledgerA,
        JSON.stringify([
          {
            ordinal: 1,
            name: 'governed_persistence_baseline',
            checksum: createHash('sha256').update(MIGRATIONS[0]!.sql, 'utf8').digest('hex'),
            appliedAt: undefined,
          },
        ]),
        'the ledger matches the declared migration exactly',
      );
    } finally {
      a.close();
      b.close();
    }
  });
});
