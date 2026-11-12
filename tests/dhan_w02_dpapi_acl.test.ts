/**
 * Institutional Investment Platform System (IIPS)
 * W-02 — Owner-Only DACL Policy, Idempotent Application and Carrier Regression
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1)
 * Authority: D-1 (owner-only DACL on the carrier directory and every carrier file)
 * Work item: W-02
 *
 * WHAT FAILED ON THE WINDOWS HOST (2026-11-12, HRESULT -2147024891,
 * System.Security.AccessControl.PrivilegeNotHeldException):
 *  `writeDpapiCarrierAtomically` applied the carrier-directory DACL on EVERY write. The client-id
 *  carrier succeeded; the access-token carrier then rewrote an already-correct directory DACL and
 *  the OS refused. The correction is to verify the observed DACL and rewrite only on a real
 *  difference — never to suppress the exception and never to widen the ACL.
 *
 * SCOPE OF PROOF:
 *  The production policy (`evaluateOwnerOnlyAcl`), the production orchestrator
 *  (`createWindowsDpapiAclApplier`) and the production atomic writer are executed for real.
 *  Only the Windows OS boundary is emulated: an injected runner that maintains DACL state and
 *  answers `read-acl` / `apply-acl` the way the static PowerShell programs do. No real DPAPI
 *  call is made here, and nothing in this file is a Windows result.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DPAPI_ACL_FULL_CONTROL_RIGHTS,
  DPAPI_ACL_INHERITANCE_DIRECTORY,
  DPAPI_ACL_INHERITANCE_NONE,
  DPAPI_ACL_PROPAGATION_NONE,
  DPAPI_ACL_SYSTEM_SID,
  DpapiAclApplyError,
  DpapiAclDescriptor,
  DpapiAclRule,
  createWindowsDpapiAclApplier,
  createWindowsDpapiAclContainer,
  evaluateOwnerOnlyAcl,
  expectedAclInheritance,
  parseDpapiAclResponse,
} from '../src/providers/dhan/dhan_dpapi_acl.js';

import {
  DPAPI_CARRIER_SCHEMA_VERSION,
  DpapiCarrierEnvelope,
  DpapiCarrierRole,
  DpapiCarrierWriteError,
  dpapiCarrierPathFor,
  parseDpapiCarrierEnvelope,
  writeDpapiCarrierAtomically,
} from '../src/providers/dhan/dhan_dpapi_carrier.js';

import {
  DpapiProcessOutcome,
  DpapiProcessRequest,
  DpapiProcessRunner,
  dpapiPowerShellArgs,
  encodeDpapiScript,
} from '../src/providers/dhan/dhan_dpapi_process.js';

// ─────────────────────────────────────────────────────────────────────────────
// Emulated Windows ACL boundary
// ─────────────────────────────────────────────────────────────────────────────

const USER_SID = 'S-1-5-21-1111111111-2222222222-3333333333-1001';
const OTHER_USER_SID = 'S-1-5-21-1111111111-2222222222-3333333333-1002';
const USERS_GROUP_SID = 'S-1-5-32-545';

interface EmulatedObject {
  ownerSid: string;
  protected: boolean;
  rules: DpapiAclRule[];
}

function rule(sid: string, overrides: Partial<DpapiAclRule> = {}): DpapiAclRule {
  return {
    sid,
    accessControlType: 'Allow',
    rights: DPAPI_ACL_FULL_CONTROL_RIGHTS,
    inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY,
    propagationFlags: DPAPI_ACL_PROPAGATION_NONE,
    inherited: false,
    ...overrides,
  };
}

function ownerOnlyDirectory(): EmulatedObject {
  return {
    ownerSid: USER_SID,
    protected: true,
    rules: [
      rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
      rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
    ],
  };
}

/**
 * A tiny model of the Windows side. `read-acl` reports the stored descriptor; `apply-acl`
 * performs the same transformation the static PowerShell program performs — inheritance
 * disabled, all rules removed, current user + SYSTEM FullControl with the kind's flags —
 * unless it is told to fail or to be ineffective.
 */
class EmulatedWindowsAcl {
  public readonly calls: Array<{ operation: string; target: string; kind?: string }> = [];
  public readonly objects = new Map<string, EmulatedObject>();
  public readonly failApply = new Set<string>();
  public readonly ineffectiveApply = new Set<string>();
  public readonly denyApply = new Set<string>();
  public failRead = false;

  public readonly runner: DpapiProcessRunner = async (
    request: DpapiProcessRequest
  ): Promise<DpapiProcessOutcome> => {
    const payload = request.payload as { path?: unknown; kind?: unknown };
    const target = typeof payload.path === 'string' ? payload.path : '';
    const kind = typeof payload.kind === 'string' ? payload.kind : undefined;
    this.calls.push({ operation: request.operation, target, kind });

    if (request.operation === 'read-acl') {
      if (this.failRead) return { kind: 'non-zero-exit', stdout: '', stderrByteLength: 12 };
      const object = this.objects.get(target);
      if (!object) {
        return {
          kind: 'ok',
          stdout: JSON.stringify({ ok: true, exists: false, currentUserSid: USER_SID }),
          stderrByteLength: 0,
        };
      }
      return {
        kind: 'ok',
        stdout: JSON.stringify({
          ok: true,
          exists: true,
          currentUserSid: USER_SID,
          ownerSid: object.ownerSid,
          protected: object.protected,
          rules: object.rules,
        }),
        stderrByteLength: 0,
      };
    }

    if (request.operation === 'apply-acl') {
      if (this.denyApply.has(target)) {
        return {
          kind: 'ok',
          stdout: JSON.stringify({ ok: false, kind: 'ACL_APPLY_FAILED' }),
          stderrByteLength: 0,
        };
      }
      if (this.failApply.has(target)) {
        // A native failure: non-zero exit, as PrivilegeNotHeldException produces.
        return { kind: 'non-zero-exit', stdout: '', stderrByteLength: 640 };
      }
      if (!this.ineffectiveApply.has(target)) {
        this.objects.set(target, {
          ownerSid: USER_SID,
          protected: true,
          rules: [
            rule(USER_SID, {
              inheritanceFlags: expectedAclInheritance(kind === 'file' ? 'file' : 'directory'),
            }),
            rule(DPAPI_ACL_SYSTEM_SID, {
              inheritanceFlags: expectedAclInheritance(kind === 'file' ? 'file' : 'directory'),
            }),
          ],
        });
      }
      return {
        kind: 'ok',
        stdout: JSON.stringify({ ok: true, changed: true }),
        stderrByteLength: 0,
      };
    }

    return { kind: 'non-zero-exit', stdout: '', stderrByteLength: 0 };
  };

  public countFor(operation: string, target: string): number {
    return this.calls.filter((call) => call.operation === operation && call.target === target).length;
  }

  public directoryApplies(target: string): number {
    return this.calls.filter(
      (call) => call.operation === 'apply-acl' && call.target === target && call.kind === 'directory'
    ).length;
  }
}

function envelopeFor(role: DpapiCarrierRole, ciphertext: string): DpapiCarrierEnvelope {
  const created = new Date('2026-11-12T00:00:00.000Z');
  const base: DpapiCarrierEnvelope = {
    schemaVersion: DPAPI_CARRIER_SCHEMA_VERSION,
    secretId: role === 'clientId' ? 'dhan-client-id' : 'dhan-access-token',
    vaultProvider: 'WINDOWS_DPAPI',
    version: 'v1',
    createdAtUtc: created.toISOString(),
    rotatedAtUtc: created.toISOString(),
    ciphertext,
  };
  if (role === 'accessToken') {
    return { ...base, expiresAtUtc: '2026-12-12T00:00:00.000Z' };
  }
  return base;
}

function tempCarrierRoot(label: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `w02acl-${label}-`));
  return root;
}

function listTemps(root: string): string[] {
  return fs.readdirSync(root).filter((name) => name.endsWith('.tmp'));
}

// ─────────────────────────────────────────────────────────────────────────────

describe('W-02 / owner-only DACL policy', () => {
  it('W-02-ACL-01: the exact owner-only policy is accepted for a directory and a file', () => {
    const directory: DpapiAclDescriptor = {
      exists: true,
      currentUserSid: USER_SID,
      ownerSid: USER_SID,
      protected: true,
      rules: [
        rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
        rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
      ],
    };
    assert.deepStrictEqual(evaluateOwnerOnlyAcl(directory, { kind: 'directory', currentUserSid: USER_SID }), {
      ok: true,
    });

    const file: DpapiAclDescriptor = {
      ...directory,
      rules: [
        rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_NONE }),
        rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_NONE }),
      ],
    };
    assert.deepStrictEqual(evaluateOwnerOnlyAcl(file, { kind: 'file', currentUserSid: USER_SID }), {
      ok: true,
    });
  });

  it('W-02-ACL-02: every deviation is a specific defect, never an acceptance', () => {
    const base: DpapiAclDescriptor = {
      exists: true,
      currentUserSid: USER_SID,
      ownerSid: USER_SID,
      protected: true,
      rules: [
        rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
        rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
      ],
    };
    const expectation = { kind: 'directory' as const, currentUserSid: USER_SID };

    const cases: Array<{ name: string; descriptor: DpapiAclDescriptor; defect: string }> = [
      {
        name: 'path missing',
        descriptor: { ...base, exists: false, rules: [] },
        defect: 'ACL_PATH_MISSING',
      },
      {
        name: 'inheritance still enabled',
        descriptor: { ...base, protected: false },
        defect: 'ACL_NOT_PROTECTED',
      },
      {
        name: 'owner is another account',
        descriptor: { ...base, ownerSid: OTHER_USER_SID },
        defect: 'ACL_OWNER_MISMATCH',
      },
      {
        name: 'one rule only',
        descriptor: { ...base, rules: [base.rules[0]] },
        defect: 'ACL_RULE_COUNT',
      },
      {
        name: 'an extra principal',
        descriptor: {
          ...base,
          rules: [...base.rules, rule(USERS_GROUP_SID)],
        },
        defect: 'ACL_RULE_COUNT',
      },
      {
        name: 'an unexpected principal in a two-rule DACL',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
            rule(USERS_GROUP_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_UNEXPECTED_PRINCIPAL',
      },
      {
        name: 'the same principal twice',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
            rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_DUPLICATE_PRINCIPAL',
      },
      {
        name: 'a deny rule',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, {
              inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY,
              accessControlType: 'Deny',
            }),
            rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_DENY_RULE',
      },
      {
        name: 'an inherited rule',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, {
              inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY,
              inherited: true,
            }),
            rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_INHERITED_RULE',
      },
      {
        name: 'less than FullControl',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY, rights: 0x1301bf }),
            rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_RIGHTS',
      },
      {
        name: 'the wrong inheritance flags for a directory',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_NONE }),
            rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_NONE }),
          ],
        },
        defect: 'ACL_INHERITANCE',
      },
      {
        name: 'inherit-only propagation',
        descriptor: {
          ...base,
          rules: [
            rule(USER_SID, {
              inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY,
              propagationFlags: 4,
            }),
            rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
          ],
        },
        defect: 'ACL_PROPAGATION',
      },
      {
        name: 'an unreadable descriptor',
        descriptor: { ...base, rules: null as unknown as DpapiAclRule[] },
        defect: 'ACL_DESCRIPTOR_INVALID',
      },
      {
        name: 'a partial rule',
        descriptor: {
          ...base,
          rules: [{ sid: USER_SID } as unknown as DpapiAclRule, base.rules[1]],
        },
        defect: 'ACL_DESCRIPTOR_INVALID',
      },
    ];

    for (const testCase of cases) {
      const evaluation = evaluateOwnerOnlyAcl(testCase.descriptor, expectation);
      assert.strictEqual(evaluation.ok, false, `${testCase.name} must not be accepted`);
      if (evaluation.ok) continue;
      assert.strictEqual(evaluation.defect, testCase.defect, testCase.name);
    }

    // An unknown caller identity cannot be verified at all.
    assert.deepStrictEqual(
      evaluateOwnerOnlyAcl(base, { kind: 'directory', currentUserSid: '' }),
      { ok: false, defect: 'ACL_PRINCIPAL_UNKNOWN' }
    );
  });

  it('W-02-ACL-03: the child response is parsed for both PowerShell wire shapes', () => {
    const twoRules = {
      ok: true,
      exists: true,
      currentUserSid: USER_SID,
      ownerSid: USER_SID,
      protected: true,
      rules: [
        rule(USER_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
        rule(DPAPI_ACL_SYSTEM_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY }),
      ],
    };
    const parsed = parseDpapiAclResponse(JSON.stringify(twoRules));
    assert.ok(parsed);
    assert.strictEqual(parsed?.rules.length, 2);

    // Windows PowerShell serialises a single-element array as an object.
    const collapsed = parseDpapiAclResponse(
      JSON.stringify({ ...twoRules, rules: rule(USER_SID, { inheritanceFlags: 3 }) })
    );
    assert.ok(collapsed);
    assert.strictEqual(collapsed?.rules.length, 1);
    assert.strictEqual(
      evaluateOwnerOnlyAcl(collapsed as DpapiAclDescriptor, {
        kind: 'directory',
        currentUserSid: USER_SID,
      }).ok,
      false
    );

    const missing = parseDpapiAclResponse(
      JSON.stringify({ ok: true, exists: false, currentUserSid: USER_SID })
    );
    assert.strictEqual(missing?.exists, false);
    assert.strictEqual(
      evaluateOwnerOnlyAcl(missing as DpapiAclDescriptor, {
        kind: 'directory',
        currentUserSid: USER_SID,
      }).ok,
      false
    );

    assert.strictEqual(parseDpapiAclResponse('not json'), null);
    assert.strictEqual(parseDpapiAclResponse(JSON.stringify({ ok: false })), null);
    assert.strictEqual(
      parseDpapiAclResponse(JSON.stringify({ ...twoRules, protected: 'yes' })),
      null
    );
  });
});

describe('W-02 / idempotent DACL application', () => {
  it('W-02-ACL-04: an already-correct directory DACL is verified, not rewritten', async () => {
    const os = new EmulatedWindowsAcl();
    const directory = 'H:\\IIPS\\runtime\\dhan-secrets';
    os.objects.set(directory, ownerOnlyDirectory());

    const apply = createWindowsDpapiAclApplier({ runner: os.runner });
    const result = await apply(directory, 'directory');

    assert.deepStrictEqual(result, { changed: false, verified: true });
    assert.strictEqual(os.countFor('apply-acl', directory), 0, 'Set-Acl must not be invoked');
    assert.strictEqual(os.countFor('read-acl', directory), 1);
  });

  it('W-02-ACL-05: an incorrect DACL is corrected, then verified by read-back', async () => {
    const os = new EmulatedWindowsAcl();
    const directory = 'H:\\IIPS\\runtime\\dhan-secrets';
    os.objects.set(directory, {
      ownerSid: USER_SID,
      protected: false,
      rules: [rule(USERS_GROUP_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY })],
    });

    const apply = createWindowsDpapiAclApplier({ runner: os.runner });
    const result = await apply(directory, 'directory');

    assert.deepStrictEqual(result, { changed: true, verified: true });
    assert.strictEqual(os.countFor('apply-acl', directory), 1);
    assert.strictEqual(
      os.countFor('read-acl', directory),
      2,
      'the result must be read back after application'
    );
    assert.deepStrictEqual(
      evaluateOwnerOnlyAcl(
        {
          exists: true,
          currentUserSid: USER_SID,
          ownerSid: USER_SID,
          protected: true,
          rules: os.objects.get(directory)!.rules,
        },
        { kind: 'directory', currentUserSid: USER_SID }
      ),
      { ok: true }
    );
  });

  it('W-02-ACL-06: a DACL that still fails verification fails closed', async () => {
    const os = new EmulatedWindowsAcl();
    const directory = 'H:\\IIPS\\runtime\\dhan-secrets';
    os.objects.set(directory, {
      ownerSid: USER_SID,
      protected: false,
      rules: [rule(USERS_GROUP_SID, { inheritanceFlags: DPAPI_ACL_INHERITANCE_DIRECTORY })],
    });
    os.ineffectiveApply.add(directory);

    const apply = createWindowsDpapiAclApplier({ runner: os.runner });
    await assert.rejects(
      () => apply(directory, 'directory'),
      (error: unknown) => {
        assert.ok(error instanceof DpapiAclApplyError);
        assert.strictEqual((error as DpapiAclApplyError).reason, 'ACL_VERIFY_FAILED');
        assert.strictEqual((error as DpapiAclApplyError).defect, 'ACL_NOT_PROTECTED');
        return true;
      }
    );
  });

  it('W-02-ACL-07: an application that reports failure is never treated as success', async () => {
    const os = new EmulatedWindowsAcl();
    const target = 'H:\\IIPS\\runtime\\dhan-secrets';

    // (a) the child exits non-zero (the PrivilegeNotHeldException shape: HRESULT -2147024891)
    os.objects.set(target, { ownerSid: USER_SID, protected: false, rules: [] });
    os.failApply.add(target);
    await assert.rejects(
      () => createWindowsDpapiAclApplier({ runner: os.runner })(target, 'directory'),
      (error: unknown) => {
        assert.ok(error instanceof DpapiAclApplyError);
        assert.strictEqual((error as DpapiAclApplyError).reason, 'ACL_APPLY_FAILED');
        // The failure text is fixed: no path, no SID, no child output.
        assert.ok(!(error as Error).message.includes('PrivilegeNotHeld'));
        assert.ok(!(error as Error).message.includes(target));
        return true;
      }
    );

    // (b) the child runs but answers ok:false
    const second = new EmulatedWindowsAcl();
    second.objects.set(target, { ownerSid: USER_SID, protected: false, rules: [] });
    second.denyApply.add(target);
    await assert.rejects(
      () => createWindowsDpapiAclApplier({ runner: second.runner })(target, 'directory'),
      (error: unknown) =>
        error instanceof DpapiAclApplyError &&
        (error as DpapiAclApplyError).reason === 'ACL_APPLY_FAILED'
    );
  });

  it('W-02-ACL-08: an unreadable descriptor fails closed before any write', async () => {
    const os = new EmulatedWindowsAcl();
    os.failRead = true;
    await assert.rejects(
      () => createWindowsDpapiAclApplier({ runner: os.runner })('H:\\IIPS\\runtime', 'directory'),
      (error: unknown) =>
        error instanceof DpapiAclApplyError && (error as DpapiAclApplyError).reason === 'ACL_READ_FAILED'
    );
    assert.strictEqual(os.calls.filter((call) => call.operation === 'apply-acl').length, 0);
  });
});

describe('W-02 / carrier writes through the production applier', () => {
  it('W-02-ACL-09: the second carrier write does not rewrite the directory DACL', async () => {
    const root = tempCarrierRoot('sequence');
    const os = new EmulatedWindowsAcl();
    const apply = createWindowsDpapiAclApplier({ runner: os.runner });

    const client = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'clientId',
      envelope: envelopeFor('clientId', Buffer.from('cipher-client').toString('base64')),
      applyOwnerOnlyAcl: apply,
    });
    assert.strictEqual(client.directoryAclRewritten, true, 'the first write establishes the DACL');

    const token = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'accessToken',
      envelope: envelopeFor('accessToken', Buffer.from('cipher-token').toString('base64')),
      applyOwnerOnlyAcl: apply,
    });
    assert.strictEqual(token.directoryAclRewritten, false, 'the second write must not rewrite it');

    // One directory application in total — the reported failure was the second one.
    assert.strictEqual(os.directoryApplies(root), 1);
    assert.strictEqual(fs.existsSync(client.carrierPath), true);
    assert.strictEqual(fs.existsSync(token.carrierPath), true);
    assert.deepStrictEqual(listTemps(root), [], 'no beside-file may survive a write');

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('W-02-ACL-10: every beside-file receives the file DACL before its content exists', async () => {
    const root = tempCarrierRoot('files');
    const os = new EmulatedWindowsAcl();
    const apply = createWindowsDpapiAclApplier({ runner: os.runner });

    for (const role of ['clientId', 'accessToken', 'clientId'] as const) {
      await writeDpapiCarrierAtomically({
        carrierDirectory: root,
        role,
        envelope: envelopeFor(role, Buffer.from(`cipher-${role}-${Date.now()}`).toString('base64')),
        applyOwnerOnlyAcl: apply,
      });
    }

    const fileApplies = os.calls.filter((call) => call.operation === 'apply-acl' && call.kind === 'file');
    assert.strictEqual(fileApplies.length, 3, 'the file DACL is applied on every write');
    assert.strictEqual(new Set(fileApplies.map((call) => call.target)).size, 3);
    // A beside-file never starts protected and never carries the directory flags.
    for (const target of fileApplies.map((call) => call.target)) {
      const object = os.objects.get(target);
      assert.ok(object, 'the file DACL must have been established before the swap');
      assert.strictEqual(object?.protected, true);
      assert.ok(object.rules.every((entry) => entry.inheritanceFlags === DPAPI_ACL_INHERITANCE_NONE));
    }

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('W-02-ACL-11: a directory ACL failure leaves no carrier behind', async () => {
    const root = tempCarrierRoot('dirfail');
    const os = new EmulatedWindowsAcl();
    os.failApply.add(root);
    os.objects.set(root, { ownerSid: USER_SID, protected: false, rules: [] });
    const apply = createWindowsDpapiAclApplier({ runner: os.runner });

    await assert.rejects(
      () =>
        writeDpapiCarrierAtomically({
          carrierDirectory: root,
          role: 'clientId',
          envelope: envelopeFor('clientId', 'AAAA'),
          applyOwnerOnlyAcl: apply,
        }),
      (error: unknown) => {
        assert.ok(error instanceof DpapiCarrierWriteError);
        assert.strictEqual((error as DpapiCarrierWriteError).stage, 'ACL');
        assert.strictEqual(
          (error as Error).message,
          'carrier directory access restriction failed'
        );
        return true;
      }
    );

    assert.strictEqual(fs.readdirSync(root).length, 0, 'nothing may be written without the DACL');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('W-02-ACL-12: a beside-file ACL failure preserves the previous carrier and fails closed', async () => {
    const root = tempCarrierRoot('fileacl');
    const os = new EmulatedWindowsAcl();

    // Establish a good carrier first.
    const good = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'clientId',
      envelope: envelopeFor('clientId', Buffer.from('cipher-original').toString('base64')),
      applyOwnerOnlyAcl: createWindowsDpapiAclApplier({ runner: os.runner }),
    });
    const before = fs.readFileSync(good.carrierPath, 'utf8');

    // Now make every future beside-file ACL fail.
    const failingApply = createWindowsDpapiAclApplier({
      runner: async (request: DpapiProcessRequest): Promise<DpapiProcessOutcome> => {
        const payload = request.payload as { path?: unknown };
        if (request.operation === 'apply-acl' && typeof payload.path === 'string') {
          return { kind: 'non-zero-exit', stdout: '', stderrByteLength: 320 };
        }
        return os.runner(request);
      },
    });

    await assert.rejects(
      () =>
        writeDpapiCarrierAtomically({
          carrierDirectory: root,
          role: 'clientId',
          envelope: envelopeFor('clientId', Buffer.from('cipher-rotated').toString('base64')),
          applyOwnerOnlyAcl: failingApply,
        }),
      (error: unknown) =>
        error instanceof DpapiCarrierWriteError &&
        (error as DpapiCarrierWriteError).stage === 'ACL' &&
        (error as Error).message === 'carrier access restriction failed'
    );

    assert.strictEqual(fs.readFileSync(good.carrierPath, 'utf8'), before, 'the carrier is untouched');
    assert.deepStrictEqual(listTemps(root), [], 'the beside-file is removed');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('W-02-ACL-13: replacement stays atomic and verified through the production applier', async () => {
    const root = tempCarrierRoot('replace');
    const os = new EmulatedWindowsAcl();
    const apply = createWindowsDpapiAclApplier({ runner: os.runner });

    const first = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'accessToken',
      envelope: envelopeFor('accessToken', Buffer.from('cipher-first').toString('base64')),
      applyOwnerOnlyAcl: apply,
    });
    assert.strictEqual(first.replaced, false);

    const second = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'accessToken',
      envelope: envelopeFor('accessToken', Buffer.from('cipher-second').toString('base64')),
      applyOwnerOnlyAcl: apply,
    });
    assert.strictEqual(second.replaced, true);
    assert.strictEqual(second.carrierPath, dpapiCarrierPathFor(root, 'accessToken'));

    const text = fs.readFileSync(second.carrierPath, 'utf8');
    assert.strictEqual(parseDpapiCarrierEnvelope(text, { now: new Date('2026-11-12T01:00:00.000Z') }).ok, true);
    assert.strictEqual(text.includes(Buffer.from('cipher-second').toString('base64')), true);
    assert.strictEqual(text.includes('cipher-first'), false);
    assert.deepStrictEqual(listTemps(root), []);
    assert.deepStrictEqual(fs.readdirSync(root), ['dhan-access-token.carrier.json']);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('W-02-ACL-14: the container factory is the production composition point', async () => {
    const root = tempCarrierRoot('container');
    const os = new EmulatedWindowsAcl();
    const acl = createWindowsDpapiAclContainer({ runner: os.runner });

    const written = await writeDpapiCarrierAtomically({
      carrierDirectory: root,
      role: 'clientId',
      envelope: envelopeFor('clientId', 'AAAA'),
      applyOwnerOnlyAcl: acl.apply,
    });
    assert.strictEqual(written.directoryAclRewritten, true);
    assert.strictEqual(os.directoryApplies(root), 1);

    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe('W-02 / static ACL programs', () => {
  it('W-02-ACL-15: the apply program is static, privileged-only and carries no data', () => {
    const applyArgs = dpapiPowerShellArgs('apply-acl');
    const readArgs = dpapiPowerShellArgs('read-acl');

    assert.deepStrictEqual(applyArgs.slice(0, 5), [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
    ]);
    assert.strictEqual(applyArgs.length, 6);
    // Nothing but the fixed program: no path, no kind, no value, no ciphertext.
    assert.ok(!applyArgs.join(' ').includes('dhan-secrets'));
    assert.ok(!readArgs.join(' ').includes('dhan-secrets'));

    const applyScript = Buffer.from(encodeDpapiScript('apply-acl'), 'base64').toString('utf16le');
    assert.ok(applyScript.includes('SetAccessRuleProtection($true, $false)'));
    assert.ok(applyScript.includes("'S-1-5-18'"));
    assert.ok(applyScript.includes('FileSystemRights]::FullControl'));
    assert.ok(applyScript.includes('PropagationFlags]::None'));
    assert.ok(applyScript.includes('Set-Acl'));
    assert.ok(applyScript.includes('[Console]::In.ReadToEnd()'));
    // It must never evaluate the policy itself, never read its own result back and never slurp
    // stderr into the pipeline: those are the caller's job, in `dhan_dpapi_acl.ts`.
    assert.ok(!applyScript.includes('2>&1'));
    assert.ok(!applyScript.includes('AreAccessRulesProtected'));
    assert.ok(!applyScript.includes('IsInherited'));

    const readScript = Buffer.from(encodeDpapiScript('read-acl'), 'base64').toString('utf16le');
    assert.ok(readScript.includes('AreAccessRulesProtected'));
    assert.ok(readScript.includes('IsInherited'));
    assert.ok(readScript.includes('FileSystemRights'));
    // The read program never writes an ACL.
    assert.ok(!readScript.includes('Set-Acl'));

    // The existing probe program keeps its shape (the backend depends on it).
    const describeScript = Buffer.from(encodeDpapiScript('describe-acl'), 'base64').toString('utf16le');
    assert.ok(describeScript.includes('onlyOwnerAndSystem'));
    assert.ok(describeScript.includes('ownerIsCurrentUser'));
  });

  it('W-02-ACL-16: the Windows acceptance harness uses the production applier', () => {
    const harness = fs.readFileSync(
      path.resolve('windows-acceptance/w02_dpapi_acceptance.mjs'),
      'utf8'
    );
    assert.ok(
      harness.includes("dhan_dpapi_acl.js"),
      'the harness must import the production ACL module'
    );
    assert.ok(harness.includes('createWindowsDpapiAclApplier'));
    assert.ok(
      !harness.includes('APPLY_ACL_SCRIPT'),
      'the harness must not keep a private ACL implementation'
    );
    assert.ok(harness.includes('W02-WIN-08B'), 'the idempotency acceptance case must exist');
    assert.ok(harness.includes('directoryAclRewritten'));
  });
});
