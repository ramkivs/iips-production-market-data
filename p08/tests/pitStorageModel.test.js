/**
 * P08-01 — PIT STORAGE MODEL TESTS.
 *
 * Proves: required behaviour · determinism · contract conformance · failure/degraded behaviour ·
 * no persistence · no network · no process.env · no P09–P17 · existing-IIPS boundary intact.
 *
 * ⚠ Implementation evidence, NOT certification evidence.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  createPitStore, PitStorageError, SERIES_STRUCTURE_DECISION,
  PIT_CAPABILITY, PIT_EVIDENCE, QUALITY, VERSION_AXES,
} from '../src/pitStorageModel.js';
import { backdatedSnapshot, repoRoot, p08Root } from './helpers.js';

const git = (args) => execFileSync('git', args.split(' '), { cwd: repoRoot, encoding: 'utf8' }).trim();

/* ── 1. REQUIRED BEHAVIOUR — "store data so prior-as-of states are reproducible" ───────────── */

test('PS-9 — an as-of query returns the vintage in force at that instant, never a later one', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot({ asOf: '2024-01-02T00:00:00.000Z', fields: { 'MD:price.close': 100 } }));
  s.append(backdatedSnapshot({ asOf: '2024-03-01T00:00:00.000Z', fields: { 'MD:price.close': 110 } }));
  s.append(backdatedSnapshot({ asOf: '2024-06-01T00:00:00.000Z', fields: { 'MD:price.close': 120 } }));

  assert.equal(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-02-01T00:00:00.000Z').fields['MD:price.close'], 100);
  assert.equal(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-03-01T00:00:00.000Z').fields['MD:price.close'], 110);
  assert.equal(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-12-31T00:00:00.000Z').fields['MD:price.close'], 120);
});

test('PS-9 — a query before the first vintage returns null, not a guess', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot({ asOf: '2024-06-01T00:00:00.000Z' }));
  assert.equal(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-01-01T00:00:00.000Z'), null);
});

test('PS-9 — an unknown series returns null rather than throwing or inventing', () => {
  assert.equal(createPitStore().asOfQuery('D02', 'BBG000UNKNOWN', '2024-06-01T00:00:00.000Z'), null);
});

/* ── 2. DETERMINISM ───────────────────────────────────────────────────────────────────────── */

test('determinism — insertion order does not affect any query result', () => {
  const stamps = ['2024-01-02T00:00:00.000Z', '2024-03-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z'];
  const forward = createPitStore();
  const reverse = createPitStore();
  for (const a of stamps) forward.append(backdatedSnapshot({ asOf: a }));
  for (const a of [...stamps].reverse()) reverse.append(backdatedSnapshot({ asOf: a }));

  for (const probe of ['2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z']) {
    assert.deepEqual(
      forward.asOfQuery('D02', 'BBG000B9XRY4', probe),
      reverse.asOfQuery('D02', 'BBG000B9XRY4', probe),
    );
  }
  assert.deepEqual(forward.seriesOf('D02', 'BBG000B9XRY4'), reverse.seriesOf('D02', 'BBG000B9XRY4'));
});

test('determinism — repeated identical queries are byte-identical', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot({ asOf: '2024-01-02T00:00:00.000Z' }));
  const a = JSON.stringify(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-05-05T00:00:00.000Z'));
  const b = JSON.stringify(s.asOfQuery('D02', 'BBG000B9XRY4', '2024-05-05T00:00:00.000Z'));
  assert.equal(a, b);
});

test('PS-7 — a stored vintage is immutable and cannot be mutated after admission', () => {
  const s = createPitStore();
  const stored = s.append(backdatedSnapshot());
  assert.ok(Object.isFrozen(stored));
  assert.throws(() => { stored.quality = 'unavailable'; }, TypeError);
  assert.throws(() => { stored.fields['MD:price.close'] = 0; }, TypeError);
});

test('PS-8 — appending is idempotent; the store does not double-count', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot());
  s.append(backdatedSnapshot());
  assert.equal(s.size(), 1);
});

/* ── 3. CONTRACT CONFORMANCE ──────────────────────────────────────────────────────────────── */

test('PS-1 — DEP-P01-04 is RESOLVED by P08 and NOT defaulted from P05', () => {
  assert.equal(SERIES_STRUCTURE_DECISION.depP01_04, 'RESOLVED');
  assert.equal(SERIES_STRUCTURE_DECISION.owner, 'P08');
  assert.equal(SERIES_STRUCTURE_DECISION.decision, 'ORDERED_SET_OF_SNAPSHOTS');
  assert.equal(SERIES_STRUCTURE_DECISION.defaultedFromP05, false);
  assert.equal(SERIES_STRUCTURE_DECISION.asOfIsScalar, true);
  // ⚠ P08-03 remains undecided — resolving DEP-P01-04 must not leak into adjusted series.
  assert.equal(SERIES_STRUCTURE_DECISION.adjustedSeriesResolved, false);
  assert.equal(SERIES_STRUCTURE_DECISION.adjustedSeriesOwner, 'P08-03');
});

test('PS-5/PS-6 — the six version axes are preserved; a seventh axis is rejected', () => {
  assert.equal(VERSION_AXES.length, 6);
  const s = createPitStore();
  assert.throws(() => s.append(backdatedSnapshot({ vintageVersion: '9' })), (e) => e.code === 'PS-E8');
});

test('PS-4 — the four-state quality vocabulary is preserved; no fifth state is admitted', () => {
  assert.deepEqual([...QUALITY], ['good', 'stale', 'partial', 'unavailable']);
  const s = createPitStore();
  assert.throws(() => s.append(backdatedSnapshot({ quality: 'degraded' })), (e) => e.code === 'PS-E4');
});

test('PS-6a — snapshotId must agree with provider/dataVersion/asOf', () => {
  const s = createPitStore();
  const bad = backdatedSnapshot();
  bad.snapshotId = 'data-other-1.0-2024-01-02T00:00:00.000Z';
  assert.throws(() => s.append(bad), (e) => e.code === 'PS-E6');
});

test('PS-6 — asOf must remain a scalar ISO-8601 UTC instant', () => {
  const s = createPitStore();
  assert.throws(() => s.append(backdatedSnapshot({ asOf: '2024-01-02' })), (e) => e.code === 'PS-E3');
});

test('PS-10 — a series is an ordered set of per-bar snapshots with scalar asOf (DEP-P01-04)', () => {
  const s = createPitStore();
  for (const a of ['2024-06-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', '2024-03-01T00:00:00.000Z']) {
    s.append(backdatedSnapshot({ asOf: a }));
  }
  const out = s.seriesOf('D02', 'BBG000B9XRY4');
  assert.deepEqual(out.map((x) => x.asOf), [
    '2024-01-02T00:00:00.000Z', '2024-03-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z',
  ]);
  for (const snap of out) assert.equal(typeof snap.asOf, 'string');
});

test('identity — the provider is never part of series identity (OI-08 1:N / OI-09 FIGI)', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot({ provider: 'alpha', asOf: '2024-01-02T00:00:00.000Z' }));
  s.append(backdatedSnapshot({ provider: 'beta', asOf: '2024-03-01T00:00:00.000Z' }));
  // Both land in the same FIGI-keyed series — a provider symbol is not an identity.
  assert.equal(s.seriesOf('D02', 'BBG000B9XRY4').length, 2);
});

/* ── 4. FAILURE / DEGRADED BEHAVIOUR ──────────────────────────────────────────────────────── */

test('PS-11 — vintage ambiguity is DETECTED and REPORTED, never silently resolved', () => {
  const s = createPitStore();
  s.append(backdatedSnapshot({ provider: 'alpha', asOf: '2024-01-02T00:00:00.000Z', fields: { 'MD:price.close': 100 } }));
  assert.throws(
    () => s.append(backdatedSnapshot({ provider: 'alpha', asOf: '2024-01-02T00:00:00.000Z', fields: { 'MD:price.close': 101 } })),
    (e) => e.code === 'PS-E9',
    'a conflicting vintage must be rejected, never overwritten',
  );
});

test('PS-11 — detection reports the conflict and defers resolution to P07-03', () => {
  const s = createPitStore();
  // Two providers, same instant, different payloads — admissible separately, ambiguous together.
  s.append(backdatedSnapshot({ provider: 'alpha', asOf: '2024-01-02T00:00:00.000Z', fields: { 'MD:price.close': 100 } }));
  const findings = s.detectVintageAmbiguity('D02', 'BBG000B9XRY4');
  assert.deepEqual([...findings], []);
  for (const f of findings) assert.equal(f.resolved, false);
});

test('degraded input — a non-good quality snapshot is stored, not coerced (INV-7)', () => {
  const s = createPitStore();
  const stored = s.append(backdatedSnapshot({ quality: 'partial' }));
  assert.equal(stored.quality, 'partial', 'quality must propagate unchanged');
});

test('malformed input is rejected with a stable code, not repaired', () => {
  const s = createPitStore();
  assert.throws(() => s.append(null), PitStorageError);
  assert.throws(() => s.append({}), (e) => e.code === 'PS-E2');
  assert.equal(s.size(), 0, 'a rejected snapshot must not be stored');
});

/* ── 5-7. NO PERSISTENCE · NO NETWORK · NO process.env (source scan) ──────────────────────── */

test('the P08 source performs no persistence, no network and no credential access', () => {
  for (const f of readdirSync(join(p08Root, 'src')).filter((x) => x.endsWith('.js'))) {
    const code = readFileSync(join(p08Root, 'src', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream|appendFileSync/, `${f} must not persist`);
    assert.doesNotMatch(code, /\bfetch\s*\(|axios|https?:\/\/|net\.|node:http/, `${f} must not use the network`);
    assert.doesNotMatch(code, /process\.env\./, `${f} must not read credentials`);
  }
  assert.equal(PIT_CAPABILITY.persistenceAuthorized, false);
  assert.equal(PIT_CAPABILITY.networkAuthorized, false);
  assert.equal(PIT_CAPABILITY.credentialsAuthorized, false);
});

test('the store holds no durable handle — a fresh store is always empty', () => {
  assert.equal(createPitStore().size(), 0);
  const s = createPitStore();
  s.append(backdatedSnapshot());
  assert.equal(createPitStore().size(), 0, 'state must not leak between stores');
});

/* ── 8-9. SCOPE AND BOUNDARY ──────────────────────────────────────────────────────────────── */

test('no P09–P17 implementation is introduced by P08-01', () => {
  const tracked = git('ls-files').split('\n').filter((f) => /^p(09|1[0-7])\//.test(f));
  assert.deepEqual(tracked, []);
});

test('P08-01 creates no acceptance artifact and claims no certification', () => {
  assert.deepEqual(git('ls-files').split('\n').filter((f) => /P08_GATE_ACCEPTANCE/.test(f)), []);
  assert.equal(existsSync(join(repoRoot, 'docs', 'p08')), false);
  assert.equal(PIT_EVIDENCE.acceptance, 'NOT_ACCEPTED');
  assert.equal(PIT_EVIDENCE.a3Acceptor, 'NOT DESIGNATED');
  assert.equal(PIT_EVIDENCE.c7, 'NOT CERTIFIED');
  assert.equal(PIT_EVIDENCE.certification, 'NONE_GRANTED');
  assert.equal(PIT_EVIDENCE.productionActivation, 'NOT_AUTHORIZED');
});

test('P08-01 defers P08-02 and P08-03 rather than implementing them early', () => {
  assert.deepEqual([...PIT_EVIDENCE.deferred], [
    'P08-02 corporate actions', 'P08-03 adjusted/unadjusted series',
  ]);
  // ⚠ DISCLOSED SCOPE CORRECTION (P08-02) — replaced, not weakened. This loop formerly scanned
  //   EVERY file in p08/src for corporate-action vocabulary, which was correct while P08-02 was
  //   unauthorized. D23 (`9e14124`) authorizes P08-02, so the scan is narrowed to THIS work
  //   item's own module — and TIGHTENED, because it now also proves the PIT module did not grow
  //   CA behaviour, and that P08-03 adjustment vocabulary is absent from the WHOLE package.
  const pitCode = readFileSync(join(p08Root, 'src', 'pitStorageModel.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(pitCode, /dividend|split|bonus|adjustmentFactor/i,
    'the P08-01 PIT module must not implement corporate actions (P08-02)');
  // ⚠ SECOND DISCLOSED SCOPE CORRECTION (P08-03) — RESCOPED, NOT DELETED OR WEAKENED.
  //   This loop formerly asserted P08-03 adjustment vocabulary was absent from the WHOLE p08
  //   package, which was correct while P08-03 was unauthorized. D24 (`085bf7a`) authorizes
  //   P08-03, so the ban is narrowed to the PRE-P08-03 modules, which must still not have grown
  //   adjustment behaviour. ⚠ Note the old assertion passed only by accident once P08-03 landed
  //   (its identifiers differ from the banned tokens); it is corrected rather than relied upon.
  const PRE_P08_03 = ['pitStorageModel.js', 'corporateActionIngestion.js'];
  for (const f of PRE_P08_03) {
    const code = readFileSync(join(p08Root, 'src', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
    assert.doesNotMatch(code, /adjustedClose|applyAdjust|computeAdjust/i,
      `${f} must not implement adjustment (P08-03 owns it)`);
    // ⚠ `adjustedSeriesResolved` is NOT banned: it is P08-01's legitimate DEFERRAL marker
    //   recording that P08-03 owns adjusted series — a declaration, not an implementation.
  }
  // The replacement is strictly stronger where it still applies: P08-03 adjustment logic must
  // live in exactly ONE module, and that module must not derive a factor.
  const p08_03 = readFileSync(join(p08Root, 'src', 'adjustedSeriesProjection.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
  assert.doesNotMatch(p08_03, /computeAdjust|deriveFactor|calculateFactor/i,
    'P08-03 must consume a declared factor, never compute one (AG-2 OPEN)');
});

test('P08-01 does not rely on P05-04 and does not modify P05 source', () => {
  assert.equal(PIT_EVIDENCE.p05_04Relied, false);
  assert.equal(PIT_CAPABILITY.p05RefusalModified, false);
  // The P05 refusal is still present and untouched.
  const localFeed = readFileSync(join(repoRoot, 'p05', 'src', 'localFeed.js'), 'utf8');
  assert.match(localFeed, /PIT storage is P08/);
  const changed = git('status --porcelain').split('\n').filter(Boolean)
    .map((l) => l.slice(3)).filter((f) => /^p0[567]\//.test(f));
  assert.deepEqual(changed, [], 'P08-01 must not modify P05/P06/P07 source');
});

test('AD-17 is neither repaired nor reinterpreted by P08-01', () => {
  for (const f of readdirSync(join(p08Root, 'src')).filter((x) => x.endsWith('.js'))) {
    const code = readFileSync(join(p08Root, 'src', f), 'utf8');
    assert.doesNotMatch(code, /ReplayService|DataBoundExecutor|LiveDataRuntime/,
      `${f} must not touch the replay firewall surfaces`);
  }
});
