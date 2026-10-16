#!/usr/bin/env node
/**
 * Institutional Investment Platform System (IIPS)
 * G-2 Gate A — ONE-TIME LOCAL PRINCIPAL PROVISIONING (OPERATOR TOOL)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: the single bounded act authorized by the rendered decision
 * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01` (request
 * `IIPS-V3-G2-GATE-A-LOCAL-PROVISIONING-AUTHORITY-REQUEST-2026-10-16-01`).
 *
 * This is OPERATOR TOOLING for that one act. It is not imported by, and is not
 * wired into, any runtime path. It provisions exactly: one `application_users`
 * row, one `tenant_memberships` row (`t-<lowercase UUIDv4>`), one
 * `local_principal_bindings` row (`ep-<lowercase UUIDv4>`), and their A-3 audit
 * rows — inside ONE `immediateTransaction`, after a same-directory pre-run backup.
 *
 * Usage (operator, offline):
 *   IPD_PORTFOLIO_DB_PATH=/abs/store/ipd-portfolio.sqlite \
 *   node dist/src/gate_a/provision.js --execute \
 *     [--actor=<actor>] [--context=<provisioning reference>] \
 *     [--basis-ref=<ref>] [--basis-commit=<sha>] [--basis-tree=<sha>]
 *
 * Prints ONE JSON act record to stdout. Exit 0 only when the act's single
 * transaction committed and the post-state was read back; on any failure the
 * pre-run backup (when created) is restored over the store, the failure is
 * reported, and no manual repair is attempted.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

import { loadPersistenceConfig, type PersistenceConfig } from '../persistence/config.js';
import { PersistenceConnection } from '../persistence/connection.js';
import {
  readAppliedMigrations,
  readSchemaVersion,
  runMigrations,
} from '../persistence/migrations/index.js';
import { IdentityService } from '../app_identity/service.js';
import { LocalPrincipalService } from '../app_identity/local_principal.js';

const require = createRequire(import.meta.url);
const betterSqlite3Package = require('better-sqlite3/package.json') as { version: string };
const Database = require('better-sqlite3') as typeof import('better-sqlite3');

const DEFAULT_ACTOR = 'operator:gate-a-local-provisioning';
const DEFAULT_CONTEXT = 'IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01';

interface CliArgs {
  readonly execute: boolean;
  readonly actor: string;
  readonly context: string;
  readonly basisRef?: string;
  readonly basisCommit?: string;
  readonly basisTree?: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  let execute = false;
  let actor = process.env.IPD_GATE_A_ACTOR ?? DEFAULT_ACTOR;
  let context = process.env.IPD_GATE_A_CONTEXT ?? DEFAULT_CONTEXT;
  let basisRef: string | undefined;
  let basisCommit: string | undefined;
  let basisTree: string | undefined;

  for (const arg of argv) {
    if (arg === '--execute') execute = true;
    else if (arg.startsWith('--actor=')) actor = arg.slice('--actor='.length);
    else if (arg.startsWith('--context=')) context = arg.slice('--context='.length);
    else if (arg.startsWith('--basis-ref=')) basisRef = arg.slice('--basis-ref='.length);
    else if (arg.startsWith('--basis-commit=')) basisCommit = arg.slice('--basis-commit='.length);
    else if (arg.startsWith('--basis-tree=')) basisTree = arg.slice('--basis-tree='.length);
  }
  return { execute, actor, context, basisRef, basisCommit, basisTree };
}

function sha256File(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function utcStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

interface TableCount {
  readonly name: string;
  readonly count: number;
}

function tableCountsOn(handle: import('better-sqlite3').Database): TableCount[] {
  const tables = handle
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`)
    .all() as Array<{ name: string }>;
  return tables.map((table) => ({
    name: table.name,
    count: (
      handle.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number }
    ).c,
  }));
}

/** Read-only pre-run inspection (no connection is opened for writing). */
function preRunState(databasePath: string): Record<string, unknown> {
  if (!fs.existsSync(databasePath)) {
    return {
      storeExisted: false,
      note: 'No database file existed before this act; Gate A is the act that creates it.',
    };
  }
  const handle = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    let ledger: unknown = null;
    try {
      ledger = handle
        .prepare(`SELECT id, name, checksum, applied_at FROM schema_migrations ORDER BY id ASC`)
        .all();
    } catch {
      ledger = null;
    }
    return {
      storeExisted: true,
      sizeBytes: fs.statSync(databasePath).size,
      sha256: sha256File(databasePath),
      tableCounts: tableCountsOn(handle),
      migrationLedger: ledger,
    };
  } finally {
    handle.close();
  }
}

function allRows(
  connection: PersistenceConnection,
  sql: string
): Array<Record<string, unknown>> {
  return connection.prepare(sql).all() as Array<Record<string, unknown>>;
}

function tableCounts(connection: PersistenceConnection): TableCount[] {
  const tables = allRows(
    connection,
    `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC`
  ) as Array<{ name: string }>;
  return tables.map((table) => ({
    name: table.name,
    count: (
      connection.prepare(`SELECT COUNT(*) AS c FROM "${table.name}"`).get() as { c: number }
    ).c,
  }));
}

function postRunState(
  connection: PersistenceConnection,
  databasePath: string
): Record<string, unknown> {
  return {
    sizeBytes: fs.statSync(databasePath).size,
    sha256: sha256File(databasePath),
    tableCounts: tableCounts(connection),
    applicationUsers: allRows(connection, `SELECT * FROM application_users ORDER BY application_user_id ASC`),
    tenantMemberships: allRows(
      connection,
      `SELECT * FROM tenant_memberships ORDER BY application_user_id ASC, tenant_id ASC`
    ),
    localPrincipalBindings: allRows(
      connection,
      `SELECT * FROM local_principal_bindings ORDER BY endpoint_id ASC`
    ),
    localPrincipalAuditEvents: allRows(
      connection,
      `SELECT seq, audit_id, subject_type, subject_id, action, previous_state, new_state, actor, context, occurred_at
         FROM local_principal_audit_events ORDER BY seq ASC`
    ),
    migrationLedger: readAppliedMigrations(connection),
    schemaVersion: readSchemaVersion(connection),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.execute) {
    process.stderr.write(
      'Gate A provisioning requires the explicit --execute flag. Nothing was performed.\n'
    );
    process.exitCode = 2;
    return;
  }

  const startedAtUtc = new Date().toISOString();
  const record: Record<string, unknown> = {
    actId: args.context,
    mode: 'NON_PRODUCTION',
    tool: 'src/gate_a/provision.ts (operator tooling; not wired into any runtime path)',
    outcome: 'GATE A — NOT EXECUTED (no successful commit)',
    startedAtUtc,
    executor: {
      actor: args.actor,
      context: args.context,
      runtime: {
        node: process.version,
        betterSqlite3: betterSqlite3Package.version,
        platform: process.platform,
        clockUtcAtStart: new Date().toISOString(),
      },
    },
    basis: {
      ref: args.basisRef ?? null,
      commit: args.basisCommit ?? null,
      tree: args.basisTree ?? null,
      note: 'Basis identifiers are operator-supplied here and independently verified in the durable execution record.',
    },
  };

  let config: PersistenceConfig;
  try {
    config = loadPersistenceConfig(process.env);
  } catch (error) {
    record.outcome = 'GATE A — FAILED (configuration)';
    record.error = { name: (error as Error).name, message: (error as Error).message };
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const databasePath = config.databasePath;
  record.store = { databasePath, journalMode: config.journalMode, synchronous: config.synchronous, foreignKeys: config.foreignKeysEnabled };

  const pre = preRunState(databasePath);
  record.preRun = pre;

  let connection: PersistenceConnection | null = null;
  let backupPath: string | null = null;

  try {
    connection = PersistenceConnection.open(config);

    const migrationOutcome = runMigrations(connection);
    const schemaVersion = readSchemaVersion(connection);
    record.migration = {
      applied: migrationOutcome.applied,
      schemaVersion,
      ledger: readAppliedMigrations(connection),
    };

    // Pre-run backup (same directory, plain file copy; journalMode DELETE => no WAL side-files).
    backupPath = path.join(
      path.dirname(databasePath),
      `${path.basename(databasePath)}.pre-provision-backup-${utcStamp()}.sqlite`
    );
    fs.copyFileSync(databasePath, backupPath);
    record.backup = {
      path: backupPath,
      sha256: sha256File(backupPath),
      sizeBytes: fs.statSync(backupPath).size,
      createdAtUtc: new Date().toISOString(),
      note: 'Restored over the store on any failure; a restored backup leaves no provisioned state.',
    };

    const identity = new IdentityService(connection);
    const localPrincipal = new LocalPrincipalService(connection);
    const now = new Date().toISOString();

    // Rule T1-r: "t-" + lowercase(UUIDv4) — generated once, opaque, never derived.
    const tenantId = `t-${randomUUID().toLowerCase()}`;

    // ONE immediateTransaction for every Gate A write (each service call nests as a
    // savepoint, so the provisioning and its audit rows commit or roll back together).
    const provisioned = connection.immediateTransaction(() => {
      const user = identity.createApplicationUser({ actor: args.actor, context: args.context }, now);
      const membership = localPrincipal.provisionMembershipWithAudit(
        {
          applicationUserId: user.applicationUserId,
          tenantId,
          actor: args.actor,
          context: args.context,
        },
        now
      );
      const binding = localPrincipal.createBinding(
        {
          applicationUserId: user.applicationUserId,
          tenantId,
          actor: args.actor,
          context: args.context,
        },
        now
      );
      return { user, membership, binding };
    });

    const post = postRunState(connection, databasePath);
    record.provisioned = {
      applicationUserId: provisioned.user.applicationUserId,
      applicationUserStatus: provisioned.user.status,
      tenantId: provisioned.membership.tenantId,
      membershipState: provisioned.membership.state,
      endpointId: provisioned.binding.endpointId,
      bindingState: provisioned.binding.state,
      actTimestampUtc: now,
      rule: 'tenant = "t-" + lowercase(UUIDv4); endpoint = "ep-" + lowercase(UUIDv4); generated once, immutable',
    };
    record.transaction = {
      form: 'one immediateTransaction (provisioning + audit rows commit or roll back together)',
      committed: true,
    };
    record.postRun = post;
    record.outcome = 'GATE A — PROVISIONED (validation pending)';
    record.finishedAtUtc = new Date().toISOString();
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
  } catch (error) {
    const failure = error as Error & { code?: string };
    record.outcome = 'GATE A — FAILED / ROLLED BACK';
    record.error = { name: failure.name, message: failure.message, code: failure.code ?? null };
    record.finishedAtUtc = new Date().toISOString();

    if (backupPath && fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, databasePath);
        record.rollback = {
          restored: true,
          from: backupPath,
          sha256AfterRestore: sha256File(databasePath),
          postRestoreCounts: preRunState(databasePath),
        };
      } catch (restoreError) {
        record.rollback = {
          restored: false,
          error: (restoreError as Error).message,
          note: 'Manual repair is NOT performed by this tool; the failure stands and must be reported.',
        };
      }
    } else {
      record.rollback = {
        restored: false,
        note: 'No pre-run backup existed (failure occurred before backup creation); no provisioning writes had been attempted.',
      };
    }
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
    process.exitCode = 1;
  } finally {
    if (connection) {
      try {
        connection.close();
      } catch {
        /* shutdown errors do not mask the act outcome */
      }
    }
  }
}

main();
