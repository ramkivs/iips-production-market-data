/**
 * Institutional Investment Platform System (IIPS)
 * IU-3 — First Non-Production IRR -> IPD PIT Read Boundary — Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / IU-3
 *
 * Proves the securityId-addressed PIT read service that is the destination of
 * the first non-production IRR -> IPD integration slice:
 *
 *   - delegates to the authoritative PointInTimeStore (no second store);
 *   - is addressed by securityId + domain + asOf, never by companyId;
 *   - isolates same-ISIN/different-series identities;
 *   - never leaks a future vintage;
 *   - fails closed on every invalid, ambiguous or absent case;
 *   - preserves IPD provenance verbatim.
 *
 * ADDITIVE TESTS ONLY. No existing test is modified, weakened, or deleted.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  PointInTimeStore,
  PitReadService,
  createCanonicalEnvelope,
} from '../src/index.js';
import type {
  CanonicalEnvelope,
  MarketQuotePayload,
  OHLCVCandle,
  PitReadRequest,
} from '../src/index.js';

// ──────────────────────────────────────────────────────────────────────────
// Deterministic fixture — the proven same-ISIN/multi-series pair.
// ──────────────────────────────────────────────────────────────────────────

const SWAN_ISIN = 'INE665A01038';
const SWAN_BL = `ISIN:${SWAN_ISIN}:BL`;
const SWAN_EQ = `ISIN:${SWAN_ISIN}:EQ`;

const T1 = '2026-01-05T00:00:00.000Z';
const T2 = '2026-02-10T00:00:00.000Z';
const T3 = '2026-03-15T00:00:00.000Z';

function provenanceFor(asOf: string, dataVersion: string) {
  return {
    sourceClassification: 'CANONICAL_MARKET_DATA' as const,
    vendorTier: 'MOCK_FIXTURE' as const,
    asOf,
    receivedAt: asOf,
    evaluatedAt: asOf,
    dataVersion,
    lineageHash: `fixture-${dataVersion}`,
    qualityState: 'GOOD' as const,
  };
}

function d02Envelope(
  companyId: string,
  securityId: string,
  asOf: string,
  close: number,
  version: string,
): CanonicalEnvelope<OHLCVCandle> {
  return createCanonicalEnvelope<OHLCVCandle>({
    envelopeId: `env-d02-${companyId}-${version}`,
    domain: 'D02_OHLCV',
    mode: 'PIT',
    companyId,
    securityId,
    payload: {
      companyId,
      open: close - 1,
      high: close + 2,
      low: close - 3,
      close,
      volume: 1_000_000,
    } as unknown as OHLCVCandle,
    provenance: provenanceFor(asOf, version),
    timestamp: asOf,
  });
}

/** A D01 quote envelope, used to prove domain-scoped isolation. */
function d01Envelope(
  companyId: string,
  securityId: string,
  asOf: string,
  ltp: number,
): CanonicalEnvelope<MarketQuotePayload> {
  return createCanonicalEnvelope<MarketQuotePayload>({
    envelopeId: `env-d01-${companyId}-${ltp}`,
    domain: 'D01_QUOTES',
    mode: 'PIT',
    companyId,
    securityId,
    payload: { companyId, ltp, currency: 'INR' } as unknown as MarketQuotePayload,
    provenance: provenanceFor(asOf, 'v-d01'),
    timestamp: asOf,
  });
}

/**
 * The authoritative IPD PIT store, populated exactly as the D114 historical
 * ingestion path would populate it: BL and EQ are distinct series-aware
 * identities under the same companyId.
 */
function buildStore(): PointInTimeStore<OHLCVCandle> {
  const store = new PointInTimeStore<OHLCVCandle>();
  store.append(d02Envelope('SWANENERGY', SWAN_BL, T1, 10, 'bl-1'));
  store.append(d02Envelope('SWANENERGY', SWAN_BL, T2, 12, 'bl-2'));
  store.append(d02Envelope('SWANENERGY', SWAN_EQ, T1, 500, 'eq-1'));
  store.append(d02Envelope('SWANENERGY', SWAN_EQ, T3, 520, 'eq-2'));
  return store;
}

// ──────────────────────────────────────────────────────────────────────────
// IU3-01..06 — request-contract enforcement (fail closed)
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — mandatory request contract', () => {
  it('IU3-01 rejects a missing securityId', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ domain: 'D02_OHLCV', asOf: T2 } as unknown as PitReadRequest);
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-02 rejects a blank securityId', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: '   ', domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-03 rejects a malformed securityId (bare ISIN, no series)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_ISIN, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-04 rejects a malformed securityId (blank series)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: `ISIN:${SWAN_ISIN}:`, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-05 rejects a malformed securityId (wrong-length ISIN)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: 'ISIN:SHORT:EQ', domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-06 rejects a malformed securityId (wrong prefix)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: `FIGI:${SWAN_ISIN}:EQ`, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });
});

describe('IU-3 PIT read boundary — mandatory domain and asOf', () => {
  it('IU3-07 rejects a missing domain', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, asOf: T2 } as unknown as PitReadRequest);
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_DOMAIN');
  });

  it('IU3-08 rejects an unknown domain', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({
      securityId: SWAN_BL,
      domain: 'D99_MADE_UP' as never,
      asOf: T2,
    });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_DOMAIN');
  });

  it('IU3-09 rejects a missing asOf', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV' } as unknown as PitReadRequest);
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_ASOF');
  });

  it('IU3-10 rejects a non-ISO-8601 asOf', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: 'not-a-date' });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_ASOF');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// IU3-11..16 — series isolation (the core proof)
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — series isolation', () => {
  it('IU3-11 a BL request returns BL data', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.securityId, SWAN_BL);
    assert.strictEqual(r.found === true && r.payload.close, 12);
  });

  it('IU3-12 an EQ request returns EQ data', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_EQ, domain: 'D02_OHLCV', asOf: T3 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.securityId, SWAN_EQ);
    assert.strictEqual(r.found === true && r.payload.close, 520);
  });

  it('IU3-13 BL cannot retrieve EQ (no cross-series leakage)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T3 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.payload.close, 12); // BL's latest, not EQ's 520
  });

  it('IU3-14 EQ cannot retrieve BL (no cross-series leakage)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_EQ, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.payload.close, 500); // EQ@T1, not BL@T2
  });

  it('IU3-15 same ISIN, different series, are distinct identities', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const bl = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    const eq = svc.queryAsOf({ securityId: SWAN_EQ, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(bl.found, true);
    assert.strictEqual(eq.found, true);
    if (bl.found !== true || eq.found !== true) {
      throw new Error('unreachable: both series must resolve');
    }
    assert.notStrictEqual(bl.securityId, eq.securityId);
    assert.notStrictEqual(bl.payload.close, eq.payload.close);
    assert.notStrictEqual(bl.resolvedAsOf, eq.resolvedAsOf);
  });

  it('IU3-16 an unknown series fails closed rather than falling back', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: `ISIN:${SWAN_ISIN}:ZZ`, domain: 'D02_OHLCV', asOf: T3 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// IU3-17..20 — PIT semantics: vintage selection and future-leakage protection
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — vintage selection and future leakage', () => {
  it('IU3-17 returns the latest vintage strictly <= asOf', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found === true && r.resolvedAsOf, T2);
  });

  it('IU3-18 an asOf before any record returns NOT_FOUND', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({
      securityId: SWAN_BL,
      domain: 'D02_OHLCV',
      asOf: '2025-01-01T00:00:00.000Z',
    });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-19 never returns a future vintage (resolvedAsOf <= asOf)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T1 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.resolvedAsOf, T1);
    assert.ok(Date.parse(r.found === true ? r.resolvedAsOf : '') <= Date.parse(T1));
  });

  it('IU3-20 an exactly-boundary asOf returns that vintage', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found === true && r.payload.close, 12);
    assert.strictEqual(r.found === true && r.resolvedAsOf, T2);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// IU3-21..26 — domain scoping, ambiguity, provenance, delegation
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — domain scoping and provenance', () => {
  it('IU3-21 a D01 request does not return a D02 record', () => {
    const store = new PointInTimeStore<OHLCVCandle>();
    store.append(d01Envelope('SWANENERGY', SWAN_BL, T2, 77));
    const svc = new PitReadService<OHLCVCandle>(store);
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-22 a D01 request returns the D01 record', () => {
    const store = new PointInTimeStore<OHLCVCandle>();
    store.append(d01Envelope('SWANENERGY', SWAN_BL, T2, 77));
    const svc = new PitReadService<OHLCVCandle>(store);
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D01_QUOTES', asOf: T2 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.payload.ltp, 77);
  });

  it('IU3-23 provenance is preserved verbatim', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.provenance.asOf, T2);
    assert.strictEqual(r.found === true && r.provenance.receivedAt, T2);
    assert.strictEqual(r.found === true && r.provenance.evaluatedAt, T2);
    assert.strictEqual(r.found === true && r.provenance.dataVersion, 'bl-2');
    assert.strictEqual(r.found === true && r.provenance.lineageHash, 'fixture-bl-2');
    assert.strictEqual(r.found === true && r.provenance.qualityState, 'GOOD');
  });

  it('IU3-24 a hit echoes the requested asOf and securityId unchanged', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found === true && r.asOf, T2);
    assert.strictEqual(r.found === true && r.securityId, SWAN_BL);
    assert.strictEqual(r.found === true && r.domain, 'D02_OHLCV');
  });

  it('IU3-25 a miss is always explicit (never a silent undefined payload)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({
      securityId: 'ISIN:INE000000001:EQ',
      domain: 'D02_OHLCV',
      asOf: T3,
    });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-26 the service creates no store of its own (delegates to the injected one)', () => {
    const store = buildStore();
    const svc = new PitReadService<OHLCVCandle>(store);
    const before = store.getRecordCount();
    svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(store.getRecordCount(), before);
    assert.strictEqual(store.listAdmittedSeriesKeys().length, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// IU3-27..32 — ambiguity and legacy coexistence
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — ambiguity and legacy coexistence', () => {
  it('IU3-27 the same securityId under two companyIds fails closed as AMBIGUOUS', () => {
    const store = new PointInTimeStore<OHLCVCandle>();
    store.append(d02Envelope('SWANENERGY', SWAN_BL, T1, 10, 'a'));
    store.append(d02Envelope('SWANENERGY_NSE', SWAN_BL, T1, 99, 'b'));
    const svc = new PitReadService<OHLCVCandle>(store);
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'AMBIGUOUS');
  });

  it('IU3-28 an empty store fails closed for any identity', () => {
    const svc = new PitReadService<OHLCVCandle>(new PointInTimeStore<OHLCVCandle>());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-29 legacy companyId-only records are invisible to a securityId lookup', () => {
    // A legacy (non-series-aware) admission under the same companyId/domain must
    // never be selected by a series-aware request.
    const store = new PointInTimeStore<OHLCVCandle>();
    store.append(
      createCanonicalEnvelope<OHLCVCandle>({
        envelopeId: 'env-legacy',
        domain: 'D02_OHLCV',
        mode: 'PIT',
        companyId: 'SWANENERGY',
        payload: { close: 1 } as unknown as OHLCVCandle,
        provenance: provenanceFor(T2, 'legacy'),
        timestamp: T2,
      }),
    );
    const svc = new PitReadService<OHLCVCandle>(store);
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-30 the IU-1 key grammar is unchanged by the read boundary', () => {
    const store = buildStore();
    const keys = store.listAdmittedSeriesKeys();
    assert.deepStrictEqual(keys, [
      'SWANENERGY:D02_OHLCV:ISIN:INE665A01038:BL',
      'SWANENERGY:D02_OHLCV:ISIN:INE665A01038:EQ',
    ]);
  });

  it('IU3-31 no companyId is required or accepted by the request contract', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.strictEqual(r.found, true);
    assert.strictEqual('companyId' in r, false);
  });

  it('IU3-32 deterministic: repeated identical requests return identical results', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const a = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    const b = svc.queryAsOf({ securityId: SWAN_BL, domain: 'D02_OHLCV', asOf: T2 });
    assert.deepStrictEqual(a, b);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// IU3-33..38 — the cross-repository contract as IRR emits it (end-to-end)
//
// A single-process end-to-end across two independent repositories is not
// achievable in non-production (no shared package, no dependency edge). This
// section therefore drives the IPD read service with the EXACT request shape the
// IRR boundary emits, proving the destination half of the slice end-to-end.
// ──────────────────────────────────────────────────────────────────────────

describe('IU-3 PIT read boundary — IRR -> IPD end-to-end (cross-repository contract)', () => {
  /** The request exactly as the IRR PIT read boundary emits it after validation. */
  function irrRequest(securityId: string, domain: 'D01_QUOTES' | 'D02_OHLCV', asOf: string) {
    return { securityId, domain, asOf } as PitReadRequest;
  }

  it('IU3-33 IRR BL request -> IPD -> BL record -> IRR response', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(SWAN_BL, 'D02_OHLCV', T2));
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.securityId, SWAN_BL);
    assert.strictEqual(r.found === true && r.payload.close, 12);
    assert.strictEqual(r.found === true && r.provenance.qualityState, 'GOOD');
  });

  it('IU3-34 IRR EQ request -> IPD -> EQ record -> IRR response', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(SWAN_EQ, 'D02_OHLCV', T3));
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.found === true && r.payload.close, 520);
  });

  it('IU3-35 IRR request for an absent series fails closed', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(`ISIN:${SWAN_ISIN}:XX`, 'D02_OHLCV', T3));
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'NOT_FOUND');
  });

  it('IU3-36 IRR request with a bare ISIN fails closed (no series inference)', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(SWAN_ISIN, 'D02_OHLCV', T3));
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.found === false && r.reason, 'INVALID_IDENTITY');
  });

  it('IU3-37 IRR request never leaks a future vintage', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(SWAN_BL, 'D02_OHLCV', T1));
    assert.strictEqual(r.found === true && r.resolvedAsOf, T1);
    assert.ok(Date.parse(r.found === true ? r.resolvedAsOf : '') <= Date.parse(T1));
  });

  it('IU3-38 IRR request never returns a cross-series record', () => {
    const svc = new PitReadService<OHLCVCandle>(buildStore());
    const r = svc.queryAsOf(irrRequest(SWAN_BL, 'D02_OHLCV', T3));
    assert.strictEqual(r.found === true && r.securityId, SWAN_BL);
    assert.notStrictEqual(r.found === true && r.payload.close, 520);
  });
});
