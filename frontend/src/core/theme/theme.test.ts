/**
 * Program v3.0 — Phase 13-Hardening (A1/A5): semantic-token accessibility regression.
 *
 * Deterministic contrast verification of the amended tokens. No external tooling.
 */
import { describe, it, expect } from 'vitest';
import { themeVariables } from './theme';

function luminance(hex: string): number {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const f = (c: number): number => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '#FFFFFF';
const SURFACE_1 = '#F7F9FB';
const AA = 4.5;

describe('Theme — Phase 13-Hardening token accessibility', () => {
  it('defines --color-accent in both themes (A1)', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(themeVariables(mode)['--color-accent']).toBeTruthy();
    }
  });

  it('light accent supports white text at WCAG AA (A1)', () => {
    const accent = themeVariables('light')['--color-accent'];
    expect(contrast(WHITE, accent)).toBeGreaterThanOrEqual(AA);
  });

  it('light ink-muted meets WCAG AA on white and surface-1 (A5)', () => {
    const muted = themeVariables('light')['--color-ink-muted'];
    expect(contrast(WHITE, muted)).toBeGreaterThanOrEqual(AA);
    expect(contrast(SURFACE_1, muted)).toBeGreaterThanOrEqual(AA);
  });

  it('light warning meets WCAG AA for badge text and as a fill under white text (A5)', () => {
    const warning = themeVariables('light')['--color-status-warning'];
    expect(contrast(WHITE, warning)).toBeGreaterThanOrEqual(AA);
    expect(contrast(SURFACE_1, warning)).toBeGreaterThanOrEqual(AA);
    expect(contrast(warning, WHITE)).toBeGreaterThanOrEqual(AA);
  });

  it('light freshness-stale matches the corrected warning treatment (A5)', () => {
    const stale = themeVariables('light')['--color-freshness-stale'];
    expect(contrast(WHITE, stale)).toBeGreaterThanOrEqual(AA);
    expect(contrast(SURFACE_1, stale)).toBeGreaterThanOrEqual(AA);
  });

  it('dark ink-muted and warning meet WCAG AA on the dark surface (A5)', () => {
    const dark = themeVariables('dark');
    expect(contrast(dark['--color-ink-muted'], dark['--color-surface-0'])).toBeGreaterThanOrEqual(AA);
    expect(contrast(dark['--color-status-warning'], dark['--color-surface-0'])).toBeGreaterThanOrEqual(AA);
  });
});
