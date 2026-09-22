/**
 * IIPS — Global navigation model (Phase-1A recovery).
 *
 * Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 * (ref origin/arena/01a0c440, blob f72e3809f6) and PRUNED to the surfaces that actually
 * exist on the BI-authoritative base.
 *
 * Role-aware navigation (admin-only surfaces hidden for non-admins). The frontend reflects
 * platform RBAC; it does NOT decide permissions.
 *
 * ══ HONESTY CONTRACT (preserved from the historical model, AC-12) ════════════════════════
 *  Each surface carries a presentation-only `status` so the UI honestly distinguishes
 *  implemented from future surfaces. A navigation entry existing does NOT mean its module
 *  is implemented — the status field is the honest marker, and it is display-only (never a
 *  route, permission, or authorization decision).
 *
 *  PHASE-1A PRUNING RATIONALE:
 *    The historical model declared Executive, Research, Intelligence, Evidence,
 *    Administration, Collaboration, Reports, Watchlists and Settings as `implemented` or
 *    `partial`. That was true of the historical application, which was served by
 *    frontend/server/** over authFetch -> /api/*. On the BI-authoritative base that server
 *    tier does not exist and is excluded by authority decision, so NONE of those surfaces
 *    has a working implementation here.
 *
 *    Re-declaring them as `implemented` would fabricate functionality. They are therefore
 *    demoted to `future`. Only Portfolio — backed by the certified BI-07/BI-08
 *    PortfolioWorkspace — is `implemented`.
 *
 *    Historical child entries (concrete Banking routes, 8 Administration tabs, etc.) are
 *    removed rather than demoted: retaining deep links to surfaces that cannot render would
 *    be a dead-link regression the historical model itself worked to eliminate (N+1, N+16,
 *    N+17).
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import type { Role } from '../core/session/session.js';

/** Presentation-only honesty marker. `partial` = some sub-surfaces implemented, module-level scope future. */
export type NavStatus = 'implemented' | 'partial' | 'future';

export interface NavItem {
  label: string;
  path: string;
  minRole: Role;
  status?: NavStatus;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  // ── IMPLEMENTED (Phase 1B) ───────────────────────────────────────────────────────────
  // Portfolio is the ONLY surface backed by a real, certified implementation on the
  // BI-authoritative base: the BI-07/BI-08 PortfolioWorkspace (broker ingestion,
  // multi-broker consolidation, content-hash idempotency). It is mounted in Phase 1B.
  {
    label: 'Portfolio',
    path: '/portfolio',
    minRole: 'viewer',
    status: 'implemented',
    children: [
      { label: 'Overview', path: '/portfolio', minRole: 'viewer', status: 'implemented' },
    ],
  },

  // ── FUTURE — declared, NOT implemented (AC-12) ───────────────────────────────────────
  // Every surface below is API-coupled in the historical lineage (authFetch -> /api/* ->
  // frontend/server/**), which Phase 1A excludes. They are rendered by the Sidebar as
  // non-navigable text with a Future badge. A navigation entry is NOT a claim that a
  // product module exists.
  //
  // Replay / Security Master additionally exist as placeholder-only surfaces on the current
  // BI base (App.tsx renders "Surface available via IIPS UI View-Model Registry"), so they
  // are honestly `future` here too — no implementation is claimed.
  //
  // ── PARTIAL (Phase 3, PATH L, presentation-only) ──────────────────────────────────────
  // Executive is implemented as a real presentation surface bound to the existing,
  // already-tested LOCAL view-model `UI02ExecutiveSummaryBuilder` (no network, no api/*,
  // no authFetch, no OIDC/Keycloak, no frontend/server).
  //
  // Declared `partial`, NOT `implemented`. GATE-PHASE-3-EXECUTIVE-PAYLOAD-FORENSIC
  // (checkpoint 5ef8960) returned classification B across ALL THREE mandatory payload
  // domains (MarketDataDTO, EngineScoreOutput, IntelligenceDTO): no governed offline
  // executive payload exists, and the builder has no partial-render path, so the mounted
  // route renders its explicit unavailable state UNCONDITIONALLY. No synthetic payload,
  // fabricated score, or derived provenance is ever substituted. Promotion to
  // `implemented` requires governed payload sources under a later authority gate.
  { label: 'Executive', path: '/executive', minRole: 'viewer', status: 'partial' },
  { label: 'Replay Studio', path: '/replay', minRole: 'viewer', status: 'future' },
  { label: 'Security Master', path: '/security-master', minRole: 'viewer', status: 'future' },
  // ── PARTIAL (Phase 4, PATH L, presentation-only) ──────────────────────────────────────
  // Research is implemented as a real presentation surface bound to the existing,
  // already-tested LOCAL view-model `UI03FundamentalAnalysisBuilder` (no network, no api/*,
  // no authFetch, no OIDC/Keycloak, no frontend/server).
  //
  // IDENTITY DESIGNATION (phase4-research-identity-designation-2026-09-23-001):
  // /research = UI03_FUNDAMENTAL_ANALYSIS — exactly ONE registered surface. UI05/UI06/UI12
  // are NOT designated; UI13 (macro) is EXCLUDED (D91/D88: /api/macro is LIVE-only, no
  // relief granted); the six historical Research child routes remain pruned — single route,
  // zero children.
  //
  // Declared `partial`, NOT `implemented`. GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC (bc6d8ae)
  // gap R-1: zero governed FundamentalsDTO payloads exist repo-wide, and the UI03 builder
  // has no partial-render path, so the mounted route renders its explicit unavailable state
  // UNCONDITIONALLY. No synthetic payload, fixture promotion, or invented provenance is ever
  // substituted. Promotion to `implemented` requires governed payload sources (R-1/R-5/R-6)
  // under a later authority gate.
  { label: 'Research', path: '/research', minRole: 'viewer', status: 'partial' },
  // ── PARTIAL (Phase 1C, PATH L) ───────────────────────────────────────────────────────
  // Intelligence is implemented as a real presentation surface bound to the existing,
  // already-tested LOCAL view-model `UI04DomainIntelligenceBuilder` (no network, no api/*,
  // no authFetch, no OIDC/Keycloak, no frontend/server).
  //
  // It is deliberately declared `partial`, NOT `implemented`. The component renders genuine
  // governed intelligence whenever an IntelligenceDTO is supplied, but the offline execution
  // mode currently has NO governed intelligence payload wired to the route, so the mounted
  // surface renders its explicit empty state. Declaring it `implemented` would overstate the
  // product capability a user actually receives; `partial` is navigable AND honest, and it
  // carries a visible "Partial" badge. Promotion to `implemented` requires a governed
  // offline payload source under a later authority gate.
  { label: 'Intelligence', path: '/intelligence', minRole: 'viewer', status: 'partial' },
  // ── PARTIAL (Phase 2, PATH L, presentation-only) ─────────────────────────────────────
  // Evidence is implemented as a real presentation surface bound to the existing, already
  // tested LOCAL view-model `UI11ProvenanceAuditorBuilder` (no network, no api/*, no
  // authFetch, no OIDC/Keycloak, no frontend/server).
  //
  // Declared `partial`, NOT `implemented`. GATE-PHASE-2-EVIDENCE-PAYLOAD-FORENSIC
  // (8dfd8ec) returned classification B: no governed per-company provenance payload exists
  // (zero artifacts carry BOTH a lineageDigest AND a companyId), so the mounted route
  // renders its explicit unavailable state. No lineage digest is generated. Promotion to
  // `implemented` requires a governed provenance source under a later authority gate.
  { label: 'Evidence', path: '/evidence', minRole: 'viewer', status: 'partial' },
  { label: 'Administration', path: '/admin', minRole: 'admin', status: 'future' },
  { label: 'Collaboration', path: '/collaboration', minRole: 'viewer', status: 'future' },
  { label: 'Reports', path: '/reports', minRole: 'viewer', status: 'future' },
  { label: 'Watchlists', path: '/watchlists', minRole: 'viewer', status: 'future' },
  { label: 'Settings', path: '/settings', minRole: 'viewer', status: 'future' },
];

/** Human-facing label for a nav status (presentation only). */
export const NAV_STATUS_LABEL: Record<NavStatus, string> = {
  implemented: 'Implemented',
  partial: 'Partial',
  future: 'Future',
};

/** Filter nav items visible to a given role. */
export function visibleNav(role: Role): NavItem[] {
  const rank: Record<Role, number> = { viewer: 0, analyst: 1, admin: 2 };
  return NAV.filter((item) => rank[role] >= rank[item.minRole]);
}
