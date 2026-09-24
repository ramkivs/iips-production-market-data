/** Plugin Loader — governed plugin lifecycle (IES-005 P4 §14, IES-006.2A WP-1). */
import type { Container } from '../di/Container';
import type { ExecutionRequest, ExecutionResult, SectorPlugin } from './PluginContract';

export class PluginLoader {
  private readonly plugins = new Map<string, SectorPlugin>();
  private readonly phases = new Map<string, string>();

  constructor(private readonly container: Container) {}

  /** Discover + register a plugin. Returns false if it fails SEC validation. */
  load(plugin: SectorPlugin): boolean {
    if (!plugin.identity?.engineId) return false;
    if (!plugin.manifest?.engineId) return false;
    if (!plugin.onRegister) return false;
    if (this.plugins.has(plugin.identity.engineId)) return false;

    plugin.onDiscover();
    this.phases.set(plugin.identity.engineId, 'Discovered');

    const registered = plugin.onRegister(this.container);
    if (!registered) {
      this.phases.delete(plugin.identity.engineId);
      return false;
    }
    this.plugins.set(plugin.identity.engineId, plugin);
    this.phases.set(plugin.identity.engineId, 'Registration');
    return true;
  }

  /** Initialize a registered plugin. */
  initialize(engineId: string): boolean {
    const p = this.plugins.get(engineId);
    if (!p) return false;
    p.onInitialize(this.container);
    this.phases.set(engineId, 'Initialization');
    return true;
  }

  /** Execute a plugin. */
  execute(engineId: string, request: ExecutionRequest): ExecutionResult | undefined {
    const p = this.plugins.get(engineId);
    if (!p) return undefined;
    this.phases.set(engineId, 'Execution');
    const result = p.execute(this.container, request);
    p.onComplete(this.container, result);
    this.phases.set(engineId, 'Completion');
    return result;
  }

  /** True if a plugin is registered. */
  has(engineId: string): boolean {
    return this.plugins.has(engineId);
  }

  /** Current lifecycle phase of a plugin. */
  phase(engineId: string): string | undefined {
    return this.phases.get(engineId);
  }

  /** List registered plugin ids. */
  list(): string[] {
    return [...this.plugins.keys()];
  }

  get size(): number {
    return this.plugins.size;
  }
}
