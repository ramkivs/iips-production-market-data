# D-5 Follow-up B — execution and completion record — one-sided zero-filled book

- **Work item:** **D-5 Follow-up B** — Normalize one-sided market depth (BLK-1 follow-up, 26 Nov Reliance live capture)
- **Repository:** IPD (`ramkivs/iips-production-market-data`)
- **Decision authority:** Programme Authority — Ramki
- **Implementation owner:** IPD
- **Branch:** `arena/f93e947f-iips-production-market-data`
- **Date:** 26 November 2026
- **Governing decision:** **Addendum B** to D-5, recorded as **§8** of `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md`
- **Live vendor request made by this work item:** **no.** The verification reads evidence already retained in the repository (`evidence/dhan-d18/reliance-depth-20261126.json`). No credential was read or used.
- **Status:** **IMPLEMENTED AND VERIFIED.** See §7 for the exact scope of that claim.

---

## 1. The defect being closed

D-5 Addendum A (25 Nov 2026) classified an **entirely zero-filled 5×5 book** as an absent market book. It kept the predicate narrow: both sides had to be zero-filled (`isEntirelyZeroFilledBook` requires `buy` and `sell` non-empty arrays with every level `{price:0,quantity:0,orders:0}`), because the only evidence then was the symmetric 23 Nov Reliance capture (`reliance-depth-20261123.json`, SHA `3fb343db…b68e`, 2026-11-23T10:01:24.819Z = 15:31:24 IST).

A new live capture shows the vendor also emits a **one-sided zero-filled book**:

`evidence/dhan-d18/reliance-depth-20261126.json` (SHA `dd89ed2b…920f3d`, captured `2026-11-26T16:37:12.539Z` = 22:07:12 IST, `httpStatus:200`, `responseStatus:\"success\"`, `segment:\"NSE_EQ\"`, `securityId:\"2885\"`) carries:

- **buy** 5 levels: every one `{price:0, quantity:0, orders:0}`, every field `state:\"present\"`;
- **sell** 5 levels: L1 `{price:1396.2, quantity:8767, orders:32}` then 4×`{price:0,quantity:0,orders:0}`.

Under Addendum A that response is `MALFORMED_RESPONSE`: `topOfBook(buy)` sees L1 price 0 → `invalid` → `dhanFailure`. The response is not malformed — the buy side has no market, the sell side has a real top-of-book, and trailing zeros are the vendor's encoding of unavailable depth after the last real level. Every ordinary intraday quote with one-sided depth would fail closed. The defect was introduced by the narrow whole-book predicate, not a protection it provides.

## 2. The decided interpretation

> An order-book side on which **every level is `{price:0,quantity:0,orders:0}`** represents an **ABSENT MARKET BOOK on that side**. Classification is **per side and independent**. **Trailing zero-filled levels after a valid top-of-book are normalised away before strict validation.**

Consequences, all binding:

| # | Requirement |
|---|---|
| B-1 | The per-side condition is classified **ABSENT** (`absentMarketBook`), never `MALFORMED_RESPONSE`. |
| B-2 | One-sided book (`buy` 5×0 / `sell` 1396.2+4×0 per D18 26 Nov capture) publishes `bid:null, ask:1396.2` **per side and independent**, quote remains **VALID**. |
| B-3 | Entire 5×5 zero-filled book remains valid (`bid:null, ask:null`) — it now satisfies the per-side condition on both sides, subsuming the whole-book predicate. |
| B-4 | Trailing zero-filled levels after a valid L1 are discarded before validation: `1396.2` +4×`{0,0,0}` still → `ask:1396.2`. Only trailing *entirely* zero-filled levels are stripped; mixed levels (`price:0` + positive qty/orders) are not zero-filled and stay malformed. |
| B-5 | Validation of individually malformed or invalid supplied levels is unchanged: zero with positive qty/orders, negative, non-finite, non-numeric, missing price → still `MALFORMED_RESPONSE`. |
| B-6 | `null` means unavailable; no `0` sentinel; no LTP fabrication; D01 `2.0.0` and envelope `1.0.0` unchanged. |

The boundary is deliberately narrow: a side is zero-filled only when **every** level on that side is exactly `{0,0,0}` as numbers. `NaN`, `Infinity`, `-Infinity`, `'0'`, `-1`, or a missing field does not qualify. A mixed level `{price:0, quantity:5, orders:1}` is malformed, not unavailable. This preserves D-5 decision 2.

## 3. Files modified

| File | Change |
|---|---|
| `src/providers/dhan/dhan_normalizer.ts` | New `isZeroFilledSide(levels)` and `withoutTrailingZeroLevels(levels)`; `topOfBook()` extended to per-side absent-market-book + trailing-zero stripping before strict `price>0 && finite` check; call site now `topOfBook(depth.buy)` / `topOfBook(depth.sell)` per side; `isEntirelyZeroFilledBook` retained unchanged for documentation. |
| `tests/d5_bid_ask_representation.test.ts` | Updated D5-A6 to expect new correct outcome (Addendum B supersedes Addendum A for mixed one-sided book). New describe block `D-5 Addendum B — one-sided zero-filled book is per-side absent` with **D5-B0…D5-B9** (10 tests), fixture loaded from retained `reliance-depth-20261126.json`. |
| `evidence/dhan-d18/reliance-depth-20261126.json` | **New** retained evidence: one-sided zero-filled book capture (buy 5×0, sell L1 1396.2/8767/32 +4×0), SHA `dd89ed2b…920f3d`, 4878 bytes, 226 lines LF, httpStatus 200 success. |
| `evidence/dhan-d18/manifest.json` | Updated purpose to three captures, added 26 Nov file entry with operatorConfirmed + independentlyVerifiedFileMetadata. |
| `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md` | Header amended to Addendum A+B, §6.2 superseded paragraph updated to per-side + trailing zeros, **Addendum B added as §8** with decision, implementation, tests, verification. |
| `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` | Post-publication status note; D-5 row updated to Addendum B; work-item row 11/BLK-1 note extended; findings left intact. |
| `docs/integration/D-5-FOLLOW-UP-ONE-SIDED-DEPTH-COMPLETION-2026-11-26.md` | This record. |

**Not modified:** `evidence/dhan-d18/reliance-depth-20261123.json` and `reliance-depth-20261125.json` (byte-identical, SHA `3fb343db…b68e` and `6c53e973…a3a`), any contract (`src/contracts/d01_quotes.ts` D01 `2.0.0`), any DTO, any provider qualification path (`SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`), any D114 parser.

## 4. Implementation changes

`isZeroFilledLevel(level)` — unchanged: `price===0 && quantity===0 && orders===0` as numbers; `NaN` is not `0`, `'0'` is not `0`.

`isEntirelyZeroFilledBook(depth)` — retained verbatim for documentation/backwards compatibility. A fully zero-filled 5×5 book still satisfies it, but per-side handling now subsumes it: each side independently satisfies `isZeroFilledSide`.

`isZeroFilledSide(levels)` — new: `Array.isArray(levels) && levels.length>0 && levels.every(isZeroFilledLevel)`. Covers `buy` 5×0 in the 26 Nov capture.

`withoutTrailingZeroLevels(levels)` — new: strips trailing entries that satisfy `isZeroFilledLevel` (e.g. `sell` `1396.2` +4×`{0,0,0}` → `[1396.2]`). Only trailing entirely zero-filled levels are removed; a mixed level (`price:0, qty:5`) is not stripped and will still fail as malformed if it is L1.

`topOfBook(levels)` — extended: (1) no/empty → `absent`; (2) `isZeroFilledSide(levels)` → `absentMarketBook`; (3) `effective = withoutTrailingZeroLevels(levels)`; (4) `effective.length===0` → `absentMarketBook` (all were zero); (5) `price` of `effective[0]` finite >0 → `present`, otherwise `invalid`. No LTP fallback.

Call site — now `bidSide = topOfBook(depth.buy)` and `askSide = topOfBook(depth.sell)` per side; the previous book-level `zeroFilledBook` gate is removed. Each side classifies itself. The `invalid` loop (fields `bid`/`ask`) and payload mapping (`present` → price, otherwise → `null`) are unchanged.

`absentMarketBook` remains distinct from `absent` — different causes (supplied zero-filled side vs no depth supplied) but same wire output `null`; preserved for diagnostics/future session-aware logic.

## 5. Regression tests added

`D5-B0…D5-B9`, all passing:

| Case | Assertion |
|---|---|
| D5-B0 | Entire zero-filled 5×5 book (23 Nov evidence) still → `bid:null, ask:null`, quote valid — preserves Addendum A. |
| D5-B1 | **26 Nov one-sided capture verbatim** (`rawDepth` from `reliance-depth-20261126.json`) → `bid:null, ask:1396.2`, quote valid, LTP intact, no zero sentinel, `D01 2.0.0`, validator `isValid:true`; fails if evidence file removed. |
| D5-B2 | Opposite one-sided book (buy valid, sell 5×0) → `bid:1396.2, ask:null`, valid — per-side independent. |
| D5-B3 | Trailing zeros after valid L1 preserved: `buy` 1520.25+4×0 / `sell` 1520.5+4×0 → `bid:1520.25, ask:1520.5`; one-sided 1396.2+4×0 also preserves 1396.2 — trailing zeros stripped before validation. |
| D5-B4 | Two valid levels followed by trailing zeros still preserves L1 — not swallowed. |
| D5-B5 | Zero price with positive qty/orders (`{price:0, qty:5, orders:1}` +4×0) is NOT zero-filled → still `MALFORMED_RESPONSE`, not laundered to null. |
| D5-B6 | Negative price rejected even with trailing zeros. |
| D5-B7 | Non-finite price (NaN/Infinity) rejected. |
| D5-B8 | Non-numeric (string) price rejected. |
| D5-B9 | One-sided absent never fabricates LTP; unrelated fields (volume, previousClose, ltp, vwap) untouched; payload valid; no `0` sentinel. |

Updated D5-A6: Addendum A required both sides and rejected `buy` 5×0 / `sell` 1520.5+4×0 as `MALFORMED_RESPONSE`; Addendum B supersedes it and now expects `bid:null, ask:1520.5` valid. The test retains the historical assertion as documentation but asserts the new correct outcome.

Existing D-5 malformed-level cases (`D5-06`, `D5-07`, `D5-08`, `D5-08a`, `D5-08b`) unchanged and still pass; D5-A0…A5,A7…A10 unchanged — direct evidence individual-level validation preserved, not relaxed.

## 6. Test execution results

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | completed; `node_modules` restored |
| `node_modules/.bin/tsc --noEmit` | **exit 0** |
| `node_modules/.bin/tsc -p tsconfig.json` (incl. `tsc: not found` wrapper) | **exit 0** |
| `node --test dist/tests/d5_bid_ask_representation.test.js` | **71 tests, 71 pass, 0 fail, 0 skipped** (baseline 61 Addendum A; **+10**) |
| `node --test dist/tests/dhan_depth_capture.test.js` | **41 tests, 41 pass** |
| `npm test` (guarded full suite) | baseline 2,200/2,186/14 Addendum A → **2,210 tests, 2,196 pass, 0 fail, 14 skipped**, guard `OK`, exit 0 (baseline 2,189/2,175/14 pre-D-5; +21 total D-5) |
| `evidence/dhan-d18/` | 3 files SHA-verified; manifest updated |

The 14 skips are the pre-existing host-gated set described in D-5 §6.3 — three pass under CI's `IIPS_POWERSHELL_RUNTIME_TESTS=1`. **No assertion was skipped by this work item** and `# tests` rose by exactly the ten cases added.

## 7. Behaviour verification against the retained raw captures

Run against the compiled normaliser, splicing the **verbatim** `rawDepth` objects into an otherwise ordinary quote body:

| Input | Outcome |
|---|---|
| **D-18 `rawDepth` verbatim 23 Nov (retained evidence, 5×5 zeros)** | **VALID — `bid:null, ask:null`, LTP intact, D01 `2.0.0`, validator `isValid:true`, `errors:[]`** |
| **D-18 `rawDepth` verbatim 26 Nov (retained evidence, buy 5×0 / sell 1396.2+4×0)** | **VALID — `bid:null, ask:1396.2`, LTP intact, D01 `2.0.0`, validator `isValid:true`, `errors:[]`** |
| Opposite verbatim (buy 1396.2+4×0 / sell 5×0) | VALID — `bid:1396.2, ask:null` |
| Valid L1 + trailing zeros on both sides (1520.25+4×0 / 1520.5+4×0) | VALID — `bid:1520.25, ask:1520.5` |
| empty arrays on both sides | VALID — `bid:null, ask:null` |
| no `depth` key at all | VALID — `bid:null, ask:null` |
| one reachable level at the back of the book | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| all-zero buy / priced sell with trailing zeros (pre-B mixed shape) | **now VALID — `bid:null, ask:1520.5`** (Addendum B supersedes Addendum A for this shape) |
| single negative price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single string price level (`'0'`) | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single `NaN` price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| single `Infinity` price level | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| level missing `price` | FAIL-CLOSED — `MALFORMED_RESPONSE` |
| zero price with positive qty/orders (`price:0, qty:5, orders:1`) | FAIL-CLOSED — `MALFORMED_RESPONSE` (not zero-filled) |

## 8. Acceptance criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| **D5-F1b** | Addendum B records the per-side interpretation | **MET** | D-5 record §8, Addendum B; §6.2 cross-reference; header amended |
| **D5-F2b** | `topOfBook()` recognises the per-side zero-filled book as absent (per side) + trailing zeros stripped | **MET** | New `isZeroFilledSide` + `withoutTrailingZeroLevels`; per-side `topOfBook`; D5-B0…B4 |
| **D5-F3b** | Reliance 26 Nov one-sided capture no `MALFORMED_RESPONSE`, `bid:null, ask:1396.2/8767/32`-priced, valid quote | **MET** | D5-B1 verbatim `rawDepth` probe + `evidence/dhan-d18/reliance-depth-20261126.json` SHA `dd89ed2b…920f3d` |
| **D5-F3b-opposite** | Opposite one-sided book works: `bid:1396.2, ask:null` | **MET** | D5-B2 |
| **D5-F3b-full** | Full zero (5×5) still `null/null` valid | **MET** | D5-B0, D5-A1 |
| **D5-F4b** | Malformed individual levels still fail (zero+qty, negative, non-finite, string, missing) | **MET** | D5-B5…B8, D5-B9, D5-06/07/08/08a/08b unchanged; D5-A5,A7,A8; nine fail-closed rows in §7 |
| **D5-F5b** | Regression fixture covers the retained D-18 26 Nov one-sided response | **MET** | D5-B1 loads `evidence/dhan-d18/reliance-depth-20261126.json` and fails if would fall back; SHA `dd89ed2b…920f3d` |
| **D5-F6b** | Full relevant suite passes, counts recorded | **MET** | 71/71 D-5 file; 2,210/2,196/0/14 guarded suite; 41/41 depth capture; tsc 0 (§6) |
| **D5-F7b** | `providerQualification` unchanged | **MET** | Still `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` at every site; no qualification identifier in diff |
| **D5-F8b** | No LTP fabrication, no sentinel, D01 `2.0.0`/envelope `1.0.0` narrow scope preserved | **MET** | D5-B9, D5-29/B-1; D5-27/27a/41/42; `src/contracts/d01_quotes.ts` untouched |

## 9. Scope of the claim

**Implementation complete; evidence complete; formal acceptance of D-5/B is the Programme Authority's to give**, and this record does not presume it. What is established here is that the decision as communicated is implemented as stated, tested at the seam the vendor actually exercises, and that nothing else changed.

This work item does **not**:

- qualify the provider for live use — `providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`, so this is not a live-qualification gate;
- achieve M2 or any other milestone — it removes one blocker from M2's path;
- amend any W-item acceptance, milestone or evidence gate outside D-5;
- decide *why* the vendor zero-fills one side or appends trailing zeros — the behaviour is recorded as evidence; the market-microstructure explanation is outside this record;
- touch the 23 Nov or 25 Nov captures — they remain byte-identical as retained;
- introduce a new canonical contract, a sentinel, or an LTP-derived bid/ask — D01 `2.0.0` payload key-set is unchanged.

