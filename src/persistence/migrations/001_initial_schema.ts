/**
 * Gate 3 — Migration 001: initial durable portfolio schema.
 *
 * IMMUTABLE: this SQL text is checksummed into the migration ledger. Never edit
 * an applied migration; append a new one instead.
 *
 * Scope: the smallest owner-scoped durable model required by the Gate 3
 * closed operation set — portfolios, their immutable revision history, the
 * revision-scoped holdings snapshot and the contribution ledger. All rows are
 * operator-local. There is no application-user registry or network surface.
 */
import type { Migration } from '../migration_ledger.js';

export const migration001InitialSchema: Migration = {
  id: '001_initial_schema',
  sql: `
CREATE TABLE portfolios (
    portfolio_id          TEXT NOT NULL,
    canonical_owner_id    TEXT NOT NULL,
    tenant_id             TEXT NOT NULL,
    portfolio_name        TEXT NOT NULL,
    current_revision      INTEGER NOT NULL DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TOMBSTONED')),
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL,
    deleted_at            TEXT,
    PRIMARY KEY (canonical_owner_id, portfolio_id)
);

CREATE INDEX idx_portfolios_owner
    ON portfolios (canonical_owner_id, tenant_id);

CREATE TABLE portfolio_revisions (
    portfolio_id          TEXT NOT NULL,
    canonical_owner_id    TEXT NOT NULL,
    revision              INTEGER NOT NULL,
    operation             TEXT NOT NULL CHECK (operation IN ('INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE')),
    total_market_value    REAL NOT NULL DEFAULT 0,
    weight_sum_percentage REAL NOT NULL DEFAULT 0,
    holdings_count        INTEGER NOT NULL DEFAULT 0,
    provenance_digest     TEXT NOT NULL,
    content_digest        TEXT,
    created_at            TEXT NOT NULL,
    PRIMARY KEY (canonical_owner_id, portfolio_id, revision),
    FOREIGN KEY (canonical_owner_id, portfolio_id)
        REFERENCES portfolios (canonical_owner_id, portfolio_id)
);

CREATE TABLE portfolio_holdings (
    canonical_owner_id    TEXT NOT NULL,
    portfolio_id          TEXT NOT NULL,
    revision              INTEGER NOT NULL,
    holding_key           TEXT NOT NULL,
    symbol                TEXT NOT NULL,
    company_id            TEXT NOT NULL,
    quantity              REAL NOT NULL,
    average_buy_price     REAL NOT NULL,
    current_price         REAL NOT NULL,
    market_value          REAL NOT NULL,
    weight_percentage     REAL NOT NULL,
    active                INTEGER NOT NULL DEFAULT 1,
    source_broker         TEXT NOT NULL,
    lineage_digest        TEXT NOT NULL,
    identity_status       TEXT,
    resolution_disposition TEXT,
    created_at            TEXT NOT NULL,
    PRIMARY KEY (canonical_owner_id, portfolio_id, revision, holding_key),
    FOREIGN KEY (canonical_owner_id, portfolio_id, revision)
        REFERENCES portfolio_revisions (canonical_owner_id, portfolio_id, revision)
);

CREATE INDEX idx_portfolio_holdings_symbol
    ON portfolio_holdings (canonical_owner_id, portfolio_id, revision, symbol);

CREATE TABLE portfolio_contributions (
    canonical_owner_id    TEXT NOT NULL,
    portfolio_id          TEXT NOT NULL,
    contribution_id       TEXT NOT NULL,
    amount                REAL NOT NULL,
    contributed_at        TEXT NOT NULL,
    created_at            TEXT NOT NULL,
    PRIMARY KEY (canonical_owner_id, portfolio_id, contribution_id),
    FOREIGN KEY (canonical_owner_id, portfolio_id)
        REFERENCES portfolios (canonical_owner_id, portfolio_id)
);
`,
};
