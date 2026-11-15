/** Offline regression: numeric vendor wire IDs do not change canonical identities or registry IDs. */
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import { DhanApiClient, type DhanHttpRequest, type DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';

describe('Dhan quote numeric wire IDs (offline)', () => {
  it('loads Reliance from the retained P7 manifest and sends an integer without changing canonical identity', async () => {
    const registry = loadGovernedP7InstrumentRegistry(resolve('evidence/dhan-p7/qualification-manifest.json'));
    const identity = buildD114SecurityIdentity('INE002A01018', 'EQ')!;
    const match = registry.resolveExactIdentity('EQ_RELIANCE_IN', 'NSE_EQ', identity);
    assert.equal(match.status, 'RESOLVED');
    if (match.status !== 'RESOLVED') throw new Error('P7 mapping unavailable');
    assert.equal(match.mapping.dhanSecurityId, '2885');
    assert.equal(identity.securityId, 'ISIN:INE002A01018:EQ');
    const calls: DhanHttpRequest[] = [];
    const transport: DhanHttpTransport = { async send(request) {
      calls.push(request);
      return { status: 400, bodyText: '{}' }; // mock only; no vendor call or qualification claim
    } };
    const client = new DhanApiClient({
      config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
      transport,
      credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }) },
    });
    const service = new DhanMarketDataService({ client, securityMaster: getGovernedBroadSecurityMaster(), instrumentRegistry: registry });
    service.start();
    try {
      await service.getQuote({ companyId: 'EQ_RELIANCE_IN', securityIdentity: identity, exchangeSegment: 'NSE_EQ' });
      assert.equal(calls.length, 1);
      assert.equal(calls[0]!.body, '{"NSE_EQ":[2885]}');
      assert.equal(typeof JSON.parse(calls[0]!.body!).NSE_EQ[0], 'number');
      assert.equal(identity.securityId, 'ISIN:INE002A01018:EQ');
    } finally { service.stop(); }
  });

  it('serializes every qualified mapping in the retained Windows-baseline P7 registry without changing its string ID', () => {
    const registry = loadGovernedP7InstrumentRegistry(resolve('evidence/dhan-p7/qualification-manifest.json'));
    const mappings = registry.list();
    assert.equal(mappings.length, 96);
    for (const mapping of mappings) {
      const id = mapping.dhanSecurityId;
      assert.equal(typeof id, 'string');
      assert.match(id, /^[1-9][0-9]*$/);
      assert.ok(Number.isSafeInteger(Number(id)));
      const body = JSON.parse(DhanApiClient.buildQuoteRequestBody([mapping]));
      assert.deepEqual(body[mapping.exchangeSegment], [Number(id)]);
      assert.equal(mapping.dhanSecurityId, id);
    }
  });

  it('groups and deduplicates numeric IDs by supported exchange segment', () => {
    const body = DhanApiClient.buildQuoteRequestBody([
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: '2885' },
      { exchangeSegment: 'BSE_EQ', dhanSecurityId: '500325' },
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: '2885' },
      { exchangeSegment: 'BSE_EQ', dhanSecurityId: '2885' },
    ]);
    assert.deepEqual(JSON.parse(body), { NSE_EQ: [2885], BSE_EQ: [500325, 2885] });
    assert.deepEqual(JSON.parse(DhanApiClient.buildQuoteRequestBody([
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: '1' },
      { exchangeSegment: 'NSE_EQ', dhanSecurityId: '9007199254740991' },
    ])), { NSE_EQ: [1, Number.MAX_SAFE_INTEGER] });
  });

  it('rejects malformed and unsafe IDs without calling the provider', async () => {
    let calls = 0;
    const client = new DhanApiClient({
      config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
      transport: { async send() { calls++; return { status: 200, bodyText: '{}' }; } },
      credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-token', clientId: 'synthetic-client' }) },
    });
    for (const id of ['', '0', '01', '-1', '1.5', '1e3', ' 2885 ', 'SYNTH-1', '9007199254740992']) {
      const result = await client.fetchMarketQuotes([{ exchangeSegment: 'NSE_EQ', dhanSecurityId: id }]);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.failure.code, 'MALFORMED_INSTRUMENT_MAPPING');
    }
    assert.equal(calls, 0);
  });
});
