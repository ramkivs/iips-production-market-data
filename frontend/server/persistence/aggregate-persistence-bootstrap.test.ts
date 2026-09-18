import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AggregateMutationError } from './aggregate-persistence';
import { createProductionAggregatePersistenceBootstrap } from './aggregate-persistence-bootstrap';
import { PersistenceService } from './persistence-service';

type Value = { state: string };
const mutation = (expectedVersion = 0, key = 'k1', tenantId = 'tenant-A', ownerUserId = 'user-A') => ({ tenantId, ownerUserId, aggregateId: 'a1', expectedVersion, idempotencyKey: key, mutate: () => ({ state: 'ready' }) });

describe('aggregate persistence bootstrap owner', () => {
  it('forwards an existing trusted context into the journal-backed caller', () => {
    const dir = mkdtempSync(join(tmpdir(), 'iips-bootstrap-'));
    try {
      const journal = new PersistenceService({ dataDir: dir });
      const context = { tenantId: 'tenant-A', userId: 'user-A' };
      const bootstrap = createProductionAggregatePersistenceBootstrap<Value>(context, journal, () => '2026-09-16T00:00:00.000Z', () => 'h-1');
      expect(bootstrap.context).toBe(context);
      expect(bootstrap.mutate(mutation()).record.version).toBe(1);
      expect(bootstrap.read('a1')?.version).toBe(1);
      expect(bootstrap.mutate(mutation()).replayed).toBe(true);
      expect(() => bootstrap.mutate(mutation(0, 'k2'))).toThrowError(AggregateMutationError);
      expect(() => bootstrap.mutate(mutation(0, 'cross', 'tenant-B', 'user-A'))).toThrowError(AggregateMutationError);
      expect(bootstrap.historyFor('a1')).toHaveLength(1);
      const restarted = createProductionAggregatePersistenceBootstrap<Value>(context, new PersistenceService({ dataDir: dir }), () => '2026-09-16T00:00:00.000Z', () => 'h-restart');
      restarted.recover();
      expect(restarted.read('a1')?.version).toBe(1);
      expect(restarted.mutate(mutation()).replayed).toBe(true);
      expect(restarted.historyFor('a1')).toHaveLength(1);
      const source = readFileSync(join(__dirname, 'aggregate-persistence-bootstrap.ts'), 'utf8');
      expect(source).not.toContain('JournalAggregateStore');
      expect(source).not.toContain('AggregateMutationStore');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
