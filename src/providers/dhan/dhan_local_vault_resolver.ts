/**
 * Institutional Investment Platform System (IIPS)
 * IPD-Owned Local Host-Vault Credential Resolver & Adapter Contract (Stage 1 Operational Wiring)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext) / WS-A P03 (SecretRef)
 *
 * HOST VAULT INSPECTION FINDING (2026-11-08):
 *  Neither IPD (`src/security/secret_ref.ts`, `package.json`) nor the governed Windows
 *  workstation setup (`windows-setup/*`) includes an already-supported Windows secure vault
 *  integration (no Windows Credential Manager / Advapi32 CredReadW binding, no DPAPI
 *  CryptUnprotectData carrier contract, no PowerShell SecretStore integration, and no cloud
 *  or enterprise vault SDK).
 *
 *  Per Stage 1 governance:
 *   - No unsupported vault technology is silently selected or guessed.
 *   - The exact IPD-internal host-vault adapter contract (`LocalHostVaultSecretBackend`) and
 *     fail-closed `LocalHostVaultDhanCredentialResolver` are defined here while preserving
 *     the existing P03 `SecretRef` contract verbatim.
 *   - The default backend (`DisabledWindowsHostVaultBackend`) keeps live Dhan credential
 *     resolution explicitly DISABLED and fails closed until an approved Windows host-vault
 *     integration is provisioned under Program Authority governance.
 *   - Exclusively owned by IPD server-side code: NOT exported on `./dhan-server` and NEVER
 *     included in browser closures.
 */

import {
  SecretRef,
  SecretRefStatus,
  validateSecretRef,
} from '../../security/secret_ref.js';
import {
  DhanCredentialMaterial,
  DhanCredentialResolver,
  DhanEnvSource,
  DhanProviderConfig,
  isDhanProductionEnvironment,
} from './dhan_config.js';
import { DhanProductionNotAuthorizedError } from './dhan_api_client.js';
import { describeUtcTimestampRejection, parseStrictUtcTimestamp } from './dhan_utc_timestamp.js';
import type { DpapiCarrierFailureReason } from './dhan_dpapi_carrier.js';

/**
 * Distinct, scrubbed resolution outcomes.
 *
 * The original Stage-1 reasons remain; W-02 adds the carrier and child-process reasons so
 * a DPAPI failure can be diagnosed without ever exposing a path, a value or child output.
 */
export type DhanVaultFailureReason =
  | 'EXPIRED'
  | 'REVOKED'
  | 'INVALID_SECRET_REF'
  | 'VERSION_MISMATCH'
  | 'BACKEND_FAILURE'
  | 'CHILD_PROCESS_FAILURE'
  | DpapiCarrierFailureReason;

export type DhanVaultMappedCode =
  | 'CREDENTIALS_EXPIRED'
  | 'CONFIGURATION_INCOMPLETE'
  | 'CREDENTIALS_UNAVAILABLE';

/**
 * Operator-safe vault resolution error.
 * Carries structured `reason` and `code` fields consumed by `DhanApiClient` and
 * NEVER includes resolved secret material or raw backend payloads.
 */
export class DhanVaultResolutionError extends Error {
  public readonly reason: DhanVaultFailureReason;
  public readonly code: DhanVaultMappedCode;

  constructor(reason: DhanVaultFailureReason, code: DhanVaultMappedCode, safeMessage: string) {
    super(safeMessage);
    this.name = 'DhanVaultResolutionError';
    this.reason = reason;
    this.code = code;
  }
}

/**
 * Ephemeral in-memory record returned by a concrete local host-vault backend.
 * Instances MUST NOT be persisted, logged, cached across requests or serialized.
 */
export interface LocalHostVaultSecretRecord {
  /** Resolved secret value (kept strictly in ephemeral call-scoped memory). */
  readonly secretValue: string;
  /** Lifecycle state reported by the host vault for this secret entry. */
  readonly status: SecretRefStatus;
  /** Optional ISO-8601 UTC expiry timestamp (e.g. Dhan 24-hour access-token expiry). */
  readonly expiresAt?: string;
  /** Optional secret version tag for P03 SecretRef.version pinning verification. */
  readonly version?: string;
}

/**
 * Operator-safe readiness descriptor for the configured host-vault backend.
 * Contains zero credential material or secret paths.
 */
export interface LocalHostVaultBackendReadiness {
  readonly backendId: string;
  readonly liveResolutionSupported: boolean;
  readonly prerequisiteSummary: string;
}

/**
 * Governed adapter contract that a future approved Windows local secure vault
 * integration must implement in IPD.
 */
export interface LocalHostVaultSecretBackend {
  readonly backendId: string;
  describeReadiness(): LocalHostVaultBackendReadiness;
  /**
   * Optional asynchronous readiness probe (W-02).
   *
   * A backend whose readiness requires I/O — a DPAPI probe read, an owner-only DACL
   * check — cannot answer synchronously. When this is present the resolver awaits it
   * instead of trusting the synchronous verdict, so live resolution is gated on real
   * evidence. Backends that omit it (including `DisabledWindowsHostVaultBackend`) keep
   * the Stage-1 behaviour exactly.
   */
  probeReadiness?(ref?: SecretRef): Promise<LocalHostVaultBackendReadiness>;
  readSecret(ref: SecretRef, asOfUtc: string): Promise<LocalHostVaultSecretRecord | null>;
}

export const UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID = 'UNPROVISIONED_WINDOWS_HOST_VAULT';

export const WINDOWS_HOST_VAULT_PREREQUISITE =
  'No approved Windows local host secure vault integration exists in IPD; requires Program Authority selection and provisioning of a concrete Windows secret-store adapter (e.g. DPAPI / Windows Credential Manager) before live Dhan credential resolution can be enabled.';

/**
 * Default backend on the current host environment.
 * Keeps live credential resolution explicitly disabled and fails closed (`null`)
 * without invoking any unsupported OS command, file or network resource.
 */
export class DisabledWindowsHostVaultBackend implements LocalHostVaultSecretBackend {
  public readonly backendId = UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID;

  public describeReadiness(): LocalHostVaultBackendReadiness {
    return {
      backendId: this.backendId,
      liveResolutionSupported: false,
      prerequisiteSummary: WINDOWS_HOST_VAULT_PREREQUISITE,
    };
  }

  public async readSecret(_ref: SecretRef, _asOfUtc: string): Promise<LocalHostVaultSecretRecord | null> {
    return null;
  }
}

export interface LocalHostVaultDhanCredentialResolverOptions {
  /** Concrete or synthetic test backend; defaults to DisabledWindowsHostVaultBackend. */
  readonly backend?: LocalHostVaultSecretBackend;
  /** Injected clock for deterministic expiry evaluation. */
  readonly now?: () => Date;
  /** Optional environment map override (defaults to process.env). */
  readonly env?: DhanEnvSource;
}

/**
 * IPD-owned Dhan credential resolver backed by `LocalHostVaultSecretBackend`.
 *
 * Enforces:
 *  - Non-production execution only (`PRODUCTION_NOT_AUTHORIZED` in production).
 *  - Full P03 `SecretRef` validation (`vault://` URI, `VaultProvider`, `status`, `version`).
 *  - Fail-closed handling of missing (`CREDENTIALS_UNAVAILABLE`), expired/revoked
 *    (`CREDENTIALS_EXPIRED`), and malformed/version-mismatched credentials.
 *  - Zero plaintext credential storage, caching, logging or error reflection.
 */
export class LocalHostVaultDhanCredentialResolver implements DhanCredentialResolver {
  private readonly backend: LocalHostVaultSecretBackend;
  private readonly now: () => Date;
  private readonly envOverride?: DhanEnvSource;

  constructor(options: LocalHostVaultDhanCredentialResolverOptions = {}) {
    this.backend = options.backend ?? new DisabledWindowsHostVaultBackend();
    this.now = options.now ?? (() => new Date());
    if (options.env !== undefined) {
      this.envOverride = options.env;
    }
  }

  public describeBackendReadiness(): LocalHostVaultBackendReadiness {
    return this.backend.describeReadiness();
  }

  /**
   * Awaited, evidence-based readiness (W-03).
   *
   * `describeReadiness()` is the synchronous Stage-1 verdict: for a backend that needs a probe
   * (`WindowsDpapiHostVaultBackend`) it is intentionally `false` until `probeReadiness()` has run.
   * Startup must therefore await this method before it reports readiness or enables vendor egress,
   * otherwise a provisioned host would always start with egress disabled.
   *
   * Never throws. A probe that fails for any reason yields an unready verdict with a fixed,
   * non-locating summary, so a broken backend cannot crash startup or accidentally enable egress.
   */
  public async probeBackendReadiness(): Promise<LocalHostVaultBackendReadiness> {
    if (this.backend.probeReadiness === undefined) {
      return this.backend.describeReadiness();
    }
    try {
      return await this.backend.probeReadiness();
    } catch {
      return {
        backendId: this.backend.backendId,
        liveResolutionSupported: false,
        prerequisiteSummary:
          'Host vault readiness probe failed; live credential resolution is disabled.',
      };
    }
  }

  private validateRefPreFlight(ref: SecretRef, nowMs: number): void {
    const check = validateSecretRef(ref);
    if (!check.isValid) {
      throw new DhanVaultResolutionError(
        'INVALID_SECRET_REF',
        'CONFIGURATION_INCOMPLETE',
        'Dhan SecretRef failed P03 contract validation'
      );
    }

    if (ref.status === 'REVOKED') {
      throw new DhanVaultResolutionError(
        'REVOKED',
        'CREDENTIALS_EXPIRED',
        'Dhan SecretRef is marked REVOKED'
      );
    }

    if (ref.status === 'EXPIRED') {
      throw new DhanVaultResolutionError(
        'EXPIRED',
        'CREDENTIALS_EXPIRED',
        'Dhan SecretRef is marked EXPIRED'
      );
    }

    if (ref.expiresAt !== undefined) {
      // Strict: an explicit timezone is required, so expiry means the same thing on every host.
      const expiry = parseStrictUtcTimestamp(ref.expiresAt);
      if (!expiry.ok) {
        throw new DhanVaultResolutionError(
          'INVALID_SECRET_REF',
          'CONFIGURATION_INCOMPLETE',
          `Dhan SecretRef expiresAt ${describeUtcTimestampRejection(expiry.reason)}`
        );
      }
      if (expiry.epochMs <= nowMs) {
        throw new DhanVaultResolutionError(
          'EXPIRED',
          'CREDENTIALS_EXPIRED',
          'Dhan SecretRef has passed its expiresAt timestamp'
        );
      }
    }
  }

  private validateResolvedRecord(
    ref: SecretRef,
    record: LocalHostVaultSecretRecord | null,
    nowMs: number
  ): LocalHostVaultSecretRecord | null {
    if (!record) return null;

    if (record.status === 'REVOKED') {
      throw new DhanVaultResolutionError(
        'REVOKED',
        'CREDENTIALS_EXPIRED',
        'Host vault secret entry is REVOKED'
      );
    }

    if (record.status === 'EXPIRED') {
      throw new DhanVaultResolutionError(
        'EXPIRED',
        'CREDENTIALS_EXPIRED',
        'Host vault secret entry is EXPIRED'
      );
    }

    if (record.expiresAt !== undefined) {
      const expiry = parseStrictUtcTimestamp(record.expiresAt);
      if (!expiry.ok) {
        throw new DhanVaultResolutionError(
          'INVALID_SECRET_REF',
          'CONFIGURATION_INCOMPLETE',
          `Host vault secret entry expiresAt ${describeUtcTimestampRejection(expiry.reason)}`
        );
      }
      if (expiry.epochMs <= nowMs) {
        throw new DhanVaultResolutionError(
          'EXPIRED',
          'CREDENTIALS_EXPIRED',
          'Host vault secret entry has expired'
        );
      }
    }

    if (record.version !== undefined && record.version !== ref.version) {
      throw new DhanVaultResolutionError(
        'VERSION_MISMATCH',
        'CREDENTIALS_UNAVAILABLE',
        'Host vault secret entry version does not match requested SecretRef version'
      );
    }

    if (typeof record.secretValue !== 'string' || !record.secretValue.trim()) {
      return null;
    }

    return record;
  }

  public async resolve(config: DhanProviderConfig): Promise<DhanCredentialMaterial | null> {
    const env: DhanEnvSource =
      this.envOverride ?? (typeof process !== 'undefined' && process.env ? process.env : {});

    if (isDhanProductionEnvironment(env)) {
      throw new DhanProductionNotAuthorizedError(
        'Production Dhan credential resolution is not authorized'
      );
    }

    if (!config.clientIdRef || !config.accessTokenRef) {
      return null;
    }

    const nowDate = this.now();
    const nowMs = nowDate.getTime();
    const nowIso = nowDate.toISOString();

    this.validateRefPreFlight(config.clientIdRef, nowMs);
    this.validateRefPreFlight(config.accessTokenRef, nowMs);

    // Prefer the asynchronous, evidence-based probe when the backend offers one (W-02);
    // otherwise the Stage-1 synchronous verdict is authoritative.
    const readiness = this.backend.probeReadiness
      ? await this.backend.probeReadiness()
      : this.backend.describeReadiness();
    if (!readiness.liveResolutionSupported) {
      // Live credential resolution remains disabled until an approved host-vault backend is provisioned.
      return null;
    }

    let rawClientRecord: LocalHostVaultSecretRecord | null;
    let rawTokenRecord: LocalHostVaultSecretRecord | null;
    try {
      [rawClientRecord, rawTokenRecord] = await Promise.all([
        this.backend.readSecret(config.clientIdRef, nowIso),
        this.backend.readSecret(config.accessTokenRef, nowIso),
      ]);
    } catch (err: unknown) {
      if (err instanceof DhanVaultResolutionError || err instanceof DhanProductionNotAuthorizedError) {
        throw err;
      }
      // Deliberately suppress raw backend error messages so vault internals or secrets never leak.
      throw new DhanVaultResolutionError(
        'BACKEND_FAILURE',
        'CREDENTIALS_UNAVAILABLE',
        'Host vault secret lookup failed closed'
      );
    }

    const clientRecord = this.validateResolvedRecord(config.clientIdRef, rawClientRecord, nowMs);
    const tokenRecord = this.validateResolvedRecord(config.accessTokenRef, rawTokenRecord, nowMs);
    if (!clientRecord || !tokenRecord) {
      return null;
    }

    const effectiveExpiresAt = tokenRecord.expiresAt ?? config.accessTokenRef.expiresAt;
    return {
      clientId: clientRecord.secretValue,
      accessToken: tokenRecord.secretValue,
      ...(effectiveExpiresAt !== undefined ? { expiresAt: effectiveExpiresAt } : {}),
    };
  }
}
