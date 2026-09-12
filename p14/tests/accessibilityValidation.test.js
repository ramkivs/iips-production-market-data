/**
 * P14-04 — Accessibility Conformance Validation Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAccessibilityMetadata,
  validateAllSurfacesAccessibility,
  WCAG_21_AA_VIEW_MODEL_CRITERIA,
  REQUIRED_A11Y_METADATA,
} from '../src/accessibilityValidation.js';
import { p14ViewModel, buildAllSurfaceViewModels } from './helpers.js';

describe('P14-04 Accessibility Conformance Validation', () => {
  describe('ACV-3: Accessibility metadata', () => {
    it('valid view model passes accessibility check', () => {
      const vm = p14ViewModel('UI01');
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, true);
    });

    it('missing a11y object fails', () => {
      const vm = { surfaceId: 'UI01', provenance: {} };
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('a11y')));
    });

    it('missing a11y.role fails', () => {
      const vm = p14ViewModel('UI01');
      vm.a11y = { label: 'test', description: 'test' }; // Missing role
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('role')));
    });

    it('missing a11y.label fails', () => {
      const vm = p14ViewModel('UI01');
      vm.a11y = { role: 'region', description: 'test' }; // Missing label
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('label')));
    });
  });

  describe('ACV-6: WCAG 2.1 AA criteria', () => {
    it('all criteria are applicable to view models', () => {
      for (const criterion of WCAG_21_AA_VIEW_MODEL_CRITERIA) {
        assert.equal(criterion.applicableToViewModels, true);
        assert.ok(criterion.id, 'criterion missing id');
        assert.ok(criterion.name, 'criterion missing name');
        assert.ok(criterion.level, 'criterion missing level');
      }
    });

    it('criteria include A and AA levels', () => {
      const levels = [...new Set(WCAG_21_AA_VIEW_MODEL_CRITERIA.map(c => c.level))];
      assert.ok(levels.includes('A'));
      assert.ok(levels.includes('AA'));
    });
  });

  describe('ACV-8: Required a11y metadata', () => {
    it('required metadata includes role and label', () => {
      assert.ok(REQUIRED_A11Y_METADATA.includes('role'));
      assert.ok(REQUIRED_A11Y_METADATA.includes('label'));
    });
  });

  describe('ACV-10: All surfaces accessibility', () => {
    it('all 19 surfaces pass accessibility validation', () => {
      const surfaces = buildAllSurfaceViewModels();
      const result = validateAllSurfacesAccessibility(surfaces);
      assert.equal(result.total, 19);
      assert.equal(result.passed, 19);
      assert.equal(result.failed, 0);
    });
  });

  describe('Degradation accessibility', () => {
    it('degradation display with a11yLabel passes', () => {
      const vm = p14ViewModel('UI01');
      vm.degradationDisplay = {
        label: 'Current',
        severity: 'normal',
        a11yLabel: 'Data quality: Current',
      };
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, true);
    });

    it('degradation display without a11yLabel fails', () => {
      const vm = p14ViewModel('UI01');
      vm.degradationDisplay = { label: 'Current', severity: 'normal' }; // Missing a11yLabel
      const result = validateAccessibilityMetadata(vm, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('degradation')));
    });
  });
});
