/**
 * P11 test helpers — shared fixtures and factory functions.
 */
import { buildSnapshotId } from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION } from '../../p05/src/namespace.js';

export const PROVIDER = 'LocalFixture';
export const DATA_VERSION = 'v1';
export const AS_OF = '2026-09-12T10:00:00.000Z';
export const RECEIVED_AT = '2026-09-12T10:00:00.000Z';

export function testSnapshotId() {
  return buildSnapshotId(PROVIDER, DATA_VERSION, AS_OF);
}

export function testSnapshot(overrides = {}) {
  return {
    snapshotId: testSnapshotId(),
    provider: PROVIDER,
    dataVersion: DATA_VERSION,
    asOf: AS_OF,
    receivedAt: RECEIVED_AT,
    mode: 'SNAPSHOT',
    domain: 'D03',
    identityMappingVersion: '1.0',
    fields: {
      [`${NAMESPACE_TOKEN}fundamentals.revenue`]: { value: 1000000, key: `${NAMESPACE_TOKEN}fundamentals.revenue` },
      [`${NAMESPACE_TOKEN}fundamentals.ebitda`]: { value: 250000, key: `${NAMESPACE_TOKEN}fundamentals.ebitda` },
    },
    ...overrides,
  };
}

export function testCompanyInputs() {
  return {
    id: 'COMP-001',
    segment: 'enterprise',
    debtEbitda: 2.5,
    ebitdaMargin: 0.25,
    revenueGrowth: 0.08,
  };
}

export function testSnapshotWithValuation() {
  return testSnapshot({
    domain: 'D01',
    fields: {
      [`${NAMESPACE_TOKEN}price.close`]: { value: 150.25, key: `${NAMESPACE_TOKEN}price.close` },
      [`${NAMESPACE_TOKEN}valuation.peRatio`]: { value: 18.5, key: `${NAMESPACE_TOKEN}valuation.peRatio` },
      [`${NAMESPACE_TOKEN}valuation.evEbitda`]: { value: 12.3, key: `${NAMESPACE_TOKEN}valuation.evEbitda` },
    },
  });
}

export function assertThrows(fn, pattern) {
  let caught = null;
  try { fn(); } catch (e) { caught = e; }
  if (!caught) throw new Error(`Expected function to throw matching ${pattern}, but it did not`);
  if (pattern instanceof RegExp) {
    if (!pattern.test(caught.message) && !(caught.rules && caught.rules.some((r) => pattern.test(r)))) {
      throw new Error(`Error thrown but did not match ${pattern}: ${caught.message}`);
    }
  }
  return caught;
}
