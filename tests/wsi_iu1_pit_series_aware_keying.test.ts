/**
 * Institutional Investment Platform System (IIPS)
 * IU-1 — IPD-Internal PIT Series-Aware Keying — Implementation Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / IU-1
 * Authority: evidence/target-shell-integration/IU-1-PIT-SERIES-AWARE-KEYING-IMPLEMENTATION-AUTHORITY-ACT.md
 *
 * ADDITIVE TESTS ONLY. No existing test is modified, weakened, or deleted.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  PointInTimeStore,
  buildPitKey,
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  createCanonicalEnvelope,
  computeLineageHash,
  CmUdiffParser,
  HistoricalPitIngestionLoader,
} from '../src/index.js';
import type {
  D114SecurityIdentity,
  MarketQuotePayload,
  OHLCVCandle,
  CanonicalEnvelope,
  CmUdiffRawRecord,
} from '../src/index.js';

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — real ISINs reused from the existing D114 historical-feasibility
// suite, plus the donor's proven same-ISIN/multi-series pair (SWANENERGY).
// ──────────────────────────────────────────────────────────────────────────

const SWAN_ISIN = 'INE665A01038';
const HDFCLIFE_ISIN = 'INE795G01014';

function provenanceFor(asOf: string, dataVersion: string) {
  return {
    sourceClassification: 'CANONICAL_MARKET_DATA' as const,
    vendorTier: 'MOCK_FIXTURE' as const,
    asOf,
    receivedAt: asOf,
    evaluatedAt: asOf,
    dataVersion,
    lineageHash: 'fixture',
    qualityState: 'GOOD' as const,
  };
}

/** Builds a D01 envelope, optionally carrying a series-aware securityId. */
function d01Envelope(
  companyId: string,
  asOf: string,
  ltp: number,
  securityId?: string,
): CanonicalEnvelope<MarketQuotePayload> {
  const payload = {
    companyId,
    symbol: companyId,
    exchange: 'NSE' as const,
    currency: 'INR' as const,
    bid: ltp - 0.05,
    ask: ltp + 0.05,
    ltp,
    open: ltp,
    high: ltp,
    low: ltp,
    previousClose: ltp,
    volume: 1000,
    change: 0,
    pctChange: 0,
  };
  return createCanonicalEnvelope({
    envelopeId: `env-${companyId}-${asOf}-${ltp}-${securityId ?? 'nosec'}`,
    domain: 'D01_QUOTES',
    mode: 'PIT',
    companyId,
    ...(securityId !== undefined ? { securityId } : {}),
    payload,
    provenance: provenanceFor(asOf, `v-${ltp}`),
  });
}

function d02Envelope(
  companyId: string,
  asOf: string,
  close: number,
  securityId?: string,
): CanonicalEnvelope<OHLCVCandle> {
  const payload = {
    companyId,
    symbol: companyId,
    candleStart: `${asOf.slice(0, 10)}T09:15:00.000Z`,
    candleEnd: `${asOf.slice(0, 10)}T15:30:00.000Z`,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
    isAdjusted: false,
  };
  return createCanonicalEnvelope({
    envelopeId: `env-d02-${companyId}-${asOf}-${close}-${securityId ?? 'nosec'}`,
    domain: 'D02_OHLCV',
    mode: 'PIT',
    companyId,
    ...(securityId !== undefined ? { securityId } : {}),
    payload,
    provenance: provenanceFor(asOf, `v-${close}`),
  });
}

function udiffRow(series: string, isin: string, overrides: Partial<CmUdiffRawRecord> = {}): CmUdiffRawRecord {
  return {
    TradDt: '2024-08-01',
    BizDt: '2024-08-01',
    Sgmt: 'CM',
    Src: 'NSE',
    ISIN: isin,
    TckrSymb: 'SWANENERGY',
    SctySrs: series,
    ClsPric: '420.00',
    LastPric: '420.00',
    PrvsClsgPric: '418.00',
    SttlmPric: '420.00',
    OpnPric: '419.00',
    HghPric: '421.00',
    LwPric: '418.00',
    TtlTradgVol: '1500000',
    ...overrides,
  };
}

describe('IU-1 — IPD-Internal PIT Series-Aware Keying', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. PIT key construction
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-A — PIT key construction', () => {
    it('IU1-01: no series-aware identity reproduces the historical key exactly', () => {
      assert.strictEqual(buildPitKey('TCS', 'D01_QUOTES'), 'TCS:D01_QUOTES');
      assert.strictEqual(buildPitKey('INFY', 'D02_OHLCV'), 'INFY:D02_OHLCV');
    });

    it('IU1-02: a series-aware identity extends the key with the securityId', () => {
      assert.strictEqual(
        buildPitKey('SWANENERGY', 'D02_OHLCV', 'ISIN:INE665A01038:BL'),
        'SWANENERGY:D02_OHLCV:ISIN:INE665A01038:BL',
      );
    });

    it('IU1-03: same ISIN + different series yield different keys', () => {
      const bl = buildPitKey('SWANENERGY', 'D02_OHLCV', 'ISIN:INE665A01038:BL');
      const eq = buildPitKey('SWANENERGY', 'D02_OHLCV', 'ISIN:INE665A01038:EQ');
      assert.notStrictEqual(bl, eq);
    });

    it('IU1-04: there is exactly one key grammar (no competing forms)', () => {
      // company/domain prefix, then at most one appended securityId segment
      // (which itself carries the ISIN:isin:series grammar).
      assert.strictEqual(buildPitKey('C', 'D01_QUOTES').split(':').length, 2);
      const withSid = buildPitKey('C', 'D01_QUOTES', 'ISIN:INE665A01038:BL');
      assert.ok(withSid.startsWith('C:D01_QUOTES:'));
      assert.strictEqual(withSid, 'C:D01_QUOTES:ISIN:INE665A01038:BL');
    });

    it('IU1-05: blank companyId fails closed', () => {
      assert.throws(() => buildPitKey('', 'D01_QUOTES'), /non-empty companyId/);
      assert.throws(() => buildPitKey('   ', 'D01_QUOTES'), /non-empty companyId/);
    });

    it('IU1-06: blank domain fails closed', () => {
      assert.throws(() => buildPitKey('TCS', '' as never), /non-empty domain/);
    });

    it('IU1-07: a supplied-but-blank securityId fails closed (no silent default series)', () => {
      assert.throws(() => buildPitKey('TCS', 'D01_QUOTES', ''), /fail closed/);
      assert.throws(() => buildPitKey('TCS', 'D01_QUOTES', '   '), /fail closed/);
    });

    it('IU1-08: undefined securityId is distinct from a blank securityId', () => {
      // Absent identity is legal (legacy record); blank identity is not.
      assert.doesNotThrow(() => buildPitKey('TCS', 'D01_QUOTES', undefined));
      assert.throws(() => buildPitKey('TCS', 'D01_QUOTES', ''));
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. PIT append
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-A — PIT append', () => {
    it('IU1-09: append admits a record under its series-aware identity', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = 'ISIN:INE665A01038:BL';
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, sid));

      assert.strictEqual(store.getRecordCount(), 1);
      const hit = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: sid,
      });
      assert.ok(hit);
      assert.strictEqual(hit.securityId, sid);
    });

    it('IU1-10: append still admits legacy records with no series-aware identity', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200));

      assert.strictEqual(store.getRecordCount(), 1);
      const hit = store.queryAsOf({
        companyId: 'TCS',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
      });
      assert.ok(hit);
      assert.strictEqual(hit.securityId, undefined);
    });

    it('IU1-11: append preserves immutability (frozen envelope)', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200, 'ISIN:INE467B01029:EQ'));
      const hit = store.queryAsOf({
        companyId: 'TCS',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE467B01029:EQ',
      });
      assert.ok(hit);
      assert.ok(Object.isFrozen(hit));
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. queryAsOf
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-A — queryAsOf', () => {
    it('IU1-12: as-of lookup returns only the matching security identity', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      const bl = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:BL',
      });
      assert.ok(bl);
      assert.strictEqual((bl.payload as MarketQuotePayload).ltp, 100);
      assert.strictEqual(bl.securityId, 'ISIN:INE665A01038:BL');
    });

    it('IU1-13: an unknown securityId fails closed (undefined, never a fallback)', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));

      const miss = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:ZZ',
      });
      assert.strictEqual(miss, undefined);
    });

    it('IU1-14: a series-aware lookup never returns a differently-seriesd record', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));

      // Only a BL record exists; an EQ lookup must not fall back to it.
      const eq = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:EQ',
      });
      assert.strictEqual(eq, undefined);
    });

    it('IU1-15: a company/domain-only lookup stays unambiguous when one series exists', () => {
      // Historical compatibility: existing callers pass no securityId.
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200, 'ISIN:INE467B01029:EQ'));

      const hit = store.queryAsOf({
        companyId: 'TCS',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
      });
      assert.ok(hit);
      assert.strictEqual((hit.payload as MarketQuotePayload).ltp, 4200);
    });

    it('IU1-16: a company/domain-only lookup across multiple series fails closed', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      assert.throws(
        () =>
          store.queryAsOf({
            companyId: 'SWANENERGY',
            domain: 'D01_QUOTES',
            asOf: '2024-08-02T00:00:00.000Z',
          }),
        /Ambiguous PIT identity/,
      );
    });

    it('IU1-17: ambiguity never resolves to the first or an EQ default', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      // EQ admitted FIRST; a legacy lookup must still fail closed, not pick EQ.
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));

      assert.throws(
        () =>
          store.queryAsOf({
            companyId: 'SWANENERGY',
            domain: 'D01_QUOTES',
            asOf: '2024-08-02T00:00:00.000Z',
          }),
        /Ambiguous PIT identity/,
      );
    });

    it('IU1-18: asOf semantics are unchanged (no future leakage)', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = 'ISIN:INE467B01029:EQ';
      store.append(d01Envelope('TCS', '2026-09-01T10:00:00.000Z', 3000, sid));
      store.append(d01Envelope('TCS', '2026-09-10T10:00:00.000Z', 3100, sid));
      store.append(d01Envelope('TCS', '2026-09-18T10:00:00.000Z', 3200, sid));

      const before = store.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2026-08-01T00:00:00.000Z', securityId: sid });
      const mid = store.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2026-09-15T00:00:00.000Z', securityId: sid });
      const after = store.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2026-09-30T00:00:00.000Z', securityId: sid });

      assert.strictEqual(before, undefined);
      assert.strictEqual((mid as CanonicalEnvelope<MarketQuotePayload>).payload.ltp, 3100);
      assert.strictEqual((after as CanonicalEnvelope<MarketQuotePayload>).payload.ltp, 3200);
    });

    it('IU1-19: chronological ordering within a series-aware identity is preserved', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = 'ISIN:INE467B01029:EQ';
      store.append(d01Envelope('TCS', '2026-09-18T10:00:00.000Z', 3200, sid));
      store.append(d01Envelope('TCS', '2026-09-01T10:00:00.000Z', 3000, sid));
      store.append(d01Envelope('TCS', '2026-09-10T10:00:00.000Z', 3100, sid));

      const range = store.queryRange('TCS', 'D01_QUOTES', '2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', sid);
      assert.deepStrictEqual(
        range.map((e) => (e.payload as MarketQuotePayload).ltp),
        [3000, 3100, 3200],
      );
    });

    it('IU1-20: an invalid asOf timestamp still throws', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('TCS', '2026-09-01T10:00:00.000Z', 3000, 'ISIN:INE467B01029:EQ'));
      assert.throws(
        () => store.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: 'not-a-date', securityId: 'ISIN:INE467B01029:EQ' }),
        /Invalid asOf timestamp/,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. queryRange
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-A — queryRange', () => {
    it('IU1-21: range lookup returns only the matching security identity', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      const bl = store.queryRange('SWANENERGY', 'D01_QUOTES', '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z', 'ISIN:INE665A01038:BL');
      assert.strictEqual(bl.length, 1);
      assert.strictEqual((bl[0].payload as MarketQuotePayload).ltp, 100);
    });

    it('IU1-22: range lookup without securityId stays unambiguous for a single series', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200, 'ISIN:INE467B01029:EQ'));
      store.append(d01Envelope('TCS', '2024-08-05T10:00:00.000Z', 4300, 'ISIN:INE467B01029:EQ'));

      const all = store.queryRange('TCS', 'D01_QUOTES', '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z');
      assert.strictEqual(all.length, 2);
    });

    it('IU1-23: range lookup across multiple series without securityId fails closed', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      assert.throws(
        () => store.queryRange('SWANENERGY', 'D01_QUOTES', '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z'),
        /Ambiguous PIT identity/,
      );
    });

    it('IU1-24: an unknown series in a range query returns an empty list, not another series', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));

      const none = store.queryRange('SWANENERGY', 'D01_QUOTES', '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z', 'ISIN:INE665A01038:EQ');
      assert.deepStrictEqual(none, []);
    });

    it('IU1-25: queryRange bounds are inclusive and unchanged', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = 'ISIN:INE467B01029:EQ';
      store.append(d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200, sid));
      store.append(d01Envelope('TCS', '2024-08-05T10:00:00.000Z', 4300, sid));
      store.append(d01Envelope('TCS', '2024-08-09T10:00:00.000Z', 4400, sid));

      const bounded = store.queryRange('TCS', 'D01_QUOTES', '2024-08-01T10:00:00.000Z', '2024-08-05T10:00:00.000Z', sid);
      assert.deepStrictEqual(
        bounded.map((e) => (e.payload as MarketQuotePayload).ltp),
        [4200, 4300],
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. D114 ingestion into PIT
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-D — D114 ingestion into PIT', () => {
    it('IU1-26: a D114 record carrying securityIdentity is admitted under its series-aware identity', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow('EQ', SWAN_ISIN));
      assert.ok(quote.securityIdentity);

      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = (quote.securityIdentity as D114SecurityIdentity).securityId;
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', quote.ltp, sid));

      const hit = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: sid,
      });
      assert.ok(hit);
      assert.strictEqual(hit.securityId, 'ISIN:INE665A01038:EQ');
    });

    it('IU1-27: the ingestion loader supplies the series-aware identity into PIT', () => {
      const loader = new HistoricalPitIngestionLoader();
      const csv =
        'TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd01,Rsvd02,Rsvd03,Rsvd04\n' +
        '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE665A01038,SWANENERGY,BL,419.00,421.00,418.00,420.00,420.00,418.00,0.0,420.00,0,0,1500000,630000000,50000,1,1,-,-,-,-,-\n' +
        '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE665A01038,SWANENERGY,EQ,419.00,421.00,418.00,420.00,420.00,418.00,0.0,420.00,0,0,1500000,630000000,50000,1,1,-,-,-,-,-';

      const result = loader.ingestSingleArchive(
        '2024-08-01',
        createSyntheticZip('BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv', csv),
        'BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip',
      );

      assert.strictEqual(result.success, true);
      // Both series are admitted — they are not deduplicated into one identity.
      assert.strictEqual(result.d01Count, 2);
      assert.strictEqual(result.duplicateCount, 0);

      const d01 = loader.getD01Store();
      const bl = d01.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:BL',
      });
      const eq = d01.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:EQ',
      });

      assert.ok(bl);
      assert.ok(eq);
      assert.strictEqual(bl.securityId, 'ISIN:INE665A01038:BL');
      assert.strictEqual(eq.securityId, 'ISIN:INE665A01038:EQ');
      assert.notStrictEqual(bl.envelopeId, eq.envelopeId);
    });

    it('IU1-28: the loader does not re-do IU-2 parser work (identity comes from the parser)', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow('BL', SWAN_ISIN));
      assert.ok(isD114SecurityIdentity(quote.securityIdentity));
      assert.strictEqual((quote.securityIdentity as D114SecurityIdentity).securityId, `ISIN:${SWAN_ISIN}:BL`);
      // companyId is untouched by the series-aware identity.
      assert.strictEqual(quote.companyId, 'SWANENERGY');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. Series-aware identity propagation through the envelope
  // ────────────────────────────────────────────────────────────────────────
  describe('IU1-C — CanonicalEnvelope identity propagation', () => {
    it('IU1-29: securityId is carried verbatim from the D114 identity', () => {
      const identity = buildD114SecurityIdentity(SWAN_ISIN, 'BL') as D114SecurityIdentity;
      const env = d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, identity.securityId);
      assert.strictEqual(env.securityId, identity.securityId);
      assert.strictEqual(env.securityId, `ISIN:${SWAN_ISIN}:BL`);
    });

    it('IU1-30: an envelope built without securityId keeps its previous shape', () => {
      const env = d01Envelope('TCS', '2024-08-01T10:00:00.000Z', 4200);
      assert.strictEqual('securityId' in env, false);
      assert.deepStrictEqual(Object.keys(env).sort(), [
        'companyId',
        'domain',
        'envelopeId',
        'mode',
        'payload',
        'provenance',
        'schemaVersion',
        'timestamp',
      ]);
    });

    it('IU1-31: companyId is never repurposed as the series-aware identity', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;
      assert.notStrictEqual('HDFCLIFE', identity.securityId);
      assert.notStrictEqual('HDFCLIFE', identity.isin);
      assert.notStrictEqual('HDFCLIFE', identity.series);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. Same-ISIN / different-series isolation (donor SWANENERGY semantics)
  // ────────────────────────────────────────────────────────────────────────
  describe('§12 — same-ISIN / different-series isolation', () => {
    it('IU1-32: BL and EQ records coexist as distinct PIT identities', () => {
      const store = new PointInTimeStore<OHLCVCandle>();
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, 'ISIN:INE665A01038:BL'));
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      assert.strictEqual(store.getRecordCount(), 2);
    });

    it('IU1-33: no cross-series leakage in either direction', () => {
      const store = new PointInTimeStore<OHLCVCandle>();
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, 'ISIN:INE665A01038:BL'));

      const eq = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D02_OHLCV',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:EQ',
      });
      assert.strictEqual(eq, undefined);

      const bl = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D02_OHLCV',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:BL',
      });
      assert.ok(bl);
      assert.strictEqual((bl.payload as OHLCVCandle).close, 420);
    });

    it('IU1-34: a bare ambiguous alias is never manufactured', () => {
      // A company/domain-only lookup over a multi-series identity must throw
      // rather than resolve to a bare alias or a default series.
      const store = new PointInTimeStore<OHLCVCandle>();
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, 'ISIN:INE665A01038:BL'));
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));

      assert.throws(
        () => store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D02_OHLCV', asOf: '2024-08-02T00:00:00.000Z' }),
        /Ambiguous PIT identity/,
      );
    });

    it('IU1-35: a missing series is never silently converted into a default', () => {
      const store = new PointInTimeStore<OHLCVCandle>();
      store.append(d02Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, 'ISIN:INE665A01038:BL'));

      // Asking for a series that was never admitted yields nothing — not EQ.
      const eq = store.queryRange('SWANENERGY', 'D02_OHLCV', '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z', 'ISIN:INE665A01038:EQ');
      assert.strictEqual(eq.length, 0);
    });

    it('IU1-36: series-aware identity does not leak across domains', () => {
      const store = new PointInTimeStore<unknown>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420, 'ISIN:INE665A01038:BL'));

      const hit = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D02_OHLCV',
        asOf: '2024-08-02T00:00:00.000Z',
        securityId: 'ISIN:INE665A01038:BL',
      });
      assert.strictEqual(hit, undefined);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 8. Ambiguous / missing identity fail-closed
  // ────────────────────────────────────────────────────────────────────────
  describe('§12 — ambiguous / missing identity fail-closed', () => {
    it('IU1-37: a malformed securityIdentity is not admitted under an ambiguous identity', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const malformed = { securityId: 'ISIN:INE665A01038', isin: SWAN_ISIN, series: 'BL', isinAuthority: 'WRONG' };

      // Fail closed: a present-but-malformed identity is rejected, never admitted.
      assert.strictEqual(isD114SecurityIdentity(malformed), false);
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 420));

      const hit = store.queryAsOf({
        companyId: 'SWANENERGY',
        domain: 'D01_QUOTES',
        asOf: '2024-08-02T00:00:00.000Z',
      });
      assert.ok(hit);
      assert.strictEqual(hit.securityId, undefined);
    });

    it('IU1-38: buildD114SecurityIdentity returns null for a missing series (no default)', () => {
      assert.strictEqual(buildD114SecurityIdentity(SWAN_ISIN, ''), null);
      assert.strictEqual(buildD114SecurityIdentity(SWAN_ISIN, '   '), null);
      assert.strictEqual(buildD114SecurityIdentity(SWAN_ISIN, undefined), null);
    });

    it('IU1-39: buildD114SecurityIdentity never defaults to EQ', () => {
      const bl = buildD114SecurityIdentity(SWAN_ISIN, 'BL') as D114SecurityIdentity;
      assert.strictEqual(bl.series, 'BL');
      assert.strictEqual(bl.securityId, `ISIN:${SWAN_ISIN}:BL`);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 9. Historical compatibility
  // ────────────────────────────────────────────────────────────────────────
  describe('§13 — historical compatibility', () => {
    it('IU1-40: legacy records (no securityId) are unchanged end to end', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('INFY', '2020-01-10T10:00:00.000Z', 1450));
      store.append(d01Envelope('INFY', '2020-01-15T10:00:00.000Z', 1465));

      const mid = store.queryAsOf({ companyId: 'INFY', domain: 'D01_QUOTES', asOf: '2020-01-12T00:00:00.000Z' });
      assert.ok(mid);
      assert.strictEqual((mid.payload as MarketQuotePayload).ltp, 1450);

      const range = store.queryRange('INFY', 'D01_QUOTES', '2020-01-01T00:00:00.000Z', '2020-01-20T00:00:00.000Z');
      assert.strictEqual(range.length, 2);
    });

    it('IU1-41: the historical key grammar is byte-identical for legacy records', () => {
      // The pre-IU-1 store used exactly `${companyId}:${domain}`.
      assert.strictEqual(buildPitKey('TCS', 'D01_QUOTES'), 'TCS:D01_QUOTES');
      assert.strictEqual(buildPitKey('TCS', 'D02_OHLCV'), 'TCS:D02_OHLCV');
      assert.strictEqual(buildPitKey('TCS', 'D03_FUNDAMENTALS'), 'TCS:D03_FUNDAMENTALS');
      assert.strictEqual(buildPitKey('TCS', 'D04_CORPORATE_ACTIONS'), 'TCS:D04_CORPORATE_ACTIONS');
    });

    it('IU1-42: an unrelated key domain is never silently changed', () => {
      const store = new PointInTimeStore<unknown>();
      store.append(d02Envelope('INFY', '2018-09-04T00:00:00.000Z', 500));

      const hit = store.queryAsOf({ companyId: 'INFY', domain: 'D02_OHLCV', asOf: '2018-09-05T00:00:00.000Z' });
      assert.ok(hit);
      assert.strictEqual(store.getRecordCount(), 1);
    });

    it('IU1-43: clear() resets both the store and the series index', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, 'ISIN:INE665A01038:BL'));
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 999, 'ISIN:INE665A01038:EQ'));
      assert.throws(() => store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2024-08-02T00:00:00.000Z' }));

      store.clear();
      assert.strictEqual(store.getRecordCount(), 0);
      // After clear, a legacy lookup is no longer ambiguous.
      assert.strictEqual(
        store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2024-08-02T00:00:00.000Z' }),
        undefined,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 10. Existing idempotency behaviour
  // ────────────────────────────────────────────────────────────────────────
  describe('§12/§15 — idempotency', () => {
    it('IU1-44: replaying the same series-aware record is idempotent', () => {
      const loader = new HistoricalPitIngestionLoader();
      const csv =
        'TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd01,Rsvd02,Rsvd03,Rsvd04\n' +
        '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE002A01018,RELIANCE,EQ,2500.00,2550.00,2480.00,2520.00,2520.00,2490.00,0.0,2520.00,0,0,500000,1260000000,15000,1,1,-,-,-,-,-';
      const zip = createSyntheticZip('cm01AUG2024bhav.csv', csv);

      const first = loader.ingestSingleArchive('2024-08-01', zip, 'cm01AUG2024bhav.csv.zip');
      const second = loader.ingestSingleArchive('2024-08-01', zip, 'cm01AUG2024bhav.csv.zip');

      assert.strictEqual(first.success, true);
      assert.strictEqual(second.success, true);
      assert.strictEqual(first.d01Count, 1);
      assert.strictEqual(second.d01Count, 0); // deduplicated
      assert.strictEqual(loader.getD01Store().getRecordCount(), 1);
    });

    it('IU1-45: two different series are never deduplicated into one identity', () => {
      const loader = new HistoricalPitIngestionLoader();
      const csv =
        'TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd01,Rsvd02,Rsvd03,Rsvd04\n' +
        '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE665A01038,SWANENERGY,BL,419.00,421.00,418.00,420.00,420.00,418.00,0.0,420.00,0,0,1500000,630000000,50000,1,1,-,-,-,-,-\n' +
        '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE665A01038,SWANENERGY,EQ,419.00,421.00,418.00,420.00,420.00,418.00,0.0,420.00,0,0,1500000,630000000,50000,1,1,-,-,-,-,-';
      const zip = createSyntheticZip('BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv', csv);

      const result = loader.ingestSingleArchive('2024-08-01', zip, 'BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.d01Count, 2);
      assert.strictEqual(result.duplicateCount, 0);
      assert.strictEqual(loader.getD01Store().getRecordCount(), 2);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 11. Existing no-future-leakage behaviour
  // ────────────────────────────────────────────────────────────────────────
  describe('§12 — no future leakage', () => {
    it('IU1-46: a series-aware as-of query never leaks a later snapshot', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = `ISIN:${SWAN_ISIN}:EQ`;
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, sid));
      store.append(d01Envelope('SWANENERGY', '2024-08-20T10:00:00.000Z', 200, sid));

      const asOfEarly = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: '2024-08-10T00:00:00.000Z', securityId: sid });
      assert.ok(asOfEarly);
      assert.strictEqual((asOfEarly.payload as MarketQuotePayload).ltp, 100);
    });

    it('IU1-47: a series-aware range query never leaks outside its bounds', () => {
      const store = new PointInTimeStore<MarketQuotePayload>();
      const sid = `ISIN:${SWAN_ISIN}:EQ`;
      store.append(d01Envelope('SWANENERGY', '2024-08-01T10:00:00.000Z', 100, sid));
      store.append(d01Envelope('SWANENERGY', '2024-08-20T10:00:00.000Z', 200, sid));

      const early = store.queryRange('SWANENERGY', 'D01_QUOTES', '2024-08-01T00:00:00.000Z', '2024-08-10T00:00:00.000Z', sid);
      assert.strictEqual(early.length, 1);
      assert.strictEqual((early[0].payload as MarketQuotePayload).ltp, 100);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Local helper: build a synthetic zip archive using the same approach as the
// existing D114 historical-feasibility suite (no external dependency).
// ──────────────────────────────────────────────────────────────────────────
import * as zlib from 'node:zlib';

function createSyntheticZip(filename: string, csvContent: string): Buffer {
  const contentBuf = Buffer.from(csvContent, 'utf8');
  const compressed = zlib.deflateRawSync(contentBuf);
  const fnBuf = Buffer.from(filename, 'utf8');

  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // magic
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(8, 8); // compression: deflate
  header.writeUInt16LE(0, 10); // time
  header.writeUInt16LE(0, 12); // date
  header.writeUInt32LE(zlib.crc32(contentBuf), 14); // crc32
  header.writeUInt32LE(compressed.length, 18); // comp size
  header.writeUInt32LE(contentBuf.length, 22); // uncomp size
  header.writeUInt16LE(fnBuf.length, 26); // fn len
  header.writeUInt16LE(0, 28); // extra len

  return Buffer.concat([header, fnBuf, compressed]);
}
