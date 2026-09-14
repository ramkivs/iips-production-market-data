# D60 — GOVERNANCE LINEAGE RECOVERY (D57 / D58 / D59 RECONSTITUTION)

**Act ID:** `D60-LINEAGE-RECOVERY-EXECUTION-01`
**Type:** LINEAGE RECOVERY / CORRECTION BY ADDITION.
Not an authorization, acceptance, certification, implementation, or production activation.
**Branch target:** `arena/01a0814b-iips-production-market-data` (**current session branch — the
only branch written to; `arena/01a0853d-…` was NOT switched to and NOT pushed**)
**Recovery base:** `eae2ff6937b257883433348560ae92f5485629e5`

---

## 1. WHAT HAPPENED

The sandbox was re-provisioned as a **fresh clone** of
`arena/01a0814b-iips-production-market-data` at the `main` baseline `eae2ff6`. The prior
session's commits had been made on `arena/01a0853d-iips-production-market-data`.

- **D56 `b56a608b…` had been PUSHED** → survived on the remote and is fully recoverable.
- **D57, D58 and D59 had NOT been pushed** (per the standing no-push rule) → their **commit
  objects were destroyed**. `git reflog` contained only two entries (`clone`, `checkout`),
  confirming no local recovery path; `git fsck` surfaced only `b56a608b` as dangling.
- The **file content** of D57/D58/D59 survived intact as untracked working-tree content and
  is what this act reconstitutes.

**Only commit objects were lost. No governance content was lost.**

---

## 2. PROVENANCE OF THE RECOVERED D56 ANCHOR

| Field | Value |
|---|---|
| SHA | `b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` |
| Remote provenance | `origin/arena/01a0853d-iips-production-market-data` (fetched read-only) |
| Author / Commit date | `Arena Agent <agent@arena.ai>`, `Mon Sep 14 13:56:21 2026 +0000` |
| Subject | `D56: AD-17 L-1 closure - bounded ReplaySummary safety amendment` |
| Ancestry | `b56a608` → `53a6d14` (D55) → `9e4c2e1` (UI17) → `cfe3353` → `dce5cdb` (D54) → `bff5ada` (D53) |

`eae2ff6` was verified to be a **direct ancestor** of `b56a608` (152 commits ahead, **0
behind**). The recovery therefore **added** history to the current branch and **altered no
existing baseline history**.

---

## 3. RECOVERY MECHANISM (explicit and reviewable)

1. `git fetch origin arena/01a0853d-…` — **read-only**; no branch switch.
2. `git merge --ff-only b56a608b` — **attempted and safely ABORTED** by git because
   untracked recovery content occupied paths tracked in the D56 tree. **No file was written
   or removed.**
3. `git reset --mixed b56a608b` — moved the branch ref and index to D56 **without touching
   the working tree**. This is the reviewable mechanism actually used.
   **`reset --hard`, `clean`, `checkout -f`, delete and overwrite were NOT used.**
4. The surviving content then appeared exactly as: **9 modified files + 3 new records**,
   which is precisely the D58 changeset plus the three governance records.
5. Three commits were then created in original order (§5).

A byte-level backup of all 12 recovery files was taken to `/tmp/recovery-backup` **before**
any ref movement, and re-verified **after** every step. **Zero files were altered.**

---

## 4. PRE-RECOVERY CONTENT IDENTITY (verified, then re-verified post-commit)

| File | Blob id | Lines | Bytes |
|---|---|---|---|
| `docs/D57_…ADJUDICATION.md` | `63c342771d24c98b2105dbfc0c1c441e64066aa3` | 216 | 10750 |
| `docs/D58_…IMPLEMENTATION.md` | `70c3d51f1d7df0f217165822d0e2f53d552452a0` | 194 | 9190 |
| `docs/D59_…ADJUDICATION.md` | `3ee766d2c146df700b02a42086f663b756a52524` | 127 | 6054 |
| `CompanyTrustChain.tsx` | `18d59e26785c07c6a3e42a6e148ce92e733599ed` | 109 | 5349 |
| `SectorIntelligence.tsx` | `8509fc27a402ee567ab8655d5174ed5715777631` | 246 | 12393 |
| `StateComponents.tsx` | `a359daa85148780ef5ff28e0bfc3068010615b27` | 55 | 2676 |
| `StateComponents.test.tsx` | `a37daf2ed7f7172aca6a03434fa15455d0e448b4` | 39 | 1618 |

**Every one of these blob ids was re-confirmed present in the recovered commits.**
`StateComponents.tsx` and `StateComponents.test.tsx` are **byte-identical to D56**,
independently confirming that D58 honoured the S-3 prohibition.

---

## 5. OLD → NEW SHA MAPPING (AUTHORITATIVE)

| Record | ORIGINAL SHA (destroyed, unrecoverable) | **NEW SHA (authoritative)** |
|---|---|---|
| D56 | `b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` | **unchanged — recovered from remote** |
| D57 | `9316b54` — **UNRECOVERABLE, EXISTS NOWHERE** | **`8cb073f0c46526e96c3a7772beb904a5b99fb491`** |
| D58 | `d834b7f` — **UNRECOVERABLE, EXISTS NOWHERE** | **`3cf2bac8c5f4aed7f6a58c8467025a9d63df01d9`** |
| D59 | `d3da1f1` — **UNRECOVERABLE, EXISTS NOWHERE** | **`3602bf4b706713337ff809c5f717a4a5bedfaf3d`** |

**⚠ The original SHAs `9316b54`, `d834b7f` and `d3da1f1` MUST NOT be cited as if resolvable.
They exist in no repository, local or remote.** Any future act citing them must resolve them
through this table.

---

## 6. WHY THE RECOVERED RECORDS RETAIN THEIR ORIGINAL SHA REFERENCES

D57, D58 and D59 were reconstituted **byte-for-byte**. They still contain internal citations
to the destroyed SHAs — specifically `D58 §1` and §2.1/§2.2, the AD-17 governance comments in
`CompanyTrustChain.tsx`:51 and `SectorIntelligence.tsx`:196 ("Authority: D57 (commit
9316b54)"), and D59's citations of `d3da1f1`/`d834b7f`.

They were **deliberately NOT rewritten**, because:

- **O-3 / "do not alter historical quotations"** — a governance record states what it stated.
  Editing it to appear self-consistent would destroy the audit trail of the loss.
- **"Correct by addition, never by edit"** — the standing rule applied throughout D55–D59.
- Rewriting the citations would produce documents that *look* internally consistent while
  silently concealing that a lineage break occurred.

**This record (D60) is the authoritative correction-by-addition.** §5 is the binding mapping.

---

## 7. VALIDATION PERFORMED

- **Recovered chain:** `b56a608` (D56) → `8cb073f` (D57) → `3cf2bac` (D58) → `3602bf4` (D59).
- **Blob-level:** all 7 tracked identity files match their pre-recovery blob ids exactly (§4).
- **Content-level:** all 12 backed-up files byte-identical to the pre-recovery backup.
- **D58 scope preserved:** `10 files changed, +498 / −36` — identical to the originally
  recorded figure.
- **Total recovery diff `b56a608..HEAD`:** **12 files, +841 / −36** (the 9 D58 source/test
  files + 3 records).
- **Forbidden paths — 0 changes since D56:** D53, D54, D55, D56, `PHASE_13_GATE_ACCEPTANCE.md`,
  `PHASE_14_GATE_ACCEPTANCE.md`, `p13/src`, `p12`, `p05`–`p11`, `p14`, `iips-platform`,
  `frontend/server`, `frontend/src/components/state`.
- **`ReplayState` NOT modified**; `StateComponents.tsx` unchanged since D56.
- **Working tree clean.** **Nothing pushed.**

**Test floors were NOT re-executed in this act** — it is a content-identity recovery, not an
implementation. The figures recorded in D58 (frontend 740/0, P12 153/0, tsc clean) were
observed at the time of the original D58 act and are **carried, not re-claimed**.

---

## 8. NUMBERING CORRECTION (SUPERSEDES D59 §4)

D59 §4 stated the L-6 implementation record would be **D60**. **This recovery record now
occupies D60.** The L-6 implementation record must therefore be **D61**. Corrected here by
addition; D59 is not edited.

---

## 9. WHAT THIS ACT DOES NOT DO

- **D60 implementation was NOT performed.** `ReplayState` is untouched and **L-6 remains OPEN**.
- Does **not** resolve **AD-17** or **M-2** — both **REMAIN UNRESOLVED**.
- No replay remediation; no verification, reproduction or byte identity established.
- No acceptance, no certification (**P13 certification: NONE**), **no production authorization**.
- No acceptor designated. No P00–P16 status altered. No gate reopened.
- Nothing pushed. No other branch created, switched to, or written.

---

## 10. STATUS

| Item | Status |
|---|---|
| Governance lineage | **RECOVERED** onto `arena/01a0814b-…` |
| L-1 | CLOSED (D56) |
| L-5 | CLOSED for all live sites (D58) |
| **L-6** | **OPEN** — amendment authorized (D59 Decision B), **not implemented** |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-3, L-4 | OPEN (D55 §5) |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push status | **NOT PUSHED** |
| Next free D-number | **D61** (L-6 implementation) |
