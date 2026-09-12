/**
 * P10-01 — D06 NEWS/EVENTS MODEL TESTS
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P10_01_MODULE, NEWS_DOMAIN, NEWS_SEGMENT, GOVERNANCE_CLASSIFICATIONS,
  newsKey, buildClassificationField, buildDedupeKeyField, buildEventIdField,
  buildHeadlineField, buildNewsEventSnapshot, validateNewsEventSnapshot,
} from '../src/newsEventsModel.js';
import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY, PUBLICATION_TIME,
  testLineage, testIdentity, IDENTITY_MAPPING_VERSION, assertThrowsWithRule,
} from './helpers.js';

describe('P10-01 module identity', () => {
  it('has correct module identifier', () => {
    assert.equal(P10_01_MODULE, 'P10-01-NEWS-EVENTS-MODEL');
  });
  it('D06 domain is correct', () => {
    assert.equal(NEWS_DOMAIN, 'D06');
    assert.equal(NEWS_SEGMENT, 'news');
  });
});

describe('NE-1 — governance classifications (closed set)', () => {
  it('contains exactly 4 classifications', () => {
    assert.equal(GOVERNANCE_CLASSIFICATIONS.length, 4);
  });
  it('is frozen', () => {
    assert.ok(Object.isFrozen(GOVERNANCE_CLASSIFICATIONS));
  });
  it('builds a valid classification field', () => {
    const field = buildClassificationField('public', 'lineage-ref-001');
    assert.equal(field.key, 'MD:news.classification');
    assert.equal(field.value, 'public');
    assert.equal(field.pitEligible, true);
  });
  it('rejects invalid classification', () => {
    assertThrowsWithRule(() => buildClassificationField('secret', 'ref'), 'NE-1');
  });
});

describe('NE-3 — dedupe key', () => {
  it('builds a valid dedupe key field', () => {
    const field = buildDedupeKeyField('event-123-2026', 'lineage-ref-001');
    assert.equal(field.key, 'MD:news.dedupeKey');
    assert.equal(field.value, 'event-123-2026');
  });
  it('rejects empty dedupe key', () => {
    assertThrowsWithRule(() => buildDedupeKeyField('', 'ref'), 'NE-3');
  });
});

describe('NE-2 — event ID and headline', () => {
  it('builds event ID field', () => {
    const field = buildEventIdField('EVT-001', 'lineage-ref-001');
    assert.equal(field.key, 'MD:news.eventId');
    assert.equal(field.dataType, 'identifier');
  });
  it('builds headline with publicationTime', () => {
    const field = buildHeadlineField('Market Rally', PUBLICATION_TIME, 'lineage-ref-001');
    assert.equal(field.key, 'MD:news.headline');
    assert.equal(field.publicationTime, PUBLICATION_TIME);
  });
  it('rejects empty headline', () => {
    assertThrowsWithRule(() => buildHeadlineField('', PUBLICATION_TIME, 'ref'), 'NE-2');
  });
});

describe('buildNewsEventSnapshot', () => {
  function buildValidNewsSnapshot() {
    const fields = {
      'MD:news.eventId': buildEventIdField('EVT-001', 'lineage-ref-001'),
      'MD:news.headline': buildHeadlineField('Market Rally', PUBLICATION_TIME, 'lineage-ref-001'),
      'MD:news.sourceRef': buildField_str('MD:news.sourceRef', 'reuters-feed', 'lineage-ref-001'),
      'MD:news.classification': buildClassificationField('public', 'lineage-ref-001'),
      'MD:news.dedupeKey': buildDedupeKeyField('evt-001-2026', 'lineage-ref-001'),
    };
    return buildNewsEventSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
    });
  }

  it('builds a valid D06 snapshot', () => {
    const snap = buildValidNewsSnapshot();
    assert.equal(snap.domain, 'D06');
    assert.equal(snap.mode, 'PIT');
    assert.equal(snap.pitBoundary, PIT_BOUNDARY);
  });

  it('rejects snapshot without pitBoundary (NE-4)', () => {
    assertThrowsWithRule(() => buildNewsEventSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), lineage: testLineage(), fields: {
        'MD:news.classification': buildClassificationField('public', 'ref'),
        'MD:news.dedupeKey': buildDedupeKeyField('key', 'ref'),
      },
    }), 'NE-4');
  });

  it('rejects snapshot without classification (NE-1)', () => {
    assertThrowsWithRule(() => buildNewsEventSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), lineage: testLineage(), fields: {
        'MD:news.dedupeKey': buildDedupeKeyField('key', 'ref'),
      },
    }), 'NE-1');
  });
});

describe('validateNewsEventSnapshot', () => {
  function buildValidSnapshot() {
    const fields = {
      'MD:news.eventId': buildEventIdField('EVT-001', 'lineage-ref-001'),
      'MD:news.headline': buildHeadlineField('Market Rally', PUBLICATION_TIME, 'lineage-ref-001'),
      'MD:news.sourceRef': buildField_str('MD:news.sourceRef', 'reuters-feed', 'lineage-ref-001'),
      'MD:news.classification': buildClassificationField('public', 'lineage-ref-001'),
      'MD:news.dedupeKey': buildDedupeKeyField('evt-001-2026', 'lineage-ref-001'),
    };
    return buildNewsEventSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
    });
  }

  it('validates a correct snapshot', () => {
    const snap = buildValidSnapshot();
    const result = validateNewsEventSnapshot(snap);
    assert.equal(result.valid, true);
    assert.equal(result.findings.length, 0);
  });

  it('detects wrong domain', () => {
    const snap = buildValidSnapshot();
    const copy = { ...snap, domain: 'D01' };
    const result = validateNewsEventSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('NE-1')));
  });
});

// Helper to build a simple string field
function buildField_str(key, value, provenance) {
  return { key, value, dataType: 'string', availability: 'PRESENT', provenance, pitEligible: true, monetary: 'no', dimension: 'dimensionless' };
}
