/**
 * Program v3.0 — P-2: governed Notes service (PF-1 consumer).
 *
 * CONTROLLING AUTHORITY (IIPS-P2-NOTES-IMPLEMENTATION-SPECIFICATION-REISSUED.md):
 *   D-2   Notes are PF-1 durable, IMMUTABLE, append-only. No edit. No delete.
 *   D-3   Authorship is analyst-and-above via the EXISTING ranked readResourceGate('execute').
 *   D-4   Visibility is PRIVATE TO AUTHOR (owner-scoped).
 *   S-1a  Notes use a SEPARATE PF-1 instance with a DISTINCT dataDir.
 *   S-3   dataDir = <resolveDataDir()>/notes  →  <dataDir>/notes/journal.ndjson.
 *         P-1's journal (<dataDir>/journal.ndjson) is untouched and cannot be read from here.
 *   S-4   Only `body` is client-supplied; every identity/timestamp is server-derived.
 *   S-5   Body is UNBOUNDED and PLAIN TEXT ONLY — stored verbatim. There is deliberately NO
 *         length validator, NO truncation, NO sanitization, NO markup handling.
 *   S-7   Ordering is PF-1 canonical: createdAt DESC, seq DESC tiebreak. No pagination.
 *   S-10  dedupKey = randomUUID() minted per create request, so two identical bodies remain
 *         two distinct records (PF-1's append is a silent no-op on dedupKey collision).
 *
 * PF-1 is UNMODIFIED and consumed only through its promoted TD-2 primitives.
 * No scheduler, event bus, retry queue, rollback/transaction mechanism, notification
 * integration, second RBAC model, or new persistence technology exists in this module.
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';

/** S-3: the Notes subdirectory inside the governed TD-7a data directory. */
export const NOTES_DATA_SUBDIR = 'notes';

/** Persisted payload (S-4). Opaque to PF-1. No speculative fields. */
export interface NotePayload {
  /** The ONLY client-supplied value. Stored verbatim (S-5). */
  readonly body: string;
  /** Server-derived; equals ownerUserId under D-4. */
  readonly authorUserId: string;
}

/** Governed API DTO (S-4). PF-1 `read`/`updatedAt` are deliberately NOT exposed. */
export interface NoteDto {
  readonly noteId: string;
  readonly body: string;
  readonly authorUserId: string;
  readonly createdAt: string;
}

// --- Lazy process singleton (PF-1, separate instance per S-1a) ----------------------------

let persistence: PersistenceService | null = null;

/** S-3: resolve the Notes data directory as a subdirectory of the governed TD-7a directory. */
export function resolveNotesDataDir(): string {
  return path.join(resolveDataDir(), NOTES_DATA_SUBDIR);
}

/**
 * P-2's PF-1 handle — a SEPARATE PersistenceService instance (S-1a).
 *
 * Journal separation: notes live in <dataDir>/notes/journal.ndjson while P-1 notifications
 * live in <dataDir>/journal.ndjson. The two consumers are therefore PHYSICALLY isolated, so a
 * note can never surface in the P-1 notification list or affect its unread count — and no
 * payload type-discriminator is required.
 */
export function getNotesPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveNotesDataDir() });
  return persistence;
}

/** Test seam: reset the process singleton. */
export function resetNotesPersistence(): void {
  persistence = null;
}

/** Map a PF-1 record to the governed DTO (S-4). */
export function toNoteDto(record: PersistedRecord): NoteDto {
  const p = record.payload as NotePayload;
  return {
    noteId: record.recordId,
    body: p.body,
    authorUserId: p.authorUserId,
    createdAt: record.createdAt, // server-derived by PF-1
  };
}

/**
 * Create one durable, immutable note owned by the authenticated principal.
 *
 * `tenantId` and `ownerUserId` MUST be server-derived by the caller from the authenticated
 * Principal — this module never accepts them from an HTTP client (PF-1 TD-2 §5 invariant).
 *
 * S-5: `body` is written verbatim. No length check, truncation, or sanitization is performed.
 * S-10: a fresh randomUUID dedupKey guarantees identical bodies do not collapse.
 */
export function createNote(
  tenantId: string,
  ownerUserId: string,
  body: string,
  store: PersistenceService = getNotesPersistence(),
): NoteDto {
  const record = store.append({
    tenantId,
    ownerUserId,
    dedupKey: randomUUID(), // S-10 — unique per create request
    payload: { body, authorUserId: ownerUserId } satisfies NotePayload,
  });
  return toNoteDto(record);
}

/**
 * List the authenticated principal's OWN notes (D-4), in PF-1 canonical order
 * (S-7: createdAt DESC, seq DESC tiebreak). No pagination, no re-sorting.
 */
export function listNotes(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getNotesPersistence(),
): NoteDto[] {
  return store.listOrdered(tenantId, ownerUserId).map(toNoteDto);
}
