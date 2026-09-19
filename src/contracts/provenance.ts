/**
 * Institutional Investment Platform System (IIPS)
 * Data Lineage & Provenance Schema (P01-05 / NFR-06)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import * as crypto from 'crypto';
import { QualityState, SourceClassification, VendorTier } from './types.js';

export interface DataProvenanceDTO {
  sourceClassification: SourceClassification;
  vendorTier: VendorTier;
  asOf: string;          // ISO-8601 UTC
  receivedAt: string;    // ISO-8601 UTC
  evaluatedAt: string;   // ISO-8601 UTC
  dataVersion: string;
  lineageHash: string;   // Cryptographic SHA-256 digest
  qualityState: QualityState;
  quarantineReason?: string;
  traceId?: string;
  correlationId?: string;
  tenantId?: string;
}

export function computeLineageHash(
  payload: unknown,
  metadata: {
    sourceClassification: string;
    asOf: string;
    dataVersion: string;
    parentHash?: string;
  }
): string {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(payload));
  hash.update(metadata.sourceClassification);
  hash.update(metadata.asOf);
  hash.update(metadata.dataVersion);
  if (metadata.parentHash) {
    hash.update(metadata.parentHash);
  }
  return hash.digest('hex');
}

/**
 * NFR-06 Provider Masking Enforcement:
 * Ensures vendor-specific internal names or network locations are masked
 * into strictly governed source classifications before emitting to downstream consumers.
 */
export function sanitizeProvenanceForConsumer(
  provenance: DataProvenanceDTO
): DataProvenanceDTO {
  return {
    sourceClassification: provenance.sourceClassification,
    vendorTier: provenance.vendorTier,
    asOf: provenance.asOf,
    receivedAt: provenance.receivedAt,
    evaluatedAt: provenance.evaluatedAt,
    dataVersion: provenance.dataVersion,
    lineageHash: provenance.lineageHash,
    qualityState: provenance.qualityState,
    quarantineReason: provenance.quarantineReason,
    traceId: provenance.traceId,
    correlationId: provenance.correlationId,
    tenantId: provenance.tenantId,
  };
}
