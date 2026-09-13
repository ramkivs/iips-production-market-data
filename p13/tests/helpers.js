/**
 * P13 test helpers — shared fixtures and factory functions.
 */
import { buildDataProvenance } from '../../p12/src/dataProvenanceDto.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';

export const PROVIDER = 'LocalFixture';
export const DATA_VERSION = 'v1';
export const AS_OF = '2026-09-12T10:00:00.000Z';
export const RECEIVED_AT = '2026-09-12T10:00:01.000Z';
export const TENANT_ID = 'tenant-001';

export function testProvenance(overrides = {}) {
  return buildDataProvenance({
    dataSource: 'governed:D03',
    freshness: 'SNAPSHOT',
    calibratedAt: AS_OF,
    transportSemantics: 'canonical-snapshot',
    asOf: AS_OF,
    receivedAt: RECEIVED_AT,
    dataVersion: DATA_VERSION,
    mode: 'SNAPSHOT',
    quality: 'good',
    completenessPct: 100,
    contributingSnapshotIds: ['snap-001'],
    classification: 'REAL',
    ...overrides,
  });
}

export function testUniverse(count = 5) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      canonicalSecurityId: `SEC-${String(i + 1).padStart(3, '0')}`,
      symbol: `SYM${i + 1}`,
      name: `Company ${i + 1}`,
      quality: i < 3 ? 'good' : (i === 3 ? 'stale' : 'partial'),
      completenessPct: i < 3 ? 100 : (i === 3 ? 80 : 60),
      asOf: AS_OF,
      [`${NAMESPACE_TOKEN}fundamentals.revenue`]: 1000000 * (i + 1),
    });
  }
  return rows;
}
