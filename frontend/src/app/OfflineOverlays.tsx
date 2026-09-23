/**
 * IIPS — Offline structural shell overlays (Phase 5, Option A).
 *
 * Structural presence — WITHOUT runtime dependencies — for the three donor TopBar
 * overlays (Global Search / Notifications / Notes) and the Sign-out entry.
 *
 * ══ WHY THESE ARE NOT THE DONOR COMPONENTS ═══════════════════════════════════════════════
 *  The donor shell mounted CommandPalette (features/shell — imports api/decisionMatrix +
 *  core/auth), NotificationDrawer (api/notifications) and NotesDrawer (api/notes). All
 *  three are API-coupled (authFetch -> /api/* -> frontend/server/** -> Keycloak), which
 *  standing authority excludes. Mounting them would activate the excluded tier.
 *
 *  The Option A act mandates instead: "preserve the structural shell/navigation entry +
 *  render an explicit offline/unavailable state." These components are that state. They
 *  perform no fetch, invoke no service, display no data (real or synthetic), and fake no
 *  successful response. Opening one states plainly that the service is not active.
 *
 *  The Sign-out notice preserves the donor TopBar's structural entry: the identity layer
 *  is NOT active (Phase-1A F-a: no client-side authentication exists), so sign-out
 *  discloses that honestly instead of ending a session that does not exist.
 *  D115 remains DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED.
 *
 * Governed under: phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */
import { useEffect } from 'react';

const panelStyle = {
  position: 'absolute',
  top: '100%',
  right: 24,
  zIndex: 40,
  width: 360,
  maxWidth: 'calc(100vw - 48px)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  background: 'var(--color-surface-1)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  padding: 16,
  fontSize: 13,
} as const;

const titleStyle = { margin: 0, fontSize: 14 } as const;
const bodyStyle = { margin: '8px 0 0', color: 'var(--color-ink-muted)' } as const;

/** Shared honest disclosure for every offline overlay. */
function OfflinePanel({
  testid,
  title,
  line,
}: {
  testid: string;
  title: string;
  line: string;
}) {
  return (
    <div data-testid={testid} role="dialog" aria-label={title} style={panelStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p data-testid={`${testid}-state`} style={bodyStyle}>
        {line}
      </p>
      <p style={bodyStyle}>
        This panel is structural Master IIPS chrome, restored offline by governed
        authority. No service is invoked, no data is shown, and no response is simulated.
      </p>
    </div>
  );
}

/**
 * Structural Global Search palette (donor: CommandPalette, Ctrl+K / Cmd+K).
 * Opens on the preserved TopBar `onOpenPalette` seam. Never searches: the governed
 * search service is not active offline, so an honest empty-and-offline panel renders
 * instead of an input that could imply capability.
 */
export function OfflineCommandPalette({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <OfflinePanel
      testid="offline-command-palette"
      title="Global Search — OFFLINE"
      line="The governed search service is not active in the offline execution mode. No query can be executed and no results exist."
    />
  );
}

/** Structural Notifications drawer (donor: NotificationDrawer, api/notifications). */
export function OfflineNotificationDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <OfflinePanel
      testid="offline-notification-drawer"
      title="Notifications — OFFLINE"
      line="No notification service is active in the offline execution mode. There are no notifications — real or simulated."
    />
  );
}

/** Structural Notes drawer (donor: NotesDrawer, api/notes). */
export function OfflineNotesDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <OfflinePanel
      testid="offline-notes-drawer"
      title="Notes — OFFLINE"
      line="Notes require the platform server, which is not active in the offline execution mode. No notes exist and none can be created."
    />
  );
}

/**
 * Structural Sign-out disclosure (donor: useAuth-gated Sign-out button).
 * The offline application has NO client-side authentication (Phase-1A F-a) and no
 * active session to end, so activation discloses that honestly.
 */
export function SignOutNotice({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div data-testid="sign-out-notice" role="dialog" aria-label="Sign out unavailable" style={panelStyle}>
      <h3 style={titleStyle}>Sign out — UNAVAILABLE</h3>
      <p data-testid="sign-out-notice-state" style={bodyStyle}>
        No identity layer is active in the governed offline execution mode, so there is no
        session to sign out of. The identity and access tier remains deferred by authority
        (D115) and is not activated by this entry.
      </p>
    </div>
  );
}
