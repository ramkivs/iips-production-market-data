/**
 * Program v3.0 — N+10: Executive Dashboard tests (selected-decision governed trust chain).
 * URL-aware three-endpoint mocks; preserves the Phase-5 dashboard tests; adds selection →
 * inline governed Evidence + Replay (MATCH/DIFFERENCE), exact sector propagation,
 * loading/error/no-fabrication/deselection behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { SessionProvider } from '../../core/session/SessionContext';
import type { Session } from '../../core/session/session';
import { NAV } from '../../app/navigation';
import type { ExecutiveData } from '../../api/executive';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import type { DecisionMatrixData } from '../../api/decisionMatrix';

/** TGT-12/TGT-13 — the dashboard now composes Links, so the surface renders inside a Router. */
function renderDash(session?: Session) {
  const tree = (
    <MemoryRouter>
      <ExecutiveDashboard />
    </MemoryRouter>
  );
  // TGT-09: the dashboard reads the DISPLAY session for role-mirrored quick actions. Without a
  // provider the SessionContext default (ANONYMOUS_SESSION) applies — the same inert path the
  // shell uses before authentication.
  return session ? render(<SessionProvider session={session}>{tree}</SessionProvider>) : render(tree);
}

const VIEWER_SESSION: Session = { userId: 'u-viewer', tenantId: 'tenant-X', role: 'viewer', authenticated: true };
const ADMIN_SESSION: Session = { userId: 'u-admin', tenantId: 'tenant-X', role: 'admin', authenticated: true };

const FIXTURE: ExecutiveData = {
  portfolio: { portfolioId: 'PF-T', scenario: 'Balanced', holdings: 2, sectorExposure: { A: 50, B: 50 }, concentration: 50, diversificationScore: 100, avgConviction: 60, avgQuality: 70, avgRisk: 40 },
  diversification: { band: 'High', flags: ['diversified'] },
  ranking: [{ companyId: 'A-H1', sector: 'A', conviction: 70 }, { companyId: 'B-H1', sector: 'B', conviction: 50 }],
  opportunity: [{ companyId: 'A-H1', sector: 'A', conviction: 70 }],
  correlation: { flags: ['low correlation'], concentrationSectors: [] },
  decisions: [
    { sector: 'A', verdict: 'Buy', composite: 70, confidence: 0.8 },
    { sector: 'B', verdict: 'Hold', composite: 50, confidence: 0.7 },
  ],
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

function evidenceFor(sector: string, composite: number): EvidenceData {
  return {
    decision: { verdict: 'Buy', composite, confidence: 0.8 },
    evidence: {
      evidenceId: `ev_${sector}`, engineId: `sector.${sector.toLowerCase()}`, recommendation: 'Buy', compositeScore: composite,
      confidence: 0.55, keyMetrics: [],
      supportingScores: [{ id: 'quality', name: 'Certified Quality', value: 62 }],
      calibrationVersion: '1.0.0', decisionRulesApplied: ['pillar-floor'], replayReference: `snap_${sector}`,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
      generatedAt: '2026-08-01T00:00:00.000Z',
    },
    snapshot: { snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', scores: {} },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical: true, evidenceRefs: [`ev_${sector}`] },
    provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

function replayFor(sector: string, byteIdentical: boolean): ReplayData {
  return {
    original: {
      snapshotId: `snap_${sector}`, engineId: `sector.${sector.toLowerCase()}`, schemaVersion: '1.0', calibrationVersion: '1.0.0',
      generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', composite: 70, confidence: 0.8,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
    },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical, evidenceRefs: [`ev_${sector}`] },
    differenceAvailable: false,
    note: byteIdentical ? 'Replay reproduced successfully; byte-identical: MATCH' : 'Replay reproduced; outputs differ',
    evidenceRefs: [`ev_${sector}`],
    provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

/** TGT-04 — governed decision-matrix universe fixture (certified values only). */
const UNIVERSE: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'fixture (test-only); no quadrant/band/threshold computed',
  companies: [
    { companyId: 'A-H1', sector: 'A', verdict: 'Buy', composite: 70, quality: 60, valuation: 55 },
    { companyId: 'B-H1', sector: 'B', verdict: 'Hold', composite: 50, quality: 45, valuation: 40 },
    { companyId: 'C-H1', sector: 'C', verdict: 'Buy', composite: 80, quality: 75, valuation: 65 },
  ],
  universe: { avgConviction: 60, avgQuality: 60, holdings: 3 },
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

/** D89 governed degraded response (LIVE/PIT): carries NO universe of any kind. */
const DEGRADED_UNIVERSE = {
  surface: 'Decision Matrix',
  dataMode: 'LIVE',
  state: 'LIVE_UNAVAILABLE',
  dataAvailable: false,
  reason: 'LIVE data is UNAVAILABLE for Decision Matrix.',
  dependency: 'R-2 provider ingestion — OPEN and externally blocked.',
  provenance: { dataSource: 'none', freshness: 'UNAVAILABLE', mode: 'LIVE', transportSemantics: 'no fallback' },
};

/**
 * TGT-08 — governed watchlist envelope fixture. Mirrors the server contract 1:1:
 * deltas are BASELINE vs CURRENT (not a time series); `changed` is the contract's own flag.
 */
interface FixtureDelta { readonly field: string; readonly baselineValue: number; readonly currentValue: number; readonly delta: number; readonly changed: boolean; }
interface FixtureItem {
  readonly canonicalSecurityId: string;
  readonly baseline: Record<string, unknown>;
  readonly baselineAsOf: string;
  readonly addedAt: string;
  readonly triggers: readonly unknown[];
  readonly deltas: readonly FixtureDelta[];
  readonly current: Record<string, unknown> | null;
  readonly currentAsOf: string | null;
  readonly _quality: string;
}

function watchlistItem(securityId: string, sector: string, baselineValue: number, currentValue: number): FixtureItem {
  const delta = currentValue - baselineValue;
  return {
    canonicalSecurityId: securityId,
    baseline: { canonicalSecurityId: securityId, sector, composite: baselineValue },
    baselineAsOf: '2026-08-09T00:00:00.000Z',
    addedAt: '2026-08-10T00:00:00.000Z',
    triggers: [],
    deltas: [{ field: 'composite', baselineValue, currentValue, delta, changed: delta !== 0 }],
    current: { canonicalSecurityId: securityId, sector, composite: currentValue },
    currentAsOf: '2026-08-09T00:00:00.000Z',
    _quality: 'good',
  };
}

const WATCHLISTS = {
  data: [
    {
      surfaceName: 'UI07', disposition: 'NEW', watchlistId: 'wl-core', name: 'Core',
      createdAt: '2026-08-10T00:00:00.000Z', totalItems: 3,
      items: [
        watchlistItem('A-H1', 'A', 70, 70), // delta 0 — the governed result on the frozen baseline
        watchlistItem('B-H1', 'B', 50, 50),
        watchlistItem('C-H1', 'C', 80, 80),
      ],
    },
    {
      surfaceName: 'UI07', disposition: 'NEW', watchlistId: 'wl-watch', name: 'Watch',
      createdAt: '2026-08-10T00:00:00.000Z', totalItems: 1,
      items: [watchlistItem('D-H1', 'D', 40, 40)],
    },
  ],
  provenance: {
    dataSource: 'P12 governed universe over frozen v1.1 replay baseline',
    asOf: '2026-08-09T00:00:00.000Z', dataVersion: 'v1.1-replay-baseline',
    mode: 'SNAPSHOT', freshness: 'SNAPSHOT', authority: 'PLATFORM',
    transportSemantics: 'owner-scoped watchlists (append-only journal). Deltas compare each item PERSISTED BASELINE against the CURRENT governed value. Values derive from the frozen v1.1 replay baseline — this is NOT a live feed and NOT a time series.',
  },
};

/** The same envelope, but with one governed change genuinely flagged by the contract. */
const WATCHLISTS_WITH_CHANGE = {
  ...WATCHLISTS,
  data: [
    { ...WATCHLISTS.data[0], items: [watchlistItem('A-H1', 'A', 60, 70), watchlistItem('B-H1', 'B', 50, 50)] },
  ],
};

/** No governed lists at all — must not be filled with fabricated content. */
const WATCHLISTS_EMPTY = { data: [], provenance: WATCHLISTS.provenance };

/** A row whose governed sector is absent — no company link may be invented. */
const WATCHLISTS_NO_SECTOR = {
  ...WATCHLISTS,
  data: [
    {
      ...WATCHLISTS.data[0],
      items: [{
        ...watchlistItem('E-H1', 'E', 30, 30),
        baseline: { canonicalSecurityId: 'E-H1', composite: 30 },
        current: { canonicalSecurityId: 'E-H1', composite: 30 },
      }],
    },
  ],
};

/**
 * TGT-07 — governed notification envelope fixture. Mirrors the server contract 1:1:
 * `unreadCount` is carried in the envelope (U-2b); `read` is the contract's own flag;
 * `sourceStateNote` is the U-4 / DG-1′ verbatim wording (historical, non-durable source state).
 */
const U4_NOTE = 'Historical record — the classification shown here was recorded at the time of this event and is not the current stored state.';

function notification(id: string, read: boolean, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    notificationId: id,
    tenantId: 'tenant-X',
    recipientUserId: 'u1',
    eventId: `evt-${id}`,
    type: 'data-governance.classified',
    title: `Classification recorded (${id})`,
    summary: 'data-governance.classified',
    createdAt: '2026-09-01T10:00:00.000Z',
    read,
    deepLink: '/admin/data',
    sourceStateDurability: 'NON_DURABLE',
    sourceStateNote: U4_NOTE,
    ...overrides,
  };
}

const NOTIFICATIONS = {
  data: [notification('n1', false), notification('n2', true)],
  unreadCount: 1,
  provenance: {
    dataSource: 'governed P-1 notifications (PF-1 durable journal)',
    freshness: 'LIVE',
    authority: 'PLATFORM',
    transportSemantics: 'recipient-scoped historical assertions; not a current-state read model',
  },
};

/** All read — nothing requires attention, but records exist. */
const NOTIFICATIONS_ALL_READ = {
  data: [notification('n1', true), notification('n2', true)],
  unreadCount: 0,
  provenance: NOTIFICATIONS.provenance,
};

/** No governed notifications for this principal — a legitimate governed result. */
const NOTIFICATIONS_EMPTY = { data: [], unreadCount: 0, provenance: NOTIFICATIONS.provenance };

function urlAwareMock(opts: {
  replayBIdentical?: boolean;
  evidenceFails?: boolean;
  /** TGT-04: omitted → 404 (preserves every pre-Phase-2 test unchanged). */
  universe?: DecisionMatrixData | 'fail' | 'degraded' | 'malformed';
  /** TGT-08: omitted → 404 (preserves every pre-Phase-3 test unchanged). */
  watchlists?: unknown | 'fail';
  /** TGT-07: omitted → 404 (preserves every earlier test unchanged). */
  notifications?: unknown | 'fail';
} = {}) {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/executive')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
    if (url.includes('/api/evidence/')) {
      if (opts.evidenceFails) return Promise.reject(new Error('evidence down')) as never;
      const sector = url.includes('/api/evidence/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'A' ? 70 : 50) }) as never;
    }
    if (url.includes('/api/replay/')) {
      const sector = url.includes('/api/replay/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => replayFor(sector, sector === 'A' ? true : (opts.replayBIdentical ?? true)) }) as never;
    }
    if (url.includes('/api/decision-matrix')) {
      if (opts.universe === 'fail') return Promise.reject(new Error('universe down')) as never;
      if (opts.universe === 'degraded') return Promise.resolve({ ok: true, json: async () => DEGRADED_UNIVERSE }) as never;
      // A 200 response that is NOT a governed universe (e.g. another surface's DTO).
      if (opts.universe === 'malformed') return Promise.resolve({ ok: true, json: async () => ({ matrixType: 'scatter', provenance: {} }) }) as never;
      if (opts.universe) return Promise.resolve({ ok: true, json: async () => opts.universe }) as never;
    }
    if (url.includes('/api/notifications')) {
      if (opts.notifications === 'fail') return Promise.reject(new Error('notifications down')) as never;
      if (opts.notifications !== undefined) return Promise.resolve({ ok: true, json: async () => opts.notifications }) as never;
    }
    if (url.includes('/api/watchlists')) {
      if (opts.watchlists === 'fail') return Promise.reject(new Error('watchlists down')) as never;
      if (opts.watchlists !== undefined) return Promise.resolve({ ok: true, json: async () => opts.watchlists }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

beforeEach(() => {
  globalThis.fetch = vi.fn() as never;
});

describe('Executive Dashboard (Phase 5 preserved behavior)', () => {
  it('renders loading then data', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    expect(screen.getByTestId('state-loading')).toBeInTheDocument();
    expect(await screen.findByTestId('decision-list')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('renders error state on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('transport down')) as never;
    renderDash();
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load certified executive data');
  });

  it('renders decision badges from certified data', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    expect(await screen.findByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });

  it('does not fabricate values and surfaces SNAPSHOT freshness (not stale/live)', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.queryByTestId('state-stale')).not.toBeInTheDocument();
  });
});

describe('Executive Dashboard — N+10 selected-decision trust chain', () => {
  it('selects a decision and renders the inline governed trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));

    expect(await screen.findByTestId('executive-trust-chain')).toBeInTheDocument();
    expect(screen.getByText('Trust Chain — A')).toBeInTheDocument();
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    // ⚠ AD-17 L-5 (authority: D57, commit 9316b54). This PREVIOUSLY asserted the literal
    // 'MATCH — byte-identical', which encoded a verified-replay claim that has never been
    // established (AD-17 / M-2 UNRESOLVED). Replaced by an absence proof, scoped to the
    // verdict <strong> — replay.note is payload free text and contains 'MATCH' in the
    // fixture, so a region-wide search would be unsound, not stronger.
    {
      const eq = screen.getByTestId('company-replay-equivalence');
      expect(eq.querySelector('strong')?.textContent ?? '').not.toMatch(/MATCH|\bDIFFERENCE\b/);
      expect(eq).toHaveTextContent('NOT VERIFIED');
      expect(eq.querySelector('[data-testid="ad17-disclosure"]')).not.toBeNull();
    }
  });

  it('propagates the selected decision\'s ACTUAL sector to evidence + replay (exact URLs)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('executive-trust-chain');

    expect(calls).toContain('/api/evidence/B');
    expect(calls).toContain('/api/replay/B');
    expect(calls.some((u) => u.includes('/api/evidence/A'))).toBe(false);
    expect(calls.some((u) => u.includes('/api/replay/A'))).toBe(false);
  });

  it('AD-17: reports byteIdentical=false as an unverified literal, with no DIFFERENCE verdict', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    // ⚠ AD-17 L-5 (authority: D57). This PREVIOUSLY asserted the 'DIFFERENCE' failure
    // verdict, which is equally a verification claim. Now proves the verdict is absent and
    // the literal is reported as UNVERIFIED.
    {
      const eq = await screen.findByTestId('company-replay-equivalence');
      expect(eq.querySelector('strong')?.textContent ?? '').not.toMatch(/MATCH|\bDIFFERENCE\b/);
      expect(eq).toHaveTextContent('Reported byteIdentical:');
      expect(eq).toHaveTextContent('false');
      expect(eq).toHaveTextContent('NOT VERIFIED');
    }
  });

  it('shows a governed error state when the selected evidence fetch fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ evidenceFails: true });
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load decision evidence');
  });

  it('deselects (toggle) and hides the trust chain when the same decision is clicked again', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));
    await screen.findByTestId('executive-trust-chain');
    await user.click(screen.getByTestId('inspect-A'));
    expect(screen.queryByTestId('executive-trust-chain')).not.toBeInTheDocument();
  });

  it('does not fabricate: existing executive content remains alongside the trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('executive-trust-chain');
    // The certified decision cards remain rendered (no removal, no fabrication).
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });
});

/**
 * TARGET-UI-CONVERGENCE PHASE 2 — authorized scope only:
 *   TGT-13 drill-through · TGT-12 navigation · TGT-04 IIPS Score Distribution ·
 *   TGT-03 governed mover semantics.
 *
 * Every assertion below is repo-establishable (jsdom). NOTHING here is a browser, responsive,
 * accessibility, Windows or screenshot-parity claim — those remain unperformed by Arena.
 */
describe('Executive Dashboard — Phase 2 TGT-13/TGT-12 drill-through', () => {
  it('drills through to the existing governed routes with exact hrefs', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');

    expect(screen.getByTestId('top-opportunity-link').getAttribute('href')).toBe('/research/company/A');
    expect(screen.getByTestId('mover-link-A').getAttribute('href')).toBe('/research/company/A');
    expect(screen.getByTestId('mover-link-B').getAttribute('href')).toBe('/research/company/B');
    expect(screen.getByTestId('decision-company-link-A').getAttribute('href')).toBe('/research/company/A');
    expect(screen.getByTestId('decision-evidence-link-B').getAttribute('href')).toBe('/evidence/B');
    expect(screen.getByTestId('evidence-link-A').getAttribute('href')).toBe('/evidence/A');
  });

  it('uses the governed payload sector identity — no invented companyId, no parallel identity model', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.length).toBeGreaterThan(0);
    // The certified companyId form ('A-H1') must never leak into a route: the governed surfaces
    // are addressed by the payload's own `sector`, exactly as the existing routes already are.
    expect(hrefs.some((h) => h.includes('-H1'))).toBe(false);
    expect(hrefs).toContain('/research/company/A');
  });

  it('keeps the in-place governed trust chain (navigation is additive, not a replacement)', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    await user.click(screen.getByTestId('inspect-A'));
    expect(await screen.findByTestId('executive-trust-chain')).toBeInTheDocument();
    expect(screen.getByTestId('decision-company-link-A').getAttribute('href')).toBe('/research/company/A');
  });
});

describe('Executive Dashboard — Phase 2 TGT-04 IIPS Score Distribution', () => {
  it('renders the distribution from the governed decision-matrix payload (counts + descriptive stats)', async () => {
    globalThis.fetch = urlAwareMock({ universe: UNIVERSE });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('score-distribution-disclosure');

    // Presentational grouping of CERTIFIED verdict classes: Buy ×2, Hold ×1.
    expect(screen.getByTestId('bar-Buy')).toBeInTheDocument();
    expect(screen.getByTestId('bar-Hold')).toBeInTheDocument();

    const metrics = screen.getByTestId('metric-table');
    expect(metrics).toHaveTextContent('Governed universe (companies)');
    expect(metrics).toHaveTextContent('3');
    expect(metrics).toHaveTextContent('Certified composite — minimum');
    expect(metrics).toHaveTextContent('50');
    expect(metrics).toHaveTextContent('Certified composite — median');
    expect(metrics).toHaveTextContent('70');
    expect(metrics).toHaveTextContent('Certified composite — maximum');
    expect(metrics).toHaveTextContent('80');

    // The distribution is actionable: each governed company drills through.
    expect(screen.getByTestId('distribution-link-A').getAttribute('href')).toBe('/research/company/A');
    expect(screen.getByTestId('distribution-link-C').getAttribute('href')).toBe('/research/company/C');
  });

  it('discloses the source and states that no band, bin edge, quadrant or threshold is invented', async () => {
    globalThis.fetch = urlAwareMock({ universe: UNIVERSE });
    renderDash();
    await screen.findByTestId('decision-list');
    const note = await screen.findByTestId('score-distribution-disclosure');
    expect(note).toHaveTextContent('/api/decision-matrix');
    expect(note).toHaveTextContent('SNAPSHOT');
    expect(note).toHaveTextContent('No score band, bin edge, quadrant or threshold is computed or invented');
  });

  it('degrades ALONE on failure: the certified executive dashboard is unaffected', async () => {
    globalThis.fetch = urlAwareMock({ universe: 'fail' });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('score-distribution-unavailable')).toHaveTextContent('universe down');

    // The certified payload still renders in full and the page-level error state is NOT used.
    expect(screen.queryByTestId('state-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
    // No substituted or zeroed distribution is rendered in place of the governed universe.
    expect(screen.getAllByTestId('simple-bar-chart').length).toBe(1); // the certified composite chart only
    expect(screen.queryByTestId('metric-table')).not.toBeInTheDocument();
  });

  it('D86-class: a non-universe 200 payload is refused instead of crashing the dashboard', async () => {
    globalThis.fetch = urlAwareMock({ universe: 'malformed' });
    renderDash();
    // Previously this threw `universe.companies is not iterable`, which unmounts the React tree
    // and blanks the ENTIRE certified executive payload. It must refuse + disclose instead.
    expect(await screen.findByTestId('score-distribution-unavailable'))
      .toHaveTextContent('no governed company universe was returned');
    expect(screen.getByTestId('decision-list')).toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.queryByTestId('metric-table')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('simple-bar-chart').length).toBe(1);
  });

  it('renders the governed degraded state verbatim (no SNAPSHOT fallback, no substitution)', async () => {
    globalThis.fetch = urlAwareMock({ universe: 'degraded' });
    renderDash();
    await screen.findByTestId('decision-list');
    const degraded = await screen.findByTestId('score-distribution-unavailable');
    expect(degraded).toHaveTextContent('LIVE data is UNAVAILABLE for Decision Matrix.');
    expect(degraded).toHaveTextContent('R-2 provider ingestion — OPEN and externally blocked.');
    expect(screen.queryByTestId('metric-table')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('simple-bar-chart').length).toBe(1);
  });
});

describe('Executive Dashboard — Phase 2 TGT-03 governed mover semantics', () => {
  it('discloses that no movement/delta is derived from the single-vintage SNAPSHOT baseline', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    const disclosure = screen.getByTestId('movers-disclosure');
    expect(disclosure).toHaveTextContent('certified conviction');
    expect(disclosure).toHaveTextContent('single vintage');
    expect(disclosure).toHaveTextContent('no period-over-period movement or delta is computed or displayed');
  });

  it('does NOT promote the rank-position TrendIndicator into a certified movement signal', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    // The pre-existing presentational cue is unchanged (rank < 3 → up), and it is labelled
    // as a rank cue only — it is never claimed as verified movement.
    expect(screen.getAllByTestId('trend-up').length).toBe(2);
    expect(screen.queryAllByTestId('trend-flat').length).toBe(0);
    expect(screen.getByTestId('trend-cue-disclosure')).toHaveTextContent('NOT a verified movement signal');
    expect(screen.getByTestId('trend-cue-disclosure')).toHaveTextContent('no certified delta');
  });

  it('preserves the certified ranking order verbatim (no client re-sort)', async () => {
    globalThis.fetch = urlAwareMock();
    renderDash();
    await screen.findByTestId('decision-list');
    const table = screen.getAllByTestId('data-table')[0];
    const cells = Array.from(table.querySelectorAll('tbody tr')).map((tr) => tr.querySelector('td')?.textContent);
    expect(cells).toEqual(['A', 'B']);
  });
});

/**
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-08 Watchlist Highlights (authorized bounded scope).
 * Composition-only over the EXISTING governed /api/watchlists contract. Every assertion is
 * repo-establishable (jsdom). NOTHING here is a browser, responsive, accessibility, Windows or
 * screenshot-parity claim.
 */
describe('Executive Dashboard — Phase 3 TGT-08 Watchlist Highlights', () => {
  it('renders the governed watchlist highlights from the existing contract', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('watchlist-highlight-wl-core');

    expect(screen.getByTestId('watchlist-highlight-wl-core')).toHaveTextContent('Core');
    expect(screen.getByTestId('watchlist-highlight-wl-core')).toHaveTextContent('3 item(s)');
    expect(screen.getByTestId('watchlist-highlight-wl-watch')).toHaveTextContent('Watch');
    // Governed values rendered verbatim: baseline 70, current 70, change 0 (unchanged).
    const core = screen.getByTestId('watchlist-highlight-wl-core');
    const row = core.querySelector('tbody tr');
    expect(row?.textContent).toContain('A-H1');
    expect(row?.textContent).toContain('70');
    expect(row?.textContent).toContain('0 (unchanged)');
  });

  it('represents delta = 0 as the CORRECT governed result, not missing data', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS });
    renderDash();
    await screen.findByTestId('decision-list');
    const noChanges = await screen.findByTestId('watchlist-no-changes');
    expect(noChanges).toHaveTextContent('No governed changes detected');
    expect(noChanges).toHaveTextContent('delta = 0 is the correct governed result');
    expect(noChanges).toHaveTextContent('not missing data');
    // Nothing was promoted into a change highlight.
    expect(screen.queryByTestId('watchlist-changed-highlights')).not.toBeInTheDocument();
  });

  it('flags a governed change ONLY from the contract`s own `changed` flag', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS_WITH_CHANGE });
    renderDash();
    await screen.findByTestId('decision-list');
    const highlights = await screen.findByTestId('watchlist-changed-highlights');
    expect(highlights).toHaveTextContent('A-H1');
    expect(highlights).toHaveTextContent('governed change detected');
    // The unchanged sibling is never listed as a change.
    expect(highlights).not.toHaveTextContent('B-H1');
    expect(screen.queryByTestId('watchlist-no-changes')).not.toBeInTheDocument();
  });

  it('discloses the baseline-vs-current semantics, the source and the as-of vintage', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('watchlist-highlights-disclosure'))
      .toHaveTextContent('NOT a time series and not a live feed');
    const prov = screen.getByTestId('watchlist-highlights-provenance');
    expect(prov).toHaveTextContent('P12 governed universe over frozen v1.1 replay baseline');
    expect(prov).toHaveTextContent('as of 2026-08-09T00:00:00.000Z');
    expect(prov).toHaveTextContent('freshness SNAPSHOT');
    expect(prov).toHaveTextContent('NOT a live feed and NOT a time series');
  });

  it('drills through using the governed sector carried in the row', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS });
    renderDash();
    await screen.findByTestId('decision-list');
    expect((await screen.findByTestId('watchlist-item-company-A-H1')).getAttribute('href')).toBe('/research/company/A');
    expect(screen.getByTestId('watchlist-item-company-C-H1').getAttribute('href')).toBe('/research/company/C');
    expect(screen.getByTestId('watchlist-highlights-open').getAttribute('href')).toBe('/watchlists');
  });

  it('invents no company link when the governed sector is absent', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS_NO_SECTOR });
    renderDash();
    await screen.findByTestId('decision-list');
    const core = await screen.findByTestId('watchlist-highlight-wl-core');
    expect(screen.queryByTestId('watchlist-item-company-E-H1')).not.toBeInTheDocument();
    expect(core).toHaveTextContent('sector unavailable');
  });

  it('caps rows by a DISCLOSED presentational limit in payload order (not a ranking)', async () => {
    globalThis.fetch = urlAwareMock({
      watchlists: {
        ...WATCHLISTS,
        data: [{
          ...WATCHLISTS.data[0],
          totalItems: 7,
          items: Array.from({ length: 7 }, (_, i) => watchlistItem(`S${i}-H1`, 'A', 50 + i, 50 + i)),
        }],
      },
    });
    renderDash();
    await screen.findByTestId('decision-list');
    const core = await screen.findByTestId('watchlist-highlight-wl-core');
    // Payload order preserved verbatim (S0 first) and capped at 5.
    const ids = Array.from(core.querySelectorAll('tbody tr')).map((tr) => tr.querySelector('td')?.textContent);
    expect(ids).toEqual(['S0-H1', 'S1-H1', 'S2-H1', 'S3-H1', 'S4-H1']);
    expect(screen.getByTestId('watchlist-truncation-wl-core')).toHaveTextContent('first 5 of 7 items');
    expect(screen.getByTestId('watchlist-truncation-wl-core')).toHaveTextContent('NOT a ranking');
  });

  it('degrades ALONE on failure: no fallback data, certified dashboard unaffected', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: 'fail' });
    renderDash();
    await screen.findByTestId('decision-list');
    const unavailable = await screen.findByTestId('watchlist-highlights-unavailable');
    expect(unavailable).toHaveTextContent('watchlists down');
    expect(unavailable).toHaveTextContent('No substitute or sample data is shown');
    // No watchlist content and no page-level error state; the certified payload still renders.
    expect(screen.queryByTestId('watchlist-highlight-wl-core')).not.toBeInTheDocument();
    expect(screen.queryByTestId('state-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
  });

  it('D86-class: a non-envelope 200 payload is refused instead of crashing the dashboard', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: { provenance: {} } });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('watchlist-highlights-unavailable'))
      .toHaveTextContent('no governed watchlist data was returned');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.queryByTestId('watchlist-highlight-wl-core')).not.toBeInTheDocument();
  });

  it('renders an explicit empty state when no governed watchlists exist', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS_EMPTY });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('watchlist-highlights-empty'))
      .toHaveTextContent('No governed watchlists exist for this account');
    expect(screen.queryByTestId('watchlist-changed-highlights')).not.toBeInTheDocument();
  });

  it('does not mutate the governed watchlist payload it renders', async () => {
    const frozen = JSON.parse(JSON.stringify(WATCHLISTS)) as typeof WATCHLISTS;
    const deepFreeze = (o: unknown): void => {
      if (o && typeof o === 'object') { Object.values(o as object).forEach(deepFreeze); Object.freeze(o); }
    };
    deepFreeze(frozen);
    globalThis.fetch = urlAwareMock({ watchlists: frozen });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('watchlist-highlight-wl-core');
    // Frozen input survived rendering unchanged (a mutation attempt would have thrown in strict mode).
    expect(frozen.data[0].items[0].deltas[0].delta).toBe(0);
    expect(frozen.data[0].items[0].canonicalSecurityId).toBe('A-H1');
    expect(frozen.data[0].totalItems).toBe(3);
  });

  it('leaves the certified executive payload and the TGT-04 distribution untouched', async () => {
    globalThis.fetch = urlAwareMock({ watchlists: WATCHLISTS, universe: UNIVERSE });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('watchlist-highlight-wl-core');
    // Existing surface behaviour is unchanged by the Phase 3 composition.
    expect(screen.getByTestId('metric-group')).toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
    expect(screen.getAllByTestId('evidence-card').length).toBe(2);
    expect(await screen.findByTestId('score-distribution-disclosure')).toHaveTextContent('/api/decision-matrix');
  });
});

/**
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-07 Alerts Requiring Attention (authorized bounded scope).
 * Composition-only over the EXISTING governed /api/notifications contract. jsdom/typecheck only —
 * NOT browser, responsive, accessibility, Windows or screenshot-parity evidence.
 */
describe('Executive Dashboard — Phase 3 TGT-07 Alerts Requiring Attention', () => {
  it('renders only the governed unread records, with the envelope unread count verbatim', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('alerts-item-n1');

    // Unread (n1) requires attention; read (n2) is not listed as requiring attention.
    expect(screen.getByTestId('alerts-item-n1')).toBeInTheDocument();
    expect(screen.queryByTestId('alerts-item-n2')).not.toBeInTheDocument();
    // The governed count is displayed as supplied; it is not recomputed client-side.
    expect(screen.getByTestId('alerts-unread-count')).toHaveTextContent('Unread (governed count): 1');
    expect(screen.getByTestId('alerts-unread-count')).toHaveTextContent('records returned: 2');
  });

  it('preserves the U-4 / DG-1′ non-durability wording verbatim with its marker', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS });
    renderDash();
    await screen.findByTestId('decision-list');
    const note = await screen.findByTestId('alerts-source-state-note-n1');
    expect(note).toHaveTextContent(U4_NOTE);
    expect(note.getAttribute('data-source-state-durability')).toBe('NON_DURABLE');
  });

  it('preserves the one-event-type limitation and states no history is inferred', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS });
    renderDash();
    await screen.findByTestId('decision-list');
    const d = await screen.findByTestId('alerts-disclosure');
    expect(d).toHaveTextContent('single v1 event type');
    expect(d).toHaveTextContent('data-governance.classified');
    expect(d).toHaveTextContent('historical assertions');
    expect(d).toHaveTextContent('not a current-state read model');
    expect(d).toHaveTextContent('no severity, priority or age is inferred');
    // The item's governed type is also shown verbatim.
    expect(screen.getByTestId('alerts-item-n1').closest('tr')).toHaveTextContent('data-governance.classified');
  });

  it('renders the deep link verbatim from the governed payload', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS });
    renderDash();
    await screen.findByTestId('decision-list');
    expect((await screen.findByTestId('alerts-deep-link-n1')).getAttribute('href')).toBe('/admin/data');
  });

  it('is read-only: no mark-read mutation is performed from the dashboard block', async () => {
    const calls: string[] = [];
    const base = urlAwareMock({ notifications: NOTIFICATIONS });
    globalThis.fetch = vi.fn((input: unknown, init?: unknown) => {
      calls.push(`${(init as { method?: string } | undefined)?.method ?? 'GET'} ${String(input)}`);
      return base(input);
    }) as never;
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('alerts-item-n1');
    expect(calls.some((c) => c.includes('/read'))).toBe(false);
    expect(screen.getByTestId('alerts-read-note')).toHaveTextContent('read-only');
  });

  it('states honestly when every governed notification is already read', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS_ALL_READ });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('alerts-none-requiring-attention'))
      .toHaveTextContent('every governed notification on this account is marked read');
    expect(screen.getByTestId('alerts-unread-count')).toHaveTextContent('Unread (governed count): 0');
    expect(screen.queryByTestId('alerts-item-n1')).not.toBeInTheDocument();
  });

  it('renders an explicit empty state with no fabricated alerts', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS_EMPTY });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('alerts-empty'))
      .toHaveTextContent('No governed notifications exist for this account');
    expect(screen.queryByTestId('alerts-item-n1')).not.toBeInTheDocument();
  });

  it('degrades ALONE on failure: no substitute data, certified dashboard unaffected', async () => {
    globalThis.fetch = urlAwareMock({ notifications: 'fail' });
    renderDash();
    await screen.findByTestId('decision-list');
    const unavailable = await screen.findByTestId('alerts-unavailable');
    expect(unavailable).toHaveTextContent('notifications down');
    expect(unavailable).toHaveTextContent('No substitute, sample or placeholder alert is shown');
    expect(screen.queryByTestId('alerts-item-n1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('state-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('D86-class: a non-envelope 200 payload is refused instead of crashing the dashboard', async () => {
    globalThis.fetch = urlAwareMock({ notifications: { unreadCount: 3 } });
    renderDash();
    await screen.findByTestId('decision-list');
    expect(await screen.findByTestId('alerts-unavailable'))
      .toHaveTextContent('no governed notification data was returned');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('preserves the governed provenance verbatim', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS });
    renderDash();
    await screen.findByTestId('decision-list');
    const prov = await screen.findByTestId('alerts-provenance');
    expect(prov).toHaveTextContent('governed P-1 notifications (PF-1 durable journal)');
    expect(prov).toHaveTextContent('freshness LIVE');
    expect(prov).toHaveTextContent('authority PLATFORM');
    expect(prov).toHaveTextContent('not a current-state read model');
  });

  it('does not mutate the governed notification payload it renders', async () => {
    const frozen = JSON.parse(JSON.stringify(NOTIFICATIONS)) as typeof NOTIFICATIONS;
    const deepFreeze = (o: unknown): void => {
      if (o && typeof o === 'object') { Object.values(o as object).forEach(deepFreeze); Object.freeze(o); }
    };
    deepFreeze(frozen);
    globalThis.fetch = urlAwareMock({ notifications: frozen });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('alerts-item-n1');
    expect(frozen.data[0].read).toBe(false);
    expect(frozen.unreadCount).toBe(1);
    expect(frozen.data[0].deepLink).toBe('/admin/data');
  });

  it('does not disturb the other Phase 2/3 blocks or the certified payload', async () => {
    globalThis.fetch = urlAwareMock({ notifications: NOTIFICATIONS, watchlists: WATCHLISTS, universe: UNIVERSE });
    renderDash();
    await screen.findByTestId('decision-list');
    await screen.findByTestId('alerts-item-n1');
    expect(screen.getByTestId('metric-group')).toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.getAllByTestId('recent-decision').length).toBe(2);
    expect(await screen.findByTestId('watchlist-item-company-A-H1')).toBeInTheDocument();
    expect(await screen.findByTestId('score-distribution-disclosure')).toHaveTextContent('/api/decision-matrix');
    expect(screen.getAllByTestId('evidence-card').length).toBe(2);
  });
});

/**
 * TARGET-UI-CONVERGENCE PHASE 3 — TGT-09 Quick Actions (authorized bounded scope).
 * COMPOSITION-ONLY / NAVIGATION-ONLY: the action set is the EXISTING navigation model, each action
 * is a Link to an already-existing route, and nothing is executed. jsdom/typecheck only — NOT
 * browser, responsive, accessibility, Windows or screenshot-parity evidence.
 */
describe('Executive Dashboard — Phase 3 TGT-09 Quick Actions', () => {
  it('offers governed navigation shortcuts as links to already-existing routes', async () => {
    globalThis.fetch = urlAwareMock({});
    renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');

    expect(screen.getByTestId('quick-action-decision-matrix').getAttribute('href')).toBe('/intelligence/decision-matrix');
    expect(screen.getByTestId('quick-action-company').getAttribute('href')).toBe('/research/company/Banking');
    expect(screen.getByTestId('quick-action-cross-sector').getAttribute('href')).toBe('/research/cross-sector');
    expect(screen.getByTestId('quick-action-watchlists').getAttribute('href')).toBe('/watchlists');
    expect(screen.getByTestId('quick-action-reports').getAttribute('href')).toBe('/reports');
    expect(screen.getByTestId('quick-action-settings').getAttribute('href')).toBe('/settings');
    expect(screen.getByTestId('quick-action-portfolio').getAttribute('href')).toBe('/portfolio');
    // 'Decision Evidence' is the implemented Evidence child ('Decision Evidence' → slug); the
    // partial 'Evidence' parent is deliberately not offered.
    expect(screen.getByTestId('quick-action-decision-evidence').getAttribute('href')).toBe('/evidence');
    expect(screen.queryByTestId('quick-action-evidence')).not.toBeInTheDocument();
  });

  it('offers ONLY surfaces the navigation model marks implemented (no placeholder/future action)', async () => {
    globalThis.fetch = urlAwareMock({});
    renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');

    // partial parents are not offered as actions
    expect(screen.queryByTestId('quick-action-research')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-action-intelligence')).not.toBeInTheDocument();
    // future surfaces are never offered
    expect(screen.queryByTestId('quick-action-opportunities')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-action-risks')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-action-rankings')).not.toBeInTheDocument();
    const hrefs = Array.from(screen.getByTestId('quick-actions').querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/intelligence');
    expect(hrefs).not.toContain('/research');
    expect(hrefs.every((h) => typeof h === 'string' && h.startsWith('/'))).toBe(true);
  });

  it('preserves the authorization boundary: role filtering is display-only, exactly as the sidebar', async () => {
    globalThis.fetch = urlAwareMock({});
    const { unmount } = renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');
    // viewer cannot reach any /admin/* surface, and no admin-only action is rendered
    const viewerHrefs = Array.from(screen.getByTestId('quick-actions').querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(viewerHrefs.some((h) => (h ?? '').startsWith('/admin'))).toBe(false);
    expect(screen.queryByTestId('quick-action-identity-access')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-action-audit')).not.toBeInTheDocument();
    unmount();

    globalThis.fetch = urlAwareMock({});
    renderDash(ADMIN_SESSION);
    await screen.findByTestId('decision-list');
    expect(screen.getByTestId('quick-action-identity-access').getAttribute('href')).toBe('/admin/identity');
    expect(screen.getByTestId('quick-action-audit').getAttribute('href')).toBe('/admin/audit');
  });

  it('NAV invariant: every child carries its parent\'s minRole, so parent filtering is sufficient', () => {
    for (const parent of NAV) {
      for (const child of parent.children ?? []) {
        expect({ parent: parent.label, child: child.label, minRole: child.minRole })
          .toEqual({ parent: parent.label, child: child.label, minRole: parent.minRole });
      }
    }
  });

  it('executes nothing: no mutation, no extra request beyond the three governed reads', async () => {
    const calls: string[] = [];
    const base = urlAwareMock({});
    globalThis.fetch = vi.fn((input: unknown, init?: unknown) => {
      calls.push(`${(init as { method?: string } | undefined)?.method ?? 'GET'} ${String(input)}`);
      return base(input);
    }) as never;
    renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');

    expect(calls.filter((c) => c.startsWith('POST') || c.startsWith('PUT') || c.startsWith('DELETE'))).toEqual([]);
    expect(screen.getByTestId('quick-actions-disclosure')).toHaveTextContent('perform no action, create nothing, change nothing and grant no access');
  });

  it('states that this block has no loading/partial/degraded state and shows no fallback data', async () => {
    globalThis.fetch = urlAwareMock({});
    renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');
    const d = screen.getByTestId('quick-actions-disclosure');
    expect(d).toHaveTextContent('loads nothing');
    expect(d).toHaveTextContent('no loading, partial or degraded state');
    expect(d).toHaveTextContent('shows no fallback data');
    expect(d).toHaveTextContent('Only surfaces marked');
  });

  it('discloses the unauthenticated display session without pre-authorizing anything', async () => {
    globalThis.fetch = urlAwareMock({});
    renderDash();
    await screen.findByTestId('decision-list');
    expect(screen.getByTestId('quick-actions-unauthenticated')).toHaveTextContent('The target surfaces require authentication and enforce it server-side');
    expect(screen.getByTestId('quick-actions-role-note')).toHaveTextContent('authenticated false');
  });

  it('is unaffected by, and does not affect, the governed composed blocks', async () => {
    globalThis.fetch = urlAwareMock({ notifications: 'fail', watchlists: 'fail', universe: 'fail' });
    renderDash(VIEWER_SESSION);
    await screen.findByTestId('decision-list');

    expect(screen.getByTestId('quick-action-decision-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-role-note')).toHaveTextContent('authenticated true');
    await screen.findByTestId('alerts-unavailable');
    await screen.findByTestId('watchlist-highlights-unavailable');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
    expect(screen.getAllByTestId('evidence-card').length).toBe(2);
  });
});
