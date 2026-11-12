/**
 * D-7 — provider state model and diagnostics disclosure policy: conformance.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), D-7
 * Decision record: docs/integration/DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md
 *
 * WHY THIS SUITE EXISTS
 * D-7 is a governance decision, so nothing in the runtime can fail when it is quietly contradicted.
 * Three drifts are possible and all three are silent:
 *   1. a state name is added, renamed or dropped, so W-07/W-10 implement a vocabulary the roadmap
 *      does not own;
 *   2. a MUST NOT disclosure item loses its prohibition (the transport case: `vault://` pointers
 *      were published for months without a failing test);
 *   3. the decision is cited as implementation authority and W-03 lands early.
 *
 * This suite pins the record's structure, the vocabulary, the disclosure lists, the IRR mapping and
 * the absence of W-03 implementation. It reads files only; it opens no socket, runs no PowerShell and
 * touches no credential.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RECORD = 'docs/integration/DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md';
const CLIENT_ACL = 'src/providers/dhan/dhan_dpapi_acl.ts';

/** The roadmap's eight states, in the ladder order D-7 declares. */
const STATES = [
  'UNCONFIGURED',
  'CONFIGURED',
  'CREDENTIALS_RESOLVED',
  'AUTHENTICATED',
  'OPERATIONAL',
  'EXPIRED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

function repo(relativePath: string): string {
  const full = resolve(process.cwd(), relativePath);
  assert.ok(existsSync(full), `expected ${relativePath} in the repository root`);
  return readFileSync(full, 'utf8');
}

/** Every `.ts` file under `src/`, so "no implementation exists" is a real search, not a guess. */
function sourceFiles(directory = resolve(process.cwd(), 'src')): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(full));
      continue;
    }
    if (entry.endsWith('.ts')) found.push(full);
  }
  return found;
}

describe('D-7 — provider state model and diagnostics disclosure policy', () => {
  const record = repo(RECORD);
  /** The same text with runs of whitespace collapsed, so a phrase is asserted independently of how
   * the Markdown happens to wrap. */
  const flat = record.replace(/\s+/g, ' ');
  const says = (phrase: string): boolean => flat.includes(phrase.replace(/\s+/g, ' '));

  it('D7-01: the record states its identifier, status, authority and that it is governance only', () => {
    assert.ok(record.includes('**Decision ID:** `D-7`'), 'decision identifier');
    assert.match(record, /\*\*Status:\*\* \*\*ADOPTED FOR IPD\*\*/, 'status');
    assert.match(record, /\*\*Authority:\*\* Program Authority under roadmap v1\.1/, 'authority');
    assert.ok(
      says('**This is a governance decision, not implementation authorization**'),
      'the governance/authorization distinction must be explicit in the header'
    );
    assert.ok(
      record.includes('**It authorizes no implementation.**'),
      'section 11 must refuse implementation authorization'
    );
    assert.ok(
      record.includes('frontend/server/market-data/dhanHealthState.ts'),
      'the IRR vocabulary is cited as evidence'
    );
    assert.ok(
      record.includes('DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1)'),
      'the roadmap reference is present'
    );
  });

  it('D7-02: the vocabulary is exactly the roadmap eight, in ladder order, with evidence and exits', () => {
    const ladder = '`UNCONFIGURED` → `CONFIGURED` → `CREDENTIALS_RESOLVED` → `AUTHENTICATED` → `OPERATIONAL`';
    assert.ok(record.includes(ladder), 'the capability ladder is stated in order');

    // Every state is declared, and appears in both the evidence table and the transition table.
    for (const state of STATES) {
      assert.ok(
        record.includes(`| \`${state}\` |`),
        `state ${state} must have an evidence row in the model table`
      );
    }
    for (const state of STATES) {
      assert.ok(
        record.includes(`\`${state}\``),
        `state ${state} must be referenced by the transitions`
      );
    }

    // No state outside the roadmap vocabulary may appear as a declared provider state.
    const declared = Array.from(record.matchAll(/^\| `([A-Z_]+)` \| (?:No usable|References|The store|The vendor|The provider|Material|A vendor|No more)/gm), (m) => m[1]);
    assert.deepEqual(declared.sort(), [...STATES].sort(), 'the declared state set must equal the roadmap set');

    // The off-ladder states must be named as such rather than silently folded into the ladder.
    assert.ok(
      record.includes('`EXPIRED`, `DEGRADED` and `UNAVAILABLE` are off-ladder states'),
      'off-ladder states are declared'
    );
  });

  it('D7-03: transitions are bounded and the forbidden ones are enumerated', () => {
    for (const id of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']) {
      assert.ok(record.includes(`| ${id} |`), `transition ${id} must be specified`);
    }
    assert.ok(record.includes('**Forbidden, without exception:**'), 'forbidden transitions are grouped');
    assert.ok(
      record.includes('any transition that skips a rung'),
      'skipping a rung is forbidden explicitly'
    );
    assert.ok(
      record.includes('a transition caused by a screen open, a status poll, or a timer'),
      'read-only surfaces may never drive a transition'
    );
    assert.ok(
      record.includes('recovery out of a **latched** auth failure without operator intervention'),
      'the D-2 latch is preserved'
    );
    // Fail-closed rule
    assert.ok(
      says('reports the least capable applicable state, and never a more capable one'),
      'the fail-closed rule is normative'
    );
  });

  it('D7-04: local readiness is separated from vendor connectivity by evidence class', () => {
    assert.ok(
      record.includes('**Local readiness is not connectivity.**'),
      'the separation is stated as a rule'
    );
    assert.ok(
      record.includes('W-02\'s executed 19/19 acceptance run proves the store at class E3'),
      'the W-02 evidence is cited at its real class'
    );
    assert.ok(
      record.includes('**`OPERATIONAL` is not `LIVE_QUALIFIED`.**'),
      'state and qualification are separate axes'
    );
    assert.ok(
      record.includes('| `AUTHENTICATED` | The vendor **accepted** the credential |'),
      'AUTHENTICATED requires a vendor acceptance'
    );
  });

  it('D7-05: verify-connection is two distinct verifications with enumerated outcomes', () => {
    assert.ok(record.includes('**V1 — Local readiness verification**'), 'V1 is defined');
    assert.ok(record.includes('**V2 — Authenticated vendor verification**'), 'V2 is defined');
    assert.ok(record.includes('**V2 is exactly one request.**'), 'exactly one request');
    assert.ok(
      record.includes('**no credential re-read**'),
      'V2 must not re-read the vault (D-2 is not expanded)'
    );
    for (const outcome of [
      'VERIFIED_VENDOR_ACCEPTED',
      'VERIFIED_LOCAL_ONLY',
      'AUTH_REJECTED',
      'EXPIRED_LOCAL',
      'NOT_ATTEMPTED_NOT_READY',
      'FAILED_TRANSPORT',
      'FAILED_VENDOR_RESPONSE',
    ]) {
      assert.ok(record.includes(`\`${outcome}\``), `outcome ${outcome} must be enumerated`);
    }
    assert.ok(
      says('must **never** be presented as authentication'),
      'a successful probe may never be represented as authentication'
    );
    assert.ok(
      record.includes('**Operator-initiated only.**'),
      'V2 is operator-initiated, never screen-open-driven'
    );
  });

  it('D7-06: the disclosure policy is two lists, the MAY list is exhaustive, and the superseded behaviours are named', () => {
    assert.ok(record.includes('### 4.1 MAY be exposed'), 'the MAY list exists');
    assert.ok(record.includes('### 4.2 MUST NOT be exposed'), 'the MUST NOT list exists');
    assert.ok(
      record.includes('**Rule of construction: the MAY list is exhaustive.**'),
      'a field not on the MAY list is prohibited by default'
    );

    // The specific prohibitions that W-02 and B-15 turn on.
    for (const prohibited of [
      'Secret values, tokens, or **any prefix or substring** of them',
      '`vault://` references, of either secret',
      'Carrier file names, paths or directories',
      'Raw child-process output (stdout or stderr)',
      'DPAPI ciphertext',
    ]) {
      assert.ok(record.includes(prohibited), `prohibition missing: ${prohibited}`);
    }

    // Superseded behaviours, with their locations.
    assert.ok(
      record.includes('`describeDhanConfig` returns `accessTokenKeyPath` / `clientIdKeyPath`'),
      'the IPD key-path output is named as superseded'
    );
    assert.ok(
      record.includes('`secretRefPointersOf`'),
      'the IRR pointer output is named as superseded'
    );
    assert.ok(record.includes('**Superseded.**'), 'the supersession is stated');
  });

  it('D7-07: every surface is rendered without a judgement call, and the IRR mapping is total', () => {
    for (const surface of ['Daemon startup line', '`ServiceHealth`', '`/v1/diagnostics`', 'Logs', 'Error responses']) {
      assert.ok(record.includes(`| ${surface}`), `surface ${surface} must be specified`);
    }
    // The IRR mapping must cover all eight states.
    const mapping = record.slice(record.indexOf('## 8. IRR mapping'), record.indexOf('## 9. Acceptance criteria'));
    for (const state of STATES) {
      assert.ok(
        mapping.includes(`| \`${state}\` |`),
        `IRR mapping must cover ${state}`
      );
    }
    assert.ok(
      mapping.replace(/\s+/g, ' ').includes('`PRE_ACCESS` must never be rendered as `DISCONNECTED`'),
      'IRR\'s not-attempted correction is preserved'
    );
  });

  it('D7-08: the record decides no code, and no W-03 implementation exists', () => {
    // The superseded key-path output still exists (D-7 changed nothing); W-03 will remove it.
    const config = repo('src/providers/dhan/dhan_config.ts');
    assert.ok(config.includes('accessTokenKeyPath'), 'D-7 must not have "fixed" this by code change');
    assert.ok(config.includes('clientIdKeyPath'), 'D-7 must not have "fixed" this by code change');

    // No selector, env key or diagnostics field may have appeared: that is W-03, not D-7.
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      if (text.includes('IIPS_DHAN_VAULT_BACKEND')) offenders.push(file);
    }
    assert.deepEqual(offenders, [], 'W-03 (the backend selector) must not be implemented by D-7');

    // The ACL module is untouched by this decision: it is only referenced here to prove the suite
    // reads real sources rather than inventing paths.
    assert.ok(existsSync(resolve(process.cwd(), CLIENT_ACL)), 'the W-02 ACL module is still present');
  });
});
