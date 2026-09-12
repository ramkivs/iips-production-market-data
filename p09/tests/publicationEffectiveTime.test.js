/**
 * P09-02 — PUBLICATION/EFFECTIVE TIME TESTS
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  P09_02_MODULE,
  buildPublicationEffectivePair,
  classifyTemporalRelationship,
  assertPublicationEffectiveDistinct,
  computeReportingLagDistribution,
} from '../src/publicationEffectiveTime.js';

import { FISCAL_PERIOD_END, FILING_DATE_INITIAL, FILING_DATE_RESTATEMENT, assertThrowsWithRule } from './helpers.js';

// ── Module identity ────────────────────────────────────────────────────────────────────────

describe('P09-02 module identity', () => {
  it('has the correct module identifier', () => {
    assert.equal(P09_02_MODULE, 'P09-02-PUBLICATION-EFFECTIVE-TIME');
  });
});

// ── Publication/effective pair (PT-1, PT-2) ───────────────────────────────────────────────

describe('buildPublicationEffectivePair', () => {
  it('builds a valid pair (PT-2)', () => {
    const pair = buildPublicationEffectivePair({
      effectiveTime: FISCAL_PERIOD_END,
      publicationTime: FILING_DATE_INITIAL,
    });
    assert.equal(pair.effectiveTime, FISCAL_PERIOD_END);
    assert.equal(pair.publicationTime, FILING_DATE_INITIAL);
    assert.equal(pair.collapsed, false);
  });

  it('computes reporting lag (PT-5)', () => {
    const pair = buildPublicationEffectivePair({
      effectiveTime: FISCAL_PERIOD_END,
      publicationTime: FILING_DATE_INITIAL,
    });
    assert.ok(pair.reportingLagMs > 0);
    assert.ok(pair.reportingLagDays > 0);
    assert.equal(pair.negativeLagFlagged, false);
  });

  it('rejects missing effectiveTime (PT-2)', () => {
    assertThrowsWithRule(() => buildPublicationEffectivePair({
      publicationTime: FILING_DATE_INITIAL,
    }), 'PT-2');
  });

  it('rejects missing publicationTime (PT-2)', () => {
    assertThrowsWithRule(() => buildPublicationEffectivePair({
      effectiveTime: FISCAL_PERIOD_END,
    }), 'PT-2');
  });

  it('flags negative lag (PT-4)', () => {
    const pair = buildPublicationEffectivePair({
      effectiveTime: '2025-06-30T00:00:00.000Z',
      publicationTime: '2025-05-15T00:00:00.000Z',
    });
    assert.equal(pair.negativeLagFlagged, true);
    assert.ok(pair.reportingLagMs < 0);
  });

  it('result is frozen (PT-1)', () => {
    const pair = buildPublicationEffectivePair({
      effectiveTime: FISCAL_PERIOD_END,
      publicationTime: FILING_DATE_INITIAL,
    });
    assert.ok(Object.isFrozen(pair));
  });
});

// ── Temporal relationship classification (PT-3, PT-4) ──────────────────────────────────────

describe('classifyTemporalRelationship', () => {
  it('classifies RETROSPECTIVE (normal)', () => {
    const result = classifyTemporalRelationship(FISCAL_PERIOD_END, FILING_DATE_INITIAL);
    assert.equal(result.relationship, 'RETROSPECTIVE');
    assert.equal(result.flagged, false);
  });

  it('classifies SAME_DAY', () => {
    const result = classifyTemporalRelationship(
      '2025-05-15T00:00:00.000Z',
      '2025-05-15T00:00:00.000Z',
    );
    assert.equal(result.relationship, 'SAME_DAY');
    assert.equal(result.flagged, false);
  });

  it('classifies PROSPECTIVE and flags (PT-4)', () => {
    const result = classifyTemporalRelationship(
      '2025-06-30T00:00:00.000Z',
      '2025-05-15T00:00:00.000Z',
    );
    assert.equal(result.relationship, 'PROSPECTIVE');
    assert.equal(result.flagged, true);
    assert.ok(result.lagMs < 0);
  });
});

// ── Publication/effective distinct assertion (PT-1, PT-2) ──────────────────────────────────

describe('assertPublicationEffectiveDistinct', () => {
  it('passes for fields with both times', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'PRESENT',
        effectiveTime: FISCAL_PERIOD_END,
        publicationTime: FILING_DATE_INITIAL,
      },
    };
    const result = assertPublicationEffectiveDistinct(fields);
    assert.equal(result.clean, true);
    assert.equal(result.checked, 1);
  });

  it('detects missing effectiveTime (PT-2)', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'PRESENT',
        publicationTime: FILING_DATE_INITIAL,
      },
    };
    const result = assertPublicationEffectiveDistinct(fields);
    assert.equal(result.clean, false);
    assert.ok(result.violations.some((v) => v.includes('PT-2') && v.includes('effectiveTime')));
  });

  it('detects missing publicationTime (PT-2)', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'PRESENT',
        effectiveTime: FISCAL_PERIOD_END,
      },
    };
    const result = assertPublicationEffectiveDistinct(fields);
    assert.equal(result.clean, false);
    assert.ok(result.violations.some((v) => v.includes('PT-2') && v.includes('publicationTime')));
  });

  it('skips non-PRESENT fields', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'NOT_PROVIDED',
      },
    };
    const result = assertPublicationEffectiveDistinct(fields);
    assert.equal(result.clean, true);
    assert.equal(result.checked, 0);
  });
});

// ── Reporting lag distribution (PT-5) ──────────────────────────────────────────────────────

describe('computeReportingLagDistribution', () => {
  it('computes distribution across multiple fields', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'PRESENT',
        effectiveTime: FISCAL_PERIOD_END,
        publicationTime: FILING_DATE_INITIAL,
      },
      'MD:fundamentals.netIncome': {
        availability: 'PRESENT',
        effectiveTime: FISCAL_PERIOD_END,
        publicationTime: FILING_DATE_INITIAL,
      },
    };
    const result = computeReportingLagDistribution(fields);
    assert.equal(result.count, 2);
    assert.ok(result.minLagDays !== null);
    assert.ok(result.maxLagDays !== null);
    assert.equal(result.allRetrospective, true);
  });

  it('returns empty for no fields', () => {
    const result = computeReportingLagDistribution({});
    assert.equal(result.count, 0);
    assert.equal(result.minLagDays, null);
  });

  it('detects prospective entries', () => {
    const fields = {
      'MD:fundamentals.revenue': {
        availability: 'PRESENT',
        effectiveTime: '2025-06-30T00:00:00.000Z',
        publicationTime: '2025-05-15T00:00:00.000Z',
      },
    };
    const result = computeReportingLagDistribution(fields);
    assert.equal(result.anyProspective, true);
    assert.equal(result.allRetrospective, false);
  });
});
