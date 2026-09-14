# D71 — P12/P13 AD-17 SERIALIZED DISCLOSURE CORRECTION (TIER 1)

**Act ID:** `D71-IMPLEMENT-AUTHORIZED-P12-P13-AD17-SOURCE-CORRECTION`
**Type:** IMPLEMENTATION of a bounded accuracy correction in **accepted** P12/P13 source.
Not acceptance, not certification, not production activation, **not replay remediation**.
**Branch:** `arena/01a0814b-iips-production-market-data` · **Base:** `f649e2d6…` (D66), tree clean.

---

## 1. AUTHORITY CHAIN

| Authority | Act | Determination |
|---|---|---|
| **A3 P12 + A3 P13 — Sai** (D31, D33) | **D70** | **Option A AUTHORIZED** — correct the two strings; **P12/P13 re-acceptance NOT required** |
| **A2 — Sai** (`2d28e42`) | **D69** | **C6/C7 certification scope UNAFFECTED**; re-certification **NOT required** |
| **Program Authority** | **D71** | Implementation authorization satisfied by the explicit execution instruction for this act |

**Basis for the A2 finding (D69 §A):** `PHASE_12_CERTIFICATION_DECISION.md` certifies **C6 = screener
contract** (`p12/src/screenerContract.js`, P12-03) and **C7 = object-resolution contract**
(`objectResolutionContract.js`, P12-04). Criteria C6-1…C6-10 and C7-1…C7-8 reference **neither**
`evidenceReplayLinkage.js` (P12-05) nor `AD17_CONSTRAINT`/`m2Defect`. That record explicitly states it
*"does NOT resolve AD-17/M-2"* and assigns resolution to **P15**.

---

## 2. THE DEFECT CORRECTED

Both constants asserted that **`ReplayService` returns the values as literals**. That is **false**:

- `ReplayService.ts`:4-20 — *"`reproduced` and `byteIdentical` are **COMPUTED**, not literal"*
  (M-2 REPAIR, D41 Workstream C); L136-140 computes `byteIdentical` from three hash comparisons.
- `executive-transport.ts::computeCertifiedReplay()` **HARDCODES** `reproduced: true` /
  `byteIdentical: true` at **L425-426** and **L487-488**, and **never invokes** the `ReplayService`
  instance it constructs at L204 — **0 call sites**.

**The defect is transport-side hardcoding, not platform-side literal return.** Unlike the D66 sites,
these two strings are **serialized to API consumers**.

### Exact before → after (identical in both files)

**BEFORE:**
```
m2Defect: 'ReplayService returns reproduced/byteIdentical as literals',
```
**AFTER:**
```
m2Defect: 'the UI-facing reproduced/byteIdentical values are hardcoded by executive-transport, not produced by a runtime verification',
```

Wording is **identical to the D66-corrected UI disclosure**, so platform, transport and UI now state
one consistent fact.

---

## 3. FILES CHANGED (4) — SCOPE-RESTRICTED

| File | Change |
|---|---|
| `p12/src/evidenceReplayLinkage.js`:33 | **1 string line** — `AD17_CONSTRAINT.m2Defect` |
| `p13/src/boundedSurfaces.js`:34 | **1 string line** — `UI17_AD17_CONSTRAINT.m2Defect` |
| `p12/tests/evidenceReplayLinkage.test.js` | **+11** — regression guard (additive) |
| `p13/tests/boundedSurfaces.test.js` | **+8** — regression guard (additive) |

**Source diff: 2 files, +2/−2 — string values only.** No logic, no DTO shape, no key added/removed/
reordered, no `Object.freeze` change, no transport behaviour, no replay computation, no certification
semantics. All sibling fields (`ad17Status`, `authority`, `dtoConstraint`, `uiConstraint`, `surface`,
`resolutionGate`) **byte-unchanged**.

---

## 4. SERIALIZED-PAYLOAD VERIFICATION — 16/16 PASS

Executed against the real modules (scratch harness, not committed):

| Check | Result |
|---|---|
| Both constants carry the corrected string | **PASS** |
| Key order/sets unchanged (p12 5 keys, p13 5 keys) | **PASS** |
| Both still `Object.isFrozen` | **PASS** |
| `ad17Status: 'UNRESOLVED'` preserved (both) | **PASS** |
| `resolutionGate: 'P15 (E2E Certification)'` preserved | **PASS** |
| **Replay DTO serializes the corrected string** | **PASS** |
| **Replay DTO contains NO stale string** | **PASS** |
| DTO `replayServiceLiterals` shape intact | **PASS** |
| DTO `verifiedReproduction`/`verifiedByteIdentical` still `false` | **PASS** |
| **UI17 view serializes the corrected string / no stale string** | **PASS** |

Confirmed on the wire via `JSON.stringify`, reaching `governanceLimitations.ad17.m2Defect` on the four
P12 HTTP routes (`p12-transport.ts`:95 → :256/:287 → `p12-request-handler.ts`).

---

## 5. TESTS AND FLOORS — ALL FRESHLY OBSERVED

| Suite | Before | **After** |
|---|---|---|
| **P12 full** | 153 / 0 | **154 pass / 0 fail** (+1 guard) |
| **P13 full** | 85 / 0 | **86 pass / 0 fail** (+1 guard) |
| `p12/tests/evidenceReplayLinkage.test.js` | 17 | **18 / 0** |
| `p13/tests/boundedSurfaces.test.js` | 11 | **12 / 0** |
| `p12-transport.test.ts` | 48 | **48 / 0** |
| **Frontend vitest** | 740 / 0 | **740 pass / 0 fail**, 32 skipped |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |

**No existing assertion was weakened, altered or removed** — both guards are purely additive.

**Mutation-proof of the guards:** the stale string was temporarily reinstated in both modules; each
suite went to **1 failure** (17/1, 11/1) and returned to **0** on restore (18/0, 12/0). The guards
**genuinely detect recurrence** rather than passing vacuously.

---

## 6. EXCLUSIONS HONOURED

- `iips-platform/src/replay/ReplayService.ts` — **0 changes**.
- `frontend/server/executive-transport.ts` — **0 changes**; hardcoded values at L425-426/L487-488
  deliberately **left in place** (remediation not authorized).
- **`p11/src/evidenceSnapshotReplay.js`:197 — NOT MODIFIED.**
- No unrelated comment or test touched. No DTO/transport/logic change. **No replay verification or
  byte identity claimed anywhere.** P12/P13 gates **not reopened**. No historical D-record altered.

---

## 7. RESIDUAL STATUS

| Item | Status |
|---|---|
| **Tier 1 (2 live serialized defects)** | **CLOSED** by this act |
| **P11 dormant site** | **OPEN-DORMANT** — deferred per D68/D69/D70; executable and exported but consumed only by `p11/tests`; no DTO/transport/UI/API reach |
| **L-8** | **CLOSED for all live/serialized sites.** Remaining members are inert comments/test names (D67 sites 3, 5–16) — no exposure |
| **L-3** | **OPEN** — basis corrected (D62); transport hardcoding **not** remediated |
| **L-2** | **OPEN** | 
| **L-4 (R-2…R-7)** | **OPEN** |
| **AD-17 / M-2** | **UNRESOLVED** — resolution gate **P15** |
| L-1 / L-5 / L-6 / L-7 | CLOSED (D56 / D58 / D61 / D66) |
| **P12/P13 re-acceptance** | **NOT REQUIRED** (D70, A3 Sai) |
| **C6/C7 re-certification** | **NOT REQUIRED** (D69, A2 Sai) |
| **Certification** | **NONE granted by this act** (P13: NONE) |
| **Production authorization** | **NOT GRANTED** |
| Next free D-number | **D72** |

**No user-visible and no serialized stale AD-17/M-2 characterization remains in the repository.**
