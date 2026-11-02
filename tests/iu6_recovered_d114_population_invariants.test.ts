/**
 * IU-6 recovered regression invariants (reconciliation entry, 2026-11-02).
 *
 * PR #6 ("IU-6 — non-production D114 -> authoritative IPD PIT store population")
 * was merged into the Arena branch `arena/01a0e6d9-iips-production-market-data`
 * (merge commit `0dab1221fb0f…`), never into `main`. Its implementation was
 * independently re-landed on `main` as `src/d114/non_production_pit_population.ts`
 * with an identical 16-symbol public surface, and `tests/wsk_iu6_d114_pit_population.test.ts`
 * (514 lines, 28 cases) was replaced by `tests/cap02_pit_d114_package.test.ts`.
 *
 * Twenty-six of those 28 cases are semantically covered by the current-main
 * suite. Two invariants are asserted more weakly there, and this file restores
 * them at their original strength. No production behaviour changes; nothing is
 * imported that is not already public on `main`.
 *
 *   R-1  full-payload determinism. Current main compares only
 *        `listAdmittedSeriesKeys()` between two independent populations
 *        (`is deterministic and idempotent through the returned loader`), which
 *        cannot detect a divergence in payload, provenance or lineage content
 *        behind an identical key set. IU6-13a compared the full record set.
 *
 *   R-2  caller-supplied-store identity. Current main asserts only that the
 *        returned population wrapper exposes the caller's store. IU6-14b
 *        additionally asserted that the loader's own D01 and D02 stores ARE that
 *        same instance, which is the invariant that actually rules out a private
 *        second PIT authority.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { DataDomain } from '../src/contracts/types.js';
import { PointInTimeStore } from '../src/pit/pit_store.js';
import {
  createNonProductionD114PitStore,
  populateNonProductionD114Pit,
  type NonProductionD114Population,
} from '../src/d114/non_production_pit_population.js';

const BEFORE_ALL = '2020-01-01T00:00:00.000Z';
const AFTER_ALL = '2026-12-31T23:59:59.000Z';

/**
 * Serialises every admitted record of a populated store, not merely its keys.
 *
 * Admitted series keys are `companyId:domain[:series-qualified securityId]`, so
 * the leading two segments address `queryRange` and the remainder is the exact
 * identity segment. Sorting keeps the snapshot independent of admission order.
 */
function snapshotRecords(population: NonProductionD114Population): string {
  const { store } = population;
  const records = store
    .listAdmittedSeriesKeys()
    .map((key) => {
      const segments = key.split(':');
      const companyId = segments[0]!;
      const domain = segments[1] as DataDomain;
      const securityId = segments.slice(2).join(':');
      return store.queryRange(
        companyId,
        domain,
        BEFORE_ALL,
        AFTER_ALL,
        securityId === '' ? undefined : securityId,
      );
    })
    .flat();
  // The whole envelope is serialised: identity, payload, provenance, timestamp
  // and schema version. Record order is admission order, which is itself pinned
  // by the current-main suite's key-set comparison, so leaving it unsorted makes
  // this snapshot strictly stronger rather than order-insensitive.
  return JSON.stringify(records);
}

describe('IU-6 recovered invariant R-1 — full-payload determinism of D114 population', () => {
  it('two independent populations are identical across every record, not just every key', () => {
    const a = createNonProductionD114PitStore();
    const b = createNonProductionD114PitStore();

    // The current-main suite already asserts this; restated so the payload
    // comparison below is unambiguously about content behind identical keys.
    assert.deepStrictEqual(a.store.listAdmittedSeriesKeys(), b.store.listAdmittedSeriesKeys());
    assert.strictEqual(a.store.getRecordCount(), 12);
    assert.strictEqual(b.store.getRecordCount(), 12);

    const snapshotA = snapshotRecords(a);
    const snapshotB = snapshotRecords(b);

    // The recovered assertion: 12 full envelopes (payload + provenance) match.
    assert.strictEqual(snapshotA, snapshotB);
    assert.ok(
      snapshotA.includes('OFFLINE_BOOTSTRAP'),
      'the snapshot really traversed record provenance, so the comparison is not vacuous',
    );
    assert.ok(snapshotA.length > 1000, `snapshot traversed real records (got ${snapshotA.length} chars)`);
  });

  it('is sensitive to payload content, so the comparison cannot pass on keys alone', () => {
    const a = createNonProductionD114PitStore();
    const baseline = snapshotRecords(a);

    // Negative control: perturbing one field of one record must change the
    // snapshot while leaving the admitted key set untouched.
    const key = a.store.listAdmittedSeriesKeys()[0]!;
    const segments = key.split(':');
    const companyId = segments[0]!;
    const domain = segments[1] as DataDomain;
    const securityId = segments.slice(2).join(':');
    const records = a.store.queryRange(
      companyId,
      domain,
      BEFORE_ALL,
      AFTER_ALL,
      securityId === '' ? undefined : securityId,
    );
    assert.ok(records.length > 0);
    (records[0]!.payload as { ltp?: number }).ltp = -1;

    assert.notStrictEqual(snapshotRecords(a), baseline);
    assert.deepStrictEqual(
      a.store.listAdmittedSeriesKeys(),
      createNonProductionD114PitStore().store.listAdmittedSeriesKeys(),
      'the key set is unchanged by the perturbation — proving key-only comparison was insufficient',
    );
  });
});

describe('IU-6 recovered invariant R-2 — the loader admits into the caller-supplied store only', () => {
  it('the loader D01 and D02 stores are the very instance the caller supplied', () => {
    const store = new PointInTimeStore<unknown>();
    const population = populateNonProductionD114Pit(store);

    // Already asserted on current main.
    assert.strictEqual(population.store, store);
    assert.strictEqual(store.getRecordCount(), 12);

    // The recovered assertions: no private store behind the loader.
    assert.strictEqual(
      population.loader.getD01Store() as unknown,
      store,
      'the loader must not retain a private D01 store',
    );
    assert.strictEqual(
      population.loader.getD02Store() as unknown,
      store,
      'the loader must not retain a private D02 store',
    );
  });

  it('D01 and D02 share that one store, so admitting both domains creates no second authority', () => {
    const store = new PointInTimeStore<unknown>();
    const population = populateNonProductionD114Pit(store);

    assert.strictEqual(population.loader.getD01Store() as unknown, population.loader.getD02Store() as unknown);
    // Every admitted record is observable through the caller's own store handle.
    assert.strictEqual(store.getRecordCount(), 12);
    assert.strictEqual(
      store.listAdmittedSeriesKeys().length,
      population.loader.getD01Store().listAdmittedSeriesKeys().length,
      'the caller sees the complete admitted key set, including both domains',
    );
  });
});
