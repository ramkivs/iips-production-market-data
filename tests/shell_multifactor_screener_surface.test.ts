/**
 * Institutional Investment Platform System (IIPS)
 * F-9 — UI06 Multi-Factor Screener restoration-only routed surface
 *
 * Authority: f8-ui06-screener-restoration-2026-09-23-001
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../frontend/src/app/App.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { MultiFactorScreenerSurface } from '../frontend/src/features/screener/MultiFactorScreenerSurface.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import {
  ScreenerService,
  type ScreenerFilter,
  type ScreenerResponse,
} from '../src/transports/screener_service.js';

const SURFACE_PATH = join(
  process.cwd(),
  'frontend/src/features/screener/MultiFactorScreenerSurface.tsx'
);
const BUILDER_PATH = join(
  process.cwd(),
  'src/ui/view_models/ui06_multifactor_screener.ts'
);
const BUILDER_BLOB = 'd3cccdda4b0ab08f6249fbe6a01c6d2cf31aea63';
const BI08_ROOT_CLASS = 'min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6';

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function renderAt(path: string): string {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );
}

function renderSurface(props: React.ComponentProps<typeof MultiFactorScreenerSurface>): string {
  return renderToString(React.createElement(MultiFactorScreenerSurface, props));
}

function gitBlobHash(path: string): string {
  const bytes = readFileSync(path);
  return createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
}

/** Existing service with no candidates; observes the builder's genuine service invocation. */
class ObservedScreenerService extends ScreenerService {
  public calls = 0;

  public override executeScreen(
    filter: ScreenerFilter,
    asOf = '2026-09-23T00:00:00.000Z'
  ): ScreenerResponse {
    this.calls += 1;
    return super.executeScreen(filter, asOf);
  }
}

describe('F-9 UI06 restoration — routed binding and fail-closed payload boundary', () => {
  it('UI06-01: /screener resolves to the restored UI06 surface', () => {
    const out = renderAt(ROUTES.screener);
    assert.ok(out.includes('ui06-screener-surface'), 'the UI06 surface must render');
    assert.ok(out.includes('Multi-Factor Screener'), 'the UI06 title must render');
    assert.ok(!out.includes('structural-surface-unavailable'), 'not the donor placeholder');
    assert.ok(!out.includes(BI08_ROOT_CLASS), 'must not fall back to BI-08');
  });

  it('UI06-02: the existing UI06MultiFactorScreenerBuilder is the bound builder', () => {
    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    assert.ok(
      code.includes("ui06_multifactor_screener.js'"),
      'the qualified UI06 builder module must be imported'
    );
    assert.ok(
      code.includes('UI06MultiFactorScreenerBuilder.build({'),
      'the existing builder must perform the view-model construction'
    );
    assert.ok(!code.includes('class UI06MultiFactorScreenerBuilder'), 'no replacement builder');
  });

  it('UI06-03: surface identity remains UI06_MULTIFACTOR_SCREENER', () => {
    const service = new ObservedScreenerService();
    const out = renderSurface({ criteria: {}, screenerService: service });
    assert.ok(out.includes('data-surface-id="UI06_MULTIFACTOR_SCREENER"'));
    assert.ok(out.includes('data-testid="ui06-surface-id">UI06_MULTIFACTOR_SCREENER'));
  });

  it('UI06-04: supplied governed input is executed through the existing ScreenerService', () => {
    const service = new ObservedScreenerService();
    const criteria: ScreenerFilter = { sector: 'Technology' };
    const out = renderSurface({ criteria, screenerService: service });
    assert.strictEqual(service.calls, 1, 'the existing service must be called exactly once');
    assert.ok(out.includes('data-testid="ui06-total-matches"'), 'builder result marker must render');
    assert.ok(out.includes('governed matches'), 'the builder response must be rendered');
    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    assert.ok(code.includes('transports/screener_service.js'), 'existing service contract imported');
    assert.ok(!code.includes('new ScreenerService'), 'surface must not construct a replacement service');
  });

  it('UI06-05: the qualified UI06 builder remains byte-identical', () => {
    assert.strictEqual(gitBlobHash(BUILDER_PATH), BUILDER_BLOB);
  });

  it('UI06-06: the mounted route fabricates no candidate universe or screening payload', () => {
    const out = renderAt(ROUTES.screener);
    assert.ok(!out.includes('data-testid="data-table"'), 'no results table without payload');
    assert.ok(!out.includes('data-testid="ui06-provenance"'), 'no invented provenance');
    assert.ok(!out.includes('governed matches'), 'no result count is manufactured');
    assert.ok(!/[0-9a-f]{64}/.test(out), 'no lineage digest is manufactured');
    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    assert.ok(!code.includes('registerCandidate'), 'surface must not register candidates');
  });

  it('UI06-07: no payload renders the honest offline/unavailable state', () => {
    const out = renderAt(ROUTES.screener);
    assert.ok(out.includes('state-unavailable'), 'unavailable state must render');
    assert.ok(
      out.includes('OFFLINE / UNAVAILABLE / PAYLOAD NOT COMMISSIONED'),
      'the exact current payload state must be disclosed'
    );
    assert.ok(out.includes('No governed D01-derived candidate universe is commissioned'));
  });

  it('UI06-08: /screener/governed preserves its donor-lineage fail-closed boundary', () => {
    const out = renderAt(ROUTES.screenerGoverned);
    assert.ok(out.includes('structural-surface-unavailable'));
    assert.ok(out.includes('Screener — Governed'));
    assert.ok(out.includes('OFFLINE — SERVICE NOT ACTIVE'));
    assert.ok(!out.includes('UI06_MULTIFACTOR_SCREENER'));
    assert.ok(!out.includes('data-testid="data-table"'));
  });

  it('UI06-09: the UI06 implementation closure activates no market-data provider', () => {
    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    const forbidden: ReadonlyArray<readonly [RegExp, string]> = [
      [/\bDhan\b/i, 'Dhan'],
      [/\bNSE\b/, 'NSE'],
      [/providerActivation/i, 'provider activation'],
      [/externalProvider/i, 'external provider'],
      [/credentials?/i, 'credentials'],
    ];
    for (const [pattern, label] of forbidden) {
      assert.ok(!pattern.test(code), `UI06 source must not contain ${label}`);
    }
  });

  it('UI06-10: the UI06 implementation closure activates no auth, server, or network path', () => {
    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    const forbidden: ReadonlyArray<readonly [RegExp, string]> = [
      [/\bD115\b/i, 'D115'],
      [/authFetch/i, 'authFetch'],
      [/useAuth|AuthProvider|oidc|keycloak/i, 'authentication'],
      [/[/'"]\/api\//, 'API path'],
      [/frontend\/server/i, 'server tier'],
      [/\bfetch\s*\(/, 'network fetch'],
      [/XMLHttpRequest|WebSocket|EventSource/, 'network transport'],
    ];
    for (const [pattern, label] of forbidden) {
      assert.ok(!pattern.test(code), `UI06 source must not contain ${label}`);
    }
  });

  it('UI06-11: navigation census changes only the authorized Screener item', () => {
    const all = NAV.flatMap((item) => [item, ...(item.children ?? [])]);
    const screener = all.filter((item) => item.path === ROUTES.screener);
    assert.deepStrictEqual(
      screener.map(({ label, path, status }) => [label, path, status]),
      [['Screener', '/screener', 'partial']],
      'UI06 is the single restored Screener navigation item'
    );

    const unrelated = all
      .filter((item) => item.path !== ROUTES.screener)
      .map(({ label, path, status }) => [label, path, status]);
    assert.deepStrictEqual(unrelated, [
      ['Portfolio', '/portfolio', 'implemented'],
      ['Overview', '/portfolio', 'implemented'],
      ['Executive', '/executive', 'partial'],
      ['Replay Studio', '/replay', 'future'],
      ['Security Master', '/security-master', 'implemented'],
      ['Research', '/research', 'partial'],
      ['Company', '/research/company/Banking', 'unavailable'],
      ['Sector', '/research/sector/Banking', 'unavailable'],
      ['Events', '/research/events/Banking', 'unavailable'],
      ['Cross-Sector', '/research/cross-sector', 'unavailable'],
      ['Macro', '/research/macro', 'unavailable'],
      ['Intelligence', '/intelligence', 'partial'],
      ['Decision Matrix', '/intelligence/decision-matrix', 'unavailable'],
      ['Opportunities', '/intelligence/opportunities', 'future'],
      ['Risks', '/intelligence/risks', 'future'],
      ['Rankings', '/intelligence/rankings', 'future'],
      ['Evidence', '/evidence', 'partial'],
      ['Decision Evidence', '/evidence', 'partial'],
      ['Administration', '/admin', 'unavailable'],
      ['Overview', '/admin/overview', 'unavailable'],
      ['Identity & Access', '/admin/identity', 'unavailable'],
      ['Tenants', '/admin/tenancy', 'unavailable'],
      ['Engines & Certification', '/admin/engines', 'unavailable'],
      ['Platform Operations', '/admin/platform', 'unavailable'],
      ['Audit', '/admin/audit', 'unavailable'],
      ['Live Data & Governance', '/admin/data', 'unavailable'],
      ['Migration / Workflow / Marketplace', '/admin/operations', 'unavailable'],
      ['Collaboration', '/collaboration', 'unavailable'],
      ['Reports', '/reports', 'unavailable'],
      ['Watchlists', '/watchlists', 'unavailable'],
      ['Settings', '/settings', 'unavailable'],
    ]);

    const census = (status: string): number => all.filter((item) => item.status === status).length;
    assert.deepStrictEqual(
      {
        total: all.length,
        implemented: census('implemented'),
        partial: census('partial'),
        unavailable: census('unavailable'),
        future: census('future'),
      },
      { total: 32, implemented: 3, partial: 6, unavailable: 19, future: 4 }
    );
  });

  it('UI06-12: unrelated routed surfaces remain unchanged', () => {
    const expected: ReadonlyArray<readonly [string, string]> = [
      [ROUTES.portfolio, BI08_ROOT_CLASS],
      [ROUTES.executive, 'executive-heading'],
      [ROUTES.research, 'research-heading'],
      [ROUTES.intelligence, 'intelligence-heading'],
      [ROUTES.evidence, 'evidence-heading'],
      [ROUTES.securityMaster, 'security-master-heading'],
    ];
    for (const [path, marker] of expected) {
      assert.ok(renderAt(path).includes(marker), `${path} must retain marker ${marker}`);
    }

    const code = stripComments(readFileSync(SURFACE_PATH, 'utf8'));
    for (const builder of [
      'ui02_executive_summary',
      'ui03_fundamental_analysis',
      'ui04_domain_intelligence',
      'ui05_sector_scoring_radar',
      'ui07_pit_corporate_actions',
      'ui08_security_master_modal',
      'ui09_restatement_timeline',
      'ui10_anomaly_monitor',
      'ui11_provenance_auditor',
      'ui12_estimates_distribution',
      'ui13_macro_vintage_tracker',
      'ui14_altdata_auditor',
    ]) {
      assert.ok(!code.includes(builder), `UI06 surface must not bind unrelated builder ${builder}`);
    }
  });
});
