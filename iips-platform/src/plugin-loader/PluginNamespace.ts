import type { SectorPlugin } from './PluginContract';

/**
 * New bounded namespace contract.
 *
 * This is NOT the historical NamespaceCollisionGuard API.
 * Namespace identity is the current PluginContract.identity.engineId.
 * Duplicate engine identities are rejected.
 */
export class PluginNamespace {
  private readonly plugins = new Map<string, SectorPlugin>();

  register(plugin: SectorPlugin): boolean {
    const engineId = plugin.identity?.engineId;

    if (!engineId) return false;
    if (this.plugins.has(engineId)) return false;

    this.plugins.set(engineId, plugin);
    return true;
  }

  get(engineId: string): SectorPlugin | undefined {
    return this.plugins.get(engineId);
  }

  has(engineId: string): boolean {
    return this.plugins.has(engineId);
  }

  list(): string[] {
    return [...this.plugins.keys()];
  }

  get size(): number {
    return this.plugins.size;
  }
}
