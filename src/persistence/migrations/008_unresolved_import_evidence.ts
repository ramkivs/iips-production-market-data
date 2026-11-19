import type { Migration } from '../migration_ledger.js';

/**
 * Gate 3 — Migration 008: durable unresolved-import evidence.
 *
 * A partially accepted snapshot persists its resolved holdings and keeps the
 * unresolved rows here rather than dropping them. Every column needed to
 * re-attempt the row later is stored verbatim: the original broker identifiers
 * (`symbol`, `isin`, `exchange`, `series`), the broker-reported values
 * (including the four daily fields), the source broker and lineage digest, and
 * the exact failure reason. `raw_payload` keeps the whole original row so no
 * broker field is lost even if this schema does not model it yet.
 *
 * Purely additive: no existing table or row is touched. A portfolio that never
 * undergoes a partial import keeps an empty table.
 */
export const migration008UnresolvedImportEvidence: Migration = {
  id: '008_unresolved_import_evidence',
  sql: `
CREATE TABLE broker_snapshot_unresolved_rows (
  canonical_owner_id TEXT NOT NULL,
  portfolio_id TEXT NOT NULL,
  import_id TEXT NOT NULL,
  row_ordinal INTEGER NOT NULL,
  observation_time TEXT NOT NULL,
  symbol TEXT NOT NULL,
  isin TEXT,
  exchange TEXT,
  series TEXT,
  quantity REAL NOT NULL,
  average_buy_price REAL NOT NULL,
  current_price REAL NOT NULL,
  market_value REAL NOT NULL,
  dp_qty REAL,
  available_qty REAL,
  profit_loss REAL,
  pnl_percentage REAL,
  source_broker TEXT NOT NULL,
  lineage_digest TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  source_revision TEXT,
  resolution_status TEXT NOT NULL DEFAULT 'OUTSTANDING',
  resolved_at TEXT,
  resolved_company_id TEXT,
  raw_payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (canonical_owner_id, portfolio_id, import_id, row_ordinal)
);
CREATE INDEX idx_broker_unresolved_outstanding
  ON broker_snapshot_unresolved_rows (canonical_owner_id, portfolio_id, resolution_status);
`,
};
