/**
 * Gate 3 — owner-scoped durable portfolio store.
 *
 * The store implements the governed write semantics (immutable revision
 * lifecycle 1 -> 2 -> 3 -> 4, optimistic-revision conflicts, content-hash
 * idempotency and tombstone retention) behind an explicit authorization
 * decision supplied by the caller. The IPC dispatcher never reaches a write
 * while Gate E W-1 is unmet; the PortfolioStorePort evaluates that guard and
 * refuses before touching the store. Reads are owner-scoped: a missing,
 * foreign-owned or tombstoned portfolio share one ResourceUnavailableError so
 * existence cannot be probed across owners.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export class InvalidPortfolioRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPortfolioRequestError';
  }
}

export class RevisionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevisionConflictError';
  }
}

export class ResourceUnavailableError extends Error {
  constructor(message = 'the requested resource is not available') {
    super(message);
    this.name = 'ResourceUnavailableError';
  }
}

export class WriteNotAuthorizedError extends Error {
  constructor(message = 'WRITE_NOT_AUTHORIZED') {
    super(message);
    this.name = 'WriteNotAuthorizedError';
  }
}

export interface HoldingInput {
  symbol: string;
  companyId: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  weightPercentage: number;
  active: boolean;
  sourceBroker: string;
  lineageDigest: string;
  identityStatus: string;
  resolutionDisposition: string;
}

export interface PortfolioSaveRequest {
  readonly name?: string;
  readonly holdings: HoldingInput[];
  readonly provenanceDigest: string;
  readonly operation?: 'MERGE' | 'REPLACE';
  /**
   * The broker file's content digest (contract v1 `portfolio.save` payload
   * field `contentDigest?`; Gate E W-8 / BI-08 idempotency key).
   *
   * When present it is the contribution identity: it is recorded in the
   * contribution ledger and it is the key the W-8 duplicate check uses. When
   * absent, the request's own computed content digest is the contribution
   * identity, so a request that carries no broker digest still gets a stable
   * contribution row and the same duplicate protection.
   */
  readonly contentDigest?: string;
}

export interface OwnerRef {
  readonly canonicalOwnerId: string;
  readonly tenantId: string;
}

/* ------------------------------------------------------------------ *
 * Read projections — accepted wire contract v1 shapes
 * ------------------------------------------------------------------ */

/**
 * `PortfolioSummary` (contract v1 §6, `portfolio.list`).
 *
 * The list projection WITHOUT holdings or contributions. A list item is never
 * a substitute for a full view.
 */
export interface PortfolioSummary {
  readonly portfolioId: string;
  readonly portfolioName: string;
  readonly revision: number;
  readonly holdingsCount: number;
  readonly totalMarketValue: number;
  readonly lastUpdated: string;
}

/**
 * One committed import, as recorded in the durable contribution ledger.
 *
 * The ledger schema is fixed by migration `001_initial_schema` and is not
 * extended here: `contribution_id` carries the import's content digest (the
 * Gate E W-8 / BI-08 idempotency key) and `amount` carries the import's total
 * market value. The contract's per-contribution broker attribution, file name
 * and contribution SHA-256 lineage have no column in the fixed schema and are
 * therefore NOT invented here; see the outstanding schema act.
 */
export interface PortfolioContribution {
  readonly contributionId: string;
  readonly amount: number;
  readonly contributedAt: string;
  readonly createdAt: string;
}

/**
 * `PortfolioDetail` (contract v1 §6, `portfolio.get`).
 *
 * Summary fields plus the holdings snapshot, the contribution ledger, the
 * weight sum and the revision provenance digest.
 */
export interface PortfolioDetail extends PortfolioSummary {
  readonly weightSumPercentage: number;
  readonly provenanceDigest: string;
  readonly holdings: HoldingInput[];
  readonly contributions: PortfolioContribution[];
}

/**
 * `RevisionEntry` (contract v1 §6, `portfolio.revisions`).
 */
export interface RevisionEntry {
  readonly revision: number;
  readonly operation: string;
  /**
   * The commit timestamp of the revision (contract v1 §6 `RevisionEntry`
   * field `committedAt`). The stored column is `portfolio_revisions.created_at`;
   * the wire property name is fixed by contract v1 and by the effective Gate 3
   * act, and is `committedAt`.
   */
  readonly committedAt: string;
  readonly contentDigest?: string;
}

/**
 * Gate E W-1 conjunction. W-1(3) (Gate 4 qualification) and W-1(4) (Gate 5
 * admission) are both false in this build, so the guard can never authorize.
 * No environment flag, test result or operator assertion changes this.
 */
export function evaluatePortSaveGuard(): { authorized: boolean; reasons: string[] } {
  return {
    authorized: false,
    reasons: ['W-1(3): Gate 4 qualification not accepted', 'W-1(4): Gate 5 admission not accepted'],
  };
}

export function computeLineageHash(holdings: readonly HoldingInput[]): string {
  const canonical = holdings
    .map((h) => `${h.symbol}|${h.quantity}|${h.averageBuyPrice}|${h.lineageDigest}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

const IDENTITY_KEY_PATTERN = /(owner|tenant|user|principal|membership|credential|password|secret|token|auth|claim|scope|role|identity|session)/i;

/** C7 store-side scan: caller-supplied identity/authority keys are refused. */
export function findCallerSuppliedIdentityKeys(value: unknown, depth = 0): string[] {
  if (depth > 12 || value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => findCallerSuppliedIdentityKeys(item, depth + 1)))].sort();
  }
  const found = new Set<string>();
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (IDENTITY_KEY_PATTERN.test(key)) found.add(key);
    for (const inner of findCallerSuppliedIdentityKeys(nested, depth + 1)) found.add(inner);
  }
  return [...found].sort();
}

function contentDigestOf(request: PortfolioSaveRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({ holdings: request.holdings, provenance: request.provenanceDigest }), 'utf8')
    .digest('hex');
}

const MAX_REVISIONS = 4;

export class DurablePortfolioStore {
  constructor(private readonly db: DatabaseSync) {}

  list(owner: OwnerRef): PortfolioSummary[] {
    const rows = this.db
      .prepare(
        `SELECT p.portfolio_id       AS portfolio_id,
                p.portfolio_name     AS portfolio_name,
                p.current_revision   AS current_revision,
                p.updated_at         AS updated_at,
                COALESCE(r.holdings_count, 0)     AS holdings_count,
                COALESCE(r.total_market_value, 0) AS total_market_value
           FROM portfolios p
           LEFT JOIN portfolio_revisions r
             ON r.canonical_owner_id = p.canonical_owner_id
            AND r.portfolio_id       = p.portfolio_id
            AND r.revision           = p.current_revision
          WHERE p.canonical_owner_id = ? AND p.tenant_id = ? AND p.status = 'ACTIVE'
          ORDER BY p.portfolio_id`,
      )
      .all(owner.canonicalOwnerId, owner.tenantId) as unknown as Array<{
      portfolio_id: string;
      portfolio_name: string;
      current_revision: number;
      updated_at: string;
      holdings_count: number;
      total_market_value: number;
    }>;
    return rows.map((row) => ({
      portfolioId: row.portfolio_id,
      portfolioName: row.portfolio_name,
      revision: Number(row.current_revision),
      holdingsCount: Number(row.holdings_count),
      totalMarketValue: Number(row.total_market_value),
      lastUpdated: row.updated_at,
    }));
  }

  private resolvePortfolio(
    owner: OwnerRef,
    portfolioId: string,
  ): { currentRevision: number; portfolioName: string; updatedAt: string } {
    const row = this.db
      .prepare(
        `SELECT current_revision, status, portfolio_name, updated_at FROM portfolios
          WHERE canonical_owner_id = ? AND tenant_id = ? AND portfolio_id = ?`,
      )
      .get(owner.canonicalOwnerId, owner.tenantId, portfolioId) as
      | { current_revision: number; status: string; portfolio_name: string; updated_at: string }
      | undefined;
    if (!row || row.status === 'TOMBSTONED') {
      // Missing, foreign and tombstoned are deliberately indistinguishable.
      throw new ResourceUnavailableError();
    }
    return {
      currentRevision: Number(row.current_revision),
      portfolioName: row.portfolio_name,
      updatedAt: row.updated_at,
    };
  }

  get(owner: OwnerRef, portfolioId: string): PortfolioDetail {
    const resolved = this.resolvePortfolio(owner, portfolioId);
    const revisionRow = this.db
      .prepare(
        `SELECT holdings_count, total_market_value, weight_sum_percentage, provenance_digest
           FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?`,
      )
      .get(owner.canonicalOwnerId, portfolioId, resolved.currentRevision) as
      | {
          holdings_count: number;
          total_market_value: number;
          weight_sum_percentage: number;
          provenance_digest: string;
        }
      | undefined;
    const rows = this.db
      .prepare(
        `SELECT holding_key, symbol, company_id, quantity, average_buy_price, current_price,
                market_value, weight_percentage, active, source_broker, lineage_digest,
                identity_status, resolution_disposition
           FROM portfolio_holdings
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?
          ORDER BY holding_key`,
      )
      .all(owner.canonicalOwnerId, portfolioId, resolved.currentRevision) as unknown as Array<Record<string, unknown>>;
    return {
      portfolioId,
      portfolioName: resolved.portfolioName,
      revision: resolved.currentRevision,
      holdingsCount: Number(revisionRow?.holdings_count ?? 0),
      totalMarketValue: Number(revisionRow?.total_market_value ?? 0),
      lastUpdated: resolved.updatedAt,
      weightSumPercentage: Number(revisionRow?.weight_sum_percentage ?? 0),
      provenanceDigest: revisionRow?.provenance_digest ?? '',
      holdings: rows.map((r) => this.holdingFromRow(r)),
      contributions: this.contributions(owner, portfolioId),
    };
  }

  /**
   * The contribution ledger for one portfolio (contract v1 `PortfolioDetail`).
   *
   * Every committed import appends exactly one contribution row whose
   * `contribution_id` is the import's content digest. The row is the durable
   * evidence that a particular broker file was already imported, which is what
   * makes the Gate E W-8 / BI-08 duplicate rule evaluable for a re-import of
   * an *earlier* file and not only for the most recent revision.
   */
  contributions(owner: OwnerRef, portfolioId: string): PortfolioContribution[] {
    const rows = this.db
      .prepare(
        `SELECT contribution_id, amount, contributed_at, created_at FROM portfolio_contributions
          WHERE canonical_owner_id = ? AND portfolio_id = ?
          ORDER BY contributed_at, contribution_id`,
      )
      .all(owner.canonicalOwnerId, portfolioId) as unknown as Array<{
      contribution_id: string;
      amount: number;
      contributed_at: string;
      created_at: string;
    }>;
    return rows.map((row) => ({
      contributionId: row.contribution_id,
      amount: Number(row.amount),
      contributedAt: row.contributed_at,
      createdAt: row.created_at,
    }));
  }

  revisions(owner: OwnerRef, portfolioId: string): RevisionEntry[] {
    this.resolvePortfolio(owner, portfolioId);
    const rows = this.db
      .prepare(
        `SELECT revision, operation, created_at, content_digest FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision`,
      )
      .all(owner.canonicalOwnerId, portfolioId) as unknown as Array<{
      revision: number | bigint;
      operation: string;
      created_at: string;
      content_digest: string | null;
    }>;
    return rows.map((row) => ({
      revision: Number(row.revision),
      operation: row.operation,
      committedAt: row.created_at,
      contentDigest: row.content_digest ?? undefined,
    }));
  }

  private holdingFromRow(r: Record<string, unknown>): HoldingInput {
    return {
      symbol: String(r.symbol),
      companyId: String(r.company_id),
      quantity: Number(r.quantity),
      averageBuyPrice: Number(r.average_buy_price),
      currentPrice: Number(r.current_price),
      marketValue: Number(r.market_value),
      weightPercentage: Number(r.weight_percentage),
      active: Number(r.active) === 1,
      sourceBroker: String(r.source_broker),
      lineageDigest: String(r.lineage_digest),
      identityStatus: String(r.identity_status),
      resolutionDisposition: String(r.resolution_disposition),
    };
  }

  private validate(request: PortfolioSaveRequest): void {
    if (!Array.isArray(request.holdings) || request.holdings.length === 0) {
      throw new InvalidPortfolioRequestError('a portfolio revision requires at least one holding');
    }
    // The C7 scan covers the request envelope only. Holding rows legitimately
    // carry domain identity fields (identityStatus, resolutionDisposition,
    // companyId) that the wire envelope scanner would refuse; those fields are
    // governed domain data inside the revision, not caller-supplied authority.
    const { holdings: _holdings, ...envelopeShape } = request;
    const refused = findCallerSuppliedIdentityKeys(envelopeShape);
    if (refused.length > 0) {
      throw new InvalidPortfolioRequestError(`caller-supplied identity keys are refused: ${refused.join(', ')}`);
    }
    const keys = new Set(request.holdings.map((h) => h.symbol));
    if (keys.size !== request.holdings.length) {
      throw new InvalidPortfolioRequestError('duplicate holding symbols in the request');
    }
  }

  private writeRevision(
    owner: OwnerRef,
    portfolioId: string,
    request: PortfolioSaveRequest,
    operation: 'INITIAL' | 'MERGE' | 'REPLACE' | 'RESET' | 'DELETE',
    expectedRevision: number,
  ): number {
    const current = this.resolvePortfolio(owner, portfolioId);
    if (current.currentRevision !== expectedRevision) {
      throw new RevisionConflictError(
        `expected revision ${expectedRevision} but the portfolio is at ${current.currentRevision}`,
      );
    }
    if (current.currentRevision >= MAX_REVISIONS && operation !== 'DELETE') {
      throw new RevisionConflictError(`the immutable revision lifecycle is capped at ${MAX_REVISIONS}`);
    }
    const nextRevision = expectedRevision + 1;
    const contentDigest = contentDigestOf(request);
    // Gate E W-8 / BI-08: a save whose content digest matches an ALREADY
    // COMMITTED CONTRIBUTION, with operation != REPLACE, is an idempotent
    // no-op: no new revision, no new rows, no duplicated contribution.
    //
    // The check reads the contribution ledger, not only the newest revision,
    // so re-importing an EARLIER broker file is also detected as a duplicate
    // and is not applied a second time.
    const contributionId = request.contentDigest ?? contentDigest;
    if (operation === 'MERGE') {
      const committed = this.db
        .prepare(
          'SELECT 1 AS present FROM portfolio_contributions WHERE canonical_owner_id = ? AND portfolio_id = ? AND contribution_id = ?',
        )
        .get(owner.canonicalOwnerId, portfolioId, contributionId) as { present: number } | undefined;
      if (committed) {
        return expectedRevision;
      }
    }
    const lastRevision = this.db
      .prepare('SELECT content_digest FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision DESC LIMIT 1')
      .get(owner.canonicalOwnerId, portfolioId) as { content_digest: string | null } | undefined;
    if (lastRevision?.content_digest === contentDigest && operation !== 'DELETE') {
      // Content-hash idempotency: no new revision, no new rows.
      return expectedRevision;
    }
    const now = new Date().toISOString();
    const totalMarketValue = request.holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const weightSum = request.holdings.reduce((sum, h) => sum + h.weightPercentage, 0);
    if (operation === 'REPLACE' || operation === 'RESET') {
      // Gate E W-10: REPLACE and RESET start a new contribution set. Prior
      // revisions are preserved; the contribution ledger for this portfolio is
      // the set that is replaced.
      this.db
        .prepare('DELETE FROM portfolio_contributions WHERE canonical_owner_id = ? AND portfolio_id = ?')
        .run(owner.canonicalOwnerId, portfolioId);
    }
    this.db
      .prepare(
        `INSERT INTO portfolio_revisions
           (portfolio_id, canonical_owner_id, revision, operation, total_market_value,
            weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        portfolioId,
        owner.canonicalOwnerId,
        nextRevision,
        operation,
        totalMarketValue,
        weightSum,
        request.holdings.length,
        request.provenanceDigest,
        contentDigest,
        now,
      );
    const insertHolding = this.db.prepare(
      `INSERT INTO portfolio_holdings
         (canonical_owner_id, portfolio_id, revision, holding_key, symbol, company_id,
          quantity, average_buy_price, current_price, market_value, weight_percentage,
          active, source_broker, lineage_digest, identity_status, resolution_disposition, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const h of request.holdings) {
      insertHolding.run(
        owner.canonicalOwnerId,
        portfolioId,
        nextRevision,
        h.symbol,
        h.symbol,
        h.companyId,
        h.quantity,
        h.averageBuyPrice,
        h.currentPrice,
        h.marketValue,
        h.weightPercentage,
        h.active ? 1 : 0,
        h.sourceBroker,
        h.lineageDigest,
        h.identityStatus,
        h.resolutionDisposition,
        now,
      );
    }
    this.db
      .prepare('UPDATE portfolios SET current_revision = ?, updated_at = ? WHERE canonical_owner_id = ? AND portfolio_id = ?')
      .run(nextRevision, now, owner.canonicalOwnerId, portfolioId);
    // The contribution ledger: exactly one row per committed import, keyed by
    // the import's content digest (Gate E W-8 / BI-08). It is the durable
    // evidence that a broker file was already imported, which is what the
    // duplicate check above reads.
    this.db
      .prepare(
        `INSERT INTO portfolio_contributions
           (canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(owner.canonicalOwnerId, portfolioId, contributionId, totalMarketValue, now, now);
    return nextRevision;
  }

  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number {
    this.validate(request);
    const existing = this.db
      .prepare('SELECT 1 FROM portfolios WHERE canonical_owner_id = ? AND portfolio_id = ?')
      .get(owner.canonicalOwnerId, portfolioId);
    if (existing) {
      throw new InvalidPortfolioRequestError(`portfolio already exists: ${portfolioId}`);
    }
    const now = new Date().toISOString();
    // Start at revision 0; the INITIAL revision write below moves it to 1
    // through the same conflict-checked path as every later revision.
    this.db
      .prepare(
        `INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name,
                                 current_revision, status, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, 0, 'ACTIVE', ?, ?, NULL)`,
      )
      .run(portfolioId, owner.canonicalOwnerId, owner.tenantId, request.name ?? portfolioId, now, now);
    return this.writeRevision(owner, portfolioId, request, 'INITIAL', 0);
  }

  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.validate(request);
    return this.writeRevision(owner, portfolioId, request, request.operation === 'REPLACE' ? 'REPLACE' : 'MERGE', expectedRevision);
  }

  reset(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    this.validate(request);
    return this.writeRevision(owner, portfolioId, request, 'RESET', expectedRevision);
  }

  delete(owner: OwnerRef, portfolioId: string, expectedRevision: number): void {
    const current = this.resolvePortfolio(owner, portfolioId);
    if (current.currentRevision !== expectedRevision) {
      throw new RevisionConflictError(
        `expected revision ${expectedRevision} but the portfolio is at ${current.currentRevision}`,
      );
    }
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO portfolio_revisions
           (portfolio_id, canonical_owner_id, revision, operation, total_market_value,
            weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
         VALUES (?, ?, ?, 'DELETE', 0, 0, 0, ?, NULL, ?)`,
      )
      .run(portfolioId, owner.canonicalOwnerId, expectedRevision + 1, `tombstone:${portfolioId}`, now);
    this.db
      .prepare(
        `UPDATE portfolios SET status = 'TOMBSTONED', deleted_at = ?, updated_at = ?
          WHERE canonical_owner_id = ? AND portfolio_id = ?`,
      )
      .run(now, now, owner.canonicalOwnerId, portfolioId);
  }
}
