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

import {
  SecretRef,
  SecretRefStatus,
  validateDhanSecretKeyPaths,
  validateSecretRef,
  WINDOWS_DPAPI_VAULT_PROVIDER,
} from '../../security/secret_ref.js';
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
  secretStatus: 'IIPS_DHAN_SECRET_STATUS',
  accessTokenExpiresAt: 'IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT',
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

/**
 * Stage 1 admission guard: production credentials, production egress and
 * production deployment are NOT AUTHORIZED.
 */
export function isDhanProductionEnvironment(env: DhanEnvSource = {}): boolean {
  const nodeEnv = env['NODE_ENV']?.trim().toLowerCase();
  const deployEnv = env['IIPS_DEPLOYMENT_ENV']?.trim().toLowerCase();
  return nodeEnv === 'production' || deployEnv === 'production';
}

function parseTimeout(raw: string | undefined): number {
  if (!raw) return DHAN_DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DHAN_DEFAULT_TIMEOUT_MS;
  return parsed;
}

function buildSecretRef(
  keyPath: string,
  vaultProvider: string | undefined,
  version: string | undefined,
  status: string | undefined,
  expiresAt?: string
): SecretRef | undefined {
  const ref: SecretRef = {
    secretId: `dhan-${keyPath.replace(/[^a-zA-Z0-9]+/g, '-')}`,
    vaultProvider: (vaultProvider as SecretRef['vaultProvider']) || 'LOCAL_MOCK_VAULT',
    keyPath,
    version: version || 'v1',
    status: (status as SecretRefStatus) || 'ACTIVE',
    ...(expiresAt !== undefined ? { expiresAt } : {}),
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
export function resolveDhanProviderConfig(
  env: DhanEnvSource = {},
  now: Date = new Date()
): DhanConfigResolution {
  const baseUrl = (env[DHAN_ENV_KEYS.baseUrl] || DHAN_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const timeoutMs = parseTimeout(env[DHAN_ENV_KEYS.timeoutMs]);

  if (isDhanProductionEnvironment(env)) {
    const config: DhanProviderConfig = {
      providerId: DHAN_PROVIDER_ID,
      baseUrl,
      timeoutMs,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
      missingKeys: [],
    };
    return {
      ok: false,
      config,
      failure: {
        code: 'PRODUCTION_NOT_AUTHORIZED',
        message:
          'Production Dhan configuration is not authorized; Stage 1 scope is restricted to the local non-production environment.',
      },
    };
  }

  const tokenPath = env[DHAN_ENV_KEYS.accessTokenSecretPath];
  const clientPath = env[DHAN_ENV_KEYS.clientIdSecretPath];
  const vaultProvider = env[DHAN_ENV_KEYS.secretVaultProvider];
  const version = env[DHAN_ENV_KEYS.secretVersion];
  const secretStatus = env[DHAN_ENV_KEYS.secretStatus];
  const tokenExpiresAt = env[DHAN_ENV_KEYS.accessTokenExpiresAt];

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

  // W-01 / D-1: when the Windows DPAPI provider is selected, the two credential
  // references must follow the governed two-key-path convention — one path per
  // secret, never one path for both. Other providers are unaffected.
  if (vaultProvider === WINDOWS_DPAPI_VAULT_PROVIDER) {
    const keyPathCheck = validateDhanSecretKeyPaths({
      clientIdKeyPath: clientPath as string,
      accessTokenKeyPath: tokenPath as string,
    });
    if (!keyPathCheck.isValid) {
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
          message: `Dhan ${WINDOWS_DPAPI_VAULT_PROVIDER} credential references do not satisfy the two-key-path convention: ${keyPathCheck.error}.`,
        },
      };
    }
  }

  if (tokenExpiresAt !== undefined && Number.isNaN(Date.parse(tokenExpiresAt))) {
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
        message: 'IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT must be a valid ISO-8601 UTC timestamp when provided.',
      },
    };
  }

  const accessTokenRef = buildSecretRef(tokenPath as string, vaultProvider, version, secretStatus, tokenExpiresAt);
  const clientIdRef = buildSecretRef(clientPath as string, vaultProvider, version, secretStatus);

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

  if (
    accessTokenRef.status === 'EXPIRED' ||
    accessTokenRef.status === 'REVOKED' ||
    clientIdRef.status === 'EXPIRED' ||
    clientIdRef.status === 'REVOKED' ||
    (accessTokenRef.expiresAt !== undefined && Date.parse(accessTokenRef.expiresAt) <= now.getTime())
  ) {
    const config: DhanProviderConfig = {
      providerId: DHAN_PROVIDER_ID,
      baseUrl,
      timeoutMs,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
      accessTokenRef,
      clientIdRef,
      missingKeys: [],
    };
    return {
      ok: false,
      config,
      failure: {
        code: 'CREDENTIALS_EXPIRED',
        message: 'Dhan credential reference is expired or revoked.',
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
 *
 * DISCLOSURE (W-03 / D-7 §4.4). This used to publish the access-token and client-id key paths —
 * the `vault://` references themselves — and IRR copied them into its health report. D-7 makes
 * `vault://` references and any secret-store location a MUST NOT on every surface, so the summary
 * now reports only whether each reference is configured, and which vault provider member was
 * admitted. Both are on the D-7 MAY list; neither locates the store. Nothing here can carry a
 * credential, a path or a carrier name.
 */
export function describeDhanConfig(config: DhanProviderConfig): Record<string, string> {
  const refs = [config.clientIdRef, config.accessTokenRef].filter(
    (ref): ref is NonNullable<typeof ref> => ref !== undefined
  );
  const providers = Array.from(new Set(refs.map((ref) => ref.vaultProvider))).sort();
  return {
    providerId: config.providerId,
    baseUrl: config.baseUrl,
    timeoutMs: String(config.timeoutMs),
    readiness: config.readiness,
    clientIdRefConfigured: config.clientIdRef === undefined ? 'NO' : 'YES',
    accessTokenRefConfigured: config.accessTokenRef === undefined ? 'NO' : 'YES',
    vaultProvider: providers.length === 0 ? 'UNCONFIGURED' : providers.join(','),
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
  /** Optional ISO-8601 UTC expiry of the short-lived Dhan access token. */
  readonly expiresAt?: string;
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
