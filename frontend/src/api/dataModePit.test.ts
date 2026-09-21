/**
 * D-PIT-WIRE-01 — client-side discriminant tests for the governed PIT vintage family.
 *
 * The D86 lesson generalised: NO consumer may assume a non-null response has the SNAPSHOT
 * shape. isPitVintage() narrows on the dataAvailable:true + dataMode:'PIT' + vintage.found
 * discriminant; isDegraded() keeps narrowing the degraded family; they NEVER overlap.
 */
import { describe, it, expect } from 'vitest';
import { isDegraded, isPitVintage, type PitVintageData } from './dataMode';

const vintage: PitVintageData = {
  surface: 'Company',
  dataMode: 'PIT',
  dataAvailable: true,
  query: { asOf: '2024-07-08T15:30:00.000Z', domain: 'D02', securityId: 'RELIANCE' },
  vintage: {
    found: true,
    requestedAsOf: '2024-07-08T15:30:00.000Z',
    resolvedAsOf: '2024-07-08T09:15:00.000Z',
    asOf: '2024-07-08T09:15:00.000Z',
    snapshotId: 'data-NSE_D114-d114-dualera-v1-2024-07-08T09:15:00.000Z',
    provider: 'NSE_D114',
    dataVersion: 'd114-dualera-v1',
    quality: 'good',
    era: 'CM_UDIFF',
    pitBoundary: '2024-07-08T15:30:00.000Z',
    record: { symbol: 'RELIANCE', close: 2951.2, volume: 4398120 },
  },
  provenance: {
    dataSource: 'NSE historical archives via governed D114 dual-era ingestion',
    freshness: 'PIT',
    mode: 'PIT',
    archiveRef: 'fixtures://pit/udiff-fixture.csv',
    sha256: 'ab'.repeat(32),
    sha256ManifestEntry: null,
    acquisitionManifestId: null,
    intakeLineageDigest: null,
    failureRegisterRef: null,
    corpusId: 'pit-fixture-corpus-v1',
    certification: 'NONE — application verification only',
    transportSemantics: 'Resolved vintage satisfies resolved asOf <= requested asOf.',
  },
};

describe('D-PIT-WIRE-01 — isPitVintage narrowing', () => {
  it('accepts the governed PIT vintage family', () => {
    expect(isPitVintage(vintage)).toBe(true);
  });

  it('never accepts the degraded family, SNAPSHOT data, or junk', () => {
    expect(isPitVintage(null)).toBe(false);
    expect(isPitVintage(undefined)).toBe(false);
    expect(isPitVintage({})).toBe(false);
    expect(isPitVintage({ dataAvailable: true })).toBe(false); // missing mode/vintage
    expect(isPitVintage({ dataAvailable: true, dataMode: 'PIT' })).toBe(false); // missing vintage
    // a certified SNAPSHOT payload has no dataAvailable discriminant at all
    expect(isPitVintage({ surface: 'Company', sector: 'Banking', decision: {} })).toBe(false);
  });

  it('the two families are mutually exclusive', () => {
    expect(isDegraded(vintage)).toBe(false);
    const degraded = { surface: 'Company', dataMode: 'PIT', state: 'PIT_UNAVAILABLE', dataAvailable: false as const };
    expect(isPitVintage(degraded)).toBe(false);
    expect(isDegraded(degraded)).toBe(true);
  });
});
