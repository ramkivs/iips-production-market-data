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
}

export interface OwnerRef {
  readonly canonicalOwnerId: string;
  readonly tenantId: string;
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

  list(owner: OwnerRef): Array<{ portfolioId: string; name: string; currentRevision: number }> {
    const rows = this.db
      .prepare(
        `SELECT portfolio_id, portfolio_name, current_revision
           FROM portfolios
          WHERE canonical_owner_id = ? AND tenant_id = ? AND status = 'ACTIVE'
          ORDER BY portfolio_id`,
      )
      .all(owner.canonicalOwnerId, owner.tenantId) as unknown as Array<{
      portfolio_id: string;
      portfolio_name: string;
      current_revision: number;
    }>;
    return rows.map((row) => ({
      portfolioId: row.portfolio_id,
      name: row.portfolio_name,
      currentRevision: Number(row.current_revision),
    }));
  }

  private resolvePortfolio(owner: OwnerRef, portfolioId: string): { currentRevision: number } {
    const row = this.db
      .prepare(
        `SELECT current_revision, status FROM portfolios
          WHERE canonical_owner_id = ? AND tenant_id = ? AND portfolio_id = ?`,
      )
      .get(owner.canonicalOwnerId, owner.tenantId, portfolioId) as
      | { current_revision: number; status: string }
      | undefined;
    if (!row || row.status === 'TOMBSTONED') {
      // Missing, foreign and tombstoned are deliberately indistinguishable.
      throw new ResourceUnavailableError();
    }
    return { currentRevision: Number(row.current_revision) };
  }

  get(owner: OwnerRef, portfolioId: string): {
    portfolioId: string;
    revision: number;
    holdings: HoldingInput[];
  } {
    const resolved = this.resolvePortfolio(owner, portfolioId);
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
      revision: resolved.currentRevision,
      holdings: rows.map((r) => this.holdingFromRow(r)),
    };
  }

  revisions(owner: OwnerRef, portfolioId: string): Array<{ revision: number; operation: string; createdAt: string }> {
    this.resolvePortfolio(owner, portfolioId);
    const rows = this.db
      .prepare(
        `SELECT revision, operation, created_at FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision`,
      )
      .all(owner.canonicalOwnerId, portfolioId) as unknown as Array<{
      revision: number | bigint;
      operation: string;
      created_at: string;
    }>;
    return rows.map((row) => ({
      revision: Number(row.revision),
      operation: row.operation,
      createdAt: row.created_at,
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
