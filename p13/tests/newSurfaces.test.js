/**
 * P13 — New Surfaces (UI07, UI09, UI10) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWatchlistView,
  buildAlertsView,
  buildCollaborationView,
} from '../src/newSurfaces.js';
import { CrossSurfaceViolation } from '../src/crossSurfaceRules.js';
import { testProvenance, TENANT_ID, AS_OF } from './helpers.js';

describe('P13 New Surfaces', () => {
  const prov = testProvenance();

  describe('UI07 Watchlists', () => {
    it('builds a watchlist view', () => {
      const view = buildWatchlistView({
        watchlistId: 'WL-001',
        items: [{ id: 'I1', symbol: 'AAPL' }],
        provenances: [prov],
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI07');
      assert.equal(view.disposition, 'NEW');
      assert.equal(view.totalItems, 1);
      assert.ok(view.items[0]._degradation);
    });

    it('rejects empty watchlistId', () => {
      assert.throws(
        () => buildWatchlistView({ watchlistId: '', items: [], provenances: [], tenantId: TENANT_ID }),
        CrossSurfaceViolation
      );
    });
  });

  describe('UI09 Alerts', () => {
    it('evaluates alerts deterministically', () => {
      const view = buildAlertsView({
        alertRules: [{ ruleId: 'R1', evaluate: (p) => p.value > 50 }],
        dataPoints: [{ id: 'D1', value: 100 }, { id: 'D2', value: 10 }],
        provenances: [prov, prov],
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI09');
      assert.equal(view.triggeredCount, 1);
    });

    it('skips alerts on unavailable data', () => {
      const unavailProv = testProvenance({ quality: 'unavailable' });
      const view = buildAlertsView({
        alertRules: [{ ruleId: 'R1', evaluate: () => true }],
        dataPoints: [{ id: 'D1', value: 100 }],
        provenances: [unavailProv],
        tenantId: TENANT_ID,
      });
      assert.equal(view.skippedCount, 1);
      assert.equal(view.triggeredCount, 0);
    });
  });

  describe('UI10 Collaboration', () => {
    it('pins vintage on comments', () => {
      const view = buildCollaborationView({
        threadId: 'T-001',
        comments: [{ id: 'C1', text: 'Looks good' }],
        pinnedProvenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI10');
      assert.equal(view.disposition, 'NEW');
      assert.ok(view.pinnedVintage);
      assert.equal(view.pinnedVintage.dataVersion, 'v1');
      assert.ok(view.comments[0]._pinnedVintage);
    });
  });
});
