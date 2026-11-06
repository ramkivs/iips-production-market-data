/**
 * Gate 3 — per-request local principal binding resolution (W-3).
 *
 * The active owner is resolved afresh from the database on every request: there
 * is no cache and no process-global owner. A revoked binding therefore takes
 * effect on the next request. Both the binding and its membership must be
 * ACTIVE at the instant of resolution; any other shape fails closed.
 */
import type { DatabaseSync } from 'node:sqlite';

export class BindingAbsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BindingAbsentError';
  }
}

export class BindingInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BindingInvalidError';
  }
}

export interface ActiveOwner {
  readonly bindingId: string;
  readonly principalLabel: string;
  readonly membershipId: string;
  readonly tenantId: string;
  readonly canonicalOwnerId: string;
}

/**
 * D02 — prospective canonical-owner extension to the holdings domain
 * (`IIPS-V3-G2-HOLDINGS-OWNER-BINDING-2026-11-06-01`, effective 2026-11-06).
 *
 * The holdings snapshot domain recognizes exactly one prospectively extended
 * canonical owner (`owner-4dc756b3`) on the retained technical IPD tenant
 * (`ipd-personal-local`). SAIRAM is display-only and is never authority; the
 * IRR evidence tenant/carrier is not holdings authority. These constants grant
 * no provisioning, migration, reassignment or operational authority: binding
 * rows are resolved as stored, and any binding/membership that is not this
 * exact pair fails closed. No existing data is reassigned.
 */
export const HOLDINGS_CANONICAL_OWNER_ID = 'owner-4dc756b3';
export const HOLDINGS_TENANT_ID = 'ipd-personal-local';

interface BindingRow {
  binding_id: string;
  principal_label: string;
  status: string;
}

interface MembershipRow {
  membership_id: string;
  binding_id: string;
  tenant_id: string;
  canonical_owner_id: string;
  status: string;
}

/** Read-only inspection used by the provisioning/startup tests. */
export function inspectBindings(db: DatabaseSync): {
  bindings: BindingRow[];
  memberships: MembershipRow[];
} {
  return {
    bindings: db
      .prepare('SELECT binding_id, principal_label, status FROM local_principal_bindings ORDER BY binding_id')
      .all() as unknown as BindingRow[],
    memberships: db
      .prepare(
        'SELECT membership_id, binding_id, tenant_id, canonical_owner_id, status FROM local_principal_memberships ORDER BY membership_id',
      )
      .all() as unknown as MembershipRow[],
  };
}

/**
 * Resolves the single ACTIVE binding and its single ACTIVE membership. Runs as
 * a read inside an immediate transaction so a concurrent revocation cannot
 * change the rows mid-resolution; the same predicate is what a write
 * transaction re-validates before any mutation (W-3).
 */
export function resolveActiveBinding(db: DatabaseSync): ActiveOwner {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const owner = resolveActiveBindingInCurrentTransaction(db);
    db.exec('COMMIT;');
    return owner;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Resolves the active owner without taking transaction ownership. The caller
 * must already hold BEGIN IMMEDIATE on this same connection, which serializes
 * this check with revocation and the caller's protected writes.
 */
export function resolveActiveBindingInCurrentTransaction(db: DatabaseSync): ActiveOwner {
  if (!db.isTransaction) {
    throw new Error('resolveActiveBindingInCurrentTransaction requires an active transaction');
  }
  const bindings = db
    .prepare("SELECT binding_id, principal_label, status FROM local_principal_bindings WHERE status = 'ACTIVE'")
    .all() as unknown as BindingRow[];
  if (bindings.length === 0) {
    throw new BindingAbsentError('no ACTIVE local principal binding is registered');
  }
  if (bindings.length > 1) {
    throw new BindingInvalidError('more than one ACTIVE local principal binding exists');
  }
  const binding = bindings[0];

  const memberships = db
    .prepare(
      "SELECT membership_id, binding_id, tenant_id, canonical_owner_id, status FROM local_principal_memberships WHERE status = 'ACTIVE'",
    )
    .all() as unknown as MembershipRow[];
  if (memberships.length === 0) {
    throw new BindingAbsentError('the ACTIVE binding has no ACTIVE membership');
  }
  if (memberships.length > 1) {
    throw new BindingInvalidError('more than one ACTIVE membership exists');
  }
  const membership = memberships[0];
  if (membership.binding_id !== binding.binding_id) {
    throw new BindingInvalidError('the ACTIVE membership is not attached to the ACTIVE binding');
  }
  return {
    bindingId: binding.binding_id,
    principalLabel: binding.principal_label,
    membershipId: membership.membership_id,
    tenantId: membership.tenant_id,
    canonicalOwnerId: membership.canonical_owner_id,
  };
}

function assertHoldingsOwner(owner: ActiveOwner): ActiveOwner {
  // Prospective holdings authority is the exact D02 pair; anything else —
  // including a well-formed binding for a different canonical owner or tenant,
  // or the pre-extension S1 owner — fails closed with the same typed error a
  // malformed binding produces. Nothing about the binding is disclosed.
  if (owner.canonicalOwnerId !== HOLDINGS_CANONICAL_OWNER_ID || owner.tenantId !== HOLDINGS_TENANT_ID) {
    throw new BindingInvalidError('the ACTIVE binding is not the authorized holdings owner binding');
  }
  return owner;
}

/**
 * D02 holdings-domain resolution. Identical to {@link resolveActiveBinding}
 * (fresh resolution per call, no cache, BEGIN IMMEDIATE serialization) with
 * the additional prospective-ownership requirement: the sole ACTIVE
 * binding/membership must be the canonical holdings owner on the retained
 * technical tenant. Any other shape — absent, multiple, malformed, revoked or
 * non-holdings owner — throws BindingAbsentError/BindingInvalidError and the
 * caller fails closed.
 */
export function resolveActiveHoldingsBinding(db: DatabaseSync): ActiveOwner {
  return assertHoldingsOwner(resolveActiveBinding(db));
}

/**
 * D02 holdings-domain resolution inside a caller-held BEGIN IMMEDIATE.
 * The caller must already hold the transaction on this same connection, which
 * serializes this check with revocation and the protected mutation writes
 * (revocation committed first wins; no cache, no default, no rebinding).
 */
export function resolveActiveHoldingsBindingInCurrentTransaction(db: DatabaseSync): ActiveOwner {
  return assertHoldingsOwner(resolveActiveBindingInCurrentTransaction(db));
}
