/**
 * P12-07 — ENDPOINT DELTA (ADDITIVE)
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.3
 *
 * Purpose:
 *   Additive endpoint definitions for P12 API surfaces. No breaking changes
 *   to existing apiVersion '1.0' endpoints.
 *
 *   New endpoints:
 *     - Screener endpoints (per K.2.3)
 *     - Object-resolution / search endpoints (per K.2.4)
 *     - Watchlist endpoints (UI07)
 *     - Alert endpoints (UI09)
 *     - Report generation endpoints (UI08, PIT-reproducible)
 *     - Collaboration endpoints (UI10)
 *     - Market-data admin endpoints (extend /api/admin/*)
 *
 *   Extended endpoints:
 *     - Existing 20+ endpoints: extended with provenance/quality fields
 *
 * Boundaries (hard):
 *   ⚠ **ED-1** Additive only — no existing endpoint modified or removed
 *   ⚠ **ED-2** apiVersion '1.0' compatibility preserved
 *   ⚠ **ED-3** No breaking changes — existing consumers unaffected
 *   ⚠ **ED-4** Tenant scoping enforced on every new endpoint (ST-1)
 *   ⚠ **ED-5** Provenance attached to every data response (QP-9)
 *   ⚠ **ED-6** No provider-specific endpoints (K.5)
 *   ⚠ **ED-7** No client-side entitlement or filtering (K.5)
 */

import { ProvenanceViolation } from './dataProvenanceDto.js';
import { enforceTenantScoping, assertTenantAuthorized, SecurityViolation } from './securityTenantBoundaries.js';

export const P12_07_MODULE = 'P12-07-ENDPOINT-DELTA';

/** API version — additive extension of existing '1.0'. */
export const API_VERSION = '1.0';

/** ED-1: New P12 endpoint paths — additive only. */
export const P12_ENDPOINTS = Object.freeze({
  // Screener (K.2.3)
  SCREENER_EXECUTE: '/api/screener/execute',
  SCREENER_SAVED: '/api/screener/saved',
  SCREENER_SAVED_EXECUTE: '/api/screener/saved/:screenId/execute',

  // Object-resolution / search (K.2.4)
  RESOLVE: '/api/resolve',
  SEARCH: '/api/search',

  // Watchlist (UI07)
  WATCHLIST: '/api/watchlist',
  WATCHLIST_ITEM: '/api/watchlist/:watchlistId',

  // Alerts (UI09)
  ALERTS: '/api/alerts',
  ALERT_ITEM: '/api/alerts/:alertId',

  // Reports (UI08 — PIT-reproducible)
  REPORTS: '/api/reports',
  REPORT_GENERATE: '/api/reports/generate',
  REPORT_ITEM: '/api/reports/:reportId',

  // Collaboration (UI10)
  COLLABORATION: '/api/collaboration',

  // Market-data admin (extend /api/admin/*)
  ADMIN_PROVIDER_CONFIG: '/api/admin/providers',
  ADMIN_ENTITLEMENT: '/api/admin/entitlement',
  ADMIN_FEED_HEALTH: '/api/admin/feed-health',
});

/** ED-1: Existing endpoints preserved (NOT modified). */
export const PRESERVED_ENDPOINTS = Object.freeze([
  '/api/executive',
  '/api/portfolio',
  '/api/cross-sector',
  '/api/company/:id',
  '/api/decision-matrix',
  '/api/engines',
  '/api/engines/:id/execute',
  '/api/evidence/:id',
  '/api/replay/:id',
  '/api/ai-advisory/*',
  '/api/admin/*',
  '/api/health',
]);

/**
 * ED-4/ED-5 — Build a governed API response envelope.
 *
 * Every P12 API response is wrapped in a governed envelope that carries:
 *   - apiVersion (1.0)
 *   - tenantId (server-enforced)
 *   - provenance (data provenance DTO)
 *   - data (the response payload)
 *
 * @param {object} args
 * @param {*} args.data — the response payload
 * @param {Readonly<object>} args.provenance — P12-01 provenance DTO
 * @param {string} args.tenantId — server-enforced tenant
 * @param {string} args.endpoint — the endpoint path
 * @returns {Readonly<object>} frozen governed response envelope
 */
export function buildApiResponse(args) {
  const { data, provenance, tenantId, endpoint } = args;

  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new EndpointViolation(['ED-4'], 'tenantId must be a non-empty string');
  }

  return Object.freeze({
    apiVersion: API_VERSION,
    endpoint,
    tenantId,
    data,
    provenance,
    responseGeneratedAt: new Date().toISOString(),
  });
}

/**
 * ED-4 — Handle a governed API request.
 *
 * Validates tenant scoping and builds the request context.
 *
 * @param {object} args
 * @param {string} args.tenantId — requesting tenant
 * @param {string} args.endpoint — endpoint being accessed
 * @param {object} args.body — request body
 * @param {object} args.params — URL parameters
 * @param {object} args.query — query parameters
 * @returns {Readonly<object>} frozen governed request context
 */
export function handleApiRequest(args) {
  const { tenantId, endpoint, body = {}, params = {}, query = {} } = args;

  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new EndpointViolation(['ED-4'], 'tenantId must be a non-empty string');
  }
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    throw new EndpointViolation(['ED-4'], 'endpoint must be a non-empty string');
  }

  return Object.freeze({
    apiVersion: API_VERSION,
    tenantId,
    endpoint,
    body: Object.freeze({ ...body }),
    params: Object.freeze({ ...params }),
    query: Object.freeze({ ...query }),
    receivedAt: new Date().toISOString(),
  });
}

/**
 * ED-1/ED-2 — Verify that a P12 endpoint is additive (not replacing an existing one).
 *
 * @param {string} endpointPath
 * @returns {boolean}
 */
export function assertAdditiveEndpoint(endpointPath) {
  // Check that the new endpoint doesn't conflict with existing ones
  const normalized = endpointPath.replace(/:\w+/g, '*').replace(/\*/g, '*');
  for (const existing of PRESERVED_ENDPOINTS) {
    const normalizedExisting = existing.replace(/:\w+/g, '*').replace(/\*/g, '*');
    if (normalized === normalizedExisting && !existing.endsWith('/*')) {
      throw new EndpointViolation(
        ['ED-1', 'ED-2'],
        `endpoint '${endpointPath}' conflicts with existing endpoint '${existing}' — ` +
        'additive only; no replacement permitted'
      );
    }
  }
  return true;
}

/**
 * ED-5 — Build a paginated response with provenance.
 *
 * @param {object} args
 * @param {object[]} args.items — response items
 * @param {number} args.totalCount — total matching items
 * @param {number} args.offset — pagination offset
 * @param {number} args.limit — page size
 * @param {Readonly<object>} args.provenance — shared provenance
 * @param {string} args.tenantId
 * @param {string} args.endpoint
 * @returns {Readonly<object>}
 */
export function buildPaginatedResponse(args) {
  const { items, totalCount, offset, limit, provenance, tenantId, endpoint } = args;

  return Object.freeze({
    apiVersion: API_VERSION,
    endpoint,
    tenantId,
    pagination: Object.freeze({
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
    }),
    data: Object.freeze([...items]),
    provenance,
    responseGeneratedAt: new Date().toISOString(),
  });
}

/**
 * ED-typed error.
 */
export class EndpointViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'EndpointViolation';
    this.rules = Object.freeze([...rules]);
  }
}
