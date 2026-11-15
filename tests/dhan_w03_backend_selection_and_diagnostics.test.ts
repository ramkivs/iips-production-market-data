/**
 * W-03 — Daemon backend selection and honest egress diagnostics: targeted verification.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-03
 * Decision consumed: D-7 (docs/integration/DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md)
 * Depends on: W-02 (`WindowsDpapiHostVaultBackend`, awaited `probeReadiness()`)
 *
 * WHY THIS SUITE EXISTS
 * Before W-03 the vault backend was hard-coded and readiness was read synchronously. Two silent
 * failures followed from that: an operator had no way to select the DPAPI backend at all, and a
 * provisioned host would have reported "not ready" forever because startup never awaited the probe.
 * Both are honesty defects, not crashes, so neither would be caught by any existing suite.
 *
 * Coverage map (roadmap W-03 acceptance):
 *   1 — unknown selector refuses startup, without echoing the value
 *   2 — `disabled` remains the default and reports DISABLED_PRE_ACCESS
 *   3 — `windows-dpapi` with a ready backend reports IPD_SERVER_HTTPS
 *   4 — startup AWAITS probeReadiness() before publishing readiness or enabling egress
 *   5 — diagnostics and the startup line carry backend id, backend readiness, egress mode,
 *       credential-readiness code and the D-7 provider state
 *   6 — no `vault://`, filesystem path, credential or secret value on any surface
 *   7 — describeDhanConfig publishes no key paths
 *   8 — W-02 security posture intact: fail-closed, no egress without a supported verdict
 *   9 — provider-state mapping (D-7 §2) cannot claim vendor evidence it does not have
 *
 * Every test is offline: no Dhan request, no PowerShell, no real credential.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DHAN_ENV_KEYS,
  DHAN_PROVIDER_STATE_LADDER,
  DHAN_PROVIDER_STATES,
  DHAN_VAULT_BACKEND_DISABLED,
  DHAN_VAULT_BACKEND_ENV,
  DHAN_VAULT_BACKEND_SELECTORS,
  DHAN_VAULT_BACKEND_WINDOWS_DPAPI,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
  UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID,
  describeDhanConfig,
  deriveDhanProviderState,
  dhanProviderStateRank,
  formatDaemonStartupLine,
  isVendorEvidencedProviderState,
  parseDhanVaultBackendSelector,
  resolveDhanProviderConfig,
  runMarketDataDaemonCli,
  startMarketDataDaemon,
  type DhanProviderState,
  type LocalHostVaultBackendReadiness,
  type LocalHostVaultSecretBackend,
  type MarketDataDaemonHandle,
  type LocalHostVaultSecretRecord,
  type MarketDataDaemonStartupOutcome,
} from '../src/providers/dhan/index.js';
import * as dhanServerPublic from '../src/providers/dhan/package.js';

const TOKEN = 'w03-local-transport-secret';
const FAKE_BACKEND_ID = 'W03_FAKE_HOST_VAULT';
const ACCESS_VALUE = 'W03_SYNTHETIC_ACCESS_TOKEN_VALUE';
const CLIENT_VALUE = 'W03_SYNTHETIC_CLIENT_ID_VALUE';

const CONFIGURED_ENV: Readonly<Record<string, string>> = {
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/w03-nonprod/client-id',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/w03-nonprod/access-token',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
};

function readyReadiness(ready: boolean): LocalHostVaultBackendReadiness {
  return {
    backendId: FAKE_BACKEND_ID,
    liveResolutionSupported: ready,
    prerequisiteSummary: ready
      ? 'Synthetic host vault probe succeeded.'
      : 'Synthetic host vault probe did not establish readiness.',
  };
}

interface FakeBackendOptions {
  /** What the synchronous verdict claims. Deliberately independent of the probe. */
  readonly syncReady?: boolean;
  /** What the awaited probe reports. */
  readonly probeReady?: boolean;
  /** When set, the probe stays pending until the returned release function is called. */
  readonly gateProbe?: boolean;
  /** When true the probe rejects instead of resolving. */
  readonly throwOnProbe?: boolean;
  /** Omit probeReadiness entirely to model a Stage-1 synchronous backend. */
  readonly omitProbe?: boolean;
}

interface FakeBackend {
  readonly backend: LocalHostVaultSecretBackend;
  readonly probeCalls: () => number;
  readonly release: () => void;
}

function makeFakeBackend(options: FakeBackendOptions = {}): FakeBackend {
  const syncReady = options.syncReady ?? true;
  const probeReady = options.probeReady ?? true;
  let probeCalls = 0;
  let release: () => void = () => {};

  const backend: LocalHostVaultSecretBackend = {
    backendId: FAKE_BACKEND_ID,
    describeReadiness: () => readyReadiness(syncReady),
    readSecret: async (): Promise<LocalHostVaultSecretRecord | null> => null,
  };

  if (options.omitProbe !== true) {
    backend.probeReadiness = async (): Promise<LocalHostVaultBackendReadiness> => {
      probeCalls += 1;
      if (options.gateProbe === true) {
        await new Promise<void>((resolveGate) => {
          release = resolveGate;
        });
      }
      if (options.throwOnProbe === true) throw new Error('probe exploded');
      return readyReadiness(probeReady);
    };
  }

  return { backend, probeCalls: () => probeCalls, release: () => release() };
}

/**
 * Live handles opened by a test, closed after it. A daemon left listening would keep the test
 * process alive, turning any regression into a hang instead of a failure — so cleanup is registered
 * before the assertions run, not after them.
 */
const OPEN_HANDLES: MarketDataDaemonHandle[] = [];

async function startTracked(startup: Promise<MarketDataDaemonStartupOutcome>): Promise<MarketDataDaemonStartupOutcome> {
  const outcome = await startup;
  if (outcome.ok) OPEN_HANDLES.push(outcome.handle);
  return outcome;
}

afterEach(async () => {
  for (const handle of OPEN_HANDLES.splice(0)) {
    await handle.shutdown();
  }
});

/** Diagnostic-shaped sweep: every surface an operator or IRR could read. */
function surfaces(outcome: MarketDataDaemonStartupOutcome): string[] {
  assert.strictEqual(outcome.ok, true);
  if (!outcome.ok) return [];
  return [formatDaemonStartupLine(outcome.diagnostics), JSON.stringify(outcome.diagnostics)];
}

describe('W-03 — vault backend selector', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Selector validation
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-01: the selector is an exact allow-list, and absent/blank falls back to disabled', () => {
    assert.deepEqual([...DHAN_VAULT_BACKEND_SELECTORS], [DHAN_VAULT_BACKEND_DISABLED, DHAN_VAULT_BACKEND_WINDOWS_DPAPI]);
    assert.strictEqual(DHAN_VAULT_BACKEND_ENV, 'IIPS_DHAN_VAULT_BACKEND');

    // Absent or blank is the governed default: an unset environment can never select a live store.
    assert.strictEqual(parseDhanVaultBackendSelector(undefined), 'disabled');
    assert.strictEqual(parseDhanVaultBackendSelector(''), 'disabled');
    assert.strictEqual(parseDhanVaultBackendSelector('   '), 'disabled');
    assert.strictEqual(parseDhanVaultBackendSelector('disabled'), 'disabled');
    assert.strictEqual(parseDhanVaultBackendSelector('  disabled  '), 'disabled');
    assert.strictEqual(parseDhanVaultBackendSelector('windows-dpapi'), 'windows-dpapi');

    // Everything else is refused, including case variants: an allow-list, not a fuzzy parse.
    for (const refused of ['Disabled', 'DISABLED', 'WINDOWS-DPAPI', 'dpapi', 'windows_dpapi',
      'windows', 'enabled', 'true', '1', 'disabled,windows-dpapi', 'windows-dpapi ']) {
      const verdict = parseDhanVaultBackendSelector(refused);
      if (refused === 'windows-dpapi ') {
        assert.strictEqual(verdict, 'windows-dpapi', 'trailing whitespace is trimmed before matching');
        continue;
      }
      assert.strictEqual(verdict, null, `${refused} must not be accepted`);
    }
  });

  it('W-03-02: an unknown selector refuses startup at validate, without echoing the value', async () => {
    const SECRET_LOOKING = 'w03-unknown-selector-DO-NOT-ECHO-9f13';
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN,
        [DHAN_VAULT_BACKEND_ENV]: SECRET_LOOKING,
      },
      port: 0,
      })
    );
    assert.strictEqual(outcome.ok, false);
    if (outcome.ok) return;
    assert.strictEqual(outcome.phase, 'validate');
    assert.strictEqual(outcome.code, 'VAULT_BACKEND_NOT_ALLOWED');
    assert.ok(!outcome.error.includes(SECRET_LOOKING), 'the offending value must never be echoed');
    assert.ok(!outcome.error.includes(TOKEN));
    assert.match(outcome.error, /disabled/);
    assert.match(outcome.error, /windows-dpapi/);
  });

  it('W-03-03: the selector is refused before any vault, config or socket work', async () => {
    // A malformed SecretRef would normally fail later at configure; the selector must win, proving
    // the check runs before configuration resolution and before any listener is opened.
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN,
        [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi-please',
        [DHAN_ENV_KEYS.clientIdSecretPath]: 'RAW_CLIENT_SECRET_DO_NOT_ECHO',
      },
      port: 0,
      })
    );
    assert.strictEqual(outcome.ok, false);
    if (!outcome.ok) assert.strictEqual(outcome.code, 'VAULT_BACKEND_NOT_ALLOWED');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. `disabled` remains the default
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-04: default `disabled` composes DisabledWindowsHostVaultBackend and no vendor egress', async () => {
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN },
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendSelector, 'disabled');
      assert.strictEqual(outcome.diagnostics.vaultBackendId, UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID);
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'NOT_READY');
      assert.strictEqual(outcome.diagnostics.liveCredentialResolutionSupported, false);
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      // Local vault readiness is separate from vendor connectivity, and neither is vendor-evidenced.
      assert.strictEqual(outcome.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.strictEqual(outcome.diagnostics.providerState, 'UNCONFIGURED');
      assert.strictEqual(outcome.diagnostics.credentialReadinessCode, 'CREDENTIALS_UNAVAILABLE');
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-05: an explicitly disabled selector is identical to the default', async () => {
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, [DHAN_VAULT_BACKEND_ENV]: 'disabled' },
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendSelector, 'disabled');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
    } finally {
      // handle closed by afterEach
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. `windows-dpapi` with a ready backend enables the governed egress transport
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-06: `windows-dpapi` with a ready backend reports IPD_SERVER_HTTPS', async () => {
    const second = makeFakeBackend({ probeReady: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: second.backend, // the "fake backend" injected through the documented seam
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendSelector, 'windows-dpapi');
      assert.strictEqual(outcome.diagnostics.vaultBackendId, FAKE_BACKEND_ID);
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'READY');
      assert.strictEqual(outcome.diagnostics.liveCredentialResolutionSupported, true);
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'IPD_SERVER_HTTPS');
      assert.strictEqual(outcome.diagnostics.credentialReadinessCode, 'CONFIGURED');
      // Credentials resolved locally is the ceiling at startup: no vendor call has happened.
      assert.strictEqual(outcome.diagnostics.providerState, 'CREDENTIALS_RESOLVED');
      assert.strictEqual(outcome.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.strictEqual(second.probeCalls(), 1);
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-07: `windows-dpapi` without usable configuration still refuses vendor egress', async () => {
    // Backend ready, but no SecretRefs: egress must stay off. Readiness alone is not authorization.
    const fake = makeFakeBackend({ probeReady: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'READY');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      assert.strictEqual(outcome.diagnostics.credentialReadinessCode, 'CREDENTIALS_UNAVAILABLE');
      assert.strictEqual(outcome.diagnostics.providerState, 'UNCONFIGURED');
    } finally {
      // handle closed by afterEach
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Startup awaits the probe
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-08: startup waits for probeReadiness() before publishing readiness or enabling egress', async () => {
    // The synchronous verdict says "not ready"; only the awaiting probe can say otherwise. If
    // startup used describeBackendReadiness() this daemon would report DISABLED_PRE_ACCESS.
    const fake = makeFakeBackend({ syncReady: false, probeReady: true, gateProbe: true });
    let settled = false;
    const startup = startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    startup.then(() => {
      settled = true;
    });

    // Let the event loop run: the daemon must still be blocked on the probe.
    await new Promise<void>((resolveTick) => setImmediate(resolveTick));
    await new Promise<void>((resolveTick) => setImmediate(resolveTick));
    assert.strictEqual(fake.probeCalls(), 1, 'startup must call probeReadiness()');
    assert.strictEqual(settled, false, 'startup must not publish readiness before the probe answers');

    fake.release();
    const outcome = await startup;
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'READY');
      assert.strictEqual(outcome.diagnostics.liveCredentialResolutionSupported, true);
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'IPD_SERVER_HTTPS');
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-09: a probe that reports "not ready" wins over a synchronous "ready"', async () => {
    // The reverse lie: a stale synchronous verdict must not open egress when the probe disagrees.
    const fake = makeFakeBackend({ syncReady: true, probeReady: false });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'NOT_READY');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      assert.strictEqual(outcome.diagnostics.providerState, 'CONFIGURED');
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-10: a throwing probe fails closed instead of crashing startup or enabling egress', async () => {
    const fake = makeFakeBackend({ throwOnProbe: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true, 'a probe failure is a readiness verdict, not a startup failure');
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'NOT_READY');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      assert.ok(!outcome.diagnostics.vaultBackendReadinessDetail.includes('exploded'), 'no thrown text is republished');
      assert.ok(!formatDaemonStartupLine(outcome.diagnostics).includes('exploded'));
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-11: a backend without probeReadiness keeps the Stage-1 synchronous behaviour', async () => {
    const fake = makeFakeBackend({ omitProbe: true, syncReady: false });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'NOT_READY');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
    } finally {
      // handle closed by afterEach
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Diagnostics carry the W-03 fields on both surfaces
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-12: the startup line carries backend id, readiness, egress, credential code and provider state', async () => {
    const fake = makeFakeBackend({ probeReady: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      const line = formatDaemonStartupLine(outcome.diagnostics);
      assert.match(line, /\[ipd-market-data-daemon\] listening on http:\/\/127\.0\.0\.1:\d+/);
      assert.match(line, /providerReadiness=CREDENTIAL_REFERENCES_CONFIGURED/);
      assert.match(line, new RegExp(`vaultBackend=${FAKE_BACKEND_ID}`));
      assert.match(line, /vaultBackendSelector=windows-dpapi/);
      assert.match(line, /vaultBackendReadiness=READY/);
      assert.match(line, /liveCredentialResolution=true/);
      assert.match(line, /credentialReadiness=CONFIGURED/);
      assert.match(line, /providerState=CREDENTIALS_RESOLVED/);
      assert.match(line, /vendorEgress=IPD_SERVER_HTTPS/);
      assert.match(line, /qualifiedMappings=\d+/);

      // The same five facts are structured, not only formatted.
      const d = outcome.diagnostics;
      assert.strictEqual(d.vaultBackendId, FAKE_BACKEND_ID);
      assert.strictEqual(d.vaultBackendReadiness, 'READY');
      assert.strictEqual(d.vendorEgressMode, 'IPD_SERVER_HTTPS');
      assert.strictEqual(d.credentialReadinessCode, 'CONFIGURED');
      assert.strictEqual(d.providerState, 'CREDENTIALS_RESOLVED');
      assert.ok((DHAN_PROVIDER_STATES as readonly string[]).includes(d.providerState));
      assert.ok(!isVendorEvidencedProviderState(d.providerState), 'startup cannot claim vendor evidence');
    } finally {
      // handle closed by afterEach
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. No disclosure on any surface
  // ─────────────────────────────────────────────────────────────────────────────

  it('W-03-13: no surface discloses vault references, paths, carriers, credentials or tokens', async () => {
    const carrierDirectory = 'H:\\IIPS\\runtime\\w03-carriers';
    const fake = makeFakeBackend({ probeReady: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
      vaultBackend: fake.backend,
      vaultCarrierDirectory: carrierDirectory,
      port: 0,
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      securityMaster: undefined,
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      for (const surface of [formatDaemonStartupLine(outcome.diagnostics), JSON.stringify(outcome.diagnostics)]) {
        assert.ok(!surface.includes('vault://'), 'no vault reference may be published');
        assert.ok(!surface.includes(carrierDirectory), 'no carrier location may be published');
        assert.ok(!surface.includes('w03-carriers'));
        assert.ok(!surface.includes(TOKEN), 'the transport token must never appear');
        assert.ok(!surface.includes(ACCESS_VALUE));
        assert.ok(!surface.includes(CLIENT_VALUE));
        assert.ok(!surface.includes('client-id'), 'not even a SecretRef leaf name');
        assert.ok(!surface.includes('access-token'));
      }
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-13b: a backend whose own summary locates the store cannot leak it through diagnostics', async () => {
    // The seam is deliberately abused here: a backend that answers with a path and a vault reference.
    // Diagnostics must still not become a disclosure channel.
    const leaky: LocalHostVaultSecretBackend = {
      backendId: FAKE_BACKEND_ID,
      describeReadiness: () => readyReadiness(true),
      readSecret: async () => null,
      probeReadiness: async () => ({
        backendId: FAKE_BACKEND_ID,
        liveResolutionSupported: true,
        prerequisiteSummary: 'carriers readable at H:\\IIPS\\runtime\\dhan-secrets via vault://dhan/client-id',
      }),
    };
    const outcome = await startTracked(
      startMarketDataDaemon({
        env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, ...CONFIGURED_ENV, [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi' },
        vaultBackend: leaky,
        port: 0,
        now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      const detail = outcome.diagnostics.vaultBackendReadinessDetail;
      assert.ok(!detail.includes('vault://'));
      assert.ok(!detail.includes('H:\\IIPS'));
      assert.ok(!detail.includes('dhan-secrets'));
      assert.match(detail, /withheld/);
      // Readiness itself is still reported honestly: the verdict is not the disclosure.
      assert.strictEqual(outcome.diagnostics.vaultBackendReadiness, 'READY');
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-14: describeDhanConfig publishes no key paths, only configured/not-configured and provider', () => {
    const resolution = resolveDhanProviderConfig(CONFIGURED_ENV, new Date('2026-11-12T06:30:00.000Z'));
    assert.strictEqual(resolution.ok, true);
    const described = describeDhanConfig(resolution.config);
    const serialized = JSON.stringify(described);

    assert.strictEqual(described['accessTokenKeyPath'], undefined);
    assert.strictEqual(described['clientIdKeyPath'], undefined);
    assert.strictEqual(described['accessTokenRefConfigured'], 'YES');
    assert.strictEqual(described['clientIdRefConfigured'], 'YES');
    assert.strictEqual(described['vaultProvider'], 'LOCAL_MOCK_VAULT');
    assert.ok(!serialized.includes('vault://'));
    assert.ok(!serialized.includes('client-id'));
    assert.ok(!serialized.includes('access-token'));

    // Absent configuration reports absence, not a fabricated path.
    const empty = describeDhanConfig(resolveDhanProviderConfig({}).config);
    assert.strictEqual(empty['accessTokenRefConfigured'], 'NO');
    assert.strictEqual(empty['clientIdRefConfigured'], 'NO');
    assert.strictEqual(empty['vaultProvider'], 'UNCONFIGURED');
  });
});

describe('W-03 — D-7 provider state mapping', () => {
  it('W-03-15: the vocabulary is exactly D-7’s eight states, ladder first', () => {
    assert.deepEqual([...DHAN_PROVIDER_STATES], [
      'UNCONFIGURED',
      'CONFIGURED',
      'CREDENTIALS_RESOLVED',
      'AUTHENTICATED',
      'OPERATIONAL',
      'EXPIRED',
      'DEGRADED',
      'UNAVAILABLE',
    ]);
    assert.deepEqual([...DHAN_PROVIDER_STATE_LADDER], [
      'UNCONFIGURED',
      'CONFIGURED',
      'CREDENTIALS_RESOLVED',
      'AUTHENTICATED',
      'OPERATIONAL',
    ]);
    assert.strictEqual(dhanProviderStateRank('CONFIGURED'), 1);
    assert.strictEqual(dhanProviderStateRank('DEGRADED'), -1, 'off-ladder states are not ranked');
  });

  it('W-03-16: local evidence alone can never reach AUTHENTICATED or OPERATIONAL', () => {
    const localOnly: ReadonlyArray<Partial<Parameters<typeof deriveDhanProviderState>[0]>> = [
      { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED' },
      { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED', marketDataServed: true },
      { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'NOT_PROBED', marketDataServed: true },
    ];
    for (const evidence of localOnly) {
      const state = deriveDhanProviderState({
        config: 'CREDENTIAL_REFERENCES_CONFIGURED',
        vaultReadiness: 'SUPPORTED',
        ...evidence,
      } as Parameters<typeof deriveDhanProviderState>[0]);
      assert.ok(!isVendorEvidencedProviderState(state), `${JSON.stringify(evidence)} must not imply vendor evidence`);
    }
  });

  it('W-03-17: each observation maps to the least capable applicable state', () => {
    const cases: ReadonlyArray<[Parameters<typeof deriveDhanProviderState>[0], DhanProviderState]> = [
      [{ config: 'ABSENT', vaultReadiness: 'NOT_SUPPORTED' }, 'UNCONFIGURED'],
      [{ config: 'ABSENT', vaultReadiness: 'SUPPORTED' }, 'UNCONFIGURED'],
      [{ config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'NOT_SUPPORTED' }, 'CONFIGURED'],
      [{ config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'NOT_PROBED' }, 'CONFIGURED'],
      [{ config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED' }, 'CREDENTIALS_RESOLVED'],
      [{ config: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE', vaultReadiness: 'NOT_SUPPORTED' }, 'UNCONFIGURED'],
      [
        { config: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE', vaultReadiness: 'SUPPORTED', credentialsExpired: true },
        'EXPIRED',
      ],
      [
        { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED', lastVendorOutcome: 'ACCEPTED' },
        'AUTHENTICATED',
      ],
      [
        {
          config: 'CREDENTIAL_REFERENCES_CONFIGURED',
          vaultReadiness: 'SUPPORTED',
          lastVendorOutcome: 'ACCEPTED',
          marketDataServed: true,
        },
        'OPERATIONAL',
      ],
      [
        { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED', lastVendorOutcome: 'AUTH_REJECTED' },
        'DEGRADED',
      ],
      [
        { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED', lastVendorOutcome: 'TRANSPORT_FAILED' },
        'DEGRADED',
      ],
      [
        { config: 'CREDENTIAL_REFERENCES_CONFIGURED', vaultReadiness: 'SUPPORTED', lastVendorOutcome: 'VENDOR_FAILED' },
        'DEGRADED',
      ],
    ];
    for (const [evidence, expected] of cases) {
      assert.strictEqual(deriveDhanProviderState(evidence), expected, JSON.stringify(evidence));
    }
  });

  it('W-03-18: contradictory or unusable evidence resolves down, never up', () => {
    // A vendor "accepted" claim without a locally supported store is contradictory → least capable.
    assert.strictEqual(
      deriveDhanProviderState({
        config: 'CREDENTIAL_REFERENCES_CONFIGURED',
        vaultReadiness: 'NOT_SUPPORTED',
        lastVendorOutcome: 'ACCEPTED',
      }),
      'CONFIGURED'
    );
    // Expiry outranks the ladder even if the store is supported.
    assert.strictEqual(
      deriveDhanProviderState({
        config: 'CREDENTIAL_REFERENCES_CONFIGURED',
        vaultReadiness: 'SUPPORTED',
        credentialsExpired: true,
        lastVendorOutcome: 'ACCEPTED',
      }),
      'EXPIRED'
    );
    // No configuration at all cannot be rescued by any other observation.
    assert.strictEqual(
      deriveDhanProviderState({
        config: 'ABSENT',
        vaultReadiness: 'SUPPORTED',
        lastVendorOutcome: 'ACCEPTED',
        marketDataServed: true,
      }),
      'UNCONFIGURED'
    );
    // Unknown vocabulary is not guessed at.
    const junk = { config: 'MAYBE', vaultReadiness: 'SUPPORTED' } as unknown as Parameters<
      typeof deriveDhanProviderState
    >[0];
    assert.strictEqual(deriveDhanProviderState(junk), 'UNAVAILABLE');
    const badOutcome = {
      config: 'CREDENTIAL_REFERENCES_CONFIGURED',
      vaultReadiness: 'SUPPORTED',
      lastVendorOutcome: 'PROBABLY_FINE',
    } as unknown as Parameters<typeof deriveDhanProviderState>[0];
    assert.strictEqual(deriveDhanProviderState(badOutcome), 'UNAVAILABLE');
    assert.strictEqual(
      deriveDhanProviderState(null as unknown as Parameters<typeof deriveDhanProviderState>[0]),
      'UNAVAILABLE'
    );
  });
});

describe('W-03 — W-02 posture and boundaries preserved', () => {
  it('W-03-19: expired Dhan material reports EXPIRED and keeps egress off', async () => {
    const fake = makeFakeBackend({ probeReady: true });
    const outcome = await startTracked(
      startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN,
        [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/w03-nonprod/client-id',
        [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/w03-nonprod/access-token',
        [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
        [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-12T00:00:00.000Z',
        [DHAN_VAULT_BACKEND_ENV]: 'windows-dpapi',
      },
      vaultBackend: fake.backend,
      port: 0,
      // Startup happens AFTER the configured expiry.
      now: () => new Date('2026-11-12T06:30:00.000Z'),
      })
    );
    try {
      assert.strictEqual(outcome.ok, true);
      if (!outcome.ok) return;
      assert.strictEqual(outcome.diagnostics.credentialReadinessCode, 'CREDENTIALS_EXPIRED');
      assert.strictEqual(outcome.diagnostics.providerState, 'EXPIRED');
      assert.strictEqual(outcome.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
    } finally {
      // handle closed by afterEach
    }
  });

  it('W-03-20: the daemon and its new modules stay out of the public/browser surface', async () => {
    // W-02 boundary unchanged: neither the launcher nor the selector may be reachable from
    // `./dhan-server`, which is what browser code is allowed to import.
    assert.strictEqual('startMarketDataDaemon' in dhanServerPublic, false);
    assert.strictEqual('parseDhanVaultBackendSelector' in dhanServerPublic, false);
    assert.strictEqual('deriveDhanProviderState' in dhanServerPublic, false);
    assert.strictEqual(DHAN_VAULT_BACKEND_ENV in dhanServerPublic, false);
  });

  it('W-03-21: the CLI runner applies the same selector and refuses the same value', async () => {
    const lines: string[] = [];
    const refused = await runMarketDataDaemonCli({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: TOKEN, [DHAN_VAULT_BACKEND_ENV]: 'nope-not-a-backend' },
      argv: [],
      io: { writeStderr: (line: string) => lines.push(line) },
    });
    assert.strictEqual(refused.exitCode, 1, 'an unknown selector is a non-zero exit, not a silent default');
    assert.strictEqual(refused.handle, undefined);
    assert.strictEqual(lines.length, 1);
    assert.match(lines[0], /VAULT_BACKEND_NOT_ALLOWED/);
    assert.ok(!lines[0].includes('nope-not-a-backend'), 'the value is not echoed by the CLI either');
  });
});
