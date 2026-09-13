/**
 * P08-02 — CORPORATE-ACTION INGESTION TESTS ("Scenario tests" / "CA fixtures").
 *
 * Covers the 24 required areas: admission · FIGI linkage · dates · effectiveTime · lifecycle ·
 * namespace · canonical keys · PIT reproducibility · multiple actions · ordering · invalid input ·
 * duplicates/conflicts · determinism · adjustmentFactor ingestion · proof no adjustment is
 * computed or applied · no retroactive PIT mutation · no network/env/persistence · no P09+ ·
 * existing-IIPS boundary.
 *
 * ⚠ Implementation evidence, NOT certification evidence.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  createCorporateActionPipeline, toCanonicalSnapshot, declaredAdjustmentFactor,
  CorporateActionError, caKey, CA_FIELDS, ACTION_TYPES, LIFECYCLE_STATUS,
  CA_RULES, CA_EVIDENCE, CA_DOMAIN, NAMESPACE_TOKEN,
} from '../src/corporateActionIngestion.js';
import { createPitStore } from '../src/pitStorageModel.js';
import { repoRoot, p08Root } from './helpers.js';

const git = (a) => execFileSync('git', a.split(' '), { cwd: repoRoot, encoding: 'utf8' }).trim();

const FIGI_A = 'BBG000B9XRY4';
const FIGI_B = 'BBG000BLNNH6';

/** A deterministic CA fixture. Every timestamp is a literal — no wall clock. */
function caFixture(o = {}) {
  return {
    actionType: 'dividend',
    securityId: FIGI_A,
    lifecycleStatus: 'active',
    effectiveDate: '2024-03-15T00:00:00.000Z',
    effectiveTime: '2024-03-15T00:00:00.000Z',
    exDate: '2024-03-10T00:00:00.000Z',
    recordDate: '2024-03-12T00:00:00.000Z',
    payDate: '2024-03-20T00:00:00.000Z',
    cashAmount: 2.5,
    ...o,
  };
}
const meta = (asOf) => ({ provider: 'fixture', dataVersion: '1.0', asOf });

/* ── 1. VALID ADMISSION ───────────────────────────────────────────────────────────────────── */

test('CA-9 — a valid dividend is admitted and linked to its instrument', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  const linked = p.actionsFor(FIGI_A);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].securityId, FIGI_A, 'exit criterion: actions linked to instruments');
});

test('CA-3 — the three tracker-named action types are admitted', () => {
  assert.deepEqual([...ACTION_TYPES], ['dividend', 'split', 'bonus']);
  for (const t of ACTION_TYPES) {
    const p = createCorporateActionPipeline();
    assert.doesNotThrow(() => p.ingest(caFixture({ actionType: t }), meta('2024-03-16T00:00:00.000Z')));
  }
});

/* ── 2. FIGI / IDENTITY LINKAGE ───────────────────────────────────────────────────────────── */

test('CA-6d — a provider symbol is rejected as a security identity (OI-09)', () => {
  const p = createCorporateActionPipeline();
  assert.throws(() => p.ingest(caFixture({ securityId: 'RELIANCE.NS' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E5');
});

test('CA-6d — a synthetic ${sector}-H1 value is rejected as identity', () => {
  const p = createCorporateActionPipeline();
  assert.throws(() => p.ingest(caFixture({ securityId: 'energy-H1' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E5');
});

test('CA-6d — companyId may not be substituted for securityId (OI-08 is 1:N)', () => {
  const p = createCorporateActionPipeline();
  assert.throws(
    () => p.ingest(caFixture({ companyId: FIGI_A }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E6',
  );
});

test('OI-08 1:N — two instruments of one issuer keep separate action series', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture({ securityId: FIGI_A }), meta('2024-03-16T00:00:00.000Z'));
  p.ingest(caFixture({ securityId: FIGI_B }), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(p.actionsFor(FIGI_A).length, 1);
  assert.equal(p.actionsFor(FIGI_B).length, 1);
});

/* ── 3-4. DATES AND effectiveTime ─────────────────────────────────────────────────────────── */

test('CA-6c — ex/record/pay dates are DISTINCT fields and are never collapsed', () => {
  const snap = toCanonicalSnapshot(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(snap.fields[caKey('exDate')], '2024-03-10T00:00:00.000Z');
  assert.equal(snap.fields[caKey('recordDate')], '2024-03-12T00:00:00.000Z');
  assert.equal(snap.fields[caKey('payDate')], '2024-03-20T00:00:00.000Z');
  const distinct = new Set([snap.fields[caKey('exDate')], snap.fields[caKey('recordDate')], snap.fields[caKey('payDate')]]);
  assert.equal(distinct.size, 3, 'three distinct instants must survive ingestion');
  assert.equal(CA_RULES.datesCollapsed, false);
});

test('CA-6b — effectiveDate and effectiveTime are both REQUIRED', () => {
  for (const missing of ['effectiveDate', 'effectiveTime']) {
    const f = caFixture();
    delete f[missing];
    assert.throws(() => toCanonicalSnapshot(f, meta('2024-03-16T00:00:00.000Z')),
      (e) => e.code === 'CA-E3', `${missing} must be required`);
  }
});

test('CA-7 — asOf (ingestion vintage) is distinct from effectiveDate (when it takes effect)', () => {
  const snap = toCanonicalSnapshot(caFixture(), meta('2024-06-01T00:00:00.000Z'));
  assert.equal(snap.asOf, '2024-06-01T00:00:00.000Z');
  assert.equal(snap.fields[caKey('effectiveDate')], '2024-03-15T00:00:00.000Z');
  assert.notEqual(snap.asOf, snap.fields[caKey('effectiveDate')]);
});

/* ── 5. LIFECYCLE ─────────────────────────────────────────────────────────────────────────── */

test('CA-4 — the five-value P04-03 lifecycle enumeration is consumed exactly, not expanded', () => {
  assert.deepEqual([...LIFECYCLE_STATUS], ['active', 'suspended', 'delisted', 'merged', 'superseded']);
});

test('CA-6e — an invalid lifecycle status is rejected', () => {
  const p = createCorporateActionPipeline();
  assert.throws(() => p.ingest(caFixture({ lifecycleStatus: 'halted' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E7');
});

test('LC-3 — a delisted instrument still accepts actions (identity remains PIT-resolvable)', () => {
  const p = createCorporateActionPipeline();
  assert.doesNotThrow(() => p.ingest(caFixture({ lifecycleStatus: 'delisted' }), meta('2024-03-16T00:00:00.000Z')));
});

test('LC-4 — merged/superseded require a FIGI successor reference', () => {
  const p = createCorporateActionPipeline();
  for (const st of ['merged', 'superseded']) {
    assert.throws(() => p.ingest(caFixture({ lifecycleStatus: st }), meta('2024-03-16T00:00:00.000Z')),
      (e) => e.code === 'CA-E8');
    assert.doesNotThrow(() => createCorporateActionPipeline().ingest(
      caFixture({ lifecycleStatus: st, resultingInstrumentRef: FIGI_B }), meta('2024-03-16T00:00:00.000Z')));
  }
});

test('P04-03 is consumed as SPECIFICATION — no executable lifecycle service is provided', () => {
  assert.equal(CA_RULES.executableP04ServiceProvided, false);
  assert.equal(CA_RULES.lifecycleTransitionsImplemented, false);
  assert.equal(CA_EVIDENCE.p04LifecycleConsumedAsSpecification, true);
  assert.equal(CA_EVIDENCE.p04ExecutableServiceClaimed, false);
});

/* ── 6-7. NAMESPACE / CANONICAL KEYS ──────────────────────────────────────────────────────── */

test('CA-1 — keys use the resolved OI-10 token and form MD:<domain>.<field>', () => {
  assert.equal(NAMESPACE_TOKEN, 'MD:');
  assert.equal(caKey('actionType'), 'MD:corpaction.actionType');
  const snap = toCanonicalSnapshot(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  for (const k of Object.keys(snap.fields)) assert.match(k, /^MD:corpaction\.[A-Za-z]+$/);
  assert.equal(snap.domain, CA_DOMAIN);
});

test('CA-2 — the D04 field set matches P01_FIELD_DICTIONARY exactly', () => {
  assert.deepEqual(Object.keys(CA_FIELDS), [
    'actionType', 'exDate', 'recordDate', 'payDate', 'effectiveDate',
    'ratio', 'cashAmount', 'resultingInstrumentRef', 'adjustmentFactor',
  ]);
});

test('canonical envelope — six version axes and the accepted snapshotId composition', () => {
  const snap = toCanonicalSnapshot(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(snap.snapshotId, 'data-fixture-1.0-2024-03-16T00:00:00.000Z');
  assert.equal(typeof snap.asOf, 'string');
  const axes = Object.keys(snap).filter((k) => k.endsWith('Version'));
  assert.deepEqual(axes.sort(), ['dataVersion', 'namespaceVersion', 'schemaVersion']);
});

/* ── 8-10. PIT / ORDERING / MULTIPLE ACTIONS ──────────────────────────────────────────────── */

test('CA-11 — an action ingested later is INVISIBLE to an earlier PIT vintage', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture({ cashAmount: 2.5 }), meta('2024-03-16T00:00:00.000Z'));
  const before = JSON.stringify(p.asOfView(FIGI_A, '2024-04-01T00:00:00.000Z'));
  p.ingest(caFixture({ actionType: 'split', ratio: 2 }), meta('2024-09-01T00:00:00.000Z'));
  const after = JSON.stringify(p.asOfView(FIGI_A, '2024-04-01T00:00:00.000Z'));
  assert.equal(after, before, 'a later ingestion must not mutate an earlier PIT vintage');
});

test('CA-11 — the as-of view returns the vintage in force, never a later one', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture({ cashAmount: 2.5 }), meta('2024-03-16T00:00:00.000Z'));
  p.ingest(caFixture({ cashAmount: 3.0 }), meta('2024-06-16T00:00:00.000Z'));
  assert.equal(p.asOfView(FIGI_A, '2024-04-01T00:00:00.000Z').fields[caKey('cashAmount')], 2.5);
  assert.equal(p.asOfView(FIGI_A, '2024-07-01T00:00:00.000Z').fields[caKey('cashAmount')], 3.0);
  assert.equal(p.asOfView(FIGI_A, '2024-01-01T00:00:00.000Z'), null);
});

test('CA-10 — multiple actions are returned in historical order regardless of ingestion order', () => {
  const stamps = ['2024-09-01T00:00:00.000Z', '2024-03-16T00:00:00.000Z', '2024-06-16T00:00:00.000Z'];
  const p = createCorporateActionPipeline();
  for (const s of stamps) p.ingest(caFixture({ cashAmount: 1 + stamps.indexOf(s) }), meta(s));
  assert.deepEqual(p.actionsFor(FIGI_A).map((a) => a.asOf), [...stamps].sort());
});

test('P08-01 integration — the pipeline uses the existing PIT store unchanged', () => {
  const store = createPitStore();
  const p = createCorporateActionPipeline(store);
  p.ingest(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(store.size(), 1, 'records land in the caller-supplied P08-01 store');
  assert.equal(p.store, store);
});

/* ── 11-14. NEGATIVE / DUPLICATE / DETERMINISM ────────────────────────────────────────────── */

test('CA-6a — an unlisted actionType is rejected, keeping authority gap AG-1 visible', () => {
  const p = createCorporateActionPipeline();
  assert.throws(() => p.ingest(caFixture({ actionType: 'rights' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E2');
  assert.match(CA_EVIDENCE.authorityGaps[0], /AG-1/);
});

test('invalid input is rejected with stable codes, never repaired', () => {
  assert.throws(() => toCanonicalSnapshot(null, meta('2024-03-16T00:00:00.000Z')), CorporateActionError);
  assert.throws(() => toCanonicalSnapshot(caFixture({ exDate: '2024-03-10' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E4');
  assert.throws(() => toCanonicalSnapshot(caFixture({ cashAmount: 'two' }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E9');
});

test('CA-9 — a conflicting record at the same vintage is REJECTED, never overwritten', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture({ cashAmount: 2.5 }), meta('2024-03-16T00:00:00.000Z'));
  assert.throws(() => p.ingest(caFixture({ cashAmount: 9.9 }), meta('2024-03-16T00:00:00.000Z')),
    (e) => e.code === 'CA-E11');
  assert.equal(p.actionsFor(FIGI_A)[0].fields[caKey('cashAmount')], 2.5, 'the original survives');
});

test('duplicate identical ingestion is idempotent', () => {
  const p = createCorporateActionPipeline();
  p.ingest(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  p.ingest(caFixture(), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(p.actionsFor(FIGI_A).length, 1);
});

test('determinism — identical fixtures produce byte-identical snapshots', () => {
  const a = JSON.stringify(toCanonicalSnapshot(caFixture(), meta('2024-03-16T00:00:00.000Z')));
  const b = JSON.stringify(toCanonicalSnapshot(caFixture(), meta('2024-03-16T00:00:00.000Z')));
  assert.equal(a, b);
});

/* ── 15-17. ADJUSTMENT FIREWALL ───────────────────────────────────────────────────────────── */

test('CA-13 — a declared adjustmentFactor is INGESTED verbatim', () => {
  const p = createCorporateActionPipeline();
  const snap = p.ingest(caFixture({ actionType: 'split', ratio: 2, adjustmentFactor: 0.5 }),
    meta('2024-03-16T00:00:00.000Z'));
  assert.equal(snap.fields[caKey('adjustmentFactor')], 0.5);
  assert.equal(declaredAdjustmentFactor(snap), 0.5, 'read back unchanged, not recomputed');
});

test('CA-13 — no adjustment factor is COMPUTED: a split ratio never produces a factor', () => {
  const snap = toCanonicalSnapshot(caFixture({ actionType: 'split', ratio: 2 }), meta('2024-03-16T00:00:00.000Z'));
  assert.equal(snap.fields[caKey('ratio')], 2);
  assert.equal(declaredAdjustmentFactor(snap), null, 'a ratio must NOT be turned into a factor — that is P08-03');
  assert.equal(CA_RULES.adjustmentComputed, false);
});

test('CA-13 — no adjustment is APPLIED: no price is produced or rewritten', () => {
  const p = createCorporateActionPipeline();
  const snap = p.ingest(caFixture({ actionType: 'split', ratio: 2, adjustmentFactor: 0.5 }),
    meta('2024-03-16T00:00:00.000Z'));
  for (const k of Object.keys(snap.fields)) {
    assert.doesNotMatch(k, /price|ohlcv|adjustedClose/, 'P08-02 must emit no price/series field');
  }
  assert.equal(CA_RULES.adjustmentApplied, false);
});

test('the P08-02 source contains no adjustment computation or application', () => {
  // ⚠ Strip comments AND string literals: the P08-03 deferral list legitimately NAMES
  //   'adjusted/unadjusted series' as deferred work. Naming what is deferred is the opposite of
  //   implementing it; only executable code is scanned.
  const code = readFileSync(join(p08Root, 'src', 'corporateActionIngestion.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
  assert.doesNotMatch(code, /adjustedClose|applyAdjust|computeAdjust|unadjusted/i);
  // No arithmetic on the adjustment factor or ratio.
  assert.doesNotMatch(code, /adjustmentFactor\s*[*/+-]|ratio\s*[*/]/);
});

test('P08-03 work is explicitly deferred, not absorbed', () => {
  assert.deepEqual([...CA_EVIDENCE.deferredToP08_03], [
    'adjustment computation', 'adjustment application', 'adjusted/unadjusted series',
    'portfolio reconciliation', 'P07-03 reconciliation policy invocation',
  ]);
  assert.equal(CA_EVIDENCE.p07_03IsDependency, false);
  assert.equal(CA_RULES.p07_03ReconciliationInvoked, false);
});

/* ── 18-24. SCANS AND BOUNDARIES ──────────────────────────────────────────────────────────── */

test('the P08 source performs no persistence, no network and no credential access', () => {
  for (const f of readdirSync(join(p08Root, 'src')).filter((x) => x.endsWith('.js'))) {
    const code = readFileSync(join(p08Root, 'src', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream|appendFileSync|sqlite|mongo/i, f);
    assert.doesNotMatch(code, /\bfetch\s*\(|axios|https?:\/\/|node:http/, f);
    assert.doesNotMatch(code, /process\.env\./, f);
  }
});

test('no P09–P17 leakage and no P08 acceptance artifact', () => {
  assert.deepEqual(git('ls-files').split('\n').filter((f) => /^p(09|1[0-7])\//.test(f)), []);
  assert.deepEqual(git('ls-files').split('\n').filter((f) => /P08_GATE_ACCEPTANCE/.test(f)), []);
  assert.equal(existsSync(join(repoRoot, 'docs', 'p08')), false);
});

test('certification, acceptance and A3 states are unchanged by P08-02', () => {
  assert.equal(CA_EVIDENCE.acceptance, 'NOT_ACCEPTED');
  assert.equal(CA_EVIDENCE.a3Acceptor, 'NOT DESIGNATED');
  assert.equal(CA_EVIDENCE.c7, 'NOT CERTIFIED');
  assert.equal(CA_EVIDENCE.certification, 'NONE_GRANTED');
  assert.equal(CA_EVIDENCE.productionActivation, 'NOT_AUTHORIZED');
});

test('P08-02 does not rely on P05-04 and does not modify P05/P06/P07 source', () => {
  assert.equal(CA_EVIDENCE.p05_04Relied, false);
  // ⚠ DISCLOSED SCOPE CORRECTION (P08-ACCEPT) — RESCOPED, NOT WEAKENED. This working-tree check is
  //   a PROXY for "this work item must not modify P05/P06/P07". It still bars every such change
  //   with ONE narrowly-anchored exemption: `p05/tests/existing-iips-boundary.test.js`, the P05
  //   governance guard whose P08 arm was rescoped by the SEPARATE A3 acceptance act
  //   (`docs/PHASE_08_GATE_ACCEPTANCE.md` §10) — exactly as the P05/P06 acceptance acts rescoped
  //   their own tripwires. ⚠ The exemption applies ONLY while that acceptance record exists, and
  //   ⛔ p05/src, p06/** and p07/** remain entirely barred.
  const P08_ACCEPT_EXEMPT = existsSync(join(repoRoot, 'docs', 'PHASE_08_GATE_ACCEPTANCE.md'))
    ? ['p05/tests/existing-iips-boundary.test.js'] : [];
  const changed = git('status --porcelain').split('\n').filter(Boolean)
    .map((l) => l.slice(3)).filter((f) => /^p0[567]\//.test(f) && !P08_ACCEPT_EXEMPT.includes(f));
  assert.deepEqual(changed, []);
});

test('AD-17 is neither repaired nor reinterpreted by P08-02', () => {
  const code = readFileSync(join(p08Root, 'src', 'corporateActionIngestion.js'), 'utf8');
  assert.doesNotMatch(code, /ReplayService|DataBoundExecutor|LiveDataRuntime/);
});
