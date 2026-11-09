/**
 * Explicit local single-user write authorization — the broker-observed holdings
 * extension of the `IIPS_LOCAL_PERSONAL_USE=1` personal path.
 *
 * AUTHORITY
 *   Program Authority standing decision, 2026-11-09: the local personal-use
 *   carve-out (implemented 2026-11-08 for the four v1 manual write operations)
 *   is extended to broker-observed holdings for this local, non-production,
 *   single-user application owned by its operator, under the PERSONAL
 *   APPLICATION PRINCIPAL. The decision requires an EXPLICIT local single-user
 *   authorization path — not a weakening or silent removal of Gate E W-1
 *   conditions (3) and (4) for any other caller or execution context.
 *
 * WHAT THIS MODULE AUTHORIZES
 *   Nothing by itself. It resolves and validates the *identity* half of the
 *   W-1 personal carve-out — the local principal, its membership binding and
 *   the authorization scope — and hands the result to
 *   `evaluatePortSaveGuard` as an explicit `AuthorizationContext`. The guard
 *   still decides. Two independent conditions must both hold:
 *
 *     1. `IIPS_LOCAL_PERSONAL_USE=1` in the SERVER process environment, read
 *        here from the caller-supplied env only — never from a request frame,
 *        a request payload, a header or a flag file; and
 *     2. an ACTIVE local principal binding whose single ACTIVE membership
 *        resolves to exactly the canonical owner and tenant the write targets.
 *
 *   Either alone is insufficient. An env switch with no binding is denied; a
 *   binding with the switch absent is denied; a binding for a *different*
 *   principal than the write targets is denied. Nothing here converts a
 *   refusal into an authorization, and no environment variable other than the
 *   pinned switch is consulted.
 *
 * WHAT IT DOES NOT AUTHORIZE, AND NEVER TOUCHES
 *   - Gate 4 (qualification) and Gate 5 (admission) remain NOT MET on the
 *     governed path. This module is never consulted on a governed write: it is
 *     only reached from the explicitly authorized local single-user
 *     composition, and `evaluatePortSaveGuard()` with no context stays
 *     hard-deny for every pre-existing caller.
 *   - Identity qualification is not bypassed. Unresolved or ambiguous
 *     broker-observed identities still refuse the whole import before any
 *     transaction (Gate E W-6 / DP-2 2F) — this module authorizes the *write*,
 *     never the *identity*.
 *   - Transaction atomicity, the audit chain, revision history, the W-8/BI-08
 *     idempotency rule and owner isolation are unchanged; the store keeps
 *     re-validating the ACTIVE binding inside its own `BEGIN IMMEDIATE`
 *     transaction and still fails closed with `ResourceUnavailableError`.
 *   - No production, hosted, multi-user or institutional capability is
 *     created, and none is claimed.
 */
import type { DatabaseSync } from 'node:sqlite';
import {
  BindingAbsentError,
  BindingInvalidError,
  resolveActiveBinding,
  resolveActiveBindingInCurrentTransaction,
  type ActiveOwner,
} from './binding.js';
import { isLocalPersonalUseEnabled } from '../ipc/localPersonalUse.js';
import { evaluatePortSaveGuard, type AuthorizationContext } from './portfolio_store.js';

/**
 * The closed set of write surfaces the local single-user carve-out covers.
 * Kept as a literal union so a new surface cannot be admitted by accident: it
 * has to be named here, and therefore also in the documentation and tests.
 *
 *   - `MANUAL_PERSONAL_PORTFOLIO` — the four v1 manual write operations
 *     (`portfolio.create` / `save` / `reset` / `delete`), implemented
 *     2026-11-08.
 *   - `BROKER_OBSERVED_IMPORT` — the durable broker-import write path,
 *     authorized by the 2026-11-09 decision.
 */
export type LocalAuthorizationScope = 'MANUAL_PERSONAL_PORTFOLIO' | 'BROKER_OBSERVED_IMPORT';

/** The authorization decision, with the reasons the guard recorded. */
export interface LocalWriteAuthorization {
  /** True only when the guard authorized with a validated principal + binding. */
  readonly authorized: boolean;
  /** Why — exactly the guard's reason list, never a synthesized message. */
  readonly reasons: readonly string[];
  /** The validated local principal binding, when one resolved. */
  readonly owner: ActiveOwner | null;
  /** The scope this evaluation was made for. */
  readonly scope: LocalAuthorizationScope;
}

/**
 * Resolves the ACTIVE local principal binding read-only. Returns `null` rather
 * than throwing: the caller's guard decides, and the refusal it produces is
 * the same typed `WriteNotAuthorizedError` the historical path produces, so no
 * binding detail is disclosed through this function.
 *
 * When a transaction is already open on this connection the in-transaction
 * resolution is used. That is the same predicate and the same fail-closed
 * errors, but it neither nests `BEGIN IMMEDIATE` (which SQLite refuses) nor
 * re-serializes: the enclosing transaction already holds the write lock, so
 * the binding read is atomic with the write it authorizes.
 */
export function resolveLocalPrincipal(db: DatabaseSync): ActiveOwner | null {
  try {
    return db.isTransaction
      ? resolveActiveBindingInCurrentTransaction(db)
      : resolveActiveBinding(db);
  } catch (error) {
    if (error instanceof BindingAbsentError || error instanceof BindingInvalidError) return null;
    throw error;
  }
}

/**
 * Builds the explicit `AuthorizationContext` for one local single-user write.
 *
 * The binding is resolved from the database here (not taken from the caller's
 * `owner` argument) and is then compared against the owner the write actually
 * targets. A caller cannot authorize a write by passing an owner: the pair in
 * the context is always the pair the *database* says is active, and a target
 * owner that differs from it is refused before the guard is even consulted.
 *
 * Returns `null` when no authority can be established, in which case the
 * caller must fall back to `evaluatePortSaveGuard()` with NO context — the
 * unmodified governed default-deny response.
 */
export function buildLocalAuthorizationContext(
  db: DatabaseSync,
  env: NodeJS.ProcessEnv,
  targetOwner: { readonly canonicalOwnerId: string; readonly tenantId: string },
): { readonly context: AuthorizationContext; readonly owner: ActiveOwner } | null {
  // Condition 1: the pinned server-side switch. Never request-supplied.
  if (!isLocalPersonalUseEnabled(env)) return null;

  // Condition 2: the validated local principal binding.
  const active = resolveLocalPrincipal(db);
  if (!active) return null;

  // The binding must be the principal the write targets. A well-formed binding
  // for another owner/tenant is not authority for this write.
  if (active.canonicalOwnerId !== targetOwner.canonicalOwnerId) return null;
  if (active.tenantId !== targetOwner.tenantId) return null;

  return { context: { env, canonicalOwnerId: active.canonicalOwnerId, tenantId: active.tenantId }, owner: active };
}

/**
 * Evaluates the local single-user write authorization for one scope.
 *
 * Fails closed at every step: no switch, no binding, a mismatched binding, or
 * a guard that declines all produce `authorized: false` carrying the guard's
 * OWN reasons (never a synthesized message). The scope is returned for the
 * audit record; it does not itself grant anything, so a caller cannot widen its
 * authority by naming a scope.
 *
 * The guard is evaluated exactly once, with the resolved context when one
 * exists — or with NO context, which is the unmodified governed default-deny
 * branch (Gate 4 / Gate 5 not met).
 */
export function evaluateLocalSingleUserWrite(
  db: DatabaseSync,
  env: NodeJS.ProcessEnv,
  targetOwner: { readonly canonicalOwnerId: string; readonly tenantId: string },
  scope: LocalAuthorizationScope,
): LocalWriteAuthorization {
  const resolved = buildLocalAuthorizationContext(db, env, targetOwner);
  const guard = evaluatePortSaveGuard(resolved?.context);
  if (!resolved || !guard.authorized) {
    return { authorized: false, reasons: guard.reasons, owner: null, scope };
  }
  return { authorized: true, reasons: guard.reasons, owner: resolved.owner, scope };
}
