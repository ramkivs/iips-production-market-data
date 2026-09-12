/**
 * P10 test helpers — shared fixtures and factory functions.
 */
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';

export const RECEIVED_AT = '2026-09-12T10:00:00.000Z';
export const AS_OF = '2026-09-12T09:30:00.000Z';
export const PIT_BOUNDARY = '2026-09-12T10:00:00.000Z';
export const PUBLICATION_TIME = '2026-09-12T08:00:00.000Z';
export const EFFECTIVE_TIME = '2026-09-01T00:00:00.000Z';

export function testLineage(overrides = {}) {
  return {
    sourceRef: 'test://intelligence/local/2026',
    adapterId: 'intelligence-adapter',
    adapterVersion: '1.0',
    transformationChainRef: 'chain:intelligence:normalization:v1',
    receivedAt: RECEIVED_AT,
    namespaceVersion: NAMESPACE_VERSION,
    identityMappingVersion: '1.0',
    ...overrides,
  };
}

export function testIdentity(overrides = {}) {
  return {
    canonicalSecurityId: 'FIGI-test-001',
    companyId: 'COMP-001',
    instrumentType: 'equity',
    ...overrides,
  };
}

export function testSeriesIdentity(overrides = {}) {
  return {
    seriesId: 'MACRO-GDP-US-Q',
    region: 'US',
    identityType: 'macro-series',
    ...overrides,
  };
}

export const IDENTITY_MAPPING_VERSION = '1.0';

export function assertThrowsWithRule(fn, ruleOrPattern) {
  let caught = null;
  try { fn(); } catch (err) { caught = err; }
  if (!caught) throw new Error('Expected function to throw, but it did not');
  if (Array.isArray(caught.rules)) {
    const pattern = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
    if (caught.rules.some((r) => pattern.test(r))) return caught;
  }
  if (caught.code !== undefined) {
    const pattern = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
    if (pattern.test(String(caught.code))) return caught;
  }
  const pattern = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
  if (pattern.test(caught.message)) return caught;
  throw new Error(
    `Error thrown but neither rules nor message matched ${ruleOrPattern}.\n` +
    `  rules: ${JSON.stringify(caught.rules)}\n  message: ${caught.message}`
  );
}
