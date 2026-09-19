/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P17: Quantitative SLO & Health Evaluator
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

export interface SLOMetricResult {
  sloName: string;
  targetThreshold: string;
  measuredValue: number;
  unit: string;
  passed: boolean;
  notes?: string;
}

export interface SLOSuiteReport {
  overallPassed: boolean;
  evaluatedAt: string;
  results: SLOMetricResult[];
}

export class SLOEvaluator {
  /**
   * Evaluates local system performance against accepted quantitative SLO targets.
   */
  public static evaluateAll(metrics: {
    d01LatencyMs: number;
    d01FreshnessAgeSec: number;
    d02EodDeliveryTimeIST: string; // e.g. "18:15"
    d03StatementAgeDays: number;
    parserErrorRatePct: number;
    killSwitchResponseMs: number;
  }): SLOSuiteReport {
    const results: SLOMetricResult[] = [];

    // 1. D01 Latency < 500ms
    results.push({
      sloName: 'D01_QUOTE_LATENCY',
      targetThreshold: '< 500 ms',
      measuredValue: metrics.d01LatencyMs,
      unit: 'ms',
      passed: metrics.d01LatencyMs < 500,
    });

    // 2. D01 Intraday Freshness <= 15m (900s)
    results.push({
      sloName: 'D01_INTRADAY_FRESHNESS',
      targetThreshold: '<= 900 s (15 min)',
      measuredValue: metrics.d01FreshnessAgeSec,
      unit: 's',
      passed: metrics.d01FreshnessAgeSec <= 900,
    });

    // 3. D02 EOD Delivery by 18:30 IST
    const [hours, minutes] = metrics.d02EodDeliveryTimeIST.split(':').map(Number);
    const eodMinutes = hours * 60 + minutes;
    const targetMinutes = 18 * 60 + 30; // 18:30
    results.push({
      sloName: 'D02_EOD_DELIVERY_TIME',
      targetThreshold: '<= 18:30 IST',
      measuredValue: eodMinutes,
      unit: 'min-of-day',
      passed: eodMinutes <= targetMinutes,
      notes: `Delivered at ${metrics.d02EodDeliveryTimeIST} IST`,
    });

    // 4. D03 Statement Freshness <= 105 days
    results.push({
      sloName: 'D03_STATEMENT_FRESHNESS',
      targetThreshold: '<= 105 days',
      measuredValue: metrics.d03StatementAgeDays,
      unit: 'days',
      passed: metrics.d03StatementAgeDays <= 105,
    });

    // 5. Parser Error Rate < 0.01%
    results.push({
      sloName: 'INGRESS_PARSER_ERROR_RATE',
      targetThreshold: '< 0.01 %',
      measuredValue: metrics.parserErrorRatePct,
      unit: '%',
      passed: metrics.parserErrorRatePct < 0.01,
    });

    // 6. Emergency Kill-Switch Response < 250ms
    results.push({
      sloName: 'KILL_SWITCH_RESPONSE_TIME',
      targetThreshold: '< 250 ms',
      measuredValue: metrics.killSwitchResponseMs,
      unit: 'ms',
      passed: metrics.killSwitchResponseMs < 250,
    });

    const overallPassed = results.every((r) => r.passed);

    return {
      overallPassed,
      evaluatedAt: new Date().toISOString(),
      results,
    };
  }
}
