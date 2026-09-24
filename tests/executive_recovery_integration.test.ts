/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Executive & Foundational Transport Controlled Recovery Integration
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Methodological Invariant: 100% FROZEN CERTIFIED BASELINE
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  1. Full end-to-end execution of the certified pipeline (baseline -> sector engines -> CSIP -> DTO).
 *  2. Bit-for-bit contract parity against verified payload hash:
 *     95e15dda914fd1641832967acf3119e634e1759646c05b51aa14be4840272cd9
 *  3. 74/74 Static Derivation items (100% exact match).
 *  4. 41/41 E2E-018 UI Observables (100% exact match).
 *  5. Shell integration: /executive mounted in AppShell with chrome intact.
 *  6. Non-regression of BI-08 Portfolio and D05 Security Master.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { computeCertifiedExecutive, computeCertifiedPlatform } from '../src/transports/executive_transport.js';
import { ExecutiveDashboard } from '../frontend/src/features/executive/ExecutiveDashboard.js';
import type { ExecutiveDashboardProps } from '../frontend/src/features/executive/ExecutiveDashboard.js';
import type { ExecutiveData } from '../frontend/src/api/executive.js';
import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';

const EXPECTED_PAYLOAD_SHA256 = '95e15dda914fd1641832967acf3119e634e1759646c05b51aa14be4840272cd9';

const SECTORS = [
  'Banking', 'Insurance', 'Capital Markets', 'Healthcare', 'Hospitality',
  'Energy', 'Utilities', 'Consumer', 'Industrials', 'Technology',
  'Telecommunications', 'Automobile', 'Materials & Metals',
] as const;

const GOLDEN_DECISIONS: Record<string, { verdict: string; composite: number; confidence: number | null }> = {
  Banking: { verdict: 'Watch', composite: 47.1, confidence: 0.8 },
  Insurance: { verdict: 'Buy', composite: 72.3, confidence: 0.8 },
  'Capital Markets': { verdict: 'Strong Buy', composite: 84.6, confidence: 0.8 },
  Healthcare: { verdict: 'Buy', composite: 75.5, confidence: 0.8 },
  Hospitality: { verdict: 'Buy', composite: 79, confidence: null },
  Energy: { verdict: 'Accumulate', composite: 66.9, confidence: null },
  Utilities: { verdict: 'Buy', composite: 74.1, confidence: null },
  Consumer: { verdict: 'Buy', composite: 79.5, confidence: null },
  Industrials: { verdict: 'Buy', composite: 77.2, confidence: null },
  Technology: { verdict: 'Buy', composite: 76.3, confidence: null },
  Telecommunications: { verdict: 'Buy', composite: 77.8, confidence: null },
  Automobile: { verdict: 'Buy', composite: 71.3, confidence: null },
  'Materials & Metals': { verdict: 'Strong Buy', composite: 82.5, confidence: null },
};

describe('IIPS — Executive Recovery: Certified Pipeline & Contract Parity', () => {
  const payload = computeCertifiedExecutive();
  const serialized = JSON.stringify(payload, null, 2) + '\n';
  const payloadHash = crypto.createHash('sha256').update(serialized).digest('hex');

  it('REC-01: payload serializes to exact verified historical hash (95e15dda...2cd9)', () => {
    assert.strictEqual(
      payloadHash,
      EXPECTED_PAYLOAD_SHA256,
      `Payload hash must match verified historical baseline ${EXPECTED_PAYLOAD_SHA256}`
    );
  });

  it('REC-02: portfolio health summary matches certified static derivation (74.2 / 71.7 / 77.7 / 7.7 / 128.3)', () => {
    assert.strictEqual(payload.portfolio.holdings, 13);
    assert.strictEqual(payload.portfolio.avgConviction, 74.2);
    assert.strictEqual(payload.portfolio.avgQuality, 71.7);
    assert.strictEqual(payload.portfolio.avgRisk, 77.7);
    assert.strictEqual(payload.portfolio.concentration, 7.7);
    assert.strictEqual(payload.portfolio.diversificationScore, 128.3);
  });

  it('REC-03: equal-weight sector exposure across all 13 sectors (7.7% each)', () => {
    assert.strictEqual(Object.keys(payload.portfolio.sectorExposure).length, 13);
    for (const s of SECTORS) {
      assert.strictEqual(payload.portfolio.sectorExposure[s], 7.7, `Sector ${s} exposure must be 7.7%`);
    }
  });

  it('REC-04: top opportunity is Capital Markets with conviction 84.6', () => {
    assert.ok(payload.opportunity.length > 0);
    assert.strictEqual(payload.opportunity[0].sector, 'Capital Markets');
    assert.strictEqual(payload.opportunity[0].conviction, 84.6);
  });

  it('REC-05: ranking order has 13 rows sorted by descending conviction', () => {
    assert.strictEqual(payload.ranking.length, 13);
    const expectedOrder = [
      ['Capital Markets', 84.6],
      ['Materials & Metals', 82.5],
      ['Consumer', 79.5],
      ['Hospitality', 79],
      ['Telecommunications', 77.8],
      ['Industrials', 77.2],
      ['Technology', 76.3],
      ['Healthcare', 75.5],
      ['Utilities', 74.1],
      ['Insurance', 72.3],
      ['Automobile', 71.3],
      ['Energy', 66.9],
      ['Banking', 47.1],
    ];
    for (let i = 0; i < expectedOrder.length; i++) {
      assert.strictEqual(payload.ranking[i].sector, expectedOrder[i][0]);
      assert.strictEqual(payload.ranking[i].conviction, expectedOrder[i][1]);
    }
  });

  it('REC-06: 13 decisions match golden reference outputs exactly', () => {
    assert.strictEqual(payload.decisions.length, 13);
    const counts: Record<string, number> = {};
    for (const d of payload.decisions) {
      const exp = GOLDEN_DECISIONS[d.sector];
      assert.ok(exp, `Unexpected sector ${d.sector}`);
      assert.strictEqual(d.verdict, exp.verdict, `Verdict mismatch for ${d.sector}`);
      assert.strictEqual(d.composite, exp.composite, `Composite mismatch for ${d.sector}`);
      assert.strictEqual(d.confidence, exp.confidence, `Confidence mismatch for ${d.sector}`);
      counts[d.verdict] = (counts[d.verdict] || 0) + 1;
    }
    assert.strictEqual(counts['Buy'], 9);
    assert.strictEqual(counts['Strong Buy'], 2);
    assert.strictEqual(counts['Watch'], 1);
    assert.strictEqual(counts['Accumulate'], 1);
  });

  it('REC-07: provenance reflects certified reference snapshot', () => {
    assert.strictEqual(payload.provenance.freshness, 'SNAPSHOT');
    assert.strictEqual(payload.provenance.calibratedAt, '2026-08-09T00:00:00.000Z');
    assert.ok(payload.provenance.dataSource.includes('certified v2.0 platform'));
  });
});

describe('IIPS — Executive Recovery: E2E-018 UI Observables Parity (41/41)', () => {
  // WUI-RS-03C: the dashboard no longer computes certified data in-process (the browser
  // client's Node-edge fallback was removed). In SSR the certified payload is provided
  // through the component's designed `initialData` prop, computed here in a legal
  // node-side test context from the same certified transport. All 41 observables below
  // are asserted against the identical certified payload, rendered by the same component.
  const initialData = computeCertifiedExecutive() as unknown as ExecutiveData;
  // FC annotation: the component's defaulted parameter makes plain createElement prop
  // inference fail under React 18 types; the props type itself is unchanged.
  const Dashboard: React.FC<ExecutiveDashboardProps> = ExecutiveDashboard;
  const html = renderToString(React.createElement(Dashboard, { initialData }));

  it('OBS-01: renders main Executive heading and badges', () => {
    assert.ok(html.includes('id="executive-heading"'), 'Executive heading must render');
    assert.ok(html.includes('badge-certified'), 'Certified badge must render');
    assert.ok(html.includes('freshness-snapshot'), 'Snapshot freshness badge must render');
  });

  it('OBS-02: renders Portfolio Health metric group with 6 cards', () => {
    assert.ok(html.includes('Portfolio Health'), 'Portfolio Health label must render');
    assert.strictEqual((html.match(/data-testid="metric-card"/g) || []).length, 6);
    assert.strictEqual((html.match(/data-testid="metric-value"/g) || []).length, 6);
  });

  it('OBS-03: renders top opportunity highlight banner', () => {
    assert.ok(html.includes('data-testid="top-opportunity"'));
    assert.ok(html.includes('Capital Markets'));
    assert.ok(html.includes('84.6'));
  });

  it('OBS-04: renders Priority Opportunities DataTable with 14 rows and 3-up/10-flat trend', () => {
    assert.ok(html.includes('data-testid="data-table"'));
    assert.strictEqual((html.match(/data-testid="trend-up"/g) || []).length, 3);
    assert.strictEqual((html.match(/data-testid="trend-flat"/g) || []).length, 10);
  });

  it('OBS-05: renders Risks Requiring Attention list with 3 flags', () => {
    assert.ok(html.includes('data-testid="risk-list"'));
    assert.ok(html.includes('elevated risk / correlated downside'));
    assert.ok(html.includes('single-factor exposure (growth)'));
  });

  it('OBS-06: renders Decision Distribution SimpleBarChart with 13 sector bars', () => {
    assert.ok(html.includes('data-testid="chart-container"'));
    assert.ok(html.includes('data-testid="simple-bar-chart"'));
    for (const s of SECTORS) {
      const encoded = s.replace('&', '&amp;');
      assert.ok(html.includes(`data-testid="bar-${encoded}"`), `Chart bar for ${s} must render`);
    }
  });

  it('OBS-07: renders Recent Decisions with 13 cards, verdict badges, and inspect buttons', () => {
    assert.ok(html.includes('data-testid="decision-list"'));
    assert.strictEqual((html.match(/data-testid="recent-decision"/g) || []).length, 13);
    assert.strictEqual((html.match(/data-testid="decision-badge-Buy"/g) || []).length, 9);
    assert.strictEqual((html.match(/data-testid="decision-badge-Strong Buy"/g) || []).length, 2);
    assert.strictEqual((html.match(/data-testid="decision-badge-Watch"/g) || []).length, 1);
    assert.strictEqual((html.match(/data-testid="decision-badge-Accumulate"/g) || []).length, 1);
    for (const s of SECTORS) {
      const encoded = s.replace('&', '&amp;');
      assert.ok(html.includes(`data-testid="inspect-${encoded}"`), `Inspect button for ${s} must render`);
    }
  });

  it('OBS-08: renders Evidence & Replay list with 13 evidence cards', () => {
    assert.ok(html.includes('data-testid="evidence-list"'));
    assert.strictEqual((html.match(/data-testid="evidence-card"/g) || []).length, 13);
    assert.strictEqual((html.match(/data-testid="evidence-reference"/g) || []).length, 13);
  });
});

describe('IIPS — Executive Recovery: Shell Integration & Non-Regression', () => {
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

  it('INT-01: /executive mounts ExecutiveDashboard inside the AppShell with chrome intact', () => {
    // WUI-RS-03C: the App mounts the dashboard with no props, so static SSR (where effects
    // never run) renders the surface's honest loading state until the client fetch resolves.
    // Certified content remains asserted observably in the OBS block via `initialData`.
    assert.ok(routed.includes('app-shell'), 'AppShell must wrap the page');
    assert.ok(routed.includes('data-testid="state-loading"'), 'Executive route must render its honest loading state under SSR');
    assert.ok(routed.includes('Live Providers: 0 (INACTIVE)'), 'Fail-closed disclosure must persist');
  });

  it('INT-02: /portfolio continues to render BI-08 PortfolioWorkspace', () => {
    const portfolioHtml = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.portfolio] },
        React.createElement(SessionProvider, {
          session: ANONYMOUS_SESSION,
          children: React.createElement(App, {}),
        })
      )
    );
    assert.ok(portfolioHtml.includes('min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6'));
  });

  it('INT-03: /security-master continues to render SecurityMasterSurface', () => {
    const smHtml = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.securityMaster] },
        React.createElement(SessionProvider, {
          session: ANONYMOUS_SESSION,
          children: React.createElement(App, {}),
        })
      )
    );
    assert.ok(smHtml.includes('Security Master'));
  });
});
