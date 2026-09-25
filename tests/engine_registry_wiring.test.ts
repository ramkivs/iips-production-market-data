/**
 * GROUP 1 / GATE 2 — ENGINE REGISTRY READ-ONLY WIRING (NON-PRODUCTION)
 *
 * Wires the Gate 1 recovered certified 10-engine Engine Registry (iips-review-recovered @ 286f3da,
 * E2E-030 "10-ENGINE LTS E2E SCOPE ONLY"; recovered to B1 by e1fa323) as a READ-ONLY surface:
 *   · GET /api/engines on the existing 8788 SNAPSHOT authority (research-sector-transport.ts),
 *     returning the donor `EngineApiAdapter.listEngines()` projection of `CERTIFIED_ENGINES` as-is;
 *   · /research/engines mounting the recovered donor `EngineRegistry` surface;
 *   · the donor nav entry ('Engines', /research/engines) as `partial`.
 *
 * CERTIFICATION BOUNDARY: B1 does NOT inherit E2E-030. This suite proves B1 wiring only. Windows /
 * browser qualification is a separate acceptance gate and is NOT claimed here.
 *
 * GATE B (b1-three-engine-a1-adoption-2026-09-25-001): the registry is now 13 registered engines —
 * the 10 above (unchanged, in order) + IES-016 sector.telecommunications, IES-017 sector.automobile,
 * IES-020 sector.materials-metals, resolved from the existing B1 engine modules. Those three carry
 * HISTORICAL A1 LINEAGE / B1 ADOPTION PENDING CERTIFICATION (Gate C) — NOT B1-certified; A1
 * certification is not transferred; X-IIPS-Certification stays NONE CLAIMED. The D42 IDs
 * (sector.telecom / sector.auto / sector.materials) remain forbidden. Execution stays dormant: the
 * three have NO ENGINE_FACTORY entry, so the dormant execute path fails closed (`factory-missing`).
 *
 * EXECUTION BOUNDARY: `EngineApiAdapter.execute()` / `executeEngine()` are dormant donor code —
 * PRESENT / NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED. Asserted below.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { AddressInfo } from 'node:net';
import React from 'react';
import * as JsxRuntime from 'react/jsx-runtime';
import { renderToString } from 'react-dom/server';
import * as RouterDom from 'react-router-dom';
import ts from 'typescript';

import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import { EngineRegistry } from '../frontend/src/features/engines/EngineRegistry.js';
import * as EnginesApi from '../frontend/src/api/engines.js';
import * as StateComponents from '../frontend/src/components/state/StateComponents.js';
import * as Badges from '../frontend/src/components/ui/Badges.js';
import * as DataComponents from '../frontend/src/components/data/DataComponents.js';
import { handleResearchSectorRequest, createResearchSectorServer } from '../frontend/server/research-sector-transport.js';
import { EngineApiAdapter } from '../iips-platform/src/integration/EngineApiAdapter.js';
import {
  CERTIFIED_ENGINES, getEngineEntry, isCertifiedEngine, getEngineForSector, getCertificationLineage,
  B1_ADOPTION_PENDING_CERTIFICATION,
} from '../iips-platform/src/integration/EngineRegistry.js';
import { makeCertifiedEngine } from '../iips-platform/src/integration/EngineApiAdapter.js';
import { BANKING_ENGINE_ID } from '../iips-platform/src/sector-engines/banking/BankingEngine.js';
import { INSURANCE_ENGINE_ID } from '../iips-platform/src/sector-engines/insurance/InsuranceEngine.js';
import { CAPITAL_MARKETS_ENGINE_ID } from '../iips-platform/src/sector-engines/capital-markets/CapitalMarketsEngine.js';
import { HEALTHCARE_ENGINE_ID } from '../iips-platform/src/sector-engines/healthcare/HealthcareEngine.js';
import { HOSPITALITY_ENGINE_ID } from '../iips-platform/src/sector-engines/hospitality/HospitalityEngine.js';
import { ENERGY_ENGINE_ID } from '../iips-platform/src/sector-engines/energy/EnergyEngine.js';
import { UTILITIES_ENGINE_ID } from '../iips-platform/src/sector-engines/utilities/UtilitiesEngine.js';
import { CONSUMER_ENGINE_ID } from '../iips-platform/src/sector-engines/consumer/ConsumerEngine.js';
import { INDUSTRIALS_ENGINE_ID } from '../iips-platform/src/sector-engines/industrials/IndustrialsEngine.js';
import { TECHNOLOGY_ENGINE_ID } from '../iips-platform/src/sector-engines/technology/TechnologyEngine.js';
import { TELECOMMUNICATIONS_ENGINE_ID } from '../iips-platform/src/sector-engines/telecommunications/TelecommunicationsEngine.js';
import { AUTOMOBILE_ENGINE_ID } from '../iips-platform/src/sector-engines/automobile/AutomobileEngine.js';
import { MATERIALS_METALS_ENGINE_ID } from '../iips-platform/src/sector-engines/materials-metals/MaterialsMetalsEngine.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const gitBlob = (s: string): string => {
  const buf = Buffer.from(s, 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');
};
const json = (v: unknown): unknown => JSON.parse(JSON.stringify(v));
const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listFiles(p) : [p]; });

/** The exact certified 10-engine set (Program v1.1 LTS), in registry order, as read from the recovered donor registry. */
const LTS_IDS = [
  'sector.banking', 'sector.insurance', 'sector.capital-markets', 'sector.healthcare', 'sector.hospitality',
  'sector.energy', 'sector.utilities', 'sector.consumer', 'sector.industrials', 'sector.technology',
] as const;
/** GATE B adopted engines (existing B1 engine IDs) — historical A1 lineage / B1 adoption pending certification. */
const GATEB_IDS = ['sector.telecommunications', 'sector.automobile', 'sector.materials-metals'] as const;
/** The exact 13 registered engines after Gate B, in registry order (10 unchanged, then the 3 appended). */
const EXPECTED_IDS = [...LTS_IDS, ...GATEB_IDS] as const;
const EXPECTED_IES = ['IES-006', 'IES-007', 'IES-008', 'IES-009', 'IES-010', 'IES-011', 'IES-012', 'IES-013', 'IES-014', 'IES-015',
  'IES-016', 'IES-017', 'IES-020'];
/** D42 13-engine extension IDs (iips-review-recovered 6a5d7cc) — still forbidden after Gate B. */
const FORBIDDEN_IDS = ['sector.telecom', 'sector.auto', 'sector.materials'];
const LTS_LINEAGE = 'Program v1.1 LTS';
const GATEB_LINEAGE = 'historical A1 lineage / B1 adoption pending certification';
/** Engine-module ID constants (existing B1 engine sources), in registry order. */
const MODULE_IDS = [BANKING_ENGINE_ID, INSURANCE_ENGINE_ID, CAPITAL_MARKETS_ENGINE_ID, HEALTHCARE_ENGINE_ID,
  HOSPITALITY_ENGINE_ID, ENERGY_ENGINE_ID, UTILITIES_ENGINE_ID, CONSUMER_ENGINE_ID, INDUSTRIALS_ENGINE_ID,
  TECHNOLOGY_ENGINE_ID, TELECOMMUNICATIONS_ENGINE_ID, AUTOMOBILE_ENGINE_ID, MATERIALS_METALS_ENGINE_ID];
/** GATE B adopted engines -> their recovered repo-root asset pack (Gate A / supplement). */
const GATEB_PACKS: Readonly<Record<string, { dir: string; ontology: string }>> = {
  'sector.telecommunications': { dir: 'ies-016-telecommunications', ontology: 'telecommunications-ontology-metadata-1.0.0.json' },
  'sector.automobile': { dir: 'ies-017-automobile', ontology: 'automobile-ontology-metadata-1.0.0.json' },
  'sector.materials-metals': { dir: 'ies-020-materials-metals', ontology: 'materials-metals-ontology-metadata-1.0.0.json' },
};
/**
 * GATE B exact source hunks, [gateBText, donorText], applied in order. Reversing them MUST reproduce the
 * Gate 1 donor blobs (286f3da) byte-for-byte — so the donor pins are still asserted and nothing but
 * these hunks changed (the existing 10 entries, ENGINE_FACTORY and execute() included).
 */
const GATEB_SOURCE_HUNKS: Readonly<Record<string, ReadonlyArray<readonly [string, string]>>> = {
  "iips-platform/src/integration/EngineRegistry.ts": [
    [
      " *\n * Governed registry: 13 registered sector engines after Gate B adoption — the 10\n * Program v1.1 LTS engines (IES-006…015) plus IES-016 / IES-017 / IES-020 adopted into\n * B1 under RAMKI authority `b1-three-engine-a1-adoption-2026-09-25-001` (Gate B).\n",
      " *\n * Governed registry mapping the 10 Program v1.1 LTS certified sector engines.\n"
    ],
    [
      " * a freeze-manifest + final-readiness-certificate + replay-baseline entry.\n * Adding a new sector requires a new freeze manifest and certification — it is a\n * governance event, never a coding shortcut (see IIPS_v3.0_ENGINE_INTEGRATION_DISCOVERY.md\n * authority block). The three Gate B engines carry HISTORICAL A1 LINEAGE (phase13-next)\n * and are B1 ADOPTION PENDING CERTIFICATION (Gate C): they are NOT B1-certified and no\n * A1 certification is transferred. See `getCertificationLineage`.\n",
      " * a freeze-manifest + final-readiness-certificate + replay-baseline entry.\n * Adding a new sector (e.g. IES-016 Telecom, IES-020 Materials) requires a new\n * freeze manifest and certification — it is a governance event, never a coding\n * shortcut (see IIPS_v3.0_ENGINE_INTEGRATION_DISCOVERY.md authority block).\n"
    ],
    [
      "import { TECHNOLOGY_ENGINE_ID } from '../sector-engines/technology/TechnologyEngine';\nimport { TELECOMMUNICATIONS_ENGINE_ID } from '../sector-engines/telecommunications/TelecommunicationsEngine';\nimport { AUTOMOBILE_ENGINE_ID } from '../sector-engines/automobile/AutomobileEngine';\nimport { MATERIALS_METALS_ENGINE_ID } from '../sector-engines/materials-metals/MaterialsMetalsEngine';\n",
      "import { TECHNOLOGY_ENGINE_ID } from '../sector-engines/technology/TechnologyEngine';\n"
    ],
    [
      "/**\n * The 13 registered engines — frozen list: the 10 Program v1.1 LTS engines (IES-006…015,\n * order and values unchanged) followed by the 3 Gate B adopted engines (IES-016, IES-017,\n * IES-020). The exported name is retained for compatibility; membership is registration,\n * not a B1 certification claim (see `getCertificationLineage`).\n * Values mirror the freeze manifests (IES-006…015; ies-016/017/020 packs) and\n",
      "/**\n * The 10 Program v1.1 LTS certified engines — frozen list.\n * Values mirror the freeze manifests (IES-006…015) and\n"
    ],
    [
      "  },\n  // ── GATE B (b1-three-engine-a1-adoption-2026-09-25-001): B1 three-engine adoption.\n  // Historical A1 lineage (phase13-next) / B1 adoption pending certification — NOT B1-certified.\n  // readinessCertificate = the existing A2 readiness certificates (unmodified).\n  {\n    engineId: TELECOMMUNICATIONS_ENGINE_ID,\n    ies: 'IES-016',\n    iesTitle: 'Telecommunications Sector Engine',\n    sectorFamily: 'Telecommunications',\n    engineVersion: '1.0.0',\n    secVersion: '1.0',\n    semcVersion: '1.0',\n    calibrationProfile: 'telecommunications-calibration-1.0.0',\n    calibrationVersion: '1.0.0',\n    contractVersion: 'IES-016 v1.0 (D16)',\n    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],\n    ontologyDimensions: 8,\n    freezeManifest: 'ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json',\n    readinessCertificate: 'iips-platform/IES016_FINAL_READINESS_CERTIFICATE.md',\n  },\n  {\n    engineId: AUTOMOBILE_ENGINE_ID,\n    ies: 'IES-017',\n    iesTitle: 'Automobile Sector Engine',\n    sectorFamily: 'Automobile',\n    engineVersion: '1.0.0',\n    secVersion: '1.0',\n    semcVersion: '1.0',\n    calibrationProfile: 'automobile-calibration-1.0.0',\n    calibrationVersion: '1.0.0',\n    contractVersion: 'IES-017 v1.0 (D17)',\n    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],\n    ontologyDimensions: 8,\n    freezeManifest: 'ies-017-automobile/IES-017_FREEZE_MANIFEST.json',\n    readinessCertificate: 'iips-platform/IES017_FINAL_READINESS_CERTIFICATE.md',\n  },\n  {\n    engineId: MATERIALS_METALS_ENGINE_ID,\n    ies: 'IES-020',\n    iesTitle: 'Materials & Metals Sector Engine',\n    sectorFamily: 'Materials & Metals',\n    engineVersion: '1.0.0',\n    secVersion: '1.0',\n    semcVersion: '1.0',\n    calibrationProfile: 'materials-metals-calibration-1.0.0',\n    calibrationVersion: '1.0.0',\n    contractVersion: 'IES-020 v1.0 (D20)',\n    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],\n    ontologyDimensions: 8,\n    freezeManifest: 'ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json',\n    readinessCertificate: 'iips-platform/IES020_FINAL_READINESS_CERTIFICATE.md',\n  },\n",
      "  },\n"
    ],
    [
      "}\n\n/**\n * GATE B — certification-lineage distinction (RAMKI Decision 5). The registry is 13 engines,\n * but they do NOT share one certification lineage:\n *   - IES-006…015: 'Program v1.1 LTS' (the lineage recorded by this frozen registry);\n *   - IES-016 / IES-017 / IES-020: 'historical A1 lineage / B1 adoption pending certification'.\n * Historical A1 certification remains anchored to phase13-next and is NOT transferred into B1;\n * B1 certification of the three is pending Gate C. Unknown engines fail closed (throw).\n */\nexport type CertificationLineage =\n  | 'Program v1.1 LTS'\n  | 'historical A1 lineage / B1 adoption pending certification';\n\nexport const B1_ADOPTION_PENDING_CERTIFICATION: readonly string[] = Object.freeze([\n  TELECOMMUNICATIONS_ENGINE_ID,\n  AUTOMOBILE_ENGINE_ID,\n  MATERIALS_METALS_ENGINE_ID,\n]);\n\nexport function getCertificationLineage(engineId: string): CertificationLineage {\n  if (!isCertifiedEngine(engineId)) {\n    throw new Error(`unregistered-engine: ${engineId} is not a registered engine`);\n  }\n  if (B1_ADOPTION_PENDING_CERTIFICATION.includes(engineId)) {\n    return 'historical A1 lineage / B1 adoption pending certification';\n  }\n  return 'Program v1.1 LTS';\n}\n",
      "}\n"
    ]
  ],
  "iips-platform/src/integration/EngineApiAdapter.ts": [
    [
      "  assertNotTaxonomyResolved,\n  getCertificationLineage,\n  type CertificationLineage,\n",
      "  assertNotTaxonomyResolved,\n"
    ],
    [
      "    readonly capabilities: readonly string[];\n    readonly certificationLineage: CertificationLineage;\n",
      "    readonly capabilities: readonly string[];\n"
    ],
    [
      "    readonly source: string;\n    readonly b1Certification: 'NONE CLAIMED';\n",
      "    readonly source: string;\n"
    ],
    [
      "        capabilities: e.capabilities,\n        certificationLineage: getCertificationLineage(e.engineId),\n",
      "        capabilities: e.capabilities,\n"
    ],
    [
      "        source:\n          'Program v1.1 LTS — 10 frozen sector engines (IES-006…015) — freeze manifests + replay baseline; ' +\n          'Gate B — IES-016/017/020 historical A1 lineage / B1 adoption pending certification (NOT B1-certified)',\n        b1Certification: 'NONE CLAIMED',\n",
      "        source:\n          'Program v1.1 LTS — 10 frozen sector engines (IES-006…015) — freeze manifests + replay baseline',\n"
    ]
  ]
};
const revertGateB = (rel: string): string => {
  let out = read(rel);
  for (const [gateB, donor] of GATEB_SOURCE_HUNKS[rel] ?? []) {
    const first = out.indexOf(gateB);
    if (first === -1) throw new Error(`Gate B hunk missing from ${rel}: ${gateB.split('\n')[1] ?? gateB}`);
    if (out.indexOf(gateB, first + 1) !== -1) throw new Error(`Gate B hunk duplicated in ${rel}`);
    out = out.slice(0, first) + donor + out.slice(first + gateB.length);
  }
  return out;
};

const SERVER = 'frontend/server/research-sector-transport.ts';
const CLIENT = 'frontend/src/api/engines.ts';
const COMPONENT = 'frontend/src/features/engines/EngineRegistry.tsx';

interface Served { apiVersion: string; engines: Array<{ engineId: string; ies: string; certificationLineage: string }>; provenance: { certifiedCount: number; freshness: string; source: string; b1Certification: string } }

async function withServer<T>(fn: (base: string) => Promise<T>): Promise<T> {
  const server = createResearchSectorServer(0);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  try {
    return await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

const renderAt = (path: string): string =>
  renderToString(
    React.createElement(RouterDom.MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));

/** Execute the SHIPPED component source with seeded donor state (data, error, loading) — no re-implementation. */
function renderSeeded(seed: { data: unknown; error: string | null; loading: boolean }): string {
  const compiled = ts.transpileModule(read(COMPONENT), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const order = ['data', 'error', 'loading'] as const;
  let i = 0;
  const hooks = {
    ...React,
    useState: (init: unknown) => {
      const name = order[i++];
      if (name === undefined) throw new Error('useState beyond the donor declarations');
      return [seed[name] ?? init, () => undefined];
    },
    useEffect: () => undefined,
  };
  const modules: Record<string, unknown> = {
    'react': hooks, 'react/jsx-runtime': JsxRuntime, 'react-router-dom': RouterDom,
    '../../api/engines.js': EnginesApi, '../../components/state/StateComponents.js': StateComponents,
    '../../components/ui/Badges.js': Badges, '../../components/data/DataComponents.js': DataComponents,
  };
  const req = (id: string): unknown => {
    if (!(id in modules)) throw new Error(`unexpected import in shipped component: ${id}`);
    return modules[id];
  };
  const exports: Record<string, unknown> = {};
  new Function('require', 'exports', compiled)(req, exports);
  const element = (exports.EngineRegistry as () => React.ReactElement)();
  assert.strictEqual(i, order.length, 'every donor state consumed');
  return renderToString(React.createElement(RouterDom.MemoryRouter, {}, element));
}

describe('Gate 2 / Gate B — GET /api/engines (read-only, 13 registered engines after Gate B adoption)', () => {
  it('ER-01: GET /api/engines returns 200 with exactly the recovered donor registry projection', () => {
    const res = handleResearchSectorRequest('/api/engines', 'GET');
    assert.strictEqual(res.status, 200);
    const body = json(res.body) as Served;
    assert.deepStrictEqual(body, json(new EngineApiAdapter().listEngines()), 'donor listEngines() serialized as-is');
    assert.deepStrictEqual(body.engines, json(CERTIFIED_ENGINES.map((e) => ({
      engineId: e.engineId, ies: e.ies, iesTitle: e.iesTitle, sectorFamily: e.sectorFamily, engineVersion: e.engineVersion,
      secVersion: e.secVersion, semcVersion: e.semcVersion, calibrationProfile: e.calibrationProfile,
      calibrationVersion: e.calibrationVersion, capabilities: e.capabilities,
      certificationLineage: getCertificationLineage(e.engineId),
    }))), 'entries are CERTIFIED_ENGINES 1:1 (+ Gate B lineage) — no normalization, scoring or transformation');
    assert.strictEqual(body.apiVersion, '1.0');
  });

  it('ER-02: exactly 13 engines — the 10 (IES-006…015) unchanged in order, then IES-016/017/020; no D42 IDs', () => {
    const body = json(handleResearchSectorRequest('/api/engines').body) as Served;
    assert.deepStrictEqual(body.engines.map((e) => e.engineId), [...EXPECTED_IDS]);
    assert.deepStrictEqual(body.engines.map((e) => e.ies), EXPECTED_IES);
    assert.deepStrictEqual(CERTIFIED_ENGINES.map((e) => e.engineId), [...EXPECTED_IDS], 'registry source itself is the 13-engine scope');
    assert.strictEqual(CERTIFIED_ENGINES.length, 13);
    assert.strictEqual(new Set(CERTIFIED_ENGINES.map((e) => e.engineId)).size, 13, 'no duplicate engine');
    assert.strictEqual(new Set(CERTIFIED_ENGINES.map((e) => e.ies)).size, 13, 'no duplicate IES');
    assert.strictEqual(body.provenance.certifiedCount, 13);
    assert.strictEqual(body.provenance.freshness, 'FROZEN');
    // Gate B certification-lineage distinction (RAMKI Decision 5): registration is not B1 certification.
    assert.deepStrictEqual(body.engines.map((e) => e.certificationLineage),
      [...LTS_IDS.map(() => LTS_LINEAGE), ...GATEB_IDS.map(() => GATEB_LINEAGE)]);
    assert.deepStrictEqual([...B1_ADOPTION_PENDING_CERTIFICATION], [...GATEB_IDS]);
    assert.strictEqual(body.provenance.b1Certification, 'NONE CLAIMED');
    assert.ok(body.provenance.source.includes('IES-016/017/020 historical A1 lineage / B1 adoption pending certification (NOT B1-certified)'));
    assert.ok(body.provenance.source.startsWith('Program v1.1 LTS — 10 frozen sector engines (IES-006…015) — freeze manifests + replay baseline'));
    for (const id of [...FORBIDDEN_IDS, 'sector.unknown', '']) {
      assert.throws(() => getCertificationLineage(id), /unregistered-engine/, `lineage fails closed for ${id || '(empty)'}`);
    }
    const served = JSON.stringify(body);
    for (const id of FORBIDDEN_IDS) assert.strictEqual(served.includes(`"${id}"`), false, `${id} must not be served`);
    const registrySrc = read('iips-platform/src/integration/EngineRegistry.ts') + read('iips-platform/src/integration/EngineApiAdapter.ts');
    for (const id of FORBIDDEN_IDS) assert.strictEqual(registrySrc.includes(`'${id}'`), false, `${id} absent from the recovered sources`);
    assert.strictEqual(/TelecomEngine|AutoEngine|MaterialsEngine/.test(registrySrc), false, 'no D42 engine import');
  });

  it('ER-03: over real HTTP — GET 200; every other method and any execute path fail closed', async () => {
    await withServer(async (base) => {
      const ok = await fetch(`${base}/api/engines`);
      assert.strictEqual(ok.status, 200);
      assert.strictEqual(ok.headers.get('x-iips-certification'), 'NONE CLAIMED', 'B1 wiring claims no certification');
      assert.deepStrictEqual((await ok.json() as Served).engines.map((e) => e.engineId), [...EXPECTED_IDS]);
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        const r = await fetch(`${base}/api/engines`, { method, headers: { 'Content-Type': 'application/json' }, body: '{}' });
        assert.strictEqual(r.status, 405, `${method} /api/engines refused`);
        await r.text();
      }
      const body = JSON.stringify({ apiVersion: '1.0', engineId: 'sector.banking', requestId: 'r-1', inputs: {} });
      const post = await fetch(`${base}/api/engines/sector.banking/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      assert.strictEqual(post.status, 405, 'POST /api/engines/:id/execute is not exposed');
      await post.text();
      const get = await fetch(`${base}/api/engines/sector.banking/execute`);
      assert.strictEqual(get.status, 404, 'no execute route exists under any method');
      await get.text();
      const sub = await fetch(`${base}/api/engines/sector.banking`);
      assert.strictEqual(sub.status, 404, 'no per-engine sub-resource');
      await sub.text();
      const pit = await fetch(`${base}/api/engines?asOf=2026-01-01`);
      assert.strictEqual(pit.status, 400, 'SNAPSHOT authority: asOf refused, never silently ignored');
      await pit.text();
    });
  });

  it('ER-04: static exposure — no execution route, transport or caller was introduced', () => {
    const server = stripComments(read(SERVER));
    assert.strictEqual(/\.execute\(|\/execute|executeEngine/.test(server), false, 'server never calls/routes execution');
    assert.strictEqual((server.match(/new EngineApiAdapter\(\)\.listEngines\(\)/g) ?? []).length, 1, 'exactly one read-only use');
    assert.deepStrictEqual(server.split('\n').filter((l) => l.includes('EngineApiAdapter')).map((l) => l.trim()), [
      "import { EngineApiAdapter } from '../../iips-platform/src/integration/EngineApiAdapter.js';",
      'return Object.freeze({ status: 200 as const, body: new EngineApiAdapter().listEngines() });',
    ], 'the import + the single listEngines() use only');
    // Browser tree: executeEngine exists ONLY as the dormant donor definition in the client.
    const files = listFiles(resolve(ROOT, 'frontend/src')).filter((f) => /\.(ts|tsx)$/.test(f));
    const callers = files.filter((f) => /executeEngine/.test(stripComments(readFileSync(f, 'utf8'))));
    assert.deepStrictEqual(callers.map((f) => f.slice(ROOT.length + 1)), [CLIENT], 'executeEngine is defined, never called');
    const component = stripComments(read(COMPONENT));
    assert.match(component, /import \{ fetchEngines, type EngineListData \} from '\.\.\/\.\.\/api\/engines\.js';/);
    assert.strictEqual(/executeEngine|\/execute|fetch\(|authFetch/.test(component), false, 'surface only lists');
    // No other server module serves /api/engines, and the dev proxy is unchanged (8788 via /api).
    const serverFiles = listFiles(resolve(ROOT, 'frontend/server')).filter((f) => /\.ts$/.test(f) && !f.endsWith(SERVER));
    for (const f of serverFiles) assert.strictEqual(readFileSync(f, 'utf8').includes('/api/engines'), false, `${f} does not serve engines`);
    assert.strictEqual(read('vite.config.ts').includes('engines'), false, 'no new proxy rule (R-1 topology unchanged)');
  });
});

describe('Gate 2 — /research/engines route and navigation', () => {
  it('ER-05: /research/engines is registered and mounts the recovered donor EngineRegistry', () => {
    assert.strictEqual(ROUTES.researchEngines, '/research/engines');
    const app = stripComments(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.researchEngines\} element=\{<EngineRegistry \/>\} \/>/);
    assert.match(app, /import \{ EngineRegistry \} from '\.\.\/features\/engines\/EngineRegistry\.js';/);
    const html = renderAt('/research/engines');
    assert.ok(html.includes('app-shell'), 'rendered inside the shell');
    assert.ok(html.includes('data-testid="state-loading"'), 'donor loader mounted (SSR loading state)');
    assert.strictEqual(html.includes('structural-surface-unavailable'), false);
    assert.ok(renderToString(React.createElement(RouterDom.MemoryRouter, {}, React.createElement(EngineRegistry))).includes('state-loading'),
      'before any payload the surface is Loading, never data');
  });

  it('ER-06: the shipped surface renders the served registry and fails closed otherwise', () => {
    const served = json(handleResearchSectorRequest('/api/engines').body) as Served;
    const html = renderSeeded({ data: served, error: null, loading: false });
    assert.ok(html.includes('Certified Engine Registry'));
    for (const id of EXPECTED_IDS) assert.ok(html.includes(`<code>${id}</code>`), `${id} rendered`);
    assert.strictEqual((html.match(/<code>sector\.[a-z-]+<\/code>/g) ?? []).length, 13, 'exactly 13 engines rendered');
    for (const id of FORBIDDEN_IDS) assert.strictEqual(html.includes(`<code>${id}</code>`), false, `${id} not rendered`);
    assert.ok(html.includes('data-testid="engine-registry-provenance"'));
    // SSR splits adjacent text nodes with `<!-- -->`; normalise before matching the donor sentence.
    assert.ok(html.replace(/<!-- -->/g, '').includes('13 engines · freshness FROZEN'));
    assert.ok(html.replace(/<!-- -->/g, '').includes('(NOT B1-certified)'), 'the served provenance qualification is visible');
    const failed = renderSeeded({ data: null, error: 'Error: engines transport returned 404', loading: false });
    assert.ok(failed.includes('data-testid="state-error"') && failed.includes('Unable to load engine registry'));
    assert.ok(renderSeeded({ data: null, error: null, loading: false }).includes('data-testid="state-unavailable"'), 'no payload -> Unavailable');
    const empty = { ...served, engines: [] };
    assert.ok(renderSeeded({ data: empty, error: null, loading: false }).includes('data-testid="state-unavailable"'), 'empty registry -> Unavailable, nothing fabricated');
    assert.ok(renderSeeded({ data: null, error: null, loading: true }).includes('data-testid="state-loading"'));
  });

  it('ER-07: navigation carries the donor Engines entry as `partial`, right after Cross-Sector', () => {
    const research = NAV.find((n) => n.label === 'Research');
    assert.ok(research);
    const kids = research!.children ?? [];
    const idx = kids.findIndex((c) => c.path === '/research/engines');
    assert.deepStrictEqual(kids[idx], { label: 'Engines', path: '/research/engines', minRole: 'viewer', status: 'partial' });
    assert.strictEqual(kids[idx - 1]?.path, '/research/cross-sector', 'donor placement (286f3da): after Cross-Sector');
    const all = NAV.flatMap((n) => [n, ...(n.children ?? [])]);
    assert.strictEqual(all.filter((i) => i.path === '/research/engines').length, 1);
    assert.strictEqual(all.some((i) => i.status === 'implemented' && i.path === '/research/engines'), false, 'never implemented');
  });
});

describe('Gate 2 — donor fidelity and certification boundary', () => {
  it('ER-08: Gate 1 recovered files — client/component unchanged; registry/adapter differ from donor ONLY by the Gate B hunks', () => {
    // RAMKI Decision 3: the donor pins for EngineRegistry.ts / EngineApiAdapter.ts are retired for the bounded
    // Gate B change and replaced by B1 assertions — the current B1 blobs are pinned, and reversing exactly
    // the Gate B hunks must still reproduce the donor 286f3da blobs byte-for-byte.
    assert.strictEqual(gitBlob(read('iips-platform/src/integration/EngineApiAdapter.ts')), '1e9d649ca020b059a94a70acffaac641b8eda4c6', 'B1 Gate B adapter blob');
    assert.strictEqual(gitBlob(read('iips-platform/src/integration/EngineRegistry.ts')), 'df1c2d3f0879327c24dcde67018964bc2667b13a', 'B1 Gate B registry blob');
    assert.strictEqual(gitBlob(revertGateB('iips-platform/src/integration/EngineApiAdapter.ts')), '16cf2aebeac80bc874c67dd892ba98c9baffdbbe',
      'adapter = donor + Gate B provenance hunks only (ENGINE_FACTORY / execute() unchanged)');
    assert.strictEqual(gitBlob(revertGateB('iips-platform/src/integration/EngineRegistry.ts')), '23f3622f381bef2d0b19a6eea69386bf6feccecd',
      'registry = donor + Gate B hunks only (the existing 10 entries byte-unchanged)');
    assert.strictEqual(gitBlob(read(CLIENT)), '27a5bb3b24eb7dd3774dd1c0a19014a163ae6078');
    assert.strictEqual(gitBlob(read(COMPONENT)), '77a09ed41c1206814249c54f3e96c79e5b0acb36');
    const donorForm = read(COMPONENT).replace(/^(import .* from '\.[^']+)\.js';$/gm, "$1';");
    assert.strictEqual(gitBlob(donorForm), '0ad0af7ee061aaebc8e0215e5e4fb662aed03e52', 'only the .js suffixes differ from the donor');
  });

  it('ER-09: B1 wiring documents the boundary — no E2E-030 inheritance, execution dormant', () => {
    const server = read(SERVER);
    assert.match(server, /B1 does NOT inherit\s+\/\/ E2E-030 certification/);
    assert.match(server, /PRESENT \/ NOT EXPOSED \/ NOT ROUTED \/ NOT CALLED \/ NOT AUTHORIZED/);
    assert.match(read('frontend/src/app/navigation.ts'), /B1 does not inherit E2E-030; Windows\/browser qualification is a separate gate/);
  });
});

describe('Gate B — three-engine registry adoption (IES-016 / IES-017 / IES-020)', () => {
  it('ER-10: every registered engine resolves to its existing B1 engine module ID (13/13; 006…015 unchanged)', () => {
    assert.deepStrictEqual(CERTIFIED_ENGINES.map((e) => e.engineId), MODULE_IDS, 'entry engineId === engine-module constant');
    assert.deepStrictEqual(MODULE_IDS, [...EXPECTED_IDS]);
    for (const id of EXPECTED_IDS) {
      assert.strictEqual(isCertifiedEngine(id), true, `${id} registered`);
      assert.strictEqual(getEngineEntry(id)?.engineId, id, `${id} resolves`);
      assert.strictEqual(getEngineForSector(getEngineEntry(id)!.sectorFamily)?.engineId, id, `${id} resolves by sectorFamily`);
    }
    for (const id of FORBIDDEN_IDS) {
      assert.strictEqual(isCertifiedEngine(id), false, `${id} (D42) not registered`);
      assert.strictEqual(getEngineEntry(id), undefined);
    }
  });

  it('ER-11: the three adopted entries match their recovered freeze manifests and ontology metadata', () => {
    for (const id of GATEB_IDS) {
      const e = getEngineEntry(id)!;
      const pack = GATEB_PACKS[id]!;
      assert.strictEqual(e.freezeManifest, `${pack.dir}/${e.ies}_FREEZE_MANIFEST.json`);
      const manifest = JSON.parse(read(e.freezeManifest)) as { standard: string; title: string; status: string; calibrationProfile: string; methodologyVersion: string };
      assert.strictEqual(manifest.standard, e.ies, `${id} IES`);
      assert.strictEqual(manifest.title, e.iesTitle, `${id} title`);
      assert.strictEqual(manifest.status, 'FROZEN');
      assert.strictEqual(manifest.calibrationProfile, e.calibrationProfile, `${id} calibration profile`);
      assert.ok(manifest.methodologyVersion.startsWith(`${e.ies} v1.0 `), `${id} methodology ${e.ies} v1.0`);
      const ontology = JSON.parse(read(`${pack.dir}/${pack.ontology}`)) as { engineId: string; standard: string; sectorFamily: string; ontology: Record<string, string> };
      assert.strictEqual(ontology.engineId, id, `${id} ontology engineId`);
      assert.strictEqual(ontology.standard, e.ies);
      assert.strictEqual(ontology.sectorFamily, e.sectorFamily);
      assert.strictEqual(Object.keys(ontology.ontology).length, e.ontologyDimensions);
      assert.ok(statSync(resolve(ROOT, e.readinessCertificate)).isFile(), `${e.readinessCertificate} exists (historical, unmodified)`);
      assert.strictEqual(getCertificationLineage(id), GATEB_LINEAGE);
    }
    for (const id of LTS_IDS) assert.strictEqual(getCertificationLineage(id), LTS_LINEAGE);
  });

  it('ER-12: execution stays dormant — the adopted engines have no factory; the execute path fails closed', () => {
    for (const id of GATEB_IDS) assert.throws(() => makeCertifiedEngine(id), /^Error: factory-missing: /, `${id} not executable`);
    for (const id of [...FORBIDDEN_IDS, 'sector.unknown']) assert.throws(() => makeCertifiedEngine(id), /uncertified-capability/);
    for (const id of GATEB_IDS) {
      const r = handleResearchSectorRequest(`/api/engines/${id}/execute`, 'GET');
      assert.strictEqual(r.status, 404, `${id}: no execute route`);
      assert.strictEqual(handleResearchSectorRequest(`/api/engines/${id}/execute`, 'POST').status, 405);
    }
  });
});
