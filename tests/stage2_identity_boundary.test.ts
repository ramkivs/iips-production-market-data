/** Stage 2 boundary characterization, not real-issuer or Windows-runtime evidence.
 * Pins the producer contract implicated by W04/W06: nested identity is not a
 * flat ISIN/exchange tuple, a company label is not an issuer mapping, and reads
 * must remain owner-scoped/revision-consistent. No runtime database is opened.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DurablePortfolioStore, type HoldingInput } from '../src/persistence/portfolio_store.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';

const owner = { canonicalOwnerId: 'synthetic-boundary-owner', tenantId: 'synthetic-boundary-tenant' };
function fixture() {
  const db = new DatabaseSync(':memory:');
  ensureMigrations(db, GATE3_MIGRATIONS);
  return { db, store: new DurablePortfolioStore(db) };
}
function row(index: number, withIdentity = true): HoldingInput {
  return {
    symbol: `SYNTHETIC-${index}`, companyId: `synthetic-company-${index}`,
    quantity: 1, averageBuyPrice: 1, currentPrice: 1, marketValue: 1,
    weightPercentage: 100 / 64, active: true, sourceBroker: 'synthetic-only',
    lineageDigest: 'synthetic-boundary-lineage', identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
    // Grammar fixture only: not an assertion of real ISIN/check-digit validity.
    securityIdentity: withIdentity ? buildD114SecurityIdentity(`IN${String(index).padStart(10, '0')}`, 'EQ') : null,
  };
}

test('64 stored INITIAL holdings retain exact nested identities without inventing an exchange or issuer', () => {
  const { db, store } = fixture();
  try {
    store.create(owner, 'SYNTHETIC-BOUNDARY-64', { holdings: Array.from({ length: 64 }, (_, i) => row(i)), provenanceDigest: 'synthetic-boundary-digest' });
    const before = store.get(owner, 'SYNTHETIC-BOUNDARY-64');
    assert.equal(before.revision, 1);
    assert.equal(before.isSaved, false);
    assert.equal(before.holdings.length, 64);
    assert.equal(before.holdings.filter(h => h.active).length, 64);
    assert.equal(before.weightSumPercentage, 100);
    assert.equal(store.revisions(owner, 'SYNTHETIC-BOUNDARY-64')[0].operation, 'INITIAL');
    for (const h of before.holdings) {
      const i = Number(h.symbol.slice('SYNTHETIC-'.length));
      assert.ok(h.securityIdentity);
      assert.equal(h.securityIdentity.securityId, `ISIN:IN${String(i).padStart(10, '0')}:EQ`);
      assert.equal(h.securityIdentity.isinAuthority, 'NON_AUTHORITATIVE');
      const wire = h as unknown as Record<string, unknown>;
      assert.equal(Object.hasOwn(wire, 'exchange'), false, 'EQ is a series, not an exchange');
      assert.equal(Object.hasOwn(wire, 'isin'), false, 'ISIN is nested in this producer projection');
      assert.equal(Object.hasOwn(wire, 'issuerId'), false, 'IPD companyId is not an IRR issuer attestation');
    }
    assert.deepEqual(store.get(owner, 'SYNTHETIC-BOUNDARY-64'), before, 'read does not enrich or mutate stored evidence');
    assert.equal(store.list(owner)[0].revision, before.revision);
  } finally { db.close(); }
});

test('missing identity remains null even with company/symbol labels', () => {
  const { db, store } = fixture();
  try {
    store.create(owner, 'SYNTHETIC-NULL', { holdings: [row(1, false)], provenanceDigest: 'synthetic-null' });
    const h = store.get(owner, 'SYNTHETIC-NULL').holdings[0];
    assert.equal(h.securityIdentity, null);
    assert.equal(h.companyId, 'synthetic-company-1');
  } finally { db.close(); }
});

test('identity-bearing portfolio does not widen owner scope or bypass revision guards', () => {
  const { db, store } = fixture();
  try {
    const request = { holdings: [row(1)], provenanceDigest: 'synthetic-scope' };
    store.create(owner, 'SYNTHETIC-SCOPE', request);
    for (const foreign of [
      { ...owner, tenantId: 'foreign-tenant' },
      { ...owner, canonicalOwnerId: 'foreign-owner' },
    ]) {
      assert.deepEqual(store.list(foreign), []);
      assert.throws(() => store.get(foreign, 'SYNTHETIC-SCOPE'));
      assert.throws(() => store.revisions(foreign, 'SYNTHETIC-SCOPE'));
    }
    assert.throws(() => store.save(owner, 'SYNTHETIC-SCOPE', request, 99));
    assert.equal(store.get(owner, 'SYNTHETIC-SCOPE').revision, 1);
    assert.equal(store.revisions(owner, 'SYNTHETIC-SCOPE').length, 1);
  } finally { db.close(); }
});
