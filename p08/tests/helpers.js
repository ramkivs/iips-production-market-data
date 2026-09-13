/**
 * P08-01 test helpers — deterministic, no wall clock, no randomness, no network.
 * ⚠ Mirrors the accepted P05/P06/P07 helper conventions: fixed inputs, byte-identical runs.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
export const p08Root = join(here, '..');

/**
 * A **backdated fixture** (tracker: *"Backdated fixtures"*). Every timestamp is a literal.
 * ⚠ No `Date.now()`, no `new Date()` — a PIT store proven with a wall clock proves nothing.
 */
export function backdatedSnapshot(overrides = {}) {
  const provider = overrides.provider ?? 'fixture';
  const dataVersion = overrides.dataVersion ?? '1.0';
  const asOf = overrides.asOf ?? '2024-01-02T00:00:00.000Z';
  return {
    snapshotId: `data-${provider}-${dataVersion}-${asOf}`,
    provider,
    dataVersion,
    schemaVersion: '1.2',
    namespaceVersion: 'NSv1.0',
    asOf,
    mode: 'PIT',
    quality: 'good',
    domain: 'D02',
    securityId: 'BBG000B9XRY4',
    fields: { 'MD:price.close': 187.25 },
    ...overrides,
  };
}
