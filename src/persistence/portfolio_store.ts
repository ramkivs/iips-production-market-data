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
import { BindingAbsentError, BindingInvalidError, resolveActiveBindingInCurrentTransaction } from './binding.js';

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

export class CommitOutcomeUnknownError extends Error {
  constructor(message = 'The transaction commit outcome could not be established') {
    super(message);
    this.name = 'CommitOutcomeUnknownError';
  }
}

/**
 * CAP-03 DR-2 / DQ-1 Option A — a stored read row cannot be projected without
 * inventing a value. Missing, null, non-finite, wrong-typed or otherwise
 * non-conforming required values throw before any read result is built.
 *
 * This is deliberately NOT `ResourceUnavailableError`: that error is reserved
 * for missing, foreign-owned and tombstoned portfolios, which the dispatcher
 * reports as `RESOURCE_UNAVAILABLE`. The dispatcher maps this error to the
 * generic Class A `UNAVAILABLE` outcome, which the IRR adapter maps to
 * `UPSTREAM_UNAVAILABLE` — the established contract-envelope refusal.
 */
export class ContractEnvelopeViolationError extends Error {
  constructor(detail: string) {
    super(`contract-envelope violation: ${detail}`);
    this.name = 'ContractEnvelopeViolationError';
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

export type ContributionSemantics = 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'RESET' | 'REPLACE';

export interface BrokerImportProvenance {
  readonly fileName: string;
  readonly sourceBroker: string;
  readonly contentDigest: string;
  readonly lineageDigest: string;
  readonly importedAt: string;
  readonly semantics: ContributionSemantics;
}

export interface PortfolioSaveRequest {
  readonly name?: string;
  readonly brokerImportProvenance?: BrokerImportProvenance;
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
 * `PortfolioSummary` (contract v1 §6, `portfolio.list`) plus the three CAP-03
 * DR-2 / DQ-1 Option A stored values.
 *
 * The list projection WITHOUT holdings or contributions. A list item is never
 * a substitute for a full view. The v1 wire names are preserved exactly: the
 * only authorized `holdingsCount` -> `totalHoldingsCount` rename happens at
 * the IRR adapter boundary, never here.
 */
export interface PortfolioSummary {
  readonly portfolioId: string;
  readonly portfolioName: string;
  readonly revision: number;
  readonly holdingsCount: number;
  readonly totalMarketValue: number;
  readonly lastUpdated: string;
  /** The current revision's stored `weight_sum_percentage`. */
  readonly weightSumPercentage: number;
  /** The current revision's stored `provenance_digest` (empty is a stored fact). */
  readonly provenanceDigest: string;
  /** Materialized state of the CURRENT revision's operation only. */
  readonly isSaved: boolean;
}

/**
 * One committed import, as recorded in the durable contribution ledger.
 *
 * Migration `004_portfolio_contribution_provenance` adds nullable, additive
 * provenance fields. Existing rows remain NULL for facts that were not recorded
 * before the migration; import writers populate these fields only from the
 * broker-ingress request and computed lineage evidence.
 */
export interface PortfolioContribution {
  readonly contributionId: string;
  readonly amount: number;
  readonly contributedAt: string;
  readonly createdAt: string;
  readonly fileName: string | null;
  readonly sourceBroker: string | null;
  readonly contentDigest: string | null;
  readonly lineageDigest: string | null;
  readonly importedAt: string | null;
  readonly semantics: ContributionSemantics | null;
}

/**
 * `PortfolioDetail` (contract v1 §6, `portfolio.get`).
 *
 * Summary fields (including the DR-2 current-revision values and `isSaved`)
 * plus the holdings snapshot and the contribution ledger. `durability` and
 * `durable` remain absent under DR-3 / DQ-2; neither a claim nor a sentinel
 * is emitted here.
 */
export interface PortfolioDetail extends PortfolioSummary {
  readonly holdings: HoldingInput[];
  readonly contributions: PortfolioContribution[];
}

/**
 * `RevisionEntry` (contract v1 §6, `portfolio.revisions`) plus the three
 * DR-2 / DQ-1 stored-row values. Every value comes from THIS historical row;
 * no current-revision value is borrowed and `isSaved` is deliberately absent
 * from the frozen history-entry shape.
 */
export interface RevisionEntry {
  readonly revision: number;
  readonly operation: string;
  /**
   * The commit timestamp of the revision (contract v1 §6 `RevisionEntry`
   * field `committedAt`). The stored column is `portfolio_revisions.created_at`;
   * the wire property name is fixed by contract v1 and by the effective Gate 3
   * act, and is `committedAt`. The only authorized rename to `createdAt`
   * happens at the IRR adapter boundary.
   */
  readonly committedAt: string;
  readonly contentDigest?: string;
  /** This revision's stored `total_market_value`. */
  readonly totalMarketValue: number;
  /** This revision's stored `provenance_digest` (empty is a stored fact). */
  readonly provenanceDigest: string;
  /** This revision's stored `holdings_count` (NOT the G2 summary rename). */
  readonly holdingsCount: number;
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

/* ------------------------------------------------------------------ *
 * CAP-03 DR-2 / DQ-1 read projections — validate or refuse, never default
 * ------------------------------------------------------------------ */

/** The closed stored operation vocabulary (contract v1 §6). */
const STORED_OPERATIONS: readonly string[] = ['INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE'];

type StoredRow = Record<string, unknown>;

function refuseStoredValue(shape: string, field: string, requirement: string): never {
  throw new ContractEnvelopeViolationError(
    `${shape} has a missing, null or non-conforming ${field}; ${requirement} is required and no default may be fabricated`,
  );
}

function storedFiniteNumber(row: StoredRow, field: string, shape: string): number {
  const value = row[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    refuseStoredValue(shape, field, 'a finite stored number');
  }
  return value;
}

function storedNonNegativeInteger(row: StoredRow, field: string, shape: string): number {
  const value = storedFiniteNumber(row, field, shape);
  if (!Number.isInteger(value) || value < 0) {
    refuseStoredValue(shape, field, 'a non-negative stored integer');
  }
  return value;
}

function storedString(row: StoredRow, field: string, shape: string, nonBlank = false): string {
  const value = row[field];
  if (typeof value !== 'string' || (nonBlank && value.trim().length === 0)) {
    refuseStoredValue(shape, field, nonBlank ? 'a non-blank stored string' : 'a stored string');
  }
  return value;
}

function storedOperation(row: StoredRow, field: string, shape: string): string {
  const value = storedString(row, field, shape, true);
  if (!STORED_OPERATIONS.includes(value)) {
    refuseStoredValue(shape, field, 'a stored operation in the closed contract vocabulary');
  }
  return value;
}

/**
 * The DQ-1 current-revision materialized-state rule, and NOTHING else:
 * MERGE/REPLACE => true, INITIAL/RESET => false. A DELETE or unknown current
 * operation has no lawful `isSaved` value, so no result is emitted at all.
 */
function isSavedForCurrentOperation(operation: string, shape: string): boolean {
  if (operation === 'MERGE' || operation === 'REPLACE') return true;
  if (operation === 'INITIAL' || operation === 'RESET') return false;
  return refuseStoredValue(shape, 'operation', 'a current INITIAL/MERGE/REPLACE/RESET operation');
}

interface ProjectionBase {
  readonly portfolioId: string;
  readonly portfolioName: string;
  readonly revision: number;
  readonly lastUpdated: string;
}

interface CurrentRevisionProjection {
  readonly holdingsCount: number;
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  readonly provenanceDigest: string;
  readonly isSaved: boolean;
}

function projectPortfolioBase(row: StoredRow, shape: string): ProjectionBase {
  return {
    portfolioId: storedString(row, 'portfolio_id', shape, true),
    portfolioName: storedString(row, 'portfolio_name', shape, true),
    revision: storedNonNegativeInteger(row, 'current_revision', shape),
    lastUpdated: storedString(row, 'updated_at', shape, true),
  };
}

function projectCurrentRevision(row: StoredRow, shape: string): CurrentRevisionProjection {
  return {
    holdingsCount: storedNonNegativeInteger(row, 'holdings_count', shape),
    totalMarketValue: storedFiniteNumber(row, 'total_market_value', shape),
    weightSumPercentage: storedFiniteNumber(row, 'weight_sum_percentage', shape),
    // An empty digest is a legitimate stored fact. Only a non-string is refused.
    provenanceDigest: storedString(row, 'provenance_digest', shape),
    isSaved: isSavedForCurrentOperation(storedOperation(row, 'operation', shape), shape),
  };
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
  private transactionDepth = 0;

  constructor(
    private readonly db: DatabaseSync,
    private readonly testHooks?: { afterMutation?: (step: string) => void; afterCommit?: () => void },
  ) {}

  private afterMutation(step: string): void {
    this.testHooks?.afterMutation?.(step);
  }

  private withTransaction<T>(work: () => T): T {
    if (this.transactionDepth > 0) return work();
    this.db.exec('BEGIN IMMEDIATE;');
    this.transactionDepth += 1;
    let commitAttempted = false;
    try {
      const result = work();
      commitAttempted = true;
      this.db.exec('COMMIT;');
      this.testHooks?.afterCommit?.();
      return result;
    } catch (error) {
      if (commitAttempted && !this.db.isTransaction) {
        throw new CommitOutcomeUnknownError();
      }
      if (this.db.isTransaction) {
        try {
          this.db.exec('ROLLBACK;');
        } catch {
          throw new CommitOutcomeUnknownError();
        }
      } else {
        throw new CommitOutcomeUnknownError();
      }
      throw error;
    } finally {
      this.transactionDepth -= 1;
    }
  }

  /**
   * Runs one broker-import request under one SQLite write transaction and
   * revalidates the sole active owner while revocation is serialized.
   */
  withBrokerImportTransaction<T>(owner: OwnerRef, work: (store: this) => T): T {
    return this.withTransaction(() => {
      let active;
      try {
        active = resolveActiveBindingInCurrentTransaction(this.db);
      } catch (error) {
        if (error instanceof BindingAbsentError || error instanceof BindingInvalidError) {
          throw new ResourceUnavailableError();
        }
        throw error;
      }
      if (active.canonicalOwnerId !== owner.canonicalOwnerId || active.tenantId !== owner.tenantId) {
        throw new ResourceUnavailableError();
      }
      return work(this);
    });
  }

  /**
   * `portfolio.list`: every value comes from the ACTIVE portfolio row and its
   * OWN current revision row. The LEFT JOIN is retained so a portfolio whose
   * current revision row is absent is not silently dropped from the list: the
   * joined NULLs are refused as a contract-envelope violation instead of being
   * collapsed to zero by `COALESCE`. No owner/tenant value is disclosed.
   */
  list(owner: OwnerRef): PortfolioSummary[] {
    const rows = this.db
      .prepare(
        `SELECT p.portfolio_id       AS portfolio_id,
                p.portfolio_name     AS portfolio_name,
                p.current_revision   AS current_revision,
                p.updated_at         AS updated_at,
                r.holdings_count     AS holdings_count,
                r.total_market_value AS total_market_value,
                r.weight_sum_percentage AS weight_sum_percentage,
                r.provenance_digest  AS provenance_digest,
                r.operation          AS operation
           FROM portfolios p
           LEFT JOIN portfolio_revisions r
             ON r.canonical_owner_id = p.canonical_owner_id
            AND r.portfolio_id       = p.portfolio_id
            AND r.revision           = p.current_revision
          WHERE p.canonical_owner_id = ? AND p.tenant_id = ? AND p.status = 'ACTIVE'
          ORDER BY p.portfolio_id`,
      )
      .all(owner.canonicalOwnerId, owner.tenantId) as unknown as StoredRow[];
    return rows.map((row) => ({
      ...projectPortfolioBase(row, 'portfolio.list'),
      ...projectCurrentRevision(row, 'portfolio.list'),
    }));
  }

  private resolvePortfolio(
    owner: OwnerRef,
    portfolioId: string,
  ): { portfolioId: string; currentRevision: number; portfolioName: string; updatedAt: string } {
    const row = this.db
      .prepare(
        `SELECT portfolio_id, current_revision, status, portfolio_name, updated_at FROM portfolios
          WHERE canonical_owner_id = ? AND tenant_id = ? AND portfolio_id = ?`,
      )
      .get(owner.canonicalOwnerId, owner.tenantId, portfolioId) as
      | { portfolio_id: string; current_revision: number; status: string; portfolio_name: string; updated_at: string }
      | undefined;
    if (!row || row.status === 'TOMBSTONED') {
      // Missing, foreign and tombstoned are deliberately indistinguishable.
      // This check happens BEFORE any stored-value projection, so an
      // unavailable portfolio never emits `isSaved` or any other field.
      throw new ResourceUnavailableError();
    }
    return {
      portfolioId: row.portfolio_id,
      currentRevision: Number(row.current_revision),
      portfolioName: row.portfolio_name,
      updatedAt: row.updated_at,
    };
  }

  /**
   * `portfolio.get`: the current revision's OWN stored row supplies the seven
   * approved values and the lifecycle flag. A missing current-revision row is
   * refused, not replaced with zeros/empty string (the former `?? 0` / `?? ''`
   * defaults are removed). `durable`/`durability` are not emitted.
   */
  get(owner: OwnerRef, portfolioId: string): PortfolioDetail {
    const resolved = this.resolvePortfolio(owner, portfolioId);
    const base = projectPortfolioBase(
      {
        portfolio_id: resolved.portfolioId,
        portfolio_name: resolved.portfolioName,
        current_revision: resolved.currentRevision,
        updated_at: resolved.updatedAt,
      },
      'portfolio.get',
    );
    const revisionRow = this.db
      .prepare(
        `SELECT holdings_count, total_market_value, weight_sum_percentage, provenance_digest, operation
           FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?`,
      )
      .get(owner.canonicalOwnerId, portfolioId, resolved.currentRevision) as StoredRow | undefined;
    if (!revisionRow) {
      throw new ContractEnvelopeViolationError(
        'portfolio.get has no stored row for the current revision; no value may be fabricated',
      );
    }
    const current = projectCurrentRevision(revisionRow, 'portfolio.get');
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
      ...base,
      ...current,
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
        `SELECT contribution_id, amount, contributed_at, created_at, file_name, source_broker,
                content_digest, lineage_digest, imported_at, contribution_semantics
           FROM portfolio_contributions
          WHERE canonical_owner_id = ? AND portfolio_id = ?
          ORDER BY contributed_at, contribution_id`,
      )
      .all(owner.canonicalOwnerId, portfolioId) as unknown as Array<{
      contribution_id: string;
      amount: number;
      contributed_at: string;
      created_at: string;
      file_name: string | null;
      source_broker: string | null;
      content_digest: string | null;
      lineage_digest: string | null;
      imported_at: string | null;
      contribution_semantics: ContributionSemantics | null;
    }>;
    return rows.map((row) => ({
      contributionId: row.contribution_id,
      amount: Number(row.amount),
      contributedAt: row.contributed_at,
      createdAt: row.created_at,
      fileName: row.file_name,
      sourceBroker: row.source_broker,
      contentDigest: row.content_digest,
      lineageDigest: row.lineage_digest,
      importedAt: row.imported_at,
      semantics: row.contribution_semantics,
    }));
  }

  /**
   * `portfolio.revisions`: each entry is projected from ITS OWN stored row.
   * The current revision is consulted for availability only; no current value
   * is borrowed for a historical entry, and `isSaved` is not part of the frozen
   * history-entry shape. `committedAt` stays the v1 wire name.
   */
  revisions(owner: OwnerRef, portfolioId: string): RevisionEntry[] {
    this.resolvePortfolio(owner, portfolioId);
    const rows = this.db
      .prepare(
        `SELECT revision, operation, created_at, content_digest, total_market_value,
                provenance_digest, holdings_count
           FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision`,
      )
      .all(owner.canonicalOwnerId, portfolioId) as unknown as StoredRow[];
    return rows.map((row) => {
      const shape = 'portfolio.revisions';
      const revision = storedNonNegativeInteger(row, 'revision', shape);
      const operation = storedOperation(row, 'operation', shape);
      const committedAt = storedString(row, 'created_at', shape, true);
      const totalMarketValue = storedFiniteNumber(row, 'total_market_value', shape);
      const provenanceDigest = storedString(row, 'provenance_digest', shape);
      const holdingsCount = storedNonNegativeInteger(row, 'holdings_count', shape);
      const rawDigest = row.content_digest;
      if (rawDigest !== null && rawDigest !== undefined && typeof rawDigest !== 'string') {
        refuseStoredValue(shape, 'content_digest', 'a stored string or SQL NULL');
      }
      return {
        revision,
        operation,
        committedAt,
        // SQL NULL means the optional v1 property is genuinely absent.
        ...(typeof rawDigest === 'string' ? { contentDigest: rawDigest } : {}),
        totalMarketValue,
        provenanceDigest,
        holdingsCount,
      };
    });
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
      this.afterMutation('contributions-delete');
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
    this.afterMutation('revision-insert');
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
      this.afterMutation(`holding-insert:${h.symbol}`);
    }
    this.db
      .prepare('UPDATE portfolios SET current_revision = ?, updated_at = ? WHERE canonical_owner_id = ? AND portfolio_id = ?')
      .run(nextRevision, now, owner.canonicalOwnerId, portfolioId);
    this.afterMutation('portfolio-update');
    // The contribution ledger: exactly one row per committed import, keyed by
    // the import's content digest (Gate E W-8 / BI-08). It is the durable
    // evidence that a broker file was already imported, which is what the
    // duplicate check above reads.
    this.db
      .prepare(
        `INSERT INTO portfolio_contributions
           (canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at,
            file_name, source_broker, content_digest, lineage_digest, imported_at, contribution_semantics)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        owner.canonicalOwnerId,
        portfolioId,
        contributionId,
        totalMarketValue,
        now,
        now,
        request.brokerImportProvenance?.fileName ?? null,
        request.brokerImportProvenance?.sourceBroker ?? null,
        request.brokerImportProvenance?.contentDigest ?? null,
        request.brokerImportProvenance?.lineageDigest ?? null,
        request.brokerImportProvenance?.importedAt ?? null,
        request.brokerImportProvenance?.semantics ?? null,
      );
    this.afterMutation('contribution-insert');
    return nextRevision;
  }

  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number {
    return this.withTransaction(() => {
      this.validate(request);
      const existing = this.db
        .prepare('SELECT 1 FROM portfolios WHERE canonical_owner_id = ? AND portfolio_id = ?')
        .get(owner.canonicalOwnerId, portfolioId);
      if (existing) throw new InvalidPortfolioRequestError(`portfolio already exists: ${portfolioId}`);
      const now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name,
                                   current_revision, status, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, 0, 'ACTIVE', ?, ?, NULL)`,
        )
        .run(portfolioId, owner.canonicalOwnerId, owner.tenantId, request.name ?? portfolioId, now, now);
      this.afterMutation('portfolio-insert');
      return this.writeRevision(owner, portfolioId, request, 'INITIAL', 0);
    });
  }

  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    return this.withTransaction(() => {
      this.validate(request);
      return this.writeRevision(owner, portfolioId, request, request.operation === 'REPLACE' ? 'REPLACE' : 'MERGE', expectedRevision);
    });
  }

  reset(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number {
    return this.withTransaction(() => {
      this.validate(request);
      return this.writeRevision(owner, portfolioId, request, 'RESET', expectedRevision);
    });
  }

  delete(owner: OwnerRef, portfolioId: string, expectedRevision: number): void {
    this.withTransaction(() => {
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
      this.afterMutation('delete-revision-insert');
      this.db
        .prepare(
          `UPDATE portfolios SET status = 'TOMBSTONED', deleted_at = ?, updated_at = ?
            WHERE canonical_owner_id = ? AND portfolio_id = ?`,
        )
        .run(now, now, owner.canonicalOwnerId, portfolioId);
      this.afterMutation('delete-portfolio-update');
    });
  }
}
