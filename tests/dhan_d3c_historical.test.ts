/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D3C Historical DTO & Adapter Suite (synthetic only)
 *
 * Gate: DHAN-D3C HISTORICAL QUALIFICATION — PRE-ACCESS / SYNTHETIC / OFFLINE.
 * All payloads are synthetic; nothing here is represented as a live Dhan response.
 * Vendor historical shape remains PROVISIONAL (published-docs derived).
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  DhanApiClient,
  DhanHistoricalAdapter,
  DhanInstrumentMapping,
  DhanInstrumentRegistry,
  DhanHttpTransport,
  DhanHttpRequest,
  DhanHttpResponse,
  SecurityMaster,
  normalizeDhanHistoricalToCandles,
  validateDhanHistoricalRequest,
  parseDhanHistoricalResponse,
  buildDhanHistoricalRequestBody,
  DHAN_SUPPORTED_HISTORICAL_INTERVALS,
} from '../src/index.js';
import type { DhanHistoricalResponseDto } from '../src/providers/dhan/dhan_historical_dto.js';

const MAPPING: DhanInstrumentMapping = {
  companyId: 'COMP-SYNTH-A',
  isin: 'INE000SYNTH1',
  securityId: 'ISIN:INE000SYNTH1:EQ',
  exchange: 'NSE',
  symbol: 'SYNTHA',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-NSE-EQ-1001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
  instrumentType: 'EQUITY',
  active: true,
};

// 2026-09-21T00:00:00Z .. +1d .. +2d (epoch seconds, candle start)
const T0 = Date.UTC(2026, 8, 21) / 1000;
const T1 = Date.UTC(2026, 8, 22) / 1000;
const T2 = Date.UTC(2026, 8, 23) / 1000;

function dto(overrides: Partial<DhanHistoricalResponseDto> = {}): DhanHistoricalResponseDto {
  return {
    timestamp: [T0, T1, T2],
    open: [100, 102, 101],
    high: [105, 106, 104],
    low: [99, 100, 98],
    close: [104, 103, 102],
    volume: [1000, 0, 1500], // zero volume is a legitimate observation
    ...overrides,
  };
}

function fixtureTransport(payload: unknown, status = 200): DhanHttpTransport {
  return {
    async send(_req: DhanHttpRequest): Promise<DhanHttpResponse> {
      return { status, bodyText: JSON.stringify(payload) };
    },
  };
}

describe('DHAN-D3C historical DTO & adapter (synthetic)', () => {
  it('D3C-01: valid multi-candle response normalizes to canonical D02 candles', () => {
    const r = normalizeDhanHistoricalToCandles({
      dto: dto(),
      mapping: MAPPING,
      interval: '1D',
      fromDate: '2026-09-21',
      toDate: '2026-09-23',
    });
    assert.ok(r.ok, JSON.stringify(r));
    assert.strictEqual(r.value.returnedCandleCount, 3);
    assert.strictEqual(r.value.coverageClaim, 'ACCESS_PENDING_UNVERIFIED');
    const c0 = r.value.candles[0]!;
    assert.strictEqual(c0.interval, '1d');
    assert.strictEqual(c0.candleStart, '2026-09-21T00:00:00.000Z');
    assert.strictEqual(c0.candleEnd, '2026-09-22T00:00:00.000Z'); // candle-start + 1 day
    assert.strictEqual(c0.open, 100);
    assert.strictEqual(c0.volume, 1000);
    assert.strictEqual(c0.isAdjusted, false);
    assert.strictEqual(c0.companyId, 'COMP-SYNTH-A');
    // Zero volume preserved, not fabricated or dropped.
    assert.strictEqual(r.value.candles[1]!.volume, 0);
    // No vendor identifiers in canonical output.
    assert.ok(!JSON.stringify(r.value.candles).includes('SYNTH-NSE-EQ'));
  });

  it('D3C-02: supported intervals map to canonical intervals; invalid interval rejected', () => {
    assert.deepStrictEqual([...DHAN_SUPPORTED_HISTORICAL_INTERVALS], ['1m', '5m', '15m', '1h', '1D']);
    const bad = validateDhanHistoricalRequest({
      companyId: 'C', interval: '3D' as never, fromDate: '2026-09-21', toDate: '2026-09-23',
    });
    assert.ok(!bad.ok);
    if (!bad.ok) assert.strictEqual(bad.failure.code, 'UNSUPPORTED_INTERVAL');
    const r = normalizeDhanHistoricalToCandles({
      dto: { ...dto(), timestamp: [T0] },
      mapping: MAPPING,
      interval: '1h',
      fromDate: '2026-09-21',
      toDate: '2026-09-21',
    });
    assert.ok(r.ok);
    if (r.ok) {
      assert.strictEqual(r.value.candles[0]!.interval, '1h');
      assert.strictEqual(r.value.candles[0]!.candleEnd, '2026-09-21T01:00:00.000Z');
    }
  });

  it('D3C-03: request validation — invalid date ranges and impossible dates fail closed', () => {
    for (const req of [
      { companyId: 'C', interval: '1D' as const, fromDate: '2026-09-23', toDate: '2026-09-21' },
      { companyId: 'C', interval: '1D' as const, fromDate: '2026-02-30', toDate: '2026-03-01' },
      { companyId: 'C', interval: '1D' as const, fromDate: '21/09/2026', toDate: '2026-09-23' },
      { companyId: '', interval: '1D' as const, fromDate: '2026-09-21', toDate: '2026-09-23' },
    ]) {
      const r = validateDhanHistoricalRequest(req);
      assert.ok(!r.ok, JSON.stringify(req));
    }
    const ok = validateDhanHistoricalRequest({
      companyId: 'C', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
    });
    assert.ok(ok.ok);
    if (ok.ok) assert.strictEqual(ok.value.spanDays, 3);
  });

  it('D3C-04: invalid OHLC values and relationships fail closed; non-finite rejected', () => {
    const base = { mapping: MAPPING, interval: '1D' as const, fromDate: '2026-09-21', toDate: '2026-09-23' };
    const neg = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), open: [-1, 102, 101] } });
    assert.ok(!neg.ok);
    if (!neg.ok) assert.strictEqual(neg.failure.code, 'CANONICAL_VALIDATION_FAILURE');
    const highLow = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), high: [90, 106, 104] } });
    assert.ok(!highLow.ok); // high < open
    const nanVol = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), volume: [NaN, 0, 1] } });
    assert.ok(!nanVol.ok); // NaN rejected at parse (non-finite series)
    const badTs = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), timestamp: [T0, -5, T2] } });
    assert.ok(!badTs.ok);
  });

  it('D3C-05: duplicate and out-of-order timestamps fail closed', () => {
    const base = { mapping: MAPPING, interval: '1D' as const, fromDate: '2026-09-21', toDate: '2026-09-23' };
    const dup = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), timestamp: [T0, T0, T2] } });
    assert.ok(!dup.ok);
    if (!dup.ok) assert.match(dup.failure.message, /Duplicate/);
    const ooo = normalizeDhanHistoricalToCandles({ ...base, dto: { ...dto(), timestamp: [T1, T0, T2] } });
    assert.ok(!ooo.ok);
    if (!ooo.ok) assert.match(ooo.failure.message, /out of order/);
  });

  it('D3C-06: empty response is a VALID empty result; malformed/ragged/missing-series are failures', () => {
    const emptyParsed = parseDhanHistoricalResponse({
      open: [], high: [], low: [], close: [], volume: [], timestamp: [],
    });
    assert.ok(emptyParsed.ok); // valid empty
    const r = normalizeDhanHistoricalToCandles({
      dto: emptyParsed.ok ? emptyParsed.value : dto(),
      mapping: MAPPING, interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
    });
    assert.ok(r.ok);
    if (r.ok) assert.strictEqual(r.value.returnedCandleCount, 0);

    assert.ok(!parseDhanHistoricalResponse(null).ok);
    assert.ok(!parseDhanHistoricalResponse({ open: [1], high: [1], low: [1], close: [1], volume: [1] }).ok); // missing timestamp
    assert.ok(!parseDhanHistoricalResponse({ ...dto(), open: [1, 2] }).ok); // ragged
    assert.ok(!parseDhanHistoricalResponse({ ...dto(), volume: [1, 'x', 3] }).ok); // non-numeric
  });

  it('D3C-07: missing optional fields vs missing required fields', () => {
    // volume is a required series: its absence is a failure, not zero.
    const noVol = parseDhanHistoricalResponse({ open: [1], high: [1], low: [1], close: [1], timestamp: [T0] });
    assert.ok(!noVol.ok);
    if (!noVol.ok) assert.strictEqual(noVol.failure.code, 'MISSING_REQUIRED_FIELD');
  });

  it('D3C-08: adapter resolves instruments via the governed mapping path (segment + ISIN), never by name', async () => {
    const sm = new SecurityMaster();
    const registry = new DhanInstrumentRegistry();
    registry.register(MAPPING);
    registry.register({ ...MAPPING, isin: 'INE000SYNTH2', securityId: 'ISIN:INE000SYNTH2:EQ', symbol: 'SYNTHA2', dhanSecurityId: 'SYNTH-NSE-EQ-1002' });

    let capturedBody = '';
    const transport: DhanHttpTransport = {
      async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
        capturedBody = req.body ?? '';
        return { status: 200, bodyText: JSON.stringify(dto()) };
      },
    };
    const client = new DhanApiClient({
      config: {
        baseUrl: 'https://synthetic.invalid',
        timeoutMs: 1000,
        readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
      } as never,
      transport,
      credentialResolver: {
        resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }),
      } as never,
    });
    const adapter = new DhanHistoricalAdapter({ client, instrumentRegistry: registry });

    // Security-level resolution with ISIN selects the correct instrument.
    const ok = await adapter.fetchDailyCandles({
      companyId: 'COMP-SYNTH-A', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
      exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH2',
    });
    assert.ok(ok.ok, JSON.stringify(ok));
    assert.match(capturedBody, /SYNTH-NSE-EQ-1002/);
    assert.ok(!capturedBody.includes('INE000')); // no canonical id in vendor body beyond securityId

    // Ambiguous: company + segment with two securities, no ISIN -> fail closed.
    const amb = await adapter.fetchDailyCandles({
      companyId: 'COMP-SYNTH-A', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
      exchangeSegment: 'NSE_EQ',
    });
    assert.ok(!amb.ok);
    if (!amb.ok) assert.match(amb.failure.message, /AMBIGUOUS_MAPPING/);

    // Unmapped company -> fail closed, no fabricated instrument.
    const unk = await adapter.fetchDailyCandles({
      companyId: 'COMP-UNKNOWN', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
    });
    assert.ok(!unk.ok);
    if (!unk.ok) assert.strictEqual(unk.failure.code, 'UNRESOLVED_INSTRUMENT');
  });

  it('D3C-09: provider error and malformed payloads surface as explicit failures without credentials', async () => {
    const registry = new DhanInstrumentRegistry();
    registry.register(MAPPING);
    const mkClient = (payload: unknown, status: number) =>
      new DhanApiClient({
        config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
        transport: fixtureTransport(payload, status),
        credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }) } as never,
      });
    const adapter = new DhanHistoricalAdapter({ client: mkClient({ error: 'bad' }, 500), instrumentRegistry: registry });
    const err = await adapter.fetchDailyCandles({
      companyId: 'COMP-SYNTH-A', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
      exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1',
    });
    assert.ok(!err.ok);
    if (!err.ok) assert.ok(!JSON.stringify(err.failure).includes('synthetic-token'));

    const adapter2 = new DhanHistoricalAdapter({ client: mkClient('not-json', 200), instrumentRegistry: registry });
    const mal = await adapter2.fetchDailyCandles({
      companyId: 'COMP-SYNTH-A', interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
      exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1',
    });
    assert.ok(!mal.ok);
  });

  it('D3C-10: historical candles stay distinct from current-quote (D01) semantics', () => {
    const r = normalizeDhanHistoricalToCandles({
      dto: dto(), mapping: MAPPING, interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-23',
    });
    assert.ok(r.ok);
    if (r.ok) {
      const c = r.value.candles[0]!;
      assert.ok('candleStart' in c && 'candleEnd' in c && !('ltp' in c)); // D02 shape, not D01
      assert.strictEqual(c.interval, '1d');
    }
  });

  it('D3C-11: request body carries interval and no credential material', () => {
    const body = buildDhanHistoricalRequestBody({
      dhanSecurityId: 'SYNTH-NSE-EQ-1001',
      exchangeSegment: 'NSE_EQ',
      interval: '1D',
      fromDate: '2026-09-21',
      toDate: '2026-09-23',
    });
    const parsed = JSON.parse(body);
    assert.strictEqual(parsed.interval, '1D');
    assert.strictEqual(parsed.securityId, 'SYNTH-NSE-EQ-1001');
    assert.ok(!/token|clientId|secret/i.test(body));
  });
});
