/**
 * Test Suite: B1 CROSS-SECTOR RECOVERY — /research/cross-sector.
 *
 * Scope (authorized B1 gate): the proven donor Cross-Sector Intelligence surface
 * (`frontend/src/features/cross-sector/CrossSectorIntelligence.tsx`, donor TIP blob
 * e811c57d86ed65f51809d53096c20e1adacba89f — carries the D89 degraded-data guard) and its donor
 * client (`frontend/src/api/crossSector.ts`, blob d03631ad1d095b1474a9787613c15cb5303813f6) are
 * restored. The data authority is a FIFTH endpoint on the EXISTING 8788 Research/Sector SNAPSHOT
 * authority — GET /api/cross-sector — which is the donor `computeCertifiedCrossSector()` mapping
 * (donor lineage da43051, frontend/server/executive-transport.ts L510–541) restored VERBATIM over
 * the SAME already-imported `computeCertifiedPlatform()` CSIP output. No new computation, no new
 * normalization, no data-mode / principal dispatch, no identity, no provider.
 * Adaptations: NodeNext `.js` specifiers (client + component); in the server mapping, two
 * type-only `: any` parameter annotations (emitted JS unchanged — asserted below).
 *
 * Behaviour is verified against the SHIPPED source without a DOM (PU-22 forbids jsdom /
 * @testing-library): the SHIPPED component module is transpiled and executed with the real React
 * renderer; only `useState` is seeded, in the donor's own declaration order (asserted), so every
 * render branch (loading / error / unavailable / D89 degraded / view / trust chain) is exercised
 * by the donor's own code — the tests never re-implement the surface.
 *
 * What is asserted:
 *   CS-01  donor identity: component + client are the donor blobs exactly (after `.js` strip);
 *   CS-02  server mapping = donor L510–541 verbatim (type-only annotation; emit identical);
 *   CS-03  the endpoint exists on the 8788 authority; GET → 200;
 *   CS-04  non-GET → 405; `asOf` → 400 (verbatim refusal); unknown params → 400; bad path → 404;
 *   CS-05  SNAPSHOT only: no mode / degraded / PIT field; deterministic; no principal dispatch;
 *   CS-06  forensic parity: the response equals the captured donor Cross-Sector object
 *          (42f91fad AND 7964fcc captures) — in-process AND over real HTTP;
 *   CS-07  no fabricated fields: exact key sets, every value traces 1:1 to the platform;
 *   CS-08  client: one relative GET via authFetch, no new auth requirement, failure rejects;
 *   CS-09  component renders the certified payload (donor view) via transpile-and-run;
 *   CS-10  fail-closed order, D89 guard, trust chain with replay NOT VERIFIED;
 *   CS-11  /research/cross-sector wiring; routes.ts unchanged; placeholder factory removed;
 *   CS-12  navigation: Cross-Sector = `partial`; every other entry unchanged;
 *   CS-13  A1–A4 unaffected: the other four authorities are byte-identical in source (reconstructed
 *          baseline hash) and in behaviour; A1–A4 routes still mount their restored surfaces;
 *   CS-14  PU-22 stays authoritative; existing colour tokens only; no new dependency.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
import { CrossSectorIntelligence } from '../frontend/src/features/cross-sector/CrossSectorIntelligence.js';
import { fetchCrossSectorData, type CrossSectorData } from '../frontend/src/api/crossSector.js';
import * as DataModeApi from '../frontend/src/api/dataMode.js';
import * as CrossSectorApi from '../frontend/src/api/crossSector.js';
import * as EvidenceApi from '../frontend/src/api/evidence.js';
import * as ReplayApi from '../frontend/src/api/replay.js';
import * as DataModeUnavailableMod from '../frontend/src/components/state/DataModeUnavailable.js';
import * as DataComponents from '../frontend/src/components/data/DataComponents.js';
import * as DecisionComponents from '../frontend/src/components/decision/DecisionComponents.js';
import * as ChartFoundations from '../frontend/src/components/viz/ChartFoundations.js';
import * as InteractionComponents from '../frontend/src/components/interaction/InteractionComponents.js';
import * as StateComponents from '../frontend/src/components/state/StateComponents.js';
import * as Badges from '../frontend/src/components/ui/Badges.js';
import * as CompanyTrustChainMod from '../frontend/src/features/company/CompanyTrustChain.js';
import { computeCertifiedPlatform } from '../src/transports/executive_transport.js';
// GROUP 1 / GATE 2 (superseded pins): prior pins are verified against the files with ONLY the exact
// Gate 2 Engine Registry additions removed (the helper throws unless each block is present exactly once).
import { preGate2, preGate2Sha } from './engine_registry_gate2_baseline.js';
import {
  ASOF_REFUSED_UNDER_SNAPSHOT,
  computeCertifiedCompany,
  computeCertifiedCrossSector,
  computeCertifiedDecisionMatrix,
  computeCertifiedEvidence,
  computeCertifiedReplay,
  createResearchSectorServer,
  handleResearchSectorRequest,
} from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const strip = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const decode = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const text = (html: string): string => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ''));
const json = <T,>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;
const sha256 = (s: string | Buffer): string => createHash('sha256').update(s).digest('hex');
const shaFile = (rel: string): string => sha256(readFileSync(resolve(ROOT, rel)));
/** Git blob id of a text (what `git hash-object` reports) — self-contained, no git needed. */
const gitBlob = (s: string): string => {
  const buf = Buffer.from(s, 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');
};
const stripJsSuffix = (src: string): string => src.replace(/^(import .* from '\.[^']+)\.js';$/gm, "$1';");
function slice(s: string, from: string, to: string): string {
  const i = s.indexOf(from);
  if (i < 0) throw new Error(`source anchor missing: ${from}`);
  const j = s.indexOf(to, i + from.length);
  if (j < 0) throw new Error(`source anchor missing: ${to}`);
  return s.slice(i + from.length, j);
}

const COMPONENT = 'frontend/src/features/cross-sector/CrossSectorIntelligence.tsx';
const CLIENT = 'frontend/src/api/crossSector.ts';
const SERVER = 'frontend/server/research-sector-transport.ts';
const FORENSIC = (tag: string): string => `forensic-evidence/executive-live-reexecution-20260924/raw-${tag}-platform-companion.json`;

const COMPONENT_BLOB = 'e811c57d86ed65f51809d53096c20e1adacba89f';
const CLIENT_BLOB = 'd03631ad1d095b1474a9787613c15cb5303813f6';
/** sha256 of donor da43051:frontend/server/executive-transport.ts L510–541 (`function` → `export function`). */
const DONOR_MAPPING_SHA = '209859519c914d64a56e98e2e8fbb29a0a2872bf6c8f17a0acb0ce3c5dd7f6cf';
/** A4 baseline (1ab8614) hashes of the three files B1 edits — used for exact reconstruction. */
const BASELINE_SERVER_SHA = '373585c1fc6432b1dd39e813c4c57340a760b8be66b426821338eb71b906b785';
const BASELINE_APP_SHA = 'd1710040436d266ca8da9f57e529cb7566c7e0e7b13060a22d49a9bc7746c6e1';
const BASELINE_NAV_SHA = 'e7fbd2a53b8243708d6c6a7b44155235c055473d8646fb6569c62ee7d8a2e4c5';

const PAYLOAD = json<CrossSectorData>(computeCertifiedCrossSector());
const SRC = read(COMPONENT);
const SERVER_SRC = read(SERVER);

/* ── Shipped-source execution (no re-implementation) ─────────────────────────────────────── */
/** The donor's own useState declaration order, read from the shipped source. */
const STATE_ORDER = [...SRC.matchAll(/const \[(\w+), set\w+\] = useState/g)].map((m) => m[1]!);
const MODULES: Record<string, unknown> = {
  'react/jsx-runtime': JsxRuntime,
  'react-router-dom': RouterDom,
  '../../api/dataMode.js': DataModeApi,
  '../../components/state/DataModeUnavailable.js': DataModeUnavailableMod,
  '../../api/crossSector.js': CrossSectorApi,
  '../../api/evidence.js': EvidenceApi,
  '../../api/replay.js': ReplayApi,
  '../../components/data/DataComponents.js': DataComponents,
  '../../components/decision/DecisionComponents.js': DecisionComponents,
  '../../components/viz/ChartFoundations.js': ChartFoundations,
  '../../components/interaction/InteractionComponents.js': InteractionComponents,
  '../../components/state/StateComponents.js': StateComponents,
  '../../components/ui/Badges.js': Badges,
  '../company/CompanyTrustChain.js': CompanyTrustChainMod,
};
const COMPILED = ts.transpileModule(SRC, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
/** Render the SHIPPED component with `useState` seeded by name; effects are inert (no fetch). */
function renderSeeded(seed: Record<string, unknown>): string {
  for (const k of Object.keys(seed)) {
    if (!STATE_ORDER.includes(k)) throw new Error(`unknown donor state: ${k}`);
  }
  let i = 0;
  const hooks = {
    ...React,
    useState: (init: unknown) => {
      const name = STATE_ORDER[i++];
      if (name === undefined) throw new Error('useState call beyond the donor declarations');
      return [name in seed ? seed[name] : init, () => undefined];
    },
    useEffect: () => undefined,
    useMemo: (f: () => unknown) => f(),
  };
  const req = (id: string): unknown => {
    if (id === 'react') return hooks;
    if (!(id in MODULES)) throw new Error(`unexpected import in shipped component: ${id}`);
    return MODULES[id];
  };
  const exports: Record<string, unknown> = {};
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('require', 'exports', COMPILED)(req, exports);
  const Component = exports.CrossSectorIntelligence as () => React.ReactElement;
  const element = Component();
  if (i !== STATE_ORDER.length) throw new Error(`donor declared ${STATE_ORDER.length} states, ${i} were consumed`);
  return renderToString(React.createElement(RouterDom.MemoryRouter, {}, element));
}
const VIEW = { data: PAYLOAD, loading: false };

const renderAt = (path: string): string =>
  renderToString(
    React.createElement(RouterDom.MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));
const rankingSectors = (html: string): string[] => {
  const body = slice(html, 'aria-label="Sort ranking"', 'Decision Distribution');
  return [...body.matchAll(/data-testid="inspect-([^"]+)"/g)].map((m) => decode(m[1]!));
};

describe('B1 Cross-Sector — donor identity and server mapping fidelity', () => {
  it('CS-01: component and client are the donor blobs exactly (only `.js` specifiers added)', () => {
    assert.strictEqual(gitBlob(stripJsSuffix(SRC)), COMPONENT_BLOB, 'component = donor tip blob e811c57d');
    assert.strictEqual(gitBlob(stripJsSuffix(read(CLIENT))), CLIENT_BLOB, 'client = donor blob d03631ad');
    // The only adaptation is the suffix on RELATIVE specifiers; package specifiers are untouched.
    const imports = [...SRC.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports.filter((s) => !s.startsWith('.')), ['react', 'react-router-dom']);
    assert.ok(imports.filter((s) => s.startsWith('.')).every((s) => s.endsWith('.js')), 'every relative import is NodeNext');
    assert.strictEqual(imports.length, 14);
    for (const rel of [...imports.filter((s) => s.startsWith('.'))]) {
      const target = resolve(ROOT, COMPONENT, '..', rel.replace(/\.js$/, ''));
      assert.ok(existsSync(`${target}.ts`) || existsSync(`${target}.tsx`), `${rel} resolves at HEAD`);
    }
    const clientImports = [...read(CLIENT).matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(clientImports, ['../components/decision/DecisionComponents.js', './executive.js', './authFetch.js']);
  });

  it('CS-02: server mapping is donor L510–541 VERBATIM; the annotation is type-only (emit identical)', () => {
    const fn = 'export function computeCertifiedCrossSector' + slice(SERVER_SRC, 'export function computeCertifiedCrossSector', '\n}\n') + '\n}\n';
    const annotations = [...fn.matchAll(/\((\w): any\) =>/g)].map((m) => m[1]);
    assert.deepStrictEqual(annotations, ['r', 'o'], 'exactly the two current-lineage annotations (executive_transport.ts precedent)');
    const donorForm = fn.replace('(r: any) =>', '(r) =>').replace('(o: any) =>', '(o) =>');
    assert.strictEqual(sha256(donorForm), DONOR_MAPPING_SHA, 'mapping text = donor L510–541');
    const emit = (s: string): string => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    assert.strictEqual(emit(fn), emit(donorForm), 'emitted JavaScript identical to the donor');
    // Same CSIP source as the other four authorities: the single existing platform import.
    const imports = [...preGate2(SERVER, SERVER_SRC).matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['node:http', '../../src/transports/executive_transport.js']);
    // GROUP 1 / GATE 2 (superseded): the ONLY added import is the recovered Engine Registry adapter.
    assert.deepStrictEqual([...SERVER_SRC.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!),
      ['node:http', '../../src/transports/executive_transport.js', '../../iips-platform/src/integration/EngineApiAdapter.js']);
    assert.match(fn, /const \{ engineOutputs, csip: pr \} = computeCertifiedPlatform\(\);/);
  });
});

describe('B1 Cross-Sector — GET /api/cross-sector on the 8788 SNAPSHOT authority', () => {
  it('CS-03: the endpoint exists and GET answers 200 with the certified mapping', () => {
    for (const m of [undefined, 'GET', 'get']) {
      const r = handleResearchSectorRequest('/api/cross-sector', m);
      assert.strictEqual(r.status, 200, `method ${String(m)}`);
      assert.deepStrictEqual(json(r.body), PAYLOAD);
    }
    assert.match(strip(SERVER_SRC), /if \(path === '\/api\/cross-sector'\) \{\n\s+return Object\.freeze\(\{ status: 200 as const, body: computeCertifiedCrossSector\(\) \}\);/);
  });

  it('CS-04: non-GET 405; asOf 400 (verbatim); unknown params 400; malformed paths 404', () => {
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
      const r = handleResearchSectorRequest('/api/cross-sector', m);
      assert.strictEqual(r.status, 405, m);
      assert.deepStrictEqual(r.body, { error: 'method-not-allowed', allowed: 'GET' });
    }
    for (const q of ['asOf=2026-01-01', 'asOf=', 'asOf=2026-01-01&asOf=2026-02-01', 'x=1&asOf=2026-01-01']) {
      const r = handleResearchSectorRequest(`/api/cross-sector?${q}`);
      assert.strictEqual(r.status, 400, q);
      assert.deepStrictEqual(r.body, { error: ASOF_REFUSED_UNDER_SNAPSHOT }, `asOf refused, never ignored: ${q}`);
    }
    for (const q of ['portfolioId=X', 'scenario=Growth', 'topN=5', 'mode=PIT']) {
      const r = handleResearchSectorRequest(`/api/cross-sector?${q}`);
      assert.strictEqual(r.status, 400, q);
      assert.match(String((r.body as { error: string }).error), /SNAPSHOT authorities accept no selection parameters/);
    }
    for (const p of ['/api/cross-sector/', '/api/cross-sector/Banking', '/api/cross-sectors', '/api/Cross-Sector', '/api/crosssector']) {
      assert.strictEqual(handleResearchSectorRequest(p).status, 404, p);
    }
  });

  it('CS-05: SNAPSHOT only — no mode, degraded or PIT field; deterministic; no principal dispatch', () => {
    const s = JSON.stringify(handleResearchSectorRequest('/api/cross-sector').body);
    assert.strictEqual(/"dataMode"|"dataAvailable"|"freshness":"PIT"|LIVE_UNAVAILABLE|PIT_UNAVAILABLE/.test(s), false);
    assert.strictEqual(PAYLOAD.provenance.freshness, 'SNAPSHOT');
    assert.strictEqual(PAYLOAD.provenance.calibratedAt, '2026-08-09T00:00:00.000Z');
    assert.strictEqual(JSON.stringify(computeCertifiedCrossSector()), JSON.stringify(computeCertifiedCrossSector()), 'deterministic');
    const code = strip(SERVER_SRC);
    for (const banned of ['dispatchForPrincipal', 'modePrincipal', 'dataMode.', 'ReportingEngine', '/api/macro', 'guardRead',
      'keycloak', 'Keycloak', 'oidc', 'OIDC', 'nse', 'NSE', 'dhan', 'Dhan', 'process.env', 'fetch(']) {
      assert.strictEqual(code.includes(banned), false, `no ${banned}`);
    }
  });

  it('CS-06: forensic parity — equals the captured donor Cross-Sector object, in-process and over HTTP', async () => {
    for (const tag of ['42f91fad', '7964fcc']) {
      const captured = (JSON.parse(read(FORENSIC(tag))) as { crossSector: unknown }).crossSector;
      assert.deepStrictEqual(PAYLOAD, captured, `in-process parity with the ${tag} capture`);
      assert.strictEqual(JSON.stringify(PAYLOAD), JSON.stringify(captured), `key order + values identical to ${tag}`);
    }
    const server = createResearchSectorServer();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/cross-sector`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-iips-surface'), 'research-sector-snapshot-authorities');
      assert.match(String(res.headers.get('x-iips-authentication')), /^NONE/);
      const body = await res.json();
      assert.deepStrictEqual(body, (JSON.parse(read(FORENSIC('42f91fad'))) as { crossSector: unknown }).crossSector, 'HTTP parity');
      const post = await fetch(`http://127.0.0.1:${port}/api/cross-sector`, { method: 'POST' });
      assert.strictEqual(post.status, 405);
      const asOf = await fetch(`http://127.0.0.1:${port}/api/cross-sector?asOf=2026-01-01`);
      assert.strictEqual(asOf.status, 400);
      assert.deepStrictEqual(await asOf.json(), { error: ASOF_REFUSED_UNDER_SNAPSHOT });
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('CS-07: no fabricated fields — exact key sets, every value is a 1:1 platform projection', () => {
    assert.deepStrictEqual(Object.keys(PAYLOAD), ['portfolio', 'diversification', 'ranking', 'opportunity', 'correlation', 'decisions', 'provenance']);
    assert.deepStrictEqual(Object.keys(PAYLOAD.portfolio),
      ['portfolioId', 'scenario', 'holdings', 'avgConviction', 'avgQuality', 'avgRisk', 'concentration', 'diversificationScore']);
    assert.deepStrictEqual(Object.keys(PAYLOAD.diversification), ['band', 'flags']);
    assert.deepStrictEqual(Object.keys(PAYLOAD.correlation), ['flags', 'concentrationSectors']);
    assert.deepStrictEqual(Object.keys(PAYLOAD.provenance), ['dataSource', 'freshness', 'calibratedAt', 'transportSemantics']);
    for (const r of [...PAYLOAD.ranking, ...PAYLOAD.opportunity]) assert.deepStrictEqual(Object.keys(r), ['companyId', 'sector', 'conviction']);
    for (const d of PAYLOAD.decisions) assert.deepStrictEqual(Object.keys(d), ['sector', 'verdict', 'composite', 'confidence']);
    // Independent projection from the platform — values are delivered, never re-derived.
    const { engineOutputs, csip } = computeCertifiedPlatform();
    const pr = csip as {
      intelligence: Record<string, unknown>; diversification: { diversificationBand: string; flags: string[] };
      ranking: Array<Record<string, unknown>>; opportunity: { top: Array<Record<string, unknown>> };
      correlation: { flags: string[]; concentrationSectors: string[] };
    };
    for (const k of Object.keys(PAYLOAD.portfolio)) {
      assert.deepStrictEqual((PAYLOAD.portfolio as Record<string, unknown>)[k], pr.intelligence[k], `portfolio.${k}`);
    }
    assert.strictEqual(PAYLOAD.diversification.band, pr.diversification.diversificationBand);
    assert.deepStrictEqual(PAYLOAD.diversification.flags, pr.diversification.flags);
    assert.deepStrictEqual(PAYLOAD.ranking.map((r) => [r.companyId, r.sector, r.conviction]), pr.ranking.map((r) => [r.companyId, r.sector, r.conviction]));
    assert.deepStrictEqual(PAYLOAD.opportunity.map((r) => [r.companyId, r.sector, r.conviction]), pr.opportunity.top.map((r) => [r.companyId, r.sector, r.conviction]));
    assert.deepStrictEqual(PAYLOAD.correlation, json(pr.correlation));
    assert.deepStrictEqual(PAYLOAD.decisions.map((d) => [d.sector, d.verdict, d.composite, d.confidence]),
      engineOutputs.map((o) => [o.sector, o.verdict, o.composite, o.confidence]));
    // Captured shape (reconciled against the forensic record).
    assert.strictEqual(PAYLOAD.portfolio.holdings, 13);
    assert.strictEqual(PAYLOAD.ranking.length, 13);
    assert.strictEqual(PAYLOAD.opportunity.length, 10);
    assert.strictEqual(PAYLOAD.decisions.length, 13);
  });
});

describe('B1 Cross-Sector — client', () => {
  it('CS-08: one relative GET via authFetch; no new auth requirement; non-OK rejects', async () => {
    const server = createResearchSectorServer();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    const calls: Array<{ url: string; auth: string | null }> = [];
    let fail = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      calls.push({ url: String(input), auth: new Headers(init?.headers).get('Authorization') });
      if (fail !== 0) return new Response('x', { status: fail });
      return original(`http://127.0.0.1:${port}${String(input)}`, init);
    }) as typeof fetch;
    try {
      assert.deepStrictEqual(await fetchCrossSectorData(), PAYLOAD, 'delivered exactly as served');
      assert.deepStrictEqual(calls, [{ url: '/api/cross-sector', auth: null }], 'relative URL; no token required or invented');
      for (const status of [400, 404, 405, 500, 503]) {
        fail = status;
        await assert.rejects(fetchCrossSectorData(), new RegExp(`cross-sector transport returned ${status}`));
      }
    } finally {
      globalThis.fetch = original;
      await new Promise<void>((r) => server.close(() => r()));
    }
    const code = strip(read(CLIENT));
    assert.strictEqual(/localhost|127\.0\.0\.1|878[78]|https?:\/\/|asOf|keycloak|oidc/i.test(code), false, 'no host, port, PIT or identity');
    assert.match(code, /authFetch\(`\$\{baseUrl\}\/api\/cross-sector`\)/);
  });
});

describe('B1 Cross-Sector — component (shipped source, transpile-and-run)', () => {
  it('CS-09: the donor view renders the certified payload — overview, ranking, distribution, opportunities, risks, chart, provenance', () => {
    assert.deepStrictEqual(STATE_ORDER,
      ['data', 'error', 'loading', 'sortKey', 'selectedSector', 'chainEvidence', 'chainReplay', 'chainLoading', 'chainError']);
    const html = renderSeeded(VIEW);
    const t = text(html);
    assert.match(html, /<h1[^>]*>Cross-Sector Intelligence<\/h1>/);
    assert.ok(t.includes(PAYLOAD.provenance.dataSource));
    // Overview: six metric cards, each the delivered value.
    const values = [...html.matchAll(/data-testid="metric-value"[^>]*>([^<]*)</g)].map((m) => decode(m[1]!));
    const p = PAYLOAD.portfolio;
    assert.deepStrictEqual(values, [p.holdings, p.avgConviction, p.avgQuality, p.avgRisk, p.concentration, p.diversificationScore].map(String));
    // Ranking: presentational sort only — conviction (default) or sector; same certified rows.
    const byConv = [...PAYLOAD.ranking].sort((a, b) => b.conviction - a.conviction).map((r) => r.sector);
    assert.deepStrictEqual(rankingSectors(html), byConv);
    const bySector = [...PAYLOAD.ranking].sort((a, b) => a.sector.localeCompare(b.sector)).map((r) => r.sector);
    assert.deepStrictEqual(rankingSectors(renderSeeded({ ...VIEW, sortKey: 'sector' })), bySector);
    for (const s of byConv) assert.ok(html.includes(`href="/research/company/${encodeURI(s).replace(/&/g, '&amp;')}"`) || html.includes(`href="/research/company/${s.replace(/&/g, '&amp;')}"`), `${s} links to company`);
    // Decision distribution: one badge per distinct certified verdict.
    const dist = slice(html, 'data-testid="decision-distribution"', '</div>');
    for (const v of new Set(PAYLOAD.decisions.map((d) => d.verdict))) assert.ok(text(dist).includes(v), `verdict ${v}`);
    // Opportunities: the certified top-N, in delivered order.
    const opp = slice(html, 'data-testid="cross-sector-opportunities"', '</ul>');
    assert.deepStrictEqual([...opp.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]!)),
      PAYLOAD.opportunity.map((o) => `${o.sector} — conviction ${o.conviction}`));
    // Risks: exactly the certified flags (or the honest empty line).
    const risks = [...slice(html, 'data-testid="cross-sector-risks"', '</ul>').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]!));
    const flags = [...PAYLOAD.correlation.flags, ...PAYLOAD.diversification.flags, ...PAYLOAD.correlation.concentrationSectors.map((s) => `Concentration: ${s}`)];
    assert.deepStrictEqual(risks, flags.length === 0 ? ['No risk flags'] : flags);
    // Chart: one bar per certified decision.
    for (const d of PAYLOAD.decisions) assert.ok(html.includes(`data-testid="bar-${d.sector.replace(/&/g, '&amp;')}"`), `bar ${d.sector}`);
    // Provenance footer.
    const footer = text(slice(html, 'data-testid="cross-sector-provenance"', '</p>').replace(/^[^>]*>/, ''));
    assert.strictEqual(footer, `${PAYLOAD.provenance.dataSource} · freshness SNAPSHOT`);
    assert.ok(html.includes('snapshot'), 'SNAPSHOT freshness badge');
    assert.strictEqual(html.includes('cross-sector-trust-chain'), false, 'no trust chain until a sector is selected');
  });

  it('CS-10: fail-closed order, D89 degraded guard, trust chain with replay NOT VERIFIED', () => {
    // Fail-closed branches, in donor order, before any payload dereference.
    const code = strip(SRC);
    const idx = ['if (loading) return <LoadingState />;', 'if (error) return <ErrorState', 'if (!data) return <UnavailableState />;',
      'if (isDegraded(data)) return <DataModeUnavailable', 'const { portfolio, diversification, opportunity, correlation, decisions, provenance } = data;']
      .map((s) => { const i = code.indexOf(s); assert.ok(i >= 0, s); return i; });
    assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, 'loading → error → unavailable → D89 → view');
    assert.ok(renderSeeded({}).includes('data-testid="state-loading"'), 'initial: loading');
    const err = renderSeeded({ loading: false, error: 'Error: cross-sector transport returned 503' });
    assert.ok(err.includes('data-testid="state-error"'));
    assert.ok(text(err).includes('Unable to load cross-sector data: Error: cross-sector transport returned 503'));
    assert.ok(renderSeeded({ loading: false }).includes('data-testid="state-unavailable"'), 'no payload: unavailable');
    for (const h of [err, renderSeeded({}), renderSeeded({ loading: false })]) {
      assert.strictEqual(/metric-card|cross-sector-provenance|decision-distribution/.test(h), false, 'no data rendered on a fail-closed branch');
    }
    // D89 guard: retained VERBATIM from the tip donor, placed before the SNAPSHOT destructure.
    assert.match(code, /if \(isDegraded\(data\)\) return <DataModeUnavailable data=\{data\} title="Cross-Sector Intelligence" \/>;/);
    // DISCLOSED DONOR BEHAVIOUR (not altered — the donor is authorized verbatim): the donor's
    // presentational useMemo hooks dereference `data.ranking` / `data.decisions` during render,
    // BEFORE the D89 guard (hooks cannot follow an early return). A degraded payload (which has no
    // `ranking`) would therefore throw in the donor before the guard is reached — in real React as
    // here. This is unreachable on this authority: /api/cross-sector is SNAPSHOT-only and never
    // emits `dataAvailable: false` (CS-05, RA-18). Asserted so the fact stays visible, not hidden.
    const degraded = { dataAvailable: false, dataMode: 'PIT', reason: 'PIT vintage unavailable', dependency: 'governed vintage store',
      provenance: { transportSemantics: 'degraded — no data' } };
    assert.ok(DataModeApi.isDegraded(degraded), 'the shared D89 discriminant recognises a degraded payload');
    assert.throws(() => renderSeeded({ loading: false, data: degraded }), /data\.ranking is not iterable/,
      'donor useMemo precedes the D89 guard (disclosed; unreachable under SNAPSHOT)');
    assert.ok(code.indexOf('const sortedRanking = useMemo(') < code.indexOf('if (isDegraded(data))'));
    assert.strictEqual(DataModeApi.isDegraded(PAYLOAD), false, 'the served payload is never degraded');
    // Trust chain: selected sector composes the existing evidence + replay authorities.
    const ev = json(computeCertifiedEvidence('Banking'));
    const rp = json(computeCertifiedReplay('Banking'));
    const chain = renderSeeded({ ...VIEW, selectedSector: 'Banking', chainEvidence: ev, chainReplay: rp });
    const section = slice(chain, 'data-testid="cross-sector-trust-chain"', 'Decision Distribution');
    assert.ok(text(section).includes('Trust Chain — Banking'));
    assert.ok(section.includes('data-testid="company-replay-equivalence"'));
    assert.match(text(section), /Reported byteIdentical: true — NOT VERIFIED/, 'replay stays NOT VERIFIED');
    assert.strictEqual(/\bverified\b(?! )/i.test(text(section).replace(/NOT VERIFIED/g, '')), false, 'no verification claimed');
    assert.ok(chain.includes('aria-pressed="true"') && text(chain).includes('Hide'), 'selected row toggles');
    assert.ok(renderSeeded({ ...VIEW, selectedSector: 'Banking', chainLoading: true }).includes('data-testid="state-loading"'));
    assert.ok(text(renderSeeded({ ...VIEW, selectedSector: 'Banking', chainError: 'Error: 404' })).includes('Unable to load sector evidence: Error: 404'));
    assert.match(code, /Promise\.all\(\[fetchEvidenceData\(selectedSector\), fetchReplayData\(selectedSector\)\]\)/);
    // No direct network / server import / PIT in the component.
    assert.strictEqual(/\bfetch\(|authFetch|localhost|127\.0\.0\.1|878[78]|asOf|computeCertified|frontend\/server|from 'node:/.test(code), false);
  });
});

describe('B1 Cross-Sector — route wiring and navigation', () => {
  it('CS-11: /research/cross-sector mounts the restored surface; routes.ts unchanged; placeholder removed', () => {
    assert.strictEqual(ROUTES.researchCrossSector, '/research/cross-sector');
    // GROUP 1 / GATE 2 (superseded): routes.ts gains ONLY `researchEngines`; the B1 pin holds once that is removed.
    assert.strictEqual(preGate2Sha(ROOT, 'frontend/src/app/routes.ts'), 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085', 'routes.ts byte-unchanged (pre-Gate 2)');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.researchCrossSector\} element=\{<CrossSectorIntelligence \/>\} \/>/);
    assert.match(app, /import \{ CrossSectorIntelligence \} from '\.\.\/features\/cross-sector\/CrossSectorIntelligence\.js';/);
    assert.strictEqual(app.includes('CrossSectorStructural'), false, 'no stale structural factory');
    const html = renderAt('/research/cross-sector');
    assert.ok(html.includes('app-shell'));
    assert.ok(html.includes('data-testid="state-loading"'), 'restored loader mounted (SSR loading state)');
    assert.strictEqual(html.includes('structural-surface-unavailable'), false);
    // Unit-level: before any payload the surface is Loading, never data.
    assert.ok(renderToString(React.createElement(RouterDom.MemoryRouter, {}, React.createElement(CrossSectorIntelligence))).includes('state-loading'));
  });

  it('CS-12: Cross-Sector navigation is `partial` (never implemented); all other entries unchanged', () => {
    const all = NAV.flatMap((item) => [item, ...(item.children ?? [])]);
    const cs = all.filter((i) => i.path === '/research/cross-sector');
    assert.deepStrictEqual(cs, [{ label: 'Cross-Sector', path: '/research/cross-sector', minRole: 'viewer', status: 'partial' }]);
    const census = (s: string): number => all.filter((i) => i.status === s).length;
    assert.deepStrictEqual({ total: all.length, implemented: census('implemented'), partial: census('partial'), unavailable: census('unavailable'), future: census('future') },
      // GROUP 1 / GATE 2 (superseded): +1 `partial` entry (Engines, /research/engines); total 32 -> 33,
      // partial 11 -> 12. Every other count is unchanged.
      { total: 33, implemented: 3, partial: 12, unavailable: 14, future: 4 }, 'only Cross-Sector moved unavailable → partial (+ Gate 2 Engines)');
    // navigation.ts: reverting ONLY the B1 edit reproduces the A4 baseline byte-for-byte.
    const nav = preGate2('frontend/src/app/navigation.ts', read('frontend/src/app/navigation.ts'));
    const reverted = nav.replace(
      "      // B1 Cross-Sector restoration: the donor surface is restored on the existing 8788 SNAPSHOT\n" +
      "      // authority (/api/cross-sector + evidence / replay) -> `partial` (never `implemented`).\n" +
      "      { label: 'Cross-Sector', path: '/research/cross-sector', minRole: 'viewer', status: 'partial' },",
      "      { label: 'Cross-Sector', path: '/research/cross-sector', minRole: 'viewer', status: 'unavailable' },");
    assert.notStrictEqual(reverted, nav, 'B1 nav edit located');
    assert.strictEqual(sha256(reverted), BASELINE_NAV_SHA, 'no other navigation change');
  });
});

describe('B1 Cross-Sector — A1–A4 unaffected', () => {
  it('CS-13a: removing ONLY the B1 additions reproduces the A4 server byte-for-byte (other authorities untouched)', () => {
    // GROUP 1 / GATE 2 (superseded): start from the server with ONLY the exact Gate 2 additions removed.
    const SERVER_SRC = preGate2(SERVER, read(SERVER));
    const header = slice(SERVER_SRC, ' *   GET /api/replay/:id           → computeCertifiedReplay()           FIXTURE (D79)\n *\n', ' * ══ WHAT THIS MODULE IS');
    assert.match(header, /^ \*  B1 CROSS-SECTOR RECOVERY/);
    // The B1 block runs from its section separator to the next section separator.
    const marker = SERVER_SRC.indexOf(' * B1 Cross-Sector (CSIP) authority');
    const blockStart = SERVER_SRC.lastIndexOf('/* ─', marker);
    const blockEnd = SERVER_SRC.indexOf('/* ─', SERVER_SRC.indexOf('export function computeCertifiedCrossSector', marker));
    assert.ok(marker > 0 && blockStart > 0 && blockEnd > blockStart);
    let base = SERVER_SRC.slice(0, blockStart) + SERVER_SRC.slice(blockEnd);
    base = base.replace(header, '');
    const dispatch = "    if (path === '/api/cross-sector') {\n      return Object.freeze({ status: 200 as const, body: computeCertifiedCrossSector() });\n    }\n";
    assert.ok(base.includes(dispatch));
    base = base.replace(dispatch, '');
    assert.strictEqual(sha256(base), BASELINE_SERVER_SHA, 'server = A4 baseline + B1 additions only');
  });

  it('CS-13b: the other four authorities behave exactly as before; A1–A4 routes still mount their surfaces', () => {
    assert.deepStrictEqual(json(handleResearchSectorRequest('/api/decision-matrix').body), json(computeCertifiedDecisionMatrix()));
    assert.deepStrictEqual(json(handleResearchSectorRequest('/api/company/Banking').body), json(computeCertifiedCompany('Banking')));
    assert.deepStrictEqual(json(handleResearchSectorRequest('/api/evidence/Banking').body), json(computeCertifiedEvidence('Banking')));
    assert.deepStrictEqual(json(handleResearchSectorRequest('/api/replay/Banking').body), json(computeCertifiedReplay('Banking')));
    assert.strictEqual(handleResearchSectorRequest('/api/nothing').status, 404);
    assert.strictEqual(handleResearchSectorRequest('/api/decision-matrix?asOf=2026-01-01').status, 400);
    const app = strip(read('frontend/src/app/App.tsx'));
    for (const re of [
      /ROUTES\.intelligenceDecisionMatrix\} element=\{<DecisionMatrix \/>\}/, // A1
      /element=\{<EvidenceHub \/>\}/, /element=\{<EvidenceExplorer \/>\}/, /element=\{<ReplayExplorer \/>\}/, // A2
      /<Route path=\{ROUTES\.researchEvents\} element=\{<ResearchEvents \/>\} \/>/, // A3
      /<Route path=\{ROUTES\.screener\} element=\{<Screener \/>\} \/>/, // A4
      /<Route path=\{ROUTES\.researchMacro\} element=\{<MacroStructural \/>\} \/>/, // Macro stays excluded
    ]) assert.match(app, re);
    // App.tsx: reverting ONLY the B1 edits reproduces the A4 baseline byte-for-byte.
    const raw = preGate2('frontend/src/app/App.tsx', read('frontend/src/app/App.tsx'));
    const reverted = raw
      .replace(
        "// B1 CROSS-SECTOR RECOVERY: the proven donor Cross-Sector Intelligence surface (tip blob\n" +
        "// e811c57d, D89 guard retained) is restored at /research/cross-sector, reading the existing\n" +
        "// 8788 SNAPSHOT authority's /api/cross-sector plus /api/evidence/:sector and /api/replay/:sector\n" +
        "// over HTTP (no server import).\n" +
        "import { CrossSectorIntelligence } from '../features/cross-sector/CrossSectorIntelligence.js';\n", '')
      .replace(
        " * B1 Cross-Sector restoration: Cross-Sector has since been recovered by its own gate — the\n" +
        " * `CrossSectorStructural` factory is removed and the route mounts the donor surface, which\n" +
        " * fails closed (Loading / Error / Unavailable). No cross-sector data is fabricated.\n", '')
      .replace(
        "// Donor research children (structure only — no UISurfaceId, no UI03 identity claim).\n",
        "// Donor research children (structure only — no UISurfaceId, no UI03 identity claim).\n" +
        "const CrossSectorStructural = structural(\n" +
        "  'Research — Cross-Sector',\n" +
        "  'Cross-Sector Intelligence requires the platform research services, which are not active offline',\n" +
        "  'Donor structure: features/cross-sector/CrossSectorIntelligence (API-coupled in the donor lineage). No cross-sector data is fabricated.'\n" +
        ");\n")
      .replace('element={<CrossSectorIntelligence />}', 'element={<CrossSectorStructural />}');
    assert.strictEqual(sha256(reverted), BASELINE_APP_SHA, 'App.tsx = A4 baseline + B1 edits only');
  });
});

describe('B1 Cross-Sector — PU-22, tokens, dependencies', () => {
  it('CS-14: no Vitest / @testing-library / jsdom; existing colour tokens only; no new dependency', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom']) assert.strictEqual(banned in all, false, banned);
    assert.strictEqual(shaFile('package.json'), '04d517b50d19802b1693e3afac08d7645961588d5b0693a2eff7cf221c471ce6', 'package.json unchanged');
    assert.strictEqual(shaFile('vite.config.ts'), 'd3bc403b0d99f70fef4cdcbd2c82f3ef3da12ce731cb392f73173d67c569d943', 'no proxy change: /api → 8788 already routes /api/cross-sector');
    for (const s of [...read('tests/cross_sector_recovery.test.ts').matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!)) {
      assert.strictEqual(/vitest|testing-library|jsdom/.test(s), false, `${s} is permitted`);
    }
    assert.strictEqual(existsSync(resolve(ROOT, 'frontend/src/features/cross-sector/CrossSectorIntelligence.test.tsx')), false, 'donor Vitest file NOT ported');
    const code = strip(SRC);
    const css = read('frontend/src/index.css');
    for (const tok of new Set([...code.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))) {
      assert.ok(css.includes(`${tok}:`), `${tok} is an existing token`);
    }
    assert.strictEqual(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(code), false, 'no literal colour');
  });
});
