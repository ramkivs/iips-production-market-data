/**
 * CAP-02 — Gate A′ successor read-only validation.
 *
 * This module is deliberately independent of the IPC/startup composition. It
 * opens a supplied store read-only, checks the current migration ledger and
 * binding/audit invariants, and returns a bounded report. It never applies a
 * migration and never issues INSERT, UPDATE, DELETE or BEGIN IMMEDIATE.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import type { Migration } from './migration_ledger.js';
import { migrationChecksum, readLedger } from './migration_ledger.js';
import { migration001InitialSchema } from './migrations/001_initial_schema.js';
import { migration002AuditEventSequence } from './migrations/002_audit_event_sequence.js';
import { migration003LocalPrincipalBindings } from './migrations/003_local_principal_bindings.js';
import { migration004PortfolioContributionProvenance } from './migrations/004_portfolio_contribution_provenance.js';
import { readAuditEvents, verifyAuditChain } from './audit.js';
import { BindingAbsentError, BindingInvalidError, resolveActiveBindingInCurrentTransaction } from './binding.js';
import { evaluatePortSaveGuard } from './portfolio_store.js';
import { createHash } from 'node:crypto';

export const GATE_A_PRIME_ACT_ID =
  'IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01';
export const BASIS_COMMIT = '5fc74085ade980846ff4a07b36415b6d49446486';
export const BASIS_TREE = '7226ef0033b3a7049169d8fcf9bcbc9908e2590b';

/**
 * The three identity values for the single local principal of this personal,
 * local, single-user IPD application.
 *
 * Source of authority: Program Authority determination
 * `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`
 * (`evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`),
 * rendered under §4 of the effective Gate A′ successor provisioning act
 * `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`.
 *
 * The values are PA-designated IPD-owned strings for this local environment.
 * They are not derived from a host, Windows account, SID, e-mail, machine id,
 * credential, portfolio identifier, fixture or any other identity domain, and
 * none is copied from IRR (`owner-7f3a91c2` / `irr-domain-4b82d6e1`), from the
 * offline provenance marker `IIPS_OFFLINE_BOOTSTRAP`, or from the spent
 * 2026-10-16 Gate A execution. Changing any of them requires a new Program
 * Authority determination and a new commit.
 *
 * The `string | null` type is deliberate: the null guard in the entrypoint
 * stays meaningful, so a partially-populated triple still fails closed with
 * `IDENTITY_VALUES_UNRESOLVED` before any database connection is opened.
 */
export const PRINCIPAL_LABEL: string | null = 'ramki-personal-local';
export const TENANT_ID: string | null = 'ipd-personal-local';
export const CANONICAL_OWNER_ID: string | null = 'ipd-owner-ramki-personal';

/** Migration blob identities fixed by the successor act's §2.1. */
export const DESIGNATED_MIGRATION_BLOBS = Object.freeze({
  '001_initial_schema': 'f594a18264c45ccdcbfa2381592820a72d3c453b',
  '002_audit_event_sequence': '932af8e603c4be41c9f0d8a6b051f41836c1fee8',
  '003_local_principal_bindings': '32b125bf962bb76a6ae59d3b262203dbbb988197',
  '004_portfolio_contribution_provenance': '6bad5a5095b6bb94ce91a86a4b65f7ab915c516c',
});

/** Kept local to the act rather than importing the IPC/startup module. */
export const GATE3_MIGRATIONS: readonly Migration[] = [
  migration001InitialSchema,
  migration002AuditEventSequence,
  migration003LocalPrincipalBindings,
  migration004PortfolioContributionProvenance,
];

export interface GateAPrimeValidationInput {
  readonly principalLabel?: string;
  readonly tenantId?: string;
  readonly canonicalOwnerId?: string;
}

export interface GateAPrimeCheck {
  readonly id: string;
  readonly ok: boolean;
  readonly detail: string;
}

export interface GateAPrimeValidationReport {
  readonly actId: string;
  readonly storePath: string;
  readonly readOnly: true;
  readonly status: 'PASS' | 'FAIL';
  readonly checks: readonly GateAPrimeCheck[];
  readonly bindings: number;
  readonly memberships: number;
  readonly auditEvents: number;
}

export class GateAPrimeStoreError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'GateAPrimeStoreError';
  }
}

interface BindingRow {
  binding_id: string;
  principal_label: string;
  status: string;
  revoked_at: string | null;
}

interface MembershipRow {
  membership_id: string;
  binding_id: string;
  tenant_id: string;
  canonical_owner_id: string;
  status: string;
  revoked_at: string | null;
}

function bindingIdFor(principalLabel: string): string {
  return createHash('sha256').update(`binding:${principalLabel}`, 'utf8').digest('hex').slice(0, 32);
}

function membershipIdFor(tenantId: string, canonicalOwnerId: string): string {
  return createHash('sha256')
    .update(`membership:${tenantId}:${canonicalOwnerId}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
}

export { bindingIdFor, membershipIdFor };

function check(id: string, ok: boolean, detail: string): GateAPrimeCheck {
  return { id, ok, detail };
}

function expectedValue(value: string | undefined, compiled: string | null): string | undefined {
  return value ?? compiled ?? undefined;
}

function readRows(db: DatabaseSync): { bindings: BindingRow[]; memberships: MembershipRow[] } {
  return {
    bindings: db
      .prepare(
        'SELECT binding_id, principal_label, status, revoked_at FROM local_principal_bindings ORDER BY binding_id',
      )
      .all() as unknown as BindingRow[],
    memberships: db
      .prepare(
        `SELECT membership_id, binding_id, tenant_id, canonical_owner_id, status, revoked_at
           FROM local_principal_memberships ORDER BY membership_id`,
      )
      .all() as unknown as MembershipRow[],
  };
}

function countRows(db: DatabaseSync, table: string): number {
  // The table names are fixed at the call sites; no user input reaches this
  // helper. Parameter placeholders cannot be used for SQLite identifiers.
  return Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number | bigint }).n);
}

function validateLedger(db: DatabaseSync): GateAPrimeCheck {
  try {
    const rows = readLedger(db);
    const expected = GATE3_MIGRATIONS.map((migration) => ({
      id: migration.id,
      checksum: migrationChecksum(migration),
    }));
    const idsMatch =
      rows.length === expected.length &&
      rows.every((row, index) => row.migration_id === expected[index].id && row.checksum === expected[index].checksum);
    return check(
      'V-A2-1',
      idsMatch,
      idsMatch
        ? 'migration ledger 001–004 and checksums match the selected basis; schema version 004'
        : 'migration ledger is missing, reordered, unknown or checksum-different',
    );
  } catch (error) {
    return check('V-A2-1', false, `migration ledger unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateReadOnlyResolution(db: DatabaseSync, expected: GateAPrimeValidationInput): GateAPrimeCheck {
  try {
    // A deferred transaction is read-only and is used only because the shared
    // resolver requires the caller to establish transaction ownership. The
    // validator never uses BEGIN IMMEDIATE.
    db.exec('BEGIN;');
    const owner = resolveActiveBindingInCurrentTransaction(db);
    db.exec('COMMIT;');
    const expectedTenant = expectedValue(expected.tenantId, TENANT_ID);
    const expectedOwner = expectedValue(expected.canonicalOwnerId, CANONICAL_OWNER_ID);
    const ok =
      (expectedTenant === undefined || owner.tenantId === expectedTenant) &&
      (expectedOwner === undefined || owner.canonicalOwnerId === expectedOwner);
    return check(
      'V-A2-6',
      ok,
      ok ? 'resolveActiveBinding returned the single expected active context' : 'active binding resolved to an unexpected owner context',
    );
  } catch (error) {
    if (db.isTransaction) {
      try {
        db.exec('ROLLBACK;');
      } catch {
        // The report remains the bounded failure; cleanup is best effort only.
      }
    }
    const detail =
      error instanceof BindingAbsentError || error instanceof BindingInvalidError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
    return check('V-A2-6', false, `active binding resolution failed: ${detail}`);
  }
}

function validateDatabase(db: DatabaseSync, storePath: string, input: GateAPrimeValidationInput): GateAPrimeValidationReport {
  const checks: GateAPrimeCheck[] = [];
  let bindings: BindingRow[] = [];
  let memberships: MembershipRow[] = [];
  let auditEvents: ReturnType<typeof readAuditEvents> = [];

  try {
    checks.push(validateLedger(db));
    const rows = readRows(db);
    bindings = rows.bindings;
    memberships = rows.memberships;

    const principal = expectedValue(input.principalLabel, PRINCIPAL_LABEL);
    const tenantId = expectedValue(input.tenantId, TENANT_ID);
    const canonicalOwnerId = expectedValue(input.canonicalOwnerId, CANONICAL_OWNER_ID);
    const activeBindings = bindings.filter((row) => row.status === 'ACTIVE');
    const activeMemberships = memberships.filter((row) => row.status === 'ACTIVE');
    const binding = activeBindings.length === 1 ? activeBindings[0] : undefined;
    const membership = activeMemberships.length === 1 ? activeMemberships[0] : undefined;

    const bindingShapeOk =
      principal !== undefined &&
      activeBindings.length === 1 &&
      binding?.revoked_at === null &&
      binding.binding_id === bindingIdFor(principal) &&
      binding.principal_label === principal;
    checks.push(
      check(
        'V-A2-2',
        bindingShapeOk,
        principal === undefined
          ? 'principal value is unresolved; no expected deterministic binding id exists'
          : bindingShapeOk
            ? 'exactly one ACTIVE binding with the deterministic id and no revocation'
            : 'binding cardinality, status, revocation, id or principal label is invalid',
      ),
    );

    const membershipShapeOk =
      tenantId !== undefined &&
      canonicalOwnerId !== undefined &&
      activeMemberships.length === 1 &&
      membership?.revoked_at === null &&
      membership.membership_id === membershipIdFor(tenantId, canonicalOwnerId) &&
      membership.binding_id === binding?.binding_id &&
      membership.tenant_id === tenantId &&
      membership.canonical_owner_id === canonicalOwnerId;
    checks.push(
      check(
        'V-A2-3',
        membershipShapeOk,
        tenantId === undefined || canonicalOwnerId === undefined
          ? 'owner-context values are unresolved; no expected membership identity exists'
          : membershipShapeOk
            ? 'exactly one ACTIVE membership is attached to the binding and matches the named owner context'
            : 'membership cardinality, status, attachment or owner context is invalid',
      ),
    );

    const portfolioCounts = {
      portfolios: countRows(db, 'portfolios'),
      revisions: countRows(db, 'portfolio_revisions'),
      holdings: countRows(db, 'portfolio_holdings'),
      contributions: countRows(db, 'portfolio_contributions'),
    };
    const noOtherRows = Object.values(portfolioCounts).every((value) => value === 0);
    checks.push(
      check(
        'V-A2-4',
        noOtherRows,
        noOtherRows
          ? 'portfolio, revision, holding and contribution tables contain zero rows'
          : `unexpected portfolio-table rows: ${JSON.stringify(portfolioCounts)}`,
      ),
    );

    auditEvents = readAuditEvents(db);
    const audit = auditEvents[0];
    const auditDetail = audit?.detail as { tenantId?: unknown; canonicalOwnerId?: unknown } | undefined;
    const auditOk =
      auditEvents.length === 1 &&
      audit?.eventType === 'local_principal_binding.provisioned' &&
      audit.subjectType === 'local_principal_binding' &&
      principal !== undefined &&
      audit.subjectId === principal &&
      tenantId !== undefined &&
      canonicalOwnerId !== undefined &&
      auditDetail?.tenantId === tenantId &&
      auditDetail?.canonicalOwnerId === canonicalOwnerId &&
      verifyAuditChain(db);
    checks.push(
      check(
        'V-A2-5',
        auditOk,
        auditOk
          ? 'one provisioned audit event exists and the local hash chain verifies'
          : 'audit cardinality, event shape, owner detail or hash chain is invalid',
      ),
    );

    checks.push(validateReadOnlyResolution(db, input));

    const guard = evaluatePortSaveGuard();
    const refusalPreserved = !guard.authorized && guard.reasons.includes('W-1(3): Gate 4 qualification not accepted');
    checks.push(
      check(
        'V-A2-7',
        refusalPreserved,
        refusalPreserved
          ? 'the shipped portfolio save guard remains hard-false with WRITE_NOT_AUTHORIZED prerequisites'
          : 'the shipped portfolio save guard did not remain hard-false',
      ),
    );

    const consumedShape = bindings.length > 0 || memberships.length > 0;
    checks.push(
      check(
        'V-A2-8',
        consumedShape && bindings.length <= 1 && memberships.length <= 1,
        consumedShape
          ? 'a pre-existing binding or membership makes a second invocation refuse without repair'
          : 'no provisioned rows exist, so single-use consumption has not been demonstrated',
      ),
    );
  } catch (error) {
    checks.push(
      check(
        'STORE_SCHEMA',
        false,
        `store schema could not be inspected: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }

  return {
    actId: GATE_A_PRIME_ACT_ID,
    storePath,
    readOnly: true,
    status: checks.every((item) => item.ok) ? 'PASS' : 'FAIL',
    checks,
    bindings: bindings.length,
    memberships: memberships.length,
    auditEvents: auditEvents.length,
  };
}

/**
 * Opens an existing SQLite file with the readOnly flag and returns its V-A2
 * report. A missing or non-file path is a refusal, not an empty fixture.
 */
export function validateStoreAtPath(storePath: string, input: GateAPrimeValidationInput = {}): GateAPrimeValidationReport {
  if (!isAbsolute(storePath) || storePath.trim().length === 0) {
    throw new GateAPrimeStoreError('STORE_PATH_INVALID', 'the validation store path must be absolute');
  }
  if (!existsSync(storePath) || !statSync(storePath).isFile()) {
    throw new GateAPrimeStoreError('STORE_NOT_FOUND', 'the validation store file does not exist');
  }

  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(storePath, { readOnly: true });
    return validateDatabase(db, storePath, input);
  } catch (error) {
    if (error instanceof GateAPrimeStoreError) throw error;
    throw new GateAPrimeStoreError(
      'STORE_NOT_READABLE',
      `the validation store could not be opened read-only: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    db?.close();
  }
}

/** Read-only duplicate classification used by T-5 without opening a write path. */
export function existingStoreHasProvisioningRows(storePath: string): boolean {
  if (!existsSync(storePath) || !statSync(storePath).isFile()) return false;
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(storePath, { readOnly: true });
    const rows = readRows(db);
    return rows.bindings.length > 0 || rows.memberships.length > 0;
  } catch {
    return false;
  } finally {
    db?.close();
  }
}
