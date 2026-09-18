import {
  type AggregateHistory,
  type AggregatePersistence,
  type AggregateRecord,
  type MutationInput,
  type MutationResult,
  type MultiMutationInput,
} from './aggregate-persistence';
import { createProductionAggregatePersistence } from './aggregate-persistence-composition';
import { PersistenceService } from './persistence-service';

/**
 * Infrastructure-only consumer boundary for generic aggregate persistence.
 * It intentionally contains no business vocabulary or aggregate schema.
 */
export class DomainNeutralAggregateCaller<T> {
  constructor(private readonly persistence: AggregatePersistence<T>) {}

  read(tenantId: string, ownerUserId: string, aggregateId: string): AggregateRecord<T> | undefined {
    return this.persistence.read(tenantId, ownerUserId, aggregateId);
  }

  mutate(input: MutationInput<T>): MutationResult<T> {
    return this.persistence.mutate(input);
  }

  mutateMany(inputs: readonly MultiMutationInput<T>[]): readonly MutationResult<T>[] {
    return this.persistence.mutateMany(inputs);
  }

  historyFor(tenantId: string, ownerUserId: string, aggregateId: string): readonly AggregateHistory<T>[] {
    return this.persistence.historyFor(tenantId, ownerUserId, aggregateId);
  }

  recoverScope(tenantId: string, ownerUserId: string): void {
    this.persistence.recoverScope(tenantId, ownerUserId);
  }
}

/** Production composition for the infrastructure-only caller. */
export function createProductionDomainNeutralAggregateCaller<T>(
  journal: PersistenceService,
  clock?: () => string,
  idFactory?: () => string,
): DomainNeutralAggregateCaller<T> {
  return new DomainNeutralAggregateCaller(createProductionAggregatePersistence<T>(journal, clock, idFactory));
}
