/**
 * Institutional Investment Platform System (IIPS)
 * Operator Drop → durable PIT ingestion service (REG-06 admission, 2026-11-01)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 *
 * This is the piece that was missing from the `P16-08 / AD-17` operator drop
 * primitive. Before REG-06 admission the drop parser produced in-memory
 * envelopes keyed by `companyId` and nothing persisted them. This service:
 *
 *   1. reuses `OperatorDropParser` unchanged for checksum verification, JSON
 *      parsing, pipeline canonicalization and quarantine accounting;
 *   2. resolves each record's market-data identity through the **existing**
 *      series-qualified resolver (`buildD114SecurityIdentity` /
 *      `isD114SecurityIdentity`) — it never infers a series and never falls
 *      back to a company-only key;
 *   3. writes every admitted snapshot through the durable PIT path.
 *
 * Identity is required, not optional: a record with no explicit ISIN and series
 * is rejected with a reason, it is not silently admitted under `companyId`.
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import {
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  type DataDomain,
  type D114SecurityIdentity,
} from '../contracts/types.js';
import {
  IngestionPipeline,
  type IngestionInput,
  type IngestionResult,
} from '../ingress/pipeline.js';
import {
  OperatorDropParser,
  type OperatorDropIngestionSummary,
  type OperatorDropPayload,
} from './parser.js';
import type { PitAppendResult } from '../pit/pit_durable_store.js';

/** The durable write surface this service depends on. */
export interface PitSnapshotSink<T = unknown> {
  append(envelope: CanonicalEnvelope<T>): PitAppendResult;
}

export type OperatorDropRejectionReason =
  | 'MISSING_IDENTITY_FIELDS'
  | 'INVALID_IDENTITY'
  | 'IDENTITY_CONFLICT'
  | 'STORE_REJECTED'
  | 'SNAPSHOT_CONFLICT';

export interface OperatorDropRecordRejection {
  readonly index: number;
  readonly companyId: string;
  readonly reason: OperatorDropRejectionReason;
  readonly detail: string;
}

export interface OperatorDropIngestionReport {
  readonly batchId: string;
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly checksumVerified: boolean;
  readonly totalRecords: number;
  readonly appended: number;
  readonly duplicates: number;
  readonly quarantinedByParser: number;
  readonly rejectedByIdentity: number;
  readonly admittedSecurityIds: readonly string[];
  readonly rejections: readonly OperatorDropRecordRejection[];
  /** Present only when the whole package was refused before per-record work. */
  readonly rejectionReason?: string;
}

/**
 * Captures the raw record alongside the envelope the pipeline produced for it.
 *
 * The parser reports only successful envelopes, so quarantined records shift the
 * indices and a positional zip would mis-attribute identities. Recording at the
 * pipeline boundary keeps record and envelope paired exactly, and requires no
 * change to the tested parser.
 */
class RecordingIngestionPipeline extends IngestionPipeline {
  public readonly recorded: Array<{ rawPayload: unknown; envelope: CanonicalEnvelope<unknown> }> = [];

  public process<T>(input: IngestionInput): IngestionResult<T> {
    const result = super.process<T>(input);
    if (result.success) {
      this.recorded.push({
        rawPayload: input.rawPayload,
        envelope: result.envelope as CanonicalEnvelope<unknown>,
      });
    }
    return result;
  }
}

/**
 * Resolves the series-qualified identity from explicit source values only.
 *
 * Two accepted shapes, both explicit:
 *   - a complete `securityIdentity` object, validated by `isD114SecurityIdentity`;
 *   - separate `isin` and `series` fields, combined by `buildD114SecurityIdentity`.
 *
 * Anything else returns null. A bare ISIN, a blank series, or a `companyId` is
 * never promoted into an identity.
 */
export function resolveDropSecurityIdentity(
  record: unknown,
): { identity: D114SecurityIdentity } | { identity: null; reason: OperatorDropRejectionReason; detail: string } {
  if (typeof record !== 'object' || record === null) {
    return { identity: null, reason: 'MISSING_IDENTITY_FIELDS', detail: 'record is not an object' };
  }
  const candidate = record as Record<string, unknown>;

  const supplied = candidate.securityIdentity;
  if (supplied !== undefined) {
    if (!isD114SecurityIdentity(supplied)) {
      return {
        identity: null,
        reason: 'INVALID_IDENTITY',
        detail: 'securityIdentity is present but malformed or not canonically reconstructible',
      };
    }
    return { identity: supplied };
  }

  const isin = candidate.isin;
  const series = candidate.series;
  if (isin === undefined || series === undefined) {
    return {
      identity: null,
      reason: 'MISSING_IDENTITY_FIELDS',
      detail: 'record carries neither a securityIdentity nor explicit isin and series',
    };
  }

  const built = buildD114SecurityIdentity(isin, series);
  if (built === null) {
    return {
      identity: null,
      reason: 'INVALID_IDENTITY',
      detail: 'isin and series are present but do not form a valid ISIN:<isin>:<series> identity',
    };
  }
  return { identity: built };
}

export class OperatorDropIngestionService<T = unknown> {
  private readonly sink: PitSnapshotSink<T>;
  private readonly domain: DataDomain;

  constructor(sink: PitSnapshotSink<T>, domain: DataDomain) {
    if (sink === null || typeof sink !== 'object' || typeof sink.append !== 'function') {
      throw new Error('OperatorDropIngestionService requires a PIT snapshot sink with append()');
    }
    if (typeof domain !== 'string' || domain.trim().length === 0) {
      throw new Error('OperatorDropIngestionService requires a non-empty domain');
    }
    this.sink = sink;
    this.domain = domain;
  }

  /**
   * Ingests one operator drop package into durable PIT storage.
   *
   * The package-level checksum and JSON shape are enforced by the reused parser;
   * a package that fails either is refused whole. Per-record identity failures
   * quarantine that record only — one bad record never discards a valid batch,
   * and one valid record never rescues an invalid identity.
   */
  public ingest(drop: OperatorDropPayload): OperatorDropIngestionReport {
    const recording = new RecordingIngestionPipeline();
    const parser = new OperatorDropParser(recording);
    const summary: OperatorDropIngestionSummary = parser.processDropPackage(drop);

    const base = {
      batchId: drop.manifest.batchId,
      checksumVerified: summary.checksumVerified,
      totalRecords: summary.totalRecords,
      quarantinedByParser: summary.quarantinedCount,
    };

    if (summary.status === 'REJECTED') {
      return {
        ...base,
        status: 'REJECTED',
        appended: 0,
        duplicates: 0,
        rejectedByIdentity: 0,
        admittedSecurityIds: [],
        rejections: [],
        rejectionReason: summary.rejectionReason ?? 'drop package rejected by the ingestion pipeline',
      };
    }

    const rejections: OperatorDropRecordRejection[] = [];
    const admittedSecurityIds: string[] = [];
    let appended = 0;
    let duplicates = 0;

    recording.recorded.forEach((entry, index) => {
      const record =
        typeof entry.rawPayload === 'object' && entry.rawPayload !== null
          ? (entry.rawPayload as Record<string, unknown>)
          : {};
      const companyId = String(record.companyId ?? entry.envelope.companyId ?? 'UNKNOWN');

      const resolved = resolveDropSecurityIdentity(entry.rawPayload);
      if (resolved.identity === null) {
        const detail = 'detail' in resolved ? resolved.detail : 'unresolved identity';
        const reason = 'reason' in resolved ? resolved.reason : 'INVALID_IDENTITY';
        rejections.push({ index, companyId, reason, detail });
        return;
      }

      const identity = resolved.identity;
      const envelope = {
        ...entry.envelope,
        domain: this.domain,
        companyId,
        securityId: identity.securityId,
      } as CanonicalEnvelope<T>;

      try {
        const result = this.sink.append(envelope);
        if (result.status === 'DUPLICATE') duplicates += 1;
        else appended += 1;
        admittedSecurityIds.push(identity.securityId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        rejections.push({
          index,
          companyId,
          reason: message.includes('already durably stored') ? 'SNAPSHOT_CONFLICT' : 'STORE_REJECTED',
          detail: message,
        });
      }
    });

    const rejectedByIdentity = rejections.length;
    return {
      ...base,
      status: appended + duplicates > 0 && rejectedByIdentity === 0 ? 'ACCEPTED' : 'REJECTED',
      appended,
      duplicates,
      rejectedByIdentity,
      admittedSecurityIds,
      rejections,
    };
  }
}
