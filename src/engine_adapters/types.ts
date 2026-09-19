/**
 * Institutional Investment Platform System (IIPS)
 * P11 Engine Adapters & Integration Types
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { QualityState, SourceClassification } from '../contracts/types.js';
import { DataProvenanceDTO } from '../contracts/provenance.js';

export type CertifiedSectorEngineId =
  | 'SECTOR_IT'
  | 'SECTOR_BANKING'
  | 'SECTOR_AUTO'
  | 'SECTOR_PHARMA'
  | 'SECTOR_FMCG'
  | 'SECTOR_METALS'
  | 'SECTOR_OIL_GAS'
  | 'SECTOR_POWER'
  | 'SECTOR_CEMENT'
  | 'SECTOR_TELECOM'
  | 'SECTOR_CONSUMER_DURABLES'
  | 'SECTOR_CAPITAL_GOODS'
  | 'SECTOR_CHEMICALS'
  | 'CSIP_COMPOSITE';

export interface VersionVector {
  schemaVersion: string;
  engineVersion: string;
  securityMasterVersion: string;
  dataVersionVector: Record<string, string>; // domain -> dataVersion
}

export interface EngineExecutionRequest {
  requestId: string;
  companyId: string;
  engineId: CertifiedSectorEngineId;
  asOf: string; // ISO-8601 UTC
  rawMarketDataInputs: Record<string, unknown>; // Must follow MD:<domain>.<field>
  governedFinancialInputs?: Record<string, number>;
  governedIntelligenceInputs?: Record<string, unknown>;
  tenantId?: string;
  correlationId?: string;
  mode?: 'LIVE' | 'SNAPSHOT' | 'PIT';
}

export interface EngineScoreOutput {
  companyId: string;
  engineId: CertifiedSectorEngineId;
  rawScore: number;          // 0.0 to 100.0
  normalizedScore: number;   // 0.0 to 100.0
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  factorBreakdown: Record<string, number>;
  csipWeight?: number;
  qualityState: QualityState;
  provenance: DataProvenanceDTO;
  versionVector: VersionVector;
  executionId: string;
  evaluatedAt: string;
  isFallbackApplied: boolean;
  fallbackFields: string[];
}

export class NamespaceViolationError extends Error {
  public readonly fieldName: string;
  public readonly expectedPrefix: string;

  constructor(fieldName: string, expectedPrefix: string = 'MD:') {
    super(`C1-C6 Namespace Violation: Field '${fieldName}' violates governed namespace requirement (Must start with '${expectedPrefix}')`);
    this.name = 'NamespaceViolationError';
    this.fieldName = fieldName;
    this.expectedPrefix = expectedPrefix;
  }
}
