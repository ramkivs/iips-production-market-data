/**
 * Program v3.0 — N+15: Intelligence Hub / governed intelligence directory.
 *
 * The Intelligence group landing surface:
 *   Intelligence Hub → Decision Matrix / Cross-Sector / Company.
 *
 * This surface is DISCOVER → SELECT → NAVIGATE only. It renders the certified intelligence
 * universe (summary + company directory with the certified quality/valuation axes) from the
 * governed /api/decision-matrix payload (via the existing fetchDecisionMatrixData client), with
 * primary entry links to the implemented Decision Matrix and Cross-Sector surfaces. Future
 * intelligence surfaces (Opportunities / Risks / Rankings) are marked honestly — no links, no
 * fabricated data. Never hardcodes sectors, never recomputes, never derives values.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { DataTable, MetricGroup, MetricCard } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

export function IntelligenceHub() {
  const [companies, setCompanies] = useState<MatrixCompany[] | null>(null);
  const [universe, setUniverse] = useState<{ avgConviction: number; avgQuality: number; holdings: number } | null>(null);
  const [provenance, setProvenance] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY'>('SNAPSHOT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDecisionMatrixData()
      .then((d) => {
        if (!active) return;
        setCompanies([...d.companies]);
        setUniverse(d.universe);
        setProvenance(d.provenance.dataSource);
        setFreshness(d.provenance.freshness);
        setError(null);
      })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load intelligence directory: ${error}`} />;
  if (!companies || !universe) return <UnavailableState />;

  return (
    <section aria-label="Intelligence hub">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Intelligence</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed intelligence landing. Open a workspace or a company to inspect its certified intelligence.
        </p>
      </header>

      {/* Primary intelligence workspaces */}
      <h2 style={{ fontSize: 18 }}>Intelligence Workspaces</h2>
      <div data-testid="intelligence-workspaces" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link to="/intelligence/decision-matrix" style={{ padding: '10px 16px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-1)', textDecoration: 'none', color: 'var(--color-ink)' }}>
          Decision Matrix
        </Link>
        <Link to="/research/cross-sector" style={{ padding: '10px 16px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-1)', textDecoration: 'none', color: 'var(--color-ink)' }}>
          Cross-Sector Intelligence
        </Link>
      </div>

      {/* Future intelligence surfaces (honest markers — no links, no fabrication) */}
      <h2 style={{ fontSize: 18, marginTop: 8 }}>Future Intelligence Surfaces</h2>
      <p data-testid="intelligence-future" style={{ fontSize: 13, color: 'var(--color-ink-secondary)', marginTop: 0 }}>
        Opportunities · Risks · Rankings — future Program v3.0 surfaces (not yet implemented).
      </p>

      {/* Governed intelligence universe summary */}
      <MetricGroup label="Intelligence Universe">
        <MetricCard label="Sectors" value={universe.holdings} />
        <MetricCard label="Avg Conviction" value={universe.avgConviction} />
        <MetricCard label="Avg Quality" value={universe.avgQuality} />
      </MetricGroup>

      {/* Governed company directory with the certified intelligence axes */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Company Intelligence</h2>
      <DataTable
        columns={[
          {
            key: 'sector',
            header: 'Company / Sector',
            render: (r: MatrixCompany) => <Link to={`/research/company/${r.sector}`}>{r.sector}</Link>,
          },
          { key: 'verdict', header: 'Verdict', render: (r: MatrixCompany) => <DecisionBadge verdict={r.verdict} /> },
          { key: 'composite', header: 'Composite', render: (r: MatrixCompany) => r.composite },
          { key: 'quality', header: 'Quality', render: (r: MatrixCompany) => (r.quality === null ? 'unavailable' : r.quality) },
          { key: 'valuation', header: 'Valuation', render: (r: MatrixCompany) => (r.valuation === null ? 'unavailable' : r.valuation) },
        ]}
        rows={companies}
        emptyLabel="No companies available"
      />

      <p data-testid="intelligence-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance ?? 'governed'} · freshness {freshness}
      </p>
    </section>
  );
}
