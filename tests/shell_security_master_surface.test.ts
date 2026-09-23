/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: F-3 — UI08 Security Master Functional Routed Surface
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 f3-ui08-security-master-functional-2026-09-23-001 (F-3 authority act)
 *                 AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (D05 data)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  F-3 mounts the FIRST functional surface beyond Portfolio: governed D05 identity
 *  resolution at /security-master, via the existing UI08SecurityMasterModalBuilder and
 *  the existing in-process ObjectResolverService.
 *
 *  These tests fail if:
 *    · /security-master stops rendering the UI08 surface (or falls back to anything else);
 *    · the surface binds anything other than the governed D05 broad master;
 *    · a canonical identity is displayed for an unmapped/ambiguous identifier;
 *    · AIIL/AGI GREENPAC governed mappings lose determinism;
 *    · any fuzzy matching occurs;
 *    · an API/auth/provider/network dependency is introduced;
 *    · the UI08 accessibility/responsive contract is broken;
 *    · any undesignated UI surface identity is claimed by this route.
 *
 *  Rendering is server-side (renderToString) under MemoryRouter — the query is carried in
 *  the URL (?type=…&value=…), which is the surface's genuine deep-link contract.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../frontend/src/app/App.js';
import { SecurityMasterSurface } from '../frontend/src/features/security-master/SecurityMasterSurface.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import { SecurityMaster } from '../src/identity/index.js';

const BI08_ROOT_CLASS = 'min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6';
const CANONICAL_ID = /EQ_[A-Z0-9]+_IN/;

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

/** Render the surface directly with explicit props (controlled scenarios). */
function renderSurface(props: React.ComponentProps<typeof SecurityMasterSurface>, url = '/security-master'): string {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [url] },
      React.createElement(SecurityMasterSurface, props)
    )
  );
}

describe('F-3: /security-master routed surface', () => {
  it('SM-01: the route resolves to the UI08 surface — never a fallback or placeholder', () => {
    const out = renderAt('/security-master');
    assert.ok(out.includes('security-master-heading'), 'the UI08 surface must render');
    assert.ok(out.includes('Security Master — Governed Identity Resolution'), 'surface title');
    assert.ok(!out.includes('This surface is declared in the governed navigation model'), 'no FeaturePlaceholder');
    assert.ok(!out.includes(BI08_ROOT_CLASS), 'no silent portfolio fallback');
    assert.ok(!out.includes('structural-surface-unavailable'), 'not a structural fail-closed page');
  });

  it('SM-02: the UI08 surface mounts with its query contract and governed source marker', () => {
    const out = renderAt('/security-master');
    assert.ok(out.includes('security-master-query-form'), 'query form renders');
    assert.ok(out.includes('security-master-empty'), 'no-query empty state renders');
    assert.ok(out.includes('D05 Governed Broad Universe (2,250 entities)'), 'governed source is disclosed');
  });

  it('SM-03: the GOVERNED D05 BROAD master is used (broad-universe-only entity resolves)', () => {
    // ITC (EQ_ITC_IN) exists ONLY in the 2,250-entity broad universe — not in the small
    // offline reference set. A resolution here proves the broad governed master is bound,
    // not a local/synthetic/secondary master.
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=ITC');
    assert.ok(out.includes('EQ_ITC_IN'), 'broad-universe entity must resolve to its canonical id');
    assert.ok(out.includes('ITC Limited'), 'canonical name must render');
    // The surface source must bind the governed master — never register local entities.
    const src = readFileSync(join(process.cwd(), 'frontend/src/features/security-master/SecurityMasterSurface.tsx'), 'utf8');
    assert.ok(src.includes('getGovernedBroadSecurityMaster'), 'governed master binding present');
    assert.ok(!src.includes('registerEntity'), 'the surface must never register synthetic entities');
  });

  it('SM-04: canonical companyId is displayed for a known identity (INFY)', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=INFY');
    assert.ok(out.includes('security-master-resolution'), 'resolution panel renders');
    assert.ok(out.includes('EQ_INFY_IN'), 'canonical EQ_INFY_IN must be displayed');
    assert.ok(out.includes('security-master-company-id'), 'canonical id element present');
    // The CANONICAL ELEMENT itself must carry the governed canonical id — never the raw
    // queried ticker (M2 guard: ticker-only identity display must trip this).
    assert.ok(
      out.includes('data-testid="security-master-company-id"><strong>EQ_INFY_IN</strong>'),
      'the canonical element must render EQ_INFY_IN (governed), not the query value'
    );
    assert.ok(
      !out.includes('data-testid="security-master-company-id"><strong>INFY</strong>'),
      'the canonical element must never display the bare ticker as the identity'
    );
  });

  it('SM-05: a known identity resolves with its full governed descriptor', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=INFY');
    assert.ok(out.includes('Infosys Limited'), 'company name');
    assert.ok(out.includes('INE009A01021'), 'ISIN from the governed master');
    assert.ok(out.includes('Lineage Digest'), 'provenance block renders');
    assert.ok(out.includes('REAL'), 'source classification is REAL (governed)');
  });

  it('SM-06: an UNKNOWN identifier fails closed — no canonical identity is displayed', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=NOT_A_REAL_TICKER');
    assert.ok(out.includes('security-master-fail-closed'), 'fail-closed state renders');
    assert.ok(out.includes('UNMAPPED_IDENTIFIER'), 'quarantine reason must be UNMAPPED_IDENTIFIER');
    assert.ok(out.includes('Quarantined'), 'quarantine record disclosed');
    assert.ok(
      !CANONICAL_ID.test(out),
      'NO canonical EQ_*_IN identity may appear for an unmapped identifier'
    );
    assert.ok(!out.includes('security-master-resolution'), 'no resolution panel may render');
  });

  it('SM-07: an AMBIGUOUS identifier fails closed with a quarantine record', () => {
    // Test-constructed ambiguity (two entities sharing an NSE symbol) exercises the
    // surface's fail-closed handling of IdentityAmbiguityError — mirroring P04-03.
    const ambiguous = new SecurityMaster();
    ambiguous.registerEntity({
      companyId: 'EQ_TEST_ONE_IN',
      isin: 'INE111111111',
      companyName: 'Test One Limited',
      industry: 'Testing',
      sector: 'TESTING',
      effectiveFrom: '2000-01-01T00:00:00.000Z',
      listings: [{ exchange: 'NSE', symbol: 'CLASH', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    });
    ambiguous.registerEntity({
      companyId: 'EQ_TEST_TWO_IN',
      isin: 'INE222222222',
      companyName: 'Test Two Limited',
      industry: 'Testing',
      sector: 'TESTING',
      effectiveFrom: '2000-01-01T00:00:00.000Z',
      listings: [{ exchange: 'NSE', symbol: 'CLASH', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    });
    const out = renderSurface({ securityMaster: ambiguous }, '/security-master?type=NSE_SYMBOL&value=CLASH');
    assert.ok(out.includes('security-master-fail-closed'), 'fail-closed state renders');
    assert.ok(out.includes('AMBIGUOUS_COLLISION'), 'quarantine reason must be AMBIGUOUS_COLLISION');
    assert.ok(!out.includes('security-master-resolution'), 'no resolution panel for ambiguous input');
  });

  it('SM-08: the AIIL mapping remains deterministic (RULING_3 dual effective-dated)', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=AIIL');
    assert.ok(out.includes('EQ_AIIL_IN'), 'AIIL must resolve to EQ_AIIL_IN');
  });

  it('SM-09: AGI GREENPAC resolves through the EXACT governed alias (no fuzzy matching)', () => {
    const alias = renderAt('/security-master?type=NSE_SYMBOL&value=' + encodeURIComponent('AGI GREENPAC'));
    assert.ok(alias.includes('EQ_AGI_IN'), 'the exact governed alias must resolve to EQ_AGI_IN');
    const symbol = renderAt('/security-master?type=NSE_SYMBOL&value=AGI');
    assert.ok(symbol.includes('EQ_AGI_IN'), 'the AGI symbol must resolve to EQ_AGI_IN');
    const isin = renderAt('/security-master?type=ISIN&value=INE415A01038');
    assert.ok(isin.includes('EQ_AGI_IN'), 'the AGI ISIN must resolve to EQ_AGI_IN');
  });

  it('SM-10: NO fuzzy matching — near-miss identifiers fail closed', () => {
    for (const bad of ['INF', 'INFYY', 'INFOSYS', 'AGI GREEN', 'AIILL']) {
      const out = renderAt('/security-master?type=NSE_SYMBOL&value=' + encodeURIComponent(bad));
      assert.ok(
        out.includes('security-master-fail-closed'),
        `near-miss '${bad}' must fail closed (no fuzzy matching)`
      );
      assert.ok(
        !CANONICAL_ID.test(out),
        `near-miss '${bad}' must never surface a canonical identity`
      );
    }
  });

  it('SM-11: the UI08 modal accessibility/focus contract is preserved', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=INFY');
    assert.ok(out.includes('role="dialog"'), 'resolution panel carries the UI08 dialog role');
    assert.ok(out.includes('aria-live="assertive"'), 'aria-live assertive per the UI08 contract');
    assert.ok(out.includes('ui08-modal-close-btn'), 'the UI08 focus target (close button) renders');
    assert.ok(
      out.includes('Security Master Object Resolution Details for Infosys Limited'),
      'the builder-generated table caption (region label) renders'
    );
  });

  it('SM-12: responsive tiers respond to viewport width (UI08 responsive engine)', () => {
    const desktop = renderSurface({ viewportWidth: 1280 }, '/security-master?type=NSE_SYMBOL&value=INFY');
    const mobile = renderSurface({ viewportWidth: 375 }, '/security-master?type=NSE_SYMBOL&value=INFY');
    assert.ok(desktop.includes('ui08-responsive-tier'), 'responsive tier marker renders (desktop)');
    assert.ok(mobile.includes('ui08-responsive-tier'), 'responsive tier marker renders (mobile)');
    const tierOf = (html: string): string =>
      (html.match(/data-resp-tier="([^"]+)"/) ?? [])[1] ?? '';
    assert.ok(tierOf(desktop), 'desktop tier resolved');
    assert.ok(tierOf(mobile), 'mobile tier resolved');
    assert.notStrictEqual(tierOf(desktop), tierOf(mobile), 'tiers must differ across viewports');
  });

  it('SM-13: no API/auth/provider dependency exists in the F-3 implementation delta', () => {
    const files = [
      'frontend/src/features/security-master/SecurityMasterSurface.tsx',
      'frontend/src/app/App.tsx',
      'frontend/src/app/navigation.ts',
    ];
    const forbidden: ReadonlyArray<readonly [RegExp, string]> = [
      [/authFetch/, 'authFetch'],
      [/AuthProvider/, 'AuthProvider'],
      [/useAuth/, 'useAuth'],
      [/keycloak/i, 'keycloak'],
      [/oidc/i, 'oidc'],
      [/[/'"]\/api\//, 'an /api/ path'],
      [/frontend\/server/, 'the server tier'],
      [/\bfetch\(/, 'a network fetch'],
      [/XMLHttpRequest/, 'XMLHttpRequest'],
      [/EventSource/, 'EventSource'],
      [/WebSocket/, 'WebSocket'],
      [/accessToken/, 'accessToken'],
      [/clientSecret/, 'clientSecret'],
      [/Bearer/, 'Bearer credentials'],
      [/\bDhan\b/, 'Dhan'],
    ];
    for (const f of files) {
      const raw = readFileSync(join(process.cwd(), f), 'utf8');
      const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const [re, what] of forbidden) {
        assert.ok(!re.test(stripped), `${f} must not contain ${what}`);
      }
    }
    // The surface binds the EXISTING UI08 builder + resolver (no replacement contracts).
    const src = readFileSync(join(process.cwd(), 'frontend/src/features/security-master/SecurityMasterSurface.tsx'), 'utf8');
    assert.ok(src.includes('UI08SecurityMasterModalBuilder'), 'existing UI08 builder is used');
    assert.ok(src.includes('ObjectResolverService'), 'existing governed resolver is used');
  });

  it('SM-14: no undesignated UI surface identity is claimed by this route', () => {
    const out = renderAt('/security-master?type=NSE_SYMBOL&value=INFY');
    for (const id of ['UI05', 'UI06', 'UI07', 'UI09', 'UI10', 'UI12', 'UI13', 'UI14']) {
      assert.ok(!out.includes(id), `the UI08 route must not claim the ${id} surface identity`);
    }
  });
});
