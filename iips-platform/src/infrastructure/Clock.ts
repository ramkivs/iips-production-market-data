/** Deterministic clock abstraction (IES-005 P4 §5, IES-006.2A). */
export interface Clock {
  now(): string;
}

/** FixedClock — deterministic timestamp (default for tests/certification/replay). */
export class FixedClock implements Clock {
  constructor(private readonly fixed: string) {}
  now(): string {
    return this.fixed;
  }
}

/** SystemClock — real wall-clock (production runtime). */
export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

export function createClock(kind: 'fixed' | 'system', fixed?: string): Clock {
  return kind === 'system' ? new SystemClock() : new FixedClock(fixed ?? '2026-08-06T00:00:00.000Z');
}
