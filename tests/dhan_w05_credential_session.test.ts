/**
 * Institutional Investment Platform System (IIPS)
 * W-05 — Credential Read Posture, Bounded Re-read and Authentication Latch
 *
 * Synthetic, deterministic, offline. No vendor call, no Windows host, no real credential.
 *
 * WHAT IS BEING PROVEN (D-2, verbatim from the controlling IRR roadmap):
 *
 *   "POSTURE. Resolve at daemon start after config validation; hold the material only in IPD
 *    process memory; clear on shutdown.
 *    PERMITTED RE-READ TRIGGERS (EXHAUSTIVE): (a) daemon start; (b) crossing the token
 *    `expiresAt` boundary; (c) exactly ONE bounded re-read following an HTTP 401/403 on a
 *    request; (d) explicit operator restart.
 *    PROHIBITED: re-read on any other event; any loop; any re-read keyed on a transient
 *    failure code.
 *    AFTER THE SINGLE RE-READ. If the replacement material is also rejected, the daemon latches
 *    a failed-auth state, performs no further re-reads ... only operator intervention (re-provision
 *    plus restart) clears it."
 *
 *   and W-05's own verification clause:
 *
 *   "Targeted: exactly one re-read on 401/403 and zero on success; a second consecutive 401
 *    performs no third read and latches; expired pre-flight issues no vendor call; no material
 *    in any error, log or serialized diagnostic; a latency assertion that repeated quotes do not
 *    each pay a vault read."
 *
 * The latency assertion is W05-08. It is structural rather than a wall-clock measurement:
 * a synthetic clock cannot make a real DPAPI spawn fast, and the cost this decision exists to
 * remove is a READ, so the assertion is that the read count does not grow with the request
 * count. A wall-clock figure measured here would be a property of the test machine.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import {
  DhanApiClient,
  DhanCredentialRereadNotPermittedError,
  DhanCredentialSessionHolder,
  DhanInstrumentRegistry,
  DhanMarketDataService,
  DhanProviderStateRecorder,
  DhanTransportTimeoutError,
  DhanVaultResolutionError,
  resolveDhanProviderConfig,
  type DhanCredentialMaterial,
  type DhanCredentialResolver,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
  type DhanInstrumentMapping,
  type DhanProviderConfig,
} from '../src/providers/dhan/index.js';

// ── Canaries ────────────────────────────────────────────────────────────────
// Distinct from every other suite's so a leak is attributable.
const CANARY_TOKEN = 'W05_CANARY_ACCESS_TOKEN_77341';
const CANARY_CLIENT = 'W05_CANARY_CLIENT_ID_22806';
const CANARY_TOKEN_REFRESHED = 'W05_CANARY_ACCESS_TOKEN_77341_REFRESHED';
const CANARY_SECRET_REF = 'vault://dhan/local-nonprod/w05-canary-token';
const CANARY_WIN_PATH = 'C:\\Users\\operator\\AppData\\Local\\IIPS\\w05-token.dpapi';
const CANARY_VENDOR_MESSAGE = 'DH-901 Invalid JWT token signature for client 22806';

const ENV: Record<string, string> = {
  IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: CANARY_SECRET_REF,
  IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://dhan/local-nonprod/w05-canary-client-id',
};

const BASE_EPOCH_MS = Date.parse('2026-11-25T09:30:00.000Z');
/**
 * The boundary used by the ONE test that exercises D-2 trigger (b). Tests that advance the clock
 * to defeat the D02 quote cache must not also cross this boundary, or they would measure the
 * boundary trigger instead of the property they name — so those use `LONG_LIFE_EXPIRY_ISO`.
 */
const TOKEN_EXPIRY_MS = Date.parse('2026-11-26T00:00:00.000Z');
const TOKEN_EXPIRY_ISO = new Date(TOKEN_EXPIRY_MS).toISOString();
const LONG_LIFE_EXPIRY_ISO = '2027-01-01T00:00:00.000Z';
/** One day. Defeats the D02 quote cache without approaching a long-life token's expiry. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const ID_INFY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
if (!ID_INFY) throw new Error('failed to construct canonical D114 identity');

const MAPPING: DhanInstrumentMapping = {
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

/**
 * Renders a vendor quote body whose trade time is derived from the harness clock.
 *
 * The timestamp has to track the clock. These tests advance time by a day to defeat the D02
 * quote cache so that each request genuinely reaches the vendor; a FIXED trade time would make
 * the returned quote a day old, and freshness would suppress it as `STALE_DATA_SUPPRESSED`
 * before the credential path could be observed. A real vendor returns a current trade time on
 * every call, so deriving it here is the faithful fixture.
 */
function quoteWire(atMs: number): string {
  // IST is UTC+05:30 and the vendor's wire format is `DD/MM/YYYY HH:mm:ss` (W-06).
  const ist = new Date(atMs + 5.5 * 60 * 60 * 1000);
  const pad = (n: number): string => String(n).padStart(2, '0');
  const stamp =
    `${pad(ist.getUTCDate())}/${pad(ist.getUTCMonth() + 1)}/${ist.getUTCFullYear()} ` +
    `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
  return JSON.stringify({
    status: 'success',
    data: {
      NSE_EQ: {
        '1594': {
          last_price: 1845.5,
          ohlc: { open: 1830, close: 1825, high: 1852, low: 1822 },
          volume: 1450000,
          net_change: 20.5,
          last_trade_time: stamp,
        },
      },
    },
  });
}

// ── Harness ─────────────────────────────────────────────────────────────────

type StepKind =
  | { readonly kind: 'http'; readonly status: number; readonly bodyText: string }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'transport_error' };

/**
 * A scripted send.
 *
 * `persistent: true` replays the step for EVERY send instead of consuming it. The service runs
 * its own W-07 retry ladder, so a one-shot transient is silently recovered by a later attempt
 * and a test built on it would assert nothing. Persistence is what makes a transient
 * observable end-to-end.
 */
type Step = StepKind & { readonly persistent?: boolean };

interface HarnessOptions {
  readonly steps?: readonly Step[];
  /** Material the vault returns. Re-invoked on every read, so a test can change it. */
  readonly resolveImpl?: (readNumber: number) => Promise<DhanCredentialMaterial | null>;
}

function createHarness(options: HarnessOptions = {}) {
  let clockMs = BASE_EPOCH_MS;
  const advanceClock = (deltaMs: number): void => {
    clockMs += deltaMs;
  };

  const cfg = resolveDhanProviderConfig(ENV, new Date(clockMs));

  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);

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

  const queue: Step[] = [...(options.steps ?? [])];
  const requests: DhanHttpRequest[] = [];
  let resolverCalls = 0;

  const defaultResolve = async (readNumber: number): Promise<DhanCredentialMaterial> => {
    // The second read returns rotated material, so a test can tell the reads apart without
    // inspecting a secret. The first read is the start-up read.
    return {
      accessToken: readNumber === 1 ? CANARY_TOKEN : CANARY_TOKEN_REFRESHED,
      clientId: CANARY_CLIENT,
      expiresAt: LONG_LIFE_EXPIRY_ISO,
    };
  };

  const resolver: DhanCredentialResolver = {
    async resolve(): Promise<DhanCredentialMaterial | null> {
      resolverCalls += 1;
      const impl = options.resolveImpl ?? defaultResolve;
      return impl(resolverCalls);
    },
  };

  const transport: DhanHttpTransport = {
    async send(req: DhanHttpRequest): Promise<DhanHttpResponse> {
      requests.push(req);
      const step = queue.shift();
      if (step !== undefined && step.persistent === true) {
        queue.unshift(step);
      }
      if (step === undefined) {
        return { status: 200, bodyText: quoteWire(clockMs) };
      }
      if (step.kind === 'timeout') {
        throw new DhanTransportTimeoutError(CANARY_VENDOR_MESSAGE);
      }
      if (step.kind === 'transport_error') {
        throw new Error(`${CANARY_VENDOR_MESSAGE} ${CANARY_WIN_PATH}`);
      }
      // A scripted 2xx carries no fixed body: it is rendered from the current clock so the
      // quote is always fresh relative to the moment it is served.
      const bodyText = step.status === 200 ? quoteWire(clockMs) : step.bodyText;
      return { status: step.status, bodyText };
    },
  };

  const session = new DhanCredentialSessionHolder({ resolver, now: () => clockMs });

  const client = new DhanApiClient({
    config: cfg.config,
    transport,
    credentialResolver: resolver,
    credentialSession: session,
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
    session,
    requests,
    config: cfg.config,
    sessionDescriptor: () => client.getCredentialSessionDescriptor(),
    getResolverCalls: () => resolverCalls,
    getVendorCalls: () => requests.length,
    clearQueue: () => {
      queue.length = 0;
    },
    /** Every credential header the vendor actually received, in order. */
    sentTokens: () => requests.map((r) => r.headers['access-token']),
    advanceClock,
    clockIso: () => new Date(clockMs).toISOString(),
  };
}

const QUOTE_REQUEST = {
  companyId: 'EQ_INFY_IN',
  securityIdentity: ID_INFY,
  exchangeSegment: 'NSE_EQ' as const,
};

const reject401: Step = { kind: 'http', status: 401, bodyText: '{"errorMessage":"denied"}' };
const reject403: Step = { kind: 'http', status: 403, bodyText: '{"errorMessage":"denied"}' };
/**
 * A vendor acceptance. The body is rendered at send time from the harness clock (see
 * `quoteWire`), so this step only needs to carry the status.
 */
const accept200: Step = { kind: 'http', status: 200, bodyText: '' };

// The D-2 trigger set, asserted as a closed enumeration. A fifth member would be a fifth
// trigger by another name, so the list is pinned rather than merely exercised.
const D2_PERMITTED_READ_REASONS = [
  'SESSION_START',
  'EXPIRES_AT_BOUNDARY',
  'AUTH_REJECTION_REREAD',
] as const;

describe('W-05 — credential read posture, bounded re-read and authentication latch', () => {
  // ── Posture ───────────────────────────────────────────────────────────────

  it('W05-01: constructing a session performs no vault read, and the first request reads exactly once', async () => {
    const h = createHarness({ steps: [accept200] });

    // Construction is pure: a daemon that never serves a quote never touches the vault.
    assert.strictEqual(h.getResolverCalls(), 0, 'building the session must not read the vault');
    assert.strictEqual(h.sessionDescriptor().state, 'EMPTY');
    assert.strictEqual(h.sessionDescriptor().vaultReadCount, 0);
    assert.strictEqual(h.sessionDescriptor().holdsMaterial, false);

    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, true);

    // D-2 trigger (a): daemon start.
    assert.strictEqual(h.getResolverCalls(), 1, 'the first credentialed request is the only read');
    assert.strictEqual(h.getVendorCalls(), 1);
    const descriptor = h.sessionDescriptor();
    assert.strictEqual(descriptor.state, 'HELD');
    assert.strictEqual(descriptor.vaultReadCount, 1);
    assert.strictEqual(descriptor.holdsMaterial, true);
    assert.strictEqual(descriptor.expiresAt, LONG_LIFE_EXPIRY_ISO);
  });

  it('W05-02: a successful request performs zero extra credential reads', async () => {
    const h = createHarness({ steps: [accept200, accept200, accept200] });

    for (let i = 0; i < 3; i += 1) {
      // Distinct cache windows so each request genuinely reaches the vendor.
      h.advanceClock(ONE_DAY_MS);
      const quote = await h.service.getQuote(QUOTE_REQUEST);
      assert.strictEqual(quote.ok, true, `quote ${i} must succeed`);
    }

    assert.strictEqual(h.getVendorCalls(), 3, 'three real vendor interactions');
    assert.strictEqual(h.getResolverCalls(), 1, 'exactly one credential read across all three');
  });

  // ── Trigger (c): the bounded re-read ──────────────────────────────────────

  it('W05-03: exactly one credential re-read follows a single 401/403, and the retry uses the NEW material', async () => {
    const h = createHarness({ steps: [reject401, accept200] });

    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, true, 'the approved re-read recovers the request');

    assert.strictEqual(h.getVendorCalls(), 2, 'the rejection and exactly one retry');
    assert.strictEqual(h.getResolverCalls(), 2, 'the start-up read and exactly one re-read');

    // The retry must carry the replacement credential, not the rejected one — a re-read whose
    // result is not used would be a read with no purpose and would not recover anything.
    assert.deepStrictEqual(
      h.sentTokens(),
      [CANARY_TOKEN, CANARY_TOKEN_REFRESHED],
      'the retry is sent with the material the re-read returned'
    );
    assert.strictEqual(h.sessionDescriptor().state, 'AUTH_REJECTION_OBSERVED');
    assert.strictEqual(h.sessionDescriptor().authLatched, false);
    assert.strictEqual(h.sessionDescriptor().authRejectionBudgetRemaining, false);
  });

  it('W05-04: 403 is treated exactly like 401 (one re-read, one retry)', async () => {
    const h = createHarness({ steps: [reject403, accept200] });
    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, true);
    assert.strictEqual(h.getVendorCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);
    assert.deepStrictEqual(h.sentTokens(), [CANARY_TOKEN, CANARY_TOKEN_REFRESHED]);
  });

  it('W05-05: a second consecutive 401 performs no third read and latches the session', async () => {
    const h = createHarness({ steps: [reject401, reject403] });

    const first = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(first.ok, false);
    if (!first.ok) assert.strictEqual(first.failure.code, 'AUTHENTICATION_FAILURE');

    assert.strictEqual(h.getVendorCalls(), 2, 'no third vendor call');
    assert.strictEqual(h.getResolverCalls(), 2, 'no third credential read');

    const descriptor = h.sessionDescriptor();
    assert.strictEqual(descriptor.authLatched, true);
    assert.strictEqual(descriptor.state, 'AUTH_LATCHED');

    // A later request is refused before either the vault or the vendor is reached.
    const later = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(later.ok, false);
    if (!later.ok) assert.strictEqual(later.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.getVendorCalls(), 2, 'a latched session makes no further vendor calls');
    assert.strictEqual(h.getResolverCalls(), 2, 'a latched session makes no further vault reads');
  });

  it('W05-06: the re-read budget is spent once per process, not once per request', async () => {
    // The distinction matters: a per-request budget would let a caller loop forever by issuing
    // new quotes. This asserts the budget belongs to the SESSION.
    const h = createHarness({ steps: [reject401, reject401, reject401] });

    const first = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(first.ok, false);
    assert.strictEqual(h.getVendorCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);
    assert.strictEqual(h.sessionDescriptor().authLatched, true, 'the second 401 latches');

    // Even though another 401 is queued, it can never be consumed.
    await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(h.getVendorCalls(), 2);
    assert.strictEqual(h.getResolverCalls(), 2);
  });

  it('W05-07: an unbounded re-read is impossible by construction — the holder refuses a second one', async () => {
    const resolver: DhanCredentialResolver = {
      async resolve(): Promise<DhanCredentialMaterial> {
        return { accessToken: CANARY_TOKEN, clientId: CANARY_CLIENT, expiresAt: TOKEN_EXPIRY_ISO };
      },
    };
    const holder = new DhanCredentialSessionHolder({ resolver, now: () => BASE_EPOCH_MS });
    const cfg = resolveDhanProviderConfig(ENV, new Date(BASE_EPOCH_MS)).config;

    // A re-read is not permitted before any rejection has been observed.
    await assert.rejects(
      () => holder.readForTrigger('AUTH_REJECTION_REREAD', cfg),
      DhanCredentialRereadNotPermittedError,
      'no re-read may happen without a live rejection'
    );

    // After one rejection the grant exists and is consumed by exactly one read ...
    assert.strictEqual(holder.consumeAuthRejectionBudget(), true);
    assert.strictEqual(await holder.readForTrigger('AUTH_REJECTION_REREAD', cfg), true);

    // ... and a second read needs a second grant, which the budget never issues.
    await assert.rejects(
      () => holder.readForTrigger('AUTH_REJECTION_REREAD', cfg),
      DhanCredentialRereadNotPermittedError,
      'the single grant authorises exactly one read'
    );

    // The public budget API agrees.
    assert.strictEqual(holder.consumeAuthRejectionBudget(), false);
    assert.strictEqual(holder.consumeAuthRejectionBudget(), false);
  });

  // ── The latency assertion ─────────────────────────────────────────────────

  it('W05-08: LATENCY — repeated quotes do not each pay a vault read', async () => {
    // W-05's verification clause: "a latency assertion that repeated quotes do not each pay a
    // vault read". On Windows a read is a DPAPI process spawn (~200-500 ms), so a flat read
    // count across N requests is the property that makes per-quote cost acceptable. A
    // wall-clock figure would measure this test machine, not the decision.
    const REQUEST_COUNT = 12;
    const h = createHarness({
      steps: Array.from({ length: REQUEST_COUNT }, () => accept200),
    });

    for (let i = 0; i < REQUEST_COUNT; i += 1) {
      h.advanceClock(ONE_DAY_MS);
      const quote = await h.service.getQuote(QUOTE_REQUEST);
      assert.strictEqual(quote.ok, true);
    }

    assert.strictEqual(h.getVendorCalls(), REQUEST_COUNT, 'every request reached the vendor');
    assert.strictEqual(
      h.getResolverCalls(),
      1,
      `${REQUEST_COUNT} vendor-reaching quotes paid exactly one vault read, not ${REQUEST_COUNT}`
    );

    // Stated as the per-request amortised cost the decision is about.
    const readsPerRequest = h.getResolverCalls() / REQUEST_COUNT;
    assert.ok(
      readsPerRequest <= 1 / REQUEST_COUNT,
      `vault reads per request must be at most 1/${REQUEST_COUNT}, got ${readsPerRequest}`
    );
  });

  // ── Trigger (b): the expiresAt boundary ───────────────────────────────────

  it('W05-09: crossing the expiresAt boundary is the only other event that reads the vault', async () => {
    // A token that expires at TOKEN_EXPIRY_MS, so advancing to that instant crosses D-2 (b).
    const h = createHarness({
      steps: [accept200, accept200],
      resolveImpl: async (readNumber) => ({
        accessToken: readNumber === 1 ? CANARY_TOKEN : CANARY_TOKEN_REFRESHED,
        clientId: CANARY_CLIENT,
        expiresAt: TOKEN_EXPIRY_ISO,
      }),
    });

    const before = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(before.ok, true);
    assert.strictEqual(h.getResolverCalls(), 1);

    // Advance to exactly the boundary: `expiresAt` means "not valid at or after this instant".
    // The re-read happens (D-2 trigger (b)) but returns the SAME token, which is now expired, so
    // the local pre-flight refuses and — per D-2 — makes no vendor call. That is the correct
    // outcome for a vault that has not been re-provisioned: the daemon must not spend a vendor
    // request on material it can already see is dead.
    h.advanceClock(TOKEN_EXPIRY_MS - BASE_EPOCH_MS);
    const vendorCallsBefore = h.getVendorCalls();
    const after = await h.service.getQuote(QUOTE_REQUEST);

    assert.strictEqual(h.getResolverCalls(), 2, 'the boundary crossing is D-2 trigger (b)');
    assert.strictEqual(after.ok, false);
    if (!after.ok) assert.strictEqual(after.failure.code, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(
      h.getVendorCalls(),
      vendorCallsBefore,
      'an expired replacement makes no vendor call'
    );
    assert.strictEqual(
      h.sessionDescriptor().authRejectionBudgetRemaining,
      true,
      'a boundary re-read is not an auth rejection and must not spend the 401 budget'
    );
    assert.strictEqual(h.sessionDescriptor().authLatched, false, 'expiry is not a latch');
  });

  it('W05-10: a boundary re-read that returns still-expired material makes NO vendor call', async () => {
    // D-2 expired-vs-invalid + W-05 "expired pre-flight issues no vendor call". The vault keeps
    // returning an already-expired token, so the local pre-flight refuses before egress.
    const expiredIso = new Date(BASE_EPOCH_MS - 60_000).toISOString();
    const h = createHarness({
      steps: [accept200, accept200],
      resolveImpl: async () => ({
        accessToken: CANARY_TOKEN,
        clientId: CANARY_CLIENT,
        expiresAt: expiredIso,
      }),
    });

    const first = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(first.ok, false);
    if (!first.ok) assert.strictEqual(first.failure.code, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(h.getVendorCalls(), 0, 'an expired credential never reaches the vendor');
    assert.strictEqual(h.getResolverCalls(), 1);
  });

  // ── Expired pre-flight (both paths) ───────────────────────────────────────

  it('W05-11: expired pre-flight issues no vendor request and does not consume the auth budget', async () => {
    const expiredIso = new Date(BASE_EPOCH_MS - 1).toISOString();
    const h = createHarness({
      steps: [accept200],
      resolveImpl: async () => ({
        accessToken: CANARY_TOKEN,
        clientId: CANARY_CLIENT,
        expiresAt: expiredIso,
      }),
    });

    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, false);
    if (!quote.ok) assert.strictEqual(quote.failure.code, 'CREDENTIALS_EXPIRED');

    assert.strictEqual(h.getVendorCalls(), 0, 'zero vendor calls');
    assert.strictEqual(h.sessionDescriptor().authLatched, false, 'expiry is not an auth latch');
    assert.strictEqual(h.sessionDescriptor().authRejectionCount, 0);
    assert.strictEqual(
      h.sessionDescriptor().authRejectionBudgetRemaining,
      true,
      'expiry must not spend the single 401 re-read budget'
    );
  });

  it('W05-12: a SecretRef already marked EXPIRED is refused pre-flight with zero reads and zero calls', async () => {
    // The ref-level guard runs before the vault is consulted at all.
    const env = {
      ...ENV,
      IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: '2026-11-24T00:00:00.000Z',
    };
    const cfg = resolveDhanProviderConfig(env, new Date(BASE_EPOCH_MS));
    let reads = 0;
    const session = new DhanCredentialSessionHolder({
      resolver: {
        async resolve() {
          reads += 1;
          return { accessToken: CANARY_TOKEN, clientId: CANARY_CLIENT };
        },
      },
      now: () => BASE_EPOCH_MS,
    });
    const client = new DhanApiClient({
      config: cfg.config,
      transport: {
        async send() {
          throw new Error('the vendor must never be reached');
        },
      },
      credentialSession: session,
      now: () => BASE_EPOCH_MS,
    });

    const resolved = await (client as unknown as {
      resolveReadyCredentials(nowMs: number, force: boolean): Promise<{ ok: boolean; failure?: { code: string } }>;
    }).resolveReadyCredentials(BASE_EPOCH_MS, false);

    assert.strictEqual(resolved.ok, false);
    assert.strictEqual(resolved.failure?.code, 'CREDENTIALS_EXPIRED');
    assert.strictEqual(reads, 0, 'no vault read for a ref that is already expired');
  });

  // ── Latch semantics ───────────────────────────────────────────────────────

  it('W05-13: a latched session refuses reads even when the vault would now succeed', async () => {
    // Operator re-provisioning the token mid-process must NOT recover the daemon: D-2 requires
    // re-provision PLUS restart, so the latch has to outrank fresh material.
    let readNumber = 0;
    const h = createHarness({
      steps: [reject401, reject401],
      resolveImpl: async () => {
        readNumber += 1;
        return {
          accessToken: readNumber === 1 ? CANARY_TOKEN : CANARY_TOKEN_REFRESHED,
          clientId: CANARY_CLIENT,
          expiresAt: LONG_LIFE_EXPIRY_ISO,
        };
      },
    });

    const first = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(first.ok, false);
    assert.strictEqual(h.sessionDescriptor().authLatched, true);

    // The vault is now "fixed", but the process stays latched and makes no further read.
    const before = h.getResolverCalls();
    h.advanceClock(ONE_DAY_MS);
    const later = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(later.ok, false);
    if (!later.ok) assert.strictEqual(later.failure.code, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.getResolverCalls(), before, 'the latch outranks any later read');
    assert.strictEqual(h.sessionDescriptor().authLatched, true);
  });

  it('W05-14: the recorder and the session latch agree, and the recorder still drives provider state', async () => {
    const h = createHarness({ steps: [reject401, reject401] });
    await h.service.getQuote(QUOTE_REQUEST);

    const observed = h.service.getObservedProviderState();
    assert.strictEqual(observed.authLatched, true);
    assert.strictEqual(observed.consecutiveAuthFailures, 2, 'initial rejection plus the retry');
    assert.strictEqual(observed.lastAuthOutcome, 'AUTHENTICATION_FAILURE');
    assert.strictEqual(h.sessionDescriptor().authLatched, true, 'both latches must agree');
  });

  // ── Prohibited triggers ───────────────────────────────────────────────────

  it('W05-15: a transient failure is NOT a re-read trigger (prohibited by D-2)', async () => {
    // One persistent transient per scenario: it is replayed for every send so the service's own
    // W-07 retry ladder exhausts and the failure is observable rather than silently recovering.
    for (const step of [
      { kind: 'timeout', persistent: true },
      { kind: 'http', status: 503, bodyText: '{"error":"unavailable"}', persistent: true },
      { kind: 'http', status: 429, bodyText: '{"error":"throttled"}', persistent: true },
      { kind: 'transport_error', persistent: true },
    ] as const) {
      const h = createHarness({ steps: [step] });
      h.advanceClock(ONE_DAY_MS);
      const quote = await h.service.getQuote(QUOTE_REQUEST);

      assert.strictEqual(
        quote.ok,
        false,
        `${step.kind} must not surface as success (code: ${quote.ok ? 'none' : quote.failure.code})`
      );
      assert.strictEqual(
        h.getResolverCalls(),
        1,
        `${step.kind} must never cause a credential re-read — D-2 prohibits it`
      );
      assert.strictEqual(h.sessionDescriptor().authLatched, false, 'transients do not latch');
      assert.strictEqual(h.sessionDescriptor().authRejectionCount, 0);
      assert.strictEqual(
        h.sessionDescriptor().authRejectionBudgetRemaining,
        true,
        'transients must not spend the 401 budget'
      );
    }
  });

  it('W05-16: a recovery request after a transient failure still reuses the session', async () => {
    const h = createHarness({ steps: [{ kind: 'timeout', persistent: true }] });

    const failed = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(failed.ok, false);
    assert.strictEqual(h.getResolverCalls(), 1, 'the transient failure caused no re-read');

    // Clear the persistent transient so the next request can succeed from the held session.
    h.clearQueue();
    h.advanceClock(ONE_DAY_MS);
    const recovered = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(recovered.ok, true);
    // The credential invariant: recovering from a transient costs NO vault read. The exact
    // vendor-call count belongs to the W-07 ladder, not to W-05, so it is not pinned here.
    assert.strictEqual(h.getResolverCalls(), 1, 'the recovery reuses the held session');
  });

  // ── Verify-connection (D-7 §3 rule 2) ────────────────────────────────────

  it('W05-17: V2 verification never re-reads the credential (D-7 §3 rule 2)', async () => {
    const h = createHarness({ steps: [accept200] });

    // A cold session: the probe performs the start-up read and one vendor call.
    const probe = await h.service.verifyConnection();
    assert.strictEqual(probe.outcome, 'VERIFIED_VENDOR_ACCEPTED');
    assert.strictEqual(h.getResolverCalls(), 1);
    assert.strictEqual(h.getVendorCalls(), 1);

    // A warm session: a second probe is served from memory.
    h.advanceClock(60_000);
    const second = await h.service.verifyConnection();
    assert.strictEqual(second.outcome, 'VERIFIED_VENDOR_ACCEPTED');
    assert.strictEqual(h.getResolverCalls(), 1, 'V2 adds no re-read trigger');
    assert.strictEqual(h.getVendorCalls(), 2);
  });

  it('W05-18: a 401 on verification does not spend the market-data re-read budget', async () => {
    // D-7 makes V2 narrower than a market-data rejection on purpose. If the probe consumed the
    // budget, a subsequent quote would be unable to re-read and would latch on its first 401.
    const h = createHarness({ steps: [reject401, reject401, accept200] });

    const probe = await h.service.verifyConnection();
    assert.strictEqual(probe.outcome, 'AUTH_REJECTED');
    assert.strictEqual(h.getVendorCalls(), 1, 'V2 is exactly one request');
    assert.strictEqual(h.getResolverCalls(), 1, 'V2 performs no re-read');
    assert.strictEqual(
      h.sessionDescriptor().authRejectionBudgetRemaining,
      true,
      'the probe must not consume the quote path budget'
    );

    // The quote path still has its single re-read available.
    h.advanceClock(60_000);
    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, true, 'the quote re-read and recovered');
    assert.strictEqual(h.getResolverCalls(), 2, 'the quote spent the single re-read');
    assert.strictEqual(h.sessionDescriptor().authRejectionBudgetRemaining, false);
  });

  // ── Shutdown ──────────────────────────────────────────────────────────────

  it('W05-19: clear() drops the held material but cannot be used to recover from a latch', async () => {
    const h = createHarness({ steps: [reject401, reject401] });
    await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(h.sessionDescriptor().holdsMaterial, true);
    assert.strictEqual(h.sessionDescriptor().authLatched, true);

    h.session.clear();

    const descriptor = h.sessionDescriptor();
    assert.strictEqual(descriptor.holdsMaterial, false, 'shutdown drops the reference');
    assert.strictEqual(h.session.currentMaterial(), null);
    // Clearing must not be a back door out of the latch.
    assert.strictEqual(descriptor.authLatched, true, 'a restart is the only way back');
    assert.strictEqual(descriptor.state, 'AUTH_LATCHED');
  });

  it('W05-20: a healthy session clears its material on shutdown without latching', async () => {
    const h = createHarness({ steps: [accept200] });
    await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(h.sessionDescriptor().state, 'HELD');

    h.session.clear();
    const descriptor = h.sessionDescriptor();
    assert.strictEqual(descriptor.holdsMaterial, false);
    assert.strictEqual(descriptor.authLatched, false);
    assert.strictEqual(descriptor.state, 'EMPTY');
    // The read counter is evidence and survives shutdown; clearing is not a reset.
    assert.strictEqual(descriptor.vaultReadCount, 1);
  });

  // ── Zero-plaintext discipline ─────────────────────────────────────────────

  it('W05-21: the session descriptor and every error carry no credential material or location', async () => {
    const h = createHarness({ steps: [reject401, reject401] });
    const quote = await h.service.getQuote(QUOTE_REQUEST);

    const surfaces = JSON.stringify({
      descriptor: h.sessionDescriptor(),
      observed: h.service.getObservedProviderState(),
      failure: quote.ok ? null : quote.failure,
      health: await h.service.health(),
    });

    for (const forbidden of [
      CANARY_TOKEN,
      CANARY_TOKEN_REFRESHED,
      CANARY_CLIENT,
      CANARY_SECRET_REF,
      'vault://',
      CANARY_WIN_PATH,
      'AppData',
      CANARY_VENDOR_MESSAGE,
      'DH-901',
      'powershell',
    ]) {
      assert.ok(
        !surfaces.includes(forbidden),
        `a disclosure-safe surface leaked '${forbidden}': ${surfaces}`
      );
    }
  });

  it('W05-22: a resolver throw is mapped to a governed code and its message is not echoed', async () => {
    const h = createHarness({
      resolveImpl: async () => {
        throw new DhanVaultResolutionError(
          'BACKEND_FAILURE',
          'CREDENTIALS_UNAVAILABLE',
          `Child process failed for ${CANARY_WIN_PATH} using ${CANARY_SECRET_REF}`
        );
      },
    });

    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, false);
    if (!quote.ok) {
      assert.strictEqual(quote.failure.code, 'CREDENTIALS_UNAVAILABLE');
      assert.ok(!JSON.stringify(quote).includes(CANARY_WIN_PATH));
      assert.ok(!JSON.stringify(quote).includes(CANARY_SECRET_REF));
    }
    assert.strictEqual(h.getVendorCalls(), 0);
  });

  // ── Contract pins ─────────────────────────────────────────────────────────

  it('W05-23: the D-2 trigger set is closed at exactly four, and the holder exposes no fifth', () => {
    assert.deepStrictEqual(
      [...D2_PERMITTED_READ_REASONS],
      ['SESSION_START', 'EXPIRES_AT_BOUNDARY', 'AUTH_REJECTION_REREAD'],
      'trigger (d), operator restart, is realised by process lifetime and has no runtime member'
    );

    // No public API discards held material on demand to force a read; `clear()` is for shutdown
    // and does not reset the read counter. `currentState` is TypeScript-private and therefore
    // still present on the prototype at runtime, so it is excluded explicitly rather than
    // silently tolerated: if a new PUBLIC method appears, this assertion fails and the new
    // surface has to justify itself against D-2's closed trigger set.
    const surface = Object.getOwnPropertyNames(DhanCredentialSessionHolder.prototype)
      .filter((name) => name !== 'currentState' && name !== 'readInFlight')
      .sort();
    assert.deepStrictEqual(surface, [
      'clear',
      'constructor',
      'consumeAuthRejectionBudget',
      'currentMaterial',
      'decideForRequest',
      'describe',
      'isAuthLatched',
      'latchAuthFailure',
      'readForTrigger',
    ]);
  });

  it('W05-24: concurrent cold-start requests share a single read', async () => {
    // Coalescing matters in production: a burst on a cold daemon must not spawn one DPAPI read
    // per request. The holder serialises readers and lets the first read serve the rest.
    let reads = 0;
    const resolver: DhanCredentialResolver = {
      async resolve(): Promise<DhanCredentialMaterial> {
        reads += 1;
        // Yield, so a naive implementation would let every waiter read.
        await new Promise<void>((r) => setImmediate(r));
        return { accessToken: CANARY_TOKEN, clientId: CANARY_CLIENT, expiresAt: TOKEN_EXPIRY_ISO };
      },
    };
    const holder = new DhanCredentialSessionHolder({ resolver, now: () => BASE_EPOCH_MS });
    const cfg: DhanProviderConfig = resolveDhanProviderConfig(ENV, new Date(BASE_EPOCH_MS)).config;

    const decisions = [1, 2, 3, 4].map(() => holder.decideForRequest());
    assert.ok(decisions.every((d) => d.readReason === 'SESSION_START'));

    const results = await Promise.all(
      decisions.map((d) => holder.readForTrigger(d.readReason!, cfg))
    );

    assert.deepStrictEqual(results, [true, true, true, true]);
    assert.strictEqual(reads, 1, 'four concurrent cold-start readers caused exactly one read');
  });

  it('W05-25: the state recorder is untouched by session mechanics that are not vendor outcomes', async () => {
    // A read that returns nothing is a local outcome; it must not be recorded as an auth event.
    const h = createHarness({
      resolveImpl: async () => null,
    });
    const quote = await h.service.getQuote(QUOTE_REQUEST);
    assert.strictEqual(quote.ok, false);
    if (!quote.ok) assert.strictEqual(quote.failure.code, 'CREDENTIALS_UNAVAILABLE');

    const observed = h.service.getObservedProviderState();
    assert.strictEqual(observed.authLatched, false);
    assert.strictEqual(observed.consecutiveAuthFailures, 0);
    assert.strictEqual(observed.lastAuthOutcome, 'CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(h.sessionDescriptor().authRejectionBudgetRemaining, true);
    assert.strictEqual(h.getVendorCalls(), 0);
  });
});
