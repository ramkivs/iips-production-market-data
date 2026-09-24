/**
 * Test Suite: Research & Sector SNAPSHOT read authorities (Prompt 2B)
 *
 * Scope (exactly the four manifest §5.2 R-4/R-5/R-6 authorities):
 *   GET /api/company/:id      FROZEN SNAPSHOT / certified derivation
 *   GET /api/decision-matrix  FROZEN SNAPSHOT / certified derivation
 *   GET /api/evidence/:id     FIXTURE / D79 transport fixture constants
 *   GET /api/replay/:id       FIXTURE / D79 transport fixture constants
 *
 * Authority/evidence basis: `IIPS_RESEARCH_SECTOR_RECOVERY_MANIFEST.md` §3 (payload provenance),
 * §4.3 (browser boundary), §5.2 (R-4/R-5/R-6), §6 (parity evidence inventory).
 *
 * What is asserted:
 *   · every authority returns the certified 13-sector universe deterministically;
 *   · the certified-platform projection is EQUIVALENT to the frozen golden fixtures, read
 *     independently here from disk (proves the module duplicates no platform computation);
 *   · the D79 attribution strings appear VERBATIM, and no runtime-verification claim is made;
 *   · malformed / unknown / cross-authority input FAILS CLOSED with nothing synthesised;
 *   · `asOf` is refused under SNAPSHOT (never silently ignored) and there is NO PIT code path;
 *   · no provider/network access, and no node-only import reaches the browser graph.
 *
 * NOT asserted here (belongs to the surface recovery, which is NOT in this unit): Company/Sector
 * UI rendering and the 43/40-key E2E-018 visual-observable parity. No parity claim is made.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  computeCertifiedCompany,
  computeCertifiedDecisionMatrix,
  computeCertifiedEvidence,
  computeCertifiedReplay,
  handleResearchSectorRequest,
  createResearchSectorServer,
  REPLAY_PROVENANCE_DATA_SOURCE,
  EVIDENCE_PROVENANCE_DATA_SOURCE,
  ASOF_REFUSED_UNDER_SNAPSHOT,
} from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const SECTOR_DIR: Record<string, string> = {
  Banking: 'banking', Insurance: 'insurance', 'Capital Markets': 'capital-markets',
  Healthcare: 'healthcare', Hospitality: 'hospitality', Energy: 'energy',
  Utilities: 'utilities', Consumer: 'consumer', Industrials: 'industrials',
  Technology: 'technology', Telecommunications: 'telecommunications', Automobile: 'automobile',
  'Materials & Metals': 'materials-metals',
};

/** Read the frozen golden fixtures independently of the module under test. */
function goldenFixtures(): Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> {
  const out: Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> = {};
  for (const [sector, dir] of Object.entries(SECTOR_DIR)) {
    const base = resolve(ROOT, `iips-platform/src/sector-engines/${dir}`);
    const direct = resolve(base, `${dir}-expected-outputs-1.0.0.json`);
    const frozen = resolve(base, 'frozen-assets', `${dir}-expected-outputs-1.0.0.json`);
    const file = existsSync(direct) ? direct : frozen;
    const d = JSON.parse(readFileSync(file, 'utf8')) as {
      expected: Array<{ pillars?: Record<string, number>; composite?: number; compositeScore?: number; confidence?: number }>;
    };
    const first = d.expected[0]!;
    out[sector] = {
      pillars: first.pillars ?? {},
      composite: first.composite ?? first.compositeScore ?? 0,
      confidence: typeof first.confidence === 'number' ? first.confidence : null,
    };
  }
  return out;
}

const GOLDEN = goldenFixtures();
const SECTORS = Object.keys(GOLDEN);
const sha256 = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex');

/* ── Authority 1 — /api/company/:id ──────────────────────────────────────────────────────── */

describe('Read authorities — GET /api/company/:id (FROZEN SNAPSHOT)', () => {
  it('RA-01: resolves every certified sector case-insensitively and returns the certified identity', () => {
    for (const sector of SECTORS) {
      const upper = computeCertifiedCompany(sector.toUpperCase());
      const lower = computeCertifiedCompany(sector.toLowerCase());
      assert.strictEqual(upper.sector, sector, `${sector}: canonical sector name must be returned`);
      assert.strictEqual(upper.companyId, `${sector}-H1`, `${sector}: certified companyId form`);
      assert.strictEqual(sha256(upper), sha256(lower), `${sector}: id resolution must be case-insensitive`);
    }
  });

  it('RA-02: every certified figure equals the governed frozen fixture (no re-derivation)', () => {
    for (const sector of SECTORS) {
      const p = computeCertifiedCompany(sector);
      const g = GOLDEN[sector]!;
      assert.strictEqual(p.decision.composite, g.composite, `${sector}: composite must equal the fixture`);
      assert.strictEqual(p.decision.confidence, g.confidence, `${sector}: confidence must equal the fixture (null where absent)`);
      assert.ok(['Strong Buy', 'Buy', 'Accumulate', 'Watch', 'Reduce', 'Exit', ''].includes(p.decision.verdict), `${sector}: verdict must be a governed verdict`);
      // Pillar exposure mirrors the fixture exactly — null where the engine exposes none.
      if (Object.keys(g.pillars).length === 0) assert.strictEqual(p.pillars, null, `${sector}: no pillars => null, never {}`);
      else assert.deepStrictEqual(p.pillars, g.pillars, `${sector}: pillars must equal the fixture`);
      assert.strictEqual(p.provenance.freshness, 'SNAPSHOT');
      assert.strictEqual(p.provenance.calibratedAt, '2026-08-09T00:00:00.000Z');
    }
  });

  it('RA-03: payload is DETERMINISTIC across independent invocations', () => {
    for (const sector of SECTORS) {
      assert.strictEqual(sha256(computeCertifiedCompany(sector)), sha256(computeCertifiedCompany(sector)), `${sector}: must be byte-stable`);
    }
  });

  it('RA-04: provenance declares certified SNAPSHOT derivation and carries no live/provider claim', () => {
    const p = computeCertifiedCompany('Banking');
    assert.match(p.provenance.dataSource, /certified v2\.0 platform/);
    assert.match(p.provenance.dataSource, /frozen v1\.1 Replay Baseline/);
    assert.strictEqual(/LIVE|provider|feed/i.test(JSON.stringify(p.provenance)), false, 'no LIVE/provider claim may appear');
    assert.strictEqual(p.provenance.transportSemantics, '1:1 mapping; transport transformation != decision transformation');
  });

  it('RA-05: evidence reference is derived from the same certified identity', () => {
    const p = computeCertifiedCompany('Capital Markets');
    assert.strictEqual(p.evidence.evidenceId, 'ev_Capital Markets');
    assert.strictEqual(p.evidence.engineId, 'sector.capital markets');
    assert.strictEqual(p.evidence.compositeScore, p.decision.composite);
  });
});

/* ── Authority 2 — /api/decision-matrix ──────────────────────────────────────────────────── */

describe('Read authorities — GET /api/decision-matrix (FROZEN SNAPSHOT)', () => {
  const m = computeCertifiedDecisionMatrix();

  it('RA-06: returns the full certified universe in certified order', () => {
    assert.strictEqual(m.companies.length, 13, 'thirteen certified sector rows');
    assert.deepStrictEqual(m.companies.map((c) => c.sector), SECTORS, 'ordering must follow the certified baseline');
    for (const c of m.companies) assert.strictEqual(c.companyId, `${c.sector}-H1`);
  });

  it('RA-07: axes come from the certified source — quality from CSIP mapping, valuation nullable', () => {
    for (const c of m.companies) {
      const g = GOLDEN[c.sector]!;
      assert.strictEqual(c.composite, g.composite, `${c.sector}: composite must equal the fixture`);
      const expectedValuation = typeof g.pillars.valuation === 'number' ? g.pillars.valuation : null;
      assert.strictEqual(c.valuation, expectedValuation, `${c.sector}: valuation must equal the fixture or be null`);
      // quality is the governed CSIP quality mapping, never invented: present iff the fixture maps it
      if (c.quality !== null) assert.strictEqual(typeof c.quality, 'number');
    }
  });

  it('RA-08: no quadrant/band/threshold is invented, and the limitation is disclosed', () => {
    assert.strictEqual(m.matrixType, 'scatter', 'positioning only — no classification');
    assert.match(m.note, /does not expose a certified quadrant\/band classification/);
    for (const c of m.companies) {
      for (const banned of ['quadrant', 'band', 'threshold', 'classification']) {
        assert.strictEqual(banned in c, false, `row must not carry a "${banned}" field`);
      }
    }
  });

  it('RA-09: universe totals are certified CSIP outputs, and the payload is deterministic', () => {
    assert.strictEqual(typeof m.universe.avgConviction, 'number');
    assert.strictEqual(typeof m.universe.avgQuality, 'number');
    assert.strictEqual(m.universe.holdings, 13, 'certified holdings count');
    assert.strictEqual(sha256(m), sha256(computeCertifiedDecisionMatrix()), 'must be byte-stable');
    assert.strictEqual(m.provenance.freshness, 'SNAPSHOT');
  });
});

/* ── Authority 3/4 — evidence + replay ──────────────────────────────────────────────────── */

describe('Read authorities — evidence & replay (FIXTURE, D79 attribution)', () => {
  it('RA-10: evidence carries the D79 attribution VERBATIM and claims no runtime verification', () => {
    const p = computeCertifiedEvidence('Banking');
    assert.strictEqual(p.provenance.dataSource, EVIDENCE_PROVENANCE_DATA_SOURCE);
    assert.match(p.provenance.dataSource, /transport fixture constants/);
    assert.match(p.provenance.dataSource, /NOT produced by a runtime replay or EvidencePipeline verification/);
    assert.match(p.provenance.dataSource, /hardcoded by executive-transport/);
    assert.strictEqual(p.provenance.freshness, 'SNAPSHOT');
    assert.strictEqual(p.replay.reproduced, true);
    assert.strictEqual(p.replay.byteIdentical, true);
  });

  it('RA-11: replay carries the D79 attribution VERBATIM and declares no diff available', () => {
    const p = computeCertifiedReplay('Banking');
    assert.strictEqual(p.provenance.dataSource, REPLAY_PROVENANCE_DATA_SOURCE);
    assert.match(p.provenance.dataSource, /NOT produced by a runtime ReplayService verification/);
    assert.strictEqual(p.differenceAvailable, false, 'no field-level diff is fabricated');
    assert.strictEqual(p.evidenceRefs.length, 1);
    assert.strictEqual(p.original.composite, GOLDEN.Banking!.composite);
  });

  it('RA-12: no runtime-verification vocabulary appears anywhere in either attribution', () => {
    for (const src of [EVIDENCE_PROVENANCE_DATA_SOURCE, REPLAY_PROVENANCE_DATA_SOURCE]) {
      assert.strictEqual(/\bverified\b|\bwas verified\b|\bconfirmed by\b/i.test(src.replace(/NOT produced by[^.]*/g, '')), false,
        'the attribution must contain no verification claim');
    }
  });

  it('RA-27: evidence keyMetrics are governed NUMERIC inputs only — no descriptor is coerced into a metric', () => {
    // Read the frozen v1.1 Replay Baseline independently of the module under test.
    const baseline = JSON.parse(
      readFileSync(resolve(ROOT, 'program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
    ) as { sectors: Array<{ sector: string; input: Record<string, unknown> }> };
    assert.strictEqual(baseline.sectors.length, 13, 'the frozen baseline must define thirteen sectors');

    let descriptorKeysSeen = 0;
    for (const s of baseline.sectors) {
      const numeric = Object.entries(s.input).filter(([, v]) => typeof v === 'number') as Array<[string, number]>;
      const descriptors = Object.entries(s.input).filter(([, v]) => typeof v !== 'number').map(([k]) => k);
      descriptorKeysSeen += descriptors.length;

      const m = computeCertifiedEvidence(s.sector).evidence.keyMetrics;
      assert.deepStrictEqual(
        m.map((k) => k.id).sort(),
        numeric.map(([k]) => k).sort(),
        `${s.sector}: keyMetrics must be exactly the numeric governed inputs`,
      );
      for (const [id, value] of numeric) {
        const metric = m.find((k) => k.id === id)!;
        assert.strictEqual(metric.value, value, `${s.sector}/${id}: metric value must equal the baseline input verbatim`);
        assert.strictEqual(metric.name, id);
      }
      for (const d of descriptors) {
        assert.strictEqual(m.some((k) => k.id === d), false, `${s.sector}: descriptor "${d}" must NOT be emitted as a metric`);
      }
      // The donor's coercion is the specific defect being guarded against.
      assert.strictEqual(m.some((k) => k.value === 0 && typeof s.input[k.id] === 'string'), false,
        `${s.sector}: no descriptor may be coerced into a zero-valued metric`);
    }
    // The coercion defect must actually be exercised: the frozen baseline holds 26 string
    // descriptors across 9 of the 13 sectors (Banking/Insurance/Capital Markets/Healthcare hold
    // none). Asserting the exact count proves this guard cannot silently become vacuous.
    assert.strictEqual(descriptorKeysSeen, 26, 'the frozen baseline descriptor universe must be exercised in full');
    // The deviation is disclosed in the module itself, not merely in this test.
    assert.match(
      readFileSync(resolve(ROOT, 'frontend/server/research-sector-transport.ts'), 'utf8'),
      /DOCUMENTED DEVIATION FROM THE DONOR MAPPERS/,
    );
  });

  it('RA-13: evidence & replay are certified-fixture backed and deterministic for all sectors', () => {
    for (const sector of SECTORS) {
      const e = computeCertifiedEvidence(sector);
      const r = computeCertifiedReplay(sector);
      assert.strictEqual(e.decision.composite, GOLDEN[sector]!.composite);
      assert.strictEqual(e.decision.confidence, GOLDEN[sector]!.confidence);
      assert.strictEqual(r.original.composite, GOLDEN[sector]!.composite);
      assert.strictEqual(r.original.confidence, GOLDEN[sector]!.confidence);
      assert.strictEqual(sha256(e), sha256(computeCertifiedEvidence(sector)), `${sector}: evidence must be byte-stable`);
      assert.strictEqual(sha256(r), sha256(computeCertifiedReplay(sector)), `${sector}: replay must be byte-stable`);
      assert.strictEqual(e.evidence.replayReference, `snap_${sector}`);
    }
  });
});

/* ── Routing, fail-closed behaviour, and the SNAPSHOT-only boundary ─────────────────────── */

describe('Read authorities — routing and fail-closed behaviour', () => {
  it('RA-14: all four authorities answer 200 over the request path', () => {
    assert.strictEqual(handleResearchSectorRequest('/api/company/Banking').status, 200);
    assert.strictEqual(handleResearchSectorRequest('/api/decision-matrix').status, 200);
    assert.strictEqual(handleResearchSectorRequest('/api/evidence/Banking').status, 200);
    assert.strictEqual(handleResearchSectorRequest('/api/replay/Banking').status, 200);
  });

  it('RA-15: unknown ids and malformed targets FAIL CLOSED — nothing is invented or substituted', () => {
    for (const url of ['/api/company/Nope', '/api/evidence/Nope', '/api/replay/Nope']) {
      const r = handleResearchSectorRequest(url);
      assert.strictEqual(r.status, 404, `${url} must 404`);
      assert.match(JSON.stringify(r.body), /company not found/, `${url} must name the reason`);
    }
    assert.strictEqual(handleResearchSectorRequest('/api/company/').status, 404);
    assert.strictEqual(handleResearchSectorRequest('/api/company/A/B').status, 404);
    assert.strictEqual(handleResearchSectorRequest('/api/nothing').status, 404);
    assert.strictEqual(handleResearchSectorRequest('/api').status, 404);
  });

  it('RA-16: non-GET is refused 405, and an unknown id never falls back to a default sector', () => {
    for (const m of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const r = handleResearchSectorRequest('/api/company/Banking', m);
      assert.strictEqual(r.status, 405, `${m} must be refused`);
      assert.match(JSON.stringify(r.body), /method-not-allowed/);
    }
    const bad = handleResearchSectorRequest('/api/company/NotASector');
    assert.strictEqual(bad.status, 404);
    assert.strictEqual(/Banking/.test(JSON.stringify(bad.body)), false, 'no default sector may be substituted');
  });

  it('RA-17: SNAPSHOT refuses `asOf` (400, donor wording VERBATIM) on EVERY authority, never ignoring it', () => {
    for (const url of [
      '/api/company/Banking?asOf=2026-06-30T00:00:00.000Z',
      '/api/evidence/Banking?asOf=2026-01-01T00:00:00.000Z',
      '/api/replay/Banking?asOf=x',
      '/api/decision-matrix?asOf=2026-06-30T00:00:00.000Z',
    ]) {
      const r = handleResearchSectorRequest(url);
      assert.strictEqual(r.status, 400, `${url} must be refused`);
      assert.strictEqual((r.body as { error: string }).error, ASOF_REFUSED_UNDER_SNAPSHOT, 'donor refusal wording must be verbatim');
    }
    // duplicate/ambiguous asOf is refused identically (never "pick a winner")
    const dup = handleResearchSectorRequest('/api/company/Banking?asOf=2026-01-01&asOf=2026-02-01');
    assert.strictEqual(dup.status, 400);
    // an unrecognised selector must not be silently discarded either
    const unknown = handleResearchSectorRequest('/api/company/Banking?whatever=1');
    assert.strictEqual(unknown.status, 400);
    assert.match((unknown.body as { error: string }).error, /unsupported query parameter\(s\): whatever/);
    assert.strictEqual(handleResearchSectorRequest('/api/decision-matrix?limit=5').status, 400);
  });

  it('RA-18: there is NO PIT code path and no mode authority — no response can be PIT or degraded', () => {
    const bodies = [
      handleResearchSectorRequest('/api/company/Banking'),
      handleResearchSectorRequest('/api/decision-matrix'),
      handleResearchSectorRequest('/api/evidence/Banking'),
      handleResearchSectorRequest('/api/replay/Banking'),
    ];
    for (const r of bodies) {
      const s = JSON.stringify(r.body);
      assert.strictEqual(r.status, 200);
      assert.strictEqual(/"dataMode"/.test(s), false, 'no mode field may be emitted');
      assert.strictEqual(/"dataAvailable"/.test(s), false, 'no degraded/PIT discriminant may be emitted');
      assert.strictEqual(/"freshness":"PIT"/.test(s), false, 'no PIT freshness may be emitted');
      assert.strictEqual(/"LIVE_UNAVAILABLE"|"PIT_UNAVAILABLE"/.test(s), false, 'no degraded state may be emitted');
    }
  });

  it('RA-19: an unencoded slash and a non-ASCII id are handled without inventing a sector', () => {
    assert.strictEqual(handleResearchSectorRequest('/api/company/Capital%20Markets').status, 200);
    assert.strictEqual((handleResearchSectorRequest('/api/company/Capital%20Markets').body as { sector: string }).sector, 'Capital Markets');
    assert.strictEqual((handleResearchSectorRequest('/api/company/Materials%20%26%20Metals').body as { sector: string }).sector, 'Materials & Metals');
    assert.strictEqual(handleResearchSectorRequest('/api/company/%2F').status, 404);
  });

  it('RA-20: the HTTP host does not listen until the caller starts it and claims no auth of any kind', () => {
    const server = createResearchSectorServer(0);
    assert.strictEqual(typeof server.listen, 'function', 'a real node:http server is constructed');
    assert.strictEqual(server.listening, false, 'the host must not listen until the caller starts it');
  });
});

/* ── Browser boundary + no provider/network + no donor infrastructure ───────────────────── */

describe('Read authorities — boundaries (browser graph, network, donor infrastructure)', () => {
  const MODULE = 'frontend/server/research-sector-transport.ts';
  const src = readFileSync(resolve(ROOT, MODULE), 'utf8');
  /** Code only: prose describing what is EXCLUDED must not mask, nor falsely trip, a guard. */
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('RA-21: the module is server-side only and imports exactly one platform function', () => {
    const imports = [...src.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['node:http', '../../src/transports/executive_transport.js'],
      'only the HTTP module and the already-recovered certified platform entry point');
    assert.match(src, /computeCertifiedPlatform/, 'must use the recovered certified platform');
  });

  it('RA-22: no provider, network, credential or filesystem access is performed by the module', () => {
    for (const banned of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'https://', 'http://',
      'process.env', 'apiKey', 'credential', 'secret', 'readFileSync', 'node:fs', 'node:path', 'child_process']) {
      assert.strictEqual(code.includes(banned), false, `${MODULE} must not contain ${banned}`);
    }
  });

  it('RA-23: NO donor dispatch, auth tier, PIT or advisory infrastructure is imported or reproduced', () => {
    for (const banned of ['guardRead', 'secured-executor', 'admin-transport', 'ai-advisory', 'keycloak',
      'Keycloak', 'oidc', 'OIDC', 'pitVintage', 'PitVintage', 'd114', 'D114', 'd115', 'D115', 'data-mode',
      'mospi', 'MoSPI', 'vitest', 'jsdom', 'authFetch', 'persistence-service', 'settings-service',
      'frontend/server/executive-transport']) {
      assert.strictEqual(code.includes(banned), false, `${MODULE} must not implement or reference ${banned}`);
    }
    // The donor module's NAME may appear only inside the two verbatim D79 attribution literals
    // (which the manifest requires be preserved verbatim), never as an import, path or dispatch.
    const withoutAttribution = code.split(EVIDENCE_PROVENANCE_DATA_SOURCE).join('').split(REPLAY_PROVENANCE_DATA_SOURCE).join('');
    assert.strictEqual(withoutAttribution.includes('executive-transport'), false,
      'the donor module may be named only by the verbatim D79 attribution');
    // Positive disclosure: the exclusions are documented, so the boundary is auditable.
    for (const disclosed of ['NOT included, by authority', 'guardRead', 'PIT vintage branch', 'Decision Matrix / Evidence / Replay *UI*']) {
      assert.ok(src.includes(disclosed), `the module must document its exclusion of ${disclosed}`);
    }
  });

  /** Every browser-graph file under a directory, relative to the repo root. */
  function browserFiles(rel: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(resolve(ROOT, rel), { withFileTypes: true })) {
      const next = `${rel}/${e.name}`;
      if (e.isDirectory()) out.push(...browserFiles(next));
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(next);
    }
    return out;
  }

  it('RA-24: no browser file IMPORTS the server authority module, and the browser graph stays node-free', () => {
    // PROMPT 2C REFINEMENT: this guard now inspects CODE (comments stripped), not raw text.
    // Prompt 2C added browser API clients that legitimately NAME the server authority in their
    // doc comments (explaining which transport serves the endpoint) without importing it. The
    // guard's intent — no browser file may IMPORT a server or Node module — is unchanged and
    // is asserted against code. A real import would still fail.
    const src = browserFiles('frontend/src');
    assert.ok(src.length > 0, 'the browser graph must be discoverable');
    for (const f of src) {
      const body = readFileSync(resolve(ROOT, f), 'utf8');
      const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.strictEqual(/from\s*'[^']*research-sector-transport/.test(code), false, `${f} must not IMPORT the server authority module`);
      assert.strictEqual(/require\([^)]*research-sector-transport/.test(code), false, `${f} must not require the server authority module`);
      assert.strictEqual(/from 'node:/.test(code), false, `${f} must not import a node: builtin`);
    }
  });

  it('RA-25: the Prompt-2B baseline clients stay byte-unchanged, and every API client stays node-free', () => {
    // The four authorities are reachable over HTTP only. Prompt 2C later ADDS the two read
    // clients these authorities require (`company.ts`, `decisionMatrix.ts`); the baseline
    // clients must remain byte-identical, and NO client — baseline or added — may import a
    // Node builtin, a server module, or the certified platform.
    // WUI-RS-03C AMENDMENT: `executive.ts` was RE-BASELINED. Its pre-existing import of the
    // Executive transport (and its in-browser compute fallback) was removed in the WUI-RS-03C
    // remediation gate, so the byte-pin below now records the remediated file and the former
    // platform-import EXEMPTION for `executive.ts` is RETIRED — it is now held to the same
    // node-free/platform-free rules as every other client.
    const BASELINE_API: Record<string, string> = {
      'frontend/src/api/authFetch.ts': '64b72cce180f5ce5008a73818b0329d3624c057b089e274fb05522fe97fae66b',
      'frontend/src/api/dataMode.ts': '4d6ecf13c546eaa3f6458f21d8b93066e7bfa0acc22d3627858447c4fddf3b4f',
      'frontend/src/api/evidence.ts': '3a6797e2b2d4ffb09fa504cf77bc4fd4a50345a8b97ddb6cf3f69c82771fb16f',
      // Re-baselined by WUI-RS-03C (browser Node-edge remediation); prior value:
      // 349fef59663e4edc5c86a04a8ab7a4c66813dcafc7668597325aedf5b08853ae
      'frontend/src/api/executive.ts': 'a404a58d783a4398f938336ff498cc429eb236df607ddf1ef86dc0347ab05817',
      'frontend/src/api/replay.ts': 'bac8b56f04124ac866d2dad24a953338852fa2f52055351f8632936adff4fc9d',
    };
    for (const [f, expected] of Object.entries(BASELINE_API)) {
      assert.strictEqual(createHash('sha256').update(readFileSync(resolve(ROOT, f))).digest('hex'), expected, `${f} must be byte-unchanged`);
    }
    const api = browserFiles('frontend/src/api');
    for (const f of api) {
      const code = readFileSync(resolve(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.strictEqual(/from 'node:/.test(code), false, `${f} must not import a node: builtin`);
      assert.strictEqual(/from\s*'[^']*research-sector-transport/.test(code), false, `${f} must not import the server authority module`);
      // WUI-RS-03C: no client is exempt any more — `executive.ts` included.
      assert.strictEqual(code.includes('iips-platform'), false, `${f} must not import the certified platform`);
      assert.strictEqual(code.includes('src/transports'), false, `${f} must not import a platform transport`);
      assert.strictEqual(code.includes('frontend/server'), false, `${f} must not import a server module`);
    }
    // The two read clients this authority set actually requires must be present.
    for (const required of ['frontend/src/api/company.ts', 'frontend/src/api/decisionMatrix.ts']) {
      assert.ok(api.includes(required), `${required} must exist (the authority's browser client)`);
    }
  });

  it('RA-26: this authority module left the route/navigation wiring and the Stage-4 server untouched', () => {
    // PROMPT 2C RE-SCOPE. In Prompt 2B this guard also asserted that App.tsx, navigation.ts and
    // routes.ts were byte-unchanged, and that no Company/Sector surface component existed — which
    // was correct then, because 2B recovered no UI. Prompt 2C is the unit that legitimately wires
    // those two surfaces, so those four assertions moved to the Prompt-2C suites. What remains
    // here is the part that is STILL true and still matters: the Prompt-2B authority did not
    // touch the server it must not touch, and the route map's constants are unmodified.
    const UNCHANGED: Record<string, string> = {
      // The existing Stage-4 server module is untouched by BOTH Prompt 2B and Prompt 2C. The
      // donor dispatch was never restored.
      'frontend/server/executive-transport.ts': '79d62cea45620778ce1a1f11ff47204c7590937e5f165002af80fd8c62047fb2',
      // The route MAP is unchanged: /research/company/:id and /research/sector/:id already
      // existed as constants, so Prompt 2C mounted surfaces without altering any route path.
      'frontend/src/app/routes.ts': 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085',
    };
    for (const [file, expected] of Object.entries(UNCHANGED)) {
      const actual = createHash('sha256').update(readFileSync(resolve(ROOT, file))).digest('hex');
      assert.strictEqual(actual, expected, `${file} must be byte-unchanged`);
    }
    // The restored donor structures that remain OUT of scope must still be untouched.
    const app = readFileSync(resolve(ROOT, 'frontend/src/app/App.tsx'), 'utf8');
    // DECISION MATRIX work item (governed update): the Decision Matrix placeholder is replaced by
    // the restored surface; the non-fabrication statement is retained on its route record.
    assert.match(app, /No matrix, scores, or weights are fabricated\./, 'the Decision Matrix route record must remain non-fabricating');
    assert.match(app, /No event data is fabricated\./, 'the Events placeholder must remain non-fabricating');
    assert.match(app, /No cross-sector data is fabricated\./, 'the Cross-Sector placeholder must remain non-fabricating');
    // Out-of-scope surfaces must still not exist.
    // DECISION MATRIX work item (governed update): DecisionMatrix.tsx is recovered by its own
    // gate and leaves this list; the other out-of-scope surfaces are unchanged.
    // A2 Evidence restoration (superseded): EvidenceExplorer.tsx and ReplayExplorer.tsx are recovered by the A2 gate and
    // leave this absent list. Every other exclusion is unchanged.
    for (const absent of [
      'frontend/src/features/research/ResearchEvents.tsx',
      'frontend/src/features/research/MacroContext.tsx',
    ]) {
      assert.strictEqual(existsSync(resolve(ROOT, absent)), false, `${absent} must not exist (out of scope)`);
    }
  });
});
