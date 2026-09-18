/**
 * Program v3.0 — Route map (from the navigation model).
 *
 * Presentation-only route definitions. Milestone N+1: aligned with the real surfaces —
 * the dead `/evidence/snapshots` entry is removed and Administration routes match the
 * 8 governed read-only tabs (deep-linkable). No business logic.
 *
 * Milestone N+18 (Route-Map Dead-Metadata Reconciliation): the stale Portfolio
 * "detail"/"holdings" constants are removed — the implemented architecture has no
 * per-holding detail surface (PortfolioWorkspace renders the same workspace for any
 * /portfolio/* path, and N+16 declared Holdings to have no dedicated surface).
 */
export const ROUTES = {
  root: '/',
  executive: '/executive',
  portfolio: '/portfolio',
  research: '/research',
  researchCompany: '/research/company/:id',
  researchSector: '/research/sector/:id',
  researchEvents: '/research/events/:id',
  researchCrossSector: '/research/cross-sector',
  researchMacro: '/research/macro',
  intelligence: '/intelligence',
  intelligenceOpportunities: '/intelligence/opportunities',
  intelligenceRisks: '/intelligence/risks',
  intelligenceRankings: '/intelligence/rankings',
  intelligenceDecisionMatrix: '/intelligence/decision-matrix',
  evidence: '/evidence',
  evidenceDetail: '/evidence/:id',
  evidenceReplay: '/evidence/replay/:id',
  admin: '/admin',
  adminOverview: '/admin/overview',
  adminIdentity: '/admin/identity',
  adminTenancy: '/admin/tenancy',
  adminEngines: '/admin/engines',
  adminPlatform: '/admin/platform',
  adminAudit: '/admin/audit',
  adminData: '/admin/data',
  adminOperations: '/admin/operations',
} as const;
