/**
 * Institutional Investment Platform System (IIPS)
 * Research Surface — Phase-4, PATH L (LOCAL VIEW-MODEL / OFFLINE, PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 Phase-4 Authority Acts (RAMKI):
 *                   `phase4-research-identity-designation-2026-09-23-001`
 *                     (/research = UI03_FUNDAMENTAL_ANALYSIS, single route, zero children)
 *                   `phase4-research-ui03-presentation-only-2026-09-23-001`
 *                     (OPTION A — presentation-only Path-L convergence)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ IDENTITY DESIGNATION ═════════════════════════════════════════════════════════════════
 *  /research presents EXACTLY ONE registered surface: UI03_FUNDAMENTAL_ANALYSIS.
 *  No other surface is merged or implicitly selected: UI05 / UI06 / UI12 are NOT designated,
 *  and UI13 (macro) is EXCLUDED — /api/macro is governed LIVE-only under D91 / authority
 *  D88 with SNAPSHOT fallback disallowed, and no relief has been granted. The six historical
 *  Research child routes (ResearchHub / ResearchEvents / SectorIntelligence / MacroContext /
 *  CompanyIntelligence / CrossSectorIntelligence) remain pruned and are NOT restored.
 *
 * ══ FORENSIC BASIS — WHY THIS SURFACE RENDERS ITS UNAVAILABLE STATE UNCONDITIONALLY ══════
 *  GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC (checkpoint bc6d8ae5cf07a21f7436bac04076a215187473f3)
 *  determination 4 / gap R-1: ZERO governed FundamentalsDTO payloads exist anywhere in the
 *  repository. The UI03 builder requires `fundamentals` (carrying a full ExecutiveProvenance)
 *  as a MANDATORY input — there is no partial-render path for a missing payload. The mounted
 *  route therefore renders its governed unavailable state UNCONDITIONALLY. That is the honest
 *  outcome of the forensic finding, not a defect.
 *
 * ══ PATH-L CONSTRUCTION — WHAT THIS IS, AND WHAT IT IS NOT ═══════════════════════════════
 *  Bound to the EXISTING, ALREADY-TESTED local view-model builder
 *  `UI03FundamentalAnalysisBuilder` (src/ui/view_models/ui03_fundamental_analysis.ts;
 *  exercised by wse_surfaces_ui01_ui14 and wse_p13_ui_integration). Pure, synchronous,
 *  offline — no effect, no fetch, no subscription.
 *
 *  NOT introduced here: `api/*`, `authFetch`, OIDC, Keycloak, `frontend/server/**`, network,
 *  credentials, persistence. There is no fetch, no XMLHttpRequest, no WebSocket, no
 *  EventSource, no /api/* call site, no token acquisition.
 *
 * ══ DATA HONESTY — THE BINDING PROHIBITIONS OF THE AUTHORITY ACT §3.2 ════════════════════
 *    · synthesises NO FundamentalsDTO — no ratios, TTM statements or balance-sheet blocks
 *      are invented, defaulted client-side, or computed from raw data (P13-03: normalized
 *      ratios WITHOUT client calculation);
 *    · promotes NO fixture — the existing test harnesses carry the UNGOVERNED
 *      `companyId: 'INFY'` form and are never wired to this route;
 *    · invents NO provenance and generates NO lineage — the digest displayed is carried
 *      verbatim from the supplied governed ExecutiveProvenance;
 *    · performs NO production data ingestion.
 *
 *  Every value rendered is surfaced verbatim from the view model, including the builder's
 *  own governed defaults (which are P13-tested behaviour, not surface-level fabrication).
 */

import { useMemo } from 'react';
import { UI03FundamentalAnalysisBuilder } from '../../../../src/ui/view_models/ui03_fundamental_analysis.js';
import type { UI03FundamentalAnalysisViewModel } from '../../../../src/ui/types.js';
import type { FundamentalsDTO } from '../../../../src/transports/fundamentals_dto.js';
import { MetricCard, MetricGroup, DataTable, type Column } from '../../components/data/DataComponents.js';
import { FreshnessBadge } from '../../components/ui/Badges.js';
import { EmptyState, StaleDataState, UnavailableState } from '../../components/state/StateComponents.js';

export interface ResearchSurfaceProps {
  /**
   * Governed FundamentalsDTO payload (statements + ratios + full ExecutiveProvenance).
   * Mandatory input to the UI03 builder; absence yields the explicit unavailable state.
   * NO fallback data is fabricated.
   */
  fundamentals?: FundamentalsDTO;
  /** Display company name. Required only when `fundamentals` is supplied. */
  companyName?: string;
  /** Optional PIT vintage overrides forwarded to the builder. */
  filingDate?: string;
  periodEndDate?: string;
  restatementIndex?: number;
  /** Viewport width forwarded to the responsive engine (defaults to the builder's 1280). */
  viewportWidth?: number;
}

/** The governed ratio metrics presented by this surface (fixed field selection). */
const RATIO_METRICS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'peRatio', label: 'P/E' },
  { key: 'pbRatio', label: 'P/B' },
  { key: 'evToEbitda', label: 'EV/EBITDA' },
  { key: 'roe', label: 'ROE %' },
  { key: 'roce', label: 'ROCE %' },
  { key: 'debtToEquity', label: 'Debt/Equity' },
  { key: 'operatingMargin', label: 'Operating Margin %' },
  { key: 'netProfitMargin', label: 'Net Profit Margin %' },
  { key: 'splitAdjustedEps', label: 'EPS (split-adjusted)' },
];

type RatioRow = { metric: string; value: string };

const RATIO_COLUMNS: readonly Column<RatioRow>[] = [
  { key: 'metric', header: 'Metric', render: (r) => r.metric },
  { key: 'value', header: 'Value', render: (r) => r.value },
];

/**
 * Renders the governed fundamental analysis for a single company (UI03).
 *
 * Pure presentation: the view model is built synchronously via `useMemo`. There is no
 * effect, no fetch, and no subscription.
 */
export function ResearchSurface({
  fundamentals,
  companyName,
  filingDate,
  periodEndDate,
  restatementIndex,
  viewportWidth,
}: ResearchSurfaceProps) {
  const vm = useMemo<UI03FundamentalAnalysisViewModel | null>(() => {
    // Fail closed. The governed FundamentalsDTO (with its ExecutiveProvenance) and the
    // display identity are both mandatory; neither may be substituted or defaulted.
    if (!fundamentals || !companyName) return null;
    return UI03FundamentalAnalysisBuilder.build({
      fundamentals,
      companyName,
      filingDate,
      periodEndDate,
      restatementIndex,
      viewportWidth,
    });
  }, [fundamentals, companyName, filingDate, periodEndDate, restatementIndex, viewportWidth]);

  if (!vm) {
    return (
      <section className="app-surface" aria-labelledby="research-heading">
        <h2 id="research-heading" className="app-surface__title">
          Fundamental Analysis
        </h2>
        <UnavailableState />
        <EmptyState label="No governed fundamentals payload loaded" />
        <p className="app-surface__note" data-testid="research-unavailable-reason">
          This surface presents UI03_FUNDAMENTAL_ANALYSIS. A governed FundamentalsDTO —
          statements, ratios and full provenance — is required and none is currently
          authorized for offline execution, so no ratio, statement or valuation is shown
          rather than present an unbacked analysis.
        </p>
      </section>
    );
  }

  const q = vm.qualityIndicator;

  const ratioRows: RatioRow[] = RATIO_METRICS.map(({ key, label }) => {
    const v = vm.ratios[key];
    return { metric: label, value: v === null || v === undefined ? '—' : String(v) };
  });

  return (
    <section className="app-surface" aria-labelledby="research-heading">
      <header className="app-surface__header">
        <h2 id="research-heading" className="app-surface__title">
          Fundamental Analysis — {vm.companyName}
        </h2>
        <div className="app-surface__meta">
          <span data-testid="research-company-id">{vm.companyId}</span>
          <FreshnessBadge state={vm.provenance.replayConstraintApplied ? 'replay' : 'snapshot'} />
          <span data-testid="research-quality" style={{ color: q.colorHex }} aria-label={q.ariaText}>
            {q.icon} {q.label}
          </span>
          <span data-testid="research-asof">As of {vm.asOf}</span>
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

        <p className="app-surface__note" data-testid="research-pinned-vintage">
          {`Pinned vintage — filed ${vm.pinnedVintage.filingDate} · period ending ${vm.pinnedVintage.periodEndDate} · restatement index ${vm.pinnedVintage.restatementIndex}`}
        </p>

        <section aria-label="Ratios" className="app-surface__block">
          <h3 className="app-surface__subtitle">Ratios (normalized, no client calculation)</h3>
          <DataTable
            columns={RATIO_COLUMNS}
            rows={ratioRows}
            emptyLabel="No ratios in this payload."
          />
        </section>

        <MetricGroup label="Trailing Twelve Months">
          <MetricCard label="Revenue" value={vm.ttmStatements.revenue} />
          <MetricCard label="EBITDA" value={vm.ttmStatements.ebitda} />
          <MetricCard label="Net Income" value={vm.ttmStatements.netIncome} />
          <MetricCard label="Operating Cash Flow" value={vm.ttmStatements.operatingCashFlow} />
          <MetricCard label="Quarters Covered" value={vm.ttmStatements.quartersCount} />
        </MetricGroup>

        <p className="app-surface__note" data-testid="research-balance-sheet-identity">
          Balance-sheet identity (assets = liabilities + net worth):{' '}
          <strong>{vm.balanceSheetIdentityValid ? 'VALID' : 'INVALID'}</strong>
        </p>
      </div>

      {/* AD-17 replay constraint, rendered verbatim when the governed payload carries it. */}
      {vm.provenance.replayConstraintApplied && vm.provenance.replayConstraintText && (
        <p data-testid="research-ad17" className="app-surface__note">
          {vm.provenance.replayConstraintText}
        </p>
      )}

      <footer className="app-surface__provenance" data-testid="research-provenance">
        <span>Source: {vm.provenance.sourceClassification}</span>
        <span>•</span>
        <span>Version: {vm.provenance.dataVersion}</span>
        <span>•</span>
        <span>Lineage: {vm.provenance.lineageDigest}</span>
      </footer>
    </section>
  );
}
