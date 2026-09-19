/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-G / Package P16: Empirical Kill-Switch Benchmark & Qualification (P16-03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W6-AUTH-2026-01
 * Authority Threshold: kill-switch cutoff < 250ms
 */

import { EmergencyControlCircuit } from '../operations/emergency_controls.js';
import { computeLineageHash } from '../contracts/provenance.js';

export interface EmpiricalKillSwitchReport {
  testMethodology: string;
  totalTrials: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  medianLatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  thresholdMs: number;
  allTrialsPassed: boolean;
  evidenceDigest: string;
  completedAt: string;
}

export class EmpiricalKillSwitchBenchmark {
  /**
   * Executes N >= 100 trials measuring emergency cutoff response time and dispatch suppression
   */
  public static runBenchmark(trialsCount: number = 100): EmpiricalKillSwitchReport {
    const latencies: number[] = [];

    for (let i = 0; i < trialsCount; i++) {
      // Ensure clean start state
      EmergencyControlCircuit.resetGlobalKillSwitch();
      if (!EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES')) {
        throw new Error(`Circuit state error before trial ${i}`);
      }

      // Benchmark trigger and cut-off verification
      const t0 = performance.now();
      EmergencyControlCircuit.triggerGlobalKillSwitch();
      const isCutOff = !EmergencyControlCircuit.shouldAllowDispatch('D01_QUOTES');
      const t1 = performance.now();

      const elapsedMs = t1 - t0;
      if (!isCutOff) {
        throw new Error(`Kill switch failed to suppress dispatch on trial ${i}`);
      }
      latencies.push(elapsedMs);
    }

    // Clean reset after benchmark
    EmergencyControlCircuit.resetGlobalKillSwitch();

    latencies.sort((a, b) => a - b);

    const minLatencyMs = Math.round(latencies[0] * 1000) / 1000;
    const maxLatencyMs = Math.round(latencies[latencies.length - 1] * 1000) / 1000;
    const medianLatencyMs = Math.round(latencies[Math.floor(latencies.length / 2)] * 1000) / 1000;
    const p90LatencyMs = Math.round(latencies[Math.floor(latencies.length * 0.9)] * 1000) / 1000;
    const p95LatencyMs = Math.round(latencies[Math.floor(latencies.length * 0.95)] * 1000) / 1000;
    const p99LatencyMs = Math.round(latencies[Math.floor(latencies.length * 0.99)] * 1000) / 1000;

    const thresholdMs = 250.0;
    const allTrialsPassed = maxLatencyMs < thresholdMs;

    const evidencePayload = {
      trialsCount,
      minLatencyMs,
      maxLatencyMs,
      medianLatencyMs,
      p90LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      thresholdMs,
      allTrialsPassed,
    };

    const evidenceDigest = computeLineageHash(evidencePayload, {
      sourceClassification: 'CERTIFIED_ENGINE',
      asOf: '2026-09-19T00:00:00.000Z',
      dataVersion: 'v1.0.0-kill-switch-empirical',
    });

    return {
      testMethodology: 'Controlled in-memory emergency kill-switch trigger and instantaneous dispatch cut-off latency measurement across N trials',
      totalTrials: trialsCount,
      minLatencyMs,
      maxLatencyMs,
      medianLatencyMs,
      p90LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      thresholdMs,
      allTrialsPassed,
      evidenceDigest,
      completedAt: new Date().toISOString(),
    };
  }
}
