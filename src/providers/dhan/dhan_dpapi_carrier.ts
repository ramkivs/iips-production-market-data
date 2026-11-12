/**
 * Institutional Investment Platform System (IIPS)
 * Dhan DPAPI Carrier Format, Canonical Locations & Atomic Replacement (W-02 / D-1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), D-1 + W-02
 *
 * WHAT THIS MODULE IS:
 *  The governed on-disk shape of a Windows DPAPI credential carrier: where the two
 *  carriers live, what their versioned envelope contains, how an envelope is
 *  serialised canonically, how it is validated, and the write-beside / verify /
 *  swap primitive that makes a replacement atomic.
 *
 * WHAT THIS MODULE IS NOT:
 *  It performs no DPAPI call and holds no secret. The ciphertext is produced and
 *  consumed by `dhan_dpapi_process.ts` (child process) via
 *  `dhan_dpapi_vault_backend.ts`. The interactive provisioning/rotation utility is
 *  W-04 and composes the primitive exported here.
 *
 * D-1 CARRIER RULES ENCODED HERE:
 *  - two separate carriers, never one blob (`dhan-client-id` / `dhan-access-token`);
 *  - carriers live outside any Git working tree, under a local runtime directory;
 *  - versioned envelope; an unknown `schemaVersion` is refused, never guessed;
 *  - rotation writes beside the old carrier, verifies by read-back, then swaps, so an
 *    interrupted rotation leaves either the previous valid carrier or a clearly
 *    invalid one that fails closed — never a half-written carrier that reads as success.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import { randomBytes } from 'node:crypto';
import * as realFs from 'node:fs';
import * as path from 'node:path';

/** Envelope grammar version. A change requires a new governed decision and new validation. */
export const DPAPI_CARRIER_SCHEMA_VERSION = 1;

/** Carrier directory name under the governed runtime root (`<runtime>\dhan-secrets`). */
export const DPAPI_CARRIER_DIRECTORY_NAME = 'dhan-secrets';

/**
 * Canonical carrier directory on the governed Windows host.
 *
 * `H:\IIPS\runtime\` is the established runtime root (`windows-setup/README.md`), outside
 * both Git working trees, and `dhan-secrets` is the per-purpose subdirectory for Dhan
 * credential carriers — mirroring `owner-context/`, `iips-data/`, `np04/`, `ipd-state/`.
 *
 * The backend always takes the directory as an option; this constant is the default and
 * the name W-03 must thread through configuration.
 */
export const DPAPI_CANONICAL_CARRIER_DIRECTORY = 'H:\\IIPS\\runtime\\dhan-secrets';

/** One carrier per secret. Never a shared file, never one path for both. */
export const DPAPI_CARRIER_FILENAMES = Object.freeze({
  clientId: 'dhan-client-id.carrier.json',
  accessToken: 'dhan-access-token.carrier.json',
});

export type DpapiCarrierRole = 'clientId' | 'accessToken';

/** Secret name (final `vault://` segment) → carrier role. */
export const DPAPI_CARRIER_ROLE_BY_SECRET_NAME: Readonly<Record<string, DpapiCarrierRole>> =
  Object.freeze({
    'client-id': 'clientId',
    'access-token': 'accessToken',
  });

/** Failure reasons owned by the carrier layer (a subset of `DhanVaultFailureReason`). */
export type DpapiCarrierFailureReason =
  | 'CARRIER_MISSING'
  | 'CARRIER_UNREADABLE'
  | 'CARRIER_PRINCIPAL_MISMATCH'
  | 'CARRIER_CORRUPT'
  | 'CARRIER_LOCATION_INVALID'
  | 'UNKNOWN_SCHEMA_VERSION'
  | 'SECRET_ID_MISMATCH';

/**
 * The D-1 envelope. Exactly these fields, no more: a carrier that carries extra
 * material is not a governed carrier.
 */
export interface DpapiCarrierEnvelope {
  readonly schemaVersion: number;
  readonly secretId: string;
  readonly vaultProvider: string;
  readonly version: string;
  readonly createdAtUtc: string;
  readonly rotatedAtUtc: string;
  /** Token carriers only; the client id has no expiry. */
  readonly expiresAtUtc?: string;
  /** Base64 of the DPAPI-protected bytes. Never plaintext, never a key. */
  readonly ciphertext: string;
}

/** Strict ISO-8601 UTC (as required by D-1), not merely "something Date.parse accepts". */
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/** Tolerated future skew for `rotatedAtUtc` before it is treated as corrupt metadata. */
export const DPAPI_CARRIER_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export type CarrierParseResult =
  | { readonly ok: true; readonly envelope: DpapiCarrierEnvelope }
  | { readonly ok: false; readonly reason: DpapiCarrierFailureReason; readonly message: string };

function corrupt(message: string): CarrierParseResult {
  return { ok: false, reason: 'CARRIER_CORRUPT', message };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoUtc(value: unknown): value is string {
  return typeof value === 'string' && ISO_UTC_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function isBase64Ciphertext(value: unknown): value is string {
  return (
    isNonEmptyString(value) && value.length % 4 === 0 && BASE64_PATTERN.test(value)
  );
}

/**
 * Canonical serialisation: two-space indentation, D-1 key order, exactly one trailing LF,
 * `expiresAtUtc` omitted when absent. Same bytes for the same envelope on every platform.
 */
export function serialiseDpapiCarrierEnvelope(envelope: DpapiCarrierEnvelope): string {
  const ordered: Record<string, unknown> = {
    schemaVersion: envelope.schemaVersion,
    secretId: envelope.secretId,
    vaultProvider: envelope.vaultProvider,
    version: envelope.version,
    createdAtUtc: envelope.createdAtUtc,
    rotatedAtUtc: envelope.rotatedAtUtc,
  };
  if (envelope.expiresAtUtc !== undefined) {
    ordered.expiresAtUtc = envelope.expiresAtUtc;
  }
  ordered.ciphertext = envelope.ciphertext;
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export interface CarrierParseOptions {
  /** Injected clock for `rotatedAtUtc` sanity. defaults to `new Date()`. */
  readonly now?: Date;
}

/**
 * Parses and structurally validates a carrier envelope.
 *
 * Structural rules (independent of any `SecretRef`):
 *  - JSON object; `schemaVersion` present and integral, and a KNOWN version (unknown is
 *    refused rather than guessed);
 *  - `secretId`, `vaultProvider`, `version`, `ciphertext` present and non-empty;
 *  - `createdAtUtc` / `rotatedAtUtc` strict ISO-8601 UTC; `rotatedAtUtc` not before
 *    `createdAtUtc` and not in the future beyond `DPAPI_CARRIER_MAX_CLOCK_SKEW_MS`;
 *  - `expiresAtUtc`, when present, strict ISO-8601 UTC;
 *  - `ciphertext` well-formed base64.
 *
 * Messages are fixed strings and never echo carrier content.
 */
export function parseDpapiCarrierEnvelope(
  text: string,
  options: CarrierParseOptions = {}
): CarrierParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return corrupt('carrier is not valid JSON');
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return corrupt('carrier is not a JSON object');
  }

  const env = raw as Record<string, unknown>;

  if (typeof env.schemaVersion !== 'number' || !Number.isInteger(env.schemaVersion)) {
    return corrupt('carrier schemaVersion is missing or not an integer');
  }
  if (env.schemaVersion !== DPAPI_CARRIER_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'UNKNOWN_SCHEMA_VERSION',
      message: 'carrier schemaVersion is not a known version',
    };
  }

  if (
    !isNonEmptyString(env.secretId) ||
    !isNonEmptyString(env.vaultProvider) ||
    !isNonEmptyString(env.version) ||
    !isNonEmptyString(env.ciphertext)
  ) {
    return corrupt('carrier is missing required metadata');
  }

  if (!isIsoUtc(env.createdAtUtc)) {
    return corrupt('carrier createdAtUtc is not an ISO-8601 UTC timestamp');
  }
  if (!isIsoUtc(env.rotatedAtUtc)) {
    return corrupt('carrier rotatedAtUtc is not an ISO-8601 UTC timestamp');
  }
  if (env.expiresAtUtc !== undefined && !isIsoUtc(env.expiresAtUtc)) {
    return corrupt('carrier expiresAtUtc is not an ISO-8601 UTC timestamp');
  }

  const createdAtMs = Date.parse(env.createdAtUtc as string);
  const rotatedAtMs = Date.parse(env.rotatedAtUtc as string);
  if (rotatedAtMs < createdAtMs) {
    return corrupt('carrier rotatedAtUtc precedes createdAtUtc');
  }
  const nowMs = (options.now ?? new Date()).getTime();
  if (rotatedAtMs > nowMs + DPAPI_CARRIER_MAX_CLOCK_SKEW_MS) {
    return corrupt('carrier rotatedAtUtc is implausibly in the future');
  }

  if (!isBase64Ciphertext(env.ciphertext)) {
    return corrupt('carrier ciphertext is not well-formed base64');
  }

  const envelope: DpapiCarrierEnvelope = {
    schemaVersion: env.schemaVersion,
    secretId: env.secretId,
    vaultProvider: env.vaultProvider,
    version: env.version,
    createdAtUtc: env.createdAtUtc as string,
    rotatedAtUtc: env.rotatedAtUtc as string,
    ...(env.expiresAtUtc !== undefined ? { expiresAtUtc: env.expiresAtUtc as string } : {}),
    ciphertext: env.ciphertext,
  };

  return { ok: true, envelope };
}

/**
 * Maps a `vault://` key path to the carrier that must serve it, using the final secret
 * segment only. `null` means the path does not name a governed Dhan secret, so no carrier
 * may be selected for it — two paths can never collapse onto one carrier.
 */
export function resolveDpapiCarrierRole(keyPath: string): DpapiCarrierRole | null {
  const withoutQuery = keyPath.split(/[?#]/, 1)[0];
  const segments = withoutQuery.split('/');
  if (segments.length < 2) return null;
  const secretName = segments[segments.length - 1];
  if (secretName.length === 0 || secretName.trim() !== secretName) return null;
  return DPAPI_CARRIER_ROLE_BY_SECRET_NAME[secretName] ?? null;
}

/** Carrier file path for a role inside a carrier directory. */
export function dpapiCarrierPathFor(carrierDirectory: string, role: DpapiCarrierRole): string {
  return path.join(path.resolve(carrierDirectory), DPAPI_CARRIER_FILENAMES[role]);
}

/**
 * Returns the Git working-tree root containing `dir`, or `null` when `dir` is outside
 * version control. Carriers must live outside Git (D-1); the same rule the IRR carrier
 * modules enforce, applied to the DPAPI store.
 */
export function findGitWorkingTreeRoot(dir: string): string | null {
  let current = path.resolve(dir);
  for (;;) {
    if (realFs.existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export type DpapiCarrierWriteStage =
  | 'LOCATION'
  | 'DIRECTORY'
  | 'ACL'
  | 'WRITE'
  | 'VERIFY'
  | 'SWAP';

/**
 * Operator-safe write failure. Carries the stage that failed and a fixed message;
 * never a path, never carrier content, never a secret.
 */
export class DpapiCarrierWriteError extends Error {
  public readonly stage: DpapiCarrierWriteStage;

  constructor(stage: DpapiCarrierWriteStage, message: string) {
    super(message);
    this.name = 'DpapiCarrierWriteError';
    this.stage = stage;
  }
}

export type DpapiAclTargetKind = 'directory' | 'file';

/**
 * Outcome of one owner-only DACL application.
 *
 * `changed: false` means the observed DACL was already exactly the policy and `Set-Acl` was
 * deliberately not invoked. Rewriting an already-correct directory DACL is what raised
 * `PrivilegeNotHeldException` on a real Windows host; the production applier
 * (`dhan_dpapi_acl.ts`) therefore verifies before writing.
 */
export interface DpapiAclApplyResult {
  readonly changed: boolean;
  readonly verified: true;
}

export interface DpapiCarrierWriteRequest {
  /** Absolute carrier directory (outside any Git working tree). */
  readonly carrierDirectory: string;
  readonly role: DpapiCarrierRole;
  readonly envelope: DpapiCarrierEnvelope;
  /**
   * Applies the D-1 owner-only DACL (inheritance disabled; owner + SYSTEM only) to the
   * directory and, before content is written, to the beside-file.
   *
   * The production implementation is `createWindowsDpapiAclApplier` (`dhan_dpapi_acl.ts`): it
   * reads the descriptor, verifies the exact policy and rewrites only when it differs. An
   * applier may return the outcome so a caller can see whether the directory was rewritten;
   * unit tests inject a recorder that returns nothing.
   */
  readonly applyOwnerOnlyAcl?: (
    targetPath: string,
    kind: DpapiAclTargetKind
  ) => Promise<DpapiAclApplyResult | void>;
  /** Read-back verification of the beside-file before the swap. Defaults to a parse check. */
  readonly verify?: (besidePath: string) => Promise<boolean>;
  /** Injected clock for envelope sanity during the pre-write validation. */
  readonly now?: Date;
}

export interface DpapiCarrierWriteResult {
  readonly carrierPath: string;
  /** True when an existing carrier was atomically replaced. */
  readonly replaced: boolean;
  /**
   * True only when this write actually rewrote the carrier directory DACL. False when the
   * directory was already correct (no `Set-Acl` was issued) or when no applier was supplied.
   */
  readonly directoryAclRewritten: boolean;
}

/**
 * D-1 atomic replacement: write a canonically serialised envelope **beside** the target,
 * apply the owner-only DACL before content, verify by read-back, then swap.
 *
 * On ANY failure the previous carrier remains authoritative and the beside-file is
 * removed; nothing is ever repaired in place. A carrier that fails validation is never
 * rewritten implicitly — replacement only happens through this explicit operation.
 */
export async function writeDpapiCarrierAtomically(
  request: DpapiCarrierWriteRequest
): Promise<DpapiCarrierWriteResult> {
  const carrierDirectory = path.resolve(request.carrierDirectory);

  if (findGitWorkingTreeRoot(carrierDirectory) !== null) {
    throw new DpapiCarrierWriteError(
      'LOCATION',
      'carrier directory must live outside a Git working tree'
    );
  }

  // Validate the envelope before touching the filesystem: an invalid envelope must never
  // reach a beside-file, let alone the target.
  const text = serialiseDpapiCarrierEnvelope(request.envelope);
  const parsed = parseDpapiCarrierEnvelope(text, { now: request.now ?? new Date() });
  if (!parsed.ok) {
    throw new DpapiCarrierWriteError('WRITE', 'carrier envelope failed structural validation');
  }

  try {
    realFs.mkdirSync(carrierDirectory, { recursive: true });
  } catch {
    throw new DpapiCarrierWriteError('DIRECTORY', 'carrier directory could not be prepared');
  }

  let directoryAclRewritten = false;
  if (request.applyOwnerOnlyAcl) {
    try {
      const directoryAcl = await request.applyOwnerOnlyAcl(carrierDirectory, 'directory');
      directoryAclRewritten = directoryAcl?.changed === true;
    } catch {
      throw new DpapiCarrierWriteError('ACL', 'carrier directory access restriction failed');
    }
  }

  const target = dpapiCarrierPathFor(carrierDirectory, request.role);
  const beside = path.join(
    carrierDirectory,
    `.${DPAPI_CARRIER_FILENAMES[request.role]}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`
  );

  let swapped = false;
  try {
    try {
      // Create empty first so the DACL is applied to an existing file before any content.
      realFs.writeFileSync(beside, '', { encoding: 'utf8', flag: 'wx' });
    } catch {
      throw new DpapiCarrierWriteError('WRITE', 'carrier beside-file could not be created');
    }

    if (request.applyOwnerOnlyAcl) {
      try {
        await request.applyOwnerOnlyAcl(beside, 'file');
      } catch {
        throw new DpapiCarrierWriteError('ACL', 'carrier access restriction failed');
      }
    }

    try {
      realFs.writeFileSync(beside, text, { encoding: 'utf8' });
    } catch {
      throw new DpapiCarrierWriteError('WRITE', 'carrier beside-file could not be written');
    }

    const verified = request.verify
      ? await request.verify(beside)
      : parseDpapiCarrierEnvelope(realFs.readFileSync(beside, 'utf8'), {
          now: request.now ?? new Date(),
        }).ok;
    if (!verified) {
      throw new DpapiCarrierWriteError('VERIFY', 'carrier read-back verification failed');
    }

    const replaced = realFs.existsSync(target);
    try {
      realFs.renameSync(beside, target);
      swapped = true;
    } catch {
      throw new DpapiCarrierWriteError('SWAP', 'carrier swap failed');
    }
    return { carrierPath: target, replaced, directoryAclRewritten };
  } finally {
    if (!swapped) {
      try {
        if (realFs.existsSync(beside)) realFs.unlinkSync(beside);
      } catch {
        /* best-effort cleanup only; the previous carrier is untouched */
      }
    }
  }
}
