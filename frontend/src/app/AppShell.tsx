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
 *  DELIBERATE OMISSION (Phase 1A) — the historical shell mounted three sibling overlays:
 *    · CommandPalette      (features/shell)         → imports api/decisionMatrix + core/auth
 *    · NotificationDrawer  (features/notifications) → imports api/notifications
 *    · NotesDrawer         (features/notes)         → imports api/notes
 *
 *  All three are API-coupled (authFetch -> /api/* -> frontend/server/**), which is excluded
 *  from Phase 1A by the governing authority decision, so the DONOR components are still
 *  NOT mounted. The Ctrl+K shortcut, the TopBar trigger seams and the Sign-out seam are
 *  preserved from the donor structure.
 *
 * ══ PHASE 5 / OPTION A — OFFLINE STRUCTURAL OVERLAYS ═════════════════════════════════════
 *  Authority act phase5-offline-full-shell-restoration-2026-09-23-001 restores the
 *  STRUCTURAL PRESENCE of Global Search, Notifications, Notes and Sign-out without
 *  activating the excluded tier:
 *
 *    · the TopBar prop seams (onOpenPalette / onOpenNotifications / onOpenNotes /
 *      onSignOut — all left unset since Phase 1A) are now wired to OFFLINE STRUCTURAL
 *      panels (OfflineOverlays.tsx) that render explicit unavailable states — no fetch,
 *      no service, no data, no simulated response;
 *    · the donor Ctrl+K / Cmd+K shortcut is re-wired to the offline structural palette
 *      (it opens an honest offline panel — it cannot reach any service);
 *    · Sign-out is the structural entry: it discloses that no identity layer is active
 *      (Phase-1A F-a) and that D115 remains DEFERRED. No authentication is introduced.
 *
 * Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 *                 + phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import {
  OfflineCommandPalette,
  OfflineNotificationDrawer,
  OfflineNotesDrawer,
  SignOutNotice,
} from './OfflineOverlays.js';
import { useSession } from '../core/session/SessionContext.js';

type Overlay = 'none' | 'palette' | 'notifications' | 'notes' | 'signout';

export function AppShell() {
  const { session } = useSession();
  const [overlay, setOverlay] = useState<Overlay>('none');
  const close = (): void => setOverlay('none');

  // Donor structural shortcut: Ctrl+K / Cmd+K opens the OFFLINE structural palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOverlay((o) => (o === 'palette' ? 'none' : 'palette'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-topbar" style={{ position: 'relative' }}>
        <TopBar
          role={session.role}
          tenantId={session.tenantId}
          onOpenPalette={() => setOverlay('palette')}
          onOpenNotifications={() => setOverlay('notifications')}
          onOpenNotes={() => setOverlay('notes')}
          onSignOut={() => setOverlay('signout')}
        />
        {overlay === 'palette' && <OfflineCommandPalette onClose={close} />}
        {overlay === 'notifications' && <OfflineNotificationDrawer onClose={close} />}
        {overlay === 'notes' && <OfflineNotesDrawer onClose={close} />}
        {overlay === 'signout' && <SignOutNotice onClose={close} />}
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
