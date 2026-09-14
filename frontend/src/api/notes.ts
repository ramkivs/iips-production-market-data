/**
 * Program v3.0 — P-2: typed API client for the governed Notes surface.
 *
 * Consumes GET /api/notes and POST /api/notes ONLY. Mirrors the server contract 1:1 —
 * no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   D-2   Notes are immutable — there is NO update and NO delete function.
 *   D-4   Owner scoping is server-enforced; the client never supplies tenant/owner/author.
 *   S-4   The request carries ONLY `body`.
 *   S-5   Body is plain text, unbounded — the client performs no length check and no markup
 *         processing. It is sent and rendered verbatim.
 *   S-7   Ordering is server-canonical; the client never re-sorts.
 */
import { authFetch } from './authFetch';

export interface NotesProvenance {
  readonly dataSource: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface NoteItem {
  readonly noteId: string;
  readonly body: string;
  readonly authorUserId: string;
  readonly createdAt: string;
}

export interface NotesListEnvelope {
  readonly data: readonly NoteItem[];
  readonly provenance: NotesProvenance;
}

export interface NoteCreatedEnvelope {
  readonly data: NoteItem;
  readonly provenance: NotesProvenance;
}

/** Fetch the authenticated principal's OWN notes (server-scoped), createdAt DESC. */
export async function fetchNotes(): Promise<NotesListEnvelope> {
  const res = await authFetch('/api/notes');
  if (!res.ok) throw new Error(`notes request failed: ${res.status}`);
  return (await res.json()) as NotesListEnvelope;
}

/**
 * Create one immutable note. Only `body` is supplied — tenant, owner and author identity are
 * all derived server-side from the authenticated principal.
 */
export async function createNote(body: string): Promise<NoteCreatedEnvelope> {
  const res = await authFetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`create note failed: ${res.status}`);
  return (await res.json()) as NoteCreatedEnvelope;
}
