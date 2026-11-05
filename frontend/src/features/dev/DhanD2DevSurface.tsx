/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D2 Synthetic Fixture Demonstration Surface (DEVELOPMENT ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS — UI demonstration
 * Execution Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * ══ PURPOSE ═══════════════════════════════════════════════════════════════════════════════
 *  Render the ALREADY-EXISTING DHAN-D2 deterministic synthetic fixtures through the real
 *  application shell so the three market-data presentation states (CURRENT / STALE /
 *  UNAVAILABLE) and the portfolio revaluation can be OBSERVED in the running UI.
 *
 * ══ HONESTY CONTRACT ══════════════════════════════════════════════════════════════════════
 *  · Every value on this page originates from `tests/fixtures/dhan_d2_fixtures.json` and is
 *    computed by the existing canonical/provider-neutral/portfolio code. Nothing is typed in
 *    by hand and nothing is fabricated by this component.
 *  · The page states PRE_ACCESS / SYNTHETIC / OFFLINE prominently and repeats that this is
 *    NOT live Dhan data, that no Dhan credential exists, and that no Dhan request is made.
 *  · The DHAN label shown is ROUTE/OPERATOR metadata only (NFR-06); the canonical payloads
 *    and the portfolio output beneath it remain provider-neutral.
 *  · This surface is mounted ONLY under `import.meta.env.DEV`. It is not part of any
 *    production route table and it changes no production behaviour.
 *  · No fetch/XHR/websocket/auth is used: the market data arrives from an in-memory fixture
 *    transport, and the page displays the external-request counter (always 0) as evidence.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  DHAN_D2_DEV_SCENARIOS,
  buildDhanD2DevSnapshot,
  resolveDhanD2DevScenario,
  type DhanD2DevSnapshot,
} from './dhan-d2-dev-harness.js';
import type { ProviderRouteDataStateView } from '../../../../src/providers/index.js';
import type { RevaluedPosition } from '../portfolio/index.js';
import { DataTable, MetricCard, MetricGroup, type Column } from '../../components/data/DataComponents.js';
import { FreshnessBadge } from '../../components/ui/Badges.js';
import { LoadingState } from '../../components/state/StateComponents.js';

const NOT_DISPLAYED = 'not displayed';

function freshnessFor(state: 'CURRENT' | 'STALE' | 'UNAVAILABLE'): 'snapshot' | 'stale' | 'unavailable' {
  if (state === 'CURRENT') return 'snapshot';
  if (state === 'STALE') return 'stale';
  return 'unavailable';
}

function num(value: number | null): string {
  return value === null || value === undefined ? NOT_DISPLAYED : value.toLocaleString('en-US');
}

const STATE_COLUMNS: readonly Column<ProviderRouteDataStateView>[] = [
  { key: 'provider', header: 'Provider (route/operator)', render: (r) => r.providerDisplayLabel },
  { key: 'companyId', header: 'Company', render: (r) => r.companyId },
  {
    key: 'state',
    header: 'Market Data State',
    render: (r) => (
      <span data-testid={`route-state-${r.companyId}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <FreshnessBadge state={freshnessFor(r.state)} />
        <strong>{r.state}</strong>
      </span>
    ),
  },
  {
    key: 'price',
    header: 'Price (LTP)',
    render: (r) => <span data-testid={`route-price-${r.companyId}`}>{num(r.displayPrice)}</span>,
  },
  { key: 'asOf', header: 'As Of', render: (r) => r.displayTimestamp ?? NOT_DISPLAYED },
  { key: 'quality', header: 'Quality', render: (r) => r.quality },
  { key: 'reason', header: 'Unavailable Reason', render: (r) => r.unavailableReason ?? '—' },
];

const POSITION_COLUMNS: readonly Column<RevaluedPosition>[] = [
  { key: 'symbol', header: 'Symbol', render: (r) => r.symbol },
  { key: 'qty', header: 'Qty', render: (r) => String(r.quantity) },
  { key: 'avg', header: 'Avg Buy', render: (r) => r.averageBuyPrice.toLocaleString('en-US') },
  { key: 'invested', header: 'Invested', render: (r) => r.investedValue.toLocaleString('en-US') },
  { key: 'ltp', header: 'LTP', render: (r) => <span data-testid={`position-ltp-${r.companyId}`}>{num(r.ltp)}</span> },
  {
    key: 'current',
    header: 'Current Value',
    render: (r) => <span data-testid={`position-current-${r.companyId}`}>{num(r.currentValue)}</span>,
  },
  {
    key: 'pnl',
    header: 'Unrealised P&L',
    render: (r) => <span data-testid={`position-pnl-${r.companyId}`}>{num(r.unrealizedPnl)}</span>,
  },
  { key: 'pnlPct', header: 'P&L %', render: (r) => num(r.unrealizedPnlPct) },
  { key: 'day', header: 'Day Change', render: (r) => num(r.dayChangeValue) },
  {
    key: 'state',
    header: 'State',
    render: (r) => (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <FreshnessBadge state={freshnessFor(r.marketDataState)} />
        <span>{r.marketDataState}</span>
      </span>
    ),
  },
  { key: 'disposition', header: 'Disposition', render: (r) => r.disposition },
];

export interface DhanD2DevSurfaceProps {
  /**
   * Pre-built snapshot. Used by the offline render test (and any non-browser renderer) so
   * the exact same presentation path can be asserted synchronously. In the browser this is
   * omitted and the snapshot is built from the committed fixtures on mount.
   */
  snapshot?: DhanD2DevSnapshot;
}

export function DhanD2DevSurface({ snapshot: injectedSnapshot }: DhanD2DevSurfaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = useMemo(
    () => resolveDhanD2DevScenario(searchParams.get('scenario')),
    [searchParams]
  );

  const [built, setBuilt] = useState<DhanD2DevSnapshot | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (injectedSnapshot) return;
    let cancelled = false;
    buildDhanD2DevSnapshot(scenario)
      .then((next) => {
        if (!cancelled) setBuilt(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, [injectedSnapshot, scenario]);

  const snapshot = injectedSnapshot ?? built;

  return (
    <div data-testid="dhan-d2-dev-surface" style={{ display: 'grid', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 20 }}>DHAN-D2 — Synthetic Fixture Demonstration</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--color-ink-secondary)', fontSize: 13 }}>
          Development-only surface. Renders the committed DHAN-D2 qualification fixtures through the
          existing provider-neutral market-data route and the existing BI-08 portfolio revaluation.
        </p>
      </header>

      <section
        data-testid="dhan-d2-dev-disclosure"
        role="note"
        style={{
          border: '1px solid var(--color-status-warning)',
          borderRadius: 6,
          padding: 12,
          background: 'var(--color-surface-1)',
          fontSize: 13,
          display: 'grid',
          gap: 6,
        }}
      >
        <strong style={{ letterSpacing: '0.04em' }}>PRE_ACCESS / SYNTHETIC / OFFLINE</strong>
        <span>
          DHAN is shown as a ROUTE/OPERATOR label only. The data below is SYNTHETIC FIXTURE DATA — it
          is <strong>not live Dhan data</strong>, no Dhan access has been granted, no Dhan credential
          exists in this application, and <strong>no Dhan API request is made</strong> by this page.
        </span>
        {snapshot ? <span>{snapshot.disclosure}</span> : null}
      </section>

      <nav aria-label="Fixture scenario" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {DHAN_D2_DEV_SCENARIOS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            data-testid={`scenario-${candidate.id}`}
            onClick={() => setSearchParams({ scenario: candidate.id })}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${candidate.id === scenario.id ? 'var(--color-status-informational)' : 'var(--color-border)'}`,
              background: candidate.id === scenario.id ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
              color: 'var(--color-ink)',
            }}
          >
            {candidate.label}
          </button>
        ))}
      </nav>

      {failure ? (
        <div data-testid="dhan-d2-dev-error" role="alert">
          Development harness failure: {failure}
        </div>
      ) : null}

      {!snapshot && !failure ? <LoadingState /> : null}

      {snapshot ? (
        <>
          <section aria-label="Scenario">
            <h2 style={{ fontSize: 14, margin: '0 0 6px' }}>
              Scenario: <span data-testid="scenario-label">{snapshot.scenario.label}</span>
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
              {snapshot.scenario.expectation}
            </p>
          </section>

          <section aria-label="Market data state">
            <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>Provider route data state</h2>
            <DataTable columns={STATE_COLUMNS} rows={snapshot.views} />
          </section>

          <section aria-label="Portfolio revaluation">
            <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>
              Portfolio revaluation (existing BI-08 market-data binding)
            </h2>
            <DataTable columns={POSITION_COLUMNS} rows={snapshot.revaluation.positions} />
            <MetricGroup label="Portfolio totals">
              <MetricCard label="Invested" value={snapshot.revaluation.totalInvestedValue} />
              <MetricCard label="Current value" value={snapshot.revaluation.totalCurrentValue} />
              <MetricCard label="Unrealised P&L" value={snapshot.revaluation.totalUnrealizedPnl} />
              <MetricCard label="Day change" value={snapshot.revaluation.totalDayChangeValue} />
              <MetricCard label="Priced positions" value={snapshot.revaluation.pricedPositionCount} />
              <MetricCard label="Unpriced positions" value={snapshot.revaluation.unpricedPositionCount} />
            </MetricGroup>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Portfolio state:{' '}
              <strong data-testid="portfolio-state">{snapshot.revaluation.portfolioState}</strong>
              {' · '}Unpriced positions are never valued at cost: their value and P&amp;L stay null and
              are excluded from the totals.
            </p>
          </section>

          <section aria-label="Execution evidence" style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>
            <h2 style={{ fontSize: 14, margin: '0 0 8px', color: 'var(--color-ink)' }}>Execution evidence</h2>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
              <li>Execution mode: {snapshot.executionMode}</li>
              <li>
                Fixture: {snapshot.fixturePath} · scenario key{' '}
                <code>{snapshot.scenario.fixtureScenarioKey}</code>
              </li>
              <li>Fixture label: {snapshot.fixtureLabel}</li>
              <li>Evaluation instant: {snapshot.evaluatedAt}</li>
              <li>Provider requests answered from fixtures: {snapshot.fixtureRequestCount}</li>
              <li>
                External Dhan requests:{' '}
                <strong data-testid="external-request-count">{snapshot.externalRequestCount}</strong>{' '}
                (in-memory transport — no network call is possible)
              </li>
              <li>Fixture notice: {snapshot.fixtureNotice}</li>
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default DhanD2DevSurface;
