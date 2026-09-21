/**
 * Institutional Investment Platform System (IIPS)
 * Broker Import Foundation Contracts & Compatibility Boundary (BI-03 / BI-04 / BI-05)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04 / BI-05
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01 / BI-04-AUTH-2026-01 / BI-05-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { SecurityMaster } from '../../../../../src/identity/security_master.js';

/**
 * Reused FINAPP Broker Classification (WP-FB-IMPORT-BROKER-01)
 */
export type FinappBrokerType = 'ZERODHA' | 'DHAN' | 'GROWW' | 'GENERIC' | 'UNKNOWN';

/**
 * Supported File Formats for Broker Exports
 */
export type BrokerFileFormat = 'CSV' | 'XLSX' | 'JSON' | 'UNKNOWN';

/**
 * Ingress Pipeline Control-Flow Execution Stages (BI-05)
 */
export type IngressStage =
  | 'DETECT'
  | 'QUALIFICATION_CHECK'
  | 'PARSE'
  | 'NORMALIZE'
  | 'VALIDATE'
  | 'COMPLETE';

/**
 * Ingress Pipeline Final Disposition (BI-05)
 */
export type IngressDisposition = 'READY_FOR_PORTFOLIO_SAVE' | 'REJECTED' | 'BLOCKED';

/**
 * Granular Rejection Reasons for Ingress Failure and Edge-Case Auditing (BI-05)
 */
export type BrokerIngressRejectionReason =
  | 'EMPTY_FILE'
  | 'BLANK_FILE'
  | 'UNKNOWN_FORMAT'
  | 'AMBIGUOUS_FORMAT'
  | 'UNSUPPORTED_XLSX'
  | 'MALFORMED_CSV'
  | 'INVALID_NUMERIC'
  | 'NON_POSITIVE_QTY'
  | 'NON_POSITIVE_PRICE'
  | 'MISSING_SYMBOL_AND_ISIN'
  | 'UNMAPPED_IDENTITY'
  | 'IDENTITY_AMBIGUITY'
  | 'SCHEMA_MISMATCH'
  | 'PORTFOLIO_EMPTY';

/**
 * Reused Minimal FINAPP Holding Interface (WP-FB-IMPORT-BROKER-01)
 * Represents raw parsed holding structure from broker export before IIPS canonical mapping.
 */
export interface FinappHolding {
  symbol: string;
  isin?: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  closePrice?: number;
  pnl?: number;
  pnlPercentage?: number;
  sector?: string;
  exchange?: 'NSE' | 'BSE' | string;
  assetClass?: 'EQUITY' | 'ETF' | 'MUTUAL_FUND' | string;
  instrumentToken?: string | number;
  marketValue?: number;
  raw?: Record<string, unknown>;
}

/**
 * Reused FINAPP Broker Parser Result Interface
 */
export interface FinappBrokerParseResult {
  success: boolean;
  brokerType: FinappBrokerType;
  holdings: FinappHolding[];
  totalHoldings: number;
  totalValue?: number;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    fileFormat?: string;
    parsedAt?: string;
    sourceFileName?: string;
    requiresXlsx?: boolean;
    qualificationStatus?: 'QUALIFIED' | 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06';
    [key: string]: unknown;
  };
}

/**
 * Broker Adapter Parse Options
 */
export interface BrokerAdapterParseOptions {
  fileName?: string;
  asOf?: string;
  skipHeaderRows?: number;
  encoding?: string;
  [key: string]: unknown;
}

/**
 * Reused Minimal FINAPP Broker Adapter Foundation Contract
 */
export interface FinappBrokerAdapter {
  readonly brokerType: FinappBrokerType;
  readonly brokerName: string;
  readonly supportedFormats: readonly string[];
  parse(
    content: string | Uint8Array | ArrayBuffer | any,
    options?: BrokerAdapterParseOptions
  ): Promise<FinappBrokerParseResult> | FinappBrokerParseResult;
}

/**
 * Result of Broker Format Detection (BrokerFormatDetector)
 */
export interface BrokerDetectionResult {
  brokerType: FinappBrokerType;
  confidence: number; // 0.0 to 1.0 (1.0 = exact deterministic match)
  format: BrokerFileFormat;
  detectedHeaders: string[];
  requiresXlsx: boolean;
  details: string;
}

/**
 * Canonical IIPS Target Holding Input Contract (UserHoldingInput)
 * Represents normalized, weighted, entity-resolved portfolio holdings ready for Portfolio Store & Engines.
 */
export interface UserHoldingInput {
  symbol: string;
  companyId: string;
  isin?: string;
  exchange?: 'NSE' | 'BSE';
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  weightPercentage: number; // Derived & normalized to sum exactly to 100.0%
  active: boolean;
  sourceBroker: FinappBrokerType;
  lineageDigest: string;
}

/**
 * Options for broker holdings mapping & normalization
 */
export interface BrokerMappingOptions {
  asOf?: string;
  securityMaster?: SecurityMaster;
  failOnUnmappedIdentity?: boolean; // Default true (fail-closed under P04 / AD-12)
  minHoldingValueThreshold?: number; // Default 0 (exclude <= 0)
  targetWeightPrecision?: number; // Default 4 decimal places
}

/**
 * Comprehensive Result of mapBrokerOutputToUserHoldings
 */
export interface BrokerMappingResult {
  success: boolean;
  userHoldings: UserHoldingInput[];
  totalMarketValue: number;
  totalHoldingsCount: number;
  validHoldingsCount: number;
  excludedHoldingsCount: number;
  aggregatedHoldingsCount: number;
  weightSumPercentage: number; // Exactly 100.0 (or 0.0 if empty)
  warnings: string[];
  errors: string[];
  provenance: {
    sourceBroker: FinappBrokerType;
    mappedAt: string;
    lineageHash: string;
    dataVersion: string;
  };
}

/**
 * Detailed Ingress Rejection Entry (BI-05)
 */
export interface BrokerIngressRejection {
  recordIndex?: number;
  rawIdentifier?: string;
  reason: BrokerIngressRejectionReason;
  details: string;
  stage: IngressStage;
}

/**
 * Input Request for Broker Import Ingress Orchestrator (BI-05)
 */
export interface BrokerIngressRequest {
  content: string | Uint8Array | ArrayBuffer | any;
  fileName?: string;
  asOf?: string;
  securityMaster?: SecurityMaster;
  failOnUnmappedIdentity?: boolean; // Default true
  minHoldingValueThreshold?: number; // Default 0
  allowPartialRejection?: boolean; // Default true
  targetWeightPrecision?: number; // Default 4
}

/**
 * Comprehensive Ingress & Hardening Result (BI-05)
 */
export interface BrokerIngressResult {
  success: boolean;
  disposition: IngressDisposition;
  stageReached: IngressStage;
  detection: BrokerDetectionResult;
  qualificationStatus: 'QUALIFIED' | 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06' | 'UNKNOWN_FORMAT';
  parseResult?: FinappBrokerParseResult;
  mappingResult?: BrokerMappingResult;
  userHoldings: UserHoldingInput[];
  totalMarketValue: number;
  totalHoldingsCount: number;
  validHoldingsCount: number;
  rejectedCount: number;
  aggregatedCount: number;
  weightSumPercentage: number;
  warnings: string[];
  errors: string[];
  rejections: BrokerIngressRejection[];
  provenance: {
    sourceBroker: FinappBrokerType;
    fileName: string;
    asOf: string;
    contentDigest: string; // Deterministic SHA-256 of raw input content
    lineageDigest: string; // Deterministic SHA-256 of normalized valid holdings
    dataVersion: string;
  };
}
