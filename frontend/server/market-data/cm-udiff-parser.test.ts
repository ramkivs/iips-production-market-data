import { describe, it, expect, beforeEach } from 'vitest';
import { parseUdiffCsv, isEligibleEquity, type RawUdiffRecord } from './cm-udiff-parser';
import { validateAndNormalizeRecord } from './normalizer';
import {
  CM_UDIFF_HEADER,
  SYNTHETIC_VALID_BHAVCOPY_2026_09_14,
  SYNTHETIC_ANOMALOUS_BHAVCOPY,
} from './fixtures/synthetic-fixtures';

describe('NSE CM-UDiFF Parser & Eligibility Filter (R-2)', () => {
  it('parses valid CM-UDiFF CSV content into rows matching header columns', () => {
    const result = parseUdiffCsv(SYNTHETIC_VALID_BHAVCOPY_2026_09_14);
    expect(result.rawCount).toBe(5);
    expect(result.parseErrors).toHaveLength(0);
    expect(result.rows[0].TckrSymb).toBe('RELIANCE');
    expect(result.rows[0].ISIN).toBe('INE002A01018');
    expect(result.rows[0].SctySrs).toBe('EQ');
  });

  it('rejects empty or corrupt CSV strings gracefully', () => {
    const emptyResult = parseUdiffCsv('');
    expect(emptyResult.rawCount).toBe(0);
    expect(emptyResult.parseErrors).toContain('Empty CSV content');

    const mismatchedRow = `${CM_UDIFF_HEADER}\n2026-09-14,2026-09-14,CM,NSE`;
    const mismatchRes = parseUdiffCsv(mismatchedRow);
    expect(mismatchRes.rows).toHaveLength(0);
    expect(mismatchRes.parseErrors[0]).toContain('column count mismatch');
  });

  it('filters out non-equity instruments (debt, futures, mutual funds) (Requirement 38-39)', () => {
    const parsed = parseUdiffCsv(SYNTHETIC_ANOMALOUS_BHAVCOPY);
    const eligibleRows = parsed.rows.filter(isEligibleEquity);

    // Only RELIANCE and the anomalous equity rows pass the initial eligibility filter
    // Debt GS and FO Futures are strictly excluded
    const symbols = eligibleRows.map((r) => r.TckrSymb);
    expect(symbols).toContain('RELIANCE');
    expect(symbols).not.toContain('718GS2033'); // Government bond
    expect(symbols).not.toContain('RELIANCE26SEPFUT'); // FO future
  });

  it('filters out non-CM segments and non-IN ISINs', () => {
    const nonCmRow: RawUdiffRecord = {
      Sgmt: 'FO',
      FinInstrmTp: 'STK',
      SctySrs: 'EQ',
      ISIN: 'INE002A01018',
      TckrSymb: 'FO_TEST',
    };
    expect(isEligibleEquity(nonCmRow)).toBe(false);

    const nonInIsin: RawUdiffRecord = {
      Sgmt: 'CM',
      FinInstrmTp: 'STK',
      SctySrs: 'EQ',
      ISIN: 'US0378331005',
      TckrSymb: 'AAPL',
    };
    expect(isEligibleEquity(nonInIsin)).toBe(false);
  });
});

describe('Normalization and Quality / OHLC Validation (R-2)', () => {
  it('normalizes valid equity row into frozen CanonicalEquityEodRecord', () => {
    const validRow: RawUdiffRecord = {
      TradDt: '2026-09-14',
      BizDt: '2026-09-14',
      Sgmt: 'CM',
      Src: 'NSE',
      FinInstrmTp: 'STK',
      FinInstrmId: '1001',
      ISIN: 'INE002A01018',
      TckrSymb: 'RELIANCE',
      SctySrs: 'EQ',
      FinInstrmNm: 'Reliance Industries Limited',
      OpnPric: '2950.00',
      HghPric: '2985.50',
      LwPric: '2940.00',
      ClsPric: '2972.25',
      LastPric: '2970.00',
      PrvsClsgPric: '2945.00',
      TtlTradgVol: '4521000',
      TtlTrfVal: '13420000000',
      TtlNbOfTxsExctd: '145200',
    };

    const res = validateAndNormalizeRecord(validRow, 'bhavcopy.csv');
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.record.exchange).toBe('NSE');
      expect(res.record.symbol).toBe('RELIANCE');
      expect(res.record.close).toBe(2972.25);
      expect(res.record.open).toBe(2950.0);
      expect(res.record.high).toBe(2985.5);
      expect(res.record.low).toBe(2940.0);
      expect(res.record.quality).toBe('good');
      expect(Object.isFrozen(res.record)).toBe(true);
    }
  });

  it('quarantines impossible OHLC relationships (High < Low, High < Open, Low > Close)', () => {
    const badOhlcRow: RawUdiffRecord = {
      TradDt: '2026-09-14',
      ISIN: 'INE123A01011',
      TckrSymb: 'BADOHLC',
      SctySrs: 'EQ',
      OpnPric: '200.00',
      HghPric: '180.00', // Impossible: High < Open
      LwPric: '210.00', // Impossible: Low > High
      ClsPric: '195.00',
      LastPric: '195.00',
      PrvsClsgPric: '200.00',
      TtlTradgVol: '1000',
    };

    const res = validateAndNormalizeRecord(badOhlcRow, 'bhavcopy.csv');
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.quarantine.rule).toBe('OHLC_SANITY');
      expect(res.quarantine.reason).toContain('Impossible OHLC');
    }
  });

  it('quarantines negative or non-numeric prices', () => {
    const negPriceRow: RawUdiffRecord = {
      TradDt: '2026-09-14',
      ISIN: 'INE124A01019',
      TckrSymb: 'NEGPRICE',
      SctySrs: 'EQ',
      OpnPric: '-50.00',
      HghPric: '60.00',
      LwPric: '40.00',
      ClsPric: '55.00',
      LastPric: '55.00',
      PrvsClsgPric: '50.00',
      TtlTradgVol: '5000',
    };

    const res = validateAndNormalizeRecord(negPriceRow, 'bhavcopy.csv');
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.quarantine.rule).toBe('POSITIVE_PRICE');
    }

    const nonNumRow: RawUdiffRecord = {
      ...negPriceRow,
      OpnPric: 'NOT_A_NUMBER',
    };
    const res2 = validateAndNormalizeRecord(nonNumRow, 'bhavcopy.csv');
    expect(res2.valid).toBe(false);
    if (!res2.valid) {
      expect(res2.quarantine.rule).toBe('NUMERIC_INTEGRITY');
    }
  });

  it('quarantines missing required identity or date fields', () => {
    const missingDate: RawUdiffRecord = {
      ISIN: 'INE125A01016',
      TckrSymb: 'NODATE',
      OpnPric: '100.00',
      HghPric: '110.00',
      LwPric: '95.00',
      ClsPric: '105.00',
      TtlTradgVol: '1000',
    };

    const res = validateAndNormalizeRecord(missingDate, 'bhavcopy.csv');
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.quarantine.rule).toBe('IDENTITY_COMPLETENESS');
    }
  });
});
