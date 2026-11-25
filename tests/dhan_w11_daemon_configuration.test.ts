/**
 * W-11 — IPD Market-Data Daemon Configuration, Compatibility & Documentation Consistency Suite
 *
 * Verifies (deterministic, offline, synthetic fixtures only — zero live Dhan calls):
 *  W11-01: Exact documentation-to-implementation parity across W-11 & reconciled IPD docs
 *          (all DHAN_ENV_KEYS, daemon env keys, defaults, all 9 MARKET_DATA_ROUTES, VaultProvider
 *          & SecretRefStatus enums, IRR separate non-alias env names, restored DPAPI selector
 *          and two-key-path convention, and AD-17 / D-7 secret-scanner hygiene).
 *  W11-02: Fail-closed daemon defaults (127.0.0.1:8791, disabled vault selector,
 *          UNPROVISIONED_WINDOWS_HOST_VAULT, no vendor egress, 4,680 qualified P7 mappings)
 *          and strict non-alias isolation against IRR consumer variables.
 *  W11-03: Fail-closed startup validation across host (loopback-only), port (1..65535),
 *          transport bearer token, backend-selector allow-list, CLI-argument prohibition,
 *          and production-mode refusal (NODE_ENV / IIPS_DEPLOYMENT_ENV).
 *  W11-04: Complete SecretRef configuration, status, provider-enum, and strict UTC expiry
 *          startup matrix (missing paths, malformed URI, valid/invalid WINDOWS_DPAPI pair,
 *          EXPIRED/REVOKED status, unparseable/zone-less/past expiresAt).
 *  W11-05: Full 9-route authenticated loopback HTTP compatibility (health v2, diagnostics v1,
 *          connection/verify v1 LOCAL_ONLY & LIVE_PROBE, freshness D01 & D02, quotes, historical,
 *          and offline P4 identity search/resolve/qualify), bearer 401 enforcement, and clean
 *          idempotent shutdown with zero outbound vendor calls.
 *  W11-06: ./dhan-server and ./portfolio-ui package boundary preservation (client & route
 *          contracts exported; daemon launcher, vault resolver, and HTTPS egress withheld).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { scanTextForSecrets } from '../src/security/scanner.js';
import {
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  VAULT_PROVIDERS,
  WINDOWS_DPAPI_VAULT_PROVIDER,
  type SecretRefStatus,
  type VaultProvider,
} from '../src/security/secret_ref.js';
import {
  DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS,
  DEFAULT_MARKET_DATA_DAEMON_HOST,
  DEFAULT_MARKET_DATA_DAEMON_PORT,
  DHAN_AUTH_LATCH_THRESHOLD,
  DHAN_DEFAULT_BASE_URL,
  DHAN_DEFAULT_TIMEOUT_MS,
  DHAN_DIAGNOSTICS_CONTRACT_VERSION,
  DHAN_ENV_KEYS,
  DHAN_HEALTH_CONTRACT_VERSION,
  DHAN_VERIFICATION_CONTRACT_VERSION,
  DHAN_VAULT_BACKEND_DISABLED,
  DHAN_VAULT_BACKEND_ENV,
  DHAN_VAULT_BACKEND_WINDOWS_DPAPI,
  DHAN_VAULT_BACKEND_SELECTORS,
  MARKET_DATA_DAEMON_HOST_ENV,
  MARKET_DATA_DAEMON_PORT_ENV,
  MARKET_DATA_MAX_REQUEST_BYTES,
  MARKET_DATA_REQUEST_TIMEOUT_MS,
  MARKET_DATA_ROUTES,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
  MarketDataTransportClient,
  UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID,
  formatDaemonStartupLine,
  isLoopbackTransportHost,
  loadGovernedP7InstrumentRegistry,
  resolveDhanProviderConfig,
  runMarketDataDaemonCli,
  startMarketDataDaemon,
} from '../src/providers/dhan/index.js';
import * as dhanServerPublic from '../src/providers/dhan/package.js';
import * as portfolioUiPublic from '../src/ui/portfolio_ui_package.js';

const NOW_ISO = '2026-11-16T09:30:00.000Z';
const NOW_DATE = new Date(NOW_ISO);
const SYNTHETIC_TRANSPORT_BEARER = 'w11-synthetic-loopback-token';
const ID_INFY_NSE = buildD114SecurityIdentity('INE009A01021', 'EQ')!;

const SYNTHETIC_VAULT_PATHS_ENV: Readonly<Record<string, string>> = {
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://synthetic-w11/dhan/client-id',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://synthetic-w11/dhan/access-token',
};

describe('W-11: IPD Market-Data Daemon Configuration, Compatibility & Documentation Consistency', () => {
  it('W11-01: W-11 documentation matches restored DPAPI and IPD constants, routes, defaults, and AD-17/D-7 hygiene', () => {
    const repoRoot = process.cwd();
    const w11DocPath = resolve(
      repoRoot,
      'docs/integration/DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md'
    );
    const d1DocPath = resolve(repoRoot, 'docs/DHAN-D1-PROVIDER-FOUNDATION.md');
    const stage1DocPath = resolve(
      repoRoot,
      'docs/integration/DHAN-STAGE1-CREDENTIAL-AND-TRANSPORT-ADMISSION-2026-11-08.md'
    );
    const w07DocPath = resolve(repoRoot, 'docs/integration/DHAN-W07-HEALTH-CONTRACT-HANDOFF.md');

    const w11Doc = readFileSync(w11DocPath, 'utf8');
    const d1Doc = readFileSync(d1DocPath, 'utf8');
    const stage1Doc = readFileSync(stage1DocPath, 'utf8');
    const w07Doc = readFileSync(w07DocPath, 'utf8');

    // Verify exact constant values on authoritative main before checking doc parity.
    assert.equal(MARKET_DATA_DAEMON_HOST_ENV, 'IIPS_MARKET_DATA_DAEMON_HOST');
    assert.equal(MARKET_DATA_DAEMON_PORT_ENV, 'IIPS_MARKET_DATA_DAEMON_PORT');
    assert.equal(MARKET_DATA_TRANSPORT_TOKEN_ENV, 'IIPS_MARKET_DATA_TRANSPORT_TOKEN');
    assert.equal(DEFAULT_MARKET_DATA_DAEMON_HOST, '127.0.0.1');
    assert.equal(DEFAULT_MARKET_DATA_DAEMON_PORT, 8791);
    assert.equal(DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS, 5000);
    assert.equal(DHAN_DEFAULT_BASE_URL, 'https://api.dhan.co/v2');
    assert.equal(DHAN_DEFAULT_TIMEOUT_MS, 5000);
    assert.equal(MARKET_DATA_REQUEST_TIMEOUT_MS, 10000);
    assert.equal(MARKET_DATA_MAX_REQUEST_BYTES, 16384);
    assert.equal(UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID, 'UNPROVISIONED_WINDOWS_HOST_VAULT');
    assert.equal(DHAN_HEALTH_CONTRACT_VERSION, 2);
    // W-25: the required `freshness` block moved the diagnostics contract to 2.
    assert.equal(DHAN_DIAGNOSTICS_CONTRACT_VERSION, 2);
    assert.equal(DHAN_VERIFICATION_CONTRACT_VERSION, 1);
    assert.equal(DHAN_AUTH_LATCH_THRESHOLD, 2);
    assert.equal(DHAN_VAULT_BACKEND_ENV, 'IIPS_DHAN_VAULT_BACKEND');
    assert.equal(DHAN_VAULT_BACKEND_DISABLED, 'disabled');
    assert.equal(DHAN_VAULT_BACKEND_WINDOWS_DPAPI, 'windows-dpapi');
    assert.deepEqual(DHAN_VAULT_BACKEND_SELECTORS, ['disabled', 'windows-dpapi']);
    assert.equal(WINDOWS_DPAPI_VAULT_PROVIDER, 'WINDOWS_DPAPI');
    assert.equal(DHAN_CLIENT_ID_KEY_PATH, 'vault://dhan/client-id');
    assert.equal(DHAN_ACCESS_TOKEN_KEY_PATH, 'vault://dhan/access-token');
    for (const setting of [
      DHAN_VAULT_BACKEND_ENV,
      DHAN_VAULT_BACKEND_DISABLED,
      DHAN_VAULT_BACKEND_WINDOWS_DPAPI,
      'DHAN_CLIENT_ID_KEY_PATH',
      'DHAN_ACCESS_TOKEN_KEY_PATH',
      'dhan:credential',
      'parseStrictUtcTimestamp',
      'validateTransportToken',
    ]) {
      assert.ok(w11Doc.includes(setting), `W-11 doc must describe restored ${setting}`);
    }

    // Every DHAN_ENV_KEYS entry (both key property name and env-var name) must be documented.
    for (const [propName, envName] of Object.entries(DHAN_ENV_KEYS)) {
      assert.ok(
        w11Doc.includes(`\`${envName}\``),
        `W-11 doc must document env var ${envName}`
      );
      assert.ok(
        w11Doc.includes(`\`${propName}\``),
        `W-11 doc must document DHAN_ENV_KEYS.${propName}`
      );
      assert.ok(
        d1Doc.includes(`\`${envName}\``),
        `DHAN-D1 doc must include ${envName} in its reconciled configuration table`
      );
    }

    // Daemon & deployment/TLS guard env vars must all be documented.
    for (const envName of [
      MARKET_DATA_DAEMON_HOST_ENV,
      MARKET_DATA_DAEMON_PORT_ENV,
      MARKET_DATA_TRANSPORT_TOKEN_ENV,
      'NODE_ENV',
      'IIPS_DEPLOYMENT_ENV',
      'NODE_TLS_REJECT_UNAUTHORIZED',
    ]) {
      assert.ok(w11Doc.includes(`\`${envName}\``), `W-11 doc must document ${envName}`);
    }

    // Separate IRR consumer env names must be documented as IRR-only non-aliases.
    for (const irrEnv of [
      'IIPS_MARKET_DATA_TRANSPORT_URL',
      'IIPS_MARKET_DATA_BASE_URL',
      'IIPS_MARKET_DATA_TIMEOUT_MS',
    ]) {
      assert.ok(w11Doc.includes(`\`${irrEnv}\``), `W-11 doc must distinguish IRR env ${irrEnv}`);
    }

    // All 9 MARKET_DATA_ROUTES must be documented in W-11 doc and http header comment.
    const httpSource = readFileSync(
      resolve(repoRoot, 'src/providers/dhan/dhan_market_data_http.ts'),
      'utf8'
    );
    const routeEntries = Object.entries(MARKET_DATA_ROUTES);
    assert.equal(routeEntries.length, 9, 'Expected all 9 governed MARKET_DATA_ROUTES');
    for (const [, routePath] of routeEntries) {
      assert.ok(w11Doc.includes(routePath), `W-11 doc must document route ${routePath}`);
      assert.ok(httpSource.includes(routePath), `dhan_market_data_http.ts must reference ${routePath}`);
    }

    // Admitted VaultProvider and SecretRefStatus values on main must match documentation.
    const vaultProviders: readonly VaultProvider[] = [
      'LOCAL_MOCK_VAULT',
      'AWS_SECRETS_MANAGER',
      'HASHICORP_VAULT',
      'AZURE_KEY_VAULT',
      'TEST_ENCLAVE',
      'WINDOWS_DPAPI',
    ];
    assert.deepEqual(VAULT_PROVIDERS, vaultProviders);
    for (const vp of vaultProviders) {
      assert.ok(w11Doc.includes(`'${vp}'`), `W-11 doc must list VaultProvider '${vp}'`);
    }
    const statuses: readonly SecretRefStatus[] = ['ACTIVE', 'ROTATING', 'REVOKED', 'EXPIRED'];
    for (const st of statuses) {
      assert.ok(w11Doc.includes(`'${st}'`), `W-11 doc must list SecretRefStatus '${st}'`);
    }

    // All 8 normative D-7 DhanProviderState values and ServiceDiagnostics keys must be documented.
    for (const ps of [
      'UNCONFIGURED',
      'CONFIGURED',
      'CREDENTIALS_RESOLVED',
      'AUTHENTICATED',
      'OPERATIONAL',
      'EXPIRED',
      'DEGRADED',
      'UNAVAILABLE',
    ]) {
      assert.ok(w11Doc.includes(`'${ps}'`), `W-11 doc must list DhanProviderState '${ps}'`);
    }
    for (const diagField of [
      'vaultBackendId',
      'credentialResolutionOutcome',
      'requestCounters',
      'qualifiedMappingsLoaded',
      'quoteCache',
    ]) {
      assert.ok(w11Doc.includes(diagField), `W-11 doc must document ServiceDiagnostics.${diagField}`);
    }

    // The selector is now a deliberate restoration; only the unadmitted retry knob stays absent.
    const daemonSource = readFileSync(resolve(repoRoot, 'src/providers/dhan/dhan_local_daemon.ts'), 'utf8');
    assert.ok(daemonSource.includes("export const DHAN_VAULT_BACKEND_ENV = 'IIPS_DHAN_VAULT_BACKEND'"));
    const dhanSrcDir = resolve(repoRoot, 'src/providers/dhan');
    for (const file of readdirSync(dhanSrcDir).filter((f) => f.endsWith('.ts'))) {
      const content = readFileSync(resolve(dhanSrcDir, file), 'utf8');
      assert.ok(
        !content.includes('IIPS_DHAN_QUOTE_MAX_ATTEMPTS'),
        `src/providers/dhan/${file} must not introduce IIPS_DHAN_QUOTE_MAX_ATTEMPTS`
      );
    }

    // Cross-references from reconciled historical records must point to the W-11 doc.
    assert.ok(stage1Doc.includes('DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md'));
    assert.ok(w07Doc.includes('DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md'));
    assert.ok(d1Doc.includes('DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md'));

    // Zero-plaintext secret scan across all W-11 documentation and this test file.
    for (const [label, text] of [
      ['W-11 doc', w11Doc],
      ['DHAN-D1 doc', d1Doc],
      ['Stage 1 doc', stage1Doc],
      ['W-07 doc', w07Doc],
    ] as const) {
      const violations = scanTextForSecrets(text, label);
      assert.deepEqual(violations, [], `${label} must have zero secret-scanner violations`);
      assert.ok(!/[A-Za-z]:\\IIPS\\runtime\\secrets/i.test(text), `${label} must not disclose host secret paths`);
    }
  });

  it('W11-02: disabled backend is the fail-closed default; IRR consumer env vars are not aliases', async () => {
    const manifestRegistry = loadGovernedP7InstrumentRegistry();
    assert.equal(manifestRegistry.size, 4680);

    // Port env defaults to 8791 when unset or blank; host defaults to 127.0.0.1 when unset.
    // Inject IRR-owned variables to prove they are not IPD daemon aliases.
    const pollutedEnv: Record<string, string> = {
      [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
      [MARKET_DATA_DAEMON_PORT_ENV]: '   ',
      IIPS_MARKET_DATA_TRANSPORT_URL: 'http://0.0.0.0:9999',
      IIPS_MARKET_DATA_BASE_URL: 'http://0.0.0.0:9998',
      IIPS_MARKET_DATA_TIMEOUT_MS: '1',
      // Only this unadmitted candidate setting remains ignored by IPD:
      IIPS_DHAN_QUOTE_MAX_ATTEMPTS: '99',
    };

    const started = await startMarketDataDaemon({
      env: pollutedEnv,
      port: 0, // programmatic ephemeral port seam so CI never collides on TCP 8791
      now: () => NOW_DATE,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    try {
      assert.equal(started.diagnostics.status, 'LISTENING');
      assert.equal(started.diagnostics.host, '127.0.0.1');
      assert.equal(started.diagnostics.boundAddress, '127.0.0.1');
      assert.ok(started.diagnostics.port > 0 && started.diagnostics.port <= 65535);
      assert.equal(started.diagnostics.providerReadiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      assert.equal(started.diagnostics.vaultBackendSelector, 'disabled');
      assert.equal(started.diagnostics.vaultBackendId, 'UNPROVISIONED_WINDOWS_HOST_VAULT');
      assert.equal(started.diagnostics.vaultBackendReadiness, 'NOT_READY');
      assert.equal(started.diagnostics.liveCredentialResolutionSupported, false);
      assert.equal(started.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      assert.equal(started.diagnostics.qualifiedMappingsLoaded, 4680);
      assert.equal(started.diagnostics.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.equal(started.diagnostics.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');

      const line = formatDaemonStartupLine(started.diagnostics);
      assert.ok(line.includes('providerReadiness=PRE_ACCESS_CREDENTIALS_UNAVAILABLE'));
      assert.ok(line.includes('vaultBackend=UNPROVISIONED_WINDOWS_HOST_VAULT'));
      assert.ok(line.includes('vaultBackendSelector=disabled'));
      assert.ok(line.includes('vaultBackendReadiness=NOT_READY'));
      assert.ok(line.includes('liveCredentialResolution=false'));
      assert.ok(line.includes('vendorEgress=DISABLED_PRE_ACCESS'));
      assert.ok(line.includes('qualifiedMappings=4680'));
      assert.ok(!line.includes(SYNTHETIC_TRANSPORT_BEARER));
    } finally {
      await started.handle.shutdown();
    }
  });

  it('W11-03: fail-closed startup guards for host, port, bearer token, CLI args, and production mode', async () => {
    // Allowed loopback host matrix
    for (const goodHost of ['127.0.0.1', '::1', '[::1]', 'localhost', '  LOCALHOST  ']) {
      assert.equal(isLoopbackTransportHost(goodHost), true, `Expected loopback host allowed: ${goodHost}`);
    }
    for (const badHost of ['', '   ', '0.0.0.0', '::', '[::]', '192.168.1.10', '10.0.0.5', 'api.dhan.co']) {
      assert.equal(isLoopbackTransportHost(badHost), false, `Expected non-loopback host refused: ${badHost}`);
      const res = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
          [MARKET_DATA_DAEMON_HOST_ENV]: badHost,
        },
      });
      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.phase, 'validate');
        assert.equal(res.code, 'NON_LOOPBACK_HOST_REFUSED');
      }
    }

    // A bad vault selector is refused before config, vault or socket work; its value is never echoed.
    const refusedBackend = await startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
        [DHAN_VAULT_BACKEND_ENV]: 'untrusted-location-or-secret',
      },
      port: 0,
    });
    assert.equal(refusedBackend.ok, false);
    if (!refusedBackend.ok) {
      assert.equal(refusedBackend.phase, 'validate');
      assert.equal(refusedBackend.code, 'VAULT_BACKEND_NOT_ALLOWED');
      assert.ok(!refusedBackend.error.includes('untrusted-location-or-secret'));
    }

    // Port validation via IIPS_MARKET_DATA_DAEMON_PORT (note '0' is refused via env!)
    for (const badPort of ['0', '-1', '65536', '8791.5', 'abc', '8791a']) {
      const res = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
          [MARKET_DATA_DAEMON_PORT_ENV]: badPort,
        },
      });
      assert.equal(res.ok, false, `Port '${badPort}' must be rejected`);
      if (!res.ok) {
        assert.equal(res.phase, 'validate');
        assert.equal(res.code, 'INVALID_PORT');
      }
    }

    // Transport token required and non-whitespace
    for (const badTokenEnv of [{}, { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: '' }, { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: '   ' }]) {
      const res = await startMarketDataDaemon({ env: badTokenEnv });
      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.phase, 'validate');
        assert.equal(res.code, 'TRANSPORT_TOKEN_MISSING');
      }
    }

    // CLI arguments forbidden without echoing argv contents
    const stderrLines: string[] = [];
    const cliOutcome = await runMarketDataDaemonCli({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER },
      argv: ['--token=canary-cli-arg-value'],
      io: { writeStderr: (line: string) => stderrLines.push(line) },
    });
    assert.equal(cliOutcome.exitCode, 1);
    assert.equal(cliOutcome.handle, undefined);
    assert.ok(stderrLines.some((l) => l.includes('CLI_ARGUMENTS_FORBIDDEN')));
    assert.ok(stderrLines.every((l) => !l.includes('canary-cli-arg-value')));

    // Production refusal on NODE_ENV and IIPS_DEPLOYMENT_ENV
    for (const prodEnv of [
      { NODE_ENV: 'production', [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER },
      { NODE_ENV: ' Production ', [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER },
      { IIPS_DEPLOYMENT_ENV: 'PRODUCTION', [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER },
    ]) {
      const res = await startMarketDataDaemon({ env: prodEnv });
      assert.equal(res.ok, false);
      if (!res.ok) {
        assert.equal(res.phase, 'validate');
        assert.equal(res.code, 'PRODUCTION_NOT_AUTHORIZED');
      }
    }
  });

  it('W11-04: SecretRef configuration, status, provider-enum, and expiry startup matrix matches docs', async () => {
    // 1. Default provider config defaults
    const defaultCfg = resolveDhanProviderConfig({}, NOW_DATE);
    assert.equal(defaultCfg.ok, false);
    if (!defaultCfg.ok) {
      assert.equal(defaultCfg.failure.code, 'CREDENTIALS_UNAVAILABLE');
      assert.equal(defaultCfg.config.baseUrl, 'https://api.dhan.co/v2');
      assert.equal(defaultCfg.config.timeoutMs, 5000);
      assert.equal(defaultCfg.config.readiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
    }

    // 2. Valid SecretRef metadata defaults (LOCAL_MOCK_VAULT, v1, ACTIVE)
    const validCfg = resolveDhanProviderConfig(SYNTHETIC_VAULT_PATHS_ENV, NOW_DATE);
    assert.equal(validCfg.ok, true);
    if (validCfg.ok) {
      assert.equal(validCfg.config.readiness, 'CREDENTIAL_REFERENCES_CONFIGURED');
      assert.equal(validCfg.config.clientIdRef?.vaultProvider, 'LOCAL_MOCK_VAULT');
      assert.equal(validCfg.config.clientIdRef?.version, 'v1');
      assert.equal(validCfg.config.clientIdRef?.status, 'ACTIVE');
      assert.equal(validCfg.config.timeoutMs, 5000);
    }

    // 3. The restored WINDOWS_DPAPI provider admits only the governed separate key paths.
    const windowsEnv = {
      [DHAN_ENV_KEYS.clientIdSecretPath]: DHAN_CLIENT_ID_KEY_PATH,
      [DHAN_ENV_KEYS.accessTokenSecretPath]: DHAN_ACCESS_TOKEN_KEY_PATH,
      [DHAN_ENV_KEYS.secretVaultProvider]: WINDOWS_DPAPI_VAULT_PROVIDER,
      [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-17T15:00:00+05:30',
    };
    const windowsConfig = resolveDhanProviderConfig(windowsEnv, NOW_DATE);
    assert.equal(windowsConfig.ok, true);
    if (windowsConfig.ok) {
      assert.equal(windowsConfig.config.clientIdRef?.keyPath, DHAN_CLIENT_ID_KEY_PATH);
      assert.equal(windowsConfig.config.accessTokenRef?.keyPath, DHAN_ACCESS_TOKEN_KEY_PATH);
      assert.equal(windowsConfig.config.accessTokenRef?.vaultProvider, 'WINDOWS_DPAPI');
    }
    // A configured Windows provider never enables egress with the default disabled selector.
    const disabledWindows = await startMarketDataDaemon({
      env: { ...windowsEnv, [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER },
      port: 0,
      now: () => NOW_DATE,
    });
    assert.equal(disabledWindows.ok, true);
    if (disabledWindows.ok) {
      try {
        assert.equal(disabledWindows.diagnostics.vaultBackendSelector, 'disabled');
        assert.equal(disabledWindows.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
        assert.equal(disabledWindows.diagnostics.liveCredentialResolutionSupported, false);
      } finally {
        await disabledWindows.handle.shutdown();
      }
    }

    // 4. Invalid timeout strings fall back to 5000 ms
    for (const rawTimeout of ['', '0', '-250', 'not-a-number']) {
      const cfg = resolveDhanProviderConfig(
        { ...SYNTHETIC_VAULT_PATHS_ENV, [DHAN_ENV_KEYS.timeoutMs]: rawTimeout },
        NOW_DATE
      );
      assert.equal(cfg.ok, true);
      if (cfg.ok) assert.equal(cfg.config.timeoutMs, 5000);
    }

    // 5. CONFIGURATION_INCOMPLETE cases refuse daemon startup at phase 'configure'
    const incompleteCases: ReadonlyArray<{ label: string; env: Record<string, string> }> = [
      {
        label: 'non-vault URI on clientIdSecretPath',
        env: {
          ...SYNTHETIC_VAULT_PATHS_ENV,
          [DHAN_ENV_KEYS.clientIdSecretPath]: 'file:///tmp/not-a-vault-ref',
        },
      },
      {
        label: 'unknown VaultProvider',
        env: {
          ...SYNTHETIC_VAULT_PATHS_ENV,
          [DHAN_ENV_KEYS.secretVaultProvider]: 'NOT_AN_ADMITTED_PROVIDER',
        },
      },
      {
        label: 'WINDOWS_DPAPI with the wrong role-specific key path',
        env: {
          ...windowsEnv,
          [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/not-client-id',
        },
      },
      {
        label: 'WINDOWS_DPAPI with shared key path',
        env: {
          ...windowsEnv,
          [DHAN_ENV_KEYS.accessTokenSecretPath]: DHAN_CLIENT_ID_KEY_PATH,
        },
      },
      {
        label: 'unknown SecretRefStatus',
        env: {
          ...SYNTHETIC_VAULT_PATHS_ENV,
          [DHAN_ENV_KEYS.secretStatus]: 'SUSPENDED',
        },
      },
      {
        label: 'unparseable accessTokenExpiresAt',
        env: {
          ...SYNTHETIC_VAULT_PATHS_ENV,
          [DHAN_ENV_KEYS.accessTokenExpiresAt]: 'not-a-timestamp',
        },
      },
      {
        label: 'zone-less accessTokenExpiresAt (host-local ambiguity)',
        env: {
          ...windowsEnv,
          [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-17T09:30:00',
        },
      },
    ];

    for (const tc of incompleteCases) {
      const res = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
          ...tc.env,
        },
        port: 0,
        now: () => NOW_DATE,
      });
      assert.equal(res.ok, false, `Expected startup refusal for ${tc.label}`);
      if (!res.ok) {
        assert.equal(res.phase, 'configure');
        assert.equal(res.code, 'CONFIGURATION_INCOMPLETE');
      }
    }

    // 6. CREDENTIALS_EXPIRED cases (EXPIRED/REVOKED status or past expiresAt) allow loopback
    //    daemon startup with vendorEgressMode=DISABLED_PRE_ACCESS and providerState=EXPIRED.
    const expiredCases: ReadonlyArray<{ label: string; env: Record<string, string> }> = [
      {
        label: 'IIPS_DHAN_SECRET_STATUS=EXPIRED',
        env: { ...SYNTHETIC_VAULT_PATHS_ENV, [DHAN_ENV_KEYS.secretStatus]: 'EXPIRED' },
      },
      {
        label: 'IIPS_DHAN_SECRET_STATUS=REVOKED',
        env: { ...SYNTHETIC_VAULT_PATHS_ENV, [DHAN_ENV_KEYS.secretStatus]: 'REVOKED' },
      },
      {
        label: 'past IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT',
        env: {
          ...SYNTHETIC_VAULT_PATHS_ENV,
          [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-16T09:29:59.000Z',
        },
      },
    ];

    for (const tc of expiredCases) {
      const started = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
          ...tc.env,
        },
        port: 0,
        now: () => NOW_DATE,
      });
      assert.equal(started.ok, true, `Daemon should listen in fail-closed expired state for ${tc.label}`);
      if (!started.ok) continue;
      try {
        assert.equal(started.diagnostics.providerReadiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
        assert.equal(started.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
        const diag = await started.handle.service.getDiagnostics();
        assert.equal(diag.providerState, 'EXPIRED');
        assert.equal(diag.providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      } finally {
        await started.handle.shutdown();
      }
    }
  });

  it('W11-05: full 9-route authenticated loopback HTTP compatibility and zero vendor egress in unprovisioned mode', async () => {
    let providerCalls = 0;
    const started = await startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: SYNTHETIC_TRANSPORT_BEARER,
        ...SYNTHETIC_VAULT_PATHS_ENV,
      },
      port: 0,
      providerTransport: {
        async send() {
          providerCalls += 1;
          throw new Error('unexpected outbound call');
        },
      },
      now: () => NOW_DATE,
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;

    const baseUrl = started.diagnostics.baseUrl;

    try {
      // 1. Unauthenticated / wrong-token requests return 401 UNAUTHENTICATED
      const badClient = new MarketDataTransportClient(baseUrl, 'wrong-bearer-token', { env: {} });
      const unauthHealth = await badClient.health();
      assert.equal(unauthHealth.ok, false);
      if (!unauthHealth.ok) {
        assert.equal(unauthHealth.service, 'DOWN');
        assert.equal(unauthHealth.failure.code, 'UNAUTHENTICATED');
        assert.equal(unauthHealth.failure.httpStatus, 401);
      }

      // 2. Authenticated client exercises health (v2), diagnostics (v1), connection/verify (v1),
      //    quotes (fail-closed CREDENTIALS_UNAVAILABLE), and historical (fail-closed CREDENTIALS_UNAVAILABLE).
      const client = new MarketDataTransportClient(baseUrl, SYNTHETIC_TRANSPORT_BEARER, { env: {} });

      const health = await client.health();
      assert.equal(health.ok, true);
      if (health.ok) {
        assert.equal(health.service, 'UP');
        assert.equal(health.providerConfiguration, 'CONFIGURED');
        assert.equal(health.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
        assert.equal(health.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
        assert.equal(health.contractVersion, 2);
      }

      const diag = await client.diagnostics();
      assert.equal(diag.ok, true);
      if (diag.ok) {
        assert.equal(diag.contractVersion, 2);
        assert.equal(diag.service, 'UP');
        assert.equal(diag.providerState, 'UNAVAILABLE');
        assert.equal(diag.providerConfiguration, 'CONFIGURED');
        assert.equal(diag.credentialResolutionOutcome, 'CREDENTIALS_UNAVAILABLE');
        assert.equal(diag.vaultBackendId, 'UNPROVISIONED_WINDOWS_HOST_VAULT');
        assert.equal(diag.liveCredentialResolutionSupported, false);
        assert.equal(diag.vendorEgressMode, 'SYNTHETIC_INJECTED');
        assert.equal(diag.qualifiedMappingsLoaded, 4680);
        assert.equal(diag.quoteCache.capacity, 256);
      }

      const verifyLocal = await client.verifyConnection({ mode: 'LOCAL_ONLY' });
      assert.equal(verifyLocal.ok, true);
      if (verifyLocal.ok) {
        assert.equal(verifyLocal.contractVersion, 1);
        assert.equal(verifyLocal.mode, 'LOCAL_ONLY');
        assert.equal(verifyLocal.outcome, 'NOT_ATTEMPTED_NOT_READY');
        assert.equal(verifyLocal.probeAttempted, false);
        assert.equal(verifyLocal.probeCount, 0);
        assert.equal(verifyLocal.failureCategory, 'CREDENTIALS_UNAVAILABLE');
      }

      const verifyLive = await client.verifyConnection({ mode: 'LIVE_PROBE' });
      assert.equal(verifyLive.ok, true);
      if (verifyLive.ok) {
        assert.equal(verifyLive.outcome, 'NOT_ATTEMPTED_NOT_READY');
        assert.equal(verifyLive.probeAttempted, false);
        assert.equal(verifyLive.probeCount, 0);
      }

      const quoteRes = await client.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY_NSE,
        exchangeSegment: 'NSE_EQ',
      });
      assert.equal(quoteRes.ok, false);
      if (!quoteRes.ok) {
        assert.equal(quoteRes.failure.code, 'CREDENTIALS_UNAVAILABLE');
        assert.equal(quoteRes.failure.httpStatus, 502);
      }

      const histRes = await client.getHistorical({
        companyId: 'EQ_INFY_IN',
        exchangeSegment: 'NSE_EQ',
        isin: 'INE009A01021',
        interval: '1D',
        fromDate: '2026-11-01',
        toDate: '2026-11-10',
      });
      assert.equal(histRes.ok, false);
      if (!histRes.ok) {
        assert.equal(histRes.failure.code, 'CREDENTIALS_UNAVAILABLE');
        assert.equal(histRes.failure.httpStatus, 502);
      }

      // 3. Direct loopback HTTP checks for /v1/freshness (D01 & D02) and P4 offline identity routes
      const authHeaders = {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${SYNTHETIC_TRANSPORT_BEARER}`,
      };

      const freshD02Resp = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.freshness}?domain=D02_OHLCV`, {
        headers: authHeaders,
      });
      assert.equal(freshD02Resp.status, 200);
      const freshD02 = (await freshD02Resp.json()) as {
        domain: string;
        cacheState: string;
        verdict: string;
        asOf: string | null;
        evidenceSource: string;
        lastRefresh: { outcome: string };
        refreshOutcome: string;
      };
      assert.equal(freshD02.domain, 'D02_OHLCV');
      // W-19: the earlier historical request above failed pre-flight
      // (CREDENTIALS_UNAVAILABLE, zero vendor egress), so nothing is retained and the
      // freshness report stays honestly unknown: no cache state, no verdict, no
      // observation instant. It is never reported as SNAPSHOT freshness.
      assert.equal(freshD02.cacheState, 'NOT_AVAILABLE');
      assert.equal(freshD02.verdict, 'UNKNOWN');
      assert.equal(freshD02.asOf, null);
      assert.equal(freshD02.evidenceSource, 'NO_OBSERVATION');
      // Session history, not projection state: the most recent attempt failed.
      assert.equal(freshD02.lastRefresh.outcome, 'FAILURE');
      assert.equal(freshD02.refreshOutcome, 'FAILURE');

      const freshD01Resp = await fetch(
        `${baseUrl}${MARKET_DATA_ROUTES.freshness}?domain=D01_QUOTES&companyId=EQ_INFY_IN&exchangeSegment=NSE_EQ&securityId=ISIN:INE009A01021:EQ`,
        { headers: authHeaders }
      );
      assert.equal(freshD01Resp.status, 200);
      const freshD01 = (await freshD01Resp.json()) as {
        domain: string;
        cacheState: string;
        verdict: string;
        lastRefresh: { outcome: string; lastFailure: { code: string } | null };
      };
      assert.equal(freshD01.domain, 'D01_QUOTES');
      assert.equal(freshD01.cacheState, 'MISS');
      assert.equal(freshD01.verdict, 'UNKNOWN');
      assert.equal(freshD01.lastRefresh.outcome, 'FAILURE');
      assert.equal(freshD01.lastRefresh.lastFailure?.code, 'REFRESH_FAILED');

      const searchResp = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.instrumentSearch}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ query: 'INE009A01021' }),
      });
      assert.equal(searchResp.status, 200);
      const searchBody = (await searchResp.json()) as { results: unknown[] };
      assert.ok(Array.isArray(searchBody.results));
      assert.ok(searchBody.results.length >= 1);

      const resolveResp = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.identityResolve}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          companyId: 'EQ_INFY_IN',
          exchange: 'NSE',
          securityId: 'ISIN:INE009A01021:EQ',
        }),
      });
      assert.equal(resolveResp.status, 200);
      const resolveBody = (await resolveResp.json()) as { status: string };
      assert.equal(resolveBody.status, 'QUALIFIED');

      const qualifyResp = await fetch(`${baseUrl}${MARKET_DATA_ROUTES.identityQualify}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ isin: 'INE009A01021', exchange: 'NSE', symbol: 'INFY' }),
      });
      assert.equal(qualifyResp.status, 200);
      const qualifyBody = (await qualifyResp.json()) as { status: string };
      assert.equal(qualifyBody.status, 'QUALIFIED');

      assert.equal(providerCalls, 0, 'Unprovisioned vault backend must never invoke outbound transport');
    } finally {
      await started.handle.shutdown();
      // Idempotent second shutdown call
      await started.handle.shutdown();
    }
  });

  it('W11-06: ./dhan-server and ./portfolio-ui preserve strict server/daemon/browser export boundaries', () => {
    // Public ./dhan-server contract surface required by IRR
    for (const exportedSymbol of [
      'MarketDataTransportClient',
      'createMarketDataHttpServer',
      'isLoopbackTransportHost',
      'MARKET_DATA_ROUTES',
      'MARKET_DATA_TRANSPORT_TOKEN_ENV',
      'DhanIdentityApiService',
      'DHAN_HEALTH_CONTRACT_VERSION',
      'DHAN_DIAGNOSTICS_CONTRACT_VERSION',
      'DHAN_VERIFICATION_CONTRACT_VERSION',
      'validateDhanServiceHealth',
      'validateDhanServiceDiagnostics',
      'validateDhanConnectionVerification',
    ]) {
      assert.ok(
        exportedSymbol in dhanServerPublic,
        `./dhan-server must export ${exportedSymbol}`
      );
    }

    // Internal daemon, host-vault, and HTTPS egress primitives must stay internal to IPD
    for (const withheldSymbol of [
      'startMarketDataDaemon',
      'runMarketDataDaemonCli',
      'LocalHostVaultDhanCredentialResolver',
      'DisabledWindowsHostVaultBackend',
      'WindowsDpapiHostVaultBackend',
      'provisionDhanCredential',
      'runDhanCredentialStoreCli',
      'DhanServerHttpsTransport',
    ]) {
      assert.ok(
        !(withheldSymbol in dhanServerPublic),
        `./dhan-server must withhold IPD-internal symbol ${withheldSymbol}`
      );
      assert.ok(
        !(withheldSymbol in portfolioUiPublic),
        `./portfolio-ui must withhold server/daemon symbol ${withheldSymbol}`
      );
    }
    assert.ok(!('MarketDataTransportClient' in portfolioUiPublic));
  });
});
