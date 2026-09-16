import { describe, expect, it } from 'vitest';
import { AggregateMutationError, AggregateMutationStore } from './aggregate-persistence';

type V = { state: string };
const make = () => new AggregateMutationStore<V>(() => '2026-09-16T00:00:00.000Z', (() => { let n = 0; return () => `h-${++n};`; })());
const input = (store: AggregateMutationStore<V>, patch: Partial<Parameters<typeof store.mutate>[0]> = {}) => ({
  tenantId: 't1', ownerUserId: 'u1', aggregateId: 'a1', expectedVersion: 0, idempotencyKey: 'k1',
  mutate: () => ({ state: 'created' }), ...patch,
});

describe('P13-B bounded aggregate persistence primitive', () => {
  it('mutates successfully with server-derived version/timestamp/history', () => {
    const s = make(); const r = s.mutate(input(s));
    expect(r.record.version).toBe(1); expect(r.record.updatedAt).toContain('2026-09-16');
    expect(s.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
  });
  it('accepts expectedVersion and rejects conflicts', () => {
    const s = make(); s.mutate(input(s));
    expect(() => s.mutate(input(s, { expectedVersion: 0, idempotencyKey: 'k2' }))).toThrowError(AggregateMutationError);
    try { s.mutate(input(s, { expectedVersion: 0, idempotencyKey: 'k3' })); } catch (e) { expect((e as AggregateMutationError).code).toBe('VERSION_CONFLICT'); }
  });
  it('replays the same idempotent mutation without duplicate history', () => {
    const s = make(); const a = s.mutate(input(s)); const b = s.mutate(input(s));
    expect(b.replayed).toBe(true); expect(b.record).toEqual(a.record); expect(s.historyFor('t1', 'u1', 'a1')).toHaveLength(1);
  });
  it('atomically rolls back a multi-record mutation when one item fails', () => {
    const s = make();
    expect(() => s.mutateMany([
      { ...input(s), aggregateId: 'a1', groupKey: 'g' },
      { ...input(s), aggregateId: 'a2', groupKey: 'g', expectedVersion: 2, idempotencyKey: 'k2' },
    ])).toThrow();
    expect(s.read('t1', 'u1', 'a1')).toBeUndefined(); expect(s.read('t1', 'u1', 'a2')).toBeUndefined();
  });
  it('enforces tenant/owner isolation and deterministic repeated fixtures', () => {
    const s = make(); s.mutate(input(s));
    expect(() => s.read('t2', 'u1', 'a1')).toThrowError(AggregateMutationError);
    expect(s.historyFor('t1', 'u1', 'a1')[0].historyId).toBe('h-1;');
  });
  it('rejects malformed mutation envelopes', () => {
    const s = make(); expect(() => s.mutate(input(s, { expectedVersion: -1 }))).toThrowError(AggregateMutationError);
  });
});
