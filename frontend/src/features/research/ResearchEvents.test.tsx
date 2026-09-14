/**
 * Program v3.0 — P-4: Research Events tests (composition-only read surface).
 *
 * Verifies the accepted spec (S1–S10): the four platform-derived events render from the TWO
 * governed endpoints (evidence + replay); the sector selector is sourced ONLY from
 * /api/decision-matrix; fixed lifecycle ordering is preserved (not timestamp-sorted);
 * identical timestamps are NOT merged; no temporal timeline is implied; null/partial data
 * stay honest ("unavailable", never fabricated); provenance + source annotations are
 * visible; Sector and Company links work; external events are absent; and
 * /research/events/:sector renders ResearchEvents instead of the FeaturePlaceholder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ResearchEvents } from './ResearchEvents';
import { App } from '../../app/App';
import { SessionProvider } from '../../core/session/SessionContext';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';
import type { DecisionMatrixData } from '../../api/decisionMatrix';
import type { ExecutiveProvenance } from '../../api/executive';

const PROVENANCE: ExecutiveProvenance = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-09T00:00:00.000Z', transportSemantics: '1:1',
};

const EVIDENCE: EvidenceData = {
  decision: { verdict: 'Watch', composite: 47.1, confidence: null },
  evidence: {
    evidenceId: 'ev-Banking',
    engineId: 'sector.banking',
    recommendation: 'Watch',
    compositeScore: 47.1,
    confidence: null,
    keyMetrics: [{ id: 'netInterestMargin', name: 'Net Interest Margin', value: 3.1 }],
    supportingScores: [{ id: 'quality', name: 'Certified Quality', value: 52 }],
    calibrationVersion: '1.0.0',
    decisionRulesApplied: ['valuation-cap'],
    replayReference: 'snap-Banking',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap-Banking' },
    generatedAt: '2026-08-09T00:00:00.000Z',
  },
  snapshot: { snapshotId: 'snap-Banking', engineId: 'sector.banking', schemaVersion: 'snapshot-1.0', generatedAt: '2026-08-09T00:00:00.000Z', verdict: 'Watch', scores: { quality: 52 } },
  replay: { snapshotId: 'snap-Banking', reproduced: true, byteIdentical: true, evidenceRefs: ['ev-Banking'] },
  provenance: PROVENANCE,
};

const REPLAY: ReplayData = {
  original: {
    snapshotId: 'snap-Banking',
    engineId: 'sector.banking',
    schemaVersion: 'snapshot-1.0',
    calibrationVersion: '1.0.0',
    generatedAt: '2026-08-09T00:00:00.000Z',
    verdict: 'Watch',
    composite: 47.1,
    confidence: null,
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap-Banking' },
  },
  replay: { snapshotId: 'snap-Banking', reproduced: true, byteIdentical: true, evidenceRefs: ['ev-Banking'] },
  differenceAvailable: false,
  note: 'test',
  evidenceRefs: ['ev-Banking'],
  provenance: PROVENANCE,
};

const DIRECTORY: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 52, valuation: 47 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 2 },
  provenance: PROVENANCE,
};

interface MockOptions {
  failEvidence?: boolean;
  failReplay?: boolean;
  evidence?: EvidenceData;
  replay?: ReplayData;
  matrix?: DecisionMatrixData;
}

function urlAwareMock(opts: MockOptions = {}): ReturnType<typeof vi.fn> {
  const evidence = opts.evidence ?? EVIDENCE;
  const replay = opts.replay ?? REPLAY;
  const matrix = opts.matrix ?? DIRECTORY;
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/evidence/')) {
      if (opts.failEvidence) return Promise.reject(new Error('evidence down')) as never;
      return Promise.resolve({ ok: true, json: async () => evidence }) as never;
    }
    if (url.includes('/api/replay/')) {
      if (opts.failReplay) return Promise.reject(new Error('replay down')) as never;
      return Promise.resolve({ ok: true, json: async () => replay }) as never;
    }
    if (url.includes('/api/decision-matrix')) {
      return Promise.resolve({ ok: true, json: async () => matrix }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

function renderEvents(path = '/research/events/Banking') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/research/events/:id" element={<ResearchEvents />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Research Events — governed lifecycle events (S2)', () => {
  it('renders the four platform-derived events from the two governed endpoints', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    expect(await screen.findByRole('heading', { name: 'Banking' })).toBeInTheDocument();
    const list = screen.getByTestId('research-events-list');
    expect(list.querySelectorAll('li[data-testid^="event-"]')).toHaveLength(4);
  });

  it('renders event labels that preserve source semantics', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByText('Calibration')).toBeInTheDocument();
    expect(screen.getByText('Snapshot generated')).toBeInTheDocument();
    expect(screen.getByText('Evidence generated')).toBeInTheDocument();
    expect(screen.getByText('Replay original generated')).toBeInTheDocument();
  });

  it('preserves exact governed timestamps verbatim', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    // All four events carry the frozen baseline date, shown verbatim.
    expect(screen.getAllByText('2026-08-09T00:00:00.000Z')).toHaveLength(4);
  });
});

describe('Research Events — ordering / timestamp honesty (S4/S8)', () => {
  it('preserves the fixed lifecycle ordering (Calibration → Snapshot → Evidence → Replay)', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    const list = screen.getByTestId('research-events-list');
    const ids = Array.from(list.querySelectorAll('li[data-testid^="event-"]')).map((el) => el.getAttribute('data-testid'));
    expect(ids).toEqual(['event-calibration', 'event-snapshot', 'event-evidence', 'event-replay']);
  });

  it('does NOT merge identical timestamps (four distinct events remain)', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('research-events-list').querySelectorAll('li')).toHaveLength(4);
  });

  it('does NOT imply a temporal timeline (lifecycle note visible)', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('events-lifecycle-note')).toHaveTextContent(/not chronological/);
  });
});

describe('Research Events — null/partial-data honesty (S7)', () => {
  it('renders unavailable for the failed source and keeps the other events', async () => {
    globalThis.fetch = urlAwareMock({ failEvidence: true });
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    // Calibration + Snapshot + Evidence come from the failed evidence endpoint → unavailable.
    expect(screen.getByTestId('event-calibration-time')).toHaveTextContent('unavailable');
    expect(screen.getByTestId('event-snapshot-time')).toHaveTextContent('unavailable');
    expect(screen.getByTestId('event-evidence-time')).toHaveTextContent('unavailable');
    // Replay comes from the healthy replay endpoint → its governed timestamp.
    expect(screen.getByTestId('event-replay-time')).toHaveTextContent('2026-08-09T00:00:00.000Z');
    expect(screen.getByTestId('events-partial-error')).toBeInTheDocument();
  });

  it('renders unavailable for a missing timestamp field (never fabricates)', async () => {
    const missing: EvidenceData = {
      ...EVIDENCE,
      snapshot: { ...EVIDENCE.snapshot, generatedAt: undefined as unknown as string },
    };
    globalThis.fetch = urlAwareMock({ evidence: missing });
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('event-snapshot-time')).toHaveTextContent('unavailable');
    expect(screen.getByTestId('event-calibration-time')).toHaveTextContent('2026-08-09T00:00:00.000Z');
  });

  it('renders the governed error state when both endpoints fail', async () => {
    globalThis.fetch = urlAwareMock({ failEvidence: true, failReplay: true });
    renderEvents('/research/events/Unknown');
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load research events');
  });
});

describe('Research Events — provenance / source (S5)', () => {
  it('shows the provenance footer and per-event source annotations', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('events-provenance')).toHaveTextContent('fixture (test-only)');
    expect(screen.getByTestId('event-calibration-source')).toHaveTextContent('provenance.calibratedAt');
    expect(screen.getByTestId('event-snapshot-source')).toHaveTextContent('snapshot.generatedAt');
    expect(screen.getByTestId('event-evidence-source')).toHaveTextContent('evidence.generatedAt');
    expect(screen.getByTestId('event-replay-source')).toHaveTextContent('original.generatedAt');
  });
});

describe('Research Events — selector + navigation (S6)', () => {
  it('sources the sector selector ONLY from /api/decision-matrix', async () => {
    const matrix: DecisionMatrixData = {
      matrixType: 'scatter', note: 'test',
      companies: [
        { companyId: 'A-H1', sector: 'Alpha', verdict: 'Buy', composite: 60, quality: 55, valuation: 50 },
        { companyId: 'B-H1', sector: 'Beta', verdict: 'Hold', composite: 40, quality: 45, valuation: 55 },
      ],
      universe: { avgConviction: 50, avgQuality: 50, holdings: 2 },
      provenance: PROVENANCE,
    };
    globalThis.fetch = urlAwareMock({ matrix });
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Alpha', 'Beta']);
  });

  it('links to Sector Information and Company for the exact sector', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.getByTestId('events-sector-link')).toHaveAttribute('href', '/research/sector/Banking');
    expect(screen.getByTestId('events-company-link')).toHaveAttribute('href', '/research/company/Banking');
  });
});

describe('Research Events — exclusions (S10)', () => {
  it('shows no external events (no earnings/conferences/filings/announcements)', async () => {
    globalThis.fetch = urlAwareMock();
    renderEvents();
    await screen.findByRole('heading', { name: 'Banking' });
    expect(screen.queryByText(/earnings|conference|filing|announcement/i)).not.toBeInTheDocument();
  });
});

describe('Research Events — route integration', () => {
  it('/research/events/:sector renders ResearchEvents instead of the FeaturePlaceholder (viewer+)', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/research/events/Banking']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'viewer', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Banking' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});
