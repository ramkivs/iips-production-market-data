/**
 * Institutional Investment Platform System (IIPS)
 * Append-Only Point-in-Time (PIT) Snapshot Store (P08)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import {
  DataDomain,
  isD114SecurityId,
  isD114SecurityIdentity,
} from '../contracts/types.js';

export interface PITQuery {
  companyId: string;
  domain: DataDomain;
  asOf: string; // ISO-8601 UTC timestamp
  /** Optional series-aware identity. Never inferred from companyId. */
  securityId?: string;
}

/**
 * The single PIT key grammar:
 *   `${companyId}:${domain}`                  — legacy company/domain record
 *   `${companyId}:${domain}:${securityId}`    — series-aware record
 *
 * Blank or malformed identity fails closed. In particular, a supplied blank
 * securityId never degrades to the ambiguous company/domain key.
 */
export function buildPitKey(companyId: string, domain: DataDomain, securityId?: string): string {
  if (typeof companyId !== 'string' || companyId.trim().length === 0) {
    throw new Error('PIT identity requires a non-empty companyId');
  }
  if (typeof domain !== 'string' || domain.trim().length === 0) {
    throw new Error('PIT identity requires a non-empty domain');
  }
  if (securityId === undefined) return `${companyId}:${domain}`;
  if (!isD114SecurityId(securityId)) {
    throw new Error('PIT securityId must use the exact ISIN:<isin>:<series> grammar');
  }
  return `${companyId}:${domain}:${securityId}`;
}

/**
 * Reads the optional D01/D02 identity without imposing a payload class on the
 * generic store. An absent property is legacy; a present one must be valid and
 * agree with the envelope's explicit identity.
 */
function payloadSecurityIdentity(payload: unknown): unknown {
  if (typeof payload !== 'object' || payload === null) return undefined;
  return (payload as { securityIdentity?: unknown }).securityIdentity;
}

export class PointInTimeStore<T = unknown> {
  private store: Map<string, Array<CanonicalEnvelope<T>>> = new Map();

  /** company/domain prefix -> all actual admitted full keys under that prefix. */
  private seriesIndex: Map<string, Set<string>> = new Map();

  /** Appends an immutable snapshot envelope; historical overwrite is prohibited. */
  public append(envelope: CanonicalEnvelope<T>): void {
    const key = buildPitKey(envelope.companyId, envelope.domain, envelope.securityId);
    const payloadIdentity = payloadSecurityIdentity(envelope.payload);

    if (payloadIdentity !== undefined) {
      if (!isD114SecurityIdentity(payloadIdentity)) {
        throw new Error('PIT payload securityIdentity is malformed');
      }
      if (envelope.securityId === undefined) {
        throw new Error('PIT envelope securityId is required when payload securityIdentity is present');
      }
      if (payloadIdentity.securityId !== envelope.securityId) {
        throw new Error('PIT envelope and payload security identities conflict');
      }
    }

    let list = this.store.get(key);
    if (!list) {
      list = [];
      this.store.set(key, list);
    }

    const frozen = Object.freeze(JSON.parse(JSON.stringify(envelope))) as CanonicalEnvelope<T>;
    const asOfMs = Date.parse(frozen.provenance.asOf);
    const insertIdx = list.findIndex((e) => Date.parse(e.provenance.asOf) > asOfMs);
    if (insertIdx === -1) list.push(frozen);
    else list.splice(insertIdx, 0, frozen);

    // Index only after successful insertion, so a failed admission is invisible.
    const prefix = buildPitKey(envelope.companyId, envelope.domain);
    let keys = this.seriesIndex.get(prefix);
    if (!keys) {
      keys = new Set();
      this.seriesIndex.set(prefix, keys);
    }
    keys.add(key);
  }

  /**
   * A series-aware query reads exactly one key. A legacy company/domain query
   * may read a sole admitted key, but multiple series are ambiguous and throw.
   */
  private resolvePitKey(companyId: string, domain: DataDomain, securityId?: string): string | undefined {
    if (securityId !== undefined) return buildPitKey(companyId, domain, securityId);

    const prefix = buildPitKey(companyId, domain);
    const keys = this.seriesIndex.get(prefix);
    if (!keys || keys.size === 0) return undefined;
    if (keys.size > 1) {
      throw new Error(
        `Ambiguous PIT identity for '${prefix}': ${keys.size} admitted keys; ` +
          'an explicit securityId is required',
      );
    }
    return Array.from(keys)[0] as string;
  }

  /** Returns the newest snapshot whose provenance.asOf <= query.asOf. */
  public queryAsOf(query: PITQuery): CanonicalEnvelope<T> | undefined {
    const key = this.resolvePitKey(query.companyId, query.domain, query.securityId);
    const list = key === undefined ? undefined : this.store.get(key);
    if (!list || list.length === 0) return undefined;

    const targetMs = Date.parse(query.asOf);
    if (isNaN(targetMs)) throw new Error(`Invalid asOf timestamp: ${query.asOf}`);

    let match: CanonicalEnvelope<T> | undefined;
    for (const item of list) {
      const itemMs = Date.parse(item.provenance.asOf);
      if (itemMs <= targetMs) match = item;
      else break;
    }
    return match;
  }

  /** Queries historical snapshots in the inclusive interval [from, to]. */
  public queryRange(
    companyId: string,
    domain: DataDomain,
    from: string,
    to: string,
    securityId?: string,
  ): Array<CanonicalEnvelope<T>> {
    const key = this.resolvePitKey(companyId, domain, securityId);
    const list = key === undefined ? undefined : this.store.get(key);
    if (!list || list.length === 0) return [];

    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    return list.filter((item) => {
      const itemMs = Date.parse(item.provenance.asOf);
      return itemMs >= fromMs && itemMs <= toMs;
    });
  }

  public getRecordCount(): number {
    let count = 0;
    for (const list of this.store.values()) count += list.length;
    return count;
  }

  /**
   * Read-only, lexically ordered enumeration of actual admitted keys. This is
   * not an eligibility roster: only successful append operations create keys.
   */
  public listAdmittedSeriesKeys(): ReadonlyArray<string> {
    return Array.from(this.store.keys()).sort();
  }

  public clear(): void {
    this.store.clear();
    this.seriesIndex.clear();
  }
}
