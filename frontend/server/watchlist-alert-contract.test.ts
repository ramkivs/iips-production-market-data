import { describe, expect, it } from 'vitest';
import {
  G018_CONTRACT_BOUNDARY,
  validateAlert,
  validateAlertAcknowledgement,
  validateAlertEvidenceReference,
  validateWatchlistMembership,
  validateWatchlistRule,
} from './watchlist-alert-contract';

const membership = { subjectType: 'company' as const, subjectId: 'Banking' };

describe('G-018 bounded Watchlist/Alert contract', () => {
  it('validates Watchlist membership and rule foundations', () => {
    expect(validateWatchlistMembership(membership).ok).toBe(true);
    expect(validateWatchlistRule({
      ruleId: 'rule-1', watchlistId: 'watchlist-1', kind: 'FIELD_THRESHOLD', subject: membership,
      field: 'MD:price', operator: 'gt', threshold: 10,
    }).ok).toBe(true);
  });

  it('fails closed for unsupported subjects, rule kinds, and operators', () => {
    expect(validateWatchlistMembership({ subjectType: 'research' as never, subjectId: 'x' }).ok).toBe(false);
    expect(validateWatchlistRule({
      ruleId: 'rule-1', watchlistId: 'watchlist-1', kind: 'UNSUPPORTED' as never,
      subject: membership, operator: 'contains' as never,
    }).ok).toBe(false);
  });

  it('validates an Alert and preserves the bounded state model', () => {
    expect(validateAlert({
      alertId: 'alert-1', tenantId: 'tenant-1', ownerUserId: 'user-1',
      watchlistId: 'watchlist-1', ruleId: 'rule-1', state: 'OPEN',
      createdAt: '2026-09-17T00:00:00.000Z', sourceContext: { source: 'bounded-contract' },
    }).ok).toBe(true);
    expect(validateAlert({
      alertId: '', tenantId: 'tenant-1', ownerUserId: 'user-1', watchlistId: 'w', ruleId: 'r',
      state: 'INVALID' as never, createdAt: '', sourceContext: {},
    }).ok).toBe(false);
  });

  it('keeps acknowledgement distinct from notification read-state', () => {
    expect(validateAlertAcknowledgement({ alertId: 'alert-1', acknowledgedBy: 'user-1', acknowledgedAt: '2026-09-17T00:00:00.000Z' }).ok).toBe(true);
  });

  it('supports evidence references and optional replay references without implementing replay', () => {
    expect(validateAlertEvidenceReference({ alertId: 'alert-1', evidenceId: 'ev-1' }).ok).toBe(true);
    expect(validateAlertEvidenceReference({ alertId: 'alert-1', evidenceId: 'ev-1', replayId: 'replay-1' }).ok).toBe(true);
  });

  it('records excluded runtime boundaries', () => {
    expect(G018_CONTRACT_BOUNDARY.persistence).toBe('NOT_AUTHORIZED');
    expect(G018_CONTRACT_BOUNDARY.p10EventIntegration).toBe('NOT_AUTHORIZED');
    expect(G018_CONTRACT_BOUNDARY.notificationDelivery).toBe('NOT_AUTHORIZED');
  });
});
