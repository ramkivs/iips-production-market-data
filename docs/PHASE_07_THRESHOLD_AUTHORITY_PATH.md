# PHASE 07 — FRESHNESS/STALENESS THRESHOLD AUTHORITY PATH

> **ACT TYPE:** Authority / design adjudication. **NO IMPLEMENTATION.**
> **SCOPE:** Determines *how* freshness/staleness threshold values must eventually be decided,
> scoped, adopted, versioned and evidenced. **Supplies no values.**
> **RELATIONSHIP:** Extends `D14_PHASE_07_CONTRACT_BASIS.md` and
> `D15_PHASE_07_POLICY_STATE_CONTRACT.md`. **Append-only.** Modifies nothing.
> **DOES NOT** duplicate D15's finding that **O-1 = OPEN**; it records the *authority path*,
> which D15 does not adjudicate.

---

## 0. Controlling boundary — unchanged by this act

| | |
|---|---|
| **P07 ENTRY** | **`AUTHORIZED`** — `D13_PHASE_07_ENTRY_AUTHORIZATION.md` (`7fe5aaa`) |
| **P07 CONTRACT / DESIGN** | **`ESTABLISHED`** — `a5720a4`, `641158c` |
| **P07 IMPLEMENTATION** | ⛔ **`NOT YET PERMITTED`** |
| **P07 ACCEPTANCE** | **`NOT ESTABLISHED`** |
| **P07 CERTIFICATION** | **`NONE GRANTED`** |

No runtime code, no provider selection, no production activation, no acceptance, no
certification, no source or test modification, no A3/A2/C7/C8 assignment.

### 0.1 Naming note — why this file is not `D16_…`

The next decision number in the `docs/Dnn_` series is **16**, and it is **unusable**.
`D16` is an **occupied frozen-methodology identifier** in this corpus:
**"Telecom D16"** / **`D16 M1–M15`** (IES-016, oracle `3cfb/92be`), referenced **19 times**
and bound by the standing invariant that frozen methodologies are **preserved verbatim**
(`P00_PROGRAM_CHARTER.md:82`, `PROGRAM_STATE.md:846`, `D4_08_ENGINE_INTEGRATION.md:50`,
`D4_11_CERTIFICATION_MATRIX.md:28`, `D8_EXECUTION_AUTHORIZATION.md:72`).

Introducing a decision record named `D16_…` would make every `D16` reference ambiguous and
risk conflating a program decision with a frozen methodology. **`D17` and `D20` are likewise
occupied.** This record therefore carries a descriptive name. ⚠ **This is recorded as an
observation, not resolved:** the `Dnn_` decision series and the frozen-methodology `Dnn`
identifiers share a token space and **collide at 16, 17 and 20**. Renumbering either series is
**outside the authority of this act**.

### 0.2 Repository guards verified before this filename was chosen

| Guard | Source | Applies to `docs/PHASE_07_THRESHOLD_AUTHORITY_PATH.md` |
|---|---|---|
| `docs/p07` must not exist | `p05/tests/existing-iips-boundary.test.js:150-155` | ✅ not created |
| no tracked file may match `/P07[_-]/` | same | ✅ does not match |
| no `concession` in any `docs/` filename | same `:248` | ✅ |
| acceptance-record vocabulary guard | same `:250`; `no-provider-dependency.test.js:427` | ✅ no such vocabulary in this file |
| `certified` / `IES-0\d\d` content guards | `existing-iips-boundary.test.js:93,:114` | scoped to `p05/src/*.js`; not applicable to docs |

---

## 1. O-1 — confirmed facts (not re-litigated)

**O-1 = OPEN.** No authoritative freshness/staleness threshold value exists in the SPEC
`.docx`, the Program Tracker `.xlsx`, the governance corpus, or source/tests/fixtures.

| Confirmed fact | Anchor | State |
|---|---|---|
| Threshold **ownership** = P07 | **MQ-2** `P02_OBSERVABILITY_REQUIREMENTS.md:70`; **SE-3** `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md:109` | **[ACCEPTED]** |
| Threshold **values** = absent | exhaustive sweep, prior act | 🔴 **OPEN** |
| **Session/calendar baseline** authoritative | **Q-4** `P01_DATA_CONTRACT.md:255`; **SE-3** | **[ACCEPTED]** |
| Freshness **inputs** established | **LA-10** `liveAdapterContract.js:208-217` — `requiredInputs` frozen as `asOf`, `receivedAt`, `venueSessionRef`, `completenessBasis`; **BD-P05-01-08** | **[ACCEPTED]** |
| Freshness **dimensions FD-1…FD-4** established | `D15…POLICY_STATE_CONTRACT.md:165-168` | **[DESIGN]** (D15 §2.3) |
| Quality **vocabulary** = existing enum | `p05/src/contract.js:20` `QUALITY = ['good','stale','partial','unavailable']`; **Q-1** unchanged | **[ACCEPTED]** |
| Adapter threshold computation **prohibited** | **LA-10** *"An adapter that computes 'fresh'/'stale' from its own threshold is **non-conforming**"*; `liveAdapterContract.js:214` `setsThresholds: false`; **LA-23** `:609-610` `thresholdApplied: false, verdict: null`; tests **H/3**, **H/4**, **HA/22** | **[ACCEPTED] + test-enforced** |
| **Alerting / incident** = P17 | **MQ-2**; SPEC P17 *"provider failover/staleness controls"* | **[ACCEPTED]** |

---

## 2. THRESHOLD DECISION MODEL — what an eventual decision MUST specify

**No value is supplied below. Every row is a requirement on a future decision.**

| # | Element | Basis | Authority class |
|---|---|---|---|
| **1** | **Freshness dimension** — which of **FD-1** data age / **FD-2** delivery latency / **FD-3** session context / **FD-4** completeness basis it governs | D15 §2.3 | **[DESIGN]** |
| **2** | **Scope** — domain / instrument class / venue context it applies to | D15 §2.2(b) | **[DESIGN]** — and see §3: the scoping *model* is itself **OPEN** |
| **3** | **Session/calendar baseline** it is measured against | **Q-4**, **SE-3** | ✅ **[ACCEPTED]** |
| **4** | **Measurement input** — the exact inputs consumed | **LA-10** frozen `requiredInputs`; **BD-P05-01-08** | ✅ **[ACCEPTED]** |
| **5** | **Threshold value** | — | 🔴 **`OPEN / AUTHORITY-REQUIRED`** — *not supplied, not inferable* |
| **6** | **Unit** — must be **declared** and drawn from a **versioned enumeration** | **UN-1** *"Every dimensioned quantity carries `unit`"*; **UN-2** *"Units come from a declared, versioned enumeration … free-text units are **invalid**"*; **TS-2** precision fixed and declared | ✅ **[ACCEPTED]** as a constraint; the **choice** is **[DESIGN]** |
| **7** | **Comparison semantics** — strict vs. inclusive boundary; treatment of `ageMs < 0` | **LA-23** *"the age may be negative … That is a **P07 concern to adjudicate**"* — delegated, not decided | **[DESIGN]** |
| **8** | **Effective version / date** — from when the value governs | D15 RP-2 reproducibility; §4 below | **[DESIGN]** |
| **9** | **Adopting authority** — who adopts the value | §3 below | 🔴 **`OPEN`** — no authority designated |
| **10** | **Evidence / reproducibility method** | **RP-1…RP-3** [ACCEPTED]; **RP-4** [OPEN] | **[DESIGN]** |

⚠ **Elements 3, 4 and 6 are already constrained by accepted contracts.** Element 6 is
particularly binding: **UN-2 forbids free-text units**, so P07 may not invent a unit string;
the unit must come from the declared versioned enumeration.

⚠ **Negative-age adjudication is expressly delegated to P07 and remains undecided**
(**LA-23**). It must be settled before FD-1/FD-2 thresholds can be evaluated reproducibly,
because the comparison outcome for `ageMs < 0` is not currently defined.

---

## 3. THRESHOLD-SCOPING ADJUDICATION → **D — SCOPING REMAINS OPEN**

| Option | Verdict | Evidence |
|---|---|---|
| **A** one global threshold set | ❌ **not supported** | no authoritative record establishes a single global set |
| **B** domain-specific sets | ❌ **not supported** | Tracker `Parallel Execution r6` — *"Quality rules, freshness, reconciliation and anomaly controls **can** split by domain"* — is **permissive parallelization language, not a threshold-scoping authority**. Corpus statements tying domain/instrument scoping to freshness: **0** |
| **C** venue/session-specific sets | ❌ **not supported as a scoping model** | **SE-3**/*Q-4* establish the session context as the **baseline** thresholds are measured against — that is a *measurement basis*, **not** a per-venue threshold set. Conflating the two would over-read accepted text |
| **D** scoping remains OPEN | ✅ **ADOPTED** | — |

> ### 🔴 **DOMAIN / INSTRUMENT THRESHOLD SCOPING = OPEN**
>
> What **is** settled: thresholds are measured against a **session/calendar baseline**
> (**Q-4**, **SE-3**) — **[ACCEPTED]**.
> What is **not** settled: whether the threshold **set** varies by domain, instrument class or
> venue. No authoritative evidence decides this, so **no model is adopted**.

---

## 4. THRESHOLD-ADOPTING AUTHORITY ADJUDICATION → **B — NONE DESIGNATED**

**The distinction this act enforces:** *"P07 owns thresholds"* is **design/computation
ownership**, and it is settled. It does **not** establish that **P07 may unilaterally adopt
production threshold values.** Those are different authority questions, and only the first is
answered by existing records.

### 4.1 Evidence chain

| # | Evidence | Effect |
|---|---|---|
| 1 | **MQ-2** — *"Freshness thresholds are **P07**; alerting and incident response are **P17**"* | Establishes **phase** ownership. A phase is not a person; adopting a value requires a designated authority |
| 2 | **§3 program-authority decision of record** — `P00_DECISION_LOG.md:49` *"consider this as decision approved by Sai/Ramki to move forward"* | A **general approval-to-proceed** convention |
| 3 | §3 **"Does NOT confer"** field, verbatim: *"Certification · gate acceptance · production activation · **a namespace token string**"* | ⚠ **Decisive.** The general convention **expressly does not confer an exact value**. It is precedent that *values* fall outside §3's grant |
| 4 | **ADR-01-A1** — `D8_AUTHORITY_RECONCILIATION.md:34` **"APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING"**; `:86` — approval *"does not … establish a final token"* | Establishes the **shape** of value adoption: mechanism approved, **exact value requires a separate recording act**. Not exercised for thresholds |
| 5 | **G-A rule** — `P00_DECISION_LOG.md:264` *"NAMED AUTHORITY REQUIRED — **Ramki / Sai** … certified **engine-layer contract/component** changes require Ramki/Sai sign-off"* | Named-authority requirement is **scoped to engine-layer components** (`DataBoundExecutor`). **Does not extend to P07 freshness thresholds** |
| 6 | **P07 A3 gate acceptor** — `PROGRAM_STATE.md:27` *"**P07–P17 A3 acceptors NOT designated**"*; `:482` *"**Does not extend to P07–P17**; A1/A2/A4 not designated"* | No P07-scoped acceptance authority exists |
| 7 | **A2** — `CHECKPOINT-02.md:70` *"Implementation / Certification Authority"*, `person_named: false`, `certification_granted: false` | Not person-assigned |
| 8 | **C8** — `D4_11_CERTIFICATION_MATRIX.md:46` **"Provenance/quality/freshness derivation"**, certification authority **`UNKNOWN`** | ⚠ The certification component covering **freshness derivation** has **no designated authority**. P07 requires certification before progression (`P00_GATE_MODEL.md:44`, **YES (C7, C8)**) |
| 9 | `D4_00_EXECUTIVE_SUMMARY.md:107` — *"**UNKNOWN:** … new-program certification authority"* | Confirms the gap is recorded, not merely unobserved |

### 4.2 Determination

> ### 🔴 **THRESHOLD-ADOPTING AUTHORITY = B — NOT DESIGNATED**
>
> **P07 owns threshold definition and computation. No authority is designated to adopt the
> numerical values.** There is **no conflict** between records (so **not C**): the records are
> *silent to consistent* — §3 expressly excludes values, G-A is engine-layer scoped, the P07 A3
> acceptor is undesignated, and the C8 certification authority is `UNKNOWN`.
>
> **No person is inferred.** A3, A2, C7, C8, prior acceptors and role names were **not** used to
> fill this gap.
>
> **The precedent that exists** — **ADR-01-A1** — shows the *mechanism shape*: an approved
> mechanism plus a **separate named-authority act recording the exact value**. That shape is
> **not** itself a designation for freshness thresholds.

---

## 5. THRESHOLD LIFECYCLE MODEL — **[DESIGN]**

Required so that thresholds remain auditable and reproducible once adopted. **No threshold
records are created by this act.**

| Element | Rationale | Class |
|---|---|---|
| **Threshold-set identity** — an addressable identifier for the set as a whole | a result is only reproducible if the set applied can be named | **[DESIGN]** |
| **Version** — monotonically increasing, immutable once adopted | mutable thresholds make historical results unverifiable | **[DESIGN]** |
| **Effective date / effective-from version** | a snapshot evaluated in the past must resolve the set that governed *then* | **[DESIGN]** |
| **Scope** — the domain/instrument/venue applicability of each entry | required by §2 element 2; **model itself OPEN** (§3) | **[DESIGN]** |
| **Adopting authority** — the act that adopted the set | 🔴 **`OPEN`** — §4 | **[DESIGN]**, blocked |
| **Supersession history** — which set replaces which, and why | mirrors the program's own append-only decision discipline | **[DESIGN]** |
| **Reproducibility evidence** — see §6 | D15 **RP-1…RP-3** | **[DESIGN]** constrained by **[ACCEPTED]** RP-1…RP-3 |

⚠ **Immutability and supersession-by-addition are [DESIGN], not [ACCEPTED].** They are proposed
because they mirror the discipline the program already applies to its own records — they carry
**no accepted authority** and must not be presented as binding.

---

## 6. RP-4 REPRODUCIBILITY GATE — preserved, and what would discharge it

**D15 RP-4 stands: P07-02 freshness-state reproducibility CANNOT be evidenced while thresholds
remain undefined.**

Evidence required **after** thresholds are adopted — all five:

| # | Requirement |
|---|---|
| **E-1** | **Identical inputs** — the same `asOf`, `receivedAt`, `venueSessionRef`, `completenessBasis` |
| **E-2** | **Explicit evaluation instant** — supplied as an **input**, never taken from a wall clock, so a past evaluation can be replayed |
| **E-3** | **Identified threshold set** — the exact threshold-set identity **and version** applied |
| **E-4** | **Deterministic result** — the same state from the same inputs and the same set version |
| **E-5** | **Repeated result** — independent repetition producing byte-identical output |

⚠ **No implementation tests were run for this gate — no P07 implementation exists.** The
existing tests executed in this act (**H/3**, **H/4**, **HA/22**) verify only the **boundary**
that adapters set no thresholds; they do **not** and cannot evidence freshness-state
reproducibility.

---

## 7. P07-02 ENTRY / EXIT CONSEQUENCE

Tracker `Work Tracker` **P07-02** verbatim: requirement *"Calculate freshness and explicit
stale/unavailable states"* · dependencies **`P01-02, P07-01`** · **Hard** · entry *"**Time
semantics stable**"* · exit *"**Freshness state reproducible**"* · test *"Time/freshness
tests"* · evidence *"Freshness evidence"* · authority/gate *"Phase gate"*.

| Question | Answer |
|---|---|
| Is the **entry** criterion blocked by O-1? | **NO.** Entry is *"Time semantics stable"* — **not** *"thresholds defined"*. Time semantics are established (**five distinct times**, **TS-6**, **D-4**, **T-1**; P01 gate acceptance item 4 = **PASS**) |
| Can P07-02 **start** now? | **NO** — for two independent reasons: (a) **Hard** dependency **P07-01** is `NOT STARTED`; (b) **P07 IMPLEMENTATION = NOT YET PERMITTED**. Neither is an O-1 question |
| What **can** progress now | Non-numeric design already discharged: contract basis (**D14**), policy/state contract (**D15**), threshold decision model, scoping adjudication, lifecycle model, RP-4 evidence specification — **this act completes that set** |
| What remains **blocked** | The **exit** criterion *"Freshness state reproducible"* — **RP-4**, unevidenceable until values exist. Downstream: **P07-04** (Hard dep on P07-02), then **P13-01** (Hard, Critical, dep on P07-04) |
| What **cannot be certified** until values exist | The P07 gate itself: minimum evidence *"Quality classification; completeness; **no coercion** proof"*, certification before progression **YES (C7, C8)**, accepted **NO** (`P00_GATE_MODEL.md:44`). **C8** — *"Provenance/quality/freshness derivation"* — has certification authority **`UNKNOWN`** |

⚠ **Hard dependency semantics are preserved unsoftened.** `Dependency Matrix` states the
controlling reason verbatim: *"Freshness/staleness must be stable before dependent work can be
certified."* This act identifies **no bypass, no relaxation and no reordering** of any Hard
dependency. `P07-01 → P07-02 → P07-04` is unchanged, and `P07-03` remains additionally blocked
on provider selection (O-3).

---

## 8. FINAL DETERMINATION

| Item | Determination |
|---|---|
| **O-1 threshold ownership** | **P07** — **[ACCEPTED]** |
| **O-1 values** | 🔴 **OPEN** — none exist, none supplied, none inferable |
| **Threshold scoping** | **D — SCOPING REMAINS OPEN** |
| **Threshold-adopting authority** | **B — NOT DESIGNATED** |
| **Lifecycle model** | **[DESIGN]** — established in shape, no accepted authority |
| **RP-4** | 🔴 **OPEN — PRESERVED** |
| **P07-02 consequence** | entry **not** blocked by O-1; exit **blocked** by O-1; start **blocked** by Hard dep P07-01 and by `IMPLEMENTATION = NOT YET PERMITTED` |

> # 🔴 **O-1 = OPEN — AUTHORITY PATH UNRESOLVED**
>
> Threshold **ownership** is settled (P07). Threshold **values** are absent. Threshold
> **scoping** is undecided. **No authority is designated to adopt the values.** Until an
> explicit authority act designates a threshold-adopting authority and adopts a versioned
> threshold set, O-1 remains OPEN and P07-02's exit criterion cannot be evidenced.
>
> **Discovery alone grants no implementation authority, and this act grants none.**

### 8.1 What would resolve O-1

An explicit authority act that, at minimum: **(1)** designates the threshold-adopting
authority; **(2)** decides the scoping model (§3); **(3)** adopts a versioned threshold set
satisfying all ten elements of §2; **(4)** adjudicates negative-age comparison semantics;
**(5)** designates the **C8** certification authority. **None of these is performed here.**

---

## 9. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — no historical record edited |
| Source / test / fixture changes | **0** |
| Guards weakened, bypassed or varied | **none** |
| Numeric threshold values supplied | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim above cites a line in an existing record or a tracked source file.*
