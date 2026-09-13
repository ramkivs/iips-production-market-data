# PHASE 07 — ACT C: P01 T6 / EVALUATIONTIME RE-ACCEPTANCE ACT

> **ACT TYPE:** **Explicit A3 acceptance act** for the amended P01 six-time contract.
> **AUTHORITY:** Ramakrishnan V. S. (Ramki) — A3 gate acceptor designated by Act A §1.7 / A0,
> scoped exclusively to the P01 additive amendment establishing T6 / `evaluationTime`.
> **BASELINE:** Track B `1ef691157140cc0c2c7a5ae3556f880c00c0d267` (Act B — amendment executed).
> ⛔ **NO P01 ARTIFACT IS MODIFIED BY THIS ACT.** This act **evaluates and accepts** the contract
> that Act B established; it does not alter it.
> **Append-only. No prior record is renamed, rewritten or re-blobbed.**
> **Identifier: `PHASE_07_P01_T6_REACCEPTANCE` — no `Dnn` token claimed.**

---

## 0. Authority and path position

| | |
|---|---|
| **A3 acceptor** | **Ramakrishnan V. S. (Ramki)** — designated by Act A §1.7 / A0, scoped to P01 T6 amendment only |
| **Authority basis** | Act A (`PHASE_07_P01_T6_AMENDMENT_AUTHORIZATION.md`, commit `f0c2136`) §1.7 / A-1: *"Ramakrishnan V. S. (Ramki) is designated as A3 gate acceptor scoped to the P01 additive amendment establishing T6 / evaluationTime"* |
| **Path position** | A0 ✅ → A ✅ → B ✅ → **C (this act)** → D |
| **Act being accepted** | Act B (commit `1ef691157`) — additive P01 T6/evaluationTime amendment |
| **Acceptance scope** | The amended P01 six-time contract (schema `1.1`) — **T6 / `evaluationTime` addition only** |

---

## 1. Acceptance evidence — ten criteria verified against actual amended state

### 1.1 Six distinct timestamps exist: T1, T2, T3, T4, T5, T6

**✅ PASS**

Source: `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 (blob `a7df06b…`)

| # | Time | Meaning | Where carried |
|---|---|---|---|
| T1 | `asOf` | Market-data time — the snapshot point | Snapshot envelope, REQUIRED |
| T2 | `receivedAt` | Acquisition / ingest time | Snapshot envelope, REQUIRED |
| T3 | `observationTime` | Event time — when the datum was observed/traded | Field, conditional |
| T4 | `effectiveTime` | When the datum becomes economically effective | Field, conditional |
| T5 | `publicationTime` | When the source published/released it | Field, conditional |
| **T6** | **`evaluationTime`** | **Evaluation / scoring / threshold-assessment instant** | **Field, conditional** |

Six distinct times, each with a unique name, unique meaning, and explicit carriage. None collapsed, inferred or substituted.

### 1.2 T6 properties

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| Name = `evaluationTime` | ✅ | §1 table row T6; §3.2 CanonicalField row 14; §2 Field Dictionary |
| Distinct from T1–T5 | ✅ | Unique name, unique meaning, separate row in all three tables |
| Explicit input | ✅ | TS-7: *"evaluationTime is always an explicit input"* |
| Never implicit wall-clock "now" | ✅ | TS-7: *"an implementation that reads a system clock in place of an explicit input violates this rule"* |
| Clock source = evaluation engine evaluation boundary | ✅ | TS-7: *"Clock source for evaluationTime is the evaluation/scoring engine's evaluation boundary"* |
| Recorded once | ✅ | TS-7: *"recorded once"* |
| Never back-filled | ✅ | TS-7: *"never back-filled or recomputed"* |
| Never recomputed | ✅ | TS-7: *"never back-filled or recomputed"* |

### 1.3 Representation

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| ISO-8601 UTC with explicit `Z` | ✅ | TS-1: *"All timestamps are ISO-8601 in UTC with an explicit Z offset"* — applies to all timestamps including T6 |
| Precision consistent with TS-1/TS-2 | ✅ | TS-2: *"Precision is fixed and declared per the schema version"* — Field Dictionary: *"fixed precision (TS-1/TS-2)"* |
| Schema version = `1.1` | ✅ | §9: *"increments the canonical schema version from 1.0 to 1.1 (MINOR per SV-2)"* |

### 1.4 Carriage

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| `evaluationTime` is a field/data-record value | ✅ | §1 table: "Field, conditional"; Data Contract §3.2 row 14; Field Dictionary §2 |
| T1 `asOf` remains envelope-carried | ✅ | §1 table: "Snapshot envelope, REQUIRED" — unchanged |
| T2 `receivedAt` remains envelope-carried | ✅ | §1 table: "Snapshot envelope, REQUIRED" — unchanged |

### 1.5 Conditionality

**✅ PASS**

| Property | Verified | Source |
|---|---|---|
| T6 is conditional | ✅ | Req. = "C" (Field Dictionary); "CONDITIONAL" (Data Contract §3.2); "Field, conditional" (§1 table) |
| Applicable to authorized evaluation-contributing domains | ✅ | §1.1: D01 "(+ T6 where threshold evaluation contributes)", D03 "(+ T6 where scoring contributes)", D07 "(+ T6 where evaluation contributes)" |
| No unintended universal REQUIRED status | ✅ | D02, D04, D05, D06, D08, D09, D10 have no T6 obligation; D04/D05/D10 explicitly unchanged |

### 1.6 Compatibility

**✅ PASS**

| Rule | Verified | Evidence |
|---|---|---|
| **BC-1** | ✅ | T6 is MINOR (SV-2). Consumer at `1.1` reading `1.0` → absent T6 = `NOT_PROVIDED` (BC-2). Consumer at `1.0` reading `1.1` → unknown optional field → ignored and recorded (FC-1). No error in either direction. |
| **BC-3** | ✅ | T6 is conditional — absent when no evaluation contributes. An execution with no contributing market-data snapshot has no evaluation → no T6 → byte-identical to pre-amendment. Existing golden fixtures require no change. |
| **BC-4** | ✅ | T6 is additive (new conditional field) and inert (absent in existing SNAPSHOT-only executions). No existing execution path is affected. The delta is inert for all existing certified baselines. |
| **BC-5** | ✅ | No historical snapshot is rewritten. Existing snapshots retain `schemaVersion: "1.0"`. §9: *"Historical snapshots retain schemaVersion: '1.0'"* |

### 1.7 Historical evidence preservation

**✅ PASS**

| Item | Verified | Evidence |
|---|---|---|
| `P01_GATE_ACCEPTANCE.md` byte-for-byte unchanged | ✅ | Blob `cf23f0eda0ee917626d90270e883073c5d52d62c` — identical to the committed blob at acceptance commit `547de1b` |
| Criterion 4 still says "five distinct times" | ✅ | Verbatim: *"P01_TIMESTAMP_CURRENCY_UNIT_RULES.md §1–2 (five distinct times, obligations per data class)"* |
| Historical criterion 4 NOT used as six-time evidence | ✅ | Criterion 4 describes the **historical five-time state** accepted at `547de1b`. It is NOT evidence that the six-time amendment was accepted. This re-acceptance act provides **fresh** evidence for the six-time state. |

### 1.8 Fresh acceptance evidence

**✅ THIS ACT CONSTITUTES FRESH ACCEPTANCE EVIDENCE**

This act — `PHASE_07_P01_T6_REACCEPTANCE.md` — is the explicit acceptance evidence for the amended six-time P01 contract. It:

- Inspects the **actual** amended P01 state at commit `1ef691157` (not the historical five-time state)
- Verifies all ten acceptance criteria against the actual amended artifacts
- Records the explicit acceptance decision
- Is committed as a durable append-only governance record
- Does not rely on the historical criterion 4 for six-time acceptance

### 1.9 Authority

**✅ PASS**

| Property | Verified |
|---|---|
| Acceptance by Ramakrishnan V. S. (Ramki) | ✅ — stated at §0 and in the acceptance decision below |
| Designated specifically for this P01 amendment | ✅ — Act A §1.7 / A-1 / A0 |
| Separate from D10-3 (P06 only) | ✅ — Act A §1.7: *"Separate from D10-3 (P06 only)"* |

### 1.10 Binding record

**✅ PASS**

| Step | Act | Commit | Status |
|---|---|---|---|
| A0 | Designate named A3 acceptor scoped to P01 | (resolved by Act A) | ✅ COMPLETED |
| A | Program Authority amendment-authorization | `f0c2136` | ✅ COMPLETED |
| B | Additive P01 amendment executed | `1ef691157` | ✅ EXECUTED |
| **C** | **Explicit P01 re-acceptance by named A3** | **(this act)** | **✅ ACCEPTED** |
| D | Act 1 = A — ESTABLISHED | — | ✅ ESTABLISHED (below §3) |

---

## 2. Explicit acceptance decision

> ### ✅ **ACCEPTED**
>
> **I, Ramakrishnan V. S. (Ramki), as the A3 gate acceptor designated by Act A §1.7 / A0
> for the P01 additive amendment establishing T6 / `evaluationTime`, explicitly ACCEPT
> the amended P01 six-time contract as established by Act B at commit `1ef691157`.**
>
> **The amended P01 contract — six distinct times (T1–T6), schema version `1.1`, MINOR
> (SV-2), with T6 / `evaluationTime` as a conditional field-level timestamp — is now
> ESTABLISHED and BINDING.**
>
> Acceptance is not inferred from test results, from Act A authorization, from Act B
> execution, or from authority designation. **It is performed here.**

### 2.1 Acceptance boundary

| Accepted | Not accepted |
|---|---|
| T6 / `evaluationTime` as a new distinct timestamp | Duration units (UN-2, Act 2) |
| Schema version `1.1` | 15-minute threshold (D3, Act 5) |
| TS-7 clock source rule | Operational-state contract (Act 3) |
| Conditional domain applicability (D01/D03/D07) | 5-second display boundary (Act 6) |
| BC-1/BC-3/BC-4/BC-5 compatibility | P07 implementation |
| Field-level carriage | P07 certification |
| | Production activation |

### 2.2 Historical criterion-4 preservation

The historical `P01_GATE_ACCEPTANCE.md` (blob `cf23f0e…`) criterion 4 states *"five distinct times."*
That record describes what was accepted at commit `547de1b`. It is **NOT** rewritten, NOT
re-blobbed, and **NOT** used as evidence for this six-time acceptance. This re-acceptance act
(`PHASE_07_P01_T6_REACCEPTANCE.md`) is the **fresh** acceptance evidence for the six-time state.

---

## 3. Act 1 consequence

> ### ✅ **ACT 1 = A — ESTABLISHED**
>
> The T6 evaluation instant authority decision (`T6_EVALUATION_INSTANT_AUTHORITY_ACT`
> at `fc81404`, sub-decisions EVAL-1…EVAL-8) is now **ESTABLISHED** in the accepted P01
> contract. The design decision has been authorized (Act A), executed (Act B), and
> accepted (this Act C). T6 / `evaluationTime` is a binding element of the P01 contract
> at schema version `1.1`.

**Path complete:** A0 ✅ → A ✅ → B ✅ → C ✅ → **D ✅**.

---

## 4. D3 / O-1 — explicitly NOT closed

| Item | Status | Reason |
|---|---|---|
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* | Duration-unit enumeration (UN-2) unsatisfied; operational-state contract not accepted; threshold-set identity/version and effective date unsupplied; D06/D07/C-PIT/C-MASTER/C-GOV/instrument thresholds open |
| **O-1** | 🔴 **OPEN — 4 of 5 resolved · D3 NOT RESOLVED** *(unchanged)* | RP-4 stands; P07-02 exit unevidenceable. No Hard dependency weakened, relaxed or reordered |

P01 T6 acceptance does **not** resolve D3 or O-1. These are separate open items with their own authority paths.

---

## 5. Resulting state

| Item | Status |
|---|---|
| **A0** | ✅ RESOLVED |
| **Act A** | ✅ COMPLETED |
| **Act B** | ✅ EXECUTED |
| **Act C** | ✅ **ACCEPTED** (this act) |
| **Act 1** T6 | ✅ **A — ESTABLISHED** |
| **Act 2** duration units | 🟡 B *(unchanged)* |
| **Act 3** operational state | 🟡 B — DRAFTED, NOT ACCEPTED *(unchanged)* |
| **Act 4** P17 tracker | 🟡 B *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 OPEN *(unchanged)* |
| **D3** | 🟡 B — PARTIALLY READY *(unchanged)* |
| **O-1** | 🔴 OPEN — 4 of 5 resolved *(unchanged)* |
| **P01 contract** | **ACCEPTED — 6 times, schema `1.1`, T6 binding** |
| **P07 implementation** | ⛔ NOT YET PERMITTED |
| **Certification** | NONE GRANTED |
| **Production activation** | NOT AUTHORIZED |
| **Gate count** | 7 of 18 (unchanged — P01 re-acceptance is an amendment acceptance, not a new gate) |

---

## 6. Mutation statement

| | |
|---|---|
| Act type | **Acceptance act** + **one append-only governance record** + **decision log §12 appended** |
| Artifacts created | **exactly one** — this file |
| Decision log | **§12 appended** (additive only; §1–§11 unmodified) |
| P01 files modified | **0** — all three amended P01 files (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`, `P01_DATA_CONTRACT.md`, `P01_FIELD_DICTIONARY.md`) are **byte-identical** to their Act B state |
| `P01_GATE_ACCEPTANCE.md` | **NOT MODIFIED** — blob `cf23f0e…` preserved |
| Act 1 record | **NOT MODIFIED** — blob `f6a44d5…` preserved |
| Act A governance record | **NOT MODIFIED** — blob `9ce09fc…` preserved |
| All prior authority records | **byte-identical** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| `origin/main` | **untouched** |

*Append-only. Every finding cites the actual amended P01 artifact at commit `1ef691157`.*
