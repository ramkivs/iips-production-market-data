# PHASE 07 — A2: PROGRAM AUTHORITY AMENDMENT-AUTHORIZATION FOR ACT 2 DURATION-UNIT ENUMERATION

> **ACT TYPE:** **Program Authority amendment-authorization act.** **NO IMPLEMENTATION. NO P01 MODIFICATION.**
> **PURPOSE:** Authorize the future additive P01 contract amendment establishing the **declared,
> versioned duration-unit enumeration** required by **UN-2**.
> ⛔ **P01 IS NOT MODIFIED BY THIS ACT. No enumeration is created. No field is added.**
> **The amendment is authorized but NOT executed and NOT binding until explicit A3 acceptance.**
> **Append-only. Edits nothing in P01. Decision log §15 appended.**
> **Identifier: `PHASE_07_ACT2_AMENDMENT_AUTHORIZATION` — no `Dnn` token claimed.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | Track B `ff000f76ab07ee245c466b3fa9292e1fb1bff48a` (A0-2 — A3 designation) |
| **P01** | ⛔ **UNMODIFIED** — 6 times (T1–T6), schema `1.1`, T6 binding, UN-2 unsatisfied |
| **Act 1** T6 | ✅ **A — ESTABLISHED** — T6 / `evaluationTime` binding (Act C) |
| **A0-2** | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki) designated |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** — **unchanged by this act** |
| **D3** | 🟡 **B — PARTIALLY READY** — **unchanged** |
| **O-1** | 🔴 **OPEN — 4/5 resolved** — **unchanged** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Acceptance / certification granted | **none** |

---

## 1. Authorization decisions

### 1.1 Scope

This authorization applies **exclusively** to the additive P01 contract change establishing the
**declared, versioned duration-unit enumeration** required by rule **UN-2** and the associated
freshness-duration field semantics. No other P01 contract, field, rule, schema, or artifact is
within scope.

### 1.2 Append-only exception

**A one-time, narrowly-scoped exception** to the standing *P00–P06 authority records and contracts
are append-only and are not to be modified* constraint is **explicitly authorized**, for **this
specific P01 additive amendment only**.

| Constraint | Effect |
|---|---|
| **Standing constraint** | P00–P06 accepted contracts and authority records are append-only; they are not edited, rewritten, or migrated in place |
| **Exception scope** | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §5 (add declared duration-unit enumeration), `P01_FIELD_DICTIONARY.md` (add freshness-duration field entries), `P01_DATA_CONTRACT.md` (add freshness-duration field to §11 or new subsection), and `P01_VALIDATION_RULES.md` (update SM-4 reference to include duration-unit members) **only** |
| **What the exception does NOT do** | Does not weaken, remove, or reinterpret the general historical-record constraint. Does not permit edits to any other P01 file. Does not permit edits to P00, P02, P03, P04, P05, or P06 contracts or records |
| **Duration** | Consumed by the single amendment execution (B2). After execution, the standing constraint resumes in full force |

### 1.3 Duration-unit enumeration — the authorized amendment

A declared, versioned enumeration of duration units is authorized:

| Property | Value |
|---|---|
| **Rule** | **UN-2**: *"Units come from a declared, versioned enumeration in the schema; free-text units are invalid"* |
| **Validation** | **SM-4**: *"`unit` not in the declared versioned enumeration → REJECT"* — enforceable for duration units after amendment |
| **Field** | `unit` (CONDITIONAL enum on CanonicalField) — existing field; amendment adds new valid members |
| **Nature** | Duration units for freshness quantities — the unit in which a freshness duration is expressed |
| **Explicit unit** | ✅ **MUST be explicit** — every dimensioned freshness quantity carries `unit` per UN-1 |
| **Never free-text** | ✅ **NEVER free-text** — only declared members are valid per UN-2 |
| **Separation rule** | Duration units are a distinct semantic category within the `unit` enumeration. They do not replace, alias, or conflict with existing `unit` members (index, percent, level, rate) used for other dimensioned quantities |

### 1.4 SV classification — MINOR (SV-2), explicitly determined

> ### **MINOR (SV-2)** — not assumed from Act 1 precedent; determined from governing evidence.

| SV-3 row | Analysis | Class |
|---|---|---|
| *"Add an **optional** field slot"* | A new conditional freshness-duration field is added. No existing field is changed. | **MINOR** |
| *"Add an enum member to an output-only enum"* | New members (minutes, seconds) added to the `unit` enumeration. The `unit` field is CONDITIONAL (not REQUIRED universally), and new members are additive to the existing set. | **MINOR** |
| *"Change a unit or currency obligation"* | **NOT applicable.** The existing `unit` obligation (CONDITIONAL: REQUIRED for dimensioned, PROHIBITED for dimensionless) is **unchanged**. The amendment adds valid members to the enumeration; it does not change when `unit` is required. | N/A |
| *"Tighten OPTIONAL → REQUIRED"* | **NOT applicable.** No field changes from optional to required. | N/A |

**The amendment is strictly additive: new enum members + new conditional field. No existing field,
obligation, type, or constraint is changed.** Classification: **MINOR (SV-2)**.

**Schema version increment: `1.1` → `1.2`** (MINOR per SV-2).

### 1.5 Enumeration members — resolved

| # | Member | Evidence |
|---|---|---|
| 1 | **`minutes`** | A0-2 scope: *"Minimum admitted units: minutes, seconds"* · Act 2 design evidence |
| 2 | **`seconds`** | A0-2 scope: *"Minimum admitted units: minutes, seconds"* · Act 2 design evidence |

**No additional members are authorized.** The enumeration is closed at two members. Extension
requires a new authorization act.

### 1.6 Enumeration identity and version — resolved

| Property | Value | Evidence |
|---|---|---|
| **Identity** | The duration-unit enumeration is a declared subset of the `unit` enum field's valid members, identified by the field name `unit` and its duration-unit members | Existing P01 pattern: enum members are declared per-field in the Field Dictionary |
| **Version** | Tied to the schema version — members are valid at schema `1.2` and later | **SV-4**: *"The version is carried on every snapshot; it is never implied by deployment"* |
| **Canonical declaration** | The enumeration is declared in `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §5 (where UN-2 lives) and referenced in `P01_FIELD_DICTIONARY.md` (where `unit` field members are listed) | UN-2 location + Field Dictionary pattern |
| **Schema version at declaration** | `1.2` | MINOR increment from `1.1` (SV-2) |

The existing P01 pattern is that enum members are declared inline with their field in the Field
Dictionary and versioned by the schema version. No separate enumeration identity document or
registry exists, and none is required. The schema version IS the enumeration version.

### 1.7 Schema location — resolved

| File | Section | Change |
|---|---|---|
| `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | §5 (Unit semantics) | Add a declared duration-unit enumeration subsection listing `minutes` and `seconds` as the authorized members |
| `P01_FIELD_DICTIONARY.md` | Field table | Add freshness-duration field entries (duration value + unit) |
| `P01_DATA_CONTRACT.md` | §11 (Quality and freshness metadata) or new subsection | Add freshness-duration field to the CanonicalField table |
| `P01_VALIDATION_RULES.md` | §5 (SM rules) | SM-4 reference updated to include the new duration-unit members |

### 1.8 Field definition — `unit` semantics for duration

| Property | Value |
|---|---|
| **Existing `unit` field** | CONDITIONAL enum on CanonicalField — REQUIRED for dimensioned quantities, PROHIBITED for dimensionless (UN-1, FD-5) |
| **Amendment effect on `unit`** | Add `minutes` and `seconds` as valid members. The CONDITIONAL obligation is **unchanged** |
| **Freshness duration quantity** | A dimensioned quantity: carries a numeric duration value and a `unit` from the duration-unit enumeration (`minutes` or `seconds`). Per UN-1, `unit` is REQUIRED |
| **Relationship to Q-4** | Q-4 preserved: *"Freshness is derived, from `receivedAt`, `asOf` and the applicable session/calendar baseline (D10) — the contract requires the inputs; P07 computes and thresholds."* The duration-unit enumeration declares the **unit** for the freshness duration; P07 continues to compute and threshold |
| **Relationship to existing `unit` members** | The existing members (index, percent, level, rate) used for `<NS>macro.unitOfMeasure` and other dimensioned quantities are **unchanged**. Duration units are a new semantic category within the same enumeration |
| **UN-1 preserved** | Every dimensioned freshness quantity carries `unit`. Dimensionless quantities must not carry one |
| **UN-2 preserved** | Units come from the declared, versioned enumeration. Free-text units remain invalid |
| **FD-5 preserved** | Dimensioned ⇒ `unit` REQUIRED. Dimensionless ⇒ PROHIBITED |

### 1.9 Domain applicability — resolved

| Property | Value |
|---|---|
| **Scope** | **Universal within P01** — the duration-unit enumeration applies to any domain that declares a dimensioned freshness quantity |
| **Not domain-restricted** | Unlike T6 (conditional on evaluation-contributing domains), duration units apply wherever freshness is dimensioned — freshness is a cross-cutting P01 concern (Q-4, §11) |
| **No domain expansion** | The amendment does not add new domains or change domain obligations for non-freshness fields. It enables existing freshness semantics with explicit units |
| **P07 relationship** | P07 consumes freshness inputs (including duration units) for threshold evaluation. The enumeration is a P01 contract element; P07 validates against it |

### 1.10 BC-1 / BC-3 / BC-4 / BC-5 treatment

| Rule | Requirement | How the authorized amendment satisfies it |
|---|---|---|
| **BC-1** | A consumer at schema `N` must read data at `N-k` minor versions without error | Duration units do not exist in pre-amendment data (schema `1.1` and earlier). A consumer at `1.2` reading `1.1` data encounters no duration-unit fields → `NOT_PROVIDED` (BC-2). A consumer at `1.1` reading `1.2` data encounters unknown optional duration-unit fields → ignored and recorded as ignored (FC-1). **No error in either direction.** |
| **BC-3** | An execution with **no** contributing market-data snapshot must behave **exactly as today** | Duration units are conditional — absent when no freshness duration is declared. An execution with no contributing market-data snapshot has no freshness duration → no duration unit → byte-identical to pre-amendment behavior. **Existing golden fixtures require no change.** |
| **BC-4** | The whole market-data contract delta is **additive and inert** for existing SNAPSHOT-only executions | Duration units are additive (new optional enumeration members + new conditional field) and inert (absent in existing SNAPSHOT-only executions). No existing execution path is affected. **The delta is inert for all existing certified baselines.** |
| **BC-5** | Historical snapshots are **never rewritten** to a newer schema | The amendment does not rewrite any historical snapshot. Existing snapshots retain their existing `schemaVersion`. New snapshots produced after amendment carry `schemaVersion: "1.2"`. **No historical record is altered.** |

### 1.11 Preserved invariants

| Invariant | Status | Evidence |
|---|---|---|
| **TS-2** precision | ✅ **Preserved** | Duration values must declare precision per NP-1 (*"Every decimal field declares precision"*). The enumeration itself is not a decimal — it is an enum. Precision applies to the numeric duration value, not the unit |
| **SV-4** snapshot-version discipline | ✅ **Preserved** | Schema version `1.2` will be carried on every snapshot per SV-4. Version is never implied by deployment |
| **BC-3** inertness | ✅ **Preserved** | No contributing snapshot → no duration unit → byte-identical (§1.10) |
| **BC-4** inertness | ✅ **Preserved** | Additive and inert for existing executions (§1.10) |
| **BC-5** historical snapshots | ✅ **Preserved** | No historical snapshot is rewritten (§1.10) |
| **UN-1** unit obligation | ✅ **Preserved** | Dimensioned ⇒ `unit` REQUIRED. The obligation is unchanged; new members are added |
| **UN-2** declared enumeration | ✅ **Satisfied** | The enumeration is declared, versioned (by schema version), and enforceable via SM-4 |
| **FD-4** dictionary add = MINOR | ✅ **Consistent** | *"Adding a key to this dictionary is a minor schema change"* — confirmed |
| **FD-5** unit/currency discipline | ✅ **Preserved** | Monetary ⇒ currency. Dimensioned ⇒ unit. Dimensionless ⇒ both PROHIBITED. Unchanged |

### 1.12 A3 acceptor confirmation — Ramakrishnan V. S. (Ramki), scoped to Act 2

| Property | Value |
|---|---|
| **Named A3 acceptor** | **Ramakrishnan V. S. (Ramki)** |
| **Role** | A3 gate acceptor |
| **Scope** | The P01 additive amendment establishing the duration-unit enumeration **only** |
| **Designation authority** | A0-2 (`PHASE_07_ACT2_A3_DESIGNATION.md`, commit `ff000f7`) |
| **Relationship to A0** | A0 designated Ramki for P01 T6/evaluationTime only — **consumed by Act C**. A0-2 is a **separate designation** for Act 2 |
| **Relationship to D10-3** | D10-3 designated Ramki for P06 only — **separate, unrelated** |
| **Designation ≠ acceptance** | This confirmation makes acceptance **possible**; it does not perform acceptance. Acceptance requires C2 |

### 1.13 Binding condition

| | |
|---|---|
| **Authorization** | ✅ **COMPLETED** — this document |
| **Execution** | 🔴 **NOT PERFORMED** — no P01 amendment has occurred |
| **Acceptance** | 🔴 **NOT PERFORMED** — no A3 acceptance act has occurred |
| **Binding** | 🔴 **NOT BINDING** — the enumeration is **not binding** until B2 executes and C2 accepts |

**Authorization ≠ execution ≠ acceptance.** An authorized-but-unexecuted amendment is AUTHORIZED
but **NOT BINDING**. An executed-but-unaccepted amendment is EXECUTED but **NOT BINDING**. No
consumer, no P07 work, and no downstream contract may rely on the duration-unit enumeration until
C2 occurs.

### 1.14 Historical acceptance evidence

The historical `P01_GATE_ACCEPTANCE.md` (blob `cf23f0e…`) criterion 4 states *"five distinct
times."* That record describes what was accepted at commit `547de1b`. It is **NOT** rewritten,
**NOT** re-blobbed, and **NOT** used as evidence for any amendment acceptance.

Act C (`PHASE_07_P01_T6_REACCEPTANCE.md`) accepted the six-time state at schema `1.1`. That
acceptance does **not** cover the duration-unit enumeration. Fresh acceptance (C2) is required.

---

## 2. Required sequence (A0-2 → A2 → B2 → C2 → D2)

| Step | Act | Status after this authorization |
|---|---|---|
| **A0-2** | Designate named A3 acceptor scoped to P01 for Act 2 | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki), `PHASE_07_ACT2_A3_DESIGNATION.md` |
| **A2** | Program Authority amendment-authorization (this act) | ✅ **COMPLETED** — this document |
| **B2** | Additive P01 amendment executed | 🔴 **NOT YET** — authorized but not executed |
| **C2** | Explicit P01 re-acceptance by named A3 | 🔴 **NOT YET** — requires B2 first |
| **D2** | Act 2 = A — ESTABLISHED | 🔴 **NOT YET** — requires C2 first |

**⚠ B2 without C2 leaves the enumeration non-binding. A2 without A0-2 would have left C2
impossible (now resolved).**

---

## 3. Explicitly NOT authorized, NOT granted, NOT resolved

| # | Not authorized / not granted | Preserved authority |
|---|---|---|
| 1 | ⛔ **P01 modification** — NOT performed by this act | P01 remains 6 times, schema `1.1`, UN-2 unsatisfied |
| 2 | ⛔ **Duration-unit enumeration** — NOT created by this act | No enumeration exists in P01 |
| 3 | ⛔ **Field creation** — NOT created by this act | No freshness-duration field exists |
| 4 | ⛔ **T6/evaluationTime** — NOT in scope (already established) | Act 1 = A — ESTABLISHED |
| 5 | ⛔ **15-minute threshold** — NOT adopted (D3 / Act 5) | D3 unchanged |
| 6 | ⛔ **Operational-state contract** — NOT accepted (Act 3) | Act 3 unchanged |
| 7 | ⛔ **5-second display boundary** — NOT resolved (Act 6) | Act 6 unchanged |
| 8 | ⛔ **P07 implementation permission** — NOT granted | P07 = NOT YET PERMITTED |
| 9 | ⛔ **P07 certification** — NOT granted | Certification = NONE |
| 10 | ⛔ **Production activation** — NOT authorized (P16 only) | Production = NOT AUTHORIZED |
| 11 | ⛔ **Append-only constraint weakening** — general constraint NOT weakened | Standing constraint preserved |
| 12 | ⛔ **Act 2 establishment** — Act 2 remains B — DECIDED, NOT ESTABLISHED | Act 2 unchanged |
| 13 | ⛔ **Additional duration-unit members** — NOT authorized beyond minutes and seconds | Enumeration is closed at two members |
| 14 | ⛔ **Threshold-set identity/version** — NOT resolved | D3 unchanged |
| 15 | ⛔ **Effective date** — NOT determined | D3 unchanged |

---

## 4. Resulting state

| Item | Status |
|---|---|
| **A0-2** | ✅ **RESOLVED** |
| **A2** | ✅ **COMPLETED** — this document |
| **Act 1** T6 | ✅ **A — ESTABLISHED** *(unchanged)* |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged)* — path now at step A2 complete; **B2 next** |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 **OPEN** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* |
| **O-1** | 🔴 **OPEN — 4/5 resolved** *(unchanged)* |
| **P01 contract** | ⛔ **UNMODIFIED** — 6 times, schema `1.1`, T6 binding, UN-2 unsatisfied |
| **P07 implementation** | ⛔ NOT YET PERMITTED |
| **Certification** | NONE GRANTED |
| **Production activation** | NOT AUTHORIZED |
| **Gate count** | 7 of 18 (unchanged) |

---

## 5. Mutation statement

| | |
|---|---|
| Act type | **Authorization act** + **one append-only governance record** + **decision log §15 appended** |
| Artifacts created | **exactly one** — this file |
| Decision log | **§15 appended** (additive only; §1–§14 unmodified) |
| **P01** modified | ❌ **NO** — all 10 files byte-identical |
| `P01_GATE_ACCEPTANCE.md` | ❌ **NOT MODIFIED** — blob `cf23f0e…` preserved |
| Act 1 record | ❌ **NOT MODIFIED** — blob `f6a44d5…` preserved |
| Act A record | ❌ **NOT MODIFIED** — blob `9ce09fc…` preserved |
| Act C record | ❌ **NOT MODIFIED** |
| A0-2 designation | ❌ **NOT MODIFIED** |
| Act 2 authority path | ❌ **NOT MODIFIED** |
| All prior authority records | **byte-identical** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| `origin/main` | **untouched** |

*Append-only. Every finding cites an existing record.*
