/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Authenticated Loopback Connection Verification Endpoint (`POST /v1/connection/verify`)
 *
 * Synthetic, deterministic, offline verification of the IPD transport capability
 * enabling Dhan Live Integration W-10 (under W-08 / W-09 / D-7 §2–§5):
 *  - Requires established loopback bearer authentication (`401 UNAUTHENTICATED`).
 *  - Preserves loopback-only binding, non-production refusal, POST-only method,
 *    and strict input validation before invoking verification.
 *  - Invokes the existing W-08 `DhanMarketDataService.verifyConnection()` exactly once,
 *    with at most 1 credential resolution, at most 1 authenticated probe, and zero retries.
 *  - Keeps `/v1/health`, `/v1/diagnostics`, and daemon startup strictly observational.
 *  - Records outcomes through `DhanProviderStateRecorder`, preserves V1 (`LOCAL_ONLY` /
 *    `VERIFIED_LOCAL_ONLY`) vs V2 (`VERIFIED_VENDOR_ACCEPTED`) separation, and preserves
 *    the authentication-failure latch (`DHAN_AUTH_LATCH_THRESHOLD = 2`).
 *  - Enforces D-7 §4.2 non-disclosure across both 200 and error responses, plus
 *    fail-closed wire validation (`validateDhanConnectionVerification`).
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { AddressInfo } from 'node:net';

import { SecurityMaster } from '../src/identity/security_master.js';
import * as dhanServerEntry from '../src/providers/dhan/package.js';
import {
  DHAN_AUTH_LATCH_THRESHOLD,
  DHAN_ENV_KEYS,
  DHAN_VERIFICATION_CONTRACT_VERSION,
  DhanApiClient,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  DhanTransportTimeoutError,
  LocalHostVaultDhanCredentialResolver,
  MARKET_DATA_MAX_REQUEST_BYTES,
  MARKET_DATA_ROUTES,
  MarketDataTransportClient,
  createMarketDataHttpServer,
  resolveDhanProviderConfig,
  startMarketDataDaemon,
  validateDhanConnectionVerification,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
  type DhanInstrumentMapping,
  type LocalHostVaultSecretBackend,
  type LocalHostVaultSecretRecord,
  type ServiceConnectionVerification,
} from '../src/providers/dhan/index.js';

const CANARY_ACCESS_TOKEN = 'Vx8mKpSecretAccessTok74910';
const CANARY_ACCESS_PREFIX_4 = CANARY_ACCESS_TOKEN.slice(0, 4);
const CANARY_CLIENT_ID = 'ClntSecretId55291';
const CANARY_CLIENT_PREFIX_4 = CANARY_CLIENT_ID.slice(0, 4);
const CANARY_TRANSPORT_TOKEN = 'LoopbackBearerSecret66104';
const CANARY_TRANSPORT_PREFIX_4 = CANARY_TRANSPORT_TOKEN.slice(0, 4);
const CANARY_TOKEN_REF = 'vault://dhan/local-nonprod/access-token-carrier';
const CANARY_CLIENT_REF = 'vault://dhan/local-nonprod/client-id-carrier';
const CANARY_WIN_CARRIER_PATH = 'C:\\Users\\operator\\AppData\\Local\\IIPS\\dpapi\\dhan_token.bin';
const CANARY_POSIX_CARRIER_PATH = '/home/operator/.config/iips/vault/dhan_client.dpapi';
const CANARY_STORE_METADATA = 'CredentialManager::TargetName=IIPS_DHAN_DPAPI_CARRIER_V1';
const CANARY_CHILD_STDERR =
  'powershell.exe -NoProfile stderr: CryptUnprotectData failed at C:\\Users\\operator\\AppData\\Local\\IIPS\\dpapi';
const CANARY_VENDOR_ERROR =
  'DH-901 Invalid access-token Vx8mKpSecretAccessTok74910 for client ClntSecretId55291';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.accessTokenSecretPath]: CANARY_TOKEN_REF,
  [DHAN_ENV_KEYS.clientIdSecretPath]: CANARY_CLIENT_REF,
};

const MAPPING_INFY: DhanInstrumentMapping = {
  companyId: 'EQ_INFY_IN',
  isin: 'INE009A01021',
  securityId: 'ISIN:INE009A01021:EQ',
  exchange: 'NSE',
  symbol: 'INFY',
  exchangeSegment: 'NSE_EQ',
  dhanSecurityId: '1594',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE',
  instrumentType: 'EQUITY',
  active: true,
};

const EXPECTED_VERIFY_KEYS = [
  'checkedAt',
  'contractVersion',
  'diagnostics',
  'failureCategory',
  'latencyMs',
  'localReadinessEstablished',
  'mode',
  'observedState',
  'outcome',
  'probeAttempted',
  'probeCount',
  'providerState',
].sort();

function validVendorQuotePayload(tradeTimeIst = '16/11/2026 10:15:00') {
  return {
    status: 'success',
    data: {
      NSE_EQ: {
        '1594': {
          last_price: 1862.5,
          ohlc: { open: 1848, close: 1842, high: 1871, low: 1840 },
          volume: 1540000,
          net_change: 20.5,
          last_trade_time: tradeTimeIst,
        },
      },
    },
  };
}

function assertZeroSensitiveDisclosure(serialized: string, options?: { allowSlashesInError?: boolean }): void {
  const forbiddenSubstrings = [
    CANARY_ACCESS_TOKEN,
    CANARY_ACCESS_PREFIX_4,
    CANARY_CLIENT_ID,
    CANARY_CLIENT_PREFIX_4,
    CANARY_TRANSPORT_TOKEN,
    CANARY_TRANSPORT_PREFIX_4,
    CANARY_TOKEN_REF,
    CANARY_CLIENT_REF,
    'vault://',
    CANARY_WIN_CARRIER_PATH,
    'AppData\\Local',
    'dpapi',
    CANARY_POSIX_CARRIER_PATH,
    '/home/operator',
    CANARY_STORE_METADATA,
    'CredentialManager',
    'CryptUnprotectData',
    'powershell.exe',
    CANARY_CHILD_STDERR,
    CANARY_VENDOR_ERROR,
    'DH-901',
    '1594',
  ];
  for (const needle of forbiddenSubstrings) {
    assert.strictEqual(
      serialized.includes(needle),
      false,
      `Forbidden sensitive substring '${needle}' leaked in response: ${serialized}`
    );
  }
  if (!options?.allowSlashesInError) {
    assert.strictEqual(
      serialized.includes('/') || serialized.includes('\\'),
      false,
      `Structured verification JSON must contain zero path separators ('/' or '\\\\'): ${serialized}`
    );
  }
}

type ScriptedTransportStep =
  | { readonly kind: 'http'; readonly status: number; readonly bodyText: string; readonly latencyMs: number }
  | { readonly kind: 'timeout'; readonly latencyMs: number }
  | { readonly kind: 'network_error'; readonly latencyMs: number; readonly message?: string };

interface VerifyTestHarnessOptions {
  readonly env?: Record<string, string | undefined>;
  readonly backendId?: string;
  readonly liveResolutionSupported?: boolean;
  readonly tokenStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'MISSING' | 'BACKEND_THROW';
  readonly includeMapping?: boolean;
  readonly steps?: readonly ScriptedTransportStep[];
  readonly requestTimeoutMs?: number;
}

function createVerifyHarness(options: VerifyTestHarnessOptions = {}) {
  let clockMs = Date.parse('2026-11-16T04:45:00.000Z');
  const advanceClock = (deltaMs: number) => {
    clockMs += deltaMs;
  };

  const env = options.env ?? CONFIGURED_ENV;
  const resolution = resolveDhanProviderConfig(env, new Date(clockMs));

  let vaultReads = 0;
  const liveSupported = options.liveResolutionSupported ?? true;
  const tokenStatus = options.tokenStatus ?? 'ACTIVE';
  const vaultBackend: LocalHostVaultSecretBackend = {
    backendId: options.backendId ?? 'SYNTHETIC_LOCAL_VAULT_V1',
    describeReadiness() {
      return {
        backendId: options.backendId ?? 'SYNTHETIC_LOCAL_VAULT_V1',
        liveResolutionSupported: liveSupported,
        prerequisiteSummary: `${CANARY_STORE_METADATA} ${CANARY_WIN_CARRIER_PATH}`,
      };
    },
    async readSecret(ref): Promise<LocalHostVaultSecretRecord | null> {
      vaultReads += 1;
      if (tokenStatus === 'BACKEND_THROW') {
        throw new Error(`${CANARY_CHILD_STDERR} ${CANARY_POSIX_CARRIER_PATH} ${CANARY_STORE_METADATA}`);
      }
      if (tokenStatus === 'MISSING') return null;
      if (ref.keyPath === CANARY_TOKEN_REF) {
        return {
          secretValue: CANARY_ACCESS_TOKEN,
          status: tokenStatus,
          ...(tokenStatus === 'EXPIRED'
            ? { expiresAt: '2026-11-16T01:00:00.000Z' }
            : { expiresAt: '2026-11-17T04:45:00.000Z' }),
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

  let resolverResolveCalls = 0;
  const baseResolver = new LocalHostVaultDhanCredentialResolver({
    backend: vaultBackend,
    now: () => new Date(clockMs),
    env: {},
  });
  const countingResolver = {
    describeBackendReadiness: () => baseResolver.describeBackendReadiness(),
    async resolve(cfg: Parameters<typeof baseResolver.resolve>[0]) {
      resolverResolveCalls += 1;
      return baseResolver.resolve(cfg);
    },
  };

  let transportCalls = 0;
  const capturedRequests: DhanHttpRequest[] = [];
  const queue = [...(options.steps ?? [])];
  const scriptedTransport: DhanHttpTransport = {
    async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
      transportCalls += 1;
      capturedRequests.push(request);
      const step = queue.shift() ?? {
        kind: 'http',
        status: 200,
        bodyText: JSON.stringify(validVendorQuotePayload()),
        latencyMs: 32,
      };
      advanceClock(step.latencyMs);
      if (step.kind === 'timeout') {
        throw new DhanTransportTimeoutError(`timeout after ${step.latencyMs}ms at ${CANARY_WIN_CARRIER_PATH}`);
      }
      if (step.kind === 'network_error') {
        throw new Error(step.message ?? `${CANARY_CHILD_STDERR} ${CANARY_POSIX_CARRIER_PATH}`);
      }
      return { status: step.status, bodyText: step.bodyText };
    },
  };

  const client = new DhanApiClient({
    config: resolution.config,
    credentialResolver: countingResolver,
    transport: scriptedTransport,
    now: () => clockMs,
  });

  const securityMaster = new SecurityMaster();
  securityMaster.registerEntity({
    companyId: 'EQ_INFY_IN',
    isin: 'INE009A01021',
    companyName: 'Infosys Synthetic Fixture Ltd',
    industry: 'IT Services',
    sector: 'Technology',
    effectiveFrom: '2020-01-01',
    listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  const registry = new DhanInstrumentRegistry();
  if (options.includeMapping !== false) {
    registry.register(MAPPING_INFY);
  }

  const service = new DhanMarketDataService({
    client,
    securityMaster,
    instrumentRegistry: registry,
    now: () => new Date(clockMs),
  });
  service.start();

  // Spy on the existing W-08 verifyConnection method without replacing its implementation.
  let verifyConnectionCalls = 0;
  const originalVerify = service.verifyConnection.bind(service);
  service.verifyConnection = async (verifyOpts) => {
    verifyConnectionCalls += 1;
    return originalVerify(verifyOpts);
  };

  return {
    service,
    client,
    registry,
    advanceClock,
    getVaultReads: () => vaultReads,
    getResolverCalls: () => resolverResolveCalls,
    getTransportCalls: () => transportCalls,
    getVerifyCalls: () => verifyConnectionCalls,
    capturedRequests,
  };
}

async function withLoopbackServer<T>(
  service: DhanMarketDataService,
  fn: (baseUrl: string, client: MarketDataTransportClient) => Promise<T>,
  options?: { requestTimeoutMs?: number }
): Promise<T> {
  const server = createMarketDataHttpServer({
    service,
    token: CANARY_TRANSPORT_TOKEN,
    host: '127.0.0.1',
    env: {},
    ...(options?.requestTimeoutMs !== undefined ? { requestTimeoutMs: options.requestTimeoutMs } : {}),
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  try {
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const transportClient = new MarketDataTransportClient(baseUrl, CANARY_TRANSPORT_TOKEN, {
      env: {},
    });
    return await fn(baseUrl, transportClient);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('Dhan authenticated loopback POST /v1/connection/verify endpoint (offline, synthetic)', () => {
  it('W10-IPD-00: publishes governed verifyConnection route, contract version, client method, and validator on ./dhan-server', () => {
    assert.strictEqual(dhanServerEntry.MARKET_DATA_ROUTES.verifyConnection, '/v1/connection/verify');
    assert.strictEqual(dhanServerEntry.DHAN_VERIFICATION_CONTRACT_VERSION, 1);
    assert.strictEqual(typeof dhanServerEntry.validateDhanConnectionVerification, 'function');
    assert.strictEqual(
      typeof dhanServerEntry.MarketDataTransportClient.prototype.verifyConnection,
      'function'
    );
  });

  it('W10-IPD-01: enforces loopback authentication, non-production/loopback guards, POST-only method, and strict input validation', async () => {
    const h = createVerifyHarness({
      steps: [
        { kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 24 },
        { kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 18 },
      ],
    });

    await withLoopbackServer(h.service, async (baseUrl, client) => {
      // 1. Unauthenticated requests (missing, Basic, empty Bearer, wrong token) -> 401 UNAUTHENTICATED
      const unauthHeaders: Array<Record<string, string>> = [
        {},
        { authorization: `Basic ${Buffer.from('op:secret').toString('base64')}` },
        { authorization: 'Bearer ' },
        { authorization: `Bearer wrong-${CANARY_TRANSPORT_TOKEN}` },
      ];
      for (const headers of unauthHeaders) {
        const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: '{}',
        });
        assert.strictEqual(res.status, 401);
        const raw = await res.text();
        assertZeroSensitiveDisclosure(raw, { allowSlashesInError: true });
        const json = JSON.parse(raw) as { error?: { code?: string } };
        assert.strictEqual(json.error?.code, 'UNAUTHENTICATED');
      }

      const badClient = new MarketDataTransportClient(baseUrl, 'wrong-token', { env: {} });
      const badClientRes = await badClient.verifyConnection();
      assert.strictEqual(badClientRes.ok, false);
      if (!badClientRes.ok) {
        assert.strictEqual(badClientRes.failure.code, 'UNAUTHENTICATED');
        assert.strictEqual(badClientRes.failure.httpStatus, 401);
      }

      // 2. Non-POST methods (GET, PUT, DELETE) -> 404 NOT_FOUND (GET never triggers verification)
      for (const method of ['GET', 'PUT', 'DELETE']) {
        const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
          method,
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
        });
        assert.strictEqual(res.status, 404);
      }

      // 3. Query params, malformed JSON, non-object bodies, unknown fields, invalid mode, oversized body -> 400 / 413
      const queryRes = await fetch(
        `${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}?mode=LOCAL_ONLY`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
          body: '{}',
        }
      );
      assert.strictEqual(queryRes.status, 400);

      const invalidBodies = [
        '{not-json',
        '[]',
        '"LIVE_PROBE"',
        'null',
        '{"retry":true}',
        '{"mode":"AUTO_RETRY"}',
      ];
      for (const body of invalidBodies) {
        const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}`,
            'content-type': 'application/json',
          },
          body,
        });
        assert.strictEqual(res.status, 400, `Expected 400 for body: ${body}`);
      }

      const tooLargeBody = JSON.stringify({
        pad: 'x'.repeat(MARKET_DATA_MAX_REQUEST_BYTES + 128),
      });
      const tooLargeRes = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}`,
          'content-type': 'application/json',
        },
        body: tooLargeBody,
      });
      assert.strictEqual(tooLargeRes.status, 413);

      // Client-side options guard rejects invalid options without touching network or verifier.
      const invalidClientOpt = await client.verifyConnection({ mode: 'BOGUS' as never });
      assert.strictEqual(invalidClientOpt.ok, false);
      if (!invalidClientOpt.ok) {
        assert.strictEqual(invalidClientOpt.failure.code, 'MALFORMED_REQUEST');
      }

      // Zero verification calls, zero credential reads, zero vendor probes from all rejected inputs!
      assert.strictEqual(h.getVerifyCalls(), 0);
      assert.strictEqual(h.getResolverCalls(), 0);
      assert.strictEqual(h.getTransportCalls(), 0);

      // 4. Authenticated loopback POST accepted (empty body AND explicit JSON via MarketDataTransportClient).
      const emptyBodyRes = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(emptyBodyRes.status, 200);
      const emptyBodyVerified = validateDhanConnectionVerification(await emptyBodyRes.json());
      assert.notStrictEqual(emptyBodyVerified, null);
      assert.strictEqual(emptyBodyVerified?.outcome, 'VERIFIED_VENDOR_ACCEPTED');

      const clientRes = await client.verifyConnection({ mode: 'LOCAL_ONLY' });
      assert.strictEqual(clientRes.ok, true);
      if (clientRes.ok) {
        const { ok: _ok, ...rest } = clientRes;
        assert.deepStrictEqual(Object.keys(rest).sort(), EXPECTED_VERIFY_KEYS);
        assert.strictEqual(clientRes.outcome, 'VERIFIED_LOCAL_ONLY');
      }
    });

    // 5. Loopback-only host and production-mode refusal remain enforced.
    assert.throws(() => {
      createMarketDataHttpServer({
        service: h.service,
        token: CANARY_TRANSPORT_TOKEN,
        host: '0.0.0.0',
        env: {},
      });
    }, /loopback/i);
    assert.throws(() => {
      createMarketDataHttpServer({
        service: h.service,
        token: CANARY_TRANSPORT_TOKEN,
        host: '127.0.0.1',
        env: { NODE_ENV: 'production' },
      });
    }, /Production market-data transport is not authorized/);

    const nonLoopbackClient = new MarketDataTransportClient(
      'http://192.168.1.50:8791',
      CANARY_TRANSPORT_TOKEN,
      { env: {} }
    );
    const nonLoopbackRes = await nonLoopbackClient.verifyConnection();
    assert.strictEqual(nonLoopbackRes.ok, false);
    if (!nonLoopbackRes.ok) assert.strictEqual(nonLoopbackRes.failure.code, 'TRANSPORT_FAILURE');

    const prodClient = new MarketDataTransportClient(
      'http://127.0.0.1:8791',
      CANARY_TRANSPORT_TOKEN,
      { env: { IIPS_DEPLOYMENT_ENV: 'production' } }
    );
    const prodRes = await prodClient.verifyConnection();
    assert.strictEqual(prodRes.ok, false);
    if (!prodRes.ok) assert.strictEqual(prodRes.failure.code, 'PRODUCTION_NOT_AUTHORIZED');
  });

  it('W10-IPD-02: one operator request invokes existing verifyConnection() once, resolves credentials <=1 time, probes <=1 time, and never retries', async () => {
    const probeFailureCases: ReadonlyArray<{
      readonly label: string;
      readonly step: ScriptedTransportStep;
      readonly expectedOutcome: string;
      readonly expectedCategory: string;
    }> = [
      {
        label: 'HTTP 401 auth rejection',
        step: { kind: 'http', status: 401, bodyText: '{"error":"unauthorized"}', latencyMs: 21 },
        expectedOutcome: 'AUTH_REJECTED',
        expectedCategory: 'AUTHENTICATION_FAILURE',
      },
      {
        label: 'vendor timeout',
        step: { kind: 'timeout', latencyMs: 1_500 },
        expectedOutcome: 'FAILED_TRANSPORT',
        expectedCategory: 'TIMEOUT',
      },
      {
        label: 'network transport error',
        step: { kind: 'network_error', latencyMs: 40 },
        expectedOutcome: 'FAILED_TRANSPORT',
        expectedCategory: 'TRANSPORT_FAILURE',
      },
      {
        label: 'HTTP 503 transient server error',
        step: { kind: 'http', status: 503, bodyText: '{"error":"service down"}', latencyMs: 35 },
        expectedOutcome: 'FAILED_VENDOR_RESPONSE',
        expectedCategory: 'HTTP_ERROR',
      },
      {
        label: 'HTTP 429 rate limited',
        step: { kind: 'http', status: 429, bodyText: '{"error":"throttled"}', latencyMs: 17 },
        expectedOutcome: 'FAILED_VENDOR_RESPONSE',
        expectedCategory: 'RATE_LIMITED',
      },
      {
        label: 'malformed vendor JSON',
        step: { kind: 'http', status: 200, bodyText: '{broken-json', latencyMs: 19 },
        expectedOutcome: 'FAILED_VENDOR_RESPONSE',
        expectedCategory: 'MALFORMED_RESPONSE',
      },
    ];

    for (const scenario of probeFailureCases) {
      const h = createVerifyHarness({
        steps: [
          scenario.step,
          // Trap: if any retry or duplicate verification ran, this 2nd step would be consumed!
          { kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 11 },
        ],
      });

      await withLoopbackServer(h.service, async (_baseUrl, client) => {
        const res = await client.verifyConnection();
        assert.strictEqual(res.ok, true, `Expected transport 200 for ${scenario.label}`);
        if (!res.ok) return;

        assert.strictEqual(h.getVerifyCalls(), 1, `verifyConnection() must run once (${scenario.label})`);
        assert.strictEqual(h.getResolverCalls(), 1, `credential resolver must run <=1 time (${scenario.label})`);
        assert.strictEqual(h.getTransportCalls(), 1, `vendor probe must run <=1 time, zero retry (${scenario.label})`);
        assert.strictEqual(res.outcome, scenario.expectedOutcome);
        assert.strictEqual(res.failureCategory, scenario.expectedCategory);
        assert.strictEqual(res.localReadinessEstablished, true);
        assert.strictEqual(res.probeAttempted, true);
        assert.strictEqual(res.probeCount, 1);
        assert.strictEqual(res.diagnostics.requestCounters.verificationProbes, 1);
        assert.strictEqual(res.diagnostics.requestCounters.vendorRequestsTotal, 1);
      });
    }

    // Success case: 1 verifier call, 1 credential resolution, 1 vendor probe.
    const okHarness = createVerifyHarness({
      steps: [{ kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 39 }],
    });
    await withLoopbackServer(okHarness.service, async (_baseUrl, client) => {
      const res = await client.verifyConnection();
      assert.strictEqual(res.ok, true);
      if (res.ok) {
        assert.strictEqual(res.outcome, 'VERIFIED_VENDOR_ACCEPTED');
        assert.strictEqual(res.localReadinessEstablished, true);
        assert.strictEqual(res.probeAttempted, true);
        assert.strictEqual(res.probeCount, 1);
        assert.strictEqual(res.latencyMs, 39);
      }
      assert.strictEqual(okHarness.getVerifyCalls(), 1);
      assert.strictEqual(okHarness.getResolverCalls(), 1);
      assert.strictEqual(okHarness.getTransportCalls(), 1);
    });
  });

  it('W10-IPD-03: ordinary /v1/health, /v1/diagnostics, and daemon startup never invoke verification, credential reads, or vendor probes', async () => {
    const h = createVerifyHarness();

    await withLoopbackServer(h.service, async (_baseUrl, client) => {
      // Repeated observational reads BEFORE any operator verification.
      for (let i = 0; i < 4; i += 1) {
        const health = await client.health();
        const diag = await client.diagnostics();
        assert.strictEqual(health.ok, true);
        assert.strictEqual(diag.ok, true);
        if (diag.ok) {
          assert.strictEqual(diag.providerState, 'CONFIGURED');
          assert.strictEqual(diag.credentialResolutionOutcome, 'CONFIGURED_NOT_RESOLVED');
        }
      }
      assert.strictEqual(h.getVerifyCalls(), 0);
      assert.strictEqual(h.getResolverCalls(), 0);
      assert.strictEqual(h.getVaultReads(), 0);
      assert.strictEqual(h.getTransportCalls(), 0);

      // Single explicit operator verification -> 1 call.
      const verified = await client.verifyConnection();
      assert.strictEqual(verified.ok, true);
      assert.strictEqual(h.getVerifyCalls(), 1);
      assert.strictEqual(h.getResolverCalls(), 1);
      assert.strictEqual(h.getTransportCalls(), 1);

      // Repeated observational reads AFTER verification -> counters stay frozen at 1.
      const snapshotAfterVerify = await client.diagnostics();
      for (let i = 0; i < 4; i += 1) {
        h.advanceClock(2_000);
        await client.health();
        const laterDiag = await client.diagnostics();
        assert.deepStrictEqual(laterDiag, snapshotAfterVerify);
      }
      assert.strictEqual(h.getVerifyCalls(), 1);
      assert.strictEqual(h.getResolverCalls(), 1);
      assert.strictEqual(h.getTransportCalls(), 1);
    });

    // Daemon startup + health/diagnostics reads perform zero verification, zero vault reads, zero vendor calls.
    let daemonVaultReads = 0;
    let daemonVendorCalls = 0;
    const daemonStartup = await startMarketDataDaemon({
      env: {
        ...CONFIGURED_ENV,
        IIPS_MARKET_DATA_TRANSPORT_TOKEN: CANARY_TRANSPORT_TOKEN,
      },
      argv: [],
      host: '127.0.0.1',
      port: 0,
      p7ManifestPath: '/nonexistent-manifest-for-synthetic-test.json',
      vaultBackend: {
        backendId: 'SYNTHETIC_DAEMON_VAULT',
        describeReadiness: () => ({
          backendId: 'SYNTHETIC_DAEMON_VAULT',
          liveResolutionSupported: true,
          prerequisiteSummary: 'synthetic ready',
        }),
        async readSecret(ref) {
          daemonVaultReads += 1;
          return {
            secretValue: ref.keyPath === CANARY_TOKEN_REF ? CANARY_ACCESS_TOKEN : CANARY_CLIENT_ID,
            status: 'ACTIVE',
          };
        },
      },
      providerTransport: {
        async send() {
          daemonVendorCalls += 1;
          return { status: 200, bodyText: JSON.stringify(validVendorQuotePayload()) };
        },
      },
    });
    assert.strictEqual(daemonStartup.ok, true);
    if (daemonStartup.ok) {
      try {
        const daemonClient = new MarketDataTransportClient(
          daemonStartup.diagnostics.baseUrl,
          CANARY_TRANSPORT_TOKEN,
          { env: {} }
        );
        await daemonClient.health();
        await daemonClient.diagnostics();
        assert.strictEqual(daemonVaultReads, 0);
        assert.strictEqual(daemonVendorCalls, 0);

        // Only explicit verifyConnection reads the vault (2 SecretRefs: token + clientId = 1 resolution).
        const daemonVerify = await daemonClient.verifyConnection({ mode: 'LOCAL_ONLY' });
        assert.strictEqual(daemonVerify.ok, true);
        if (daemonVerify.ok) {
          assert.strictEqual(daemonVerify.outcome, 'VERIFIED_LOCAL_ONLY');
          assert.strictEqual(daemonVerify.providerState, 'CREDENTIALS_RESOLVED');
          assert.strictEqual(daemonVerify.probeAttempted, false);
        }
        assert.strictEqual(daemonVaultReads, 2);
        assert.strictEqual(daemonVendorCalls, 0);
      } finally {
        await daemonStartup.handle.shutdown();
      }
    }
  });

  it('W10-IPD-04: records authoritative state, preserves V1 local readiness vs V2 vendor auth distinction, and enforces auth latch', async () => {
    // A. Local readiness without vendor probe (both explicit LOCAL_ONLY and live mode with 0 mapped instruments)
    //    is NEVER misrepresented as vendor authentication.
    const noMappingHarness = createVerifyHarness({ includeMapping: false });
    await withLoopbackServer(noMappingHarness.service, async (_baseUrl, client) => {
      const vLocal = await client.verifyConnection({ mode: 'LOCAL_ONLY' });
      assert.strictEqual(vLocal.ok, true);
      if (vLocal.ok) {
        assert.strictEqual(vLocal.outcome, 'VERIFIED_LOCAL_ONLY');
        assert.strictEqual(vLocal.localReadinessEstablished, true);
        assert.strictEqual(vLocal.probeAttempted, false);
        assert.strictEqual(vLocal.probeCount, 0);
        assert.strictEqual(vLocal.providerState, 'CREDENTIALS_RESOLVED');
        assert.strictEqual(vLocal.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
        assert.strictEqual(vLocal.observedState.lastAuthOutcome, 'NOT_CHECKED');
        assert.strictEqual(vLocal.observedState.lastSuccessAt, null);
      }

      const vNoInstrument = await client.verifyConnection({ mode: 'LIVE_PROBE' });
      assert.strictEqual(vNoInstrument.ok, true);
      if (vNoInstrument.ok) {
        assert.strictEqual(vNoInstrument.outcome, 'VERIFIED_LOCAL_ONLY');
        assert.strictEqual(vNoInstrument.localReadinessEstablished, true);
        assert.strictEqual(vNoInstrument.probeAttempted, false);
        assert.strictEqual(vNoInstrument.providerState, 'CREDENTIALS_RESOLVED');
        assert.strictEqual(vNoInstrument.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      }
      assert.strictEqual(noMappingHarness.getTransportCalls(), 0);
    });

    // B. Full lifecycle over HTTP: V2 success -> connectivity failure -> 2x auth rejection -> permanent latch.
    assert.strictEqual(DHAN_AUTH_LATCH_THRESHOLD, 2);
    const h = createVerifyHarness({
      steps: [
        { kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 37 },
        { kind: 'timeout', latencyMs: 2_100 },
        { kind: 'http', status: 401, bodyText: JSON.stringify({ error: CANARY_VENDOR_ERROR }), latencyMs: 20 },
        { kind: 'http', status: 403, bodyText: JSON.stringify({ error: CANARY_VENDOR_ERROR }), latencyMs: 22 },
        // Queued 200 must NEVER be consumed once latched:
        { kind: 'http', status: 200, bodyText: JSON.stringify(validVendorQuotePayload()), latencyMs: 14 },
      ],
    });

    await withLoopbackServer(h.service, async (_baseUrl, client) => {
      // 1. V2 success -> AUTHENTICATED + CONNECTED_LIVE
      const s1 = await client.verifyConnection();
      assert.strictEqual(s1.ok, true);
      if (s1.ok) {
        assert.strictEqual(s1.outcome, 'VERIFIED_VENDOR_ACCEPTED');
        assert.strictEqual(s1.providerState, 'AUTHENTICATED');
        assert.strictEqual(s1.localReadinessEstablished, true);
        assert.strictEqual(s1.probeAttempted, true);
        assert.strictEqual(s1.probeCount, 1);
        assert.strictEqual(s1.latencyMs, 37);
        assert.strictEqual(s1.diagnostics.liveProviderConnectivity, 'CONNECTED_LIVE');
        assert.deepStrictEqual(s1.observedState, h.service.getObservedProviderState());
      }

      // 2. Timeout -> DEGRADED, retains lastSuccessAt, clears CONNECTED_LIVE
      const s2 = await client.verifyConnection();
      assert.strictEqual(s2.ok, true);
      if (s2.ok) {
        assert.strictEqual(s2.outcome, 'FAILED_TRANSPORT');
        assert.strictEqual(s2.failureCategory, 'TIMEOUT');
        assert.strictEqual(s2.providerState, 'DEGRADED');
        assert.strictEqual(s2.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
        assert.strictEqual(s2.observedState.lastSuccessAt, '2026-11-16T04:45:00.037Z');
      }

      // 3. First auth failure (401) -> consecutiveAuthFailures = 1, authLatched = false
      const s3 = await client.verifyConnection();
      assert.strictEqual(s3.ok, true);
      if (s3.ok) {
        assert.strictEqual(s3.outcome, 'AUTH_REJECTED');
        assert.strictEqual(s3.failureCategory, 'AUTHENTICATION_FAILURE');
        assert.strictEqual(s3.providerState, 'DEGRADED');
        assert.strictEqual(s3.observedState.consecutiveAuthFailures, 1);
        assert.strictEqual(s3.observedState.authLatched, false);
      }

      // 4. Second consecutive auth failure (403) -> consecutiveAuthFailures = 2, authLatched = true
      const s4 = await client.verifyConnection();
      assert.strictEqual(s4.ok, true);
      if (s4.ok) {
        assert.strictEqual(s4.outcome, 'AUTH_REJECTED');
        assert.strictEqual(s4.observedState.consecutiveAuthFailures, 2);
        assert.strictEqual(s4.observedState.authLatched, true);
        assert.strictEqual(s4.providerState, 'DEGRADED');
      }
      assert.strictEqual(h.getResolverCalls(), 4);
      assert.strictEqual(h.getTransportCalls(), 4);

      // 5. Subsequent verifyConnection is refused pre-flight by the auth latch (zero resolver calls, zero probes).
      const s5 = await client.verifyConnection();
      assert.strictEqual(s5.ok, true);
      if (s5.ok) {
        assert.strictEqual(s5.outcome, 'AUTH_REJECTED');
        assert.strictEqual(s5.failureCategory, 'AUTHENTICATION_FAILURE');
        assert.strictEqual(s5.localReadinessEstablished, false);
        assert.strictEqual(s5.probeAttempted, false);
        assert.strictEqual(s5.probeCount, 0);
        assert.strictEqual(s5.latencyMs, null);
        assert.strictEqual(s5.observedState.authLatched, true);
      }
      assert.strictEqual(h.getResolverCalls(), 4);
      assert.strictEqual(h.getTransportCalls(), 4);
    });

    // C. Local credential expiry -> EXPIRED_LOCAL + providerState EXPIRED + 0 vendor probes + 0 consecutiveAuthFailures.
    const expiredHarness = createVerifyHarness({ tokenStatus: 'EXPIRED' });
    await withLoopbackServer(expiredHarness.service, async (_baseUrl, client) => {
      const exp = await client.verifyConnection();
      assert.strictEqual(exp.ok, true);
      if (exp.ok) {
        assert.strictEqual(exp.outcome, 'EXPIRED_LOCAL');
        assert.strictEqual(exp.failureCategory, 'CREDENTIALS_EXPIRED');
        assert.strictEqual(exp.providerState, 'EXPIRED');
        assert.strictEqual(exp.localReadinessEstablished, false);
        assert.strictEqual(exp.probeAttempted, false);
        assert.strictEqual(exp.probeCount, 0);
        assert.strictEqual(exp.observedState.consecutiveAuthFailures, 0);
      }
      assert.strictEqual(expiredHarness.getTransportCalls(), 0);
    });
  });

  it('W10-IPD-05: enforces D-7 §4.2 non-disclosure across all 200 and error responses and validates wire payloads fail-closed', async () => {
    const h = createVerifyHarness({
      backendId: `BAD_ID/${CANARY_POSIX_CARRIER_PATH}`,
      steps: [
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({
            errorMessage: `${CANARY_VENDOR_ERROR} ${CANARY_TOKEN_REF} ${CANARY_WIN_CARRIER_PATH}`,
          }),
          latencyMs: 25,
        },
        {
          kind: 'network_error',
          latencyMs: 31,
          message: `${CANARY_CHILD_STDERR} ${CANARY_POSIX_CARRIER_PATH} ${CANARY_STORE_METADATA}`,
        },
      ],
    });

    await withLoopbackServer(h.service, async (baseUrl, client) => {
      // 1. 200 verification responses (auth rejection + network error carrying canary strings).
      const r1 = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(r1.status, 200);
      const raw1 = await r1.text();
      assertZeroSensitiveDisclosure(raw1);
      const parsed1 = JSON.parse(raw1) as ServiceConnectionVerification;
      assert.strictEqual(parsed1.diagnostics.vaultBackendId, 'UNKNOWN_VAULT_BACKEND');

      const r2 = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
      });
      assert.strictEqual(r2.status, 200);
      assertZeroSensitiveDisclosure(await r2.text());

      // 2. Vault backend throwing child-process stderr + carrier paths -> NOT_ATTEMPTED_NOT_READY with zero leakage.
      const vaultThrowHarness = createVerifyHarness({ tokenStatus: 'BACKEND_THROW' });
      await withLoopbackServer(vaultThrowHarness.service, async (vaultUrl) => {
        const rv = await fetch(`${vaultUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
        });
        assert.strictEqual(rv.status, 200);
        assertZeroSensitiveDisclosure(await rv.text());
      });

      // 3. Error responses (401, 400 query, 400 body, 404, 504, 500) checked for non-disclosure even when
      //    requests/exceptions carry canary secrets, vault:// refs, and carrier paths.
      const errResponses: string[] = [];

      const e401 = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${CANARY_ACCESS_TOKEN}` },
      });
      assert.strictEqual(e401.status, 401);
      errResponses.push(await e401.text());

      const e400Query = await fetch(
        `${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}?ref=${encodeURIComponent(CANARY_TOKEN_REF)}&p=${encodeURIComponent(CANARY_WIN_CARRIER_PATH)}`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
        }
      );
      assert.strictEqual(e400Query.status, 400);
      errResponses.push(await e400Query.text());

      const e400Field = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          [CANARY_TOKEN_REF]: CANARY_ACCESS_TOKEN,
          carrier: CANARY_WIN_CARRIER_PATH,
        }),
      });
      assert.strictEqual(e400Field.status, 400);
      errResponses.push(await e400Field.text());

      const e400Mode = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ mode: `${CANARY_CLIENT_ID}:${CANARY_POSIX_CARRIER_PATH}` }),
      });
      assert.strictEqual(e400Mode.status, 400);
      errResponses.push(await e400Mode.text());

      // Unexpected internal throw inside verifyConnection -> generic 500 INTERNAL_ERROR without echoing message.
      const throwingHarness = createVerifyHarness();
      throwingHarness.service.verifyConnection = async () => {
        throw new Error(
          `${CANARY_ACCESS_TOKEN} ${CANARY_TOKEN_REF} ${CANARY_WIN_CARRIER_PATH} ${CANARY_CHILD_STDERR}`
        );
      };
      await withLoopbackServer(throwingHarness.service, async (throwUrl) => {
        const e500 = await fetch(`${throwUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
        });
        assert.strictEqual(e500.status, 500);
        errResponses.push(await e500.text());
      });

      // Hung verification -> bounded 504 REQUEST_TIMEOUT.
      const hungHarness = createVerifyHarness();
      hungHarness.service.verifyConnection = () => new Promise(() => {});
      await withLoopbackServer(
        hungHarness.service,
        async (hungUrl) => {
          const e504 = await fetch(`${hungUrl}${MARKET_DATA_ROUTES.verifyConnection}`, {
            method: 'POST',
            headers: { authorization: `Bearer ${CANARY_TRANSPORT_TOKEN}` },
          });
          assert.strictEqual(e504.status, 504);
          errResponses.push(await e504.text());
        },
        { requestTimeoutMs: 40 }
      );

      for (const rawErr of errResponses) {
        assertZeroSensitiveDisclosure(rawErr, { allowSlashesInError: true });
      }

      // 4. Fail-closed wire validator & client rejection of tampered / contradictory payloads.
      assert.strictEqual(validateDhanConnectionVerification(parsed1) !== null, true);
      assert.strictEqual(validateDhanConnectionVerification(null), null);
      assert.strictEqual(validateDhanConnectionVerification({ ...parsed1, contractVersion: 2 }), null);
      assert.strictEqual(validateDhanConnectionVerification({ ...parsed1, outcome: 'UNKNOWN' }), null);
      assert.strictEqual(
        validateDhanConnectionVerification({
          ...parsed1,
          outcome: 'VERIFIED_LOCAL_ONLY',
          localReadinessEstablished: true,
          probeAttempted: false,
          probeCount: 0,
          failureCategory: null,
          latencyMs: null,
          // Forbidden D-7 §3 misrepresentation: claiming AUTHENTICATED on VERIFIED_LOCAL_ONLY with null lastSuccessAt!
          providerState: 'AUTHENTICATED',
          diagnostics: { ...parsed1.diagnostics, providerState: 'AUTHENTICATED' },
        }),
        null
      );
      assert.strictEqual(
        validateDhanConnectionVerification({
          ...parsed1,
          mode: 'LOCAL_ONLY',
          probeAttempted: true,
          probeCount: 1,
        }),
        null
      );
      assert.strictEqual(
        validateDhanConnectionVerification({
          ...parsed1,
          checkedAt: CANARY_POSIX_CARRIER_PATH,
        }),
        null
      );

      // Extra untrusted fields are stripped rather than reflected.
      const stripped = validateDhanConnectionVerification({
        ...parsed1,
        secretRefPointers: [CANARY_TOKEN_REF],
      } as unknown);
      assert.notStrictEqual(stripped, null);
      assert.strictEqual('secretRefPointers' in (stripped as unknown as Record<string, unknown>), false);

      // Client fails closed with MALFORMED_RESPONSE when wire payload violates contract.
      const tamperedClient = new MarketDataTransportClient(baseUrl, CANARY_TRANSPORT_TOKEN, {
        env: {},
        fetchImpl: async () =>
          new Response(JSON.stringify({ ...parsed1, contractVersion: 99 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      });
      const tamperedOutcome = await tamperedClient.verifyConnection();
      assert.strictEqual(tamperedOutcome.ok, false);
      if (!tamperedOutcome.ok) {
        assert.strictEqual(tamperedOutcome.failure.code, 'MALFORMED_RESPONSE');
      }
      void client;
    });
  });
});
