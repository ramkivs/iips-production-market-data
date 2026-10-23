import { createHash } from 'node:crypto';
import {
  CommitOutcomeUnknownError,
  InvalidPortfolioRequestError,
  ResourceUnavailableError,
  RevisionConflictError,
  WriteNotAuthorizedError,
  findCallerSuppliedIdentityKeys,
  type BrokerImportProvenance,
  type HoldingInput,
  type OwnerRef,
  type PortfolioContribution,
  type PortfolioSaveRequest,
  type PortfolioSummary,
} from './portfolio_store.js';
import { createGovernedBrokerObservationResolver } from '../identity/broker_observation_resolver.js';
import type { BrokerObservationResolver } from '../identity/broker_observation_resolver.js';
import type { IdentityQuarantineRecord } from '../identity/quarantine.js';

/** Raw broker-observed holding only: canonical identity claims are forbidden. */
export interface BrokerImportHolding {
  readonly symbol: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
  readonly quantity: number;
  readonly averageBuyPrice: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly weightPercentage: number;
  readonly active: boolean;
  readonly sourceBroker: string;
  readonly lineageDigest: string;
}

export interface ResolvedBrokerImportHolding extends BrokerImportHolding {
  readonly companyId: string;
  readonly identityStatus: 'RESOLVED';
  readonly resolutionDisposition: 'CANONICAL_P04';
}

export interface BrokerImportRequest {
  readonly portfolioId: string;
  readonly expectedRevision: number;
  readonly holdings: readonly BrokerImportHolding[];
  readonly contentDigest: string;
  readonly fileName: string;
  readonly sourceBroker: string;
  readonly importedAt: string;
  readonly mode?: 'MERGE' | 'REPLACE';
}

export type BrokerImportRefusalCode =
  | 'REFUSED_UNRESOLVED_IDENTITY'
  | 'REFUSED_STORE_GUARD'
  | 'WRITE_NOT_AUTHORIZED'
  | 'INVALID_REQUEST'
  | 'REVISION_CONFLICT'
  | 'RESOURCE_UNAVAILABLE';

export interface BrokerImportRefusedHolding {
  readonly symbol: string;
  readonly reason: string;
  readonly sourceRevision?: string;
  readonly quarantineRecord?: IdentityQuarantineRecord;
}

export type BrokerImportDisposition = 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'ALREADY_IMPORTED_NO_OP';
export type BrokerImportStoreEffect = 'NONE' | 'REVISION_COMMITTED';

export interface BrokerImportSuccess {
  readonly ok: true;
  readonly disposition: BrokerImportDisposition;
  readonly revision: number;
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
  readonly storeEffect: 'NONE';
  readonly refusedHoldings: readonly BrokerImportRefusedHolding[];
  readonly revision?: number;
}

export interface BrokerImportOutcomeUnknown {
  readonly ok: 'unknown';
  readonly code: 'OUTCOME_UNKNOWN';
  readonly message: string;
  readonly storeEffect: 'OUTCOME_UNKNOWN';
  readonly portfolioId: string;
  readonly contentDigest: string;
}

export type BrokerImportOutcome = BrokerImportSuccess | BrokerImportRefusal | BrokerImportOutcomeUnknown;

export interface BrokerImportIdentityAssessment {
  readonly symbol: string;
  readonly saveable: boolean;
  readonly reason?: string;
  readonly sourceRevision?: string;
  readonly quarantineRecord?: IdentityQuarantineRecord;
}

export interface BrokerImportIdentityGate {
  readonly saveable: boolean;
  readonly assessments: readonly BrokerImportIdentityAssessment[];
  readonly refusedHoldings: readonly BrokerImportRefusedHolding[];
  readonly disabledReason?: string;
}

function resolveHoldings(
  request: BrokerImportRequest,
  resolver: BrokerObservationResolver,
): { resolved?: ResolvedBrokerImportHolding[]; gate: BrokerImportIdentityGate } {
  const assessments: BrokerImportIdentityAssessment[] = [];
  const refusedHoldings: BrokerImportRefusedHolding[] = [];
  const resolved: ResolvedBrokerImportHolding[] = [];
  for (const holding of request.holdings ?? []) {
    const outcome = resolver.resolve(holding, request.importedAt);
    if (outcome.status !== 'RESOLVED') {
      assessments.push({ symbol: holding.symbol, saveable: false, reason: outcome.reason, sourceRevision: outcome.sourceRevision, quarantineRecord: outcome.quarantineRecord });
      refusedHoldings.push({ symbol: holding.symbol, reason: outcome.reason, sourceRevision: outcome.sourceRevision, quarantineRecord: outcome.quarantineRecord });
      continue;
    }
    assessments.push({ symbol: holding.symbol, saveable: true, sourceRevision: outcome.sourceRevision });
    resolved.push({ ...holding, companyId: outcome.companyId, identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04' });
  }
  const gate: BrokerImportIdentityGate = refusedHoldings.length
    ? {
        saveable: false,
        assessments,
        refusedHoldings,
        disabledReason: 'Gate E W-6 / DP-2 Option 2F: the whole import is refused unless every holding has one governed canonical identity.',
      }
    : { saveable: true, assessments, refusedHoldings: [] };
  return { resolved: gate.saveable ? resolved : undefined, gate };
}

export function evaluateBrokerImportIdentityGate(
  holdings: readonly BrokerImportHolding[] | undefined | null,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
  asOf = new Date().toISOString(),
): BrokerImportIdentityGate {
  const request = {
    portfolioId: 'identity-assessment',
    expectedRevision: 0,
    holdings: holdings ?? [],
    contentDigest: 'assessment-only',
    fileName: 'assessment-only',
    sourceBroker: 'assessment-only',
    importedAt: asOf,
  } satisfies BrokerImportRequest;
  return resolveHoldings(request, resolver).gate;
}

export function mapBrokerImportHoldings(holdings: readonly ResolvedBrokerImportHolding[]): HoldingInput[] {
  return [...holdings]
    .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
    .map((h) => ({
      symbol: h.symbol,
      companyId: h.companyId,
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      weightPercentage: h.weightPercentage,
      active: h.active,
      sourceBroker: h.sourceBroker,
      lineageDigest: h.lineageDigest,
      identityStatus: h.identityStatus,
      resolutionDisposition: h.resolutionDisposition,
    }));
}

export function computeBrokerImportProvenance(request: BrokerImportRequest): string {
  const canonical = [
    `portfolio:${request.portfolioId}`,
    `file:${request.fileName}`,
    `broker:${request.sourceBroker}`,
    `imported:${request.importedAt}`,
    `content:${request.contentDigest}`,
    ...[...request.holdings]
      .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
      .map((h) => `${h.symbol}|${h.isin ?? ''}|${h.exchange ?? ''}|${h.quantity}|${h.averageBuyPrice}|${h.currentPrice}|${h.marketValue}|${h.weightPercentage}|${h.active}|${h.sourceBroker}|${h.lineageDigest}`),
  ].join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export interface BrokerImportWriter {
  list(owner: OwnerRef): PortfolioSummary[];
  create(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest): number;
  save(owner: OwnerRef, portfolioId: string, request: PortfolioSaveRequest, expectedRevision: number): number;
  withBrokerImportTransaction<T>(owner: OwnerRef, work: (writer: BrokerImportWriter) => T): T;
  contributions(owner: OwnerRef, portfolioId: string): PortfolioContribution[];
}

function findRefusedBrokerKeys(value: unknown, depth = 0): string[] {
  if (depth > 12 || value === null || typeof value !== 'object') return [];
  const refused = new Set(['companyId', 'runtimeCompanyId', 'identityStatus', 'resolutionDisposition']);
  if (Array.isArray(value)) return [...new Set(value.flatMap((item) => findRefusedBrokerKeys(item, depth + 1)))].sort();
  const found = new Set<string>();
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (refused.has(key)) found.add(key);
    for (const inner of findRefusedBrokerKeys(nested, depth + 1)) found.add(inner);
  }
  return [...found].sort();
}

function validateRequest(request: BrokerImportRequest): string | undefined {
  if (!request || typeof request !== 'object') return 'The import request is missing.';
  const identityKeys = [...new Set([...findCallerSuppliedIdentityKeys(request), ...findRefusedBrokerKeys(request)])].sort();
  if (identityKeys.length) return `Caller-supplied identity or authority keys are refused: ${identityKeys.join(', ')}.`;
  if (typeof request.portfolioId !== 'string' || !request.portfolioId.trim()) return 'A portfolio id is required.';
  if (!Number.isInteger(request.expectedRevision) || request.expectedRevision < 0) return 'A non-negative expectedRevision is required.';
  if (!Array.isArray(request.holdings) || request.holdings.length === 0) return 'The import carries no holdings.';
  if (typeof request.contentDigest !== 'string' || !request.contentDigest) return 'The import carries no content digest.';
  if (typeof request.fileName !== 'string' || !request.fileName.trim()) return 'The import file name is required for provenance.';
  if (typeof request.sourceBroker !== 'string' || !request.sourceBroker.trim()) return 'The source broker is required for provenance.';
  if (!Number.isFinite(Date.parse(request.importedAt)) || new Date(request.importedAt).toISOString() !== request.importedAt) {
    return 'A UTC ISO-8601 importedAt timestamp is required for provenance.';
  }
  if (request.mode !== undefined && request.mode !== 'MERGE' && request.mode !== 'REPLACE') return 'The import mode is unsupported.';
  if (request.holdings.some((holding) => holding.sourceBroker !== request.sourceBroker)) {
    return 'Each holding source broker must match the import provenance source broker.';
  }
  return undefined;
}

function refusal(code: BrokerImportRefusalCode, message: string, refusedHoldings: readonly BrokerImportRefusedHolding[] = [], revision?: number): BrokerImportRefusal {
  return { ok: false, code, message, storeEffect: 'NONE', refusedHoldings, ...(revision === undefined ? {} : { revision }) };
}

export function persistBrokerImport(
  writer: BrokerImportWriter,
  owner: OwnerRef,
  request: BrokerImportRequest,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
): BrokerImportOutcome {
  const invalid = validateRequest(request);
  if (invalid) return refusal('INVALID_REQUEST', invalid);

  const { resolved, gate } = resolveHoldings(request, resolver);
  if (!gate.saveable || !resolved) {
    return refusal('REFUSED_UNRESOLVED_IDENTITY', gate.disabledReason ?? 'The import has no single canonical identity.', gate.refusedHoldings);
  }

  const holdings = mapBrokerImportHoldings(resolved);
  const provenanceDigest = computeBrokerImportProvenance(request);
  const run = (transactionWriter: BrokerImportWriter): BrokerImportSuccess => {
    const existing = transactionWriter.list(owner).find((p) => p.portfolioId === request.portfolioId);
    if (!existing && request.expectedRevision !== 0) {
      throw new RevisionConflictError(`expected revision ${request.expectedRevision} but no portfolio exists at revision 0`);
    }
    if (existing && request.mode === 'REPLACE') {
      throw new InvalidPortfolioRequestError('REPLACE has no disposition in the accepted broker-import contract and is refused.');
    }
    const disposition: BrokerImportProvenance['semantics'] = existing ? 'MERGED_INTO_EXISTING' : 'SAVED_NEW_BATCH';
    const brokerImportProvenance: BrokerImportProvenance = {
      fileName: request.fileName,
      sourceBroker: request.sourceBroker,
      contentDigest: request.contentDigest,
      lineageDigest: provenanceDigest,
      importedAt: request.importedAt,
      semantics: disposition,
    };
    const storeRequest: PortfolioSaveRequest = {
      holdings,
      provenanceDigest,
      contentDigest: request.contentDigest,
      operation: request.mode === 'REPLACE' ? 'REPLACE' : 'MERGE',
      brokerImportProvenance,
    };
    if (!existing) {
      const revision = transactionWriter.create(owner, request.portfolioId, storeRequest);
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
    const revision = transactionWriter.save(owner, request.portfolioId, storeRequest, request.expectedRevision);
    if (revision === request.expectedRevision) {
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
  };

  try {
    return writer.withBrokerImportTransaction(owner, run);
  } catch (error) {
    if (error instanceof CommitOutcomeUnknownError) {
      return {
        ok: 'unknown',
        code: 'OUTCOME_UNKNOWN',
        message: 'The transaction acknowledgement was lost; reconcile by reading the contribution ledger. Do not retry automatically.',
        storeEffect: 'OUTCOME_UNKNOWN',
        portfolioId: request.portfolioId,
        contentDigest: request.contentDigest,
      };
    }
    if (error instanceof WriteNotAuthorizedError) return refusal('WRITE_NOT_AUTHORIZED', 'The Gate E W-1 write gate refused the write; no success response was produced.');
    if (error instanceof RevisionConflictError) return refusal('REVISION_CONFLICT', error.message);
    if (error instanceof ResourceUnavailableError) return refusal('RESOURCE_UNAVAILABLE', 'The requested resource is not available.');
    if (error instanceof InvalidPortfolioRequestError) return refusal('INVALID_REQUEST', error.message);
    return refusal('INVALID_REQUEST', error instanceof Error ? error.message : String(error));
  }
}

export type BrokerImportReconciliation = 'COMMITTED' | 'NOT_COMMITTED' | 'UNRESOLVED';

export function reconcileBrokerImportByRead(
  writer: Pick<BrokerImportWriter, 'contributions'>,
  owner: OwnerRef,
  portfolioId: string,
  contentDigest: string,
): BrokerImportReconciliation {
  try {
    return writer.contributions(owner, portfolioId).some((row) => row.contributionId === contentDigest)
      ? 'COMMITTED'
      : 'NOT_COMMITTED';
  } catch {
    return 'UNRESOLVED';
  }
}
