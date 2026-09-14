# D56 — AD-17 L-1 CLOSURE (SHARED `ReplaySummary` SAFETY AMENDMENT)

**Artifact ID:** D56
**Title:** AD-17 L-1 — Bounded safety amendment to the shared `ReplaySummary`
**Act type:** BOUNDED SAFETY AMENDMENT + LIMITATION CLOSURE (not certification, not remediation)
**Authority:** `AD17-L1-UI16-COMPANY-TRUSTCHAIN-AUTHORITY-ADJUDICATION-01`, Decision A
**Baseline:** `53a6d148292c539a0e6258761f3c2acb4e4484bf`
**Date:** 2026-09-14
**Status:** ACTIVE

---

## 1. PURPOSE

D55 §5 recorded carried limitation **L-1**: the shared `ReplaySummary` component still
rendered `byteIdentical ? 'MATCH' : 'DIFFERENCE'` in pass/fail status colour, asserting a
**verified byte identity that has never been verified**, on **UI16 EvidenceExplorer** and
**CompanyTrustChain**.

This record documents the bounded amendment removing that prohibited presentation from the
shared component, and **closes L-1 as scoped to `ReplaySummary`** (see §7 for what remains).

⚠ **This record does NOT edit D55.** D55 remains byte-unchanged; L-1 is closed **by addition**,
per the standing correct-by-addition rule.

---

## 2. WHAT WAS WRONG

At baseline `53a6d148`, `frontend/src/components/evidence/EvidenceExplorerComponents.tsx`:65-66:

```
<span style={{ color: replay.byteIdentical ? 'var(--color-status-positive)' : 'var(--color-status-negative)', fontWeight: 600 }}>
  {replay.byteIdentical ? 'MATCH' : 'DIFFERENCE'}
</span>
```

`ReplayService` returns `reproduced` / `byteIdentical` as **LITERALS** (AD-17 / M-2,
**UNRESOLVED**). Rendering `MATCH` in a success colour asserted a verification that has
never been performed.

⚠ **Authority basis — stated precisely.** Unlike UI17, **UI16 is NOT bounded under BS-1**
(it maps to `extendSurfaces.js`, "show contributing snapshot IDs"), and **CompanyTrustChain
carries no P13 surface condition at all**. This amendment therefore does **not** claim those
surfaces breached an accepted condition. It rests on the narrower, sufficient ground that
**AD-17/M-2 is an UNRESOLVED program-level defect** (`PHASE_13_GATE_ACCEPTANCE.md`:146;
`PHASE_14_GATE_ACCEPTANCE.md`:235; `D4_14`:69) and the presentation asserted something untrue.

---

## 3. EXACT FILES CHANGED — 3

| File | Δ | Change |
|---|---|---|
| `frontend/src/components/evidence/EvidenceExplorerComponents.tsx` | modified | `ReplaySummary` only — prohibited presentation removed; reuses the approved `ReplayLiteralDisplay` |
| `frontend/src/features/evidence/EvidenceExplorer.test.tsx` | modified | UI16 test: 1 claim-asserting test replaced by **4 absence-proving** tests |
| `frontend/src/features/replay/ReplayExplorer.tsx` | modified | **Defect fix in prior P13-B-07 work** — outer `<p>` → `<div>`; `Ad17Note` renders a block `<p>` which may not nest inside a `<p>` (React `validateDOMNesting` warning). Presentation-neutral; no test change |

**No other file was changed.** `CompanyTrustChain.tsx` was **NOT** modified (§7).

### Treatment reused, not reinvented

The approved `Ad17Disclosure.tsx` (`ReplayLiteralDisplay`, `Ad17Note`) is reused verbatim.
**No third AD-17 presentation variant was created.**

### Consumer compatibility preserved

- `data-testid="replay-summary"` — **preserved**
- `role="status"` — **preserved**
- props `{ snapshotId, reproduced, byteIdentical }` — **preserved unchanged**

---

## 4. PROOF THE PROHIBITED PRESENTATION IS ABSENT

**Static** — scan of the `ReplaySummary` function body:

| Check | Result |
|---|---|
| `'MATCH'` literal | **NONE** |
| `'DIFFERENCE'` literal | **NONE** |
| `byteIdentical ?` ternary | **NONE** |
| `--color-status-positive` / `-negative` | **NONE** |

(The only textual `byteIdentical ?` remaining in the file is inside the **comment documenting
the removed defect**, not in JSX.)

**Runtime** — UI16 tests assert **absence**, not omission:

| Invariant | Result |
|---|---|
| `replay-summary` renders no `MATCH` | ✅ |
| `replay-summary` renders no `DIFFERENCE` | ✅ |
| No pass/fail status colour anywhere in the summary subtree | ✅ |
| AD-17/M-2 UNRESOLVED disclosure rendered | ✅ |
| Literals visible and marked **NOT VERIFIED** | ✅ |
| `data-testid="replay-summary"` still present | ✅ |
| Existing consumers still functional (CompanyTrustChain 3/3) | ✅ |

---

## 5. TEST RESULTS (observed)

| Suite | Floor | Observed |
|---|---|---|
| **Frontend (full)** | ≥ 732 pass / 0 fail | ✅ **735 pass / 0 fail / 32 skipped** |
| **P12 contracts** | 153 pass / 0 fail | ✅ **153 pass / 0 fail** |
| UI16 EvidenceExplorer | — | ✅ **10 pass** (was 7) |
| CompanyTrustChain | — | ✅ **3 pass** (unchanged) |
| UI17 ReplayExplorer | — | ✅ **11 pass** |
| `Ad17Disclosure` | — | ✅ **10 pass** |
| TypeScript app / server | clean | ✅ **clean (exit 0)** |

**Regression floor satisfied: 732 → 735 (+3), zero failures.**

---

## 6. BOUNDARY VERIFICATION

```
Files changed: EXACTLY 3
p05 … p14 · p12 · p13 · iips-platform · docs/ · program-v1.1-certification → ALL CLEAN
p13/src/extendSurfaces.js · p13/src/boundedSurfaces.js                     → CLEAN
D53 · D54 · D55                                                            → CLEAN (D55 NOT edited)
PHASE_13_GATE_ACCEPTANCE.md · PHASE_14_GATE_ACCEPTANCE.md                  → CLEAN
13 existing v2.0 routes                                                    → 13, unchanged
ReplayService / replay implementation                                      → UNCHANGED
```

---

## 7. L-1 CLOSURE — AND WHAT REMAINS OPEN

**L-1 is CLOSED as scoped to the shared `ReplaySummary` component.** The prohibited
presentation no longer reaches UI16 or CompanyTrustChain **through `ReplaySummary`**.

### ⚠ RESIDUAL EXPOSURE — NEW LIMITATION **L-5** (outside this authorization)

Inspection during execution found that **`CompanyTrustChain.tsx` renders its OWN unsafe block**,
independent of `ReplaySummary`, at lines 53-54:

```
<strong style={{ color: replay.replay.byteIdentical ? 'var(--color-status-positive)' : '...negative)' }}>
  {replay.replay.byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'}
```

`CompanyTrustChain.tsx` is a **source file NOT in the authorized scope** of this act, which
named only `ReplaySummary` plus the affected **tests**. Per **FAIL-CLOSED**, it was **NOT
modified**.

⚠ **Consequence: UI02 CompanyIntelligence, UI04 SectorIntelligence, UI06 DecisionMatrix,
Executive, Portfolio and CrossSector surfaces still render `MATCH — byte-identical`** via
`company-replay-equivalence` (evidenced by their existing passing tests, which still assert
that string). **This is a WIDER pre-existing exposure than L-1 described** and requires a
**separate, broader authority act**.

Also noted, **not** modified: `SectorIntelligence.tsx`:197 renders
`Byte-identical: {byteIdentical ? 'yes' : 'no'}` — a raw literal without pass/fail colour, but
**without an AD-17 disclosure**.

---

## 8. WHAT THIS ACT DOES **NOT** DO

| Item | Status |
|---|---|
| **L-1 (shared `ReplaySummary`)** | ✅ **CLOSED by this record** |
| **L-5 (CompanyTrustChain + wider surfaces)** | ⛔ **OPEN — separate authority act required** |
| AD-17 / M-2 | ⛔ **UNRESOLVED — NOT remediated.** A prohibited CLAIM was removed; no verification performed |
| Replay verification / reproducibility | ⛔ **NOT established, NOT claimed** |
| ReplayService / replay implementation | **UNCHANGED** |
| D55 | ✅ **UNCHANGED — not edited** |
| P13 / P14 / P15 / P16 | **NOT reopened; acceptance and certification UNCHANGED** |
| All P00–P16 statuses | **PRESERVED** |
| Certification (any kind) | ⛔ **NOT GRANTED** |
| Production authorization | ⛔ **NOT GRANTED** |
| C6 / C7 scope | **UNCHANGED** |
| `iips-platform` / engines / methodology / scoring / taxonomy | **UNCHANGED** |

---

**Recorded by:** Implementation Agent under the bounded L-1 authorization
**Baseline:** `53a6d148292c539a0e6258761f3c2acb4e4484bf`
**Artifact:** `docs/D56_AD17_L1_UI16_COMPANY_TRUSTCHAIN_CLOSURE.md`
