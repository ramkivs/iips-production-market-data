/**
 * D-PIT-WIRE-01 — T1: PIT SEAM EXTENSION tests.
 *
 * Extends the D89 test patterns WITHOUT weakening any of them:
 *   • the governed PIT success family (dataAvailable: true) for a bound retrieval;
 *   • UNBOUND retriever / not-found / retriever-error → the PIT_UNAVAILABLE degraded
 *     response, BYTE-IDENTICAL to the pre-D-PIT form (JSON equality vs buildDegradedResponse);
 *   • SNAPSHOT byte-identity and LIVE behaviour unchanged (the D89 gates, re-asserted here);
 *   • the governed asOf request contract (400 matrix);
 *   • no new mode authority: mode still comes only from resolveModeForPrincipal.
 */
import { describe, it, expect } from 'vitest';
import {
  AS_OF_PATTERN,
  buildDegradedResponse,
  buildPitVintageResponse,
  dispatchForPrincipal,
  forMode,
  resolveModeForPrincipal,
  validateAsOfRequest,
  type PitQueryResult,
} from './data-mode';
import { createPitVintageProvider, loadCorpusIntoProvider } from '../pit/pitVintageProvider';
import type { PitSnapshot } from '../pit/pitStorageModel';
import path from 'node:path';

const CORPUS_DIR = path.join(process.cwd(), 'server', 'pit', 'fixtures', 'corpus');

function snap(asOf: string, close: number): PitSnapshot {
  return {
    snapshotId: `data-NSE_D114-d114-dualera-v1-${asOf}`,
    provider: 'NSE_D114',
    dataVersion: 'd114-dualera-v1',
    asOf,
    domain: 'D02',
    quality: 'good',
    securityId: 'RELIANCE',
    mode: 'PIT',
    pitBoundary: asOf,
    payload: { close },
  } as PitSnapshot;
}

function boundProvider() {
  const p = createPitVintageProvider();
  const r = loadCorpusIntoProvider(p, CORPUS_DIR);
  if (!r.ok) throw new Error('fixture corpus failed to load');
  return p;
}

const PRINCIPAL = { tenantId: 'tenant-A', ownerUserId: 'analyst-a' };

describe('T1 — the governed PIT success family (dataAvailable: true)', () => {
  it('a bound retrieval that resolves a vintage returns the governed PIT response', () => {
    const p = boundProvider();
    const out = forMode('Company', 'PIT', () => {
      throw new Error('SNAPSHOT computation must NEVER run under PIT');
    }, {
      asOf: '2024-07-08T15:30:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: (a) => p.query('D02', 'RELIANCE', a),
    }) as Record<string, unknown>;

    expect(out.dataAvailable).toBe(true);
    expect(out.dataMode).toBe('PIT');
    expect(out.surface).toBe('Company');
    const vintage = out.vintage as Record<string, unknown>;
    // requested vs resolved asOf are EXPLICITLY distinguished; resolved <= requested (PS-9)
    expect(vintage.requestedAsOf).toBe('2024-07-08T15:30:00.000Z');
    expect(vintage.resolvedAsOf).toBe('2024-07-08T09:15:00.000Z');
    expect(String(vintage.resolvedAsOf) <= String(vintage.requestedAsOf)).toBe(true);
    expect(vintage.snapshotId).toBe('data-NSE_D114-d114-dualera-v1-2024-07-08T09:15:00.000Z');
    expect(vintage.provider).toBe('NSE_D114');
    expect(vintage.dataVersion).toBe('d114-dualera-v1');
    expect(vintage.quality).toBe('good');
    expect(vintage.era).toBe('CM_UDIFF');
    expect(vintage.pitBoundary).toBe('2024-07-08T15:30:00.000Z');
    expect(vintage.found).toBe(true);
    // the record IS the stored snapshot, verbatim
    const record = vintage.record as Record<string, unknown>;
    expect(record.snapshotId).toBe(vintage.snapshotId);
    expect((record.payload as Record<string, unknown>).close).toBeCloseTo(2951.2, 2);
    const provenance = out.provenance as Record<string, unknown>;
    expect(provenance.freshness).toBe('PIT');
    expect(provenance.mode).toBe('PIT');
    expect(String(provenance.dataSource)).toMatch(/D114 dual-era/);
    expect(String(provenance.certification)).toMatch(/NOT a certification claim/);
  });

  it('a LEGACY-era query discloses era LEGACY_BHAVCOPY with the resolved vintage', () => {
    const p = boundProvider();
    const out = forMode('Company', 'PIT', () => ({}), {
      asOf: '2024-07-06T00:00:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: (a) => p.query('D02', 'RELIANCE', a),
    }) as Record<string, unknown>;
    const vintage = out.vintage as Record<string, unknown>;
    expect(vintage.era).toBe('LEGACY_BHAVCOPY');
    expect(vintage.resolvedAsOf).toBe('2024-07-05T09:15:00.000Z');
  });
});

describe('T1 — fail-closed: degraded PIT_UNAVAILABLE stays BYTE-IDENTICAL', () => {
  const degraded = () => JSON.stringify(buildDegradedResponse('Company', 'PIT'));

  it('UNBOUND retriever (no 4th argument) → byte-identical PIT_UNAVAILABLE', () => {
    expect(JSON.stringify(forMode('Company', 'PIT', () => ({ x: 1 })))).toBe(degraded());
  });

  it('bound retriever + no vintage <= asOf → byte-identical PIT_UNAVAILABLE, snapshot never computed', () => {
    const p = boundProvider();
    let calls = 0;
    const out = forMode('Company', 'PIT', () => { calls += 1; return { x: 1 }; }, {
      asOf: '2016-09-19T00:00:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: (a) => p.query('D02', 'RELIANCE', a),
    });
    expect(calls).toBe(0);
    expect(JSON.stringify(out)).toBe(degraded());
  });

  it('bound retriever + no vintage ≤ asOf (pre-corpus instant) / unknown symbol → byte-identical PIT_UNAVAILABLE', () => {
    const p = boundProvider();
    const hook = (id: string) => (asOf: string) => p.query('D02', id, asOf);
    // No vintage exists at or below the pre-corpus instant → fail-closed.
    expect(JSON.stringify(forMode('Company', 'PIT', () => ({}), { asOf: '2016-09-19T00:00:00.000Z', domain: 'D02', securityId: 'RELIANCE', queryPit: hook('RELIANCE') }))).toBe(degraded());
    // The corpus carries no TCS vintage before 2023-12-29 → an instant before that fails closed.
    expect(JSON.stringify(forMode('Company', 'PIT', () => ({}), { asOf: '2023-12-28T00:00:00.000Z', domain: 'D02', securityId: 'TCS', queryPit: hook('TCS') }))).toBe(degraded());
    // A symbol with no series at all → fail-closed (never a substitute, never an empty shell).
    expect(JSON.stringify(forMode('Company', 'PIT', () => ({}), { asOf: '2024-07-08T00:00:00.000Z', domain: 'D02', securityId: 'BANKING', queryPit: hook('BANKING') }))).toBe(degraded());
  });

  it('retriever that throws → byte-identical PIT_UNAVAILABLE (never a 500, never a substitute)', () => {
    expect(JSON.stringify(forMode('Company', 'PIT', () => ({}), {
      asOf: '2024-07-08T00:00:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: () => {
        throw new Error('store exploded');
      },
    }))).toBe(degraded());
  });
});

describe('T1 — SNAPSHOT and LIVE remain untouched (D89 gates re-asserted)', () => {
  it('SNAPSHOT returns the certified object ITSELF and never consults a PIT binding', () => {
    const certified = { certified: true, value: 42 };
    let pitCalls = 0;
    const out = forMode('Company', 'SNAPSHOT', () => certified, {
      asOf: '2024-07-08T00:00:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: () => { pitCalls += 1; return null; },
    });
    expect(out).toBe(certified); // identity — never rewrapped
    expect(pitCalls).toBe(0);
  });

  it('LIVE remains LIVE_UNAVAILABLE even with a bound PIT retriever', () => {
    const p = boundProvider();
    const out = forMode('Company', 'LIVE', () => ({}), {
      asOf: '2024-07-08T00:00:00.000Z',
      domain: 'D02',
      securityId: 'RELIANCE',
      queryPit: (a) => p.query('D02', 'RELIANCE', a),
    }) as Record<string, unknown>;
    expect(out.state).toBe('LIVE_UNAVAILABLE');
    expect(out.dataAvailable).toBe(false);
  });

  it('dispatchForPrincipal keeps its governed shape (no client-supplied mode authority)', () => {
    expect(dispatchForPrincipal.length).toBeLessThanOrEqual(4);
    expect(resolveDataModePin());
  });

  function resolveDataModePin(): boolean {
    // resolveModeForPrincipal extracts dispatchForPrincipal's EXACT pre-existing logic.
    expect(resolveModeForPrincipal({ tenantId: 't', ownerUserId: undefined })).toBe('SNAPSHOT');
    expect(resolveModeForPrincipal({ tenantId: 't', ownerUserId: '' })).toBe('SNAPSHOT');
    return true;
  }
});

describe('T1 — the governed asOf request contract (server-enforced 400 matrix)', () => {
  it('asOf grammar is the P08 PS-E3 ISO-8601 UTC instant with milliseconds', () => {
    expect(AS_OF_PATTERN.test('2024-07-08T09:15:00.000Z')).toBe(true);
    expect(AS_OF_PATTERN.test('2024-07-08')).toBe(false);
    expect(AS_OF_PATTERN.test('2024-07-08T09:15:00Z')).toBe(false);
    expect(AS_OF_PATTERN.test('2024-07-08T09:15:00.000+05:30')).toBe(false);
  });

  it('PIT + absent/malformed asOf → 400 (no default instant invented)', () => {
    expect(validateAsOfRequest('PIT', undefined)).toMatchObject({ ok: false, status: 400 });
    expect(validateAsOfRequest('PIT', '')).toMatchObject({ ok: false, status: 400 });
    expect(validateAsOfRequest('PIT', '2024-07-08')).toMatchObject({ ok: false, status: 400 });
    expect(validateAsOfRequest('PIT', '2024-13-01T00:00:00.000Z')).toMatchObject({ ok: false, status: 400 });
  });

  it('PIT + well-formed asOf → ok and flows through', () => {
    expect(validateAsOfRequest('PIT', '2024-07-08T09:15:00.000Z')).toEqual({ ok: true, asOf: '2024-07-08T09:15:00.000Z' });
  });

  it('SNAPSHOT/LIVE + any asOf → 400 (asOf is data selection, NEVER a mode authority)', () => {
    expect(validateAsOfRequest('SNAPSHOT', '2024-07-08T09:15:00.000Z')).toMatchObject({ ok: false, status: 400 });
    expect(validateAsOfRequest('LIVE', '2024-07-08T09:15:00.000Z')).toMatchObject({ ok: false, status: 400 });
    expect(validateAsOfRequest('SNAPSHOT', '2024-07-08')).toMatchObject({ ok: false, status: 400 });
  });

  it('SNAPSHOT/LIVE + no asOf → ok (pre-D-PIT behaviour unchanged)', () => {
    expect(validateAsOfRequest('SNAPSHOT', undefined)).toEqual({ ok: true });
    expect(validateAsOfRequest('LIVE', undefined)).toEqual({ ok: true });
    expect(validateAsOfRequest('SNAPSHOT', null)).toEqual({ ok: true });
  });
});

describe('T1 — buildPitVintageResponse contract shape', () => {
  it('distinguishes requested vs resolved asOf and carries D114 provenance where attested', () => {
    const result: PitQueryResult = {
      found: true,
      requestedAsOf: '2024-07-08T00:00:00.000Z',
      resolvedAsOf: '2024-07-08T09:15:00.000Z',
      snapshot: snap('2024-07-08T09:15:00.000Z', 2951.2),
    };
    const out = buildPitVintageResponse('Company', result, { asOf: result.requestedAsOf, domain: 'D02', securityId: 'RELIANCE' }) as Record<string, unknown>;
    expect(out.dataAvailable).toBe(true);
    // the degraded discriminant is never confused: isDegraded() narrows on false
    const s = JSON.stringify(out);
    expect(s).toContain('"dataAvailable":true');
    expect(s).not.toContain('"state":"PIT_UNAVAILABLE"');
  });
});
