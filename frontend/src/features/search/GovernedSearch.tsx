/**
 * P13-B-06 — UI13 GOVERNED SEARCH (bound to the certified C7 contract).
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 * D90: mode-aware UI12 propagation with discriminated DegradedData guard.
 *
 * ⚠ Matching and ordering are performed SERVER-SIDE by the certified C7 contract
 *   (deterministic order by objectType then canonical identity). React does not re-sort.
 * ⚠ FAIL-CLOSED: an unresolved identity is reported as unresolved. No placeholder,
 *   no coerced match, no synthesized result.
 * ⚠ This surface is NOT certified. Lineage is disclosed, never inferred.
 */
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { isDegraded, type DegradedData } from '../../api/dataMode';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable';
import { executeSearch, type P12SearchResult } from '../../api/p12Search';
import { P12ApiError, type P12Envelope } from '../../api/p12Screener';
import { DataTable } from '../../components/data/DataComponents';
import { ErrorState, LoadingState } from '../../components/state/StateComponents';
import {
  GovernanceLimitationsNote,
  P12ProvenancePanel,
  QualityBadge,
  TransportDisclosurePanel,
} from '../../components/provenance/P12Provenance';

type Hit = P12SearchResult['results'][number];

export function GovernedSearch() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<P12Envelope<P12SearchResult> | DegradedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (q: string) => {
    if (q.trim() === '') { setData(null); setError(null); return; }
    setLoading(true);
    try {
      setData(await executeSearch({ q: q.trim() }));
      setError(null);
    } catch (e) {
      setData(null);
      setError(e instanceof P12ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  if (isDegraded(data)) {
    return <DataModeUnavailable data={data} title="Governed Search" />;
  }

  const envelope = data;
  const result = envelope?.data ?? null;

  return (
    <section aria-label="Governed Search">
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Search</h1>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed object search executed by the certified P12 object-resolution contract (C7).
          Results are returned in the contract's deterministic order.
        </p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); void run(query); }}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <input
          type="search" aria-label="Search governed objects" data-testid="search-input"
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies, securities, evidence…"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" data-testid="search-submit">Search</button>
      </form>

      {loading && <LoadingState />}
      {error && <div data-testid="search-error"><ErrorState message={`Search refused: ${error}`} /></div>}

      {!loading && !error && result && (
        <>
          <p data-testid="search-result-count" style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
            {result.totalMatches} governed matches
            {result.truncated && ' · result set truncated by the contract'}
          </p>

          <DataTable
            columns={[
              { key: 'objectType', header: 'Type', render: (h: Hit) => h.objectType },
              {
                key: 'id', header: 'Object',
                render: (h: Hit) => (h.sector
                  ? <Link to={`/research/company/${h.sector}`}>{h.name ?? h.id}</Link>
                  : (h.name ?? h.id)),
              },
              { key: 'canonicalSecurityId', header: 'Canonical ID', render: (h: Hit) => h.canonicalSecurityId ?? '—' },
              {
                key: 'quality', header: 'Quality',
                render: (h: Hit) => (h.quality ? <QualityBadge quality={h.quality} completenessPct={h.completenessPct} /> : '—'),
              },
              { key: 'asOf', header: 'As of', render: (h: Hit) => <code style={{ fontSize: 11 }}>{h.asOf}</code> },
            ]}
            rows={[...result.results]}
            emptyLabel="No governed objects match this query"
          />

          {envelope && (
            <>
              <P12ProvenancePanel provenance={envelope.provenance} />
              <TransportDisclosurePanel disclosure={envelope.transportDisclosure} lineage={envelope.lineage} />
              <GovernanceLimitationsNote limitations={envelope.governanceLimitations} />
            </>
          )}
        </>
      )}
    </section>
  );
}
