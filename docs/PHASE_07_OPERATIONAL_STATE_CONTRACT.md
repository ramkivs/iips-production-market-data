# PHASE 07 — SYSTEM OPERATIONAL-STATE CONTRACT (ACT 3)

> **ACT TYPE:** **Contract authoring** — Act 3 of the six acts recorded by
> `PHASE_07_THRESHOLD_CONTRACT_RESOLUTION.md`. **NO IMPLEMENTATION.**
> **BASIS:** the Act 3 design decision — a **standalone, Program-Authority-owned, system-level**
> operational-state contract; **P17 owns operationalization, not definition**; **P07-04 excluded**;
> **DM-1/DM-2 preserved**; **no invented metric**.
> ⚠ **EVERY STATE DEFINITION BELOW IS DERIVED FROM A CONDITION THE CORPUS ALREADY NAMES.** No state
> is invented, and **no numeric value of any kind is assigned to any state**.
> **Append-only. Edits nothing.**

---

## 0. Boundary

| | |
|---|---|
| **P01** | ⛔ **NOT MODIFIED** — remains ACCEPTED and unamended; **five times, no T6** |
| **P07 IMPLEMENTATION** | ⛔ **NOT YET PERMITTED** |
| **P07 ACCEPTANCE** | **NOT ESTABLISHED** |
| **P07 CERTIFICATION** | **NONE GRANTED** |
| **D01 15-minute threshold** | **NOT ADOPTED** — this contract does not adopt it |
| **Duration units (UN-2)** | **NOT established** — Act 2 unexecuted |

---

## 1. The system operational states

**Source of the state set:** **NFR-09** names the conditions exhaustively for this purpose —
*"Degraded operation: **Provider outage, stale feed and partial dataset** conditions have explicit
backend/UI behavior."* The state set is those three conditions plus their absence. **Nothing is
added.**

| State | Condition it denotes | Corpus basis |
|---|---|---|
| **OS-0 `NORMAL`** | **No NFR-09 condition is present** | The baseline; the condition the business requirement calls *"normal operating conditions"* |
| **OS-1 `PROVIDER_OUTAGE`** | **"Provider outage"** — the source is unreachable, down or refusing service | **NFR-09** · **E1** `PROVIDER_UNAVAILABLE` *"Source unreachable, down, or refusing service"* · **E4**/**E7** *"may degrade to E1"* |
| **OS-2 `STALE_FEED`** | **"stale feed"** — the feed is delivering data older than its baseline | **NFR-09** · **NFR-03** *"stale data never silently appears current"* · `quality: 'stale'` |
| **OS-3 `PARTIAL_DATASET`** | **"partial dataset"** — the contracted dataset is incompletely present | **NFR-09** · `quality: 'partial'` + `WITHHELD` (`P03` §4) |

⚠ **These are SYSTEM conditions, not data classifications.** They describe the state of the
delivering system; §3 governs how they relate to data quality.

---

## 2. What a state IS and IS NOT

| A state **IS** | A state **IS NOT** |
|---|---|
| A **named system condition** with defined backend/UI behaviour (**NFR-09**) | ❌ a numeric target or threshold |
| A **qualitative** classification of the delivering system | ❌ an uptime percentage |
| A trigger for **explicit** behaviour rather than silent coercion (**NFR-04**) | ❌ a percentile (p50/p95/p99) |
| Recordable in evidence as a **label** | ❌ an SLO or SLA |
| | ❌ an error budget |
| | ❌ any availability figure |

> ### 🔴 **NO NUMERIC VALUE IS ASSIGNED TO ANY STATE BY THIS CONTRACT**
> Assigning one would require explicit authority. **None has been given, so none is recorded.**
> The corpus contains **0** occurrences of percentile / SLO / SLA / uptime / error budget.

---

## 3. Relationship to data quality — **DM-1 and DM-2 PRESERVED**

| Rule | Verbatim | Consequence for this contract |
|---|---|---|
| **DM-1** | *"**Security has no degraded mode.** It is established or it is not"* | **No OS state modifies, relaxes or substitutes for a security decision.** There is no `OS-*` that permits serving data when authentication is not established |
| **DM-2** | *"Degradation is a property of **data**, never of the **security decision**"* | An OS state describes a **system condition that may cause** a data-quality value. It **never replaces** one and **never** is a security state |
| **Q-1** | *"`quality` uses the existing enum unchanged: `good` \| `stale` \| `partial` \| `unavailable`"* | **UNCHANGED.** No OS state adds, removes or renames a quality value |
| **INV-7** | *"Quality never coerced"* | An OS state **never** coerces a quality value |

### 3.1 Indicative correspondence — **not** a coercion rule

| System state | Data-quality value that typically results | Mechanism |
|---|---|---|
| **OS-1 `PROVIDER_OUTAGE`** | `unavailable` | **E1** → *"Data condition → `quality: 'unavailable'`"* |
| **OS-2 `STALE_FEED`** | `stale` | *"Provider returned data older than the session/freshness baseline | Not an error | `quality: 'stale'`"* |
| **OS-3 `PARTIAL_DATASET`** | `partial` | `quality: 'partial'` + `WITHHELD` |

⚠ **This is correspondence, not derivation.** The `quality` value is still produced by the
**data-plane** classification path (**S5** *"CLASSIFY (degraded state, not rejection)"*), never by
reading the OS state. **Staleness remains "not an error class — it is a data condition."**

⚠ **Prohibited, unchanged from `P03` §4:** downgrading a security denial to a quality value ·
serving unentitled data because a check failed · ignoring tenancy because resolution failed ·
continuing with a warning.

---

## 4. What *"normal operating conditions"* means for the D01 threshold

> **The D01 freshness threshold applies in `OS-0 NORMAL`.** In **OS-1 / OS-2 / OS-3** its
> applicability is governed by the degraded behaviour defined for those states.

⚠ **This contract does NOT adopt the 15-minute threshold, does not fix its value, and does not
establish its effective date.** It only fixes **which system state the phrase refers to**. The
**specific degraded behaviour per state remains `OPEN`** — it is **P07-04**'s requirement (*"Define
behavior for missing, stale, partial and failed data"*, status **NOT STARTED**), and **P07-04 is not
started because P07 implementation is not permitted.**

---

## 5. Ownership

| Concern | Owner | Status |
|---|---|---|
| **Definition** of the operational states | **This contract** — Program Authority | ✅ **authored** |
| **Acceptance** of this contract | Program Authority — **a separate acceptance act** | 🔴 **NOT ACCEPTED** |
| **Operationalization** — monitoring, incident handling, provider failover / staleness controls | **P17** | 🔴 **cannot start** — P17 has **no work items** (Work Tracker covers **P00–P13 only**); **Act 4** required first; P17's roadmap dependencies are **P15, P16** |
| **Data-side consequence** (`stale` / `partial` / `unavailable` on a datum) | **P07-04** | 🔴 **NOT STARTED** |
| **UI behaviour per state** | **P13-01** — *"expose loading, empty, stale, unavailable and error states"* | 🔴 **NOT STARTED** (Hard deps **P07-04**, **P12-03**) |

⚠ **P07-04 does NOT own the system operational state.** It governs **data-quality states**. The
exclusion recorded by `PHASE_07_THRESHOLD_CONTRACT_RESOLUTION.md` §3.2 stands.

---

## 6. OPEN — requires authority input

| # | Open item | Why it is open |
|---|---|---|
| **OS-O1** | **State transition criteria** — when the system enters/leaves each state | Any criterion would be **numeric**, and **no numeric operational metric is authorized**. 🔴 **OPEN** |
| **OS-O2** | **Detection mechanism** | **P17** operationalization; P17 not decomposed (**Act 4**) |
| **OS-O3** | Whether states beyond NFR-09's three exist | NFR-09 names three; **adding more would be invention**. 🔴 **OPEN** |
| **OS-O4** | Whether the OS state is recorded in snapshot/execution **evidence** | Interacts with **RP-3** and the replay-identity rules; undecided |
| **OS-O5** | Per-state **degraded behaviour** | **P07-04** — **NOT STARTED** |

---

## 7. STATUS

> # 🟡 **ACT 3 = B — DRAFTED, NOT ACCEPTED**
>
> The contract is **authored** and every state is **evidence-grounded**, but it is **not an accepted
> contract** — acceptance is a separate authority act, and **OS-O1…OS-O5 remain OPEN**. It therefore
> **does not discharge the operational-condition blocker** on the D01 threshold.

| Item | Status |
|---|---|
| **Act 1** T6 evaluation instant | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged — P01 unamended)* |
| **Act 2** duration units | 🟡 **B — DECIDED, NOT ESTABLISHED** *(unchanged — **UN-2 unsatisfied**)* |
| **Act 3** operational state | 🟡 **B — DRAFTED, NOT ACCEPTED** *(advanced from "decided" to "drafted"; still not established)* |
| **Act 4** P17 tracker | 🟡 **B** *(unchanged)* |
| **Act 5** D3 value adoption | 🔴 **blocked** on Acts 1–3 |
| **Act 6** 5-second ownership | 🔴 **OPEN — requires an explicit Program Authority decision** |

> # 🟡 **D3 = B — PARTIALLY READY** *(unchanged)*
> Drafting this contract does **not** advance D3's readiness: **UN-2 remains unsatisfied**, the
> contract is **not accepted**, and the **effective date** and **threshold-set identity/version**
> remain unsupplied. **D3 is NOT RESOLVED.**

> # 🔴 **O-1 = OPEN — 4 OF 5 RESOLVED · D3 NOT RESOLVED** *(unchanged)*
> **No partial closure.** **RP-4 stands**; P07-02's exit *"Freshness state reproducible"* remains
> **unevidenceable**. **No Hard dependency weakened, relaxed or reordered; no tracker status altered.**

> # ⛔ **IMPLEMENTATION = NOT YET PERMITTED** *(unchanged)*
> **A drafted contract is not implementation authorisation, and drafting is not acceptance.**

---

## 8. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified / renamed / deleted | **0** |
| Source / test / fixture / evidence changes | **0** |
| **P01** / tracker / SPEC | **untouched** |
| Numeric operational metric invented | **none** — no %, percentile, SLO, SLA, uptime or error budget |
| States invented beyond NFR-09 | **none** |
| Q-1 quality enum altered | **no** |
| DM-1 / DM-2 altered | **no — preserved verbatim** |
| P07-04 assigned system-operational ownership | **no — excluded** |
| D01 threshold adopted | **no** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every state and rule cites a line in an existing record, a tracker cell, or the SPEC.*
