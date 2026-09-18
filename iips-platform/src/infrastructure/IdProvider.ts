/** Deterministic identifier provider (IES-005 P4 §5, IES-006.2A). */
export interface IdProvider {
  generate(prefix: string, seed?: string): string;
}

const STRIP = /[^A-Z0-9]/g;

function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** DeterministicIdProvider — stable opaque IDs for identical (prefix, seed). */
export class DeterministicIdProvider implements IdProvider {
  private counter = 0;
  constructor(private readonly instanceSeed = '') {}

  generate(prefix: string, seed?: string): string {
    if (!prefix || !String(prefix).trim()) throw new Error('prefix is required');
    const p = String(prefix).toUpperCase();
    let suffix: string;
    if (seed) {
      const clean = String(seed).toUpperCase().replace(STRIP, '');
      const h = hashString(`${this.instanceSeed}|${p}|${clean}`);
      suffix = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
    } else {
      const n = this.counter++;
      const hash = hashString(`${this.instanceSeed}|${p}|${n}`);
      suffix = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
    }
    return `${p}_${suffix}`;
  }
}

export function createIdProvider(kind: 'deterministic' | 'runtime', instanceSeed = ''): IdProvider {
  return kind === 'runtime'
    ? { generate: (p, s) => `${String(p).toUpperCase()}_${s ?? ''}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` }
    : new DeterministicIdProvider(instanceSeed);
}
