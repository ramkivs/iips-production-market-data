import type { Migration } from '../migration_ledger.js';

/** Additive broker-import attribution; historical rows intentionally stay NULL. */
export const migration004PortfolioContributionProvenance: Migration = {
  id: '004_portfolio_contribution_provenance',
  sql: `
ALTER TABLE portfolio_contributions ADD COLUMN file_name TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN source_broker TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN content_digest TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN lineage_digest TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN imported_at TEXT;
ALTER TABLE portfolio_contributions ADD COLUMN contribution_semantics TEXT
  CHECK (contribution_semantics IS NULL OR contribution_semantics IN ('SAVED_NEW_BATCH', 'MERGED_INTO_EXISTING', 'RESET', 'REPLACE'));
`,
};
