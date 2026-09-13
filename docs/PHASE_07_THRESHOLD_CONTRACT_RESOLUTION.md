# PHASE 07 — CONTRACT / SCHEMA AUTHORITY RESOLUTION, ACTS 1–4

> **ACT TYPE:** Authority / design decision record. **NO IMPLEMENTATION.**
> **SOURCE OF TRUTH:** `PHASE_07_THRESHOLD_BLOCKER_ADJUDICATION.md` (commit `6e1d05f`). Its six
> required acts are **neither weakened nor reinterpreted**.
> **PURPOSE:** Resolve Acts 1–4 by explicit authority/design decision, and state precisely what
> still requires a **separate** authoritative act.
> ⚠ **NOTHING HERE ESTABLISHES A CONTRACT, A SCHEMA CHANGE OR A TRACKER CHANGE.** A decision is not
> an amendment. **No field, enumeration member, tracker row or implementation is created.**
> **Append-only. Edits nothing.**

---

## 0. Controlling status — unchanged

`D3 = B — PARTIALLY READY` · `O-1 = OPEN — 4 of 5 resolved` · **D01 15-minute threshold = business
requirement, NOT formally adopted** · `P07 IMPLEMENTATION = NOT YET PERMITTED` · `P07 ACCEPTANCE =
NOT ESTABLISHED` · `P07 CERTIFICATION = NONE GRANTED`.

---

## 1. ACT 1 — EVALUATION INSTANT

### 1.1 Design decision

| Element | Decision | Class |
|---|---|---|
| **Existence** | A **NEW, DISTINCT** time is required. It is **not** derivable from any existing time | ✅ **DECIDED** |
| **Position** | **T6** in the P01 time family — additive; the closed set of five becomes six | ✅ **DECIDED** |
| **Meaning** | **The instant at which freshness is evaluated** for a given datum and consumer | ✅ **DECIDED** |
| **Nature** | An **explicit input** supplied by the evaluation context. **Never** an implicit wall-clock *"now"* (**RP-2**) | ✅ **DECIDED** |
| **Candidate field name** | **`evaluationTime`** — follows the P01 `*Time` family (`observationTime`, `effectiveTime`, `publicationTime`) | 🔵 **[DESIGN] — NOT ESTABLISHED** |
| **Representation** | **TS-1** ISO-8601 UTC with explicit `Z` · **TS-2** precision fixed and declared per schema version | ✅ **DECIDED** (inherited) |
| **Clock source** | **Must be declared** by the establishing act, by analogy to **TS-6** (which fixes `receivedAt` to the ingest boundary) | 🔴 **TO BE FIXED BY THE P01 ACT** |
| **Evidence** | Must be **recorded in the freshness evidence** so the applied evaluation is reproducible (**RP-1**, **RP-3**) | ✅ **DECIDED** |
| **Distinctness** | **Never collapsed with, inferred from, or substituted for T1–T5** | ✅ **DECIDED** |

### 1.2 Repurposing prohibition — recorded and honoured

| Time | Not repurposed because |
|---|---|
| T1 `asOf` | the measured-from endpoint — age would be identically zero |
| T2 `receivedAt` | ingest time, fixed in the past by **TS-6** |
| T3 `observationTime` | event time — a property of the datum |
| T4 `effectiveTime` | economic effectiveness — unrelated to evaluation |
| T5 `publicationTime` | source release — unrelated to evaluation |

### 1.3 Constraints the establishing act must preserve

**SV-2** *"MINOR = strictly additive and backward-compatible"* · **BC-1** *"a consumer at schema `N`
must read data at `N-k` minor versions without error"* · **BC-3** an execution with **no**
contributing market-data snapshot *"must behave exactly as today"* and preserve the existing replay
identity · **BC-4** the delta must be *"additive and inert"* for existing SNAPSHOT-only executions ·
**RP-3** the threshold set applied is identified in the evidence.

> ### 🟡 **ACT 1 = B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT**
> **The design is decided. The field is NOT established.** Establishing it requires a **P01 additive
> contract act** amending the **ACCEPTED** P01. **No field is implemented here.**

---

## 2. ACT 2 — DURATION-UNIT ENUMERATION

### 2.1 Authority decisions — recorded as supplied

| # | Decision |
|---|---|
| 1 | ✅ **P01 is the authoritative schema owner for duration units** |
| 2 | ✅ **Duration units must be DECLARED and VERSIONED** |
| 3 | ✅ **At minimum, `minutes` and `seconds` must be admitted** |
| 4 | ✅ **`unit` is REQUIRED for every dimensioned freshness quantity** (**UN-1**) |
| 5 | ✅ **UN-1 / UN-2 preserved** — free-text units remain **invalid** |
| 6 | ✅ **TS-2 preserved** — precision fixed and declared per schema version |
| 7 | ✅ **SV-4 preserved** — the version is carried on every snapshot, never implied by deployment |
| 8 | ✅ **Additive MINOR — SV-2** |
| 9 | ✅ **Historical snapshots are NOT rewritten** (**BC-5**) — they retain their original `schemaVersion` |

### 2.2 Prohibitions honoured

| Prohibition | Honoured |
|---|---|
| Do not create the enumeration | ✅ **not created** — the members above are **authorized**, not **declared** |
| Do not add unit fields to implementation | ✅ **none added** |
| Do not create a P07 competing source of truth | ✅ **none created** |
| Preserve the `barInterval` precedent | ✅ **`barInterval` REMAINS OPEN** — **HA-6** *"DECLARED and VERSIONED, not enumerated"*, **BD-P05-03-03** OPEN, `barIntervalValueInvented: false`. **Changeable only by an authoritative schema act** |

> ### 🟡 **ACT 2 = B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT**
> **The authorization is recorded. UN-2 is NOT yet satisfied** — it is satisfied only when the
> enumeration actually exists **in the schema**. That requires a **P01 additive MINOR schema act**.
> **No schema change is implemented here.**

---

## 3. ACT 3 — "NORMAL OPERATING CONDITIONS"

### 3.1 ⚠ Sequencing finding that determines the answer

| Phase | Roadmap dependencies | Consequence |
|---|---|---|
| **P15** Full E2E Certification | **P07–P14** | downstream of all of P07–P14 |
| **P16** Production Provider Onboarding & Activation | **P02, P03, P05, P07, P15** | **production activation is `NOT AUTHORIZED`** — dimension **D**, *"exercised at P16 only … downstream of the blocked P15"* |
| **P17** Operations, Monitoring & Release Certification | **P15, P16** | **terminal** (`Next = None`) — reachable only **after** P15 **and** P16 |

> ### ⚠ **P17 CANNOT OWN THE DEFINITION**
> If the **definition** of *"normal operating conditions"* were owned by P17, the D01 threshold's
> applicability qualifier would be unobtainable until **after production onboarding** — a sequencing
> absurdity, since the threshold must be adoptable long before P16.

### 3.2 Design decision — separate the **definition** from the **operationalization**

| Concern | Owner | Basis |
|---|---|---|
| **Definition** of the **system** operational states (*normal* vs *degraded*) | 🔵 **A STANDALONE OPERATIONAL-STATE CONTRACT**, authored under **Program Authority**, independent of any phase | It is a **system-level contract**, and no existing contract defines it (**0 hits** across P00–P06) |
| **Operationalization** — monitoring, incident handling, provider failover / staleness controls | **P17** | Its roadmap objective: *"Operationalize monitoring, incident handling, provider failover/staleness controls…"* — legitimately gated behind P15/P16 |
| **Data-side** consequence (a datum classified `stale`/`partial`/`unavailable`) | **P07-04** | Its tracker requirement: *"Define behavior for missing, stale, partial and failed **data**"* |

> ### ❌ **P07-04 IS NOT THE OWNER OF SYSTEM OPERATIONAL STATE**
> P07-04 governs **data-quality states**. *"Normal operating conditions"* is a **system** qualifier.
> Assigning it to P07-04 **because P07-04 handles data states** is precisely the conflation this act
> must avoid. **DM-1 and DM-2 are preserved verbatim and unchanged.**

### 3.3 Prohibitions honoured

**No uptime percentage, SLA, SLO, percentile, error budget or any other operational metric is
invented or authorized.** The operational-state contract must define **states**, not **numeric
targets**. Any future numeric target requires its own explicit authorization.

> ### 🟡 **ACT 3 = B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT**
> **The ownership and design path is decided. No operational-state contract exists.** Establishing it
> requires **authoring and accepting a standalone operational-state contract** under Program
> Authority. **Nothing is implemented here.**

---

## 4. ACT 4 — REQUIRED P17 TRACKER DECOMPOSITION

### 4.1 Why decomposition is required

The **Work Tracker contains 59 work items covering P00–P13 only. No P14–P18 work item exists.**
**P17 appears only in the Phase Roadmap** — a single objective line, with **no requirement, entry or
exit criteria, dependencies or owner**. **A phase with no work items cannot own a contract.**

### 4.2 🔵 **PROPOSED** decomposition — for P17's **operationalization** role only

Proposed in the tracker's existing column structure (**Work ID · Phase · Area · Work Item ·
Requirement · Deliverable · Dependencies · Dependency Type · Entry Criteria · Exit Criteria ·
Test/Validation · Evidence · Authority/Gate · Status · Owner · Priority · Wave · Critical Path**):

| Work ID | Area | Work Item | Requirement | Dependencies (type) | Entry criteria | Exit criteria | Owner |
|---|---|---|---|---|---|---|---|
| **P17-01** | Operations | Operational-state observability | Expose and evidence the system operational states defined by the operational-state contract | **P15, P16** (Hard) · operational-state contract **accepted** | Contract accepted; P15 certified; P16 activated | Operational state observable and evidenced, with **no invented metric** | 🔴 **NOT DESIGNATED** |
| **P17-02** | Operations | Incident handling for degraded states | Define and evidence incident response for each degraded operational state | **P17-01** (Hard) | P17-01 exit met | Degraded states have explicit, evidenced response | 🔴 **NOT DESIGNATED** |
| **P17-03** | Operations | Provider failover / staleness controls | Operationalize the failover and staleness controls named in the P17 objective | **P17-01**, **P16** (Hard) | P17-01 exit met; provider onboarded | Controls operational and evidenced | 🔴 **NOT DESIGNATED** |
| **P17-04** | Release | Release evidence & production certification | Produce release evidence and execute production certification | **P17-01…P17-03** (Hard) | All prior P17 items exit-met | Release evidence complete; **C-series certification decided by the A2 authority** | 🔴 **NOT DESIGNATED** |

⚠ **These are PROPOSED, not created.** **No owner is designated** — none may be inferred from a role
name, prior acceptance or repository authorship. **All four are `NOT STARTED` and unreachable until
P15 and P16 complete.**

### 4.3 Tracker-change discipline

> ### 🔴 **THE TRACKER IS NOT MODIFIED BY THIS ACT**
> A tracker change is a **separate authority act**. **It was not performed here and must not be
> performed silently.** The decomposition above is the **specification that act must implement**.

> ### 🟡 **ACT 4 = B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT**

---

## 5. AUTHORITY / DESIGN DECISION MATRIX

| ACT | DECISION | CONTRACT OWNER | REQUIRED ARTIFACT / ACT | STATUS |
|---|---|---|---|---|
| **1 — Evaluation instant** | A **new distinct time T6**, an **explicit input**, never wall-clock *"now"*, never a repurposing of T1–T5; candidate name **`evaluationTime`** **[DESIGN]**; TS-1/TS-2 representation; recorded in evidence | **P01** — `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | **P01 additive MINOR contract act** (SV-2, BC-1, BC-3, BC-4, RP-3) | 🟡 **B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT** |
| **2 — Duration-unit enumeration** | **P01 is the schema owner**; units **declared and versioned**; **minutes and seconds admitted**; **`unit` required** for every dimensioned freshness quantity; UN-1/UN-2, TS-2, SV-4, BC-5 preserved | **P01** — `P01_SCHEMA_CATALOG.md` + `P01_FIELD_DICTIONARY.md` | **P01 additive MINOR schema act** (SV-2) | 🟡 **B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT** |
| **3 — Normal operating conditions** | A **system-level** operational-state contract, **standalone and Program-Authority-owned**; **P17 owns operationalization, not definition**; **P07-04 excluded**; **DM-1/DM-2 preserved**; **no metric invented** | 🔵 **NEW standalone operational-state contract** (definition) · **P17** (operationalization) | **Authoring + acceptance of the operational-state contract** | 🟡 **B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT** |
| **4 — P17 tracker decomposition** | **Required before P17 can own Act 3's operationalization**; four work items **proposed** with entry/exit/dependencies; **owners NOT designated**; unreachable until **P15/P16** | **Program Authority** (tracker) | **A separate tracker authority act** implementing §4.2 | 🟡 **B — RESOLVED SUBJECT TO A SEPARATE AUTHORITY ACT** |

**None of Acts 1–4 is `A — RESOLVED`**, because **none of the underlying contract, schema or tracker
changes has been established.** None is `C — OPEN / AUTHORITY INPUT REQUIRED` either, because the
design content is now decided.

---

## 6. RETAINED DECISIONS — all unchanged

| | |
|---|---|
| **D01 scope** | prices / quotes **only** |
| **Threshold** | **15 minutes** |
| **Comparison** | **strict `>`** |
| **Negative age** | **N1 — reject / invalid** |
| **Adopting authority** | **PROGRAM AUTHORITY** (D1) |
| **Certification authority** | **RAMKI** (D5, C8) |
| **D06 · D07 · C-PIT · C-MASTER · C-GOV · instrument-level** | 🔴 **OPEN — not inferred from D01** |
| **5-second `backendReceivedAt → screenDisplayedAt`** | 🔴 **separate OPEN contract boundary — NOT FD-2** |
| **FD-2** | **`receivedAt` − `asOf`** — unchanged |
| **Provider selection** | **none** (**DEP-P02-07**) |
| **Production implementation** | **none** |

---

## 7. ARE ACTS 1–2 SUFFICIENT TO PERMIT THE D3 VALUE-ADOPTION ACT?

> ### ❌ **NO — FURTHER BLOCKERS REMAIN**
>
> Acts 1–2 are **necessary but not sufficient**, and even they are not yet **established** — only
> **decided**. After their P01 acts are executed, these remain:

| # | Remaining blocker | Closed by |
|---|---|---|
| **1** | **Operational-state contract** — the threshold's applicability is expressly qualified *"under normal operating conditions"* | **Act 3's separate act** |
| **2** | **Effective date** — not supplied by any authority act so far | **D3 value-adoption act** |
| **3** | **Threshold-set identity and version** — no scheme exists; no historical version may be invented | **D3 value-adoption act** |

⚠ **Acts 3 and 4 are NOT prerequisites to preparing the value-adoption act's *content*** — the value,
scope, boundary and negative-age handling are already settled — **but Act 3 IS a prerequisite to
adopting it**, because the threshold's stated applicability depends on the definition of *normal*.

---

## 8. EXACT REMAINING AUTHORITY ACTS

| # | Act | Establishes |
|---|---|---|
| **1** | **P01 additive MINOR contract act** — introduce **T6 evaluation instant** | Act 1 |
| **2** | **P01 additive MINOR schema act** — declare and version the **duration-unit enumeration** | Act 2 · **satisfies UN-2** |
| **3** | **Author and accept a standalone operational-state contract** (system *normal* vs *degraded*; no invented metric; **DM-1/DM-2** preserved) | Act 3 |
| **4** | **Tracker authority act** — add the **P17-01…P17-04** rows of §4.2 with designated owners | Act 4 |
| **5** | **D3 value-adoption act** (PROGRAM AUTHORITY) — set identity · version · **effective date** · scope D01 · **15 minutes** · strict `>` · **N1** · supersession | **D3** — executable only after acts 1–3 |
| **6** | **5-second ownership decision** — an explicit owning contract for `backendReceivedAt → screenDisplayedAt`, and whether `screenDisplayedAt` will ever exist | the separate OPEN boundary |

---

## 9. STATUS

> # 🟡 **3. D3 STATUS = B — PARTIALLY READY** *(unchanged)*
> Acts 1–4 are **decided**, not **established**. **D3 is NOT RESOLVED.** **UN-2 remains unsatisfied
> until act 2 is executed**, and that alone prohibits a resolution claim.

> # 🔴 **4. O-1 STATUS = OPEN — 4 OF 5 RESOLVED · D3 NOT RESOLVED** *(unchanged)*
> **No partial closure.** **RP-4 stands**; P07-02's exit *"Freshness state reproducible"* remains
> **unevidenceable**. Entry not blocked by O-1 · **cannot start** (Hard dep **P07-01** `NOT STARTED`
> **and** `IMPLEMENTATION = NOT YET PERMITTED`) · **P07-04 → P13-01** downstream. **No Hard
> dependency weakened, relaxed or reordered; no tracker status altered.**

> # ⛔ **5. IMPLEMENTATION STATUS = NOT YET PERMITTED** *(unchanged)*
> `ACCEPTANCE = NOT ESTABLISHED` · `CERTIFICATION = NONE GRANTED` · production activation
> **`NOT AUTHORIZED`** (P16 only) · no provider selected · no licence or credentials.
> **A design decision is not implementation authorisation, and a contract amendment is not
> acceptance.**

---

## 10. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — every prior record **unedited** |
| Source / test / fixture / evidence changes | **0** |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` · providers | **untouched** |
| **Tracker** | **NOT MODIFIED** — §4.2 is a specification for a separate act |
| **SPEC** | **untouched** |
| Contract or schema actually amended | **none — decisions only** |
| Field, enumeration member or tracker row created | **none** |
| Operational metric invented | **none** |
| `barInterval` status changed | **no — remains OPEN** |
| DM-1 / DM-2 altered | **no** |
| P07-04 assigned system-operational ownership | **no — explicitly excluded** |
| Owners designated by inference | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record, a tracker cell, or a tracked source file.*
