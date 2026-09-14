/**
 * Program v3.0 — Phase 3: Application Shell.
 *
 * Global layout: TopBar + Sidebar (navigation) + content outlet + global shell states.
 * Presentation-only. Consumes semantic tokens. Role-aware navigation via SessionContext.
 *
 * P-1: mounts the Command Palette overlay and wires the approved Ctrl+K / Cmd+K shortcut
 * (G3). The palette itself is composition-only over existing governed authorities.
 *
 * P-2 (S-9a): owns the Notes drawer open/closed state and mounts it as a sibling overlay.
 * No route and no navigation entry is introduced.
 */
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from '../features/shell/CommandPalette';
import { NotificationDrawer } from '../features/notifications/NotificationDrawer';
import { NotesDrawer } from '../features/notes/NotesDrawer';
import { useSession } from '../core/session/SessionContext';

export function AppShell() {
  const { session } = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  // G3: Ctrl+K (Windows/Linux) / Cmd+K (macOS) opens the palette. No other global shortcuts.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-topbar">
        <TopBar
          role={session.role}
          tenantId={session.tenantId}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
          onOpenNotes={() => setNotesOpen(true)}
        />
      </div>
      <nav className="app-sidebar" aria-label="Primary">
        <Sidebar />
      </nav>
      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
      <NotesDrawer open={notesOpen} onClose={() => setNotesOpen(false)} />
    </div>
  );
}
