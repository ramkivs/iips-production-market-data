# W06 — Calendar Coverage and AGI Freshness Measurement: Execution Plan (2026-11-25)

**Work item:** W06 — Market observations and freshness (IIPS Snapshot-to-Live).
**Repository:** `ramkivs/iips-production-market-data` (IPD).
**Baseline:** `860bf4d` on `arena/bb136aea-iips-production-market-data` (two AGI observations recorded).
**Classification:** **ANALYSIS AND EXECUTION PLAN ONLY. No live request was issued, no calendar was changed, no host operation was performed.**
**W06 status: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** Unchanged by this document.

> This plan reuses the accepted NSE calendar evidence and the two recorded AGI observations. It does
> not re-derive them, does not repeat any measurement, and does not ask for anything already done.
> Every mechanical claim below was computed in this sandbox against the tracked code and snapshot, and
> the computation is named so it can be re-run.

---

## 1. What is already established (do not redo)

| Item | State | Where |
|---|---|---|
| NSE ordinary-week rule, within the reviewed bounded range | **ACCEPTED** — owner-directed weekday/weekend model, bounded | W-22 closure; `calendars/ipd-equity-2026.v2026-11-19.2.json` |
| NSE 2026 weekday closures, 20 sourced dates | **ACCEPTED, SOURCED** — incl. `2026-11-24` (Guru Nanak) and `2026-12-25` | same, `.qualification.annualHolidayEvidence` |
| NSE session envelope | **ACCEPTED** — ordinary `09:15–15:35`, post-close `15:50–16:00` IST; pre-open and `15:35–15:50` excluded | same, `.qualification.intervalPolicy` |
| Nov 7 / Nov 14 mock-only | **ACCEPTED** — closures, not live sessions | same, CMTR 77334 / 77415 |
| Nov 8 Muhurat | **ACCEPTED** — exceptional live session | same |
| Continuous coverage `2026-11-01 … 2026-11-19` | **PUBLISHED** | same, `.qualification.continuousCoverage` |
| BSE continuous range | **RECORDED GAP, out of W06 scope** (§6) | W-22 explicitly open on BSE |
| AGI quote observation | **RECORDED** — HTTP 200, 26/26 verified | [W06 evidence record](IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md) §3 |
| AGI freshness observation | **RECORDED** — `UNAVAILABLE`, 27/27 verified | same, §4 |

**Nothing in this list needs new evidence, a new source, or a re-measurement.** The NSE work that
remains is arithmetic over accepted material (§3), not research.

---

## 2. The actual calendar coverage gap, stated precisely

### 2.1 It is a date-range boundary, not a qualification failure

The snapshot's own qualification block says the NSE range ends at **`2026-11-19`**. Every date after
that is *absent*, not *closed* — and the loader treats absence as unknown, never as closed:

| Date | Present in `.2` (NSE)? | Status | Why |
|---|---|---|---|
| `2026-11-19` | yes | `OPEN` | last date of the qualified range |
| `2026-11-20` Fri | **no** | coverage gap | outside range |
| `2026-11-21` Sat | **no** | coverage gap | outside range (weekend: absent, not "closed") |
| `2026-11-22` Sun | **no** | coverage gap | outside range |
| `2026-11-23` Mon | **no** | coverage gap | outside range |
| `2026-11-24` Tue | yes | `CLOSED` | **sourced holiday row survives outside the range** |
| `2026-11-25` Wed | **no** | coverage gap | the AGI observation's own date |
| `2026-11-26` Thu | **no** | coverage gap | next trading session |
| `2026-11-25` read with `.2` | — | **`MISSING_COVERAGE`** | verified as check F19/F20 of the freshness verifier |

The holiday rows for `2026-11-24` and `2026-12-25` sit outside the continuous range as sparse sourced
evidence. That is deliberate and useful: it means the extension in §3 does not have to re-establish
those dates.

### 2.2 Two independent defects, and only one of them is reachable by a calendar

| # | Defect | Remedy | In scope |
|---|---|---|---|
| **D1** | The snapshot does not cover the dates needed, so a session-aware read returns `MISSING_COVERAGE` | Publish a new reviewed range (§3) | **Yes** |
| **D2** | No calendar is configured on the daemon at all, so reads are `LEGACY_ELAPSED_UNQUALIFIED` | Start the daemon with `IIPS_TRADING_CALENDAR_PATH` (§4) | **Yes**, operator only |
| **D3** | The two recorded AGI observations cannot be retrofitted to a session-qualified verdict | None — they remain correct as recorded | **No.** See §5 |

### 2.3 The necessary correction

Extend the NSE rows to a **new reviewed snapshot version** (e.g. `2026-11-26.1` or
`2026-11-25.3`) whose `continuousCoverage.endDate` matches the last materialized date — **not** to a
guessed future horizon. Materialize only dates whose status is *derivable from accepted evidence*:

- **weekend dates** → `CLOSED` (the accepted ordinary week rule, applied inside the reviewed interval)
- **weekday dates already in the sourced holiday list** → keep the existing sourced rows
- **`2026-11-25`** → `OPEN` **only** with a positive citation that it was a live session (§3.2)
- **anything already published** → byte-for-byte unchanged

Three validator constraints are easy to violate and are listed so the extension fails fast if it does
(`trading_calendar.ts:24-44`): one row per exchange+date (no duplicates); an `OPEN` row must have
intervals and a `CLOSED`/`UNKNOWN` row must have none; and every interval must open **and** close on
the row's own IST date, with intervals in ascending order.

---

## 3. The `2026-11-25` question — the one genuinely undecided item

### 3.1 Why it cannot be inferred

`2026-11-25` is a **Wednesday**, is **not** in the 20 sourced weekday closures, and is therefore
*consistent with* an ordinary trading day. But consistency is not evidence, and two mechanisms forbid
inference:

1. **The runtime forbids it.** The snapshot's own policy states there is no runtime weekday inference;
   a date is qualified only by an explicit row with a source.
2. **The repository forbids it in publication too.** The W-22/BSE precedent is explicit that a
   search-indexed or assumed weekday rule is **not** promoted to rows without a retrieved official
   source. Editorially, W-22's `.2` bounded model was materialized under an **explicit owner
   direction** recorded in an instruction. No such direction exists for extending NSE past 11-19, and
   this document will not manufacture one.

There is a second, independent reason not to assume the session occurred: the recorded AGI quote's
`volume` is **`30,388`** shares with `ltp == close == 640` and `bid`/`ask` present. Continuous trading
through the day would normally accumulate more volume than that, which raises the possibility of a
**special session, an unscheduled closure, or a data condition**. That is a hypothesis, not a finding —
the figure may simply be thin trading. It is enough, however, to show that "11-25 was an ordinary full
session" must be **sourced, not assumed**.

### 3.2 What would settle it, minimally

One of the following, recorded with its URL and retrieval date, is sufficient to authorize an `OPEN`
row for `2026-11-25`:

- the **NSE dated final equity bhavcopy** for `2026-11-25`, existing and showing the NSE cash segment
  traded (the D-3 investigation already established this corroboration pattern); or
- the **NSE CMTR/MSD circular index** for 25–26 November 2026, showing **no** special-session,
  closure or session-change notice for 11-25.

If neither is retrievable, `2026-11-25` is left **`UNKNOWN`** — which suppresses a read rather than
fabricating one — and the measurement proceeds on the next trading date instead (§7, Option 2).

---

## 4. Which tasks Arena can do, and which need the Windows host

The boundary is structural: the calendar is a **file in this repository**, and the daemon, the
credential and the vendor egress are all on the host.

| Task | Arena (this repository) | Windows-host operator |
|---|---|---|
| Source and cite the `2026-11-25` evidence (§3.2) | **Yes** — retrieve and record URL + date | No |
| Materialize the extended NSE rows and bump the version | **Yes** | No |
| Validate the snapshot (`parseTradingCalendar`) and add regressions | **Yes** | No |
| Publish the extension and update W-22/W06 records | **Yes** | No |
| Copy the snapshot to the host and set `IIPS_TRADING_CALENDAR_PATH` | No | **Yes** |
| Restart the daemon so the calendar takes effect | No | **Yes** — startup-only input (`dhan_local_daemon.ts:541`) |
| Issue the quote request (vendor egress) | No | **Yes** |
| Issue the freshness read | No | **Yes** (or any client holding the token) |
| Capture and publish the outputs back to the repository | No | **Yes** supplies; Arena transcribes and verifies |

**Consequence for sequencing:** arena work cannot produce a session-qualified verdict on its own. It can
only remove D1 and prepare D2. The observation pair is necessarily a host step.

---

## 5. Requirement 4 — can the observations be done after the 15:30 IST close?

**Short answer: yes, for the *request*; and there are two narrow post-close windows in which the result
is still session-qualified `GOOD`. But a request made *well* after close — which is where we are now —
cannot be session-qualified.** The technical reasoning, and then the arithmetic.

### 5.1 The three gates, in order

For a `GET /v1/freshness` read to return `GOOD` with `calendarAssessment: COVERED`, **all three** must
hold. They are independent, and the third is the one usually missed.

**Gate 1 — coverage of every date.** From the observation's IST date to the read's IST date, *every*
date must have an explicit row, weekends included. A single absent date returns `MISSING_COVERAGE` and
**no age at all**. Verified: a read one day after its observation, with the intervening date absent,
returns `ageSeconds: null`, `UNAVAILABLE`, `calendarAssessment: UNAVAILABLE`,
`calendarIssue: MISSING_COVERAGE`.

**Gate 2 — the observation must fall inside a declared session.** The `asOf` must satisfy
`opensAt <= asOf <= closesAt` for one of the row's intervals. Otherwise
`calendarIssue: INVALID_OBSERVATION`. Notably `09:15–15:35` is the **union of continuous trading and
CAS confirmation**, so the window extends past the 15:30 continuous close — and there is a second
declared interval, `15:50–16:00`. A quote timestamped after `16:00` IST is invalid, not merely stale.

**Gate 3 — session age ≤ 900 seconds, and session age stops at close.** This is the decisive mechanic.
Age is accumulated **only while a declared interval is open**
(`freshness_evaluator.ts`): for each open interval, `max(0, min(read, closesAt) − max(asOf, opensAt))`.
After the last interval closes, **the age stops growing**. An observation cannot "age out" overnight.

### 5.2 Two valid post-close windows — with the arithmetic

Measured against the accepted NSE envelope, for a read made at ~16:37 IST (i.e. after the 15:30
continuous close and even after the 16:00 post-close close):

| Quote `asOf` (IST) | Which interval it is in | Session age at read | Verdict |
|---|---|---|---|
| 15:29:00 | continuous `09:15–15:35` | 960 s | `STALE` (still eligible — concession active) |
| **15:30:00** | continuous | **900 s** | **`GOOD`** — exactly at the threshold |
| 15:32:00 | continuous | 780 s | **`GOOD`** |
| 15:34:00 | continuous | 660 s | **`GOOD`** |
| **15:51:00** | post-close `15:50–16:00` | **540 s** | **`GOOD`** |
| **15:55:00** | post-close `15:50–16:00` | **300 s** | **`GOOD`** |
| 16:15:00 | **no interval** | `null` | `UNAVAILABLE` — `INVALID_OBSERVATION` |

So the full valid post-close window is **any `asOf` in `15:30:00–15:35:00` or `15:50:00–16:00` IST**,
read any time after that on the same or a later covered date. `15:35–15:50` is excluded because it is
not a declared interval, and that is exactly why `15:50–16:00` matters.

**This is not theoretical.** The already-accepted Reliance observation was requested **after** close
(`receivedAt` 15:40:53 IST) and returned a vendor `asOf` of **15:28:48 IST** — a session time. A
request made outside trading hours still carries the last in-session trade instant.

### 5.3 Why *our* situation is different, and what that forbids

Our recorded AGI quote has `asOf` **`14:27:35 IST`** — comfortably in-session — but it was read at
`15:13:06 IST`, i.e. **2,731 s of accumulated session time later**, already `UNAVAILABLE`. Nothing that
happens after the close can reduce that number: session age is frozen at 2,731 s, and re-reading it in
the evening, tomorrow, or next week returns the same `UNAVAILABLE`. That is why **the existing
observation must not be re-measured** (§8) and why a **new** observation pair is required.

And a request issued *after the continuous close* — which is the situation at the time of writing,
with the market already past its `15:30`/`15:35` close — would be a gamble, not a measurement:

- if the vendor returns a `15:50–16:00` post-close `asOf`, Gate 2 and Gate 3 can be satisfied;
- if the vendor returns the **last continuous-trading** `asOf` (≈`15:29–15:35`), the observation is
  either right at the 900 s boundary or already `STALE`/`UNAVAILABLE`, and the request is spent for an
  inconclusive result;
- if the vendor returns an `asOf` after `16:00`, the read is `INVALID_OBSERVATION` outright.

**Therefore: recommend waiting for the next covered trading session and targeting the `15:50–16:00`
post-close interval deliberately, or reading promptly in-session.** Both are strictly better than a
guess made after the continuous close. This directly answers requirement 4: *possible* after 15:30,
*reliable* only inside the two windows, and *not* by re-reading the old observation.

### 5.4 A trap worth naming: the date rollover

A read made after midnight IST, or a read whose date differs from the observation's date, requires
coverage of the intervening dates (Gate 1). Reading at, say, 00:30 IST on the following day would put
the read date on the next calendar date and pull in an extra required row. **Do the read on the same
IST date as the quote** — that keeps Gate 1 to a single row.

---

## 6. Explicitly out of scope

| Item | Why not in this plan |
|---|---|
| **BSE continuous range** | W-22 is separately and explicitly open on BSE; §7.5 of the W06 evidence record documents that the official normal-week page retrieval still fails. The AGI security's NSE row is what is needed, and `exchangeSegment: NSE_EQ` is a single venue. Do not copy NSE rows to BSE. |
| **θI / θF / θA / θM thresholds** | Belong to W20. W06 measures; it does not gate. |
| **D02 historical qualification** | Separate axis; D02 freshness stays `NOT_AVAILABLE`/`UNKNOWN` and must not be inferred from a candle. |
| **Per-holding coverage across all 64 holdings** | Blocked on identity coverage (1 of 64), which needs a later import writing a new revision. Not a calendar task. |
| **W-14 / E4 multi-instrument qualification** | Separately authorized; do not merge into W06. |

---

## 7. The plan

Two options. **Option 1 is recommended.** Both are shown because Option 1 has a real dependency (§3.2)
and the fallback avoids that dependency entirely at the cost of a one-day delay.

### Option 1 — the honest route: extend NSE coverage to the measurement date, then measure

| When | Arena / operator | Step |
|---|---|---|
| Day 0–1 | Arena | Source and cite `2026-11-25` evidence (§3.2), or record it as `UNKNOWN` and switch to Option 2 |
| Day 1 | Arena | Materialize extended NSE rows; bump version; publish; validate; regress |
| Day 2 (next covered session) | Operator | Copy snapshot to host, configure, restart, then the timed observation pair |

### Option 2 — the fast route: no new qualification, measure on an already-covered date

Use a date the accepted snapshot **already** covers and the accepted session envelope **already**
describes. The catch is that the only covered dates are `2026-11-01…11-19`, and "today" is past them —
so Option 2 still needs rows for the measurement date, meaning it collapses into Option 1 **unless** a
row for the target date can be sourced. Its one advantage: it needs no *new* reasoning about the
session envelope, only a sourced `OPEN` row.

**Because both options reduce to "publish a reviewed row for the measurement date", the plan below is
the single sequence, with Option 2's substitution called out at step 2.**

---

### The execution table

Who: **A** = Arena (this repository, sandbox, no credentials, no host). **O** = Windows-host operator
(credential, daemon, vendor egress). Every row states *how*, and *when* relative to the measurement.

| # | What needs to be done? | Who | How / exact steps | When |
|---|---|---|---|---|
| **1** | Decide the measurement date and the target window | A | Target a covered trading session; aim the quote `asOf` at **`15:50–16:00 IST`** (post-close interval) or **`15:30–15:35`** (continuous tail). Rationale §5.2. Record the choice before any request. | Before step 2 |
| **2** | Establish the target date's status from a citable official source | A | Retrieve **one** of: NSE dated final equity bhavcopy for the date (exists ⇒ traded), or the NSE CMTR/MSD circular index for the date showing no closure/special-session notice. Record URL + retrieval date + what it shows. **If neither is retrievable, leave the date `UNKNOWN` and stop** — do not infer the weekday rule. | Before step 3 |
| **3** | Materialize the extended NSE rows in a **new** snapshot version | A | Copy `.2` → new file. Add explicit rows for every date from the last published date to the measurement date: weekends `CLOSED` (no sessions); sourced holiday dates keep their existing rows unchanged; the target date `OPEN` with the accepted envelope `09:15–15:35` + `15:50–16:00` IST. Update `continuousCoverage.endDate` to the last materialized date. **Do not touch BSE.** Preserve every existing row byte-for-byte. | After step 2 |
| **4** | Validate and regress the new snapshot | A | `parseTradingCalendar(newRaw)` must not throw. Confirm: no duplicate exchange+date; `OPEN`⇔intervals non-empty and `CLOSED`⇔empty; every interval opens and closes on the row's own IST date, ascending. Then `npx tsc --noEmit` and the focused calendar/freshness set, plus `npm test` so the guarded suite stays green. Do **not** edit `.2`; do not modify `tests/w22_bse_bounded_calendar.test.ts` assertions about `.2`. | Same working session as 3 |
| **5** | Publish the extension and record it | A | Commit the new snapshot plus a short W-22/W06 record: version, coverage range, the citation from step 2, what changed and what did **not** (BSE untouched; `.2` immutable). Push the branch; open a PR. | Same working session |
| **6** | Stage the snapshot on the host | O | Fetch the branch; place the JSON at a stable absolute path; record its **SHA-256** and confirm it equals the repository file. | After step 5 merges |
| **7** | Confirm the credential is currently valid | O | `npm run dhan:credential -- verify` (built CLI). Expect `PRESENT_OK`, `aclOwnerOnly=yes`, `expired=no`. Do **not** publish secret values — the command already prints status only. | Immediately before step 8 |
| **8** | Start the daemon **with the calendar configured** | O | In the same session set `IIPS_TRADING_CALENDAR_PATH` to the absolute path from step 6 and `IIPS_MARKET_DATA_TRANSPORT_TOKEN`, then run the existing start script (`windows-setup/03-Start-IipsServers.ps1`). A restart is required because the calendar is read **once at startup**; the cache is in-memory, so this also gives a clean, empty cache. | Next covered session, before 15:50 IST |
| **9** | Confirm the daemon is serving with the calendar | O | `GET /v1/health` with the bearer token returns 200. Optional read-only pre-check: `GET /v1/freshness?domain=D02_OHLCV` returns 200 (spends no vendor request). | Before step 10 |
| **10** | Issue **exactly one** quote request | O | `POST /v1/quotes` with `{"companyId":"EQ_AGI_IN","securityId":"ISIN:INE415A01038:EQ","exchangeSegment":"NSE_EQ"}` and the bearer token. One request. Capture HTTP status and the full JSON. | At the target window from step 1 (ideally start of `15:50–16:00` IST) |
| **11** | Issue the freshness read against the **same** process | O | `GET /v1/freshness?domain=D01_QUOTES&companyId=EQ_AGI_IN&exchangeSegment=NSE_EQ&securityId=ISIN%3AINE415A01038%3AEQ` with the bearer token. **No** quote request with it. Capture the full output and the wall-clock time. | **Within 900 session-seconds** of step 10's `asOf`; same IST date as the quote (Gate 1) |
| **12** | Read the result against a pre-agreed key | O | `SESSION_CALENDAR_CONFIGURED` + `COVERED` + `ageBasis: SESSION_TIME` + `verdict: GOOD` + `eligibleForUse: true` ⇒ success. `STALE` ⇒ aged but usable, record as such. `MISSING_COVERAGE` ⇒ step 3 missed a date. `INVALID_OBSERVATION` ⇒ step 10 landed outside a declared interval. `MISS` ⇒ wrong process or a restart. | Immediately after step 11 |
| **13** | Publish and verify the pair | A | Transcribe both outputs byte-for-byte into the existing evidence directory, extend the freshness verifier's expectations, re-run both verifiers, update the W06 tracker. Preserve the two existing 2026-11-25 observations unchanged. | After step 12 |

---

## 8. Guardrails that apply to every step

- **Do not repeat the existing AGI quote request.** Both recorded observations are complete and
  independently verified; re-reading the old one returns `UNAVAILABLE` forever (§5.3). The new pair is a
  *new* observation with its own authorization and record.
- **Do not edit the published calendars.** `.1` and `.2` are immutable evidence; an extension is a new
  file with a new version. Tests assert `.2`'s contents and version string.
- **Do not extend BSE by copying NSE.** The BSE range is a separate, recorded gap.
- **Do not infer `2026-11-25` from its weekday.** Either a citation exists (step 2) or the date stays
  `UNKNOWN` and the measurement moves.
- **Do not claim a session-qualified verdict from an elapsed-qualified read.** `LEGACY_ELAPSED_UNQUALIFIED`
  is a label that must survive into any summary.
- **No thresholds, no acceptance.** W06 stays IN PROGRESS; θI and the W20 thresholds are untouched.

---

## 9. Recommended next action and status

**Recommended next action:** perform **step 2 only** — retrieve and record a citable official source for
the target measurement date's NSE status. It is a single retrieval, needs no credential, spends no vendor
request, and it is the one input that currently blocks everything in Arena's lane. If it succeeds,
steps 3–5 follow in the same working session; if it fails, the date stays `UNKNOWN` and the measurement
moves to the next date with a retrievable citation rather than being assumed.

**W06 status: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** Unchanged by this document. Of the seven
recorded acceptance requirements, R1 and R2 are met as measured for one instrument, R5 and R6 hold, R4
has one live `UNAVAILABLE` case, and **R3 (same-revision reconciliation) and R7 (aggregate coverage)
remain open**, together with the 1-of-64 identity bound that no calendar work can move.

---

## 10. Related records

- [W06 AGI quote and freshness observations](IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md) — the two observations this plan measures beyond
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md) — calendar activation, route table, maintenance procedure
- [D-3 market-closed freshness decision](IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md) — accepted calendar limits and bhavcopy corroboration pattern
- [W06 broker import and holding identity reconciliation](IIPS-W06-BROKER-IMPORT-HOLDING-IDENTITY-RECONCILIATION-2026-11-18.md) — the 1-of-64 identity bound
- [IPD P5 — read-only freshness status](../../docs/IPD-P5-FRESHNESS-HTTP.md) — the read this plan sequences
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 and W-22 status
