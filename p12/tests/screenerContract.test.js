/**
 * P12-03 — Screener Contract tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFilter,
  evaluateFilters,
  deterministicSort,
  classifyRowDegradation,
  executeScreen,
  saveScreenDefinition,
  ScreenerViolation,
  FILTER_OPERATORS,
  SORT_DIRECTIONS,
} from '../src/screenerContract.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { testUniverse, TENANT_ID, AS_OF } from './helpers.js';

describe('P12-03 Screener Contract', () => {
  describe('applyFilter (SC-2)', () => {
    it('eq operator', () => {
      assert.equal(applyFilter('eq', 100, 100), true);
      assert.equal(applyFilter('eq', 100, 200), false);
    });

    it('neq operator', () => {
      assert.equal(applyFilter('neq', 100, 200), true);
      assert.equal(applyFilter('neq', 100, 100), false);
    });

    it('gt/gte/lt/lte operators', () => {
      assert.equal(applyFilter('gt', 100, 50), true);
      assert.equal(applyFilter('gt', 100, 100), false);
      assert.equal(applyFilter('gte', 100, 100), true);
      assert.equal(applyFilter('lt', 50, 100), true);
      assert.equal(applyFilter('lte', 100, 100), true);
    });

    it('in/notIn operators', () => {
      assert.equal(applyFilter('in', 'A', ['A', 'B']), true);
      assert.equal(applyFilter('in', 'C', ['A', 'B']), false);
      assert.equal(applyFilter('notIn', 'C', ['A', 'B']), true);
    });

    it('contains operator', () => {
      assert.equal(applyFilter('contains', 'hello world', 'world'), true);
      assert.equal(applyFilter('contains', 'hello', 'world'), false);
    });

    it('isNull/isNotNull operators', () => {
      assert.equal(applyFilter('isNull', null, null), true);
      assert.equal(applyFilter('isNull', undefined, null), true);
      assert.equal(applyFilter('isNull', 100, null), false);
      assert.equal(applyFilter('isNotNull', 100, null), true);
    });

    it('rejects unknown operator', () => {
      assert.throws(() => applyFilter('regex', 'x', 'y'), ScreenerViolation);
    });
  });

  describe('evaluateFilters', () => {
    it('matches all criteria (AND)', () => {
      const row = { revenue: 1000, quality: 'good' };
      assert.equal(evaluateFilters(row, [
        { field: 'revenue', operator: 'gt', operand: 500 },
        { field: 'quality', operator: 'eq', operand: 'good' },
      ]), true);
    });

    it('fails when one criterion fails', () => {
      const row = { revenue: 100, quality: 'good' };
      assert.equal(evaluateFilters(row, [
        { field: 'revenue', operator: 'gt', operand: 500 },
        { field: 'quality', operator: 'eq', operand: 'good' },
      ]), false);
    });

    it('empty criteria matches all', () => {
      assert.equal(evaluateFilters({ x: 1 }, []), true);
    });
  });

  describe('deterministicSort (SC-3)', () => {
    it('sorts ascending', () => {
      const rows = [
        { id: 'C', value: 3 },
        { id: 'A', value: 1 },
        { id: 'B', value: 2 },
      ];
      const sorted = deterministicSort(rows, [{ field: 'value', direction: 'asc' }], 'id');
      assert.deepEqual(sorted.map((r) => r.id), ['A', 'B', 'C']);
    });

    it('sorts descending', () => {
      const rows = [
        { id: 'A', value: 1 },
        { id: 'C', value: 3 },
        { id: 'B', value: 2 },
      ];
      const sorted = deterministicSort(rows, [{ field: 'value', direction: 'desc' }], 'id');
      assert.deepEqual(sorted.map((r) => r.id), ['C', 'B', 'A']);
    });

    it('tie-breaks on identity field (total order)', () => {
      const rows = [
        { id: 'B', value: 1 },
        { id: 'A', value: 1 },
        { id: 'C', value: 1 },
      ];
      const sorted = deterministicSort(rows, [{ field: 'value', direction: 'asc' }], 'id');
      assert.deepEqual(sorted.map((r) => r.id), ['A', 'B', 'C']);
    });

    it('does not mutate original', () => {
      const rows = [{ id: 'B', v: 2 }, { id: 'A', v: 1 }];
      const copy = [...rows];
      deterministicSort(rows, [{ field: 'v', direction: 'asc' }], 'id');
      assert.deepEqual(rows, copy);
    });

    it('rejects invalid sort direction', () => {
      assert.throws(
        () => deterministicSort([{ id: 'A' }], [{ field: 'id', direction: 'random' }], 'id'),
        ScreenerViolation
      );
    });
  });

  describe('classifyRowDegradation (SC-4)', () => {
    it('good → good', () => assert.equal(classifyRowDegradation('good'), 'good'));
    it('stale → degraded-stale', () => assert.equal(classifyRowDegradation('stale'), 'degraded-stale'));
    it('partial → degraded-partial', () => assert.equal(classifyRowDegradation('partial'), 'degraded-partial'));
    it('unavailable → degraded-unavailable', () => assert.equal(classifyRowDegradation('unavailable'), 'degraded-unavailable'));
    it('rejects unknown quality', () => assert.throws(() => classifyRowDegradation('excellent'), ScreenerViolation));
  });

  describe('executeScreen (SC-1/SC-4/SC-7)', () => {
    const universe = testUniverse(5);
    const sort = [{ field: `${NAMESPACE_TOKEN}fundamentals.revenue`, direction: 'desc' }];

    it('returns screen result with all required fields', () => {
      const result = executeScreen({
        universe,
        filters: [],
        sort,
        tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF,
        screenId: 'screen-001',
        tenantId: TENANT_ID,
      });

      assert.equal(result.screenId, 'screen-001');
      assert.equal(result.tenantId, TENANT_ID);
      assert.equal(result.asOf, AS_OF);
      assert.equal(result.mode, 'PIT');
      assert.ok(Array.isArray(result.rows));
      assert.equal(result.totalRows, 5);
    });

    it('result is frozen (SC-1)', () => {
      const result = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      assert.ok(Object.isFrozen(result));
      assert.ok(Object.isFrozen(result.rows));
    });

    it('filters reduce result count', () => {
      const result = executeScreen({
        universe,
        filters: [{ field: 'quality', operator: 'eq', operand: 'good' }],
        sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      assert.equal(result.totalRows, 3); // only 3 good rows
    });

    it('degraded rows are explicitly marked (SC-4)', () => {
      const result = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      const staleRows = result.rows.filter((r) => r._degradation !== 'good');
      assert.ok(staleRows.length > 0, 'should have degraded rows');
      for (const r of staleRows) {
        assert.ok(r._degradation.startsWith('degraded-'));
      }
    });

    it('screen quality is worst-case', () => {
      const result = executeScreen({
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      });
      // universe has good, good, good, stale, partial → worst is partial
      assert.equal(result.quality, 'partial');
    });

    it('deterministic: same input → same output (SC-1)', () => {
      const args = {
        universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
        asOf: AS_OF, screenId: 's1', tenantId: TENANT_ID,
      };
      const r1 = executeScreen(args);
      const r2 = executeScreen(args);
      assert.deepEqual(r1.rows.map((r) => r.canonicalSecurityId), r2.rows.map((r) => r.canonicalSecurityId));
    });

    it('requires tenantId (SC-6)', () => {
      assert.throws(
        () => executeScreen({
          universe, filters: [], sort, tieBreakField: 'canonicalSecurityId',
          asOf: AS_OF, screenId: 's1', tenantId: '',
        }),
        ScreenerViolation
      );
    });
  });

  describe('saveScreenDefinition (SC-7)', () => {
    it('returns a frozen definition', () => {
      const def = saveScreenDefinition({
        screenId: 's1',
        filters: [{ field: 'quality', operator: 'eq', operand: 'good' }],
        sort: [{ field: 'revenue', direction: 'desc' }],
        tieBreakField: 'canonicalSecurityId',
        tenantId: TENANT_ID,
      });
      assert.ok(Object.isFrozen(def));
      assert.equal(def.screenId, 's1');
      assert.equal(def.pitCapable, true);
    });
  });

  describe('closed sets', () => {
    it('FILTER_OPERATORS has 11 values', () => assert.equal(FILTER_OPERATORS.length, 11));
    it('SORT_DIRECTIONS has 2 values', () => assert.equal(SORT_DIRECTIONS.length, 2));
  });
});
