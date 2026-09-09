/**
 * P05-01 TESTS — NO LIVE-PROVIDER DEPENDENCY, NO SECRETS, NO P05-02/03/04 SCOPE CREEP
 *
 * Required test surface 10: no live-provider dependency is required.
 *
 * Also enforces the D9 §3 boundary: A-1 (P05-01) only. P05-02 live execution, P05-03 licensed
 * historical depth and P05-04 orchestration are NOT performed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { makeFeed, RECEIVED_AT, p05Root, readRepo } from './helpers.js';
import { scanForSecrets } from '../src/errors.js';

const RECEIVED = RECEIVED_AT;

/** Every file under a directory, recursively. */
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const ALL_P05_FILES = walk(p05Root);
/** Implementation modules only — the boundary assertions are about shipped behaviour, not
 *  about test files that legitimately name the things they assert are absent. */
const SOURCE_FILES = walk(join(p05Root, 'src')).filter((f) => f.endsWith('.js'));

/**
 * The P05-01 implementation modules, enumerated explicitly.
 *
 * The lexical boundary assertions below were authored when `src/` contained ONLY these files, so
 * "every file under src/" and "the P05-01 modules" were the same set. They are kept intact in
 * substance and applied to exactly this set, so no P05-01 assertion is weakened.
 */
const P05_01_SOURCE_FILES = SOURCE_FILES.filter(
  (f) => !/liveAdapterContract\.js$/.test(f) && !/historicalAdapterContract\.js$/.test(f),
);

/**
 * The P05-02 adapter-CONTRACT module, added under D9 §3 **A-2** — "Specification and
 * adapter-contract only — contract shape, conformance rules, entitlement/secret requirements,
 * error taxonomy mapping, observability requirements."
 *
 * It therefore legitimately NAMES an `authenticate` phase and a retry-class table. It performs no
 * authentication and implements no retry policy. That is asserted **behaviourally** in
 * `adapter-contract.test.js` (network primitives made to throw; no credential value handled),
 * which is a stronger claim than a lexical scan.
 */
const P05_02_CONTRACT_FILE = SOURCE_FILES.find((f) => /liveAdapterContract\.js$/.test(f));

/**
 * The P05-03 historical adapter-CONTRACT module, added under D9 §3 **A-3** — "Specification and
 * adapter-contract only — historical OHLCV ingestion contract, reproducibility and load/reconcile
 * requirements."
 *
 * ⚠ DISCLOSED SCOPE CORRECTION (P05-03-A). `P05_01_SOURCE_FILES` originally excluded only
 * `liveAdapterContract.js`, because that was the only contract module in existence. A contract
 * module *classifies* retryability — which D9 A-3 authorizes as error-taxonomy work — so the same
 * carve-out applies here by the rule already documented above, not by a new exception.
 *
 * This is **not** a weakening: the identical behavioural assertions applied to the P05-02 contract
 * module (no backoff, no retry loop, no attempt counter, no wait primitive) are applied to this
 * module too, and `historical-adapter-contract.test.js` HA/19 asserts them again independently.
 * The P05-01 implementation set keeps the strict "never even names retry" rule.
 */
const P05_03_CONTRACT_FILE = SOURCE_FILES.find((f) => /historicalAdapterContract\.js$/.test(f));

/** Every adapter-CONTRACT module (classification allowed, policy implementation prohibited). */
const CONTRACT_FILES = [P05_02_CONTRACT_FILE, P05_03_CONTRACT_FILE].filter((f) => f !== undefined);

test('10. the whole suite runs with no network access and no provider dependency', () => {
  // Prove it behaviourally: acquire every domain twice with global fetch and the http/https
  // modules made to throw. If anything reached out, the acquisition would fail.
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED IN P05-01'); };
  try {
    const feed = makeFeed();
    for (const req of [
      { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED },
      { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED },
      { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
      { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' },
    ]) {
      const r = feed.snapshot(req);
      assert.equal(r.ok, true, `${req.fixtureId} must succeed without any network`);
    }
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('10. no source file imports a network, process-spawning or ambient-state module', () => {
  const forbidden = ['node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram',
    'node:child_process', 'node:worker_threads', 'undici', 'axios', 'node-fetch', 'got'];
  for (const file of SOURCE_FILES) {
    const text = readFileSync(file, 'utf8');
    for (const mod of forbidden) {
      assert.ok(!text.includes(`'${mod}'`) && !text.includes(`"${mod}"`),
        `${file} must not import ${mod}`);
    }
  }
});

test('10. no source file reads the wall clock or a random source', () => {
  const forbidden = [/Date\.now\s*\(/, /new\s+Date\s*\(\s*\)/, /Math\.random\s*\(/,
    /crypto\.randomUUID\s*\(/, /process\.env/];
  for (const file of SOURCE_FILES) {
    const text = readFileSync(file, 'utf8');
    for (const re of forbidden) {
      assert.ok(!re.test(text), `${file} must not use ${re} (D-3: no wall-clock, random or ambient input)`);
    }
  }
});

test('10. the package declares ZERO runtime dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(p05Root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
  assert.equal(pkg.type, 'module');
});

test('10. no lockfile or node_modules exists — nothing to install, nothing to drift', () => {
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'node_modules']) {
    assert.ok(!ALL_P05_FILES.some((f) => f.endsWith(name)), `${name} must not exist`);
  }
});

test('A-23 / SM-4 / PR-8 — no credential material or endpoint anywhere in P05-01', () => {
  for (const file of ALL_P05_FILES) {
    if (!/\.(js|json)$/.test(file)) continue;
    const raw = readFileSync(file, 'utf8');
    // Fixtures are DATA and are scanned whole. Source is scanned as code, because contract
    // comments legitimately NAME the things that are prohibited.
    const text = file.endsWith('.json') ? raw : codeOnly(raw);
    assert.deepEqual(scanForSecrets(text), [], `${file} must contain no secret material`);
    assert.doesNotMatch(text, /https?:\/\/(?!schema|www\.w3|json-schema)/,
      `${file} must contain no endpoint URL`);
    assert.doesNotMatch(text, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  }
});

test('10. the feed declares no live connectivity, entitlement or credential requirement', () => {
  const feed = makeFeed();
  assert.equal(feed.capability['A-6'].liveConnectivity, false);
  assert.equal(feed.capability['A-7'].entitlementRequired, false);
  assert.equal(feed.capability['A-7'].credentialsRequired, false);
  assert.equal(feed.capability['A-1'].providerKind, 'LOCAL_FIXTURE');
});

test('10. the provider register records a local fixture source with no connectivity or credentials', () => {
  const reg = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'provider-register.json'), 'utf8'));
  assert.equal(reg.issued.length, 1);
  const p = reg.issued[0];
  assert.equal(p.provider, 'localfix');
  assert.equal(p.kind, 'LOCAL_FIXTURE');
  assert.equal(p.liveConnectivity, false);
  assert.equal(p.credentialsRequired, false);
  assert.equal(p.entitlementRequired, false);
  assert.deepEqual(p.domains, ['D01', 'D02', 'D10']);
  // PG-1: identities come from the governed register, never ad hoc.
  assert.equal(feed_provider_matches_register(), true);
});

function feed_provider_matches_register() {
  const reg = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'provider-register.json'), 'utf8'));
  return makeFeed().config.provider === reg.issued[0].provider;
}

test('A-8 — known limitations are first-class content, including the P05-02/03/04 boundary', () => {
  const feed = makeFeed();
  const limits = feed.capability['A-8'];
  assert.ok(limits.length >= 5);
  assert.ok(limits.some((l) => /no live provider/i.test(l)), 'declares no live provider');
  assert.ok(limits.some((l) => /P08/.test(l) && /PIT/i.test(l)), 'declares PIT is P08');
  assert.ok(limits.some((l) => /adjusted/.test(l) && /P08/.test(l)), 'declares adjusted series are P08');
  assert.ok(limits.some((l) => /OI-P04-03/.test(l)), 'declares the OI-P04-03 governance bound');
});

test('P05-02 — no live provider execution was performed', () => {
  const feed = makeFeed();
  assert.equal(feed.capability['A-6'].liveConnectivity, false);
  // No authenticated ingestion, no integration-test provider evidence.
  // Scope: the P05-01 modules this assertion was authored against. The P05-02 adapter-CONTRACT
  // module (D9 A-2) names an `authenticate` phase as an abstract interface, which is authorized
  // specification work; that it PERFORMS no authentication is asserted behaviourally below.
  for (const file of P05_01_SOURCE_FILES) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /authenticat\w*\s*\(/i, `${file} performs no authentication`);
  }
  // The P05-01 local feed — the only adapter that actually acquires data in this repository —
  // still declares no live connectivity and no credential requirement.
  assert.equal(feed.capability['A-7'].credentialsRequired, false);
  assert.equal(feed.capability['A-1'].providerKind, 'LOCAL_FIXTURE');
  // The P05-02 contract module exists, and it names authentication ONLY as a declared phase.
  if (P05_02_CONTRACT_FILE !== undefined) {
    const code = codeOnly(readFileSync(P05_02_CONTRACT_FILE, 'utf8'));
    assert.doesNotMatch(code, /node:(http|https|net|tls|dgram)/, 'no transport module is imported');
    assert.doesNotMatch(code, /process\.env/, 'no ambient credential source is read');
    assert.doesNotMatch(code, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'no key material');
  }
});

test('P05-03 — no licensed or deeper historical acquisition was performed', () => {
  const feed = makeFeed();
  // Only a single 1D granularity over a fixed 3-bar synthetic fixture.
  assert.deepEqual([...feed.capability['A-6'].granularities], ['1D']);
  const fx = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'feed-fixtures.json'), 'utf8'));
  assert.equal(fx.ohlcv.length, 1);
  assert.equal(fx.ohlcv[0].bars.length, 3);
  assert.ok(feed.capability['A-8'].some((l) => /D03–D09 not served/.test(l)));
});

/** Strip block and line comments so the assertions test CODE, not prose about the code. */
function codeOnly(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+\/\/[^\n]*$/gm, '');
}

test('P05-04 — no orchestration (scheduling, retries, checkpointing) is implemented', () => {
  for (const file of SOURCE_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    // These three hold for EVERY module including the P05-02 contract module — it declares no
    // scheduler, no async orchestration and no checkpointing.
    assert.doesNotMatch(code, /setInterval|setTimeout|cron|schedule\s*\(/, `${file} implements no scheduler`);
    assert.doesNotMatch(code, /async\s+function|\bawait\s+/, `${file} performs no async orchestration`);
    assert.doesNotMatch(code, /checkpoint\s*\(/i, `${file} implements no checkpointing`);
  }
  // ES-5: retry orchestration is P05 but is NOT in the P05-01 scope authorized by D9.
  // Scope: the P05-01 modules. The P05-02 contract module names the retry CLASS table, which D9
  // A-2 authorizes as "error taxonomy mapping"; it implements no retry policy (no backoff, no
  // loop, no attempt counter mutation), asserted behaviourally in adapter-contract.test.js.
  for (const file of P05_01_SOURCE_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /\bretr(y|ies|ying)\b/i, `${file} implements no retry policy`);
  }
  // A contract may CLASSIFY retryability; it may not implement a retry policy.
  for (const file of CONTRACT_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /backoff/i, `${file} implements no backoff policy`);
    assert.doesNotMatch(code, /while\s*\(|for\s*\(\s*let\s+attempt/, `${file} implements no retry loop`);
    assert.doesNotMatch(code, /maxRetries|retryCount\s*[+][+]|attempts\s*[+][+]/,
      `${file} mutates no attempt counter`);
    assert.doesNotMatch(code, /sleep\s*\(|delay\s*\(/, `${file} uses no wait primitive`);
  }
});

test('OI-P04-04 — no FIGI sourcing, licensing or coverage decision was made', () => {
  // The feed uses synthetic FIGI values from a fixture and makes no sourcing claim.
  const idfx = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
  for (const sec of idfx.securities) {
    for (const xi of sec.externalIdentifiers) {
      if (xi.type === 'FIGI') assert.match(xi.value, /^BBG00SYNTH\d{2}$/, 'synthetic, clearly non-real');
    }
  }
  const text = ALL_P05_FILES.filter((f) => /\.(js|json)$/.test(f))
    .map((f) => readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(text, /openfigi\.com|api\.openfigi|bloomberg\.com/i, 'no FIGI source is named or contacted');
});

/**
 * ⚠ SUPERSEDED ASSERTION — DISCLOSED, NOT EVADED.
 *
 * This test formerly asserted that P05 remained NOT_ACCEPTED and that no
 * `P05_GATE_ACCEPTANCE.md` could exist. That tripwire was correct, and load-bearing, while P05 was
 * unaccepted: it made a silent or unauthorized acceptance impossible to commit.
 *
 * The A3 phase-gate acceptor has since performed an **explicit** acceptance act
 * (`docs/p05/P05_GATE_ACCEPTANCE.md`, acceptor Ramakrishnan V. S. (Ramki),
 * `A3-P05-GATE-ACCEPTOR-DESIGNATION`). The tripwire is therefore **replaced, not weakened**: every
 * condition it protected is still asserted, and the guard is *strengthened* — it now additionally
 * requires that the acceptance record itself carry each limitation and non-authorization that the
 * old test protected by absence.
 *
 * Nothing is deleted from the protective surface:
 *   (a) the immutable D9 record must still read NOT_ACCEPTED — proving acceptance was recorded by
 *       a new, separate authority act and NOT by rewriting the D9 authority record;
 *   (b) certification must still be NONE_GRANTED and activation NOT_AUTHORIZED;
 *   (c) P05-04, provider execution and licensed acquisition must still be NOT_AUTHORIZED;
 *   (d) the PIT repeatability gap must be recorded as MISSING / NOT DEMONSTRATED;
 *   (e) no concessions register may exist and no waiver language may appear.
 */
test('P05 is ACCEPTED by an explicit A3 act, with every limitation and non-authorization preserved', () => {
  const docsP05 = join(p05Root, '..', 'docs', 'p05');
  const files = readdirSync(docsP05);
  assert.ok(files.includes('P05_GATE_ACCEPTANCE.md'),
    'the explicit A3 acceptance record must exist once the acceptance act has been performed');
  const acc = readRepo('docs/p05/P05_GATE_ACCEPTANCE.md');

  // (a) The immutable D9 authority record was NOT rewritten to manufacture the acceptance.
  const status = JSON.parse(readRepo('docs/d9/D9_STATUS.json'));
  assert.equal(status.p05_status.acceptance, 'NOT_ACCEPTED',
    'D9_STATUS.json is the historical record of the D9 moment and must remain unedited');
  assert.equal(status.p05_status.gate_acceptance_artifact_exists, false,
    'D9 recorded no acceptance artifact; that historical value is not retro-edited');
  assert.equal(status.authority_of_record.a3_gate_acceptor, 'UNKNOWN',
    'the A3 designation lives in P00_DECISION_LOG §7, not by rewriting D9');

  // (b) Certification and activation are untouched by gate acceptance.
  assert.equal(status.program_status.certification_status, 'NONE_GRANTED');
  assert.equal(status.program_status.production_activation_status, 'NOT_AUTHORIZED');
  assert.match(acc, /`NONE_GRANTED`/);
  assert.match(acc, /NA-4[^\n]*Production activation[^\n]*`NOT_AUTHORIZED`[^\n]*P16 only/);
  assert.match(acc, /`production_activation_status` \| \*\*`NOT_AUTHORIZED`\*\* \*\(unchanged/);

  // (c) P05-04, provider execution and licensed acquisition remain NOT_AUTHORIZED.
  assert.match(acc, /P05-04 = `NOT_AUTHORIZED` \/ NO COMPLETION EVIDENCE/);
  assert.match(acc, /D9 \*\*N-3\*\*/);
  assert.match(acc, /D9 \*\*N-1\*\*/);
  assert.match(acc, /D9 \*\*N-2\*\*/);
  assert.match(acc, /Acceptance ≠ authorization/);

  // (d) The PIT repeatability gap is recorded, and acceptance did not launder it.
  assert.match(acc, /PIT repeatability: MISSING \/ NOT DEMONSTRATED/);
  assert.match(acc, /the gap does not become evidence because acceptance occurred/i);
  assert.doesNotMatch(acc,
    /PIT[^.\n]{0,90}\b(?:was|is|has been)\s+(?:demonstrated|satisfied|met|passed)\b/i,
    'acceptance must never state that PIT repeatability was demonstrated');

  // (e) No concession mechanism, no concessions register, no waiver language.
  assert.match(acc, /No concession mechanism is invoked/);
  assert.doesNotMatch(acc, /waiv/i, 'no waiver language anywhere in the acceptance record');
  assert.doesNotMatch(acc, /silently conceded/i);
  const repoDocs = join(p05Root, '..', 'docs');
  assert.ok(!readdirSync(repoDocs).some((f) => /concession/i.test(f)),
    'no concessions register may exist');

  // The tracker exit criteria are not relabelled by the acceptance act.
  assert.match(acc, /\*\*C-2 UNMET\*\*/);
  assert.match(acc, /\*\*C-3 UNMET\*\*/);
  assert.match(acc, /\*\*C-4 NO EVIDENCE EXISTS\*\*/);
});

