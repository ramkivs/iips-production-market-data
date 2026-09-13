/**
 * P12-07 — Endpoint Delta tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApiResponse,
  handleApiRequest,
  assertAdditiveEndpoint,
  buildPaginatedResponse,
  EndpointViolation,
  P12_ENDPOINTS,
  PRESERVED_ENDPOINTS,
  API_VERSION,
} from '../src/endpointDelta.js';
import { buildDataProvenance } from '../src/dataProvenanceDto.js';
import { AS_OF, RECEIVED_AT, DATA_VERSION, TENANT_ID } from './helpers.js';

describe('P12-07 Endpoint Delta', () => {
  const testProvenance = () =>
    buildDataProvenance({
      dataSource: 'governed:D03',
      freshness: 'SNAPSHOT',
      calibratedAt: AS_OF,
      transportSemantics: 'test',
      asOf: AS_OF,
      receivedAt: RECEIVED_AT,
      dataVersion: DATA_VERSION,
      mode: 'SNAPSHOT',
      quality: 'good',
      completenessPct: 100,
      classification: 'REAL',
    });

  describe('buildApiResponse (ED-4/ED-5)', () => {
    it('builds a governed response envelope', () => {
      const resp = buildApiResponse({
        data: { revenue: 1000 },
        provenance: testProvenance(),
        tenantId: TENANT_ID,
        endpoint: '/api/screener/execute',
      });
      assert.equal(resp.apiVersion, API_VERSION);
      assert.equal(resp.tenantId, TENANT_ID);
      assert.equal(resp.endpoint, '/api/screener/execute');
      assert.deepEqual(resp.data, { revenue: 1000 });
      assert.ok(resp.provenance);
    });

    it('is frozen', () => {
      const resp = buildApiResponse({
        data: {}, provenance: testProvenance(), tenantId: TENANT_ID, endpoint: '/api/x',
      });
      assert.ok(Object.isFrozen(resp));
    });

    it('requires tenantId (ED-4)', () => {
      assert.throws(
        () => buildApiResponse({ data: {}, provenance: testProvenance(), tenantId: '', endpoint: '/api/x' }),
        EndpointViolation
      );
    });
  });

  describe('handleApiRequest (ED-4)', () => {
    it('builds a governed request context', () => {
      const ctx = handleApiRequest({
        tenantId: TENANT_ID,
        endpoint: '/api/search',
        body: { query: 'Apple' },
        params: {},
        query: { limit: 10 },
      });
      assert.equal(ctx.apiVersion, API_VERSION);
      assert.equal(ctx.tenantId, TENANT_ID);
      assert.equal(ctx.endpoint, '/api/search');
      assert.deepEqual(ctx.body, { query: 'Apple' });
      assert.ok(Object.isFrozen(ctx));
    });

    it('rejects empty tenantId', () => {
      assert.throws(
        () => handleApiRequest({ tenantId: '', endpoint: '/api/x' }),
        EndpointViolation
      );
    });

    it('rejects empty endpoint', () => {
      assert.throws(
        () => handleApiRequest({ tenantId: TENANT_ID, endpoint: '' }),
        EndpointViolation
      );
    });
  });

  describe('assertAdditiveEndpoint (ED-1/ED-2)', () => {
    it('accepts P12 screener endpoints', () => {
      assert.equal(assertAdditiveEndpoint(P12_ENDPOINTS.SCREENER_EXECUTE), true);
    });

    it('accepts P12 search endpoint', () => {
      assert.equal(assertAdditiveEndpoint(P12_ENDPOINTS.SEARCH), true);
    });

    it('accepts all P12 endpoints', () => {
      for (const ep of Object.values(P12_ENDPOINTS)) {
        assert.equal(assertAdditiveEndpoint(ep), true);
      }
    });
  });

  describe('buildPaginatedResponse (ED-5)', () => {
    it('builds a paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const resp = buildPaginatedResponse({
        items,
        totalCount: 100,
        offset: 0,
        limit: 10,
        provenance: testProvenance(),
        tenantId: TENANT_ID,
        endpoint: '/api/screener/execute',
      });
      assert.equal(resp.apiVersion, API_VERSION);
      assert.equal(resp.pagination.totalCount, 100);
      assert.equal(resp.pagination.offset, 0);
      assert.equal(resp.pagination.limit, 10);
      assert.equal(resp.pagination.hasMore, true);
      assert.equal(resp.data.length, 2);
    });

    it('hasMore is false at end', () => {
      const resp = buildPaginatedResponse({
        items: [{ id: 1 }],
        totalCount: 10,
        offset: 10,
        limit: 10,
        provenance: testProvenance(),
        tenantId: TENANT_ID,
        endpoint: '/api/x',
      });
      assert.equal(resp.pagination.hasMore, false);
    });

    it('is frozen', () => {
      const resp = buildPaginatedResponse({
        items: [], totalCount: 0, offset: 0, limit: 10,
        provenance: testProvenance(), tenantId: TENANT_ID, endpoint: '/api/x',
      });
      assert.ok(Object.isFrozen(resp));
    });
  });

  describe('P12_ENDPOINTS', () => {
    it('includes screener endpoints', () => {
      assert.ok(P12_ENDPOINTS.SCREENER_EXECUTE);
      assert.ok(P12_ENDPOINTS.SCREENER_SAVED);
    });

    it('includes search/resolve endpoints', () => {
      assert.ok(P12_ENDPOINTS.RESOLVE);
      assert.ok(P12_ENDPOINTS.SEARCH);
    });

    it('includes admin endpoints', () => {
      assert.ok(P12_ENDPOINTS.ADMIN_PROVIDER_CONFIG);
      assert.ok(P12_ENDPOINTS.ADMIN_ENTITLEMENT);
      assert.ok(P12_ENDPOINTS.ADMIN_FEED_HEALTH);
    });
  });

  describe('PRESERVED_ENDPOINTS', () => {
    it('includes existing endpoints', () => {
      assert.ok(PRESERVED_ENDPOINTS.includes('/api/executive'));
      assert.ok(PRESERVED_ENDPOINTS.includes('/api/engines'));
      assert.ok(PRESERVED_ENDPOINTS.includes('/api/health'));
    });
  });

  describe('API_VERSION', () => {
    it('is 1.0 (ED-2)', () => assert.equal(API_VERSION, '1.0'));
  });
});
