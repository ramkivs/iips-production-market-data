/**
 * P14-06 — Non-Regression Oracle Gate Validation Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDeterminism,
  classifyFailure,
  generateOracleReport,
  PRE_EXISTING_FAILURES,
  ORACLE_SPECIFICATION,
} from '../src/nonRegressionOracle.js';
import { p14ViewModel, p14Provenance } from './helpers.js';
import { buildDashboardView } from '../../p13/src/dataSurfaces.js';
import { buildScreenerView } from '../../p13/src/screenerSurface.js';

describe('P14-06 Non-Regression Oracle Gate', () => {
  describe('NRO-6: Pre-existing failures baseline', () => {
    it('pre-existing failures are documented', () => {
      assert.ok(PRE_EXISTING_FAILURES.length > 0);
    });

    it('all pre-existing failures have classification', () => {
      for (const failure of PRE_EXISTING_FAILURES) {
        assert.ok(failure.suite, 'missing suite');
        assert.ok(failure.test, 'missing test');
        assert.ok(failure.classification, 'missing classification');
        assert.equal(failure.classification, 'STALE_BOUNDARY');
        assert.ok(failure.reason, 'missing reason');
      }
    });

    it('pre-existing failures include P05 and P08', () => {
      const suites = [...new Set(PRE_EXISTING_FAILURES.map(f => f.suite))];
      assert.ok(suites.includes('p05'));
      assert.ok(suites.includes('p08'));
    });
  });

  describe('NRO-7: Oracle specification', () => {
    it('oracle has 7 checks', () => {
      assert.equal(ORACLE_SPECIFICATION.checks.length, 7);
    });

    it('oracle checks cover all required areas', () => {
      const ids = ORACLE_SPECIFICATION.checks.map(c => c.id);
      assert.ok(ids.includes('NRO-C1')); // determinism
      assert.ok(ids.includes('NRO-C2')); // provenance integrity
      assert.ok(ids.includes('NRO-C3')); // degradation visibility
      assert.ok(ids.includes('NRO-C4')); // classification labelling
      assert.ok(ids.includes('NRO-C5')); // C6/C7 integrity
      assert.ok(ids.includes('NRO-C6')); // P13 tests
      assert.ok(ids.includes('NRO-C7')); // full regression
    });

    it('oracle exclusions are documented', () => {
      assert.ok(ORACLE_SPECIFICATION.exclusions.replayReproducibility.includes('NOT CLAIMED'));
      assert.ok(ORACLE_SPECIFICATION.exclusions.ad4Revalidation.includes('DEFERRED'));
      assert.ok(ORACLE_SPECIFICATION.exclusions.productionActivation.includes('NOT AUTHORIZED'));
    });
  });

  describe('NRO-C1: Determinism validation', () => {
    it('P13 Dashboard builder is deterministic', () => {
      const data = { revenue: 1000000 };
      const provenance = p14Provenance();
      const result = validateDeterminism(buildDashboardView, [data, provenance], 'UI01');
      assert.equal(result.deterministic, true);
    });

    it('P13 Screener builder is deterministic', () => {
      const provenance = p14Provenance();
      const screenResult = {
        screenId: 'screen-001',
        tenantId: 'tenant-001',
        asOf: '2026-09-13T10:00:00.000Z',
        mode: 'SNAPSHOT',
        totalRows: 1,
        quality: 'good',
        filters: [],
        sort: { field: 'symbol', direction: 'asc' },
        rows: [{ canonicalSecurityId: 'SEC-001', symbol: 'SYM1', _rowQuality: 'good', completenessPct: 100, asOf: '2026-09-13T10:00:00.000Z' }],
      };
      const args = { screenResult, provenance };
      const result = validateDeterminism(buildScreenerView, [args], 'UI05');
      assert.equal(result.deterministic, true);
    });

    it('non-deterministic builder is detected', () => {
      let counter = 0;
      const badBuilder = () => ({ counter: ++counter });
      const result = validateDeterminism(badBuilder, [], 'BAD');
      assert.equal(result.deterministic, false);
    });

    it('builder that throws is detected', () => {
      const throwingBuilder = () => { throw new Error('test error'); };
      const result = validateDeterminism(throwingBuilder, [], 'BAD');
      assert.equal(result.deterministic, false);
      assert.ok(result.detail.includes('Builder threw'));
    });
  });

  describe('NRO-C7: Failure classification', () => {
    it('pre-existing P05 failure is classified as STALE_BOUNDARY', () => {
      const result = classifyFailure('p05', 'existing-iips-boundary');
      assert.equal(result.classification, 'STALE_BOUNDARY');
      assert.equal(result.isRegression, false);
    });

    it('pre-existing P08 failure is classified as STALE_BOUNDARY', () => {
      const result = classifyFailure('p08', 'pitStorageModel-boundary');
      assert.equal(result.classification, 'STALE_BOUNDARY');
      assert.equal(result.isRegression, false);
    });

    it('unknown failure is classified as POTENTIAL_REGRESSION', () => {
      const result = classifyFailure('p13', 'newTestThatFails');
      assert.equal(result.classification, 'POTENTIAL_REGRESSION');
      assert.equal(result.isRegression, true);
    });
  });

  describe('NRO-8: Oracle report generation', () => {
    it('report with all checks passing has PASS verdict', () => {
      const report = generateOracleReport({
        determinismResults: [
          { deterministic: true, surface: 'UI01', detail: 'OK' },
          { deterministic: true, surface: 'UI05', detail: 'OK' },
        ],
        provenanceResults: { totalSurfaces: 19, passed: 19, failed: 0 },
        p13TestResults: { total: 85, pass: 85, fail: 0 },
        regressionResults: { total: 1091, pass: 1078, fail: 13, newFailures: [] },
      });
      assert.equal(report.verdict, 'PASS');
    });

    it('report with new failures has FAIL verdict', () => {
      const report = generateOracleReport({
        determinismResults: [{ deterministic: true, surface: 'UI01', detail: 'OK' }],
        provenanceResults: { totalSurfaces: 19, passed: 19, failed: 0 },
        p13TestResults: { total: 85, pass: 85, fail: 0 },
        regressionResults: { total: 1091, pass: 1077, fail: 14, newFailures: [{ suite: 'p13', test: 'newFailure' }] },
      });
      assert.equal(report.verdict, 'FAIL');
    });

    it('report includes pre-existing failure count', () => {
      const report = generateOracleReport({});
      assert.equal(report.preExistingFailures, PRE_EXISTING_FAILURES.length);
    });

    it('report includes exclusions', () => {
      const report = generateOracleReport({});
      assert.ok(report.exclusions);
      assert.ok(report.exclusions.replayReproducibility.includes('NOT CLAIMED'));
    });
  });
});
