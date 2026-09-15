/**
 * P13-B-05 — UI05 GOVERNED SCREENER (bound to the certified C6 contract).
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 * D90: mode-aware UI12 propagation with discriminated DegradedData guard.
 *
 * This is the program's FIRST GENUINE SCREENER. The prior `Screener.tsx` composed the
 * certified Decision Matrix payload and filtered it in React; it was a filter-and-navigate
 * surface, not a governed screen. That surface is PRESERVED UNCHANGED at /screener.
 * This new surface is ADDITIVE at /screener/governed.
 *
 * ⚠ ALL governed decisions happen SERVER-SIDE in the certified C6 contract:
 *     - the closed 11-operator filter set
 *     - the deterministic total-order sort with identity tie-break
 *     - row degradation classification
 *     - worst-case quality propagation
 *   React submits criteria and renders the governed result. It does NOT filter, sort or
 *   classify. A C6 violation FAILS CLOSED and is surfaced as an error, never degraded.
 *
 * ⚠ UI05 IMPLEMENTATION IS NOT UI05 CERTIFICATION. This surface is not certified.
 * ⚠ Lineage is DUAL and is disclosed on the surface (P13-B-08).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isDegraded, type DegradedData } from '../../api/dataMode';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable';
import {
  executeScreen,
  P12ApiError,
  type P12Envelope,
  type P12Filter,
  type P12ScreenResult,
  type P12Sort,
} from '../../api/p12Screener';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';
import {
  DegradationLabel,
  GovernanceLimitationsNote,
  P12ProvenancePanel,
  QualityBadge,
  TransportDisclosurePanel,
} from '../../components/provenance/P12Provenance';

type Row = P12ScreenResult['rows'][number];

/** Sortable governed fields. The tie-break field is fixed to the identity field (SC-3). */
const SORT_FIELDS = ['composite', 'sector', 'verdict', 'canonicalSecurityId'] as const;
const TIE_BREAK_FIELD = 'canonicalSecurityId';

export function GovernedScreener() {
  const [data, setData] = useState<P12Envelope<P12ScreenResult> | DegradedData | null>(null);
  const [error, setError] = useState<{ message: string; rules: readonly string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter criteria — submitted to the server; NEVER applied locally.
  const [minComposite, setMinComposite] = useState('');
  const [sector, setSector] = useState('');
  const [sortField, setSortField] = useState<(typeof SORT_FIELDS)[number]>('composite');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

  const filters = useMemo<P12Filter[]>(() => {
    const f: P12Filter[] = [];
    if (minComposite.trim() !== '' && Number.isFinite(Number(minComposite))) {
      f.push({ field: 'composite', operator: 'gte', operand: Number(minComposite) });
    }
    if (sector.trim() !== '') {
      f.push({ field: 'sector', operator: 'contains', operand: sector.trim() });
    }
    return f;
  }, [minComposite, sector]);

  const sort = useMemo<P12Sort[]>(() => [{ field: sortField, direction }], [sortField, direction]);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const result = await executeScreen({ filters, sort, tieBreakField: TIE_BREAK_FIELD, screenId: 'ui05-adhoc' });
      setData(result);
      setError(null);
    } catch (e) {
      // Fail-closed: a governed contract violation clears the result rather than
      // presenting a partially-filtered or locally-approximated table.
      setData(null);
      setError(
        e instanceof P12ApiError
          ? { message: e.message, rules: e.rules }
          : { message: String(e), rules: [] },
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => { void run(); /* initial governed execution */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <section aria-label="Governed Screener">
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Governed Screener</h1>
        </header>
        <div data-testid="screener-error">
          <ErrorState message={`Governed screen refused: ${error.message}`} />
          {error.rules.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>
              Contract rules: {error.rules.join(', ')}
            </p>
          )}
        </div>
      </section>
    );
  }

  // D90: Degraded data guard MUST precede any SNAPSHOT shape dereference.
  if (isDegraded(data)) {
    return <DataModeUnavailable data={data} title="Governed Screener" />;
  }

  const envelope = data;
  const result = envelope?.data ?? null;

  return (
    <section aria-label="Governed Screener">
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Governed Screener</h1>
          {result && <QualityBadge quality={result.quality} />}
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Screening is executed server-side by the certified P12 screener contract (C6):
          closed operator set, deterministic total order with identity tie-break, and governed
          degradation labels. This surface submits criteria and renders the governed result.
        </p>
      </header>

      <div
        data-testid="governed-screener-filters"
        style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)', marginBottom: 16 }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>
            Composite ≥{' '}
            <input
              type="number" aria-label="Minimum composite" value={minComposite}
              onChange={(e) => setMinComposite(e.target.value)} style={{ width: 90 }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Sector contains{' '}
            <input
              type="text" aria-label="Sector contains" value={sector}
              onChange={(e) => setSector(e.target.value)} style={{ width: 140 }}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Sort by{' '}
            <select aria-label="Sort field" value={sortField} onChange={(e) => setSortField(e.target.value as typeof sortField)}>
              {SORT_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            Direction{' '}
            <select aria-label="Sort direction" value={direction} onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
          <button type="button" data-testid="run-screen" onClick={() => void run()}>Run governed screen</button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-ink-secondary)', margin: '8px 0 0' }}>
          Tie-break field: <code>{TIE_BREAK_FIELD}</code> (fixed — required for a deterministic total order).
        </p>
      </div>

      {result && (
        <>
          <p data-testid="governed-result-count" style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
            {result.totalRows} governed rows · screen <code>{result.screenId}</code> · mode {result.mode}
          </p>

          <DataTable
            columns={[
              { key: 'rank', header: '#', render: (r: Row) => r.rank },
              {
                key: 'canonicalSecurityId', header: 'Security',
                render: (r: Row) => <Link to={`/research/company/${r.sector}`}>{r.canonicalSecurityId}</Link>,
              },
              { key: 'sector', header: 'Sector', render: (r: Row) => r.sector },
              { key: 'verdict', header: 'Verdict', render: (r: Row) => r.verdict },
              { key: 'composite', header: 'Composite', render: (r: Row) => r.composite },
              {
                key: 'qualityAxis', header: 'Quality axis',
                // Null stays "unavailable" — never rendered as 0.
                render: (r: Row) => (r.qualityAxis === null ? 'unavailable' : r.qualityAxis),
              },
              {
                key: 'valuation', header: 'Valuation',
                render: (r: Row) => (r.valuation === null ? 'unavailable' : r.valuation),
              },
              { key: '_degradation', header: 'Degradation', render: (r: Row) => <DegradationLabel degradation={r._degradation} /> },
              { key: '_rowAsOf', header: 'As of', render: (r: Row) => <code style={{ fontSize: 11 }}>{r._rowAsOf}</code> },
            ]}
            rows={[...result.rows]}
            emptyLabel="No rows satisfy the governed criteria"
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
