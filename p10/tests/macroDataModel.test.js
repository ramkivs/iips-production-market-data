/**
 * P10-03 — D08 MACRO DATA MODEL TESTS
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P10_03_MODULE, MACRO_DOMAIN, MACRO_SEGMENT,
  UNITS_OF_MEASURE, FREQUENCIES,
  macroKey, buildSeriesIdentity, assertSeriesIdentityDistinct,
  buildUnitOfMeasureField, buildFrequencyField, buildMacroValueField,
  buildMacroSnapshot, validateMacroSnapshot,
} from '../src/macroDataModel.js';
import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY, PUBLICATION_TIME, EFFECTIVE_TIME,
  testLineage, testSeriesIdentity, assertThrowsWithRule,
} from './helpers.js';

describe('P10-03 module identity', () => {
  it('has correct module identifier', () => {
    assert.equal(P10_03_MODULE, 'P10-03-MACRO-DATA-MODEL');
  });
  it('D08 domain is correct', () => {
    assert.equal(MACRO_DOMAIN, 'D08');
    assert.equal(MACRO_SEGMENT, 'macro');
  });
});

describe('MD-4 — units of measure (closed set)', () => {
  it('contains 6 units', () => {
    assert.equal(UNITS_OF_MEASURE.length, 6);
  });
  it('is frozen', () => {
    assert.ok(Object.isFrozen(UNITS_OF_MEASURE));
  });
});

describe('MD-3 — frequencies (closed set)', () => {
  it('contains 6 frequencies', () => {
    assert.equal(FREQUENCIES.length, 6);
  });
  it('is frozen', () => {
    assert.ok(Object.isFrozen(FREQUENCIES));
  });
});

describe('MD-2 — series identity', () => {
  it('builds a series identity', () => {
    const id = buildSeriesIdentity('MACRO-GDP-US-Q', 'US');
    assert.equal(id.seriesId, 'MACRO-GDP-US-Q');
    assert.equal(id.identityType, 'macro-series');
  });

  it('rejects empty seriesId', () => {
    assertThrowsWithRule(() => buildSeriesIdentity('', 'US'), 'MD-2');
  });

  it('detects instrument identity misuse', () => {
    const result = assertSeriesIdentityDistinct({
      canonicalSecurityId: 'FIGI-001', seriesId: 'MACRO-GDP',
    });
    assert.equal(result.valid, false);
    assert.ok(result.violations.some((v) => v.includes('canonicalSecurityId')));
  });

  it('detects companyId misuse', () => {
    const result = assertSeriesIdentityDistinct({ companyId: 'COMP-001', seriesId: 'MACRO-GDP' });
    assert.equal(result.valid, false);
    assert.ok(result.violations.some((v) => v.includes('companyId')));
  });

  it('passes for valid series identity', () => {
    const result = assertSeriesIdentityDistinct(testSeriesIdentity());
    assert.equal(result.valid, true);
  });
});

describe('buildMacroSnapshot', () => {
  function buildValidMacroSnapshot() {
    const fields = {
      'MD:macro.seriesId': { key: 'MD:macro.seriesId', value: 'MACRO-GDP-US-Q', dataType: 'identifier', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:macro.value': buildMacroValueField('2.50', EFFECTIVE_TIME, PUBLICATION_TIME, 2, 'percent', 'lineage-ref-001'),
      'MD:macro.unitOfMeasure': buildUnitOfMeasureField('percent', 'lineage-ref-001'),
      'MD:macro.frequency': buildFrequencyField('quarterly', 'lineage-ref-001'),
    };
    return buildMacroSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testSeriesIdentity(),
      lineage: testLineage(), fields,
    });
  }

  it('builds a valid D08 snapshot', () => {
    const snap = buildValidMacroSnapshot();
    assert.equal(snap.domain, 'D08');
    assert.equal(snap.mode, 'PIT');
    assert.equal(snap.identity.seriesId, 'MACRO-GDP-US-Q');
  });

  it('rejects snapshot with companyId identity (MD-2)', () => {
    assertThrowsWithRule(() => buildMacroSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: { companyId: 'COMP-001', seriesId: 'MACRO-GDP' },
      lineage: testLineage(), fields: {
        'MD:macro.unitOfMeasure': buildUnitOfMeasureField('percent', 'ref'),
        'MD:macro.frequency': buildFrequencyField('quarterly', 'ref'),
      },
    }), 'MD-2');
  });

  it('rejects snapshot without pitBoundary (MD-1)', () => {
    assertThrowsWithRule(() => buildMacroSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT,
      quality: 'good', completenessPct: 100,
      identity: testSeriesIdentity(),
      lineage: testLineage(), fields: {},
    }), 'MD-1');
  });
});

describe('validateMacroSnapshot', () => {
  function buildValidSnapshot() {
    const fields = {
      'MD:macro.seriesId': { key: 'MD:macro.seriesId', value: 'MACRO-GDP-US-Q', dataType: 'identifier', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:macro.value': buildMacroValueField('2.50', EFFECTIVE_TIME, PUBLICATION_TIME, 2, 'percent', 'lineage-ref-001'),
      'MD:macro.unitOfMeasure': buildUnitOfMeasureField('percent', 'lineage-ref-001'),
      'MD:macro.frequency': buildFrequencyField('quarterly', 'lineage-ref-001'),
    };
    return buildMacroSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testSeriesIdentity(),
      lineage: testLineage(), fields,
    });
  }

  it('validates a correct snapshot', () => {
    const snap = buildValidSnapshot();
    const result = validateMacroSnapshot(snap);
    assert.equal(result.valid, true);
  });

  it('detects wrong domain', () => {
    const snap = buildValidSnapshot();
    const copy = { ...snap, domain: 'D01' };
    const result = validateMacroSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('MD-1')));
  });
});
