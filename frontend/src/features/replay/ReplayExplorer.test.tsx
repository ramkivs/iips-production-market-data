/**
 * Program v3.0 — Phase 11: Replay Explorer tests (isolated fixtures, not bundled).
 * Verifies governed ReplayResult display only — no invented diff.
 *
 * ⚠ P13-B-07 AD-17 SAFETY AMENDMENT (bounded, Program Authority authorized).
 *
 *   The prior assertion required the literal text "MATCH — byte-identical", which encoded
 *   a PROHIBITED verified-byte-identity claim (accepted P13 bounded condition / BS-1:
 *   "UI17 MUST NOT assert verified replay"). That expectation is replaced below by
 *   invariants that PROVE THE PROHIBITED CLAIM IS ABSENT — it is not merely un-tested.
 *
 *   ⚠ AD-17/M-2 remain UNRESOLVED. These tests assert the absence of a claim; they do not
 *   verify reproduction and do not certify UI17.
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

  it('reports the governed replay literals without asserting verification', async () => {
    renderReplay();
    const summary = await screen.findByTestId('replay-summary');
    // The literals ARE displayed (the fixture reports both as true)…
    expect(screen.getByTestId('replay-literal-reproduced')).toHaveTextContent('true');
    expect(screen.getByTestId('replay-literal-byteIdentical')).toHaveTextContent('true');
    // …explicitly marked as unverified.
    expect(summary).toHaveTextContent('NOT VERIFIED');
  });

  it('shows reported equivalence and does NOT invent a diff', async () => {
    renderReplay();
    expect(await screen.findByTestId('replay-equivalence')).toHaveTextContent('NOT VERIFIED');
    // No fabricated metric-level change claim.
    expect(screen.queryByText(/changed by/)).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ *
   * P13-B-07 — AD-17 SAFETY INVARIANTS (the prohibited claim is ABSENT) *
   * ------------------------------------------------------------------ */

  it('AD-17: NEVER renders the prohibited "MATCH — byte-identical" verified claim', async () => {
    renderReplay(); // fixture has byteIdentical: true — the worst case
    await screen.findByTestId('replay-equivalence');
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/MATCH — byte-identical/);
    expect(body).not.toMatch(/\bMATCH\b/);
  });

  it('AD-17: does NOT colour byteIdentical as a pass/fail verification state', async () => {
    renderReplay();
    const equivalence = await screen.findByTestId('replay-equivalence');
    const summary = screen.getByTestId('replay-summary');

    // Scoped to the REPLAY regions. (The unrelated composite/confidence meter elsewhere on
    // the page legitimately uses status colours for a certified score — that is not a
    // replay-equivalence signal and is out of scope for this amendment.)
    const hasStatusColour = (root: HTMLElement) =>
      [root, ...Array.from(root.querySelectorAll('*'))].some((el) => {
        const s = el.getAttribute('style') ?? '';
        return s.includes('--color-status-positive') || s.includes('--color-status-negative');
      });

    expect(hasStatusColour(equivalence)).toBe(false);
    expect(hasStatusColour(summary)).toBe(false);
  });

  it('AD-17: makes no verified-replay or reproducibility claim anywhere on the surface', async () => {
    renderReplay();
    await screen.findByTestId('replay-equivalence');
    const body = document.body.textContent ?? '';
    // Any occurrence of "verified" must be part of a NEGATION, never a positive claim.
    expect(body).not.toMatch(/\breplay verified\b/i);
    expect(body).not.toMatch(/successfully reproduced/i);
    expect(body).not.toMatch(/reproducibility confirmed/i);
    expect(body).not.toMatch(/independently verified/i);
  });

  it('AD-17: carries the explicit AD-17/M-2 UNRESOLVED disclosure', async () => {
    renderReplay();
    await screen.findByTestId('replay-equivalence');
    const notes = screen.getAllByTestId('ad17-disclosure');
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]).toHaveTextContent('AD-17 / M-2 — UNRESOLVED');
    expect(notes[0]).toHaveTextContent('have not been verified');
  });

  it('AD-17: reports byteIdentical=false as a literal, still without a pass/fail verdict', async () => {
    const negative = {
      ...FIXTURE,
      replay: { ...FIXTURE.replay, reproduced: false, byteIdentical: false },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => negative }) as never;
    render(
      <MemoryRouter initialEntries={['/evidence/replay/Technology']}>
        <Routes><Route path="/evidence/replay/:id" element={<ReplayExplorer />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('replay-literal-byteIdentical')).toHaveTextContent('false');
    // "DIFFERENCE" was the old failure verdict — equally a verification claim.
    expect(document.body.textContent ?? '').not.toMatch(/\bDIFFERENCE\b/);
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
