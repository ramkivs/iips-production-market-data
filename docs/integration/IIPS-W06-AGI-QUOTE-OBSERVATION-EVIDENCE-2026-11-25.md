# W06 — AGI Quote and Freshness Observations: Evidence Record (2026-11-25)

**Work item:** W06 — Market observations and freshness (IIPS Snapshot-to-Live).
**Repository:** `ramkivs/iips-production-market-data` (IPD — the authoritative repository for this evidence).
**Record baseline:** `836dbcf3b17280d5a684288e0f78f06c99a5af71` (merge of PR #190, `main`); this record added on
`arena/bb136aea-iips-production-market-data`.
**Classification:** **OPERATOR-SUPPLIED LIVE EVIDENCE, TRANSCRIBED AND OFFLINE-VERIFIED BY IPD. TWO LINKED OBSERVATIONS RECORDED.**
**W06 status after this record: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** See §8.
**Disposition: one successful quote observation, and the separate freshness observation is now also made — verdict `UNAVAILABLE`, eligibility `False`, not session-qualified.** See §6 and §7.
**Verification: 26/26 checks PASS on the quote evidence, 27/27 on the freshness evidence**, with each verifier asserting the other's subject matter — see §5.

> **This record does not claim IPD executed either request.** The operator executed both on the Windows
> checkout. IPD did not contact the vendor, did not read a credential, did not run on the host and did
> not observe the daemon. The terminal outputs in §3 and §4 are transcribed exactly as supplied, and §5
> is an **offline consistency check of those transcriptions against this repository's own code** — not
> an independent observation of the host.

---

## 1. Objective and boundaries

Record the AGI Greenpac (`EQ_AGI_IN`) observations as W06 evidence: first the successful quote, then the
separate read-only freshness observation of that same retained quote. Preserve both outputs, link them,
record the actual verdict, update the W06 tracker, and identify the exact steps by which a properly
session-qualified freshness assessment can be obtained.

**Boundaries observed while producing this record**

- **The quote request was not repeated.** No vendor call, no daemon start, no credential read and no
  host access occurred. The second observation was a read-only status read and spent no vendor request.
- **No Windows-host operation was performed, and none is claimed.** Everything produced here ran on Linux
  in the sandbox against tracked repository files.
- **No evidence or timestamp was fabricated.** Every instant in this record is either transcribed from a
  supplied output or computed locally and labelled as computed.
- **No portfolio capture or private holding detail is published.** §9 explains the one place where the
  temptation to infer such a link exists, and why it is refused.
- **No unrelated workstream is changed.** Only this record, its evidence directory and the W06 status line
  of the existing roadmap are touched.

---

## 2. What this evidence is a claim *about*

Two observations of one security, from two different surfaces. Together they are what W06's
"per-identity source/as-of/received/evaluated/**verdict**/eligibility" text asks for **for one instrument**.
Neither alone is sufficient.

| | **Observation 1 — quote** | **Observation 2 — freshness** |
|---|---|---|
| Surface | `POST /v1/quotes` | `GET /v1/freshness` |
| Vendor cost | one request | **none** — read-only cache/status read |
| What it answers | what the price was, with provenance and lineage | whether that retained price is usable *now* |
| Principal result | HTTP `200`, `qualityState: GOOD`, `freshness: CURRENT` | `cacheState: UNAVAILABLE`, **`verdict: UNAVAILABLE`**, `eligibleForUse: False` |
| Recorded in | §3 | §4 |

| Axis | State after this record | Basis |
|---|---|---|
| A quote request succeeded | **YES — exactly one, HTTP 200** | §3, §5 |
| The identity is a governed mapping | **YES** — exactly one QUALIFIED NSE row in the tracked P7 registry | §5 V22–V23 |
| Bid/ask were actually supplied | **YES** — `639.55` / `640`, positive, `ask >= bid`, D01 2.0.0 validator accepts | §5 V10–V11 |
| Provenance and lineage intact | **YES** — the lineage hash recomputes exactly | §5 V13–V14 |
| A **separate freshness observation** was made | **YES** — this record, observation 2 | §4 |
| That observation yields an **eligible** quote | **NO — `UNAVAILABLE`, `eligibleForUse: False`** | §4, §6 |
| That observation is **session-qualified** | **NO — `LEGACY_ELAPSED_UNQUALIFIED` / `NOT_CONFIGURED`** | §4.2, §7 |
| Per-holding eligible quote coverage measured | **NO — 0 of 64 measured** | §8.2 |
| Multi-instrument or sustained operation shown | **NO** — one instrument, two requests total | §8.2 |
| `providerQualification` should change | **NO** — unchanged in code, not raised by this record | §8.4 |

---

## 3. Observation 1 — the quote output (complete, unaltered)

Reproduced exactly as supplied; nothing elided, reordered, re-serialized or added. Stored byte-for-byte at
[`operator-terminal-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/operator-terminal-output.txt)
(SHA-256 `e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371`, 897 bytes), with the response
line alone at
[`agi-quote-envelope.json`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/agi-quote-envelope.json)
(SHA-256 `7658684fe71be35d49077685d44078411fa0a0aad16053dfb28774c37666c98b`, 839 bytes).

```text
Sending exactly one AGI quote request...
HTTP Status: 200
{"ok":true,"envelope":{"envelopeId":"env-d01-f464ef3b8313b9cd","domain":"D01_QUOTES","mode":"SNAPSHOT","companyId":"EQ_AGI_IN","payload":{"companyId":"EQ_AGI_IN","symbol":"AGI GREENPAC LIMITED","exchange":"NSE","currency":"INR","bid":639.55,"ask":640,"ltp":640,"open":655.5,"high":664,"low":635,"close":649.1,"previousClose":649.1,"volume":30388,"change":-9.1,"pctChange":-1.4,"vwap":645.98},"provenance":{"sourceClassification":"CANONICAL_MARKET_DATA","vendorTier":"TIER_2_COMMERCIAL","asOf":"2026-11-25T08:57:35.000Z","receivedAt":"2026-11-25T08:58:04.774Z","evaluatedAt":"2026-11-25T08:58:04.774Z","dataVersion":"v1.0.0-d01-provider-foundation","lineageHash":"f464ef3b8313b9cd6777e1627a2df8de7b9f7efe269fb02ff816dfebbac047d3","qualityState":"GOOD"},"timestamp":"2026-11-25T08:58:04.774Z","schemaVersion":"2.0.0"},"freshness":"CURRENT"}
```

### 3.1 Every field preserved, with what each one is

| Field | Value | What it records |
|---|---|---|
| Request count | **exactly one** | The prompt line states one request; nothing suggests a retry, a loop or a follow-up |
| HTTP status (local IPD endpoint) | `200` | The daemon answered successfully; this is the **daemon's** status, not the vendor's |
| `envelopeId` | `env-d01-f464ef3b8313b9cd` | `env-d01-` + first 16 hex of `lineageHash` — verified (§5 V14) |
| `domain` / `mode` | `D01_QUOTES` / `SNAPSHOT` | A quote in snapshot mode; **not** `LIVE` |
| `companyId` | `EQ_AGI_IN` | The requested company identity, echoed in envelope and payload |
| `payload.symbol` | `AGI GREENPAC LIMITED` | Canonical symbol as held by the governed registry row |
| `payload.exchange` / `currency` | `NSE` / `INR` | NSE cash equity, rupee-denominated |
| `payload.bid` / `ask` | `639.55` / `640` | **Supplied, positive top-of-book** — the D-5 shape, not `0` and not `null` |
| `payload.ltp` / `close` / `previousClose` | `640` / `649.1` / `649.1` | Last traded price, current-session close, derived previous close |
| `payload.open` / `high` / `low` | `655.5` / `664` / `635` | Session range |
| `payload.volume` | `30388` | Traded quantity, integer shares |
| `payload.change` / `pctChange` | `-9.1` / `-1.4` | Day change and percentage change, from the vendor net change |
| `payload.vwap` | `645.98` | Volume-weighted average price, present because the source supplied it |
| `provenance.sourceClassification` | `CANONICAL_MARKET_DATA` | Governed classification (vendor identity masked, NFR-06) |
| `provenance.vendorTier` | `TIER_2_COMMERCIAL` | Masked commercial tier — no vendor name published |
| `provenance.asOf` | `2026-11-25T08:57:35.000Z` | **Vendor-declared** market instant |
| `provenance.receivedAt` | `2026-11-25T08:58:04.774Z` | When IPD received the vendor response |
| `provenance.evaluatedAt` | `2026-11-25T08:58:04.774Z` | When quality was evaluated; equal to `receivedAt` |
| `provenance.dataVersion` | `v1.0.0-d01-provider-foundation` | Foundation data version constant, unchanged |
| `provenance.lineageHash` | `f464ef3b…047d3` | SHA-256 over payload + classification + `asOf` + `dataVersion` — **recomputed and matched** |
| `provenance.qualityState` | `GOOD` | Quality at `evaluatedAt` — a statement about **this envelope at that instant**, §6 |
| `envelope.timestamp` | `2026-11-25T08:58:04.774Z` | Envelope creation instant, equal to `receivedAt` |
| `schemaVersion` | `2.0.0` | The D01 schema version in force after D-5 (approved 2026-11-21) |
| `freshness` | `CURRENT` | Transport-level field on this response — bounded in §6.2 |

### 3.2 What this output does **not** contain — stated, not glossed

- **No route, URL, port or client.** The transport path is not in the evidence.
- **No vendor HTTP status.** `HTTP Status: 200` is the local daemon's status.
- **No `verdict`, `eligibleForUse`, `cacheState`, `suppressExecution`, `timestamps` or `lastRefresh`.**
  An envelope carries none of these — which is why observation 2 exists (§4).
- **No `ServiceHealth`, `providerQualification` or `liveProviderConnectivity`.**
- **No credential, expiry or session information**, and none is inferred.
- **No wall-clock record of when the operator ran the command**, beyond the instants inside the response.

---

## 4. Observation 2 — the freshness output (complete, unaltered)

The separate, authenticated, **read-only** `GET /v1/freshness` request. **No quote request was issued**
with it. Reproduced exactly as supplied — all sixteen fields, in the order printed, with the original
column alignment and the original PowerShell rendering of the nested `lastRefresh` value. Stored
byte-for-byte at
[`freshness-observation-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/freshness-observation-output.txt)
(SHA-256 `d3202701a6142480d87e196e4acfd69b3f64e7647b3fb217f76eaa8615a49c41`, 626 bytes).

```text
calendarMode           : LEGACY_ELAPSED_UNQUALIFIED
calendarAssessment     : NOT_CONFIGURED
domain                 : D01_QUOTES
cacheState             : UNAVAILABLE
asOf                   : 25-11-2026 08:57:35
timestampEvidence      : VALID
receivedAt             : 25-11-2026 08:58:04
evaluatedAt            : 25-11-2026 09:43:06
observationEvaluatedAt : 25-11-2026 08:58:04
thresholdSeconds       : 900
ageSeconds             : 2731.174
verdict                : UNAVAILABLE
staleConcessionActive  : False
suppressExecution      : True
eligibleForUse         : False
lastRefresh            : @{outcome=SUCCESS; lastFailure=}
```

### 4.1 Every field, and what it means

The field set and its order match `FreshnessStatus` exactly as `dhan_freshness_status.ts` builds it at
this commit — checked field-for-field, including that no session-aware field (`ageBasis`,
`sessionState`, `calendarVersion`, `calendarIssue`) is present, which is itself consistent with a read
made with no calendar configured (§5 F04–F05).

| Field | Value | Meaning |
|---|---|---|
| `calendarMode` | `LEGACY_ELAPSED_UNQUALIFIED` | **No calendar was configured** for this daemon, so age is elapsed wall-clock seconds and the assessment is explicitly unqualified. Documented in §4.2. |
| `calendarAssessment` | `NOT_CONFIGURED` | The no-calendar label. **It is not a coverage finding**, and it does not mean the exchange was closed. Documented in §4.2. |
| `domain` | `D01_QUOTES` | This is a quote-domain freshness read, not D02 historical |
| `cacheState` | `UNAVAILABLE` | The retained observation was classified `UNAVAILABLE` — beyond twice the threshold, so it is neither `CURRENT` nor `STALE`. Documented in §4.2. |
| `asOf` | `25-11-2026 08:57:35` | The vendor instant carried by the retained quote — **the same `asOf` as observation 1** (§5 F07) |
| `timestampEvidence` | `VALID` | The `asOf` is a well-formed instant; missing/invalid evidence is never treated as fresh |
| `receivedAt` | `25-11-2026 08:58:04` | Receipt instant from the retained quote's provenance |
| `evaluatedAt` | `25-11-2026 09:43:06` | **When this read evaluated** — a read-time instant, not the observation's own evaluation time |
| `observationEvaluatedAt` | `25-11-2026 08:58:04` | The original evaluation instant recorded on the observation; preserved, not overwritten |
| `thresholdSeconds` | `900` | The D01 nominal threshold (15 open-session minutes) |
| `ageSeconds` | `2731.174` | Age at read time — **45 min 31.174 s**, which is 3.03× the threshold and 1.52× twice the threshold |
| `verdict` | `UNAVAILABLE` | **The actual verdict.** Age exceeds twice the threshold, so the observation is suppressed |
| `staleConcessionActive` | `False` | Correct: the concession applies only in the `threshold < age <= 2 × threshold` band, and this age is beyond it |
| `suppressExecution` | `True` | Execution is suppressed for this observation |
| `eligibleForUse` | `False` | **Not eligible.** This is the eligibility answer W06's deliverable text asks for |
| `lastRefresh` | `@{outcome=SUCCESS; lastFailure=}` | Session history of the most recent refresh for this key: the quote request **succeeded**, and there is no recorded failure. PowerShell renders the null `lastFailure` as empty |

### 4.2 `calendarAssessment: NOT_CONFIGURED` and `cacheState: UNAVAILABLE` — precisely what each is

Both were required to be documented explicitly, and they are different kinds of statement.

**`calendarAssessment: NOT_CONFIGURED` (with `calendarMode: LEGACY_ELAPSED_UNQUALIFIED`)** answers one
question: *was a trading calendar supplied to this daemon?* The answer is **no**. Consequences, all
mechanical:

- Age is computed as **elapsed wall-clock seconds** from `asOf` to the read instant, not as
  open-session seconds.
- The assessment is therefore **not session-qualified**, and the response says so in its own labels. A
  `GOOD`/`STALE`/`UNAVAILABLE` verdict in this mode must never be presented as a calendar-qualified
  session verdict.
- This is **not** a statement that 2026-11-25 lacked coverage, and **not** a statement that the market
  was closed. Those are different questions, answered by §7.
- It is also not a defect in this read. A no-calendar deployment is a supported, explicitly labelled
  mode; the label is doing its job.

**`cacheState: UNAVAILABLE`** answers a different question: *how did the cache classify the retained
entry when this read inspected it?* The answer is `UNAVAILABLE`, which the cache assigns when the
freshness evaluation of the entry at read time sets `suppressExecution` — i.e. age beyond twice the
threshold. `UNAVAILABLE` is deliberately distinct from `MISS` (nothing retained), `NOT_AVAILABLE`
(no observation to classify) and `STALE` (aged but usable).

Together with `verdict: UNAVAILABLE`, `suppressExecution: True` and `eligibleForUse: False`, this is a
**consistent, complete and correctly-rendered status document**. The machinery W06 needs is working. What
it reports is that this particular observation was **too old to use at the moment it was read** — which
is a true statement about a quote taken 45 minutes earlier, not a malfunction.

### 4.3 A display-zone finding, worth recording because it is easy to misread

The transcript renders instants as `dd-MM-yyyy HH:MM:SS`, day-first, at whole-second precision, with
**no zone marker and no milliseconds**. The observed values show the clock is **UTC**, not IST:

| Rendered | Underlying instant | UTC clock | IST clock |
|---|---|---|---|
| `asOf: 25-11-2026 08:57:35` | `2026-11-25T08:57:35.000Z` | `08:57:35` ✓ | `14:27:35` ✗ |
| `receivedAt: 25-11-2026 08:58:04` | `2026-11-25T08:58:04.774Z` | `08:58:04` ✓ | `14:28:04` ✗ |
| `evaluatedAt: 25-11-2026 09:43:06` | `2026-11-25T09:43:06.174Z` | `09:43:06` ✓ | `15:13:06` ✗ |

The instants themselves are **unambiguous**, because they are tied to observation 1's own provenance and
because the arithmetic closes: `asOf` + `ageSeconds` = `09:43:06.174Z`, which renders as the displayed
`09:43:06` (verified §5 F09). But the rendering carries no zone, so a reader could take `08:57:35` for
local Indian time and conclude the quote was taken before the market opened. It was not; `08:57:35Z` is
`14:27:35 IST`, inside the trading day. This is recorded as an observation about the **display**, not a
defect claim about the surface, and no implementation change is proposed by this record.

---

## 5. Verification of both records (performed offline, in this sandbox)

Two separate verifiers, each tying one transcript to this repository's code, and each asserting the
**other's** subject matter so the link is checked rather than assumed from a shared directory name.

```text
$ node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs
…
PASS  V25  the paired freshness observation exists and reports on this quote's own asOf and receivedAt
PASS  V26  that freshness observation is scoped to D01_QUOTES and carries a verdict, which this envelope does not
26/26 checks passed.   (exit 0)

$ node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-freshness.mjs
…
PASS  F24  the freshness read is scoped to the same security as the quote evidence (D01_QUOTES / EQ_AGI_IN)
PASS  F25  the freshness asOf/receivedAt are the quote envelope's own provenance instants, not re-derived
PASS  F26  lastRefresh SUCCESS is session history of the quote request, reported separately from the verdict
27/27 checks passed.   (exit 0)
```

Full output: [`verification-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/verification-output.txt)
(26/26) and
[`freshness-verification-output.txt`](../../evidence/integration/w06-agi-quote-observation-2026-11-25/freshness-verification-output.txt)
(27/27).

### 5.1 What the freshness checks establish

| Class | Checks | What it proves |
|---|---|---|
| Byte integrity | F01–F02 | The record has not drifted; all 16 field lines are present |
| Faithful parse and field set | F03–F05 | Every line parses; the field set **and order** match `FreshnessStatus`; no session-aware field is present |
| Linkage to observation 1 | F06–F08, F24–F25 | The quote evidence is unchanged (byte hash), and the freshness `asOf`/`receivedAt`/`observationEvaluatedAt` **are that quote's own provenance instants** |
| Arithmetic | F09 | `asOf` + `2731.174 s` = `09:43:06.174Z`, matching the displayed `evaluatedAt` to within the truncated second |
| Verdict reproduction | F10–F16 | `cacheState`, `verdict`, `ageSeconds`, `thresholdSeconds`, `suppressExecution`, `eligibleForUse`, `staleConcessionActive`, `timestampEvidence` are all reproduced by running the real projection and the real evaluator at that instant |
| Calendar labelling | F17–F20 | `NOT_CONFIGURED` / `LEGACY_ELAPSED_UNQUALIFIED` is the no-calendar label; configuring `.2` instead would give `MISSING_COVERAGE`; **and no calendar can make this observation eligible** (§7.3) |
| Not a quote response | F21–F22 | The document carries status fields an envelope never carries, and **no** payload/lineage/bid/ask field |
| Session-history separation | F23, F26 | `lastRefresh: SUCCESS` is the quote's refresh outcome, reported alongside an `UNAVAILABLE` verdict without being substituted for it |

**Result: 26/26 and 27/27 PASS** at `e50a473`, both exit code 0.

### 5.2 What neither verifier can prove

Neither proves that a daemon answered, that a vendor returned these prices, or that the host ran this
commit. Those rest on the operator's supply of the output. The verifiers prove **internal consistency
with this repository's code**, which is what makes the transcripts usable as evidence and is the reason
no further request is needed to check them.

---

## 6. Reconciling the two observations: `GOOD`/`CURRENT` and `UNAVAILABLE` are both correct

This is the single most likely way this pair could be misread, in either direction.

### 6.1 They evaluate the same quote at two different instants

| | Observation 1 | Observation 2 |
|---|---|---|
| Evaluation instant | `2026-11-25T08:58:04.774Z` | `2026-11-25T09:43:06.174Z` |
| Age since the same `asOf` | `29.774 s` | `2731.174 s` |
| Band for a `900 s` threshold | `≤ threshold` → `GOOD` | `> 2 × threshold` → `UNAVAILABLE` |
| Result | `qualityState: GOOD`, `freshness: CURRENT` | `verdict: UNAVAILABLE`, `eligibleForUse: False` |

The `asOf` is **identical** in both (verified F07/F25). Nothing was re-quoted, nothing was re-stamped,
and the vendor instant was not overwritten. The age simply grew: 45 minutes and 31 seconds later, the
same observation is correctly unusable. **A later status read must change the verdict of an ageing
observation; that is the whole point of a freshness surface.**

### 6.2 `freshness: CURRENT` in observation 1 is an envelope field, not this status document

The `"freshness":"CURRENT"` value in §3 is set by the quote transport from the same evaluation that
produced `qualityState` at `evaluatedAt`. It states only that the vendor `asOf` was within the window
then. It is **not** `FreshnessStatus`: it has no `cacheState`, `verdict`, `eligibleForUse`,
`suppressExecution`, `timestampEvidence`, four-timestamp block, `lastRefresh` or calendar assessment.
Observation 2 is the surface that answers those questions, and it answers them differently because it
was asked later.

### 6.3 `lastRefresh: SUCCESS` does not contradict `verdict: UNAVAILABLE`

`lastRefresh` is session history for the most recent refresh of this cache key. The quote request
succeeded, so it reads `SUCCESS`, and no failure has been recorded, so `lastFailure` is null. The verdict
is a statement about the **observation's usability now**, not about whether the fetch worked. The
projection keeps these independent by design — a later read does not turn a success into a failure, and a
successful fetch does not make stale data eligible. Both fields are correct simultaneously.

### 6.4 What this pair therefore establishes, and what it does not

**Establishes:** the freshness surface works end-to-end on a real observation, and reports a real
`UNAVAILABLE` verdict with correct suppression and eligibility. W06's recorded acceptance text warns
that "a cache hit" must not be claimed to prove live connectivity; observation 2 is the counter-example
that makes that warning concrete — the entry was retained, the refresh had succeeded, and the verdict was
still `UNAVAILABLE`.

**Does not establish:** that a *usable* quote can be observed, that the handling is correct for the
`GOOD` and `STALE` bands on live data, or that any assessment is session-qualified. Those are §8 and §7.

---

## 7. The calendar-coverage requirement: investigation and exact remaining steps

Requirement 8 of the instruction asks for the calendar requirement to be investigated and the exact next
steps to a properly session-qualified freshness assessment. These are repository-verifiable findings, in
the order they constrain the plan.

### 7.1 Finding C1 — the calendar is a startup input, not a hot-reloadable setting

`dhan_local_daemon.ts` reads `IIPS_TRADING_CALENDAR_PATH` (or an embedded `tradingCalendarPath`) **once
at startup** and constructs the service with the parsed snapshot
(`dhan_local_daemon.ts:541-542`). There is no reload path. A configured calendar therefore applies only to
processes started after it is set, and applying one requires a **daemon restart**.

### 7.2 Finding C2 — the quote cache is in memory, so a restart discards the observation

`DhanBoundedCache` is a plain `Map` (`dhan_operational_controls.ts:84-136`) with no persistence. A
restart — the only way to apply a calendar (C1) — **empties the quote cache**. Any subsequent freshness
read against the restarted process returns `cacheState: MISS`, `verdict: UNKNOWN` for this key.

**Consequence:** a session-qualified assessment of *an existing* observation is not obtainable by
reconfiguring this daemon. The calendar and the observation must exist in the **same process**.

### 7.3 Finding C3 — even a perfect calendar row would not make *this* observation eligible

This is the decisive finding, and it is computed rather than assumed. Adding a synthetic NSE `OPEN` row
for `2026-11-25` to the published snapshot and re-running the projection at the recorded read instant
gives:

| Calendar row for 2026-11-25 | `calendarAssessment` | `calendarIssue` | `ageSeconds` | `verdict` |
|---|---|---|---|---|
| **absent** (today, `.2`) | `UNAVAILABLE` | `MISSING_COVERAGE` | `null` | `UNAVAILABLE` |
| `UNKNOWN` | `UNAVAILABLE` | `MISSING_COVERAGE` | `null` | `UNAVAILABLE` |
| `CLOSED` (as a holiday) | `UNAVAILABLE` | `INVALID_OBSERVATION` | `null` | `UNAVAILABLE` |
| `OPEN`, ordinary `09:15-15:35` + `15:50-16:00` | **`COVERED`** | — | **`2731.174`** | **`UNAVAILABLE`** |

The reason is mechanical: in session mode the age is measured in **open-session seconds accumulated from
`asOf` up to the evaluation instant** (`freshness_evaluator.ts`), and the open session in progress
continues to accumulate. At `09:43:06Z` the observation was already nineteen minutes past its own `asOf`
*inside the live session*, so the open-session age equals the elapsed age. Coverage is therefore
necessary but **not sufficient**: it removes the `MISSING_COVERAGE` label and nothing else.

**Therefore: a session-qualified `GOOD` verdict requires an observation whose age is within 900
open-session seconds of its own `asOf` at the moment it is read.** It cannot be retrofitted onto a
45-minute-old observation, by any calendar.

### 7.4 Finding C4 — the published calendar does not cover this observation's date anyway

Independent of C3, `calendars/ipd-equity-2026.v2026-11-19.2.json` has continuous coverage for
**2026-11-01 through 2026-11-19 inclusive** per its own `qualification` block. For the window around this
observation it holds **only** `2026-11-24` (a sourced holiday) and `2026-12-25` for both exchanges; it has
**no row for `2026-11-25`**, nor `11-20`, `11-21`, `11-22`, `11-23`, `11-26`–`11-30`. Verified F19/F20.
So configuring `.2` as it stands today would produce `SESSION_CALENDAR_CONFIGURED` /
`assessment: UNAVAILABLE` / `calendarIssue: MISSING_COVERAGE` — a worse-labelled answer, not a better one.

### 7.5 The exact steps to a properly session-qualified assessment

Two paths are available. Both are stated so the choice is explicit, and neither is taken by this record.

**Path A — cheapest, and it satisfies the recorded criterion without calendar work.** Obtain a
session-qualified *or* an elapsed-qualified usable verdict for a fresh observation:

1. Authorize and issue **one** quote request for `ISIN:INE415A01038:EQ` (`EQ_AGI_IN`, `NSE_EQ`) against a
   running daemon.
2. Within **900 seconds** of that quote's `asOf`, issue the read-only
   `GET /v1/freshness?domain=D01_QUOTES&companyId=EQ_AGI_IN&exchangeSegment=NSE_EQ&securityId=ISIN%3AINE415A01038%3AEQ`
   against the **same** process.
3. The result will be `GOOD` (or `STALE` if the read lands between 900 s and 1,800 s), with
   `calendarAssessment: NOT_CONFIGURED` and `calendarMode: LEGACY_ELAPSED_UNQUALIFIED` — a **usable but
   explicitly unqualified** verdict.
4. Record it. This is an honest `GOOD`, but it is **not** session-qualified and must be labelled so.

**Path B — yields the session-qualified assessment the instruction asks for.** This is the complete
sequence, and the ordering is forced by C1 and C2:

1. **Publish a new reviewed calendar version** covering the intended trading date (e.g. `.3`), with
   explicit per-venue rows and sourced session intervals, following the existing maintenance procedure in
   the W-11 runbook. The calendar is data, not a code change: `2026-11-25` needs an NSE row (and a BSE
   row if BSE is ever read) sourced to an official publication. Do not synthesize rows to make a test
   pass, and do not infer weekdays at runtime — the existing policy forbids both.
2. **Validate the snapshot offline** with the exported `parseTradingCalendar`, and run the calendar
   regressions, before it is used.
3. **Restart the daemon with `IIPS_TRADING_CALENDAR_PATH` set to the absolute path of the new version** —
   required by C1, and the reason the order matters.
4. **Issue one quote request** for the target identity, as the *first* observation in that process (the
   cache starts empty, so there is no competing traffic).
5. **Immediately — within 900 open-session seconds of that quote's `asOf` — issue the read-only
   freshness read** against the same process. Capture `calendarMode`, `calendarAssessment`,
   `calendarVersion`, `ageBasis`, `sessionState` and the verdict.
6. Expected successful shape: `calendarMode: SESSION_CALENDAR_CONFIGURED`, `calendarAssessment: COVERED`,
   `ageBasis: SESSION_TIME`, `sessionState: OPEN`, and `verdict: GOOD` with `eligibleForUse: true`.

**What Path B still would not establish:** per-holding coverage across the 64 holdings (§9), or that any
other instrument behaves the same. It establishes the session-qualified mechanism on one instrument.

**Cost warning, stated plainly:** each attempt at either path spends a vendor quote request. The cache is
in memory (C2), so a mistimed read — or a daemon restart between the quote and the read — requires a
**new** quote request to recover. Plan the read to follow the quote within the window, and treat the
first attempt as the attempt rather than assuming a retry.

---

## 8. W06 tracker update and what remains

### 8.1 What this record changes

| Tracker element | Before this record | After |
|---|---|---|
| Live D01 observations accepted | 1 (`EQ_RELIANCE_IN`) | **2** (`EQ_RELIANCE_IN`, `EQ_AGI_IN`) |
| Instruments with any accepted live quote | 1 | **2** |
| Bid/ask field-shape evidence | none — the Reliance snapshot carried `0`/`0` | **one observation with supplied positive bid/ask**, D-5 conformance confirmed |
| **Freshness observations** | **none** | **one**, linked to its quote at byte level |
| **Per-identity verdict and eligibility** | none | **`UNAVAILABLE` / `eligibleForUse: False`** for one instrument |
| **Observed `UNAVAILABLE` handling** | synthetic only | **observed live** |
| Observed `GOOD` / `STALE` handling | synthetic only | **still synthetic only** |
| Session-qualified assessment | none | **none** — `LEGACY_ELAPSED_UNQUALIFIED` / `NOT_CONFIGURED` |
| Per-holding eligible quote coverage (of 64) | 0 measured | **0 measured — unchanged** |
| W06 status | IN PROGRESS, NOT ACCEPTED | **IN PROGRESS, NOT ACCEPTED** |

### 8.2 W06 acceptance criteria and their state

R1, R2 and R7 are the roadmap W06 entry's own **Deliverable** text; R3–R6 are its **Acceptance/evidence**
text; the last three rows are bounds that entry already imposed. Nothing is added to the definition here.

| # | Acceptance requirement (W06's own text) | State | Basis |
|---|---|---|---|
| R1 | Per-identity **source / as-of / received / evaluated** | **MET AS MEASURED** for one instrument | §3.1 plus §4.1; one of 64 holdings, §9 |
| R2 | Per-identity **verdict / eligibility** | **MET AS MEASURED** for one instrument — verdict `UNAVAILABLE`, `eligibleForUse: False` | §4. A usable verdict is **not** established; §7.5 |
| R3 | **Same-revision reconciliation** | **NOT MET** | Zero holdings of revision 1 have a measured quote. Needs a per-holding pass, §7.5 step 4 and §9 |
| R4 | **Stale / unknown / unavailable handling** | **PARTIAL — one live case observed** | `UNAVAILABLE` is now observed live (§4). `GOOD` and `STALE` remain synthetic-only |
| R5 | **No candle-derived freshness** | **SATISFIED (structural)** | D02 freshness stays `NOT_AVAILABLE`/`UNKNOWN` with `evidenceSource: NO_OBSERVATION` |
| R6 | **No claim that a cache hit proves live connectivity** | **SATISFIED, and demonstrated** | §6.4: a retained entry with `lastRefresh: SUCCESS` still reported `UNAVAILABLE` |
| R7 | **Aggregate coverage** | **NOT MET** | 0 of 64 measured; denominator 64, qualified numerator unmeasured |
| — | Bound: 1 of 64 identity coverage | **UNCHANGED** | Needs a later import writing a new revision ([reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) §6) |
| — | Bound: θI not established | **UNCHANGED** | This record sets no threshold |
| — | Bound: θI/θF/θA/θM belong to W20 | **UNCHANGED** | W06 measures; it does not gate |

**Net position.** R1, R2 and R6 are satisfied as measured for one instrument; R4 has gained a live
`UNAVAILABLE` case; R5 holds structurally. **R3, R7 and the identity-coverage bound are untouched**, and
R4 does not yet cover the `GOOD` and `STALE` bands on live data. W06 is therefore **IN PROGRESS and NOT
ACCEPTED**, and this record does not recommend otherwise.

### 8.3 Confirmed progress, stated minimally

W06 now has a **complete per-identity observation pair** for one instrument — source, as-of, received,
evaluated, verdict and eligibility — with the two documents verified against each other and against the
code. That is the first time the programme holds a freshness *verdict* on a live observation, and the
first live demonstration that the D-5 bid/ask representation yields a real supplied top-of-book. Both
gains are narrow and both are bounded above.

### 8.4 What deliberately did not change in code

- `providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`.
- No refresh endpoint, scheduler, timer or automatic refresh is introduced or implied.
- No implementation file is modified; no calendar version is published by this record (§7.5 Path B
  step 1 is a separate, reviewed data-publication action).
- The display-zone finding in §4.3 is recorded as an observation. No change is proposed to any
  formatting surface by this documentation work item.

---

## 9. What this evidence must **not** be attributed to (private-holding discipline)

`EQ_AGI_IN` resolves to a governed P04 company and its identity is a QUALIFIED row of the tracked P7
registry (§5 V22–V23). That is all this record establishes about identity.

**It is not established, and is deliberately not claimed, that `EQ_AGI_IN` is a holding of any portfolio
revision.** Two facts make that attribution tempting and unsupportable:

1. The tracked W04 lineage reproduction records **exactly one** holding of revision 1 with a stored
   security identity, and that holding's ISIN, symbol and issuer are **not in this repository** — W04
   recorded them as "reported for the one qualified holding, not shown"
   ([reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) §3).
2. `AGI GREENPAC` is a documented governed alias in the identity fixtures and appears in historical
   resolution audits. Neither fact links it to revision 1.

Asserting "the one identified holding is AGI Greenpac, and it now has a quote and a verdict" would be the
symbol-based inference W04's criteria forbid, and would publish a private holding to justify a convenient
coverage count. **This record refuses that.** Coverage remains **0 of 64 measured**; R3 and R7 stay open.

---

## 10. Reproduction boundary

**Do not repeat the AGI quote request** to "confirm" this record, and do not re-run any acceptance script
for it. Both observations are complete as supplied; the verifiers in §5 exist precisely so that no
further request is needed to check either transcription. A future observation — including either path in
§7.5 — needs its own authorization and its own record.

**This record performed no Windows operation.** Every command actually run to produce it was a local
`node`, `npm` or file inspection in the sandbox, against tracked files at `e50a473`.

---

## 11. Related records

- [W06 broker import and holding identity reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) — the 1-of-64 identity starting point and the separation of identity from quote coverage
- [DHAN live Reliance quote — operator acceptance](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md) — the first accepted live observation (`bid: 0, ask: 0`)
- [D-5 bid/ask representation and validation decision](D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md) — why `639.55`/`640` differs materially from `0`/`0`
- [IPD P5 — read-only freshness status](../../docs/IPD-P5-FRESHNESS-HTTP.md) — the surface recorded in §4 and the four-timestamp evidence
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md) — route table, calendar activation, maintenance procedure referenced by §7.5
- [D-3 market-closed freshness decision](IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md) — the accepted calendar limits and the five-trading-day policy this record does not reopen
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 status, updated by this record
- [DHAN W-14 / E4 readiness assessment](DHAN-W14-E4-READINESS-ASSESSMENT-2026-11-23.md) — the separately governed multi-instrument qualification this record does not touch
