/**
 * Test Suite: A4 SCREENER RECOVERY — /screener.
 *
 * Scope: the proven donor Screener (`frontend/src/features/screener/Screener.tsx`, donor blob
 * 915238acec41e15232f8b20ec064828e8c291a32, donor commit 50c07b96) is restored at /screener over the
 * EXISTING /api/decision-matrix universe via the EXISTING fetchDecisionMatrixData client — the sole
 * data authority. The F-9 UI06 MultiFactorScreenerSurface is RETAINED in the tree (module + import)
 * but UNROUTED (UI02 Executive / UI11 Evidence precedent). UI06 candidate fields (companyName, LTP,
 * P/E, P/B, ROE, operating margin, grade, quality state) are never used or invented.
 * Adaptations: NodeNext `.js` specifiers + display/loader split only.
 *
 * Behaviour is verified against the SHIPPED source without a DOM (PU-22 forbids jsdom /
 * @testing-library): the default state is rendered through React SSR, and the donor's filter
 * semantics are exercised by transpiling and executing the exact `bound()` and `results`
 * callback / table `columns` source text extracted from Screener.tsx (asserted to live inside
 * ScreenerView) — the tests never re-implement the filter.
 *
 * What is asserted:
 *   SC-01  /screener mounts the restored donor; UI06 is present in the tree but unrouted;
 *          /screener/governed is unchanged; navigation stays `partial`;
 *   SC-02  default render: server row order preserved; rows with missing quality/valuation are
 *          hidden by default; governed columns only; provenance footer; company links;
 *   SC-03  missing quality / valuation render `unavailable` (never 0);
 *   SC-04  "Include unavailable" reveals the hidden rows, still in server order;
 *   SC-05  donor filters: sector, verdict, composite/quality/valuation bounds, blank/invalid bounds;
 *   SC-06  /api/decision-matrix is the sole authority (end-to-end over real HTTP); no candidate
 *          field is fabricated;
 *   SC-07  loader fails closed: loading → error → unavailable → view; no seeded payload;
 *   SC-08  no new server / API / data route; routes.ts, UI06 closure and UI06-06 unchanged;
 *          donor lineage markers; existing colour tokens only;
 *   SC-09  PU-22 stays authoritative — no Vitest / @testing-library / jsdom.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Link } from 'react-router-dom';
import ts from 'typescript';

import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import { Screener, ScreenerView } from '../frontend/src/features/screener/Screener.js';
import { DataTable } from '../frontend/src/components/data/DataComponents.js';
import { DecisionBadge } from '../frontend/src/components/decision/DecisionComponents.js';
import { fetchDecisionMatrixData, type DecisionMatrixData, type MatrixCompany } from '../frontend/src/api/decisionMatrix.js';
import { computeCertifiedDecisionMatrix, createResearchSectorServer } from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const strip = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const decode = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const text = (html: string): string => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ''));
const json = <T,>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;
const sha = (rel: string): string => createHash('sha256').update(readFileSync(resolve(ROOT, rel))).digest('hex');

const SCREENER = 'frontend/src/features/screener/Screener.tsx';
const UI06 = 'frontend/src/features/screener/MultiFactorScreenerSurface.tsx';
const MATRIX = json<DecisionMatrixData>(computeCertifiedDecisionMatrix());
const ALL = MATRIX.companies.map((c) => c.sector);
const COMPLETE = MATRIX.companies.filter((c) => c.quality !== null && c.valuation !== null).map((c) => c.sector);
const INCOMPLETE = MATRIX.companies.filter((c) => c.quality === null || c.valuation === null).map((c) => c.sector);

const renderAt = (path: string): string =>
  renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));
const inRouter = (el: React.ReactElement): string => renderToString(React.createElement(MemoryRouter, {}, el));
const viewHtml = (): string => inRouter(React.createElement(ScreenerView, {
  companies: [...MATRIX.companies], provenance: MATRIX.provenance.dataSource, freshness: MATRIX.provenance.freshness,
}));
const tableSectors = (html: string): string[] =>
  [...html.matchAll(/<a href="\/research\/company\/([^"]+)">/g)].map((m) => decodeURIComponent(decode(m[1]!)));

/* ── Shipped-source execution (no re-implementation) ─────────────────────────────────────── */
const SRC = read(SCREENER);
const VIEW_AT = SRC.indexOf('export function ScreenerView(');
function slice(s: string, from: string, to: string): string {
  const i = s.indexOf(from);
  if (i < 0) throw new Error(`source anchor missing: ${from}`);
  const j = s.indexOf(to, i + from.length);
  if (j < 0) throw new Error(`source anchor missing: ${to}`);
  return s.slice(i + from.length, j);
}
const BOUND_SRC = 'function bound(' + slice(SRC, 'function bound(', '\n}\n') + '\n}\n';
const RESULTS_SRC = slice(SRC.slice(VIEW_AT), 'const results = useMemo(', ', [companies, selectedSectors');
const COLUMNS_SRC = slice(SRC.slice(VIEW_AT), 'columns={', '\n        rows={results}');
const transpile = (code: string): string =>
  ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;

type Filters = {
  sectors?: string[]; verdicts?: string[]; compositeMin?: string; compositeMax?: string;
  qualityMin?: string; qualityMax?: string; valuationMin?: string; valuationMax?: string; include?: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const RUN = new Function(`${transpile(`function __screen(companies, selectedSectors, selectedVerdicts, compositeMin, compositeMax, qualityMin, qualityMax, valuationMin, valuationMax, includeUnavailable) {
${BOUND_SRC}
  return (${RESULTS_SRC})();
}`)}; return __screen;`)() as (...a: unknown[]) => MatrixCompany[];
const screen = (f: Filters = {}, companies: readonly MatrixCompany[] = MATRIX.companies): string[] =>
  RUN(companies, new Set(f.sectors ?? []), new Set(f.verdicts ?? []), f.compositeMin ?? '', f.compositeMax ?? '',
    f.qualityMin ?? '', f.qualityMax ?? '', f.valuationMin ?? '', f.valuationMax ?? '', f.include ?? false).map((c) => c.sector);
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const COLUMNS = new Function('React', 'Link', 'DecisionBadge', `${transpile(`function __cols() { return ${COLUMNS_SRC}; }`)}; return __cols();`)(
  React, Link, DecisionBadge) as never;
const tableHtml = (rows: readonly MatrixCompany[]): string =>
  inRouter(React.createElement(DataTable<MatrixCompany>, { columns: COLUMNS, rows }));

describe('A4 Screener — route mounting, UI06 unrouted, navigation', () => {
  it('SC-01: /screener mounts the restored donor; UI06 retained but unrouted; /screener/governed unchanged', () => {
    assert.strictEqual(ROUTES.screener, '/screener');
    assert.strictEqual(ROUTES.screenerGoverned, '/screener/governed');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.screener\} element=\{<Screener \/>\} \/>/);
    assert.match(app, /import \{ Screener \} from '\.\.\/features\/screener\/Screener\.js';/);
    // UI06: present in the tree, import retained, mounted at NO route.
    assert.ok(existsSync(resolve(ROOT, UI06)), 'UI06 module retained');
    assert.match(app, /import \{ MultiFactorScreenerSurface \} from '\.\.\/features\/screener\/MultiFactorScreenerSurface\.js';/);
    assert.strictEqual(/element=\{<MultiFactorScreenerSurface\b/.test(app), false, 'UI06 is routed nowhere');
    const html = renderAt('/screener');
    assert.ok(html.includes('data-testid="state-loading"'), 'restored loader mounted (SSR loading state)');
    assert.strictEqual(html.includes('ui06-screener-surface'), false, 'UI06 no longer at /screener');
    assert.strictEqual(html.includes('UI06_MULTIFACTOR_SCREENER'), false);
    assert.strictEqual(html.includes('structural-surface-unavailable'), false);
    assert.ok(html.includes('app-shell'));
    // /screener/governed: unchanged donor structural boundary.
    assert.match(app, /<Route path=\{ROUTES\.screenerGoverned\} element=\{<GovernedScreenerStructural \/>\} \/>/);
    assert.ok(renderAt('/screener/governed').includes('structural-surface-unavailable'));
    // Loader-level: before any payload arrives the loader renders Loading, never rows.
    const loader = inRouter(React.createElement(Screener));
    assert.ok(loader.includes('data-testid="state-loading"'));
    assert.strictEqual(/screener-filters|data-table|screener-provenance/.test(loader), false);
    // Navigation: Screener stays `partial` at /screener.
    const research = NAV.find((n) => n.label === 'Research');
    assert.deepStrictEqual(research?.children?.find((c) => c.label === 'Screener'),
      { label: 'Screener', path: '/screener', minRole: 'viewer', status: 'partial' });
  });
});

describe('A4 Screener — governed payload rendering and donor filter semantics', () => {
  it('SC-02: default render preserves server row order and hides rows with missing axes', () => {
    assert.ok(COMPLETE.length > 0 && INCOMPLETE.length > 0, 'fixture exercises both cases');
    const html = viewHtml();
    assert.deepStrictEqual(tableSectors(html), COMPLETE, 'visible rows = complete rows, in server order');
    for (const s of INCOMPLETE) assert.strictEqual(tableSectors(html).includes(s), false, `${s} hidden by default`);
    // Cross-check with the committed capture reconciliation (report Appendix E).
    assert.deepStrictEqual(INCOMPLETE, ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality']);
    assert.strictEqual(COMPLETE.length, 9);
    const t = text(html);
    assert.ok(t.includes(`${COMPLETE.length} of ${ALL.length} companies match`));
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => decode(m[1]!));
    assert.deepStrictEqual(headers, ['Company / Sector', 'Verdict', 'Composite', 'Quality', 'Valuation'], 'governed columns only');
    const sectorBoxes = [...slice(html, 'data-testid="screener-filters"', 'Verdict').matchAll(/type="checkbox"[^>]*\/?>(?:<!-- -->)? ?(?:<!-- -->)?([^<]+)</g)]
      .map((m) => decode(m[1]!).trim());
    assert.deepStrictEqual(sectorBoxes, ALL, 'sector options = governed universe, in server order');
    assert.match(html, /data-testid="include-unavailable"/);
    assert.strictEqual(/data-testid="include-unavailable"[^>]*checked/.test(html), false, 'Include unavailable is off by default');
    const footer = text(slice(html, 'data-testid="screener-provenance"', '</p>').replace(/^[^>]*>/, ''));
    assert.strictEqual(footer, `${MATRIX.provenance.dataSource} · freshness ${MATRIX.provenance.freshness}`);
  });

  it('SC-03: missing quality / valuation render `unavailable` (never 0)', () => {
    const nullQ = MATRIX.companies.find((c) => c.quality === null);
    const nullV = MATRIX.companies.find((c) => c.valuation === null);
    const rows = [nullQ, nullV].filter((r): r is MatrixCompany => r !== undefined);
    const synthetic = json<MatrixCompany>({ ...MATRIX.companies[0]!, sector: 'Synthetic', quality: null, valuation: null });
    const html = tableHtml([...rows, synthetic]);
    const cells = (sector: string): string[] => {
      const row = slice(html, `href="/research/company/${sector}"`, '</tr>');
      return [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]!));
    };
    const s = cells('Synthetic');
    assert.deepStrictEqual(s.slice(-2), ['unavailable', 'unavailable'], 'both missing axes render unavailable');
    assert.strictEqual(s.slice(-2).includes('0'), false);
    for (const r of rows) {
      // cells() starts inside the sector cell (at its link), so: [verdict, composite, quality, valuation].
      const c = cells(r.sector);
      assert.strictEqual(c.length, 4);
      assert.strictEqual(c[2], r.quality === null ? 'unavailable' : String(r.quality), `${r.sector} quality`);
      assert.strictEqual(c[3], r.valuation === null ? 'unavailable' : String(r.valuation), `${r.sector} valuation`);
      assert.strictEqual(c[1], String(r.composite), `${r.sector} composite as delivered`);
    }
  });

  it('SC-04: "Include unavailable" reveals the hidden rows in server order', () => {
    assert.deepStrictEqual(screen(), COMPLETE, 'default: incomplete rows excluded');
    assert.deepStrictEqual(screen({ include: true }), ALL, 'include: every row, exact server order');
    // Order is the payload's, never a sort: a reversed payload stays reversed.
    const reversed = [...MATRIX.companies].reverse();
    assert.deepStrictEqual(screen({ include: true }, reversed), [...ALL].reverse());
    assert.strictEqual(/\.sort\(/.test(strip(SRC)), false, 'no sorting logic');
  });

  it('SC-05: donor filters — sector, verdict, bounds (inclusive), blank/invalid bounds', () => {
    // Sector: subset, reported in server order regardless of selection order.
    const pick = [COMPLETE[3]!, COMPLETE[0]!];
    assert.deepStrictEqual(screen({ sectors: pick }), COMPLETE.filter((s) => pick.includes(s)));
    // Verdict.
    const v = MATRIX.companies.find((c) => c.quality !== null && c.valuation !== null)!.verdict;
    assert.deepStrictEqual(screen({ verdicts: [v] }),
      MATRIX.companies.filter((c) => c.verdict === v && c.quality !== null && c.valuation !== null).map((c) => c.sector));
    // Composite bounds are inclusive.
    const pivot = MATRIX.companies.find((c) => c.sector === COMPLETE[0])!.composite;
    const byComp = (p: (n: number) => boolean) => MATRIX.companies
      .filter((c) => c.quality !== null && c.valuation !== null && p(c.composite)).map((c) => c.sector);
    assert.deepStrictEqual(screen({ compositeMin: String(pivot) }), byComp((n) => n >= pivot));
    assert.deepStrictEqual(screen({ compositeMax: String(pivot) }), byComp((n) => n <= pivot));
    assert.ok(screen({ compositeMin: String(pivot), compositeMax: String(pivot) }).includes(COMPLETE[0]!));
    // Quality/valuation bounds apply only to present values; missing ones are governed by the toggle.
    const withQ = screen({ qualityMin: '80', include: true });
    for (const c of MATRIX.companies) {
      const expected = c.quality === null || c.quality >= 80;
      assert.strictEqual(withQ.includes(c.sector), expected, `${c.sector} under quality >= 80 (include on)`);
    }
    const withV = screen({ valuationMax: '50', include: true });
    for (const c of MATRIX.companies) {
      const expected = c.valuation === null || c.valuation <= 50;
      assert.strictEqual(withV.includes(c.sector), expected, `${c.sector} under valuation <= 50 (include on)`);
    }
    // Blank / whitespace / non-numeric bounds impose no boundary; '0' is a real boundary.
    assert.deepStrictEqual(screen({ compositeMin: '   ' }), COMPLETE);
    assert.deepStrictEqual(screen({ compositeMin: 'abc', qualityMax: 'x' }), COMPLETE);
    assert.deepStrictEqual(screen({ valuationMax: '0' }), []);
    assert.ok(SRC.includes('emptyLabel="No companies match the current filters"'), 'honest empty state');
  });
});

describe('A4 Screener — sole authority, no fabrication, fail-closed', () => {
  it('SC-06a: /api/decision-matrix via fetchDecisionMatrixData is the sole data authority; no candidate field invented', () => {
    const code = strip(SRC);
    const imports = [...SRC.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports.filter((i) => i.includes('/api/')), ['../../api/decisionMatrix.js'], 'single client');
    assert.match(code, /import \{ fetchDecisionMatrixData, type MatrixCompany \} from '\.\.\/\.\.\/api\/decisionMatrix\.js';/);
    assert.strictEqual(/\bfetch\(|authFetch|XMLHttpRequest|https?:\/\/|localhost|127\.0\.0\.1|878[78]/.test(code), false, 'no direct network');
    assert.strictEqual(/asOf|searchParams|URLSearchParams|localStorage|sessionStorage|indexedDB/.test(code), false, 'no PIT / persistence');
    assert.strictEqual(/computeCertified|frontend\/server|src\/transports|iips-platform|from 'node:/.test(code), false, 'no server import');
    for (const banned of [/companyName/, /\bltp\b/i, /\bpe\b/, /\bpb\b/, /\broe\b/, /operatingMargin/, /\bgrade\b/, /QualityState/,
      /ScreenerCandidate/, /ScreenerService/, /registerCandidate/, /screener_service/, /ui06/i, /MultiFactor/]) {
      assert.strictEqual(banned.test(code), false, `no UI06 candidate field/contract: ${banned}`);
    }
    const t = text(viewHtml());
    for (const label of ['Last Price', 'P/E', 'P/B', 'ROE', 'Operating Margin', 'Grade']) {
      assert.strictEqual(t.includes(label), false, `no fabricated ${label} column`);
    }
  });

  it('SC-06b: end-to-end over real HTTP against the unchanged authority; transport failure rejects', async () => {
    const server = createResearchSectorServer();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    const urls: string[] = [];
    let fail = false;
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      urls.push(String(input));
      if (fail) return new Response('unavailable', { status: 503 });
      return original(`http://127.0.0.1:${port}${String(input)}`, init);
    }) as typeof fetch;
    try {
      assert.deepStrictEqual(await fetchDecisionMatrixData(), MATRIX, 'delivered exactly as served');
      assert.deepStrictEqual(urls, ['/api/decision-matrix'], 'one relative GET');
      fail = true;
      await assert.rejects(fetchDecisionMatrixData(), /503/, 'failure rejects → loader ErrorState');
    } finally {
      globalThis.fetch = original;
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('SC-07: the loader keeps the donor fail-closed order; the view is only reached with a payload', () => {
    const code = strip(SRC);
    const loader = code.slice(code.indexOf('export function Screener()'), code.indexOf('export function ScreenerView('));
    assert.ok(loader.length > 0, 'loader precedes the view');
    const idx = ['fetchDecisionMatrixData()', 'if (loading) return <LoadingState />;',
      'if (error) return <ErrorState message={`Unable to load screener universe: ${error}`} />;',
      'if (!companies) return <UnavailableState />;', '<ScreenerView']
      .map((s) => { const i = loader.indexOf(s); assert.ok(i >= 0, s); return i; });
    assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, 'fetch → loading → error → unavailable → view');
    assert.ok(loader.includes('useState<MatrixCompany[] | null>(null)'), 'no seeded universe');
    assert.strictEqual(/useState\(|useMemo\(/.test(loader.replace(/useState<[^>]+>\(/g, '').replace('useState(true)', '')), false,
      'filter state lives in the view, not the loader');
    assert.ok(VIEW_AT > 0 && SRC.indexOf('const results = useMemo(') > VIEW_AT, 'executed filter source lives in ScreenerView');
  });
});

describe('A4 Screener — no new route / data authority; donor fidelity', () => {
  it('SC-08a: server, client, route map, proxy, deps, UI06 closure and shared components are byte-unchanged', () => {
    const PINNED: Record<string, string> = {
      'frontend/server/research-sector-transport.ts': '373585c1fc6432b1dd39e813c4c57340a760b8be66b426821338eb71b906b785',
      'frontend/src/api/decisionMatrix.ts': '742d680645a676e9821504cd5ee5e3f9e96862936dcd0fe36683562e9dba652f',
      'frontend/src/api/executive.ts': 'a404a58d783a4398f938336ff498cc429eb236df607ddf1ef86dc0347ab05817',
      'frontend/src/app/routes.ts': 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085',
      'vite.config.ts': 'd3bc403b0d99f70fef4cdcbd2c82f3ef3da12ce731cb392f73173d67c569d943',
      'package.json': '04d517b50d19802b1693e3afac08d7645961588d5b0693a2eff7cf221c471ce6',
      'frontend/src/features/screener/MultiFactorScreenerSurface.tsx': 'b8b2daeefa77c73520b2f2e5c8c8dc359bd55523bc2ff1fae755c22f8faab987',
      'src/ui/view_models/ui06_multifactor_screener.ts': '651d273e016b54cbb26649a30bf85ec18832e744bd6e33440376c0bccb242adf',
      'src/transports/screener_service.ts': '3cc678cdbbfbe5a7cb73700f2686e079c6c4e0b8bd3007dc02baf726eee30a69',
      'frontend/src/components/data/DataComponents.tsx': '7c18bfead73476fa8394094f4ebb0f3eaf48bc32c8ad7479cc6a1b9434104643',
      'frontend/src/components/decision/DecisionComponents.tsx': '7c3c32fb6ae0b54f9cb73e5e336faa803d5302d1d92066c644d529ea1b3a220f',
      'frontend/src/components/state/StateComponents.tsx': '41a0cb7a9f433615dbe902259935785cc97096f2a60f4c5c7fce3878940a3986',
      'frontend/src/components/ui/Badges.tsx': '190a27fdffcc9bfe1abbeb7f64994b4783e6e7429eb97c3fc0889cbbf826f259',
    };
    for (const [file, expected] of Object.entries(PINNED)) assert.strictEqual(sha(file), expected, `${file} unchanged`);
  });

  it('SC-08b: UI06-06 is untouched (its no-fabrication invariant stands as authored)', () => {
    const src = read('tests/shell_multifactor_screener_surface.test.ts');
    const i = src.indexOf("  it('UI06-06:");
    const j = src.indexOf('\n  it(', i + 1);
    assert.ok(i >= 0 && j > i);
    assert.strictEqual(createHash('sha256').update(src.slice(i, j)).digest('hex'),
      'f26910d3fa8819dff8a76bf1252afce9d0f692b835dc7b2728307da3f6bab956', 'UI06-06 block byte-identical to its authored form');
  });

  it('SC-08c: donor imports (NodeNext), lineage markers, existing colour tokens only', () => {
    const imports = [...SRC.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['react', 'react-router-dom', '../../api/decisionMatrix.js',
      '../../components/decision/DecisionComponents.js', '../../components/data/DataComponents.js',
      '../../components/decision/DecisionComponents.js', '../../components/state/StateComponents.js', '../../components/ui/Badges.js']);
    for (const rel of imports.filter((i) => i.startsWith('.'))) {
      const target = resolve(ROOT, SCREENER, '..', rel.replace(/\.js$/, ''));
      assert.ok(existsSync(`${target}.ts`) || existsSync(`${target}.tsx`), `${rel} exists`);
    }
    assert.ok(SRC.includes('915238acec41e15232f8b20ec064828e8c291a32'), 'donor blob recorded');
    assert.ok(SRC.includes('50c07b96e5d1450a7de057de207e1fe3cd45a98e'), 'donor commit recorded');
    assert.ok(SRC.includes('Program v3.0 — P-5: Read-only Screener.'), 'donor header carried');
    const code = strip(SRC);
    const css = read('frontend/src/index.css');
    for (const tok of new Set([...code.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))) {
      assert.ok(css.includes(`${tok}:`), `${tok} is an existing token`);
    }
    assert.strictEqual(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(code), false, 'no literal colour');
  });

  it('SC-09: PU-22 stays authoritative — no Vitest / @testing-library / jsdom', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom']) {
      assert.strictEqual(banned in all, false, `${banned} must not be added`);
    }
    assert.ok('typescript' in all, 'the transpiler used for shipped-source execution is an existing devDependency');
    for (const s of [...read('tests/screener_recovery.test.ts').matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!)) {
      assert.strictEqual(/vitest|testing-library|jsdom/.test(s), false, `${s} is permitted`);
    }
    assert.strictEqual(existsSync(resolve(ROOT, 'frontend/src/features/screener/Screener.test.tsx')), false, 'donor Vitest file NOT ported');
  });
});
