/**
 * W-06 — two-request authentication attempt: blocked execution record.
 *
 * Record: docs/integration/DHAN-W06-TWO-REQUEST-AUTHENTICATION-EVIDENCE-2026-11-13.md
 *
 * WHY THIS SUITE EXISTS
 * That record says something unusual: an authorized vendor attempt did not happen. A document making
 * that claim is only trustworthy if it is (a) consistent with the mechanical reason, (b) does not
 * quietly smuggle in a credential verdict, and (c) cannot silently become false later. These tests
 * pin all three.
 *
 * The mechanical reason is the platform gate: the Windows DPAPI backend refuses live resolution off
 * `win32`, and the operator's carriers are user-scope — so no stand-in environment can substitute.
 * That gate is production behaviour, and it is what makes "blocked" the correct outcome rather than
 * an excuse. It is asserted here against the real backend.
 *
 * No vendor interaction of any kind occurs in this file. The backend probe reads no carrier and
 * decrypts nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { WindowsDpapiHostVaultBackend } from '../src/providers/dhan/dhan_dpapi_vault_backend.js';

const RECORD = 'docs/integration/DHAN-W06-TWO-REQUEST-AUTHENTICATION-EVIDENCE-2026-11-13.md';

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function flat(text: string): string {
  // Collapse whitespace and drop emphasis/code markers so assertions survive rewrapping.
  return text.replace(/\s+/g, ' ').replace(/[*`]/g, '');
}

describe('W-06 two-request attempt — blocked execution record', () => {
  it('W06T-01: the production DPAPI backend refuses live resolution off Windows', () => {
    // This is the mechanical blocker, asserted against the real backend rather than a stub.
    const backend = new WindowsDpapiHostVaultBackend({ carrierDirectory: 'C:\\IIPS\\dhan-secrets' });
    const readiness = backend.describeReadiness();

    assert.strictEqual(readiness.backendId, 'WINDOWS_DPAPI_USER_SCOPE');
    assert.strictEqual(
      readiness.liveResolutionSupported,
      process.platform === 'win32',
      'live resolution must be supported on Windows only'
    );

    if (process.platform !== 'win32') {
      assert.strictEqual(readiness.liveResolutionSupported, false);
      assert.match(
        String(readiness.prerequisiteSummary),
        /only available on the Windows platform/i,
        'the refusal must name the platform as the reason'
      );
    }

    // The backend is user-scope: the material is bound to one Windows profile, so a different machine
    // (including a cloud Windows runner) could not decrypt it even if the carriers were copied.
    assert.strictEqual(
      readiness.backendId,
      'WINDOWS_DPAPI_USER_SCOPE',
      'user scope is why no stand-in environment can substitute'
    );
  });

  it('W06T-02: the record states zero requests were made and classifies no vendor outcome', () => {
    const record = flat(repoText(RECORD));

    // The headline claim, stated positively.
    assert.ok(record.includes('ZERO of the two authorized vendor requests were made'));
    assert.ok(record.includes('BLOCKED'));

    // Both requests must be recorded as not made, not as failures with statuses.
    assert.ok(record.includes('NOT ISSUED') || record.includes('not made'));
    assert.ok(record.includes('Request 1 — dispatch outcome'), 'each request must have a row');
    assert.ok(record.includes('NOT DISPATCHED'));

    // And the absence of a verdict must be explicit.
    assert.ok(record.includes('No inference about the credentials is drawn'));
    assert.ok(record.includes('M1') && record.includes('NOT ACHIEVED'));
  });

  it('W06T-03: the record never claims a vendor authentication result', () => {
    const record = flat(repoText(RECORD));

    // A blocked attempt must not be narrated as an authentication event.
    for (const forbidden of [
      /Dhan (?:accepted|rejected) (?:the )?credentials/i,
      /authentication (?:succeeded|failed) at (?:the )?vendor/i,
      /vendor (?:returned|responded with) 40[13]/i,
      /(?:401|403) (?:was )?(?:observed|received|captured)/i,
    ]) {
      assert.strictEqual(record.match(forbidden), null, `the record must not assert: ${forbidden.source}`);
    }

    // "403" and "401" may appear only as the *interpretation matrix* for a future attempt, so they
    // must be accompanied by that framing rather than a past-tense observation.
    assert.ok(
      record.includes('401') && record.includes('403'),
      'the record should still explain what those statuses would have meant'
    );
    assert.ok(
      /(?:would|will) (?:mean|carry)/i.test(record) || record.includes('remains unanswered'),
      'their mention must be prospective, not reported'
    );
  });

  it('W06T-04: the record does not present local readiness as vendor authentication', () => {
    const record = flat(repoText(RECORD));

    // The standing prohibition, restated in the record itself.
    assert.ok(
      record.includes('Local daemon health, CREDENTIALS_RESOLVED, DPAPI READY') ||
        record.includes('incapable of testifying to vendor authentication'),
      'the record must keep local readiness separate from vendor authentication'
    );
    for (const forbidden of [
      /CREDENTIALS_RESOLVED (?:proves|confirms|demonstrates) (?:Dhan|vendor)/i,
      /DPAPI READY (?:proves|confirms)/i,
      /health (?:200 )?(?:proves|confirms) (?:Dhan|vendor) authentication/i,
    ]) {
      assert.strictEqual(record.match(forbidden), null, `must not claim: ${forbidden.source}`);
    }
  });

  it('W06T-05: the record carries no secret-bearing or vendor-body content', () => {
    const record = repoText(RECORD);

    assert.ok(!record.includes('eyJ'), 'no JWT may appear');
    assert.strictEqual(record.replace(/`/g, '').match(/vault:\/\/[A-Za-z0-9]/g), null, 'no vault pointer');
    assert.ok(!record.includes('dhan-access-token.carrier') && !record.includes('dhan-client-id.carrier'));
    assert.ok(!record.includes('DH-901'), 'no vendor error code');
    assert.strictEqual(
      record.match(/authorization:\s*Bearer\s+\S/),
      null,
      'no authorization header value may appear'
    );
    // The carrier path is named only as a demonstration that it is absent; it must not be a real value.
    assert.ok(
      !/C:\\\\IIPS\\\\[A-Za-z0-9]{8,}/.test(record),
      'no real carrier path beyond the documented example directory'
    );

    // The safety footer must assert the prohibitions held.
    assert.ok(flat(record).includes('Zero HTTP requests were made to Dhan'));
    assert.ok(flat(record).includes('W-06 remains OPEN'));
    assert.ok(flat(record).includes('M1 remains NOT ACHIEVED'));
  });

  it('W06T-06: the record documents the reconciliation honestly and losslessly', () => {
    const record = flat(repoText(RECORD));

    // The HEAD discrepancy must be reported, not glossed: the work item required it.
    assert.ok(record.includes('a624d06'), 'the unexpected starting HEAD must be named');
    assert.ok(record.includes('9d8c920'), 'and the reconciled HEAD');
    assert.ok(record.includes('byte-identical'));
    assert.ok(/no content lost/i.test(record), 'the losslessness claim must be stated');

    // The summary table is where a reader looks first, so the discrepancy must be visible THERE —
    // not only deep in a section a hurried reader might skip.
    assert.ok(
      /HEAD verified \| [^|]*(?:a624d06|differ|not match|\?|⚠)/i.test(record),
      'the summary table must show the HEAD discrepancy, not report a clean match'
    );
    // …and it must never claim a clean HEAD match outright.
    assert.strictEqual(
      record.match(/HEAD verified \| [^|]*as expected(?! [—-])/i) &&
        !/HEAD verified \| [^|]*was /i.test(record),
      null,
      'the summary must not claim the HEAD matched without recording that it did not'
    );
    // The dirty tree must be disclosed in the summary too: it is the reason a naive checkout looked
    // wrong, and a reader must not be told the tree was clean.
    assert.ok(
      /Working tree clean at attempt start \| [^|]*(?:dirty|59 entries)/i.test(record),
      'the summary table must disclose that the working tree was dirty'
    );
    assert.strictEqual(
      /Working tree clean at attempt start \| [^|]*✅ clean/i.test(record),
      false,
      'the summary must not report a clean tree'
    );

    // …and any destructive shortcut that is mentioned at all must be mentioned as something that was
    // NOT done. Absence is also acceptable: the record may simply never raise them.
    for (const shortcut of ['git reset --hard', 'force-push', 'git checkout -- .', '--hard']) {
      const at = record.indexOf(shortcut);
      if (at === -1) continue; // never mentioned — nothing was claimed about it
      const context = record.slice(Math.max(0, at - 200), at);
      assert.ok(
        /no |not |never |avoid|refus|without/i.test(context),
        `"${shortcut}" appears but not in a negated context: …${record.slice(Math.max(0, at - 60), at + 40)}…`
      );
    }

    // At least one of them must be explicitly refuted, so the claim is on the record rather than
    // merely absent.
    assert.ok(
      /no force-push|no history rewrite|never writes files|no `?--hard`?/i.test(record),
      'the record must explicitly state which destructive shortcuts were avoided'
    );
  });

  it('W06T-07: the record names the prerequisites a real attempt still needs', () => {
    const record = flat(repoText(RECORD));

    // Without these, a future attempt repeats this block or fails for a foreseeable reason.
    assert.ok(/operator's Windows laptop/i.test(record), 'the correct host must be named');
    assert.ok(record.includes('WINDOWS_DPAPI_USER_SCOPE') || record.includes('user scope'));
    assert.ok(record.includes('IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT'), 'the zoned-expiry requirement');
    assert.ok(/fresh operator authorization/i.test(record), 'a spent authorization must not be reused');
    assert.ok(record.includes('vendorHttpStatus'), 'the diagnostic that makes the attempt interpretable');
  });
});
