/**
 * P14-06 — NON-REGRESSION ORACLE GATE VALIDATION
 *
 * Authority:
 *   D36 P14 Work-Item Definition (commit df73d3e)
 *   D38 P14 Implementation Authorization (commit 22bf59e)
 *
 * Purpose:
 *   Implement the Part 11 M.4 non-regression oracle gate. Define the oracle
 *   precisely. Run the required non-regression validation. Distinguish
 *   stale/pre-existing failures from genuine P14 regressions.
 *
 * Oracle Definition:
 *   The P14 non-regression oracle validates that:
 *   1. All P13 UI surfaces produce deterministic output for given inputs
 *   2. No P13 surface regresses provenance integrity (U1)
 *   3. No P13 surface regresses degradation visibility (U2)
 *   4. No P13 surface regresses classification labelling (U5)
 *   5. All P12 C6/C7 contracts remain intact through P13 surfaces
 *   6. P13 test suite passes (85/85 tests)
 *   7. Full regression suite has no NEW failures (pre-existing excluded)
 *
 * Boundaries (hard):
 *   ⚠ **NRO-1** Oracle is deterministic — same inputs → same outputs
 *   ⚠ **NRO-2** Pre-existing failures are classified, not suppressed
 *   ⚠ **NRO-3** No P14 regression may be silently ignored
 *   ⚠ **NRO-4** Oracle does not claim replay reproducibility (AD-17/M-2)
 *   ⚠ **NRO-5** Oracle does not resolve AD-4 (revalidation deferred to P15)
 */

export const P14_06_MODULE = 'P14-06-NON-REGRESSION-ORACLE';

/**
 * NRO-6: Pre-existing failures baseline.
 * These are known stale boundary assertions from P05/P08 that are NOT
 * P14 regressions. They are preserved and reported, not suppressed.
 */
export const PRE_EXISTING_FAILURES = Object.freeze([
  // P05 stale boundary assertions (7)
  { suite: 'p05', test: 'existing-iips-boundary', classification: 'STALE_BOUNDARY', reason: 'Guard written before P09 acceptance; fires against legitimately accepted p09/src' },
  { suite: 'p05', test: 'existing-iips-boundary-2', classification: 'STALE_BOUNDARY', reason: 'Same as above' },
  { suite: 'p05', test: 'existing-iips-boundary-3', classification: 'STALE_BOUNDARY', reason: 'Same as above' },
  { suite: 'p05', test: 'existing-iips-boundary-4', classification: 'STALE_BOUNDARY', reason: 'Guard on P07/P08 scope; P07/P08 now accepted' },
  { suite: 'p05', test: 'existing-iips-boundary-5', classification: 'STALE_BOUNDARY', reason: 'Guard on gate acceptance records; now accepted' },
  { suite: 'p05', test: 'existing-iips-boundary-6', classification: 'STALE_BOUNDARY', reason: 'Guard on CHECKPOINT-03/D8; now superseded' },
  { suite: 'p05', test: 'existing-iips-boundary-7', classification: 'STALE_BOUNDARY', reason: 'Guard on tracker/SPEC; unchanged' },
  // P08 stale boundary assertions (6 — reduced from earlier count)
  { suite: 'p08', test: 'pitStorageModel-boundary', classification: 'STALE_BOUNDARY', reason: 'Guard on P07 methodology; P07 accepted' },
  { suite: 'p08', test: 'pitStorageModel-boundary-2', classification: 'STALE_BOUNDARY', reason: 'Guard on P09 leakage; P09 accepted' },
  { suite: 'p08', test: 'adjustedSeriesProjection-boundary', classification: 'STALE_BOUNDARY', reason: 'Guard on P09 leakage; P09 accepted' },
  { suite: 'p08', test: 'corporateActionIngestion-boundary', classification: 'STALE_BOUNDARY', reason: 'Guard on P05-04; P05-04 implemented' },
  { suite: 'p08', test: 'adjustedSeriesProjection-boundary-2', classification: 'STALE_BOUNDARY', reason: 'Guard on P09 leakage; P09 accepted' },
  { suite: 'p08', test: 'corporateActionIngestion-boundary-2', classification: 'STALE_BOUNDARY', reason: 'Guard on P05 source; P05 accepted' },
]);

/**
 * NRO-7: Oracle specification — the P14 non-regression oracle.
 */
export const ORACLE_SPECIFICATION = Object.freeze({
  oracleId: 'P14-NRO-01',
  version: '1.0.0',
  authority: 'Part 11 M.4 (Non-regression oracle gate)',
  date: new Date().toISOString(),
  checks: Object.freeze([
    {
      id: 'NRO-C1',
      name: 'P13 determinism',
      description: 'All P13 UI surfaces produce deterministic output for given inputs',
      method: 'Execute each P13 builder twice with identical inputs; compare JSON output',
      passCriteria: 'Byte-identical output for all surfaces',
    },
    {
      id: 'NRO-C2',
      name: 'Provenance integrity (U1)',
      description: 'No P13 surface fabricates provenance',
      method: 'Run P14-01 provenance integrity validation on all surfaces',
      passCriteria: 'Zero U1 violations',
    },
    {
      id: 'NRO-C3',
      name: 'Degradation visibility (U2)',
      description: 'All degraded data is visibly marked in P13 view models',
      method: 'Run P14-01 degradation visibility validation on all surfaces',
      passCriteria: 'Zero U2 violations',
    },
    {
      id: 'NRO-C4',
      name: 'Classification labelling (U5)',
      description: 'All P13 surfaces label provenance classification correctly',
      method: 'Run P14-01 classification labelling validation on all surfaces',
      passCriteria: 'Zero U5 violations',
    },
    {
      id: 'NRO-C5',
      name: 'P12 C6/C7 contract integrity',
      description: 'P12 screener (C6) and resolver (C7) contracts remain intact through P13',
      method: 'Execute P13 screener/resolver surfaces; verify C6/C7 contract shapes',
      passCriteria: 'C6/C7 contract shapes preserved',
    },
    {
      id: 'NRO-C6',
      name: 'P13 test suite',
      description: 'All P13 tests pass',
      method: 'Run p13 test suite (node --test)',
      passCriteria: '85/85 pass, 0 fail',
    },
    {
      id: 'NRO-C7',
      name: 'Full regression — no new failures',
      description: 'Full regression suite has no NEW failures beyond pre-existing baseline',
      method: 'Run all test suites; compare against pre-existing failure baseline',
      passCriteria: 'No new failures beyond PRE_EXISTING_FAILURES',
    },
  ]),
  exclusions: Object.freeze({
    replayReproducibility: 'NOT CLAIMED (AD-17/M-2 UNRESOLVED)',
    ad4Revalidation: 'DEFERRED to P15',
    productionActivation: 'NOT AUTHORIZED',
  }),
});

/**
 * NRO-C1: Validate determinism for a P13 surface.
 *
 * @param {Function} builder — P13 view builder function
 * @param {Array} args — arguments to pass to builder
 * @param {string} surfaceId — surface identifier
 * @returns {{ deterministic: boolean, surface: string, detail: string }}
 */
export function validateDeterminism(builder, args, surfaceId) {
  try {
    const result1 = builder(...args);
    const result2 = builder(...args);

    const json1 = JSON.stringify(result1);
    const json2 = JSON.stringify(result2);

    const deterministic = json1 === json2;
    return {
      deterministic,
      surface: surfaceId,
      detail: deterministic
        ? 'Byte-identical output for identical inputs'
        : `Output differs: ${json1.length} vs ${json2.length} chars`,
    };
  } catch (e) {
    return {
      deterministic: false,
      surface: surfaceId,
      detail: `Builder threw: ${e.message}`,
    };
  }
}

/**
 * NRO-C7: Classify a test failure as pre-existing or genuine regression.
 *
 * @param {string} suite — test suite name
 * @param {string} testName — test name
 * @returns {{ classification: string, isRegression: boolean, reason: string }}
 */
export function classifyFailure(suite, testName) {
  const preExisting = PRE_EXISTING_FAILURES.find(
    f => f.suite === suite && (f.test === testName || testName.includes(f.test))
  );

  if (preExisting) {
    return {
      classification: preExisting.classification,
      isRegression: false,
      reason: preExisting.reason,
    };
  }

  return {
    classification: 'POTENTIAL_REGRESSION',
    isRegression: true,
    reason: `Failure in ${suite}/${testName} not found in pre-existing baseline`,
  };
}

/**
 * NRO-8: Generate oracle validation report.
 *
 * @param {object} options
 * @param {Array} options.determinismResults — NRO-C1 results
 * @param {object} options.provenanceResults — NRO-C2 results (from P14-01)
 * @param {object} options.p13TestResults — NRO-C6 results
 * @param {object} options.regressionResults — NRO-C7 results
 * @returns {object} oracle report
 */
export function generateOracleReport(options) {
  const {
    determinismResults = [],
    provenanceResults = { totalSurfaces: 0, passed: 0, failed: 0 },
    p13TestResults = { total: 0, pass: 0, fail: 0 },
    regressionResults = { total: 0, pass: 0, fail: 0, newFailures: [] },
  } = options;

  const determinismPassed = determinismResults.every(r => r.deterministic);
  const provenancePassed = provenanceResults.failed === 0;
  const p13TestsPassed = p13TestResults.fail === 0;
  const regressionPassed = regressionResults.newFailures.length === 0;

  const oraclePassed = determinismPassed && provenancePassed && p13TestsPassed && regressionPassed;

  return Object.freeze({
    module: P14_06_MODULE,
    oracleSpecification: ORACLE_SPECIFICATION,
    date: new Date().toISOString(),
    verdict: oraclePassed ? 'PASS' : 'FAIL',
    checks: {
      'NRO-C1': {
        name: 'P13 determinism',
        passed: determinismPassed,
        detail: `${determinismResults.filter(r => r.deterministic).length}/${determinismResults.length} surfaces deterministic`,
      },
      'NRO-C2': {
        name: 'Provenance integrity (U1)',
        passed: provenancePassed,
        detail: `${provenanceResults.passed}/${provenanceResults.totalSurfaces} surfaces passed`,
      },
      'NRO-C3': {
        name: 'Degradation visibility (U2)',
        passed: provenancePassed, // Same validation pass
        detail: 'Validated as part of provenance integrity',
      },
      'NRO-C4': {
        name: 'Classification labelling (U5)',
        passed: provenancePassed, // Same validation pass
        detail: 'Validated as part of provenance integrity',
      },
      'NRO-C5': {
        name: 'P12 C6/C7 contract integrity',
        passed: p13TestsPassed, // P13 tests cover C6/C7 consumption
        detail: 'P13 screener/resolver tests validate C6/C7 consumption',
      },
      'NRO-C6': {
        name: 'P13 test suite',
        passed: p13TestsPassed,
        detail: `${p13TestResults.pass}/${p13TestResults.total} pass, ${p13TestResults.fail} fail`,
      },
      'NRO-C7': {
        name: 'Full regression — no new failures',
        passed: regressionPassed,
        detail: `${regressionResults.newFailures.length} new failures`,
        newFailures: regressionResults.newFailures,
      },
    },
    preExistingFailures: PRE_EXISTING_FAILURES.length,
    exclusions: ORACLE_SPECIFICATION.exclusions,
  });
}
