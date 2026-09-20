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
import type { ExecutiveData } from '../../api/executive';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import type { DecisionMatrixData } from '../../api/decisionMatrix';

/** TGT-12/TGT-13 — the dashboard now composes Links, so the surface renders inside a Router. */
function renderDash() {
  return render(
    <MemoryRouter>
      <ExecutiveDashboard />
    </MemoryRouter>,
  );
}

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

function urlAwareMock(opts: {
  replayBIdentical?: boolean;
  evidenceFails?: boolean;
  /** TGT-04: omitted → 404 (preserves every pre-Phase-2 test unchanged). */
  universe?: DecisionMatrixData | 'fail' | 'degraded' | 'malformed';
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
