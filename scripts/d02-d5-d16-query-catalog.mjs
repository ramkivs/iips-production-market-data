/**
 * Repository-owned D02 D5/D16 Level E Read-Only Inventory Query Catalog.
 *
 * Source of truth:
 *   docs/integration/IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md (§3.9.B)
 *
 * Governance constraints:
 *   - Exact Q01-Q14 SQL catalog as published on 2026-11-16; zero query reconstruction or simplification.
 *   - Pure read-only catalog metadata module: imports nothing from src/ipc or src/persistence,
 *     opens no database, performs no I/O, and mutates nothing.
 */

export const OPERATOR_PACKAGE_VERSION = '2026-11-16.1';

export const SOURCE_REPORT_PATH =
  'docs/integration/IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md';

export const SOURCE_REPORT_SHA256 =
  '2f5a7b846fb250be031808e9541d2acc366c94224b9bae5aadc85f561d9ba4da';

export const DESIGNATED_WINDOWS_DB_PATH = 'C:\\iips-data\\iips\\user-portfolio.sqlite';

export const DESIGNATED_IPD_NAMED_PIPE = 'iips-user-portfolio-v1';

export const ESTABLISHED_S1_TUPLE = Object.freeze({
  bindingId: 'c5808abaffd072d6401ce63ad86c6ac0',
  principalLabel: 'ramki-personal-local',
  membershipId: 'd25dcc5370100b00766efc5166f65cf3',
  tenantId: 'ipd-personal-local',
  canonicalOwnerId: 'ipd-owner-ramki-personal',
});

export const APPROVED_D02_TARGET = Object.freeze({
  canonicalOwnerId: 'owner-4dc756b3',
  tenantId: 'ipd-personal-local',
});

export const AUDIT_GENESIS_CHECKSUM =
  '0000000000000000000000000000000000000000000000000000000000000000';

export const PINNED_REPOSITORY_MIGRATIONS = Object.freeze([
  Object.freeze({
    migrationId: '001_initial_schema',
    expectedChecksum: '08e712fd323f547413618f0443ec361015b136285c28b519d967f02b6d9580ab',
  }),
  Object.freeze({
    migrationId: '002_audit_event_sequence',
    expectedChecksum: '01892a862c8a877c97403a938123fb575cb43f9445d4c5345aa209f5adae47ed',
  }),
  Object.freeze({
    migrationId: '003_local_principal_bindings',
    expectedChecksum: '7967acc06584811df9cf37e05b84d78d6126b6dae979ee79e0523dfce924004e',
  }),
  Object.freeze({
    migrationId: '004_portfolio_contribution_provenance',
    expectedChecksum: '0dbf90c129154d8c547b6c5876157877c5e12790ebf2b35c741640751ea7b0ac',
  }),
  Object.freeze({
    migrationId: '005_holding_security_identity',
    expectedChecksum: '09fb8b68775a3c6cf799852a0c5c0146ea6971911097cb006a1782a9d415ec04',
  }),
  Object.freeze({
    migrationId: '006_portfolio_restore',
    expectedChecksum: '989a75518ca2fb4803a037e4e59df9053a2e10f38b42a40e67fa4bea01e3f342',
  }),
]);

export const CANDIDATE_D02_TABLES = Object.freeze([
  'principal_owner_migration_ledger',
  'owner_reassignment_ledger',
  'd02_owner_reassignment_ledger',
  'principal_identity_mappings',
]);

export const REQUIRED_CORE_SCHEMA_TABLES = Object.freeze([
  '_migration_ledger',
  'local_principal_bindings',
  'local_principal_memberships',
  'audit_events',
  'portfolios',
  'portfolio_revisions',
  'portfolio_holdings',
  'portfolio_contributions',
]);

export const Q01_TO_Q14_CATALOG = Object.freeze([
  Object.freeze({
    statementId: 'Q01',
    queryGroup: 'Q01',
    title: 'Applied migrations and checksums',
    kind: 'SELECT',
    requiredTables: Object.freeze(['_migration_ledger']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT migration_id, checksum, applied_at',
      'FROM _migration_ledger',
      'ORDER BY migration_id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q02',
    queryGroup: 'Q02',
    title: 'Present schema objects (tables, indexes, triggers)',
    kind: 'SELECT',
    requiredTables: Object.freeze([]),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT type, name, tbl_name, sql',
      'FROM sqlite_master',
      "WHERE name NOT LIKE 'sqlite_autoindex_%'",
      'ORDER BY type ASC, name ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q03a',
    queryGroup: 'Q03',
    title: 'SQLite structural integrity check',
    kind: 'PRAGMA',
    requiredTables: Object.freeze([]),
    conditionalOnTableInQ02: null,
    sql: 'PRAGMA integrity_check;',
  }),
  Object.freeze({
    statementId: 'Q03b',
    queryGroup: 'Q03',
    title: 'SQLite foreign-key integrity check',
    kind: 'PRAGMA',
    requiredTables: Object.freeze([]),
    conditionalOnTableInQ02: null,
    sql: 'PRAGMA foreign_key_check;',
  }),
  Object.freeze({
    statementId: 'Q04a',
    queryGroup: 'Q04',
    title: 'Principal bindings inventory',
    kind: 'SELECT',
    requiredTables: Object.freeze(['local_principal_bindings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT binding_id, principal_label, status, created_at, updated_at, revoked_at',
      'FROM local_principal_bindings',
      'ORDER BY binding_id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q04b',
    queryGroup: 'Q04',
    title: 'Principal memberships inventory joined to parent bindings',
    kind: 'SELECT',
    requiredTables: Object.freeze(['local_principal_memberships', 'local_principal_bindings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT m.membership_id, m.binding_id, m.tenant_id, m.canonical_owner_id, m.status,',
      '       m.created_at, m.updated_at, m.revoked_at,',
      '       b.principal_label AS parent_principal_label, b.status AS parent_binding_status',
      'FROM local_principal_memberships m',
      'LEFT JOIN local_principal_bindings b ON b.binding_id = m.binding_id',
      'ORDER BY m.membership_id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q05a',
    queryGroup: 'Q05',
    title: 'Audit event sequence bounds and total count',
    kind: 'SELECT',
    requiredTables: Object.freeze(['audit_events']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT COUNT(*) AS total_events, MIN(id) AS min_id, MAX(id) AS max_id',
      'FROM audit_events;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q05b',
    queryGroup: 'Q05',
    title: 'Audit event breakdown by event_type and subject_type',
    kind: 'SELECT',
    requiredTables: Object.freeze(['audit_events']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT event_type, subject_type, COUNT(*) AS row_count',
      'FROM audit_events',
      'GROUP BY event_type, subject_type',
      'ORDER BY event_type ASC, subject_type ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q06',
    queryGroup: 'Q06',
    title: 'Portfolio headers and explicit owner/tenant/status classification',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolios']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT canonical_owner_id, tenant_id, portfolio_id, portfolio_name,',
      '       current_revision, status, created_at, updated_at, deleted_at,',
      '       CASE',
      "         WHEN canonical_owner_id = 'ipd-owner-ramki-personal' AND tenant_id = 'ipd-personal-local'",
      "           THEN 'CANDIDATE_S1_HISTORICAL_PORTFOLIO'",
      "         WHEN canonical_owner_id = 'owner-4dc756b3' AND tenant_id = 'ipd-personal-local'",
      "           THEN 'EXISTING_D02_OWNER_PORTFOLIO'",
      "         ELSE 'UNRESOLVED_OTHER_OWNER_OR_TENANT'",
      '       END AS d16_classification',
      'FROM portfolios',
      'ORDER BY canonical_owner_id ASC, tenant_id ASC, portfolio_id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q07',
    queryGroup: 'Q07',
    title: 'Portfolio revisions inventory and digest completeness',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_revisions']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT canonical_owner_id, portfolio_id, revision, operation,',
      '       holdings_count, total_market_value, weight_sum_percentage,',
      '       provenance_digest, content_digest, created_at',
      'FROM portfolio_revisions',
      'ORDER BY canonical_owner_id ASC, portfolio_id ASC, revision ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q08',
    queryGroup: 'Q08',
    title: 'Portfolio holdings summary by owner, portfolio, revision, broker, and security identity status',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_holdings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT canonical_owner_id, portfolio_id, revision,',
      '       source_broker, active, identity_status, resolution_disposition,',
      "       CASE WHEN security_identity IS NULL THEN 'NULL' ELSE 'POPULATED' END AS security_identity_state,",
      '       COUNT(*) AS holding_rows',
      'FROM portfolio_holdings',
      'GROUP BY canonical_owner_id, portfolio_id, revision,',
      '         source_broker, active, identity_status, resolution_disposition, security_identity_state',
      'ORDER BY canonical_owner_id ASC, portfolio_id ASC, revision ASC, source_broker ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q09',
    queryGroup: 'Q09',
    title: 'Portfolio contributions and nullable provenance completeness (004_portfolio_contribution_provenance)',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_contributions']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT canonical_owner_id, portfolio_id, contribution_id,',
      '       contributed_at, created_at, source_broker, contribution_semantics,',
      '       content_digest, lineage_digest, imported_at,',
      '       CASE WHEN file_name IS NULL THEN 1 ELSE 0 END AS file_name_is_null,',
      '       CASE WHEN source_broker IS NULL THEN 1 ELSE 0 END AS source_broker_is_null,',
      '       CASE WHEN content_digest IS NULL THEN 1 ELSE 0 END AS content_digest_is_null,',
      '       CASE WHEN lineage_digest IS NULL THEN 1 ELSE 0 END AS lineage_digest_is_null,',
      '       CASE WHEN imported_at IS NULL THEN 1 ELSE 0 END AS imported_at_is_null,',
      '       CASE WHEN contribution_semantics IS NULL THEN 1 ELSE 0 END AS semantics_is_null',
      'FROM portfolio_contributions',
      'ORDER BY canonical_owner_id ASC, portfolio_id ASC, created_at ASC, contribution_id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q10',
    queryGroup: 'Q10',
    title: 'Portfolio restore receipts inventory (executed if 006_portfolio_restore is present in Q02)',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_restore_receipts']),
    conditionalOnTableInQ02: 'portfolio_restore_receipts',
    sql: [
      'SELECT canonical_owner_id, tenant_id, portfolio_id, idempotency_key,',
      '       request_fingerprint, restored_revision, restored_at, is_saved',
      'FROM portfolio_restore_receipts',
      'ORDER BY canonical_owner_id ASC, portfolio_id ASC, restored_revision ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q11a',
    queryGroup: 'Q11',
    title: 'Collision check (a): identical portfolio_id across S1 and D02 owners',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolios']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT s1.portfolio_id,',
      '       s1.tenant_id AS s1_tenant_id, s1.status AS s1_status, s1.current_revision AS s1_revision,',
      '       d02.tenant_id AS d02_tenant_id, d02.status AS d02_status, d02.current_revision AS d02_revision',
      'FROM portfolios s1',
      'INNER JOIN portfolios d02',
      '  ON d02.portfolio_id = s1.portfolio_id',
      "WHERE s1.canonical_owner_id = 'ipd-owner-ramki-personal'",
      "  AND d02.canonical_owner_id = 'owner-4dc756b3';",
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q11b',
    queryGroup: 'Q11',
    title: 'Collision check (b): duplicate normalized symbols within any (canonical_owner_id, portfolio_id, revision)',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_holdings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT canonical_owner_id, portfolio_id, revision, upper(trim(symbol)) AS norm_symbol, COUNT(*) AS dup_count',
      'FROM portfolio_holdings',
      'GROUP BY canonical_owner_id, portfolio_id, revision, upper(trim(symbol))',
      'HAVING COUNT(*) > 1;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q11c',
    queryGroup: 'Q11',
    title: 'Collision check (c): active binding / active membership partial-unique invariant',
    kind: 'SELECT',
    requiredTables: Object.freeze(['local_principal_bindings', 'local_principal_memberships']),
    conditionalOnTableInQ02: null,
    sql: [
      "SELECT 'ACTIVE_BINDINGS' AS check_name, COUNT(*) AS active_count",
      "FROM local_principal_bindings WHERE status = 'ACTIVE'",
      'UNION ALL',
      "SELECT 'ACTIVE_MEMBERSHIPS' AS check_name, COUNT(*) AS active_count",
      "FROM local_principal_memberships WHERE status = 'ACTIVE';",
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q12a',
    queryGroup: 'Q12',
    title: 'Orphan/consistency check (a): memberships referencing missing or non-ACTIVE bindings',
    kind: 'SELECT',
    requiredTables: Object.freeze(['local_principal_memberships', 'local_principal_bindings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT m.membership_id, m.binding_id, m.status AS membership_status, b.status AS binding_status',
      'FROM local_principal_memberships m',
      'LEFT JOIN local_principal_bindings b ON b.binding_id = m.binding_id',
      "WHERE b.binding_id IS NULL OR (m.status = 'ACTIVE' AND b.status <> 'ACTIVE');",
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q12b',
    queryGroup: 'Q12',
    title: 'Orphan/consistency check (b): portfolios whose current_revision has no matching portfolio_revisions row or inconsistent status',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolios', 'portfolio_revisions']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT p.canonical_owner_id, p.portfolio_id, p.status, p.current_revision, p.deleted_at,',
      '       r.revision AS matched_revision, r.operation AS current_operation',
      'FROM portfolios p',
      'LEFT JOIN portfolio_revisions r',
      '  ON r.canonical_owner_id = p.canonical_owner_id',
      ' AND r.portfolio_id = p.portfolio_id',
      ' AND r.revision = p.current_revision',
      'WHERE (p.current_revision > 0 AND r.revision IS NULL)',
      "   OR (p.status = 'ACTIVE' AND r.operation = 'DELETE')",
      "   OR (p.status = 'TOMBSTONED' AND (p.deleted_at IS NULL OR r.operation <> 'DELETE'));",
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q12c',
    queryGroup: 'Q12',
    title: 'Orphan/consistency check (c): portfolio_revisions whose holdings_count disagrees with actual portfolio_holdings rows',
    kind: 'SELECT',
    requiredTables: Object.freeze(['portfolio_revisions', 'portfolio_holdings']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT r.canonical_owner_id, r.portfolio_id, r.revision, r.operation,',
      '       r.holdings_count AS declared_count, COUNT(h.holding_key) AS actual_count',
      'FROM portfolio_revisions r',
      'LEFT JOIN portfolio_holdings h',
      '  ON h.canonical_owner_id = r.canonical_owner_id',
      ' AND h.portfolio_id = r.portfolio_id',
      ' AND h.revision = r.revision',
      'GROUP BY r.canonical_owner_id, r.portfolio_id, r.revision, r.operation, r.holdings_count',
      'HAVING r.holdings_count <> COUNT(h.holding_key);',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q13',
    queryGroup: 'Q13',
    title: 'Audit hash-chain integrity read (verified in-memory via SHA-256 without write handles)',
    kind: 'SELECT',
    requiredTables: Object.freeze(['audit_events']),
    conditionalOnTableInQ02: null,
    sql: [
      'SELECT id, event_type, subject_type, subject_id, detail_json, prev_checksum, entry_checksum, created_at',
      'FROM audit_events',
      'ORDER BY id ASC;',
    ].join('\n'),
  }),
  Object.freeze({
    statementId: 'Q14',
    queryGroup: 'Q14',
    title: 'Read-only connection verification pragma inside snapshot',
    kind: 'PRAGMA',
    requiredTables: Object.freeze([]),
    conditionalOnTableInQ02: null,
    sql: 'PRAGMA query_only;',
  }),
]);
