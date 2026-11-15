import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DhanApiClient, parseDhanRetryAfterMs } from '../src/providers/dhan/dhan_api_client.js';
import { DhanServerHttpsTransport } from '../src/providers/dhan/dhan_server_egress.js';

describe('Dhan retry-after boundary (offline)', () => {
  it('accepts safe delta-seconds and strict HTTP-date, rejecting malformed and overflow values', () => {
    const now = Date.parse('2026-11-15T13:35:10.000Z');
    assert.equal(parseDhanRetryAfterMs('3', now), 3000);
    assert.equal(parseDhanRetryAfterMs('Sun, 15 Nov 2026 13:35:15 GMT', now), 5000);
    assert.equal(parseDhanRetryAfterMs('Sun, 15 Nov 2026 13:35:05 GMT', now), 0);
    for (const value of ['', '-1', '1.5', '1e3', '999999999999999999999999', 'secret', '2026-11-15', 'Mon, 15 Nov 2026 13:35:15 GMT']) {
      assert.equal(parseDhanRetryAfterMs(value, now), undefined);
    }
  });
  it('propagates only numeric retry delay for 429/503; no response body or header leaks', async () => {
    for (const status of [429, 503]) {
      const transport = new DhanServerHttpsTransport({ allowedBaseUrl: 'https://synthetic.invalid/v2', env: {}, fetchImpl: async () => new Response('sensitive-body', { status, headers: { 'retry-after': '7' } }) });
      const client = new DhanApiClient({ config: { baseUrl: 'https://synthetic.invalid/v2', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never, transport, credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }) } });
      const result = await client.fetchMarketQuotes([{ exchangeSegment: 'NSE_EQ', dhanSecurityId: '2885' }]);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.failure.retryAfterMs, 7000);
        assert.equal(result.failure.httpStatus, status);
        assert.ok(!JSON.stringify(result).includes('sensitive-body'));
        assert.ok(!JSON.stringify(result).includes('synthetic-token'));
      }
    }
  });
});
