/**
 * Program v3.0 — N+8: Portfolio Workspace tests (holding-level governed trust chain).
 * URL-aware three-endpoint mocks; verifies selection, exact sector propagation, inline
 * governed Evidence + Replay (MATCH/DIFFERENCE), loading/error/no-fabrication behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioWorkspace } from './PortfolioWorkspace';
import type { PortfolioData } from '../../api/portfolio';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';

const FIXTURE: PortfolioData = {
  portfolio: { portfolioId: 'PF-T', scenario: 'Balanced', holdings: 2, sectorExposure: { A: 60, B: 40 }, concentration: 60, diversificationScore: 100, avgConviction: 65, avgQuality: 70, avgRisk: 45 },
  diversification: { band: 'Good', flags: ['diversified'] },
  allocation: { strategy: 'Balanced', recommendation: 'Maintain diversification', rulesApplied: ['2-diversification'] },
  holdings: [
    { companyId: 'A-H1', sector: 'A', decision: 'Buy', composite: 80, confidence: 0.8, quality: 75, risk: 30, weight: 60 },
    { companyId: 'B-H1', sector: 'B', decision: 'Hold', composite: 50, confidence: 0.7, quality: 60, risk: 50, weight: 40 },
  ],
  opportunity: [{ companyId: 'A-H1', sector: 'A', conviction: 80 }],
  correlation: { flags: ['low correlation'], concentrationSectors: [] },
  evidenceRefs: [{ evidenceId: 'ev_A', engineId: 'sector.a', recommendation: 'Buy', compositeScore: 80 }],
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
      generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', composite: 80, confidence: 0.8,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: `snap_${sector}` },
    },
    replay: { snapshotId: `snap_${sector}`, reproduced: true, byteIdentical, evidenceRefs: [`ev_${sector}`] },
    differenceAvailable: false,
    note: byteIdentical ? 'Replay reproduced successfully; byte-identical: MATCH' : 'Replay reproduced; outputs differ',
    evidenceRefs: [`ev_${sector}`],
    provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

type FetchMock = ReturnType<typeof vi.fn>;

function urlAwareMock(opts: { evidenceA?: boolean; evidenceFails?: boolean } = {}): FetchMock {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/portfolio')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
    if (url.includes('/api/evidence/')) {
      if (opts.evidenceFails) return Promise.reject(new Error('evidence down')) as never;
      const sector = url.includes('/api/evidence/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'A' ? 80 : 50) }) as never;
    }
    if (url.includes('/api/replay/')) {
      const sector = url.includes('/api/replay/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => replayFor(sector, opts.evidenceA === undefined || opts.evidenceA) }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

beforeEach(() => {
  globalThis.fetch = vi.fn() as never;
});

describe('Portfolio Workspace (existing behavior)', () => {
  it('renders portfolio overview from certified data', async () => {
    globalThis.fetch = urlAwareMock();
    render(<PortfolioWorkspace />);
    expect(await screen.findByTestId('metric-group')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('renders holdings with certified decisions', async () => {
    globalThis.fetch = urlAwareMock();
    render(<PortfolioWorkspace />);
    expect(await screen.findByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });

  it('renders evidence entry points', async () => {
    globalThis.fetch = urlAwareMock();
    render(<PortfolioWorkspace />);
    expect(await screen.findByTestId('portfolio-evidence')).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    render(<PortfolioWorkspace />);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load certified portfolio data');
  });
});

describe('Portfolio Workspace — N+21 confidence null-honesty', () => {
  it('renders unavailable for null confidence and never fabricates a percentage', async () => {
    const nullConfidence: PortfolioData = {
      ...FIXTURE,
      holdings: [
        { companyId: 'A-H1', sector: 'A', decision: 'Buy', composite: 65, confidence: null, quality: 75, risk: 30, weight: 60 },
        { companyId: 'B-H1', sector: 'B', decision: 'Hold', composite: 50, confidence: 0.73, quality: 60, risk: 50, weight: 40 },
      ],
    };
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/portfolio')) return Promise.resolve({ ok: true, json: async () => nullConfidence }) as never;
      if (url.includes('/api/evidence/')) return Promise.resolve({ ok: true, json: async () => evidenceFor('A', 65) }) as never;
      if (url.includes('/api/replay/')) return Promise.resolve({ ok: true, json: async () => replayFor('A', true) }) as never;
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    }) as never;

    render(<PortfolioWorkspace />);
    const table = await screen.findByTestId('data-table');
    // Null confidence renders honestly as "unavailable" (never Math.round(null * 100)).
    expect(within(table).getByText('unavailable')).toBeInTheDocument();
    // Real numeric confidence still renders (0.73 → 73).
    expect(within(table).getByText('73')).toBeInTheDocument();
    // No fabricated percentage for the null-confidence sector.
    expect(within(table).queryByText('80')).not.toBeInTheDocument();
  });
});

describe('Portfolio Workspace — N+8 holding trust chain', () => {
  it('selects a holding and renders the inline governed trust chain', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    render(<PortfolioWorkspace />);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));

    expect(await screen.findByTestId('portfolio-trust-chain')).toBeInTheDocument();
    expect(screen.getByText('Holding Trust Chain — A')).toBeInTheDocument();
    // Inline governed Evidence + Replay from the shared CompanyTrustChain.
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
  });

  it('propagates the selected holding\'s ACTUAL sector to evidence + replay (exact URLs)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    render(<PortfolioWorkspace />);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('portfolio-trust-chain');

    expect(calls).toContain('/api/evidence/B');
    expect(calls).toContain('/api/replay/B');
    expect(calls.some((u) => u.includes('/api/evidence/A'))).toBe(false);
    expect(calls.some((u) => u.includes('/api/replay/A'))).toBe(false);
  });

  it('renders DIFFERENCE when the governed replay is not byte-identical', async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/portfolio')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
      if (url.includes('/api/evidence/')) return Promise.resolve({ ok: true, json: async () => evidenceFor('B', 50) }) as never;
      if (url.includes('/api/replay/')) return Promise.resolve({ ok: true, json: async () => replayFor('B', false) }) as never;
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    }) as never;

    render(<PortfolioWorkspace />);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-B'));
    expect(await screen.findByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });

  it('shows a governed error state when the holding evidence fetch fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/portfolio')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
      return Promise.reject(new Error('evidence down')) as never;
    }) as never;

    render(<PortfolioWorkspace />);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load holding evidence');
  });

  it('toggles the trust chain closed when the same holding is clicked again', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<PortfolioWorkspace />);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));
    await screen.findByTestId('portfolio-trust-chain');
    await user.click(screen.getByTestId('inspect-A'));
    expect(screen.queryByTestId('portfolio-trust-chain')).not.toBeInTheDocument();
  });
});
