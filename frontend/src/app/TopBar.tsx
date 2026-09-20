/**
 * Program v3.0 — Phase 3: TopBar.
 * Brand + session identity (role/tenant) + sign-out. Presentation-only.
 *
 * P-1: exposes the command-palette trigger (opens the AppShell-mounted palette).
 * P-2 (S-9a): exposes the Notes trigger (opens the AppShell-mounted Notes drawer).
 * P14-R7: institutional tokenized styling for brand identity and action triggers.
 */
import type { Role } from '../core/session/session';
import { useAuth } from '../core/auth/AuthProvider';

interface TopBarProps {
  role: Role;
  tenantId: string;
  /** Opens the AppShell-mounted command palette (P-1). Optional for non-shell usage. */
  onOpenPalette?: () => void;
  /** Opens the AppShell-mounted notification drawer (P-1, PD5). Optional for non-shell usage. */
  onOpenNotifications?: () => void;
  /** Unread notification count for the badge (PD2 — own unread only). */
  unreadCount?: number;
  /** Opens the AppShell-mounted Notes drawer (P-2, S-9a). Optional for non-shell usage. */
  onOpenNotes?: () => void;
}

export function TopBar({ role, tenantId, onOpenPalette, onOpenNotifications, unreadCount = 0, onOpenNotes }: TopBarProps) {
  const { status, logout } = useAuth();
  return (
    <header className="topbar-header">
      <div className="topbar-brand">
        <span className="topbar-brand-mark" aria-hidden="true">I</span>
        <strong style={{ fontSize: '15px' }}>IIPS — Enterprise Investment Intelligence</strong>
      </div>
      <div className="topbar-controls">
        {onOpenPalette && (
          <button
            type="button"
            className="topbar-btn"
            data-testid="palette-trigger"
            onClick={onOpenPalette}
            aria-label="Open command palette"
          >
            <span>⌕</span> Search
          </button>
        )}
        {onOpenNotifications && (
          <button
            type="button"
            className="topbar-btn"
            data-testid="notification-trigger"
            onClick={onOpenNotifications}
            aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
          >
            <span>{'\u2691'}</span> Notifications
            {unreadCount > 0 && (
              <span data-testid="notification-badge" className="topbar-badge" style={{ marginLeft: 4 }}>
                ({unreadCount})
              </span>
            )}
          </button>
        )}
        {onOpenNotes && (
          <button
            type="button"
            className="topbar-btn"
            data-testid="notes-trigger"
            onClick={onOpenNotes}
            aria-label="Open notes"
          >
            <span>{'\u270E'}</span> Notes
          </button>
        )}
        <span data-testid="topbar-tenant" className="topbar-session-tag">Tenant: {tenantId}</span>
        <span data-testid="topbar-role" className="topbar-session-tag">Role: {role}</span>
        {status === 'authenticated' && (
          <button
            type="button"
            className="topbar-btn"
            data-testid="sign-out"
            onClick={() => { void logout(); }}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
