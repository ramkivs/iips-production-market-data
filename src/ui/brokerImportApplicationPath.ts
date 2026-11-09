/**
 * Broker CSV upload → governed identity qualification → durable save: the
 * normal application path for the local single-user portfolio.
 *
 * AUTHORITY
 *   Program Authority standing decision, 2026-11-09. The local personal-use
 *   carve-out now covers broker-observed holdings, so the shipped application
 *   must be able to take a real broker CSV from the operator, parse and
 *   validate it, qualify every holding's identity through the existing
 *   governed master + registry, show an accurate preview and resolution
 *   summary, and only then submit the qualified holdings to the durable
 *   portfolio store through the authorized write path.
 *
 * WHAT THIS MODULE COMPOSES (nothing new is invented)
 *   1. `BrokerImportIngressOrchestrator.executeIngress` — the same BI-05
 *      offline pipeline the broker-import modal already calls: DETECT → PARSE →
 *      NORMALIZE → VALIDATE, with per-row P04 identity assessment.
 *   2. `createGovernedBrokerObservationResolver` (inside `persistBrokerImport`)
 *      — the durable leg re-resolves identity independently against the
 *      governed D05 authenticated universe. The UI's identity claim is never
 *      trusted or forwarded: `companyId`, `identityStatus` and
 *      `resolutionDisposition` are structurally dropped here, and the durable
 *      path refuses them as caller-supplied identity anyway.
 *   3. `BrokerImportConsumer` — the single composed consumer from
 *      `entrypoint.ts`, whose durable port evaluates Gate E W-1 with the
 *      explicit local single-user authorization context.
 *
 * FAIL-CLOSED BEHAVIOUR THAT IS PRESERVED
 *   - An unresolved or ambiguous identity anywhere in the file keeps the whole
 *     import unsaveable (Gate E W-6 / DP-2 2F). Nothing is invented, nothing is
 *     auto-approved, and the refused rows stay unresolved with their quarantine
 *     evidence intact.
 *   - A file that does not parse produces no request at all.
 *   - Nothing is written by `parseBrokerCsvUpload` or `brokerImportPreview`:
 *     both are pure projections of the parse result.
 */
import { BrokerImportIngressOrchestrator } from '../../frontend/src/features/portfolio/import/broker-import-ingress.js';
import type {
  BrokerIngressResult,
  UserHoldingInput,
} from '../../frontend/src/features/portfolio/import/types.js';
import type { BrokerIdentitySummary } from '../../frontend/src/features/portfolio/import/broker-identity-assessment.js';
import type { SecurityMaster } from '../identity/security_master.js';
import type {
  BrokerImportHolding,
  BrokerImportOutcome,
  BrokerImportRequest,
} from '../persistence/brokerImportPersistence.js';
import type { OwnerRef } from '../persistence/portfolio_store.js';
import type { BrokerImportConsumer } from '../ipc/brokerImportConsumer.js';

/** One operator upload: the raw file bytes and their declared name. */
export interface BrokerCsvUpload {
  /** Raw file content. Never re-encoded, re-typed or defaulted. */
  readonly content: string;
  /** The operator's file name; carried into provenance unchanged. */
  readonly fileName: string;
  /** Import instant. Defaults to now, and is recorded in provenance. */
  readonly asOf?: string;
}

/**
 * The preview an operator actually sees before anything is saved: the parse
 * disposition, the per-row identity resolution summary, and — only when the
 * whole file qualified — the exact holdings that would be committed.
 */
export interface BrokerImportPreview {
  /** True only when every row parsed, validated and resolved to one identity. */
  readonly saveable: boolean;
  /** The pipeline's terminal stage and disposition, verbatim. */
  readonly stageReached: BrokerIngressResult['stageReached'];
  readonly disposition: BrokerIngressResult['disposition'];
  readonly broker: string;
  readonly formatDetail: string;
  /** Raw parsed row count, qualified row count and rejected row count. */
  readonly rowsParsed: number;
  readonly rowsQualified: number;
  readonly rowsRejected: number;
  /** Per-identity-outcome counts from the governed assessment. */
  readonly identitySummary: BrokerIdentitySummary | undefined;
  /** Per-row refusals, with the governed reason; empty when saveable. */
  readonly refusals: readonly { readonly row: number; readonly symbol: string | null; readonly reason: string }[];
  /** The exact holdings that would be committed. Empty unless `saveable`. */
  readonly holdings: readonly UserHoldingInput[];
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  /** SHA-256 of the raw upload bytes — the evidence identity of the file. */
  readonly contentDigest: string;
  readonly lineageDigest: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Parses and qualifies one operator CSV upload. Pure: no database, no
 * transaction, no write, no network. Returns the ingress result so nothing is
 * lost between parsing and the preview.
 */
export function parseBrokerCsvUpload(
  upload: BrokerCsvUpload,
  securityMaster: SecurityMaster,
): BrokerIngressResult {
  return BrokerImportIngressOrchestrator.executeIngress({
    content: upload.content,
    fileName: upload.fileName,
    asOf: upload.asOf ?? new Date().toISOString(),
    securityMaster,
  });
}

/** Projects the parse result into the operator-visible preview. Pure. */
export function brokerImportPreview(result: BrokerIngressResult): BrokerImportPreview {
  // Every row that is not `RESOLVED` is surfaced with its governed reason and
  // the broker-supplied identifier — the row keeps its unresolved status; no
  // reason, identity or company id is inferred to fill the gap.
  const refusals = (result.identityAssessments ?? [])
    .filter((assessment) => assessment.status !== 'RESOLVED')
    .map((assessment) => ({
      row: assessment.rowIndex,
      symbol: assessment.suppliedIdentifier ?? null,
      reason: assessment.refusalCode ?? assessment.missingEvidence ?? 'UNRESOLVED_IDENTITY',
    }));
  const saveable = result.success && result.disposition === 'READY_FOR_PORTFOLIO_SAVE' && result.identitySummary?.saveable === true;
  return {
    saveable,
    stageReached: result.stageReached,
    disposition: result.disposition,
    broker: result.detection?.brokerType ?? 'UNKNOWN',
    formatDetail: result.detection?.details ?? '',
    rowsParsed: result.totalHoldingsCount,
    rowsQualified: saveable ? result.userHoldings.length : 0,
    rowsRejected: result.rejectedCount,
    identitySummary: result.identitySummary,
    refusals,
    holdings: saveable ? result.userHoldings : [],
    totalMarketValue: saveable ? result.totalMarketValue : 0,
    weightSumPercentage: saveable ? result.weightSumPercentage : 0,
    contentDigest: result.provenance.contentDigest,
    lineageDigest: result.provenance.lineageDigest,
    warnings: result.warnings,
    errors: result.errors,
  };
}

/** What the operator asked for when confirming the save. */
export interface BrokerImportCommitOptions {
  readonly portfolioId: string;
  readonly expectedRevision: number;
  readonly mode?: 'MERGE' | 'REPLACE';
}

/**
 * Builds the durable import request from a qualified parse result, or refuses.
 *
 * `companyId`, `identityStatus` and `resolutionDisposition` are deliberately
 * NOT carried across: the durable leg re-resolves identity from raw broker
 * identifiers through the governed master, and the durable path refuses
 * caller-supplied identity keys outright. The raw identifiers (`symbol`,
 * `isin`, `exchange`) are carried unchanged, because they are what the
 * governed resolver is supposed to see.
 */
export function brokerImportRequestFromIngress(
  result: BrokerIngressResult,
  options: BrokerImportCommitOptions,
): { readonly ok: true; readonly request: BrokerImportRequest } | { readonly ok: false; readonly reason: string } {
  const preview = brokerImportPreview(result);
  if (!preview.saveable) {
    return {
      ok: false,
      reason:
        preview.errors[0] ??
        (preview.identitySummary
          ? `The file is not saveable: ${preview.identitySummary.unresolved} row(s) did not resolve to one governed identity.`
          : 'The file is not saveable: it did not reach READY_FOR_PORTFOLIO_SAVE.'),
    };
  }
  const holdings: BrokerImportHolding[] = result.userHoldings.map((holding) => ({
    symbol: holding.symbol,
    ...(holding.isin ? { isin: holding.isin } : {}),
    ...(holding.exchange ? { exchange: holding.exchange } : {}),
    quantity: holding.quantity,
    averageBuyPrice: holding.averageBuyPrice,
    currentPrice: holding.currentPrice,
    marketValue: holding.marketValue,
    weightPercentage: holding.weightPercentage,
    active: holding.active,
    sourceBroker: String(holding.sourceBroker),
    lineageDigest: holding.lineageDigest,
  }));
  return {
    ok: true,
    request: {
      portfolioId: options.portfolioId,
      expectedRevision: options.expectedRevision,
      holdings,
      contentDigest: result.provenance.contentDigest,
      fileName: result.provenance.fileName,
      sourceBroker: String(result.provenance.sourceBroker),
      importedAt: result.provenance.asOf,
      mode: options.mode ?? 'MERGE',
    },
  };
}

/** The full application-path result: the preview AND the durable outcome. */
export interface BrokerImportApplicationResult {
  readonly preview: BrokerImportPreview;
  /** Absent when the file never qualified, so nothing was submitted. */
  readonly request?: BrokerImportRequest;
  /** Absent when nothing was submitted. */
  readonly outcome?: BrokerImportOutcome;
}

/**
 * The whole application path in one call: parse → qualify → preview → submit.
 *
 * The save is attempted ONLY for a fully qualified file. Every refusal path
 * (unparseable file, unresolved identity, unauthorized write, revision
 * conflict) returns without a committed revision, exactly as the durable
 * layer decides.
 */
export function executeBrokerCsvImport(
  consumer: BrokerImportConsumer,
  owner: OwnerRef,
  upload: BrokerCsvUpload,
  securityMaster: SecurityMaster,
  options: BrokerImportCommitOptions,
): BrokerImportApplicationResult {
  const parsed = parseBrokerCsvUpload(upload, securityMaster);
  const preview = brokerImportPreview(parsed);
  if (!preview.saveable) return { preview };
  const built = brokerImportRequestFromIngress(parsed, options);
  if (!built.ok) return { preview };
  return { preview, request: built.request, outcome: consumer(owner, built.request) };
}
