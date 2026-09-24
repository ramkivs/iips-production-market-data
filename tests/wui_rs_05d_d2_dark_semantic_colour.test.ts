/**
 * Test Suite: WUI-RS-05D-D2 — dark-runtime semantic colour implementation
 * (authority: docs/WUI_RS_05D_D1_DARK_SEMANTIC_COLOUR_AUTHORITY.md).
 *
 * Deterministic, offline. Reads the implemented values from frontend/src/index.css (never a
 * copy) and asserts the D1 constraints:
 *   DS-01 all 14 authorized variables exist, only in the .app-shell token block
 *   DS-02 none is declared at :root (or in any other rule / stylesheet)
 *   DS-03 applyTheme() remains un-invoked
 *   DS-04 elevation/shadow variables remain undefined
 *   DS-05 WCAG 2.x contrast is computed from the implemented values
 *   DS-06 every value ≥ 4.5:1 on every dark shell surface (#020617 / #0F172A / #1E293B)
 *   DS-07 Snapshot (and the informational family) remain blue
 *   DS-08 Watch remains amber/warning in the shared verdict + status badges
 *   DS-09 status labels remain text-semantic (symbol + label, colour never sole carrier)
 *   DS-10 no historical LIGHT value is copied into the dark runtime
 *   DS-11 neutral is explicitly selected (not #5A6672) and distinct from ink and AI
 *   DS-12 meaning families preserved (shared value per family, per D1 §4)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { CertifiedBadge, AiBadge, PlatformBadge, FreshnessBadge, StatusBadge } from '../frontend/src/components/ui/Badges.js';
import { DecisionBadge } from '../frontend/src/components/decision/DecisionComponents.js';

const ROOT = process.cwd();
const CSS_RAW = readFileSync(resolve(ROOT, 'frontend/src/index.css'), 'utf8');
const CSS = CSS_RAW.replace(/\/\*[\s\S]*?\*\//g, '');

const AUTHORIZED = [
  '--color-status-positive', '--color-status-negative', '--color-status-neutral',
  '--color-status-warning', '--color-status-critical', '--color-status-informational',
  '--color-authority-certified', '--color-authority-ai', '--color-authority-platform',
  '--color-freshness-live', '--color-freshness-snapshot', '--color-freshness-stale',
  '--color-freshness-unavailable', '--color-freshness-replay',
] as const;

const REQUIRED_SURFACES = ['#020617', '#0F172A', '#1E293B'] as const;
const HISTORICAL_LIGHT = ['#1E7A46', '#B3261E', '#5A6672', '#965C00', '#B26A00', '#1F6FEB'];

/** The token block = the rule whose selector is exactly `.app-shell` and which declares custom properties. */
function tokenBlock(): Record<string, string> {
  const rules = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
    ([, sel, body]) => sel.trim() === '.app-shell' && /--color-[a-z0-9-]+\s*:/.test(body),
  );
  assert.strictEqual(rules.length, 1, 'exactly one .app-shell token block');
  const out: Record<string, string> = {};
  for (const m of rules[0][2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const TOKENS = tokenBlock();

function lum(hex: string): number {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function hsl(hex: string): { h: number; s: number; l: number } {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue *= 60;
  return { h: hue, s, l };
}
const v = (name: string): string => {
  const val = TOKENS[name];
  assert.match(val ?? '', /^#[0-9A-Fa-f]{6}$/, `${name} must be a 6-digit hex literal`);
  return val.toUpperCase();
};

describe('WUI-RS-05D-D2 — dark semantic colour system (.app-shell)', () => {
  it('DS-01: all 14 authorized variables are defined in the .app-shell token block', () => {
    for (const name of AUTHORIZED) assert.ok(name in TOKENS, `${name} missing from .app-shell`);
    const extra = Object.keys(TOKENS).filter((k) => /^--color-(status|authority|freshness)-/.test(k) && !(AUTHORIZED as readonly string[]).includes(k));
    assert.deepStrictEqual(extra, [], 'no unauthorized semantic variable');
  });

  it('DS-02: none is declared at :root, in any other rule, or in any other stylesheet', () => {
    for (const [, sel, body] of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/--color-(status|authority|freshness)-/.test(body)) assert.strictEqual(sel.trim(), '.app-shell');
    }
    assert.strictEqual(/:root\s*\{[^}]*--color-/.test(CSS), false, 'no :root colour tokens');
    for (const name of AUTHORIZED) {
      assert.strictEqual(CSS.split(`${name}:`).length - 1, 1, `${name} defined exactly once`);
    }
    const cssFiles: string[] = [];
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.css')) cssFiles.push(p);
      }
    };
    walk(resolve(ROOT, 'frontend/src'));
    for (const f of cssFiles.filter((p) => !p.endsWith(join('src', 'index.css')))) {
      assert.strictEqual(/--color-(status|authority|freshness)-[a-z-]+\s*:/.test(readFileSync(f, 'utf8')), false, `${f} must not define semantic colours`);
    }
  });

  it('DS-03: applyTheme() remains un-invoked (dark shell retained, D1 D-1)', () => {
    const main = readFileSync(resolve(ROOT, 'frontend/src/main.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.strictEqual(/applyTheme/.test(main), false);
    const app = readFileSync(resolve(ROOT, 'frontend/src/app/App.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.strictEqual(/applyTheme\(/.test(app), false);
  });

  it('DS-04: elevation/shadow variables remain undefined (D1 §11)', () => {
    assert.strictEqual(/--elev-[a-z0-9-]*\s*:/.test(CSS), false);
    assert.strictEqual(Object.keys(TOKENS).some((k) => k.startsWith('--elev')), false);
  });

  it('DS-05: the required surfaces are the actual shell surfaces and contrast arithmetic is WCAG-correct', () => {
    assert.strictEqual(v('--color-surface-0'), '#020617');
    assert.strictEqual(v('--color-surface-1'), '#0F172A');
    assert.strictEqual(v('--color-surface-2'), '#1E293B');
    assert.strictEqual(Math.round(contrast('#000000', '#FFFFFF') * 100) / 100, 21);
    assert.strictEqual(Math.round(contrast('#1F6FEB', '#FFFFFF') * 100) / 100, 4.63); // Phase-13 A1 reference figure
  });

  it('DS-06: every semantic value is ≥ 4.5:1 on every dark shell surface', () => {
    for (const name of AUTHORIZED) {
      for (const bg of REQUIRED_SURFACES) {
        const r = contrast(v(name), bg);
        assert.ok(r >= 4.5, `${name} ${v(name)} on ${bg} = ${r.toFixed(2)}:1 (< 4.5)`);
      }
    }
  });

  it('DS-07: Snapshot (and informational/platform) remain blue', () => {
    for (const name of ['--color-freshness-snapshot', '--color-status-informational', '--color-authority-platform']) {
      const { h, s } = hsl(v(name));
      assert.ok(h >= 190 && h <= 250 && s >= 0.4, `${name} ${v(name)} not blue (h=${h.toFixed(0)}, s=${s.toFixed(2)})`);
    }
  });

  it('DS-08: Watch remains amber/warning in shared verdict and status badges', () => {
    const { h, s } = hsl(v('--color-status-warning'));
    assert.ok(h >= 25 && h <= 55 && s >= 0.4, `warning ${v('--color-status-warning')} not amber`);
    assert.strictEqual(v('--color-freshness-stale'), v('--color-status-warning'));
    const watch = renderToString(React.createElement(DecisionBadge, { verdict: 'Watch' }));
    assert.match(watch, /var\(--color-status-warning\)/);
    assert.doesNotMatch(watch, /--color-accent|--color-status-informational/);
    const warn = renderToString(React.createElement(StatusBadge, { status: 'warning', label: 'override' }));
    assert.match(warn, /var\(--color-status-warning\)/);
  });

  it('DS-09: status labels remain text-semantic (symbol + label + colour)', () => {
    const cases: Array<[React.ReactElement, RegExp]> = [
      [React.createElement(CertifiedBadge), /✓[\s\S]*CERTIFIED RESULT/],
      [React.createElement(AiBadge), /✦[\s\S]*AI EXPLANATION/],
      [React.createElement(PlatformBadge), /◇[\s\S]*PLATFORM/],
      [React.createElement(FreshnessBadge, { state: 'snapshot' }), /□[\s\S]*SNAPSHOT/],
      [React.createElement(FreshnessBadge, { state: 'live' }), /●[\s\S]*LIVE/],
      [React.createElement(FreshnessBadge, { state: 'stale' }), /▲[\s\S]*STALE/],
      [React.createElement(FreshnessBadge, { state: 'unavailable' }), /✕[\s\S]*UNAVAILABLE/],
      [React.createElement(FreshnessBadge, { state: 'replay' }), /↻[\s\S]*REPLAY/],
      [React.createElement(DecisionBadge, { verdict: 'Watch' }), /![\s\S]*Watch/],
      [React.createElement(DecisionBadge, { verdict: 'Avoid' }), /▼[\s\S]*Avoid/],
      [React.createElement(DecisionBadge, { verdict: 'Buy' }), /▲[\s\S]*Buy/],
      [React.createElement(DecisionBadge, { verdict: 'Hold' }), /•[\s\S]*Hold/],
    ];
    for (const [el, re] of cases) assert.match(renderToString(el), re);
  });

  it('DS-10: no historical LIGHT value is copied into the dark runtime (and each would fail there)', () => {
    for (const name of AUTHORIZED) assert.ok(!HISTORICAL_LIGHT.includes(v(name)), `${name} copies a historical light value`);
    for (const light of HISTORICAL_LIGHT) {
      assert.ok(contrast(light, '#0F172A') < 4.5, `${light} expected sub-AA on the dark badge surface`);
    }
  });

  it('DS-11: neutral is an explicit dark selection, distinct from ordinary text and from AI', () => {
    const neutral = v('--color-status-neutral');
    assert.notStrictEqual(neutral, '#5A6672');
    assert.notStrictEqual(neutral, v('--color-ink'));
    assert.notStrictEqual(neutral, v('--color-authority-ai'));
    assert.ok(hsl(neutral).s < 0.3, 'neutral stays in the grey (non-chromatic) family');
    assert.ok(contrast(neutral, v('--color-ink')) >= 1.5, 'neutral distinguishable from ordinary text');
    assert.ok(contrast(neutral, v('--color-authority-ai')) >= 1.5, 'neutral distinguishable from AI');
  });

  it('DS-12: meaning families share one value each (D1 §4)', () => {
    const fam = (names: string[]): void => { const set = new Set(names.map(v)); assert.strictEqual(set.size, 1, names.join(',')); };
    fam(['--color-authority-certified', '--color-status-positive', '--color-freshness-live']);
    fam(['--color-freshness-snapshot', '--color-status-informational', '--color-authority-platform']);
    fam(['--color-status-warning', '--color-freshness-stale']);
    fam(['--color-status-negative', '--color-status-critical', '--color-freshness-unavailable']);
    // Replay: grey family (frozen token-file lineage), shared with AI per the theme.ts DARK lineage.
    assert.strictEqual(v('--color-freshness-replay'), v('--color-authority-ai'));
    const g = hsl(v('--color-status-positive')); assert.ok(g.h >= 90 && g.h <= 170, 'positive green');
    const r = hsl(v('--color-status-negative')); assert.ok(r.h <= 20 || r.h >= 340, 'negative red');
  });
});
