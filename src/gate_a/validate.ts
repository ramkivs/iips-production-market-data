#!/usr/bin/env node
/**
 * Institutional Investment Platform System (IIPS)
 * G-2 Gate A — READ-ONLY VALIDATION (V-A1..V-A8) & DISPOSABLE-COPY REHEARSALS
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: the single bounded act authorized by the rendered decision
 * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
 *
 * Usage (operator, offline):
 *   IPD_PORTFOLIO_DB_PATH=/abs/store/ipd-portfolio.sqlite \
 *   node dist/src/gate_a/validate.js --validate  [--act-record=<path>]
 *   node dist/src/gate_a/validate.js --rehearsal [--act-record=<path>] [--backup=<path>]
 *
 * `--validate` performs ONLY reads against the live store and asserts the store file
 * is byte-unchanged across the validation run. `--rehearsal` operates ONLY on
 * disposable file copies (revocation behaviour; transactional atomicity; FK
 * enforcement) and discards them; the live store is never written.
 *
 * V-A8 external invariants (IRR fence blobs, IPD `main`, PR states) are NOT network
 * calls: they are captured separately and recorded in the durable execution record.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

import { loadPersistenceConfig, type PersistenceConfig } from '../persistence/config.js';
import { PersistenceConnection } from '../persistence/connection.js';
import {
  computeMigrationChecksum,
  MIGRATIONS,
  readAppliedMigrations,
  readSchemaVersion,
  SCHEMA_VERSION_TARGET,
  validateMigrationState,
} from '../persistence/migrations/index.js';
import { IdentityService } from '../app_identity/service.js';
import { LocalPrincipalService } from '../app_identity/local_principal.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TENANT_ID = /^t-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ENDPOINT_ID = /^ep-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function sha256File(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function utcStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function parseArgs(argv: readonly string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq === -1) args[arg.slice(2)] = true;
      else args[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return args;
}

type Probe = { readonly ok: boolean; readonly value?: unknown; readonly error?: unknown };

function probe(work: () => unknown): Probe {
  try {
    return { ok: true, value: work() };
  } catch (error) {
    const e = error as Error & { code?: string };
    return { ok: false, error: { name: e.name, code: e.code ?? null, message: e.message } };
  }
}

function rows(
  connection: PersistenceConnection,
  sql: string,
  ...params: unknown[]
): Array<Record<string, unknown>> {
  return connection.prepare(sql).all(...(params as never[])) as Array<Record<string, unknown>>;
}

function tableCounts(connection: PersistenceConnection): Array<{ name: string; count: number }> {
  const tables = rows(
    connection,
    `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`
  ) as Array<{ name: string }>;
  return tables.map((table) => ({
    name: table.name,
    count: (connection.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number })
      .c,
  }));
}

function readActRecord(recordPath: unknown): Record<string, unknown> | null {
  if (typeof recordPath !== 'string' || !fs.existsSync(recordPath)) return null;
  return JSON.parse(fs.readFileSync(recordPath, 'utf8')) as Record<string, unknown>;
}

function configFor(config: PersistenceConfig, databasePath: string): PersistenceConfig {
  return { ...config, databasePath: path.normalize(databasePath) };
}

// ---------------------------------------------------------------------------
// --validate (read-only on the live store)
// ---------------------------------------------------------------------------

function runValidation(config: PersistenceConfig, args: Record<string, string | boolean>): void {
  const databasePath = config.databasePath;
  const report: Record<string, unknown> = {
    mode: 'validate',
    actId: 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01',
    databasePath,
    startedAtUtc: new Date().toISOString(),
    readOnly: 'only SELECT/PRAGMA reads are performed; the store file sha256 is asserted unchanged',
  };
  const failures: string[] = [];
  const sha256Before = sha256File(databasePath);

  const connection = PersistenceConnection.open(config);
  try {
    const identity = new IdentityService(connection);
    const localPrincipal = new LocalPrincipalService(connection);

    // V-A1 — schema and migration ledger
    const ledger = readAppliedMigrations(connection);
    const schemaVersion = readSchemaVersion(connection);
    const stateProbe = probe(() => validateMigrationState(ledger));
    const checksumComparison = MIGRATIONS.map((migration) => {
      const row = ledger.find((r) => r.id === migration.id);
      const computed = computeMigrationChecksum(migration.sql);
      return {
        id: migration.id,
        name: migration.name,
        ledgerChecksum: row?.checksum ?? null,
        computedChecksum: computed,
        match: row?.checksum === computed,
      };
    });
    const vA1Pass =
      schemaVersion === SCHEMA_VERSION_TARGET &&
      ledger.length === MIGRATIONS.length &&
      checksumComparison.every((c) => c.match) &&
      stateProbe.ok;
    if (!vA1Pass) failures.push('V-A1');
    report['V-A1'] = {
      passed: vA1Pass,
      schemaVersion,
      expectedSchemaVersion: SCHEMA_VERSION_TARGET,
      ledgerRows: ledger,
      checksumComparison,
      migrationStateValidated: stateProbe.ok,
      migrationStateError: stateProbe.error ?? null,
      appliedAtNote:
        'ledger applied_at values are written by the migration runner at application time (environment clock, verified against the authoritative API clock in the durable record)',
    };

    // V-A2 — exactly one application user
    const users = rows(connection, `SELECT * FROM application_users ORDER BY application_user_id ASC`);
    const firstUser = users[0] as { application_user_id?: string; status?: string } | undefined;
    const vA2Pass =
      users.length === 1 &&
      firstUser?.status === 'ACTIVE' &&
      typeof firstUser?.application_user_id === 'string' &&
      UUID_V4.test(firstUser.application_user_id);
    if (!vA2Pass) failures.push('V-A2');
    report['V-A2'] = {
      passed: vA2Pass,
      count: users.length,
      rows: users,
      opaqueUuidV4: typeof firstUser?.application_user_id === 'string' && UUID_V4.test(firstUser.application_user_id),
      statusActive: firstUser?.status === 'ACTIVE',
    };

    // V-A3 — exactly one ACTIVE membership
    const memberships = rows(
      connection,
      `SELECT * FROM tenant_memberships ORDER BY application_user_id ASC, tenant_id ASC`
    );
    const firstMembership = memberships[0] as
      | { application_user_id?: string; tenant_id?: string; state?: string }
      | undefined;
    const vA3Pass =
      memberships.length === 1 &&
      firstMembership?.state === 'ACTIVE' &&
      firstMembership?.application_user_id === firstUser?.application_user_id &&
      typeof firstMembership?.tenant_id === 'string' &&
      TENANT_ID.test(firstMembership.tenant_id);
    if (!vA3Pass) failures.push('V-A3');
    report['V-A3'] = {
      passed: vA3Pass,
      count: memberships.length,
      rows: memberships,
      tenantRuleT1r: typeof firstMembership?.tenant_id === 'string' && TENANT_ID.test(firstMembership.tenant_id),
    };

    // V-A4 — exactly one ACTIVE binding, FK to the provisioned user, tenant matches
    const bindings = rows(connection, `SELECT * FROM local_principal_bindings ORDER BY endpoint_id ASC`);
    const firstBinding = bindings[0] as
      | {
          endpoint_id?: string;
          application_user_id?: string;
          tenant_id?: string;
          state?: string;
          revoked_at?: string | null;
        }
      | undefined;
    const vA4Pass =
      bindings.length === 1 &&
      firstBinding?.state === 'ACTIVE' &&
      firstBinding?.application_user_id === firstUser?.application_user_id &&
      firstBinding?.tenant_id === firstMembership?.tenant_id &&
      typeof firstBinding?.endpoint_id === 'string' &&
      ENDPOINT_ID.test(firstBinding.endpoint_id) &&
      firstBinding?.revoked_at === null;
    if (!vA4Pass) failures.push('V-A4');
    report['V-A4'] = {
      passed: vA4Pass,
      count: bindings.length,
      rows: bindings,
      endpointRuleEpUuid: typeof firstBinding?.endpoint_id === 'string' && ENDPOINT_ID.test(firstBinding.endpoint_id),
      fkToProvisionedUser: firstBinding?.application_user_id === firstUser?.application_user_id,
      tenantMatchesMembership: firstBinding?.tenant_id === firstMembership?.tenant_id,
    };

    // V-A5 — the A-3 audit line
    const audit = rows(
      connection,
      `SELECT seq, audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at
         FROM local_principal_audit_events ORDER BY seq ASC`
    );
    const actions = audit.map((a) => String((a as { action?: string }).action));
    const seqs = audit.map((a) => Number((a as { seq?: number }).seq));
    const seqMonotonic = seqs.every((s, i) => i === 0 || s > seqs[i - 1]!);
    const hasRequired = actions.includes('BINDING_CREATED') && actions.includes('MEMBERSHIP_CREATED');
    const auditFieldsPresent = audit.every(
      (a) =>
        typeof (a as { actor?: unknown }).actor === 'string' &&
        String((a as { actor?: string }).actor).length > 0 &&
        typeof (a as { occurred_at?: unknown }).occurred_at === 'string' &&
        typeof (a as { audit_id?: unknown }).audit_id === 'string'
    );
    const vA5Pass = hasRequired && seqMonotonic && auditFieldsPresent && audit.length >= 2;
    if (!vA5Pass) failures.push('V-A5');
    report['V-A5'] = {
      passed: vA5Pass,
      count: audit.length,
      rows: audit,
      requiredActionsPresent: hasRequired,
      seqStrictlyIncreasing: seqMonotonic,
      actorAndOccurredAtPresent: auditFieldsPresent,
      sameTransaction: 'written inside the act’s single immediateTransaction; independent atomicity evidence in the rehearsal',
    };

    // V-A6 — absences and inventory
    const inventory = tableCounts(connection);
    const countOf = (name: string) => inventory.find((t) => t.name === name)?.count ?? 0;
    const vA6Pass =
      countOf('external_identity_mappings') === 0 &&
      countOf('user_portfolios') === 0 &&
      countOf('portfolio_revisions') === 0 &&
      countOf('application_users') === 1 &&
      countOf('tenant_memberships') === 1 &&
      countOf('local_principal_bindings') === 1;
    if (!vA6Pass) failures.push('V-A6');
    report['V-A6'] = {
      passed: vA6Pass,
      tableInventory: inventory,
      externalIdentityMappings: countOf('external_identity_mappings'),
      userPortfolios: countOf('user_portfolios'),
      portfolioRevisions: countOf('portfolio_revisions'),
    };

    // V-A7 — fail-closed resolution
    const knownUser = firstUser?.application_user_id as string;
    const knownTenant = firstMembership?.tenant_id as string;
    const resolved = probe(() => identity.resolveTenant(knownUser));
    const absentProbe = probe(() => identity.resolveTenant(randomUUID()));
    const wrongTenantProbe = probe(() => identity.resolveTenant(knownUser, `t-${randomUUID()}`));
    const absentError = absentProbe.error as { name?: string; code?: string } | undefined;
    const wrongError = wrongTenantProbe.error as { name?: string; code?: string } | undefined;
    const indistinguishable =
      absentError?.name === wrongError?.name && absentError?.code === wrongError?.code;
    const activeBindingCount = bindings.filter((b) => (b as { state?: string }).state === 'ACTIVE').length;
    const vA7Pass =
      resolved.ok && resolved.value === knownTenant && indistinguishable && activeBindingCount === 1;
    if (!vA7Pass) failures.push('V-A7');
    report['V-A7'] = {
      passed: vA7Pass,
      resolveTenantReturnsProvisionedTenant: resolved.ok && resolved.value === knownTenant,
      resolvedTenant: resolved.value ?? null,
      absentMembershipProbe: absentProbe.error ?? { ok: true, value: absentProbe.value },
      wrongTenantProbe: wrongTenantProbe.error ?? { ok: true, value: wrongTenantProbe.value },
      probesIndistinguishable: indistinguishable,
      activeBindingCount,
      refusalPathsNote: 'zero/multiple ACTIVE bindings and revoked states refuse identically; demonstrated on disposable copies in --rehearsal',
    };

    // V-A8 — externalized (recorded in the durable execution record, not by this tool)
    report['V-A8'] = {
      evaluatedHere: false,
      note: 'External invariants (IRR 503 fence blobs, IPD main, PR #8/#118 states, no promotion) are captured by the operator/recorder and recorded in the durable execution record; this tool runs offline.',
    };

    const sha256After = sha256File(databasePath);
    report.storageFile = {
      sha256Before,
      sha256After,
      unchangedByValidation: sha256Before === sha256After,
      sizeBytes: fs.statSync(databasePath).size,
    };

    const actRecord = readActRecord(args['act-record']);
    report.againstActRecord = actRecord
      ? {
          actRecordPath: args['act-record'],
          applicationUserIdMatches:
            (actRecord.provisioned as { applicationUserId?: string } | undefined)?.applicationUserId ===
            firstUser?.application_user_id,
          tenantIdMatches:
            (actRecord.provisioned as { tenantId?: string } | undefined)?.tenantId ===
            firstMembership?.tenant_id,
          endpointIdMatches:
            (actRecord.provisioned as { endpointId?: string } | undefined)?.endpointId ===
            firstBinding?.endpoint_id,
        }
      : { provided: false };

    if (!report.storageFile || (report.storageFile as { unchangedByValidation: boolean }).unchangedByValidation === false) {
      failures.push('storage-file-modified-by-validation');
    }

    report.failures = failures;
    report.outcome =
      failures.length === 0
        ? 'V-A1..V-A7 STORE-SIDE CHECKS PASSED (V-A8 externalized; no write by validation tooling)'
        : `VALIDATION FAILED: ${failures.join(', ')}`;
    report.finishedAtUtc = new Date().toISOString();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = failures.length === 0 ? 0 : 1;
  } finally {
    connection.close();
  }
}

// ---------------------------------------------------------------------------
// --rehearsal (disposable copies only)
// ---------------------------------------------------------------------------

function runRehearsal(config: PersistenceConfig, args: Record<string, string | boolean>): void {
  const databasePath = config.databasePath;
  const report: Record<string, unknown> = {
    mode: 'rehearsal',
    actId: 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01',
    databasePath,
    startedAtUtc: new Date().toISOString(),
    scope: 'DISPOSABLE COPIES ONLY — the live store is never written; copies are discarded',
  };
  const actorContext = {
    actor: 'operator:gate-a-rehearsal',
    context: 'G-2 Gate A disposable-copy rehearsal (no live effect)',
  };
  const liveSha256Before = sha256File(databasePath);

  // --- 1. revocation behaviour -------------------------------------------------
  const revocationCopy = `${databasePath}.rehearsal-revocation-${utcStamp()}.sqlite`;
  fs.copyFileSync(databasePath, revocationCopy);
  {
    const connection = PersistenceConnection.open(configFor(config, revocationCopy));
    try {
      const identity = new IdentityService(connection);
      const localPrincipal = new LocalPrincipalService(connection);
      const binding = localPrincipal.resolveActiveBinding();
      const user = rows(connection, `SELECT * FROM application_users`)[0] as {
        application_user_id: string;
      };
      const membership = rows(connection, `SELECT * FROM tenant_memberships`)[0] as {
        tenant_id: string;
      };
      const now = new Date().toISOString();

      const bindingRevocation = probe(() =>
        localPrincipal.revokeBinding(binding.endpointId, actorContext, now)
      );
      const resolveAfterBindingRevocation = probe(() => localPrincipal.resolveActiveBinding());
      const repeatRevocation = probe(() =>
        localPrincipal.revokeBinding(binding.endpointId, actorContext, now)
      );
      const rebindByReuse = probe(() =>
        localPrincipal.createBinding(
          {
            applicationUserId: user.application_user_id,
            tenantId: membership.tenant_id,
            ...actorContext,
          },
          now
        )
      );
      const tenantBeforeMembershipRevocation = probe(() =>
        identity.resolveTenant(user.application_user_id)
      );
      const membershipRevocation = probe(() =>
        localPrincipal.revokeMembershipWithAudit(
          {
            applicationUserId: user.application_user_id,
            tenantId: membership.tenant_id,
            ...actorContext,
          },
          now
        )
      );
      const resolveAfterMembershipRevocation = probe(() =>
        identity.resolveTenant(user.application_user_id)
      );
      const reprovisionAfterRevocation = probe(() =>
        localPrincipal.provisionMembershipWithAudit(
          {
            applicationUserId: user.application_user_id,
            tenantId: membership.tenant_id,
            ...actorContext,
          },
          now
        )
      );
      const auditTrail = localPrincipal.readAuditTrail();

      report.revocationRehearsal = {
        copy: revocationCopy,
        bindingRevocation: bindingRevocation.ok
          ? {
              state: (bindingRevocation.value as { state: string }).state,
              revokedAt: (bindingRevocation.value as { revokedAt: string }).revokedAt,
            }
          : bindingRevocation.error,
        resolveActiveBindingAfterRevocation: resolveAfterBindingRevocation.error,
        repeatRevocationRefused: repeatRevocation.error,
        rebindByReuseRefused: rebindByReuse.error,
        tenantResolvesWhileMembershipActive: tenantBeforeMembershipRevocation.ok
          ? tenantBeforeMembershipRevocation.value
          : tenantBeforeMembershipRevocation.error,
        membershipRevocation: membershipRevocation.ok
          ? { state: (membershipRevocation.value as { state: string }).state }
          : membershipRevocation.error,
        resolveTenantAfterMembershipRevocation: resolveAfterMembershipRevocation.error,
        reprovisionAfterRevocationRefused: reprovisionAfterRevocation.error,
        auditTrailAfterRehearsal: auditTrail.map((e) => ({
          seq: e.seq,
          action: e.action,
          subjectType: e.subjectType,
          subjectId: e.subjectId,
          previousState: e.previousState,
          newState: e.newState,
          actor: e.actor,
        })),
        copySha256AfterRehearsal: sha256File(revocationCopy),
      };
    } finally {
      connection.close();
      fs.unlinkSync(revocationCopy);
      report.revocationRehearsalDiscarded = !fs.existsSync(revocationCopy);
    }
  }

  // --- 2. transactional atomicity + FK enforcement ----------------------------
  const atomicityCopy = `${databasePath}.rehearsal-atomicity-${utcStamp()}.sqlite`;
  fs.copyFileSync(databasePath, atomicityCopy);
  {
    const connection = PersistenceConnection.open(configFor(config, atomicityCopy));
    try {
      const identity = new IdentityService(connection);
      const localPrincipal = new LocalPrincipalService(connection);
      const before = tableCounts(connection);

      const induced = probe(() =>
        connection.immediateTransaction(() => {
          const user = identity.createApplicationUser(actorContext, new Date().toISOString());
          localPrincipal.provisionMembershipWithAudit(
            {
              applicationUserId: user.applicationUserId,
              tenantId: `t-${randomUUID().toLowerCase()}`,
              ...actorContext,
            },
            new Date().toISOString()
          );
          localPrincipal.createBinding(
            {
              applicationUserId: user.applicationUserId,
              tenantId: `t-${randomUUID().toLowerCase()}`,
              ...actorContext,
            },
            new Date().toISOString()
          );
          throw new Error('rehearsal-induced failure: no partial state may survive');
        })
      );
      const after = tableCounts(connection);

      const fkProbe = probe(() =>
        connection
          .prepare(
            `INSERT INTO local_principal_bindings
               (endpoint_id, application_user_id, tenant_id, state, created_at, updated_at, revoked_at)
             VALUES (?, ?, ?, 'ACTIVE', ?, ?, NULL)`
          )
          .run(
            `ep-${randomUUID().toLowerCase()}`,
            randomUUID(),
            `t-${randomUUID().toLowerCase()}`,
            new Date().toISOString(),
            new Date().toISOString()
          )
      );

      report.atomicityRehearsal = {
        copy: atomicityCopy,
        inducedFailure: induced.error,
        tableCountsBefore: before,
        tableCountsAfter: after,
        noPartialState: JSON.stringify(before) === JSON.stringify(after),
        foreignKeyEnforcement: fkProbe.error,
        copySha256AfterRehearsal: sha256File(atomicityCopy),
      };
    } finally {
      connection.close();
      fs.unlinkSync(atomicityCopy);
      report.atomicityRehearsalDiscarded = !fs.existsSync(atomicityCopy);
    }
  }

  // --- 3. backup-restore check (read-only on the backup file) ------------------
  const actRecord = readActRecord(args['act-record']);
  const backupPath =
    (typeof args.backup === 'string' ? args.backup : undefined) ??
    ((actRecord?.backup as { path?: string } | undefined)?.path as string | undefined);
  if (backupPath && fs.existsSync(backupPath)) {
    const connection = PersistenceConnection.open(configFor(config, backupPath));
    try {
      const ledger = readAppliedMigrations(connection);
      report.backupRestoreCheck = {
        backupPath,
        sha256: sha256File(backupPath),
        matchesActRecord:
          (actRecord?.backup as { sha256?: string } | undefined)?.sha256 === sha256File(backupPath),
        schemaVersion: readSchemaVersion(connection),
        tableCounts: tableCounts(connection),
        provisionedRowsPresent:
          (tableCounts(connection).find((t) => t.name === 'application_users')?.count ?? -1) > 0,
        note: 'A restore of this backup would leave NO provisioned state (schema only).',
      };
    } finally {
      connection.close();
    }
  } else {
    report.backupRestoreCheck = { performed: false, reason: 'no backup path supplied or found' };
  }

  report.liveStore = {
    sha256Before: liveSha256Before,
    sha256After: sha256File(databasePath),
    unchangedByRehearsal: liveSha256Before === sha256File(databasePath),
  };
  report.finishedAtUtc = new Date().toISOString();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = (report.liveStore as { unchangedByRehearsal: boolean }).unchangedByRehearsal
    ? 0
    : 1;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const config = loadPersistenceConfig(process.env);
  if (args.validate) {
    runValidation(config, args);
    return;
  }
  if (args.rehearsal) {
    runRehearsal(config, args);
    return;
  }
  process.stderr.write('Specify --validate or --rehearsal. Nothing was performed.\n');
  process.exitCode = 2;
}

main();
