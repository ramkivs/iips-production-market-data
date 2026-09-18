/**
 * Program v3.0 — P-1: notification drawer (PD5).
 *
 * Reuses the governed `Drawer` primitive (Escape-dismiss + focus trap via useDialogFocus).
 * Presentation-only: the server is the authority for scoping, ordering, and read state.
 *
 * Recorded constraints reflected here:
 *   PD5   TopBar affordance + drawer; separate from the P-1 command palette.
 *   PD3   mark-all-read DEFERRED — no bulk control is rendered.
 *   read non-reversibility — mark-read only; no un-read affordance exists.
 *   PD4   self-scoped; no admin cross-user view.
 *   U-3   deepLink is the surface-level /admin/data.
 *   U-4/DG-1′ — the verbatim sourceStateNote is displayed with every notification, so the UI
 *         never implies the classification state is persisted. The notification is presented
 *         as a HISTORICAL record, not current state.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer } from '../../components/interaction/InteractionComponents';
import {
  fetchNotifications,
  markNotificationRead,
  type NotificationItem,
} from '../../api/notifications';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Lets the shell keep the TopBar badge in sync. */
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDrawer({ open, onClose, onUnreadCountChange }: NotificationDrawerProps) {
  const [items, setItems] = useState<readonly NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const env = await fetchNotifications();
      setItems(env.data);
      setUnread(env.unreadCount);
      onUnreadCountChange?.(env.unreadCount);
      setState('idle');
    } catch {
      setState('error');
    }
  }, [onUnreadCountChange]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  async function onMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      await load();
    } catch {
      setState('error');
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Notifications">
      <div data-testid="notification-drawer-body">
        <p data-testid="notification-unread-count" style={{ fontSize: 13, opacity: 0.8 }}>
          {unread} unread
        </p>

        {state === 'loading' && <p data-testid="notification-loading">Loading notifications…</p>}
        {state === 'error' && (
          <p data-testid="notification-error" role="alert">Notifications are unavailable.</p>
        )}
        {state === 'idle' && items.length === 0 && (
          <p data-testid="notification-empty">No notifications.</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((n) => (
            <li
              key={n.notificationId}
              data-testid="notification-item"
              data-read={n.read ? 'true' : 'false'}
              style={{
                borderBottom: '1px solid var(--color-border)',
                padding: '12px 0',
              }}
            >
              <strong style={{ display: 'block', fontSize: 14 }}>{n.title}</strong>
              {n.summary && <span style={{ display: 'block', fontSize: 13 }}>{n.summary}</span>}
              <time
                dateTime={n.createdAt}
                data-testid="notification-created-at"
                style={{ display: 'block', fontSize: 12, opacity: 0.7 }}
              >
                {n.createdAt}
              </time>

              {/* U-4 / DG-1′ — verbatim, always displayed. */}
              <p
                data-testid="notification-source-state-note"
                data-source-state-durability={n.sourceStateDurability}
                style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}
              >
                {n.sourceStateNote}
              </p>

              <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                <Link data-testid="notification-deep-link" to={n.deepLink} onClick={onClose}>
                  View governed data
                </Link>
                {!n.read && (
                  <button
                    type="button"
                    data-testid="notification-mark-read"
                    onClick={() => { void onMarkRead(n.notificationId); }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  );
}
