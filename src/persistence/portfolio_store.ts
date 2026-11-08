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
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  BindingAbsentError,
  BindingInvalidError,
  resolveActiveBindingInCurrentTransaction,
  resolveActiveHoldingsBindingInCurrentTransaction,
} from './binding.js';
import { isD114SecurityIdentity, type D114SecurityIdentity } from '../contracts/types.js';
import { isLocalPersonalUseEnabled } from '../ipc/localPersonalUse.js';

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
  /**
   * The exact canonical P04 `D114SecurityIdentity` (`ISIN:<isin>:<series>`),
   * persisted verbatim when authoritative evidence supplied it. `null`/absent
   * means EXPLICITLY UNRESOLVED — it is never reconstructed from symbol,
   * company name, ISIN-only or exchange listing alone.
   */
  securityIdentity?: D114SecurityIdentity | null;
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
 * D03 — consumer contract 2.0.0 / frame v=2 snapshot types
 *
 * The v2 path is explicitly separate from the v1 path above. v1 parsing,
 * results and refusals are unchanged; the constants and primitives below
 * implement the adopted v2 semantics under the current authority override
 * (four-revision cap retained, stale-first ordering, duplicate no-op BEFORE
 * cap rejection, complete-snapshot MERGE, empty INITIAL revision 1, stable
 * opaque IDs, immutable history).
 * ------------------------------------------------------------------ */

/** Safe-integer bound for revisions and wire integers (spec §3.2). */
export const SNAPSHOT_MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

export interface SnapshotSourceEvidence {
  readonly fileName: string;
  readonly sourceBroker: string;
  readonly importedAt: string;
  readonly evidenceRecordDigest: string;
}

/**
 * A v2 `portfolio.save` request AFTER the service layer has resolved every
 * observed row against the governed identity master. `contentDigest` is the
 * caller-supplied evidence digest and is the contribution identity;
 * `provenanceDigest` is IPD-computed server-side over source observations and
 * the original `importedAt`. The internal lineage is never accepted as a wire
 * assertion.
 */
export interface SnapshotSaveRequest {
  readonly portfolioId: string;
  readonly expectedRevision: number;
  readonly holdings: HoldingInput[];
  readonly contentDigest: string;
  readonly provenanceDigest: string;
  readonly broker: string;
  readonly sourceEvidence: SnapshotSourceEvidence;
}

export interface SnapshotCreateRequest {
  readonly portfolioName?: string;
}

export type SnapshotDisposition = 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'ALREADY_IMPORTED_NO_OP';
export type SnapshotStoreEffect = 'NONE' | 'REVISION_COMMITTED';

export interface SnapshotReceipt {
  readonly disposition: SnapshotDisposition;
  readonly revision: number;
  readonly noOp: boolean;
  readonly storeEffect: SnapshotStoreEffect;
  readonly holdingsPersisted: number;
  readonly totalMarketValue: number;
  readonly contributions: number;
}

export interface SnapshotCreated {
  readonly portfolioId: string;
  readonly revision: number;
}

const HEX_64 = /^[a-f0-9]{64}$/;
const UTC_ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

function isUtcIsoInstant(value: string): boolean {
  if (!UTC_ISO_INSTANT.test(value)) return false;
  if (!Number.isFinite(Date.parse(value))) return false;
  return new Date(value).toISOString() === value;
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
 * admission) are both false in this build, so the governed path can never
 * authorize on its own.
 *
 * The explicitly authorized local single-user personal path
 * (IIPS_LOCAL_PERSONAL_USE=1) is recognized here — within the authorization
 * model itself, not as a dispatch-level bypass. Authorization requires BOTH:
 *
 *   1. The environment switch IIPS_LOCAL_PERSONAL_USE=1 (process-level
 *      configuration, read from the server process environment only); and
 *   2. A validated principal/membership binding (per-request context: the
 *      canonical owner and tenant resolved from the database).
 *
 * Neither alone is sufficient — the env var without a binding is still
 * denied, and a binding without the env var is still denied. This prevents
 * hard-coding authorization based solely on an arbitrary environment variable
 * while keeping the decision centralized and auditable.
 *
 * No environment flag, test result or operator assertion changes the W-1
 * default-deny behaviour for any other caller or execution context.
 */
export interface AuthorizationContext {
  readonly env?: NodeJS.ProcessEnv;
  readonly canonicalOwnerId?: string;
  readonly tenantId?: string;
}

export function evaluatePortSaveGuard(context?: AuthorizationContext): { authorized: boolean; reasons: string[] } {
  // W-1 default deny: Gate 4 and Gate 5 are not accepted on the governed path.
  const w1Reasons = [
    'W-1(3): Gate 4 qualification not accepted',
    'W-1(4): Gate 5 admission not accepted',
  ];

  // No context: governed path default deny. This preserves the hard-false W-1
  // response for every existing caller (DurablePortfolioStorePort,
  // gateAPrimeValidation, directP1Provisioning and all tests) regardless of
  // process environment.
  if (!context) {
    return { authorized: false, reasons: w1Reasons };
  }

  const env = context.env ?? process.env;

  // Explicitly authorized local single-user personal use: the env switch plus
  // a validated binding context. The env var alone is not sufficient.
  if (isLocalPersonalUseEnabled(env)) {
    if (context.canonicalOwnerId && context.tenantId) {
      return {
        authorized: true,
        reasons: [
          'W-1 personal-local authorization: explicitly enabled local single-user personal use',
          `principal: ${context.canonicalOwnerId}@${context.tenantId}`,
        ],
      };
    }
    return {
      authorized: false,
      reasons: [
        ...w1Reasons,
        'W-1 personal-local authorization denied: no validated principal/membership binding',
      ],
    };
  }

  return { authorized: false, reasons: w1Reasons };
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

/** The closed stored contribution semantics vocabulary (migration 004 / DR-4r). */
const STORED_CONTRIBUTION_SEMANTICS: readonly string[] = ['SAVED_NEW_BATCH', 'MERGED_INTO_EXISTING', 'RESET', 'REPLACE'];

function storedInstant(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  // Stored instants are written by this store as parseable ISO-8601; a stored
  // value that does not parse is not silently kept.
  return Number.isFinite(Date.parse(value));
}

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

/**
 * The stored `portfolio_revisions.content_digest` for a v2 MERGE snapshot:
 * sha256 of the canonical JSON of the mapped holdings and the provenance
 * digest. Exported so the reconciliation path recomputes the exact stored
 * value instead of trusting any caller-supplied copy.
 */
export function computeRevisionContentDigest(
  holdings: readonly HoldingInput[],
  provenanceDigest: string,
): string {
  return createHash('sha256')
    .update(JSON.stringify({ holdings, provenance: provenanceDigest }), 'utf8')
    .digest('hex');
}

function contentDigestOf(request: Pick<PortfolioSaveRequest, 'holdings' | 'provenanceDigest'>): string {
  return computeRevisionContentDigest(request.holdings, request.provenanceDigest);
}

/**
 * Internal reconciliation-only evidence for one stored revision, carrying the
 * stored `content_digest` verbatim (SQL NULL preserved as null) — never the
 * §6 wire projection. Part of the R01 bounded correction: read-only, used
 * exclusively by `reconcileSnapshotV2ByRead`.
 */
export interface RevisionReconciliationEvidence {
  readonly revision: number;
  readonly operation: string;
  /** The stored `portfolio_revisions.created_at` value (v1 `RevisionEntry.committedAt` semantics). */
  readonly committedAt: string;
  readonly totalMarketValue: number;
  readonly holdingsCount: number;
  readonly provenanceDigest: string;
  /** The stored `portfolio_revisions.content_digest`; SQL NULL preserved. */
  readonly contentDigest: string | null;
}

const MAX_REVISIONS = 4;
const PERSONAL_USE_REVISION_LIMIT = 1000;

export class DurablePortfolioStore {
  private transactionDepth = 0;
  /**
   * The immutable revision lifecycle is capped at MAX_REVISIONS on the governed
   * qualification path (the D03 cap=4 contract). The explicitly authorized
   * local single-user personal path (IIPS_LOCAL_PERSONAL_USE=1) raises the cap
   * to PERSONAL_USE_REVISION_LIMIT so the application is usable day to day;
   * the cap is still finite and every other revision rule is unchanged.
   */
  private readonly revisionCap: number;

  constructor(
    private readonly db: DatabaseSync,
    private readonly testHooks?: { afterMutation?: (step: string) => void; afterCommit?: () => void },
    options?: { revisionCap?: number },
  ) {
    const requested = options?.revisionCap;
    if (requested === undefined) {
      this.revisionCap = MAX_REVISIONS;
    } else {
      if (!Number.isInteger(requested) || requested < 1) {
        throw new InvalidPortfolioRequestError('revisionCap must be a positive integer');
      }
      this.revisionCap = Math.min(requested, PERSONAL_USE_REVISION_LIMIT);
    }
  }

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
   * D02/D03 — revalidates the sole ACTIVE holdings owner inside the caller's
   * protected transaction. The resolved pair must equal the prospectively
   * extended canonical owner on the retained tenant; anything else is folded
   * into the same ResourceUnavailableError a missing/foreign portfolio
   * produces, so ownership cannot be probed.
   */
  withHoldingsSnapshotTransaction<T>(owner: OwnerRef, work: (store: this) => T): T {
    return this.withTransaction(() => {
      let active;
      try {
        active = resolveActiveHoldingsBindingInCurrentTransaction(this.db);
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

  /**
   * Local personal-use path: the recorded tombstone timestamp of a portfolio
   * tombstoned through {@link delete}. Throws ResourceUnavailableError for
   * anything that is not a tombstoned own portfolio — never a default value.
   */
  deletedAtOf(owner: OwnerRef, portfolioId: string): string {
    const row = this.db
      .prepare(
        `SELECT deleted_at FROM portfolios
          WHERE canonical_owner_id = ? AND tenant_id = ? AND portfolio_id = ? AND status = 'TOMBSTONED'`,
      )
      .get(owner.canonicalOwnerId, owner.tenantId, portfolioId) as { deleted_at: string } | undefined;
    if (!row || typeof row.deleted_at !== 'string' || row.deleted_at.length === 0) {
      throw new ResourceUnavailableError();
    }
    return row.deleted_at;
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
                identity_status, resolution_disposition, security_identity
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
   * D03 — `portfolio.get` for the v2 consumer contract. Identical to
   * {@link get} (DR-2/DQ-1 stored-value refusal, DR-3 durability absence,
   * owner-isolation predicates) except the contribution ledger is projected
   * through the validated nullable projection: malformed non-empty rows
   * refuse the whole read instead of being passed through.
   */
  getV2(owner: OwnerRef, portfolioId: string): PortfolioDetail {
    const detail = this.get(owner, portfolioId);
    return { ...detail, contributions: this.contributionsValidated(owner, portfolioId) };
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
   * D03 / DR-4r — validated nullable non-empty contribution projection.
   *
   * Legacy migration-004 rows may carry NULL provenance; NULL is preserved as
   * unknown and is never coerced to '', a guessed broker or a replacement row.
   * A non-null value that does not conform refuses the whole projection
   * (ContractEnvelopeViolationError) — malformed non-empty rows are never
   * silently dropped or fabricated into a successful empty view.
   */
  contributionsValidated(owner: OwnerRef, portfolioId: string): PortfolioContribution[] {
    const rows = this.contributions(owner, portfolioId);
    return rows.map((row) => {
      const shape = 'portfolio.contributions';
      if (!HEX_64.test(row.contributionId)) {
        refuseStoredValue(shape, 'contribution_id', 'a stored 64-hex contribution identity');
      }
      if (!Number.isFinite(row.amount) || row.amount < 0 || row.amount > SNAPSHOT_MAX_SAFE_INTEGER) {
        refuseStoredValue(shape, 'amount', 'a finite non-negative stored amount within the safe range');
      }
      if (!storedInstant(row.contributedAt)) {
        refuseStoredValue(shape, 'contributed_at', 'a stored UTC ISO-8601 instant');
      }
      if (!storedInstant(row.createdAt)) {
        refuseStoredValue(shape, 'created_at', 'a stored UTC ISO-8601 instant');
      }
      if (row.fileName !== null && (typeof row.fileName !== 'string' || row.fileName.trim().length === 0)) {
        refuseStoredValue(shape, 'file_name', 'a stored non-blank string or SQL NULL');
      }
      if (row.sourceBroker !== null && (typeof row.sourceBroker !== 'string' || row.sourceBroker.trim().length === 0)) {
        refuseStoredValue(shape, 'source_broker', 'a stored non-blank string or SQL NULL');
      }
      if (row.contentDigest !== null && (typeof row.contentDigest !== 'string' || !HEX_64.test(row.contentDigest))) {
        refuseStoredValue(shape, 'content_digest', 'a stored 64-hex digest or SQL NULL');
      }
      if (row.lineageDigest !== null && (typeof row.lineageDigest !== 'string' || !HEX_64.test(row.lineageDigest))) {
        refuseStoredValue(shape, 'lineage_digest', 'a stored 64-hex digest or SQL NULL');
      }
      if (row.importedAt !== null && !storedInstant(row.importedAt)) {
        refuseStoredValue(shape, 'imported_at', 'a stored UTC ISO-8601 instant or SQL NULL');
      }
      if (row.semantics !== null && !STORED_CONTRIBUTION_SEMANTICS.includes(row.semantics)) {
        refuseStoredValue(shape, 'contribution_semantics', 'a stored semantics value in the closed vocabulary or SQL NULL');
      }
      return row;
    });
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

  /**
   * Internal reconciliation-only read of the stored evidence for one
   * revision, including the stored `content_digest` (SQL NULL preserved).
   * Never call from dispatch or any §6 path; authorized callers are the
   * UNKNOWN-outcome reconciliation fixtures under the R01 correction.
   */
  revisionReconciliationEvidence(
    owner: OwnerRef,
    portfolioId: string,
    revision: number,
  ): RevisionReconciliationEvidence | undefined {
    const row = this.db
      .prepare(
        `SELECT revision, operation, created_at, total_market_value,
                holdings_count, provenance_digest, content_digest
           FROM portfolio_revisions
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?`,
      )
      .get(owner.canonicalOwnerId, portfolioId, revision) as
      | {
          revision: number | bigint;
          operation: string | null;
          created_at: string | null;
          total_market_value: number | null;
          holdings_count: number | bigint | null;
          provenance_digest: string | null;
          content_digest: string | null;
        }
      | undefined;
    if (!row) return undefined;
    // Fail closed through the same helpers the history projection uses: a
    // malformed stored row refuses here (surfacing as UNRESOLVED from the
    // reconciler) instead of being coerced into a reconciliation verdict.
    const shape = 'portfolio.revisions.evidence';
    const revisionValue = storedNonNegativeInteger(row as unknown as StoredRow, 'revision', shape);
    const operation = storedOperation(row as unknown as StoredRow, 'operation', shape);
    const committedAt = storedString(row as unknown as StoredRow, 'created_at', shape, true);
    const totalMarketValue = storedFiniteNumber(row as unknown as StoredRow, 'total_market_value', shape);
    const provenanceDigest = storedString(row as unknown as StoredRow, 'provenance_digest', shape);
    const holdingsCount = storedNonNegativeInteger(row as unknown as StoredRow, 'holdings_count', shape);
    const rawDigest = row.content_digest;
    if (rawDigest !== null && rawDigest !== undefined && (typeof rawDigest !== 'string' || rawDigest.trim().length === 0)) {
      refuseStoredValue(shape, 'content_digest', 'a stored string or SQL NULL');
    }
    return {
      revision: revisionValue,
      operation,
      committedAt,
      totalMarketValue,
      holdingsCount,
      provenanceDigest,
      // SQL NULL means the optional v1 property is genuinely absent.
      contentDigest: typeof rawDigest === 'string' ? rawDigest : null,
    };
  }

  /**
   * Internal reconciliation-only read of the stored holdings snapshot for
   * one revision (canonical `holding_key` order). Never call from dispatch
   * or any §6 path; returns [] when the revision has no stored holdings.
   */
  holdingsForRevision(owner: OwnerRef, portfolioId: string, revision: number): HoldingInput[] {
    const rows = this.db
      .prepare(
        `SELECT holding_key, symbol, company_id, quantity, average_buy_price, current_price,
                market_value, weight_percentage, active, source_broker, lineage_digest,
                identity_status, resolution_disposition
           FROM portfolio_holdings
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?
          ORDER BY holding_key`,
      )
      .all(owner.canonicalOwnerId, portfolioId, revision) as unknown as Record<string, unknown>[];
    return rows.map((row) => this.holdingFromRow(row));
  }

  /**
   * D03 — authorized read probe for the CURRENT portfolio revision. Folds
   * missing/foreign/tombstoned into ResourceUnavailableError (never a
   * disclosure). The v2 service uses it to refuse stale requests before
   * domain/provenance/identity rejection; the store re-checks stale under
   * the serialized transaction at commit time regardless of this probe.
   */
  currentRevision(owner: OwnerRef, portfolioId: string): number {
    return this.resolvePortfolio(owner, portfolioId).currentRevision;
  }

  /**
   * D03 — reconciliation settlement probe. Opens and immediately rolls back
   * an empty `BEGIN IMMEDIATE` transaction: zero bytes, zero domain effect.
   *
   * Narrow semantics (R01 correction, 2026-11-06): this certifies only that
   * no writer holds the write lock at the single instant the probe runs —
   * an instantaneous quiescence signal. It is a NECESSARY precondition for
   * any `NOT_COMMITTED` verdict derived from absent evidence, and nothing
   * more: it does NOT prove terminal completion or cancellation of the one
   * particular lost-acknowledgement operation being reconciled, a queued or
   * not-yet-locking lost-ack writer may still proceed after the probe's lock
   * is released, and the lock is NOT held through the reconciliation reads.
   * Callers must never derive `COMMITTED` — or skip the evidence
   * correspondence checks — from this probe alone. Throws when settlement
   * cannot be proven (lock held, busy store, nested transaction).
   */
  proveSettledForReconciliation(): void {
    if (this.transactionDepth > 0) {
      throw new Error('settlement cannot be proven inside an open transaction');
    }
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.exec('ROLLBACK;');
    } catch (error) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        //already rolled back; the primary error stands
      }
      throw error;
    }
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
      securityIdentity: this.projectedSecurityIdentity(r.security_identity, String(r.symbol)),
    };
  }

  /**
   * NULL stays explicitly unresolved (`null`); a stored value must conform to
   * the canonical P04 D114 grammar or the read refuses instead of projecting
   * a fabricated identity.
   */
  private projectedSecurityIdentity(raw: unknown, symbol: string): D114SecurityIdentity | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'string') {
      throw new ContractEnvelopeViolationError(`holding ${symbol} has a non-string stored security_identity`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ContractEnvelopeViolationError(`holding ${symbol} has a stored security_identity that is not valid JSON`);
    }
    if (!isD114SecurityIdentity(parsed)) {
      throw new ContractEnvelopeViolationError(`holding ${symbol} has a stored security_identity that does not conform to the P04 D114 grammar`);
    }
    return parsed;
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
    for (const h of request.holdings) {
      if (h.securityIdentity !== undefined && h.securityIdentity !== null && !isD114SecurityIdentity(h.securityIdentity)) {
        throw new InvalidPortfolioRequestError(
          `holding ${h.symbol} carries a security identity that does not conform to the canonical P04 D114 grammar`,
        );
      }
    }
  }

  /**
   * Silent series replacement is refused: if the previous revision stored an
   * exact D114 identity for a holding key, a later revision may keep it or
   * explicitly supply the SAME identity, and may associate one where none was
   * stored — but it may never drop it or silently swap another series in.
   */
  private assertNoSilentIdentityReplacement(
    owner: OwnerRef,
    portfolioId: string,
    currentRevision: number,
    request: PortfolioSaveRequest,
  ): void {
    if (currentRevision < 1) return;
    const prior = this.db
      .prepare(
        `SELECT holding_key, security_identity FROM portfolio_holdings
          WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?`,
      )
      .all(owner.canonicalOwnerId, portfolioId, currentRevision) as unknown as Array<{
      holding_key: string;
      security_identity: string | null;
    }>;
    const priorByKey = new Map(prior.map((r) => [r.holding_key, r.security_identity]));
    for (const h of request.holdings) {
      const priorIdentity = priorByKey.get(h.symbol);
      if (priorIdentity == null) continue;
      let priorParsed: unknown;
      try {
        priorParsed = JSON.parse(priorIdentity);
      } catch {
        throw new ContractEnvelopeViolationError(`stored security_identity for holding ${h.symbol} is not valid JSON`);
      }
      if (!isD114SecurityIdentity(priorParsed)) {
        throw new ContractEnvelopeViolationError(`stored security_identity for holding ${h.symbol} does not conform to the P04 D114 grammar`);
      }
      const next = h.securityIdentity ?? null;
      if (next === null || next.securityId !== priorParsed.securityId) {
        throw new InvalidPortfolioRequestError(
          `holding ${h.symbol} would silently replace stored security identity ${priorParsed.securityId}; an explicit identical identity is required`,
        );
      }
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
    if (current.currentRevision >= this.revisionCap && operation !== 'DELETE') {
      throw new RevisionConflictError(`the immutable revision lifecycle is capped at ${this.revisionCap}`);
    }
    this.assertNoSilentIdentityReplacement(owner, portfolioId, current.currentRevision, request);
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
          active, source_broker, lineage_digest, identity_status, resolution_disposition, security_identity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        h.securityIdentity ? JSON.stringify(h.securityIdentity) : null,
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

  /* ------------------------------------------------------------------ *
   * D03 — consumer contract 2.0.0 / frame v=2 snapshot primitives.
   *
   * These low-level methods exist for the isolated synthetic fixture class
   * under the D05 bounded-engineering authority; they are disconnected from
   * product dispatch (all live writes refuse before reaching here). v1
   * methods above are unchanged. The current authority override retains the
   * four-revision cap: stale-first ordering, duplicate no-op BEFORE cap
   * rejection, immutable history, complete-snapshot MERGE.
   * ------------------------------------------------------------------ */

  private validateSnapshotHoldings(holdings: readonly HoldingInput[]): { totalMarketValue: number; weightSum: number } {
    if (!Array.isArray(holdings) || holdings.length === 0) {
      throw new InvalidPortfolioRequestError('a snapshot save requires at least one observed holding');
    }
    const symbols = new Set<string>();
    let total = 0;
    let weightSum = 0;
    let activeCount = 0;
    for (const h of holdings) {
      if (!h || typeof h !== 'object') {
        throw new InvalidPortfolioRequestError('a holding row is missing');
      }
      if (typeof h.symbol !== 'string' || h.symbol.trim().length === 0) {
        throw new InvalidPortfolioRequestError('holding symbol must be a non-blank string');
      }
      if (symbols.has(h.symbol)) {
        throw new InvalidPortfolioRequestError('duplicate holding symbols in the snapshot');
      }
      symbols.add(h.symbol);
      if (typeof h.active !== 'boolean') {
        throw new InvalidPortfolioRequestError('active must be a boolean');
      }
      for (const field of ['quantity', 'averageBuyPrice', 'currentPrice', 'marketValue', 'weightPercentage'] as const) {
        const value = h[field];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new InvalidPortfolioRequestError(`${field} must be a finite number`);
        }
        if (value < 0) {
          throw new InvalidPortfolioRequestError(`${field} must be non-negative`);
        }
        if (value > SNAPSHOT_MAX_SAFE_INTEGER) {
          throw new InvalidPortfolioRequestError(`${field} exceeds the safe numeric range`);
        }
      }
      if (h.weightPercentage > 100) {
        throw new InvalidPortfolioRequestError('weightPercentage must be within 0..100');
      }
      if (h.active) {
        if (h.quantity <= 0) {
          throw new InvalidPortfolioRequestError('an active holding must have a positive quantity');
        }
        activeCount += 1;
      }
      if (typeof h.sourceBroker !== 'string' || h.sourceBroker.trim().length === 0) {
        throw new InvalidPortfolioRequestError('each holding requires a non-blank sourceBroker');
      }
      if (typeof h.companyId !== 'string' || h.companyId.trim().length === 0) {
        throw new InvalidPortfolioRequestError('each holding requires a resolved companyId');
      }
      if (typeof h.lineageDigest !== 'string' || !HEX_64.test(h.lineageDigest)) {
        throw new InvalidPortfolioRequestError('each holding requires a 64-hex lineageDigest');
      }
      if (typeof h.identityStatus !== 'string' || h.identityStatus.trim().length === 0) {
        throw new InvalidPortfolioRequestError('each holding requires an identityStatus');
      }
      if (typeof h.resolutionDisposition !== 'string' || h.resolutionDisposition.trim().length === 0) {
        throw new InvalidPortfolioRequestError('each holding requires a resolutionDisposition');
      }
      total += h.marketValue;
      weightSum += h.weightPercentage;
      if (!Number.isFinite(total) || !Number.isFinite(weightSum)) {
        throw new InvalidPortfolioRequestError('aggregate overflow: the snapshot totals are not finite');
      }
    }
    if (total > SNAPSHOT_MAX_SAFE_INTEGER) {
      throw new InvalidPortfolioRequestError('aggregate market value exceeds the safe numeric range');
    }
    if (activeCount === 0) {
      throw new InvalidPortfolioRequestError('a non-empty snapshot requires at least one active holding');
    }
    if (Math.abs(weightSum - 100) > 0.01) {
      throw new InvalidPortfolioRequestError('the whole-vector weight sum must be 100 ± 0.01 for a non-empty save');
    }
    return { totalMarketValue: total, weightSum };
  }

  /**
   * D03 — phase A: framing and security only. Types, key closure,
   * caller-authority refusal (C7), presence, 64-hex digest format and
   * safe-integer expectedRevision. No domain, provenance-semantics or
   * identity rejection happens here; those run only after stale-revision
   * detection (phase B), per D03 ordering.
   */
  private validateSnapshotFraming(request: SnapshotSaveRequest): void {
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      throw new InvalidPortfolioRequestError('the snapshot request is missing');
    }
    const { holdings: _holdings, ...envelopeShape } = request;
    const refused = findCallerSuppliedIdentityKeys(envelopeShape);
    if (refused.length > 0) {
      throw new InvalidPortfolioRequestError(`caller-supplied identity keys are refused: ${refused.join(', ')}`);
    }
    if (typeof request.portfolioId !== 'string' || request.portfolioId.trim().length === 0) {
      throw new InvalidPortfolioRequestError('a portfolio id is required');
    }
    if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 1) {
      throw new InvalidPortfolioRequestError('expectedRevision must be a safe integer >= 1');
    }
    if (typeof request.contentDigest !== 'string' || !HEX_64.test(request.contentDigest)) {
      throw new InvalidPortfolioRequestError('contentDigest must be a lowercase 64-hex digest');
    }
    if (typeof request.provenanceDigest !== 'string' || !HEX_64.test(request.provenanceDigest)) {
      throw new InvalidPortfolioRequestError('provenanceDigest must be a lowercase 64-hex digest');
    }
    if (typeof request.broker !== 'string' || request.broker.trim().length === 0) {
      throw new InvalidPortfolioRequestError('broker must be a non-blank string');
    }
    const evidence = request.sourceEvidence;
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
      throw new InvalidPortfolioRequestError('sourceEvidence is required');
    }
    for (const key of Object.keys(evidence)) {
      if (!['fileName', 'sourceBroker', 'importedAt', 'evidenceRecordDigest'].includes(key)) {
        throw new InvalidPortfolioRequestError(`sourceEvidence carries an unexpected key: ${key}`);
      }
    }
    if (typeof evidence.fileName !== 'string' || evidence.fileName.trim().length === 0) {
      throw new InvalidPortfolioRequestError('sourceEvidence.fileName is required');
    }
    if (typeof evidence.sourceBroker !== 'string' || evidence.sourceBroker.trim().length === 0) {
      throw new InvalidPortfolioRequestError('sourceEvidence.sourceBroker is required');
    }
    if (typeof evidence.importedAt !== 'string' || evidence.importedAt.trim().length === 0) {
      throw new InvalidPortfolioRequestError('sourceEvidence.importedAt is required');
    }
    if (typeof evidence.evidenceRecordDigest !== 'string' || !HEX_64.test(evidence.evidenceRecordDigest)) {
      throw new InvalidPortfolioRequestError('sourceEvidence.evidenceRecordDigest must be a lowercase 64-hex digest');
    }
    if (!Array.isArray(request.holdings) || request.holdings.length === 0) {
      throw new InvalidPortfolioRequestError('a snapshot save requires at least one observed holding');
    }
  }

  /**
   * D03 — phase B: domain, provenance-semantics and identity rejection.
   * Runs ONLY after stale-revision detection inside the serialized
   * transaction. Aggregate finiteness, weight-sum, active-count, broker /
   * evidence consistency, the UTC-instant provenance check and the per-row
   * identity-field/lineage validation live here — a stale request refuses
   * with REVISION_CONFLICT before any of them run (zero domain delta).
   */
  private validateSnapshotDomainAndProvenance(request: SnapshotSaveRequest): { totalMarketValue: number; weightSum: number } {
    const evidence = request.sourceEvidence;
    if (!isUtcIsoInstant(evidence.importedAt)) {
      throw new InvalidPortfolioRequestError('sourceEvidence.importedAt must be a UTC ISO-8601 instant');
    }
    if (request.broker !== evidence.sourceBroker) {
      throw new InvalidPortfolioRequestError('root broker and evidence source broker must match');
    }
    const { totalMarketValue, weightSum } = this.validateSnapshotHoldings(request.holdings);
    if (request.holdings.some((holding) => holding.sourceBroker !== request.broker)) {
      throw new InvalidPortfolioRequestError('each holding source broker must match the snapshot broker');
    }
    return { totalMarketValue, weightSum };
  }

  /**
   * D03 — deliberate create for the v2 lifecycle: one opaque IPD-generated ID,
   * empty INITIAL revision 1, zero holdings/contributions, `isSaved: false`.
   * There is no request-idempotency promise and no default/fallback creation.
   */
  createEmptySnapshot(owner: OwnerRef, request: SnapshotCreateRequest = {}): SnapshotCreated {
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      throw new InvalidPortfolioRequestError('the create request is malformed');
    }
    for (const key of Object.keys(request)) {
      if (key !== 'portfolioName') {
        throw new InvalidPortfolioRequestError(`the create request carries an unexpected key: ${key}`);
      }
    }
    const name = request.portfolioName;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      throw new InvalidPortfolioRequestError('portfolioName must be a non-blank string when present');
    }
    const refusedKeys = findCallerSuppliedIdentityKeys(request);
    if (refusedKeys.length > 0) {
      throw new InvalidPortfolioRequestError(`caller-supplied identity keys are refused: ${refusedKeys.join(', ')}`);
    }
    return this.withHoldingsSnapshotTransaction(owner, () => {
      const portfolioId = randomUUID();
      const now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name,
                                   current_revision, status, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, 0, 'ACTIVE', ?, ?, NULL)`,
        )
        .run(portfolioId, owner.canonicalOwnerId, owner.tenantId, name ?? portfolioId, now, now);
      this.afterMutation('portfolio-insert');
      this.db
        .prepare(
          `INSERT INTO portfolio_revisions
             (portfolio_id, canonical_owner_id, revision, operation, total_market_value,
              weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
           VALUES (?, ?, ?, 'INITIAL', 0, 0, 0, '', NULL, ?)`,
        )
        .run(portfolioId, owner.canonicalOwnerId, 1, now);
      this.afterMutation('revision-insert');
      this.db
        .prepare('UPDATE portfolios SET current_revision = 1, updated_at = ? WHERE canonical_owner_id = ? AND portfolio_id = ?')
        .run(now, owner.canonicalOwnerId, portfolioId);
      this.afterMutation('portfolio-update');
      return { portfolioId, revision: 1 };
    });
  }

  /**
   * D03 — complete-snapshot MERGE for the v2 lifecycle.
   *
   * Ordering under the serialized transaction: resolve and revalidate the
   * holdings owner -> resolve portfolio (missing/foreign/tombstoned fold into
   * ResourceUnavailableError) -> expectedRevision safe-integer check (phase A
   * framing) -> STALE-FIRST conflict -> phase-B domain/provenance/identity
   * validation -> active-set contribution duplicate (caller content digest)
   * no-op BEFORE cap rejection -> cap refusal for a new mutation -> atomic
   * revision/holdings/pointer/contribution write -> COMMIT. A duplicate
   * returns ALREADY_IMPORTED_NO_OP with the original revision and lineage and
   * zero domain delta, even at the cap. No automatic retry anywhere.
   *
   * D03 stale-revision precedence: stale detection happens BEFORE domain,
   * provenance and identity rejection. Phase-A framing and security checks
   * (types, key closure, caller-authority refusal) legitimately run first;
   * everything else runs only after the stale check so a stale request
   * refuses with REVISION_CONFLICT (zero domain delta) whatever its payload.
   */
  saveSnapshotV2(owner: OwnerRef, request: SnapshotSaveRequest): SnapshotReceipt {
    this.validateSnapshotFraming(request);
    return this.withHoldingsSnapshotTransaction(owner, () => {
      const current = this.resolvePortfolio(owner, request.portfolioId);
      if (current.currentRevision !== request.expectedRevision) {
        throw new RevisionConflictError(
          `expected revision ${request.expectedRevision} but the portfolio is at ${current.currentRevision}`,
        );
      }
      // D03 ordering: STALE REVISION FIRST. Domain, provenance and identity
      // rejection run only after this check; a stale request refuses here
      // with zero domain delta.
      const { totalMarketValue, weightSum } = this.validateSnapshotDomainAndProvenance(request);
      // Duplicate BEFORE cap rejection (D03 current override): an already
      // committed contribution identity in this portfolio is an idempotent
      // no-op at the current revision — no revision, no rows, no contribution.
      const committed = this.db
        .prepare(
          'SELECT 1 AS present FROM portfolio_contributions WHERE canonical_owner_id = ? AND portfolio_id = ? AND contribution_id = ?',
        )
        .get(owner.canonicalOwnerId, request.portfolioId, request.contentDigest) as { present: number } | undefined;
      if (committed) {
        const currentRevisionRow = this.db
          .prepare(
            'SELECT holdings_count, total_market_value FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ?',
          )
          .get(owner.canonicalOwnerId, request.portfolioId, current.currentRevision) as
          | { holdings_count: number; total_market_value: number }
          | undefined;
        return {
          disposition: 'ALREADY_IMPORTED_NO_OP',
          revision: current.currentRevision,
          noOp: true,
          storeEffect: 'NONE',
          holdingsPersisted: currentRevisionRow ? Number(currentRevisionRow.holdings_count) : 0,
          totalMarketValue: currentRevisionRow ? Number(currentRevisionRow.total_market_value) : 0,
          contributions: 0,
        };
      }
      if (current.currentRevision >= this.revisionCap) {
        throw new RevisionConflictError(`the immutable revision lifecycle is capped at ${this.revisionCap}`);
      }
      const nextRevision = request.expectedRevision + 1;
      const contentDigest = contentDigestOf(request);
      const now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO portfolio_revisions
             (portfolio_id, canonical_owner_id, revision, operation, total_market_value,
              weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
           VALUES (?, ?, ?, 'MERGE', ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          request.portfolioId,
          owner.canonicalOwnerId,
          nextRevision,
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
          request.portfolioId,
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
        .run(nextRevision, now, owner.canonicalOwnerId, request.portfolioId);
      this.afterMutation('portfolio-update');
      // The contribution ledger: exactly one row per committed snapshot, keyed
      // by the import's caller-supplied content digest (Gate E W-8 / BI-08).
      // Provenance fields record the actual source evidence; nothing is
      // guessed. Legacy migration-004 NULLs (pre-existing rows) are untouched.
      this.db
        .prepare(
          `INSERT INTO portfolio_contributions
             (canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at,
              file_name, source_broker, content_digest, lineage_digest, imported_at, contribution_semantics)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MERGED_INTO_EXISTING')`,
        )
        .run(
          owner.canonicalOwnerId,
          request.portfolioId,
          request.contentDigest,
          totalMarketValue,
          now,
          now,
          request.sourceEvidence.fileName,
          request.sourceEvidence.sourceBroker,
          request.contentDigest,
          request.provenanceDigest,
          request.sourceEvidence.importedAt,
        );
      this.afterMutation('contribution-insert');
      return {
        disposition: 'MERGED_INTO_EXISTING',
        revision: nextRevision,
        noOp: false,
        storeEffect: 'REVISION_COMMITTED',
        holdingsPersisted: request.holdings.length,
        totalMarketValue,
        contributions: 1,
      };
    });
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
