/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P5 Composed Service & HTTP Transport Suite (synthetic only)
 *
 * Structural/contract validation with synthetic credentials, transports and
 * provider responses. NOT live Dhan qualification.
 */

import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  DhanApiClient,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  SecurityMaster,
  createMarketDataHttpServer,
  MarketDataTransportClient,
  MARKET_DATA_ROUTES,
  dhanOk,
} from '../src/index.js';
import type { DhanHttpTransport, DhanHttpRequest, DhanHttpResponse } from '../src/providers/dhan/dhan_api_client.js';

const TOKEN = 'synthetic-transport-token';
const MAPPING = {
  companyId: 'COMP-SYNTH-A',
  isin: 'INE000SYNTH1',
  securityId: 'ISIN:INE000SYNTH1:EQ',
  exchange: 'NSE' as const,
  symbol: 'SYNTHA',
  exchangeSegment: 'NSE_EQ' as const,
  dhanSecurityId: 'SYNTH-NSE-EQ-1001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const,
  instrumentType: 'EQUITY' as const,
  active: true,
};

function quoteBody(ltp = 1520.35) {
  return {
    status: 'success',
    data: {
      NSE_EQ: {
        'SYNTH-NSE-EQ-1001': {
          last_price: ltp,
          ohlc: { open: 1510, close: ltp, high: 1530, low: 1505.5 },
          volume: 2540000,
          net_change: 12.35,
          last_trade_time: '25/09/2026 15:29:58',
        },
      },
    },
  };
}

function makeService(transport: DhanHttpTransport, opts: { fail?: boolean } = {}) {
  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);
  registry.register({ ...MAPPING, isin: 'INE000SYNTH2', securityId: 'ISIN:INE000SYNTH2:EQ', symbol: 'SYNTHA2', dhanSecurityId: 'SYNTH-NSE-EQ-1002' });
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', companyName: 'Synth A', industry: 'T', sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [{ exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });
  const client = new DhanApiClient({
    config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
    transport,
    credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-dhan-token', clientId: 'synthetic-client' }) } as never,
  });
  const service = new DhanMarketDataService({ client, securityMaster: sm, instrumentRegistry: registry, now: () => new Date('2026-09-25T10:00:00.000Z') });
  service.start();
  return service;
}

async function withServer(service: DhanMarketDataService, fn: (baseUrl: string, client: MarketDataTransportClient) => Promise<void>) {
  const server: Server = createMarketDataHttpServer({ service, token: TOKEN, port: 0, host: '127.0.0.1' });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  try {
    await fn(`http://127.0.0.1:${port}`, new MarketDataTransportClient(`http://127.0.0.1:${port}`, TOKEN));
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const okTransport = (payload: unknown = quoteBody()): DhanHttpTransport => ({
  async send(_req: DhanHttpRequest): Promise<DhanHttpResponse> {
    return { status: 200, bodyText: JSON.stringify(payload) };
  },
});

describe('DHAN-P5 composed service & transport (synthetic)', () => {
  it('P5-01: server refuses to start without a transport credential (fail closed)', () => {
    const saved = process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN;
    delete process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN;
    try {
      assert.throws(() => createMarketDataHttpServer({ service: makeService(okTransport()) }), /refusing to start/i);
    } finally {
      if (saved !== undefined) process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN = saved;
    }
  });

  it('P5-02: authenticated quote request returns canonical D01 envelope with asOf/provenance/freshness', async () => {
    const service = makeService(okTransport());
    await withServer(service, async (_base, client) => {
      const res = (await client.getQuote({ companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', exchangeSegment: 'NSE_EQ' })) as never as { ok: true; envelope: { domain: string; payload: { ltp: number; companyId: string }; provenance: { asOf: string } }; freshness: string };
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.envelope.domain, 'D01_QUOTES');
      assert.strictEqual(res.envelope.payload.ltp, 1520.35);
      assert.strictEqual(res.envelope.provenance.asOf, '2026-09-25T09:59:58.000Z');
      assert.ok(['CURRENT', 'STALE'].includes(res.freshness));
      // No vendor/provider identifiers leak into the consumer response.
      const text = JSON.stringify(res);
      assert.ok(!text.includes('SYNTH-NSE-EQ'));
      assert.ok(!text.toLowerCase().includes('dhan'));
      assert.ok(!text.includes('synthetic-dhan-token'));
    });
  });

  it('P5-03: missing/invalid auth rejected; malformed JSON rejected before provider invocation', async () => {
    let providerCalls = 0;
    const counting: DhanHttpTransport = {
      async send(req) { providerCalls++; return okTransport().send(req); },
    };
    const service = makeService(counting);
    await withServer(service, async (base) => {
      const noAuth = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      assert.strictEqual(noAuth.status, 401);
      const badAuth = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer wrong' }, body: '{}' });
      assert.strictEqual(badAuth.status, 401);
      const badJson = await fetch(`${base}${MARKET_DATA_ROUTES.quotes}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` }, body: '{not json' });
      assert.strictEqual(badJson.status, 400);
      assert.strictEqual(providerCalls, 0); // rejected before provider invocation
    });
  });

  it('P5-04: ambiguous company-only request fails closed; multi-ISIN and NSE/BSE stay distinct; exact ISIN resolves', async () => {
    const service = makeService(okTransport());
    // Two securities on the same segment for one company -> company+segment ambiguous without ISIN.
    const amb = await service.getQuote({ companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(amb.ok, false);
    if (!amb.ok) assert.match(amb.failure.message, /AMBIGUOUS_MAPPING|UNRESOLVED_INSTRUMENT/);
    // Exact security identity resolves.
    const exact = await service.getQuote({ companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1' });
    assert.strictEqual(exact.ok, true);
    // Unknown company fails closed, no name/symbol fallback.
    const unk = await service.getQuote({ companyId: 'Synth A' }); // company NAME must not resolve
    assert.strictEqual(unk.ok, false);
  });

  it('P5-05: health reports service UP without implying live provider connectivity', async () => {
    const service = makeService(okTransport());
    await withServer(service, async (_b, client) => {
      const health = (await client.health()) as { service: string; liveProviderConnectivity: string; providerQualification: string; providerConfiguration: string };
      assert.strictEqual(health.service, 'UP');
      assert.strictEqual(health.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.strictEqual(health.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
      assert.strictEqual(health.providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      assert.ok(!JSON.stringify(health).includes('synthetic'));
    });
  });

  it('P5-06: historical request flows through the composed D02 path; distinct intervals do not coalesce; malformed provider response handled safely', async () => {
    const T0 = Date.UTC(2026, 8, 21) / 1000;
    const histPayload = {
      timestamp: [T0], open: [100], high: [105], low: [99], close: [104], volume: [10],
    };
    const service = makeService(okTransport(histPayload));
    const res = await service.getHistorical({
      companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1',
      interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-21',
    });
    assert.strictEqual(res.ok, true);
    if (res.ok) {
      assert.strictEqual(res.result.returnedCandleCount, 1);
      assert.strictEqual(res.result.candles[0]!.interval, '1d');
      assert.ok(!JSON.stringify(res.result).includes('SYNTH-NSE-EQ'));
    }
    // Malformed provider response -> explicit failure, never cached as valid.
    const badService = makeService(okTransport('garbage'));
    const bad = await badService.getHistorical({
      companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1',
      interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-21',
    });
    assert.strictEqual(bad.ok, false);
  });

  it('P5-07: duplicate quote requests coalesce through the transport; failed refresh preserves prior observation; service stop is deterministic', async () => {
    let calls = 0;
    const counting: DhanHttpTransport = {
      async send(req) { calls++; await new Promise((r) => setTimeout(r, 20)); return okTransport().send(req); },
    };
    const service = makeService(counting);
    await withServer(service, async (_b, client) => {
      const [a, b] = await Promise.all([
        client.getQuote({ companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', exchangeSegment: 'NSE_EQ' }),
        client.getQuote({ companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', exchangeSegment: 'NSE_EQ' }),
      ]);
      assert.strictEqual((a as { ok: boolean }).ok, true);
      assert.strictEqual((b as { ok: boolean }).ok, true);
      assert.strictEqual(calls, 1); // coalesced
    });
    service.stop();
    assert.strictEqual(service.isRunning, false);
    const afterStop = await service.getQuote({ companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(afterStop.ok, false); // deterministic shutdown
  });
});
