/**
 * P12-02 — Quality / Freshness / Completeness Propagation tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  worstQuality,
  worstCompleteness,
  aggregateProvenance,
  assertQualityTransition,
  buildAbsentQualityProvenance,
  attachProvenance,
} from '../src/qualityPropagation.js';
import { buildDataProvenance } from '../src/dataProvenanceDto.js';
import { AS_OF, RECEIVED_AT, DATA_VERSION } from './helpers.js';

describe('P12-02 Quality Propagation', () => {
  describe('worstQuality', () => {
    it('returns good when all inputs are good', () => {
      assert.equal(worstQuality(['good', 'good']), 'good');
    });

    it('returns stale when mixed good/stale', () => {
      assert.equal(worstQuality(['good', 'stale']), 'stale');
    });

    it('returns partial when mixed good/stale/partial', () => {
      assert.equal(worstQuality(['good', 'stale', 'partial']), 'partial');
    });

    it('returns unavailable when any is unavailable', () => {
      assert.equal(worstQuality(['good', 'unavailable']), 'unavailable');
    });

    it('throws on empty array', () => {
      assert.throws(() => worstQuality([]));
    });

    it('throws on unknown quality', () => {
      assert.throws(() => worstQuality(['good', 'excellent']));
    });
  });

  describe('worstCompleteness', () => {
    it('returns minimum value', () => {
      assert.equal(worstCompleteness([100, 80, 60]), 60);
    });

    it('returns 0 when present', () => {
      assert.equal(worstCompleteness([100, 0, 60]), 0);
    });

    it('throws on empty array', () => {
      assert.throws(() => worstCompleteness([]));
    });
  });

  describe('assertQualityTransition', () => {
    it('allows same quality', () => {
      assert.equal(assertQualityTransition('good', 'good'), true);
    });

    it('allows degradation (good → stale)', () => {
      assert.equal(assertQualityTransition('good', 'stale'), true);
    });

    it('allows degradation (stale → unavailable)', () => {
      assert.equal(assertQualityTransition('stale', 'unavailable'), true);
    });

    it('rejects silent upgrade (stale → good)', () => {
      assert.throws(() => assertQualityTransition('stale', 'good'));
    });

    it('rejects silent upgrade (partial → good)', () => {
      assert.throws(() => assertQualityTransition('partial', 'good'));
    });

    it('rejects silent upgrade (unavailable → good)', () => {
      assert.throws(() => assertQualityTransition('unavailable', 'good'));
    });
  });

  describe('aggregateProvenance', () => {
    const baseProvenance = (overrides = {}) =>
      buildDataProvenance({
        dataSource: 'governed:D03',
        freshness: 'SNAPSHOT',
        calibratedAt: AS_OF,
        transportSemantics: 'canonical-snapshot',
        asOf: AS_OF,
        receivedAt: RECEIVED_AT,
        dataVersion: DATA_VERSION,
        mode: 'SNAPSHOT',
        quality: 'good',
        completenessPct: 100,
        contributingSnapshotIds: ['snap-001'],
        classification: 'REAL',
        ...overrides,
      });

    it('aggregates worst quality', () => {
      const result = aggregateProvenance({
        provenances: [baseProvenance(), baseProvenance({ quality: 'stale' })],
        dataSource: 'governed:aggregate',
        classification: 'DERIVED',
      });
      assert.equal(result.quality, 'stale');
    });

    it('aggregates worst completeness', () => {
      const result = aggregateProvenance({
        provenances: [baseProvenance(), baseProvenance({ completenessPct: 60 })],
        dataSource: 'governed:aggregate',
        classification: 'DERIVED',
      });
      assert.equal(result.completenessPct, 60);
    });

    it('merges contributing snapshot IDs', () => {
      const result = aggregateProvenance({
        provenances: [
          baseProvenance({ contributingSnapshotIds: ['snap-001'] }),
          baseProvenance({ contributingSnapshotIds: ['snap-002'] }),
        ],
        dataSource: 'governed:aggregate',
        classification: 'DERIVED',
      });
      assert.deepEqual(result.contributingSnapshotIds, ['snap-001', 'snap-002']);
    });

    it('deduplicates contributing snapshot IDs', () => {
      const result = aggregateProvenance({
        provenances: [
          baseProvenance({ contributingSnapshotIds: ['snap-001'] }),
          baseProvenance({ contributingSnapshotIds: ['snap-001'] }),
        ],
        dataSource: 'governed:aggregate',
        classification: 'DERIVED',
      });
      assert.deepEqual(result.contributingSnapshotIds, ['snap-001']);
    });

    it('rejects mixed mode (QP-8)', () => {
      assert.throws(
        () => aggregateProvenance({
          provenances: [
            baseProvenance({ mode: 'SNAPSHOT' }),
            baseProvenance({ mode: 'LIVE' }),
          ],
          dataSource: 'governed:aggregate',
          classification: 'DERIVED',
        })
      );
    });

    it('throws on empty provenances', () => {
      assert.throws(() => aggregateProvenance({
        provenances: [],
        dataSource: 'x',
        classification: 'REAL',
      }));
    });
  });

  describe('buildAbsentQualityProvenance', () => {
    it('forces quality to unavailable (QP-3)', () => {
      const dto = buildAbsentQualityProvenance({
        dataSource: 'governed:D03',
        freshness: 'UNAVAILABLE',
        calibratedAt: AS_OF,
        transportSemantics: 'absent',
        asOf: AS_OF,
        receivedAt: RECEIVED_AT,
        dataVersion: DATA_VERSION,
        mode: 'SNAPSHOT',
        completenessPct: 0,
        classification: 'REAL',
      });
      assert.equal(dto.quality, 'unavailable');
    });
  });

  describe('attachProvenance', () => {
    it('attaches provenance to a payload', () => {
      const payload = { revenue: 1000 };
      const provenance = buildDataProvenance({
        dataSource: 'governed:D03',
        freshness: 'SNAPSHOT',
        calibratedAt: AS_OF,
        transportSemantics: 'test',
        asOf: AS_OF,
        receivedAt: RECEIVED_AT,
        dataVersion: DATA_VERSION,
        mode: 'SNAPSHOT',
        quality: 'good',
        completenessPct: 100,
        classification: 'REAL',
      });
      const result = attachProvenance(payload, provenance);
      assert.equal(result.revenue, 1000);
      assert.ok(result._provenance);
      assert.equal(result._provenance.quality, 'good');
    });

    it('result is frozen', () => {
      const result = attachProvenance({ x: 1 }, buildDataProvenance({
        dataSource: 'g', freshness: 'SNAPSHOT', calibratedAt: AS_OF,
        transportSemantics: 't', asOf: AS_OF, receivedAt: RECEIVED_AT,
        dataVersion: 'v', mode: 'SNAPSHOT', quality: 'good',
        completenessPct: 100, classification: 'REAL',
      }));
      assert.ok(Object.isFrozen(result));
    });
  });
});
