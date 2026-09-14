# D59 — L-6 / `ReplayState` DORMANT RESIDUE: AUTHORITY ADJUDICATION

**Act ID:** `D59-L6-REPLAYSTATE-DORMANT-RESIDUE-AUTHORITY-ADJUDICATION-01`
**Role:** Program Authority
**Type:** AUTHORIZATION ADJUDICATION ONLY — no implementation, acceptance, certification or production authorization.
**Base commit:** `d834b7f` (D58), working tree clean at adjudication.
**Chain:** D55 `53a6d148` → D56 `b56a608b` → D57 `9316b54` → D58 `d834b7f` → **D59**

---

## 1. DECISION

### **B) AUTHORIZE PROACTIVE DORMANT-COMPONENT AMENDMENT**

A bounded AD-17 safety amendment to `ReplayState` is **AUTHORIZED**, notwithstanding
that it currently has zero live consumers.

Implementation is **separately gated** and must be recorded in its own record.

---

## 2. AUTHORITY RATIONALE

**R-1 — Dormancy is a property of the current wiring, not of the component.**
`ReplayState` is a **public `export`** of a module that **30 other files already import**
(`LoadingState`, `ErrorState`, `UnavailableState`, …). It sits directly alongside the
helpers every surface reaches for. Becoming live requires adding one identifier to an
import line that, in many of those files, **already exists**. The cost of the hazard
materialising is one keystroke; the barrier is nil.

**R-2 — Option A protects the prohibition with documentation alone.**
A would leave a component that renders `REPLAY: MATCH` in `--color-status-positive` in the
tree, guarded only by prose in `docs/`. That is the same failure mode already observed
twice in this program: L-1 was closed on `ReplaySummary` while `CompanyTrustChain`
hand-rolled the identical claim, and L-5 then had to be adjudicated separately. **Relying
on a future implementer to read a governance record before importing an exported symbol is
exactly the control that has already failed here.** It should not be relied on a third time.

**R-3 — The regression surface is zero, so the amendment is strictly cheaper now.**
Zero non-test consumers means no live surface can regress. The only affected test is
`StateComponents.test.tsx`:26-33. Amending now is materially safer than amending later,
when the component may have acquired consumers whose accepted tests encode the verdict —
which is precisely the situation that made S-1 expensive (12 assertions across 5 files).

**R-4 — The amendment only subtracts.** As in D56 and D58, it removes an unsupported
assertion. It establishes nothing, so it cannot introduce a new claim.

**R-5 — Option A rejected** per R-1/R-2: the residue is one import away from live, and
documentation does not neutralise an exported component.
**Option C rejected:** no further adjudication is required. The component, its blast
radius (zero), its single test, and the approved remedy are all specifically identified.

---

## 3. AUTHORIZED SCOPE

**Single authorized source file:** `frontend/src/components/state/StateComponents.tsx`,
function `ReplayState` (L46-54) **only**.
**Single authorized test file:** `frontend/src/components/state/StateComponents.test.tsx`
(the `ReplayState` case, L26-33) **only**.

The implementation **MAY**:

- **3.1** Remove `REPLAY: MATCH` / `REPLAY: DIFFERENCE` verdict text and the
  `--color-status-positive` / `--color-status-negative` treatment.
- **3.2** Render the state neutrally, or **alternatively remove `ReplayState` entirely**
  together with its test. Deletion is **permitted and preferred** if — and only if — the
  implementer re-verifies at that moment that non-test consumers remain **zero**. A
  component that cannot make the claim is safer than one that must be policed.
- **3.3** Attach the approved `Ad17Disclosure` treatment (`Ad17Note` /
  `ReplayLiteralDisplay`) **if** the component is retained and displays replay values.
  **REUSE only — no new presentation variant.**
- **3.4** Add absence-proving coverage if the component is retained.
- **3.5** Preserve the other six exports (`LoadingState`, `EmptyState`, `ErrorState`,
  `PermissionDeniedState`, `StaleDataState`, `UnavailableState`) **byte-unchanged** —
  they are imported by 30 files and are **out of scope**.

The implementation **MUST NOT**:

- Modify `ReplayService`, replay semantics, or remediate **M-2**.
- Establish or imply replay verification, reproduction, or byte identity.
- Modify `iips-platform`, any engine, methodology, scoring, calibration or taxonomy.
- Modify P13 governance artifacts, `PHASE_13/14_GATE_ACCEPTANCE.md`, `p13/src/**`.
- Edit **D55, D56, D57 or D58**. Correct by addition only.
- Reopen P13/P14/P15/P16 or alter their acceptance/certification.
- Broaden C6/C7. Authorize production. Touch `frontend/server` or any v2.0 route.
- Touch any file outside §3's two named files. **FAIL-CLOSED.**

**Floors:** frontend **≥740 pass / 0 fail** (raised by D58), P12 **153 / 0**, `tsc` app and
server clean. Never report an unobserved result.

---

## 4. NUMBERING CORRECTION

The act text directs that implementation "be recorded as D59". **D59 is this adjudication.**
The implementation record must therefore be **D60**. Recorded here to prevent a collision;
the act text is not altered.

---

## 5. WHAT THIS ACT DOES NOT DO

- Does **not** perform the amendment. **L-6 remains OPEN** until an implementation record
  closes it.
- Does **not** resolve **AD-17** or **M-2**, which **REMAIN UNRESOLVED**.
- Does **not** accept, certify, or production-authorize anything. P13 certification: **NONE**.
- Does **not** designate an acceptor.
- Does **not** affect L-2, L-3, L-4 (D55 §5) or E13-10.
- Until implemented, `ReplayState` **MUST NOT** be treated as an approved replay-verification
  component, and **any new consumer of it requires fresh authority.**

---

## 6. STATUS

| Item | Status |
|---|---|
| L-1 | CLOSED (D56) |
| L-5 | CLOSED for all live sites (D58) |
| **L-6** | **OPEN — amendment AUTHORIZED, not performed** |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-3, L-4 | OPEN |
| P13 certification | NONE |
| Production authorization | NOT GRANTED |
| Push status | NOT PUSHED |
| Next free D-number | **D60** |
