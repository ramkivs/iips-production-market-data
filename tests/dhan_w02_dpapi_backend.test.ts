/**
 * Institutional Investment Platform System (IIPS)
 * W-02 — Windows DPAPI Secret-Store Backend
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1)
 * Authority: D-1 (Windows DPAPI user scope, two carriers, owner-only DACL, atomic replace)
 * Work item: W-02
 *
 * SCOPE OF PROOF:
 *  Unit-level proof of the DPAPI backend against an INJECTED child-process runner. No
 *  real DPAPI call, no Dhan credential and no vendor interaction is involved. The DPAPI
 *  primitive itself is exercised on a Windows host under the W-02 exit criteria; this
 *  suite proves the carrier format, the carrier separation, the DACL gate, atomic
 *  replacement, every failure classification and the readiness gate — all deterministically.
 *
 *  Every value used here is a synthetic fixture. Nothing in this file is a credential.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  LocalHostVaultDhanCredentialResolver,
  SecretRef,
  resolveDhanProviderConfig,
  DHAN_ENV_KEYS,
} from '../src/index.js';

import {
  DPAPI_CANONICAL_CARRIER_DIRECTORY,
  DPAPI_CARRIER_DIRECTORY_NAME,
  DPAPI_CARRIER_FILENAMES,
  DPAPI_CARRIER_SCHEMA_VERSION,
  DpapiCarrierEnvelope,
  DpapiCarrierWriteError,
  dpapiCarrierPathFor,
  findGitWorkingTreeRoot,
  parseDpapiCarrierEnvelope,
  resolveDpapiCarrierRole,
  serialiseDpapiCarrierEnvelope,
  writeDpapiCarrierAtomically,
} from '../src/providers/dhan/dhan_dpapi_carrier.js';

import {
  DpapiProcessOutcome,
  DpapiProcessRequest,
  DpapiProcessRunner,
  createPowerShellDpapiProcessRunner,
  dpapiPowerShellArgs,
  encodeDpapiScript,
} from '../src/providers/dhan/dhan_dpapi_process.js';

import {
  WINDOWS_DPAPI_BACKEND_ID,
  WINDOWS_DPAPI_GOVERNED_KEY_PATHS,
  WindowsDpapiHostVaultBackend,
} from '../src/providers/dhan/dhan_dpapi_vault_backend.js';

import {
  DhanVaultResolutionError,
  DisabledWindowsHostVaultBackend,
  UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID,
} from '../src/providers/dhan/dhan_local_vault_resolver.js';

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic fixtures — never credentials
// ─────────────────────────────────────────────────────────────────────────────

const CREATED_UTC = '2026-11-12T06:00:00.000Z';
const ROTATED_UTC = '2026-11-12T06:05:00.000Z';
const NOW_DATE = new Date('2026-11-12T07:00:00.000Z');
const AS_OF_UTC = NOW_DATE.toISOString();
const TOKEN_EXPIRY_UTC = '2026-11-13T06:00:00.000Z';

/** Obviously synthetic values. They exist only in this suite's memory. */
const SYNTHETIC_CLIENT_VALUE = 'SYNTHETIC-CLIENT-PLACEHOLDER-0001';
const SYNTHETIC_TOKEN_VALUE = 'SYNTHETIC-TOKEN-PLACEHOLDER-0002';

const CLIENT_SECRET_ID = 'dhan-vault-dhan-client-id';
const TOKEN_SECRET_ID = 'dhan-vault-dhan-access-token';

/** Stand-in for DPAPI: a reversible, obviously-fake transform. Never used live. */
function fakeProtect(value: string): string {
  return Buffer.from(`DPAPI-USER-SCOPE::${value}`, 'utf8').toString('base64');
}

function fakeUnprotect(ciphertextB64: string): string | null {
  try {
    const text = Buffer.from(ciphertextB64, 'base64').toString('utf8');
    const marker = 'DPAPI-USER-SCOPE::';
    if (!text.startsWith(marker)) return null;
    return text.slice(marker.length);
  } catch {
    return null;
  }
}

interface FakeAcl {
  readonly exists?: boolean;
  readonly protected?: boolean;
  readonly onlyOwnerAndSystem?: boolean;
  readonly ownerIsCurrentUser?: boolean;
}

type UnprotectMode =
  | 'ok'
  | 'undecryptable'
  | 'non-zero-exit'
  | 'empty-output'
  | 'invalid-json'
  | 'spawn-failed'
  | 'timeout'
  | 'output-overflow';

class FakeDpapiHost {
  public readonly requests: DpapiProcessRequest[] = [];
  public readonly aclByPath = new Map<string, FakeAcl>();
  public aclDefault: FakeAcl = {
    protected: true,
    onlyOwnerAndSystem: true,
    ownerIsCurrentUser: true,
  };
  public unprotectMode: UnprotectMode = 'ok';
  public aclMode: 'ok' | 'non-zero-exit' = 'ok';
  /** Simulated child stderr material that must never be surfaced anywhere. */
  public stderrMaterial = '';

  public readonly runner: DpapiProcessRunner = async (
    request: DpapiProcessRequest
  ): Promise<DpapiProcessOutcome> => {
    this.requests.push(request);

    if (request.operation === 'describe-acl') {
      if (this.aclMode === 'non-zero-exit') {
        return {
          kind: 'non-zero-exit',
          stdout: '',
          stderrByteLength: this.stderrMaterial.length,
        };
      }
      const paths = (request.payload.paths as string[]) ?? [];
      const items = paths.map((p) => {
        const acl = this.aclByPath.get(p) ?? this.aclDefault;
        const exists = acl.exists ?? fs.existsSync(p);
        return {
          path: p,
          exists,
          protected: acl.protected ?? true,
          onlyOwnerAndSystem: acl.onlyOwnerAndSystem ?? true,
          ownerIsCurrentUser: acl.ownerIsCurrentUser ?? true,
        };
      });
      return { kind: 'ok', stdout: JSON.stringify({ ok: true, items }), stderrByteLength: 0 };
    }

    const ciphertextB64 = String(request.payload.ciphertextB64 ?? '');
    switch (this.unprotectMode) {
      case 'non-zero-exit':
        return {
          kind: 'non-zero-exit',
          stdout: '',
          stderrByteLength: this.stderrMaterial.length,
        };
      case 'empty-output':
        return { kind: 'empty-output', stdout: '', stderrByteLength: 0 };
      case 'spawn-failed':
        return { kind: 'spawn-failed', stdout: '', stderrByteLength: 0 };
      case 'timeout':
        return {
          kind: 'timeout',
          stdout: '',
          stderrByteLength: this.stderrMaterial.length,
        };
      case 'output-overflow':
        return { kind: 'output-overflow', stdout: '', stderrByteLength: 0 };
      case 'invalid-json':
        return { kind: 'ok', stdout: 'not-json', stderrByteLength: 0 };
      case 'undecryptable':
        return {
          kind: 'ok',
          stdout: JSON.stringify({ ok: false, kind: 'DPAPI_UNPROTECT_FAILED' }),
          stderrByteLength: 0,
        };
      case 'ok':
      default: {
        const plaintext = fakeUnprotect(ciphertextB64);
        if (plaintext === null) {
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
            plaintextB64: Buffer.from(plaintext, 'utf8').toString('base64'),
          }),
          stderrByteLength: 0,
        };
      }
    }
  };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iips-w02-'));
}

function windowsRef(keyPath: string, secretId: string, version = 'v1'): SecretRef {
  return {
    secretId,
    vaultProvider: 'WINDOWS_DPAPI',
    keyPath,
    version,
    status: 'ACTIVE',
  };
}

function makeEnvelope(overrides: Partial<DpapiCarrierEnvelope> = {}): DpapiCarrierEnvelope {
  return {
    schemaVersion: DPAPI_CARRIER_SCHEMA_VERSION,
    secretId: CLIENT_SECRET_ID,
    vaultProvider: 'WINDOWS_DPAPI',
    version: 'v1',
    createdAtUtc: CREATED_UTC,
    rotatedAtUtc: ROTATED_UTC,
    ciphertext: fakeProtect(SYNTHETIC_CLIENT_VALUE),
    ...overrides,
  };
}

function writeCarrierFile(dir: string, role: 'clientId' | 'accessToken', envelope: unknown): string {
  const target = dpapiCarrierPathFor(dir, role);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, typeof envelope === 'string' ? envelope : serialiseDpapiCarrierEnvelope(envelope as DpapiCarrierEnvelope), 'utf8');
  return target;
}

function writeBothCarriers(dir: string): void {
  writeCarrierFile(dir, 'clientId', makeEnvelope({ ciphertext: fakeProtect(SYNTHETIC_CLIENT_VALUE) }));
  writeCarrierFile(
    dir,
    'accessToken',
    makeEnvelope({
      secretId: TOKEN_SECRET_ID,
      expiresAtUtc: TOKEN_EXPIRY_UTC,
      ciphertext: fakeProtect(SYNTHETIC_TOKEN_VALUE),
    })
  );
}

function backendFor(dir: string, host: FakeDpapiHost): WindowsDpapiHostVaultBackend {
  return new WindowsDpapiHostVaultBackend({
    carrierDirectory: dir,
    processRunner: host.runner,
    platform: () => 'win32',
    now: () => NOW_DATE,
  });
}

async function expectReason(
  promise: Promise<unknown>,
  reason: string,
  message?: string
): Promise<DhanVaultResolutionError> {
  try {
    await promise;
  } catch (err) {
    assert.ok(err instanceof DhanVaultResolutionError, `expected DhanVaultResolutionError, got ${String(err)}`);
    assert.strictEqual(err.reason, reason);
    assert.ok(err.message.length > 0);
    if (message !== undefined) {
      assert.ok(
        !err.message.includes(message),
        'error message must never contain the value or child output'
      );
    }
    return err;
  }
  assert.fail(`expected rejection with reason ${reason}, but the call resolved`);
}

// ─────────────────────────────────────────────────────────────────────────────
// W-02-01 — encryption/decryption path
// ─────────────────────────────────────────────────────────────────────────────

describe('W-02 / Windows DPAPI secret-store backend', () => {
  it('W-02-01: decrypts a carrier through the child process without exposing the value to argv, payload or errors', async () => {
    const dir = makeTempDir();
    writeBothCarriers(dir);
    const host = new FakeDpapiHost();
    const backend = backendFor(dir, host);

    const record = await backend.readSecret(windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID), AS_OF_UTC);

    assert.ok(record);
    assert.strictEqual(record.secretValue, SYNTHETIC_CLIENT_VALUE);
    assert.strictEqual(record.status, 'ACTIVE');
    assert.strictEqual(record.version, 'v1');
    assert.strictEqual(record.expiresAt, undefined, 'client id carries no expiry');

    // The child process received the ciphertext only — never the plaintext.
    const unprotectCalls = host.requests.filter((r) => r.operation === 'unprotect');
    assert.strictEqual(unprotectCalls.length, 1);
    const payload = JSON.stringify(unprotectCalls[0].payload);
    assert.ok(payload.includes('ciphertextB64'));
    assert.ok(!payload.includes(SYNTHETIC_CLIENT_VALUE));
    assert.ok(!payload.includes('DPAPI-USER-SCOPE::'));

    // Nothing credential-bearing can reach argv: the argument vector is a static program.
    for (const operation of ['describe-acl', 'unprotect'] as const) {
      const args = dpapiPowerShellArgs(operation);
      const joined = args.join(' ');
      assert.ok(!joined.includes(SYNTHETIC_CLIENT_VALUE));
      assert.ok(!joined.includes('ciphertextB64'), 'no payload on argv');
      assert.ok(args.includes('-EncodedCommand'));
      assert.ok(!args.includes('-Command'), 'never a command string');
    }

    const script = Buffer.from(encodeDpapiScript('unprotect'), 'base64').toString('utf16le');
    assert.ok(script.includes('DataProtectionScope]::CurrentUser'), 'DPAPI user scope');
    assert.ok(!script.includes(SYNTHETIC_CLIENT_VALUE));
    assert.ok(!script.includes('Write-Host'), 'the child never echoes');
  });

  it('W-02-02: the two carriers are separate files, separately addressed, never one blob', async () => {
    const dir = makeTempDir();
    writeBothCarriers(dir);
    const host = new FakeDpapiHost();
    const backend = backendFor(dir, host);

    const client = await backend.readSecret(windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID), AS_OF_UTC);
    const token = await backend.readSecret(windowsRef(DHAN_ACCESS_TOKEN_KEY_PATH, TOKEN_SECRET_ID), AS_OF_UTC);

    assert.strictEqual(client?.secretValue, SYNTHETIC_CLIENT_VALUE);
    assert.strictEqual(token?.secretValue, SYNTHETIC_TOKEN_VALUE);
    assert.strictEqual(token?.expiresAt, TOKEN_EXPIRY_UTC);

    // Distinct, stable carrier mapping.
    assert.notStrictEqual(DPAPI_CARRIER_FILENAMES.clientId, DPAPI_CARRIER_FILENAMES.accessToken);
    assert.strictEqual(resolveDpapiCarrierRole(DHAN_CLIENT_ID_KEY_PATH), 'clientId');
    assert.strictEqual(resolveDpapiCarrierRole(DHAN_ACCESS_TOKEN_KEY_PATH), 'accessToken');
    assert.strictEqual(resolveDpapiCarrierRole('vault://dhan/other-secret'), null);
    assert.strictEqual(resolveDpapiCarrierRole('vault://dhan'), null);
    assert.strictEqual(resolveDpapiCarrierRole(DHAN_CLIENT_ID_KEY_PATH), resolveDpapiCarrierRole('vault://dhan/local-nonprod/client-id'));
    assert.strictEqual(WINDOWS_DPAPI_GOVERNED_KEY_PATHS.clientId, DHAN_CLIENT_ID_KEY_PATH);

    // A path that names no governed secret cannot select a carrier at all.
    await expectReason(
      backend.readSecret(windowsRef('vault://dhan/other-secret', CLIENT_SECRET_ID), AS_OF_UTC),
      'INVALID_SECRET_REF'
    );
    await expectReason(
      backend.readSecret(
        { ...windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID), vaultProvider: 'LOCAL_MOCK_VAULT' },
        AS_OF_UTC
      ),
      'INVALID_SECRET_REF'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-03 — owner-only DACL
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-03: a carrier readable by another principal is unusable (inheritance, extra principal, wrong owner)', async () => {
    const dir = makeTempDir();
    writeBothCarriers(dir);
    const host = new FakeDpapiHost();
    const backend = backendFor(dir, host);
    const ref = windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID);

    // Baseline: owner-only evidence passes.
    assert.strictEqual((await backend.readSecret(ref, AS_OF_UTC))?.secretValue, SYNTHETIC_CLIENT_VALUE);

    for (const brokenAcl of [
      { protected: false, onlyOwnerAndSystem: true, ownerIsCurrentUser: true },
      { protected: true, onlyOwnerAndSystem: false, ownerIsCurrentUser: true },
      { protected: true, onlyOwnerAndSystem: true, ownerIsCurrentUser: false },
    ]) {
      host.aclByPath.set(dpapiCarrierPathFor(dir, 'clientId'), brokenAcl);
      const error = await expectReason(backend.readSecret(ref, AS_OF_UTC), 'CARRIER_PRINCIPAL_MISMATCH');
      assert.strictEqual(error.code, 'CREDENTIALS_UNAVAILABLE');
      assert.ok(!error.message.includes(dir), 'no carrier path in the message');
    }

    // The check covers the directory too: a permissive directory exposes every carrier.
    host.aclByPath.clear();
    host.aclByPath.set(dir, { protected: false, onlyOwnerAndSystem: true, ownerIsCurrentUser: true });
    await expectReason(backend.readSecret(ref, AS_OF_UTC), 'CARRIER_PRINCIPAL_MISMATCH');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-04 — atomicity
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-04: replacement is write-beside, verify, swap — and a failed attempt leaves the previous carrier authoritative', async () => {
    const dir = makeTempDir();
    const first = makeEnvelope({ ciphertext: fakeProtect(SYNTHETIC_CLIENT_VALUE) });

    const aclCalls: Array<{ target: string; kind: string }> = [];
    const applyAcl = async (target: string, kind: 'directory' | 'file'): Promise<void> => {
      aclCalls.push({ target, kind });
    };

    const created = await writeDpapiCarrierAtomically({
      carrierDirectory: dir,
      role: 'clientId',
      envelope: first,
      applyOwnerOnlyAcl: applyAcl,
      now: NOW_DATE,
    });
    assert.strictEqual(created.replaced, false);
    assert.deepStrictEqual(aclCalls.map((c) => c.kind), ['directory', 'file']);
    assert.strictEqual(
      (parseDpapiCarrierEnvelope(fs.readFileSync(created.carrierPath, 'utf8'), { now: NOW_DATE }) as { ok: boolean }).ok,
      true
    );

    const previousBytes = fs.readFileSync(created.carrierPath, 'utf8');

    // A read-back verification failure must not replace anything and must clean up.
    await assert.rejects(
      () =>
        writeDpapiCarrierAtomically({
          carrierDirectory: dir,
          role: 'clientId',
          envelope: makeEnvelope({ ciphertext: fakeProtect('SYNTHETIC-REPLACEMENT-0003') }),
          applyOwnerOnlyAcl: applyAcl,
          verify: async () => false,
          now: NOW_DATE,
        }),
      (err: unknown) => err instanceof DpapiCarrierWriteError && err.stage === 'VERIFY'
    );
    assert.strictEqual(fs.readFileSync(created.carrierPath, 'utf8'), previousBytes);
    assert.deepStrictEqual(fs.readdirSync(dir).filter((f) => f.endsWith('.tmp')), []);

    // A structurally invalid envelope never reaches the filesystem.
    await assert.rejects(
      () =>
        writeDpapiCarrierAtomically({
          carrierDirectory: dir,
          role: 'clientId',
          envelope: makeEnvelope({ schemaVersion: 99 }),
          now: NOW_DATE,
        }),
      (err: unknown) => err instanceof DpapiCarrierWriteError && err.stage === 'WRITE'
    );
    assert.strictEqual(fs.readFileSync(created.carrierPath, 'utf8'), previousBytes);

    // A successful rotation replaces atomically and reports it.
    const rotated = await writeDpapiCarrierAtomically({
      carrierDirectory: dir,
      role: 'clientId',
      envelope: makeEnvelope({
        rotatedAtUtc: '2026-11-12T06:30:00.000Z',
        ciphertext: fakeProtect('SYNTHETIC-ROTATED-0004'),
      }),
      now: NOW_DATE,
    });
    assert.strictEqual(rotated.replaced, true);

    const host = new FakeDpapiHost();
    const record = await backendFor(dir, host).readSecret(
      windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID),
      AS_OF_UTC
    );
    assert.strictEqual(record?.secretValue, 'SYNTHETIC-ROTATED-0004');

    // D-1: carriers live outside a Git working tree.
    const repoLike = makeTempDir();
    fs.mkdirSync(path.join(repoLike, '.git'));
    assert.notStrictEqual(findGitWorkingTreeRoot(repoLike), null);
    await assert.rejects(
      () =>
        writeDpapiCarrierAtomically({
          carrierDirectory: path.join(repoLike, DPAPI_CARRIER_DIRECTORY_NAME),
          role: 'clientId',
          envelope: makeEnvelope(),
          now: NOW_DATE,
        }),
      (err: unknown) => err instanceof DpapiCarrierWriteError && err.stage === 'LOCATION'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-05 — missing, unreadable, malformed and unknown-schema carriers
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-05: missing, unreadable, corrupt and unknown-schema carriers produce distinct reasons', async () => {
    const ref = windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID);

    // Missing carrier.
    const emptyDir = makeTempDir();
    await expectReason(backendFor(emptyDir, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC), 'CARRIER_MISSING');

    // Present but unreadable (a directory in place of the file makes the read fail).
    const unreadableDir = makeTempDir();
    fs.mkdirSync(dpapiCarrierPathFor(unreadableDir, 'clientId'));
    await expectReason(backendFor(unreadableDir, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC), 'CARRIER_UNREADABLE');

    // Not JSON.
    const corruptDir = makeTempDir();
    writeCarrierFile(corruptDir, 'clientId', 'this is not json');
    await expectReason(backendFor(corruptDir, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC), 'CARRIER_CORRUPT');

    // Unknown schema version is refused, never guessed.
    const unknownSchemaDir = makeTempDir();
    writeCarrierFile(unknownSchemaDir, 'clientId', makeEnvelope({ schemaVersion: 2 }));
    await expectReason(
      backendFor(unknownSchemaDir, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC),
      'UNKNOWN_SCHEMA_VERSION'
    );

    // Invalid metadata.
    for (const broken of [
      makeEnvelope({ createdAtUtc: '12-11-2026 06:00' }),
      makeEnvelope({ rotatedAtUtc: '2026-11-12T05:59:59.000Z' }),
      makeEnvelope({ rotatedAtUtc: '2026-11-20T06:00:00.000Z' }),
      makeEnvelope({ expiresAtUtc: 'not-a-timestamp' }),
      makeEnvelope({ ciphertext: 'not base64!!' }),
    ]) {
      const dir = makeTempDir();
      writeCarrierFile(dir, 'clientId', broken);
      await expectReason(backendFor(dir, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC), 'CARRIER_CORRUPT');
    }

    // The client id has no lifecycle: an expiry field on it is not a governed carrier.
    const clientWithExpiry = makeTempDir();
    writeCarrierFile(clientWithExpiry, 'clientId', makeEnvelope({ expiresAtUtc: TOKEN_EXPIRY_UTC }));
    await expectReason(
      backendFor(clientWithExpiry, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC),
      'CARRIER_CORRUPT'
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-06 — metadata validation against the SecretRef
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-06: metadata is validated against the SecretRef, and expiry is a local pre-flight verdict', async () => {
    const ref = windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID);

    const wrongSecretId = makeTempDir();
    writeCarrierFile(wrongSecretId, 'clientId', makeEnvelope({ secretId: 'dhan-vault-someone-else' }));
    await expectReason(
      backendFor(wrongSecretId, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC),
      'SECRET_ID_MISMATCH'
    );

    const wrongProvider = makeTempDir();
    writeCarrierFile(wrongProvider, 'clientId', makeEnvelope({ vaultProvider: 'LOCAL_MOCK_VAULT' }));
    await expectReason(
      backendFor(wrongProvider, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC),
      'CARRIER_CORRUPT'
    );

    const wrongVersion = makeTempDir();
    writeCarrierFile(wrongVersion, 'clientId', makeEnvelope({ version: 'v2' }));
    const versionError = await expectReason(
      backendFor(wrongVersion, new FakeDpapiHost()).readSecret(ref, AS_OF_UTC),
      'VERSION_MISMATCH'
    );
    assert.strictEqual(versionError.code, 'CREDENTIALS_UNAVAILABLE');

    // Expired token: resolved locally, before any vendor call could be attempted.
    const expiredToken = makeTempDir();
    writeCarrierFile(
      expiredToken,
      'accessToken',
      makeEnvelope({
        secretId: TOKEN_SECRET_ID,
        expiresAtUtc: '2026-11-12T06:30:00.000Z',
        ciphertext: fakeProtect(SYNTHETIC_TOKEN_VALUE),
      })
    );
    const expiryError = await expectReason(
      backendFor(expiredToken, new FakeDpapiHost()).readSecret(
        windowsRef(DHAN_ACCESS_TOKEN_KEY_PATH, TOKEN_SECRET_ID),
        AS_OF_UTC
      ),
      'EXPIRED'
    );
    assert.strictEqual(expiryError.code, 'CREDENTIALS_EXPIRED');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-07 — child-process failures and scrubbing
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-07: child-process failures are distinct, fail closed, and never surface child output', async () => {
    const dir = makeTempDir();
    writeBothCarriers(dir);
    const ref = windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID);
    const host = new FakeDpapiHost();
    host.stderrMaterial = `stderr-with-material ${SYNTHETIC_CLIENT_VALUE}`;
    const backend = backendFor(dir, host);

    for (const mode of ['non-zero-exit', 'empty-output', 'spawn-failed', 'timeout', 'output-overflow', 'invalid-json'] as const) {
      host.unprotectMode = mode;
      const error = await expectReason(backend.readSecret(ref, AS_OF_UTC), 'CHILD_PROCESS_FAILURE', SYNTHETIC_CLIENT_VALUE);
      assert.strictEqual(error.code, 'CREDENTIALS_UNAVAILABLE');
      assert.ok(!error.message.includes('stderr-with-material'));
      assert.ok(!error.message.includes(dir));
    }

    // An ACL child-process failure is also a child-process failure, not a permission verdict.
    host.unprotectMode = 'ok';
    host.aclMode = 'non-zero-exit';
    await expectReason(backend.readSecret(ref, AS_OF_UTC), 'CHILD_PROCESS_FAILURE');

    // The child ran and refused the blob: the carrier is unreadable, a different outcome.
    host.aclMode = 'ok';
    host.unprotectMode = 'undecryptable';
    await expectReason(backend.readSecret(ref, AS_OF_UTC), 'CARRIER_UNREADABLE');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-08 — readiness gating
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-08: readiness is gated on platform, location, both carriers, DACL, schema and a probe read', async () => {
    // Not Windows.
    const notWindows = new WindowsDpapiHostVaultBackend({
      carrierDirectory: makeTempDir(),
      processRunner: new FakeDpapiHost().runner,
      platform: () => 'linux',
      now: () => NOW_DATE,
    });
    assert.strictEqual(notWindows.describeReadiness().liveResolutionSupported, false);
    assert.strictEqual((await notWindows.probeReadiness()).liveResolutionSupported, false);

    // Carrier directory inside a Git working tree.
    const repoLike = makeTempDir();
    fs.mkdirSync(path.join(repoLike, '.git'));
    const inGit = new WindowsDpapiHostVaultBackend({
      carrierDirectory: path.join(repoLike, DPAPI_CARRIER_DIRECTORY_NAME),
      processRunner: new FakeDpapiHost().runner,
      platform: () => 'win32',
      now: () => NOW_DATE,
    });
    assert.strictEqual((await inGit.probeReadiness()).liveResolutionSupported, false);

    // Unprovisioned.
    const empty = backendFor(makeTempDir(), new FakeDpapiHost());
    assert.strictEqual(empty.describeReadiness().liveResolutionSupported, false);
    assert.strictEqual((await empty.probeReadiness()).liveResolutionSupported, false);
    assert.strictEqual(empty.describeReadiness().backendId, WINDOWS_DPAPI_BACKEND_ID);

    // Only one carrier present.
    const half = makeTempDir();
    writeCarrierFile(half, 'clientId', makeEnvelope());
    const halfBackend = backendFor(half, new FakeDpapiHost());
    assert.strictEqual((await halfBackend.probeReadiness()).liveResolutionSupported, false);

    // Both present, correct DACL and schema: the synchronous verdict still fails closed
    // until a probe has actually run; the probe then authorises live resolution.
    const readyDir = makeTempDir();
    writeBothCarriers(readyDir);
    const host = new FakeDpapiHost();
    const ready = backendFor(readyDir, host);
    assert.strictEqual(ready.describeReadiness().liveResolutionSupported, false);
    const probed = await ready.probeReadiness();
    assert.strictEqual(probed.liveResolutionSupported, true);
    assert.ok(probed.prerequisiteSummary.length > 0);
    assert.ok(!probed.prerequisiteSummary.includes(readyDir), 'readiness must not locate the carriers');
    assert.strictEqual(ready.describeReadiness().liveResolutionSupported, true);

    // A requested ref probes only its own carrier, but both must still exist.
    host.requests.length = 0;
    const perRef = await ready.probeReadiness(windowsRef(DHAN_CLIENT_ID_KEY_PATH, CLIENT_SECRET_ID));
    assert.strictEqual(perRef.liveResolutionSupported, true);
    assert.strictEqual(host.requests.filter((r) => r.operation === 'unprotect').length, 1);

    // Probe decryption failing keeps live resolution disabled.
    const failingHost = new FakeDpapiHost();
    failingHost.unprotectMode = 'undecryptable';
    const failing = backendFor(readyDir, failingHost);
    assert.strictEqual((await failing.probeReadiness()).liveResolutionSupported, false);

    // A permissive DACL keeps live resolution disabled.
    const aclHost = new FakeDpapiHost();
    aclHost.aclDefault = { protected: false, onlyOwnerAndSystem: true, ownerIsCurrentUser: true };
    const aclBackend = backendFor(readyDir, aclHost);
    assert.strictEqual((await aclBackend.probeReadiness()).liveResolutionSupported, false);

    // An unknown schema keeps live resolution disabled.
    const schemaDir = makeTempDir();
    writeBothCarriers(schemaDir);
    writeCarrierFile(schemaDir, 'accessToken', makeEnvelope({ schemaVersion: 7 }));
    assert.strictEqual(
      (await backendFor(schemaDir, new FakeDpapiHost()).probeReadiness()).liveResolutionSupported,
      false
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-09 — resolver integration & disabled default
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-09: the resolver uses the probe, and the disabled backend remains the fail-closed default', async () => {
    const dir = makeTempDir();
    writeBothCarriers(dir);
    const host = new FakeDpapiHost();

    const config = resolveDhanProviderConfig(
      {
        [DHAN_ENV_KEYS.clientIdSecretPath]: DHAN_CLIENT_ID_KEY_PATH,
        [DHAN_ENV_KEYS.accessTokenSecretPath]: DHAN_ACCESS_TOKEN_KEY_PATH,
        [DHAN_ENV_KEYS.secretVaultProvider]: 'WINDOWS_DPAPI',
        [DHAN_ENV_KEYS.secretVersion]: 'v1',
      },
      NOW_DATE
    );
    assert.strictEqual(config.ok, true);
    if (!config.ok) return;

    // The refs produced by configuration carry the ids the carriers were provisioned with.
    assert.strictEqual(config.config.clientIdRef?.secretId, CLIENT_SECRET_ID);
    assert.strictEqual(config.config.accessTokenRef?.secretId, TOKEN_SECRET_ID);

    const resolver = new LocalHostVaultDhanCredentialResolver({
      backend: backendFor(dir, host),
      now: () => NOW_DATE,
      env: {},
    });
    const material = await resolver.resolve(config.config);
    assert.ok(material);
    assert.strictEqual(material.clientId, SYNTHETIC_CLIENT_VALUE);
    assert.strictEqual(material.accessToken, SYNTHETIC_TOKEN_VALUE);

    // Disabled backend: unchanged, still the default, still returns null.
    const disabled = new DisabledWindowsHostVaultBackend();
    assert.strictEqual(disabled.backendId, UNPROVISIONED_WINDOWS_VAULT_BACKEND_ID);
    assert.strictEqual(disabled.describeReadiness().liveResolutionSupported, false);
    assert.strictEqual('probeReadiness' in disabled, false, 'the disabled backend offers no probe');
    const disabledResolver = new LocalHostVaultDhanCredentialResolver({
      now: () => NOW_DATE,
      env: {},
    });
    assert.strictEqual(await disabledResolver.resolve(config.config), null);

    // Fail-closed: an unready DPAPI backend yields no material, never partial material.
    const unready = makeTempDir();
    const unreadyResolver = new LocalHostVaultDhanCredentialResolver({
      backend: backendFor(unready, new FakeDpapiHost()),
      now: () => NOW_DATE,
      env: {},
    });
    assert.strictEqual(await unreadyResolver.resolve(config.config), null);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // W-02-11/12 — the real child-process plumbing
  // ───────────────────────────────────────────────────────────────────────────

  it('W-02-11: the runner writes the request to stdin, reads stdout only, and surfaces no stderr text', async (t) => {
    if (process.platform === 'win32') {
      t.skip('the fake child is a POSIX-shebanged script; the Windows host proves the real DPAPI path instead');
      return;
    }

    const childScript = path.resolve('tests/fixtures/fake_dpapi_child.mjs');
    const runner = createPowerShellDpapiProcessRunner({ powershellExecutable: childScript });

    // Request JSON travels on stdin and is received intact.
    const ok = await runner({ operation: 'unprotect', payload: { mode: 'ok', probe: 'stdin-only' } });
    assert.strictEqual(ok.kind, 'ok');
    const parsed = JSON.parse(ok.stdout) as { ok: boolean; receivedBytes: number };
    assert.strictEqual(parsed.ok, true);
    assert.ok(parsed.receivedBytes > 0, 'the child received the request on stdin');

    // Child stderr is counted, never carried: the outcome has no stderr text field at all.
    const stderrRun = await runner({ operation: 'unprotect', payload: { mode: 'stderr-with-material' } });
    assert.strictEqual(stderrRun.kind, 'ok');
    assert.ok(stderrRun.stderrByteLength > 0);
    assert.deepStrictEqual(Object.keys(stderrRun).sort(), ['kind', 'stderrByteLength', 'stdout']);
    assert.ok(!JSON.stringify(stderrRun).includes('stderr-with-material'));

    // Non-zero exit and empty output are distinct classified failures.
    const exited = await runner({ operation: 'describe-acl', payload: { mode: 'exit' } });
    assert.strictEqual(exited.kind, 'non-zero-exit');
    assert.strictEqual(exited.stdout, '');
    assert.ok(!JSON.stringify(exited).includes('child-failure-detail'));

    const empty = await runner({ operation: 'unprotect', payload: { mode: 'empty' } });
    assert.strictEqual(empty.kind, 'empty-output');
  });

  it('W-02-12: a hung or flooding child is bounded and classified, never waited on or truncated silently', async (t) => {
    if (process.platform === 'win32') {
      t.skip('the fake child is a POSIX-shebanged script');
      return;
    }

    const childScript = path.resolve('tests/fixtures/fake_dpapi_child.mjs');

    const slow = createPowerShellDpapiProcessRunner({
      powershellExecutable: childScript,
      timeoutMs: 250,
    });
    const timedOut = await slow({ operation: 'unprotect', payload: { mode: 'sleep' } });
    assert.strictEqual(timedOut.kind, 'timeout');

    const small = createPowerShellDpapiProcessRunner({
      powershellExecutable: childScript,
      timeoutMs: 10_000,
      maxStdoutBytes: 64 * 1024,
    });
    const overflow = await small({ operation: 'unprotect', payload: { mode: 'flood' } });
    assert.strictEqual(overflow.kind, 'output-overflow');

    // A missing executable fails closed as a classified outcome, not an exception.
    const missing = createPowerShellDpapiProcessRunner({
      powershellExecutable: path.resolve('tests/fixtures/definitely-not-a-command'),
    });
    const spawnFailed = await missing({ operation: 'unprotect', payload: { mode: 'ok' } });
    assert.strictEqual(spawnFailed.kind, 'spawn-failed');
  });

  it('W-02-10: the canonical carrier location and envelope grammar are fixed and documented', () => {
    assert.strictEqual(DPAPI_CANONICAL_CARRIER_DIRECTORY, 'H:\\IIPS\\runtime\\dhan-secrets');
    assert.strictEqual(DPAPI_CARRIER_DIRECTORY_NAME, 'dhan-secrets');
    assert.strictEqual(DPAPI_CARRIER_SCHEMA_VERSION, 1);
    assert.deepStrictEqual(DPAPI_CARRIER_FILENAMES, {
      clientId: 'dhan-client-id.carrier.json',
      accessToken: 'dhan-access-token.carrier.json',
    });

    // Canonical bytes: fixed key order, two-space indent, one trailing LF.
    const text = serialiseDpapiCarrierEnvelope(makeEnvelope());
    assert.ok(text.endsWith('}\n'));
    assert.ok(!text.endsWith('\n\n'));
    assert.deepStrictEqual(
      Object.keys(JSON.parse(text) as Record<string, unknown>),
      ['schemaVersion', 'secretId', 'vaultProvider', 'version', 'createdAtUtc', 'rotatedAtUtc', 'ciphertext']
    );
    assert.ok(!text.includes('expiresAtUtc'), 'absent optional field is omitted, not written as null');

    // The default child-process runner is constructible without side effects.
    const runner = createPowerShellDpapiProcessRunner({ powershellExecutable: 'powershell.exe' });
    assert.strictEqual(typeof runner, 'function');
  });
});
