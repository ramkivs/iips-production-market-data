/**
 * P09-03 — FUNDAMENTALS PIT MODEL TESTS
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertThrowsWithRule } from './helpers.js';

import {
  P09_03_MODULE,
  restatementGroupKey,
  extractRestatementSeq,
  queryLatestRestatement,
  validateRestatementSequence,
  createFundamentalsPitStore,
} from '../src/fundamentalsPitModel.js';

import {
  buildFundamentalsField,
  buildFundamentalsMetadataFields,
  buildFundamentalsSnapshot,
  fundamentalsKey,
} from '../src/fundamentalsModel.js';

import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY,
  FISCAL_PERIOD_END, FILING_DATE_INITIAL, FILING_DATE_RESTATEMENT,
  testLineage, testIdentity, IDENTITY_MAPPING_VERSION,
} from './helpers.js';

// ── Module identity ────────────────────────────────────────────────────────────────────────

describe('P09-03 module identity', () => {
  it('has the correct module identifier', () => {
    assert.equal(P09_03_MODULE, 'P09-03-FUNDAMENTALS-PIT-MODEL');
  });
});

// ── Restatement group key (RP-1) ───────────────────────────────────────────────────────────

describe('restatementGroupKey', () => {
  it('builds a deterministic group key', () => {
    const key = restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q1',
      statementType: 'income_statement',
    });
    assert.equal(key, 'local_fixture:FIGI-test-001:Q1:income_statement');
  });

  it('rejects invalid fiscalPeriod', () => {
    assertThrowsWithRule(() => restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q5',
      statementType: 'income_statement',
    }), 'RP-1');
  });

  it('rejects invalid statementType', () => {
    assertThrowsWithRule(() => restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q1',
      statementType: 'custom',
    }), 'RP-1');
  });
});

// ── Helper: build a fundamentals snapshot ──────────────────────────────────────────────────

function buildTestSnapshot({ restatementSeq = 0, dataVersion = '1.0.0', pubTime = FILING_DATE_INITIAL } = {}) {
  const metadata = buildFundamentalsMetadataFields({
    fiscalPeriod: 'Q1',
    statementType: 'income_statement',
    restatementSeq,
    effectiveTime: FISCAL_PERIOD_END,
    publicationTime: pubTime,
    provenance: 'lineage-ref-001',
  });
  const revenue = buildFundamentalsField({
    name: 'revenue',
    fieldClass: 'monetary',
    value: String(1500 + restatementSeq * 100) + '.00',
    availability: 'PRESENT',
    effectiveTime: FISCAL_PERIOD_END,
    publicationTime: pubTime,
    provenance: 'lineage-ref-001',
    currency: 'INR',
    precision: 2,
    reportingScale: 'millions',
  });
  const fields = { ...metadata, 'MD:fundamentals.revenue': revenue };

  return buildFundamentalsSnapshot({
    provider: 'local_fixture',
    dataVersion,
    schemaVersion: '1.2',
    asOf: AS_OF,
    receivedAt: RECEIVED_AT,
    pitBoundary: PIT_BOUNDARY,
    quality: 'good',
    completenessPct: 100,
    identity: testIdentity(),
    identityMappingVersion: IDENTITY_MAPPING_VERSION,
    lineage: testLineage(),
    fields,
  });
}

// ── Extract restatement seq (RP-1) ─────────────────────────────────────────────────────────

describe('extractRestatementSeq', () => {
  it('extracts restatementSeq from a snapshot', () => {
    const snap = buildTestSnapshot({ restatementSeq: 0 });
    assert.equal(extractRestatementSeq(snap), 0);
  });

  it('extracts non-zero restatementSeq', () => {
    const snap = buildTestSnapshot({ restatementSeq: 2 });
    assert.equal(extractRestatementSeq(snap), 2);
  });

  it('rejects snapshot without restatementSeq', () => {
    const snap = buildTestSnapshot();
    // Create a copy without the restatementSeq field
    const copy = { ...snap, fields: { ...snap.fields } };
    delete copy.fields[fundamentalsKey('restatementSeq')];
    assert.throws(() => extractRestatementSeq(copy));
  });
});

// ── Restatement validation (RP-1, RP-2) ────────────────────────────────────────────────────

describe('validateRestatementSequence', () => {
  it('validates a properly sequenced restatement', () => {
    const initial = buildTestSnapshot({ restatementSeq: 0, dataVersion: '1.0.0' });
    const restatement = buildTestSnapshot({ restatementSeq: 1, dataVersion: '1.0.1' });
    const result = validateRestatementSequence(restatement, [initial]);
    assert.equal(result.valid, true);
  });

  it('rejects restatement with same or lower seq (RP-1)', () => {
    const initial = buildTestSnapshot({ restatementSeq: 1, dataVersion: '1.0.0' });
    const bad = buildTestSnapshot({ restatementSeq: 0, dataVersion: '1.0.1' });
    const result = validateRestatementSequence(bad, [initial]);
    assert.equal(result.valid, false);
    assert.ok(result.violations.some((v) => v.includes('RP-1')));
  });

  it('rejects restatement with same dataVersion (RP-2)', () => {
    const initial = buildTestSnapshot({ restatementSeq: 0, dataVersion: '1.0.0' });
    const bad = buildTestSnapshot({ restatementSeq: 1, dataVersion: '1.0.0' });
    const result = validateRestatementSequence(bad, [initial]);
    assert.equal(result.valid, false);
    assert.ok(result.violations.some((v) => v.includes('RP-2')));
  });
});

// ── Query latest restatement (RP-5) ────────────────────────────────────────────────────────

describe('queryLatestRestatement', () => {
  it('returns the latest restatement knowable at the PIT boundary', () => {
    const initial = buildTestSnapshot({ restatementSeq: 0, pubTime: FILING_DATE_INITIAL });
    const restatement = buildTestSnapshot({
      restatementSeq: 1, dataVersion: '1.0.1', pubTime: FILING_DATE_RESTATEMENT,
    });

    const groupKey = restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q1',
      statementType: 'income_statement',
    });

    const result = queryLatestRestatement(
      [initial, restatement],
      '2026-01-01T00:00:00.000Z',
      groupKey,
    );
    assert.equal(result.found, true);
    assert.equal(result.restatementSeq, 1);
  });

  it('returns initial when restatement is not yet knowable', () => {
    const initial = buildTestSnapshot({ restatementSeq: 0, pubTime: FILING_DATE_INITIAL });
    const restatement = buildTestSnapshot({
      restatementSeq: 1, dataVersion: '1.0.1', pubTime: FILING_DATE_RESTATEMENT,
    });

    const groupKey = restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q1',
      statementType: 'income_statement',
    });

    const result = queryLatestRestatement(
      [initial, restatement],
      '2025-06-01T00:00:00.000Z',
      groupKey,
    );
    assert.equal(result.found, true);
    assert.equal(result.restatementSeq, 0);
  });

  it('returns not found when no snapshots are knowable', () => {
    const initial = buildTestSnapshot({ restatementSeq: 0, pubTime: FILING_DATE_INITIAL });

    const groupKey = restatementGroupKey({
      provider: 'local_fixture',
      identityKey: 'FIGI-test-001',
      fiscalPeriod: 'Q1',
      statementType: 'income_statement',
    });

    const result = queryLatestRestatement(
      [initial],
      '2024-01-01T00:00:00.000Z',
      groupKey,
    );
    assert.equal(result.found, false);
  });
});

// ── Fundamentals PIT store ─────────────────────────────────────────────────────────────────

describe('createFundamentalsPitStore', () => {
  it('creates a store', () => {
    const store = createFundamentalsPitStore();
    assert.equal(store.size, 0);
    assert.equal(store.module, P09_03_MODULE);
  });

  it('admits a fundamentals snapshot', () => {
    const store = createFundamentalsPitStore();
    const snap = buildTestSnapshot();
    const result = store.admit(snap);
    assert.equal(result.restatementSeq, 0);
    assert.equal(store.size, 1);
  });

  it('tracks restatement groups', () => {
    const store = createFundamentalsPitStore();
    const snap1 = buildTestSnapshot({ restatementSeq: 0 });
    const snap2 = buildTestSnapshot({ restatementSeq: 1, dataVersion: '1.0.1' });
    store.admit(snap1);
    store.admit(snap2);
    const keys = store.restatementGroupKeys();
    assert.equal(keys.length, 1);
    const group = store.restatementGroup(keys[0]);
    assert.equal(group.length, 2);
  });

  it('rejects non-D03 snapshots', () => {
    const store = createFundamentalsPitStore();
    assert.throws(() => store.admit({ domain: 'D01', mode: 'PIT' }));
  });
});
