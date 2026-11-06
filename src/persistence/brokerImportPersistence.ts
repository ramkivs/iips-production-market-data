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
  type RevisionEntry,
  type SnapshotDisposition,
  type SnapshotReceipt,
  type SnapshotSourceEvidence,
  type SnapshotStoreEffect,
  computeRevisionContentDigest,
  type RevisionReconciliationEvidence,
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
        message: 'The transaction acknowledgement was lost; reconcile against the stored import evidence (reconcileBrokerImportByRead with the original request). Do not retry automatically.',
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

/**
 * The evidence the v1 UNKNOWN/lost-ACK recovery path owes the reconciler: the
 * ORIGINAL broker-import request that produced the COMMIT/ROLLBACK decision.
 * Without it (or without a derivable intended outcome from it) no terminal
 * verdict but UNRESOLVED is reachable — the wire digest alone never binds the
 * successor revision or the provenance. `resolver` defaults to the governed
 * broker-observation resolver, identical to the commit path.
 */
export interface BrokerImportReconciliationExpectation {
  readonly request: BrokerImportRequest;
  readonly resolver?: BrokerObservationResolver;
}

/**
 * What the v1 reconciler requires of its writer. A `DurablePortfolioStore`
 * implements all three evidence reads plus the settlement probe. An adapter
 * that cannot prove settlement or cannot return the successor evidence
 * satisfies none of this meaningfully and always yields UNRESOLVED — reconciliation here
 * is an authorized readback, not an adapter contract.
 */
export interface BrokerImportReconciliationWriter {
  /** v1 ledger read — the same surface `BrokerImportWriter.contributions` exposes. */
  contributions(owner: OwnerRef, portfolioId: string): PortfolioContribution[];
  proveSettledForReconciliation?(): void;
  revisionReconciliationEvidence?(
    owner: OwnerRef,
    portfolioId: string,
    revision: number,
  ): RevisionReconciliationEvidence | undefined;
  holdingsForRevision?(owner: OwnerRef, portfolioId: string, revision: number): HoldingInput[];
}

/** Intended v1 outcome re-derived from the original request (commit-path math). */
export interface DerivedV1IntendedEvidence {
  readonly holdings: HoldingInput[];
  readonly provenanceDigest: string;
  /** The digest the v1 store persists in `portfolio_revisions.content_digest`. */
  readonly storedContentDigest: string;
  readonly expectedSuccessorRevision: number;
  readonly expectedOperation: 'INITIAL' | 'MERGE' | 'REPLACE';
}

/**
 * Re-derive the v1 commit path's intended evidence. Pure: validation, lineage,
 * identity resolution, provenance and digests exactly as the commit computes
 * them. Returns undefined on any failure (callers report UNRESOLVED).
 */
export function deriveV1IntendedEvidence(
  request: BrokerImportRequest,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
): DerivedV1IntendedEvidence | undefined {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return undefined;
  if (validateRequest(request)) return undefined;
  const { resolved, gate } = resolveHoldings(request, resolver);
  if (!gate.saveable || !resolved) return undefined;
  const holdings = mapBrokerImportHoldings(resolved);
  const provenanceDigest = computeBrokerImportProvenance(request);
  const expectedSuccessorRevision = request.expectedRevision + 1;
  if (!Number.isSafeInteger(expectedSuccessorRevision) || expectedSuccessorRevision < 1) return undefined;
  // v1 operation semantics: `create()` always commits INITIAL; `save()` commits
  // REPLACE for an explicit REPLACE mode, MERGE otherwise.
  const expectedOperation: DerivedV1IntendedEvidence['expectedOperation'] =
    request.expectedRevision === 0 ? 'INITIAL' : request.mode === 'REPLACE' ? 'REPLACE' : 'MERGE';
  return {
    holdings,
    provenanceDigest,
    storedContentDigest: computeRevisionContentDigest(holdings, provenanceDigest),
    expectedSuccessorRevision,
    expectedOperation,
  };
}

/** Verdict binding for a single v1 evidence fingerprint (never guesses). */
function verdictOfBrokerImportFingerprint(
  fp: EvidenceFingerprint,
  request: BrokerImportRequest,
  intended: DerivedV1IntendedEvidence,
): 'absent' | 'match' | 'other' {
  if (!fp.contribution && fp.revision === undefined && fp.holdings.length === 0) return 'absent';
  const { contribution, revision, holdings } = fp;
  if (!contribution || !revision) return 'other';
  // Contribution ↔ intended import request evidence.
  if (contribution.contributionId !== request.contentDigest) return 'other';
  if (contribution.contentDigest !== request.contentDigest) return 'other';
  if (typeof contribution.lineageDigest !== 'string' || !RECON_HEX_64.test(contribution.lineageDigest)) return 'other';
  if (contribution.lineageDigest !== intended.provenanceDigest) return 'other';
  if (contribution.fileName !== request.fileName) return 'other';
  if (contribution.sourceBroker !== request.sourceBroker) return 'other';
  if (contribution.importedAt !== request.importedAt) return 'other';
  if (!isUtcIsoInstantValue(contribution.importedAt)) return 'other';
  if (!Number.isFinite(contribution.amount) || contribution.amount < 0) return 'other';
  // A committed v1 import always records its disposition semantics.
  if (contribution.semantics !== 'SAVED_NEW_BATCH' && contribution.semantics !== 'MERGED_INTO_EXISTING') return 'other';
  // Contribution ↔ successor revision cross-binding (the expected MERGE/REPLACE successor for exactly this content).
  if (revision.revision !== intended.expectedSuccessorRevision) return 'other';
  if (revision.operation !== intended.expectedOperation) return 'other';
  if (typeof revision.committedAt !== 'string' || !isUtcIsoInstantValue(revision.committedAt)) return 'other';
  if (!Number.isSafeInteger(revision.holdingsCount) || revision.holdingsCount < 1) return 'other';
  if (revision.holdingsCount !== intended.holdings.length) return 'other';
  if (!Number.isFinite(revision.totalMarketValue) || revision.totalMarketValue < 0) return 'other';
  if (typeof revision.provenanceDigest !== 'string' || !RECON_HEX_64.test(revision.provenanceDigest)) return 'other';
  if (revision.provenanceDigest !== contribution.lineageDigest) return 'other';
  if (revision.provenanceDigest !== intended.provenanceDigest) return 'other';
  if (typeof revision.contentDigest !== 'string' || !RECON_HEX_64.test(revision.contentDigest)) return 'other';
  if (revision.contentDigest !== intended.storedContentDigest) return 'other';
  if (contribution.amount !== revision.totalMarketValue) return 'other';
  // Stored snapshot ↔ intended snapshot: exact row equality.
  if (!holdingsSnapshotsEqual(holdings, intended.holdings)) return 'other';
  const intendedTotal = intended.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  if (revision.totalMarketValue !== intendedTotal) return 'other';
  return 'match';
}

/**
 * Exact authorized readback for a v1 outcome left UNKNOWN (lost acknowledgement).
 *
 * Behaviour change (2026-11-06, bounded correction of the finding recorded in
 * the R01 investigation): the four-argument legacy call, which used to treat a
 * lone contribution-ledger row as sufficient, now ALWAYS fails closed to
 * UNRESOLVED. A terminal verdict requires ALL of:
 *
 *   (1) SETTLEMENT — the writer must implement and pass `proveSettledForReconciliation()`
 *       (zero writes). Settlement is necessary, never sufficient: it is an
 *       instantaneous observation of an open write lock, proves no open
 *       transaction at that moment, is never held through the reads and never
 *       upgrades an evidence gap. Probe failure → UNRESOLVED.
 *   (2) EVIDENCE BINDING — the original broker-import request is required;
 *       the intended successor (`expectedRevision + 1`), intended provenance
 *       and intended stored content digest are re-derived through the commit
 *       path, and the supplied `contentDigest` must match the request's.
 *   (3) CROSS-BINDING — contribution row bound to the request identities
 *       (contributionId, digest, provenance lineage, fileName, sourceBroker,
 *       round-trippable importedAt, disposition semantics), bound across to
 *       the successor revision (revision number, operation, count, totals,
 *       provenance, stored content digest), and the stored holdings snapshot
 *       must row-equal the intended snapshot.
 *   (4) TWO SERIALIZED EVIDENCE PASSES — the contribution, revision evidence
 *       and holdings are read twice; byte-identical fingerprints are required,
 *       else UNRESOLVED. Absent on both passes with settlement proven ⇒
 *       NOT_COMMITTED. Everything else ⇒ UNRESOLVED. A receipt alone is never
 *       proof; no outcome here authorizes or implies a retry.
 *
 * NOT_COMMITTED under a foreign owner means "absent under that owner's scope",
 * never "provably never committed". Reconciliation performs zero writes.
 */
export function reconcileBrokerImportByRead(
  writer: BrokerImportReconciliationWriter,
  owner: OwnerRef,
  portfolioId: string,
  contentDigest: string,
  expectation?: BrokerImportReconciliationExpectation,
): BrokerImportReconciliation {
  if (typeof contentDigest !== 'string' || !contentDigest.trim()) return 'UNRESOLVED';
  // (1) Settlement is mandatory. Adapters without the probe can never establish it.
  if (typeof writer.proveSettledForReconciliation !== 'function') return 'UNRESOLVED';
  try {
    writer.proveSettledForReconciliation();
  } catch {
    return 'UNRESOLVED';
  }
  // (2) Evidence binding — impossible without the original request.
  if (!expectation || typeof expectation !== 'object') return 'UNRESOLVED';
  const request = expectation.request;
  const intended = deriveV1IntendedEvidence(request, expectation.resolver);
  if (!intended) return 'UNRESOLVED';
  if (request.contentDigest !== contentDigest) return 'UNRESOLVED';
  if (request.portfolioId !== portfolioId) return 'UNRESOLVED';
  if (
    typeof writer.revisionReconciliationEvidence !== 'function'
    || typeof writer.holdingsForRevision !== 'function'
  ) {
    return 'UNRESOLVED';
  }
  const projection: Pick<HoldingsSnapshotWriter, 'contributionsValidated' | 'revisionReconciliationEvidence' | 'holdingsForRevision'> = {
    contributionsValidated: (o, pid) => writer.contributions(o, pid),
    revisionReconciliationEvidence: writer.revisionReconciliationEvidence.bind(writer),
    holdingsForRevision: writer.holdingsForRevision.bind(writer),
  };
  let first: EvidenceFingerprint | undefined;
  let second: EvidenceFingerprint | undefined;
  try {
    // (4) Evidence-snapshot consistency — not verdict equality.
    first = readEvidenceFingerprint(projection, owner, portfolioId, contentDigest, intended.expectedSuccessorRevision);
    second = readEvidenceFingerprint(projection, owner, portfolioId, contentDigest, intended.expectedSuccessorRevision);
  } catch {
    return 'UNRESOLVED';
  }
  if (fingerprintOf(first) !== fingerprintOf(second)) return 'UNRESOLVED';
  const verdict = verdictOfBrokerImportFingerprint(first, request, intended);
  if (verdict === 'absent') return 'NOT_COMMITTED';
  if (verdict === 'match') return 'COMMITTED';
  return 'UNRESOLVED';
}

/* ------------------------------------------------------------------ *
 * D03 — consumer contract 2.0.0 / frame v=2 snapshot service
 *
 * Pipeline: closed framing/security validation, then D03 stale-revision
 * detection (authorized read probe; zero domain effect), then domain,
 * provenance and identity rejection (governed resolution over source
 * observations, IPD-computed per-row lineage and aggregate provenance
 * digest — never a wire assertion), then the protected store transaction
 * (which re-checks stale under the serialized writer). All live product
 * writes refuse before reaching here; these primitives run in isolated
 * synthetic fixtures.
 * ------------------------------------------------------------------ */

/** A v2 observed holding row: the wire shape carries no canonical identity and no lineage claim. */
export interface SnapshotObservedHolding {
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
}

export interface SnapshotSaveV2Request {
  readonly portfolioId: string;
  readonly expectedRevision: number;
  readonly holdings: readonly SnapshotObservedHolding[];
  /** Caller evidence digest; the contribution identity (never proof of authority). */
  readonly contentDigest: string;
  readonly broker: string;
  readonly sourceEvidence: SnapshotSourceEvidence;
}

export type SnapshotV2RefusalCode =
  | 'REFUSED_UNRESOLVED_IDENTITY'
  | 'REFUSED_STORE_GUARD'
  | 'WRITE_NOT_AUTHORIZED'
  | 'INVALID_REQUEST'
  | 'REVISION_CONFLICT'
  | 'RESOURCE_UNAVAILABLE'
  | 'UNAVAILABLE';

export interface SnapshotV2Success {
  readonly ok: true;
  readonly disposition: SnapshotDisposition;
  readonly revision: number;
  readonly noOp: boolean;
  readonly storeEffect: SnapshotStoreEffect;
  readonly holdingsPersisted: number;
  readonly totalMarketValue: number;
  readonly contributions: number;
  /**
   * Contract 2.0.0 `SaveReceipt.durability`. Both success paths acknowledge
   * state that is committed to the designated durable local store (COMMIT, or
   * the settled ledger read behind ALREADY_IMPORTED_NO_OP), so `DURABLE` /
   * `true` is the only supportable claim; `SESSION_ONLY` is never emitted by
   * this service. Asserted only in isolated synthetic fixtures; the product
   * dispatcher never emits a v2 write frame.
   */
  readonly durability: 'DURABLE';
  readonly durable: true;
  readonly message: string;
}

export interface SnapshotV2Refusal {
  readonly ok: false;
  readonly code: SnapshotV2RefusalCode;
  readonly message: string;
  readonly storeEffect: 'NONE';
  readonly refusedHoldings?: readonly BrokerImportRefusedHolding[];
  readonly revision?: number;
}

export interface SnapshotV2OutcomeUnknown {
  readonly ok: 'unknown';
  readonly code: 'OUTCOME_UNKNOWN';
  readonly message: string;
  readonly storeEffect: 'OUTCOME_UNKNOWN';
  readonly portfolioId: string;
  readonly contentDigest: string;
}

export type SnapshotV2Outcome = SnapshotV2Success | SnapshotV2Refusal | SnapshotV2OutcomeUnknown;

/** Narrow writer surface used by the v2 service and its fixtures. */
export interface HoldingsSnapshotWriter {
  saveSnapshotV2(owner: OwnerRef, request: {
    readonly portfolioId: string;
    readonly expectedRevision: number;
    readonly holdings: HoldingInput[];
    readonly contentDigest: string;
    readonly provenanceDigest: string;
    readonly broker: string;
    readonly sourceEvidence: SnapshotSourceEvidence;
  }): SnapshotReceipt;
  contributionsValidated(owner: OwnerRef, portfolioId: string): PortfolioContribution[];
  revisions(owner: OwnerRef, portfolioId: string): RevisionEntry[];
  /** Authorized read probe for the current revision (stale detection input). */
  currentRevision(owner: OwnerRef, portfolioId: string): number;
  /** Zero-write quiescence probe: throws when the store cannot prove settlement. */
  proveSettledForReconciliation(): void;
  /**
   * Internal reconciliation-only read of the stored revision evidence
   * (including the stored `content_digest`). Never part of the §6 projection
   * or the wire; used exclusively by `reconcileSnapshotV2ByRead`.
   */
  revisionReconciliationEvidence(owner: OwnerRef, portfolioId: string, revision: number): RevisionReconciliationEvidence | undefined;
  /**
   * Internal reconciliation-only read of the stored holdings snapshot for
   * one revision (canonical `holding_key` order). Never on the wire;
   * returns [] when the revision has no stored holdings.
   */
  holdingsForRevision(owner: OwnerRef, portfolioId: string, revision: number): HoldingInput[];
}

const SNAPSHOT_ROW_KEYS: readonly string[] = [
  'symbol',
  'isin',
  'exchange',
  'quantity',
  'averageBuyPrice',
  'currentPrice',
  'marketValue',
  'weightPercentage',
  'active',
  'sourceBroker',
];

function rowLineageDigestOf(holding: SnapshotObservedHolding): string {
  // IPD-computed per-row lineage over source observations and nothing else:
  // identical inputs yield identical lineage, and no caller value can assert it.
  const canonical = [
    `${holding.symbol}|${holding.isin ?? ''}|${holding.exchange ?? ''}`,
    `${holding.quantity}|${holding.averageBuyPrice}|${holding.currentPrice}`,
    `${holding.marketValue}|${holding.weightPercentage}|${holding.active}|${holding.sourceBroker}`,
  ].join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function validateSnapshotV2Shape(request: SnapshotSaveV2Request): string | undefined {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return 'The snapshot request is missing.';
  for (const key of Object.keys(request)) {
    if (!['portfolioId', 'expectedRevision', 'holdings', 'contentDigest', 'broker', 'sourceEvidence'].includes(key)) {
      return `The snapshot request carries an unexpected key: ${key}.`;
    }
  }
  const identityKeys = findCallerSuppliedIdentityKeys(request);
  if (identityKeys.length) return `Caller-supplied identity or authority keys are refused: ${identityKeys.join(', ')}.`;
  if (typeof request.portfolioId !== 'string' || !request.portfolioId.trim()) return 'A portfolio id is required.';
  if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 1) {
    return 'A safe integer expectedRevision >= 1 is required.';
  }
  if (!Array.isArray(request.holdings) || request.holdings.length === 0) return 'The snapshot carries no holdings.';
  for (const holding of request.holdings) {
    if (!holding || typeof holding !== 'object' || Array.isArray(holding)) return 'A holding row is malformed.';
    for (const key of Object.keys(holding)) {
      if (!SNAPSHOT_ROW_KEYS.includes(key)) return `A holding row carries an unexpected key: ${key}.`;
    }
  }
  if (typeof request.contentDigest !== 'string' || !/^[a-f0-9]{64}$/.test(request.contentDigest)) {
    return 'contentDigest must be a lowercase 64-hex digest.';
  }
  if (typeof request.broker !== 'string' || !request.broker.trim()) return 'A non-blank broker is required.';
  const evidence = request.sourceEvidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return 'sourceEvidence is required.';
  for (const key of Object.keys(evidence)) {
    if (!['fileName', 'sourceBroker', 'importedAt', 'evidenceRecordDigest'].includes(key)) {
      return `sourceEvidence carries an unexpected key: ${key}.`;
    }
  }
  if (typeof evidence.fileName !== 'string' || !evidence.fileName.trim()) return 'sourceEvidence.fileName is required.';
  if (typeof evidence.sourceBroker !== 'string' || !evidence.sourceBroker.trim()) return 'sourceEvidence.sourceBroker is required.';
  if (typeof evidence.evidenceRecordDigest !== 'string' || !/^[a-f0-9]{64}$/.test(evidence.evidenceRecordDigest)) {
    return 'sourceEvidence.evidenceRecordDigest must be a lowercase 64-hex digest.';
  }
  // Cross-field broker/evidence consistency is a domain check and runs only
  // after the stale-revision check (D03 ordering); see persistHoldingsSnapshotV2.
  return undefined;
}

function snapshotRefusal(
  code: SnapshotV2RefusalCode,
  message: string,
  refusedHoldings?: readonly BrokerImportRefusedHolding[],
): SnapshotV2Refusal {
  return { ok: false, code, message, storeEffect: 'NONE', ...(refusedHoldings ? { refusedHoldings } : {}) };
}

/**
 * v2 `portfolio.save`: complete-snapshot MERGE. Outcome vocabulary is exact —
 * success (post-COMMIT receipt), typed authorized refusal (zero domain
 * delta), or OUTCOME_UNKNOWN (lost acknowledgement; reconcile by exact
 * authorized readback, never by automatic resend).
 */
export function persistHoldingsSnapshotV2(
  writer: HoldingsSnapshotWriter,
  owner: OwnerRef,
  request: SnapshotSaveV2Request,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
): SnapshotV2Outcome {
  const invalidShape = validateSnapshotV2Shape(request);
  if (invalidShape) return snapshotRefusal('INVALID_REQUEST', invalidShape);

  // D03 — STALE REVISION FIRST: detection happens BEFORE domain, provenance
  // and identity rejection. This is an authorized read-only probe with zero
  // domain effect; the store re-checks under the serialized transaction at
  // commit time, so a concurrent commit can never smuggle a stale write past
  // this point.
  let currentRevision: number;
  try {
    currentRevision = writer.currentRevision(owner, request.portfolioId);
  } catch (error) {
    if (error instanceof ResourceUnavailableError) {
      return snapshotRefusal('RESOURCE_UNAVAILABLE', 'The requested resource is not available.');
    }
    return snapshotRefusal('UNAVAILABLE', 'The request could not be completed.');
  }
  if (currentRevision !== request.expectedRevision) {
    return snapshotRefusal(
      'REVISION_CONFLICT',
      `expected revision ${request.expectedRevision} but the portfolio is at ${currentRevision}`,
    );
  }

  // Server-side lineage construction: per-row lineage is computed from the
  // source observations; the caller cannot assert it.
  const observedWithLineage: BrokerImportHolding[] = request.holdings.map((holding) => ({
    ...holding,
    lineageDigest: rowLineageDigestOf(holding),
  }));
  const brokerRequest: BrokerImportRequest = {
    portfolioId: request.portfolioId,
    expectedRevision: request.expectedRevision,
    holdings: observedWithLineage,
    contentDigest: request.contentDigest,
    fileName: request.sourceEvidence.fileName,
    sourceBroker: request.broker,
    importedAt: request.sourceEvidence.importedAt,
    mode: 'MERGE',
  };
  const invalid = validateRequest(brokerRequest);
  if (invalid) return snapshotRefusal('INVALID_REQUEST', invalid);

  const { resolved, gate } = resolveHoldings(brokerRequest, resolver);
  if (!gate.saveable || !resolved) {
    return snapshotRefusal(
      'REFUSED_UNRESOLVED_IDENTITY',
      gate.disabledReason ?? 'The snapshot has no single canonical identity per row.',
      gate.refusedHoldings,
    );
  }

  const holdings = mapBrokerImportHoldings(resolved);
  const provenanceDigest = computeBrokerImportProvenance(brokerRequest);
  try {
    const receipt = writer.saveSnapshotV2(owner, {
      portfolioId: request.portfolioId,
      expectedRevision: request.expectedRevision,
      holdings,
      contentDigest: request.contentDigest,
      provenanceDigest,
      broker: request.broker,
      sourceEvidence: request.sourceEvidence,
    });
    return {
      ok: true,
      disposition: receipt.disposition,
      revision: receipt.revision,
      noOp: receipt.noOp,
      storeEffect: receipt.storeEffect,
      holdingsPersisted: receipt.holdingsPersisted,
      totalMarketValue: receipt.totalMarketValue,
      contributions: receipt.contributions,
      durability: 'DURABLE',
      durable: true,
      message: receipt.noOp
        ? 'This import was already committed; state was preserved without duplication.'
        : 'The snapshot was committed as the next immutable revision.',
    };
  } catch (error) {
    if (error instanceof CommitOutcomeUnknownError) {
      return {
        ok: 'unknown',
        code: 'OUTCOME_UNKNOWN',
        message: 'The transaction acknowledgement was lost; reconcile by exact authorized readback. Do not retry automatically.',
        storeEffect: 'OUTCOME_UNKNOWN',
        portfolioId: request.portfolioId,
        contentDigest: request.contentDigest,
      };
    }
    if (error instanceof WriteNotAuthorizedError) {
      return snapshotRefusal('WRITE_NOT_AUTHORIZED', 'The write gate refused the write; no success response was produced.');
    }
    if (error instanceof RevisionConflictError) return snapshotRefusal('REVISION_CONFLICT', error.message);
    if (error instanceof ResourceUnavailableError) return snapshotRefusal('RESOURCE_UNAVAILABLE', 'The requested resource is not available.');
    if (error instanceof InvalidPortfolioRequestError) return snapshotRefusal('INVALID_REQUEST', error.message);
    // Lock timeout / busy / any other store failure: no retry, no session
    // fallback; generic unavailability only.
    return snapshotRefusal('UNAVAILABLE', 'The request could not be completed.');
  }
}

export type SnapshotV2Reconciliation = 'COMMITTED' | 'NOT_COMMITTED' | 'UNRESOLVED';

const RECON_HEX_64 = /^[a-f0-9]{64}$/;

function isUtcIsoInstantValue(value: unknown): value is string {
  return (
    typeof value === 'string'
    && !Number.isNaN(Date.parse(value))
    && new Date(value).toISOString() === value
  );
}

/**
 * The deterministic evidence an UNKNOWN-outcome reconciliation re-derives
 * from the intended v2 request — the exact operation whose acknowledgement
 * was lost. Built with the same code path as the commit itself (shape
 * validation, lineage construction, identity resolution, provenance and the
 * stored revision content digest); when the intended evidence cannot be
 * derived, no COMMITTED verdict is reachable.
 */
export interface DerivedV2IntendedEvidence {
  /** Resolved + mapped holdings exactly as the commit persisted them. */
  readonly holdings: HoldingInput[];
  /** sha256 provenance digest recomputed from the intended request. */
  readonly provenanceDigest: string;
  /** Stored `portfolio_revisions.content_digest` for the successor revision. */
  readonly contentDigest: string;
  /** Expected successor revision (`request.expectedRevision + 1`). */
  readonly expectedSuccessorRevision: number;
}

export function deriveV2IntendedEvidence(
  request: SnapshotSaveV2Request,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
): DerivedV2IntendedEvidence | undefined {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return undefined;
  const shape = validateSnapshotV2Shape(request);
  if (shape) return undefined;
  const observedWithLineage: BrokerImportHolding[] = request.holdings.map((holding) => ({
    ...holding,
    lineageDigest: rowLineageDigestOf(holding),
  }));
  const brokerRequest: BrokerImportRequest = {
    portfolioId: request.portfolioId,
    expectedRevision: request.expectedRevision,
    holdings: observedWithLineage,
    contentDigest: request.contentDigest,
    fileName: request.sourceEvidence.fileName,
    sourceBroker: request.broker,
    importedAt: request.sourceEvidence.importedAt,
    mode: 'MERGE',
  };
  const invalid = validateRequest(brokerRequest);
  if (invalid) return undefined;
  const { resolved, gate } = resolveHoldings(brokerRequest, resolver);
  if (!gate.saveable || !resolved) return undefined;
  const holdings = mapBrokerImportHoldings(resolved);
  const provenanceDigest = computeBrokerImportProvenance(brokerRequest);
  return {
    holdings,
    provenanceDigest,
    contentDigest: computeRevisionContentDigest(holdings, provenanceDigest),
    expectedSuccessorRevision: request.expectedRevision + 1,
  };
}

interface EvidenceFingerprint {
  readonly contribution: PortfolioContribution | null;
  readonly revision: RevisionReconciliationEvidence | undefined;
  readonly holdings: readonly HoldingInput[];
}

function readEvidenceFingerprint(
  writer: Pick<HoldingsSnapshotWriter, 'contributionsValidated' | 'revisionReconciliationEvidence' | 'holdingsForRevision'>,
  owner: OwnerRef,
  portfolioId: string,
  contentDigest: string,
  expectedSuccessorRevision: number,
): EvidenceFingerprint {
  const contributions = writer.contributionsValidated(owner, portfolioId);
  const contribution = contributions.find((row) => row.contributionId === contentDigest) ?? null;
  const revision = writer.revisionReconciliationEvidence(owner, portfolioId, expectedSuccessorRevision);
  const holdings = writer.holdingsForRevision(owner, portfolioId, expectedSuccessorRevision);
  return { contribution, revision, holdings };
}

function holdingInputsEqual(a: HoldingInput, b: HoldingInput): boolean {
  return a.symbol === b.symbol
    && a.companyId === b.companyId
    && a.quantity === b.quantity
    && a.averageBuyPrice === b.averageBuyPrice
    && a.currentPrice === b.currentPrice
    && a.marketValue === b.marketValue
    && a.weightPercentage === b.weightPercentage
    && Boolean(a.active) === Boolean(b.active)
    && a.sourceBroker === b.sourceBroker
    && a.lineageDigest === b.lineageDigest
    && a.identityStatus === b.identityStatus
    && a.resolutionDisposition === b.resolutionDisposition;
}

function holdingsSnapshotsEqual(a: readonly HoldingInput[], b: readonly HoldingInput[]): boolean {
  if (a.length !== b.length) return false;
  const sortBySymbol = (rows: readonly HoldingInput[]) => [...rows].sort((x, y) => (x.symbol < y.symbol ? -1 : x.symbol > y.symbol ? 1 : 0));
  const aa = sortBySymbol(a);
  const bb = sortBySymbol(b);
  for (let i = 0; i < aa.length; i += 1) {
    if (!holdingInputsEqual(aa[i], bb[i])) return false;
  }
  return true;
}

/**
 * Verdict from a single evidence fingerprint, bound to the intended import:
 * absence of every leg; exact cross-bound correspondence on all legs; else
 * "other" (never guessed). `absent` is only reachable when the contribution,
 * the successor revision and the stored snapshot are all missing — always
 * after the settlement probe has passed.
 */
function verdictOfFingerprint(
  fp: EvidenceFingerprint,
  request: SnapshotSaveV2Request,
  intended: DerivedV2IntendedEvidence,
): 'absent' | 'match' | 'other' {
  if (!fp.contribution && fp.revision === undefined && fp.holdings.length === 0) return 'absent';
  const { contribution, revision, holdings } = fp;
  if (!contribution || !revision) return 'other';
  // Contribution ↔ intended import request evidence.
  if (contribution.contributionId !== request.contentDigest) return 'other';
  if (contribution.contentDigest !== request.contentDigest) return 'other';
  if (typeof contribution.lineageDigest !== 'string' || !RECON_HEX_64.test(contribution.lineageDigest)) return 'other';
  if (contribution.lineageDigest !== intended.provenanceDigest) return 'other';
  if (contribution.fileName !== request.sourceEvidence.fileName) return 'other';
  if (contribution.sourceBroker !== request.sourceEvidence.sourceBroker) return 'other';
  if (contribution.importedAt !== request.sourceEvidence.importedAt) return 'other';
  if (!isUtcIsoInstantValue(contribution.importedAt)) return 'other';
  if (!Number.isFinite(contribution.amount) || contribution.amount < 0) return 'other';
  // Contribution ↔ successor revision cross-binding (the revision must be the
  // expected MERGE successor for exactly this content).
  if (revision.revision !== intended.expectedSuccessorRevision) return 'other';
  if (revision.operation !== 'MERGE') return 'other';
  if (typeof revision.committedAt !== 'string' || !isUtcIsoInstantValue(revision.committedAt)) return 'other';
  if (!Number.isSafeInteger(revision.holdingsCount) || revision.holdingsCount < 1) return 'other';
  if (revision.holdingsCount !== intended.holdings.length) return 'other';
  if (!Number.isFinite(revision.totalMarketValue) || revision.totalMarketValue < 0) return 'other';
  if (typeof revision.provenanceDigest !== 'string' || !RECON_HEX_64.test(revision.provenanceDigest)) return 'other';
  if (revision.provenanceDigest !== contribution.lineageDigest) return 'other';
  if (revision.provenanceDigest !== intended.provenanceDigest) return 'other';
  if (typeof revision.contentDigest !== 'string' || !RECON_HEX_64.test(revision.contentDigest)) return 'other';
  if (revision.contentDigest !== intended.contentDigest) return 'other';
  if (contribution.amount !== revision.totalMarketValue) return 'other';
  // Stored snapshot ↔ intended snapshot: exact row equality.
  if (!holdingsSnapshotsEqual(holdings, intended.holdings)) return 'other';
  const intendedTotal = intended.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  if (revision.totalMarketValue !== intendedTotal) return 'other';
  const intendedWeight = intended.holdings.reduce((sum, holding) => sum + holding.weightPercentage, 0);
  if (!Number.isFinite(intendedWeight)) return 'other';
  return 'match';
}

function fingerprintOf(fp: EvidenceFingerprint): string {
  const c = fp.contribution;
  const r = fp.revision;
  return JSON.stringify({
    contribution: c
      ? {
          contributionId: c.contributionId,
          amount: c.amount,
          contributedAt: c.contributedAt,
          createdAt: c.createdAt,
          fileName: c.fileName,
          sourceBroker: c.sourceBroker,
          contentDigest: c.contentDigest ?? null,
          lineageDigest: c.lineageDigest ?? null,
          importedAt: c.importedAt ?? null,
          semantics: c.semantics ?? null,
        }
      : null,
    revision: r
      ? {
          revision: r.revision,
          operation: r.operation,
          committedAt: r.committedAt,
          totalMarketValue: r.totalMarketValue,
          holdingsCount: r.holdingsCount,
          provenanceDigest: r.provenanceDigest,
          contentDigest: r.contentDigest,
        }
      : null,
    holdings: fp.holdings.map((h) => [
      h.symbol, h.companyId, h.quantity, h.averageBuyPrice, h.currentPrice,
      h.marketValue, h.weightPercentage, h.active ? 1 : 0,
      h.sourceBroker, h.lineageDigest, h.identityStatus ?? null, h.resolutionDisposition ?? null,
    ]),
  });
}

/**
 * Exact authorized readback for a v2 outcome left UNKNOWN — bound to the
 * intended snapshot's operation evidence (R01 correction, 2026-11-06).
 *
 * (1) SETTLEMENT IS NECESSARY, NEVER SUFFICIENT: an empty zero-write `BEGIN
 * IMMEDIATE` + `ROLLBACK` certifies only that no writer holds the write lock
 * at that single instant; it does not prove terminal completion of the lost
 * operation, is not held through the reads and never upgrades an evidence
 * gap into a verdict. Any probe failure yields UNRESOLVED. (2) The intended
 * operation is evidence-bound: the intended request is re-derived through
 * the same validation, lineage, identity, provenance and stored-content-digest
 * path as the commit. If the intended evidence cannot be derived, no verdict
 * but UNRESOLVED is reachable. (3) COMMITTED requires, for the expected
 * successor revision ({request.expectedRevision + 1}): stored-revision
 * existence with `MERGE`, the intended provenance and the stored content
 * digest; the contribution row bound to the intended import (identity, stored
 * digest copy, complete intended-matching provenance incl. fileName,
 * sourceBroker and importedAt); cross-binding of contribution lineage to the
 * successor revision's provenance; and exact row-equality of the stored
 * holdings snapshot against the intended snapshot. (4) TWO consistent read
 * passes are required and compared as SERIALIZED EVIDENCE SNAPSHOTS, not
 * verdict strings: any change in contribution, revision or holdings evidence
 * between passes yields UNRESOLVED. Disagreement, weak/legacy/NULL evidence,
 * a failed settlement probe or any read failure yields UNRESOLVED. Absence on
 * both passes with settlement proven yields NOT_COMMITTED. A receipt alone is
 * never proof; no outcome here authorizes or implies a retry.
 */
export function reconcileSnapshotV2ByRead(
  writer: Pick<HoldingsSnapshotWriter, 'contributionsValidated' | 'revisionReconciliationEvidence' | 'holdingsForRevision' | 'proveSettledForReconciliation'>,
  owner: OwnerRef,
  request: SnapshotSaveV2Request,
  resolver: BrokerObservationResolver = createGovernedBrokerObservationResolver(),
): SnapshotV2Reconciliation {
  const intended = deriveV2IntendedEvidence(request, resolver);
  if (!intended) return 'UNRESOLVED';
  if (!Number.isSafeInteger(intended.expectedSuccessorRevision) || intended.expectedSuccessorRevision < 2) {
    return 'UNRESOLVED';
  }
  // (1) Writer settlement: zero writes; failure means UNRESOLVED, never a
  // verdict of convenience. Necessary precondition only — see the probe's
  // narrowed contract in DurablePortfolioStore.
  try {
    writer.proveSettledForReconciliation();
  } catch {
    return 'UNRESOLVED';
  }
  let first: EvidenceFingerprint;
  let second: EvidenceFingerprint;
  try {
    // (4) Evidence-snapshot consistency — not verdict equality.
    first = readEvidenceFingerprint(writer, owner, request.portfolioId, request.contentDigest, intended.expectedSuccessorRevision);
    second = readEvidenceFingerprint(writer, owner, request.portfolioId, request.contentDigest, intended.expectedSuccessorRevision);
  } catch {
    return 'UNRESOLVED';
  }
  if (fingerprintOf(first) !== fingerprintOf(second)) return 'UNRESOLVED';
  const verdict = verdictOfFingerprint(first, request, intended);
  if (verdict === 'absent') return 'NOT_COMMITTED';
  if (verdict === 'match') return 'COMMITTED';
  return 'UNRESOLVED';
}
