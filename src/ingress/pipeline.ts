/**
 * Institutional Investment Platform System (IIPS)
 * 4-Stage Ingestion & Canonicalization Pipeline (P05 / P06 / P07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { CanonicalEnvelope, createCanonicalEnvelope, validateEnvelopeStructure } from '../contracts/envelope.js';
import { DataDomain, OperatingMode, QualityState, SourceClassification, ValidationResult } from '../contracts/types.js';
import { computeLineageHash, DataProvenanceDTO } from '../contracts/provenance.js';
import { DeadLetterQueue, DeadLetterRecord } from './dead_letter.js';
import { validateMarketQuotePayload, MarketQuotePayload } from '../contracts/d01_quotes.js';
import { validateOHLCVCandle, OHLCVCandle } from '../contracts/d02_ohlcv.js';
import { validateFundamentalStatement, FundamentalStatementPayload } from '../contracts/d03_fundamentals.js';
import { validateCorporateAction, CorporateActionPayload } from '../contracts/d04_corporate_actions.js';
import { validateInstrumentMaster, InstrumentMasterPayload } from '../contracts/d05_security_master.js';
import { validateNewsEvent, NewsEventPayload } from '../contracts/d06_news.js';
import { validateAnalystEstimate, AnalystEstimatePayload } from '../contracts/d07_estimates.js';
import { validateMacroData, MacroDataPayload } from '../contracts/d08_macro.js';
import { validateAlternativeData, AlternativeDataPayload } from '../contracts/d09_altdata.js';
import { AnomalyDetector } from '../quality/anomaly_detector.js';
import { evaluateFreshness } from '../quality/freshness_evaluator.js';
import { rollupQuality } from '../quality/quality_rollup.js';
import { normalizeToUtcIso } from '../normalization/time_normalizer.js';

export interface IngestionInput {
  domain: DataDomain;
  mode: OperatingMode;
  companyId: string;
  rawPayload: unknown;
  receivedAt?: string;
  asOf?: string;
  sourceClassification?: SourceClassification;
  traceId?: string;
  correlationId?: string;
  tenantId?: string;
}

export type IngestionResult<T> =
  | { success: true; envelope: CanonicalEnvelope<T> }
  | { success: false; quarantineRecord: DeadLetterRecord };

export class IngestionPipeline {
  private deadLetterQueue: DeadLetterQueue;
  private anomalyDetector: AnomalyDetector;

  constructor(deadLetterQueue?: DeadLetterQueue) {
    this.deadLetterQueue = deadLetterQueue || new DeadLetterQueue();
    this.anomalyDetector = new AnomalyDetector();
  }

  public getDeadLetterQueue(): DeadLetterQueue {
    return this.deadLetterQueue;
  }

  /**
   * Processes a raw payload through all 4 ingestion stages.
   * Fails closed: any error diverts to dead-letter quarantine.
   */
  public process<T>(input: IngestionInput): IngestionResult<T> {
    const receivedAt = input.receivedAt ? normalizeToUtcIso(input.receivedAt) : new Date().toISOString();
    const asOf = input.asOf ? normalizeToUtcIso(input.asOf) : receivedAt;
    const sourceClassification = input.sourceClassification || 'CANONICAL_MARKET_DATA';

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 1: INGRESS
    // ──────────────────────────────────────────────────────────────────────────
    if (!input.rawPayload || typeof input.rawPayload !== 'object') {
      const qRecord: DeadLetterRecord = {
        quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domain: input.domain,
        failureStage: 'STAGE_1_INGRESS',
        rawPayload: input.rawPayload,
        anomalyCodes: ['STRUCTURAL_MALFORMATION'],
        errors: ['Raw payload must be a non-null object'],
        receivedAt,
        sourceClassification,
      };
      this.deadLetterQueue.push(qRecord);
      return { success: false, quarantineRecord: qRecord };
    }

    const payloadObj = input.rawPayload as Record<string, unknown>;

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 2: STRUCTURAL VALIDATION
    // ──────────────────────────────────────────────────────────────────────────
    const validationResult = this.validateDomainPayload(input.domain, payloadObj);
    if (!validationResult.isValid) {
      const qRecord: DeadLetterRecord = {
        quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domain: input.domain,
        failureStage: 'STAGE_2_STRUCTURAL',
        rawPayload: input.rawPayload,
        anomalyCodes: validationResult.anomalyCodes,
        errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        receivedAt,
        sourceClassification,
      };
      this.deadLetterQueue.push(qRecord);
      return { success: false, quarantineRecord: qRecord };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 3: CANONICALIZATION
    // ──────────────────────────────────────────────────────────────────────────
    let canonicalPayload: T;
    try {
      canonicalPayload = this.canonicalizePayload<T>(input.domain, payloadObj);
    } catch (err: unknown) {
      const qRecord: DeadLetterRecord = {
        quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domain: input.domain,
        failureStage: 'STAGE_3_CANONICAL',
        rawPayload: input.rawPayload,
        anomalyCodes: ['STRUCTURAL_MALFORMATION'],
        errors: [(err as Error).message],
        receivedAt,
        sourceClassification,
      };
      this.deadLetterQueue.push(qRecord);
      return { success: false, quarantineRecord: qRecord };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 4: INVARIANT VALIDATION & QUALITY ROLLUP
    // ──────────────────────────────────────────────────────────────────────────
    const anomalyReport = this.anomalyDetector.evaluatePayload(canonicalPayload as Record<string, unknown>, {
      expectedDomain: input.domain,
      currentTimestamp: asOf,
    });

    if (anomalyReport.detected) {
      // Check if fatal anomaly (e.g. UNAUTHORIZED_SOURCE_LEAK or NAMESPACE_COLLISION_OR_VIOLATION)
      const isFatal = anomalyReport.categories.some((c) =>
        ['UNAUTHORIZED_SOURCE_LEAK', 'NAMESPACE_COLLISION_OR_VIOLATION', 'IDENTITY_AMBIGUITY'].includes(c)
      );
      if (isFatal) {
        const qRecord: DeadLetterRecord = {
          quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          domain: input.domain,
          failureStage: 'STAGE_4_INVARIANT',
          rawPayload: input.rawPayload,
          anomalyCodes: anomalyReport.categories,
          errors: anomalyReport.details,
          receivedAt,
          sourceClassification,
        };
        this.deadLetterQueue.push(qRecord);
        return { success: false, quarantineRecord: qRecord };
      }
    }

    // Evaluate freshness & quality floor
    const freshness = evaluateFreshness(asOf, input.domain, receivedAt);
    if (freshness.suppressExecution) {
      const qRecord: DeadLetterRecord = {
        quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domain: input.domain,
        failureStage: 'STAGE_4_INVARIANT',
        rawPayload: input.rawPayload,
        anomalyCodes: ['STALE_DATA_TIMESTAMP'],
        errors: [`Payload freshness ${Math.round(freshness.ageSeconds)}s exceeds 2x threshold; execution suppressed`],
        receivedAt,
        sourceClassification,
      };
      this.deadLetterQueue.push(qRecord);
      return { success: false, quarantineRecord: qRecord };
    }

    const effectiveQuality: QualityState = rollupQuality([
      validationResult.quality,
      freshness.quality,
    ]);

    const evaluatedAt = new Date().toISOString();
    const dataVersion = `v1-${Date.now()}`;
    const lineageHash = computeLineageHash(canonicalPayload, {
      sourceClassification,
      asOf,
      dataVersion,
    });

    const provenance: DataProvenanceDTO = {
      sourceClassification,
      vendorTier: 'OFFLINE_BOOTSTRAP',
      asOf,
      receivedAt,
      evaluatedAt,
      dataVersion,
      lineageHash,
      qualityState: effectiveQuality,
      traceId: input.traceId,
      correlationId: input.correlationId,
      tenantId: input.tenantId,
    };

    const envelope: CanonicalEnvelope<T> = createCanonicalEnvelope({
      envelopeId: `env-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      domain: input.domain,
      mode: input.mode,
      companyId: input.companyId,
      payload: canonicalPayload,
      provenance,
      timestamp: receivedAt,
    });

    const envValidation = validateEnvelopeStructure(envelope);
    if (!envValidation.isValid) {
      const qRecord: DeadLetterRecord = {
        quarantineId: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        domain: input.domain,
        failureStage: 'STAGE_4_INVARIANT',
        rawPayload: input.rawPayload,
        anomalyCodes: envValidation.anomalyCodes,
        errors: envValidation.errors.map((e) => `${e.field}: ${e.message}`),
        receivedAt,
        sourceClassification,
      };
      this.deadLetterQueue.push(qRecord);
      return { success: false, quarantineRecord: qRecord };
    }

    return { success: true, envelope };
  }

  private validateDomainPayload(domain: DataDomain, payload: Record<string, unknown>): ValidationResult {
    switch (domain) {
      case 'D01_QUOTES':
        return validateMarketQuotePayload(payload as unknown as MarketQuotePayload);
      case 'D02_OHLCV':
        return validateOHLCVCandle(payload as unknown as OHLCVCandle);
      case 'D03_FUNDAMENTALS':
        return validateFundamentalStatement(payload as unknown as FundamentalStatementPayload);
      case 'D04_CORPORATE_ACTIONS':
        return validateCorporateAction(payload as unknown as CorporateActionPayload);
      case 'D05_SECURITY_MASTER':
        return validateInstrumentMaster(payload as unknown as InstrumentMasterPayload);
      case 'D06_NEWS':
        return validateNewsEvent(payload as unknown as NewsEventPayload);
      case 'D07_ESTIMATES':
        return validateAnalystEstimate(payload as unknown as AnalystEstimatePayload);
      case 'D08_MACRO':
        return validateMacroData(payload as unknown as MacroDataPayload);
      case 'D09_ALTDATA':
        return validateAlternativeData(payload as unknown as AlternativeDataPayload);
      default:
        return {
          isValid: false,
          quality: 'UNAVAILABLE',
          errors: [{ field: 'domain', code: 'UNRECOGNIZED_ENUM_OR_CODE', message: `Unknown domain: ${domain}`, severity: 'CRITICAL' }],
          anomalyCodes: ['UNRECOGNIZED_ENUM_OR_CODE'],
        };
    }
  }

  private canonicalizePayload<T>(domain: DataDomain, payload: Record<string, unknown>): T {
    // Deep clone to prevent mutation
    const normalized = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

    // Perform domain-specific canonicalizations (e.g. timestamp standardizing)
    if (domain === 'D02_OHLCV') {
      if (typeof normalized.candleStart === 'string') {
        normalized.candleStart = normalizeToUtcIso(normalized.candleStart);
      }
      if (typeof normalized.candleEnd === 'string') {
        normalized.candleEnd = normalizeToUtcIso(normalized.candleEnd);
      }
    } else if (domain === 'D03_FUNDAMENTALS') {
      if (typeof normalized.periodStart === 'string') {
        normalized.periodStart = normalizeToUtcIso(normalized.periodStart);
      }
      if (typeof normalized.periodEnd === 'string') {
        normalized.periodEnd = normalizeToUtcIso(normalized.periodEnd);
      }
      if (typeof normalized.filingDate === 'string') {
        normalized.filingDate = normalizeToUtcIso(normalized.filingDate);
      }
    } else if (domain === 'D06_NEWS') {
      if (typeof normalized.publishedAt === 'string') {
        normalized.publishedAt = normalizeToUtcIso(normalized.publishedAt);
      }
    }

    return normalized as T;
  }
}
