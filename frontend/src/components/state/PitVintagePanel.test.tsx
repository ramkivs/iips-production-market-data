/**
 * D-PIT-WIRE-01 — PitVintagePanel rendering tests (the governed PIT UI surface).
 *
 * Proves the panel renders the SERVER's values VERBATIM — both requested AND resolved asOf
 * (backward resolution is never hidden), era, snapshotId, provenance, and the server's own
 * certification disclaimer — and never fabricates or zeroes a value.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PitVintagePanel } from './PitVintagePanel';
import type { PitVintageData } from '../../api/dataMode';

const data: PitVintageData = {
  surface: 'Company',
  dataMode: 'PIT',
  dataAvailable: true,
  query: { asOf: '2024-07-06T00:00:00.000Z', domain: 'D02', securityId: 'RELIANCE' },
  vintage: {
    found: true,
    requestedAsOf: '2024-07-06T00:00:00.000Z',
    resolvedAsOf: '2024-07-05T09:15:00.000Z',
    asOf: '2024-07-05T09:15:00.000Z',
    snapshotId: 'data-NSE_D114-d114-dualera-v1-2024-07-05T09:15:00.000Z',
    provider: 'NSE_D114',
    dataVersion: 'd114-dualera-v1',
    quality: 'good',
    era: 'LEGACY_BHAVCOPY',
    pitBoundary: '2024-07-05T15:30:00.000Z',
    record: { symbol: 'RELIANCE', close: 2931.1, volume: 4810200 },
  },
  provenance: {
    dataSource: 'NSE historical archives via governed D114 dual-era ingestion (LEGACY_BHAVCOPY 2016-09-20→2024-07-07; CM_UDIFF 2024-07-08→2026-09-18)',
    freshness: 'PIT',
    mode: 'PIT',
    archiveRef: 'fixtures://pit/legacy-fixture.csv',
    sha256: 'cd'.repeat(32),
    sha256ManifestEntry: null,
    acquisitionManifestId: null,
    intakeLineageDigest: null,
    failureRegisterRef: null,
    corpusId: 'pit-fixture-corpus-v1',
    certification: 'NONE — application verification only; NOT a certification claim',
    transportSemantics: 'Resolved vintage satisfies resolved asOf <= requested asOf. No fallback.',
  },
};

describe('D-PIT-WIRE-01 — PitVintagePanel', () => {
  it('renders requested and resolved asOf as DISTINCT, verbatim values', () => {
    render(<PitVintagePanel data={data} title="Company Intelligence" />);
    expect(screen.getByTestId('pit-vintage-requested-asof')).toHaveTextContent('2024-07-06T00:00:00.000Z');
    expect(screen.getByTestId('pit-vintage-resolved-asof')).toHaveTextContent('2024-07-05T09:15:00.000Z');
  });

  it('discloses era, snapshotId, provider, quality and the PIT boundary verbatim', () => {
    render(<PitVintagePanel data={data} title="Company Intelligence" />);
    expect(screen.getByTestId('pit-vintage-era')).toHaveTextContent('LEGACY_BHAVCOPY');
    expect(screen.getByTestId('pit-vintage-snapshot-id')).toHaveTextContent('data-NSE_D114-d114-dualera-v1-2024-07-05T09:15:00.000Z');
    expect(screen.getByTestId('pit-vintage-provider')).toHaveTextContent('NSE_D114 / d114-dualera-v1');
    expect(screen.getByTestId('pit-vintage-quality')).toHaveTextContent('good');
    expect(screen.getByTestId('pit-vintage-boundary')).toHaveTextContent('2024-07-05T15:30:00.000Z');
  });

  it('renders the historical record fields and the provenance block verbatim', () => {
    render(<PitVintagePanel data={data} title="Company Intelligence" />);
    expect(screen.getByTestId('pit-vintage-record-close')).toHaveTextContent('2931.1');
    expect(screen.getByTestId('pit-vintage-record-volume')).toHaveTextContent('4810200');
    expect(screen.getByTestId('pit-vintage-archive-ref')).toHaveTextContent('fixtures://pit/legacy-fixture.csv');
    expect(screen.getByTestId('pit-vintage-sha256')).toHaveTextContent('cd'.repeat(32));
    expect(screen.getByTestId('pit-vintage-corpus')).toHaveTextContent('pit-fixture-corpus-v1');
  });

  it('carries the server\u2019s own certification disclaimer (verification, NOT certification)', () => {
    render(<PitVintagePanel data={data} title="Company Intelligence" />);
    expect(screen.getByTestId('pit-vintage-certification')).toHaveTextContent(/NOT a certification claim/);
  });
});
