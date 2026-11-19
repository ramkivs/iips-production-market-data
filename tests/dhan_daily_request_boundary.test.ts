import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDhanHistoricalRequestBody, validateDhanHistoricalRequest } from '../src/providers/dhan/dhan_historical_dto.js';
import { normalizeDhanHistoricalToCandles } from '../src/providers/dhan/dhan_historical_adapter.js';

// Synthetic date labels only: no claim about actual exchange trading dates.
const base = { dhanSecurityId: '123', exchangeSegment: 'NSE_EQ', interval: '1D' as const, fromDate: '2026-01-01' };
const wire = (toDate: string) => JSON.parse(buildDhanHistoricalRequestBody({ ...base, toDate }));

describe('Daily inclusive caller range to documented exclusive Dhan end', () => {
  for (const [end, exclusive] of [
    ['2026-09-23', '2026-09-24'],
    ['2026-01-31', '2026-02-01'],
    ['2026-12-31', '2027-01-01'],
    ['2024-02-28', '2024-02-29'],
    ['2024-02-29', '2024-03-01'],
    ['2026-02-28', '2026-03-01'],
  ]) {
    it(`${end} becomes ${exclusive}`, () => {
      assert.deepEqual(wire(end), { securityId: base.dhanSecurityId, exchangeSegment: base.exchangeSegment, interval: '1D', fromDate: base.fromDate, instrument: 'EQUITY', toDate: exclusive });
    });
  }

  it('same-day inclusive request covers that date under the documented exclusive-end model', () => {
    const date = '2026-09-23';
    assert.ok(validateDhanHistoricalRequest({ companyId: 'SYNTH', interval: '1D', fromDate: date, toDate: date }).ok);
    const request = JSON.parse(buildDhanHistoricalRequestBody({ ...base, fromDate: date, toDate: date }));
    const syntheticDates = ['2026-09-22', date, '2026-09-24'];
    assert.deepEqual(syntheticDates.filter(d => d >= request.fromDate && d < request.toDate), [date]);
  });

  it('adjacent non-overlapping caller ranges neither omit the last date nor overlap on the wire model', () => {
    const first = JSON.parse(buildDhanHistoricalRequestBody({ ...base, fromDate: '2026-09-21', toDate: '2026-09-22' }));
    const second = JSON.parse(buildDhanHistoricalRequestBody({ ...base, fromDate: '2026-09-23', toDate: '2026-09-23' }));
    const labels = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'];
    const select = (r: {fromDate: string; toDate: string}) => labels.filter(d => d >= r.fromDate && d < r.toDate);
    assert.deepEqual([...select(first), ...select(second)], labels.slice(0, 3));
  });

  it('does not alter other provisional intervals', () => {
    for (const interval of ['1m', '5m', '15m', '1h'] as const) {
      const request = JSON.parse(buildDhanHistoricalRequestBody({ ...base, interval, toDate: '2026-09-23' }));
      assert.equal(request.toDate, '2026-09-23');
    }
  });

  it('normalization retains the original inclusive range and daily close, not a manufactured newer observation', () => {
    const result = normalizeDhanHistoricalToCandles({
      dto: { timestamp: [Date.parse('2026-09-23T00:00:00Z') / 1000], open: [100], high: [105], low: [99], close: [104], volume: [1] },
      mapping: { companyId: 'SYNTH', symbol: 'SYNTH', exchange: 'NSE', exchangeSegment: 'NSE_EQ', dhanSecurityId: '123', mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' },
      interval: '1D', fromDate: '2026-09-23', toDate: '2026-09-23',
    });
    assert.ok(result.ok);
    assert.equal(result.value.requestedToDate, '2026-09-23');
    assert.equal(result.value.candles[0].candleStart, '2026-09-23T00:00:00.000Z');
    assert.equal(result.value.candles[0].close, 104);
    assert.equal(result.value.coverageClaim, 'ACCESS_PENDING_UNVERIFIED');
  });
});
