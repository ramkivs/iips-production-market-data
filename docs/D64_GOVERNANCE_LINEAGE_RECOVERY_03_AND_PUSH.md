# D64 — GOVERNANCE LINEAGE RECOVERY #3 + AUTHORIZED PUSH

**Act ID:** `D64-LINEAGE-RECOVERY-3-AND-AUTHORIZED-PUSH-01`
**Type:** LINEAGE RECOVERY + REMOTE DURABILITY. Correction by addition.
Not an authorization of new work, not acceptance, not certification, not production activation.
**Branch:** `arena/01a0814b-iips-production-market-data` — the **only** branch written or pushed.
`arena/01a0853d-…` was fetched **read-only**, never switched to, **never pushed**.
**Recovery base:** `eae2ff6937b257883433348560ae92f5485629e5`

---

## 1. THIRD LOSS

The sandbox was re-provisioned a **third** time: HEAD `eae2ff6`, 16 untracked directories,
reflog containing only `clone` + `checkout`.

- **D56 `b56a608b…`** — pushed previously → recovered from the remote again.
- **D57–D63** — never pushed → **all commit objects destroyed**, including both prior
  recovery generations.
- **All file content survived** in the working tree.

Cumulative destroyed commit objects: **3 + 6 + 7 = 16**. Zero governance content lost —
by luck, not by control. This act ends that exposure (§6).

---

## 2. PHASE 3 DETERMINATION — CONTENT RECOVERABILITY

Required by the act to be assessed separately:

| Outcome | Result |
|---|---|
| **(A) Historical commit object recoverable** | ❌ **NO** for D57–D63. Reflog empty of prior work; no dangling objects; not on any remote. |
| **(B) Exact file/blob content recoverable** | ✅ **YES — for every record.** |
| **(C) Neither** | Not applicable. |

**All 17 pre-recorded blob identities verified EXACT MATCH before any ref movement**,
including the three integrity anchors named in the act: D57 `63c34277…`, D58 `70c3d51f…`,
D59 `3ee766d2…`. D63 had no previously recorded blob; it is captured here as
`357a735e64d243c37664294f163ae588df937644`.

**No content was reconstructed from memory. No substitute record was created.**

> **Correction to a prior statement.** The D64 adjudication reported that "D57, D58, D59 are
> no longer on disk." **That was wrong** — it rested on a `ls docs/D6*.md` glob that matches
> only D6x filenames. A full `D55`–`D63` enumeration shows **all nine records present**.
> Recorded here by addition; the earlier statement is not edited.

---

## 3. D56 ANCHOR — UNCHANGED

| Field | Value |
|---|---|
| SHA | `b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` |
| Provenance | `origin/arena/01a0853d-…` (read-only fetch) |
| Author / date | `Arena Agent <agent@arena.ai>`, `Mon, 14 Sep 2026 13:56:21 +0000` |
| Subject | `D56: AD-17 L-1 closure - bounded ReplaySummary safety amendment` |

`eae2ff6` re-verified as a **direct ancestor** of `b56a608` — **152 ahead, 0 behind**.
History added, never altered.

---

## 4. MECHANISM

Read-only fetch → byte-level backup of **18** files to `/tmp/rec3-backup` with blob
identities recorded and verified → **`git reset --mixed b56a608b`** (ref + index only;
never writes or deletes working-tree files) → seven commits in original order.
**`reset --hard`, `clean`, `checkout -f`, delete, overwrite and force-push were NOT used.**
Integrity re-verified after the ref move and after every commit: **18/18 byte-intact**.

---

## 5. BINDING SHA MAPPING

| Record | Original | Recovery 1 | Recovery 2 | **CURRENT AUTHORITATIVE** |
|---|---|---|---|---|
| D56 | `b56a608b` | — | — | **`b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2`** (unchanged) |
| D57 | `9316b54` | `8cb073f0` | `25df10cb` | **`da19bb62029fd61272aa11b8a408066e232dc94b`** |
| D58 | `d834b7f` | `3cf2bac8` | `d932121a` | **`5e4779d08f6a47610e56aa798dffacda2103b2f6`** |
| D59 | `d3da1f1` | `3602bf4b` | `4f31a277` | **`b82f0248172a952f1e113ed3c698954fd239fa63`** |
| D60 | `4c27db1` | — | `7ee7e552` | **`2f1afdaf8ba73f4bbb1a3f9eb0fcab57d43e8afc`** |
| D61 | `9f20a758` | — | `dd94a404` | **`2a5b1b3d6461362f3ec0aad6b8b52100c32a5c7d`** |
| D62 | `db915707` | — | `3fcfa492` | **`8414675e4dce19df67206d3d982fe8452be62475`** |
| D63 | `0bb2f3fa` | — | — | **`ec9562be09f42b81c05a3e7f1c12dcc6ed81ccf4`** |

**⚠ Every SHA in the first three columns exists in no repository.**
**This table supersedes D60 §5 and D63 §5.** Where they conflict, **D64 governs**.

---

## 6. REMOTE DURABILITY — PUSH AUTHORIZED AND PERFORMED

Per the D64 authority decision (**LINEAGE: A**), the current branch is pushed to origin.

- Pushed: **`arena/01a0814b-iips-production-market-data` only**.
- **NOT pushed:** `arena/01a0853d-…`, `main`, or any other ref.
- **No force-push.** Fast-forward only.
- Push performed **after** full recovery validation (§7), never before.

This is the control that was missing through three losses: recovered lineage now exists on
the remote and survives sandbox re-provisioning.

---

## 7. VALIDATION

- **Chain:** `b56a608` (D56) → `da19bb6` (D57) → `5e4779d` (D58) → `b82f024` (D59) →
  `2f1afda` (D60) → `2a5b1b3` (D61) → `8414675` (D62) → `ec9562b` (D63) → **D64**.
- **Blob-level:** 10 spot-checked identity files match exactly; all 17 pre-recorded blobs
  verified EXACT MATCH pre-commit.
- **Content-level:** 18/18 backed-up files byte-identical.
- **Diff `b56a608..HEAD` (pre-D64):** **18 files, +1561 / −55** — 11 D58/D61 source/test files
  plus 7 records. No unexplained source change.
- **Governed paths — 0 changes:** `p05`–`p14`, `iips-platform`, `frontend/server`, D55, D56,
  `PHASE_13_GATE_ACCEPTANCE.md`, `program-v1.1-certification`, `evidence`.
- **L-7 sites — 0 changes:** `Ad17Disclosure.tsx`, `p12-transport.ts`,
  `EvidenceExplorerComponents.tsx`, `ReplayExplorer.tsx`, plus `ReplayService.ts` and
  `executive-transport.ts`.
- **Working tree clean.**

No implementation tests were run — this is a content-identity recovery. D58/D61 floors
(frontend 740/0, P12 153/0, tsc clean) are **carried, not re-claimed**.

---

## 8. WHY HISTORICAL RECORDS WERE NOT REWRITTEN

D57–D63 were reconstituted **byte-for-byte** and still cite destroyed SHAs. D60 and D63 are
now *doubly* self-referentially broken: each documents an earlier recovery whose target SHAs
have themselves been destroyed. They were **deliberately NOT rewritten** under **O-3** and
the standing correct-by-addition rule. Rewriting would make the documents appear internally
consistent while concealing that **three** lineage breaks occurred. The broken references
**are** the audit evidence. **D64 §5 is the binding resolution table.**

---

## 9. WHAT THIS ACT DOES NOT DO

- **NO L-7 IMPLEMENTATION.** All six stale sites are untouched; **L-7 remains OPEN** and is
  broader than D62 recorded — it includes the **executable, user-rendered**
  `AD17_DISCLOSURE.m2Defect` constant (`Ad17Disclosure.tsx`:26) and the `Ad17Note` rendered
  prose (:102). The L-7 amendment is **authorized** (D64 Part A, **L-7: A**) but **not
  performed**.
- Does not resolve **AD-17** or **M-2** — both **UNRESOLVED**.
- Does not close **L-3**, nor alter **L-2**, **L-4**, **R-2…R-7**.
- No source-code modification; no replay or transport remediation.
- No acceptance, no certification (**P13: NONE**), **no production authorization**.
- No gate reopened. No branch other than the session branch written or pushed.

---

## 10. STATUS

| Item | Status |
|---|---|
| Governance lineage | **RECOVERED (3rd) and PUSHED** |
| L-1 / L-5 / L-6 | CLOSED (D56 / D58 / D61) |
| **L-3** | **OPEN** — basis corrected by D62 |
| **L-7** | **OPEN** — amendment AUTHORIZED (D64 Part A), **not implemented** |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-4, R-2…R-7 | OPEN |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push | **`arena/01a0814b-…` ONLY** |
| Next free D-number | **D65** |
