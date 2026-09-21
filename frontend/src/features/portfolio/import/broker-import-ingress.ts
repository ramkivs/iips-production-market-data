/**
 * Institutional Investment Platform System (IIPS)
 * Broker Holdings Ingress Orchestration & Hardening Layer (BI-05)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04 / BI-05
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-05-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { IdentityAmbiguityError } from '../../../../../src/identity/quarantine.js';
import { computeLineageHash, computeSha256 } from '../../../../../src/contracts/provenance.js';
import {
  BrokerIngressRequest,
  BrokerIngressResult,
  BrokerIngressRejection,
  IngressDisposition,
  IngressStage,
  FinappBrokerParseResult,
  BrokerMappingResult,
  UserHoldingInput,
} from './types.js';
import { BrokerFormatDetector } from './broker-format-detector.js';
import { mapBrokerOutputToUserHoldings } from './broker-holdings-mapper.js';

export class BrokerImportIngressOrchestrator {
  /**
   * Executes the full deterministic 5-stage offline broker ingress pipeline:
   * DETECT -> QUALIFICATION CHECK -> PARSE -> NORMALIZE -> VALIDATE -> READY_FOR_PORTFOLIO_SAVE
   *
   * Guarantees:
   * 1. Deterministic output: Same input bytes + same SecurityMaster produces identical digests.
   * 2. Zero mutation on failure: Stoppage at any stage returns clean rejection without partial state.
   * 3. Fail-closed identity: P04/P12 unmapped identity halts ingress unless explicitly bypassed.
   * 4. Zero fabricated records: Malformed rows are isolated into rejections; valid rows scale to 100.0%.
   */
  public static executeIngress(request: BrokerIngressRequest): BrokerIngressResult {
    const asOf = request.asOf || new Date().toISOString();
    const fileName = request.fileName || 'unknown-broker-statement.csv';
    const warnings: string[] = [];
    const errors: string[] = [];
    const rejections: BrokerIngressRejection[] = [];

    // Stage 0: Compute deterministic SHA-256 digest of raw input content
    const rawContent = request.content;
    const contentDigest = computeSha256(rawContent);

    // Edge Case 1: Empty file (0 bytes)
    const contentLength = typeof rawContent === 'string'
      ? rawContent.length
      : rawContent instanceof ArrayBuffer
        ? rawContent.byteLength
        : (rawContent as Uint8Array).byteLength || (rawContent as Uint8Array).length || 0;

    if (contentLength === 0) {
      const rej: BrokerIngressRejection = {
        reason: 'EMPTY_FILE',
        details: 'Uploaded file contains 0 bytes.',
        stage: 'DETECT',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'DETECT',
        detection: {
          brokerType: 'UNKNOWN',
          confidence: 0.0,
          format: 'UNKNOWN',
          detectedHeaders: [],
          requiresXlsx: false,
          details: rej.details,
        },
        qualificationStatus: 'UNKNOWN_FORMAT',
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: 'UNKNOWN',
        fileName,
        asOf,
      });
    }

    // Edge Case 2: Blank file (only whitespace / newlines)
    const textSample = typeof rawContent === 'string'
      ? rawContent.trim()
      : new TextDecoder('utf-8').decode(
          rawContent instanceof ArrayBuffer
            ? new Uint8Array(rawContent)
            : typeof Buffer !== 'undefined' && Buffer.isBuffer(rawContent)
              ? new Uint8Array(rawContent.buffer, rawContent.byteOffset, rawContent.byteLength)
              : (rawContent as Uint8Array)
        ).trim();

    if (textSample.length === 0) {
      const rej: BrokerIngressRejection = {
        reason: 'BLANK_FILE',
        details: 'Uploaded file contains only whitespace or blank newlines.',
        stage: 'DETECT',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'DETECT',
        detection: {
          brokerType: 'UNKNOWN',
          confidence: 0.0,
          format: 'UNKNOWN',
          detectedHeaders: [],
          requiresXlsx: false,
          details: rej.details,
        },
        qualificationStatus: 'UNKNOWN_FORMAT',
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: 'UNKNOWN',
        fileName,
        asOf,
      });
    }

    // Stage 1: DETECT
    const detection = BrokerFormatDetector.detectFormat(rawContent, fileName);

    if (detection.brokerType === 'UNKNOWN') {
      const rej: BrokerIngressRejection = {
        reason: 'UNKNOWN_FORMAT',
        details: detection.details || 'Unable to identify broker export header signature.',
        stage: 'DETECT',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'DETECT',
        detection,
        qualificationStatus: 'UNKNOWN_FORMAT',
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: 'UNKNOWN',
        fileName,
        asOf,
      });
    }

    // Stage 2: QUALIFICATION CHECK (XLSX Dependency Rule)
    if (detection.requiresXlsx || detection.format === 'XLSX') {
      const rej: BrokerIngressRejection = {
        reason: 'UNSUPPORTED_XLSX',
        details: `Binary XLSX format for ${detection.brokerType} is QUALIFICATION-BLOCKED / DEFERRED TO BI-06 under zero-dependency governance.`,
        stage: 'QUALIFICATION_CHECK',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'BLOCKED',
        stageReached: 'QUALIFICATION_CHECK',
        detection,
        qualificationStatus: 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06',
        warnings: [...warnings, 'XLSX parsing requires xlsx package qualification in BI-06.'],
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    // Stage 3: PARSE
    const adapter = BrokerFormatDetector.getAdapterForBroker(detection.brokerType);
    if (!adapter) {
      const rej: BrokerIngressRejection = {
        reason: 'UNKNOWN_FORMAT',
        details: `No offline adapter available for detected broker '${detection.brokerType}'.`,
        stage: 'PARSE',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'PARSE',
        detection,
        qualificationStatus: 'UNKNOWN_FORMAT',
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    let parseResult: FinappBrokerParseResult;
    try {
      const syncResult = adapter.parse(rawContent, { fileName, asOf });
      // In our implementation all adapters parse synchronously
      parseResult = syncResult as FinappBrokerParseResult;
    } catch (err: unknown) {
      const rej: BrokerIngressRejection = {
        reason: 'MALFORMED_CSV',
        details: `Broker parser threw unhandled exception: ${String(err)}`,
        stage: 'PARSE',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'PARSE',
        detection,
        qualificationStatus: 'QUALIFIED',
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    if (parseResult.warnings && parseResult.warnings.length > 0) {
      warnings.push(...parseResult.warnings);
    }

    if (!parseResult.success || parseResult.holdings.length === 0) {
      const isMalformed = parseResult.errors && parseResult.errors.length > 0;
      const rejReason = isMalformed ? 'MALFORMED_CSV' : 'PORTFOLIO_EMPTY';
      const rejDetails = isMalformed
        ? parseResult.errors!.join('; ')
        : 'Broker statement contained zero holding data rows (header only or empty data).';

      const rej: BrokerIngressRejection = {
        reason: rejReason,
        details: rejDetails,
        stage: 'PARSE',
      };
      rejections.push(rej);
      errors.push(rejDetails);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'PARSE',
        detection,
        qualificationStatus: 'QUALIFIED',
        parseResult,
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    // Stage 4: NORMALIZE & IDENTITY RESOLUTION
    let mappingResult: BrokerMappingResult;
    try {
      mappingResult = mapBrokerOutputToUserHoldings(parseResult, {
        asOf,
        securityMaster: request.securityMaster,
        failOnUnmappedIdentity: request.failOnUnmappedIdentity ?? true,
        minHoldingValueThreshold: request.minHoldingValueThreshold ?? 0,
        targetWeightPrecision: request.targetWeightPrecision ?? 4,
      });
    } catch (err: unknown) {
      let rejReason: 'UNMAPPED_IDENTITY' | 'IDENTITY_AMBIGUITY' | 'SCHEMA_MISMATCH' = 'UNMAPPED_IDENTITY';
      let rejDetails = String(err);

      if (err instanceof IdentityAmbiguityError) {
        rejReason = err.quarantineRecord.reason === 'AMBIGUOUS_COLLISION' ? 'IDENTITY_AMBIGUITY' : 'UNMAPPED_IDENTITY';
        rejDetails = `P04 Identity Ambiguity Quarantine: ${err.message}`;
      }

      const rej: BrokerIngressRejection = {
        reason: rejReason,
        details: rejDetails,
        stage: 'NORMALIZE',
      };
      rejections.push(rej);
      errors.push(rejDetails);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'NORMALIZE',
        detection,
        qualificationStatus: 'QUALIFIED',
        parseResult,
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    if (mappingResult.warnings && mappingResult.warnings.length > 0) {
      warnings.push(...mappingResult.warnings);
    }

    // Inspect individual excluded holdings and register in rejections collection
    if (mappingResult.excludedHoldingsCount > 0) {
      for (let i = 0; i < parseResult.holdings.length; i++) {
        const rawH = parseResult.holdings[i];
        const sym = (rawH.symbol || '').trim();
        const isin = (rawH.isin || '').trim();

        if (!sym && !isin) {
          rejections.push({
            recordIndex: i + 1,
            reason: 'MISSING_SYMBOL_AND_ISIN',
            details: `Row ${i + 1}: Missing both symbol and ISIN.`,
            stage: 'NORMALIZE',
          });
        } else if (Number(rawH.quantity) <= 0 || isNaN(Number(rawH.quantity))) {
          rejections.push({
            recordIndex: i + 1,
            rawIdentifier: sym || isin,
            reason: 'NON_POSITIVE_QTY',
            details: `Row ${i + 1} (${sym || isin}): Non-positive quantity (${rawH.quantity}).`,
            stage: 'NORMALIZE',
          });
        } else if (
          (rawH.currentPrice !== undefined && Number(rawH.currentPrice) <= 0) ||
          (rawH.averagePrice !== undefined && Number(rawH.averagePrice) <= 0 && (!rawH.currentPrice || Number(rawH.currentPrice) <= 0))
        ) {
          rejections.push({
            recordIndex: i + 1,
            rawIdentifier: sym || isin,
            reason: 'NON_POSITIVE_PRICE',
            details: `Row ${i + 1} (${sym || isin}): Non-positive price (LTP: ${rawH.currentPrice}, Avg: ${rawH.averagePrice}).`,
            stage: 'NORMALIZE',
          });
        }
      }
    }

    // Stage 5: VALIDATE Final Portfolio Integrity
    if (mappingResult.validHoldingsCount === 0 || mappingResult.userHoldings.length === 0) {
      const rej: BrokerIngressRejection = {
        reason: 'PORTFOLIO_EMPTY',
        details: 'All parsed records were excluded or filtered out during normalization. Zero valid holdings remain.',
        stage: 'VALIDATE',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'VALIDATE',
        detection,
        qualificationStatus: 'QUALIFIED',
        parseResult,
        mappingResult,
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    // Check exact 100.0% weight sum
    const weightSum = mappingResult.weightSumPercentage;
    const precision = request.targetWeightPrecision ?? 4;
    const scale = Math.pow(10, precision);
    const weightDiff = Math.abs(weightSum - 100.0);

    if (weightDiff > (1 / scale)) {
      const rej: BrokerIngressRejection = {
        reason: 'SCHEMA_MISMATCH',
        details: `Weight normalization invariant violated: sum (${weightSum}%) does not equal 100.0%.`,
        stage: 'VALIDATE',
      };
      rejections.push(rej);
      errors.push(rej.details);

      return BrokerImportIngressOrchestrator.createTerminalResult({
        success: false,
        disposition: 'REJECTED',
        stageReached: 'VALIDATE',
        detection,
        qualificationStatus: 'QUALIFIED',
        parseResult,
        mappingResult,
        warnings,
        errors,
        rejections,
        contentDigest,
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
      });
    }

    // Verify all UserHoldingInput records conform strictly to invariant schema
    for (const holding of mappingResult.userHoldings) {
      if (!holding.symbol || !holding.companyId || holding.quantity <= 0 || holding.marketValue <= 0 || !holding.lineageDigest) {
        const rej: BrokerIngressRejection = {
          reason: 'SCHEMA_MISMATCH',
          rawIdentifier: holding.symbol,
          details: `Holding '${holding.symbol}' failed schema validation checks (companyId: ${holding.companyId}, qty: ${holding.quantity}, mv: ${holding.marketValue}).`,
          stage: 'VALIDATE',
        };
        rejections.push(rej);
        errors.push(rej.details);

        return BrokerImportIngressOrchestrator.createTerminalResult({
          success: false,
          disposition: 'REJECTED',
          stageReached: 'VALIDATE',
          detection,
          qualificationStatus: 'QUALIFIED',
          parseResult,
          mappingResult,
          warnings,
          errors,
          rejections,
          contentDigest,
          sourceBroker: detection.brokerType,
          fileName,
          asOf,
        });
      }
    }

    // SUCCESS: Ingress completed and verified ready for portfolio save
    return {
      success: true,
      disposition: 'READY_FOR_PORTFOLIO_SAVE',
      stageReached: 'COMPLETE',
      detection,
      qualificationStatus: 'QUALIFIED',
      parseResult,
      mappingResult,
      userHoldings: mappingResult.userHoldings,
      totalMarketValue: mappingResult.totalMarketValue,
      totalHoldingsCount: mappingResult.totalHoldingsCount,
      validHoldingsCount: mappingResult.validHoldingsCount,
      rejectedCount: mappingResult.excludedHoldingsCount,
      aggregatedCount: mappingResult.aggregatedHoldingsCount,
      weightSumPercentage: mappingResult.weightSumPercentage,
      warnings,
      errors: [],
      rejections,
      provenance: {
        sourceBroker: detection.brokerType,
        fileName,
        asOf,
        contentDigest,
        lineageDigest: mappingResult.provenance.lineageHash,
        dataVersion: 'v1.0.0-bi05',
      },
    };
  }

  /**
   * Internal helper to build terminal rejection or blocked results.
   */
  private static createTerminalResult(params: {
    success: boolean;
    disposition: IngressDisposition;
    stageReached: IngressStage;
    detection: BrokerIngressResult['detection'];
    qualificationStatus: BrokerIngressResult['qualificationStatus'];
    parseResult?: FinappBrokerParseResult;
    mappingResult?: BrokerMappingResult;
    warnings: string[];
    errors: string[];
    rejections: BrokerIngressRejection[];
    contentDigest: string;
    sourceBroker: BrokerIngressResult['provenance']['sourceBroker'];
    fileName: string;
    asOf: string;
  }): BrokerIngressResult {
    const emptyLineage = computeLineageHash(
      { disposition: params.disposition, stage: params.stageReached, errors: params.errors },
      { sourceClassification: 'REAL', asOf: params.asOf, dataVersion: 'v1.0.0-bi05' }
    );

    return {
      success: params.success,
      disposition: params.disposition,
      stageReached: params.stageReached,
      detection: params.detection,
      qualificationStatus: params.qualificationStatus,
      parseResult: params.parseResult,
      mappingResult: params.mappingResult,
      userHoldings: [],
      totalMarketValue: 0,
      totalHoldingsCount: params.parseResult?.totalHoldings ?? 0,
      validHoldingsCount: 0,
      rejectedCount: params.rejections.length,
      aggregatedCount: 0,
      weightSumPercentage: 0.0,
      warnings: params.warnings,
      errors: params.errors,
      rejections: params.rejections,
      provenance: {
        sourceBroker: params.sourceBroker,
        fileName: params.fileName,
        asOf: params.asOf,
        contentDigest: params.contentDigest,
        lineageDigest: emptyLineage,
        dataVersion: 'v1.0.0-bi05',
      },
    };
  }
}
