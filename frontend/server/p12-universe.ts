/**
 * P13-B — GOVERNED UNIVERSE PROVIDER (DERIVED, NOT FABRICATED)
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * Purpose:
 *   Supply the P12 contracts (C6 screener, C7 object resolution) with a governed
 *   universe DERIVED from the certified v2.0 decision-matrix payload that this transport
 *   already computes from the frozen v1.1 Replay Baseline via the certified engines.
 *
 * ⚠ LINEAGE DISCLOSURE (P13-B-08) — read this before interpreting any output.
 *
 *   The ROWS are v2.0-CERTIFIED in origin: they are the certified engine outputs already
 *   served by `/api/decision-matrix`. The SCREENING/RESOLUTION APPLIED TO THEM is
 *   P12-GOVERNED: filtering, deterministic ordering, degradation classification and
 *   identity resolution are performed by the certified P12 contracts.
 *
 *   The resulting lineage is therefore **DUAL**, and is disclosed as such. It is NOT
 *   relabelled as P12-governed data. P12 did not produce these values; P12 governs the
 *   operations over them. This distinction is deliberate and must not be collapsed.
 *
 * ⚠ NO FABRICATED PROVENANCE. Every provenance field below is derived from the certified
 *   payload actually used. Where a governed fact is genuinely unavailable it is reported
 *   as `unavailable` / absent — never upgraded, never invented.
 *
 * ⚠ NOT A MARKET-DATA FEED. P05–P11 provider ingestion is NOT wired to this transport.
 *   This provider does not claim to expose provider-sourced market data. It exposes the
 *   certified reference universe the v2.0 transport already serves.
 */

import type { GovernedRow } from './p12-transport';

/** The certified decision-matrix shape this provider derives from (v2.0 transport DTO). */
export interface CertifiedMatrixCompany {
  readonly companyId: string;
  readonly sector: string;
  readonly verdict: string;
  readonly composite: number;
  readonly quality: number | null;
  readonly valuation: number | null;
}

export interface CertifiedMatrixPayload {
  readonly companies: readonly CertifiedMatrixCompany[];
  readonly provenance?: {
    readonly dataSource?: string;
    readonly freshness?: string;
    readonly calibratedAt?: string;
  };
}

/**
 * Map the certified quality AXIS (a 0..1 engine score) onto the P05 closed quality set.
 *
 * ⚠ This is a DISCLOSED PRESENTATION MAPPING, not a certified methodology. The certified
 * platform exposes a numeric quality axis; the P12 contracts require the closed set
 * {good, stale, partial, unavailable}. The mapping is intentionally conservative:
 *   - a null axis is `unavailable` (QP-3: absent quality is NEVER 'good')
 *   - a present axis is `good` ONLY in the sense that the value is present and certified
 *     — it is NOT a freshness claim, because the underlying baseline is a FROZEN SNAPSHOT
 *
 * No silent upgrade occurs: the absent case can only ever move toward worse quality.
 */
export function mapCertifiedQuality(qualityAxis: number | null): string {
  if (qualityAxis === null || qualityAxis === undefined || !Number.isFinite(qualityAxis)) {
    return 'unavailable'; // QP-3
  }
  return 'good';
}

/** Completeness derived from which certified axes are actually present (never assumed 100%). */
export function deriveCompleteness(c: CertifiedMatrixCompany): number {
  const axes = [c.composite, c.quality, c.valuation];
  const present = axes.filter((a) => typeof a === 'number' && Number.isFinite(a)).length;
  return Math.round((present / axes.length) * 100);
}

/**
 * Derive C6-screenable rows from the certified matrix payload.
 *
 * Field names are preserved from the certified DTO. `canonicalSecurityId` is the
 * certified `companyId` — it is NOT a provider identifier and NOT a newly minted ID.
 */
export function deriveScreenerUniverse(payload: CertifiedMatrixPayload, asOf: string): readonly GovernedRow[] {
  return Object.freeze(
    payload.companies.map((c) =>
      Object.freeze({
        canonicalSecurityId: c.companyId,
        companyId: c.companyId,
        sector: c.sector,
        verdict: c.verdict,
        composite: c.composite,
        // Certified axes preserved 1:1; null stays null (never coerced to 0).
        qualityAxis: c.quality,
        valuation: c.valuation,
        // P12 governed quality facts (closed set) — derived, disclosed above.
        quality: mapCertifiedQuality(c.quality),
        completenessPct: deriveCompleteness(c),
        asOf,
      }),
    ),
  );
}

/** Derive C7-searchable objects from the same certified payload. */
export function deriveSearchUniverse(payload: CertifiedMatrixPayload, asOf: string): readonly GovernedRow[] {
  return Object.freeze(
    payload.companies.map((c) =>
      Object.freeze({
        objectType: 'company',
        id: c.companyId,
        canonicalSecurityId: c.companyId,
        name: c.sector,
        symbol: c.companyId,
        sector: c.sector,
        quality: mapCertifiedQuality(c.quality),
        completenessPct: deriveCompleteness(c),
        asOf,
      }),
    ),
  );
}

/** Derive C7-resolvable securities. Identifiers are only those the certified payload carries. */
export function deriveSecurities(payload: CertifiedMatrixPayload): readonly GovernedRow[] {
  return Object.freeze(
    payload.companies.map((c) =>
      Object.freeze({
        canonicalSecurityId: c.companyId,
        issuerId: null,
        symbol: c.companyId,
        lifecycleState: 'active',
        // ⚠ No FIGI/ISIN/CUSIP are invented. The certified payload carries none.
        identifiers: Object.freeze({}),
      }),
    ),
  );
}

/**
 * The governed vintage facts for the derived universe.
 *
 * `asOf` is taken from the certified provenance `calibratedAt` when present. The frozen
 * v1.1 Replay Baseline is a SNAPSHOT — mode is reported as SNAPSHOT, never LIVE.
 */
export function deriveVintage(payload: CertifiedMatrixPayload, fallbackAsOf: string): {
  asOf: string;
  dataVersion: string;
  mode: string;
  dataSource: string;
  classification: string;
  contributingSnapshotIds: readonly string[];
} {
  const calibratedAt = payload.provenance?.calibratedAt;
  return {
    asOf: typeof calibratedAt === 'string' && calibratedAt.length > 0 ? calibratedAt : fallbackAsOf,
    dataVersion: 'v1.1-replay-baseline',
    mode: 'SNAPSHOT',
    // DP-3: a governed source descriptor, never a raw provider name.
    dataSource: 'governed:certified-v2.0-reference-universe',
    // The rows are certified ENGINE outputs; the classification says exactly that.
    classification: 'CERTIFIED-ENGINE',
    contributingSnapshotIds: Object.freeze(['program-v1.1-replay-baseline']),
  };
}
