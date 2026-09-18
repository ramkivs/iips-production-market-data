import { describe, expect, it } from 'vitest';
import { GovernedTriggerEvaluator, TriggerEvaluationError, type GovernedInput, type TriggerRule } from './trigger-evaluator';

const input = (patch: Partial<GovernedInput> = {}): GovernedInput => ({
  tenantId: 't1', subject: { objectType: 'security', objectId: 'SEC-1' }, field: 'MD.price', value: 12,
  quality: 'good', freshness: 'PIT', asOf: '2026-09-16T00:00:00.000Z', dataVersion: 'v1', provenance: { source: 'governed:test' }, ...patch,
});
const rule = (patch: Partial<TriggerRule> = {}): TriggerRule => ({
  tenantId: 't1', ruleId: 'r1', ownerUserId: 'u1', kind: 'FIELD_THRESHOLD', subject: { objectType: 'security', objectId: 'SEC-1' }, field: 'MD.price', operator: 'gt', threshold: 10, ...patch,
});

describe('P13-B governed server-side trigger evaluator', () => {
  it('evaluates approved field operators', () => {
    const e = new GovernedTriggerEvaluator(); expect(e.evaluate(rule(), input()).matched).toBe(true);
    expect(e.evaluate(rule({ operator: 'lt', threshold: 10 }), input({ asOf: '2026-09-16T00:01:00.000Z' })).matched).toBe(false);
  });
  it('evaluates score changes and governed events', () => {
    const e = new GovernedTriggerEvaluator();
    expect(e.evaluate(rule({ kind: 'SCORE_CHANGE' }), input({ previousValue: 10 })).matched).toBe(true);
    expect(e.evaluate(rule({ kind: 'GOVERNED_EVENT', eventType: 'D06.news.published' }), input({ eventType: 'D06.news.published', asOf: '2026-09-16T00:02:00.000Z' })).matched).toBe(true);
  });
  it('preserves asOf, dataVersion, provenance, quality and freshness', () => {
    const r = new GovernedTriggerEvaluator().evaluate(rule(), input({ quality: 'stale', freshness: 'STALE' }));
    expect(r.asOf).toBe('2026-09-16T00:00:00.000Z'); expect(r.dataVersion).toBe('v1'); expect(r.quality).toBe('stale'); expect(r.freshness).toBe('STALE');
  });
  it('deduplicates repeated evaluation deterministically', () => {
    const e = new GovernedTriggerEvaluator(); const a = e.evaluate(rule(), input()); const b = e.evaluate(rule(), input());
    expect(b).toEqual(a); expect(a.evaluationId).toBe('evaluation-1');
  });
  it('rejects unavailable, malformed, unresolved, cross-tenant and provider fields', () => {
    const e = new GovernedTriggerEvaluator();
    expect(() => e.evaluate(rule(), input({ quality: 'unavailable', freshness: 'UNAVAILABLE', value: null }))).toThrowError(TriggerEvaluationError);
    expect(() => e.evaluate(rule(), input({ field: 'provider.rawPrice', asOf: '2026-09-16T00:03:00.000Z' }))).toThrowError(TriggerEvaluationError);
    expect(() => e.evaluate(rule({ tenantId: 't2' }), input())).toThrowError(TriggerEvaluationError);
    expect(() => e.evaluate(rule({ subject: { objectType: 'security', objectId: '' } }), input())).toThrowError(TriggerEvaluationError);
  });
  it('rejects unsupported rule/operator vocabulary', () => {
    const e = new GovernedTriggerEvaluator();
    expect(() => e.evaluate(rule({ operator: 'contains' as never }), input())).toThrowError(TriggerEvaluationError);
    expect(() => e.evaluate(rule({ kind: 'SCRIPT' as never }), input())).toThrowError(TriggerEvaluationError);
  });
});
