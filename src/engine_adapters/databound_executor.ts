/**
 * Institutional Investment Platform System (IIPS)
 * DataBoundExecutor & Governed Engine Execution Boundary (P11-01 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { SecurityMaster } from '../identity/security_master.js';
import { NamespaceGuard } from './namespace_guard.js';
import { SectorDefaultInjector } from './sector_defaults.js';
import { FrozenEngines } from './frozen_engines.js';
import { EngineExecutionRequest, EngineScoreOutput, VersionVector } from './types.js';
import { computeLineageHash, DataProvenanceDTO } from '../contracts/provenance.js';
import { QualityState } from '../contracts/types.js';

export class DataBoundExecutor {
  private securityMaster: SecurityMaster;

  constructor(securityMaster?: SecurityMaster) {
    this.securityMaster = securityMaster || new SecurityMaster();
  }

  /**
   * Executes a certified engine scoring model under strict governance boundaries.
   */
  public execute(request: EngineExecutionRequest): EngineScoreOutput {
    // 1. P04 Identity Verification: Validate companyId exists in authoritative SecurityMaster
    const entity = this.securityMaster.getEntity(request.companyId);
    if (!entity && request.companyId !== 'CSIP_PORTFOLIO') {
      // Validate by resolving
      this.securityMaster.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: request.companyId,
        asOf: request.asOf,
      });
    }

    // 2. C1-C6 Namespace Enforcement: Validate and sanitize market data inputs
    const sanitizedMarketData = NamespaceGuard.validateAndSanitizeInputs(request.rawMarketDataInputs);

    // 3. Extract and combine inputs for engine scoring
    const rawRatios: Record<string, number | null | undefined> = {
      pe: (sanitizedMarketData['D01_QUOTES.pe'] as number) ?? request.governedFinancialInputs?.pe,
      pb: (sanitizedMarketData['D01_QUOTES.pb'] as number) ?? request.governedFinancialInputs?.pb,
      roe: (sanitizedMarketData['D03_FUNDAMENTALS.roe'] as number) ?? request.governedFinancialInputs?.roe,
      roce: (sanitizedMarketData['D03_FUNDAMENTALS.roce'] as number) ?? request.governedFinancialInputs?.roce,
      operatingMargin: (sanitizedMarketData['D03_FUNDAMENTALS.operatingMargin'] as number) ?? request.governedFinancialInputs?.operatingMargin,
      beta: (sanitizedMarketData['D01_QUOTES.beta'] as number) ?? request.governedFinancialInputs?.beta,
      momentum: (sanitizedMarketData['D01_QUOTES.pctChange'] as number) ?? 0,
    };

    // 4. Governed Sector Default Fallback Injection
    const { resolvedInputs, injectedFields } = SectorDefaultInjector.injectDefaults(request.engineId, rawRatios);

    // 5. Frozen Engine Execution (Methodology 100% frozen)
    const scoringResult = FrozenEngines.executeSectorEngine(request.engineId, resolvedInputs);

    // 6. Execution Provenance & Version Vector
    const evaluatedAt = new Date().toISOString();
    const executionId = `exec-${request.engineId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const versionVector: VersionVector = {
      schemaVersion: '1.0.0',
      engineVersion: 'v1.0.0-certified-frozen',
      securityMasterVersion: '2026.09.19',
      dataVersionVector: {
        D01_QUOTES: 'v1.0',
        D03_FUNDAMENTALS: 'v1.0',
      },
    };

    const effectiveQuality: QualityState = injectedFields.length > 0 ? 'PARTIAL' : 'GOOD';
    const lineageHash = computeLineageHash(scoringResult, {
      sourceClassification: 'CERTIFIED_ENGINE',
      asOf: request.asOf,
      dataVersion: versionVector.engineVersion,
    });

    const provenance: DataProvenanceDTO = {
      sourceClassification: 'CERTIFIED_ENGINE',
      vendorTier: 'OFFLINE_BOOTSTRAP',
      asOf: request.asOf,
      receivedAt: evaluatedAt,
      evaluatedAt,
      dataVersion: versionVector.engineVersion,
      lineageHash,
      qualityState: effectiveQuality,
      correlationId: request.correlationId,
      tenantId: request.tenantId,
    };

    return {
      companyId: request.companyId,
      engineId: request.engineId,
      rawScore: scoringResult.rawScore,
      normalizedScore: scoringResult.normalizedScore,
      grade: scoringResult.grade,
      factorBreakdown: scoringResult.factors,
      qualityState: effectiveQuality,
      provenance,
      versionVector,
      executionId,
      evaluatedAt,
      isFallbackApplied: injectedFields.length > 0,
      fallbackFields: injectedFields,
    };
  }
}
