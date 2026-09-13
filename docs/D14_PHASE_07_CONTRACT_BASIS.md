# D14 — PHASE 07 (DATA QUALITY) CONTRACT BASIS

> **Append-only design/contract-basis record. Authorized by D13 §2 item 2.**
> It **implements nothing**: no `.js`, no `.ts`, no runtime change, no provider adapter,
> no persistence, no production wiring, no UI change.
> It **modifies no accepted P00–P06 artifact**, **no checkpoint**, **no gate record**, and
> **no historical decision-log entry**. It **creates no new governance directory** and no register.
>
> **This is a CONTRACT-BASIS record. It is NOT an acceptance artifact, NOT approved acceptance
> criteria, and NOT implementation authorization.**

---

## 0. Provenance legend — every statement below carries one of these five classes

| Tag | Meaning | Authority |
|---|---|---|
| **[TRACKER]** | Verbatim requirement from the Program Tracker (`Work Tracker` / `Dependency Matrix` / `Phase Roadmap` sheets) | **AUTHORITATIVE** |
| **[ACCEPTED]** | Existing accepted P00–P06 contract, boundary or invariant | **AUTHORITATIVE — must be preserved, never rewritten** |
| **[DESIGN]** | A P07 design decision proposed by this document | ⚠ **NON-AUTHORITATIVE until an authority act adopts it** |
| **[OPEN]** | An open authority question or undefined value | ⚠ **UNRESOLVED — must not be filled by inference** |
| **[IMPL]** | Implementation detail deliberately **not** established here | ⛔ **NOT YET AUTHORIZED** |

⚠ **No rule ID, threshold value, algorithm, schema, API or data structure stated in this document
is authoritative.** Anything of that kind appears only under **[DESIGN]** or **[IMPL]**.

---

## 1. Authority and scope

| Field | Value |
|---|---|
| **Record** | **D14** |
| **Act type** | **Contract-basis / design reconciliation** |
| **Recorded** | 2026-09-11 |
| **Authorized by** | **`docs/D13_PHASE_07_ENTRY_AUTHORIZATION.md`** (commit `7fe5aaaf290b601dd28db5104610f74bc714a6ce`), §2 item 2 — *"P07 design / reconciliation work required to establish its implementation basis is authorized"* |
| **P07-04 ownership** | **A — REMAINS P07-OWNED**, adjudicated on `Work Tracker!P07-04` |
| **Gate state** | **7 of 18 accepted** — unchanged |

| # | This act does NOT |
|---|---|
| 1 | Implement any runtime or source behaviour |
| 2 | Modify **P03**, **P05**, **P06**, **P13** or **Existing-IIPS** |
| 3 | Create tests for implementation behaviour |
| 4 | Claim that acceptance criteria are approved |
| 5 | Assign **A3**, **A2**, **C7** or **C8** by inference |
| 6 | Select a provider, or execute against one |
| 7 | Authorize production, provider/licensed execution, **P08+**, or a Track B → `origin/main` merge |
| 8 | Invent numerical thresholds, rule IDs, schemas or APIs |

---

## 2. Authoritative work-item extract — verbatim from the Program Tracker

Source: `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx`,
sheets `Work Tracker` and `Dependency Matrix`. The tracker is the authoritative work-item register
— cited as such at `docs/p01/P01_EVIDENCE.md:39`, `docs/p02/P02_EVIDENCE.md:35,39`,
`docs/p05/P05_02_SPECIFICATION.md:47`, `docs/p05/P05_03_EVIDENCE.md:15`, and treated as the bound on
a phase's work items at `docs/p06/P06_GATE_ACCEPTANCE.md:87`.

### 2.1 `P07-01` — Quality rule framework

| Column | Value |
|---|---|
| Work ID / Phase / Area | `P07-01` / `P07` / `Quality` |
| **Work Item** | **Quality rule framework** |
| **Requirement** | **"Define completeness, validity, range, continuity and reconciliation checks."** |
| **Deliverable** | **DQ rule engine** |
| Dependencies / Type | `P06-01` — **Hard** |
| Entry criteria | **"Canonical data exists"** |
| Exit criteria | **"Rules execute and classify failures"** |
| Test / Validation | Rule tests |
| Evidence | DQ evidence |
| Authority / Gate | Phase gate |
| Status | **NOT STARTED** |
| Critical Path / Wave / Workstream | **YES** / W5 / WS-B Data Foundation |
| Dependency-Matrix reason | *"Quality rule framework must be stable before dependent work can be certified."* — Critical **YES** |

### 2.2 `P07-02` — Freshness/staleness

| Column | Value |
|---|---|
| Work ID / Phase / Area | `P07-02` / `P07` / `Quality` |
| **Work Item** | **Freshness/staleness** |
| **Requirement** | **"Calculate freshness and explicit stale/unavailable states."** |
| **Deliverable** | **Freshness service** |
| Dependencies / Type | `P01-02, P07-01` — **Hard** |
| Entry criteria | **"Time semantics stable"** |
| Exit criteria | **"Freshness state reproducible"** |
| Test / Validation | Time/freshness tests |
| Evidence | Freshness evidence |
| Authority / Gate | Phase gate |
| Status | **NOT STARTED** |
| Critical Path / Wave / Workstream | **YES** / W5 / WS-B Data Foundation |
| Dependency-Matrix reason | *"Freshness/staleness must be stable before dependent work can be certified."* — Critical **YES** |

### 2.3 `P07-03` — Provider reconciliation

| Column | Value |
|---|---|
| Work ID / Phase / Area | `P07-03` / `P07` / `Quality` |
| **Work Item** | **Provider reconciliation** |
| **Requirement** | **"Compare overlapping provider/reference values and resolve policy."** |
| **Deliverable** | **Reconciliation service** |
| Dependencies / Type | `P02-03, P07-01` — **Hard** |
| Entry criteria | **"Providers selected"** |
| Exit criteria | **"Discrepancies classified"** |
| Test / Validation | Reconciliation tests |
| Evidence | Reconciliation reports |
| Authority / Gate | Phase gate |
| Status | **NOT STARTED** |
| Critical Path / Wave / Workstream | **YES** / W5 / WS-B Data Foundation |
| Dependency-Matrix reason | *"Provider reconciliation must be stable before dependent work can be certified."* — Critical **YES** |

### 2.4 `P07-04` — Degraded-state contract

| Column | Value |
|---|---|
| Work ID / Phase / Area | `P07-04` / `P07` / `Quality` |
| **Work Item** | **Degraded-state contract** |
| **Requirement** | **"Define behavior for missing, stale, partial and failed data."** |
| **Deliverable** | **Degraded-state contract** |
| Dependencies / Type | `P07-01, P07-02` — **Hard** |
| Entry criteria | **"DQ states defined"** |
| Exit criteria | **"Consumers receive explicit state"** |
| Test / Validation | Negative tests |
| Evidence | Degraded fixtures |
| Authority / Gate | Phase gate |
| Status | **NOT STARTED** |
| Critical Path / Wave / Workstream | **YES** / W5 / WS-B Data Foundation |
| Dependency-Matrix reason | *"Degraded-state contract must be stable before dependent work can be certified."* — Critical **YES** |

### 2.5 Phase-level statement

| Source | Value |
|---|---|
| `Phase Roadmap!P07` name | **"Data Quality, Freshness & Reconciliation"** |
| `Phase Roadmap!P07` objective | **"Detect missing, stale, malformed, contradictory and out-of-order data; expose quality state and reconciliation evidence."** |
| `Phase Roadmap!P07` dependencies | `P04–P06` |
| `Phase Gates!P07` promotion rule | **"Explicit gate acceptance; no automatic promotion"** |

---

## 3. Accepted contract surface the P07 contract must build on — never rewrite

| Tag | Item | Source | Consequence for P07 |
|---|---|---|---|
| **[ACCEPTED]** | `quality` is a **REQUIRED** enum: **`good` \| `stale` \| `partial` \| `unavailable`** | `docs/p01/P01_FIELD_DICTIONARY.md:28` | ⚠ **P07 may not invent a new top-level state vocabulary.** The tracker's "explicit stale/unavailable states" (P07-02) and "missing, stale, partial and failed data" (P07-04) **already have accepted names** |
| **[ACCEPTED]** | `completenessPct` is **REQUIRED**, `0`–`100` inclusive | `P01_FIELD_DICTIONARY.md:29`; `P01_DATA_CONTRACT.md:94` | P07-01's **completeness** check must evaluate against this existing field |
| **[ACCEPTED]** | `fields` may be empty **only** when `quality = 'unavailable'` | `P01_FIELD_DICTIONARY.md:34`; `P01_DATA_CONTRACT.md:99` | Constrains P07-04's **missing**-data behaviour |
| **[ACCEPTED]** | Field-level `quality` override **"may only be equal/worse than snapshot"** | `P01_FIELD_DICTIONARY.md:50` | A P07-01 monotonicity constraint, already fixed |
| **[ACCEPTED]** | **INV-7** — *"Quality never coerced (NFR-04): `quality` / `completenessPct` propagate"* | `P01_DATA_CONTRACT.md:57` | This **is** the gate model's *"no coercion proof"* |
| **[ACCEPTED]** | **Q-2** — `completenessPct` *"must reflect the actual proportion of contracted fields present"* | `P01_DATA_CONTRACT.md:253` | P07-01 completeness semantics are already partly fixed |
| **[ACCEPTED]** | **Q-5** — *"A contract violation is not a quality state. A namespace collision or structural invalidity is a **rejection**, not `quality: 'partial'`"* | `P01_DATA_CONTRACT.md:256` | ⚠ **Hard boundary:** P07 rules may **not** reclassify rejections as degraded data |
| **[ACCEPTED]** | **NFR-04** — `quality` and `completenessPct` *"propagate to DTOs and UI; never coerced or dropped"* | `docs/d4/D4_02_DATA_DOMAINS.md:197` | P07 output must propagate, not terminate |
| **[ACCEPTED]** | **P02 error taxonomy E1–E8**, with **E1** `PROVIDER_UNAVAILABLE` → `quality: 'unavailable'`, and the **rejection vs data-condition** distinction | `docs/p02/P02_ERROR_TAXONOMY.md:17-24` | P07 consumes this taxonomy; it may not redefine it |
| **[ACCEPTED]** | **P03 DM-1** — *"Security has no degraded mode"* · **DM-2** — *"Degradation is a property of **data**, never of the **security decision**"* | `docs/p03/P03_FAILURE_AND_DEGRADED_MODE.md:90-91` | **P07-04 operates on data only.** DM-2 is what makes the P07/P03 boundary coherent |
| **[ACCEPTED]** | **P05** owns degraded-state **classification** at acquisition | `docs/p00/P00_GATE_MODEL.md:42` | Unchanged by P07 |
| **[ACCEPTED]** | **P13** owns degraded-state **visibility** in the UI | `docs/p00/P00_GATE_MODEL.md:50` | Unchanged; **P13-01 depends on P07-04** (Hard, Critical) |
| **[ACCEPTED]** | **P06** owns conversion into governed canonical form | `docs/p06/P06_GATE_ACCEPTANCE.md` | P07-01's entry criterion *"Canonical data exists"* is **satisfied** |
| **[ACCEPTED]** | **MQ-1 / MQ-2** — P02 sets **no thresholds, no SLOs, no alerts**; freshness thresholds are **P07**; alerting and incident response are **P17** | `docs/p02/P02_OBSERVABILITY_REQUIREMENTS.md:69-70` | Threshold ownership is **P07**; alerting is **out of P07 scope** |
| **[ACCEPTED]** | **LA-10** — *"an adapter sets no freshness thresholds; thresholds are P07"* (test-enforced) | `p05/src/liveAdapterContract.js:332` | Confirms P07 as sole threshold owner |
| **[ACCEPTED]** | **BD-P05-01-08** — P05-01 supplies only the **inputs**: `asOf`, `receivedAt`, venue session reference, completeness basis (**Q-4**) | `docs/p05/P05_01_OPEN_ITEMS.md:111` | **These are P07-02's authoritative input set** |

---

## 4. `P07-01` — Quality rule framework: contract basis

### 4.1 Rule categories — [TRACKER] authoritative

The tracker requirement names **exactly five** check categories. **This set is authoritative and
closed**; P07 may not add or drop a category without an authority act.

| # | Category **[TRACKER]** | Accepted anchor |
|---|---|---|
| 1 | **completeness** | `completenessPct` **[ACCEPTED]**; **Q-2** |
| 2 | **validity** | **Q-5** boundary; P01 validation stages **[ACCEPTED]** |
| 3 | **range** | P01 field-domain rules **[ACCEPTED]** |
| 4 | **continuity** | `asOf` / session semantics from **P01-02** **[ACCEPTED]** |
| 5 | **reconciliation** | Delegates to **P07-03** **[TRACKER]** |

### 4.2 Quality-rule inputs — [DESIGN], built on [ACCEPTED]

| Input | Class | Note |
|---|---|---|
| Canonical snapshot as produced by **P06** | **[ACCEPTED]** | Satisfies the P07-01 entry criterion *"Canonical data exists"* |
| `quality`, `completenessPct`, `fields`, `asOf`, `receivedAt`, `mode`, `lineage` | **[ACCEPTED]** | Required P01 metadata (`P01_DATA_CONTRACT.md:177`) |
| The applicable **contracted field set** for the snapshot's domain | **[DESIGN]** | Needed for **Q-2** proportion evaluation; the exact derivation is **not** fixed here |

### 4.3 Rule evaluation boundary — [DESIGN]

| # | Boundary | Class |
|---|---|---|
| **B-1** | P07 rules **evaluate** canonical data; they **do not repair, fill, coerce or drop** it | **[ACCEPTED]** via **INV-7** / **NFR-04** |
| **B-2** | A rule failure is a **classification**, never a mutation | **[DESIGN]**, constrained by INV-7 |
| **B-3** | A **contract violation is not a quality state** — rejections stay rejections | **[ACCEPTED]** via **Q-5** |
| **B-4** | P07 does **not** re-derive identity, lineage or namespace | **[ACCEPTED]** — P01/P04/P06 own these |
| **B-5** | P07 does **not** raise alerts or incidents | **[ACCEPTED]** via **MQ-2** — that is **P17** |
| **B-6** | Rule evaluation must be **deterministic and reproducible** over identical inputs | **[DESIGN]**, required by the P07-02 exit criterion *"reproducible"* and by `Phase Gates!P07` |

### 4.4 Quality classification outputs — [DESIGN]

⚠ **P07 introduces no new top-level state vocabulary.** Output is expressed in the **[ACCEPTED]**
`quality` enum plus the **[ACCEPTED]** `completenessPct`, optionally with a per-rule result record
whose shape is **[IMPL]**.

| Output | Class |
|---|---|
| A `quality` value drawn **only** from `good \| stale \| partial \| unavailable` | **[ACCEPTED]** vocabulary, **[DESIGN]** selection rule |
| `completenessPct` consistent with **Q-2** | **[ACCEPTED]** |
| Per-rule results identifying **which** category failed | **[DESIGN]** — representation is **[IMPL]** |
| Field-level `quality` overrides obeying *"equal/worse than snapshot"* | **[ACCEPTED]** |

### 4.5 No-coercion requirement — [ACCEPTED], and it is the gate evidence

The gate model's P07 minimum evidence is *"Quality classification; completeness; **no coercion**
proof"* (`P00_GATE_MODEL.md:44`). That proof obligation **already has an accepted definition**:
**INV-7** (*"Quality never coerced"*) and **NFR-04** (*"never coerced or dropped"*).
**P07 must evidence compliance with the existing invariant, not define a new one.**

### 4.6 Evidence required for later acceptance — [TRACKER] + [DESIGN]

| Evidence | Class |
|---|---|
| **Rule tests** | **[TRACKER]** — named test/validation column |
| **DQ evidence** | **[TRACKER]** — named evidence column |
| Exit criterion demonstrable: *"Rules execute and classify failures"* | **[TRACKER]** |
| A **no-coercion proof** traceable to **INV-7** / **NFR-04** | **[ACCEPTED]** obligation |
| ⚠ A formal `P07_ACCEPTANCE_CRITERIA` artifact | **[OPEN]** — does not exist; **not created by this act** |

### 4.7 Explicitly not established

⛔ **[IMPL]** Rule identifiers, a rule registry, evaluation order, a rule DSL, storage schema,
configuration format, API surface, error codes, severity levels, and any threshold value.
⚠ No rule ID is invented in this document.

---

## 5. `P07-02` — Freshness/staleness: contract basis

### 5.1 Required inputs — [ACCEPTED]

Authoritative input set per **BD-P05-01-08**: **`asOf`**, **`receivedAt`**, **venue session
reference**, **completeness basis** (Q-4). **[TRACKER]** entry criterion *"Time semantics stable"*
is satisfied by **P01-02** (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3), which **P01** accepted.

### 5.2 Freshness dimensions — [DESIGN]

| Dimension | Class | Anchor |
|---|---|---|
| **Age of the data** — elapsed time relative to `asOf` | **[DESIGN]** | `asOf` **[ACCEPTED]** |
| **Delivery latency** — `receivedAt` relative to `asOf` | **[DESIGN]** | both **[ACCEPTED]** |
| **Session context** — whether `asOf` falls inside the referenced venue session | **[DESIGN]** | venue session reference **[ACCEPTED]** |
| **Completeness basis** — whether the snapshot is contractually complete | **[ACCEPTED]** | **Q-2** |

⚠ **P07 must not collapse these dimensions.** Collapsing them would destroy the distinction the
tracker's *"Calculate freshness"* requirement depends on.

### 5.3 Staleness concept — [DESIGN], bounded by [ACCEPTED]

**Staleness is a derived judgement that the data's age exceeds a threshold for its dimension and
context.** The concept is [DESIGN]; the **state it produces is [ACCEPTED]** (`quality: 'stale'`).

⚠ **P07 owns the threshold. P07 does not own the state vocabulary.**

### 5.4 Threshold ownership — settled, and the values are OPEN

| Item | Class | Source |
|---|---|---|
| Freshness thresholds are **P07** | **[ACCEPTED]** | **MQ-2**; **LA-10** (test-enforced) |
| P02 / adapters set **no** thresholds | **[ACCEPTED]** | **MQ-1**; **LA-10** |
| **⚠ The numerical threshold values themselves** | 🔴 **[OPEN]** | `DEP-P01-05` *"Freshness **thresholds** undefined"*; `DEP-P02-12` |

> 🔴 **NO NUMERICAL FRESHNESS OR STALENESS THRESHOLD IS ESTABLISHED BY THIS DOCUMENT.**
> A corpus-wide search returns **no** threshold value anywhere. Threshold values are
> **OPEN / TO BE AUTHORED** through the appropriate authority path, and require:
> **(a)** the dimension and context each threshold applies to;
> **(b)** the venue/instrument-class variation, if any;
> **(c)** an authority act adopting them.
> **Inventing a value here would create an unaudited normative number and is prohibited.**

### 5.5 Freshness states required by the contract — [TRACKER] mapped onto [ACCEPTED]

**[TRACKER]** P07-02 requires *"explicit **stale/unavailable** states."* Both already exist:

| Tracker state | Accepted equivalent | Class |
|---|---|---|
| **stale** | `quality: 'stale'` | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:28` |
| **unavailable** | `quality: 'unavailable'` | **[ACCEPTED]** — same row |
| *(non-degraded)* | `quality: 'good'` | **[ACCEPTED]** |
| *(partially present)* | `quality: 'partial'` | **[ACCEPTED]** — required by **P07-04** |

⚠ **Consequence: P07-02 introduces no new state.** Its deliverable is the **derivation** of an
existing state, not a new vocabulary.

### 5.6 Consumer-facing semantics — [DESIGN], bounded by [ACCEPTED]

| # | Rule | Class |
|---|---|---|
| **F-1** | Freshness state is **always explicit** — never absent, never implied | **[TRACKER]** *"explicit … states"* |
| **F-2** | The state **propagates** to DTOs and UI; it is never coerced or dropped | **[ACCEPTED]** NFR-04 |
| **F-3** | A stale state **does not** suppress the data; it annotates it | **[DESIGN]**, constrained by INV-7 |
| **F-4** | `quality: 'unavailable'` is the **only** condition under which `fields` may be empty | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:34` |
| **F-5** | Freshness evaluation is **reproducible** for identical inputs | **[TRACKER]** exit criterion |
| **F-6** | P07 emits **no alert** on staleness | **[ACCEPTED]** MQ-2 → **P17** |

### 5.7 Evidence required — [TRACKER] + [OPEN]

**[TRACKER]** *Time/freshness tests* · *Freshness evidence* · exit criterion *"Freshness state
reproducible."*
🔴 **[OPEN]** Reproducibility cannot be evidenced until thresholds exist — the evidence obligation
is **blocked on §5.4**, not on design.

### 5.8 Explicitly not established

⛔ **[IMPL]** The freshness service's module structure, API, storage, caching, evaluation trigger,
and every threshold value.

---

## 6. `P07-03` — Provider reconciliation: contract basis

### 6.1 Reconciliation contract — [TRACKER]

**[TRACKER]** *"Compare **overlapping** provider/reference values and resolve policy."*
Deliverable **Reconciliation service**; exit criterion **"Discrepancies classified."**

### 6.2 🔴 The provider-selection dependency is UNMET

| Item | Class | Source |
|---|---|---|
| Entry criterion | **[TRACKER]** **"Providers selected"** |
| Provider-selection state | 🔴 **UNMET — no provider is selected** |
| Rubric state | **[ACCEPTED]** *"Rubric **delivered**; no candidate evaluated or selected"* | `docs/p02/P02_DEPENDENCY_REGISTER.md:50` |
| Recorded limitation | **[ACCEPTED]** **DEP-P02-07** — *"No provider-selection authority is recorded … Selection is an authority act; no A-role is assigned to it"* |
| Related | **[ACCEPTED]** **DEP-P02-10** — entitlement matrix empty; *"empty is the correct state"* |

> 🔴 **P07-03 CANNOT SATISFY ITS ENTRY CRITERION.** Provider selection is an **authority act** with
> **no A-role assigned**. It is **not** within D13's scope and **not** resolvable by design work.
> **No provider is selected, evaluated or named by this document, and none may be inferred.**

**Consequence:** the P07-03 **contract** may be authored; the P07-03 **implementation** cannot
start, and its acceptance cannot be reached, until provider selection occurs by a separate authority
act.

### 6.3 Reconciliation inputs — [DESIGN]

| Input | Class |
|---|---|
| Two or more canonical snapshots covering an **overlapping** identifier/scope | **[DESIGN]**, per **[TRACKER]** *"overlapping"* |
| The **[ACCEPTED]** canonical field set and namespace from P01/P06 | **[ACCEPTED]** |
| Provenance/lineage sufficient to attribute each value to its provider | **[ACCEPTED]** — P01 lineage |

⚠ **No provider may be named.** The contract is expressed over *abstract* provider identities.

### 6.4 Provider discrepancy semantics — [DESIGN], bounded by [ACCEPTED]

| # | Rule | Class |
|---|---|---|
| **R-1** | A discrepancy is **classified, not silently resolved** | **[TRACKER]** exit criterion *"Discrepancies classified"* |
| **R-2** | Reconciliation **never coerces** a value to make sources agree | **[ACCEPTED]** INV-7 / NFR-04 |
| **R-3** | A discrepancy is **not** a contract violation; **Q-5** keeps the two categories distinct | **[ACCEPTED]** |
| **R-4** | ⚠ The **resolution policy** itself — precedence, tolerance, tie-breaking | 🔴 **[OPEN]** — `DEP-P02-12` *"reconciliation policy"* undefined; **not authored here** |
| **R-5** | Reconciliation must not invent identity, mapping or cardinality | **[ACCEPTED]** — P04 owns identity |

### 6.5 Reconciliation outputs — [DESIGN]

| Output | Class |
|---|---|
| A classified discrepancy record per overlapping comparison | **[DESIGN]**; shape **[IMPL]** |
| Propagated quality/completeness reflecting the reconciliation outcome | **[ACCEPTED]** vocabulary |
| **Reconciliation reports** | **[TRACKER]** — named evidence column |

### 6.6 Evidence / audit requirements — [TRACKER] + [OPEN]

**[TRACKER]** *Reconciliation tests* · *Reconciliation reports* · exit criterion *"Discrepancies
classified."*
🔴 **[OPEN]** Cannot be produced while no provider is selected; and the resolution policy (**R-4**)
is undefined.

### 6.7 Explicitly not established

⛔ **[IMPL]** Provider selection, provider execution, live integration, credential handling,
tolerance values, precedence tables, report format, storage.

---

## 7. `P07-04` — Degraded-state contract: contract basis

### 7.1 The four authoritative data conditions — [TRACKER]

**[TRACKER]** *"Define behavior for **missing, stale, partial and failed** data."* — a closed set of
four. Mapping onto the **[ACCEPTED]** vocabulary:

| Tracker condition **[TRACKER]** | Accepted expression **[ACCEPTED]** | Constraint |
|---|---|---|
| **missing** | `quality: 'unavailable'`; `fields` empty **only** in this case | `P01_FIELD_DICTIONARY.md:34` |
| **stale** | `quality: 'stale'` — derived by **P07-02** | `P01_FIELD_DICTIONARY.md:28` |
| **partial** | `quality: 'partial'` + `completenessPct < 100` | **Q-2** |
| **failed** | ⚠ **See 7.2 — this is the one condition with a genuine boundary question** | **Q-5** |

### 7.2 ⚠ The `failed` condition — a real boundary question, recorded not resolved

**[ACCEPTED]** **Q-5** states: *"A contract violation is **not** a quality state. A namespace
collision or structural invalidity is a **rejection**, not `quality: 'partial'`."*
**[ACCEPTED]** **P02** taxonomy classifies **E2/E3/E5/E6/E8** as **Rejections**, and only **E1** as a
**data condition** → `quality: 'unavailable'`.

So **`failed` splits**:

| Kind of failure | Expression | Class |
|---|---|---|
| **Provider genuinely cannot serve** (**E1**) | data condition → `quality: 'unavailable'` | **[ACCEPTED]** |
| **Authentication / entitlement / malformed / unsupported / mapping failure** (**E2, E3, E5, E6, E8**) | **REJECTION** — *not* a quality state | **[ACCEPTED]** via Q-5 + P02 taxonomy |

🔴 **[OPEN — AUTHORITY QUESTION]** Whether **P07-04's** "failed" is intended to cover **only** the
E1 data-condition case, or also to *describe* the rejection path for downstream consumers. **This
document does not resolve it**, because resolving it either narrows a **[TRACKER]** requirement or
risks contradicting **[ACCEPTED]** Q-5. **An authority decision is required.**

### 7.3 Exit criterion — [TRACKER]

**"Consumers receive explicit state."** Combined with **[ACCEPTED]** NFR-04 (*propagate to DTOs and
UI; never coerced or dropped*), the obligation is: **every consumer receives an explicit state, and
the state survives propagation.**

### 7.4 Preserved boundaries — unchanged by this act

| Workstream | Responsibility | Status |
|---|---|---|
| **P03** | Security / failure **disposition** — **DM-1** *"Security has no degraded mode"*, **DM-2** *"Degradation is a property of **data**, never of the **security decision**"* | ✅ **UNCHANGED** — `P03_FAILURE_AND_DEGRADED_MODE.md` remains **ACCEPTED** and is not rewritten |
| **P05** | Degraded-state **classification** at acquisition (`P00_GATE_MODEL.md:42`) | ✅ **UNCHANGED** |
| **P13** | Degraded-state **visibility** in the UI (`P00_GATE_MODEL.md:50`) | ✅ **UNCHANGED** |

**The P07-04 contract defines DATA-level state semantics consumed downstream.** It does not
re-author any of the three responsibilities above. **DM-2 is what makes this coherent**: P03 governs
the security decision, P07-04 governs the data state.

### 7.5 Downstream consumer — [TRACKER]

**`Work Tracker!P13-01`** *"Global data-state framework"* — *"All applicable surfaces expose loading,
empty, stale, unavailable and error states **from governed contracts**"* — declares a **Hard,
Critical** dependency **on `P07-04`**. **P07-04 is the producer; P13-01 is the consumer.** This is
the authoritative basis for the P07-04 ownership adjudication.

### 7.6 Entry criterion — [TRACKER]

**"DQ states defined."** ⚠ This depends on **P07-01** (rule categories and classification) and
**P07-02** (freshness derivation) — both **Hard** dependencies. **The entry criterion is therefore
not yet satisfiable**, and P07-04 must be sequenced last within P07.

### 7.7 Evidence required — [TRACKER]

**Negative tests** · **Degraded fixtures** · exit criterion *"Consumers receive explicit state."*

### 7.8 Explicitly not established

⛔ **[IMPL]** Runtime behaviour, state-machine implementation, fixture files, consumer APIs,
UI components, and the §7.2 resolution.

---

## 8. Dependency / sequencing reconciliation

**[TRACKER]** dependency hardness is **preserved exactly**; no "Hard" dependency is softened.

| Edge | Type | Current state | Consequence |
|---|---|---|---|
| `P06-01` → **P07-01** | **Hard** | ✅ **SATISFIED** — P06 ACCEPTED; `P06-01` normalization pipeline accepted (55 tests) | P07-01 entry criterion *"Canonical data exists"* **MET** |
| **P07-01** → **P07-02** | **Hard** | 🟠 **OPEN** — P07-01 NOT STARTED | P07-02 cannot start until P07-01 is stable |
| `P01-02` → **P07-02** | **Hard** | ✅ **SATISFIED** — P01 ACCEPTED; `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3 | Entry criterion *"Time semantics stable"* **MET** |
| **P07-01** → **P07-03** | **Hard** | 🟠 **OPEN** — P07-01 NOT STARTED | Sequenced after P07-01 |
| `P02-03` → **P07-03** | **Hard** | ⚠ **PARTIALLY SATISFIED** — rubric delivered, **no provider selected** (**DEP-P02-07**) | 🔴 Entry criterion *"Providers selected"* **UNMET** |
| **P07-01** + **P07-02** → **P07-04** | **Hard** | 🟠 **OPEN** — both NOT STARTED | Entry criterion *"DQ states defined"* **not yet satisfiable**; **P07-04 sequenced last** |
| **P07-04** → `P13-01` | **Hard**, Critical **YES** | ⛔ Downstream, **NOT STARTED** | P13-01 is **blocked** on P07-04 |

**Resulting intra-P07 sequence** (derived from **[TRACKER]** hardness, not chosen freely):

```
P07-01  →  P07-02  →  P07-04
   └─────→  P07-03  (additionally BLOCKED on provider selection)
```

| # | Recorded finding |
|---|---|
| **S-1** | 🔴 **P07-03 cannot satisfy its provider-selection entry criterion while provider selection remains unresolved.** Provider selection is an authority act with **no A-role assigned** (**DEP-P02-07**) and is outside D13's scope |
| **S-2** | **P07-01 is the single intra-phase prerequisite** for all three other work items — it is the only item whose entry criterion is already met |
| **S-3** | All four work items are **Critical Path = YES**, **Wave W5**, **WS-B Data Foundation**, and all carry *"Phase-gate dependency controls entry/exit; **no dependency bypass**"* |

---

## 9. Acceptance / authority boundary — recorded, nothing invented

| Authority | State | Source |
|---|---|---|
| **A3 P07 gate acceptor** | ⚠ **NOT DESIGNATED** | `docs/PROGRAM_STATE.md:249` — scope **`P05, P06`**, *"⚠ **P07–P17 NOT designated**"* |
| **A2** New-Program Certification Authority | ⚠ **UNKNOWN** | `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md:85` |
| **C7** certification authority | ⚠ **UNKNOWN** | `docs/d4/D4_11_CERTIFICATION_MATRIX.md:45` |
| **C8** certification authority | ⚠ **UNKNOWN** | `docs/d4/D4_11_CERTIFICATION_MATRIX.md:46` |
| `certification_status` | **`NONE_GRANTED`** | `docs/PROGRAM_STATE.md` |
| P07 certification prerequisite | **`YES` (C7, C8)** before progression | `docs/p00/P00_GATE_MODEL.md:44` |
| Formal P07 acceptance-criteria artifact | ⚠ **DOES NOT EXIST** | `docs/p07/` absent; 0 `P07*` files |

⚠ **The tracker's `Authority / Gate = Phase gate` column does NOT designate an individual acceptor
and does NOT grant certification.** `Phase Gates!P07` states the promotion rule explicitly:
*"Explicit gate acceptance; **no automatic promotion**."*

**No acceptance artifact is created by this act.** This record establishes the **contract basis
only**.

---

## 10. Implementation boundary

| May be established by this act | May NOT |
|---|---|
| ✅ Normative requirements drawn from the tracker | ⛔ `.js` / `.ts` source |
| ✅ Contract semantics and preserved boundaries | ⛔ Runtime behaviour |
| ✅ Proposed design choices, clearly tagged **[DESIGN]** | ⛔ Provider adapters or provider execution |
| ✅ Open decisions, clearly tagged **[OPEN]** | ⛔ Persistence or storage design |
| ✅ The acceptance evidence that will later be required | ⛔ Production wiring |
| | ⛔ UI changes |
| | ⛔ Tests for implementation behaviour |

**No implementation is permitted or performed by this act.** `P07 IMPLEMENTATION = NOT YET
PERMITTED` is unchanged.

---

## 11. Open items register — carried forward, none resolved by this act

| # | Open item | Class | Blocks |
|---|---|---|---|
| **O-1** | **Freshness/staleness threshold values undefined** | 🔴 **[OPEN]** | P07-02 exit criterion and its evidence |
| **O-2** | **Reconciliation resolution policy undefined** (precedence, tolerance, tie-breaking) | 🔴 **[OPEN]** | P07-03 exit criterion |
| **O-3** | **No provider selected** — **DEP-P02-07**, no A-role assigned | 🔴 **[OPEN]** | P07-03 entry criterion |
| **O-4** | **P07-04 `failed` condition boundary** vs **Q-5** / P02 rejection taxonomy (§7.2) | 🔴 **[OPEN — authority question]** | P07-04 scope precision |
| **O-5** | **A3 P07 acceptor NOT DESIGNATED** | ⚠ **[OPEN]** | P07 acceptance |
| **O-6** | **A2 / C7 / C8 UNKNOWN** | ⚠ **[OPEN]** | P07 certification and progression |
| **O-7** | **No formal P07 acceptance-criteria artifact** | ⚠ **[OPEN]** | P07 acceptance |
| **O-8** | **Rule-category detail** — the five categories are fixed; their per-domain rule sets are not | **[OPEN]** | P07-01 implementation |
| **O-9** | **Alerting/incident response** is **P17**, not P07 — boundary must hold during implementation | **[ACCEPTED]** MQ-2 | scope discipline |

---

## 12. What this document is not

| # | Statement |
|---|---|
| **N-1** | It is **not** an acceptance artifact and **not** approved acceptance criteria |
| **N-2** | It **performs no gate acceptance** — P07–P17 remain **NOT ACCEPTED**; `formal_gate_status` stays **7 of 18** |
| **N-3** | It **implements nothing** and creates no source, test, fixture or configuration |
| **N-4** | It **grants no certification**; `certification_status` stays **`NONE_GRANTED`** |
| **N-5** | It **designates no person** to any role |
| **N-6** | It **selects no provider** and **authorizes no provider or licensed execution** |
| **N-7** | It **authorizes no production activation** |
| **N-8** | It **authorizes no P08 or later phase** |
| **N-9** | It **creates no concessions register** |
| **N-10** | It **does not repair M-1, M-5, M-6 or AD-17** — **AD-17 remains `UNRESOLVED`** |
| **N-11** | It **touches no Existing-IIPS file** |
| **N-12** | It **rewrites no historical record** — P03, P05, P06, P13, D9–D13 and all six prior gate-acceptance records are unchanged |
| **N-13** | It **merges nothing** to `origin/main` |
| **N-14** | It **invents no threshold, rule ID, schema, API or data structure** as authoritative |

---

**D14 recorded. P07 CONTRACT BASIS = ESTABLISHED WITH OPEN AUTHORITY ITEMS.**
**Four work items contracted on authoritative tracker requirements: P07-01, P07-02, P07-03, P07-04.**
**Accepted P01/P02/P03/P05/P06/P13 boundaries preserved and cited, never rewritten.**
**P07 ENTRY = AUTHORIZED · CONTRACT/DESIGN = AUTHORIZED · IMPLEMENTATION = NOT YET PERMITTED ·**
**ACCEPTANCE = NOT ESTABLISHED · CERTIFICATION = NONE GRANTED.**
**Nine open items carried forward. No provider selected. No threshold invented. No acceptance granted.**
