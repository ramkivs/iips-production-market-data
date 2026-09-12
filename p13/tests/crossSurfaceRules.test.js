/**
 * P13 — Cross-Surface Rules tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNoFabricatedProvenance,
  getDegradationDisplay,
  assertNoSilentMixing,
  worstCaseAggregation,
  getClassificationLabel,
  assertSynthesizedLabelled,
  assertServerEnforcedEntitlement,
  buildAsOfDisplay,
  needsComponentRebuild,
  assertNoConcealment,
  buildUIView,
  CrossSurfaceViolation,
  CLASSIFICATION_LABELS,
  DEGRADATION_LABELS,
} from '../src/crossSurfaceRules.js';
import { testProvenance, AS_OF } from './helpers.js';

describe('P13 Cross-Surface Rules', () => {
  describe('U1 — assertNoFabricatedProvenance', () => {
    it('passes for valid provenance', () => {
      assert.equal(assertNoFabricatedProvenance(testProvenance()), true);
    });

    it('rejects null provenance', () => {
      assert.throws(() => assertNoFabricatedProvenance(null), CrossSurfaceViolation);
    });

    it('rejects literal dataSource', () => {
      assert.throws(
        () => assertNoFabricatedProvenance({ dataSource: 'literal', asOf: AS_OF, classification: 'REAL' }),
        CrossSurfaceViolation
      );
    });

    it('rejects missing asOf', () => {
      assert.throws(
        () => assertNoFabricatedProvenance({ dataSource: 'governed:D03', classification: 'REAL' }),
        CrossSurfaceViolation
      );
    });

    it('rejects missing classification', () => {
      assert.throws(
        () => assertNoFabricatedProvenance({ dataSource: 'governed:D03', asOf: AS_OF }),
        CrossSurfaceViolation
      );
    });
  });

  describe('U2 — getDegradationDisplay', () => {
    it('good → normal', () => {
      const d = getDegradationDisplay('good');
      assert.equal(d.severity, 'normal');
      assert.equal(d.isDegraded, false);
    });

    it('stale → warning', () => {
      const d = getDegradationDisplay('stale');
      assert.equal(d.severity, 'warning');
      assert.equal(d.isDegraded, true);
    });

    it('partial → warning', () => {
      const d = getDegradationDisplay('partial');
      assert.equal(d.isDegraded, true);
    });

    it('unavailable → error', () => {
      const d = getDegradationDisplay('unavailable');
      assert.equal(d.severity, 'error');
      assert.equal(d.isDegraded, true);
    });

    it('rejects unknown quality', () => {
      assert.throws(() => getDegradationDisplay('excellent'), CrossSurfaceViolation);
    });
  });

  describe('U3 — assertNoSilentMixing', () => {
    it('passes for consistent modes', () => {
      assert.equal(assertNoSilentMixing(['SNAPSHOT', 'SNAPSHOT']), true);
    });

    it('rejects mixed modes', () => {
      assert.throws(() => assertNoSilentMixing(['LIVE', 'SNAPSHOT']), CrossSurfaceViolation);
    });

    it('passes for single mode', () => {
      assert.equal(assertNoSilentMixing(['PIT']), true);
    });
  });

  describe('U4 — worstCaseAggregation', () => {
    it('returns worst quality', () => {
      assert.equal(worstCaseAggregation(['good', 'stale', 'partial']), 'partial');
    });

    it('returns unavailable if present', () => {
      assert.equal(worstCaseAggregation(['good', 'unavailable']), 'unavailable');
    });
  });

  describe('U5 — getClassificationLabel', () => {
    it('returns label for REAL', () => {
      assert.ok(getClassificationLabel('REAL').includes('Real'));
    });

    it('returns label for SYNTHESIZED', () => {
      assert.ok(getClassificationLabel('SYNTHESIZED').includes('Synthesized'));
    });

    it('rejects unknown classification', () => {
      assert.throws(() => getClassificationLabel('UNKNOWN'), CrossSurfaceViolation);
    });
  });

  describe('U5 — assertSynthesizedLabelled', () => {
    it('passes when SYNTHESIZED is labelled', () => {
      assert.equal(assertSynthesizedLabelled({ classification: 'SYNTHESIZED', isLabelled: true }), true);
    });

    it('rejects when SYNTHESIZED is not labelled', () => {
      assert.throws(
        () => assertSynthesizedLabelled({ classification: 'SYNTHESIZED', isLabelled: false }),
        CrossSurfaceViolation
      );
    });

    it('passes for non-SYNTHESIZED regardless of label', () => {
      assert.equal(assertSynthesizedLabelled({ classification: 'REAL', isLabelled: false }), true);
    });
  });

  describe('U7 — assertServerEnforcedEntitlement', () => {
    it('passes for server enforcement', () => {
      assert.equal(assertServerEnforcedEntitlement({ enforcementLocation: 'server' }), true);
    });

    it('rejects client enforcement', () => {
      assert.throws(
        () => assertServerEnforcedEntitlement({ enforcementLocation: 'client' }),
        CrossSurfaceViolation
      );
    });
  });

  describe('U8 — buildAsOfDisplay', () => {
    it('builds display with mode', () => {
      const d = buildAsOfDisplay(AS_OF, 'SNAPSHOT');
      assert.equal(d.asOf, AS_OF);
      assert.equal(d.mode, 'SNAPSHOT');
      assert.ok(d.displayText.includes('SNAPSHOT'));
    });

    it('rejects empty asOf', () => {
      assert.throws(() => buildAsOfDisplay(''), CrossSurfaceViolation);
    });
  });

  describe('U9 — needsComponentRebuild', () => {
    it('NEW → true', () => assert.equal(needsComponentRebuild('NEW'), true));
    it('REUSE → false', () => assert.equal(needsComponentRebuild('REUSE'), false));
    it('ADAPT → false', () => assert.equal(needsComponentRebuild('ADAPT'), false));
    it('EXTEND → false', () => assert.equal(needsComponentRebuild('EXTEND'), false));
  });

  describe('U10 — assertNoConcealment', () => {
    it('passes when matching', () => {
      assert.equal(assertNoConcealment('UI01', 'REUSE', 'REUSE'), true);
    });

    it('rejects mismatch', () => {
      assert.throws(
        () => assertNoConcealment('UI01', 'REUSE', 'NEW'),
        CrossSurfaceViolation
      );
    });
  });

  describe('buildUIView', () => {
    it('builds a governed view model', () => {
      const view = buildUIView({
        surfaceName: 'UI01',
        disposition: 'REUSE',
        data: { revenue: 1000 },
        provenance: testProvenance(),
      });
      assert.equal(view.surfaceName, 'UI01');
      assert.equal(view.disposition, 'REUSE');
      assert.ok(view.degradation);
      assert.ok(view.classificationLabel);
      assert.ok(view.asOfDisplay);
    });

    it('is frozen', () => {
      const view = buildUIView({
        surfaceName: 'UI01', disposition: 'REUSE',
        data: {}, provenance: testProvenance(),
      });
      assert.ok(Object.isFrozen(view));
    });
  });
});
