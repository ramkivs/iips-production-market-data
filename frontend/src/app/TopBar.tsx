/**
 * Program v3.0 — Phase 3: TopBar.
 * Brand + session identity (role/tenant). Presentation-only.
 *
 * P-1: exposes the command-palette trigger (opens the AppShell-mounted palette).
 * P-2 (S-9a): exposes the Notes trigger (opens the AppShell-mounted Notes drawer).
 *
 * ══ IIPS PHASE-1A AUTH RECONCILIATION (Option F-a) ═══════════════════════════════════════
 *  Recovered from full-IIPS baseline tree 682f4e6029818c839f23211ae5067eed862c5037
 *  (ref origin/arena/01a0c440, blob 99100762e7).
 *
 *  EXPLICIT AUTH-MODEL STATEMENT — this is a governed decision, NOT an incidental edit:
 *
 *    The historical component imported `useAuth` from the Keycloak OIDC AuthProvider and
 *    used exactly two symbols (`status`, `logout`) to gate a single Sign-out button.
 *    `role` and `tenantId` were — and remain — PROPS, never auth-derived.
 *
 *    The target IIPS application has NO CLIENT-SIDE AUTHENTICATION. Execution mode is
 *    NON_PRODUCTION / single-operator / offline, with zero OIDC, zero Keycloak, and zero
 *    authenticated transport. Importing the historical AuthProvider would have introduced
 *    a production identity surface across the fail-closed boundary.
 *
 *    Therefore the Keycloak-gated Sign-out control is INTENTIONALLY NOT RECONSTITUTED.
 *    No authentication behaviour is silently removed, because no authentication behaviour
 *    exists in the target authority to remove. The seam is preserved for a future governed
 *    gate via the optional `onSignOut` prop below, which is left unset in Phase 1A.
 *
 *  Governed under: AD-01..AD-18 / Phase-1A Authority Decision (OQ-1 = Option A, OQ-2 = c440)
 *  Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import type { Role } from '../core/session/session.js';

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
  /**
   * Phase-1A auth reconciliation (F-a): preserved seam for a future governed authentication
   * gate. UNSET in Phase 1A — the target application has no client-side authentication, so
   * the Sign-out control does not render. Never wired to Keycloak/OIDC without authority.
   */
  onSignOut?: () => void;
}

export function TopBar({ role, tenantId, onOpenPalette, onOpenNotifications, unreadCount = 0, onOpenNotes, onSignOut }: TopBarProps) {
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
        {/* Phase-1A (F-a): renders only if a future governed gate supplies onSignOut. */}
        {onSignOut && (
          <button type="button" data-testid="sign-out" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
