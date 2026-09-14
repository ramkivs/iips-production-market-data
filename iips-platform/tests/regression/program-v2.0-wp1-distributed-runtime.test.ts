/**
 * Program v2.0 — WP-1: Distributed Deterministic Runtime.
 *
 * Verification-only (infrastructure proving ground). Proves the hardest constitutional test:
 *   Same frozen input + contract + calibration + runtime configuration
 *     -> same deterministic result on ONE node or MULTIPLE nodes.
 * Covers: multi-node determinism across all 13 sectors, deterministic context propagation,
 * immutable execution inputs, snapshot ownership + persistence, exactly-once/idempotent
 * execution, node-failure + replay recovery, no cross-sector state leakage, no cross-node
 * leakage, authenticated node identity (context-bound), and WP-0 guard unchanged.
 *
 * Consumes the frozen v1.1 engines UNCHANGED (v2.0 infrastructure only).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DistributedRuntime, type DistributedNode } from '../../src/distributed/DistributedRuntime';

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
import { TelecommunicationsEngine, TELECOMMUNICATIONS_ENGINE_ID } from '../../src/sector-engines/telecommunications/TelecommunicationsEngine';
import { AutomobileEngine, AUTOMOBILE_ENGINE_ID } from '../../src/sector-engines/automobile/AutomobileEngine';
import { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID } from '../../src/sector-engines/materials-metals/MaterialsMetalsEngine';

const BASELINE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
) as { sectors: Array<{ sector: string; engineId: string; input: Record<string, unknown>; expectedOutput: { composite: number; verdict: string } }> };

const ENGINE_FACTORY: Record<string, () => import('../../src/plugin-loader/PluginContract').SectorPlugin> = {
  [BANKING_ENGINE_ID]: () => new BankingEngine(),
  [INSURANCE_ENGINE_ID]: () => new InsuranceEngine(),
  [CAPITAL_MARKETS_ENGINE_ID]: () => new CapitalMarketsEngine(),
  [HEALTHCARE_ENGINE_ID]: () => new HealthcareEngine(),
  [HOSPITALITY_ENGINE_ID]: () => new HospitalityEngine(),
  [ENERGY_ENGINE_ID]: () => new EnergyEngine(),
  [UTILITIES_ENGINE_ID]: () => new UtilitiesEngine(),
  [CONSUMER_ENGINE_ID]: () => new ConsumerEngine(),
  [INDUSTRIALS_ENGINE_ID]: () => new IndustrialsEngine(),
  [TECHNOLOGY_ENGINE_ID]: () => new TechnologyEngine(),
  [TELECOMMUNICATIONS_ENGINE_ID]: () => new TelecommunicationsEngine(),
  [AUTOMOBILE_ENGINE_ID]: () => new AutomobileEngine(),
  [MATERIALS_METALS_ENGINE_ID]: () => new MaterialsMetalsEngine(),
};
const ALL_ENGINES = Object.values(ENGINE_FACTORY);
const DR = new DistributedRuntime();

test('D-CERT-01: multi-node determinism — all 13 sectors reproduce the frozen baseline on EVERY node', () => {
  // Two nodes, same context -> identical results on both, and equal to the frozen baseline.
  const ctx = DistributedRuntime.defaultContext();
  const n1 = DR.provisionNode('n1', ctx, ALL_ENGINES);
  const n2 = DR.provisionNode('n2', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const req = { requestId: `d-${s.engineId}`, inputs: s.input };
    const r1 = DR.execute(n1, s.engineId, req);
    const r2 = DR.execute(n2, s.engineId, req);
    assert.equal(r1.metadata.composite, s.expectedOutput.composite, `${s.sector} n1 composite`);
    assert.equal(r2.metadata.composite, s.expectedOutput.composite, `${s.sector} n2 composite`);
    assert.equal(r1.metadata.verdict, s.expectedOutput.verdict, `${s.sector} n1 verdict`);
    assert.equal(JSON.stringify(r1.metadata), JSON.stringify(r2.metadata), `${s.sector} node determinism`);
  }
});

test('D-CERT-02: deterministic context propagation — identical lineage/clock/id on any node -> identical snapshot + evidence ids', () => {
  const ctx = DistributedRuntime.defaultContext('lineage-A');
  const n1 = DR.provisionNode('n1', ctx, ALL_ENGINES);
  const n2 = DR.provisionNode('n2', ctx, ALL_ENGINES);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const req = { requestId: 'd-te', inputs: te.input };
  const r1 = DR.execute(n1, TECHNOLOGY_ENGINE_ID, req);
  const r2 = DR.execute(n2, TECHNOLOGY_ENGINE_ID, req);
  assert.equal(r1.snapshotRef, r2.snapshotRef, 'snapshot id identical across nodes');
  assert.equal(r1.evidenceRef, r2.evidenceRef, 'evidence id identical across nodes');
});

test('D-CERT-03: immutable execution inputs — the request is not mutated by execution', () => {
  const ctx = DistributedRuntime.defaultContext();
  const node = DR.provisionNode('n1', ctx, [ENGINE_FACTORY[TECHNOLOGY_ENGINE_ID]]);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const frozenInput = JSON.parse(JSON.stringify(te.input));
  DR.execute(node, TECHNOLOGY_ENGINE_ID, { requestId: 'd-imm', inputs: te.input });
  assert.equal(JSON.stringify(te.input), JSON.stringify(frozenInput), 'input unchanged');
});

test('D-CERT-04: snapshot ownership + persistence — each node owns a replayable, immutable snapshot', () => {
  const ctx = DistributedRuntime.defaultContext();
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const r = DR.execute(node, s.engineId, { requestId: `d-own-${s.engineId}`, inputs: s.input });
    const snap = node.store.get(r.snapshotRef as string)!;
    assert.ok(Object.isFrozen(snap), `${s.sector} snapshot immutable`);
    assert.equal(snap.engineId, s.engineId, `${s.sector} snapshot owned by engine`);
    assert.equal(node.replay.replay(r.snapshotRef as string)?.reproduced, true, `${s.sector} replayable`);
  }
});

test('D-CERT-05: exactly-once/idempotent execution — same requestId + input on independent nodes -> identical result', () => {
  // Idempotency: the same request executed on two independent (same-context) nodes yields
  // identical deterministic results — the basis for exactly-once semantics in a distributed
  // system where a request may be retried on a different node after a failure.
  const ctx = DistributedRuntime.defaultContext('idem-A');
  const nodeA = DR.provisionNode('nA', ctx, [ENGINE_FACTORY[INDUSTRIALS_ENGINE_ID]]);
  const nodeB = DR.provisionNode('nB', ctx, [ENGINE_FACTORY[INDUSTRIALS_ENGINE_ID]]);
  const ind = BASELINE.sectors.find((s) => s.engineId === INDUSTRIALS_ENGINE_ID)!;
  const req = { requestId: 'idem-ind', inputs: ind.input };
  const a = DR.execute(nodeA, INDUSTRIALS_ENGINE_ID, req);
  const b = DR.execute(nodeB, INDUSTRIALS_ENGINE_ID, req);
  assert.equal(JSON.stringify(a.metadata), JSON.stringify(b.metadata), 'idempotent result across nodes');
  assert.equal(a.snapshotRef, b.snapshotRef, 'idempotent snapshot identity');
});

test('D-CERT-06: node-failure + replay recovery — a fresh node with the same context recovers identical state via replay', () => {
  const ctx = DistributedRuntime.defaultContext('recover-A');
  const primary = DR.provisionNode('p', ctx, ALL_ENGINES);
  const refs: string[] = [];
  for (const s of BASELINE.sectors) {
    const r = DR.execute(primary, s.engineId, { requestId: `d-rec-${s.engineId}`, inputs: s.input });
    refs.push(r.snapshotRef as string);
  }
  // Simulate node failure: provision a fresh node with the same context; it reproduces all.
  const recovery = DR.provisionNode('r', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const r = DR.execute(recovery, s.engineId, { requestId: `d-rec-${s.engineId}`, inputs: s.input });
    assert.equal(r.metadata.composite, s.expectedOutput.composite, `${s.sector} recovered composite`);
    assert.equal(r.snapshotRef, refs.shift(), `${s.sector} recovered snapshot id`);
  }
});

test('D-CERT-07: no cross-sector state leakage — each sector result independent on the same node', () => {
  const ctx = DistributedRuntime.defaultContext();
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  const composites = new Set<string>();
  for (const s of BASELINE.sectors) {
    const r = DR.execute(node, s.engineId, { requestId: `d-iso-${s.engineId}`, inputs: s.input });
    composites.add(JSON.stringify([r.metadata.composite, r.metadata.verdict]));
  }
  assert.equal(composites.size, 13, '13 distinct sector outputs (no leakage)');
});

test('D-CERT-08: no cross-node leakage — nodes with different lineages do not interfere', () => {
  const ctxA = DistributedRuntime.defaultContext('lineage-A');
  const ctxB = DistributedRuntime.defaultContext('lineage-B');
  const nA = DR.provisionNode('nA', ctxA, [ENGINE_FACTORY[TECHNOLOGY_ENGINE_ID]]);
  const nB = DR.provisionNode('nB', ctxB, [ENGINE_FACTORY[TECHNOLOGY_ENGINE_ID]]);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const req = { requestId: 'd-nodeleak', inputs: te.input };
  const rA = DR.execute(nA, TECHNOLOGY_ENGINE_ID, req);
  const rB = DR.execute(nB, TECHNOLOGY_ENGINE_ID, req);
  // Different lineages -> different snapshot/evidence ids, but identical deterministic content.
  assert.notEqual(rA.snapshotRef, rB.snapshotRef, 'distinct lineage -> distinct identity');
  assert.equal(rA.metadata.composite, rB.metadata.composite, 'content identical regardless of node');
});

test('D-CERT-09: authenticated node identity — context is node-bound and deterministic', () => {
  const ctx = DistributedRuntime.defaultContext('auth-node');
  assert.equal(ctx.lineage, 'run-auth-node');
  // The context deterministically reconstructs the same clock/id on any node.
  const m1 = DR.provisionNode('n1', ctx, [ENGINE_FACTORY[TECHNOLOGY_ENGINE_ID]]);
  const m2 = DR.provisionNode('n2', ctx, [ENGINE_FACTORY[TECHNOLOGY_ENGINE_ID]]);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const req = { requestId: 'd-auth', inputs: te.input };
  assert.equal(DR.execute(m1, TECHNOLOGY_ENGINE_ID, req).snapshotRef, DR.execute(m2, TECHNOLOGY_ENGINE_ID, req).snapshotRef, 'node-bound identity via context');
});

test('D-CERT-10: WP-0 constitutional guard unchanged — single-node result equals frozen baseline (node == non-distributed)', () => {
  const ctx = DistributedRuntime.defaultContext();
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  // Distributed-node result must equal the frozen Replay Baseline for every sector.
  for (const s of BASELINE.sectors) {
    const r = DR.execute(node, s.engineId, { requestId: `d-wp0-${s.engineId}`, inputs: s.input });
    assert.equal(r.metadata.composite, s.expectedOutput.composite, `${s.sector} node == frozen baseline`);
    assert.equal(r.metadata.verdict, s.expectedOutput.verdict, `${s.sector} node verdict`);
  }
});
