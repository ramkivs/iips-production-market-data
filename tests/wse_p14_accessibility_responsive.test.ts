/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-E Test Suite: P14 Accessibility, Responsive Layouts & Visual Parity
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  AccessibilityEngine,
  ResponsiveEngine,
  RESPONSIVE_BREAKPOINTS,
} from '../src/index.js';

describe('WS-E / P14 Accessibility, Responsive Layouts & Visual Parity', () => {
  it('P14-01: AccessibilityEngine should calculate contrast ratios compliant with WCAG 2.1 AA (>=4.5:1)', () => {
    // High-contrast teal on white
    const resTeal = AccessibilityEngine.checkContrast('#0f766e', '#FFFFFF');
    assert.ok(resTeal.contrastRatio >= 4.5);
    assert.strictEqual(resTeal.passesNormalText, true);

    // High-contrast amber on white
    const resAmber = AccessibilityEngine.checkContrast('#b45309', '#FFFFFF');
    assert.ok(resAmber.contrastRatio >= 4.5);
    assert.strictEqual(resAmber.passesNormalText, true);

    // High-contrast red on white
    const resRed = AccessibilityEngine.checkContrast('#b91c1c', '#FFFFFF');
    assert.ok(resRed.contrastRatio >= 4.5);
    assert.strictEqual(resRed.passesNormalText, true);
  });

  it('P14-02: AccessibilityEngine should generate dual-coded status indicators (non-color-only)', () => {
    const good = AccessibilityEngine.getQualityIndicator('GOOD');
    assert.strictEqual(good.state, 'GOOD');
    assert.strictEqual(good.icon, '✓');
    assert.ok(good.label.length > 0);
    assert.ok(good.ariaText.includes('Good'));

    const stale = AccessibilityEngine.getQualityIndicator('STALE');
    assert.strictEqual(stale.state, 'STALE');
    assert.strictEqual(stale.icon, '⏳');
    assert.ok(stale.isDegraded);

    const partial = AccessibilityEngine.getQualityIndicator('PARTIAL');
    assert.strictEqual(partial.state, 'PARTIAL');
    assert.strictEqual(partial.icon, '⚠');
    assert.ok(partial.isDegraded);

    const unavail = AccessibilityEngine.getQualityIndicator('UNAVAILABLE');
    assert.strictEqual(unavail.state, 'UNAVAILABLE');
    assert.strictEqual(unavail.icon, '✕');
    assert.ok(unavail.isDegraded);
  });

  it('P14-03: AccessibilityEngine should manage modal focus trap and roving tabindex', () => {
    // Focus trap
    const trap = AccessibilityEngine.createFocusTrap(['btn-close', 'input-symbol', 'btn-submit']);
    assert.strictEqual(trap.getFocusedId(), 'btn-close');
    trap.onTab();
    assert.strictEqual(trap.getFocusedId(), 'input-symbol');
    trap.onTab();
    assert.strictEqual(trap.getFocusedId(), 'btn-submit');
    trap.onTab(); // Wrap around
    assert.strictEqual(trap.getFocusedId(), 'btn-close');
    trap.onTab(true); // Shift+Tab backward
    assert.strictEqual(trap.getFocusedId(), 'btn-submit');

    // Roving tabindex
    const roving = AccessibilityEngine.createRovingTabIndex(5);
    assert.strictEqual(roving.getActiveIndex(), 0);
    assert.strictEqual(roving.getTabIndexFor(0), 0);
    assert.strictEqual(roving.getTabIndexFor(1), -1);

    roving.navigate('ArrowRight');
    assert.strictEqual(roving.getActiveIndex(), 1);
    assert.strictEqual(roving.getTabIndexFor(1), 0);
    assert.strictEqual(roving.getTabIndexFor(0), -1);

    roving.navigate('End');
    assert.strictEqual(roving.getActiveIndex(), 4);
    roving.navigate('Home');
    assert.strictEqual(roving.getActiveIndex(), 0);
  });

  it('P14-04: AccessibilityEngine should generate semantic HTML tables with captions and scoped headers', () => {
    const tableHtml = AccessibilityEngine.renderSemanticTable({
      caption: 'Test Financial Metrics',
      headers: ['PE', 'ROE', 'ROCE'],
      rows: [
        { id: 'row-1', rowHeader: 'INFY', cells: ['24.5', '28.5%', '32.0%'] },
        { id: 'row-2', rowHeader: 'TCS', cells: ['28.0', '35.0%', '42.0%'] },
      ],
    });

    assert.ok(tableHtml.includes('<caption>Test Financial Metrics</caption>'));
    assert.ok(tableHtml.includes('<th scope="col" class="iips-table-th">PE</th>'));
    assert.ok(tableHtml.includes('<th scope="row" class="iips-table-rh">INFY</th>'));
    assert.ok(tableHtml.includes('<td class="iips-table-td">28.5%</td>'));
  });

  it('P14-05: ResponsiveEngine should resolve all 4 breakpoint tiers accurately', () => {
    // Mobile: 320–767
    assert.strictEqual(ResponsiveEngine.resolveTier(320).tier, 'MOBILE');
    assert.strictEqual(ResponsiveEngine.resolveTier(767).tier, 'MOBILE');
    assert.strictEqual(ResponsiveEngine.resolveTier(500).columns, 1);
    assert.strictEqual(ResponsiveEngine.resolveTier(500).pinPrimaryColumn, true);

    // Tablet: 768–1023
    assert.strictEqual(ResponsiveEngine.resolveTier(768).tier, 'TABLET');
    assert.strictEqual(ResponsiveEngine.resolveTier(1023).tier, 'TABLET');
    assert.strictEqual(ResponsiveEngine.resolveTier(800).columns, 2);

    // Desktop: 1024–1439
    assert.strictEqual(ResponsiveEngine.resolveTier(1024).tier, 'DESKTOP');
    assert.strictEqual(ResponsiveEngine.resolveTier(1439).tier, 'DESKTOP');
    assert.strictEqual(ResponsiveEngine.resolveTier(1200).columns, 3);

    // Wide / 4K: >= 1440
    assert.strictEqual(ResponsiveEngine.resolveTier(1440).tier, 'WIDE');
    assert.strictEqual(ResponsiveEngine.resolveTier(2560).tier, 'WIDE');
    assert.strictEqual(ResponsiveEngine.resolveTier(1920).columns, 4);
  });

  it('P14-06: ResponsiveEngine should format currency, percentages, and lineage hashes without silent truncation', () => {
    assert.strictEqual(ResponsiveEngine.formatCurrency(1850.5, 'INR'), 'INR 1,850.50');
    assert.strictEqual(ResponsiveEngine.formatPercent(1.12), '+1.12%');
    assert.strictEqual(ResponsiveEngine.formatPercent(-2.45), '-2.45%');

    const testHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
    const mobileFmt = ResponsiveEngine.formatLineageHash(testHash, 'MOBILE');
    assert.strictEqual(mobileFmt.display, 'a1b2c3d4...e5f6a1b2');
    assert.strictEqual(mobileFmt.full, testHash);
    assert.ok(mobileFmt.html.includes(`data-full-hash="${testHash}"`));

    const desktopFmt = ResponsiveEngine.formatLineageHash(testHash, 'DESKTOP');
    assert.strictEqual(desktopFmt.display, testHash);
    assert.strictEqual(desktopFmt.full, testHash);
  });

  it('P14-07: ResponsiveEngine should render responsive tables with pinned left identifier column on mobile', () => {
    const mobileTable = ResponsiveEngine.renderResponsiveTable({
      tier: 'MOBILE',
      caption: 'Mobile Dense Table',
      primaryColumnHeader: 'Symbol',
      otherHeaders: ['LTP', 'Change'],
      rows: [{ primaryId: 'INFY', primaryLabel: 'INFY', values: ['1850.50', '+1.12%'] }],
    });

    assert.ok(mobileTable.includes('iips-has-pinned-col'));
    assert.ok(mobileTable.includes('iips-th-pinned'));
    assert.ok(mobileTable.includes('iips-td-pinned'));

    const desktopTable = ResponsiveEngine.renderResponsiveTable({
      tier: 'DESKTOP',
      caption: 'Desktop Table',
      primaryColumnHeader: 'Symbol',
      otherHeaders: ['LTP', 'Change'],
      rows: [{ primaryId: 'INFY', primaryLabel: 'INFY', values: ['1850.50', '+1.12%'] }],
    });

    assert.ok(!desktopTable.includes('iips-has-pinned-col'));
  });
});
