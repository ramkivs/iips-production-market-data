/**
 * P13-B shared primitive: bounded aggregate mutation/concurrency authority.
 *
 * Domain-neutral. This layer owns versions, idempotency, tenant scope and append-only
 * mutation history; domain services own their schemas and state machines.
 */
export type AggregateMutationErrorCode =
  | 'VERSION_CONFLICT'
  | 'IDEMPOTENCY_REPLAY'
  | 'TENANT_SCOPE_DENIED'
  | 'INVALID_MUTATION';

export class AggregateMutationError extends Error {
  constructor(readonly code: AggregateMutationErrorCode, message: string) {
    super(message);
    this.name = 'AggregateMutationError';
  }
}

export interface AggregateRecord<T> {
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly version: number;
  readonly value: T;
  readonly updatedAt: string;
}

export interface AggregateHistory<T> {
  readonly historyId: string;
  readonly aggregateId: string;
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly value: T;
  readonly mutationKey: string;
  readonly occurredAt: string;
}

export interface MutationInput<T> {
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly aggregateId: string;
  readonly expectedVersion: number;
  readonly idempotencyKey: string;
  readonly mutate: (current: T | undefined) => T;
  readonly now?: string;
}

export interface MutationResult<T> {
  readonly record: AggregateRecord<T>;
  readonly history: AggregateHistory<T>;
  readonly replayed: boolean;
}

export interface MultiMutationInput<T> extends MutationInput<T> {
  readonly groupKey: string;
}

/**
 * Deterministic in-process transaction boundary. The injected clock and id factory are test
 * seams; production callers must provide server-owned values. No client identity is trusted.
 */
export class AggregateMutationStore<T> {
  private readonly records = new Map<string, AggregateRecord<T>>();
  private readonly history = new Map<string, AggregateHistory<T>[]>();
  private readonly idempotency = new Map<string, MutationResult<T>>();
  private sequence = 0;

  constructor(
    private readonly clock: () => string = () => new Date().toISOString(),
    private readonly idFactory: () => string = () => `history-${++this.sequence}`,
  ) {}

  read(tenantId: string, ownerUserId: string, aggregateId: string): AggregateRecord<T> | undefined {
    const record = this.records.get(aggregateId);
    if (!record) return undefined;
    if (record.tenantId !== tenantId || record.ownerUserId !== ownerUserId) {
      throw new AggregateMutationError('TENANT_SCOPE_DENIED', 'aggregate is outside the authenticated scope');
    }
    return record;
  }

  mutate(input: MutationInput<T>): MutationResult<T> {
    this.validate(input);
    const key = this.idempotencyKey(input);
    const prior = this.idempotency.get(key);
    if (prior) return { ...prior, replayed: true };

    const current = this.records.get(input.aggregateId);
    if (current && (current.tenantId !== input.tenantId || current.ownerUserId !== input.ownerUserId)) {
      throw new AggregateMutationError('TENANT_SCOPE_DENIED', 'aggregate is outside the authenticated scope');
    }
    const currentVersion = current?.version ?? 0;
    if (currentVersion !== input.expectedVersion) {
      throw new AggregateMutationError('VERSION_CONFLICT', `expected version ${input.expectedVersion}, actual ${currentVersion}`);
    }

    const value = input.mutate(current?.value);
    if (value === undefined) throw new AggregateMutationError('INVALID_MUTATION', 'mutation returned undefined');
    const occurredAt = input.now ?? this.clock();
    const record: AggregateRecord<T> = Object.freeze({
      aggregateId: input.aggregateId,
      tenantId: input.tenantId,
      ownerUserId: input.ownerUserId,
      version: currentVersion + 1,
      value: structuredClone(value),
      updatedAt: occurredAt,
    });
    const history: AggregateHistory<T> = Object.freeze({
      historyId: this.idFactory(), aggregateId: input.aggregateId, tenantId: input.tenantId,
      ownerUserId: input.ownerUserId, fromVersion: currentVersion, toVersion: record.version,
      value: structuredClone(value), mutationKey: input.idempotencyKey, occurredAt,
    });
    const result = Object.freeze({ record, history, replayed: false });
    this.records.set(input.aggregateId, record);
    this.history.set(input.aggregateId, [...(this.history.get(input.aggregateId) ?? []), history]);
    this.idempotency.set(key, result);
    return result;
  }

  /** All-or-nothing validation and commit for a bounded mutation group. */
  mutateMany(inputs: readonly MultiMutationInput<T>[]): readonly MutationResult<T>[] {
    if (inputs.length === 0 || new Set(inputs.map((i) => i.groupKey)).size !== 1) {
      throw new AggregateMutationError('INVALID_MUTATION', 'mutateMany requires one non-empty mutation group');
    }
    const snapshots = new Map(this.records);
    const histories = new Map([...this.history].map(([k, v]) => [k, [...v]]));
    const idempotency = new Map(this.idempotency);
    try {
      return Object.freeze(inputs.map((input) => this.mutate(input)));
    } catch (error) {
      this.records.clear(); for (const [k, v] of snapshots) this.records.set(k, v);
      this.history.clear(); for (const [k, v] of histories) this.history.set(k, v);
      this.idempotency.clear(); for (const [k, v] of idempotency) this.idempotency.set(k, v);
      throw error;
    }
  }

  historyFor(tenantId: string, ownerUserId: string, aggregateId: string): readonly AggregateHistory<T>[] {
    this.read(tenantId, ownerUserId, aggregateId);
    return Object.freeze([...(this.history.get(aggregateId) ?? [])]);
  }

  private idempotencyKey(input: MutationInput<T>): string {
    return `${input.tenantId}\u0000${input.ownerUserId}\u0000${input.idempotencyKey}`;
  }

  private validate(input: MutationInput<T>): void {
    if (!input.tenantId || !input.ownerUserId || !input.aggregateId || !input.idempotencyKey ||
        !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0 || typeof input.mutate !== 'function') {
      throw new AggregateMutationError('INVALID_MUTATION', 'invalid mutation envelope');
    }
  }
}
