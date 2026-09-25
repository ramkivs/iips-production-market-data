/**
 * IIPS — Research & Sector Intelligence: minimum SNAPSHOT read authorities.
 *
 * Authority: `IIPS_RESEARCH_SECTOR_RECOVERY_MANIFEST.md` (durable Prompt-1 forensic manifest,
 * commit `fcca6697`) §5.2 R-4/R-5/R-6 — the four read authorities consumed by Company
 * Intelligence and Sector Intelligence, implemented as CURRENT-LINEAGE modules.
 *
 * ══ SCOPE (exactly four SNAPSHOT authorities) ═══════════════════════════════════════════════
 *   GET /api/company/:id          → computeCertifiedCompany()          FROZEN SNAPSHOT
 *   GET /api/decision-matrix      → computeCertifiedDecisionMatrix()   FROZEN SNAPSHOT
 *   GET /api/evidence/:id         → computeCertifiedEvidence()         FIXTURE (D79)
 *   GET /api/replay/:id           → computeCertifiedReplay()           FIXTURE (D79)
 *
 *  B1 CROSS-SECTOR RECOVERY (authorized gate): a fifth SNAPSHOT authority is added —
 *   GET /api/cross-sector         → computeCertifiedCrossSector()      FROZEN SNAPSHOT
 *  It is the donor `computeCertifiedCrossSector()` mapping restored VERBATIM (donor lineage
 *  da43051, executive-transport L510–540) over the SAME `computeCertifiedPlatform()` CSIP output.
 *  The donor's per-principal data-mode dispatch is NOT reproduced: SNAPSHOT only, as below.
 *
 * ══ WHAT THIS MODULE IS — AND IS NOT ═════════════════════════════════════════════════════════
 *  This is a NOT a recovery of the donor `frontend/server/executive-transport.ts` (56 KB, twelve
 *  surfaces). That module was explicitly excluded (manifest §5.3 E-1): its transitive closure is
 *  188 files, 61 of them absent from the current lineage, spanning Administration, Collaboration,
 *  Reports, Watchlists, Screener/P12, Macro, Notes, Notifications, Settings, Persistence, the auth
 *  tier and D114/PIT. Nothing of it is imported here.
 *
 *  This module is a set of THIN MAPPERS over the already-recovered `computeCertifiedPlatform()`
 *  (Stage 4). It performs NO engine computation of its own, duplicates NO golden-fixture loading,
 *  and re-derives NO platform value: every figure returned is a 1:1 projection of certified
 *  platform output.
 *
 *  NOT included, by authority: the donor auth tier (no `guardRead`, no RBAC reconstruction, no
 *  Keycloak/OIDC), the PIT vintage branch, D114/D115 components, AI Advisory, Macro/MoSPI,
 *  provider access of any kind, and the Decision Matrix / Evidence / Replay *UI* surfaces. Only
 *  the read authorities the two in-scope surfaces depend on are exposed.
 *
 * ══ DOCUMENTED DEVIATION FROM THE DONOR MAPPERS (removes a fabrication) ═════════════════════
 *  One donor behaviour was deliberately NOT carried over, because it invented a value the
 *  certified source does not contain. Asserted by test:
 *   · Evidence `keyMetrics`: the donor emitted `value: typeof value === 'number' ? value : 0`
 *     for EVERY governed input key, coercing the frozen baseline's string descriptors (`id`,
 *     `businessModel`, `regulatoryPosture`, `segment`, `subsegment`, `archetype`,
 *     `commodityExposure`) into fabricated zero-valued "metrics" — e.g. `{ id: 'id', value: 0 }`.
 *     Only genuinely numeric governed inputs are emitted as metrics here.
 *  No other behaviour deviates: every remaining field is a 1:1 projection of
 *  `computeCertifiedPlatform()`, and the two D79 attribution strings are byte-identical to the
 *  donor's (verified by test). This deviation is flagged for review in the accompanying report.
 *
 * ══ PROVENANCE (documented, per authority — manifest §3) ═════════════════════════════════════
 *   company, decision-matrix : FROZEN SNAPSHOT — certified v2.0 platform over the frozen v1.1
 *                              Replay Baseline (`63bcd350f2cda2b0337097c25236fd8dbe82d87b`).
 *   evidence, replay         : FIXTURE — D79 transport fixture constants. `reproduced` and
 *                              `byteIdentical` are HARDCODED and are NOT produced by a runtime
 *                              ReplayService or EvidencePipeline verification. The donor's own
 *                              D79 act corrected this attribution; the corrected wording is
 *                              carried VERBATIM below and is asserted by test. AD-17 / M-2
 *                              remain UNRESOLVED and no verification is claimed.
 *
 * ══ DATA MODE ════════════════════════════════════════════════════════════════════════════════
 *  SNAPSHOT ONLY. `asOf` is data selection under PIT, never a mode authority; under SNAPSHOT it
 *  is REFUSED with 400 rather than silently ignored — mirroring the donor's own
 *  `validateAsOfRequest` semantics VERBATIM. No mode can be supplied by the client, and no
 *  fallback or substitution ever occurs. There is no PIT code path in this module.
 *
 * ══ NON-PRODUCTION / NO AUTHENTICATION ═══════════════════════════════════════════════════════
 *  This transport performs NO authentication and NO authorization. It must NOT be exposed beyond
 *  a local, non-production development boundary, and it must not be treated as a certified or
 *  production surface. The donated authorities were `guardRead`-protected; that tier is
 *  deliberately NOT reconstructed here (no bypass is created either — there is simply no auth).
 *  `createResearchSectorServer()` serves on loopback intent only; callers own the boundary.
 */
import http from 'node:http';
import { computeCertifiedPlatform } from '../../src/transports/executive_transport.js';
// GROUP 1 / GATE 2 ENGINE REGISTRY (read-only wiring): 13 registered engines after Gate B adoption
// (iips-review-recovered @ 286f3da, E2E-030 10-ENGINE LTS scope; recovered to B1 by Gate 1 e1fa323).
// ONLY listEngines() is used. EngineApiAdapter.execute() is dormant donor code:
// PRESENT / NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.
import { EngineApiAdapter } from '../../iips-platform/src/integration/EngineApiAdapter.js';

/** The frozen certified instant used by the certified baseline payloads. */
const CERTIFIED_CALIBRATED_AT = '2026-08-09T00:00:00.000Z';

/** Verbatim D79 (L-3) attribution for the replay authority. Asserted by test. */
export const REPLAY_PROVENANCE_DATA_SOURCE =
  'transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime ReplayService verification';

/** Verbatim D79 (L-3) attribution for the evidence authority. Asserted by test. */
export const EVIDENCE_PROVENANCE_DATA_SOURCE =
  'transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime replay or EvidencePipeline verification';

/** Verbatim donor refusal text when `asOf` is supplied outside the PIT mode. */
export const ASOF_REFUSED_UNDER_SNAPSHOT =
  'asOf is only valid under the PIT data mode; the effective data mode is SNAPSHOT. asOf is data selection, never a mode authority — the request is refused rather than silently ignored.';

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Certified platform projection
 * ───────────────────────────────────────────────────────────────────────────────────────── */

interface EngineDetail {
  sector: string;
  verdict: string;
  composite: number;
  overrides: readonly string[];
  pillars: Record<string, number> | null;
  resolvedSubsegment?: string;
  resolvedArchetype?: string;
  calibrationVersion?: string;
  inputs: Record<string, unknown>;
}

/**
 * Index the certified platform once per call.
 *
 * `engineOutputs` carries the SAME golden-derived figures the donor read from its private
 * `GOLDEN_PILLARS` map: `confidence` and `valuationScore` come from the certified golden
 * expected-outputs, and `qualityScore` from the governed CSIP quality mapping. Projecting them
 * from the platform (rather than re-loading the fixtures here) is what keeps this module free of
 * duplicated platform computation. Equivalence is asserted by the accompanying test suite
 * against the frozen fixtures read independently.
 */
function certifiedProjection(): {
  engineDetails: Record<string, EngineDetail>;
  bySector: Map<string, { sector: string; confidence: number | null; qualityScore: number | null; valuationScore: number | null }>;
  csip: { intelligence: { avgConviction: number; avgQuality: number; holdings: number } };
} {
  const platform = computeCertifiedPlatform();
  const bySector = new Map(
    (platform.engineOutputs as ReadonlyArray<{
      sector: string;
      confidence: number | null;
      qualityScore: number | null;
      valuationScore: number | null;
    }>).map((o) => [o.sector, o]),
  );
  return {
    engineDetails: platform.engineDetails as Record<string, EngineDetail>,
    bySector,
    csip: platform.csip as { intelligence: { avgConviction: number; avgQuality: number; holdings: number } },
  };
}

/** Resolve a sector id case-insensitively, exactly as the donor mapper did. */
function resolveSector(engineDetails: Record<string, EngineDetail>, sectorId: string): string {
  const key = Object.keys(engineDetails).find((k) => k.toLowerCase() === sectorId.toLowerCase());
  if (!key) throw new Error(`company not found: ${sectorId}`);
  return key;
}

const SNAPSHOT_PROVENANCE = (dataSource: string) => ({
  dataSource,
  freshness: 'SNAPSHOT' as const,
  calibratedAt: CERTIFIED_CALIBRATED_AT,
  transportSemantics: '1:1 mapping; transport transformation != decision transformation',
});

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Authority 1 — GET /api/company/:id  (FROZEN SNAPSHOT)
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface CertifiedCompanyPayload {
  readonly companyId: string;
  readonly sector: string;
  readonly decision: { readonly verdict: string; readonly composite: number; readonly confidence: number | null };
  readonly overrides: readonly string[];
  readonly pillars: Readonly<Record<string, number>> | null;
  readonly resolvedSubsegment: string | null;
  readonly resolvedArchetype: string | null;
  readonly calibrationVersion: string | null;
  readonly inputs: readonly { readonly key: string; readonly value: unknown }[];
  readonly evidence: {
    readonly evidenceId: string;
    readonly engineId: string;
    readonly recommendation: string;
    readonly compositeScore: number;
  };
  readonly provenance: ReturnType<typeof SNAPSHOT_PROVENANCE>;
}

export function computeCertifiedCompany(sectorId: string): CertifiedCompanyPayload {
  const { engineDetails, bySector } = certifiedProjection();
  const key = resolveSector(engineDetails, sectorId);
  const d = engineDetails[key]!;
  return {
    companyId: `${d.sector}-H1`,
    sector: d.sector,
    decision: {
      verdict: d.verdict,
      composite: d.composite,
      // Certified golden confidence, else null — never fabricated.
      confidence: bySector.get(key)?.confidence ?? null,
    },
    overrides: d.overrides ?? [],
    // Pillars only where the certified engine exposes them (Technology); else null.
    pillars: d.pillars,
    resolvedSubsegment: d.resolvedSubsegment ?? null,
    resolvedArchetype: d.resolvedArchetype ?? null,
    calibrationVersion: d.calibrationVersion ?? null,
    inputs: Object.entries(d.inputs).map(([key2, value]) => ({ key: key2, value })),
    evidence: {
      evidenceId: `ev_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      recommendation: d.verdict,
      compositeScore: d.composite,
    },
    provenance: SNAPSHOT_PROVENANCE(
      'certified v2.0 platform (frozen sector engine) over frozen v1.1 Replay Baseline inputs',
    ),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Authority 2 — GET /api/decision-matrix  (FROZEN SNAPSHOT)
 *
 * Read authority ONLY. No Decision Matrix UI is recovered, mounted or referenced: this returns
 * certified axis scores and the UI is left to position them. The certified platform exposes no
 * quadrant/band classification, so none is invented here.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface CertifiedDecisionMatrixPayload {
  readonly matrixType: 'scatter';
  readonly note: string;
  readonly companies: readonly {
    readonly companyId: string;
    readonly sector: string;
    readonly verdict: string;
    readonly composite: number;
    readonly quality: number | null;
    readonly valuation: number | null;
  }[];
  readonly universe: { readonly avgConviction: number; readonly avgQuality: number; readonly holdings: number };
  readonly provenance: ReturnType<typeof SNAPSHOT_PROVENANCE>;
}

export function computeCertifiedDecisionMatrix(): CertifiedDecisionMatrixPayload {
  const { engineDetails, bySector, csip } = certifiedProjection();
  const companies = Object.values(engineDetails).map((d) => {
    const o = bySector.get(d.sector);
    return {
      companyId: `${d.sector}-H1`,
      sector: d.sector,
      verdict: d.verdict,
      composite: d.composite,
      quality: o?.qualityScore ?? null, // governed CSIP quality mapping (OntologyMapper), or null
      valuation: o?.valuationScore ?? null, // certified valuation axis, or null where not exposed
    };
  });
  return {
    matrixType: 'scatter',
    note: 'Business Quality and Valuation are certified per-company axis scores. The platform does not expose a certified quadrant/band classification; the UI positions these scores without computing bands, quadrants, or thresholds.',
    companies,
    universe: {
      avgConviction: csip.intelligence.avgConviction,
      avgQuality: csip.intelligence.avgQuality,
      holdings: csip.intelligence.holdings,
    },
    provenance: SNAPSHOT_PROVENANCE(
      'certified v2.0 platform (CSIP NormalizedHolding quality/valuation + certified engine outputs) over frozen v1.1 Replay Baseline inputs',
    ),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Authority 3 — GET /api/evidence/:id  (FIXTURE — D79)
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface CertifiedEvidencePayload {
  readonly decision: { readonly verdict: string; readonly composite: number; readonly confidence: number | null };
  readonly evidence: {
    readonly evidenceId: string;
    readonly engineId: string;
    readonly recommendation: string;
    readonly compositeScore: number;
    readonly confidence: number | null;
    readonly keyMetrics: readonly { readonly id: string; readonly name: string; readonly value: number }[];
    readonly supportingScores: readonly { readonly id: string; readonly name: string; readonly value: number }[];
    readonly calibrationVersion: string;
    readonly decisionRulesApplied: readonly string[];
    readonly replayReference: string;
    readonly provenance: {
      readonly frameworkVersion: string;
      readonly engineVersion: string;
      readonly methodologyVersion: string;
      readonly snapshotId: string;
    };
    readonly generatedAt: string;
  };
  readonly snapshot: {
    readonly snapshotId: string;
    readonly engineId: string;
    readonly schemaVersion: string;
    readonly generatedAt: string;
    readonly verdict: string;
    readonly scores: Readonly<Record<string, number>>;
  };
  readonly replay: {
    readonly snapshotId: string;
    readonly reproduced: true;
    readonly byteIdentical: true;
    readonly evidenceRefs: readonly string[];
  };
  readonly provenance: ReturnType<typeof SNAPSHOT_PROVENANCE>;
}

export function computeCertifiedEvidence(sectorId: string): CertifiedEvidencePayload {
  const { engineDetails, bySector } = certifiedProjection();
  const key = resolveSector(engineDetails, sectorId);
  const d = engineDetails[key]!;
  const confidence = bySector.get(key)?.confidence ?? null;
  const supportingScores = d.pillars
    ? Object.entries(d.pillars).map(([id, value]) => ({ id, name: id, value }))
    : [];
  // DELIBERATE DEVIATION FROM THE DONOR (documented, no fabrication):
  // the donor mapper emitted `value: typeof value === 'number' ? value : 0` for EVERY input key,
  // which coerced the frozen baseline's non-numeric descriptors (`id`, `businessModel`,
  // `regulatoryPosture`, `segment`, `subsegment`, `archetype`, `commodityExposure`) into
  // fabricated zero-valued "metrics" — e.g. `{ id: 'id', name: 'id', value: 0 }`. A metric that
  // does not exist must not be invented, and a descriptor is not a metric. Only genuinely
  // numeric governed inputs are emitted as keyMetrics; the descriptors are simply not metrics and
  // are not restated here (they remain available verbatim in the certified engine detail).
  const keyMetrics = Object.entries(d.inputs)
    .filter(([, value]) => typeof value === 'number')
    .map(([id, value]) => ({ id, name: id, value: value as number }));
  return {
    decision: { verdict: d.verdict, composite: d.composite, confidence },
    evidence: {
      evidenceId: `ev_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      recommendation: d.verdict,
      compositeScore: d.composite,
      confidence,
      keyMetrics,
      supportingScores,
      calibrationVersion: d.calibrationVersion ?? '1.0.0',
      decisionRulesApplied: d.overrides ?? [],
      replayReference: `snap_${d.sector}`,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: `IES-${d.sector}`,
        snapshotId: `snap_${d.sector}`,
      },
      generatedAt: CERTIFIED_CALIBRATED_AT,
    },
    snapshot: {
      snapshotId: `snap_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      schemaVersion: 'snapshot-1.0',
      generatedAt: CERTIFIED_CALIBRATED_AT,
      verdict: d.verdict,
      scores: d.pillars ?? {},
    },
    replay: {
      snapshotId: `snap_${d.sector}`,
      reproduced: true,
      byteIdentical: true,
      evidenceRefs: [`ev_${d.sector}`],
    },
    // L-3 (D79): attribution corrected by the donor's own act. The values above are transport
    // fixture constants; NO runtime pipeline verification is claimed. AD-17 / M-2 UNRESOLVED.
    provenance: SNAPSHOT_PROVENANCE(EVIDENCE_PROVENANCE_DATA_SOURCE),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Authority 4 — GET /api/replay/:id  (FIXTURE — D79)
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface CertifiedReplayPayload {
  readonly original: {
    readonly snapshotId: string;
    readonly engineId: string;
    readonly schemaVersion: string;
    readonly calibrationVersion: string;
    readonly generatedAt: string;
    readonly verdict: string;
    readonly composite: number;
    readonly confidence: number | null;
    readonly provenance: {
      readonly frameworkVersion: string;
      readonly engineVersion: string;
      readonly methodologyVersion: string;
      readonly snapshotId: string;
    };
  };
  readonly replay: {
    readonly snapshotId: string;
    readonly reproduced: true;
    readonly byteIdentical: true;
    readonly evidenceRefs: readonly string[];
  };
  readonly differenceAvailable: false;
  readonly note: string;
  readonly evidenceRefs: readonly string[];
  readonly provenance: ReturnType<typeof SNAPSHOT_PROVENANCE>;
}

export function computeCertifiedReplay(sectorId: string): CertifiedReplayPayload {
  const { engineDetails, bySector } = certifiedProjection();
  const key = resolveSector(engineDetails, sectorId);
  const d = engineDetails[key]!;
  return {
    original: {
      snapshotId: `snap_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      schemaVersion: 'snapshot-1.0',
      calibrationVersion: d.calibrationVersion ?? '1.0.0',
      generatedAt: CERTIFIED_CALIBRATED_AT,
      verdict: d.verdict,
      composite: d.composite,
      confidence: bySector.get(key)?.confidence ?? null,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: `IES-${d.sector}`,
        snapshotId: `snap_${d.sector}`,
      },
    },
    replay: {
      snapshotId: `snap_${d.sector}`,
      reproduced: true,
      byteIdentical: true,
      evidenceRefs: [`ev_${d.sector}`],
    },
    differenceAvailable: false,
    note: 'The governed ReplayService exposes reproduced + byteIdentical + evidenceRefs only. No field-level or metric-level difference is computed or displayed.',
    evidenceRefs: [`ev_${d.sector}`],
    // L-3 (D79): attribution corrected by the donor's own act. `computeCertifiedReplay()` does
    // NOT invoke ReplayService — the values are transport-side fixture constants. NO verification
    // is claimed. AD-17 / M-2 remain UNRESOLVED.
    provenance: SNAPSHOT_PROVENANCE(REPLAY_PROVENANCE_DATA_SOURCE),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * B1 Cross-Sector (CSIP) authority — donor mapping restored VERBATIM
 * ───────────────────────────────────────────────────────────────────────────────────────── */

/** Cross-sector DTO (Phase 8) — governed CSIP surface only. */
export function computeCertifiedCrossSector(): unknown {
  const { engineOutputs, csip: pr } = computeCertifiedPlatform();
  // All values are certified CSIP outputs or certified engine outputs; 1:1 mapping.
  return {
    portfolio: {
      portfolioId: pr.intelligence.portfolioId,
      scenario: pr.intelligence.scenario,
      holdings: pr.intelligence.holdings,
      avgConviction: pr.intelligence.avgConviction,
      avgQuality: pr.intelligence.avgQuality,
      avgRisk: pr.intelligence.avgRisk,
      concentration: pr.intelligence.concentration,
      diversificationScore: pr.intelligence.diversificationScore,
    },
    diversification: { band: pr.diversification.diversificationBand, flags: pr.diversification.flags },
    ranking: pr.ranking.map((r: any) => ({ companyId: r.companyId, sector: r.sector, conviction: r.conviction })),
    opportunity: pr.opportunity.top.map((o: any) => ({ companyId: o.companyId, sector: o.sector, conviction: o.conviction })),
    correlation: { flags: pr.correlation.flags, concentrationSectors: pr.correlation.concentrationSectors },
    decisions: engineOutputs.map((o) => ({
      sector: o.sector,
      verdict: o.verdict,
      composite: o.composite,
      confidence: o.confidence,
    })),
    provenance: {
      dataSource: 'certified v2.0 platform (CSIP cross-sector engine) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * SNAPSHOT-only request handling
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface ResearchSectorResult {
  readonly status: 200 | 400 | 404 | 405;
  readonly body: unknown;
}

const COMPANY_PREFIX = '/api/company/';
const EVIDENCE_PREFIX = '/api/evidence/';
const REPLAY_PREFIX = '/api/replay/';

function notFound(): ResearchSectorResult {
  return Object.freeze({ status: 404 as const, body: Object.freeze({ error: 'not found' }) });
}

/**
 * Classify the query string. `asOf` under SNAPSHOT is refused (400) exactly as the donor
 * refused it — never silently ignored — and an unknown parameter is refused too, because an
 * unrecognised selector must not be discarded.
 */
function checkQuery(query: string): ResearchSectorResult | null {
  if (query.length === 0) return null;
  const params = new URLSearchParams(query);
  if (params.getAll('asOf').length > 0) {
    // SNAPSHOT-only authority: asOf belongs to PIT and is refused, never silently dropped.
    return Object.freeze({ status: 400 as const, body: Object.freeze({ error: ASOF_REFUSED_UNDER_SNAPSHOT }) });
  }
  const other = [...params.keys()].filter((k) => k !== 'asOf');
  if (other.length > 0) {
    return Object.freeze({
      status: 400 as const,
      body: Object.freeze({ error: `unsupported query parameter(s): ${other.join(', ')} — SNAPSHOT authorities accept no selection parameters` }),
    });
  }
  return null;
}

/** Parse a `/api/<prefix>` path: exactly one non-empty decoded id, no embedded slash. */
function parseSectorTarget(path: string, prefix: string): { ok: true; id: string } | { ok: false; result: ResearchSectorResult } {
  const rawId = path.slice(prefix.length);
  let id: string;
  try {
    id = decodeURIComponent(rawId);
  } catch (e) {
    return { ok: false, result: Object.freeze({ status: 404 as const, body: Object.freeze({ error: String(e) }) }) };
  }
  if (id.length === 0 || id.includes('/')) {
    return { ok: false, result: Object.freeze({ status: 404 as const, body: Object.freeze({ error: 'sector id is required' }) }) };
  }
  return { ok: true, id };
}

/**
 * Execute exactly one Research/Sector SNAPSHOT authority request.
 *
 * Pure and side-effect free apart from reading the frozen certified fixtures. Returns the HTTP
 * status and body to write; the caller owns the HTTP boundary. Unknown ids and malformed targets
 * FAIL CLOSED (404/400) — nothing is invented, defaulted or substituted.
 */
export function handleResearchSectorRequest(requestUrl: string, requestMethod?: string): ResearchSectorResult {
  if ((requestMethod ?? 'GET').toUpperCase() !== 'GET') {
    return Object.freeze({ status: 405 as const, body: Object.freeze({ error: 'method-not-allowed', allowed: 'GET' }) });
  }

  const qIndex = requestUrl.indexOf('?');
  const path = qIndex === -1 ? requestUrl : requestUrl.slice(0, qIndex);
  const query = qIndex === -1 ? '' : requestUrl.slice(qIndex + 1);
  const queryRefusal = checkQuery(query);
  if (queryRefusal) return queryRefusal;

  try {
    if (path === '/api/decision-matrix') {
      return Object.freeze({ status: 200 as const, body: computeCertifiedDecisionMatrix() });
    }
    if (path === '/api/cross-sector') {
      return Object.freeze({ status: 200 as const, body: computeCertifiedCrossSector() });
    }
    // GROUP 1 / GATE 2: GET /api/engines — the recovered certified registry, serialized as-is
    // (donor semantics: `engineApi.listEngines()`). GET only: every other method is refused 405
    // above; no /api/engines/:id/execute route exists (falls through to 404). B1 does NOT inherit
    // E2E-030 certification — this is wiring only.
    if (path === '/api/engines') {
      return Object.freeze({ status: 200 as const, body: new EngineApiAdapter().listEngines() });
    }
    if (path.startsWith(COMPANY_PREFIX)) {
      const t = parseSectorTarget(path, COMPANY_PREFIX);
      if (!t.ok) return t.result;
      return Object.freeze({ status: 200 as const, body: computeCertifiedCompany(t.id) });
    }
    if (path.startsWith(EVIDENCE_PREFIX)) {
      const t = parseSectorTarget(path, EVIDENCE_PREFIX);
      if (!t.ok) return t.result;
      return Object.freeze({ status: 200 as const, body: computeCertifiedEvidence(t.id) });
    }
    if (path.startsWith(REPLAY_PREFIX)) {
      const t = parseSectorTarget(path, REPLAY_PREFIX);
      if (!t.ok) return t.result;
      return Object.freeze({ status: 200 as const, body: computeCertifiedReplay(t.id) });
    }
    return notFound();
  } catch (e) {
    // Unknown/unresolvable sector, or a certified-platform failure → fail closed, invent nothing.
    return Object.freeze({ status: 404 as const, body: Object.freeze({ error: String(e) }) });
  }
}

/**
 * Minimal NON-PRODUCTION HTTP host for the four SNAPSHOT authorities.
 *
 * Explicitly: no authentication, no authorization, no credentials, no provider access. It exists
 * so the browser can reach certified data over HTTP (browser code must never import node-only
 * modules — manifest §4.3/§5.3 E-8). Bind it locally only; it is not a certified or production
 * surface and claims no certification.
 */
export function createResearchSectorServer(port = 8788): http.Server {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-IIPS-Surface', 'research-sector-snapshot-authorities');
    res.setHeader('X-IIPS-Authentication', 'NONE (non-production, unauthenticated development transport)');
    res.setHeader('X-IIPS-Certification', 'NONE CLAIMED');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', transport: 'research-sector snapshot authorities', authentication: 'none' }));
      return;
    }

    const result = handleResearchSectorRequest(req.url ?? '/', req.method);
    res.writeHead(result.status);
    res.end(JSON.stringify(result.status === 200 ? result.body : result.body));
  });

  return server;
}
