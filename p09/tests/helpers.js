/**
 * P09 test helpers — shared fixtures and factory functions.
 */

import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';

/** A stable, synthetic receivedAt for deterministic tests. */
export const RECEIVED_AT = '2026-09-12T10:00:00.000Z';

/** A stable asOf for tests. */
export const AS_OF = '2026-09-12T09:30:00.000Z';

/** A stable PIT boundary. */
export const PIT_BOUNDARY = '2026-09-12T10:00:00.000Z';

/** Fiscal period end — effectiveTime for Q1 FY2025. */
export const FISCAL_PERIOD_END = '2025-03-31T00:00:00.000Z';

/** Filing date — publicationTime for Q1 FY2025 initial filing. */
export const FILING_DATE_INITIAL = '2025-05-15T00:00:00.000Z';

/** Filing date — publicationTime for Q1 FY2025 restatement. */
export const FILING_DATE_RESTATEMENT = '2025-08-20T00:00:00.000Z';

/** A standard lineage block for tests. */
export function testLineage(overrides = {}) {
  return {
    sourceRef: 'test://fundamentals/nse/annual/2025',
    adapterId: 'fundamentals-adapter',
    adapterVersion: '1.0',
    transformationChainRef: 'chain:fundamentals:normalization:v1',
    receivedAt: RECEIVED_AT,
    namespaceVersion: NAMESPACE_VERSION,
    identityMappingVersion: '1.0',
    ...overrides,
  };
}

/** A standard identity for tests. */
export function testIdentity(overrides = {}) {
  return {
    canonicalSecurityId: 'FIGI-test-001',
    companyId: 'COMP-001',
    instrumentType: 'equity',
    ...overrides,
  };
}

/** A standard identity mapping version. */
export const IDENTITY_MAPPING_VERSION = '1.0';

/**
 * Assert that a function throws an error whose message OR rules array matches a pattern.
 * ContractViolation stores rule IDs in err.rules, not in err.message.
 */
export function assertThrowsWithRule(fn, ruleOrPattern) {
  let caught = null;
  try {
    fn();
  } catch (err) {
    caught = err;
  }
  if (!caught) {
    throw new Error('Expected function to throw, but it did not');
  }
  // Check rules array
  if (Array.isArray(caught.rules)) {
    const pattern = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
    const ruleMatch = caught.rules.some((r) => pattern.test(r));
    if (ruleMatch) return caught;
  }
  // Check code property (PitStorageError)
  if (caught.code !== undefined) {
    const pattern2 = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
    if (pattern2.test(String(caught.code))) return caught;
  }
  // Check message
  const pattern = ruleOrPattern instanceof RegExp ? ruleOrPattern : new RegExp(ruleOrPattern, 'i');
  if (pattern.test(caught.message)) return caught;
  throw new Error(
    `Error thrown but neither rules nor message matched ${ruleOrPattern}.\n` +
    `  rules: ${JSON.stringify(caught.rules)}\n` +
    `  message: ${caught.message}`
  );
}
