/**
 * Test Suite: A2 EVIDENCE RECOVERY — /evidence, /evidence/:id, /evidence/replay/:id.
 *
 * Scope: the proven donor Evidence surfaces are restored onto the EXISTING read authorities and
 * the EXISTING current-lineage clients (Option A — the Executive precedent, ea70a8c):
 *   /evidence            → EvidenceHub       (donor blob fa85f2d9) — /api/decision-matrix
 *   /evidence/:id        → EvidenceExplorer  (donor blob 9f5927ff) — /api/evidence/:id
 *   /evidence/replay/:id → ReplayExplorer    (donor blob 1dfc2855, the AD-17-safe tip;
 *                                             NEVER the pre-amendment capture 98755f7c)
 * Adaptations: NodeNext `.js` specifiers + pure-view extraction only. UI11 EvidenceSurface is
 * RETAINED (file + import) unrouted.
 *
 * What is asserted:
 *   EV-01  route mounting — each route binds its restored surface; no structural page remains;
 *   EV-02  navigation — Evidence / Decision Evidence remain `partial`; UI11 retained;
 *   EV-03  Hub renders the governed universe as delivered (rows, links, provenance);
 *   EV-04  Explorer renders the governed evidence chain as delivered;
 *   EV-05  Replay renders REPORTED literals, NOT VERIFIED, with the AD-17 disclosure and no
 *          pass/fail colouring; `byteIdentical=true` is never presented as verified;
 *   EV-06  unavailable values stay unavailable (null confidence → "Confidence unavailable");
 *   EV-07  existing client authority — surfaces use only the existing clients, end-to-end over
 *          real HTTP against the UNCHANGED authority;
 *   EV-08  unknown identifiers fail closed (authority 404 → client rejects → ErrorState);
 *   EV-09  no new route / data authority — hash pins on server, clients, AD-17 components,
 *          UI11, routes.ts and vite.config.ts; donor fidelity markers.
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
import { EvidenceHub, EvidenceHubView } from '../frontend/src/features/evidence/EvidenceHub.js';
import { EvidenceExplorer, EvidenceExplorerView } from '../frontend/src/features/evidence/EvidenceExplorer.js';
import { ReplayExplorer, ReplayExplorerView } from '../frontend/src/features/replay/ReplayExplorer.js';
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

const HUB = 'frontend/src/features/evidence/EvidenceHub.tsx';
const EXPLORER = 'frontend/src/features/evidence/EvidenceExplorer.tsx';
const REPLAY = 'frontend/src/features/replay/ReplayExplorer.tsx';
const SECTOR = 'Banking';

const MATRIX = json<DecisionMatrixData>(computeCertifiedDecisionMatrix());
const EVIDENCE = json<EvidenceData>(computeCertifiedEvidence(SECTOR));
const REPLAY_DATA = json<ReplayData>(computeCertifiedReplay(SECTOR));

const inRouter = (el: React.ReactElement): string => renderToString(React.createElement(MemoryRouter, {}, el));
function renderAt(path: string): string {
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })));
}

describe('A2 Evidence — route mounting and navigation', () => {
  it('EV-01: each Evidence route binds its restored donor surface; no structural page remains', () => {
    assert.strictEqual(ROUTES.evidence, '/evidence');
    assert.strictEqual(ROUTES.evidenceDetail, '/evidence/:id');
    assert.strictEqual(ROUTES.evidenceReplay, '/evidence/replay/:id');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.evidence\} element=\{<EvidenceHub \/>\} \/>/);
    assert.match(app, /<Route path=\{ROUTES\.evidenceDetail\} element=\{<EvidenceExplorer \/>\} \/>/);
    assert.match(app, /<Route path=\{ROUTES\.evidenceReplay\} element=\{<ReplayExplorer \/>\} \/>/);
    for (const gone of ['EvidenceDetailStructural', 'EvidenceReplayStructural', 'element={<EvidenceSurface />}']) {
      assert.strictEqual(app.includes(gone), false, `${gone} must no longer be routed`);
    }
    for (const path of ['/evidence', `/evidence/${SECTOR}`, `/evidence/replay/${SECTOR}`]) {
      const html = renderAt(path);
      assert.ok(html.includes('data-testid="state-loading"'), `${path}: restored loader mounted (SSR loading state)`);
      assert.strictEqual(html.includes('structural-surface-unavailable'), false, `${path}: no structural page`);
      assert.strictEqual(html.includes('app-placeholder'), false, `${path}: no feature placeholder`);
      assert.ok(html.includes('app-shell'), `${path}: rendered inside the shell`);
    }
    // Loader-level: each restored loader renders the fail-closed Loading state, never data.
    for (const el of [React.createElement(EvidenceHub), React.createElement(EvidenceExplorer), React.createElement(ReplayExplorer)]) {
      const html = inRouter(el);
      assert.ok(html.includes('data-testid="state-loading"'));
      assert.strictEqual(/replay-original|evidence-provenance|evidence-hub-provenance/.test(html), false);
    }
  });

  it('EV-02: navigation stays `partial`; UI11 EvidenceSurface file and import are retained', () => {
    const evidence = NAV.find((n) => n.label === 'Evidence');
    assert.ok(evidence);
    assert.strictEqual(evidence!.path, '/evidence');
    assert.strictEqual(evidence!.status, 'partial', 'never implemented while AD-17 is unresolved');
    assert.deepStrictEqual(evidence!.children?.map((c) => [c.label, c.path, c.status]),
      [['Decision Evidence', '/evidence', 'partial']]);
    assert.ok(existsSync(resolve(ROOT, 'frontend/src/features/evidence/EvidenceSurface.tsx')), 'UI11 module retained');
    assert.match(strip(read('frontend/src/app/App.tsx')), /import \{ EvidenceSurface \} from '\.\.\/features\/evidence\/EvidenceSurface\.js';/,
      'UI11 import retained (Executive precedent)');
  });
});

describe('A2 Evidence — governed payload rendering', () => {
  it('EV-03: the Hub renders the governed universe as delivered (rows, links, provenance)', () => {
    const html = inRouter(React.createElement(EvidenceHubView, {
      companies: MATRIX.companies, provenance: MATRIX.provenance.dataSource, freshness: MATRIX.provenance.freshness,
    }));
    const t = text(html);
    assert.ok(html.includes('aria-label="Evidence hub"'));
    assert.strictEqual(MATRIX.companies.length, 13);
    for (const c of MATRIX.companies) {
      assert.ok(decode(html).includes(`href="/evidence/${c.sector}"`), `${c.sector}: evidence link`);
      assert.ok(decode(html).includes(`href="/evidence/replay/${c.sector}"`), `${c.sector}: replay link`);
      assert.ok(t.includes(c.sector), `${c.sector} row`);
    }
    assert.ok(t.includes(`${MATRIX.provenance.dataSource} · freshness ${MATRIX.provenance.freshness}`), 'provenance verbatim');
    assert.ok(/snapshot/i.test(t), 'SNAPSHOT disclosed');
    const empty = inRouter(React.createElement(EvidenceHubView, { companies: [], provenance: null, freshness: 'SNAPSHOT' }));
    assert.ok(text(empty).includes('No evidence available'), 'empty universe renders the honest empty label');
    assert.ok(text(empty).includes('governed · freshness SNAPSHOT'), 'absent provenance is not fabricated');
  });

  it('EV-04: the Explorer renders the governed evidence chain as delivered', () => {
    const html = inRouter(React.createElement(EvidenceExplorerView, { id: SECTOR, data: EVIDENCE }));
    const t = text(html);
    assert.ok(html.includes('aria-label="Evidence explorer"'));
    assert.ok(t.includes(`Evidence — ${SECTOR}`));
    assert.ok(t.includes(`Composite: ${EVIDENCE.decision.composite}`));
    assert.ok(t.includes(`${Math.round((EVIDENCE.decision.confidence as number) * 100)}% confidence`));
    for (const s of EVIDENCE.evidence.supportingScores) assert.ok(t.includes(s.name), `supporting score ${s.name}`);
    for (const v of [EVIDENCE.evidence.evidenceId, EVIDENCE.evidence.engineId, EVIDENCE.evidence.calibrationVersion,
      EVIDENCE.evidence.provenance.frameworkVersion, EVIDENCE.evidence.provenance.engineVersion,
      EVIDENCE.evidence.provenance.methodologyVersion, EVIDENCE.snapshot.snapshotId]) {
      assert.ok(t.includes(v), `governed value ${v} rendered verbatim`);
    }
    assert.ok(html.includes(`href="/evidence/replay/${SECTOR}"`), 'links to the restored Replay Explorer');
    assert.ok(t.includes(`${EVIDENCE.provenance.dataSource} · freshness ${EVIDENCE.provenance.freshness}`));
    // The embedded replay summary is the shared AD-17-safe display.
    assert.ok(html.includes('data-testid="ad17-replay-literals"'));
    assert.ok(t.includes('Reported replay values — NOT VERIFIED'));
    assert.ok(html.includes('data-testid="ad17-disclosure"'));
  });

  it('EV-05: Replay shows REPORTED literals, NOT VERIFIED, with the AD-17 disclosure and no pass/fail colour', () => {
    assert.strictEqual(REPLAY_DATA.replay.byteIdentical, true, 'fixture literal (not a verification)');
    const html = inRouter(React.createElement(ReplayExplorerView, { id: SECTOR, data: REPLAY_DATA }));
    const t = text(html);
    assert.ok(html.includes('aria-label="Replay explorer"'));
    assert.ok(t.includes('Reported byteIdentical: true — NOT VERIFIED'), 'byteIdentical=true is reported, not verified');
    assert.ok(t.includes('Reported replay values — NOT VERIFIED'));
    assert.ok(html.includes('data-testid="replay-literal-byteIdentical">true<'), 'literal carried verbatim');
    assert.ok(html.includes('data-testid="replay-literal-reproduced">true<'));
    assert.ok((html.match(/data-testid="ad17-disclosure"/g) ?? []).length >= 1, 'AD-17 disclosure present');
    assert.ok(t.includes('AD-17 / M-2 — UNRESOLVED.'));
    assert.ok(t.includes(REPLAY_DATA.note), 'governed note verbatim');
    for (const r of REPLAY_DATA.replay.evidenceRefs) assert.ok(t.includes(r), `evidence ref ${r}`);
    // Prohibited claims and pass/fail semantics — scoped to the replay RESULT and EQUIVALENCE
    // sections (the header's "CERTIFIED RESULT" authority badge marks the certified ORIGINAL
    // result's authority, is carried by the AD-17-amended donor tip, and is not a replay verdict).
    const start = html.indexOf('data-testid="replay-summary"');
    const end = html.indexOf('data-testid="replay-evidence-refs"');
    assert.ok(start > 0 && end > start, 'replay result + equivalence sections located');
    const replaySection = html.slice(start, end);
    // The AD-17 disclosure's own prohibition sentence (rendered once per disclosure) is excluded.
    const replayText = text(replaySection).replace(/must not be read as evidence of verified replay or\s+verified byte identity/g, '');
    for (const banned of [/MATCH/i, /\bverified replay\b/i, /\bPASS\b/, /\bFAIL\b/, /✓|✔|✗|✘/]) {
      assert.strictEqual(banned.test(replayText), false, `replay sections: no ${banned}`);
    }
    for (const colour of ['--color-status-', '--color-authority-']) {
      assert.strictEqual(replaySection.includes(colour), false, `replay sections: no pass/fail/authority colour (${colour}*)`);
    }
    // The page's only ✓ is the single header authority badge — never attached to replay.
    assert.strictEqual((html.match(/✓|✔/g) ?? []).length, 1, 'exactly one ✓ on the page');
    assert.strictEqual((html.match(/data-testid="badge-certified"/g) ?? []).length, 1, 'it is the CERTIFIED RESULT authority badge');
    assert.ok(html.indexOf('badge-certified') < html.indexOf('Original Certified Result'), 'badge sits in the header, above the replay sections');
    assert.strictEqual(/MATCH — byte-identical/i.test(t), false, 'the pre-AD-17 claim is absent from the whole page');
    // Shared verification flags stay pinned false in the restored source.
    const code = strip(read(REPLAY));
    assert.match(code, /verifiedReproduction: false,/);
    assert.match(code, /verifiedByteIdentical: false,/);
    assert.strictEqual(/verified(Reproduction|ByteIdentical):\s*true/.test(code), false);
    assert.ok(html.includes(`href="/evidence/${SECTOR}"`) && html.includes(`href="/research/company/${SECTOR}"`), 'donor navigation links');
  });

  it('EV-06: unavailable values remain unavailable (null confidence), never fabricated', () => {
    const ev = json<EvidenceData>({ ...EVIDENCE, decision: { ...EVIDENCE.decision, confidence: null } });
    const rp = json<ReplayData>({ ...REPLAY_DATA, original: { ...REPLAY_DATA.original, confidence: null } });
    const e = text(inRouter(React.createElement(EvidenceExplorerView, { id: SECTOR, data: ev })));
    const r = text(inRouter(React.createElement(ReplayExplorerView, { id: SECTOR, data: rp })));
    for (const t of [e, r]) {
      assert.ok(t.includes('Confidence unavailable'));
      assert.strictEqual(/\d+% confidence/.test(t), false, 'no fabricated confidence');
    }
  });
});

describe('A2 Evidence — client authority and fail-closed', () => {
  it('EV-07a: surfaces reach data only through the existing clients (relative /api paths)', () => {
    const uses: Record<string, RegExp> = {
      [HUB]: /import \{ fetchDecisionMatrixData, type MatrixCompany \} from '\.\.\/\.\.\/api\/decisionMatrix\.js';/,
      [EXPLORER]: /import \{ fetchEvidenceData, type EvidenceData \} from '\.\.\/\.\.\/api\/evidence\.js';/,
      [REPLAY]: /import \{ fetchReplayData, type ReplayData \} from '\.\.\/\.\.\/api\/replay\.js';/,
    };
    for (const [file, imp] of Object.entries(uses)) {
      const code = strip(read(file));
      assert.match(code, imp, `${file} uses the existing client`);
      assert.strictEqual(/\bfetch\(|authFetch|XMLHttpRequest|https?:\/\/|localhost|127\.0\.0\.1|878[78]/.test(code), false, `${file}: no direct network call`);
      assert.strictEqual(/asOf|searchParams|URLSearchParams/.test(code), false, `${file}: no PIT/selection parameter`);
      assert.strictEqual(/computeCertified|frontend\/server|src\/transports|iips-platform|from 'node:/.test(code), false, `${file}: no server import`);
    }
    assert.match(strip(read('frontend/src/api/evidence.ts')), /authFetch\(`\$\{baseUrl\}\/api\/evidence\/\$\{encodeURIComponent\(sector\)\}`\)/);
    assert.match(strip(read('frontend/src/api/replay.ts')), /authFetch\(`\$\{baseUrl\}\/api\/replay\/\$\{encodeURIComponent\(sector\)\}`\)/);
  });

  it('EV-07b/EV-08: end-to-end over real HTTP — delivered as served; unknown identifiers fail closed', async () => {
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
      assert.deepStrictEqual(await fetchDecisionMatrixData(), MATRIX);
      assert.deepStrictEqual(await fetchEvidenceData(SECTOR), EVIDENCE);
      assert.deepStrictEqual(await fetchReplayData(SECTOR), REPLAY_DATA);
      assert.deepStrictEqual(urls, ['/api/decision-matrix', `/api/evidence/${SECTOR}`, `/api/replay/${SECTOR}`], 'relative GETs only');
      // Unknown identifiers: the unchanged authority refuses (404); the clients reject, which the
      // loaders' `.catch` turns into ErrorState — no data is rendered.
      await assert.rejects(fetchEvidenceData('EQ_INFY_IN'), /404/);
      await assert.rejects(fetchReplayData('EQ_INFY_IN'), /404/);
    } finally {
      globalThis.fetch = original;
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('EV-08b: every loader keeps the donor fail-closed order before any payload dereference', () => {
    const cases: ReadonlyArray<readonly [string, string, string, string]> = [
      [HUB, 'export function EvidenceHub()', 'Unable to load evidence directory: ${error}', 'if (!companies) return <UnavailableState />;'],
      [EXPLORER, 'export function EvidenceExplorer()', 'Unable to load evidence: ${error}', 'if (!data) return <UnavailableState />;'],
      [REPLAY, 'export function ReplayExplorer()', 'Unable to load replay: ${error}', 'if (!data) return <UnavailableState />;'],
    ];
    for (const [file, sig, errMsg, unavailable] of cases) {
      const code = strip(read(file));
      const loader = code.slice(code.indexOf(sig));
      const idx = ['if (loading) return <LoadingState />;', `if (error) return <ErrorState message={\`${errMsg}\`} />;`, unavailable, 'View']
        .map((s) => { const i = loader.indexOf(s); assert.ok(i >= 0, `${file}: ${s}`); return i; });
      assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, `${file}: loading → error → unavailable → view`);
      assert.match(loader, /useState<[A-Za-z[\]]+ \| null>\(null\)/, `${file}: no seeded/fallback payload`);
    }
  });
});

describe('A2 Evidence — no new route / data authority; donor fidelity', () => {
  it('EV-09a: server, clients, AD-17 components, UI11, route map and dev proxy are byte-unchanged', () => {
    const PINNED: Record<string, string> = {
      // B1 Cross-Sector restoration (superseded): the authorized GET /api/cross-sector endpoint was added to
      // this authority, so its pin moves 373585c1 -> 4fc4c6fc. The other four authorities are byte-identical
      // (asserted by cross_sector_recovery.test.ts CS-13a reconstruction). Every other pin is unchanged.
      'frontend/server/research-sector-transport.ts': '4fc4c6fc667f15b57523579b48f2153f39b7c002120e303266e38de807bbc8d0',
      'frontend/src/api/evidence.ts': '3a6797e2b2d4ffb09fa504cf77bc4fd4a50345a8b97ddb6cf3f69c82771fb16f',
      'frontend/src/api/replay.ts': 'bac8b56f04124ac866d2dad24a953338852fa2f52055351f8632936adff4fc9d',
      'frontend/src/api/decisionMatrix.ts': '742d680645a676e9821504cd5ee5e3f9e96862936dcd0fe36683562e9dba652f',
      'frontend/src/components/evidence/Ad17Disclosure.tsx': '530c092f1b4cf3b47e54e8481943e7956277a71ac2bcee7b43b5073bd54a5f9e',
      'frontend/src/components/evidence/EvidenceExplorerComponents.tsx': '3c76f7fc8b296d6cf63a5977bebdc8ce25129ee7413dbea638f8a5ec8feca5f7',
      'frontend/src/features/evidence/EvidenceSurface.tsx': 'c067ab691cd93fd441b914333293c3aed8eda1dc0c48264a3beae2ad5977e7cf',
      'frontend/src/app/routes.ts': 'e3ddfc47dd40d731cfdb5e59b91ad3726db2b0953ff27e6f93afd206f53ee085',
      'vite.config.ts': 'd3bc403b0d99f70fef4cdcbd2c82f3ef3da12ce731cb392f73173d67c569d943',
    };
    for (const [file, expected] of Object.entries(PINNED)) assert.strictEqual(sha(file), expected, `${file} unchanged`);
  });

  it('EV-09b: direct imports are the donor set (NodeNext) and resolve to existing modules', () => {
    const EXPECTED: Record<string, string[]> = {
      [HUB]: ['react', 'react-router-dom', '../../api/decisionMatrix.js', '../../components/data/DataComponents.js',
        '../../components/decision/DecisionComponents.js', '../../components/state/StateComponents.js', '../../components/ui/Badges.js'],
      [EXPLORER]: ['react', 'react-router-dom', '../../api/evidence.js', '../../components/decision/DecisionComponents.js',
        '../../components/data/DataComponents.js', '../../components/evidence/EvidenceExplorerComponents.js',
        '../../components/state/StateComponents.js', '../../components/ui/Badges.js'],
      [REPLAY]: ['react', 'react-router-dom', '../../api/replay.js', '../../components/decision/DecisionComponents.js',
        '../../components/evidence/EvidenceExplorerComponents.js', '../../components/evidence/Ad17Disclosure.js',
        '../../components/state/StateComponents.js', '../../components/ui/Badges.js'],
    };
    for (const [file, expected] of Object.entries(EXPECTED)) {
      const imports = [...read(file).matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
      assert.deepStrictEqual(imports, expected, `${file} imports`);
      const dir = resolve(ROOT, file, '..');
      for (const rel of imports.filter((i) => i.startsWith('.'))) {
        const target = resolve(dir, rel.replace(/\.js$/, ''));
        assert.ok(existsSync(`${target}.ts`) || existsSync(`${target}.tsx`), `${rel} exists`);
      }
    }
  });

  it('EV-09c: donor provenance and AD-17 amendment markers are carried; only existing colour tokens', () => {
    const blobs: Record<string, string> = {
      [HUB]: 'fa85f2d941f1b627a7c33d0d91f317e089d224c7',
      [EXPLORER]: '9f5927ff35846c7a0bc702fb525bc5ba8f410008',
      [REPLAY]: '1dfc285503c55745a704a82e669132867825e163',
    };
    const css = read('frontend/src/index.css');
    for (const [file, blob] of Object.entries(blobs)) {
      const src = read(file);
      assert.ok(src.includes(blob), `${file} records its donor blob`);
      assert.strictEqual(src.includes('98755f7c'), false, `${file} does not use the pre-AD-17 capture`);
      const code = strip(src);
      for (const tok of new Set([...code.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))) {
        assert.ok(css.includes(`${tok}:`), `${file}: ${tok} is an existing token`);
      }
      assert.strictEqual(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/.test(code), false, `${file}: no literal colour`);
    }
    const replaySrc = read(REPLAY);
    assert.ok(replaySrc.includes('P13-B-07 AD-17 SAFETY AMENDMENT'), 'AD-17 amendment header carried');
    assert.ok(replaySrc.includes('AD-17 / M-2 REMAIN UNRESOLVED'));
  });
});
