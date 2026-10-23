// Refusal / reachability probe for Gate A' provisioning on IPD main.
// NOT provisioning. Proves: no authorized entrypoint is reachable, the mutating
// function refuses before any SQL, and inspectBindings() is read-only.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';

const root = '/home/user/iips-production-market-data';
const { provisionActiveBinding, buildBindingProvisionStatements, inspectBindings,
        ProvisioningNotAuthorizedError } = await import(`${root}/dist/src/persistence/provisioning.js`);
const { ensureMigrations } = await import(`${root}/dist/src/persistence/migration_ledger.js`);
const m1 = (await import(`${root}/dist/src/persistence/migrations/001_initial_schema.js`)).migration001InitialSchema;
const m2 = (await import(`${root}/dist/src/persistence/migrations/002_audit_event_sequence.js`)).migration002AuditEventSequence;
const m3 = (await import(`${root}/dist/src/persistence/migrations/003_local_principal_bindings.js`)).migration003LocalPrincipalBindings;
const m4 = (await import(`${root}/dist/src/persistence/migrations/004_portfolio_contribution_provenance.js`)).migration004PortfolioContributionProvenance;

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');
ensureMigrations(db, [m1, m2, m3, m4]);

const auditBefore = db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n;
const before = inspectBindings(db);

// 1. Any forgeable shape that in-repository code could construct.
const candidates = [
  undefined,
  null,
  { act: 'gate-a-prime', issuedAt: new Date().toISOString() },
  Object.assign(Object.create(null), { act: 'gate-a-prime', issuedAt: 'x' }),
];
const results = [];
for (const [i, auth] of candidates.entries()) {
  try {
    provisionActiveBinding(db, auth, { principalLabel: 'single-operator', tenantId: 't1', canonicalOwnerId: 'o1' });
    results.push({ candidate: i, threw: false });
  } catch (e) {
    results.push({ candidate: i, threw: true, name: e.name, message: e.message });
  }
}

const after = inspectBindings(db);
const auditAfter = db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n;

console.log(JSON.stringify({
  probe: 'gate-a-prime reachability/refusal',
  node: process.versions.node,
  platform: process.platform,
  schema_versions: db.prepare('SELECT migration_id, checksum FROM _migration_ledger ORDER BY migration_id').all(),
  tables: db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name),
  authorization_candidates: results,
  all_refused: results.every(r => r.threw === true && r.name === 'ProvisioningNotAuthorizedError'),
  bindings_before: before,
  bindings_after: after,
  rows_unchanged: JSON.stringify(before) === JSON.stringify(after) && auditBefore === auditAfter,
  audit_events_before: auditBefore,
  audit_events_after: auditAfter,
  pure_builder_works_without_authorization: (() => {
    const s = buildBindingProvisionStatements({ principalLabel: 'single-operator', tenantId: 't1', canonicalOwnerId: 'o1' });
    return { bindingIdLen: s.bindingSql.includes("'ACTIVE'"), keys: Object.keys(s) };
  })(),
  in_repo_importers_of_provisioning: readdirSync(`${root}/src`, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.ts'))
    .filter(f => { try { return /from\s+['"][^'"]*provisioning['"]/.test(readFileSync(`${root}/src/${f}`, 'utf8')); } catch { return false; } }),
}, null, 2));
db.close();
