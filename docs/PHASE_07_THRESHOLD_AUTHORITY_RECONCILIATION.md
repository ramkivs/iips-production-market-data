# PHASE 07 — THRESHOLD AUTHORITY RECONCILIATION

> **ACT TYPE:** Read-only authority decision preparation / adjudication. **NO IMPLEMENTATION.**
> **PURPOSE:** Re-test the five authority questions left open by
> `docs/PHASE_07_THRESHOLD_AUTHORITY_PATH.md` (`12254bc`), **correct one factual error in that
> record**, and determine whether a valid exact-value adoption act can now be conducted.
> **RELATIONSHIP:** Append-only. **Supersedes by addition, never by editing** — the same
> discipline as `INCIDENT-01` §5, `INCIDENT-02` §6 and `INCIDENT-03` rules P-1…P-5.
> **DESIGNATES NO PERSON. ADOPTS NO VALUE. GRANTS NOTHING.**

---

## 0. Controlling boundary — unchanged by this act

| | |
|---|---|
| **P07 ENTRY** | **`AUTHORIZED`** (`7fe5aaa`) |
| **P07 CONTRACT / DESIGN** | **`ESTABLISHED`** (`a5720a4`, `641158c`, `12254bc`) |
| **P07 IMPLEMENTATION** | ⛔ **`NOT YET PERMITTED`** |
| **P07 ACCEPTANCE** | **`NOT ESTABLISHED`** |
| **P07 CERTIFICATION** | **`NONE GRANTED`** |

No P07 implementation. No numeric threshold created or inferred. No person inferred from role
names, prior acceptors, A2/A3/C7/C8 or precedent. The §3 approval convention is **not** treated
as conferring exact threshold values. No P07 dependency weakened. No tracker status altered.
No provider selected. No acceptance or certification granted.

---

## 1. 🔴 CORRECTION OF RECORD — C8 certification authority

**This is the genuinely new authority substance of this act.**

`docs/PHASE_07_THRESHOLD_AUTHORITY_PATH.md` §4.1 row 8 states that **C8** certification
authority is **`UNKNOWN`**, citing `D4_11_CERTIFICATION_MATRIX.md:46`.

⚠ **That characterization is superseded.** `docs/p03/P03_SCOPE_AND_BOUNDARY.md` §3.1 states
verbatim:

> *"`D4_11_CERTIFICATION_MATRIX.md` records the certification authority for C1–C12 as
> **"UNKNOWN"**. **That wording is historical and is quoted, not adopted**, wherever it appears
> in this package."*

The controlling post-D8 state is recorded in `docs/p00/P00_AUTHORITY_REGISTER.md`
(*"**Post-D8 authority state of record**"*):

| Layer | Current record | Source |
|---|---|---|
| **Authority dimension B — CERTIFICATION AUTHORITY** | **`CLEARED (A2)` — but NO CERTIFICATION GRANTED** — *"An owner exists for C1–C12; no certification act has occurred"* | `P00_AUTHORITY_REGISTER.md:15` |
| **A2 role** | Implementation / Certification Authority | `D8_STATUS.json` `authority_status.A2` |
| **A2 status** | **`PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`** | same |
| **A2 person** | **`person_named: false`** | same |
| **A2 certification granted** | **`certification_granted: false`** | same |

**Corroborated identically** in `P00_DECISION_LOG.md:157` and `:224`
(*"`a2_person_named` = **`false`** — unchanged, no other role designated or inferred"*),
`CHECKPOINT-02.md:95` (*"A2 (cleared, not named)"*), `P03_SCOPE_AND_BOUNDARY.md:75`,
`P04_GATE_ACCEPTANCE.md:158`, `P04_OPEN_ITEMS.md:120`, `P03_OPEN_ITEMS.md:39`, and
`PROGRAM_STATE.md:178` / `:482` (*"**A1/A2/A4 not designated**"*).

> ### ✅ **CORRECTED — C8 CERTIFICATION AUTHORITY**
>
> | | Prior record `12254bc` | **Corrected, controlling** |
> |---|---|---|
> | Role owner for C8 | `UNKNOWN` | **A2 — an owner role EXISTS for C1–C12** |
> | Person | — | **`person_named: false` — not named, not inferred** |
> | Grant | — | **`certification_granted: false`** · program **`NONE_GRANTED`** |
>
> **Why the correction matters materially:** the outstanding action is **to name a person for an
> already-cleared role**, not to create a certification authority from nothing. `12254bc` would
> have misled a future act into the latter.
>
> `D4_11:46` (*"Certification authority — **UNKNOWN**"*) and `D4_12_PHASE_SEQUENCE.md:31`
> (*"quality/freshness/completeness certification owner **A2 UNKNOWN**"*) are **historical D4-era
> wording**, quoted here, **not adopted**.

---

## 2. Five-question authority matrix

Evidence excludes this program's own P07 records (`D13`/`D14`/`D15`/`PHASE_07_THRESHOLD_AUTHORITY_PATH.md`)
— **a record may not corroborate itself.**

| # | Question | Determination | Independent basis |
|---|---|---|---|
| **A** | **Threshold-adopting authority** | 🔴 **`OPEN / AUTHORITY-REQUIRED`** | All 10 threshold hits state `thresholdOwner: 'P07'` — **phase** ownership. **A1–A4** own security, certification, gate acceptance and production activation; **none owns value adoption**. §3 *"Does NOT confer … a namespace token string"*. **G-A** named-authority rule scoped to *"certified **engine-layer contract/component** changes"* |
| **B** | **Threshold scoping model** | 🔴 **`OPEN`** | 0 corpus statements tie domain/instrument scoping to freshness. Tracker `Parallel Execution r6` *"**can** split by domain"* is permissive parallelization language |
| **C** | **Versioned threshold values** | 🔴 **`OPEN`** | See §3 — zero adopted values exist |
| **D** | **Negative-age comparison semantics** | 🔴 **`OPEN / AUTHORITY-REQUIRED`** | See §5 |
| **E** | **C8 certification authority** | ⚠ **`OPEN — ROLE CLEARED, PERSON NOT NAMED`** *(corrected from `UNKNOWN`)* | §1 |

**Conflicting authority: NONE.** `D4_11`/`D4_12` versus `P00_AUTHORITY_REGISTER` is **not** a
conflict — `P03_SCOPE_AND_BOUNDARY.md` §3.1 expressly reconciles it as historical-versus-current.
**Silence and absence are not conflict.**

---

## 3. Threshold value finding — **OPEN**

Full sweep of tracker, SPEC, P00–P06 records, ADRs, `PROGRAM_STATE`, certification matrices,
freshness contracts, `LA-10`/`LA-23`, fixtures, tests and evidence.

| Candidate | Disposition |
|---|---|
| `ageMs: 1740000` — `p05/evidence-p05-02/05-provenance-asof-version.json:60` | ⛔ **EXAMPLE, not policy** — inside `computedForCleanRun` with `thresholdApplied: false`, `verdict: null`, `owner: 'P07'` |
| `"1 sec"` — `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md:25` | ⛔ **regex artifact** — the filename fragment `IES-005.1 sec.ts` |
| `IIPS Integration Baseline r11` *"Event/freshness/threshold tests"* | ⛔ **existing-IIPS baseline item**, not a P07 value |
| 51 corpus lines matching `threshold`/`stale` near a digit | ⛔ all are **rule IDs, line numbers or section references** — none states a value |
| Test timeouts / implementation constants | **none found** |

> ### 🔴 **THRESHOLD VALUES = OPEN**
> No authoritative record adopts any freshness or staleness threshold value. **None manufactured.**

---

## 4. Scoping decision — **OPEN**

Candidates **A** global · **B** domain-scoped · **C** venue/session-scoped · **D** other:
**no authoritative evidence selects any of them.**

⚠ **C is explicitly not supported as a scoping model.** **SE-3** / **Q-4** establish the session
context as the **baseline thresholds are measured against** — a measurement basis, **not** a
per-venue threshold set. Reading it as the latter would over-read accepted text.

> ### 🔴 **THRESHOLD SCOPING = OPEN**
> Settled: measured against a **session/calendar baseline** (**Q-4**, **SE-3**) — **[ACCEPTED]**.
> Not settled: whether the threshold **set** varies by domain, instrument class or venue.

---

## 5. Negative-age decision — **OPEN / AUTHORITY-REQUIRED**

`receivedAt > asOf` yields `ageMs < 0`. What the corpus **does** establish:

- **LA-23** — *"the age may be negative … That is a **P07 concern to adjudicate**; the adapter
  reports it, it does not judge it."*
- `P05_02_SPECIFICATION.md` §O — *"A **negative age** … is **reported, not silently corrected or
  judged**."*
- Test **H/4** — *"a negative age is reported, not silently corrected or judged"* — **passing**.

What it does **not** establish: **0 hits** for any authoritative *treatment* — clamp, reject,
invalid, zero, current, or otherwise. The **adapter obligation** is settled; the **P07 comparison
semantics** are not.

> ### 🔴 **NEGATIVE-AGE COMPARISON SEMANTICS = OPEN / AUTHORITY-REQUIRED**
> **No treatment chosen here.** Selecting clamp / invalid / reject / current / zero would be
> invention.

---

## 6. Lifecycle decision

| Element | Class | Note |
|---|---|---|
| Threshold-set identity | **[DESIGN]** | no accepted authority |
| Version | **[DESIGN]** | no accepted authority |
| Effective date / effective-from | **[DESIGN]** | no accepted authority |
| Scope | **[DESIGN]** | **model itself OPEN** (§4) |
| Adopting authority | 🔴 **`OPEN`** | §2 A |
| Supersession history | **[DESIGN]** | no accepted authority |
| Reproducibility evidence | **[DESIGN]**, constrained by **RP-1…RP-3 [ACCEPTED]** | **RP-4 [OPEN]** |

⚠ **Immutability and supersession-by-addition are NOT accepted policy.** The corpus does not say
so for thresholds. They remain **[DESIGN]** proposals that mirror the program's own record
discipline, carrying no authority.

---

## 7. P07-02 consequence — unchanged, unsoftened

| | |
|---|---|
| Entry *"Time semantics stable"* | **NOT blocked by O-1** — time semantics established (five distinct times, **TS-6**, **D-4**, **T-1**; P01 gate item 4 = **PASS**) |
| Can it start? | **NO** — **Hard** dependency **P07-01** is `NOT STARTED`, and **IMPLEMENTATION = NOT YET PERMITTED**. Neither is an O-1 question |
| Exit *"Freshness state reproducible"* | **BLOCKED** by O-1 / **RP-4** — unevidenceable while thresholds are undefined |
| Downstream | **P07-04** (Hard on P07-02) → **P13-01** (Hard, Critical, on P07-04) |

**Hard dependency semantics preserved.** `Dependency Matrix`: *"Freshness/staleness must be
stable before dependent work can be certified."* **No bypass, relaxation or reordering.**
Tracker statuses for P07-01 / P07-02 / P07-04 are **unmodified**.

---

## 8. DECISION OUTCOME

> # 🔴 **OPTION B — OPEN, AUTHORITY PATH STILL UNRESOLVED**
>
> Four of five questions remain fully open (**A**, **B**, **C**, **D**); the fifth (**E**) is
> **role-cleared but person-unnamed**, so no certification act can occur either.
>
> **Not Option A** — the corpus does **not** establish an authority path sufficient to conduct a
> valid exact-value adoption act, because **no authority is designated to adopt the values**.
> **Not Option C** — there is **no genuine conflict** between authoritative records; the one
> apparent divergence is expressly reconciled as historical wording by `P03` §3.1.
>
> **O-1 remains OPEN. No implementation authority is conferred by this act.**

### 8.1 What a valid named-authority adoption act must supply

| # | Requirement | Currently |
|---|---|---|
| 1 | Designate the **threshold-adopting authority** | 🔴 absent |
| 2 | Decide the **scoping model** (§4) | 🔴 absent |
| 3 | Adopt a **versioned threshold set** satisfying all ten elements of `PHASE_07_THRESHOLD_AUTHORITY_PATH.md` §2 | 🔴 absent |
| 4 | Adjudicate **negative-age comparison semantics** | 🔴 absent |
| 5 | Name a **person for the A2 role** so C8 certification can eventually be exercised | 🔴 absent (role cleared, `person_named: false`) |

**The mechanism shape exists** — `ADR-01-A1` *"APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING"*,
whose owner column in `P00_AUTHORITY_REGISTER.md:38` is explicit (**Sai/Ramki**) *for the
namespace token*. ⚠ **That is recorded as fact, not extended by inference:** no owner is
recorded for freshness threshold values, and none is inferred here.

---

## 9. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — `12254bc` and every historical record left **unedited** |
| Source / test / fixture / evidence changes | **0** |
| Guards weakened, bypassed or varied | **none** |
| Numeric threshold values supplied | **none** |
| Persons designated or inferred | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every claim cites a line in an existing record or a tracked source file.*
