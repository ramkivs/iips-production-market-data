/**
 * Test Suite: WUI-RS-05D-A — Research/Sector visual parity (status-colour system EXCLUDED).
 *
 * Asserts that Company and Sector Intelligence now use the established System A treatment
 * identified by WUI-RS-05C (`.app-surface*` classes in frontend/src/index.css). Also asserts:
 *   · the loader states render inside the same container;
 *   · the sector selector matches the only other IIPS select (Security Master: UA default +
 *     padding);
 *   · the Sector → Company link uses the Sidebar NavLink ink token.
 *
 * Also asserts what must NOT change:
 *   · ExecutiveDashboard's shared CompanyTrustChain headings render exactly as before;
 *   · AD-17 NOT VERIFIED wording and the AI-deferred state are intact;
 *   · no status/authority/freshness colour token is defined by this gate;
 *   · index.css is not modified by this gate (no new CSS convention).
 *
 * Element/testid parity (Company 43 / Sector 40 captures) is asserted by the existing
 * research_sector_parity suite and is deliberately not duplicated here.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import {
  computeCertifiedCompany,
  computeCertifiedDecisionMatrix,
  computeCertifiedEvidence,
  computeCertifiedReplay,
} from '../frontend/server/research-sector-transport.js';
import { CompanyIntelligence, CompanyIntelligenceView } from '../frontend/src/features/company/CompanyIntelligence.js';
import { SectorIntelligence, SectorIntelligenceView } from '../frontend/src/features/research/SectorIntelligence.js';
import { CompanyTrustChain } from '../frontend/src/features/company/CompanyTrustChain.js';

const ROOT = process.cwd();
const SECTORS = computeCertifiedDecisionMatrix().companies;
const render = (el: React.ReactElement): string => renderToString(React.createElement(MemoryRouter, null, el));
// Certified payloads type `verdict` as string; the views narrow it (same approach as the parity suite).
const props = (sector: string): any => ({
  company: computeCertifiedCompany(sector),
  evidence: computeCertifiedEvidence(sector),
  replay: computeCertifiedReplay(sector),
  sectors: SECTORS,
  sectorsError: null,
  selectedSector: sector,
  onSelectSector: () => {},
});
const sectorHtml = render(React.createElement(SectorIntelligenceView, props('Banking')));
const companyHtml = render(React.createElement(CompanyIntelligenceView, props('Banking')));
const SUBTITLE = 'class="app-surface__block app-surface__subtitle"';

describe('WUI-RS-05D-A — page container, header, headings, footer', () => {
  it('VP-01: both views render inside the established .app-surface container', () => {
    assert.match(sectorHtml, /^<section class="app-surface" aria-label="Sector information">/);
    assert.match(companyHtml, /^<section class="app-surface" aria-label="Company intelligence">/);
  });

  it('VP-02: loader states render inside the same container (loading branch, SSR)', () => {
    for (const C of [SectorIntelligence, CompanyIntelligence]) {
      const html = render(React.createElement(C));
      assert.match(html, /^<div class="app-surface"><div data-testid="state-loading"/, 'loading state is contained');
    }
  });

  it('VP-03: header uses app-surface__header / __title / __meta; decision row wraps', () => {
    for (const html of [sectorHtml, companyHtml]) {
      assert.match(html, /<header[^>]*class="app-surface__header"/);
      assert.match(html, /<h1 class="app-surface__title" style="margin:0">/);
      assert.match(html, /flex-wrap:wrap"><span data-testid="decision-badge-/);
      assert.strictEqual(html.includes('font-size:24px'), false, 'no inline 24px title remains');
    }
    assert.match(sectorHtml, /<p class="app-surface__meta" style="margin:8px 0 0">Engine:/);
  });

  it('VP-04: every section heading uses the established subtitle treatment (no inline 18px)', () => {
    assert.strictEqual((sectorHtml.match(new RegExp(SUBTITLE, 'g')) ?? []).length, 4, 'Sector: 4 section headings');
    assert.strictEqual((companyHtml.match(new RegExp(SUBTITLE, 'g')) ?? []).length, 5, 'Company: 2 own + 3 trust-chain');
    for (const html of [sectorHtml, companyHtml]) {
      assert.strictEqual(html.includes('font-size:18px'), false, 'no inline 18px heading remains');
      assert.match(html, /<h2 class="app-surface__subtitle" style="margin:0">AI Explanation<\/h2>/);
    }
  });

  it('VP-05: provenance footers use app-surface__provenance', () => {
    assert.match(sectorHtml, /<p data-testid="sector-provenance" class="app-surface__provenance">/);
    assert.match(companyHtml, /<p data-testid="company-provenance" class="app-surface__provenance">/);
  });
});

describe('WUI-RS-05D-A — selector, link, evidence summary, radius', () => {
  it('VP-06: the selector matches the Security Master select (UA default + padding only)', () => {
    for (const html of [sectorHtml, companyHtml]) {
      const select = html.match(/<select[^>]*>/)?.[0] ?? '';
      assert.match(select, /style="padding:4px 8px"/);
      assert.strictEqual(/background|border/.test(select), false, 'no partial dark override remains');
    }
  });

  it('VP-07: the Sector → Company link uses the Sidebar NavLink ink token', () => {
    assert.match(sectorHtml, /<a[^>]*data-testid="sector-company-link"[^>]*style="color:var\(--color-ink-secondary\)"/);
  });

  it('VP-08: Sector evidence summary uses app-surface__meta / __note on the existing elements', () => {
    assert.match(sectorHtml, /data-testid="sector-supporting-scores" class="app-surface__meta"/);
    // No certified sector currently applies decision rules, so the rules element is not rendered;
    // its treatment is asserted on the source element instead.
    const src = readFileSync(resolve(ROOT, 'frontend/src/features/research/SectorIntelligence.tsx'), 'utf8');
    assert.match(src, /data-testid="sector-rules-applied" className="app-surface__note"/);
  });

  it('VP-09: target-owned radius literals use the scoped radius token', () => {
    for (const f of ['frontend/src/features/research/SectorIntelligence.tsx', 'frontend/src/features/company/CompanyIntelligence.tsx']) {
      const src = readFileSync(resolve(ROOT, f), 'utf8');
      assert.strictEqual(/borderRadius: [0-9]/.test(src), false, `${f}: no literal radius remains`);
    }
  });
});

describe('WUI-RS-05D-A — frozen semantics and exclusions', () => {
  it('VP-10: ExecutiveDashboard trust-chain headings render exactly as before (no headingClassName)', () => {
    const chainProps: any = { evidence: computeCertifiedEvidence('Banking'), replay: computeCertifiedReplay('Banking') };
    const html = renderToString(React.createElement(CompanyTrustChain, chainProps));
    assert.strictEqual((html.match(/<h2 style="font-size:18px;margin-top:24px">/g) ?? []).length, 3);
    assert.strictEqual(html.includes('app-surface'), false);
  });

  it('VP-11: AD-17 NOT VERIFIED and AI-deferred semantics are intact', () => {
    assert.match(companyHtml, /Reported byteIdentical: <code>true<\/code> — NOT VERIFIED/);
    for (const html of [sectorHtml, companyHtml]) {
      assert.match(html, /data-testid="ad17-disclosure"/);
      assert.match(html, /AI explanation deferred by authority/);
    }
  });

  it('VP-12: the status-colour system is not implemented by this gate (no token defined, index.css untouched)', () => {
    const css = readFileSync(resolve(ROOT, 'frontend/src/index.css'), 'utf8');
    for (const family of ['--color-status-', '--color-authority-', '--color-freshness-', '--elev-']) {
      assert.strictEqual(new RegExp(`^\\s*${family}[a-z-]+\\s*:`, 'm').test(css), false, `${family}* must not be defined in 05D-A`);
    }
    const main = readFileSync(resolve(ROOT, 'frontend/src/main.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.strictEqual(/applyTheme\(/.test(main), false, 'theme activation remains excluded');
  });
});
