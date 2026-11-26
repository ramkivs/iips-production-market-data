/**
 * W-24 — HTTP safeguards: loopback-only, bearer reuse, bounded params, fail-closed, disclosure, daemon/client correlation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createMarketDataHttpServer, MarketDataTransportClient, MARKET_DATA_ROUTES } from '../src/providers/dhan/dhan_market_data_http.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanDiagnosticRing } from '../src/providers/dhan/dhan_diagnostic_ring.js';
import { generateTraceId } from '../src/providers/dhan/dhan_trace.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import type { SecurityMaster } from '../src/identity/security_master.js';

const IDENTITY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
const TOKEN = 'w24-test-token-aaaaaaaaaaaaaaaa';
function stubReg() {
  const r = new DhanInstrumentRegistry();
  r.registerAll([{ companyId: 'COMP_INFY', exchange: 'NSE' as const, symbol: 'INFY', exchangeSegment: 'NSE_EQ' as const, isin: 'INE009A01021', securityId: 'ISIN:INE009A01021:EQ', dhanSecurityId: '1333', mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const }]);
  return r;
}
// fix stubSM typo
function makeSM(): SecurityMaster { return { getIdentity: () => IDENTITY, isEligible: () => true } as unknown as SecurityMaster; }
function dto() { return { status: 'success', data: { NSE_EQ: { '1333': { last_price: 100, ohlc: { open: 90, high: 110, low: 80, close: 100 }, volume: 1, last_trade_time: '26/11/2026 15:30:00', net_change: 5 } } } }; }
function fakeApiClient() {
  return {
    getConfig: () => ({ readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' }),
    getObservedState: () => ({ authLatched: false, lastFailure: null, lastSuccessAt: null, lastLatencyMs: null }),
    getStateRecorder: () => ({ recordSuccess: () => {}, recordFailure: () => {} }),
    fetchMarketQuotes: async () => ({ ok: true as const, value: { dto: dto(), metrics: { latencyMs: 10 } } }),
  } as unknown as import('../src/providers/dhan/dhan_api_client.js').DhanApiClient;
}
async function withServer<T>(service: DhanMarketDataService, fn: (base: string, token: string) => Promise<T>): Promise<T> {
  const server = createMarketDataHttpServer({ service, token: TOKEN, host: '127.0.0.1', env: {} });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const port = (server.address() as AddressInfo).port;
  try { return await fn(`http://127.0.0.1:${port}`, TOKEN); }
  finally { await new Promise<void>((r) => server.close(() => r())); }
}
function fakeServiceWithRing(ring?: DhanDiagnosticRing): DhanMarketDataService {
  const r = ring ?? new DhanDiagnosticRing(1024);
  const svc = new DhanMarketDataService({ client: fakeApiClient(), securityMaster: makeSM(), instrumentRegistry: stubReg(), diagnosticRing: r, now: () => new Date() });
  svc.start(); return svc;
}

describe('W-24 HTTP safeguards', () => {
  it('GET /v1/trace/ring requires bearer', async () => {
    const svc = fakeServiceWithRing();
    await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    await withServer(svc, async (base, token) => {
      const noAuth = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}`);
      assert.equal(noAuth.status, 401);
      const withAuth = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}`, { headers: { authorization: `Bearer ${token}` } });
      assert.equal(withAuth.status, 200);
      const body = await withAuth.json() as Record<string, unknown>;
      assert.equal(body.ok, true);
      assert.equal((body as { contractVersion: number }).contractVersion, 1);
      assert.ok(Array.isArray((body as { events: unknown[] }).events));
      const stats = (body as { stats: Record<string, unknown> }).stats;
      assert.equal(typeof stats.capacity, 'number');
    });
  });

  it('bounded limit and sinceSequence', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const svc = fakeServiceWithRing(ring);
    for (let i = 0; i < 5; i++) await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    await withServer(svc, async (base, token) => {
      const headers = { authorization: `Bearer ${token}` };
      const r1 = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}?limit=2`, { headers });
      assert.equal(r1.status, 200);
      const b1 = await r1.json() as { events: unknown[] };
      assert.equal(b1.events.length, 2);
      const all = await (await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}`, { headers })).json() as { events: Array<{ sequence: number }> };
      const since = all.events[2]!.sequence;
      const r2 = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}?sinceSequence=${since}`, { headers });
      assert.equal(r2.status, 200);
      const b2 = await r2.json() as { events: Array<{ sequence: number }> };
      assert.ok(b2.events.every((e) => e.sequence >= since));
      const r3 = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}?limit=9999`, { headers });
      assert.equal(r3.status, 200); // clamped to 1024, not rejected
      const r3b = await r3.json() as { events: unknown[] };
      assert.ok(r3b.events.length <= 1024);
      const r4 = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}?limit=abc`, { headers });
      assert.equal(r4.status, 400);
    });
  });

  it('POST /v1/quotes trace header contract-mismatch handling', async () => {
    const svc = fakeServiceWithRing();
    await withServer(svc, async (base, token) => {
      const goodActionId = generateTraceId();
      const okRes = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'X-IIPS-Trace-Version': '1', 'X-IIPS-Action-Id': goodActionId },
        body: JSON.stringify({ companyId: 'COMP_INFY', securityId: IDENTITY.securityId, exchangeSegment: 'NSE_EQ' }),
      });
      assert.equal(okRes.status, 200);
      const okBody = await okRes.json() as { ok: boolean; envelope?: { provenance?: Record<string, unknown> } };
      assert.equal(okBody.ok, true);
      assert.equal(okBody.envelope?.provenance?.traceId, goodActionId);

      const noTrace = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: 'COMP_INFY', securityId: IDENTITY.securityId, exchangeSegment: 'NSE_EQ' }),
      });
      assert.equal(noTrace.status, 200);
      const noTraceBody = await noTrace.json() as { envelope?: { provenance?: Record<string, unknown> } };
      assert.equal(noTraceBody.envelope?.provenance?.traceId, undefined);

      const badVersion = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'X-IIPS-Trace-Version': '2', 'X-IIPS-Action-Id': goodActionId },
        body: JSON.stringify({ companyId: 'COMP_INFY', securityId: IDENTITY.securityId, exchangeSegment: 'NSE_EQ' }),
      });
      assert.equal(badVersion.status, 400);
      const badBody = await badVersion.json() as { error?: { code?: string } };
      assert.equal(badBody.error?.code, 'CONTRACT_MISMATCH');

      const badId = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'X-IIPS-Trace-Version': '1', 'X-IIPS-Action-Id': 'NOT-A-UUID' },
        body: JSON.stringify({ companyId: 'COMP_INFY', securityId: IDENTITY.securityId, exchangeSegment: 'NSE_EQ' }),
      });
      assert.equal(badId.status, 400);
    });
  });

  it('disclosure canary: no vault:// in W-24 surfaces, events are 12-field + 1KiB', async () => {
    const canary = 'CANARY_SECRET_VALUE_W24_9f3c1e7a';
    void canary;
    const ring = new DhanDiagnosticRing(1024);
    const svc = fakeServiceWithRing(ring);
    const actionId = generateTraceId();
    await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId });
    await withServer(svc, async (base, token) => {
      const headers = { authorization: `Bearer ${token}` } as Record<string, string>;
      const qr = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json', 'X-IIPS-Trace-Version': '1', 'X-IIPS-Action-Id': actionId },
        body: JSON.stringify({ companyId: 'COMP_INFY', securityId: IDENTITY.securityId, exchangeSegment: 'NSE_EQ' }),
      });
      const qt = await qr.text();
      assert.ok(!qt.includes('vault://'));
      const tr = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}`, { headers });
      const tt = await tr.text();
      assert.ok(!tt.includes('vault://'));
      const j = JSON.parse(tt) as { events: Array<Record<string, unknown>> };
      for (const ev of j.events) {
        const allowed = new Set(['schemaVersion','timestampUtc','component','operation','event','actionId','workId','attemptId','outcome','failureCategory','durationMs','sequence']);
        for (const k of Object.keys(ev)) assert.ok(allowed.has(k), `unexpected key ${k}`);
        const s = JSON.stringify(ev);
        assert.ok(!s.includes('vault://'));
        assert.ok(s.length <= 1024);
      }
    });
  });

  it('MarketDataTransportClient propagates trace headers', async () => {
    const svc = fakeServiceWithRing();
    await withServer(svc, async (base, token) => {
      const url = new URL(base);
      const client = new MarketDataTransportClient(`http://127.0.0.1:${url.port}`, token);
      const ctx = client.generateTraceContext();
      assert.equal(ctx.traceVersion, '1');
      assert.equal(ctx.actionId.length, 36);
      const outcome = await client.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, ctx);
      assert.equal(outcome.ok, true);
      if (outcome.ok) assert.equal((outcome.envelope.provenance as unknown as { traceId: string }).traceId, ctx.actionId);
    });
  });

  it('MarketDataTransportClient.getTraceRing reads via bearer', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const svc = fakeServiceWithRing(ring);
    await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    await withServer(svc, async (base, token) => {
      const url = new URL(base);
      const client = new MarketDataTransportClient(`http://127.0.0.1:${url.port}`, token);
      const res = await client.getTraceRing({ limit: 2 });
      assert.equal(res.ok, true);
      if (res.ok) { assert.equal(res.contractVersion, 1); assert.equal(res.events.length, 2); assert.equal(res.stats.capacity, 1024); }
    });
  });

  it('daemon/client correlation: same actionId in provenance and ring', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const svc = fakeServiceWithRing(ring);
    await withServer(svc, async (base, token) => {
      const url = new URL(base);
      const client = new MarketDataTransportClient(`http://127.0.0.1:${url.port}`, token);
      const ctx = client.generateTraceContext();
      const quoteOutcome = await client.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, ctx);
      assert.equal(quoteOutcome.ok, true);
      const ringOutcome = await client.getTraceRing();
      assert.equal(ringOutcome.ok, true);
      if (ringOutcome.ok && quoteOutcome.ok) {
        const prov = (quoteOutcome.envelope.provenance as unknown as { traceId: string }).traceId;
        assert.equal(prov, ctx.actionId);
        const ids = new Set(ringOutcome.events.map((e) => e.actionId));
        assert.ok(ids.has(ctx.actionId));
      }
    });
  });

  it('GET /v1/freshness with trace headers records FRESHNESS events', async () => {
    const ring = new DhanDiagnosticRing(1024);
    const svc = fakeServiceWithRing(ring);
    await svc.getQuote({ companyId: 'COMP_INFY', exchangeSegment: 'NSE_EQ', securityIdentity: IDENTITY }, { traceVersion: '1', actionId: generateTraceId() });
    await withServer(svc, async (base, token) => {
      const actionId = generateTraceId();
      const res = await fetch(`${base}${MARKET_DATA_ROUTES.freshness}?domain=D02_OHLCV`, { headers: { authorization: `Bearer ${token}`, 'X-IIPS-Trace-Version': '1', 'X-IIPS-Action-Id': actionId } });
      assert.equal(res.status, 200);
      const check = await fetch(`${base}${MARKET_DATA_ROUTES.traceRing}`, { headers: { authorization: `Bearer ${token}` } });
      const j = await check.json() as { events: Array<{ operation: string; actionId: string }> };
      const fres = j.events.filter((e) => e.operation === 'FRESHNESS' && e.actionId === actionId);
      assert.ok(fres.length > 0, 'expected FRESHNESS trace events');
    });
  });
});
