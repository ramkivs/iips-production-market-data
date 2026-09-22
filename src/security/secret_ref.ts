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
  | 'TEST_ENCLAVE';

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

  const validProviders: VaultProvider[] = [
    'LOCAL_MOCK_VAULT',
    'AWS_SECRETS_MANAGER',
    'HASHICORP_VAULT',
    'AZURE_KEY_VAULT',
    'TEST_ENCLAVE',
  ];
  if (!s.vaultProvider || !validProviders.includes(s.vaultProvider)) {
    return { isValid: false, error: `Invalid vaultProvider: ${s.vaultProvider}` };
  }

  if (!s.keyPath || typeof s.keyPath !== 'string' || !s.keyPath.startsWith('vault://')) {
    return { isValid: false, error: 'SecretRef.keyPath must start with vault:// URI scheme' };
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
