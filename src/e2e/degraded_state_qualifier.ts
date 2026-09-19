/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P15: Degraded-State Propagation & Stale Concession Qualifier
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { QualityState } from '../contracts/types.js';
import { evaluateFreshness } from '../quality/freshness_evaluator.js';
import { rollupQuality } from '../quality/quality_rollup.js';

export interface DegradedStateTestResult {
  scenario: string;
  inputQualities: QualityState[];
  expectedQuality: QualityState;
  actualQuality: QualityState;
  passed: boolean;
}

export interface StaleConcessionTestResult {
  scenario: string;
  ageSeconds: number;
  nominalThresholdSeconds: number;
  concessionActive: boolean;
  suppressExecution: boolean;
  quality: QualityState;
  passed: boolean;
}

export class DegradedStateQualifier {
  /**
   * Qualifies monotonic quality ordering: GOOD -> STALE -> PARTIAL -> UNAVAILABLE
   */
  public static qualifyQualityRollup(): DegradedStateTestResult[] {
    const testCases: Array<{ scenario: string; inputs: QualityState[]; expected: QualityState }> = [
      { scenario: 'All inputs GOOD', inputs: ['GOOD', 'GOOD', 'GOOD'], expected: 'GOOD' },
      { scenario: 'Single STALE degrades to STALE', inputs: ['GOOD', 'STALE', 'GOOD'], expected: 'STALE' },
      { scenario: 'Single PARTIAL degrades STALE to PARTIAL', inputs: ['GOOD', 'STALE', 'PARTIAL'], expected: 'PARTIAL' },
      { scenario: 'Single UNAVAILABLE forces UNAVAILABLE', inputs: ['GOOD', 'PARTIAL', 'UNAVAILABLE'], expected: 'UNAVAILABLE' },
      { scenario: 'Worst-case rollup with duplicate degradations', inputs: ['STALE', 'PARTIAL', 'PARTIAL'], expected: 'PARTIAL' },
    ];

    return testCases.map((tc) => {
      const actual = rollupQuality(tc.inputs);
      return {
        scenario: tc.scenario,
        inputQualities: tc.inputs,
        expectedQuality: tc.expected,
        actualQuality: actual,
        passed: actual === tc.expected,
      };
    });
  }

  /**
   * Qualifies AD-12 stale concession rules:
   * - Age <= Threshold: GOOD (Normal dispatch)
   * - Threshold < Age <= 2*Threshold: STALE (Concession active; usable with warning)
   * - Age > 2*Threshold: UNAVAILABLE (Execution suppressed)
   */
  public static qualifyStaleConcession(): StaleConcessionTestResult[] {
    const now = new Date('2026-09-19T12:00:00.000Z').getTime();

    // D01 Quotes threshold is 15 minutes (900 seconds)
    const thresholdSec = 900;

    const scenarios = [
      {
        scenario: 'Within nominal freshness (age 5m <= 15m)',
        timestamp: new Date(now - 300 * 1000).toISOString(),
        expectedQuality: 'GOOD' as QualityState,
        expectedConcession: false,
        expectedSuppress: false,
      },
      {
        scenario: 'Within stale concession window (age 20m: 15m < age <= 30m)',
        timestamp: new Date(now - 1200 * 1000).toISOString(),
        expectedQuality: 'STALE' as QualityState,
        expectedConcession: true,
        expectedSuppress: false,
      },
      {
        scenario: 'Beyond 2x threshold (age 45m > 30m) -> Execution suppressed',
        timestamp: new Date(now - 2700 * 1000).toISOString(),
        expectedQuality: 'UNAVAILABLE' as QualityState,
        expectedConcession: false,
        expectedSuppress: true,
      },
    ];

    return scenarios.map((s) => {
      const evalRes = evaluateFreshness(s.timestamp, 'D01_QUOTES', new Date(now).toISOString());
      const passed =
        evalRes.quality === s.expectedQuality &&
        evalRes.staleConcessionActive === s.expectedConcession &&
        evalRes.suppressExecution === s.expectedSuppress;

      return {
        scenario: s.scenario,
        ageSeconds: evalRes.ageSeconds,
        nominalThresholdSeconds: thresholdSec,
        concessionActive: evalRes.staleConcessionActive,
        suppressExecution: evalRes.suppressExecution,
        quality: evalRes.quality,
        passed,
      };
    });
  }
}
