/**
 * IIPS — Route map (Phase-1A recovery; donor structure restored by Phase 5 Option A).
 *
 * Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 * (ref origin/arena/01a0c440) and pruned in Phase 1A to the implemented surfaces.
 *
 * ══ PHASE 5 / OPTION A — DONOR STRUCTURAL ROUTE MODEL RESTORED ═══════════════════════════
 *  Authority act phase5-offline-full-shell-restoration-2026-09-23-001 explicitly restores
 *  the donor Master IIPS route STRUCTURE around the accepted BI-08 integration:
 *
 *    · the 26 donor route paths from the donor App.tsx route tree — including
 *      /callback (OIDC route structure, NOT activation), /search, /screener and
 *      /screener/governed, the research `:id` child templates, the evidence
 *      `:id`/replay templates, and the 8 deep-linkable Administration tabs;
 *    · the two current-base routes with NO donor lineage (/replay, /security-master)
 *      are PRESERVED from the pre-Option-A application (never removed).
 *
 *  STRUCTURE vs FUNCTION: a route constant existing does NOT mean its surface is
 *  functional. Every restored donor route that is API/auth/data-coupled in the donor
 *  lineage (authFetch -> /api/* -> frontend/server/** -> Keycloak) renders an explicit
 *  honest fail-closed state (UnavailableSurface) in this application. The excluded
 *  runtime dependencies are NOT restored. See App.tsx for the per-route binding.
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 *                 + phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
export const ROUTES = {
  root: '/',
  // ── Implemented (Phase 1B mount target — BI-08 authoritative) ────────────────────────
  portfolio: '/portfolio',
  // ── Partial presentation-only surfaces (Phases 1C/2/3/4, Path L) ─────────────────────
  executive: '/executive',
  research: '/research',
  intelligence: '/intelligence',
  evidence: '/evidence',
  // ── Current-base declared surfaces (no donor lineage; honest placeholders) ───────────
  replay: '/replay',
  securityMaster: '/security-master',
  // ── Donor research child route templates (structure only; fail-closed rendering) ─────
  researchCompany: '/research/company/:id',
  researchSector: '/research/sector/:id',
  researchEvents: '/research/events/:id',
  researchCrossSector: '/research/cross-sector',
  // Group 1 / Gate 2: Engine Registry (read-only), 13 registered engines after Gate B adoption.
  researchEngines: '/research/engines',
  // Macro: donor route structure restored; D91/D88 keep it EXCLUDED — no live endpoint.
  researchMacro: '/research/macro',
  // ── Screener routes (UI06 /screener restored F-9; governed/search structural) ─────────
  screener: '/screener',
  screenerGoverned: '/screener/governed',
  search: '/search',
  // ── Donor intelligence children (Decision Matrix route; O/R/R remain future) ─────────
  intelligenceDecisionMatrix: '/intelligence/decision-matrix',
  intelligenceOpportunities: '/intelligence/opportunities',
  intelligenceRisks: '/intelligence/risks',
  intelligenceRankings: '/intelligence/rankings',
  // ── Donor evidence child templates (structure only; no fabricated provenance) ────────
  evidenceDetail: '/evidence/:id',
  evidenceReplay: '/evidence/replay/:id',
  // ── Donor administration: 8 governed tabs (structure only; D115 DEFERRED) ────────────
  admin: '/admin',
  adminOverview: '/admin/overview',
  adminIdentity: '/admin/identity',
  adminTenancy: '/admin/tenancy',
  adminEngines: '/admin/engines',
  adminPlatform: '/admin/platform',
  adminAudit: '/admin/audit',
  adminData: '/admin/data',
  adminOperations: '/admin/operations',
  // ── Donor governed workspace surfaces (structure only; fail-closed rendering) ────────
  collaboration: '/collaboration',
  reports: '/reports',
  watchlists: '/watchlists',
  settings: '/settings',
  // ── Donor OIDC callback route STRUCTURE (identity NOT active; D115 deferred) ──────────
  callback: '/callback',
} as const;

export type RouteKey = keyof typeof ROUTES;
