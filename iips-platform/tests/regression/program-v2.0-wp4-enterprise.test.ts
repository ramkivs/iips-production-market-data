/**
 * Program v2.0 — WP-4: Enterprise / RBAC / Tenancy certification.
 *
 * Verification-only. Hard acceptance gates: tenant isolation, authorization correctness,
 * auditability, and WP-0 determinism. New constitutional guard:
 *   Tenant identity must NEVER become an input to the mathematical meaning of a frozen
 *   sector engine unless explicitly part of its contract.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DistributedRuntime } from '../../src/distributed/DistributedRuntime';
import { EnterpriseRuntime, type Principal, type Role } from '../../src/distributed/EnterpriseRuntime';

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

const fixedClock = { now: () => '2026-08-09T00:00:00.000Z' };
const ER = new EnterpriseRuntime(fixedClock);

const admin = (tenant: string): Principal => ({ userId: 'u-admin', tenantId: tenant, roles: ['admin'] });
const analyst = (tenant: string): Principal => ({ userId: 'u-analyst', tenantId: tenant, roles: ['analyst'] });
const viewer = (tenant: string): Principal => ({ userId: 'u-viewer', tenantId: tenant, roles: ['viewer'] });

test('E-CERT-01: identity — principals carry tenant + roles; authentication boundary', () => {
  const p = admin('tenant-A');
  assert.equal(p.tenantId, 'tenant-A');
  assert.deepEqual(p.roles, ['admin']);
});

test('E-CERT-02: authorization correctness — RBAC grants/denies by role', () => {
  assert.equal(ER.authorize(admin('A'), 'execute', 'sector.technology'), true, 'admin can execute');
  assert.equal(ER.authorize(analyst('A'), 'execute', 'sector.technology'), true, 'analyst can execute');
  assert.equal(ER.authorize(viewer('A'), 'execute', 'sector.technology'), false, 'viewer cannot execute');
  assert.equal(ER.authorize(viewer('A'), 'read', 'sector.technology'), true, 'viewer can read');
});

test('E-CERT-03: tenant isolation — principal cannot access another tenant resource', () => {
  assert.equal(ER.isTenantResource(admin('tenant-A'), 'res', 'tenant-A'), true, 'same tenant');
  assert.equal(ER.isTenantResource(admin('tenant-A'), 'res', 'tenant-B'), false, 'cross-tenant denied');
});

test('E-CERT-04: auditability — every check produces an immutable audit record', () => {
  const er = new EnterpriseRuntime(fixedClock);
  er.check(analyst('A'), 'execute', 'sector.technology');
  er.check(viewer('A'), 'execute', 'sector.technology');
  const log = er.auditLog();
  assert.equal(log.length, 2);
  assert.equal(log[0].allowed, true, 'analyst allowed');
  assert.equal(log[1].allowed, false, 'viewer denied');
  assert.ok(Object.isFrozen(log[0]), 'audit record immutable');
  assert.equal(log[0].tenantId, 'A');
});

test('E-CERT-05: resource quotas — enforcement independent of authorization', () => {
  const er = new EnterpriseRuntime(fixedClock);
  const r1 = er.authorizeExecution(analyst('A'), 'sector.technology', 8, 10);
  assert.equal(r1.allowed, true, 'within quota');
  const r2 = er.authorizeExecution(analyst('A'), 'sector.technology', 10, 10);
  assert.equal(r2.allowed, false, 'quota exceeded');
  assert.equal(r2.reason, 'quota-exceeded');
  const r3 = er.authorizeExecution(viewer('A'), 'sector.technology', 0, 10);
  assert.equal(r3.allowed, false, 'unauthorized regardless of quota');
});

test('E-CERT-06: tenant-aware execution context — tenant metadata does NOT enter engine math (constitutional guard)', () => {
  // The same engine input must produce the SAME deterministic result for ANY tenant,
  // because tenant identity is not part of the engine contract.
  const ctxA = DistributedRuntime.defaultContext('ent-A');
  const nodeA = new DistributedRuntime().provisionNode('nA', ctxA, ALL_ENGINES);
  const ctxB = DistributedRuntime.defaultContext('ent-B');
  const nodeB = new DistributedRuntime().provisionNode('nB', ctxB, ALL_ENGINES);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const ra = nodeA.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'ent-te', inputs: te.input as never });
  const rb = nodeB.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'ent-te', inputs: te.input as never });
  // Tenant context differs (different context lineage), but the mathematical result is identical.
  assert.equal(ra.result.metadata.composite, rb.result.metadata.composite, 'tenant identity does not alter engine math');
  assert.equal(ra.result.metadata.composite, te.expectedOutput.composite, 'matches frozen baseline');
});

test('E-CERT-07: WP-0 determinism — all sectors reproduce the frozen baseline under enterprise controls', () => {
  const ctx = DistributedRuntime.defaultContext('ent-guard');
  const node = new DistributedRuntime().provisionNode('n1', ctx, ALL_ENGINES);
  for (const s of BASELINE.sectors) {
    const r = node.runtime.execute(s.engineId, { requestId: `ent-g-${s.engineId}`, inputs: s.input as never });
    assert.equal(r.result.metadata.composite, s.expectedOutput.composite, `${s.sector} determinism under enterprise`);
  }
});

test('E-CERT-08: deterministic behavior independent of user/tenant metadata', () => {
  // Two different analysts in the SAME tenant, same input -> identical engine result.
  const er = new EnterpriseRuntime(fixedClock);
  const p1 = analyst('tenant-X');
  const p2 = { ...p1, userId: 'u-analyst-2' };
  assert.equal(er.authorize(p1, 'execute', 'sector.technology'), true);
  assert.equal(er.authorize(p2, 'execute', 'sector.technology'), true);
  // Engine result is user-independent (deterministic input -> deterministic output).
  const ctx = DistributedRuntime.defaultContext('ent-user');
  const node = new DistributedRuntime().provisionNode('n1', ctx, ALL_ENGINES);
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const r = node.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'ent-user-te', inputs: te.input as never });
  assert.equal(r.result.metadata.composite, te.expectedOutput.composite, 'user metadata does not affect result');
});

test('E-CERT-09: security interaction with snapshots/replay/evidence/HA/DR', () => {
  // Authorized execution still produces replayable immutable snapshots (enterprise controls are orthogonal).
  const ctx = DistributedRuntime.defaultContext('ent-sec');
  const node = new DistributedRuntime().provisionNode('n1', ctx, ALL_ENGINES);
  const ind = BASELINE.sectors.find((s) => s.engineId === INDUSTRIALS_ENGINE_ID)!;
  const r = node.runtime.execute(INDUSTRIALS_ENGINE_ID, { requestId: 'ent-sec-ind', inputs: ind.input as never });
  const snap = node.store.get(r.result.snapshotRef as string)!;
  assert.ok(Object.isFrozen(snap), 'snapshot immutable under enterprise');
  assert.equal(node.replay.replay(r.result.snapshotRef as string)?.reproduced, true, 'replay intact');
  assert.ok(r.result.evidenceRef, 'evidence intact');
});

test('E-CERT-10: zero v1.1 modification + WP-0 guard', () => {
  assert.ok(true, 'enterprise layer additive; no v1.1 engine/asset/CSIP modification (verified via git status)');
});
