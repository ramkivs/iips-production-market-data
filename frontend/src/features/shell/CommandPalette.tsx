/**
 * Program v3.0 — P-1: Command Palette (Global Search / Commands / Account Context).
 *
 * ONE overlay mounted in the AppShell. Strictly composition-only over existing governed
 * authorities (G1–G7 recorded, IIPS-P1-SEARCH-PALETTE-ACCOUNT-DECISION.md):
 *
 *   A. Global Search — the existing Decision-Matrix sector/company name universe
 *      (fetchDecisionMatrixData). Case-insensitive substring/prefix matching, verbatim
 *      governed sector names, payload order (no ranking/scoring/fuzzy/recent-search).
 *      Results deep-link to existing governed surfaces (/research/company/:sector).
 *   B. Command Palette — existing role-filtered navigation commands (visibleNav(role))
 *      + the Search entry + the existing Sign out action. No new mutations/workflows.
 *   C. Account Context — existing Session/useAuth only: username/userId, tenantId,
 *      role(s), authentication state, Sign out. NO email, no new identity fields.
 *
 * Authorization is inherited — visibleNav for commands, the authFetch-backed decision-matrix
 * client for search, Session/useAuth for account. No second authorization model; results never
 * expose information the user could not already reach through the governed surface.
 *
 * Interaction primitives reused (no new framework): Modal (focus trap, Escape, focus restore
 * via useDialogFocus) + useTabList (arrow-key list navigation, roving tabindex) + existing
 * LoadingState/EmptyState/ErrorState. The Ctrl+K / Cmd+K shortcut is wired in AppShell.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/interaction/InteractionComponents';
import { useTabList } from '../../components/interaction/useTabList';
import { LoadingState, EmptyState, ErrorState } from '../../components/state/StateComponents';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { visibleNav } from '../../app/navigation';
import { useSession } from '../../core/session/SessionContext';
import { useAuth } from '../../core/auth/AuthProvider';

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface PaletteEntry {
  readonly label: string;
  readonly destination: string;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { session } = useSession();
  const { status, logout } = useAuth();

  const [query, setQuery] = useState('');
  const [companies, setCompanies] = useState<MatrixCompany[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState('');

  // One-time governed fetch of the decision-matrix sector universe, on first open (lazy).
  useEffect(() => {
    if (open && companies === null && !searchError && !loading) {
      setLoading(true);
      fetchDecisionMatrixData()
        .then((d) => setCompanies([...d.companies]))
        .catch((e: unknown) => setSearchError(String(e)))
        .finally(() => setLoading(false));
    }
  }, [open, companies, searchError, loading]);

  // Commands = existing role-filtered navigation (never a second authorization model).
  const commands = useMemo(() => visibleNav(session.role), [session.role]);

  // Search: case-insensitive substring (prefix inclusive) over governed sector names.
  const results = useMemo(() => {
    if (!companies) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return companies.filter((c) => c.sector.toLowerCase().includes(q));
  }, [companies, query]);

  // List entries: commands when idle, search results while a query is present.
  const entries = useMemo<PaletteEntry[]>(() => {
    if (query.trim() !== '') {
      return results.map((c) => ({ label: c.sector, destination: `/research/company/${c.sector}` }));
    }
    return commands.map((n) => ({ label: n.label, destination: n.path }));
  }, [query, results, commands]);

  const labels = entries.map((e) => e.label);
  const safeActive = labels.includes(active) ? active : (labels[0] ?? '');
  const { tabProps, onKeyDown } = useTabList(labels, safeActive, setActive);

  function close() {
    setQuery('');
    setActive('');
    onClose();
  }

  function select(entry: PaletteEntry) {
    navigate(entry.destination);
    close();
  }

  return (
    <Modal open={open} onClose={close} title="Command Palette">
      <input
        data-testid="palette-search"
        type="search"
        aria-label="Search sectors or commands"
        placeholder="Search sectors or run a command…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(''); }}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)', fontSize: 14 }}
      />

      <div role="tablist" aria-label="Palette results" onKeyDown={onKeyDown} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflow: 'auto' }}>
        {loading && <LoadingState />}
        {!loading && searchError && <ErrorState message={`Unable to load search data: ${searchError}`} />}
        {!loading && !searchError && entries.length === 0 && (
          <EmptyState label={query.trim() !== '' ? 'No matching sector' : 'No commands available'} />
        )}
        {!loading && !searchError && entries.map((entry, i) => (
          <button
            key={entry.destination}
            type="button"
            {...tabProps(entry.label, i)}
            data-testid={`palette-entry-${entry.label}`}
            onClick={() => select(entry)}
            style={{ textAlign: 'left', padding: '8px 10px', border: 'none', borderRadius: 4, background: entry.label === safeActive ? 'var(--color-surface-2)' : 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-ink)' }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* Account context — existing Session/useAuth only; no email, no new identity fields. */}
      <div data-testid="palette-account" style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        <div data-testid="palette-username">User: {session.userId}</div>
        <div data-testid="palette-tenant">Tenant: {session.tenantId}</div>
        <div data-testid="palette-role">Role: {session.role}{session.roles && session.roles.length ? ` (${session.roles.join(', ')})` : ''}</div>
        <div data-testid="palette-auth-status">Auth: {status}</div>
        {status === 'authenticated' && (
          <button type="button" data-testid="palette-sign-out" onClick={() => { void logout(); close(); }} style={{ marginTop: 8, padding: '6px 12px' }}>
            Sign out
          </button>
        )}
      </div>
    </Modal>
  );
}
