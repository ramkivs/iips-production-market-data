/**
 * Institutional Investment Platform System (IIPS)
 * Durable Portfolio Data Access (NP04-G24 / Phase C + Phase J)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Immutable revision history: a revision row and its holdings are written once
 * and never updated or deleted. RESET/DELETE create new revisions rather than
 * mutating history.
 */

import type { PersistenceConnection } from '../persistence/connection.js';
import type { UserHoldingInput } from '../../frontend/src/features/portfolio/import/types.js';
import type { BrokerContributionRecord } from '../../frontend/src/features/portfolio/portfolio-store.js';
import { holdingKey } from './consolidation.js';

export type PortfolioOperation = 'INITIAL' | 'MERGE' | 'REPLACE' | 'RESET' | 'DELETE';

interface PortfolioRow {
  portfolio_id: string;
  application_user_id: string;
  tenant_id: string;
  portfolio_name: string;
  current_revision: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RevisionRow {
  portfolio_id: string;
  revision: number;
  operation: string;
  disposition: string | null;
  total_market_value: number;
  weight_sum_percentage: number;
  holdings_count: number;
  provenance_digest: string;
  content_digest: string | null;
  created_at: string;
}

interface HoldingRow {
  portfolio_id: string;
  revision: number;
  holding_key: string;
  symbol: string;
  company_id: string;
  isin: string | null;
  exchange: string | null;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  market_value: number;
  weight_percentage: number;
  active: number;
  source_broker: string;
  lineage_digest: string;
  identity_status: string | null;
  resolution_disposition: string | null;
  created_at: string;
}

interface ContributionRow {
  contribution_id: number;
  portfolio_id: string;
  revision: number;
  source_broker: string;
  file_name: string;
  content_digest: string;
  lineage_digest: string;
  imported_at: string;
  holdings_count: number;
  total_market_value: number;
}

export interface DurablePortfolioRow {
  readonly portfolioId: string;
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly portfolioName: string;
  readonly currentRevision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

function toPortfolioRow(row: PortfolioRow): DurablePortfolioRow {
  return {
    portfolioId: row.portfolio_id,
    applicationUserId: row.application_user_id,
    tenantId: row.tenant_id,
    portfolioName: row.portfolio_name,
    currentRevision: row.current_revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toHolding(row: HoldingRow): UserHoldingInput {
  return {
    symbol: row.symbol,
    companyId: row.company_id,
    isin: row.isin ?? undefined,
    exchange: (row.exchange as 'NSE' | 'BSE' | null) ?? undefined,
    quantity: row.quantity,
    averageBuyPrice: row.average_buy_price,
    currentPrice: row.current_price,
    marketValue: row.market_value,
    weightPercentage: row.weight_percentage,
    active: row.active === 1,
    sourceBroker: row.source_broker as UserHoldingInput['sourceBroker'],
    lineageDigest: row.lineage_digest,
    identityStatus: (row.identity_status as 'RESOLVED' | 'UNRESOLVED' | null) ?? undefined,
    resolutionDisposition:
      (row.resolution_disposition as 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS' | null) ??
      undefined,
  };
}

function toContribution(row: ContributionRow): BrokerContributionRecord {
  return {
    sourceBroker: row.source_broker,
    fileName: row.file_name,
    contentDigest: row.content_digest,
    lineageDigest: row.lineage_digest,
    importedAt: row.imported_at,
    holdingsCount: row.holdings_count,
    totalMarketValue: row.total_market_value,
  };
}

export class PortfolioRepository {
  constructor(private readonly connection: PersistenceConnection) {}

  public insertPortfolio(input: {
    portfolioId: string;
    applicationUserId: string;
    tenantId: string;
    portfolioName: string;
    now: string;
  }): DurablePortfolioRow {
    this.connection
      .prepare(
        `INSERT INTO user_portfolios
           (portfolio_id, application_user_id, tenant_id, portfolio_name, current_revision, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`
      )
      .run(
        input.portfolioId,
        input.applicationUserId,
        input.tenantId,
        input.portfolioName,
        input.now,
        input.now
      );
    return this.findPortfolioRow(input.portfolioId)!;
  }

  public findPortfolioRow(portfolioId: string): DurablePortfolioRow | null {
    const row = this.connection
      .prepare(`SELECT * FROM user_portfolios WHERE portfolio_id = ?`)
      .get(portfolioId) as PortfolioRow | undefined;
    return row ? toPortfolioRow(row) : null;
  }

  /**
   * Authoritative owner+tenant scoped lookup. Returns null for a missing
   * portfolio, a foreign portfolio, a tenant mismatch, or a tombstoned
   * portfolio — so callers cannot distinguish and therefore cannot disclose
   * resource existence.
   */
  public findAuthorizedPortfolio(
    portfolioId: string,
    applicationUserId: string,
    tenantId: string
  ): DurablePortfolioRow | null {
    const row = this.connection
      .prepare(
        `SELECT * FROM user_portfolios
          WHERE portfolio_id = ?
            AND application_user_id = ?
            AND tenant_id = ?
            AND deleted_at IS NULL`
      )
      .get(portfolioId, applicationUserId, tenantId) as PortfolioRow | undefined;
    return row ? toPortfolioRow(row) : null;
  }

  public listAuthorizedPortfolios(
    applicationUserId: string,
    tenantId: string
  ): DurablePortfolioRow[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM user_portfolios
          WHERE application_user_id = ? AND tenant_id = ? AND deleted_at IS NULL
          ORDER BY created_at ASC, portfolio_id ASC`
      )
      .all(applicationUserId, tenantId) as PortfolioRow[];
    return rows.map(toPortfolioRow);
  }

  public tombstonePortfolio(portfolioId: string, now: string): void {
    this.connection
      .prepare(`UPDATE user_portfolios SET deleted_at = ?, updated_at = ? WHERE portfolio_id = ?`)
      .run(now, now, portfolioId);
  }

  public updateCurrentRevision(portfolioId: string, revision: number, now: string): void {
    this.connection
      .prepare(
        `UPDATE user_portfolios SET current_revision = ?, updated_at = ? WHERE portfolio_id = ?`
      )
      .run(revision, now, portfolioId);
  }

  public insertRevision(input: {
    portfolioId: string;
    revision: number;
    operation: PortfolioOperation;
    disposition: string | null;
    totalMarketValue: number;
    weightSumPercentage: number;
    holdingsCount: number;
    provenanceDigest: string;
    contentDigest: string | null;
    createdAt: string;
  }): void {
    this.connection
      .prepare(
        `INSERT INTO portfolio_revisions
           (portfolio_id, revision, operation, disposition, total_market_value,
            weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.portfolioId,
        input.revision,
        input.operation,
        input.disposition,
        input.totalMarketValue,
        input.weightSumPercentage,
        input.holdingsCount,
        input.provenanceDigest,
        input.contentDigest,
        input.createdAt
      );
  }

  public findRevision(portfolioId: string, revision: number): RevisionRow | null {
    const row = this.connection
      .prepare(
        `SELECT * FROM portfolio_revisions WHERE portfolio_id = ? AND revision = ?`
      )
      .get(portfolioId, revision) as RevisionRow | undefined;
    return row ?? null;
  }

  public insertHolding(
    portfolioId: string,
    revision: number,
    holding: UserHoldingInput,
    now: string
  ): void {
    this.connection
      .prepare(
        `INSERT INTO portfolio_revision_holdings
           (portfolio_id, revision, holding_key, symbol, company_id, isin, exchange,
            quantity, average_buy_price, current_price, market_value, weight_percentage,
            active, source_broker, lineage_digest, identity_status, resolution_disposition, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        portfolioId,
        revision,
        holdingKey(holding),
        holding.symbol,
        holding.companyId,
        holding.isin ?? null,
        holding.exchange ?? null,
        holding.quantity,
        holding.averageBuyPrice,
        holding.currentPrice,
        holding.marketValue,
        holding.weightPercentage,
        holding.active ? 1 : 0,
        holding.sourceBroker,
        holding.lineageDigest,
        holding.identityStatus ?? null,
        holding.resolutionDisposition ?? null,
        now
      );
  }

  public listHoldings(portfolioId: string, revision: number): UserHoldingInput[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM portfolio_revision_holdings
          WHERE portfolio_id = ? AND revision = ?
          ORDER BY holding_key ASC`
      )
      .all(portfolioId, revision) as HoldingRow[];
    return rows.map(toHolding);
  }

  public insertContribution(
    portfolioId: string,
    revision: number,
    contribution: BrokerContributionRecord
  ): void {
    this.connection
      .prepare(
        `INSERT INTO portfolio_contributions
           (portfolio_id, revision, source_broker, file_name, content_digest,
            lineage_digest, imported_at, holdings_count, total_market_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        portfolioId,
        revision,
        contribution.sourceBroker,
        contribution.fileName,
        contribution.contentDigest,
        contribution.lineageDigest,
        contribution.importedAt,
        contribution.holdingsCount,
        contribution.totalMarketValue
      );
  }

  public listContributions(portfolioId: string, revision: number): BrokerContributionRecord[] {
    const rows = this.connection
      .prepare(
        `SELECT * FROM portfolio_contributions
          WHERE portfolio_id = ? AND revision = ?
          ORDER BY contribution_id ASC`
      )
      .all(portfolioId, revision) as ContributionRow[];
    return rows.map(toContribution);
  }

  /**
   * Durable content-hash idempotency lookup across the portfolio history.
   * Mirrors the in-memory store's scan over committed contributions.
   */
  public hasContributionDigest(portfolioId: string, contentDigest: string): boolean {
    if (!contentDigest) {
      return false;
    }
    const row = this.connection
      .prepare(
        `SELECT 1 AS hit FROM portfolio_contributions
          WHERE portfolio_id = ? AND content_digest = ? LIMIT 1`
      )
      .get(portfolioId, contentDigest) as { hit: number } | undefined;
    return row !== undefined;
  }

  public insertEvent(input: {
    portfolioId: string;
    revision: number | null;
    eventType: string;
    payload: string | null;
    occurredAt: string;
  }): void {
    this.connection
      .prepare(
        `INSERT INTO portfolio_events (portfolio_id, revision, event_type, payload, occurred_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        input.portfolioId,
        input.revision,
        input.eventType,
        input.payload,
        input.occurredAt
      );
  }

  public listEvents(portfolioId: string): Array<{
    eventId: number;
    revision: number | null;
    eventType: string;
    payload: string | null;
    occurredAt: string;
  }> {
    const rows = this.connection
      .prepare(
        `SELECT event_id AS eventId, revision, event_type AS eventType, payload,
                occurred_at AS occurredAt
           FROM portfolio_events
          WHERE portfolio_id = ?
          ORDER BY event_id ASC`
      )
      .all(portfolioId) as Array<{
      eventId: number;
      revision: number | null;
      eventType: string;
      payload: string | null;
      occurredAt: string;
    }>;
    return rows;
  }
}
