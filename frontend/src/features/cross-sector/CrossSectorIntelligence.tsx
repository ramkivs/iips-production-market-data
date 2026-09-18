/**
 * Program v3.0 — Phase 8 (+ N+11): Cross-Sector Intelligence.
 *
 * Answers "Where are the strongest opportunities, risks and decision patterns across sectors?"
 * using CERTIFIED CSIP outputs ONLY. React performs only presentational operations (sort/filter/
 * group/format). NO ranking/normalization/percentile/opportunity/risk/confidence/comparison/
 * threshold/allocation logic in the frontend.
 *
 * N+11: each sector-ranking row is now selectable — selecting a sector composes the existing
 * governed endpoints for that ACTUAL sector (/api/evidence/:sector + /api/replay/:sector) and
 * renders the shared, payload-driven CompanyTrustChain (Decision → Evidence → Replay →
 * Provenance). Client-side composition only (no server changes), no fabrication.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCrossSectorData, type CrossSectorData } from '../../api/crossSector';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { MetricCard, MetricGroup, DataTable } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { ChartContainer, SimpleBarChart, LegendConventions } from '../../components/viz/ChartFoundations';
import { Accordion } from '../../components/interaction/InteractionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';

type SortKey = 'conviction' | 'sector';

export function CrossSectorIntelligence() {
  const [data, setData] = useState<CrossSectorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('conviction');

  // N+11: sector selection + governed trust-chain state.
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [chainEvidence, setChainEvidence] = useState<EvidenceData | null>(null);
  const [chainReplay, setChainReplay] = useState<ReplayData | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCrossSectorData()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // N+11: compose the governed trust chain for the selected sector.
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

  // Presentational sorting only (does not change certified meaning).
  const sortedRanking = useMemo(() => {
    if (!data) return [];
    const copy = [...data.ranking];
    copy.sort((a, b) => sortKey === 'conviction' ? b.conviction - a.conviction : a.sector.localeCompare(b.sector));
    return copy;
  }, [data, sortKey]);

  // Decision distribution is a presentational grouping of certified decisions.
  const decisionDistribution = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const d of data.decisions) counts.set(d.verdict, (counts.get(d.verdict) ?? 0) + 1);
    return [...counts.entries()].map(([verdict, count]) => ({ verdict, count }));
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load cross-sector data: ${error}`} />;
  if (!data) return <UnavailableState />;

  const { portfolio, diversification, opportunity, correlation, decisions, provenance } = data;

  return (
    <section aria-label="Cross-sector intelligence">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Cross-Sector Intelligence</h1>
          <CertifiedBadge />
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{provenance.dataSource}</p>
      </header>

      {/* Cross-sector overview */}
      <MetricGroup label="Universe Overview">
        <MetricCard label="Sectors" value={portfolio.holdings} />
        <MetricCard label="Avg Conviction" value={portfolio.avgConviction} />
        <MetricCard label="Avg Quality" value={portfolio.avgQuality} />
        <MetricCard label="Avg Risk" value={portfolio.avgRisk} />
        <MetricCard label="Concentration" value={portfolio.concentration} />
        <MetricCard label="Diversification" value={portfolio.diversificationScore} direction="positive" />
      </MetricGroup>

      {/* Sector ranking (certified CSIP ranking; presentational sort; N+11 selectable) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Sector Ranking</h2>
      <div role="group" aria-label="Sort ranking" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['conviction', 'sector'] as SortKey[]).map((k) => (
          <button key={k} type="button" aria-pressed={sortKey === k} onClick={() => setSortKey(k)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: sortKey === k ? 'var(--color-surface-2)' : 'var(--color-surface-1)' }}>
            Sort by {k}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'sector', header: 'Sector', render: (r: { sector: string }) => <Link to={`/research/company/${r.sector}`}>{r.sector}</Link> },
          { key: 'conviction', header: 'Conviction', render: (r: { conviction: number }) => r.conviction },
          { key: 'trend', header: 'Rank', render: (r: { rank: number }) => `#${r.rank}` },
          {
            key: 'details',
            header: 'Details',
            render: (r: { sector: string }) => (
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
        rows={sortedRanking.map((r, i) => ({ ...r, rank: i + 1 }))}
        emptyLabel="No sector ranking available"
      />

      {/* N+11: selected-sector governed trust chain (Decision → Evidence → Replay → Provenance) */}
      {selectedSector && (
        <section
          data-testid="cross-sector-trust-chain"
          aria-label={`Trust chain ${selectedSector}`}
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)' }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Trust Chain — {selectedSector}</h2>
          {chainLoading && <LoadingState />}
          {chainError && <ErrorState message={`Unable to load sector evidence: ${chainError}`} />}
          {!chainLoading && !chainError && chainEvidence && chainReplay && (
            <CompanyTrustChain evidence={chainEvidence} replay={chainReplay} />
          )}
        </section>
      )}

      {/* Decision distribution (certified decisions, presentational grouping) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Decision Distribution</h2>
      {decisionDistribution.length > 0 ? (
        <div data-testid="decision-distribution" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {decisionDistribution.map((d) => <DecisionBadge key={d.verdict} verdict={d.verdict as never} />)}
        </div>
      ) : <p>No decision distribution available</p>}

      {/* Opportunity distribution (certified) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Opportunities</h2>
      {opportunity.length > 0 ? (
        <ul data-testid="cross-sector-opportunities" style={{ paddingLeft: 20 }}>
          {opportunity.map((o) => <li key={o.companyId}><Link to={`/research/company/${o.sector}`}>{o.sector}</Link> — conviction {o.conviction}</li>)}
        </ul>
      ) : <p>No opportunities available</p>}

      {/* Risk distribution (certified correlation/diversification flags) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Areas Requiring Investigation (Risks)</h2>
      <ul data-testid="cross-sector-risks" style={{ paddingLeft: 20 }}>
        {correlation.flags.map((f) => <li key={f}>{f}</li>)}
        {diversification.flags.map((f) => <li key={f}>{f}</li>)}
        {correlation.concentrationSectors.map((s) => <li key={s}>Concentration: {s}</li>)}
        {correlation.flags.length + diversification.flags.length + correlation.concentrationSectors.length === 0 && <li>No risk flags</li>}
      </ul>

      {/* Composite by sector chart (certified engine composites) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Composite by Sector</h2>
      <ChartContainer title="Certified composite by sector">
        <SimpleBarChart data={decisions.map((d) => ({ label: d.sector, value: d.composite }))} max={100} />
      </ChartContainer>
      <LegendConventions items={[{ label: 'Certified composite (0-100)', colorVar: 'var(--color-status-informational)' }]} />

      {/* Sector comparison (accordion; certified values, presentational) */}
      <Accordion title="Sector Comparison Detail">
        <DataTable
          columns={[
            { key: 'sector', header: 'Sector', render: (r: { sector: string; verdict: string; composite: number }) => r.sector },
            { key: 'decision', header: 'Decision', render: (r: { sector: string; verdict: string; composite: number }) => <DecisionBadge verdict={r.verdict as never} /> },
            { key: 'composite', header: 'Composite', render: (r: { sector: string; verdict: string; composite: number }) => r.composite },
          ]}
          rows={decisions.map((d) => ({ sector: d.sector, verdict: d.verdict, composite: d.composite }))}
          emptyLabel="No comparison available"
        />
      </Accordion>

      <p data-testid="cross-sector-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {provenance.dataSource} · freshness {provenance.freshness}
      </p>
    </section>
  );
}
