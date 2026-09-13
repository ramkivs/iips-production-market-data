# PHASE 07 — D01 15-MINUTE THRESHOLD ADOPTION READINESS

> **ACT TYPE:** Contract / policy readiness determination. **NO IMPLEMENTATION.**
> **PURPOSE:** Resolve whether existing evidence is sufficient to **formally adopt** the D01
> 15-minute freshness threshold, and identify **only** the remaining authority inputs required.
> **DOES NOT ADOPT THE THRESHOLD.** Changes no value. Creates no implementation.
> **Append-only. Edits nothing.**

---

## 0. Controlling authority and boundary

| | |
|---|---|
| **D1** adopting authority | ✅ **PROGRAM AUTHORITY** |
| **D2** scoping | ✅ **B — domain / instrument** |
| **D4** negative age | ✅ **N1 — reject / invalid** |
| **D5** A2 / C8 certification authority | ✅ **RAMKI** |
| **Business input** | *"Prices and quotes shall be no more than **15 minutes** old under normal operating conditions, consistent with standard delayed market data."* |
| **Established by the prior mapping act** | **FD-1 / D01 = 15 minutes** · boundary **`age > 15 minutes ⇒ stale`** |

⚠ **The 15-minute value is NOT changed and no other value is invented.**

`P07 ENTRY = AUTHORIZED` · `CONTRACT/DESIGN = ESTABLISHED` · ⛔ `IMPLEMENTATION = NOT YET
PERMITTED` · `ACCEPTANCE = NOT ESTABLISHED` · `CERTIFICATION = NONE GRANTED`.

---

## 1. EVALUATION INSTANT — 🔴 `OPEN / CONTRACT INPUT REQUIRED`

**FD-1** is *"Data age — elapsed time relative to `asOf`"*, derived from *"`asOf` + **evaluation
instant**"* (`D15_PHASE_07_POLICY_STATE_CONTRACT.md:165`). **RP-2** requires that *"the evaluation
instant is an **explicit input**, never an implicit 'now'"* (`D15:218`) — **without it RP-1
reproducibility is unachievable**.

**Search result: no authoritative contract defines one.** A corpus-wide search for an evaluation
instant / evaluation time / point of evaluation / at-request-time / at-display-time definition
returned **0 substantive hits**.

**The five P01 times are the only contract timestamps, and none may be substituted:**

| | Time | Why it cannot serve as the evaluation instant |
|---|---|---|
| T1 | `asOf` | It is the **measured-from** endpoint; using it would make age identically zero |
| T2 | `receivedAt` | Ingest time — a **past** instant fixed by **TS-6**, not the moment of evaluation |
| T3 | `observationTime` | Event time — a property of the datum, not of the evaluation |
| T4 | `effectiveTime` | Economic effectiveness — unrelated to evaluation |
| T5 | `publicationTime` | Source release time — unrelated to evaluation |

> ### 🔴 **EVALUATION INSTANT = OPEN / CONTRACT INPUT REQUIRED**
> **Wall-clock "now" is NOT used. No P01 time is silently designated.** The evaluation instant must
> be introduced as an **explicit contract input** by an authority act before the threshold can be
> evaluated reproducibly.

---

## 2. UNIT ENUMERATION — 🔴 `OPEN`, and it **cannot** be closed by a P07 policy artifact

**UN-1**: *"Every dimensioned quantity carries `unit`."* **UN-2**: *"Units come from a **declared,
versioned enumeration in the schema**; free-text units are **invalid**."*

**Re-verified this act: still 0 hits.** No duration-unit enumeration exists anywhere.

### 2.1 Where must it live? — a determination, not a preference

**UN-2 locates the enumeration "in the schema."** The authoritative schema contracts are
`P01_SCHEMA_CATALOG.md` and `P01_FIELD_DICTIONARY.md`. Therefore:

> ### 🔴 **THE ENUMERATION MUST BE ESTABLISHED IN THE AUTHORITATIVE SCHEMA CONTRACT (P01) FIRST**
> A **P07 policy artifact cannot satisfy UN-2.** Defining units only in a P07 record would create a
> **second, conflicting source of truth** and would still leave free-text units in the schema.
>
> **Minimum policy requirement:** the enumeration must, at minimum, admit **minutes** and
> **seconds** as **declared, versioned** duration units, be **versioned per the schema**
> (**TS-2** — precision fixed and declared; **SV-1** `MAJOR.MINOR` explicit), and carry a `unit` on
> every dimensioned freshness quantity (**UN-1**).
>
> **Change class:** adding an enumeration to P01 is **strictly additive and backward-compatible**,
> i.e. a **MINOR** schema change (**SV-2**). ⚠ **It is nonetheless a change to an ACCEPTED
> artifact and requires its own authority act. No implementation code is created here to satisfy
> UN-2.**

### 2.2 The governing precedent — `barInterval`

The program has already met this exact situation and its discipline is recorded:

| Anchor | Verbatim substance |
|---|---|
| `P05_03_SPECIFICATION.md:92` (**HA-6**) | *"Granularity is **DECLARED and VERSIONED, not enumerated**. `P01_FIELD_DICTIONARY` §4 types `barInterval` as an `enum` but **never lists values**."* |
| `P05_03_OPEN_ITEMS.md:33` (**BD-P05-03-03**) | *"`barInterval` is **not enumerated by any accepted artifact**"* — **OPEN** |
| `p05/evidence-p05-03/12-boundary-attestations.json:42` | **`"barIntervalValueInvented": false`** |

> **The same discipline applies to duration units: record the enumeration as OPEN and do not invent
> its members.** ⚠ **D3 cannot be called resolved while UN-2 is unsatisfied.**

---

## 3. NORMAL OPERATING CONDITIONS — 🔴 `OPEN`, with a category mismatch

**The phrase is a system/operational qualifier.** The program's existing degraded-state framework
governs **data**, not the system:

| Anchor | Substance |
|---|---|
| `P03_FAILURE_AND_DEGRADED_MODE.md` §4 | The permitted-degradation table is expressed **entirely in `quality` values** — `unavailable`, `partial`, `stale` |
| **DM-2** | *"Degradation is a property of **data**, never of the **security decision**"* |
| **DM-1** | *"Security has no degraded mode."* |
| `P01_VALIDATION_RULES.md:17` (**S5**) | *"CLASSIFY (degraded state, not rejection)"* — a **data** classification step |

**"Normal" is not defined as an operational state anywhere** — corpus-wide, the only two unrelated
uses concern entitlement absence (**EE-3**) and audit completeness (**A-1**).

> ### 🔴 **NORMAL OPERATING CONDITION = OPEN**
> There is a **category mismatch**: *"under normal operating conditions"* is a **system** state
> qualifier, while every existing degraded-state rule describes a **data** state. **No authoritative
> operational-state contract exists to govern the phrase.**
>
> **Candidate ownership boundary — NOT assigned here, requires an authority decision:**
> **P17** *"Operations, Monitoring & Release Certification"*, anchored by **NFR-09** *"Degraded
> operation — Provider outage, stale feed and partial dataset conditions have explicit backend/UI
> behavior"*; with the **data-side** consequence remaining with **P07-04** *"Degraded-state
> contract"* (**NOT STARTED**).
>
> ⚠ **"Normal" is NOT converted into an uptime percentage, percentile, SLA, SLO, error budget or
> any availability number.** **No P07-04 implementation is invented.**

---

## 4. THRESHOLD-SET ADOPTION METADATA — minimum required

| Field | Value | Status |
|---|---|---|
| **Threshold** | **15 minutes** | ✅ **authority-supplied — unchanged** |
| **Scope** | **D01 prices / quotes** | ✅ **RESOLVED** |
| **Comparison** | **strict `>`** — `age > 15 minutes ⇒ stale` | ✅ **RESOLVED** (*"no more than"* + `D15:222` *"exceeds"*) |
| **Negative age** | **N1 — reject / invalid**, expressed as a **rejection**, never a quality value (**Q-5**) | ✅ **RESOLVED** (D4) |
| **Adopting authority** | **PROGRAM AUTHORITY** | ✅ **RESOLVED** (D1) |
| **Certification authority** | **RAMKI** — **C8** provenance/quality/freshness derivation | ✅ **RESOLVED** (D5) |
| **Supersession relationship** | **supersedes nothing** — this would be the first set | ✅ **DETERMINABLE** |
| **Threshold-set identity** | — | 🔴 **OPEN** — no identity scheme exists |
| **Version** | — | 🔴 **OPEN** — ⚠ **no historical version is invented** |
| **Effective date** | — | 🔴 **OPEN — AUTHORITY INPUT REQUIRED** |
| **Unit** | minutes | 🔴 **OPEN — BLOCKED on §2** |
| **Evaluation instant** | — | 🔴 **OPEN — §1** |
| **Operating condition** | *"under normal operating conditions"* | 🔴 **OPEN — §3** |

---

## 5. D01 APPLICABILITY — confirmed, not extended

| | |
|---|---|
| ✅ **Covered** | **D01 prices** · **D01 quotes** |
| ❌ **NOT covered — remain OPEN** | **D06** news/events · **D07** analyst estimates · **C-PIT** (D02/D03/D04/D08) · **C-MASTER** (D05/D10) · **C-GOV** (D09) · **instrument-level subclasses** |

⚠ **`P04_EXCHANGE_VENUE_REFERENCE.md:21`** names **D01 *and* D07** for staleness baselines. The
business statement covers **D01 only**, so **D07's baseline remains OPEN** and requires its own
authority input. *"Consistent with standard delayed market data"* **characterises** the figure; it
**does not extend scope**.

---

## 6. 5-SECOND REQUIREMENT — boundary preserved

> ### 🔴 **PRESERVED AS A SEPARATE OPEN CONTRACT-BOUNDARY ISSUE**
>
> **P07 FD-2 = `receivedAt` − `asOf`** (`D15:166`; **M-7** `P02_OBSERVABILITY_REQUIREMENTS.md:63`) —
> **unchanged**.
>
> The 5-second requirement is **`backendReceivedAt → screenDisplayedAt`** — a **different
> measurement** on a **different, adjacent, non-overlapping** interval. **It is NOT mapped into
> FD-2.** **`screenDisplayedAt` is not created.** **Ownership is not assigned by inference** —
> it remains the **OPEN contract boundary** recorded by
> `PHASE_07_THRESHOLD_BUSINESS_CURRENCY_MAPPING.md` §2.1.

---

## 7. D3 READINESS

### 7.1 Remaining blockers to adopting the D01 15-minute threshold

| # | Blocker | Nature |
|---|---|---|
| **1** | **Evaluation instant** — no contract defines one | 🔴 **CONTRACT INPUT REQUIRED** (new explicit input) |
| **2** | **Duration-unit enumeration** — UN-2 unsatisfied | 🔴 **SCHEMA CHANGE REQUIRED** — additive **MINOR** to **P01** (**SV-2**), its own authority act |
| **3** | **"Normal operating conditions"** — no operational-state contract | 🔴 **OWNERSHIP UNDECIDED** — candidate **P17**/NFR-09 |
| **4** | **Effective date** — not supplied | 🔴 **AUTHORITY INPUT REQUIRED** |
| **5** | **Threshold-set identity + version** — no scheme exists | 🔴 **AUTHORITY INPUT REQUIRED** |

⚠ **Blockers 1 and 2 are contract/schema-level, not merely policy-level** — they cannot be closed by
an authority statement alone; they require an additive contract change. **This is the material
finding of this act.**

### 7.2 Determination

> # 🟡 **B — D01 15-MINUTE THRESHOLD PARTIALLY READY**
>
> **Settled:** the **value** (15 minutes), **scope** (D01 prices/quotes), **boundary** (strict `>`),
> **negative-age handling** (N1), **adopting authority** (PROGRAM AUTHORITY), **certification
> authority** (RAMKI) and **supersession** (supersedes nothing).
>
> **Not settled:** blockers **1–5** above. **The threshold CANNOT be formally adopted yet.**
>
> ⚠ **D3 is NOT resolved.** Not every mandatory adoption element is established. **UN-2 remains
> unsatisfied**, which alone prohibits a resolution claim.

---

## 8. O-1 STATUS

| ID | Decision | State |
|---|---|---|
| **D1** | Adopting authority | ✅ RESOLVED — PROGRAM AUTHORITY |
| **D2** | Scoping | ✅ RESOLVED — B, domain/instrument |
| **D3** | Versioned threshold values | 🔴 **OPEN** — D01 partially ready, **5 blockers** |
| **D4** | Negative-age semantics | ✅ RESOLVED — N1 |
| **D5** | A2 / C8 certification authority | ✅ RESOLVED — RAMKI |

> # 🔴 **O-1 = OPEN — 4 OF 5 RESOLVED · D3 PARTIALLY READY**
> **No partial closure.** **RP-4 stands**; P07-02's exit *"Freshness state reproducible"* remains
> **unevidenceable**. Entry not blocked by O-1 · **cannot start** (Hard dep **P07-01** `NOT STARTED`
> **and** `IMPLEMENTATION = NOT YET PERMITTED`) · **P07-04 → P13-01** downstream. **No Hard
> dependency weakened, relaxed or reordered; no tracker status altered.**

---

## 9. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — every prior record **unedited** |
| Source / test / fixture / evidence changes | **0** |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` · providers · tracker · SPEC | **untouched** |
| Threshold value changed | **no — 15 minutes preserved** |
| Values or unit-enum members invented | **none** (`barInterval` discipline followed) |
| Evaluation instant substituted | **no** — wall-clock "now" not used; no P01 time designated |
| "Normal" converted to SLO/SLA/percentile/uptime/error budget | **no** |
| P07-04 implementation invented | **no** |
| `screenDisplayedAt` created | **no** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record, a tracker cell, or a tracked source file.*
