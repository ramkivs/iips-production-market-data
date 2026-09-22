/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-E / Packages P13 & P14: Product UI / UX Types & Contracts
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { QualityState } from '../contracts/types.js';
import { ExecutiveProvenance } from '../transports/types.js';
import { MarketDataDTO } from '../transports/market_data_dto.js';
import { FundamentalsDTO } from '../transports/fundamentals_dto.js';
import { IntelligenceDTO } from '../transports/intelligence_dto.js';
import { ScreenerFilter, ScreenerCandidate, ScreenerResponse } from '../transports/screener_service.js';
import { ResolvedSecurityObject } from '../transports/object_resolver.js';
import { IdentityQuery } from '../identity/mapping_store.js';
import { EngineScoreOutput } from '../engine_adapters/types.js';

/**
 * Governed UI Surface Identifiers (UI01–UI14)
 * Note: UI17 is permanently decommissioned under M-6 defect containment.
 */
export type UISurfaceId =
  | 'UI01_REPLAY_STUDIO'
  | 'UI02_EXECUTIVE_SUMMARY'
  | 'UI03_FUNDAMENTAL_ANALYSIS'
  | 'UI04_DOMAIN_INTELLIGENCE'
  | 'UI05_SECTOR_SCORING_RADAR'
  | 'UI06_MULTIFACTOR_SCREENER'
  | 'UI07_PIT_CORPORATE_ACTIONS'
  | 'UI08_SECURITY_MASTER_MODAL'
  | 'UI09_RESTATEMENT_TIMELINE'
  | 'UI10_ANOMALY_MONITOR'
  | 'UI11_PROVENANCE_AUDITOR'
  | 'UI12_ESTIMATES_DISTRIBUTION'
  | 'UI13_MACRO_VINTAGE_TRACKER'
  | 'UI14_ALTDATA_AUDITOR';

/**
 * Four-Tier Responsive Breakpoint Layout Model (AD-18)
 */
export type ResponsiveTier = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'WIDE';

export interface BreakpointConfig {
  tier: ResponsiveTier;
  minWidth: number;
  maxWidth: number;
  columns: number;
  isDense: boolean;
  pinPrimaryColumn: boolean;
}

export const RESPONSIVE_BREAKPOINTS: Record<ResponsiveTier, BreakpointConfig> = {
  MOBILE: { tier: 'MOBILE', minWidth: 320, maxWidth: 767, columns: 1, isDense: true, pinPrimaryColumn: true },
  TABLET: { tier: 'TABLET', minWidth: 768, maxWidth: 1023, columns: 2, isDense: false, pinPrimaryColumn: false },
  DESKTOP: { tier: 'DESKTOP', minWidth: 1024, maxWidth: 1439, columns: 3, isDense: false, pinPrimaryColumn: false },
  WIDE: { tier: 'WIDE', minWidth: 1440, maxWidth: 99999, columns: 4, isDense: true, pinPrimaryColumn: false },
};

/**
 * WCAG 2.1 AA Dual-Coded Quality Status Indicator (AD-18)
 */
export interface UIQualityIndicator {
  state: QualityState;
  label: string;
  icon: string;
  colorHex: string;
  ariaText: string;
  isDegraded: boolean;
}

/**
 * Base Presentation View Model for all UI surfaces (P13 / AD-14)
 */
export interface BaseViewModel {
  surfaceId: UISurfaceId;
  companyId: string;
  companyName: string;
  asOf: string;
  qualityIndicator: UIQualityIndicator;
  provenance: ExecutiveProvenance;
  ad17Disclosure?: string;
  pinnedVintage?: {
    filingDate: string;
    periodEndDate: string;
    restatementIndex: number;
  };
  responsiveLayout: {
    tier: ResponsiveTier;
    columns: number;
    pinnedColumn?: string;
  };
  accessibility: {
    ariaLive: 'polite' | 'assertive' | 'off';
    ariaRole: string;
    focusElementId?: string;
    tableCaption?: string;
  };
}

/**
 * UI01: Replay & Simulation Studio View Model
 */
export interface UI01ReplayStudioViewModel extends BaseViewModel {
  surfaceId: 'UI01_REPLAY_STUDIO';
  replaySpeed: number;
  simulationAsOf: string;
  ad17MandatoryDisclosure: string; // AD17_CONSTRAINT notice
  marketSnapshot: MarketDataDTO;
  engineScore: EngineScoreOutput;
}

/**
 * UI02: Executive Summary Dashboard View Model
 */
export interface UI02ExecutiveSummaryViewModel extends BaseViewModel {
  surfaceId: 'UI02_EXECUTIVE_SUMMARY';
  quote: {
    lastPrice: number;
    change: number;
    pctChange: number;
    volume: number;
    currency: string;
  };
  compositeScore: {
    score: number;
    grade: string;
    rank?: number;
  };
  factorHighlights: Array<{ factor: string; score: number; weight: number }>;
  intelligenceSummary: {
    newsSentiment: number;
    estimatesConsensusPrice: number | null;
    macroTrend: string;
    altDataConfidence: number;
  };
}

/**
 * UI03: Fundamental Analysis View Model
 */
export interface UI03FundamentalAnalysisViewModel extends BaseViewModel {
  surfaceId: 'UI03_FUNDAMENTAL_ANALYSIS';
  pinnedVintage: {
    filingDate: string;
    periodEndDate: string;
    restatementIndex: number;
  };
  ratios: Record<string, number | null | undefined>;
  ttmStatements: {
    revenue: number;
    ebitda: number;
    netIncome: number;
    operatingCashFlow: number;
    quartersCount: number;
  };
  balanceSheetIdentityValid: boolean;
}

/**
 * UI04: Domain Intelligence View Model
 */
export interface UI04DomainIntelligenceViewModel extends BaseViewModel {
  surfaceId: 'UI04_DOMAIN_INTELLIGENCE';
  newsSignals: Array<{ headline: string; sentiment: number; sourceClass: string; isOfficialExchange: boolean }>;
  estimatesConsensus: { targetPrice: number | null; analystCount: number; isValidConsensus: boolean };
  macroIndicators: Array<{ indicatorCode: string; value: number; period: string; releaseDate: string; vintageDate: string }>;
  altDataSignals: Array<{ signalName: string; confidence: number; approvalRef: string }>;
}

/**
 * UI05: Sector Engine Scoring Radar View Model
 */
export interface UI05SectorScoringRadarViewModel extends BaseViewModel {
  surfaceId: 'UI05_SECTOR_SCORING_RADAR';
  engineId: string;
  rawScore: number;
  normalizedScore: number;
  grade: string;
  factorBreakdown: Array<{ factor: string; score: number; weight: number; sectorBenchmark: number; delta: number }>;
  isFallbackApplied: boolean;
  fallbackFields: string[];
}

/**
 * UI06: Multi-Factor Screener View Model (Contract C6)
 */
export interface UI06MultiFactorScreenerViewModel extends BaseViewModel {
  surfaceId: 'UI06_MULTIFACTOR_SCREENER';
  filterCriteria: ScreenerFilter;
  totalMatches: number;
  results: ScreenerCandidate[];
}

/**
 * UI07: Point-in-Time Corporate Actions View Model
 */
export interface UI07PitCorporateActionsViewModel extends BaseViewModel {
  surfaceId: 'UI07_PIT_CORPORATE_ACTIONS';
  corporateActions: Array<{
    actionId: string;
    actionType: string;
    exDate: string;
    recordDate: string;
    ratio: string;
    factor: number;
  }>;
  adjustmentFactorCumulative: number;
}

/**
 * UI08: Security Master Resolution Modal View Model (Contract C7)
 */
export interface UI08SecurityMasterModalViewModel extends BaseViewModel {
  surfaceId: 'UI08_SECURITY_MASTER_MODAL';
  query: IdentityQuery;
  resolution: ResolvedSecurityObject;
  isModalOpen: boolean;
  trapFocus: boolean;
}

/**
 * UI09: Restatement Timeline Comparison View Model
 */
export interface UI09RestatementTimelineViewModel extends BaseViewModel {
  surfaceId: 'UI09_RESTATEMENT_TIMELINE';
  originalFiling: { filingDate: string; revenue: number; netIncome: number; restatementIndex: number };
  restatedFiling: { filingDate: string; revenue: number; netIncome: number; restatementIndex: number };
  deltaRevenuePct: number;
  deltaNetIncomePct: number;
  isMaterialDelta: boolean;
}

/**
 * UI10: Data Quality Anomaly Monitor View Model
 */
export interface UI10AnomalyMonitorViewModel extends BaseViewModel {
  surfaceId: 'UI10_ANOMALY_MONITOR';
  activeAnomalies: Array<{ category: string; description: string; timestamp: string }>;
  freshnessStatus: { isStale: boolean; delaySeconds: number; maxToleratedDelaySeconds: number };
  quarantineCount: number;
}

/**
 * UI11: Executive Provenance Auditor View Model
 */
export interface UI11ProvenanceAuditorViewModel extends BaseViewModel {
  surfaceId: 'UI11_PROVENANCE_AUDITOR';
  lineageHash: string;
  vendorTier: string;
  sourceClassification: string;
  versionVector: Record<string, string>;
  tenantId?: string;
  correlationId?: string;
  evaluatedAt: string;
}

/**
 * UI12: Consensus Estimates Distribution View Model
 */
export interface UI12EstimatesDistributionViewModel extends BaseViewModel {
  surfaceId: 'UI12_ESTIMATES_DISTRIBUTION';
  meanTargetPrice: number | null;
  medianTargetPrice: number | null;
  highTargetPrice: number | null;
  lowTargetPrice: number | null;
  analystCount: number;
  standardDeviation: number | null;
  isConsensusSufficient: boolean; // N >= 3 check
}

/**
 * UI13: Macro Vintage Tracker View Model
 */
export interface UI13MacroVintageTrackerViewModel extends BaseViewModel {
  surfaceId: 'UI13_MACRO_VINTAGE_TRACKER';
  indicatorSeries: Array<{
    indicatorCode: string;
    period: string;
    releaseDate: string;
    vintageDate: string;
    value: number;
    isCarriedForward: boolean;
  }>;
}

/**
 * UI14: Alternative Data Signal Auditor View Model
 */
export interface UI14AltDataAuditorViewModel extends BaseViewModel {
  surfaceId: 'UI14_ALTDATA_AUDITOR';
  signals: Array<{
    signalName: string;
    rawValue: number;
    normalizedValue: number;
    confidence: number;
    approvalRef: string;
    isGovernanceApproved: boolean;
  }>;
}
