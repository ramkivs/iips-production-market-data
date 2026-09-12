/**
 * P14-01 — Provenance Integrity Validation Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProvenanceIntegrity,
  validateDegradationVisibility,
  validateClassificationLabelling,
  validateAllSurfaces,
  REQUIRED_PROVENANCE_FIELDS,
  VALID_CLASSIFICATIONS,
} from '../src/provenanceIntegrity.js';
import { p14Provenance, p14ViewModel, p14DegradedViewModel, buildAllSurfaceViewModels } from './helpers.js';

describe('P14-01 Provenance Integrity Validation', () => {
  describe('PI-1: Required provenance fields', () => {
    it('valid provenance passes all field checks', () => {
      const prov = p14Provenance();
      const result = validateProvenanceIntegrity(prov, 'UI01');
      assert.equal(result.valid, true);
      assert.equal(result.violations.length, 0);
    });

    it('missing dataSource fails', () => {
      const prov = p14Provenance();
      // Create a new object with dataSource set to null (can't delete from frozen)
      const modified = { ...prov, dataSource: null };
      const result = validateProvenanceIntegrity(modified, 'UI01');
      assert.equal(result.valid, false);
    });

    it('null provenance fails', () => {
      const result = validateProvenanceIntegrity(null, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('PI-2')));
    });

    it('required fields list is complete', () => {
      assert.ok(REQUIRED_PROVENANCE_FIELDS.includes('dataSource'));
      assert.ok(REQUIRED_PROVENANCE_FIELDS.includes('asOf'));
      assert.ok(REQUIRED_PROVENANCE_FIELDS.includes('classification'));
      assert.ok(REQUIRED_PROVENANCE_FIELDS.includes('quality'));
      assert.ok(REQUIRED_PROVENANCE_FIELDS.includes('mode'));
    });
  });

  describe('PI-2: No fabricated provenance', () => {
    it('literal dataSource is flagged as fabricated', () => {
      const prov = p14Provenance();
      const result = validateProvenanceIntegrity({ ...prov, dataSource: 'literal' }, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('fabricated')));
    });

    it('empty dataSource is flagged as fabricated', () => {
      const prov = p14Provenance();
      const result = validateProvenanceIntegrity({ ...prov, dataSource: '' }, 'UI01');
      assert.equal(result.valid, false);
    });

    it('governed descriptor passes', () => {
      const prov = p14Provenance({ dataSource: 'governed:D03' });
      const result = validateProvenanceIntegrity(prov, 'UI01');
      assert.equal(result.valid, true);
    });
  });

  describe('PI-4: Classification in closed set', () => {
    it('all valid classifications pass', () => {
      for (const classification of VALID_CLASSIFICATIONS) {
        const prov = p14Provenance({ classification });
        const result = validateProvenanceIntegrity(prov, 'UI01');
        assert.equal(result.valid, true, `classification ${classification} should pass`);
      }
    });

    it('invalid classification fails', () => {
      const prov = p14Provenance();
      const result = validateProvenanceIntegrity({ ...prov, classification: 'INVENTED' }, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('PI-4')));
    });
  });

  describe('PI-6: Explicit mode', () => {
    it('SNAPSHOT mode passes', () => {
      const prov = p14Provenance({ mode: 'SNAPSHOT' });
      const result = validateProvenanceIntegrity(prov, 'UI01');
      assert.equal(result.valid, true);
    });

    it('LIVE mode passes', () => {
      const prov = p14Provenance({ mode: 'LIVE' });
      const result = validateProvenanceIntegrity(prov, 'UI01');
      assert.equal(result.valid, true);
    });

    it('PIT mode passes', () => {
      const prov = p14Provenance({ mode: 'PIT' });
      const result = validateProvenanceIntegrity(prov, 'UI01');
      assert.equal(result.valid, true);
    });

    it('invalid mode fails', () => {
      const prov = p14Provenance();
      const result = validateProvenanceIntegrity({ ...prov, mode: 'MIXED' }, 'UI01');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('PI-6')));
    });
  });

  describe('PI-3: Degradation visibility', () => {
    it('good quality has normal severity', () => {
      const vm = p14ViewModel('UI01');
      const result = validateDegradationVisibility(vm, 'UI01');
      assert.equal(result.valid, true);
    });

    it('stale quality has warning degradation display', () => {
      const vm = p14DegradedViewModel('UI01', 'stale');
      const result = validateDegradationVisibility(vm, 'UI01');
      assert.equal(result.valid, true);
      assert.ok(vm.degradationDisplay.severity === 'warning');
    });

    it('null view model fails', () => {
      const result = validateDegradationVisibility(null, 'UI01');
      assert.equal(result.valid, false);
    });
  });

  describe('PI-4: Classification labelling', () => {
    it('REAL classification has display label', () => {
      const vm = p14ViewModel('UI01');
      const result = validateClassificationLabelling(vm, 'UI01');
      assert.equal(result.valid, true);
    });

    it('SYNTHESIZED content without label fails', () => {
      const vm = p14ViewModel('UI19', { synthesizedContent: true });
      const result = validateClassificationLabelling(vm, 'UI19');
      assert.equal(result.valid, false);
      assert.ok(result.violations.some(v => v.includes('SYNTHESIZED')));
    });

    it('SYNTHESIZED content with label passes', () => {
      const vm = p14ViewModel('UI19', {
        synthesizedContent: true,
        synthesizedLabel: 'AI-generated advisory — not governed market data',
      });
      const result = validateClassificationLabelling(vm, 'UI19');
      assert.equal(result.valid, true);
    });
  });

  describe('PI-7: Full surface validation', () => {
    it('all 19 surfaces pass provenance integrity', () => {
      const surfaces = buildAllSurfaceViewModels();
      const result = validateAllSurfaces(surfaces);
      assert.equal(result.totalSurfaces, 19);
      assert.equal(result.passed, 19);
      assert.equal(result.failed, 0);
    });
  });
});
