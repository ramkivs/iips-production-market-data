/**
 * P14-05 — Browser Compatibility Qualification Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBrowserAgnostic,
  validateAllSurfacesBrowserAgnostic,
  generateBrowserReport,
  BROWSER_MATRIX,
  RESPONSIVE_BREAKPOINTS,
} from '../src/browserCompatibility.js';
import { p14ViewModel, buildAllSurfaceViewModels } from './helpers.js';

describe('P14-05 Browser Compatibility Qualification', () => {
  describe('BCQ-5: Browser matrix', () => {
    it('matrix includes primary browsers', () => {
      const primary = BROWSER_MATRIX.filter(b => b.priority === 'primary');
      assert.ok(primary.length >= 3, 'expected at least 3 primary browsers');
      assert.ok(primary.some(b => b.browser === 'Chrome'));
      assert.ok(primary.some(b => b.browser === 'Firefox'));
      assert.ok(primary.some(b => b.browser === 'Safari'));
    });

    it('no browser is marked as tested (runtime testing not performed)', () => {
      for (const browser of BROWSER_MATRIX) {
        assert.equal(browser.tested, false, `${browser.browser} should not be marked as tested`);
      }
    });

    it('all browsers are testable at view model level', () => {
      for (const browser of BROWSER_MATRIX) {
        assert.equal(browser.testableAtViewModelLevel, true);
      }
    });
  });

  describe('BCQ-6: Responsive breakpoints', () => {
    it('breakpoints cover mobile through wide', () => {
      const names = RESPONSIVE_BREAKPOINTS.map(b => b.name);
      assert.ok(names.includes('mobile'));
      assert.ok(names.includes('tablet'));
      assert.ok(names.includes('desktop'));
      assert.ok(names.includes('wide'));
    });

    it('no breakpoint is marked as tested', () => {
      for (const bp of RESPONSIVE_BREAKPOINTS) {
        assert.equal(bp.tested, false);
      }
    });
  });

  describe('BCQ-7: Browser-agnostic validation', () => {
    it('valid view model is browser-agnostic', () => {
      const vm = p14ViewModel('UI01');
      const result = validateBrowserAgnostic(vm, 'UI01');
      assert.equal(result.valid, true);
    });

    it('view model with function property fails', () => {
      const vm = p14ViewModel('UI01');
      vm.onClick = () => {}; // Function property
      const result = validateBrowserAgnostic(vm, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('function')));
    });

    it('null view model fails', () => {
      const result = validateBrowserAgnostic(null, 'UI01');
      assert.equal(result.valid, false);
    });

    it('JSON-serializable view model passes', () => {
      const vm = p14ViewModel('UI01');
      const json = JSON.stringify(vm);
      assert.ok(json);
      const parsed = JSON.parse(json);
      assert.equal(typeof parsed, 'object');
    });
  });

  describe('BCQ-10: All surfaces browser-agnostic', () => {
    it('all 19 surfaces pass browser-agnostic validation', () => {
      const surfaces = buildAllSurfaceViewModels();
      const result = validateAllSurfacesBrowserAgnostic(surfaces);
      assert.equal(result.total, 19);
      assert.equal(result.passed, 19);
      assert.equal(result.failed, 0);
    });
  });

  describe('BCQ-11: Browser report', () => {
    it('report has correct structure', () => {
      const surfaces = buildAllSurfaceViewModels();
      const valResult = validateAllSurfacesBrowserAgnostic(surfaces);
      const report = generateBrowserReport(valResult);
      assert.ok(report.browserMatrix);
      assert.ok(report.responsiveBreakpoints);
      assert.equal(report.runtimeTesting.status, 'NOT PERFORMED');
      assert.equal(report.claims.viewModelAgnostic, true);
      assert.equal(report.claims.runtimeBrowserTested, false);
      assert.equal(report.claims.responsiveTested, false);
    });
  });
});
