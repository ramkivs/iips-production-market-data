/** Dependency injection container (IES-005 P4 §5, IES-006.2A). */
import type { Clock } from '../infrastructure/Clock';
import type { IdProvider } from '../infrastructure/IdProvider';

/** The framework-injected deterministic providers + shared services. */
export interface Dependencies {
  clock: Clock;
  idProvider: IdProvider;
  registryManager?: unknown;
  snapshotService?: unknown;
  replayService?: unknown;
  transportService?: unknown;
  diagnosticsService?: unknown;
  evidenceService?: unknown;
  runtimeCoordinator?: unknown;
}

export class Container {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  get clock(): Clock {
    return this.deps.clock;
  }

  get idProvider(): IdProvider {
    return this.deps.idProvider;
  }

  resolve<T>(key: keyof Dependencies): T {
    const v = this.deps[key];
    if (v === undefined) throw new Error(`Dependency not provided: ${key}`);
    return v as T;
  }

  /** Register a service post-construction (e.g. a runtime service created after the container). */
  register<K extends keyof Dependencies>(key: K, value: Dependencies[K]): void {
    (this.deps as unknown as Record<string, unknown>)[key] = value;
  }

  /** Immutable snapshot of registered dependencies. */
  freeze(): Readonly<Dependencies> {
    return Object.freeze({ ...this.deps });
  }
}
