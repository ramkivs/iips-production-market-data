/**
 * Institutional Investment Platform System (IIPS)
 * W-09 — Authenticated Loopback `/v1/diagnostics` Endpoint & D-7 Disclosure Gate
 *
 * Synthetic, deterministic, offline verification of W-09 (Roadmap v1.1) and
 * D-7 §2/§4.1/§4.2/§4.3:
 *  - Authenticated loopback `GET /v1/diagnostics` + `MarketDataTransportClient.diagnostics()`.
 *  - Authoritative sourcing from W-08 recorder, vault backend metadata, registry,
 *    bounded quote cache, and service/client request counters (zero duplicated state).
 *  - Strict non-disclosure of secrets/prefixes, `vault://` URIs, carrier paths,
 *    secret-store metadata, child-process output, and vendor error messages.
 *  - Observation-only semantics (zero credential reads, zero vendor calls, zero mutations).
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { AddressInfo } from 'node:net';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import * as dhanServerEntry from '../src/providers/dhan/package.js';
import {
  DHAN_DIAGNOSTICS_CONTRACT_VERSION,
  DHAN_ENV_KEYS,
  DhanApiClient,
  DhanBoundedCache,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  DhanTransportTimeoutError,
  LocalHostVaultDhanCredentialResolver,
  MARKET_DATA_ROUTES,
  MarketDataTransportClient,
  UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID,
  createMarketDataHttpServer,
  dhanQuoteCacheKey,
  resolveDhanProviderConfig,
  startMarketDataDaemon,
  validateDhanServiceDiagnostics,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
  type DhanInstrumentMapping,
  type LocalHostVaultSecretBackend,
  type LocalHostVaultSecretRecord,
} from '../src/providers/dhan/index.js';
import type { CanonicalEnvelope } from '../src/contracts/envelope.js';
import type { MarketQuotePayload } from '../src/contracts/d01_quotes.js';

const CANARY_ACCESS_TOKEN = 'Zy9xQpSecretAccessTok88412';
const CANARY_ACCESS_PREFIX = CANARY_ACCESS_TOKEN.slice(0, 6);
const CANARY_CLIENT_ID = 'ClntIdSecret99301';
const CANARY_CLIENT_PREFIX = CANARY_CLIENT_ID.slice(0, 6);
const CANARY_TRANSPORT_TOKEN = 'TrnsprtLoopbackSecret77521';
const CANARY_TRANSPORT_PREFIX = CANARY_TRANSPORT_TOKEN.slice(0, 6);
const CANARY_TOKEN_REF = 'vault://dhan/local-nonprod/access-token-carrier';
const CANARY_CLIENT_REF = 'vault://dhan/local-nonprod/client-id-carrier';
const CANARY_WIN_CARRIER_PATH = 'C:\\Users\\operator\\AppData\\Local\\IIPS\\dpapi\\access_token.bin';
const CANARY_POSIX_CARRIER_PATH = '/home/operator/.config/iips/vault/client_id.dpapi';
const CANARY_POWERSHELL_OUTPUT =
  'powershell.exe -NoProfile stderr: CryptUnprotectData failed at C:\\Users\\operator\\AppData\\Local\\IIPS\\dpapi';
const CANARY_PROVIDER_ERROR =
  'DH-905 Invalid token Zy9xQp for client ClntIdSecret99301 on /v2/marketfeed/quote';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.accessTokenSecretPath]: CANARY_TOKEN_REF,
  [DHAN_ENV_KEYS.clientIdSecretPath]: CANARY_CLIENT_REF,
};

const ID_INFY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
const ID_TCS = buildD114SecurityIdentity('INE467B01029', 'EQ')!;
if (!ID_INFY || !ID_TCS) throw new Error('failed to build canonical D114 identities');

const MAPPING_INFY: DhanInstrumentMapping = {
  companyId: 'EQ_INFY_IN',
  isin: 'INE009A01021',
  securityId: 'ISIN:INE009A01021:EQ',
  exchange: 'NSE',
  symbol: 'INFY',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-INFY-1594',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
  instrumentType: 'EQUITY',
  active: true,
};

const MAPPING_TCS: DhanInstrumentMapping = {
  companyId: 'EQ_TCS_IN',
  isin: 'INE467B01029',
  securityId: 'ISIN:INE467B01029:EQ',
  exchange: 'NSE',
  symbol: 'TCS',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: 'SYNTH-TCS-11536',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
  instrumentType: 'EQUITY',
  active: true,
};

const EXPECTED_DIAGNOSTICS_KEYS = [
  'authLatched',
  'consecutiveAuthFailures',
  'contractVersion',
  'credentialResolutionOutcome',
  'lastAuthOutcome',
  'lastFailure',
  'lastFailureCategory',
  'lastLatencyMs',
  'lastSuccessAt',
  'liveCredentialResolutionSupported',
  'liveProviderConnectivity',
  'providerConfiguration',
  'providerQualification',
  'providerReadiness',
  'providerState',
  'qualifiedMappingsLoaded',
  'quoteCache',
  'requestCounters',
  'service',
  'vaultBackendId',
  'vendorEgressMode',
].sort();

function quoteVendorPayload(tradeTimeIst: string, dhanSecurityId = 'SYNTH-INFY-1594', ltp = 1860.25) {
  return {
    status: 'success',
    data: {
      NSE_EQ: {
        [dhanSecurityId]: {
          last_price: ltp,
          ohlc: { open: 1845, close: 1840, high: 1870, low: 1838 },
          volume: 1920000,
          net_change: 20.25,
          last_trade_time: tradeTimeIst,
        },
      },
    },
  };
}

function historicalVendorPayload() {
  return {
    timestamp: [Date.UTC(2026, 10, 13) / 1000],
    open: [1820],
    high: [1865],
    low: [1815],
    close: [1860],
    volume: [1500000],
  };
}

type VendorStep =
  | { readonly kind: 'http'; readonly status: number; readonly bodyText: string; readonly latencyMs?: number }
  | { readonly kind: 'timeout'; readonly latencyMs?: number };

interface DiagnosticsHarnessOptions {
  readonly env?: Record<string, string | undefined>;
  readonly backendId?: string;
  readonly liveResolutionSupported?: boolean;
  readonly prerequisiteSummary?: string;
  readonly tokenStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  readonly tokenExpiresAt?: string;
  readonly cacheCapacity?: number;
  readonly initialIsoUtc?: string;
  readonly steps?: VendorStep[];
}

function createDiagnosticsHarness(options: DiagnosticsHarnessOptions = {}) {
  // 2026-11-16 10:15:00 IST == 2026-11-16T04:45:00.000Z
  let clockMs = Date.parse(options.initialIsoUtc ?? '2026-11-16T04:45:00.000Z');
  const advanceClock = (deltaMs: number): void => {
    clockMs += deltaMs;
  };

  const env = options.env ?? CONFIGURED_ENV;
  const cfg = resolveDhanProviderConfig(env, new Date(clockMs));

  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING_INFY);

  const securityMaster = new SecurityMaster();
  securityMaster.registerEntity({
    companyId: 'EQ_INFY_IN',
    isin: 'INE009A01021',
    companyName: 'Infosys Limited (Synthetic)',
    industry: 'IT Services',
    sector: 'Technology',
    effectiveFrom: '2020-01-01',
    listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });
  securityMaster.registerEntity({
    companyId: 'EQ_TCS_IN',
    isin: 'INE467B01029',
    companyName: 'TCS Limited (Synthetic)',
    industry: 'IT Services',
    sector: 'Technology',
    effectiveFrom: '2020-01-01',
    listings: [{ exchange: 'NSE', symbol: 'TCS', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  let secretReadCount = 0;
  let tokenStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED' = options.tokenStatus ?? 'ACTIVE';
  let tokenExpiresAt = options.tokenExpiresAt ?? '2026-11-17T00:00:00.000Z';

  const vaultBackend: LocalHostVaultSecretBackend = {
    backendId: options.backendId ?? 'SYNTHETIC_TEST_VAULT',
    describeReadiness() {
      return {
        backendId: options.backendId ?? 'SYNTHETIC_TEST_VAULT',
        liveResolutionSupported: options.liveResolutionSupported ?? true,
        prerequisiteSummary:
          options.prerequisiteSummary ??
          `Carrier root ${CANARY_WIN_CARRIER_PATH} / ${CANARY_POSIX_CARRIER_PATH} (${CANARY_POWERSHELL_OUTPUT})`,
      };
    },
    async readSecret(ref): Promise<LocalHostVaultSecretRecord | null> {
      secretReadCount += 1;
      if ((options.liveResolutionSupported ?? true) === false) {
        return null;
      }
      if (ref.keyPath === CANARY_TOKEN_REF) {
        return {
          secretValue: CANARY_ACCESS_TOKEN,
          status: tokenStatus,
          expiresAt: tokenExpiresAt,
        };
      }
      if (ref.keyPath === CANARY_CLIENT_REF) {
        return {
          secretValue: CANARY_CLIENT_ID,
          status: 'ACTIVE',
        };
      }
      return null;
    },
  };

  const credentialResolver = new LocalHostVaultDhanCredentialResolver({
    backend: vaultBackend,
    now: () => new Date(clockMs),
    env: {},
  });

  const queue: VendorStep[] = [...(options.steps ?? [])];
  const vendorRequests: DhanHttpRequest[] = [];
  const transport: DhanHttpTransport = {
    async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
      vendorRequests.push(req);
      const step = queue.shift() ?? {
        kind: 'http',
        status: 200,
        bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:14:58')),
        latencyMs: 36,
      };
      advanceClock(step.latencyMs ?? 30);
      if (step.kind === 'timeout') {
        throw new DhanTransportTimeoutError(`${CANARY_PROVIDER_ERROR} ${CANARY_WIN_CARRIER_PATH}`);
      }
      return { status: step.status, bodyText: step.bodyText };
    },
  };

  const client = new DhanApiClient({
    config: cfg.config,
    transport,
    credentialResolver,
    now: () => clockMs,
  });

  const cache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(
    options.cacheCapacity ?? 16
  );

  const service = new DhanMarketDataService({
    client,
    securityMaster,
    instrumentRegistry: registry,
    cache,
    now: () => new Date(clockMs),
  });
  service.start();

  return {
    service,
    client,
    cache,
    registry,
    enqueue: (...steps: VendorStep[]) => queue.push(...steps),
    setTokenState: (status: 'ACTIVE' | 'EXPIRED' | 'REVOKED', expiresAt = tokenExpiresAt) => {
      tokenStatus = status;
      tokenExpiresAt = expiresAt;
    },
    getSecretReadCount: () => secretReadCount,
    getVendorCallCount: () => vendorRequests.length,
    advanceClock,
    getNowIso: () => new Date(clockMs).toISOString(),
  };
}

async function withLoopbackServer(
  service: DhanMarketDataService,
  fn: (baseUrl: string, client: MarketDataTransportClient) => Promise<void>
): Promise<void> {
  const server = createMarketDataHttpServer({
    service,
    token: CANARY_TRANSPORT_TOKEN,
    host: '127.0.0.1',
    env: {},
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const transportClient = new MarketDataTransportClient(baseUrl, CANARY_TRANSPORT_TOKEN, {
    env: {},
  });
  try {
    await fn(baseUrl, transportClient);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function assertD7NonDisclosure(serializedBody: string): void {
  const forbiddenSubstrings = [
    CANARY_ACCESS_TOKEN,
    CANARY_ACCESS_PREFIX,
    CANARY_CLIENT_ID,
    CANARY_CLIENT_PREFIX,
    CANARY_TRANSPORT_TOKEN,
    CANARY_TRANSPORT_PREFIX,
    CANARY_TOKEN_REF,
    CANARY_CLIENT_REF,
    'vault://',
    CANARY_WIN_CARRIER_PATH,
    'AppData',
    '.dpapi',
    'access_token.bin',
    CANARY_POSIX_CARRIER_PATH,
    '/home/operator',
    CANARY_POWERSHELL_OUTPUT,
    'powershell.exe',
    'CryptUnprotectData',
    CANARY_PROVIDER_ERROR,
    'DH-905',
  ];
  for (const forbidden of forbiddenSubstrings) {
    assert.ok(
      !serializedBody.includes(forbidden),
      `Diagnostics payload leaked prohibited substring '${forbidden}': ${serializedBody}`
    );
  }
  // Structural path-separator assertion (Roadmap W-09): governed keys, UPPER_SNAKE_CASE enums,
  // backend IDs, ISO-8601 timestamps, numbers and booleans contain zero '/' or '\' characters.
  assert.ok(
    !serializedBody.includes('/') && !serializedBody.includes('\\'),
    `Diagnostics payload contained path-like separator characters: ${serializedBody}`
  );
}

describe('W-09 authenticated loopback /v1/diagnostics route & D-7 disclosure policy (synthetic, offline)', () => {
  it('W09-00: publishes governed W-09 route, contract version, and validator on ./dhan-server', () => {
    assert.strictEqual(dhanServerEntry.MARKET_DATA_ROUTES.diagnostics, '/v1/diagnostics');
    assert.strictEqual(dhanServerEntry.DHAN_DIAGNOSTICS_CONTRACT_VERSION, 1);
    assert.strictEqual(typeof dhanServerEntry.validateDhanServiceDiagnostics, 'function');
    assert.strictEqual(typeof dhanServerEntry.sanitizeVaultBackendId, 'function');
  });

  it('W09-01: unauthenticated /v1/diagnostics requests return HTTP 401 UNAUTHENTICATED', async () => {
    const h = createDiagnosticsHarness();
    await withLoopbackServer(h.service, async (baseUrl) => {
      const unauthHeaders: Array<Record<string, string>> = [
        {},
        { authorization: '' },
        { authorization: `Basic ${CANARY_TRANSPORT_TOKEN}` },
        { authorization: 'Bearer ' },
        { authorization: 'Bearer wrong-token' },
        { authorization: `Bearer ${CANARY_TRANSPORT_PREFIX}` },
      ];

      for (const headers of unauthHeaders) {
        const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}`, { headers });
        assert.strictEqual(res.status, 401);
        const body = (await res.json()) as { error?: { code?: string } };
        assert.strictEqual(body.error?.code, 'UNAUTHENTICATED');
      }

      // Transport client with wrong or empty token also fails closed as UNAUTHENTICATED.
      const wrongClient = new MarketDataTransportClient(baseUrl, 'wrong-token', { env: {} });
      const wrongOut = await wrongClient.diagnostics();
      assert.strictEqual(wrongOut.ok, false);
      if (!wrongOut.ok) {
        assert.strictEqual(wrongOut.failure.code, 'UNAUTHENTICATED');
        assert.strictEqual(wrongOut.failure.httpStatus, 401);
      }

      const emptyClient = new MarketDataTransportClient(baseUrl, '', { env: {} });
      const emptyOut = await emptyClient.diagnostics();
      assert.strictEqual(emptyOut.ok, false);
      if (!emptyOut.ok) {
        assert.strictEqual(emptyOut.failure.code, 'UNAUTHENTICATED');
      }

      assert.strictEqual(h.getSecretReadCount(), 0);
      assert.strictEqual(h.getVendorCallCount(), 0);
    });
  });

  it('W09-02: authenticated GET /v1/diagnostics returns the exact governed D-7 §4.1 structure', async () => {
    const h = createDiagnosticsHarness({ cacheCapacity: 32 });
    await withLoopbackServer(h.service, async (baseUrl, client) => {
      const rawRes = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}`, {
        headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(rawRes.status, 200);
      const rawJson = (await rawRes.json()) as Record<string, unknown>;
      assert.deepStrictEqual(Object.keys(rawJson).sort(), EXPECTED_DIAGNOSTICS_KEYS);

      const viaClient = await client.diagnostics();
      assert.strictEqual(viaClient.ok, true);
      if (viaClient.ok) {
        const { ok: _ok, ...rest } = viaClient;
        assert.deepStrictEqual(rest, {
          contractVersion: DHAN_DIAGNOSTICS_CONTRACT_VERSION,
          service: 'UP',
          providerState: 'CONFIGURED',
          providerConfiguration: 'CONFIGURED',
          providerReadiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
          vaultBackendId: 'SYNTHETIC_TEST_VAULT',
          liveCredentialResolutionSupported: true,
          vendorEgressMode: 'SYNTHETIC_INJECTED',
          credentialResolutionOutcome: 'CONFIGURED_NOT_RESOLVED',
          liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS',
          providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
          lastSuccessAt: null,
          lastFailureCategory: null,
          lastFailure: null,
          lastAuthOutcome: 'NOT_CHECKED',
          lastLatencyMs: null,
          consecutiveAuthFailures: 0,
          authLatched: false,
          requestCounters: {
            quoteRequests: 0,
            quoteCacheHits: 0,
            historicalRequests: 0,
            verificationProbes: 0,
            vendorRequestsTotal: 0,
            vendorSuccesses: 0,
            providerFailures: 0,
          },
          qualifiedMappingsLoaded: 1,
          quoteCache: {
            size: 0,
            capacity: 32,
            state: 'EMPTY',
            currentEntries: 0,
            staleEntries: 0,
            unavailableEntries: 0,
          },
        });
      }
    });

    // Also verify default local daemon composition (unprovisioned vault backend).
    const daemonStarted = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: CANARY_TRANSPORT_TOKEN,
    });
    assert.strictEqual(daemonStarted.ok, true);
    if (daemonStarted.ok) {
      try {
        const daemonClient = new MarketDataTransportClient(
          daemonStarted.diagnostics.baseUrl,
          CANARY_TRANSPORT_TOKEN,
          { env: {} }
        );
        const d = await daemonClient.diagnostics();
        assert.strictEqual(d.ok, true);
        if (d.ok) {
          assert.strictEqual(d.vaultBackendId, UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID);
          assert.strictEqual(d.liveCredentialResolutionSupported, false);
          assert.strictEqual(d.vendorEgressMode, 'DISABLED_PRE_ACCESS');
          assert.strictEqual(d.providerState, 'UNCONFIGURED');
          assert.strictEqual(d.credentialResolutionOutcome, 'UNCONFIGURED');
        }
      } finally {
        await daemonStarted.handle.shutdown();
      }
    }
  });

  it('W09-03: diagnostics recorder fields match authoritative W-08 observed state across lifecycle transitions', async () => {
    const h = createDiagnosticsHarness({
      steps: [
        // 1. V2 live probe accepted -> AUTHENTICATED
        { kind: 'http', status: 200, bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:14:58')), latencyMs: 28 },
        // 2. Quote market-data request accepted -> OPERATIONAL
        { kind: 'http', status: 200, bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:15:00')), latencyMs: 44 },
        // 3. Historical call times out -> DEGRADED (retains lastSuccessAt)
        { kind: 'timeout', latencyMs: 3_200 },
        // 4 & 5. Two vendor 401s -> DEGRADED + authLatched=true, consecutiveAuthFailures=2
        { kind: 'http', status: 401, bodyText: JSON.stringify({ error: CANARY_PROVIDER_ERROR }), latencyMs: 19 },
        { kind: 'http', status: 403, bodyText: JSON.stringify({ error: CANARY_PROVIDER_ERROR }), latencyMs: 23 },
      ],
    });

    await withLoopbackServer(h.service, async (_baseUrl, client) => {
      const assertMatchesRecorder = async (expectedProviderState: string) => {
        const observed = h.service.getObservedProviderState();
        const diag = await client.diagnostics();
        assert.strictEqual(diag.ok, true);
        if (!diag.ok) return;
        assert.strictEqual(diag.providerState, expectedProviderState);
        assert.strictEqual(diag.lastSuccessAt, observed.lastSuccessAt);
        assert.strictEqual(diag.lastFailureCategory, observed.lastFailure?.category ?? null);
        assert.deepStrictEqual(diag.lastFailure, observed.lastFailure);
        assert.strictEqual(diag.lastAuthOutcome, observed.lastAuthOutcome);
        assert.strictEqual(diag.lastLatencyMs, observed.lastLatencyMs);
        assert.strictEqual(diag.consecutiveAuthFailures, observed.consecutiveAuthFailures);
        assert.strictEqual(diag.authLatched, observed.authLatched);
      };

      // Step 0: V1 local-only verification -> CREDENTIALS_RESOLVED
      await h.service.verifyConnection({ mode: 'LOCAL_ONLY' });
      await assertMatchesRecorder('CREDENTIALS_RESOLVED');

      // Step 1: V2 live probe -> AUTHENTICATED (vendor accepted, zero market-data responses yet)
      await h.service.verifyConnection();
      await assertMatchesRecorder('AUTHENTICATED');

      // Step 2: Market-data quote served -> OPERATIONAL
      const q = await h.service.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY,
        exchangeSegment: 'NSE_EQ',
      });
      assert.strictEqual(q.ok, true);
      await assertMatchesRecorder('OPERATIONAL');

      // Step 3: Historical timeout -> DEGRADED
      await h.service.getHistorical({
        companyId: 'EQ_INFY_IN',
        exchangeSegment: 'NSE_EQ',
        isin: 'INE009A01021',
        interval: '1D',
        fromDate: '2026-11-13',
        toDate: '2026-11-13',
      });
      await assertMatchesRecorder('DEGRADED');

      // Step 4 & 5: Two consecutive auth rejections -> latched DEGRADED
      await h.service.verifyConnection();
      await h.service.verifyConnection();
      assert.strictEqual(h.service.getObservedProviderState().authLatched, true);
      await assertMatchesRecorder('DEGRADED');
    });

    // Separate expired-credential check -> EXPIRED + CREDENTIALS_EXPIRED
    const expiredHarness = createDiagnosticsHarness({ tokenStatus: 'EXPIRED' });
    await expiredHarness.service.verifyConnection();
    const expDiag = await expiredHarness.service.getDiagnostics();
    assert.strictEqual(expDiag.providerState, 'EXPIRED');
    assert.strictEqual(expDiag.credentialResolutionOutcome, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(expDiag.lastFailureCategory, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(expDiag.lastAuthOutcome, 'CREDENTIALS_EXPIRED');
  });

  it('W09-04: request counters, mapping count, and quote cache size/state reflect their authoritative runtime sources', async () => {
    const h = createDiagnosticsHarness({
      cacheCapacity: 8,
      steps: [
        // 1. INFY quote @ 10:14:58 IST (04:44:58Z, age ~2s -> CURRENT)
        {
          kind: 'http',
          status: 200,
          bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:14:58', 'SYNTH-INFY-1594', 1860.25)),
          latencyMs: 25,
        },
        // 2. Historical 1D candles -> succeeds
        {
          kind: 'http',
          status: 200,
          bodyText: JSON.stringify(historicalVendorPayload()),
          latencyMs: 40,
        },
        // 3. TCS quote after 20m clock advance @ 10:35:00 IST (05:05:00Z -> CURRENT while INFY >15m SLA is STALE)
        {
          kind: 'http',
          status: 200,
          bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:35:00', 'SYNTH-TCS-11536', 4120.0)),
          latencyMs: 30,
        },
        // 4. Verify probe -> 401 failure
        {
          kind: 'http',
          status: 401,
          bodyText: '{"error":"unauthorized"}',
          latencyMs: 15,
        },
      ],
    });

    await withLoopbackServer(h.service, async (_baseUrl, client) => {
      // Initial: 1 mapping (INFY), empty cache, all counters 0.
      const d0 = await client.diagnostics();
      assert.strictEqual(d0.ok, true);
      if (d0.ok) {
        assert.strictEqual(d0.qualifiedMappingsLoaded, 1);
        assert.strictEqual(d0.quoteCache.size, 0);
        assert.strictEqual(d0.quoteCache.capacity, 8);
        assert.strictEqual(d0.quoteCache.state, 'EMPTY');
      }

      // Register 2nd mapping (TCS) directly on the authoritative DhanInstrumentRegistry.
      h.registry.register(MAPPING_TCS);

      // 1st quote (INFY): cache miss -> vendor fetch -> cached as CURRENT.
      const q1 = await h.service.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY,
        exchangeSegment: 'NSE_EQ',
      });
      assert.strictEqual(q1.ok, true);

      // 2nd quote (INFY, 1s later): served from cache (SKIPPED_FRESH).
      h.advanceClock(1_000);
      const q2 = await h.service.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY,
        exchangeSegment: 'NSE_EQ',
      });
      assert.strictEqual(q2.ok, true);

      // Historical call: 1 vendor request.
      const hist = await h.service.getHistorical({
        companyId: 'EQ_INFY_IN',
        exchangeSegment: 'NSE_EQ',
        isin: 'INE009A01021',
        interval: '1D',
        fromDate: '2026-11-13',
        toDate: '2026-11-13',
      });
      assert.strictEqual(hist.ok, true);

      const d1 = await client.diagnostics();
      assert.strictEqual(d1.ok, true);
      if (d1.ok) {
        assert.strictEqual(d1.qualifiedMappingsLoaded, 2);
        assert.deepStrictEqual(d1.requestCounters, {
          quoteRequests: 2,
          quoteCacheHits: 1,
          historicalRequests: 1,
          verificationProbes: 0,
          vendorRequestsTotal: 2,
          vendorSuccesses: 2,
          providerFailures: 0,
        });
        assert.deepStrictEqual(d1.quoteCache, {
          size: 1,
          capacity: 8,
          state: 'CURRENT',
          currentEntries: 1,
          staleEntries: 0,
          unavailableEntries: 0,
        });
      }

      // Advance clock by 20m -> INFY (04:44:58Z) is ~20m old (>15m D01_QUOTES SLA -> STALE),
      // then fetch TCS (10:35:00 IST / 05:05:00Z -> CURRENT): cache holds 1 CURRENT + 1 STALE -> MIXED.
      h.advanceClock(20 * 60_000);
      const qTcs = await h.service.getQuote({
        companyId: 'EQ_TCS_IN',
        securityIdentity: ID_TCS,
        exchangeSegment: 'NSE_EQ',
      });
      assert.strictEqual(qTcs.ok, true);

      // Run 1 explicit verification probe (401 failure).
      await h.service.verifyConnection();

      const d2 = await client.diagnostics();
      assert.strictEqual(d2.ok, true);
      if (d2.ok) {
        assert.deepStrictEqual(d2.requestCounters, {
          quoteRequests: 3,
          quoteCacheHits: 1,
          historicalRequests: 1,
          verificationProbes: 1,
          vendorRequestsTotal: 4,
          vendorSuccesses: 3,
          providerFailures: 1,
        });
        assert.deepStrictEqual(d2.quoteCache, {
          size: 2,
          capacity: 8,
          state: 'MIXED',
          currentEntries: 1,
          staleEntries: 1,
          unavailableEntries: 0,
        });
      }

      // Advance clock by 35 minutes -> both cached quotes exceed 30m AD-12 stale concession -> UNAVAILABLE.
      h.advanceClock(35 * 60_000);
      const d3 = await client.diagnostics();
      assert.strictEqual(d3.ok, true);
      if (d3.ok) {
        assert.strictEqual(d3.quoteCache.size, 2);
        assert.strictEqual(d3.quoteCache.state, 'UNAVAILABLE');
        assert.strictEqual(d3.quoteCache.unavailableEntries, 2);
      }

      // Stopping the service clears the quote cache -> EMPTY and service DOWN.
      h.service.stop();
      const d4 = await client.diagnostics();
      assert.strictEqual(d4.ok, true);
      if (d4.ok) {
        assert.strictEqual(d4.service, 'DOWN');
        assert.strictEqual(d4.providerState, 'UNAVAILABLE');
        assert.strictEqual(d4.quoteCache.size, 0);
        assert.strictEqual(d4.quoteCache.state, 'EMPTY');
      }
    });
  });

  it('W09-05 & W09-06: serialized /v1/diagnostics output contains zero secrets/prefixes, zero vault:// refs, zero carrier paths, and zero child-process or vendor error text', async () => {
    // Adversarial backend attempting to smuggle a carrier path, vault:// URI, and PowerShell text via backendId & prerequisiteSummary.
    const adversarial = createDiagnosticsHarness({
      backendId: `${CANARY_WIN_CARRIER_PATH} ${CANARY_TOKEN_REF} ${CANARY_POWERSHELL_OUTPUT}`,
      prerequisiteSummary: `${CANARY_ACCESS_TOKEN} ${CANARY_CLIENT_ID} ${CANARY_POSIX_CARRIER_PATH}`,
      steps: [
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({
            error: `${CANARY_PROVIDER_ERROR} ${CANARY_ACCESS_TOKEN} ${CANARY_CLIENT_ID} ${CANARY_TOKEN_REF} ${CANARY_WIN_CARRIER_PATH} ${CANARY_POWERSHELL_OUTPUT}`,
          }),
          latencyMs: 21,
        },
        {
          kind: 'timeout',
          latencyMs: 1_500,
        },
      ],
    });

    await withLoopbackServer(adversarial.service, async (baseUrl) => {
      const fetchRawSerialized = async (): Promise<string> => {
        const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}`, {
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
        });
        assert.strictEqual(res.status, 200);
        return res.text();
      };

      // 1. Before any provider call (with configured vault:// SecretRefs + adversarial backend metadata).
      const s0 = await fetchRawSerialized();
      assertD7NonDisclosure(s0);
      assert.strictEqual((JSON.parse(s0) as { vaultBackendId: string }).vaultBackendId, 'UNKNOWN_VAULT_BACKEND');

      // 2. After vendor 401 carrying secrets, vault:// refs, paths, and PowerShell output.
      await adversarial.service.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY,
        exchangeSegment: 'NSE_EQ',
      });
      assertD7NonDisclosure(await fetchRawSerialized());

      // 3. After transport timeout carrying provider error and Windows path.
      await adversarial.service.verifyConnection();
      assertD7NonDisclosure(await fetchRawSerialized());

      // 4. After local token expiry.
      adversarial.setTokenState('REVOKED');
      await adversarial.service.verifyConnection();
      assertD7NonDisclosure(await fetchRawSerialized());
    });
  });

  it('W09-07: diagnostics reads are strictly observational — zero credential reads, zero vendor calls, and zero state or cache LRU mutations', async () => {
    const h = createDiagnosticsHarness({
      cacheCapacity: 1,
      steps: [
        {
          kind: 'http',
          status: 200,
          bodyText: JSON.stringify(quoteVendorPayload('16/11/2026 10:14:58', 'SYNTH-INFY-1594', 1860.25)),
          latencyMs: 31,
        },
      ],
    });

    await withLoopbackServer(h.service, async (_baseUrl, client) => {
      // 1. Before any call: 5 repeated diagnostics reads invoke 0 secret reads, 0 vendor calls, 0 counter/recorder changes.
      const beforeInitial = await h.service.getDiagnostics();
      for (let i = 0; i < 5; i += 1) {
        const overHttp = await client.diagnostics();
        assert.strictEqual(overHttp.ok, true);
        if (overHttp.ok) {
          const { ok: _ok, ...payload } = overHttp;
          assert.deepStrictEqual(payload, beforeInitial);
        }
      }
      assert.strictEqual(h.getSecretReadCount(), 0);
      assert.strictEqual(h.getVendorCallCount(), 0);

      // 2. Seed two entries into a 2-slot cache so LRU eviction order is observable, then verify
      //    diagnostics reads never touch secret resolution, vendor transport, counters, recorder, or LRU order.
      const twoSlotCache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(2);
      const sm = new SecurityMaster();
      sm.registerEntity({
        companyId: 'EQ_INFY_IN',
        isin: 'INE009A01021',
        companyName: 'Infosys Limited (Synthetic)',
        industry: 'IT Services',
        sector: 'Technology',
        effectiveFrom: '2020-01-01',
        listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
      });
      const reg = new DhanInstrumentRegistry();
      reg.register(MAPPING_INFY);
      reg.register(MAPPING_TCS);

      const qRes = await h.service.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY,
        exchangeSegment: 'NSE_EQ',
      });
      assert.strictEqual(qRes.ok, true);
      if (qRes.ok) {
        const keyInfy = dhanQuoteCacheKey({
          companyId: 'EQ_INFY_IN',
          exchangeSegment: 'NSE_EQ',
          isin: 'INE009A01021',
          series: 'EQ',
        });
        const keyTcs = dhanQuoteCacheKey({
          companyId: 'EQ_TCS_IN',
          exchangeSegment: 'NSE_EQ',
          isin: 'INE467B01029',
          series: 'EQ',
        });
        twoSlotCache.set(keyInfy, qRes.envelope);
        twoSlotCache.set(keyTcs, qRes.envelope);
        const lruService = new DhanMarketDataService({
          client: h.client,
          securityMaster: sm,
          instrumentRegistry: reg,
          cache: twoSlotCache,
          now: () => new Date(h.getNowIso()),
        });
        lruService.start();

        const secretsBefore = h.getSecretReadCount();
        const vendorBefore = h.getVendorCallCount();
        const recorderBefore = lruService.getObservedProviderState();
        const diagBefore = await lruService.getDiagnostics();

        for (let i = 0; i < 5; i += 1) {
          const diagAgain = await lruService.getDiagnostics();
          assert.deepStrictEqual(diagAgain, diagBefore);
        }

        assert.strictEqual(h.getSecretReadCount(), secretsBefore);
        assert.strictEqual(h.getVendorCallCount(), vendorBefore);
        assert.deepStrictEqual(lruService.getObservedProviderState(), recorderBefore);

        // Prove LRU order was untouched: inserting a 3rd key still evicts oldest `keyInfy`, keeping `keyTcs`.
        twoSlotCache.set('THIRD_SCOPE|NSE_EQ|INE000000001|EQ', qRes.envelope);
        assert.strictEqual(twoSlotCache.peek(keyInfy, h.getNowIso()).state, 'MISS');
        assert.notStrictEqual(twoSlotCache.peek(keyTcs, h.getNowIso()).state, 'MISS');
      }
    });
  });

  it('W09-08: preserves loopback-only, non-production, read-only method, and fail-closed wire validation guards', async () => {
    const h = createDiagnosticsHarness();

    // 1. Production mode refused on both server and MarketDataTransportClient.diagnostics().
    assert.throws(() =>
      createMarketDataHttpServer({
        service: h.service,
        token: CANARY_TRANSPORT_TOKEN,
        host: '127.0.0.1',
        env: { NODE_ENV: 'production' },
      })
    );
    const prodClient = new MarketDataTransportClient('http://127.0.0.1:8791', CANARY_TRANSPORT_TOKEN, {
      env: { IIPS_DEPLOYMENT_ENV: 'production' },
    });
    const prodDiag = await prodClient.diagnostics();
    assert.strictEqual(prodDiag.ok, false);
    if (!prodDiag.ok) assert.strictEqual(prodDiag.failure.code, 'PRODUCTION_NOT_AUTHORIZED');

    // 2. Non-loopback host binding & non-loopback / direct vendor client baseUrl refused.
    assert.throws(() =>
      createMarketDataHttpServer({
        service: h.service,
        token: CANARY_TRANSPORT_TOKEN,
        host: '0.0.0.0',
        env: {},
      })
    );
    for (const badUrl of ['https://api.dhan.co/v2', 'http://192.168.1.25:8791', 'https://127.0.0.1:8791']) {
      const badClient = new MarketDataTransportClient(badUrl, CANARY_TRANSPORT_TOKEN, { env: {} });
      const out = await badClient.diagnostics();
      assert.strictEqual(out.ok, false);
      if (!out.ok) assert.strictEqual(out.failure.code, 'TRANSPORT_FAILURE');
    }

    // 3. POST /v1/diagnostics rejected (404 NOT_FOUND) and query parameters rejected (400 MALFORMED_REQUEST).
    await withLoopbackServer(h.service, async (baseUrl) => {
      const postRes = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}`,
          'content-type': 'application/json',
        },
        body: '{}',
      });
      assert.strictEqual(postRes.status, 404);

      const queryRes = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}?probe=1`, {
        headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(queryRes.status, 400);
    });

    // 4. Client validator strips untrusted extra fields and rejects tampered/locating payloads as MALFORMED_RESPONSE.
    const validSample = await h.service.getDiagnostics();
    const withExtra = { ...validSample, secretRefPointers: [CANARY_TOKEN_REF], carrierPath: CANARY_WIN_CARRIER_PATH };
    const stripped = validateDhanServiceDiagnostics(withExtra);
    assert.notStrictEqual(stripped, null);
    assert.strictEqual('secretRefPointers' in stripped!, false);
    assert.strictEqual('carrierPath' in stripped!, false);

    const invalidPayloads: unknown[] = [
      null,
      {},
      { ...validSample, contractVersion: 2 },
      { ...validSample, providerState: 'CONNECTED' },
      { ...validSample, vaultBackendId: CANARY_WIN_CARRIER_PATH },
      { ...validSample, vaultBackendId: CANARY_TOKEN_REF },
      { ...validSample, lastFailureCategory: CANARY_PROVIDER_ERROR },
      { ...validSample, lastSuccessAt: 'not-a-timestamp' },
      { ...validSample, quoteCache: { ...validSample.quoteCache, currentEntries: 99 } },
    ];
    for (const bad of invalidPayloads) {
      assert.strictEqual(validateDhanServiceDiagnostics(bad), null);
      const fakeClient = new MarketDataTransportClient('http://127.0.0.1:8791', CANARY_TRANSPORT_TOKEN, {
        env: {},
        fetchImpl: (async () =>
          new Response(JSON.stringify(bad), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })) as typeof fetch,
      });
      const res = await fakeClient.diagnostics();
      assert.strictEqual(res.ok, false);
      if (!res.ok) assert.strictEqual(res.failure.code, 'MALFORMED_RESPONSE');
    }
  });
});
