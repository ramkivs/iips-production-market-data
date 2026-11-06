import type { Migration } from '../migration_ledger.js';

/**
 * Gate 3 — Migration 005: durable exact P04 D114 security identity on holdings.
 *
 * Additive and nullable: `security_identity` stores the canonical
 * `ISIN:<isin>:<series>` identity (JSON) exactly as supplied by authoritative
 * evidence. SQL NULL is the explicit "unresolved" fact for legacy rows — no
 * identity is ever inferred, backfilled or reconstructed by this migration.
 */
export const migration005HoldingSecurityIdentity: Migration = {
  id: '005_holding_security_identity',
  sql: `
ALTER TABLE portfolio_holdings ADD COLUMN security_identity TEXT;
`,
};
