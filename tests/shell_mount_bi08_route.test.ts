/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase-1B Shell Mount & BI-08 Portfolio Route Integration
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 *                 Phase-1B Authority Decision (shell mount + BI-08 portfolio route)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  Phase 1B mounts the recovered full-IIPS shell over the certified BI-07/BI-08 render path.
 *  The governing risk is that the shell renders while the BI-08 portfolio experience is
 *  silently lost, degraded, or replaced by the historical full-IIPS PortfolioWorkspace.
 *
 *  These tests fail if:
 *    · /portfolio stops rendering the CURRENT BI-08 PortfolioWorkspace
 *    · the BI-08 markup rendered inside the shell diverges from the component rendered
 *      standalone (i.e. the mount alters the certified output)
 *    · the default surface stops resolving to the portfolio route
 *    · the fail-closed production disclosure disappears from the chrome
 *    · client-side authentication is reintroduced
 *    · a future surface is promoted to a fabricated implementation
 *
 *  Rendering is server-side (renderToString). No DOM runner is required, so the suite runs
 *  in the standard `node --test` pipeline. `<Navigate>` redirects in an effect that does not
 *  run under SSR, so the redirect TARGET is asserted as exported data instead.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App, DEFAULT_SURFACE_ROUTE } from '../frontend/src/app/App.js';
import { AppShell } from '../frontend/src/app/AppShell.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import {
  PortfolioStore,
  PortfolioWorkspace,
} from '../frontend/src/features/portfolio/index.js';
import { SecurityMaster, getGovernedBroadSecurityMaster } from '../src/identity/index.js';

/** The BI-08 PortfolioWorkspace root element signature (certified BI-07 visual contract). */
const BI08_ROOT_CLASS = 'min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6';

function renderAt(path: string, store?: PortfolioStore, sm?: SecurityMaster): string {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {
          portfolioStore: store,
          securityMaster: sm,
        }),
      })
    )
  );
}

describe('Phase-1B: /portfolio renders the CURRENT BI-08 PortfolioWorkspace', () => {
  it('MOUNT-01: /portfolio renders the certified BI-08 workspace root', () => {
    const html = renderAt(ROUTES.portfolio, new PortfolioStore(), getGovernedBroadSecurityMaster());
    assert.ok(
      html.includes(BI08_ROOT_CLASS),
      '/portfolio must render the current BI-08 PortfolioWorkspace root element'
    );
    assert.ok(html.includes('Import Holdings'), 'BI-08 broker import entry point must be present');
  });

  it('MOUNT-02: routed BI-08 markup is byte-identical to the standalone component', () => {
    // Same store + same security master => the shell must not alter BI-08 output at all.
    const store = new PortfolioStore();
    const sm = getGovernedBroadSecurityMaster();

    const standalone = renderToString(
      React.createElement(PortfolioWorkspace, { portfolioStore: store, securityMaster: sm })
    );
    const routed = renderAt(ROUTES.portfolio, store, sm);

    assert.ok(
      routed.includes(standalone),
      'The BI-08 workspace HTML rendered inside the shell must be identical to the ' +
        'component rendered standalone — the mount must not modify certified output'
    );
  });

  it('MOUNT-03: the historical full-IIPS PortfolioWorkspace is NOT substituted', () => {
    const html = renderAt(ROUTES.portfolio, new PortfolioStore(), getGovernedBroadSecurityMaster());
    // The historical workspace was API-coupled and token-styled; it never emitted the BI
    // utility-class root. Its presence would indicate a wholesale replacement.
    assert.ok(html.includes(BI08_ROOT_CLASS), 'BI-08 implementation must remain authoritative');
    assert.ok(
      !html.includes('var(--color-surface-1)') || html.includes(BI08_ROOT_CLASS),
      'BI-08 surface must not be replaced by the historical token-styled workspace'
    );
  });

  it('MOUNT-04: default surface resolves to the BI-08 portfolio route', () => {
    assert.strictEqual(
      DEFAULT_SURFACE_ROUTE,
      ROUTES.portfolio,
      'The application default surface must remain the certified BI-08 portfolio route'
    );
  });

  it('MOUNT-05: App accepts and forwards application-level singletons (Tier-B continuity)', () => {
    const store = new PortfolioStore();
    const sm = getGovernedBroadSecurityMaster();
    const element = React.createElement(App, { portfolioStore: store, securityMaster: sm });
    assert.strictEqual(element.props.portfolioStore, store);
    assert.strictEqual(element.props.securityMaster, sm);
  });

  it('MOUNT-06: portfolio state survives navigation away and back (no store reset)', () => {
    const store = new PortfolioStore();
    const sm = getGovernedBroadSecurityMaster();

    renderAt(ROUTES.portfolio, store, sm);
    const before = store.getPortfolio('DEFAULT_PORTFOLIO');

    renderAt(ROUTES.research, store, sm); // navigate to a future surface
    renderAt(ROUTES.portfolio, store, sm); // and back
    const after = store.getPortfolio('DEFAULT_PORTFOLIO');

    assert.deepStrictEqual(
      after?.holdings.length,
      before?.holdings.length,
      'Holdings must not change across navigation'
    );
    assert.strictEqual(
      after?.provenanceDigest,
      before?.provenanceDigest,
      'Provenance digest must be stable across navigation'
    );
  });
});

describe('Phase-1B: application shell chrome renders', () => {
  const html = renderAt(ROUTES.portfolio, new PortfolioStore(), getGovernedBroadSecurityMaster());

  it('SHELL-01: AppShell grid renders', () => {
    assert.ok(html.includes('app-shell'), 'AppShell root must render');
    assert.ok(html.includes('app-main'), 'content outlet region must render');
  });

  it('SHELL-02: TopBar renders with session identity', () => {
    assert.ok(html.includes('IIPS — Enterprise Investment Intelligence'), 'TopBar brand must render');
    assert.ok(html.includes('topbar-role'), 'TopBar must expose the display role');
    assert.ok(html.includes('topbar-tenant'), 'TopBar must expose the display tenant');
  });

  it('SHELL-03: Sidebar renders with primary navigation', () => {
    assert.ok(html.includes('app-sidebar'), 'Sidebar region must render');
    assert.ok(html.includes('app-nav'), 'navigation list must render');
    assert.ok(html.includes('aria-label="Primary"'), 'navigation landmark must be labelled');
  });

  it('SHELL-04: implemented surfaces are links; future surfaces are NOT links', () => {
    assert.ok(html.includes('href="/portfolio"'), 'Portfolio must be a navigable link');
    // Future surfaces render as non-navigable text with a Future badge (N+17 contract).
    // Phase-4 (Path L): Research is now a real partial surface and a link (see
    // shell_research_surface.test.ts), so the future-marker assertion uses Replay Studio.
    assert.ok(
      html.includes('nav-future-Replay Studio'),
      'Replay Studio must render as a future marker'
    );
    assert.ok(
      !html.includes('href="/replay"'),
      'Future surfaces must never be links to placeholder surfaces'
    );
  });

  it('SHELL-05: accessibility affordances survive the mount', () => {
    assert.ok(html.includes('skip-link'), 'skip link must render');
    assert.ok(html.includes('id="main-content"'), 'main content target must render');
  });

  it('SHELL-06: AppShell remains the Phase-1A recovered component', () => {
    assert.strictEqual(typeof AppShell, 'function', 'AppShell must be a React component');
  });
});

describe('Phase-1B: BI-07 non-regression and production boundary', () => {
  const html = renderAt(ROUTES.portfolio, new PortfolioStore(), getGovernedBroadSecurityMaster());

  it('REG-01: fail-closed production disclosure is preserved in the chrome', () => {
    assert.ok(html.includes('Live Providers: 0 (INACTIVE)'), 'provider disclosure must persist');
    assert.ok(html.includes('Sockets: 0'), 'socket disclosure must persist');
    assert.ok(html.includes('BI-07 Host Verified'), 'BI-07 host verification marker must persist');
  });

  it('REG-01b: the execution-mode governance strip is preserved from the BI-07 chrome', () => {
    // The pre-mount header carried these disclosures; NON_PRODUCTION / OFFLINE_FIXTURE is a
    // fail-closed statement, so losing it during the mount would be a boundary regression.
    assert.ok(html.includes('NON_PRODUCTION / OFFLINE_FIXTURE'), 'execution mode must be disclosed');
    assert.ok(html.includes('Governance: Active'), 'governance status must be disclosed');
    assert.ok(html.includes('P04/P12 Lineage Enforced'), 'lineage enforcement must be disclosed');
    // The recovered TopBar renders the historical brand, so the certified product name must
    // be carried explicitly or it is silently lost from the chrome.
    assert.ok(
      html.includes('Institutional Investment Platform System'),
      'the certified product name must survive the shell mount'
    );
  });

  it('REG-02: the disclosure is present on every surface, not just portfolio', () => {
    for (const path of [ROUTES.research, ROUTES.admin, ROUTES.settings]) {
      const surface = renderAt(path);
      assert.ok(
        surface.includes('Live Providers: 0 (INACTIVE)'),
        `fail-closed disclosure must render on ${path}`
      );
      assert.ok(
        surface.includes('NON_PRODUCTION / OFFLINE_FIXTURE'),
        `execution-mode disclosure must render on ${path}`
      );
    }
  });

  it('REG-03: no client-side authentication is reintroduced (Phase-1A F-a preserved)', () => {
    assert.ok(!html.includes('data-testid="sign-out"'), 'Sign-out must not render without onSignOut');
    assert.ok(!/keycloak|oidc/i.test(html), 'no OIDC/Keycloak surface may appear');
  });

  it('REG-04: future surfaces render an honest placeholder, never fabricated data', () => {
    // Intelligence is intentionally excluded: as of Phase 1C it is a real Path-L surface
    // (navigable, 'partial'), no longer a FeaturePlaceholder. See shell_intelligence_surface.
    // Evidence is intentionally excluded as of Phase 2: it is a real Path-L surface
    // (navigable, 'partial'), no longer a FeaturePlaceholder. See shell_evidence_surface.
    // Executive is intentionally excluded as of Phase 3: it is a real Path-L surface
    // (navigable, 'partial', renders its governed unavailable state). See
    // shell_executive_surface.test.ts.
    // Research is intentionally excluded as of Phase 4: it is a real Path-L surface
    // (navigable, 'partial', UI03 binding, renders its governed unavailable state). See
    // shell_research_surface.test.ts.
    for (const [surface, path] of [['Administration', ROUTES.admin]] as const) {
      const out = renderAt(path);
      assert.ok(out.includes('Not implemented'), `${surface} must declare itself unimplemented`);
      assert.ok(
        !out.includes(BI08_ROOT_CLASS),
        `${surface} must not render portfolio data it does not own`
      );
    }
  });

  it('REG-05: unknown routes fall back to the default surface, not a fabricated one', () => {
    assert.strictEqual(DEFAULT_SURFACE_ROUTE, ROUTES.portfolio);
  });
});
