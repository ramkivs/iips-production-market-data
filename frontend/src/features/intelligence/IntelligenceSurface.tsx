/**
 * Institutional Investment Platform System (IIPS)
 * Intelligence Surface — Phase-1C, PATH L (LOCAL VIEW-MODEL / OFFLINE)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 Phase-1C Authority Designation (RAMKI): Intelligence via Path L
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ PATH-L CONSTRUCTION — WHAT THIS IS, AND WHAT IT IS NOT ═══════════════════════════════
 *  This surface is bound to the EXISTING, ALREADY-TESTED local view-model builder
 *  `UI04DomainIntelligenceBuilder` (src/ui/view_models/ui04_domain_intelligence.ts), which
 *  is a pure function over an `IntelligenceDTO`. It contains ZERO network references.
 *
 *  It is therefore NOT the historical API-backed Intelligence implementation:
 *    · features/intelligence/IntelligenceHub.tsx (c440) is NOT recovered.
 *    · api/decisionMatrix, api/authFetch, core/auth/oidcClient, AuthProvider,
 *      keycloakAdapter and frontend/server/** are NOT introduced.
 *    · There is no fetch, no XMLHttpRequest, no WebSocket, no /api/* call site,
 *      no token acquisition, no credential access, and no persistence.
 *
 *  Per the Phase-1C authority designation, the Path-H API/server/auth tier is
 *  NOT AUTHORIZED. The production/live network boundary remains UNCHANGED / FAIL-CLOSED.
 *
 * ══ DATA HONESTY ═════════════════════════════════════════════════════════════════════════
 *  This component renders ONLY what it is given. It fabricates no market data, no company
 *  identity, and no companyId. When no `IntelligenceDTO` is supplied it renders an explicit
 *  "no intelligence data loaded" state rather than inventing content — the offline execution
 *  mode has no governed intelligence payload wired to it yet, and pretending otherwise would
 *  be exactly the fabrication the navigation honesty contract forbids.
 *
 *  Provenance, quality state and the AD-17 replay constraint are surfaced verbatim from the
 *  view model; they are never synthesised here.
 */

import { useMemo } from 'react';
import {
  UI04DomainIntelligenceBuilder,
} from '../../../../src/ui/view_models/ui04_domain_intelligence.js';
import type { UI04DomainIntelligenceViewModel } from '../../../../src/ui/types.js';
import type { IntelligenceDTO } from '../../../../src/transports/intelligence_dto.js';
import { MetricCard, MetricGroup, DataTable, type Column } from '../../components/data/DataComponents.js';
import { CertifiedBadge, FreshnessBadge } from '../../components/ui/Badges.js';
import { EmptyState, StaleDataState } from '../../components/state/StateComponents.js';

export interface IntelligenceSurfaceProps {
  /**
   * Governed intelligence payload. Optional: when omitted the surface renders an explicit
   * empty state. NO fallback data is fabricated.
   */
  intelligence?: IntelligenceDTO;
  /** Display company name. Required only when `intelligence` is supplied. */
  companyName?: string;
  /** Viewport width forwarded to the responsive engine (defaults to the builder's 1280). */
  viewportWidth?: number;
}

type NewsSignal = UI04DomainIntelligenceViewModel['newsSignals'][number];
type MacroIndicator = UI04DomainIntelligenceViewModel['macroIndicators'][number];
type AltDataSignal = UI04DomainIntelligenceViewModel['altDataSignals'][number];

const NEWS_COLUMNS: readonly Column<NewsSignal>[] = [
  { key: 'headline', header: 'Headline', render: (r) => r.headline },
  { key: 'sentiment', header: 'Sentiment', render: (r) => r.sentiment.toFixed(2) },
  { key: 'source', header: 'Source', render: (r) => r.sourceClass },
  {
    key: 'official',
    header: 'Exchange Disclosure',
    render: (r) => (r.isOfficialExchange ? <CertifiedBadge /> : '—'),
  },
];

const MACRO_COLUMNS: readonly Column<MacroIndicator>[] = [
  { key: 'indicatorCode', header: 'Indicator', render: (r) => r.indicatorCode },
  { key: 'value', header: 'Value', render: (r) => String(r.value) },
  { key: 'period', header: 'Period', render: (r) => r.period },
  { key: 'releaseDate', header: 'Release', render: (r) => r.releaseDate },
  { key: 'vintageDate', header: 'Vintage', render: (r) => r.vintageDate },
];

const ALTDATA_COLUMNS: readonly Column<AltDataSignal>[] = [
  { key: 'signalName', header: 'Signal', render: (r) => r.signalName },
  { key: 'confidence', header: 'Confidence', render: (r) => r.confidence.toFixed(2) },
  { key: 'approvalRef', header: 'Approval Reference', render: (r) => r.approvalRef },
];

export function IntelligenceSurface({
  intelligence,
  companyName,
  viewportWidth,
}: IntelligenceSurfaceProps) {
  // Pure, synchronous, offline. No effect, no fetch, no subscription.
  const vm = useMemo<UI04DomainIntelligenceViewModel | null>(() => {
    if (!intelligence) return null;
    return UI04DomainIntelligenceBuilder.build({
      intelligence,
      companyName: companyName ?? intelligence.companyId,
      viewportWidth,
    });
  }, [intelligence, companyName, viewportWidth]);

  if (!vm) {
    return (
      <section className="app-surface" aria-labelledby="intelligence-heading">
        <h2 id="intelligence-heading" className="app-surface__title">
          Intelligence
        </h2>
        <EmptyState label="No intelligence data loaded. This surface renders governed intelligence only when a payload is supplied; it does not fetch data and fabricates none." />
      </section>
    );
  }

  return (
    <section className="app-surface" aria-labelledby="intelligence-heading">
      <header className="app-surface__header">
        <h2 id="intelligence-heading" className="app-surface__title">
          Intelligence — {vm.companyName}
        </h2>
        <div className="app-surface__meta">
          <FreshnessBadge state={vm.provenance.replayConstraintApplied ? 'replay' : 'snapshot'} />
          <span data-testid="intelligence-quality" style={{ color: vm.qualityIndicator.colorHex }}>
            {vm.qualityIndicator.icon} {vm.qualityIndicator.label}
          </span>
          <span data-testid="intelligence-asof">As of {vm.asOf}</span>
        </div>
      </header>

      {vm.qualityIndicator.isDegraded && (
        <StaleDataState asOf={vm.asOf} />
      )}

      {/* AD-17 replay constraint, rendered verbatim when the governed payload carries it. */}
      {vm.provenance.replayConstraintApplied && vm.provenance.replayConstraintText && (
        <p data-testid="intelligence-ad17" className="app-surface__note">
          {vm.provenance.replayConstraintText}
        </p>
      )}

      <MetricGroup label="Estimates Consensus">
        <MetricCard label="Target Price" value={vm.estimatesConsensus.targetPrice} />
        <MetricCard label="Analyst Count" value={vm.estimatesConsensus.analystCount} />
        <MetricCard
          label="Consensus Valid"
          value={vm.estimatesConsensus.isValidConsensus ? 1 : 0}
        />
      </MetricGroup>

      <section aria-label="News Signals" className="app-surface__block">
        <h3 className="app-surface__subtitle">News Signals</h3>
        <div
          id={vm.accessibility.focusElementId}
          role={vm.accessibility.ariaRole}
          aria-live={vm.accessibility.ariaLive}
          aria-label={vm.accessibility.tableCaption}
        >
          <DataTable
            columns={NEWS_COLUMNS}
            rows={vm.newsSignals}
            emptyLabel="No governed news signals in this payload."
          />
        </div>
      </section>

      <section aria-label="Macro Indicators" className="app-surface__block">
        <h3 className="app-surface__subtitle">Macro Indicators</h3>
        <DataTable
          columns={MACRO_COLUMNS}
          rows={vm.macroIndicators}
          emptyLabel="No macro indicators in this payload."
        />
      </section>

      <section aria-label="Alternative Data Signals" className="app-surface__block">
        <h3 className="app-surface__subtitle">Alternative Data Signals</h3>
        <DataTable
          columns={ALTDATA_COLUMNS}
          rows={vm.altDataSignals}
          emptyLabel="No alternative-data signals in this payload."
        />
      </section>

      <footer className="app-surface__provenance" data-testid="intelligence-provenance">
        <span>Source: {vm.provenance.sourceClassification}</span>
        <span>•</span>
        <span>Version: {vm.provenance.dataVersion}</span>
        <span>•</span>
        <span>Lineage: {vm.provenance.lineageDigest}</span>
        <span>•</span>
        <span>Evaluated: {vm.provenance.evaluatedAt}</span>
      </footer>
    </section>
  );
}
