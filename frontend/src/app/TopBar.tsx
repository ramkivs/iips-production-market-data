/**
 * Program v3.0 — Phase 3: TopBar.
 * Brand + session identity (role/tenant) + sign-out. Presentation-only.
 *
 * P-1: exposes the command-palette trigger (opens the AppShell-mounted palette).
 * P-2 (S-9a): exposes the Notes trigger (opens the AppShell-mounted Notes drawer).
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
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        padding: '0 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
      }}
    >
      <strong style={{ fontSize: '16px' }}>IIPS — Enterprise Investment Intelligence</strong>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
        {onOpenPalette && (
          <button type="button" data-testid="palette-trigger" onClick={onOpenPalette} aria-label="Open command palette">
            ⌕ Search
          </button>
        )}
        {onOpenNotifications && (
          <button
            type="button"
            data-testid="notification-trigger"
            onClick={onOpenNotifications}
            aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
          >
            {'\u2691'} Notifications
            {unreadCount > 0 && (
              <span data-testid="notification-badge" style={{ marginLeft: 6 }}>({unreadCount})</span>
            )}
          </button>
        )}
        {onOpenNotes && (
          <button type="button" data-testid="notes-trigger" onClick={onOpenNotes} aria-label="Open notes">
            {'\u270E'} Notes
          </button>
        )}
        <span data-testid="topbar-tenant">Tenant: {tenantId}</span>
        <span data-testid="topbar-role">Role: {role}</span>
        {status === 'authenticated' && (
          <button type="button" data-testid="sign-out" onClick={() => { void logout(); }}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
