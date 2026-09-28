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
  /**
   * IU-1 additive: optional series-aware security identity
   * (`D114SecurityIdentity.securityId`).
   *
   * When supplied, the query resolves strictly inside that series-aware PIT
   * identity and never falls back to a company/domain-only bucket, so a query
   * for `ISIN:<isin>:EQ` can never return an `ISIN:<isin>:BL` record.
   *
   * When omitted, the query resolves the company/domain identity; if more than
   * one series-aware identity has been admitted under it the lookup is ambiguous
   * and fails closed (see `resolvePitKey`).
   */
  securityId?: string;
}

/**
 * The single deterministic canonical PIT identity/key grammar (IU-1-A / §14).
 *
 * ```text
 * ${companyId}:${domain}                  — no series-aware identity supplied
 * ${companyId}:${domain}:${securityId}    — series-aware identity supplied
 * ```
 *
 * `securityId` already carries its own `ISIN:<isin>:<series>` grammar, so the
 * series is always an explicit, self-describing segment and never inferred,
 * defaulted, or collapsed.
 *
 * Fail-closed: a blank `companyId`, a blank `domain`, or a supplied-but-blank
 * `securityId` throws rather than silently degrading to an ambiguous key. A
 * missing series is therefore never manufactured into a default.
 */
export function buildPitKey(companyId: string, domain: DataDomain, securityId?: string): string {
  if (typeof companyId !== 'string' || companyId.trim().length === 0) {
    throw new Error('PIT identity requires a non-empty companyId');
  }
  if (typeof domain !== 'string' || domain.trim().length === 0) {
    throw new Error('PIT identity requires a non-empty domain');
  }
  if (securityId === undefined) {
    return `${companyId}:${domain}`;
  }
  if (typeof securityId !== 'string' || securityId.trim().length === 0) {
    throw new Error(
      'PIT identity received a blank securityId; ambiguous series-aware identity must fail closed',
    );
  }
  return `${companyId}:${domain}:${securityId}`;
}

export class PointInTimeStore<T = unknown> {
  // Key format: `${companyId}:${domain}[:${securityId}]` -> sorted array of
  // envelopes by asOf / timestamp
  private store: Map<string, Array<CanonicalEnvelope<T>>> = new Map();

  // company/domain prefix -> the set of full PIT keys admitted under it.
  // Lets a company/domain-only lookup detect an ambiguous multi-series identity
  // instead of arbitrarily selecting one series.
  private seriesIndex: Map<string, Set<string>> = new Map();

  /**
   * Appends an immutable snapshot envelope.
   * Historical record overwriting is strictly prohibited.
   */
  public append(envelope: CanonicalEnvelope<T>): void {
    const key = buildPitKey(envelope.companyId, envelope.domain, envelope.securityId);
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

    // Indexed only after a successful insert, so the series index never records
    // an identity whose admission did not complete.
    this.indexKey(key, envelope.companyId, envelope.domain);
  }

  /**
   * Resolves the single PIT key a lookup must read.
   *
   * - With `securityId`: strictly that series-aware key. No fallback, so a
   *   series-aware lookup can never leak a different series.
   * - Without `securityId`: the company/domain identity. Exactly one admitted
   *   key is unambiguous and is used; more than one is an ambiguous multi-series
   *   identity and throws (fail closed) rather than picking a series.
   */
  private resolvePitKey(companyId: string, domain: DataDomain, securityId?: string): string | undefined {
    if (securityId !== undefined) {
      return buildPitKey(companyId, domain, securityId);
    }

    const prefix = buildPitKey(companyId, domain);
    const keys = this.seriesIndex.get(prefix);
    if (!keys || keys.size === 0) {
      return undefined;
    }
    if (keys.size > 1) {
      throw new Error(
        `Ambiguous PIT identity for '${prefix}': ${keys.size} distinct series-aware identities ` +
          `admitted (${Array.from(keys).sort().join(', ')}). A securityId is required; ` +
          `ambiguous identity must fail closed.`,
      );
    }
    return Array.from(keys)[0];
  }

  private indexKey(key: string, companyId: string, domain: DataDomain): void {
    const prefix = buildPitKey(companyId, domain);
    let keys = this.seriesIndex.get(prefix);
    if (!keys) {
      keys = new Set();
      this.seriesIndex.set(prefix, keys);
    }
    keys.add(key);
  }

  /**
   * Executes a strict Point-in-Time query.
   * Returns the most recent snapshot where provenance.asOf <= query.asOf.
   * Zero future data leakage.
   */
  public queryAsOf(query: PITQuery): CanonicalEnvelope<T> | undefined {
    const key = this.resolvePitKey(query.companyId, query.domain, query.securityId);
    const list = key === undefined ? undefined : this.store.get(key);
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
   *
   * `securityId` is an optional additive parameter; omitting it preserves the
   * existing company/domain query semantics.
   */
  public queryRange(
    companyId: string,
    domain: DataDomain,
    from: string,
    to: string,
    securityId?: string,
  ): Array<CanonicalEnvelope<T>> {
    const key = this.resolvePitKey(companyId, domain, securityId);
    const list = key === undefined ? undefined : this.store.get(key);
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

  /**
   * Read-only enumeration of every PIT key admitted into this store.
   *
   * IU-3 (first non-production IRR -> IPD integration slice): the
   * securityId-addressed read boundary must resolve a series-aware identity
   * WITHOUT a `companyId`, because IRR holds no identifier that addresses an IPD
   * company and must never be handed one (AG-5 stays unresolved). This accessor
   * exposes already-admitted keys only.
   *
   * It does not mutate the store, does not re-key anything, and does not
   * introduce a second key grammar — the IU-1 grammar
   * `${companyId}:${domain}[:${securityId}]` remains the single authority.
   */
  public listAdmittedSeriesKeys(): ReadonlyArray<string> {
    const keys = new Set<string>();
    for (const admitted of this.seriesIndex.values()) {
      for (const key of admitted) {
        keys.add(key);
      }
    }
    return Array.from(keys).sort();
  }

  public clear(): void {
    this.store.clear();
    this.seriesIndex.clear();
  }
}
