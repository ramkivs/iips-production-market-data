/**
 * Program v3.0 — N+14: Evidence Hub / governed evidence directory.
 *
 * The missing navigation entry point for the already-certified Evidence Explorer and
 * Replay Explorer:
 *   Evidence Hub → Evidence Explorer → Replay Explorer → Provenance / equivalence.
 *
 * This surface is DISCOVER → SELECT → NAVIGATE only. It renders the certified company/sector
 * universe from the governed /api/decision-matrix payload (via the existing
 * fetchDecisionMatrixData client) and links each row to the certified explorers. It does NOT
 * duplicate Evidence/Replay Explorer logic, and it never hardcodes sectors, derives verdicts/
 * composites, or fabricates evidence values.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { DataTable } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';

export function EvidenceHub() {
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
  if (error) return <ErrorState message={`Unable to load evidence directory: ${error}`} />;
  if (!companies) return <UnavailableState />;

  return (
    <section aria-label="Evidence hub">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Evidence</h1>
          <CertifiedBadge />
          <FreshnessBadge state={freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          Governed evidence directory. Select a company to inspect its certified evidence chain and replay verification.
        </p>
      </header>

      <DataTable
        columns={[
          { key: 'sector', header: 'Company / Sector', render: (r: MatrixCompany) => r.sector },
          { key: 'verdict', header: 'Verdict', render: (r: MatrixCompany) => <DecisionBadge verdict={r.verdict} /> },
          { key: 'composite', header: 'Composite', render: (r: MatrixCompany) => r.composite },
          {
            key: 'evidence',
            header: 'Evidence',
            render: (r: MatrixCompany) => <Link to={`/evidence/${r.sector}`}>Open evidence →</Link>,
          },
          {
            key: 'replay',
            header: 'Replay',
            render: (r: MatrixCompany) => <Link to={`/evidence/replay/${r.sector}`}>Open replay →</Link>,
          },
        ]}
        rows={companies}
        emptyLabel="No evidence available"
      />

      <p data-testid="evidence-hub-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance ?? 'governed'} · freshness {freshness}
      </p>
    </section>
  );
}
