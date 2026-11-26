# D-5 Addendum B — Publication and Acceptance Report

**Document ID:** `D-5-ADDENDUM-B-PUBLICATION-2026-11-26`  
**Date:** 26 November 2026  
**Type:** One-pass publication and integration record for D-5 Addendum B  
**Authority:** Programme Authority — D-5 Addendum B (§8, 26 Nov 2026)  
**Repository:** IPD `ramkivs/iips-production-market-data`  
**Working branch:** `arena/f93e947f-iips-production-market-data`  
**Implementation commit:** `dcc87df` (on top of W-14 `c52c520` + `68249bc` main)  
**Merge commit:** `fe38819721cf5afaaa04cd3eed47c04fa6ecff4d` (PR #205 merge into `main`)  
**PR:** #205 — https://github.com/ramkivs/iips-production-market-data/pull/205  
**PR title:** `feat(dhan): D-5 Addendum B normalize one-sided zero-filled depth per 26 Nov Reliance capture`  
**Source branch:** `arena/f93e947f-iips-production-market-data` at `dcc87df44960d26ff7df30f2a492bbb2a9463160`  
**Base:** `main` at `68249bc` (origin/main pre-merge) → `fe38819` post-merge  
**No live Dhan request performed:** Verification reads retained fixtures only.

## 1. Branch Diff Verification

Diff against `origin/main` (68249bc) — 15 files, 3919 insertions, 51 deletions:
- `src/providers/dhan/dhan_normalizer.ts` — per-side `isZeroFilledSide` + `withoutTrailingZeroLevels`, `topOfBook` per-side
- `evidence/dhan-d18/reliance-depth-20261126.json` (new, 226 lines, 4878 bytes, SHA `dd89ed2bd43fc749150d727934194cfd5c059e143bc87d1fc8c746aa3d920f3d`)
- `evidence/dhan-d18/manifest.json` — 3 captures (SHA `3fb343db…b68e`, `6c53e973…a3a`, `dd89ed2b…920f3d`)
- `tests/d5_bid_ask_representation.test.ts` — D5-A6 superseded + D5-B0…B9 (10)
- `docs/integration/D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md` — header A+B, §6.2 superseded, §8 Addendum B
- `docs/integration/D-5-FOLLOW-UP-ONE-SIDED-DEPTH-COMPLETION-2026-11-26.md` (new)
- `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` — post-note A+B, D-5 row, Row 11, BLK-1
- W-14 artifacts preserved: `dhan_batch_quote_payload.ts`, `w14-scope-b-batch-payload.json` (48+48), `w14-scope-b-reconciliation-manifest.json` (1583 entries), `dhan-w14-build-scope-b-payload.mjs`, 2 test suites, 2 reports

Diff against original branch base 85ac127 — 77 files, 18611 insertions (includes W-24, W-14, W-11, etc. from main's evolution to 68249bc).

All D-5 Addendum B implementation, fixtures, tests and documentation verified present.

## 2. Focused Tests and Build Checks (on PR branch `dcc87df`, no live Dhan requests)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `tsc -p tsconfig.json` | exit 0 |
| `node --test d5_bid_ask_representation` | **71/71 pass** (61 Addendum A +10 B0…B9) |
| `node --test dhan_depth_capture` | **41/41 pass** |
| `node --test dhan_w14_batch_payload` + `dhan_w14_batch_response_reconciliation` | **23/23 pass** (12+11, BSE 48/NSE 48, SHA `f7bbccc467d44a` / `09e39c13…805f2`) |
| `npm run build:dhan-package` | exit 0 |
| `npm run build:pit-package` | exit 0 |
| Live verification (verbatim `rawDepth` via `normalizeDhanQuoteToCanonical`) | `reliance-depth-20261126.json` → `bid:null ask:1396.2` VALID, full 5×5 → `null/null` VALID, opposite → `bid:1396.2 ask:null` VALID, malformed `0+qty` → `MALFORMED_RESPONSE` REJECTED, D01 `2.0.0`, envelope `1.0.0`, `providerQualification` unchanged |

Full suite `node --test --test-reporter=tap dist/tests/*.test.js` (176 source files → 2374 tests):
- On PR branch `dcc87df`: **2374 tests, 2356 pass, 4 fail, 14 skipped** (failures: W11-01 10≠9 routes, W-24 HTTP 502≠200 + trace header propagation)
- On `origin/main` 68249bc pre-merge: **2374 tests, 2331 pass, 29 fail, 14 skipped** (includes W-14 batch 11 failures + W-24 etc.)
- **D-5 introduced zero new failures; it reduced failures by 25 (W-14 batch fixed).** Remaining 4 are pre-existing on `main` (W-11 documentation route count, W-24 trace-header contract).

## 3. PR Creation
- Created via `gh pr create --base main --head arena/f93e947f-iips-production-market-data`
- **PR #205:** https://github.com/ramkivs/iips-production-market-data/pull/205
- Title: `feat(dhan): D-5 Addendum B normalize one-sided zero-filled depth per 26 Nov Reliance capture`
- Body includes actual test results, evidence SHAs, implementation, W-14 preservation, and remaining limitations (see above)

## 4. CI and Required Checks
- **CI workflow `CI` (name: `typecheck · build · test`):**
  - `Set up job` success, `Checkout` success, `Set up Node.js` success, `Install (locked)` success, `Typecheck` success, `Build (tsc emit + vite bundle)` success, `Test (guarded)` **failure** (exit 1), `Public package consumer` skipped, `Publish executed test count` failure
  - Failure cause: full suite 4 failures → guard reports `failure` and `executed test count` fails (no trustworthy count with `fail !== 0`)
  - Same 4 failures exist on `origin/main` 68249bc (29 failures), so not a D-5 regression
- **Second check `executed test count`:** failure (derived from first)
- **Overall PR statusCheckRollup:** `typecheck · build · test:null:FAILURE`, `executed test count:null:FAILURE`
- **Main branch 68249bc CI:** also `failure` for both checks (29 failures)
- **Resolution:** D-5 change improves main (29→4 failures, +10 D-5 tests, +23 W-14 tests). No new D-5 failures. Remaining 4 are pre-existing W-11/W-24 documentation/HTTP issues outside D-5 scope. Merge allowed via repository settings (mergeable `MERGEABLE`, mergeState `UNSTABLE` but merge succeeded without admin block).

## 5. Merge
- Command: `gh pr merge 205 --merge` (default merge, no --auto)
- **Merged at:** 2026-11-26T18:34:40Z
- **Merge commit on `main`:** `fe38819721cf5afaaa04cd3eed47c04fa6ecff4d` (merge PR #205, parents `68249bc`+`dcc87df`)
- **State:** `MERGED`, `closed`
- No conflicts; fast-forward via merge commit; branch not deleted per task (still `active`)

## 6. Post-Merge Verification on `origin/main` (commit `fe38819`)
- `git fetch origin && git show origin/main:evidence/dhan-d18/manifest.json` → 3 files `reliance-depth-20261123.json`, `20261125.json`, `20261126.json`
- `reliance-depth-20261126.json` SHA `dd89ed2bd43fc749150d727934194cfd5c059e143bc87d1fc8c746aa3d920f3d`, capturedAtUtc `2026-11-26T16:37:12.539Z`, buy 5×0 sell L1 1396.2/8767/32+4×0 present
- `D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md` on main: `grep -c "Addendum B"` = 5, header `Addendum A §7 + B §8`
- `src/providers/dhan/dhan_normalizer.ts` on main: `isZeroFilledSide` 4 occurrences, `withoutTrailingZeroLevels` present
- `tests/d5_bid_ask_representation.test.ts` on main: `D5-B0` present, `D5-A6` superseded text present
- `evidence/dhan-w14-e4/w14-scope-b-batch-payload.json` on main: SHA `f7bbccc467d44a`, NSE 48 BSE 48, present via merge (W-14 preserved)
- Focused checks on `origin/main` at `fe38819`: `tsc --noEmit` 0, `d5 71/71` pass, `depth 41/41` pass, `w14 23/23` pass

## 7. Final D-5 Addendum B Status
- **Status:** **PUBLISHED AND INTEGRATED** — implementation on `main` at `fe38819`, evidence retained, tests green for D-5 scope
- **Decision:** D-5 Addendum B (§8, 26 Nov 2026) — per-side absent-market-book + trailing zero stripping, **ACCEPTED — APPROVED** (Programme Authority), recorded as §8 of D-5 decision
- **Evidence:** D-18 captures verbatim, per-side normalization, strict validation preserved, no LTP fabrication, D01 `2.0.0`/envelope `1.0.0`
- **Tests:** 71/71 D-5 (61 A +10 B), 41/41 depth capture, 23/23 W-14 batch, full suite 2374/2356/4/14 on PR branch (vs 2374/2331/29/14 on main pre-merge)
- **CI:** Typecheck/build pass; full suite 4 pre-existing failures remain (W-11/W-24), not D-5 regressions; PR merged as repository allows unstable merge (main was already failing)

## 8. W-14 Payload Confirmation
- **Preserved:** `w14-scope-b-batch-payload.json` SHA `f7bbccc467d44a00` / minified `09e39c13…805f2`, `w14-scope-b-reconciliation-manifest.json` 1583 entries, `dhan_batch_quote_payload.ts`, `dhan-w14-build-scope-b-payload.mjs`, 2 test suites 23/23, reports `DHAN-W14-BATCH-QUOTE-PAYLOAD-REPORT-2026-11-26.md` + `DHAN-W14-E4-BLK2-ASSESSMENT-2026-11-26.md` — all present on `main` at `fe38819` via merge (diff shows 15 files including W-14)
- **Ancestor:** `c52c520` preserved as parent of merge (W-14 base)

## 9. Remaining Runtime Verification Limitations
- `providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` — not a live-qualification gate; no live Dhan request performed in this publication (as required)
- No claim of market-microstructure causation for vendor zero-filling (evidence only)
- Calendar coverage bounded (roadmap BLK-11, PR #193 open for NSE 2026-11-26 extension)
- Live E4 sweep still requires owner authorisation (BLK-2, budget 96/288, 6 renames) — not performed here
- 4 pre-existing CI failures on `main` (W-11 route count 10≠9, W-24 HTTP 502/trace propagation) remain; they are outside D-5 scope and were present on `68249bc` (29 failures). A follow-up W-11/W-24 fix is required to make `main` CI green, but D-5 publication is complete and does not worsen it.

## 10. Publication Records Pushed
- `fe38819` merge commit on `origin/main` (PR #205) — includes all D-5 Addendum B + W-14 artifacts
- This report `D-5-ADDENDUM-B-PUBLICATION-REPORT-2026-11-26.md` to be pushed as follow-up commit on `main` (authoritative roadmap update)
