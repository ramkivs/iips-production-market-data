/**
 * P10-04 — D09 ALTERNATIVE DATA MODEL TESTS
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  P10_04_MODULE, ALT_DOMAIN, ALT_SEGMENT,
  GOVERNANCE_CLASSIFICATIONS, APPLICABILITY, RETENTION_ENFORCEMENT_CLAIM,
  altKey, assertApplicability, buildRetentionDaysField,
  buildAltClassificationField, buildApprovalRefField,
  buildAlternativeDataSnapshot, validateAlternativeDataSnapshot,
} from '../src/alternativeDataModel.js';
import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY,
  testLineage, testIdentity, IDENTITY_MAPPING_VERSION, assertThrowsWithRule,
} from './helpers.js';

describe('P10-04 module identity', () => {
  it('has correct module identifier', () => {
    assert.equal(P10_04_MODULE, 'P10-04-ALTERNATIVE-DATA-MODEL');
  });
  it('D09 domain is correct', () => {
    assert.equal(ALT_DOMAIN, 'D09');
    assert.equal(ALT_SEGMENT, 'alt');
  });
});

describe('AD-2 — applicability enforcement', () => {
  it('passes for ESTABLISHED applicability', () => {
    assert.equal(assertApplicability('ESTABLISHED'), true);
  });

  it('fails closed for UNDEFINED applicability (OI-05)', () => {
    assertThrowsWithRule(() => assertApplicability('UNDEFINED'), 'OI-05');
  });

  it('fails closed for NOT_APPLICABLE', () => {
    assertThrowsWithRule(() => assertApplicability('NOT_APPLICABLE'), 'AD-2');
  });

  it('rejects unknown applicability status', () => {
    assertThrowsWithRule(() => assertApplicability('MAYBE'), 'OI-05');
  });
});

describe('AD-3 — retention enforcement NOT claimed', () => {
  it('explicitly states retention is NOT enforced', () => {
    assert.equal(RETENTION_ENFORCEMENT_CLAIM.enforced, false);
    assert.equal(RETENTION_ENFORCEMENT_CLAIM.m6Status, 'OPEN');
  });

  it('builds retentionDays field without enforcement claim', () => {
    const field = buildRetentionDaysField(365, 'lineage-ref-001');
    assert.equal(field.key, 'MD:alt.retentionDays');
    assert.equal(field.value, 365);
  });

  it('rejects negative retentionDays', () => {
    assertThrowsWithRule(() => buildRetentionDaysField(-1, 'ref'), 'AD-3');
  });
});

describe('AD-4 — governance classification', () => {
  it('builds a valid classification field', () => {
    const field = buildAltClassificationField('confidential', 'lineage-ref-001');
    assert.equal(field.key, 'MD:alt.classification');
    assert.equal(field.value, 'confidential');
  });

  it('rejects invalid classification', () => {
    assertThrowsWithRule(() => buildAltClassificationField('secret', 'ref'), 'AD-4');
  });
});

describe('AD-5 — approvalRef', () => {
  it('builds a valid approvalRef field', () => {
    const field = buildApprovalRefField('APPROVAL-001', 'lineage-ref-001');
    assert.equal(field.key, 'MD:alt.approvalRef');
    assert.equal(field.value, 'APPROVAL-001');
  });

  it('rejects empty approvalRef', () => {
    assertThrowsWithRule(() => buildApprovalRefField('', 'ref'), 'AD-5');
  });
});

describe('buildAlternativeDataSnapshot', () => {
  function buildValidAltSnapshot() {
    const fields = {
      'MD:alt.datasetId': { key: 'MD:alt.datasetId', value: 'DS-001', dataType: 'identifier', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:alt.classification': buildAltClassificationField('internal', 'lineage-ref-001'),
      'MD:alt.region': { key: 'MD:alt.region', value: 'US', dataType: 'string', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:alt.retentionDays': buildRetentionDaysField(365, 'lineage-ref-001'),
      'MD:alt.approvalRef': buildApprovalRefField('APPROVAL-001', 'lineage-ref-001'),
    };
    return buildAlternativeDataSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
      applicability: 'ESTABLISHED',
    });
  }

  it('builds a valid D09 snapshot', () => {
    const snap = buildValidAltSnapshot();
    assert.equal(snap.domain, 'D09');
    assert.equal(snap.mode, 'PIT');
  });

  it('fails closed when applicability is UNDEFINED (AD-2/OI-05)', () => {
    assertThrowsWithRule(() => buildAlternativeDataSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), lineage: testLineage(), fields: {
        'MD:alt.classification': buildAltClassificationField('public', 'ref'),
        'MD:alt.approvalRef': buildApprovalRefField('APPROVAL-001', 'ref'),
      },
      applicability: 'UNDEFINED',
    }), 'OI-05');
  });
});

describe('validateAlternativeDataSnapshot', () => {
  function buildValidSnapshot() {
    const fields = {
      'MD:alt.datasetId': { key: 'MD:alt.datasetId', value: 'DS-001', dataType: 'identifier', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:alt.classification': buildAltClassificationField('internal', 'lineage-ref-001'),
      'MD:alt.region': { key: 'MD:alt.region', value: 'US', dataType: 'string', availability: 'PRESENT', provenance: 'lineage-ref-001', pitEligible: true, monetary: 'no', dimension: 'dimensionless' },
      'MD:alt.retentionDays': buildRetentionDaysField(365, 'lineage-ref-001'),
      'MD:alt.approvalRef': buildApprovalRefField('APPROVAL-001', 'lineage-ref-001'),
    };
    return buildAlternativeDataSnapshot({
      provider: 'local_fixture', dataVersion: '1.0.0', schemaVersion: '1.2',
      asOf: AS_OF, receivedAt: RECEIVED_AT, pitBoundary: PIT_BOUNDARY,
      quality: 'good', completenessPct: 100,
      identity: testIdentity(), identityMappingVersion: IDENTITY_MAPPING_VERSION,
      lineage: testLineage(), fields,
      applicability: 'ESTABLISHED',
    });
  }

  it('validates a correct snapshot', () => {
    const snap = buildValidSnapshot();
    const result = validateAlternativeDataSnapshot(snap);
    assert.equal(result.valid, true);
    assert.equal(result.retentionEnforcementClaimed, false);
  });

  it('detects wrong domain', () => {
    const snap = buildValidSnapshot();
    const copy = { ...snap, domain: 'D01' };
    const result = validateAlternativeDataSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('AD-1')));
  });
});
