/**
 * Program v3.0 — Phase 6 (+ N+8): Portfolio Workspace.
 *
 * Answers "What is happening in my portfolio, and what deserves investigation?"
 * Navigation: Executive -> Portfolio -> Holding -> Company -> Evidence -> Replay.
 * Data: typed API client over the certified v2.0 transport (CSIP + engine outputs).
 * No portfolio-management logic in React (no rebalance/risk/quality/priority/limits/thresholds).
 * Only presentational operations (sort/filter/group/paginate/format).
 *
 * N+8: holding-level governed trust chain. Selecting a holding composes the existing
 * governed endpoints for that holding's ACTUAL sector — /api/evidence/:sector and
 * /api/replay/:sector — and renders the shared, payload-driven CompanyTrustChain
 * (Decision → Evidence → Replay → Provenance). Sector is the only variable; no
 * recomputation, no fabrication. Client-side composition only (no server changes).
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchPortfolioData, type PortfolioData, type PortfolioHolding } from '../../api/portfolio';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { ChartContainer, SimpleBarChart, LegendConventions } from '../../components/viz/ChartFoundations';
import { MetricCard, MetricGroup, DataTable, TrendIndicator } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { EvidenceCard, type EvidenceReference } from '../../components/evidence/EvidenceComponents';
import { Accordion } from '../../components/interaction/InteractionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';

type SortKey = 'sector' | 'composite' | 'weight';

export function PortfolioWorkspace() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('weight');

  // N+8: holding selection + governed trust-chain state.
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [chainEvidence, setChainEvidence] = useState<EvidenceData | null>(null);
  const [chainReplay, setChainReplay] = useState<ReplayData | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPortfolioData()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // N+8: compose the governed trust chain for the selected holding's actual sector.
  useEffect(() => {
    if (!selectedSector) { setChainEvidence(null); setChainReplay(null); setChainError(null); return; }
    let active = true;
    setChainLoading(true);
    setChainError(null);
    Promise.all([fetchEvidenceData(selectedSector), fetchReplayData(selectedSector)])
      .then(([e, r]) => { if (active) { setChainEvidence(e); setChainReplay(r); } })
      .catch((e) => { if (active) setChainError(String(e)); })
      .finally(() => { if (active) setChainLoading(false); });
    return () => { active = false; };
  }, [selectedSector]);

  // Presentational sorting only (does not change investment semantics).
  const sortedHoldings = useMemo(() => {
    if (!data) return [];
    const copy = [...data.holdings];
    copy.sort((a, b) => {
      if (sortKey === 'sector') return a.sector.localeCompare(b.sector);
      if (sortKey === 'composite') return b.composite - a.composite;
      return b.weight - a.weight;
    });
    return copy;
  }, [data, sortKey]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load certified portfolio data: ${error}`} />;
  if (!data) return <UnavailableState />;

  const { portfolio, diversification, allocation, opportunity, correlation, evidenceRefs, provenance } = data;

  return (
    <section aria-label="Portfolio workspace">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Portfolio</h1>
          <CertifiedBadge />
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{provenance.dataSource}</p>
      </header>

      {/* Overview */}
      <MetricGroup label="Portfolio Overview">
        <MetricCard label="Holdings" value={portfolio.holdings} />
        <MetricCard label="Avg Conviction" value={portfolio.avgConviction} />
        <MetricCard label="Avg Quality" value={portfolio.avgQuality} />
        <MetricCard label="Avg Risk" value={portfolio.avgRisk} />
        <MetricCard label="Concentration" value={portfolio.concentration} />
        <MetricCard label="Diversification" value={portfolio.diversificationScore} direction="positive" />
      </MetricGroup>

      {/* Allocation (certified recommendation) */}
      <Accordion title={`Allocation Recommendation (${allocation.strategy})`}>
        <p data-testid="allocation-recommendation">{allocation.recommendation}</p>
        <ul style={{ paddingLeft: 20 }}>{allocation.rulesApplied.map((r) => <li key={r}>{r}</li>)}</ul>
      </Accordion>

      {/* Sector exposure */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Sector Exposure</h2>
      <ChartContainer title="Sector Exposure (%)">
        <SimpleBarChart data={Object.entries(portfolio.sectorExposure).map(([label, value]) => ({ label, value }))} />
      </ChartContainer>
      <LegendConventions items={[{ label: 'Sector weight (%)', colorVar: 'var(--color-status-informational)' }]} />

      {/* Holdings (sortable, presentational) — the trust-chain selector (N+8) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Holdings</h2>
      <div role="group" aria-label="Sort holdings" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['weight', 'composite', 'sector'] as SortKey[]).map((k) => (
          <button key={k} type="button" aria-pressed={sortKey === k} onClick={() => setSortKey(k)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: sortKey === k ? 'var(--color-surface-2)' : 'var(--color-surface-1)' }}>
            Sort by {k}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'sector', header: 'Sector', render: (r: PortfolioHolding) => r.sector },
          { key: 'decision', header: 'Decision', render: (r: PortfolioHolding) => <DecisionBadge verdict={r.decision} /> },
          { key: 'composite', header: 'Composite', render: (r: PortfolioHolding) => r.composite },
          { key: 'confidence', header: 'Confidence', render: (r: PortfolioHolding) => (r.confidence === null ? 'unavailable' : Math.round(r.confidence * 100)) },
          { key: 'risk', header: 'Risk', render: (r: PortfolioHolding) => r.risk },
          { key: 'weight', header: 'Weight %', render: (r: PortfolioHolding) => r.weight },
          { key: 'trend', header: 'Trend', render: () => <TrendIndicator direction="flat" label="—" /> },
          {
            key: 'details',
            header: 'Details',
            render: (r: PortfolioHolding) => (
              <button
                type="button"
                data-testid={`inspect-${r.sector}`}
                aria-pressed={selectedSector === r.sector}
                onClick={() => setSelectedSector(selectedSector === r.sector ? null : r.sector)}
              >
                {selectedSector === r.sector ? 'Hide' : 'Inspect'}
              </button>
            ),
          },
        ]}
        rows={sortedHoldings}
        emptyLabel="No holdings available"
      />

      {/* N+8: holding-level governed trust chain (Decision → Evidence → Replay → Provenance) */}
      {selectedSector && (
        <section
          data-testid="portfolio-trust-chain"
          aria-label={`Holding trust chain ${selectedSector}`}
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)' }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Holding Trust Chain — {selectedSector}</h2>
          {chainLoading && <LoadingState />}
          {chainError && <ErrorState message={`Unable to load holding evidence: ${chainError}`} />}
          {!chainLoading && !chainError && chainEvidence && chainReplay && (
            <CompanyTrustChain evidence={chainEvidence} replay={chainReplay} />
          )}
        </section>
      )}

      {/* Opportunities */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Opportunities</h2>
      {opportunity.length > 0 ? (
        <ul data-testid="opportunity-list" style={{ paddingLeft: 20 }}>
          {opportunity.map((o) => <li key={o.companyId}>{o.sector} — conviction {o.conviction}</li>)}
        </ul>
      ) : <p>No opportunities available</p>}

      {/* Risk */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Risk</h2>
      <ul data-testid="portfolio-risk-list" style={{ paddingLeft: 20 }}>
        {correlation.flags.map((f) => <li key={f}>{f}</li>)}
        {diversification.flags.map((f) => <li key={f}>{f}</li>)}
        {correlation.concentrationSectors.map((s) => <li key={s}>Concentration: {s}</li>)}
        {correlation.flags.length + diversification.flags.length + correlation.concentrationSectors.length === 0 && <li>No risk flags</li>}
      </ul>

      {/* Evidence entry points (Executive -> Portfolio -> Holding -> Evidence -> Replay) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence &amp; Replay</h2>
      <div data-testid="portfolio-evidence" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {evidenceRefs.map((ref) => <EvidenceCard key={ref.evidenceId} reference={ref as EvidenceReference} />)}
      </div>
    </section>
  );
}
