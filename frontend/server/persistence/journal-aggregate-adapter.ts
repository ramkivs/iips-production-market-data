/**
 * P13-B bounded journal adapter.
 *
 * Domain-neutral aggregate storage on top of the existing PersistenceService journal.
 * Groups use PREPARE records followed by a COMMIT record. Recovery applies only committed
 * groups, so a crash between appends cannot expose partial aggregate state.
 */
import { PersistenceService, type PersistedRecord } from './persistence-service';
import { AggregateMutationError, type AggregateHistory, type AggregatePersistence, type AggregateRecord, type MutationInput, type MutationResult, type MultiMutationInput } from './aggregate-persistence';

interface Prepared<T> { kind: 'aggregate.prepare'; groupId: string; mutation: MutationInput<T>; value: T; fromVersion: number; occurredAt: string; historyId: string; fingerprint: string; }
interface Committed { kind: 'aggregate.commit'; groupId: string; mutationKeys: string[]; }
type JournalPayload<T> = Prepared<T> | Committed;

/** Authoritative production aggregate persistence implementation. */
export class JournalAggregateStore<T> implements AggregatePersistence<T> {
  private records = new Map<string, AggregateRecord<T>>();
  private histories = new Map<string, AggregateHistory<T>[]>();
  private idempotency = new Map<string, MutationResult<T>>();
  private fingerprints = new Map<string, string>();
  private recovered = false;
  private groupSequence = 0;

  constructor(
    private readonly journal: PersistenceService,
    private readonly clock: () => string = () => new Date().toISOString(),
    private readonly idFactory: () => string = (() => { let n = 0; return () => `aggregate-history-${++n}`; })(),
  ) { this.recover(); }

  read(tenantId: string, ownerUserId: string, aggregateId: string): AggregateRecord<T> | undefined {
    const r = this.records.get(aggregateId);
    if (!r) return undefined;
    if (r.tenantId !== tenantId || r.ownerUserId !== ownerUserId) throw new AggregateMutationError('TENANT_SCOPE_DENIED', 'aggregate is outside the authenticated scope');
    return r;
  }

  mutate(input: MutationInput<T>): MutationResult<T> {
    return this.mutateMany([{ ...input, groupKey: input.aggregateId }])[0];
  }

  mutateMany(inputs: readonly MultiMutationInput<T>[]): readonly MutationResult<T>[] {
    if (inputs.length === 0 || new Set(inputs.map((x) => x.groupKey)).size !== 1) throw new AggregateMutationError('INVALID_MUTATION', 'one non-empty mutation group is required');
    const groupId = `${inputs[0].tenantId}:${inputs[0].ownerUserId}:${inputs[0].groupKey}:${this.clock()}:${++this.groupSequence}`;
    const prepared: Prepared<T>[] = [];
    const results: MutationResult<T>[] = [];
    for (const input of inputs) {
      this.validate(input);
      const current = this.records.get(input.aggregateId);
      const candidate = input.mutate(current?.value);
      if (candidate === undefined) throw new AggregateMutationError('INVALID_MUTATION', 'mutation returned undefined');
      const fingerprint = this.fingerprint(input, candidate);
      const idemKey = this.idem(input);
      const prior = this.idempotency.get(idemKey);
      if (prior) {
        if (this.fingerprints.get(idemKey) !== fingerprint) throw new AggregateMutationError('IDEMPOTENCY_REPLAY', 'idempotency key was reused with a different mutation');
        results.push({ ...prior, replayed: true }); continue;
      }
      if (current && (current.tenantId !== input.tenantId || current.ownerUserId !== input.ownerUserId)) throw new AggregateMutationError('TENANT_SCOPE_DENIED', 'aggregate is outside the authenticated scope');
      const version = current?.version ?? 0;
      if (version !== input.expectedVersion) throw new AggregateMutationError('VERSION_CONFLICT', `expected version ${input.expectedVersion}, actual ${version}`);
      const value = candidate;
      const occurredAt = input.now ?? this.clock();
      prepared.push({ kind: 'aggregate.prepare', groupId, mutation: input, value: structuredClone(value), fromVersion: version, occurredAt, historyId: this.idFactory(), fingerprint });
    }
    if (prepared.length === 0) return Object.freeze(results);
    for (const p of prepared) this.journal.append({ tenantId: p.mutation.tenantId, ownerUserId: p.mutation.ownerUserId, dedupKey: `aggregate:${p.groupId}:prepare:${p.mutation.idempotencyKey}`, payload: p });
    this.journal.append({ tenantId: inputs[0].tenantId, ownerUserId: inputs[0].ownerUserId, dedupKey: `aggregate:${groupId}:commit`, payload: { kind: 'aggregate.commit', groupId, mutationKeys: prepared.map((p) => p.mutation.idempotencyKey) } satisfies Committed });
    for (const p of prepared) results.push(this.apply(p));
    return Object.freeze(results);
  }

  historyFor(tenantId: string, ownerUserId: string, aggregateId: string): readonly AggregateHistory<T>[] {
    this.read(tenantId, ownerUserId, aggregateId);
    return Object.freeze([...(this.histories.get(aggregateId) ?? [])]);
  }

  private recover(): void {
    if (this.recovered) return;
    const grouped = new Map<string, Prepared<T>[]>();
    const commits = new Set<string>();
    // PersistenceService is the only journal/index authority; aggregate payloads are opaque here.
    const candidates = new Map<string, PersistedRecord>();
    for (const tenant of this.journal.listOrdered('__aggregate_recovery__', '__aggregate_recovery__')) candidates.set(tenant.recordId, tenant);
    // Domain-scoped records are recovered by callers through recoverScope; no global scan exists in PF-1.
    void candidates; void grouped; void commits;
    this.recovered = true;
  }

  /** Rebuild one authenticated tenant/owner scope from the existing journal. */
  recoverScope(tenantId: string, ownerUserId: string): void {
    for (const [id, record] of this.records) if (record.tenantId === tenantId && record.ownerUserId === ownerUserId) this.records.delete(id);
    for (const [id, history] of this.histories) if (history[0]?.tenantId === tenantId && history[0]?.ownerUserId === ownerUserId) this.histories.delete(id);
    for (const [key, result] of this.idempotency) if (result.record.tenantId === tenantId && result.record.ownerUserId === ownerUserId) { this.idempotency.delete(key); this.fingerprints.delete(key); }
    const records = this.journal.listOrdered(tenantId, ownerUserId);
    const prepared = new Map<string, Prepared<T>[]>(); const committed = new Map<string, string>(); const conflicted = new Set<string>();
    for (const r of records) {
      const p = r.payload as Partial<JournalPayload<T>>;
      if (p.kind === 'aggregate.prepare') {
        if (!this.validPrepare(p)) continue;
        const list = prepared.get(p.groupId) ?? []; list.push(p as Prepared<T>); prepared.set(p.groupId, list);
      } else if (p.kind === 'aggregate.commit') {
        if (!this.validCommit(p) || conflicted.has(p.groupId)) continue;
        const signature = JSON.stringify(p.mutationKeys);
        const prior = committed.get(p.groupId);
        if (prior !== undefined && prior !== signature) { conflicted.add(p.groupId); committed.delete(p.groupId); continue; }
        committed.set(p.groupId, signature);
      }
    }
    for (const [groupId, list] of [...prepared.entries()].sort((a, b) => (a[1][0]?.fromVersion ?? 0) - (b[1][0]?.fromVersion ?? 0))) if (committed.has(groupId) && !conflicted.has(groupId)) for (const p of list) {
      if (p.mutation.tenantId === tenantId && p.mutation.ownerUserId === ownerUserId) this.apply(p);
    }
  }

  private validPrepare(value: Partial<Prepared<T>>): value is Prepared<T> {
    const m = value.mutation;
    return typeof value.groupId === 'string' && value.groupId.length > 0 && typeof value.historyId === 'string' &&
      typeof value.fingerprint === 'string' && typeof value.fromVersion === 'number' && Number.isInteger(value.fromVersion) && value.fromVersion >= 0 &&
      typeof value.occurredAt === 'string' && !!m && typeof m.aggregateId === 'string' && !!m.tenantId && !!m.ownerUserId &&
      typeof m.idempotencyKey === 'string';
  }

  private validCommit(value: Partial<Committed>): value is Committed {
    return typeof value.groupId === 'string' && value.groupId.length > 0 && Array.isArray(value.mutationKeys) &&
      value.mutationKeys.every((key) => typeof key === 'string');
  }

  private apply(p: Prepared<T>): MutationResult<T> {
    const current = this.records.get(p.mutation.aggregateId); const record: AggregateRecord<T> = Object.freeze({ aggregateId: p.mutation.aggregateId, tenantId: p.mutation.tenantId, ownerUserId: p.mutation.ownerUserId, version: p.fromVersion + 1, value: structuredClone(p.value), updatedAt: p.occurredAt });
    const history: AggregateHistory<T> = Object.freeze({ historyId: p.historyId, aggregateId: p.mutation.aggregateId, tenantId: p.mutation.tenantId, ownerUserId: p.mutation.ownerUserId, fromVersion: p.fromVersion, toVersion: record.version, value: structuredClone(p.value), mutationKey: p.mutation.idempotencyKey, occurredAt: p.occurredAt });
    const result = Object.freeze({ record, history, replayed: false }); this.records.set(record.aggregateId, record); this.histories.set(record.aggregateId, [...(this.histories.get(record.aggregateId) ?? []), history]); this.idempotency.set(this.idem(p.mutation), result); this.fingerprints.set(this.idem(p.mutation), p.fingerprint); void current; return result;
  }

  private idem(input: MutationInput<T>): string { return `${input.tenantId}\u0000${input.ownerUserId}\u0000${input.idempotencyKey}`; }
  private fingerprint(input: MutationInput<T>, value: T): string {
    return JSON.stringify({ aggregateId: input.aggregateId, expectedVersion: input.expectedVersion, value });
  }

  private validate(input: MutationInput<T>): void { if (!input.tenantId || !input.ownerUserId || !input.aggregateId || !input.idempotencyKey || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 0 || typeof input.mutate !== 'function') throw new AggregateMutationError('INVALID_MUTATION', 'invalid mutation envelope'); }
}
