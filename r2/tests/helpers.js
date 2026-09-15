/**
 * R-2 — SHARED TEST HELPERS
 *
 * Deterministic by construction: a fixed clock, fixed lineage, and fixtures only. No test reads
 * the wall clock, the network or the filesystem outside `r2/fixtures/`.
 */

import { loadFixtures, resolveSyntheticDay } from '../src/fixtures.js';
import { createReferenceAdapter, REFERENCE_PROVIDER_ID } from '../src/mockAdapter.js';
import { createInMemoryStore } from '../src/storagePort.js';
import { bindAdapter } from '../src/providerAdapter.js';

/** Fixed epoch anchor: 2026-01-05T09:15:00Z. Every test uses this, so ages are exact. */
export const NOW_MS = Date.parse('2026-01-05T09:15:00Z');
export const NOW_ISO = new Date(NOW_MS).toISOString();

export function fixtures() {
  return loadFixtures();
}

/** The clean, fully-eligible daily fixture — used as the adapter's current-state source. */
export const CURRENT_FIXTURE = 'BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv';

export function adapter(behaviour, currentFile = CURRENT_FIXTURE) {
  return bindAdapter(createReferenceAdapter({ files: fixtures(), behaviour, currentFile }));
}

export function store() {
  return createInMemoryStore();
}

export function lineage(overrides = {}) {
  return {
    provider: REFERENCE_PROVIDER_ID,
    dataVersion: 'test-v1',
    asOf: '2026-01-02T16:30:00Z',
    ingestionTimestamp: NOW_ISO,
    ...overrides,
  };
}

export { resolveSyntheticDay };
