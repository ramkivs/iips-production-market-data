/**
 * UI10 COLLABORATION — governed-object threads, comments, mentions, assignments, activity.
 *
 * Authority: D83-R1 decision A (bounded UI10 recovery), under the legacy-D82 recovery
 * adjudication and the D84 obligation audit. Patterns per D75/D80/D81/D82.
 *
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-013** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI10 Collaboration — NEW":
 *                existing capability = NONE (positive absence) · disposition = NEW
 *                required delta = comments, mentions, shared research/watchlists,
 *                                 assignments, activity; must reference **governed IIPS
 *                                 objects**, never raw provider records
 *                validation     = object/reference integrity · phase/gate = P13 ONLY
 *
 * ⚠ NS-5 (P13 hard boundary): collaboration comments PIN the vintage they reference
 *   (`dataVersion` + `asOf` + `mode`). Enforced by the ACCEPTED `buildCollaborationView`,
 *   consumed unmodified, and additionally persisted here so the pin survives restarts.
 *
 * ⚠ VINTAGE HONESTY (D83 §15-16)
 *   A thread pins the governed vintage available AT AUTHORING TIME. Authoring against an
 *   arbitrary historical vintage is NOT possible and is NOT offered: only the vintage the
 *   platform currently exposes can be pinned. When the CURRENT governed vintage later differs
 *   from a thread's pinned vintage, that MISMATCH IS DISCLOSED — the thread is never silently
 *   re-pinned, and no historical vintage is fabricated or claimed retrievable.
 *
 * ⚠ SHARING SCOPE (D83 §17)
 *   Sharing is BY REFERENCE inside a thread: a thread is attached to one governed object, and
 *   comments may cite further governed objects. There is NO object-level ACL, NO cross-user
 *   permission model and NO new identity/session semantics — those would require M-5/G3, which
 *   is out of scope. Visibility is owner-scoped exactly as for every other recovered surface.
 *
 * SECURITY
 *   `PersistenceService` is a library authority, NOT an HTTP/RBAC boundary (TD-2 §5). Tenant and
 *   author are ALWAYS server-derived by the caller from the authenticated principal and are
 *   never read from a request body. `persistence-service.ts` is NOT modified.
 */
import path from 'node:path';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';

export const COLLABORATION_DATA_SUBDIR = 'collaboration';

/** Dedup namespace so collaboration events never collide with another consumer's records. */
const EVENT_PREFIX = 'collab-event\u0000';

/**
 * Governed object kinds a thread may reference. CLOSED SET — a raw provider record can never
 * be referenced because no provider kind exists here (INT-013).
 */
export const OBJECT_KINDS = Object.freeze(['evidence', 'company', 'watchlist', 'report'] as const);
export type ObjectKind = (typeof OBJECT_KINDS)[number];

export interface GovernedRef {
  readonly kind: ObjectKind;
  readonly id: string;
}

/** The vintage pinned at authoring time (NS-5). */
export interface PinnedVintage {
  readonly dataVersion: string;
  readonly asOf: string;
  readonly mode: string;
}

export interface Comment {
  readonly commentId: string;
  readonly text: string;
  /** Server-derived from the authenticated principal — never client-supplied. */
  readonly authorUserId: string;
  readonly createdAt: string;
  /** Resolved, tenant-scoped user ids. An unresolved handle is rejected, never stored. */
  readonly mentions: readonly string[];
  /** Further governed objects cited by this comment (sharing BY REFERENCE). */
  readonly references: readonly GovernedRef[];
  /** NS-5: the vintage in force when this comment was authored. */
  readonly pinnedVintage: PinnedVintage;
}

export interface Assignment {
  readonly assigneeUserId: string;
  readonly assignedBy: string;
  readonly assignedAt: string;
}

export interface ActivityEntry {
  readonly kind: 'thread-created' | 'comment-added' | 'comment-deleted' | 'assigned' | 'unassigned' | 'thread-deleted';
  readonly actorUserId: string;
  readonly at: string;
  readonly detail: string;
}

export interface Thread {
  readonly threadId: string;
  readonly subject: GovernedRef;
  readonly createdBy: string;
  readonly createdAt: string;
  /** NS-5: the vintage pinned when the thread was opened. */
  readonly pinnedVintage: PinnedVintage;
  readonly comments: readonly Comment[];
  readonly assignment: Assignment | null;
  readonly activity: readonly ActivityEntry[];
}

type EventKind = ActivityEntry['kind'];

interface CollabEvent {
  readonly kind: EventKind;
  readonly threadId: string;
  readonly actorUserId: string;
  readonly at: string;
  readonly subject?: GovernedRef;
  readonly pinnedVintage?: PinnedVintage;
  readonly comment?: Comment;
  readonly commentId?: string;
  readonly assignment?: Assignment;
  readonly detail: string;
}

/** Raised on invalid input or a failed reference/mention resolution. Mapped to 400/404. */
export class CollaborationValidationError extends Error {
  constructor(message: string, readonly status: 400 | 404 = 400) {
    super(message);
    this.name = 'CollaborationValidationError';
  }
}

/** Server-side resolvers. The caller supplies real governed lookups — nothing is assumed here. */
export interface CollaborationResolvers {
  /** True only when the governed object EXISTS and belongs to this tenant. */
  resolveObject(tenantId: string, ref: GovernedRef): boolean | Promise<boolean>;
  /** Enabled user ids of exactly this tenant. Used to resolve mentions; never cross-tenant. */
  tenantMembers(tenantId: string): readonly string[];
}

let persistence: PersistenceService | null = null;

export function resolveCollaborationDataDir(): string {
  return path.join(resolveDataDir(), COLLABORATION_DATA_SUBDIR);
}

export function getCollaborationPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveCollaborationDataDir() });
  return persistence;
}

export function resetCollaborationPersistence(): void {
  persistence = null;
}

function isEvent(r: PersistedRecord): boolean {
  return typeof r.dedupKey === 'string' && r.dedupKey.startsWith(EVENT_PREFIX);
}

export function isObjectKind(v: unknown): v is ObjectKind {
  return typeof v === 'string' && (OBJECT_KINDS as readonly string[]).includes(v);
}

/** Validate a governed reference SHAPE. Existence is checked separately, server-side. */
export function validateRef(input: unknown): GovernedRef {
  if (input === null || typeof input !== 'object') throw new CollaborationValidationError('governed-ref-required');
  const o = input as Record<string, unknown>;
  if (!isObjectKind(o.kind)) throw new CollaborationValidationError('invalid-object-kind');
  if (typeof o.id !== 'string' || o.id.trim() === '') throw new CollaborationValidationError('invalid-object-id');
  return Object.freeze({ kind: o.kind, id: o.id });
}

/** Fold the append-only event log into current state, deterministically by `seq`. */
function fold(store: PersistenceService, tenantId: string, ownerUserId: string): Map<string, Thread> {
  const ordered = [...store.listOrdered(tenantId, ownerUserId).filter(isEvent)].sort((a, b) => a.seq - b.seq);
  const threads = new Map<string, Thread>();

  for (const r of ordered) {
    const e = r.payload as CollabEvent;
    const entry: ActivityEntry = { kind: e.kind, actorUserId: e.actorUserId, at: e.at, detail: e.detail };

    if (e.kind === 'thread-created') {
      if (!threads.has(e.threadId) && e.subject && e.pinnedVintage) {
        threads.set(e.threadId, {
          threadId: e.threadId,
          subject: e.subject,
          createdBy: e.actorUserId,
          createdAt: e.at,
          pinnedVintage: e.pinnedVintage,
          comments: [],
          assignment: null,
          activity: [entry],
        });
      }
      continue;
    }

    const t = threads.get(e.threadId);
    if (!t) continue; // event for an unknown/deleted thread — ignored, never resurrected

    if (e.kind === 'thread-deleted') { threads.delete(e.threadId); continue; }

    const activity = [...t.activity, entry];
    if (e.kind === 'comment-added' && e.comment) {
      threads.set(e.threadId, { ...t, comments: [...t.comments, e.comment], activity });
    } else if (e.kind === 'comment-deleted' && e.commentId) {
      threads.set(e.threadId, { ...t, comments: t.comments.filter((c) => c.commentId !== e.commentId), activity });
    } else if (e.kind === 'assigned' && e.assignment) {
      threads.set(e.threadId, { ...t, assignment: e.assignment, activity });
    } else if (e.kind === 'unassigned') {
      threads.set(e.threadId, { ...t, assignment: null, activity });
    }
  }
  return threads;
}

function appendEvent(store: PersistenceService, tenantId: string, ownerUserId: string, e: CollabEvent): void {
  const seqHint = store.listOrdered(tenantId, ownerUserId).filter(isEvent).length + 1;
  store.append({
    tenantId,
    ownerUserId,
    dedupKey: `${EVENT_PREFIX}${seqHint}\u0000${e.kind}\u0000${e.threadId}\u0000${e.commentId ?? ''}`,
    payload: e,
  });
}

// ── Queries ─────────────────────────────────────────────────────────────────────────────────

export function listThreads(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getCollaborationPersistence(),
): readonly Thread[] {
  return Object.freeze([...fold(store, tenantId, ownerUserId).values()]);
}

export function readThread(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  store: PersistenceService = getCollaborationPersistence(),
): Thread | undefined {
  return fold(store, tenantId, ownerUserId).get(threadId);
}

/**
 * NS-5 disclosure: compare a thread's PINNED vintage with the CURRENT governed vintage.
 *
 * A mismatch is DISCLOSED, never corrected — the thread keeps its original pin, and no
 * historical vintage is fabricated or claimed retrievable.
 */
export function vintageStatus(
  thread: Thread,
  current: PinnedVintage,
): { readonly matchesCurrent: boolean; readonly pinned: PinnedVintage; readonly current: PinnedVintage; readonly disclosure: string } {
  const matchesCurrent =
    thread.pinnedVintage.asOf === current.asOf &&
    thread.pinnedVintage.dataVersion === current.dataVersion &&
    thread.pinnedVintage.mode === current.mode;
  return Object.freeze({
    matchesCurrent,
    pinned: thread.pinnedVintage,
    current,
    disclosure: matchesCurrent
      ? 'pinned vintage matches the current governed vintage'
      : 'pinned vintage DIFFERS from the current governed vintage — this thread references an earlier observation; the pinned vintage is recorded but is NOT retrievable, and the thread is not re-pinned',
  });
}

// ── Commands ────────────────────────────────────────────────────────────────────────────────

export async function createThread(
  tenantId: string,
  ownerUserId: string,
  threadId: unknown,
  subjectInput: unknown,
  pinnedVintage: PinnedVintage,
  resolvers: CollaborationResolvers,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): Promise<Thread> {
  if (typeof threadId !== 'string' || threadId.trim() === '') throw new CollaborationValidationError('threadId-required');
  const subject = validateRef(subjectInput);
  // Reference integrity (INT-013): the governed object must EXIST in THIS tenant.
  if (!(await resolvers.resolveObject(tenantId, subject))) {
    throw new CollaborationValidationError('governed-object-not-found', 404);
  }
  if (fold(store, tenantId, ownerUserId).has(threadId)) throw new CollaborationValidationError('thread-exists');

  appendEvent(store, tenantId, ownerUserId, {
    kind: 'thread-created', threadId, actorUserId: ownerUserId, at: now,
    subject, pinnedVintage, detail: `thread opened on ${subject.kind}:${subject.id}`,
  });
  return readThread(tenantId, ownerUserId, threadId, store)!;
}

export async function addComment(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  input: { text: unknown; mentions?: unknown; references?: unknown },
  pinnedVintage: PinnedVintage,
  resolvers: CollaborationResolvers,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): Promise<Thread> {
  if (!fold(store, tenantId, ownerUserId).has(threadId)) throw new CollaborationValidationError('thread-not-found', 404);
  if (typeof input.text !== 'string' || input.text.trim() === '') throw new CollaborationValidationError('comment-text-required');

  // Mentions: resolved against the TENANT roster. An unknown or cross-tenant handle is
  // REJECTED — never stored as arbitrary free text.
  const members = resolvers.tenantMembers(tenantId);
  const rawMentions = input.mentions === undefined ? [] : input.mentions;
  if (!Array.isArray(rawMentions)) throw new CollaborationValidationError('invalid-mentions');
  const mentions = rawMentions.map((m) => {
    if (typeof m !== 'string' || m.trim() === '') throw new CollaborationValidationError('invalid-mention');
    if (!members.includes(m)) throw new CollaborationValidationError('mention-not-resolvable', 404);
    return m;
  });

  // Sharing BY REFERENCE: each cited object must resolve in THIS tenant.
  const rawRefs = input.references === undefined ? [] : input.references;
  if (!Array.isArray(rawRefs)) throw new CollaborationValidationError('invalid-references');
  const references: GovernedRef[] = [];
  for (const r of rawRefs) {
    const ref = validateRef(r);
    if (!(await resolvers.resolveObject(tenantId, ref))) {
      throw new CollaborationValidationError('governed-object-not-found', 404);
    }
    references.push(ref);
  }

  const comment: Comment = Object.freeze({
    commentId: `c-${fold(store, tenantId, ownerUserId).get(threadId)!.comments.length + 1}-${now}`,
    text: input.text,
    authorUserId: ownerUserId,
    createdAt: now,
    mentions: Object.freeze(mentions),
    references: Object.freeze(references),
    pinnedVintage, // NS-5
  });

  appendEvent(store, tenantId, ownerUserId, {
    kind: 'comment-added', threadId, actorUserId: ownerUserId, at: now,
    comment, commentId: comment.commentId, detail: `comment added${mentions.length > 0 ? ` mentioning ${mentions.join(', ')}` : ''}`,
  });
  return readThread(tenantId, ownerUserId, threadId, store)!;
}

export function deleteComment(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  commentId: string,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  const t = fold(store, tenantId, ownerUserId).get(threadId);
  if (!t || !t.comments.some((c) => c.commentId === commentId)) return false;
  appendEvent(store, tenantId, ownerUserId, {
    kind: 'comment-deleted', threadId, actorUserId: ownerUserId, at: now, commentId, detail: 'comment deleted',
  });
  return true;
}

export function assignThread(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  assigneeUserId: unknown,
  resolvers: CollaborationResolvers,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): Thread {
  if (!fold(store, tenantId, ownerUserId).has(threadId)) throw new CollaborationValidationError('thread-not-found', 404);
  if (typeof assigneeUserId !== 'string' || assigneeUserId.trim() === '') throw new CollaborationValidationError('assignee-required');
  if (!resolvers.tenantMembers(tenantId).includes(assigneeUserId)) {
    throw new CollaborationValidationError('assignee-not-resolvable', 404);
  }
  appendEvent(store, tenantId, ownerUserId, {
    kind: 'assigned', threadId, actorUserId: ownerUserId, at: now,
    assignment: { assigneeUserId, assignedBy: ownerUserId, assignedAt: now },
    detail: `assigned to ${assigneeUserId}`,
  });
  return readThread(tenantId, ownerUserId, threadId, store)!;
}

export function unassignThread(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  const t = fold(store, tenantId, ownerUserId).get(threadId);
  if (!t || t.assignment === null) return false;
  appendEvent(store, tenantId, ownerUserId, {
    kind: 'unassigned', threadId, actorUserId: ownerUserId, at: now, detail: 'assignment cleared',
  });
  return true;
}

export function deleteThread(
  tenantId: string,
  ownerUserId: string,
  threadId: string,
  store: PersistenceService = getCollaborationPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  if (!fold(store, tenantId, ownerUserId).has(threadId)) return false;
  appendEvent(store, tenantId, ownerUserId, {
    kind: 'thread-deleted', threadId, actorUserId: ownerUserId, at: now, detail: 'thread deleted',
  });
  return true;
}

/** The standing UI10 scope statement, carried on every response and rendered on the surface. */
export const COLLABORATION_SCOPE = Object.freeze({
  ns5: 'Every thread and comment pins the governed vintage (dataVersion/asOf/mode) in force when it was authored.',
  vintageAvailability:
    'Only the vintage the platform currently exposes can be pinned. Authoring against an arbitrary historical vintage is NOT available, and a pinned earlier vintage is NOT retrievable (R-2). No historical vintage is fabricated.',
  referenceIntegrity:
    'Threads and comments may reference ONLY governed IIPS objects that resolve server-side within the tenant. Raw provider records cannot be referenced.',
  sharing:
    'Sharing is BY REFERENCE inside a thread. There is no object-level ACL and no cross-user permission model (M-5/G3 out of scope).',
});
