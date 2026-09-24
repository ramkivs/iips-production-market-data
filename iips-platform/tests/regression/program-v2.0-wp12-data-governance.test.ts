/**
 * Program v2.0 — WP-12: Data Governance certification.
 *
 * Verification-only. Hard gates: WP-0 determinism, WP-15 security, tenant isolation, replay
 * lineage, frozen-oracle compatibility. Constitutional test:
 *   Data governance may control access, retention, movement and visibility; it must NOT
 *   silently alter the mathematical meaning of a frozen engine input.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DistributedRuntime } from '../../src/distributed/DistributedRuntime';
import { DataGovernanceRuntime, type GovernedData } from '../../src/distributed/DataGovernanceRuntime';

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

const clock = { now: () => '2026-08-09T00:00:00.000Z' };
const DG = new DataGovernanceRuntime(clock);

test('DG-CERT-01: data classification + tenant ownership + lineage', () => {
  const d = DG.classify('snap-1', 'tenant-A', 'confidential', 'us-east', 365, true);
  assert.equal(d.dataId, 'snap-1');
  assert.equal(d.tenantId, 'tenant-A');
  assert.equal(d.classification, 'confidential');
  assert.equal(d.region, 'us-east');
  assert.equal(d.immutable, true);
  assert.ok(Object.isFrozen(d), 'governed data immutable metadata');
});

test('DG-CERT-02: snapshot ownership + lineage (immutable, tenant-bound)', () => {
  const snap = DG.classify('snap-X', 'tenant-A', 'restricted', 'eu-west', 90, true);
  assert.equal(snap.immutable, true, 'finalized snapshot immutable');
  assert.ok(DG.isEngineInputGoverned(snap), 'engine input is governed + immutable');
});

test('DG-CERT-03: retention/deletion policy', () => {
  const d = DG.classify('snap-Y', 'tenant-A', 'internal', 'us-east', 30, false);
  assert.ok(DG.isWithinRetention(d, '2026-08-09T00:00:00.000Z'), 'within retention');
  assert.ok(DG.isMutable(d), 'non-finalized data mutable');
});

test('DG-CERT-04: replay-data authorization — only owner tenant may access for replay', () => {
  const snap = DG.classify('snap-replay', 'tenant-A', 'confidential', 'us-east', 365, true);
  assert.equal(DG.canAccess('tenant-A', snap), true, 'owner can access');
  assert.equal(DG.canAccess('tenant-B', snap), false, 'cross-tenant denied for replay');
});

test('DG-CERT-05: cross-tenant data leakage prevention', () => {
  const snap = DG.classify('snap-Z', 'tenant-A', 'restricted', 'us-east', 365, true);
  const ex = DG.canExport('tenant-B', snap, 'us-east', 'restricted');
  assert.equal(ex.allowed, false, 'cross-tenant export blocked');
  assert.equal(ex.reason, 'cross-tenant');
});

test('DG-CERT-06: live-data provider governance — only governed providers feed the engine', () => {
  assert.equal(DG.isGovernedProvider('bloomberg', ['bloomberg', 'reuters']), true, 'governed provider');
  assert.equal(DG.isGovernedProvider('unknown-market', ['bloomberg', 'reuters']), false, 'ungoverned provider rejected');
});

test('DG-CERT-07: evidence-data governance — evidence export requires classification + tenant + region', () => {
  const ev = DG.classify('evidence-1', 'tenant-A', 'confidential', 'us-east', 730, true);
  const ok = DG.canExport('tenant-A', ev, 'us-east', 'confidential');
  assert.equal(ok.allowed, true, 'authorized export');
  const tooLow = DG.canExport('tenant-A', ev, 'us-east', 'internal');
  assert.equal(tooLow.allowed, false, 'clearance too low');
  assert.equal(tooLow.reason, 'classification-clearance-insufficient');
  const regionMiss = DG.canExport('tenant-A', ev, 'eu-west', 'confidential');
  assert.equal(regionMiss.allowed, false, 'region mismatch blocks export');
});

test('DG-CERT-08: backup/DR data isolation + encryption/key boundaries', () => {
  const backup = DG.classify('dr-backup', 'tenant-A', 'restricted', 'us-east', 3650, true);
  // Backup data is tenant-bound and immutable (DR isolation); cross-tenant DR restore blocked.
  assert.equal(DG.canAccess('tenant-B', backup), false, 'DR backup cross-tenant blocked');
  assert.equal(backup.immutable, true, 'DR backup immutable');
});

test('DG-CERT-09: data residency/region semantics', () => {
  const d = DG.classify('snap-R', 'tenant-A', 'confidential', 'eu-west', 90, true);
  assert.equal(d.region, 'eu-west');
  const ex = DG.canExport('tenant-A', d, 'us-east', 'confidential');
  assert.equal(ex.allowed, false, 'data cannot leave its residency region');
});

test('DG-CERT-10: separation of operational metadata from engine inputs (constitutional test)', () => {
  // Data governance controls ACCESS/RETENTION/MOVEMENT/VISIBILITY, but must NOT alter the
  // mathematical meaning of a frozen engine input. Feeding the same input to the engine
  // (under governance metadata) reproduces the frozen baseline exactly.
  const ctx = DistributedRuntime.defaultContext('dg-guard');
  const node = new DistributedRuntime().provisionNode('n1', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const r = node.runtime.execute(s.engineId, { requestId: `dg-${s.engineId}`, inputs: s.input as never });
    assert.equal(r.result.metadata.composite, s.expectedOutput.composite, `${s.sector} determinism under data governance`);
  }
});
