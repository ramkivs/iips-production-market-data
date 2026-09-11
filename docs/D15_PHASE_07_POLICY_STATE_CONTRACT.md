# D15 — PHASE 07 (DATA QUALITY) POLICY & STATE CONTRACT DESIGN

> **Append-only design-decision record. Authorized by D13 §2 item 2 (design/reconciliation to
> establish the P07 implementation basis).**
> **THIS IS DESIGN ONLY.** It implements nothing: no `.js`, no `.ts`, no runtime change, no
> provider adapter, no persistence, no production wiring, no UI change, no tests.
> It **modifies no accepted P00–P06 artifact**, **no gate record**, **no historical decision-log
> entry**, and **does not rewrite D13 or D14**. It creates no new governance directory or register.
>
> **This is NOT an acceptance artifact, NOT approved acceptance criteria, and NOT implementation
> authorization.**

**Predecessors:** `docs/D13_PHASE_07_ENTRY_AUTHORIZATION.md` (`7fe5aaa…`) ·
`docs/D14_PHASE_07_CONTRACT_BASIS.md` (`a5720a4…`). **D14 is not rewritten**; this record adds the
policy and state-contract design layer on top of it.

---

## 0. Provenance legend

| Tag | Meaning | Authority |
|---|---|---|
| **[TRACKER]** | Verbatim requirement from the Program Tracker | **AUTHORITATIVE** |
| **[ACCEPTED]** | Existing accepted P00–P06 contract, boundary or invariant | **AUTHORITATIVE — preserved, never rewritten** |
| **[DESIGN]** | A design decision proposed by this document | ⚠ **NON-AUTHORITATIVE until an authority act adopts it** |
| **[OPEN]** | Undefined value or open authority question | ⚠ **UNRESOLVED — must not be filled by inference** |
| **[IMPL]** | Implementation detail deliberately not established | ⛔ **NOT YET AUTHORIZED** |

⚠ **No numerical threshold in this document is authoritative.** Every threshold appears as
**`OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD`**.
⚠ **No provider is named, selected or implied.** No new quality-state vocabulary is created.

### 0.1 Accepted vocabulary — preserved verbatim, closed

| Element | Value | Source |
|---|---|---|
| `quality` | **`good` \| `stale` \| `partial` \| `unavailable`** — **REQUIRED**, *"uses the existing enum **unchanged**"* | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:28`; **Q-1** `P01_DATA_CONTRACT.md:252` |
| `completenessPct` | **REQUIRED**, `0`–`100` inclusive | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:29` |
| `fields` | **REQUIRED** map; **empty only when `quality = 'unavailable'`** | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:34` |
| field-level `quality` | *"may only be **equal to or worse than** the snapshot-level value"* | **[ACCEPTED]** **Q-6**; `P01_FIELD_DICTIONARY.md:50` |
| **INV-7** | *"**Quality never coerced** (NFR-04): `quality` / `completenessPct` propagate"* | **[ACCEPTED]** `P01_DATA_CONTRACT.md:57` |

**🔒 This vocabulary is CLOSED. P07 introduces no fifth state, no new enum, and no parallel
vocabulary.**

---

## 1. P07-01 — Quality rule contract

### 1.1 Rule categories — [TRACKER], closed set

**[TRACKER]** *"Define completeness, validity, range, continuity and reconciliation checks."*
Five categories, authoritative and closed.

### 1.2 What P07 quality evaluation consumes

| Input | Class | Anchor |
|---|---|---|
| Canonical snapshot as produced by **P06** | **[ACCEPTED]** | Satisfies **[TRACKER]** entry criterion *"Canonical data exists"* |
| `quality`, `completenessPct`, `fields`, `asOf`, `receivedAt`, `mode`, `lineage` | **[ACCEPTED]** | Required P01 metadata |
| The applicable **contracted field set** for the snapshot's domain | **[DESIGN]** | Required to evaluate **Q-2**'s proportion; derivation not fixed here |
| Applicable **session/calendar baseline** | **[ACCEPTED]** | **Q-4**, **SE-3**, **VX-2** |

⚠ **P07 consumes; it does not re-derive identity, lineage or namespace** — those are owned by
P01/P04/P06 **[ACCEPTED]**.

### 1.3 What "quality classification" means — [DESIGN], bounded by [ACCEPTED]

**Classification is the act of determining which existing `quality` value correctly describes a
snapshot, together with the `completenessPct` that Q-2 requires.** It is:

| # | Rule | Class |
|---|---|---|
| **QC-1** | A **judgement about data**, never a mutation of it | **[DESIGN]**, constrained by **INV-7** |
| **QC-2** | Expressed **only** in the accepted enum — no new state | **[ACCEPTED]** **Q-1** |
| **QC-3** | **Deterministic** — identical inputs yield identical classification | **[DESIGN]**, required by **[TRACKER]** *"reproducible"* and `Phase Gates!P07` |
| **QC-4** | **Attributable** — the failing category is identifiable | **[TRACKER]** exit criterion *"Rules execute and classify failures"* |
| **QC-5** | **Monotone at field level** — a field override may only be equal or worse | **[ACCEPTED]** **Q-6** |

### 1.4 Treatment of each data condition — [DESIGN], mapped onto [ACCEPTED]

| Condition | Contract treatment | `quality` | `completenessPct` | `fields` | Class |
|---|---|---|---|---|---|
| **complete & current** | classify as sound | `good` | per **Q-2** | populated | **[DESIGN]** selection, **[ACCEPTED]** vocabulary |
| **missing** | data-condition; source genuinely has nothing | `unavailable` | per **Q-2** | **empty — permitted only here** | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:34` |
| **stale** | annotate, do **not** suppress | `stale` | per **Q-2** | populated | **[ACCEPTED]** vocabulary; derivation per §2 |
| **partial** | annotate with the true proportion | `partial` | **< 100**, per **Q-2** | populated | **[ACCEPTED]** **Q-2** |
| **failed (data condition)** | **E1** path only | `unavailable` | per **Q-2** | empty | **[ACCEPTED]** P02 §1.2, P03 §2 |

### 1.5 Completeness treatment — [ACCEPTED]

**Q-2** — *"`completenessPct` (0–100) must reflect the actual proportion of contracted fields
present."* **[DESIGN]** adds only that P07 must **verify** Q-2 rather than restate it: a
`completenessPct` inconsistent with the actual present-field proportion is itself a **completeness
rule failure**.

### 1.6 No-coercion boundary — [ACCEPTED], and it is the gate evidence

| # | Rule | Class | Source |
|---|---|---|---|
| **NC-1** | `quality` / `completenessPct` **propagate, never coerced or dropped** | **[ACCEPTED]** | **INV-7**, **Q-3**, **NFR-04** |
| **NC-2** | A rule may **not** fill, repair, substitute or drop a field to improve a classification | **[ACCEPTED]** | **RJ-6** *"substituting a default · dropping a field"* prohibited |
| **NC-3** | A **contract violation is not a quality state** | **[ACCEPTED]** | **Q-5** |
| **NC-4** | **Downgrading a rejection to `quality: 'partial'` is prohibited without exception** | **[ACCEPTED]** | **RJ-6**, verbatim |
| **NC-5** | P07 raises **no alert** and takes **no incident action** | **[ACCEPTED]** | **MQ-2** → **P17** |

⚠ The gate model's P07 minimum evidence *"…; **no coercion** proof"* is therefore **evidence of
compliance with INV-7 / Q-3 / RJ-6**, not a new obligation to define.

### 1.7 Evidence expected from quality evaluation

| Evidence | Class |
|---|---|
| **Rule tests** | **[TRACKER]** |
| **DQ evidence** | **[TRACKER]** |
| Exit criterion demonstrable: *"Rules execute and classify failures"* | **[TRACKER]** |
| A **no-coercion proof** traceable to **INV-7 / Q-3 / RJ-6** | **[ACCEPTED]** obligation |
| Per-category results for all five categories | **[DESIGN]** |
| ⛔ Rule-result **representation** | **[IMPL]** — deliberately open |

---

## 2. P07-02 — Freshness policy structure

### 2.1 Inputs and their semantics — [ACCEPTED]

| Input | Semantics | Source |
|---|---|---|
| **`asOf`** | The instant the data describes. The **reference point for data age** | **[ACCEPTED]** P01 required metadata |
| **`receivedAt`** | The instant the data was received. With `asOf` yields **delivery latency** | **[ACCEPTED]** **M-7** *"Age between `asOf` and `receivedAt` — the **input** to freshness"* |
| **venue session reference** | Supplies the **baseline for staleness** | **[ACCEPTED]** **SE-3**; **VX-2** |
| **completeness basis** | Whether the snapshot is contractually complete | **[ACCEPTED]** **Q-4**, **Q-2** |

**[ACCEPTED]** **BD-P05-01-08** confirms this is the whole input set: *"P05-01 supplies only the
inputs (`asOf`, `receivedAt`, venue session reference, completeness basis) as Q-4 requires."*

### 2.2 Threshold ownership — settled; the values are OPEN

| Statement | Class | Source |
|---|---|---|
| **P07 owns freshness thresholds** | **[ACCEPTED]** | **MQ-2**; **SE-3**; **VX-2**; **LA-10** (test-enforced) |
| **Upstream supplies inputs only** | **[ACCEPTED]** | **MQ-1** *"it sets **no thresholds, no SLOs, no alerts**"* |
| **Adapters set no thresholds** | **[ACCEPTED]** | **LA-10** *"an adapter sets no freshness thresholds; thresholds are P07"*; **LA-23**; **HA-30** |
| **Alerting / incident response is P17, not P07** | **[ACCEPTED]** | **MQ-2** |
| 🔴 **The threshold values themselves** | **[OPEN]** | `DEP-P01-05` *"Freshness **thresholds** undefined"*; `DEP-P02-12`; **F-7** |

> ### 🔴 `OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD`
> **No numerical freshness or staleness threshold is established by this document, and none exists
> in authoritative evidence.** The authoritative tracker contains **zero** numeric thresholds,
> zero SLOs and zero tolerance values.
>
> Each threshold, when eventually supplied, must state:
> **(a)** the **dimension** it governs (§2.3); **(b)** the **domain / instrument class / venue
> context** it applies to; **(c)** the **session/calendar baseline** it is measured against
> (**SE-3**); **(d)** the **authority act** that adopts it.
>
> **P01, P02 and P05 adapters may NOT define thresholds** — **[ACCEPTED]** MQ-1, LA-10, HA-30,
> and `P01_VALIDATION_RULES.md:135` (*"Thresholds, freshness computation and reconciliation are
> **P07**, not P01"*).

### 2.3 Freshness evaluation dimensions — [DESIGN]

| # | Dimension | Derived from | Class |
|---|---|---|---|
| **FD-1** | **Data age** — elapsed time relative to `asOf` | `asOf` + evaluation instant | **[DESIGN]** |
| **FD-2** | **Delivery latency** — `receivedAt` − `asOf` | both **[ACCEPTED]** | **[DESIGN]**, named by **M-7** |
| **FD-3** | **Session context** — whether `asOf` falls inside the referenced venue session | venue session reference **[ACCEPTED]** | **[DESIGN]**, required by **SE-3** |
| **FD-4** | **Completeness basis** — contractual completeness of the snapshot | **Q-2** **[ACCEPTED]** | **[DESIGN]**, required by **Q-4** |

⚠ **These four dimensions must not be collapsed into one.** Collapsing them destroys the
distinction **[TRACKER]** *"Calculate freshness"* depends on, and would make **FD-3** (a session
question) indistinguishable from **FD-1** (a clock question).

### 2.4 Relationship between freshness and quality — [DESIGN], bounded by [ACCEPTED]

**Freshness is an input to classification, not a parallel state system.**

| # | Rule | Class |
|---|---|---|
| **FQ-1** | Freshness evaluation **selects** an existing `quality` value; it never adds one | **[ACCEPTED]** **Q-1** |
| **FQ-2** | **Freshness is derived** — it is computed, not asserted by the source | **[ACCEPTED]** **Q-4** |
| **FQ-3** | A stale classification **annotates**; it does not suppress the data | **[DESIGN]**, constrained by **INV-7** |
| **FQ-4** | `receivedAt` is **never recomputed** by freshness evaluation | **[ACCEPTED]** **HA-30/HA-31** |
| **FQ-5** | A **negative age** (an `asOf` in the future) is **non-conforming**, not "fresh" | **[ACCEPTED]** `P05_02_SPECIFICATION.md:319` |

### 2.5 Stale determination contract — [DESIGN] + 🔴 [OPEN]

**A snapshot is `stale` when its age on a governing dimension exceeds the applicable threshold for
its domain and session context.**

| Element | Class |
|---|---|
| The **concept** | **[DESIGN]** |
| The **output state** `stale` | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:28` |
| The **threshold value** | 🔴 **`OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD`** |
| The **governing dimension** per domain | 🔴 **[OPEN]** — depends on the per-domain rule sets (§6) |

⚠ **[ACCEPTED]** `P02_ERROR_TAXONOMY.md:60`: *"Provider returned data older than the
session/freshness baseline | **Not an error** | `quality: 'stale'` (thresholds are **P07**)."*
**Staleness is not an error class** — it is a data condition.

### 2.6 Unavailable determination contract — [ACCEPTED]

| Rule | Class |
|---|---|
| `unavailable` arises from **E1** `PROVIDER_UNAVAILABLE` — the **only** quality-bearing class | **[ACCEPTED]** P02 §1.2 |
| **E4** (transient) and **E7** (rate limit) **"may degrade to E1 under policy"** — the accepted path by which a failure becomes a data condition | **[ACCEPTED]** `P02_ERROR_TAXONOMY.md:20,23` |
| `fields` may be empty **only** under `unavailable` | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:34` |
| **Freshness evaluation does not itself produce `unavailable`** — unavailability is a source condition, not an age judgement | **[DESIGN]** |

### 2.7 Reproducibility requirements — [TRACKER] + [DESIGN]

**[TRACKER]** exit criterion: *"Freshness state **reproducible**."*

| # | Rule | Class |
|---|---|---|
| **RP-1** | Identical inputs yield an identical freshness state | **[DESIGN]**, required by **[TRACKER]** |
| **RP-2** | The evaluation instant is an **explicit input**, never an implicit "now" | **[DESIGN]** — without this, RP-1 is unachievable |
| **RP-3** | The threshold set applied is **identified** in the evidence | **[DESIGN]** |
| 🔴 **RP-4** | Reproducibility **cannot be evidenced while thresholds are undefined** | **[OPEN]** — blocked on §2.2 |

### 2.8 Consumer-facing state expectations

| # | Rule | Class |
|---|---|---|
| **CS-1** | Freshness state is **always explicit** | **[TRACKER]** *"explicit stale/unavailable states"* |
| **CS-2** | It **propagates** to DTOs and UI, never coerced or dropped | **[ACCEPTED]** **Q-3**, **NFR-04** |
| **CS-3** | P07 emits **no alert** | **[ACCEPTED]** **MQ-2** → **P17** |

### 2.9 Evidence required to prove threshold application

| Evidence | Class |
|---|---|
| **Time/freshness tests** · **Freshness evidence** | **[TRACKER]** |
| The **threshold set** applied, with its adopting authority act | **[DESIGN]** + 🔴 **[OPEN]** |
| Reproducibility demonstration (RP-1…RP-3) | **[DESIGN]** |
| Proof that **no adapter set a threshold** | **[ACCEPTED]** — **LA-10**, **HA-30**, test-enforced |

---

## 3. P07-03 — Reconciliation policy (provider-neutral)

### 3.1 Hard constraints preserved — [ACCEPTED], non-negotiable

| Constraint | Verbatim | Source |
|---|---|---|
| **RJ-6** | *"**Prohibited without exception:** silent overwrite · precedence rules · 'last wins' · dropping a field · substituting a default · **downgrading a rejection to `quality: 'partial'`**"* | `P01_VALIDATION_RULES.md:122` |
| **C5** | *"**Fail-closed.** Any C1–C4 violation **aborts the execution**. No partial merge, **no precedence**, no coercion, no warning-and-continue"* | `P01_VALIDATION_RULES.md:50`; **ADR-01 §C.2** |
| **PN-5** | *"two providers asserting the same instrument produce [two canonical identities] … never a silent merge"* | `P04_CANONICAL_SECURITY_MODEL.md` via `P06_03_EVIDENCE.md:58` |
| **RI-3** | *"provider identity is **never** [flattened]"* | `P01_IDENTITY_AND_LINEAGE.md` via `P06_03_EVIDENCE.md:60` |
| **L-2** | Cross-provider distinctness is **structural** — the provider is a component of `snapshotId` (**AD-6**) | `P06_03_EVIDENCE.md:203` |

⚠ **The existing `classificationPrecedence` is the error-class gate order `E6 → E3 → E2 → E1`
(LA-4), which reproduces an existing order rather than inventing one. It MUST NOT be repurposed as
value-reconciliation precedence.** Doing so would violate **RJ-6** and **C5**.

### 3.2 Reconciliation inputs — [DESIGN], provider-neutral

| Input | Class |
|---|---|
| Two or more canonical snapshots covering an **overlapping** identifier/scope | **[DESIGN]**, per **[TRACKER]** *"overlapping"* |
| The accepted canonical field set and namespace (P01/P06) | **[ACCEPTED]** |
| Lineage sufficient to attribute each value to its **abstract** provider identity | **[ACCEPTED]** — P01 lineage, **RI-3** |

⚠ **No provider is named.** The contract is expressed over abstract provider identities only.

### 3.3 Comparison identity — [DESIGN], bounded by [ACCEPTED]

| # | Rule | Class |
|---|---|---|
| **ID-1** | Comparison is over the **accepted canonical identity** — P04 owns identity; P07 does not re-derive it | **[ACCEPTED]** |
| **ID-2** | Two snapshots from different providers are **distinct records**, never one | **[ACCEPTED]** **PN-5**, **RI-3**, **L-2** |
| **ID-3** | Reconciliation **compares across** distinct records; it **does not merge** them | **[DESIGN]**, mandated by **PN-5** |

### 3.4 Comparison dimensions — [DESIGN]

| # | Dimension |
|---|---|
| **CD-1** | Field-value equality / difference for overlapping namespaced keys |
| **CD-2** | `asOf` alignment — whether the compared snapshots describe the same instant |
| **CD-3** | `completenessPct` difference |
| **CD-4** | `quality` difference |
| **CD-5** | Lineage/version difference (`dataVersion`) |

⚠ **No tolerance value is defined.** Any numeric tolerance is
🔴 **`OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD`**.

### 3.5 Discrepancy detection and classification — [DESIGN]

**[TRACKER]** exit criterion: *"**Discrepancies classified**."*

| # | Rule | Class |
|---|---|---|
| **DC-1** | A discrepancy is **classified, never silently resolved** | **[TRACKER]** |
| **DC-2** | Classification names the **dimension** (CD-1…CD-5) and the **records** involved | **[DESIGN]** |
| **DC-3** | A discrepancy is **not** a contract violation — **Q-5** keeps the categories distinct | **[ACCEPTED]** |
| **DC-4** | Reconciliation **never coerces** a value to make sources agree | **[ACCEPTED]** **INV-7**, **RJ-6**, **C5** |
| **DC-5** | ⚠ **NO precedence-based value collapse. NO "last wins". NO silent overwrite. Cross-provider records are NOT collapsed.** | **[ACCEPTED]** **RJ-6**, **C5**, **PN-5** |
| **DC-6** | Reconciliation must not invent identity, mapping or cardinality | **[ACCEPTED]** — **P04** owns identity |
| 🔴 **DC-7** | The **resolution policy** — how a classified discrepancy is dispositioned | **[OPEN]** — `DEP-P02-12`; must be authored without violating DC-5 |

### 3.6 Consumer-visible result — [DESIGN], bounded by [ACCEPTED]

| # | Rule | Class |
|---|---|---|
| **CR-1** | Consumers see **both** records and the classification — never a silently merged value | **[DESIGN]**, mandated by **PN-5** |
| **CR-2** | Quality/completeness propagate unchanged through reconciliation | **[ACCEPTED]** **Q-3**, **INV-7** |
| **CR-3** | Reconciliation introduces **no new quality state** | **[ACCEPTED]** **Q-1** |

### 3.7 Evidence / audit expectations — [TRACKER]

**Reconciliation tests** · **Reconciliation reports** · exit criterion *"Discrepancies classified."*
**[DESIGN]** adds: the report must identify the compared record identities, the dimension, and the
classification — sufficient for audit without disclosing provider internals.

### 3.8 Unresolved discrepancy handling — [DESIGN]

| # | Rule | Class |
|---|---|---|
| **UR-1** | An unresolved discrepancy **remains visible**, annotated as unresolved | **[DESIGN]** |
| **UR-2** | It is **not** resolved by precedence, coercion or dropping a record | **[ACCEPTED]** **RJ-6**, **C5** |
| **UR-3** | It does **not** raise an alert — that is **P17** | **[ACCEPTED]** **MQ-2** |

### 3.9 🔴 P07-03 CANNOT START — provider selection OPEN

| Item | Class | Source |
|---|---|---|
| **[TRACKER]** entry criterion | **"Providers selected"** | |
| Current state | 🔴 **UNMET** | |
| Rubric | **[ACCEPTED]** *"Rubric **delivered**; no candidate evaluated or selected"* | `P02_DEPENDENCY_REGISTER.md:50` |
| Authority | **[ACCEPTED]** **DEP-P02-07** — *"**No provider-selection authority is recorded** … Selection is an authority act; **no A-role is assigned to it**"* | |
| Related | **[ACCEPTED]** **DEP-P02-10** — entitlement matrix **EMPTY**, *"empty is the correct state"*; **INV-10** | |

> 🔴 **O-3 REMAINS OPEN.** **No provider is selected, evaluated, named or implied by this document,
> and none may be inferred.** **P07-03 implementation cannot begin**, and its acceptance cannot be
> reached, until provider selection occurs by a **separate authority act**. The **contract** above is
> authored so that it will not need rewriting when that act occurs — it is provider-neutral by
> construction.

---

## 4. P07-04 — Data-level degraded-state contract

### 4.1 Normative mapping — [DESIGN] onto [ACCEPTED], using the resolved O-4 adjudication

**[TRACKER]** *"Define behavior for missing, stale, partial and failed data."* — a closed set of
four. **O-4 is resolved: `failed` is data-condition semantics only.**

| Tracker condition | `quality` | Snapshot | `fields` | `completenessPct` | Class |
|---|---|---|---|---|---|
| **missing** | **`unavailable`** | **Yes** | **empty — the only permitted case** | per **Q-2** | **[ACCEPTED]** P03 §2; `P01_FIELD_DICTIONARY.md:34` |
| **stale** | **`stale`** | **Yes** | populated | per **Q-2** | **[ACCEPTED]** vocabulary; derived per §2 |
| **partial** | **`partial`** | **Yes** | populated | **< 100** | **[ACCEPTED]** **Q-2**; incl. **E3 partial** |
| **failed (data condition)** | **`unavailable`** | **Yes** | empty | per **Q-2** | **[ACCEPTED]** **E1**, incl. **E4/E7 → E1** |

**🔒 No fifth quality state is created. The enum is unchanged (Q-1).**

### 4.2 Boundaries preserved — [ACCEPTED], non-negotiable

| Constraint | Verbatim | Consequence for P07-04 |
|---|---|---|
| **Q-5** | *"A contract violation is **not** a quality state"* | Rejections are **never** expressed as quality states |
| **P02 §1.2** | *"E2–E8 describe **us, the request, or the contract** — none is a statement about market data, so **none may be expressed as a quality value**"* | P07-04 covers **E1 only** |
| **P03 §2** | *"**E1 remains the only quality-bearing condition in the entire chain.**"* | Every rejection path yields **Snapshot = No, Quality = —** |
| **CV-4** | *"A denial is **never** presented as a data-quality problem — that would misattribute the cause to the provider"* | 🔒 **P07-04 must not present a denial as a data-quality state** |
| **DM-1 / DM-2** | *"Security has no degraded mode"* · *"Degradation is a property of **data**, never of the **security decision**"* | **P03 is unchanged**; DM-2 is what makes the P03/P07 boundary coherent |
| **RJ-6** | *"downgrading a rejection to `quality: 'partial'`"* — prohibited without exception | 🔒 No rejection→partial downgrade |
| **E4/E7 → E1** | *"may degrade to E1 under policy"* | The **already-accepted** failure→data-condition path |

⚠ **A provider / request / contract denial is NOT a data-quality state and must not be presented as
one.** Where a rejection occurs there is **no snapshot**, so there is no object for P07-04 to
annotate; the consumer receives an **honest denial class** under **P03 CV-1**, not a quality value.

### 4.3 Snapshot / data availability semantics — [ACCEPTED]

| Rule | Class |
|---|---|
| A snapshot **exists** for every data condition P07-04 covers | **[ACCEPTED]** P03 §2 |
| A snapshot **does not exist** for any rejection | **[ACCEPTED]** P03 §2 |
| `fields` is empty **only** under `unavailable` | **[ACCEPTED]** `P01_FIELD_DICTIONARY.md:34` |

### 4.4 Completeness relationship — [ACCEPTED]

| Condition | `completenessPct` |
|---|---|
| `partial` | **< 100**, reflecting the true proportion (**Q-2**) |
| `unavailable` | per **Q-2** with an empty field set |
| `stale` / `good` | per **Q-2** |

⚠ **`completenessPct` and `quality` are independent axes.** A snapshot may be `stale` and complete,
or `good`-aged and `partial`. **P07 must not conflate them** **[DESIGN]**.

### 4.5 State transition / boundary semantics — [DESIGN], at contract level

| # | Rule | Class |
|---|---|---|
| **ST-1** | Transitions occur **only between existing enum values** | **[ACCEPTED]** **Q-1** |
| **ST-2** | Field-level state may only be **equal or worse** than snapshot-level | **[ACCEPTED]** **Q-6** |
| **ST-3** | A transition **annotates**; it never mutates, fills or drops a field | **[ACCEPTED]** **INV-7**, **RJ-6** |
| **ST-4** | Transitions are **deterministic** and reproducible | **[DESIGN]** |
| **ST-5** | ⛔ A **state machine implementation** | **[IMPL]** — not established |

### 4.6 Negative cases the contract must satisfy — [DESIGN], each traceable to [ACCEPTED]

| # | Negative case | Forbidden because |
|---|---|---|
| **NEG-1** | Presenting an authentication or entitlement denial (**E2/E3**) as `unavailable` or `partial` | **CV-4**, **Q-5**, **P02 §1.2** |
| **NEG-2** | Presenting a malformed response (**E5**) or mapping failure (**E8**) as a quality state | **P02 §1.2**, **Q-5** |
| **NEG-3** | Downgrading a rejection to `quality: 'partial'` | **RJ-6**, verbatim |
| **NEG-4** | Populating `fields` while `quality = 'good'` but the source is unavailable | `P01_FIELD_DICTIONARY.md:34` |
| **NEG-5** | Emptying `fields` under any state other than `unavailable` | `P01_FIELD_DICTIONARY.md:34` |
| **NEG-6** | Coercing or dropping `quality`/`completenessPct` during propagation | **INV-7**, **Q-3**, **NFR-04** |
| **NEG-7** | Introducing a fifth quality value | **Q-1** |
| **NEG-8** | Raising an alert from P07 | **MQ-2** → **P17** |
| **NEG-9** | Treating a **negative age** as fresh | `P05_02_SPECIFICATION.md:319` |

### 4.7 Evidence required — [TRACKER]

**Negative tests** · **Degraded fixtures** · exit criterion *"Consumers receive explicit state."*
⛔ The fixtures themselves are **[IMPL]** and are not created by this act.

### 4.8 Preserved workstream responsibilities — all UNCHANGED

| Workstream | Responsibility | Status |
|---|---|---|
| **P03** | Security / failure **disposition** (DM-1, DM-2, CV-1…CV-5) | ✅ **UNCHANGED** — accepted record not rewritten |
| **P05** | Degraded-state **classification** at acquisition | ✅ **UNCHANGED** |
| **P13** | Degraded-state **visibility** in the UI | ✅ **UNCHANGED** |

**P07-04 defines the DATA-level state semantics those workstreams consume.** It re-authors none of
them.

---

## 5. Sequencing — [TRACKER] Hard dependencies preserved exactly

| Edge | Type | State | Consequence |
|---|---|---|---|
| `P06-01` → **P07-01** | **Hard** | ✅ **SATISFIED** | Entry *"Canonical data exists"* **MET** |
| `P01-02` → **P07-02** | **Hard** | ✅ **SATISFIED** | Entry *"Time semantics stable"* **MET** |
| **P07-01** → **P07-02** | **Hard** | 🟠 **OPEN** | P07-02 waits on P07-01 |
| **P07-01** → **P07-03** | **Hard** | 🟠 **OPEN** | P07-03 waits on P07-01 |
| `P02-03` → **P07-03** | **Hard** | 🔴 **PARTIAL** — rubric delivered, no provider selected | Entry *"Providers selected"* **UNMET** |
| **P07-01 + P07-02** → **P07-04** | **Hard** | 🟠 **OPEN** | Entry *"DQ states defined"* not yet satisfiable → **P07-04 last** |
| **P07-04** → `P13-01` | **Hard**, **Critical YES** | ⛔ downstream | **P13-01 blocked on P07-04** |

```
P07-01  →  P07-02  →  P07-04  →  (P13-01, Hard/Critical)
   └─────→  P07-03   🔴 additionally BLOCKED on O-3 provider selection
```

⚠ **Designing a contract does not make a work item implementation-ready.** All four remain
**Status = NOT STARTED** in the tracker, all are **Critical Path = YES**, and the tracker states for
each: *"Phase-gate dependency controls entry/exit; **no dependency bypass**."*

---

## 6. Per-domain rule sets — design framework only; rules remain OPEN

**Current state: per-domain P07 quality rules are ABSENT** (0 for every domain D01…D09). **No domain
rule is invented by this document.** What follows is the framework by which they would later be
supplied.

| Element | Contract requirement | Class |
|---|---|---|
| **Rule ownership** | A domain rule set has a **named owner** and an **adopting authority act** | **[DESIGN]** |
| **Domain applicability** | Each rule declares the **domain(s)** and **instrument class(es)** it applies to; a rule with no declared applicability is invalid | **[DESIGN]** |
| **Category conformance** | Every rule belongs to exactly one of the five **[TRACKER]** categories | **[TRACKER]** |
| **Vocabulary conformance** | Every rule outputs only existing `quality` values and a `completenessPct` | **[ACCEPTED]** **Q-1**, **Q-2** |
| **Threshold declaration** | Any threshold a rule uses is declared as **`OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD`** until an authority act adopts it | **[DESIGN]** + 🔴 **[OPEN]** |
| **Required evidence** | Per-domain **rule tests** + **DQ evidence**, traceable to the rule | **[TRACKER]** |
| **Versioning / change control** | A rule set is **versioned**; a change is a **new version**, never a silent edit — consistent with **INV-2** (*"a correction is a NEW `dataVersion`"*) | **[DESIGN]**, aligned to **[ACCEPTED]** INV-2 |
| **Acceptance evidence** | Adopting a rule set requires the same evidence discipline as any other P07 artifact | **[DESIGN]** |
| 🔴 **The rules themselves** | **OPEN — not authored here** | **[OPEN]** |

---

## 7. Open items that MUST remain open

**None is closed by the existence of this design document.**

| # | Open item | State | Blocks |
|---|---|---|---|
| **O-1** | Freshness/staleness **threshold values** | 🔴 **OPEN** — `OPEN / AUTHORITY-REQUIRED / DOMAIN-SPECIFIC THRESHOLD` | P07-02 exit criterion, RP-4 |
| **O-2** | Reconciliation **resolution policy** (DC-7) | 🔴 **OPEN** — the *contract* is designed; the resolution policy is not, and must satisfy DC-5 | P07-03 exit criterion |
| **O-3** | **Provider selection** — no A-role assigned (**DEP-P02-07**) | 🔴 **OPEN** | P07-03 entry criterion; implementation cannot start |
| **O-5** | **A3 P07 acceptor** | ⚠ **NOT DESIGNATED** — scope `P05, P06` | P07 acceptance |
| **O-6** | **A2** certification authority | ⚠ **UNKNOWN** | Certification |
| **O-7** | **C7** certification authority | ⚠ **UNKNOWN** | Progression (cert required) |
| **O-8** | **C8** certification authority | ⚠ **UNKNOWN** | Progression (cert required) |
| **O-9** | Formal **P07 acceptance-criteria artifact** | 🔴 **ABSENT** | P07 acceptance |
| **O-4** | `failed` boundary | ✅ **RESOLVED** — data-condition semantics only | — |
| **D-1** | Per-domain rule sets | 🔴 **OPEN** — framework only | P07-01 implementation |

⚠ **No person is designated, and no authority is assigned, by this document.** A2/C7/C8 remain
`UNKNOWN`; the A3 P07 acceptor remains **NOT DESIGNATED**. Nothing is inferred from role, prior
participation or conversational context.

---

## 8. Boundary record — MQ-2 / P17

**[ACCEPTED]** **MQ-2** — *"Freshness thresholds are **P07**; **alerting and incident response are
P17**."*

| Owned by P07 | Owned by P17 |
|---|---|
| Freshness thresholds | Alerting |
| Freshness/staleness classification | Incident response |
| Discrepancy classification | Operational escalation |

**This boundary is unchanged and is not moved by this document.**

---

## 9. What this document is not

| # | Statement |
|---|---|
| **N-1** | It is **not** an acceptance artifact and **not** approved acceptance criteria |
| **N-2** | It **performs no gate acceptance** — P07–P17 remain **NOT ACCEPTED**; gate count stays **7 of 18** |
| **N-3** | It **implements nothing** — no `.js`/`.ts`, no runtime, no provider adapter, no persistence, no production wiring, no UI, no tests |
| **N-4** | It **grants no certification**; `certification_status` stays **`NONE_GRANTED`** |
| **N-5** | It **designates no person** to any role |
| **N-6** | It **selects no provider** and **authorizes no provider or licensed execution** |
| **N-7** | It **authorizes no production activation** |
| **N-8** | It **authorizes no P08 or later phase** |
| **N-9** | It **creates no concessions register** |
| **N-10** | It **does not repair M-1, M-5, M-6 or AD-17** — **AD-17 remains `UNRESOLVED`** |
| **N-11** | It **touches no Existing-IIPS file** |
| **N-12** | It **rewrites nothing** — D13, D14, P03, P05, P06, P13, D9–D12 and all six prior gate-acceptance records are unchanged |
| **N-13** | It **merges nothing** to `origin/main` |
| **N-14** | It **invents no threshold value, no rule ID, no quality state, no schema, no API and no provider** |
| **N-15** | It **does not make P07-03 implementable** — O-3 remains open |

---

**D15 recorded. P07 POLICY / STATE CONTRACT DESIGN = ESTABLISHED WITH OPEN ITEMS.**
**Quality-rule contract, freshness policy structure, provider-neutral reconciliation contract and
data-level degraded-state contract are designed at contract level.**
**Accepted P01/P02/P03/P04/P05/P06 vocabulary and boundaries preserved verbatim — the `quality` enum
is unchanged and no fifth state exists.**
**No threshold value invented. No provider selected. No person designated. No acceptance granted.**
**P07 ENTRY = AUTHORIZED · CONTRACT/DESIGN = AUTHORIZED · POLICY/STATE DESIGN = DESIGN ACT ONLY ·**
**IMPLEMENTATION = NOT YET PERMITTED · P07-03 = BLOCKED ON O-3 · ACCEPTANCE = NOT ESTABLISHED ·
CERTIFICATION = NONE GRANTED.**
