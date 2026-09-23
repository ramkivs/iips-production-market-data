/**
 * Institutional Investment Platform System (IIPS)
 * Executive Surface — Phase-3, PATH L (LOCAL VIEW-MODEL / OFFLINE, PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 Phase-3 Authority Act (RAMKI): `phase3-executive-presentation-only-2026-09-22-001`
 *                 OPTION A — Executive presentation-only Path-L convergence
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ FORENSIC BASIS — WHY THIS SURFACE RENDERS ITS UNAVAILABLE STATE UNCONDITIONALLY ══════
 *  GATE-PHASE-3-EXECUTIVE-PAYLOAD-FORENSIC (checkpoint 5ef8960fa4d38746b7191061810040a57bf83c71)
 *  returned classification B — FAIL CLOSED across ALL THREE mandatory payload domains:
 *
 *    · MarketDataDTO     = FAIL (only invalid-record test harnesses; zero governance metadata;
 *                          companyId 'INFY' does not resolve in the governed D05 master)
 *    · EngineScoreOutput = FAIL (zero stored payloads; derivation transitively blocked by the
 *                          absent market data, and P04 identity verification fails closed)
 *    · IntelligenceDTO   = FAIL (already adjudicated by gate a647213)
 *
 *  `UI02ExecutiveSummaryBuilder.build()` requires all three SIMULTANEOUSLY — they are not
 *  optional and there is no partial-render path. Consequently, in the current offline
 *  execution mode this route renders its unavailable state UNCONDITIONALLY. That is the
 *  honest outcome of the forensic finding, not a defect.
 *
 * ══ PATH-L CONSTRUCTION — WHAT THIS IS, AND WHAT IT IS NOT ═══════════════════════════════
 *  Bound to the EXISTING, ALREADY-TESTED local view-model builder
 *  `UI02ExecutiveSummaryBuilder` (src/ui/view_models/ui02_executive_summary.ts) — the most
 *  heavily covered view-model in the repository (6 test suites). It is a pure synchronous
 *  function and contains ZERO network references.
 *
 *  NOT introduced here: `api/executive`, `api/evidence`, `api/replay`, `api/dataMode`,
 *  `authFetch`, `core/auth/oidcClient`, AuthProvider, keycloakAdapter, `frontend/server/**`.
 *  There is no fetch, no XMLHttpRequest, no WebSocket, no EventSource, no /api/* call site,
 *  no token acquisition, no credential access, and no persistence.
 *
 * ══ DATA HONESTY — THE BINDING PROHIBITIONS OF THE AUTHORITY ACT §3.2 ════════════════════
 *    · synthesises NO MarketDataDTO, NO EngineScoreOutput, NO IntelligenceDTO;
 *    · fabricates NO recommendation, grade, score, or price. Executive is the headline
 *      decision surface — inventing these would present a complete, confident, entirely
 *      fictional investment view, and the builder's worst-case quality rollup would then
 *      report that fiction as GOOD;
 *    · fabricates NO lineage. It never generates or defaults a lineageDigest — the digest
 *      shown is carried verbatim from the governed market-data provenance;
 *    · performs NO production data ingestion.
 *
 *  Every value rendered is surfaced verbatim from the view model. Nothing is synthesised,
 *  defaulted, or inferred.
 */

import { useMemo } from 'react';
import { UI02ExecutiveSummaryBuilder } from '../../../../src/ui/view_models/ui02_executive_summary.js';
import type { UI02ExecutiveSummaryViewModel } from '../../../../src/ui/types.js';
import type { MarketDataDTO } from '../../../../src/transports/market_data_dto.js';
import type { IntelligenceDTO } from '../../../../src/transports/intelligence_dto.js';
import type { EngineScoreOutput } from '../../../../src/engine_adapters/types.js';
import { MetricCard, MetricGroup, DataTable, type Column } from '../../components/data/DataComponents.js';
import { FreshnessBadge } from '../../components/ui/Badges.js';
import { EmptyState, StaleDataState, UnavailableState } from '../../components/state/StateComponents.js';

export interface ExecutiveSurfaceProps {
  /**
   * Governed market-data payload. One of THREE MANDATORY inputs to the UI02 builder;
   * absence of any one yields the explicit unavailable state. NO fallback data is fabricated.
   */
  marketData?: MarketDataDTO;
  /** Governed engine-score payload. Mandatory input; absence yields the unavailable state. */
  engineScore?: EngineScoreOutput;
  /** Governed intelligence payload. Mandatory input; absence yields the unavailable state. */
  intelligence?: IntelligenceDTO;
  /** Display company name. Required only when all three payloads are supplied. */
  companyName?: string;
  /** Optional governed rank. Never invented when absent. */
  rank?: number;
  /** Viewport width forwarded to the responsive engine (defaults to the builder's 1280). */
  viewportWidth?: number;
}

type FactorHighlight = UI02ExecutiveSummaryViewModel['factorHighlights'][number];

const FACTOR_COLUMNS: readonly Column<FactorHighlight>[] = [
  { key: 'factor', header: 'Factor', render: (r) => r.factor },
  { key: 'score', header: 'Score', render: (r) => String(r.score) },
  { key: 'weight', header: 'Weight', render: (r) => `${Math.round(r.weight * 100)}%` },
];

/**
 * Renders the governed executive summary for a single company.
 *
 * Pure presentation: the view model is built synchronously via `useMemo`. There is no effect,
 * no fetch, and no subscription.
 */
export function ExecutiveSurface({
  marketData,
  engineScore,
  intelligence,
  companyName,
  rank,
  viewportWidth,
}: ExecutiveSurfaceProps) {
  const vm = useMemo<UI02ExecutiveSummaryViewModel | null>(() => {
    // Fail closed. All three payloads are MANDATORY in the governed UI02 contract; a
    // partially supplied set must never be completed with substituted or default values.
    if (!marketData || !engineScore || !intelligence || !companyName) return null;
    return UI02ExecutiveSummaryBuilder.build({
      marketData,
      engineScore,
      intelligence,
      companyName,
      rank,
      viewportWidth,
    });
  }, [marketData, engineScore, intelligence, companyName, rank, viewportWidth]);

  if (!vm) {
    return (
      <section className="app-surface" aria-labelledby="executive-heading">
        <h2 id="executive-heading" className="app-surface__title">
          Executive Summary
        </h2>
        <UnavailableState />
        <EmptyState label="No governed executive payload loaded" />
        <p className="app-surface__note" data-testid="executive-unavailable-reason">
          The executive summary requires three governed payloads together — market data, engine
          score and intelligence — and none is currently authorized for offline execution.
          Because all three are mandatory, this surface renders no price, score, grade or
          recommendation rather than present an unbacked decision view.
        </p>
      </section>
    );
  }

  const q = vm.qualityIndicator;
  const intel = vm.intelligenceSummary;

  return (
    <section className="app-surface" aria-labelledby="executive-heading">
      <header className="app-surface__header">
        <h2 id="executive-heading" className="app-surface__title">
          Executive Summary — {vm.companyName}
        </h2>
        <div className="app-surface__meta">
          <span data-testid="executive-company-id">{vm.companyId}</span>
          <FreshnessBadge state={vm.provenance.replayConstraintApplied ? 'replay' : 'snapshot'} />
          <span data-testid="executive-quality" style={{ color: q.colorHex }} aria-label={q.ariaText}>
            {q.icon} {q.label}
          </span>
          <span data-testid="executive-asof">As of {vm.asOf}</span>
          <span data-testid="executive-grade-label">
            Grade <strong data-testid="executive-grade">{vm.compositeScore.grade}</strong>
          </span>
        </div>
      </header>

      <div
        id={vm.accessibility.focusElementId}
        role={vm.accessibility.ariaRole}
        aria-live={vm.accessibility.ariaLive}
        aria-label={vm.accessibility.tableCaption}
        tabIndex={-1}
      >
        {q.isDegraded && <StaleDataState asOf={vm.asOf} />}

        <MetricGroup label="Quote">
          <MetricCard label="Last Price" value={vm.quote.lastPrice} unit={vm.quote.currency} />
          <MetricCard
            label="Change"
            value={vm.quote.change}
            direction={vm.quote.change > 0 ? 'positive' : vm.quote.change < 0 ? 'negative' : 'neutral'}
          />
          <MetricCard
            label="% Change"
            value={vm.quote.pctChange}
            unit="%"
            direction={vm.quote.pctChange > 0 ? 'positive' : vm.quote.pctChange < 0 ? 'negative' : 'neutral'}
          />
          <MetricCard label="Volume" value={vm.quote.volume} />
        </MetricGroup>

        <MetricGroup label="Composite Score">
          <MetricCard label="Score" value={vm.compositeScore.score} />
          {vm.compositeScore.rank !== undefined && (
            <MetricCard label="Rank" value={vm.compositeScore.rank} />
          )}
        </MetricGroup>

        <section aria-label="Factor Highlights" className="app-surface__block">
          <h3 className="app-surface__subtitle">Factor Highlights</h3>
          <DataTable
            columns={FACTOR_COLUMNS}
            rows={vm.factorHighlights}
            emptyLabel="No factor breakdown in this payload."
          />
        </section>

        <MetricGroup label="Intelligence Summary">
          <MetricCard label="News Sentiment" value={intel.newsSentiment} />
          <MetricCard label="Consensus Target" value={intel.estimatesConsensusPrice} />
          <MetricCard label="Alt-Data Confidence" value={intel.altDataConfidence} />
          <span data-testid="executive-macro-trend" className="app-surface__note">
            Macro trend: {intel.macroTrend}
          </span>
        </MetricGroup>
      </div>

      {/* AD-17 replay constraint, rendered verbatim when the governed payload carries it. */}
      {vm.provenance.replayConstraintApplied && vm.provenance.replayConstraintText && (
        <p data-testid="executive-ad17" className="app-surface__note">
          {vm.provenance.replayConstraintText}
        </p>
      )}

      <footer className="app-surface__provenance" data-testid="executive-provenance">
        <span>Source: {vm.provenance.sourceClassification}</span>
        <span>•</span>
        <span>Version: {vm.provenance.dataVersion}</span>
        <span>•</span>
        <span>Lineage: {vm.provenance.lineageDigest}</span>
      </footer>
    </section>
  );
}
