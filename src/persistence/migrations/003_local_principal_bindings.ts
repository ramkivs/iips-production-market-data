/**
 * Institutional Investment Platform System (IIPS)
 * Migration 003 — Local Principal Bindings (A-2) & Local Principal Audit (A-3)
 * G-2 / Gate A — NP04-G24 durable-persistence extension
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * IMMUTABLE: this SQL text is checksummed into the migration ledger.
 * Never edit an applied migration. Append a new migration instead.
 *
 * Authority: the A-2/A-3 additions were accepted under the L-IPC-1 rev 2 contract
 * (clauses C1..C12; open items U-4/U-6) and authorized for realization — exactly and
 * only as the A-2/A-3 enablement — by the rendered Gate A decision
 * `IIPS-V3-G2-IPD-GATE-A-PA-DECISION-2026-10-16-01`.
 *
 * Exhaustive schema scope of this migration:
 *   A-2 — ONE table `local_principal_bindings` + ONE index (the local principal
 *         binding record; deliberately NOT a reuse of `external_identity_mappings`);
 *   A-3 — ONE table `local_principal_audit_events` (local-only audit line mirroring
 *         the `mapping_audit_events` shape, ordered by a monotonic `seq`).
 *
 * Nothing else is added, altered, or dropped. Migrations 001 and 002 are untouched.
 */

import type { MigrationDefinition } from './types.js';

export const migration003LocalPrincipalBindings: MigrationDefinition = {
  id: '003',
  name: 'local_principal_bindings',
  sql: `
-- ---------------------------------------------------------------------------
-- A-2: local principal binding record.
-- One deployment, one principal. The binding is the local, act-provisioned
-- record that a single-principal same-host IPC endpoint resolves against.
-- It is deliberately NOT external_identity_mappings: a transport fact must
-- never be conflated with an external-identity claim. No issuer/subject
-- columns, no mapping lifecycle reuse, no cascade delete.
-- State is one-way: ACTIVE -> REVOKED. No restoration semantics exist here.
-- ---------------------------------------------------------------------------
CREATE TABLE local_principal_bindings (
    endpoint_id         TEXT PRIMARY KEY,
    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
    tenant_id           TEXT NOT NULL,
    state               TEXT NOT NULL CHECK (state IN ('ACTIVE','REVOKED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    revoked_at          TEXT
);

CREATE INDEX idx_local_principal_bindings_user
    ON local_principal_bindings (application_user_id, state);

-- ---------------------------------------------------------------------------
-- A-3: local principal audit line.
-- Audits binding and membership lifecycle mutations, written in the SAME
-- transaction as the mutation they audit. LOCAL ONLY: no cross-system audit
-- destination is created, configured, or implied by this table.
-- A monotonic sequence is the total ordering authority (timestamps alone are
-- insufficient — the same millisecond has no defined order).
-- ---------------------------------------------------------------------------
CREATE TABLE local_principal_audit_events (
    seq            INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id       TEXT NOT NULL UNIQUE,
    subject_type   TEXT NOT NULL,
    subject_id     TEXT NOT NULL,
    action         TEXT NOT NULL,
    previous_state TEXT,
    new_state      TEXT,
    actor          TEXT NOT NULL,
    context        TEXT,
    occurred_at    TEXT NOT NULL
);
`,
};
