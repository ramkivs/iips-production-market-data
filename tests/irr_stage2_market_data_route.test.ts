/**
 * Institutional Investment Platform System (IIPS)
 * IRR Stage 2 — Provider-Neutral IPD Market-Data Consumer Integration (synthetic)
 *
 * Tests IRR's `DhanMarketDataRoute` (frontend/server/market-data/dhanMarketDataRoute.ts)
 * consuming IPD's provider-neutral `MarketDataTransportClient` over local loopback HTTP.
 *
 * Synthetic only: no live Dhan requests, no Dhan credentials, no network egress
 * from IRR except to an explicitly configured local loopback daemon.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import {
  DhanApiClient,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  MarketDataTransportClient,
  createMarketDataHttpServer,
  resolveDhanProviderConfig,
  DHAN_ENV_KEYS,
} from '../src/providers/dhan/index.js';
import type { DhanHttpTransport, DhanHttpRequest, DhanHttpResponse } from '../src/providers/dhan/dhan_api_client.js';
import {
  DhanMarketDataRoute,
  type DhanMarketDataReadiness,
  type DhanMarketDataRouteConfig,
} from '../src/server/market-data/dhanMarketDataRoute.js';

const TOKEN = 'irr-synthetic-transport-token';
const ID_A = buildD114SecurityIdentity('INE000SYNTH1', 'EQ')!;
if (!ID_A) throw new Error('test setup failed: invalid D114 identity');

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

const CREDENTIAL_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/nonprod/access_token',
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/nonprod/client_id',
};

function quoteVendorBody(ltp = 1520.35) {
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

function historicalVendorBody() {
  return {
    timestamp: [Date.UTC(2026, 8, 21) / 1000],
    open: [100], high: [105], low: [99], close: [104], volume: [10],
  };
}

function vendorTransport(routes: {
  quote?: { status: number; body: unknown };
  historical?: { status: number; body: unknown };
}): DhanHttpTransport {
  return {
    async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
      const url = req.url ?? '';
      if (url.endsWith('/marketfeed/quote')) {
        const r = routes.quote ?? { status: 200, body: quoteVendorBody() };
        return { status: r.status, bodyText: JSON.stringify(r.body) };
      }
      if (url.endsWith('/charts/historical')) {
        const r = routes.historical ?? { status: 200, body: historicalVendorBody() };
        return { status: r.status, bodyText: JSON.stringify(r.body) };
      }
      return { status: 404, bodyText: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'unknown vendor path' } }) };
    },
  };
}

function makeService(opts: {
  env?: Record<string, string | undefined>;
  resolveCreds?: () => Promise<{ accessToken: string; clientId: string; expiresAt?: string } | null>;
  quote?: { status: number; body: unknown };
  historical?: { status: number; body: unknown };
} = {}): DhanMarketDataService {
  const cfg = resolveDhanProviderConfig(opts.env ?? {});
  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', companyName: 'Synth A', industry: 'T', sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [{ exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  const hasCredentialRefs = Boolean(
    opts.env?.[DHAN_ENV_KEYS.accessTokenSecretPath] && opts.env?.[DHAN_ENV_KEYS.clientIdSecretPath],
  );
  const resolveCreds =
    opts.resolveCreds ??
    (hasCredentialRefs
      ? async (): Promise<{ accessToken: string; clientId: string }> => ({
          accessToken: 'synthetic-dhan-token',
          clientId: 'synthetic-client',
        })
      : async (): Promise<null> => null);

  const client = new DhanApiClient({
    config: cfg.config,
    transport: vendorTransport(opts),
    credentialResolver: { resolve: resolveCreds },
    now: () => Date.parse('2026-09-25T10:00:00.000Z'),
  });

  const service = new DhanMarketDataService({
    client,
    securityMaster: sm,
    instrumentRegistry: registry,
    now: () => new Date('2026-09-25T10:00:00.000Z'),
  });
  service.start();
  return service;
}

async function withServer(
  service: DhanMarketDataService,
  fn: (baseUrl: string, route: DhanMarketDataRoute) => Promise<void>,
): Promise<void> {
  const server = createMarketDataHttpServer({ service, token: TOKEN, port: 0, host: '127.0.0.1', env: {} });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await fn(baseUrl, new DhanMarketDataRoute({ baseUrl, token: TOKEN }));
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function assertReadinessCommon(readiness: DhanMarketDataReadiness, daemonAvailable: boolean): void {
  assert.strictEqual(readiness.daemonAvailable, daemonAvailable);
  assert.strictEqual(readiness.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
  assert.strictEqual(readiness.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
  assert.ok(typeof readiness.disclosure === 'string' && readiness.disclosure.includes('PRE_ACCESS'));
}

/** Strips block and line comments so documentation text does not trigger boundary scans. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

function assertNoVendorLeakage(text: string): void {
  assert.ok(!text.includes('SYNTH-NSE-EQ'), 'Dhan vendor security id must not leak to the consumer');
  assert.ok(!text.toLowerCase().includes('dhan'), 'Dhan vendor identifiers must not leak to the consumer');
  assert.ok(!text.includes('synthetic-dhan-token'), 'Dhan credential material must not leak to the consumer');
}

describe('IRR Stage 2 — provider-neutral IPD market-data consumer (synthetic loopback)', () => {
  it('IRR-01: successful synthetic loopback quote returns canonical D01 envelope with explicit readiness', async () => {
    const service = makeService({ env: CREDENTIAL_ENV });
    await withServer(service, async (_baseUrl, route) => {
      const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
      assert.strictEqual(outcome.ok, true);
      if (outcome.ok) {
        assert.strictEqual(outcome.envelope.domain, 'D01_QUOTES');
        assert.strictEqual(outcome.envelope.payload.ltp, 1520.35);
        assert.ok(['CURRENT', 'STALE'].includes(outcome.freshness));
        assert.ok(['CURRENT', 'STALE'].includes(outcome.state));
        assert.ok(['GOOD', 'STALE'].includes(outcome.quality));
        // Vendor identifiers/credentials must not leak into the payload handed to consumers.
        // (The readiness disclosure is an operator-facing pre-access label, not payload data.)
        assertNoVendorLeakage(JSON.stringify({ envelope: outcome.envelope, freshness: outcome.freshness }));
        assertReadinessCommon(outcome.readiness, true);
        // Daemon availability is explicit even when live provider qualification is not claimed.
        // Per-outcome readiness defaults to the fail-closed credential-unavailable state;
        // the observed providerConfiguration comes from getHealth() (covered by IRR-03).
        assert.strictEqual(outcome.readiness.providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      }
    });
  });

  it('IRR-02: synthetic historical response flows through the transport with typed outcome', async () => {
    const service = makeService({ env: CREDENTIAL_ENV });
    await withServer(service, async (_baseUrl, route) => {
      const outcome = await route.getHistorical({
        companyId: 'COMP-SYNTH-A',
        exchangeSegment: 'NSE_EQ',
        isin: 'INE000SYNTH1',
        interval: '1D',
        fromDate: '2026-09-21',
        toDate: '2026-09-21',
      });
      assert.strictEqual(outcome.ok, true);
      if (outcome.ok) {
        assert.strictEqual(outcome.result.returnedCandleCount, 1);
        assert.strictEqual(outcome.result.candles[0]!.interval, '1d');
        assertNoVendorLeakage(JSON.stringify(outcome.result));
        assertReadinessCommon(outcome.readiness, true);
      }
    });
  });

  it('IRR-03: health/readiness reports daemon availability without claiming live provider connectivity', async () => {
    const service = makeService({ env: CREDENTIAL_ENV });
    await withServer(service, async (_baseUrl, route) => {
      const health = await route.getHealth();
      assert.strictEqual(health.daemonAvailable, true);
      assert.strictEqual(health.providerConfiguration, 'CONFIGURED');
      assert.strictEqual(health.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.strictEqual(health.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
      assert.ok(health.disclosure.includes('PRE_ACCESS / SYNTHETIC / OFFLINE'));
    });
  });

  it('IRR-04: daemon unavailable produces an explicit fail-closed outcome (no throw, no fabricated data)', async () => {
    const route = new DhanMarketDataRoute({ baseUrl: 'http://127.0.0.1:62001', token: TOKEN });

    const quote = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(quote.ok, false);
    if (!quote.ok) {
      assert.strictEqual(quote.failure.code, 'TRANSPORT_FAILURE');
      assert.strictEqual(quote.readiness.daemonAvailable, false);
    }

    const historical = await route.getHistorical({
      companyId: 'COMP-SYNTH-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1',
      interval: '1D', fromDate: '2026-09-21', toDate: '2026-09-21',
    });
    assert.strictEqual(historical.ok, false);
    if (!historical.ok) {
      assert.strictEqual(historical.failure.code, 'TRANSPORT_FAILURE');
      assert.strictEqual(historical.readiness.daemonAvailable, false);
    }

    const health = await route.getHealth();
    assert.strictEqual(health.daemonAvailable, false);
    assert.strictEqual(health.providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(health.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
  });

  it('IRR-05: invalid transport token is rejected with UNAUTHENTICATED (daemon answered)', async () => {
    const service = makeService({ env: CREDENTIAL_ENV });
    await withServer(service, async (baseUrl) => {
      const route = new DhanMarketDataRoute({ baseUrl, token: 'wrong-token' });
      const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
      assert.strictEqual(outcome.ok, false);
      if (!outcome.ok) {
        assert.strictEqual(outcome.failure.code, 'UNAUTHENTICATED');
        assert.strictEqual(outcome.failure.httpStatus, 401);
        // A 401 is an HTTP response: the daemon is available, auth is not.
        assert.strictEqual(outcome.readiness.daemonAvailable, true);
      }
    });
  });

  it('IRR-06: transport timeout fails closed with a typed TIMEOUT outcome', async () => {
    let fetchInvoked = false;
    // A fetch that rejects with an AbortError models a socket that never responds;
    // the client must translate it into a typed TIMEOUT instead of throwing.
    const abortingFetch = (async () => {
      fetchInvoked = true;
      const err = new Error('The fetch operation was aborted.') as Error & { name: 'AbortError' };
      err.name = 'AbortError';
      throw err;
    }) as typeof fetch;

    const route = new DhanMarketDataRoute({
      baseUrl: 'http://127.0.0.1:62002',
      token: TOKEN,
      timeoutMs: 25,
      fetchImpl: abortingFetch,
    });
    const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(fetchInvoked, true);
    assert.strictEqual(outcome.ok, false);
    if (!outcome.ok) {
      assert.strictEqual(outcome.failure.code, 'TIMEOUT');
      assert.strictEqual(outcome.readiness.daemonAvailable, false);
    }
  });

  it('IRR-07: unavailable Dhan credentials fail closed with CREDENTIALS_UNAVAILABLE', async () => {
    // No IIPS_DHAN_* credential references: pre-access credential-unavailable state.
    const service = makeService({ env: {} });
    await withServer(service, async (_baseUrl, route) => {
      const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
      assert.strictEqual(outcome.ok, false);
      if (!outcome.ok) {
        assert.strictEqual(outcome.failure.code, 'CREDENTIALS_UNAVAILABLE');
        assert.strictEqual(outcome.failure.httpStatus, 502);
        assert.strictEqual(outcome.readiness.daemonAvailable, true);
        assert.ok(!JSON.stringify(outcome).includes('vault://'));
      }
    });
  });

  it('IRR-08: expired or revoked Dhan credentials fail closed with CREDENTIALS_EXPIRED', async () => {
    for (const status of ['EXPIRED', 'REVOKED']) {
      const service = makeService({
        env: { ...CREDENTIAL_ENV, [DHAN_ENV_KEYS.secretStatus]: status },
      });
      await withServer(service, async (_baseUrl, route) => {
        const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
        assert.strictEqual(outcome.ok, false);
        if (!outcome.ok) {
        assert.strictEqual(outcome.failure.code, 'CREDENTIALS_EXPIRED');
        assert.strictEqual(outcome.readiness.daemonAvailable, true);
        }
      });
    }
  });

  it('IRR-09: provider failures propagate as typed outcomes; no fabricated market data', async () => {
    // Provider rate limit (HTTP 429) propagates verbatim through the transport.
    const rateLimitedService = makeService({
      env: CREDENTIAL_ENV,
      quote: { status: 429, body: { error: { code: 'RATE_LIMITED', message: 'provider rate limit exceeded' } } },
    });
    await withServer(rateLimitedService, async (_baseUrl, route) => {
      const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
      assert.strictEqual(outcome.ok, false);
      if (!outcome.ok) {
        assert.strictEqual(outcome.failure.code, 'RATE_LIMITED');
        assert.strictEqual(outcome.failure.httpStatus, 429);
        assert.strictEqual(outcome.readiness.daemonAvailable, true);
      }
    });

    // Unmapped company fails at the governed identity boundary before any provider call.
    const service = makeService({ env: CREDENTIAL_ENV });
    await withServer(service, async (_baseUrl, route) => {
      const outcome = await route.getQuote({ companyId: 'COMP-UNKNOWN', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
      assert.strictEqual(outcome.ok, false);
      if (!outcome.ok) {
        assert.strictEqual(outcome.failure.code, 'UNRESOLVED_INSTRUMENT');
        assert.strictEqual(outcome.failure.httpStatus, 502);
      }
    });
  });

  it('IRR-10: no direct Dhan vendor access from IRR — loopback pin and vendor URL refusal', async () => {
    // The route only instantiates IPD's provider-neutral client; a non-loopback
    // vendor baseUrl fails preflight before any socket is opened.
    let fetchInvoked = false;
    const route = new DhanMarketDataRoute({
      baseUrl: 'https://api.dhan.co/v2',
      token: TOKEN,
      fetchImpl: (async () => {
        fetchInvoked = true;
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    const outcome = await route.getQuote({ companyId: 'COMP-SYNTH-A', securityIdentity: ID_A, exchangeSegment: 'NSE_EQ' });
    assert.strictEqual(fetchInvoked, false);
    assert.strictEqual(outcome.ok, false);
    if (!outcome.ok) {
      assert.strictEqual(outcome.failure.code, 'TRANSPORT_FAILURE');
    }
  });

  it('IRR-11: the IRR route module imports no Dhan provider primitives or credentials', async () => {
    const routePath = path.resolve(process.cwd(), 'src/server/market-data/dhanMarketDataRoute.ts');
    const source = stripComments(fs.readFileSync(routePath, 'utf8'));

    const forbidden = [
      'DhanApiClient',
      'DhanMarketDataSource',
      'DhanMarketDataService',
      'createMarketDataHttpServer',
      'resolveDhanProviderConfig',
      'PreAccessNoNetworkTransport',
      'DhanServerHttpsTransport',
      'LocalHostVaultDhanCredentialResolver',
      'DisabledWindowsHostVaultBackend',
      'startMarketDataDaemon',
      'api.dhan.co',
      'IIPS_DHAN_',
      'IIPS_MARKET_DATA_TRANSPORT_TOKEN',
      'dhan-server',
    ];
    for (const needle of forbidden) {
      assert.ok(!source.includes(needle), `IRR route must not reference ${needle}`);
    }
    assert.ok(source.includes('MarketDataTransportClient'), 'IRR route must consume IPD MarketDataTransportClient');
  });

  it('IRR-12: browser bundle isolation — frontend client code never imports the server route', async () => {
    const frontendSrc = path.resolve(process.cwd(), 'frontend/src');
    const forbidden = ['frontend/server', 'dhan-server', 'MarketDataTransportClient', 'DhanMarketDataRoute'];
    let files = 0;
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
          files += 1;
          const src = stripComments(fs.readFileSync(full, 'utf8'));
          for (const needle of forbidden) {
            assert.ok(
              !src.includes(needle),
              `frontend client file ${path.relative(process.cwd(), full)} must not import ${needle}`,
            );
          }
        }
      }
    };
    walk(frontendSrc);
    assert.ok(files > 0, 'frontend client source scan found no files');
  });
});
