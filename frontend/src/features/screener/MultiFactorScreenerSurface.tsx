/**
 * Institutional Investment Platform System (IIPS)
 * UI06 Multi-Factor Screener — F-9 restoration-only surface binding
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 f8-ui06-screener-restoration-2026-09-23-001
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * This surface binds the existing qualified UI06MultiFactorScreenerBuilder and existing
 * in-process ScreenerService contract. It owns no candidate data and performs no filtering.
 * A caller must supply both a governed service instance and criteria before the builder can
 * execute. The mounted route supplies neither because the D01-derived governed candidate
 * universe is not commissioned; it therefore fails closed without constructing a response.
 */

import { useMemo } from 'react';
import { UI06MultiFactorScreenerBuilder } from '../../../../src/ui/view_models/ui06_multifactor_screener.js';
import type { UI06MultiFactorScreenerViewModel } from '../../../../src/ui/types.js';
import type {
  ScreenerCandidate,
  ScreenerFilter,
  ScreenerService,
} from '../../../../src/transports/screener_service.js';
import { DataTable, type Column } from '../../components/data/DataComponents.js';
import { UnavailableState } from '../../components/state/StateComponents.js';

export interface MultiFactorScreenerSurfaceProps {
  /** Governed criteria forwarded verbatim to the existing UI06 builder. */
  criteria?: ScreenerFilter;
  /** Existing in-process service carrying the separately commissioned candidate universe. */
  screenerService?: ScreenerService;
  /** Viewport width forwarded to the existing responsive contract. */
  viewportWidth?: number;
}

const RESULT_COLUMNS: readonly Column<ScreenerCandidate>[] = [
  { key: 'companyName', header: 'Company', render: (row) => row.companyName },
  { key: 'sector', header: 'Sector', render: (row) => row.sector },
  { key: 'ltp', header: 'Last Price', render: (row) => String(row.ltp) },
  { key: 'pe', header: 'P/E', render: (row) => row.pe === null ? 'unavailable' : String(row.pe) },
  { key: 'pb', header: 'P/B', render: (row) => row.pb === null ? 'unavailable' : String(row.pb) },
  { key: 'roe', header: 'ROE', render: (row) => row.roe === null ? 'unavailable' : String(row.roe) },
  {
    key: 'operatingMargin',
    header: 'Operating Margin',
    render: (row) => row.operatingMargin === null ? 'unavailable' : String(row.operatingMargin),
  },
  { key: 'score', header: 'Score', render: (row) => String(row.score) },
  { key: 'grade', header: 'Grade', render: (row) => row.grade },
  { key: 'quality', header: 'Quality', render: (row) => row.quality },
];

/**
 * Routed UI06 presentation surface. The no-input path is the production path for this gate
 * and is deliberately unavailable until a governed candidate universe is commissioned.
 */
export function MultiFactorScreenerSurface({
  criteria,
  screenerService,
  viewportWidth,
}: MultiFactorScreenerSurfaceProps) {
  const vm = useMemo<UI06MultiFactorScreenerViewModel | null>(() => {
    if (!criteria || !screenerService) return null;
    return UI06MultiFactorScreenerBuilder.build({
      criteria,
      screenerService,
      viewportWidth,
    });
  }, [criteria, screenerService, viewportWidth]);

  if (!vm) {
    return (
      <section
        className="app-surface"
        aria-labelledby="screener-heading"
        data-testid="ui06-screener-surface"
        data-surface-id="UI06_MULTIFACTOR_SCREENER"
      >
        <header className="app-surface__header">
          <h2 id="screener-heading" className="app-surface__title">
            Multi-Factor Screener
          </h2>
          <div className="app-surface__meta">
            <span data-testid="ui06-surface-id">UI06_MULTIFACTOR_SCREENER</span>
            <span data-testid="ui06-payload-state">
              OFFLINE / UNAVAILABLE / PAYLOAD NOT COMMISSIONED
            </span>
          </div>
        </header>

        <UnavailableState reason="Payload not commissioned" />
        <p className="app-surface__note" data-testid="ui06-unavailable-reason">
          No governed D01-derived candidate universe is commissioned for this route. The
          existing UI06 builder and screener contract are bound, but they are not executed
          without governed criteria and candidate data. No securities, prices, metrics,
          scores, rankings, or screening results are invented.
        </p>
      </section>
    );
  }

  return (
    <section
      className="app-surface"
      aria-labelledby="screener-heading"
      data-testid="ui06-screener-surface"
      data-surface-id={vm.surfaceId}
    >
      <header className="app-surface__header">
        <h2 id="screener-heading" className="app-surface__title">
          Multi-Factor Screener
        </h2>
        <div className="app-surface__meta">
          <span data-testid="ui06-surface-id">{vm.surfaceId}</span>
          <span data-testid="ui06-total-matches">{vm.totalMatches} governed matches</span>
          <span data-testid="ui06-as-of">As of {vm.asOf}</span>
          <span data-testid="ui06-responsive-tier">{vm.responsiveLayout.tier}</span>
        </div>
      </header>

      <div
        id={vm.accessibility.focusElementId}
        role={vm.accessibility.ariaRole}
        aria-live={vm.accessibility.ariaLive}
        aria-label={vm.accessibility.tableCaption}
      >
        <DataTable
          columns={RESULT_COLUMNS}
          rows={vm.results}
          emptyLabel="No governed candidates matched the supplied criteria."
        />
      </div>

      <footer className="app-surface__provenance" data-testid="ui06-provenance">
        <span>Source: {vm.provenance.sourceClassification}</span>
        <span>•</span>
        <span>Version: {vm.provenance.dataVersion}</span>
        <span>•</span>
        <span>Lineage: {vm.provenance.lineageDigest}</span>
      </footer>
    </section>
  );
}
