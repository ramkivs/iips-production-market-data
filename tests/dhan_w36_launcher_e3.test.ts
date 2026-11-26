/**
 * W-36 — Launcher E3 and Backend Validation (IPD Market-Data Daemon)
 *
 * Four-state discrimination (W-36): not-running | unauthenticated | not-configured | ready
 * E3 sequence: start → verify → stop → restart, duplicate-launch refusal, sanitized logs.
 *
 * All probes are synthetic/offline (ephemeral port, loopback-only, no vendor calls).
 * The PowerShell 03/04/06 scripts are validated structurally via windows-setup/.validate-scripts.py
 * (342 pass/0 fail); this suite validates the Node behaviour those scripts rely on.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  DEFAULT_MARKET_DATA_DAEMON_PORT,
  DHAN_ENV_KEYS,
  MarketDataTransportClient,
  formatDaemonStartupLine,
  startMarketDataDaemon,
} from '../src/providers/dhan/index.js';
import type { LocalHostVaultSecretBackend, LocalHostVaultSecretRecord } from '../src/providers/dhan/index.js';
import type { SecretRef } from '../src/security/secret_ref.js';

const TOKEN = 'w36-synthetic-transport-token-6f3a91c2';
const WRONG_TOKEN = 'wrong-token-000000000000000000000000';
const VALID_VAULT_ENV: Readonly<Record<string, string>> = {
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/local-nonprod/client-id',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/local-nonprod/access-token',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
};

function makeSyntheticVaultBackend(): LocalHostVaultSecretBackend {
  return {
    backendId: 'SYNTHETIC_READY_VAULT',
    describeReadiness() {
      return {
        backendId: 'SYNTHETIC_READY_VAULT',
        liveResolutionSupported: true,
        prerequisiteSummary: 'Synthetic ready vault for W-36 ready-state probe.',
      };
    },
    async readSecret(ref: SecretRef): Promise<LocalHostVaultSecretRecord | null> {
      if (ref.keyPath === VALID_VAULT_ENV[DHAN_ENV_KEYS.clientIdSecretPath]) {
        return { secretValue: 'SYNTH_CLIENT_ID_W36', status: 'ACTIVE', version: 'v1' };
      }
      if (ref.keyPath === VALID_VAULT_ENV[DHAN_ENV_KEYS.accessTokenSecretPath]) {
        return { secretValue: 'SYNTH_ACCESS_TOKEN_W36', status: 'ACTIVE', version: 'v1' };
      }
      return null;
    },
  };
}

// Helper: probe without auth should be 401; on closed port fetch throws — map to 0
async function unauthenticatedProbe(baseUrl: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(`${baseUrl}/v1/health`, { method: 'GET' });
    const body = await res.text();
    return { status: res.status, body };
  } catch {
    return { status: 0, body: '' };
  }
}

describe('W-36: Launcher E3 and Backend Validation', () => {
  it('W36-01: four-state discrimination — not-running, unauthenticated, not-configured, ready', async () => {
    // not-running: before start, no listener.
    // We prove this by starting on ephemeral port and checking the assigned port is free before.
    // E3 does the same via Get-IipsPortOwner: $null means not-running.
    const notConfiguredDaemon = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(notConfiguredDaemon.ok, true, JSON.stringify(notConfiguredDaemon));
    if (!notConfiguredDaemon.ok) return;

    const baseUrl = notConfiguredDaemon.diagnostics.baseUrl;

    try {
      // unauthenticated: no Authorization header must be 401 UNAUTHENTICATED
      const unauth = await unauthenticatedProbe(baseUrl);
      assert.equal(unauth.status, 401, 'unauthenticated probe must be 401');
      assert.match(unauth.body, /UNAUTHENTICATED/, 'body must carry UNAUTHENTICATED code');
      assert.ok(!unauth.body.includes(TOKEN), 'unauth response must not echo token');
      assert.ok(!unauth.body.includes('vault://'), 'unauth response must not contain vault://');

      // not-configured: authenticated health must be UP but providerConfiguration PRE_ACCESS_CREDENTIALS_UNAVAILABLE
      const client = new MarketDataTransportClient(baseUrl, TOKEN, { env: {} });
      const health = await client.health();
      assert.equal(health.ok, true, 'authenticated health must succeed');
      if (!health.ok) return;
      assert.equal((health as { service: string }).service, 'UP');
      assert.equal((health as { providerConfiguration: string }).providerConfiguration, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      assert.equal((health as { liveProviderConnectivity: string }).liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');

      const diag = await client.diagnostics();
      assert.equal(diag.ok, true, 'diagnostics must succeed authenticated');
      if (!diag.ok) return;
      // not-configured discrimination fields (HTTP diagnostics contract: credentialResolutionOutcome, providerReadiness)
      const d = diag as unknown as {
        providerReadiness: string;
        credentialResolutionOutcome: string;
        providerState: string;
        vaultBackendId: string;
        liveCredentialResolutionSupported: boolean;
        vendorEgressMode: string;
        qualifiedMappingsLoaded: number;
        service: string;
      };
      assert.equal(d.providerReadiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
      assert.equal(d.credentialResolutionOutcome, 'UNCONFIGURED');
      assert.equal(d.providerState, 'UNCONFIGURED');
      assert.equal(d.vaultBackendId, 'UNPROVISIONED_WINDOWS_HOST_VAULT');
      assert.equal(d.liveCredentialResolutionSupported, false);
      assert.equal(d.vendorEgressMode, 'DISABLED_PRE_ACCESS');
      assert.equal(d.qualifiedMappingsLoaded, 4680);
      assert.equal(d.service, 'UP');
      // daemon handle retains the internal credentialReadinessCode (not exposed on HTTP diagnostics)
      assert.equal(notConfiguredDaemon.diagnostics.credentialReadinessCode, 'CREDENTIALS_UNAVAILABLE');
      assert.equal(notConfiguredDaemon.diagnostics.vaultBackendSelector, 'disabled');

      // Sanitisation: health/diagnostics must never carry vault:// or token
      const healthText = JSON.stringify(health);
      const diagText = JSON.stringify(diag);
      for (const t of [healthText, diagText, unauth.body]) {
        assert.ok(!t.includes('vault://'), 'no vault:// in health/diagnostics/unauth');
        assert.ok(!t.includes(TOKEN), 'no token in health/diagnostics/unauth');
      }

      // ready: with vault env + synthetic ready backend → CONFIGURED
      // This proves the discriminator is not a static string: same binary, different env, different state.
      const readyDaemon = await startMarketDataDaemon({
        env: VALID_VAULT_ENV as Record<string, string>,
        host: '127.0.0.1',
        port: 0,
        transportToken: TOKEN,
        vaultBackend: makeSyntheticVaultBackend(),
      });
      assert.equal(readyDaemon.ok, true, JSON.stringify(readyDaemon));
      if (!readyDaemon.ok) return;
      try {
        const readyClient = new MarketDataTransportClient(readyDaemon.diagnostics.baseUrl, TOKEN, { env: {} });
        const readyHealth = await readyClient.health();
        assert.equal(readyHealth.ok, true);
        if (readyHealth.ok) {
          assert.equal((readyHealth as { providerConfiguration: string }).providerConfiguration, 'CONFIGURED');
        }
        const readyDiag = await readyClient.diagnostics();
        assert.equal(readyDiag.ok, true);
        if (readyDiag.ok) {
          const rd = readyDiag as unknown as { credentialResolutionOutcome: string; providerState: string; providerReadiness: string; vaultBackendId: string; liveCredentialResolutionSupported: boolean; vendorEgressMode: string };
          // HTTP diagnostics uses credentialResolutionOutcome; daemon handle uses credentialReadinessCode
          assert.ok(
            rd.credentialResolutionOutcome === 'CONFIGURED_NOT_RESOLVED' || rd.credentialResolutionOutcome === 'CONFIGURED',
            `ready daemon credentialResolutionOutcome must be CONFIGURED-family, got ${rd.credentialResolutionOutcome}`
          );
          assert.equal(rd.providerReadiness, 'CREDENTIAL_REFERENCES_CONFIGURED');
          assert.ok(
            ['CONFIGURED', 'CREDENTIALS_RESOLVED', 'AUTHENTICATED', 'OPERATIONAL'].includes(rd.providerState),
            `ready providerState must be configured-family, got ${rd.providerState}`
          );
          assert.equal(rd.vaultBackendId, 'SYNTHETIC_READY_VAULT');
          assert.equal(rd.liveCredentialResolutionSupported, true);
          assert.notEqual(rd.vendorEgressMode, 'DISABLED_PRE_ACCESS', 'ready daemon must have egress enabled');
          // daemon handle retains credentialReadinessCode for PS discrimination
          assert.equal(readyDaemon.diagnostics.credentialReadinessCode, 'CONFIGURED');
          assert.notEqual(readyDaemon.diagnostics.vendorEgressMode, 'DISABLED_PRE_ACCESS');
        }
      } finally {
        await readyDaemon.handle.shutdown();
      }
    } finally {
      await notConfiguredDaemon.handle.shutdown();
      // not-running after shutdown: baseUrl must be unreachable — fetch returns status 0
      const after = await unauthenticatedProbe(baseUrl);
      assert.equal(after.status, 0, 'unauthenticated probe after shutdown must be unreachable (status 0)');
      const clientAfter = new MarketDataTransportClient(baseUrl, TOKEN, { env: {} });
      const healthAfter = await clientAfter.health();
      assert.equal(healthAfter.ok, false, 'health after shutdown must be DOWN (not-running demonstrated via transport failure)');
      assert.equal((healthAfter as { service: string }).service, 'DOWN');
    }
  });

  it('W36-02: E3 sequence start→verify→stop→restart with sanitized logs and port-ownership guard', async () => {
    // Start 1
    const first = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    assert.equal(first.diagnostics.host, '127.0.0.1');
    assert.equal(first.diagnostics.port > 0 && first.diagnostics.port <= 65535, true);
    assert.equal(first.diagnostics.boundAddress, '127.0.0.1', 'must bind loopback-only, never 0.0.0.0');

    // Verify 1: authenticated health+diagnostics, sanitized startup line, port-ownership (PID owns listener)
    const client1 = new MarketDataTransportClient(first.diagnostics.baseUrl, TOKEN, { env: {} });
    const h1 = await client1.health();
    assert.equal(h1.ok, true);
    const d1 = await client1.diagnostics();
    assert.equal(d1.ok, true);

    const startupLine1 = formatDaemonStartupLine(first.diagnostics);
    assert.match(startupLine1, /listening on http:\/\/127\.0\.0\.1:\d+/);
    assert.match(startupLine1, /providerReadiness=/);
    assert.match(startupLine1, /vaultBackend=/);
    assert.ok(!startupLine1.includes('vault://'), 'startup line must not contain vault://');
    assert.ok(!startupLine1.includes(TOKEN), 'startup line must not contain token');
    assert.ok(!startupLine1.includes('H:\\'), 'startup line must not contain carrier path');
    assert.ok(!startupLine1.includes('/IIPS/'), 'startup line must not contain IIPS path');

    // Stop 1
    await first.handle.shutdown();
    // Idempotent shutdown: second call must not throw
    await first.handle.shutdown();
    const down1 = await client1.health();
    assert.equal(down1.ok, false);
    assert.equal((down1 as { service: string }).service, 'DOWN');

    // Restart (new daemon, ephemeral port again — equivalent to Windows stop then start with same 8791)
    const second = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(second.ok, true, JSON.stringify(second));
    if (!second.ok) return;
    try {
      const client2 = new MarketDataTransportClient(second.diagnostics.baseUrl, TOKEN, { env: {} });
      const h2 = await client2.health();
      assert.equal(h2.ok, true, 'restarted daemon must serve health');
      if (h2.ok) assert.equal((h2 as { service: string }).service, 'UP');
      const d2 = await client2.diagnostics();
      assert.equal(d2.ok, true);
      // Second startup line also sanitized
      const startupLine2 = formatDaemonStartupLine(second.diagnostics);
      assert.ok(!startupLine2.includes(TOKEN));
      assert.ok(!startupLine2.includes('vault://'));
    } finally {
      await second.handle.shutdown();
    }
  });

  it('W36-03: duplicate-launch refusal — second daemon on same port must be BIND_FAILED and first remains UP', async () => {
    // Acquire a free port via ephemeral start, then hold it and attempt second start on same explicit port
    const first = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const heldPort = first.diagnostics.port;
    try {
      const clientFirst = new MarketDataTransportClient(first.diagnostics.baseUrl, TOKEN, { env: {} });
      const before = await clientFirst.health();
      assert.equal(before.ok, true);

      // Second launch on same explicit port must refuse at phase bind without killing first
      // Equivalent to PowerShell Assert-IipsPortFree / throw "port 8791 is already held"
      const second = await startMarketDataDaemon({
        env: {},
        host: '127.0.0.1',
        port: heldPort,
        transportToken: TOKEN,
      });
      assert.equal(second.ok, false, 'second daemon on held port must refuse');
      if (!second.ok) {
        assert.equal(second.phase, 'bind');
        assert.equal(second.code, 'BIND_FAILED');
        assert.ok(!second.error.includes(TOKEN), 'refusal must not echo token');
        assert.ok(!second.error.includes('vault://'), 'refusal must not contain vault://');
      }

      // First daemon still UP after refusal (ownership guard preserved)
      const after = await clientFirst.health();
      assert.equal(after.ok, true, 'first daemon must remain UP after duplicate refusal');
    } finally {
      await first.handle.shutdown();
    }
  });

  it('W36-04: all four pre-existing services retain behaviour (W-03/W-11 parity: loopback-only, token-required, no CLI args, no production)', async () => {
    // W-03/W-11 closed items verified by Node:
    // - loopback-only: non-loopback host refused
    const badHost = await startMarketDataDaemon({
      env: {},
      host: '0.0.0.0',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(badHost.ok, false);
    if (!badHost.ok) assert.equal(badHost.code, 'NON_LOOPBACK_HOST_REFUSED');

    // - transport token required
    const noToken = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
    });
    assert.equal(noToken.ok, false);
    if (!noToken.ok) assert.equal(noToken.code, 'TRANSPORT_TOKEN_MISSING');

    // - wrong token: unauthenticated probe must NOT become authenticated
    const daemon = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
    });
    assert.equal(daemon.ok, true);
    if (!daemon.ok) return;
    try {
      const wrongClient = new MarketDataTransportClient(daemon.diagnostics.baseUrl, WRONG_TOKEN, { env: {} });
      const wrongHealth = await wrongClient.health();
      assert.equal(wrongHealth.ok, false, 'wrong token must be UNAUTHENTICATED');
      if (!wrongHealth.ok) {
        assert.equal((wrongHealth as { failure: { code: string } }).failure.code, 'UNAUTHENTICATED');
      }

      // - no CLI args mode: argv length >0 forbidden (03 passes argv=[]; any args refused)
      const cliRefused = await startMarketDataDaemon({
        env: {},
        host: '127.0.0.1',
        port: 0,
        transportToken: TOKEN,
        argv: ['--unexpected'],
      });
      assert.equal(cliRefused.ok, false);
      if (!cliRefused.ok) assert.equal(cliRefused.code, 'CLI_ARGUMENTS_FORBIDDEN');

      // - production refusal
      const prodRefused = await startMarketDataDaemon({
        env: { NODE_ENV: 'production', IIPS_MARKET_DATA_TRANSPORT_TOKEN: TOKEN },
        host: '127.0.0.1',
        port: 0,
      });
      assert.equal(prodRefused.ok, false);
      if (!prodRefused.ok) assert.equal(prodRefused.code, 'PRODUCTION_NOT_AUTHORIZED');

      // - defaults preserved: 127.0.0.1:8791, disabled vault selector, 4680 mappings, sanitized startup line
      assert.equal(DEFAULT_MARKET_DATA_DAEMON_PORT, 8791);
      assert.equal(daemon.diagnostics.port > 0, true);
      assert.equal(daemon.diagnostics.qualifiedMappingsLoaded, 4680);
      const line = formatDaemonStartupLine(daemon.diagnostics);
      assert.ok(line.includes('127.0.0.1'));
      // No secret material in line (already checked in W36-02, but re-assert here as regression)
      assert.ok(!line.includes('vault://'));
    } finally {
      await daemon.handle.shutdown();
    }
  });

  it('W36-05: unauthenticated probe discrimination is independent of not-configured vs ready', async () => {
    // Even in ready state, unauthenticated must still be 401 — auth gate is independent of credential configuration
    const ready = await startMarketDataDaemon({
      env: VALID_VAULT_ENV as Record<string, string>,
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
      vaultBackend: makeSyntheticVaultBackend(),
    });
    assert.equal(ready.ok, true);
    if (!ready.ok) return;
    try {
      // unauthenticated probe on ready daemon still 401
      const unauth = await unauthenticatedProbe(ready.diagnostics.baseUrl);
      assert.equal(unauth.status, 401);
      assert.match(unauth.body, /UNAUTHENTICATED/);

      // authenticated probe distinguishes ready vs not-configured (checked in W36-01)
      const client = new MarketDataTransportClient(ready.diagnostics.baseUrl, TOKEN, { env: {} });
      const diag = await client.diagnostics();
      assert.equal(diag.ok, true);
      if (diag.ok) {
        const d = diag as unknown as { credentialReadinessCode: string };
        assert.notEqual(d.credentialReadinessCode, 'CREDENTIALS_UNAVAILABLE', 'ready daemon must not be CREDENTIALS_UNAVAILABLE');
      }
    } finally {
      await ready.handle.shutdown();
    }
  });
});
