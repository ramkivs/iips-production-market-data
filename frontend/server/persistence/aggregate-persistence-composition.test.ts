import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AggregateMutationError, type AggregatePersistence } from './aggregate-persistence';
import { createProductionAggregatePersistence } from './aggregate-persistence-composition';
import { JournalAggregateStore } from './journal-aggregate-adapter';
import { PersistenceService } from './persistence-service';

type Value = { state: string };
const input = (expectedVersion = 0, key = 'k1', tenantId = 't1', ownerUserId = 'u1') => ({ tenantId, ownerUserId, aggregateId: 'a1', expectedVersion, idempotencyKey: key, mutate: () => ({ state: 'ready' }) });

describe('production aggregate persistence composition', () => {
  it('exposes the shared interface and selects JournalAggregateStore semantics', () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-compose-'));
    try {
      const journal = new PersistenceService({ dataDir: dir });
      const persistence: AggregatePersistence<Value> = createProductionAggregatePersistence<Value>(journal, () => '2026-09-16T00:00:00.000Z', () => 'h-1');
      expect(persistence).toBeInstanceOf(JournalAggregateStore);
      persistence.mutate(input());
      expect(journal.listOrdered('t1', 'u1')).toHaveLength(2);
      const restarted = createProductionAggregatePersistence<Value>(new PersistenceService({ dataDir: dir }), () => '2026-09-16T00:00:00.000Z', () => 'h-restart');
      restarted.recoverScope('t1', 'u1');
      expect(restarted.read('t1', 'u1', 'a1')?.version).toBe(1);
      expect(restarted.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
      expect(restarted.mutate(input()).replayed).toBe(true);
      expect(() => restarted.mutate(input(0, 'k2'))).toThrowError(AggregateMutationError);
      expect(() => restarted.read('t1', 'u1', 'a1')).not.toThrow();
      expect(() => restarted.read('t2', 'u1', 'a1')).toThrowError(AggregateMutationError);
      restarted.recoverScope('t1', 'u1');
      expect(restarted.read('t1', 'u1', 'a1')?.version).toBe(1);
      expect(restarted.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
