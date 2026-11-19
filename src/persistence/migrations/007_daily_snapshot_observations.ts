import type { Migration } from '../migration_ledger.js';

/**
 * Gate 3 — Migration 007: daily broker-observation snapshot support.
 *
 * Additive only. Three concerns, all nullable or defaulted so that every
 * existing row and every existing writer keeps its exact current meaning:
 *
 *   1. The four broker-reported daily fields that the Dhan detailed export
 *      carries but the persistence boundary previously discarded
 *      (`dp_qty`, `available_qty`, `profit_loss`, `pnl_percentage`). They are
 *      stored VERBATIM as the broker reported them. NULL means "the broker file
 *      did not report this field" and is never back-filled with a calculation.
 *
 *   2. `reconciliation_state` — why this holding is present in this revision.
 *      Distinguishes a row observed in the latest snapshot from one carried
 *      forward because it was absent, from an explicitly exited row. NULL means
 *      "observed, not otherwise classified" (the pre-007 behaviour).
 *
 *   3. `import_id` on revisions and contributions — the durable identity of one
 *      import OPERATION, independent of the source-file content digest. This is
 *      what lets the same broker bytes legitimately represent two different
 *      daily observations while a retry of the same operation stays idempotent.
 *
 * Existing immutable migrations and all stored row values are preserved. No
 * identity is inferred, backfilled or reconstructed here.
 */
export const migration007DailySnapshotObservations: Migration = {
  id: '007_daily_snapshot_observations',
  sql: `
ALTER TABLE portfolio_holdings ADD COLUMN dp_qty REAL;
ALTER TABLE portfolio_holdings ADD COLUMN available_qty REAL;
ALTER TABLE portfolio_holdings ADD COLUMN profit_loss REAL;
ALTER TABLE portfolio_holdings ADD COLUMN pnl_percentage REAL;
ALTER TABLE portfolio_holdings ADD COLUMN reconciliation_state TEXT;

ALTER TABLE portfolio_revisions ADD COLUMN import_id TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN import_id TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN snapshot_state TEXT;
-- NULL means the import did not record an unresolved count (every pre-007 row
-- and every fully-resolved import). It is never fabricated as 0.
ALTER TABLE portfolio_contributions ADD COLUMN unresolved_count INTEGER;

CREATE INDEX idx_portfolio_revisions_import ON portfolio_revisions (canonical_owner_id, portfolio_id, import_id);
CREATE INDEX idx_portfolio_contributions_import ON portfolio_contributions (canonical_owner_id, portfolio_id, import_id);
`,
};
