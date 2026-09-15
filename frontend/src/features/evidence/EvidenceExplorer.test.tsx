/**
 * Program v3.0 — Phase 10: Evidence Explorer tests (isolated fixtures, not bundled).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EvidenceExplorer } from './EvidenceExplorer';
import type { EvidenceData } from '../../api/evidence';

const FIXTURE: EvidenceData = {
  decision: { verdict: 'Buy', composite: 76.3, confidence: 0.8 },
  evidence: {
    evidenceId: 'ev_Tech', engineId: 'sector.technology', recommendation: 'Buy', compositeScore: 76.3, confidence: 0.8,
    keyMetrics: [{ id: 'growth', name: 'growth', value: 22 }],
    supportingScores: [{ id: 'quality', name: 'quality', value: 85.5 }, { id: 'growth', name: 'growth', value: 75 }],
    calibrationVersion: '1.0.0', decisionRulesApplied: [],
    replayReference: 'snap_Tech',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-Technology', snapshotId: 'snap_Tech' },
    generatedAt: '2026-08-09T00:00:00.000Z',
  },
  snapshot: { snapshotId: 'snap_Tech', engineId: 'sector.technology', schemaVersion: 'snapshot-1.0', generatedAt: '2026-08-09T00:00:00.000Z', verdict: 'Buy', scores: { quality: 85.5 } },
  replay: { snapshotId: 'snap_Tech', reproduced: true, byteIdentical: true, evidenceRefs: ['ev_Tech'] },
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

function renderEvidence(id = 'Technology') {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as never;
  return render(
    <MemoryRouter initialEntries={[`/evidence/${id}`]}>
      <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Evidence Explorer', () => {
  it('shows the certified decision summary', async () => {
    renderEvidence();
    expect((await screen.findAllByTestId('decision-badge-Buy')).length).toBeGreaterThan(0);
    expect(screen.getByText('Composite: 76.3')).toBeInTheDocument();
  });

  it('renders the evidence record card', async () => {
    renderEvidence();
    expect(await screen.findByTestId('evidence-record-card')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-record-card')).toHaveTextContent('ev_Tech');
  });

  it('N+20: renders Confidence unavailable when evidence confidence is null (never fabricated)', async () => {
    const nullConfidence: EvidenceData = {
      ...FIXTURE,
      decision: { ...FIXTURE.decision, confidence: null },
      evidence: { ...FIXTURE.evidence, confidence: null },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => nullConfidence }) as never;
    render(
      <MemoryRouter initialEntries={['/evidence/Technology']}>
        <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
      </MemoryRouter>,
    );
    const card = await screen.findByTestId('evidence-record-card');
    expect(card).toHaveTextContent('Confidence unavailable');
    expect(card).not.toHaveTextContent('80%');
  });

  it('renders the evidence chain timeline (inspection)', async () => {
    renderEvidence();
    expect(await screen.findByTestId('evidence-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('provenance-chain')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-metadata-panel')).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ *
   * AD-17 L-1 SAFETY AMENDMENT (bounded, Program Authority authorized).  *
   *                                                                      *
   * The prior assertion required the replay summary to contain "MATCH",  *
   * which encoded a PROHIBITED verified-byte-identity claim. AD-17/M-2   *
   * are UNRESOLVED: ReplayService returns these values as LITERALS. The  *
   * assertions below PROVE THE PROHIBITED PRESENTATION IS ABSENT — they  *
   * do not merely omit it. They verify no replay verification.           *
   * ------------------------------------------------------------------ */

  it('shows the replay summary with reported literals, not a verification verdict', async () => {
    renderEvidence();
    const summary = await screen.findByTestId('replay-summary');
    // The testid hook is preserved for existing consumers.
    expect(summary).toBeInTheDocument();
    // Literals remain visible…
    expect(screen.getByTestId('replay-literal-byteIdentical')).toBeInTheDocument();
    expect(screen.getByTestId('replay-literal-reproduced')).toBeInTheDocument();
    // …explicitly marked unverified.
    expect(summary).toHaveTextContent('NOT VERIFIED');
  });

  it('AD-17: replay summary NEVER renders a MATCH/DIFFERENCE verification verdict', async () => {
    renderEvidence();
    const summary = await screen.findByTestId('replay-summary');
    const text = summary.textContent ?? '';
    expect(text).not.toMatch(/\bMATCH\b/);
    expect(text).not.toMatch(/\bDIFFERENCE\b/);
  });

  it('AD-17: replay summary uses no pass/fail status colour for byte identity', async () => {
    renderEvidence();
    const summary = await screen.findByTestId('replay-summary');
    const coloured = [summary, ...Array.from(summary.querySelectorAll('*'))].filter((el) => {
      const s = el.getAttribute('style') ?? '';
      return s.includes('--color-status-positive') || s.includes('--color-status-negative');
    });
    expect(coloured).toHaveLength(0);
  });

  it('AD-17: replay summary carries the AD-17/M-2 UNRESOLVED disclosure', async () => {
    renderEvidence();
    const summary = await screen.findByTestId('replay-summary');
    expect(summary).toHaveTextContent('AD-17 / M-2 — UNRESOLVED');
    expect(summary).toHaveTextContent('have not been verified');
  });

  it('links to the full replay explorer', async () => {
    renderEvidence();
    expect(await screen.findByRole('link', { name: /Open full replay explorer/ })).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    render(<MemoryRouter initialEntries={['/evidence/X']}><Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes></MemoryRouter>);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load evidence');
  });
});

describe('Evidence Explorer — D96 data-mode degraded state handling', () => {
  const degradedLive = {
    surface: 'Evidence',
    dataMode: 'LIVE',
    state: 'LIVE_UNAVAILABLE',
    dataAvailable: false,
    reason: 'LIVE data is UNAVAILABLE for Evidence.',
    dependency: 'R-2 provider ingestion.',
    provenance: {
      dataSource: 'none',
      freshness: 'UNAVAILABLE',
      mode: 'LIVE',
      transportSemantics: 'This response deliberately contains NO market data.',
    },
  };

  const degradedPit = {
    surface: 'Evidence',
    dataMode: 'PIT',
    state: 'PIT_UNAVAILABLE',
    dataAvailable: false,
    reason: 'PIT data is UNAVAILABLE for Evidence.',
    dependency: 'PIT capability in p08 not wired.',
    provenance: {
      dataSource: 'none',
      freshness: 'UNAVAILABLE',
      mode: 'PIT',
      transportSemantics: 'This response deliberately contains NO market data.',
    },
  };

  it('LIVE_UNAVAILABLE does not crash and renders governed DataModeUnavailable UI', async () => {
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/evidence/')) {
        return Promise.resolve({ ok: true, json: async () => degradedLive }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    render(
      <MemoryRouter initialEntries={['/evidence/Technology']}>
        <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('LIVE');
    expect(screen.queryByTestId('evidence-timeline')).not.toBeInTheDocument();
  });

  it('PIT_UNAVAILABLE does not crash and renders governed DataModeUnavailable UI', async () => {
    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/evidence/')) {
        return Promise.resolve({ ok: true, json: async () => degradedPit }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    render(
      <MemoryRouter initialEntries={['/evidence/Technology']}>
        <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('PIT');
    expect(screen.queryByTestId('evidence-timeline')).not.toBeInTheDocument();
  });

  it('successful-only fields are never accessed for degraded payloads', async () => {
    const trapped = {
      ...degradedLive,
      get decision() { throw new Error('Attempted to access data.decision on degraded payload!'); },
      get evidence() { throw new Error('Attempted to access data.evidence on degraded payload!'); },
      get snapshot() { throw new Error('Attempted to access data.snapshot on degraded payload!'); },
      get replay() { throw new Error('Attempted to access data.replay on degraded payload!'); },
    };

    globalThis.fetch = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/evidence/')) {
        return Promise.resolve({ ok: true, json: async () => trapped }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    });

    expect(() => render(
      <MemoryRouter initialEntries={['/evidence/Technology']}>
        <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
      </MemoryRouter>,
    )).not.toThrow();
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
  });

  it('no silent SNAPSHOT fallback occurs when degraded payload is returned', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => degradedLive }) as never;
    render(
      <MemoryRouter initialEntries={['/evidence/Technology']}>
        <Routes><Route path="/evidence/:id" element={<EvidenceExplorer />} /></Routes>
      </MemoryRouter>,
    );
    await screen.findByTestId('data-mode-unavailable');
    expect(screen.queryByTestId('badge-certified')).not.toBeInTheDocument();
  });
});
