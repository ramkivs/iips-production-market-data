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
 *
 * TARGET-UI-CONVERGENCE PHASE 2 (authorized by the Phase 1 A3 acceptance act at da43051;
 * scope: TGT-13 drill-through, TGT-12 navigation, TGT-04 IIPS Score Distribution, TGT-03
 * governed mover semantics). COMPOSITION-ONLY:
 *   • TGT-13/TGT-12 — existing governed rows now carry Links to the ALREADY-EXISTING routes
 *     (/research/company/:sector, /evidence/:sector, /evidence/replay/:sector). No parallel
 *     identity model and no invented companyId: the governed payload's own `sector` value is
 *     used exactly as the existing surfaces already use it.
 *   • TGT-04 — the IIPS Score Distribution composes the existing governed /api/decision-matrix
 *     payload (no new endpoint) through the existing ChartContainer/SimpleBarChart/MetricTable
 *     foundations. Counts and descriptive statistics are a PRESENTATIONAL GROUPING of certified
 *     values (the same pattern CrossSectorIntelligence already uses). NO score band, bin edge,
 *     quadrant or threshold is computed or invented.
 *   • TGT-03 — mover semantics are derived ONLY from the governed ranking payload, whose
 *     certified order is preserved verbatim (no client re-sort). A period-over-period movement
 *     signal is NOT derived: the frozen SNAPSHOT baseline carries a single vintage, so any
 *     invented delta would be fabrication. The absence is disclosed on the surface.
 *   ⚠ U1–U10 preserved. The rank-position TrendIndicator is NOT promoted into a certified
 *     movement signal — it remains a presentational rank cue and is labelled as such.
 *   ⚠ AD-17 / M-2 remain UNRESOLVED: evidence/replay continues to render through the existing
 *     CompanyTrustChain → Ad17Disclosure path. No verified-replay claim is added here.
 *   ⚠ No contract, schema, API, fixture or server change is made by these additions.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isDegraded, type DegradedData } from '../../api/dataMode';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable';
import { fetchExecutiveData, type ExecutiveData, type RankedSector } from '../../api/executive';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { ChartContainer, SimpleBarChart } from '../../components/viz/ChartFoundations';
import { DecisionBadge } from '../../components/decision/DecisionComponents';
import { MetricCard, MetricGroup, MetricTable, DataTable, TrendIndicator } from '../../components/data/DataComponents';
import { EvidenceCard, type EvidenceReference } from '../../components/evidence/EvidenceComponents';
import { LoadingState, ErrorState, StaleDataState, UnavailableState } from '../../components/state/StateComponents';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges';
import { CompanyTrustChain } from '../company/CompanyTrustChain';

/**
 * TGT-04 shape guard. Accepts a payload ONLY when it actually carries the governed company
 * universe. This is a NARROWING check, not a validation or business rule: it neither derives nor
 * alters any value. It exists because `isDegraded()` alone cannot distinguish "certified
 * universe" from "some other 200 response", and dereferencing the wrong one throws — the same
 * failure class D86 repaired for Portfolio.
 */
function isGovernedUniverse(d: unknown): d is DecisionMatrixData {
  return (
    typeof d === 'object' &&
    d !== null &&
    Array.isArray((d as { companies?: unknown }).companies)
  );
}

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

  // TGT-04 — governed decision-matrix universe (score distribution). Held in its OWN state:
  // a failure here must never blank the certified executive payload (the page-level `error`
  // state is deliberately NOT reused).
  const [universe, setUniverse] = useState<DecisionMatrixData | null>(null);
  const [universeDegraded, setUniverseDegraded] = useState<DegradedData | null>(null);
  const [universeError, setUniverseError] = useState<string | null>(null);
  const [universeLoading, setUniverseLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setUniverseLoading(true);
    fetchDecisionMatrixData()
      .then((d) => {
        if (!active) return;
        // D89 — a governed degraded response carries NO universe. Narrow BEFORE any
        // SNAPSHOT-shape dereference (the D85/D86 lesson).
        if (isDegraded(d)) { setUniverseDegraded(d); setUniverse(null); setUniverseError(null); return; }
        // D86-class hardening for THIS section: a 200 response that does not carry a governed
        // company universe is NOT usable. Treating it as usable would dereference a missing
        // shape and throw, which in React unmounts the tree and blanks the ENTIRE certified
        // executive payload. It is refused and disclosed instead — never coerced, never
        // substituted with an empty or zeroed universe.
        if (!isGovernedUniverse(d)) {
          setUniverse(null);
          setUniverseDegraded(null);
          setUniverseError('unexpected payload shape — no governed company universe was returned');
          return;
        }
        setUniverseDegraded(null);
        setUniverse(d);
        setUniverseError(null);
      })
      .catch((e) => {
        if (!active) return;
        setUniverse(null);
        setUniverseDegraded(null);
        setUniverseError(String(e));
      })
      .finally(() => { if (active) setUniverseLoading(false); });
    return () => { active = false; };
  }, []);

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
  // TGT-13: the entry now also carries the governed `sector` so each evidence card can drill
  // through to the existing governed evidence route. The reference itself is unchanged.
  const evidenceEntries: EvidenceEntry[] = useMemo(() => {
    if (!data) return [];
    return data.decisions.map((d) => ({
      sector: d.sector,
      reference: {
        evidenceId: `ev_${d.sector}`,
        engineId: `sector.${d.sector.toLowerCase()}`,
        recommendation: d.verdict,
        compositeScore: d.composite,
      },
    }));
  }, [data]);

  // TGT-04 — IIPS Score Distribution: a PRESENTATIONAL GROUPING of CERTIFIED values only
  // (the same pattern the Cross-Sector surface already uses for its verdict distribution).
  // Counts come from the closed certified verdict vocabulary in the payload; no band, bin edge,
  // quadrant or threshold is computed or invented here.
  const scoreDistribution: ScoreBucket[] = useMemo(() => {
    if (!universe) return [];
    const counts = new Map<string, number>();
    for (const c of universe.companies) counts.set(c.verdict, (counts.get(c.verdict) ?? 0) + 1);
    return [...counts.entries()].map(([verdict, count]) => ({ verdict, count }));
  }, [universe]);

  // TGT-04 — descriptive statistics over the governed composites. Deterministic functions of
  // the CERTIFIED values received; nothing is substituted when the universe is unavailable.
  const scoreStats: ScoreStats | null = useMemo(() => {
    if (!universe || universe.companies.length === 0) return null;
    const values = universe.companies.map((c) => c.composite).slice().sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    return { companies: values.length, min: values[0], median, max: values[values.length - 1] };
  }, [universe]);

  const rankedRows: RankedRow[] = useMemo(() => {
    if (!data) return [];
    return data.ranking.map((r, i) => ({ ...r, index: i }));
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load certified executive data: ${error}`} />;
  if (!data) return <UnavailableState />;
  // D89 — governed degraded state (UI12 LIVE/PIT). MUST precede any SNAPSHOT-shape dereference.
  if (isDegraded(data)) return <DataModeUnavailable data={data} title="Executive" />;

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

      {/* Top opportunity highlight (from certified opportunity output) — TGT-13: drills through
          to the existing governed company route using the payload's own sector identity. */}
      {opportunity.length > 0 && (
        <div data-testid="top-opportunity" style={{ border: '1px solid var(--color-status-positive)', borderRadius: 6, padding: 12, marginTop: 16, background: 'var(--color-surface-1)' }}>
          <strong>Top opportunity:</strong> {opportunity[0].sector} (conviction {opportunity[0].conviction}){' '}
          <Link data-testid="top-opportunity-link" to={`/research/company/${opportunity[0].sector}`}>Open company →</Link>
        </div>
      )}

      {/* Priority opportunities (from certified ranking). TGT-03 — governed mover semantics:
          the CERTIFIED ranking order is rendered verbatim (no client re-sort), and each governed
          row now drills through (TGT-13). A movement/delta signal is deliberately NOT derived:
          the frozen SNAPSHOT baseline carries a single vintage, so any period-over-period mover
          value would be fabrication. The absence is disclosed rather than concealed. */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Priority Opportunities</h2>
      <p data-testid="movers-disclosure" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '0 0 8px' }}>
        Ranked by certified conviction from the governed executive payload, in the payload&apos;s own
        certified order. The frozen SNAPSHOT baseline provides a single vintage, so no
        period-over-period movement or delta is computed or displayed.
      </p>
      <DataTable
        columns={[
          { key: 'sector', header: 'Sector', render: (r: RankedRow) => r.sector },
          { key: 'conviction', header: 'Conviction', render: (r: RankedRow) => r.conviction },
          { key: 'trend', header: 'Trend', render: (r: RankedRow) => <TrendIndicator direction={r.index < 3 ? 'up' : 'flat'} /> },
          {
            key: 'company',
            header: 'Company',
            // TGT-12/TGT-13 — navigates to the EXISTING governed company workspace. The payload's
            // `sector` is used exactly as the existing surfaces already address that route.
            render: (r: RankedRow) => <Link data-testid={`mover-link-${r.sector}`} to={`/research/company/${r.sector}`}>Open company →</Link>,
          },
        ]}
        rows={rankedRows}
        emptyLabel="No opportunities available"
      />
      <p data-testid="trend-cue-disclosure" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '8px 0 0' }}>
        The Trend column is a presentational rank cue derived from the certified rank position. It
        is NOT a verified movement signal and carries no certified delta.
      </p>

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

      {/* TGT-04 — IIPS SCORE DISTRIBUTION (governed /api/decision-matrix; no new endpoint).
          Rendered independently of the certified executive payload: if the universe is
          unavailable or degraded, this section degrades alone and the rest of the dashboard
          is unaffected — the governed state is shown verbatim, never substituted. */}
      <h2 style={{ fontSize: 18, marginTop: 24 }}>IIPS Score Distribution</h2>
      {universeLoading && <p data-testid="score-distribution-loading" style={{ fontSize: 13 }}>Loading governed score distribution…</p>}

      {!universeLoading && universeDegraded && (
        <p data-testid="score-distribution-unavailable" style={{ color: 'var(--color-ink-secondary)', fontSize: 13 }}>
          {universeDegraded.reason} Blocking dependency: {universeDegraded.dependency}
        </p>
      )}

      {!universeLoading && !universeDegraded && universeError !== null && (
        <p data-testid="score-distribution-unavailable" style={{ color: 'var(--color-ink-secondary)', fontSize: 13 }}>
          Governed decision-matrix universe unavailable: {universeError}
        </p>
      )}

      {!universeLoading && universe && (
        <>
          <ChartContainer title="Certified composite distribution — companies per certified verdict class">
            <SimpleBarChart data={scoreDistribution.map((b) => ({ label: b.verdict, value: b.count }))} />
          </ChartContainer>

          {scoreStats && (
            <div style={{ marginTop: 12 }}>
              <MetricTable
                rows={[
                  { label: 'Governed universe (companies)', value: scoreStats.companies },
                  { label: 'Certified composite — minimum', value: scoreStats.min },
                  { label: 'Certified composite — median', value: scoreStats.median },
                  { label: 'Certified composite — maximum', value: scoreStats.max },
                ]}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <DataTable
              columns={[
                { key: 'sector', header: 'Company / Sector', render: (c: MatrixCompany) => c.sector },
                { key: 'verdict', header: 'Verdict', render: (c: MatrixCompany) => c.verdict },
                { key: 'composite', header: 'Certified composite', render: (c: MatrixCompany) => c.composite },
                {
                  key: 'company',
                  header: 'Company',
                  render: (c: MatrixCompany) => <Link data-testid={`distribution-link-${c.sector}`} to={`/research/company/${c.sector}`}>Open company →</Link>,
                },
              ]}
              rows={universe.companies}
              emptyLabel="No governed companies available"
            />
          </div>

          <p data-testid="score-distribution-disclosure" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '8px 0 0' }}>
            Source: governed /api/decision-matrix (freshness {universe.provenance.freshness}). The per-verdict
            counts and the minimum / median / maximum are descriptive statistics computed in the presentation
            layer from the CERTIFIED values returned by that endpoint. No score band, bin edge, quadrant or
            threshold is computed or invented, and no value is substituted when the universe is unavailable.
          </p>
        </>
      )}

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
            {/* TGT-12/TGT-13 — drill-through to the EXISTING governed routes. The in-place
                trust chain remains available above; navigation is additive, not a replacement. */}
            <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
              <Link data-testid={`decision-company-link-${d.sector}`} to={`/research/company/${d.sector}`}>Company →</Link>
              <Link data-testid={`decision-evidence-link-${d.sector}`} to={`/evidence/${d.sector}`}>Evidence →</Link>
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
        {/* TGT-13 — the evidence card itself is UNCHANGED (no component rebuild); a drill-through
            link is composed alongside it. Evidence remains governed-only: the target route
            resolves its own payload and renders it through Ad17Disclosure (AD-17 UNRESOLVED). */}
        {evidenceEntries.map((e) => (
          <div key={e.reference.evidenceId}>
            <EvidenceCard reference={e.reference} />
            <div style={{ marginTop: 6, fontSize: 13 }}>
              <Link data-testid={`evidence-link-${e.sector}`} to={`/evidence/${e.sector}`}>Open evidence →</Link>
            </div>
          </div>
        ))}
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

/** TGT-13 — an evidence reference paired with the governed sector it belongs to (drill-through). */
interface EvidenceEntry {
  readonly sector: string;
  readonly reference: EvidenceReference;
}

/** TGT-04 — one presentational bucket: a CERTIFIED verdict class and its governed count. */
interface ScoreBucket {
  readonly verdict: string;
  readonly count: number;
}

/** TGT-04 — descriptive statistics over the CERTIFIED composites (no thresholds). */
interface ScoreStats {
  readonly companies: number;
  readonly min: number;
  readonly median: number;
  readonly max: number;
}
