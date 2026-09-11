# D16 — P01 EVALUATION INSTANT (T6) AUTHORITY ACT

**Program Authority act. Append-only durable record.**

> **This is an AUTHORITY DECISION record. It is NOT a P01 amendment and NOT an implementation.**
> It adopts the **contract decision** that a sixth, distinct time exists in the P01 time family.
> It does **not** amend `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`, does not add a field to any
> schema, dictionary, fixture or source file, and grants no implementation authorisation.

| Field | Value |
|---|---|
| **Record** | **D16** |
| **Title** | P01 Evaluation Instant (T6) — Authority Act |
| **Act reference** | **P07 O-1 — ACT 1** |
| **Baseline** | **`2565bbf3567f4486478d61a28db5c46475971c42`** — *"docs: resolve D3 contract/schema Acts 1-4 by authority/design decision"* |
| **Source** | `docs/PHASE_07_THRESHOLD_CONTRACT_RESOLUTION.md` §1, §5 (ACT 1), §8 act 1 |
| **Authority** | **Program Authority** — the owner of the P01 contract. ⚠ **No individual is named or inferred**; ⚠ **this act does NOT designate an A3 P07 acceptor** (D13 §4) |
| **Date** | 2026-09-11 |
| **Predecessors** | D13 (P07 entry authorisation) · D14 (contract basis) · D15 (policy/state contract) · `PHASE_07_THRESHOLD_BLOCKER_ADJUDICATION.md` · `PHASE_07_THRESHOLD_CONTRACT_RESOLUTION.md` |
| **Nature** | **Authority decision only.** No contract amendment, no schema change, no code, no fixture, no tracker change |

---

## 1. AUTHORITY DECISION

> # **ADOPTED**

The Program Authority **explicitly adopts** the following as an authoritative P01 contract
concept:

| # | Decision | Adopted |
|---|---|---|
| **D16-1** | **A NEW and DISTINCT time exists: T6 — the evaluation instant.** The P01 time family is **additively extended from five to six**. T6 is **not derivable** from any existing time | ✅ **ADOPTED** |
| **D16-2** | **Meaning: the instant at which freshness is evaluated** for a given datum and consumer | ✅ **ADOPTED** |
| **D16-3** | **Candidate field name: `evaluationTime`** — follows the P01 `*Time` family (`observationTime`, `effectiveTime`, `publicationTime`). ⚠ **Adopted as the candidate name for the amendment to establish**; the name becomes binding only when the P01 act executes (§2) | ✅ **ADOPTED AS CANDIDATE** |
| **D16-4** | **T6 is an EXPLICIT INPUT**, supplied by the evaluation context (**RP-2**) | ✅ **ADOPTED** |
| **D16-5** | **T6 is NEVER an implicit wall-clock *"now"*.** An implementation that reads a system clock in place of an explicit input **violates this decision** | ✅ **ADOPTED** |
| **D16-6** | **T6 never repurposes, substitutes for, is inferred from, or is collapsed with `asOf` (T1), `receivedAt` (T2), `observationTime` (T3), `effectiveTime` (T4) or `publicationTime` (T5)** | ✅ **ADOPTED** |
| **D16-7** | **Representation: TS-1** ISO-8601 UTC with explicit `Z`; **TS-2** precision fixed and declared per schema version | ✅ **ADOPTED (inherited, unchanged)** |
| **D16-8** | **Evidence: the applied evaluation instant must be recorded in the freshness evidence** so the evaluation is reproducible (**RP-1**, **RP-3**) | ✅ **ADOPTED** |

### 1.1 Repurposing prohibition — carried forward verbatim in effect

| Time | Not repurposed because |
|---|---|
| **T1 `asOf`** | the measured-from endpoint — age would be identically zero |
| **T2 `receivedAt`** | ingest time, fixed in the past by **TS-6** |
| **T3 `observationTime`** | event time — a property of the datum |
| **T4 `effectiveTime`** | economic effectiveness — unrelated to evaluation |
| **T5 `publicationTime`** | source release — unrelated to evaluation |

### 1.2 Explicitly NOT decided by this act

| # | Not decided |
|---|---|
| **N-1** | The **clock source** for T6 — 🔴 **TO BE FIXED BY THE P01 ACT**, by analogy to TS-6. ⚠ **Not fixed here, and not inferred** |
| **N-2** | The **final binding field name** — `evaluationTime` is adopted as the **candidate**; the P01 amendment establishes it |
| **N-3** | Whether T6 is carried on the envelope, the field, or both — a P01 amendment question |
| **N-4** | Cardinality/optionality (REQUIRED vs conditional) and the domains in which T6 applies |
| **N-5** | The **duration-unit enumeration** (Act 2) — untouched; **UN-2 remains unsatisfied** |
| **N-6** | The **15-minute threshold**, any threshold value, strictness, or effective date (Act 5 / D3) |
| **N-7** | **Operational-state semantics** — *normal* vs *degraded* (Act 3) |
| **N-8** | **P17** decomposition or ownership (Act 4) — untouched |
| **N-9** | The **5-second `backendReceivedAt → screenDisplayedAt` boundary** — remains an open, unowned boundary |
| **N-10** | Any **P07 acceptance**, **A3 P07 designation**, certification or activation |

---

## 2. CONTRACT CHANGE REQUIRED

**This act does not perform the change. It states exactly what the change must be.**

| Field | Value |
|---|---|
| **Owning contract** | **P01** — `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` |
| **Required act** | **P01 additive MINOR contract act** |
| **Change class** | **MINOR** — **SV-2** *"strictly additive and backward-compatible"* |
| **Nature** | Extend §1 *"The five distinct times"* to **six**, adding **T6**, and fix the clock source (**N-1**) |
| **Status** | 🔴 **NOT EXECUTED** |

### 2.1 Constraints the P01 amendment must preserve

| Rule | Requirement | Preserved by this act |
|---|---|---|
| **P01 timestamp separation** | Times are *"never collapsed, never inferred from one another, and never substituted for one another"* (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`:9-10) | ✅ **D16-6** strengthens it — T6 joins the separation rule, it does not weaken it |
| **TS-1** | ISO-8601 UTC, explicit `Z`; local-time-only invalid | ✅ **D16-7** |
| **TS-2** | Precision fixed and declared per schema version | ✅ **D16-7** |
| **TS-6** | `receivedAt` clock source unchanged, never back-filled | ✅ untouched; cited only as the **analogy** for N-1 |
| **SV-2** | MINOR = strictly additive, backward-compatible | ✅ additive only; **no existing time altered, renamed, retyped or removed** |
| **BC-1** | A consumer at schema `N` reads data at `N-k` minor versions without error | ✅ nothing existing changes shape |
| **BC-3** | An execution with **no** contributing market-data snapshot behaves **exactly as today**, preserving replay identity | ✅ **no execution path is touched by this act** |
| **BC-4** | The delta is **additive and inert** for existing SNAPSHOT-only executions | ✅ inert — no field exists yet |
| **RP-2** | The evaluation instant is an **explicit input**, never implicit *"now"* | ✅ **D16-4**, **D16-5** — this is the rule being satisfied |
| **RP-3** | The applied threshold set / evaluation is identified in the evidence | ✅ **D16-8** |
| **Historical snapshots** | **Never rewritten** | ✅ **no snapshot, evidence file or accepted artifact is modified by this act** |

---

## 3. VALIDATION PERFORMED

Three checks were mandated before the act. All were executed read-only against baseline
`2565bbf3567f4486478d61a28db5c46475971c42`.

| # | Validation | Method | Result |
|---|---|---|---|
| **V-1** | **No existing P01 timestamp is being repurposed** | Read `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 — the closed set **T1 `asOf` · T2 `receivedAt` · T3 `observationTime` · T4 `effectiveTime` · T5 `publicationTime`**, with the *"never collapsed / never inferred / never substituted"* rule at :9-10 | ✅ **PASS** — T6 is **added**; all five retain their meaning, name, carrier and rules verbatim |
| **V-2** | **No hidden `PIT_QUERY_TIME_UTC` or equivalent exists** | Corpus-wide search for `PIT_QUERY_TIME`, `queryTime`, `evaluatedAt`, `nowUtc`, `wallClock`, `asOfQuery` | ✅ **PASS** — **zero** field definitions. The only hits are two **prose** mentions in `PHASE_07_THRESHOLD_BLOCKER_ADJUDICATION.md`: the finding that *"no query-time concept exists anywhere"* (:26) and its **correction of record** (:44) noting a `PIT_QUERY_TIME_UTC` field was **believed** to exist in the P04 snapshot and does not |
| **V-3** | **`evaluationTime` is genuinely distinct** | Corpus-wide search for `evaluationTime` outside the resolution document | ✅ **PASS** — **zero** hits in any schema, field dictionary, fixture, evidence file or source. No collision; no shadowing of an existing concept |

⚠ **V-2 is the load-bearing check.** The prior belief that a query-time field already existed
was **wrong and is already corrected in the record**. T6 is therefore genuinely new, and this
act is not a rediscovery of an existing field.

---

## 4. IMPLEMENTATION STATUS

> # ⛔ **IMPLEMENTATION = NOT PERMITTED** *(unchanged)*

| Field | Value |
|---|---|
| `evaluationTime` implemented | **NO** — no field exists in any schema, dictionary, fixture or source |
| P01 contract amended | **NO** |
| P01 source/schema implementation modified | **NO** |
| Fixtures modified | **NO** |
| Tracker modified | **NO** |
| 15-minute threshold adopted | **NO** (Act 5 / D3) |
| Duration units established | **NO** (Act 2 — **UN-2 unsatisfied**) |
| Operational-state semantics defined | **NO** (Act 3) |
| P17 touched | **NO** (Act 4) |
| 5-second screen-display boundary resolved | **NO** |
| P07 acceptance | **NOT ESTABLISHED** |
| A3 P07 acceptor | **NOT DESIGNATED** |
| Certification | **NONE GRANTED** |
| Production activation | **NOT AUTHORIZED** (P16 only) |
| Provider / licence / credentials | **NONE** |

⚠ **A design decision is not implementation authorisation, and a contract amendment is not
implementation.** This record is one step further back than either: it is the **authority
decision that the amendment may be drafted at all**.

---

## 5. RESULTING STATUS

| Item | Status |
|---|---|
| **Act 1** | 🟡 **B — DECIDED, NOT ESTABLISHED** |
| **Act 2** (duration units) | 🟡 **B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT** *(unchanged)* |
| **Act 3** (operational state) | 🟡 **B** *(unchanged)* |
| **Act 4** (P17 tracker) | 🟡 **B** *(unchanged)* |
| **D3** | 🟡 **B — PARTIALLY READY** *(unchanged)* — Acts 1–4 decided, not established; **UN-2 unsatisfied** |
| **O-1** | 🔴 **OPEN — 4 of 5 resolved · D3 NOT RESOLVED** *(unchanged)* — **no partial closure**; **RP-4 stands** |
| **P07 entry** | **AUTHORIZED** (D13) *(unchanged)* |
| **P07 implementation** | ⛔ **NOT YET PERMITTED** *(unchanged)* — hard dep **P07-01 `NOT STARTED`** |
| **Gate count** | *(unchanged by this act)* |

⚠ **Act 1 does NOT advance to `A`.** The authority decision is made; the **P01 amendment has
not been executed**, so per the governing instruction the status is **B — DECIDED, NOT
ESTABLISHED**. No dependency was weakened, relaxed or reordered; no tracker status altered.

---

## 6. NEXT AUTHORITY ACT

> **The P01 additive MINOR contract act** — amend
> `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 from five times to six, establishing **T6**
> with its final field name and **fixing its clock source (N-1)**, preserving SV-2 / BC-1 /
> BC-3 / BC-4 / TS-1 / TS-2 / RP-2 / RP-3.

⚠ That act **amends an ACCEPTED contract** and is therefore itself a Program Authority act
requiring its own record. Only after it executes does **Act 1 = A — RESOLVED**.

Thereafter, in order: **Act 2** (duration units, satisfies UN-2) → **Act 3** (operational-state
contract) → **Act 4** (P17 tracker rows) → **Act 5** (D3 value adoption — executable only after
acts 1–3) → **Act 6** (5-second ownership).

---

**D16 — P01 EVALUATION INSTANT (T6) AUTHORITY ACT.**
**AUTHORITY DECISION = ADOPTED · CONTRACT CHANGE = REQUIRED, NOT EXECUTED · IMPLEMENTATION = NOT PERMITTED.**
**Act 1 = B — DECIDED, NOT ESTABLISHED · D3 = B · O-1 = OPEN.**
