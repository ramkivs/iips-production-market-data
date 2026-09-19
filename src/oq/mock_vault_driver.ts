/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-G / Package P16: SecretRef Enterprise Vault Driver Simulation (P16-02)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W6-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { SecretRef, validateSecretRef } from '../security/secret_ref.js';
import { scanTextForSecrets } from '../security/scanner.js';

export interface VaultSecretEntry {
  vaultPath: string;
  version: number;
  syntheticCredentialToken: string; // Simulated opaque token
  expiresAt: string; // ISO-8601 UTC
  isRevoked: boolean;
}

export class SecretResolutionError extends Error {
  public readonly secretRef: SecretRef;
  public readonly reason: 'EXPIRED' | 'REVOKED' | 'UNRESOLVED' | 'INVALID_URI';

  constructor(secretRef: SecretRef, reason: 'EXPIRED' | 'REVOKED' | 'UNRESOLVED' | 'INVALID_URI', details: string) {
    // Ensure error message does not include any potential plaintext credential values
    super(`SecretRef resolution failed closed for '${secretRef.keyPath}' [Reason: ${reason}]: ${details}`);
    this.name = 'SecretResolutionError';
    this.secretRef = secretRef;
    this.reason = reason;
  }
}

export class MockEnterpriseVaultDriver {
  private secrets: Map<string, VaultSecretEntry> = new Map();

  constructor() {
    this.seedDefaultMockCredentials();
  }

  private seedDefaultMockCredentials(): void {
    // Seed mock opaque credentials with standard expiry
    this.secrets.set('market-data/primary-feed', {
      vaultPath: 'market-data/primary-feed',
      version: 1,
      syntheticCredentialToken: 'sim_tok_prim_998877665544332211',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isRevoked: false,
    });

    this.secrets.set('market-data/backup-feed', {
      vaultPath: 'market-data/backup-feed',
      version: 1,
      syntheticCredentialToken: 'sim_tok_back_112233445566778899',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isRevoked: false,
    });

    this.secrets.set('market-data/expired-feed', {
      vaultPath: 'market-data/expired-feed',
      version: 1,
      syntheticCredentialToken: 'sim_tok_exp_000000000000000000',
      expiresAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Expired 1 day ago
      isRevoked: false,
    });

    this.secrets.set('market-data/revoked-feed', {
      vaultPath: 'market-data/revoked-feed',
      version: 1,
      syntheticCredentialToken: 'sim_tok_rev_000000000000000000',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isRevoked: true, // Explicitly revoked
    });
  }

  /**
   * Resolves a SecretRef against the mock vault driver. Fails closed if expired, revoked, or unmapped.
   */
  public resolveSecret(ref: SecretRef, asOf: string = new Date().toISOString()): string {
    const val = validateSecretRef(ref);
    if (!val.isValid) {
      throw new SecretResolutionError(ref, 'INVALID_URI', val.error || 'Invalid SecretRef structure');
    }

    const cleanPath = ref.keyPath.replace(/^vault:\/\//, '').split('#')[0];
    const entry = this.secrets.get(cleanPath);
    if (!entry) {
      throw new SecretResolutionError(ref, 'UNRESOLVED', `Path not found in vault registry`);
    }

    if (entry.isRevoked || ref.status === 'REVOKED') {
      throw new SecretResolutionError(ref, 'REVOKED', `Credential at path has been administratively revoked`);
    }

    const asOfMs = Date.parse(asOf);
    const expiresMs = Date.parse(entry.expiresAt);
    if (asOfMs > expiresMs || ref.status === 'EXPIRED') {
      throw new SecretResolutionError(ref, 'EXPIRED', `Credential expired at ${entry.expiresAt}`);
    }

    return entry.syntheticCredentialToken;
  }

  /**
   * Simulates zero-downtime credential rotation
   */
  public rotateCredential(vaultPath: string, newSyntheticToken: string): void {
    const entryPath = vaultPath.replace(/^vault:\/\//, '').split('#')[0];
    const existing = this.secrets.get(entryPath);
    if (!existing) {
      throw new Error(`Cannot rotate non-existent path '${entryPath}'`);
    }

    this.secrets.set(entryPath, {
      vaultPath: entryPath,
      version: existing.version + 1,
      syntheticCredentialToken: newSyntheticToken,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      isRevoked: false,
    });
  }

  /**
   * Administratively revokes a credential
   */
  public revokeCredential(vaultPath: string): void {
    const entryPath = vaultPath.replace(/^vault:\/\//, '').split('#')[0];
    const existing = this.secrets.get(entryPath);
    if (existing) {
      existing.isRevoked = true;
    }
  }

  /**
   * Audits generated text or object to ensure zero secret leakage
   */
  public static verifyZeroPlaintextLeakage(content: string): boolean {
    const violations = scanTextForSecrets(content);
    return violations.length === 0;
  }
}
