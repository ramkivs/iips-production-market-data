/**
 * P12-04 — Object-Resolution / Search Contract tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResolutionRequest,
  resolveObject,
  executeSearch,
  buildObjectReference,
  ResolutionViolation,
  RESOLUTION_INPUT_TYPES,
  OBJECT_TYPES,
} from '../src/objectResolutionContract.js';
import { MappingRegister } from '../../p05/src/identity.js';
import { testSecurity, testUniverse, TENANT_ID, AS_OF } from './helpers.js';

describe('P12-04 Object-Resolution / Search Contract', () => {
  const securities = [
    testSecurity('SEC-001'),
    testSecurity('SEC-002', { symbol: 'AAPL', name: 'Apple Inc' }),
    testSecurity('SEC-003', { symbol: 'GOOG', name: 'Alphabet Inc', lifecycleState: 'active' }),
  ];

  const register = new MappingRegister({ version: '1.0', records: [] });

  describe('buildResolutionRequest', () => {
    it('builds a valid request', () => {
      const req = buildResolutionRequest({
        inputType: 'canonicalSecurityId',
        inputValue: 'SEC-001',
        asOf: AS_OF,
        tenantId: TENANT_ID,
      });
      assert.equal(req.inputType, 'canonicalSecurityId');
      assert.equal(req.inputValue, 'SEC-001');
      assert.ok(Object.isFrozen(req));
    });

    it('rejects unknown inputType (OR-1)', () => {
      assert.throws(
        () => buildResolutionRequest({ inputType: 'foo', inputValue: 'x', asOf: AS_OF, tenantId: TENANT_ID }),
        ResolutionViolation
      );
    });

    it('rejects empty inputValue', () => {
      assert.throws(
        () => buildResolutionRequest({ inputType: 'symbol', inputValue: '', asOf: AS_OF, tenantId: TENANT_ID }),
        ResolutionViolation
      );
    });

    it('requires tenantId (OR-4)', () => {
      assert.throws(
        () => buildResolutionRequest({ inputType: 'symbol', inputValue: 'X', asOf: AS_OF, tenantId: '' }),
        ResolutionViolation
      );
    });

    it('accepts all valid input types', () => {
      for (const t of RESOLUTION_INPUT_TYPES) {
        const req = buildResolutionRequest({ inputType: t, inputValue: 'x', asOf: AS_OF, tenantId: TENANT_ID });
        assert.equal(req.inputType, t);
      }
    });
  });

  describe('resolveObject (OR-1/OR-2)', () => {
    it('resolves by canonicalSecurityId', () => {
      const req = buildResolutionRequest({
        inputType: 'canonicalSecurityId', inputValue: 'SEC-001', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const result = resolveObject({ request: req, securities, register });
      assert.equal(result.resolved, true);
      assert.equal(result.canonicalSecurityId, 'SEC-001');
    });

    it('resolves by symbol', () => {
      const req = buildResolutionRequest({
        inputType: 'symbol', inputValue: 'AAPL', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const result = resolveObject({ request: req, securities, register });
      assert.equal(result.resolved, true);
      assert.equal(result.symbol, 'AAPL');
    });

    it('resolves by identifier (FIGI)', () => {
      const req = buildResolutionRequest({
        inputType: 'identifier', inputValue: 'FIGI-SEC-001', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const result = resolveObject({ request: req, securities, register });
      assert.equal(result.resolved, true);
      assert.equal(result.canonicalSecurityId, 'SEC-001');
    });

    it('resolves by issuerId', () => {
      const req = buildResolutionRequest({
        inputType: 'issuerId', inputValue: 'ISS-001', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const result = resolveObject({ request: req, securities, register });
      assert.equal(result.resolved, true);
    });

    it('fails closed on unresolved (OR-2)', () => {
      const req = buildResolutionRequest({
        inputType: 'canonicalSecurityId', inputValue: 'NOTFOUND', asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.throws(
        () => resolveObject({ request: req, securities, register }),
        ResolutionViolation
      );
    });

    it('result is frozen', () => {
      const req = buildResolutionRequest({
        inputType: 'canonicalSecurityId', inputValue: 'SEC-001', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const result = resolveObject({ request: req, securities, register });
      assert.ok(Object.isFrozen(result));
    });
  });

  describe('executeSearch (OR-7)', () => {
    const universe = [
      { objectType: 'security', canonicalSecurityId: 'SEC-001', name: 'Apple', symbol: 'AAPL' },
      { objectType: 'security', canonicalSecurityId: 'SEC-002', name: 'Google', symbol: 'GOOG' },
      { objectType: 'report', canonicalSecurityId: 'RPT-001', name: 'Q4 Report' },
    ];

    it('finds matching objects', () => {
      const result = executeSearch({
        universe, query: 'Apple', asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.equal(result.totalMatches, 1);
      assert.equal(result.results[0].canonicalSecurityId, 'SEC-001');
    });

    it('searches by symbol', () => {
      const result = executeSearch({
        universe, query: 'GOOG', asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.equal(result.totalMatches, 1);
    });

    it('returns empty for no match', () => {
      const result = executeSearch({
        universe, query: 'ZYZYZY', asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.equal(result.totalMatches, 0);
    });

    it('filters by objectTypes', () => {
      const result = executeSearch({
        universe, query: 'Report', objectTypes: ['security'], asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.equal(result.totalMatches, 0); // reports excluded
    });

    it('result is frozen', () => {
      const result = executeSearch({
        universe, query: 'Apple', asOf: AS_OF, tenantId: TENANT_ID,
      });
      assert.ok(Object.isFrozen(result));
    });

    it('deterministic sort (OR-7)', () => {
      const r1 = executeSearch({ universe, query: 'e', asOf: AS_OF, tenantId: TENANT_ID });
      const r2 = executeSearch({ universe, query: 'e', asOf: AS_OF, tenantId: TENANT_ID });
      assert.deepEqual(r1.results.map((r) => r.canonicalSecurityId), r2.results.map((r) => r.canonicalSecurityId));
    });

    it('requires tenantId (OR-4)', () => {
      assert.throws(
        () => executeSearch({ universe, query: 'x', asOf: AS_OF, tenantId: '' }),
        ResolutionViolation
      );
    });
  });

  describe('buildObjectReference', () => {
    it('builds a typed reference', () => {
      const ref = buildObjectReference('company', 'COMP-001', AS_OF);
      assert.equal(ref.objectType, 'company');
      assert.equal(ref.objectId, 'COMP-001');
      assert.ok(Object.isFrozen(ref));
    });

    it('rejects unknown objectType', () => {
      assert.throws(() => buildObjectReference('foo', 'x', AS_OF), ResolutionViolation);
    });

    it('rejects empty objectId', () => {
      assert.throws(() => buildObjectReference('company', '', AS_OF), ResolutionViolation);
    });

    it('OBJECT_TYPES is a closed set', () => {
      assert.ok(OBJECT_TYPES.length > 0);
    });
  });
});
