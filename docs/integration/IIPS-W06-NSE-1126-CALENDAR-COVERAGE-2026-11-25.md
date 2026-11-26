# W06 — NSE calendar coverage prepared for 26 November 2026

**Date:** 2026-11-25 (authoring moment **16:11 IST**; see §2.1, which the whole forward-row decision depends on).
**Scope:** NSE cash-equity calendar only. **BSE is not touched.** `.1` and `.2` are not edited.
**Result:** a new immutable snapshot `calendars/ipd-equity-2026.v2026-11-26.3.json` carries explicit NSE rows for
every date **2026-11-20 … 2026-11-26**, so the next AGI quote + freshness measurement can be session-qualified for
**Thursday 26 November 2026** instead of failing closed with `MISSING_COVERAGE`.

**W06 status: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** Unchanged by this document. This work closes a *calendar*
gap; it does not close an acceptance requirement (R3 same-revision reconciliation and R7 aggregate coverage remain
open, as does the 1-of-64 identity bound).

---

## 1. What this work is and is not

| | |
|---|---|
| **Is** | An NSE-only extension of an existing published snapshot, using the **same accepted bounded model** already applied to BSE and to 2026-11-01…11-19, with per-row provenance. |
| **Is** | The removal of a blocker: `.2` has **no NSE row for 26 November**, so any session-aware read on that date returns `MISSING_COVERAGE`. That is now fixed for the whole 20–26 November window. |
| **Is not** | A quotation of a dated post-session artifact for every date. Two dates cannot have one yet, or no longer have a retrievable one — §2 grades each date honestly. |
| **Is not** | An acceptance act, a threshold change, a BSE change, or evidence about any instrument's price. |
| **Is not** | A live request. **No vendor request was issued** to produce this document. |

## 2. The five dates, by evidence grade

Preserved from `.2` and **not re-derived**: `2026-11-24` is `CLOSED` / `EXCHANGE_HOLIDAY`
("Prakash Gurpurb Sri Guru Nanak Dev"), already sourced.

The authoritative closure lists are now available in machine-readable form, and they are the primary basis:

- `GET /api/holiday-master?type=trading` → **`CM`** (capital-market) segment lists **20** 2026 closures, of which
  **16** fall on weekdays. **20, 23, 25 and 26 November are absent.**
- The `CM` weekday set is **identical** to the 16 NSE `EXCHANGE_HOLIDAY` rows already in `.2` — an independent
  cross-check that this master and the snapshot describe the same year.
- Bounded circular review `01-11-2026 … 26-11-2026`, `dept=CMTR`: mock sessions (7 / 14 / **21** November), revised
  CAS modalities, eOFS mock bidding, EOD bhavcopy dissemination. **No closure and no additional live weekend
  session.** `dept=MSD` returned empty.

| Date | Weekday | Status | Grade | Basis |
|---|---|---|---|---|
| 2026-11-20 | Friday | `OPEN` | `NOT_A_DECLARED_HOLIDAY_NO_DATED_ARTIFACT_OBSERVED` | Not in the closure master; no closure circular. **Not** evidenced by its own dated report — see §2.2. |
| 2026-11-21 | Saturday | `CLOSED` | `WEEKEND_RULE` | Accepted weekend rule. The 19-Nov CMTR mock circular concerns a **mock**, not a live session. |
| 2026-11-22 | Sunday | `CLOSED` | `WEEKEND_RULE` | Accepted weekend rule. |
| 2026-11-23 | Monday | `OPEN` | `DATED_REPORT_ARTIFACT` | Dated reports observed for 23-Nov-2026: `C_VAR1_23112026_1..6.DAT`, `Daily_Settlement_Statistics_23112026.doc`, `CM_52_wk_High_low_23112026.csv`, `FCM_INTRM_BC23112026.DAT`, `SLBM_BC_23112026.DAT`, `ind_close_all_23112026.csv`, `BhavCopy_NSE_CM_0_0_0_20261123_F_0000.csv.zip`. |
| 2026-11-25 | Wednesday | `OPEN` | `DATED_REPORT_ARTIFACT` | Dated reports observed for 25-Nov-2026: `C_VAR1_25112026_1..5.DAT`, `Daily_Settlement_Statistics_25112026.doc`, `CM_52_wk_High_low_25112026.csv`, `FCM_INTRM_BC25112026.DAT`, `shortselling_25112026.csv`, `APPSEC_COLLVAL_25112026.csv`. |
| 2026-11-26 | Thursday | `OPEN` | `NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION` | Not in the closure master; no closure circular. **Forward row** — §2.1. |

### 2.1 Why "26-Nov-2026: No Report." is not a closure signal

At retrieval the daily-report inventory showed **`No Report.`** for 26-Nov-2026. That looks like adverse evidence and
is not. The authoring moment was **2026-11-25 16:11 IST**, i.e. *after* the 25 November close and *before* the
26 November session has happened at all. NSE publishes these reports **after** the session, so a dated 26 November
report **cannot exist yet**. The blank entry is a timing artifact of observing a forward date, not evidence that the
exchange will not trade.

This is the one row in the snapshot whose subject matter is in the future. It is therefore recorded as a **forward
row** with that fact written into the row's own `source`, and the snapshot carries an explicit `residualRisk` note:
if a closure or special session were announced after 16:11 IST on 25 November, this row would be wrong. **Re-confirm
against the day's own post-session reports before relying on it for attribution.**

### 2.2 Why 20 November has no dated artifact

Both 23 and 25 November were provable from dated filenames, because the "current reports" view retains the two most
recent sessions. 20 November is older than that window, so it is no longer in the retention set. The date-filterable
archives (`eq_security`, `display-bulk-and-block-deals`, `historical-trade-statistics-data`,
`advances-declines`) are populated client-side; fetched server-side they all return **`No Records`**, and their
`api/historical/*` endpoints answer "Service Temporarily Unavailable" from this environment. The bulk-deals archive
returned 18 November rows and truncates at 70 records, well before 20 November.

A control test settled how to read this: `nsearchives` returns **HTTP 500 even for a file that is visibly linked** on
the page (`top10nifty50_231126.csv`, 0.36 KB). **A 500 there is a transport failure in my environment, not evidence
that an artifact is absent.** So 20 November is recorded as *not a declared holiday, no dated artifact observed* —
an **absence of retrieval**, never an *observation of absence*. It is **not** upgraded to the 23/25 grade.

### 2.3 What was deliberately not done

No date was marked `OPEN` because it is a weekday. Each row cites either a dated artifact (23, 25), the closure
lists plus the accepted model (20, 26), or the weekend rule (21, 22). No `UNKNOWN` row was needed, because no date
in the window remains unresolved *as a calendar fact* — the residual uncertainty for 20 and 26 is about *artifact
availability*, and that uncertainty is recorded in the grade rather than laundered into the status.

## 3. The snapshot

`calendars/ipd-equity-2026.v2026-11-26.3.json` — `version: "2026-11-26.3"`.

| Property | Value |
|---|---|
| Rows | **74** (was 68 in `.2`): NSE **40**, BSE **34** |
| NSE `continuousCoverage` | `2026-11-01 … **2026-11-26**` |
| BSE `continuousCoverage` | `2026-11-01 … 2026-11-19` — **unchanged, not extended** |
| NSE intervals on the new `OPEN` rows | `09:15–15:35` + `15:50–16:00` IST (the already-accepted envelope) |
| New provenance fields | `evidenceGrade` on the six added NSE rows; `qualification.coverageExtension`; 4 new `sources` entries |
| `.1` / `.2` | **byte-identical to before**; not edited |
| BSE rows | **byte-identical to `.2`** (asserted by `deepEqual`) |
| Every one of the 68 `.2` rows | **survives byte-for-byte in `.3`** (asserted) |

The version string is `2026-11-26.3`, not `.2`-derived, so it can never be confused with, or mistaken for an
in-place edit of, the published `.1`/`.2`. `.3` was chosen over a `2026-11-19.3` style because the meaningful change
is the new coverage end date, and the repository already versions by the date the snapshot speaks to.

## 4. Validation actually performed

- `parseTradingCalendar(.3)` — accepts; object frozen; `version` `2026-11-26.3`; **74** rows.
- **Continuity:** all **26** dates `2026-11-01 … 2026-11-26` have an NSE row, every one `OPEN`/`CLOSED`, no gap and
  no `UNKNOWN`.
- **BSE untouched:** the 34 BSE rows `deepEqual` those of `.2`.
- **No silent rewrite:** all 68 `.2` rows and every overlapping `.1` row survive byte-for-byte.
- **Load-bearing:** `.2` still yields `MISSING_COVERAGE` for 26 November, so the extension is genuinely required.
- **26 November age matrix** (read at `16:37 IST`): `asOf` `15:30`→**900 s**, `15:32`→780, `15:34`→660,
  `15:53`→420, `15:58`→120 — all **`GOOD`**, `sessionState: CLOSED`. Confirms session age **freezes at close**, so
  a post-close read can still be session-qualified.
- **Fail-closed retained:** `09:14:59` (pre-open), `15:35:30` and `15:40` (the `15:35–15:50` transition gap) all
  yield `INVALID_OBSERVATION` on 26 November.
- **Regression:** `tests/w22_nse_1126_coverage.test.ts` — **6/6 pass**.
- **Full suite:** `npm test` → **2185 executed, 2171 passed, 0 failed, 14 skipped** (was 2179; **+6**, no failures).
- `tsc --noEmit` clean; `git diff --check` clean.
- Standing W06 verifiers re-run and **unchanged**: quote **26/26**, freshness **27/27**.
- Nothing under `evidence/` or `calendars/ipd-equity-2026.v2026-11-19.{1,2}.json` modified.

I also had to correct two of my own test assertions during this work — I had assumed `09:15:00` was outside the
session (it is the declared open) and that a prior-session quote would be rejected on the next date (it accumulates
to `STALE`). Both were test bugs, not snapshot bugs, and the tests now assert the real semantics.

## 5. What this does and does not unlock for the 26 November measurement

**Unlocked.** The calendar blocker for a 26 November session-qualified read is gone. With the daemon started on this
snapshot, a `GET /v1/freshness` for a 26 November quote can return `calendarMode: SESSION_CALENDAR_CONFIGURED` and a
session-qualified assessment, instead of `MISSING_COVERAGE`.

**Still required, and not done here.** The rule that made the earlier attempt unusable is unchanged: a
session-qualified `GOOD` needs a **new** quote request whose `asOf` sits in a declared interval, and a freshness read
within `900` open-session seconds of it. The old pair cannot be retrofitted — the daemon reads the calendar **once at
startup** (`dhan_local_daemon.ts:541`), the cache is **in-memory**, and the existing observation is frozen at
`2731.174 s`, so re-reading it returns `UNAVAILABLE` forever. A **new** observation therefore needs its own
authorization; **the existing AGI quote request must not be repeated** to manufacture one.

**Validity window for the target date** (unchanged, now merely *reachable*): `asOf` in **15:30–15:35** (CAS) or
**15:50–16:00** (closing session) IST; `15:35–15:50` and after `16:00` are `INVALID_OBSERVATION`; read on the **same
IST date** as the quote.

## 6. Honest limits

- **The forward row is the only unproven status in the file.** 26 November is `OPEN` because it is not a declared
  closure and the exchange has announced none — not because a session artifact exists. That is the correct grade of
  confidence for a date that has not arrived, and it is labelled as such rather than presented as dated evidence.
- **20 November rests on the closure lists, not on a dated report.** If a same-day special session or closure had
  been announced outside the circular index I could reach, the row would be wrong; the bounded CMTR/MSD review found
  none, but the review is bounded and the archives are not exhaustively readable from here.
- **BSE remains at 19 November.** Unchanged gap, deliberately not papered over by copying NSE.
- **Not extended to 27 November.** Coverage ends exactly where the next measurement needs it. A measurement that
  slips past 26 November will need another extension, and the read date must match the quote date.

## 7. What / Who / How / When

| # | What | Who | How | When |
|---|---|---|---|---|
| 1 | Retrieve authoritative closure lists; grade each date in 20–26 Nov | Arena | `holiday-master` `CM`, holiday page, bounded CMTR/MSD circulars, dated report inventory | **Done** |
| 2 | Write NSE-only `.3` snapshot; leave `.1`/`.2`/BSE untouched | Arena | Explicit rows for all six added dates, per-row `evidenceGrade`, `coverageExtension`, 4 new sources | **Done** |
| 3 | Validate + regress | Arena | Parser accept, continuity, BSE `deepEqual`, `.2` byte-survival, age matrix, fail-closed, 6 new tests, full suite | **Done** |
| 4 | Commit / push / PR | Arena | One commit, PR from this branch | **Done** |
| 5 | Re-confirm the 26 Nov row against that day's own post-session reports | Operator | Same inventory, on/after 2026-11-26 close | **2026-11-26 after close** |
| 6 | Copy `.3` to the Windows host; set `IIPS_TRADING_CALENDAR_PATH`; start the daemon (calendar read once at startup) | **Operator** | Existing start script, per W-11 runbook | **Before the 26 Nov measurement** |
| 7 | New authorized quote request + `GET /v1/freshness` in a valid window | **Operator** | Per record §7.5 / §8 sequence | **2026-11-26, `asOf` 15:30–15:35 or 15:50–16:00 IST; read same date** |
| 8 | Record the new observation as its own versioned evidence | Arena | New record + verifier, no reuse of the 25 Nov pair | **After step 7** |

Steps 5–7 are Windows-host / operator actions. **I did not perform them and do not claim to have.** No live request
was issued in this work.

## 8. Is the calendar ready for the 26 November measurement?

**Yes — NSE coverage for 2026-11-26 is now present and valid, and the `MISSING_COVERAGE` blocker is cleared.**
Two caveats travel with that "yes":

1. The 26 November row is a **forward row**; re-confirm it against that day's own reports (step 5) before relying on
   it for attribution.
2. Being *ready* is not being *measured*. The observation itself (steps 6–7) is unauthorized-so-far operator work,
   and it needs a **new** quote request — never a repeat of the existing one.

## 9. Related records

- [W06 AGI quote and freshness observations](IIPS-W06-AGI-QUOTE-OBSERVATION-EVIDENCE-2026-11-25.md) — the two observations, §7.5 sequence
- [W06 calendar and AGI freshness execution plan](IIPS-W06-CALENDAR-AND-AGI-FRESHNESS-EXECUTION-PLAN-2026-11-25.md) — the plan this executes
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md) — calendar activation and maintenance
- [D-3 market-closed freshness decision](IPD-D3-MARKET-CLOSED-FRESHNESS-DECISION-BLOCKER-2026-11-19.md) — accepted calendar limits
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 and W-22 status
