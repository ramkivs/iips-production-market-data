/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase-4 Research Surface — UI03 Fundamental Analysis
 * (PATH L — LOCAL VIEW-MODEL / PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 Phase-4 Authority Acts (RAMKI):
 *                   `phase4-research-identity-designation-2026-09-23-001`
 *                   `phase4-research-ui03-presentation-only-2026-09-23-001` (OPTION A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  1. /research presents EXACTLY ONE registered surface: UI03_FUNDAMENTAL_ANALYSIS —
 *     no UI05/UI06/UI12, no UI13 macro, no historical child routes.
 *  2. The surface renders GENUINE governed fundamentals when the mandatory payload is
 *     supplied — every value surfaced verbatim from the UI03 view model.
 *  3. With the payload absent it fails closed to the unavailable state, and supplied
 *     partial data never leaks into the render.
 *  4. The authority act's PROHIBITIONS hold: no synthetic FundamentalsDTO, no fixture
 *     promotion (the UNGOVERNED 'INFY' harness identity never appears), no lineage
 *     generation, no value-invention primitives, no network/auth/api/server.
 *  5. Research is navigable at 'partial' and never silently promoted to 'implemented'.
 *  6. Intelligence, Evidence, Executive and BI-08 are unaffected by this phase.
 *
 * ══ FORENSIC BASIS ════════════════════════════════════════════════════════════════════════
 *  GATE-PHASE-4-RESEARCH-SURFACE-FORENSIC (checkpoint bc6d8ae5cf07a21f7436bac04076a215187473f3)
 *  gap R-1: ZERO governed FundamentalsDTO payloads exist repo-wide, so the MOUNTED route
 *  renders its unavailable state UNCONDITIONALLY (asserted in RSR-23). The payload fixture
 *  below exists ONLY to prove the component's render path is genuine; it is a test-harness
 *  construction using the D05 CANONICAL identity form — NOT product data, never wired to
 *  the route, and explicitly NOT the historical 'INFY' harness form.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ResearchSurface } from '../frontend/src/features/research/ResearchSurface.js';
import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import type { FundamentalsDTO } from '../src/transports/fundamentals_dto.js';
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

/**
 * Test-harness FundamentalsDTO mirroring the certified P12/P13 transport contract, in the
 * D05 CANONICAL identity form. NOT product data; NOT the historical 'INFY' harness form.
 */
function harnessFundamentals(overrides: Partial<FundamentalsDTO> = {}): FundamentalsDTO {
  return {
    companyId: 'EQ_INFY_IN',
    scope: 'CONSOLIDATED',
    fiscalYear: 2026,
    quarter: 'Q1',
    periodType: 'QUARTERLY',
    ratios: {
      companyId: 'EQ_INFY_IN',
      asOf: '2026-09-18T10:00:00.000Z',
      scope: 'CONSOLIDATED',
      peRatio: 24.5,
      pbRatio: 6.2,
      evToEbitda: 16.8,
      roe: 28.5,
      roce: 32.0,
      debtToEquity: 0.05,
      operatingMargin: 24.0,
      netProfitMargin: 19.5,
      splitAdjustedEps: 68.5,
      qualityState: 'GOOD',
      calculationNotes: [],
    },
    ttmStatement: {
      companyId: 'EQ_INFY_IN',
      scope: 'CONSOLIDATED',
      asOf: '2026-09-18T10:00:00.000Z',
      coveredQuarters: ['FY2025-Q2', 'FY2025-Q3', 'FY2025-Q4', 'FY2026-Q1'],
      revenueTTM: 153670,
      ebitdaTTM: 38400,
      ebitTTM: 34500,
      patTTM: 26200,
      operatingCashFlowTTM: 28000,
      freeCashFlowTTM: 24000,
      latestNetWorth: 85000,
      latestTotalDebt: 4200,
      latestTotalAssets: 125000,
      qualityState: 'GOOD',
      isComplete: true,
    },
    balanceSheet: {
      totalEquityShareCapital: 2000,
      reservesAndSurplus: 83000,
      netWorth: 85000,
      totalDebt: 4200,
      nonCurrentLiabilities: 15800,
      currentLiabilities: 20000,
      totalLiabilities: 40000,
      propertyPlantEquipment: 45000,
      intangibleAssets: 10000,
      nonCurrentInvestments: 20000,
      otherNonCurrentAssets: 10000,
      cashAndEquivalents: 15000,
      currentInvestments: 10000,
      inventories: 0,
      tradeReceivables: 10000,
      otherCurrentAssets: 5000,
      totalAssets: 125000,
    },
    quality: 'GOOD',
    provenance: harnessProvenance(),
    ...overrides,
  };
}

const render = (props: Record<string, unknown>): string =>
  renderToString(React.createElement(ResearchSurface, props));

describe('Phase-4 Research surface — genuine view-model binding (UI03)', () => {
  const full = {
    fundamentals: harnessFundamentals(),
    companyName: 'Infosys Limited',
  };
  const html = render(full);

  it('RSR-01: renders the supplied governed D05 identity (never fabricated)', () => {
    assert.ok(html.includes('Infosys Limited'), 'company name must render');
    assert.ok(html.includes('EQ_INFY_IN'), 'canonical D05 companyId must render');
  });

  it('RSR-02: renders the governed ratios verbatim (no client calculation)', () => {
    assert.ok(html.includes('24.5'), 'P/E ratio must surface exactly as supplied');
    assert.ok(html.includes('16.8'), 'EV/EBITDA must surface exactly as supplied');
    assert.ok(html.includes('68.5'), 'split-adjusted EPS must surface exactly as supplied');
  });

  it('RSR-03: renders the TTM statements verbatim from the payload', () => {
    assert.ok(html.includes('153670'), 'TTM revenue must surface exactly as supplied');
    assert.ok(html.includes('38400'), 'TTM EBITDA must surface exactly as supplied');
    assert.ok(html.includes('26200'), 'TTM net income must surface exactly as supplied');
  });

  it('RSR-04: renders the pinned report vintage (PIT discipline)', () => {
    assert.ok(html.includes('research-pinned-vintage'), 'pinned vintage must render');
    assert.ok(html.includes('2026-09-18T10:00:00.000Z'), 'filing date must default to provenance asOf');
    assert.ok(html.includes('2026-03-31'), 'period end must default from the fiscal year');
  });

  it('RSR-05: renders the balance-sheet identity verdict computed by the builder', () => {
    assert.ok(/VALID/.test(html), 'a consistent balance sheet must render VALID');
    const inconsistent = render({
      ...full,
      fundamentals: harnessFundamentals({
        balanceSheet: {
          ...harnessFundamentals().balanceSheet!,
          totalAssets: 125001,
        },
      }),
    });
    assert.ok(
      inconsistent.includes('INVALID'),
      'an inconsistent balance sheet must render INVALID — never silently patched'
    );
  });

  it('RSR-06: renders the lineage digest verbatim from the governed provenance', () => {
    assert.ok(
      html.includes(LINEAGE),
      'the ONLY acceptable lineage digest is the one carried by the supplied provenance'
    );
  });

  it('RSR-07: surfaces the GOOD quality indicator for a GOOD payload', () => {
    assert.ok(html.includes('Good Quality'), 'quality label must come from the view model');
    assert.ok(!html.includes('state-stale'), 'no degraded state may render for GOOD input');
  });

  it('RSR-08: degraded payload quality renders the stale state', () => {
    const degraded = render({
      ...full,
      fundamentals: harnessFundamentals({
        quality: 'STALE',
        provenance: harnessProvenance({ quality: 'STALE' }),
      }),
    });
    assert.ok(degraded.includes('Stale Data'), 'degraded quality label must render');
    assert.ok(degraded.includes('state-stale'), 'degraded payload must render the stale state');
  });

  it('RSR-09: renders the AD-17 replay constraint verbatim when present', () => {
    const replay = render({
      ...full,
      fundamentals: harnessFundamentals({
        provenance: harnessProvenance({
          replayConstraintApplied: true,
          replayConstraintText: 'AD17_CONSTRAINT: replay-bounded evaluation',
        }),
      }),
    });
    assert.ok(replay.includes('AD17_CONSTRAINT'), 'AD-17 text must render verbatim');
    assert.ok(replay.includes('freshness-replay'), 'replay freshness badge must render');
  });

  it('RSR-10: explicit PIT vintage parameters are forwarded to the builder', () => {
    const pinned = render({
      ...full,
      filingDate: '2026-07-15T00:00:00.000Z',
      periodEndDate: '2026-06-30',
      restatementIndex: 2,
    });
    assert.ok(pinned.includes('2026-07-15T00:00:00.000Z'), 'explicit filing date must override');
    assert.ok(pinned.includes('2026-06-30'), 'explicit period end must override');
    assert.ok(pinned.includes('restatement index 2'), 'explicit restatement index must render');
  });
});

describe('Phase-4 Research surface — fail-closed honesty (mandatory-input contract)', () => {
  const empty = render({});

  it('RSR-11: no payload renders an explicit unavailable state, not fabricated data', () => {
    assert.ok(empty.includes('state-unavailable'), 'must render the unavailable state');
    assert.ok(
      empty.includes('No governed fundamentals payload loaded'),
      'must state that no governed payload is loaded'
    );
    assert.ok(
      !empty.includes('data-testid="metric-card"'),
      'the empty state must render NO metric cards'
    );
    assert.ok(!empty.includes('data-table'), 'the empty state must render NO data tables');
  });

  it('RSR-12: invents no company identity when none is supplied', () => {
    assert.ok(!empty.includes('EQ_INFY_IN'), 'no companyId may be fabricated');
    assert.ok(!empty.includes('Infosys'), 'no company name may be fabricated');
  });

  it('RSR-13: emits no lineage digest and no ratios in the empty state', () => {
    assert.ok(!/[0-9a-f]{64}/.test(empty), 'no SHA-256-shaped value may appear');
    assert.ok(!empty.includes('24.5'), 'no ratio value may appear');
    assert.ok(!empty.includes('Good Quality'), 'the empty state must not claim GOOD quality');
  });

  it('RSR-14: fails closed on every partial combination — no partial-render path exists', () => {
    // The UI03 contract makes the FundamentalsDTO (with its ExecutiveProvenance) and the
    // display identity BOTH mandatory. Every partial combination must fail closed.
    const fundamentals = harnessFundamentals();
    const cases: Array<[string, Record<string, unknown>]> = [
      ['fundamentals without companyName', { fundamentals }],
      ['companyName without fundamentals', { companyName: 'Infosys Limited' }],
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

  it('RSR-15: supplied partial data never leaks into the fail-closed render', () => {
    // The strongest form of the honesty contract: a caller-supplied fundamentals payload
    // must not appear at all when the display identity is absent.
    const partial = render({ fundamentals: harnessFundamentals() });
    assert.ok(partial.includes('state-unavailable'), 'must fail closed');
    assert.ok(!partial.includes('24.5'), 'supplied ratios must NOT render from partial input');
    assert.ok(!partial.includes('153670'), 'supplied statements must NOT render from partial input');
    assert.ok(!partial.includes(LINEAGE), 'no lineage may render from partial input');
    assert.ok(!partial.includes('EQ_INFY_IN'), 'no identity may render from partial input');
  });

  it('RSR-16: the historical INFY harness identity never renders on this surface', () => {
    // The ungoverned 'INFY' fixture form must not be promoted: the surface renders only
    // the canonical D05 form carried by the supplied payload — as a full identity value,
    // never as a bare standalone symbol.
    assert.ok(!empty.includes('>INFY<'), 'no INFY identity may be fabricated');
    const populated = render({ fundamentals: harnessFundamentals(), companyName: 'Infosys Limited' });
    assert.ok(populated.includes('EQ_INFY_IN'), 'canonical identity must render');
    assert.ok(!/>INFY</.test(populated), 'no bare INFY identity form may render');
  });
});

describe('Phase-4 Research surface — authority-act prohibitions (source scan)', () => {
  const surfacePath = resolve(process.cwd(), 'frontend/src/features/research/ResearchSurface.tsx');
  const source = readFileSync(surfacePath, 'utf8');
  // Strip comments: the governing header names excluded technologies deliberately.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('RSR-17: the surface source is readable (anti-silent-skip guard)', () => {
    assert.ok(existsSync(surfacePath), `surface source must exist at ${surfacePath}`);
    assert.ok(code.length > 500, 'surface source must be non-trivial');
  });

  it('RSR-18: NEVER generates a lineage digest (computeLineageHash unreachable)', () => {
    for (const forbidden of ['computeLineageHash', 'computeSha256', 'createHash']) {
      assert.ok(!code.includes(forbidden), `Research surface must not call ${forbidden}`);
    }
  });

  it('RSR-19: hard-codes no SHA-256-shaped literal and no value-invention primitive', () => {
    assert.ok(!/[0-9a-f]{64}/.test(code), 'no digest literal may be embedded in the surface');
    for (const forbidden of ['Math.random', 'Date.now', 'new Date']) {
      assert.ok(!code.includes(forbidden), `no value may be invented via ${forbidden}`);
    }
  });

  it('RSR-20: performs no network access', () => {
    for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('RSR-21: imports no API transport or authentication module', () => {
    for (const forbidden of ['authFetch', 'oidcClient', 'AuthProvider', 'keycloak', 'useAuth']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('RSR-22: references no /api/* endpoint and no server module', () => {
    assert.ok(!code.includes('/api/'), 'no /api/* call site permitted');
    assert.ok(!code.includes('frontend/server'), 'no server dependency permitted');
  });

  it('RSR-23: binds ONLY to the local offline UI03 view-model', () => {
    assert.ok(
      code.includes('ui03_fundamental_analysis'),
      'surface must bind to the local UI03 view-model builder'
    );
    // Identity designation: exactly one surface, no adjacent builders.
    for (const notBound of ['ui05_sector_scoring_radar', 'ui06_multifactor_screener', 'ui12_estimates_distribution', 'ui13_macro_vintage_tracker']) {
      assert.ok(!code.includes(notBound), `the designation forbids binding ${notBound} to /research`);
    }
  });
});

describe('Phase-4 Research surface — shell integration', () => {
  const routed = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [ROUTES.research] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );

  it('RSR-24: /research renders the real UI03 surface, not a placeholder', () => {
    assert.ok(routed.includes('research-heading'), 'Research surface must render');
    assert.ok(
      routed.includes('UI03_FUNDAMENTAL_ANALYSIS'),
      'the surface must disclose its designated surface identity'
    );
    assert.ok(
      !routed.includes('This surface is declared in the governed navigation model'),
      '/research must no longer render the FeaturePlaceholder'
    );
  });

  it('RSR-25: the MOUNTED route renders its governed unavailable state UNCONDITIONALLY', () => {
    // Gap R-1: zero governed FundamentalsDTO payloads exist offline, and the UI03 builder
    // has no partial-render path. The mounted route must therefore render the unavailable
    // state — this is the honest outcome, asserted.
    assert.ok(routed.includes('state-unavailable'), 'unavailable state must render on the route');
    assert.ok(
      !routed.includes('data-testid="metric-card"'),
      'the mounted route must render NO fabricated metrics'
    );
  });

  it('RSR-26: the route renders inside the shell with chrome intact', () => {
    assert.ok(routed.includes('app-shell'), 'shell must wrap the surface');
    assert.ok(routed.includes('Live Providers: 0 (INACTIVE)'), 'fail-closed disclosure persists');
  });

  it('RSR-27: Research is navigable (not a future dead entry)', () => {
    assert.ok(routed.includes('href="/research"'), 'Research must be a navigable link');
    assert.ok(
      !routed.includes('nav-future-Research'),
      'Research must no longer render as a non-navigable future marker'
    );
    assert.ok(
      routed.includes('nav-status-Research'),
      'Research must carry its honest Partial status badge'
    );
  });

  it('RSR-28: navigation status is partial — honest, not overstated', () => {
    const item = NAV.find((n) => n.label === 'Research');
    assert.strictEqual(item?.status, 'partial', "Research must be declared 'partial'");
  });

  it('RSR-29: Intelligence, Evidence and Executive are unmodified by this phase', () => {
    for (const label of ['Intelligence', 'Evidence', 'Executive']) {
      assert.strictEqual(
        NAV.find((n) => n.label === label)?.status,
        'partial',
        `${label} must remain partial`
      );
    }
    for (const [path, heading] of [
      [ROUTES.intelligence, 'intelligence-heading'],
      [ROUTES.evidence, 'evidence-heading'],
      [ROUTES.executive, 'executive-heading'],
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

  it('RSR-30: BI-08 portfolio route is unaffected by this phase', () => {
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
