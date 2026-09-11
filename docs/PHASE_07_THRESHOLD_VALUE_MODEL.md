# PHASE 07 — O-1 / D3 THRESHOLD VALUE MODEL AND RANGE DETERMINATION

> **ACT TYPE:** Policy / design determination. **NO IMPLEMENTATION.**
> **PURPOSE:** Establish the **value model** for D3 — what numerical values are required, of what
> type and unit, for which governed domain/instrument classes — and determine whether any value
> can be responsibly recommended from authoritative evidence.
> **SUPPLIES NO NUMERIC THRESHOLD VALUE.** None is fabricated; where evidence is absent the item
> is preserved as `OPEN — AUTHORITY VALUE REQUIRED`.
> **Append-only. Edits nothing.**

---

## 0. Controlling boundary and authoritative inputs

| | |
|---|---|
| **P07 ENTRY** | **`AUTHORIZED`** |
| **P07 CONTRACT / DESIGN** | **`ESTABLISHED`** |
| **P07 IMPLEMENTATION** | ⛔ **`NOT YET PERMITTED`** |
| **P07 ACCEPTANCE** | **`NOT ESTABLISHED`** |
| **P07 CERTIFICATION** | **`NONE GRANTED`** |

**Authoritative decisions received (recorded, not re-adjudicated):**

| ID | Decision | Value |
|---|---|---|
| **D1** | Threshold-adopting authority | ✅ **PROGRAM AUTHORITY** |
| **D2** | Threshold scoping | ✅ **B — DOMAIN / INSTRUMENT** |
| **D4** | Negative-age semantics (`receivedAt > asOf`) | ✅ **N1 — REJECT / INVALID** |
| **D5** | A2 / C8 certification authority | ✅ **RAMKI** |
| **D3** | Versioned threshold values | 🔴 **OPEN — this act's subject** |

⚠ **D4 = N1 constraint carried forward:** a negative age is a **rejection**, and per **Q-5**
*"A contract violation is not a quality state"* it must be expressed as a **rejection (error
class)**, **never** as a quality value. **Q-1**'s enum `good|stale|partial|unavailable` is
**unchanged**; **E1** remains the only quality-bearing class; **INV-7** quality is never coerced.

---

## 1. D3 VALUE MODEL — which dimensions actually require a numeric value

FD-1…FD-4 are preserved exactly as established (**D15 §2.3**). **No fifth dimension is created.**
They are **not** homogeneous, and only two are numeric:

| Dimension | Definition (D15 §2.3) | Needs a numeric threshold? | Basis |
|---|---|---|---|
| **FD-1** | **Data age** — elapsed time relative to `asOf` | ✅ **YES** — a duration magnitude | **[DESIGN]**, requires **Q-4**/`asOf` + evaluation instant |
| **FD-2** | **Delivery latency** — `receivedAt` − `asOf` | ✅ **YES** — a duration magnitude | **[DESIGN]**, named by **M-7** (`P02_OBSERVABILITY_REQUIREMENTS.md:63`) |
| **FD-3** | **Session context** — *whether `asOf` falls **inside** the referenced venue session* | ❌ **NO** — a **membership test**, not a magnitude | Required by **SE-3**; determined by the venue session reference, already an **[ACCEPTED]** input |
| **FD-4** | **Completeness basis** — contractual completeness of the snapshot | ❌ **NO — not for P07-02** | **Q-2**: `completenessPct` (0–100) is already **REQUIRED** and *"must reflect the actual proportion of contracted fields present"*. Any **minimum-completeness** value is a **P07-01** *"completeness … check"*, **not** a P07-02 freshness threshold |

> ### ✅ **VALUE-MODEL FINDING**
> **D3 for P07-02 requires numeric values for FD-1 and FD-2 only.** FD-3 is structural and FD-4 is
> a declared basis. This **narrows D3 by half** and prevents the fabrication of thresholds for
> dimensions that do not take one.
>
> ⚠ **FD-3 dependency:** `P04_EXCHANGE_VENUE_REFERENCE.md:49` records the calendar/session
> reference as *"**reference only**; session semantics are consumed by P05–P07"*, and the corpus
> contains **zero** session times or durations. **FD-3 cannot be evaluated until session reference
> data exists** — an input gap, **not** a threshold-value gap.

---

## 2. VALUE TYPE AND UNIT MODEL

| Attribute | Determination | Class |
|---|---|---|
| **Threshold type** | **Duration magnitude** — a non-negative quantity of elapsed time | **[DESIGN]** |
| **Compared quantity** | FD-1: `evaluationInstant − asOf` · FD-2: `receivedAt − asOf` (**M-7**) | **[ACCEPTED]** inputs |
| **Comparison direction** | **age ≥ threshold ⇒ `stale`** — monotone non-decreasing in age | **[DESIGN]** |
| **Boundary semantics** | strict (`>`) vs inclusive (`≥`) | 🔴 **`OPEN`** — must be declared per threshold; **not inferable** |
| **Permitted numeric domain** | **non-negative** reals; **negative threshold values are prohibited** (a negative threshold is meaningless and would make every datum stale) | **[DESIGN]** |
| **Zero handling** | a **zero** threshold makes every datum stale on arrival; permitted **only** with an explicit recorded justification | 🔴 **`OPEN`** — must be declared |
| **Negative *age* handling** | **not a threshold concern** — settled by **D4 = N1**: rejected/invalid **before** any comparison, expressed as a rejection, never as a quality value (**Q-5**) | ✅ **[ACCEPTED]** by D4 |
| **Unit** | ⚠ **BLOCKED — see below** | 🔴 **`OPEN / BLOCKED`** |
| **Precision / resolution** | **fixed and declared** per the schema version — **TS-2**: *"variable precision breaks byte-stable identity"* | ✅ **[ACCEPTED]** constraint |
| **Timestamp basis** | **TS-1** ISO-8601 UTC with explicit `Z`; **TS-6** `receivedAt` stamped once at the ingest boundary, **never recomputed** | ✅ **[ACCEPTED]** |

### 2.1 ⚠ UNIT IS BLOCKED — a hard UN-2 failure

**UN-2**: *"Units come from a **declared, versioned enumeration** in the schema; **free-text units
are invalid**."* **UN-1**: *"Every dimensioned quantity carries `unit`."*

**No such enumeration exists anywhere in the corpus** — a search for a declared unit enumeration /
unit registry / allowed-units construct returned **0 hits**. Accepted source expresses age as
`ageMs` (a bare JS number of milliseconds) with **no declared `unit` field**, and the
`freshnessInput` JSDoc advertises an `ageIsoDurationInputs` field that the implementation **does
not return** — recorded here as an **observation only; not modified**.

> ### 🔴 **UNIT = OPEN / BLOCKED**
> A threshold value **cannot be validly declared** until a versioned duration-unit enumeration
> exists. Adopting a bare number with a prose unit would **violate UN-2**. **This blocks D3
> independently of the values themselves**, and must be resolved by the same authority act.

---

## 3. DOMAIN / INSTRUMENT MODEL (D2 = B)

**D2 = B** requires domain/instrument-scoped thresholds. **Dozens of domain-specific values are
NOT created.** The minimum governed classes are derived **only** from corpus-supported
classifications:

| Class | Members | Source of the classification | Needs FD-1/FD-2 thresholds? |
|---|---|---|---|
| **C-LIVE** | **D01** Market prices/quotes · **D06** News/events | `Data Domains` **Operating Mode = "LIVE + historical"** | ✅ **YES** — these are where elapsed-time staleness bites |
| **C-REF** | **D07** Analyst estimates/consensus | ⚠ **`P04_EXCHANGE_VENUE_REFERENCE.md:21`** — *"**Staleness baselines for D01/D07 are P07 work**"* — Operating Mode *"Snapshot + PIT"* | ✅ **YES — explicitly named by P04**, despite snapshot mode |
| **C-PIT** | **D02** Historical OHLCV · **D03** Fundamentals · **D04** Corporate actions · **D08** Macro | Operating Mode **Historical / PIT / snapshot / effective-date** | ⚠ **QUALIFIED** — currency is governed by **version and effective-date semantics**, not elapsed-time staleness. 🔴 **`OPEN — AUTHORITY INPUT REQUIRED`** on whether an FD-1 threshold applies at all |
| **C-MASTER** | **D05** Instrument/security master · **D10** Exchange/reference metadata | Operating Mode **"Current + historical (lifecycle / where relevant)"** | 🔴 **`OPEN — AUTHORITY INPUT REQUIRED`** |
| **C-GOV** | **D09** Alternative data | Operating Mode **"Governed/approved only"**, *"Required by applicability"* | 🔴 **`OPEN — AUTHORITY INPUT REQUIRED`** — applicability itself is conditional |

> ### ✅ **MINIMUM GOVERNED CLASSES = 5** (C-LIVE, C-REF, C-PIT, C-MASTER, C-GOV)
> Grounded in the authoritative **Operating Mode** column and **P04:21**. **Only C-LIVE and C-REF
> are confirmed to require FD-1/FD-2 values.** The other three are preserved **OPEN** rather than
> given invented values.
>
> ⚠ **Instrument-level subdivision is NOT established.** The corpus supports **domain** classes;
> it does **not** support instrument-class subdivision. **INSTRUMENT-LEVEL SCOPING = OPEN —
> AUTHORITY INPUT REQUIRED.**

---

## 4. NUMERIC RANGE DETERMINATION — evidence classification

| Class | Content | Finding |
|---|---|---|
| **A** existing authoritative values | values already adopted in the corpus | **NONE** — zero adopted thresholds in tracker, SPEC, P00–P06, ADRs, `PROGRAM_STATE`, certification matrices |
| **B** values supported by existing evidence | derivable from corpus data | **NONE** — see the groundability chain below |
| **C** policy-design recommendations | model, type, structure | **SUPPLIED** — §1, §2, §3 of this record. **No numbers** |
| **D** requiring explicit authority adoption | the actual values | **ALL of them** — every FD-1 and FD-2 value for every class |

### 4.1 Why no numeric value can be responsibly recommended

| # | Required evidence | State |
|---|---|---|
| 1 | **Provider publication cadence** | 🔴 absent — **DEP-P02-07** *"No provider-selection authority is recorded"*; **no provider selected** |
| 2 | **Observed delivery-latency characteristics** | 🔴 absent — **DEP-P02-10**: entitlement matrix *"necessarily empty"*. `P02_PROVIDER_CAPABILITY_MODEL.md:142` is the only place latency would live, and it states *"Latency / freshness — **Inputs to P07 thresholds (thresholds are not set here)**"* — and is **unpopulated** |
| 3 | **Venue session calendars / durations** | 🔴 absent — **0** session times or durations in the corpus |
| 4 | **SPEC currency or latency targets** | 🔴 absent — **0** numeric time values, **0** threshold/SLO/SLA/TTL/tolerance terms, **0** cadence vocabulary (intraday / EOD / real-time / delayed / streaming / batch) in the entire SPEC |
| 5 | **Tracker thresholds** | 🔴 absent — **0** numeric thresholds across all 12 sheets |

> ### 🔴 **ALL FD-1 / FD-2 VALUES = OPEN — AUTHORITY VALUE REQUIRED**
>
> **A staleness threshold is a statement about how quickly a specific feed is expected to
> update.** With **no provider selected, no licence, no entitlement matrix, no session calendar
> and no cadence target anywhere in the corpus**, any number would be **invented**, not derived.
>
> **Per the governing instruction: a threshold set with fabricated precision is worse than an
> explicitly open threshold.** **No value is recommended — not even as a range** — because a range
> would still assert a defensible magnitude that nothing here supports.
>
> ⚠ **Nothing in this record is an existing-IIPS value.** No recommendation is labelled as one.

### 4.2 What would make values defensible

An authority act can set FD-1/FD-2 values defensibly once **any** of the following exists:
**(1)** provider selection (**O-3**) with published cadence/latency characteristics; **(2)** venue
session calendars for the in-scope exchanges; **(3)** an observed delivery-latency distribution
from a real or representative feed; **(4)** an explicit business currency requirement recorded by
the program authority. **Until then the values are correctly OPEN.**

---

## 5. SET-LEVEL POLICY

| Element | Determination | Class |
|---|---|---|
| **Threshold-set identity** | stable addressable identifier for the set as a whole | **[DESIGN]** |
| **Version** | monotonically increasing; a result is reproducible only if the applied set version is named | **[DESIGN]** |
| **Effective date / effective-from version** | a past evaluation must resolve the set that governed *then* | **[DESIGN]** |
| **Domain/instrument applicability** | the §3 classes; **instrument level OPEN** | **[DESIGN]** + 🔴 OPEN |
| **Supersession model** | supersession by addition, prior sets retained | **[DESIGN]** — ⚠ **not accepted policy**; the corpus does not say so for thresholds |
| **Reproducibility identity** | **RP-1…RP-3 [ACCEPTED]**; **RP-4 [OPEN]** — unevidenceable while values are undefined | mixed |
| **Adopting authority** | ✅ **PROGRAM AUTHORITY** (D1) | ✅ **RESOLVED** |
| **Certification authority** | ✅ **RAMKI** (D5) — for **C8** *"Provenance/quality/freshness derivation"* | ✅ **RESOLVED** |

---

## 6. D3 READINESS DECISION

> # 🟡 **B — D3 PARTIALLY READY; SOME VALUES REQUIRE AUTHORITY INPUT**
>
> **Ready now (this act supplies it):** the value model — **which** dimensions take a numeric
> value (**FD-1, FD-2 only**), the **type**, **comparison direction**, **numeric domain**, **zero
> and negative handling**, **precision constraint**, the **five minimum governed classes**, and
> the **set-level structure**.
>
> **Requires authority input (cannot be closed here):**
> **①** every **FD-1 / FD-2 numeric value** per class; **②** the **duration-unit enumeration**
> (UN-2 blocker, §2.1); **③** **boundary semantics** (`>` vs `≥`) and **zero handling** per
> threshold; **④** whether **C-PIT / C-MASTER / C-GOV** take an FD-1 threshold at all;
> **⑤** whether **instrument-level** subdivision is required.
>
> ⚠ **D3 is NOT RESOLVED.** A range recommendation does not exist, and would not resolve D3 if it
> did — resolution requires **explicit authority adoption of values**.

---

## 7. Resulting O-1 state

| ID | Decision | State |
|---|---|---|
| **D1** | Adopting authority | ✅ **RESOLVED** — PROGRAM AUTHORITY |
| **D2** | Scoping | ✅ **RESOLVED** — B, domain/instrument |
| **D3** | Versioned threshold values | 🔴 **OPEN** — model established, **values and unit require authority input** |
| **D4** | Negative-age semantics | ✅ **RESOLVED** — N1, reject/invalid |
| **D5** | A2 / C8 certification authority | ✅ **RESOLVED** — RAMKI |

> # 🔴 **O-1 = OPEN — 4 OF 5 DECISIONS RESOLVED; D3 VALUES OUTSTANDING**
>
> **There is no partial closure.** O-1 becomes `RESOLVED` only when D3's values and unit
> enumeration are explicitly adopted. **RP-4 stands**; P07-02's exit criterion *"Freshness state
> reproducible"* remains **unevidenceable**.

### 7.1 P07-02 consequence — unchanged, unsoftened

Entry *"Time semantics stable"* **not blocked by O-1** · **cannot start** (Hard dep **P07-01**
`NOT STARTED` **and** `IMPLEMENTATION = NOT YET PERMITTED`) · exit **BLOCKED** by O-1 / **RP-4** ·
downstream **P07-04** → **P13-01**. **No Hard dependency weakened, relaxed or reordered. No
tracker status altered.**

---

## 8. NO IMPLEMENTATION — attestation

P07 source / tests / fixtures **none created or modified** · `LiveDataRuntime`, `PluginLoader`,
`PluginNamespace` **untouched** · provider integrations **untouched**, **no provider selected** ·
tracker and SPEC **unmodified** · **no implementation tests run** (no P07 implementation exists) ·
**no P07 acceptance, no P07 certification.**

⚠ **D5 designates the C8 certification authority. That is NOT P07 implementation authorization
and NOT a certification grant** — `certification_granted` remains **`false`**, program
certification **`NONE_GRANTED`**.

---

## 9. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — all prior records **unedited** |
| Source / test / fixture / evidence changes | **0** |
| Numeric threshold values supplied | **none** |
| Guards weakened, bypassed or varied | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record, a tracker cell, or a tracked source file.*
