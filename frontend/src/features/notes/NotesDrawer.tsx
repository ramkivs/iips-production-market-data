/**
 * Program v3.0 — P-2: Notes drawer (S-9).
 *
 * Reuses the governed `Drawer` primitive (Escape-dismiss + focus trap via useDialogFocus).
 * Presentation-only: the server is the authority for scoping, ordering and identity.
 *
 * Recorded constraints reflected here:
 *   S-9a  TopBar affordance opens this drawer; AppShell owns the open/closed state.
 *   S-9b  Multi-line textarea + an EXPLICIT "Create note" button. No autosave, no implicit
 *         save, no keyboard-only submission convention.
 *   D-2   Notes are immutable and permanent — NO edit control and NO delete control exist.
 *   D-4   Self-scoped; only the caller's own notes are ever returned, so the displayed author
 *         identity is always the caller.
 *   S-5   Body is plain text, rendered verbatim. No Markdown/HTML/rich-text rendering and no
 *         sanitization layer — and no client-side length limit.
 *   S-7   Rendered in the received canonical order (createdAt DESC). Never re-sorted here.
 *   S-9   No route and no navigation entry is introduced by this surface.
 */
import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '../../components/interaction/InteractionComponents';
import { fetchNotes, createNote, type NoteItem } from '../../api/notes';

interface NotesDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotesDrawer({ open, onClose }: NotesDrawerProps) {
  const [items, setItems] = useState<readonly NoteItem[]>([]);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'denied'>('idle');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const env = await fetchNotes();
      setItems(env.data);
      setState('idle');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => { if (open) void load(); }, [open, load]);

  async function onCreate() {
    // S-9b: creation happens ONLY through this explicit action.
    if (creating) return;
    setCreating(true);
    try {
      await createNote(draft);
      setDraft('');
      await load(); // re-read so the server's canonical order is authoritative (S-7)
    } catch (e) {
      setState(String(e).includes('403') ? 'denied' : 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Notes">
      <div data-testid="notes-drawer-body">
        {/* S-9b — multi-line textarea + explicit Create note button. */}
        <label htmlFor="note-body" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
          New note
        </label>
        <textarea
          id="note-body"
          data-testid="note-body-input"
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13 }}
        />
        <button
          type="button"
          data-testid="note-create"
          onClick={() => { void onCreate(); }}
          disabled={creating}
          style={{ marginTop: 8 }}
        >
          Create note
        </button>

        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
          Notes are permanent and private to you. They cannot be edited or deleted.
        </p>

        {state === 'loading' && <p data-testid="notes-loading">Loading notes…</p>}
        {state === 'error' && (
          <p data-testid="notes-error" role="alert">Notes are unavailable.</p>
        )}
        {state === 'denied' && (
          <p data-testid="notes-denied" role="alert">You do not have permission to create notes.</p>
        )}
        {state === 'idle' && items.length === 0 && (
          <p data-testid="notes-empty">No notes.</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((n) => (
            <li
              key={n.noteId}
              data-testid="note-item"
              style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}
            >
              {/* S-5 — plain text, rendered verbatim. No markup interpretation. */}
              <p data-testid="note-body" style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {n.body}
              </p>
              <span data-testid="note-author" style={{ fontSize: 12, opacity: 0.7 }}>
                {n.authorUserId}
              </span>
              <time
                dateTime={n.createdAt}
                data-testid="note-created-at"
                style={{ display: 'block', fontSize: 12, opacity: 0.7 }}
              >
                {n.createdAt}
              </time>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  );
}
