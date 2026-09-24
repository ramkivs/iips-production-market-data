/**
 * Test Suite: Company / Sector Intelligence UI recovery (Prompt 2C) — recovery, boundary and
 * honest-failure guards.
 *
 * Companion to `research_sector_parity.test.ts` (observables parity) and
 * `research_sector_read_authorities.test.ts` (the Prompt-2B authorities).
 *
 * ══ WHAT THIS SUITE PROTECTS ═══════════════════════════════════════════════════════════════
 *  1. RECOVERY — both surfaces exist, are mounted at their routes, and are navigable as
 *     `partial` (never silently promoted to `implemented`). /research (UI03) is untouched.
 *  2. HTTP AUTHORITY CONSUMPTION — the browser clients address the four Prompt-2B endpoints
 *     over HTTP, with the sector percent-encoded, and send NO `asOf` (no PIT).
 *  3. BROWSER BOUNDARY — no browser file imports `src/transports/**`, `iips-platform/**`,
 *     `node:*` or any server module; no provider/network endpoint is contacted from a component.
 *  4. NO FABRICATION — no advisory value, no invented metric, no synthetic price/score, and no
 *     value-invention primitives (Math.random / Date.now).
 *  5. EXCLUSIONS — AI Advisory, PIT/D114/D115, Decision Matrix/Evidence/Replay UI, Events,
 *     Cross-Sector and Macro remain unrecovered.
 *  6. HONEST STATES — the loading / error / unavailable / degraded states are the canonical
 *     components, and the loader fails closed.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import {
  LoadingState, EmptyState, ErrorState, UnavailableState, PermissionDeniedState,
} from '../frontend/src/components/state/StateComponents.js';
import { DataModeUnavailable } from '../frontend/src/components/state/DataModeUnavailable.js';
import { CompanyIntelligence, CompanyIntelligenceView } from '../frontend/src/features/company/CompanyIntelligence.js';
import { SectorIntelligence, SectorIntelligenceView } from '../frontend/src/features/research/SectorIntelligence.js';
import { fetchCompanyData } from '../frontend/src/api/company.js';
import { fetchDecisionMatrixData } from '../frontend/src/api/decisionMatrix.js';
import { computeCertifiedCompany, computeCertifiedDecisionMatrix, computeCertifiedEvidence, computeCertifiedReplay } from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const strip = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** Sorted unique `data-testid` values in a rendered document. */
const keysOf = (html: string): string[] =>
  [...new Set([...html.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]!))].sort();

/**
 * SSR text normalisation. `react-dom/server` separates adjacent text nodes with `<!-- -->`
 * markers, so `Confidence: {x}` renders as `Confidence: <!-- -->x`. Comments carry no
 * observable meaning and are removed before text assertions; HTML entities are decoded so a
 * governed value containing `&` compares equal to its rendered form.
 */
const normalize = (html: string): string => html.replace(/<!--[\s\S]*?-->/g, '');
const decodeEntities = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
/** The visible text of every `data-testid="metric-value"` cell. */
const metricValues = (html: string): string[] =>
  [...html.matchAll(/data-testid="metric-value"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => decodeEntities(normalize(m[1]!).replace(/<[^>]+>/g, '').trim()));

const SURFACES = [
  'frontend/src/features/company/CompanyIntelligence.tsx',
  'frontend/src/features/research/SectorIntelligence.tsx',
  'frontend/src/features/company/CompanyTrustChain.tsx',
  'frontend/src/components/ai/AdvisoryDeferred.tsx',
  'frontend/src/api/company.ts',
  'frontend/src/api/decisionMatrix.ts',
];

function renderAt(path: string): string {
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(SessionProvider, { session: ANONYMOUS_SESSION, children: React.createElement(App, {}) })),
  );
}

/* ── 1. Recovery, mounting, navigation ───────────────────────────────────────────────────── */

describe('Prompt 2C — recovery and route/navigation wiring', () => {
  it('PU-01: both surfaces exist and are exported as components', () => {
    assert.strictEqual(typeof CompanyIntelligence, 'function');
    assert.strictEqual(typeof SectorIntelligence, 'function');
    assert.strictEqual(typeof CompanyIntelligenceView, 'function');
    assert.strictEqual(typeof SectorIntelligenceView, 'function');
  });

  it('PU-02: App.tsx mounts BOTH real surfaces at the two routes (not a placeholder)', () => {
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.researchCompany\} element=\{<CompanyIntelligence \/>\} \/>/,
      'company route must mount the real surface');
    assert.match(app, /<Route path=\{ROUTES\.researchSector\} element=\{<SectorIntelligence \/>\} \/>/,
      'sector route must mount the real surface');
    assert.ok(!app.includes('CompanyIntelligenceStructural'), 'the fail-closed company factory must be gone');
    assert.ok(!app.includes('SectorIntelligenceStructural'), 'the fail-closed sector factory must be gone');
    // The route constants were already present — no route path was added or changed.
    assert.strictEqual(ROUTES.researchCompany, '/research/company/:id');
    assert.strictEqual(ROUTES.researchSector, '/research/sector/:id');
  });

  it('PU-03: both children are navigable as `partial` — recoverable, never promoted to implemented', () => {
    const all = NAV.flatMap((n) => [n, ...(n.children ?? [])]);
    for (const [label, path] of [['Company', '/research/company/Banking'], ['Sector', '/research/sector/Banking']]) {
      const item = all.find((i) => i.label === label && i.path === path);
      assert.ok(item, `${label} nav entry must exist`);
      assert.strictEqual(item!.status, 'partial', `${label} must be 'partial' (AI Advisory deferred, parity partial)`);
    }
  });

  it('PU-04: /research (UI03) is NOT replaced and still renders its own surface', () => {
    const research = NAV.flatMap((n) => [n, ...(n.children ?? [])]).find((i) => i.path === ROUTES.research);
    assert.strictEqual(research?.status, 'partial', '/research must remain the UI03 partial surface');
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /<Route path=\{ROUTES\.research\} element=\{<ResearchSurface \/>\} \/>/, '/research still mounts ResearchSurface');
    assert.strictEqual(app.includes('ResearchHub'), false, 'the donor ResearchHub must NOT be introduced');
  });

  it('PU-05: no UISurfaceId is claimed by either recovered surface', () => {
    for (const path of [ROUTES.researchCompany, ROUTES.researchSector]) {
      const html = renderAt(path.replace(':id', 'Banking'));
      for (const id of ['UI03', 'UI05', 'UI06', 'UI12', 'UI13']) {
        assert.strictEqual(html.includes(id), false, `${path} must not claim ${id}`);
      }
    }
  });

  it('PU-06: the shell renders the recovered routes without falling back to portfolio or a dead page', () => {
    for (const [path, marker] of [
      [ROUTES.researchCompany.replace(':id', 'Banking'), 'state-loading'],
      [ROUTES.researchSector.replace(':id', 'Banking'), 'state-loading'],
    ]) {
      const html = renderAt(path);
      assert.ok(html.includes(`data-testid="${marker}"`), `${path} must render the loader's honest loading state`);
      assert.strictEqual(html.includes('structural-surface-unavailable'), false, `${path} is no longer a structural page`);
    }
  });
});

/* ── 2. HTTP authority consumption ───────────────────────────────────────────────────────── */

describe('Prompt 2C — HTTP authority consumption (browser -> HTTP only)', () => {
  it('PU-07: the company client addresses /api/company/:sector with the sector percent-encoded', async () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any) => {
      urls.push(String(input));
      return new Response(JSON.stringify(computeCertifiedCompany('Capital Markets')), { status: 200 });
    }) as typeof fetch;
    try {
      const data = await fetchCompanyData('Capital Markets');
      assert.deepStrictEqual(urls, ['/api/company/Capital%20Markets'], 'exactly one encoded GET');
      assert.strictEqual(data.sector, 'Capital Markets');
    } finally { globalThis.fetch = original; }
  });

  it('PU-08: the matrix client addresses /api/decision-matrix and sends NO selection parameter', async () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: any) => {
      urls.push(String(input));
      return new Response(JSON.stringify(computeCertifiedDecisionMatrix()), { status: 200 });
    }) as typeof fetch;
    try {
      await fetchDecisionMatrixData();
      assert.deepStrictEqual(urls, ['/api/decision-matrix']);
    } finally { globalThis.fetch = original; }
  });

  it('PU-09: NO client sends `asOf` or a mode — SNAPSHOT only, and a refusal fails closed', async () => {
    for (const rel of ['frontend/src/api/company.ts', 'frontend/src/api/decisionMatrix.ts',
      'frontend/src/features/company/CompanyIntelligence.tsx', 'frontend/src/features/research/SectorIntelligence.tsx']) {
      const code = strip(read(rel));
      assert.strictEqual(/asOf/.test(code), false, `${rel} must not mention asOf`);
      assert.strictEqual(/searchParams/.test(code), false, `${rel} must not read URL selection parameters`);
      assert.strictEqual(/URLSearchParams/.test(code), false, `${rel} must not build a selection query`);
      // No client-sent mode. (`DataModeUnavailable` is the DEGRADED-STATE component name — the
      // guard that HONOURS a server-declared mode — so it is not a client-supplied mode and is
      // excluded from this check. What is banned is a mode the browser asserts or sends.)
      assert.strictEqual(/mode=|['"]mode['"]|dataMode:|PIT['"]/i.test(code.replace(/DataModeUnavailable/g, '')), false,
        `${rel} must not carry or send a mode`);
    }
    // A refused (non-ok) response must throw — the surface then fails closed, never fabricating.
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response('{"error":"refused"}', { status: 400 })) as typeof fetch;
    try {
      await assert.rejects(() => fetchCompanyData('Banking'), /company transport returned 400/);
      await assert.rejects(() => fetchDecisionMatrixData(), /decision-matrix transport returned 400/);
    } finally { globalThis.fetch = original; }
  });

  it('PU-10: the surfaces consume all FOUR Prompt-2B authorities', () => {
    for (const rel of ['frontend/src/features/company/CompanyIntelligence.tsx',
      'frontend/src/features/research/SectorIntelligence.tsx']) {
      const code = strip(read(rel));
      for (const fn of ['fetchCompanyData', 'fetchEvidenceData', 'fetchReplayData', 'fetchDecisionMatrixData']) {
        assert.ok(code.includes(fn), `${rel} must consume ${fn}`);
      }
    }
  });
});

/* ── 3. Browser boundary ─────────────────────────────────────────────────────────────────── */

describe('Prompt 2C — mandatory browser boundary', () => {
  function browserFiles(rel: string): string[] {
    const out: string[] = [];
    for (const e of readdirSync(resolve(ROOT, rel), { withFileTypes: true })) {
      const next = `${rel}/${e.name}`;
      if (e.isDirectory()) out.push(...browserFiles(next));
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(next);
    }
    return out;
  }

  it('PU-11: no browser file imports node:* or a server module, and no NEW file imports the platform', () => {
    const files = browserFiles('frontend/src');
    assert.ok(files.length > 0);

    // RECORDED BASELINE CONDITION, as AMENDED by WUI-RS-03C: the browser path of the Executive
    // client (`api/executive.ts`) no longer imports the certified platform transport — its
    // in-browser compute fallback was removed and the browser is served over HTTP/SSR only.
    // The six remaining browser files below still import platform transport(s) (type or value)
    // so their own Path-L surfaces can resolve types locally. They are owned by the Evidence /
    // Executive Surface / Intelligence / Research / Screener / Security Master gates. The set
    // is PINNED here so no new file can join it — especially not either surface recovered by
    // this unit.
    const BASELINE_PLATFORM_IMPORTERS = [
      'frontend/src/features/evidence/EvidenceSurface.tsx',
      'frontend/src/features/executive/ExecutiveSurface.tsx',
      'frontend/src/features/intelligence/IntelligenceSurface.tsx',
      'frontend/src/features/research/ResearchSurface.tsx',
      'frontend/src/features/screener/MultiFactorScreenerSurface.tsx',
      'frontend/src/features/security-master/SecurityMasterSurface.tsx',
    ];
    const seenImporters: string[] = [];

    for (const f of files) {
      const code = strip(read(f));
      if (code.includes('src/transports') || code.includes('iips-platform')) seenImporters.push(f);
      assert.strictEqual(/from 'node:/.test(code), false, `${f} must not import a node: builtin`);
      assert.strictEqual(code.includes('frontend/server'), false, `${f} must not import a server module`);
      assert.strictEqual(code.includes('research-sector-transport'), false, `${f} must not import the authority module`);
    }

    assert.deepStrictEqual(seenImporters.sort(), [...BASELINE_PLATFORM_IMPORTERS].sort(),
      'the set of browser files importing the platform must be EXACTLY the recorded baseline set');

    // WUI-RS-03C NEW INVARIANT: the Executive browser client holds no platform/transport
    // reference of any kind — its former baseline exemption is retired, not extended.
    const executiveClient = strip(read('frontend/src/api/executive.ts'));
    assert.strictEqual(executiveClient.includes('src/transports'), false,
      'api/executive.ts must not import a platform transport (WUI-RS-03C)');
    assert.strictEqual(executiveClient.includes('iips-platform'), false,
      'api/executive.ts must not import the certified platform (WUI-RS-03C)');
    assert.strictEqual(executiveClient.includes('computeCertifiedExecutive'), false,
      'api/executive.ts must not reference server-only computation (WUI-RS-03C)');

    // The files THIS unit authored or changed are clean — asserted explicitly.
    for (const rel of SURFACES) {
      const code = strip(read(rel));
      assert.strictEqual(code.includes('src/transports'), false, `${rel} (Prompt 2C) must not import src/transports`);
      assert.strictEqual(code.includes('iips-platform'), false, `${rel} (Prompt 2C) must not import iips-platform`);
    }
  });

  it('PU-12: the recovered surface files add no provider/network/socket primitive', () => {
    for (const rel of SURFACES) {
      const code = strip(read(rel));
      for (const banned of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator.sendBeacon',
        'https://', 'http://', 'process.env', 'localStorage', 'sessionStorage']) {
        assert.strictEqual(code.includes(banned), false, `${rel} must not contain ${banned}`);
      }
    }
  });

  it('PU-13: browser network access goes through the single canonical `authFetch` helper', () => {
    for (const rel of ['frontend/src/api/company.ts', 'frontend/src/api/decisionMatrix.ts']) {
      const code = strip(read(rel));
      assert.match(code, /import \{ authFetch \} from '\.\/authFetch\.js';/, `${rel} must use authFetch`);
      assert.strictEqual(/\bfetch\(/.test(code), false, `${rel} must not call bare fetch`);
    }
    // The recovered surfaces themselves never call fetch directly.
    for (const rel of SURFACES) {
      assert.strictEqual(/\bfetch\(/.test(strip(read(rel))), false, `${rel} must not call fetch directly`);
    }
  });

  it('PU-14: the browser ENTRY GRAPH never reaches the server authority or any Node module', () => {
    // Walk the real module graph from the Vite entry point, resolving relative imports.
    const seen = new Set<string>();
    const offenders: string[] = [];
    const walk = (rel: string): void => {
      if (seen.has(rel)) return;
      seen.add(rel);
      if (rel.startsWith('frontend/server/') || rel.includes('research-sector-transport')) {
        offenders.push(rel);
        return;
      }
      const code = strip(read(rel));
      for (const m of code.matchAll(/from\s+'([^']+)'/g)) {
        const spec = m[1]!;
        if (!spec.startsWith('.')) {
          if (spec.startsWith('node:')) offenders.push(`${rel} -> ${spec}`);
          continue; // bare package specifiers are not part of the repository graph
        }
        const fromDir = dirname(resolve(ROOT, rel));
        const resolvedBase = resolve(fromDir, spec);
        const stem = resolvedBase.replace(/\.js$/, '');
        const candidates = [`${resolvedBase}`, `${stem}.tsx`, `${stem}.ts`, `${stem}/index.tsx`, `${stem}/index.ts`];
        for (const cand of candidates) {
          if (existsSync(cand) && cand.endsWith('.ts') || (existsSync(cand) && cand.endsWith('.tsx'))) {
            walk(relative(ROOT, cand)); break;
          }
        }
      }
    };
    walk('frontend/src/main.tsx');
    assert.ok(seen.size > 10, `the browser graph must be substantial (walked ${seen.size} files)`);
    assert.ok(seen.has('frontend/src/features/company/CompanyIntelligence.tsx'), 'company surface is in the browser graph');
    assert.ok(seen.has('frontend/src/features/research/SectorIntelligence.tsx'), 'sector surface is in the browser graph');

    // THIS UNIT'S CLAIM: the Prompt-2B server authority is never reachable from the browser.
    const authority = offenders.filter((o) => o.includes('research-sector-transport') || o.includes('frontend/server'));
    assert.deepStrictEqual(authority, [], 'the server authority must not be browser-reachable');

    // RECORDED BASELINE CONDITION, as AMENDED by WUI-RS-03C: the pre-existing Executive→Node
    // edge (executive_transport.ts reached through api/executive.ts) was REMOVED. The browser
    // runtime graph must now contain ZERO node:* imports attributable to the Executive browser
    // path — in fact ZERO Node-importing modules of any kind — while the Prompt-2B server
    // authority remains equally unreachable.
    const nodeImporters = [...new Set(offenders.map((o) => o.split(' -> ')[0]!))].sort();
    assert.deepStrictEqual(nodeImporters, [],
      'the browser runtime graph must contain ZERO Node-importing modules (WUI-RS-03C)');

    // The recovered surfaces themselves introduce no Node-importing path.
    for (const o of offenders) {
      assert.strictEqual(/CompanyIntelligence|SectorIntelligence|AdvisoryDeferred|api\/company|api\/decisionMatrix/.test(o), false,
        `the recovered surfaces must not add a Node import (${o})`);
    }
  });
});

/* ── 4. No fabrication ───────────────────────────────────────────────────────────────────── */

describe('Prompt 2C — no fabrication', () => {
  it('PU-15: no value-invention primitive and no synthetic data appears in the recovered tree', () => {
    for (const rel of SURFACES) {
      const code = strip(read(rel));
      for (const banned of ['Math.random', 'Date.now', 'new Date(', 'TODO', 'FIXME', 'placeholder value']) {
        assert.strictEqual(code.includes(banned), false, `${rel} must not contain ${banned}`);
      }
    }
  });

  it('PU-16: no advisory value, model identity or grounding claim is invented anywhere', () => {
    for (const rel of SURFACES) {
      const code = strip(read(rel));
      for (const banned of ['adviceId', 'modelVersion', 'nonAuthoritative', 'aiAdvisory', 'ai-advisory',
        'AI EXPLANATION ≠ CERTIFIED RESULT', 'grounded']) {
        assert.strictEqual(code.includes(banned), false, `${rel} must not invent advisory fields`);
      }
    }
  });

  it('PU-17: null confidence is rendered as "unavailable" and NEVER as 0', () => {
    const sectorHtml = normalize(renderToString(React.createElement(MemoryRouter, null,
      React.createElement(SectorIntelligenceView as React.FC<any>, {
        company: computeCertifiedCompany('Technology'), evidence: computeCertifiedEvidence('Technology'),
        replay: computeCertifiedReplay('Technology'),
        sectors: computeCertifiedDecisionMatrix().companies, sectorsError: null,
        selectedSector: 'Technology', onSelectSector: () => {},
      }))));
    // Technology has no certified confidence -> the honest word, never a number.
    assert.ok(sectorHtml.includes('Confidence: unavailable'), 'null confidence must read unavailable');
  });

  it('PU-18: a null matrix axis renders "unavailable" — never 0 (4 sectors have no valuation pillar)', () => {
    const html = normalize(renderToString(React.createElement(MemoryRouter, null,
      React.createElement(SectorIntelligenceView as React.FC<any>, {
        company: computeCertifiedCompany('Insurance'), evidence: computeCertifiedEvidence('Insurance'),
        replay: computeCertifiedReplay('Insurance'),
        sectors: computeCertifiedDecisionMatrix().companies, sectorsError: null,
        selectedSector: 'Insurance', onSelectSector: () => {},
      }))));
    assert.ok(metricValues(html).includes('unavailable'),
      'the absent valuation axis must read unavailable (never 0)');
    assert.strictEqual(metricValues(html).includes('0'), false, 'a null axis must never render as 0');
  });

  it('PU-19: the surfaces render the governed D79/AD-17 attribution, not a verification claim', () => {
    const p = { company: computeCertifiedCompany('Banking'), evidence: computeCertifiedEvidence('Banking'), replay: computeCertifiedReplay('Banking') };
    const companyHtml = renderToString(React.createElement(MemoryRouter, null,
      React.createElement(CompanyIntelligenceView as React.FC<any>, { ...p, sectors: null, sectorsError: null, selectedSector: 'Banking', onSelectSector: () => {} })));
    assert.ok(companyHtml.includes('AD-17 / M-2 — UNRESOLVED.'), 'the AD-17 disclosure must render');
    assert.ok(companyHtml.includes('Reported replay values — NOT VERIFIED'), 'the literals must be marked unverified');
    // Manifest B-2 requires the corrected D79 attribution DISPLAYED VERBATIM. It renders on
    // both surfaces inside existing elements (no new observable key).
    assert.ok(companyHtml.includes('transport fixture constants'), 'the D79 attribution must render verbatim (Company)');
    const sectorHtml = normalize(renderToString(React.createElement(MemoryRouter, null,
      React.createElement(SectorIntelligenceView as React.FC<any>, { ...p, sectors: null, sectorsError: null, selectedSector: 'Banking', onSelectSector: () => {} }))));
    assert.ok(sectorHtml.includes('transport fixture constants'), 'the D79 attribution must render verbatim (Sector)');
    assert.strictEqual(/NOT produced by a runtime ReplayService verification/.test(companyHtml), true,
      'the attribution must state that no runtime replay verification was performed');
  });
});

/* ── 5. Exclusions ───────────────────────────────────────────────────────────────────────── */

describe('Prompt 2C — exclusions held', () => {
  it('PU-20: AI Advisory, PIT/D114/D115 are absent from the recovered tree', () => {
    for (const rel of SURFACES) {
      const code = strip(read(rel));
      for (const banned of ['PitVintage', 'pitVintage', 'p08PitStore', 'd114AdmissionBridge',
        'd114', 'd115', 'keycloak', 'oidc', 'guardRead', 'secured-executor', 'mospi']) {
        assert.strictEqual(code.toLowerCase().includes(banned.toLowerCase()), false, `${rel} must not contain ${banned}`);
      }
    }
    for (const absent of ['frontend/src/api/aiAdvisory.ts', 'frontend/src/components/ai/AiExplanation.tsx',
      'frontend/src/api/companyPitTransport.ts']) {
      assert.strictEqual(existsSync(resolve(ROOT, absent)), false, `${absent} must not exist (excluded)`);
    }
  });

  it('PU-21: Evidence / Replay UI, Events, Cross-Sector and Macro stay unrecovered (Decision Matrix: restored by its own gate)', () => {
    // DECISION MATRIX work item (governed update): DecisionMatrix.tsx is now recovered by its
    // own gate, so it leaves this absent list and the route assertion below moves to the
    // restored surface. Every other exclusion is unchanged.
    // A2 Evidence restoration (superseded): EvidenceExplorer.tsx and ReplayExplorer.tsx are recovered by the A2 gate and
    // leave this absent list. Every other exclusion is unchanged.
    // A3 Research Events restoration (superseded): ResearchEvents.tsx is recovered by the A3 gate and
    // leaves this absent list. Every other exclusion is unchanged.
    for (const absent of [
      'frontend/src/features/research/MacroContext.tsx',
      'frontend/src/features/cross-sector/CrossSectorIntelligence.tsx',
    ]) {
      assert.strictEqual(existsSync(resolve(ROOT, absent)), false, `${absent} must not exist (out of scope)`);
    }
    // The Decision Matrix ROUTE now mounts the restored surface (structural factory removed).
    const app = strip(read('frontend/src/app/App.tsx'));
    assert.match(app, /ROUTES\.intelligenceDecisionMatrix\} element=\{<DecisionMatrix \/>\}/,
      'the Decision Matrix route must mount the restored surface');
    assert.strictEqual(app.includes('DecisionMatrixStructural'), false, 'no stale structural factory remains');
  });

  it('PU-22: no test framework was added and no dependency changed', () => {
    const pkg = JSON.parse(read('package.json')) as { devDependencies: Record<string, string>; dependencies: Record<string, string> };
    const all = { ...pkg.devDependencies, ...pkg.dependencies };
    for (const banned of ['vitest', 'jsdom', '@testing-library/react', '@testing-library/dom']) {
      assert.strictEqual(banned in all, false, `${banned} must not be added`);
    }
    assert.deepStrictEqual(Object.keys(all).sort(), [
      '@types/node', '@types/react', '@types/react-dom', '@vitejs/plugin-react',
      'react', 'react-dom', 'react-router-dom', 'typescript', 'vite',
    ].sort(), 'the dependency set must be exactly the baseline set');
  });

  it('PU-23: the Prompt-2B server authority was not modified by this unit', () => {
    // Its behaviour is asserted by research_sector_read_authorities.test.ts; this guard records
    // that the recovery consumed it without touching it.
    assert.ok(read('frontend/server/research-sector-transport.ts').includes('computeCertifiedPlatform'));
    const code = strip(read('frontend/server/research-sector-transport.ts'));
    assert.strictEqual(code.includes('CompanyIntelligence'), false, 'the server must not know about UI surfaces');
  });
});

/* ── 6. Honest failure states ────────────────────────────────────────────────────────────── */

describe('Prompt 2C — honest failure states', () => {
  it('PU-24: both loaders fail closed through the canonical state components', () => {
    for (const rel of ['frontend/src/features/company/CompanyIntelligence.tsx',
      'frontend/src/features/research/SectorIntelligence.tsx']) {
      const code = strip(read(rel));
      assert.match(code, /<LoadingState \/>/, `${rel} must use the canonical loading state`);
      assert.match(code, /<ErrorState message=/, `${rel} must use the canonical error state`);
      assert.match(code, /<UnavailableState \/>/, `${rel} must use the canonical unavailable state`);
      assert.match(code, /<DataModeUnavailable data=/, `${rel} must keep the degraded-state guard`);
      assert.match(code, /isDegraded\(/, `${rel} must discriminate a degraded payload before use`);
      assert.match(code, /if \(!company \|\| !evidence \|\| !replay\) return <UnavailableState \/>;/,
        `${rel} must fail closed when any of the three payloads is absent`);
      // The active-flag guard prevents a stale response from writing state after unmount.
      assert.match(code, /let active = true;/, `${rel} must guard against stale state writes`);
    }
  });

  it('PU-25: the canonical state components render their documented testids (fail-closed vocabulary)', () => {
    const cases: Array<[React.FC<any>, Record<string, unknown>, string]> = [
      [LoadingState, {}, 'state-loading'],
      [EmptyState, {}, 'state-empty'],
      [ErrorState, { message: 'boom' }, 'state-error'],
      [UnavailableState, {}, 'state-unavailable'],
      [PermissionDeniedState, {}, 'state-permission-denied'],
    ];
    for (const [C, props, testid] of cases) {
      const html = renderToString(React.createElement(C, props));
      assert.ok(html.includes(`data-testid="${testid}"`), `${testid} must render`);
    }
    // The degraded-state family (UI12/D89) is the guard the surfaces keep for a served
    // degraded payload. It renders its documented keys and invents no investment value.
    const degraded = {
      surface: 'company', dataMode: 'PIT', state: 'PIT_UNAVAILABLE', dataAvailable: false,
      reason: 'no governed vintage for the requested instant',
      dependency: 'R-2 (point-in-time acquisition) is not active',
      provenance: { dataSource: 'transport', freshness: 'UNAVAILABLE', calibratedAt: null, transportSemantics: 'n/a' },
    } as unknown as Parameters<typeof DataModeUnavailable>[0]['data'];
    const html = renderToString(React.createElement(DataModeUnavailable, { data: degraded, title: 'Company Intelligence' }));
    assert.deepStrictEqual(keysOf(html), [
      'data-mode-unavailable', 'data-mode-unavailable-dependency', 'data-mode-unavailable-mode',
      'data-mode-unavailable-semantics', 'state-unavailable',
    ], 'DataModeUnavailable renders its documented family (it composes UnavailableState)');
    assert.ok(html.includes('no governed vintage for the requested instant'), 'the server reason renders verbatim');
  });

  it('PU-26: a sector absent from the decision-matrix universe renders an honest unavailable panel', () => {
    const html = renderToString(React.createElement(MemoryRouter, null,
      React.createElement(SectorIntelligenceView as React.FC<any>, {
        company: computeCertifiedCompany('Banking'), evidence: computeCertifiedEvidence('Banking'),
        replay: computeCertifiedReplay('Banking'),
        sectors: [], sectorsError: null, selectedSector: 'Banking', onSelectSector: () => {},
      })));
    assert.ok(html.includes('data-testid="sector-universe-unavailable"'), 'an absent matrix row must be disclosed');
    assert.ok(html.includes('not present in the governed decision-matrix universe'), 'with an honest reason');
  });

  it('PU-27: a sector-list failure renders the selector error, never an empty selector', () => {
    const html = renderToString(React.createElement(MemoryRouter, null,
      React.createElement(CompanyIntelligenceView as React.FC<any>, {
        company: computeCertifiedCompany('Banking'), evidence: computeCertifiedEvidence('Banking'),
        replay: computeCertifiedReplay('Banking'),
        sectors: null, sectorsError: 'decision-matrix transport returned 503',
        selectedSector: 'Banking', onSelectSector: () => {},
      })));
    assert.ok(html.includes('data-testid="sector-selector-error"'), 'the selector must disclose the failure');
    assert.strictEqual(html.includes('data-testid="sector-select"'), false, 'no selector may render without options');
  });

  it('PU-28: the sector selector is populated ONLY from the governed universe', () => {
    const sectors = computeCertifiedDecisionMatrix().companies;
    const html = renderToString(React.createElement(MemoryRouter, null,
      React.createElement(CompanyIntelligenceView as React.FC<any>, {
        company: computeCertifiedCompany('Banking'), evidence: computeCertifiedEvidence('Banking'),
        replay: computeCertifiedReplay('Banking'), sectors, sectorsError: null,
        selectedSector: 'Banking', onSelectSector: () => {},
      })));
    const options = [...html.matchAll(/<option value="([^"]+)"/g)].map((m) => decodeEntities(m[1]!));
    assert.deepStrictEqual(options, sectors.map((s) => s.sector), 'options must be exactly the governed universe');
  });
});
