/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase-1C Intelligence Surface (PATH L — LOCAL VIEW-MODEL / OFFLINE)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 Phase-1C Authority Designation (RAMKI): Intelligence via Path L
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  1. The Intelligence surface renders GENUINE governed data from the existing, already
 *     tested local view-model `UI04DomainIntelligenceBuilder` — not fabricated content.
 *  2. With no payload it renders an HONEST empty state and invents no company or data.
 *  3. The Path-L boundary holds: no fetch, no authFetch, no OIDC/Keycloak, no /api/*,
 *     no server dependency may enter this surface.
 *  4. The route is reachable through the mounted shell and is NOT a FeaturePlaceholder.
 *  5. The navigation entry stays 'partial' — navigable and honest — and is never silently
 *     promoted to 'implemented' while the offline route has no governed payload.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { IntelligenceSurface } from '../frontend/src/features/intelligence/IntelligenceSurface.js';
import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import type { IntelligenceDTO } from '../src/transports/intelligence_dto.js';

/** Governed fixture mirroring the certified UI04 contract (wse_surfaces_ui01_ui14). */
function governedIntelligence(overrides: Partial<IntelligenceDTO> = {}): IntelligenceDTO {
  return {
    companyId: 'INFY',
    news: {
      newsItems: [
        {
          newsId: 'news-01',
          companyId: 'INFY',
          headline: 'Infosys announces major cloud deal',
          summary: 'Cloud migration partnership signed',
          publishedAt: '2026-09-18T08:00:00.000Z',
          category: 'CORPORATE',
          sentimentScore: 0.65,
          relevanceScore: 0.95,
          sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
          tags: ['CLOUD', 'DEAL'],
        },
      ],
      totalAvailable: 1,
      filteredCount: 1,
      dominantSentiment: 'BULLISH',
      averageSentimentScore: 0.65,
      qualityState: 'GOOD',
    },
    quality: 'GOOD',
    provenance: {
      sourceClassification: 'DERIVED',
      asOf: '2026-09-18T10:00:00.000Z',
      evaluatedAt: '2026-09-18T10:00:01.000Z',
      dataVersion: 'v1.0.0',
      lineageDigest: 'hash5',
      quality: 'GOOD',
      replayConstraintApplied: false,
    },
    ...overrides,
  } as IntelligenceDTO;
}

const renderSurface = (props: Record<string, unknown>): string =>
  renderToString(React.createElement(IntelligenceSurface, props));

describe('Phase-1C Intelligence surface — genuine view-model binding', () => {
  const html = renderSurface({
    intelligence: governedIntelligence(),
    companyName: 'Infosys Limited',
  });

  it('INTEL-01: renders the supplied company identity (never fabricated)', () => {
    assert.ok(html.includes('Infosys Limited'), 'company name must render');
  });

  it('INTEL-02: renders real governed news signals from the view model', () => {
    assert.ok(html.includes('Infosys announces major cloud deal'), 'headline must render');
    assert.ok(html.includes('0.65'), 'sentiment score must render');
  });

  it('INTEL-03: marks official exchange disclosures with the certified badge', () => {
    assert.ok(html.includes('CERTIFIED RESULT'), 'GOVERNED_EXCHANGE_DISCLOSURE must be certified');
  });

  it('INTEL-04: surfaces the governed quality indicator verbatim', () => {
    assert.ok(html.includes('Good Quality'), 'quality label must come from the view model');
  });

  it('INTEL-05: surfaces provenance verbatim (no synthesis)', () => {
    assert.ok(html.includes('DERIVED'), 'source classification must render');
    assert.ok(html.includes('hash5'), 'lineage digest must render');
    assert.ok(html.includes('v1.0.0'), 'data version must render');
  });

  it('INTEL-06: preserves the view model accessibility contract', () => {
    assert.ok(html.includes('ui04-intelligence-feed'), 'focus element id must render');
    assert.ok(html.includes('aria-live="polite"'), 'aria-live must render');
  });

  it('INTEL-07: renders degraded/stale state when the payload is degraded', () => {
    const stale = renderSurface({
      intelligence: governedIntelligence({ quality: 'STALE' } as Partial<IntelligenceDTO>),
      companyName: 'Infosys Limited',
    });
    assert.ok(stale.includes('state-stale'), 'degraded payloads must render the stale state');
  });

  it('INTEL-08: renders the AD-17 replay constraint verbatim when present', () => {
    const replay = renderSurface({
      intelligence: governedIntelligence({
        provenance: {
          sourceClassification: 'DERIVED',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash5',
          quality: 'GOOD',
          replayConstraintApplied: true,
          replayConstraintText: 'AD17_CONSTRAINT: replay-bounded evaluation',
        },
      } as Partial<IntelligenceDTO>),
      companyName: 'Infosys Limited',
    });
    assert.ok(replay.includes('AD17_CONSTRAINT'), 'AD-17 text must render verbatim');
  });
});

describe('Phase-1C Intelligence surface — honesty with no payload', () => {
  const empty = renderSurface({});

  it('INTEL-09: renders an explicit empty state, not fabricated data', () => {
    assert.ok(empty.includes('No intelligence data loaded'), 'must state that no data is loaded');
  });

  it('INTEL-10: invents no company identity when no payload is supplied', () => {
    assert.ok(!empty.includes('INFY'), 'no company identifier may be fabricated');
    assert.ok(!empty.includes('Infosys'), 'no company name may be fabricated');
  });
});

describe('Phase-1C Intelligence surface — Path-L boundary (no network/auth/server)', () => {
  // NOTE: resolve from the repo root, NOT import.meta.url. This suite is compiled to
  // dist/tests/, so a URL relative to the module would point at a non-existent
  // dist/frontend/... path and the whole suite would silently register zero tests.
  const surfacePath = resolve(
    process.cwd(),
    'frontend/src/features/intelligence/IntelligenceSurface.tsx'
  );
  const source = readFileSync(surfacePath, 'utf8');
  // Strip block and line comments: the governing comment block names the excluded
  // technologies deliberately, and must not trip the executable-code assertions.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('INTEL-10b: the surface source is actually readable (anti-silent-skip guard)', () => {
    assert.ok(existsSync(surfacePath), `surface source must exist at ${surfacePath}`);
    assert.ok(code.length > 500, 'surface source must be non-trivial');
  });

  it('INTEL-11: performs no network access', () => {
    for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('INTEL-12: imports no API transport or authentication module', () => {
    for (const forbidden of ['authFetch', 'oidcClient', 'AuthProvider', 'keycloak', 'useAuth']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('INTEL-13: references no /api/* endpoint and no server module', () => {
    assert.ok(!code.includes('/api/'), 'no /api/* call site permitted');
    assert.ok(!code.includes('frontend/server'), 'no server dependency permitted');
  });

  it('INTEL-14: binds only to the local offline view-model', () => {
    assert.ok(
      code.includes('ui04_domain_intelligence'),
      'surface must bind to the local UI04 view-model builder'
    );
  });
});

describe('Phase-1C Intelligence surface — shell integration', () => {
  const routed = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [ROUTES.intelligence] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );

  it('INTEL-15: /intelligence renders the real surface, not a placeholder', () => {
    assert.ok(routed.includes('intelligence-heading'), 'Intelligence surface must render');
    assert.ok(
      !routed.includes('This surface is declared in the governed navigation model'),
      '/intelligence must no longer render the FeaturePlaceholder'
    );
  });

  it('INTEL-16: the route renders inside the shell with chrome intact', () => {
    assert.ok(routed.includes('app-shell'), 'shell must wrap the surface');
    assert.ok(routed.includes('Live Providers: 0 (INACTIVE)'), 'fail-closed disclosure persists');
    assert.ok(routed.includes('NON_PRODUCTION / OFFLINE_FIXTURE'), 'execution mode disclosed');
  });

  it('INTEL-17: Intelligence is navigable (not a future dead entry)', () => {
    assert.ok(routed.includes('href="/intelligence"'), 'Intelligence must be a navigable link');
    assert.ok(
      !routed.includes('nav-future-Intelligence'),
      'Intelligence must no longer render as a non-navigable future marker'
    );
  });

  it('INTEL-18: navigation status is partial — honest, not overstated', () => {
    const item = NAV.find((n) => n.label === 'Intelligence');
    assert.strictEqual(item?.status, 'partial', "Intelligence must be declared 'partial'");
    assert.ok(routed.includes('nav-status-Intelligence'), 'a Partial badge must be displayed');
  });

  it('INTEL-19: BI-08 portfolio route is unaffected by this phase', () => {
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
