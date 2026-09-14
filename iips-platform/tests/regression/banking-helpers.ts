import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';

export interface BankingHarness {
  container: Container;
  plugins: PluginLoader;
  runtime: RuntimeCoordinator;
  evidence: EvidencePipeline;
  store: SnapshotStore;
  engine: BankingEngine;
}

export function buildBankingHarness(): BankingHarness {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const evidence = new EvidencePipeline(clock);
  const container = new Container({ clock, idProvider: id, evidenceService: evidence });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);

  // Register runtimeCoordinator in the DI container so the engine can resolve it.
  container.register('runtimeCoordinator', runtime);

  const engine = new BankingEngine();
  plugins.load(engine);
  plugins.initialize(BANKING_ENGINE_ID);

  return { container, plugins, runtime, evidence, store, engine };
}
