# D61 — AD-17 / L-6 `ReplayState` AMENDMENT: IMPLEMENTATION & CLOSURE EVIDENCE

**Act ID:** `D61-L6-REPLAYSTATE-PROACTIVE-AD17-AMENDMENT-IMPLEMENTATION-01`
**Role:** Implementation Agent
**Branch:** `arena/01a0814b-iips-production-market-data`
**Parent:** `4c27db1a21acb52af121b4bbcbf984fc8d0ecdfe` (D60)

---

## 1. AUTHORIZATION BASIS

**D59 — Decision B:** a bounded AD-17 safety amendment to `ReplayState` is AUTHORIZED
notwithstanding zero live consumers; **deletion is permitted and preferred** if zero
consumers is re-confirmed at implementation time (D59 §3.2).

**D60 — recovery mapping (binding).** The original D57/D58/D59 commit objects were
destroyed before being pushed. Per D60 §5:

| Record | Original SHA (destroyed) | Authoritative SHA |
|---|---|---|
| D57 | `9316b54` — exists nowhere | `8cb073f0c46526e96c3a7772beb904a5b99fb491` |
| D58 | `d834b7f` — exists nowhere | `3cf2bac8c5f4aed7f6a58c8467025a9d63df01d9` |
| D59 | `d3da1f1` — exists nowhere | `3602bf4b706713337ff809c5f717a4a5bedfaf3d` |

**Numbering:** D59 §4 anticipated this record as D60; D60 §8 corrected it to **D61**,
because the recovery record took D60. This act is **D61**.

**Preconditions verified before any edit:** branch correct ✅ · HEAD == `4c27db1a…` ✅ ·
working tree clean (0 entries) ✅ · zero non-test consumers re-verified ✅.

---

## 2. ZERO-CONSUMER VERIFICATION

**Pre-edit.** Repo-wide search for `ReplayState` (`.ts`, `.tsx`, `.js`, `.jsx`, excluding
`node_modules`) returned **6 references**: 1 definition in `StateComponents.tsx`:46 and 5 in
its own `StateComponents.test.tsx` (import + 4 usages). **Non-`StateComponents` references:
0.** No barrel/index re-export exists. No external use of the `state-replay*` testids.
**Zero-consumer condition CONFIRMED — deletion authorized.**

**Post-edit.** **0 executable references remain.** The only surviving occurrences are
governance comments and the single absence assertion `expect('ReplayState' in mod).toBe(false)`.
Search for `state-replay` testids across all `.tsx`: **NONE**.

---

## 3. EXACT TREATMENT — DELETION

`ReplayState` was **DELETED**, the preferred treatment under D59 §3.2.

**Removed from `frontend/src/components/state/StateComponents.tsx`** (former L46-54): the
entire function, including the verdict map
(`match → 'REPLAY: MATCH' / positive`, `difference → 'REPLAY: DIFFERENCE' / negative`,
`pending → 'REPLAY: PENDING' / neutral`), the `state-replay`/`state-replay-${match}` testids,
and the `var(--color-status-${status})` pass/fail colouring.

**Added:** a governance comment recording what was removed, why, the authority, and that
**no replacement replay-verification component is provided** — surfaces needing replay
literals use the approved `components/evidence/Ad17Disclosure` (`ReplayLiteralDisplay` /
`Ad17Note`), as applied in D56 and D58.

**Module docblock:** the stale header line listing `Replay-state` among the module's
components was corrected, since it would otherwise document an export that no longer exists.
This is the only other line touched in the file.

**Test file.** The `'ReplayState renders match/difference/pending'` case was **deleted, not
rewritten** — it asserted the literals `'MATCH'` and `'DIFFERENCE'`, thereby **encoding the
prohibited verdict**, and there is no component left to test. `ReplayState` was removed from
the import. A new **export-contract absence test** replaces it, asserting that the module
exports **no** `ReplayState` **and** that all six remaining exports are still present.

---

## 4. OTHER EXPORTS — UNCHANGED

`git diff` on `StateComponents.tsx` shows removed lines **only** for the `ReplayState`
function body and the one docblock line. `StateBox`, `LoadingState`, `EmptyState`,
`ErrorState`, `PermissionDeniedState`, `StaleDataState` and `UnavailableState` are
**byte-for-byte unchanged**, and their presence is now additionally guarded by the new
export-contract test.

No consumer, barrel, replay service, DTO, transport, `frontend/server`, or governed P05–P14
code was modified.

---

## 5. FLOORS — FRESHLY OBSERVED (not carried)

`node_modules` was absent after the re-clone and was restored with `npm ci` **before**
measuring, so every figure below is a fresh observation in this act.

| Floor | Required | Observed |
|---|---|---|
| Frontend | ≥740 pass / 0 fail | ✅ **740 pass / 0 fail / 32 skipped** (55 files passed, 5 skipped) |
| P12 | 153 / 0 | ✅ **153 pass / 0 fail** (41 suites) |
| `tsc` app | clean | ✅ exit **0** |
| `tsc` server | clean | ✅ exit **0** |

`StateComponents.test.tsx`: **6 passed** — test count preserved (one verdict test removed,
one absence test added). The frontend total of **740** independently reproduces the figure
D58 had recorded, which until now had only been *carried* through the recovery.

---

## 6. BOUNDARY VERIFICATION

`git status --porcelain` = exactly **2 modified files**, both authorized:
`StateComponents.tsx`, `StateComponents.test.tsx` (plus this new record).

**0 changed files** in: D53, D54, D55, D56, D57, D58, D59, D60,
`PHASE_13_GATE_ACCEPTANCE.md`, `p13/src`, `p12`, `p05`–`p11`, `p14`, `iips-platform`,
`frontend/server`, `frontend/src/features`, `frontend/src/components/evidence`.

`frontend/node_modules` confirmed git-ignored and not committed.

---

## 7. WHAT THIS ACT DOES NOT DO

- **AD-17 / M-2 REMAIN UNRESOLVED.** `ReplayService` still returns `reproduced` and
  `byteIdentical` as **literals**. **No replay remediation was performed.**
- **No replay verification, reproduction or byte identity was established or claimed.** A
  prohibited claim-capable component was deleted; nothing was proven true.
- **No replacement replay-verification semantics introduced.**
- No acceptance, no certification (**P13 certification: NONE**), **no production
  authorization**. No acceptor designated.
- P13/P14/P15/P16 not reopened; no acceptance or certification status altered.
- D55–D60 not edited. C6/C7 not broadened. **Nothing pushed.**

---

## 8. STATUS

| Item | Status |
|---|---|
| L-1 | CLOSED (D56) |
| L-5 | CLOSED for all live sites (D58) |
| **L-6** | **CLOSED** — `ReplayState` deleted; zero executable references remain |
| AD-17 / M-2 | **UNRESOLVED** |
| **L-2, L-3, L-4** | **OPEN** (carried, D55 §5) |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push status | **NOT PUSHED** |
| Next free D-number | **D62** |

**Closing note.** With L-1, L-5 and L-6 closed, **no known AD-17 prohibited presentation
remains in the frontend** — live or dormant. That is a statement about *presentation only*.
The underlying defect **M-2 is untouched and AD-17 remains UNRESOLVED**; its resolution gate
is **P15 (E2E Certification) under external Existing-IIPS authority**.
