# D63 — GOVERNANCE LINEAGE RECOVERY #2 (D57–D62 RECONSTITUTION)

**Act ID:** `D63-LINEAGE-RECOVERY-EXECUTION-02`
**Type:** LINEAGE RECOVERY / CORRECTION BY ADDITION. Not an authorization, acceptance,
certification, implementation, or production activation.
**Branch target:** `arena/01a0814b-iips-production-market-data` — the **only** branch written.
`arena/01a0853d-…` was fetched **read-only** and **never switched to**.
**Recovery base:** `eae2ff6937b257883433348560ae92f5485629e5`

---

## 1. WHAT HAPPENED — SECOND LOSS

The sandbox was re-provisioned as a fresh clone for the **second** time, again landing on
`arena/01a0814b-…` at baseline `eae2ff6` with 16 untracked directories and an empty reflog
(`clone`, `checkout` only).

- **D56 `b56a608b…` had been PUSHED** → survived on the remote, recovered again.
- **D57–D62 had NOT been pushed** (standing no-push rule) → **all commit objects destroyed**,
  including the first-recovery reconstitutions created under D60.
- **File content survived intact** as untracked working-tree content and is what this act
  reconstitutes.

**Only commit objects were lost. No governance content was lost, in either loss event.**

---

## 2. D56 ANCHOR — UNCHANGED

| Field | Value |
|---|---|
| SHA | `b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` |
| Provenance | `origin/arena/01a0853d-iips-production-market-data` (read-only fetch) |
| Author / date | `Arena Agent <agent@arena.ai>`, `Mon, 14 Sep 2026 13:56:21 +0000` |
| Subject | `D56: AD-17 L-1 closure - bounded ReplaySummary safety amendment` |
| Ancestry | `b56a608` → `53a6d14` (D55) → `9e4c2e1` → `cfe3353` → `dce5cdb` (D54) → `bff5ada` (D53) |

`eae2ff6` re-verified as a **direct ancestor** of `b56a608` — **152 ahead, 0 behind**.
History was **added**; no existing baseline history was altered.

---

## 3. MECHANISM (non-destructive)

1. `git fetch origin arena/01a0853d-…` — read-only, no branch switch.
2. **Byte-level backup of all 17 recovery files** to `/tmp/rec2-backup`, with blob identities
   recorded and the backup diffed against the working content **before** any ref movement.
3. `git reset --mixed b56a608b` — moves the branch ref and index **only**; never writes or
   deletes working-tree files. **`reset --hard`, `clean`, `checkout -f`, delete and overwrite
   were NOT used.**
4. Six commits created in original order (§5).
5. Integrity re-verified after the ref move and again after every commit: **17/17 files
   byte-intact, zero alterations**.

---

## 4. SURVIVING CONTENT IDENTITIES (verified pre-recovery, re-confirmed post-commit)

| File | Blob id |
|---|---|
| `docs/D57_…ADJUDICATION.md` | `63c342771d24c98b2105dbfc0c1c441e64066aa3` |
| `docs/D58_…IMPLEMENTATION.md` | `70c3d51f1d7df0f217165822d0e2f53d552452a0` |
| `docs/D59_…ADJUDICATION.md` | `3ee766d2c146df700b02a42086f663b756a52524` |
| `docs/D60_…RECOVERY.md` | `2b6770244f7ad23fae1de2e795664cc646782772` |
| `docs/D61_…IMPLEMENTATION.md` | `be12ba980e43ceb3ad173674ea75202220840b0c` |
| `docs/D62_…CORRECTION_BY_ADDITION.md` | `01cf68bc92c388659dc038681a142ff9927ae9f7` |
| `CompanyTrustChain.tsx` | `18d59e26785c07c6a3e42a6e148ce92e733599ed` |
| `SectorIntelligence.tsx` | `8509fc27a402ee567ab8655d5174ed5715777631` |
| `StateComponents.tsx` | `cd227f96a434c5a5c214c058afab8e9f5592e858` (D61-amended) |
| `StateComponents.test.tsx` | `69befa19b193f57f0bea5d154e5db518878fd563` (D61-amended) |

Plus the 7 remaining D58 test files. **All re-confirmed present in the recovered commits.**

---

## 5. SHA MAPPING — BINDING

| Record | Original (destroyed) | 1st recovery (destroyed) | **CURRENT AUTHORITATIVE** |
|---|---|---|---|
| D56 | `b56a608b…` | — | **`b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` (unchanged)** |
| D57 | `9316b54` | `8cb073f0` | **`25df10cb7fb25fa385a7eadb82359afe7f4a18af`** |
| D58 | `d834b7f` | `3cf2bac8` | **`d932121aaf0d6a2e29fb8815b25aaefcfcaca956`** |
| D59 | `d3da1f1` | `3602bf4b` | **`4f31a2778f1a86874dbced6bcf0d88b4d09e0fe5`** |
| D60 | `4c27db1` | — | **`7ee7e552056d727f0318daffd65f38a805a74380`** |
| D61 | `9f20a758` | — | **`dd94a4042a863c7367c4bf3b8bd29898823f3896`** |
| D62 | `db915707` | — | **`3fcfa49220b216b5f39b7eda80a65c16698ea108`** |

**⚠ Every SHA in the first two columns exists in NO repository, local or remote.**
**This table supersedes the mapping in D60 §5**, whose *target* SHAs have themselves been
destroyed. Where D63 §5 conflicts with D60 §5, **D63 governs**.

---

## 6. WHY THE RECOVERED RECORDS STILL CITE DEAD SHAs

D57–D62 were reconstituted **byte-for-byte** and still cite destroyed SHAs — including D60,
which documents the *first* recovery and maps to targets that no longer exist. They were
**deliberately NOT rewritten**:

- **O-3 / do not alter historical quotations** — a governance record states what it stated.
- **Correct by addition, never by edit** — the standing rule since D55.
- Rewriting would make the documents look internally consistent while **concealing that two
  lineage breaks occurred**. The broken references are themselves the audit evidence.

**D63 §5 is the binding resolution table.**

---

## 7. VALIDATION PERFORMED

- **Chain:** `b56a608` (D56) → `25df10c` (D57) → `d932121` (D58) → `4f31a27` (D59) →
  `7ee7e55` (D60) → `dd94a40` (D61) → `3fcfa49` (D62).
- **Blob-level:** all 10 identity files match their pre-recovery blob ids **exactly**.
- **Content-level:** all 17 backed-up files **byte-identical** to the pre-recovery backup.
- **Total diff `b56a608..HEAD`:** **17 files, +1388 / −55** — the 11 D58/D61 source/test files
  plus the 6 records. **No unexplained source change.**
- **Governed paths — 0 changes since D56:** `p05`–`p14`, `iips-platform`, `frontend/server`,
  D53, D54, D55, D56, `PHASE_13/14_GATE_ACCEPTANCE.md`, `program-v1.1-certification`,
  `evidence`.
- **L-7 sites confirmed NOT fixed** (0 changes): `Ad17Disclosure.tsx`,
  `p12-transport.ts`, `EvidenceExplorerComponents.tsx`, `ReplayExplorer.tsx`. The stale
  wording is still present at `Ad17Disclosure.tsx`:9, `:26` and `p12-transport.ts`:433.
- **`ReplayService.ts` and `executive-transport.ts`: 0 changes.**
- **Working tree clean. Nothing pushed.**

**No implementation tests were run.** This is a content-identity recovery; per the act,
test execution is not a substitute for recovery validation. D58/D61 floors
(frontend 740/0, P12 153/0, tsc clean) are **carried, not re-claimed**.

---

## 8. STANDING RISK — RECORDED, NOT DECIDED

This is the **second** total loss of unpushed governance commits. The no-push rule combined
with sandbox re-provisioning has now destroyed 3 commits, then 6. Content survived only
because it happened to remain in the working tree.

**A decision on whether to push the recovered lineage to `arena/01a0814b-…` is an authority
matter and is NOT taken here.** Recorded so the exposure is explicit rather than rediscovered
after a third loss.

---

## 9. WHAT THIS ACT DOES NOT DO

- **No L-7 implementation.** The four stale-comment sites are untouched; **L-7 remains OPEN**
  and, per the D63 adjudication, is **broader than D62 recorded** — it includes the
  **executable, user-rendered** `AD17_DISCLOSURE.m2Defect` constant and the `Ad17Note` prose.
- **D64 / D65 have NOT been performed.**
- Does not resolve **AD-17** or **M-2** — both **UNRESOLVED**.
- Does not close **L-3**, alter **L-2**, **L-4** or **R-2…R-7**.
- No source-code modification. No replay or transport remediation.
- No acceptance, no certification (**P13: NONE**), **no production authorization**.
- No gate reopened. No other branch created, switched to, or written. **Nothing pushed.**

---

## 10. STATUS

| Item | Status |
|---|---|
| Governance lineage | **RECOVERED (2nd time)** onto `arena/01a0814b-…` |
| L-1 | CLOSED (D56) |
| L-5 | CLOSED for all live sites (D58) |
| L-6 | CLOSED (D61) |
| **L-3** | **OPEN** — basis corrected by D62 |
| **L-7** | **OPEN** — broader than recorded; no implementation authorized |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-4, R-2…R-7 | OPEN |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push status | **NOT PUSHED** |
| Next free D-number | **D64** |
