/**
 * Program v3.0 — N+5: CompanyTrustChain tests (reusable reference pattern).
 * Verifies the component is payload-driven (sector-agnostic) and never fabricates.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyTrustChain } from './CompanyTrustChain';
import type { EvidenceData } from '../../api/evidence';
import type { ReplayData } from '../../api/replay';

const EVIDENCE: EvidenceData = {
  decision: { verdict: 'Buy', composite: 76.3, confidence: 0.8 },
  evidence: {
    evidenceId: 'ev_Banking', engineId: 'sector.banking', recommendation: 'Buy', compositeScore: 76.3,
    confidence: 0.55, keyMetrics: [],
    supportingScores: [{ id: 'asset-quality', name: 'Asset Quality', value: 62 }],
    calibrationVersion: '1.0.0', decisionRulesApplied: ['pillar-floor'], replayReference: 'snap_Banking',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap_Banking' },
    generatedAt: '2026-08-01T00:00:00.000Z',
  },
  snapshot: { snapshotId: 'snap_Banking', engineId: 'sector.banking', schemaVersion: '1.0', generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', scores: {} },
  replay: { snapshotId: 'snap_Banking', reproduced: true, byteIdentical: true, evidenceRefs: ['ev_Banking'] },
  provenance: { dataSource: 'fixture', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

function replayData(byteIdentical: boolean): ReplayData {
  return {
    original: {
      snapshotId: 'snap_Banking', engineId: 'sector.banking', schemaVersion: '1.0', calibrationVersion: '1.0.0',
      generatedAt: '2026-08-01T00:00:00.000Z', verdict: 'Buy', composite: 76.3, confidence: 0.8,
      provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: '1.0', snapshotId: 'snap_Banking' },
    },
    replay: { snapshotId: 'snap_Banking', reproduced: true, byteIdentical, evidenceRefs: ['ev_Banking'] },
    differenceAvailable: false,
    note: byteIdentical ? 'MATCH' : 'DIFFERENCE',
    evidenceRefs: ['ev_Banking'],
    provenance: { dataSource: 'fixture', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
  };
}

describe('CompanyTrustChain (reusable reference pattern)', () => {
  it('renders evidence + provenance from the governed payloads', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(true)} />);
    expect(screen.getByText('Evidence (governed)')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-record-card')).toBeInTheDocument();
    expect(screen.getByText('Asset Quality')).toBeInTheDocument();
    expect(screen.getByText('Snapshot & Provenance')).toBeInTheDocument();
  });

  /*
   * ⚠ AD-17 L-5 SAFETY AMENDMENT. Authority: D57 (commit 9316b54), Decision A.
   *
   * Two tests here PREVIOUSLY asserted the literal strings 'MATCH — byte-identical' and
   * 'DIFFERENCE'. Those assertions ENCODED the prohibited verification claim: they required
   * the UI to state that replay equivalence had been established, which it never has
   * (AD-17 / M-2, UNRESOLVED — ReplayService returns the values as literals).
   *
   * They are replaced by absence-proving tests. Assertions are scoped to the
   * `company-replay-equivalence` region, NOT to the whole component: `replay.note` is
   * free text supplied by the payload and the fixtures set it to 'MATCH'/'DIFFERENCE'.
   * A blanket document-wide search would trip on fixture note text and would tempt a
   * future maintainer to weaken the guard. The guard is scoped, not weakened.
   */
  function equivalenceRegion() {
    return screen.getByTestId('company-replay-equivalence');
  }

  it('AD-17: never renders a MATCH/DIFFERENCE replay verdict (byteIdentical=true)', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(true)} />);
    // The verdict was rendered inside <strong>; the note is a sibling <span>. Assert on
    // the verdict-bearing elements only, so payload note text cannot mask a regression.
    const strongs = Array.from(equivalenceRegion().querySelectorAll('strong')).map((e) => e.textContent ?? '');
    expect(strongs.length).toBeGreaterThan(0);
    for (const s of strongs) {
      expect(s).not.toMatch(/MATCH/);
      expect(s).not.toMatch(/\bDIFFERENCE\b/);
    }
  });

  it('AD-17: never renders a MATCH/DIFFERENCE replay verdict (byteIdentical=false)', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(false)} />);
    const strongs = Array.from(equivalenceRegion().querySelectorAll('strong')).map((e) => e.textContent ?? '');
    for (const s of strongs) {
      expect(s).not.toMatch(/MATCH/);
      expect(s).not.toMatch(/\bDIFFERENCE\b/);
    }
  });

  it('AD-17: does not colour replay equivalence as a pass/fail verification state', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(true)} />);
    const region = equivalenceRegion();
    const nodes = [region, ...Array.from(region.querySelectorAll('*'))];
    const coloured = nodes.filter((n) => {
      const s = n.getAttribute('style') ?? '';
      return s.includes('--color-status-positive') || s.includes('--color-status-negative');
    });
    expect(coloured).toHaveLength(0);
  });

  it('AD-17: reports byteIdentical as an UNVERIFIED literal with the AD-17 disclosure', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(true)} />);
    const region = equivalenceRegion();
    expect(region).toHaveTextContent('Reported byteIdentical:');
    expect(region).toHaveTextContent('NOT VERIFIED');
    const note = region.querySelector('[data-testid="ad17-disclosure"]');
    expect(note).not.toBeNull();
    expect(note?.textContent ?? '').toMatch(/AD-17 \/ M-2 — UNRESOLVED/);
    expect(note?.textContent ?? '').toMatch(/have\s+not\s+been verified/);
  });

  it('AD-17: renders the false literal without a failure verdict', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(false)} />);
    const region = equivalenceRegion();
    expect(region).toHaveTextContent('Reported byteIdentical:');
    expect(region).toHaveTextContent('false');
    expect(region).toHaveTextContent('NOT VERIFIED');
  });
});
