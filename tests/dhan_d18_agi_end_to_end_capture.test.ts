/**
 * D-18 AGI Greenpac — Offline End-to-End Capture Path & Diagnostic Visibility Tests
 *
 * Exercises the REAL composed execution chain:
 *   startMarketDataDaemon / runMarketDataDaemonCli
 *     -> loopback HTTP server (POST /v1/quotes, GET /v1/diagnostics, GET /v1/freshness)
 *     -> DhanMarketDataService
 *     -> DhanRefreshOrchestrator + DhanBoundedCache + DhanFileStateStore (W-23)
 *     -> DhanMarketDataSource + governed P7 manifest (EQ_AGI_IN / NSE_EQ / 1412)
 *     -> DhanApiClient.fetchMarketQuotes -> executeJsonPost -> captureRawDepthIfEnabled
 *     -> dhan_depth_capture (one-shot latch, .arm consumption, JSON output, diagnostics)
 *
 * Strictly offline: uses synthetic injected DhanHttpTransport and synthetic in-memory
 * credentials. Zero live vendor calls, zero host DPAPI access.
 */

import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import type { DhanHttpRequest, DhanHttpResponse, DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import type { DhanCredentialResolver, DhanCredentialMaterial, DhanProviderConfig } from '../src/providers/dhan/dhan_config.js';
import {
  DHAN_DEPTH_CAPTURE_DEBUG_ENV,
  DHAN_DEPTH_CAPTURE_ENV,
  DHAN_DEPTH_CAPTURE_LABEL_ENV,
  DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV,
  DHAN_DEPTH_CAPTURE_SEGMENT_ENV,
  armDepthCapture,
  depthCaptureArmMarkerPath,
  describeDepthCaptureConfig,
  getLastDepthCaptureAttempt,
  isDepthCaptureArmed,
  isDepthCaptureLatched,
  resetDepthCaptureDiagnosticsForTests,
  resetDepthCaptureLatchForTests,
} from '../src/providers/dhan/dhan_depth_capture.js';
import {
  MARKET_DATA_ROUTES,
  MARKET_DATA_STATE_PATH_ENV,
  runMarketDataDaemonCli,
  startMarketDataDaemon,
} from '../src/providers/dhan/index.js';
import type {
  LocalHostVaultBackendReadiness,
  LocalHostVaultDhanCredentialResolver,
} from '../src/providers/dhan/dhan_local_vault_resolver.js';

const TRANSPORT_TOKEN = 'D18_E2E_SYNTHETIC_TRANSPORT_TOKEN_01';
const AGI_COMPANY_ID = 'EQ_AGI_IN';
const AGI_SECURITY_ID = 'ISIN:INE415A01038:EQ';
const AGI_SEGMENT = 'NSE_EQ' as const;
const AGI_DHAN_ID = '1412';
const CALENDAR_V4_PATH = resolve('calendars/ipd-equity-2026.v2026-11-27.4.json');

interface CapturedTransportCall {
  readonly method: string;
  readonly url: string;
  readonly body: string | undefined;
}

class SyntheticAgiTransport implements DhanHttpTransport {
  public readonly calls: CapturedTransportCall[] = [];
  public nextStatus = 200;
  public nextResponseFactory: (req: DhanHttpRequest) => DhanHttpResponse;

  constructor(responseFactory?: (req: DhanHttpRequest) => DhanHttpResponse) {
    this.nextResponseFactory = responseFactory ?? (() => ({
      status: this.nextStatus,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00')),
    }));
  }

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.calls.push({ method: request.method, url: request.url, body: request.body });
    return this.nextResponseFactory(request);
  }
}

function buildAgiRawVendorQuote(lastTradeTime: string, options?: { zeroBook?: boolean }): Record<string, unknown> {
  const zero = options?.zeroBook === true;
  return {
    status: 'success',
    data: {
      NSE_EQ: {
        [AGI_DHAN_ID]: {
          last_price: 640.0,
          volume: 30388,
          last_trade_time: lastTradeTime,
          net_change: -9.1,
          average_price: 645.98,
          ohlc: { open: 655.5, high: 664.0, low: 635.0, close: 649.1 },
          depth: {
            buy: [
              { price: zero ? 0 : 639.55, quantity: zero ? 0 : 120, orders: zero ? 0 : 4 },
              { price: zero ? 0 : 639.5, quantity: zero ? 0 : 250, orders: zero ? 0 : 6 },
              { price: 0, quantity: 0, orders: 0 },
              { price: 0, quantity: 0, orders: 0 },
              { price: 0, quantity: 0, orders: 0 },
            ],
            sell: [
              { price: zero ? 0 : 640.0, quantity: zero ? 0 : 95, orders: zero ? 0 : 3 },
              { price: zero ? 0 : 640.15, quantity: zero ? 0 : 180, orders: zero ? 0 : 5 },
              { price: 0, quantity: 0, orders: 0 },
              { price: 0, quantity: 0, orders: 0 },
              { price: 0, quantity: 0, orders: 0 },
            ],
          },
        },
      },
    },
  };
}

function createSyntheticCredentialResolver(): LocalHostVaultDhanCredentialResolver {
  const readiness: LocalHostVaultBackendReadiness = {
    backendId: 'SYNTHETIC_D18_E2E_VAULT',
    liveResolutionSupported: true,
    prerequisiteSummary: 'SYNTHETIC_TEST_READY',
  };
  const resolver: DhanCredentialResolver & {
    describeBackendReadiness: () => LocalHostVaultBackendReadiness;
    probeBackendReadiness: () => Promise<LocalHostVaultBackendReadiness>;
  } = {
    async resolve(_config: DhanProviderConfig): Promise<DhanCredentialMaterial | null> {
      return {
        clientId: 'SYNTHETIC_CLIENT_ID_ONLY',
        accessToken: 'SYNTHETIC_ACCESS_TOKEN_ONLY',
      };
    },
    describeBackendReadiness() {
      return readiness;
    },
    async probeBackendReadiness() {
      return readiness;
    },
  };
  return resolver as unknown as LocalHostVaultDhanCredentialResolver;
}

async function allocateFreeLoopbackPort(): Promise<number> {
  return await new Promise<number>((resolvePort, rejectPort) => {
    const probe = createNetServer();
    probe.once('error', rejectPort);
    probe.listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      if (!addr || typeof addr === 'string') {
        probe.close(() => rejectPort(new Error('Failed to allocate loopback port')));
        return;
      }
      const { port } = addr;
      probe.close((err) => (err ? rejectPort(err) : resolvePort(port)));
    });
  });
}

function buildBaseDaemonEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    NODE_ENV: 'test',
    IIPS_MARKET_DATA_TRANSPORT_TOKEN: TRANSPORT_TOKEN,
    IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://synthetic/dhan/client-id',
    IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: 'vault://synthetic/dhan/access-token',
    IIPS_DHAN_VAULT_PROVIDER: 'LOCAL_MOCK_VAULT',
    IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: '2027-01-01T00:00:00.000Z',
    IIPS_DHAN_VAULT_BACKEND: 'disabled',
    ...overrides,
  };
}

async function postAgiQuote(
  baseUrl: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.quotes}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${TRANSPORT_TOKEN}`,
      'content-type': 'application/json',
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify({
      companyId: AGI_COMPANY_ID,
      securityId: AGI_SECURITY_ID,
      exchangeSegment: AGI_SEGMENT,
    }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function getDiagnostics(baseUrl: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.diagnostics}`, {
    headers: { authorization: `Bearer ${TRANSPORT_TOKEN}` },
  });
  assert.equal(res.status, 200);
  return (await res.json()) as Record<string, unknown>;
}

async function getAgiFreshness(baseUrl: string): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({
    domain: 'D01_QUOTES',
    companyId: AGI_COMPANY_ID,
    exchangeSegment: AGI_SEGMENT,
    securityId: AGI_SECURITY_ID,
  });
  const res = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.freshness}?${qs.toString()}`, {
    headers: { authorization: `Bearer ${TRANSPORT_TOKEN}` },
  });
  assert.equal(res.status, 200);
  return (await res.json()) as Record<string, unknown>;
}

afterEach(() => {
  resetDepthCaptureLatchForTests();
  resetDepthCaptureDiagnosticsForTests();
});

describe('D-18 AGI Greenpac end-to-end daemon/HTTP/service/client/capture path (offline)', () => {
  it('E2E-AGI-01: real daemon + P7 manifest resolves EQ_AGI_IN -> NSE_EQ/1412, writes agi-depth.json, consumes .arm, and records CAPTURED diagnostic', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-01-'));
    const capturePath = join(dir, 'agi-depth.json');
    const transport = new SyntheticAgiTransport(() => ({
      status: 200,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00', { zeroBook: true })),
    }));
    const now = () => new Date('2026-11-27T09:56:00.000Z'); // 15:26 IST

    const started = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [DHAN_DEPTH_CAPTURE_ENV]: capturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
        [DHAN_DEPTH_CAPTURE_LABEL_ENV]: 'D-18 AGI E2E synthetic closed book',
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport,
      now,
    });
    assert.equal(started.ok, true, JSON.stringify(started));
    if (!started.ok) return;

    try {
      assert.equal(armDepthCapture(capturePath), true);
      assert.equal(isDepthCaptureArmed(capturePath), true);
      assert.equal(existsSync(capturePath), false);

      const diagBefore = await getDiagnostics(started.diagnostics.baseUrl);
      assert.equal((diagBefore.requestCounters as Record<string, number>).vendorRequestsTotal, 0);

      const quoteRes = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(quoteRes.status, 200, JSON.stringify(quoteRes.body));
      assert.equal(quoteRes.body.ok, true);
      assert.equal(quoteRes.body.freshness, 'CURRENT');

      // Verify exact P7 resolution and numeric serialization to Dhan /marketfeed/quote
      assert.equal(transport.calls.length, 1);
      assert.equal(transport.calls[0]!.body, JSON.stringify({ NSE_EQ: [1412] }));

      // Verify capture artifact written and .arm marker consumed
      assert.equal(existsSync(capturePath), true, 'agi-depth.json must be written');
      assert.equal(existsSync(depthCaptureArmMarkerPath(capturePath)), false, 'agi-depth.json.arm must be consumed');

      const doc = JSON.parse(readFileSync(capturePath, 'utf8')) as Record<string, unknown>;
      assert.equal(doc.captureSchemaVersion, 2);
      assert.equal(doc.httpStatus, 200);
      assert.equal(doc.responseStatus, 'success');
      assert.deepEqual(doc.requestedSecurityIds, ['1412']);
      assert.equal(doc.instrumentsInResponse, 1);
      const quotes = doc.quotes as Array<Record<string, unknown>>;
      assert.equal(quotes.length, 1);
      assert.equal(quotes[0]!.segment, 'NSE_EQ');
      assert.equal(quotes[0]!.securityId, '1412');
      assert.equal(quotes[0]!.depthState, 'object');
      assert.equal((quotes[0]!.buy as Record<string, unknown>).count, 5);
      assert.equal((quotes[0]!.sell as Record<string, unknown>).count, 5);

      // Verify diagnostics counter delta and structured D-18 diagnostic record
      const diagAfter = await getDiagnostics(started.diagnostics.baseUrl);
      assert.equal((diagAfter.requestCounters as Record<string, number>).vendorRequestsTotal, 1);
      assert.equal((diagAfter.requestCounters as Record<string, number>).vendorSuccesses, 1);

      const attempt = getLastDepthCaptureAttempt();
      assert.ok(attempt !== null);
      assert.equal(attempt.outcome, 'CAPTURED');
      assert.equal(attempt.targetSegment, 'NSE_EQ');
      assert.equal(attempt.targetSecurityId, '1412');
      assert.deepEqual(attempt.requestedInstruments, ['NSE_EQ:1412']);
      assert.equal(attempt.disarmed, true);
      assert.equal(attempt.writeErrorCode, null);
    } finally {
      await started.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-02: in-memory cache hit (SKIPPED_FRESH) returns HTTP 200 without calling Dhan and leaves .arm untouched', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-02-'));
    const capturePath = join(dir, 'agi-depth.json');
    const transport = new SyntheticAgiTransport();
    const now = () => new Date('2026-11-27T09:56:00.000Z');

    const started = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [DHAN_DEPTH_CAPTURE_ENV]: capturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport,
      now,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    try {
      // First quote while UNARMED populates cache as CURRENT
      const first = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(first.status, 200);
      assert.equal(transport.calls.length, 1);
      assert.equal(existsSync(capturePath), false);
      assert.equal(getLastDepthCaptureAttempt()?.outcome, 'UNARMED_MARKER_ABSENT');

      // Now arm marker and send second quote while entry is still CURRENT
      assert.equal(armDepthCapture(capturePath), true);
      const diagBeforeSecond = await getDiagnostics(started.diagnostics.baseUrl);
      const freshBeforeSecond = await getAgiFreshness(started.diagnostics.baseUrl);
      assert.equal(freshBeforeSecond.cacheState, 'CURRENT');

      const second = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(second.status, 200);
      assert.equal(second.body.freshness, 'CURRENT');

      const diagAfterSecond = await getDiagnostics(started.diagnostics.baseUrl);
      assert.equal(
        (diagAfterSecond.requestCounters as Record<string, number>).vendorRequestsTotal,
        (diagBeforeSecond.requestCounters as Record<string, number>).vendorRequestsTotal,
        'vendorRequestsTotal must NOT increment on cache hit'
      );
      assert.equal(
        (diagAfterSecond.requestCounters as Record<string, number>).quoteCacheHits,
        (diagBeforeSecond.requestCounters as Record<string, number>).quoteCacheHits + 1
      );
      assert.equal(transport.calls.length, 1, 'vendor must NOT be called on cache hit');
      assert.equal(existsSync(capturePath), false, 'capture file must NOT be written on cache hit');
      assert.equal(isDepthCaptureArmed(capturePath), true, '.arm marker must remain on disk untouched');
    } finally {
      await started.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-03: W-23 persisted AGI quote + .4 trading calendar after market close restores as CURRENT and bypasses Dhan even after restart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-03-'));
    const capturePath = join(dir, 'agi-depth.json');
    const statePath = join(dir, 'market-data-state.json');

    // Daemon 1: late-session / closing-auction quote on 2026-11-27 (15:31 IST; acquired at 15:32 IST = 10:02 UTC).
    // Under the governed .4 calendar (09:15-15:35 + 15:50-16:00 IST), active-session age after 16:00 IST is
    // 240s + 600s = 840s (<= 900s D01_QUOTES threshold), so the quote remains CURRENT all evening.
    const transport1 = new SyntheticAgiTransport(() => ({
      status: 200,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:31:00')),
    }));
    const daemon1 = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [MARKET_DATA_STATE_PATH_ENV]: statePath,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport1,
      tradingCalendarPath: CALENDAR_V4_PATH,
      now: () => new Date('2026-11-27T10:02:00.000Z'), // 15:32 IST
    });
    assert.equal(daemon1.ok, true);
    if (!daemon1.ok) return;

    try {
      const q1 = await postAgiQuote(daemon1.diagnostics.baseUrl);
      assert.equal(q1.status, 200);
      assert.equal(transport1.calls.length, 1);
    } finally {
      await daemon1.handle.shutdown();
    }
    assert.equal(existsSync(statePath), true, 'W-23 state file should be written on clean shutdown');

    // Daemon 2: restarted 3.5 hours later at 19:03 IST (13:33 UTC) with D-18 fully configured + armed.
    const transport2 = new SyntheticAgiTransport();
    const daemon2 = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [MARKET_DATA_STATE_PATH_ENV]: statePath,
        [DHAN_DEPTH_CAPTURE_ENV]: capturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport2,
      tradingCalendarPath: CALENDAR_V4_PATH,
      now: () => new Date('2026-11-27T13:33:00.000Z'), // 19:03 IST — post-close
    });
    assert.equal(daemon2.ok, true);
    if (!daemon2.ok) return;

    try {
      assert.equal(armDepthCapture(capturePath), true);

      const diagBefore = await getDiagnostics(daemon2.diagnostics.baseUrl);
      const persist = diagBefore.persistence as Record<string, unknown>;
      assert.equal(persist.restoreStatus, 'LOADED');
      assert.equal(persist.quotesRestored, 1);

      // Because closed-market hours accumulate 0 open-session age, restored quote is STILL CURRENT!
      const freshBefore = await getAgiFreshness(daemon2.diagnostics.baseUrl);
      assert.equal(freshBefore.cacheState, 'CURRENT');
      assert.equal(freshBefore.verdict, 'GOOD');

      const q2 = await postAgiQuote(daemon2.diagnostics.baseUrl);
      assert.equal(q2.status, 200);
      assert.equal(q2.body.freshness, 'CURRENT');
      assert.equal(transport2.calls.length, 0, 'restored CURRENT quote bypasses Dhan completely');
      assert.equal(existsSync(capturePath), false, 'agi-depth.json is NOT written');
      assert.equal(isDepthCaptureArmed(capturePath), true, '.arm remains untouched');
    } finally {
      await daemon2.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-04: wrong target ID (2885), missing target env, invalid segment case, and unset path with DEBUG=1 each fail safe with exact diagnostic codes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-04-'));
    const cases: Array<{
      name: string;
      envOverrides: Record<string, string | undefined>;
      arm: boolean;
      expectedOutcome: string;
      expectedTargetIssue: string;
    }> = [
      {
        name: 'reliance-2885-mismatch',
        envOverrides: {
          [DHAN_DEPTH_CAPTURE_ENV]: join(dir, 'case1-agi.json'),
          [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ',
          [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '2885',
        },
        arm: true,
        expectedOutcome: 'REQUEST_NOT_SELECTED',
        expectedTargetIssue: 'NONE',
      },
      {
        name: 'missing-target-env',
        envOverrides: {
          [DHAN_DEPTH_CAPTURE_ENV]: join(dir, 'case2-agi.json'),
        },
        arm: true,
        expectedOutcome: 'TARGET_CONFIG_INVALID',
        expectedTargetIssue: 'SEGMENT_AND_SECURITY_ID_MISSING',
      },
      {
        name: 'lowercase-segment-invalid',
        envOverrides: {
          [DHAN_DEPTH_CAPTURE_ENV]: join(dir, 'case3-agi.json'),
          [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'nse_eq',
          [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '1412',
        },
        arm: true,
        expectedOutcome: 'TARGET_CONFIG_INVALID',
        expectedTargetIssue: 'SEGMENT_INVALID',
      },
      {
        name: 'path-unset-with-debug',
        envOverrides: {
          [DHAN_DEPTH_CAPTURE_DEBUG_ENV]: '1',
          [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ',
          [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '1412',
        },
        arm: false,
        expectedOutcome: 'DISABLED_PATH_UNSET',
        expectedTargetIssue: 'NONE',
      },
    ];

    try {
      for (const tc of cases) {
        resetDepthCaptureLatchForTests();
        resetDepthCaptureDiagnosticsForTests();
        const capturePath = tc.envOverrides[DHAN_DEPTH_CAPTURE_ENV];
        if (tc.arm && capturePath) {
          assert.equal(armDepthCapture(capturePath), true, tc.name);
        }
        const transport = new SyntheticAgiTransport();
        const started = await startMarketDataDaemon({
          env: buildBaseDaemonEnv(tc.envOverrides),
          host: '127.0.0.1',
          port: 0,
          transportToken: TRANSPORT_TOKEN,
          credentialResolver: createSyntheticCredentialResolver(),
          providerTransport: transport,
          now: () => new Date('2026-11-27T09:56:00.000Z'),
        });
        assert.equal(started.ok, true, tc.name);
        if (!started.ok) continue;
        try {
          const res = await postAgiQuote(started.diagnostics.baseUrl);
          assert.equal(res.status, 200, tc.name);
          assert.equal(transport.calls.length, 1, tc.name);
          if (capturePath) {
            assert.equal(existsSync(capturePath), false, `${tc.name}: no file written`);
            if (tc.arm) assert.equal(isDepthCaptureArmed(capturePath), true, `${tc.name}: .arm preserved`);
          }
          const attempt = getLastDepthCaptureAttempt();
          assert.ok(attempt !== null, `${tc.name}: diagnostic recorded`);
          assert.equal(attempt.outcome, tc.expectedOutcome, tc.name);
          assert.equal(attempt.targetIssueCode, tc.expectedTargetIssue, tc.name);
          assert.deepEqual(attempt.requestedInstruments, ['NSE_EQ:1412'], tc.name);
        } finally {
          await started.handle.shutdown();
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-05: write failure (EISDIR) does not break HTTP 200 quote, keeps .arm, latches slot, and records WRITE_FAILED then SLOT_ALREADY_CLAIMED', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-05-'));
    const dirAsCapturePath = join(dir, 'agi-depth.json');
    mkdirSync(dirAsCapturePath, { recursive: true }); // targetPath is a directory -> EISDIR
    assert.equal(armDepthCapture(dirAsCapturePath), true);

    let currentEpochMs = Date.parse('2026-11-27T09:56:00.000Z');
    const transport = new SyntheticAgiTransport(() => ({
      status: 200,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00')),
    }));

    const started = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [DHAN_DEPTH_CAPTURE_ENV]: dirAsCapturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport,
      now: () => new Date(currentEpochMs),
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    try {
      const r1 = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(r1.status, 200, 'quote must still succeed despite diagnostic write failure');
      assert.equal(isDepthCaptureArmed(dirAsCapturePath), true, '.arm stays on disk when write fails');
      assert.equal(isDepthCaptureLatched(dirAsCapturePath), true, 'one-shot slot remains latched after failed write');
      const d1 = getLastDepthCaptureAttempt();
      assert.equal(d1?.outcome, 'WRITE_FAILED');
      assert.equal(d1?.writeErrorCode, 'EISDIR');
      assert.equal(d1?.disarmed, false);

      // Advance clock 20 minutes (> 900s freshness threshold) so second quote forces a fresh vendor call
      currentEpochMs += 20 * 60 * 1000;
      const r2 = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(r2.status, 200);
      assert.equal(transport.calls.length, 2);
      const d2 = getLastDepthCaptureAttempt();
      assert.equal(d2?.outcome, 'SLOT_ALREADY_CLAIMED');
    } finally {
      await started.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-06: runMarketDataDaemonCli emits sanitized D-18 startup line ONLY when enabled and never leaks tokens, paths, or labels', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-06-'));
    const secretSentinelPath = join(dir, 'CANARY_PATH_SECRET_999', 'agi-depth.json');
    const secretSentinelLabel = 'CANARY_LABEL_SECRET_888';

    try {
      // Case A: D-18 unset -> exactly one startup stderr line (unchanged default behavior)
      const portA = await allocateFreeLoopbackPort();
      const linesDefault: string[] = [];
      const defaultRun = await runMarketDataDaemonCli({
        env: buildBaseDaemonEnv({
          IIPS_MARKET_DATA_DAEMON_PORT: String(portA),
        }),
        argv: [],
        io: { writeStderr: (line) => linesDefault.push(line) },
      });
      assert.equal(defaultRun.exitCode, 0);
      assert.equal(linesDefault.length, 1, 'default startup must emit only the standard listener line');
      await defaultRun.handle?.shutdown();

      // Case B: D-18 enabled -> emits 2nd sanitized [dhan-depth-capture] startup line with ZERO secrets/paths/labels
      const portB = await allocateFreeLoopbackPort();
      const linesEnabled: string[] = [];
      const enabledEnv = buildBaseDaemonEnv({
        IIPS_MARKET_DATA_DAEMON_PORT: String(portB),
        [DHAN_DEPTH_CAPTURE_ENV]: secretSentinelPath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
        [DHAN_DEPTH_CAPTURE_LABEL_ENV]: secretSentinelLabel,
      });
      const summary = describeDepthCaptureConfig(enabledEnv);
      assert.equal(summary.pathConfigured, true);
      assert.equal(summary.targetState, 'valid');
      assert.equal(summary.targetSegment, 'NSE_EQ');
      assert.equal(summary.targetSecurityId, '1412');

      const enabledRun = await runMarketDataDaemonCli({
        env: enabledEnv,
        argv: [],
        io: { writeStderr: (line) => linesEnabled.push(line) },
      });
      assert.equal(enabledRun.exitCode, 0);
      assert.equal(linesEnabled.length, 2);
      const d18Line = linesEnabled[1]!;
      assert.match(d18Line, /^\[dhan-depth-capture\] startup pathConfigured=true targetState=valid target=NSE_EQ\/1412 targetIssue=NONE/);
      for (const forbidden of [TRANSPORT_TOKEN, 'CANARY_PATH_SECRET_999', secretSentinelLabel, 'vault://']) {
        assert.equal(d18Line.includes(forbidden), false, `startup line must not contain ${forbidden}`);
      }
      await enabledRun.handle?.shutdown();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-07: vendor non-2xx failure bypasses capture and preserves .arm so a subsequent 200 captures cleanly', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-07-'));
    const capturePath = join(dir, 'agi-depth.json');
    assert.equal(armDepthCapture(capturePath), true);

    let failVendor = true;
    const transport = new SyntheticAgiTransport(() => {
      if (failVendor) {
        return { status: 400, bodyText: JSON.stringify({ status: 'failed', remarks: 'synthetic bad request' }) };
      }
      return { status: 200, bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00')) };
    });

    const started = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [DHAN_DEPTH_CAPTURE_ENV]: capturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport,
      now: () => new Date('2026-11-27T09:56:00.000Z'),
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    try {
      const failed = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(failed.status, 502);
      assert.equal(existsSync(capturePath), false);
      assert.equal(isDepthCaptureArmed(capturePath), true, '.arm survives vendor non-2xx');
      assert.equal(getLastDepthCaptureAttempt(), null, 'capture hook is not invoked on non-2xx');

      failVendor = false;
      const recovered = await postAgiQuote(started.diagnostics.baseUrl);
      assert.equal(recovered.status, 200);
      assert.equal(existsSync(capturePath), true);
      assert.equal(isDepthCaptureArmed(capturePath), false);
      assert.equal(getLastDepthCaptureAttempt()?.outcome, 'CAPTURED');
    } finally {
      await started.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('E2E-AGI-08: Windows PowerShell diagnostic scripts, 07-Prepare-DepthCapture.ps1, and D-18 runbook satisfy PS 5.1, no-secret, quoting, and established Windows path invariants', () => {
    const scripts = [
      'scripts/Test-D18EnvironmentAndProcess.ps1',
      'scripts/Test-D18CapturePath.ps1',
      'scripts/Collect-D18DiagnosticEvidence.ps1',
    ];
    for (const rel of scripts) {
      const src = readFileSync(resolve(rel), 'utf8');
      assert.match(src, /#Requires -Version 5\.1/, `${rel} must target PowerShell 5.1`);
      assert.match(src, /Set-StrictMode -Version Latest/, `${rel} must enable strict mode`);
      assert.match(src, /\$ErrorActionPreference = 'Stop'/, `${rel} must set Stop preference`);
      assert.match(src, /Redact-D18Text/, `${rel} must include secret redaction`);
      assert.match(src, /\[string\] \$InstallRoot = 'H:\\IIPS'/, `${rel} must default -InstallRoot to H:\\IIPS`);
      assert.match(src, /Join-Path \$InstallRoot 'runtime'/, `${rel} must derive runtime root H:\\IIPS\\runtime`);
      assert.match(src, /Join-Path \$InstallRoot 'logs'/, `${rel} must derive log root H:\\IIPS\\logs`);
      assert.match(src, /Join-Path \(Join-Path \$RuntimeRoot 'dhan-d18-depth-capture'\) 'agi-depth\.json'/, `${rel} must derive D-18 capture output H:\\IIPS\\runtime\\dhan-d18-depth-capture\\agi-depth.json`);
      assert.match(src, /Test-D18PathInsideRoot/, `${rel} must enforce fail-closed destination separation`);
      assert.equal(src.includes('-AsHashtable'), false, `${rel} must not use PS 6+ -AsHashtable`);
      assert.equal(src.includes('-NoProxy'), false, `${rel} must not use PS 6+ -NoProxy`);
      assert.equal(src.includes('\t'), false, `${rel} must not contain tabs`);
      assert.equal(src.includes('\r\n'), false, `${rel} must use LF line endings`);
      for (const forbidden of ['H:\\IIPS-scripts', 'G:\\', 'H:\\repos', 'H:\\IIPS-runtime', 'git pull']) {
        assert.equal(src.includes(forbidden), false, `${rel} must not reference unestablished path or forbidden command: ${forbidden}`);
      }
    }

    const scriptA = readFileSync(resolve('scripts/Test-D18EnvironmentAndProcess.ps1'), 'utf8');
    assert.match(scriptA, /\[string\] \$ScriptsRoot = ''/, 'Diagnostic A must leave optional -ScriptsRoot empty by default');
    assert.match(scriptA, /Join-Path \$ipdRoot 'windows-setup'/, 'Diagnostic A must inspect authoritative IPD windows-setup scripts');
    assert.match(scriptA, /Join-Path \$InstallRoot 'iips-review-recovered'/, 'Diagnostic A must reference established IRR repo path');

    const scriptC = readFileSync(resolve('scripts/Collect-D18DiagnosticEvidence.ps1'), 'utf8');
    assert.match(scriptC, /\[string\] \$ScriptsRoot = ''/, 'Diagnostic C must leave optional -ScriptsRoot empty by default');
    assert.match(scriptC, /\[string\] \$OutputRoot = ''/, 'Diagnostic C must derive default -OutputRoot from $RuntimeRoot');
    assert.match(scriptC, /Join-Path \$RuntimeRoot 'dhan-d18-diagnostics'/, 'Diagnostic C default evidence destination must be H:\\IIPS\\runtime\\dhan-d18-diagnostics (separate from dhan-d18-depth-capture)');

    const prep07 = readFileSync(resolve('windows-setup/07-Prepare-DepthCapture.ps1'), 'utf8');
    assert.equal(
      prep07.includes("Write-Host '    `$env:IIPS_DHAN_DEPTH_CAPTURE_PATH"),
      false,
      '07-Prepare-DepthCapture.ps1 must not contain the broken single-quoted backticked Write-Host concatenation'
    );
    assert.match(
      prep07,
      /07-Prepare-DepthCapture\.ps1 -Arm -CaptureSegment \{0\} -CaptureSecurityId \{1\} -CapturePath '\{2\}'/,
      '07-Prepare-DepthCapture.ps1 launch instruction must pass explicit AGI/target parameters to -Arm'
    );
    for (const forbidden of ['H:\\IIPS-scripts', 'G:\\', 'H:\\repos', 'H:\\IIPS-runtime', 'git pull']) {
      assert.equal(prep07.includes(forbidden), false, `07-Prepare-DepthCapture.ps1 must not contain: ${forbidden}`);
    }

    const activationDoc = readFileSync(resolve('docs/integration/DHAN-D18-RAW-DEPTH-CAPTURE-ACTIVATION-2026-11-20.md'), 'utf8');
    assert.match(activationDoc, /Set-Location 'H:\\IIPS\\iips-production-market-data\\windows-setup'/, 'D-18 activation doc must use tracked IPD windows-setup directory');
    assert.match(activationDoc, /H:\\IIPS\\runtime\\dhan-d18-depth-capture\\agi-depth\.json/, 'D-18 activation doc must document AGI capture path');
    assert.match(activationDoc, /H:\\IIPS\\runtime\\dhan-d18-diagnostics/, 'D-18 activation doc must document separate diagnostic evidence root');
    for (const forbidden of ['H:\\IIPS-scripts', 'G:\\', 'H:\\repos', 'H:\\IIPS-runtime', 'git pull']) {
      assert.equal(activationDoc.includes(forbidden), false, `D-18 activation doc must not contain: ${forbidden}`);
    }
  });

  it('E2E-AGI-09: W-24 trace headers short-circuit even on a STALE cached quote without calling Dhan, while an untraced request refreshes and captures', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-d18-agi-e2e-09-'));
    const capturePath = join(dir, 'agi-depth.json');
    const statePath = join(dir, 'market-data-state.json');

    // Daemon 1: quote stamped 15:25:00 IST on 2026-11-27 -> under .4 calendar (09:15-15:35 + 15:50-16:00),
    // post-close active-session age at 19:03 IST is 600s + 600s = 1200s (> 900s GOOD, <= 1800s STALE).
    const transport1 = new SyntheticAgiTransport(() => ({
      status: 200,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00')),
    }));
    const daemon1 = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [MARKET_DATA_STATE_PATH_ENV]: statePath,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport1,
      tradingCalendarPath: CALENDAR_V4_PATH,
      now: () => new Date('2026-11-27T09:56:00.000Z'), // 15:26 IST
    });
    assert.equal(daemon1.ok, true);
    if (!daemon1.ok) return;
    try {
      const q1 = await postAgiQuote(daemon1.diagnostics.baseUrl);
      assert.equal(q1.status, 200);
    } finally {
      await daemon1.handle.shutdown();
    }

    // Daemon 2: restarted post-close (19:03 IST = 13:33 UTC) with D-18 armed.
    // Restored cache entry is STALE (1200s active-session age).
    const transport2 = new SyntheticAgiTransport(() => ({
      status: 200,
      bodyText: JSON.stringify(buildAgiRawVendorQuote('27/11/2026 15:25:00', { zeroBook: true })),
    }));
    const daemon2 = await startMarketDataDaemon({
      env: buildBaseDaemonEnv({
        [MARKET_DATA_STATE_PATH_ENV]: statePath,
        [DHAN_DEPTH_CAPTURE_ENV]: capturePath,
        [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: AGI_SEGMENT,
        [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: AGI_DHAN_ID,
      }),
      host: '127.0.0.1',
      port: 0,
      transportToken: TRANSPORT_TOKEN,
      credentialResolver: createSyntheticCredentialResolver(),
      providerTransport: transport2,
      tradingCalendarPath: CALENDAR_V4_PATH,
      now: () => new Date('2026-11-27T13:33:00.000Z'), // 19:03 IST
    });
    assert.equal(daemon2.ok, true);
    if (!daemon2.ok) return;

    try {
      assert.equal(armDepthCapture(capturePath), true);
      const freshBefore = await getAgiFreshness(daemon2.diagnostics.baseUrl);
      assert.equal(freshBefore.cacheState, 'STALE');

      // 1. Traced request short-circuits on cached STALE entry -> HTTP 200, 0 vendor calls, NO capture!
      const traced = await postAgiQuote(daemon2.diagnostics.baseUrl, {
        'X-IIPS-Trace-Version': '1',
        'X-IIPS-Action-Id': '11111111-2222-4333-8444-555555555555',
      });
      assert.equal(traced.status, 200);
      assert.equal(transport2.calls.length, 0, 'W-24 traced quote must short-circuit on cached STALE entry');
      assert.equal(existsSync(capturePath), false, 'traced cache hit must NOT write capture');
      assert.equal(isDepthCaptureArmed(capturePath), true, '.arm stays intact after traced short-circuit');

      // 2. Untraced request on the same STALE entry refreshes through Dhan -> captures agi-depth.json!
      const untraced = await postAgiQuote(daemon2.diagnostics.baseUrl);
      assert.equal(untraced.status, 200);
      assert.equal(transport2.calls.length, 1, 'untraced quote on STALE entry must call Dhan');
      assert.equal(existsSync(capturePath), true, 'untraced vendor refresh must write agi-depth.json');
      assert.equal(isDepthCaptureArmed(capturePath), false, '.arm consumed after capture');
      assert.equal(getLastDepthCaptureAttempt()?.outcome, 'CAPTURED');
    } finally {
      await daemon2.handle.shutdown();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
