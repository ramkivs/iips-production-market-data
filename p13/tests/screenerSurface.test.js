/**
 * P13 — Screener Surface (UI05) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildScreenerView, executeAndBuildScreen, saveScreen } from '../src/screenerSurface.js';
import { executeScreen } from '../../p12/src/screenerContract.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { testProvenance, testUniverse, TENANT_ID, AS_OF } from './helpers.js';

describe('P13 UI05 Screener Surface', () => {
  const universe = testUniverse(5);
  const sort = [{ field: `${NAMESPACE_TOKEN}fundamentals.revenue`, direction: 'desc' }];
  const provenance = testProvenance();

  describe('buildScreenerView', () => {
    it('builds a view from C6 screen result', () => {
      const screenResult = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      const view = buildScreenerView({ screenResult, provenance });
      assert.equal(view.surfaceName, 'UI05');
      assert.equal(view.disposition, 'NEW');
      assert.equal(view.totalRows, 5);
      assert.ok(view.provenanceView);
    });

    it('adds degradation display per row', () => {
      const screenResult = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      const view = buildScreenerView({ screenResult, provenance });
      for (const row of view.rows) {
        assert.ok(row._degradationDisplay);
        assert.ok(row._degradationDisplay.label);
        assert.ok(row._degradationDisplay.severity);
      }
    });

    it('is frozen', () => {
      const screenResult = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      const view = buildScreenerView({ screenResult, provenance });
      assert.ok(Object.isFrozen(view));
    });
  });

  describe('executeAndBuildScreen', () => {
    it('combines execution and view building', () => {
      const view = executeAndBuildScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID, provenance,
      });
      assert.equal(view.surfaceName, 'UI05');
      assert.ok(view.rows.length > 0);
    });
  });

  describe('saveScreen', () => {
    it('saves a PIT-capable screen definition', () => {
      const def = saveScreen({
        screenId: 's1',
        filters: [],
        sort,
        tieBreakField: 'canonicalSecurityId',
        tenantId: TENANT_ID,
      });
      assert.equal(def.pitCapable, true);
    });
  });
});
