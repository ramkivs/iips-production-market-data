/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: Phase-2 Evidence Surface (PATH L — LOCAL VIEW-MODEL / PRESENTATION-ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 *                 Phase-2 Authority Act: `phase2-evidence-presentation-only-2026-09-22-001`
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SUITE PROTECTS ═════════════════════════════════════════════════════════════
 *  1. The surface renders GENUINE governed provenance when supplied — never fabricated.
 *  2. With no payload it renders an HONEST unavailable state and invents no identity.
 *  3. The authority act's PROHIBITIONS hold: no invented provenance, and critically
 *     NO lineageDigest is ever GENERATED (computeLineageHash must not be reachable here).
 *  4. The Path-L boundary holds: no fetch/authFetch/OIDC/Keycloak//api//server.
 *  5. Evidence is navigable at 'partial' and is never silently promoted to 'implemented'.
 *  6. Intelligence and BI-08 are unaffected by this phase.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { EvidenceSurface } from '../frontend/src/features/evidence/EvidenceSurface.js';
import { App } from '../frontend/src/app/App.js';
import { ROUTES } from '../frontend/src/app/routes.js';
import { NAV } from '../frontend/src/app/navigation.js';
import { SessionProvider } from '../frontend/src/core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from '../frontend/src/core/session/session.js';
import type { ExecutiveProvenance } from '../src/transports/types.js';

/** Governed provenance fixture mirroring the certified UI11 contract. */
function governedProvenance(overrides: Partial<ExecutiveProvenance> = {}): ExecutiveProvenance {
  return {
    sourceClassification: 'CERTIFIED_ENGINE',
    asOf: '2026-09-18T10:00:00.000Z',
    evaluatedAt: '2026-09-18T10:00:01.000Z',
    dataVersion: 'v1.0.0',
    lineageDigest: 'fc1c5e8b886c3711e00928df4a7c2d577cc8a44d0da4aa148decacdd12e328fb',
    quality: 'GOOD',
    replayConstraintApplied: false,
    ...overrides,
  };
}

const render = (props: Record<string, unknown>): string =>
  renderToString(React.createElement(EvidenceSurface, props));

describe('Phase-2 Evidence surface — genuine view-model binding', () => {
  const html = render({
    provenance: governedProvenance(),
    companyId: 'EQ_INFY_IN',
    companyName: 'Infosys Limited',
  });

  it('EVID-01: renders the supplied governed D05 identity (never fabricated)', () => {
    assert.ok(html.includes('Infosys Limited'), 'company name must render');
    assert.ok(html.includes('EQ_INFY_IN'), 'canonical D05 companyId must render');
  });

  it('EVID-02: renders the governed lineage digest verbatim', () => {
    assert.ok(
      html.includes('fc1c5e8b886c3711e00928df4a7c2d577cc8a44d0da4aa148decacdd12e328fb'),
      'lineage digest must be surfaced exactly as supplied'
    );
  });

  it('EVID-03: renders the governed source classification', () => {
    assert.ok(html.includes('CERTIFIED_ENGINE'), 'source classification must render');
  });

  it('EVID-04: surfaces the governed quality indicator', () => {
    assert.ok(html.includes('Good Quality'), 'quality label must come from the view model');
  });

  it('EVID-05: renders the NFR-06 masked vendor tier, never a commercial tier', () => {
    assert.ok(html.includes('OFFLINE_BOOTSTRAP'), 'masked vendor tier must render');
    assert.ok(!html.includes('TIER_2_COMMERCIAL'), 'no commercial tier may be presented');
  });

  it('EVID-06: preserves the view model accessibility contract', () => {
    assert.ok(html.includes('ui11-lineage-hash-card'), 'focus element id must render');
    assert.ok(html.includes('aria-live="polite"'), 'aria-live must render');
  });

  it('EVID-07: renders the provenance chain and evidence timeline', () => {
    assert.ok(html.includes('provenance-chain'), 'provenance chain must render');
    assert.ok(html.includes('evidence-timeline'), 'evidence timeline must render');
  });

  it('EVID-08: renders degraded state when provenance quality is degraded', () => {
    const stale = render({
      provenance: governedProvenance({ quality: 'STALE' }),
      companyId: 'EQ_INFY_IN',
      companyName: 'Infosys Limited',
    });
    assert.ok(stale.includes('state-stale'), 'degraded provenance must render the stale state');
  });

  it('EVID-09: renders the AD-17 replay constraint verbatim when present', () => {
    const replay = render({
      provenance: governedProvenance({
        replayConstraintApplied: true,
        replayConstraintText: 'AD17_CONSTRAINT: replay-bounded evaluation',
      }),
      companyId: 'EQ_INFY_IN',
      companyName: 'Infosys Limited',
    });
    assert.ok(replay.includes('AD17_CONSTRAINT'), 'AD-17 text must render verbatim');
  });
});

describe('Phase-2 Evidence surface — fail-closed honesty with no payload', () => {
  const empty = render({});

  it('EVID-10: renders an explicit unavailable state, not fabricated provenance', () => {
    assert.ok(empty.includes('state-unavailable'), 'must render the unavailable state');
    assert.ok(
      empty.includes('No governed provenance record loaded'),
      'must state that no governed provenance is loaded'
    );
  });

  it('EVID-11: invents no company identity when none is supplied', () => {
    assert.ok(!empty.includes('EQ_INFY_IN'), 'no companyId may be fabricated');
    assert.ok(!empty.includes('Infosys'), 'no company name may be fabricated');
  });

  it('EVID-12: emits no lineage digest at all when no governed provenance exists', () => {
    assert.ok(!/[0-9a-f]{64}/.test(empty), 'no SHA-256-shaped value may appear in the empty state');
  });

  it('EVID-13: fails closed when provenance is supplied without governed identity', () => {
    // Partial input must NOT render a half-populated audit with placeholder identity.
    const partial = render({ provenance: governedProvenance() });
    assert.ok(partial.includes('state-unavailable'), 'must fail closed without identity');
    assert.ok(
      !partial.includes('fc1c5e8b886c3711e00928df4a7c2d577cc8a44d0da4aa148decacdd12e328fb'),
      'must not display a lineage digest detached from a governed identity'
    );
  });
});

describe('Phase-2 Evidence surface — authority-act prohibitions', () => {
  const surfacePath = resolve(process.cwd(), 'frontend/src/features/evidence/EvidenceSurface.tsx');
  const source = readFileSync(surfacePath, 'utf8');
  // Strip comments: the governing header names excluded technologies deliberately.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('EVID-14: the surface source is readable (anti-silent-skip guard)', () => {
    assert.ok(existsSync(surfacePath), `surface source must exist at ${surfacePath}`);
    assert.ok(code.length > 500, 'surface source must be non-trivial');
  });

  it('EVID-15: NEVER generates a lineage digest (computeLineageHash unreachable)', () => {
    // The decisive prohibition: a provenance auditor must not mint its own lineage.
    for (const forbidden of ['computeLineageHash', 'computeSha256', 'createHash']) {
      assert.ok(!code.includes(forbidden), `Evidence surface must not call ${forbidden}`);
    }
  });

  it('EVID-16: hard-codes no SHA-256-shaped literal', () => {
    assert.ok(!/[0-9a-f]{64}/.test(code), 'no digest literal may be embedded in the surface');
  });

  it('EVID-17: performs no network access', () => {
    for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('EVID-18: imports no API transport or authentication module', () => {
    for (const forbidden of ['authFetch', 'oidcClient', 'AuthProvider', 'keycloak', 'useAuth']) {
      assert.ok(!code.includes(forbidden), `Path L forbids ${forbidden}`);
    }
  });

  it('EVID-19: references no /api/* endpoint and no server module', () => {
    assert.ok(!code.includes('/api/'), 'no /api/* call site permitted');
    assert.ok(!code.includes('frontend/server'), 'no server dependency permitted');
  });

  it('EVID-20: binds only to the local offline view-model', () => {
    assert.ok(
      code.includes('ui11_provenance_auditor'),
      'surface must bind to the local UI11 view-model builder'
    );
  });
});

describe('Phase-2 Evidence surface — shell integration', () => {
  const routed = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: [ROUTES.evidence] },
      React.createElement(SessionProvider, {
        session: ANONYMOUS_SESSION,
        children: React.createElement(App, {}),
      })
    )
  );

  it('EVID-21: /evidence renders the real surface, not a placeholder', () => {
    // A2 Evidence restoration (superseded): /evidence now routes the restored donor Evidence Hub, which renders its honest
    // loading state under static SSR (data arrives over HTTP). UI11 EvidenceSurface is retained
    // unrouted and remains covered by the component tests above.
    assert.ok(routed.includes('data-testid="state-loading"'), 'restored Evidence Hub must render');
    assert.ok(!routed.includes('structural-surface-unavailable'), '/evidence must not render the structural page');
    assert.ok(
      !routed.includes('This surface is declared in the governed navigation model'),
      '/evidence must no longer render the FeaturePlaceholder'
    );
  });

  it('EVID-22: the route renders inside the shell with chrome intact', () => {
    assert.ok(routed.includes('app-shell'), 'shell must wrap the surface');
    assert.ok(routed.includes('Live Providers: 0 (INACTIVE)'), 'fail-closed disclosure persists');
  });

  it('EVID-23: Evidence is navigable (not a future dead entry)', () => {
    assert.ok(routed.includes('href="/evidence"'), 'Evidence must be a navigable link');
    assert.ok(
      !routed.includes('nav-future-Evidence'),
      'Evidence must no longer render as a non-navigable future marker'
    );
  });

  it('EVID-24: navigation status is partial — honest, not overstated', () => {
    const item = NAV.find((n) => n.label === 'Evidence');
    assert.strictEqual(item?.status, 'partial', "Evidence must be declared 'partial'");
  });

  it('EVID-25: Intelligence is unmodified by this phase', () => {
    const intel = NAV.find((n) => n.label === 'Intelligence');
    assert.strictEqual(intel?.status, 'partial', 'Intelligence must remain partial');
  });

  it('EVID-26: BI-08 portfolio route is unaffected by this phase', () => {
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
