/**
 * Institutional Investment Platform System (IIPS)
 * Broker Import Foundation Contracts & Compatibility Boundary (BI-03)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { SecurityMaster } from '../../../../../src/identity/security_master.js';

/**
 * Reused FINAPP Broker Classification (WP-FB-IMPORT-BROKER-01)
 */
export type FinappBrokerType = 'ZERODHA' | 'DHAN' | 'GROWW' | 'GENERIC' | 'UNKNOWN';

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
    [key: string]: unknown;
  };
}

/**
 * Reused Minimal FINAPP Broker Adapter Foundation Contract
 */
export interface FinappBrokerAdapter {
  readonly brokerType: FinappBrokerType;
  readonly brokerName: string;
  readonly supportedFormats: readonly string[];
  parse(
    content: string | Buffer | ArrayBuffer,
    options?: Record<string, unknown>
  ): Promise<FinappBrokerParseResult> | FinappBrokerParseResult;
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
