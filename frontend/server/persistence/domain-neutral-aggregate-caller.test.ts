import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AggregateMutationError, type AggregatePersistence } from './aggregate-persistence';
import { DomainNeutralAggregateCaller, createProductionDomainNeutralAggregateCaller } from './domain-neutral-aggregate-caller';
import { PersistenceService } from './persistence-service';

type Value = { state: string };
const mutation = (expectedVersion = 0, key = 'k1', tenantId = 't1', ownerUserId = 'u1') => ({ tenantId, ownerUserId, aggregateId: 'a1', expectedVersion, idempotencyKey: key, mutate: () => ({ state: 'ready' }) });

describe('domain-neutral aggregate caller', () => {
  it('depends on AggregatePersistence and uses the production journal composition', () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-caller-'));
    try {
      const journal = new PersistenceService({ dataDir: dir });
      const caller = createProductionDomainNeutralAggregateCaller<Value>(journal, () => '2026-09-16T00:00:00.000Z', () => 'h-1');
      expect(caller.mutate(mutation()).record.version).toBe(1);
      expect(caller.read('t1', 'u1', 'a1')?.version).toBe(1);
      expect(caller.mutate(mutation()).replayed).toBe(true);
      expect(() => caller.mutate(mutation(0, 'k2'))).toThrowError(AggregateMutationError);
      expect(() => caller.read('t2', 'u1', 'a1')).toThrowError(AggregateMutationError);
      expect(caller.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
      const restarted = createProductionDomainNeutralAggregateCaller<Value>(new PersistenceService({ dataDir: dir }), () => '2026-09-16T00:00:00.000Z', () => 'h-restart');
      restarted.recoverScope('t1', 'u1');
      expect(restarted.read('t1', 'u1', 'a1')?.version).toBe(1);
      expect(restarted.mutate(mutation()).replayed).toBe(true);
      expect(restarted.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('accepts an injected AggregatePersistence without concrete store imports', () => {
    const persistence: AggregatePersistence<Value> = {
      read: () => undefined,
      mutate: () => { throw new Error('not exercised'); },
      mutateMany: () => [],
      historyFor: () => [],
      recoverScope: () => undefined,
    };
    const caller = new DomainNeutralAggregateCaller(persistence);
    expect(caller.read('t1', 'u1', 'a1')).toBeUndefined();
    const source = readFileSync(join(__dirname, 'domain-neutral-aggregate-caller.ts'), 'utf8');
    expect(source).not.toContain('JournalAggregateStore');
    expect(source).not.toContain('AggregateMutationStore');
  });
});
