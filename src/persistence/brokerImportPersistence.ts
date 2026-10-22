/**
 * Q1 bounded residual implementation — the durable broker-ingestion persistence
 * boundary (CV-39; `G-2` §2/§3; Gate E rev 1 W-6/W-7/W-8/W-10; DP-2 Option 2F).
 *
 * Authority: `IIPS-V3-Q1-PORTFOLIO-DECISION-ACT-2026-10-22` §1.2 — "Authorize a
 * bounded residual implementation act limited to what the existing records leave
 * unbuilt: durable persistence behind IPD `main`'s in-memory `PortfolioStore`
 * (CV-39) and the wiring of an admitted store". The records leave exactly one
 * thing unbuilt on the import path: the boundary between a broker import result
 * and the owner-scoped durable store. This module is that boundary.
 *
 * WHAT THIS MODULE IS
 *   1. The **identity gate** at the durable boundary (Gate E W-6 / DP-2 Option
 *      2F). The durable store had no identity gate at all: it persisted any
 *      holding vector it was handed. This module refuses the WHOLE request
 *      before serialization, port call or persistence when any holding lacks
 *      exactly one canonical resolution, and it never fabricates a `companyId`.
 *   2. The **deterministic mapping** from a broker import result to the
 *      durable holding vector, preserving lineage, broker attribution and the
 *      identity disposition verbatim.
 *   3. The **provenance computation** that binds an import to the broker file
 *      it came from, so that a re-import of the same file is a deterministic
 *      no-op and a different file is a new import.
 *   4. The **disposition vocabulary** of accepted wire contract v1
 *      (`SAVED_NEW_BATCH` / `MERGED_INTO_EXISTING` / `ALREADY_IMPORTED_NO_OP`)
 *      and a **typed refusal** that states the store effect of every refusal.
 *
 * WHAT THIS MODULE IS NOT
 *   - It is **not** an authority to write. Every write still passes through the
 *     Gate E W-1 write gate, which refuses with zero store effect while W-1(3)
 *     (Gate 4 qualification) and W-1(4) (Gate 5 admission) are unmet. This
 *     module never edits, relaxes or bypasses `evaluatePortSaveGuard`.
 *   - It is **not** an authentication, tenant or authorization surface. It
 *     accepts no owner, tenant, principal, credential or scope; the owner is
 *     resolved by IPD per request from its own single `ACTIVE` binding.
 *   - It does **not** claim that durable portfolio capability exists, is
 *     qualified or is available. No `durable: true` claim is made or implied
 *     here (Gate 3 act §8.4; Gate E W-11).
 *
 * THE GOVERNING IDENTITY CONTRACT (Gate E W-6), VERBATIM IN EFFECT
 *   - A holding persists only with exactly one IPD-side resolution. Zero
 *     (`UNMAPPED_IDENTIFIER`) or conflicting (`AMBIGUOUS_COLLISION`) matches
 *     refuse the WHOLE request with `REFUSED_UNRESOLVED_IDENTITY` before
 *     serialization, port call or persistence, with per-holding quarantine
 *     evidence.
 *   - No bypass: `NON_PRODUCTION_OPERATOR_BYPASS` is neither emitted nor
 *     accepted.
 *   - Ticker-shaped values are never canonical.
 */
import { createHash } from 'node:crypto';
import {
  InvalidPortfolioRequestError,
  ResourceUnavailableError,
  RevisionConflictError,
  WriteNotAuthorizedError,
  type HoldingInput,
  type OwnerRef,
  type PortfolioSaveRequest,
  type PortfolioSummary,
} from './portfolio_store.js';

/* ------------------------------------------------------------------ *
 * Import domain input
 * ------------------------------------------------------------------ */

/** The identity statuses the governed import path understands. */
export type BrokerImportIdentityStatus = 'RESOLVED' | 'UNRESOLVED';

/** The resolution dispositions the governed import path understands. */
export type BrokerImportResolutionDisposition =
  | 'CANONICAL_P04'
  | 'NON_PRODUCTION_OPERATOR_BYPASS';

/**
 * One holding as produced by the broker ingress chain
 * (`frontend/src/features/portfolio/import/*`), expressed without a UI type so
 * the persistence boundary does not depend on the browser bundle.
 *
 * `companyId` is the CANONICAL company identity. It is the empty string when
 * the holding is `UNRESOLVED`, and it is never invented here.
 */
export interface BrokerImportHolding {
  readonly symbol: string;
  readonly companyId: string;
  readonly quantity: number;
  readonly averageBuyPrice: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly weightPercentage: number;
  readonly active: boolean;
  readonly sourceBroker: string;
  readonly lineageDigest: string;
  readonly identityStatus: BrokerImportIdentityStatus;
  readonly resolutionDisposition: BrokerImportResolutionDisposition;
}

/** One broker import, ready to be persisted into an owner-scoped portfolio. */
export interface BrokerImportRequest {
  readonly portfolioId: string;
  readonly holdings: readonly BrokerImportHolding[];
  /** The broker file's content digest — the BI-08 / Gate E W-8 idempotency key. */
  readonly contentDigest: string;
  /** The broker file name, recorded for operator attribution. */
  readonly fileName: string;
  /** The broker the file came from. */
  readonly sourceBroker: string;
  /** When the import happened (ISO-8601). */
  readonly importedAt: string;
  readonly mode?: 'MERGE' | 'REPLACE';
}

/* ------------------------------------------------------------------ *
 * Refusal vocabulary
 * ------------------------------------------------------------------ */

/** The closed refusal vocabulary of this boundary. */
export type BrokerImportRefusalCode =
  /** Gate E W-6 / DP-2 Option 2F: at least one holding has no single canonical resolution. */
  | 'REFUSED_UNRESOLVED_IDENTITY'
  /** Gate E W-7: an existing store guard refused the request (empty vector, bad fields). */
  | 'REFUSED_STORE_GUARD'
  /** Gate E W-1: the write gate refused the write; zero store effect. */
  | 'WRITE_NOT_AUTHORIZED'
  /** The supplied request is not a well-formed import. */
  | 'INVALID_REQUEST'
  /** `expectedRevision` did not match the portfolio's current revision. */
  | 'REVISION_CONFLICT'
  /** The portfolio is missing, foreign-owned or tombstoned — deliberately indistinguishable. */
  | 'RESOURCE_UNAVAILABLE';

/** Per-holding refusal evidence. Names the symbol; never invents an identity. */
export interface BrokerImportRefusedHolding {
  readonly symbol: string;
  readonly reason: string;
}

/** The disposition vocabulary of accepted wire contract v1. */
export type BrokerImportDisposition =
  | 'SAVED_NEW_BATCH'
  | 'MERGED_INTO_EXISTING'
  | 'ALREADY_IMPORTED_NO_OP';

/** The store effect of an outcome. `NONE` is asserted for every refusal. */
export type BrokerImportStoreEffect = 'NONE' | 'REVISION_COMMITTED';

export interface BrokerImportSuccess {
  readonly ok: true;
  readonly disposition: BrokerImportDisposition;
  readonly revision: number;
  /** True when the import was already committed and nothing was written. */
  readonly noOp: boolean;
  readonly storeEffect: BrokerImportStoreEffect;
  readonly holdingsPersisted: number;
  readonly totalMarketValue: number;
  readonly contributions: number;
  readonly message: string;
}

export interface BrokerImportRefusal {
  readonly ok: false;
  readonly code: BrokerImportRefusalCode;
  readonly message: string;
  /** Every refusal has zero store effect. */
  readonly storeEffect: 'NONE';
  readonly refusedHoldings: readonly BrokerImportRefusedHolding[];
  /** The revision that was in force when the refusal happened, when known. */
  readonly revision?: number;
}

export type BrokerImportOutcome = BrokerImportSuccess | BrokerImportRefusal;

/* ------------------------------------------------------------------ *
 * The identity gate (Gate E W-6 / DP-2 Option 2F)
 * ------------------------------------------------------------------ */

/** The quarantine-style codes of the governed identity resolution. */
export type BrokerImportIdentityCode =
  | 'UNMAPPED_IDENTIFIER'
  | 'AMBIGUOUS_COLLISION'
  | 'CANONICAL_IDENTITY_MISSING'
  | 'IDENTITY_FABRICATED'
  | 'NON_PRODUCTION_BYPASS_REFUSED';

export interface BrokerImportHoldingAssessment {
  readonly symbol: string;
  readonly saveable: boolean;
  readonly code?: BrokerImportIdentityCode;
  readonly reason?: string;
}

export interface BrokerImportIdentityGate {
  readonly saveable: boolean;
  readonly assessments: readonly BrokerImportHoldingAssessment[];
  readonly refusedHoldings: readonly BrokerImportRefusedHolding[];
  readonly disabledReason?: string;
}

/**
 * Evaluates the governed identity rule over an import vector.
 *
 * A holding is saveable only when it carries EXACTLY ONE canonical resolution:
 * `identityStatus === 'RESOLVED'` with a non-empty, non-placeholder
 * `companyId`. Everything else is refused, and the refusal names the holding
 * so the operator can act on it.
 *
 * The gate never fabricates, repairs, defaults or infers an identity, and it
 * refuses the `NON_PRODUCTION_OPERATOR_BYPASS` disposition outright (Gate E
 * W-6 "No bypass").
 */
export function evaluateBrokerImportIdentityGate(
  holdings: readonly BrokerImportHolding[] | undefined | null,
): BrokerImportIdentityGate {
  const vector = holdings ?? [];
  const assessments: BrokerImportHoldingAssessment[] = [];
  const refusedHoldings: BrokerImportRefusedHolding[] = [];

  for (const holding of vector) {
    const symbol = typeof holding?.symbol === 'string' ? holding.symbol : '';
    const companyId = typeof holding?.companyId === 'string' ? holding.companyId.trim() : '';
    const status = holding?.identityStatus;
    const disposition = holding?.resolutionDisposition;

    if (disposition === 'NON_PRODUCTION_OPERATOR_BYPASS') {
      assessments.push({
        symbol,
        saveable: false,
        code: 'NON_PRODUCTION_BYPASS_REFUSED',
        reason: 'The non-production operator bypass is neither emitted nor accepted on the durable path.',
      });
      refusedHoldings.push({
        symbol,
        reason: 'NON_PRODUCTION_BYPASS_REFUSED: the non-production operator bypass is not accepted.',
      });
      continue;
    }

    if (status === 'UNRESOLVED') {
      if (companyId.length > 0) {
        assessments.push({
          symbol,
          saveable: false,
          code: 'IDENTITY_FABRICATED',
          reason: 'An UNRESOLVED holding carries a non-empty canonical identity; that identity was not resolved by IPD.',
        });
        refusedHoldings.push({
          symbol,
          reason: 'IDENTITY_FABRICATED: an UNRESOLVED holding must carry an empty canonical identity.',
        });
        continue;
      }
      assessments.push({
        symbol,
        saveable: false,
        code: 'UNMAPPED_IDENTIFIER',
        reason: 'The holding has no single canonical resolution at the governed identity authority.',
      });
      refusedHoldings.push({
        symbol,
        reason: 'UNMAPPED_IDENTIFIER: the holding has no single canonical resolution.',
      });
      continue;
    }

    if (status !== 'RESOLVED') {
      assessments.push({
        symbol,
        saveable: false,
        code: 'UNMAPPED_IDENTIFIER',
        reason: 'The holding carries no governed identity resolution.',
      });
      refusedHoldings.push({
        symbol,
        reason: 'UNMAPPED_IDENTIFIER: the holding carries no governed identity resolution.',
      });
      continue;
    }

    if (companyId.length === 0 || companyId === 'UNKNOWN') {
      assessments.push({
        symbol,
        saveable: false,
        code: 'CANONICAL_IDENTITY_MISSING',
        reason: 'The holding claims a resolved identity but carries no canonical company identity.',
      });
      refusedHoldings.push({
        symbol,
        reason: 'CANONICAL_IDENTITY_MISSING: a resolved holding carries no canonical company identity.',
      });
      continue;
    }

    assessments.push({ symbol, saveable: true });
  }

  const refused = refusedHoldings.length;
  if (refused > 0) {
    return {
      saveable: false,
      assessments,
      refusedHoldings,
      disabledReason:
        `Gate E W-6 / DP-2 Option 2F: ${refused} holding(s) have no single canonical identity. ` +
        'They may be previewed and explained, but the whole request is refused before any ' +
        'serialization, port call or persistence, and no canonical identity is ever fabricated.',
    };
  }

  return { saveable: true, assessments, refusedHoldings: [] };
}

/* ------------------------------------------------------------------ *
 * Deterministic mapping and provenance
 * ------------------------------------------------------------------ */

/**
 * Maps an import vector to the durable holding vector.
 *
 * The mapping is deterministic (sorted by symbol) and value-preserving: no
 * field is recomputed, rounded, defaulted or invented. `companyId` is carried
 * verbatim — the empty string stays the empty string.
 */
export function mapBrokerImportHoldings(
  holdings: readonly BrokerImportHolding[],
): HoldingInput[] {
  return [...holdings]
    .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
    .map((holding) => ({
      symbol: holding.symbol,
      companyId: holding.companyId,
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      currentPrice: holding.currentPrice,
      marketValue: holding.marketValue,
      weightPercentage: holding.weightPercentage,
      active: holding.active,
      sourceBroker: holding.sourceBroker,
      lineageDigest: holding.lineageDigest,
      identityStatus: holding.identityStatus,
      resolutionDisposition: holding.resolutionDisposition,
    }));
}

/**
 * The deterministic provenance digest of one import.
 *
 * It binds the import to the broker file it came from, so that:
 *   - re-importing the SAME file produces the same digest, and the durable
 *     store's BI-08 duplicate rule turns it into a no-op;
 *   - a DIFFERENT file produces a different digest, and is a new import even
 *     when the holdings it carries happen to be identical.
 */
export function computeBrokerImportProvenance(request: BrokerImportRequest): string {
  const canonical = [
    `portfolio:${request.portfolioId}`,
    `file:${request.fileName}`,
    `broker:${request.sourceBroker}`,
    `content:${request.contentDigest}`,
    ...[...request.holdings]
      .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
      .map(
        (h) =>
          `${h.symbol}|${h.companyId}|${h.quantity}|${h.averageBuyPrice}|${h.currentPrice}|` +
          `${h.marketValue}|${h.weightPercentage}|${h.active}|${h.sourceBroker}|${h.lineageDigest}|` +
          `${h.identityStatus}|${h.resolutionDisposition}`,
      ),
  ].join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/* ------------------------------------------------------------------ *
 * The durable import writer
 * ------------------------------------------------------------------ */

/**
 * The write surface this boundary needs. Both the durable store and the
 * W-1-gated durable port satisfy it; the port is what refuses the write while
 * the Gate E W-1 conjunction is unmet.
 */
export interface BrokerImportWriter {
  list(owner: OwnerRef): PortfolioSummary[];
  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number;
  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number;
}

/* ------------------------------------------------------------------ *
 * The import itself
 * ------------------------------------------------------------------ */

/**
 * Persists one broker import into an owner-scoped durable portfolio.
 *
 * Order of evaluation (each step is fail-closed and has zero store effect):
 *   1. the governed identity gate (W-6 / DP-2 2F) — before any serialization;
 *   2. the write gate (W-1) — inside the writer, before any mutation;
 *   3. the store's own guards, revision check and BI-08 duplicate rule.
 *
 * The owner is supplied by the caller because IPD resolves it per request from
 * its own `ACTIVE` binding; this boundary never resolves, infers or accepts an
 * owner from the import itself.
 */
export function persistBrokerImport(
  writer: BrokerImportWriter,
  owner: OwnerRef,
  request: BrokerImportRequest,
): BrokerImportOutcome {
  const gate = evaluateBrokerImportIdentityGate(request.holdings);
  if (!gate.saveable) {
    return {
      ok: false,
      code: 'REFUSED_UNRESOLVED_IDENTITY',
      message: gate.disabledReason ?? 'The import has no single canonical identity.',
      storeEffect: 'NONE',
      refusedHoldings: gate.refusedHoldings,
    };
  }

  if (request.holdings.length === 0) {
    return {
      ok: false,
      code: 'REFUSED_STORE_GUARD',
      message: 'The import carries no holdings.',
      storeEffect: 'NONE',
      refusedHoldings: [],
    };
  }

  if (typeof request.contentDigest !== 'string' || request.contentDigest.length === 0) {
    return {
      ok: false,
      code: 'INVALID_REQUEST',
      message: 'The import carries no content digest, so it cannot be made idempotent.',
      storeEffect: 'NONE',
      refusedHoldings: [],
    };
  }

  const holdings = mapBrokerImportHoldings(request.holdings);
  const provenanceDigest = computeBrokerImportProvenance(request);
  const storeRequest: PortfolioSaveRequest = {
    holdings,
    provenanceDigest,
    contentDigest: request.contentDigest,
    operation: request.mode === 'REPLACE' ? 'REPLACE' : 'MERGE',
  };

  const existing = writer.list(owner).find((p) => p.portfolioId === request.portfolioId);

  try {
    if (!existing) {
      const revision = writer.create(owner, request.portfolioId, storeRequest);
      return {
        ok: true,
        disposition: 'SAVED_NEW_BATCH',
        revision,
        noOp: false,
        storeEffect: 'REVISION_COMMITTED',
        holdingsPersisted: holdings.length,
        totalMarketValue: holdings.reduce((sum, h) => sum + h.marketValue, 0),
        contributions: 1,
        message: 'The import was committed as a new batch.',
      };
    }

    const revision = writer.save(owner, request.portfolioId, storeRequest, existing.revision);
    if (revision === existing.revision) {
      // The durable store returns the unchanged revision for its idempotent
      // no-op path: the content digest already has a committed contribution.
      return {
        ok: true,
        disposition: 'ALREADY_IMPORTED_NO_OP',
        revision,
        noOp: true,
        storeEffect: 'NONE',
        holdingsPersisted: existing.holdingsCount,
        totalMarketValue: existing.totalMarketValue,
        contributions: 0,
        message: 'This broker file was already imported; state was preserved without duplication.',
      };
    }
    return {
      ok: true,
      disposition: 'MERGED_INTO_EXISTING',
      revision,
      noOp: false,
      storeEffect: 'REVISION_COMMITTED',
      holdingsPersisted: holdings.length,
      totalMarketValue: holdings.reduce((sum, h) => sum + h.marketValue, 0),
      contributions: 1,
      message: 'The import was merged into the existing portfolio.',
    };
  } catch (error: unknown) {
    if (error instanceof WriteNotAuthorizedError) {
      return {
        ok: false,
        code: 'WRITE_NOT_AUTHORIZED',
        message:
          'The Gate E W-1 write gate refused the write; no revision, holding row, contribution row ' +
          'or success response was produced.',
        storeEffect: 'NONE',
        refusedHoldings: [],
        revision: existing?.revision,
      };
    }
    if (error instanceof RevisionConflictError) {
      return {
        ok: false,
        code: 'REVISION_CONFLICT',
        message: error.message,
        storeEffect: 'NONE',
        refusedHoldings: [],
        revision: existing?.revision,
      };
    }
    if (error instanceof ResourceUnavailableError) {
      return {
        ok: false,
        code: 'RESOURCE_UNAVAILABLE',
        message: 'The requested resource is not available.',
        storeEffect: 'NONE',
        refusedHoldings: [],
      };
    }
    if (error instanceof InvalidPortfolioRequestError) {
      return {
        ok: false,
        code: 'INVALID_REQUEST',
        message: error.message,
        storeEffect: 'NONE',
        refusedHoldings: [],
      };
    }
    return {
      ok: false,
      code: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : String(error),
      storeEffect: 'NONE',
      refusedHoldings: [],
    };
  }
}
