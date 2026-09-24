/**
 * Test Suite: Research & Sector Intelligence — SAFE shared primitives (Prompt 2A)
 *
 * Scope (exactly the three manifest SAFE units — no surface recovered, no route mounted):
 *   S-1  frontend/src/api/dataMode.ts                            (governed mode guards)
 *   S-2  frontend/src/components/state/DataModeUnavailable.tsx   (governed degraded surface)
 *   S-3  frontend/src/components/state/PitVintagePanel.tsx       (governed PIT vintage surface)
 *
 * Authority basis:
 *   `IIPS_RESEARCH_SECTOR_RECOVERY_MANIFEST.md` §5.1 (SAFE TO RECOVER) and §6 (parity evidence),
 *   whose baseline is `fcca6697d422fadf2c4cf9bf8b3fc693731ee9da`.
 *
 * What these tests are, and are not:
 *   · they assert the primitives are PRESENT, NARROW CORRECTLY, and RENDER THE SERVER'S OWN
 *     STRINGS VERBATIM;
 *   · they are NOT a Company/Sector parity claim. The 43/40-key E2E-018 observable parity
 *     (manifest §6) belongs to the surface recovery and is NOT asserted here;
 *   · no market data, no provider, no network, no fixture promoted to product use.
 *
 * Honesty posture (manifest §4.3 / §5.3 E-8): these primitives must never pull node-only
 * modules or a transport into the browser graph. Guards PRIM-12/13 scan the source for it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { isDegraded, isPitVintage, type DegradedData, type PitVintageData } from '../frontend/src/api/dataMode.js';
import { DataModeUnavailable } from '../frontend/src/components/state/DataModeUnavailable.js';
import { PitVintagePanel } from '../frontend/src/components/state/PitVintagePanel.js';

/* ─────────────────────────────────────────────────────────────────────────────────────────
 * Harness payloads — test inputs ONLY. They are shaped from the contracts under test and are
 * never wired to any mounted route by this phase.
 * ───────────────────────────────────────────────────────────────────────────────────────── */

const DEGRADED: DegradedData = {
  surface: 'Company',
  dataMode: 'LIVE',
  state: 'LIVE_UNAVAILABLE',
  dataAvailable: false,
  reason: 'LIVE data is unavailable for this surface.',
  dependency: 'R-2 (provider-neutral market-data foundation)',
  provenance: {
    dataSource: 'governed degraded envelope',
    freshness: 'UNAVAILABLE',
    mode: 'LIVE',
    transportSemantics: 'degraded envelope — carries no market data',
  },
};

const VINTAGE: PitVintageData = {
  surface: 'Company',
  dataMode: 'PIT',
  dataAvailable: true,
  query: { asOf: '2026-06-30T00:00:00.000Z', domain: 'd02.ohlcv', securityId: 'INE002A01018' },
  vintage: {
    found: true,
    requestedAsOf: '2026-06-30T00:00:00.000Z',
    resolvedAsOf: '2026-06-27T00:00:00.000Z', // PS-9: resolved <= requested (backward resolution)
    asOf: '2026-06-27',
    snapshotId: 'snap-d02-20260627',
    provider: 'CM_UDIFF',
    dataVersion: 'v1',
    quality: 'GOOD',
    era: 'CM_UDIFF',
    pitBoundary: '2026-06-27T18:00:00.000Z',
    record: { close: 1495.5, volume: 4210000 },
  },
  provenance: {
    dataSource: 'governed PIT vintage over the D114 corpus',
    freshness: 'PIT',
    mode: 'PIT',
    archiveRef: 'archive://d02/2026-06-27',
    sha256: 'b'.repeat(64),
    sha256ManifestEntry: { entry: 'd02-20260627' },
    acquisitionManifestId: 'acq-2026-06-27',
    intakeLineageDigest: 'digest-abc',
    failureRegisterRef: null,
    corpusId: 'corpus-001',
    certification: 'NONE',
    transportSemantics: 'verbatim server values; no derivation',
  },
};

/* ── S-1 — governed mode guards (frontend/src/api/dataMode.ts) ───────────────────────────── */

describe('Research/Sector primitives — S-1 governed data-mode guards', () => {
  it('PRIM-01: isDegraded narrows a governed degraded response', () => {
    assert.strictEqual(isDegraded(DEGRADED), true);
    assert.strictEqual(isDegraded({ ...DEGRADED, surface: 'Evidence' }), true);
  });

  it('PRIM-02: isDegraded rejects non-degraded shapes (never a permissive truthy check)', () => {
    assert.strictEqual(isDegraded(null), false);
    assert.strictEqual(isDegraded(undefined), false);
    assert.strictEqual(isDegraded('degraded'), false);
    assert.strictEqual(isDegraded(0), false);
    assert.strictEqual(isDegraded([]), false);
    assert.strictEqual(isDegraded({}), false);
    assert.strictEqual(isDegraded({ dataAvailable: true }), false);
    // The certified SNAPSHOT family carries no `dataAvailable: false` discriminant.
    assert.strictEqual(isDegraded({ portfolio: { holdings: 13 } }), false);
  });

  it('PRIM-03: isPitVintage narrows a governed PIT vintage', () => {
    assert.strictEqual(isPitVintage(VINTAGE), true);
  });

  it('PRIM-04: isPitVintage requires the full discriminant (mode AND found)', () => {
    assert.strictEqual(isPitVintage(DEGRADED), false); // degraded family
    assert.strictEqual(isPitVintage({ portfolio: { holdings: 13 } }), false); // SNAPSHOT family
    assert.strictEqual(isPitVintage(null), false);
    assert.strictEqual(isPitVintage({ dataAvailable: true, dataMode: 'PIT', vintage: { found: false } }), false);
    assert.strictEqual(isPitVintage({ dataAvailable: true, dataMode: 'PIT' }), false);
    assert.strictEqual(isPitVintage({ dataAvailable: true, dataMode: 'LIVE', vintage: { found: true } }), false);
  });

  it('PRIM-05: the two families are mutually exclusive and non-overlapping', () => {
    assert.strictEqual(isDegraded(VINTAGE), false);
    assert.strictEqual(isPitVintage(DEGRADED), false);
    // Degraded carries no market data and is always freshness UNAVAILABLE.
    assert.strictEqual(DEGRADED.provenance.freshness, 'UNAVAILABLE');
    assert.strictEqual('portfolio' in DEGRADED, false);
  });
});

/* ── S-2 — governed "data mode unavailable" surface ──────────────────────────────────────── */

describe('Research/Sector primitives — S-2 DataModeUnavailable renders server truth verbatim', () => {
  const html = renderToString(React.createElement(DataModeUnavailable, { data: DEGRADED, title: 'Company' }));

  it('PRIM-06: renders the governed surface with the server mode disclosed', () => {
    assert.ok(html.includes('data-testid="data-mode-unavailable"'), 'surface testid must render');
    assert.ok(html.includes('data-mode-unavailable-mode'), 'mode testid must render');
    assert.ok(html.includes(DEGRADED.dataMode), 'server dataMode must render verbatim');
    assert.ok(html.includes('Company'), 'title must render');
    assert.ok(html.includes('Company unavailable'), 'aria label must be derived from the title');
  });

  it('PRIM-07: renders the server reason, dependency and transport semantics VERBATIM', () => {
    assert.ok(html.includes(DEGRADED.reason), 'server reason must render verbatim');
    assert.ok(html.includes('state-unavailable'), 'must reuse the existing UnavailableState');
    assert.ok(html.includes(DEGRADED.dependency), 'blocking dependency must render verbatim');
    assert.ok(html.includes('Blocking dependency:'), 'dependency must be labelled');
    assert.ok(html.includes(DEGRADED.provenance.transportSemantics), 'transportSemantics must render verbatim');
  });

  it('PRIM-08: fabricates nothing — no metric, table or placeholder shell', () => {
    assert.ok(!html.includes('metric-card'), 'no metric card may be rendered for a degraded response');
    assert.ok(!html.includes('metric-value'), 'no metric value may be rendered');
    assert.ok(!html.includes('data-table'), 'no table may be rendered');
    assert.ok(!/[0-9]+\.[0-9]/.test(html), 'no decimal figure may appear (nothing is invented)');
  });
});

/* ── S-3 — governed PIT vintage surface ──────────────────────────────────────────────────── */

describe('Research/Sector primitives — S-3 PitVintagePanel renders server truth verbatim', () => {
  const html = renderToString(React.createElement(PitVintagePanel, { data: VINTAGE, title: 'Company' }));

  it('PRIM-09: PS-9 — requested AND resolved asOf are BOTH shown, never hidden', () => {
    assert.ok(html.includes('pit-vintage-panel'), 'panel testid must render');
    assert.ok(html.includes('pit-vintage-requested-asof'), 'requested asOf row must render');
    assert.ok(html.includes('pit-vintage-resolved-asof'), 'resolved asOf row must render');
    assert.ok(html.includes(VINTAGE.vintage.requestedAsOf), 'requested instant must appear verbatim');
    assert.ok(html.includes(VINTAGE.vintage.resolvedAsOf), 'resolved instant must appear verbatim');
    assert.notStrictEqual(VINTAGE.vintage.requestedAsOf, VINTAGE.vintage.resolvedAsOf);
    assert.ok(html.includes('PIT'), 'mode must be disclosed as PIT');
  });

  it('PRIM-10: renders era, record and D114 provenance fields verbatim when present', () => {
    assert.ok(html.includes('pit-vintage-era'), 'era must render when present');
    assert.ok(html.includes('CM_UDIFF'), 'era value must render verbatim');
    assert.ok(html.includes('pit-vintage-record'), 'canonical record block must render');
    assert.ok(html.includes('1495.5'), 'record values must render verbatim');
    assert.ok(html.includes(VINTAGE.provenance.archiveRef as string), 'archiveRef must render verbatim');
    assert.ok(html.includes(VINTAGE.provenance.sha256 as string), 'sha256 must render verbatim');
    assert.ok(html.includes(VINTAGE.provenance.corpusId as string), 'corpusId must render verbatim');
    assert.ok(html.includes(VINTAGE.provenance.certification), 'certification line must render verbatim');
    assert.ok(html.includes(VINTAGE.provenance.transportSemantics), 'transportSemantics must render verbatim');
  });

  it('PRIM-11: null provenance fields are OMITTED — never defaulted or fabricated', () => {
    assert.ok(
      !html.includes('pit-vintage-failure-register'),
      'a null field must not render a row (no "—" substitution in the provenance block)',
    );
  });
});

/* ── Browser-graph + network boundary (manifest §4.3 / §5.3 E-8) ─────────────────────────── */

describe('Research/Sector primitives — browser-graph and network boundary', () => {
  // Resolved from the invocation root, matching the established suite convention
  // (cf. shell_research_surface.test.ts:308) — the compiled suite runs from dist/.
  const root = process.cwd();
  const sources: ReadonlyArray<readonly [string, string]> = [
    ['S-1', 'frontend/src/api/dataMode.ts'],
    ['S-2', 'frontend/src/components/state/DataModeUnavailable.tsx'],
    ['S-3', 'frontend/src/components/state/PitVintagePanel.tsx'],
  ];

  it('PRIM-12: no node-only module and no transport is imported into the browser graph', () => {
    for (const [unit, rel] of sources) {
      const src = readFileSync(resolve(root, rel), 'utf8');
      for (const banned of ['node:', 'src/transports', 'iips-platform', 'createRequire', 'readFileSync']) {
        assert.ok(!src.includes(banned), `${unit} (${rel}) must not reference ${banned}`);
      }
    }
  });

  it('PRIM-13: the primitives perform no network or storage I/O of their own', () => {
    for (const [unit, rel] of sources) {
      const src = readFileSync(resolve(root, rel), 'utf8');
      for (const banned of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'localStorage', 'sessionStorage']) {
        assert.ok(!src.includes(banned), `${unit} (${rel}) must not perform ${banned}`);
      }
    }
  });
});
