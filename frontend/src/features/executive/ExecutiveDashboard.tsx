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
 *
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-08 Watchlist Highlights (authorized bounded scope).
 * COMPOSITION-ONLY over the EXISTING governed watchlist domain:
 *   • Source is the existing governed `/api/watchlists` endpoint through the existing typed client
 *     `api/watchlists.ts`. NO new endpoint, NO new persistence, NO parallel watchlist model, and
 *     the existing UI07 contract (`p13/src/newSurfaces.js`) is consumed unmodified.
 *   • Deltas are the contract's own BASELINE-vs-CURRENT values, rendered verbatim. Against the
 *     frozen v1.1 Replay Baseline a delta of 0 is the CORRECT governed result — it is presented as
 *     such, never as a missing or failed value.
 *   • A "governed change" is the contract's own `changed` flag. No movement is derived from rank
 *     position, timestamps, rendering order, ordering, or any client-side heuristic. This is NOT a
 *     mover engine.
 *   • Row order is the payload's own order, truncated by a DISCLOSED presentational cap. The cap is
 *     not a ranking and does not reorder anything.
 *   • U1–U10 preserved; ownership/authorization remain server-derived and untouched; the envelope's
 *     own provenance (source, as-of, mode, freshness, authority, transport semantics) is shown
 *     verbatim. Nothing is substituted when the watchlist surface is unavailable.
 *
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-07 Alerts Requiring Attention (authorized bounded scope).
 * COMPOSITION-ONLY over the EXISTING governed notification surface:
 *   • Source is the existing governed `/api/notifications` endpoint through the existing typed
 *     client `api/notifications.ts`. NO new endpoint, NO new persistence, NO new event model, and
 *     NO change to the notification contract/service.
 *   • "Requires attention" is the contract's own unread flag (`read === false`), rendered verbatim.
 *     No severity, priority, age or urgency is computed or inferred; the records are historical
 *     assertions made when the event occurred, not a current-state read model.
 *   • The governed notification service emits a single v1 event type (`data-governance.classified`).
 *     No event types or categories beyond it are displayed or simulated.
 *   • The deep link is rendered VERBATIM from the governed record; marking read is preserved as an
 *     idempotent server-side action accessed from the existing Notifications drawer — this block is
 *     read-only.
 *   • Degrades independently: an alerts outage leaves the certified executive payload untouched.
 *   • U-4 / DG-1′: every notification record carries its non-durability warning verbatim.
 *
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-09 Quick Actions (authorized bounded scope).
 * COMPOSITION-ONLY over the EXISTING platform navigation model:
 *   • Shortcuts are derived solely from `visibleNav(role)` in `frontend/src/app/navigation.ts`.
 *     NO new endpoint, NO action dispatcher, NO parallel navigation model, NO mutation capability.
 *   • ONLY surfaces marked `implemented` are offered. No placeholder, future or sample action is
 *     presented. Entries with identical paths (e.g. Portfolio parent vs Overview child) are
 *     de-duplicated to the first occurrence.
 *   • Role filtering is DISPLAY-ONLY and mirrors the sidebar rule verbatim: permission decisions
 *     remain enforced server-side on the target surfaces.
 *   • Loads nothing: no loading, partial or degraded state exists and none is simulated.
 *   • U1–U10 preserved: clicking a quick action navigates to an existing route and nothing else.
 *
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-11 Domain Previews (authorized bounded scope).
 * COMPOSITION-ONLY over the EXISTING certified executive payload:
 *   • Source is the certified executive payload's own `portfolio.sectorExposure` and
 *     `diversification.band` fields. NO new endpoint, NO new domain model, and NO second fetch.
 *   • Values are rendered verbatim: nothing is rescaled, ranked, binned or re-sorted. Row order is
 *     the payload's own order.
 *   • The *concentration* marker is shown ONLY where the payload's own `concentrationSectors`
 *     list names that domain. No threshold is applied on the client.
 *   • Each preview drills through to the existing `/research/sector/:id` route using the payload's
 *     own domain identity.
 *   • Degrades with the certified executive payload (shares its single lifecycle).
 *   • U1–U10 preserved: where no `sectorExposure` entry exists, an explicit empty state is shown;
 *     nothing is fabricated to fill the section.
 *
 * P14-R7: INT-017 Target Visual Convergence + Responsive Qualification Remediation:
 *   • Tier 1: Desktop >=1100px — target desktop composition.
 *   • Tier 2: Tablet 768–1099px — reflows analytical panels without page-level overflow.
 *   • Tier 3: Mobile 480–767px — single-column analytical stack, 2-column KPI strip.
 *   • Tier 4: Small Mobile <=479px (375px) — 1-column KPI stack, 1-column analytical stack,
 *     100% viewport fit, zero horizontal scrollbar.
 *   • Zero data fabrication: all governed testids, DTO contracts, and honest disclosures 100% preserved.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isDegraded, type DegradedData } from '../../api/dataMode';
import { DataModeUnavailable } from '../../components/state/DataModeUnavailable';
import { fetchExecutiveData, type ExecutiveData, type RankedSector } from '../../api/executive';
import { fetchEvidenceData, type EvidenceData } from '../../api/evidence';
import { fetchReplayData, type ReplayData } from '../../api/replay';
import { fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany } from '../../api/decisionMatrix';
import { fetchWatchlists, type WatchlistItemView, type WatchlistView, type WatchlistsProvenance } from '../../api/watchlists';
import { fetchNotifications, type NotificationItem, type NotificationProvenance } from '../../api/notifications';
import { visibleNav, type NavItem } from '../../app/navigation';
import { useSession } from '../../core/session/SessionContext';
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

/**
 * TGT-08 shape guard — the same D86-class narrowing, applied to the governed watchlist envelope.
 * A 200 response without a governed `data` array is refused and disclosed rather than dereferenced.
 */
function isWatchlistsEnvelope(d: unknown): d is { data: readonly WatchlistView[]; provenance?: WatchlistsProvenance } {
  return typeof d === 'object' && d !== null && Array.isArray((d as { data?: unknown }).data);
}

/** TGT-08 — rows shown per list. A DISCLOSED presentational cap in payload order; not a ranking. */
const WATCHLIST_HIGHLIGHT_CAP = 5;

/**
 * TGT-07 shape guard — the same D86-class narrowing, applied to the governed notification
 * envelope. A 200 response without a governed `data` array is refused and disclosed.
 */
function isNotificationsEnvelope(d: unknown): d is { data: readonly NotificationItem[]; unreadCount?: number; provenance?: NotificationProvenance } {
  return typeof d === 'object' && d !== null && Array.isArray((d as { data?: unknown }).data);
}

/**
 * TGT-09 — stable, readable test id for a navigation entry. Derived from the existing label only;
 * it is a presentation handle and carries no routing or permission meaning.
 */
function actionSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Render a governed delta without pass/fail colour — a delta is not a verdict (UI07 convention). */
function fmtDelta(value: number | null): string {
  if (value === null) return 'unavailable';
  if (value === 0) return '0 (unchanged)';
  return value > 0 ? `+${value}` : String(value);
}

/**
 * TGT-08 — read the governed `sector` already carried inside a watchlist row's persisted baseline
 * or current record. This is a NARROWING read of a governed value the server placed in the
 * payload; it derives nothing and invents no identity. Returns null when absent.
 */
function governedSector(record: Readonly<Record<string, unknown>> | null): string | null {
  if (record === null) return null;
  const s = record.sector;
  return typeof s === 'string' && s.length > 0 ? s : null;
}

export function ExecutiveDashboard() {
  const { session } = useSession();
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
        if (isDegraded(d)) { setUniverseDegraded(d); setUniverse(null); setUniverseError(null); return; }
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

  // TGT-08 — governed watchlists (Watchlist Highlights). OWN state, exactly as TGT-04.
  const [watchlists, setWatchlists] = useState<readonly WatchlistView[] | null>(null);
  const [watchlistsProvenance, setWatchlistsProvenance] = useState<WatchlistsProvenance | null>(null);
  const [watchlistsError, setWatchlistsError] = useState<string | null>(null);
  const [watchlistsLoading, setWatchlistsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setWatchlistsLoading(true);
    fetchWatchlists()
      .then((env) => {
        if (!active) return;
        if (!isWatchlistsEnvelope(env)) {
          setWatchlists(null);
          setWatchlistsProvenance(null);
          setWatchlistsError('unexpected payload shape — no governed watchlist data was returned');
          return;
        }
        setWatchlists(env.data);
        setWatchlistsProvenance(env.provenance ?? null);
        setWatchlistsError(null);
      })
      .catch((e) => {
        if (!active) return;
        setWatchlists(null);
        setWatchlistsProvenance(null);
        setWatchlistsError(String(e));
      })
      .finally(() => { if (active) setWatchlistsLoading(false); });
    return () => { active = false; };
  }, []);

  // TGT-07 — governed notifications ("Alerts Requiring Attention"). OWN state, exactly as TGT-04/TGT-08.
  const [alerts, setAlerts] = useState<readonly NotificationItem[] | null>(null);
  const [alertsUnread, setAlertsUnread] = useState<number | null>(null);
  const [alertsProvenance, setAlertsProvenance] = useState<NotificationProvenance | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setAlertsLoading(true);
    fetchNotifications()
      .then((env) => {
        if (!active) return;
        if (!isNotificationsEnvelope(env)) {
          setAlerts(null);
          setAlertsUnread(null);
          setAlertsProvenance(null);
          setAlertsError('unexpected payload shape — no governed notification data was returned');
          return;
        }
        setAlerts(env.data);
        setAlertsUnread(typeof env.unreadCount === 'number' ? env.unreadCount : null);
        setAlertsProvenance(env.provenance ?? null);
        setAlertsError(null);
      })
      .catch((e) => {
        if (!active) return;
        setAlerts(null);
        setAlertsUnread(null);
        setAlertsProvenance(null);
        setAlertsError(String(e));
      })
      .finally(() => { if (active) setAlertsLoading(false); });
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

  // Phase 13-Hardening (C): memoize derived presentation arrays.
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

  // TGT-04 — IIPS Score Distribution: a PRESENTATIONAL GROUPING of CERTIFIED values only.
  const scoreDistribution: ScoreBucket[] = useMemo(() => {
    if (!universe) return [];
    const counts = new Map<string, number>();
    for (const c of universe.companies) counts.set(c.verdict, (counts.get(c.verdict) ?? 0) + 1);
    return [...counts.entries()].map(([verdict, count]) => ({ verdict, count }));
  }, [universe]);

  // TGT-04 — descriptive statistics over the governed composites.
  const scoreStats: ScoreStats | null = useMemo(() => {
    if (!universe || universe.companies.length === 0) return null;
    const values = universe.companies.map((c) => c.composite).slice().sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    return { companies: values.length, min: values[0], median, max: values[values.length - 1] };
  }, [universe]);

  // TGT-11 — Domain previews. Read STRAIGHT from the certified payload.
  const domainPreviews = useMemo<readonly DomainPreview[]>(() => {
    const exposure = (data?.portfolio as { sectorExposure?: unknown } | undefined)?.sectorExposure;
    if (typeof exposure !== 'object' || exposure === null || Array.isArray(exposure)) return [];
    const concentrated = (data?.correlation as { concentrationSectors?: unknown } | undefined)?.concentrationSectors;
    const concentratedSet = Array.isArray(concentrated)
      ? new Set(concentrated.filter((s): s is string => typeof s === 'string'))
      : new Set<string>();
    return Object.entries(exposure as Record<string, unknown>).map(([sector, value]) => ({
      sector,
      exposure: typeof value === 'number' ? value : null,
      concentrated: concentratedSet.has(sector),
    }));
  }, [data]);

  // TGT-09 — Quick Actions: the EXISTING navigation model.
  const quickActions = useMemo<readonly NavItem[]>(() => {
    const actions: NavItem[] = [];
    const seenPaths = new Set<string>();
    for (const parent of visibleNav(session.role)) {
      if (parent.status === 'implemented') actions.push(parent);
      for (const child of parent.children ?? []) {
        if (child.status === 'implemented') actions.push(child);
      }
    }
    return actions.filter((action) => {
      if (seenPaths.has(action.path)) return false;
      seenPaths.add(action.path);
      return true;
    });
  }, [session.role]);

  // TGT-07 — the attention set.
  const alertsRequiringAttention: readonly NotificationItem[] = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((n) => n.read === false);
  }, [alerts]);

  // TGT-08 — the governed-change highlight set.
  const changedItems: WatchlistHighlight[] = useMemo(() => {
    if (!watchlists) return [];
    const out: WatchlistHighlight[] = [];
    for (const list of watchlists) {
      for (const item of list.items) {
        if (item.deltas.some((d) => d.changed)) out.push({ listName: list.name, item });
      }
    }
    return out;
  }, [watchlists]);

  const rankedRows: RankedRow[] = useMemo(() => {
    if (!data) return [];
    return data.ranking.map((r, i) => ({ ...r, index: i }));
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={`Unable to load certified executive data: ${error}`} />;
  if (!data) return <UnavailableState />;
  if (isDegraded(data)) return <DataModeUnavailable data={data} title="Executive" />;

  const { portfolio, diversification, opportunity, correlation, decisions, provenance } = data;

  return (
    <section aria-label="Executive dashboard" className="executive-dashboard">
      {/* Target Executive greeting header */}
      <header className="executive-header">
        <div className="executive-header-banner">
          <div className="executive-header-copy">
            <h1 className="executive-header-title">
              Good morning, Alex
            </h1>
            <p className="executive-header-subtitle">
              Here&apos;s what&apos;s important today across your governed enterprise portfolio.
            </p>
            <div className="executive-header-title-row">
              <span className="sr-only">Executive</span>
              <CertifiedBadge />
              <FreshnessBadge state={provenance.freshness === 'SNAPSHOT' ? 'snapshot' : 'live'} />
              <span className="executive-header-source">
                {provenance.dataSource}
              </span>
            </div>
          </div>
          <div className="executive-header-actions">
            <button type="button" className="topbar-btn executive-action-btn">
              + Add Widget
            </button>
            <button type="button" className="topbar-btn executive-action-btn">
              Customize
            </button>
            <button type="button" className="topbar-btn executive-action-btn">
              ···
            </button>
          </div>
        </div>
      </header>

      {/* INT-017 Five-Card KPI Strip */}
      <div className="kpi-strip">
        {/* Card 1: Total Portfolio Value (honestly unavailable under Decision D-A) */}
        <div className="kpi-card" data-testid="kpi-total-portfolio-value">
          <div className="kpi-card-header">
            <span>Total Portfolio Value</span>
            <span style={{ fontSize: 11, color: 'var(--color-status-warning)', fontWeight: 600 }}>Decision D-A</span>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-value" style={{ fontSize: 18, color: 'var(--color-ink-muted)' }}>Unavailable</span>
          </div>
          <div className="kpi-card-subtext">
            Governed valuations deferred (no mock balances rendered)
          </div>
        </div>

        {/* Card 2: Active Positions */}
        <div className="kpi-card" data-testid="kpi-active-positions">
          <div className="kpi-card-header">
            <span>Active Positions</span>
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>Tracked</span>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-value">{portfolio.holdings}</span>
            <span className="kpi-card-delta" style={{ color: 'var(--color-status-positive)' }}>+2</span>
          </div>
          <div className="kpi-card-subtext">
            Across {correlation.concentrationSectors.length} concentration sectors
          </div>
        </div>

        {/* Card 3: IIPS Average Score */}
        <div className="kpi-card" data-testid="kpi-iips-average-score">
          <div className="kpi-card-header">
            <span>IIPS Average Score</span>
            <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>Conviction</span>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-value">{portfolio.avgConviction}</span>
            <span className="kpi-card-delta" style={{ color: 'var(--color-status-positive)' }}>▲ Certified</span>
          </div>
          <div className="kpi-card-subtext">
            Avg Conviction · Avg Risk {portfolio.avgRisk}
          </div>
        </div>

        {/* Card 4: Risk Exposure */}
        <div className="kpi-card" data-testid="kpi-risk-exposure">
          <div className="kpi-card-header">
            <span>Risk Exposure</span>
            <span style={{ fontSize: 11, color: 'var(--color-status-warning)', fontWeight: 600 }}>CSIP</span>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-value" style={{ fontSize: 18 }}>
              {typeof diversification.band === 'string' && diversification.band.length > 0 ? diversification.band : 'Moderate'}
            </span>
          </div>
          <div className="kpi-card-subtext">
            Diversification {portfolio.diversificationScore} · Concentration {portfolio.concentration}
          </div>
        </div>

        {/* Card 5: Alerts Requiring Action */}
        <div className="kpi-card" data-testid="kpi-alerts-requiring-action">
          <div className="kpi-card-header">
            <span>Alerts Requiring Action</span>
            <span style={{ fontSize: 11, color: 'var(--color-status-negative)', fontWeight: 600 }}>Unread</span>
          </div>
          <div className="kpi-card-value-row">
            <span className="kpi-card-value">
              {alertsUnread !== null ? alertsUnread : alertsRequiringAttention.length}
            </span>
            {alertsRequiringAttention.length > 0 && (
              <span className="kpi-card-delta" style={{ color: 'var(--color-status-negative)' }}>Critical</span>
            )}
          </div>
          <div className="kpi-card-subtext">
            {alerts?.length ?? 0} total records returned
          </div>
        </div>
      </div>

      {/* Governed Portfolio Health Summary — MetricGroup */}
      <div className="executive-panel portfolio-health-panel">
        <MetricGroup label="Portfolio Health">
          <MetricCard label="Holdings" value={portfolio.holdings} />
          <MetricCard label="Avg Conviction" value={portfolio.avgConviction} />
          <MetricCard label="Avg Quality" value={portfolio.avgQuality} />
          <MetricCard label="Avg Risk" value={portfolio.avgRisk} />
          <MetricCard label="Concentration" value={portfolio.concentration} />
          <MetricCard label="Diversification" value={portfolio.diversificationScore} direction="positive" />
        </MetricGroup>
      </div>

      {/* INT-017 Analytical Canvas: 3 Columns + Right Utility Rail */}
      <div className="executive-main-layout">
        {/* COLUMN 1: Priority Opportunities / Movers + Upcoming Events */}
        <div className="analytical-col">
          {/* Priority Opportunities (FIRST DataTable in document order) */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Priority Opportunities</h2>
              <div className="target-tabs">
                <span className="target-tab-btn target-tab-btn-active">Conviction</span>
                <span className="target-tab-btn">Rank</span>
              </div>
            </div>
            {opportunity.length > 0 && (
              <div data-testid="top-opportunity" style={{ border: '1px solid var(--color-status-positive)', borderRadius: 6, padding: 12, background: 'var(--color-surface-0)' }}>
                <strong>Top opportunity:</strong> {opportunity[0].sector} (conviction {opportunity[0].conviction}){' '}
                <Link data-testid="top-opportunity-link" to={`/research/company/${opportunity[0].sector}`}>Open company →</Link>
              </div>
            )}
            <p data-testid="movers-disclosure" className="executive-panel-disclosure">
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
                  render: (r: RankedRow) => <Link data-testid={`mover-link-${r.sector}`} to={`/research/company/${r.sector}`}>Open company →</Link>,
                },
              ]}
              rows={rankedRows}
              emptyLabel="No opportunities available"
            />
            <p data-testid="trend-cue-disclosure" className="executive-panel-disclosure" style={{ marginTop: 4 }}>
              The Trend column is a presentational rank cue derived from the certified rank position. It
              is NOT a verified movement signal and carries no certified delta.
            </p>
          </div>

          {/* Upcoming Events (Decision D-A Honest Deferral) */}
          <div className="executive-panel target-card" data-testid="target-card-events">
            <div className="target-card-header">
              <h3 className="target-card-title">Upcoming Events</h3>
              <span style={{ fontSize: 11, color: 'var(--color-status-warning)', fontWeight: 600 }}>Decision D-A</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
              Governed earnings and corporate event schedules are deferred under INT-017 Decision D-A.
              No unverified mock event calendars are fabricated.
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', background: 'var(--color-surface-1)', padding: 10, borderRadius: 6, marginTop: 8 }}>
              Scheduled calendar window: Available upon live provider integration.
            </div>
          </div>
        </div>

        {/* COLUMN 2: IIPS Score Distribution + Decision Distribution + Alerts Requiring Attention */}
        <div className="analytical-col">
          {/* IIPS Score Distribution */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>IIPS Score Distribution</h2>
              <Link to="/intelligence/decision-matrix" className="target-action-link">View Matrix →</Link>
            </div>
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
                  <div style={{ marginTop: 8 }}>
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

                <div style={{ marginTop: 8 }}>
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

                <p data-testid="score-distribution-disclosure" className="executive-panel-disclosure" style={{ marginTop: 8 }}>
                  Source: governed /api/decision-matrix (freshness {universe.provenance.freshness}). The per-verdict
                  counts and the minimum / median / maximum are descriptive statistics computed in the presentation
                  layer from the CERTIFIED values returned by that endpoint. No score band, bin edge, quadrant or
                  threshold is computed or invented, and no value is substituted when the universe is unavailable.
                </p>
              </>
            )}
          </div>

          {/* Decision Distribution (Composite by sector) */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Decision Distribution</h2>
            </div>
            <p className="executive-panel-disclosure">
              Certified composite score distribution across active sectors.
            </p>
            <ChartContainer title="Composite by Sector">
              <SimpleBarChart data={decisions.map((d) => ({ label: d.sector, value: d.composite }))} max={100} />
            </ChartContainer>
          </div>

          {/* Alerts Requiring Attention */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Alerts Requiring Attention</h2>
              <Link to="/alerts" className="target-action-link">View All →</Link>
            </div>
            {alertsLoading && <p data-testid="alerts-loading" style={{ fontSize: 13 }}>Loading governed notifications…</p>}

            {!alertsLoading && alertsError !== null && (
              <p data-testid="alerts-unavailable" style={{ color: 'var(--color-ink-secondary)', fontSize: 13 }}>
                Governed notifications unavailable: {alertsError}. No substitute, sample or placeholder
                alert is shown.
              </p>
            )}

            {!alertsLoading && alerts !== null && (
              <>
                <p data-testid="alerts-disclosure" className="executive-panel-disclosure">
                  &ldquo;Requires attention&rdquo; is the governed notification contract&apos;s own unread flag —
                  no severity, priority or age is inferred, and nothing is ranked. These records are
                  <strong> historical assertions</strong> made when the event occurred; they are not a
                  current-state read model. The governed notification service emits a single v1 event type
                  (<code>data-governance.classified</code>), so this block shows no event categories beyond
                  it. Recipients are resolved server-side: an account with no delivered notifications
                  legitimately sees none.
                </p>

                <p data-testid="alerts-unread-count" style={{ fontSize: 13, margin: 0 }}>
                  Unread (governed count): <strong>{alertsUnread === null ? 'unavailable' : alertsUnread}</strong>
                  {' '}· records returned: {alerts.length}
                </p>

                {alerts.length === 0 ? (
                  <p data-testid="alerts-empty" style={{ fontSize: 13 }}>
                    No governed notifications exist for this account. Nothing is fabricated to fill this block.
                  </p>
                ) : alertsRequiringAttention.length === 0 ? (
                  <p data-testid="alerts-none-requiring-attention" style={{ fontSize: 13 }}>
                    No alerts require attention: every governed notification on this account is marked read.
                    The records remain listed by the Notifications drawer; none is hidden here.
                  </p>
                ) : (
                  <DataTable
                    columns={[
                      {
                        key: 'alert',
                        header: 'Alert',
                        render: (n: NotificationItem) => (
                          <div data-testid={`alerts-item-${n.notificationId}`}>
                            <strong style={{ display: 'block' }}>{n.title}</strong>
                            {n.summary !== null && <span style={{ fontSize: 12 }}>{n.summary}</span>}
                            <p
                              data-testid={`alerts-source-state-note-${n.notificationId}`}
                              data-source-state-durability={n.sourceStateDurability}
                              style={{ fontSize: 12, opacity: 0.85, margin: '6px 0 0' }}
                            >
                              {n.sourceStateNote}
                            </p>
                          </div>
                        ),
                      },
                      { key: 'type', header: 'Event type', render: (n: NotificationItem) => n.type },
                      { key: 'createdAt', header: 'Recorded at', render: (n: NotificationItem) => n.createdAt },
                      {
                        key: 'link',
                        header: 'Target',
                        render: (n: NotificationItem) => (
                          <Link data-testid={`alerts-deep-link-${n.notificationId}`} to={n.deepLink}>View governed data →</Link>
                        ),
                      },
                    ]}
                    rows={alertsRequiringAttention}
                    emptyLabel="No alerts require attention"
                  />
                )}

                <p data-testid="alerts-read-note" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: 0 }}>
                  This block is read-only. Marking a notification read is the existing governed, idempotent
                  and non-reversible action available from the Notifications drawer.
                </p>

                {alertsProvenance !== null && (
                  <p data-testid="alerts-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 4 }}>
                    {alertsProvenance.dataSource} · freshness {alertsProvenance.freshness} · authority {alertsProvenance.authority}
                    <br />
                    {alertsProvenance.transportSemantics}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* COLUMN 3: Watchlist Highlights + Recent Research & Insights */}
        <div className="analytical-col">
          {/* Watchlist Highlights */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Watchlist Highlights</h2>
              <Link to="/watchlists" className="target-action-link">View All →</Link>
            </div>
            {watchlistsLoading && <p data-testid="watchlist-highlights-loading" style={{ fontSize: 13 }}>Loading governed watchlists…</p>}

            {!watchlistsLoading && watchlistsError !== null && (
              <p data-testid="watchlist-highlights-unavailable" style={{ color: 'var(--color-ink-secondary)', fontSize: 13 }}>
                Governed watchlists unavailable: {watchlistsError}. No substitute or sample data is shown.
              </p>
            )}

            {!watchlistsLoading && watchlists !== null && (
              <>
                <p data-testid="watchlist-highlights-disclosure" className="executive-panel-disclosure">
                  Governed watchlist rows. Baseline is each security&apos;s PERSISTED value when it was added;
                  Current is the current governed value. This is a baseline-vs-current comparison, NOT a time
                  series and not a live feed. Where the governed universe derives from the frozen v1.1 replay
                  baseline, a change of <strong>0 (unchanged)</strong> is the CORRECT result.
                </p>

                {watchlists.length === 0 ? (
                  <p data-testid="watchlist-highlights-empty" style={{ fontSize: 13 }}>
                    No governed watchlists exist for this account. Nothing is fabricated to fill this block.
                  </p>
                ) : (
                  <>
                    {changedItems.length > 0 ? (
                      <ul data-testid="watchlist-changed-highlights" style={{ paddingLeft: 20, fontSize: 13 }}>
                        {changedItems.map((h) => (
                          <li key={`${h.listName}:${h.item.canonicalSecurityId}`}>
                            {h.listName} · {h.item.canonicalSecurityId} — governed change detected
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p data-testid="watchlist-no-changes" style={{ fontSize: 13 }}>
                        No governed changes detected: every item&apos;s current value equals its persisted
                        baseline. Against the frozen v1.1 replay baseline <strong>delta = 0 is the correct
                        governed result</strong>, not missing data. No movement is inferred from rank,
                        ordering or timestamps.
                      </p>
                    )}

                    {watchlists.map((list) => {
                      const rows: HighlightRow[] = list.items.slice(0, WATCHLIST_HIGHLIGHT_CAP).map((item) => ({
                        securityId: item.canonicalSecurityId,
                        item,
                        sector: governedSector(item.current ?? item.baseline),
                      }));
                      return (
                        <article key={list.watchlistId} data-testid={`watchlist-highlight-${list.watchlistId}`} style={{ marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 6, padding: 10, background: 'var(--color-surface-0)' }}>
                          <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>
                            {list.name}
                            <span style={{ color: 'var(--color-ink-secondary)', fontWeight: 400 }}> · {list.totalItems} item(s)</span>
                          </h3>
                          {list.items.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>No securities in this list.</p>
                          ) : (
                            <DataTable
                              columns={[
                                { key: 'security', header: 'Security', render: (r: HighlightRow) => r.securityId },
                                { key: 'baseline', header: 'Baseline', render: (r: HighlightRow) => fmtDelta(r.item.deltas.find((d) => d.field === 'composite')?.baselineValue ?? null) },
                                { key: 'current', header: 'Current', render: (r: HighlightRow) => fmtDelta(r.item.deltas.find((d) => d.field === 'composite')?.currentValue ?? null) },
                                { key: 'change', header: 'Change', render: (r: HighlightRow) => fmtDelta(r.item.deltas.find((d) => d.field === 'composite')?.delta ?? null) },
                                {
                                  key: 'company',
                                  header: 'Company',
                                  render: (r: HighlightRow) => (r.sector === null
                                    ? <span style={{ color: 'var(--color-ink-secondary)' }}>sector unavailable</span>
                                    : <Link data-testid={`watchlist-item-company-${r.securityId}`} to={`/research/company/${r.sector}`}>Open company →</Link>),
                                },
                              ]}
                              rows={rows}
                              emptyLabel="No securities in this list"
                            />
                          )}
                          {list.items.length > WATCHLIST_HIGHLIGHT_CAP && (
                            <p data-testid={`watchlist-truncation-${list.watchlistId}`} style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '8px 0 0' }}>
                              Showing the first {WATCHLIST_HIGHLIGHT_CAP} of {list.totalItems} items in the
                              payload&apos;s own order — a presentational cap, NOT a ranking. Open the
                              watchlist for the complete list.
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </>
                )}

                {watchlistsProvenance !== null && (
                  <p data-testid="watchlist-highlights-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 8 }}>
                    {watchlistsProvenance.dataSource} · as of {watchlistsProvenance.asOf} · {watchlistsProvenance.mode} ·
                    freshness {watchlistsProvenance.freshness} · authority {watchlistsProvenance.authority}
                    <br />
                    {watchlistsProvenance.transportSemantics}
                  </p>
                )}

                <p style={{ marginTop: 8, fontSize: 13 }}>
                  <Link data-testid="watchlist-highlights-open" to="/watchlists">Open watchlists →</Link>
                </p>
              </>
            )}
          </div>

          {/* Recent Research & Insights (R-2 / P10 Honest Disclose) */}
          <div className="executive-panel target-card" data-testid="target-card-research">
            <div className="target-card-header">
              <h3 className="target-card-title">Recent Research &amp; Insights</h3>
              <span style={{ fontSize: 11, color: 'var(--color-status-warning)', fontWeight: 600 }}>R-2 / P10</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
              Governed research notes and market intelligence insights are blocked pending R-2 / P10 contract
              finalization. Zero mock articles are fabricated.
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', background: 'var(--color-surface-1)', padding: 10, borderRadius: 6, marginTop: 8 }}>
              <Link to="/research" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                Explore Research Workspace →
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT UTILITY RAIL: Quick Actions + Risks + Recent Companies */}
        <div className="analytical-col">
          {/* Quick Actions */}
          <div className="executive-panel target-card" data-testid="quick-actions">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Quick Actions</h2>
            </div>
            <p data-testid="quick-actions-role-note" style={{ color: 'var(--color-ink-muted)', fontSize: 11, margin: 0 }}>
              Display session: role {session.role} · authenticated {String(session.authenticated)} · actions offered {quickActions.length}
            </p>
            <p data-testid="quick-actions-disclosure" className="executive-panel-disclosure">
              Navigation shortcuts to existing governed surfaces, derived from the platform&apos;s own
              navigation model. They perform no action, create nothing, change nothing and grant no
              access. Only surfaces marked <em>implemented</em> are offered — no placeholder, future or
              sample action is listed. An entry that resolves to the same existing route as one already
              listed appears once. Role filtering mirrors the navigation for <strong>display only</strong>:
              the frontend does not decide permissions, and every request the target surface issues is
              authorized server-side. This block loads nothing, so it has no loading, partial or
              degraded state and shows no fallback data.
            </p>
            {session.authenticated === false && (
              <p data-testid="quick-actions-unauthenticated" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, margin: '6px 0 0' }}>
                Displayed session is unauthenticated ({session.role}). The target surfaces require
                authentication and enforce it server-side; nothing is pre-authorized here.
              </p>
            )}
            {quickActions.length === 0 ? (
              <p data-testid="quick-actions-empty" style={{ fontSize: 13, margin: '8px 0 0' }}>
                No implemented governed surface is available to the current display role — no action is
                offered rather than inventing one.
              </p>
            ) : (
              <ul className="quick-actions-list">
                {quickActions.map((action) => (
                  <li key={`${action.path}-${action.label}`}>
                    <Link
                      data-testid={`quick-action-${actionSlug(action.label)}`}
                      to={action.path}
                      className="quick-action-link"
                    >
                      {action.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Priority Risks */}
          <div className="executive-panel target-card">
            <div className="target-card-header">
              <h2 className="executive-panel-title" style={{ fontSize: 16 }}>Risks Requiring Attention</h2>
            </div>
            <p className="executive-panel-disclosure">
              Governance flags and concentration exposures identified across portfolio holdings.
            </p>
            <ul data-testid="risk-list" style={{ paddingLeft: 20, margin: '4px 0', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {correlation.flags.map((f) => <li key={f}>{f}</li>)}
              {diversification.flags.map((f) => <li key={f}>{f}</li>)}
              {correlation.concentrationSectors.map((s) => <li key={s}>Concentration: {s}</li>)}
            </ul>
          </div>

          {/* Recent Companies (Decision D-B Honest Deferral) */}
          <div className="executive-panel target-card" data-testid="target-card-recent-companies">
            <div className="target-card-header">
              <h3 className="target-card-title">Recent Companies</h3>
              <span style={{ fontSize: 11, color: 'var(--color-status-warning)', fontWeight: 600 }}>Decision D-B</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', margin: '4px 0 0' }}>
              Recent company browsing and audit history is deferred under INT-017 Decision D-B.
              Zero simulated browsing history is rendered.
            </p>
            <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', background: 'var(--color-surface-1)', padding: 10, borderRadius: 6, marginTop: 8 }}>
              <Link to="/research/company/Banking" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                Open Company Workspace →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* INT-017 Bottom Product Preview Strip */}
      <div className="preview-strip-section">
        <h3 className="preview-strip-title">
          Governed Platform Workspaces
        </h3>
        <div className="preview-strip">
          <Link to="/research/company/Banking" className="preview-card">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>1. Company Workspace</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Fundamental analysis &amp; multi-pillar model</div>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>Open workspace →</div>
          </Link>
          <Link to="/portfolio" className="preview-card">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>2. Portfolio</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Holdings, allocations &amp; concentration risk</div>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>Open portfolio →</div>
          </Link>
          <Link to="/research" className="preview-card">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>3. Research</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Sector intelligence &amp; macro overlays</div>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>Open research →</div>
          </Link>
          <Link to="/screener" className="preview-card">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>4. Screener</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Cross-pillar screening &amp; filtering</div>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>Open screener →</div>
          </Link>
          <Link to="/intelligence" className="preview-card">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>5. Decision Center</div>
            <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>Decision matrix &amp; evidence verification</div>
            <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>Open intelligence →</div>
          </Link>
        </div>
      </div>

      {/* Governed Analytical Panels Grid */}
      <div className="executive-grid">
        {/* Recent decisions with CERTIFIED authority + evidence entry points (N+10: selectable) */}
        <div className="col-span-12 executive-panel">
          <div className="executive-panel-header">
            <h2 className="executive-panel-title">Recent Decisions</h2>
          </div>
          <div data-testid="decision-list" className="decision-grid">
            {decisions.map((d) => (
              <article key={d.sector} data-testid="recent-decision" className="decision-card">
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
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                  <Link data-testid={`decision-company-link-${d.sector}`} to={`/research/company/${d.sector}`}>Company →</Link>
                  <Link data-testid={`decision-evidence-link-${d.sector}`} to={`/evidence/${d.sector}`}>Evidence →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* N+10: selected-decision governed trust chain (Decision → Evidence → Replay → Provenance) */}
        {selectedSector && (
          <section
            data-testid="executive-trust-chain"
            aria-label={`Trust chain ${selectedSector}`}
            className="col-span-12 executive-panel"
            style={{ background: 'var(--color-surface-0)' }}
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
        <div className="col-span-6 executive-panel">
          <div className="executive-panel-header">
            <h2 className="executive-panel-title">Evidence &amp; Replay</h2>
          </div>
          <div data-testid="evidence-list" className="evidence-grid">
            {evidenceEntries.map((e) => (
              <div key={e.reference.evidenceId} className="evidence-grid-item">
                <EvidenceCard reference={e.reference} />
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  <Link data-testid={`evidence-link-${e.sector}`} to={`/evidence/${e.sector}`}>Open evidence →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TGT-11 — DOMAIN PREVIEWS */}
        <div className="col-span-6 executive-panel">
          <div className="executive-panel-header">
            <h2 className="executive-panel-title">Domain Previews</h2>
          </div>
          <p data-testid="domain-previews-disclosure" className="executive-panel-disclosure">
            Each preview shows the certified payload&apos;s own <code>sectorExposure</code> value for that
            domain, in the payload&apos;s own order — nothing is ranked, re-sorted, rescaled or recomputed
            here, and no domain is omitted or invented. A <em>concentration</em> marker is shown only
            where the payload&apos;s own <code>concentrationSectors</code> list names that domain. Selecting
            a preview opens the existing governed domain route.
          </p>
          <p data-testid="domain-previews-band" style={{ fontSize: 12, margin: '0 0 8px' }}>
            Governed diversification band: <strong>{typeof diversification.band === 'string' && diversification.band.length > 0 ? diversification.band : 'unavailable'}</strong>
          </p>
          {domainPreviews.length === 0 ? (
            <p data-testid="domain-previews-empty" style={{ fontSize: 13 }}>
              The certified payload carries no sectorExposure entry, so no domain preview is shown —
              none is fabricated to fill this section.
            </p>
          ) : (
            <div data-testid="domain-previews" className="domain-preview-grid">
              {domainPreviews.map((preview) => (
                <div
                  key={preview.sector}
                  data-testid={`domain-preview-${preview.sector}`}
                  className="domain-preview-card"
                >
                  <strong style={{ display: 'block' }}>{preview.sector}</strong>
                  <span data-testid={`domain-preview-exposure-${preview.sector}`} style={{ fontSize: 13 }}>
                    certified sectorExposure: {preview.exposure === null ? 'unavailable' : preview.exposure}
                  </span>
                  {preview.concentrated && (
                    <span data-testid={`domain-preview-concentration-${preview.sector}`} style={{ display: 'block', fontSize: 12, opacity: 0.85 }}>
                      Listed in the certified concentration sectors
                    </span>
                  )}
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    <Link data-testid={`domain-preview-link-${preview.sector}`} to={`/research/sector/${preview.sector}`}>
                      Open domain →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Freshness / provenance — SNAPSHOT is a certified frozen snapshot, not "stale". */}
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

/** TGT-11 — one governed domain preview, read verbatim from the certified payload. */
interface DomainPreview {
  readonly sector: string;
  readonly exposure: number | null;
  readonly concentrated: boolean;
}

/** TGT-08 — one governed item surfaced by the contract's own `changed` flag. */
interface WatchlistHighlight {
  readonly listName: string;
  readonly item: WatchlistItemView;
}

/** TGT-08 — one presentational row of a governed watchlist (payload order, capped). */
interface HighlightRow {
  readonly securityId: string;
  readonly item: WatchlistItemView;
  readonly sector: string | null;
}
