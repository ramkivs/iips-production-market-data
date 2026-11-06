/**
 * G-2 durable holding identity enhancement (synthetic, in-memory DB).
 *
 * Verifies that the G-2 store durably persists the exact canonical P04
 * `D114SecurityIdentity` (including exchange series) through create/save/
 * retrieval, keeps legacy rows explicitly unresolved, refuses silent series
 * replacement, and exposes the identity through the read-only `portfolio.get`
 * contract. No live or vendor-qualified claims.
 */

import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DurablePortfolioStore, type HoldingInput, type OwnerRef } from '../src/persistence/portfolio_store.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  type D114SecurityIdentity,
} from '../src/contracts/types.js';
import { mapBrokerImportHoldings, type ResolvedBrokerImportHolding } from '../src/persistence/brokerImportPersistence.js';

const owner: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
const EQ_A = buildD114SecurityIdentity('INE000SYNTH1', 'EQ') as D114SecurityIdentity;
const BE_A = buildD114SecurityIdentity('INE000SYNTH1', 'BE') as D114SecurityIdentity;
const EQ_B = buildD114SecurityIdentity('INE000SYNTH2', 'EQ') as D114SecurityIdentity;

function holding(symbol: string, companyId: string, securityIdentity?: D114SecurityIdentity | null): HoldingInput {
  return {
    symbol,
    companyId,
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 100,
    active: true,
    sourceBroker: 'synthetic-broker',
    lineageDigest: 'synthetic-lineage',
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
    securityIdentity,
  };
}

function saveRequest(holdings: HoldingInput[]) {
  return { holdings, provenanceDigest: 'synthetic-provenance' };
}

describe('G-2 durable D114 security identity', () => {
  let root: string;
  let db: DatabaseSync;
  let store: DurablePortfolioStore;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'g2-identity-'));
    db = new DatabaseSync(join(root, 'store.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    store = new DurablePortfolioStore(db);
  });

  after(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });

  it('persists and retrieves the exact D114 identity including exchange series', () => {
    store.create(owner, 'P-EXACT', saveRequest([holding('SYNTHA', 'COMP-A', EQ_A)]));
    const detail = store.get(owner, 'P-EXACT');
    assert.strictEqual(detail.holdings.length, 1);
    assert.ok(isD114SecurityIdentity(detail.holdings[0]!.securityIdentity));
    assert.strictEqual(detail.holdings[0]!.securityIdentity!.securityId, 'ISIN:INE000SYNTH1:EQ');
    assert.strictEqual(detail.holdings[0]!.securityIdentity!.series, 'EQ');
  });

  it('supports multiple securities and series of the same company without collision', () => {
    store.create(
      owner,
      'P-MULTI',
      saveRequest([
        holding('SYNTHA', 'COMP-A', EQ_A),
        holding('SYNTHA-BE', 'COMP-A', BE_A),
        holding('SYNTHB', 'COMP-A', EQ_B),
      ]),
    );
    const detail = store.get(owner, 'P-MULTI');
    const bySymbol = new Map(detail.holdings.map((h) => [h.symbol, h.securityIdentity?.securityId]));
    assert.strictEqual(bySymbol.get('SYNTHA'), 'ISIN:INE000SYNTH1:EQ');
    assert.strictEqual(bySymbol.get('SYNTHA-BE'), 'ISIN:INE000SYNTH1:BE');
    assert.strictEqual(bySymbol.get('SYNTHB'), 'ISIN:INE000SYNTH2:EQ');
  });

  it('rejects an invalid or inconsistent identity instead of persisting it', () => {
    assert.throws(
      () => store.create(owner, 'P-BAD', saveRequest([holding('BAD', 'COMP-A', { securityId: 'ISIN:SHORT:EQ', isin: 'SHORT', series: 'EQ', isinAuthority: 'NON_AUTHORITATIVE' } as never)])),
      /D114 grammar/,
    );
    // identity whose securityId does not reconstruct from isin+series
    assert.throws(
      () => store.create(owner, 'P-BAD2', saveRequest([holding('BAD2', 'COMP-A', { securityId: 'ISIN:INE000SYNTH1:BE', isin: 'INE000SYNTH1', series: 'EQ', isinAuthority: 'NON_AUTHORITATIVE' } as never)])),
      /D114 grammar/,
    );
  });

  it('keeps holdings without identity explicitly unresolved (null), never fabricated', () => {
    store.create(owner, 'P-LEGACY', saveRequest([holding('LEGACY', 'COMP-A')]));
    const detail = store.get(owner, 'P-LEGACY');
    assert.strictEqual(detail.holdings[0]!.securityIdentity, null);
    assert.strictEqual(detail.holdings[0]!.companyId, 'COMP-A'); // company identity stays distinct
  });

  it('refuses silent replacement or drop of a stored series; allows explicit re-association of an unresolved holding', () => {
    store.create(owner, 'P-SERIES', saveRequest([holding('SYNTHA', 'COMP-A', EQ_A)]));
    // different series for the same holding key -> refused
    assert.throws(
      () => store.save(owner, 'P-SERIES', saveRequest([holding('SYNTHA', 'COMP-A', BE_A)]), 1),
      /silently replace/,
    );
    // dropping the identity -> refused
    assert.throws(
      () => store.save(owner, 'P-SERIES', saveRequest([holding('SYNTHA', 'COMP-A')]), 1),
      /silently replace/,
    );
    // explicit identical identity -> allowed (changed quantity forces a real new revision)
    const rev = store.save(owner, 'P-SERIES', saveRequest([{ ...holding('SYNTHA', 'COMP-A', EQ_A), quantity: 11 }]), 1);
    assert.strictEqual(rev, 2);
    assert.strictEqual(store.get(owner, 'P-SERIES').holdings[0]!.securityIdentity!.securityId, 'ISIN:INE000SYNTH1:EQ');
    // legacy unresolved holding can later be associated with exact evidence
    store.create(owner, 'P-ASSOC', saveRequest([holding('LEG', 'COMP-A')]));
    const rev2 = store.save(owner, 'P-ASSOC', saveRequest([holding('LEG', 'COMP-A', EQ_B)]), 1);
    assert.strictEqual(rev2, 2);
    assert.strictEqual(store.get(owner, 'P-ASSOC').holdings[0]!.securityIdentity!.securityId, 'ISIN:INE000SYNTH2:EQ');
  });

  it('legacy migration leaves pre-existing rows NULL (explicitly unresolved) and readable', () => {
    // Simulate a legacy DB migrated only through 004, then upgraded to 005.
    const legacyRoot = mkdtempSync(join(tmpdir(), 'g2-legacy-'));
    const legacyDb = new DatabaseSync(join(legacyRoot, 'legacy.db'));
    try {
      ensureMigrations(legacyDb, GATE3_MIGRATIONS.slice(0, 4));
      // Legacy rows written before migration 005 existed (no security_identity column).
      const now = new Date().toISOString();
      legacyDb.prepare(
        "INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name, current_revision, status, created_at, updated_at, deleted_at) VALUES ('P-OLD', ?, ?, 'P-OLD', 1, 'ACTIVE', ?, ?, NULL)",
      ).run(owner.canonicalOwnerId, owner.tenantId, now, now);
      legacyDb.prepare(
        "INSERT INTO portfolio_revisions (portfolio_id, canonical_owner_id, revision, operation, total_market_value, weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at) VALUES ('P-OLD', ?, 1, 'INITIAL', 1100, 100, 1, 'synthetic-provenance', 'legacy-digest', ?)",
      ).run(owner.canonicalOwnerId, now);
      legacyDb.prepare(
        "INSERT INTO portfolio_holdings (canonical_owner_id, portfolio_id, revision, holding_key, symbol, company_id, quantity, average_buy_price, current_price, market_value, weight_percentage, active, source_broker, lineage_digest, identity_status, resolution_disposition, created_at) VALUES (?, 'P-OLD', 1, 'OLD', 'OLD', 'COMP-A', 10, 100, 110, 1100, 100, 1, 'synthetic-broker', 'synthetic-lineage', 'RESOLVED', 'CANONICAL_P04', ?)",
      ).run(owner.canonicalOwnerId, now);
      legacyDb.close();
      const upgraded = new DatabaseSync(join(legacyRoot, 'legacy.db'));
      ensureMigrations(upgraded, GATE3_MIGRATIONS); // applies 005 additively
      const upgradedStore = new DurablePortfolioStore(upgraded);
      const detail = upgradedStore.get(owner, 'P-OLD');
      assert.strictEqual(detail.holdings[0]!.securityIdentity, null);
      assert.strictEqual(detail.holdings[0]!.quantity, 10); // quantities/cost preserved
      upgraded.close();
    } finally {
      rmSync(legacyRoot, { recursive: true, force: true });
    }
  });

  it('identity enrichment does not alter quantities, cost basis, or revision ledger', () => {
    store.create(owner, 'P-QUANT', saveRequest([holding('Q', 'COMP-A', EQ_A)]));
    const before = store.get(owner, 'P-QUANT');
    const revs = store.revisions(owner, 'P-QUANT');
    assert.strictEqual(revs.length, 1);
    assert.strictEqual(before.holdings[0]!.quantity, 10);
    assert.strictEqual(before.holdings[0]!.averageBuyPrice, 100);
    assert.strictEqual(before.totalMarketValue, 1100);
  });

  it('broker import maps an exact identity only from explicit ISIN+series evidence', () => {
    const base = {
      companyId: 'COMP-A', identityStatus: 'RESOLVED' as const, resolutionDisposition: 'CANONICAL_P04' as const,
      quantity: 5, averageBuyPrice: 50, currentPrice: 55, marketValue: 275, weightPercentage: 100,
      active: true, sourceBroker: 'synthetic-broker', lineageDigest: 'synthetic-lineage', symbol: 'SYNTHA',
    };
    const withBoth = mapBrokerImportHoldings([{ ...base, isin: 'INE000SYNTH1', series: 'EQ' } as ResolvedBrokerImportHolding]);
    assert.strictEqual(withBoth[0]!.securityIdentity!.securityId, 'ISIN:INE000SYNTH1:EQ');
    const isinOnly = mapBrokerImportHoldings([{ ...base, isin: 'INE000SYNTH1' } as ResolvedBrokerImportHolding]);
    assert.strictEqual(isinOnly[0]!.securityIdentity, null); // series never inferred from ISIN alone
    const seriesOnly = mapBrokerImportHoldings([{ ...base, series: 'EQ' } as ResolvedBrokerImportHolding]);
    assert.strictEqual(seriesOnly[0]!.securityIdentity, null);
  });

  it('read-only portfolio.get contract exposes the persisted identity per holding', () => {
    store.create(owner, 'P-CONTRACT', saveRequest([holding('SYNTHA', 'COMP-A', EQ_A), holding('NOID', 'COMP-B')]));
    const detail = store.get(owner, 'P-CONTRACT');
    assert.strictEqual(detail.holdings.find((h) => h.symbol === 'SYNTHA')!.securityIdentity!.securityId, 'ISIN:INE000SYNTH1:EQ');
    assert.strictEqual(detail.holdings.find((h) => h.symbol === 'NOID')!.securityIdentity, null);
  });
});
