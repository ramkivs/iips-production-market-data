/**
 * Test Suite: DECISION MATRIX RESTORATION — /intelligence/decision-matrix.
 *
 * Scope: the proven donor `DecisionMatrix.tsx` (blob c3b6e947) is restored onto the EXISTING
 * `/api/decision-matrix` SNAPSHOT authority and the EXISTING current-lineage client
 * (`frontend/src/api/decisionMatrix.ts`). Every direct import resolves to an existing
 * current-lineage module; the only substitution is the deferred AI slot
 * (`AiExplanation` → `AdvisoryDeferred`, the Company/Sector precedent).
 *
 * What is asserted:
 *   DM-01  route mounting — the route constant is unchanged and binds the restored surface;
 *   DM-02  navigation binding — Decision Matrix is navigable as `partial` (never `implemented`);
 *   DM-03  component rendering — the donor structure renders (header, badges, scatter, hint);
 *   DM-04  governed payload rendering — every value is consumed 1:1 from the real payload;
 *          nulls render "unavailable"; no quadrant/band/threshold is computed;
 *   DM-05  selection → governed trust chain for the selected sector + DEFERRED advisory;
 *   DM-06  existing client usage — the surface uses `fetchDecisionMatrixData` (relative
 *          `/api/decision-matrix`, no selection parameter), end-to-end against the UNCHANGED
 *          authority over real HTTP;
 *   DM-07  fail-closed — loading/error/unavailable/degraded branches precede any data
 *          dereference; non-OK and network failures reject; no fallback data exists;
 *   DM-08  donor fidelity + boundaries — direct imports are exactly the donor's (with the one
 *          documented substitution); no server/transport/node import; no invented colour token;
 *   DM-09  scope — server authority, Executive transport, R-1 topology, route map and the other
 *          restored surfaces are untouched.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import { DecisionMatrix, DecisionMatrixView, type DecisionMatrixViewProps } from '../frontend/src/features/decision-matrix/DecisionMatrix.js';
import { fetchDecisionMatrixData, type DecisionMatrixData } from '../frontend/src/api/decisionMatrix.js';
import {
  computeCertifiedDecisionMatrix, computeCertifiedEvidence, computeCertifiedReplay, createResearchSectorServer,
} from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const strip = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const normalize = (html: string): string => html.replace(/<!--[\s\S]*?-->/g, '');
const decode = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const text = (html: string): string => decode(normalize(html));
const metricValues = (html: string): string[] =>
  [...html.matchAll(/data-testid="metric-value"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => decode(normalize(m[1]!).replace(/<[^>]+>/g, '').trim()));
const json = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const SURFACE = 'frontend/src/features/decision-matrix/DecisionMatrix.tsx';
const PAYLOAD = json(computeCertifiedDecisionMatrix()) as unknown as DecisionMatrixData;

function renderAt(path: string): string {
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));
}

function renderView(over: Partial<DecisionMatrixViewProps> = {}): string {
  const props: DecisionMatrixViewProps = {
    data: PAYLOAD, selected: null, onSelect: () => {}, chainEvidence: null, chainReplay: null,
    chainLoading: false, chainError: null, ...over,
  };
  return renderToString(React.createElement(MemoryRouter, {}, React.createElement(DecisionMatrixView, props)));
}

describe('Decision Matrix — route mounting and navigation binding', () => {
  it('DM-01: /intelligence/decision-matrix binds the restored surface (route constant unchanged)', () => {
    assert.strictEqual(ROUTES.intelligenceDecisionMatrix, '/intelligence/decision-matrix');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /import \{ DecisionMatrix \} from '\.\.\/features\/decision-matrix\/DecisionMatrix\.js';/);
    assert.match(app, /<Route path=\{ROUTES\.intelligenceDecisionMatrix\} element=\{<DecisionMatrix \/>\} \/>/);
    assert.strictEqual(app.includes('DecisionMatrixStructural'), false, 'structural factory removed');
    // The mounted route renders the loader's initial fail-closed Loading state — not the
    // structural offline page and not any data (effects do not run under SSR).
    const html = renderAt('/intelligence/decision-matrix');
    assert.ok(html.includes('data-testid="state-loading"'), 'loader mounted at the route');
    assert.strictEqual(html.includes('structural-surface-unavailable'), false, 'no structural offline page');
    assert.strictEqual(html.includes('matrix-scatter'), false, 'no data rendered before the governed payload arrives');
    // The /intelligence/* placeholder no longer captures the decision-matrix path.
    assert.strictEqual(html.includes('app-placeholder'), false);
  });

  it('DM-02: navigation lists Decision Matrix under Intelligence as `partial` (AI Advisory deferred)', () => {
    const intel = NAV.find((n) => n.label === 'Intelligence');
    const dm = intel?.children?.find((c) => c.label === 'Decision Matrix');
    assert.ok(dm, 'Decision Matrix nav item present');
    assert.strictEqual(dm!.path, ROUTES.intelligenceDecisionMatrix);
    assert.strictEqual(dm!.status, 'partial', 'navigable as partial, never implemented');
    assert.strictEqual(dm!.minRole, 'viewer', 'role floor unchanged');
    assert.deepStrictEqual(intel!.children!.map((c) => [c.label, c.status]),
      [['Decision Matrix', 'partial'], ['Opportunities', 'future'], ['Risks', 'future'], ['Rankings', 'future']],
      'sibling O/R/R markers unchanged');
  });
});

describe('Decision Matrix — rendering of the governed payload', () => {
  it('DM-03: the donor structure renders (header, certified + SNAPSHOT badges, scatter, hint)', () => {
    const html = renderView();
    const t = text(html);
    assert.ok(html.includes('aria-label="Decision matrix"'));
    assert.ok(t.includes('Decision Matrix'));
    assert.ok(html.includes('data-testid="matrix-note"'));
    assert.ok(html.includes('data-testid="matrix-scatter"'));
    assert.ok(html.includes('data-testid="matrix-select-hint"'));
    assert.ok(t.includes('Business Quality × Valuation (certified)'));
    assert.ok(/snapshot/i.test(t), 'SNAPSHOT freshness disclosed');
    assert.strictEqual(html.includes('data-testid="matrix-selected"'), false, 'nothing selected initially');
    assert.strictEqual(html.includes('data-testid="matrix-trust-chain"'), false);
  });

  it('DM-04: every value is consumed 1:1 from /api/decision-matrix; nulls render unavailable; no classification', () => {
    const html = renderView();
    const t = text(html);
    assert.ok(t.includes(PAYLOAD.note), 'governed note verbatim');
    assert.ok(t.includes(PAYLOAD.provenance.dataSource), 'provenance dataSource verbatim');
    assert.ok(t.includes(`freshness ${PAYLOAD.provenance.freshness}`));
    assert.deepStrictEqual(metricValues(html),
      [PAYLOAD.universe.holdings, PAYLOAD.universe.avgConviction, PAYLOAD.universe.avgQuality].map(String),
      'universe metrics verbatim');
    assert.strictEqual(PAYLOAD.companies.length, 13);
    for (const c of PAYLOAD.companies) {
      assert.ok(decode(html).includes(`data-testid="matrix-point-${c.sector}"`), `${c.sector} point`);
      assert.ok(decode(html).includes(`aria-label="${c.sector}, quality ${c.quality ?? 'unavailable'}, valuation ${c.valuation ?? 'unavailable'}"`),
        `${c.sector} certified values verbatim`);
    }
    const nullVal = PAYLOAD.companies.filter((c) => c.valuation === null).length;
    assert.ok(nullVal > 0, 'fixture exercises the null-valuation path');
    assert.strictEqual((decode(html).match(/valuation unavailable"/g) ?? []).length, nullVal, 'null valuation → unavailable, never 0');
    const visible = t.replace(/<[^>]+>/g, ' ');
    for (const banned of [/quadrant:/i, /\bband\b(?!s)/i, /threshold/i, /\bBuy\b|\bSell\b/]) {
      assert.strictEqual(banned.test(visible.replace(PAYLOAD.note, '')), false, `no computed classification ${banned}`);
    }
  });

  it('DM-05: a selection renders the certified detail, the governed trust chain and the DEFERRED advisory', () => {
    const sel = PAYLOAD.companies[0]!;
    const loading = renderView({ selected: sel, chainLoading: true });
    assert.ok(loading.includes('data-testid="matrix-selected"'));
    assert.ok(loading.includes(`href="/research/company/${sel.sector}"`), 'links to the restored Company surface');
    assert.ok(text(loading).includes(`Composite: ${sel.composite} · Quality: ${sel.quality ?? 'unavailable'} · Valuation: ${sel.valuation ?? 'unavailable'}`));
    assert.ok(loading.includes('data-testid="matrix-trust-chain"'));
    assert.ok(loading.includes('data-testid="state-loading"'), 'chain loading state');

    const failed = renderView({ selected: sel, chainError: 'Error: evidence transport returned 503' });
    assert.ok(failed.includes('data-testid="state-error"'), 'chain fails closed');
    assert.ok(text(failed).includes('Unable to load company evidence: Error: evidence transport returned 503'));
    assert.strictEqual(failed.includes('company-replay-equivalence'), false, 'no chain data on failure');

    const ok = renderView({
      selected: sel,
      chainEvidence: json(computeCertifiedEvidence(sel.sector)) as never,
      chainReplay: json(computeCertifiedReplay(sel.sector)) as never,
    });
    assert.ok(ok.includes('company-replay-equivalence'), 'shared CompanyTrustChain rendered from governed payloads');
    for (const html of [loading, failed, ok]) {
      assert.ok(html.includes('data-testid="advisory-deferred"'), 'AI Advisory renders the DEFERRED state');
      assert.ok(html.includes(`data-sector-key="${sel.sector}"`), 'bound to the authoritative selected sector');
    }
  });
});

describe('Decision Matrix — existing client and authority', () => {
  it('DM-06a: the surface reaches data only through the existing clients', () => {
    const code = strip(read(SURFACE));
    assert.match(code, /import \{ fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany \} from '\.\.\/\.\.\/api\/decisionMatrix\.js';/);
    assert.match(code, /fetchDecisionMatrixData\(\)/, 'called with the default (relative) base URL');
    assert.match(code, /fetchEvidenceData\(selected\.sector\), fetchReplayData\(selected\.sector\)/);
    assert.strictEqual(/\bfetch\(|authFetch|XMLHttpRequest|https?:\/\/|localhost|127\.0\.0\.1|878[78]/.test(code), false, 'no direct/absolute network call');
    assert.strictEqual(/asOf|searchParams|URLSearchParams/.test(code), false, 'no PIT/selection parameter');
    // Client unchanged: relative path, no selection parameter.
    assert.match(strip(read('frontend/src/api/decisionMatrix.ts')), /authFetch\(`\$\{baseUrl\}\/api\/decision-matrix`\)/);
  });

  it('DM-06b: end-to-end — the existing client reads the UNCHANGED authority over real HTTP', async () => {
    const server = createResearchSectorServer();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      urls.push(String(input));
      return original(`http://127.0.0.1:${port}${String(input)}`, init);
    }) as typeof fetch;
    try {
      const data = await fetchDecisionMatrixData();
      assert.deepStrictEqual(urls, ['/api/decision-matrix'], 'one relative GET, no selection parameter');
      assert.deepStrictEqual(data, PAYLOAD, 'governed payload unchanged over HTTP');
      const html = renderView({ data });
      assert.strictEqual((html.match(/data-testid="matrix-point-/g) ?? []).length, data.companies.length);
    } finally {
      globalThis.fetch = original;
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});

describe('Decision Matrix — fail-closed behaviour', () => {
  it('DM-07a: non-OK and network failures reject (the loader renders ErrorState, never data)', async () => {
    const original = globalThis.fetch;
    try {
      globalThis.fetch = (async () => new Response('{"error":"x"}', { status: 503 })) as typeof fetch;
      await assert.rejects(fetchDecisionMatrixData(), /decision-matrix transport returned 503/);
      globalThis.fetch = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
      await assert.rejects(fetchDecisionMatrixData(), /fetch failed/);
    } finally { globalThis.fetch = original; }
  });

  it('DM-07b: loader guards run in fail-closed order before any payload dereference', () => {
    const code = strip(read(SURFACE));
    const loader = code.slice(code.indexOf('export function DecisionMatrix()'));
    const order = [
      'if (loading) return <LoadingState />;',
      'if (error) return <ErrorState message={`Unable to load decision matrix: ${error}`} />;',
      'if (!data) return <UnavailableState />;',
      'if (isDegraded(data)) return <DataModeUnavailable data={data} title="Decision Matrix" />;',
      '<DecisionMatrixView',
    ].map((s) => { const i = loader.indexOf(s); assert.ok(i >= 0, `guard present: ${s}`); return i; });
    assert.deepStrictEqual([...order].sort((a, b) => a - b), order, 'loading → error → unavailable → degraded → view');
    assert.match(loader, /useState<DecisionMatrixData \| null>\(null\)/, 'no seeded/fallback payload');
    assert.strictEqual(/computeCertified|frontend\/server|src\/transports|iips-platform|from 'node:/.test(code), false, 'no server compute fallback');
  });

  it('DM-07c: the fail-closed states render honestly', () => {
    const html = renderToString(React.createElement(DecisionMatrix));
    assert.ok(html.includes('data-testid="state-loading"'), 'initial state is Loading, no data');
    assert.strictEqual(html.includes('matrix-point-'), false);
  });
});

describe('Decision Matrix — donor fidelity and scope', () => {
  it('DM-08a: direct imports are exactly the donor set (NodeNext) with the one documented AI substitution', () => {
    const src = read(SURFACE);
    const imports = [...src.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, [
      'react', '../../api/dataMode.js', '../../components/state/DataModeUnavailable.js', 'react-router-dom',
      '../../api/decisionMatrix.js', '../../api/evidence.js', '../../api/replay.js',
      '../../components/data/DataComponents.js', '../../components/decision/DecisionComponents.js',
      '../../components/state/StateComponents.js', '../../components/ui/Badges.js',
      '../company/CompanyTrustChain.js', '../../components/ai/AdvisoryDeferred.js',
    ]);
    for (const rel of imports.filter((i) => i.startsWith('.'))) {
      const target = resolve(ROOT, 'frontend/src/features/decision-matrix', rel.replace(/\.js$/, ''));
      assert.ok(existsSync(`${target}.ts`) || existsSync(`${target}.tsx`), `${rel} is an existing current-lineage module`);
    }
    assert.strictEqual(existsSync(resolve(ROOT, 'frontend/src/components/ai/AiExplanation.tsx')), false, 'AI advisory not reconstructed');
    assert.strictEqual(/AiExplanation\b/.test(strip(src)), false);
  });

  it('DM-08b: the rendered markup keeps the donor text and uses only existing colour tokens', () => {
    const code = strip(read(SURFACE));
    for (const donorText of ['Positions represent certified Business Quality and Valuation values. No quadrant classification is applied.',
      'Business Quality (certified, 0–100)', 'Valuation (certified, 0–100)', 'Select a point to inspect a company.',
      'Trust Chain — ', 'Unable to load decision matrix: ']) {
      assert.ok(code.includes(donorText), `donor text preserved: ${donorText}`);
    }
    const css = read('frontend/src/index.css');
    const tokens = [...new Set([...code.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))];
    assert.ok(tokens.length > 0);
    for (const tok of tokens) assert.ok(css.includes(`${tok}:`), `${tok} is an existing token`);
    assert.strictEqual(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(code), false, 'no literal colour');
  });

  it('DM-09: out-of-scope modules are untouched (hash-pinned) and other restored routes still mount', () => {
    const PINNED: Record<string, string> = {
      'frontend/server/executive-transport.ts': '79d62cea45620778ce1a1f11ff47204c7590937e5f165002af80fd8c62047fb2',
      'frontend/src/app/routes.ts': 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085',
    };
    for (const [file, expected] of Object.entries(PINNED)) {
      assert.strictEqual(createHash('sha256').update(readFileSync(resolve(ROOT, file))).digest('hex'), expected, `${file} unchanged`);
    }
    const app = strip(read('frontend/src/app/App.tsx'));
    for (const binding of [
      /ROUTES\.researchCompany\} element=\{<CompanyIntelligence \/>\}/,
      /ROUTES\.researchSector\} element=\{<SectorIntelligence \/>\}/,
      /ROUTES\.evidence\} element=\{<EvidenceSurface \/>\}/,
      /ROUTES\.evidenceReplay\} element=\{<EvidenceReplayStructural \/>\}/,
      /ROUTES\.evidenceDetail\} element=\{<EvidenceDetailStructural \/>\}/,
    ]) assert.match(app, binding, `binding unchanged: ${binding}`);
    // Vite config still carries the R-1 topology exactly (no new proxy rule for this surface).
    const vite = strip(read('vite.config.ts'));
    assert.deepStrictEqual((vite.match(/target:\s*'[^']+'/g) ?? []), ["target: 'http://127.0.0.1:8787'", "target: 'http://127.0.0.1:8788'"]);
  });
});
