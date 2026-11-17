/**
 * Institutional Investment Platform System (IIPS)
 * Windows DPAPI (user scope) Host-Vault Backend (W-02 / D-1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), W-02
 *
 * Replaces nothing: `DisabledWindowsHostVaultBackend` remains the default in
 * `dhan_local_vault_resolver.ts` and is untouched. W-03 owns the allow-listed selector
 * that chooses between the two; this module only provides the real backend.
 *
 * GUARANTEES
 *  - Fail closed. Every failure is a `DhanVaultResolutionError` with its own scrubbed
 *    reason; no partial record, no silent null-for-success, no repair.
 *  - Readiness is evidence-based: both carriers must exist, satisfy the D-1 owner-only
 *    DACL, parse against a known schema version, and the requested carrier must pass a
 *    probe decryption before `liveResolutionSupported` may be true.
 *  - Zero plaintext at rest in this process: a decrypted value is held in one short-lived
 *    local binding, is never copied into a field, log record, diagnostic object or error,
 *    and is released as soon as the caller has taken it.
 *
 * READINESS IS ASYNCHRONOUS BY CONSTRUCTION
 *  A probe read is a child-process DPAPI call, so a complete verdict cannot be produced
 *  synchronously. `probeReadiness()` performs the full evidence check; the synchronous
 *  `describeReadiness()` (the Stage-1 `LocalHostVaultSecretBackend` shape) reports the
 *  last probed verdict and stays fail-closed (`false`) when no probe has run in this
 *  instance. `LocalHostVaultDhanCredentialResolver` awaits `probeReadiness()` when a
 *  backend provides it, so live resolution is gated on real evidence rather than on
 *  cached optimism.
 *
 * THREAT MODEL (D-1, restated so it cannot be overstated): DPAPI user scope protects the
 * secret AT REST against other users, offline disk inspection and file copying. It does
 * NOT protect against another process running as the same Windows user.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import { existsSync, readFileSync } from 'node:fs';

import {
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  SecretRef,
  WINDOWS_DPAPI_VAULT_PROVIDER,
} from '../../security/secret_ref.js';
import {
  DPAPI_CANONICAL_CARRIER_DIRECTORY,
  DpapiCarrierEnvelope,
  DpapiCarrierRole,
  dpapiCarrierPathFor,
  findGitWorkingTreeRoot,
  parseDpapiCarrierEnvelope,
  resolveDpapiCarrierRole,
} from './dhan_dpapi_carrier.js';
import { createPowerShellDpapiProcessRunner, DpapiProcessRunner } from './dhan_dpapi_process.js';
import {
  DhanVaultFailureReason,
  DhanVaultMappedCode,
  DhanVaultResolutionError,
  LocalHostVaultBackendReadiness,
  LocalHostVaultSecretBackend,
  LocalHostVaultSecretRecord,
} from './dhan_local_vault_resolver.js';

/** Backend identifier surfaced by readiness and (from W-03) daemon diagnostics. */
export const WINDOWS_DPAPI_BACKEND_ID = 'WINDOWS_DPAPI_USER_SCOPE';

/** The governed `vault://` key path per carrier role. */
export const WINDOWS_DPAPI_GOVERNED_KEY_PATHS = Object.freeze({
  clientId: DHAN_CLIENT_ID_KEY_PATH,
  accessToken: DHAN_ACCESS_TOKEN_KEY_PATH,
});

export interface WindowsDpapiHostVaultBackendOptions {
  /** Absolute carrier directory. Defaults to `H:\IIPS\runtime\dhan-secrets`. */
  readonly carrierDirectory?: string;
  /** Injected child-process runner. Defaults to the PowerShell DPAPI runner. */
  readonly processRunner?: DpapiProcessRunner;
  /** Injected platform probe (tests only). Defaults to `process.platform`. */
  readonly platform?: () => NodeJS.Platform;
  /** Injected clock. Defaults to `new Date()`. */
  readonly now?: () => Date;
}

interface AclEntry {
  readonly path: string;
  readonly exists: boolean;
  readonly protected: boolean;
  readonly onlyOwnerAndSystem: boolean;
  readonly ownerIsCurrentUser: boolean;
}

const SUMMARY_OK = 'DPAPI user-scope carriers are present, owner-only, schema-valid and readable.';
const SUMMARY_UNPROVISIONED =
  'DPAPI user-scope Dhan credential carriers are not provisioned; live credential resolution is disabled.';
const SUMMARY_UNPROBED =
  'DPAPI carriers are present but have not been probed in this process; live credential resolution is disabled until a probe succeeds.';

/** Fixed, non-locating messages. No path, no carrier content, no child output. */
const MESSAGES: Readonly<Record<DhanVaultFailureReason, string>> = Object.freeze({
  INVALID_SECRET_REF: 'Dhan SecretRef does not name a governed Windows DPAPI secret',
  CARRIER_LOCATION_INVALID: 'DPAPI carrier location is not permitted',
  CARRIER_MISSING: 'DPAPI carrier is not present',
  CARRIER_PRINCIPAL_MISMATCH: 'DPAPI carrier access restriction is not owner-only',
  CARRIER_UNREADABLE: 'DPAPI carrier is present but cannot be read',
  CARRIER_CORRUPT: 'DPAPI carrier is malformed',
  UNKNOWN_SCHEMA_VERSION: 'DPAPI carrier uses an unknown schema version',
  SECRET_ID_MISMATCH: 'DPAPI carrier does not match the requested secret identifier',
  VERSION_MISMATCH: 'DPAPI carrier version does not match the requested SecretRef version',
  EXPIRED: 'DPAPI carrier has expired',
  REVOKED: 'DPAPI carrier is revoked',
  CHILD_PROCESS_FAILURE: 'DPAPI child process failed',
  BACKEND_FAILURE: 'DPAPI backend failed closed',
});

const MAPPED_CODE: Readonly<Record<DhanVaultFailureReason, DhanVaultMappedCode>> = Object.freeze({
  INVALID_SECRET_REF: 'CONFIGURATION_INCOMPLETE',
  CARRIER_LOCATION_INVALID: 'CONFIGURATION_INCOMPLETE',
  CARRIER_MISSING: 'CREDENTIALS_UNAVAILABLE',
  CARRIER_PRINCIPAL_MISMATCH: 'CREDENTIALS_UNAVAILABLE',
  CARRIER_UNREADABLE: 'CREDENTIALS_UNAVAILABLE',
  CARRIER_CORRUPT: 'CONFIGURATION_INCOMPLETE',
  UNKNOWN_SCHEMA_VERSION: 'CONFIGURATION_INCOMPLETE',
  SECRET_ID_MISMATCH: 'CONFIGURATION_INCOMPLETE',
  VERSION_MISMATCH: 'CREDENTIALS_UNAVAILABLE',
  EXPIRED: 'CREDENTIALS_EXPIRED',
  REVOKED: 'CREDENTIALS_EXPIRED',
  CHILD_PROCESS_FAILURE: 'CREDENTIALS_UNAVAILABLE',
  BACKEND_FAILURE: 'CREDENTIALS_UNAVAILABLE',
});

function dpapiError(reason: DhanVaultFailureReason): DhanVaultResolutionError {
  return new DhanVaultResolutionError(reason, MAPPED_CODE[reason], MESSAGES[reason]);
}

/**
 * Windows DPAPI (user scope) secret-store backend over the D-1 carriers.
 *
 * Read path: carrier lookup by the SecretRef's final key-path segment → location policy →
 * existence → owner-only DACL (directory and carrier) → envelope parse → metadata checks
 * against the SecretRef → expiry → child-process DPAPI unprotect.
 */
export class WindowsDpapiHostVaultBackend implements LocalHostVaultSecretBackend {
  public readonly backendId = WINDOWS_DPAPI_BACKEND_ID;

  private readonly carrierDirectory: string;
  private readonly runner: DpapiProcessRunner;
  private readonly platform: () => NodeJS.Platform;
  private readonly now: () => Date;

  /** Last probed verdict. Holds no secret material — a verdict only. */
  private lastProbe: LocalHostVaultBackendReadiness | null = null;

  constructor(options: WindowsDpapiHostVaultBackendOptions = {}) {
    this.carrierDirectory = options.carrierDirectory ?? DPAPI_CANONICAL_CARRIER_DIRECTORY;
    this.runner = options.processRunner ?? createPowerShellDpapiProcessRunner();
    this.platform = options.platform ?? (() => process.platform);
    this.now = options.now ?? (() => new Date());
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Readiness
  // ───────────────────────────────────────────────────────────────────────────

  private unready(summary: string): LocalHostVaultBackendReadiness {
    return { backendId: this.backendId, liveResolutionSupported: false, prerequisiteSummary: summary };
  }

  /**
   * Synchronous readiness — the Stage-1 `LocalHostVaultSecretBackend` shape.
   *
   * Reports the last verdict produced by `probeReadiness()` in this instance. When no
   * probe has run it performs the cheap synchronous checks (platform, location,
   * existence, envelope schema) only to choose an honest summary, and stays fail-closed.
   * Never throws.
   */
  public describeReadiness(): LocalHostVaultBackendReadiness {
    if (this.lastProbe) return this.lastProbe;

    try {
      if (this.platform() !== 'win32') {
        return this.unready(
          'Windows DPAPI is only available on the Windows platform; live credential resolution is disabled.'
        );
      }
      if (findGitWorkingTreeRoot(this.carrierDirectory) !== null) {
        return this.unready(
          'The DPAPI carrier directory must live outside a Git working tree; live credential resolution is disabled.'
        );
      }
      const clientPath = dpapiCarrierPathFor(this.carrierDirectory, 'clientId');
      const tokenPath = dpapiCarrierPathFor(this.carrierDirectory, 'accessToken');
      if (!existsSync(clientPath) || !existsSync(tokenPath)) {
        return this.unready(SUMMARY_UNPROVISIONED);
      }
      return this.unready(SUMMARY_UNPROBED);
    } catch {
      return this.unready(
        'DPAPI readiness could not be established; live credential resolution is disabled.'
      );
    }
  }

  /**
   * Full, evidence-based readiness probe (W-02).
   *
   * `liveResolutionSupported` is true only when: the platform is Windows; the carrier
   * directory is outside Git; both carriers exist; both the directory and each carrier
   * satisfy the D-1 owner-only DACL (inheritance disabled, owner + SYSTEM only, owner is
   * the current user); both envelopes parse against a known schema version; and the
   * requested carrier (or both, when no ref is given) decrypts in a probe read.
   *
   * Never throws; every prerequisite failure yields a fixed, non-locating summary.
   */
  public async probeReadiness(ref?: SecretRef): Promise<LocalHostVaultBackendReadiness> {
    const verdict = await this.evaluateReadiness(ref);
    this.lastProbe = verdict;
    return verdict;
  }

  private async evaluateReadiness(
    ref?: SecretRef
  ): Promise<LocalHostVaultBackendReadiness> {
    try {
      if (this.platform() !== 'win32') {
        return this.unready(
          'Windows DPAPI is only available on the Windows platform; live credential resolution is disabled.'
        );
      }
      if (findGitWorkingTreeRoot(this.carrierDirectory) !== null) {
        return this.unready(
          'The DPAPI carrier directory must live outside a Git working tree; live credential resolution is disabled.'
        );
      }

      const roles: DpapiCarrierRole[] = ['clientId', 'accessToken'];
      for (const role of roles) {
        if (!existsSync(dpapiCarrierPathFor(this.carrierDirectory, role))) {
          return this.unready(SUMMARY_UNPROVISIONED);
        }
      }

      let acl: AclEntry[];
      try {
        acl = await this.describeAcl([
          this.carrierDirectory,
          dpapiCarrierPathFor(this.carrierDirectory, 'clientId'),
          dpapiCarrierPathFor(this.carrierDirectory, 'accessToken'),
        ]);
      } catch {
        return this.unready(
          'DPAPI carrier access restriction could not be verified; live credential resolution is disabled.'
        );
      }
      if (acl.some((entry) => !isOwnerOnly(entry))) {
        return this.unready(
          'DPAPI carriers are not restricted to the owner and SYSTEM; live credential resolution is disabled.'
        );
      }

      const envelopes = new Map<DpapiCarrierRole, DpapiCarrierEnvelope>();
      for (const role of roles) {
        const parsed = this.loadEnvelope(role);
        if (!parsed.ok) {
          return this.unready(
            'A DPAPI carrier is malformed or uses an unknown schema version; live credential resolution is disabled.'
          );
        }
        envelopes.set(role, parsed.envelope);
      }

      let probeRoles: DpapiCarrierRole[] = roles;
      if (ref !== undefined) {
        const role = this.roleForRef(ref);
        if (role === null) {
          return this.unready(
            'The requested reference does not name a governed DPAPI carrier; live credential resolution is disabled.'
          );
        }
        probeRoles = [role];
      }

      for (const role of probeRoles) {
        const envelope = envelopes.get(role);
        if (envelope === undefined) continue;
        const probe = await this.unprotect(envelope.ciphertext);
        if (probe.kind !== 'ok' || probe.plaintext.length === 0) {
          return this.unready(
            'A DPAPI carrier could not be decrypted under the current user; live credential resolution is disabled.'
          );
        }
      }

      return {
        backendId: this.backendId,
        liveResolutionSupported: true,
        prerequisiteSummary: SUMMARY_OK,
      };
    } catch {
      return this.unready(
        'DPAPI readiness could not be established; live credential resolution is disabled.'
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Read path
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Resolves one carrier into an ephemeral record.
   *
   * The decrypted value is bound once, locally, and returned immediately; the backend
   * keeps no copy. Failures never return `null` — an absent or unusable credential is a
   * typed, scrubbed error so the caller can distinguish the causes.
   */
  public async readSecret(ref: SecretRef, asOfUtc: string): Promise<LocalHostVaultSecretRecord | null> {
    try {
      if (this.platform() !== 'win32') {
        throw dpapiError('CHILD_PROCESS_FAILURE');
      }

      const role = this.roleForRef(ref);
      if (role === null) {
        throw dpapiError('INVALID_SECRET_REF');
      }

      if (findGitWorkingTreeRoot(this.carrierDirectory) !== null) {
        throw dpapiError('CARRIER_LOCATION_INVALID');
      }

      const carrierPath = dpapiCarrierPathFor(this.carrierDirectory, role);
      if (!existsSync(carrierPath)) {
        throw dpapiError('CARRIER_MISSING');
      }

      // DACL first: a carrier another principal can read is unusable, independent of
      // whether decryption would happen to succeed.
      const acl = await this.describeAcl([this.carrierDirectory, carrierPath]);
      if (acl.some((entry) => !isOwnerOnly(entry))) {
        throw dpapiError('CARRIER_PRINCIPAL_MISMATCH');
      }

      const parsed = this.loadEnvelope(role);
      if (!parsed.ok) {
        throw dpapiError(parsed.reason);
      }
      const envelope = parsed.envelope;

      if (envelope.secretId !== ref.secretId) {
        throw dpapiError('SECRET_ID_MISMATCH');
      }
      if (envelope.vaultProvider !== ref.vaultProvider) {
        throw dpapiError('CARRIER_CORRUPT');
      }
      if (envelope.version !== ref.version) {
        throw dpapiError('VERSION_MISMATCH');
      }

      // D-1: the client id has no lifecycle of its own and therefore no expiry field.
      if (role === 'clientId' && envelope.expiresAtUtc !== undefined) {
        throw dpapiError('CARRIER_CORRUPT');
      }

      const asOfMs = Date.parse(asOfUtc);
      const effectiveAsOfMs = Number.isNaN(asOfMs) ? this.now().getTime() : asOfMs;
      if (envelope.expiresAtUtc !== undefined && Date.parse(envelope.expiresAtUtc) <= effectiveAsOfMs) {
        throw dpapiError('EXPIRED');
      }

      const probe = await this.unprotect(envelope.ciphertext);
      if (probe.kind === 'child-failure') {
        throw dpapiError('CHILD_PROCESS_FAILURE');
      }
      if (probe.kind === 'undecryptable') {
        throw dpapiError('CARRIER_UNREADABLE');
      }

      // Single short-lived binding: no field, no cache, no log.
      const secretValue = probe.plaintext;
      if (secretValue.length === 0) {
        throw dpapiError('CARRIER_CORRUPT');
      }

      return {
        secretValue,
        status: 'ACTIVE',
        ...(envelope.expiresAtUtc !== undefined ? { expiresAt: envelope.expiresAtUtc } : {}),
        version: envelope.version,
      };
    } catch (err) {
      if (err instanceof DhanVaultResolutionError) throw err;
      throw dpapiError('BACKEND_FAILURE');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internals
  // ───────────────────────────────────────────────────────────────────────────

  /** Carrier role for a ref, or null when the ref is not a governed DPAPI secret. */
  private roleForRef(ref: SecretRef): DpapiCarrierRole | null {
    if (ref.vaultProvider !== WINDOWS_DPAPI_VAULT_PROVIDER) return null;
    return resolveDpapiCarrierRole(ref.keyPath);
  }

  private loadEnvelope(
    role: DpapiCarrierRole
  ):
    | { readonly ok: true; readonly envelope: DpapiCarrierEnvelope }
    | { readonly ok: false; readonly reason: DhanVaultFailureReason } {
    let text: string;
    try {
      text = readFileSync(dpapiCarrierPathFor(this.carrierDirectory, role), 'utf8');
    } catch {
      return { ok: false, reason: 'CARRIER_UNREADABLE' };
    }
    const parsed = parseDpapiCarrierEnvelope(text, { now: this.now() });
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason };
    }
    return { ok: true, envelope: parsed.envelope };
  }

  /** Reads DACL evidence for the given paths via one child-process invocation. */
  private async describeAcl(paths: string[]): Promise<AclEntry[]> {
    const outcome = await this.runner({ operation: 'describe-acl', payload: { paths } });
    if (outcome.kind !== 'ok') {
      throw dpapiError('CHILD_PROCESS_FAILURE');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outcome.stdout);
    } catch {
      throw dpapiError('CHILD_PROCESS_FAILURE');
    }
    if (!parsed || typeof parsed !== 'object' || (parsed as { ok?: unknown }).ok !== true) {
      throw dpapiError('CHILD_PROCESS_FAILURE');
    }

    const rawItems = (parsed as { items?: unknown }).items;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const entries: AclEntry[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        throw dpapiError('CHILD_PROCESS_FAILURE');
      }
      const record = item as Record<string, unknown>;
      if (typeof record.path !== 'string') {
        throw dpapiError('CHILD_PROCESS_FAILURE');
      }
      if (record.exists !== true) {
        throw dpapiError('CARRIER_MISSING');
      }
      entries.push({
        path: record.path,
        exists: true,
        protected: record.protected === true,
        onlyOwnerAndSystem: record.onlyOwnerAndSystem === true,
        ownerIsCurrentUser: record.ownerIsCurrentUser === true,
      });
    }

    // Every requested path must be accounted for; a partial answer is a failed check.
    if (entries.length !== paths.length) {
      throw dpapiError('CHILD_PROCESS_FAILURE');
    }
    return entries;
  }

  /** DPAPI unprotect via the child process, classifying the two distinct failure modes. */
  private async unprotect(
    ciphertext: string
  ): Promise<
    | { readonly kind: 'ok'; readonly plaintext: string }
    | { readonly kind: 'undecryptable' }
    | { readonly kind: 'child-failure' }
  > {
    const outcome = await this.runner({
      operation: 'unprotect',
      payload: { ciphertextB64: ciphertext },
    });
    if (outcome.kind !== 'ok') {
      return { kind: 'child-failure' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outcome.stdout);
    } catch {
      return { kind: 'child-failure' };
    }
    if (!parsed || typeof parsed !== 'object') {
      return { kind: 'child-failure' };
    }

    const record = parsed as Record<string, unknown>;
    if (record.ok !== true) {
      // The child ran and reported a DPAPI failure: the carrier cannot be decrypted under
      // this user. That is "unreadable", not a transport failure.
      return { kind: 'undecryptable' };
    }
    if (typeof record.plaintextB64 !== 'string' || record.plaintextB64.length === 0) {
      return { kind: 'child-failure' };
    }

    try {
      return { kind: 'ok', plaintext: Buffer.from(record.plaintextB64, 'base64').toString('utf8') };
    } catch {
      return { kind: 'child-failure' };
    }
  }
}

/** D-1 owner-only test: inheritance disabled, owner is the current user, only owner + SYSTEM. */
function isOwnerOnly(entry: AclEntry): boolean {
  return (
    entry.exists && entry.protected && entry.onlyOwnerAndSystem && entry.ownerIsCurrentUser
  );
}
