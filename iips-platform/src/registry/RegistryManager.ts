/** Registry Manager — six immutable, versioned registries (IES-005 P2 §10, IES-006.2A). */
import { deepFreeze } from '../infrastructure/deepFreeze';

export type RegistryKind =
  | 'taxonomy'
  | 'metric'
  | 'score'
  | 'formula'
  | 'snapshot'
  | 'transport';

export interface RegistryEntry {
  readonly id: string;
  readonly kind: RegistryKind;
  readonly name: string;
  readonly version: string;
  readonly definition?: unknown;
}

export interface RegistryStore {
  readonly kind: RegistryKind;
  readonly version: string;
  readonly entries: ReadonlyMap<string, RegistryEntry>;
}

class ImmutableRegistry {
  private readonly map = new Map<string, RegistryEntry>();

  constructor(readonly kind: RegistryKind, readonly version: string) {}

  /** Register an entry (immutable — rejects duplicates). */
  register(entry: RegistryEntry): void {
    if (entry.kind !== this.kind) throw new Error(`kind mismatch: ${entry.kind} != ${this.kind}`);
    if (this.map.has(entry.id)) throw new Error(`duplicate entry: ${entry.id}`);
    this.map.set(entry.id, entry);
  }

  get(id: string): RegistryEntry | undefined {
    return this.map.get(id);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  list(): RegistryEntry[] {
    return [...this.map.values()];
  }

  size(): number {
    return this.map.size;
  }

  /** Freeze the registry (immutable). */
  freeze(): Readonly<RegistryStore> {
    const frozen = Object.freeze({
      kind: this.kind,
      version: this.version,
      entries: this.map,
    });
    return deepFreeze(frozen) as Readonly<RegistryStore>;
  }
}

export class RegistryManager {
  private readonly registries: Record<RegistryKind, ImmutableRegistry>;

  constructor(versions: Record<RegistryKind, string> = defaultVersions()) {
    this.registries = {
      taxonomy: new ImmutableRegistry('taxonomy', versions.taxonomy),
      metric: new ImmutableRegistry('metric', versions.metric),
      score: new ImmutableRegistry('score', versions.score),
      formula: new ImmutableRegistry('formula', versions.formula),
      snapshot: new ImmutableRegistry('snapshot', versions.snapshot),
      transport: new ImmutableRegistry('transport', versions.transport),
    };
  }

  register(kind: RegistryKind, entry: Omit<RegistryEntry, 'kind'> & { id: string }): void {
    this.registries[kind].register({ ...entry, kind } as RegistryEntry);
  }

  get(kind: RegistryKind, id: string): RegistryEntry | undefined {
    return this.registries[kind].get(id);
  }

  has(kind: RegistryKind, id: string): boolean {
    return this.registries[kind].has(id);
  }

  list(kind: RegistryKind): RegistryEntry[] {
    return this.registries[kind].list();
  }

  size(kind: RegistryKind): number {
    return this.registries[kind].size();
  }

  versions(): Readonly<Record<RegistryKind, string>> {
    const out = {} as Record<RegistryKind, string>;
    for (const k of Object.keys(this.registries) as RegistryKind[]) out[k] = this.registries[k].version;
    return Object.freeze(out);
  }

  /** Freeze all registries (immutable). */
  freezeAll(): Readonly<Record<RegistryKind, Readonly<RegistryStore>>> {
    const out = {} as Record<RegistryKind, Readonly<RegistryStore>>;
    for (const k of Object.keys(this.registries) as RegistryKind[]) out[k] = this.registries[k].freeze();
    return deepFreeze(out);
  }
}

function defaultVersions(): Record<RegistryKind, string> {
  return {
    taxonomy: '1.0',
    metric: '1.0',
    score: '1.0',
    formula: '1.0',
    snapshot: '1.0',
    transport: '1.0',
  };
}
