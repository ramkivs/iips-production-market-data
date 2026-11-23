# DHAN W-14 / B-W14-1 — PR #176 Numeric Security-ID Serialization: IPD Provider-Side Verification (2026-11-23)

**Task:** W-14 — Live Instrument Mapping Qualification · **prerequisite** B-W14-1 — Numeric Security-ID Serialization.
**Repository:** `ramkivs/iips-production-market-data` (IPD) — provider side only.
**Outcome: VERIFIED ON THE AUTHORITATIVE `main` LINEAGE.** The corrected quote builder is
present, unweakened, at the current IPD `main`; the numeric wire-type is proven by test, by
executed builder output and by CI. The Reliance HTTP 200 acceptance ran at the PR #176 merge
commit and is tied to the same builder output in §6.

**What this document is.** The authoritative IPD provider-side verification and the handoff
package for the IRR-owned dependency-pin advancement (§8). It performs **no vendor request**,
touches no credential, changes no configuration and restarts no daemon.

---

## 1. Verification subject and lineage

| Item | Value |
| --- | --- |
| PR | [#176](https://github.com/ramkivs/iips-production-market-data/pull/176) — *Serialize Dhan quote security IDs as numbers on the current main lineage* |
| State | **MERGED**, `2026-11-18T09:40:38Z`, merge commit (`--merge`) |
| Head SHA | `d9f3e63dd7e523a761e26c0be434e74a0a470901` |
| Base before merge | `bfd83216f738a8cb6ad893f57934a582902bbdac` (`main`) |
| **Merge SHA** | **`2685562522f1a2fd1d745a7857f771bf21453315`** |
| Merge parents | `bfd83216…` + `d9f3e63d…` (two-parent merge; no unrelated changes) |
| **Current IPD `main` (handoff SHA)** | **`84e988b092058df8075ffa52f5dfb0f4fef07eaf`** |
| Relationship | `2685562` is an **ancestor** of `84e988b` — `behind_by: 0` on the compare API, `status: ahead`, `ahead_by: 77` |
| Lineage proof | `git ls-remote origin refs/heads/main` → `84e988b092058df8075ffa52f5dfb0f4fef07eaf`, identical to the verified local `HEAD` |

`main` has advanced 77 commits since the merge. That is **not** a concern for this
verification, because the subject file is checked at both ends:

| File | At merge `2685562` | At `main` `84e988b` | Verdict |
| --- | --- | --- | --- |
| `src/providers/dhan/dhan_api_client.ts` | blob `7415796a…` | blob `c797d591…` | **changed** — see §3, the change is additive and does not touch the builder |
| `tests/dhan_quote_numeric_serialization.test.ts` | blob `bae750a8…` | blob `bae750a8…` | **byte-identical** |
| `buildQuoteRequestBody` body | — | — | **byte-identical** (verified by function-level diff, §2.2) |

The only intervening change to `dhan_api_client.ts` is commit `84e988b` (PR #189, W-27), which
**adds** the temporary D-18 depth-capture diagnostic around `executeJsonPost`. It does not
modify `buildQuoteRequestBody`, does not alter the request body, and by its own construction
swallows every internal failure so it cannot change a call outcome.

---

## 2. Corrected quote-builder implementation

### 2.1 Authoritative source at `main` `84e988b`

`src/providers/dhan/dhan_api_client.ts`, `DhanApiClient.buildQuoteRequestBody`:

```ts
/**
 * Keep registry identifiers as strings; serialize cash-equity IDs as JSON integers at the
 * vendor boundary. Reject non-canonical or unsafe values instead of rounding or guessing.
 */
public static buildQuoteRequestBody(instruments: readonly DhanQuoteRequestInstrument[]): string {
  const grouped: Partial<Record<DhanExchangeSegment, number[]>> = {};
  for (const instrument of instruments) {
    const id = instrument.dhanSecurityId;
    if (typeof id !== 'string' || !/^[1-9][0-9]*$/.test(id)) {
      throw new TypeError('Dhan quote security ID must be a positive decimal integer');
    }
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId)) {
      throw new TypeError('Dhan quote security ID exceeds the safe integer range');
    }
    const bucket = grouped[instrument.exchangeSegment] ?? (grouped[instrument.exchangeSegment] = []);
    if (!bucket.includes(numericId)) bucket.push(numericId);
  }
  return JSON.stringify(grouped);
}
```

**The correction, precisely.** Registry and canonical identity layers continue to hold the Dhan
security ID as a **string** (that is the registry contract, and `DhanInstrumentMap` keying depends
on it). Conversion to a JSON **number** happens only at the vendor serialization boundary.
Nothing upstream is retyped, so `ISIN:INE002A01018:EQ` and `"2885"` remain the identifiers of
record; `2885` exists only inside the outbound body.

### 2.2 The builder is unchanged from the merge commit

Function-level diff of `buildQuoteRequestBody` between blob `7415796a…` (merge `2685562`) and
blob `c797d591…` (`main` `84e988b`):

```text
$ diff <(sed -n '/Keep registry identifiers as strings/,/^  }$/p' <merge>) \
       <(sed -n '/Keep registry identifiers as strings/,/^  }$/p' <main>)
(no output)
IDENTICAL: buildQuoteRequestBody unchanged merge->HEAD
```

### 2.3 Both call sites are guarded

An invalid ID is rejected **before** vendor egress at both entry points, so a malformed mapping
can never produce a wire request:

| Call site | On a rejected ID |
| --- | --- |
| `fetchMarketQuotes` | returns `dhanFailure('MALFORMED_INSTRUMENT_MAPPING', …)`; no request is sent |
| `probeOnce` | returns `NOT_ATTEMPTED_NOT_READY` with `failureCategory: 'MALFORMED_INSTRUMENT_MAPPING'` and `probeAttempted: false`; no request is sent |

---

## 3. Numeric body-type proof (executed, not asserted by reading)

### 3.1 Builder output for the Reliance mapping — at `main` `84e988b`

```text
Reliance resolution: RESOLVED
registry dhanSecurityId (stored): "2885" string
canonical securityId: ISIN:INE002A01018:EQ
BUILDER OUTPUT (Reliance): {"NSE_EQ":[2885]}
wire typeof: number
matches {"NSE_EQ":[2885]} exactly: true

multi/grouping/dedupe: {"NSE_EQ":[2885],"BSE_EQ":[500325]}
rejected "" -> TypeError
rejected "0" -> TypeError
rejected "01" -> TypeError
rejected "-1" -> TypeError
rejected "1.5" -> TypeError
rejected "1e3" -> TypeError
rejected " 2885 " -> TypeError
rejected "SYNTH-1" -> TypeError
rejected "9007199254740992" -> TypeError
```

This is the decisive point: the **same registry string** `"2885"` is emitted as the JSON number
`2885`, and `JSON.parse` reports `typeof … === 'number'`. A regression to string serialization
would fail three independent ways — the exact-match comparison, the `typeof` assertion, and the
`{"NSE_EQ":["2885"]}` shape mismatch.

### 3.2 Test coverage — `tests/dhan_quote_numeric_serialization.test.ts`

69 lines / 3 cases, byte-identical at the merge and at `main` (blob `bae750a8…`). The cases are:

1. **End-to-end via the retained P7 manifest.** Loads the real governed registry, resolves
   `EQ_RELIANCE_IN` + `ISIN:INE002A01018:EQ` → `RESOLVED` with `dhanSecurityId === '2885'`,
   drives `DhanMarketDataService.getQuote` with a **mock transport** (no vendor call), and asserts
   the captured request body is exactly `{"NSE_EQ":[2885]}` **and** that
   `typeof JSON.parse(body).NSE_EQ[0] === 'number'` **and** that the canonical identity is still
   `ISIN:INE002A01018:EQ`.
2. **Grouping, de-duplication and the safe-integer boundary** across `NSE_EQ`/`BSE_EQ`.
3. **Rejection without egress.** Nine malformed/unsafe IDs each yield
   `MALFORMED_INSTRUMENT_MAPPING`, and the mock transport records **zero** calls.

The numeric-type assertion is therefore a first-class test, not an incidental observation.

---

## 4. CI evidence

### 4.1 At the merge commit `2685562` — the verification that gated the merge

| Check | Result | Reference |
| --- | --- | --- |
| `typecheck · build · test` | **success** | [run 44278163394, job 134711531585](https://github.com/ramkivs/iips-production-market-data/actions/runs/44278163394/job/134711531585) |
| `executed test count` | **success** | check run `134713850245` |

Steps of the merge-commit job, all `success`: Set up job · Checkout · Set up Node.js ·
Install (locked) · **Typecheck** · **Build (tsc emit + vite bundle)** ·
**Test (guarded — zero tests is a failure)** · Public package consumer (pack + IRR importers) ·
Publish executed test count · Complete job.

Published executed test count at `2685562`:

> **1905 tests executed — 1904 passed, 0 failed.** Guard: a run that executes zero tests fails
> (CV-35). Head: `2685562522f1a2fd1d745a7857f771bf21453315`.

(The one non-passing test is the pre-existing platform-conditional skip class; the count check
reports `0 failed`.)

### 4.2 At the head SHA `d9f3e63` (pre-merge gate)

`typecheck · build · test` → **success**; `executed test count` → **success**
(same 1905 / 1904 / 0 failed). The PR was `MERGEABLE` / `CLEAN` when merged.

### 4.3 Re-verification at `main` `84e988b` (this work item, executed locally)

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc` | **PASS** (exit 0) |
| Numeric serialization suite | `node --test dist/tests/dhan_quote_numeric_serialization.test.js` | **3 tests, 3 passed, 0 failed, 0 skipped** |
| Targeted quote/mapping suites (11 files) | `node --test dist/tests/{dhan_quote_numeric_serialization, dhan_d1_provider_foundation, dhan_p5_service_transport, dhan_p6_exact_identity, dhan_w10_connection_verify_endpoint, dhan_d2_integration_qualification, dhan_w08_provider_state_recorder, dhan_w09_diagnostics_endpoint, dhan_stage1_admission, dhan_d3c_historical, dhan_daily_request_boundary}.test.js` | **114 tests, 114 passed, 0 failed, 0 skipped** |

No vendor call occurred in any of these runs; the transport is a mock throughout.

---

## 5. Historical-builder disposition

`buildDhanHistoricalRequestBody` (`src/providers/dhan/dhan_historical_dto.ts:173-191`) was **not
changed by PR #176** and remains what it always was — explicitly labelled *PROVISIONAL* in its
own source comment.

Executed at `main` `84e988b`:

```text
historical builder output: {"securityId":"2885","exchangeSegment":"NSE_EQ","instrument":"EQUITY","interval":"1D","fromDate":"2026-11-10","toDate":"2026-11-19"}
securityId typeof on wire: string
toDate (exclusive conversion): 2026-11-19
```

**Disposition: OUT OF SCOPE and NOT QUALIFIED — do not extend the B-W14-1 correction to it.**

| Question | Answer |
| --- | --- |
| Does it emit `securityId` as a JSON string? | **Yes.** |
| Does that contradict the numeric quote correction? | **No.** It is a different vendor endpoint (D02 historical), a different request contract, and it was never part of B-W14-1. |
| Is it therefore a known defect? | **Not established.** The only observed `HTTP 400` evidence in this programme concerns the **quote** endpoint and was resolved by the numeric fix. There is **no** recorded historical-endpoint 400 attributed to this field. |
| Should it be changed? | **Not by this work item, and not by inference.** Changing it would be an unverified wire-shape change on a *provisional* contract. Qualification requires its own authorized D02 investigation with its own vendor evidence. |
| Does anything in this document authorize a change to it? | **No.** Its provisional status is recorded here so the drift is not mistaken later for an oversight. |

This is the honest boundary: B-W14-1 is a *quote* serialization correction. Applying the same
reasoning to the historical builder without D02 evidence would be inventing a defect.

---

## 6. Reliance HTTP 200 evidence tied to the actual builder output

**Source record:** [DHAN Live Reliance Quote — Windows Operator Acceptance Record (2026-11-18)](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md).
That acceptance was **operator-executed on the Windows host**; IPD transcribed it. IPD did not
execute the vendor request and did not observe the daemon.

### 6.1 The request the vendor accepted

The accepted request ran at checkout **`2685562522f1a2fd1d745a7857f771bf21453315`** — i.e. the
merge commit of PR #176. The mapping that produced its wire body, read from the committed P7
manifest:

```text
companyId        EQ_RELIANCE_IN
canonical id     ISIN:INE002A01018:EQ   (isin INE002A01018, series EQ)
registry id      "2885"  (string, unchanged)
exchange         NSE  →  exchangeSegment NSE_EQ
lastVerifiedAt   2026-11-06T05:27:53.7922492Z
```

Serialized by the builder that is byte-identical at `2685562` and at `main` `84e988b` (§2.2),
this mapping emits exactly:

```json
{"NSE_EQ":[2885]}
```

### 6.2 The result

| Item | Value |
| --- | --- |
| Local IPD endpoint status | **HTTP 200** |
| Vendor request issued | exactly **one** quote request |
| `envelopeId` | `env-d01-b3392cf3ea65effd` |
| `qualityState` / `freshness` | `GOOD` / `CURRENT` |
| vendor `asOf` / local `receivedAt` | `2026-11-18T09:58:48.000Z` / `2026-11-18T10:10:53.425Z` |
| `lineageHash` | `b3392cf3ea65effde44d8eeffe400b0621f4368da1cf335633a7e8cd6efc2ecc` |
| credential window | access token expired `2026-11-19T10:05:01.481Z` (governs this evidence's validity) |

### 6.3 How tightly is the 200 tied to the builder?

Stated as precisely as the evidence allows — this distinction matters for the IRR pin.

**What is established.** The evidence is internally consistent with the corrected body and
nothing else:

- The pre-correction builder emitted `{"NSE_EQ":["2885"]}` for this same mapping, and the
  independently-implemented Python reference emitting `{"NSE_EQ":[2885]}` returned HTTP 200
  ([completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md) §1).
- The accepted run is the merge commit itself, so the corrected builder is **the only** quote
  builder present in that checkout — there is no competing code path.
- The run resolved the Reliance identity and produced a fully-formed `D01_QUOTES` envelope with
  a verified lineage hash, which requires the request to have been accepted and answered.

**What is not independently observable.** The operator's acceptance script is operator-side and
not tracked in this repository, so IPD did not capture the literal outbound body of that one
request. The tie is therefore: *the accepted checkout contains exactly one quote builder; that
builder's output for the accepted mapping is `{"NSE_EQ":[2885]}`, proven by execution at both
commits.* It is not: *IPD observed the bytes on the wire for that request.*

This is the same boundary the source record draws, and it is sufficient for the pin: the pin
needs the corrected builder to be the authoritative one, and it is.

---

## 7. Guarantees not overreached

- No live Dhan request was made by this work item. No credential was read, printed or changed.
- No configuration change, no daemon restart, no subscription change, no production claim.
  Production remains excluded and fails closed.
- No IRR-owned file or repository was modified. The handoff in §8 is addressed *to* IRR.
- `providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` in code, deliberately. One
  successful Reliance quote plus this serialization verification does not meet the bar for that
  declaration (D01 field-shape and rate-limit qualification, wider instrument coverage).
- **Do not repeat** the operator's vendor request to "confirm" this record.

---

## 8. Handoff to IRR — dependency-pin advancement

| Handoff item | Value |
| --- | --- |
| **IPD `main` commit SHA to pin** | **`84e988b092058df8075ffa52f5dfb0f4fef07eaf`** |
| Numeric-serialization merge SHA (historical anchor) | `2685562522f1a2fd1d745a7857f771bf21453315` |
| Verified at | `2026-11-23`, clean working tree, `git ls-remote` confirmed |

### 8.1 Supporting references

| Kind | Reference |
| --- | --- |
| Implementation | `src/providers/dhan/dhan_api_client.ts` — `DhanApiClient.buildQuoteRequestBody`; blob `c797d59121a2370ecdbc0e3b8316b5ff22e4a266` at `84e988b` |
| Implementation (at merge) | same function; blob `7415796a0e37c195b87d4beda1fe18cd2af184bc` at `2685562` |
| Guarded call sites | `fetchMarketQuotes` (→ `MALFORMED_INSTRUMENT_MAPPING`), `probeOnce` (→ `NOT_ATTEMPTED_NOT_READY`) |
| Numeric body-type test | `tests/dhan_quote_numeric_serialization.test.ts`; blob `bae750a806d57cb4fb62c88513e464bbf72aaf3b` — **identical** at `2685562` and `84e988b` |
| Historical builder (out of scope) | `src/providers/dhan/dhan_historical_dto.ts:173-191` — `PROVISIONAL`, unchanged, unqualified (§5) |
| CI at merge | run `44278163394` job `134711531585`; executed-test-count check `134713850245` — 1905 executed, 1904 passed, 0 failed |
| CI at head | `d9f3e63` — `typecheck · build · test` success; executed-test-count `134705381229` success |
| Local re-verification | `npx tsc` clean; 3/3 numeric suite; 114/114 targeted quote+mapping suites at `84e988b` |
| Vendor acceptance | [Reliance operator acceptance](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md) — HTTP 200 at `2685562` |
| Prior completion record | [Numeric serialization completion record](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md) |

### 8.2 What IRR may now assert

1. IPD `main` at `84e988b` contains the numeric quote serialization, and it is the **only** quote
   builder present.
2. That builder emits `{"NSE_EQ":[2885]}` — JSON number — for the Reliance mapping, proven by
   executed output and by an automated numeric-type test at both the merge commit and `main`.
3. The vendor answered HTTP 200 to a request issued by that builder at the merge commit.
4. Therefore an IRR dependency pin to `84e988b` (or later `main`) does **not** need a local
   serialization shim, and must not re-serialize quote security IDs on IPD's behalf.

### 8.3 What IRR must not assert

- Multi-instrument, sustained or rate-limit qualified operation.
- Any D02 historical qualification — the historical builder is still provisional and still emits
  a string ID (§5).
- Production readiness.
- That `providerQualification` has changed. It has not.

---

## 9. Related records

- [DHAN Quote Numeric Security-ID Serialization — Completion Record (2026-11-18)](DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18.md)
- [DHAN Live Reliance Quote — Windows Operator Acceptance Record (2026-11-18)](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md)
- [W-06 authentication failure investigation](DHAN-W06-AUTHENTICATION-FAILURE-INVESTIGATION-2026-11-13.md)
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md)
- IRR counterparts (read-only references, not modified): `DHAN-W14-W12-SERIALIZATION-VERIFICATION-2026-11-23.md`,
  `DHAN-QUOTE-API-FAILURE-ROOT-CAUSE-2026-11-18.md`, `DHAN-W14-INVESTIGATION-2026-11-23.md`,
  `DHAN-W14-RECONCILIATION-W06-2026-11-23.md`.

---

*Provider-side verification only. One operator-executed live Reliance quote; no live request
performed here, no production claim.*
