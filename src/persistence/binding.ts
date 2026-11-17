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

/**
 * D02 — relationship-absent error for the prospective S1-to-D02 ownership
 * relationship. Thrown when the explicit ownership relationship required for
 * D02 portfolio access does not exist, is not ACTIVE, or cannot be resolved.
 * This preserves fail-closed behavior: no relationship row means no D02
 * access, and nothing about the missing relationship is disclosed.
 *
 * No relationship table or owner-registry table exists in the current schema.
 * This function always fails closed until separately authorized schema and
 * provisioning create them. It does not create, insert, or modify any rows.
 */
export class D02RelationshipAbsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'D02RelationshipAbsentError';
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
 * D02 — distinct portfolio-owner access context resolved through the explicit
 * S1-to-D02 ownership relationship. The membership owner (`membershipOwnerId`,
 * the S1 canonical owner) and the portfolio owner (`portfolioOwnerId`, the
 * D02 overall owner) are kept strictly distinct; neither is derived from the
 * other and neither can be supplied by a caller.
 *
 * This interface describes the resolved context only. No relationship row is
 * created by resolving it; resolution fails closed when no ACTIVE
 * relationship exists.
 */
export interface ResolvedD02PortfolioAccess {
  readonly principalLabel: string;
  readonly bindingId: string;
  readonly membershipId: string;
  readonly membershipOwnerId: string; // remains ipd-owner-ramki-personal (S1)
  readonly tenantId: string;          // ipd-personal-local
  readonly relationshipId: string;
  readonly portfolioOwnerId: string;  // owner-4dc756b3 (D02)
}

/**
 * Approved S1 identity values (architecture decision, D01–D02). These are
 * validated at resolution time against the live binding/membership rows; they
 * are never accepted from a caller or request.
 */
const D02_S1_PRINCIPAL_LABEL = 'ramki-personal-local';
const D02_S1_BINDING_ID = 'c5808abaffd072d6401ce63ad86c6ac0';
const D02_S1_MEMBERSHIP_ID = 'd25dcc5370100b00766efc5166f65cf3';
const D02_S1_MEMBERSHIP_OWNER = 'ipd-owner-ramki-personal';
const D02_S1_TENANT_ID = 'ipd-personal-local';
const D02_PORTFOLIO_OWNER_ID = 'owner-4dc756b3';
const D02_RELATIONSHIP_TYPE = 'OVERALL_PERSONAL_PORTFOLIO_OWNER';

interface RelationshipRow {
  relationship_id: string;
  membership_id: string;
  membership_tenant_id: string;
  owner_tenant_id: string;
  portfolio_owner_id: string;
  relationship_type: string;
  status: string;
}

interface OwnerRegistryRow {
  tenant_id: string;
  portfolio_owner_id: string;
  owner_kind: string;
  status: string;
}

/**
 * D02 — resolve the explicit S1-to-D02 ownership relationship and return a
 * distinct D02 portfolio-owner access context. Fails closed on any missing,
 * multiple, revoked, mismatched or cross-tenant relationship, or on an
 * inactive owner-registry row.
 *
 * This function opens its own `BEGIN IMMEDIATE` transaction, identical to
 * `resolveActiveBinding`. It does not create, insert, update or delete any
 * relationship, owner-registry, or portfolio row. If the relationship or
 * owner-registry tables do not exist (current schema), the SQL error is
 * caught and rethrown as `D02RelationshipAbsentError`, preserving fail-closed
 * behavior.
 */
export function resolveD02PortfolioAccess(db: DatabaseSync): ResolvedD02PortfolioAccess {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const access = resolveD02PortfolioAccessInCurrentTransaction(db);
    db.exec('COMMIT;');
    return access;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * D02 — resolve the explicit S1-to-D02 ownership relationship inside a
 * caller-held `BEGIN IMMEDIATE` transaction. The caller must already hold the
 * transaction on this same connection, which serializes this check with
 * revocation and the caller's protected writes.
 */
export function resolveD02PortfolioAccessInCurrentTransaction(
  db: DatabaseSync,
): ResolvedD02PortfolioAccess {
  if (!db.isTransaction) {
    throw new Error('resolveD02PortfolioAccessInCurrentTransaction requires an active transaction');
  }

  // Step 1: resolve the sole ACTIVE S1 binding and membership (existing check).
  const s1 = resolveActiveBindingInCurrentTransaction(db);

  // Step 2: validate the exact approved S1 tuple against the live rows.
  // A superseding S1 identity would require a separately reviewed contract.
  if (s1.bindingId !== D02_S1_BINDING_ID) {
    throw new D02RelationshipAbsentError('the ACTIVE binding is not the approved S1 binding');
  }
  if (s1.principalLabel !== D02_S1_PRINCIPAL_LABEL) {
    throw new D02RelationshipAbsentError('the ACTIVE binding principal does not match the approved S1 principal');
  }
  if (s1.membershipId !== D02_S1_MEMBERSHIP_ID) {
    throw new D02RelationshipAbsentError('the ACTIVE membership is not the approved S1 membership');
  }
  if (s1.tenantId !== D02_S1_TENANT_ID) {
    throw new D02RelationshipAbsentError('the ACTIVE membership tenant does not match the approved S1 tenant');
  }
  if (s1.canonicalOwnerId !== D02_S1_MEMBERSHIP_OWNER) {
    throw new D02RelationshipAbsentError('the ACTIVE membership owner does not match the approved S1 owner');
  }

  // Step 3: select exactly one ACTIVE relationship for this membership.
  let relationships: RelationshipRow[];
  try {
    relationships = db
      .prepare(
        `SELECT relationship_id, membership_id, membership_tenant_id, owner_tenant_id,
                  portfolio_owner_id, relationship_type, status
           FROM personal_identity_owner_relationships
           WHERE membership_id = ? AND membership_tenant_id = ? AND status = 'ACTIVE'`,
      )
      .all(s1.membershipId, s1.tenantId) as unknown as RelationshipRow[];
  } catch (error) {
    throw new D02RelationshipAbsentError('the D02 ownership relationship is not provisioned');
  }
  if (relationships.length === 0) {
    throw new D02RelationshipAbsentError('no ACTIVE D02 ownership relationship exists for this membership');
  }
  if (relationships.length > 1) {
    throw new D02RelationshipAbsentError('more than one ACTIVE D02 ownership relationship exists');
  }
  const rel = relationships[0];
  if (rel.relationship_type !== D02_RELATIONSHIP_TYPE) {
    throw new D02RelationshipAbsentError('the ACTIVE relationship is not an overall personal portfolio owner link');
  }

  // Step 4: validate the owner-registry row is ACTIVE and matches the D02 owner.
  let owners: OwnerRegistryRow[];
  try {
    owners = db
      .prepare(
        `SELECT tenant_id, portfolio_owner_id, owner_kind, status
           FROM portfolio_owner_registry
           WHERE tenant_id = ? AND portfolio_owner_id = ? AND status = 'ACTIVE'`,
      )
      .all(rel.owner_tenant_id, rel.portfolio_owner_id) as unknown as OwnerRegistryRow[];
  } catch (error) {
    throw new D02RelationshipAbsentError('the D02 owner registry is not provisioned');
  }
  if (owners.length === 0) {
    throw new D02RelationshipAbsentError('no ACTIVE D02 owner registry entry exists');
  }
  if (owners.length > 1) {
    throw new D02RelationshipAbsentError('more than one ACTIVE D02 owner registry entry exists');
  }
  const owner = owners[0];
  if (owner.portfolio_owner_id !== D02_PORTFOLIO_OWNER_ID) {
    throw new D02RelationshipAbsentError('the D02 owner registry entry does not name the approved portfolio owner');
  }
  if (owner.tenant_id !== D02_S1_TENANT_ID) {
    throw new D02RelationshipAbsentError('the D02 owner registry tenant does not match the approved S1 tenant');
  }

  return {
    principalLabel: s1.principalLabel,
    bindingId: s1.bindingId,
    membershipId: s1.membershipId,
    membershipOwnerId: s1.canonicalOwnerId,
    tenantId: s1.tenantId,
    relationshipId: rel.relationship_id,
    portfolioOwnerId: owner.portfolio_owner_id,
  };
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
