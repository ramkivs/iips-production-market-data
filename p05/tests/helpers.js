/**
 * Shared deterministic test harness for P05-01.
 *
 * ⚠ No wall-clock, no randomness, no network, no filesystem writes. Every input below is a
 *   fixed literal or a fixed repository file, so every run is byte-identical (D-3).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { LocalDeterministicMarketFeed } from '../src/localFeed.js';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
export const p05Root = join(here, '..');

/** Read a repository file as text (deterministic — committed content). */
export function readRepo(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8');
}

/** Read a JSON fixture. */
export function readFixture(name) {
  return JSON.parse(readFileSync(join(p05Root, 'fixtures', name), 'utf8'));
}

/** The fixed provider/adapter declaration (mirrors fixtures/feed-fixtures.json). */
export function feedConfig() {
  const fx = readFixture('feed-fixtures.json');
  return {
    provider: fx.provider,
    adapterId: fx.adapterId,
    adapterVersion: fx.adapterVersion,
    providerSchemaVersion: fx.providerSchemaVersion,
    schemaVersion: fx.schemaVersion,
    sourceRef: fx.sourceRef,
    transformationChainRef: fx.transformationChainRef,
  };
}

/**
 * Build a fresh feed instance. A new instance per test guarantees no cross-test state,
 * so results depend only on the fixtures.
 */
export function makeFeed() {
  return new LocalDeterministicMarketFeed({
    config: feedConfig(),
    fixtures: readFixture('feed-fixtures.json'),
    identityFixtures: readFixture('identity-fixtures.json'),
  });
}

/**
 * A FIXED ingest timestamp. Deliberately a literal, never Date.now() — D-4 stamps
 * `receivedAt` once at the ingest boundary and TS-6 forbids recomputation or back-filling.
 */
/**
 * A single ingest run at a FIXED instant. Must be at or after the latest fixture asOf
 * (C-0002 session 2026-03-03), otherwise SM-9 correctly rejects it: receivedAt earlier
 * than asOf without a declared justification. You cannot receive tomorrow's close today.
 */
export const RECEIVED_AT = '2026-03-03T15:00:00.000Z';
export const RECEIVED_AT_RUN2 = '2026-03-03T15:00:00.000Z';

/** Assert no snapshot was produced (RJ-2: a rejected snapshot is never admitted). */
export function expectRejected(result) {
  if (result.ok !== false) {
    throw new Error(`expected a rejection but got ok=true (quality=${result.quality})`);
  }
  return result;
}
