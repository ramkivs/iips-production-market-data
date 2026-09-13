/**
 * P12-01 — Data Provenance DTO tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDataProvenance,
  provenanceFromSnapshot,
  assertProvenanceValid,
  ProvenanceViolation,
  CLASSIFICATIONS,
  EXECUTIVE_PROVENANCE_FIELDS,
  P12_PROVENANCE_FIELDS,
} from '../src/dataProvenanceDto.js';
import { QUALITY, MODES } from '../../p05/src/contract.js';
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { testSnapshot, PROVIDER, DATA_VERSION, AS_OF, RECEIVED_AT } from './helpers.js';

describe('P12-01 Data Provenance DTO', () => {
  const validArgs = {
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
  };

  it('builds a valid provenance DTO with all fields', () => {
    const dto = buildDataProvenance(validArgs);
    assert.equal(dto.dataSource, 'governed:D03');
    assert.equal(dto.mode, 'SNAPSHOT');
    assert.equal(dto.quality, 'good');
    assert.equal(dto.completenessPct, 100);
    assert.equal(dto.classification, 'REAL');
    assert.equal(dto.namespaceVersion, NAMESPACE_VERSION);
    assert.deepEqual(dto.contributingSnapshotIds, ['snap-001']);
  });

  it('is deep-frozen (DP-4)', () => {
    const dto = buildDataProvenance(validArgs);
    assert.ok(Object.isFrozen(dto));
    assert.ok(Object.isFrozen(dto.contributingSnapshotIds));
    assert.throws(() => { dto.quality = 'stale'; });
  });

  it('preserves existing ExecutiveProvenance fields (DP-1)', () => {
    const dto = buildDataProvenance(validArgs);
    for (const field of EXECUTIVE_PROVENANCE_FIELDS) {
      assert.ok(field in dto, `missing ExecutiveProvenance field: ${field}`);
    }
  });

  it('includes all P12 additive fields', () => {
    const dto = buildDataProvenance(validArgs);
    for (const field of P12_PROVENANCE_FIELDS) {
      assert.ok(field in dto, `missing P12 field: ${field}`);
    }
  });

  it('rejects invalid quality (DP-7)', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, quality: 'excellent' }),
      ProvenanceViolation
    );
  });

  it('rejects invalid mode (DP-6)', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, mode: 'HYBRID' }),
      ProvenanceViolation
    );
  });

  it('rejects invalid classification (DP-5)', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, classification: 'UNKNOWN' }),
      ProvenanceViolation
    );
  });

  it('rejects empty dataSource (DP-3)', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, dataSource: '' }),
      ProvenanceViolation
    );
  });

  it('rejects completenessPct out of range', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, completenessPct: 101 }),
      ProvenanceViolation
    );
    assert.throws(
      () => buildDataProvenance({ ...validArgs, completenessPct: -1 }),
      ProvenanceViolation
    );
  });

  it('rejects non-array contributingSnapshotIds', () => {
    assert.throws(
      () => buildDataProvenance({ ...validArgs, contributingSnapshotIds: 'not-array' }),
      ProvenanceViolation
    );
  });

  it('accepts all valid quality values', () => {
    for (const q of QUALITY) {
      const dto = buildDataProvenance({ ...validArgs, quality: q });
      assert.equal(dto.quality, q);
    }
  });

  it('accepts all valid mode values', () => {
    for (const m of MODES) {
      const dto = buildDataProvenance({ ...validArgs, mode: m });
      assert.equal(dto.mode, m);
    }
  });

  it('accepts all valid classification values', () => {
    for (const c of CLASSIFICATIONS) {
      const dto = buildDataProvenance({ ...validArgs, classification: c });
      assert.equal(dto.classification, c);
    }
  });

  it('builds provenance from snapshot', () => {
    const snap = testSnapshot();
    const dto = provenanceFromSnapshot(snap);
    assert.equal(dto.mode, 'SNAPSHOT');
    assert.equal(dto.classification, 'REAL');
    assert.equal(dto.quality, 'good');
    assert.deepEqual(dto.contributingSnapshotIds, [snap.snapshotId]);
  });

  it('assertProvenanceValid passes for valid DTO', () => {
    const dto = buildDataProvenance(validArgs);
    assert.equal(assertProvenanceValid(dto), true);
  });

  it('assertProvenanceValid rejects missing fields', () => {
    assert.throws(() => assertProvenanceValid({}), ProvenanceViolation);
    assert.throws(() => assertProvenanceValid(null), ProvenanceViolation);
  });

  it('classification set is CLOSED (6 values)', () => {
    assert.equal(CLASSIFICATIONS.length, 6);
  });

  it('defaults identityMappingVersion to 1.0', () => {
    const dto = buildDataProvenance(validArgs);
    assert.equal(dto.identityMappingVersion, '1.0');
  });

  it('defaults namespaceVersion to NAMESPACE_VERSION', () => {
    const dto = buildDataProvenance(validArgs);
    assert.equal(dto.namespaceVersion, NAMESPACE_VERSION);
  });

  it('does not include provider identity in DTO (DP-3/NFR-06)', () => {
    const dto = buildDataProvenance(validArgs);
    assert.ok(!('provider' in dto));
    assert.ok(!dto.dataSource.includes(PROVIDER));
  });
});
