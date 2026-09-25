/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase 5 / Option A — Offline Full-Shell Restoration
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 *                 phase5-offline-full-shell-restoration-2026-09-23-001 (Option A)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  Option A restores the donor Master IIPS shell STRUCTURE (26 donor route paths, the donor
 *  navigation hierarchy, the TopBar overlay structure, the Sign-out structural entry) around
 *  the accepted BI-08 integration, WITHOUT restoring the excluded runtime dependencies
 *  (server tier / Keycloak / authFetch / /api/* / network / credentials / providers).
 *
 *  These tests fail if:
 *    · a restored donor route is missing (structure regression);
 *    · a restored surface renders ANYTHING other than its honest fail-closed state;
 *    · any fabricated data (scores, prices, notifications, results) appears on a
 *      structural surface;
 *    · the excluded runtime tier is re-imported anywhere in the application shell;
 *    · a dead link exists (a navigable nav entry whose route does not render);
 *    · the four preserved partial surfaces (UI02/UI03/UI04/UI11) are replaced or degraded;
 *    · BI-08 stops rendering at /portfolio;
 *    · an undesignated research child claims a UISurfaceId identity (UI05/UI12/UI13).
 *
 *  F-9 bounded amendment: /screener is now the separately authorized UI06 partial surface;
 *  /screener/governed preserves the original structural fail-closed boundary.
 *
 *  Rendering is server-side (renderToString) — same pattern as shell_mount_bi08_route.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { App, DEFAULT_SURFACE_ROUTE } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';

/** The BI-08 PortfolioWorkspace root element signature (certified BI-07 visual contract). */
const BI08_ROOT_CLASS = 'min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6';

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

/** Recursively list files under a directory. */
function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

const APP_DIR = join(process.cwd(), 'frontend/src/app');

/**
 * Strip comments so the boundary scan tests CODE, not provenance documentation. The
 * restored files legitimately DOCUMENT the excluded tier in comments ("authFetch ->
 * /api/* -> frontend/server/**"); a code occurrence is the violation the guard must catch
 * (proven by the Phase-F mutation tests).
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/* ══════════════════════════════════════════════════════════════════════════════════════
 * ROUTE INVENTORY — the donor structural route model is fully restored
 * ══════════════════════════════════════════════════════════════════════════════════════ */
describe('Option A: donor route structure restored (inventory)', () => {
  it('OPTA-01: the route map carries exactly the restored inventory (26 donor paths + 2 current-base + donor nav-only constants)', () => {
    const paths = Object.values(ROUTES) as readonly string[];
    assert.deepStrictEqual(
      new Set(paths),
      new Set([
        // Donor App.tsx route tree (26 paths)
        '/', '/callback', '/executive', '/portfolio',
        '/research', '/research/company/:id', '/research/sector/:id',
        '/research/events/:id', '/research/cross-sector', '/research/macro',
        '/screener', '/screener/governed', '/search',
        '/intelligence', '/intelligence/decision-matrix',
        '/evidence', '/evidence/:id', '/evidence/replay/:id',
        '/admin', '/admin/overview', '/admin/identity', '/admin/tenancy',
        '/admin/engines', '/admin/platform', '/admin/audit', '/admin/data',
        '/admin/operations',
        '/collaboration', '/reports', '/watchlists', '/settings',
        // Current-base declared surfaces (no donor lineage — preserved)
        '/replay', '/security-master',
        // GROUP 1 / GATE 2 (superseded): donor route (286f3da) for the recovered certified Engine Registry
        '/research/engines',
        // Donor ROUTES-map constants for the future-marked intelligence children
        '/intelligence/opportunities', '/intelligence/risks', '/intelligence/rankings',
      ]),
      'The route inventory must be exactly the donor structure + preserved current-base routes'
    );
    assert.strictEqual(DEFAULT_SURFACE_ROUTE, ROUTES.portfolio, 'default surface stays BI-08');
  });

  it('OPTA-02: the navigation hierarchy matches the donor model with honest statuses', () => {
    assert.deepStrictEqual(
      NAV.map((n) => n.label),
      [
        'Portfolio', 'Executive', 'Replay Studio', 'Security Master',
        'Research', 'Intelligence', 'Evidence', 'Administration',
        'Collaboration', 'Reports', 'Watchlists', 'Settings',
      ],
      'Top-level groups: donor model + the two current-base entries'
    );
    const research = NAV.find((n) => n.label === 'Research');
    assert.deepStrictEqual(
      research?.children?.map((c) => c.label),
      // GROUP 1 / GATE 2 (superseded): donor child 'Engines' (286f3da) follows Cross-Sector, as in the donor nav.
      ['Company', 'Sector', 'Events', 'Cross-Sector', 'Engines', 'Screener', 'Macro'],
      'Research donor children restored'
    );
    const intelligence = NAV.find((n) => n.label === 'Intelligence');
    assert.deepStrictEqual(
      intelligence?.children?.map((c) => c.label),
      ['Decision Matrix', 'Opportunities', 'Risks', 'Rankings'],
      'Intelligence donor children restored (O/R/R remain future, as in the donor)'
    );
    const evidence = NAV.find((n) => n.label === 'Evidence');
    assert.deepStrictEqual(
      evidence?.children?.map((c) => c.label),
      ['Decision Evidence'],
      'Evidence donor child restored'
    );
    const admin = NAV.find((n) => n.label === 'Administration');
    assert.strictEqual(admin?.children?.length, 8, 'Administration 8 donor tabs restored');

    // Status census across all 32 items after the bounded F-9 UI06 amendment and the
    // PROMPT 2C Company/Sector recovery: 3 implemented, 8 partial, 17 unavailable, 4 future.
    // Prompt 2C moved ONLY Company and Sector from unavailable -> partial (two FUNCTIONAL
    // governed SNAPSHOT read surfaces). The total and every unrelated entry are UNCHANGED.
    const all = NAV.flatMap((n) => [n, ...(n.children ?? [])]);
    // GROUP 1 / GATE 2 (superseded): ONLY the Engines entry was ADDED (`partial`), so total 32 -> 33.
    assert.strictEqual(all.length, 33, 'total nav items');
    const census = (s: string): number => all.filter((i) => i.status === s).length;
    assert.strictEqual(census('implemented'), 3, 'implemented: Portfolio + Overview + Security Master (F-3)');
    // DECISION MATRIX work item (governed update): moved ONLY Decision Matrix from
    // unavailable -> partial (restored donor surface on the existing /api/decision-matrix
    // authority; AI Advisory deferred). Total and every other entry UNCHANGED.
    // A3 Research Events restoration (superseded): moved ONLY Events from unavailable -> partial
    // (restored donor surface on the existing evidence/replay/decision-matrix authorities).
    // Total and every other entry UNCHANGED.
    // B1 Cross-Sector restoration (superseded): moved ONLY Cross-Sector from unavailable -> partial
    // (restored donor surface on the existing 8788 SNAPSHOT authority). Total and every other entry UNCHANGED.
    // GROUP 1 / GATE 2 (superseded): + the added Engines entry (partial 11 -> 12). Every other count UNCHANGED.
    assert.strictEqual(census('partial'), 12, 'partial: prior 6 + Company + Sector (Prompt 2C) + Decision Matrix + Events (A3) + Cross-Sector (B1) + Engines (Gate 2)');
    assert.strictEqual(census('unavailable'), 14, 'unavailable: prior 19 less Company, Sector, Decision Matrix, Events and Cross-Sector');
    assert.strictEqual(census('future'), 4, 'future: Replay + Opportunities/Risks/Rankings');
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════
 * FAIL-CLOSED RENDERING — every restored surface states its honest state, fabricates nothing
 * ══════════════════════════════════════════════════════════════════════════════════════ */
/** Strip governed chrome artifacts (version strings, Tailwind size classes) so the fabrication scan is precise. */
function chromeNeutral(html: string): string {
  return html
    .replace(/v\d+\.\d+\.\d+/g, '')
    .replace(/-\d+\.\d+/g, ''); // e.g. py-1.5 / py-2.5 — CSS class fragments, not data
}

/** A fail-closed structural page must contain NO numeric values (scores/prices/weights). */
function assertNoFabricatedValues(out: string, name: string): void {
  const neutral = chromeNeutral(out);
  assert.ok(!neutral.includes('₹'), `${name} must not fabricate monetary values`);
  assert.ok(
    !/\d+\.\d+/.test(neutral),
    `${name} must not fabricate scores, prices, or weights (decimal value found)`
  );
  assert.ok(
    !/\b\d{1,3},\d{3}\b/.test(neutral),
    `${name} must not fabricate grouped numeric values`
  );
}

describe('Option A: restored structural surfaces render honest fail-closed states', () => {
  const offlineRoutes: ReadonlyArray<readonly [string, string]> = [
    ['/search', 'Global Search'],
    // /screener is the separately tested F-9 UI06 partial surface.
    ['/screener/governed', 'Screener — Governed'],
    // PROMPT 2C (governed update): /research/company/:id and /research/sector/:id are NO LONGER
    // structural fail-closed routes. Company Intelligence and Sector Intelligence are now
    // FUNCTIONAL governed SNAPSHOT read surfaces composing the four current-lineage read
    // authorities over HTTP, so they are removed from this list — a route still rendering
    // "service not active" while its real surface exists would be a false statement. Their
    // recoveries are covered by research_sector_ui_recovery.test.ts and
    // research_sector_parity.test.ts. The remaining entries below are unchanged.
    // A3 Research Events restoration (superseded): /research/events/:id is NO LONGER a structural
    // route — the donor ResearchEvents surface is restored and mounted (covered by
    // research_events_recovery.test.ts). Every other entry is unchanged.
    // B1 Cross-Sector restoration (superseded): /research/cross-sector is NO LONGER a structural route —
    // the donor CrossSectorIntelligence surface is restored and mounted (covered by
    // cross_sector_recovery.test.ts). Every other entry is unchanged.
    // DECISION MATRIX work item (governed update): /intelligence/decision-matrix is NO LONGER a
    // structural route — the donor Decision Matrix is restored and mounted (covered by
    // decision_matrix_restoration.test.ts). Every other entry is unchanged.
    // A2 Evidence restoration (superseded): /evidence/:id and /evidence/replay/:id are NO LONGER structural routes — the
    // donor EvidenceExplorer / ReplayExplorer are restored and mounted (covered by
    // evidence_recovery.test.ts). Every other entry is unchanged.
    ['/collaboration', 'Collaboration'],
    ['/reports', 'Reports'],
    ['/watchlists', 'Watchlists'],
    ['/settings', 'Settings'],
  ];

  it('OPTA-04a: every offline structural route renders the fail-closed state, never data', () => {
    for (const [path, name] of offlineRoutes) {
      const out = renderAt(path);
      assert.ok(
        out.includes('structural-surface-unavailable'),
        `${name} (${path}) must render the structural fail-closed state`
      );
      assert.ok(
        out.includes('OFFLINE — SERVICE NOT ACTIVE'),
        `${name} (${path}) must disclose the offline state`
      );
      assert.ok(!out.includes(BI08_ROOT_CLASS), `${name} must not render portfolio data`);
      assert.ok(!out.includes('state-loading'), `${name} must never show a loading spinner`);
      assert.ok(!out.includes('state-empty'), `${name} must not imply data exists but is empty`);
      assertNoFabricatedValues(out, name);
    }
  });

  it('OPTA-04b: macro renders the EXCLUDED state (D91/D88), not a soft unavailable', () => {
    const out = renderAt(ROUTES.researchMacro);
    assert.ok(out.includes('structural-surface-unavailable'));
    assert.ok(out.includes('EXCLUDED BY AUTHORITY'), 'macro must render the excluded badge');
    assert.ok(
      out.includes('Excluded by standing authority'),
      'macro must name the authority exclusion'
    );
    assert.ok(!out.includes('state-loading'), 'no spinner');
  });

  it('OPTA-04c: all 8 administration tabs render the authorization-required state (D115 DEFERRED)', () => {
    const adminPaths: ReadonlyArray<readonly [string, string]> = [
      [ROUTES.admin, 'Administration'],
      [ROUTES.adminOverview, 'Overview'],
      [ROUTES.adminIdentity, 'Identity & Access'],
      [ROUTES.adminTenancy, 'Tenants'],
      [ROUTES.adminEngines, 'Engines & Certification'],
      [ROUTES.adminPlatform, 'Platform Operations'],
      [ROUTES.adminAudit, 'Audit'],
      [ROUTES.adminData, 'Live Data & Governance'],
      [ROUTES.adminOperations, 'Migration / Workflow / Marketplace'],
    ];
    for (const [path, name] of adminPaths) {
      const out = renderAt(path);
      assert.ok(out.includes('structural-surface-unavailable'), `${name} (${path}) fail-closed`);
      assert.ok(
        out.includes('AUTHORIZATION REQUIRED — D115 DEFERRED'),
        `${name} (${path}) must disclose the deferred authorization tier`
      );
      assert.ok(!out.includes(BI08_ROOT_CLASS), `${name} must not render data`);
      assertNoFabricatedValues(out, `${name} (${path})`);
    }
    // Deep-linked unknown admin subpaths also fail closed (donor /admin/* wildcard restored).
    const wild = renderAt('/admin/anything-else');
    assert.ok(wild.includes('structural-surface-unavailable'), '/admin/* wildcard fails closed');
  });

  it('OPTA-04d: the donor callback route structure renders identity-inactive, never a redirect', () => {
    const out = renderAt(ROUTES.callback);
    assert.ok(out.includes('structural-surface-unavailable'), 'callback is structural');
    assert.ok(out.includes('Identity Callback'), 'callback names its surface');
    assert.ok(
      out.includes('No code exchange, token, session, or redirect is performed'),
      'callback must disclose that it performs nothing'
    );
    assert.ok(!out.includes('state-loading'), 'no spinner — a spinner would imply pending auth');
  });

  it('OPTA-05: no dead links — every navigable nav entry renders its own route', () => {
    // The default offline session is the anonymous VIEWER: the admin-only Administration
    // group is correctly hidden by RBAC (donor behavior preserved), so the viewer render
    // covers every non-admin entry, and an admin-session render covers the Administration
    // subtree.
    const html = renderAt(ROUTES.portfolio);
    const adminSession = { ...ANONYMOUS_SESSION, role: 'admin' as const };
    const adminHtml = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.portfolio] },
        React.createElement(SessionProvider, {
          session: adminSession,
          children: React.createElement(App, {}),
        })
      )
    );

    const items = NAV.flatMap((n) => [n, ...(n.children ?? [])]);
    const navigable = items.filter((i) => i.status !== 'future');
    for (const item of navigable) {
      const inHtml = item.minRole === 'admin' ? adminHtml : html;
      assert.ok(
        inHtml.includes(`href="${item.path}"`),
        `Navigable entry '${item.label}' (${item.path}) must be a link for its role`
      );
    }
    // RBAC preserved: the viewer never sees the Administration links.
    assert.ok(!html.includes('href="/admin"'), 'Administration stays admin-only for viewers');
    const future = items.filter((i) => i.status === 'future');
    for (const item of future) {
      assert.ok(
        !html.includes(`href="${item.path}"`),
        `Future entry '${item.label}' (${item.path}) must NOT be a link`
      );
      assert.ok(
        html.includes(`nav-future-${item.label}`),
        `Future entry '${item.label}' must render its non-navigable marker`
      );
    }
    // Every navigable entry's route renders its OWN surface (not the portfolio fallback).
    const byPath = new Map(
      items
        .filter((i) => i.status !== 'future')
        .map((i) => [i.path, i.label])
    );
    for (const [path, label] of byPath) {
      const out = renderAt(path);
      assert.ok(
        !out.includes(BI08_ROOT_CLASS) || path === '/portfolio',
        `'${label}' (${path}) must not silently fall back to the portfolio surface`
      );
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════
 * PRESERVATION — BI-08 and the four partial surfaces are untouched by the restoration
 * ══════════════════════════════════════════════════════════════════════════════════════ */
describe('Option A: preservation of BI-08 and the partial surfaces', () => {
  it('OPTA-06: /portfolio still renders the certified BI-08 PortfolioWorkspace', () => {
    const out = renderAt(ROUTES.portfolio);
    assert.ok(out.includes(BI08_ROOT_CLASS), 'BI-08 workspace root must render');
    assert.ok(!out.includes('structural-surface-unavailable'), 'portfolio is not a structural surface');
    // Donor structure: the workspace renders for any /portfolio/* path (N+18).
    const sub = renderAt('/portfolio/anything');
    assert.ok(sub.includes(BI08_ROOT_CLASS), '/portfolio/* must render the same workspace');
  });

  it('OPTA-07: the partial surfaces render their authorized components', () => {
    const cases: ReadonlyArray<readonly [string, string, string]> = [
      // WUI-RS-03C: /executive renders the dashboard's honest loading state under static SSR
      // (certified data is delivered over HTTP / SSR provision, never computed in-browser);
      // it must still be the real dashboard surface, never the structural fail-closed page.
      ['/executive', 'data-testid="state-loading"', 'Executive (Certified Dashboard)'],
      ['/research', 'research-unavailable-reason', 'Research (UI03)'],
      ['/intelligence', 'No intelligence data loaded', 'Intelligence (UI04)'],
      // A2 Evidence restoration (superseded): /evidence routes the restored donor Evidence Hub (SSR loading state); UI11 is
      // retained unrouted. It must still never be the structural fail-closed page.
      ['/evidence', 'data-testid="state-loading"', 'Evidence (restored Evidence Hub)'],
    ];
    for (const [path, marker, name] of cases) {
      const out = renderAt(path);
      assert.ok(
        !out.includes('structural-surface-unavailable'),
        `${name} must not be replaced by the structural fail-closed page`
      );
      assert.ok(out.includes(marker), `${name} must render its own surface marker (${marker})`);
    }
  });

  it('OPTA-08: undesignated research children claim NO UISurfaceId (no identity merging)', () => {
    // /research stays UI03_FUNDAMENTAL_ANALYSIS. F-9 separately designates /screener as
    // UI06, so only the remaining structural children are covered by this identity guard.
    for (const p of ['/research/company/Banking', '/research/sector/Banking', '/research/events/Banking', '/research/cross-sector', '/research/macro', '/screener/governed']) {
      const out = renderAt(p);
      for (const id of ['UI05', 'UI06', 'UI12', 'UI13', 'UI03']) {
        assert.ok(!out.includes(id), `${p} must not claim the ${id} surface identity`);
      }
    }
  });

  it('OPTA-09: the shell chrome exposes the donor structural overlays and sign-out entry', () => {
    const html = renderAt(ROUTES.portfolio);
    assert.ok(html.includes('data-testid="palette-trigger"'), 'Global Search trigger renders');
    assert.ok(html.includes('data-testid="notification-trigger"'), 'Notifications trigger renders');
    assert.ok(html.includes('data-testid="notes-trigger"'), 'Notes trigger renders');
    assert.ok(html.includes('data-testid="sign-out"'), 'Sign-out structural entry renders');
    // The offline overlay components exist and are wired to the seams (source-level).
    const shellSrc = readFileSync(join(APP_DIR, 'AppShell.tsx'), 'utf8');
    assert.ok(shellSrc.includes('OfflineCommandPalette'), 'offline palette mounted');
    assert.ok(shellSrc.includes('OfflineNotificationDrawer'), 'offline notifications mounted');
    assert.ok(shellSrc.includes('OfflineNotesDrawer'), 'offline notes mounted');
    assert.ok(shellSrc.includes('SignOutNotice'), 'sign-out notice mounted');
    assert.ok(/key.*'k'/i.test(shellSrc), 'donor Ctrl+K / Cmd+K shortcut re-wired to the offline palette');
  });
});

/* ══════════════════════════════════════════════════════════════════════════════════════
 * OFFLINE BOUNDARY — the excluded runtime tier is not imported anywhere in the shell
 * ══════════════════════════════════════════════════════════════════════════════════════ */
describe('Option A: offline boundary (no server / auth / api / network in the shell)', () => {
  it('OPTA-10: no excluded dependency appears anywhere under frontend/src/app', () => {
    const forbidden: ReadonlyArray<readonly [RegExp, string]> = [
      [/authFetch/, 'authFetch transport'],
      [/[/'"]\/api\//, 'an /api/ path'],
      [/from ['"]\.\.\/api\//, 'an api-layer import'],
      [/core\/auth/, 'the Keycloak auth provider'],
      [/frontend\/server/, 'the server tier'],
      [/\bfetch\(/, 'a network fetch'],
      [/XMLHttpRequest/, 'XMLHttpRequest'],
      [/EventSource/, 'EventSource'],
      [/WebSocket/, 'WebSocket'],
    ];
    for (const file of listFiles(APP_DIR)) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const [re, what] of forbidden) {
        assert.ok(
          !re.test(src),
          `${file} must not contain ${what} — the excluded runtime tier`
        );
      }
    }
  });

  it('OPTA-11: App.tsx does not import unrecovered donor API-coupled feature components', () => {
    const appSrc = stripComments(readFileSync(join(APP_DIR, 'App.tsx'), 'utf8'));
    // PROMPT 2C (governed update): 'CompanyIntelligence' and 'SectorIntelligence' were removed
    // from this exclusion list. Those two surfaces ARE recovered and ARE mounted at
    // /research/company/:id and /research/sector/:id; they read the four current-lineage
    // SNAPSHOT read authorities over HTTP and import no server module into the browser graph
    // (asserted in research_sector_ui_recovery.test.ts). Every other donor component below
    // remains forbidden — this gate recovered nothing else.
    // DECISION MATRIX work item (governed update): 'DecisionMatrix' removed from this list — it
    // IS recovered and mounted at /intelligence/decision-matrix, reading the existing
    // /api/decision-matrix authority over HTTP with no server import (asserted in
    // decision_matrix_restoration.test.ts). Every other donor component remains forbidden.
    const donorComponents = [
      'Administration', 'GovernedSearch',
      // A4 Screener restoration (superseded): 'Screener' removed from this list — it IS recovered
      // and mounted at /screener, reading the existing /api/decision-matrix client over HTTP
      // (asserted in screener_recovery.test.ts). UI06 is retained unrouted.
      'MacroContext', 'Collaboration', 'Reports', 'Watchlists', 'Settings',
      // A2 Evidence restoration (superseded): 'EvidenceExplorer', 'ReplayExplorer' and 'EvidenceHub' removed from this list —
      // they ARE recovered and mounted, reading the existing evidence/replay/decision-matrix
      // clients over HTTP (asserted in evidence_recovery.test.ts).
      // A3 Research Events restoration (superseded): 'ResearchEvents' removed from this list — it IS
      // recovered and mounted, reading the existing evidence/replay/decision-matrix clients over
      // HTTP (asserted in research_events_recovery.test.ts).
      // B1 Cross-Sector restoration (superseded): 'CrossSectorIntelligence' removed from this list — it IS
      // recovered and mounted, reading /api/cross-sector plus the existing evidence/replay clients over
      // HTTP (asserted in cross_sector_recovery.test.ts).
      'ResearchHub', 'IntelligenceHub',
      'CommandPalette', 'NotificationDrawer', 'NotesDrawer',
    ];
    for (const name of donorComponents) {
      assert.ok(
        !new RegExp(`import[^;]*\\b${name}\\b`).test(appSrc),
        `App.tsx must not import the donor component ${name} (API/auth-coupled)`
      );
    }
    // The current BI-08 workspace and the authorized surfaces remain the only feature imports.
    assert.ok(appSrc.includes('features/portfolio/PortfolioWorkspace'), 'BI-08 workspace imported');
    for (const s of ['ExecutiveDashboard', 'ResearchSurface', 'IntelligenceSurface', 'EvidenceSurface']) {
      assert.ok(appSrc.includes(s), `${s} import preserved`);
    }
  });

  it('OPTA-12: BI-08 frozen tree identity is intact (features/portfolio unchanged)', () => {
    // The restoration must not touch the BI-08 authoritative tree. Guard: the workspace
    // import surface is unchanged and the certified root class renders (OPTA-06). The tree
    // hash itself is verified by the git governance checkpoint (report §BI-08 preservation).
    const appSrc = stripComments(readFileSync(join(APP_DIR, 'App.tsx'), 'utf8'));
    assert.ok(
      appSrc.includes("from '../features/portfolio/PortfolioWorkspace.js'"),
      'the BI-08 workspace import path is unchanged'
    );
    assert.ok(
      !appSrc.includes('api/portfolio'),
      'no historical API-coupled portfolio import may return'
    );
  });
});
