/**
 * P05-01 TESTS — NAMESPACE AND ADR-01 C1–C6
 *
 * The headline test here is `domain vocabulary is taken from the accepted P01 dictionary`:
 * it parses docs/p01/P01_FIELD_DICTIONARY.md and asserts the implementation's permitted
 * domain segments are EXACTLY the dictionary's `<NS><segment>.` segments. That makes
 * "no invented label" a mechanically verified property, not a claim.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ALL_DOMAIN_SEGMENTS, assertC1, assertC2, assertC3, assertC4, assertCollisionGuard,
  buildKey, canonicalKeyOrder, DOMAIN_SEGMENTS, isNamespaced, mergeFieldMaps,
  NAMESPACE_TOKEN, NAMESPACE_VERSION, parseKey, VALID_DOMAINS,
} from '../src/namespace.js';
import { readRepo } from './helpers.js';

const DICTIONARY = 'docs/p01/P01_FIELD_DICTIONARY.md';

test('OI-10 token of record is MD: and the separator is "."', () => {
  assert.equal(NAMESPACE_TOKEN, 'MD:');
  const cp03 = readRepo('docs/CHECKPOINT-03.md');
  assert.match(cp03, /Exact namespace token: `MD:`/);
  assert.match(cp03, /Canonical field-key form: `MD:<domain>\.<field>`/);
});

test('domain vocabulary is taken from the accepted P01 dictionary (NO invented labels)', () => {
  const text = readRepo(DICTIONARY);
  // Every `<NS><segment>.` occurrence in the accepted dictionary.
  const fromDictionary = [...new Set([...text.matchAll(/<NS>([a-zA-Z]+)\./g)].map((m) => m[1]))].sort();
  assert.deepEqual(
    [...ALL_DOMAIN_SEGMENTS],
    fromDictionary,
    'implementation vocabulary must equal the accepted dictionary vocabulary exactly',
  );
  // And every domain D01–D10 is covered.
  assert.deepEqual([...VALID_DOMAINS], ['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10']);
  for (const d of VALID_DOMAINS) {
    assert.ok(DOMAIN_SEGMENTS[d].length > 0, `${d} must have at least one segment`);
  }
  // D01 carries two segments (price + the collision-critical valuation slots).
  assert.deepEqual([...DOMAIN_SEGMENTS.D01], ['price', 'valuation']);
});

test('OI-D9-01 premise: the dictionary already enumerates a segment for all ten domains', () => {
  // This is the finding that CORRECTS OI-D9-01 as recorded in D9 §6: the labels for
  // D04/D05/D06/D08/D09/D10 DO exist, written with the <NS> placeholder that
  // CHECKPOINT-03 §3.3(5)/rule 14 binds to MD: for new work.
  const text = readRepo(DICTIONARY);
  for (const seg of ['corpaction', 'identity', 'news', 'macro', 'alt', 'venue']) {
    assert.ok(text.includes(`<NS>${seg}.`), `dictionary must define <NS>${seg}.`);
  }
});

test('buildKey produces the canonical form and refuses an invented segment', () => {
  assert.equal(buildKey('price', 'last'), 'MD:price.last');
  assert.equal(buildKey('ohlcv', 'close'), 'MD:ohlcv.close');
  assert.equal(buildKey('venue', 'micCode'), 'MD:venue.micCode');
  assert.throws(() => buildKey('derivatives', 'impliedVol'), /not in the accepted P01 field-dictionary vocabulary/);
  assert.throws(() => buildKey('price', 'sub.segment'), /not a single plain segment/);
});

test('parseKey round-trips the canonical form', () => {
  assert.deepEqual(parseKey('MD:price.last'), { token: 'MD:', domain: 'price', field: 'last' });
  assert.throws(() => parseKey('peRatio'), /does not carry the mandatory namespace/);
  assert.throws(() => parseKey('MD:priceonly'), /not of the canonical form/);
});

test('isNamespaced recognises only the MD: prefix', () => {
  assert.equal(isNamespaced('MD:price.last'), true);
  assert.equal(isNamespaced('md:price.last'), false, 'token casing is fixed (uppercase MD)');
  assert.equal(isNamespaced('peRatio'), false);
});

test('C1 — a bare (non-namespaced) key is a hard error', () => {
  assert.throws(() => assertC1(['MD:price.last', 'peRatio']), (e) => {
    assert.deepEqual(e.rules, ['C1']);
    assert.deepEqual(e.detail.offendingKeys, ['peRatio']);
    return true;
  });
  assert.equal(assertC1(['MD:price.last', 'MD:ohlcv.close']), true);
});

test('C2 — no companyInputs key may carry the namespace', () => {
  assert.throws(() => assertC2(['sector', 'MD:price.last']), (e) => {
    assert.deepEqual(e.rules, ['C2']);
    return true;
  });
  assert.equal(assertC2(['sector', 'marketCap']), true);
});

test('C3 — intersection of data.fields and companyInputs must be empty, listing every collision', () => {
  assert.throws(() => assertC3(['MD:price.last', 'peRatio'], ['peRatio', 'sector']), (e) => {
    assert.deepEqual(e.rules, ['C3']);
    assert.deepEqual(e.detail.collidingKeys, ['peRatio']);
    return true;
  });
});

test('C4 — cross-snapshot key intersections must be empty, naming both snapshot IDs', () => {
  assert.throws(
    () => assertC4([
      { snapshotId: 'data-a-1-2026-01-01T00:00:00.000Z', keys: ['MD:price.last'] },
      { snapshotId: 'data-b-1-2026-01-01T00:00:00.000Z', keys: ['MD:price.last', 'MD:ohlcv.close'] },
    ]),
    (e) => {
      assert.deepEqual(e.rules, ['C4']);
      assert.equal(e.detail.snapshotIdA, 'data-a-1-2026-01-01T00:00:00.000Z');
      assert.equal(e.detail.snapshotIdB, 'data-b-1-2026-01-01T00:00:00.000Z');
      assert.deepEqual(e.detail.collidingKeys, ['MD:price.last']);
      return true;
    },
  );
});

test('C5 — the guard is fail-closed: any violation aborts, nothing is returned', () => {
  assert.throws(() => assertCollisionGuard({
    fields: ['MD:price.last', 'peRatio'],
    companyInputKeys: [],
    contributing: [],
  }), /C1/);
  // A clean input passes all four gates.
  assert.equal(assertCollisionGuard({
    fields: ['MD:price.last'],
    companyInputKeys: ['sector'],
    contributing: [{ snapshotId: 'a', keys: ['MD:price.last'] }],
  }), true);
});

test('C6 — merge order is canonical, not implementation-incidental', () => {
  assert.deepEqual(canonicalKeyOrder(['MD:venue.name', 'MD:price.last', 'MD:ohlcv.close']),
    ['MD:ohlcv.close', 'MD:price.last', 'MD:venue.name']);

  // Two different insertion orders must produce the SAME merged key order.
  const a = { snapshotId: 'a', fields: { 'MD:venue.name': 'X', 'MD:price.last': '1.00' } };
  const b = { snapshotId: 'b', fields: { 'MD:ohlcv.close': '2.00' } };
  assert.deepEqual(Object.keys(mergeFieldMaps([a, b])), Object.keys(mergeFieldMaps([b, a])));
});

test('C6 — merge refuses to run when C1–C4 fail (no partial merge)', () => {
  assert.throws(() => mergeFieldMaps([
    { snapshotId: 'a', fields: { 'MD:price.last': '1.00' } },
    { snapshotId: 'b', fields: { 'MD:price.last': '2.00' } },
  ]), /C4/);
});

test('the collision-critical valuation keys are namespaced, never bare engine keys', () => {
  // D4_07 §I.1 / P01_FIELD_DICTIONARY §3: peRatio, evEbitda, evRevenue, fcfYield are existing
  // free-form engine keys shared across 2–6 engines. They must never appear bare.
  for (const f of ['peRatio', 'evEbitda', 'evRevenue', 'fcfYield']) {
    assert.equal(isNamespaced(buildKey('valuation', f)), true);
    assert.equal(buildKey('valuation', f), `MD:valuation.${f}`);
  }
});

test('namespaceVersion is a concrete value now that the token is recorded', () => {
  assert.equal(typeof NAMESPACE_VERSION, 'string');
  assert.match(NAMESPACE_VERSION, /^\d+\.\d+$/);
});
