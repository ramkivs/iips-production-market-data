/**
 * Program v3.0 — Phase 11: Replay Explorer tests (isolated fixtures, not bundled).
 * Verifies governed ReplayResult display only — no invented diff.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReplayExplorer } from './ReplayExplorer';
import type { ReplayData } from '../../api/replay';

const FIXTURE: ReplayData = {
  original: {
    snapshotId: 'snap_Tech', engineId: 'sector.technology', schemaVersion: 'snapshot-1.0',
    calibrationVersion: '1.0.0', generatedAt: '2026-08-09T00:00:00.000Z',
    verdict: 'Buy', composite: 76.3, confidence: 0.8,
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-Technology', snapshotId: 'snap_Tech' },
  },
  replay: { snapshotId: 'snap_Tech', reproduced: true, byteIdentical: true, evidenceRefs: ['ev_Tech'] },
  differenceAvailable: false,
  note: 'No field-level difference is computed or displayed.',
  evidenceRefs: ['ev_Tech'],
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

function renderReplay(id = 'Technology') {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as never;
  return render(
    <MemoryRouter initialEntries={[`/evidence/replay/${id}`]}>
      <Routes><Route path="/evidence/replay/:id" element={<ReplayExplorer />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Replay Explorer', () => {
  it('shows the original certified result', async () => {
    renderReplay();
    expect(await screen.findByTestId('replay-original')).toBeInTheDocument();
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('replay-original')).toHaveTextContent('76.3');
  });

  it('shows replay MATCH from governed ReplayResult', async () => {
    renderReplay();
    expect(await screen.findByTestId('replay-summary')).toHaveTextContent('MATCH');
  });

  it('shows equivalence status and does NOT invent a diff', async () => {
    renderReplay();
    expect(await screen.findByTestId('replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
    // No fabricated metric-level change claim.
    expect(screen.queryByText(/changed by/)).not.toBeInTheDocument();
  });

  it('shows evidence references and provenance', async () => {
    renderReplay();
    expect(await screen.findByTestId('replay-evidence-refs')).toHaveTextContent('ev_Tech');
    expect(screen.getByTestId('provenance-chain')).toBeInTheDocument();
  });

  it('links back to evidence and company context', async () => {
    renderReplay();
    expect(await screen.findByRole('link', { name: /Back to Evidence/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Company context/ })).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down')) as never;
    render(<MemoryRouter initialEntries={['/evidence/replay/X']}><Routes><Route path="/evidence/replay/:id" element={<ReplayExplorer />} /></Routes></MemoryRouter>);
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load replay');
  });
});
