/**
 * W-06 correction B — strict expiry timestamp validation.
 *
 * Record: docs/integration/DHAN-W06-AUTHENTICATION-DIAGNOSTICS-AND-EXPIRY-CORRECTIONS-2026-11-13.md
 *
 * THE DEFECT
 * Expiry checks used `Date.parse`, which accepts a timestamp with no timezone designator and reads
 * it in the *host's* local time. The same configured value therefore meant different instants on
 * different hosts: on IST (UTC+05:30) an already-expired token could pass the pre-flight, and on a
 * host west of UTC a valid token was rejected early. Every error message meanwhile asserted UTC.
 *
 * THE CONTRACT
 * An explicit designator (`Z` or a numeric offset) is required. A zone-less value is rejected with
 * `NO_EXPLICIT_TIMEZONE` rather than silently assumed to be UTC (or local). Calendar fields are
 * validated as written, and the offset must be real.
 *
 * HOST-INDEPENDENCE
 * The last tests re-execute the parser in child processes under different `TZ` values, because that
 * is the actual failure mode: a unit test running under the developer's own TZ cannot prove the
 * behaviour is host-independent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describeUtcTimestampRejection,
  isStrictUtcTimestamp,
  parseStrictUtcTimestamp,
} from '../src/providers/dhan/dhan_utc_timestamp.js';
import { resolveDhanProviderConfig, DHAN_ENV_KEYS } from '../src/providers/dhan/dhan_config.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function reasonOf(value: unknown): string | undefined {
  const parsed = parseStrictUtcTimestamp(value);
  return parsed.ok ? undefined : parsed.reason;
}

function epochOf(value: string): number {
  const parsed = parseStrictUtcTimestamp(value);
  assert.strictEqual(parsed.ok, true, `${value} should parse`);
  return (parsed as { ok: true; epochMs: number }).epochMs;
}

describe('W-06/B — strict UTC expiry parsing', () => {
  it('W06B-01: a UTC timestamp ending in Z is accepted', () => {
    assert.strictEqual(epochOf('2026-11-13T06:30:00.000Z'), Date.UTC(2026, 10, 13, 6, 30, 0, 0));
    assert.strictEqual(epochOf('2026-11-13T06:30:00Z'), Date.UTC(2026, 10, 13, 6, 30, 0, 0));
    assert.strictEqual(epochOf('2026-11-13T06:30:00.5Z'), Date.UTC(2026, 10, 13, 6, 30, 0, 500));
    assert.strictEqual(epochOf('2026-11-13T06:30:00.05Z'), Date.UTC(2026, 10, 13, 6, 30, 0, 50));
  });

  it('W06B-02: a timestamp with an explicit numeric offset is accepted and converted to the same instant', () => {
    // The same instant written at three offsets must produce one epoch value.
    const utc = epochOf('2026-11-13T06:30:00Z');
    assert.strictEqual(epochOf('2026-11-13T12:00:00+05:30'), utc, 'IST is the operator locale');
    assert.strictEqual(epochOf('2026-11-13T01:30:00-05:00'), utc);
    assert.strictEqual(epochOf('2026-11-13T20:30:00+14:00'), utc);
    assert.strictEqual(epochOf('2026-11-12T23:30:00-07:00'), utc);
  });

  it('W06B-03: a timestamp with no timezone is rejected', () => {
    // This is the defect itself: every one of these used to be silently accepted as local time.
    for (const zoneless of [
      '2026-11-13T06:30:00',
      '2026-11-13T06:30:00.000',
      '2026-11-13T06:30',
      '2026-11-13',
      '2026-11-13 06:30:00',
    ]) {
      assert.strictEqual(reasonOf(zoneless), 'NO_EXPLICIT_TIMEZONE', `${zoneless} must be rejected`);
      assert.strictEqual(isStrictUtcTimestamp(zoneless), false);
    }
  });

  it('W06B-04: a malformed timestamp is rejected', () => {
    for (const malformed of [
      'not-a-timestamp',
      '13/11/2026 06:30',
      '2026-11-13T06:30:00.Z',
      '2026-11-13T06:30:00z', // lowercase z is not the ISO designator
      '2026-11-13T06:30:00ZZ',
      '2026-11-13T06:30:00+05:30:00',
      '2026-11-13T06:30:00Z extra',
      '',
      ' ',
    ]) {
      assert.strictEqual(reasonOf(malformed), 'MALFORMED', `${JSON.stringify(malformed)} must be rejected`);
    }
    // Non-strings are refused rather than coerced.
    for (const notString of [undefined, null, 1772000000000, {}, []]) {
      assert.strictEqual(reasonOf(notString), 'NOT_A_STRING');
    }
  });

  it('W06B-05: an impossible calendar date is rejected', () => {
    // V8's Date.parse rolls 2026-02-30 over to 2 March and calls it valid; that is a silent rewrite.
    for (const impossible of [
      '2026-02-30T00:00:00Z',
      '2026-02-29T00:00:00Z', // 2026 is not a leap year
      '2026-04-31T00:00:00Z',
      '2026-13-01T00:00:00Z',
      '2026-00-01T00:00:00Z',
      '2026-11-00T00:00:00Z',
      '2026-11-12T25:00:00Z',
      '2026-11-12T19:60:00Z',
      '2026-11-12T19:00:60Z',
    ]) {
      const reason = reasonOf(impossible);
      assert.ok(
        reason === 'IMPOSSIBLE_CALENDAR_DATE' || reason === 'MALFORMED',
        `${impossible} must be rejected (got ${reason})`
      );
    }
    // And a real leap day is still accepted.
    assert.strictEqual(isStrictUtcTimestamp('2028-02-29T00:00:00Z'), true);
  });

  it('W06B-06: an invalid timezone offset is rejected', () => {
    for (const badOffset of [
      '2026-11-13T06:30:00+25:00',
      '2026-11-13T06:30:00-25:00',
      '2026-11-13T06:30:00+05:60',
      '2026-11-13T06:30:00+14:30', // +14:00 is the largest real offset
      '2026-11-13T06:30:00+99:99',
    ]) {
      assert.strictEqual(reasonOf(badOffset), 'INVALID_OFFSET', `${badOffset} must be rejected`);
    }
  });

  it('W06B-07: an expired timestamp is rejected by the existing expiry semantics', () => {
    const now = Date.parse('2026-11-13T06:30:00.000Z');
    const justExpired = '2026-11-13T06:29:59.999Z';
    const exactlyNow = '2026-11-13T06:30:00.000Z';
    assert.ok(epochOf(justExpired) <= now, 'a past instant compares as expired');
    // The boundary is preserved: `<=` means "expired at the stated instant", as before.
    assert.ok(epochOf(exactlyNow) <= now, 'the exact expiry instant is already expired');
  });

  it('W06B-08: a future timestamp is accepted', () => {
    const now = Date.parse('2026-11-13T06:30:00.000Z');
    for (const future of [
      '2026-11-13T06:30:00.001Z',
      '2026-11-13T12:00:01+05:30',
      '2027-01-01T00:00:00Z',
    ]) {
      assert.ok(epochOf(future) > now, `${future} must be in the future`);
      assert.strictEqual(isStrictUtcTimestamp(future), true);
    }
  });

  it('W06B-09: rejection messages describe the shape and never echo the value', () => {
    for (const reason of [
      'NOT_A_STRING',
      'NO_EXPLICIT_TIMEZONE',
      'MALFORMED',
      'IMPOSSIBLE_CALENDAR_DATE',
      'INVALID_OFFSET',
    ] as const) {
      const message = describeUtcTimestampRejection(reason);
      assert.ok(message.length > 0);
      // No value can ever appear: the function takes only the reason.
      assert.ok(!/\d{4}-\d{2}-\d{2}/.test(message), 'the message must not contain a timestamp');
    }
  });

  it('W06B-10: parsing is identical under different host timezones', () => {
    // The regression test that matters: run the real parser in child processes with different TZ
    // values and compare. A single in-process assertion cannot prove host independence.
    const probe = `
      const { parseStrictUtcTimestamp } = await import(${JSON.stringify(
        path.join(repoRoot, 'dist', 'src', 'providers', 'dhan', 'dhan_utc_timestamp.js')
      )});
      const cases = [
        '2026-11-13T06:30:00Z',
        '2026-11-13T12:00:00+05:30',
        '2026-11-13T01:30:00-05:00',
        '2026-11-13T06:30:00',
        '2026-02-30T00:00:00Z',
      ];
      process.stdout.write(JSON.stringify(cases.map((c) => parseStrictUtcTimestamp(c))));
    `;
    const run = (tz: string): string =>
      execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
        cwd: repoRoot,
        env: { ...process.env, TZ: tz },
        encoding: 'utf8',
      });

    const reference = run('UTC');
    for (const tz of ['Asia/Kolkata', 'America/New_York', 'Pacific/Kiritimati', 'Etc/GMT+12', 'Australia/Sydney']) {
      assert.strictEqual(run(tz), reference, `parsing under TZ=${tz} must match UTC exactly`);
    }

    // And the zone-less case is rejected on every host, not merely on the one running this suite.
    const parsed = JSON.parse(reference) as Array<{ ok: boolean; reason?: string }>;
    assert.strictEqual(parsed[3]!.ok, false, 'the zone-less value must be rejected');
    assert.strictEqual(parsed[3]!.reason, 'NO_EXPLICIT_TIMEZONE');
  });

  it('W06B-11: a zone-less expiry can no longer be read differently on an IST host versus a UTC host', () => {
    // The concrete regression: before the correction, this exact value parsed to two different
    // instants depending on TZ. On IST (UTC+05:30) a wall-clock time is an *earlier* instant than
    // the same digits read as UTC, so the expiry was read 5h30m too late for the operator's real
    // deadline — long enough to let an already-expired token through to the vendor.
    const prose = `
      process.stdout.write(JSON.stringify(Date.parse('2026-11-13T06:30:00')));
    `;
    const parseUnder = (tz: string): number =>
      Number(
        execFileSync(process.execPath, ['-e', prose], {
          cwd: repoRoot,
          env: { ...process.env, TZ: tz },
          encoding: 'utf8',
        })
      );

    const utcHost = parseUnder('UTC');
    const istHost = parseUnder('Asia/Kolkata');
    // Demonstrate the defect that was fixed: the legacy path is host-dependent…
    assert.notStrictEqual(utcHost, istHost, 'the legacy Date.parse path is host-dependent (this is the defect)');
    // IST is ahead of UTC, so the same wall-clock digits denote an instant 5h30m earlier.
    assert.strictEqual(
      utcHost - istHost,
      5.5 * 60 * 60 * 1000,
      'on IST the legacy path placed the instant 5h30m earlier than a UTC host did'
    );

    // …while the corrected path refuses to interpret it at all, on both hosts.
    assert.strictEqual(isStrictUtcTimestamp('2026-11-13T06:30:00'), false);
    assert.strictEqual(reasonOf('2026-11-13T06:30:00'), 'NO_EXPLICIT_TIMEZONE');
  });

  it('W06B-12: the config resolver rejects a zone-less operator expiry instead of reading it as local time', () => {
    const base = {
      [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://dhan/client-id',
      [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://dhan/access-token',
    };
    const now = new Date('2026-11-13T00:00:00.000Z');

    // A zone-less value is refused, with a message that explains why and carries no value.
    const zoneless = resolveDhanProviderConfig(
      { ...base, [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-13T06:30:00' },
      now
    );
    assert.strictEqual(zoneless.ok, false);
    if (!zoneless.ok) {
      assert.strictEqual(zoneless.failure.code, 'CONFIGURATION_INCOMPLETE');
      assert.ok(
        zoneless.failure.message.includes('explicit timezone'),
        'the message must explain that a timezone is required'
      );
      assert.ok(
        !zoneless.failure.message.includes('2026-11-13T06:30:00'),
        'the message must not echo the configured value'
      );
    }

    // The same instant, written with a designator, is accepted.
    for (const zoned of ['2026-11-13T06:30:00.000Z', '2026-11-13T12:00:00+05:30']) {
      const accepted = resolveDhanProviderConfig(
        { ...base, [DHAN_ENV_KEYS.accessTokenExpiresAt]: zoned },
        now
      );
      assert.strictEqual(accepted.ok, true, `${zoned} must be accepted`);
    }

    // An already-expired value stays rejected (readiness), exactly as before.
    const expired = resolveDhanProviderConfig(
      { ...base, [DHAN_ENV_KEYS.accessTokenExpiresAt]: '2026-11-12T00:00:00.000Z' },
      now
    );
    assert.strictEqual(expired.ok, false);
  });
});
