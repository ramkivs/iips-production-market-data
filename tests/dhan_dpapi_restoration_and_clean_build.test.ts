/**
 * DPAPI restoration regression: a source-compatible tsc build is not enough when dist/ is dirty.
 *
 * This suite reproduces the two failure boundaries without real credentials or vendor calls:
 * (1) stale JS left by a previous checkout must be removed/refused before it can link against a
 *     newly emitted secret_ref.js; and
 * (2) the compiled CLI, SecretRef constants and D-1 carrier backend must still work together.
 *
 * The carrier test uses a deliberately reversible, synthetic child process on POSIX; it is NOT
 * cryptography and cannot establish a Windows DPAPI or live Dhan qualification. Windows host
 * functionality is exercised separately by the W-02 acceptance harness and W-04 seam tests.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  DHAN_ENV_KEYS,
  resolveDhanProviderConfig,
} from '../src/providers/dhan/dhan_config.js';
import {
  DHAN_CREDENTIAL_EXIT,
  runDhanCredentialStoreCli,
} from '../src/providers/dhan/dhan_credential_store_cli.js';
import {
  provisionDhanCredential,
  verifyDhanCredentialStore,
} from '../src/providers/dhan/dhan_credential_store_utility.js';
import {
  DPAPI_CARRIER_SCHEMA_VERSION,
  dpapiCarrierPathFor,
  parseDpapiCarrierEnvelope,
} from '../src/providers/dhan/dhan_dpapi_carrier.js';
import { type DpapiAclApplier } from '../src/providers/dhan/dhan_dpapi_acl.js';
import {
  type DpapiProcessRunner,
  createPowerShellDpapiProcessRunner,
  dpapiPowerShellArgs,
} from '../src/providers/dhan/dhan_dpapi_process.js';
import { WindowsDpapiHostVaultBackend } from '../src/providers/dhan/dhan_dpapi_vault_backend.js';
import {
  DHAN_ACCESS_TOKEN_KEY_PATH,
  DHAN_CLIENT_ID_KEY_PATH,
  WINDOWS_DPAPI_VAULT_PROVIDER,
} from '../src/security/secret_ref.js';

const ROOT = process.cwd();
const NOW = new Date('2026-11-16T09:30:00.000Z');
const LATER = new Date('2026-11-16T10:30:00.000Z');
const EXPIRY = '2026-11-17T09:30:00.000Z';
const CLIENT_VALUE = 'SYNTHETIC-DPAPI-RESTORATION-CLIENT-01';
const TOKEN_VALUE = 'SYNTHETIC-DPAPI-RESTORATION-TOKEN-01';
const ROTATED_VALUE = 'SYNTHETIC-DPAPI-RESTORATION-TOKEN-02';

function put(root: string, relativePath: string, content = 'stale output'): string {
  const full = join(root, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

function runNode(script: string, args: readonly string[], cwd = ROOT) {
  const outcome = spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(outcome.error, undefined, `Node child failed to launch: ${script}`);
  return outcome;
}

describe('Dhan DPAPI restoration and clean-build safety', () => {
  it('clean build hooks purge obsolete Dhan emit while preserving unrelated outputs in scoped modes', (t) => {
    const root = mkdtempSync(join(tmpdir(), 'ipd-dpapi-clean-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    assert.equal(scripts.scripts['build:tsc'], 'tsc');
    assert.equal(scripts.scripts['dhan:credential'], 'node dist/src/providers/dhan/dhan_credential_store_cli.js');
    for (const hook of ['prebuild', 'prebuild:tsc', 'pretest:package-consumer', 'prepack', 'prepare']) {
      assert.ok(scripts.scripts[hook]?.includes('scripts/clean-dist.mjs'), `${hook} must clean dist`);
    }
    const cleaner = resolve(ROOT, 'scripts/clean-dist.mjs');
    const fullOrphan = put(root, 'dist/src/providers/dhan/dhan_credential_store_cli.js');
    put(root, 'dist/src/providers/dhan/dhan_dpapi_carrier.js');
    put(root, 'dist/src/security/secret_ref.js');
    put(root, 'dist/tests/removed.test.js');
    put(root, 'dist/package/src/providers/dhan/package.js');
    put(root, 'dist-frontend/assets/old-bundle.js');
    const full = runNode(cleaner, ['--root', root]);
    assert.equal(full.status, 0, full.stderr);
    assert.equal(existsSync(fullOrphan), false);
    assert.equal(existsSync(join(root, 'dist')), false);
    assert.equal(existsSync(join(root, 'dist-frontend')), false);

    const staleCli = put(root, 'dist/src/providers/dhan/dhan_credential_store_cli.js');
    put(root, 'dist/src/security/secret_ref.js');
    put(root, 'dist/tests/removed.test.js');
    put(root, 'dist/frontend/src/old.js');
    put(root, 'dist/tsconfig.tsbuildinfo');
    const packaged = put(root, 'dist/package/src/providers/dhan/package.js');
    const frontendBundle = put(root, 'dist-frontend/assets/current-bundle.js');
    const tsc = runNode(cleaner, ['--tsc-only', '--root', root]);
    assert.equal(tsc.status, 0, tsc.stderr);
    assert.equal(existsSync(staleCli), false);
    assert.equal(existsSync(join(root, 'dist/tests')), false);
    assert.equal(existsSync(join(root, 'dist/frontend')), false);
    assert.equal(existsSync(join(root, 'dist/tsconfig.tsbuildinfo')), false);
    assert.equal(existsSync(packaged), true, 'a tsc-only rebuild must not erase packed subpaths');
    assert.equal(existsSync(frontendBundle), true, 'a tsc-only rebuild must not erase Vite output');

    const liveSource = put(root, 'dist/src/security/secret_ref.js');
    put(root, 'dist/package/src/providers/dhan/removed.js');
    const pkg = runNode(cleaner, ['--package-only', '--root', root]);
    assert.equal(pkg.status, 0, pkg.stderr);
    assert.equal(existsSync(join(root, 'dist/package')), false);
    assert.equal(existsSync(liveSource), true, 'package-only must leave runtime JS alone');
    assert.equal(existsSync(frontendBundle), true);
  });

  it('the guarded test runner refuses both orphaned test JS and obsolete source JS', (t) => {
    const root = mkdtempSync(join(tmpdir(), 'ipd-dpapi-orphans-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'scripts'), { recursive: true });
    for (const script of ['run-tests.mjs', 'test-summary-parser.mjs']) {
      copyFileSync(join(ROOT, 'scripts', script), join(root, 'scripts', script));
    }
    put(root, 'tests/current.test.ts', 'export {};\n');
    put(root, 'dist/tests/current.test.js', "throw new Error('this test must not run');\n");
    const orphanTest = put(root, 'dist/tests/removed.test.js', 'export {};\n');
    put(root, 'src/security/secret_ref.ts', 'export {};\n');
    put(root, 'dist/src/security/secret_ref.js', 'export {};\n');
    const orphanCli = put(root, 'dist/src/providers/dhan/dhan_credential_store_cli.js');
    const guard = join(root, 'scripts/run-tests.mjs');

    const testRefusal = runNode(guard, [], root);
    assert.equal(testRefusal.status, 1);
    assert.match(testRefusal.stderr, /compiled test\(s\) have no TypeScript source counterpart/);
    assert.match(testRefusal.stderr, /removed\.test\.ts/);
    rmSync(orphanTest);

    const moduleRefusal = runNode(guard, [], root);
    assert.equal(moduleRefusal.status, 1);
    assert.match(moduleRefusal.stderr, /compiled module\(s\) in dist\/src have no TypeScript source/);
    assert.match(moduleRefusal.stderr, /dhan_credential_store_cli\.js/);
    assert.equal(existsSync(orphanCli), true, 'the guard detects, not silently repairs, stale output');
  });

  it('the built ESM SecretRef and credential CLI import and execute with the restored exports', async () => {
    // Unlike a tsc typecheck, importing the emitted JS exercises the Node ESM linker. In the
    // broken mixed checkout this exact import failed with missing DHAN_ACCESS_TOKEN_KEY_PATH.
    const refs = await import('../src/security/secret_ref.js');
    const cli = await import('../src/providers/dhan/dhan_credential_store_cli.js');
    assert.equal(refs.WINDOWS_DPAPI_VAULT_PROVIDER, 'WINDOWS_DPAPI');
    assert.equal(refs.DHAN_ACCESS_TOKEN_KEY_PATH, 'vault://dhan/access-token');
    assert.equal(refs.DHAN_CLIENT_ID_KEY_PATH, 'vault://dhan/client-id');
    assert.equal(typeof cli.runDhanCredentialStoreCli, 'function');
    const help = runNode(resolve(ROOT, 'dist/src/providers/dhan/dhan_credential_store_cli.js'), ['--help']);
    assert.equal(help.status, 0, `${help.stderr}\n${help.stdout}`);
    assert.match(help.stdout, /provision <client-id\|access-token>/);
    assert.match(help.stdout, /rotate\s+<client-id\|access-token>/);
    assert.match(help.stdout, /verify\s+\[<client-id\|access-token\|all>\]/);
  });

  it('a fake DPAPI child preserves D-1 envelopes through provision, verify, atomic rotation and failed round trips', async (t) => {
    if (process.platform === 'win32') {
      t.skip('the POSIX-shebang child is synthetic; W-04 seams and W-02 host acceptance cover Windows');
      return;
    }
    const root = mkdtempSync(join(tmpdir(), 'ipd-dpapi-carrier-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const carrierDirectory = join(root, 'store');
    const childScript = resolve(ROOT, 'tests/fixtures/fake_dpapi_child.mjs');
    const child = createPowerShellDpapiProcessRunner({
      powershellExecutable: childScript,
      timeoutMs: 5_000,
    });
    let forceMismatch = false;
    const runner: DpapiProcessRunner = (request) => child({
      operation: request.operation,
      payload: {
        ...request.payload,
        mode: request.operation === 'protect'
          ? 'synthetic-protect'
          : request.operation === 'unprotect'
            ? (forceMismatch ? 'synthetic-mismatch' : 'synthetic-unprotect')
            : 'synthetic-acl',
      },
    });
    const aclSteps: string[] = [];
    const applyOwnerOnlyAcl: DpapiAclApplier = async (target, kind) => {
      aclSteps.push(kind);
      if (kind === 'file') {
        assert.equal(readFileSync(target, 'utf8'), '', 'DACL is applied before the beside-file gets content');
      }
      return { changed: kind === 'directory' && aclSteps.length === 1, verified: true };
    };
    const config = resolveDhanProviderConfig({
      [DHAN_ENV_KEYS.clientIdSecretPath]: DHAN_CLIENT_ID_KEY_PATH,
      [DHAN_ENV_KEYS.accessTokenSecretPath]: DHAN_ACCESS_TOKEN_KEY_PATH,
      [DHAN_ENV_KEYS.secretVaultProvider]: WINDOWS_DPAPI_VAULT_PROVIDER,
      [DHAN_ENV_KEYS.accessTokenExpiresAt]: EXPIRY,
    }, NOW);
    assert.equal(config.ok, true);
    if (!config.ok) return;

    const ioLines: string[] = [];
    const provisionViaCli = async (argv: string[], value: string) => runDhanCredentialStoreCli({
      argv: [...argv, '--carrier-directory', carrierDirectory, '--json'],
      io: { writeStdout: (line) => ioLines.push(line), writeStderr: (line) => ioLines.push(line) },
      readSecret: async () => value,
      isInteractive: false,
      runner,
      applyOwnerOnlyAcl,
      platform: () => 'win32',
      now: () => NOW,
    });
    assert.equal((await provisionViaCli(['provision', 'client-id'], CLIENT_VALUE)).exitCode, DHAN_CREDENTIAL_EXIT.OK);
    assert.equal((await provisionViaCli(['provision', 'access-token', '--expires-at', EXPIRY], TOKEN_VALUE)).exitCode, DHAN_CREDENTIAL_EXIT.OK);
    assert.ok(aclSteps.includes('file'));
    assert.ok(!JSON.stringify(dpapiPowerShellArgs('protect')).includes(TOKEN_VALUE), 'child argv is static');
    const expectedFiles = ['dhan-access-token.carrier.json', 'dhan-client-id.carrier.json'];
    assert.deepEqual(readdirSync(carrierDirectory).sort(), expectedFiles);

    const clientPath = dpapiCarrierPathFor(carrierDirectory, 'clientId');
    const tokenPath = dpapiCarrierPathFor(carrierDirectory, 'accessToken');
    const clientText = readFileSync(clientPath, 'utf8');
    const oldTokenText = readFileSync(tokenPath, 'utf8');
    assert.ok(!clientText.includes(CLIENT_VALUE));
    assert.ok(!oldTokenText.includes(TOKEN_VALUE));
    assert.ok(!oldTokenText.includes(Buffer.from(TOKEN_VALUE).toString('base64')));
    const clientEnvelope = parseDpapiCarrierEnvelope(clientText, { now: NOW });
    const tokenEnvelope = parseDpapiCarrierEnvelope(oldTokenText, { now: NOW });
    assert.equal(clientEnvelope.ok, true);
    assert.equal(tokenEnvelope.ok, true);
    if (!clientEnvelope.ok || !tokenEnvelope.ok) return;
    assert.deepEqual(Object.keys(clientEnvelope.envelope), [
      'schemaVersion', 'secretId', 'vaultProvider', 'version', 'createdAtUtc', 'rotatedAtUtc', 'ciphertext',
    ]);
    assert.deepEqual(Object.keys(tokenEnvelope.envelope), [
      'schemaVersion', 'secretId', 'vaultProvider', 'version', 'createdAtUtc', 'rotatedAtUtc', 'expiresAtUtc', 'ciphertext',
    ]);
    assert.equal(tokenEnvelope.envelope.schemaVersion, DPAPI_CARRIER_SCHEMA_VERSION);
    assert.equal(tokenEnvelope.envelope.secretId, config.config.accessTokenRef?.secretId);
    assert.equal(tokenEnvelope.envelope.vaultProvider, WINDOWS_DPAPI_VAULT_PROVIDER);
    assert.equal(tokenEnvelope.envelope.expiresAtUtc, EXPIRY);

    let backendNow = NOW;
    const backend = new WindowsDpapiHostVaultBackend({
      carrierDirectory,
      processRunner: runner,
      platform: () => 'win32',
      now: () => backendNow,
    });
    assert.equal((await backend.probeReadiness()).liveResolutionSupported, true);
    const client = await backend.readSecret(config.config.clientIdRef!, NOW.toISOString());
    const token = await backend.readSecret(config.config.accessTokenRef!, NOW.toISOString());
    assert.equal(client?.secretValue, CLIENT_VALUE);
    assert.equal(token?.secretValue, TOKEN_VALUE);
    const verified = await verifyDhanCredentialStore({
      carrierDirectory, runner, platform: () => 'win32', now: NOW,
    });
    assert.deepEqual(verified.entries.map((entry) => entry.status), ['PRESENT_OK', 'PRESENT_OK']);
    const verifyText = JSON.stringify(verified);
    for (const secret of [CLIENT_VALUE, TOKEN_VALUE, carrierDirectory, DHAN_ACCESS_TOKEN_KEY_PATH]) {
      assert.ok(!verifyText.includes(secret), 'verification output contains no value or location');
    }

    const rotated = await provisionDhanCredential({
      role: 'accessToken', secretValue: ROTATED_VALUE, mode: 'rotate',
      carrierDirectory, expiresAtUtc: EXPIRY, now: LATER,
      runner, applyOwnerOnlyAcl, platform: () => 'win32',
    });
    assert.equal(rotated.replaced, true);
    assert.equal(rotated.roundTripVerified, true);
    assert.equal(rotated.createdAtUtc, tokenEnvelope.envelope.createdAtUtc);
    assert.equal(rotated.rotatedAtUtc, LATER.toISOString());
    assert.equal(readFileSync(clientPath, 'utf8'), clientText, 'token rotation leaves the client carrier alone');
    const goodRotationText = readFileSync(tokenPath, 'utf8');
    assert.notEqual(goodRotationText, oldTokenText);
    backendNow = LATER; // the carrier parser rejects rotation timestamps >5 minutes in the future
    assert.equal((await backend.readSecret(config.config.accessTokenRef!, LATER.toISOString()))?.secretValue, ROTATED_VALUE);

    forceMismatch = true;
    await assert.rejects(
      provisionDhanCredential({
        role: 'accessToken', secretValue: 'SYNTHETIC-UNVERIFIED-ROTATION', mode: 'rotate',
        carrierDirectory, expiresAtUtc: EXPIRY, now: LATER,
        runner, applyOwnerOnlyAcl, platform: () => 'win32',
      }),
      (error: unknown) =>
        error instanceof Error && 'code' in error && error.code === 'ROUND_TRIP_FAILED',
    );
    forceMismatch = false;
    assert.equal(readFileSync(tokenPath, 'utf8'), goodRotationText, 'failure preserves the last verified carrier');
    assert.deepEqual(readdirSync(carrierDirectory).sort(), expectedFiles, 'failure removes the beside-file');
    for (const secret of [CLIENT_VALUE, TOKEN_VALUE, ROTATED_VALUE, carrierDirectory]) {
      assert.ok(!ioLines.join('\n').includes(secret), 'CLI output is non-disclosing');
    }
  });
});
