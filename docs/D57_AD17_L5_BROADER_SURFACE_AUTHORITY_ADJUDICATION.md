# D57 — AD-17 / L-5 BROADER SURFACE AUTHORITY ADJUDICATION

**Act ID:** `AD17-L5-BROADER-SURFACE-AUTHORITY-ADJUDICATION-01`
**Role exercised:** Program Authority
**Type:** AUTHORIZATION ADJUDICATION ONLY — not implementation, not acceptance, not certification, not production authorization.
**Base commit:** `b56a608b2a4b2e3524d1a82f12cf13eaeff35bb2` (D56), working tree clean at time of adjudication.
**Predecessor records:** D53 (A3 designation) → D54 (implementation authorization) → `cfe3353` → `9e4c2e18` (UI17) → D55 `53a6d148` (A3 acceptance) → D56 `b56a608b` (L-1 closure).

---

## 1. DECISION

### **A) AUTHORIZE BROADER AD-17 SAFETY AMENDMENT**

A new bounded work package is authorized, covering **only** the identified unsafe
AD-17 presentation sites and their affected tests, subject to §5 and §6 below.

This decision authorizes the **amendment only**. It performs no implementation and
grants no acceptance, no certification, and no production authorization.

---

## 2. AUTHORITY RATIONALE

**R-1 — The exposure is a prohibited CLAIM, not a deferred feature.**
AD-17 / M-2 remain UNRESOLVED: `ReplayService` returns `reproduced` and
`byteIdentical` as **literals**, not as the output of a verification procedure.
A surface that renders that literal as `MATCH — byte-identical` in
`--color-status-positive` asserts to the reader that replay verification
**succeeded**. No such verification exists anywhere in the examined repository
lineages. This is therefore an **unsubstantiated verification claim presented as
established fact** — exactly the class of defect the AD-17 firewall exists to
prevent. It is not a bounded or deferred item, and it must not be treated as one.

**R-2 — The same reasoning that justified D56 applies unchanged.**
D56 removed this presentation from the shared `ReplaySummary` and was accepted as
correct. The remaining sites render the *identical* claim through hand-rolled
markup. Authorizing removal in one component while leaving the same claim live in
six consumer surfaces would leave the program in a state where the governance
record says the claim was removed and the running UI still makes it. Refusing
authorization here would make D56 misleading in effect.

**R-3 — The amendment removes a claim; it does not create one.**
Nothing in the authorized package establishes replay verification, repairs M-2, or
improves the epistemic standing of any replay result. The end state is strictly
**weaker** in what it asserts. An amendment that only subtracts an unsupported
assertion cannot itself introduce an unsupported assertion, so the usual
conservatism against touching accepted surfaces does not bar it.

**R-4 — The approved treatment already exists and is accepted.**
`Ad17Disclosure.tsx` (`ReplayLiteralDisplay`, `Ad17Note`) was reviewed and used in
both the UI17 amendment and D56. REUSE it. **No third presentation variant may be
introduced.**

**R-5 — Option B rejected.** Carrying L-5 as a documented defect would leave a
live false verification claim in six user-facing surfaces, protected only by
prose in `docs/`. Documentation does not neutralise a rendered claim.

**R-6 — Option C rejected.** No governance question remains open. The defect, its
mechanism, its blast radius and its remedy are all specifically identified and
verified against the tree (§3). Further read-only review would produce no
information that would change this decision.

---

## 3. AFFECTED-SITE INVENTORY (verified at `b56a608b`)

Enumerated by direct inspection, not assumed.

### 3.1 Prohibited-presentation source sites

| # | File:line | Current rendering | Class |
|---|---|---|---|
| S-1 | `frontend/src/features/company/CompanyTrustChain.tsx`:53-54 | `byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'` inside `<strong>` coloured `--color-status-positive` / `--color-status-negative`, testid `company-replay-equivalence` | **Verification verdict + pass/fail colour** |
| S-2 | `frontend/src/features/research/SectorIntelligence.tsx`:197 | `<li>Byte-identical: {byteIdentical ? 'yes' : 'no'}</li>` in `sector-replay-summary` (also L196 `Reproduced: yes/no`) | **Raw literal, no AD-17 disclosure** |
| S-3 | `frontend/src/components/state/StateComponents.tsx`:46-54 | `ReplayState` maps `match`→`REPLAY: MATCH` positive, `difference`→`REPLAY: DIFFERENCE` negative | **Verification verdict + pass/fail colour** |

> **S-3 was NOT in the act's list.** It is a generic state component with the same
> prohibited semantics. It is currently rendered by **no production surface** —
> `ReplayState` has exactly one reference outside tests (its own definition). It is
> therefore **dormant, not live**. It is admitted to scope as **OPTIONAL** (§5.4):
> because it is unreferenced, amending it is low-risk hygiene, but failing to amend
> it is not a live exposure. Implementation MUST state which it did.

### 3.2 Consumer surfaces exposed via S-1

`CompanyTrustChain` is rendered by, and `company-replay-equivalence` is asserted in:

| Surface | Test file asserting the prohibited string |
|---|---|
| UI02 Company Workspace | `CompanyIntelligence.test.tsx`:180, 184, 188, 340, 343, 349 |
| UI04 Research / CrossSector | `CrossSectorIntelligence.test.tsx`:139, 163, 169 |
| UI06 Decision Center | `DecisionMatrix.test.tsx`:180, 204, 210 |
| Executive | `ExecutiveDashboard.test.tsx`:125, 149, 155 |
| Portfolio | `PortfolioWorkspace.test.tsx`:161, 185, 198 |
| Company trust chain (direct) | `CompanyTrustChain.test.tsx`:35, 52, 55, 57 |

### 3.3 Affected test sites for S-2

`SectorIntelligence.test.tsx`:233, 235 (`Byte-identical: yes`).

### 3.4 Affected test sites for S-3

`StateComponents.test.tsx`:26-33.

### 3.5 Already compliant — DO NOT RE-TOUCH

`EvidenceExplorerComponents.tsx` (`ReplaySummary`, amended in D56),
`ReplayExplorer.tsx` (UI17), `Ad17Disclosure.tsx`, and their tests. Residual
`MATCH`/`byteIdentical` strings in those files are **governance comments and
absence-proving assertions**, which are required and must be preserved.

---

## 4. FINDING OF GOVERNANCE SIGNIFICANCE

`PHASE_13_GATE_ACCEPTANCE.md` records **UI02 (L39), UI04 (L41), UI06 (L43) and
UI15 CrossSectorIntelligence (L52) as ✅ ACCEPTED**.

The authorized amendment **touches surfaces that carry accepted P13 status.** This
is permitted, and is not a reopening, **only because**:

- the accepted conditions for those surfaces are recorded against `dataSurfaces.js`
  and concern data-surface wiring — **none of them is a replay-presentation
  condition**; and
- the amendment removes an assertion rather than altering accepted behaviour.

**Binding consequence:** the amendment is recorded **by addition** in a new record.
`PHASE_13_GATE_ACCEPTANCE.md`, D55 and D56 **must not be edited**, and the accepted
status of UI02/UI04/UI06/UI15 is **PRESERVED UNCHANGED**. Implementation must not
describe this work as revisiting P13 acceptance.

---

## 5. AUTHORIZED SCOPE (the package MAY)

- **5.1** Replace hand-rolled verified-replay / byte-identity claims at **S-1** and
  **S-2** with the approved `Ad17Disclosure.tsx` treatment
  (`ReplayLiteralDisplay`, `Ad17Note`). **REUSE only — no third variant.**
- **5.2** Remove pass/fail (`--color-status-positive` / `--color-status-negative`)
  presentation of `byteIdentical` / `reproduced` at the sites in §3.1.
- **5.3** Add **absence-proving** tests at each amended site (no `MATCH`, no
  `DIFFERENCE`, no pass/fail colour in the replay subtree, AD-17 disclosure
  present, literals marked `NOT VERIFIED`) and amend the §3.2–3.4 tests that
  currently encode the prohibited claim.
- **5.4** **OPTIONAL:** amend **S-3** `ReplayState`. Implementation must explicitly
  state whether it did, and why.
- **5.5** Preserve existing component props, `data-testid` values, `role`
  attributes, routes, and all unrelated behaviour.
- **5.6** Produce one new governance record (**next free number: D58**) stating the
  authority basis, the exact changed-file list, static + runtime absence proof,
  observed test results, boundary verification, and any residual limitation.

**Authorized file scope is limited to the files named in §3.1–§3.4 and the new D58
record.** Any file outside that list requires a further authority act. FAIL-CLOSED.

---

## 6. PROHIBITIONS (the package MUST NOT)

- Modify `ReplayService`, the replay implementation, or remediate **M-2**.
- Establish, claim, or imply replay verification, reproducibility, or byte-identity.
- Modify `iips-platform`.
- Modify any engine, methodology, scoring, calibration, or taxonomy.
- Modify P13 bounded-surface governance artifacts — `p13/src/boundedSurfaces.js`,
  `p13/src/extendSurfaces.js`, `PHASE_13_GATE_ACCEPTANCE.md`,
  `PHASE_14_GATE_ACCEPTANCE.md`.
- Edit **D55** or **D56** (or any historical acceptance record). Correct by addition.
- Reopen P13 / P14 / P15 / P16, or alter their acceptance or certification status.
- Broaden **C6 / C7**.
- Authorize production, or assert certification of any surface.
- Change any of the **13 v2.0 routes**.
- Weaken or delete an existing absence-proving assertion from D56 or the UI17 work.
- Alter `SnapshotMetadataPanel`, evidence-reference rendering, or any non-replay
  region of the amended surfaces.

---

## 7. PRECONDITION ON IMPLEMENTATION

Per the act: **before any source modification**, implementation must produce an
explicit **work-item scope and affected-file inventory**. §3 and §5 of this record
constitute the authority-side inventory; implementation must re-verify it against
the then-current HEAD and declare any divergence **before** editing, rather than
discovering it afterwards.

**Regression floors to meet or exceed:** frontend **≥735 pass / 0 fail**;
P12 **153 pass / 0 fail**; `tsc` app + server clean. Never report a test result
that was not actually observed.

---

## 8. WHAT THIS ACT DOES NOT DO

- It does **not** perform the amendment.
- It does **not** resolve **AD-17** or **M-2**, which **REMAIN UNRESOLVED**.
- It does **not** accept, certify, or production-authorize any surface.
- It does **not** designate an acceptor. No A3 designation is made or implied here.
- It does **not** close **L-5**. L-5 remains **OPEN** until an implementation act
  and its own record close it.
- It does **not** affect **L-2, L-3, L-4** (carried from D55 §5) or **E13-10**.

---

## 9. STATUS AFTER THIS RECORD

| Item | Status |
|---|---|
| L-1 | CLOSED (D56) |
| **L-5** | **OPEN — amendment AUTHORIZED, not yet performed** |
| AD-17 / M-2 | **UNRESOLVED** |
| L-2, L-3, L-4 | OPEN (carried, D55 §5) |
| P13 certification | NONE |
| UI02/UI04/UI06/UI15 P13 acceptance | **PRESERVED UNCHANGED** |
| Production authorization | NOT GRANTED |
| Next free D-number | **D58** |
