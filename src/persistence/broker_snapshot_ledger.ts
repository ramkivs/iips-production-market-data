/**
 * Durable ledger and ledger readback for daily broker snapshots.
 *
 * Two things the plain import path cannot express, both persisted here:
 *
 *   1. UNRESOLVED EVIDENCE. When the operator accepts a partial snapshot, the
 *      unresolved rows are NOT discarded and NOT written as holdings. They are
 *      retained verbatim — original broker identifiers, attempted identity
 *      inputs and the exact failure reason — as a durable unresolved-import
 *      record bound to the import operation. The outstanding count stays
 *      visible until each row is resolved or explicitly abandoned.
 *
 *   2. LEDGER READBACK. Which import operations exist, when each was recorded,
 *      which revision it produced, and whether it was accepted or partially
 *      accepted. A retry is idempotent on `import_id`, so the ledger is also how
 *      a caller discovers that an operation already happened.
 *
 * Nothing here invents an identity, promotes an unresolved row, or advances a
 * quantity. Resolution is a separate, explicit, later operation that re-uses the
 * same durable statement rather than re-importing the file.
 */
import type { DatabaseSync } from 'node:sqlite';
import type { BrokerSnapshotUnresolvedRow } from '../contracts/broker_import_ipc.js';

/** Migration 008 — the unresolved-evidence store. */
export const UNRESOLVED_EVIDENCE_SCHEMA = `
CREATE TABLE IF NOT EXISTS broker_snapshot_unresolved_rows (
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
CREATE INDEX IF NOT EXISTS idx_broker_unresolved_outstanding
  ON broker_snapshot_unresolved_rows (canonical_owner_id, portfolio_id, resolution_status);
`;

export type UnresolvedRowStatus = 'OUTSTANDING' | 'RESOLVED' | 'ABANDONED';

export interface UnresolvedEvidenceRow extends BrokerSnapshotUnresolvedRow {
  readonly importId: string;
  readonly rowOrdinal: number;
  readonly observationTime: string;
  readonly resolutionStatus: UnresolvedRowStatus;
  readonly resolvedAt?: string | null;
  readonly resolvedCompanyId?: string | null;
}

export interface UnresolvedEvidenceWriteContext {
  readonly canonicalOwnerId: string;
  readonly portfolioId: string;
  readonly importId: string;
  readonly observationTime: string;
  readonly createdAt: string;
}

/**
 * Persists the unresolved rows of one accepted partial snapshot.
 *
 * Callers must already be inside the import transaction: evidence and the
 * accepted holdings commit together or not at all, so a snapshot can never be
 * recorded as accepted while its unresolved evidence is missing.
 */
export function recordUnresolvedEvidence(
  db: DatabaseSync,
  context: UnresolvedEvidenceWriteContext,
  rows: readonly BrokerSnapshotUnresolvedRow[],
): number {
  if (rows.length === 0) return 0;
  const statement = db.prepare(
    `INSERT INTO broker_snapshot_unresolved_rows
       (canonical_owner_id, portfolio_id, import_id, row_ordinal, observation_time, symbol, isin,
        exchange, series, quantity, average_buy_price, current_price, market_value, dp_qty,
        available_qty, profit_loss, pnl_percentage, source_broker, lineage_digest, failure_reason,
        source_revision, resolution_status, raw_payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OUTSTANDING', ?, ?)`,
  );
  rows.forEach((row, index) => {
    statement.run(
      context.canonicalOwnerId,
      context.portfolioId,
      context.importId,
      index,
      context.observationTime,
      row.symbol,
      row.isin ?? null,
      row.exchange ?? null,
      row.series ?? null,
      row.quantity,
      row.averageBuyPrice,
      row.currentPrice,
      row.marketValue,
      row.dpQty ?? null,
      row.availableQty ?? null,
      row.profitLoss ?? null,
      row.pnlPercentage ?? null,
      row.sourceBroker,
      row.lineageDigest,
      row.reason,
      row.sourceRevision ?? null,
      // The original broker identifiers are preserved verbatim, including any
      // field this application does not otherwise model.
      JSON.stringify({ ...(row as unknown as Record<string, unknown>), reason: row.reason }),
      context.createdAt,
    );
  });
  return rows.length;
}

/** Reads back the retained unresolved evidence for one import operation. */
export function readUnresolvedEvidence(
  db: DatabaseSync,
  canonicalOwnerId: string,
  portfolioId: string,
  importId: string,
): UnresolvedEvidenceRow[] {
  const rows = db
    .prepare(
      `SELECT import_id, row_ordinal, observation_time, symbol, isin, exchange, series, quantity,
              average_buy_price, current_price, market_value, dp_qty, available_qty, profit_loss,
              pnl_percentage, source_broker, lineage_digest, failure_reason, source_revision,
              resolution_status, resolved_at, resolved_company_id
         FROM broker_snapshot_unresolved_rows
        WHERE canonical_owner_id = ? AND portfolio_id = ? AND import_id = ?
        ORDER BY row_ordinal`,
    )
    .all(canonicalOwnerId, portfolioId, importId) as unknown as Array<{
    import_id: string;
    row_ordinal: number;
    observation_time: string;
    symbol: string;
    isin: string | null;
    exchange: 'NSE' | 'BSE' | null;
    series: string | null;
    quantity: number;
    average_buy_price: number;
    current_price: number;
    market_value: number;
    dp_qty: number | null;
    available_qty: number | null;
    profit_loss: number | null;
    pnl_percentage: number | null;
    source_broker: string;
    lineage_digest: string;
    failure_reason: string;
    source_revision: string | null;
    resolution_status: UnresolvedRowStatus;
    resolved_at: string | null;
    resolved_company_id: string | null;
  }>;
  return rows.map((row) => ({
    importId: row.import_id,
    rowOrdinal: row.row_ordinal,
    observationTime: row.observation_time,
    symbol: row.symbol,
    isin: row.isin ?? undefined,
    exchange: row.exchange ?? undefined,
    series: row.series ?? undefined,
    quantity: Number(row.quantity),
    averageBuyPrice: Number(row.average_buy_price),
    currentPrice: Number(row.current_price),
    marketValue: Number(row.market_value),
    dpQty: row.dp_qty === null ? null : Number(row.dp_qty),
    availableQty: row.available_qty === null ? null : Number(row.available_qty),
    profitLoss: row.profit_loss === null ? null : Number(row.profit_loss),
    pnlPercentage: row.pnl_percentage === null ? null : Number(row.pnl_percentage),
    sourceBroker: row.source_broker,
    lineageDigest: row.lineage_digest,
    reason: row.failure_reason,
    sourceRevision: row.source_revision ?? undefined,
    resolutionStatus: row.resolution_status,
    resolvedAt: row.resolved_at,
    resolvedCompanyId: row.resolved_company_id,
  }));
}

/** Outstanding unresolved rows still awaiting resolution for this portfolio. */
export function countOutstandingUnresolved(
  db: DatabaseSync,
  canonicalOwnerId: string,
  portfolioId: string,
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS outstanding FROM broker_snapshot_unresolved_rows
        WHERE canonical_owner_id = ? AND portfolio_id = ? AND resolution_status = 'OUTSTANDING'`,
    )
    .get(canonicalOwnerId, portfolioId) as { outstanding: number } | undefined;
  return row ? Number(row.outstanding) : 0;
}

/**
 * Marks one retained row resolved. This is the "later resolution without
 * re-import" step: it closes the outstanding evidence and hands the caller the
 * ORIGINAL broker row values (never re-read from the file, which may no longer
 * exist), so the holding can be persisted through the normal write path.
 *
 * Returns null when no outstanding row matches, so a caller can never
 * double-resolve or resolve something it did not see.
 */
export function resolveUnresolvedRow(
  db: DatabaseSync,
  canonicalOwnerId: string,
  portfolioId: string,
  importId: string,
  rowOrdinal: number,
  companyId: string,
  resolvedAt: string,
): UnresolvedEvidenceRow | null {
  const before = readUnresolvedEvidence(db, canonicalOwnerId, portfolioId, importId).find(
    (row) => row.rowOrdinal === rowOrdinal && row.resolutionStatus === 'OUTSTANDING',
  );
  if (!before) return null;
  db.prepare(
    `UPDATE broker_snapshot_unresolved_rows
        SET resolution_status = 'RESOLVED', resolved_at = ?, resolved_company_id = ?
      WHERE canonical_owner_id = ? AND portfolio_id = ? AND import_id = ? AND row_ordinal = ?
        AND resolution_status = 'OUTSTANDING'`,
  ).run(resolvedAt, companyId, canonicalOwnerId, portfolioId, importId, rowOrdinal);
  return {
    ...before,
    resolutionStatus: 'RESOLVED',
    resolvedAt,
    resolvedCompanyId: companyId,
  };
}
