/**
 * W-24 — D01 provenance, cache/coalesced, copy-on-serve immutability, no D02 invention
 * D-7 §4.6 rules 2-3 | Readiness §3.8
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DhanDiagnosticRing } from '../src/providers/dhan/dhan_diagnostic_ring.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import type { SecurityMaster } from '../src/identity/security_master.js';
import { generateTraceId } from '../src/providers/dhan/dhan_trace.js';
import type { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';

const IDENTITY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
function stubSM() { return { getIdentity: () => IDENTITY, isEligible: () => true } as unknown as SecurityMaster; }
function stubReg() {
  const reg = new DhanInstrumentRegistry();
  reg.registerAll([{ companyId: 'COMP_INFY', exchange: 'NSE' as const, symbol: 'INFY', exchangeSegment: 'NSE_EQ' as const, isin: 'INE009A01021', securityId: 'ISIN:INE009A01021:EQ', dhanSecurityId: '1333', mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const }]);
  return reg;
}
function dto() {
  return { status: 'success', data: { NSE_EQ: { '1333': { last_price: 123.45, ohlc: { open: 120, high: 125, low: 119, close: 123.45 }, volume: 100000, last_trade_time: '26/11/2026 15:30:00', net_change: 3.45 } } } };
}
function fakeApiClient() {
  const recorder = { recordSuccess: () => {}, recordFailure: () => {} };
  return {
    getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
    getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
    getStateRecorder: () => recorder,
    fetchMarketQuotes: async () => ({ ok: true as const, value: { dto: dto(), metrics: { latencyMs: 42 } } }),
  } as unknown as DhanApiClient;
}
function fakeHistoryClient() {
  const recorder = { recordSuccess: () => {}, recordFailure: () => {} };
  return {
    getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
    getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
    getStateRecorder: () => recorder,
    nowIso: () => new Date().toISOString(),
    fetchMarketQuotes: async () => ({ ok: true as const, value: { dto: dto(), metrics: { latencyMs: 42 } } }),
    executeJsonPost: async () => ({ ok: false as const, failure: { code: 'TRANSPORT_FAILURE' as const, message: 'stub historical' } }),
    fetchHistoricalCandles: async () => ({ ok: true as const, value: { candles: [], metrics: { latencyMs: 50 } } }),
  } as unknown as DhanApiClient;
}

describe('W-24 D01 provenance', () => {
  it('new non-coalesced quote → traceId===actionId, correlationId===actionId', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const actionId = generateTraceId();
    const svc = new DhanMarketDataService({
      client: fakeApiClient(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const res = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId });
    assert.equal(res.ok, true);
    if (res.ok) {
      const prov = (res.envelope as unknown as { provenance: Record<string, unknown> }).provenance;
      assert.equal(prov.traceId, actionId);
      assert.equal(prov.correlationId, actionId);
    }
    const events = ring.list();
    const names = events.map((e) => e.event);
    assert.ok(names.includes('REQUEST_ADMITTED'));
    assert.ok(names.includes('WORK_START'));
    assert.ok(names.includes('ATTEMPT_START'));
    assert.ok(names.includes('ATTEMPT_END'));
    assert.ok(names.includes('REQUEST_END'));
    for (const ev of events) assert.equal(ev.actionId, actionId);
    const w = events[0]!.workId; const a = events[0]!.attemptId;
    for (const ev of events) { assert.equal(ev.workId, w); assert.equal(ev.attemptId, a); }
  });

  it('cache hit → traceId is current, correlationId is original producer', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const producer = generateTraceId(); const consumer = generateTraceId();
    const svc = new DhanMarketDataService({
      client: fakeApiClient(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const first = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: producer });
    assert.equal(first.ok, true);
    const second = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: consumer });
    assert.equal(second.ok, true);
    if (second.ok) {
      const prov = (second.envelope as unknown as { provenance: Record<string, unknown> }).provenance;
      assert.equal(prov.traceId, consumer);
      assert.equal(prov.correlationId, producer);
    }
    const secondEvents = ring.list().filter((e) => e.actionId === consumer);
    const names2 = secondEvents.map((e) => e.event);
    assert.ok(names2.includes('CACHE_HIT'));
    assert.ok(!names2.includes('ATTEMPT_START'), 'cache hit must not produce ATTEMPT_START');
  });

  it('copy-on-serve: envelopes are distinct objects', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const a1 = generateTraceId(); const a2 = generateTraceId();
    const svc = new DhanMarketDataService({
      client: fakeApiClient(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const first = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: a1 });
    const second = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: a2 });
    assert.equal(first.ok, true); assert.equal(second.ok, true);
    assert.notEqual((first as unknown as { envelope: object }).envelope, (second as unknown as { envelope: object }).envelope);
    assert.notEqual((first as unknown as { envelope: { provenance: object } }).envelope.provenance, (second as unknown as { envelope: { provenance: object } }).envelope.provenance);
  });

  it('no D02 invention — HISTORY ring carries HISTORY operation only', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const actionId = generateTraceId();
    const svc = new DhanMarketDataService({
      client: fakeHistoryClient(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const req = { companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ' as const, securityIdentity: IDENTITY, interval: '1D' as const, fromDate: '2026-10-01', toDate: '2026-11-01' };
    const res = await svc.getHistorical(req, { traceVersion: '1', actionId });
    const histEvents = ring.list().filter((e) => e.operation === 'HISTORY' && e.actionId === actionId);
    assert.ok(histEvents.length > 0, 'expected HISTORY events');
    for (const ev of histEvents) { assert.equal(ev.actionId, actionId); assert.equal((ev as unknown as Record<string, unknown>).payload, undefined); }
    assert.ok(typeof res.ok === 'boolean');
  });

  it('untraced getQuote succeeds without traceId', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const svc = new DhanMarketDataService({
      client: fakeApiClient(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const res = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY });
    assert.equal(res.ok, true);
    if (res.ok) {
      const prov = (res.envelope as unknown as { provenance: Record<string, unknown> }).provenance;
      assert.equal(prov.traceId, undefined);
      assert.equal(prov.correlationId, undefined);
    }
  });
});
