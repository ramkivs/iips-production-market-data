import type { SectorPlugin } from '../../src/plugin-loader/PluginContract';

/** Shared stub plugin helper for regression tests. */
export function makeStubPlugin(engineId: string, sectorFamily: string, tag = engineId): SectorPlugin {
  return {
    identity: { engineId, sectorFamily, engineVersion: '1.0.0', secVersion: '1.0', semcVersion: '1.0' },
    manifest: { engineId, sectorFamily, engineVersion: '1.0.0', capabilities: ['run'], compatibility: { framework: '1.0' } },
    onDiscover() {},
    onRegister() { return true; },
    onInitialize() {},
    execute(_ctx, req) {
      return { state: 'COMPLETED', metadata: { requestId: req.requestId, tag } };
    },
    onComplete() {},
  };
}
