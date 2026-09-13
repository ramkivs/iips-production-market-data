/**
 * P14-02 — Visual Parity Baseline Establishment Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INT_017_REFERENCE,
  P13_SURFACE_BASELINE,
  buildBaselineManifest,
  validateAgainstBaseline,
} from '../src/visualParityBaseline.js';
import { p14ViewModel } from './helpers.js';

describe('P14-02 Visual Parity Baseline', () => {
  describe('VPB-1: INT-017 reference artifact', () => {
    it('INT-017 is marked as reference only', () => {
      assert.equal(INT_017_REFERENCE.disposition, 'REUSE (reference only)');
      assert.equal(INT_017_REFERENCE.isNewlyCaptured, false);
    });

    it('INT-017 parity rule is documented', () => {
      assert.equal(INT_017_REFERENCE.parityRule, 'Functional parity governs over pixel similarity.');
    });

    it('INT-017 constraint is documented', () => {
      assert.ok(INT_017_REFERENCE.constraint.includes('does not authorize a visual-only rebuild'));
    });
  });

  describe('VPB-3: P13 surface baseline', () => {
    it('all 19 surfaces are defined', () => {
      assert.equal(P13_SURFACE_BASELINE.length, 19);
    });

    it('all surfaces have required properties', () => {
      for (const surface of P13_SURFACE_BASELINE) {
        assert.ok(surface.surfaceId, `surface ${surface.name} missing surfaceId`);
        assert.ok(surface.name, `surface ${surface.surfaceId} missing name`);
        assert.ok(surface.disposition, `surface ${surface.surfaceId} missing disposition`);
        assert.ok(surface.module, `surface ${surface.surfaceId} missing module`);
        assert.ok(surface.builder, `surface ${surface.surfaceId} missing builder`);
        assert.ok(Array.isArray(surface.expectedProperties), `surface ${surface.surfaceId} missing expectedProperties`);
      }
    });

    it('surface IDs cover UI01 through UI19', () => {
      const ids = P13_SURFACE_BASELINE.map(s => s.surfaceId);
      for (let i = 1; i <= 19; i++) {
        const expected = `UI${String(i).padStart(2, '0')}`;
        assert.ok(ids.includes(expected), `missing ${expected}`);
      }
    });

    it('bounded surfaces have boundedCondition documented', () => {
      const bounded = P13_SURFACE_BASELINE.filter(s => s.boundedCondition);
      assert.ok(bounded.length >= 3, 'expected at least 3 bounded surfaces (UI17, UI18, UI19)');
      assert.ok(bounded.some(s => s.surfaceId === 'UI17'));
      assert.ok(bounded.some(s => s.surfaceId === 'UI18'));
      assert.ok(bounded.some(s => s.surfaceId === 'UI19'));
    });
  });

  describe('VPB-6: Baseline manifest', () => {
    it('manifest contains all 19 surfaces', () => {
      const manifest = buildBaselineManifest();
      assert.equal(manifest.totalSurfaces, 19);
      assert.equal(manifest.surfaces.length, 19);
    });

    it('manifest includes INT-017 reference', () => {
      const manifest = buildBaselineManifest();
      assert.ok(manifest.int017Reference);
      assert.equal(manifest.int017Reference.isNewlyCaptured, false);
    });

    it('manifest includes parity rules', () => {
      const manifest = buildBaselineManifest();
      assert.equal(manifest.parityRules.functionalParityOverPixelSimilarity, true);
      assert.equal(manifest.parityRules.referenceScreenshotIsNotOracle, true);
    });
  });

  describe('VPB-7: Baseline validation', () => {
    it('valid view model matches baseline', () => {
      const surfaceDef = P13_SURFACE_BASELINE.find(s => s.surfaceId === 'UI01');
      const vm = p14ViewModel('UI01', {
        data: { key: 'value' },
        classificationDisplay: { label: 'REAL' },
      });
      const result = validateAgainstBaseline(vm, surfaceDef);
      assert.equal(result.valid, true);
    });

    it('missing expected property fails', () => {
      const surfaceDef = P13_SURFACE_BASELINE.find(s => s.surfaceId === 'UI01');
      const vm = { surfaceId: 'UI01' }; // Missing most properties
      const result = validateAgainstBaseline(vm, surfaceDef);
      assert.equal(result.valid, false);
      assert.ok(result.violations.length > 0);
    });
  });
});
