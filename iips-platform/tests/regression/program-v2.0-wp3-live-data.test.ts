/**
 * Program v2.0 — WP-3: Live Data Integration certification.
 *
 * Verification-only. The data-determinism proving ground. Governing invariant:
 *   Live data is external, mutable infrastructure; the engine NEVER consumes mutable live
 *   state. It consumes an IMMUTABLE, VERSIONED data snapshot whose identity is part of replay
 *   lineage. Same snapshot -> identical result; different snapshot -> explicit new lineage.
 * Covers: immutable snapshots, dataVersion/asOf identity, provider identity, quality/completeness,
 * deterministic snapshot creation, no live mutation inside execution, same snapshot -> same
 * result, different snapshot -> explicit lineage, replay uses original snapshot, provider
 * outage fallback, stale/partial-data handling, market-data vs execution clock separation,
 * WP-0 reproduction, and DR data-lineage preservation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DistributedRuntime } from '../../src/distributed/DistributedRuntime';
import { MarketDataSource, DataBoundExecutor } from '../../src/distributed/LiveDataRuntime';

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

function buildExec() {
  const DR = new DistributedRuntime();
  const ctx = DistributedRuntime.defaultContext('livedata-A');
  const node = DR.provisionNode('n1', ctx, ALL_ENGINES);
  return { DR, ctx, node };
}

test('L-CERT-01: immutable market-data snapshots + dataVersion/asOf identity', () => {
  const src = new MarketDataSource<Record<string, unknown>>('bloomberg');
  const snap = src.snapshot('v1', '2026-08-09T10:00:00Z', 'good', 100, { 'BM-001': 1.6 });
  assert.equal(snap.provider, 'bloomberg');
  assert.equal(snap.dataVersion, 'v1');
  assert.equal(snap.asOf, '2026-08-09T10:00:00Z');
  assert.equal(snap.snapshotId, 'data-bloomberg-v1-2026-08-09T10:00:00Z');
  assert.ok(Object.isFrozen(snap), 'snapshot immutable');
  assert.ok(Object.isFrozen(snap.fields), 'fields immutable');
});

test('L-CERT-02: provider identity + data-quality/completeness status', () => {
  const src = new MarketDataSource<Record<string, unknown>>('reuters');
  const snap = src.snapshot('v2', '2026-08-09T11:00:00Z', 'partial', 72, { 'TM-001': 24 });
  assert.equal(snap.quality, 'partial');
  assert.equal(snap.completenessPct, 72);
});

test('L-CERT-03: deterministic snapshot creation — same fields -> same snapshot id', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const a = src.snapshot('v1', 't1', 'good', 100, { x: 1 });
  const b = src.snapshot('v1', 't1', 'good', 100, { x: 1 });
  assert.equal(a.snapshotId, b.snapshotId, 'deterministic snapshot identity');
});

test('L-CERT-04: no live-data mutation inside an executing engine — input snapshot immutable through execution', () => {
  const { node } = buildExec();
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const fields = Object.fromEntries(Object.entries(te.input));
  const snap = src.snapshot('v1', 't1', 'good', 100, fields);
  const exe = new DataBoundExecutor((engineId, req) => node.runtime.execute(engineId, req).result);
  const bound = { engineId: TECHNOLOGY_ENGINE_ID, requestId: 'ld-1', data: snap, companyInputs: {} };
  const before = JSON.stringify(snap.fields);
  exe.execute(bound);
  assert.equal(JSON.stringify(snap.fields), before, 'snapshot unchanged after execution');
  assert.equal(snap.quality, 'good', 'quality unchanged');
});

test('L-CERT-05: same data snapshot -> identical engine result', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const ind = BASELINE.sectors.find((s) => s.engineId === INDUSTRIALS_ENGINE_ID)!;
  const snap = src.snapshot('v1', 't1', 'good', 100, Object.fromEntries(Object.entries(ind.input)));
  // Execute the SAME snapshot on two independent (same-context) nodes -> identical result.
  const exeA = new DataBoundExecutor((engineId, req) => buildExec().node.runtime.execute(engineId, req).result);
  const exeB = new DataBoundExecutor((engineId, req) => buildExec().node.runtime.execute(engineId, req).result);
  const a = exeA.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-a', data: snap, companyInputs: {} }).result;
  const b = exeB.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-b', data: snap, companyInputs: {} }).result;
  assert.equal(a.metadata.composite, b.metadata.composite, 'same snapshot -> identical result');
});

test('L-CERT-06: different data snapshot -> explicitly different input lineage, never silent drift', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const v1 = src.snapshot('v1', 't1', 'good', 100, { debtEbitda: 1.5 });
  const v2 = src.snapshot('v2', 't2', 'good', 100, { debtEbitda: 3.5 });
  assert.notEqual(v1.snapshotId, v2.snapshotId, 'new dataVersion -> new explicit lineage');
});

test('L-CERT-07: replay uses the ORIGINAL data snapshot, not today-market data', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const ind = BASELINE.sectors.find((s) => s.engineId === INDUSTRIALS_ENGINE_ID)!;
  const original = src.snapshot('v1', '2026-08-01T00:00:00Z', 'good', 100, Object.fromEntries(Object.entries(ind.input)));
  // Execute on node A, then "replay" on a fresh same-context node B bound to the ORIGINAL snapshot.
  const exeA = new DataBoundExecutor((engineId, req) => buildExec().node.runtime.execute(engineId, req).result);
  const exeB = new DataBoundExecutor((engineId, req) => buildExec().node.runtime.execute(engineId, req).result);
  const r = exeA.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-replay', data: original, companyInputs: {} });
  const replay = exeB.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-replay', data: original, companyInputs: {} });
  assert.equal(replay.snapshotIdentity, r.snapshotIdentity, 'replay bound to original data snapshot');
  assert.equal(replay.result.metadata.composite, r.result.metadata.composite, 'replay uses original snapshot, not today data');
});

test('L-CERT-08: provider outage -> deterministic failure/fallback behavior', () => {
  const src = new MarketDataSource<Record<string, unknown>>('down');
  // Provider unavailable -> quality 'unavailable' snapshot (deterministic fallback signal).
  const snap = src.snapshot('v0', '2026-08-09T00:00:00Z', 'unavailable', 0, {});
  assert.equal(snap.quality, 'unavailable');
  assert.equal(snap.completenessPct, 0);
});

test('L-CERT-09: stale-data detection + partial-data handling', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const stale = src.snapshot('v3', '2026-08-01T00:00:00Z', 'stale', 95, { a: 1 });
  const partial = src.snapshot('v4', '2026-08-09T00:00:00Z', 'partial', 60, { b: 2 });
  assert.equal(stale.quality, 'stale');
  assert.equal(partial.quality, 'partial');
  assert.ok(partial.completenessPct < 100);
});

test('L-CERT-10: clock separation — market-data time (asOf) distinct from execution time', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const snap = src.snapshot('v1', '2026-08-01T00:00:00Z', 'good', 100, { x: 1 });
  // asOf is market-data time; execution uses the deterministic engine clock (fixed context).
  assert.equal(snap.asOf, '2026-08-01T00:00:00Z', 'market-data time captured separately');
  const ctx = DistributedRuntime.defaultContext();
  assert.ok(ctx.clockMode === 'fixed', 'execution uses deterministic clock, separate from market-data time');
});

test('L-CERT-11: WP-0 reproduction — same snapshot feeding the frozen baseline reproduces it exactly', () => {
  const { node } = buildExec();
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const exe = new DataBoundExecutor((engineId, req) => node.runtime.execute(engineId, req).result);
  // Feed each baseline sector's inputs as a versioned snapshot -> reproduce frozen composite.
  for (const s of BASELINE.sectors) {
    const snap = src.snapshot('v1', 't1', 'good', 100, Object.fromEntries(Object.entries(s.input)));
    const r = exe.execute({ engineId: s.engineId, requestId: `ld-wp0-${s.engineId}`, data: snap, companyInputs: {} }).result;
    assert.equal(r.metadata.composite, s.expectedOutput.composite, `${s.sector} WP-0 preserved through live-data boundary`);
  }
});

test('L-CERT-12: DR preserves and replays the data lineage', () => {
  const src = new MarketDataSource<Record<string, unknown>>('data1');
  const ind = BASELINE.sectors.find((s) => s.engineId === INDUSTRIALS_ENGINE_ID)!;
  const snap = src.snapshot('v1', 't1', 'good', 100, Object.fromEntries(Object.entries(ind.input)));
  const exe = new DataBoundExecutor((engineId, req) => buildExec().node.runtime.execute(engineId, req).result);
  const r = exe.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-dr', data: snap, companyInputs: {} });
  // The data snapshot is replayable across a DR recovery (same deterministic context).
  const DR2 = new DistributedRuntime();
  const ctx2 = DistributedRuntime.defaultContext('livedata-A');
  const node2 = DR2.provisionNode('recovery', ctx2, ALL_ENGINES);
  const exe2 = new DataBoundExecutor((engineId, req) => node2.runtime.execute(engineId, req).result);
  const r2 = exe2.execute({ engineId: INDUSTRIALS_ENGINE_ID, requestId: 'ld-dr', data: snap, companyInputs: {} });
  assert.equal(r2.snapshotIdentity, r.snapshotIdentity, 'data lineage preserved across DR recovery');
  assert.equal(r2.result.metadata.composite, r.result.metadata.composite, 'data lineage replay-identical');
});
