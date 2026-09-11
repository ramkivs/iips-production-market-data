# PHASE 07 — ACT A: P01 T6 AMENDMENT-AUTHORIZATION ACT

> **ACT TYPE:** **Program Authority amendment-authorization act.** **NO IMPLEMENTATION.**
> **PURPOSE:** Authorize the future additive P01 contract amendment establishing **T6 / `evaluationTime`**.
> ⛔ **P01 IS NOT MODIFIED BY THIS ACT. `evaluationTime` IS NOT CREATED. T6 IS NOT ADDED.**
> **The amendment is authorized but NOT executed and NOT binding until explicit A3 acceptance.**
> **Append-only. Edits nothing in P01. Decision log §11 appended.**
> **Identifier: `PHASE_07_P01_T6_AMENDMENT_AUTHORIZATION` — no `Dnn` token claimed.**

---

## 0. Boundary

| | |
|---|---|
| **Baseline** | Track B `5229f09b10d3083faef4ce338c0dcf3cbd029143` (P01 amendment authority path adjudication) |
| **A0 prerequisite** | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki) designated as A3 gate acceptor scoped to P01 (below §1.7) |
| **P01** | ⛔ **UNMODIFIED** — 5 times (T1–T5), no T6, no `evaluationTime`, 24/24 ACCEPTED |
| **Act 1 design** | ✅ DECIDED — `T6_EVALUATION_INSTANT_AUTHORITY_ACT` @ `fc81404`, sub-decisions EVAL-1…EVAL-8 |
| **Act 1 status** | 🟡 **B — DECIDED, NOT ESTABLISHED** — unchanged by this act |
| **Tracker / SPEC / source / tests / fixtures** | **untouched** |
| **Acceptance / certification granted** | **none** |

---

## 1. Authorization decisions

### 1.1 Scope

This authorization applies **exclusively** to the additive P01 contract change establishing the new distinct timestamp **T6 / `evaluationTime`** in `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 and the associated domain-obligation table. No other P01 contract, field, rule, schema, or artifact is within scope.

### 1.2 Append-only exception

**A one-time, narrowly-scoped exception** to the standing *P00–P06 authority records and contracts are append-only and are not to be modified* constraint is **explicitly authorized**, for **this specific P01 additive amendment only**.

| Constraint | Effect |
|---|---|
| **Standing constraint** | P00–P06 accepted contracts and authority records are append-only; they are not edited, rewritten, or migrated in place |
| **Exception scope** | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 table (add one row: T6) and §2 domain-obligation table (add T6 to applicable rows) **only** |
| **What the exception does NOT do** | Does not weaken, remove, or reinterpret the general historical-record constraint. Does not permit edits to any other P01 file. Does not permit edits to P00, P02, P03, P04, P05, or P06 contracts or records |
| **Duration** | Consumed by the single amendment execution (Act B). After execution, the standing constraint resumes in full force |

### 1.3 T6 — the authorized timestamp

A new distinct timestamp is authorized:

| Property | Value |
|---|---|
| **Slot** | **T6** |
| **Candidate field name** | **`evaluationTime`** (established as binding at §1.5 / N-2 below) |
| **Nature** | The instant at which an evaluation, scoring, or threshold assessment was performed |
| **Explicit input** | ✅ **MUST be an explicit input** — never derived, never computed from other times |
| **Never implicit** | ✅ **NEVER an implicit wall-clock "now"** — an implementation that reads a system clock in place of an explicit input violates this authorization (per Act 1 D16-5) |
| **Never repurposed** | ✅ **NEVER repurposes `asOf` (T1), `receivedAt` (T2), `observationTime` (T3), `effectiveTime` (T4), or `publicationTime` (T5)** — T6 is a sixth distinct time, not a renaming or aliasing of any existing time |
| **Separation rule** | T6 joins the existing rule: times are *"never collapsed, never inferred from one another, and never substituted for one another"* (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`:9–10) |

### 1.4 SV classification — MINOR (SV-2), explicitly determined

The authority path adjudication (`PHASE_07_P01_AMENDMENT_AUTHORITY_PATH.md` §1) determined that SV-3's classification table has **no existing row for "add a new distinct time."** The Act 1 record asserted MINOR / SV-2 but the adjudication required this act to make the determination explicit.

**Determination: MINOR (SV-2).**

| Rationale | Evidence |
|---|---|
| **Strictly additive** | T6 adds one new conditional field slot; no existing field is altered, renamed, retyped, removed, or reclassified |
| **Backward-compatible** | Consumers at the prior schema version encounter T6 as an absent optional field → `NOT_PROVIDED` per BC-2; no consumer behavior changes |
| **Not MAJOR** | T6 does not change any existing field's `dataType`, unit, currency, precision, `pitEligible`, `snapshotId` format, namespace, merge/collision rules, or timestamp precision/timezone |
| **Not unclassified** | Although SV-3's table has no literal row for "add a new distinct time," the nearest row — *"Add an **optional** field slot → MINOR"* — governs by direct analogy. T6 is a new conditional field slot following the T3/T4/T5 pattern |
| **Schema version increment** | `1.0` → `1.1` (MINOR increment per SV-1 `MAJOR.MINOR`) |

### 1.5 N-1…N-4 — resolved

| # | Item | Resolution |
|---|---|---|
| **N-1** | **Clock source for T6** | **The evaluation/scoring engine's evaluation boundary** — the instant at which the evaluation was performed, recorded once by the evaluating component. By analogy to **TS-6** (*"`receivedAt` clock source is the ingest boundary, recorded once; it is never back-filled or recomputed"*), T6's clock source is the evaluation boundary, recorded once, **never back-filled or recomputed**. The clock source is the evaluating system's monotonic/UTC boundary at the moment of evaluation completion. |
| **N-2** | **Final binding field name** | **`evaluationTime`** — adopted as candidate by Act 1 (D16-3), now **established as the binding name**. Follows the P01 `*Time` family (`observationTime`, `effectiveTime`, `publicationTime`). ISO-8601 UTC with explicit `Z`, precision fixed and declared per schema version (TS-1, TS-2). |
| **N-3** | **Carriage / location** | **Field** (not envelope). T6 follows the carriage pattern of T3, T4, and T5 — conditional fields carried on the data record, not on the snapshot envelope. T1 (`asOf`) and T2 (`receivedAt`) remain the only envelope-carried times. T6 is a **field-level conditional**, present when an evaluation/scoring/threshold assessment has been performed on or contributing to the datum. |
| **N-4** | **Cardinality / domains** | **Conditional** (not REQUIRED). Applicable to domains where evaluation, scoring, or threshold assessment contributes to the datum. Initial applicability: **D01** (market prices/quotes — where threshold evaluation applies), **D03** (fundamentals — where scoring applies), **D07** (estimates — where evaluation applies). **Not applicable** to D04 (corporate actions), D05 (identity attributes), D10 (venue/calendar). Other domains (D02, D06, D08, D09) — applicable where evaluation contributes, conditional per domain. The domain-obligation table in §2 of `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` is the authoritative registry. |

### 1.6 BC-1 / BC-3 / BC-4 / BC-5 treatment

| Rule | Requirement | How the authorized amendment satisfies it |
|---|---|---|
| **BC-1** | A consumer at schema `N` must read data at `N-k` minor versions without error | T6 does not exist in pre-amendment data (schema `1.0`). A consumer at `1.1` reading `1.0` data encounters absent T6 → `NOT_PROVIDED` (BC-2). A consumer at `1.0` reading `1.1` data encounters unknown optional T6 → ignored and recorded as ignored (FC-1). **No error in either direction.** |
| **BC-3** | An execution with **no** contributing market-data snapshot must behave **exactly as today**, produce the same effective replay identity, and reproduce existing certified baselines **byte-identically** | T6 is conditional — absent when no evaluation contributes. An execution with no contributing market-data snapshot has no evaluation → no T6 → byte-identical to pre-amendment behavior. **Existing golden fixtures require no change.** |
| **BC-4** | The whole market-data contract delta is **additive and inert** for existing SNAPSHOT-only executions | T6 is additive (new optional field) and inert (absent in existing SNAPSHOT-only executions). No existing execution path is affected. **The delta is inert for all existing certified baselines.** |
| **BC-5** | Historical snapshots are **never rewritten** to a newer schema. They retain their original `schemaVersion` | The amendment does not rewrite any historical snapshot. Existing snapshots retain `schemaVersion: "1.0"`. New snapshots produced after amendment carry `schemaVersion: "1.1"`. **No historical record is altered.** |

### 1.7 A3 acceptor designation — Ramakrishnan V. S. (Ramki), scoped to P01

| Property | Value |
|---|---|
| **Named A3 acceptor** | **Ramakrishnan V. S. (Ramki)** |
| **Role** | A3 gate acceptor |
| **Scope** | The P01 additive amendment establishing T6 / `evaluationTime` **only** |
| **Authority for this designation** | Program Authority (this act, §1) — A0 prerequisite resolved |
| **Relationship to D10-3** | D10-3 designated Ramki as A3 acceptor **scoped to P06 only**. This is a **separate, new designation** scoped to P01. It does **not** extend D10-3, does **not** designate A1/A2/A4, and does **not** constitute a standing per-phase assignment for P02–P05 or P07–P17 |
| **Designation ≠ acceptance** | This designation makes acceptance **possible**; it does not perform acceptance. Acceptance requires a separate explicit act by Ramki after the amendment is executed |

### 1.8 Binding condition

| Condition | Status |
|---|---|
| **Authorization** | ✅ **GRANTED** by this act |
| **Execution** | 🔴 **NOT PERFORMED** — the amendment has not been executed |
| **Acceptance** | 🔴 **NOT PERFORMED** — no A3 acceptance act has occurred |
| **Binding** | 🔴 **NOT BINDING** — the amendment is **not binding** until explicit A3 acceptance by Ramakrishnan V. S. (Ramki) |

**Authorization ≠ execution ≠ acceptance.** An executed-but-unaccepted P01 amendment is DRAFTED / EXECUTED but **NOT BINDING**. No consumer, no P07 work, and no downstream contract may rely on T6 until the acceptance act occurs.

### 1.9 Historical acceptance evidence

| Item | Treatment |
|---|---|
| **Existing P01 acceptance record** | `P01_GATE_ACCEPTANCE.md` at `547de1b` — **PRESERVED, UNMODIFIED** |
| **"Five distinct times" criterion** | Criterion 4 (*"five distinct times"*) — **NOT rewritten**. The existing record states what was accepted. A future six-time P01 state requires its own explicit acceptance evidence |
| **Accepted package (9 artifacts)** | The existing enumeration at `P01_GATE_ACCEPTANCE.md:17` — **PRESERVED**. A future amended package requires its own explicit enumeration and acceptance |
| **P01_GATE_ACCEPTANCE.md blob** | `cf23f0eda0ee917626d90270e883073c5d52d62c` — **PRESERVED, byte-identical** |

---

## 2. Required sequence (A0 → A → B → C → D)

| Step | Act | Status after this authorization |
|---|---|---|
| **A0** | Designate named A3 acceptor scoped to P01 | ✅ **RESOLVED** — Ramakrishnan V. S. (Ramki), §1.7 |
| **A** | Program Authority amendment-authorization (this act) | ✅ **COMPLETED** — this document |
| **B** | Additive P01 amendment executed | 🔴 **NOT YET** — authorized but not executed |
| **C** | Explicit P01 re-acceptance by named A3 | 🔴 **NOT YET** — requires B first |
| **D** | Act 1 = A — ESTABLISHED | 🔴 **NOT YET** — requires C first |

**⚠ B without C leaves T6 non-binding. C without A0 was impossible (now resolved). A without A0 would have left C impossible.**

---

## 3. Explicitly NOT authorized, NOT granted, NOT resolved

| # | Not authorized / not granted | Preserved authority |
|---|---|---|
| 1 | ⛔ **P01 modification** — NOT performed by this act | P01 remains 5 times, no T6 |
| 2 | ⛔ **`evaluationTime` creation** — NOT created by this act | No field exists |
| 3 | ⛔ **Duration units** — NOT established (Act 2, UN-2 unsatisfied) | Act 2 unchanged |
| 4 | ⛔ **15-minute threshold** — NOT adopted (Act 5 / D3) | D3 unchanged |
| 5 | ⛔ **Operational-state contract** — NOT created (Act 3) | Act 3 unchanged |
| 6 | ⛔ **5-second display boundary** — NOT resolved (Act 6) | Act 6 unchanged |
| 7 | ⛔ **P07 implementation permission** — NOT granted | P07 = NOT YET PERMITTED |
| 8 | ⛔ **P07 certification** — NOT granted | Certification = NONE |
| 9 | ⛔ **Production activation** — NOT authorized (P16 only) | Production = NOT AUTHORIZED |
| 10 | ⛔ **Provider selection** — NOT performed (DEP-P02-07) | No provider |
| 11 | ⛔ **Append-only constraint weakening** — the general constraint is NOT weakened or removed; only the one-time exception in §1.2 is granted | Standing constraint preserved |
| 12 | ⛔ **Act 1 establishment** — Act 1 remains B — DECIDED, NOT ESTABLISHED | Act 1 unchanged |

---

## 4. Resulting state

| Item | Status |
|---|---|
| **Act A** (this act) | ✅ **COMPLETED** — authorization granted |
| **A0** | ✅ **RESOLVED** — Ramki designated |
| **Act 1** T6 | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged)* — path now at step A complete; B next |
| **Act 2** duration units | 🟡 **B** *(unchanged)* |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(unchanged)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 6** 5-second ownership | 🔴 **OPEN** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* |
| **O-1** | 🔴 **OPEN — 4 of 5 resolved · D3 NOT RESOLVED** *(unchanged)* |
| **P01** | ⛔ **UNMODIFIED** — 5 times, no T6 |
| **P07 implementation** | ⛔ **NOT YET PERMITTED** |
| **Certification** | **NONE GRANTED** |
| **Production activation** | **NOT AUTHORIZED** |
| **Gate count** | **7 of 18** (unchanged) |

---

## 5. Mutation statement

| | |
|---|---|
| Act type | **Authorization act** + **one append-only governance record** + **decision log §11 appended** |
| Artifacts created | **exactly one** — this file |
| Decision log | **§11 appended** (additive only; §1–§10 unmodified) |
| Files modified / renamed / deleted | **0** (beyond the two new/appended governance records) |
| **P01** modified | ❌ **NO** — 5 times, no T6, no `evaluationTime` |
| `evaluationTime` / T6 created | ❌ **NO** |
| Duration units established | ❌ **NO** — UN-2 unsatisfied |
| 15-minute threshold adopted | ❌ **NO** |
| Tracker / SPEC / source / tests / fixtures | **untouched** |
| Acceptance / certification granted | **none** |
| `Dnn` decision token claimed | **none** — descriptive filename |
| Act 1 record renamed or rewritten | ❌ **NO** — blob `f6a44d50…` preserved |
| `origin/main` | **untouched** |
| Prior authority record blobs | **all preserved byte-identical** |

*Append-only. Every determination cites an existing record or measured corpus fact.*
