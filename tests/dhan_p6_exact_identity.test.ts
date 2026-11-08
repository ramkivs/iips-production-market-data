/**
 * DHAN-P6 — exact persisted P04 D114 identity mandatory for Dhan quote resolution
 * (synthetic only; no live Dhan qualification).
 *
 * Chain under test: validated D114 identity -> IPD validation -> exact
 * series-aware mapping -> Dhan instrument request -> canonical D01 response.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { buildD114SecurityIdentity, isD114SecurityIdentity, type D114SecurityIdentity } from '../src/contracts/types.js';
import {
  DhanApiClient,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  SecurityMaster,
  createMarketDataHttpServer,
  MarketDataTransportClient,
  dhanOk,
} from '../src/index.js';
import type { DhanHttpTransport, DhanHttpRequest, DhanHttpResponse } from '../src/providers/dhan/dhan_api_client.js';

const ID_EQ = buildD114SecurityIdentity('INE000SYNTH1', 'EQ') as D114SecurityIdentity;
const ID_BE = buildD114SecurityIdentity('INE000SYNTH1', 'BE') as D114SecurityIdentity;
const ID_2 = buildD114SecurityIdentity('INE000SYNTH2', 'EQ') as D114SecurityIdentity;

function mapping(over: Partial<Record<string, unknown>> = {}) {
  return {
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
    ...over,
  };
}

function quoteBody(id: string, ltp: number) {
  return { status: 'success', data: { NSE_EQ: { [id]: { last_price: ltp, ohlc: { open: ltp, close: ltp, high: ltp, low: ltp }, volume: 1, net_change: 0, last_trade_time: '25/09/2026 15:29:58' } } } };
}

interface Rig {
  service: DhanMarketDataService;
  calls: DhanHttpRequest[];
  registry: DhanInstrumentRegistry;
}

function makeService(extraMappings: Array<Record<string, unknown>> = [], bodyFor: (id: string) => unknown = (id) => quoteBody(id, 1520.35)): Rig {
  const registry = new DhanInstrumentRegistry();
  registry.register(mapping());
  registry.register(mapping({ securityId: 'ISIN:INE000SYNTH1:BE', symbol: 'SYNTHA-BE', dhanSecurityId: 'SYNTH-NSE-EQ-1009' }));
  registry.register(mapping({ isin: 'INE000SYNTH2', securityId: 'ISIN:INE000SYNTH2:EQ', symbol: 'SYNTHB', dhanSecurityId: 'SYNTH-NSE-EQ-1002' }));
  for (const m of extraMappings) registry.register(m as never);
  const sm = new SecurityMaster();
  const calls: DhanHttpRequest[] = [];
  const transport: DhanHttpTransport = {
    async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
      calls.push(req);
      const grouped = JSON.parse(req.body as string) as Record<string, string[]>;
      const id = grouped['NSE_EQ']?.[0] ?? 'SYNTH-NSE-EQ-1001';
      return { status: 200, bodyText: JSON.stringify(bodyFor(id)) };
    },
  };
  const client = new DhanApiClient({
    config: { baseUrl: 'https://synthetic.invalid', timeoutMs: 1000, readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' } as never,
    transport,
    credentialResolver: { resolve: async () => ({ accessToken: 'synthetic-dhan-token', clientId: 'synthetic-client' }) } as never,
  });
  const service = new DhanMarketDataService({ client, securityMaster: sm, instrumentRegistry: registry, now: () => new Date('2026-09-25T10:00:00.000Z') });
  service.start();
  return { service, calls, registry };
}

describe('DHAN-P6 exact D114 identity enforcement (synthetic)', () => {
  it('valid exact identity resolves the correct series instrument and returns canonical D01', async () => {
    const { service, calls } = makeService();
    const res = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_EQ, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(calls.length, 1);
    // The provider request used the EQ instrument, not the BE series of the same ISIN.
    const body = JSON.parse(calls[0]!.body as string) as Record<string, string[]>;
    assert.strictEqual(body['NSE_EQ']![0], 'SYNTH-NSE-EQ-1001');
    if (res.ok) {
      assert.strictEqual(res.envelope.domain, 'D01_QUOTES');
      const text = JSON.stringify(res);
      assert.ok(!text.includes('SYNTH-NSE-EQ'), 'no Dhan instrument id leaks outward');
      assert.ok(!text.includes('synthetic-dhan-token'));
    }
  });

  it('a different series of the same company+ISIN resolves its own instrument (no collision)', async () => {
    const { service, calls } = makeService([], (id) => quoteBody(id, id.endsWith('1009') ? 77 : 1520.35));
    const res = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_BE, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(res.ok, true);
    const body = JSON.parse(calls[0]!.body as string) as Record<string, string[]>;
    assert.strictEqual(body['NSE_EQ']![0], 'SYNTH-NSE-EQ-1009');
  });

  it('missing, malformed or inconsistent identity fails closed with zero provider calls', async () => {
    const { service, calls } = makeService();
    const missing = await service.getQuote({ companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ' } as never);
    assert.strictEqual(missing.ok, false);
    const malformed = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: { securityId: 'ISIN:SHORT:EQ' } as never, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(malformed.ok, false);
    // inconsistent company binding: identity of COMP-SYNTH-A requested under another company
    const wrongCompany = await service.getQuote({ companyId: 'COMP-OTHER', securityIdentity: ID_EQ, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(wrongCompany.ok, false);
    // unknown series for a known ISIN
    const unknownSeries = buildD114SecurityIdentity('INE000SYNTH1', 'XX')!;
    const noMapping = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: unknownSeries, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(noMapping.ok, false);
    if (!noMapping.ok) assert.match(noMapping.failure.message, /UNRESOLVED_INSTRUMENT|UNMAPPED_COMPANY_ID/);
    assert.strictEqual(calls.length, 0, 'no Dhan provider call for any invalid identity');
  });

  it('cache isolation: different series of the same ISIN never share a quote entry', async () => {
    const { service, calls } = makeService([], (id) => quoteBody(id, id.endsWith('1009') ? 77 : 1520.35));
    const a = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_EQ, exchangeSegment: 'NSE_EQ' });
    const b = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_BE, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(calls.length, 2, 'series EQ and BE are distinct cache keys');
    if (a.ok && b.ok) {
      assert.strictEqual(a.envelope.payload.ltp, 1520.35);
      assert.strictEqual(b.envelope.payload.ltp, 77);
    }
  });

  it('per-security failure isolation: one unresolved holding does not block another', async () => {
    const { service } = makeService();
    const good = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_2, exchangeSegment: 'NSE_EQ' });
    const bad = await service.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: buildD114SecurityIdentity('INE000SYNTH1', 'XX')!, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(good.ok, true);
    assert.strictEqual(bad.ok, false);
  });

  it('transport carries the canonical securityId and rejects identity-less quote requests pre-provider', async () => {
    const { service, calls } = makeService();
    const server: Server = createMarketDataHttpServer({ service, token: 'synthetic-transport-token', port: 0, host: '127.0.0.1' });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}`;
    try {
      const client = new MarketDataTransportClient(base, 'synthetic-transport-token');
      const okRes = (await client.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_EQ, exchangeSegment: 'NSE_EQ' })) as { ok: boolean };
      assert.strictEqual(okRes.ok, true);
      // wire body must carry securityId, not raw isin-only identity
      const raw = await fetch(`${base}/v1/quotes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer synthetic-transport-token' },
        body: JSON.stringify({ companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', exchangeSegment: 'NSE_EQ' }),
      });
      assert.strictEqual(raw.status, 400);
      assert.strictEqual(calls.length, 1, 'rejected request never reached the provider');
    } finally {
      await new Promise((r) => server.close(r));
    }
  });

  it('registry: same company+segment+ISIN with two series is ambiguous without series, exact with it', () => {
    const { registry } = makeService();
    const ambiguous = registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH1');
    assert.strictEqual(ambiguous.status, 'UNRESOLVED');
    if (ambiguous.status === 'UNRESOLVED') assert.match(ambiguous.reason, /AMBIGUOUS_MAPPING/);
    const exact = registry.resolveExactIdentity('COMP-SYNTH-A', 'NSE_EQ', ID_BE);
    assert.strictEqual(exact.status, 'RESOLVED');
    if (exact.status === 'RESOLVED') assert.strictEqual(exact.mapping.dhanSecurityId, 'SYNTH-NSE-EQ-1009');
    // BSE listing of the same company stays distinguishable
    assert.strictEqual(registry.resolveExactIdentity('COMP-SYNTH-A', 'BSE_EQ', ID_EQ).status, 'UNRESOLVED');
  });

  it('D114 validator itself is the authoritative grammar gate', () => {
    assert.ok(isD114SecurityIdentity(ID_EQ));
    assert.ok(!isD114SecurityIdentity({ securityId: 'ISIN:INE000SYNTH1:EQ', isin: 'INE000SYNTH1', series: 'BE', isinAuthority: 'NON_AUTHORITATIVE' }));
    assert.ok(!isD114SecurityIdentity(null));
  });
});
