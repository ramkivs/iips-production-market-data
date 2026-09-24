/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase-3 Executive Surface (PATH L — LOCAL VIEW-MODEL / PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 Phase-3 Authority Act: `phase3-executive-presentation-only-2026-09-22-001`
 *                 (OPTION A, selected by RAMKI)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  1. The surface renders GENUINE governed payloads when ALL THREE mandatory inputs are
 *     supplied — every value surfaced verbatim from the UI02 view model.
 *  2. With any input absent it fails closed to the unavailable state — there is NO
 *     partial-render path, and supplied partial data must never leak into the render.
 *  3. The authority act's PROHIBITIONS hold: no synthetic MarketDataDTO / EngineScoreOutput /
 *     IntelligenceDTO, no fabricated recommendation/grade/score, no lineage generation,
 *     no value-invention primitives (Math.random / Date.now).
 *  4. The Path-L boundary holds: no fetch/authFetch/OIDC/Keycloak//api//server.
 *  5. Executive is navigable at 'partial' and is never silently promoted to 'implemented'.
 *  6. Evidence, Intelligence and BI-08 are unaffected by this phase.
 *
 * ══ FORENSIC BASIS ════════════════════════════════════════════════════════════════════════
 *  GATE-PHASE-3-EXECUTIVE-PAYLOAD-FORENSIC (checkpoint 5ef8960fa4d38746b7191061810040a57bf83c71)
 *  = CLASSIFICATION B — FAIL CLOSED: all three mandatory payload domains are unavailable as
 *  governed offline product data. The MOUNTED route therefore renders its unavailable state
 *  UNCONDITIONALLY (asserted in EXE-24). The payload fixtures below exist ONLY to prove the
 *  component's render path is genuine; they are test-harness constructions, not product data,
 *  and they are never wired to the route by this phase.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ExecutiveSurface } from '../frontend/src/features/executive/ExecutiveSurface.js';
import { ExecutiveDashboard } from '../frontend/src/features/executive/ExecutiveDashboard.js';
import type { ExecutiveDashboardProps } from '../frontend/src/features/executive/ExecutiveDashboard.js';
import type { ExecutiveData } from '../frontend/src/api/executive.js';
import { computeCertifiedExecutive } from '../src/transports/executive_transport.js';
import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import type { MarketDataDTO } from '../src/transports/market_data_dto.js';
import type { IntelligenceDTO } from '../src/transports/intelligence_dto.js';
import type { EngineScoreOutput } from '../src/engine_adapters/types.js';
import type { ExecutiveProvenance } from '../src/transports/types.js';

const LINEAGE = 'fc1c5e8b886c3711e00928df4a7c2d577cc8a44d0da4aa148decacdd12e328fb';

/**
 * Test-harness provenance mirroring the certified ExecutiveProvenance contract.
 * NOT product data — never wired to the mounted route by this phase.
 */
function harnessProvenance(overrides: Partial<ExecutiveProvenance> = {}): ExecutiveProvenance {
  return {
    sourceClassification: 'CERTIFIED_ENGINE',
    asOf: '2026-09-18T10:00:00.000Z',
    evaluatedAt: '2026-09-18T10:00:01.000Z',
    dataVersion: 'v1.0.0',
    lineageDigest: LINEAGE,
    quality: 'GOOD',
    replayConstraintApplied: false,
    ...overrides,
  };
}

/** Test-harness MarketDataDTO mirroring the certified P12 transport contract. */
function harnessMarketData(overrides: Partial<MarketDataDTO> = {}): MarketDataDTO {
  return {
    companyId: 'EQ_INFY_IN',
    symbol: 'INFY',
    exchange: 'NSE',
    ltp: 1500,
    open: 1480,
    high: 1510,
    low: 1475,
    previousClose: 1470,
    change: 30,
    pctChange: 2.04,
    volume: 500000,
    mode: 'SNAPSHOT',
    quality: 'GOOD',
    provenance: harnessProvenance(),
    ...overrides,
  };
}

/** Test-harness EngineScoreOutput mirroring the certified engine-adapter contract. */
function harnessEngineScore(overrides: Partial<EngineScoreOutput> = {}): EngineScoreOutput {
  return {
    companyId: 'EQ_INFY_IN',
    engineId: 'SECTOR_IT',
    rawScore: 88,
    normalizedScore: 88,
    grade: 'A',
    qualityState: 'GOOD',
    factorBreakdown: { valuation: 85, quality: 90, profitability: 92, technical: 82 },
    provenance: {
      sourceClassification: 'REAL',
      vendorTier: 'TIER_1_EXCHANGE',
      asOf: '2026-09-18T10:00:00.000Z',
      receivedAt: '2026-09-18T10:00:00.000Z',
      evaluatedAt: '2026-09-18T10:00:00.000Z',
      dataVersion: 'v1.0.0-score',
      lineageHash: 'harness-hash-01',
      qualityState: 'GOOD',
    },
    versionVector: {
      schemaVersion: 'v1.0.0',
      engineVersion: 'v1.0.0',
      securityMasterVersion: 'v1.0.0',
      dataVersionVector: {},
    },
    executionId: 'harness-exec-01',
    evaluatedAt: '2026-09-18T10:00:00.000Z',
    isFallbackApplied: false,
    fallbackFields: [],
    ...overrides,
  };
}

/** Test-harness IntelligenceDTO mirroring the certified intelligence transport contract. */
function harnessIntelligence(overrides: Partial<IntelligenceDTO> = {}): IntelligenceDTO {
  return {
    companyId: 'EQ_INFY_IN',
    news: {
      newsItems: [],
      totalAvailable: 5,
      filteredCount: 5,
      dominantSentiment: 'BULLISH',
      averageSentimentScore: 0.65,
      qualityState: 'GOOD',
    },
    quality: 'GOOD',
    provenance: harnessProvenance(),
    ...overrides,
  };
}

const render = (props: Record<string, unknown>): string =>
  renderToString(React.createElement(ExecutiveSurface, props));

describe('Phase-3 Executive surface — genuine view-model binding (all three payloads)', () => {
  const full = {
    marketData: harnessMarketData(),
    engineScore: harnessEngineScore(),
    intelligence: harnessIntelligence(),
    companyName: 'Infosys Limited',
  };
  const html = render(full);

  it('EXE-01: renders the supplied governed D05 identity (never fabricated)', () => {
    assert.ok(html.includes('Infosys Limited'), 'company name must render');
    assert.ok(html.includes('EQ_INFY_IN'), 'canonical D05 companyId must render');
  });

  it('EXE-02: renders the governed quote verbatim from the market-data payload', () => {
    assert.ok(html.includes('1500'), 'last price must surface exactly as supplied');
    assert.ok(html.includes('2.04'), 'pct change must surface exactly as supplied');
    assert.ok(html.includes('INR'), 'currency must come from the view model');
  });

  it('EXE-03: renders the composite score and grade verbatim from the engine payload', () => {
    assert.ok(html.includes('88'), 'normalized score must surface exactly as supplied');
    assert.ok(
      /data-testid="executive-grade"[^>]*>A</.test(html),
      'grade must surface exactly as supplied, never computed or defaulted'
    );
  });

  it('EXE-04: renders the factor breakdown from the engine payload', () => {
    assert.ok(html.includes('valuation'), 'factor rows must render');
    assert.ok(html.includes('data-table'), 'factor table must render');
  });

  it('EXE-05: renders the intelligence summary verbatim', () => {
    assert.ok(html.includes('0.65'), 'news sentiment must surface exactly as supplied');
  });

  it('EXE-06: renders the lineage digest verbatim from the governed provenance', () => {
    assert.ok(
      html.includes(LINEAGE),
      'the ONLY acceptable lineage digest is the one carried by the supplied provenance'
    );
  });

  it('EXE-07: surfaces the GOOD quality indicator when all three inputs are GOOD', () => {
    assert.ok(html.includes('Good Quality'), 'quality label must come from the rollup');
    assert.ok(!html.includes('state-stale'), 'no degraded state may render for GOOD inputs');
  });

  it('EXE-08: worst-case quality rollup — one STALE input degrades the whole surface', () => {
    // The builder rolls up UNAVAILABLE > PARTIAL > STALE > GOOD across all three inputs.
    // This is the control that would label fabricated GOOD-looking inputs as degraded.
    const degraded = render({
      ...full,
      marketData: harnessMarketData({ quality: 'STALE', provenance: harnessProvenance({ quality: 'STALE' }) }),
    });
    assert.ok(degraded.includes('Stale Data'), 'rolled-up quality label must render');
    assert.ok(degraded.includes('state-stale'), 'degraded input must render the stale state');
  });

  it('EXE-09: renders the AD-17 replay constraint verbatim when present', () => {
    const replay = render({
      ...full,
      marketData: harnessMarketData({
        provenance: harnessProvenance({
          replayConstraintApplied: true,
          replayConstraintText: 'AD17_CONSTRAINT: replay-bounded evaluation',
        }),
      }),
    });
    assert.ok(replay.includes('AD17_CONSTRAINT'), 'AD-17 text must render verbatim');
    assert.ok(replay.includes('freshness-replay'), 'replay freshness badge must render');
  });

  it('EXE-10: rank renders only when supplied — never invented when absent', () => {
    assert.ok(!html.includes('Rank'), 'no rank may render when none is supplied');
    const ranked = render({ ...full, rank: 3 });
    assert.ok(ranked.includes('Rank'), 'supplied rank must render');
  });
});

describe('Phase-3 Executive surface — fail-closed honesty (mandatory-input contract)', () => {
  const empty = render({});

  it('EXE-11: no payloads renders an explicit unavailable state, not fabricated data', () => {
    assert.ok(empty.includes('state-unavailable'), 'must render the unavailable state');
    assert.ok(
      empty.includes('No governed executive payload loaded'),
      'must state that no governed payload is loaded'
    );
    assert.ok(
      !empty.includes('data-testid="metric-card"'),
      'the empty state must render NO metric cards'
    );
    assert.ok(!empty.includes('data-table'), 'the empty state must render NO data tables');
  });

  it('EXE-12: invents no company identity when none is supplied', () => {
    assert.ok(!empty.includes('EQ_INFY_IN'), 'no companyId may be fabricated');
    assert.ok(!empty.includes('Infosys'), 'no company name may be fabricated');
  });

  it('EXE-13: emits no lineage digest and no score/grade values in the empty state', () => {
    assert.ok(!/[0-9a-f]{64}/.test(empty), 'no SHA-256-shaped value may appear');
    assert.ok(!empty.includes('data-testid="executive-grade"'), 'no grade may be fabricated');
    assert.ok(!empty.includes('Good Quality'), 'the empty state must not claim GOOD quality');
  });

  it('EXE-14: fails closed on EVERY partial combination — no partial-render path exists', () => {
    // The UI02 contract makes all three payloads MANDATORY. Every partial combination
    // (and a full set without a company name) must render the unavailable state.
    const marketData = harnessMarketData();
    const engineScore = harnessEngineScore();
    const intelligence = harnessIntelligence();
    const cases: Array<[string, Record<string, unknown>]> = [
      ['marketData only', { marketData }],
      ['engineScore only', { engineScore }],
      ['intelligence only', { intelligence }],
      ['marketData + engineScore', { marketData, engineScore }],
      ['marketData + intelligence', { marketData, intelligence }],
      ['engineScore + intelligence', { engineScore, intelligence }],
      ['all three, no companyName', { marketData, engineScore, intelligence }],
    ];
    for (const [name, props] of cases) {
      const out = render(props);
      assert.ok(out.includes('state-unavailable'), `${name}: must fail closed`);
      assert.ok(
        !out.includes('data-testid="metric-card"'),
        `${name}: must not render any metrics from partial input`
      );
    }
  });

  it('EXE-15: supplied partial data never leaks into the fail-closed render', () => {
    // The strongest form of the honesty contract: a caller-supplied market quote must not
    // appear at all when the other mandatory payloads are absent.
    const partial = render({ marketData: harnessMarketData(), companyName: 'Infosys Limited' });
    assert.ok(partial.includes('state-unavailable'), 'must fail closed');
    assert.ok(!partial.includes('1500'), 'supplied price must NOT render from partial input');
    assert.ok(!partial.includes('Infosys Limited'), 'identity must not render from partial input');
    assert.ok(!partial.includes(LINEAGE), 'no lineage may render from partial input');
  });
});

describe('Phase-3 Executive surface — authority-act prohibitions (source scan)', () => {
  const surfacePath = resolve(process.cwd(), 'frontend/src/features/executive/ExecutiveSurface.tsx');
  const source = readFileSync(surfacePath, 'utf8');
  // Strip comments: the governing header names excluded technologies deliberately.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('EXE-16: the surface source is readable (anti-silent-skip guard)', () => {
    assert.ok(existsSync(surfacePath), `surface source must exist at ${surfacePath}`);
    assert.ok(code.length > 500, 'surface source must be non-trivial');
  });

  it('EXE-17: NEVER generates a lineage digest (computeLineageHash unreachable)', () => {
    for (const forbidden of ['computeLineageHash', 'computeSha256', 'createHash']) {
      assert.ok(!code.includes(forbidden), `Executive surface must not call ${forbidden}`);
    }
  });

  it('EXE-18: hard-codes no SHA-256-shaped literal and no value-invention primitive', () => {
    assert.ok(!/[0-9a-f]{64}/.test(code), 'no digest literal may be embedded in the surface');
    for (const forbidden of ['Math.random', 'Date.now', 'new Date']) {
      assert.ok(!code.includes(forbidden), `no value may be invented via ${forbidden}`);
    }
  });

  it('EXE-19: performs no network access', () => {
    for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('EXE-20: imports no API transport or authentication module', () => {
    for (const forbidden of ['authFetch', 'oidcClient', 'AuthProvider', 'keycloak', 'useAuth']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('EXE-21: references no /api/* endpoint and no server module', () => {
    assert.ok(!code.includes('/api/'), 'no /api/* call site permitted');
    assert.ok(!code.includes('frontend/server'), 'no server dependency permitted');
  });

  it('EXE-22: binds only to the local offline view-model', () => {
    assert.ok(
      code.includes('ui02_executive_summary'),
      'surface must bind to the local UI02 view-model builder'
    );
  });
});

describe('Phase-3 Executive surface — shell integration', () => {
  const routed = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [ROUTES.executive] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );

  it('EXE-23: /executive renders the real surface, not a placeholder', () => {
    // WUI-RS-03C: without server provision, static SSR renders the dashboard's honest loading
    // state (certified data arrives over HTTP / via SSR provision — never in-browser compute).
    assert.ok(routed.includes('data-testid="state-loading"'), 'Executive surface (loading state) must render');
    assert.ok(
      !routed.includes('This surface is declared in the governed navigation model'),
      '/executive must no longer render the FeaturePlaceholder'
    );
  });

  it('EXE-24: the MOUNTED route renders the genuine certified Executive Dashboard', () => {
    // WUI-RS-03C: certified observables are asserted against the dashboard provisioned through
    // its designed `initialData` prop (node-side test context, same certified transport) — the
    // identical certified payload the server contract delivers.
    const initialData = computeCertifiedExecutive() as unknown as ExecutiveData;
    const Dashboard: React.FC<ExecutiveDashboardProps> = ExecutiveDashboard;
    const certified = renderToString(React.createElement(Dashboard, { initialData }));
    assert.ok(certified.includes('Portfolio Health'), 'Portfolio Health must render on the route');
    assert.ok(certified.includes('data-testid="metric-card"'), 'the mounted route renders certified metric cards');
    assert.ok(certified.includes('Recent Decisions'), 'recent decisions must render');
    assert.ok(certified.includes('data-testid="recent-decision"'), 'decision cards must render');
  });

  it('EXE-25: the route renders inside the shell with chrome intact', () => {
    assert.ok(routed.includes('app-shell'), 'shell must wrap the surface');
    assert.ok(routed.includes('Live Providers: 0 (INACTIVE)'), 'fail-closed disclosure persists');
  });

  it('EXE-26: Executive is navigable (not a future dead entry)', () => {
    assert.ok(routed.includes('href="/executive"'), 'Executive must be a navigable link');
    assert.ok(
      !routed.includes('nav-future-Executive'),
      'Executive must no longer render as a non-navigable future marker'
    );
  });

  it('EXE-27: navigation status is partial — honest, not overstated', () => {
    const item = NAV.find((n) => n.label === 'Executive');
    assert.strictEqual(item?.status, 'partial', "Executive must be declared 'partial'");
  });

  it('EXE-28: Evidence and Intelligence are unmodified by this phase', () => {
    assert.strictEqual(
      NAV.find((n) => n.label === 'Evidence')?.status,
      'partial',
      'Evidence must remain partial'
    );
    assert.strictEqual(
      NAV.find((n) => n.label === 'Intelligence')?.status,
      'partial',
      'Intelligence must remain partial'
    );
    for (const [path, heading] of [
      [ROUTES.evidence, 'evidence-heading'],
      [ROUTES.intelligence, 'intelligence-heading'],
    ] as const) {
      const out = renderToString(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(SessionProvider, {
            session: ANONYMOUS_SESSION,
            children: React.createElement(App, {}),
          })
        )
      );
      assert.ok(out.includes(heading), `${path} surface must still render`);
    }
  });

  it('EXE-29: BI-08 portfolio route is unaffected by this phase', () => {
    const portfolio = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.portfolio] },
        React.createElement(SessionProvider, {
          session: ANONYMOUS_SESSION,
          children: React.createElement(App, {}),
        })
      )
    );
    assert.ok(
      portfolio.includes('min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6'),
      'BI-08 PortfolioWorkspace must still render at /portfolio'
    );
  });
});
