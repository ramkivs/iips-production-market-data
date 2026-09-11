# PHASE 07 — A0-2: A3 DESIGNATION FOR ACT 2 DURATION-UNIT ENUMERATION AMENDMENT

> **ACT TYPE:** **A3 gate-acceptor designation act.** **NO IMPLEMENTATION. NO P01 MODIFICATION.**
> **PURPOSE:** Establish an explicit, named A3 gate-acceptor designation for the forthcoming P01
> additive amendment establishing the declared, versioned duration-unit enumeration (UN-2).
> ⛔ **P01 IS NOT MODIFIED BY THIS ACT. No enumeration is created. No `unit` is added.**
> **No P01 edit is authorized.**
> **The standing P00–P06 append-only constraint remains in full force.**
> **Append-only. Edits nothing in P01. Decision log §14 appended.**
> **Identifier: `PHASE_07_ACT2_A3_DESIGNATION` — no `Dnn` token claimed.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | Track B `baf4198a9428bf438f8ed8a2b917b6f01ab8240c` (Act 2 authority-path adjudication) |
| **P01** | ⛔ **UNMODIFIED** — 6 times (T1–T6), schema `1.1`, T6 binding, UN-2 unsatisfied |
| **Act 1** T6 | ✅ **A — ESTABLISHED** — T6 / `evaluationTime` binding (Act C) |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** — **unchanged by this act** |
| **D3** | 🟡 **B — PARTIALLY READY** — **unchanged** |
| **O-1** | 🔴 **OPEN — 4/5 resolved** — **unchanged** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Acceptance / certification granted | **none** |

---

## 1. Designation authority

| Property | Value |
|---|---|
| **Designating authority** | **Program Authority** — the owner of the P01 contract |
| **Authority basis** | `T6_EVALUATION_INSTANT_AUTHORITY_ACT` (commit `fc81404`): *"Authority: **Program Authority** — the owner of the P01 contract"* · Act 2 authority-path adjudication §4: *"The Program Authority (the owner of the P01 contract) must make this designation"* |
| **Act type** | A0-2 — prerequisite designation within the Act 2 authority path (A0-2 → A2 → B2 → C2 → D2) |

---

## 2. Named A3 acceptor designation

| Property | Value |
|---|---|
| **Named A3 acceptor** | **Ramakrishnan V. S. (Ramki)** |
| **Role** | A3 gate acceptor |
| **Scope** | The P01 additive amendment establishing the **declared, versioned duration-unit enumeration** required by **UN-2** — **only** |
| **Authority for this designation** | Program Authority (this act, §1) — A0-2 prerequisite resolved |
| **Path position** | A0-2 ✅ → A2 → B2 → C2 → D2 |

---

## 3. Exact Act 2 scope

This A3 designation is scoped **exclusively** to:

| # | Scope element |
|---|---|
| 1 | The P01 additive amendment establishing a **declared, versioned enumeration** for duration units, as required by rule **UN-2** (*"Units come from a declared, versioned enumeration in the schema; free-text units are invalid"*) |
| 2 | Minimum admitted units: **minutes**, **seconds** |
| 3 | `unit` required for every dimensioned freshness quantity, per **UN-1** (*"Every dimensioned quantity carries `unit`"*) |
| 4 | Preservation of **TS-2** precision, **SV-4** snapshot-version discipline, **BC-3** inertness, **BC-4** inertness, **BC-5** historical-snapshot preservation |
| 5 | Schema version increment (classification to be determined by **A2**, not this act) |

---

## 4. Explicit exclusions

| # | Exclusion | Evidence |
|---|---|---|
| 1 | ⛔ **P02–P05 contracts** — NOT in scope | Same exclusion as Act A §1.7: *"does not constitute a standing per-phase assignment for P02–P05 or P07–P17"* |
| 2 | ⛔ **P07–P17 phases** — NOT in scope | Same exclusion as Act A §1.7 |
| 3 | ⛔ **Unrelated P01 changes** — NOT in scope | This designation covers the duration-unit enumeration amendment only; no other P01 contract, field, rule, schema, or artifact |
| 4 | ⛔ **T6 / `evaluationTime`** — NOT in scope (already accepted) | Covered by the prior A0 designation (Act A §1.7), consumed by Act C |
| 5 | ⛔ **Duration-unit members** — NOT determined by this act | Enumeration members belong to **A2** (authorization) and **B2** (execution) |
| 6 | ⛔ **SV classification** — NOT determined by this act | Classification belongs to **A2** |
| 7 | ⛔ **Schema details** — NOT determined by this act | Schema location, field definition, domain applicability belong to **A2/B2** |
| 8 | ⛔ **Effective date** — NOT determined by this act | Belongs to **A2/B2** |
| 9 | ⛔ **Threshold values** — NOT determined by this act | Belongs to D3 resolution |
| 10 | ⛔ **15-minute threshold** — NOT adopted | D3 / Act 5 — separate authority path |
| 11 | ⛔ **Operational-state contract** — NOT accepted | Act 3 — separate authority path |
| 12 | ⛔ **5-second boundary** — NOT resolved | Act 6 — separate authority path |

---

## 5. Non-acceptance / non-authorization statement

> ### ⛔ **DESIGNATION ≠ ACCEPTANCE ≠ AUTHORIZATION**
>
> **This A0-2 designation makes acceptance *possible*; it does not perform acceptance.**
> Acceptance requires a separate explicit act by Ramakrishnan V. S. (Ramki) after the
> amendment is executed (C2).
>
> **This A0-2 designation does not authorize any P01 edit.** The standing P00–P06
> append-only constraint remains in full force. A P01 modification requires a separate
> Program Authority amendment-authorization act (A2), which must explicitly authorize
> departure from the append-only constraint for the specific Act 2 amendment.
>
> **No P01 file is modified by this act. No enumeration is created. No `unit` is added.**
> **No schema version change occurs.**

| Statement | Status |
|---|---|
| A0-2 designates a named A3 acceptor | ✅ **DONE** (this act) |
| A0-2 authorizes P01 modification | ❌ **NO** |
| A0-2 performs acceptance | ❌ **NO** |
| A0-2 determines SV classification | ❌ **NO** |
| A0-2 determines enumeration members | ❌ **NO** |
| A0-2 determines schema details | ❌ **NO** |
| A0-2 establishes Act 2 | ❌ **NO** |

---

## 6. Relationship to the Act 2 authority path

| Step | Act | Status after A0-2 |
|---|---|---|
| **A0-2** | Designate named A3 acceptor scoped to P01 for Act 2 | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki), §2 above |
| **A2** | Program Authority amendment-authorization | 🔴 **NOT YET** — A0-2 resolved but A2 not performed |
| **B2** | Additive P01 amendment executed | 🔴 **NOT YET** — requires A2 first |
| **C2** | Explicit P01 re-acceptance by named A3 | 🔴 **NOT YET** — requires B2 first |
| **D2** | Act 2 = A — ESTABLISHED | 🔴 **NOT YET** — requires C2 first |

**⚠ A2 without A0-2 would have left C2 impossible (now resolved). B2 without C2 leaves the enumeration non-binding. A0-2 alone changes nothing.**

### 6.1 Relationship to prior designations

| Designation | Scope | Status |
|---|---|---|
| **D10-3** | A3 acceptor for **P06 only** | ✅ Consumed (P06 accepted) |
| **A0** (Act A §1.7) | A3 acceptor for **P01 T6/evaluationTime only** | ✅ Consumed (Act C accepted) |
| **A0-2** (this act) | A3 acceptor for **P01 Act 2 duration-unit enumeration only** | ✅ **DESIGNATED** — awaiting A2 |

Each designation is **separate**, **narrowly scoped**, and **consumed by its specific acceptance act**. No designation extends to any other purpose.

---

## 7. Evidence reconciliation

| Evidence | Reconciled |
|---|---|
| **UN-2** — *"Units come from a declared, versioned enumeration in the schema"* | ✅ Scope element §3.1 |
| **Act A §1.1** — *"exclusively…T6 / evaluationTime"* | ✅ Not extended — this is a new, separate designation (§4.4) |
| **Act A §1.2** — *"one-time, narrowly-scoped exception…consumed by Act B"* | ✅ Standing constraint preserved (§5) |
| **Act A §1.7** — *"scoped to P01 T6 amendment only"* | ✅ Prior designation consumed; A0-2 is separate (§6.1) |
| **Act C §0** — *"scoped exclusively to…T6 / evaluationTime"* | ✅ Confirmed not extended (§4.4) |
| **Act C §2.1** — duration units under "Not accepted" | ✅ Fresh acceptance will be required at C2 (§5) |
| **Act 2 authority path §4** — *"A0-2 REQUIRED…may name the same person (Ramki)"* | ✅ Ramki designated by Program Authority (§2) |
| **Act 2 authority path §4** — *"must be explicitly performed, not inferred"* | ✅ This act is the explicit performance (§2) |
| **Act 2 authority path §6** — *"A0-2 → A2 → B2 → C2 → D2"* | ✅ Path position A0-2 resolved (§6) |
| **P01 amendment procedure** — established by Act 1 precedent | ✅ Same procedure followed |

---

## 8. Resulting state

| Item | Status |
|---|---|
| **A0** (Act 1 T6) | ✅ RESOLVED — consumed by Act C |
| **A0-2** (Act 2 duration units) | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki) designated (this act) |
| **Act 1** T6 | ✅ **A — ESTABLISHED** *(unchanged)* |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged)* — path now at step A0-2 complete; **A2 next** |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 **OPEN** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* |
| **O-1** | 🔴 **OPEN — 4/5 resolved** *(unchanged)* |
| **P01 contract** | ACCEPTED — 6 times, schema `1.1`, T6 binding, UN-2 unsatisfied |
| **P07 implementation** | ⛔ NOT YET PERMITTED |
| **Certification** | NONE GRANTED |
| **Production activation** | NOT AUTHORIZED |
| **Gate count** | 7 of 18 (unchanged) |

---

## 9. Mutation statement

| | |
|---|---|
| Act type | **A3 designation act** + **one append-only governance record** + **decision log §14 appended** |
| Artifacts created | **exactly one** — this file |
| Decision log | **§14 appended** (additive only; §1–§13 unmodified) |
| **P01** modified | ❌ **NO** — all 10 files byte-identical |
| `P01_GATE_ACCEPTANCE.md` | ❌ **NOT MODIFIED** — blob `cf23f0e…` preserved |
| Act 1 record | ❌ **NOT MODIFIED** — blob `f6a44d5…` preserved |
| Act A record | ❌ **NOT MODIFIED** — blob `9ce09fc…` preserved |
| Act C record | ❌ **NOT MODIFIED** |
| Act 2 authority path | ❌ **NOT MODIFIED** |
| All prior authority records | **byte-identical** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| `origin/main` | **untouched** |

*Append-only. Every finding cites an existing record.*
