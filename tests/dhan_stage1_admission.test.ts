/**
 * Stage 1 — Dhan Credential and Authenticated Transport Admission Tests
 *
 * Verifies the 10-point non-production Stage 1 admission policy:
 *  S1-01/02: IPD server-side SecretRef ownership & expired/revoked SecretRef fail-closed
 *  S1-03/05: IPD-internal DhanServerHttpsTransport boundary & exclusion from ./dhan-server
 *  S1-04/09: MarketDataTransportClient provider-neutral typed fail-closed outcomes
 *  S1-06:    Browser closure isolation from Dhan credentials, transport, and endpoints
 *  S1-07/08: Local loopback-only binding & explicit production exclusion (PRODUCTION_NOT_AUTHORIZED)
 *  S1-10:    Quote retrieval immutability & G3 durable portfolio write fence preservation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AddressInfo } from 'node:net';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import {
  DhanApiClient,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  DhanServerHttpsTransport,
  MarketDataTransportClient,
  PreAccessNoNetworkTransport,
  createMarketDataHttpServer,
  describeDhanConfig,
  resolveDhanProviderConfig,
  DHAN_ENV_KEYS,
} from '../src/providers/dhan/index.js';
import * as dhanServerPublic from '../src/providers/dhan/package.js';
import * as portfolioUiPublic from '../src/ui/portfolio_ui_package.js';
import { evaluatePortSaveGuard, WriteNotAuthorizedError } from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';

const ISIN_INFY = 'INE009A01021';
const ID_INFY = (() => {
  const id = buildD114SecurityIdentity(ISIN_INFY, 'EQ');
  if (!id) throw new Error('test setup failed: invalid D114 identity');
  return id;
})();

const VALID_CONFIG_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/nonprod/access_token',
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/nonprod/client_id',
};

function makeQuoteWire(ltp: number): string {
  return JSON.stringify({
    status: 'success',
    data: {
      NSE_EQ: {
        'SYNTH-NSE-EQ-1594': {
          last_price: ltp,
          ohlc: { open: ltp - 5, high: ltp + 5, low: ltp - 10, close: ltp - 2 },
          volume: 10_000,
          net_change: 2.5,
          last_trade_time: '08/11/2026 11:15:00',
        },
      },
    },
  });
}

function buildTestService(opts: {
  send?: (req: DhanHttpRequest) => Promise<DhanHttpResponse>;
  resolveCreds?: () => Promise<{ accessToken: string; clientId: string; expiresAt?: string } | null>;
  env?: Record<string, string | undefined>;
}) {
  const cfg = resolveDhanProviderConfig(opts.env ?? VALID_CONFIG_ENV);
  if (!cfg.ok) throw new Error(`unexpected config failure: ${cfg.failure.code}`);

  const transport: DhanHttpTransport = opts.send
    ? { send: opts.send }
    : new PreAccessNoNetworkTransport();

  const client = new DhanApiClient({
    config: cfg.config,
    transport,
    ...(opts.resolveCreds
      ? { credentialResolver: { resolve: () => opts.resolveCreds!() } }
      : {}),
    now: () => Date.parse('2026-11-08T06:00:00.000Z'),
  });

  const registry = new DhanInstrumentRegistry();
  registry.register({
    companyId: 'COMP_INFY',
    isin: ISIN_INFY,
    securityId: ID_INFY.securityId,
    exchange: 'NSE',
    symbol: 'INFY',
    exchangeSegment: 'NSE_EQ',
    dhanSecurityId: 'SYNTH-NSE-EQ-1594',
    mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
    instrumentType: 'EQUITY',
    active: true,
  });

  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP_INFY',
    isin: ISIN_INFY,
    companyName: 'Infosys Synthetic Fixture',
    industry: 'IT',
    sector: 'Technology',
    effectiveFrom: '2026-01-01',
    listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  const service = new DhanMarketDataService({
    client,
    securityMaster: sm,
    instrumentRegistry: registry,
    now: () => new Date('2026-11-08T06:00:00.000Z'),
  });
  service.start();
  return service;
}

describe('Stage 1 — Dhan Credential and Authenticated Transport Admission', () => {
  it('S1-01/02/09: secret references expire or revoke fail-closed with CREDENTIALS_EXPIRED and zero secret leakage', async () => {
    const expiredEnvCfg = resolveDhanProviderConfig({
      ...VALID_CONFIG_ENV,
      [DHAN_ENV_KEYS.secretStatus]: 'EXPIRED',
    });
    assert.strictEqual(expiredEnvCfg.ok, false);
    if (!expiredEnvCfg.ok) {
      assert.strictEqual(expiredEnvCfg.failure.code, 'CREDENTIALS_EXPIRED');
    }

    const pastExpiryCfg = resolveDhanProviderConfig({
      ...VALID_CONFIG_ENV,
      [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2020-01-01T00:00:00.000Z',
    });
    assert.strictEqual(pastExpiryCfg.ok, false);
    if (!pastExpiryCfg.ok) {
      assert.strictEqual(pastExpiryCfg.failure.code, 'CREDENTIALS_EXPIRED');
    }

    // Resolved token past its 24h Dhan validity window fails closed before opening any transport call.
    let transportCalls = 0;
    const service = buildTestService({
      send: async () => {
        transportCalls += 1;
        return { status: 200, bodyText: makeQuoteWire(1500) };
      },
      resolveCreds: async () => ({
        accessToken: 'SENSITIVE_TOKEN_NEVER_ECHO',
        clientId: 'SENSITIVE_CLIENT_NEVER_ECHO',
        expiresAt: '2026-11-08T05:59:59.000Z',
      }),
    });

    const res = await service.getQuote({ companyId: 'COMP_INFY', securityIdentity: ID_INFY });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(transportCalls, 0);
    if (!res.ok) {
      assert.strictEqual(res.failure.code, 'CREDENTIALS_EXPIRED');
      assert.ok(!JSON.stringify(res).includes('SENSITIVE_TOKEN_NEVER_ECHO'));
      assert.ok(!JSON.stringify(res).includes('SENSITIVE_CLIENT_NEVER_ECHO'));
    }

    // Vault driver throwing SecretResolutionError-style EXPIRED reason maps to CREDENTIALS_EXPIRED.
    const vaultExpiredService = buildTestService({
      resolveCreds: async () => {
        const err = Object.assign(new Error('Secret SENSITIVE_VAULT_DETAIL is EXPIRED'), {
          reason: 'EXPIRED',
        });
        throw err;
      },
    });
    const vaultRes = await vaultExpiredService.getQuote({
      companyId: 'COMP_INFY',
      securityIdentity: ID_INFY,
    });
    assert.strictEqual(vaultRes.ok, false);
    if (!vaultRes.ok) {
      assert.strictEqual(vaultRes.failure.code, 'CREDENTIALS_EXPIRED');
      assert.ok(!JSON.stringify(vaultRes).includes('SENSITIVE_VAULT_DETAIL'));
    }

    const validCfg = resolveDhanProviderConfig(VALID_CONFIG_ENV);
    assert.strictEqual(validCfg.ok, true);
    if (validCfg.ok) {
      const redacted = describeDhanConfig(validCfg.config);
      // W-03 / D-7 §4.4: never publish the `vault://` reference or any store location.
      assert.strictEqual(redacted['accessTokenKeyPath'], undefined);
      assert.strictEqual(redacted['accessTokenRefConfigured'], 'YES');
      assert.ok(!JSON.stringify(redacted).includes('vault://'));
      assert.ok(!('accessToken' in redacted));
      assert.ok(!JSON.stringify(redacted).includes('SENSITIVE_TOKEN_NEVER_ECHO'));
    }
  });

  it('S1-03/05: DhanServerHttpsTransport is IPD-internal, withheld from ./dhan-server, and enforces HTTPS + origin + TLS + redirect:error', async () => {
    assert.strictEqual('DhanServerHttpsTransport' in dhanServerPublic, false);
    assert.strictEqual(typeof dhanServerPublic.MarketDataTransportClient, 'function');

    // TLS verification weakening is refused fail-closed before fetch.
    let fetchInvoked = false;
    const tlsWeakened = new DhanServerHttpsTransport({
      env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
      fetchImpl: (async () => {
        fetchInvoked = true;
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    await assert.rejects(
      () =>
        tlsWeakened.send({
          method: 'POST',
          url: 'https://api.dhan.co/v2/marketfeed/quote',
          headers: {},
          body: '{}',
          timeoutMs: 1000,
        }),
      /TLS certificate verification is disabled/
    );
    assert.strictEqual(fetchInvoked, false);

    // Non-HTTPS, foreign origins, embedded URL credentials, and query strings are refused before fetch.
    const strictEgress = new DhanServerHttpsTransport({
      env: {},
      fetchImpl: (async () => {
        fetchInvoked = true;
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    for (const badUrl of [
      'http://api.dhan.co/v2/marketfeed/quote',
      'https://evil.example.com/v2/marketfeed/quote',
      'https://api.dhan.co/v1/other',
      'https://user:pass@api.dhan.co/v2/marketfeed/quote',
      'https://api.dhan.co/v2/marketfeed/quote?access_token=leak',
    ]) {
      await assert.rejects(() =>
        strictEgress.send({
          method: 'POST',
          url: badUrl,
          headers: {},
          body: '{}',
          timeoutMs: 1000,
        })
      );
    }
    assert.strictEqual(fetchInvoked, false);

    // Valid origin-pinned call passes redirect: 'error' and returns status/bodyText.
    let capturedInit: RequestInit | undefined;
    const okEgress = new DhanServerHttpsTransport({
      env: {},
      fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
        capturedInit = init;
        return new Response('{"status":"success"}', { status: 200 });
      }) as typeof fetch,
    });
    const out = await okEgress.send({
      method: 'POST',
      url: 'https://api.dhan.co/v2/marketfeed/quote',
      headers: { 'access-token': 'tok', 'client-id': 'cid' },
      body: '{"NSE_EQ":[1594]}',
      timeoutMs: 2500,
    });
    assert.strictEqual(out.status, 200);
    assert.strictEqual(capturedInit?.redirect, 'error');
  });

  it('S1-04/09: MarketDataTransportClient fails closed with typed outcomes across auth, vendor-URL, expiry, rate-limit, and transport failures', async () => {
    // 1. Direct vendor URL passed to MarketDataTransportClient is refused before network I/O.
    let vendorFetchCount = 0;
    const vendorAttempt = new MarketDataTransportClient('https://api.dhan.co/v2', 'transport-secret', {
      fetchImpl: (async () => {
        vendorFetchCount += 1;
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    const vendorQuote = await vendorAttempt.getQuote({
      companyId: 'COMP_INFY',
      securityIdentity: ID_INFY,
    });
    assert.strictEqual(vendorQuote.ok, false);
    assert.strictEqual(vendorFetchCount, 0);
    if (!vendorQuote.ok) {
      assert.strictEqual(vendorQuote.failure.code, 'TRANSPORT_FAILURE');
    }

    // 2. Empty transport credential fails closed before network I/O.
    const emptyTokenClient = new MarketDataTransportClient('http://127.0.0.1:9', '   ', {
      fetchImpl: (async () => {
        vendorFetchCount += 1;
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    const emptyTokenRes = await emptyTokenClient.health();
    assert.strictEqual(emptyTokenRes.ok, false);
    assert.strictEqual(vendorFetchCount, 0);
    if (!emptyTokenRes.ok) {
      assert.strictEqual(emptyTokenRes.service, 'DOWN');
      assert.strictEqual(emptyTokenRes.failure.code, 'UNAUTHENTICATED');
    }

    // 3. End-to-end local loopback HTTP server verification of typed failure propagation.
    let simulatedStatus = 401;
    const service = buildTestService({
      send: async () => ({ status: simulatedStatus, bodyText: '{"errorMessage":"unauthorized"}' }),
      resolveCreds: async () => ({ accessToken: 'dhan-tok', clientId: 'dhan-cid' }),
    });
    const server = createMarketDataHttpServer({
      service,
      token: 'local-transport-token',
      host: '127.0.0.1',
      env: {},
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // Wrong transport token -> UNAUTHENTICATED (401), never throws.
      const wrongTokenClient = new MarketDataTransportClient(baseUrl, 'wrong-token', { env: {} });
      const unauthOut = await wrongTokenClient.getQuote({
        companyId: 'COMP_INFY',
        securityIdentity: ID_INFY,
      });
      assert.strictEqual(unauthOut.ok, false);
      if (!unauthOut.ok) {
        assert.strictEqual(unauthOut.failure.code, 'UNAUTHENTICATED');
        assert.strictEqual(unauthOut.failure.httpStatus, 401);
      }

      const validClient = new MarketDataTransportClient(baseUrl, 'local-transport-token', { env: {} });

      // Provider 401 -> AUTHENTICATION_FAILURE (502), never throws and never leaks Dhan token.
      const authFailOut = await validClient.getQuote({
        companyId: 'COMP_INFY',
        securityIdentity: ID_INFY,
      });
      assert.strictEqual(authFailOut.ok, false);
      if (!authFailOut.ok) {
        assert.strictEqual(authFailOut.failure.code, 'AUTHENTICATION_FAILURE');
        assert.strictEqual(authFailOut.failure.httpStatus, 502);
        assert.ok(!JSON.stringify(authFailOut).includes('dhan-tok'));
      }

      // Provider 429 -> RATE_LIMITED (429).
      simulatedStatus = 429;
      const rateLimitedOut = await validClient.getQuote({
        companyId: 'COMP_INFY',
        securityIdentity: ID_INFY,
      });
      assert.strictEqual(rateLimitedOut.ok, false);
      if (!rateLimitedOut.ok) {
        assert.strictEqual(rateLimitedOut.failure.code, 'RATE_LIMITED');
        assert.strictEqual(rateLimitedOut.failure.httpStatus, 429);
      }

      // Health reports readiness honestly without claiming live connectivity.
      const health = await validClient.health();
      assert.strictEqual(health.ok, true);
      if (health.ok) {
        assert.strictEqual(health.service, 'UP');
        assert.strictEqual(health.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
        assert.strictEqual(health.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('S1-07/08: production mode and non-loopback listener binding are explicitly refused fail-closed', async () => {
    for (const prodEnv of [
      { ...VALID_CONFIG_ENV, NODE_ENV: 'production' },
      { ...VALID_CONFIG_ENV, IIPS_DEPLOYMENT_ENV: 'production' },
    ]) {
      const cfg = resolveDhanProviderConfig(prodEnv);
      assert.strictEqual(cfg.ok, false);
      if (!cfg.ok) {
        assert.strictEqual(cfg.failure.code, 'PRODUCTION_NOT_AUTHORIZED');
      }
    }

    const service = buildTestService({});

    // Server refuses production env and non-loopback host binding.
    assert.throws(
      () =>
        createMarketDataHttpServer({
          service,
          token: 'local-token',
          env: { NODE_ENV: 'production' },
        }),
      /Production market-data transport is not authorized/
    );
    assert.throws(
      () =>
        createMarketDataHttpServer({
          service,
          token: 'local-token',
          host: '0.0.0.0',
          env: {},
        }),
      /local loopback only/
    );

    const server = createMarketDataHttpServer({
      service,
      token: 'local-token',
      host: '127.0.0.1',
      env: {},
    });
    assert.throws(() => server.listen(0, '0.0.0.0'), /local loopback only/);

    // Client refuses production env before opening any socket.
    const prodClient = new MarketDataTransportClient('http://127.0.0.1:9999', 'local-token', {
      env: { IIPS_DEPLOYMENT_ENV: 'production' },
    });
    const prodHealth = await prodClient.health();
    assert.strictEqual(prodHealth.ok, false);
    if (!prodHealth.ok) {
      assert.strictEqual(prodHealth.failure.code, 'PRODUCTION_NOT_AUTHORIZED');
    }
  });

  it('S1-06/10: browser closure remains isolated from Dhan server modules and quote retrieval preserves the G3 portfolio write fence', async () => {
    assert.strictEqual('MarketDataTransportClient' in portfolioUiPublic, false);
    assert.strictEqual('DhanApiClient' in portfolioUiPublic, false);
    assert.strictEqual('DhanServerHttpsTransport' in portfolioUiPublic, false);

    // Static check: src/ui/** must never import server-side Dhan modules.
    const uiDir = path.resolve(process.cwd(), 'src/ui');
    for (const entry of fs.readdirSync(uiDir)) {
      if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
      const src = fs.readFileSync(path.join(uiDir, entry), 'utf8');
      assert.ok(!src.includes('providers/dhan'), `src/ui/${entry} must not import src/providers/dhan`);
      assert.ok(!src.includes('dhan-server'), `src/ui/${entry} must not import ./dhan-server`);
    }

    // Quote retrieval does not touch session or durable portfolio state and G3 write gate remains enforced.
    const portfolioStore = new portfolioUiPublic.SessionPortfolioStorePort();
    const beforePortfolio = await portfolioStore.getPortfolio();
    assert.strictEqual(beforePortfolio?.isSaved, false);
    assert.strictEqual(beforePortfolio?.totalHoldingsCount, 0);

    const db = new DatabaseSync(':memory:');
    ensureMigrations(db, GATE3_MIGRATIONS);
    const durablePort = new DurablePortfolioStorePort(db);
    const owner = { canonicalOwnerId: 'local-single-user', tenantId: 'local-single-tenant' };
    assert.strictEqual(durablePort.list(owner).length, 0);

    const service = buildTestService({
      send: async () => ({ status: 200, bodyText: makeQuoteWire(1542.75) }),
      resolveCreds: async () => ({ accessToken: 'tok', clientId: 'cid' }),
    });
    const server = createMarketDataHttpServer({
      service,
      token: 'local-token',
      host: '127.0.0.1',
      env: {},
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;

    try {
      const client = new MarketDataTransportClient(`http://127.0.0.1:${port}`, 'local-token', { env: {} });
      const quote = await client.getQuote({ companyId: 'COMP_INFY', securityIdentity: ID_INFY });
      assert.strictEqual(quote.ok, true);
      if (quote.ok) {
        assert.strictEqual(quote.envelope.payload.ltp, 1542.75);
      }

      const afterPortfolio = await portfolioStore.getPortfolio();
      assert.strictEqual(afterPortfolio?.isSaved, false);
      assert.strictEqual(afterPortfolio?.totalHoldingsCount, 0);
      assert.strictEqual(durablePort.list(owner).length, 0);

      const guard = evaluatePortSaveGuard();
      assert.strictEqual(guard.authorized, false);
      assert.throws(
        () => durablePort.create(owner, 'P1', { holdings: [], provenanceDigest: 'digest-1' }),
        WriteNotAuthorizedError
      );
      assert.strictEqual(durablePort.list(owner).length, 0);
    } finally {
      db.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
