/**
 * G-018 A3 — bounded Watchlist/Alert contract foundations.
 *
 * Contract-only: no persistence, event producer, notification delivery, or production behavior.
 * Existing trigger evaluation is referenced by rule kind/input shape only; it is not activated
 * or connected to the P10 runtime vocabulary.
 */

export type WatchlistRuleKind =
  | 'FIELD_THRESHOLD'
  | 'SCORE_CHANGE'
  | 'QUALITY_CHANGE'
  | 'FRESHNESS_CHANGE';

export type AlertState = 'OPEN' | 'ACKNOWLEDGED';

export interface Watchlist {
  readonly watchlistId: string;
  readonly ownerUserId: string;
  readonly tenantId: string;
  readonly name: string;
  readonly memberships: readonly WatchlistMembership[];
  readonly rules: readonly WatchlistRule[];
}

export interface WatchlistMembership {
  readonly subjectType: 'company' | 'holding' | 'issuer' | 'security';
  readonly subjectId: string;
}

export interface WatchlistRule {
  readonly ruleId: string;
  readonly watchlistId: string;
  readonly kind: WatchlistRuleKind;
  readonly subject: WatchlistMembership;
  readonly field?: string;
  readonly operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';
  readonly threshold?: unknown;
}

export interface Alert {
  readonly alertId: string;
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly watchlistId: string;
  readonly ruleId: string;
  readonly state: AlertState;
  readonly createdAt: string;
  readonly sourceContext: Readonly<Record<string, unknown>>;
}

export interface AlertNotificationLink {
  readonly alertId: string;
  readonly notificationType: string;
  readonly notificationId?: string;
}

export interface AlertAcknowledgement {
  readonly alertId: string;
  readonly acknowledgedBy: string;
  readonly acknowledgedAt: string;
}

export interface AlertEvidenceReference {
  readonly alertId: string;
  readonly evidenceId: string;
  readonly replayId?: string;
}

export interface ContractValidation {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

const RULE_KINDS: readonly WatchlistRuleKind[] = Object.freeze([
  'FIELD_THRESHOLD', 'SCORE_CHANGE', 'QUALITY_CHANGE', 'FRESHNESS_CHANGE',
]);
const SUBJECT_TYPES = new Set<WatchlistMembership['subjectType']>(['company', 'holding', 'issuer', 'security']);
const OPERATORS = new Set<NonNullable<WatchlistRule['operator']>>(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn']);

function requiredString(value: unknown, label: string, errors: string[]): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${label} must be a non-empty string`);
    return false;
  }
  return true;
}

export function validateWatchlistMembership(value: WatchlistMembership): ContractValidation {
  const errors: string[] = [];
  if (!value || !SUBJECT_TYPES.has(value.subjectType)) errors.push('membership subjectType is unsupported');
  requiredString(value?.subjectId, 'membership subjectId', errors);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function validateWatchlistRule(value: WatchlistRule): ContractValidation {
  const errors: string[] = [];
  requiredString(value?.ruleId, 'ruleId', errors);
  requiredString(value?.watchlistId, 'watchlistId', errors);
  if (!value || !RULE_KINDS.includes(value.kind)) errors.push('rule kind is unsupported');
  const membership = validateWatchlistMembership(value?.subject);
  errors.push(...membership.errors);
  if (value?.operator !== undefined && !OPERATORS.has(value.operator)) errors.push('rule operator is unsupported');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function validateAlert(value: Alert): ContractValidation {
  const errors: string[] = [];
  requiredString(value?.alertId, 'alertId', errors);
  requiredString(value?.tenantId, 'tenantId', errors);
  requiredString(value?.ownerUserId, 'ownerUserId', errors);
  requiredString(value?.watchlistId, 'watchlistId', errors);
  requiredString(value?.ruleId, 'ruleId', errors);
  if (!value || (value.state !== 'OPEN' && value.state !== 'ACKNOWLEDGED')) errors.push('alert state is unsupported');
  requiredString(value?.createdAt, 'createdAt', errors);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function validateAlertAcknowledgement(value: AlertAcknowledgement): ContractValidation {
  const errors: string[] = [];
  requiredString(value?.alertId, 'alertId', errors);
  requiredString(value?.acknowledgedBy, 'acknowledgedBy', errors);
  requiredString(value?.acknowledgedAt, 'acknowledgedAt', errors);
  if (value?.acknowledgedAt && Number.isNaN(Date.parse(value.acknowledgedAt))) errors.push('acknowledgedAt must be a valid timestamp');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function validateAlertEvidenceReference(value: AlertEvidenceReference): ContractValidation {
  const errors: string[] = [];
  requiredString(value?.alertId, 'alertId', errors);
  requiredString(value?.evidenceId, 'evidenceId', errors);
  if (value?.replayId !== undefined) requiredString(value.replayId, 'replayId', errors);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export const G018_CONTRACT_BOUNDARY = Object.freeze({
  persistence: 'NOT_AUTHORIZED',
  productionProducer: 'NOT_AUTHORIZED',
  p10EventIntegration: 'NOT_AUTHORIZED',
  notificationDelivery: 'NOT_AUTHORIZED',
  replayLinkage: 'OPTIONAL_REFERENCE_ONLY',
});
