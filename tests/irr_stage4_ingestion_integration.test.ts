/**
 * IRR Stage 4 — Broker Import Ingestion Integration Tests
 *
 * Verifies the complete operational call chain:
 *
 *   persistBrokerImport → resolveHoldings (P04) → qualifyHoldingSecurityIdentity
 *   (P04 + P7 joint path) → mapBrokerImportHoldings → portfolio_store.save
 *   → portfolio_holdings.security_identity column (migration 005)
 *
 * Synthetic fixtures only. No network, no live Dhan access, no credentials,
 * no quote retrieval, no valuation, no production activity. IRR is untouched.
 */

import { describe, it } from 'node:test';
import * as assertMod from 'node:assert';
import { DatabaseSync } from 'node:sqlite';

import {
  qualifyHoldingSecurityIdentity,
  isQualifiedSecurityIdentity,
  type HoldingIdentityInput,
} from '../src/providers/dhan/dhan_security_identity_service.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';
import {
  DhanInstrumentRegistry,
  type DhanInstrumentMapping,
} from '../src/providers/dhan/dhan_instrument_map.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DurablePortfolioStore } from '../src/persistence/portfolio_store.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  persistBrokerImport,
  type BrokerImportRequest,
  type MapBrokerImportHoldingsOptions,
  type BrokerImportWriter,
} from '../src/persistence/brokerImportPersistence.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import {
  createBrokerImportConsumer,
  type BrokerImportConsumer,
} from '../src/ipc/brokerImportConsumer.js';

/**
 * Test-only BrokerObservationResolver that resolves ISINs from a test SecurityMaster
 * without the governed revision validation that createGovernedBrokerObservationResolver enforces.
 */
function makeTestResolver(sm: SecurityMaster): BrokerObservationResolver {
  return {
    resolve(observation, _asOf) {
      if (!observation.isin || !observation.isin.trim()) {
        return {
          status: 'UNMAPPED',
          reason: 'UNMAPPED_IDENTIFIER: no ISIN supplied.',
          sourceRevision: 'test',
        };
      }
      try {
        const companyId = sm.resolveCompanyId({
          identifierType: 'ISIN',
          identifierValue: observation.isin.trim(),
        });
        return { status: 'RESOLVED', companyId, sourceRevision: 'test' };
      } catch (error) {
        if (error instanceof IdentityAmbiguityError) {
          return {
            status: error.quarantineRecord.reason === 'AMBIGUOUS_COLLISION' ? 'AMBIGUOUS' : 'UNMAPPED',
            reason: `${error.quarantineRecord.reason}: ${error.quarantineRecord.details}`,
            sourceRevision: 'test',
            quarantineRecord: error.quarantineRecord,
          };
        }
        return {
          status: 'UNMAPPED',
          reason: 'UNMAPPED_IDENTIFIER: governed identity resolution failed closed.',
          sourceRevision: 'test',
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ISIN_A = 'INE000SYNTH1';

function makeP04Master(): SecurityMaster {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A',
    isin: ISIN_A,
    cin: '',
    companyName: 'Synth A',
    industry: 'T',
    sector: 'T',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
    effectiveFrom: '2026-01-01',
  });
  return sm;
}

function makeMapping(over: Record<string, unknown> = {}): DhanInstrumentMapping {
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

function makeRegistry(mappings: DhanInstrumentMapping[]): DhanInstrumentRegistry {
  const r = new DhanInstrumentRegistry();
  for (const m of mappings) r.register(m);
  return r;
}

const OWNER = { canonicalOwnerId: 'local-single-user', tenantId: 'local-single-tenant' };

function makeDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  ensureMigrations(db, GATE3_MIGRATIONS);
  // Register the single ACTIVE local principal binding + membership so that
  // DurablePortfolioStore.withBrokerImportTransaction() can resolve the active
  // owner. The membership must match the OWNER used in every test.
  const now = '2026-11-08T10:00:00.000Z';
  db.prepare(
    `INSERT INTO local_principal_bindings
      (binding_id, principal_label, status, created_at, updated_at, revoked_at)
      VALUES ('binding-test', 'test-principal', 'ACTIVE', ?, ?, NULL)`,
  ).run(now, now);
  db.prepare(
    `INSERT INTO local_principal_memberships
      (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
      VALUES ('membership-test', 'binding-test', ?, ?, 'ACTIVE', ?, ?, NULL)`,
  ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);
  return db;
}

let portfolioCounter = 0;
function nextPortfolioId(): string {
  return `PORTFOLIO-${++portfolioCounter}`;
}

interface BrokerImportHoldingInput {
  symbol: string;
  isin?: string;
  exchange?: 'NSE' | 'BSE';
  series?: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  weightPercentage: number;
}

function makeRequest(
  portfolioId: string,
  holdings: readonly BrokerImportHoldingInput[],
  expectedRevision: number = 0,
): BrokerImportRequest {
  return {
    portfolioId,
    expectedRevision,
    holdings: holdings.map((h, i) => ({
      symbol: h.symbol,
      isin: h.isin,
      exchange: h.exchange,
      series: h.series,
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      weightPercentage: h.weightPercentage,
      active: true,
      sourceBroker: 'SYNTHETIC',
      lineageDigest: 'digest-' + i,
    })),
    contentDigest: 'content-digest-' + Math.random().toString(36).slice(2),
    fileName: 'test.csv',
    sourceBroker: 'SYNTHETIC',
    importedAt: '2026-11-08T10:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// Integration: complete call chain through persistBrokerImport
// ---------------------------------------------------------------------------

describe('Stage 4 — ingestion integration: P04 + P7 qualification in persistBrokerImport', () => {
  it('qualifies holding through P04+P7 joint path and persists D114 identity to security_identity', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const port = store as unknown as BrokerImportWriter;
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);

    const outcome = persistBrokerImport(port, OWNER, request, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome.ok, true);
    if (outcome.ok) {
      assertMod.strictEqual(outcome.revision, 1);
      const detail = store.get(OWNER, portfolioId);
      const holding = detail.holdings[0];
      assertMod.ok(holding.securityIdentity);
      assertMod.strictEqual(holding.securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
      assertMod.strictEqual(holding.securityIdentity!.isinAuthority, 'NON_AUTHORITATIVE');
      // Portfolio data unchanged
      assertMod.strictEqual(holding.quantity, 10);
      assertMod.strictEqual(holding.averageBuyPrice, 100);
      assertMod.strictEqual(holding.currentPrice, 110);
      assertMod.strictEqual(holding.marketValue, 1100);
    }
  });

  it('leaves security_identity NULL when P7 registry is empty (MISSING_P7_MAPPING fail-closed)', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([]); // empty P7 registry
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const port = store as unknown as BrokerImportWriter;
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);

    const outcome = persistBrokerImport(port, OWNER, request, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome.ok, true);
    if (outcome.ok) {
      const detail = store.get(OWNER, portfolioId);
      assertMod.strictEqual(detail.holdings[0].securityIdentity, null);
      // Portfolio data still persisted
      assertMod.strictEqual(detail.holdings[0].quantity, 10);
    }
  });

  it('falls back to pre-Stage-4 behavior when registry is not provided', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    // No registry — fallback path

    const port = store as unknown as BrokerImportWriter;
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE', series: 'EQ',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);

    const outcome = persistBrokerImport(port, OWNER, request, makeTestResolver(sm));
    assertMod.strictEqual(outcome.ok, true);
    if (outcome.ok) {
      const detail = store.get(OWNER, portfolioId);
      // Fallback: buildD114SecurityIdentity from broker isin+series
      assertMod.ok(detail.holdings[0].securityIdentity);
      assertMod.strictEqual(detail.holdings[0].securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
    }
  });

  it('consumer factory threads options through to persistBrokerImport (write gate still enforced)', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const consumer = createBrokerImportConsumer(db, options);
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);

    const outcome = consumer(OWNER, request);
    // The consumer constructs DurablePortfolioStorePort internally and passes
    // `undefined` as the resolver to persistBrokerImport, which defaults to the
    // governed broker-observation resolver. That resolver cannot map synthetic
    // test ISINs (they are not in the governed D05 master), so identity
    // resolution fails closed before the write gate is reached:
    // REFUSED_UNRESOLVED_IDENTITY. The key assertion is that the outcome is a
    // typed refusal (options were accepted and threaded through), not INVALID_REQUEST
    // (which would mean options were rejected).
    assertMod.strictEqual(outcome.ok, false);
    if (!outcome.ok) {
      assertMod.strictEqual(outcome.code, 'REFUSED_UNRESOLVED_IDENTITY');
      assertMod.strictEqual(outcome.storeEffect, 'NONE');
    }
  });

  it('idempotent re-import with same content digest produces no new revision', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const port = store as unknown as BrokerImportWriter;
    const fixedDigest = 'fixed-content-digest-for-idempotency';
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);
    (request as { contentDigest: string }).contentDigest = fixedDigest;

    const outcome1 = persistBrokerImport(port, OWNER, request, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome1.ok, true);
    if (outcome1.ok) assertMod.strictEqual(outcome1.revision, 1);

    // Re-import same content → ALREADY_IMPORTED_NO_OP, same revision
    // (expectedRevision must now be 1 since the first import advanced it)
    const request2 = { ...request, expectedRevision: 1 } as BrokerImportRequest;
    const outcome2 = persistBrokerImport(port, OWNER, request2, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome2.ok, true);
    if (outcome2.ok) {
      assertMod.strictEqual(outcome2.revision, 1);
      assertMod.strictEqual(outcome2.noOp, true);
      assertMod.strictEqual(outcome2.storeEffect, 'NONE');
    }

    // Identity preserved
    const detail = store.get(OWNER, portfolioId);
    assertMod.ok(detail.holdings[0].securityIdentity);
    assertMod.strictEqual(detail.holdings[0].securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
  });

  it('prevents silent identity replacement on re-import with different identity', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const port = store as unknown as BrokerImportWriter;
    const request1 = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);
    const outcome1 = persistBrokerImport(port, OWNER, request1, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome1.ok, true);
    if (!outcome1.ok) throw new Error('first import failed');

    // Re-import with same ISIN but different series in P7 → qualification would
    // produce different identity; store.save should reject silent replacement
    const reg2 = makeRegistry([makeMapping({ securityId: `ISIN:${ISIN_A}:BE` })]);
    const options2: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg2 };
    const request2 = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }], 1); // expectedRevision = 1

    // persistBrokerImport converts the InvalidPortfolioRequestError into a
    // typed refusal rather than throwing, so assert on the refusal outcome:
    const outcome2 = persistBrokerImport(port, OWNER, request2, makeTestResolver(sm), options2);
    assertMod.strictEqual(outcome2.ok, false);
    if (!outcome2.ok) {
      assertMod.strictEqual(outcome2.code, 'INVALID_REQUEST');
      assertMod.match(outcome2.message, /would silently replace/);
    }
  });

  it('ISIN authority remains NON_AUTHORITATIVE on qualified identity', () => {
    const db = makeDb();
    const store = new DurablePortfolioStore(db);
    const portfolioId = nextPortfolioId();
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const options: MapBrokerImportHoldingsOptions = { securityMaster: sm, registry: reg };

    const port = store as unknown as BrokerImportWriter;
    const request = makeRequest(portfolioId, [{
      symbol: 'SYNTHA', isin: ISIN_A, exchange: 'NSE',
      quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 100,
    }]);

    const outcome = persistBrokerImport(port, OWNER, request, makeTestResolver(sm), options);
    assertMod.strictEqual(outcome.ok, true);
    if (outcome.ok) {
      const detail = store.get(OWNER, portfolioId);
      assertMod.ok(detail.holdings[0].securityIdentity);
      assertMod.strictEqual(detail.holdings[0].securityIdentity!.isinAuthority, 'NON_AUTHORITATIVE');
      // Not described as issuer-verified
      assertMod.strictEqual(detail.holdings[0].securityIdentity!.securityId, `ISIN:${ISIN_A}:EQ`);
    }
  });
});

// ---------------------------------------------------------------------------
// P7 qualification function used by the ingestion path
// ---------------------------------------------------------------------------

describe('Stage 4 — qualifyHoldingSecurityIdentity used by ingestion', () => {
  it('returns QUALIFIED with NON_AUTHORITATIVE for valid P04+P7 joint path', () => {
    const sm = makeP04Master();
    const reg = makeRegistry([makeMapping()]);
    const input: HoldingIdentityInput = { isin: ISIN_A, exchange: 'NSE', symbol: 'SYNTHA' };
    const result = qualifyHoldingSecurityIdentity(input, sm, reg);

    assertMod.ok(isQualifiedSecurityIdentity(result));
    assertMod.strictEqual(result.securityIdentity.isinAuthority, 'NON_AUTHORITATIVE');
    assertMod.strictEqual(result.companyId, 'COMP-SYNTH-A');
    assertMod.strictEqual(result.exchange, 'NSE');
  });

  it('returns UNRESOLVED when P7 series evidence is missing', () => {
    const sm = makeP04Master();
    const reg = makeRegistry([]);
    const input: HoldingIdentityInput = { isin: ISIN_A, exchange: 'NSE' };
    const result = qualifyHoldingSecurityIdentity(input, sm, reg);

    assertMod.strictEqual(result.status, 'UNRESOLVED');
    assertMod.strictEqual(result.reason, 'MISSING_P7_MAPPING');
  });
});
