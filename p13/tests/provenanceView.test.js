/**
 * P13 — Provenance View tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProvenanceView, buildMultiSourceProvenanceView } from '../src/provenanceView.js';
import { CrossSurfaceViolation } from '../src/crossSurfaceRules.js';
import { testProvenance, AS_OF, DATA_VERSION } from './helpers.js';

describe('P13 Provenance View', () => {
  describe('buildProvenanceView', () => {
    it('builds a view from valid provenance', () => {
      const view = buildProvenanceView(testProvenance());
      assert.equal(view.dataSource, 'governed:D03');
      assert.equal(view.classification, 'REAL');
      assert.equal(view.asOf, AS_OF);
      assert.equal(view.quality, 'good');
      assert.equal(view.isSynthesized, false);
    });

    it('flags SYNTHESIZED provenance', () => {
      const view = buildProvenanceView(testProvenance({ classification: 'SYNTHESIZED' }));
      assert.equal(view.isSynthesized, true);
      assert.ok(view.synthesizedWarning);
    });

    it('includes degradation display', () => {
      const view = buildProvenanceView(testProvenance({ quality: 'stale' }));
      assert.equal(view.degradation.severity, 'warning');
      assert.equal(view.degradation.isDegraded, true);
    });

    it('is frozen', () => {
      const view = buildProvenanceView(testProvenance());
      assert.ok(Object.isFrozen(view));
    });

    it('rejects null provenance', () => {
      assert.throws(() => buildProvenanceView(null), CrossSurfaceViolation);
    });

    it('carries contributingSnapshotIds', () => {
      const view = buildProvenanceView(testProvenance());
      assert.deepEqual(view.contributingSnapshotIds, ['snap-001']);
    });
  });

  describe('buildMultiSourceProvenanceView', () => {
    it('aggregates multiple sources', () => {
      const view = buildMultiSourceProvenanceView([
        testProvenance({ quality: 'good' }),
        testProvenance({ quality: 'stale' }),
      ]);
      assert.equal(view.sourceCount, 2);
      assert.equal(view.aggregateQuality, 'stale');
    });

    it('detects mixed modes', () => {
      const view = buildMultiSourceProvenanceView([
        testProvenance({ mode: 'SNAPSHOT' }),
        testProvenance({ mode: 'LIVE' }),
      ]);
      assert.equal(view.hasMixedModes, true);
    });

    it('rejects empty array', () => {
      assert.throws(() => buildMultiSourceProvenanceView([]), CrossSurfaceViolation);
    });

    it('is frozen', () => {
      const view = buildMultiSourceProvenanceView([testProvenance()]);
      assert.ok(Object.isFrozen(view));
    });
  });
});
