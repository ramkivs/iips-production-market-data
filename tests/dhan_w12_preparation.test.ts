/** Offline-only W-12 preparation; no Dhan request and no raw vendor response is represented. */
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { validateMarketQuotePayload, type MarketQuotePayload } from '../src/contracts/d01_quotes.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';
import { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';
import { DhanServerHttpsTransport } from '../src/providers/dhan/dhan_server_egress.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { createMarketDataHttpServer } from '../src/providers/dhan/dhan_market_data_http.js';

const identity = buildD114SecurityIdentity('INE002A01018', 'EQ')!;
const request = { companyId: 'EQ_RELIANCE_IN', securityIdentity: identity, exchangeSegment: 'NSE_EQ' as const };
const quote = { last_price: 1339.7, ohlc: { open: 1336.6, high: 1350.7, low: 1324, close: 1339.7 }, volume: 13756247, net_change: 10, last_trade_time: '13/11/2026 15:59:51' };
const syntheticBody = JSON.stringify({ status: 'success', data: { NSE_EQ: { '2885': quote } } });

describe('W-12 offline preparation', () => {
  it('preserves the owner-reported canonical subset without inventing missing fields', () => {
    const f = JSON.parse(readFileSync(resolve('tests/fixtures/dhan_w12_owner_reported_canonical_subset.json'), 'utf8'));
    assert.match(f.notice, /not a captured vendor DTO/);
    assert.deepEqual(f.identity, { companyId: 'EQ_RELIANCE_IN', securityId: 'ISIN:INE002A01018:EQ', exchangeSegment: 'NSE_EQ', dhanSecurityId: '2885' });
    const p = f.observedCanonicalFields;
    assert.deepEqual(p, { ltp: 1339.7, open: 1336.6, high: 1350.7, low: 1324, close: 1339.7, previousClose: 1339.7, volume: 13756247, vwap: 1338.09 });
    assert.ok(p.ltp > 0 && p.open > 0 && p.high > 0 && p.low > 0 && p.high >= p.low);
    assert.ok(p.ltp >= p.low && p.ltp <= p.high && p.open >= p.low && p.open <= p.high);
    assert.ok(Number.isInteger(p.volume) && p.volume >= 0 && p.vwap > 0);
    // The supplied subset omits mandatory symbol and other fields: do not
    // manufacture them or claim the full canonical envelope was validated.
    const incomplete = validateMarketQuotePayload({ ...p, companyId: f.identity.companyId, exchange: 'NSE', currency: 'INR' } as MarketQuotePayload);
    assert.equal(incomplete.isValid, false);
    assert.ok(incomplete.errors.some(e => e.field === 'symbol'));
    assert.equal(f.asOf, '2026-11-13T10:29:51.000Z');
    assert.equal(f.receivedAt, '2026-11-15T13:35:10.151Z');
    const freshness = evaluateFreshness(f.asOf, 'D01_QUOTES', f.receivedAt);
    assert.equal(freshness.ageSeconds, 183919.151);
    assert.equal(freshness.quality, 'UNAVAILABLE');
    assert.equal(f.outcome.freshness, 'UNAVAILABLE');
    assert.equal(f.outcome.qualityState, 'UNAVAILABLE');
  });

  for (const scenario of [
    { name: 'success', status: 200, expected: null },
    { name: 'rate limited', status: 429, expected: 'RATE_LIMITED' },
    { name: 'server error', status: 503, expected: 'HTTP_ERROR' },
    { name: 'authentication error', status: 401, expected: 'AUTHENTICATION_FAILURE' },
    { name: 'redirect rejected', status: 302, expected: 'HTTP_ERROR' },
    { name: 'timeout after send', status: 0, expected: 'TIMEOUT' },
    { name: 'connection failure', status: -1, expected: 'TRANSPORT_FAILURE' },
  ]) {
    it(`one IPD egress invocation on ${scenario.name}, including authenticated HTTP boundary`, async () => {
      let fetches = 0; let credentials = 0;
      const fakeFetch: typeof fetch = async (_url, init) => {
        fetches++;
        assert.equal(init?.redirect, 'error');
        assert.equal(init?.method, 'POST');
        assert.equal(init?.body, '{"NSE_EQ":[2885]}');
        if (scenario.status === 0) throw new DOMException('synthetic timeout', 'TimeoutError');
        if (scenario.status === -1) throw new Error('synthetic network failure');
        return new Response(scenario.status === 200 ? syntheticBody : '{}', { status: scenario.status });
      };
      const client = new DhanApiClient({
        config: { baseUrl: 'https://synthetic.invalid/v2', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
        credentialResolver: { resolve: async () => { credentials++; return { accessToken: 'synthetic-token', clientId: 'synthetic-client' }; } },
        transport: new DhanServerHttpsTransport({ allowedBaseUrl: 'https://synthetic.invalid/v2', env: {}, fetchImpl: fakeFetch }),
      });
      const service = new DhanMarketDataService({ client, instrumentRegistry: loadGovernedP7InstrumentRegistry(resolve('evidence/dhan-p7/qualification-manifest.json')), securityMaster: getGovernedBroadSecurityMaster(), now: () => new Date('2026-11-15T13:35:10.151Z') });
      service.start();
      const server = createMarketDataHttpServer({ service, token: 'synthetic-transport', env: {}, requestTimeoutMs: 1500 });
      await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
      try {
        const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/quotes`;
        const payload = JSON.stringify({ companyId: request.companyId, securityId: identity.securityId, exchangeSegment: request.exchangeSegment });
        const unauth = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload });
        assert.equal(unauth.status, 401);
        assert.equal(fetches, 0);
        const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer synthetic-transport' }, body: payload });
        const body = await response.json() as { ok?: boolean; error?: { code: string } };
        if (scenario.expected === null) { assert.equal(response.status, 200); assert.equal(body.ok, true); }
        else { assert.notEqual(response.status, 200); assert.equal(body.error?.code, scenario.expected); }
        assert.equal(credentials, 1);
        assert.equal(fetches, 1, 'no automatic second vendor egress invocation');
      } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); service.stop(); }
    });
  }
});
