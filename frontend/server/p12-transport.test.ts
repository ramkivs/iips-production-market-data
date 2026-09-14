/**
 * P13-B — EVIDENCE TESTS for the P12 governed transport adapter.
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * These tests produce the evidence required by D54 for P13-B-01..-09. They assert
 * GOVERNED BEHAVIOUR (fail-closed, worst-case, deterministic, AD-17-preserving) — they do
 * not assert certification, acceptance, or production readiness.
 */
import { describe, expect, it } from 'vitest';
import {
  P12TransportError,
  P13B_BOUND_ENDPOINTS,
  TRANSPORT_DISCLOSURE,
  assertAllBoundEndpointsAdditive,
  assertTenantMayRead,
  buildGovernedEvidenceLinkage,
  buildGovernedObjectReference,
  buildGovernedReplayLinkage,
  buildP12PaginatedResponse,
  buildP12Response,
  buildRequestContext,
  deriveProvenance,
  executeGovernedScreen,
  executeGovernedSearch,
  isP12Path,
  p12SurfaceFor,
  propagateRowQuality,
  resolveGovernedObject,
  resolveTenant,
  sanitizeGoverned,
  saveGovernedScreenDefinition,
  aggregateGovernedProvenance,
  checkGovernedProviderEntitlement,
} from './p12-transport';
import {
  deriveCompleteness,
  deriveScreenerUniverse,
  deriveSearchUniverse,
  deriveSecurities,
  deriveVintage,
  mapCertifiedQuality,
  type CertifiedMatrixPayload,
} from './p12-universe';

const ASOF = '2026-08-09T00:00:00.000Z';
const TENANT = 'tenant-a';

const MATRIX: CertifiedMatrixPayload = {
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Buy', composite: 80, quality: 0.8, valuation: 0.5 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Hold', composite: 80, quality: 0.7, valuation: null },
    { companyId: 'Energy-H1', sector: 'Energy', verdict: 'Sell', composite: 40, quality: null, valuation: null },
  ],
  provenance: { dataSource: 'certified-v2.0', freshness: 'SNAPSHOT', calibratedAt: ASOF },
};

const universe = () => deriveScreenerUniverse(MATRIX, ASOF);
const vintage = () => deriveVintage(MATRIX, ASOF);

function provenanceFor(quality: string, completenessPct: number) {
  const v = vintage();
  return deriveProvenance({
    dataSource: v.dataSource, asOf: v.asOf, dataVersion: v.dataVersion, mode: v.mode,
    quality, completenessPct, contributingSnapshotIds: v.contributingSnapshotIds,
    classification: v.classification,
  });
}

/* ================= P13-B-01 — TRANSPORT ADAPTER / ADDITIVITY ================= */

describe('P13-B-01 — transport adapter & endpoint additivity', () => {
  it('every bound endpoint passes the certified additive guard (ED-1)', () => {
    expect(assertAllBoundEndpointsAdditive()).toBe(true);
  });

  it('binds exactly the four additive P12 endpoints', () => {
    expect([...P13B_BOUND_ENDPOINTS].sort()).toEqual(
      ['/api/resolve', '/api/screener/execute', '/api/screener/saved', '/api/search'],
    );
  });

  it('does NOT claim any of the 13 existing v2.0 routes', () => {
    const v2 = [
      '/api/health', '/api/executive', '/api/portfolio', '/api/decision-matrix', '/api/cross-sector',
      '/api/macro', '/api/notes', '/api/notifications', '/api/company/X', '/api/evidence/X',
      '/api/replay/X', '/api/admin/x', '/api/ai-advisory/x',
    ];
    for (const path of v2) {
      expect(isP12Path(path)).toBe(false);
      expect(p12SurfaceFor(path)).toBeNull();
    }
  });

  it('recognises only the additive P12 paths', () => {
    expect(p12SurfaceFor('/api/screener/execute')).toBe('screener');
    expect(p12SurfaceFor('/api/search?q=x')).toBe('search');
    expect(p12SurfaceFor('/api/resolve?inputType=symbol')).toBe('resolve');
  });

  it('builds a governed request context and rejects an empty tenant (ED-4)', () => {
    const ctx = buildRequestContext({ tenantId: TENANT, endpoint: '/api/search' });
    expect(ctx.tenantId).toBe(TENANT);
    expect(() => buildRequestContext({ tenantId: '', endpoint: '/api/search' })).toThrow(P12TransportError);
  });

  it('wraps responses in the governed envelope with lineage + disclosure', () => {
    const env = buildP12Response({
      data: { ok: true }, provenance: provenanceFor('good', 100), tenantId: TENANT, endpoint: '/api/search',
    });
    expect(env.apiVersion).toBe('1.0');
    expect(env.tenantId).toBe(TENANT);
    expect(env.lineage).toBe('P12-GOVERNED');
    expect(env.transportDisclosure).toEqual(TRANSPORT_DISCLOSURE);
  });

  it('supports the certified paginated envelope', () => {
    const env = buildP12PaginatedResponse({
      items: [1, 2], totalCount: 10, offset: 0, limit: 2,
      provenance: provenanceFor('good', 100), tenantId: TENANT, endpoint: '/api/search',
    }) as { pagination: { hasMore: boolean } };
    expect(env.pagination.hasMore).toBe(true);
  });

  it('refuses to emit a response with invalid provenance (fail-closed)', () => {
    expect(() => buildP12Response({
      data: {}, provenance: { quality: 'excellent' } as never, tenantId: TENANT, endpoint: '/api/search',
    })).toThrow();
  });
});

/* ================= P13-B-02 — TENANT / SECURITY (FAIL-CLOSED) ================= */

describe('P13-B-02 — tenant & security enforcement fails closed', () => {
  it('refuses when no authenticated tenant exists (401)', () => {
    expect(() => resolveTenant(null)).toThrow(P12TransportError);
    try { resolveTenant(null); } catch (e) { expect((e as P12TransportError).status).toBe(401); }
    expect(() => resolveTenant('')).toThrow(P12TransportError);
  });

  it('accepts a client tenant assertion ONLY when it matches the principal', () => {
    expect(resolveTenant(TENANT, TENANT)).toBe(TENANT);
  });

  it('refuses a mismatched client tenant assertion (403) — no widening', () => {
    try {
      resolveTenant(TENANT, 'tenant-b');
      throw new Error('expected refusal');
    } catch (e) {
      expect(e).toBeInstanceOf(P12TransportError);
      expect((e as P12TransportError).status).toBe(403);
    }
  });

  it('blocks cross-tenant reads (403)', () => {
    expect(() => assertTenantMayRead('tenant-a', 'tenant-b', '/api/search')).toThrow(P12TransportError);
    expect(() => assertTenantMayRead('tenant-a', 'tenant-a', '/api/search')).not.toThrow();
  });

  it('redacts sensitive keys before transport (ST-4)', () => {
    const out = sanitizeGoverned({ apiKey: 'secret-value', safe: 'ok' }, 'INTERNAL') as Record<string, unknown>;
    expect(out.apiKey).toBe('[REDACTED]');
    expect(out.safe).toBe('ok');
    expect(out._governanceClassification).toBe('INTERNAL');
  });

  it('rejects an unknown governance classification', () => {
    expect(() => sanitizeGoverned({}, 'TOP-SECRET')).toThrow();
  });

  it('checks provider entitlement server-side and denies by default', () => {
    const denied = checkGovernedProviderEntitlement({
      providerToken: 'p1', capability: 'read', entitlementRegister: {},
    });
    expect(denied.entitled).toBe(false);
    expect(denied.enforcementLocation).toBe('server-behind-data-plane');
  });
});

/* ================= P13-B-03 / P13-B-09 — PROVENANCE + AS-OF ================= */

describe('P13-B-03 / P13-B-09 — provenance is derived, valid, and carries as-of', () => {
  it('derives a complete, valid provenance DTO', () => {
    const p = provenanceFor('good', 100) as Record<string, unknown>;
    expect(p.asOf).toBe(ASOF);
    expect(p.mode).toBe('SNAPSHOT');
    expect(p.classification).toBe('CERTIFIED-ENGINE');
    expect(p.dataSource).toBe('governed:certified-v2.0-reference-universe');
    expect(p.contributingSnapshotIds).toEqual(['program-v1.1-replay-baseline']);
  });

  it('rejects a quality value outside the P05 closed set', () => {
    expect(() => provenanceFor('excellent', 100)).toThrow();
  });

  it('rejects an out-of-range completeness', () => {
    expect(() => provenanceFor('good', 150)).toThrow();
  });

  it('never reports the frozen baseline as LIVE', () => {
    expect(vintage().mode).toBe('SNAPSHOT');
  });

  it('aggregates several provenances to the WORST quality', () => {
    const agg = aggregateGovernedProvenance(
      [provenanceFor('good', 100), provenanceFor('partial', 60)],
      'governed:test', 'CERTIFIED-ENGINE',
    ) as Record<string, unknown>;
    expect(agg.quality).toBe('partial');
    expect(agg.completenessPct).toBe(60);
  });
});

/* ================= P13-B-04 — QUALITY / DEGRADATION ================= */

describe('P13-B-04 — worst-case quality propagation', () => {
  it('propagates the WORST row quality, never the best', () => {
    expect(propagateRowQuality([{ quality: 'good' }, { quality: 'stale' }]).quality).toBe('stale');
    expect(propagateRowQuality([{ quality: 'good' }, { quality: 'unavailable' }]).quality).toBe('unavailable');
    expect(propagateRowQuality([{ quality: 'partial' }, { quality: 'stale' }]).quality).not.toBe('good');
  });

  it('takes the WORST completeness', () => {
    expect(propagateRowQuality([
      { quality: 'good', completenessPct: 100 },
      { quality: 'good', completenessPct: 33 },
    ]).completenessPct).toBe(33);
  });

  it('treats an absent quality as unavailable — never silently good (QP-3)', () => {
    expect(propagateRowQuality([{ composite: 1 }]).quality).toBe('unavailable');
    expect(mapCertifiedQuality(null)).toBe('unavailable');
  });

  it('reports empty input as unavailable / 0% rather than good / 100%', () => {
    expect(propagateRowQuality([])).toEqual({ quality: 'unavailable', completenessPct: 0 });
  });

  it('derives completeness from the axes actually present', () => {
    expect(deriveCompleteness({ companyId: 'x', sector: 's', verdict: 'Buy', composite: 1, quality: 1, valuation: 1 })).toBe(100);
    expect(deriveCompleteness({ companyId: 'x', sector: 's', verdict: 'Buy', composite: 1, quality: null, valuation: null })).toBe(33);
  });
});

/* ================= P13-B-05 — SCREENER → C6 ================= */

describe('P13-B-05 — screener bound to the certified C6 contract', () => {
  const sort = [{ field: 'composite', direction: 'desc' }];

  it('executes a governed screen and ranks rows', () => {
    const r = executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { totalRows: number; rows: { rank: number }[] };
    expect(r.totalRows).toBe(3);
    expect(r.rows[0].rank).toBe(1);
  });

  it('is DETERMINISTIC — equal sort keys break the tie on the identity field', () => {
    // Banking-H1 and Technology-H1 both have composite 80.
    const run = () => (executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { rows: { canonicalSecurityId: string }[] }).rows.map((r) => r.canonicalSecurityId);

    const first = run();
    // Repeat with a reversed input universe — the total order must be identical.
    const reversed = (executeGovernedScreen({
      universe: [...universe()].reverse(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { rows: { canonicalSecurityId: string }[] }).rows.map((r) => r.canonicalSecurityId);

    expect(first).toEqual(reversed);
    expect(first.slice(0, 2)).toEqual(['Banking-H1', 'Technology-H1']);
  });

  it('labels degraded rows rather than hiding them', () => {
    const r = executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { rows: { canonicalSecurityId: string; _degradation: string }[] };
    const energy = r.rows.find((x) => x.canonicalSecurityId === 'Energy-H1');
    expect(energy?._degradation).toBe('degraded-unavailable');
  });

  it('propagates the WORST quality to the screen result', () => {
    const r = executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { quality: string };
    expect(r.quality).toBe('unavailable'); // Energy-H1 has no quality axis
  });

  it('applies governed filters server-side', () => {
    const r = executeGovernedScreen({
      universe: universe(), filters: [{ field: 'composite', operator: 'gte', operand: 80 }],
      sort, tieBreakField: 'canonicalSecurityId', asOf: ASOF, screenId: 's1', tenantId: TENANT,
    }) as { totalRows: number };
    expect(r.totalRows).toBe(2);
  });

  it('FAILS CLOSED on an operator outside the closed set (400)', () => {
    try {
      executeGovernedScreen({
        universe: universe(), filters: [{ field: 'composite', operator: 'regex', operand: '.*' }],
        sort, tieBreakField: 'canonicalSecurityId', asOf: ASOF, screenId: 's1', tenantId: TENANT,
      });
      throw new Error('expected refusal');
    } catch (e) {
      expect(e).toBeInstanceOf(P12TransportError);
      expect((e as P12TransportError).status).toBe(400);
    }
  });

  it('FAILS CLOSED without a tenant or an as-of (PIT required)', () => {
    expect(() => executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: ASOF, screenId: 's1', tenantId: '',
    })).toThrow(P12TransportError);
    expect(() => executeGovernedScreen({
      universe: universe(), filters: [], sort, tieBreakField: 'canonicalSecurityId',
      asOf: '', screenId: 's1', tenantId: TENANT,
    })).toThrow(P12TransportError);
  });

  it('validates a saved screen definition through the contract', () => {
    const d = saveGovernedScreenDefinition({
      screenId: 's1', filters: [], sort, tieBreakField: 'canonicalSecurityId', tenantId: TENANT,
    }) as { pitCapable: boolean; tenantId: string };
    expect(d.pitCapable).toBe(true);
    expect(d.tenantId).toBe(TENANT);
  });
});

/* ================= P13-B-06 — SEARCH / RESOLUTION → C7 ================= */

describe('P13-B-06 — search & resolution bound to the certified C7 contract', () => {
  it('resolves a known symbol', () => {
    const r = resolveGovernedObject({
      inputType: 'symbol', inputValue: 'Banking-H1', asOf: ASOF, tenantId: TENANT,
      securities: deriveSecurities(MATRIX),
    }) as { resolved: boolean; canonicalSecurityId: string };
    expect(r.resolved).toBe(true);
    expect(r.canonicalSecurityId).toBe('Banking-H1');
  });

  it('FAILS CLOSED on an unresolved identity (404) — no placeholder (OR-2)', () => {
    try {
      resolveGovernedObject({
        inputType: 'symbol', inputValue: 'DOES-NOT-EXIST', asOf: ASOF, tenantId: TENANT,
        securities: deriveSecurities(MATRIX),
      });
      throw new Error('expected refusal');
    } catch (e) {
      expect(e).toBeInstanceOf(P12TransportError);
      expect((e as P12TransportError).status).toBe(404);
      expect((e as Error).message).toMatch(/fail-closed/);
    }
  });

  it('rejects an input type outside the closed set (400)', () => {
    try {
      resolveGovernedObject({
        inputType: 'ticker', inputValue: 'X', asOf: ASOF, tenantId: TENANT, securities: deriveSecurities(MATRIX),
      });
      throw new Error('expected refusal');
    } catch (e) {
      expect((e as P12TransportError).status).toBe(400);
    }
  });

  it('searches deterministically and is stable across input order', () => {
    const objs = deriveSearchUniverse(MATRIX, ASOF);
    const run = (u: readonly unknown[]) => (executeGovernedSearch({
      universe: u as never, query: 'n', asOf: ASOF, tenantId: TENANT,
    }) as { results: { id: string }[] }).results.map((r) => r.id);
    expect(run(objs)).toEqual(run([...objs].reverse()));
  });

  it('returns no match without inventing a result', () => {
    const r = executeGovernedSearch({
      universe: deriveSearchUniverse(MATRIX, ASOF), query: 'zzzz-no-match', asOf: ASOF, tenantId: TENANT,
    }) as { totalMatches: number; results: unknown[] };
    expect(r.totalMatches).toBe(0);
    expect(r.results).toEqual([]);
  });

  it('requires a tenant for search (fail-closed)', () => {
    expect(() => executeGovernedSearch({
      universe: deriveSearchUniverse(MATRIX, ASOF), query: 'a', asOf: ASOF, tenantId: '',
    })).toThrow(P12TransportError);
  });

  it('builds governed object references and rejects unknown object types', () => {
    const ref = buildGovernedObjectReference('company', 'Banking-H1', ASOF);
    expect(ref.objectType).toBe('company');
    expect(() => buildGovernedObjectReference('spaceship', 'x', ASOF)).toThrow(P12TransportError);
  });

  it('does NOT invent external identifiers (no FIGI/ISIN fabrication)', () => {
    const secs = deriveSecurities(MATRIX) as { identifiers: Record<string, string> }[];
    for (const s of secs) expect(Object.keys(s.identifiers)).toHaveLength(0);
  });
});

/* ================= P13-B-07 — AD-17 / M-2 PRESERVATION ================= */

describe('P13-B-07 — AD-17/M-2 is PRESERVED, never repaired or claimed', () => {
  const replayArgs = {
    replayId: 'r1', originalExecutionId: 'e1', contributingSnapshotIds: ['snap_1'],
    dataVersion: 'v1.1', asOf: ASOF, mode: 'PIT',
  };

  it('carries ReplayService values as LITERALS, not verified claims', () => {
    const dto = buildGovernedReplayLinkage({
      ...replayArgs, replayServiceReproduced: true, replayServiceByteIdentical: true,
    }) as { replayServiceLiterals: { reproduced: boolean }; verifiedReproduction: boolean; verifiedByteIdentical: boolean };

    // The literal is carried…
    expect(dto.replayServiceLiterals.reproduced).toBe(true);
    // …but NO verified claim is ever made, even when the literal says true.
    expect(dto.verifiedReproduction).toBe(false);
    expect(dto.verifiedByteIdentical).toBe(false);
  });

  it('attaches the AD-17 UNRESOLVED constraint to every replay DTO', () => {
    const dto = buildGovernedReplayLinkage(replayArgs) as { ad17Constraint: { ad17Status: string } };
    expect(dto.ad17Constraint.ad17Status).toBe('UNRESOLVED');
  });

  it('the AD-17 guard REJECTS a DTO asserting verified reproduction', () => {
    const forged = { verifiedReproduction: true, verifiedByteIdentical: false };
    const { assertAd17ConstraintPreserved } = require('../../p12/src/evidenceReplayLinkage.js');
    expect(() => assertAd17ConstraintPreserved(forged)).toThrow(/AD-17/);
  });

  it('evidence linkage never claims reproducibility', () => {
    const ev = buildGovernedEvidenceLinkage({
      evidenceId: 'ev1', contributingSnapshotIds: ['s1'], provider: 'governed-internal',
      dataVersion: 'v1', asOf: ASOF, mode: 'PIT', engineId: 'e', engineVersion: '1',
    }) as { reproducibilityClaimed: boolean };
    expect(ev.reproducibilityClaimed).toBe(false);
  });
});

/* ================= P13-B-08 — DUAL-TRANSPORT DISCLOSURE ================= */

describe('P13-B-08 — dual transport is explicitly disclosed', () => {
  it('states that two transports operate and are not interchangeable', () => {
    expect(TRANSPORT_DISCLOSURE.dualTransport).toBe(true);
    expect(TRANSPORT_DISCLOSURE.statement).toMatch(/NOT interchangeable/);
    expect(TRANSPORT_DISCLOSURE.statement).toMatch(/never inferred from structural similarity/);
  });

  it('does NOT claim certification of any UI surface', () => {
    expect(TRANSPORT_DISCLOSURE.certificationNote).toMatch(/does NOT broaden C6\/C7/);
    expect(TRANSPORT_DISCLOSURE.certificationNote).toMatch(/does NOT certify any UI surface/);
  });

  it('labels the derived universe as DUAL-origin, not as P12-produced data', () => {
    // The rows come from the certified v2.0 engines; only the operations are P12-governed.
    expect(vintage().classification).toBe('CERTIFIED-ENGINE');
    expect(vintage().dataSource).toMatch(/certified-v2\.0/);
  });
});
