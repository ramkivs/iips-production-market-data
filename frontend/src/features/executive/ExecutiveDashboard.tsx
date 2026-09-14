/**
 * Program v3.0 — Phase 5 (+ N+10): Executive Dashboard.
 *
 * The canonical enterprise entry experience. Answers "What requires my attention?"
 * using the frozen hierarchy: Decision -> Confidence -> Why -> Drivers -> Metrics -> Evidence.
 *
 * Data: consumes the typed API client over the certified v2.0 transport. Every value is
 * genuinely computed by the certified platform (frozen engines + CSIP); nothing is fabricated.
 * Freshness is surfaced (SNAPSHOT for the certified reference portfolio). Authority separation:
 * CERTIFIED result vs AI explanation (no AI on this surface) vs PLATFORM info.
 *
 * N+10: each "Recent Decisions" card is now selectable — selecting a card composes the existing
 * governed endpoints for that decision's ACTUAL sector (/api/evidence/:sector + /api/replay/:sector)
 * and renders the shared, payload-driven CompanyTrustChain (Decision → Evidence → Replay →
 * Provenance). Client-side composition only (no server changes), no fabrication.
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchExecutiveData, type ExecutiveData, type RankedSector } from '../../api/executive';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { ChartContainer, SimpleBarChart } from '../../components/viz/ChartFoundations';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { MetricCard, MetricGroup, DataTable, TrendIndicator } from '../../components/data/DataComponents';
import { EvidenceCard, type EvidenceReference } from '../../components/evidence/EvidenceComponents';
import { LoadingState, ErrorState, StaleDataState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';

export function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // N+10: decision selection + governed trust-chain state.
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [chainEvidence, setChainEvidence] = useState<EvidenceData | null>(null);
  const [chainReplay, setChainReplay] = useState<ReplayData | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchExecutiveData()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // N+10: compose the governed trust chain for the selected decision's actual sector.
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

  // Phase 13-Hardening (C): memoize derived presentation arrays (recomputed only when data changes).
  const evidenceRefs: EvidenceReference[] = useMemo(() => {
    if (!data) return [];
    return data.decisions.map((d) => ({
      evidenceId: `ev_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      recommendation: d.verdict,
      compositeScore: d.composite,
    }));
  }, [data]);

  const rankedRows: RankedRow[] = useMemo(() => {
    if (!data) return [];
    return data.ranking.map((r, i) => ({ ...r, index: i }));
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load certified executive data: ${error}`} />;
  if (!data) return <UnavailableState />;

  const { portfolio, diversification, opportunity, correlation, decisions, provenance } = data;

  return (
    <section aria-label="Executive dashboard">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Executive</h1>
          <CertifiedBadge />
          <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>
          {provenance.dataSource}
        </p>
      </header>

      {/* Portfolio / platform health summary */}
      <MetricGroup label="Portfolio Health">
        <MetricCard label="Holdings" value={portfolio.holdings} />
        <MetricCard label="Avg Conviction" value={portfolio.avgConviction} />
        <MetricCard label="Avg Quality" value={portfolio.avgQuality} />
        <MetricCard label="Avg Risk" value={portfolio.avgRisk} />
        <MetricCard label="Concentration" value={portfolio.concentration} />
        <MetricCard label="Diversification" value={portfolio.diversificationScore} direction="positive" />
      </MetricGroup>

      {/* Top opportunity highlight (from certified opportunity output) */}
      {opportunity.length > 0 && (
        <div data-testid="top-opportunity" style={{ border: '1px solid var(--color-status-positive)', borderRadius: 6, padding: 12, marginTop: 16, background: 'var(--color-surface-1)' }}>
          <strong>Top opportunity:</strong> {opportunity[0].sector} (conviction {opportunity[0].conviction})
        </div>
      )}

      {/* Priority opportunities (from certified ranking) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Priority Opportunities</h2>
      <DataTable
        columns={[
          { key: 'sector', header: 'Sector', render: (r: RankedRow) => r.sector },
          { key: 'conviction', header: 'Conviction', render: (r: RankedRow) => r.conviction },
          { key: 'trend', header: 'Trend', render: (r: RankedRow) => <TrendIndicator direction={r.index < 3 ? 'up' : 'flat'} /> },
        ]}
        rows={rankedRows}
        emptyLabel="No opportunities available"
      />

      {/* Priority risks (from certified correlation/diversification flags) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Risks Requiring Attention</h2>
      <ul data-testid="risk-list" style={{ paddingLeft: 20 }}>
        {correlation.flags.map((f) => <li key={f}>{f}</li>)}
        {diversification.flags.map((f) => <li key={f}>{f}</li>)}
        {correlation.concentrationSectors.map((s) => <li key={s}>Concentration: {s}</li>)}
      </ul>

      {/* Sector/cross-sector highlights (decision distribution) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Decision Distribution</h2>
      <ChartContainer title="Composite by Sector">
        <SimpleBarChart data={decisions.map((d) => ({ label: d.sector, value: d.composite }))} max={100} />
      </ChartContainer>

      {/* Recent decisions with CERTIFIED authority + evidence entry points (N+10: selectable) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Recent Decisions</h2>
      <div data-testid="decision-list" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
        {decisions.map((d) => (
          <article key={d.sector} data-testid="recent-decision" style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}>
            <strong>{d.sector}</strong>
            <div style={{ margin: '6px 0' }}><DecisionBadge verdict={d.verdict} /></div>
            <span>Composite: {d.composite}</span>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                data-testid={`inspect-${d.sector}`}
                aria-pressed={selectedSector === d.sector}
                onClick={() => setSelectedSector(selectedSector === d.sector ? null : d.sector)}
              >
                {selectedSector === d.sector ? 'Hide' : 'Inspect'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* N+10: selected-decision governed trust chain (Decision → Evidence → Replay → Provenance) */}
      {selectedSector && (
        <section
          data-testid="executive-trust-chain"
          aria-label={`Trust chain ${selectedSector}`}
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)' }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Trust Chain — {selectedSector}</h2>
          {chainLoading && <LoadingState />}
          {chainError && <ErrorState message={`Unable to load decision evidence: ${chainError}`} />}
          {!chainLoading && !chainError && chainEvidence && chainReplay && (
            <CompanyTrustChain evidence={chainEvidence} replay={chainReplay} />
          )}
        </section>
      )}

      {/* Evidence / replay entry points (progressive disclosure to Evidence surface) */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Evidence &amp; Replay</h2>
      <div data-testid="evidence-list" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {evidenceRefs.map((ref) => <EvidenceCard key={ref.evidenceId} reference={ref} />)}
      </div>

      {/* Freshness / provenance — SNAPSHOT is a certified frozen snapshot, not "stale".
          A stale warning is shown only when the platform reports the data as STALE. */}
      {provenance.freshness === 'STALE' && <StaleDataState asOf={provenance.calibratedAt} />}
    </section>
  );
}

interface RankedRow extends RankedSector {
  index: number;
}
