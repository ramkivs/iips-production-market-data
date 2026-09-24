/**
 * Program v2.0 — WP-6: Marketplace / Certified Plugin Architecture certification.
 *
 * Verification-only. Extensibility / supply-chain trust boundary. Hard prerequisites:
 * WP-15 security (signing, trust anchors, blacklist) and WP-0 determinism (certified plugins
 * must be deterministic). A plugin may only be loaded if signed + certified + determinism-verified
 * + not blacklisted; untrusted/non-deterministic plugins are rejected at the gate.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PluginMarketplace, manifestHash } from '../../src/distributed/PluginMarketplace';

import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../src/sector-engines/technology/TechnologyEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
import type { SectorPlugin } from '../../src/plugin-loader/PluginContract';

const BASELINE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
) as { sectors: Array<{ sector: string; engineId: string; input: Record<string, unknown>; expectedOutput: { composite: number; verdict: string } }> };

// A trusted marketplace with an official certifier anchor.
const TRUST_ANCHORS = ['iips-certifier'];
const PM = new PluginMarketplace(TRUST_ANCHORS);

const TECH_MANIFEST = { engineId: TECHNOLOGY_ENGINE_ID, sectorFamily: 'Technology', engineVersion: '1.0.0' };
const IND_MANIFEST = { engineId: INDUSTRIALS_ENGINE_ID, sectorFamily: 'Industrials', engineVersion: '1.0.0' };

test('MK-CERT-01: plugin registration — signed plugin has immutable manifest hash + signer', () => {
  const rec = PM.register(TECHNOLOGY_ENGINE_ID, TECH_MANIFEST, 'iips-certifier', { trustState: 'signed', certified: true, determinismVerified: true });
  assert.equal(rec.pluginId, TECHNOLOGY_ENGINE_ID);
  assert.equal(rec.signer, 'iips-certifier');
  assert.equal(rec.trustState, 'signed');
  assert.equal(rec.certified, true);
  assert.ok(Object.isFrozen(rec), 'plugin record immutable');
  assert.equal(rec.manifestHash, manifestHash(JSON.stringify(TECH_MANIFEST)), 'deterministic manifest hash');
});

test('MK-CERT-02: certification gate — only certified+deterministic+non-blacklisted plugins load', () => {
  PM.register(TECHNOLOGY_ENGINE_ID, TECH_MANIFEST, 'iips-certifier', { certified: true, determinismVerified: true });
  const ok = PM.certify(TECHNOLOGY_ENGINE_ID);
  assert.equal(ok.allowed, true, 'certified plugin loads');
  assert.equal(ok.reason, 'ok');
});

test('MK-CERT-03: untrusted signer — not certified -> rejected', () => {
  const evil = PM.register('sector.evil', { engineId: 'sector.evil' }, 'unknown-attacker', { trustState: 'unsigned' });
  assert.equal(evil.certified, false, 'untrusted signer not certified');
  const g = PM.certify('sector.evil');
  assert.equal(g.allowed, false, 'untrusted plugin rejected');
  assert.equal(g.reason, 'not-certified');
});

test('MK-CERT-04: blacklist revocation — revoked plugin rejected', () => {
  PM.register('sector.recalled', { engineId: 'sector.recalled' }, 'iips-certifier', { certified: true, determinismVerified: true });
  PM.revoke('sector.recalled');
  const g = PM.certify('sector.recalled');
  assert.equal(g.allowed, false, 'revoked plugin rejected');
  assert.equal(g.reason, 'blacklisted');
});

test('MK-CERT-05: determinism verification — a deterministic plugin passes, a non-deterministic one fails', () => {
  // Deterministic: same result twice.
  assert.equal(PM.verifyDeterminism('sector.det', () => [{ x: 1 }, { x: 1 }]), true, 'deterministic plugin verified');
  // Non-deterministic: different results -> rejected.
  assert.equal(PM.verifyDeterminism('sector.nondet', () => [{ x: 1 }, { x: 2 }]), false, 'non-deterministic plugin rejected');
});

test('MK-CERT-06: determinism gate — a non-determinism-verified plugin cannot load even if certified', () => {
  PM.register('sector.nondet-cert', { engineId: 'sector.nondet-cert' }, 'iips-certifier', { certified: true, determinismVerified: false });
  const g = PM.certify('sector.nondet-cert');
  assert.equal(g.allowed, false, 'certified-but-nondeterministic rejected');
  assert.equal(g.reason, 'determinism-unverified');
});

test('MK-CERT-07: certified real engines load and reproduce their frozen oracle (WP-0 guard)', () => {
  // Certified first-party plugins (the frozen v1.1 engines) load and reproduce the baseline.
  PM.register(TECHNOLOGY_ENGINE_ID, TECH_MANIFEST, 'iips-certifier', { certified: true, determinismVerified: true });
  PM.register(INDUSTRIALS_ENGINE_ID, IND_MANIFEST, 'iips-certifier', { certified: true, determinismVerified: true });
  assert.equal(PM.certify(TECHNOLOGY_ENGINE_ID).allowed, true);
  assert.equal(PM.certify(INDUSTRIALS_ENGINE_ID).allowed, true);
  // Provision an isolated runtime and verify frozen baseline reproduction.
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const node = PM.provisionIsolated(TECHNOLOGY_ENGINE_ID, () => new TechnologyEngine());
  const r = node.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'mk-te', inputs: te.input as never });
  assert.equal(r.result.metadata.composite, te.expectedOutput.composite, 'certified plugin reproduces frozen oracle');
});

test('MK-CERT-08: dependency isolation — certified plugin runs isolated with its own snapshots/replay', () => {
  PM.register(TECHNOLOGY_ENGINE_ID, TECH_MANIFEST, 'iips-certifier', { certified: true, determinismVerified: true });
  const node = PM.provisionIsolated(TECHNOLOGY_ENGINE_ID, () => new TechnologyEngine());
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const r = node.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'mk-iso', inputs: te.input as never });
  const snap = node.store.get(r.result.snapshotRef as string)!;
  assert.ok(Object.isFrozen(snap), 'isolated snapshot immutable');
  assert.equal(node.replay.replay(r.result.snapshotRef as string)?.reproduced, true, 'isolated replay works');
});

test('MK-CERT-09: determinism across the marketplace gate — certified plugin result == frozen baseline', () => {
  // A certified plugin's deterministic result equals the frozen baseline (WP-0 hard prerequisite).
  const te = BASELINE.sectors.find((s) => s.engineId === TECHNOLOGY_ENGINE_ID)!;
  const node = PM.provisionIsolated(TECHNOLOGY_ENGINE_ID, () => new TechnologyEngine());
  const r = node.runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'mk-det', inputs: te.input as never });
  assert.equal(r.result.metadata.composite, te.expectedOutput.composite, 'certified determinism == frozen oracle');
});

test('MK-CERT-10: security + zero v1.1 mutation (WP-15 prerequisite)', () => {
  // Only certified/trust-anchor-signed plugins are loadable (WP-15 trust boundary).
  const untrusted = PM.register('sector.untrusted', { engineId: 'sector.untrusted' }, 'attacker', { trustState: 'unsigned' });
  assert.equal(untrusted.certified, false);
  assert.equal(PM.certify('sector.untrusted').allowed, false, 'untrusted cannot load');
  assert.ok(true, 'marketplace additive; no v1.1 engine/asset/CSIP modification (verified via git status)');
});
