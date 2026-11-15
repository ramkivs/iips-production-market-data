/**
 * Stage 1 — Local Operational Wiring Verification Suite (Synthetic Only)
 *
 * Verifies:
 *  S1-OW-01: Default DisabledWindowsHostVaultBackend & LocalHostVaultDhanCredentialResolver
 *            keep live credential resolution disabled and preserve P03 SecretRef fail-closed semantics.
 *  S1-OW-02: LocalHostVaultDhanCredentialResolver over synthetic LocalHostVaultSecretBackend
 *            enforces missing, expired, revoked, version-mismatched and backend-error fail-closed
 *            behaviour with zero secret reflection.
 *  S1-OW-03: startMarketDataDaemon & CLI runner enforce loopback-only binding, transport token
 *            requirement, CLI-argument prohibition (no argv reflection), production refusal,
 *            port-collision rollback, diagnostic hygiene, and clean SIGTERM shutdown.
 *  S1-OW-04: Full synthetic operational loop (MarketDataTransportClient <-> startMarketDataDaemon <->
 *            LocalHostVaultDhanCredentialResolver <-> DhanServerHttpsTransport with synthetic fetchImpl)
 *            covering valid quote normalization, invalid bearer token (401), vendor-URL refusal,
 *            timeouts, TLS/origin restrictions, and post-shutdown fail-closed behaviour.
 *  S1-OW-05: ./dhan-server & ./portfolio-ui export boundaries and Gate 3 portfolio write fence
 *            preservation during daemon quote retrieval.
 *
 * Zero live Dhan network requests are performed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import type { SecretRef } from '../src/security/secret_ref.js';
import {
  DHAN_ENV_KEYS,
  DhanServerHttpsTransport,
  DhanVaultResolutionError,
  DisabledWindowsHostVaultBackend,
  LocalHostVaultDhanCredentialResolver,
  MARKET_DATA_DAEMON_HOST_ENV,
  MARKET_DATA_DAEMON_PORT_ENV,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
  MarketDataTransportClient,
  UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID,
  resolveDhanProviderConfig,
  runMarketDataDaemonCli,
  startMarketDataDaemon,
  type LocalHostVaultSecretBackend,
  type LocalHostVaultSecretRecord,
} from '../src/providers/dhan/index.js';
import * as dhanServerPublic from '../src/providers/dhan/package.js';
import * as portfolioUiPublic from '../src/ui/portfolio_ui_package.js';
import { evaluatePortSaveGuard, WriteNotAuthorizedError } from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';

const NOW_ISO = '2026-11-08T06:30:00.000Z';
const NOW_DATE = new Date(NOW_ISO);
const ID_INFY_NSE = buildD114SecurityIdentity('INE009A01021', 'EQ')!;

const VALID_VAULT_ENV: Readonly<Record<string, string>> = {
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/local-nonprod/client-id',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/local-nonprod/access-token',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
  [DHAN_ENV_KEYS.secretVersion]: 'v1',
};

function makeSyntheticVaultBackend(
  entries: Readonly<Record<string, LocalHostVaultSecretRecord>>
): LocalHostVaultSecretBackend {
  return {
    backendId: 'SYNTHETIC_IN_MEMORY_VAULT',
    describeReadiness() {
      return {
        backendId: 'SYNTHETIC_IN_MEMORY_VAULT',
        liveResolutionSupported: true,
        prerequisiteSummary: 'Synthetic in-memory test backend only (never live).',
      };
    },
    async readSecret(ref: SecretRef): Promise<LocalHostVaultSecretRecord | null> {
      return entries[ref.keyPath] ?? null;
    },
  };
}

function makeQuoteWireForDhanId(dhanSecurityId: string, ltp: number): string {
  return JSON.stringify({
    status: 'success',
    data: {
      NSE_EQ: {
        [dhanSecurityId]: {
          last_price: ltp,
          ohlc: { open: ltp - 10, high: ltp + 8, low: ltp - 14, close: ltp - 3 },
          volume: 125_000,
          net_change: 3.0,
          last_trade_time: '08/11/2026 11:55:00',
        },
      },
    },
  });
}

describe('Stage 1 — Local Operational Wiring (Synthetic Verification)', () => {
  it('S1-OW-01: default DisabledWindowsHostVaultBackend keeps live credential resolution disabled and preserves P03 SecretRef validation', async () => {
    const defaultBackend = new DisabledWindowsHostVaultBackend();
    const readiness = defaultBackend.describeReadiness();
    assert.strictEqual(readiness.backendId, UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID);
    assert.strictEqual(readiness.liveResolutionSupported, false);
    assert.ok(readiness.prerequisiteSummary.includes('Windows'));

    const resolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
    });
    assert.strictEqual(resolver.describeBackendReadiness().liveResolutionSupported, false);

    const cfgRes = resolveDhanProviderConfig(VALID_VAULT_ENV, NOW_DATE);
    assert.strictEqual(cfgRes.ok, true);
    if (cfgRes.ok) {
      const resolved = await resolver.resolve(cfgRes.config);
      assert.strictEqual(resolved, null);
    }

    // Invalid SecretRef (non-vault://) fails closed with CONFIGURATION_INCOMPLETE.
    await assert.rejects(
      () =>
        resolver.resolve({
          providerId: 'DHAN_PROVIDER',
          baseUrl: 'https://api.dhan.co/v2',
          timeoutMs: 5000,
          readiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
          missingKeys: [],
          clientIdRef: {
            secretId: 'bad-ref',
            vaultProvider: 'LOCAL_MOCK_VAULT',
            keyPath: 'https://not-a-vault-uri/secret',
            version: 'v1',
            status: 'ACTIVE',
          },
          accessTokenRef: {
            secretId: 'ok-ref',
            vaultProvider: 'LOCAL_MOCK_VAULT',
            keyPath: 'vault://dhan/local-nonprod/access-token',
            version: 'v1',
            status: 'ACTIVE',
          },
        }),
      (err: unknown) =>
        err instanceof DhanVaultResolutionError &&
        err.reason === 'INVALID_SECRET_REF' &&
        err.code === 'CONFIGURATION_INCOMPLETE'
    );

    // Production environment fails closed before any vault lookup.
    const prodResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: { NODE_ENV: 'production' },
    });
    if (cfgRes.ok) {
      await assert.rejects(() => prodResolver.resolve(cfgRes.config), /not authorized/i);
    }
  });

  it('S1-OW-02: LocalHostVaultDhanCredentialResolver enforces missing, expired, revoked, version-mismatch, and scrubbed backend-error fail-closed semantics', async () => {
    const cfgRes = resolveDhanProviderConfig(VALID_VAULT_ENV, NOW_DATE);
    assert.strictEqual(cfgRes.ok, true);
    if (!cfgRes.ok) return;

    // 1. Active synthetic credentials resolve cleanly.
    const activeResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: makeSyntheticVaultBackend({
        'vault://dhan/local-nonprod/client-id': {
          secretValue: 'SYNTH_CLIENT_ID_01',
          status: 'ACTIVE',
          version: 'v1',
        },
        'vault://dhan/local-nonprod/access-token': {
          secretValue: 'SYNTH_ACCESS_TOKEN_01',
          status: 'ACTIVE',
          version: 'v1',
          expiresAt: '2026-11-08T18:00:00.000Z',
        },
      }),
    });
    const creds = await activeResolver.resolve(cfgRes.config);
    assert.deepStrictEqual(creds, {
      clientId: 'SYNTH_CLIENT_ID_01',
      accessToken: 'SYNTH_ACCESS_TOKEN_01',
      expiresAt: '2026-11-08T18:00:00.000Z',
    });

    // 2. Missing entry returns null (CREDENTIALS_UNAVAILABLE).
    const missingResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: makeSyntheticVaultBackend({
        'vault://dhan/local-nonprod/client-id': {
          secretValue: 'SYNTH_CLIENT_ID_01',
          status: 'ACTIVE',
          version: 'v1',
        },
      }),
    });
    assert.strictEqual(await missingResolver.resolve(cfgRes.config), null);

    // 3. Expired token entry throws CREDENTIALS_EXPIRED without echoing token.
    const expiredResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: makeSyntheticVaultBackend({
        'vault://dhan/local-nonprod/client-id': {
          secretValue: 'SYNTH_CLIENT_ID_01',
          status: 'ACTIVE',
          version: 'v1',
        },
        'vault://dhan/local-nonprod/access-token': {
          secretValue: 'NEVER_ECHO_EXPIRED_SECRET',
          status: 'ACTIVE',
          version: 'v1',
          expiresAt: '2026-11-08T06:29:59.000Z',
        },
      }),
    });
    await assert.rejects(
      () => expiredResolver.resolve(cfgRes.config),
      (err: unknown) =>
        err instanceof DhanVaultResolutionError &&
        err.reason === 'EXPIRED' &&
        err.code === 'CREDENTIALS_EXPIRED' &&
        !err.message.includes('NEVER_ECHO_EXPIRED_SECRET')
    );

    // 4. Revoked entry throws CREDENTIALS_EXPIRED.
    const revokedResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: makeSyntheticVaultBackend({
        'vault://dhan/local-nonprod/client-id': {
          secretValue: 'NEVER_ECHO_REVOKED_CLIENT',
          status: 'REVOKED',
          version: 'v1',
        },
        'vault://dhan/local-nonprod/access-token': {
          secretValue: 'SYNTH_ACCESS_TOKEN_01',
          status: 'ACTIVE',
          version: 'v1',
        },
      }),
    });
    await assert.rejects(
      () => revokedResolver.resolve(cfgRes.config),
      (err: unknown) =>
        err instanceof DhanVaultResolutionError &&
        err.reason === 'REVOKED' &&
        err.code === 'CREDENTIALS_EXPIRED' &&
        !err.message.includes('NEVER_ECHO_REVOKED_CLIENT')
    );

    // 5. Version mismatch throws CREDENTIALS_UNAVAILABLE.
    const versionMismatchResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: makeSyntheticVaultBackend({
        'vault://dhan/local-nonprod/client-id': {
          secretValue: 'SYNTH_CLIENT_ID_01',
          status: 'ACTIVE',
          version: 'v2',
        },
        'vault://dhan/local-nonprod/access-token': {
          secretValue: 'SYNTH_ACCESS_TOKEN_01',
          status: 'ACTIVE',
          version: 'v1',
        },
      }),
    });
    await assert.rejects(
      () => versionMismatchResolver.resolve(cfgRes.config),
      (err: unknown) =>
        err instanceof DhanVaultResolutionError &&
        err.reason === 'VERSION_MISMATCH' &&
        err.code === 'CREDENTIALS_UNAVAILABLE'
    );

    // 6. Unexpected backend exception scrubs sensitive internal message.
    const throwingResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
      backend: {
        backendId: 'THROWING_BACKEND',
        describeReadiness: () => ({
          backendId: 'THROWING_BACKEND',
          liveResolutionSupported: true,
          prerequisiteSummary: 'test',
        }),
        async readSecret() {
          throw new Error('vault read crashed for secret RAW_INTERNAL_SECRET_999');
        },
      },
    });
    await assert.rejects(
      () => throwingResolver.resolve(cfgRes.config),
      (err: unknown) =>
        err instanceof DhanVaultResolutionError &&
        err.reason === 'BACKEND_FAILURE' &&
        err.code === 'CREDENTIALS_UNAVAILABLE' &&
        !err.message.includes('RAW_INTERNAL_SECRET_999')
    );
  });

  it('S1-OW-03: startMarketDataDaemon & CLI runner enforce CLI-arg refusal, loopback-only host, token requirement, production refusal, port-collision rollback, and clean SIGTERM shutdown', async () => {
    // 1. CLI arguments are rejected fail-closed without echoing secret values.
    const stderrLines: string[] = [];
    const cliRefused = await runMarketDataDaemonCli({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret' },
      argv: ['--token', 'ACCIDENTAL_CLI_SECRET_VALUE'],
      io: { writeStderr: (line) => stderrLines.push(line) },
    });
    assert.strictEqual(cliRefused.exitCode, 1);
    assert.strictEqual(stderrLines.length, 1);
    assert.match(stderrLines[0]!, /CLI_ARGUMENTS_FORBIDDEN/);
    assert.ok(!stderrLines[0]!.includes('ACCIDENTAL_CLI_SECRET_VALUE'));
    assert.ok(!stderrLines[0]!.includes('local-transport-secret'));

    // 2. Production mode refused.
    const prodRefused = await startMarketDataDaemon({
      env: {
        NODE_ENV: 'production',
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret',
      },
      port: 0,
    });
    assert.strictEqual(prodRefused.ok, false);
    if (!prodRefused.ok) {
      assert.strictEqual(prodRefused.code, 'PRODUCTION_NOT_AUTHORIZED');
    }

    // 3. Non-loopback bind hosts refused.
    for (const badHost of ['0.0.0.0', '::', '192.168.1.50', 'api.dhan.co']) {
      const hostRefused = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_DAEMON_HOST_ENV]: badHost,
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret',
        },
        port: 0,
      });
      assert.strictEqual(hostRefused.ok, false);
      if (!hostRefused.ok) {
        assert.strictEqual(hostRefused.code, 'NON_LOOPBACK_HOST_REFUSED');
      }
    }

    // 4. Invalid port refused.
    for (const badPort of ['0', '70000', 'not-a-port']) {
      const portRefused = await startMarketDataDaemon({
        env: {
          [MARKET_DATA_DAEMON_PORT_ENV]: badPort,
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret',
        },
      });
      assert.strictEqual(portRefused.ok, false);
      if (!portRefused.ok) {
        assert.strictEqual(portRefused.code, 'INVALID_PORT');
      }
    }

    // 5. Missing transport token refused.
    const tokenMissing = await startMarketDataDaemon({
      env: {},
      port: 0,
    });
    assert.strictEqual(tokenMissing.ok, false);
    if (!tokenMissing.ok) {
      assert.strictEqual(tokenMissing.code, 'TRANSPORT_TOKEN_MISSING');
    }

    // 6. Malformed non-vault:// secret path refused without echoing value.
    const badSecretRef = await startMarketDataDaemon({
      env: {
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret',
        [DHAN_ENV_KEYS.clientIdSecretPath]: 'RAW_CLIENT_SECRET_DO_NOT_ECHO',
        [DHAN_ENV_KEYS.accessTokenSecretPath]: 'RAW_TOKEN_SECRET_DO_NOT_ECHO',
      },
      port: 0,
    });
    assert.strictEqual(badSecretRef.ok, false);
    if (!badSecretRef.ok) {
      assert.strictEqual(badSecretRef.code, 'CONFIGURATION_INCOMPLETE');
      assert.ok(!badSecretRef.error.includes('RAW_CLIENT_SECRET_DO_NOT_ECHO'));
      assert.ok(!badSecretRef.error.includes('RAW_TOKEN_SECRET_DO_NOT_ECHO'));
    }

    // 7. Port collision rolls back cleanly without dangling state.
    const blocker = createServer();
    await new Promise<void>((r) => blocker.listen(0, '127.0.0.1', () => r()));
    const occupiedPort = (blocker.address() as AddressInfo).port;
    try {
      const collision = await startMarketDataDaemon({
        env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-transport-secret' },
        host: '127.0.0.1',
        port: occupiedPort,
      });
      assert.strictEqual(collision.ok, false);
      if (!collision.ok) {
        assert.strictEqual(collision.phase, 'bind');
        assert.strictEqual(collision.code, 'BIND_FAILED');
      }
    } finally {
      await new Promise<void>((r) => blocker.close(() => r()));
    }

    // 8. Real compiled CLI process starts on loopback, logs zero secrets, serves health, and shuts down cleanly on SIGTERM.
    const freeProbe = createServer();
    await new Promise<void>((r) => freeProbe.listen(0, '127.0.0.1', () => r()));
    const cliPort = (freeProbe.address() as AddressInfo).port;
    await new Promise<void>((r) => freeProbe.close(() => r()));

    const compiledEntry = resolve(process.cwd(), 'dist/src/providers/dhan/dhan_local_daemon.js');
    const child = spawn(process.execPath, [compiledEntry], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'development',
        [MARKET_DATA_DAEMON_HOST_ENV]: '127.0.0.1',
        [MARKET_DATA_DAEMON_PORT_ENV]: String(cliPort),
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'CLI_SUPER_SECRET_TOKEN_777',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let childOut = '';
    let childErr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      childOut += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      childErr += chunk.toString('utf8');
    });

    await new Promise<void>((resolveReady, rejectReady) => {
      const deadline = setTimeout(() => rejectReady(new Error(`daemon CLI timeout: ${childErr}`)), 10_000);
      const onData = (): void => {
        if (childErr.includes('[ipd-market-data-daemon] listening on')) {
          clearTimeout(deadline);
          resolveReady();
        }
      };
      child.stderr.on('data', onData);
      child.once('exit', (code) => {
        clearTimeout(deadline);
        rejectReady(new Error(`daemon exited prematurely (${code}): ${childErr}`));
      });
    });

    const cliClient = new MarketDataTransportClient(
      `http://127.0.0.1:${cliPort}`,
      'CLI_SUPER_SECRET_TOKEN_777',
      { env: {} }
    );
    const cliHealth = await cliClient.health();
    assert.strictEqual(cliHealth.ok, true);
    if (cliHealth.ok) {
      assert.strictEqual(cliHealth.service, 'UP');
      assert.strictEqual(cliHealth.providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      assert.strictEqual(cliHealth.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
      assert.strictEqual(cliHealth.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
    }

    // Unprovisioned default daemon fails closed as CREDENTIALS_UNAVAILABLE on quote requests.
    const preAccessQuote = await cliClient.getQuote({
      companyId: 'EQ_INFY_IN',
      securityIdentity: ID_INFY_NSE,
    });
    assert.strictEqual(preAccessQuote.ok, false);
    if (!preAccessQuote.ok) {
      assert.strictEqual(preAccessQuote.failure.code, 'CREDENTIALS_UNAVAILABLE');
    }

    const exitCode = await new Promise<number | null>((resolveExit) => {
      child.once('exit', (code) => resolveExit(code));
      child.kill('SIGTERM');
    });
    assert.strictEqual(exitCode, 0);
    assert.ok(!childOut.includes('CLI_SUPER_SECRET_TOKEN_777'));
    assert.ok(!childErr.includes('CLI_SUPER_SECRET_TOKEN_777'));
    assert.match(childErr, /vaultBackend=UNPROVISIONED_WINDOWS_HOST_VAULT/);
    assert.match(childErr, /liveCredentialResolution=false/);
    assert.match(childErr, /vendorEgress=DISABLED_PRE_ACCESS/);
    // W-03: the startup line also reports the selection, awaited backend readiness, the
    // credential-readiness code and the D-7 provider state — with no location disclosure.
    assert.match(childErr, /vaultBackendSelector=disabled/);
    assert.match(childErr, /vaultBackendReadiness=NOT_READY/);
    assert.match(childErr, /credentialReadiness=(CONFIGURED|CREDENTIALS_UNAVAILABLE|CREDENTIALS_EXPIRED)/);
    assert.match(childErr, /providerState=(UNCONFIGURED|CONFIGURED)/);
    assert.ok(!childErr.includes('vault://'));
    assert.ok(!childErr.includes('H:\\IIPS'));
  });

  it('S1-OW-04: synthetic end-to-end daemon + resolver + DhanServerHttpsTransport + MarketDataTransportClient verifies auth, timeouts, TLS/origin guards, and graceful shutdown', async () => {
    let syntheticVendorDelayMs = 0;
    let capturedHeaders: Record<string, string> | undefined;
    let capturedUrl: string | undefined;
    let vendorCalls = 0;

    // Compose real DhanServerHttpsTransport over a purely synthetic fetchImpl (zero live network calls).
    const syntheticHttpsEgress = new DhanServerHttpsTransport({
      env: {},
      fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
        vendorCalls += 1;
        capturedUrl = String(url);
        capturedHeaders = (init?.headers ?? {}) as Record<string, string>;
        if (syntheticVendorDelayMs > 0) {
          await new Promise<void>((resolveDelay, rejectDelay) => {
            const t = setTimeout(resolveDelay, syntheticVendorDelayMs);
            init?.signal?.addEventListener('abort', () => {
              clearTimeout(t);
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'TimeoutError';
              rejectDelay(abortErr);
            });
          });
        }
        // Return synthetic wire payload for Dhan securityId '1594' (P7-qualified EQ_INFY_IN NSE_EQ).
        return new Response(makeQuoteWireForDhanId('1594', 1588.5), { status: 200 });
      }) as typeof fetch,
    });

    let tokenRecord: LocalHostVaultSecretRecord = {
      secretValue: 'SYNTH_DHAN_ACCESS_TOK',
      status: 'ACTIVE',
      version: 'v1',
      expiresAt: '2026-11-08T20:00:00.000Z',
    };

    const syntheticBackend: LocalHostVaultSecretBackend = {
      backendId: 'SYNTHETIC_TEST_VAULT',
      describeReadiness: () => ({
        backendId: 'SYNTHETIC_TEST_VAULT',
        liveResolutionSupported: true,
        prerequisiteSummary: 'synthetic test',
      }),
      async readSecret(ref: SecretRef) {
        if (ref.keyPath === 'vault://dhan/local-nonprod/client-id') {
          return { secretValue: 'SYNTH_DHAN_CLIENT_ID', status: 'ACTIVE', version: 'v1' };
        }
        if (ref.keyPath === 'vault://dhan/local-nonprod/access-token') {
          return tokenRecord;
        }
        return null;
      },
    };

    const started = await startMarketDataDaemon({
      env: {
        ...VALID_VAULT_ENV,
        [DHAN_ENV_KEYS.timeoutMs]: '120',
        [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'LOCAL_DAEMON_BEARER_TOKEN',
      },
      host: '127.0.0.1',
      port: 0,
      vaultBackend: syntheticBackend,
      providerTransport: syntheticHttpsEgress,
      now: () => NOW_DATE,
    });

    assert.strictEqual(started.ok, true);
    if (!started.ok) return;

    try {
      assert.strictEqual(started.diagnostics.boundAddress, '127.0.0.1');
      assert.strictEqual(started.diagnostics.qualifiedMappingsLoaded, 96);
      assert.ok(!JSON.stringify(started.diagnostics).includes('LOCAL_DAEMON_BEARER_TOKEN'));
      assert.ok(!JSON.stringify(started.diagnostics).includes('SYNTH_DHAN_ACCESS_TOK'));

      // 1. Invalid local transport token rejected with 401 UNAUTHENTICATED.
      const badClient = new MarketDataTransportClient(started.diagnostics.baseUrl, 'WRONG_BEARER', {
        env: {},
      });
      const badRes = await badClient.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY_NSE,
      });
      assert.strictEqual(badRes.ok, false);
      assert.strictEqual(vendorCalls, 0);
      if (!badRes.ok) {
        assert.strictEqual(badRes.failure.code, 'UNAUTHENTICATED');
        assert.strictEqual(badRes.failure.httpStatus, 401);
      }

      // 2. Valid authenticated request resolves P7 mapping -> synthetic vault -> DhanServerHttpsTransport -> D01 envelope.
      const client = new MarketDataTransportClient(
        started.diagnostics.baseUrl,
        'LOCAL_DAEMON_BEARER_TOKEN',
        { env: {} }
      );
      const quoteRes = await client.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY_NSE,
      });
      assert.strictEqual(quoteRes.ok, true);
      assert.strictEqual(vendorCalls, 1);
      assert.strictEqual(capturedUrl, 'https://api.dhan.co/v2/marketfeed/quote');
      assert.strictEqual(capturedHeaders?.['access-token'], 'SYNTH_DHAN_ACCESS_TOK');
      assert.strictEqual(capturedHeaders?.['client-id'], 'SYNTH_DHAN_CLIENT_ID');
      if (quoteRes.ok) {
        assert.strictEqual(quoteRes.envelope.domain, 'D01_QUOTES');
        assert.strictEqual(quoteRes.envelope.companyId, 'EQ_INFY_IN');
        assert.strictEqual(quoteRes.envelope.payload.exchange, 'NSE');
        assert.strictEqual(quoteRes.envelope.payload.ltp, 1588.5);
        assert.strictEqual(quoteRes.envelope.provenance.vendorTier, 'TIER_2_COMMERCIAL');
        assert.ok(!JSON.stringify(quoteRes).includes('SYNTH_DHAN_ACCESS_TOK'));
        assert.ok(!JSON.stringify(quoteRes).includes('1594'));
      }

      // 3. Timeout handling on a distinct P7-qualified instrument (EQ_TCS_IN / EQ_ITC_IN) fails closed with TIMEOUT.
      const idItc = buildD114SecurityIdentity('INE154A01025', 'EQ')!;
      syntheticVendorDelayMs = 300;
      const timeoutRes = await client.getQuote({
        companyId: 'EQ_ITC_IN',
        securityIdentity: idItc,
      });
      syntheticVendorDelayMs = 0;
      assert.strictEqual(timeoutRes.ok, false);
      if (!timeoutRes.ok) {
        assert.strictEqual(timeoutRes.failure.code, 'TIMEOUT');
      }

      // 4. Expired token in vault fails closed as CREDENTIALS_EXPIRED before calling vendor transport.
      const callsBeforeExpired = vendorCalls;
      tokenRecord = {
        secretValue: 'SYNTH_DHAN_ACCESS_TOK_EXPIRED',
        status: 'EXPIRED',
        version: 'v1',
        expiresAt: '2026-11-08T01:00:00.000Z',
      };
      const expiredQuote = await client.getQuote({
        companyId: 'EQ_ITC_IN',
        securityIdentity: idItc,
      });
      assert.strictEqual(expiredQuote.ok, false);
      assert.strictEqual(vendorCalls, callsBeforeExpired);
      if (!expiredQuote.ok) {
        assert.strictEqual(expiredQuote.failure.code, 'CREDENTIALS_EXPIRED');
        assert.ok(!JSON.stringify(expiredQuote).includes('SYNTH_DHAN_ACCESS_TOK_EXPIRED'));
      }

      // 5. Client-side vendor URL restriction & TLS/origin restriction through daemon.
      const directVendorClient = new MarketDataTransportClient('https://api.dhan.co/v2', 'LOCAL_DAEMON_BEARER_TOKEN', {
        env: {},
      });
      const refusedVendorUrl = await directVendorClient.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY_NSE,
      });
      assert.strictEqual(refusedVendorUrl.ok, false);
      if (!refusedVendorUrl.ok) {
        assert.strictEqual(refusedVendorUrl.failure.code, 'TRANSPORT_FAILURE');
      }

      // Daemon wired with TLS-disabled environment or mismatched vendor origin fails closed as TRANSPORT_FAILURE.
      let forbiddenFetchTriggered = false;
      const tlsWeakenedDaemon = await startMarketDataDaemon({
        env: {
          ...VALID_VAULT_ENV,
          NODE_TLS_REJECT_UNAUTHORIZED: '0',
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'TLS_CHECK_TOKEN',
        },
        host: '127.0.0.1',
        port: 0,
        vaultBackend: makeSyntheticVaultBackend({
          'vault://dhan/local-nonprod/client-id': { secretValue: 'CID', status: 'ACTIVE', version: 'v1' },
          'vault://dhan/local-nonprod/access-token': { secretValue: 'TOK', status: 'ACTIVE', version: 'v1' },
        }),
        providerTransport: new DhanServerHttpsTransport({
          env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
          fetchImpl: (async () => {
            forbiddenFetchTriggered = true;
            return new Response('{}', { status: 200 });
          }) as typeof fetch,
        }),
        now: () => NOW_DATE,
      });
      assert.strictEqual(tlsWeakenedDaemon.ok, true);
      if (tlsWeakenedDaemon.ok) {
        try {
          const tlsClient = new MarketDataTransportClient(
            tlsWeakenedDaemon.diagnostics.baseUrl,
            'TLS_CHECK_TOKEN',
            { env: {} }
          );
          const tlsQuote = await tlsClient.getQuote({
            companyId: 'EQ_INFY_IN',
            securityIdentity: ID_INFY_NSE,
          });
          assert.strictEqual(tlsQuote.ok, false);
          assert.strictEqual(forbiddenFetchTriggered, false);
          if (!tlsQuote.ok) {
            assert.strictEqual(tlsQuote.failure.code, 'TRANSPORT_FAILURE');
          }
        } finally {
          await tlsWeakenedDaemon.handle.shutdown();
        }
      }

      const wrongOriginDaemon = await startMarketDataDaemon({
        env: {
          ...VALID_VAULT_ENV,
          [DHAN_ENV_KEYS.baseUrl]: 'https://evil.example.com/v2',
          [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'ORIGIN_CHECK_TOKEN',
        },
        host: '127.0.0.1',
        port: 0,
        vaultBackend: makeSyntheticVaultBackend({
          'vault://dhan/local-nonprod/client-id': { secretValue: 'CID', status: 'ACTIVE', version: 'v1' },
          'vault://dhan/local-nonprod/access-token': { secretValue: 'TOK', status: 'ACTIVE', version: 'v1' },
        }),
        providerTransport: new DhanServerHttpsTransport({
          allowedBaseUrl: 'https://api.dhan.co/v2',
          env: {},
          fetchImpl: (async () => {
            forbiddenFetchTriggered = true;
            return new Response('{}', { status: 200 });
          }) as typeof fetch,
        }),
        now: () => NOW_DATE,
      });
      assert.strictEqual(wrongOriginDaemon.ok, true);
      if (wrongOriginDaemon.ok) {
        try {
          const originClient = new MarketDataTransportClient(
            wrongOriginDaemon.diagnostics.baseUrl,
            'ORIGIN_CHECK_TOKEN',
            { env: {} }
          );
          const originQuote = await originClient.getQuote({
            companyId: 'EQ_INFY_IN',
            securityIdentity: ID_INFY_NSE,
          });
          assert.strictEqual(originQuote.ok, false);
          assert.strictEqual(forbiddenFetchTriggered, false);
          if (!originQuote.ok) {
            assert.strictEqual(originQuote.failure.code, 'TRANSPORT_FAILURE');
          }
        } finally {
          await wrongOriginDaemon.handle.shutdown();
        }
      }
    } finally {
      // Idempotent graceful shutdown.
      await started.handle.shutdown();
      await started.handle.shutdown();
    }

    // Post-shutdown client call fails closed as TRANSPORT_FAILURE without throwing.
    const postShutdownClient = new MarketDataTransportClient(
      started.diagnostics.baseUrl,
      'LOCAL_DAEMON_BEARER_TOKEN',
      { env: {} }
    );
    const afterClose = await postShutdownClient.health();
    assert.strictEqual(afterClose.ok, false);
    if (!afterClose.ok) {
      assert.strictEqual(afterClose.service, 'DOWN');
      assert.strictEqual(afterClose.failure.code, 'TRANSPORT_FAILURE');
    }
  });

  it('S1-OW-05: IPD-internal resolver, egress & daemon remain excluded from ./dhan-server and ./portfolio-ui, and Gate 3 portfolio write fence remains intact', async () => {
    for (const internalSymbol of [
      'DhanServerHttpsTransport',
      'LocalHostVaultDhanCredentialResolver',
      'DisabledWindowsHostVaultBackend',
      'startMarketDataDaemon',
      'runMarketDataDaemonCli',
    ]) {
      assert.strictEqual(
        internalSymbol in dhanServerPublic,
        false,
        `${internalSymbol} must not be exported on ./dhan-server`
      );
      assert.strictEqual(
        internalSymbol in portfolioUiPublic,
        false,
        `${internalSymbol} must not be exported on ./portfolio-ui`
      );
    }

    const db = new DatabaseSync(':memory:');
    ensureMigrations(db, GATE3_MIGRATIONS);
    const durablePort = new DurablePortfolioStorePort(db);
    const owner = { canonicalOwnerId: 'local-single-user', tenantId: 'local-single-tenant' };
    const sessionPort = new portfolioUiPublic.SessionPortfolioStorePort();

    const started = await startMarketDataDaemon({
      env: { [MARKET_DATA_TRANSPORT_TOKEN_ENV]: 'local-fence-token' },
      host: '127.0.0.1',
      port: 0,
      now: () => NOW_DATE,
    });
    assert.strictEqual(started.ok, true);
    if (!started.ok) {
      db.close();
      return;
    }

    try {
      const client = new MarketDataTransportClient(
        started.diagnostics.baseUrl,
        'local-fence-token',
        { env: {} }
      );
      const quoteAttempt = await client.getQuote({
        companyId: 'EQ_INFY_IN',
        securityIdentity: ID_INFY_NSE,
      });
      assert.strictEqual(quoteAttempt.ok, false);

      assert.strictEqual((await sessionPort.getPortfolio())?.totalHoldingsCount, 0);
      assert.strictEqual(durablePort.list(owner).length, 0);
      assert.strictEqual(evaluatePortSaveGuard().authorized, false);
      assert.throws(
        () => durablePort.create(owner, 'P1', { holdings: [], provenanceDigest: 'd1' }),
        WriteNotAuthorizedError
      );
      assert.strictEqual(durablePort.list(owner).length, 0);
    } finally {
      await started.handle.shutdown();
      db.close();
    }
  });
});
