/**
 * Program v3.0 — P-5: Read-only Screener.
 *
 * Engine-aware, read-only screening surface over the governed company universe.
 * Composes the EXISTING certified Decision Matrix data (fetchDecisionMatrixData) — no new
 * endpoint, no new authority, no persistence, no recomputation. Renders governed values 1:1;
 * null quality/valuation are "unavailable" (never 0) and are excluded unless the
 * "Include unavailable" toggle is on (S4/A4). No explicit default sort (A5). Confidence and
 * conviction are OUT OF SCOPE (A2 = OMIT). Risk/growth/engine-dimension filters are DEFERRED (A1).
 *
 * Result rows navigate to the existing Company Intelligence trust chain
 * (/research/company/:sector). The Screener is a filter-and-navigate surface, NOT an
 * analytics engine.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import type { Verdict } from '../../components/decision/DecisionComponents';
import { DataTable } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

/** Null-safe numeric boundary from a raw text input. Empty → no boundary. */
function bound(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function Screener() {
  const [companies, setCompanies] = useState<MatrixCompany[] | null>(null);
  const [provenance, setProvenance] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY'>('SNAPSHOT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Accepted v1 filters (S3): sector · verdict · composite · quality · valuation.
  const [selectedSectors, setSelectedSectors] = useState<ReadonlySet<string>>(new Set());
  const [selectedVerdicts, setSelectedVerdicts] = useState<ReadonlySet<Verdict>>(new Set());
  const [compositeMin, setCompositeMin] = useState('');
  const [compositeMax, setCompositeMax] = useState('');
  const [qualityMin, setQualityMin] = useState('');
  const [qualityMax, setQualityMax] = useState('');
  const [valuationMin, setValuationMin] = useState('');
  const [valuationMax, setValuationMax] = useState('');
  // S4/A4: null quality/valuation excluded unless this toggle is on.
  const [includeUnavailable, setIncludeUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDecisionMatrixData()
      .then((d) => {
        if (!active) return;
        setCompanies([...d.companies]);
        setProvenance(d.provenance.dataSource);
        setFreshness(d.provenance.freshness);
        setError(null);
      })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const sectors = useMemo(
    () => companies ? Array.from(new Set(companies.map((c) => c.sector))) : [],
    [companies],
  );
  const verdicts = useMemo(
    () => companies ? Array.from(new Set(companies.map((c) => c.verdict))) : [],
    [companies],
  );

  /** Accepted filter semantics (S1/S3/S4): governed subsets only; no sort (A5). */
  const results = useMemo(() => {
    if (!companies) return [];
    const cMin = bound(compositeMin);
    const cMax = bound(compositeMax);
    const qMin = bound(qualityMin);
    const qMax = bound(qualityMax);
    const vMin = bound(valuationMin);
    const vMax = bound(valuationMax);
    // Preserve payload order exactly (no explicit default sort — A5).
    return companies.filter((c) => {
      if (selectedSectors.size > 0 && !selectedSectors.has(c.sector)) return false;
      if (selectedVerdicts.size > 0 && !selectedVerdicts.has(c.verdict)) return false;
      if (cMin !== null && c.composite < cMin) return false;
      if (cMax !== null && c.composite > cMax) return false;
      if (c.quality !== null) {
        if (qMin !== null && c.quality < qMin) return false;
        if (qMax !== null && c.quality > qMax) return false;
      }
      if (c.valuation !== null) {
        if (vMin !== null && c.valuation < vMin) return false;
        if (vMax !== null && c.valuation > vMax) return false;
      }
      // S4: null quality/valuation are excluded unless "Include unavailable" is on.
      if (!includeUnavailable && (c.quality === null || c.valuation === null)) return false;
      return true;
    });
  }, [companies, selectedSectors, selectedVerdicts, compositeMin, compositeMax, qualityMin, qualityMax, valuationMin, valuationMax, includeUnavailable]);

  const toggle = <T,>(set: ReadonlySet<T>, value: T): ReadonlySet<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load screener universe: ${error}`} />;
  if (!companies) return <UnavailableState />;

  return (
    <section aria-label="Screener">
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Screener</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed read-only screening over the certified company universe. Filter, then open a company for its certified trust chain.
        </p>
      </header>

      {/* Accepted v1 filters (S3): sector · verdict · composite · quality · valuation */}
      <div data-testid="screener-filters" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, alignSelf: 'center' }}>Sector</span>
          {sectors.map((s) => (
            <label key={s} style={{ fontSize: 13 }}>
              <input type="checkbox" checked={selectedSectors.has(s)} onChange={() => setSelectedSectors(toggle(selectedSectors, s))} /> {s}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, alignSelf: 'center' }}>Verdict</span>
          {verdicts.map((v) => (
            <label key={v} style={{ fontSize: 13 }}>
              <input type="checkbox" checked={selectedVerdicts.has(v)} onChange={() => setSelectedVerdicts(toggle(selectedVerdicts, v))} /> {v}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>Composite min <input type="number" aria-label="Composite minimum" value={compositeMin} onChange={(e) => setCompositeMin(e.target.value)} style={{ width: 80 }} /></label>
          <label style={{ fontSize: 13 }}>Composite max <input type="number" aria-label="Composite maximum" value={compositeMax} onChange={(e) => setCompositeMax(e.target.value)} style={{ width: 80 }} /></label>
          <label style={{ fontSize: 13 }}>Quality min <input type="number" aria-label="Quality minimum" value={qualityMin} onChange={(e) => setQualityMin(e.target.value)} style={{ width: 80 }} /></label>
          <label style={{ fontSize: 13 }}>Quality max <input type="number" aria-label="Quality maximum" value={qualityMax} onChange={(e) => setQualityMax(e.target.value)} style={{ width: 80 }} /></label>
          <label style={{ fontSize: 13 }}>Valuation min <input type="number" aria-label="Valuation minimum" value={valuationMin} onChange={(e) => setValuationMin(e.target.value)} style={{ width: 80 }} /></label>
          <label style={{ fontSize: 13 }}>Valuation max <input type="number" aria-label="Valuation maximum" value={valuationMax} onChange={(e) => setValuationMax(e.target.value)} style={{ width: 80 }} /></label>
        </div>
        <label style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
          <input type="checkbox" data-testid="include-unavailable" checked={includeUnavailable} onChange={(e) => setIncludeUnavailable(e.target.checked)} /> Include unavailable
        </label>
      </div>

      <p data-testid="screener-result-count" style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
        {results.length} of {companies.length} companies match
      </p>

      {/* Governed result table: accepted fields only (S5); no confidence/conviction (A2). */}
      <DataTable
        columns={[
          { key: 'sector', header: 'Company / Sector', render: (r: MatrixCompany) => <Link to={`/research/company/${r.sector}`}>{r.sector}</Link> },
          { key: 'verdict', header: 'Verdict', render: (r: MatrixCompany) => <DecisionBadge verdict={r.verdict} /> },
          { key: 'composite', header: 'Composite', render: (r: MatrixCompany) => r.composite },
          { key: 'quality', header: 'Quality', render: (r: MatrixCompany) => (r.quality === null ? 'unavailable' : r.quality) },
          { key: 'valuation', header: 'Valuation', render: (r: MatrixCompany) => (r.valuation === null ? 'unavailable' : r.valuation) },
        ]}
        rows={results}
        emptyLabel="No companies match the current filters"
      />

      <p data-testid="screener-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance ?? 'governed'} · freshness {freshness}
      </p>
    </section>
  );
}
