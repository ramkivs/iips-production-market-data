# CAP-03 — IRR Post-Baseline Movement Receipt

> ## STATUS: **DATED CROSS-REPOSITORY RECEIPT — DOCUMENTATION ONLY — NO DECISION, NO MUTATION OF IRR**
>
> This receipt mirrors externally performed IRR publication facts into the IPD locus. It creates no
> authority, changes no DQ answer, adopts nothing, and does not make an IRR record from IPD or an IPD
> record from IRR. IRR remains read-only to this session.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP03-IRR-POST-BASELINE-MOVEMENT-RECEIPT-2026-10-24-01` (census before this record: `0` in IPD and IRR) |
| **Record type** | Cross-repository dated receipt. Not an authority act, qualification result, acceptance or admission |
| **Prepared** | `2026-10-24` (UTC) |
| **IPD locus** | `ramkivs/iips-production-market-data` |
| **IRR locus observed read-only** | `ramkivs/iips-review-recovered` |
| **Reason** | IRR `main` advanced after the DQ packet's Step 0 baseline; the published packet's IRR coordinate is historical as of preparation and must not be mistaken for the current tip |

---

## 1. Baseline and current coordinates

| Item | Value |
|---|---|
| DQ packet Step 0 IRR baseline | `4d14780f0db66a891f552926ee2badaf56acfa2d`, tree `742ac4d4c8817bab9aa2cbeaac138d9a72c2934e` |
| Current IRR `main` observed after publication | **`d6d25197b6f3c16e7e1adb12ca2522aa947992ba`**, tree **`600301b3807135eb14ea27fa9c4b4ef0e3520742`** |
| Ancestry | `4d14780f…` **is an ancestor** of `d6d25197…`; regular merge commit; no force-push or history rewrite |
| New commits | `9b62979` (merge PR #233), `d6d2519` (merge PR #234); branch commits `d5e9e32`, `51a1379` |
| Changed paths across `4d14780f… → d6d25197…` | **exactly one**: `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (`+141/−3` in PR #233; `+18` in PR #234) |
| Current IRR tracker blob | `8205bc168693c217e9e0e0f1cb1b9b822fb7829e`, **1,766,761 B**, raw SHA-256 `4944acc6a060d79947fe8754455f433a43da846f9d52d816f63b1e3f2b357eec` |
| Current IRR `main` CI | run **`40072312965`** — **success** (`Typecheck · Test · Build`, all steps success) |

This is documentation-only drift. **No source, test, script, package, lockfile, CI workflow, route,
fence, schema or consumer-contract path changed.**

---

## 2. External publications and closure

These were performed outside this IPD session. This receipt asserts only what the IRR/GitHub records and
the remote objects show; it does not claim that this session authored, approved or merged any IRR change.

| Event | Verified value |
|---|---|
| IRR PR **#233** | `docs(cap03): register IPD PRs #76-81 and re-derive gate state (§16.95, CV-CORR-78)`; head `d5e9e32adf34d958cc7cc14b54afa1f858feafbb`; **MERGED** `2026-10-24T06:53:31Z` as `9b62979a7fe0d5e2cf2691089464ddd008e41d16`, tree `988bd8f14c796a2b7025d02c9721be10dec019b5`; main CI `40071988563` success |
| IRR PR **#234** | `docs(cap03): record PR #233 publication receipt (§16.95.9, CHG-2026-10-24-02)`; head `51a1379f686403a3c77ff665badb05ce0ea3e2b0`; **MERGED** `2026-10-24T06:58:38Z` as `d6d25197b6f3c16e7e1adb12ca2522aa947992ba`, tree `600301b3807135eb14ea27fa9c4b4ef0e3520742`; main CI `40072312965` success |
| IRR PR **#204** | **CLOSED** at `2026-10-24T06:48:22Z` with a supersession disposition; **not merged**; head `dee114ae6be70cdb04dbdc3940819ab212c669aa` is **not** an ancestor of `main`; no merge commit; no branch code became authoritative through it |
| Open IRR PRs after the movement | **none** |

The closure of PR #204 is an **external operator disposition**, not an action of this IPD pass. It
corresponds to the routine O-10 item in the DQ packet; this receipt does not convert that routine item into
a PA decision.

---

## 3. Preservation checks at the new IRR tip

| Anchor | Blob at `d6d25197…` | Unchanged from DQ packet baseline |
|---|---|---|
| `frontend/server/user-portfolio-transport.ts` | `51704c12a467cd2f718a030b5036bc55c9afa73f` | **yes** |
| `frontend/server/owner-context-unavailable.ts` | `cb8db45d668d28cee7e0a52721001d579a872733` | **yes** |
| `frontend/server/user-portfolio/userPortfolioContract.ts` | `e6b57bb8a021d8eb4b9b7572d12affc7de66be0b` | **yes** |
| `frontend/server/reports-transport.ts` | `981470541812a64c733309f1debec75455d85bee` | **yes** |
| `frontend/package.json` | `6274537a81e1496189e629c7e8f371f80144dfec` | **yes** |
| `frontend/package-lock.json` | `05ade78c40ac40626c678f3531266049a0e83555` | **yes** |

The four fence/contract anchors, both package manifests and the primary/alias IPD pins are therefore
unchanged. No IRR `503` pair was lifted, no package moved and no consumer code changed.

---

## 4. Effect on the DQ packet and current blockers

1. **The DQ packet remains valid as a preparation record.** Its "IRR read-only baseline" is a measured
   starting coordinate, not a guarantee that IRR would not advance. This receipt supplies the dated
   current coordinate without rewriting the merged record.
2. **No rendered DQ-1…DQ-7 act exists** in the new IRR content. The new §16.95 content records
   DR-2/DR-3/DR-4r as **UNRESOLVED — PA decisions**, P04 as host-gated, H-12 as **NOT ADOPTED**, Gate 4 as
   **AUTHORIZED — NOT STARTED**, QE **0/11**, P10 not rendered and P11 not initiated. That aligns with the
   packet's authoritative label reconciliation; it does not move any DQ decision.
3. **No IRR↔IPD equivalence, no identity-value selection and no provisioning** is made by this receipt.
   The existing IPD-owned S1 determination remains the only authority for those values; they are not
   restated or copied here.
4. **No final IRR consumer pin is designated by this movement.** `4740ba21…` remains the effective Gate 4
   consumer pin named by the effective act; the current tip is an observation for drift accounting only.
5. **Host readiness is unchanged.** The host remains unreachable, no store/endpoint/final pin/adopted H-12
   exists, QE remains **0/11**, and no Track C execution is possible.
6. **PR #204 is now closed externally.** The DQ-6/administrative O-10 statement "left open" in the
   published packet is historical as of its baseline; the current fact is recorded here. No technical or
   authority dependency changes.

---

## 5. Attestation

| Claim | Value |
|---|---|
| IRR file, branch, commit, PR, issue or comment modified by this IPD pass | **NO** |
| IRR main movement authored/approved by this pass | **NO — external publications #233/#234** |
| PR #204 closed by this pass | **NO — external closure, read-only verified** |
| New DQ act or PA decision present at the new IRR tip | **NO** |
| Fence/package/consumer path changed by the movement | **NO — one tracker path only** |
| DQ packet rewritten or edited after merge | **NO — additive receipt only** |
| Qualification, acceptance, admission, write, production eligibility, `durable:true` or `TD-7b` claimed | **NO** |

*End of `IIPS-V3-CAP03-IRR-POST-BASELINE-MOVEMENT-RECEIPT-2026-10-24-01`.*
