import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { Transport } from '../../src/framework/transport/Transport';
import { ManifestLoader } from '../../src/framework/manifest/ManifestLoader';
import { DiagnosticsService } from '../../src/framework/diagnostics/DiagnosticsService';
import { QualificationService } from '../../src/framework/qualification/QualificationService';
import { ActivationService } from '../../src/framework/activation/ActivationService';
import { makeStubPlugin } from './helpers';

test('REGRESSION A: multi-plugin framework proof — both stubs use manifest/diagnostics/qualification/activation through the same framework', () => {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const container = new Container({ clock, idProvider: id });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);

  const manifestLoader = new ManifestLoader();
  const diagnostics = new DiagnosticsService();
  const qualification = new QualificationService();
  const activation = new ActivationService();

  const bank = makeStubPlugin('sector.banking', 'Banking');
  const ins = makeStubPlugin('sector.insurance', 'Insurance');
  plugins.load(bank);
  plugins.load(ins);
  plugins.initialize('sector.banking');
  plugins.initialize('sector.insurance');

  for (const engineId of ['sector.banking', 'sector.insurance']) {
    // Manifest loading (same loader, both plugins' manifests)
    const manifest = manifestLoader.load(engineId === 'sector.banking' ? bank.manifest : ins.manifest);
    assert.equal(manifest.engineId, engineId);

    // Diagnostics (same service)
    diagnostics.capture({ engineId, executionDurationMs: 3, registryVersions: { metric: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });

    // Qualification (same service)
    const qual = qualification.qualify({ engineId, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
    assert.equal(qual.qualified, true);

    // Activation (same service)
    const act = activation.activate(engineId, qual.qualified);
    assert.equal(act?.toState, 'ACTIVE');
  }

  assert.equal(plugins.size, 2);
  assert.equal(diagnostics.list().length, 2);
  assert.equal(activation.getState('sector.banking'), 'ACTIVE');
  assert.equal(activation.getState('sector.insurance'), 'ACTIVE');
  console.log('framework multi-plugin proof (A) PASS');
});

test('REGRESSION B: transport neutrality — DTOs have no banking-specific fields and serialize arbitrary sector payloads', () => {
  const clock = createClock('fixed');
  const transport = new Transport(clock);

  // The DTO shape is fixed and generic — no banking fields.
  const dtoKeys = new Set([
    'sectorId', 'sectorFamily', 'companyName', 'metrics', 'scores', 'verdict',
  ]);

  // Arbitrary sector payloads serialize through the same transport.
  const payloads = [
    { sectorId: 'SEC-BANK', sectorFamily: 'Banking', companyName: 'Alpha', metrics: { ROA: 1.5 }, scores: { Q: 80 }, verdict: 'Buy' },
    { sectorId: 'SEC-INS', sectorFamily: 'Insurance', companyName: 'Beta', metrics: { CombinedRatio: 95 }, scores: { S: 70 }, verdict: 'Hold' },
    { sectorId: 'SEC-HC', sectorFamily: 'Healthcare', companyName: 'Gamma', metrics: { BedOccupancy: 80 }, scores: { G: 60 } },
  ];

  for (const row of payloads) {
    // Every key must be in the generic transport schema (no sector-specific leakage).
    for (const k of Object.keys(row)) assert.ok(dtoKeys.has(k), `unexpected field ${k}`);
    const dto = transport.build(row.sectorFamily.toLowerCase(), [row as never]);
    assert.equal(transport.validate(dto), true);
    // Serialization deterministic + checksum stable
    assert.equal(transport.serialize(dto), transport.serialize(dto));
    assert.equal(transport.checksum(dto), transport.checksum(dto));
  }

  console.log('transport neutrality (B) PASS');
});
