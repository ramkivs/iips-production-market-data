/**
 * UI10 — COLLABORATION (first-class governed surface).
 *
 * Authority: D83 (UI10 Collaboration recovery), authorized by D83-R1.
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-013** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI10 Collaboration — NEW":
 *              comments, mentions, shared research/watchlists, assignments, activity;
 *              must reference **governed IIPS objects**, never raw provider records.
 *
 * Route: /collaboration (viewer+ may READ; authoring requires analyst-and-above, server-enforced).
 *
 * ⚠ RECOVERY NOTE. INT-013 recorded UI10 as "Existing capability: NONE" (positive absence), yet
 *   P13 accepted it against a view-model with no consumers and the reconciliation later recorded
 *   it ABSENT. This is the first UI10 implementation. Historical records are NOT edited — the
 *   correction is by addition in the D83 governance record.
 *
 * ⚠ NS-5. Every thread and comment carries the governed vintage pinned at authoring time. When
 *   the current governed vintage differs, the MISMATCH IS SHOWN — the thread is never silently
 *   re-pinned, the earlier vintage is not retrievable, and nothing is fabricated.
 *
 * ⚠ Sharing is BY REFERENCE only. There is no object-level ACL and no cross-user permission
 *   model (M-5/G3 out of scope); threads are owner-scoped like every other recovered surface.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  addComment,
  assignThread,
  createThread,
  deleteThread,
  fetchThreads,
  type CollaborationProvenance,
  type CollaborationScope,
  type ObjectKind,
  type ThreadView,
} from '../../api/collaboration';
import { LoadingState, ErrorState, EmptyState } from '../../components/state/StateComponents';

export function Collaboration() {
  const [threads, setThreads] = useState<readonly ThreadView[] | null>(null);
  const [kinds, setKinds] = useState<readonly ObjectKind[]>([]);
  const [scope, setScope] = useState<CollaborationScope | null>(null);
  const [provenance, setProvenance] = useState<CollaborationProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');
  const [newKind, setNewKind] = useState<ObjectKind>('company');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [commentText, setCommentText] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const env = await fetchThreads();
      setThreads(env.data);
      setKinds(env.objectKinds);
      setScope(env.scope);
      setProvenance(env.provenance);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<void>): Promise<void> {
    try { await fn(); await load(); } catch (e: unknown) { setError(String(e)); }
  }

  if (loading) return <LoadingState />;
  if (error !== null && threads === null) return <ErrorState message={error} />;

  return (
    <section data-testid="collaboration-surface">
      <h1 style={{ fontSize: 22, margin: 0 }}>Collaboration</h1>
      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 13, margin: '6px 0 0' }}>
        Discussion threads attached to governed IIPS objects. Each thread pins the data vintage it
        references. Your threads only.
      </p>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input data-testid="thread-new-id" placeholder="thread id" value={newId} onChange={(e) => setNewId(e.target.value)} />
        <select data-testid="thread-new-kind" value={newKind} onChange={(e) => setNewKind(e.target.value as ObjectKind)}>
          {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <input
          data-testid="thread-new-subject"
          placeholder="governed object id"
          value={newSubjectId}
          onChange={(e) => setNewSubjectId(e.target.value)}
        />
        <button
          type="button"
          data-testid="thread-create"
          disabled={newId.trim() === '' || newSubjectId.trim() === ''}
          onClick={() => { void run(async () => {
            await createThread(newId, { kind: newKind, id: newSubjectId });
            setNewId(''); setNewSubjectId('');
          }); }}
        >
          Open thread
        </button>
      </div>

      {error !== null && <p data-testid="collaboration-error" style={{ fontSize: 13 }}>{error}</p>}

      {threads !== null && threads.length === 0 && <EmptyState label="No collaboration threads yet" />}

      {(threads ?? []).map((t) => (
        <article
          key={t.threadId}
          data-testid={`thread-${t.threadId}`}
          style={{ marginTop: 20, border: '1px solid var(--color-border)', borderRadius: 6, padding: 12 }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>
              {t.subject.kind}: {t.subject.id}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>{t.totalComments} comment(s)</span>
            <button type="button" data-testid={`thread-delete-${t.threadId}`} onClick={() => { void run(() => deleteThread(t.threadId)); }}>
              Delete
            </button>
          </header>

          {/* NS-5 pinned vintage + mismatch disclosure. */}
          <p data-testid={`vintage-${t.threadId}`} style={{ fontSize: 12, margin: '8px 0 0' }}>
            pinned as of <code>{t.pinnedVintage.asOf}</code> · <code>{t.pinnedVintage.dataVersion}</code> ·{' '}
            {t.vintageStatus.matchesCurrent ? 'current' : 'DIFFERS from current'}
          </p>
          {!t.vintageStatus.matchesCurrent && (
            <p data-testid={`vintage-mismatch-${t.threadId}`} style={{ fontSize: 12, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
              {t.vintageStatus.disclosure}
            </p>
          )}

          <p data-testid={`assignment-${t.threadId}`} style={{ fontSize: 12, margin: '4px 0 0' }}>
            {t.assignment === null ? 'unassigned' : `assigned to ${t.assignment.assigneeUserId} by ${t.assignment.assignedBy}`}
          </p>

          <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13 }}>
            {t.comments.map((c) => (
              <li key={c.commentId} data-testid={`comment-${c.commentId}`}>
                <strong>{c.authorUserId}</strong>: {c.text}
                {c.mentions.length > 0 && (
                  <span style={{ color: 'var(--color-ink-secondary)' }}> · mentions {c.mentions.join(', ')}</span>
                )}
                {c.references.length > 0 && (
                  <span style={{ color: 'var(--color-ink-secondary)' }}>
                    {' '}· refs {c.references.map((r) => `${r.kind}:${r.id}`).join(', ')}
                  </span>
                )}
                <span style={{ color: 'var(--color-ink-secondary)' }}> · pinned {c._pinnedVintage.asOf}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              data-testid={`comment-input-${t.threadId}`}
              placeholder="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="button"
              data-testid={`comment-add-${t.threadId}`}
              disabled={commentText.trim() === ''}
              onClick={() => { void run(async () => { await addComment(t.threadId, commentText); setCommentText(''); }); }}
            >
              Comment
            </button>
            <button
              type="button"
              data-testid={`assign-${t.threadId}`}
              onClick={() => { void run(() => assignThread(t.threadId, t.createdBy)); }}
            >
              Assign to me
            </button>
          </div>

          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, cursor: 'pointer' }}>Activity</summary>
            <ul data-testid={`activity-${t.threadId}`} style={{ fontSize: 12, paddingLeft: 18 }}>
              {t.activity.map((a, i) => (
                <li key={`${a.kind}-${i}`}>{a.at} · {a.actorUserId} · {a.detail}</li>
              ))}
            </ul>
          </details>
        </article>
      ))}

      {scope !== null && (
        <p data-testid="collaboration-scope" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 20 }}>
          <strong>Scope.</strong> {scope.ns5} {scope.vintageAvailability} {scope.referenceIntegrity} {scope.sharing}
        </p>
      )}
      {provenance !== null && (
        <p data-testid="collaboration-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 8 }}>
          {provenance.dataSource} · as of {provenance.asOf} · {provenance.mode}
        </p>
      )}
    </section>
  );
}

export default Collaboration;
