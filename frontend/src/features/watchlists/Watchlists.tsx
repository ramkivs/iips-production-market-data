/**
 * UI07 — WATCHLISTS (first-class governed surface).
 *
 * Authority: D81 (UI07 Watchlists recovery), authorized by D81-R1.
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-011a** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI07 Watchlists — NEW":
 *              *persistent lists, triggers, score-change detection*.
 *
 * Route: /watchlists (viewer+ may READ; mutations require analyst-and-above, server-enforced).
 *
 * ⚠ RECOVERY NOTE. `docs/P13_UI_SURFACE_COMPONENT_RECONCILIATION.md` mapped UI07 to
 *   `NotesDrawer.tsx` ("Implemented as embedded capability"). That was inaccurate against
 *   INT-011a, which records `grep -i watchlist` → 0 hits and disposition NEW: notes are
 *   immutable free-text entries with no lists, no membership and no triggers. The historical
 *   record is NOT edited — it is corrected by addition in the D81 governance record.
 *
 * ⚠ SCORE-CHANGE SEMANTICS (D81 §10-11). Deltas compare each item's PERSISTED BASELINE (the
 *   governed values observed when it was added) against the CURRENT governed value. This is NOT
 *   a live feed and NOT a time series: where values derive from the frozen v1.1 replay baseline
 *   every delta is legitimately zero. That is disclosed on the surface rather than hidden.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  addWatchlistItem,
  createWatchlist,
  deleteWatchlist,
  fetchWatchlists,
  removeWatchlistItem,
  type WatchlistView,
  type WatchlistsProvenance,
} from '../../api/watchlists';
import { LoadingState, ErrorState, EmptyState } from '../../components/state/StateComponents';

function fmt(v: number | null): string {
  return v === null ? 'unavailable' : String(v);
}

/** Render a delta without pass/fail colour — a delta is not a verdict. */
function Delta({ value }: { value: number | null }) {
  if (value === null) return <span>unavailable</span>;
  return <span>{value > 0 ? `+${value}` : String(value)}</span>;
}

export function Watchlists() {
  const [lists, setLists] = useState<readonly WatchlistView[] | null>(null);
  const [provenance, setProvenance] = useState<WatchlistsProvenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [itemId, setItemId] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const env = await fetchWatchlists();
      setLists(env.data);
      setProvenance(env.provenance);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      await load();
    } catch (e: unknown) {
      setError(String(e));
    }
  }

  if (loading) return <LoadingState />;
  if (error !== null && lists === null) return <ErrorState message={error} />;

  return (
    <section data-testid="watchlists-surface">
      <h1 style={{ fontSize: 22, margin: 0 }}>Watchlists</h1>
      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 13, margin: '6px 0 0' }}>
        Persistent lists of governed securities with user-defined triggers. Your lists only.
      </p>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          data-testid="watchlist-new-id"
          placeholder="watchlist id"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <input
          data-testid="watchlist-new-name"
          placeholder="name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          data-testid="watchlist-create"
          disabled={newId.trim() === ''}
          onClick={() => { void run(async () => { await createWatchlist(newId, newName); setNewId(''); setNewName(''); }); }}
        >
          Create watchlist
        </button>
      </div>

      {error !== null && <p data-testid="watchlists-error" style={{ fontSize: 13 }}>{error}</p>}

      {lists !== null && lists.length === 0 && <EmptyState label="No watchlists yet" />}

      {(lists ?? []).map((list) => (
        <article key={list.watchlistId} data-testid={`watchlist-${list.watchlistId}`} style={{ marginTop: 24, border: '1px solid var(--color-border)', borderRadius: 6, padding: 12 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>{list.name}</h2>
            <span style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>{list.totalItems} item(s)</span>
            <button
              type="button"
              data-testid={`watchlist-delete-${list.watchlistId}`}
              onClick={() => { void run(() => deleteWatchlist(list.watchlistId)); }}
            >
              Delete
            </button>
          </header>

          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              data-testid={`watchlist-add-id-${list.watchlistId}`}
              placeholder="canonicalSecurityId"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            />
            <button
              type="button"
              data-testid={`watchlist-add-${list.watchlistId}`}
              disabled={itemId.trim() === ''}
              onClick={() => { void run(async () => { await addWatchlistItem(list.watchlistId, itemId); setItemId(''); }); }}
            >
              Add security
            </button>
          </div>

          {list.items.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>No securities in this list.</p>
          ) : (
            <table style={{ width: '100%', marginTop: 12, fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Security</th>
                  <th style={{ textAlign: 'left' }}>Baseline</th>
                  <th style={{ textAlign: 'left' }}>Current</th>
                  <th style={{ textAlign: 'left' }}>Change</th>
                  <th style={{ textAlign: 'left' }}>Triggers</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.items.map((item) => {
                  const composite = item.deltas.find((d) => d.field === 'composite');
                  return (
                    <tr key={item.canonicalSecurityId} data-testid={`watchlist-item-${item.canonicalSecurityId}`}>
                      <td>
                        {item.canonicalSecurityId}
                        {item._quality !== undefined && (
                          <span style={{ color: 'var(--color-ink-secondary)' }}> · quality {item._quality}</span>
                        )}
                      </td>
                      <td data-testid={`baseline-${item.canonicalSecurityId}`}>{fmt(composite?.baselineValue ?? null)}</td>
                      <td data-testid={`current-${item.canonicalSecurityId}`}>{fmt(composite?.currentValue ?? null)}</td>
                      <td data-testid={`delta-${item.canonicalSecurityId}`}><Delta value={composite?.delta ?? null} /></td>
                      <td data-testid={`triggers-${item.canonicalSecurityId}`}>
                        {item.triggers.length === 0
                          ? 'none'
                          : item.triggers
                              .map((t) => `${t.field} ${t.op}${t.value === null ? '' : ` ${t.value}`}: ${t.fired === null ? 'not evaluated' : t.fired ? 'FIRED' : 'not fired'}`)
                              .join(' · ')}
                      </td>
                      <td>
                        <button
                          type="button"
                          data-testid={`watchlist-remove-${item.canonicalSecurityId}`}
                          onClick={() => { void run(() => removeWatchlistItem(list.watchlistId, item.canonicalSecurityId)); }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </article>
      ))}

      {provenance !== null && (
        <p data-testid="watchlists-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 20 }}>
          {provenance.dataSource} · as of {provenance.asOf} · {provenance.mode}
          <br />
          {provenance.transportSemantics}
        </p>
      )}
    </section>
  );
}

export default Watchlists;
