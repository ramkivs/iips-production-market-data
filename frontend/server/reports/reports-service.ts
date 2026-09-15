/**
 * UI08 REPORTS — governed report generation, PIT pinning and durable storage.
 *
 * Authority: D82-R1 decision A (bounded UI08 recovery), under the legacy-D82 recovery
 * adjudication and the D84 obligation audit. Durability pattern per D80-C1 / D81-C1.
 *
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-012** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI08 Reports — EXTEND":
 *                tracker treatment = REUSE UI / INTEGRATE DATA; disposition = EXTEND
 *                required delta    = reuse `PortfolioReport`; templates + generation UI + PIT
 *                validation        = historical/PIT reproducibility; lineage; source/timestamp
 *                phase/gate        = P08 + P13 (NO P10 dependency → NOT R-2 blocked)
 *
 * ⚠ "Embedded in UI01" was NOT the UI08 implementation. INT-012 records "No Reports UI", and
 *   `PortfolioReport`/`ReportingEngine` had ZERO references in frontend/server or frontend/src.
 *
 * ══ PIT REPRODUCIBILITY — EXACT SCOPE (D82 §9-15) ══════════════════════════════════════════
 *
 *   DELIVERED:
 *     1. Pin-and-store. The COMPLETE generated payload is persisted together with its pinned
 *        `dataVersion`, `asOf` and `mode`. Re-opening a stored report returns BYTE-IDENTICAL
 *        content — proven by canonical-JSON hash, not asserted.
 *     2. Same-vintage regeneration. `ReportingEngine.build()` is a PURE function (no clock, no
 *        randomness; `reportId` derives from reportType+portfolioId), so regenerating from the
 *        SAME frozen vintage reproduces byte-identically.
 *
 *   ⚠ NOT DELIVERED, AND NOT CLAIMED:
 *     Regeneration for an ARBITRARY PAST as-of. Only one governed vintage exists (the frozen
 *     v1.1 replay baseline); historical governed vintages are absent pending R-2. Producing a
 *     "past as-of" report would require FABRICATING a historical vintage — prohibited. This
 *     limitation is disclosed in the API payload and rendered on the surface.
 *
 *     `buildReportView` (accepted P13) sets `pitReproducible: true`. That field is consumed
 *     UNMODIFIED and is deliberately NOT amplified into a claim of arbitrary historical
 *     regeneration. It means "this report pins its vintage", not "any past date can be rebuilt".
 *
 * PATTERN
 *   Mirrors D75 saved-screens, D80 settings and D81 watchlists: a dedicated `PersistenceService`
 *   instance over its own data subdir, append-only events folded into current state, tenant and
 *   owner supplied by the caller from the authenticated principal.
 *   `persistence-service.ts` is NOT modified.
 */
import path from 'node:path';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';

export const REPORTS_DATA_SUBDIR = 'reports';

/** Dedup namespace so report events never collide with another consumer's records. */
const EVENT_PREFIX = 'report-event\u0000';

/**
 * Templates are LIMITED to the reportTypes the existing platform `ReportingEngine` already
 * produces (D82 §3). No new report type is invented.
 */
export const REPORT_TYPES = Object.freeze([
  'Executive',
  'Investment Committee',
  'Portfolio Summary',
  'Allocation Recommendation',
  'Sector Dashboard',
] as const);
export type ReportType = (typeof REPORT_TYPES)[number];

/** The pinned vintage that makes a stored report point-in-time interpretable (ES-1). */
export interface PitPinning {
  readonly dataVersion: string;
  readonly asOf: string;
  readonly mode: string;
}

/** Lineage recorded for every stored figure (INT-012 "lineage; source/timestamp"). */
export interface ReportLineage {
  readonly dataSource: string;
  readonly classification: string;
  readonly contributingSnapshotIds: readonly string[];
  /** When the report was generated. Distinct from `asOf`, which is the DATA observation time. */
  readonly generatedAt: string;
}

export interface StoredReport {
  readonly reportId: string;
  readonly reportType: ReportType;
  readonly portfolioId: string;
  /** The COMPLETE generated payload, stored verbatim and never re-derived on read. */
  readonly payload: Readonly<Record<string, unknown>>;
  readonly pitPinning: PitPinning;
  readonly lineage: ReportLineage;
  /** Canonical-JSON hash of the payload — the byte-identity proof for re-opening. */
  readonly payloadHash: string;
}

type EventKind = 'report-generated' | 'report-deleted';

interface ReportEvent {
  readonly kind: EventKind;
  readonly reportId: string;
  readonly report?: StoredReport;
  readonly at: string;
}

/** Raised on invalid input. The caller maps this to 400/404 — never coerced. */
export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportValidationError';
  }
}

let persistence: PersistenceService | null = null;

export function resolveReportsDataDir(): string {
  return path.join(resolveDataDir(), REPORTS_DATA_SUBDIR);
}

/** The UI08 PF-1 handle — a SEPARATE PersistenceService instance, mirroring the other surfaces. */
export function getReportsPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveReportsDataDir() });
  return persistence;
}

export function resetReportsPersistence(): void {
  persistence = null;
}

/**
 * Deterministic canonical JSON: object keys sorted recursively, so an identical logical payload
 * always serializes to identical bytes regardless of property insertion order.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/** FNV-1a over the canonical JSON. Deterministic, dependency-free, and clock-independent. */
export function payloadHash(value: unknown): string {
  const s = canonicalJson(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv1a-${h.toString(16).padStart(8, '0')}`;
}

function isEvent(r: PersistedRecord): boolean {
  return typeof r.dedupKey === 'string' && r.dedupKey.startsWith(EVENT_PREFIX);
}

/** Fold the append-only event log into current state, deterministically by `seq`. */
function fold(store: PersistenceService, tenantId: string, ownerUserId: string): Map<string, StoredReport> {
  const ordered = [...store.listOrdered(tenantId, ownerUserId).filter(isEvent)].sort((a, b) => a.seq - b.seq);
  const reports = new Map<string, StoredReport>();
  for (const r of ordered) {
    const e = r.payload as ReportEvent;
    if (e.kind === 'report-generated' && e.report) reports.set(e.reportId, e.report);
    else if (e.kind === 'report-deleted') reports.delete(e.reportId);
  }
  return reports;
}

function appendEvent(
  store: PersistenceService,
  tenantId: string,
  ownerUserId: string,
  event: ReportEvent,
): void {
  const seqHint = store.listOrdered(tenantId, ownerUserId).filter(isEvent).length + 1;
  store.append({
    tenantId,
    ownerUserId,
    dedupKey: `${EVENT_PREFIX}${seqHint}\u0000${event.kind}\u0000${event.reportId}`,
    payload: event,
  });
}

export function isReportType(v: unknown): v is ReportType {
  return typeof v === 'string' && (REPORT_TYPES as readonly string[]).includes(v);
}

// ── Commands ────────────────────────────────────────────────────────────────────────────────

export function listReports(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getReportsPersistence(),
): readonly StoredReport[] {
  return Object.freeze([...fold(store, tenantId, ownerUserId).values()]);
}

export function readReport(
  tenantId: string,
  ownerUserId: string,
  reportId: string,
  store: PersistenceService = getReportsPersistence(),
): StoredReport | undefined {
  return fold(store, tenantId, ownerUserId).get(reportId);
}

/**
 * Store a generated report with its pinned vintage and lineage.
 *
 * `generated` MUST be the output of the platform `ReportingEngine.build()`, supplied by the
 * caller. This module never assembles report content of its own and never invents figures.
 */
export function storeReport(
  tenantId: string,
  ownerUserId: string,
  generated: { reportId: string; reportType: string; portfolioId: string; payload: Readonly<Record<string, unknown>> },
  pitPinning: PitPinning,
  lineage: ReportLineage,
  store: PersistenceService = getReportsPersistence(),
  now: string = new Date().toISOString(),
): StoredReport {
  if (!isReportType(generated.reportType)) throw new ReportValidationError('invalid-reportType');

  const report: StoredReport = Object.freeze({
    // Stored reports are distinguished by their pinned vintage as well as identity, so a report
    // regenerated against a different vintage does not silently overwrite an earlier one.
    reportId: `${generated.reportId}@${pitPinning.asOf}`,
    reportType: generated.reportType,
    portfolioId: generated.portfolioId,
    payload: Object.freeze({ ...generated.payload }),
    pitPinning: Object.freeze({ ...pitPinning }),
    lineage: Object.freeze({ ...lineage, generatedAt: lineage.generatedAt || now }),
    payloadHash: payloadHash(generated.payload),
  });

  appendEvent(store, tenantId, ownerUserId, { kind: 'report-generated', reportId: report.reportId, report, at: now });
  return report;
}

export function deleteReport(
  tenantId: string,
  ownerUserId: string,
  reportId: string,
  store: PersistenceService = getReportsPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  if (!fold(store, tenantId, ownerUserId).has(reportId)) return false;
  appendEvent(store, tenantId, ownerUserId, { kind: 'report-deleted', reportId, at: now });
  return true;
}

/**
 * Verify a stored report still matches its recorded hash — the byte-identity check for
 * re-opening. Returns false if stored content ever diverged from what was generated.
 */
export function verifyStoredIntegrity(report: StoredReport): boolean {
  return payloadHash(report.payload) === report.payloadHash;
}

/**
 * Compare a freshly regenerated payload against a stored report.
 *
 * `sameVintage` is true only when the regeneration used the SAME pinned vintage; byte-identity
 * is asserted ONLY in that case. A different vintage is reported as `not-comparable` rather than
 * as a failure — it is a different point in time, not a reproducibility defect.
 */
export function compareRegeneration(
  stored: StoredReport,
  regeneratedPayload: Readonly<Record<string, unknown>>,
  regeneratedPinning: PitPinning,
): { readonly sameVintage: boolean; readonly byteIdentical: boolean | null; readonly reason: string } {
  const sameVintage =
    stored.pitPinning.asOf === regeneratedPinning.asOf &&
    stored.pitPinning.dataVersion === regeneratedPinning.dataVersion &&
    stored.pitPinning.mode === regeneratedPinning.mode;

  if (!sameVintage) {
    return Object.freeze({
      sameVintage: false,
      byteIdentical: null,
      reason: 'different governed vintage — not comparable; historical as-of regeneration is unavailable',
    });
  }
  return Object.freeze({
    sameVintage: true,
    byteIdentical: payloadHash(regeneratedPayload) === stored.payloadHash,
    reason: 'regenerated from the same pinned vintage',
  });
}

/** The standing UI08 PIT limitation, carried on every response and rendered on the surface. */
export const PIT_LIMITATION = Object.freeze({
  pinAndStore: 'Stored reports pin dataVersion/asOf/mode and re-open byte-identically (hash-verified).',
  sameVintageRegeneration: 'Regeneration from the same pinned vintage is byte-identical.',
  historicalAsOf:
    'UNAVAILABLE — only the frozen v1.1 replay baseline vintage exists. Arbitrary historical as-of regeneration requires historical governed vintages (R-2, externally blocked). No historical vintage is fabricated.',
  replayReproducibilityClaimed: false,
});
