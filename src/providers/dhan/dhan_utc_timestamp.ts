/**
 * Institutional Investment Platform System (IIPS)
 * Strict UTC timestamp parsing for Dhan credential expiry metadata (W-06).
 *
 * WHY THIS EXISTS
 * The expiry checks used `Date.parse`, which accepts a timestamp with **no timezone designator**
 * and silently interprets it in the *host's* local time. On a host east of UTC that reads the
 * expiry as later than it is, so a credential that had already expired could pass the local
 * pre-flight and be sent to the vendor; on a host west of UTC the opposite error rejects a valid
 * credential early. Either way the result depended on where the daemon ran, while every message
 * asserted UTC semantics.
 *
 * This module makes the contract explicit and host-independent:
 *   - an explicit designator (`Z` or a numeric offset) is **required**;
 *   - a zone-less value is rejected rather than silently assumed to be UTC or local;
 *   - the calendar fields are validated as written, so `2026-02-30` is refused (V8's `Date.parse`
 *     rolls it over to 2 March);
 *   - the offset must be a real-world offset, so `+25:00` and `+05:60` are refused;
 *   - the instant is computed arithmetically from the written fields and the offset, so the answer
 *     does not depend on `process.env.TZ`.
 *
 * Nothing here appends `Z` to a zone-less value: silently reinterpreting operator configuration is
 * exactly the failure mode this replaces.
 *
 * This module contains NO credentials and performs NO I/O.
 */

/**
 * Explicit-timezone ISO-8601 timestamp.
 *
 * `YYYY-MM-DDTHH:MM:SS[.sss]` followed by either `Z` or `±HH:MM`. Fractional seconds accept 1-3
 * digits, matching the precision the provisioning path writes. A bare `±HH` offset is refused
 * because the existing contract and every stored value use the `±HH:MM` form.
 */
const EXPLICIT_ZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

/** Largest real-world UTC offset: +14:00 (and its negative). Nothing beyond it exists. */
const MAX_OFFSET_HOURS = 14;

export type UtcTimestampRejection =
  | 'NOT_A_STRING'
  | 'NO_EXPLICIT_TIMEZONE'
  | 'MALFORMED'
  | 'IMPOSSIBLE_CALENDAR_DATE'
  | 'INVALID_OFFSET';

export type UtcTimestampParse =
  | { readonly ok: true; readonly epochMs: number }
  | { readonly ok: false; readonly reason: UtcTimestampRejection };

/**
 * A timestamp shape with the timezone omitted.
 *
 * Used only to choose the right *rejection reason* — never to accept a value. Reduced precision is
 * tolerated here on purpose: an operator who forgets the designator is the realistic mistake, and
 * "you omitted the timezone" is a far more useful diagnosis than "malformed". Nothing matching this
 * pattern is ever accepted.
 */
const ZONELESS_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?$/

/**
 * True when the value looks like a timestamp that simply has no timezone designator.
 *
 * Kept separate from "has some zone-ish suffix" so that a genuinely unrecognisable string is
 * reported as MALFORMED rather than being blamed on a missing timezone.
 */
function looksZoneless(value: string): boolean {
  return ZONELESS_PATTERN.test(value);
}

/**
 * Parses an expiry timestamp that MUST carry an explicit timezone.
 *
 * Returns the absolute instant in epoch milliseconds, or a typed rejection. The rejection reasons
 * are safe to report: they describe the *shape* of the value, never its content.
 */
export function parseStrictUtcTimestamp(value: unknown): UtcTimestampParse {
  if (typeof value !== 'string') return { ok: false, reason: 'NOT_A_STRING' };

  const match = EXPLICIT_ZONE_PATTERN.exec(value);
  if (!match) {
    // Distinguish "the operator forgot the zone" from "the value is not a timestamp at all":
    // the first is the defect this correction is about, and the two need different fixes.
    return looksZoneless(value)
      ? { ok: false, reason: 'NO_EXPLICIT_TIMEZONE' }
      : { ok: false, reason: 'MALFORMED' };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  // `.5` means 500 ms, not 5 ms: pad to milliseconds before converting.
  const millis = match[7] === undefined ? 0 : Number(match[7].padEnd(3, '0'));

  // Reject impossible calendar values as written. `Date.UTC` normalises 2026-02-30 to 2026-03-02,
  // so a round-trip comparison is the only way to prove the fields were real.
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const roundTrip = new Date(asUtc);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day ||
    roundTrip.getUTCHours() !== hour ||
    roundTrip.getUTCMinutes() !== minute ||
    roundTrip.getUTCSeconds() !== second ||
    roundTrip.getUTCMilliseconds() !== millis
  ) {
    return { ok: false, reason: 'IMPOSSIBLE_CALENDAR_DATE' };
  }

  const zone = match[8] as string;
  let offsetMinutes = 0;
  if (zone !== 'Z') {
    const sign = zone.startsWith('-') ? -1 : 1;
    const offsetHours = Number(zone.slice(1, 3));
    const offsetMins = Number(zone.slice(4, 6));
    if (offsetMins > 59) return { ok: false, reason: 'INVALID_OFFSET' };
    if (offsetHours > MAX_OFFSET_HOURS) return { ok: false, reason: 'INVALID_OFFSET' };
    // +14:00 is the largest real offset; +14:30 does not exist.
    if (offsetHours === MAX_OFFSET_HOURS && offsetMins !== 0) return { ok: false, reason: 'INVALID_OFFSET' };
    offsetMinutes = sign * (offsetHours * 60 + offsetMins);
  }

  // The written fields are the instant as seen at the stated offset, so subtract the offset to get
  // the UTC instant. Pure arithmetic: `Date.UTC` above already fixed the calendar in UTC terms, and
  // no local-timezone accessor is involved anywhere in this function.
  return { ok: true, epochMs: asUtc - offsetMinutes * 60_000 };
}

/** Convenience predicate for call sites that only need "is this acceptable?". */
export function isStrictUtcTimestamp(value: unknown): boolean {
  return parseStrictUtcTimestamp(value).ok;
}

/**
 * Operator-safe explanation of a rejection. Contains no part of the value: an expiry is metadata
 * rather than a secret, but echoing a malformed value risks reproducing an accidentally pasted
 * credential, so only the shape is described.
 */
export function describeUtcTimestampRejection(reason: UtcTimestampRejection): string {
  switch (reason) {
    case 'NOT_A_STRING':
      return 'is not a string';
    case 'NO_EXPLICIT_TIMEZONE':
      return 'has no explicit timezone designator (a trailing Z or a numeric offset such as +05:30 is required)';
    case 'MALFORMED':
      return 'is not an ISO-8601 timestamp of the form YYYY-MM-DDTHH:MM:SS[.sss]Z or ±HH:MM';
    case 'IMPOSSIBLE_CALENDAR_DATE':
      return 'is not a real calendar date/time';
    case 'INVALID_OFFSET':
      return 'has an invalid UTC offset (the largest real offset is +14:00)';
  }
}
