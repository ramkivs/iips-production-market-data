/**
 * Institutional Investment Platform System (IIPS)
 * Migration 001 — Initial Durable Schema (NP04-G24 / Phase B + Phase J)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * IMMUTABLE: this SQL text is checksummed into the migration ledger.
 * Never edit an applied migration. Append a new migration instead.
 *
 * Scope: the smallest schema that satisfies the already-governed requirements —
 * application-user registry, external identity mapping, mapping audit, tenant
 * membership, and durable portfolio revisions/holdings/contributions/events.
 *
 * NOTE: the migration ledger table is created by the runner during bootstrap and
 * is deliberately NOT part of this migration.
 */

import type { MigrationDefinition } from './types.js';

export const migration001InitialSchema: MigrationDefinition = {
  id: '001',
  name: 'initial_schema',
  sql: `
-- ---------------------------------------------------------------------------
-- Phase D: governed application-user registry.
-- The application-user identifier is stable, opaque and separately governed.
-- It is never derived from preferred_username, raw OIDC sub, browser-supplied
-- user ids, companyId, runtimeCompanyId, portfolio id, or operator identity.
-- ---------------------------------------------------------------------------
CREATE TABLE application_users (
    application_user_id TEXT PRIMARY KEY,
    status              TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Phase E: external identity mapping boundary.
-- Mapping key is (issuer + subject) and resolves to exactly one application user.
-- Lifecycle: PENDING -> APPROVED -> ACTIVE -> RETIRED (enforced in code and
-- constrained here to the governed state set).
-- ---------------------------------------------------------------------------
CREATE TABLE external_identity_mappings (
    mapping_id          TEXT PRIMARY KEY,
    issuer              TEXT NOT NULL,
    subject             TEXT NOT NULL,
    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
    lifecycle_state     TEXT NOT NULL CHECK (lifecycle_state IN ('PENDING', 'APPROVED', 'ACTIVE', 'RETIRED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    retired_at          TEXT,
    UNIQUE (issuer, subject)
);

CREATE INDEX idx_external_identity_mappings_user
    ON external_identity_mappings (application_user_id);

-- ---------------------------------------------------------------------------
-- Phase F: mapping audit boundary.
-- Mapping mutations and their audit record are written in the same transaction.
-- ---------------------------------------------------------------------------
CREATE TABLE mapping_audit_events (
    audit_id       TEXT PRIMARY KEY,
    mapping_id     TEXT NOT NULL REFERENCES external_identity_mappings(mapping_id),
    action         TEXT NOT NULL,
    previous_state TEXT,
    new_state      TEXT,
    actor          TEXT NOT NULL,
    context        TEXT,
    occurred_at    TEXT NOT NULL
);

CREATE INDEX idx_mapping_audit_events_mapping
    ON mapping_audit_events (mapping_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Phase G: tenant membership as a separate authority from external identity.
-- Membership is explicitly provisioned. Nothing in this schema derives a tenant
-- from browser fields, companyId, runtimeCompanyId, portfolio id,
-- preferred_username, raw subject, or operator context.
-- ---------------------------------------------------------------------------
CREATE TABLE tenant_memberships (
    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
    tenant_id           TEXT NOT NULL,
    state               TEXT NOT NULL CHECK (state IN ('ACTIVE', 'REVOKED')),
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    PRIMARY KEY (application_user_id, tenant_id)
);

CREATE INDEX idx_tenant_memberships_tenant
    ON tenant_memberships (tenant_id);

-- ---------------------------------------------------------------------------
-- Phase J: durable portfolio model.
-- ---------------------------------------------------------------------------
CREATE TABLE user_portfolios (
    portfolio_id        TEXT PRIMARY KEY,
    application_user_id TEXT NOT NULL REFERENCES application_users(application_user_id),
    tenant_id           TEXT NOT NULL,
    portfolio_name      TEXT NOT NULL,
    current_revision    INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    deleted_at          TEXT
);

CREATE INDEX idx_user_portfolios_owner
    ON user_portfolios (application_user_id, tenant_id);

CREATE TABLE portfolio_revisions (
    portfolio_id          TEXT NOT NULL REFERENCES user_portfolios(portfolio_id),
    revision              INTEGER NOT NULL,
    operation             TEXT NOT NULL CHECK (operation IN ('INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE')),
    disposition           TEXT,
    total_market_value    REAL NOT NULL DEFAULT 0,
    weight_sum_percentage REAL NOT NULL DEFAULT 0,
    holdings_count        INTEGER NOT NULL DEFAULT 0,
    provenance_digest     TEXT NOT NULL,
    content_digest        TEXT,
    created_at            TEXT NOT NULL,
    PRIMARY KEY (portfolio_id, revision)
);

CREATE TABLE portfolio_revision_holdings (
    portfolio_id           TEXT NOT NULL,
    revision               INTEGER NOT NULL,
    holding_key            TEXT NOT NULL,
    symbol                 TEXT NOT NULL,
    company_id             TEXT NOT NULL,
    isin                   TEXT,
    exchange               TEXT,
    quantity               REAL NOT NULL,
    average_buy_price      REAL NOT NULL,
    current_price          REAL NOT NULL,
    market_value           REAL NOT NULL,
    weight_percentage      REAL NOT NULL,
    active                 INTEGER NOT NULL DEFAULT 1,
    source_broker          TEXT NOT NULL,
    lineage_digest         TEXT NOT NULL,
    identity_status        TEXT,
    resolution_disposition TEXT,
    created_at             TEXT NOT NULL,
    PRIMARY KEY (portfolio_id, revision, holding_key),
    FOREIGN KEY (portfolio_id, revision)
        REFERENCES portfolio_revisions (portfolio_id, revision)
);

CREATE TABLE portfolio_contributions (
    contribution_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id       TEXT NOT NULL,
    revision           INTEGER NOT NULL,
    source_broker      TEXT NOT NULL,
    file_name          TEXT NOT NULL,
    content_digest     TEXT NOT NULL,
    lineage_digest     TEXT NOT NULL,
    imported_at        TEXT NOT NULL,
    holdings_count     INTEGER NOT NULL,
    total_market_value REAL NOT NULL,
    FOREIGN KEY (portfolio_id, revision)
        REFERENCES portfolio_revisions (portfolio_id, revision)
);

-- Supports the governed content-hash idempotency lookup. Deliberately NOT unique:
-- REPLACE re-imports of identical content must remain allowed, exactly as the
-- existing in-memory PortfolioStore behaves.
CREATE INDEX idx_portfolio_contributions_digest
    ON portfolio_contributions (portfolio_id, content_digest);

CREATE TABLE portfolio_events (
    event_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL REFERENCES user_portfolios(portfolio_id),
    revision    INTEGER,
    event_type  TEXT NOT NULL,
    payload     TEXT,
    occurred_at TEXT NOT NULL
);

CREATE INDEX idx_portfolio_events_portfolio
    ON portfolio_events (portfolio_id, occurred_at);
`,
};
