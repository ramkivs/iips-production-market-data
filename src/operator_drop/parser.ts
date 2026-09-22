/**
 * Institutional Investment Platform System (IIPS)
 * OPERATOR_DROP Offline Bootstrap & Fallback Ingestion (P16-08 / AD-17)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as crypto from 'crypto';
import { DataDomain } from '../contracts/types.js';
import { CanonicalEnvelope } from '../contracts/envelope.js';
import { IngestionPipeline, IngestionResult } from '../ingress/pipeline.js';

export interface OperatorDropManifest {
  batchId: string;
  domain: DataDomain;
  fileChecksumSha256: string;
  recordCount: number;
  droppedAt: string; // ISO-8601 UTC
  operatorId: string;
}

export interface OperatorDropPayload {
  manifest: OperatorDropManifest;
  rawContent: string; // Serialized JSON or CSV content
}

export interface OperatorDropIngestionSummary {
  batchId: string;
  status: 'ACCEPTED' | 'REJECTED';
  totalRecords: number;
  successfulEnvelopes: CanonicalEnvelope<unknown>[];
  quarantinedCount: number;
  checksumVerified: boolean;
  rejectionReason?: string;
}

export class OperatorDropParser {
  private pipeline: IngestionPipeline;

  constructor(pipeline?: IngestionPipeline) {
    this.pipeline = pipeline || new IngestionPipeline();
  }

  /**
   * Validates and ingests an offline operator drop package.
   * Computes SHA-256 digest of rawContent and compares against manifest.
   */
  public processDropPackage(drop: OperatorDropPayload): OperatorDropIngestionSummary {
    const computedHash = crypto.createHash('sha256').update(drop.rawContent).digest('hex');

    // Verify SHA-256 checksum integrity
    if (computedHash.toLowerCase() !== drop.manifest.fileChecksumSha256.toLowerCase()) {
      return {
        batchId: drop.manifest.batchId,
        status: 'REJECTED',
        totalRecords: 0,
        successfulEnvelopes: [],
        quarantinedCount: 1,
        checksumVerified: false,
        rejectionReason: `Checksum mismatch: expected ${drop.manifest.fileChecksumSha256}, calculated ${computedHash}`,
      };
    }

    let records: Array<Record<string, unknown>>;
    try {
      records = JSON.parse(drop.rawContent);
      if (!Array.isArray(records)) {
        return {
          batchId: drop.manifest.batchId,
          status: 'REJECTED',
          totalRecords: 0,
          successfulEnvelopes: [],
          quarantinedCount: 1,
          checksumVerified: true,
          rejectionReason: 'Drop content must parse to a JSON array of records',
        };
      }
    } catch (err: unknown) {
      return {
        batchId: drop.manifest.batchId,
        status: 'REJECTED',
        totalRecords: 0,
        successfulEnvelopes: [],
        quarantinedCount: 1,
        checksumVerified: true,
        rejectionReason: `JSON parse error: ${(err as Error).message}`,
      };
    }

    const successfulEnvelopes: CanonicalEnvelope<unknown>[] = [];
    let quarantinedCount = 0;

    for (const record of records) {
      const companyId = String(record.companyId || 'UNKNOWN');
      const result: IngestionResult<unknown> = this.pipeline.process({
        domain: drop.manifest.domain,
        mode: 'SNAPSHOT',
        companyId,
        rawPayload: record,
        receivedAt: drop.manifest.droppedAt,
        asOf: drop.manifest.droppedAt,
        sourceClassification: 'CANONICAL_MARKET_DATA',
        correlationId: `opdrop-${drop.manifest.batchId}`,
      });

      if (result.success) {
        successfulEnvelopes.push(result.envelope);
      } else {
        quarantinedCount++;
      }
    }

    return {
      batchId: drop.manifest.batchId,
      status: successfulEnvelopes.length > 0 ? 'ACCEPTED' : 'REJECTED',
      totalRecords: records.length,
      successfulEnvelopes,
      quarantinedCount,
      checksumVerified: true,
    };
  }
}
