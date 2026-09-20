/**
 * Program v3.0 — Phase 3: TopBar.
 * Brand + session identity (role/tenant) + sign-out. Presentation-only.
 *
 * P-1: exposes the command-palette trigger (opens the AppShell-mounted palette).
 * P-2 (S-9a): exposes the Notes trigger (opens the AppShell-mounted Notes drawer).
 * P14-R7: INT-017 target visual convergence (institutional brand lockup, search bar,
 * notification counter pill, and session profile block).
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
      {/* Target brand lockup: [II] IIPS Platform */}
      <div className="topbar-brand">
        <span className="topbar-monogram" aria-hidden="true">II</span>
        <strong style={{ fontSize: '15px' }}>IIPS Platform</strong>
        <span className="sr-only">IIPS — Enterprise Investment Intelligence</span>
      </div>

      {/* Target center/right controls */}
      <div className="topbar-controls">
        {onOpenPalette && (
          <button
            type="button"
            className="topbar-search-box"
            data-testid="palette-trigger"
            onClick={onOpenPalette}
            aria-label="Open command palette"
          >
            <span style={{ fontSize: '14px' }}>⌕</span>
            <span>Global Search</span>
            <kbd className="topbar-kbd">⌘K</kbd>
          </button>
        )}

        {onOpenPalette && (
          <button
            type="button"
            className="topbar-btn"
            onClick={onOpenPalette}
            aria-label="Command Palette"
            style={{ display: 'none' }}
          >
            Command Palette
          </button>
        )}

        {onOpenNotifications && (
          <button
            type="button"
            className="topbar-btn"
            data-testid="notification-trigger"
            onClick={onOpenNotifications}
            aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
            style={{ position: 'relative' }}
          >
            <span style={{ fontSize: '14px' }}>{'\u2691'}</span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span data-testid="notification-badge" className="topbar-badge">
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
            <span>{'\u270E'}</span>
            <span>Notes</span>
          </button>
        )}

        {/* Target user profile presentation */}
        <div className="topbar-session-tag" style={{ gap: 8 }}>
          <span className="topbar-avatar-circle" aria-hidden="true">
            {role.charAt(0).toUpperCase()}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span data-testid="topbar-tenant" style={{ fontWeight: 600 }}>Tenant: {tenantId}</span>
            <span data-testid="topbar-role" style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>Role: {role}</span>
          </div>
        </div>

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
