/**
 * Program v3.0 — Phase 9 (+ N+9): Decision Matrix.
 * Route: /intelligence/decision-matrix.
 *
 * PRESENTATIONAL scatter of CERTIFIED axes (Business Quality × Valuation).
 *
 * GOVERNANCE: The platform exposes certified per-company `quality` and `valuation` scores
 * (NormalizedHolding / engine pillars) but NO certified quadrant/band classification object.
 * Therefore this UI POSITIONS the certified scores visually and does NOT compute bands,
 * quadrants, thresholds, or any classification. Valuation is null where the certified engine
 * does not expose it (shown unavailable). No scoring/classification logic in React.
 *
 * N+9: selecting a point composes the existing governed endpoints for that company's
 * ACTUAL sector — /api/evidence/:sector + /api/replay/:sector — and renders the shared,
 * payload-driven CompanyTrustChain (Decision → Evidence → Replay → Provenance). Sector is the
 * only variable; client-side composition only (no server changes), no fabrication.
 *
 * ══ RESTORATION (DECISION MATRIX work item) — donor `DecisionMatrix.tsx` blob c3b6e947 ══════
 *  Recovered from the proven donor blob; the rendered markup is the donor's, unchanged. Every
 *  direct import resolves to an EXISTING current-lineage module — nothing else was recovered:
 *    api/dataMode · components/state/DataModeUnavailable · api/decisionMatrix · api/evidence ·
 *    api/replay · components/data/DataComponents · components/decision/DecisionComponents ·
 *    components/state/StateComponents · components/ui/Badges · features/company/CompanyTrustChain
 *  Bounded adaptations (the same ones Prompt 2C applied to Company/Sector Intelligence):
 *  · AI Advisory is NOT reconstructed. The donor's `<AiExplanation sectorKey=…/>` (absent from
 *    the current lineage, AI advisory DEFERRED) is replaced by the current-lineage equivalent
 *    `<AdvisoryDeferred sectorKey=…/>` in the same slot — no network call, no advisory value.
 *  · The donor's `isDegraded(...)` guard is PRESERVED. `/api/decision-matrix` is SNAPSHOT-only
 *    and emits no degraded family, so the guard is unreachable-by-construction rather than
 *    removed.
 *  · Presentation is split into a pure `DecisionMatrixView` so the data-rendered DOM is
 *    verifiable in `node:test` without jsdom. The loader (`DecisionMatrix`) owns the donor's
 *    state and effects verbatim.
 *  · NodeNext `.js` import specifiers.
 *
 * Fail-closed: loading → LoadingState; any transport error → ErrorState; no payload →
 * UnavailableState. No matrix, scores, or weights are ever fabricated.
 *
 * Browser boundary: this file reaches data over HTTP only. It imports no server module, no
 * `src/transports/**`, no `iips-platform/**`, and no `node:*`.
 */
import { useEffect, useMemo, useState } from 'react';
import { isDegraded } from '../../api/dataMode.js';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable.js';
import { Link } from 'react-router-dom';
import { fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix.js';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence.js';
import { fetchReplayData, type ReplayData } from '../../api/replay.js';
import { MetricCard, MetricGroup } from '../../components/data/DataComponents.js';
import { DecisionBadge } from '../../components/decision/DecisionComponents.js';
import { LoadingState, ErrorState, UnavailableState } from '../../components/state/StateComponents.js';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges.js';
import { CompanyTrustChain } from '../company/CompanyTrustChain.js';
import { AdvisoryDeferred } from '../../components/ai/AdvisoryDeferred.js';

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Pure presentation — every value is consumed 1:1 from the governed payloads.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

export interface DecisionMatrixViewProps {
  readonly data: DecisionMatrixData;
  readonly selected: MatrixCompany | null;
  readonly onSelect: (company: MatrixCompany) => void;
  readonly chainEvidence: EvidenceData | null;
  readonly chainReplay: ReplayData | null;
  readonly chainLoading: boolean;
  readonly chainError: string | null;
}

export function DecisionMatrixView({
  data, selected, onSelect, chainEvidence, chainReplay, chainLoading, chainError,
}: DecisionMatrixViewProps) {
  // Phase 13-Hardening (C): memoize the presentational positioning (recomputed only when data changes).
  const positioned = useMemo(() => {
    return data.companies.map((c) => {
      const q = c.quality ?? 0;
      const v = c.valuation ?? 0;
      return { ...c, x: q, y: v, xNull: c.quality === null, yNull: c.valuation === null };
    });
  }, [data]);

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
              onClick={() => onSelect(c)}
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

          {/* AI Advisory DEFERRED: the donor's embedded AiExplanation slot renders the documented
              current-lineage deferred state, bound to the authoritative selected.sector. */}
          <AdvisoryDeferred sectorKey={selected.sector} />
        </section>
      )}

      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 16 }}>
        {data.provenance.dataSource} · freshness {data.provenance.freshness}
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Loader — the donor's state and effects, verbatim. Fails closed on every non-success path.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load decision matrix: ${error}`} />;
  if (!data) return <UnavailableState />;
  // D89 — governed degraded state (UI12 LIVE/PIT). MUST precede any SNAPSHOT-shape dereference.
  if (isDegraded(data)) return <DataModeUnavailable data={data} title="Decision Matrix" />;

  return (
    <DecisionMatrixView
      data={data}
      selected={selected}
      onSelect={setSelected}
      chainEvidence={chainEvidence}
      chainReplay={chainReplay}
      chainLoading={chainLoading}
      chainError={chainError}
    />
  );
}
