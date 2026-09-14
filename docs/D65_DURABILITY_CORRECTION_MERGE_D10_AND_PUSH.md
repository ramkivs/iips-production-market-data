# D65 — DURABILITY CORRECTION: D64 PUSH CLAIM, D10 MERGE, AUTHORIZED PUSH

**Act ID:** `D65-DURABILITY-MERGE-D10-AND-PUSH-AUTHORIZED-EXECUTION-01`
**Type:** CORRECTION BY ADDITION + REMOTE DURABILITY.
Not an authorization of new work, not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-iips-production-market-data` — the only branch written or pushed.

---

## 1. CORRECTION — D64 §6 IS INACCURATE

**D64 §6 states the push was performed. It was not.** D64 was written before the push was
attempted, in the expectation that it would succeed; the attempt was then blocked and the
section was never true.

Per the standing correct-by-addition rule and **O-3**, **D64 is NOT edited.** This record is
the correction. Where D64 §6 and D65 conflict, **D65 governs**.

| D64 §6 claim | Actual |
|---|---|
| "the current branch is pushed to origin" | **Not pushed at the time D64 was committed** |
| "recovered lineage now exists on the remote" | Became true only at **this** act |

The gap was reported to authority immediately rather than left standing.

---

## 2. WHY THE PUSH WAS BLOCKED

```
remote arena/01a0814b-… = 07ad52fa   D10: P08 entry/dependency assessment (ENTRY-BLOCKED, read-only)
merge-base              = efe33eae   CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary
local-only commits      = 156        (recovery lineage, descended from eae2ff6 / main)
remote-only commits     = 1          (D10)
```

The remote tip was **not an ancestor** of local HEAD — the branch diverged at CHECKPOINT-03.
A normal push was rejected. `--force` would have **deleted D10 from the remote** and is
prohibited. The act therefore stopped and escalated instead of choosing silently.

---

## 3. AUTHORITY DECISION

Authority selected **option (ii): merge D10 into the recovery lineage, then push normally** —
over (i) an alternate branch and (iii) force-push. **D10 is preserved, not rewritten.**

---

## 4. MERGE

| Field | Value |
|---|---|
| **Merge commit** | **`4f0d405dc791f096a2c157dd933ee61529dcb7f9`** |
| Parent 1 | `9e6c08004efb2416553178a44f925ccefcb947f5` (D64, recovery lineage) |
| Parent 2 | `07ad52fa643eff8ce5b89450729b4341ed245131` (**D10, preserved**) |
| Strategy | `ort`, `--no-ff`, normal merge |
| Conflicts | **0** |
| Files changed by the merge | **1** — `docs/d10/D10_P08_ENTRY_ASSESSMENT.md` (+309, new file) |

Pre-merge dry run (`git merge-tree`) predicted no conflict; D10 touches exactly one path that
does not exist in our lineage. **No force operation. Nothing rewritten. Nothing deleted.**

**Note on the mechanism:** `origin/arena/01a0814b-…` was not a populated remote-tracking ref
in this sandbox (the fetch wrote only `FETCH_HEAD`), so the first merge invocation failed with
*"not something we can merge"* and made no change. The merge was then performed against the
**explicitly verified SHA `07ad52fa…`** — the same object, identity-checked in precheck.
Recorded for transparency; no substantive difference.

---

## 5. POST-MERGE VALIDATION

- **D10 is an ancestor of HEAD:** YES. `docs/d10/D10_P08_ENTRY_ASSESSMENT.md` present, 309 lines.
- **D64 is an ancestor of HEAD:** YES. **D56 is an ancestor of HEAD:** YES.
- **All records D55–D64 present in the merged tree** (1 each).
- **Merge diff `9e6c080..HEAD` = exactly 1 file** — the D10 record. No other path touched.
- **25 protected files byte-identical to the pre-merge backup — 25/25 UNCHANGED**, including
  **all six L-7 sites**, `ReplayService.ts` and `executive-transport.ts`.
- All recovery SHA mappings (D64 §5) intact and unmodified.
- **Working tree clean.**

No implementation tests run — this is a durability act, not implementation.

---

## 6. AUTHORITATIVE LINEAGE

```
4f0d405  Merge remote D10 into recovered governance lineage   ← merge
├─ 9e6c080  D64  Governance lineage recovery #3
│  ec9562b  D63 (RECOVERED-3)     8414675  D62 (RECOVERED-3)
│  2a5b1b3  D61 (RECOVERED-3)     2f1afda  D60 (RECOVERED-3)
│  b82f024  D59 (RECOVERED-3)     5e4779d  D58 (RECOVERED-3)
│  da19bb6  D57 (RECOVERED-3)     b56a608  D56 (unchanged)
└─ 07ad52f  D10  P08 entry/dependency assessment (PRESERVED)
```

The binding old→new SHA mapping remains **D64 §5**.

---

## 7. WHAT THIS ACT DOES NOT DO

- **NO L-7 IMPLEMENTATION.** All six stale sites untouched. **L-7 remains OPEN** — authorized
  under D64 Part A, **not performed**. It remains broader than D62 recorded, including the
  executable, user-rendered `AD17_DISCLOSURE.m2Defect` (`Ad17Disclosure.tsx`:26) and the
  `Ad17Note` prose (:102).
- No modification of `ReplayService.ts` or `executive-transport.ts`. No transport remediation.
- No force push, no `--force-with-lease`, no history rewrite, no deletion of D10.
- `arena/01a0853d-…` not pushed and not written.
- **L-3 OPEN. AD-17 / M-2 UNRESOLVED.** L-2, L-4, R-2…R-7 OPEN.
- **No certification (P13: NONE). No production authorization.** No gate reopened.

---

## 8. STATUS

| Item | Status |
|---|---|
| D64 §6 push claim | **CORRECTED by this record** (D64 not edited) |
| D10 | **PRESERVED** as merge parent 2 |
| Governance lineage | Recovered (3rd) + merged + **pushed** |
| L-1 / L-5 / L-6 | CLOSED |
| **L-3** | **OPEN** |
| **L-7** | **OPEN** — authorized, not implemented |
| AD-17 / M-2 | **UNRESOLVED** |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Branch pushed | **`arena/01a0814b-…` ONLY**, normal push |
| Next free D-number | **D66** |
