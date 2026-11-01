/**
 * Read-only, securityId-addressed facade over the authoritative PIT store.
 * The service constructs nothing, mutates nothing and never infers a series or
 * a company/security mapping.
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import { DataDomain, isD114SecurityId } from '../contracts/types.js';
import type { PitSnapshotStore } from './pit_store.js';

export type PitReadFailureReason =
  | 'NOT_FOUND'
  | 'AMBIGUOUS'
  | 'INVALID_ASOF'
  | 'INVALID_IDENTITY'
  | 'INVALID_DOMAIN';

export interface PitReadRequest {
  readonly securityId: string;
  readonly domain: DataDomain;
  readonly asOf: string;
}

export interface PitReadHit<T> {
  readonly found: true;
  readonly securityId: string;
  readonly domain: DataDomain;
  readonly asOf: string;
  readonly resolvedAsOf: string;
  readonly payload: T;
  readonly provenance: CanonicalEnvelope<T>['provenance'];
}

export interface PitReadMiss {
  readonly found: false;
  readonly reason: PitReadFailureReason;
}

export type PitReadResult<T = unknown> = PitReadHit<T> | PitReadMiss;

const DATA_DOMAINS: readonly DataDomain[] = Object.freeze([
  'D01_QUOTES',
  'D02_OHLCV',
  'D03_FUNDAMENTALS',
  'D04_CORPORATE_ACTIONS',
  'D05_SECURITY_MASTER',
  'D06_NEWS',
  'D07_ESTIMATES',
  'D08_MACRO',
  'D09_ALTDATA',
] as const);

function isValidDomain(value: unknown): value is DataDomain {
  return typeof value === 'string' && (DATA_DOMAINS as readonly string[]).includes(value);
}

/**
 * Strict UTC timestamp validation. Date.parse alone is insufficient because it
 * rolls impossible dates such as 2026-02-30 into March.
 */
function isValidAsOf(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;

  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > (days[month - 1] as number)) return false;
  return !Number.isNaN(Date.parse(value));
}

export class PitReadService<T = unknown> {
  private readonly store: PitSnapshotStore<T>;

  /**
   * The store's payload type is not part of the security/query boundary. The
   * facade projects the caller-selected payload type without inspecting or
   * transforming payloads; accepting the unknown-payload store also supports
   * the existing IRR composition's explicit service specialization.
   *
   * The parameter is the `PitSnapshotStore` read surface, so the same facade
   * serves the in-memory store and the durable store without a second
   * implementation; `PointInTimeStore` satisfies this surface unchanged, so
   * every existing composition keeps working without modification.
   */
  constructor(store: PitSnapshotStore<unknown>) {
    this.store = store as PitSnapshotStore<T>;
  }

  public queryAsOf(request: PitReadRequest): PitReadResult<T> {
    if (!isD114SecurityId(request?.securityId)) {
      return { found: false, reason: 'INVALID_IDENTITY' };
    }
    if (!isValidDomain(request?.domain)) {
      return { found: false, reason: 'INVALID_DOMAIN' };
    }
    if (!isValidAsOf(request?.asOf)) {
      return { found: false, reason: 'INVALID_ASOF' };
    }

    const { securityId, domain, asOf } = request;
    const suffix = `:${domain}:${securityId}`;
    const companyIds: string[] = [];

    for (const key of this.store.listAdmittedSeriesKeys()) {
      if (!key.endsWith(suffix)) continue;
      const companyId = key.slice(0, key.length - suffix.length);
      if (companyId.length > 0) companyIds.push(companyId);
    }

    if (companyIds.length === 0) return { found: false, reason: 'NOT_FOUND' };
    if (companyIds.length > 1) return { found: false, reason: 'AMBIGUOUS' };

    let envelope: CanonicalEnvelope<T> | undefined;
    try {
      envelope = this.store.queryAsOf({
        companyId: companyIds[0] as string,
        domain,
        asOf,
        securityId,
      });
    } catch {
      return { found: false, reason: 'AMBIGUOUS' };
    }

    if (!envelope) return { found: false, reason: 'NOT_FOUND' };
    if (envelope.securityId !== securityId || envelope.domain !== domain) {
      return { found: false, reason: 'AMBIGUOUS' };
    }

    const resolvedAsOf = envelope.provenance.asOf;
    if (!isValidAsOf(resolvedAsOf) || Date.parse(resolvedAsOf) > Date.parse(asOf)) {
      return { found: false, reason: 'AMBIGUOUS' };
    }

    return {
      found: true,
      securityId,
      domain,
      asOf,
      resolvedAsOf,
      payload: envelope.payload,
      provenance: envelope.provenance,
    };
  }
}
