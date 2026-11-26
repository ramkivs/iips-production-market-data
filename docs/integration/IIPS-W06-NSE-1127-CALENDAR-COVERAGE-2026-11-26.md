# W06 — NSE calendar coverage extended through 27 November 2026

**Date:** 2026-11-26 (authoring moment **23:08 IST** / **17:38 UTC**; see §2.1 on forward-session grading).
**Scope:** NSE cash-equity calendar only. **BSE is not touched.** Immutable snapshots `.1`, `.2`, and `.3` are not
edited, and all 74 prior rows from `.3` survive byte-for-byte.
**Result:** a new immutable snapshot `calendars/ipd-equity-2026.v2026-11-27.4.json` (`version: "2026-11-27.4"`,
**75** rows) extends explicit NSE continuous coverage through **Friday, 27 November 2026** (`2026-11-01 … 2026-11-27`),
so session-aware reads targeting 27 November 2026 evaluate deterministically instead of failing closed with
`MISSING_COVERAGE`.

**W06 status: IN PROGRESS — NOT COMPLETE, NOT ACCEPTED.** Unchanged by this document. Extending the trading calendar
clears a coverage prerequisite; it does not close any W06 acceptance criterion, does not modify W-22's accepted `.2`
scope, does not touch the Windows host, and issues no live market-data request.

---

## 1. What this work is and is not

| | |
|---|---|
| **Is** | A single-day NSE-only extension on top of `2026-11-26.3`, under the same accepted bounded calendar model, with explicit per-row provenance and SHA-256 verification. |
| **Is** | Backed by direct primary NSE/NCL exchange evidence retrieved at `2026-11-26 23:08 IST` — not weekday inference. |
| **Is not** | A rewrite of any prior snapshot or prior row. `.1`, `.2`, and `.3` are byte-identical, all 74 prior rows (including `2026-11-24` `CLOSED`, `2026-11-21..22` weekend closures, and `2026-11-20`, `23`, `25`, `26` rows) survive verbatim, and BSE remains unchanged at `2026-11-19`. |
| **Is not** | Post-session proof that 27 November 2026 has already traded — at `2026-11-26 23:08 IST` that session has not yet opened, so the row is honestly graded as a forward session with residual risk. |
| **Is not** | A W06 acceptance act, a freshness-threshold change, a runtime code change, a host activation, or a live Dhan request. |

---

## 2. Official exchange evidence establishing Friday, 27 November 2026 status

No date was marked `OPEN` merely because 27 November 2026 is a Friday. Status rests on three converging lines of
directly retrieved official NSE / NSE Clearing evidence (retrieved `2026-11-26 23:08–23:10 IST`):

### 2.1 Closure lists, standing timings, and bounded circular review

1. **Annual 2026 Capital Market Holiday Circular (`NSE/CMTR/71775`, Ref `172/2025`, `2025-12-12`):**
   `https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf` — directly re-verified. November weekday closures
   are `10-Nov-2026` (Diwali-Balipratipada) and `24-Nov-2026` (Prakash Gurpurb Sri Guru Nanak Dev); next closure is
   `25-Dec-2026` (Christmas). **27 November 2026 is not a declared holiday.**
2. **Machine-readable 2026 Trading Holiday Master:**
   `https://www.nseindia.in/api/holiday-master?type=trading` (`CM` Capital Market segment) — lists exactly **20**
   entries (16 weekday closures matching `.2`/`.3` identically + 4 weekend entries). **27-Nov-2026 is absent.**
3. **Official Market Timings & Holidays Page:**
   `https://www.nseindia.com/resources/exchange-communication-holidays` (page timestamp `26 Nov 2026 | 23:08 (IST)`) —
   Equities Trading Holidays table lists the same 16 weekday closures (`24-Nov-2026` Sr. 15, `25-Dec-2026` Sr. 16;
   `27-Nov-2026` absent from both Trading Holidays and Clearing Holidays). Standing Equities Market Timings remain
   unchanged:
   - Regular trading session: `09:15–15:30 IST`
   - Closing Auction Session (CAS) order matching & confirmation: `15:30–15:35 IST` (transition `15:35–15:50 IST` excluded)
   - Closing session: `15:50–16:00 IST`
4. **Bounded circular review through `27-11-2026`:**
   - `https://www.nseindia.in/api/circulars?fromDate=01-11-2026&toDate=27-11-2026&dept=CMTR` — 7 circulars (`NSE/MSD/77581`
     dated `2026-11-24` through `NCL/CMPT/77231` dated `2026-11-02`); `fromDate=26-11-2026&toDate=27-11-2026&dept=CMTR`
     returned empty `[]`.
   - `https://www.nseindia.in/api/circulars?fromDate=01-11-2026&toDate=27-11-2026&dept=MSD` — returned empty `[]`.
   - Unfiltered `https://www.nseindia.in/api/circulars?fromDate=25-11-2026&toDate=27-11-2026` (all departments, all 4
     chunks reviewed) — **zero closure notices, zero holiday amendments, zero special-session or timing-change
     circulars covering 27 November 2026.**

### 2.2 Affirmative dated 26 November 2026 NSE/NCL operational notices scheduling 27 November trading

- **`NSE/CML/77632`** (Ref `2134/2026`, dated `2026-11-26`, `https://nsearchives.nseindia.in/content/circulars/CML77632.pdf`):
  notifies 9 equity further issues (`ABCAPITAL`, `CREDITACC`, `GREENPLY`, `HEROMOTORS`, `ICICILIFE`, `INOXINDIA`,
  `MHRIL`, `POONAWALLA`, `VIYASH`; Series `EQ`) *"further admitted to dealings on the National Stock Exchange (Capital
  Market segment) with effect from November 27, 2026"* (*"This circular shall be effective from November 27, 2026."*).
- **`NSE/CML/77624`** (Ref `2130/2026`, dated `2026-11-26`, `https://nsearchives.nseindia.in/content/circulars/CML77624.pdf`):
  notifies equity shares of Aurum PropTech Limited (`AURUM`, Series `EQ`) admitted to dealings on the Capital Market
  segment *"with effect from November 27, 2026"*.
- **NSE Listing Press Release (`PR_List_26112026_20261126185758.pdf`, Mumbai, `2026-11-26`):**
  `https://nsearchives.nseindia.in//web/pressrelease/2026-11/PR_List_26112026_20261126185758.pdf` — announces IPO equity
  shares of Mahanadi Coalfields Limited (`MAHACOAL`, Series `EQ`) and SME-IPO Watrana Rentals Limited (`WATRANA`, Series
  `ST`) listed and admitted to dealings *"w.e.f. November 27, 2026. Trading shall be in the Normal Market segment –
  Compulsory Demat (Rolling Settlement) for all investors."*
- **`NCL/CMPT/77621`** (NSE Clearing Limited, Ref `0420/2026`, dated `2026-11-26`, `https://nsearchives.nseindia.in/content/circulars/CMPT77621.pdf`):
  Tender Offer Settlement Calendar `2026142` (Medi Assist Healthcare Services Limited buyback) sets **`Trade Start date:
  27-NOV-2026`**.

### 2.3 Dated pre-session / begin-of-day NSE equities reports for 27 November 2026

Under `https://www.nseindia.in/all-reports` (retrieved `2026-11-26 23:08 IST`), Equities & SME **`Reports for
27-Nov-2026`** already publishes dated operational begin-of-day files:

- `C_VAR1_27112026_1.DAT` (VaR Begin Day File, `1.06 MB`)
- `eq_band_changes_27112026.csv` (Price Band changes from next trade date, `0.35 KB`)
- `sme_bands_complete_27112026.csv` (SME-Band-Complete, `26.26 KB`)

Because the 27 November 2026 trading session has not yet opened at `2026-11-26 23:08 IST`, post-session trading
artifacts (`BhavCopy_NSE_CM_0_0_0_20261127_F_0000.csv.zip`, `C_VAR1_27112026_2..6.DAT`,
`Daily_Settlement_Statistics_27112026.doc`, `ind_close_all_27112026.csv`) cannot exist yet (and the Indices block
correctly displays `No Report.` for `27-Nov-2026`). Accordingly, `2026-11-27` retains the honest forward-session grade
**`NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION`** and carries an explicit `residualRisk` requiring post-session
re-confirmation once the 27 November 2026 session closes.

### 2.4 Post-close re-confirmation of prior forward row (26 November 2026)

As required by `.3`'s `residualRisk` note, an independent post-close check at `2026-11-26 23:08 IST` confirmed that the
Thursday, 26 November 2026 NSE Capital Market session occurred as scheduled:

- `https://www.nseindia.in/api/marketStatus`: Capital Market `Closed`, `tradeDate: "26-Nov-2026 15:30"`, `NIFTY 50`
  close `25,884.50` (`+65.25` / `+0.25%`).
- `https://www.nseindia.in/all-reports`: complete post-session `26-Nov-2026` block published, including
  `C_VAR1_26112026_1..6.DAT`, `BhavCopy_NSE_CM_0_0_0_20261126_F_0000.csv.zip`,
  `Daily_Settlement_Statistics_26112026.doc`, `FCM_INTRM_BC26112026.DAT`, `CM_52_wk_High_low_26112026.csv`,
  `sec_bhavdata_full_26112026.csv`, `ind_close_all_26112026.csv`, and `top10nifty50_261126.csv`.

This re-confirmation is recorded in `.4`'s `qualification.coverageExtension.nse.priorForwardRowReconfirmation` and
`sources` (`NSE-DATED-REPORTS-20261126`), while **the `2026-11-26` row itself is preserved byte-for-byte from `.3`**
so that no previously accepted calendar row is silently rewritten.

---

## 3. Classification, snapshot structure, and SHA-256 integrity

| Property | Value |
|---|---|
| Snapshot path | `calendars/ipd-equity-2026.v2026-11-27.4.json` |
| `schemaVersion` / `id` / `version` | `1` / `IPD-EQUITY-2026-BOUNDED` / `"2026-11-27.4"` |
| Rows | **75** (was 74 in `.3`): NSE **41**, BSE **34** |
| Added row | `NSE` `2026-11-27` — `OPEN`, `dayKind: "ORDINARY_TRADING_DAY"`, `evidenceGrade: "NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION"`, sessions `09:15:00+05:30–15:35:00+05:30` and `15:50:00+05:30–16:00:00+05:30` |
| NSE `continuousCoverage` | `2026-11-01 … 2026-11-27` (27 consecutive explicit dates, zero gaps, zero `UNKNOWN`) |
| BSE `continuousCoverage` | `2026-11-01 … 2026-11-19` — **unchanged, not extended** |
| Preserved rows | All **74** `.3` rows, all **68** `.2` rows, all overlapping `.1` rows, and all **34** BSE rows survive **byte-for-byte** (`deepEqual`) |
| Sources register | **33** entries: all **22** `.3` entries preserved verbatim + **11** `2026-11-26`-retrieved authoritative NSE entries |

### Immutable snapshot SHA-256 digests

| Snapshot | Status | SHA-256 |
|---|---|---|
| `calendars/ipd-equity-2026.v2026-11-19.1.json` | Untouched (immutable) | `56a39d28f7d3d0883eb7d432758d2948d1be131b75a1e3c457ca11eb21f5e345` |
| `calendars/ipd-equity-2026.v2026-11-19.2.json` | Untouched (immutable; accepted W-22 baseline) | `b7cc69ddbffd826d7bf37f42a3fae1e8c9f1a65964f13fe6a88f3d5994a650ff` |
| `calendars/ipd-equity-2026.v2026-11-26.3.json` | Untouched (immutable) | `d1749bc09c26cd2f63a1e9208c654735b49e1b93e0a7960e62510116cb24ee43` |
| `calendars/ipd-equity-2026.v2026-11-27.4.json` | **New immutable snapshot** | `cece6d8f657617ca157782271782962c90982d0e7235cf3bc482dad66a50286a` |

---

## 4. Validation and test results

- **Schema & parser:** `parseTradingCalendar(.4)` accepts and freezes; `version: "2026-11-27.4"`; **75** rows (`41` NSE,
  `34` BSE); chronological ordering per exchange and unique source IDs verified.
- **Immutability & preservation:** exact SHA-256 assertions for `.1`, `.2`, `.3`, and `.4`; byte-for-byte `deepEqual`
  survival of all 74 `.3` rows (including `2026-11-24` `CLOSED` holiday, `2026-11-21..22` weekend closures, and
  `2026-11-20`, `23`, `25`, `26` provenance), all 34 BSE rows, and all 22 prior `sources` entries.
- **Load-bearing 27 November freshness matrix** (evaluated at `2026-11-27T16:37:00+05:30`): `asOf` `15:30`→`900 s`,
  `15:32`→`780 s`, `15:34`→`660 s`, `15:53`→`420 s`, `15:58`→`120 s` — all `GOOD`, `sessionState: CLOSED`,
  `calendarIssue: undefined`. Both `.3` and `.2` fail closed with `MISSING_COVERAGE` on `2026-11-27`.
- **Fail-closed boundaries retained:** `09:00:00`, `09:14:59`, `15:35:30`, `15:40:00`, and `16:00:01` IST on `2026-11-27`
  return `INVALID_OBSERVATION`; a prior-day `2026-11-26T15:30:00+05:30` quote evaluated at `2026-11-27T09:20:00+05:30`
  accumulates open-session age to `STALE`; uncovered Saturday `2026-11-28` remains `MISSING_COVERAGE`.
- **Typecheck, build, and package verification:**
  - `npx tsc --noEmit --pretty false` — **PASS**
  - `npm run build` — **PASS**
  - `npm run test:package-consumer` — **PASS** (`233` packed files, `forbiddenHits: []`, strict declarations & 5 verbatim
    IRR importers PASS)
- **Focused calendar test suites:**
  - `tests/w22_nse_1127_coverage.test.ts` — **7/7 PASS** (UTC and `TZ=America/New_York` both **7/7 PASS**)
  - Combined calendar suite (`w22_nse_1127_coverage`, `w22_nse_1126_coverage`, `w22_bse_bounded_calendar`,
    `w22_real_calendar`, `w22_session_freshness`) — **39/39 PASS**
- **Standing W06 offline verifiers (unchanged):**
  - `verify-w06-agi-evidence.mjs` — **26/26 PASS**
  - `verify-w06-agi-freshness.mjs` — **27/27 PASS**
- **Full IPD test suite (`npm test`, 177 files, 2,381 executed on `main` `aeb0934`):**
  - **2,367 passed, 14 skipped, 0 failed** (`[test-guard] OK — 2381 test(s) executed, 2367 passed, exit 0`).

---

## 5. Honest limits and next operator steps (not performed here)

- **Forward row:** `2026-11-27` had not yet occurred at authoring time (`2026-11-26 23:08 IST`). Re-confirm against
  post-session `27-Nov-2026` NSE reports (Bhavcopy, `C_VAR1_27112026_1..6.DAT`, `Daily_Settlement_Statistics_27112026.doc`,
  `ind_close_all_27112026.csv`) after market close before relying on it for attribution.
- **BSE unchanged:** BSE continuous coverage remains `2026-11-01 … 2026-11-19`.
- **Not extended beyond 27 November 2026:** `2026-11-28` and later dates remain `MISSING_COVERAGE` by design.
- **No host/live actions:** `.4` has not been deployed to any Windows host, `IIPS_TRADING_CALENDAR_PATH` has not been
  modified, no daemon was restarted, and no live Dhan API request was sent.

---

## 6. Related records

- [W06 NSE 26 November calendar coverage](IIPS-W06-NSE-1126-CALENDAR-COVERAGE-2026-11-25.md) — prior `.3` extension
- [W06 calendar and AGI freshness execution plan](IIPS-W06-CALENDAR-AND-AGI-FRESHNESS-EXECUTION-PLAN-2026-11-25.md)
- [W-11 daemon configuration and operations](DHAN-W11-IPD-DAEMON-CONFIGURATION-AND-OPERATIONS.md)
- [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) — W06 and W-22 status
