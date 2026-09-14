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

  it('shows replay summary MATCH (certified replay equivalence)', async () => {
    renderEvidence();
    expect(await screen.findByTestId('replay-summary')).toHaveTextContent('MATCH');
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
