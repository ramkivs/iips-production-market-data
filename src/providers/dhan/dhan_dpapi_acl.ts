/**
 * Institutional Investment Platform System (IIPS)
 * Owner-Only DACL Policy and Idempotent Application (W-02 / D-1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), D-1 + W-02
 *
 * WHAT THIS MODULE IS:
 *  The production owner of the D-1 access-control policy for the DPAPI carrier directory and
 *  carrier files: it reads the observed DACL, decides whether it is *exactly* the required
 *  policy, rewrites it only when it is not, reads it back and verifies the result.
 *
 * WHY IT EXISTS (Windows-host defect, 2026-11-12):
 *  The original write path applied the directory DACL on every carrier write. On the operator's
 *  Windows host the second unconditional rewrite raised
 *  `System.Security.AccessControl.PrivilegeNotHeldException` (HRESULT -2147024891): the client-id
 *  carrier was written, and the access-token carrier failed before its content existed. A DACL
 *  that is already correct needs no `Set-Acl` at all, so the fix is to verify first and write only
 *  on a real difference — not to suppress the exception, not to widen the ACL.
 *
 * DESIGN:
 *  - the policy is a pure function (`evaluateOwnerOnlyAcl`) with one implementation, so it can be
 *    tested exhaustively without Windows;
 *  - the child process reports descriptors only (`read-acl`) and applies only when told to
 *    (`apply-acl`); it never decides, and it never suppresses a failure;
 *  - every application is followed by a read-back and a fresh evaluation: a DACL that cannot be
 *    verified is a failure, never a success.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import {
  createPowerShellDpapiProcessRunner,
  type DpapiProcessRunner,
} from './dhan_dpapi_process.js';
import type { DpapiAclApplyResult, DpapiAclTargetKind } from './dhan_dpapi_carrier.js';

/** `FileSystemRights.FullControl` (0x1F01FF). The only rights this policy grants. */
export const DPAPI_ACL_FULL_CONTROL_RIGHTS = 2_032_127;

/** SYSTEM. Always the second and last principal; never an additional one. */
export const DPAPI_ACL_SYSTEM_SID = 'S-1-5-18';

/** `InheritanceFlags.None` — a carrier file grants nothing downstream. */
export const DPAPI_ACL_INHERITANCE_NONE = 0;

/** `InheritanceFlags.ContainerInherit | ObjectInherit` — a directory propagates to its carriers. */
export const DPAPI_ACL_INHERITANCE_DIRECTORY = 3;

/** `PropagationFlags.None`. Inherit-only or no-propagate rules are not accepted. */
export const DPAPI_ACL_PROPAGATION_NONE = 0;

/** One observed access rule, as reported by the `read-acl` child process. */
export interface DpapiAclRule {
  /** Security identifier of the principal, translated. Empty when it could not be resolved. */
  readonly sid: string;
  /** `Allow` / `Deny`. */
  readonly accessControlType: string;
  /** Numeric `FileSystemRights`. */
  readonly rights: number;
  /** Numeric `InheritanceFlags`. */
  readonly inheritanceFlags: number;
  /** Numeric `PropagationFlags`. */
  readonly propagationFlags: number;
  /** True when the rule is inherited from a parent rather than set on this object. */
  readonly inherited: boolean;
}

/** The observed DACL of one path. */
export interface DpapiAclDescriptor {
  readonly exists: boolean;
  /** The SID of the account running the child process — the only owner the policy accepts. */
  readonly currentUserSid: string;
  /** The observed owner SID (`''` when it could not be translated). */
  readonly ownerSid: string;
  /** `$acl.AreAccessRulesProtected` — inheritance must be disabled. */
  readonly protected: boolean;
  readonly rules: readonly DpapiAclRule[];
}

/** Why a descriptor is not the required policy. Fixed codes only — never a path, never a value. */
export type DpapiAclDefect =
  | 'ACL_PATH_MISSING'
  | 'ACL_PRINCIPAL_UNKNOWN'
  | 'ACL_DESCRIPTOR_INVALID'
  | 'ACL_NOT_PROTECTED'
  | 'ACL_OWNER_MISMATCH'
  | 'ACL_RULE_COUNT'
  | 'ACL_UNEXPECTED_PRINCIPAL'
  | 'ACL_DUPLICATE_PRINCIPAL'
  | 'ACL_DENY_RULE'
  | 'ACL_INHERITED_RULE'
  | 'ACL_RIGHTS'
  | 'ACL_INHERITANCE'
  | 'ACL_PROPAGATION';

export type DpapiAclEvaluation =
  | { readonly ok: true }
  | { readonly ok: false; readonly defect: DpapiAclDefect };

export interface DpapiAclExpectation {
  readonly kind: DpapiAclTargetKind;
  /** The account running the child process; the only principal allowed besides SYSTEM. */
  readonly currentUserSid: string;
}

/** The inheritance flags a target kind must carry. */
export function expectedAclInheritance(kind: DpapiAclTargetKind): number {
  return kind === 'directory' ? DPAPI_ACL_INHERITANCE_DIRECTORY : DPAPI_ACL_INHERITANCE_NONE;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/**
 * The D-1 policy, as one total function.
 *
 * PASSES only when, for the target kind:
 *  - inheritance is disabled on the object (`AreAccessRulesProtected`);
 *  - the owner is the current user;
 *  - there are exactly two rules;
 *  - those rules are the current user and SYSTEM, each exactly once;
 *  - both are `Allow`, FullControl, and carry the kind's inheritance flags;
 *  - neither is inherited, and both use `PropagationFlags.None`.
 *
 * Anything else — including an additional principal, a duplicate, a Deny rule, a lesser right, a
 * wrong flag, or an inherited rule — is a defect. There is no "close enough".
 */
export function evaluateOwnerOnlyAcl(
  descriptor: DpapiAclDescriptor,
  expectation: DpapiAclExpectation
): DpapiAclEvaluation {
  if (!descriptor || typeof descriptor !== 'object') {
    return { ok: false, defect: 'ACL_DESCRIPTOR_INVALID' };
  }
  if (descriptor.exists !== true) {
    return { ok: false, defect: 'ACL_PATH_MISSING' };
  }
  const currentUserSid = expectation.currentUserSid;
  if (typeof currentUserSid !== 'string' || currentUserSid.length === 0) {
    return { ok: false, defect: 'ACL_PRINCIPAL_UNKNOWN' };
  }
  if (!Array.isArray(descriptor.rules)) {
    return { ok: false, defect: 'ACL_DESCRIPTOR_INVALID' };
  }
  if (descriptor.protected !== true) {
    return { ok: false, defect: 'ACL_NOT_PROTECTED' };
  }
  if (descriptor.ownerSid !== currentUserSid) {
    return { ok: false, defect: 'ACL_OWNER_MISMATCH' };
  }

  const expectedInheritance = expectedAclInheritance(expectation.kind);
  const allowed: readonly string[] = [currentUserSid, DPAPI_ACL_SYSTEM_SID];
  const seen: string[] = [];

  if (descriptor.rules.length !== allowed.length) {
    return { ok: false, defect: 'ACL_RULE_COUNT' };
  }

  for (const rule of descriptor.rules) {
    if (!rule || typeof rule !== 'object') return { ok: false, defect: 'ACL_DESCRIPTOR_INVALID' };
    if (typeof rule.sid !== 'string' || typeof rule.accessControlType !== 'string') {
      return { ok: false, defect: 'ACL_DESCRIPTOR_INVALID' };
    }
    if (
      !isFiniteInteger(rule.rights) ||
      !isFiniteInteger(rule.inheritanceFlags) ||
      !isFiniteInteger(rule.propagationFlags) ||
      typeof rule.inherited !== 'boolean'
    ) {
      return { ok: false, defect: 'ACL_DESCRIPTOR_INVALID' };
    }
    if (allowed.indexOf(rule.sid) < 0) {
      return { ok: false, defect: 'ACL_UNEXPECTED_PRINCIPAL' };
    }
    if (seen.indexOf(rule.sid) >= 0) {
      return { ok: false, defect: 'ACL_DUPLICATE_PRINCIPAL' };
    }
    seen.push(rule.sid);
    if (rule.inherited) {
      return { ok: false, defect: 'ACL_INHERITED_RULE' };
    }
    if (rule.accessControlType !== 'Allow') {
      return { ok: false, defect: 'ACL_DENY_RULE' };
    }
    if (rule.rights !== DPAPI_ACL_FULL_CONTROL_RIGHTS) {
      return { ok: false, defect: 'ACL_RIGHTS' };
    }
    if (rule.inheritanceFlags !== expectedInheritance) {
      return { ok: false, defect: 'ACL_INHERITANCE' };
    }
    if (rule.propagationFlags !== DPAPI_ACL_PROPAGATION_NONE) {
      return { ok: false, defect: 'ACL_PROPAGATION' };
    }
  }

  return { ok: true };
}

/**
 * Parse the `read-acl` child response into a descriptor.
 *
 * Tolerates the two wire shapes Windows PowerShell produces: an array of rules, or a single
 * rule serialised as an object. Returns null for anything else — a descriptor that cannot be
 * read is a failure, never an assumption.
 */
export function parseDpapiAclResponse(stdout: string): DpapiAclDescriptor | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Record<string, unknown>;
  if (record.ok !== true) return null;
  if (record.exists === false) {
    return {
      exists: false,
      currentUserSid: typeof record.currentUserSid === 'string' ? record.currentUserSid : '',
      ownerSid: '',
      protected: false,
      rules: [],
    };
  }
  if (record.exists !== true) return null;
  if (typeof record.currentUserSid !== 'string') return null;
  if (typeof record.ownerSid !== 'string') return null;
  if (typeof record.protected !== 'boolean') return null;

  const rawRules = record.rules;
  const list = Array.isArray(rawRules) ? rawRules : rawRules ? [rawRules] : [];
  const rules: DpapiAclRule[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') return null;
    const rule = item as Record<string, unknown>;
    if (typeof rule.sid !== 'string') return null;
    if (typeof rule.accessControlType !== 'string') return null;
    if (!isFiniteInteger(rule.rights)) return null;
    if (!isFiniteInteger(rule.inheritanceFlags)) return null;
    if (!isFiniteInteger(rule.propagationFlags)) return null;
    if (typeof rule.inherited !== 'boolean') return null;
    rules.push({
      sid: rule.sid,
      accessControlType: rule.accessControlType,
      rights: rule.rights,
      inheritanceFlags: rule.inheritanceFlags,
      propagationFlags: rule.propagationFlags,
      inherited: rule.inherited,
    });
  }

  return {
    exists: true,
    currentUserSid: record.currentUserSid,
    ownerSid: record.ownerSid,
    protected: record.protected,
    rules,
  };
}

/** Fixed failure reasons. Never a path, never a descriptor, never a secret. */
export type DpapiAclFailureReason = 'ACL_READ_FAILED' | 'ACL_APPLY_FAILED' | 'ACL_VERIFY_FAILED';

/**
 * Operator-safe ACL failure. Carries a fixed reason and, for a verification failure, the policy
 * defect that was observed. No path, no SID list, no exception text from the child.
 */
export class DpapiAclApplyError extends Error {
  public readonly reason: DpapiAclFailureReason;
  public readonly defect: DpapiAclDefect | null;

  constructor(reason: DpapiAclFailureReason, defect: DpapiAclDefect | null = null) {
    super(
      reason === 'ACL_READ_FAILED'
        ? 'the access-control descriptor could not be read'
        : reason === 'ACL_APPLY_FAILED'
          ? 'the owner-only access-control policy could not be applied'
          : 'the owner-only access-control policy could not be verified after application'
    );
    this.name = 'DpapiAclApplyError';
    this.reason = reason;
    this.defect = defect;
  }
}

export type DpapiAclApplier = (
  targetPath: string,
  kind: DpapiAclTargetKind
) => Promise<DpapiAclApplyResult>;

export interface WindowsDpapiAclApplierOptions {
  /** Defaults to the PowerShell child-process runner (production behaviour). */
  readonly runner?: DpapiProcessRunner;
  readonly powershellExecutable?: string;
  readonly timeoutMs?: number;
  /**
   * Overrides the SID reported by the child. Present for diagnostics; production uses the
   * child's own identity, so the policy can never be applied on behalf of another account.
   */
  readonly currentUserSid?: string;
}

/**
 * Production DACL applier.
 *
 * 1. read the descriptor (one child process);
 * 2. evaluate the exact policy in this process;
 * 3. when it is already correct — return `{ changed: false, verified: true }` and **do not**
 *    invoke `Set-Acl`;
 * 4. otherwise apply, read back, evaluate again, and throw `ACL_VERIFY_FAILED` when the result
 *    still is not the policy.
 *
 * A failure is never swallowed and a DACL is never accepted without verification.
 */
export function createWindowsDpapiAclApplier(
  options: WindowsDpapiAclApplierOptions = {}
): DpapiAclApplier {
  const runner =
    options.runner ??
    createPowerShellDpapiProcessRunner({
      powershellExecutable: options.powershellExecutable,
      timeoutMs: options.timeoutMs,
    });

  const readDescriptor = async (targetPath: string): Promise<DpapiAclDescriptor> => {
    const outcome = await runner({ operation: 'read-acl', payload: { path: targetPath } });
    if (outcome.kind !== 'ok') {
      throw new DpapiAclApplyError('ACL_READ_FAILED');
    }
    const descriptor = parseDpapiAclResponse(outcome.stdout);
    if (descriptor === null) {
      throw new DpapiAclApplyError('ACL_READ_FAILED');
    }
    return descriptor;
  };

  return async (targetPath: string, kind: DpapiAclTargetKind): Promise<DpapiAclApplyResult> => {
    const before = await readDescriptor(targetPath);
    const currentUserSid =
      options.currentUserSid !== undefined ? options.currentUserSid : before.currentUserSid;

    const beforeEvaluation = evaluateOwnerOnlyAcl(before, { kind, currentUserSid });
    if (beforeEvaluation.ok) {
      return { changed: false, verified: true };
    }

    const applied = await runner({ operation: 'apply-acl', payload: { path: targetPath, kind } });
    if (applied.kind !== 'ok') {
      throw new DpapiAclApplyError('ACL_APPLY_FAILED');
    }
    let appliedResponse: unknown;
    try {
      appliedResponse = JSON.parse(applied.stdout);
    } catch {
      throw new DpapiAclApplyError('ACL_APPLY_FAILED');
    }
    if (
      !appliedResponse ||
      typeof appliedResponse !== 'object' ||
      (appliedResponse as { ok?: unknown }).ok !== true
    ) {
      throw new DpapiAclApplyError('ACL_APPLY_FAILED');
    }

    const after = await readDescriptor(targetPath);
    const afterSid = options.currentUserSid !== undefined ? options.currentUserSid : after.currentUserSid;
    const afterEvaluation = evaluateOwnerOnlyAcl(after, { kind, currentUserSid: afterSid });
    if (!afterEvaluation.ok) {
      throw new DpapiAclApplyError('ACL_VERIFY_FAILED', afterEvaluation.defect);
    }

    return { changed: true, verified: true };
  };
}

/**
 * Container factory for the carrier write primitive:
 *
 * ```ts
 * const acl = createWindowsDpapiAclContainer();
 * await writeDpapiCarrierAtomically({ carrierDirectory, role, envelope, applyOwnerOnlyAcl: acl.apply });
 * ```
 *
 * W-04's provisioning utility composes this; the acceptance harness composes the same object, so
 * the Windows run and the product share one access-control implementation.
 */
export function createWindowsDpapiAclContainer(
  options: WindowsDpapiAclApplierOptions = {}
): { readonly apply: DpapiAclApplier } {
  return { apply: createWindowsDpapiAclApplier(options) };
}
