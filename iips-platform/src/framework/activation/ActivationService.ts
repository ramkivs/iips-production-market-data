/** Activation — lifecycle transitions (generic, IES-006.2A WP-2). */
export type ActivationState = 'INACTIVE' | 'READY' | 'ACTIVE';

export interface ActivationResult {
  readonly activationId: string;
  readonly engineId: string;
  readonly fromState: ActivationState;
  readonly toState: ActivationState;
  readonly fingerprint: string;
}

export class ActivationService {
  private readonly states = new Map<string, ActivationState>();

  constructor(private readonly frameworkVersion = '1.0') {}

  getState(engineId: string): ActivationState {
    return this.states.get(engineId) ?? 'INACTIVE';
  }

  /** Activate only if the engine is production-qualified. Returns null if not. */
  activate(engineId: string, qualified: boolean): ActivationResult | null {
    if (!qualified) return null;
    const from = this.getState(engineId);
    this.states.set(engineId, 'ACTIVE');
    return Object.freeze({
      activationId: `act_${engineId}`,
      engineId,
      fromState: from,
      toState: 'ACTIVE',
      fingerprint: `${this.frameworkVersion}:${engineId}:ACTIVE`,
    });
  }

  deactivate(engineId: string): ActivationResult | null {
    const from = this.getState(engineId);
    if (from === 'INACTIVE') return null;
    this.states.set(engineId, 'INACTIVE');
    return Object.freeze({
      activationId: `deact_${engineId}`,
      engineId,
      fromState: from,
      toState: 'INACTIVE',
      fingerprint: `${this.frameworkVersion}:${engineId}:INACTIVE`,
    });
  }
}
