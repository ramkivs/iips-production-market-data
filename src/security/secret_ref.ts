/**
 * Institutional Investment Platform System (IIPS)
 * SecretRef Architecture & Zero-Plaintext Security (P03 / AD-17)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

export type VaultProvider =
  | 'LOCAL_MOCK_VAULT'
  | 'AWS_SECRETS_MANAGER'
  | 'HASHICORP_VAULT'
  | 'AZURE_KEY_VAULT'
  | 'TEST_ENCLAVE'
  | 'WINDOWS_DPAPI';

/**
 * Provider admission (W-01 / D-1).
 *
 * Single source of truth for the admitted provider set: `validateSecretRef`
 * validates against this list and the P03 suite (WSA-P03) asserts its contents,
 * so a provider can never be documented here without being validated (or
 * admitted in the union without appearing here).
 *
 * `WINDOWS_DPAPI` is admitted by D-1 (Windows DPAPI, user scope) and is added
 * purely additively: no existing provider's behaviour changes.
 */
export const VAULT_PROVIDERS: readonly VaultProvider[] = Object.freeze([
  'LOCAL_MOCK_VAULT',
  'AWS_SECRETS_MANAGER',
  'HASHICORP_VAULT',
  'AZURE_KEY_VAULT',
  'TEST_ENCLAVE',
  'WINDOWS_DPAPI',
]);

/** Windows DPAPI (user scope) provider identifier admitted by D-1 / W-01. */
export const WINDOWS_DPAPI_VAULT_PROVIDER: VaultProvider = 'WINDOWS_DPAPI';

/**
 * D-1 two-key-path convention — one path per secret, never one path shared by
 * both. The Dhan client id (stable) and the Dhan access token (24-hour) are
 * separate secrets with separate lifecycles and must be independently
 * addressable, independently rotatable and independently diagnosable.
 */
export const DHAN_CLIENT_ID_SECRET_NAME = 'client-id';
export const DHAN_ACCESS_TOKEN_SECRET_NAME = 'access-token';

/** Canonical key path for the Dhan client id secret. */
export const DHAN_CLIENT_ID_KEY_PATH = `vault://dhan/${DHAN_CLIENT_ID_SECRET_NAME}`;

/** Canonical key path for the Dhan access token secret. */
export const DHAN_ACCESS_TOKEN_KEY_PATH = `vault://dhan/${DHAN_ACCESS_TOKEN_SECRET_NAME}`;

/** The two governed Dhan key paths, addressable by secret role. */
export const DHAN_SECRET_KEY_PATHS: Readonly<{
  clientId: typeof DHAN_CLIENT_ID_KEY_PATH;
  accessToken: typeof DHAN_ACCESS_TOKEN_KEY_PATH;
}> = Object.freeze({
  clientId: DHAN_CLIENT_ID_KEY_PATH,
  accessToken: DHAN_ACCESS_TOKEN_KEY_PATH,
});

export type SecretRefStatus = 'ACTIVE' | 'ROTATING' | 'REVOKED' | 'EXPIRED';

export interface SecretRef {
  secretId: string;
  vaultProvider: VaultProvider;
  keyPath: string; // Governed URI or vault path, e.g. "vault://market-data/mock-provider/api-key"
  version: string;
  status: SecretRefStatus;
  expiresAt?: string; // ISO-8601 UTC
}

/**
 * Structural parts of a governed `vault://` key path.
 * `scope` addresses the store location; `secretName` addresses one secret.
 */
export interface VaultKeyPathParts {
  /** Namespace segments preceding the secret name (at least one). */
  readonly scope: readonly string[];
  /** Final segment: the individual secret addressed by this path. */
  readonly secretName: string;
}

const VAULT_KEY_PATH_SCHEME = 'vault://';

/**
 * Parses a `vault://<scope...>/<secret>` key path into its structural parts.
 *
 * Returns `null` for anything that does not identify exactly one secret:
 * a missing scheme, a bare namespace (`vault://dhan`), empty segments
 * (`vault://dhan/`, `vault:///client-id`, `vault://dhan//access-token`),
 * query strings, fragments, or segments padded with whitespace.
 *
 * This is what makes the D-1 rule "one path per secret, never one path for
 * both" mechanically enforceable: a path with no distinct secret segment
 * cannot address two independent secrets.
 */
export function parseVaultKeyPath(keyPath: string): VaultKeyPathParts | null {
  if (typeof keyPath !== 'string' || !keyPath.startsWith(VAULT_KEY_PATH_SCHEME)) {
    return null;
  }

  const remainder = keyPath.slice(VAULT_KEY_PATH_SCHEME.length);
  if (remainder.length === 0 || remainder.includes('?') || remainder.includes('#')) {
    return null;
  }

  const segments = remainder.split('/');
  if (segments.length < 2) return null;
  if (segments.some((segment) => segment.length === 0 || segment.trim() !== segment)) {
    return null;
  }

  return {
    scope: segments.slice(0, -1),
    secretName: segments[segments.length - 1],
  };
}

export interface DhanSecretKeyPathPair {
  readonly clientIdKeyPath: string;
  readonly accessTokenKeyPath: string;
}

/**
 * Validates the D-1 two-key-path convention for the Dhan credential pair.
 *
 * Rules:
 *  - both paths must be governed `vault://` paths identifying exactly one secret;
 *  - the client id path must name the `client-id` secret and the access token
 *    path must name the `access-token` secret (roles are not interchangeable);
 *  - the two paths must be distinct — one path may never address both secrets.
 *
 * Error messages are deliberately generic and never echo the offending path.
 */
export function validateDhanSecretKeyPaths(
  pair: Partial<DhanSecretKeyPathPair> | null | undefined
): { isValid: boolean; error?: string } {
  if (!pair || typeof pair !== 'object') {
    return { isValid: false, error: 'Dhan credential key paths must be provided as an object' };
  }

  const clientParts =
    typeof pair.clientIdKeyPath === 'string' ? parseVaultKeyPath(pair.clientIdKeyPath) : null;
  const tokenParts =
    typeof pair.accessTokenKeyPath === 'string' ? parseVaultKeyPath(pair.accessTokenKeyPath) : null;

  if (!clientParts || !tokenParts) {
    return {
      isValid: false,
      error:
        'each Dhan credential must use its own vault://<scope>/<secret> key path naming exactly one secret',
    };
  }

  if (clientParts.secretName !== DHAN_CLIENT_ID_SECRET_NAME) {
    return {
      isValid: false,
      error: `the Dhan client id must use a key path ending in ${DHAN_CLIENT_ID_SECRET_NAME}`,
    };
  }

  if (tokenParts.secretName !== DHAN_ACCESS_TOKEN_SECRET_NAME) {
    return {
      isValid: false,
      error: `the Dhan access token must use a key path ending in ${DHAN_ACCESS_TOKEN_SECRET_NAME}`,
    };
  }

  if (pair.clientIdKeyPath === pair.accessTokenKeyPath) {
    return {
      isValid: false,
      error: 'the client id and the access token must use separate key paths',
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a given object is a valid, well-formed SecretRef.
 */
export function validateSecretRef(ref: unknown): { isValid: boolean; error?: string } {
  if (!ref || typeof ref !== 'object') {
    return { isValid: false, error: 'SecretRef must be a non-null object' };
  }

  const s = ref as Partial<SecretRef>;

  if (!s.secretId || typeof s.secretId !== 'string') {
    return { isValid: false, error: 'SecretRef.secretId is required and must be a string' };
  }

  const validProviders: readonly VaultProvider[] = VAULT_PROVIDERS;
  if (!s.vaultProvider || !validProviders.includes(s.vaultProvider)) {
    return { isValid: false, error: `Invalid vaultProvider: ${s.vaultProvider}` };
  }

  if (!s.keyPath || typeof s.keyPath !== 'string' || !s.keyPath.startsWith('vault://')) {
    return { isValid: false, error: 'SecretRef.keyPath must start with vault:// URI scheme' };
  }

  // W-01 / D-1: a Windows DPAPI reference must address exactly one secret.
  // Other providers keep their pre-W-01 behaviour (scheme check only).
  if (s.vaultProvider === WINDOWS_DPAPI_VAULT_PROVIDER && parseVaultKeyPath(s.keyPath) === null) {
    return {
      isValid: false,
      error: `SecretRef.keyPath for ${WINDOWS_DPAPI_VAULT_PROVIDER} must be vault://<scope>/<secret> and identify exactly one secret`,
    };
  }

  if (!s.version || typeof s.version !== 'string') {
    return { isValid: false, error: 'SecretRef.version is required' };
  }

  const validStatuses: SecretRefStatus[] = ['ACTIVE', 'ROTATING', 'REVOKED', 'EXPIRED'];
  if (!s.status || !validStatuses.includes(s.status)) {
    return { isValid: false, error: `Invalid SecretRef.status: ${s.status}` };
  }

  return { isValid: true };
}

/**
 * Creates a valid SecretRef descriptor for local fixture / dev mode.
 */
export function createMockSecretRef(keyName: string, version: string = 'v1'): SecretRef {
  return {
    secretId: `sec-${keyName}-${Date.now()}`,
    vaultProvider: 'LOCAL_MOCK_VAULT',
    keyPath: `vault://market-data/mock/${keyName}`,
    version,
    status: 'ACTIVE',
  };
}
