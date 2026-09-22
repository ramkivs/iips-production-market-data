/**
 * IIPS — Route map (Phase-1A recovery), derived from the navigation model.
 *
 * Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 * (ref origin/arena/01a0c440) and PRUNED to match the pruned navigation model.
 *
 * Presentation-only route constants. No business logic.
 *
 * PHASE-1A SCOPE: the historical map declared 24 routes including per-sector concrete
 * routes and 8 Administration tabs. Those surfaces are API-coupled (authFetch -> /api/* ->
 * frontend/server/**) and excluded by authority decision, so their route constants are
 * removed rather than retained as dead links. Only `portfolio` is backed by a real
 * implementation (BI-07/BI-08 PortfolioWorkspace, mounted in Phase 1B); the remaining
 * entries resolve to an honest placeholder surface.
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
export const ROUTES = {
  root: '/',
  // Implemented (Phase 1B mount target)
  portfolio: '/portfolio',
  // Declared, not implemented — honest placeholders (AC-12)
  executive: '/executive',
  replay: '/replay',
  securityMaster: '/security-master',
  research: '/research',
  intelligence: '/intelligence',
  evidence: '/evidence',
  admin: '/admin',
  collaboration: '/collaboration',
  reports: '/reports',
  watchlists: '/watchlists',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
