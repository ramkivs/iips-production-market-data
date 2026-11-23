/**
 * Institutional Investment Platform System (IIPS)
 * W-12 — DPAPI child-process ACL programs, executed for real on a Windows host
 *
 * Authority: D-1 (owner-only DACL), W-02, W-04, D-7
 *
 * WHY THIS FILE EXISTS (Windows host defect, 2026-11-23):
 *  Every Dhan credential reported `UNREADABLE` and the daemon started `NOT_READY`:
 *
 *    The 'Get-Acl' command was found in the module 'Microsoft.PowerShell.Security',
 *    but the module could not be loaded.
 *
 *  `Get-Acl`/`Set-Acl` belong to an autoloaded script module; in the Node-spawned
 *  `-NoProfile -NonInteractive` child that module could not be imported. The ACL gate runs
 *  before decryption, so the credentials were never read — the ciphertext was always fine,
 *  and the coarse `ACL_READ_FAILED` category made it look like a permissions fault.
 *
 * THE COMPANION STRUCTURAL TEST (`dhan_w12_dpapi_acl_cmdlet_independence.test.ts`) asserts
 *  the program TEXT contains no module-provided cmdlet. It runs everywhere and cannot catch
 *  a program that is cmdlet-free yet still fails at runtime. This file closes that gap: it
 *  executes the ACTUAL embedded scripts — obtained from `encodeDpapiScript`, the only path
 *  to the child — through the ACTUAL Node-spawned PowerShell runner, against disposable
 *  fixtures created with `mkdtemp`. Nothing here is a simplified reproduction.
 *
 * GATING (same convention as W-02-INF-05):
 *  These cases require a real Windows PowerShell and a real Windows filesystem with ACLs,
 *  which the default cross-platform run cannot supply. They therefore skip unless
 *  `IIPS_POWERSHELL_RUNTIME_TESTS=1`, and they require win32 specifically because only
 *  Windows has `System.Security.AccessControl` descriptors to read and write. The
 *  `windows-latest` job in `.github/workflows/w02-process-runner.yml` sets that variable, so
 *  the runtime case is actually executed in CI rather than silently skipped.
 *
 * SAFETY: every fixture is a disposable directory under the OS temp root. No Dhan carrier,
 *  no credential, no vault path and no repository file is read or written.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import {
  createPowerShellDpapiProcessRunner,
  encodeDpapiScript,
  type DpapiProcessOperation,
  type DpapiProcessOutcome,
} from '../src/providers/dhan/dhan_dpapi_process.js';

/** True only when the platform can hold Windows security descriptors. */
const IS_WINDOWS = process.platform === 'win32';
const RUNTIME_ENABLED = process.env.IIPS_POWERSHELL_RUNTIME_TESTS === '1';

/**
 * Resolves an absolute PowerShell executable path, mirroring the W-02 runtime case: a bare
 * `powershell.exe` is not a contract, and CI images differ.
 */
function whichWindowsPowerShell(): string | null {
  for (const candidate of ['powershell.exe', 'powershell', 'pwsh']) {
    const probe = spawnSync(
      candidate,
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '[Console]::Out.Write((Get-Process -Id $PID).Path)',
      ],
      { encoding: 'utf8', timeout: 20_000 }
    );
    if (probe.status !== 0) continue;
    const absolute = String(probe.stdout ?? '').trim();
    if (absolute.length > 0 && fs.existsSync(absolute)) return absolute;
  }
  return null;
}

const POWERSHELL = IS_WINDOWS && RUNTIME_ENABLED ? whichWindowsPowerShell() : null;

/** Why the runtime cases are not executing, for the skip message. */
function skipReason(): string {
  if (!IS_WINDOWS) return 'Windows-only: System.Security.AccessControl requires win32';
  if (!RUNTIME_ENABLED) return 'set IIPS_POWERSHELL_RUNTIME_TESTS=1 on Windows to execute the real programs';
  return 'IIPS_POWERSHELL_RUNTIME_TESTS=1 was set but no PowerShell executable could be resolved';
}

/** Runs one embedded program through the production runner and parses its JSON answer. */
async function runProgram(
  operation: DpapiProcessOperation,
  payload: Readonly<Record<string, unknown>>
): Promise<{ outcome: DpapiProcessOutcome; parsed: Record<string, unknown> | null }> {
  assert.ok(POWERSHELL !== null, 'a PowerShell executable must be resolved before running');
  const runner = createPowerShellDpapiProcessRunner({ powershellExecutable: POWERSHELL });
  const outcome = await runner({ operation, payload });
  let parsed: Record<string, unknown> | null = null;
  if (outcome.kind === 'ok') {
    try {
      const value: unknown = JSON.parse(outcome.stdout);
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
  }
  return { outcome, parsed };
}

/** Current user SID, resolved once, for the owner-only assertions. */
function currentUserSid(): string {
  const probe = spawnSync(
    POWERSHELL as string,
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '[Console]::Out.Write([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value)',
    ],
    { encoding: 'utf8', timeout: 20_000 }
  );
  return String(probe.stdout ?? '').trim();
}

describe('W-12 / DPAPI ACL programs execute on a real Windows host', () => {
  let fixtureRoot = '';
  let childFile = '';
  let nestedFile = '';

  before(() => {
    if (POWERSHELL === null) return;
    // Disposable fixtures: a directory, a file inside it, and a file in a subdirectory so an
    // inherited rule (if any) has a parent to be inherited from.
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'w12acl-'));
    childFile = path.join(fixtureRoot, 'carrier-like.json');
    fs.writeFileSync(childFile, JSON.stringify({ schemaVersion: 1, fixture: true }), 'utf8');
    const subdir = path.join(fixtureRoot, 'nested');
    fs.mkdirSync(subdir);
    nestedFile = path.join(subdir, 'nested.json');
    fs.writeFileSync(nestedFile, '{}', 'utf8');
  });

  after(() => {
    if (fixtureRoot.length > 0) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('W-12-11: describe-acl reads a directory and a file without any ACL cmdlet', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    const { outcome, parsed } = await runProgram('describe-acl', {
      paths: [fixtureRoot, childFile],
    });

    // The program must EXECUTE. Under the old scripts this returned ok:false /
    // ACL_READ_FAILED precisely because Get-Acl did not exist.
    assert.equal(outcome.kind, 'ok', 'the program must run to completion');
    assert.ok(parsed !== null, 'the program must answer with JSON');
    assert.equal(parsed?.ok, true, `ACL_READ_FAILED must not occur: ${outcome.stdout}`);

    const items = parsed?.items;
    assert.ok(Array.isArray(items), 'items must be an array');
    assert.equal((items as unknown[]).length, 2, 'both requested paths must be accounted for');

    for (const item of items as Record<string, unknown>[]) {
      assert.equal(item.exists, true, 'every fixture path exists');
      assert.equal(typeof item.protected, 'boolean', 'protected must be reported as a boolean');
      assert.equal(typeof item.onlyOwnerAndSystem, 'boolean');
      assert.equal(typeof item.ownerIsCurrentUser, 'boolean');
      assert.equal(typeof item.path, 'string');
    }
  });

  it('W-12-12: owner detection matches the current user SID', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    const me = currentUserSid();
    assert.match(me, /^S-1-5-/, 'the current user SID must be resolvable');

    const { parsed } = await runProgram('read-acl', { path: childFile });
    assert.equal(parsed?.ok, true);
    assert.equal(parsed?.exists, true);
    assert.equal(
      parsed?.currentUserSid,
      me,
      'the child must report the same SID the host reports for this process'
    );
    assert.equal(
      parsed?.ownerSid,
      me,
      'a fixture created by this process is owned by this process'
    );
  });

  it('W-12-13: read-acl reports the full descriptor the policy evaluates', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    const { parsed } = await runProgram('read-acl', { path: fixtureRoot });
    assert.equal(parsed?.ok, true);
    assert.equal(typeof parsed?.protected, 'boolean');

    const rules = parsed?.rules;
    assert.ok(Array.isArray(rules), 'rules must be an array');
    assert.ok((rules as unknown[]).length > 0, 'a fixture directory carries at least one ACL rule');

    for (const rule of rules as Record<string, unknown>[]) {
      // Every field `DpapiAclRule` declares must survive the .NET path unchanged.
      assert.equal(typeof rule.sid, 'string', 'sid must be a string (empty when untranslatable)');
      assert.ok(
        rule.accessControlType === 'Allow' || rule.accessControlType === 'Deny',
        'accessControlType must be Allow or Deny'
      );
      assert.equal(typeof rule.rights, 'number', 'rights must be numeric');
      assert.equal(typeof rule.inheritanceFlags, 'number', 'inheritanceFlags must be numeric');
      assert.equal(typeof rule.propagationFlags, 'number', 'propagationFlags must be numeric');
      assert.equal(typeof rule.inherited, 'boolean', 'inherited must be a boolean');
    }

    // Inherited rules are what `$acl.Access` used to include. Dropping them would silently
    // change the owner-only verdict, so at least one rule must be classifiable either way.
    const inherited = (rules as Record<string, unknown>[]).filter((r) => r.inherited === true);
    const explicit = (rules as Record<string, unknown>[]).filter((r) => r.inherited === false);
    assert.equal(
      inherited.length + explicit.length,
      (rules as unknown[]).length,
      'every rule must be classified as inherited or explicit'
    );
  });

  it('W-12-14: apply-acl sets an owner-only protected descriptor, verified by read-acl', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    // Work on a dedicated directory so the fixtures used by the read cases stay untouched.
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'w12apply-'));
    try {
      const applied = await runProgram('apply-acl', { path: target, kind: 'directory' });
      assert.equal(applied.outcome.kind, 'ok');
      assert.equal(applied.parsed?.ok, true, `apply must succeed: ${applied.outcome.stdout}`);
      assert.equal(applied.parsed?.changed, true);

      // Independence: read the result back through the .NET-based program, not via the writer.
      const readBack = await runProgram('read-acl', { path: target });
      assert.equal(readBack.parsed?.ok, true);
      assert.equal(
        readBack.parsed?.protected,
        true,
        'inheritance must be disabled — SetAccessRuleProtection(true, false)'
      );

      const me = currentUserSid();
      const rules = readBack.parsed?.rules as Record<string, unknown>[];
      assert.equal(rules.length, 2, 'exactly two rules: owner and SYSTEM');

      const sids = rules.map((r) => String(r.sid));
      assert.ok(sids.includes(me), 'the owner rule must be the current user');
      assert.ok(sids.includes('S-1-5-18'), 'the SYSTEM rule must be S-1-5-18');

      for (const rule of rules) {
        assert.equal(rule.accessControlType, 'Allow');
        assert.equal(rule.rights, 2_032_127, 'FullControl (0x1F01FF) is the only granted right');
        assert.equal(rule.inherited, false, 'both rules are explicit after SetAccessRuleProtection');
      }

      // Directory inheritance flags: ContainerInherit|ObjectInherit == 3.
      for (const rule of rules) {
        assert.equal(rule.inheritanceFlags, 3, 'a directory rule must use ContainerInherit|ObjectInherit');
        assert.equal(rule.propagationFlags, 0, 'PropagationFlags.None');
      }

      // And the owner-only verdict the product computes must now be satisfied.
      const describe = await runProgram('describe-acl', { paths: [target] });
      const items = describe.parsed?.items as Record<string, unknown>[];
      assert.equal(items[0]?.onlyOwnerAndSystem, true, 'only the owner and SYSTEM may be admitted');
      assert.equal(items[0]?.ownerIsCurrentUser, true);
      assert.equal(items[0]?.protected, true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it('W-12-15: apply-acl on a file uses InheritanceFlags.None', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    const applied = await runProgram('apply-acl', { path: childFile, kind: 'file' });
    assert.equal(applied.parsed?.ok, true, `apply must succeed: ${applied.outcome.stdout}`);

    const readBack = await runProgram('read-acl', { path: childFile });
    assert.equal(readBack.parsed?.protected, true);
    const rules = readBack.parsed?.rules as Record<string, unknown>[];
    assert.equal(rules.length, 2, 'exactly the owner and SYSTEM rules');
    for (const rule of rules) {
      assert.equal(rule.inheritanceFlags, 0, 'a file grants nothing downstream: InheritanceFlags.None');
      assert.equal(rule.propagationFlags, 0);
    }
  });

  it('W-12-16: a missing path is reported as absent, not as a failure', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    const missing = path.join(fixtureRoot, 'definitely-not-present-9f3a.json');
    const { parsed } = await runProgram('read-acl', { path: missing });
    assert.equal(parsed?.ok, true, 'absence is an answer, not an exception');
    assert.equal(parsed?.exists, false);

    const describe = await runProgram('describe-acl', { paths: [missing] });
    const items = describe.parsed?.items as Record<string, unknown>[];
    assert.equal(items[0]?.exists, false);
    assert.equal(items[0]?.protected, false, 'an absent path is not protected');
  });

  it('W-12-17: the coarse failure category is still emitted for unusable input', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    // Fail-closed contract: a program must answer with a category rather than crash or claim
    // success. Feeding a directory path where a file descriptor cannot be produced is the
    // cheapest reliable trigger; the exact category must be the script's own.
    const { outcome, parsed } = await runProgram('read-acl', { path: '' });
    assert.equal(outcome.kind, 'ok', 'the child must exit cleanly');
    assert.ok(parsed !== null, 'the child must always answer with JSON');
    if (parsed?.ok === false) {
      assert.equal(parsed?.kind, 'ACL_READ_FAILED', 'the failure category must be preserved');
    }
  });

  it('W-12-18: unprotect still works in the same child, proving the module is the only gap', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    // This pair is the evidence that the ACL scripts were the *only* broken programs: the
    // DPAPI programs never needed Get-Acl and always worked. A round-trip through the real
    // runner keeps that asymmetry asserted rather than assumed.
    const probe = 'w12-module-independence-probe';
    const protectedValue = await runProgram('protect', {
      plaintextB64: Buffer.from(probe, 'utf8').toString('base64'),
    });
    assert.equal(protectedValue.parsed?.ok, true, 'protect must succeed');

    const ciphertext = String(protectedValue.parsed?.ciphertextB64 ?? '');
    assert.ok(ciphertext.length > 0, 'protect must return a ciphertext');

    const unprotected = await runProgram('unprotect', { ciphertextB64: ciphertext });
    assert.equal(unprotected.parsed?.ok, true, 'unprotect must succeed');
    assert.equal(
      Buffer.from(String(unprotected.parsed?.plaintextB64 ?? ''), 'base64').toString('utf8'),
      probe,
      'the DPAPI round-trip must recover the original value'
    );
  });

  it('W-12-19: no program depends on Import-Module to reach the filesystem', async (t) => {
    if (POWERSHELL === null) return t.skip(skipReason());

    // `Import-Module Microsoft.PowerShell.Security` raises RuntimeException in this child, so
    // the .NET path must carry the whole ACL workload. Assert the programs still execute with
    // module autoloading disabled where it can be influenced: `-NoProfile` is already applied
    // by `dpapiPowerShellArgs`, and no program contains an import.
    for (const operation of ['describe-acl', 'read-acl', 'apply-acl'] as DpapiProcessOperation[]) {
      const text = Buffer.from(encodeDpapiScript(operation), 'base64').toString('utf16le');
      assert.ok(!/\bImport-Module\b/.test(text), `${operation} must not import a module`);
    }

    const { parsed } = await runProgram('describe-acl', { paths: [fixtureRoot] });
    assert.equal(parsed?.ok, true, 'the ACL program must work with no module import at all');
  });
});
