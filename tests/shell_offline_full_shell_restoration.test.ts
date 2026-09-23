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
      ['Company', 'Sector', 'Events', 'Cross-Sector', 'Screener', 'Macro'],
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

    // Status census across all 32 items after the bounded F-9 UI06 amendment:
    // 3 implemented, 6 partial, 19 unavailable, 4 future. Only Screener changes
    // unavailable -> partial; totals and every unrelated entry remain unchanged.
    const all = NAV.flatMap((n) => [n, ...(n.children ?? [])]);
    assert.strictEqual(all.length, 32, 'total nav items');
    const census = (s: string): number => all.filter((i) => i.status === s).length;
    assert.strictEqual(census('implemented'), 3, 'implemented: Portfolio + Overview + Security Master (F-3)');
    assert.strictEqual(census('partial'), 6, 'partial: existing 5 + Screener (F-9 UI06 binding)');
    assert.strictEqual(census('unavailable'), 19, 'unavailable: prior 20 less Screener only');
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
    ['/research/company/Banking', 'Company'],
    ['/research/sector/Banking', 'Sector'],
    ['/research/events/Banking', 'Events'],
    ['/research/cross-sector', 'Cross-Sector'],
    ['/intelligence/decision-matrix', 'Decision Matrix'],
    ['/evidence/EQ_INFY_IN', 'Evidence detail'],
    ['/evidence/replay/EQ_INFY_IN', 'Evidence replay'],
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

  it('OPTA-07: the four partial surfaces render THEIR OWN components, not donor substitutes', () => {
    const cases: ReadonlyArray<readonly [string, string, string]> = [
      ['/executive', 'executive-unavailable-reason', 'Executive (UI02)'],
      ['/research', 'research-unavailable-reason', 'Research (UI03)'],
      ['/intelligence', 'No intelligence data loaded', 'Intelligence (UI04)'],
      ['/evidence', 'Cryptographic Lineage', 'Evidence (UI11)'],
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

  it('OPTA-11: App.tsx does not import any donor API-coupled feature component', () => {
    const appSrc = stripComments(readFileSync(join(APP_DIR, 'App.tsx'), 'utf8'));
    const donorComponents = [
      'ExecutiveDashboard', 'DecisionMatrix', 'Administration', 'GovernedSearch',
      'Screener', 'MacroContext', 'Collaboration', 'Reports', 'Watchlists', 'Settings',
      'EvidenceExplorer', 'ReplayExplorer', 'CompanyIntelligence', 'SectorIntelligence',
      'ResearchEvents', 'CrossSectorIntelligence', 'ResearchHub', 'IntelligenceHub',
      'EvidenceHub', 'CommandPalette', 'NotificationDrawer', 'NotesDrawer',
    ];
    for (const name of donorComponents) {
      assert.ok(
        !new RegExp(`import[^;]*\\b${name}\\b`).test(appSrc),
        `App.tsx must not import the donor component ${name} (API/auth-coupled)`
      );
    }
    // The current BI-08 workspace and the four partial surfaces remain the only feature imports.
    assert.ok(appSrc.includes('features/portfolio/PortfolioWorkspace'), 'BI-08 workspace imported');
    for (const s of ['ExecutiveSurface', 'ResearchSurface', 'IntelligenceSurface', 'EvidenceSurface']) {
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
