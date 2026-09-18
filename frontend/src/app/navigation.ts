/**
 * Program v3.0 — Global navigation model.
 *
 * Role-aware navigation (admin-only surfaces hidden for non-admins). The frontend reflects
 * platform RBAC; it does NOT decide permissions.
 *
 * Milestone N (Integration & Documentation Reconciliation): each surface carries a
 * presentation-only `status` so the UI honestly distinguishes implemented from
 * partial/future surfaces. A navigation entry existing does NOT mean its module is fully
 * implemented — the status field is the honest marker, and it is display-only (never a
 * route, permission, or authorization decision).
 *
 * Milestone N+1 (Navigation & Route Reconciliation): children now match the real
 * implemented surfaces — Administration children are the 8 governed read-only tabs
 * (deep-linkable), the dead `/evidence/snapshots` entry is removed, and future-only
 * children (Sector, Opportunities/Risks/Rankings) are marked `future` so they are never
 * mistaken for implemented capabilities.
 *
 * Milestone N+16 (Navigation & Status Reconciliation): the dead Portfolio "Holdings" child
 * (a route-template placeholder with no dedicated surface) is removed, and the Evidence
 * "Decision Evidence" child now reflects the implemented N+14 Evidence Hub at /evidence.
 *
 * Milestone N+17 (Navigation Dead-Link Elimination): the dead Evidence "Replay" child
 * (route-template /evidence/replay/:id with no concrete sector) is removed — the Evidence
 * Hub (N+14) remains the governed replay entry point — and future-only children are
 * rendered by the Sidebar as non-navigable text with a Future badge (never links).
 */
import type { Role } from '../core/session/session';

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
  { label: 'Executive', path: '/executive', minRole: 'viewer', status: 'implemented' },
  {
    label: 'Portfolio',
    path: '/portfolio',
    minRole: 'viewer',
    status: 'implemented',
    children: [
      { label: 'Overview', path: '/portfolio', minRole: 'viewer', status: 'implemented' },
    ],
  },
  {
    label: 'Research',
    path: '/research',
    minRole: 'viewer',
    status: 'partial',
    children: [
      // N+7 remediation: the Company entry must resolve to a CONCRETE company/sector route,
      // not the literal template "/research/company/:id" (which made React Router treat
      // ":id" as the id and 404). Banking is the frozen reference-baseline sector and the
      // N+6 LIVE-certified concrete route. The route declaration /research/company/:id
      // remains valid for all concrete sector values (unchanged).
      { label: 'Company', path: '/research/company/Banking', minRole: 'viewer', status: 'implemented' },
      // P-4: the Sector entry resolves to a CONCRETE sector route (mirrors the N+7 Company
      // remediation — Banking is the frozen reference-baseline sector). The route declaration
      // /research/sector/:id remains valid for all concrete sector values (unchanged).
      { label: 'Sector', path: '/research/sector/Banking', minRole: 'viewer', status: 'implemented' },
      // P-4 Research Events: concrete route (mirrors the N+7 Company and P-4 Sector
      // remediations — Banking is the frozen reference-baseline sector). The route declaration
      // /research/events/:id remains valid for all concrete sector values (unchanged).
      { label: 'Events', path: '/research/events/Banking', minRole: 'viewer', status: 'implemented' },
      { label: 'Cross-Sector', path: '/research/cross-sector', minRole: 'viewer', status: 'implemented' },
      { label: 'Screener', path: '/screener', minRole: 'viewer', status: 'implemented' },
      // WP-MACRO-03: Macro national-statistics context (concrete route; no :id template).
      { label: 'Macro', path: '/research/macro', minRole: 'viewer', status: 'implemented' },
    ],
  },
  {
    label: 'Intelligence',
    path: '/intelligence',
    minRole: 'viewer',
    status: 'partial',
    children: [
      { label: 'Decision Matrix', path: '/intelligence/decision-matrix', minRole: 'viewer', status: 'implemented' },
      { label: 'Opportunities', path: '/intelligence/opportunities', minRole: 'viewer', status: 'future' },
      { label: 'Risks', path: '/intelligence/risks', minRole: 'viewer', status: 'future' },
      { label: 'Rankings', path: '/intelligence/rankings', minRole: 'viewer', status: 'future' },
    ],
  },
  {
    label: 'Evidence',
    path: '/evidence',
    minRole: 'viewer',
    status: 'partial',
    children: [
      // N+17: the dead Replay route-template child (/evidence/replay/:id) is removed — the
      // N+14 Evidence Hub remains the governed replay entry point for concrete sectors.
      // N+16: /evidence is now the implemented Evidence Hub (N+14) directory entry point.
      { label: 'Decision Evidence', path: '/evidence', minRole: 'viewer', status: 'implemented' },
    ],
  },
  {
    label: 'Administration',
    path: '/admin',
    minRole: 'admin',
    status: 'implemented',
    children: [
      { label: 'Overview', path: '/admin/overview', minRole: 'admin', status: 'implemented' },
      { label: 'Identity & Access', path: '/admin/identity', minRole: 'admin', status: 'implemented' },
      { label: 'Tenants', path: '/admin/tenancy', minRole: 'admin', status: 'implemented' },
      { label: 'Engines & Certification', path: '/admin/engines', minRole: 'admin', status: 'implemented' },
      { label: 'Platform Operations', path: '/admin/platform', minRole: 'admin', status: 'implemented' },
      { label: 'Audit', path: '/admin/audit', minRole: 'admin', status: 'implemented' },
      { label: 'Live Data & Governance', path: '/admin/data', minRole: 'admin', status: 'implemented' },
      { label: 'Migration / Workflow / Marketplace', path: '/admin/operations', minRole: 'admin', status: 'implemented' },
    ],
  },
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
