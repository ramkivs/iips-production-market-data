/**
 * Gate 3 — Gate A′ local-principal provisioning, library-only.
 *
 * Gate A′ is APPROVED / NOT EXECUTED. This module therefore exposes no
 * executable entrypoint to the rest of the program: every mutating function
 * requires a GateAPrimeAuthorization carrying a module-private symbol brand
 * that no in-repository code can mint (a structural object literal cannot
 * supply a symbol-keyed property it cannot name). The pure statement builder
 * and the read-only inspector stay executable so the included code remains
 * testable without opening a provisioning path.
 *
 * No IPC or startup module imports this file (static regression in
 * g3_startup_validation): provisioning is unreachable from every IPC op.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { appendAuditEvent } from './audit.js';
import { inspectBindings } from './binding.js';

export class ProvisioningNotAuthorizedError extends Error {
  constructor(message = 'Gate A′ provisioning is not authorized in this build') {
    super(message);
    this.name = 'ProvisioningNotAuthorizedError';
  }
}

const GATE_A_PRIME_BRAND: unique symbol = Symbol('gate-a-prime-authorization');

export interface GateAPrimeAuthorization {
  readonly issuedAt: string;
  readonly act: 'gate-a-prime';
  readonly [GATE_A_PRIME_BRAND]: true;
}

export interface ProvisionBindingInput {
  readonly principalLabel: string;
  readonly tenantId: string;
  readonly canonicalOwnerId: string;
}

export interface ProvisionStatements {
  readonly bindingSql: string;
  readonly membershipSql: string;
}

function isAuthorized(auth: unknown): auth is GateAPrimeAuthorization {
  return (
    typeof auth === 'object' &&
    auth !== null &&
    (auth as GateAPrimeAuthorization).act === 'gate-a-prime' &&
    (auth as GateAPrimeAuthorization)[GATE_A_PRIME_BRAND] === true
  );
}

/**
 * Pure, side-effect-free SQL builder. Executable without authorization: it
 * returns text and touches no database.
 */
export function buildBindingProvisionStatements(input: ProvisionBindingInput): ProvisionStatements {
  const bindingId = createHash('sha256').update(`binding:${input.principalLabel}`, 'utf8').digest('hex').slice(0, 32);
  const membershipId = createHash('sha256')
    .update(`membership:${input.tenantId}:${input.canonicalOwnerId}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
  return {
    bindingSql:
      'INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) ' +
      `VALUES ('${bindingId}', '${input.principalLabel}', 'ACTIVE', ?, ?, NULL)`,
    membershipSql:
      'INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) ' +
      `VALUES ('${membershipId}', '${bindingId}', '${input.tenantId}', '${input.canonicalOwnerId}', 'ACTIVE', ?, ?, NULL)`,
  };
}

export { inspectBindings };

/**
 * The single mutating entrypoint. Refuses before any SQL when the
 * authorization is missing or forged; a successful call writes the binding
 * and membership plus an audit line in one transaction.
 */
export function provisionActiveBinding(
  db: DatabaseSync,
  auth: unknown,
  input: ProvisionBindingInput,
): { bindingId: string; membershipId: string } {
  if (!isAuthorized(auth)) {
    throw new ProvisioningNotAuthorizedError();
  }
  const statements = buildBindingProvisionStatements(input);
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(statements.bindingSql).run(now, now);
    db.prepare(statements.membershipSql).run(now, now);
    appendAuditEvent(db, {
      eventType: 'local_principal_binding.provisioned',
      subjectType: 'local_principal_binding',
      subjectId: input.principalLabel,
      detail: { tenantId: input.tenantId, canonicalOwnerId: input.canonicalOwnerId },
    });
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
  const bindingId = createHash('sha256').update(`binding:${input.principalLabel}`, 'utf8').digest('hex').slice(0, 32);
  const membershipId = createHash('sha256')
    .update(`membership:${input.tenantId}:${input.canonicalOwnerId}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
  return { bindingId, membershipId };
}
