/**
 * P10-02 — D07 ESTIMATES/CONSENSUS MODEL TESTS
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P10_02_MODULE, ESTIMATES_DOMAIN, ESTIMATES_SEGMENT,
  FORECAST_PERIODS, ENGINE_COLLISION_KEYS,
  estimatesKey, buildConsensusField, buildRevisionSeqField,
  buildForecastPeriodField, buildEstimateCountField,
  buildEstimatesSnapshot, validateEstimatesSnapshot, findEstimatesEngineCollisions,
} from '../src/estimatesConsensusModel.js';
import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY, PUBLICATION_TIME, EFFECTIVE_TIME,
  testLineage, testIdentity, IDENTITY_MAPPING_VERSION, assertThrowsWithRule,
} from './helpers.js';

describe('P10-02 module identity', () => {
  it('has correct module identifier', () => {
    assert.equal(P10_02_MODULE, 'P10-02-ESTIMATES-CONSENSUS-MODEL');
  });
  it('D07 domain is correct', () => {
    assert.equal(ESTIMATES_DOMAIN, 'D07');
    assert.equal(ESTIMATES_SEGMENT, 'estimates');
  });
});

describe('EC-2 — forecast periods (closed set)', () => {
  it('contains 9 periods', () => {
    assert.equal(FORECAST_PERIODS.length, 9);
  });
  it('is frozen', () => {
    assert.ok(Object.isFrozen(FORECAST_PERIODS));
  });
});

describe('EC-3 — consensus field with both times', () => {
  it('builds a consensus field with effectiveTime and publicationTime', () => {
    const field = buildConsensusField({
      name: 'consensusMean', value: '45.50', availability: 'PRESENT',
      effectiveTime: EFFECTIVE_TIME, publicationTime: PUBLICATION_TIME,
      provenance: 'lineage-ref-001', precision: 2,
    });
    assert.equal(field.key, 'MD:estimates.consensusMean');
    assert.equal(field.effectiveTime, EFFECTIVE_TIME);
    assert.equal(field.publicationTime, PUBLICATION_TIME);
    assert.equal(field.pitEligible, true);
  });

  it('rejects field without effectiveTime (EC-3)', () => {
    assertThrowsWithRule(() => buildConsensusField({
      name: 'consensusMean', value: '45.50', availability: 'PRESENT',
      publicationTime: PUBLICATION_TIME, provenance: 'ref', precision: 2,
    }), 'EC-3');
  });

  it('rejects field without publicationTime (EC-3)', () => {
    assertThrowsWithRule(() => buildConsensusField({
      name: 'consensusMean', value: '45.50', availability: 'PRESENT',
      effectiveTime: EFFECTIVE_TIME, provenance: 'ref', precision: 2,
    }), 'EC-3');
  });
});

describe('EC-2 — revisionSeq and forecastPeriod', () => {
  it('builds revisionSeq field', () => {
    const field = buildRevisionSeqField(0, PUBLICATION_TIME, 'lineage-ref-001');
    assert.equal(field.key, 'MD:estimates.revisionSeq');
    assert.equal(field.value, 0);
  });

  it('rejects negative revisionSeq', () => {
    assertThrowsWithRule(() => buildRevisionSeqField(-1, PUBLICATION_TIME, 'ref'), 'EC-2');
  });

  it('builds forecastPeriod field', () => {
    const field = buildForecastPeriodField('FY', EFFECTIVE_TIME, 'lineage-ref-001');
    assert.equal(field.key, 'MD:estimates.forecastPeriod');
    assert.equal(field.value, 'FY');
  });

  it('rejects invalid forecastPeriod', () => {
    assertThrowsWithRule(() => buildForecastPeriodField('Q5', EFFECTIVE_TIME, 'ref'), 'EC-2');
  });

  it('builds estimateCount field', () => {
    const field = buildEstimateCountField(12, EFFECTIVE_TIME, PUBLICATION_TIME, 'lineage-ref-001');
    assert.equal(field.key, 'MD:estimates.estimateCount');
    assert.equal(field.value, 12);
  });
});

describe('buildEstimatesSnapshot', () => {
  function buildValidEstimatesSnapshot() {
    const fields = {
      'MD:estimates.revisionSeq': buildRevisionSeqField(0, PUBLICATION_TIME, 'lineage-ref-001'),
      'MD:estimates.forecastPeriod': buildForecastPeriodField('FY', EFFECTIVE_TIME, 'lineage-ref-001'),
      'MD:estimates.estimateCount': buildEstimateCountField(12, EFFECTIVE_TIME, PUBLICATION_TIME, 'lineage-ref-001'),
      'MD:estimates.consensusMean': buildConsensusField({
        name: 'consensusMean', value: '45.50', availability: 'PRESENT',
        effectiveTime: EFFECTIVE_TIME, publicationTime: PUBLICATION_TIME,
        provenance: 'lineage-ref-001', precision: 2,
      }),
    };
    return buildEstimatesSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
    });
  }

  it('builds a valid D07 snapshot', () => {
    const snap = buildValidEstimatesSnapshot();
    assert.equal(snap.domain, 'D07');
    assert.equal(snap.mode, 'PIT');
  });

  it('rejects snapshot without pitBoundary (EC-1)', () => {
    assertThrowsWithRule(() => buildEstimatesSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), lineage: testLineage(), fields: {},
    }), 'EC-1');
  });
});

describe('EC-4 — engine collision detection', () => {
  it('detects collision surface keys', () => {
    const fields = {
      'MD:estimates.peRatio': {},
      'MD:estimates.consensusMean': {},
      'MD:estimates.evEbitda': {},
    };
    const collisions = findEstimatesEngineCollisions(fields);
    assert.ok(collisions.includes('peRatio'));
    assert.ok(collisions.includes('evEbitda'));
    assert.ok(!collisions.includes('consensusMean'));
  });

  it('returns empty for non-colliding keys', () => {
    const fields = { 'MD:estimates.consensusMean': {}, 'MD:estimates.revisionSeq': {} };
    const collisions = findEstimatesEngineCollisions(fields);
    assert.equal(collisions.length, 0);
  });
});

describe('validateEstimatesSnapshot', () => {
  function buildValidSnapshot() {
    const fields = {
      'MD:estimates.revisionSeq': buildRevisionSeqField(0, PUBLICATION_TIME, 'lineage-ref-001'),
      'MD:estimates.forecastPeriod': buildForecastPeriodField('FY', EFFECTIVE_TIME, 'lineage-ref-001'),
      'MD:estimates.estimateCount': buildEstimateCountField(12, EFFECTIVE_TIME, PUBLICATION_TIME, 'lineage-ref-001'),
    };
    return buildEstimatesSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
    });
  }

  it('validates a correct snapshot', () => {
    const snap = buildValidSnapshot();
    const result = validateEstimatesSnapshot(snap);
    assert.equal(result.valid, true);
  });

  it('detects missing required fields', () => {
    const snap = buildValidSnapshot();
    const { 'MD:estimates.revisionSeq': _, ...fieldsWithout } = snap.fields;
    const copy = { ...snap, fields: fieldsWithout };
    const result = validateEstimatesSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('EC-2')));
  });
});
