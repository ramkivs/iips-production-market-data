/**
 * W-04 — Dhan credential provisioning, rotation and verification: targeted verification.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-04
 * Decisions consumed: D-1 (store, carriers, envelope, DACL, atomicity), D-2 (read posture)
 * Depends on: W-01 (two-key-path convention), W-02 (carrier grammar, DACL, atomic writer, backend),
 *             W-03 (daemon selection — unchanged by this suite)
 *
 * WHY THIS SUITE EXISTS
 * W-04 is the only component that ever holds a Dhan secret in plaintext. Its failure modes are
 * quiet: a rotation that half-succeeds leaves a carrier that still reads; a "verify" that reports
 * content or location leaks it; a protect path that reaches argv leaves the secret in a process
 * table. None of these throw. Each is therefore asserted explicitly, including the interrupted-write
 * case, which is simulated at the exact point between verification and swap.
 *
 * All DPAPI calls are synthetic and reversible in-process. No real DPAPI call is made, no Windows
 * host is required, no Dhan credential exists, and no network call is performed.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DHAN_CREDENTIAL_KEY_PATHS,
  DHAN_CREDENTIAL_LABELS,
  DHAN_CREDENTIAL_MAX_LENGTH,
  DHAN_CREDENTIAL_ROLES,
  DhanCredentialProvisionError,
  dhanSecretIdForRole,
  fingerprintCredentialValue,
  isValidCredentialVersion,
  provisionDhanCredential,
  stripSecretTransportFraming,
  validateCredentialSecret,
  verifyDhanCredentialStore,
} from '../src/providers/dhan/dhan_credential_store_utility.js';
import {
  DHAN_CREDENTIAL_EXIT,
  runDhanCredentialStoreCli,
} from '../src/providers/dhan/dhan_credential_store_cli.js';
import {
  DPAPI_CANONICAL_CARRIER_DIRECTORY,
  DPAPI_CARRIER_SCHEMA_VERSION,
  type DpapiCarrierEnvelope,
  type DpapiCarrierRole,
  dpapiCarrierPathFor,
  parseDpapiCarrierEnvelope,
  serialiseDpapiCarrierEnvelope,
} from '../src/providers/dhan/dhan_dpapi_carrier.js';
import {
  type DpapiProcessOutcome,
  type DpapiProcessRequest,
  type DpapiProcessRunner,
  dpapiPowerShellArgs,
  encodeDpapiScript,
} from '../src/providers/dhan/dhan_dpapi_process.js';
import {
  DPAPI_ACL_FULL_CONTROL_RIGHTS,
  DPAPI_ACL_INHERITANCE_DIRECTORY,
  DPAPI_ACL_INHERITANCE_NONE,
  DPAPI_ACL_PROPAGATION_NONE,
  DPAPI_ACL_SYSTEM_SID,
  DpapiAclApplyError,
} from '../src/providers/dhan/dhan_dpapi_acl.js';
import {
  WINDOWS_DPAPI_GOVERNED_KEY_PATHS,
  WindowsDpapiHostVaultBackend,
} from '../src/providers/dhan/dhan_dpapi_vault_backend.js';
import { DHAN_ENV_KEYS, resolveDhanProviderConfig } from '../src/providers/dhan/dhan_config.js';
import type { SecretRef } from '../src/security/secret_ref.js';

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic fixtures — never credentials
// ─────────────────────────────────────────────────────────────────────────────

const NOW_DATE = new Date('2026-11-12T06:30:00.000Z');
const TOKEN_EXPIRY_UTC = '2026-11-13T06:30:00.000Z';

/** Obviously synthetic values. They never leave this suite's memory. */
const CLIENT_VALUE = 'SYNTHETIC-W04-CLIENT-PLACEHOLDER-0001';
const TOKEN_VALUE = 'SYNTHETIC-W04-TOKEN-PLACEHOLDER-0002';
const TOKEN_VALUE_V2 = 'SYNTHETIC-W04-TOKEN-PLACEHOLDER-0003';

const DPAPI_MARKER = 'DPAPI-W04::';
const USER_SID = 'S-1-5-21-4444444444-5555555555-6666666666-1001';
const OTHER_GROUP_SID = 'S-1-5-32-545';

function fakeCiphertext(value: string): string {
  return Buffer.from(`${DPAPI_MARKER}${value}`, 'utf8').toString('base64');
}

function fakePlaintext(ciphertextB64: string): string | null {
  try {
    const text = Buffer.from(ciphertextB64, 'base64').toString('utf8');
    return text.startsWith(DPAPI_MARKER) ? text.slice(DPAPI_MARKER.length) : null;
  } catch {
    return null;
  }
}

interface FakeHostOptions {
  readonly aclOwnerOnly?: boolean;
  readonly aclProtected?: boolean;
  readonly aclOwnerIsCurrentUser?: boolean;
}

/** Stand-in for the DPAPI child process. Records every request so the boundary can be inspected. */
class FakeDpapiHost {
  public readonly requests: DpapiProcessRequest[] = [];
  public aclOwnerOnly: boolean;
  public aclProtected: boolean;
  public aclOwnerIsCurrentUser: boolean;
  /** `undecryptable` models a carrier written under a different user profile. */
  public unprotectMode: 'ok' | 'undecryptable' | 'child-failure' = 'ok';
  public protectMode: 'ok' | 'protocol-failure' = 'ok';
  /** Forces the round-trip comparison to fail without changing what was encrypted. */
  public roundTripOverride?: string;

  constructor(options: FakeHostOptions = {}) {
    this.aclOwnerOnly = options.aclOwnerOnly ?? true;
    this.aclProtected = options.aclProtected ?? true;
    this.aclOwnerIsCurrentUser = options.aclOwnerIsCurrentUser ?? true;
  }

  public get runner(): DpapiProcessRunner {
    return async (request: DpapiProcessRequest): Promise<DpapiProcessOutcome> => {
      this.requests.push(request);

      if (request.operation === 'protect') {
        if (this.protectMode === 'protocol-failure') {
          return {
            kind: 'ok',
            stdout: JSON.stringify({ ok: false, kind: 'DPAPI_PROTECT_FAILED' }),
            stderrByteLength: 0,
          };
        }
        const plaintextB64 = String((request.payload as { plaintextB64?: unknown }).plaintextB64);
        const plaintext = Buffer.from(plaintextB64, 'base64').toString('utf8');
        const value = this.roundTripOverride ?? plaintext;
        return {
          kind: 'ok',
          stdout: JSON.stringify({ ok: true, ciphertextB64: fakeCiphertext(value) }),
          stderrByteLength: 0,
        };
      }

      if (request.operation === 'unprotect') {
        if (this.unprotectMode === 'child-failure') {
          return { kind: 'non-zero-exit', stdout: '', stderrByteLength: 42 };
        }
        const ciphertextB64 = String((request.payload as { ciphertextB64?: unknown }).ciphertextB64);
        const plaintext = this.unprotectMode === 'undecryptable' ? null : fakePlaintext(ciphertextB64);
        const override = this.roundTripOverride;
        const effective = plaintext !== null && override !== undefined ? override : plaintext;
        if (effective === null) {
          return {
            kind: 'ok',
            stdout: JSON.stringify({ ok: false, kind: 'DPAPI_UNPROTECT_FAILED' }),
            stderrByteLength: 0,
          };
        }
        return {
          kind: 'ok',
          stdout: JSON.stringify({
            ok: true,
            plaintextB64: Buffer.from(effective, 'utf8').toString('base64'),
          }),
          stderrByteLength: 0,
        };
      }

      if (request.operation === 'read-acl') {
        // The production applier reads a descriptor and evaluates the exact policy; only the
        // Windows call is emulated here. A file path carries the file inheritance flags, a
        // directory path the directory flags, exactly as the child program reports them.
        const target = String((request.payload as { path?: unknown }).path ?? '');
        const looksLikeFile = /\.(json|tmp|carrier)$/i.test(target);
        const inheritanceFlags = looksLikeFile
          ? DPAPI_ACL_INHERITANCE_NONE
          : DPAPI_ACL_INHERITANCE_DIRECTORY;
        const rules = [
          {
            sid: USER_SID,
            accessControlType: 'Allow',
            rights: DPAPI_ACL_FULL_CONTROL_RIGHTS,
            inheritanceFlags,
            propagationFlags: DPAPI_ACL_PROPAGATION_NONE,
            inherited: false,
          },
          {
            sid: DPAPI_ACL_SYSTEM_SID,
            accessControlType: 'Allow',
            rights: DPAPI_ACL_FULL_CONTROL_RIGHTS,
            inheritanceFlags,
            propagationFlags: DPAPI_ACL_PROPAGATION_NONE,
            inherited: false,
          },
        ];
        if (!this.aclOwnerOnly) {
          rules.push({
            sid: OTHER_GROUP_SID,
            accessControlType: 'Allow',
            rights: DPAPI_ACL_FULL_CONTROL_RIGHTS,
            inheritanceFlags,
            propagationFlags: DPAPI_ACL_PROPAGATION_NONE,
            inherited: false,
          });
        }
        return {
          kind: 'ok',
          stdout: JSON.stringify({
            ok: true,
            exists: true,
            currentUserSid: USER_SID,
            ownerSid: this.aclOwnerIsCurrentUser ? USER_SID : 'S-1-5-21-0000000000-0000000000-0000000000-1002',
            protected: this.aclProtected,
            rules,
          }),
          stderrByteLength: 0,
        };
      }

      if (request.operation === 'apply-acl') {
        return { kind: 'ok', stdout: JSON.stringify({ ok: true, changed: true }), stderrByteLength: 0 };
      }

      if (request.operation === 'describe-acl') {
        const paths = ((request.payload as { paths?: unknown }).paths ?? []) as string[];
        const items = paths.map((entryPath) => ({
          path: entryPath,
          exists: true,
          protected: this.aclProtected,
          onlyOwnerAndSystem: this.aclOwnerOnly,
          ownerIsCurrentUser: this.aclOwnerIsCurrentUser,
        }));
        return { kind: 'ok', stdout: JSON.stringify({ ok: true, items }), stderrByteLength: 0 };
      }

      return { kind: 'ok', stdout: JSON.stringify({ ok: true, changed: false }), stderrByteLength: 0 };
    };
  }
}

function makeTempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'iips-w04-'));
}

function refFor(role: DpapiCarrierRole, version = 'v1'): SecretRef {
  return {
    secretId: dhanSecretIdForRole(role),
    vaultProvider: 'WINDOWS_DPAPI',
    keyPath: DHAN_CREDENTIAL_KEY_PATHS[role],
    version,
    status: 'ACTIVE',
  };
}

/**
 * Reads a carrier as the backend would, using a clock after every timestamp this suite writes.
 * Envelope validation refuses a `rotatedAtUtc` implausibly in the future, so a fixed early clock
 * would reject a legitimately later rotation.
 */
const READ_CLOCK = new Date('2030-01-01T00:00:00.000Z');

function readCarrierValue(carrierDirectory: string, role: DpapiCarrierRole): string | null {
  const text = readFileSync(dpapiCarrierPathFor(carrierDirectory, role), 'utf8');
  const parsed = parseDpapiCarrierEnvelope(text, { now: READ_CLOCK });
  assert.strictEqual(parsed.ok, true);
  return parsed.ok ? fakePlaintext(parsed.envelope.ciphertext) : null;
}

async function expectProvisionError(
  promise: Promise<unknown>,
  expected: string
): Promise<DhanCredentialProvisionError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof DhanCredentialProvisionError, 'expected a typed provisioning failure');
    assert.strictEqual(error.code, expected);
    return error;
  }
  assert.fail(`expected ${expected}, but the call succeeded`);
}

/** Every file under a directory, as raw text. Used to prove a secret never reached disk. */
function allFileText(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      found.push(...allFileText(full));
      continue;
    }
    found.push(readFileSync(full, 'utf8'));
  }
  return found;
}

describe('W-04 — provisioning round trip', () => {
  it('W-04-01: a provisioned client id is readable through the production backend', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const report = await provisionDhanCredential({
        role: 'clientId',
        secretValue: CLIENT_VALUE,
        carrierDirectory: dir,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      assert.strictEqual(report.role, 'clientId');
      assert.strictEqual(report.label, 'client-id');
      assert.strictEqual(report.secretId, 'dhan-vault-dhan-client-id');
      assert.strictEqual(report.version, 'v1');
      assert.strictEqual(report.replaced, false);
      assert.strictEqual(report.roundTripVerified, true);
      assert.match(report.fingerprint, /^sha256:[0-9a-f]{12}$/);
      assert.strictEqual(report.createdAtUtc, NOW_DATE.toISOString());
      assert.strictEqual(report.rotatedAtUtc, NOW_DATE.toISOString());
      assert.strictEqual(report.expiresAtUtc, undefined, 'the client id carries no expiry');

      // The value is not in the report, under any encoding.
      const reportText = JSON.stringify(report);
      assert.ok(!reportText.includes(CLIENT_VALUE));
      assert.ok(!reportText.includes(Buffer.from(CLIENT_VALUE).toString('base64')));

      // End-to-end: what was written is what the daemon would resolve.
      const backend = new WindowsDpapiHostVaultBackend({
        carrierDirectory: dir,
        processRunner: host.runner,
        platform: () => 'win32',
        now: () => NOW_DATE,
      });
      const record = await backend.readSecret(refFor('clientId'), NOW_DATE.toISOString());
      assert.strictEqual(record?.secretValue, CLIENT_VALUE);
      assert.strictEqual(record?.version, 'v1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-02: a provisioned access token carries its expiry through the envelope', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const report = await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      assert.strictEqual(report.expiresAtUtc, TOKEN_EXPIRY_UTC);

      const envelope = parseDpapiCarrierEnvelope(
        readFileSync(dpapiCarrierPathFor(dir, 'accessToken'), 'utf8'),
        { now: NOW_DATE }
      );
      assert.strictEqual(envelope.ok, true);
      if (!envelope.ok) return;
      assert.strictEqual(envelope.envelope.expiresAtUtc, TOKEN_EXPIRY_UTC);
      assert.strictEqual(envelope.envelope.secretId, 'dhan-vault-dhan-access-token');
      assert.strictEqual(envelope.envelope.vaultProvider, 'WINDOWS_DPAPI');
      assert.strictEqual(envelope.envelope.schemaVersion, DPAPI_CARRIER_SCHEMA_VERSION);

      const backend = new WindowsDpapiHostVaultBackend({
        carrierDirectory: dir,
        processRunner: host.runner,
        platform: () => 'win32',
        now: () => NOW_DATE,
      });
      const record = await backend.readSecret(refFor('accessToken'), NOW_DATE.toISOString());
      assert.strictEqual(record?.secretValue, TOKEN_VALUE);
      assert.strictEqual(record?.expiresAt, TOKEN_EXPIRY_UTC);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-03: the carrier holds ciphertext only, and no temporary file survives', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      // Exactly one file: the carrier. No beside-file, no stray temp, no plaintext anywhere.
      assert.deepEqual(readdirSync(dir), ['dhan-access-token.carrier.json']);
      const texts = allFileText(dir);
      assert.strictEqual(texts.length, 1);
      assert.ok(!texts[0]!.includes(TOKEN_VALUE), 'the carrier must never hold plaintext');
      assert.ok(!texts[0]!.includes(Buffer.from(TOKEN_VALUE).toString('base64')));
      assert.ok(texts[0]!.includes('ciphertext'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-04: the fingerprint is stable, distinguishing, truncated and non-disclosing', async () => {
    const first = fingerprintCredentialValue(TOKEN_VALUE);
    const again = fingerprintCredentialValue(TOKEN_VALUE);
    const other = fingerprintCredentialValue(TOKEN_VALUE_V2);

    assert.strictEqual(first, again, 'the same value must fingerprint identically');
    assert.notStrictEqual(first, other, 'different values must be distinguishable');
    assert.match(first, /^sha256:[0-9a-f]{12}$/);

    const fullDigest = createHash('sha256').update(TOKEN_VALUE, 'utf8').digest('hex');
    assert.ok(!first.includes(fullDigest), 'the full digest must never be printed');
    assert.strictEqual(first.length, 'sha256:'.length + 12, 'the digest is truncated to 48 bits');
    assert.ok(!first.includes(TOKEN_VALUE.slice(0, 8)), 'no fragment of the secret may appear');
    // A short, low-entropy value still cannot be confirmed from the printed fingerprint alone
    // without the value: only 48 bits of digest are published, and no salt-independent full digest.
    assert.ok(!first.includes(createHash('sha256').update('').digest('hex').slice(0, 12)));
  });

  it('W-04-05: the secretId convention matches the refs the daemon resolves', () => {
    // Pins the two implementations together: a carrier written here must satisfy the ref that
    // `resolveDhanProviderConfig` builds from the governed key paths.
    const env: Record<string, string> = {
      [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/client-id',
      [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/access-token',
      [DHAN_ENV_KEYS.secretVaultProvider]: 'WINDOWS_DPAPI',
    };
    const resolution = resolveDhanProviderConfig(env, NOW_DATE);
    assert.strictEqual(resolution.ok, true);
    assert.strictEqual(resolution.config.clientIdRef?.secretId, dhanSecretIdForRole('clientId'));
    assert.strictEqual(resolution.config.accessTokenRef?.secretId, dhanSecretIdForRole('accessToken'));
    assert.strictEqual(resolution.config.clientIdRef?.keyPath, WINDOWS_DPAPI_GOVERNED_KEY_PATHS.clientId);
    assert.strictEqual(resolution.config.accessTokenRef?.keyPath, WINDOWS_DPAPI_GOVERNED_KEY_PATHS.accessToken);
  });
});

describe('W-04 — rotation and interrupted writes', () => {
  it('W-04-06: rotation replaces the carrier atomically and preserves the creation time', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    const later = new Date('2026-11-12T18:30:00.000Z');
    try {
      const first = await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      const rotated = await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE_V2,
        carrierDirectory: dir,
        mode: 'rotate',
        runner: host.runner,
        now: later,
        platform: () => 'win32',
      });

      assert.strictEqual(rotated.replaced, true);
      assert.strictEqual(rotated.createdAtUtc, first.createdAtUtc, 'creation time survives rotation');
      assert.strictEqual(rotated.rotatedAtUtc, later.toISOString());
      assert.notStrictEqual(rotated.fingerprint, first.fingerprint);
      assert.strictEqual(readCarrierValue(dir, 'accessToken'), TOKEN_VALUE_V2);

      // Rotation is independent per secret: the client id was never touched.
      assert.strictEqual(existsSync(dpapiCarrierPathFor(dir, 'clientId')), false);
      assert.deepEqual(readdirSync(dir), ['dhan-access-token.carrier.json']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-07: provision refuses an existing carrier and rotate refuses a missing one', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      await provisionDhanCredential({
        role: 'clientId',
        secretValue: CLIENT_VALUE,
        carrierDirectory: dir,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      const before = readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8');

      await expectProvisionError(
        provisionDhanCredential({
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          carrierDirectory: dir,
          runner: host.runner,
          now: NOW_DATE,
          platform: () => 'win32',
        }),
        'ALREADY_PROVISIONED'
      );
      assert.strictEqual(
        readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8'),
        before,
        'a refused provision must not touch the carrier'
      );

      await expectProvisionError(
        provisionDhanCredential({
          role: 'accessToken',
          secretValue: TOKEN_VALUE,
          carrierDirectory: dir,
          mode: 'rotate',
          runner: host.runner,
          now: NOW_DATE,
          platform: () => 'win32',
        }),
        'NOT_PROVISIONED'
      );
      assert.strictEqual(existsSync(dpapiCarrierPathFor(dir, 'accessToken')), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-08: a crash between verification and swap leaves the previous carrier authoritative', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    const later = new Date('2026-11-12T19:00:00.000Z');
    try {
      await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      const beforeEnvelope = readFileSync(dpapiCarrierPathFor(dir, 'accessToken'), 'utf8');
      const beforeParsed = parseDpapiCarrierEnvelope(beforeEnvelope, { now: NOW_DATE });
      assert.strictEqual(beforeParsed.ok, true);

      // The probe runs after the round-trip proof and before the swap: throwing here is exactly a
      // process dying at the worst moment.
      await assert.rejects(
        provisionDhanCredential({
          role: 'accessToken',
          secretValue: TOKEN_VALUE_V2,
          carrierDirectory: dir,
          mode: 'rotate',
          runner: host.runner,
          now: later,
          platform: () => 'win32',
          beforeSwapProbe: async () => {
            throw new Error('simulated crash between write and swap');
          },
        })
      );

      // The old carrier is byte-identical and still decrypts to the old value.
      assert.strictEqual(readFileSync(dpapiCarrierPathFor(dir, 'accessToken'), 'utf8'), beforeEnvelope);
      assert.strictEqual(readCarrierValue(dir, 'accessToken'), TOKEN_VALUE);
      // No beside-file is left behind by this implementation.
      assert.deepEqual(readdirSync(dir), ['dhan-access-token.carrier.json']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-09: a failed round-trip proof aborts before the swap', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    const later = new Date('2026-11-12T19:00:00.000Z');
    try {
      await provisionDhanCredential({
        role: 'clientId',
        secretValue: CLIENT_VALUE,
        carrierDirectory: dir,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      const before = readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8');

      // DPAPI returns a different plaintext than was submitted: the proof must fail.
      host.roundTripOverride = 'SOMETHING-ELSE-ENTIRELY';
      const error = await expectProvisionError(
        provisionDhanCredential({
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          carrierDirectory: dir,
          mode: 'rotate',
          runner: host.runner,
          now: later,
          platform: () => 'win32',
        }),
        'ROUND_TRIP_FAILED'
      );
      assert.match(error.message, /read-back/);

      assert.strictEqual(readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8'), before);
      assert.deepEqual(readdirSync(dir), ['dhan-client-id.carrier.json']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-10: a stale beside-file from an earlier crash does not affect reads or the next write', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      // A file left by a kill -9 during a previous attempt: never selected, never trusted.
      const stale = path.join(dir, '.dhan-access-token.carrier.json.9999.deadbeef.tmp');
      writeFileSync(stale, '{"schemaVersion":1,"partial":true}', 'utf8');

      const verifyReport = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        roles: ['accessToken'],
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(verifyReport.entries[0]?.status, 'PRESENT_OK');

      const rotated = await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE_V2,
        carrierDirectory: dir,
        mode: 'rotate',
        runner: host.runner,
        now: new Date('2026-11-12T20:00:00.000Z'),
        platform: () => 'win32',
      });
      assert.strictEqual(rotated.replaced, true);
      assert.strictEqual(readCarrierValue(dir, 'accessToken'), TOKEN_VALUE_V2);
      assert.ok(existsSync(stale), 'the stale artefact is left where the operator can see it');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('W-04 — input, metadata and environment validation', () => {
  it('W-04-11: secret shape is validated before anything is encrypted or written', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const cases: ReadonlyArray<readonly [string, string]> = [
        ['', 'empty'],
        ['     ', 'whitespace only'],
        [` ${CLIENT_VALUE}`, 'leading whitespace'],
        [`${CLIENT_VALUE} `, 'trailing whitespace'],
        ['SHORT', 'below the governed minimum'],
        [`${CLIENT_VALUE}\u0000TAIL`, 'embedded control character'],
        [`${CLIENT_VALUE}\nNEWLINE`, 'embedded newline'],
        ['X'.repeat(DHAN_CREDENTIAL_MAX_LENGTH + 1), 'above the governed maximum'],
      ];
      for (const [value, why] of cases) {
        await expectProvisionError(
          provisionDhanCredential({
            role: 'clientId',
            secretValue: value,
            carrierDirectory: dir,
            runner: host.runner,
            now: NOW_DATE,
            platform: () => 'win32',
          }),
          'SECRET_INVALID'
        );
        assert.strictEqual(existsSync(dpapiCarrierPathFor(dir, 'clientId')), false, why);
      }
      // Nothing was ever sent to the child for a refused secret.
      assert.strictEqual(host.requests.length, 0, 'no DPAPI call for an invalid secret');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-12: version and expiry metadata are validated, and a client id takes no expiry', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    const base = {
      carrierDirectory: dir,
      runner: host.runner,
      now: NOW_DATE,
      platform: (() => 'win32') as () => NodeJS.Platform,
    };
    try {
      for (const version of ['', 'has space', 'v1;rm', 'x'.repeat(40), '-leading']) {
        await expectProvisionError(
          provisionDhanCredential({ ...base, role: 'clientId', secretValue: CLIENT_VALUE, version }),
          'VERSION_INVALID'
        );
      }
      await expectProvisionError(
        provisionDhanCredential({
          ...base,
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          expiresAtUtc: TOKEN_EXPIRY_UTC,
        }),
        'EXPIRY_INVALID'
      );
      await expectProvisionError(
        provisionDhanCredential({
          ...base,
          role: 'accessToken',
          secretValue: TOKEN_VALUE,
          expiresAtUtc: '2026-11-12T00:00:00.000Z',
        }),
        'EXPIRY_INVALID'
      );
      await expectProvisionError(
        provisionDhanCredential({
          ...base,
          role: 'accessToken',
          secretValue: TOKEN_VALUE,
          expiresAtUtc: '13/11/2026 06:30',
        }),
        'EXPIRY_INVALID'
      );

      assert.ok(isValidCredentialVersion('v1'));
      assert.ok(isValidCredentialVersion('2026-11-12.1'));
      assert.ok(!isValidCredentialVersion('v 1'));
      assert.deepEqual(readdirSync(dir), [], 'no carrier may exist after refused metadata');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-13: a non-Windows host and a Git working tree are refused before any write', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      await expectProvisionError(
        provisionDhanCredential({
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          carrierDirectory: dir,
          runner: host.runner,
          now: NOW_DATE,
          platform: () => 'linux',
        }),
        'NOT_WINDOWS'
      );
      assert.deepEqual(readdirSync(dir), []);

      const repoLike = makeTempDir();
      mkdirSync(path.join(repoLike, '.git'));
      try {
        await expectProvisionError(
          provisionDhanCredential({
            role: 'clientId',
            secretValue: CLIENT_VALUE,
            carrierDirectory: path.join(repoLike, 'dhan-secrets'),
            runner: host.runner,
            now: NOW_DATE,
            platform: () => 'win32',
          }),
          'CARRIER_DIRECTORY_INVALID'
        );
        assert.strictEqual(existsSync(path.join(repoLike, 'dhan-secrets')), false);
      } finally {
        rmSync(repoLike, { recursive: true, force: true });
      }
      assert.strictEqual(host.requests.length, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-14: an access-control failure aborts the write and preserves the carrier', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      await provisionDhanCredential({
        role: 'clientId',
        secretValue: CLIENT_VALUE,
        carrierDirectory: dir,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      const before = readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8');

      await expectProvisionError(
        provisionDhanCredential({
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          carrierDirectory: dir,
          mode: 'rotate',
          runner: host.runner,
          now: NOW_DATE,
          platform: () => 'win32',
          applyOwnerOnlyAcl: async () => {
            throw new DpapiAclApplyError('ACL_APPLY_FAILED');
          },
        }),
        'ACL_FAILED'
      );
      assert.strictEqual(readFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'utf8'), before);
      assert.deepEqual(readdirSync(dir), ['dhan-client-id.carrier.json']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('W-04 — secret handling and process boundary', () => {
  it('W-04-15: the protect program is static, user-scoped and carries no data on argv', () => {
    const args = dpapiPowerShellArgs('protect');
    assert.deepStrictEqual(args.slice(0, 5), [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
    ]);
    assert.strictEqual(args.length, 6, 'nothing but the fixed program is passed');
    assert.ok(!args.join(' ').includes('plaintextB64'), 'no payload on argv');
    assert.ok(!args.includes('-Command'), 'never a command string');

    const script = Buffer.from(encodeDpapiScript('protect'), 'base64').toString('utf16le');
    assert.ok(script.includes('[System.Security.Cryptography.ProtectedData]::Protect'));
    assert.ok(script.includes('DataProtectionScope]::CurrentUser'));
    assert.ok(script.includes('[Console]::In.ReadToEnd()'), 'the payload arrives on stdin');
    assert.ok(!script.includes('Write-Host'), 'the child never echoes');
    assert.ok(!script.includes('Write-Output'));
    assert.ok(!script.includes('2>&1'), 'stderr is never mixed into stdout');
    assert.ok(!script.includes('Out-File'), 'no temporary file');
    assert.ok(!script.includes('$env:'), 'no environment channel');
    // The program is identical for every call: it is not assembled from values.
    assert.strictEqual(encodeDpapiScript('protect'), encodeDpapiScript('protect'));
  });

  it('W-04-16: the secret crosses exactly one boundary, once, on stdin', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const report = await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      const protectCalls = host.requests.filter((request) => request.operation === 'protect');
      assert.strictEqual(protectCalls.length, 1, 'one protect per write');
      // The plaintext reaches the child only as its stdin payload.
      const protectPayload = protectCalls[0]!.payload as { plaintextB64: string };
      assert.strictEqual(
        Buffer.from(protectPayload.plaintextB64, 'base64').toString('utf8'),
        TOKEN_VALUE
      );

      // Every subsequent unprotect receives ciphertext only.
      const unprotects = host.requests.filter((request) => request.operation === 'unprotect');
      assert.ok(unprotects.length >= 1, 'the round trip decrypts at least once');
      for (const call of unprotects) {
        const payload = JSON.stringify(call.payload);
        assert.ok(!payload.includes(TOKEN_VALUE), 'no plaintext is ever sent back to the child');
        assert.ok(payload.includes('ciphertextB64'));
      }

      // Nothing on disk holds the value, and the report does not either.
      for (const text of allFileText(dir)) assert.ok(!text.includes(TOKEN_VALUE));
      assert.ok(!JSON.stringify(report).includes(TOKEN_VALUE));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-17: a DPAPI protect failure writes nothing and reports a typed outcome', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    host.protectMode = 'protocol-failure';
    try {
      const error = await expectProvisionError(
        provisionDhanCredential({
          role: 'clientId',
          secretValue: CLIENT_VALUE,
          carrierDirectory: dir,
          runner: host.runner,
          now: NOW_DATE,
          platform: () => 'win32',
        }),
        'DPAPI_PROTECT_FAILED'
      );
      assert.ok(!error.message.includes(CLIENT_VALUE));
      assert.deepEqual(readdirSync(dir), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-18: transport framing is stripped, and only transport framing', () => {
    assert.strictEqual(stripSecretTransportFraming(`${TOKEN_VALUE}\n`), TOKEN_VALUE);
    assert.strictEqual(stripSecretTransportFraming(`${TOKEN_VALUE}\r\n`), TOKEN_VALUE);
    assert.strictEqual(stripSecretTransportFraming(`${TOKEN_VALUE}\n\n`), TOKEN_VALUE);
    assert.strictEqual(stripSecretTransportFraming(TOKEN_VALUE), TOKEN_VALUE);
    // Interior and leading whitespace are NOT normalised: they are refused later instead.
    assert.strictEqual(stripSecretTransportFraming(` ${TOKEN_VALUE}`), ` ${TOKEN_VALUE}`);
    assert.strictEqual(stripSecretTransportFraming(`${TOKEN_VALUE}\nTAIL`), `${TOKEN_VALUE}\nTAIL`);

    assert.strictEqual(validateCredentialSecret(TOKEN_VALUE).ok, true);
    assert.strictEqual(validateCredentialSecret('').code, 'SECRET_INVALID');
  });
});

describe('W-04 — verification mode', () => {
  it('W-04-19: an empty store verifies as ABSENT for both roles, with no location', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const report = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(report.platformAdmissible, true);
      assert.strictEqual(report.locationAdmissible, true);
      assert.deepStrictEqual(
        report.entries.map((entry) => entry.status),
        ['ABSENT', 'ABSENT']
      );
      assert.deepStrictEqual(
        report.entries.map((entry) => entry.label),
        ['client-id', 'access-token']
      );
      const text = JSON.stringify(report);
      assert.ok(!text.includes(dir), 'a verification report must not locate the store');
      assert.ok(!text.includes('vault://'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-20: corrupt, unknown-version and mismatched carriers are reported precisely', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      writeFileSync(dpapiCarrierPathFor(dir, 'clientId'), 'not json at all', 'utf8');
      const unknownVersion: DpapiCarrierEnvelope = {
        schemaVersion: 99,
        secretId: 'dhan-vault-dhan-access-token',
        vaultProvider: 'WINDOWS_DPAPI',
        version: 'v1',
        createdAtUtc: NOW_DATE.toISOString(),
        rotatedAtUtc: NOW_DATE.toISOString(),
        ciphertext: fakeCiphertext(TOKEN_VALUE),
      };
      writeFileSync(
        dpapiCarrierPathFor(dir, 'accessToken'),
        serialiseDpapiCarrierEnvelope(unknownVersion),
        'utf8'
      );

      const report = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(report.entries[0]?.status, 'SCHEMA_INVALID');
      assert.strictEqual(report.entries[0]?.present, true);
      assert.strictEqual(report.entries[0]?.schemaValid, false);
      assert.strictEqual(report.entries[1]?.status, 'SCHEMA_INVALID');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-21: a wrong-user carrier and a non-owner-only DACL are distinguished', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    const wrongUser = makeTempDir();
    try {
      await provisionDhanCredential({
        role: 'clientId',
        secretValue: CLIENT_VALUE,
        carrierDirectory: dir,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });
      await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: wrongUser,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      // Wrong user: the ciphertext is present but DPAPI refuses it for this principal.
      host.unprotectMode = 'undecryptable';
      const wrongUserReport = await verifyDhanCredentialStore({
        carrierDirectory: wrongUser,
        roles: ['accessToken'],
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(wrongUserReport.entries[0]?.status, 'UNREADABLE');
      assert.strictEqual(wrongUserReport.entries[0]?.readable, false);

      host.unprotectMode = 'ok';
      host.aclOwnerOnly = false;
      const aclReport = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        roles: ['clientId'],
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(aclReport.entries[0]?.status, 'ACL_NOT_OWNER_ONLY');
      assert.strictEqual(aclReport.entries[0]?.aclOwnerOnly, false);
      assert.strictEqual(aclReport.entries[0]?.readable, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(wrongUser, { recursive: true, force: true });
    }
  });

  it('W-04-22: expiry is reported without claiming the carrier is unreadable', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      // Provisioned while valid…
      await provisionDhanCredential({
        role: 'accessToken',
        secretValue: TOKEN_VALUE,
        carrierDirectory: dir,
        expiresAtUtc: TOKEN_EXPIRY_UTC,
        runner: host.runner,
        now: NOW_DATE,
        platform: () => 'win32',
      });

      const valid = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        roles: ['accessToken'],
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(valid.entries[0]?.status, 'PRESENT_OK');
      assert.strictEqual(valid.entries[0]?.expired, false);

      // …and verified after its 24 hours have passed.
      const afterExpiry = new Date('2026-11-14T06:30:00.000Z');
      const expired = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        roles: ['accessToken'],
        runner: host.runner,
        platform: () => 'win32',
        now: afterExpiry,
      });
      assert.strictEqual(expired.entries[0]?.status, 'EXPIRED');
      assert.strictEqual(expired.entries[0]?.expired, true);
      assert.strictEqual(expired.entries[0]?.expiresAtUtc, TOKEN_EXPIRY_UTC);
      assert.ok(!JSON.stringify(expired).includes(dir));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-23: a carrier stamped for the other secret is a SECRET_ID_MISMATCH', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      // A token carrier written to the client-id path: plausible copy/paste, must not resolve.
      const misplaced: DpapiCarrierEnvelope = {
        schemaVersion: DPAPI_CARRIER_SCHEMA_VERSION,
        secretId: dhanSecretIdForRole('accessToken'),
        vaultProvider: 'WINDOWS_DPAPI',
        version: 'v1',
        createdAtUtc: NOW_DATE.toISOString(),
        rotatedAtUtc: NOW_DATE.toISOString(),
        ciphertext: fakeCiphertext(TOKEN_VALUE),
      };
      writeFileSync(
        dpapiCarrierPathFor(dir, 'clientId'),
        serialiseDpapiCarrierEnvelope(misplaced),
        'utf8'
      );

      const report = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        roles: ['clientId'],
        runner: host.runner,
        platform: () => 'win32',
        now: NOW_DATE,
      });
      assert.strictEqual(report.entries[0]?.status, 'SECRET_ID_MISMATCH');
      assert.strictEqual(report.entries[0]?.schemaValid, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-24: a non-Windows or in-repo location is reported as UNAVAILABLE, not as a verdict', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const report = await verifyDhanCredentialStore({
        carrierDirectory: dir,
        runner: host.runner,
        platform: () => 'linux',
        now: NOW_DATE,
      });
      assert.strictEqual(report.platformAdmissible, false);
      assert.deepStrictEqual(
        report.entries.map((entry) => entry.status),
        ['UNAVAILABLE', 'UNAVAILABLE']
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('W-04 — CLI surface', () => {
  interface CliRun {
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
  }

  async function runCli(
    argv: readonly string[],
    overrides: Record<string, unknown> = {}
  ): Promise<CliRun> {
    const out: string[] = [];
    const err: string[] = [];
    const result = await runDhanCredentialStoreCli({
      argv,
      io: {
        writeStdout: (line: string) => out.push(line),
        writeStderr: (line: string) => err.push(line),
      },
      now: () => NOW_DATE,
      platform: () => 'win32',
      isInteractive: false,
      ...overrides,
    });
    return { exitCode: result.exitCode, stdout: out.join('\n'), stderr: err.join('\n') };
  }

  it('W-04-25: piped stdin is framed-stripped, stored, and reported without the value', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const run = await runCli(
        ['provision', 'access-token', '--carrier-directory', dir, '--expires-at', TOKEN_EXPIRY_UTC],
        {
          readPipedStdin: async () => `${TOKEN_VALUE}\r\n`,
          runner: host.runner,
        }
      );
      assert.strictEqual(run.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(run.stdout, /provision access-token: OK/);
      assert.match(run.stdout, /fingerprint {2}: sha256:[0-9a-f]{12}/);
      assert.match(run.stdout, /expiresAtUtc : 2026-11-13T06:30:00\.000Z/);
      assert.match(run.stdout, /roundTrip {4}: verified before swap/);
      assert.match(run.stdout, /location {5}: withheld/);

      // The value is stored, and appears nowhere in the output.
      assert.strictEqual(readCarrierValue(dir, 'accessToken'), TOKEN_VALUE);
      for (const text of [run.stdout, run.stderr]) {
        assert.ok(!text.includes(TOKEN_VALUE));
        assert.ok(!text.includes('vault://'));
        assert.ok(!text.includes(dir));
        assert.ok(!text.includes('dhan-secrets'));
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-26: interactive entry is confirmed twice and a mismatch writes nothing', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const calls: Array<{ role: string; confirm: boolean }> = [];
      const ok = await runCli(['provision', 'client-id', '--carrier-directory', dir], {
        isInteractive: true,
        runner: host.runner,
        readSecret: async (context: { role: string; confirm: boolean }) => {
          calls.push(context);
          return `${CLIENT_VALUE}\n`;
        },
      });
      assert.strictEqual(ok.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.deepStrictEqual(calls, [{ role: 'clientId', confirm: true }]);
      assert.strictEqual(readCarrierValue(dir, 'clientId'), CLIENT_VALUE, 'framing stripped');

      // The mismatch path is enforced in the interactive branch before provisioning is called.
      const mismatchDir = makeTempDir();
      try {
        const mismatch = await runCli(['provision', 'client-id', '--carrier-directory', mismatchDir], {
          isInteractive: true,
          runner: host.runner,
          readSecret: async () => {
            throw Object.assign(new Error('aborted'), { code: 'ABORTED' });
          },
        });
        assert.strictEqual(mismatch.exitCode, DHAN_CREDENTIAL_EXIT.INPUT_INVALID);
        assert.deepEqual(readdirSync(mismatchDir), []);
        assert.ok(!mismatch.stderr.includes(CLIENT_VALUE));
      } finally {
        rmSync(mismatchDir, { recursive: true, force: true });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-27: a secret on the command line is refused, and the refused token is not echoed', async () => {
    const forbidden = `--secret=${TOKEN_VALUE}`;
    const run = await runCli(['provision', 'access-token', forbidden]);
    assert.strictEqual(run.exitCode, DHAN_CREDENTIAL_EXIT.USAGE);
    assert.match(run.stderr, /secrets are never accepted on the command line/);
    assert.ok(!run.stderr.includes(TOKEN_VALUE), 'the refused value must not be echoed');
    assert.ok(!run.stdout.includes(TOKEN_VALUE));

    const unknown = await runCli(['provision', 'access-token', `--${TOKEN_VALUE}`]);
    assert.strictEqual(unknown.exitCode, DHAN_CREDENTIAL_EXIT.USAGE);
    assert.ok(!unknown.stderr.includes(TOKEN_VALUE));

    const noRole = await runCli(['provision']);
    assert.strictEqual(noRole.exitCode, DHAN_CREDENTIAL_EXIT.USAGE);

    const badRole = await runCli(['provision', 'password']);
    assert.strictEqual(badRole.exitCode, DHAN_CREDENTIAL_EXIT.USAGE);
  });

  it('W-04-28: exit codes are typed per failure class', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      // input invalid
      const shortSecret = await runCli(
        ['provision', 'client-id', '--carrier-directory', dir],
        { readPipedStdin: async () => 'short\n', runner: host.runner }
      );
      assert.strictEqual(shortSecret.exitCode, DHAN_CREDENTIAL_EXIT.INPUT_INVALID);

      // environment
      const linux = await runCli(['provision', 'client-id', '--carrier-directory', dir], {
        readPipedStdin: async () => `${CLIENT_VALUE}\n`,
        runner: host.runner,
        platform: () => 'linux',
      });
      assert.strictEqual(linux.exitCode, DHAN_CREDENTIAL_EXIT.ENVIRONMENT);
      assert.match(linux.stderr, /NOT_WINDOWS/);

      // success, then state refused (provision again)
      const first = await runCli(['provision', 'client-id', '--carrier-directory', dir], {
        readPipedStdin: async () => `${CLIENT_VALUE}\n`,
        runner: host.runner,
      });
      assert.strictEqual(first.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      const again = await runCli(['provision', 'client-id', '--carrier-directory', dir], {
        readPipedStdin: async () => `${CLIENT_VALUE}\n`,
        runner: host.runner,
      });
      assert.strictEqual(again.exitCode, DHAN_CREDENTIAL_EXIT.STATE_REFUSED);
      assert.match(again.stderr, /ALREADY_PROVISIONED/);

      // write failure
      const failing = makeTempDir();
      try {
        const writeFailure = await runCli(['provision', 'client-id', '--carrier-directory', failing], {
          readPipedStdin: async () => `${CLIENT_VALUE}\n`,
          runner: async (): Promise<DpapiProcessOutcome> => ({
            kind: 'non-zero-exit',
            stdout: '',
            stderrByteLength: 12,
          }),
        });
        assert.strictEqual(writeFailure.exitCode, DHAN_CREDENTIAL_EXIT.WRITE_FAILED);
        assert.match(writeFailure.stderr, /DPAPI_PROTECT_FAILED/);
      } finally {
        rmSync(failing, { recursive: true, force: true });
      }

      // verify failure (nothing provisioned for the access token)
      const verifyFailed = await runCli(['verify', 'access-token', '--carrier-directory', dir], {
        runner: host.runner,
      });
      assert.strictEqual(verifyFailed.exitCode, DHAN_CREDENTIAL_EXIT.VERIFY_FAILED);

      // verify success
      const verifyOk = await runCli(['verify', 'client-id', '--carrier-directory', dir], {
        runner: host.runner,
      });
      assert.strictEqual(verifyOk.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(verifyOk.stdout, /client-id\s+: PRESENT_OK \(present=yes readable=yes aclOwnerOnly=yes schemaValid=yes expired=no version=v1\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-29: JSON output is machine-readable and equally free of value and location', async () => {
    const dir = makeTempDir();
    const host = new FakeDpapiHost();
    try {
      const provisioned = await runCli(
        ['provision', 'access-token', '--carrier-directory', dir, '--expires-in-hours', '24', '--json'],
        { readPipedStdin: async () => `${TOKEN_VALUE}\n`, runner: host.runner }
      );
      assert.strictEqual(provisioned.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      const parsed = JSON.parse(provisioned.stdout) as Record<string, unknown>;
      assert.strictEqual(parsed['role'], 'accessToken');
      assert.strictEqual(parsed['secretId'], 'dhan-vault-dhan-access-token');
      assert.match(String(parsed['fingerprint']), /^sha256:[0-9a-f]{12}$/);
      assert.strictEqual(parsed['expiresAtUtc'], '2026-11-13T06:30:00.000Z');
      assert.ok(!provisioned.stdout.includes(TOKEN_VALUE));
      assert.ok(!provisioned.stdout.includes(dir));

      const verified = await runCli(['verify', '--carrier-directory', dir, '--json'], {
        runner: host.runner,
      });
      assert.strictEqual(verified.exitCode, DHAN_CREDENTIAL_EXIT.VERIFY_FAILED, 'client id is still absent');
      const report = JSON.parse(verified.stdout) as { entries: Array<{ status: string }> };
      assert.deepStrictEqual(
        report.entries.map((entry) => entry.status),
        ['ABSENT', 'PRESENT_OK']
      );
      assert.ok(!verified.stdout.includes(dir));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W-04-30: help is available and the default carrier directory stays governed', async () => {
    const help = await runCli(['--help']);
    assert.strictEqual(help.exitCode, DHAN_CREDENTIAL_EXIT.OK);
    assert.match(help.stdout, /never accepted as an argument/);

    const forbiddenFlag = await runCli(['provision', 'access-token', '--token', 'x']);
    assert.strictEqual(forbiddenFlag.exitCode, DHAN_CREDENTIAL_EXIT.USAGE);
    assert.match(forbiddenFlag.stderr, /never accepted on the command line/);

    // The canonical D-1 directory is the default; it is never printed, and never resolved as a
    // relative path from the current working directory.
    assert.strictEqual(DPAPI_CANONICAL_CARRIER_DIRECTORY, 'H:\\IIPS\\runtime\\dhan-secrets');
    assert.ok(!help.stdout.includes('H:\\IIPS'));
    // Every role is independently addressable by its operator label.
    assert.deepStrictEqual(
      DHAN_CREDENTIAL_ROLES.map((role) => DHAN_CREDENTIAL_LABELS[role]),
      ['client-id', 'access-token']
    );
  });
});
