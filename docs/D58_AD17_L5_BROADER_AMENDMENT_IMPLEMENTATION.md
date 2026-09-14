# D58 — AD-17 / L-5 BROADER SAFETY AMENDMENT: IMPLEMENTATION & CLOSURE EVIDENCE

**Act ID:** `P13-B-L5-AD17-BROADER-AMENDMENT-D58-IMPLEMENTATION-01`
**Role:** Implementation Agent
**Authority:** **D57** — `9316b54` — AD-17 broader safety amendment **AUTHORIZED (Decision A)**
**Parent chain:** D55 `53a6d148` → D56 `b56a608b` → D57 `9316b54` → **this record**
**Preconditions verified before any edit:** HEAD == `9316b54` ✅ · working tree clean (0 entries) ✅

---

## 1. AUTHORIZATION BASIS

D57 §1 authorized a bounded work package covering **only** the identified unsafe AD-17
presentation sites and their affected tests, permitting replacement of hand-rolled
verified-replay / byte-identity claims with the approved `Ad17Disclosure.tsx` treatment,
removal of pass/fail presentation of `byteIdentical`, and addition of absence-proving tests.

The pre-change verification act (`…PRECHANGE-VERIFICATION-01`) re-verified the D57 §3
inventory against `9316b54` and returned **INVENTORY CONFIRMED**, with no additional live
exposure and therefore no additional authority required.

**This act implements the authorized amendment only.** It performs no replay remediation,
no acceptance, no certification, and no production authorization.

---

## 2. EXACT CHANGES

### 2.1 S-1 — `frontend/src/features/company/CompanyTrustChain.tsx`

**Before** (L49-58): a `<p data-testid="company-replay-equivalence">` containing

```
<strong style={{ color: byteIdentical ? 'var(--color-status-positive)'
                                      : 'var(--color-status-negative)' }}>
  {byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'}
</strong>
```

**After:** a `<div>` with the **same `data-testid`**, rendering

```
<strong>Reported byteIdentical: <code>{String(byteIdentical)}</code> — NOT VERIFIED</strong>
<span>{replay.note}</span>
<Ad17Note />
```

- Verdict text **removed**; pass/fail colour **removed** (no `style` on the `<strong>`).
- `Ad17Note` imported from the approved `components/evidence/Ad17Disclosure`. **REUSE — no
  third presentation variant.**
- `<p>` → `<div>` is **required, not cosmetic**: `Ad17Note` renders a block-level `<p>`,
  which may not nest inside a `<p>`. This mirrors the identical fix already applied to UI17
  `ReplayExplorer.tsx` in D56.
- `ReplayLiteralDisplay` is deliberately **not** added here — `ReplaySummary` (amended in
  D56) already renders the full literal set immediately above, and repeating it would
  duplicate the `replay-literal-*` test hooks in one DOM.
- `data-testid` values `company-replay-equivalence`, `company-replay-original`,
  `company-replay-refs`, the `{replay.note}` rendering, props, and all evidence/provenance
  markup are **preserved unchanged**.

### 2.2 S-2 — `frontend/src/features/research/SectorIntelligence.tsx`

**Before** (L194-199): `<ul data-testid="sector-replay-summary">` with bare
`Reproduced: yes/no` and `Byte-identical: yes/no`, and **no AD-17 disclosure**.

**After:** a `<div>` with the **same `data-testid`**, containing a `<ul>` that retains
`Snapshot:` and `Difference available:` verbatim, plus `<ReplayLiteralDisplay>` fed
`replayServiceLiterals: { reproduced, byteIdentical }` with `verifiedReproduction: false`
and `verifiedByteIdentical: false`.

- Both raw literals now render through the approved treatment, marked
  **"Reported replay values — NOT VERIFIED"** with the standing `Ad17Note`.
- **No** pass/fail semantics and **no** `--color-status-positive/negative` introduced.
- `differenceAvailable` is a **platform capability flag, not a replay verdict**; it is
  outside AD-17 and is retained verbatim.

### 2.3 S-3 — `frontend/src/components/state/StateComponents.tsx`

**NOT MODIFIED.** `git diff --quiet` on this path returns clean. `ReplayState` remains
**DORMANT** with **zero non-test consumers** and is outside D57 implementation scope absent
new authority.

### 2.4 Tests (7 files)

| File | Change |
|---|---|
| `CompanyTrustChain.test.tsx` | 2 verdict-asserting tests → **5** absence-proving tests |
| `CompanyIntelligence.test.tsx` | 2 `MATCH` + 2 `DIFFERENCE` assertions replaced |
| `CrossSectorIntelligence.test.tsx` | 1 + 1 replaced |
| `DecisionMatrix.test.tsx` | 1 + 1 replaced |
| `ExecutiveDashboard.test.tsx` | 1 + 1 replaced |
| `PortfolioWorkspace.test.tsx` | 1 + 1 replaced |
| `SectorIntelligence.test.tsx` | literal assertions removed; **2** absence-proving tests added; `Difference available: no` coverage **preserved** |

**12 claim-encoding assertions removed across the 5 consumers**, each replaced by an
absence proof asserting: no `MATCH`/`DIFFERENCE` in the verdict `<strong>`, the literal
reported as `NOT VERIFIED`, and the `ad17-disclosure` node present.

**Scoping discipline (D57 / act requirement):** assertions are scoped to the verdict
`<strong>` inside `company-replay-equivalence`, **never** document-wide. `replay.note` is
payload free text and the fixtures set it to `'MATCH'` / `'Replay reproduced successfully;
byte-identical: MATCH'`. A blanket `/MATCH/` search would be **unsound, not stronger**, and
would pressure a future maintainer into weakening the guard. **No test was weakened to
accommodate fixture note text.** All pre-existing non-replay coverage is preserved.

---

## 3. CORRECTED CONSUMER MAPPING

D57 §3.2 described the `CrossSectorIntelligence` assertions under the heading
"UI04 Research". **That attribution was wrong.** Corrected here **by addition**; D57 is not
edited.

| Consumer of `CompanyTrustChain` | Import / render | Route |
|---|---|---|
| `CompanyIntelligence` — **UI02** | L29 / L151 | `/research/company/:id` |
| `CrossSectorIntelligence` — **UI15** (not UI04) | L25 / L152 | `/research/cross-sector` |
| `DecisionMatrix` — **UI06** | L26 / L158 | `/intelligence/decision-matrix` |
| `ExecutiveDashboard` | L27 / L175 | `/executive` |
| `PortfolioWorkspace` | L27 / L167 | `/portfolio`, `/portfolio/*` |

**`SectorIntelligence` (UI04, `/research/sector/:id`) does NOT import `CompanyTrustChain`.**
It was exposed via **S-2 only**. All five consumers above are **preserved and passing**.

---

## 4. ABSENCE PROOF

**Static.** Repo-wide scan of `frontend/src/**/*.tsx` excluding tests for
`MATCH — byte-identical`, `'DIFFERENCE'`, `Byte-identical:`, `Reproduced:` returns **only
governance comment lines** in the two amended files (`CompanyTrustChain.tsx`:53,
`SectorIntelligence.tsx`:198-200). **Zero rendering sites remain.**

Scan of the `company-replay-equivalence` region for `MATCH`, `DIFFERENCE`,
`color-status-*`: **zero matches.**

**Runtime.** Proven by the tests in §2.4 across all six live surfaces.

---

## 5. FLOORS — ALL HELD (observed, not assumed)

| Floor | Required | Observed |
|---|---|---|
| Frontend | ≥735 pass / 0 fail | ✅ **740 pass / 0 fail / 32 skipped** (55 files passed, 5 skipped) |
| P12 | 153 / 0 | ✅ **153 pass / 0 fail** |
| `tsc` app | clean | ✅ exit **0** |
| `tsc` server | clean | ✅ exit **0** |

Targeted run of the 7 affected suites: **99 passed / 0 failed**, no React DOM-nesting
warnings.

---

## 6. BOUNDARY VERIFICATION

`git status --porcelain` = exactly **9** modified files (2 source + 7 test), all within the
D57 §5 authorized scope. **0 changed files** in each of:

D55 · D56 · D57 · `PHASE_13_GATE_ACCEPTANCE.md` · `PHASE_14_GATE_ACCEPTANCE.md` ·
`p13/src` · `p12` · `p05`–`p11` · `p14` · `iips-platform` · `frontend/server`.

Because **`frontend/server` is entirely unchanged**, the **13 v2.0 routes are byte-unchanged
by construction**. `StateComponents.tsx` confirmed unchanged. No engine, methodology,
scoring, calibration or taxonomy file touched. No `ReplayService` or replay-semantics change.

---

## 7. WHAT THIS ACT DOES NOT DO

- **AD-17 / M-2 REMAIN UNRESOLVED.** `ReplayService` still returns `reproduced` and
  `byteIdentical` as **literals**. **No replay remediation was performed.**
- **No replay verification, reproduction or byte identity has been established or claimed.**
  A prohibited CLAIM was removed; nothing was proven true.
- No acceptance, no certification (P13 certification remains **NONE**), **no production
  authorization**.
- P13/P14/P15/P16 not reopened; UI02/UI04/UI06/UI15 P13 acceptance **PRESERVED UNCHANGED**.
- C6/C7 not broadened. D55/D56/D57 not edited — corrected by addition.

---

## 8. STATUS AFTER THIS RECORD

| Item | Status |
|---|---|
| L-1 | CLOSED (D56) |
| **L-5** | **CLOSED for all LIVE sites (S-1, S-2)** — see residual below |
| **L-6 (new, OPEN)** | `StateComponents.tsx`:46-54 `ReplayState` retains `REPLAY: MATCH` / `REPLAY: DIFFERENCE` with positive/negative colour. **DORMANT — zero non-test consumers**, therefore not a live exposure. Deliberately unmodified per D57 §3.1 / act S-3. Requires separate authority if it is ever to be amended or deleted. **Any future surface that mounts `ReplayState` would immediately reintroduce a prohibited AD-17 claim.** |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-3, L-4 | OPEN (carried, D55 §5) |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push status | **NOT PUSHED** — local commit only, per instruction |
| Next free D-number | **D59** |
