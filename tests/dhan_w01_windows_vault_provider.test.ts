/**
 * Institutional Investment Platform System (IIPS)
 * W-01 — Windows VaultProvider Admission & Two-Key-Path Convention
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1)
 * Decision: D-1 (Windows DPAPI, user scope; two separate carriers, one path per secret)
 * Work item: W-01 (provider admission + key-path convention; purely additive)
 *
 * SCOPE OF PROOF:
 *  These tests prove provider admission, structural validation of `vault://`
 *  key paths, the D-1 two-key-path convention and its enforcement in Dhan
 *  configuration. They exercise NO credential values, NO Windows DPAPI call and
 *  NO vendor interaction — the DPAPI backend itself is W-02 and is not
 *  implemented here.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  // P03 SecretRef surface under test
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  DHAN_SECRET_KEY_PATHS,
  SecretRef,
  VAULT_PROVIDERS,
  WINDOWS_DPAPI_VAULT_PROVIDER,
  parseVaultKeyPath,
  validateDhanSecretKeyPaths,
  validateSecretRef,
  // Dhan configuration boundary
  DHAN_ENV_KEYS,
  resolveDhanProviderConfig,
} from '../src/index.js';

/** Builds a Windows DPAPI SecretRef for a given key path (no value anywhere). */
function windowsRef(keyPath: string): SecretRef {
  return {
    secretId: `dhan-${keyPath.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    vaultProvider: WINDOWS_DPAPI_VAULT_PROVIDER,
    keyPath,
    version: 'v1',
    status: 'ACTIVE',
  };
}

function windowsEnv(clientKeyPath: string, tokenKeyPath: string): Record<string, string> {
  return {
    [DHAN_ENV_KEYS.clientIdSecretPath]: clientKeyPath,
    [DHAN_ENV_KEYS.accessTokenSecretPath]: tokenKeyPath,
    [DHAN_ENV_KEYS.secretVaultProvider]: 'WINDOWS_DPAPI',
    [DHAN_ENV_KEYS.secretVersion]: 'v1',
  };
}

describe('W-01 / Windows VaultProvider and two-key-path convention', () => {
  it('W-01-01: WINDOWS_DPAPI is admitted exactly once and an unknown provider is rejected', () => {
    assert.strictEqual(
      VAULT_PROVIDERS.filter((p) => p === WINDOWS_DPAPI_VAULT_PROVIDER).length,
      1,
      'the Windows provider must be admitted exactly once'
    );
    assert.ok(VAULT_PROVIDERS.includes('WINDOWS_DPAPI'));

    // Provider admission is what makes a Windows ref a first-class validated value.
    assert.strictEqual(validateSecretRef(windowsRef(DHAN_CLIENT_ID_KEY_PATH)).isValid, true);
    assert.strictEqual(validateSecretRef(windowsRef(DHAN_ACCESS_TOKEN_KEY_PATH)).isValid, true);

    for (const unknown of ['WINDOWS_REGISTRY_PLAINTEXT', 'windows_dpapi', 'WINDOWS_DPAPI ', '']) {
      const ref = {
        ...windowsRef(DHAN_CLIENT_ID_KEY_PATH),
        vaultProvider: unknown,
      } as unknown as SecretRef;
      const result = validateSecretRef(ref);
      assert.strictEqual(result.isValid, false, `provider "${unknown}" must be rejected`);
      assert.match(result.error ?? '', /Invalid vaultProvider/);
    }
  });

  it('W-01-02: the two governed key paths are distinct, role-specific and non-locating', () => {
    assert.strictEqual(DHAN_CLIENT_ID_KEY_PATH, 'vault://dhan/client-id');
    assert.strictEqual(DHAN_ACCESS_TOKEN_KEY_PATH, 'vault://dhan/access-token');
    assert.deepStrictEqual(DHAN_SECRET_KEY_PATHS, {
      clientId: 'vault://dhan/client-id',
      accessToken: 'vault://dhan/access-token',
    });
    assert.notStrictEqual(
      DHAN_SECRET_KEY_PATHS.clientId,
      DHAN_SECRET_KEY_PATHS.accessToken,
      'D-1: one path per secret, never one path for both'
    );

    assert.deepStrictEqual(parseVaultKeyPath(DHAN_CLIENT_ID_KEY_PATH), {
      scope: ['dhan'],
      secretName: 'client-id',
    });
    assert.deepStrictEqual(parseVaultKeyPath(DHAN_ACCESS_TOKEN_KEY_PATH), {
      scope: ['dhan'],
      secretName: 'access-token',
    });
    // Deeper namespaces still address exactly one secret (e.g. a per-environment scope).
    assert.deepStrictEqual(parseVaultKeyPath('vault://dhan/local-nonprod/access-token'), {
      scope: ['dhan', 'local-nonprod'],
      secretName: 'access-token',
    });

    // Neither governed path may embed a value, a URL or a filesystem location.
    for (const keyPath of [DHAN_CLIENT_ID_KEY_PATH, DHAN_ACCESS_TOKEN_KEY_PATH]) {
      assert.ok(keyPath.startsWith('vault://'));
      assert.ok(!/^[a-zA-Z]:[\\/]/.test(keyPath), 'no Windows drive path');
      assert.ok(!keyPath.includes('..'), 'no traversal segment');
      assert.ok(!keyPath.includes('='), 'no query-style material');
    }
  });

  it('W-01-03: invalid Windows references are rejected (one path per secret, never a shared path)', () => {
    const invalidWindowsPaths = [
      'vault://dhan', // bare namespace: cannot address two independent secrets
      'vault://dhan/', // empty secret segment
      'vault:///client-id', // empty scope
      'vault://dhan//access-token', // empty intermediate segment
      'vault://', // no path at all
      'vault://dhan/client-id?sig=abc', // query string
      'vault://dhan/client-id#fragment', // fragment
      'vault://dhan/client-id ', // padded segment
      'https://api.dhan.co/v2/client-id', // not a vault URI
      'plaintext-client-id', // not a vault URI
      '', // empty
    ];

    for (const keyPath of invalidWindowsPaths) {
      const result = validateSecretRef(windowsRef(keyPath));
      assert.strictEqual(result.isValid, false, `key path "${keyPath}" must be rejected`);
    }

    // Non-string key paths are still rejected.
    const nonString = {
      ...windowsRef(DHAN_CLIENT_ID_KEY_PATH),
      keyPath: 42,
    } as unknown as SecretRef;
    assert.strictEqual(validateSecretRef(nonString).isValid, false);

    // Missing version/status remain rejected for the Windows provider.
    const { version: _v, ...noVersion } = windowsRef(DHAN_CLIENT_ID_KEY_PATH);
    assert.strictEqual(validateSecretRef(noVersion).isValid, false);
    const { status: _s, ...noStatus } = windowsRef(DHAN_CLIENT_ID_KEY_PATH);
    assert.strictEqual(validateSecretRef(noStatus).isValid, false);
  });

  it('W-01-04: non-Windows providers keep their pre-W-01 behaviour (purely additive)', () => {
    // Before W-01 the only keyPath rule was the vault:// scheme; a bare namespace
    // and a single-segment path were accepted for the existing providers.
    for (const provider of [
      'LOCAL_MOCK_VAULT',
      'AWS_SECRETS_MANAGER',
      'HASHICORP_VAULT',
      'AZURE_KEY_VAULT',
      'TEST_ENCLAVE',
    ] as const) {
      for (const keyPath of ['vault://dhan', 'vault://single', 'vault://market-data/mock/key']) {
        const ref: SecretRef = {
          secretId: `sec-${provider}`,
          vaultProvider: provider,
          keyPath,
          version: 'v1',
          status: 'ACTIVE',
        };
        assert.strictEqual(
          validateSecretRef(ref).isValid,
          true,
          `${provider} must still accept ${keyPath}`
        );
      }
    }
  });

  it('W-01-05: the Dhan pair validator accepts the governed pair and rejects misuse', () => {
    assert.strictEqual(
      validateDhanSecretKeyPaths({
        clientIdKeyPath: DHAN_SECRET_KEY_PATHS.clientId,
        accessTokenKeyPath: DHAN_SECRET_KEY_PATHS.accessToken,
      }).isValid,
      true
    );

    // Same path for both secrets — the exact failure D-1 forbids.
    const shared = validateDhanSecretKeyPaths({
      clientIdKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH,
      accessTokenKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH,
    });
    assert.strictEqual(shared.isValid, false);

    // Roles are not interchangeable: the client path must not be used as the token path.
    const swapped = validateDhanSecretKeyPaths({
      clientIdKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH,
      accessTokenKeyPath: DHAN_CLIENT_ID_KEY_PATH,
    });
    assert.strictEqual(swapped.isValid, false);

    // Ambiguous / malformed paths.
    for (const bad of [
      { clientIdKeyPath: 'vault://dhan', accessTokenKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH },
      { clientIdKeyPath: DHAN_CLIENT_ID_KEY_PATH, accessTokenKeyPath: 'vault://dhan' },
      { clientIdKeyPath: 'vault://dhan/client-id', accessTokenKeyPath: 'vault://dhan/a/b' },
      { clientIdKeyPath: '', accessTokenKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH },
      { clientIdKeyPath: DHAN_CLIENT_ID_KEY_PATH, accessTokenKeyPath: 'http://x/access-token' },
    ]) {
      assert.strictEqual(
        validateDhanSecretKeyPaths(bad).isValid,
        false,
        `pair ${JSON.stringify(bad)} must be rejected`
      );
    }

    assert.strictEqual(validateDhanSecretKeyPaths(null).isValid, false);
    assert.strictEqual(validateDhanSecretKeyPaths({}).isValid, false);

    // Errors never echo the offending key path (D-7 disclosure discipline, applied early).
    const message = validateDhanSecretKeyPaths({
      clientIdKeyPath: 'vault://dhan/secret-material-abc',
      accessTokenKeyPath: DHAN_ACCESS_TOKEN_KEY_PATH,
    }).error;
    assert.ok(message && !message.includes('secret-material-abc'));
  });

  it('W-01-06: Dhan configuration accepts the governed two-key-path pair under WINDOWS_DPAPI', () => {
    const resolution = resolveDhanProviderConfig(
      windowsEnv(DHAN_CLIENT_ID_KEY_PATH, DHAN_ACCESS_TOKEN_KEY_PATH)
    );

    assert.strictEqual(resolution.ok, true);
    assert.strictEqual(resolution.config.readiness, 'CREDENTIAL_REFERENCES_CONFIGURED');
    assert.strictEqual(resolution.config.clientIdRef?.vaultProvider, 'WINDOWS_DPAPI');
    assert.strictEqual(resolution.config.accessTokenRef?.vaultProvider, 'WINDOWS_DPAPI');
    assert.strictEqual(resolution.config.clientIdRef?.keyPath, 'vault://dhan/client-id');
    assert.strictEqual(resolution.config.accessTokenRef?.keyPath, 'vault://dhan/access-token');
    assert.notStrictEqual(
      resolution.config.clientIdRef?.keyPath,
      resolution.config.accessTokenRef?.keyPath
    );
    // References carry only pointers: no credential value field exists on a SecretRef.
    assert.deepStrictEqual(Object.keys(resolution.config.clientIdRef ?? {}).sort(), [
      'keyPath',
      'secretId',
      'status',
      'vaultProvider',
      'version',
    ]);
  });

  it('W-01-07: Dhan configuration refuses a shared or malformed Windows key path', () => {
    const sharedPath = resolveDhanProviderConfig(
      windowsEnv(DHAN_ACCESS_TOKEN_KEY_PATH, DHAN_ACCESS_TOKEN_KEY_PATH)
    );
    assert.strictEqual(sharedPath.ok, false);
    assert.strictEqual(sharedPath.failure.code, 'CONFIGURATION_INCOMPLETE');
    assert.strictEqual(sharedPath.config.readiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(sharedPath.config.clientIdRef, undefined);
    assert.strictEqual(sharedPath.config.accessTokenRef, undefined);
    // The failure must not reproduce the key path.
    assert.ok(!sharedPath.failure.message.includes('vault://'));

    const namespaceOnly = resolveDhanProviderConfig(windowsEnv('vault://dhan', DHAN_ACCESS_TOKEN_KEY_PATH));
    assert.strictEqual(namespaceOnly.ok, false);
    assert.strictEqual(namespaceOnly.failure.code, 'CONFIGURATION_INCOMPLETE');

    const swappedRoles = resolveDhanProviderConfig(
      windowsEnv(DHAN_ACCESS_TOKEN_KEY_PATH, DHAN_CLIENT_ID_KEY_PATH)
    );
    assert.strictEqual(swappedRoles.ok, false);
    assert.strictEqual(swappedRoles.failure.code, 'CONFIGURATION_INCOMPLETE');
  });

  it('W-01-08: existing non-Windows Dhan configuration is unchanged (regression)', () => {
    const mockResolution = resolveDhanProviderConfig({
      [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/local-nonprod/access-token',
      [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/local-nonprod/client-id',
      [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
      [DHAN_ENV_KEYS.secretVersion]: 'v1',
    });
    assert.strictEqual(mockResolution.ok, true);
    assert.strictEqual(mockResolution.config.readiness, 'CREDENTIAL_REFERENCES_CONFIGURED');
    assert.strictEqual(mockResolution.config.clientIdRef?.vaultProvider, 'LOCAL_MOCK_VAULT');

    // Absent credential references stay the deterministic pre-access state.
    const unconfigured = resolveDhanProviderConfig({});
    assert.strictEqual(unconfigured.ok, false);
    assert.strictEqual(unconfigured.failure.code, 'CREDENTIALS_UNAVAILABLE');
    assert.strictEqual(unconfigured.config.readiness, 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE');
  });
});
