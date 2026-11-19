/**
 * Daily full-snapshot import: successor revisions, absence carry-forward,
 * partial acceptance, and later resolution.
 *
 * This is the snapshot-shaped sibling of `persistBrokerImport`. The plain
 * import path keeps its exact existing contract; this module adds the four
 * behaviours a daily full-book reconciliation needs and that the plain path
 * empirically does not provide:
 *
 *   1. IMPORT IDENTITY (§4). The contribution key is a durable `importId`
 *      derived deterministically from the source digest + observation time +
 *      operator identity, so a retry of the same operation is an idempotent
 *      no-op while genuinely new bytes (or the same bytes on a new day) are a
 *      new successor revision.
 *   2. ABSENCE (§2). A previously-held security missing from the snapshot is
 *      carried forward and flagged, never dropped.
 *   3. PARTIAL ACCEPTANCE (§5). Assessment is per row; nothing is written until
 *      the operator explicitly approves the exact summary it was shown.
 *   4. UNRESOLVED EVIDENCE (§5). Unresolved rows are retained durably and stay
 *      outstanding until resolved later, without re-importing the file.
 *
 * Revision 1 is never touched: every accepted snapshot is a new successor
 * revision through the existing persistence workflow.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { BrokerObservationResolver } from '../identity/broker_observation_resolver.js';
import { createGovernedBrokerObservationResolver } from '../identity/broker_observation_resolver.js';
import type {
  BrokerImportHolding,
  BrokerImportOutcome,
  BrokerImportRequest,
  BrokerPartialAcceptanceSummary,
  BrokerImportRefusalCode,
  BrokerSnapshotState,
  BrokerSnapshotUnresolvedRow,
} from '../contracts/broker_import_ipc.js';
import {
  CommitOutcomeUnknownError,
  InvalidPortfolioRequestError,
  ResourceUnavailableError,
  RevisionConflictError,
  WriteNotAuthorizedError,
  type HoldingInput,
  type OwnerRef,
  type PortfolioSaveRequest,
  type PortfolioSummary,
} from './portfolio_store.js';
import {
  computeBrokerImportProvenance,
  mapBrokerImportHoldings,
  type BrokerImportWriter,
  type MapBrokerImportHoldingsOptions,
  type ResolvedBrokerImportHolding,
} from './brokerImportPersistence.js';
import {
  findDuplicateSymbols,
  reconcileFullSnapshot,
  summariseReconciliation,
  type PriorObservedHolding,
} from './daily_snapshot_reconciliation.js';
import {
  recordUnresolvedEvidence,
  countOutstandingUnresolved,
} from './broker_snapshot_ledger.js';

/** The store capabilities a snapshot import needs beyond the plain writer. */
export interface SnapshotImportWriter extends BrokerImportWriter {
  get(owner: OwnerRef, portfolioId: string): { readonly holdings: readonly HoldingInput[] };
  withBrokerImportTransaction<T>(owner: OwnerRef, work: (writer: SnapshotImportWriter) => T): T;
}

const HEX_64 = /^[0-9a-f]{64}$/;

/**
 * Durable import-operation identity.
 *
 * Deterministic so that a retry of the SAME operation reproduces the SAME id
 * without the caller having to remember it, yet bound to the source digest AND
 * the observation time AND the operator, so:
 *   - identical bytes re-supplied on a new day yield a new id (new revision);
 *   - a retry of the same operation yields the same id (idempotent no-op);
 *   - a different operator's identical file is a different operation.
 */
export function deriveImportId(
  contentDigest: string,
  observationTime: string,
  operator: string,
): string {
  return createHash('sha256')
    .update(['import.v1', contentDigest, observationTime, operator].join('\n'), 'utf8')
    .digest('hex');
}

const SNAPSHOT_REFUSAL_CODES = {
  DUPLICATE: 'REFUSED_DUPLICATE_ROWS',
  EMPTY: 'REFUSED_EMPTY_SNAPSHOT',
  BAD_DIGEST: 'REFUSED_INVALID_SOURCE_DIGEST',
  NO_IDENTITY: 'REFUSED_UNRESOLVED_IDENTITY',
  BAD_APPROVAL: 'REFUSED_APPROVAL_MISMATCH',
} as const;

export type SnapshotRefusalCode = BrokerImportRefusalCode;

export interface SnapshotRefusalOutcome {
  readonly ok: false;
  readonly code: BrokerImportRefusalCode;
  readonly message: string;
  readonly storeEffect: 'NONE';
  readonly refusedHoldings: readonly { readonly symbol: string; readonly reason: string }[];
  readonly revision?: number;
  readonly importId?: string;
}

function refuse(
  code: BrokerImportRefusalCode,
  message: string,
  extra: Partial<SnapshotRefusalOutcome> = {},
): SnapshotRefusalOutcome {
  return { ok: false, code, message, storeEffect: 'NONE', refusedHoldings: [], ...extra };
}

function digestOfCanonical(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Digest of the exact acceptance summary the operator is shown. Approval is
 * bound to this value, so an approval captured for one set of rows cannot be
 * replayed against a different set — including a re-ordered or re-priced file.
 */
export function computeAcceptanceSummaryDigest(
  summary: Omit<BrokerPartialAcceptanceSummary, 'summaryDigest'>,
): string {
  const canonical = [
    `import:${summary.importId}`,
    `rows:${summary.totalRows}`,
    `resolved:${summary.resolvedCount}`,
    `unresolved:${summary.unresolvedCount}`,
    `value:${summary.resolvedMarketValue}`,
    ...[...summary.refusedHoldings]
      .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
      .map((row) =>
        [
          row.symbol,
          row.isin ?? '',
          row.exchange ?? '',
          row.series ?? '',
          row.quantity,
          row.averageBuyPrice,
          row.currentPrice,
          row.marketValue,
          row.dpQty ?? '',
          row.availableQty ?? '',
          row.profitLoss ?? '',
          row.pnlPercentage ?? '',
          row.reason,
          row.sourceRevision ?? '',
        ].join('|'),
      ),
    ...summary.duplicateSymbols.map((dup) => `${dup.symbol}:${dup.occurrences}`),
  ].join('\n');
  return digestOfCanonical(canonical);
}

function priorObservedFromHoldings(holdings: readonly HoldingInput[]): PriorObservedHolding[] {
  return holdings.map((holding) => ({
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
    identityStatus: holding.identityStatus ?? null,
    resolutionDisposition: holding.resolutionDisposition ?? null,
    securityIdentity: holding.securityIdentity ?? null,
    dpQty: holding.dpQty ?? null,
    availableQty: holding.availableQty ?? null,
    profitLoss: holding.profitLoss ?? null,
    pnlPercentage: holding.pnlPercentage ?? null,
  }));
}

interface RowAssessment {
  readonly resolved: ResolvedBrokerImportHolding[];
  readonly unresolved: BrokerSnapshotUnresolvedRow[];
}

/** Assesses each row independently against the governed identity resolver. */
function assessRows(
  holdings: readonly BrokerImportHolding[],
  resolver: BrokerObservationResolver,
  asOf: string,
): RowAssessment {
  const resolved: ResolvedBrokerImportHolding[] = [];
  const unresolved: BrokerSnapshotUnresolvedRow[] = [];
  for (const holding of holdings) {
    const outcome = resolver.resolve(holding, asOf);
    if (outcome.status === 'RESOLVED') {
      resolved.push({
        ...holding,
        companyId: outcome.companyId,
        identityStatus: 'RESOLVED',
        resolutionDisposition: 'CANONICAL_P04',
      });
      continue;
    }
    unresolved.push({
      symbol: holding.symbol,
      isin: holding.isin,
      exchange: holding.exchange,
      series: holding.series,
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      currentPrice: holding.currentPrice,
      marketValue: holding.marketValue,
      dpQty: holding.dpQty ?? null,
      availableQty: holding.availableQty ?? null,
      profitLoss: holding.profitLoss ?? null,
      pnlPercentage: holding.pnlPercentage ?? null,
      sourceBroker: holding.sourceBroker,
      lineageDigest: holding.lineageDigest,
      reason: outcome.reason,
      sourceRevision: outcome.sourceRevision,
    });
  }
  return { resolved, unresolved };
}

export interface PersistSnapshotOptions {
  readonly resolver?: BrokerObservationResolver;
  readonly mapOptions?: MapBrokerImportHoldingsOptions;
  /** Operator principal recorded on the approval and used for the operation id. */
  readonly operator?: string;
  /** Observation time; defaults to `request.importedAt`. */
  readonly observationTime?: string;
}

/**
 * Imports one daily full snapshot.
 *
 * Two-phase by design: an assessment that writes NOTHING and reports what it
 * found, and a commit that re-runs that assessment from the same immutable
 * inputs and refuses if the operator's approval does not bind to it.
 */
export function persistDailySnapshot(
  writer: SnapshotImportWriter,
  db: DatabaseSync,
  owner: OwnerRef,
  request: BrokerImportRequest,
  options: PersistSnapshotOptions = {},
): BrokerImportOutcome {
  const resolver = options.resolver ?? createGovernedBrokerObservationResolver();
  const operator = options.operator ?? owner.canonicalOwnerId;
  const observationTime = options.observationTime ?? request.importedAt;

  // --- Input validation -----------------------------------------------------
  if (!request || typeof request !== 'object') {
    return refuse('REFUSED_EMPTY_SNAPSHOT', 'The snapshot request is missing.');
  }
  if (typeof request.contentDigest !== 'string' || !HEX_64.test(request.contentDigest)) {
    return refuse('REFUSED_INVALID_SOURCE_DIGEST', 'The snapshot carries no 64-hex source digest.');
  }
  if (!Array.isArray(request.holdings) || request.holdings.length === 0) {
    return refuse('REFUSED_EMPTY_SNAPSHOT', 'The snapshot carries no holdings.');
  }
  if (!['MERGE', undefined].includes(request.mode)) {
    return refuse('REFUSED_EMPTY_SNAPSHOT', 'REPLACE has no disposition in the snapshot contract and is refused.');
  }

  // --- Deterministic duplicate policy --------------------------------------
  // Refuse rather than sum/average/deduplicate: any merge of duplicated broker
  // rows would invent a position the broker never reported.
  const duplicates = findDuplicateSymbols(request.holdings);
  if (duplicates.length > 0) {
    return refuse(
      'REFUSED_DUPLICATE_ROWS',
      `The snapshot contains duplicated symbol rows: ${duplicates.map((d) => `${d.symbol}×${d.occurrences}`).join(', ')}. Nothing was written.`,
      {
        refusedHoldings: duplicates.map((d) => ({ symbol: d.symbol, reason: d.reason })),
      },
    );
  }

  const importId = request.importId && HEX_64.test(request.importId)
    ? request.importId
    : deriveImportId(request.contentDigest, observationTime, operator);

  // --- Per-row assessment --------------------------------------------------
  const { resolved, unresolved } = assessRows(request.holdings, resolver, request.importedAt);
  const resolvedMarketValue = resolved.reduce((sum, holding) => sum + holding.marketValue, 0);
  const summaryWithoutDigest = {
    importId,
    totalRows: request.holdings.length,
    resolvedCount: resolved.length,
    unresolvedCount: unresolved.length,
    resolvedMarketValue,
    refusedHoldings: unresolved,
    duplicateSymbols: duplicates,
  };
  const summary: BrokerPartialAcceptanceSummary = {
    ...summaryWithoutDigest,
    summaryDigest: computeAcceptanceSummaryDigest(summaryWithoutDigest),
  };

  if (unresolved.length > 0) {
    // Never all-or-nothing, never silent. Two distinct outcomes:
    //  - no approval supplied  -> require it, write nothing;
    //  - approval supplied     -> it must bind to THIS summary exactly.
    const approval = request.partialAcceptance;
    if (!approval) {
      return {
        ok: false,
        code: 'PARTIAL_ACCEPTANCE_REQUIRED',
        message:
          `This snapshot has ${unresolved.length} unresolved row(s). Nothing has been written. `
          + 'Confirm partial acceptance to persist the resolved rows and retain the unresolved rows as evidence.',
        storeEffect: 'NONE',
        summary,
      };
    }
    if (approval.approved !== true || approval.summaryDigest !== summary.summaryDigest) {
      return refuse(
        'REFUSED_APPROVAL_MISMATCH',
        'The partial-acceptance approval does not bind to the current snapshot summary; nothing was written.',
        { refusedHoldings: unresolved.map((row) => ({ symbol: row.symbol, reason: row.reason })), importId },
      );
    }
  } else if (request.partialAcceptance) {
    return refuse(
      'REFUSED_APPROVAL_MISMATCH',
      'A partial-acceptance approval was supplied for a snapshot with nothing unresolved.',
      { importId },
    );
  }

  // --- Commit --------------------------------------------------------------
  const mapped = mapBrokerImportHoldings(resolved, options.mapOptions ?? {});
  const provenanceDigest = computeBrokerImportProvenance(request);
  const acceptingPartially = unresolved.length > 0;
  const snapshotState: BrokerSnapshotState = acceptingPartially ? 'PARTIALLY_ACCEPTED' : 'ACCEPTED';

  const run = (transactionWriter: SnapshotImportWriter) => {
    const existing: PortfolioSummary | undefined = transactionWriter
      .list(owner)
      .find((portfolio) => portfolio.portfolioId === request.portfolioId);
    const currentRevision = existing ? existing.revision : 0;
    if (!existing && request.expectedRevision !== 0) {
      return refuse('REFUSED_EMPTY_SNAPSHOT', 'No portfolio exists at revision 0.');
    }
    if (existing && request.expectedRevision !== currentRevision) {
      return refuse('REFUSED_EMPTY_SNAPSHOT', `Expected revision ${request.expectedRevision} but the portfolio is at ${currentRevision}.`);
    }

    // Prior observation, from the CURRENT revision only. Revision 1 and every
    // earlier revision stay untouched.
    const previous = priorObservedFromHoldings(existing ? transactionWriter.get(owner, request.portfolioId).holdings : []);
    const observedWithFields = mapped.map((holding) => ({
      ...holding,
      dpQty: holding.dpQty ?? null,
      availableQty: holding.availableQty ?? null,
      profitLoss: holding.profitLoss ?? null,
      pnlPercentage: holding.pnlPercentage ?? null,
    }));

    const reconciled = reconcileFullSnapshot(observedWithFields, {
      previous,
      firstSnapshot: !existing,
    });

    const holdings: HoldingInput[] = reconciled.holdings.map((holding) => ({
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
      identityStatus: holding.identityStatus ?? 'RESOLVED',
      resolutionDisposition: holding.resolutionDisposition ?? 'CANONICAL_P04',
      securityIdentity: (holding.securityIdentity ?? null) as HoldingInput['securityIdentity'],
      dpQty: holding.dpQty ?? null,
      availableQty: holding.availableQty ?? null,
      profitLoss: holding.profitLoss ?? null,
      pnlPercentage: holding.pnlPercentage ?? null,
      reconciliationState: holding.reconciliationState,
      carriedForward: holding.carriedForward,
    }));

    const storeRequest: PortfolioSaveRequest = {
      holdings,
      provenanceDigest,
      contentDigest: request.contentDigest,
      operation: 'MERGE',
      importId,
      snapshotState,
      unresolvedCount: unresolved.length,
      brokerImportProvenance: {
        fileName: request.fileName,
        sourceBroker: request.sourceBroker,
        contentDigest: request.contentDigest,
        lineageDigest: provenanceDigest,
        importedAt: request.importedAt,
        semantics: existing ? 'MERGED_INTO_EXISTING' : 'SAVED_NEW_BATCH',
      },
    };

    const revision = existing
      ? transactionWriter.save(owner, request.portfolioId, storeRequest, request.expectedRevision)
      : transactionWriter.create(owner, request.portfolioId, storeRequest);

    if (existing && revision === request.expectedRevision) {
      // Idempotent retry of the same import operation: no new revision, no new
      // evidence rows, no duplicate holdings.
      return {
        ok: true as const,
        disposition: 'ALREADY_IMPORTED_NO_OP' as const,
        revision,
        noOp: true,
        storeEffect: 'NONE' as const,
        holdingsPersisted: existing.holdingsCount,
        totalMarketValue: existing.totalMarketValue,
        contributions: 0,
        message: 'This import operation was already recorded; state was preserved without duplication.',
        importId,
        snapshotState,
        unresolvedCount: unresolved.length,
      };
    }

    const recordedEvidence = recordUnresolvedEvidence(
      db,
      {
        canonicalOwnerId: owner.canonicalOwnerId,
        portfolioId: request.portfolioId,
        importId,
        observationTime,
        createdAt: request.importedAt,
      },
      unresolved,
    );

    return {
      ok: true as const,
      disposition: existing ? ('MERGED_INTO_EXISTING' as const) : ('SAVED_NEW_BATCH' as const),
      revision,
      noOp: false,
      storeEffect: 'REVISION_COMMITTED' as const,
      holdingsPersisted: holdings.length,
      totalMarketValue: reconciled.totalMarketValue,
      contributions: 1,
      message: acceptingPartially
        ? `Snapshot committed as revision ${revision}: ${resolved.length} resolved row(s) persisted, ${recordedEvidence} unresolved row(s) retained as evidence.`
        : `Snapshot committed as revision ${revision}: ${resolved.length} resolved row(s) persisted.`,
      importId,
      snapshotState,
      unresolvedCount: unresolved.length,
      reconciliation: summariseReconciliation(reconciled),
    };
  };

  try {
    return writer.withBrokerImportTransaction(owner, run);
  } catch (error) {
    // Same error mapping as the plain import path: a failed transaction leaves
    // no partial state, and the refusal names the real cause.
    if (error instanceof CommitOutcomeUnknownError) {
      return {
        ok: 'unknown',
        code: 'OUTCOME_UNKNOWN',
        message:
          'The transaction acknowledgement was lost; reconcile against the stored import evidence before retrying with the same importId.',
        storeEffect: 'OUTCOME_UNKNOWN',
        portfolioId: request.portfolioId,
        contentDigest: request.contentDigest,
        importId,
      };
    }
    if (error instanceof WriteNotAuthorizedError) {
      return refuse('WRITE_NOT_AUTHORIZED', 'The write gate refused the write; nothing was persisted.', { importId });
    }
    if (error instanceof RevisionConflictError) {
      return refuse('REVISION_CONFLICT', error.message, { importId });
    }
    if (error instanceof ResourceUnavailableError) {
      return refuse('RESOURCE_UNAVAILABLE', 'The requested resource is not available.', { importId });
    }
    if (error instanceof InvalidPortfolioRequestError) {
      return refuse('INVALID_REQUEST', error.message, { importId });
    }
    return refuse('INVALID_REQUEST', error instanceof Error ? error.message : String(error), { importId });
  }
}

/** Assessment-only view used to build the confirmation prompt. */
export function assessSnapshotAcceptance(
  request: BrokerImportRequest,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
  operator = 'operator',
  observationTime?: string,
): BrokerPartialAcceptanceSummary {
  const { resolved, unresolved } = assessRows(request.holdings ?? [], resolver, request.importedAt);
  const importId = request.importId && HEX_64.test(request.importId)
    ? request.importId
    : deriveImportId(request.contentDigest, observationTime ?? request.importedAt, operator);
  const duplicates = findDuplicateSymbols(request.holdings ?? []);
  const summarisable = {
    importId,
    totalRows: (request.holdings ?? []).length,
    resolvedCount: resolved.length,
    unresolvedCount: unresolved.length,
    resolvedMarketValue: resolved.reduce((sum, holding) => sum + holding.marketValue, 0),
    refusedHoldings: unresolved,
    duplicateSymbols: duplicates,
  };
  return { ...summarisable, summaryDigest: computeAcceptanceSummaryDigest(summarisable) };
}

export { countOutstandingUnresolved };
