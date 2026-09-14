/**
 * Program v3.0 — N+11: Cross-Sector Intelligence tests (selected-sector governed trust chain).
 * URL-aware three-endpoint mocks; preserves the Phase-8 tests; adds selection → inline governed
 * Evidence + Replay (MATCH/DIFFERENCE), exact sector propagation, loading/error/no-fabrication/
 * toggle behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CrossSectorIntelligence } from './CrossSectorIntelligence';
import type { CrossSectorData } from '../../api/crossSector';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';

const FIXTURE: CrossSectorData = {
  portfolio: { portfolioId: 'PF-T', scenario: 'Balanced', holdings: 2, avgConviction: 65, avgQuality: 70, avgRisk: 45, concentration: 60, diversificationScore: 100 },
  diversification: { band: 'Good', flags: ['diversified'] },
  ranking: [{ companyId: 'A-H1', sector: 'A', conviction: 80 }, { companyId: 'B-H1', sector: 'B', conviction: 50 }],
  opportunity: [{ companyId: 'A-H1', sector: 'A', conviction: 80 }],
  correlation: { flags: ['low correlation'], concentrationSectors: [] },
  decisions: [{ sector: 'A', verdict: 'Buy', composite: 80, confidence: 0.8 }, { sector: 'B', verdict: 'Hold', composite: 50, confidence: 0.7 }],
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

function urlAwareMock(opts: { replayBIdentical?: boolean; evidenceFails?: boolean } = {}) {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/cross-sector')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
    if (url.includes('/api/evidence/')) {
      if (opts.evidenceFails) return Promise.reject(new Error('evidence down')) as never;
      const sector = url.includes('/api/evidence/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'A' ? 80 : 50) }) as never;
    }
    if (url.includes('/api/replay/')) {
      const sector = url.includes('/api/replay/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => replayFor(sector, sector === 'A' ? true : (opts.replayBIdentical ?? true)) }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

beforeEach(() => {
  globalThis.fetch = vi.fn() as never;
});

describe('Cross-Sector Intelligence (Phase 8 preserved behavior)', () => {
  it('renders universe overview from certified CSIP data', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    expect(await screen.findByTestId('metric-group')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('renders the certified sector ranking table', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    expect(await screen.findByTestId('data-table')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'A' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'B' }).length).toBeGreaterThan(0);
  });

  it('renders decision distribution from certified decisions', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    expect(await screen.findByTestId('decision-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Hold')).toHaveTextContent('Hold');
  });

  it('renders opportunities and risk flags', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    expect(await screen.findByTestId('cross-sector-opportunities')).toBeInTheDocument();
    expect(screen.getByTestId('cross-sector-risks')).toHaveTextContent('low correlation');
  });

  it('supports presentational ranking sort', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByRole('button', { name: 'Sort by sector' }));
    expect(screen.getAllByRole('link', { name: 'A' }).length).toBeGreaterThan(0);
  });

  it('renders error state on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load cross-sector data');
  });
});

describe('Cross-Sector Intelligence — N+11 selected-sector trust chain', () => {
  it('selects a sector and renders the inline governed trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));

    expect(await screen.findByTestId('cross-sector-trust-chain')).toBeInTheDocument();
    expect(screen.getByText('Trust Chain — A')).toBeInTheDocument();
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
  });

  it('propagates the selected sector to evidence + replay (exact URLs)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('cross-sector-trust-chain');

    expect(calls).toContain('/api/evidence/B');
    expect(calls).toContain('/api/replay/B');
    expect(calls.some((u) => u.includes('/api/evidence/A'))).toBe(false);
    expect(calls.some((u) => u.includes('/api/replay/A'))).toBe(false);
  });

  it('renders DIFFERENCE when the governed replay is not byte-identical', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-B'));
    expect(await screen.findByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });

  it('shows a governed error state when the selected evidence fetch fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ evidenceFails: true });
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load sector evidence');
  });

  it('toggles the trust chain closed when the same sector is clicked again', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-A'));
    await screen.findByTestId('cross-sector-trust-chain');
    await user.click(screen.getByTestId('inspect-A'));
    expect(screen.queryByTestId('cross-sector-trust-chain')).not.toBeInTheDocument();
  });

  it('does not fabricate: existing CSIP content remains alongside the trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><CrossSectorIntelligence /></MemoryRouter>);
    await screen.findByTestId('data-table');
    await user.click(screen.getByTestId('inspect-B'));
    await screen.findByTestId('cross-sector-trust-chain');
    expect(screen.getByTestId('decision-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('cross-sector-opportunities')).toBeInTheDocument();
  });
});
