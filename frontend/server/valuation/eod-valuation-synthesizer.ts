import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  ValuationInputPayload,
  ValuationResult,
  ValuationProvenanceDto,
} from './valuation-contract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Sectors certified with active Valuation pillars and complete band tables. */
export const CALIBRATED_VALUATION_SECTORS = [
  'Technology',
  'Industrials',
  'Energy',
  'Materials & Metals',
  'Telecommunications',
  'Automobile',
  'Consumer',
  'Utilities',
  'Banking', // D113-STAGE2: Banking P/ABV calibrated under Q-CAL-01..10
] as const;

/** Sectors lacking valuation calibration or explicitly blocked by Program Authority. */
export const UNCALIBRATED_BLOCKED_SECTORS = [
  'Insurance',
  'Capital Markets',
  'Healthcare',
  'Hospitality',
] as const;

type BandTuple = [string, number, number] | [string, number, number, number];

interface CalibrationProfile {
  profileId?: string;
  version?: string;
  bandScores?: Record<string, BandTuple[]>;
  metricBands?: Record<string, BandTuple[]>;
}

export class EodValuationSynthesizer {
  private readonly calibrationProfiles = new Map<string, CalibrationProfile>();

  constructor() {
    this.loadCalibrations();
  }

  private loadCalibrations(): void {
    // 8 Pre-calibrated sectors from iips-platform
    const platformSectorMap: Record<string, string> = {
      Technology: 'technology/technology-calibration-1.0.0.json',
      Industrials: 'industrials/industrials-calibration-1.0.0.json',
      Energy: 'energy/energy-calibration-1.0.0.json',
      'Materials & Metals': 'materials-metals/materials-metals-calibration-1.0.0.json',
      Telecommunications: 'telecommunications/telecommunications-calibration-1.0.0.json',
      Automobile: 'automobile/automobile-calibration-1.0.0.json',
      Consumer: 'consumer/consumer-calibration-1.0.0.json',
      Utilities: 'utilities/utilities-calibration-1.0.0.json',
    };

    for (const [sec, relPath] of Object.entries(platformSectorMap)) {
      const fullPath = path.resolve(__dirname, `../../../iips-platform/src/sector-engines/${relPath}`);
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8');
        this.calibrationProfiles.set(sec, JSON.parse(raw) as CalibrationProfile);
      }
    }

    // D113-STAGE2: Load Banking P/ABV ratified calibration profile
    const bankingCalibrationPath = path.resolve(__dirname, 'calibration/banking-valuation-calibration-1.0.0.json');
    if (fs.existsSync(bankingCalibrationPath)) {
      const raw = fs.readFileSync(bankingCalibrationPath, 'utf8');
      this.calibrationProfiles.set('Banking', JSON.parse(raw) as CalibrationProfile);
    }
  }

  /**
   * Synthesizes a calibrated valuation score from EOD Close + Fundamental Inputs.
   * Strictly enforces D112-B DEVELOPMENT_MIXED_VINTAGE provenance.
   */
  public synthesize(input: ValuationInputPayload): ValuationResult {
    const bankingProfile = input.sector === 'Banking' ? this.calibrationProfiles.get('Banking') : undefined;

    const provenance: ValuationProvenanceDto = {
      dataMode: 'LIVE',
      dataSource: 'IIPS EOD Valuation Synthesizer (D112-C / D113-STAGE2 DEVELOPMENT_HARNESS)',
      freshness: 'DEVELOPMENT_MIXED_VINTAGE',
      marketDataAsOf: input.tradeDate,
      marketDataSha256: input.archiveSha256 ?? 'UNSPECIFIED_LOCAL_SHA256',
      fundamentalsVintage: 'v1.1-reference',
      transportSemantics: 'Development test harness; fundamental denominators held static',
      calibrationProfileId: bankingProfile?.profileId,
      calibrationVersion: bankingProfile?.version,
    };

    // 1. Check Uncalibrated / Blocked Sectors (Insurance, CapMarkets, Healthcare, Hospitality)
    if (UNCALIBRATED_BLOCKED_SECTORS.includes(input.sector as (typeof UNCALIBRATED_BLOCKED_SECTORS)[number])) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'BLOCKED_UNCALIBRATED',
        valuationScore: null,
        reason: `UNCALIBRATED_SECTOR: ${input.sector} does not possess an authorized valuation calibration profile in repository`,
        provenance,
      };
    }

    // 2. Validate EOD Close Price
    if (typeof input.eodClosePrice !== 'number' || input.eodClosePrice <= 0 || !Number.isFinite(input.eodClosePrice)) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'INVALID_EOD_CLOSE_PRICE: EOD closing price must be a finite positive number',
        provenance,
      };
    }

    // 3. Validate Fundamentals Presence
    const f = input.fundamentals;
    if (!f || typeof f !== 'object') {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'MISSING_FUNDAMENTALS: Fundamental inputs object is null or undefined',
        provenance,
      };
    }

    // 4. Validate Shares Outstanding
    if (typeof f.sharesOutstanding !== 'number' || f.sharesOutstanding <= 0 || !Number.isFinite(f.sharesOutstanding)) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'INVALID_SHARES_OUTSTANDING: Shares outstanding must be a finite positive number',
        provenance,
      };
    }

    // 5. Derive Market Cap & Enterprise Value
    const marketCap = input.eodClosePrice * f.sharesOutstanding;
    const debt = typeof f.debt === 'number' && Number.isFinite(f.debt) ? f.debt : 0;
    const cash = typeof f.cash === 'number' && Number.isFinite(f.cash) ? f.cash : 0;
    const enterpriseValue = marketCap + debt - cash;

    // 6. Sector-Specific Multiple Synthesis and Evaluation
    switch (input.sector) {
      case 'Banking': {
        // D113-STAGE2: Banking Layer-2.5 Calibrated P/ABV Evaluation (Decisions A1, B2/Q-CAL-01..10)
        return this.synthesizeBankingCalibrated(input, provenance);
      }

      case 'Technology': {
        // Metric TM-004: EV / Revenue
        if (typeof f.ltmRevenue !== 'number' || f.ltmRevenue <= 0 || !Number.isFinite(f.ltmRevenue)) {
          return {
            canonicalSecurityId: input.canonicalSecurityId,
            sector: input.sector,
            status: 'UNAVAILABLE',
            valuationScore: null,
            marketCap,
            enterpriseValue,
            reason: 'NON_POSITIVE_REVENUE: Technology valuation requires finite positive LTM Revenue for EV/Revenue calculation',
            provenance,
          };
        }
        const multiple = enterpriseValue / f.ltmRevenue;
        const score = this.evaluateBand('Technology', 'TM-004', multiple);
        return {
          canonicalSecurityId: input.canonicalSecurityId,
          sector: input.sector,
          status: 'CALCULATED',
          valuationScore: score,
          multipleType: 'EV/Revenue',
          calculatedMultiple: multiple,
          marketCap,
          enterpriseValue,
          provenance,
        };
      }

      case 'Industrials': {
        // Metric IM-004: EV / EBITDA
        return this.synthesizeEvEbitda(input, 'Industrials', 'IM-004', enterpriseValue, marketCap, provenance);
      }

      case 'Energy': {
        // Metric EM-003-leverage: EV / EBITDA
        return this.synthesizeEvEbitda(input, 'Energy', 'EM-003-leverage', enterpriseValue, marketCap, provenance);
      }

      case 'Materials & Metals': {
        // Metric MM-011: EV / EBITDA
        return this.synthesizeEvEbitda(input, 'Materials & Metals', 'MM-011', enterpriseValue, marketCap, provenance);
      }

      case 'Telecommunications': {
        // Metric TC-011: EV / EBITDA
        return this.synthesizeEvEbitda(input, 'Telecommunications', 'TC-011', enterpriseValue, marketCap, provenance);
      }

      case 'Automobile': {
        // Metric AB-011: P / E ratio
        return this.synthesizePeRatio(input, 'Automobile', 'AB-011', marketCap, enterpriseValue, provenance);
      }

      case 'Consumer': {
        // Metric CM-003-leverage: P / E ratio
        return this.synthesizePeRatio(input, 'Consumer', 'CM-003-leverage', marketCap, enterpriseValue, provenance);
      }

      case 'Utilities': {
        // Metric UM-003-leverage: P / E ratio
        return this.synthesizePeRatio(input, 'Utilities', 'UM-003-leverage', marketCap, enterpriseValue, provenance);
      }

      default:
        return {
          canonicalSecurityId: input.canonicalSecurityId,
          sector: input.sector,
          status: 'UNAVAILABLE',
          valuationScore: null,
          reason: `UNRECOGNIZED_SECTOR: ${input.sector}`,
          provenance,
        };
    }
  }

  /**
   * Stage 2 Banking Layer-2.5 Calibrated Valuation Synthesis.
   * Governed by Program Authority Adjudication Q-CAL-01 through Q-CAL-10:
   * - Q-CAL-01: Static Policy Bands (Option D).
   * - Q-CAL-04: Ratified Thresholds:
   *     P/ABV < 1.2x        => Score 90.0
   *     1.2x <= P/ABV < 1.8x => Score 75.0
   *     1.8x <= P/ABV < 2.5x => Score 60.0
   *     2.5x <= P/ABV < 3.2x => Score 45.0
   *     P/ABV >= 3.2x       => Score 20.0
   * - Q-CAL-05: Non-positive ABV (Net NPA >= Net Worth) fails closed (status: UNAVAILABLE, score: null).
   * - Q-CAL-06: Defined exceptional events excluded; fail-closed if flagged.
   * - Q-CAL-08: Calibrated via immutable profile banking-valuation-calibration-1.0.0.json.
   * - Q-CAL-10: Exposed as orthogonal valuation score.
   */
  private synthesizeBankingCalibrated(
    input: ValuationInputPayload,
    provenance: ValuationProvenanceDto
  ): ValuationResult {
    // 1. Validate EOD Close Price
    if (typeof input.eodClosePrice !== 'number' || input.eodClosePrice <= 0 || !Number.isFinite(input.eodClosePrice)) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'INVALID_EOD_CLOSE_PRICE: EOD closing price must be a finite positive number',
        provenance,
      };
    }

    const f = input.fundamentals;
    if (!f || typeof f !== 'object') {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'MISSING_FUNDAMENTALS: Fundamental inputs object is null or undefined',
        provenance,
      };
    }

    // 2. Exceptional Event Exclusion (Q-CAL-06)
    if (f.exceptionalEventFlag === true) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: `EXCEPTIONAL_EVENT_EXCLUDED: Valuation evaluation blocked due to defined exceptional bank event: ${f.exceptionalEventReason ?? 'UNSPECIFIED_EVENT'}`,
        provenance,
      };
    }

    // 3. Validate Shares Outstanding
    if (typeof f.sharesOutstanding !== 'number' || f.sharesOutstanding <= 0 || !Number.isFinite(f.sharesOutstanding)) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        reason: 'INVALID_SHARES_OUTSTANDING: Shares outstanding must be a finite positive number',
        provenance,
      };
    }

    const marketCap = input.eodClosePrice * f.sharesOutstanding;
    const debt = typeof f.debt === 'number' && Number.isFinite(f.debt) ? f.debt : 0;
    const cash = typeof f.cash === 'number' && Number.isFinite(f.cash) ? f.cash : 0;
    const enterpriseValue = marketCap + debt - cash;

    // 4. Determine Net Worth Base (Tangible Net Worth or Total Equity)
    const hasTangibleNetWorth = typeof f.tangibleNetWorth === 'number' && Number.isFinite(f.tangibleNetWorth);
    const hasTotalEquity = typeof f.totalEquity === 'number' && Number.isFinite(f.totalEquity);

    if (!hasTangibleNetWorth && !hasTotalEquity) {
      // If neither tangibleNetWorth nor totalEquity is provided, Banking remains BLOCKED_UNCALIBRATED
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'BLOCKED_UNCALIBRATED',
        valuationScore: null,
        marketCap,
        enterpriseValue,
        reason: `UNCALIBRATED_SECTOR: ${input.sector} fundamentals lack tangibleNetWorth or totalEquity`,
        provenance,
      };
    }

    const netWorth = hasTangibleNetWorth ? f.tangibleNetWorth! : f.totalEquity!;

    // 5. Validate Net NPA (defaults to 0 if bank reports zero net NPA)
    const netNpa = typeof f.netNpa === 'number' && Number.isFinite(f.netNpa) ? f.netNpa : 0;
    if (netNpa < 0) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        marketCap,
        enterpriseValue,
        reason: 'INVALID_NET_NPA: Net NPA cannot be negative',
        provenance,
      };
    }

    // 6. Compute Adjusted Book Value (ABV)
    const adjustedBookValue = netWorth - netNpa;

    // Fail closed if ABV is zero or negative (distressed balance sheet per Q-CAL-05)
    if (adjustedBookValue <= 0) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        marketCap,
        enterpriseValue,
        adjustedBookValue,
        reason: 'NON_POSITIVE_ADJUSTED_BOOK_VALUE: Adjusted Book Value (Net Worth - Net NPA) must be strictly positive',
        provenance,
      };
    }

    // 7. Compute ABVPS and raw P/ABV Multiple
    const adjustedBookValuePerShare = adjustedBookValue / f.sharesOutstanding;
    const pabv = input.eodClosePrice / adjustedBookValuePerShare;
    const roundedMultiple = Math.round(pabv * 1000) / 1000;

    // 8. Evaluate Calibrated Score via Approved Profile (Q-CAL-04 / Q-CAL-08)
    const score = this.evaluateBand('Banking', 'BM-VAL-001', roundedMultiple);

    return {
      canonicalSecurityId: input.canonicalSecurityId,
      sector: input.sector,
      status: 'CALCULATED',
      valuationScore: score,
      multipleType: 'P/ABV',
      calculatedMultiple: roundedMultiple,
      marketCap,
      enterpriseValue,
      adjustedBookValue,
      adjustedBookValuePerShare: Math.round(adjustedBookValuePerShare * 100) / 100,
      provenance,
    };
  }

  private synthesizeEvEbitda(
    input: ValuationInputPayload,
    sector: string,
    metricCode: string,
    enterpriseValue: number,
    marketCap: number,
    provenance: ValuationProvenanceDto
  ): ValuationResult {
    const ebitda = input.fundamentals.ltmEbitda;
    if (typeof ebitda !== 'number' || ebitda <= 0 || !Number.isFinite(ebitda)) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        marketCap,
        enterpriseValue,
        reason: `NON_POSITIVE_EBITDA: ${sector} valuation requires finite positive LTM EBITDA for EV/EBITDA calculation`,
        provenance,
      };
    }
    const multiple = enterpriseValue / ebitda;
    const score = this.evaluateBand(sector, metricCode, multiple);
    return {
      canonicalSecurityId: input.canonicalSecurityId,
      sector: input.sector,
      status: 'CALCULATED',
      valuationScore: score,
      multipleType: 'EV/EBITDA',
      calculatedMultiple: multiple,
      marketCap,
      enterpriseValue,
      provenance,
    };
  }

  private synthesizePeRatio(
    input: ValuationInputPayload,
    sector: string,
    metricCode: string,
    marketCap: number,
    enterpriseValue: number,
    provenance: ValuationProvenanceDto
  ): ValuationResult {
    const f = input.fundamentals;
    let pe: number | null = null;

    if (typeof f.ltmEps === 'number' && f.ltmEps > 0 && Number.isFinite(f.ltmEps)) {
      pe = input.eodClosePrice / f.ltmEps;
    } else if (typeof f.ltmNetIncome === 'number' && f.ltmNetIncome > 0 && Number.isFinite(f.ltmNetIncome)) {
      pe = marketCap / f.ltmNetIncome;
    }

    if (pe === null) {
      return {
        canonicalSecurityId: input.canonicalSecurityId,
        sector: input.sector,
        status: 'UNAVAILABLE',
        valuationScore: null,
        marketCap,
        enterpriseValue,
        reason: `NON_POSITIVE_EARNINGS: ${sector} valuation requires finite positive EPS or Net Income for P/E calculation`,
        provenance,
      };
    }

    const score = this.evaluateBand(sector, metricCode, pe);
    return {
      canonicalSecurityId: input.canonicalSecurityId,
      sector: input.sector,
      status: 'CALCULATED',
      valuationScore: score,
      multipleType: 'P/E',
      calculatedMultiple: pe,
      marketCap,
      enterpriseValue,
      provenance,
    };
  }

  /**
   * Evaluates a multiple against the sector's calibrated band table.
   * Lower-inclusive, upper-exclusive per standard ADR-01 band semantics.
   */
  private evaluateBand(sector: string, metricCode: string, value: number): number {
    const profile = this.calibrationProfiles.get(sector);
    if (!profile) {
      throw new Error(`MISSING_CALIBRATION: No calibration profile loaded for sector ${sector}`);
    }
    const bands = profile.bandScores?.[metricCode] ?? profile.metricBands?.[metricCode];
    if (!bands || !Array.isArray(bands) || bands.length === 0) {
      throw new Error(`MISSING_METRIC_BANDS: Calibration profile for ${sector} lacks band table for ${metricCode}`);
    }

    for (const b of bands) {
      const op = b[0] as string;
      if (op === 'lt' && value < (b[1] as number)) return b[2] as number;
      if (op === 'lte' && value <= (b[1] as number)) return b[2] as number;
      if (op === 'gt' && value > (b[1] as number)) return b[2] as number;
      if (op === 'gte' && value >= (b[1] as number)) return b[2] as number;
      if (op === 'range' && value >= (b[1] as number) && value < (b[2] as number)) return b[3] as number;
    }

    // Default to lowest bucket if value exceeds defined range
    const last = bands[bands.length - 1];
    return (last[last.length - 1] as number) ?? 20.0;
  }
}
