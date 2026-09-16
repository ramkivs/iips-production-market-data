/**
 * P13-B governed server-side Watchlist/Alert trigger evaluator.
 *
 * Domain-neutral: C-WL/C-AL own rule/lifecycle state; this service only evaluates bounded
 * governed inputs and emits deterministic results. It rejects provider-shaped fields.
 */
export type GovernedQuality = 'good' | 'stale' | 'partial' | 'unavailable';
export type TriggerOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';
export type TriggerKind = 'FIELD_THRESHOLD' | 'SCORE_CHANGE' | 'GOVERNED_EVENT' | 'QUALITY_CHANGE' | 'FRESHNESS_CHANGE';
export type GovernedObjectType = 'company' | 'research' | 'holding' | 'decision' | 'evidence' | 'alert' | 'report' | 'security' | 'issuer';

export interface GovernedSubject { readonly objectType: GovernedObjectType; readonly objectId: string; }
export interface GovernedInput {
  readonly tenantId: string; readonly subject: GovernedSubject; readonly field: string;
  readonly value: unknown; readonly previousValue?: unknown; readonly eventType?: string;
  readonly quality: GovernedQuality; readonly freshness: 'LIVE' | 'SNAPSHOT' | 'PIT' | 'STALE' | 'UNAVAILABLE';
  readonly asOf: string; readonly dataVersion: string; readonly provenance: Readonly<Record<string, unknown>>;
}
export interface TriggerRule {
  readonly tenantId: string; readonly ruleId: string; readonly ownerUserId: string;
  readonly kind: TriggerKind; readonly subject: GovernedSubject; readonly field?: string;
  readonly operator?: TriggerOperator; readonly threshold?: unknown; readonly eventType?: string;
}
export interface EvaluationResult {
  readonly evaluationId: string; readonly deduplicationKey: string; readonly tenantId: string;
  readonly ruleId: string; readonly subject: GovernedSubject; readonly matched: boolean;
  readonly kind: TriggerKind; readonly asOf: string; readonly dataVersion: string;
  readonly quality: GovernedQuality; readonly freshness: GovernedInput['freshness'];
  readonly provenance: Readonly<Record<string, unknown>>; readonly emittedAlertEvent: boolean;
}

const OPERATORS = new Set<TriggerOperator>(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn']);
const KINDS = new Set<TriggerKind>(['FIELD_THRESHOLD', 'SCORE_CHANGE', 'GOVERNED_EVENT', 'QUALITY_CHANGE', 'FRESHNESS_CHANGE']);
const OBJECT_TYPES = new Set<GovernedObjectType>(['company', 'research', 'holding', 'decision', 'evidence', 'alert', 'report', 'security', 'issuer']);
const PROVIDER_FIELD = /(^|[.:_])(provider|raw|vendor|endpoint|exchangeSymbol)([.:_]|$)/i;

export class TriggerEvaluationError extends Error {
  constructor(readonly code: 'INVALID_RULE' | 'INVALID_INPUT' | 'TENANT_SCOPE_DENIED' | 'UNAVAILABLE_INPUT', message: string) { super(message); }
}

export class GovernedTriggerEvaluator {
  private readonly seen = new Map<string, EvaluationResult>();
  private sequence = 0;

  evaluate(rule: TriggerRule, input: GovernedInput): EvaluationResult {
    this.validate(rule, input);
    if (rule.tenantId !== input.tenantId) throw new TriggerEvaluationError('TENANT_SCOPE_DENIED', 'rule and input tenants differ');
    const key = this.key(rule, input);
    const existing = this.seen.get(key);
    if (existing) return existing;
    if (input.quality === 'unavailable' || input.freshness === 'UNAVAILABLE') {
      throw new TriggerEvaluationError('UNAVAILABLE_INPUT', 'governed input is unavailable');
    }
    const matched = this.match(rule, input);
    const result = Object.freeze({
      evaluationId: `evaluation-${++this.sequence}`,
      deduplicationKey: key, tenantId: input.tenantId, ruleId: rule.ruleId, subject: rule.subject,
      matched, kind: rule.kind, asOf: input.asOf, dataVersion: input.dataVersion,
      quality: input.quality, freshness: input.freshness, provenance: input.provenance,
      emittedAlertEvent: matched,
    });
    this.seen.set(key, result);
    return result;
  }

  private match(rule: TriggerRule, input: GovernedInput): boolean {
    switch (rule.kind) {
      case 'FIELD_THRESHOLD': return this.compare(rule.operator!, input.value, rule.threshold);
      case 'SCORE_CHANGE': return input.previousValue !== undefined && input.value !== input.previousValue;
      case 'GOVERNED_EVENT': return input.eventType === rule.eventType;
      case 'QUALITY_CHANGE': return input.previousValue !== undefined && input.quality !== input.previousValue;
      case 'FRESHNESS_CHANGE': return input.previousValue !== undefined && input.freshness !== input.previousValue;
      default: throw new TriggerEvaluationError('INVALID_RULE', 'unsupported trigger kind');
    }
  }

  private compare(operator: TriggerOperator, value: unknown, threshold: unknown): boolean {
    switch (operator) {
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      case 'gt': return typeof value === 'number' && typeof threshold === 'number' && value > threshold;
      case 'gte': return typeof value === 'number' && typeof threshold === 'number' && value >= threshold;
      case 'lt': return typeof value === 'number' && typeof threshold === 'number' && value < threshold;
      case 'lte': return typeof value === 'number' && typeof threshold === 'number' && value <= threshold;
      case 'in': return Array.isArray(threshold) && threshold.includes(value);
      case 'notIn': return Array.isArray(threshold) && !threshold.includes(value);
      default: throw new TriggerEvaluationError('INVALID_RULE', 'unsupported operator');
    }
  }

  private key(rule: TriggerRule, input: GovernedInput): string {
    return [input.tenantId, rule.ruleId, input.subject.objectType, input.subject.objectId, input.asOf, input.dataVersion].join('|');
  }

  private validate(rule: TriggerRule, input: GovernedInput): void {
    if (!rule.tenantId || !rule.ruleId || !rule.ownerUserId || !KINDS.has(rule.kind) ||
        !OBJECT_TYPES.has(rule.subject.objectType) || !rule.subject.objectId) {
      throw new TriggerEvaluationError('INVALID_RULE', 'invalid governed trigger rule');
    }
    if (rule.operator !== undefined && !OPERATORS.has(rule.operator)) throw new TriggerEvaluationError('INVALID_RULE', 'unsupported operator');
    if (!input.tenantId || !input.field || !input.asOf || !input.dataVersion || !input.provenance ||
        !OBJECT_TYPES.has(input.subject.objectType) || !input.subject.objectId) {
      throw new TriggerEvaluationError('INVALID_INPUT', 'incomplete governed input');
    }
    if (PROVIDER_FIELD.test(input.field)) throw new TriggerEvaluationError('INVALID_INPUT', 'provider-specific field rejected');
    if (input.quality === 'unavailable' && input.value !== null) throw new TriggerEvaluationError('INVALID_INPUT', 'unavailable input cannot carry a value');
  }
}
