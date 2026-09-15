/**
 * R-2 — FIXTURE LOADER
 *
 * Loads the SYNTHETIC / REFERENCE fixtures in `r2/fixtures/` and attaches `synthetic: true` to
 * every resolved source, so that R-2 §I.56 ("historical loading must not silently substitute
 * synthetic data for real historical data") is **enforceable by test** rather than by vigilance.
 *
 * ⚠ See `r2/fixtures/README.md`. None of this data is NSE data.
 *
 * Node built-ins only (`node:fs`, `node:path`, `node:url`), consistent with the repository's
 * zero-dependency convention.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(HERE, '..', 'fixtures');

/** Every fixture file, by name. */
export function fixtureNames() {
  return readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.csv')).sort();
}

/**
 * Load all fixtures as a `{ filename: text }` map suitable for `createReferenceAdapter`.
 * @returns {Record<string, string>}
 */
export function loadFixtures() {
  const out = {};
  for (const name of fixtureNames()) {
    out[name] = readFileSync(join(FIXTURE_DIR, name), 'utf8');
  }
  return out;
}

/**
 * Resolve one trading day to a synthetic source, for `runBackfill`.
 *
 * The returned object always carries `synthetic: true` (§I.56). Returns `null` when no fixture
 * exists for the day — which is how §I.54 unavailability is expressed, never by inventing a row.
 *
 * @param {string} day  YYYY-MM-DD
 * @returns {{text: string, sourceRef: string, sourceTimestamp: string, synthetic: true}|null}
 */
export function resolveSyntheticDay(day) {
  const files = loadFixtures();
  const ymd = day.replace(/-/g, '');
  const name = Object.keys(files).find((f) => f.includes(ymd));
  if (!name) return null;
  return Object.freeze({
    text: files[name],
    sourceRef: name,
    sourceTimestamp: `${day}T16:30:00Z`,
    synthetic: true,
  });
}
