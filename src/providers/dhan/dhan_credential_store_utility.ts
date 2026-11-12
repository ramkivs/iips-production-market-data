/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Credential Provisioning, Rotation & Verification Utility — W-04
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), W-04
 * Decisions consumed: D-1 (store, carriers, envelope, DACL, atomicity), D-2 (read posture)
 * Depends on: W-01 (two-key-path convention), W-02 (carrier grammar, DACL, atomic writer, backend)
 *
 * WHAT THIS MODULE OWNS
 *  The owner-facing half of the credential store: putting a secret in, replacing one that is
 *  there, and reporting the state of the store — safely, repeatably, and without ever leaving an
 *  interrupted operation as the authoritative carrier.
 *
 *  It adds exactly two things to the W-02 primitives, and composes everything else:
 *   1. the DPAPI `protect` step (added to the child-process boundary in `dhan_dpapi_process.ts`);
 *   2. the round-trip proof: the beside-carrier is decrypted again and compared to the input
 *      **before** the swap, so a swap can only ever publish bytes that were proven readable.
 *
 * RULES IT ENFORCES (D-1)
 *  - The plaintext arrives in memory only: never argv, never an environment variable, never a
 *    temporary file, never a shell string, never a log line. It is handed to the static child
 *    program on stdin and dropped when this function returns.
 *  - One carrier per secret, replaced independently: client id and access token rotate separately.
 *  - Atomic replacement: write beside, verify by decryption, then swap. On any failure — including
 *    a simulated crash between write and swap — the previous carrier remains authoritative.
 *  - Envelope metadata is complete and validated: schema version, secretId, provider, version,
 *    created/rotated timestamps, token expiry.
 *  - Output is a non-reversible fingerprint (algorithm tag + truncated digest) and envelope
 *    metadata. Never the value, never a `vault://` path, never a carrier path.
 *  - `verify` reports presence, readability, DACL conformity, schema validity and expiry. It does
 *    not decrypt for display, and it does not locate anything: no path, no key path, no content.
 *
 * THREAT MODEL (documented, not merely assumed)
 *  DPAPI user scope protects a carrier **at rest** against another account on the same host and
 *  against a copy of the file taken to another machine or user profile. It does not protect
 *  against: code running as the same user (which can unprotect it, and this utility is such code);
 *  an administrator who can act as that user; a memory dump or debugger attached to the process
 *  that holds the plaintext; or keystroke capture at the moment the secret is typed. The
 *  owner-only DACL (W-02) narrows the at-rest window further but is likewise not a defence against
 *  the same user. See the W-04 record for the full statement.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

import {
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  WINDOWS_DPAPI_VAULT_PROVIDER,
  type SecretRef,
} from '../../security/secret_ref.js';
import { type DpapiAclApplier, createWindowsDpapiAclContainer } from './dhan_dpapi_acl.js';
import {
  DPAPI_CANONICAL_CARRIER_DIRECTORY,
  DPAPI_CARRIER_SCHEMA_VERSION,
  type DpapiCarrierEnvelope,
  type DpapiCarrierRole,
  DpapiCarrierWriteError,
  dpapiCarrierPathFor,
  findGitWorkingTreeRoot,
  parseDpapiCarrierEnvelope,
  writeDpapiCarrierAtomically,
} from './dhan_dpapi_carrier.js';
import {
  type DpapiProcessOutcome,
  type DpapiProcessRunner,
  createPowerShellDpapiProcessRunner,
} from './dhan_dpapi_process.js';
import { WindowsDpapiHostVaultBackend } from './dhan_dpapi_vault_backend.js';
import { DhanVaultResolutionError } from './dhan_local_vault_resolver.js';

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/** The two independently rotatable Dhan secrets (D-1 two-key-path convention). */
export const DHAN_CREDENTIAL_ROLES: readonly DpapiCarrierRole[] = Object.freeze([
  'clientId',
  'accessToken',
] as const);

/** Operator-facing name per role. Deliberately not the key path. */
export const DHAN_CREDENTIAL_LABELS: Readonly<Record<DpapiCarrierRole, string>> = Object.freeze({
  clientId: 'client-id',
  accessToken: 'access-token',
});

/** Governed key path per role. Used to derive the secretId and to build SecretRefs. */
export const DHAN_CREDENTIAL_KEY_PATHS: Readonly<Record<DpapiCarrierRole, string>> = Object.freeze({
  clientId: DHAN_CLIENT_ID_KEY_PATH,
  accessToken: DHAN_ACCESS_TOKEN_KEY_PATH,
});

export const DEFAULT_DHAN_CREDENTIAL_VERSION = 'v1';

/** Bounds on the accepted secret. A Dhan token is long; a client id is short. */
export const DHAN_CREDENTIAL_MIN_LENGTH = 8;
export const DHAN_CREDENTIAL_MAX_LENGTH = 8_192;

/** SecretRef version shape. Anything else is refused rather than coerced. */
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;

/** Strict ISO-8601 UTC, as D-1 requires of every envelope timestamp. */
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** Fingerprint: algorithm tag + truncated digest. 12 hex chars = 48 bits. */
export const DHAN_CREDENTIAL_FINGERPRINT_ALGORITHM = 'sha256';
export const DHAN_CREDENTIAL_FINGERPRINT_HEX_LENGTH = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Typed outcomes
// ─────────────────────────────────────────────────────────────────────────────

export type DhanCredentialProvisionFailureCode =
  | 'NOT_WINDOWS'
  | 'ROLE_INVALID'
  | 'CARRIER_DIRECTORY_INVALID'
  | 'SECRET_INVALID'
  | 'VERSION_INVALID'
  | 'EXPIRY_INVALID'
  | 'ALREADY_PROVISIONED'
  | 'NOT_PROVISIONED'
  | 'DPAPI_PROTECT_FAILED'
  | 'ACL_FAILED'
  | 'ROUND_TRIP_FAILED'
  | 'WRITE_FAILED';

/**
 * Operator-safe provisioning failure: a fixed code, a fixed message and the stage. It can carry no
 * secret, no path and no child-process text, because it never receives any.
 */
export class DhanCredentialProvisionError extends Error {
  public readonly code: DhanCredentialProvisionFailureCode;

  constructor(code: DhanCredentialProvisionFailureCode, message: string) {
    super(message);
    this.name = 'DhanCredentialProvisionError';
    this.code = code;
  }
}

/** What the caller reports back to the owner. Contains no value and no location. */
export interface DpapiCredentialProvisionReport {
  readonly role: DpapiCarrierRole;
  /** Operator-facing name, e.g. `access-token`. */
  readonly label: string;
  readonly secretId: string;
  readonly version: string;
  /** Non-reversible confirmation aid: `sha256:<12 hex>`. Never the value. */
  readonly fingerprint: string;
  readonly createdAtUtc: string;
  readonly rotatedAtUtc: string;
  readonly expiresAtUtc?: string;
  /** True when an existing carrier was atomically replaced. */
  readonly replaced: boolean;
  /** True when this write actually rewrote the carrier directory DACL. */
  readonly directoryAclRewritten: boolean;
  /** Always true: the beside-carrier was decrypted and compared before the swap. */
  readonly roundTripVerified: true;
}

export type DhanCredentialVerificationStatus =
  | 'PRESENT_OK'
  | 'ABSENT'
  | 'ACL_NOT_OWNER_ONLY'
  | 'SCHEMA_INVALID'
  | 'SECRET_ID_MISMATCH'
  | 'EXPIRED'
  | 'UNREADABLE'
  | 'UNAVAILABLE';

/** One carrier's verified state. Carries no path, no key path and no secret material. */
export interface DhanCredentialVerification {
  readonly role: DpapiCarrierRole;
  readonly label: string;
  readonly status: DhanCredentialVerificationStatus;
  readonly present: boolean;
  readonly readable: boolean;
  readonly aclOwnerOnly: boolean;
  readonly schemaValid: boolean;
  readonly expired: boolean;
  readonly version?: string;
  readonly expiresAtUtc?: string;
}

export interface DhanCredentialStoreVerificationReport {
  readonly platformAdmissible: boolean;
  readonly locationAdmissible: boolean;
  readonly entries: readonly DhanCredentialVerification[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The `secretId` a `SecretRef` for this key path must carry.
 *
 * Mirrors the convention `dhan_config.ts` uses when it builds the refs the daemon resolves
 * (`dhan-` + the key path with every non-alphanumeric run collapsed to `-`). A test pins the two
 * against each other so a carrier written here can never disagree with the ref that reads it.
 */
export function dhanSecretIdForKeyPath(keyPath: string): string {
  return `dhan-${keyPath.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

/** The `secretId` for a role. */
export function dhanSecretIdForRole(role: DpapiCarrierRole): string {
  return dhanSecretIdForKeyPath(DHAN_CREDENTIAL_KEY_PATHS[role]);
}

/**
 * Non-reversible fingerprint used to confirm which value is installed without disclosing it.
 *
 * This is a confirmation aid, not a security control: it is truncated precisely so it cannot be
 * used as an offline oracle for a low-entropy value, and the full digest is never printed or
 * stored. It is stable for the same input and differs for different inputs, which is what an
 * operator needs when checking that a rotation took effect.
 */
export function fingerprintCredentialValue(value: string): string {
  const digest = createHash(DHAN_CREDENTIAL_FINGERPRINT_ALGORITHM)
    .update(value, 'utf8')
    .digest('hex')
    .slice(0, DHAN_CREDENTIAL_FINGERPRINT_HEX_LENGTH);
  return `${DHAN_CREDENTIAL_FINGERPRINT_ALGORITHM}:${digest}`;
}

/**
 * Removes the transport framing a piped secret arrives with.
 *
 * A trailing newline is an artefact of `echo`/piping, not part of the secret, so it is removed. It
 * is the ONLY normalisation performed: leading whitespace, interior whitespace and any other
 * character are refused later rather than silently altered, because a secret that had to be
 * "cleaned up" is a secret that was probably mistyped.
 */
export function stripSecretTransportFraming(raw: string): string {
  return raw.replace(/[\r\n]+$/u, '');
}

export interface CredentialInputValidation {
  readonly ok: boolean;
  readonly code?: 'SECRET_INVALID';
  readonly message?: string;
}

/**
 * Validates a secret before anything is encrypted or written.
 *
 * Refused: empty, whitespace-only, leading/trailing whitespace, control characters (which cannot
 * survive a copy/paste intact and would be a silent corruption), and lengths outside the governed
 * bounds. The checks never echo the value — only which property failed.
 */
export function validateCredentialSecret(value: string): CredentialInputValidation {
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, code: 'SECRET_INVALID', message: 'the secret is empty' };
  }
  if (value.trim().length === 0) {
    return { ok: false, code: 'SECRET_INVALID', message: 'the secret is whitespace only' };
  }
  if (value !== value.trim()) {
    return {
      ok: false,
      code: 'SECRET_INVALID',
      message: 'the secret has leading or trailing whitespace and was not altered',
    };
  }
  // Control characters: 0x00-0x1F and 0x7F. A pasted secret with one is corrupt, not secret.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/u.test(value)) {
    return {
      ok: false,
      code: 'SECRET_INVALID',
      message: 'the secret contains a control character and cannot be stored intact',
    };
  }
  if (value.length < DHAN_CREDENTIAL_MIN_LENGTH) {
    return {
      ok: false,
      code: 'SECRET_INVALID',
      message: `the secret is shorter than the governed minimum (${DHAN_CREDENTIAL_MIN_LENGTH})`,
    };
  }
  if (value.length > DHAN_CREDENTIAL_MAX_LENGTH) {
    return {
      ok: false,
      code: 'SECRET_INVALID',
      message: `the secret is longer than the governed maximum (${DHAN_CREDENTIAL_MAX_LENGTH})`,
    };
  }
  return { ok: true };
}

/** True when the value is accepted as a SecretRef version. */
export function isValidCredentialVersion(version: string): boolean {
  return typeof version === 'string' && VERSION_PATTERN.test(version);
}

/** True when the value is a strict ISO-8601 UTC timestamp. */
export function isStrictIsoUtc(value: string): boolean {
  return typeof value === 'string' && ISO_UTC_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

/** Both secrets are compared as digests, so the comparison cannot short-circuit on content. */
function secretsEqual(left: string, right: string): boolean {
  const a = createHash('sha256').update(left, 'utf8').digest();
  const b = createHash('sha256').update(right, 'utf8').digest();
  return timingSafeEqual(a, b);
}

/** Reads `{ ok, plaintextB64 }` from an unprotect result. Never surfaces the child's text. */
function decodeUnprotectPlaintext(outcome: DpapiProcessOutcome): string | null {
  if (outcome.kind !== 'ok') return null;
  try {
    const parsed = JSON.parse(outcome.stdout) as { ok?: unknown; plaintextB64?: unknown };
    if (parsed.ok !== true || typeof parsed.plaintextB64 !== 'string') return null;
    return Buffer.from(parsed.plaintextB64, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/** Reads `{ ok, ciphertextB64 }` from a protect result. Never surfaces the child's text. */
function decodeProtectCiphertext(outcome: DpapiProcessOutcome): string | null {
  if (outcome.kind !== 'ok') return null;
  try {
    const parsed = JSON.parse(outcome.stdout) as { ok?: unknown; ciphertextB64?: unknown };
    if (parsed.ok !== true || typeof parsed.ciphertextB64 !== 'string') return null;
    if (parsed.ciphertextB64.length === 0) return null;
    return parsed.ciphertextB64;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provisioning / rotation
// ─────────────────────────────────────────────────────────────────────────────

export interface ProvisionDhanCredentialRequest {
  readonly role: DpapiCarrierRole;
  /** The secret itself. Held in memory for the duration of this call only. */
  readonly secretValue: string;
  /** Absolute carrier directory. Defaults to the canonical D-1 location. */
  readonly carrierDirectory?: string;
  /** SecretRef version to stamp into the envelope. Defaults to `v1`. */
  readonly version?: string;
  /** Token only. Strict ISO-8601 UTC, strictly in the future. */
  readonly expiresAtUtc?: string;
  /**
   * `provision` installs a secret that is not there yet and refuses to overwrite one that is;
   * `rotate` requires an existing carrier and replaces it atomically. Both exist so that
   * "I am installing this" and "I am replacing this" can never be confused.
   */
  readonly mode?: 'provision' | 'rotate';
  readonly now?: Date;
  readonly runner?: DpapiProcessRunner;
  readonly applyOwnerOnlyAcl?: DpapiAclApplier;
  readonly platform?: () => NodeJS.Platform;
  /**
   * Test seam invoked after the round-trip proof and before the swap.Because it runs at exactly
   * that point, throwing here models a process crash between write and swap.
   */
  readonly beforeSwapProbe?: (besidePath: string) => Promise<void>;
}

/**
 * Installs or replaces one credential carrier.
 *
 * Sequence (every step fail-closed):
 *   1. platform / location / role / secret / version / expiry validation — before any I/O;
 *   2. mode check against the existing carrier;
 *   3. DPAPI protect in the child process — plaintext on stdin only;
 *   4. envelope assembly with complete D-1 metadata;
 *   5. atomic write: beside-file (owner-only DACL applied before content), read back, decrypt,
 *      compare to the input, **then** swap;
 *   6. report fingerprint + metadata, and nothing else.
 *
 * Throws `DhanCredentialProvisionError` on failure. On every failure path the previous carrier is
 * untouched and the beside-file is removed.
 */
export async function provisionDhanCredential(
  request: ProvisionDhanCredentialRequest
): Promise<DpapiCredentialProvisionReport> {
  const now = request.now ?? new Date();
  const platform = request.platform ?? (() => process.platform);
  const mode = request.mode ?? 'provision';
  const version = request.version ?? DEFAULT_DHAN_CREDENTIAL_VERSION;
  const carrierDirectory = path.resolve(
    request.carrierDirectory ?? DPAPI_CANONICAL_CARRIER_DIRECTORY
  );

  // 1. Validation, before anything is encrypted or written.
  if (!DHAN_CREDENTIAL_ROLES.includes(request.role)) {
    throw new DhanCredentialProvisionError('ROLE_INVALID', 'the credential role is not governed');
  }
  if (platform() !== 'win32') {
    throw new DhanCredentialProvisionError(
      'NOT_WINDOWS',
      'Windows DPAPI is only available on the Windows platform; no carrier was written'
    );
  }
  if (findGitWorkingTreeRoot(carrierDirectory) !== null) {
    throw new DhanCredentialProvisionError(
      'CARRIER_DIRECTORY_INVALID',
      'the carrier directory must live outside a Git working tree'
    );
  }
  const secretCheck = validateCredentialSecret(request.secretValue);
  if (!secretCheck.ok) {
    throw new DhanCredentialProvisionError('SECRET_INVALID', secretCheck.message ?? 'the secret was refused');
  }
  if (!isValidCredentialVersion(version)) {
    throw new DhanCredentialProvisionError('VERSION_INVALID', 'the credential version is not valid');
  }
  if (request.expiresAtUtc !== undefined) {
    if (request.role === 'clientId') {
      throw new DhanCredentialProvisionError(
        'EXPIRY_INVALID',
        'the client id has no lifecycle of its own and takes no expiry'
      );
    }
    if (!isStrictIsoUtc(request.expiresAtUtc)) {
      throw new DhanCredentialProvisionError(
        'EXPIRY_INVALID',
        'the expiry is not a strict ISO-8601 UTC timestamp'
      );
    }
    if (Date.parse(request.expiresAtUtc) <= now.getTime()) {
      throw new DhanCredentialProvisionError(
        'EXPIRY_INVALID',
        'the expiry is not in the future; an already-expired credential is refused'
      );
    }
  }

  // 2. Mode check. Provisioning never silently overwrites; rotation never creates.
  const targetPath = dpapiCarrierPathFor(carrierDirectory, request.role);
  const existing = existsSync(targetPath);
  if (mode === 'provision' && existing) {
    throw new DhanCredentialProvisionError(
      'ALREADY_PROVISIONED',
      'a carrier for this secret already exists; use rotate to replace it'
    );
  }
  if (mode === 'rotate' && !existing) {
    throw new DhanCredentialProvisionError(
      'NOT_PROVISIONED',
      'no carrier for this secret exists; use provision to install it'
    );
  }

  // createdAt is the original creation time: a rotation preserves it when the previous envelope
  // is readable, and starts a new one when it is not. rotatedAt is always "now".
  const rotatedAtUtc = now.toISOString();
  let createdAtUtc = rotatedAtUtc;
  if (existing) {
    // An unreadable or corrupt previous envelope must not abort a rotation that will replace it:
    // the creation time is simply restarted, and the swap is still governed by the proof below.
    try {
      const previous = parseDpapiCarrierEnvelope(readFileSync(targetPath, 'utf8'), { now });
      if (previous.ok) createdAtUtc = previous.envelope.createdAtUtc;
    } catch {
      createdAtUtc = rotatedAtUtc;
    }
  }

  // 3. DPAPI protect. The plaintext crosses one process boundary, on stdin, and nothing else.
  const runner = request.runner ?? createPowerShellDpapiProcessRunner();
  const protectOutcome = await runner({
    operation: 'protect',
    payload: { plaintextB64: Buffer.from(request.secretValue, 'utf8').toString('base64') },
  });
  const ciphertext = decodeProtectCiphertext(protectOutcome);
  if (ciphertext === null) {
    throw new DhanCredentialProvisionError(
      'DPAPI_PROTECT_FAILED',
      'DPAPI protection failed; no carrier was written'
    );
  }

  // 4. Complete D-1 envelope.
  const secretId = dhanSecretIdForRole(request.role);
  const envelope: DpapiCarrierEnvelope = {
    schemaVersion: DPAPI_CARRIER_SCHEMA_VERSION,
    secretId,
    vaultProvider: WINDOWS_DPAPI_VAULT_PROVIDER,
    version,
    createdAtUtc,
    rotatedAtUtc,
    ...(request.expiresAtUtc !== undefined ? { expiresAtUtc: request.expiresAtUtc } : {}),
    ciphertext,
  };

  // 5. Atomic write with a round-trip proof before the swap.
  const acl = request.applyOwnerOnlyAcl
    ? { apply: request.applyOwnerOnlyAcl }
    : createWindowsDpapiAclContainer({ runner });

  const verifyBeside = async (besidePath: string): Promise<boolean> => {
    const parsed = parseDpapiCarrierEnvelope(readFileSync(besidePath, 'utf8'), { now });
    if (!parsed.ok) return false;
    const unprotectOutcome = await runner({
      operation: 'unprotect',
      payload: { ciphertextB64: parsed.envelope.ciphertext },
    });
    const roundTripped = decodeUnprotectPlaintext(unprotectOutcome);
    if (roundTripped === null) return false;
    if (!secretsEqual(roundTripped, request.secretValue)) return false;
    if (parsed.envelope.secretId !== secretId) return false;
    if (parsed.envelope.version !== version) return false;
    // Exactly here — verified, not yet swapped — a crash would leave the previous carrier
    // authoritative. The test seam lives at this point for that reason.
    if (request.beforeSwapProbe !== undefined) await request.beforeSwapProbe(besidePath);
    return true;
  };

  let written;
  try {
    written = await writeDpapiCarrierAtomically({
      carrierDirectory,
      role: request.role,
      envelope,
      applyOwnerOnlyAcl: acl.apply,
      verify: verifyBeside,
      now,
    });
  } catch (error) {
    if (error instanceof DpapiCarrierWriteError) {
      throw new DhanCredentialProvisionError(mapWriteStage(error.stage), error.message);
    }
    throw new DhanCredentialProvisionError(
      'WRITE_FAILED',
      'the carrier could not be written; the previous carrier remains authoritative'
    );
  }

  // 6. Report: fingerprint and metadata only.
  return {
    role: request.role,
    label: DHAN_CREDENTIAL_LABELS[request.role],
    secretId,
    version,
    fingerprint: fingerprintCredentialValue(request.secretValue),
    createdAtUtc,
    rotatedAtUtc,
    ...(request.expiresAtUtc !== undefined ? { expiresAtUtc: request.expiresAtUtc } : {}),
    replaced: written.replaced,
    directoryAclRewritten: written.directoryAclRewritten,
    roundTripVerified: true,
  };
}

function mapWriteStage(stage: DpapiCarrierWriteError['stage']): DhanCredentialProvisionFailureCode {
  if (stage === 'LOCATION' || stage === 'DIRECTORY') return 'CARRIER_DIRECTORY_INVALID';
  if (stage === 'ACL') return 'ACL_FAILED';
  if (stage === 'VERIFY') return 'ROUND_TRIP_FAILED';
  return 'WRITE_FAILED';
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyDhanCredentialStoreRequest {
  /** Defaults to both governed roles. */
  readonly roles?: readonly DpapiCarrierRole[];
  readonly carrierDirectory?: string;
  readonly now?: Date;
  readonly runner?: DpapiProcessRunner;
  readonly platform?: () => NodeJS.Platform;
}

/**
 * Reports the state of the credential store without revealing content or location.
 *
 * Each entry is decided by the **production read path** (`WindowsDpapiHostVaultBackend.readSecret`),
 * so "verify" cannot drift from what the daemon will actually experience: presence, owner-only
 * DACL, schema validity, secret identity, version and expiry are all evaluated by the same code
 * that serves a quote. Nothing is decrypted for display; decryption happens only as the read
 * path's readability proof, and its result is discarded.
 */
export async function verifyDhanCredentialStore(
  request: VerifyDhanCredentialStoreRequest = {}
): Promise<DhanCredentialStoreVerificationReport> {
  const now = request.now ?? new Date();
  const platform = request.platform ?? (() => process.platform);
  const carrierDirectory = path.resolve(
    request.carrierDirectory ?? DPAPI_CANONICAL_CARRIER_DIRECTORY
  );
  const roles = request.roles ?? DHAN_CREDENTIAL_ROLES;

  const platformAdmissible = platform() === 'win32';
  const locationAdmissible = findGitWorkingTreeRoot(carrierDirectory) === null;

  const entries: DhanCredentialVerification[] = [];
  for (const role of roles) {
    entries.push(
      await verifyOneRole({ role, carrierDirectory, now, request, platformAdmissible, locationAdmissible })
    );
  }

  return { platformAdmissible, locationAdmissible, entries };
}

interface VerifyOneRoleContext {
  readonly role: DpapiCarrierRole;
  readonly carrierDirectory: string;
  readonly now: Date;
  readonly request: VerifyDhanCredentialStoreRequest;
  readonly platformAdmissible: boolean;
  readonly locationAdmissible: boolean;
}

async function verifyOneRole(
  context: VerifyOneRoleContext
): Promise<DhanCredentialVerification> {
  const { role, carrierDirectory, now, request } = context;
  const label = DHAN_CREDENTIAL_LABELS[role];
  const absent: DhanCredentialVerification = {
    role,
    label,
    status: 'ABSENT',
    present: false,
    readable: false,
    aclOwnerOnly: false,
    schemaValid: false,
    expired: false,
  };

  if (!context.platformAdmissible || !context.locationAdmissible) {
    return { ...absent, status: 'UNAVAILABLE' };
  }

  const carrierPath = dpapiCarrierPathFor(carrierDirectory, role);
  if (!existsSync(carrierPath)) return absent;

  let parsed: ReturnType<typeof parseDpapiCarrierEnvelope>;
  try {
    parsed = parseDpapiCarrierEnvelope(readFileSync(carrierPath, 'utf8'), { now });
  } catch {
    // Present but unopenable: report unreadable rather than pretending it is absent or valid.
    return { ...absent, present: true, status: 'UNREADABLE' };
  }
  if (!parsed.ok) {
    return {
      ...absent,
      present: true,
      status: parsed.reason === 'SECRET_ID_MISMATCH' ? 'SECRET_ID_MISMATCH' : 'SCHEMA_INVALID',
    };
  }

  const envelope = parsed.envelope;
  const ref: SecretRef = {
    secretId: dhanSecretIdForRole(role),
    vaultProvider: WINDOWS_DPAPI_VAULT_PROVIDER,
    keyPath: DHAN_CREDENTIAL_KEY_PATHS[role],
    version: envelope.version,
    status: 'ACTIVE',
  };

  const backend = new WindowsDpapiHostVaultBackend({
    carrierDirectory,
    ...(request.runner !== undefined ? { processRunner: request.runner } : {}),
    ...(request.platform !== undefined ? { platform: request.platform } : {}),
    now: () => now,
  });

  try {
    await backend.readSecret(ref, now.toISOString());
    return {
      role,
      label,
      status: 'PRESENT_OK',
      present: true,
      readable: true,
      aclOwnerOnly: true,
      schemaValid: true,
      expired: false,
      version: envelope.version,
      ...(envelope.expiresAtUtc !== undefined ? { expiresAtUtc: envelope.expiresAtUtc } : {}),
    };
  } catch (error) {
    const status = verificationStatusFor(error);
    return {
      role,
      label,
      status,
      present: true,
      readable: status === 'PRESENT_OK',
      aclOwnerOnly: status !== 'ACL_NOT_OWNER_ONLY',
      schemaValid: status !== 'SCHEMA_INVALID' && status !== 'SECRET_ID_MISMATCH',
      expired: status === 'EXPIRED',
      version: envelope.version,
      ...(envelope.expiresAtUtc !== undefined ? { expiresAtUtc: envelope.expiresAtUtc } : {}),
    };
  }
}

/** Maps a typed vault failure to an operator-visible verification status. */
function verificationStatusFor(error: unknown): DhanCredentialVerificationStatus {
  if (!(error instanceof DhanVaultResolutionError)) return 'UNAVAILABLE';
  switch (error.reason) {
    case 'CARRIER_MISSING':
      return 'ABSENT';
    case 'CARRIER_PRINCIPAL_MISMATCH':
      return 'ACL_NOT_OWNER_ONLY';
    case 'CARRIER_CORRUPT':
    case 'CARRIER_LOCATION_INVALID':
    case 'VERSION_MISMATCH':
    case 'INVALID_SECRET_REF':
    case 'UNKNOWN_SCHEMA_VERSION':
      return 'SCHEMA_INVALID';
    case 'SECRET_ID_MISMATCH':
      return 'SECRET_ID_MISMATCH';
    case 'EXPIRED':
    case 'REVOKED':
      return 'EXPIRED';
    case 'CARRIER_UNREADABLE':
    case 'CHILD_PROCESS_FAILURE':
    case 'BACKEND_FAILURE':
      return 'UNREADABLE';
    default:
      return 'UNAVAILABLE';
  }
}
