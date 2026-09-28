/**
 * Institutional Investment Platform System (IIPS)
 * IU-2 — D114 Series-Aware Security Identity — Implementation Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / IU-2
 * Authority: evidence/target-shell-integration/IU-2-D114-SERIES-AWARE-SECURITY-IDENTITY-IMPLEMENTATION-AUTHORITY-ACT.md
 *
 * ADDITIVE TESTS ONLY. No existing test is modified, weakened, or deleted.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  D114_SECURITY_ID_PREFIX,
  D114_ISIN_AUTHORITY,
  CmUdiffParser,
  LegacyBhavcopyParser,
} from '../src/index.js';
import type {
  D114SecurityIdentity,
  MarketQuotePayload,
  OHLCVCandle,
  CmUdiffRawRecord,
  LegacyBhavcopyRawRecord,
} from '../src/index.js';

// Real ISINs reused from the existing D114 historical-feasibility suite.
const HDFCLIFE_ISIN = 'INE795G01014';
const INFY_ISIN = 'INE009A01021';

function udiffRow(overrides: Partial<CmUdiffRawRecord> = {}): CmUdiffRawRecord {
  return {
    TradDt: '2026-09-15',
    BizDt: '2026-09-15',
    Sgmt: 'CM',
    Src: 'NSE',
    ISIN: HDFCLIFE_ISIN,
    TckrSymb: 'HDFCLIFE',
    SctySrs: 'EQ',
    ClsPric: '516.10',
    LastPric: '516.10',
    PrvsClsgPric: '530.00',
    SttlmPric: '516.09',
    OpnPric: '530.00',
    HghPric: '532.00',
    LwPric: '515.00',
    TtlTradgVol: '1500000',
    ...overrides,
  };
}

function legacyRow(overrides: Partial<LegacyBhavcopyRawRecord> = {}): LegacyBhavcopyRawRecord {
  return {
    SYMBOL: 'HDFCLIFE',
    SERIES: 'EQ',
    OPEN: '530.00',
    HIGH: '532.00',
    LOW: '515.00',
    CLOSE: '516.10',
    LAST: '516.10',
    PREVCLOSE: '530.00',
    TOTTRDQTY: '1500000',
    TOTTRDVAL: '774150000.00',
    TIMESTAMP: '15-SEP-2023',
    TOTALTRADES: '45000',
    ISIN: HDFCLIFE_ISIN,
    ...overrides,
  };
}

describe('IU-2 / D114: Series-Aware Security Identity', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Valid ISIN + series produces the exact expected D114 identity
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2-A: identity construction and exact grammar', () => {
    it('IU2-01: valid ISIN + series produces the exact expected D114 identity', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ');

      assert.notStrictEqual(identity, null);
      const id = identity as D114SecurityIdentity;
      assert.strictEqual(id.securityId, 'ISIN:INE795G01014:EQ');
      assert.strictEqual(id.isin, HDFCLIFE_ISIN);
      assert.strictEqual(id.series, 'EQ');
      assert.strictEqual(id.isinAuthority, 'NON_AUTHORITATIVE');
      assert.strictEqual(id.isinAuthority, D114_ISIN_AUTHORITY);
      assert.strictEqual(D114_SECURITY_ID_PREFIX, 'ISIN');
    });

    it('IU2-02: securityId is exactly ISIN:<isin>:<series> for a second instrument', () => {
      const identity = buildD114SecurityIdentity(INFY_ISIN, 'EQ');

      assert.notStrictEqual(identity, null);
      assert.strictEqual((identity as D114SecurityIdentity).securityId, 'ISIN:INE009A01021:EQ');
    });

    it('IU2-03: construction is deterministic', () => {
      const a = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ');
      const b = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ');

      assert.deepStrictEqual(a, b);
      assert.strictEqual(
        (a as D114SecurityIdentity).securityId,
        (b as D114SecurityIdentity).securityId,
      );
    });

    it('IU2-04: construction trims surrounding whitespace without altering the grammar', () => {
      const identity = buildD114SecurityIdentity(` ${HDFCLIFE_ISIN} `, ' EQ ');

      assert.notStrictEqual(identity, null);
      assert.strictEqual((identity as D114SecurityIdentity).securityId, 'ISIN:INE795G01014:EQ');
      assert.strictEqual((identity as D114SecurityIdentity).series, 'EQ');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Missing / invalid series fails closed
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2-A: fail-closed construction', () => {
    it('IU2-05: missing (empty) series is rejected — no default series is manufactured', () => {
      assert.strictEqual(buildD114SecurityIdentity(HDFCLIFE_ISIN, ''), null);
    });

    it('IU2-06: blank (whitespace-only) series is rejected', () => {
      assert.strictEqual(buildD114SecurityIdentity(HDFCLIFE_ISIN, '   '), null);
    });

    it('IU2-07: undefined series is rejected', () => {
      assert.strictEqual(buildD114SecurityIdentity(HDFCLIFE_ISIN, undefined), null);
    });

    it('IU2-08: non-string series is rejected', () => {
      assert.strictEqual(buildD114SecurityIdentity(HDFCLIFE_ISIN, 42), null);
    });

    it('IU2-09: malformed ISIN is rejected (too short)', () => {
      assert.strictEqual(buildD114SecurityIdentity('INE795G0101', 'EQ'), null);
    });

    it('IU2-10: malformed ISIN is rejected (too long)', () => {
      assert.strictEqual(buildD114SecurityIdentity('INE795G010144', 'EQ'), null);
    });

    it('IU2-11: malformed ISIN is rejected (non-alphanumeric)', () => {
      assert.strictEqual(buildD114SecurityIdentity('INE795G0101!', 'EQ'), null);
    });

    it('IU2-12: missing ISIN is rejected', () => {
      assert.strictEqual(buildD114SecurityIdentity(undefined, 'EQ'), null);
      assert.strictEqual(buildD114SecurityIdentity('', 'EQ'), null);
    });

    it('IU2-13: series is never inferred from companyId', () => {
      // A companyId/symbol carries no series; an identity must not be fabricated from it.
      const fromSymbol = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'HDFCLIFE');

      assert.notStrictEqual(fromSymbol, null);
      // The only way to obtain an identity is to supply the series explicitly.
      assert.strictEqual(
        (fromSymbol as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:HDFCLIFE',
      );
      // ...and omitting the series still fails closed.
      assert.strictEqual(buildD114SecurityIdentity(HDFCLIFE_ISIN, ''), null);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Validation guard
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2-A: isD114SecurityIdentity validation', () => {
    it('IU2-14: a well-formed identity validates', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ');

      assert.strictEqual(isD114SecurityIdentity(identity), true);
    });

    it('IU2-15: validation rejects a securityId that does not match its own components', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;
      const tampered = { ...identity, securityId: 'ISIN:INE795G01014:BL' };

      assert.strictEqual(isD114SecurityIdentity(tampered), false);
    });

    it('IU2-16: validation rejects a non-NON_AUTHORITATIVE isinAuthority', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;
      const tampered = { ...identity, isinAuthority: 'AUTHORITATIVE' };

      assert.strictEqual(isD114SecurityIdentity(tampered), false);
    });

    it('IU2-17: validation rejects a missing series', () => {
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;
      const tampered = { ...identity, series: '' };

      assert.strictEqual(isD114SecurityIdentity(tampered), false);
    });

    it('IU2-18: validation rejects non-objects and null', () => {
      assert.strictEqual(isD114SecurityIdentity(null), false);
      assert.strictEqual(isD114SecurityIdentity(undefined), false);
      assert.strictEqual(isD114SecurityIdentity('ISIN:INE795G01014:EQ'), false);
      assert.strictEqual(isD114SecurityIdentity(42), false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3 & 4. D01 quote and D02 OHLCV normalization carry the identity
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2-C: D01 / D02 normalization carries the identity', () => {
    it('IU2-19: CM-UDiFF D01 quote normalization carries the identity', () => {
      const quote: MarketQuotePayload = CmUdiffParser.toCanonicalQuote(udiffRow());

      assert.notStrictEqual(quote.securityIdentity, undefined);
      assert.strictEqual(
        (quote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:EQ',
      );
      assert.strictEqual((quote.securityIdentity as D114SecurityIdentity).series, 'EQ');
    });

    it('IU2-20: CM-UDiFF D02 OHLCV normalization carries the identity', () => {
      const candle: OHLCVCandle = CmUdiffParser.toCanonicalOHLCV(udiffRow());

      assert.notStrictEqual(candle.securityIdentity, undefined);
      assert.strictEqual(
        (candle.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:EQ',
      );
    });

    it('IU2-21: legacy Bhavcopy D01 quote normalization carries the identity', () => {
      const quote: MarketQuotePayload = LegacyBhavcopyParser.toCanonicalQuote(legacyRow());

      assert.notStrictEqual(quote.securityIdentity, undefined);
      assert.strictEqual(
        (quote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:EQ',
      );
    });

    it('IU2-22: legacy Bhavcopy D02 OHLCV normalization carries the identity', () => {
      const candle: OHLCVCandle = LegacyBhavcopyParser.toCanonicalOHLCV(legacyRow());

      assert.notStrictEqual(candle.securityIdentity, undefined);
      assert.strictEqual(
        (candle.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:EQ',
      );
    });

    it('IU2-23: D01 and D02 payloads from the same row carry the same identity', () => {
      const row = udiffRow();
      const quote = CmUdiffParser.toCanonicalQuote(row);
      const candle = CmUdiffParser.toCanonicalOHLCV(row);

      assert.deepStrictEqual(quote.securityIdentity, candle.securityIdentity);
    });

    it('IU2-24: existing payload fields are preserved unchanged (additive only)', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow());

      assert.strictEqual(quote.companyId, 'HDFCLIFE');
      assert.strictEqual(quote.symbol, 'HDFCLIFE');
      assert.strictEqual(quote.exchange, 'NSE');
      assert.strictEqual(quote.currency, 'INR');
      assert.strictEqual(quote.ltp, 516.10);
      assert.strictEqual(quote.previousClose, 530);
      assert.strictEqual(quote.volume, 1500000);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5 & 6. Correct series preserved on each parser path
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2-D: correct series preserved per parser path', () => {
    it('IU2-25: CM-UDiFF path preserves SctySrs as the series', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow({ SctySrs: 'BE' }));

      assert.strictEqual((quote.securityIdentity as D114SecurityIdentity).series, 'BE');
      assert.strictEqual(
        (quote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:BE',
      );
    });

    it('IU2-26: legacy Bhavcopy path preserves SERIES as the series', () => {
      const quote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow({ SERIES: 'IL' }));

      assert.strictEqual((quote.securityIdentity as D114SecurityIdentity).series, 'IL');
      assert.strictEqual(
        (quote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:IL',
      );
    });

    it('IU2-27: CM-UDiFF OHLCV path preserves SctySrs as the series', () => {
      const candle = CmUdiffParser.toCanonicalOHLCV(udiffRow({ SctySrs: 'BL' }));

      assert.strictEqual((candle.securityIdentity as D114SecurityIdentity).series, 'BL');
    });

    it('IU2-28: legacy Bhavcopy OHLCV path preserves SERIES as the series', () => {
      const candle = LegacyBhavcopyParser.toCanonicalOHLCV(legacyRow({ SERIES: 'BL' }));

      assert.strictEqual((candle.securityIdentity as D114SecurityIdentity).series, 'BL');
    });

    it('IU2-29: a row with a missing series yields no identity on either parser path', () => {
      const cmQuote = CmUdiffParser.toCanonicalQuote(udiffRow({ SctySrs: '' }));
      const cmCandle = CmUdiffParser.toCanonicalOHLCV(udiffRow({ SctySrs: '' }));
      const lgQuote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow({ SERIES: '' }));
      const lgCandle = LegacyBhavcopyParser.toCanonicalOHLCV(legacyRow({ SERIES: '' }));

      assert.strictEqual(cmQuote.securityIdentity, undefined);
      assert.strictEqual(cmCandle.securityIdentity, undefined);
      assert.strictEqual(lgQuote.securityIdentity, undefined);
      assert.strictEqual(lgCandle.securityIdentity, undefined);
    });

    it('IU2-30: a row with a malformed ISIN yields no identity on either parser path', () => {
      const cmQuote = CmUdiffParser.toCanonicalQuote(udiffRow({ ISIN: 'BAD' }));
      const lgQuote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow({ ISIN: 'BAD' }));

      assert.strictEqual(cmQuote.securityIdentity, undefined);
      assert.strictEqual(lgQuote.securityIdentity, undefined);
    });

    it('IU2-31: rows with a missing series still normalize (no ingestion regression)', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow({ SctySrs: '' }));

      assert.strictEqual(quote.companyId, 'HDFCLIFE');
      assert.strictEqual(quote.ltp, 516.10);
      assert.strictEqual(quote.securityIdentity, undefined);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 7. Multi-series proof — same ISIN, different series remain distinct
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2: multi-series semantics', () => {
    it('IU2-32: same ISIN + BL and same ISIN + EQ remain distinct identities', () => {
      const eq = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;
      const bl = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'BL') as D114SecurityIdentity;

      assert.notStrictEqual(eq.securityId, bl.securityId);
      assert.strictEqual(eq.securityId, 'ISIN:INE795G01014:EQ');
      assert.strictEqual(bl.securityId, 'ISIN:INE795G01014:BL');
      // Same instrument, same ISIN — different series.
      assert.strictEqual(eq.isin, bl.isin);
      assert.notStrictEqual(eq.series, bl.series);
    });

    it('IU2-33: multiple series sharing one ISIN are not collapsed (set size = distinct count)', () => {
      const seriesList = ['EQ', 'BL', 'BE', 'IL'];
      const ids = seriesList.map((s) => {
        const id = buildD114SecurityIdentity(HDFCLIFE_ISIN, s) as D114SecurityIdentity;
        return id.securityId;
      });
      const unique = new Set(ids);

      assert.strictEqual(unique.size, seriesList.length);
    });

    it('IU2-34: the CM-UDiFF path keeps BL and EQ rows for one ISIN distinct', () => {
      const eqQuote = CmUdiffParser.toCanonicalQuote(udiffRow({ SctySrs: 'EQ' }));
      const blQuote = CmUdiffParser.toCanonicalQuote(udiffRow({ SctySrs: 'BL' }));

      assert.notStrictEqual(
        (eqQuote.securityIdentity as D114SecurityIdentity).securityId,
        (blQuote.securityIdentity as D114SecurityIdentity).securityId,
      );
      assert.strictEqual(
        (eqQuote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:EQ',
      );
      assert.strictEqual(
        (blQuote.securityIdentity as D114SecurityIdentity).securityId,
        'ISIN:INE795G01014:BL',
      );
    });

    it('IU2-35: the legacy Bhavcopy path keeps BL and EQ rows for one ISIN distinct', () => {
      const eqQuote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow({ SERIES: 'EQ' }));
      const blQuote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow({ SERIES: 'BL' }));

      assert.notStrictEqual(
        (eqQuote.securityIdentity as D114SecurityIdentity).securityId,
        (blQuote.securityIdentity as D114SecurityIdentity).securityId,
      );
    });

    it('IU2-36: the CM-UDiFF and legacy paths produce the identical identity for the same ISIN+series', () => {
      const cmQuote = CmUdiffParser.toCanonicalQuote(udiffRow());
      const lgQuote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow());

      assert.strictEqual(
        (cmQuote.securityIdentity as D114SecurityIdentity).securityId,
        (lgQuote.securityIdentity as D114SecurityIdentity).securityId,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Identity separation — companyId is NOT repurposed
  // ────────────────────────────────────────────────────────────────────────
  describe('IU-2: identity separation', () => {
    it('IU2-37: companyId is not repurposed as the D114 security identity', () => {
      const quote = CmUdiffParser.toCanonicalQuote(udiffRow());

      assert.strictEqual(quote.companyId, 'HDFCLIFE');
      assert.notStrictEqual(quote.companyId, (quote.securityIdentity as D114SecurityIdentity).securityId);
      assert.notStrictEqual(quote.companyId, (quote.securityIdentity as D114SecurityIdentity).isin);
      assert.notStrictEqual(quote.companyId, (quote.securityIdentity as D114SecurityIdentity).series);
    });

    it('IU2-38: the legacy path also keeps companyId separate from the D114 identity', () => {
      const quote = LegacyBhavcopyParser.toCanonicalQuote(legacyRow());

      assert.strictEqual(quote.companyId, 'HDFCLIFE');
      assert.notStrictEqual(quote.companyId, (quote.securityIdentity as D114SecurityIdentity).securityId);
    });

    it('IU2-39: D114 identity is distinct from security-master identity (D05 InstrumentMasterPayload)', () => {
      // The D114 security identity carries only the series-aware triple; it is
      // not a security-master instrument and carries no companyId.
      const identity = buildD114SecurityIdentity(HDFCLIFE_ISIN, 'EQ') as D114SecurityIdentity;

      assert.strictEqual(Object.keys(identity).sort().join(','), 'isin,isinAuthority,securityId,series');
    });
  });
});
