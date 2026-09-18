/**
 * G-018 A1 — bounded durable Watchlist/Alert persistence.
 *
 * Uses the existing PF-1 PersistenceService journal. This module is the domain adapter and
 * server-scope boundary; it does not expose HTTP, create producers, publish events, or send
 * notifications. All tenant/owner values are supplied by the authenticated server context.
 */
import { randomUUID } from 'node:crypto';
import { PersistenceService, type PersistedRecord, resolveDataDir } from './persistence/persistence-service';
import {
  validateAlert, validateAlertAcknowledgement, validateAlertEvidenceReference,
  validateWatchlistMembership, validateWatchlistRule,
  type Alert, type AlertAcknowledgement, type AlertEvidenceReference,
  type Watchlist, type WatchlistMembership, type WatchlistRule,
} from './watchlist-alert-contract';

export type WatchlistAlertRecordKind = 'watchlist' | 'membership' | 'rule' | 'alert' | 'acknowledgement' | 'evidence';

interface StoredPayload {
  readonly kind: WatchlistAlertRecordKind;
  readonly value: Watchlist | WatchlistMembership & { readonly membershipId: string; readonly watchlistId: string }
    | WatchlistRule | Alert | AlertAcknowledgement | AlertEvidenceReference;
}

export interface PrincipalScope { readonly tenantId: string; readonly ownerUserId: string; }

export class WatchlistAlertPersistenceError extends Error {
  constructor(readonly code: 'INVALID' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT', message: string) {
    super(message);
    this.name = 'WatchlistAlertPersistenceError';
  }
}

export interface WatchlistAlertPersistenceOptions {
  readonly journal?: PersistenceService;
  readonly idFactory?: () => string;
}

export class WatchlistAlertPersistence {
  private readonly journal: PersistenceService;
  private readonly idFactory: () => string;

  constructor(options: WatchlistAlertPersistenceOptions = {}) {
    this.journal = options.journal ?? new PersistenceService({ dataDir: resolveDataDir() });
    this.idFactory = options.idFactory ?? randomUUID;
  }

  createWatchlist(scope: PrincipalScope, name: string): Watchlist {
    this.requireScope(scope);
    if (!name) throw new WatchlistAlertPersistenceError('INVALID', 'watchlist name is required');
    const watchlist: Watchlist = { watchlistId: this.idFactory(), tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, name, memberships: [], rules: [] };
    this.append(scope, 'watchlist', watchlist.watchlistId, watchlist);
    return watchlist;
  }

  updateWatchlist(scope: PrincipalScope, watchlistId: string, name: string): Watchlist {
    const current = this.getWatchlist(scope, watchlistId);
    if (!name) throw new WatchlistAlertPersistenceError('INVALID', 'watchlist name is required');
    const next = { ...current, name };
    this.append(scope, 'watchlist', watchlistId, next);
    return next;
  }

  addMembership(scope: PrincipalScope, watchlistId: string, membership: WatchlistMembership): WatchlistMembership & { membershipId: string; watchlistId: string } {
    const current = this.getWatchlist(scope, watchlistId);
    this.requireValid(validateWatchlistMembership(membership));
    if (current.memberships.some((m) => m.subjectType === membership.subjectType && m.subjectId === membership.subjectId)) {
      throw new WatchlistAlertPersistenceError('CONFLICT', 'membership already exists');
    }
    const value = { ...membership, membershipId: this.idFactory(), watchlistId };
    const next = { ...current, memberships: [...current.memberships, membership] };
    this.append(scope, 'watchlist', watchlistId, next);
    this.append(scope, 'membership', value.membershipId, value);
    return value;
  }

  addRule(scope: PrincipalScope, rule: WatchlistRule): WatchlistRule {
    const current = this.getWatchlist(scope, rule.watchlistId);
    this.requireValid(validateWatchlistRule(rule));
    if (rule.watchlistId !== current.watchlistId) throw new WatchlistAlertPersistenceError('FORBIDDEN', 'rule is outside watchlist scope');
    if (current.rules.some((r) => r.ruleId === rule.ruleId)) throw new WatchlistAlertPersistenceError('CONFLICT', 'rule already exists');
    this.append(scope, 'watchlist', current.watchlistId, { ...current, rules: [...current.rules, rule] });
    this.append(scope, 'rule', rule.ruleId, rule);
    return rule;
  }

  createAlert(scope: PrincipalScope, alert: Alert): Alert {
    const watchlist = this.getWatchlist(scope, alert.watchlistId);
    if (!watchlist.rules.some((r) => r.ruleId === alert.ruleId)) throw new WatchlistAlertPersistenceError('FORBIDDEN', 'alert rule is not owned by watchlist');
    if (alert.tenantId !== scope.tenantId || alert.ownerUserId !== scope.ownerUserId) throw new WatchlistAlertPersistenceError('FORBIDDEN', 'alert scope does not match principal');
    this.requireValid(validateAlert(alert));
    this.append(scope, 'alert', alert.alertId, alert);
    return alert;
  }

  acknowledgeAlert(scope: PrincipalScope, acknowledgement: AlertAcknowledgement): Alert {
    const alert = this.getAlert(scope, acknowledgement.alertId);
    this.requireValid(validateAlertAcknowledgement(acknowledgement));
    if (acknowledgement.acknowledgedBy !== scope.ownerUserId) throw new WatchlistAlertPersistenceError('FORBIDDEN', 'acknowledger is outside principal scope');
    const next: Alert = { ...alert, state: 'ACKNOWLEDGED' };
    this.append(scope, 'alert', alert.alertId, next);
    this.append(scope, 'acknowledgement', `${alert.alertId}:${acknowledgement.acknowledgedAt}`, acknowledgement);
    return next;
  }

  addEvidenceReference(scope: PrincipalScope, reference: AlertEvidenceReference): AlertEvidenceReference {
    this.getAlert(scope, reference.alertId);
    this.requireValid(validateAlertEvidenceReference(reference));
    this.append(scope, 'evidence', `${reference.alertId}:${reference.evidenceId}`, reference);
    return reference;
  }

  listWatchlists(scope: PrincipalScope): readonly Watchlist[] {
    this.requireScope(scope);
    const latest = new Map<string, Watchlist>();
    for (const record of this.journal.listOrdered(scope.tenantId, scope.ownerUserId)) {
      const payload = record.payload as Partial<StoredPayload>;
      if (payload.kind !== 'watchlist' || !payload.value || !('watchlistId' in payload.value)) continue;
      const value = payload.value as Watchlist;
      latest.set(value.watchlistId, value);
    }
    return Object.freeze([...latest.values()]);
  }

  listAlerts(scope: PrincipalScope): readonly Alert[] {
    this.requireScope(scope);
    const latest = new Map<string, Alert>();
    for (const record of this.journal.listOrdered(scope.tenantId, scope.ownerUserId)) {
      const payload = record.payload as Partial<StoredPayload>;
      if (payload.kind !== 'alert' || !payload.value || !('alertId' in payload.value)) continue;
      const value = payload.value as Alert;
      latest.set(value.alertId, value);
    }
    return Object.freeze([...latest.values()]);
  }

  getWatchlist(scope: PrincipalScope, watchlistId: string): Watchlist {
    return this.latest<Watchlist>(scope, 'watchlist', watchlistId);
  }

  getAlert(scope: PrincipalScope, alertId: string): Alert {
    return this.latest<Alert>(scope, 'alert', alertId);
  }

  private append(scope: PrincipalScope, kind: WatchlistAlertRecordKind, id: string, value: StoredPayload['value']): void {
    this.requireScope(scope);
    this.journal.append({ tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, dedupKey: `g018:${kind}:${id}:${this.fingerprint(value)}`, payload: { kind, value } satisfies StoredPayload });
  }

  private latest<T>(scope: PrincipalScope, kind: WatchlistAlertRecordKind, id: string): T {
    this.requireScope(scope);
    const records = this.journal.listOrdered(scope.tenantId, scope.ownerUserId)
      .filter((record) => this.matches(record, kind, id));
    if (records.length === 0) throw new WatchlistAlertPersistenceError('NOT_FOUND', `${kind} not found`);
    return (records[0].payload as StoredPayload).value as T;
  }

  private matches(record: PersistedRecord, kind: WatchlistAlertRecordKind, id: string): boolean {
    const payload = record.payload as Partial<StoredPayload>;
    if (payload.kind !== kind || !payload.value) return false;
    const value: object = payload.value;
    return (
      ('watchlistId' in value && value.watchlistId === id)
      || ('alertId' in value && value.alertId === id)
      || ('ruleId' in value && value.ruleId === id)
      || ('membershipId' in value && value.membershipId === id)
    );
  }

  private fingerprint(value: unknown): string { return JSON.stringify(value); }

  private requireScope(scope: PrincipalScope): void {
    if (!scope || !scope.tenantId || !scope.ownerUserId) throw new WatchlistAlertPersistenceError('FORBIDDEN', 'authenticated tenant and owner scope are required');
  }

  private requireValid(result: { ok: boolean; errors: readonly string[] }): void {
    if (!result.ok) throw new WatchlistAlertPersistenceError('INVALID', result.errors.join('; '));
  }
}
