/**
 * Program v3.0 — Phase 3: Application entry (routing).
 *
 * Routes render the AppShell + a workspace for each feature surface.
 * Presentation-only; no business logic.
 *
 * Phase 13-Hardening (C): route-level code splitting via React.lazy — the initial
 * bundle carries the shell only; each workspace loads on first navigation.
 */
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { NotYetAuthorized } from '../components/shell/ShellStates';
import { LoadingState } from '../components/state/StateComponents';

const ExecutiveDashboard = lazy(() => import('../features/executive/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard })));
const PortfolioWorkspace = lazy(() => import('../features/portfolio/PortfolioWorkspace').then((m) => ({ default: m.PortfolioWorkspace })));
const CompanyIntelligence = lazy(() => import('../features/company/CompanyIntelligence').then((m) => ({ default: m.CompanyIntelligence })));
const ResearchHub = lazy(() => import('../features/research/ResearchHub').then((m) => ({ default: m.ResearchHub })));
const SectorIntelligence = lazy(() => import('../features/research/SectorIntelligence').then((m) => ({ default: m.SectorIntelligence })));
const ResearchEvents = lazy(() => import('../features/research/ResearchEvents').then((m) => ({ default: m.ResearchEvents })));
const MacroContext = lazy(() => import('../features/research/MacroContext').then((m) => ({ default: m.MacroContext })));
const CrossSectorIntelligence = lazy(() => import('../features/cross-sector/CrossSectorIntelligence').then((m) => ({ default: m.CrossSectorIntelligence })));
const DecisionMatrix = lazy(() => import('../features/decision-matrix/DecisionMatrix').then((m) => ({ default: m.DecisionMatrix })));
const IntelligenceHub = lazy(() => import('../features/intelligence/IntelligenceHub').then((m) => ({ default: m.IntelligenceHub })));
const EvidenceExplorer = lazy(() => import('../features/evidence/EvidenceExplorer').then((m) => ({ default: m.EvidenceExplorer })));
const EvidenceHub = lazy(() => import('../features/evidence/EvidenceHub').then((m) => ({ default: m.EvidenceHub })));
const ReplayExplorer = lazy(() => import('../features/replay/ReplayExplorer').then((m) => ({ default: m.ReplayExplorer })));
const Screener = lazy(() => import('../features/screener/Screener').then((m) => ({ default: m.Screener })));
const Administration = lazy(() => import('../features/admin/Administration').then((m) => ({ default: m.Administration })));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}

function FeaturePlaceholder({ surface }: { surface: string }) {
  return <NotYetAuthorized surface={surface} />;
}

/**
 * OIDC callback route. The real code→token exchange is handled by AuthProvider on
 * mount; this route is the minimal fallback surface for http://localhost:5173/callback.
 */
function SignInCallback() {
  return <LoadingState />;
}

export function App() {
  return (
    <Routes>
      <Route path="/callback" element={<SignInCallback />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/executive" replace />} />
        <Route path="/executive" element={<Lazy><ExecutiveDashboard /></Lazy>} />
        <Route path="/portfolio" element={<Lazy><PortfolioWorkspace /></Lazy>} />
        <Route path="/portfolio/*" element={<Lazy><PortfolioWorkspace /></Lazy>} />
        <Route path="/research" element={<Lazy><ResearchHub /></Lazy>} />
        <Route path="/research/company/:id" element={<Lazy><CompanyIntelligence /></Lazy>} />
        <Route path="/research/sector/:id" element={<Lazy><SectorIntelligence /></Lazy>} />
        <Route path="/research/events/:id" element={<Lazy><ResearchEvents /></Lazy>} />
        <Route path="/research/cross-sector" element={<Lazy><CrossSectorIntelligence /></Lazy>} />
        <Route path="/research/macro" element={<Lazy><MacroContext /></Lazy>} />
        <Route path="/screener" element={<Lazy><Screener /></Lazy>} />
        <Route path="/intelligence" element={<Lazy><IntelligenceHub /></Lazy>} />
        <Route path="/intelligence/decision-matrix" element={<Lazy><DecisionMatrix /></Lazy>} />
        <Route path="/intelligence/*" element={<FeaturePlaceholder surface="Intelligence" />} />
        <Route path="/evidence" element={<Lazy><EvidenceHub /></Lazy>} />
        <Route path="/evidence/:id" element={<Lazy><EvidenceExplorer /></Lazy>} />
        <Route path="/evidence/replay/:id" element={<Lazy><ReplayExplorer /></Lazy>} />
        <Route path="/admin/*" element={<Lazy><Administration /></Lazy>} />
        <Route path="*" element={<FeaturePlaceholder surface="Unknown route" />} />
      </Route>
    </Routes>
  );
}
