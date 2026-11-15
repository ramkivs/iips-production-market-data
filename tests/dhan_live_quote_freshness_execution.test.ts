/** Offline only: live-quote execution and truthful freshness on the deployed baseline. */
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import { DhanApiClient, type DhanHttpRequest, type DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { createMarketDataHttpServer, MarketDataTransportClient } from '../src/providers/dhan/dhan_market_data_http.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';

const asOf = '2026-09-25T10:00:00.000Z';
const now = new Date(Date.parse(asOf) + 169573_000);
const identity = buildD114SecurityIdentity('INE002A01018', 'EQ')!;
const request = { companyId: 'EQ_RELIANCE_IN', securityIdentity: identity, exchangeSegment: 'NSE_EQ' as const };
const quote = { last_price: 1520, ohlc: { open: 1510, high: 1530, low: 1500, close: 1520 }, volume: 1000, net_change: 10, last_trade_time: '25/09/2026 15:30:00' };
const wire = (id = '2885') => JSON.stringify({ status: 'success', data: { NSE_EQ: { [id]: quote } } });
function rig(send: DhanHttpTransport['send'], clock = now) {
  const requests: DhanHttpRequest[] = [];
  const client = new DhanApiClient({
    config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
    credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }) },
    transport: { async send(req) { requests.push(req); return send(req); } },
  });
  const service = new DhanMarketDataService({ client, instrumentRegistry: loadGovernedP7InstrumentRegistry(resolve('evidence/dhan-p7/qualification-manifest.json')), securityMaster: getGovernedBroadSecurityMaster(), now: () => clock });
  service.start();
  return { service, requests };
}

describe('Dhan owner-requested quote freshness (synthetic transport only)', () => {
  it('fetches a 169573-second-old provider observation and preserves its exact unavailable verdict', async () => {
    const r = rig(async () => ({ status: 200, bodyText: wire() }));
    try {
      assert.equal(identity.securityId, 'ISIN:INE002A01018:EQ');
      const first = await r.service.getQuote(request);
      assert.equal(first.ok, true);
      assert.equal(first.freshness, 'UNAVAILABLE');
      assert.equal(first.envelope.companyId, 'EQ_RELIANCE_IN');
      assert.equal(first.envelope.securityId, 'ISIN:INE002A01018:EQ');
      assert.equal(first.envelope.payload.exchange, 'NSE');
      assert.equal(first.envelope.payload.ltp, 1520);
      assert.equal(first.envelope.provenance.asOf, asOf);
      assert.equal(first.envelope.provenance.receivedAt, now.toISOString());
      assert.equal(first.envelope.provenance.evaluatedAt, now.toISOString());
      assert.equal(first.envelope.provenance.qualityState, 'UNAVAILABLE');
      const status = r.service.getFreshness({ domain: 'D01_QUOTES', ...request });
      assert.equal(status.ageSeconds, 169573);
      assert.equal(status.thresholdSeconds, 900);
      assert.equal(status.verdict, 'UNAVAILABLE');
      assert.equal(status.suppressExecution, true); // downstream use policy, not quote-fetch gate
      assert.equal(status.eligibleForUse, false);
      assert.equal(status.cacheState, 'UNAVAILABLE');
      assert.equal(status.lastRefresh.outcome, 'SUCCESS');
      // Even an unavailable cached observation cannot prevent a later explicit fetch.
      const second = await r.service.getQuote(request);
      assert.equal(second.ok, true);
      assert.equal(r.requests.length, 2);
      for (const call of r.requests) assert.equal(call.body, '{"NSE_EQ":[2885]}');
    } finally { r.service.stop(); }
  });

  it('returns unavailable truthfully across authenticated HTTP and the updated transport client', async () => {
    const r = rig(async () => ({ status: 200, bodyText: wire() }));
    const server = createMarketDataHttpServer({ service: r.service, token: 'synthetic-transport-token', env: {} });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    try {
      const client = new MarketDataTransportClient(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, 'synthetic-transport-token');
      const result = await client.getQuote(request);
      assert.equal(result.ok, true);
      assert.equal(result.freshness, 'UNAVAILABLE');
      assert.equal(result.envelope.companyId, 'EQ_RELIANCE_IN');
      assert.equal(result.envelope.securityId, 'ISIN:INE002A01018:EQ');
      assert.equal(result.envelope.provenance.qualityState, 'UNAVAILABLE');
      assert.equal(result.envelope.provenance.asOf, asOf);
      assert.equal(result.envelope.provenance.receivedAt, now.toISOString());
      assert.equal(result.envelope.provenance.evaluatedAt, now.toISOString());
      assert.equal(r.requests.length, 1);
      assert.equal(r.requests[0]!.body, '{"NSE_EQ":[2885]}');
    } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); r.service.stop(); }
  });

  it('preserves identity in the raw authenticated quote response and rejects invalid identities before egress', async () => {
    const r = rig(async () => ({ status: 200, bodyText: wire() }));
    const server = createMarketDataHttpServer({ service: r.service, token: 'synthetic-transport-token', env: {} });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1/quotes`;
    const headers = { authorization: 'Bearer synthetic-transport-token', 'content-type': 'application/json' };
    try {
      for (const body of [
        { companyId: 'EQ_RELIANCE_IN', exchangeSegment: 'NSE_EQ' },
        { companyId: 'EQ_RELIANCE_IN', securityId: 'ISIN:SHORT:EQ', exchangeSegment: 'NSE_EQ' },
        { companyId: 'EQ_RELIANCE_IN', securityId: 'ISIN:INE002A01018:BE', exchangeSegment: 'NSE_EQ' },
        { companyId: 'EQ_NONEXISTENT', securityId: identity.securityId, exchangeSegment: 'NSE_EQ' },
      ]) {
        const invalid = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        assert.notEqual(invalid.status, 200);
        assert.equal(r.requests.length, 0);
      }
      const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ companyId: request.companyId, securityId: identity.securityId, exchangeSegment: request.exchangeSegment }) });
      assert.equal(response.status, 200);
      const body = await response.json() as { ok: boolean; freshness: string; envelope: { companyId: string; securityId: string; provenance: { asOf: string; qualityState: string } } };
      assert.equal(body.ok, true);
      assert.equal(body.envelope.companyId, 'EQ_RELIANCE_IN');
      assert.equal(body.envelope.securityId, 'ISIN:INE002A01018:EQ');
      assert.equal(body.freshness, 'UNAVAILABLE');
      assert.equal(body.envelope.provenance.qualityState, 'UNAVAILABLE');
      assert.equal(body.envelope.provenance.asOf, asOf);
      assert.equal(r.requests.length, 1);
      assert.equal(r.requests[0]!.body, '{"NSE_EQ":[2885]}');
    } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); r.service.stop(); }
  });

  it('never replaces an explicit provider error with a cached success', async () => {
    const scenarios = [
      { name: 'authentication', status: 401, body: '{}', expected: 'AUTHENTICATION_FAILURE' },
      { name: 'subscription-like 400', status: 400, body: '{"errorCode":"806"}', expected: 'HTTP_ERROR' },
      { name: 'forbidden', status: 403, body: '{}', expected: 'AUTHENTICATION_FAILURE' },
      { name: 'invalid instrument', status: 200, body: wire('999'), expected: 'INSTRUMENT_NOT_IN_RESPONSE' },
      { name: 'provider status', status: 200, body: '{"status":"failure","data":{}}', expected: 'PROVIDER_STATUS_FAILURE' },
      { name: 'transport', status: 0, body: '', expected: 'TRANSPORT_FAILURE' },
    ];
    for (const scenario of scenarios) {
      let count = 0;
      const r = rig(async () => {
        if (++count === 1) return { status: 200, bodyText: wire() };
        if (!scenario.status) throw new Error('synthetic transport failure');
        return { status: scenario.status, bodyText: scenario.body };
      });
      try {
        assert.equal((await r.service.getQuote(request)).ok, true, scenario.name);
        const result = await r.service.getQuote(request);
        assert.equal(result.ok, false, scenario.name);
        if (!result.ok) assert.equal(result.failure.code, scenario.expected, scenario.name);
        assert.ok(count >= 2, scenario.name);
        assert.equal(r.service.getFreshness({ domain: 'D01_QUOTES', ...request }).verdict, 'UNAVAILABLE');
      } finally { r.service.stop(); }
    }
  });

  it('does not silently substitute a current cache entry when the next provider request fails', async () => {
    let count = 0;
    const r = rig(async () => ++count === 1
      ? { status: 200, bodyText: wire() }
      : { status: 401, bodyText: '{}' }, new Date(asOf));
    try {
      const first = await r.service.getQuote(request);
      assert.equal(first.ok, true);
      assert.equal(first.freshness, 'CURRENT');
      const second = await r.service.getQuote(request);
      assert.equal(second.ok, false);
      if (!second.ok) assert.equal(second.failure.code, 'AUTHENTICATION_FAILURE');
      assert.equal(count, 2);
      assert.equal(r.service.getFreshness({ domain: 'D01_QUOTES', ...request }).cacheState, 'CURRENT');
    } finally { r.service.stop(); }
  });

  it('leaves shared D01 and historical freshness suppression policy unchanged', () => {
    const d01 = evaluateFreshness(asOf, 'D01_QUOTES', now.toISOString());
    assert.equal(d01.ageSeconds, 169573);
    assert.equal(d01.quality, 'UNAVAILABLE');
    assert.equal(d01.suppressExecution, true);
    const d02 = evaluateFreshness(asOf, 'D02_OHLCV', new Date(Date.parse(asOf) + 172801_000).toISOString());
    assert.equal(d02.quality, 'UNAVAILABLE');
    assert.equal(d02.suppressExecution, true);
  });
});
