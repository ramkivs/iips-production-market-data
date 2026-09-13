# PHASE 07 — D3 BUSINESS-CURRENCY → CONTRACT MAPPING

> **ACT TYPE:** Targeted read-only **contract mapping**. **NO IMPLEMENTATION.**
> **PURPOSE:** Map the Program Authority's explicit business-currency statement into the existing
> P07 freshness contract, and determine exactly what D3 fields remain missing.
> **ALTERS NO CONTRACT.** FD-1…FD-4 are neither renamed nor redefined. **No fifth freshness
> dimension is created.** **No numerical threshold beyond the two supplied is invented.**
> **Append-only. Edits nothing.**

---

## 0. Authoritative business input — captured verbatim

> *"The application shall display prices and quotes that are no more than 15 minutes old under
> normal operating conditions, consistent with standard delayed market data.*
>
> *End-to-end delivery latency — from data receipt at the backend to display on the user's screen —
> shall normally not exceed 5 seconds."*

Recorded as **explicit business-policy input** from the Program Authority (D1). **Not** replaced by
generic market-data assumptions. **"Normal operating conditions" and "normally" are preserved
verbatim and are not silently altered.**

**Boundary and decisions carried forward:** `P07 ENTRY = AUTHORIZED` · `CONTRACT/DESIGN =
ESTABLISHED` · ⛔ `IMPLEMENTATION = NOT YET PERMITTED` · `ACCEPTANCE = NOT ESTABLISHED` ·
`CERTIFICATION = NONE GRANTED`. **D1** PROGRAM AUTHORITY · **D2** B domain/instrument · **D4** N1
reject/invalid · **D5** RAMKI (A2/C8). **D3 = OPEN.**

---

## 1. FD-1 ANALYSIS — the 15-minute prices/quotes requirement

> ### ✅ **MAPPING CONFIRMED — this requirement IS an FD-1 threshold**
>
> **FD-1** is *"**Data age** — elapsed time relative to `asOf`"*, derived from *"`asOf` + evaluation
> instant"* (`D15_PHASE_07_POLICY_STATE_CONTRACT.md:165`). *"No more than 15 minutes old"* is
> precisely an upper bound on that age. **FD-1 threshold = 15 minutes, scoped to D01.**

| Element | Determination | Basis / class |
|---|---|---|
| **Source timestamp** | **`asOf`** (T1) — market-data time, the snapshot point | ✅ **[ACCEPTED]** — `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1; **REQUIRED** for a D01 live quote (T1, T2, T3) |
| **Evaluation timestamp** | the **evaluation instant** | ⚠ **[DESIGN]** — **FD-1** requires it and **RP-2** requires it be *"an **explicit input**, never an implicit 'now'"* (`D15:218`). 🔴 **It does NOT exist in the canonical model** — the five P01 times are `asOf`, `receivedAt`, `observationTime`, `effectiveTime`, `publicationTime`; **none is an evaluation instant** |
| **Comparison** | `age = evaluationInstant − asOf` | **[DESIGN]** |
| **Boundary** | **`age > 15 min ⇒ stale`** (strict) | ✅ **DETERMINED — see §6** |
| **Scope** | **D01 Market prices / quotes** only | ✅ **DETERMINED — see §3** |
| **Operating condition** | *"under normal operating conditions"* | 🔴 **OPEN — see §5** |
| **Unit** | **minutes** | 🔴 **BLOCKED — see §4** |
| **Effective version** | — | 🔴 **not supplied** |

> ### 🟡 **FD-1 VERDICT: CORRECTLY MAPPED, NOT YET ADOPTABLE**
> The dimension, magnitude, scope and boundary are now settled. Adoption is blocked by **four**
> independent gaps: the **UN-2 unit enumeration**, the absent **evaluation instant**, the undefined
> **operating condition**, and the absent **effective version**.

---

## 2. FD-2 ANALYSIS — the 5-second requirement is a **DIFFERENT MEASUREMENT**

**Existing FD-2, quoted exactly and left unaltered:**

| Source | Verbatim |
|---|---|
| `D15_PHASE_07_POLICY_STATE_CONTRACT.md:166` | **"FD-2 · Delivery latency — `receivedAt` − `asOf`"** |
| `P02_OBSERVABILITY_REQUIREMENTS.md:63` (**M-7**) | *"Age between `asOf` and `receivedAt` — the **input** to freshness (**thresholds are P07**)"* |

**The business requirement measures a different interval:**

| | **FD-2 (existing)** | **Business 5-second requirement** |
|---|---|---|
| Interval | `[ asOf , receivedAt ]` | `[ backendReceivedAt , screenDisplayedAt ]` |
| Measures | **source → backend** (feed/provider delivery) | **backend → screen** (application + display) |
| Position vs ingest boundary | ends **at** it | begins **at** it |
| Involves `asOf`? | **yes** — it is an endpoint | **no** — `asOf` does not appear |
| Nature | a **data-freshness input** (how stale the datum already was on arrival) | an **application performance budget** |
| Terminal timestamp exists? | ✅ `receivedAt` (T2) **[ACCEPTED]** | 🔴 **`screenDisplayedAt` does not exist anywhere** — 0 hits corpus-wide |

> ### ❌ **DIFFERENT MEASUREMENTS — NOT FD-2**
>
> The two intervals share **exactly one point** (`receivedAt`) and are **adjacent but
> non-overlapping**. Neither contains the other. FD-2 is **upstream** of the ingest boundary; the
> 5-second requirement lies **entirely downstream** of it.
>
> **FD-2 is NOT renamed and NOT redefined.** **No fifth freshness dimension is created** — this is
> not a freshness dimension at all; it is end-to-end application latency.

### 2.1 Where does the 5-second requirement belong?

| Candidate | Verdict |
|---|---|
| **P07 freshness / data-delivery contract** | ❌ **NO** — admitting it would require redefining FD-2, which is prohibited, or inventing a fifth dimension, which is also prohibited |
| **Downstream application / display performance** | ✅ **Substantively correct home** — but **no owning contract exists** |
| **Another already-defined contract** | ❌ **none found.** Checked: **P12** Certified Data APIs · **P13** Product UI Data Integration · **P14** UX/Accessibility/Visual Parity · **P15** Full E2E Certification (*"provider-to-UI data lineage"* — lineage, not latency) · **P17** Operations/Monitoring (*"staleness controls"*, monitoring — observes, does not bound) · **NFR-08** UI integrity (*"Certified UI metrics originate from governed backend sources and are reproducible"* — provenance, not latency) · **NFR-09** degraded operation. **SPEC contains 0 latency / response-time / performance requirements and 0 numeric time values.** The tracker's only *"latency"* is **P02-03** *provider **selection** criteria* — not a runtime budget |
| **OPEN contract boundary requiring authority decision** | ✅ **THIS IS THE CORRECT CLASSIFICATION** |

> ### 🔴 **5-SECOND REQUIREMENT = OPEN CONTRACT BOUNDARY — OWNERSHIP UNDECIDED**
>
> Two independent obstacles, beyond ownership:
> **(1)** **`screenDisplayedAt` does not exist** in any contract — the requirement is currently
> **unmeasurable**. **(2)** It would be a **client/UI-layer clock**, whereas **TS-6** fixes
> *"`receivedAt`"* to *"the ingest boundary"* and **TS-1** requires ISO-8601 UTC; a browser clock is
> a **different and untrusted** source. **Clock governance for that endpoint is undecided.**

---

## 3. SCOPE DETERMINATION

The statement names **"prices and quotes"** and **"standard delayed market data"**. Under **D2 = B
(domain/instrument)** this scopes to **D01 only**.

| Class / Domain | Covered by the 15-minute value? |
|---|---|
| **D01** Market prices / quotes | ✅ **YES** — explicitly named |
| **D06** News / events | ❌ **NO** — 🔴 **OPEN** |
| **D07** Analyst estimates | ❌ **NO** — 🔴 **OPEN**. ⚠ **Note:** `P04_EXCHANGE_VENUE_REFERENCE.md:21` names **D01 *and* D07** for staleness baselines; the business statement covers **D01 only**, so **D07's baseline remains OPEN** |
| **C-PIT** D02 · D03 · D04 · D08 | ❌ **NO** — 🔴 **OPEN** (currency is version/effective-date governed) |
| **C-MASTER** D05 · D10 | ❌ **NO** — 🔴 **OPEN** |
| **C-GOV** D09 | ❌ **NO** — 🔴 **OPEN** (applicability itself conditional) |
| **Instrument-level subdivision** | ❌ **NO** — 🔴 **OPEN** |

⚠ *"consistent with standard delayed market data"* is a **characterisation** of the 15-minute
figure. **It does not extend scope** to any other domain.

---

## 4. UNIT DETERMINATION — 🔴 **BLOCKER STANDS**

The statement uses **minutes** and **seconds** — **free-text units**.

**UN-1**: *"Every dimensioned quantity carries `unit`."* **UN-2**: *"Units come from a **declared,
versioned enumeration** in the schema; **free-text units are invalid**."*

**No such enumeration exists** — re-verified this act: **0 hits** corpus-wide.

> ### 🔴 **UNIT = OPEN / BLOCKED**
> The **magnitudes are now known** (15 minutes; 5 seconds) but **cannot be validly declared as
> contract values** until a versioned duration-unit enumeration exists. **No implementation schema
> is created by this act to close the gap.**

---

## 5. OPERATING-CONDITION DETERMINATION — 🔴 **OPEN**

*"under normal operating conditions"* and *"normally"* are **qualifiers on both requirements**.

| Question | Answer |
|---|---|
| Sufficient as **business policy**? | **Yes** — meaningful and recorded verbatim |
| Sufficient to be **evaluated**? | **No** — the corpus defines **no operational-state contract** distinguishing *normal* from *degraded*. Without it, neither requirement is testable |
| Natural home | **P07-04** *"Degraded-state contract — Define behavior for missing, stale, partial and failed data"* (`Work Tracker`, status **NOT STARTED**) |
| State | 🔴 **`OPEN — REQUIRES A DEFINED OPERATIONAL-STATE QUALIFIER`** |

> ⚠ **"Normally" is NOT converted into an uptime percentage, percentile, SLO, SLA or error budget.**
> No such numeric interpretation is invented, and **none exists in the corpus** (SPEC: **0** hits for
> percentile / p9x / SLO / SLA / uptime / error budget).

---

## 6. BOUNDARY DETERMINATION — ✅ **DETERMINED**

| | |
|---|---|
| Business language | *"**no more than** 15 minutes old"* ⇒ compliant at `age ≤ 15 min`; **stale when `age > 15 min`** |
| Existing design | `D15:222` — *"A snapshot is `stale` when its age on a governing dimension **exceeds** the applicable threshold"* |
| Agreement | ✅ **exact** — both are **strict** (`>`) |
| Determination | **Boundary = strict `>`** for staleness, for the 15-minute FD-1 threshold |

⚠ The boundary was **not chosen by this act** — the business statement establishes it and the
existing design corroborates it. The analogous reading of *"shall normally not exceed 5 seconds"*
is likewise strict, but that requirement is **unmapped** (§2.1) so no threshold is recorded for it.

---

## 7. TIMESTAMPS REQUIRED

| Requirement | Timestamps needed | Availability |
|---|---|---|
| **15-minute FD-1** | `asOf` + **evaluation instant** | `asOf` ✅ **[ACCEPTED]** · evaluation instant 🔴 **absent** (RP-2 requires it be explicit) |
| **5-second end-to-end** | `backendReceivedAt` (≈ `receivedAt`, T2) + **`screenDisplayedAt`** | `receivedAt` ✅ **[ACCEPTED]**, **TS-6** ingest-boundary clock · `screenDisplayedAt` 🔴 **absent**, and its **clock source is ungoverned** |

---

## 8. CONTRACT-MODIFICATION DETERMINATION

| Requirement | Representable within the existing P07 model? |
|---|---|
| **15-minute FD-1 / D01** | ✅ **YES — no P07 contract change needed.** It fits FD-1 exactly. ⚠ It **does** require the **evaluation instant** to be supplied as an explicit input (**RP-2**) — an **input addition, not a contract change** |
| **5-second backend→screen** | ❌ **NO.** It cannot be represented without **redefining FD-2** (prohibited) or **inventing a fifth freshness dimension** (prohibited). It requires a **separate contract whose owner is undecided** |

---

## 9. D3 RESULT

| Requirement | Mapping | Status | Exact remaining issue |
|---|---|---|---|
| **15-minute prices/quotes** | ✅ **FD-1** (data age), scope **D01** | 🟡 **MAPPED — NOT ADOPTABLE** | UN-2 unit enumeration absent · evaluation instant absent · operating condition undefined · effective version absent |
| **5-second backend→screen** | ❌ **NOT FD-2** — different measurement | 🔴 **UNMAPPED** | Interval is `[receivedAt, screenDisplayedAt]`, not `[asOf, receivedAt]`. `screenDisplayedAt` absent; clock ungoverned; **owning contract undecided** |
| **Units** | minutes · seconds | 🔴 **BLOCKED** | **UN-2** requires a declared versioned enumeration; **0 exist** |
| **Scope** | **D01 only** | ✅ **DETERMINED** | D06, **D07**, C-PIT, C-MASTER, C-GOV and instrument level all remain **OPEN** |
| **Boundary** | strict `>` | ✅ **DETERMINED** | established by *"no more than"* + `D15:222` *"exceeds"* |
| **Version / effective date** | — | 🔴 **OPEN** | not supplied; set identity, version and supersession also absent |
| **Operating condition** | *"normal operating conditions"* | 🔴 **OPEN** | no operational-state contract; candidate home **P07-04** (NOT STARTED); **not** convertible to SLO/percentile |

> # 🟡 **B — D3 PARTIALLY READY**
>
> **Advanced by this act:** the **first authority-supplied magnitude** exists — **15 minutes** for
> **FD-1**, scoped to **D01**, with a **determined strict boundary**. Scope and boundary are closed.
>
> **Still blocking adoption:** ① **UN-2 duration-unit enumeration**; ② **evaluation instant** as an
> explicit contract input (RP-2); ③ **operational-state qualifier** for *"normal operating
> conditions"*; ④ **effective version / set identity / version / supersession**; ⑤ **ownership of
> the 5-second requirement** plus the existence and clock governance of `screenDisplayedAt`;
> ⑥ thresholds for **D06, D07, C-PIT, C-MASTER, C-GOV** and any instrument level.
>
> ⚠ **D3 is NOT RESOLVED.** The existence of values does not resolve D3 — adoption does, and
> adoption is blocked by ①–⑥.

---

## 10. O-1 STATUS

| ID | Decision | State |
|---|---|---|
| **D1** | Adopting authority | ✅ RESOLVED — PROGRAM AUTHORITY |
| **D2** | Scoping | ✅ RESOLVED — B, domain/instrument |
| **D3** | Versioned threshold values | 🔴 **OPEN** — first magnitude mapped, **not adoptable** |
| **D4** | Negative-age semantics | ✅ RESOLVED — N1, reject/invalid |
| **D5** | A2 / C8 certification authority | ✅ RESOLVED — RAMKI |

> # 🔴 **O-1 = OPEN — 4 OF 5 RESOLVED · D3 PARTIALLY READY**
> **No partial closure.** **RP-4 stands**; P07-02's exit *"Freshness state reproducible"* remains
> **unevidenceable**. Entry not blocked by O-1 · **cannot start** (Hard dep **P07-01** `NOT STARTED`
> **and** `IMPLEMENTATION = NOT YET PERMITTED`) · **P07-04 → P13-01** downstream. **No Hard
> dependency weakened, relaxed or reordered; no tracker status altered.**

---

## 11. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — every prior record **unedited** |
| Source / test / fixture / evidence changes | **0** |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` · providers · tracker · SPEC | **untouched** |
| FD-1…FD-4 renamed or redefined | **no** · **no fifth dimension created** |
| Numeric thresholds invented | **none** — only the two authority-supplied magnitudes are recorded |
| *"Normal operating conditions"* altered | **no** — quoted verbatim, not converted to an SLO/percentile/uptime figure |
| Guards weakened, bypassed or varied | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record, a tracker cell, or a tracked source file.*
