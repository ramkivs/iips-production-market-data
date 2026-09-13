/**
 * P09-01 — FUNDAMENTALS MODEL TESTS
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  P09_01_MODULE,
  STATEMENT_TYPES,
  FISCAL_PERIODS,
  FUNDAMENTALS_DOMAIN,
  FUNDAMENTALS_SEGMENT,
  REPORTING_SCALES,
  fundamentalsKey,
  classifyFundamentalsField,
  buildFundamentalsField,
  buildFundamentalsMetadataFields,
  buildFundamentalsSnapshot,
  validateFundamentalsSnapshot,
  findEngineKeyCollisions,
  QUALITY,
  AVAILABILITY,
  MODES,
  NAMESPACE_TOKEN,
} from '../src/fundamentalsModel.js';

import {
  RECEIVED_AT, AS_OF, PIT_BOUNDARY,
  FISCAL_PERIOD_END, FILING_DATE_INITIAL,
  testLineage, testIdentity, IDENTITY_MAPPING_VERSION,
  assertThrowsWithRule,
} from './helpers.js';

// ── Module identity ────────────────────────────────────────────────────────────────────────

describe('P09-01 module identity', () => {
  it('has the correct module identifier', () => {
    assert.equal(P09_01_MODULE, 'P09-01-FUNDAMENTALS-MODEL');
  });

  it('D03 domain is correct', () => {
    assert.equal(FUNDAMENTALS_DOMAIN, 'D03');
    assert.equal(FUNDAMENTALS_SEGMENT, 'fundamentals');
  });
});

// ── Closed sets (FM-7, FM-8) ───────────────────────────────────────────────────────────────

describe('FM-7 — statement types (closed set)', () => {
  it('contains exactly 5 statement types', () => {
    assert.equal(STATEMENT_TYPES.length, 5);
  });

  it('is frozen', () => {
    assert.ok(Object.isFrozen(STATEMENT_TYPES));
  });

  it('contains the required types', () => {
    assert.ok(STATEMENT_TYPES.includes('income_statement'));
    assert.ok(STATEMENT_TYPES.includes('balance_sheet'));
    assert.ok(STATEMENT_TYPES.includes('cash_flow_statement'));
  });
});

describe('FM-8 — fiscal periods (closed set)', () => {
  it('contains exactly 9 fiscal periods', () => {
    assert.equal(FISCAL_PERIODS.length, 9);
  });

  it('is frozen', () => {
    assert.ok(Object.isFrozen(FISCAL_PERIODS));
  });

  it('contains Q1-Q4, H1, H2, FY, TTM, YTD', () => {
    for (const fp of ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'FY', 'TTM', 'YTD']) {
      assert.ok(FISCAL_PERIODS.includes(fp), `missing ${fp}`);
    }
  });
});

// ── Field key construction (FM-1) ──────────────────────────────────────────────────────────

describe('FM-1 — fundamentals key construction', () => {
  it('builds namespaced keys', () => {
    assert.equal(fundamentalsKey('revenue'), 'MD:fundamentals.revenue');
    assert.equal(fundamentalsKey('ebitdaMargin'), 'MD:fundamentals.ebitdaMargin');
  });

  it('all keys carry the namespace token', () => {
    const key = fundamentalsKey('test');
    assert.ok(key.startsWith(NAMESPACE_TOKEN));
  });
});

// ── Field classification ───────────────────────────────────────────────────────────────────

describe('classifyFundamentalsField', () => {
  it('classifies a monetary field', () => {
    const result = classifyFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    });
    assert.equal(result.fieldClass, 'monetary');
    assert.equal(result.currency, 'INR');
    assert.equal(result.precision, 2);
    assert.equal(result.reportingScale, 'millions');
  });

  it('rejects monetary without currency (FM-4)', () => {
    assertThrowsWithRule(() => classifyFundamentalsField({
      name: 'revenue', fieldClass: 'monetary', precision: 2, reportingScale: 'millions',
    }), 'FM-4');
  });

  it('rejects monetary without reporting scale (FM-4)', () => {
    assertThrowsWithRule(() => classifyFundamentalsField({
      name: 'revenue', fieldClass: 'monetary', currency: 'INR', precision: 2,
    }), 'FM-4');
  });

  it('classifies a ratio field', () => {
    const result = classifyFundamentalsField({
      name: 'ebitdaMargin', fieldClass: 'ratio', precision: 4,
    });
    assert.equal(result.fieldClass, 'ratio');
    assert.equal(result.precision, 4);
  });

  it('rejects ratio with currency (FM-5)', () => {
    assertThrowsWithRule(() => classifyFundamentalsField({
      name: 'ebitdaMargin', fieldClass: 'ratio', precision: 4, currency: 'INR',
    }), 'FM-5');
  });

  it('rejects unknown fieldClass', () => {
    assertThrowsWithRule(() => classifyFundamentalsField({
      name: 'test', fieldClass: 'unknown',
    }), 'FM-1');
  });
});

// ── Field building ─────────────────────────────────────────────────────────────────────────

describe('buildFundamentalsField', () => {
  it('builds a monetary field with both times (FM-2)', () => {
    const field = buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      value: '1500.00', availability: 'PRESENT',
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    });
    assert.equal(field.key, 'MD:fundamentals.revenue');
    assert.equal(field.availability, 'PRESENT');
    assert.equal(field.value, '1500.00');
    assert.equal(field.currency, 'INR');
    assert.equal(field.monetary, 'yes');
    assert.equal(field.dimension, 'dimensioned');
    assert.equal(field.effectiveTime, FISCAL_PERIOD_END);
    assert.equal(field.publicationTime, FILING_DATE_INITIAL);
    assert.equal(field.pitEligible, true);
  });

  it('builds a ratio field (FM-5)', () => {
    const field = buildFundamentalsField({
      name: 'ebitdaMargin', fieldClass: 'ratio',
      value: '0.2350', availability: 'PRESENT',
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      precision: 4,
    });
    assert.equal(field.key, 'MD:fundamentals.ebitdaMargin');
    assert.equal(field.monetary, 'no');
    assert.equal(field.dimension, 'dimensionless');
  });

  it('rejects field without effectiveTime (FM-2)', () => {
    assertThrowsWithRule(() => buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      value: '1500.00', availability: 'PRESENT',
      publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    }), 'FM-2');
  });

  it('rejects field without publicationTime (FM-2)', () => {
    assertThrowsWithRule(() => buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      value: '1500.00', availability: 'PRESENT',
      effectiveTime: FISCAL_PERIOD_END,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    }), 'FM-2');
  });

  it('builds a NOT_PROVIDED field correctly', () => {
    const field = buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      availability: 'NOT_PROVIDED',
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    });
    assert.equal(field.availability, 'NOT_PROVIDED');
    assert.equal(field.value, null);
  });
});

// ── Metadata fields ────────────────────────────────────────────────────────────────────────

describe('buildFundamentalsMetadataFields', () => {
  it('builds all three required metadata fields', () => {
    const fields = buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'income_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    });
    assert.ok(fields['MD:fundamentals.fiscalPeriod']);
    assert.ok(fields['MD:fundamentals.statementType']);
    assert.ok(fields['MD:fundamentals.restatementSeq']);
  });

  it('rejects invalid fiscalPeriod (FM-8)', () => {
    assertThrowsWithRule(() => buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q5', statementType: 'income_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    }), 'FM-8');
  });

  it('rejects invalid statementType (FM-7)', () => {
    assertThrowsWithRule(() => buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'custom_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    }), 'FM-7');
  });

  it('rejects negative restatementSeq (FM-3)', () => {
    assertThrowsWithRule(() => buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'income_statement', restatementSeq: -1,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    }), 'FM-3');
  });

  it('restatementSeq is PIT-eligible', () => {
    const fields = buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'income_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    });
    assert.equal(fields['MD:fundamentals.restatementSeq'].pitEligible, true);
  });
});

// ── Snapshot building ──────────────────────────────────────────────────────────────────────

describe('buildFundamentalsSnapshot', () => {
  function buildTestSnapshot() {
    const metadata = buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'income_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    });
    const revenue = buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      value: '1500.00', availability: 'PRESENT',
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    });
    const fields = { ...metadata, 'MD:fundamentals.revenue': revenue };

    return buildFundamentalsSnapshot({
      provider: 'local_fixture',
      dataVersion: '1.0.0',
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

  it('builds a valid fundamentals snapshot', () => {
    const snap = buildTestSnapshot();
    assert.equal(snap.domain, 'D03');
    assert.equal(snap.mode, 'PIT');
    assert.equal(snap.pitBoundary, PIT_BOUNDARY);
    assert.equal(snap.quality, 'good');
  });

  it('rejects snapshot without pitBoundary (FM-6)', () => {
    assertThrowsWithRule(() => buildFundamentalsSnapshot({
      provider: 'local_fixture',
      dataVersion: '1.0.0',
      schemaVersion: '1.2',
      asOf: AS_OF,
      receivedAt: RECEIVED_AT,
      quality: 'good',
      completenessPct: 100,
      identity: testIdentity(),
      lineage: testLineage(),
      fields: {},
    }), 'FM-6');
  });

  it('snapshot is frozen (SN-1)', () => {
    const snap = buildTestSnapshot();
    assert.ok(Object.isFrozen(snap));
  });
});

// ── Validation ─────────────────────────────────────────────────────────────────────────────

describe('validateFundamentalsSnapshot', () => {
  function buildValidSnapshot() {
    const metadata = buildFundamentalsMetadataFields({
      fiscalPeriod: 'Q1', statementType: 'income_statement', restatementSeq: 0,
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
    });
    const revenue = buildFundamentalsField({
      name: 'revenue', fieldClass: 'monetary',
      value: '1500.00', availability: 'PRESENT',
      effectiveTime: FISCAL_PERIOD_END, publicationTime: FILING_DATE_INITIAL,
      provenance: 'lineage-ref-001',
      currency: 'INR', precision: 2, reportingScale: 'millions',
    });
    const fields = { ...metadata, 'MD:fundamentals.revenue': revenue };

    return buildFundamentalsSnapshot({
      provider: 'local_fixture',
      dataVersion: '1.0.0',
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

  it('validates a correct snapshot', () => {
    const snap = buildValidSnapshot();
    const result = validateFundamentalsSnapshot(snap);
    assert.equal(result.valid, true);
    assert.equal(result.findings.length, 0);
  });

  it('detects missing restatementSeq (FM-3)', () => {
    const snap = buildValidSnapshot();
    const { 'MD:fundamentals.restatementSeq': _, ...fieldsWithout } = snap.fields;
    const copy = { ...snap, fields: fieldsWithout };
    const result = validateFundamentalsSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('FM-3')));
  });

  it('detects missing statementType (FM-7)', () => {
    const snap = buildValidSnapshot();
    const { 'MD:fundamentals.statementType': _, ...fieldsWithout } = snap.fields;
    const copy = { ...snap, fields: fieldsWithout };
    const result = validateFundamentalsSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('FM-7')));
  });

  it('detects wrong domain', () => {
    const snap = buildValidSnapshot();
    // We can't mutate frozen objects, so test with a copy
    const copy = { ...snap, domain: 'D01' };
    const result = validateFundamentalsSnapshot(copy);
    assert.ok(result.findings.some((f) => f.includes('FM-1')));
  });
});

// ── Engine key collision detection (FM-9) ──────────────────────────────────────────────────

describe('FM-9 — engine key collision detection', () => {
  it('detects collision surface keys', () => {
    const fields = {
      'MD:fundamentals.ebitdaMargin': {},
      'MD:fundamentals.revenue': {},
      'MD:fundamentals.peRatio': {},
    };
    const collisions = findEngineKeyCollisions(fields);
    assert.ok(collisions.includes('ebitdaMargin'));
    assert.ok(collisions.includes('peRatio'));
    assert.ok(!collisions.includes('revenue'));
  });

  it('returns empty for non-colliding keys', () => {
    const fields = {
      'MD:fundamentals.revenue': {},
      'MD:fundamentals.netIncome': {},
    };
    const collisions = findEngineKeyCollisions(fields);
    assert.equal(collisions.length, 0);
  });
});

// ── Reporting scales ───────────────────────────────────────────────────────────────────────

describe('FM-4 — reporting scales', () => {
  it('contains exactly 4 scales', () => {
    assert.equal(REPORTING_SCALES.length, 4);
  });

  it('is frozen', () => {
    assert.ok(Object.isFrozen(REPORTING_SCALES));
  });
});

// ── Reuse verification ─────────────────────────────────────────────────────────────────────

describe('P09-01 reuse verification', () => {
  it('QUALITY is the accepted 4-state enum', () => {
    assert.deepEqual([...QUALITY], ['good', 'stale', 'partial', 'unavailable']);
  });

  it('MODES includes PIT', () => {
    assert.ok(MODES.includes('PIT'));
  });

  it('AVAILABILITY includes all 5 markers', () => {
    assert.equal(AVAILABILITY.length, 5);
  });
});
