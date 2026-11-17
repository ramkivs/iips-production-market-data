# DHAN W-06 — Authentication Diagnostics and Expiry Validation Corrections (2026-11-13)

**Status:** IMPLEMENTATION RECORD — two local defects corrected, tested and published.
**Starting commit:** `1fded9d3fb75df99e9c008176ecc6407645ceb70`
**Branch:** `arena/84d1e063-iips-production-market-data`
**Roadmap authority:** IRR, `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` v1.1, W-06 (read-only; not modified).
**No vendor request was made in this work item.** Nothing here authorises one.

---

## 1. The two defects and where they came from

Both were found by the read-only investigation recorded in
`DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md` (§7.1/§7.4 and §6.3 respectively). That
report diagnosed the observed Dhan `AUTHENTICATION_FAILURE` and concluded that the request path itself
was sound; the two genuine defects it found were in *diagnosability*, not in authentication.

### Defect A — the vendor status was destroyed before the operator could see it

`DhanApiClient.mapHttpStatus` classified a vendor `401` and a vendor `403` identically as
`AUTHENTICATION_FAILURE` and attached the numeric status to `DhanFailure.httpStatus`. That status then
survived the service layer (`dhan_market_data_service.ts:216`) and the refresh outcome
(`dhan_operational_controls.ts:356`) — and was dropped at the HTTP boundary, where `sendError` wrote
only `{ code, message }`.

The consequence was not academic. Three different operator remedies — regenerate the token, correct
the Client-ID/token pairing, confirm entitlement — all produce the same `502` and the same message, so
a second controlled request would have been as undiagnosable as the first.

### Defect B — `Date.parse` read zone-less expiry metadata as *host-local* time

Expiry metadata was parsed with `Date.parse`, which accepts a timestamp with no timezone designator
and interprets it in the host's local time. On a host east of UTC this made the local pre-flight
**too lenient** — an already-expired token could pass the check and be sent to the vendor. On a host
west of UTC a valid token was rejected early. The operator's host is IST (UTC+05:30), which is exactly
the dangerous direction. Every error message meanwhile asserted UTC.

Demonstrated in this sandbox before the correction:

```text
TZ=UTC              Date.parse("2026-11-13T06:30:00") -> 2026-11-13T06:30:00Z
TZ=Asia/Kolkata     Date.parse("2026-11-13T06:30:00") -> 2026-11-13T01:00:00Z   (5h30m earlier)
```

---

## 2. Files and functions changed

| File | Change |
| --- | --- |
| `src/providers/dhan/dhan_utc_timestamp.ts` | **New.** `parseStrictUtcTimestamp`, `isStrictUtcTimestamp`, `describeUtcTimestampRejection`. Requires an explicit designator; validates calendar fields and offsets arithmetically. |
| `src/providers/dhan/dhan_market_data_http.ts` | `ErrorBody` gains `error.vendorHttpStatus`; `sendError` gains an optional 5th parameter; the provider-failure call site passes it via a `VENDOR_STATUS_BEARING_CODES` allowlist. `MarketDataTransportFailure` gains a documented `vendorHttpStatus`; `parseErrorPayload` validates and reads it. |
| `src/server/market-data/dhanMarketDataRoute.ts` | `DhanMarketDataRouteFailure` gains `vendorHttpStatus` (type/documentation only; the value already flowed through). |
| `src/providers/dhan/dhan_api_client.ts` | Both expiry checks now use `parseStrictUtcTimestamp`. |
| `src/providers/dhan/dhan_local_vault_resolver.ts` | Both expiry checks (`ref`, `record`) now use `parseStrictUtcTimestamp`. |
| `src/providers/dhan/dhan_config.ts` | `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` is rejected when it carries no explicit timezone; the readiness comparison uses the parsed instant. |

Untouched, deliberately: the DPAPI backend, the carrier format, the transport (`dhan_server_egress.ts`),
the retry/timeout arithmetic, the failure taxonomy, the authentication classification, and the loopback
auth gate.

---

## 3. The new operator-facing diagnostic contract

A provider failure that came from a **vendor HTTP response** now answers:

```json
{ "error": { "code": "AUTHENTICATION_FAILURE",
             "message": "Dhan rejected the request credentials",
             "vendorHttpStatus": 403 } }
```

| Property | Value |
| --- | --- |
| Field name | `error.vendorHttpStatus` |
| Type | integer ≥ 1. Never a string, never a float, never null |
| Present when | the failure was produced by interpreting a vendor response (allowlist in §4) |
| Absent when | credential, configuration, production-guard, transport, rate-budget or pre-send timeout failures |
| Daemon HTTP status | **unchanged**: `502` for every non-rate-limited provider failure, `429` for `RATE_LIMITED` |
| Codes and messages | **unchanged** |

**Naming is load-bearing.** `httpStatus` already meant the *daemon's* status on
`MarketDataTransportFailure`, and the client exposes both:

```ts
outcome.failure.httpStatus       // 502 — what the local daemon answered
outcome.failure.vendorHttpStatus // 403 — what Dhan answered
```

Two facts, two fields. Collapsing them would have made "the daemon is reachable" indistinguishable
from "the vendor answered", which is the confusion the whole recovery record exists to prevent.

### 3.1 `/v1/freshness` — deliberately unchanged

The freshness projection was inspected and **left redacted**. `RefreshStatus.lastFailure` remains the
literal `{ code: 'REFRESH_FAILED', priorPreserved }`.

Freshness is a consumer-facing quality verdict (D-7), not an operator diagnostic surface. Its `200`
already means "the quality view was produced", and it is consumed by callers that have no business
learning vendor internals. Adding a vendor status there would also create a second, unauthenticated-by-
design channel for the same fact. The operator's error body is the correct single surface, and it is
already behind the loopback transport gate. Test `W06A-10` pins this decision.

---

## 4. Security boundary and redaction guarantees

| Guarantee | How it is enforced | Test |
| --- | --- | --- |
| Only a number is exposed | `Number.isInteger(x) && x > 0` at the writer, and again at the reader of an untrusted body | `W06A-09`, `W06A-12` |
| Vendor **body** never reflected | The body is never read into any failure; only `response.status` is used | `W06A-06` |
| Vendor error code/message never propagated | `mapHttpStatus` emits fixed IPD strings | `W06A-06` |
| Credentials, headers, tokens never echoed | Nothing secret enters the failure object; asserted by scanning the serialised body | `W06A-07` |
| No diagnostic before authentication | Field attached only at the post-authentication failure call site; gate stands first | `W06A-08` |
| No fabrication for non-vendor failures | `VENDOR_STATUS_BEARING_CODES` allowlist, tested with a deliberately bogus status | `W06A-05` |
| Loopback transport auth unweakened | No change to the gate, `tokenMatches`, or listener binding | `W06A-08` |
| Freshness redaction unchanged | No change to `dhan_freshness_status.ts` | `W06A-10` |

The allowlist is the part worth highlighting. A naive implementation would copy `failure.httpStatus`
unconditionally — which would have dressed a credential-resolution failure up with an HTTP status it
never received, manufacturing evidence of a request that was never made. Control C in §7 proves that
test catches exactly this.

---

## 5. Strict timestamp validation contract

`parseStrictUtcTimestamp(value)` returns either `{ ok: true, epochMs }` or
`{ ok: false, reason }` with one of five reasons.

| Input class | Result | Example |
| --- | --- | --- |
| Explicit `Z` | accepted | `2026-11-13T06:30:00.000Z` |
| Explicit numeric offset | accepted, converted to the same instant | `2026-11-13T12:00:00+05:30` |
| No timezone designator | **rejected** `NO_EXPLICIT_TIMEZONE` | `2026-11-13T06:30:00` |
| Malformed | rejected `MALFORMED` | `13/11/2026 06:30` |
| Impossible calendar date | rejected `IMPOSSIBLE_CALENDAR_DATE` | `2026-02-30T00:00:00Z` |
| Impossible offset | rejected `INVALID_OFFSET` | `+25:00`, `+05:60`, `+14:30` |
| Non-string | rejected `NOT_A_STRING` | `1772000000000` |

**Nothing is ever appended.** A zone-less value is refused, not silently reinterpreted as UTC — doing
otherwise would be the same class of silent rewrite the correction exists to remove, and would
reinterpret operator configuration without consent.

**Calendar validation is explicit** because `Date.parse` is worse than lenient here: it *rolls over*
`2026-02-30` to 2 March and reports success. The parser round-trips every computed field through
`Date.UTC` and compares, so an impossible date cannot masquerade as a valid one.

**Offset validation** accepts up to `+14:00` and rejects a non-zero minute component at the maximum,
because `+14:30` is not a real offset.

**Host independence** is not an assumption: the instant is computed arithmetically
(`Date.UTC(...) - offsetMinutes × 60 000`) with no local-timezone accessor anywhere in the module.
`W06B-10` proves it by re-running the compiled parser in child processes under six timezones, and
`W06B-11` demonstrates the legacy path's host dependence alongside the corrected path's refusal.

### 5.1 Classification preserved at each call site

| Site | Invalid value | Behaviour |
| --- | --- | --- |
| `dhan_config.ts` (env) | zone-less or malformed | `CONFIGURATION_INCOMPLETE`, message names the variable and explains that a timezone is required |
| `dhan_api_client.ts` (SecretRef pre-flight) | invalid | `CONFIGURATION_INCOMPLETE` (unchanged) |
| `dhan_api_client.ts` (resolved credential) | invalid | `CREDENTIALS_EXPIRED` (unchanged) |
| `dhan_local_vault_resolver.ts` (`ref`) | invalid | `INVALID_SECRET_REF` / `CONFIGURATION_INCOMPLETE` (unchanged) |
| `dhan_local_vault_resolver.ts` (`record`) | invalid | `INVALID_SECRET_REF` / `CONFIGURATION_INCOMPLETE` (unchanged) |

`<=` is preserved at every comparison, so the exact expiry instant is already expired — the existing
semantics, unchanged.

Messages describe the *shape* of the value and never echo it. That matters here: an expiry is metadata,
but a value pasted into the wrong variable could be a credential, so nothing is reflected.

---

## 6. Backward-compatibility assessment

| Consumer | Impact | Verdict |
| --- | --- | --- |
| `MarketDataTransportClient` (IRR side) | New **optional** field; `httpStatus` still the daemon's | Compatible |
| `DhanMarketDataRouteFailure` | New optional field | Compatible |
| `/v1/freshness` | **Unchanged** | Compatible |
| Error-body shape assertions | One test asserted the body had *exactly* `code`+`message`; updated to the new contract (§7) | Intentional |
| Operators with a zoned `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` | No behaviour change | Compatible |
| Operators with a **zone-less** expiry | Now refused at startup instead of silently read as local time | **Intentional breaking change**, and the point of Correction B |
| Credential resolution, retry, timeout, taxonomy | Untouched | Compatible |
| DPAPI carriers, ACLs, vault contents | Untouched; no metadata rewritten | Compatible |
| D-7 freshness redaction | Untouched | Compatible |

The only behaviour change an operator can *feel* is the refusal of a zone-less expiry. That refusal is
the correction: the previous behaviour silently computed a different instant depending on where the
daemon ran. The documented shapes (D-6 §6: explicit-UTC ISO-8601, and the CLI's own `.000Z` output) are
already compliant, so a correctly-provisioned host is unaffected.

---

## 7. Targeted test results

| Suite | Tests | Result |
| --- | --- | --- |
| `tests/dhan_w06_auth_diagnostics.test.ts` (new) | 12 | **pass** |
| `tests/dhan_w06_expiry_strict_utc.test.ts` (new) | 12 | **pass** |
| `tests/dhan_w06_first_request_evidence.test.ts` (updated) | updated 1 | **pass** |
| `tests/dhan_w06_auth_failure_investigation.test.ts` (updated) | updated 1 | **pass** |

### 7.1 Negative controls — proving the tests bite

Each control injected a specific regression, ran both suites, and restored the source.

| # | Injected regression | Caught by | Failures |
| --- | --- | --- | --- |
| A | accept zone-less by appending `Z` internally (the original defect) | `W06B-03`, `W06B-10`, `W06B-11`, `W06B-12` | 4 |
| B | daemon drops the diagnostic again | `W06A-01`, `-02`, `-04`, `-08`, `-11` | 5 |
| C | emit the status without the code allowlist | `W06A-05` | 1 |
| D | emit the diagnostic ahead of the auth gate | `W06A-08` | 1 |
| E | skip the calendar round-trip (accept `2026-02-30`) | `W06B-05` | 1 |

Control A is the important one: appending `Z` is the *tempting* fix, and four independent tests reject
it.

---

## 8. Full guarded test results

```text
npm test  →  # tests 1688   # suites 226   # pass 1684   # fail 0   # skipped 4
             [test-guard] OK — exit 0
```

Baseline before this work item was 1664 executed / 1660 passed; this work item adds **24** tests
(12 + 12), matching exactly.

Two pre-existing tests failed on the first full run and both were genuine signal, not noise:

1. `W06-I07` — my own W-06 investigation guard, which asserted that both defects *still existed*. It
   fired exactly as designed once they were fixed, and was updated to assert the corrections instead.
   It had also been written to compare `Date.parse` output to itself, which could only have detected
   host dependence on a non-UTC host — a latent flaw in my earlier test, now replaced with a real
   source assertion.
2. `W06-01` — asserted the error body carried exactly `code`+`message`. My first rewrite expected
   `vendorHttpStatus: 503` for a `TRANSPORT_FAILURE`; the code correctly refused to emit it, because
   that failure never received a vendor response. The code was right and the test was wrong; it now
   asserts the absence, with the reasoning recorded in it.

---

## 9. No vendor request occurred

Confirmed by construction and by inspection:

- No test in either new suite instantiates `DhanServerHttpsTransport` or any live transport.
- Every vendor response in these suites is either a stub object or a hand-written `Response`.
- The only real I/O is loopback HTTP to a server the test process itself starts on `127.0.0.1`.
- No `api.dhan.co` URL appears in either new test file.
- No probe, capture, replay, retry or authentication attempt was run against Dhan.
- `git diff` touches no transport-egress code.

No test in the full suite could initiate vendor egress; the existing `PreAccessNoNetworkTransport` and
the production/TLS guards remain in force and are themselves tested.

---

## 10. No credentials or DPAPI state were modified

- No credential was read, printed, exported or logged.
- No token, Client ID, authorization header or transport token appears in any changed file.
- No DPAPI carrier, ACL, vault entry or credential metadata was read, rewritten or rotated.
- `dhan_dpapi_vault_backend.ts` and `dhan_dpapi_carrier.ts` are untouched.
- The only secret-shaped strings in tests are obvious synthetic fixtures (`dhan-tok`,
  `local-transport-token-*`) that already existed in the suite.
- Correction B changes how an expiry is **parsed**, never what is stored: no existing metadata was
  reinterpreted or rewritten.

---

## 11. Remaining W-06 / M1 blockers

| Blocker | Status |
| --- | --- |
| Whether the Dhan credential pair was valid at 2026-11-12T19:42Z | **UNVERIFIED** — needs the portal or a vendor request |
| Client-ID ↔ access-token pairing | **UNVERIFIED** |
| Entitlement to `/marketfeed/quote` | **UNVERIFIED** |
| The actual configured expiry value, and whether it carried a zone | **UNVERIFIED** — metadata, inspectable without exposing a secret, not inspected here |
| The original attempt's vendor 401-vs-403 | **Permanently unrecoverable** — it was discarded by the old code; the next attempt will carry it |
| The original attempt's send count / configured `IIPS_DHAN_TIMEOUT_MS` | **UNRECORDED** |

**W-06 remains OPEN. M1 remains NOT ACHIEVED.** No vendor authentication outcome is claimed, implied or
inferable from this record. These corrections made the *next* observation interpretable; they did not
produce one, and they do not prove the credentials are bad — a `vendorHttpStatus` of 200 with a failed
parse would also be possible, and to date no vendor status of any kind has been observed.

**Engineering note on the operator's likely state.** If the host's configured
`IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` is zone-less (D-6 documents the zoned form, so probably not), the
daemon will now refuse to start with `CONFIGURATION_INCOMPLETE` naming the variable. That would be the
correction working, not a new fault — and it is exactly the check that was previously too lenient on
IST.

---

## 12. Next roadmap step

1. **Operator, no vendor egress:** confirm the expiry value carries an explicit `Z` or offset, and that
   the stored Client ID and access token are the pair currently shown in the Dhan portal for an account
   entitled to Market Quote.
2. **Then, under separate authorisation:** one controlled `POST /v1/quotes` per the plan in
   `DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md` §11 — which now yields an
   interpretable `vendorHttpStatus`:
   - `401` → the token is invalid/expired at Dhan → regenerate, re-provision, one further request.
   - `403` → the pair or entitlement is refused → correct it at Dhan; **do not** retry blindly.
   - no status on an auth failure → instrumentation failed; stop and fix it.
3. **Only then** consider M1.

This record does not authorise step 2. It authorises nothing.

---

## 13. Safety footer

No HTTP request was made to Dhan or any vendor endpoint. No live quote, history, freshness or
authentication probe was run. No vendor retry was performed. No credential was rotated, regenerated,
replaced, revoked, read, printed or logged. No DPAPI carrier, ACL or vault content was modified. No
access token, Client ID, authorization header, vendor response body or transport token is exposed in
any changed file. P7 transport authentication was not reopened or modified, and the loopback gate was
not weakened. PR #156 was not merged and its status was not changed.
**W-06 remains OPEN. M1 remains NOT ACHIEVED.**
