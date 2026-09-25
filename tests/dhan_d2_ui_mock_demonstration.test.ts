/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D2 UI Fixture Demonstration — offline render suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS — UI demonstration
 * Execution Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * ══ WHAT THIS SUITE PROVES ════════════════════════════════════════════════════════════════
 *  1. The development-only surface renders the THREE market-data presentation states
 *     (CURRENT / STALE / UNAVAILABLE) from the committed D2 synthetic fixtures, through the
 *     existing provider-neutral route — with the DHAN route label present and the price
 *     omitted entirely when the state is UNAVAILABLE.
 *  2. The portfolio section renders the D2 worked example produced by the EXISTING BI-08
 *     market-data binding (INFY / TCS priced, UNMAPPEDCO unpriced with null values).
 *  3. The mandatory pre-access labelling (PRE_ACCESS / SYNTHETIC / OFFLINE, "not live Dhan
 *     data") is present in the rendered markup, and no credential material is rendered.
 *  4. The route fence holds: outside the Vite development server the dev route is NOT
 *     mounted by App, so production behaviour is unchanged.
 *  5. No provider request leaves the process: the demonstration reports 0 external requests
 *     and the surface module contains no fetch/XHR/websocket/auth usage.
 *
 *  It does NOT prove real Dhan authentication, connectivity, coverage or production
 *  readiness. All inputs are synthetic fixtures.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App, DEV_DHAN_D2_ROUTE } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import { DhanD2DevSurface } from '../frontend/src/features/dev/DhanD2DevSurface.js';
import {
  DHAN_D2_DEV_SCENARIOS,
  DHAN_D2_FIXTURE_PATH,
  buildDhanD2DevSnapshot,
  resolveDhanD2DevScenario,
  type DhanD2DevScenarioId,
  type DhanD2DevSnapshot,
} from '../frontend/src/features/dev/dhan-d2-dev-harness.js';

/** Source with comments removed, so documentation prose cannot satisfy or break a scan. */
function executableSource(relativePath: string): string {
  return readFileSync(resolve(relativePath), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const SURFACE_SOURCE = executableSource('frontend/src/features/dev/DhanD2DevSurface.tsx');
const HARNESS_SOURCE = executableSource('frontend/src/features/dev/dhan-d2-dev-harness.ts');

async function snapshotFor(id: DhanD2DevScenarioId): Promise<DhanD2DevSnapshot> {
  return buildDhanD2DevSnapshot(resolveDhanD2DevScenario(id));
}

function render(snapshot: DhanD2DevSnapshot, path = '/dev/dhan-d2'): string {
  return renderToString(
    React.createElement(MemoryRouter, {
      initialEntries: [path],
      children: React.createElement(DhanD2DevSurface, { snapshot }),
    })
  );
}

describe('DHAN-D2 UI demonstration (PRE_ACCESS / SYNTHETIC / OFFLINE)', () => {
  it('D2-UI-01: the fixture scenarios are the committed deterministic D2 scenarios', () => {
    const fixtures = JSON.parse(readFileSync(resolve(DHAN_D2_FIXTURE_PATH), 'utf-8'));
    for (const scenario of DHAN_D2_DEV_SCENARIOS) {
      assert.ok(
        fixtures.quoteScenarios[scenario.fixtureScenarioKey],
        `scenario ${scenario.id} must map to a committed fixture`
      );
    }
    assert.deepStrictEqual(
      DHAN_D2_DEV_SCENARIOS.map((s) => s.id),
      ['current', 'stale', 'unavailable']
    );
    assert.strictEqual(resolveDhanD2DevScenario('nonsense').id, 'current');
  });

  it('D2-UI-02: CURRENT renders provider DHAN, the synthetic price and state CURRENT', async () => {
    const snapshot = await snapshotFor('current');
    const infy = snapshot.views.find((v) => v.companyId === 'INFY')!;
    assert.strictEqual(infy.providerDisplayLabel, 'DHAN');
    assert.strictEqual(infy.state, 'CURRENT');
    assert.strictEqual(infy.displayPrice, 1520.35);

    const html = render(snapshot);
    assert.ok(html.includes('DHAN'), 'provider route label must be rendered');
    assert.ok(html.includes('CURRENT'), 'CURRENT state must be rendered');
    assert.ok(html.includes('1,520.35'), 'synthetic fixture price must be rendered');
    assert.ok(html.includes('2026-09-25T09:59:58.000Z'), 'as-of timestamp must be rendered');
  });

  it('D2-UI-03: STALE renders the aged synthetic price with state STALE and a degraded indicator', async () => {
    const snapshot = await snapshotFor('stale');
    const infy = snapshot.views.find((v) => v.companyId === 'INFY')!;
    assert.strictEqual(infy.state, 'STALE');
    assert.strictEqual(infy.isDegraded, true);
    assert.notStrictEqual(infy.displayPrice, null);

    const html = render(snapshot);
    assert.ok(html.includes('STALE'), 'STALE state must be rendered');
    assert.ok(html.includes('freshness-stale'), 'the stale freshness indicator must be rendered');
    assert.ok(html.includes('DHAN'));
  });

  it('D2-UI-04: UNAVAILABLE renders no price at all and an explicit unavailable state', async () => {
    const snapshot = await snapshotFor('unavailable');
    assert.ok(snapshot.views.every((v) => v.state === 'UNAVAILABLE'));
    assert.ok(snapshot.views.every((v) => v.displayPrice === null));
    assert.ok(snapshot.views.every((v) => v.displayTimestamp === null));

    const html = render(snapshot);
    assert.ok(html.includes('UNAVAILABLE'));
    assert.ok(html.includes('freshness-unavailable'));
    assert.ok(html.includes('not displayed'), 'a null price must render as not displayed');
    assert.ok(!html.includes('1,520.35'), 'no price may be surfaced in the UNAVAILABLE state');
    assert.strictEqual(snapshot.revaluation.portfolioState, 'UNAVAILABLE');
  });

  it('D2-UI-05: the CURRENT scenario also demonstrates UNAVAILABLE for the unmapped holding', async () => {
    const snapshot = await snapshotFor('current');
    const unmapped = snapshot.views.find((v) => v.companyId === 'UNMAPPEDCO')!;
    assert.strictEqual(unmapped.state, 'UNAVAILABLE');
    assert.strictEqual(unmapped.displayPrice, null);
    assert.strictEqual(unmapped.unavailableReason, 'UNRESOLVED_INSTRUMENT');

    const html = render(snapshot);
    assert.ok(html.includes('UNRESOLVED_INSTRUMENT'));
  });

  it('D2-UI-06: the portfolio section renders the D2 worked example verbatim', async () => {
    const snapshot = await snapshotFor('current');
    const { positions, totalCurrentValue, totalUnrealizedPnl } = snapshot.revaluation;

    const infy = positions.find((p) => p.companyId === 'INFY')!;
    assert.strictEqual(infy.ltp, 1520.35);
    assert.strictEqual(infy.currentValue, 152035);
    assert.strictEqual(infy.unrealizedPnl, 6985);

    const tcs = positions.find((p) => p.companyId === 'TCS')!;
    assert.strictEqual(tcs.ltp, 3850.5);
    assert.strictEqual(tcs.currentValue, 192525);
    assert.strictEqual(tcs.unrealizedPnl, 2525);

    const unmapped = positions.find((p) => p.companyId === 'UNMAPPEDCO')!;
    assert.strictEqual(unmapped.ltp, null);
    assert.strictEqual(unmapped.currentValue, null);
    assert.strictEqual(unmapped.unrealizedPnl, null);
    assert.strictEqual(unmapped.disposition, 'UNPRICED_NO_MARKET_DATA');

    assert.strictEqual(totalCurrentValue, 344560);
    assert.strictEqual(totalUnrealizedPnl, 9510);

    const html = render(snapshot);
    for (const expected of ['152,035', '6,985', '192,525', '2,525', 'UNMAPPEDCO', 'UNPRICED_NO_MARKET_DATA']) {
      assert.ok(html.includes(expected), `portfolio markup must contain ${expected}`);
    }
    assert.ok(html.includes('1,520.35') && html.includes('3,850.5'));
  });

  it('D2-UI-07: mandatory pre-access labelling is rendered and nothing implies live data', async () => {
    for (const id of ['current', 'stale', 'unavailable'] as const) {
      const html = render(await snapshotFor(id));
      assert.ok(html.includes('PRE_ACCESS / SYNTHETIC / OFFLINE'), `${id}: execution mode label`);
      assert.ok(html.includes('not live Dhan data'), `${id}: explicit non-live disclosure`);
      assert.ok(html.includes('no Dhan credential'), `${id}: explicit credential disclosure`);
      assert.ok(html.includes(DHAN_D2_FIXTURE_PATH), `${id}: fixture provenance`);
      assert.ok(!/\bLIVE\b/.test(html), `${id}: must never present a LIVE indicator`);
      assert.ok(!html.includes('SYNTHETIC-PRE-ACCESS-PLACEHOLDER-VALUE'), `${id}: no placeholder leakage`);
      assert.ok(!html.includes('SYNTHETIC-CLIENT-PLACEHOLDER'), `${id}: no client id leakage`);
      assert.ok(!html.toLowerCase().includes('access-token:'), `${id}: no header material`);
    }
  });

  it('D2-UI-08: no external request is made and no network primitive is used', async () => {
    for (const id of ['current', 'stale', 'unavailable'] as const) {
      const snapshot = await snapshotFor(id);
      assert.strictEqual(snapshot.externalRequestCount, 0);
      assert.ok(snapshot.fixtureRequestCount >= 1, 'fixtures must actually flow through the client');
    }
    for (const [label, source] of [
      ['surface', SURFACE_SOURCE],
      ['harness', HARNESS_SOURCE],
    ] as const) {
      for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'authFetch', 'api.dhan.co']) {
        assert.ok(!source.includes(forbidden), `${label} must not use ${forbidden}`);
      }
    }
  });

  it('D2-UI-09: the development route is fenced out of non-development execution', () => {
    assert.strictEqual(DEV_DHAN_D2_ROUTE, '/dev/dhan-d2');
    // The governed route inventory (OPTA-01) must remain untouched by the dev surface.
    assert.ok(
      !(Object.values(ROUTES) as readonly string[]).includes(DEV_DHAN_D2_ROUTE),
      'the development route must never enter the certified ROUTES inventory'
    );
    const html = renderToString(
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(MemoryRouter, {
          initialEntries: [DEV_DHAN_D2_ROUTE],
          children: React.createElement(App, {}),
        }),
      })
    );
    assert.ok(
      !html.includes('dhan-d2-dev-surface'),
      'the development surface must not mount outside the Vite dev server'
    );
  });

  it('D2-UI-10: the harness output is deterministic across repeated builds', async () => {
    const first = await snapshotFor('current');
    const second = await snapshotFor('current');
    assert.deepStrictEqual(
      first.revaluation.positions.map((p) => [p.companyId, p.ltp, p.currentValue, p.unrealizedPnl]),
      second.revaluation.positions.map((p) => [p.companyId, p.ltp, p.currentValue, p.unrealizedPnl])
    );
    assert.deepStrictEqual(
      first.views.map((v) => [v.companyId, v.state, v.displayPrice, v.displayTimestamp]),
      second.views.map((v) => [v.companyId, v.state, v.displayPrice, v.displayTimestamp])
    );
  });
});
