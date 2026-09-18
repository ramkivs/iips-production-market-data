import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PersistenceService } from './persistence/persistence-service';
import { WatchlistAlertPersistence, WatchlistAlertPersistenceError } from './watchlist-alert-persistence';

const scope = { tenantId: 'tenant-A', ownerUserId: 'user-A' };
const other = { tenantId: 'tenant-A', ownerUserId: 'user-B' };
const dir = () => mkdtempSync(join(tmpdir(), 'g018-'));

function make() {
  const dataDir = dir();
  const persistence = new WatchlistAlertPersistence({
    journal: new PersistenceService({ dataDir }),
    idFactory: (() => { let n = 0; return () => `id-${++n};`; })(),
  });
  return { persistence, dataDir };
}

describe('G-018 bounded durable Watchlist/Alert persistence', () => {
  it('persists a scoped Watchlist and reconstructs it from the existing journal', () => {
    const { persistence, dataDir } = make();
    try {
      const created = persistence.createWatchlist(scope, 'Research watchlist');
      persistence.addMembership(scope, created.watchlistId, { subjectType: 'company', subjectId: 'Banking' });
      const reloaded = new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir }) });
      expect(reloaded.getWatchlist(scope, created.watchlistId).memberships).toHaveLength(1);
      expect(reloaded.listWatchlists(scope)).toHaveLength(1);
    } finally { rmSync(dataDir, { recursive: true, force: true }); }
  });

  it('rejects foreign tenant/owner reads and mutations', () => {
    const { persistence, dataDir } = make();
    try {
      const created = persistence.createWatchlist(scope, 'Private');
      expect(() => persistence.getWatchlist(other, created.watchlistId)).toThrowError(WatchlistAlertPersistenceError);
      expect(() => persistence.addMembership(other, created.watchlistId, { subjectType: 'company', subjectId: 'Banking' })).toThrowError(WatchlistAlertPersistenceError);
    } finally { rmSync(dataDir, { recursive: true, force: true }); }
  });

  it('fails closed for unsupported membership/rule input', () => {
    const { persistence, dataDir } = make();
    try {
      const created = persistence.createWatchlist(scope, 'Rules');
      expect(() => persistence.addMembership(scope, created.watchlistId, { subjectType: 'research' as never, subjectId: 'x' })).toThrowError(WatchlistAlertPersistenceError);
      expect(() => persistence.addRule(scope, { ruleId: 'r', watchlistId: created.watchlistId, kind: 'UNSUPPORTED' as never, subject: { subjectType: 'company', subjectId: 'Banking' } })).toThrowError(WatchlistAlertPersistenceError);
    } finally { rmSync(dataDir, { recursive: true, force: true }); }
  });

  it('persists Alert OPEN → ACKNOWLEDGED distinctly from notification read state', () => {
    const { persistence, dataDir } = make();
    try {
      const watchlist = persistence.createWatchlist(scope, 'Alerts');
      persistence.addRule(scope, { ruleId: 'rule-1', watchlistId: watchlist.watchlistId, kind: 'FIELD_THRESHOLD', subject: { subjectType: 'company', subjectId: 'Banking' }, field: 'MD:price', operator: 'gt', threshold: 10 });
      const alert = persistence.createAlert(scope, { alertId: 'alert-1', tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, watchlistId: watchlist.watchlistId, ruleId: 'rule-1', state: 'OPEN', createdAt: '2026-09-17T00:00:00.000Z', sourceContext: { source: 'test' } });
      expect(alert.state).toBe('OPEN');
      expect(persistence.acknowledgeAlert(scope, { alertId: alert.alertId, acknowledgedBy: scope.ownerUserId, acknowledgedAt: '2026-09-17T00:01:00.000Z' }).state).toBe('ACKNOWLEDGED');
      expect(persistence.listAlerts(scope)).toHaveLength(1);
    } finally { rmSync(dataDir, { recursive: true, force: true }); }
  });

  it('persists required evidence references and optional replay references', () => {
    const { persistence, dataDir } = make();
    try {
      const watchlist = persistence.createWatchlist(scope, 'Evidence');
      persistence.addRule(scope, { ruleId: 'rule-1', watchlistId: watchlist.watchlistId, kind: 'QUALITY_CHANGE', subject: { subjectType: 'company', subjectId: 'Banking' } });
      persistence.createAlert(scope, { alertId: 'alert-1', tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, watchlistId: watchlist.watchlistId, ruleId: 'rule-1', state: 'OPEN', createdAt: '2026-09-17T00:00:00.000Z', sourceContext: {} });
      expect(persistence.addEvidenceReference(scope, { alertId: 'alert-1', evidenceId: 'ev-1', replayId: 'replay-1' }).replayId).toBe('replay-1');
    } finally { rmSync(dataDir, { recursive: true, force: true }); }
  });
});
