/**
 * Institutional Investment Platform System (IIPS)
 * W-08 — Observed Provider State Recorder, Observational Health & Bounded Verify
 *
 * Synthetic, deterministic, offline test suite verifying W-08 (Roadmap v1.1),
 * D-2 authentication failure counting/latch semantics, W-07 health contract v2
 * compatibility, and D-7 §3/§4 observation-only & zero-disclosure invariants.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import type { AddressInfo } from 'node:net';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import * as dhanServerEntry from '../src/providers/dhan/package.js';
import {
  DHAN_AUTH_LATCH_THRESHOLD,
  DHAN_ENV_KEYS,
  DHAN_HEALTH_CONTRACT_VERSION,
  DhanApiClient,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  DhanProviderStateRecorder,
  DhanTransportTimeoutError,
  DhanVaultResolutionError,
  MarketDataTransportClient,
  createMarketDataHttpServer,
  resolveDhanProviderConfig,
  validateDhanServiceHealth,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
  type DhanInstrumentMapping,
} from '../src/providers/dhan/index.js';

const CANARY_ACCESS_TOKEN = 'CANARY_DHAN_SECRET_TOKEN_99182';
const CANARY_CLIENT_ID = 'CANARY_DHAN_CLIENT_ID_44210';
const CANARY_SECRET_REF_TOKEN = 'vault://dhan/local-nonprod/canary-access-token';
const CANARY_SECRET_REF_CLIENT = 'vault://dhan/local-nonprod/canary-client-id';
const CANARY_WIN_PATH = 'C:\\Users\\operator\\AppData\\Local\\IIPS\\vault\\secret.dpapi';
const CANARY_POSIX_PATH = '/var/lib/iips/secrets/dhan-token.enc';
const CANARY_CHILD_OUTPUT = 'powershell.exe stderr: Unprotect-CmsMessage CryptographicException at line 14';
const CANARY_VENDOR_MESSAGE = 'DH-901 Invalid JWT token signature for client 44210 at /v2/marketfeed/quote';
const LOOPBACK_BEARER = 'w08-loopback-transport-token';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.accessTokenSecretPath]: CANARY_SECRET_REF_TOKEN,
  [DHAN_ENV_KEYS.clientIdSecretPath]: CANARY_SECRET_REF_CLIENT,
};

const ID_INFY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
if (!ID_INFY) throw new Error('failed to construct canonical D114 identity');

const INFY_MAPPING: DhanInstrumentMapping = {
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

function validQuoteVendorPayload(ltp = 1845.5) {
  return {
    status: 'success',
    data: {
      NSE_EQ: {
        '1594': {
          last_price: ltp,
          ohlc: { open: 1830, close: 1825, high: 1852, low: 1822 },
          volume: 1450000,
          net_change: 20.5,
          last_trade_time: '16/11/2026 10:14:55',
        },
      },
    },
  };
}

function validHistoricalVendorPayload() {
  return {
    timestamp: [Date.UTC(2026, 10, 13) / 1000],
    open: [1810],
    high: [1850],
    low: [1805],
    close: [1845],
    volume: [1200000],
  };
}

type ScriptedResponseStep =
  | { readonly kind: 'http'; readonly status: number; readonly bodyText: string; readonly latencyMs?: number }
  | { readonly kind: 'timeout'; readonly latencyMs?: number; readonly message?: string }
  | { readonly kind: 'network_error'; readonly latencyMs?: number; readonly message?: string };

interface HarnessOptions {
  readonly env?: Record<string, string | undefined>;
  readonly initialEpochMs?: number;
  readonly steps?: ScriptedResponseStep[];
  readonly includeMapping?: boolean;
  readonly maxRetryAttempts?: number;
  readonly resolveImpl?: (callIndex: number, nowMs: number) => Promise<{
    accessToken: string;
    clientId: string;
    expiresAt?: string;
  } | null>;
}

function createHarness(options: HarnessOptions = {}) {
  let clockMs = options.initialEpochMs ?? Date.parse('2026-11-16T04:45:00.000Z');
  const advanceClock = (deltaMs: number): void => {
    clockMs += deltaMs;
  };

  const cfg = resolveDhanProviderConfig(options.env ?? CONFIGURED_ENV, new Date(clockMs));
  const registry = new DhanInstrumentRegistry();
  if (options.includeMapping !== false) {
    registry.register(INFY_MAPPING);
  }

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

  const queue: ScriptedResponseStep[] = [...(options.steps ?? [])];
  const requests: DhanHttpRequest[] = [];
  let resolverCalls = 0;

  const transport: DhanHttpTransport = {
    async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
      requests.push(req);
      const step = queue.shift() ?? {
        kind: 'http',
        status: 200,
        bodyText: JSON.stringify(validQuoteVendorPayload()),
        latencyMs: 37,
      };
      advanceClock(step.latencyMs ?? 25);
      if (step.kind === 'timeout') {
        throw new DhanTransportTimeoutError(step.message ?? `${CANARY_VENDOR_MESSAGE} ${CANARY_WIN_PATH}`);
      }
      if (step.kind === 'network_error') {
        throw new Error(step.message ?? `${CANARY_CHILD_OUTPUT} ${CANARY_POSIX_PATH}`);
      }
      return { status: step.status, bodyText: step.bodyText };
    },
  };

  const defaultHasRefs = Boolean(
    (options.env ?? CONFIGURED_ENV)[DHAN_ENV_KEYS.accessTokenSecretPath] &&
      (options.env ?? CONFIGURED_ENV)[DHAN_ENV_KEYS.clientIdSecretPath]
  );

  const client = new DhanApiClient({
    config: cfg.config,
    transport,
    credentialResolver: {
      async resolve() {
        resolverCalls += 1;
        if (options.resolveImpl) {
          return options.resolveImpl(resolverCalls, clockMs);
        }
        if (!defaultHasRefs) return null;
        return {
          accessToken: CANARY_ACCESS_TOKEN,
          clientId: CANARY_CLIENT_ID,
          expiresAt: '2026-11-17T00:00:00.000Z',
        };
      },
    },
    now: () => clockMs,
  });

  const service = new DhanMarketDataService({
    client,
    securityMaster,
    instrumentRegistry: registry,
    now: () => new Date(clockMs),
  });
  service.start();

  return {
    client,
    service,
    registry,
    requests,
    enqueue: (...more: ScriptedResponseStep[]) => queue.push(...more),
    getTransportCalls: () => requests.length,
    getResolverCalls: () => resolverCalls,
    /** W-05: disclosure-safe D-2 session descriptor (counters only, never material). */
    getCredentialSession: () => client.getCredentialSessionDescriptor(),
    getClockIso: () => new Date(clockMs).toISOString(),
    advanceClock,
  };
}

function assertZeroSensitiveLeakage(serialized: string): void {
  const forbiddenTokens = [
    CANARY_ACCESS_TOKEN,
    CANARY_CLIENT_ID,
    CANARY_SECRET_REF_TOKEN,
    CANARY_SECRET_REF_CLIENT,
    'vault://',
    CANARY_WIN_PATH,
    'AppData\\Local',
    '.dpapi',
    CANARY_POSIX_PATH,
    '/var/lib/',
    CANARY_CHILD_OUTPUT,
    'powershell.exe',
    'Unprotect-CmsMessage',
    CANARY_VENDOR_MESSAGE,
    'DH-901',
  ];
  for (const token of forbiddenTokens) {
    assert.ok(
      !serialized.includes(token),
      `Serialized output leaked forbidden token '${token}': ${serialized}`
    );
  }
}

describe('W-08 observed provider state recorder, health & bounded verification (synthetic, offline)', () => {
  it('W08-00: exports governed W-08 recorder symbols on ./dhan-server', () => {
    assert.strictEqual(dhanServerEntry.DHAN_AUTH_LATCH_THRESHOLD, 2);
    assert.strictEqual(typeof dhanServerEntry.DhanProviderStateRecorder, 'function');
    assert.strictEqual(typeof dhanServerEntry.isGovernedProviderFailureCategory, 'function');
  });

  it('W08-01: successful provider interactions update lastSuccessAt, lastLatencyMs, lastAuthOutcome, and health connectivity', async () => {
    const h = createHarness({
      steps: [
        { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 42 },
        { kind: 'http', status: 200, bodyText: JSON.stringify(validHistoricalVendorPayload()), latencyMs: 68 },
      ],
    });

    // Before any interaction: recorder is empty and health reports NOT_CHECKED_PRE_ACCESS.
    assert.deepStrictEqual(h.service.getObservedProviderState(), {
      lastSuccessAt: null,
      lastFailure: null,
      lastAuthOutcome: 'NOT_CHECKED',
      lastLatencyMs: null,
      consecutiveAuthFailures: 0,
      authLatched: false,
    });
    const beforeHealth = await h.service.health();
    assert.strictEqual(beforeHealth.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
    assert.strictEqual(beforeHealth.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
    assert.strictEqual(beforeHealth.contractVersion, DHAN_HEALTH_CONTRACT_VERSION);

    // 1. Live quote interaction succeeds -> records timestamp + 42ms latency + AUTHENTICATED.
    const quoteRes = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(quoteRes.ok, true);
    const afterQuote = h.service.getObservedProviderState();
    assert.strictEqual(afterQuote.lastSuccessAt, '2026-11-16T04:45:00.042Z');
    assert.strictEqual(afterQuote.lastLatencyMs, 42);
    assert.strictEqual(afterQuote.lastFailure, null);
    assert.strictEqual(afterQuote.lastAuthOutcome, 'AUTHENTICATED');
    assert.strictEqual(afterQuote.consecutiveAuthFailures, 0);
    assert.strictEqual(afterQuote.authLatched, false);

    // Cache-hit quote read does not hit transport or fabricate a newer lastSuccessAt.
    h.advanceClock(1_000);
    const cachedQuote = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(cachedQuote.ok, true);
    assert.strictEqual(h.getTransportCalls(), 1);
    assert.strictEqual(h.service.getObservedProviderState().lastSuccessAt, '2026-11-16T04:45:00.042Z');

    // Health reflects observed vendor acceptance while keeping synthetic qualification honest.
    const connectedHealth = await h.service.health();
    assert.deepStrictEqual(validateDhanServiceHealth(connectedHealth), {
      contractVersion: 2,
      service: 'UP',
      providerConfiguration: 'CONFIGURED',
      liveProviderConnectivity: 'CONNECTED_LIVE',
      providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
    });

    // 2. Historical interaction also updates the shared recorder.
    const histRes = await h.service.getHistorical({
      companyId: 'EQ_INFY_IN',
      exchangeSegment: 'NSE_EQ',
      isin: 'INE009A01021',
      interval: '1D',
      fromDate: '2026-11-13',
      toDate: '2026-11-13',
    });
    assert.strictEqual(histRes.ok, true);
    const afterHist = h.service.getObservedProviderState();
    assert.strictEqual(afterHist.lastSuccessAt, '2026-11-16T04:45:01.110Z');
    assert.strictEqual(afterHist.lastLatencyMs, 68);
    assert.strictEqual(afterHist.lastAuthOutcome, 'AUTHENTICATED');
  });

  it('W08-02: authentication failure records governed AUTHENTICATION_FAILURE category and increments consecutiveAuthFailures', async () => {
    const h = createHarness({
      steps: [
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({ errorCode: 'DH-901', errorMessage: CANARY_VENDOR_MESSAGE }),
          latencyMs: 31,
        },
      ],
    });

    const res = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });

    // D-2 / W-05: a 401 spends the session's single bounded re-read and retries ONCE. Only one
    // 401 is scripted, so the replacement material meets the harness default 200 and the call
    // SUCCEEDS — the approved recovery path.
    assert.strictEqual(res.ok, true, 'the single rejection is recovered by the bounded retry');
    //
    // (Before W-05 this assertion was `getTransportCalls() === 1` with the quote failing.
    // D-2 replaced "never retry" with "retry exactly once after re-reading the vault"; the
    // zero-retry rule that survives is the one on OTHER failure codes, asserted in W06-09.)
    assert.strictEqual(h.getTransportCalls(), 2, 'exactly one bounded retry after the 401');
    assert.strictEqual(h.getResolverCalls(), 2, 'one start-up read plus exactly one re-read');
    assert.strictEqual(h.getCredentialSession().vaultReadCount, 2);
    assert.strictEqual(h.getCredentialSession().authLatched, false);
    assert.strictEqual(h.getCredentialSession().authRejectionBudgetRemaining, false);

    // The rejection was recorded and then cleared by the accepted retry: D-2 / D-7 T7 says an
    // accepted authenticated interaction on an unlatched recorder resets the counter and clears
    // `lastFailure`, so the surviving observable is the success, not the 401 that preceded it.
    const state = h.service.getObservedProviderState();
    assert.deepStrictEqual(state, {
      lastSuccessAt: '2026-11-16T04:45:00.068Z',
      lastFailure: null,
      lastAuthOutcome: 'AUTHENTICATED',
      lastLatencyMs: 37,
      consecutiveAuthFailures: 0,
      authLatched: false,
    });
    assert.strictEqual((await h.service.health()).liveProviderConnectivity, 'CONNECTED_LIVE');
  });

  it('W08-02a: the bounded re-read is what recovers the request — a rejected replacement surfaces the failure', async () => {
    // Same 401, but the replacement material is rejected as well, so the request fails and
    // latches. This is the pair to W08-02: identical first rejection, different replacement.
    const h = createHarness({
      steps: [
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({ errorCode: 'DH-901', errorMessage: CANARY_VENDOR_MESSAGE }),
          latencyMs: 31,
        },
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({ errorCode: 'DH-901', errorMessage: CANARY_VENDOR_MESSAGE }),
          latencyMs: 24,
        },
      ],
    });

    const res = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(res.ok, false);
    if (!res.ok) assert.strictEqual(res.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.getTransportCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);
    assert.strictEqual(h.getCredentialSession().authLatched, true);
  });

  it('W08-03: credential expiration records CREDENTIALS_EXPIRED pre-flight with zero vendor calls and without incrementing consecutiveAuthFailures', async () => {
    // Case A: resolver reports expired token timestamp.
    const expiredClock = createHarness({
      resolveImpl: async () => ({
        accessToken: CANARY_ACCESS_TOKEN,
        clientId: CANARY_CLIENT_ID,
        expiresAt: '2026-11-16T01:00:00.000Z',
      }),
    });

    const quoteRes = await expiredClock.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(quoteRes.ok, false);
    if (!quoteRes.ok) assert.strictEqual(quoteRes.failure.code, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(expiredClock.getTransportCalls(), 0);
    assert.deepStrictEqual(expiredClock.service.getObservedProviderState(), {
      lastSuccessAt: null,
      lastFailure: {
        category: 'CREDENTIALS_EXPIRED',
        at: '2026-11-16T04:45:00.000Z',
      },
      lastAuthOutcome: 'CREDENTIALS_EXPIRED',
      lastLatencyMs: null,
      consecutiveAuthFailures: 0,
      authLatched: false,
    });

    // Case B: vault throws REVOKED DhanVaultResolutionError.
    const revokedVault = createHarness({
      resolveImpl: async () => {
        throw new DhanVaultResolutionError(
          'REVOKED',
          'CREDENTIALS_EXPIRED',
          `Vault secret revoked at ${CANARY_WIN_PATH}`
        );
      },
    });
    const verifyRevoked = await revokedVault.service.verifyConnection();
    assert.strictEqual(verifyRevoked.outcome, 'EXPIRED_LOCAL');
    assert.strictEqual(verifyRevoked.probeAttempted, false);
    assert.strictEqual(verifyRevoked.probeCount, 0);
    assert.strictEqual(revokedVault.getTransportCalls(), 0);
    assert.strictEqual(revokedVault.service.getObservedProviderState().lastAuthOutcome, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(
      revokedVault.service.getObservedProviderState().lastFailure?.category,
      'CREDENTIALS_EXPIRED'
    );
    assert.strictEqual(revokedVault.service.getObservedProviderState().consecutiveAuthFailures, 0);
    assert.strictEqual(revokedVault.service.getObservedProviderState().authLatched, false);
  });

  it('W08-04: timeout records governed TIMEOUT category, captures latency, preserves prior lastSuccessAt, and clears live connectivity claim', async () => {
    const h = createHarness({
      steps: [
        { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 29 },
        { kind: 'timeout', latencyMs: 5_000 },
      ],
    });

    const okQuote = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(okQuote.ok, true);
    assert.strictEqual((await h.service.health()).liveProviderConnectivity, 'CONNECTED_LIVE');

    // Historical call experiences vendor transport timeout.
    h.advanceClock(500);
    const timedOutHist = await h.service.getHistorical({
      companyId: 'EQ_INFY_IN',
      exchangeSegment: 'NSE_EQ',
      isin: 'INE009A01021',
      interval: '1D',
      fromDate: '2026-11-13',
      toDate: '2026-11-13',
    });
    assert.strictEqual(timedOutHist.ok, false);
    if (!timedOutHist.ok) assert.strictEqual(timedOutHist.failure.code, 'TIMEOUT');

    const state = h.service.getObservedProviderState();
    assert.deepStrictEqual(state, {
      lastSuccessAt: '2026-11-16T04:45:00.029Z',
      lastFailure: {
        category: 'TIMEOUT',
        at: '2026-11-16T04:45:05.529Z',
      },
      lastAuthOutcome: 'AUTHENTICATED',
      lastLatencyMs: 5_000,
      consecutiveAuthFailures: 0,
      authLatched: false,
    });
    assert.strictEqual((await h.service.health()).liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
  });

  it('W08-05: successful authentication when unlatched resets consecutiveAuthFailures and clears lastFailure per D-2 / D-7 T7', async () => {
    const h = createHarness({
      steps: [
        // D-2 / W-05 order: the FIRST 401 is answered by the bounded re-read plus one retry, so a
        // single scripted 401 no longer ends the call. Two 401s are needed to reach the latched
        // state W08-06 asserts, and one 401 followed by a 200 is the clean-recovery path.
        //
        // 1st: 401 -> re-read -> 2nd: 200 accepted -> recovers within the same call.
        { kind: 'http', status: 401, bodyText: '{"error":"unauthorized"}', latencyMs: 22 },
        { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 34 },
      ],
    });

    // One request: rejected, re-read, retried, accepted. It succeeds and the recorder shows the
    // success — the counter that briefly reached 1 was reset by the accepted retry (T7).
    const first = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(first.ok, true);
    assert.strictEqual(h.getTransportCalls(), 2, 'the rejection and the bounded retry');
    assert.strictEqual(h.getResolverCalls(), 2, 'the start-up read and the single re-read');
    assert.strictEqual(h.service.getObservedProviderState().consecutiveAuthFailures, 0);
    assert.strictEqual(h.service.getObservedProviderState().authLatched, false);

    // A LATER identical request is a D02 cache hit: no vendor call and no vault read at all.
    const cached = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(cached.ok, true);
    assert.strictEqual(h.getTransportCalls(), 2, 'the repeat is served from the D02 cache');
    assert.strictEqual(h.getResolverCalls(), 2, 'a cache hit never reads the vault');

    // A request that DOES reach the vendor is served from the held session: one vendor call and
    // no vault read. V2 (`verifyConnection`) is used because it is guaranteed to make a live
    // authenticated probe (D-7 §3), so the reuse claim is tested on a real egress path rather
    // than on a cache hit.
    h.advanceClock(120_000);
    const probe = await h.service.verifyConnection();
    assert.strictEqual(probe.outcome, 'VERIFIED_VENDOR_ACCEPTED');
    assert.strictEqual(probe.probeCount, 1);
    assert.strictEqual(h.getTransportCalls(), 3, 'one vendor call for the verification probe');
    assert.strictEqual(h.getResolverCalls(), 2, 'the probe reuses the held session — no vault read');

    const state = h.service.getObservedProviderState();
    assert.deepStrictEqual(state, {
      lastSuccessAt: '2026-11-16T04:47:00.093Z',
      lastFailure: null,
      lastAuthOutcome: 'AUTHENTICATED',
      lastLatencyMs: 37,
      consecutiveAuthFailures: 0,
      authLatched: false,
    });
    assert.strictEqual((await h.service.health()).liveProviderConnectivity, 'CONNECTED_LIVE');
  });

  it('W08-06: authentication latch engages at threshold 2, blocks further credential reads/vendor probes, and refuses auto-recovery', async () => {
    assert.strictEqual(DHAN_AUTH_LATCH_THRESHOLD, 2);
    const h = createHarness({
      steps: [
        // D-2 / W-05: ONE quote request now produces the whole latch sequence by itself —
        // initial rejection (count 1), the single bounded re-read, then a rejected replacement
        // (count 2) which latches. Before W-05 two separate quote requests were needed because
        // nothing retried.
        { kind: 'http', status: 401, bodyText: '{"error":"unauthorized-1"}', latencyMs: 18 },
        { kind: 'http', status: 403, bodyText: '{"error":"forbidden-2"}', latencyMs: 21 },
        // Queued 200 MUST never be reached once latched:
        { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 15 },
      ],
    });

    // A single quote request: 401 -> one re-read -> 403 -> latch.
    const r1 = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(r1.ok, false);
    if (!r1.ok) assert.strictEqual(r1.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.getTransportCalls(), 2, 'the rejection plus exactly one bounded retry');
    assert.strictEqual(h.getResolverCalls(), 2, 'the start-up read plus exactly one re-read');
    assert.strictEqual(h.service.getObservedProviderState().consecutiveAuthFailures, 2);
    assert.strictEqual(h.service.getObservedProviderState().authLatched, true);

    // A second request is refused before any read or call, so the counters cannot move.
    h.advanceClock(100);
    const r2 = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(r2.ok, false);
    assert.strictEqual(h.getTransportCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);

    const latchedState = h.service.getObservedProviderState();
    assert.deepStrictEqual(latchedState, {
      lastSuccessAt: null,
      lastFailure: {
        // The second (replacement) rejection, at 18ms + 21ms into the call.
        category: 'AUTHENTICATION_FAILURE',
        at: '2026-11-16T04:45:00.039Z',
      },
      lastAuthOutcome: 'AUTHENTICATION_FAILURE',
      lastLatencyMs: 21,
      consecutiveAuthFailures: 2,
      authLatched: true,
    });

    // 3rd call (quote), 4th call (historical), and 5th call (verifyConnection) all fail closed
    // with zero additional credential reads and zero additional vendor transport calls.
    const r3 = await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    assert.strictEqual(r3.ok, false);
    if (!r3.ok) assert.strictEqual(r3.failure.code, 'AUTHENTICATION_FAILURE');

    const r4 = await h.service.getHistorical({
      companyId: 'EQ_INFY_IN',
      exchangeSegment: 'NSE_EQ',
      isin: 'INE009A01021',
      interval: '1D',
      fromDate: '2026-11-13',
      toDate: '2026-11-13',
    });
    assert.strictEqual(r4.ok, false);
    if (!r4.ok) assert.strictEqual(r4.failure.code, 'AUTHENTICATION_FAILURE');

    const r5 = await h.service.verifyConnection();
    assert.strictEqual(r5.outcome, 'AUTH_REJECTED');
    assert.strictEqual(r5.probeAttempted, false);
    assert.strictEqual(r5.probeCount, 0);
    assert.strictEqual(h.getTransportCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);

    // Even a direct unit-level recordSuccess on the latched recorder cannot auto-clear the latch.
    h.client.getStateRecorder().recordSuccess({
      at: '2026-11-16T05:00:00.000Z',
      latencyMs: 10,
    });
    assert.strictEqual(h.service.getObservedProviderState().authLatched, true);
    assert.strictEqual(h.service.getObservedProviderState().lastAuthOutcome, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.service.getObservedProviderState().consecutiveAuthFailures, 2);
    assert.strictEqual((await h.service.health()).liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
  });

  it('W08-07: health reads never mutate recorder state across initial, healthy, degraded, and latched states', async () => {
    const h = createHarness({
      steps: [
        { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 40 },
        { kind: 'timeout', latencyMs: 2_500 },
      ],
    });

    const assertHealthDoesNotMutate = async () => {
      const before = h.service.getObservedProviderState();
      assert.strictEqual(Object.isFrozen(before), true);
      if (before.lastFailure !== null) {
        assert.strictEqual(Object.isFrozen(before.lastFailure), true);
      }
      h.advanceClock(5_000);
      await h.service.health();
      await h.service.health();
      h.service.getFreshness({
        domain: 'D01_QUOTES',
        companyId: 'EQ_INFY_IN',
        exchangeSegment: 'NSE_EQ',
        securityIdentity: ID_INFY,
      });
      const after = h.service.getObservedProviderState();
      assert.deepStrictEqual(after, before);
    };

    // 1. Initial untouched state.
    await assertHealthDoesNotMutate();

    // 2. Post-success state.
    await h.service.verifyConnection();
    await assertHealthDoesNotMutate();

    // 3. Post-timeout failure state.
    await h.service.verifyConnection();
    await assertHealthDoesNotMutate();
  });

  it('W08-08: health reads cause zero transport invocations and zero credential resolver invocations (direct and HTTP /v1/health)', async () => {
    const h = createHarness();
    const server = createMarketDataHttpServer({
      service: h.service,
      token: LOOPBACK_BEARER,
      host: '127.0.0.1',
      env: {},
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = server.address() as AddressInfo;
      const transportClient = new MarketDataTransportClient(
        `http://127.0.0.1:${address.port}`,
        LOOPBACK_BEARER,
        { env: {} }
      );

      for (let i = 0; i < 5; i += 1) {
        const direct = await h.service.health();
        const overHttp = await transportClient.health();
        assert.strictEqual(direct.service, 'UP');
        assert.strictEqual(overHttp.ok, true);
        if (overHttp.ok) {
          assert.strictEqual(overHttp.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
          assert.strictEqual(overHttp.contractVersion, 2);
        }
      }

      assert.strictEqual(h.getTransportCalls(), 0);
      assert.strictEqual(h.getResolverCalls(), 0);
      assert.deepStrictEqual(h.service.getObservedProviderState(), {
        lastSuccessAt: null,
        lastFailure: null,
        lastAuthOutcome: 'NOT_CHECKED',
        lastLatencyMs: null,
        consecutiveAuthFailures: 0,
        authLatched: false,
      });
    } finally {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('W08-09: explicit verifyConnection performs at most one probe, never retries, never re-reads credentials, and records into the shared recorder', async () => {
    // 1. Transient failures (TIMEOUT, 503, 429) and auth failure (401) each perform AT MOST 1 probe (zero retry)
    //    and AT MOST 1 credential read (zero re-read).
    const transientScenarios: Array<{
      step: ScriptedResponseStep;
      expectedOutcome: string;
      expectedCategory: string;
    }> = [
      { step: { kind: 'timeout', latencyMs: 1_200 }, expectedOutcome: 'FAILED_TRANSPORT', expectedCategory: 'TIMEOUT' },
      { step: { kind: 'http', status: 503, bodyText: '{"error":"unavailable"}', latencyMs: 45 }, expectedOutcome: 'FAILED_VENDOR_RESPONSE', expectedCategory: 'HTTP_ERROR' },
      { step: { kind: 'http', status: 429, bodyText: '{"error":"throttled"}', latencyMs: 19 }, expectedOutcome: 'FAILED_VENDOR_RESPONSE', expectedCategory: 'RATE_LIMITED' },
      { step: { kind: 'http', status: 401, bodyText: '{"error":"bad token"}', latencyMs: 27 }, expectedOutcome: 'AUTH_REJECTED', expectedCategory: 'AUTHENTICATION_FAILURE' },
    ];

    for (const scenario of transientScenarios) {
      const h = createHarness({
        steps: [
          scenario.step,
          // If verifyConnection retried, this 2nd step would be consumed:
          { kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 12 },
        ],
      });
      const result = await h.service.verifyConnection();
      assert.strictEqual(result.outcome, scenario.expectedOutcome);
      assert.strictEqual(result.probeAttempted, true);
      assert.strictEqual(result.probeCount, 1);
      assert.strictEqual(result.failureCategory, scenario.expectedCategory);
      assert.strictEqual(h.getTransportCalls(), 1, `Expected single probe for ${scenario.expectedCategory}`);
      assert.strictEqual(h.getResolverCalls(), 1, `Expected zero credential re-reads for ${scenario.expectedCategory}`);
      assert.strictEqual(h.service.getObservedProviderState().lastFailure?.category, scenario.expectedCategory);
    }

    // 2. Successful probe performs exactly 1 probe, records success in shared recorder, and updates health().
    const okHarness = createHarness({
      steps: [{ kind: 'http', status: 200, bodyText: JSON.stringify(validQuoteVendorPayload()), latencyMs: 53 }],
    });
    const okVerify = await okHarness.service.verifyConnection();
    assert.strictEqual(okVerify.outcome, 'VERIFIED_VENDOR_ACCEPTED');
    assert.strictEqual(okVerify.probeAttempted, true);
    assert.strictEqual(okVerify.probeCount, 1);
    assert.strictEqual(okVerify.failureCategory, null);
    assert.strictEqual(okVerify.latencyMs, 53);
    assert.strictEqual(okHarness.getTransportCalls(), 1);
    assert.strictEqual(okHarness.getResolverCalls(), 1);
    assert.strictEqual(okHarness.service.getObservedProviderState().lastSuccessAt, '2026-11-16T04:45:00.053Z');
    assert.strictEqual((await okHarness.service.health()).liveProviderConnectivity, 'CONNECTED_LIVE');

    // 3. LOCAL_ONLY mode and unconfigured mode perform 0 probes.
    const localOnly = createHarness();
    const localVerify = await localOnly.service.verifyConnection({ mode: 'LOCAL_ONLY' });
    assert.strictEqual(localVerify.outcome, 'VERIFIED_LOCAL_ONLY');
    assert.strictEqual(localVerify.probeAttempted, false);
    assert.strictEqual(localVerify.probeCount, 0);
    assert.strictEqual(localOnly.getTransportCalls(), 0);
    assert.strictEqual(localOnly.getResolverCalls(), 1);

    const unconfigured = createHarness({ env: {} });
    const unconfiguredVerify = await unconfigured.service.verifyConnection();
    assert.strictEqual(unconfiguredVerify.outcome, 'NOT_ATTEMPTED_NOT_READY');
    assert.strictEqual(unconfiguredVerify.probeAttempted, false);
    assert.strictEqual(unconfiguredVerify.probeCount, 0);
    assert.strictEqual(unconfigured.getTransportCalls(), 0);
    assert.strictEqual(unconfigured.getResolverCalls(), 0);
  });

  it('W08-10: serialized recorder and verification outputs contain zero secrets, vault:// refs, paths, child-process output, or raw vendor messages', async () => {
    const h = createHarness({
      steps: [
        {
          kind: 'http',
          status: 401,
          bodyText: JSON.stringify({
            errorMessage: `${CANARY_VENDOR_MESSAGE} ${CANARY_ACCESS_TOKEN} ${CANARY_SECRET_REF_TOKEN} ${CANARY_WIN_PATH}`,
          }),
          latencyMs: 33,
        },
        {
          kind: 'network_error',
          latencyMs: 41,
          message: `${CANARY_CHILD_OUTPUT} ${CANARY_POSIX_PATH} ${CANARY_CLIENT_ID} ${CANARY_SECRET_REF_CLIENT}`,
        },
        {
          kind: 'http',
          status: 200,
          bodyText: JSON.stringify({
            status: 'failed',
            remarks: `${CANARY_VENDOR_MESSAGE} ${CANARY_WIN_PATH} ${CANARY_POSIX_PATH}`,
          }),
          latencyMs: 28,
        },
      ],
    });

    const outputs: string[] = [];

    // 1. Vendor 401 carrying canary secrets, vault:// refs, paths, and vendor error message.
    await h.service.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY,
      exchangeSegment: 'NSE_EQ',
    });
    outputs.push(JSON.stringify(h.service.getObservedProviderState()));
    outputs.push(JSON.stringify(await h.service.health()));

    // 2. Network throw carrying child-process stderr, POSIX path, client id, and vault:// ref.
    outputs.push(JSON.stringify(await h.service.verifyConnection()));
    outputs.push(JSON.stringify(h.service.getObservedProviderState()));

    // 3. HTTP 200 status=failed vendor remarks carrying vendor error message and paths.
    outputs.push(JSON.stringify(await h.service.verifyConnection()));
    outputs.push(JSON.stringify(h.service.getObservedProviderState()));

    // 4. Direct adversarial untyped input against DhanProviderStateRecorder.
    const directRecorder = new DhanProviderStateRecorder({
      now: () => Date.parse('2026-11-16T06:00:00.000Z'),
    });
    directRecorder.recordFailure({
      category: `${CANARY_VENDOR_MESSAGE} ${CANARY_WIN_PATH}` as never,
      at: `${CANARY_POSIX_PATH} ${CANARY_SECRET_REF_TOKEN}`,
      latencyMs: 12,
      ...({
        message: CANARY_VENDOR_MESSAGE,
        secret: CANARY_ACCESS_TOKEN,
        secretRef: CANARY_SECRET_REF_TOKEN,
        stderr: CANARY_CHILD_OUTPUT,
        path: CANARY_WIN_PATH,
      } as Record<string, unknown>),
    });
    const adversarialSnapshot = directRecorder.snapshot();
    assert.deepStrictEqual(Object.keys(adversarialSnapshot).sort(), [
      'authLatched',
      'consecutiveAuthFailures',
      'lastAuthOutcome',
      'lastFailure',
      'lastLatencyMs',
      'lastSuccessAt',
    ]);
    assert.strictEqual(adversarialSnapshot.lastFailure?.category, 'PROVIDER_STATUS_FAILURE');
    assert.strictEqual(adversarialSnapshot.lastFailure?.at, '2026-11-16T06:00:00.000Z');
    outputs.push(JSON.stringify(adversarialSnapshot));

    for (const serialized of outputs) {
      assertZeroSensitiveLeakage(serialized);
    }
  });
});
