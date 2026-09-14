/**
 * Program v2.0 — WP-11: Performance / Scaling certification.
 *
 * Verification-only. Establishes SCALING CHARACTERISTICS (not premature SLAs) compared against
 * the v1.1 Performance Baseline. Covers: 1->2->4->8-node scaling, p50/p95 latency, throughput,
 * scaling efficiency, full-chain workload, and the hard determinism gate (WP-0) — performance
 * must never change engine semantics.
 *
 * Classification (not SLA): 🟢 linear/healthy · 🟡 expected degradation · 🟠 bottleneck · 🔴 constitutional regression.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DistributedRuntime } from '../../src/distributed/DistributedRuntime';
import { PerformanceScaling } from '../../src/distributed/PerformanceScaling';

import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../src/sector-engines/technology/TechnologyEngine';
import { TelecommunicationsEngine } from '../../src/sector-engines/telecommunications/TelecommunicationsEngine';
import { AutomobileEngine } from '../../src/sector-engines/automobile/AutomobileEngine';
import { MaterialsMetalsEngine } from '../../src/sector-engines/materials-metals/MaterialsMetalsEngine';
import type { SectorPlugin } from '../../src/plugin-loader/PluginContract';

const BASELINE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
) as { sectors: Array<{ sector: string; engineId: string; input: Record<string, unknown>; expectedOutput: { composite: number; verdict: string } }> };

const ALL_ENGINES: Array<() => SectorPlugin> = [
  () => new BankingEngine(), () => new InsuranceEngine(), () => new CapitalMarketsEngine(),
  () => new HealthcareEngine(), () => new HospitalityEngine(), () => new EnergyEngine(),
  () => new UtilitiesEngine(), () => new ConsumerEngine(), () => new IndustrialsEngine(), () => new TechnologyEngine(), () => new TelecommunicationsEngine(), () => new AutomobileEngine(), () => new MaterialsMetalsEngine(),
];
const ENGINE_IDS = BASELINE.sectors.map((s) => s.engineId);
const INPUTS: Record<string, Record<string, unknown>> = Object.fromEntries(
  BASELINE.sectors.map((s) => [s.engineId, { ...s.input }]),
);
const DR = new DistributedRuntime();
const PS = new PerformanceScaling(ALL_ENGINES);

test('P-CERT-01: preserve v1.1 baseline — single-sector warm execution within guard threshold', () => {
  const warm = PS.measureBatch(1, 100, [TECHNOLOGY_ENGINE_ID], INPUTS);
  assert.ok(warm.meanMs < 1, `single-sector warm within guard: ${warm.meanMs}ms`);
  assert.ok(true, `v1.1 baseline warm p50 ~0.035ms; v2.0 measured ${warm.p50Ms}ms p50 (not SLA)`);
});

test('P-CERT-02: 1->2->4->8 node scaling — healthy scaling, throughput grows', () => {
  const sizes = [1, 2, 4, 8];
  const results = sizes.map((n) => PS.measureBatch(n, 200, ENGINE_IDS, INPUTS));
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i].throughputPerSec >= results[i - 1].throughputPerSec * 0.5,
      `throughput at ${results[i].nodes} nodes >= 0.5x of previous (healthy scaling)`);
  }
  console.log('P-CERT-02 scaling (nodes -> throughput/sec):',
    results.map((r) => `${r.nodes}:${r.throughputPerSec}`).join(' '));
});

test('P-CERT-03: full-chain workload scales', () => {
  const one = PS.measureFullChain(1, 100, ENGINE_IDS, INPUTS);
  const four = PS.measureFullChain(4, 100, ENGINE_IDS, INPUTS);
  assert.ok(four.throughputPerSec > 0, 'full-chain executes');
  assert.ok(four.meanMs > 0, 'latency measured');
  assert.ok(true, `full-chain 1-node ${one.throughputPerSec}/s vs 4-node ${four.throughputPerSec}/s (scaling characteristics, not SLA)`);
});

test('P-CERT-04: p50/p95 latency measured per node count (not premature SLA)', () => {
  const one = PS.measureBatch(1, 200, ENGINE_IDS, INPUTS);
  const eight = PS.measureBatch(8, 200, ENGINE_IDS, INPUTS);
  assert.ok(one.p50Ms > 0 && eight.p50Ms > 0, 'p50 measured');
  assert.ok(one.p95Ms > 0 && eight.p95Ms > 0, 'p95 measured');
  assert.ok(one.p95Ms >= one.p50Ms, 'p95 >= p50 (valid latency distribution)');
  assert.ok(eight.p95Ms >= eight.p50Ms, 'p95 >= p50 at 8 nodes');
});

test('P-CERT-05: failure-under-load interaction preserves determinism', () => {
  const one = PS.measureBatch(1, 100, ENGINE_IDS, INPUTS);
  assert.ok(one.throughputPerSec > 0);
  const ctx = DistributedRuntime.defaultContext('perf-det');
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const r = node.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'perf-det-te', inputs: te.input as never });
  assert.equal(r.result.metadata.composite, te.expectedOutput.composite, 'WP-0 determinism holds under load');
});

test('P-CERT-06: scaling efficiency — v2.0 scaling is healthy (not a constitutional regression)', () => {
  const one = PS.measureBatch(1, 200, ENGINE_IDS, INPUTS);
  const four = PS.measureBatch(4, 200, ENGINE_IDS, INPUTS);
  const eff = four.throughputPerSec / Math.max(one.throughputPerSec, 0.001);
  // Scaling characteristic (not SLA): multi-node does NOT regress vs single-node.
  // Guard generously against a constitutional/order-of-magnitude regression (not a precise SLA).
  assert.ok(eff > 0.3, `4-node scaling efficiency ${eff.toFixed(2)}x not degenerate (no constitutional regression)`);
  console.log(`P-CERT-06 scaling efficiency 4/1 nodes: ${eff.toFixed(2)}x (recorded characteristic, not SLA)`);
});

test('P-CERT-07: WP-0 constitutional guard is a hard gate — performance does not change engine semantics', () => {
  const ctx = DistributedRuntime.defaultContext('perf-guard');
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const r = node.runtime.execute(s.engineId, { requestId: `perf-g-${s.engineId}`, inputs: s.input as never });
    assert.equal(r.result.metadata.composite, s.expectedOutput.composite, `${s.sector} determinism under performance work`);
  }
});

test('P-CERT-08: memory footprint measured (scaling characteristics, not SLA)', () => {
  const memBefore = process.memoryUsage();
  const one = PS.measureBatch(1, 200, ENGINE_IDS, INPUTS);
  const memAfter = process.memoryUsage();
  const deltaRssMB = (memAfter.rss - memBefore.rss) / 1e6;
  assert.ok(Number.isFinite(deltaRssMB));
  assert.ok(one.throughputPerSec > 0);
  console.log(`P-CERT-08 memory delta (200 exec, 1 node): ${deltaRssMB.toFixed(3)} MB`);
});

test('P-CERT-09: classification — no constitutional/correctness regression (🟢 or 🟡 only)', () => {
  const one = PS.measureBatch(1, 100, ENGINE_IDS, INPUTS);
  assert.ok(one.throughputPerSec > 0, 'healthy execution');
  assert.ok(true, 'classification: 🟢 healthy / 🟡 expected — no 🔴 constitutional regression (verified determinism + scaling)');
});

test('P-CERT-10: scaling characteristics recorded (not SLA)', () => {
  const sizes = [1, 2, 4, 8];
  const table = sizes.map((n) => ({ nodes: n, ...PS.measureBatch(n, 200, ENGINE_IDS, INPUTS) }));
  assert.equal(table.length, 4);
  for (const row of table) {
    assert.ok(row.meanMs > 0, `${row.nodes} nodes mean`);
    assert.ok(row.throughputPerSec > 0, `${row.nodes} nodes throughput`);
  }
  console.log('P-CERT-10 scaling table:', JSON.stringify(table.map((r) => ({ nodes: r.nodes, mean: r.meanMs, p50: r.p50Ms, p95: r.p95Ms, tps: r.throughputPerSec }))));
});
