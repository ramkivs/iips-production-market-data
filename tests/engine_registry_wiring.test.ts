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
import { CERTIFIED_ENGINES } from '../iips-platform/src/integration/EngineRegistry.js';

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

/** The exact certified 10-engine set, in registry order, as read from the recovered donor registry. */
const EXPECTED_IDS = [
  'sector.banking', 'sector.insurance', 'sector.capital-markets', 'sector.healthcare', 'sector.hospitality',
  'sector.energy', 'sector.utilities', 'sector.consumer', 'sector.industrials', 'sector.technology',
] as const;
const EXPECTED_IES = ['IES-006', 'IES-007', 'IES-008', 'IES-009', 'IES-010', 'IES-011', 'IES-012', 'IES-013', 'IES-014', 'IES-015'];
/** D42 13-engine extension IDs (iips-review-recovered 6a5d7cc) and B1's differently-identified engines. */
const FORBIDDEN_IDS = ['sector.telecom', 'sector.auto', 'sector.materials',
  'sector.telecommunications', 'sector.automobile', 'sector.materials-metals'];

const SERVER = 'frontend/server/research-sector-transport.ts';
const CLIENT = 'frontend/src/api/engines.ts';
const COMPONENT = 'frontend/src/features/engines/EngineRegistry.tsx';

interface Served { apiVersion: string; engines: Array<{ engineId: string; ies: string }>; provenance: { certifiedCount: number; freshness: string; source: string } }

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

describe('Gate 2 — GET /api/engines (read-only, certified 10-engine registry)', () => {
  it('ER-01: GET /api/engines returns 200 with exactly the recovered donor registry projection', () => {
    const res = handleResearchSectorRequest('/api/engines', 'GET');
    assert.strictEqual(res.status, 200);
    const body = json(res.body) as Served;
    assert.deepStrictEqual(body, json(new EngineApiAdapter().listEngines()), 'donor listEngines() serialized as-is');
    assert.deepStrictEqual(body.engines, json(CERTIFIED_ENGINES.map((e) => ({
      engineId: e.engineId, ies: e.ies, iesTitle: e.iesTitle, sectorFamily: e.sectorFamily, engineVersion: e.engineVersion,
      secVersion: e.secVersion, semcVersion: e.semcVersion, calibrationProfile: e.calibrationProfile,
      calibrationVersion: e.calibrationVersion, capabilities: e.capabilities,
    }))), 'entries are CERTIFIED_ENGINES 1:1 — no normalization, scoring or transformation');
    assert.strictEqual(body.apiVersion, '1.0');
  });

  it('ER-02: exactly the 10 certified engines (IES-006…015), IDs and order unchanged; no D42 IDs', () => {
    const body = json(handleResearchSectorRequest('/api/engines').body) as Served;
    assert.deepStrictEqual(body.engines.map((e) => e.engineId), [...EXPECTED_IDS]);
    assert.deepStrictEqual(body.engines.map((e) => e.ies), EXPECTED_IES);
    assert.deepStrictEqual(CERTIFIED_ENGINES.map((e) => e.engineId), [...EXPECTED_IDS], 'registry source itself is the 10-engine scope');
    assert.strictEqual(body.provenance.certifiedCount, 10);
    assert.strictEqual(body.provenance.freshness, 'FROZEN');
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
    assert.ok(html.includes('data-testid="engine-registry-provenance"'));
    // SSR splits adjacent text nodes with `<!-- -->`; normalise before matching the donor sentence.
    assert.ok(html.replace(/<!-- -->/g, '').includes('10 engines · freshness FROZEN'));
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
  it('ER-08: the Gate 1 recovered files are unchanged (donor 286f3da blobs; tsx = .js suffixes only)', () => {
    assert.strictEqual(gitBlob(read('iips-platform/src/integration/EngineApiAdapter.ts')), '16cf2aebeac80bc874c67dd892ba98c9baffdbbe');
    assert.strictEqual(gitBlob(read('iips-platform/src/integration/EngineRegistry.ts')), '23f3622f381bef2d0b19a6eea69386bf6feccecd');
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
