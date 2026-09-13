/**
 * P13 — Resolver Surface (UI13/UI14) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSearchView,
  searchAndBuildView,
  resolveAndBuildView,
  assertSharedResolver,
} from '../src/resolverSurface.js';
import { executeSearch, buildResolutionRequest, resolveObject } from '../../p12/src/objectResolutionContract.js';
import { MappingRegister } from '../../p05/src/identity.js';
import { testProvenance, TENANT_ID, AS_OF } from './helpers.js';

describe('P13 UI13/UI14 Resolver Surface', () => {
  const provenance = testProvenance();
  const universe = [
    { objectType: 'security', canonicalSecurityId: 'SEC-001', name: 'Apple', symbol: 'AAPL' },
    { objectType: 'security', canonicalSecurityId: 'SEC-002', name: 'Google', symbol: 'GOOG' },
  ];
  const register = new MappingRegister({ version: '1.0', records: [] });

  describe('buildSearchView', () => {
    it('builds UI13 search view', () => {
      const searchResult = executeSearch({ universe, query: 'Apple', asOf: AS_OF, tenantId: TENANT_ID });
      const view = buildSearchView({ searchResult, provenance, surface: 'UI13' });
      assert.equal(view.surfaceName, 'UI13');
      assert.equal(view.resolverContract, 'P12-C7');
      assert.equal(view.totalMatches, 1);
    });

    it('builds UI14 search view', () => {
      const searchResult = executeSearch({ universe, query: 'Google', asOf: AS_OF, tenantId: TENANT_ID });
      const view = buildSearchView({ searchResult, provenance, surface: 'UI14' });
      assert.equal(view.surfaceName, 'UI14');
    });

    it('rejects unauthorized surface', () => {
      const searchResult = executeSearch({ universe, query: 'x', asOf: AS_OF, tenantId: TENANT_ID });
      assert.throws(
        () => buildSearchView({ searchResult, provenance, surface: 'UI01' }),
        /not authorized/
      );
    });
  });

  describe('searchAndBuildView', () => {
    it('combines search and view building', () => {
      const view = searchAndBuildView({
        universe, query: 'Apple', asOf: AS_OF, tenantId: TENANT_ID,
        provenance, surface: 'UI13',
      });
      assert.equal(view.surfaceName, 'UI13');
      assert.ok(view.provenanceView);
    });
  });

  describe('resolveAndBuildView', () => {
    const securities = [
      { canonicalSecurityId: 'SEC-001', symbol: 'AAPL', identifiers: { FIGI: 'FIGI-001' } },
    ];

    it('resolves and builds view', () => {
      const request = buildResolutionRequest({
        inputType: 'canonicalSecurityId', inputValue: 'SEC-001', asOf: AS_OF, tenantId: TENANT_ID,
      });
      const view = resolveAndBuildView({
        request, securities, register, provenance, surface: 'UI13',
      });
      assert.equal(view.resolved, true);
      assert.equal(view.resolution.canonicalSecurityId, 'SEC-001');
    });
  });

  describe('assertSharedResolver', () => {
    it('passes when both use P12-C7', () => {
      const sr = executeSearch({ universe, query: 'x', asOf: AS_OF, tenantId: TENANT_ID });
      const v13 = buildSearchView({ searchResult: sr, provenance, surface: 'UI13' });
      const v14 = buildSearchView({ searchResult: sr, provenance, surface: 'UI14' });
      assert.equal(assertSharedResolver(v13, v14), true);
    });
  });
});
