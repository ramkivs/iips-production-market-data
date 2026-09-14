/**
 * Program v3.0 — P-1: typed API client for the governed notification surface.
 *
 * Consumes GET /api/notifications and POST /api/notifications/{id}/read ONLY. Mirrors the
 * server contract 1:1 — no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   U-2b  unread count arrives in the GET envelope; there is NO unread-count endpoint.
 *   PD3   mark-all-read is DEFERRED — no read-all function exists.
 *   read non-reversibility: markNotificationRead takes no boolean; there is no un-read path.
 *   PD4   recipient scoping is server-enforced; the client never supplies tenant/recipient.
 *   U-4   sourceStateDurability + sourceStateNote are surfaced verbatim (DG-1′).
 */
import { authFetch } from './authFetch';

export interface NotificationProvenance {
  readonly dataSource: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface NotificationItem {
  readonly notificationId: string;
  readonly tenantId: string;
  readonly recipientUserId: string;
  readonly eventId: string;
  readonly type: string;
  readonly title: string;
  readonly summary: string | null;
  readonly createdAt: string;
  readonly read: boolean;
  readonly deepLink: string;
  /** U-4 machine-readable marker for the referenced source state. */
  readonly sourceStateDurability: string;
  /** U-4 verbatim user-visible wording (DG-1′). */
  readonly sourceStateNote: string;
}

export interface NotificationListEnvelope {
  readonly data: readonly NotificationItem[];
  /** U-2b: carried in this envelope; no dedicated endpoint. */
  readonly unreadCount: number;
  readonly provenance: NotificationProvenance;
}

/** Fetch the authenticated principal's OWN notifications (server-scoped), createdAt DESC. */
export async function fetchNotifications(): Promise<NotificationListEnvelope> {
  const res = await authFetch('/api/notifications');
  if (!res.ok) throw new Error(`notifications request failed: ${res.status}`);
  return (await res.json()) as NotificationListEnvelope;
}

/**
 * Idempotent mark-read for one of the caller's OWN notifications.
 * Read is NON-REVERSIBLE: no parameter can request `read=false`.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ data: NotificationItem; provenance: NotificationProvenance }> {
  const res = await authFetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`mark-read failed: ${res.status}`);
  return (await res.json()) as { data: NotificationItem; provenance: NotificationProvenance };
}
