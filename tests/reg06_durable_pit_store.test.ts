/**
 * REG-06 admission — durable PIT market-data store (2026-11-01).
 *
 * Covers the technical prerequisites that REG-06 product admission required and
 * that the in-memory `PointInTimeStore` could not satisfy:
 *
 *   - durable writes surviving a process restart;
 *   - duplicate ingestion / idempotency;
 *   - invalid or ambiguous security-identity rejection (fail closed);
 *   - the same ISIN across different series with no cross-series fallback;
 *   - historical-date correctness and point-in-time retrieval;
 *   - persistence failure leaving no partial write.
 *
 * It also pins the isolation property that keeps the Gate A' chain intact: this
 * store owns its own migration ledger and never touches `GATE3_MIGRATIONS`.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { createCanonicalEnvelope, type CanonicalEnvelope } from '../src/contracts/envelope.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import {
  DurablePointInTimeStore,
  PitDurableStoreError,
  PitSnapshotConflictError,
  PIT_MARKET_DATA_MIGRATIONS,
} from '../src/pit/pit_durable_store.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import { PitReadService } from '../src/pit/pit_read_service.js';

const ISIN = 'INE123456789';
const EQ = buildD114SecurityIdentity(ISIN, 'EQ')!.securityId;
const BL = buildD114SecurityIdentity(ISIN, 'BL')!.securityId;

const T1 = '2026-01-05T00:00:00.000Z';
const T2 = '2026-03-10T00:00:00.000Z';
const T3 = '2026-06-20T00:00:00.000Z';

let workDir: string;

function dbPath(name: string): string {
  return join(workDir, `${name}.sqlite`);
}

interface FixtureOptions {
  companyId?: string;
  securityId?: string;
  asOf?: string;
  version?: string;
  domain?: CanonicalEnvelope<unknown>['domain'];
  payload?: unknown;
}

function fixture(options: FixtureOptions = {}): CanonicalEnvelope<unknown> {
  const asOf = options.asOf ?? T1;
  const version = options.version ?? 'v1';
  const envelope = createCanonicalEnvelope({
    envelopeId: `fixture-${version}`,
    domain: options.domain ?? 'D01_QUOTES',
    mode: 'PIT',
    companyId: options.companyId ?? 'SWANENERGY',
    ...(options.securityId !== undefined ? { securityId: options.securityId } : {}),
    payload: options.payload ?? { value: version },
    provenance: {
      sourceClassification: 'DERIVED',
      vendorTier: 'MOCK_FIXTURE',
      asOf,
      receivedAt: asOf,
      evaluatedAt: asOf,
      dataVersion: version,
      lineageHash: `lineage-${version}`,
      qualityState: 'GOOD',
    },
    timestamp: asOf,
  });
  return envelope as CanonicalEnvelope<unknown>;
}

before(() => {
  workDir = mkdtempSync(join(tmpdir(), 'iips-reg06-pit-'));
});

after(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('REG-06 durable PIT store — durability and restart recovery', () => {
  it('persists a write to the database file and survives a process restart', () => {
    const path = dbPath('restart');
    const first = new DurablePointInTimeStore<unknown>(path);
    first.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));
    first.append(fixture({ securityId: EQ, asOf: T2, version: 'b' }));
    assert.equal(first.getRecordCount(), 2);
    first.close();

    assert.ok(existsSync(path), 'the durable database file must exist after close');

    // A fresh instance over the same path simulates a restarted process: nothing
    // is carried in memory, so anything readable came from the file.
    const reopened = new DurablePointInTimeStore<unknown>(path);
    assert.equal(reopened.getRecordCount(), 2);

    const hit = reopened.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: EQ });
    assert.ok(hit, 'the snapshot must be readable after restart');
    assert.equal((hit.payload as { value: string }).value, 'b');
    assert.equal(hit.provenance.asOf, T2);
    reopened.close();
  });

  it('refuses a relative path and an empty path', () => {
    assert.throws(() => new DurablePointInTimeStore<unknown>('relative/path.sqlite'), PitDurableStoreError);
    assert.throws(() => new DurablePointInTimeStore<unknown>('   '), PitDurableStoreError);
  });

  it('keeps its own migration ledger and leaves GATE3_MIGRATIONS untouched', () => {
    const path = dbPath('ledger');
    const store = new DurablePointInTimeStore<unknown>(path);
    store.append(fixture({ securityId: EQ }));
    store.close();

    const db = new DatabaseSync(path);
    const rows = db
      .prepare('SELECT migration_id FROM _migration_ledger ORDER BY migration_id')
      .all() as unknown as Array<{ migration_id: string }>;
    db.close();

    const ids = rows.map((row) => row.migration_id);
    assert.deepEqual(ids, PIT_MARKET_DATA_MIGRATIONS.map((m) => m.id));

    // The Gate 3 / Gate A' migration set is frozen at 001-004 and check V-A2-1
    // requires exactly those four rows. This store must not have extended it.
    assert.equal(GATE3_MIGRATIONS.length, 4);
    assert.equal(GATE3_MIGRATIONS.some((m) => m.id.startsWith('pit')), false);
    assert.equal(ids.some((id) => id.startsWith('00')), false);
  });
});

describe('REG-06 durable PIT store — idempotency', () => {
  it('treats re-ingesting an identical snapshot as a duplicate, not a new vintage', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('idempotent'));
    const first = store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));
    const second = store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));

    assert.equal(first.status, 'APPENDED');
    assert.equal(second.status, 'DUPLICATE');
    assert.equal(first.snapshotDigest, second.snapshotDigest);
    assert.equal(store.getRecordCount(), 1, 'a duplicate must not create a second row');
    store.close();
  });

  it('rejects a differing snapshot at the same identity and instant as a conflict', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('conflict'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));

    assert.throws(
      () => store.append(fixture({ securityId: EQ, asOf: T1, version: 'DIFFERENT' })),
      PitSnapshotConflictError,
    );
    assert.equal(store.getRecordCount(), 1, 'the conflicting write must not have been stored');
    store.close();
  });

  it('still serves reads correctly after a duplicate and a conflict', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('conflict-reads'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));
    assert.throws(() => store.append(fixture({ securityId: EQ, asOf: T1, version: 'b' })));

    const hit = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: EQ });
    assert.equal((hit?.payload as { value: string }).value, 'a');
    store.close();
  });
});

describe('REG-06 durable PIT store — identity is required and never inferred', () => {
  it('rejects an envelope with no securityId rather than degrading to company-only', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('no-identity'));
    assert.throws(() => store.append(fixture({ asOf: T1 })), /series-qualified securityId/);
    assert.equal(store.getRecordCount(), 0);
    store.close();
  });

  const malformedIdentities: ReadonlyArray<readonly [string, string]> = [
    ['a bare ISIN', ISIN],
    ['a missing series', `ISIN:${ISIN}:`],
    ['too many segments', `ISIN:${ISIN}:EQ:BL`],
    ['a wrong-length ISIN', 'ISIN:INE123:EQ'],
    ['a non-ISIN prefix', `XXX:${ISIN}:EQ`],
  ];
  for (const [label, securityId] of malformedIdentities) {
    it(`rejects ${label}`, () => {
      const store = new DurablePointInTimeStore<unknown>(
        dbPath(`bad-${label.replace(/[^a-zA-Z0-9]/g, '')}`),
      );
      assert.throws(() => store.append(fixture({ securityId, asOf: T1 })), /ISIN:<isin>:<series>/);
      assert.equal(store.getRecordCount(), 0);
      store.close();
    });
  }

  it('rejects an unparseable asOf instant instead of rolling the date', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('bad-asof'));
    assert.throws(
      () => store.append(fixture({ securityId: EQ, asOf: '2026-02-30T00:00:00.000Z' })),
      /valid UTC instant/,
    );
    assert.throws(() => store.append(fixture({ securityId: EQ, asOf: 'not-a-date' })), /valid UTC instant/);
    assert.equal(store.getRecordCount(), 0);
    store.close();
  });

  it('rejects a payload identity that disagrees with the envelope identity', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('disagree'));
    const envelope = fixture({
      securityId: EQ,
      asOf: T1,
      payload: {
        value: 'x',
        securityIdentity: buildD114SecurityIdentity(ISIN, 'BL'),
      },
    });
    assert.throws(() => store.append(envelope), /identities conflict/);
    assert.equal(store.getRecordCount(), 0);
    store.close();
  });

  it('refuses an ambiguous legacy company/domain query when several series exist', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('ambiguous'));
    store.append(fixture({ securityId: EQ, asOf: T1 }));
    store.append(fixture({ securityId: BL, asOf: T1 }));

    assert.throws(
      () => store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3 }),
      /Ambiguous PIT identity/,
    );
    store.close();
  });
});

describe('REG-06 durable PIT store — series isolation with no cross-series fallback', () => {
  it('keeps two series of one ISIN separate and never substitutes one for the other', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('series'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'eq-1' }));
    store.append(fixture({ securityId: BL, asOf: T1, version: 'bl-1' }));

    const eq = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: EQ });
    const bl = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: BL });

    assert.equal((eq?.payload as { value: string }).value, 'eq-1');
    assert.equal((bl?.payload as { value: string }).value, 'bl-1');
    assert.notEqual(eq?.securityId, bl?.securityId);
    store.close();
  });

  it('returns nothing for an unadmitted series rather than falling back', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('no-fallback'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'eq-1' }));

    const absent = buildD114SecurityIdentity(ISIN, 'ZZ')!.securityId;
    const miss = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: absent });
    assert.equal(miss, undefined, 'an unadmitted series must not resolve to another series');
    store.close();
  });

  it('does not leak a record across domains', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('domain'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'q', domain: 'D01_QUOTES' }));
    const miss = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D02_OHLCV', asOf: T3, securityId: EQ });
    assert.equal(miss, undefined);
    store.close();
  });
});

describe('REG-06 durable PIT store — point-in-time correctness', () => {
  it('returns the newest vintage at or before asOf, and none before the first', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('pit'));
    store.append(fixture({ securityId: EQ, asOf: T2, version: 'second' }));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'first' }));
    store.append(fixture({ securityId: EQ, asOf: T3, version: 'third' }));

    const before = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2025-12-31T00:00:00.000Z', securityId: EQ });
    assert.equal(before, undefined, 'no snapshot may resolve before the first vintage');

    const atT1 = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T1, securityId: EQ });
    assert.equal((atT1?.payload as { value: string }).value, 'first');

    const between = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2026-05-01T00:00:00.000Z', securityId: EQ });
    assert.equal((between?.payload as { value: string }).value, 'second');

    const atT3 = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3, securityId: EQ });
    assert.equal((atT3?.payload as { value: string }).value, 'third');

    const future = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2030-01-01T00:00:00.000Z', securityId: EQ });
    assert.equal((future?.payload as { value: string }).value, 'third');
    store.close();
  });

  it('returns the inclusive historical range in ascending order', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('range'));
    store.append(fixture({ securityId: EQ, asOf: T3, version: 'third' }));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'first' }));
    store.append(fixture({ securityId: EQ, asOf: T2, version: 'second' }));

    const range = store.queryRange('SWANENERGY', 'D01_QUOTES', T1, T2, EQ);
    assert.deepEqual(
      range.map((e) => (e.payload as { value: string }).value),
      ['first', 'second'],
    );
    store.close();
  });

  it('rejects an invalid asOf on read instead of silently matching nothing', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('bad-read'));
    store.append(fixture({ securityId: EQ, asOf: T1 }));
    assert.throws(
      () => store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: 'nope', securityId: EQ }),
      /Invalid asOf timestamp/,
    );
    store.close();
  });

  it('serves the reused PitReadService without a second read implementation', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('facade'));
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));

    const reader = new PitReadService<unknown>(store);
    const hit = reader.queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf: T3 });
    assert.equal(hit.found, true);
    if (hit.found) {
      assert.equal((hit.payload as { value: string }).value, 'a');
      assert.equal(hit.resolvedAsOf, T1);
    }

    const malformed = reader.queryAsOf({ securityId: ISIN, domain: 'D01_QUOTES', asOf: T3 });
    assert.equal(malformed.found, false);
    if (!malformed.found) assert.equal(malformed.reason, 'INVALID_IDENTITY');
    store.close();
  });
});

describe('REG-06 durable PIT store — failure leaves no partial write', () => {
  it('rolls back a rejected append and keeps the store usable', () => {
    const path = dbPath('rollback');
    const store = new DurablePointInTimeStore<unknown>(path);
    store.append(fixture({ securityId: EQ, asOf: T1, version: 'a' }));
    const before = store.getRecordCount();

    assert.throws(() => store.append(fixture({ securityId: EQ, asOf: T1, version: 'b' })));
    assert.throws(() => store.append(fixture({ securityId: ISIN, asOf: T2 })));
    assert.throws(() => store.append(fixture({ securityId: EQ, asOf: '2026-13-45T99:99:99Z' })));

    assert.equal(store.getRecordCount(), before, 'no failed append may leave a row behind');

    // The connection must still be healthy after three rolled-back transactions.
    store.append(fixture({ securityId: BL, asOf: T2, version: 'ok' }));
    assert.equal(store.getRecordCount(), before + 1);
    store.close();

    const reopened = new DurablePointInTimeStore<unknown>(path);
    assert.equal(reopened.getRecordCount(), before + 1, 'the rolled-back rows must not exist on disk either');
    reopened.close();
  });

  it('refuses every operation after close', () => {
    const store = new DurablePointInTimeStore<unknown>(dbPath('closed'));
    store.append(fixture({ securityId: EQ }));
    store.close();
    assert.throws(() => store.getRecordCount(), /closed/);
    assert.throws(() => store.append(fixture({ securityId: EQ })), /closed/);
    store.close(); // idempotent
  });
});
