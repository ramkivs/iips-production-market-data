/**
 * Program v3.0 — N+13: Research Hub / governed company directory.
 *
 * The primary research entry path:
 *   Directory → Company → Evidence → Replay → Provenance.
 *
 * This surface is DISCOVER → SELECT → NAVIGATE only. It renders the certified company/sector
 * universe from the governed /api/decision-matrix payload (via the existing
 * fetchDecisionMatrixData client) and links each row to the certified Company trust-chain
 * surface (/research/company/:sector). It does NOT duplicate Company trust-chain content, and
 * it never hardcodes sectors, recomputes scores, or fabricates values.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { DataTable } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

export function ResearchHub() {
  const [companies, setCompanies] = useState<MatrixCompany[] | null>(null);
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
        setProvenance(d.provenance.dataSource);
        setFreshness(d.provenance.freshness);
        setError(null);
      })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load research directory: ${error}`} />;
  if (!companies) return <UnavailableState />;

  return (
    <section aria-label="Research hub">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Research</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed company directory. Select a company to open its certified decision, evidence and replay.
        </p>
      </header>

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

      <p data-testid="research-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance ?? 'governed'} · freshness {freshness}
      </p>
    </section>
  );
}
