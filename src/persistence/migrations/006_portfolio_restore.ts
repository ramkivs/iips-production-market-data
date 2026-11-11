import type { Migration } from '../migration_ledger.js';

// Rebuild the referencing leaf first so foreign keys stay enabled throughout.
// Existing immutable migration SQL and all stored row values are preserved.
export const migration006PortfolioRestore: Migration = {
 id: '006_portfolio_restore',
 sql: `
CREATE TABLE holdings_backup_006 AS SELECT * FROM portfolio_holdings;
DROP TABLE portfolio_holdings;
CREATE TABLE portfolio_revisions_new_006 (
    portfolio_id          TEXT NOT NULL,
    canonical_owner_id    TEXT NOT NULL,
    revision              INTEGER NOT NULL,
    operation             TEXT NOT NULL CHECK (operation IN ('INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE', 'RESTORE')),
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

INSERT INTO portfolio_revisions_new_006 SELECT * FROM portfolio_revisions;
DROP TABLE portfolio_revisions;
ALTER TABLE portfolio_revisions_new_006 RENAME TO portfolio_revisions;

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
    security_identity     TEXT,
    PRIMARY KEY (canonical_owner_id, portfolio_id, revision, holding_key),
    FOREIGN KEY (canonical_owner_id, portfolio_id, revision)
        REFERENCES portfolio_revisions (canonical_owner_id, portfolio_id, revision)
);

CREATE INDEX idx_portfolio_holdings_symbol
    ON portfolio_holdings (canonical_owner_id, portfolio_id, revision, symbol);

INSERT INTO portfolio_holdings SELECT * FROM holdings_backup_006;
DROP TABLE holdings_backup_006;
CREATE TABLE portfolio_restore_receipts (
 canonical_owner_id TEXT NOT NULL, tenant_id TEXT NOT NULL, portfolio_id TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, request_fingerprint TEXT NOT NULL,
 restored_revision INTEGER NOT NULL, restored_at TEXT NOT NULL, is_saved INTEGER NOT NULL CHECK (is_saved IN (0,1)),
 PRIMARY KEY (canonical_owner_id, portfolio_id, idempotency_key),
 UNIQUE (canonical_owner_id, portfolio_id, restored_revision),
 FOREIGN KEY (canonical_owner_id, portfolio_id, restored_revision)
 REFERENCES portfolio_revisions (canonical_owner_id, portfolio_id, revision)
);
`,
};
