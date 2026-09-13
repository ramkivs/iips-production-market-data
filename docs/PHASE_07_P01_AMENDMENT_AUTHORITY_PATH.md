# PHASE 07 — AUTHORITY PATH FOR AN ADDITIVE P01 AMENDMENT (T6)

> **ACT TYPE:** **Read-only authority-path adjudication.** **NO IMPLEMENTATION.**
> **PURPOSE:** Determine the **authorized path** by which a future additive P01 MINOR amendment
> establishing **T6 `evaluationTime`** may lawfully occur.
> ⛔ **P01 IS NOT MODIFIED BY THIS ACT. `evaluationTime` IS NOT CREATED. T6 IS NOT CREATED.**
> **The controlling user decision — *"NO — do not modify P01 at all"* — REMAINS IN FORCE.**
> **Append-only. Edits nothing. Claims no `Dnn` decision token.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | Track B `1690ece39055c1e4098ed6cf510cc5c1350eb8f6` (stated baseline `0b59dfd…` is its parent — one commit behind) |
| **P01** | ⛔ **UNMODIFIED** — **5 times, no T6, no `evaluationTime`**, 24/24 ACCEPTED |
| **Act 1 design** | ✅ **DECIDED** — `T6_EVALUATION_INSTANT_AUTHORITY_ACT` @ `fc81404`, sub-decisions **EVAL-1…EVAL-8** |
| **Act 1 status** | 🟡 **B — DECIDED, NOT ESTABLISHED** — **unchanged by this act** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Acceptance / certification granted | **none** |

---

## 1. Does an established P01 amendment procedure exist?

> ### ❌ **NO — NONE EXISTS**

| Evidence | Finding |
|---|---|
| Amendment vocabulary in `docs/p01/*.md` | **0 substantive hits** for *amend / change control / re-accept / supersede / modification procedure*. The sole match is `superseded` as a **`lifecycleStatus` enum value** (`P01_FIELD_DICTIONARY.md:133`) — unrelated |
| **SV-1…SV-6** | Govern **snapshot schema versions**, not document amendment. **SV-4**: *"The version is carried **on every snapshot**; it is never implied by deployment"* |
| **SV-3 change classification** | Classifies **data/schema changes**. It contains **NO ROW for "add a new distinct time"**. Its nearest rows: *"Add an **optional** field slot → MINOR"* · *"Add a new domain field class → MINOR"* · *"Remove or rename a field slot → **MAJOR**"* · *"Change a timestamp's precision or timezone convention → **MAJOR** (breaks byte-stability)"* |
| **BC-1…BC-5** | Constrain the **effect** of a change on consumers; they are not a procedure for **making** one |

> ### ⚠ **CONSEQUENCE — the change classification is itself undetermined**
> Adding **T6** is neither "an optional field slot" nor "a change to a timestamp's precision or
> timezone". **SV-3 does not classify it.** The Act 1 record asserts **MINOR / SV-2**, but that
> assertion is **not derived from the existing table**. **The classification must be determined by
> the authorizing act, not assumed.**

---

## 2. Is an existing authority designation capable of authorizing it?

**Two distinct powers are required — authorization and acceptance. They are not the same.**

| Power | Who holds it | Evidence |
|---|---|---|
| **AUTHORIZATION** of an amendment | ✅ **PROGRAM AUTHORITY** — the owner of the P01 contract | `T6_EVALUATION_INSTANT_AUTHORITY_ACT`: *"Authority: **Program Authority** — the owner of the P01 contract. ⚠ **No individual is named or inferred**"* |
| **ACCEPTANCE** of an amended P01 | 🔴 **NOBODY — no designation exists** | See below |

### 2.1 Why no acceptance authority currently exists

| Evidence | Verbatim |
|---|---|
| The acceptance rule | `PROGRAM_STATE.md:421` — acceptance requires *"an explicit acceptance act by a **named A3 gate acceptor**"* |
| The only named A3 | `P06_GATE_ACCEPTANCE.md:25` — *"**A3 acceptor** \| **Ramakrishnan V. S. (Ramki)** — designated by **D10-3**, **scoped to P06 only**; ⚠ **P07–P17 are NOT designated**"* |
| Scope confirmation | `PROGRAM_STATE.md:171` — *"**P06 A3 acceptor = Ramakrishnan V. S. (Ramki)**, scoped to **P06**"* |
| What the clearance does **not** do | `D8_AUTHORITY_RECONCILIATION.md:23` — it establishes *"program-authority clearance for A1–A4"* but **not** *"Name individual persons to A3/A4"*; `:40` — *"**No individual named.**"* |
| How P01 itself was accepted | `P01_GATE_ACCEPTANCE.md:21` — *"A3 phase-gate acceptance authority — **program-authority clearance established**"* — **no individual named**. This predates the named-acceptor discipline established by **D10-3** |

> ### 🔴 **NO EXISTING DESIGNATION COVERS A P01 RE-ACCEPTANCE**
> **D10-3 scoped the only named A3 acceptor to P06 exclusively.** **P01 is not in scope, and no A3
> acceptor has been designated for P01.** A re-acceptance today would be held to the **stricter**
> current rule (*a **named** A3 acceptor*) than P01's original acceptance was.

---

## 3. What exact authority act is required BEFORE P01 may be changed?

> ### ➡️ **A PROGRAM AUTHORITY AMENDMENT-AUTHORIZATION ACT** — a new durable record that must:

| # | Required content | Why |
|---|---|---|
| **1** | **Explicitly authorize departure** from the standing *"P00–P06 authority records/contracts are append-only and are not to be modified"* constraint, **for this specific additive change only** | The constraint is standing; only explicit authority can lift it, and only for the named scope |
| **2** | **Determine the SV change classification** of adding a sixth distinct time | **SV-3 has no row for it** (§1) — the classification cannot be assumed |
| **3** | **Resolve the four items the Act 1 record left open** — **N-1** T6's clock source · **N-2** the final binding field name · **N-3** envelope vs field carriage · **N-4** cardinality and applicable domains | `T6_EVALUATION_INSTANT_AUTHORITY_ACT` §1.2 defers all four to *"the P01 act"*; an amendment executed without them is incomplete |
| **4** | **Designate a named A3 acceptor scoped to P01** (or record that designation as a prerequisite) | §2.1 — **none exists** |
| **5** | **State that the amendment is NOT binding until accepted** | §5 |

⚠ **None of these is satisfied today.** The Act 1 record supplies the **decision**; it supplies
**none** of 1–5.

---

## 4. Is a post-amendment acceptance act required?

> ### ✅ **YES — A P01 RE-ACCEPTANCE IS REQUIRED**

| Evidence | Finding |
|---|---|
| **The accepted package is enumerated** | `P01_GATE_ACCEPTANCE.md:17` — *"Work package accepted: P01 canonical market-data contract package (**9 artifacts**, `docs/p01/`)"* at commit `547de1b`. An amendment **changes the accepted package** |
| **An accepted criterion's evidence changes** | `P01_GATE_ACCEPTANCE.md:53`, criterion **4** — *"Timestamp, currency, unit, precision semantics explicit \| **PASS** \| `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–2 (**five distinct times**, obligations per data class)"*. A six-time amendment **invalidates the stated evidence for a PASS criterion** |
| **The governing rule** | *"**Explicit gate acceptance; no automatic promotion.**"* — `PROGRAM_STATE.md:949`, `P01_GATE_ACCEPTANCE.md:3-5` |
| **Authorization ≠ acceptance** | `PROGRAM_STATE.md:490` — *"⚠ **Authorization ≠ acceptance.** 'Explicit gate acceptance; no automatic promotion.'"* |
| **Acceptance is performed, never inferred** | `P01_GATE_ACCEPTANCE.md:5` — *"Acceptance is not inferred from the completion of the P01 work package; **it is performed here**."* · `P06_GATE_ACCEPTANCE.md:5` — *"not inferred from work-package completion, from a passing review, from evidence availability, **or from authority clearance**"* |

⚠ **Re-acceptance must be performed by a named A3 acceptor scoped to P01 — which does not yet exist
(§2.1).**

---

## 5. Can the amendment become binding BEFORE that acceptance?

> ### ❌ **NO**

| Reason | Evidence |
|---|---|
| **Authorization ≠ acceptance** | `PROGRAM_STATE.md:490` |
| **Acceptance is never inferred** — not from completion, review, evidence availability **or authority clearance** | `P06_GATE_ACCEPTANCE.md:5`; `P01_GATE_ACCEPTANCE.md:5` |
| **Precedent** | **P06** became `ACCEPTED` only by an **explicit A3 act** (`P06_GATE_ACCEPTANCE.md:26` — *"**Explicit A3 acceptance act** — not automatic promotion, not inferred from readiness"*) |
| **The program avoids re-opening accepted outcomes by default** | `INCIDENT-01:86` — *"It is NOT a new gate review, **not a re-acceptance**, and not a re-litigation of any accepted outcome"* · `CHECKPOINT-03:141` — *"does not reopen, reinterpret…"* |

> **Therefore an executed-but-unaccepted P01 amendment is DRAFTED / EXECUTED but NOT BINDING.** No
> consumer, no P07 work and no downstream contract may rely on T6 until the re-acceptance act
> occurs.

---

## 6. Is the proposed sequence A → B → C → D correct?

> ### 🟡 **DIRECTIONALLY CORRECT BUT INCOMPLETE — one prerequisite is missing**

| Step | Proposed | Adjudicated |
|---|---|---|
| **A0** | *(absent)* | 🔴 **MISSING — designate a named A3 acceptor scoped to P01.** Without it, **C cannot be performed** (§2.1) |
| **A** | Authority authorizes P01 amendment | ✅ **correct**, but must additionally **determine the SV classification** and **resolve N-1…N-4** (§3) |
| **B** | P01 additive amendment is executed | ✅ **correct** — additive only; **BC-5** historical snapshots never rewritten |
| **C** | P01 amendment acceptance is performed | ✅ **correct and REQUIRED** (§4) — by the A3 designated at **A0** |
| **D** | Act 1 becomes **A — ESTABLISHED** | ✅ **correct** — and only at **D** |

> ### ➡️ **CORRECT SEQUENCE: `A0 → A → B → C → D`**
>
> **A0** designate a named **A3 acceptor scoped to P01** → **A** Program Authority
> amendment-authorization act (authorizes the departure, fixes the **SV classification**, resolves
> **N-1…N-4**) → **B** additive P01 amendment executed → **C** explicit **P01 re-acceptance** by the
> named A3 → **D** **Act 1 = A — ESTABLISHED**.
>
> ⚠ **B without C leaves T6 non-binding.** ⚠ **A without A0 leaves C impossible.**

---

## 7. STATUS

> # 🟡 **ACT 1 = B — DECIDED, NOT ESTABLISHED** *(unchanged)*
> This act determines the **path**; it establishes **nothing**. P01 remains unamended — **5 times,
> no T6**.

| Item | Status |
|---|---|
| **Act 1** T6 | 🟡 **B — DECIDED, NOT ESTABLISHED** — path now **A0 → A → B → C → D** |
| **Act 2** duration units | 🟡 **B** *(unchanged — **UN-2 unsatisfied**; a P01 schema act, same path applies)* |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 **OPEN — requires an explicit Program Authority decision** |

> # 🟡 **D3 = B — PARTIALLY READY** *(unchanged)* — **UN-2 unsatisfied**, operational-state contract
> **not accepted**, **effective date** and **threshold-set identity/version** unsupplied.

> # 🔴 **O-1 = OPEN — 4 OF 5 RESOLVED · D3 NOT RESOLVED** *(unchanged)* — **RP-4 stands**; P07-02
> exit unevidenceable. **No Hard dependency weakened, relaxed or reordered; no tracker status altered.**

> # ⛔ **IMPLEMENTATION BOUNDARY — NOT YET PERMITTED** *(unchanged)*
> `P07 IMPLEMENTATION = NOT YET PERMITTED` · `ACCEPTANCE = NOT ESTABLISHED` · `CERTIFICATION =
> NONE GRANTED` · production activation **NOT AUTHORIZED** (P16 only) · no provider selected
> (**DEP-P02-07**) · no licence or credentials.
> **An authority path is not authorization to walk it. Nothing in this record permits any P01 edit,
> any field creation, any P07 implementation, or any acceptance.**

---

## 8. Mutation statement

| | |
|---|---|
| Act type | **READ-ONLY adjudication** + **one append-only governance record** |
| Artifacts created | **exactly one** — this file |
| Files modified / renamed / deleted | **0** |
| **P01** modified | ❌ **NO** — 5 times, no T6, no `evaluationTime` |
| `evaluationTime` / T6 created | ❌ **NO** |
| Duration units established | ❌ **NO** — **UN-2 unsatisfied** |
| 15-minute threshold adopted | ❌ **NO** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Operational-state contract created | ❌ **NO** (already exists from `1690ece`) |
| Acceptance / certification granted | **none** |
| `Dnn` decision token claimed | **none** — descriptive filename, per `AUTHORITY_PATH` §0.1 and rule **R1** |
| Act 1 record renamed or rewritten | ❌ **NO** — blob `f6a44d50…` preserved |
| `origin/main` | **untouched** |

*Append-only. Every finding cites a line in an existing record or a measured corpus count.*
