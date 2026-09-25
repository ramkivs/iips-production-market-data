/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Provider Configuration & Credential-Readiness Boundary (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * CREDENTIAL POLICY (AD-17):
 *  - No credential value is ever stored in this module or in the repository.
 *  - Credentials are referenced ONLY through the existing SecretRef architecture
 *    (src/security/secret_ref.ts) and resolved at call time by an externally
 *    supplied resolver.
 *  - Absence of credentials is a first-class, deterministic state
 *    (PRE_ACCESS_CREDENTIALS_UNAVAILABLE), not an error condition to be guessed around.
 */

import { SecretRef, validateSecretRef } from '../../security/secret_ref.js';
import { DhanFailure } from './dhan_failures.js';

/** Symbolic internal provider identifier used on the provider-neutral SPI. */
export const DHAN_PROVIDER_ID = 'DHAN_PROVIDER';

/**
 * Publicly documented Dhan API base URL. Contains no credential material.
 * Overridable through configuration so that no environment is hard-pinned.
 */
export const DHAN_DEFAULT_BASE_URL = 'https://api.dhan.co/v2';

export const DHAN_DEFAULT_TIMEOUT_MS = 5000;

/**
 * Environment / configuration keys consumed by this provider.
 * Values are supplied externally (environment, deployment configuration or vault);
 * none of them are committed to the repository.
 */
export const DHAN_ENV_KEYS = {
  baseUrl: 'IIPS_DHAN_BASE_URL',
  timeoutMs: 'IIPS_DHAN_TIMEOUT_MS',
  clientIdSecretPath: 'IIPS_DHAN_CLIENT_ID_SECRET_PATH',
  accessTokenSecretPath: 'IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH',
  secretVaultProvider: 'IIPS_DHAN_VAULT_PROVIDER',
  secretVersion: 'IIPS_DHAN_SECRET_VERSION',
} as const;

export type DhanCredentialReadiness =
  | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
  | 'CREDENTIAL_REFERENCES_CONFIGURED';

export interface DhanProviderConfig {
  readonly providerId: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly readiness: DhanCredentialReadiness;
  /** SecretRef pointer for the Dhan access token. Never the token value itself. */
  readonly accessTokenRef?: SecretRef;
  /** SecretRef pointer for the Dhan client id. Never the client id value itself. */
  readonly clientIdRef?: SecretRef;
  /** Configuration keys that were absent, driving the readiness state. */
  readonly missingKeys: readonly string[];
}

export type DhanConfigResolution =
  | { ok: true; config: DhanProviderConfig }
  | { ok: false; failure: DhanFailure; config: DhanProviderConfig };

export type DhanEnvSource = Readonly<Record<string, string | undefined>>;

function parseTimeout(raw: string | undefined): number {
  if (!raw) return DHAN_DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DHAN_DEFAULT_TIMEOUT_MS;
  return parsed;
}

function buildSecretRef(
  keyPath: string,
  vaultProvider: string | undefined,
  version: string | undefined
): SecretRef | undefined {
  const ref: SecretRef = {
    secretId: `dhan-${keyPath.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    vaultProvider: (vaultProvider as SecretRef['vaultProvider']) || 'LOCAL_MOCK_VAULT',
    keyPath,
    version: version || 'v1',
    status: 'ACTIVE',
  };
  return validateSecretRef(ref).isValid ? ref : undefined;
}

/**
 * Resolves Dhan provider configuration from an externally supplied environment map.
 *
 * Pre-access behaviour: when credential references are absent the resolution is
 * reported as NOT ok with code CREDENTIALS_UNAVAILABLE, but a usable transport
 * configuration (base URL / timeout) is still returned so the foundation remains
 * exercisable without credentials.
 */
export function resolveDhanProviderConfig(env: DhanEnvSource = {}): DhanConfigResolution {
  const baseUrl = (env[DHAN_ENV_KEYS.baseUrl] || DHAN_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const timeoutMs = parseTimeout(env[DHAN_ENV_KEYS.timeoutMs]);

  const tokenPath = env[DHAN_ENV_KEYS.accessTokenSecretPath];
  const clientPath = env[DHAN_ENV_KEYS.clientIdSecretPath];
  const vaultProvider = env[DHAN_ENV_KEYS.secretVaultProvider];
  const version = env[DHAN_ENV_KEYS.secretVersion];

  const missingKeys: string[] = [];
  if (!tokenPath) missingKeys.push(DHAN_ENV_KEYS.accessTokenSecretPath);
  if (!clientPath) missingKeys.push(DHAN_ENV_KEYS.clientIdSecretPath);

  if (missingKeys.length > 0) {
    const config: DhanProviderConfig = {
      providerId: DHAN_PROVIDER_ID,
      baseUrl,
      timeoutMs,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
      missingKeys,
    };
    return {
      ok: false,
      config,
      failure: {
        code: 'CREDENTIALS_UNAVAILABLE',
        message: `Dhan credential references are not configured (missing: ${missingKeys.join(', ')}). Provider remains in pre-access mode.`,
      },
    };
  }

  const accessTokenRef = buildSecretRef(tokenPath as string, vaultProvider, version);
  const clientIdRef = buildSecretRef(clientPath as string, vaultProvider, version);

  if (!accessTokenRef || !clientIdRef) {
    const config: DhanProviderConfig = {
      providerId: DHAN_PROVIDER_ID,
      baseUrl,
      timeoutMs,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
      missingKeys,
    };
    return {
      ok: false,
      config,
      failure: {
        code: 'CONFIGURATION_INCOMPLETE',
        message: 'Dhan credential references must be well-formed SecretRef vault:// paths.',
      },
    };
  }

  return {
    ok: true,
    config: {
      providerId: DHAN_PROVIDER_ID,
      baseUrl,
      timeoutMs,
      readiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
      accessTokenRef,
      clientIdRef,
      missingKeys: [],
    },
  };
}

/**
 * Operator-safe configuration summary suitable for logs and evidence artefacts.
 * Emits only vault POINTERS and never any resolved credential material.
 */
export function describeDhanConfig(config: DhanProviderConfig): Record<string, string> {
  return {
    providerId: config.providerId,
    baseUrl: config.baseUrl,
    timeoutMs: String(config.timeoutMs),
    readiness: config.readiness,
    accessTokenKeyPath: config.accessTokenRef?.keyPath ?? 'UNCONFIGURED',
    clientIdKeyPath: config.clientIdRef?.keyPath ?? 'UNCONFIGURED',
    missingKeys: config.missingKeys.join(',') || 'NONE',
  };
}

/**
 * Credential material resolved at call time from the vault / secret provider.
 * Instances are short-lived and MUST NOT be persisted, logged or serialized.
 */
export interface DhanCredentialMaterial {
  readonly accessToken: string;
  readonly clientId: string;
}

/**
 * Externally supplied credential resolver.
 * Returning null is the explicit, supported pre-access state.
 */
export interface DhanCredentialResolver {
  resolve(config: DhanProviderConfig): Promise<DhanCredentialMaterial | null>;
}

/**
 * Default resolver for the pre-access gate: always reports "no credentials".
 * Real credential injection replaces this resolver without touching the client,
 * the adapter, the DTO boundary or the canonical normalization path.
 */
export class PreAccessDhanCredentialResolver implements DhanCredentialResolver {
  public async resolve(): Promise<DhanCredentialMaterial | null> {
    return null;
  }
}
