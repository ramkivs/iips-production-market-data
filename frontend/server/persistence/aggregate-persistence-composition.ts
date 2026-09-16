import { type AggregatePersistence } from './aggregate-persistence';
import { JournalAggregateStore } from './journal-aggregate-adapter';
import { PersistenceService } from './persistence-service';

/**
 * Domain-neutral production composition point.
 * The caller supplies the existing journal authority; this factory selects the
 * journal-backed aggregate implementation and exposes only the shared contract.
 */
export function createProductionAggregatePersistence<T>(
  journal: PersistenceService,
  clock?: () => string,
  idFactory?: () => string,
): AggregatePersistence<T> {
  return new JournalAggregateStore<T>(journal, clock, idFactory);
}
