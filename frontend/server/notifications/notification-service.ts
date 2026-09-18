/**
 * Program v3.0 — P-1 Notification Service (composition over promoted authorities).
 *
 * COMPOSITION ONLY. This module wires already-promoted authorities together; it introduces
 * NO new persistence authority, NO new recipient authority, NO new RBAC model, NO event bus /
 * broker / queue / scheduler / worker, NO retry queue, and NO rollback/transaction/atomicity
 * mechanism.
 *
 * Binding decisions realized here:
 *   N1(a)     event source = the successful `data-governance.classified` classify mutation.
 *   N1(b)/U-1 event identity = ONE `randomUUID()` minted per event, BEFORE fan-out, shared by
 *             every recipient record of that event.
 *   N1(c)     authoritative timestamp = PF-1's server-stamped `createdAt` (real wall-clock).
 *             The fixed admin-transport clock is NOT used.
 *   N2        persistence authority = PF-1 `PersistenceService` (UNMODIFIED).
 *   PD1       the only v1 event is `data-governance.classified`; no event is manufactured.
 *   PD4/N3    recipient-scoping is absolute; recipient identity (not role) restricts access.
 *   U-2c      RosterError('NO_SYNC') -> classification STANDS; fan-out is SKIPPED ENTIRELY.
 *             TD-5 S10: NO_SYNC is NEVER treated as an empty roster.
 *   U-2d      PF-1 WRITE_FAILED -> classification STANDS; failure reported; no rollback.
 *   U-2d(ii)  partial fan-out: recipients already appended KEEP their records; the failing
 *             recipient and any subsequent recipients have none. No atomicity is claimed.
 *   U-3       deepLink = '/admin/data' (surface-level; no per-resource route exists).
 *   U-4       P-1-scoped provenance field `sourceStateDurability` + the approved verbatim
 *             user-visible wording. The shared `freshness` enum is NOT extended or reused.
 *   DG-1′     the notification is DURABLE while the classification state is NOT. The record is a
 *             HISTORICAL assertion that a classification occurred at `createdAt` — never a
 *             current-state read model. The canonical instruction "The UI must not imply
 *             persistence" remains in force.
 *
 * Recipient authority: PF-2 `RosterDirectory.adminsOf(tenantId)` — SERVER-INTERNAL ONLY.
 * TD-6 preserved: no roster HTTP view; no user/role list is ever exposed.
 *
 * A P-1 notification failure NEVER fails, rolls back, or alters the promoted classify mutation.
 */
import { randomUUID } from 'node:crypto';
import { PersistenceService, resolveDataDir, type PersistedRecord } from '../persistence/persistence-service';
import { RosterDirectory, RosterError } from '../directory/roster-directory';

/** PD1 — the only authorized v1 event type. */
export const NOTIFICATION_TYPE_CLASSIFIED = 'data-governance.classified';

/** U-3 — surface-level deep link. No per-resource route exists; none is created. */
export const NOTIFICATION_DEEP_LINK = '/admin/data';

/** U-4 — machine-readable, P-1-scoped source-state durability marker. */
export const SOURCE_STATE_NON_DURABLE = 'NON_DURABLE';

/**
 * U-4 — approved user-visible wording, verbatim. Must accompany the notification wherever it is
 * displayed (DG-1′ / "UI must not imply persistence").
 */
export const SOURCE_STATE_NOTE =
  'Historical record — the classification shown here was recorded at the time of this event and is not the current stored state.';

/** The opaque PF-1 payload carried by a P-1 notification record. */
export interface NotificationPayload {
  readonly eventId: string;
  readonly type: typeof NOTIFICATION_TYPE_CLASSIFIED;
  readonly title: string;
  readonly summary: string | null;
  readonly deepLink: string;
  /** U-4 machine-readable marker. */
  readonly sourceStateDurability: typeof SOURCE_STATE_NON_DURABLE;
  /** U-4 verbatim user-visible wording. */
  readonly sourceStateNote: string;
  readonly dataId: string;
  readonly classification: string;
  readonly actorUserId: string;
}

/** Governed notification DTO (server-derived; never client-supplied). */
export interface NotificationDto {
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
  readonly sourceStateDurability: string;
  readonly sourceStateNote: string;
}

/** Audit event for the emission lifecycle. Counts/outcome only — never user data, never secrets. */
export interface NotificationAuditEvent {
  readonly event: 'notification.fanout';
  readonly outcome: 'delivered' | 'skipped-no-sync' | 'partial' | 'failed';
  readonly eventId: string;
  readonly tenantId: string;
  readonly recipientCount: number;
  readonly persistedCount: number;
  readonly errorCode?: string;
}

/** Result of an emission attempt. Never thrown — classification always stands. */
export interface EmissionOutcome {
  readonly eventId: string;
  readonly recipientCount: number;
  readonly persistedCount: number;
  readonly outcome: 'delivered' | 'skipped-no-sync' | 'partial' | 'failed';
  readonly errorCode?: string;
}

// --- Lazy process singleton (PF-1) -------------------------------------------------------

let persistence: PersistenceService | null = null;

/**
 * P-1's PF-1 handle. PF-1 is the designated persistence authority (N2) and is UNMODIFIED.
 *
 * Journal partitioning: P-1 records use the REAL `tenantId` + `recipientUserId`, while PF-2
 * uses the reserved `__system__` / `__directory__` scope. The two consumers therefore cannot
 * collide — neither can read the other's records through PF-1's tenant+owner scoping.
 */
export function getNotificationPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveDataDir() });
  return persistence;
}

/** Test seam: reset the process singleton. */
export function resetNotificationPersistence(): void {
  persistence = null;
}

/** Map a PF-1 record to the governed DTO. */
export function toNotificationDto(record: PersistedRecord): NotificationDto {
  const p = record.payload as NotificationPayload;
  return {
    notificationId: record.recordId,
    tenantId: record.tenantId,
    recipientUserId: record.ownerUserId,
    eventId: p.eventId,
    type: p.type,
    title: p.title,
    summary: p.summary,
    createdAt: record.createdAt,   // N1(c): PF-1 wall-clock
    read: record.read,
    deepLink: p.deepLink,
    sourceStateDurability: p.sourceStateDurability,
    sourceStateNote: p.sourceStateNote,
  };
}

/**
 * Emit `data-governance.classified` notifications for a completed classify mutation.
 *
 * NEVER THROWS. Every failure path returns an outcome so the promoted classify mutation is
 * never failed, rolled back, or altered (U-2c / U-2d / U-2d(ii)).
 */
export function emitClassificationNotifications(input: {
  readonly tenantId: string;
  readonly dataId: string;
  readonly classification: string;
  readonly actorUserId: string;
  /** Injected for tests; defaults to the promoted PF-2 process wiring. */
  readonly directory?: RosterDirectory;
  readonly persistence?: PersistenceService;
  readonly audit?: (event: NotificationAuditEvent) => void;
}): EmissionOutcome {
  // U-1: ONE identity per event, minted BEFORE fan-out, shared by every recipient record.
  const eventId = randomUUID();
  const audit = input.audit ?? (() => {});

  // --- Recipient resolution (PF-2, server-internal; TD-6 preserved) ---
  let recipients: string[];
  try {
    const directory = input.directory ?? resolveDirectory();
    recipients = directory.adminsOf(input.tenantId);
  } catch (e) {
    // U-2c: NO_SYNC (or any recipient-resolution failure) -> classification STANDS and fan-out
    // is SKIPPED ENTIRELY. TD-5 S10: never treated as an empty roster.
    const errorCode = e instanceof RosterError ? e.code : 'RECIPIENTS_UNAVAILABLE';
    const outcome: EmissionOutcome = {
      eventId, recipientCount: 0, persistedCount: 0, outcome: 'skipped-no-sync', errorCode,
    };
    audit({
      event: 'notification.fanout', outcome: 'skipped-no-sync', eventId,
      tenantId: input.tenantId, recipientCount: 0, persistedCount: 0, errorCode,
    });
    return outcome;
  }

  // --- Fan-out: one PF-1 append per recipient ---
  const payloadFor = (): NotificationPayload => ({
    eventId,
    type: NOTIFICATION_TYPE_CLASSIFIED,
    title: `Classification updated: ${input.dataId}`,
    summary: `${input.dataId} was classified as ${input.classification}.`,
    deepLink: NOTIFICATION_DEEP_LINK,
    sourceStateDurability: SOURCE_STATE_NON_DURABLE,
    sourceStateNote: SOURCE_STATE_NOTE,
    dataId: input.dataId,
    classification: input.classification,
    actorUserId: input.actorUserId,
  });

  const store = input.persistence ?? getNotificationPersistence();
  let persistedCount = 0;
  for (const recipientUserId of recipients) {
    try {
      // Dedup: dedupKey = eventId. PF-1's scope is (tenantId, ownerUserId, dedupKey), which
      // yields the recorded (eventId, recipientUserId) uniqueness without composing the
      // recipient into the key. A duplicate append is a no-op returning the existing record.
      store.append({
        tenantId: input.tenantId,
        ownerUserId: recipientUserId,
        dedupKey: eventId,
        payload: payloadFor(),
      });
      persistedCount += 1;
    } catch (e) {
      // U-2d + U-2d(ii): classification STANDS. Records already appended are KEPT. The failing
      // recipient and any SUBSEQUENT recipients get none. No rollback, no retry, no atomicity.
      const errorCode = (e as { code?: string }).code ?? 'WRITE_FAILED';
      const outcome = persistedCount > 0 ? ('partial' as const) : ('failed' as const);
      audit({
        event: 'notification.fanout', outcome, eventId, tenantId: input.tenantId,
        recipientCount: recipients.length, persistedCount, errorCode,
      });
      return { eventId, recipientCount: recipients.length, persistedCount, outcome, errorCode };
    }
  }

  audit({
    event: 'notification.fanout', outcome: 'delivered', eventId,
    tenantId: input.tenantId, recipientCount: recipients.length, persistedCount,
  });
  return { eventId, recipientCount: recipients.length, persistedCount, outcome: 'delivered' };
}

/** Resolve the promoted PF-2 roster (server-internal). Kept lazy so tests never touch env. */
function resolveDirectory(): RosterDirectory {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const wiring = require('../directory/directory-wiring') as typeof import('../directory/directory-wiring');
  return wiring.getDirectoryWiring().directory;
}

/**
 * List the authenticated principal's OWN notifications, `createdAt` DESC (PF-1 `listOrdered`).
 * Tenant + recipient scoping is enforced inside PF-1 — cross-tenant/cross-user reads are
 * structurally impossible (PD4 absolute).
 */
export function listNotifications(
  tenantId: string,
  recipientUserId: string,
  store: PersistenceService = getNotificationPersistence(),
): NotificationDto[] {
  return store.listOrdered(tenantId, recipientUserId).map(toNotificationDto);
}

/** U-2b — unread count for the caller's OWN notifications only. */
export function unreadCount(
  tenantId: string,
  recipientUserId: string,
  store: PersistenceService = getNotificationPersistence(),
): number {
  return store.listOrdered(tenantId, recipientUserId).filter((r) => !r.read).length;
}

/**
 * Mark one of the caller's OWN notifications read. Idempotent.
 *
 * Read is NON-REVERSIBLE in v1: the literal `true` is always passed and no caller-facing path
 * can supply `false`. PF-1's primitive remains consumer-neutral and is NOT modified —
 * enforcement is caller-level, here.
 *
 * Returns `undefined` for an unknown or foreign record (PF-1 scoping), which the transport
 * maps to 404.
 */
export function markNotificationRead(
  tenantId: string,
  recipientUserId: string,
  notificationId: string,
  store: PersistenceService = getNotificationPersistence(),
): NotificationDto | undefined {
  const existing = store.readById(tenantId, recipientUserId, notificationId);
  if (!existing) return undefined;
  if (existing.read) return toNotificationDto(existing); // idempotent no-op
  const updated = store.updateReadState(tenantId, recipientUserId, notificationId, true);
  return updated ? toNotificationDto(updated) : toNotificationDto(existing);
}
