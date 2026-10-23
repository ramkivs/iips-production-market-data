// Schema-compatibility probe ONLY. No rows are inserted; nothing is provisioned.
// Compares the Gate A' approved basis schema (ref gate-a/local-principal-enablement-2026-10-16
// @ 2ded0e98, migration blobs 48fcf4d9/dfe9f027/9ba884ac) with the migration set the current
// IPD main startup path applies (f594a182/932af8e6/32b125bf/6bad5a50).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const basisDir = '/tmp/gabasis/src/persistence/migrations';
const sqlOf = (p) => {
  const text = readFileSync(p, 'utf8');
  const m = text.match(/sql:\s*`([\s\S]*?)`,?\s*\};\s*$/);
  if (!m) throw new Error(`could not extract sql from ${p}`);
  return m[1];
};

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');
for (const f of ['001_initial_schema.ts', '002_audit_event_sequence.ts', '003_local_principal_bindings.ts']) {
  db.exec(sqlOf(`${basisDir}/${f}`));
}
const basisTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);

const root = '/home/user/iips-production-market-data';
const { ensureMigrations } = await import(`${root}/dist/src/persistence/migration_ledger.js`);
const mods = [
  ['001_initial_schema', 'migration001InitialSchema'],
  ['002_audit_event_sequence', 'migration002AuditEventSequence'],
  ['003_local_principal_bindings', 'migration003LocalPrincipalBindings'],
  ['004_portfolio_contribution_provenance', 'migration004PortfolioContributionProvenance'],
];
const migrations = [];
for (const [file, name] of mods) {
  migrations.push((await import(`${root}/dist/src/persistence/migrations/${file}.js`))[name]);
}

let startupResult;
try {
  ensureMigrations(db, migrations);
  startupResult = { ok: true };
} catch (e) {
  startupResult = { ok: false, name: e.name, message: e.message };
}
const afterTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);

// Second half: the reverse direction — a main-schema store then the basis expectations.
const db2 = new DatabaseSync(':memory:');
db2.exec('PRAGMA foreign_keys = ON;');
ensureMigrations(db2, migrations);
const mainTables = db2.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
const basisRequired = ['application_users', 'tenant_memberships', 'local_principal_audit_events'];
const missingFromMain = basisRequired.filter(t => !mainTables.includes(t));
const basisColumns = db.prepare("PRAGMA table_info(local_principal_bindings)").all().map(c => c.name);
const mainColumns = db2.prepare("PRAGMA table_info(local_principal_bindings)").all().map(c => c.name);

console.log(JSON.stringify({
  probe: 'Gate A prime basis vs current-main schema compatibility (no rows, no provisioning)',
  basis_tables: basisTables,
  basis_local_principal_bindings_columns: basisColumns,
  current_main_tables: mainTables,
  current_main_local_principal_bindings_columns: mainColumns,
  basis_tables_absent_on_main: missingFromMain,
  main_migrations_applied_over_basis_schema: startupResult,
  tables_after_failed_apply: afterTables,
}, null, 2));
