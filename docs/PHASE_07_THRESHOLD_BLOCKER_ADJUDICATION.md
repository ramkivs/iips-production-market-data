# PHASE 07 — D3 CONTRACT / SCHEMA BLOCKER OWNERSHIP ADJUDICATION

> **ACT TYPE:** **Read-only** authority / contract-ownership adjudication. **NO IMPLEMENTATION.**
> **PURPOSE:** Determine, for the three contract/schema blockers recorded by
> `PHASE_07_THRESHOLD_D01_ADOPTION_READINESS.md`, whether an **existing accepted contract** can
> authoritatively host each, and if not, the **exact owning contract and required authority act**.
> **RESOLVES NO BLOCKER. CREATES NO FIELD, NO ENUMERATION, NO API, NO IMPLEMENTATION.**
> **Append-only. Edits nothing.**
>
> **Baseline adjudicated:** Track B `4fa2c79224159d6a1c4c4b54512a0e0391d35e32`.

---

## 0. Controlling status — unchanged

`O-1 = OPEN — 4 of 5 resolved` · `D3 = NOT RESOLVED` · **D01 15-minute threshold = business-currency
requirement only, NOT formally adopted** · `IMPLEMENTATION = NOT PERMITTED` · `ACCEPTANCE = NOT
ESTABLISHED` · `CERTIFICATION = NONE GRANTED`.

---

## 1. ADJUDICATION MATRIX

| BLOCKER | EXISTING CONTRACT OWNER | EVIDENCE | RESOLUTION PATH | STATUS |
|---|---|---|---|---|
| **1 — Evaluation instant** (RP-2) | ❌ **NONE** | P01 recognises **exactly five** distinct times, and *"They are never collapsed, never inferred from one another, and never substituted for one another"* (`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md:8-11`) — a **closed set**, none of which is an evaluation instant. **No query-time concept exists anywhere** (`PIT_QUERY_TIME` / `queryTime` / `point-in-time query` = **0 hits**). FD-1 needs *"`asOf` + evaluation instant"* (`D15:165`); **RP-2** needs it *"an **explicit input**, never an implicit 'now'"* (`D15:218`) | **Additive P01 contract act** introducing a **new, distinct time** as an explicit input — **not** a repurposing of T1–T5. Class **MINOR** (**SV-2**), backward-compatible (**BC-1**), **inert** for existing SNAPSHOT-only executions (**BC-3/BC-4**); carried on the envelope and named in evidence for **RP-3** | 🔴 **OPEN — NO EXISTING OWNER · P01 ADDITIVE CONTRACT ACT REQUIRED** |
| **2 — Duration-unit enumeration** (UN-2) | ✅ **P01 — CONFIRMED** | **UN-1/UN-2/UN-3** live in `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md:74-76`; **UN-2** locates the enumeration *"**in the schema**"*. **P01 is ACCEPTED** — 24 of 24 criteria PASS (`P01_GATE_ACCEPTANCE.md:16,46`). Schema artifacts: `P01_SCHEMA_CATALOG.md` + `P01_FIELD_DICTIONARY.md` (`PROGRAM_STATE.md:816-817`). Existing per-domain *"Units / currency"* rows govern **currency** (ISO-4217) and macro `unitOfMeasure` — **no duration units** | **Additive MINOR (SV-2) P01 schema act** declaring duration units; `unit` required on every dimensioned freshness quantity (**UN-1**), precision fixed and declared (**TS-2**), version on every snapshot (**SV-4**), inert for existing executions (**BC-3/BC-4**), historical snapshots never rewritten (**BC-5**) | 🔴 **OPEN — OWNER CONFIRMED (P01) · ADDITIVE MINOR SCHEMA ACT REQUIRED** |
| **3 — "Normal operating conditions"** | ❌ **NONE** | **0 hits** for operational / operating / system / service / health / availability **state** across P00–P06. **DM-2**: degradation is *"a property of **data**, never of the security decision"*; **P03 §4**'s permitted-degradation table is expressed **entirely in `quality` values**; **S5** classifies a **data** state (`P01_VALIDATION_RULES.md:17`). *"Normal"* is defined nowhere | **Two acts required:** **(a)** an **authority/design act establishing an operational-state contract** (what *normal* vs *degraded* means at **system** level, with **no invented metric**), and **(b)** **P17 work-item decomposition** in the tracker before P17 can own anything | 🔴 **OPEN — NO OWNER EXISTS · AUTHORITY/DESIGN ACT + TRACKER DECOMPOSITION REQUIRED** |

---

## 2. BLOCKER 1 — EVALUATION INSTANT: no existing contract can host it

**The five P01 times are a closed set.** Each was rejected as a substitute, and the rejection stands:

| | Rejected because |
|---|---|
| T1 `asOf` | the **measured-from** endpoint — age would be identically zero |
| T2 `receivedAt` | ingest time, fixed in the past by **TS-6**, never recomputed |
| T3 `observationTime` | event time — a property of the datum |
| T4 `effectiveTime` | economic effectiveness — unrelated to evaluation |
| T5 `publicationTime` | source release — unrelated to evaluation |

⚠ **Correction of record:** a `PIT_QUERY_TIME_UTC` field was believed to exist in the P04 snapshot
envelope. **It does not.** A direct search returned **0 hits** corpus-wide; `P04_EXCHANGE_VENUE_REFERENCE.md:32`
is the **VN-3** operating-MIC/segment-MIC rule. **No query-time or evaluation-time concept exists
anywhere in the program.** This **strengthens** the finding: there is no candidate host at all.

> ### 🔴 **BLOCKER 1 = OPEN — NO EXISTING OWNER**
> **Required owning contract:** `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` (the time-semantics contract).
> **Required authority act:** an **additive P01 contract change** introducing the evaluation instant
> as a **new explicit input**. **No API field and no implementation is invented here.**
> ⚠ **P07 cannot host it** — P07 is not the time-semantics contract, and P07 implementation is not
> permitted.

---

## 3. BLOCKER 2 — DURATION UNITS: owner confirmed, act required

> ### ✅ **P01 IS THE ACCEPTED SCHEMA OWNER — CONFIRMED**
> **UN-2** requires the enumeration *"in the schema"*, and the schema contracts are P01's. A **P07
> record cannot satisfy UN-2** and would create a **competing source of truth** — **none is created
> here**.

| Requirement | Determination |
|---|---|
| Are **minutes** and **seconds** permissible additions? | ⚠ **ONLY IF EXPLICITLY AUTHORIZED.** Adding enumeration members is a **schema act**, not a design choice. **Not created by this act.** |
| Unit fields added to implementation? | ❌ **NO** |
| Competing P07 source of truth created? | ❌ **NO** |
| Change class | **MINOR — strictly additive and backward-compatible (SV-2)**; **BC-3/BC-4** require the delta be **additive and inert** for existing SNAPSHOT-only executions so the AD-4 baselines are not invalidated; **BC-5** historical snapshots are **never rewritten** |

### 3.1 The `barInterval` precedent is preserved

| Anchor | Substance |
|---|---|
| **HA-6** (`P05_03_SPECIFICATION.md:92`) | *"Granularity is **DECLARED and VERSIONED, not enumerated**."* |
| **BD-P05-03-03** (`P05_03_OPEN_ITEMS.md:33`) | *"`barInterval` is **not enumerated by any accepted artifact**"* — **OPEN** |
| `p05/evidence-p05-03/12-boundary-attestations.json:42` | **`"barIntervalValueInvented": false`** |

> **`barInterval` REMAINS OPEN.** *"DECLARED and VERSIONED, not enumerated"* is **unchanged** and
> **can be altered only by an authoritative schema act** — not by this adjudication, and not by any
> P07 record.

---

## 4. BLOCKER 3 — "NORMAL OPERATING CONDITIONS": no owner exists

> ### ❌ **P07-04 IS REJECTED AS OWNER**
> P07-04's tracker requirement is *"Define behavior for missing, stale, partial and failed **data**"*.
> It governs **data-quality states**. **"Normal operating conditions" is a SYSTEM qualifier.**
> Assigning it to P07-04 **because P07-04 handles data states** would be exactly the conflation this
> adjudication must avoid. **DM-1 and DM-2 are preserved unchanged.**

### 4.1 ⚠ P17 is a **candidate only** — and a structural obstacle was found

| Finding | Evidence |
|---|---|
| P17 exists **only** in the Phase Roadmap | *"Operationalize monitoring, incident handling, provider failover/staleness controls, release evidence and production certification"* — **one line of intent** |
| 🔴 **P17 has NO work items at all** | The **Work Tracker contains 59 work items covering P00–P13 only. No P14–P18 work item exists.** So P17 has **no requirement, no entry/exit criteria, no dependencies and no owner field** |
| **NFR-09** states the requirement but assigns no owner | *"Degraded operation — Provider outage, stale feed and partial dataset conditions have explicit backend/UI behavior."* **No state model, no owner** |

> ### 🔴 **BLOCKER 3 = OPEN — NO OWNER EXISTS**
> **P17/NFR-09 is the most plausible *candidate* path, but ownership is NOT established by existing
> authority evidence — it cannot be, because P17 has never been decomposed into work.**
> **Required:** **(a)** an **authority/design act** establishing an operational-state contract, and
> **(b)** **tracker decomposition of P17** before it can own the contract.
> ⚠ **"Normal" is NOT converted into an uptime percentage, percentile, SLA, SLO, error budget or any
> other operational metric. None is invented.**

---

## 5. CONFIRMATIONS — all re-verified this act

| Item | State |
|---|---|
| **D01 scope = prices / quotes only** | ✅ **CONFIRMED** |
| **15 minutes = the only authority-supplied numeric freshness value** | ✅ **CONFIRMED** — the only numeric time strings in the corpus are `15 minutes`/`15 min` and `5 seconds`, both authority-supplied; the sole other match outside the P07 family is the **filename fragment** `IES-005.1 sec.ts` (`D4_01:25`), not a duration |
| **Comparison = strict `>`** | ✅ **CONFIRMED** — `age > 15 minutes ⇒ stale` |
| **Negative age = N1 reject/invalid** | ✅ **CONFIRMED** — a **rejection**, never a quality value (**Q-5**) |
| **Adopting authority = PROGRAM AUTHORITY** | ✅ **CONFIRMED** (D1) |
| **Certification authority = RAMKI** | ✅ **CONFIRMED** (D5, C8) |
| **D06 · D07 · C-PIT · C-MASTER · C-GOV · instrument-level** | ✅ **CONFIRMED OPEN — not inferred from D01** |
| **5-second backend-receipt → screen-display** | ✅ **CONFIRMED — a separate OPEN contract boundary, NOT FD-2.** **FD-2 remains `receivedAt − asOf`.** `screenDisplayedAt` not created; ownership not assigned |

---

## 6. STATUS

> # 🟡 **1. D3 STATUS = B — PARTIALLY READY**
> The **value, scope, boundary, negative-age handling and both authorities** are settled. **All three
> contract/schema blockers remain OPEN, and this act confirms that none can be closed by an existing
> accepted contract as it stands.** **D3 is NOT RESOLVED — UN-2 alone prohibits a resolution claim.**

> # 🔴 **2. O-1 STATUS = OPEN — 4 OF 5 RESOLVED · D3 NOT RESOLVED**
> **No partial closure.** **RP-4 stands**; P07-02's exit *"Freshness state reproducible"* remains
> **unevidenceable**. Entry not blocked by O-1 · **cannot start** (Hard dep **P07-01** `NOT STARTED`
> **and** `IMPLEMENTATION = NOT PERMITTED`) · **P07-04 → P13-01** downstream. **No Hard dependency
> weakened, relaxed or reordered; no tracker status altered.**

---

## 7. EXACT AUTHORITY ACTS REQUIRED NEXT

| # | Act | Owner of the act | What it must produce |
|---|---|---|---|
| **1** | **P01 additive contract act — evaluation instant** | Program Authority, amending **ACCEPTED** P01 | A **new, distinct** time as an **explicit input**, versioned **MINOR (SV-2)**, inert for existing executions (**BC-3/BC-4**) |
| **2** | **P01 additive schema act — duration-unit enumeration** | Program Authority, amending **ACCEPTED** P01 | A **declared, versioned** duration-unit enumeration admitting **minutes** and **seconds**, satisfying **UN-1/UN-2**, precision per **TS-2**, version per **SV-4** |
| **3** | **Operational-state design act** | Program Authority + a design act | A definition of **normal** vs **degraded** at **system** level, with **no invented metric**, preserving **DM-1/DM-2** |
| **4** | **P17 tracker decomposition** | Program Authority (tracker change) | Work items, entry/exit criteria and dependencies for P17, so it can **own** act 3's contract |
| **5** | **D3 value-adoption act** | **PROGRAM AUTHORITY** (D1) | Threshold-set identity · version · **effective date** · scope **D01** · **15 minutes** · strict `>` · **N1** · supersession — **executable only after acts 1 and 2** |
| **6** | **Ownership decision for the 5-second requirement** | Program Authority | An explicit owning contract for `backendReceivedAt → screenDisplayedAt`, and a decision on whether `screenDisplayedAt` will ever exist |

⚠ **Acts 1 and 2 are prerequisites to act 5.** Act 5 cannot validly adopt the threshold while UN-2
is unsatisfied or the evaluation instant is undefined.

---

## 8. ⛔ **NO IMPLEMENTATION IS PERMITTED**

**Nothing in this adjudication authorises implementation.** `P07 IMPLEMENTATION = NOT YET PERMITTED`
· `P07 ACCEPTANCE = NOT ESTABLISHED` · `P07 CERTIFICATION = NONE GRANTED` · **production activation
`NOT AUTHORIZED`** (exercised at **P16** only) · **no provider selected** (**DEP-P02-07**) · **no
licence or credentials**. Resolving the blockers is **contract work**, and **contract work is not
implementation authorisation**.

---

## 9. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — every prior record **unedited** |
| Source / test / fixture / evidence changes | **0** |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` · providers · tracker · SPEC | **untouched** |
| API fields, unit fields or enumeration members created | **none** |
| `barInterval` status changed | **no — remains OPEN** |
| DM-1 / DM-2 altered | **no** |
| P07-04 assigned system-operational ownership | **no — explicitly rejected** |
| P17 ownership asserted | **no — candidate only** |
| Operational metric invented | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record, a tracker cell, or a tracked source file.*
