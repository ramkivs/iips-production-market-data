/**
 * IIPS — Global navigation model (Phase-1A recovery; donor structure restored by Phase 5
 * Option A).
 *
 * Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 * (ref origin/arena/01a0c440, blob f72e3809f6) and PRUNED in Phase 1A to the surfaces
 * that actually exist on the BI-authoritative base.
 *
 * Role-aware navigation (admin-only surfaces hidden for non-admins). The frontend reflects
 * platform RBAC; it does NOT decide permissions.
 *
 * ══ HONESTY CONTRACT (preserved from the historical model, AC-12) ════════════════════════
 *  Each surface carries a presentation-only `status` so the UI honestly distinguishes
 *  implemented from partial/future surfaces. A navigation entry existing does NOT mean its
 *  module is implemented — the status field is the honest marker, and it is display-only
 *  (never a route, permission, or authorization decision).
 *
 * ══ PHASE 5 / OPTION A — DONOR STRUCTURAL NAVIGATION RESTORED ═══════════════════════════
 *  Authority act phase5-offline-full-shell-restoration-2026-09-23-001 explicitly restores
 *  the donor Master IIPS navigation hierarchy (the Phase-1A pruning of routes/nav is
 *  superseded for STRUCTURE, not for functionality):
 *
 *    · Research regains its six donor children (Company / Sector / Events / Cross-Sector /
 *      Screener / Macro) as concrete deep links — the donor's frozen reference sector
 *      "Banking" is used exactly as in the donor model (N+7/P-4 concrete-route contract).
 *    · Intelligence regains its four donor children (Decision Matrix navigable structure;
 *      Opportunities / Risks / Rankings remain `future` — they were future-markers in the
 *      donor model too and have no routes).
 *    · Evidence regains its donor child (Decision Evidence -> the Evidence Hub).
 *    · Administration regains its 8 donor deep-linkable tabs (admin-only, D115 DEFERRED).
 *
 *  NEW STATUS — `unavailable`: STRUCTURALLY PRESENT, FAIL-CLOSED. The donor route exists
 *  and renders an honest offline/unavailable/authorization-required state, but the surface
 *  is NOT functionally available (its donor implementation is API-coupled: authFetch ->
 *  /api/* -> frontend/server/** -> Keycloak, all excluded by authority). This keeps the
 *  distinction the Option A act mandates: STRUCTURALLY PRESENT vs FUNCTIONALLY AVAILABLE.
 *  `unavailable` entries ARE navigable links (unlike `future` markers) because they resolve
 *  to a real route that renders an honest fail-closed state — never a dead link.
 *
 *  Macro is additionally EXCLUDED by D91/D88 (no relief granted): its route renders the
 *  excluded-by-authority state and no macro live endpoint exists.
 *
 *  The four PARTIAL presentation-only surfaces (Executive/UI02, Research/UI03,
 *  Intelligence/UI04, Evidence/UI11) are PRESERVED EXACTLY — not downgraded, not promoted,
 *  not replaced by donor components. /research remains UI03_FUNDAMENTAL_ANALYSIS; the
 *  restored research child routes remain separate from UI03. F-9 designates UI06 only at
 *  `/screener` as a restored, fail-closed `partial` surface; UI05/UI12/UI13 remain
 *  undesignated and are not claimed implemented under UI03.
 *  A4 SCREENER RECOVERY: F-9 no longer owns `/screener` — it mounts the restored donor Screener
 *  (existing /api/decision-matrix universe); UI06 is retained unrouted. Status stays `partial`.
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 *                 + phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import type { Role } from '../core/session/session.js';

/**
 * Presentation-only honesty marker.
 * `partial` = some sub-surfaces implemented, module-level scope future.
 * `unavailable` = structurally present (donor route restored), fail-closed — NOT
 * functionally available offline (Option A).
 */
export type NavStatus = 'implemented' | 'partial' | 'unavailable' | 'future';

export interface NavItem {
  label: string;
  path: string;
  minRole: Role;
  status?: NavStatus;
  children?: NavItem[];
}

export const NAV: NavItem[] = [
  // ── IMPLEMENTED (Phase 1B) ───────────────────────────────────────────────────────────
  // The ONLY fully implemented surface: the certified BI-07/BI-08 PortfolioWorkspace
  // (broker ingestion, multi-broker consolidation, content-hash idempotency).
  {
    label: 'Portfolio',
    path: '/portfolio',
    minRole: 'viewer',
    status: 'implemented',
    children: [
      { label: 'Overview', path: '/portfolio', minRole: 'viewer', status: 'implemented' },
    ],
  },

  // ── PARTIAL (Controlled Recovery Gate) ───────────────────────────────────────────────
  // Executive = Certified Executive Dashboard, genuinely computed by the certified
  // v2.0 platform over frozen Replay Baseline inputs (6 Portfolio Health metrics,
  // 13 ranking rows, 3 Up / 10 Flat trends, 13 decision bars/cards). Reference portfolio snapshot.
  { label: 'Executive', path: '/executive', minRole: 'viewer', status: 'partial' },

  // ── Current-base declared surfaces (no donor lineage) ───────────────────────────────
  { label: 'Replay Studio', path: '/replay', minRole: 'viewer', status: 'future' },

  // ── IMPLEMENTED (F-3) — UI08 Security Master: FUNCTIONAL governed D05 resolution ────
  // Authority act f3-ui08-security-master-functional-2026-09-23-001 (designation F-2 = A).
  // The ONLY top-level surface besides Portfolio with a genuinely functional local data
  // source: the governed D05 broad security master (2,250 canonical entities) via the
  // existing UI08 builder + in-process resolver. Fail-closed identity resolution — no API,
  // no auth, no provider, no D115. Promoted from `future` by that act and by nothing else.
  { label: 'Security Master', path: '/security-master', minRole: 'viewer', status: 'implemented' },

  // ── PARTIAL (Phase 4, PATH L) + donor children restored (Option A) ───────────────────
  // /research = UI03_FUNDAMENTAL_ANALYSIS (phase4-research-identity-designation-2026-09-23-001)
  // — exactly ONE registered surface at /research. The restored donor children remain
  // separate surfaces. F-9 restores UI06 only at /screener as a bound but payload-unavailable
  // `partial` surface; UI05/UI12/UI13 remain undesignated. Concrete "Banking" paths are the
  // donor's frozen reference-sector deep links (N+7/P-4 contract) — carried verbatim.
  // A4 SCREENER RECOVERY: /screener now mounts the restored donor Screener; UI06 is unrouted.
  {
    label: 'Research',
    path: '/research',
    minRole: 'viewer',
    status: 'partial',
    children: [
      // PROMPT 2C: Company and Sector are now FUNCTIONAL governed SNAPSHOT read surfaces
      // (mounted at /research/company/:id and /research/sector/:id, composing the four
      // current-lineage read authorities over HTTP). They are promoted from `unavailable` to
      // `partial` — NOT `implemented`, because AI Advisory remains deferred (not recovered)
      // and their E2E-018 parity is only PARTIALLY verified. Never promoted silently.
      { label: 'Company', path: '/research/company/Banking', minRole: 'viewer', status: 'partial' },
      { label: 'Sector', path: '/research/sector/Banking', minRole: 'viewer', status: 'partial' },
      // A3 Research Events restoration: the donor surface is restored on the existing evidence /
      // replay / decision-matrix authorities -> `partial` (never `implemented`).
      { label: 'Events', path: '/research/events/Banking', minRole: 'viewer', status: 'partial' },
      // B1 Cross-Sector restoration: the donor surface is restored on the existing 8788 SNAPSHOT
      // authority (/api/cross-sector + evidence / replay) -> `partial` (never `implemented`).
      { label: 'Cross-Sector', path: '/research/cross-sector', minRole: 'viewer', status: 'partial' },
      // F-9: UI06 builder/service binding is restored; the absent governed candidate
      // universe keeps the navigable surface honestly `partial`, never `implemented`.
      { label: 'Screener', path: '/screener', minRole: 'viewer', status: 'partial' },
      // D91/D88: macro is EXCLUDED (LIVE-only governance, no relief) — structural route only.
      { label: 'Macro', path: '/research/macro', minRole: 'viewer', status: 'unavailable' },
    ],
  },

  // ── PARTIAL (Phase 1C, PATH L) + donor children restored (Option A) ──────────────────
  // Intelligence = UI04, bound to the local UI04DomainIntelligenceBuilder (preserved).
  {
    label: 'Intelligence',
    path: '/intelligence',
    minRole: 'viewer',
    status: 'partial',
    children: [
      // DECISION MATRIX work item: the donor DecisionMatrix is restored onto the existing
      // /api/decision-matrix SNAPSHOT authority -> 'partial' (never 'implemented': AI Advisory
      // remains deferred — the same rule as Company/Sector Intelligence).
      { label: 'Decision Matrix', path: '/intelligence/decision-matrix', minRole: 'viewer', status: 'partial' },
      // Future markers in the DONOR model too — no routes, no implementation anywhere.
      { label: 'Opportunities', path: '/intelligence/opportunities', minRole: 'viewer', status: 'future' },
      { label: 'Risks', path: '/intelligence/risks', minRole: 'viewer', status: 'future' },
      { label: 'Rankings', path: '/intelligence/rankings', minRole: 'viewer', status: 'future' },
    ],
  },

  // ── PARTIAL (Phase 2, PATH L) + donor child restored (Option A) ──────────────────────
  // A2 EVIDENCE RECOVERY: /evidence now routes the restored donor Evidence Hub (UI11 retained
  // unrouted); the donor child (Decision Evidence -> the Evidence Hub) points at the SAME
  // /evidence route. Status stays 'partial' — replay remains REPORTED, NOT VERIFIED (AD-17).
  {
    label: 'Evidence',
    path: '/evidence',
    minRole: 'viewer',
    status: 'partial',
    children: [
      { label: 'Decision Evidence', path: '/evidence', minRole: 'viewer', status: 'partial' },
    ],
  },

  // ── Donor administration structure (Option A; D115 DEFERRED) ─────────────────────────
  // The 8 donor tabs are restored as deep-linkable STRUCTURE. Every tab renders the honest
  // authorization-required state. No Identity & Access, no Tenants runtime, no Keycloak,
  // no runtime identity binding — D115 remains WITHHELD/UNRESOLVED/NOT AUTHORIZED.
  {
    label: 'Administration',
    path: '/admin',
    minRole: 'admin',
    status: 'unavailable',
    children: [
      { label: 'Overview', path: '/admin/overview', minRole: 'admin', status: 'unavailable' },
      { label: 'Identity & Access', path: '/admin/identity', minRole: 'admin', status: 'unavailable' },
      { label: 'Tenants', path: '/admin/tenancy', minRole: 'admin', status: 'unavailable' },
      { label: 'Engines & Certification', path: '/admin/engines', minRole: 'admin', status: 'unavailable' },
      { label: 'Platform Operations', path: '/admin/platform', minRole: 'admin', status: 'unavailable' },
      { label: 'Audit', path: '/admin/audit', minRole: 'admin', status: 'unavailable' },
      { label: 'Live Data & Governance', path: '/admin/data', minRole: 'admin', status: 'unavailable' },
      { label: 'Migration / Workflow / Marketplace', path: '/admin/operations', minRole: 'admin', status: 'unavailable' },
    ],
  },

  // ── Donor governed workspace surfaces (Option A; structure only, fail-closed) ────────
  // UI10 Collaboration / UI08 Reports / UI07 Watchlists / UI12 Settings in the donor
  // lineage — all server-coupled; restored as honest structural routes.
  { label: 'Collaboration', path: '/collaboration', minRole: 'viewer', status: 'unavailable' },
  { label: 'Reports', path: '/reports', minRole: 'viewer', status: 'unavailable' },
  { label: 'Watchlists', path: '/watchlists', minRole: 'viewer', status: 'unavailable' },
  { label: 'Settings', path: '/settings', minRole: 'viewer', status: 'unavailable' },
];

/** Human-facing label for a nav status (presentation only). */
export const NAV_STATUS_LABEL: Record<NavStatus, string> = {
  implemented: 'Implemented',
  partial: 'Partial',
  unavailable: 'Unavailable',
  future: 'Future',
};

/** Filter nav items visible to a given role. */
export function visibleNav(role: Role): NavItem[] {
  const rank: Record<Role, number> = { viewer: 0, analyst: 1, admin: 2 };
  return NAV.filter((item) => rank[role] >= rank[item.minRole]);
}
