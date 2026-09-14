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

  it('renders MATCH equivalence when byte-identical', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(true)} />);
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('MATCH — byte-identical');
  });

  it('renders DIFFERENCE equivalence when not byte-identical', () => {
    render(<CompanyTrustChain evidence={EVIDENCE} replay={replayData(false)} />);
    expect(screen.getByTestId('company-replay-equivalence')).toHaveTextContent('DIFFERENCE');
  });
});
