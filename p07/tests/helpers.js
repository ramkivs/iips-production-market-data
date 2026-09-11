/**
 * P07-01 test helpers — deterministic, no wall clock, no randomness, no network.
 *
 * ⚠ Mirrors the P05/P06 helper conventions: fixed inputs, byte-identical runs.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
export const p07Root = join(here, '..');
export const p05Root = join(repoRoot, 'p05');
export const p06Root = join(repoRoot, 'p06');

/** Build a minimal valid canonical snapshot for testing. */
export function buildTestSnapshot(overrides = {}) {
  return Object.freeze({
    snapshotId: 'data-test-1.0-2026-09-11T00:00:00.000Z',
    provider: 'test',
    dataVersion: '1.0',
    schemaVersion: '1.2',
    namespaceVersion: 'NSv1.0',
    asOf: '2026-09-11T00:00:00.000Z',
    receivedAt: '2026-09-11T00:00:01.000Z',
    mode: 'SNAPSHOT',
    quality: 'good',
    completenessPct: 100,
    domain: 'D03',
    identity: { companyId: 'test-H1' },
    identityMappingVersion: '1.0',
    lineage: Object.freeze({
      sourceRef: 'test-feed',
      adapterId: 'test-adapter',
      adapterVersion: '1.0',
      transformationChainRef: 'test-chain-v1',
      receivedAt: '2026-09-11T00:00:01.000Z',
      namespaceVersion: '1.0',
    }),
    fields: Object.freeze({
      'MD:fundamentals.revenue': Object.freeze({
        key: 'MD:fundamentals.revenue',
        value: '1000000',
        availability: 'PRESENT',
        dataType: 'integer',
        provenance: 'test-feed',
        pitEligible: true,
      }),
      'MD:fundamentals.earnings': Object.freeze({
        key: 'MD:fundamentals.earnings',
        value: '500000',
        availability: 'PRESENT',
        dataType: 'integer',
        provenance: 'test-feed',
        pitEligible: false,
      }),
    }),
    ...overrides,
  });
}

/** Build a snapshot that is structurally invalid (for validity testing). */
export function buildInvalidSnapshot(overrides = {}) {
  return Object.freeze({
    snapshotId: 'INVALID',
    quality: 'good',
    completenessPct: 100,
    fields: Object.freeze({}),
    ...overrides,
  });
}
