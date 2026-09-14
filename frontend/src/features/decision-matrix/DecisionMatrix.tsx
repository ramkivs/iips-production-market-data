/**
 * Program v3.0 — Phase 9 (+ N+9): Decision Matrix.
 *
 * PRESENTATIONAL scatter of CERTIFIED axes (Business Quality × Valuation).
 *
 * GOVERNANCE: The platform exposes certified per-company `quality` and `valuation` scores
 * (NormalizedHolding / engine pillars) but NO certified quadrant/band classification object.
 * Therefore this UI POSITIONS the certified scores visually and does NOT compute bands,
 * quadrants, thresholds, or any classification. Valuation is null where the certified engine
 * does not expose it (shown unavailable). No scoring/classification logic in React.
 *
 * N+9: selecting a point now composes the existing governed endpoints for that company's
 * ACTUAL sector — /api/evidence/:sector + /api/replay/:sector — and renders the shared,
 * payload-driven CompanyTrustChain (Decision → Evidence → Replay → Provenance). Sector is the
 * only variable; client-side composition only (no server changes), no fabrication.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';
import { AiExplanation } from '../../components/ai/AiExplanation';

export function DecisionMatrix() {
  const [data, setData] = useState<DecisionMatrixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MatrixCompany | null>(null);

  // N+9: governed trust-chain state for the selected company's actual sector.
  const [chainEvidence, setChainEvidence] = useState<EvidenceData | null>(null);
  const [chainReplay, setChainReplay] = useState<ReplayData | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDecisionMatrixData()
      .then((d) => { if (active) { setData(d); setError(null); } })
      .catch((e) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // N+9: compose the governed trust chain for the selected company's sector.
  useEffect(() => {
    if (!selected) { setChainEvidence(null); setChainReplay(null); setChainError(null); return; }
    let active = true;
    setChainLoading(true);
    setChainError(null);
    Promise.all([fetchEvidenceData(selected.sector), fetchReplayData(selected.sector)])
      .then(([e, r]) => { if (active) { setChainEvidence(e); setChainReplay(r); } })
      .catch((e) => { if (active) setChainError(String(e)); })
      .finally(() => { if (active) setChainLoading(false); });
    return () => { active = false; };
  }, [selected]);

  // Phase 13-Hardening (C): memoize the presentational positioning (recomputed only when data changes).
  const positioned = useMemo(() => {
    if (!data) return [];
    return data.companies.map((c) => {
      const q = c.quality ?? 0;
      const v = c.valuation ?? 0;
      return { ...c, x: q, y: v, xNull: c.quality === null, yNull: c.valuation === null };
    });
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load decision matrix: ${error}`} />;
  if (!data) return <UnavailableState />;

  return (
    <section aria-label="Decision matrix">
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Decision Matrix</h1>
          <CertifiedBadge />
          <FreshnessBadge state={data.provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
        </div>
        <p style={{ color: 'var(--color-ink-secondary)', margin: '8px 0 0', fontSize: 13 }}>{data.provenance.dataSource}</p>
        <p data-testid="matrix-note" style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
          {data.note} Positions represent certified Business Quality and Valuation values. No quadrant classification is applied.
        </p>
      </header>

      <MetricGroup label="Universe">
        <MetricCard label="Sectors" value={data.universe.holdings} />
        <MetricCard label="Avg Conviction" value={data.universe.avgConviction} />
        <MetricCard label="Avg Quality" value={data.universe.avgQuality} />
      </MetricGroup>

      {/* Scatter of certified (quality, valuation) — presentational, no classification bands */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Business Quality × Valuation (certified)</h2>
      <div
        data-testid="matrix-scatter"
        role="group"
        aria-label="Scatter of certified business quality and valuation. Each point is a button; activate to inspect a company."
        style={{ position: 'relative', height: 400, border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-1)', overflow: 'hidden' }}
      >
        {/* Axis labels (no bands/quadrants) */}
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'var(--color-ink-secondary)' }}>
          Business Quality (certified, 0–100)
        </div>
        <div style={{ position: 'absolute', top: '50%', left: 4, transform: 'translateY(-50%) rotate(-90deg)', fontSize: 12, color: 'var(--color-ink-secondary)', transformOrigin: 'left' }}>
          Valuation (certified, 0–100)
        </div>
        {positioned.map((c) => {
          // Phase 13-Hardening (B1): percentage positioning (no fixed-px overflow on narrow viewports).
          const leftPct = c.xNull ? 4 : 4 + (c.x / 100) * 92;
          const topPct = c.yNull ? 96 : 4 + ((100 - c.y) / 100) * 92;
          return (
            <button
              key={c.sector}
              type="button"
              data-testid={`matrix-point-${c.sector}`}
              onClick={() => setSelected(c)}
              title={`${c.sector}: quality ${c.quality ?? 'n/a'}, valuation ${c.valuation ?? 'n/a'}`}
              aria-label={`${c.sector}, quality ${c.quality ?? 'unavailable'}, valuation ${c.valuation ?? 'unavailable'}`}
              style={{
                position: 'absolute', left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%,-50%)',
                width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--color-surface-0)',
                background: c.yNull ? 'repeating-linear-gradient(45deg,var(--color-border),var(--color-border) 2px,transparent 2px,transparent 4px)' : 'var(--color-status-informational)',
                cursor: 'pointer', padding: 0,
              }}
            />
          );
        })}
      </div>

      {/* Selected-company detail (certified values only) */}
      {selected ? (
        <div data-testid="matrix-selected" style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}>
          <strong><Link to={`/research/company/${selected.sector}`}>{selected.sector}</Link></strong>
          <div style={{ margin: '8px 0' }}><DecisionBadge verdict={selected.verdict} /></div>
          <span>Composite: {selected.composite} · Quality: {selected.quality ?? 'unavailable'} · Valuation: {selected.valuation ?? 'unavailable'}</span>
        </div>
      ) : (
        <p data-testid="matrix-select-hint" style={{ marginTop: 16 }}>Select a point to inspect a company.</p>
      )}

      {/* N+9: selected-company governed trust chain (Decision → Evidence → Replay → Provenance) */}
      {selected && (
        <section
          data-testid="matrix-trust-chain"
          aria-label={`Trust chain ${selected.sector}`}
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-0)' }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Trust Chain — {selected.sector}</h2>
          {chainLoading && <LoadingState />}
          {chainError && <ErrorState message={`Unable to load company evidence: ${chainError}`} />}
          {!chainLoading && !chainError && chainEvidence && chainReplay && (
            <CompanyTrustChain evidence={chainEvidence} replay={chainReplay} />
          )}

          {/* G-AI-IMPL (D2): embedded read-only AI explanation, bound to the authoritative
              selected.sector. No route, no navigation entry, no sector selector. */}
          <AiExplanation sectorKey={selected.sector} />
        </section>
      )}

      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {data.provenance.dataSource} · freshness {data.provenance.freshness}
      </p>
    </section>
  );
}
