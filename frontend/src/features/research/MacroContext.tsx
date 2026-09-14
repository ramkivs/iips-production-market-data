/**
 * Program v3.0 — WP-MACRO-03: Macro Context workspace (read-only, LIVE, 1:1).
 *
 * Route: /research/macro (Research → Macro, viewer+). A dedicated, read-only presentation of
 * the certified GET /api/macro surface — MoSPI national statistics (NAS / CPI / IIP) ONLY.
 *
 * Governance boundaries (IIPS-WP-MACRO-03-DECISION.md):
 *   - 1:1 MacroObservation presentation: values verbatim; null → "unavailable" (never 0);
 *     one observation per measure; no derived macro values; no interpretation/recommendations.
 *   - LIVE, never SNAPSHOT; retrievedAt = adapter FETCH time (never a publication date).
 *   - No CSIP duplication: sector ranking / opportunity / concentration / sector decisions /
 *     sector comparison belong to Cross-Sector Intelligence and are NOT rendered here.
 *   - Dataset selector = frozen APPROVED_DATASETS allowlist (NAS/CPI/IIP); no discovery endpoint.
 *   - Authorization inherited: authFetch Bearer → /api/macro → guardRead('macro').
 */
import { useEffect, useState } from 'react';
import {
  fetchMacroData,
  MacroApiError,
  MACRO_DATASETS,
  MACRO_DATASET_CONFIG,
  type MacroDataset,
  type MacroObservation,
} from '../../api/macro';
import { DataTable } from '../../components/data/DataComponents';
import { LoadingState, ErrorState, EmptyState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

function renderValue(o: MacroObservation): string {
  return o.value === null ? 'unavailable' : String(o.value);
}

export function MacroContext() {
  const [dataset, setDataset] = useState<MacroDataset>('IIP');
  const [observations, setObservations] = useState<readonly MacroObservation[] | null>(null);
  const [provenance, setProvenance] = useState<{ dataSource: string; transportSemantics: string } | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setObservations(null);
    setRetrievedAt(null);
    fetchMacroData(dataset)
      .then((d) => {
        if (!active) return;
        setObservations(d.data);
        setProvenance({ dataSource: d.provenance.dataSource, transportSemantics: d.provenance.transportSemantics });
        // All observations in one response share the adapter's single fetch-time stamp.
        setRetrievedAt(d.data[0]?.retrievedAt ?? null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof MacroApiError) setError({ code: e.code, message: e.message });
        else setError({ code: 'UNKNOWN', message: String(e) });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dataset]);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={
          error.code === 'SOURCE_UNAVAILABLE' ? 'Macro source is currently unavailable. No stale or substitute data is shown.'
          : error.code === 'SOURCE_CONTRACT' ? 'The macro source returned an unexpected response. No data is shown.'
          : error.code === 'INVALID_FILTER' || error.code === 'EXCLUDED_DATASET' ? 'This macro request is not supported by the certified source contract.'
          : `Unable to load macro data: ${error.message}`
        }
      />
    );
  }
  if (!observations || observations.length === 0) {
    return <EmptyState label="No macro observations returned by the certified source" />;
  }

  return (
    <section aria-label="Macro context">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Macro</h1>
          <CertifiedBadge />
          <FreshnessBadge state="live" />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed national statistics (MoSPI). Read-only, live, shown 1:1 — never derived or interpreted.
        </p>
      </header>

      {/* Frozen allowlist selector — NAS / CPI / IIP only (no discovery endpoint). */}
      <div data-testid="macro-dataset-selector" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13 }}>
          Dataset{' '}
          <select
            data-testid="macro-dataset-select"
            aria-label="Select macro dataset"
            value={dataset}
            onChange={(e) => setDataset(e.target.value as MacroDataset)}
            style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-0)' }}
          >
            {MACRO_DATASETS.map((d) => (
              <option key={d} value={d}>{d} — {MACRO_DATASET_CONFIG[d].label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* 1:1 MacroObservation table — one row per measure; null → unavailable. */}
      <DataTable
        columns={[
          { key: 'indicator', header: 'Indicator', render: (r: MacroObservation) => (r.indicator ?? 'unavailable') },
          { key: 'measure', header: 'Measure', render: (r: MacroObservation) => (r.measure ?? 'unavailable') },
          { key: 'value', header: 'Value', render: (r: MacroObservation) => renderValue(r) },
          { key: 'unit', header: 'Unit', render: (r: MacroObservation) => (r.unit ?? '—') },
          { key: 'referencePeriod', header: 'Period', render: (r: MacroObservation) => (r.referencePeriod ?? '—') },
          { key: 'frequency', header: 'Frequency', render: (r: MacroObservation) => (r.frequency ?? '—') },
          { key: 'baseYear', header: 'Base Year', render: (r: MacroObservation) => (r.baseYear ?? '—') },
          { key: 'series', header: 'Series', render: (r: MacroObservation) => (r.series ?? '—') },
          { key: 'status', header: 'Release / Status', render: (r: MacroObservation) => (r.status ?? '—') },
        ]}
        rows={observations}
        emptyLabel="No observations available"
      />

      {/* Provenance: LIVE source; retrievedAt = adapter FETCH time (never a publication date). */}
      <p data-testid="macro-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance?.dataSource ?? 'governed'} · freshness LIVE
        {provenance?.transportSemantics ? ` · ${provenance.transportSemantics}` : ''}
      </p>
      <p data-testid="macro-retrieved-at" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 4 }}>
        {retrievedAt ? `Retrieved at (fetch time): ${retrievedAt}` : 'Retrieval time unavailable'}
      </p>
    </section>
  );
}
