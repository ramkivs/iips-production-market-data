/**
 * P12 test helpers — shared fixtures and factory functions.
 */
import { buildSnapshotId } from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION } from '../../p05/src/namespace.js';

export const PROVIDER = 'LocalFixture';
export const DATA_VERSION = 'v1';
export const AS_OF = '2026-09-12T10:00:00.000Z';
export const RECEIVED_AT = '2026-09-12T10:00:01.000Z';
export const TENANT_ID = 'tenant-001';

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

export function testSecurity(id = 'SEC-001', overrides = {}) {
  return {
    canonicalSecurityId: id,
    issuerId: 'ISS-001',
    symbol: 'TEST',
    name: 'Test Security',
    lifecycleState: 'active',
    identifiers: {
      FIGI: `FIGI-${id}`,
      ISIN: `US${id}0`,
    },
    ...overrides,
  };
}

export function testUniverse(count = 5) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      canonicalSecurityId: `SEC-${String(i + 1).padStart(3, '0')}`,
      issuerId: `ISS-${String(i + 1).padStart(3, '0')}`,
      symbol: `SYM${i + 1}`,
      name: `Company ${i + 1}`,
      objectType: 'security',
      quality: i < 3 ? 'good' : (i === 3 ? 'stale' : 'partial'),
      completenessPct: i < 3 ? 100 : (i === 3 ? 80 : 60),
      asOf: AS_OF,
      [`${NAMESPACE_TOKEN}fundamentals.revenue`]: 1000000 * (i + 1),
      [`${NAMESPACE_TOKEN}valuation.peRatio`]: 15 + i * 2,
    });
  }
  return rows;
}
