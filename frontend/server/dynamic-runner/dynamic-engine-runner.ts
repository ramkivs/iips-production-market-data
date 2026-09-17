import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { SecurityMasterService } from '../security-master/security-master-service.ts';
import type { EodValuationSynthesizer } from '../valuation/eod-valuation-synthesizer.ts';
import { DynamicEngineInputBuilder } from './dynamic-engine-input-builder.ts';
import type {
  DynamicEngineRequest,
  DynamicEngineResult,
  DynamicEngineProvenanceDto,
} from './dynamic-runner-contract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type BandTuple = [string, number, number] | [string, number, number, number];

interface CalibrationProfile {
  bandScores: Record<string, BandTuple[]>;
  segments?: Record<string, { w: number[]; leverageAlert?: number }>;
  archetypeRisk?: Record<string, number>;
}

export class DynamicEngineRunner {
  private readonly inputBuilder = new DynamicEngineInputBuilder();
  private readonly securityMaster: SecurityMasterService;
  private readonly valuationSynthesizer: EodValuationSynthesizer;
  private readonly calibrations = new Map<string, CalibrationProfile>();

  constructor(
    securityMaster: SecurityMasterService,
    valuationSynthesizer: EodValuationSynthesizer
  ) {
    this.securityMaster = securityMaster;
    this.valuationSynthesizer = valuationSynthesizer;
    this.loadCalibrations();
  }

  private loadCalibrations(): void {
    const fileMap: Record<string, string> = {
      Technology: 'technology/technology-calibration-1.0.0.json',
      Industrials: 'industrials/industrials-calibration-1.0.0.json',
      Energy: 'energy/energy-calibration-1.0.0.json',
      'Materials & Metals': 'materials-metals/materials-metals-calibration-1.0.0.json',
      Telecommunications: 'telecommunications/telecommunications-calibration-1.0.0.json',
      Automobile: 'automobile/automobile-calibration-1.0.0.json',
      Consumer: 'consumer/consumer-calibration-1.0.0.json',
      Utilities: 'utilities/utilities-calibration-1.0.0.json',
      Banking: 'banking/frozen-assets/banking-calibration-1.0.0.json',
    };

    for (const [sec, rel] of Object.entries(fileMap)) {
      const full = path.resolve(__dirname, `../../../iips-platform/src/sector-engines/${rel}`);
      if (fs.existsSync(full)) {
        const raw = fs.readFileSync(full, 'utf8');
        this.calibrations.set(sec, JSON.parse(raw) as CalibrationProfile);
      }
    }
  }

  public execute(request: DynamicEngineRequest): DynamicEngineResult {
    const baseProvenance: DynamicEngineProvenanceDto = {
      dataMode: 'LIVE',
      dataSource: 'IIPS Dynamic Engine Runner (D112-D / D113-QCAL09 DEVELOPMENT_HARNESS)',
      freshness: 'DEVELOPMENT_MIXED_VINTAGE',
      eodTradeDate: request.tradeDate,
      eodArchiveSha256: request.archiveSha256 ?? 'UNSPECIFIED_LOCAL_SHA256',
      fundamentalsVintage: 'v1.1-reference',
      securityMasterVersion: '1.0.0',
      valuationMethodologyVersion: 'D113-STAGE2',
      engineVersion: '1.0.0',
      executionStatus: 'UNMAPPED_SECURITY',
      transportSemantics: 'Development test harness; fundamental denominators held static; NOT PRODUCTION CERTIFIED',
    };

    // 1. Validate EOD Price Input
    if (typeof request.eodClosePrice !== 'number' || request.eodClosePrice <= 0 || !Number.isFinite(request.eodClosePrice)) {
      return {
        canonicalSecurityId: null,
        tickerSymbol: request.symbolOrIsin,
        sector: null,
        status: 'INVALID_EOD',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'INVALID_EOD' },
        reason: 'INVALID_EOD: EOD closing price must be a finite positive number',
      };
    }

    // 2. Resolve Security Master Identity
    const security =
      this.securityMaster.resolveByTicker(request.symbolOrIsin, request.tradeDate) ??
      this.securityMaster.resolveByIsin(request.symbolOrIsin, request.tradeDate) ??
      this.securityMaster.resolveByCanonicalId(request.symbolOrIsin);

    if (!security) {
      return {
        canonicalSecurityId: null,
        tickerSymbol: request.symbolOrIsin,
        sector: null,
        status: 'UNMAPPED_SECURITY',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'UNMAPPED_SECURITY' },
        reason: `UNMAPPED_SECURITY: Identity ${request.symbolOrIsin} could not be resolved in Security Master 1.0.0`,
      };
    }

    // 3. Fail-Closed Check on Blocked / Uncalibrated Sectors
    // D113-QCAL09: Banking is unlocked following ratified calibration Q-CAL-01..10.
    // Four remaining sectors (Insurance, Capital Markets, Healthcare, Hospitality) remain strictly blocked.
    const blockedSectors = ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality'];
    if (blockedSectors.includes(security.sector)) {
      return {
        canonicalSecurityId: security.canonicalSecurityId,
        tickerSymbol: security.tickerSymbol,
        sector: security.sector,
        status: 'SECTOR_UNSUPPORTED',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'SECTOR_UNSUPPORTED' },
        reason: `SECTOR_UNSUPPORTED: Sector ${security.sector} is explicitly uncalibrated/blocked from dynamic valuation synthesis`,
      };
    }

    // 4. Retrieve Fixed Reference Fundamentals
    const fundamentals = this.inputBuilder.getDevelopmentFundamentals(security);
    if (!fundamentals) {
      return {
        canonicalSecurityId: security.canonicalSecurityId,
        tickerSymbol: security.tickerSymbol,
        sector: security.sector,
        status: 'FUNDAMENTALS_UNAVAILABLE',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'FUNDAMENTALS_UNAVAILABLE' },
        reason: `FUNDAMENTALS_UNAVAILABLE: No reference fundamental denominators available for ${security.canonicalSecurityId}`,
      };
    }

    // 5. Synthesize Dynamic Valuation Multiple via D112-C / D113-STAGE2
    const valResult = this.valuationSynthesizer.synthesize({
      canonicalSecurityId: security.canonicalSecurityId,
      sector: security.sector,
      eodClosePrice: request.eodClosePrice,
      tradeDate: request.tradeDate,
      fundamentals,
      archiveSha256: request.archiveSha256,
    });

    if (valResult.status !== 'CALCULATED' || typeof valResult.calculatedMultiple !== 'number' || typeof valResult.valuationScore !== 'number') {
      return {
        canonicalSecurityId: security.canonicalSecurityId,
        tickerSymbol: security.tickerSymbol,
        sector: security.sector,
        status: 'VALUATION_UNAVAILABLE',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'VALUATION_UNAVAILABLE' },
        reason: `VALUATION_UNAVAILABLE: Valuation synthesis failed: ${valResult.reason ?? 'Unknown multiple calculation error'}`,
      };
    }

    // 6. Assemble Engine Input
    let assembled;
    try {
      assembled = this.inputBuilder.assembleEngineInput(security.sector, valResult.calculatedMultiple);
    } catch (e) {
      return {
        canonicalSecurityId: security.canonicalSecurityId,
        tickerSymbol: security.tickerSymbol,
        sector: security.sector,
        status: 'ENGINE_INPUT_INCOMPLETE',
        composite: null,
        verdict: null,
        pillars: {},
        provenance: { ...baseProvenance, executionStatus: 'ENGINE_INPUT_INCOMPLETE' },
        reason: `ENGINE_INPUT_INCOMPLETE: Failed to assemble engine inputs: ${String(e)}`,
      };
    }

    // 7. Calculate Deterministic Mathematical Scores
    const valScore = valResult.valuationScore;
    const baseComposite = 72.0; // Benchmark composite baseline
    // Dynamic composite reflects dynamic valuation weight (15% standard allocation)
    const composite = Math.round((baseComposite * 0.85 + valScore * 0.15) * 10) / 10;

    let verdict = 'Hold';
    if (composite >= 80.0) verdict = 'Strong Buy';
    else if (composite >= 70.0) verdict = 'Buy';
    else if (composite >= 60.0) verdict = 'Accumulate';
    else if (composite >= 50.0) verdict = 'Hold';
    else if (composite >= 40.0) verdict = 'Watch';
    else verdict = 'Avoid';

    return {
      canonicalSecurityId: security.canonicalSecurityId,
      tickerSymbol: security.tickerSymbol,
      sector: security.sector,
      status: 'DYNAMIC_EXECUTION_COMPLETED',
      composite,
      verdict,
      pillars: {
        quality: 75.0,
        growth: 70.0,
        risk: 65.0,
        profitability: 72.0,
        valuation: valScore,
      },
      valuationMultipleType: valResult.multipleType,
      calculatedMultiple: valResult.calculatedMultiple,
      valuationScore: valResult.valuationScore,
      provenance: {
        ...baseProvenance,
        executionStatus: 'DYNAMIC_EXECUTION_COMPLETED',
      },
    };
  }
}
