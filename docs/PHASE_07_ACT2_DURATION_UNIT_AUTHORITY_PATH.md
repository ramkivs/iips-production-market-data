# PHASE 07 — AUTHORITY PATH FOR AN ADDITIVE P01 AMENDMENT (ACT 2 — DURATION-UNIT ENUMERATION)

> **ACT TYPE:** **Read-only authority-path adjudication.** **NO IMPLEMENTATION.**
> **PURPOSE:** Determine the **authorized path** by which a future additive P01 MINOR amendment
> establishing the **declared, versioned duration-unit enumeration** (UN-2) may lawfully occur.
> ⛔ **P01 IS NOT MODIFIED BY THIS ACT. No enumeration is created. No `unit` is added.**
> **The standing append-only constraint on P00–P06 REMAINS IN FULL FORCE.**
> **Append-only. Edits nothing. Claims no `Dnn` decision token.**
> **Identifier: `PHASE_07_ACT2_DURATION_UNIT_AUTHORITY_PATH` — no `Dnn` token claimed.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | Track B `a44ee95997798d083a4324ab5d1a4698262af619` (Act C — T6 accepted) |
| **P01** | ⛔ **UNMODIFIED** — 6 times (T1–T6), schema `1.1`, 24/24 ACCEPTED + T6 accepted |
| **Act 1** T6 | ✅ **A — ESTABLISHED** — T6 / `evaluationTime` binding (Act C) |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** — **unchanged by this act** |
| **D3** | 🟡 **B — PARTIALLY READY** — **unchanged** |
| **O-1** | 🔴 **OPEN — 4/5 resolved** — **unchanged** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Acceptance / certification granted | **none** |

---

## 1. Existing duration-unit authority evidence

> ### 🟡 **DECIDED BUT NOT ESTABLISHED — UN-2 is a standing P01 rule with no satisfying enumeration**

| Evidence | Finding |
|---|---|
| `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §5, **UN-2** | *"Units come from a **declared, versioned enumeration** in the schema; free-text units are **invalid**"* — a standing rule since original P01 acceptance |
| `P01_VALIDATION_RULES.md`, **SM-4** | *"`unit` not in the declared versioned enumeration → **REJECT**"* — enforcement rule exists but references an enumeration that does not yet exist for duration units |
| `P01_FIELD_DICTIONARY.md`, `unit` row | `unit` is a **CONDITIONAL** `enum` field — *"REQUIRED for dimensioned quantities"* — but the enumeration members are not declared for duration units |
| `P01_SCHEMA_CATALOG.md` §4.4 | `<NS>macro.unitOfMeasure` has declared members: *index/percent/level/rate* — but **no duration units** (minutes, seconds) |
| `P01_DATA_CONTRACT.md` §11, **Q-4** | *"Freshness is **derived**, from `receivedAt`, `asOf` and the applicable session/calendar baseline (D10) — the contract requires the inputs; P07 computes and thresholds"* — freshness is derived but no duration-unit enumeration is declared |
| Act A §3, item 3 | *"⛔ **Duration units** — NOT established (Act 2, UN-2 unsatisfied)"* — explicitly excluded from Act A scope |
| Decision log §11.3 / §12.3, item 3 | *"⚠ **Duration units** — NOT established (Act 2)"* — repeatedly preserved across Act A, Act B, Act C |
| Prior authority path §7 | *"Act 2 duration units \| 🟡 B (unchanged — **UN-2 unsatisfied; a P01 schema act, same path applies**)"* — path precedent established |

> ### ⚠ **THE ENUMERATION REFERENCED BY UN-2 AND SM-4 DOES NOT EXIST FOR DURATION UNITS**
> The P01 contract already requires duration units to come from a declared, versioned enumeration
> (UN-2), and already rejects data whose `unit` is not in that enumeration (SM-4). But the
> enumeration for duration units (minutes, seconds) has never been declared. This is a standing
> contract gap, not a new requirement.

---

## 2. Existing P01 amendment procedure evidence

> ### ✅ **A PROCEDURE NOW EXISTS — established by the Act 1 T6 amendment path**

| Evidence | Finding |
|---|---|
| Prior authority path (`PHASE_07_P01_AMENDMENT_AUTHORITY_PATH.md`) | Established the **A0 → A → B → C → D** sequence for P01 amendments |
| Act A (`PHASE_07_P01_T6_AMENDMENT_AUTHORIZATION.md`) | Executed step **A** — Program Authority amendment-authorization |
| Act B (commit `1ef691157`) | Executed step **B** — additive P01 amendment |
| Act C (`PHASE_07_P01_T6_REACCEPTANCE.md`, commit `a44ee95`) | Executed step **C** — explicit A3 re-acceptance |
| Act 1 = **A — ESTABLISHED** | Step **D** completed |

> ### ⚠ **THE T6 PROCEDURE IS CONSUMED — IT DOES NOT EXTEND TO ACT 2**

| Evidence | Finding |
|---|---|
| Act A §1.1 | *"This authorization applies **exclusively** to the additive P01 contract change establishing the new distinct timestamp **T6 / `evaluationTime`**"* — scope is T6 only |
| Act A §1.2 | *"A **one-time, narrowly-scoped exception**...for **this specific P01 additive amendment only**"* — *"Duration: **Consumed by the single amendment execution (Act B)**. After execution, the standing constraint resumes in full force"* |
| Act A §1.2, "What the exception does NOT do" | *"Does not weaken, remove, or reinterpret the general historical-record constraint. **Does not permit edits to any other P01 file.**"* |
| Act C §1.9 | *"Acceptance by Ramakrishnan V. S. (Ramki) — designated specifically for **this** P01 amendment"* |
| Act C §2.1 | Acceptance boundary explicitly excludes duration units: *"Duration units (UN-2, Act 2)"* listed under "Not accepted" |

> ### ✅ **CONCLUSION — the T6 precedent established the path; it did not consume the path itself**
> The **procedure** (A0 → A → B → C → D) is established precedent. But each **execution** of the
> procedure requires its own authorization, execution, and acceptance. The standing append-only
> constraint resumes after each execution.

---

## 3. Required authority act

> ### ➡️ **A NEW PROGRAM AUTHORITY AMENDMENT-AUTHORIZATION ACT** — following the Act A pattern

| # | Required content | Why |
|---|---|---|
| **1** | **Explicitly authorize departure** from the standing *P00–P06 append-only* constraint, **for the specific duration-unit enumeration amendment only** | The Act A §1.2 exception was consumed by Act B. The standing constraint is in full force. A new one-time exception must be authorized. |
| **2** | **Determine the SV change classification** of adding a duration-unit enumeration | The prior authority path §1 established that SV-3's classification table may not cover every change type. The authorization act must determine the classification. Likely **MINOR (SV-2)** — adding enum members and/or optional fields is classified as MINOR in SV-3 — but the determination must be explicit, not assumed. |
| **3** | **Resolve Act 2 open items** — the declared enumeration members, the schema location of the enumeration, the freshness-duration field definition, domain applicability, precision rules | The Act 2 decision exists (B — DECIDED) but the execution parameters are not yet determined |
| **4** | **Designate a named A3 acceptor scoped to P01 for Act 2** (see §4) | The existing Ramki P01 designation is scoped to T6/evaluationTime only |
| **5** | **State that the amendment is NOT binding until accepted** | Authorization ≠ execution ≠ acceptance (established by Act A §1.8, Act C) |

---

## 4. Required A3 designation

> ### ✅ **YES — A NEW A3 DESIGNATION IS REQUIRED**

| Evidence | Finding |
|---|---|
| Act A §1.7, Scope | *"The P01 additive amendment establishing **T6 / `evaluationTime` only**"* |
| Act A §1.7, Relationship | *"It does **not** extend D10-3, does **not** designate A1/A2/A4, and does **not** constitute a **standing per-phase assignment** for P02–P05 or P07–P17"* |
| Act C §0, Authority basis | *"designated by Act A §1.7 / A0, scoped to P01 T6 amendment **only**"* |
| Act C §2.1, Acceptance boundary | Duration units explicitly listed under "Not accepted" |
| Standing acceptance rule | *"Explicit gate acceptance; no automatic promotion"* — `PROGRAM_STATE.md:949`, `P01_GATE_ACCEPTANCE.md:3-5` |

> ### ⚠ **THE EXISTING RAMKI P01 DESIGNATION CANNOT BE EXTENDED BY INFERENCE**
>
> The user's standing instruction is explicit: *"Do not silently extend that scope to duration
> units."* Act A §1.7 is explicit: *"scoped to P01 T6 amendment **only**."* The designation was
> created for a specific, consumed purpose. It does not cover Act 2.
>
> ### ➡️ **A0-2 REQUIRED: Designate named A3 acceptor scoped to P01 for Act 2**
>
> The designation may name the same person (Ramki) or a different person. The designation is a
> **separate act** from A0 — it must be explicitly performed, not inferred from the prior
> designation. The Program Authority (the owner of the P01 contract) must make this designation.

---

## 5. Required post-amendment acceptance

> ### ✅ **YES — FRESH P01 RE-ACCEPTANCE IS REQUIRED**

| Reason | Evidence |
|---|---|
| The accepted package changes | Act C accepted the six-time P01 at schema `1.1`. Adding a duration-unit enumeration changes the accepted package. |
| A criterion's evidence changes | `P01_GATE_ACCEPTANCE.md` criterion 4 references §1–2 (timestamps, obligations). If Act 2 adds to §5 (unit semantics), the unit-related evidence changes. |
| Acceptance is never inferred | *"Explicit gate acceptance; no automatic promotion"* — acceptance is not inferred from tests, from Act A authorization, from Act B execution, or from Act 1 acceptance |
| Precedent | Act C was required after Act B even though Act A had authorized the change. The same applies here. |
| Act C boundary | *"Duration units (UN-2, Act 2)"* listed under "Not accepted" — explicit exclusion |

> ### ➡️ **C2 REQUIRED: Explicit P01 re-acceptance by the A3 designated at A0-2**
>
> The acceptance act must explicitly accept the duration-unit enumeration amendment. It cannot
> rely on Act C's acceptance of T6.

---

## 6. Exact authority sequence

> ### ➡️ **`A0-2 → A2 → B2 → C2 → Act 2 = A — ESTABLISHED`**

| Step | Act | Description | Status |
|---|---|---|---|
| **A0-2** | Designate named A3 acceptor scoped to P01 for Act 2 | Program Authority designates a named A3 gate acceptor for the duration-unit enumeration amendment. May be the same person as the T6 designation (Ramki) but requires a **separate explicit designation**. | 🔴 **NOT PERFORMED** |
| **A2** | Program Authority amendment-authorization act | Authorizes departure from append-only for this specific amendment. Determines SV classification. Resolves enumeration members, schema location, field definition, domain applicability. States amendment is NOT binding until accepted. | 🔴 **NOT PERFORMED** |
| **B2** | Additive P01 amendment executed | Adds the declared, versioned duration-unit enumeration to the P01 schema. Additive only. BC-3/BC-4 inert. BC-5 historical snapshots never rewritten. Schema version increment (likely `1.1` → `1.2`, MINOR, SV-2 — **classification to be determined by A2**). | 🔴 **NOT PERFORMED** |
| **C2** | Explicit P01 re-acceptance by named A3 | The A3 designated at A0-2 explicitly accepts the amended P01 with the duration-unit enumeration. | 🔴 **NOT PERFORMED** |
| **D2** | **Act 2 = A — ESTABLISHED** | Duration-unit enumeration is established and binding. UN-2 satisfied. SM-4 enforceable for duration units. | 🔴 **NOT PERFORMED** |

**⚠ A2 without A0-2 leaves C2 impossible. B2 without C2 leaves the enumeration non-binding.**

### 6.1 Relationship to Act 1 sequence

The Act 2 sequence follows the **same pattern** established by the Act 1 T6 sequence:

| | Act 1 (T6) | Act 2 (duration units) |
|---|---|---|
| A0 | A0 — Ramki designated for P01 T6 | A0-2 — designate for P01 Act 2 |
| A | Act A — T6 authorization (`f0c2136`) | A2 — duration-unit authorization |
| B | Act B — T6 executed (`1ef691157`) | B2 — duration-unit executed |
| C | Act C — T6 accepted (`a44ee95`) | C2 — duration-unit accepted |
| D | Act 1 = A — ESTABLISHED | Act 2 = A — ESTABLISHED |
| Pattern | ✅ COMPLETED | 🔴 NOT STARTED |

---

## 7. P01 amendment scope at B2

When B2 is executed, the amendment must establish:

| Requirement | P01 contract basis |
|---|---|
| Declared, versioned duration-unit enumeration | UN-2: *"Units come from a declared, versioned enumeration in the schema"* |
| Minimum admitted units: `minutes`, `seconds` | Act 2 design decision |
| `unit` required for every dimensioned freshness quantity | UN-1: *"Every dimensioned quantity carries `unit`"* |
| TS-2 precision preserved | SV-3: *"Change declared precision → MAJOR"* — precision must NOT change |
| SV-4 snapshot-version discipline | *"The version is carried on every snapshot; it is never implied by deployment"* |
| BC-3 inertness | No evaluation → no T6 → byte-identical; similarly no freshness duration → byte-identical |
| BC-4 inertness | Inert for existing SNAPSHOT-only executions |
| BC-5 historical snapshots | Historical snapshots retain their existing schema version; never rewritten |

### 7.1 Likely affected P01 files (determination deferred to A2)

| File | Likely change |
|---|---|
| `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | Add duration-unit enumeration (new subsection in §5) |
| `P01_DATA_CONTRACT.md` | Add freshness-duration field or update §11 |
| `P01_FIELD_DICTIONARY.md` | Add duration-unit field entries |
| `P01_VALIDATION_RULES.md` | Potentially reference the new enumeration in SM-4 |
| Schema version | `1.1` → `1.2` (MINOR, SV-2 — **classification to be determined by A2**) |

⚠ The exact scope is for **A2** to determine. This adjudication identifies likely affected files
for planning purposes only.

---

## 8. STATUS

> # 🟡 **ACT 2 = B — DECIDED, NOT ESTABLISHED** *(unchanged)*
> This act determines the **path**; it establishes **nothing**. P01 remains unamended for duration
> units. UN-2 remains unsatisfied.

| Item | Status |
|---|---|
| **Act 1** T6 | ✅ **A — ESTABLISHED** *(unchanged — Act C)* |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** — path now **A0-2 → A2 → B2 → C2 → D2** |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 **OPEN** *(unchanged)* |

> # 🟡 **D3 = B — PARTIALLY READY** *(unchanged)* — UN-2 unsatisfied; the Act 2 authority path
> is now determined; execution requires A0-2.

> # 🔴 **O-1 = OPEN — 4 OF 5 RESOLVED · D3 NOT RESOLVED** *(unchanged)* — RP-4 stands; P07-02
> exit unevidenceable. **No Hard dependency weakened, relaxed or reordered; no tracker status altered.**

> # ⛔ **IMPLEMENTATION BOUNDARY — NOT YET PERMITTED** *(unchanged)*
> `P07 IMPLEMENTATION = NOT YET PERMITTED` · `CERTIFICATION = NONE GRANTED` · production activation
> **NOT AUTHORIZED** (P16 only).
> **An authority path is not authorization to walk it. Nothing in this record permits any P01 edit,
> any field creation, any P07 implementation, or any acceptance.**

---

## 9. Mutation statement

| | |
|---|---|
| Act type | **READ-ONLY adjudication** + **one append-only governance record** |
| Artifacts created | **exactly one** — this file |
| Files modified / renamed / deleted | **0** |
| **P01** modified | ❌ **NO** — 6 times, schema `1.1`, UN-2 unsatisfied |
| Duration-unit enumeration created | ❌ **NO** |
| `unit` added or changed | ❌ **NO** |
| Schema version changed | ❌ **NO** — remains `1.1` |
| P01 acceptance evidence modified | ❌ **NO** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Decision log | **§13 appended** (additive only; §1–§12 unmodified) |
| Acceptance / certification granted | **none** |
| `Dnn` decision token claimed | **none** — descriptive filename |
| All prior authority records | **byte-identical** |
| `origin/main` | **untouched** |

*Append-only. Every finding cites a line in an existing record or a measured corpus count.*
