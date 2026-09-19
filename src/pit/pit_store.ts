/**
 * Institutional Investment Platform System (IIPS)
 * Append-Only Point-in-Time (PIT) Snapshot Store (P08)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import { DataDomain } from '../contracts/types.js';

export interface PITQuery {
  companyId: string;
  domain: DataDomain;
  asOf: string; // ISO-8601 UTC timestamp
}

export class PointInTimeStore<T = unknown> {
  // Key format: `${companyId}:${domain}` -> sorted array of envelopes by asOf / timestamp
  private store: Map<string, Array<CanonicalEnvelope<T>>> = new Map();

  /**
   * Appends an immutable snapshot envelope.
   * Historical record overwriting is strictly prohibited.
   */
  public append(envelope: CanonicalEnvelope<T>): void {
    const key = `${envelope.companyId}:${envelope.domain}`;
    let list = this.store.get(key);
    if (!list) {
      list = [];
      this.store.set(key, list);
    }

    // Freeze the envelope to enforce immutability
    const frozen = Object.freeze(JSON.parse(JSON.stringify(envelope))) as CanonicalEnvelope<T>;

    // Insert maintaining chronological order by provenance.asOf
    const asOfMs = Date.parse(frozen.provenance.asOf);
    const insertIdx = list.findIndex((e) => Date.parse(e.provenance.asOf) > asOfMs);
    if (insertIdx === -1) {
      list.push(frozen);
    } else {
      list.splice(insertIdx, 0, frozen);
    }
  }

  /**
   * Executes a strict Point-in-Time query.
   * Returns the most recent snapshot where provenance.asOf <= query.asOf.
   * Zero future data leakage.
   */
  public queryAsOf(query: PITQuery): CanonicalEnvelope<T> | undefined {
    const key = `${query.companyId}:${query.domain}`;
    const list = this.store.get(key);
    if (!list || list.length === 0) {
      return undefined;
    }

    const targetMs = Date.parse(query.asOf);
    if (isNaN(targetMs)) {
      throw new Error(`Invalid asOf timestamp: ${query.asOf}`);
    }

    // Find the latest record with asOf <= targetMs
    let match: CanonicalEnvelope<T> | undefined = undefined;
    for (const item of list) {
      const itemMs = Date.parse(item.provenance.asOf);
      if (itemMs <= targetMs) {
        match = item;
      } else {
        break; // Ordered list, no need to check further
      }
    }

    return match;
  }

  /**
   * Queries historical snapshots within a given time interval [from, to].
   */
  public queryRange(companyId: string, domain: DataDomain, from: string, to: string): Array<CanonicalEnvelope<T>> {
    const key = `${companyId}:${domain}`;
    const list = this.store.get(key);
    if (!list || list.length === 0) {
      return [];
    }

    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);

    return list.filter((item) => {
      const itemMs = Date.parse(item.provenance.asOf);
      return itemMs >= fromMs && itemMs <= toMs;
    });
  }

  public getRecordCount(): number {
    let count = 0;
    for (const list of this.store.values()) {
      count += list.length;
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
  }
}
