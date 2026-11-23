/**
 * Institutional Investment Platform System (IIPS)
 * W-12 — DPAPI child-process ACL scripts must not depend on module-provided cmdlets
 *
 * Authority: D-1 (owner-only DACL), D-7 (diagnostics must not misattribute), W-02, W-04
 *
 * WHAT FAILED ON THE OPERATOR'S WINDOWS HOST (2026-11-23):
 *  Every Dhan credential reported `UNREADABLE`, and the daemon started with
 *  `vaultBackendReadiness=NOT_READY` / `liveCredentialResolution=false`. The cause was not
 *  DPAPI, not the master key, not the user profile and not the credentials:
 *
 *    The 'Get-Acl' command was found in the module 'Microsoft.PowerShell.Security',
 *    but the module could not be loaded.
 *
 *  `Get-Acl` and `Set-Acl` belong to the `Microsoft.PowerShell.Security` *script module*,
 *  which PowerShell autoloads on demand. In the Node-spawned
 *  `-NoProfile -NonInteractive` child that module could not be imported, so the cmdlet did
 *  not exist. `$ErrorActionPreference = 'Stop'` turned the resulting
 *  `CommandNotFoundException` into a terminating error, and the script's own `catch`
 *  swallowed it into a coarse `ACL_READ_FAILED` that is indistinguishable from a real
 *  permissions fault. The ACL gate runs BEFORE decryption, so the credentials were never
 *  even read — the ciphertext was always fine.
 *
 *  The write path used the same cmdlets (`read-acl` / `apply-acl`), so the defect was not
 *  confined to verification: provisioning carried the identical latent fault.
 *
 * THE INVARIANT (what these tests lock down):
 *  A DPAPI child program must reach the OS only through APIs that are present in a bare
 *  PowerShell 5.1 host — the .NET access-control types — and never through a cmdlet that
 *  requires an autoloaded module. A future edit that reintroduces `Get-Acl`/`Set-Acl` in
 *  any of the five scripts fails here rather than on the operator's host.
 *
 * WHY A SOURCE-LEVEL ASSERTION IS THE RIGHT SHAPE:
 *  The runner deliberately carries no stderr TEXT (only a byte length), and the scripts
 *  report a coarse category by design, so a behavioural test cannot distinguish "module
 *  missing" from "permissions wrong" on a non-Windows host. Asserting on the program text
 *  is deterministic, runs everywhere, and names the exact regression.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SCRIPT_BY_OPERATION,
  dpapiPowerShellArgs,
  encodeDpapiScript,
  type DpapiProcessOperation,
} from '../src/providers/dhan/dhan_dpapi_process.js';

const OPERATIONS = Object.keys(SCRIPT_BY_OPERATION) as DpapiProcessOperation[];

/** Scripts that inspect or mutate an access-control descriptor. */
const ACL_OPERATIONS: readonly DpapiProcessOperation[] = ['describe-acl', 'read-acl', 'apply-acl'];

/** Cmdlets supplied by the `Microsoft.PowerShell.Security` autoloaded module. */
const MODULE_PROVIDED_CMDLETS = ['Get-Acl', 'Set-Acl'] as const;

describe('W-12 / DPAPI child scripts are independent of autoloaded PowerShell modules', () => {
  it('W-12-01: no child program invokes a module-provided ACL cmdlet', () => {
    for (const operation of OPERATIONS) {
      const script = SCRIPT_BY_OPERATION[operation];
      for (const cmdlet of MODULE_PROVIDED_CMDLETS) {
        assert.ok(
          !new RegExp(`(^|[^\\w-])${cmdlet}([^\\w-]|$)`, 'm').test(script),
          `${operation} must not invoke '${cmdlet}': it lives in Microsoft.PowerShell.Security, ` +
            'which cannot be imported in the Node-spawned -NoProfile -NonInteractive child. ' +
            'Use [System.IO.Directory]::GetAccessControl / [System.IO.File]::GetAccessControl instead.'
        );
      }
    }
  });

  it('W-12-02: every ACL program reaches the descriptor through the .NET API', () => {
    for (const operation of ACL_OPERATIONS) {
      const script = SCRIPT_BY_OPERATION[operation];
      assert.ok(
        script.includes('[System.IO.Directory]::GetAccessControl'),
        `${operation} must read a directory descriptor via [System.IO.Directory]::GetAccessControl`
      );
      assert.ok(
        script.includes('[System.IO.File]::GetAccessControl'),
        `${operation} must read a file descriptor via [System.IO.File]::GetAccessControl`
      );
    }
  });

  it('W-12-03: descriptor reads distinguish directories from files', () => {
    // A directory and a carrier file take different static entry points; a single
    // unconditional call throws for one of the two kinds at runtime.
    for (const operation of ACL_OPERATIONS) {
      assert.ok(
        /PSIsContainer/.test(SCRIPT_BY_OPERATION[operation]),
        `${operation} must branch on PSIsContainer before choosing GetAccessControl`
      );
    }
  });

  it('W-12-04: the writer applies the descriptor through the .NET API, not Set-Acl', () => {
    const script = SCRIPT_BY_OPERATION['apply-acl'];
    assert.ok(
      script.includes('[System.IO.Directory]::SetAccessControl'),
      'apply-acl must write a directory descriptor via [System.IO.Directory]::SetAccessControl'
    );
    assert.ok(
      script.includes('[System.IO.File]::SetAccessControl'),
      'apply-acl must write a file descriptor via [System.IO.File]::SetAccessControl'
    );
  });

  it('W-12-05: rule enumeration keeps inherited entries', () => {
    // `$acl.Access` returned explicit AND inherited rules. GetAccessRules(includeExplicit,
    // includeInherited, type) must pass includeInherited = $true, or the owner-only verdict
    // silently changes — a security regression, not a cosmetic one.
    for (const operation of ACL_OPERATIONS) {
      const occurrences = SCRIPT_BY_OPERATION[operation].match(/GetAccessRules\(\$true, \$true,/g) ?? [];
      assert.ok(
        occurrences.length > 0,
        `${operation} must enumerate rules with GetAccessRules($true, $true, <SID type>) so inherited rules are kept`
      );
      assert.ok(
        !/GetAccessRules\(\$true, \$false,/.test(SCRIPT_BY_OPERATION[operation]),
        `${operation} must not drop inherited rules`
      );
    }
  });

  it('W-12-06: the owner-only policy constants are unchanged', () => {
    // The fix must not widen the ACL. SYSTEM is the only additional principal, and the
    // current user is the only accepted owner — exactly as before.
    for (const operation of ACL_OPERATIONS) {
      const script = SCRIPT_BY_OPERATION[operation];
      if (script.includes('S-1-5-18')) {
        assert.ok(
          !script.includes('S-1-1-0') && !script.includes('S-1-5-32-545'),
          `${operation} must not admit Everyone or Users into the owner-only policy`
        );
      }
    }
    assert.ok(
      SCRIPT_BY_OPERATION['apply-acl'].includes("S-1-5-18"),
      'apply-acl must still grant SYSTEM FullControl explicitly'
    );
    assert.ok(
      SCRIPT_BY_OPERATION['apply-acl'].includes('SetAccessRuleProtection($true, $false)'),
      'apply-acl must still disable inheritance'
    );
  });

  it('W-12-07: no program relies on a cmdlet that needs an unimported module', () => {
    // The two DPAPI programs already used only .NET types; the three ACL programs now match.
    // `Add-Type` is deliberately NOT required: the probe proved the System.IO / AccessControl
    // types resolve in this child without any explicit assembly load.
    for (const operation of OPERATIONS) {
      const script = SCRIPT_BY_OPERATION[operation];
      assert.ok(
        !/\bImport-Module\b/.test(script),
        `${operation} must not depend on Import-Module: importing Microsoft.PowerShell.Security ` +
          'raises RuntimeException in this child, so an import would convert a silent failure into a loud one ' +
          'without fixing anything'
      );
    }
  });

  it('W-12-08: every encoded program round-trips to the source text', () => {
    // encodeDpapiScript is the only path to the child. If it mangles text, the program
    // that runs is not the program that was reviewed.
    for (const operation of OPERATIONS) {
      const decoded = Buffer.from(encodeDpapiScript(operation), 'base64').toString('utf16le');
      assert.equal(decoded, SCRIPT_BY_OPERATION[operation], `${operation} must round-trip exactly`);
    }
  });

  it('W-12-09: invocation flags stay non-interactive and profile-free', () => {
    // Autoloaded-module behaviour differs with a profile; this fix depends on that being off.
    const args = dpapiPowerShellArgs('describe-acl');
    assert.ok(args.includes('-NoProfile'), '-NoProfile must stay');
    assert.ok(args.includes('-NonInteractive'), '-NonInteractive must stay');
    assert.ok(args.includes('-EncodedCommand'), '-EncodedCommand must stay');
    assert.ok(!args.includes('-File'), 'the program must travel as -EncodedCommand');
    for (const operation of OPERATIONS) {
      assert.ok(
        dpapiPowerShellArgs(operation).includes('-EncodedCommand'),
        `${operation} must use -EncodedCommand`
      );
    }
  });

  it('W-12-10: a coarse failure is still reported, never a silent success', () => {
    // Fail-closed is the contract: each program answers with a category, and the caller
    // decides. The fix must not introduce a path that reports success without a descriptor.
    assert.ok(
      SCRIPT_BY_OPERATION['describe-acl'].includes("kind = 'ACL_READ_FAILED'"),
      'describe-acl must keep its ACL_READ_FAILED category'
    );
    assert.ok(
      SCRIPT_BY_OPERATION['read-acl'].includes("kind = 'ACL_READ_FAILED'"),
      'read-acl must keep its ACL_READ_FAILED category'
    );
    assert.ok(
      SCRIPT_BY_OPERATION['apply-acl'].includes("kind = 'ACL_APPLY_FAILED'"),
      'apply-acl must keep its ACL_APPLY_FAILED category'
    );
    assert.ok(
      SCRIPT_BY_OPERATION['describe-acl'].includes('AreAccessRulesProtected'),
      'describe-acl must still report the inheritance flag the policy evaluates'
    );
  });
});
