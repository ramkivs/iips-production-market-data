/**
 * Program v3.0 — Phase 3: Application Shell.
 *
 * Global layout: TopBar + Sidebar (navigation) + content outlet.
 * Presentation-only. Consumes semantic tokens. Role-aware navigation via SessionContext.
 *
 * ══ IIPS PHASE-1A RECOVERY NOTE ══════════════════════════════════════════════════════════
 *  Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 *  (ref origin/arena/01a0c440, blob e05b823faf).
 *
 *  DELIBERATE OMISSION — the historical shell mounted three sibling overlays:
 *    · CommandPalette      (features/shell)         → imports api/decisionMatrix + core/auth
 *    · NotificationDrawer  (features/notifications) → imports api/notifications
 *    · NotesDrawer         (features/notes)         → imports api/notes
 *
 *  All three are API-coupled (authFetch -> /api/* -> frontend/server/**), which is excluded
 *  from Phase 1A by the governing authority decision. CommandPalette is additionally the
 *  only feature component importing core/auth. They are therefore NOT mounted here, and the
 *  Ctrl+K / Cmd+K global shortcut is not wired (it would open a surface that cannot exist
 *  offline). TopBar's onOpenPalette / onOpenNotifications / onOpenNotes props are optional
 *  and left unset, so the corresponding triggers do not render.
 *
 *  These are deferred to a later governed phase, not discarded.
 *
 *  Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 *  Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { useSession } from '../core/session/SessionContext.js';

export function AppShell() {
  const { session } = useSession();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-topbar">
        <TopBar role={session.role} tenantId={session.tenantId} />
      </div>
      <nav className="app-sidebar" aria-label="Primary">
        <Sidebar />
      </nav>
      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
