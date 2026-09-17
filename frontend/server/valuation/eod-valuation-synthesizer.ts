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
] as const;

/** Sectors lacking valuation calibration or explicitly blocked by Program Authority. */
export const UNCALIBRATED_BLOCKED_SECTORS = [
  'Banking',
  'Insurance',
  'Capital Markets',
  'Healthcare',
  'Hospitality',
] as const;

type BandTuple = [string, number, number] | [string, number, number, number];

interface CalibrationProfile {
  bandScores?: Record<string, BandTuple[]>;
  metricBands?: Record<string, BandTuple[]>;
}

export class EodValuationSynthesizer {
  private readonly calibrationProfiles = new Map<string, CalibrationProfile>();

  constructor() {
    this.loadCalibrations();
  }

  private loadCalibrations(): void {
    const sectorFileMap: Record<string, string> = {
      Technology: 'technology/technology-calibration-1.0.0.json',
      Industrials: 'industrials/industrials-calibration-1.0.0.json',
      Energy: 'energy/energy-calibration-1.0.0.json',
      'Materials & Metals': 'materials-metals/materials-metals-calibration-1.0.0.json',
      Telecommunications: 'telecommunications/telecommunications-calibration-1.0.0.json',
      Automobile: 'automobile/automobile-calibration-1.0.0.json',
      Consumer: 'consumer/consumer-calibration-1.0.0.json',
      Utilities: 'utilities/utilities-calibration-1.0.0.json',
    };

    for (const [sec, relPath] of Object.entries(sectorFileMap)) {
      const fullPath = path.resolve(__dirname, `../../../iips-platform/src/sector-engines/${relPath}`);
      if (fs.existsSync(fullPath)) {
        const raw = fs.readFileSync(fullPath, 'utf8');
        this.calibrationProfiles.set(sec, JSON.parse(raw) as CalibrationProfile);
      }
    }
  }

  /**
   * Synthesizes a calibrated valuation score from EOD Close + Fundamental Inputs.
   * Strictly enforces D112-B DEVELOPMENT_MIXED_VINTAGE provenance.
   */
  public synthesize(input: ValuationInputPayload): ValuationResult {
    const provenance: ValuationProvenanceDto = {
      dataMode: 'LIVE',
      dataSource: 'IIPS EOD Valuation Synthesizer (D112-C / D113-STAGE1 DEVELOPMENT_HARNESS)',
      freshness: 'DEVELOPMENT_MIXED_VINTAGE',
      marketDataAsOf: input.tradeDate,
      marketDataSha256: input.archiveSha256 ?? 'UNSPECIFIED_LOCAL_SHA256',
      fundamentalsVintage: 'v1.1-reference',
      transportSemantics: 'Development test harness; fundamental denominators held static',
    };

    // 1. Check Uncalibrated / Blocked Sectors
    // Note: For Banking under D113 Stage 1, if banking fundamentals (tangibleNetWorth / totalEquity)
    // are absent, it fails closed as uncalibrated or missing inputs.
    if (UNCALIBRATED_BLOCKED_SECTORS.includes(input.sector as (typeof UNCALIBRATED_BLOCKED_SECTORS)[number])) {
      if (input.sector === 'Banking') {
        // Evaluate Banking Stage 1 scaffold if input provides banking fundamentals
        return this.synthesizeBankingScaffold(input, provenance);
      }

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
   * Stage 1 Banking Layer-2.5 Valuation Scaffold.
   * Under Program Authority Decisions A1 and B2:
   * - Evaluates raw Price-to-Adjusted Book Value (P/ABV) metric per D113 specification.
   * - Formula:
   *     Adjusted Book Value (ABV) = Tangible Net Worth (or Total Equity) - Net NPA
   *     ABVPS = ABV / Shares Outstanding
   *     P/ABV = EOD Close Price / ABVPS (or Market Cap / ABV)
   * - Critical Boundary (B2): Numerical calibration bands are NOT authorized.
   *   Returns status: 'CALIBRATION_PENDING', valuationScore: null.
   * - If banking fundamentals are missing or zero/negative, fails closed according to repository semantics.
   * - If no banking-specific equity/tangibleNetWorth is present, preserves BLOCKED_UNCALIBRATED behavior.
   */
  private synthesizeBankingScaffold(
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

    // 2. Validate Shares Outstanding
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

    // 3. Determine Net Worth Base (Tangible Net Worth or Total Equity)
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
        reason: `UNCALIBRATED_SECTOR: ${input.sector} does not possess an authorized valuation calibration profile in repository`,
        provenance,
      };
    }

    const netWorth = hasTangibleNetWorth ? f.tangibleNetWorth! : f.totalEquity!;

    // 4. Validate Net NPA (defaults to 0 if bank reports zero net NPA)
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

    // 5. Compute Adjusted Book Value (ABV)
    const adjustedBookValue = netWorth - netNpa;

    // Fail closed if ABV is zero or negative (distressed balance sheet)
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

    // 6. Compute ABVPS and raw P/ABV Multiple
    const adjustedBookValuePerShare = adjustedBookValue / f.sharesOutstanding;
    const pabv = input.eodClosePrice / adjustedBookValuePerShare;

    // 7. Enforce Decision B2 Boundary: Numerical Calibration is Pending
    // valuationScore MUST remain null; status MUST be CALIBRATION_PENDING.
    return {
      canonicalSecurityId: input.canonicalSecurityId,
      sector: input.sector,
      status: 'CALIBRATION_PENDING',
      valuationScore: null,
      multipleType: 'P/ABV',
      calculatedMultiple: Math.round(pabv * 1000) / 1000,
      marketCap,
      enterpriseValue,
      adjustedBookValue,
      adjustedBookValuePerShare: Math.round(adjustedBookValuePerShare * 100) / 100,
      reason: 'CALIBRATION_PENDING: Raw P/ABV metric computed; numerical calibration bands deferred under Program Authority Decision B2',
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
    return (last[last.length - 1] as number) ?? 30.0;
  }
}
