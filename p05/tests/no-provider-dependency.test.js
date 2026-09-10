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
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { createHash } from 'node:crypto';

import { makeFeed, RECEIVED_AT, p05Root, readRepo } from './helpers.js';
import { scanForSecrets } from '../src/errors.js';
import { NAMESPACE_TOKEN } from '../src/namespace.js';

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
  (f) => !/liveAdapterContract\.js$/.test(f)
    && !/historicalAdapterContract\.js$/.test(f)
    && !/ingestionOrchestrator\.js$/.test(f),
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

/**
 * The P05-04 INGESTION ORCHESTRATOR, added under **D10-1**
 * (`docs/p00/P00_DECISION_LOG.md` §8.1) — *"P05-04 — ingestion orchestration — is AUTHORIZED …
 * Scheduling · retry execution · idempotent checkpointing."* D10-1 is the *"further explicit act"*
 * that D9 §3.1 **N-3** required (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`:89).
 *
 * ⚠ DISCLOSED SCOPE CORRECTION (P05-04-A), of exactly the same kind as P05-03-A above. The
 *   lexical assertions below were authored when `src/` contained only the P05-01 modules, so
 *   "every file under src/" and "the P05-01 modules" were one set. This module is **not** a P05-01
 *   module: it is the `Work Tracker`!P05-04 deliverable *"Ingestion orchestrator"*, whose tracker
 *   *Requirement* is literally *"Scheduling, retries, idempotency and checkpointing."* Excluding it
 *   from a **P05-01-specific** assertion therefore changes no P05-01 assertion at all — the P05-01
 *   module set is byte-for-byte the same set it was, and keeps the strict "never even names retry"
 *   rule.
 *
 * ⚠ This is **not** a weakening. The three universal lexical rules (no scheduler, no async
 *   orchestration, no wait primitive) are applied to EVERY module INCLUDING this one and still
 *   hold, because the orchestrator is fully synchronous and advances a VIRTUAL clock. What the old
 *   absence-based rule could never assert — that checkpointing is *correct* — is now asserted
 *   BEHAVIOURALLY in `orchestration.test.js`, which is a stronger claim than a lexical scan:
 *   idempotent re-record is a no-op, a differing outcome is a conflict and never an overwrite, a
 *   checkpointed tick performs no adapter work on replay, and an interrupted run resumes without
 *   duplicating data.
 */
const P05_04_ORCHESTRATOR_FILE = SOURCE_FILES.find((f) => /ingestionOrchestrator\.js$/.test(f));

/** Every module that is NOT the D10-authorized P05-04 orchestrator. */
const NON_ORCHESTRATOR_SOURCE_FILES = SOURCE_FILES.filter((f) => f !== P05_04_ORCHESTRATOR_FILE);

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

/**
 * ⚠ SUPERSEDED GUARD — REPLACED, NOT WEAKENED (D10-1).
 *
 * This test formerly read *"P05-04 — no orchestration (scheduling, retries, checkpointing) is
 * implemented"* and asserted, by ABSENCE, that no module under `src/` contained a scheduler, async
 * orchestration or checkpointing. That was correct and load-bearing while P05-04 was
 * `NOT_AUTHORIZED` (D9 **N-3**): it made an unauthorized P05-04 build-out impossible to commit
 * silently. **D10-1 is precisely the explicit act that guard was waiting for**, so the guard is
 * now replaced — on the same terms the P05 acceptance record set at `docs/p05/P05_GATE_ACCEPTANCE.md`
 * §9 for the analogous `NOT_ACCEPTED` tripwire: *the protective surface is enlarged, not reduced.*
 *
 * Every condition the old guard protected is still asserted below, and two are asserted MORE
 * strongly than before:
 *   · "no scheduler / no async orchestration" — STILL UNIVERSAL. It now covers the orchestrator
 *     too, and the orchestrator satisfies it, because it is fully synchronous and advances a
 *     VIRTUAL clock. Nothing was carved out here.
 *   · "no module implements checkpointing" — RESCOPED, because D10-1 authorizes exactly that in
 *     exactly one module. It is replaced by: no module OTHER THAN the enumerated D10-authorized
 *     orchestrator implements checkpointing, PLUS the behavioural idempotency proofs in
 *     `orchestration.test.js` (C/1…C/3, I/1…I/5) that an absence-based rule could never make.
 *   · "P05-01 modules never name retry" and "a contract classifies retryability but implements no
 *     policy" — UNCHANGED, applied to byte-for-byte the same module sets as before.
 *   · NEW: no module anywhere sleeps on the wall clock, and the orchestrator cannot be built
 *     around a live-connectivity adapter at all.
 */
test('P05-04 — orchestration is confined to the single D10-1-authorized module and is fail-closed', () => {
  assert.ok(P05_04_ORCHESTRATOR_FILE !== undefined,
    'the P05-04 orchestrator module must exist, since D10-1 authorized it');

  // ── (1) UNIVERSAL, UNCHANGED IN SUBSTANCE AND NOW BROADER: no scheduler, no async. ──
  for (const file of SOURCE_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /setInterval|setTimeout|cron|schedule\s*\(/, `${file} implements no scheduler`);
    assert.doesNotMatch(code, /async\s+function|\bawait\s+/, `${file} performs no async orchestration`);
    // NEW: nothing may wait on real time. The orchestrator advances a virtual clock instead.
    assert.doesNotMatch(code, /sleep\s*\(|delay\s*\(/, `${file} uses no wait primitive`);
  }

  // ── (2) RESCOPED: checkpointing exists in ONE authorized module and nowhere else. ──
  for (const file of NON_ORCHESTRATOR_SOURCE_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /checkpoint\s*\(/i, `${file} implements no checkpointing`);
  }
  // The authorized module must actually implement it — a guard that could be satisfied by
  // deleting the feature would be worthless.
  const orchCode = codeOnly(readFileSync(P05_04_ORCHESTRATOR_FILE, 'utf8'));
  assert.match(orchCode, /recordCheckpoint\s*\(/, 'the orchestrator implements idempotent checkpointing');
  assert.match(orchCode, /IDEMPOTENT_NOOP/, 're-recording a completed checkpoint is a no-op');
  assert.match(orchCode, /CONFLICT_REJECTED/, 'a differing outcome is a conflict, never an overwrite');
  assert.match(orchCode, /INV-2/, 'checkpoint immutability cites the accepted INV-2 rule');

  // ── (3) UNCHANGED: the P05-01 module set never even names retry. ──
  assert.equal(P05_01_SOURCE_FILES.length, 8, 'the P05-01 module set is the same eight modules');
  for (const file of P05_01_SOURCE_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /\bretr(y|ies|ying)\b/i, `${file} implements no retry policy`);
  }

  // ── (4) UNCHANGED: a contract may CLASSIFY retryability, never implement a policy. ──
  for (const file of CONTRACT_FILES) {
    const code = codeOnly(readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, /backoff/i, `${file} implements no backoff policy`);
    assert.doesNotMatch(code, /while\s*\(|for\s*\(\s*let\s+attempt/, `${file} implements no retry loop`);
    assert.doesNotMatch(code, /maxRetries|retryCount\s*[+][+]|attempts\s*[+][+]/,
      `${file} mutates no attempt counter`);
    assert.doesNotMatch(code, /sleep\s*\(|delay\s*\(/, `${file} uses no wait primitive`);
  }

  // ── (5) NEW: retry execution is DELEGATED to the accepted taxonomy, never re-decided. ──
  // D10-1 authorizes "retry execution"; D8:35 authorizes no methodology variation. The module must
  // therefore read retryability from ./errors.js rather than invent its own table.
  assert.match(orchCode, /import\s*\{[^}]*RETRY_PROHIBITED[^}]*\}\s*from\s*'\.\/errors\.js'/,
    'retryability is imported from the accepted P02 taxonomy');
  assert.match(orchCode, /DISPOSITION\[code\]/, 'retryability defers to DISPOSITION.retryable');
  assert.doesNotMatch(orchCode, /retryable\s*:\s*(true|false)/,
    'the orchestrator declares no retryability table of its own');

  // ── (6) NEW: the orchestrator is fail-closed against provider execution (D9 N-1 / D10 §8.2). ──
  assert.match(orchCode, /assertOrchestrationPermitted/, 'a provider-execution guard exists');
  assert.match(orchCode, /PERMITTED_PROVIDER_KIND\s*=\s*'LOCAL_FIXTURE'/);
  assert.match(orchCode, /NOT_AUTHORIZED \(D9 N-1, D10 §8\.2\)/);
  assert.match(orchCode, /liveConnectivity !== false/, 'live connectivity is refused, not merely avoided');

  // ── (7) NEW: P05-04 is orchestration, not P06. No normalization vocabulary is introduced. ──
  assert.doesNotMatch(orchCode, /normaliz|rawPayload|canonicalForm|deduplicationKey/i,
    'the orchestrator implements no P06 normalization concept');
  // The boundary is declared IN CODE, in the evidence artifact itself — not only in prose.
  assert.match(orchCode, /phaseScope: 'P05-04'/, 'the run log states its own phase scope');
  assert.match(orchCode, /p06Implemented: false/, 'the run log declares that P06 is not implemented');
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


/**
 * D10 — P05-04 AUTHORIZATION + P06 ENTRY AUTHORIZATION + P06 A3 DESIGNATION +
 * `DataBoundExecutor` C1–C6 EXECUTION AUTHORIZATION (`docs/p00/P00_DECISION_LOG.md` §8).
 *
 * This is a NEW guard. It weakens nothing: every pre-existing assertion in this file is intact,
 * including the P05 acceptance guard above, which continues to require that the P05 acceptance
 * record still reads P05-04 `NOT_AUTHORIZED` — because that is what was true at the moment of P05
 * acceptance, and D10 supersedes it as to current state WITHOUT editing it.
 *
 * The guard's job is to make the authorization durable and to prevent a contradictory
 * unauthorized-state claim from being committed later: it pins what D10 grants, what it expressly
 * does NOT grant, and that no P06 acceptance or implementation was smuggled in with it.
 */
test('D10 — P05-04 and P06 entry are authorized, bounded, and grant no acceptance or execution beyond scope', () => {
  const log = readRepo('docs/p00/P00_DECISION_LOG.md');

  // ── 1. The append-only authority act exists, in the decision log its own rules provide for. ──
  assert.match(log, /^## 8\. D10 —/m, 'D10 must be recorded as an append-only decision-log entry');
  assert.match(log, /Append-only entry per §5 rule 1/);
  assert.match(log, /No new governance instrument, directory or register was created/);

  // ── 2. What D10 grants. ──
  assert.match(log, /P05-04 — ingestion orchestration — is AUTHORIZED/);
  assert.match(log, /P06 ENTRY is AUTHORIZED/);
  assert.match(log, /`P06-01`, `P06-02`, `P06-03` ONLY/);
  assert.match(log, /A3 phase-gate acceptance authority for the P06 gate is DESIGNATED as Ramakrishnan V\. S\. \(Ramki\)/);
  assert.match(log, /C1–C6 fail-closed collision guard in the existing certified `DataBoundExecutor` is AUTHORIZED/);

  // ── 3. The authorization is bounded, and the C1–C6 design is not varied. ──
  assert.match(log, /no variation authorized/i);
  assert.match(log, /NO METHODOLOGY VARIATION IS AUTHORIZED/);
  assert.match(log, /P07–P17 acceptor assignment NOT made by this entry/);

  // ── 4. Authorization is NOT acceptance, and no P06 acceptance artifact may exist. ──
  assert.match(log, /P06 AUTHORIZATION IS NOT P06 ACCEPTANCE/);
  assert.match(log, /No `P06_GATE_ACCEPTANCE\.md` is created by this entry/);
  const docsRoot = join(p05Root, '..', 'docs');
  // ⚠ DISCLOSED SCOPE CORRECTION (P06-01-B). This clause asserted that `docs/p06` must NOT exist.
  //   That was correct and load-bearing at the moment D10 was recorded: D10 authorized P06 ENTRY
  //   and explicitly implemented nothing, so the directory's absence was the proof. **P06-01 is
  //   now implemented under that same D10-2 authorization**, so the directory legitimately exists.
  //   The clause is RESCOPED, not deleted — and TIGHTENED, because it now also constrains what may
  //   be inside. The `P06_GATE_ACCEPTANCE.md` prohibition that follows is UNCHANGED IN SUBSTANCE
  //   and BROADENED from two directories to the whole `docs/` tree.
  // ⚠ DISCLOSED SCOPE CORRECTION (P06-03-C): the permitted prefix set was `^P06_01_`, then
  //   `^P06_0[12]_`, while the later work items were authorized for ENTRY only. **All three P06
  //   work items authorized by D10-2 are now implemented**, so the set is the three of them.
  //   ⚠ The tracker defines **no fourth P06 work item**, and the P06-acceptance-artifact ban that
  //   follows is UNCHANGED — so this clause still bites on anything beyond the authorized scope.
  const docsP06 = join(docsRoot, 'p06');
  if (existsSync(docsP06)) {
    for (const f of readdirSync(docsP06)) {
      assert.match(f, /^P06_0[123]_/,
        `docs/p06 may hold ONLY P06-01 / P06-02 / P06-03 artifacts — the complete D10-2 scope; the `
        + `tracker defines no fourth P06 work item, and no P06 acceptance artifact may exist. `
        + `Found '${f}'`);
    }
  }
  const acceptanceArtifacts = [];
  const walkDocs = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walkDocs(join(dir, entry.name));
      else if (/P06_GATE_ACCEPTANCE/.test(entry.name)) acceptanceArtifacts.push(join(dir, entry.name));
    }
  };
  walkDocs(docsRoot);
  assert.deepEqual(acceptanceArtifacts, [],
    'no P06 acceptance artifact may exist anywhere in docs/ — D10-6: authorization is not acceptance');

  // ── 5. Nothing beyond scope was granted: provider, licensed, activation, merge, certification. ──
  assert.match(log, /\*\*P05-02 live provider execution\*\* — \*\*`NOT_AUTHORIZED`\*\*/);
  assert.match(log, /\*\*Licensed \/ deeper historical data acquisition\*\* — \*\*`NOT_AUTHORIZED`\*\*/);
  assert.match(log, /\*\*Production activation\*\* — \*\*`NOT_AUTHORIZED`\*\*/);
  assert.match(log, /\*\*Track B → `origin\/main` merge\*\* — \*\*`NOT AUTHORIZED`\*\*/);
  assert.match(log, /\*\*Any certification\*\* — \*\*`NONE_GRANTED`\*\*/);
  assert.match(log, /Authority authorization is never certification/);
  assert.match(log, /\*\*P06 gate acceptance\*\* — \*\*NOT ACCEPTED\*\*/);
  assert.match(log, /\*\*P07, P08 or any P09–P17 entry or promotion\*\*/);

  // ── 6. The historical P05 acceptance record is NOT edited by the authorization. ──
  // Its blob is pinned: at the moment of P05 acceptance, P05-04 was NOT_AUTHORIZED, and that
  // statement must survive D10 unchanged. Supersession is by addition, never by edit.
  const accBytes = readFileSync(join(docsRoot, 'p05', 'P05_GATE_ACCEPTANCE.md'));
  // Pin the GIT BLOB id, i.e. sha1("blob <len>\0" + content) — the same value `git hash-object`
  // and `git rev-parse HEAD:…` report, so this assertion is directly comparable to the commit.
  const gitBlobId = createHash('sha1')
    .update(Buffer.from(`blob ${accBytes.length}\0`, 'utf8'))
    .update(accBytes)
    .digest('hex');
  assert.equal(gitBlobId, '94f87c614795fc47692d924a8490bc8d41e98d5a',
    'the P05 acceptance record must remain byte-identical after D10');
  assert.match(accBytes.toString('utf8'), /P05-04 = `NOT_AUTHORIZED` \/ NO COMPLETION EVIDENCE/);

  // ── 7. The C1–C6 fail-closed protection in the implementation is intact and unvaried. ──
  const ns = readFileSync(join(p05Root, 'src', 'namespace.js'), 'utf8');
  for (const fn of ['assertC1', 'assertC2', 'assertC3', 'assertC4']) {
    assert.match(ns, new RegExp(`export function ${fn}\\(`), `${fn} must still exist`);
  }
  assert.match(ns, /ADR-01 C5 — fail-closed/);
  assert.match(ns, /ADR-01 C6 — deterministic merge order/);
  assert.match(ns, /ADR-01 C1–C6 — UNCHANGED/);
  assert.equal(NAMESPACE_TOKEN, 'MD:', 'the exact namespace token is unchanged');
});
