/**
 * Gate 3 — Migration 003: local principal bindings and memberships (A-2).
 *
 * IMMUTABLE: checksummed into the migration ledger. The partial-unique
 * indexes enforce the single-ACTIVE rule at the storage layer: at most one
 * ACTIVE binding and at most one ACTIVE membership may exist at any time,
 * while any number of REVOKED rows are retained as history.
 */
import type { Migration } from '../migration_ledger.js';

export const migration003LocalPrincipalBindings: Migration = {
  id: '003_local_principal_bindings',
  sql: `
CREATE TABLE local_principal_bindings (
    binding_id       TEXT PRIMARY KEY,
    principal_label  TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    revoked_at       TEXT
);

CREATE TABLE local_principal_memberships (
    membership_id       TEXT PRIMARY KEY,
    binding_id          TEXT NOT NULL REFERENCES local_principal_bindings(binding_id),
    tenant_id           TEXT NOT NULL,
    canonical_owner_id  TEXT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    revoked_at          TEXT
);

CREATE UNIQUE INDEX idx_local_principal_bindings_single_active
    ON local_principal_bindings ((1)) WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX idx_local_principal_memberships_single_active
    ON local_principal_memberships ((1)) WHERE status = 'ACTIVE';

CREATE INDEX idx_local_principal_memberships_binding
    ON local_principal_memberships (binding_id, status);
`,
};
