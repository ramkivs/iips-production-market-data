/**
 * Institutional Investment Platform System (IIPS)
 * Root Institutional Application Shell (App.tsx) — Phase-1B routed mount
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 *                 Phase-1B Authority Decision (shell mount + BI-08 portfolio route)
 *                 phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ PHASE-1B: CONTROLLED INTEGRATION, NOT REPLACEMENT ════════════════════════════════════
 *  App is now a router host. Routes render the recovered full-IIPS AppShell (TopBar +
 *  Sidebar + content outlet); `/portfolio` renders the CURRENT, CERTIFIED BI-08
 *  PortfolioWorkspace.
 *
 *  BI-08 REMAINS AUTHORITATIVE. The historical full-IIPS PortfolioWorkspace
 *  (features/portfolio/PortfolioWorkspace on the c440 baseline, which fetched
 *  authFetch -> /api/portfolio) is NOT imported, NOT recovered, and does NOT replace the
 *  current implementation. The import below resolves to the current BI-authoritative file,
 *  whose tree hash is unchanged by this phase.
 *
 * ══ PHASE 5 / OPTION A — DONOR ROUTE STRUCTURE RESTORED (OFFLINE) ════════════════════════
 *  Authority act phase5-offline-full-shell-restoration-2026-09-23-001 restores the donor
 *  Master IIPS route STRUCTURE (26 donor paths) around the accepted BI-08 integration.
 *  The donor route tree (ref origin/arena/01a0c440 App.tsx) is reproduced path-for-path,
 *  with ONE governed substitution: every donor surface whose implementation is
 *  API/auth-coupled (authFetch -> /api/* -> frontend/server/** -> Keycloak) renders the
 *  honest fail-closed UnavailableSurface instead of the donor component. The excluded
 *  runtime dependencies are NOT activated. Specifically:
 *
 *    · /callback          — donor OIDC callback route structure. The identity layer is NOT
 *                           active (D115 DEFERRED): no code exchange, no session, no redirect.
 *    · /search, /screener(+/governed), research :id children + cross-sector + macro,
 *      /intelligence/decision-matrix, /evidence/:id + /evidence/replay/:id,
 *      /collaboration, /reports, /watchlists, /settings — structural fail-closed surfaces.
 *    · /admin + the 8 donor tabs — structure only; every tab renders the honest
 *      authorization-required state (D115 DEFERRED). The donor Administration component
 *      (api/Keycloak-coupled) is NOT imported.
 *    · /research/macro    — EXCLUDED by D91/D88 (LIVE-only, no relief): structural route
 *                           renders the excluded-by-authority state. No macro endpoint.
 *
 *  PRESERVED EXACTLY (no downgrade, no promotion, no donor substitution):
 *    · /portfolio -> the current BI-08 PortfolioWorkspace (BI-08 authoritative);
 *    · /executive -> ExecutiveSurface (UI02 company-level partial; the donor
 *      portfolio-level ExecutiveDashboard is NOT mounted — the granularity/identity
 *      conflict is NOT resolved by Option A);
 *    · /research  -> ResearchSurface (UI03_FUNDAMENTAL_ANALYSIS — the restored research
 *      child routes are structural surfaces WITHOUT UISurfaceIds; UI05/UI06/UI12/UI13 are
 *      NOT designated and NOT claimed implemented under UI03);
 *    · /intelligence -> IntelligenceSurface (UI04 partial);
 *    · /evidence  -> EvidenceSurface (UI11 partial);
 *    · /replay, /security-master -> current-base declared surfaces (no donor lineage).
 *
 * ══ WHAT THE PREVIOUS CHROME DID, AND WHERE IT WENT ══════════════════════════════════════
 *  The prior App.tsx was a self-contained shell: a sticky header with four `useState` tabs
 *  (Portfolio / Executive / Replay / Security Master), a body switch, and a governance
 *  footer. Under the mount:
 *
 *    · Tab navigation      -> replaced by real routing (Sidebar + react-router-dom). The
 *                             four tabs were local state, not routes; they are now URL-
 *                             addressable surfaces governed by the honest navigation model.
 *    · Portfolio tab       -> route `/portfolio` (and `/`), SAME BI-08 component, SAME
 *                             application-level singletons, SAME props. No behaviour change.
 *    · Governance footer   -> PRESERVED VERBATIM (see GovernanceFooter below). It carries
 *                             the fail-closed production disclosure; removing it would be
 *                             a regression of the production boundary, not a cosmetic change.
 *
 * ══ SESSION-LIFETIME CONTINUITY (Tier-B) — LOAD-BEARING ══════════════════════════════════
 *  The application-level `useMemo` singletons are retained EXACTLY as before. BI-07's repeat-
 *  import lifecycle suite depends on portfolio state surviving navigation away from and back
 *  to the portfolio surface (holdings 4 / totalMarketValue 151750 / weightSum 100.0 /
 *  provenanceDigest stable / contributions 2, with zero re-imports). Because the store is
 *  memoised at App level and PortfolioWorkspace reads from it, route changes cannot reset it.
 */

import React, { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell.js';
import { FeaturePlaceholder } from './FeaturePlaceholder.js';
import { UnavailableSurface } from './UnavailableSurface.js';
import { IntelligenceSurface } from '../features/intelligence/IntelligenceSurface.js';
// Phase-2 Path-L: Evidence presentation-only surface (authority act phase2-evidence-presentation-only-2026-09-22-001).
import { EvidenceSurface } from '../features/evidence/EvidenceSurface.js';
// Phase-3 Path-L: Executive presentation-only surface (authority act phase3-executive-presentation-only-2026-09-22-001).
import { ExecutiveSurface } from '../features/executive/ExecutiveSurface.js';
// Phase-4 Path-L: Research (UI03 Fundamental Analysis) presentation-only surface
// (authority acts phase4-research-identity-designation-2026-09-23-001 + phase4-research-ui03-presentation-only-2026-09-23-001).
import { ResearchSurface } from '../features/research/ResearchSurface.js';
import { ROUTES } from './routes.js';
import { PortfolioWorkspace } from '../features/portfolio/PortfolioWorkspace.js';
import { PortfolioStore, getDefaultPortfolioStore } from '../features/portfolio/index.js';
import { SecurityMaster, getGovernedBroadSecurityMaster } from '../../../src/identity/index.js';

export interface AppProps {
  portfolioStore?: PortfolioStore;
  securityMaster?: SecurityMaster;
}

/**
 * The default surface the application resolves to for `/` and for unknown paths.
 *
 * Exported so the routing contract is assertable without a DOM: `<Navigate>` performs its
 * redirect in an effect, which does not run under server rendering, so the declared target
 * is verified as data. It MUST remain the certified BI-08 portfolio route.
 */
export const DEFAULT_SURFACE_ROUTE: string = ROUTES.portfolio;

/**
 * Governance / execution-mode strip — PRESERVED FROM THE CERTIFIED BI-07 CHROME.
 *
 * The pre-mount header carried three governance disclosures alongside the brand:
 * "Governance: Active", "P04/P12 Lineage Enforced" and the execution-mode badge
 * "NON_PRODUCTION / OFFLINE_FIXTURE".
 *
 * The last of these is a user-visible FAIL-CLOSED DISCLOSURE. Dropping it while mounting the
 * new shell would have been a silent regression of the production boundary, so the strip is
 * reproduced verbatim here and rendered on every route. Only its host moved.
 *
 * The full product name is also carried here. The recovered TopBar renders the historical
 * brand ("IIPS — Enterprise Investment Intelligence"), so without this the certified product
 * name "Institutional Investment Platform System" would have been lost from the chrome. It is
 * restored HERE rather than by editing TopBar, because TopBar is a Phase-1A recovered artifact
 * and Phase 1B must not modify it.
 */
const GovernanceStrip: React.FC = () => (
  <div className="flex items-center space-x-2 border-b border-slate-800 bg-slate-900/80 px-6 py-1.5 text-xs text-slate-400">
    <span className="font-semibold tracking-tight text-slate-300">
      Institutional Investment Platform System
    </span>
    <span>•</span>
    <span className="inline-flex items-center space-x-1">
      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
      <span className="text-emerald-300 font-semibold">Governance: Active</span>
    </span>
    <span>•</span>
    <span className="text-slate-400">P04/P12 Lineage Enforced</span>
    <span>•</span>
    <span className="text-amber-400 font-mono">NON_PRODUCTION / OFFLINE_FIXTURE</span>
  </div>
);

/**
 * Global governance status footer — PRESERVED FROM THE CERTIFIED BI-07 CHROME.
 *
 * This is the user-visible fail-closed disclosure (Live Providers: 0 / Sockets: 0). Its
 * content is unchanged; only its host moved from the tab shell to the routed shell, so the
 * disclosure remains visible on EVERY surface rather than only on the portfolio tab.
 */
const GovernanceFooter: React.FC = () => (
  <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-2.5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
    <div>
      <span>IIPS Production Market Data &amp; Intelligence Pipeline • Program Baseline v1.0.0</span>
    </div>
    <div className="flex items-center space-x-3 text-[11px] font-mono">
      <span>Live Providers: 0 (INACTIVE)</span>
      <span>•</span>
      <span>Sockets: 0</span>
      <span>•</span>
      <span className="text-teal-400 font-bold">BI-07 Host Verified</span>
    </div>
  </footer>
);

/**
 * Layout route element: the recovered AppShell plus the preserved governance footer.
 * AppShell mounts the offline structural overlays (Option A); its recovered layout is
 * otherwise unchanged.
 */
const ShellLayout: React.FC = () => (
  <div className="app-root">
    <GovernanceStrip />
    <AppShell />
    <GovernanceFooter />
  </div>
);

/* ══ OPTION A — OFFLINE STRUCTURAL SURFACE FACTORIES ═════════════════════════════════════
 * One factory per restored donor surface family. Each returns the honest fail-closed page.
 * No donor feature component is imported anywhere below — the excluded server/auth tier is
 * never activated, and no data is fabricated.
 */

const structural = (surface: string, reason: string, note?: string): React.FC => {
  const C: React.FC = () => (
    <UnavailableSurface surface={surface} state="offline" reason={reason} note={note} />
  );
  return C;
};

const authorization = (surface: string, note?: string): React.FC => {
  const C: React.FC = () => (
    <UnavailableSurface
      surface={surface}
      state="authorization"
      reason="Authorization required — the identity and access tier is deferred"
      note={note}
    />
  );
  return C;
};

// Donor research children (structure only — no UISurfaceId, no UI03 identity claim).
const CompanyIntelligenceStructural = structural(
  'Research — Company',
  'Company Intelligence requires the platform research services, which are not active offline',
  'Donor structure: features/company/CompanyIntelligence (API-coupled in the donor lineage). No company data is fabricated.'
);
const SectorIntelligenceStructural = structural(
  'Research — Sector',
  'Sector Intelligence requires the platform research services, which are not active offline',
  'Donor structure: features/research/SectorIntelligence (API-coupled in the donor lineage). No sector data is fabricated.'
);
const ResearchEventsStructural = structural(
  'Research — Events',
  'Research Events requires the platform research services, which are not active offline',
  'Donor structure: features/research/ResearchEvents (API-coupled in the donor lineage). No event data is fabricated.'
);
const CrossSectorStructural = structural(
  'Research — Cross-Sector',
  'Cross-Sector Intelligence requires the platform research services, which are not active offline',
  'Donor structure: features/cross-sector/CrossSectorIntelligence (API-coupled in the donor lineage). No cross-sector data is fabricated.'
);
const MacroStructural: React.FC = () => (
  <UnavailableSurface
    surface="Research — Macro"
    state="excluded"
    reason="Excluded by standing authority — macro is LIVE-only governance (no relief granted)"
    note="D91/D88: the macro surface is excluded and no macro live endpoint exists. This route is donor structure only; no macro data, endpoint, or service is activated."
  />
);
const ScreenerStructural = structural(
  'Screener',
  'The Screener requires the platform screener services, which are not active offline',
  'Donor structure: features/screener/Screener (API-coupled in the donor lineage). No screening results are fabricated.'
);
const GovernedScreenerStructural = structural(
  'Screener — Governed',
  'The governed screener requires the certified platform screener services, which are not active offline',
  'Donor structure: features/screener/GovernedScreener (API-coupled in the donor lineage). No screening results are fabricated.'
);
const SearchStructural = structural(
  'Global Search',
  'Global Search requires the governed search service, which is not active offline',
  'Donor structure: features/search/GovernedSearch (API-coupled in the donor lineage). No results exist and none are simulated.'
);
const DecisionMatrixStructural = structural(
  'Intelligence — Decision Matrix',
  'The Decision Matrix requires the platform decision-matrix services, which are not active offline',
  'Donor structure: features/decision-matrix/DecisionMatrix (API-coupled in the donor lineage). No matrix, scores, or weights are fabricated.'
);
const EvidenceDetailStructural = structural(
  'Evidence — Detail',
  'Per-company decision evidence has no governed offline provenance payload',
  'Donor structure: features/evidence/EvidenceExplorer (API-coupled in the donor lineage). No per-company provenance or lineage digest is fabricated; see GATE-PHASE-2-EVIDENCE-PAYLOAD-FORENSIC (classification B).'
);
const EvidenceReplayStructural = structural(
  'Evidence — Replay',
  'Evidence replay has no governed offline provenance payload',
  'Donor structure: features/replay/ReplayExplorer (API-coupled in the donor lineage). No replay verdict is fabricated; see AD-17 / M-2 (UNRESOLVED).'
);
const CollaborationStructural = structural(
  'Collaboration',
  'Collaboration requires the platform collaboration services, which are not active offline',
  'Donor structure: features/collaboration/Collaboration (server-coupled in the donor lineage). No threads or activity are fabricated.'
);
const ReportsStructural = structural(
  'Reports',
  'Reports require the platform reporting services, which are not active offline',
  'Donor structure: features/reports/Reports (server-coupled in the donor lineage). No reports or templates are fabricated.'
);
const WatchlistsStructural = structural(
  'Watchlists',
  'Watchlists require the platform watchlist services, which are not active offline',
  'Donor structure: features/watchlists/Watchlists (server-coupled in the donor lineage). No watchlists or triggers are fabricated.'
);
const SettingsStructural = structural(
  'Settings',
  'Settings require the platform settings services, which are not active offline',
  'Donor structure: features/settings/Settings (server-coupled in the donor lineage). No preferences are fabricated.'
);

// Donor administration: 8 governed tabs — STRUCTURE ONLY, D115 DEFERRED.
const adminNote =
  'Donor structure: the 8 governed read-only Administration tabs. D115 remains DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED — no identity, tenancy, engine, audit, live-data or operations runtime is activated, and no administrative results are fabricated.';
const AdminOverviewStructural = authorization('Administration — Overview', adminNote);
const AdminIdentityStructural = authorization('Administration — Identity & Access', adminNote);
const AdminTenancyStructural = authorization('Administration — Tenants', adminNote);
const AdminEnginesStructural = authorization('Administration — Engines & Certification', adminNote);
const AdminPlatformStructural = authorization('Administration — Platform Operations', adminNote);
const AdminAuditStructural = authorization('Administration — Audit', adminNote);
const AdminDataStructural = authorization('Administration — Live Data & Governance', adminNote);
const AdminOperationsStructural = authorization('Administration — Migration / Workflow / Marketplace', adminNote);
const AdminStructural = authorization('Administration', adminNote);

// Donor OIDC callback route STRUCTURE (outside the shell layout, as in the donor route
// tree). The identity layer is NOT active: no code exchange, no session, no redirect.
const CallbackStructural: React.FC = () => (
  <UnavailableSurface
    surface="Identity Callback"
    state="authorization"
    reason="Identity callback structure — the identity layer is not active"
    note="Donor route structure only. No code exchange, token, session, or redirect is performed; D115 remains DEFERRED. This route activates nothing."
  />
);

export const App: React.FC<AppProps> = ({
  portfolioStore: initialPortfolioStore,
  securityMaster: initialSecurityMaster,
}) => {
  // Application-level singletons for session lifetime continuity (Tier-B) and governed broad
  // master data. Semantics identical to the pre-mount implementation.
  const appPortfolioStore = useMemo(() => initialPortfolioStore || getDefaultPortfolioStore(), [initialPortfolioStore]);
  const appSecurityMaster = useMemo(() => initialSecurityMaster || getGovernedBroadSecurityMaster(), [initialSecurityMaster]);

  return (
    <Routes>
      {/* Donor route structure: the callback route sits OUTSIDE the shell (donor contract). */}
      <Route path={ROUTES.callback} element={<CallbackStructural />} />

      <Route element={<ShellLayout />}>
        {/* Default surface remains the certified BI-08 portfolio experience. */}
        <Route index element={<Navigate to={DEFAULT_SURFACE_ROUTE} replace />} />

        {/* ── IMPLEMENTED: current BI-08 PortfolioWorkspace (authoritative) ───────────── */}
        <Route
          path={ROUTES.portfolio}
          element={
            <PortfolioWorkspace
              portfolioStore={appPortfolioStore}
              securityMaster={appSecurityMaster}
            />
          }
        />
        {/* Donor structure: the workspace renders for any /portfolio/* path (N+18). */}
        <Route
          path={`${ROUTES.portfolio}/*`}
          element={
            <PortfolioWorkspace
              portfolioStore={appPortfolioStore}
              securityMaster={appSecurityMaster}
            />
          }
        />

        {/* ── PARTIAL (preserved exactly): Executive = UI02 company-level ─────────────── */}
        {/* The donor portfolio-level ExecutiveDashboard is NOT mounted; the granularity
            conflict is NOT resolved by Option A and no portfolio-level data is fabricated. */}
        <Route path={ROUTES.executive} element={<ExecutiveSurface />} />

        {/* ── Current-base declared surfaces (no donor lineage) ───────────────────────── */}
        <Route path={ROUTES.replay} element={<FeaturePlaceholder surface="Replay Studio" />} />
        <Route path={ROUTES.securityMaster} element={<FeaturePlaceholder surface="Security Master" />} />

        {/* ── PARTIAL (preserved exactly): Research = UI03 at /research ───────────────── */}
        <Route path={ROUTES.research} element={<ResearchSurface />} />

        {/* ── OPTION A — donor research children (structural, fail-closed) ────────────── */}
        <Route path={ROUTES.researchCompany} element={<CompanyIntelligenceStructural />} />
        <Route path={ROUTES.researchSector} element={<SectorIntelligenceStructural />} />
        <Route path={ROUTES.researchEvents} element={<ResearchEventsStructural />} />
        <Route path={ROUTES.researchCrossSector} element={<CrossSectorStructural />} />
        {/* D91/D88: macro EXCLUDED — structural route renders the excluded state. */}
        <Route path={ROUTES.researchMacro} element={<MacroStructural />} />

        {/* ── OPTION A — donor screener routes (structural, fail-closed) ──────────────── */}
        <Route path={ROUTES.screener} element={<ScreenerStructural />} />
        <Route path={ROUTES.screenerGoverned} element={<GovernedScreenerStructural />} />

        {/* ── OPTION A — donor governed search route (structural, fail-closed) ────────── */}
        <Route path={ROUTES.search} element={<SearchStructural />} />

        {/* ── PARTIAL (preserved exactly): Intelligence = UI04 at /intelligence ───────── */}
        <Route path={ROUTES.intelligence} element={<IntelligenceSurface />} />

        {/* ── OPTION A — donor intelligence children ──────────────────────────────────── */}
        <Route path={ROUTES.intelligenceDecisionMatrix} element={<DecisionMatrixStructural />} />
        {/* Donor contract: remaining intelligence paths are placeholders (O/R/R = future). */}
        <Route path="/intelligence/*" element={<FeaturePlaceholder surface="Intelligence" />} />

        {/* ── PARTIAL (preserved exactly): Evidence = UI11 at /evidence ───────────────── */}
        <Route path={ROUTES.evidence} element={<EvidenceSurface />} />

        {/* ── OPTION A — donor evidence child templates (structural, fail-closed) ─────── */}
        <Route path={ROUTES.evidenceReplay} element={<EvidenceReplayStructural />} />
        <Route path={ROUTES.evidenceDetail} element={<EvidenceDetailStructural />} />

        {/* ── OPTION A — donor administration: 8 governed tabs (structure only, D115) ── */}
        <Route path={ROUTES.adminOverview} element={<AdminOverviewStructural />} />
        <Route path={ROUTES.adminIdentity} element={<AdminIdentityStructural />} />
        <Route path={ROUTES.adminTenancy} element={<AdminTenancyStructural />} />
        <Route path={ROUTES.adminEngines} element={<AdminEnginesStructural />} />
        <Route path={ROUTES.adminPlatform} element={<AdminPlatformStructural />} />
        <Route path={ROUTES.adminAudit} element={<AdminAuditStructural />} />
        <Route path={ROUTES.adminData} element={<AdminDataStructural />} />
        <Route path={ROUTES.adminOperations} element={<AdminOperationsStructural />} />
        <Route path={ROUTES.admin} element={<AdminStructural />} />
        <Route path="/admin/*" element={<AdminStructural />} />

        {/* ── OPTION A — donor governed workspace surfaces (structural, fail-closed) ──── */}
        <Route path={ROUTES.collaboration} element={<CollaborationStructural />} />
        <Route path={ROUTES.reports} element={<ReportsStructural />} />
        <Route path={ROUTES.watchlists} element={<WatchlistsStructural />} />
        <Route path={ROUTES.settings} element={<SettingsStructural />} />

        {/* Unknown paths fall back to the default surface — never a fabricated one. */}
        <Route path="*" element={<Navigate to={DEFAULT_SURFACE_ROUTE} replace />} />
      </Route>
    </Routes>
  );
};
