/**
 * W-24 — failure mapping, freshness interaction, concurrency, no-Dhan-header
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapDhanFailureToW24Category, DhanDiagnosticRing } from '../src/providers/dhan/dhan_diagnostic_ring.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import type { SecurityMaster } from '../src/identity/security_master.js';
import { generateTraceId } from '../src/providers/dhan/dhan_trace.js';
import type { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';

const IDENTITY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
function stubSM() { return { getIdentity: () => IDENTITY, isEligible: () => true } as unknown as SecurityMaster; }
function stubReg() {
  const r = new DhanInstrumentRegistry();
  r.registerAll([{ companyId: 'COMP_INFY', exchange: 'NSE' as const, symbol: 'INFY', exchangeSegment: 'NSE_EQ' as const, isin: 'INE009A01021', securityId: 'ISIN:INE009A01021:EQ', dhanSecurityId: '1333', mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const }]);
  return r;
}
function dto() { return { status: 'success', data: { NSE_EQ: { '1333': { last_price: 100, ohlc: { open: 90, high: 110, low: 80, close: 100 }, volume: 1, last_trade_time: '26/11/2026 15:30:00', net_change: 5 } } } }; }
function fakeSuccess() {
  return {
    getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
    getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
    getStateRecorder: () => ({ recordSuccess: () => {}, recordFailure: () => {} }),
    fetchMarketQuotes: async () => ({ ok: true as const, value: { dto: dto(), metrics: { latencyMs: 10 } } }),
  } as unknown as DhanApiClient;
}

describe('W-24 failure mapping and interaction', () => {
  it('every known code maps correctly, unknown -> INTERNAL_ERROR', async () => {
    const expectations: Array<[string, string]> = [
      ['AUTHENTICATION_FAILURE', 'AUTHENTICATION_FAILED'], ['PRODUCTION_NOT_AUTHORIZED', 'AUTHORIZATION_FAILED'],
      ['MISSING_REQUIRED_FIELD', 'VALIDATION_ERROR'], ['UNRESOLVED_INSTRUMENT', 'IDENTITY_REJECTED'],
      ['RATE_LIMITED', 'RATE_LIMITED'], ['STALE_DATA_SUPPRESSED', 'CACHE_ERROR'],
      ['TRANSPORT_FAILURE', 'TRANSPORT_ERROR'],
      ['PROVIDER_STATUS_FAILURE', 'PROVIDER_ERROR'], ['MALFORMED_RESPONSE', 'VALIDATION_ERROR'],
      ['CONTRACT_MISMATCH', 'CONTRACT_MISMATCH'], ['TIMEOUT', 'TIMEOUT'],
    ];
    for (const [code, cat] of expectations) assert.equal(mapDhanFailureToW24Category(code), cat, `code ${code}`);
    assert.equal(mapDhanFailureToW24Category('UNKNOWN_CODE_XYZ'), 'INTERNAL_ERROR');
    assert.equal(mapDhanFailureToW24Category(''), 'INTERNAL_ERROR');
  });

  it('provider failure path maps to closed category in ring', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const actionId = generateTraceId();
    const svc = new DhanMarketDataService({
      client: {
        getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
        getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
        getStateRecorder: () => ({ recordSuccess: () => {}, recordFailure: () => {} }),
        fetchMarketQuotes: async () => ({ ok: false as const, failure: { code: 'RATE_LIMITED', message: '429', httpStatus: 429 } }),
      } as unknown as DhanApiClient,
      securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const res = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId });
    assert.equal(res.ok, false);
    const events = ring.list().filter((e) => e.actionId === actionId);
    assert.ok(events.length > 0);
    const ends = events.filter((e) => e.event === 'REQUEST_END');
    assert.equal(ends.length, 1);
    assert.ok(ends[0]!.failureCategory !== null);
  });

  it('getFreshness with traceContext records FRESHNESS events', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const actionId = generateTraceId();
    const svc = new DhanMarketDataService({
      client: fakeSuccess(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    const freshness = await svc.getFreshness({ domain: 'D01_QUOTES', companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId });
    assert.ok((freshness as unknown as { domain: string }).domain === 'D01_QUOTES');
    const fresEvents = ring.list().filter((e) => e.operation === 'FRESHNESS' && e.actionId === actionId);
    assert.ok(fresEvents.length >= 2, `expected FRESHNESS events, got ${fresEvents.map((e) => e.event).join(',')}`);
    assert.ok(fresEvents.some((e) => e.event === 'REQUEST_ADMITTED'));
    assert.ok(fresEvents.some((e) => e.event === 'REQUEST_END'));
  });

  it('high-concurrency same-scope: ring bounded, sequence monotonic', async () => {
    const ring = new DhanDiagnosticRing(10);
    const svc = new DhanMarketDataService({
      client: fakeSuccess(), securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring,
      now: () => new Date('2026-11-26T10:00:00.000Z'),
    });
    svc.start();
    const actions = Array.from({ length: 20 }, () => generateTraceId());
    const results = await Promise.all(actions.map((a) => svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: a })));
    for (const r of results) assert.equal(r.ok, true);
    assert.ok(ring.getStats().size <= 10);
    assert.ok(ring.getStats().evictedCount > 0);
    const seqs = ring.list().map((e) => e.sequence);
    for (let i = 1; i < seqs.length; i++) assert.ok(seqs[i]! > seqs[i - 1]!);
  });

  it('no trace header is sent to Dhan', async () => {
    const outbound: unknown[] = [];
    const ring = new DhanDiagnosticRing(1024);
    const client = {
      getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
      getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
      getStateRecorder: () => ({ recordSuccess: () => {}, recordFailure: () => {} }),
      fetchMarketQuotes: async (...args: unknown[]) => {
        outbound.push(args);
        const s = JSON.stringify(args);
        assert.ok(!s.includes('X-IIPS'), `Dhan egress must not contain trace header ${s}`);
        return { ok: true as const, value: { dto: dto(), metrics: { latencyMs: 10 } } };
      },
    } as unknown as DhanApiClient;
    const svc = new DhanMarketDataService({ client, securityMaster: stubSM(), instrumentRegistry: stubReg(), diagnosticRing: ring, now: () => new Date('2026-11-26T10:00:00.000Z') });
    svc.start();
    const res = await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    assert.equal(res.ok, true);
    assert.ok(outbound.length >= 1);
  });
});
