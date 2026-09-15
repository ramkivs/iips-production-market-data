/**
 * R-2 tests — UI / DATA-CONTRACT INTEGRATION + SECRETS
 * (§N "UI/data-contract integration", "visible freshness/status behavior"; §C, §P, §M)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import {
  assertNoProviderLeakage, projectCurrentState, projectQuote, projectStatus,
} from '../src/uiDataContract.js';
import { describeState, FRESHNESS_STATUS } from '../src/freshness.js';
import {
  assertNoLiterals, PRODUCTION_CONFIG_SHAPE, redact, secretRef, validateConfig,
} from '../src/config.js';
import { validRecord } from './canonicalContract.test.js';

const NOW = Date.parse('2026-01-05T09:15:00Z');
const MIN = 60 * 1000;
const fresh = () => describeState({ lastSuccessfulRefreshMs: NOW - MIN, asOf: '2026-01-05T09:14:00Z', sourceId: 'r2-reference-file', hasData: true }, { nowMs: NOW });
const stale = () => describeState({ lastSuccessfulRefreshMs: NOW - 60 * MIN, asOf: '2026-01-05T08:15:00Z', sourceId: 'r2-reference-file', hasData: true }, { nowMs: NOW });

// ── §C.17 visible freshness / status ─────────────────────────────────────────────────────────

test('§C.17 — the status block exposes current-vs-stale, last refresh, source and data time', () => {
  const s = projectStatus(fresh());
  assert.equal(s.isCurrent, true);
  assert.equal(s.status, FRESHNESS_STATUS.CURRENT);
  assert.equal(s.lastSuccessfulRefresh, new Date(NOW - MIN).toISOString());
  assert.equal(s.dataDateTime, '2026-01-05T09:14:00Z');
  assert.equal(s.dataSource, 'r2-reference-file');
  assert.equal(s.thresholdMs, 30 * MIN);
});

test('§C.17 — the status note is render-ready prose', () => {
  assert.equal(typeof projectStatus(stale()).statusNote, 'string');
  assert.ok(projectStatus(stale()).statusNote.length > 10);
});

test('§Q.87 — the render guidance forbids presenting stale data as current', () => {
  const s = projectStatus(stale());
  assert.equal(s.isCurrent, false);
  assert.match(s.renderGuidance, /MUST be labelled STALE/);
  assert.match(s.renderGuidance, /MUST NOT be presented as current/);
});

test('§Q.90 — usability is carried into the DTO for downstream scoring', () => {
  assert.equal(projectStatus(fresh()).usability, 'USABLE_CURRENT');
  assert.equal(projectStatus(stale()).usability, 'STALE_NOT_CURRENT');
});

// ── §Q.87 structural enforcement ─────────────────────────────────────────────────────────────

test('§Q.87 — prices are present when the data is CURRENT', () => {
  const q = projectQuote(validRecord(), fresh());
  assert.equal(q.prices.close, 1015);
  assert.equal(q.prices.pricesSuppressedBecauseNotCurrent, false);
});

test('§Q.87 — prices are NULLED when the data is not current, so no stale price can render', () => {
  const q = projectQuote(validRecord(), stale());
  for (const k of ['open', 'high', 'low', 'close', 'lastPrice', 'previousClose']) {
    assert.equal(q.prices[k], null, `${k} must be suppressed`);
  }
  assert.equal(q.prices.pricesSuppressedBecauseNotCurrent, true);
  for (const k of ['volume', 'tradedValue', 'transactionCount']) assert.equal(q.activity[k], null);
});

test('§Q.87 — an EMPTY state also suppresses prices', () => {
  const q = projectQuote(validRecord(), describeState({ hasData: false }, { nowMs: NOW }));
  assert.equal(q.prices.close, null);
});

// ── §P.82 / INV-10 no provider leakage ───────────────────────────────────────────────────────

test('§P.82 — the quote DTO carries no provider-native field', () => {
  const q = projectQuote(validRecord(), fresh());
  assert.equal(assertNoProviderLeakage(q), true);
  for (const k of ['TradDt', 'TckrSymb', 'ClsPric', 'SctySrs', 'TtlTradgQty']) assert.equal(k in q, false);
});

test('INV-10 — a leaked provider field is caught at runtime, not by review', () => {
  assert.throws(() => assertNoProviderLeakage({ TckrSymb: 'LEAK' }), /INV-10/);
  assert.throws(() => assertNoProviderLeakage({ nested: { deep: { ClsPric: 1 } } }), /INV-10/);
});

test('§P.82 — the current-state surface is provider-neutral and versioned', () => {
  const dto = projectCurrentState({ records: [validRecord()], freshness: fresh() });
  assert.equal(dto.contract.name, 'iips.marketData.currentState');
  assert.equal(dto.contract.version, '1.0.0');
  assert.equal(dto.availability, 'AVAILABLE');
  assert.equal(assertNoProviderLeakage(dto), true);
});

test('§Q.86 — availability states are explicit for every freshness status', () => {
  assert.equal(projectCurrentState({ records: [], freshness: describeState({ hasData: false }, { nowMs: NOW }) }).availability, 'NO_DATA_LOADED');
  assert.equal(projectCurrentState({ records: [], freshness: describeState({ hasData: true, lastSuccessfulRefreshMs: null }, { nowMs: NOW }) }).availability, 'UNAVAILABLE');
  assert.equal(projectCurrentState({ records: [], freshness: stale() }).availability, 'STALE');
});

test('§C.18 — the projection limits rows rather than dumping the whole universe', () => {
  const recs = Array.from({ length: 120 }, (_, i) => validRecord({ isin: `INE000A0100${i % 10}` }));
  const dto = projectCurrentState({ records: recs, freshness: fresh(), limit: 50 });
  assert.equal(dto.quotes.length, 50);
  assert.equal(dto.count, 120, 'the true count is still reported');
});

// ── §M secrets / configuration ───────────────────────────────────────────────────────────────

test('§M.71 — a SecretRef carries a NAME only', () => {
  const r = secretRef('NSE_ACQUISITION_API_KEY');
  assert.equal(r.name, 'NSE_ACQUISITION_API_KEY');
  assert.equal('value' in r, false);
});

test('§M.69 — a SecretRef that looks like it contains a VALUE is refused', () => {
  assert.throws(() => secretRef('apiKey=sk_live_abcdefghijklmnop'), /§M\.69/);
  assert.throws(() => secretRef('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef'), /§M\.69/);
});

test('§M.69 — a literal credential in config fails validation', () => {
  const v = validateConfig({
    acquisition: { mechanism: 'nse', apiKey: 'sk_live_abcdef123456789' },
    entitlements: { redistributionPermitted: false },
  });
  assert.equal(v.valid, false);
  assert.ok(v.problems.some((p) => /§M\.69|§M\.70/.test(p)));
});

test('§M.71 — a correctly-shaped config with a SecretRef validates', () => {
  const v = validateConfig({
    acquisition: { mechanism: 'nse-authorised', apiKey: secretRef('NSE_KEY') },
    entitlements: { redistributionPermitted: false },
  });
  assert.equal(v.valid, true, v.problems.join('; '));
});

test('§K.61 — redistribution permission must be stated explicitly', () => {
  const v = validateConfig({ acquisition: { mechanism: 'x' }, entitlements: {} });
  assert.ok(v.problems.some((p) => /redistributionPermitted/.test(p)));
});

test('§M.69 — assertNoLiterals detects the common credential shapes', () => {
  assert.equal(assertNoLiterals({ k: 'ghp_' + 'A'.repeat(36) }).clean, false);
  assert.equal(assertNoLiterals({ k: 'AKIA' + 'A'.repeat(16) }).clean, false);
  assert.equal(assertNoLiterals({ k: '-----BEGIN RSA PRIVATE KEY-----' }).clean, false);
  assert.equal(assertNoLiterals({ k: 'totally ordinary text' }).clean, true);
});

test('§M.69 — redact removes secret-like values from log text', () => {
  assert.match(redact('apiKey=sk_live_abcdef123456789'), /REDACTED/);
  assert.equal(/sk_live_abcdef123456789/.test(redact('apiKey=sk_live_abcdef123456789')), false);
});

test('§M.71 — the production config shape documents every gate as a field', () => {
  assert.equal(PRODUCTION_CONFIG_SHAPE.acquisition.apiKey, 'SecretRef');
  assert.ok('entitlements' in PRODUCTION_CONFIG_SHAPE);
  assert.ok('refresh' in PRODUCTION_CONFIG_SHAPE);
  assert.ok('backfill' in PRODUCTION_CONFIG_SHAPE);
});

test('§M.70 — no credential literal exists anywhere in the R-2 source', () => {
  // Guards against a future edit hard-coding a secret.
  // Scope: SHIPPING SOURCE ONLY. Test files legitimately contain deliberate credential-shaped
  // strings in order to prove detection works, and config.js contains the detection regexes
  // themselves. Both are covered by their own dedicated assertions above.
  const files = [];
  for (const f of readdirSync(new URL('../src/', import.meta.url))) {
    if (f.endsWith('.js') && f !== 'config.js') files.push(new URL(`../src/${f}`, import.meta.url));
  }
  assert.ok(files.length > 10, 'the guard must actually scan files');
  for (const u of files) {
    const text = readFileSync(u, 'utf8');
    assert.equal(assertNoLiterals({ text }).clean, true, `credential-like literal in ${u.pathname}`);
  }
});
