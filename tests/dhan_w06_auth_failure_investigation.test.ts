/**
 * W-06 — Dhan authentication-failure investigation: the distinctions the report must not lose.
 *
 * Record: docs/integration/DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-06
 *
 * WHY THIS SUITE EXISTS
 * This report is a diagnosis of a failure nobody can currently explain, and its value depends entirely
 * on two properties: that it does not smuggle a conclusion into a place where the evidence only supports
 * a hypothesis, and that its safety claims stay true if the document is later edited. An investigation
 * record that quietly promotes "MEDIUM confidence" to a fact, or that starts implying the local
 * `CREDENTIALS_RESOLVED` proves Dhan accepted the credentials, is worse than no record at all.
 *
 * It also pins the two defects the report found, against the source, so that the report cannot go stale
 * silently: if `mapHttpStatus` ever stops being the sole producer of AUTHENTICATION_FAILURE, or if the
 * vendor status is ever surfaced, the report's central argument changes and this fails.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

const REPORT = 'docs/integration/DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md';
const RECOVERY = 'docs/integration/DHAN-W06-LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md';

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function flat(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[*`]/g, '');
}

describe('W-06 Dhan authentication-failure investigation (documentation)', () => {
  it('W06-I01: the report keeps local resolution, transport auth, vendor auth and rotation apart', () => {
    const text = flat(repoText(REPORT));

    // The four layers must each be named and given their own status.
    for (const layer of [
      'Local credential resolution',
      'Local transport authentication',
      'Vendor authentication',
      'Token rotation',
    ]) {
      assert.ok(text.includes(layer), `the report must distinguish: ${layer}`);
    }

    // And the forbidden inference must be refused in words, not merely absent.
    assert.ok(
      text.includes('not evidence of vendor authentication'),
      'the report must state that local readiness is not vendor authentication'
    );

    // A local 200 or CREDENTIALS_RESOLVED must never be presented as authentication.
    for (const forbidden of [
      /CREDENTIALS_RESOLVED (?:proves|confirms|demonstrates) (?:Dhan|vendor) authentication/i,
      /(?:DPAPI )?READY (?:proves|confirms) (?:Dhan|vendor)/i,
      /health (?:200|HTTP 200) (?:proves|confirms) (?:Dhan|vendor) authentication/i,
    ]) {
      assert.strictEqual(text.match(forbidden), null, `must not claim: ${forbidden.source}`);
    }
  });

  it('W06-I02: the 502 is attributed to the daemon, never to Dhan', () => {
    const text = flat(repoText(REPORT));
    assert.ok(text.includes('The 502 is not the vendor'), 'the report must say whose 502 this is');
    assert.ok(text.includes('daemon'), 'and name the daemon as its source');
    // A vendor 502 claim would be a category error and must not appear.
    assert.strictEqual(
      text.match(/Dhan (?:returned|responded with|sent) (?:a )?502/i),
      null,
      'the report must not attribute 502 to the vendor'
    );
  });

  it('W06-I03: no hypothesis is presented as an established fact', () => {
    const record = repoText(REPORT);

    // Every hypothesis carries an explicit confidence level from the governed set.
    for (const id of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7']) {
      assert.ok(record.includes(`### 8.${id.slice(1)} `), `hypothesis ${id} must have its own entry`);
    }
    const confidences = record.match(/\*\*Confidence: (MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW)\.\*\*/g) ?? [];
    assert.ok(confidences.length >= 6, 'each hypothesis must carry a confidence rating');

    // The disputed facts are marked UNVERIFIED rather than stated.
    assert.ok(record.includes('**UNVERIFIED.**'), 'unverified facts must be labelled');
    const unverifiedSection = record.slice(record.indexOf('## 9. Facts that remain unverified'));
    assert.ok(unverifiedSection.includes('401'), 'the 401/403 ambiguity must be listed as unverified');
    assert.ok(
      flat(unverifiedSection).includes('provisioning timestamp'),
      'the provisioning time must be listed as unverified'
    );

    // And the executive finding must not assert a single cause.
    const executive = flat(record.slice(record.indexOf('## 1. Executive finding'), record.indexOf('## 2.')));
    assert.ok(/cannot be determined/i.test(executive), 'the executive finding must admit the limit');
    assert.ok(/UNVERIFIED/.test(executive), 'and use the governed label');
  });

  it('W06-I04: the recommendation is NOT READY and names the exact blocker', () => {
    const text = flat(repoText(REPORT));
    assert.ok(text.includes('NOT READY'), 'the recommendation must be NOT READY');
    // Every mention of readiness is negated: "NOT READY" may contain "READY", so the negation must
    // be checked, not the bare word.
    const readinessClaims = text.match(/.{0,12}READY for one further/gi) ?? [];
    assert.ok(readinessClaims.length > 0, 'the readiness decision must be stated in terms of one further request');
    for (const claim of readinessClaims) {
      assert.match(claim, /NOT READY for one further/i, `readiness must stay negative: "${claim}"`);
    }
    assert.ok(text.includes('Exact blocker'), 'the blocker must be named exactly');
    assert.ok(
      text.includes('does not authorise vendor egress'),
      'the recommendation must disclaim authority to make vendor calls'
    );
  });

  it('W06-I05: the future procedure is marked as a plan only', () => {
    const record = repoText(REPORT);
    const section = record.slice(record.indexOf('## 11. Proposed single-request'));
    const heading = flat(record.split('\n').find((l) => l.includes('## 11. Proposed single-request')) ?? '');
    assert.ok(/PLAN ONLY/.test(heading), 'the procedure heading must say it is a plan only');
    assert.ok(/NOT EXECUTED/.test(heading), 'and that it was not executed');
    assert.ok(/has been executed|did not execute|none below has been executed/i.test(flat(section)) ||
      flat(section).includes('Nothing below has been executed'), 'the body must repeat that it was not run');
  });

  it('W06-I06: the report makes no secret-bearing content and no vendor call', () => {
    const record = repoText(REPORT);

    // No credential-ish material.
    assert.ok(!record.includes('eyJ'), 'no JWT may appear');
    assert.strictEqual(record.replace(/`/g, '').match(/vault:\/\/[A-Za-z0-9]/g), null, 'no vault pointer');
    assert.ok(!record.includes('dhan-secrets'), 'no store directory');
    assert.ok(!record.includes('dhan-client-id.carrier') && !record.includes('dhan-access-token.carrier'));
    assert.ok(!/H:\\\\IIPS/.test(record), 'no carrier root path');
    // No request/response header dump: the header may be NAMED, and may be shown as the code expression
    // that fills it, but never with a literal value.
    const headerUses = record.match(/'access-token':\s*(\S+)/g) ?? [];
    for (const use of headerUses) {
      assert.match(
        use,
        /'access-token':\s*(?:credentials\.accessToken|<[^>]*>)[`,. ]*$/,
        `the access-token header must never carry a literal value: "${use}"`
      );
    }
    assert.ok(headerUses.length > 0, 'the report should show where the header is constructed');

    // The safety footer must assert the vendor-call prohibition.
    assert.ok(flat(record).includes('No HTTP request was made to Dhan'), 'the safety footer must state it');
    assert.ok(flat(record).includes('W-06 remains OPEN'), 'and that W-06 stays open');
    assert.ok(flat(record).includes('M1 remains NOT ACHIEVED'), 'and that M1 stays unmet');
  });

  it('W06-I07: both defects the report identified are now corrected in the source', () => {
    const client = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_api_client.ts'),
      'utf8'
    );

    // The classification the report reasoned from is still exactly as recorded…
    const mapping = /public static mapHttpStatus[\s\S]*?\n  }/.exec(client);
    assert.ok(mapping, 'mapHttpStatus must exist');
    assert.ok(
      /status === 401 \|\| status === 403/.test(mapping[0]),
      'AUTHENTICATION_FAILURE must still be produced only for 401/403'
    );
    assert.ok(/httpStatus: status/.test(mapping[0]), 'the vendor status is still carried on the failure');

    // …and defect 1 has since been corrected: the boundary now emits the vendor status.
    const http = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_market_data_http.ts'),
      'utf8'
    );
    assert.ok(
      /vendorHttpStatus/.test(http),
      'the daemon must now surface the vendor status (W-06 correction A)'
    );
    assert.ok(
      !/sendError\(res, status, result\.failure\.code, result\.failure\.message\);/.test(http),
      'the corrected call site must pass the diagnostic, not drop it'
    );

    // Defect 2 has also been corrected: the expiry call sites no longer hand a possibly zone-less
    // string to `Date.parse`, which reads it as host-local time.
    const resolver = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_local_vault_resolver.ts'),
      'utf8'
    );
    for (const [name, source] of [['api client', client], ['resolver', resolver]] as const) {
      assert.ok(
        /parseStrictUtcTimestamp/.test(source),
        `the ${name} must parse expiry with the strict UTC parser`
      );
      assert.strictEqual(
        /Date\.parse\(\s*(?:ref|record|credentials)\.expiresAt\s*\)/.test(source),
        false,
        `the ${name} must not parse an expiry with Date.parse any more`
      );
    }

    // AUTHENTICATION_FAILURE must still be non-transient, or the report's retry argument breaks.
    const controls = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_operational_controls.ts'),
      'utf8'
    );
    const transient = /const TRANSIENT_CODES[^=]*=\s*new Set\(\[([\s\S]*?)\]\)/.exec(controls);
    assert.ok(transient, 'TRANSIENT_CODES must exist');
    assert.ok(
      !/AUTHENTICATION_FAILURE/.test(transient[1] ?? ''),
      'AUTHENTICATION_FAILURE must remain non-transient'
    );
  });

  it('W06-I08: the report is consistent with the recovery record it cites', () => {
    const report = flat(repoText(REPORT));
    const recovery = flat(repoText(RECOVERY));
    // Both must treat local resolution as local, and the recovery record must be the authority cited.
    assert.ok(report.includes('LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md'));
    assert.ok(recovery.includes('Layer A — local transport') || recovery.includes('Layer A'));
    assert.ok(report.includes('Layer A') || report.includes('local transport authentication'));
    // Neither may upgrade the local recovery into a vendor claim.
    assert.strictEqual(
      report.match(/local (?:transport )?recovery (?:proves|confirms) (?:Dhan|vendor)/i),
      null,
      'the local recovery must not be promoted into a vendor claim'
    );
  });
});
