# PHASE 07 — ACT C2: P01 DURATION-UNIT ENUMERATION RE-ACCEPTANCE ACT

> **ACT TYPE:** **Explicit A3 acceptance act** for the amended P01 duration-unit contract.
> **AUTHORITY:** Ramakrishnan V. S. (Ramki) — A3 gate acceptor designated by A0-2
> (`PHASE_07_ACT2_A3_DESIGNATION.md`), scoped exclusively to the P01 additive amendment
> establishing the declared, versioned duration-unit enumeration (UN-2 / UN-8).
> **BASELINE:** Track B `794c07c083f43a390d4991c30bd813ea0d9e5e9b` (B2 — amendment executed).
> ⛔ **NO P01 ARTIFACT IS MODIFIED BY THIS ACT.** This act **evaluates and accepts** the contract
> that B2 established; it does not alter it.
> **Append-only. No prior record is renamed, rewritten or re-blobbed.**
> **Identifier: `PHASE_07_ACT2_REACCEPTANCE` — no `Dnn` token claimed.**

---

## 0. Authority and path position

| | |
|---|---|
| **A3 acceptor** | **Ramakrishnan V. S. (Ramki)** — designated by A0-2, scoped to P01 Act 2 duration-unit amendment only |
| **Authority basis** | A0-2 (`PHASE_07_ACT2_A3_DESIGNATION.md`, commit `ff000f7`) §2: *"Ramakrishnan V. S. (Ramki) is designated as A3 gate acceptor, scoped exclusively to the P01 additive amendment establishing the declared, versioned duration-unit enumeration required by UN-2"* |
| **Path position** | A0-2 ✅ → A2 ✅ → B2 ✅ → **C2 (this act)** → D2 |
| **Act being accepted** | B2 (commit `794c07c`) — additive P01 duration-unit enumeration amendment |
| **Acceptance scope** | The amended P01 contract at schema `1.2` — **duration-unit enumeration addition only** |

---

## 1. Acceptance evidence — ten criteria verified against actual amended state

### 1.1 Schema/version

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| P01 schema = `1.2` | ✅ | §9: *"increments the canonical schema version from 1.1 to 1.2 (MINOR per SV-2)"* |
| Classification = MINOR (SV-2) | ✅ | A2 §1.4: determined from SV-3 evidence; amendment is strictly additive |
| Transition = `1.1` → `1.2` | ✅ | §9 schema version note |

### 1.2 Duration-unit enumeration

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| UN-8 exists | ✅ | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §5, UN-8 row |
| Exactly two members: `minutes`, `seconds` | ✅ | UN-8: *"minutes, seconds. These are the only admitted duration units"* |
| No additional duration units present | ✅ | Grep across all 4 amended files confirms only `minutes` and `seconds` |
| No additional units authorized | ✅ | A2 §1.5: *"No additional members are authorized. The enumeration is closed at two members"* |
| Enumeration is declared and versioned | ✅ | UN-8: *"The enumeration is versioned with the schema version (SV-4)"* |
| Free-text duration units are invalid | ✅ | UN-8: *"Free-text duration units are invalid (UN-2)"* |

### 1.3 Freshness fields

**✅ PASS**

| Field | Verified | Source |
|---|---|---|
| `freshnessDuration` | ✅ | Field Dictionary §2: `C dec`; Data Contract §3.2 row 15: CONDITIONAL |
| `freshnessUnit` | ✅ | Field Dictionary §2: `C enum`; Data Contract §3.2 row 16: CONDITIONAL |
| Relationship coherent | ✅ | `freshnessUnit` REQUIRED iff `freshnessDuration` present; PROHIBITED when absent |
| Precision declared | ✅ | `freshnessDuration`: *"Precision declared per NP-1"* |
| Schema version tagged | ✅ | Both fields: *"Schema 1.2 (Act 2 / A2 / B2)"* |
| Q-7 rule added | ✅ | Data Contract §11 Q-7 declares freshness duration semantics |

### 1.4 Unit obligation

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| UN-1 preserved | ✅ | *"Every dimensioned quantity carries unit. Dimensionless quantities must not carry one"* — unchanged |
| UN-2 satisfied | ✅ | Duration-unit enumeration is now declared and versioned (UN-8) |
| `unit` CONDITIONAL obligation unchanged | ✅ | Field Dictionary: `unit` remains `C enum` — REQUIRED for dimensioned, PROHIBITED for dimensionless |
| FD-5 preserved | ✅ | *"Dimensioned ⇒ unit REQUIRED. Dimensionless ⇒ both PROHIBITED"* — unchanged |
| Existing `unit` members unchanged | ✅ | index, percent, level, rate for `<NS>macro.unitOfMeasure` — unchanged |

### 1.5 Validation

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| SM-3 preserved | ✅ | *"Dimensioned value without unit; dimensionless value with one → REJECT"* — unchanged |
| SM-4 updated | ✅ | *"unit not in the declared versioned enumeration (including duration-unit members minutes, seconds at schema 1.2, UN-8) → REJECT"* |
| No free-text duration unit permitted | ✅ | SM-4 rejects any unit not in declared enumeration |
| Existing validation semantics not weakened | ✅ | SM-1 through SM-14 all preserved; SM-4 enhanced (not weakened) |

### 1.6 T6 preservation

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| Six-time model intact | ✅ | T1–T6 all present in §1 table |
| `evaluationTime` present and binding | ✅ | §1 T6 row; Field Dictionary; Data Contract §3.2 row 14 |
| TS-7 clock source rule intact | ✅ | *"Clock source for evaluationTime is the evaluation/scoring engine's evaluation boundary, recorded once; never back-filled or recomputed"* |
| T6 domain obligations intact | ✅ | D01/D03/D07 (+ T6 where evaluation contributes) — unchanged |
| Schema 1.1 note preserved | ✅ | §9: *"1.0 to 1.1 (MINOR per SV-2)"* — unchanged |

### 1.7 Invariants

**✅ PASS**

| Invariant | Verified | Evidence |
|---|---|---|
| **TS-2** | ✅ | *"Precision is fixed and declared per the schema version"* — unchanged. Duration values must declare precision per NP-1 |
| **SV-4** | ✅ | *"The version is carried on every snapshot; it is never implied by deployment"* — schema `1.2` will be carried on every snapshot |
| **BC-3** | ✅ | No contributing snapshot → no freshness duration → byte-identical. Existing golden fixtures require no change |
| **BC-4** | ✅ | Additive and inert for existing SNAPSHOT-only executions. No existing execution path affected |
| **BC-5** | ✅ | Historical snapshots never rewritten. Existing snapshots retain their original `schemaVersion` |
| **FD-4** | ✅ | *"Adding a key to this dictionary is a minor schema change"* — confirmed: two new keys added (freshnessDuration, freshnessUnit) |
| **FD-5** | ✅ | *"Dimensioned ⇒ unit REQUIRED. Dimensionless ⇒ both PROHIBITED"* — unchanged |
| **UN-1** | ✅ | Every dimensioned quantity carries unit — unchanged |
| **UN-2** | ✅ | Units from declared, versioned enumeration — now satisfied for duration units |

### 1.8 Scope

**✅ PASS**

| Property | Verified | Evidence |
|---|---|---|
| Exactly 4 P01 files changed | ✅ | `git diff --name-only HEAD~1..HEAD`: DATA_CONTRACT, FIELD_DICTIONARY, TIMESTAMP_CURRENCY_UNIT_RULES, VALIDATION_RULES |
| No P02–P05 changes | ✅ | Only `docs/p01/` files changed |
| No P07–P17 changes | ✅ | Only `docs/p01/` files changed |
| No threshold changes | ✅ | No threshold-related content modified |
| No operational-state changes | ✅ | No operational-state content modified |
| No 5-second boundary changes | ✅ | No display-boundary content modified |
| 16 insertions, 2 deletions | ✅ | All additions are duration-unit related |

### 1.9 Historical acceptance

**✅ PASS**

| Item | Verified | Evidence |
|---|---|---|
| `P01_GATE_ACCEPTANCE.md` byte-identical | ✅ | Blob `cf23f0eda0ee917626d90270e883073c5d52d62c` — identical to committed blob |
| Criterion 4 "five distinct times" preserved | ✅ | Historical record states what was accepted at `547de1b` |
| Historical criterion NOT used as B2 evidence | ✅ | This C2 act provides fresh evidence for the duration-unit amendment |
| Historical record NOT rewritten | ✅ | NOT modified, NOT re-blobbed |

### 1.10 Authority

**✅ PASS**

| Property | Verified |
|---|---|
| Acceptance by Ramakrishnan V. S. (Ramki) | ✅ — stated at §0 and in the acceptance decision below |
| Designated by A0-2 for Act 2 specifically | ✅ — `PHASE_07_ACT2_A3_DESIGNATION.md` §2 |
| Scoped to duration-unit amendment only | ✅ — A0-2 §3: *"scoped exclusively to the P01 additive amendment establishing the declared, versioned duration-unit enumeration required by UN-2"* |
| Separate from prior designations | ✅ — A0-2 §6.1: separate from D10-3 (P06) and A0 (P01 T6) |

---

## 2. Explicit acceptance decision

> ### ✅ **ACCEPTED**
>
> **I, Ramakrishnan V. S. (Ramki), as the A3 gate acceptor designated by A0-2 for the P01
> additive amendment establishing the declared, versioned duration-unit enumeration (UN-2),
> explicitly ACCEPT the amended P01 contract as established by B2 at commit `794c07c`.**
>
> **The amended P01 contract — schema version `1.2`, MINOR (SV-2), with the declared duration-unit
> enumeration (`minutes`, `seconds`, UN-8), `freshnessDuration` and `freshnessUnit` fields, and all
> preserved invariants — is now ACCEPTED.**
>
> Acceptance is not inferred from B2 execution, from A2 authorization, from test results,
> or from A0-2 designation. **It is performed here.**

### 2.1 Acceptance scope — what is accepted

| Accepted | Not accepted |
|---|---|
| Schema version `1.2` | Threshold values or threshold adoption (D3 / Act 5) |
| UN-8 duration-unit enumeration | Operational-state contract (Act 3) |
| Exactly `minutes` and `seconds` | 5-second display boundary (Act 6) |
| `freshnessDuration` / `freshnessUnit` fields | P07 implementation |
| SM-4 duration-unit reference | P07 certification |
| Q-7 freshness duration rule | Production activation |
| MINOR (SV-2) classification | Duration-unit enumeration expansion beyond two members |
| BC-1/BC-2/BC-3/BC-4/BC-5 compatibility | Any unrelated P01 change |

### 2.2 Historical acceptance preservation

The historical `P01_GATE_ACCEPTANCE.md` (blob `cf23f0e…`) remains the original acceptance record.
Act C (`PHASE_07_P01_T6_REACCEPTANCE.md`) remains the T6 acceptance record.
This act (C2) is the **fresh** acceptance evidence for the duration-unit amendment.
No historical record is rewritten or re-blobbed.

---

## 3. Path position after C2

| Step | Act | Status |
|---|---|---|
| A0-2 | A3 designation | ✅ RESOLVED |
| A2 | Amendment authorization | ✅ COMPLETED |
| B2 | Additive P01 amendment | ✅ EXECUTED |
| **C2** | **Explicit P01 re-acceptance** | **✅ ACCEPTED (this act)** |
| D2 | Act 2 = A — ESTABLISHED | 🔴 **NOT YET** — requires separate D2 establishment record |

**C2 completes the acceptance gate. D2 is a separate establishment recording act, NOT performed here.**

---

## 4. D3 / O-1 — explicitly NOT closed

| Item | Status | Reason |
|---|---|---|
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* | Operational-state contract not accepted; threshold-set identity/version and effective date unsupplied; D06/D07/C-PIT/C-MASTER/C-GOV/instrument thresholds open |
| **O-1** | 🔴 **OPEN — 4 of 5 resolved · D3 NOT RESOLVED** *(unchanged)* | RP-4 stands; P07-02 exit unevidenceable |

P01 duration-unit acceptance does **not** resolve D3 or O-1.

---

## 5. Resulting state

| Item | Status |
|---|---|
| **A0-2** | ✅ RESOLVED |
| **A2** | ✅ COMPLETED |
| **B2** | ✅ EXECUTED |
| **C2** | ✅ **ACCEPTED** (this act) |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged — D2 required)* |
| **Act 1** T6 | ✅ **A — ESTABLISHED** *(unchanged)* |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* |
| **O-1** | 🔴 **OPEN — 4/5 resolved** *(unchanged)* |
| **P01 contract** | **ACCEPTED — schema `1.2`, 6 times, T6 binding, UN-8 duration-unit enumeration binding** |
| **P07 implementation** | ⛔ NOT YET PERMITTED |
| **Certification** | NONE GRANTED |
| **Production activation** | NOT AUTHORIZED |
| **Gate count** | 7 of 18 (unchanged — C2 is an amendment acceptance, not a new gate) |

---

## 6. Mutation statement

| | |
|---|---|
| Act type | **Acceptance act** + **one append-only governance record** + **decision log §16 appended** |
| Artifacts created | **exactly one** — this file |
| Decision log | **§16 appended** (additive only; §1–§15 unmodified) |
| P01 files modified | **0** — all four amended P01 files are **byte-identical** to their B2 state |
| `P01_GATE_ACCEPTANCE.md` | **NOT MODIFIED** — blob `cf23f0e…` preserved |
| All prior governance records | **byte-identical** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| `origin/main` | **untouched** |

*Append-only. Every finding cites the actual amended P01 artifact at commit `794c07c`.*
