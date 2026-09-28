/**
 * Institutional Investment Platform System (IIPS)
 * PIT Read Service — securityId-addressed read boundary (IU-3)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 *
 * IU-3 — first non-production IRR -> IPD integration slice.
 *
 * This service is the ONLY destination boundary through which an external
 * application (IRR) reads IPD's point-in-time market-data capability. It is a
 * read-only facade over the authoritative `PointInTimeStore`:
 *
 *   - it delegates every query to `PointInTimeStore.queryAsOf`;
 *   - it creates no store, no journal, and no persistence of its own;
 *   - it introduces no second key grammar and no second identity grammar;
 *   - `securityId = ISIN:<isin>:<series>` (IU-2) is the only accepted identity.
 *
 * The service is addressed by `securityId`, `domain` and `asOf`. It deliberately
 * does NOT accept a `companyId`: IRR's `companyId` is a synthetic sector
 * archetype (`${sector}-H1`) and occupies a value space disjoint from IPD's, and
 * IPD's `IdentityMappingStore` is series-agnostic, so resolving through it would
 * collapse series. AG-5 therefore stays unresolved and is not required here.
 *
 * Every invalid, ambiguous or absent case fails closed. No series is ever
 * inferred, defaulted, collapsed, or selected as "first match".
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import {
  DataDomain,
  D114_ISIN_LENGTH,
  D114_ISIN_PATTERN,
  D114_SECURITY_ID_PREFIX,
} from '../contracts/types.js';
import { PointInTimeStore } from './pit_store.js';

/** Fail-closed reasons. A miss is always explicit; it is never silent. */
export type PitReadFailureReason =
  | 'NOT_FOUND'
  | 'AMBIGUOUS'
  | 'INVALID_ASOF'
  | 'INVALID_IDENTITY'
  | 'INVALID_DOMAIN';

/**
 * The cross-repository request contract.
 *
 * All three fields are mandatory. There is no partial request and no default:
 * a missing field is a fail-closed miss, never an inferred value.
 */
export interface PitReadRequest {
  /** `ISIN:<isin>:<series>` — the canonical cross-platform security identity. */
  readonly securityId: string;
  readonly domain: DataDomain;
  /** ISO-8601 UTC instant. The returned vintage is strictly <= this value. */
  readonly asOf: string;
}

export interface PitReadHit<T> {
  readonly found: true;
  readonly securityId: string;
  readonly domain: DataDomain;
  readonly asOf: string;
  /** The vintage actually returned. Always <= `asOf`. */
  readonly resolvedAsOf: string;
  readonly payload: T;
  /** IPD provenance, passed through verbatim and never reinterpreted. */
  readonly provenance: CanonicalEnvelope<T>['provenance'];
}

export interface PitReadMiss {
  readonly found: false;
  readonly reason: PitReadFailureReason;
}

export type PitReadResult<T = unknown> = PitReadHit<T> | PitReadMiss;

/**
 * Runtime guard for the `DataDomain` union. `DataDomain` is a type, so it has no
 * runtime existence; this frozen list is the validation surface for that same
 * union and introduces no new domain concept.
 */
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

/**
 * Validates the `ISIN:<isin>:<series>` grammar.
 *
 * Structural only: the ISIN identifies, it does not certify
 * (`D114_ISIN_AUTHORITY = NON_AUTHORITATIVE`). A bare ISIN, a missing series, a
 * blank series, or a wrong-length ISIN is rejected — a series is never inferred.
 */
function isValidSecurityId(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const segments = value.split(':');
  if (segments.length !== 3) {
    return false;
  }
  const [prefix, isin, series] = segments as [string, string, string];
  if (prefix !== D114_SECURITY_ID_PREFIX) {
    return false;
  }
  if (isin.length !== D114_ISIN_LENGTH || !D114_ISIN_PATTERN.test(isin)) {
    return false;
  }
  if (series.trim().length === 0) {
    return false;
  }
  return true;
}

function isValidDomain(value: unknown): value is DataDomain {
  return typeof value === 'string' && (DATA_DOMAINS as readonly string[]).includes(value);
}

function isValidAsOf(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * The IPD PIT read boundary.
 *
 * Injectable store: the caller supplies the authoritative `PointInTimeStore`
 * (already populated by the D114 historical ingestion path). The service never
 * constructs, owns, or persists a store of its own.
 */
export class PitReadService<T = unknown> {
  constructor(private readonly store: PointInTimeStore<T>) {}

  /**
   * Resolves a series-correct PIT record for `securityId` at `asOf`.
   *
   * Fail-closed outcomes:
   *   INVALID_IDENTITY — missing/blank/malformed `securityId`
   *   INVALID_DOMAIN   — missing/unknown `domain`
   *   INVALID_ASOF     — missing/non-ISO-8601 `asOf`
   *   AMBIGUOUS        — more than one admitted PIT identity matches the request
   *   NOT_FOUND        — exactly one identity matches but no vintage is <= asOf
   *
   * The lookup is strictly series-scoped: a request for `ISIN:<isin>:EQ` can
   * never return an `ISIN:<isin>:BL` record.
   */
  public queryAsOf(request: PitReadRequest): PitReadResult<T> {
    if (!isValidSecurityId(request?.securityId)) {
      return { found: false, reason: 'INVALID_IDENTITY' };
    }
    if (!isValidDomain(request?.domain)) {
      return { found: false, reason: 'INVALID_DOMAIN' };
    }
    if (!isValidAsOf(request?.asOf)) {
      return { found: false, reason: 'INVALID_ASOF' };
    }

    const securityId = request.securityId;
    const domain = request.domain;
    const asOf = request.asOf;

    // Resolve securityId -> the single admitted PIT key, without a companyId.
    // A key is `${companyId}:${domain}:${securityId}`, so the domain and the
    // securityId are trailing segments and the remainder is the companyId.
    const suffix = `:${domain}:${securityId}`;
    const companyIds: string[] = [];
    for (const key of this.store.listAdmittedSeriesKeys()) {
      if (!key.endsWith(suffix)) {
        continue;
      }
      const companyId = key.slice(0, key.length - suffix.length);
      if (companyId.length === 0) {
        continue; // not an admissible key shape
      }
      companyIds.push(companyId);
    }

    if (companyIds.length === 0) {
      return { found: false, reason: 'NOT_FOUND' };
    }
    if (companyIds.length > 1) {
      // The same series-aware identity was admitted under more than one
      // companyId. Refuse rather than picking a winner.
      return { found: false, reason: 'AMBIGUOUS' };
    }

    const companyId = companyIds[0] as string;

    let envelope: CanonicalEnvelope<T> | undefined;
    try {
      envelope = this.store.queryAsOf({ companyId, domain, asOf, securityId });
    } catch {
      // The store fails closed on an ambiguous identity; surface that as such
      // rather than letting it escape as an unclassified error.
      return { found: false, reason: 'AMBIGUOUS' };
    }

    if (envelope === undefined) {
      return { found: false, reason: 'NOT_FOUND' };
    }

    const resolvedAsOf = envelope.provenance.asOf;

    // Belt-and-braces: preserve the PIT contract at this boundary. A vintage
    // stamped after the requested instant is never returned.
    if (!(Date.parse(resolvedAsOf) <= Date.parse(asOf))) {
      return { found: false, reason: 'NOT_FOUND' };
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
