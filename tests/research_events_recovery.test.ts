/**
 * Test Suite: A3 RESEARCH EVENTS RECOVERY — /research/events/:id.
 *
 * Scope: the proven donor Research Events surface (`frontend/src/features/research/ResearchEvents.tsx`,
 * donor blob d64f58a1adee96dd3cdf9e6d7688e01a17963859, donor commit 60c51363) is restored onto the
 * EXISTING read authorities and the EXISTING current-lineage clients only:
 *   events          ← /api/evidence/:sector (fetchEvidenceData) + /api/replay/:sector (fetchReplayData)
 *   sector selector ← /api/decision-matrix  (fetchDecisionMatrixData)
 * Adaptations: NodeNext `.js` specifiers + display/loader split (A1/A2 precedent) only.
 * The surface displays NO replay verification result (AD-17 is not engaged and no claim is added).
 *
 * What is asserted:
 *   RE-01  route mounting — /research/events/:id binds the restored surface; no structural page;
 *   RE-02  navigation — Events is `partial` (never `implemented`); siblings unchanged;
 *   RE-03  the four events render the server-delivered timestamps as delivered, with per-event
 *          source annotations, the provenance footer and the Sector/Company links;
 *   RE-04  fixed donor lifecycle order (never a timestamp sort) + the "not a temporal timeline" note;
 *          identical timestamps are distinct events (never merged);
 *   RE-05  missing values render `unavailable`; one failed source → partial note + unavailable event;
 *   RE-06  the sector selector is sourced only from /api/decision-matrix (loading / error honest);
 *   RE-07  existing client authority end-to-end over real HTTP against the UNCHANGED authority,
 *          including a one-endpoint failure and unknown identifiers failing closed;
 *   RE-08  the loader keeps the donor fail-closed sequence (allSettled; both failed → ErrorState);
 *   RE-09  no new route / server / client / data authority — hash pins; donor imports; donor lineage
 *          markers; existing colour tokens only; no AD-17 verification claim;
 *   RE-10  PU-22 stays authoritative — no Vitest / @testing-library / jsdom introduced.
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
import { ResearchEvents, ResearchEventsView } from '../frontend/src/features/research/ResearchEvents.js';
import { fetchEvidenceData, type EvidenceData } from '../frontend/src/api/evidence.js';
import { fetchReplayData, type ReplayData } from '../frontend/src/api/replay.js';
import { fetchDecisionMatrixData, type DecisionMatrixData } from '../frontend/src/api/decisionMatrix.js';
import {
  computeCertifiedDecisionMatrix, computeCertifiedEvidence, computeCertifiedReplay, createResearchSectorServer,
} from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const strip = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const decode = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const text = (html: string): string => decode(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ''));
const json = <T,>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;
const sha = (rel: string): string => createHash('sha256').update(readFileSync(resolve(ROOT, rel))).digest('hex');

const EVENTS_FILE = 'frontend/src/features/research/ResearchEvents.tsx';
const SECTOR = 'Banking';
const ORDER = ['calibration', 'snapshot', 'evidence', 'replay'] as const;

const MATRIX = json<DecisionMatrixData>(computeCertifiedDecisionMatrix());
const EVIDENCE = json<EvidenceData>(computeCertifiedEvidence(SECTOR));
const REPLAY = json<ReplayData>(computeCertifiedReplay(SECTOR));

const noop = (): void => undefined;
type ViewProps = Parameters<typeof ResearchEventsView>[0];
const baseProps: ViewProps = {
  id: SECTOR, evidence: EVIDENCE, replay: REPLAY, sectors: [...MATRIX.companies],
  sectorsError: null, partialError: null, navigate: noop,
};
const view = (over: Partial<ViewProps> = {}): string =>
  renderToString(React.createElement(MemoryRouter, {}, React.createElement(ResearchEventsView, { ...baseProps, ...over })));
const renderAt = (path: string): string =>
  renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));

const eventKeys = (html: string): string[] => [...html.matchAll(/data-testid="event-([a-z]+)"/g)].map((m) => m[1]!);
// Element text by testid (React SSR separates adjacent text nodes with `<!-- -->`).
const cell = (html: string, testid: string): string => {
  const m = new RegExp(`data-testid="${testid}"[^>]*>([\\s\\S]*?)</(span|p|li|div)>`).exec(html);
  if (!m) throw new Error(`missing ${testid}`);
  return text(m[1]!);
};

describe('A3 Research Events — route mounting and navigation', () => {
  it('RE-01: /research/events/:id binds the restored donor surface; no structural page remains', () => {
    assert.strictEqual(ROUTES.researchEvents, '/research/events/:id');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.researchEvents\} element=\{<ResearchEvents \/>\} \/>/);
    assert.match(app, /import \{ ResearchEvents \} from '\.\.\/features\/research\/ResearchEvents\.js';/);
    assert.strictEqual(app.includes('ResearchEventsStructural'), false, 'the structural factory is removed');
    const html = renderAt(`/research/events/${SECTOR}`);
    assert.ok(html.includes('data-testid="state-loading"'), 'restored loader mounted (SSR loading state)');
    assert.strictEqual(html.includes('structural-surface-unavailable'), false, 'no structural page');
    assert.strictEqual(html.includes('app-placeholder'), false, 'no feature placeholder');
    assert.ok(html.includes('app-shell'), 'rendered inside the shell');
    // Loader-level: before any payload arrives the loader renders Loading, never data.
    const loader = renderToString(React.createElement(MemoryRouter, { initialEntries: [`/research/events/${SECTOR}`] },
      React.createElement(ResearchEvents)));
    assert.ok(loader.includes('data-testid="state-loading"'));
    assert.strictEqual(/research-events-list|events-provenance/.test(loader), false);
  });

  it('RE-02: Events navigation is `partial` (never implemented); sibling entries unchanged', () => {
    const research = NAV.find((n) => n.label === 'Research');
    assert.ok(research);
    assert.deepStrictEqual(research!.children?.map((c) => [c.label, c.path, c.status]), [
      ['Company', '/research/company/Banking', 'partial'],
      ['Sector', '/research/sector/Banking', 'partial'],
      ['Events', '/research/events/Banking', 'partial'],
      ['Cross-Sector', '/research/cross-sector', 'unavailable'],
      ['Screener', '/screener', 'partial'],
      ['Macro', '/research/macro', 'unavailable'],
    ]);
  });
});

describe('A3 Research Events — governed payload rendering', () => {
  it('RE-03: the four events render the server-delivered timestamps as delivered, with sources and provenance', () => {
    const html = view();
    const delivered: Record<(typeof ORDER)[number], string> = {
      calibration: EVIDENCE.provenance.calibratedAt,
      snapshot: EVIDENCE.snapshot.generatedAt,
      evidence: EVIDENCE.evidence.generatedAt,
      replay: REPLAY.original.generatedAt,
    };
    for (const k of ORDER) {
      assert.ok(delivered[k], `${k}: the authority delivers a timestamp`);
      assert.strictEqual(cell(html, `event-${k}-time`), delivered[k], `${k}: rendered exactly as delivered`);
    }
    assert.deepStrictEqual(ORDER.map((k) => cell(html, `event-${k}-source`)), [
      '/api/evidence/:sector · provenance.calibratedAt',
      '/api/evidence/:sector · snapshot.generatedAt',
      '/api/evidence/:sector · evidence.generatedAt',
      '/api/replay/:sector · original.generatedAt',
    ]);
    const t = text(html);
    for (const label of ['Calibration', 'Snapshot generated', 'Evidence generated', 'Replay original generated']) {
      assert.ok(t.includes(label), label);
    }
    assert.match(html, new RegExp(`<h1[^>]*>${SECTOR}</h1>`));
    const p = EVIDENCE.provenance;
    assert.strictEqual(cell(html, 'events-provenance'), `${p.dataSource} · freshness ${p.freshness} · ${p.transportSemantics}`);
    assert.match(html, new RegExp(`data-testid="events-sector-link" href="/research/sector/${SECTOR}"`));
    assert.match(html, new RegExp(`data-testid="events-company-link" href="/research/company/${SECTOR}"`));
    assert.strictEqual(html.includes('events-partial-error'), false, 'no partial note when both sources delivered');
  });

  it('RE-04: fixed donor lifecycle order (never timestamp-sorted); "not a temporal timeline"; no merging', () => {
    // Timestamps deliberately in REVERSE chronological order: a sort would reorder them.
    const ev = json<EvidenceData>({
      ...EVIDENCE,
      provenance: { ...EVIDENCE.provenance, calibratedAt: '2026-08-12T00:00:00.000Z' },
      snapshot: { ...EVIDENCE.snapshot, generatedAt: '2026-08-11T00:00:00.000Z' },
      evidence: { ...EVIDENCE.evidence, generatedAt: '2026-08-10T00:00:00.000Z' },
    });
    const rp = json<ReplayData>({ ...REPLAY, original: { ...REPLAY.original, generatedAt: '2026-08-09T00:00:00.000Z' } });
    assert.deepStrictEqual(eventKeys(view({ evidence: ev, replay: rp })), [...ORDER], 'lifecycle order is fixed');
    // As served, all four share the frozen reference-baseline date: four distinct events, never merged.
    const html = view();
    assert.deepStrictEqual(eventKeys(html), [...ORDER]);
    assert.strictEqual(new Set(ORDER.map((k) => cell(html, `event-${k}-time`))).size, 1, 'served timestamps are identical');
    const note = cell(html, 'events-lifecycle-note');
    assert.ok(note.includes('Lifecycle order, not chronological'));
    assert.ok(note.includes('(Calibration → Snapshot → Evidence → Replay)'));
    assert.ok(note.includes('so this is not a temporal timeline.'));
    assert.strictEqual(/\.sort\(/.test(strip(read(EVENTS_FILE))), false, 'no sorting logic');
  });

  it('RE-05: missing values render `unavailable`; one failed source → partial note + unavailable events', () => {
    // Replay source failed (loader: replay=null, partialError="Unable to load: replay").
    const noReplay = view({ replay: null, partialError: 'Unable to load: replay' });
    assert.strictEqual(cell(noReplay, 'event-replay-time'), 'unavailable');
    assert.strictEqual(cell(noReplay, 'event-calibration-time'), EVIDENCE.provenance.calibratedAt);
    assert.ok(text(noReplay).includes('Some event sources are unavailable (Unable to load: replay). Missing events are shown as unavailable.'));
    // Evidence source failed: its three events are unavailable; the replay event is delivered;
    // provenance falls back to the replay payload's governed provenance (donor `evidence ?? replay`).
    const noEvidence = view({ evidence: null, partialError: 'Unable to load: evidence' });
    assert.deepStrictEqual(ORDER.map((k) => cell(noEvidence, `event-${k}-time`)),
      ['unavailable', 'unavailable', 'unavailable', REPLAY.original.generatedAt]);
    assert.ok(text(noEvidence).includes('Some event sources are unavailable (Unable to load: evidence).'));
    assert.ok(cell(noEvidence, 'events-provenance').startsWith(`${REPLAY.provenance.dataSource} · freshness`));
    // A delivered payload missing a single field: that event alone is unavailable (never invented).
    const partialField = json<EvidenceData>({ ...EVIDENCE, snapshot: { ...EVIDENCE.snapshot, generatedAt: '' } });
    const pf = view({ evidence: partialField });
    assert.strictEqual(cell(pf, 'event-snapshot-time'), 'unavailable');
    assert.strictEqual(cell(pf, 'event-evidence-time'), EVIDENCE.evidence.generatedAt);
  });

  it('RE-06: the sector selector is sourced only from /api/decision-matrix; loading and error are honest', () => {
    const html = view();
    const options = [...html.matchAll(/<option value="([^"]*)"/g)].map((m) => decode(m[1]!));
    assert.deepStrictEqual(options, MATRIX.companies.map((c) => c.sector), 'options = governed matrix universe, in order');
    assert.match(html, new RegExp(`<option value="${SECTOR}" selected="">`), 'current sector selected');
    const loading = view({ sectors: null });
    assert.ok(loading.includes('data-testid="sector-selector-loading"'));
    assert.strictEqual(loading.includes('data-testid="sector-select"'), false);
    const failed = view({ sectors: null, sectorsError: 'Error: 503' });
    assert.ok(text(failed).includes('Unable to load sector list: Error: 503'));
    assert.strictEqual(failed.includes('<option'), false, 'no hardcoded fallback universe');
    assert.deepStrictEqual(eventKeys(failed), [...ORDER], 'events still render independently of the selector');
  });
});

describe('A3 Research Events — client authority and fail-closed', () => {
  it('RE-07a: the surface reaches data only through the three existing clients (relative /api paths)', () => {
    const code = strip(read(EVENTS_FILE));
    assert.match(code, /import \{ fetchEvidenceData, type EvidenceData \} from '\.\.\/\.\.\/api\/evidence\.js';/);
    assert.match(code, /import \{ fetchReplayData, type ReplayData \} from '\.\.\/\.\.\/api\/replay\.js';/);
    assert.match(code, /import \{ fetchDecisionMatrixData, type MatrixCompany \} from '\.\.\/\.\.\/api\/decisionMatrix\.js';/);
    assert.strictEqual(/\bfetch\(|authFetch|XMLHttpRequest|https?:\/\/|localhost|127\.0\.0\.1|878[78]/.test(code), false, 'no direct network call');
    assert.strictEqual(/asOf|searchParams|URLSearchParams|localStorage|sessionStorage|indexedDB/.test(code), false, 'no PIT parameter or persistence');
    assert.strictEqual(/computeCertified|frontend\/server|src\/transports|iips-platform|from 'node:/.test(code), false, 'no server import');
  });

  it('RE-07b: end-to-end over real HTTP — delivered as served; one failed source; unknown ids fail closed', async () => {
    const server = createResearchSectorServer();
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    const urls: string[] = [];
    let failReplay = false;
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      urls.push(String(input));
      if (failReplay && String(input).startsWith('/api/replay/')) return new Response('unavailable', { status: 503 });
      return original(`http://127.0.0.1:${port}${String(input)}`, init);
    }) as typeof fetch;
    try {
      assert.deepStrictEqual(await fetchDecisionMatrixData(), MATRIX);
      assert.deepStrictEqual(await fetchEvidenceData(SECTOR), EVIDENCE);
      assert.deepStrictEqual(await fetchReplayData(SECTOR), REPLAY);
      assert.deepStrictEqual(urls, ['/api/decision-matrix', `/api/evidence/${SECTOR}`, `/api/replay/${SECTOR}`], 'relative GETs only');
      // One source failing: the donor's allSettled keeps the other source's events.
      failReplay = true;
      const [e, r] = await Promise.allSettled([fetchEvidenceData(SECTOR), fetchReplayData(SECTOR)]);
      assert.strictEqual(e.status, 'fulfilled');
      assert.strictEqual(r.status, 'rejected');
      failReplay = false;
      // Unknown identifier: the unchanged authority refuses both (404) → both rejected →
      // the loader sets 'Unable to load research events' → ErrorState; no events rendered.
      const [ue, ur] = await Promise.allSettled([fetchEvidenceData('EQ_INFY_IN'), fetchReplayData('EQ_INFY_IN')]);
      assert.strictEqual(ue.status, 'rejected');
      assert.strictEqual(ur.status, 'rejected');
      await assert.rejects(fetchEvidenceData('EQ_INFY_IN'), /404/);
      await assert.rejects(fetchReplayData('EQ_INFY_IN'), /404/);
    } finally {
      globalThis.fetch = original;
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('RE-08: the loader keeps the donor fail-closed sequence before rendering the view', () => {
    const code = strip(read(EVENTS_FILE));
    const loader = code.slice(code.indexOf('export function ResearchEvents()'), code.indexOf('export function ResearchEventsView('));
    assert.ok(loader.length > 0, 'loader precedes the view (donor line order)');
    for (const s of [
      'Promise.allSettled([fetchEvidenceData(id), fetchReplayData(id)])',
      "const ev = e.status === 'fulfilled' ? e.value : null;",
      "const rp = r.status === 'fulfilled' ? r.value : null;",
      "if (e.status === 'rejected') failures.push('evidence');",
      "if (r.status === 'rejected') failures.push('replay');",
      "setPartialError(failures.length > 0 ? `Unable to load: ${failures.join(', ')}` : null);",
      "setError(!ev && !rp ? 'Unable to load research events' : null);",
    ]) assert.ok(loader.includes(s), `donor loader line: ${s}`);
    const idx = ['if (loading) return <LoadingState />;', 'if (error) return <ErrorState message={error} />;', '<ResearchEventsView']
      .map((s) => { const i = loader.indexOf(s); assert.ok(i >= 0, s); return i; });
    assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, 'loading → error → view');
    for (const st of ['useState<EvidenceData | null>(null)', 'useState<ReplayData | null>(null)', 'useState<MatrixCompany[] | null>(null)']) {
      assert.ok(loader.includes(st), `no seeded/fallback payload: ${st}`);
    }
  });
});

describe('A3 Research Events — no new route / data authority; donor fidelity', () => {
  it('RE-09a: server, clients, shared components, route map, dev proxy and dependencies are byte-unchanged', () => {
    const PINNED: Record<string, string> = {
      'frontend/server/research-sector-transport.ts': '373585c1fc6432b1dd39e813c4c57340a760b8be66b426821338eb71b906b785',
      'frontend/src/api/evidence.ts': '3a6797e2b2d4ffb09fa504cf77bc4fd4a50345a8b97ddb6cf3f69c82771fb16f',
      'frontend/src/api/replay.ts': 'bac8b56f04124ac866d2dad24a953338852fa2f52055351f8632936adff4fc9d',
      'frontend/src/api/decisionMatrix.ts': '742d680645a676e9821504cd5ee5e3f9e96862936dcd0fe36683562e9dba652f',
      'frontend/src/api/executive.ts': 'a404a58d783a4398f938336ff498cc429eb236df607ddf1ef86dc0347ab05817',
      'frontend/src/components/state/StateComponents.tsx': '41a0cb7a9f433615dbe902259935785cc97096f2a60f4c5c7fce3878940a3986',
      'frontend/src/components/ui/Badges.tsx': '190a27fdffcc9bfe1abbeb7f64994b4783e6e7429eb97c3fc0889cbbf826f259',
      'frontend/src/app/routes.ts': 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085',
      'vite.config.ts': 'd3bc403b0d99f70fef4cdcbd2c82f3ef3da12ce731cb392f73173d67c569d943',
      'package.json': '04d517b50d19802b1693e3afac08d7645961588d5b0693a2eff7cf221c471ce6',
    };
    for (const [file, expected] of Object.entries(PINNED)) assert.strictEqual(sha(file), expected, `${file} unchanged`);
  });

  it('RE-09b: direct imports are the donor set (NodeNext) and resolve to existing modules', () => {
    const imports = [...read(EVENTS_FILE).matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['react', 'react-router-dom', '../../api/evidence.js', '../../api/replay.js',
      '../../api/decisionMatrix.js', '../../components/state/StateComponents.js', '../../components/ui/Badges.js']);
    const dir = resolve(ROOT, EVENTS_FILE, '..');
    for (const rel of imports.filter((i) => i.startsWith('.'))) {
      const target = resolve(dir, rel.replace(/\.js$/, ''));
      assert.ok(existsSync(`${target}.ts`) || existsSync(`${target}.tsx`), `${rel} exists`);
    }
  });

  it('RE-09c: donor lineage markers carried; existing colour tokens only; no AD-17 verification claim', () => {
    const src = read(EVENTS_FILE);
    assert.ok(src.includes('d64f58a1adee96dd3cdf9e6d7688e01a17963859'), 'donor blob recorded');
    assert.ok(src.includes('60c513631d81f88ffa6e707de67ad8c60b126b16'), 'donor commit recorded');
    assert.ok(src.includes('Program v3.0 — P-4: Research Events workspace (composition-only read surface).'), 'donor header carried');
    assert.ok(src.includes('No event store, no persistence, no new'), 'donor non-fabrication statement carried');
    const code = strip(src);
    const css = read('frontend/src/index.css');
    for (const tok of new Set([...code.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))) {
      assert.ok(css.includes(`${tok}:`), `${tok} is an existing token`);
    }
    assert.strictEqual(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(code), false, 'no literal colour');
    // AD-17: the surface never reads or displays replay verification fields.
    assert.strictEqual(/byteIdentical|reproduced|verified|MATCH/i.test(code), false, 'no replay verification field or claim');
    // The only rendered mention of replay verification is the AUTHORITY's own delivered provenance
    // disclosure (footer, 1:1): it states the literals are NOT produced by a runtime verification.
    const html = view();
    const disclosure = EVIDENCE.provenance.dataSource;
    assert.match(disclosure, /NOT produced by a runtime replay or EvidencePipeline verification/, 'delivered disclosure is a negation');
    assert.ok(cell(html, 'events-provenance').startsWith(disclosure), 'rendered 1:1 in the provenance footer');
    const outsideDisclosure = text(html).split(disclosure).join('');
    assert.strictEqual(/byte-identical|byteIdentical|verif|reproduc|MATCH/i.test(outsideDisclosure), false,
      'no verification claim anywhere outside the delivered NOT-verified disclosure');
  });

  it('RE-10: PU-22 stays authoritative — no Vitest / @testing-library / jsdom introduced', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom']) {
      assert.strictEqual(banned in all, false, `${banned} must not be added`);
    }
    const self = read('tests/research_events_recovery.test.ts');
    const specifiers = [...self.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    for (const s of specifiers) assert.strictEqual(/vitest|testing-library|jsdom/.test(s), false, `${s} is permitted`);
    assert.strictEqual(existsSync(resolve(ROOT, 'frontend/src/features/research/ResearchEvents.test.tsx')), false,
      'the donor Vitest file is NOT ported');
  });
});
