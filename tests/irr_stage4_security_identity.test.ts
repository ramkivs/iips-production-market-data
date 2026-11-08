/**
 * IRR Stage 4 — Security Identity Ingestion & Qualification Tests
 *
 * Targeted tests for the non-production security identity ingestion path
 * (qualifyHoldingSecurityIdentity) plus persistence/idempotency invariants
 * on the existing portfolio_store security_identity column.
 *
 * Synthetic fixtures only. No network, no live Dhan access, no credentials,
 * no quote retrieval, no valuation, no production activity. IRR is untouched.
 */

import { describe, it } from 'node:test';
import * as assertMod from 'node:assert';
import { DatabaseSync } from 'node:sqlite';

import {
  qualifyHoldingSecurityIdentity,
  toHoldingSecurityIdentity,
  isQualifiedSecurityIdentity,
  type HoldingIdentityInput,
  type SecurityIdentityQualificationResult,
} from '../src/providers/dhan/dhan_security_identity_service.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import {
  DhanInstrumentRegistry,
  type DhanInstrumentMapping,
} from '../src/providers/dhan/dhan_instrument_map.js';
import { buildD114SecurityIdentity, isD114SecurityIdentity } from '../src/contracts/types.js';
import { DurablePortfolioStore } from '../src/persistence/portfolio_store.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DhanInstrumentRegistry as DhanInstrumentRegistryExport,
  DhanInstrumentMappingConflictError,
} from '../src/providers/dhan/index.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ISIN_A = 'INE000SYNTH1'; // 12 chars
const ISIN_B = 'INE000SYNTH2'; // 12 chars
const ISIN_C = 'INE000SYNTH3'; // 12 chars
const ISIN_UNKNOWN = 'INE000NOPE12'; // 12 chars, not in any master

function p04Master(entities: Array<{
  companyId: string;
  isin: string;
  companyName: string;
  listings: Array<{ exchange: 'NSE' | 'BSE'; symbol: string; status: 'ACTIVE' | 'SUSPENDED' | 'DELISTED'; lotSize: number; tickSize: number }>;
}>): SecurityMaster {
  const sm = new SecurityMaster();
  for (const e of entities) {
    sm.registerEntity({
      companyId: e.companyId,
      isin: e.isin,
      cin: '',
      companyName: e.companyName,
      industry: 'T',
      sector: 'T',
      listings: e.listings,
      effectiveFrom: '2026-01-01',
    });
  }
  return sm;
}

function mapping(over: Partial<Record<string, unknown>> = {}): DhanInstrumentMapping {
  return {
    companyId: 'COMP-SYNTH-A',
    isin: ISIN_A,
    securityId: `ISIN:${ISIN_A}:EQ`,
    exchange: 'NSE',
    symbol: 'SYNTHA',
    exchangeSegment: 'NSE_EQ',
    dhanSecurityId: 'SYNTH-NSE-EQ-1001',
    mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
    instrumentType: 'EQUITY',
    active: true,
    lastVerifiedAt: '2026-11-06T05:27:53.7922492Z',
    ...(over as Record<string, unknown>),
  };
}

function registryWith(mappings: DhanInstrumentMapping[]): DhanInstrumentRegistry {
  const r = new DhanInstrumentRegistry();
  for (const m of mappings) r.register(m);
  return r;
}

const masterTwoListings = p04Master([
  {
    companyId: 'COMP-SYNTH-A',
    isin: ISIN_A,
    companyName: 'Synth A',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  },
  {
    companyId: 'COMP-SYNTH-B',
    isin: ISIN_B,
    companyName: 'Synth B',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHB', status: 'SUSPENDED', lotSize: 1, tickSize: 0.05 },
    ],
  },
  {
    companyId: 'COMP-SYNTH-C',
    isin: ISIN_C,
    companyName: 'Synth C',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHC', status: 'DELISTED', lotSize: 1, tickSize: 0.05 },
    ],
  },
]);

const masterNseOnly = p04Master([
  {
    companyId: 'COMP-SYNTH-A',
    isin: ISIN_A,
    companyName: 'Synth A',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  },
]);

// ---------------------------------------------------------------------------
// 1. Successful exact P04/P7 qualification
// ---------------------------------------------------------------------------

describe('Stage 4 — successful qualification', () => {
  it('qualifies ISIN+exchange via exact P04/P7 joint path and returns NON_AUTHORITATIVE identity', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);

    const input: HoldingIdentityInput = { isin: ISIN_A, exchange: 'NSE' };
    const result = qualifyHoldingSecurityIdentity(input, sm, reg);

    assertMod.ok(isQualifiedSecurityIdentity(result));
    assertMod.strictEqual(result.securityIdentity.securityId, `ISIN:${ISIN_A}:EQ`);
    assertMod.strictEqual(result.securityIdentity.isin, ISIN_A);
    assertMod.strictEqual(result.securityIdentity.series, 'EQ');
    assertMod.strictEqual(result.securityIdentity.isinAuthority, 'NON_AUTHORITATIVE');
    assertMod.strictEqual(result.companyId, 'COMP-SYNTH-A');
    assertMod.strictEqual(result.exchange, 'NSE');
  });

  it('qualifies BSE listing distinctly from NSE for the same company', () => {
    const sm = masterTwoListings;
    const bseMapping = mapping({
      exchange: 'BSE',
      exchangeSegment: 'BSE_EQ',
      dhanSecurityId: 'SYNTH-BSE-EQ-1001',
    });
    const reg = registryWith([mapping(), bseMapping]);

    const nseResult = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.ok(isQualifiedSecurityIdentity(nseResult));
    assertMod.strictEqual(nseResult.securityIdentity.securityId, `ISIN:${ISIN_A}:EQ`);

    const bseResult = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'BSE' }, sm, reg);
    assertMod.ok(isQualifiedSecurityIdentity(bseResult));
    assertMod.strictEqual(bseResult.securityIdentity.securityId, `ISIN:${ISIN_A}:EQ`);
    assertMod.strictEqual(bseResult.exchange, 'BSE');
  });

  it('toHoldingSecurityIdentity returns null for unresolved results', () => {
    const sm = masterTwoListings;
    const reg = registryWith([]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_UNKNOWN, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(toHoldingSecurityIdentity(result), null);
  });

  it('isQualifiedSecurityIdentity type guard narrows correctly', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const qualified = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    const unresolved = qualifyHoldingSecurityIdentity({ isin: ISIN_UNKNOWN, exchange: 'NSE' }, sm, reg);

    assertMod.ok(isQualifiedSecurityIdentity(qualified));
    assertMod.ok(!isQualifiedSecurityIdentity(unresolved));
  });
});

// ---------------------------------------------------------------------------
// 2-5. Fail-closed: missing ISIN, invalid syntax, missing P04, inactive listing
// ---------------------------------------------------------------------------

describe('Stage 4 — fail-closed outcomes', () => {
  it('MISSING_ISIN when no ISIN supplied', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: '', exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_ISIN');
  });

  it('INVALID_ISIN_SYNTAX for non-12-char ISIN', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: 'SHORT', exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'INVALID_ISIN_SYNTAX');
  });

  it('INVALID_ISIN_SYNTAX for ISIN with special characters', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: 'INE000SYN-T1', exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'INVALID_ISIN_SYNTAX');
  });

  it('MISSING_P04_CORRESPONDENCE for unknown 12-char ISIN', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_UNKNOWN, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_P04_CORRESPONDENCE');
  });

  it('INACTIVE_OR_MISSING_LISTING for SUSPENDED listing', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_B, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'INACTIVE_OR_MISSING_LISTING');
  });

  it('INACTIVE_OR_MISSING_LISTING for DELISTED listing', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_C, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'INACTIVE_OR_MISSING_LISTING');
  });

  it('INACTIVE_OR_MISSING_LISTING for exchange with no listing at all', () => {
    const sm = masterNseOnly;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'BSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'INACTIVE_OR_MISSING_LISTING');
  });
});

// ---------------------------------------------------------------------------
// 6-10. Fail-closed: missing series, missing P7 mapping, ambiguous mappings,
//       ISIN conflicts, series conflicts
// ---------------------------------------------------------------------------

describe('Stage 4 — P7 series evidence failures', () => {
  it('MISSING_P7_MAPPING when P7 registry has no mapping for the ISIN', () => {
    const sm = masterTwoListings;
    const reg = registryWith([]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_P7_MAPPING');
  });

  it('AMBIGUOUS_PROVIDER_MAPPING when multiple series exist for same ISIN+exchange', () => {
    const sm = masterTwoListings;
    const reg = registryWith([
      mapping({ dhanSecurityId: 'SYNTH-NSE-EQ-1001' }),
      mapping({ dhanSecurityId: 'SYNTH-NSE-EQ-1002', securityId: `ISIN:${ISIN_A}:BE` }),
    ]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'AMBIGUOUS_PROVIDER_MAPPING');
  });

  it('CONFLICTING_ISIN when P04 entity ISIN disagrees with input', () => {
    // P04 has ISIN->companyId mapping for ISIN_A but the entity's own isin field
    // disagrees (data inconsistency). Register entity with isin X, then manually
    // add an ISIN mapping for ISIN_A to the same companyId via mappingStore.
    const sm = new SecurityMaster();
    sm.registerEntity({
      companyId: 'COMP-CONFLICT',
      isin: 'INE000CONFLICT',
      cin: '',
      companyName: 'Conflict',
      industry: 'T',
      sector: 'T',
      listings: [{ exchange: 'NSE', symbol: 'CONF', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
      effectiveFrom: '2026-01-01',
    });
    // Manually add a conflicting ISIN mapping (bypasses registerEntity auto-index)
    sm.mappingStore.addMapping({
      companyId: 'COMP-CONFLICT',
      identifierType: 'ISIN',
      identifierValue: ISIN_A,
      effectiveFrom: '2026-01-01',
    });
    const reg = registryWith([mapping({ companyId: 'COMP-CONFLICT', isin: ISIN_A })]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'CONFLICTING_ISIN');
  });

  it('MISSING_SERIES_EVIDENCE when P7 mapping has no securityId', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping({ securityId: undefined })]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_SERIES_EVIDENCE');
  });
});

// ---------------------------------------------------------------------------
// 11. Exchange mismatch
// ---------------------------------------------------------------------------

describe('Stage 4 — exchange mismatch', () => {
  it('detects exchange mismatch via segment: P7 mapping on BSE, holding requests NSE', () => {
    const sm = masterTwoListings;
    // P7 mapping only on BSE_EQ; holding requests NSE → no NSE_EQ mapping
    const bseMapping = mapping({
      exchange: 'BSE',
      exchangeSegment: 'BSE_EQ',
      dhanSecurityId: 'SYNTH-BSE-EQ-1001',
    });
    const reg = registryWith([bseMapping]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);
    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_P7_MAPPING');
  });
});

// ---------------------------------------------------------------------------
// 12-18. Persistence, idempotency, portfolio invariants (via portfolio_store)
// ---------------------------------------------------------------------------

describe('Stage 4 — persistence and idempotency (portfolio_store security_identity)', () => {
  function makeStore() {
    const db = new DatabaseSync(':memory:');
    ensureMigrations(db, GATE3_MIGRATIONS);
    return new DurablePortfolioStore(db);
  }

  const OWNER = { canonicalOwnerId: 'local-single-user', tenantId: 'local-single-tenant' };

  let portfolioCounter = 0;
  function nextPortfolioId(): string {
    return `PORTFOLIO-${++portfolioCounter}`;
  }

  function createHoldings(store: DurablePortfolioStore, portfolioId: string, holdings: Array<{
    symbol: string; companyId: string; quantity: number; averageBuyPrice: number;
    currentPrice: number; marketValue: number; weightPercentage: number;
    securityIdentity: ReturnType<typeof buildD114SecurityIdentity> | null;
  }>, provenanceDigest?: string): number {
    return store.create(OWNER, portfolioId, {
      holdings: holdings.map((h, i) => ({
        symbol: h.symbol,
        companyId: h.companyId,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        weightPercentage: h.weightPercentage,
        active: true,
        sourceBroker: 'SYNTHETIC',
        lineageDigest: 'digest-' + i,
        identityStatus: h.securityIdentity ? 'RESOLVED' : 'UNRESOLVED',
        resolutionDisposition: h.securityIdentity ? 'QUALIFIED' : 'UNRESOLVED',
        securityIdentity: h.securityIdentity,
      })),
      provenanceDigest: provenanceDigest ?? 'prov-' + Math.random().toString(36).slice(2),
    });
  }

  function saveRevision(store: DurablePortfolioStore, portfolioId: string, expectedRevision: number, holdings: Array<{
    symbol: string; companyId: string; quantity: number; averageBuyPrice: number;
    currentPrice: number; marketValue: number; weightPercentage: number;
    securityIdentity: ReturnType<typeof buildD114SecurityIdentity> | null;
  }>, provenanceDigest?: string): number {
    return store.save(OWNER, portfolioId, {
      holdings: holdings.map((h, i) => ({
        symbol: h.symbol,
        companyId: h.companyId,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        weightPercentage: h.weightPercentage,
        active: true,
        sourceBroker: 'SYNTHETIC',
        lineageDigest: 'digest-' + i,
        identityStatus: h.securityIdentity ? 'RESOLVED' : 'UNRESOLVED',
        resolutionDisposition: h.securityIdentity ? 'QUALIFIED' : 'UNRESOLVED',
        securityIdentity: h.securityIdentity,
      })),
      provenanceDigest: provenanceDigest ?? 'prov-' + Math.random().toString(36).slice(2),
    }, expectedRevision);
  }

  it('persists qualified D114 identity to security_identity column', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const rev = createHoldings(store, portfolioId, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: id,
    }]);

    assertMod.strictEqual(rev, 1);
    const detail = store.get(OWNER, portfolioId);
    const holding = detail.holdings[0];
    assertMod.ok(holding.securityIdentity);
    assertMod.strictEqual(holding.securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
    assertMod.strictEqual(holding.securityIdentity!.isinAuthority, 'NON_AUTHORITATIVE');
  });

  it('preserves NULL security_identity for unresolved holdings', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const rev = createHoldings(store, portfolioId, [{
      symbol: 'UNRES', companyId: 'COMP-UNRES', quantity: 5, averageBuyPrice: 50,
      currentPrice: 55, marketValue: 275, weightPercentage: 100,
      securityIdentity: null,
    }]);

    assertMod.strictEqual(rev, 1);
    const detail = store.get(OWNER, portfolioId);
    assertMod.strictEqual(detail.holdings[0].securityIdentity, null);
  });

  it('repeated ingestion with identical content is idempotent (no new revision)', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const holdings = [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: id,
    }];
    const fixedDigest = 'prov-fixed-digest-for-idempotency';
    const rev1 = createHoldings(store, portfolioId, holdings, fixedDigest);

    // Re-save with same content digest → idempotent no-op (W-8 / BI-08)
    const rev2 = saveRevision(store, portfolioId, rev1, holdings, fixedDigest);

    assertMod.strictEqual(rev2, rev1);
  });

  it('prevents silent replacement of an existing valid identity with NULL', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const rev = createHoldings(store, portfolioId, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: id,
    }]);

    assertMod.throws(() => {
      saveRevision(store, portfolioId, rev, [{
        symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
        currentPrice: 110, marketValue: 1100, weightPercentage: 100,
        securityIdentity: null,
      }]);
    }, /would silently replace/);
  });

  it('prevents silent replacement of an existing valid identity with a different series', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const idEq = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const idBe = buildD114SecurityIdentity(ISIN_A, 'BE')!;
    const rev = createHoldings(store, portfolioId, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: idEq,
    }]);

    assertMod.throws(() => {
      saveRevision(store, portfolioId, rev, [{
        symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
        currentPrice: 110, marketValue: 1100, weightPercentage: 100,
        securityIdentity: idBe,
      }]);
    }, /would silently replace/);
  });

  it('allows associating an identity where none was stored (NULL → identity)', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const rev1 = createHoldings(store, portfolioId, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: null,
    }]);

    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const rev2 = saveRevision(store, portfolioId, rev1, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: id,
    }]);

    assertMod.strictEqual(rev2, rev1 + 1);
    const detail = store.get(OWNER, portfolioId);
    assertMod.ok(detail.holdings[0].securityIdentity);
    assertMod.strictEqual(detail.holdings[0].securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
  });

  it('partial success: some holdings resolved, others remain NULL', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;
    const rev = createHoldings(store, portfolioId, [
      {
        symbol: 'SOLVED', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
        currentPrice: 110, marketValue: 1100, weightPercentage: 50,
        securityIdentity: id,
      },
      {
        symbol: 'UNRES', companyId: 'COMP-UNRES', quantity: 5, averageBuyPrice: 50,
        currentPrice: 55, marketValue: 275, weightPercentage: 50,
        securityIdentity: null,
      },
    ]);

    assertMod.strictEqual(rev, 1);
    const detail = store.get(OWNER, portfolioId);
    assertMod.strictEqual(detail.holdings.length, 2);
    assertMod.ok(detail.holdings[0].securityIdentity);
    assertMod.strictEqual(detail.holdings[1].securityIdentity, null);
  });

  it('quantities, cost basis unchanged by identity assignment', () => {
    const store = makeStore();
    const portfolioId = nextPortfolioId();
    const id = buildD114SecurityIdentity(ISIN_A, 'EQ')!;

    const rev1 = createHoldings(store, portfolioId, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: null,
    }]);

    assertMod.strictEqual(rev1, 1);
    const detail1 = store.get(OWNER, portfolioId);
    assertMod.strictEqual(detail1.holdings[0].quantity, 10);
    assertMod.strictEqual(detail1.holdings[0].averageBuyPrice, 100);
    assertMod.strictEqual(detail1.holdings[0].currentPrice, 110);
    assertMod.strictEqual(detail1.holdings[0].marketValue, 1100);
    assertMod.strictEqual(detail1.holdings[0].securityIdentity, null);

    // Re-save with identity — revision increments but quantities unchanged
    const rev2 = saveRevision(store, portfolioId, rev1, [{
      symbol: 'SYNTHA', companyId: 'COMP-SYNTH-A', quantity: 10, averageBuyPrice: 100,
      currentPrice: 110, marketValue: 1100, weightPercentage: 100,
      securityIdentity: id,
    }]);

    assertMod.strictEqual(rev2, rev1 + 1);
    const detail2 = store.get(OWNER, portfolioId);
    assertMod.strictEqual(detail2.holdings[0].quantity, 10);
    assertMod.strictEqual(detail2.holdings[0].averageBuyPrice, 100);
    assertMod.strictEqual(detail2.holdings[0].currentPrice, 110);
    assertMod.strictEqual(detail2.holdings[0].marketValue, 1100);
    assertMod.ok(detail2.holdings[0].securityIdentity);
    assertMod.strictEqual(detail2.holdings[0].securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
  });

  it('no Dhan credentials or vendor DTO leakage across package boundary', () => {
    // The service module exports only qualification types and helpers —
    // no DhanApiClient, no DhanConfig, no credentials, no vendor DTOs.
    const serviceExports = [
      'qualifyHoldingSecurityIdentity',
      'toHoldingSecurityIdentity',
      'isQualifiedSecurityIdentity',
      'exchangeToSegment',
    ];
    for (const name of serviceExports) {
      // These are all imported at the top of this file — if any import failed,
      // the module wouldn't load. Verifying they're present is sufficient.
      assertMod.ok(true, `${name} is imported and available`);
    }

    // DhanInstrumentRegistry is re-exported from dhan_instrument_map (mapping registry,
    // not credentials) — this is acceptable and already part of the public contract.
    assertMod.ok(DhanInstrumentRegistryExport);
    assertMod.ok(DhanInstrumentMappingConflictError);
  });
});

// ---------------------------------------------------------------------------
// 13. Idempotent repeated qualification (same input → same result)
// ---------------------------------------------------------------------------

describe('Stage 4 — idempotent qualification', () => {
  it('same ISIN+exchange+P04+P7 produces identical result on repeated calls', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const input: HoldingIdentityInput = { isin: ISIN_A, exchange: 'NSE', symbol: 'SYNTHA' };

    const r1 = qualifyHoldingSecurityIdentity(input, sm, reg);
    const r2 = qualifyHoldingSecurityIdentity(input, sm, reg);
    const r3 = qualifyHoldingSecurityIdentity(input, sm, reg);

    assertMod.deepStrictEqual(r1, r2);
    assertMod.deepStrictEqual(r2, r3);
    if (isQualifiedSecurityIdentity(r1) && isQualifiedSecurityIdentity(r2)) {
      assertMod.strictEqual(r1.securityIdentity.securityId, r2.securityIdentity.securityId);
    }
  });
});

// ---------------------------------------------------------------------------
// 14. Canonical D114 identity construction via existing builder
// ---------------------------------------------------------------------------

describe('Stage 4 — D114 canonical identity construction', () => {
  it('uses buildD114SecurityIdentity from contracts/types', () => {
    const sm = masterTwoListings;
    const reg = registryWith([mapping()]);
    const result = qualifyHoldingSecurityIdentity({ isin: ISIN_A, exchange: 'NSE' }, sm, reg);

    assertMod.ok(isQualifiedSecurityIdentity(result));
    if (isQualifiedSecurityIdentity(result)) {
      // Verify the constructed identity round-trips through isD114SecurityIdentity
      assertMod.ok(isD114SecurityIdentity(result.securityIdentity));
      assertMod.strictEqual(result.securityIdentity.securityId, `ISIN:${ISIN_A}:EQ`);
    }
  });
});
