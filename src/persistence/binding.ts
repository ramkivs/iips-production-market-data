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
  return resolveInsideTransaction(db);
}

function resolveInsideTransaction(db: DatabaseSync): ActiveOwner {
  try {
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
    const owner: ActiveOwner = {
      bindingId: binding.binding_id,
      principalLabel: binding.principal_label,
      membershipId: membership.membership_id,
      tenantId: membership.tenant_id,
      canonicalOwnerId: membership.canonical_owner_id,
    };
    db.exec('COMMIT;');
    return owner;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
