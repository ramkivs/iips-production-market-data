/**
 * Program v3.0 — N+9: Decision Matrix tests (selected-company governed trust chain).
 * URL-aware three-endpoint mocks; preserves the Phase-9 scatter tests; adds selection →
 * inline governed Evidence + Replay (MATCH/DIFFERENCE), exact sector propagation,
 * loading/error/no-fabrication behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DecisionMatrix } from './DecisionMatrix';
import type { DecisionMatrixData } from '../../api/decisionMatrix';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';

const FIXTURE: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'A-H1', sector: 'A', verdict: 'Buy', composite: 80, quality: 85, valuation: 60 },
    { companyId: 'B-H1', sector: 'B', verdict: 'Watch', composite: 40, quality: 30, valuation: 90 },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 2 },
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

/** G-AI-IMPL (T5/T6) — the governed advisory DTO for a host sector key. */
function aiAdvisoryFor(sector: string) {
  return {
    adviceId: 'A1B2C3D4',
    engineResultId: sector,
    kind: 'explanation',
    text: 'This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.',
    grounded: true,
    nonAuthoritative: true,
    model: 'iips-deterministic-advisor',
    modelVersion: '1.0.0',
    engineResultRef: 'SNAP_F3F53B67',
    label: 'AI EXPLANATION ≠ CERTIFIED RESULT',
    freshness: 'SNAPSHOT',
    unavailable: ['timestamp', 'tenant', 'provider', 'confidence', 'citations', 'decision'],
  };
}

function urlAwareMock(opts: { replayBIdentical?: boolean; evidenceFails?: boolean; advisoryFails?: boolean } = {}) {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/decision-matrix')) return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
    // G-AI-IMPL (T5/T6): the embedded advisory surface, bound to the authoritative selected.sector.
    if (url.includes('/api/ai-advisory/')) {
      if (opts.advisoryFails) return Promise.resolve({ ok: false, status: 503, json: async () => ({ error: 'advisory unavailable', code: 'advisory-unavailable' }) }) as never;
      const sector = decodeURIComponent(url.slice(url.indexOf('/api/ai-advisory/') + '/api/ai-advisory/'.length));
      return Promise.resolve({ ok: true, json: async () => aiAdvisoryFor(sector) }) as never;
    }
    if (url.includes('/api/evidence/')) {
      if (opts.evidenceFails) return Promise.reject(new Error('evidence down')) as never;
      const sector = url.includes('/api/evidence/B') ? 'B' : 'A';
      return Promise.resolve({ ok: true, json: async () => evidenceFor(sector, sector === 'A' ? 80 : 40) }) as never;
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

describe('Decision Matrix (Phase 9 preserved behavior)', () => {
  it('renders universe overview and certified badge', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    expect(await screen.findByTestId('metric-group')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
  });

  it('positions certified matrix points (scatter, presentational)', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    expect(await screen.findByTestId('matrix-scatter')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-point-A')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-point-B')).toBeInTheDocument();
  });

  it('shows selected-company certified detail on click', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-A'));
    expect(screen.getByTestId('matrix-selected')).toHaveTextContent('Buy');
    expect(screen.getByTestId('matrix-selected')).toHaveTextContent('Quality: 85');
    expect(screen.getByTestId('matrix-selected')).toHaveTextContent('Valuation: 60');
  });

  it('shows a hint before selection', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    expect(await screen.findByTestId('matrix-select-hint')).toHaveTextContent('Select a point');
  });

  it('does not compute quadrants/bands (note present, no classification)', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    expect(await screen.findByTestId('matrix-note')).toHaveTextContent('no classification computed');
  });

  it('renders error state on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load decision matrix');
  });

  it('A4: scatter is a group of real buttons, not a role="img" wrapper', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    const scatter = await screen.findByTestId('matrix-scatter');
    expect(scatter.getAttribute('role')).toBe('group');
    expect(scatter.getAttribute('role')).not.toBe('img');
    expect(screen.getByRole('button', { name: /A, quality 85, valuation 60/ })).toBeInTheDocument();
  });

  it('B1: matrix points use percentage positioning (responsive, no fixed-px overflow)', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    const point = screen.getByTestId('matrix-point-A');
    expect(point.style.left).toMatch(/%$/);
    expect(point.style.top).toMatch(/%$/);
  });
});

describe('Decision Matrix — N+9 selected-company trust chain', () => {
  it('selects a point and renders the inline governed trust chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-A'));

    expect(await screen.findByTestId('matrix-trust-chain')).toBeInTheDocument();
    expect(screen.getByText('Trust Chain — A')).toBeInTheDocument();
    expect(await screen.findByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByText('Replay Verification (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
  });

  it('propagates the selected company\'s ACTUAL sector to evidence + replay (exact URLs)', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const base = urlAwareMock();
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      calls.push(url);
      return base(input);
    }) as never;

    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-B'));
    await screen.findByTestId('matrix-trust-chain');

    expect(calls).toContain('/api/evidence/B');
    expect(calls).toContain('/api/replay/B');
    expect(calls.some((u) => u.includes('/api/evidence/A'))).toBe(false);
    expect(calls.some((u) => u.includes('/api/replay/A'))).toBe(false);
  });

  it('renders DIFFERENCE when the governed replay is not byte-identical', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ replayBIdentical: false });
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-B'));
    expect(await screen.findByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });

  it('shows a governed error state when the selected evidence fetch fails', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock({ evidenceFails: true });
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-A'));
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load company evidence');
  });

  it('does not fabricate: the existing certified detail panel remains unchanged alongside the chain', async () => {
    const user = userEvent.setup();
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-scatter');
    await user.click(screen.getByTestId('matrix-point-B'));
    await screen.findByTestId('matrix-trust-chain');
    // The certified scatter detail still shows the governed (unavailable-safe) values.
    expect(screen.getByTestId('matrix-selected')).toHaveTextContent('Watch');
    expect(screen.getByTestId('matrix-selected')).toHaveTextContent('Valuation: 90');
  });
});

describe('G-AI-IMPL — embedded AI explanation (T5 host binding · T6 no regression)', () => {
  it('renders the advisory bound to the authoritative selected.sector (T5)', async () => {
    globalThis.fetch = urlAwareMock();
    const user = userEvent.setup();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await user.click(await screen.findByTestId('matrix-point-A'));
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u === '/api/ai-advisory/A')).toBe(true);
  });

  it('follows the authoritative selected.sector when another point is selected (T5)', async () => {
    globalThis.fetch = urlAwareMock();
    const user = userEvent.setup();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await user.click(await screen.findByTestId('matrix-point-A'));
    await screen.findByTestId('ai-explanation');
    await user.click(await screen.findByTestId('matrix-point-B'));
    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u === '/api/ai-advisory/B')).toBe(true);
    });
  });

  it('keeps the certified matrix surface unchanged alongside the advisory (T6)', async () => {
    globalThis.fetch = urlAwareMock();
    const user = userEvent.setup();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await user.click(await screen.findByTestId('matrix-point-A'));
    expect(await screen.findByTestId('ai-explanation')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-point-A')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-point-B')).toBeInTheDocument();
    expect(screen.getByTestId('ai-explanation-label')).toHaveTextContent('AI EXPLANATION ≠ CERTIFIED RESULT');
  });

  it('renders no advisory at all until a point is selected (D2)', async () => {
    globalThis.fetch = urlAwareMock();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await screen.findByTestId('matrix-point-A');
    expect(screen.queryByTestId('ai-explanation')).toBeNull();
  });

  it('renders the canonical ErrorState on advisory failure without disturbing the matrix (T6 · S4)', async () => {
    globalThis.fetch = urlAwareMock({ advisoryFails: true });
    const user = userEvent.setup();
    render(<MemoryRouter><DecisionMatrix /></MemoryRouter>);
    await user.click(await screen.findByTestId('matrix-point-A'));
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-point-A')).toBeInTheDocument();
    expect(screen.queryByText(/supplementary advisory explanation/)).not.toBeInTheDocument();
  });
});
