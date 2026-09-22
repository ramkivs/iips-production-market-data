/**
 * Institutional Investment Platform System (IIPS)
 * Root Institutional Application Shell (App.tsx) — Phase-1B routed mount
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 *                 Phase-1B Authority Decision (shell mount + BI-08 portfolio route)
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
 *    · Executive / Replay / -> these were placeholder-only in the prior chrome ("Surface
 *      Security Master        available via IIPS UI View-Model Registry"). They remain
 *                             honestly unimplemented: `future` in the navigation model,
 *                             rendered by FeaturePlaceholder. NO functionality is lost,
 *                             because none existed — and none is fabricated.
 *    · Governance footer   -> PRESERVED VERBATIM (see GovernanceFooter below). It carries
 *                             the fail-closed production disclosure; removing it would be a
 *                             regression of the production boundary, not a cosmetic change.
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
import { IntelligenceSurface } from '../features/intelligence/IntelligenceSurface.js';
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
 * AppShell itself is NOT modified by Phase 1B — it remains the Phase-1A recovered artifact.
 */
const ShellLayout: React.FC = () => (
  <div className="app-root">
    <GovernanceStrip />
    <AppShell />
    <GovernanceFooter />
  </div>
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

        {/* ── FUTURE: declared in the navigation model, honestly not implemented ─────── */}
        <Route path={ROUTES.executive} element={<FeaturePlaceholder surface="Executive Summary" />} />
        <Route path={ROUTES.replay} element={<FeaturePlaceholder surface="Replay Studio" />} />
        <Route path={ROUTES.securityMaster} element={<FeaturePlaceholder surface="Security Master" />} />
        <Route path={ROUTES.research} element={<FeaturePlaceholder surface="Research" />} />
        {/* ── IMPLEMENTED (Phase 1C, PATH L): local offline view-model, no network ──── */}
        <Route path={ROUTES.intelligence} element={<IntelligenceSurface />} />
        <Route path={ROUTES.evidence} element={<FeaturePlaceholder surface="Evidence" />} />
        <Route path={ROUTES.admin} element={<FeaturePlaceholder surface="Administration" />} />
        <Route path={ROUTES.collaboration} element={<FeaturePlaceholder surface="Collaboration" />} />
        <Route path={ROUTES.reports} element={<FeaturePlaceholder surface="Reports" />} />
        <Route path={ROUTES.watchlists} element={<FeaturePlaceholder surface="Watchlists" />} />
        <Route path={ROUTES.settings} element={<FeaturePlaceholder surface="Settings" />} />

        {/* Unknown paths fall back to the default surface — never a fabricated one. */}
        <Route path="*" element={<Navigate to={DEFAULT_SURFACE_ROUTE} replace />} />
      </Route>
    </Routes>
  );
};
