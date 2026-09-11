# PHASE 07 — O-1 THRESHOLD DECISION INPUT PACKAGE

> **ACT TYPE:** Authority **decision input**. **NO IMPLEMENTATION.**
> **PURPOSE:** Reduce the five unresolved O-1 authority questions to a compact, decidable table
> with **only** the choices the authoritative corpus actually supports, so that the program
> authority can decide without a further evidence sweep.
> **THIS RECORD DECIDES NOTHING.** It fabricates no value, names no person, and selects no
> option. Every `▢ AWAITING AUTHORITY` cell must be completed by an explicit authority act.
> **Supersedes nothing. Append-only.**

---

## 0. Controlling boundary — unchanged

| | |
|---|---|
| **P07 ENTRY** | **`AUTHORIZED`** |
| **P07 CONTRACT / DESIGN** | **`ESTABLISHED`** |
| **P07 IMPLEMENTATION** | ⛔ **`NOT YET PERMITTED`** |
| **P07 ACCEPTANCE** | **`NOT ESTABLISHED`** |
| **P07 CERTIFICATION** | **`NONE GRANTED`** |

**O-1 = OPEN.** Baseline of record: Track B `e806e63942e1f7a52db9f9d96227b7bd9d8f26dc`.
Prior records: `D13` `7fe5aaa` · `D14` `a5720a4` · `D15` `641158c` · authority path `12254bc` ·
reconciliation `e806e63`.

### 0.1 Explicitly NOT valid ways to close any decision below

| ✗ | Why it is invalid | Anchor |
|---|---|---|
| Inferring a person from a role name | *"**No individual names are recorded. None may be inferred** from commit messages, repository ownership, code authorship or document authorship."* | `P00_AUTHORITY_REGISTER.md:67` |
| Treating **P07 phase ownership** as value-adoption authority | `thresholdOwner: 'P07'` is **who computes**; it designates **no adopting authority** | `liveAdapterContract.js:215` |
| Treating **§3 general approval** as conferring exact values | §3 *"**Does NOT confer** … Certification · gate acceptance · production activation · **a namespace token string**"* | `P00_DECISION_LOG.md:53` |
| Treating **A2 role clearance** as a person designation | `person_named: false` — *"none is inferred or assigned"* | `P03_SCOPE_AND_BOUNDARY.md:75` |
| Carrying **prior P05 / P06 A3 acceptors** into P07 | D10-3 designation is *"**scoped to the P06 gate only**"*; *"**Does not extend to P07–P17**"* | `PROGRAM_STATE.md:482`, `:27` |

---

## 1. DECISION 1 — THRESHOLD-ADOPTING AUTHORITY

**Current state:** 🔴 `OPEN / AUTHORITY-REQUIRED`. **No designated authority.**

The corpus contains exactly three *mechanism shapes* by which an authority of this kind has
ever been established. **None has been exercised for freshness thresholds.** No individual is
named here.

| Option | Mechanism shape (as evidenced) | Precedent in corpus |
|---|---|---|
| **M1** | An **explicit value-adoption decision** by the program authority of record, recorded as its own decision entry stating the values | §3 program-authority convention, `P00_DECISION_LOG.md:49` — ⚠ but §3's general form **does not confer values** (`:53`), so the entry must be **explicit about the values**, not a "move forward" approval |
| **M2** | **Naming a person** against an existing cleared authority role — i.e. flipping `person_named` to `true` | the **A1–A4** role pattern, `P00_AUTHORITY_REGISTER.md:26-31`; `D10-3` named an **A3** for P06 |
| **M3** | A new **named-authority rule** of the **G-A** kind — *"NAMED AUTHORITY REQUIRED"* for a defined decision class | G-A rule, `P00_DECISION_LOG.md:264` — ⚠ currently scoped to *"certified **engine-layer contract/component** changes"*; extending it to P07 thresholds would itself be a decision |

> ### ▢ **DECISION 1 — AWAITING AUTHORITY**
> **Adopting mechanism:** ▢ M1 · ▢ M2 · ▢ M3 · ▢ other (must be explicitly defined)
> **Designated authority (name or explicit designation):** ▢ `________________`
>
> **If no mechanism and authority are explicitly supplied, the state remains:**
> **`NO DESIGNATED AUTHORITY — EXPLICIT AUTHORITY DESIGNATION REQUIRED`**

---

## 2. DECISION 2 — THRESHOLD SCOPING

**Current state:** 🔴 `OPEN`. **No model selected.** All four are structurally admissible;
**the corpus selects none.**

| Option | Model | Evidence status |
|---|---|---|
| **A** | **Global** — one threshold set for all domains/instruments/venues | admissible; not evidenced |
| **B** | **Domain / instrument** — a set per domain or instrument class | admissible; **not** evidenced. Tracker `Parallel Execution r6` *"controls **can** split by domain"* is **permissive parallelization language, not a scoping authority** |
| **C** | **Venue / session** — a set per venue or session context | admissible; **not** evidenced. ⚠ **SE-3** / **Q-4** make the session context the **measurement baseline**, **not** a per-venue threshold set — choosing C must not be justified by that text |
| **D** | **Other explicitly defined model** | admissible **only** if the model is explicitly defined by the authority |

**Constraint binding on every option:** thresholds are measured against a **session/calendar
baseline** — **Q-4** (`P01_DATA_CONTRACT.md:255`), **SE-3**
(`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md:109`) — **[ACCEPTED]**.

> ### ▢ **DECISION 2 — AWAITING AUTHORITY**
> **Scoping model:** ▢ A · ▢ B · ▢ C · ▢ D (define: `________________`)
> **Until selected: `THRESHOLD SCOPING = OPEN`**

---

## 3. DECISION 3 — VERSIONED THRESHOLD SET

**Current state:** 🔴 `THRESHOLD VALUES = OPEN`. **No value exists in the corpus and none is
supplied here.**

The authority must supply one row per threshold. **Every cell below is mandatory.**

| Field | Requirement | Class |
|---|---|---|
| **T-IDENTITY** | stable identifier for the threshold | **[DESIGN]** |
| **1 Freshness dimension** | exactly one of **FD-1** data age · **FD-2** delivery latency · **FD-3** session context · **FD-4** completeness basis | **[DESIGN]** |
| **2 Scope** | domain / instrument class / venue context, per Decision 2 | 🔴 blocked on **D2** |
| **3 Exact value** | the number | 🔴 **`OPEN / AUTHORITY-REQUIRED`** |
| **4 Declared unit** | must be **declared** and drawn from a **versioned enumeration** — **UN-1** *"Every dimensioned quantity carries `unit`"*; **UN-2** *"free-text units are **invalid**"* | ✅ **[ACCEPTED]** constraint |
| **5 Comparison semantics** | strict vs inclusive boundary; behaviour at equality | **[DESIGN]** |
| **6 Effective version / date** | from which schema/data version the value governs | **[DESIGN]** |
| **7 Adopting authority** | per Decision 1 | 🔴 blocked on **D1** |
| **8 Reproducibility evidence identity** | the evidence artifact that demonstrates the value applied | **[DESIGN]** |

**Set-level fields also required:** threshold-set identity · version · effective date ·
supersession history. ⚠ These are **[DESIGN]** — **immutability and supersession-by-addition
are NOT accepted policy** and must not be asserted as such.

> ### ▢ **DECISION 3 — AWAITING AUTHORITY**
> **Threshold set:** ▢ `not supplied — THRESHOLD VALUES = OPEN`
> **Until a complete set is supplied, no freshness state is reproducible (RP-4).**

---

## 4. DECISION 4 — NEGATIVE-AGE SEMANTICS (`receivedAt > asOf`)

**Current state:** 🔴 `OPEN / AUTHORITY-REQUIRED`. **No treatment chosen.**

**Already settled (not a decision):** the **adapter obligation** — the negative age is
*"reported, not silently corrected or judged"* (**LA-23**; `P05_02_SPECIFICATION.md` §O; test
**H/4** passing). **LA-23** expressly delegates the judgement: *"That is a **P07 concern to
adjudicate**."* The decision below operates **downstream** of that report.

| Option | Treatment | Consequence the authority must accept |
|---|---|---|
| **N1** | **Reject / invalid** — treat as a contract violation | must be expressed as a **rejection (error class)**, **never** as a quality value — **Q-5** *"A contract violation is not a quality state"*; **E2–E8** *"none may be expressed as a quality value"* |
| **N2** | **Clamp** — floor the age at zero | the reported `ageMs` and the evaluated age would differ; the difference must be recorded, not silent |
| **N3** | **Zero** — evaluate as age 0 (i.e. maximally fresh) | asserts freshness the data does not support; conflicts with *"stale data never silently appears current"* unless explicitly justified |
| **N4** | **Another explicitly defined treatment** | must be defined in full by the authority |

**Constraints binding on every option:**

| Constraint | Anchor |
|---|---|
| `quality` enum **unchanged**: `good \| stale \| partial \| unavailable` — no new value may be introduced | **Q-1** `P01_DATA_CONTRACT.md:252`; `p05/src/contract.js:20` |
| **E1 is the only quality-bearing condition** in the chain | `P03_FAILURE_AND_DEGRADED_MODE.md:62`; `P02_ERROR_TAXONOMY.md:32` |
| **Quality never coerced** | **INV-7** `P01_DATA_CONTRACT.md:57` |
| Contract violation ≠ quality state | **Q-5** `P01_DATA_CONTRACT.md:256` |

> ### ▢ **DECISION 4 — AWAITING AUTHORITY**
> **Negative-age treatment:** ▢ N1 · ▢ N2 · ▢ N3 · ▢ N4 (define: `________________`)
> **Until selected: `NEGATIVE-AGE COMPARISON SEMANTICS = OPEN / AUTHORITY-REQUIRED`**

---

## 5. DECISION 5 — C8 PERSON DESIGNATION

**Current state:** ⚠ **`OPEN — ROLE CLEARED, PERSON NOT NAMED`**

**The distinction this decision turns on:**

| | **ROLE CLEARED** ✅ current | **PERSON DESIGNATED** ▢ required |
|---|---|---|
| What it means | an owner **role** exists for C1–C12 | a **named** individual holds it |
| Record | **A2** = `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED` | `person_named` would become **`true`** |
| Certification possible? | **NO** | still requires an **evidence-bearing certification act** |
| Source | `P00_AUTHORITY_REGISTER.md:15`; `D8_STATUS.json` `authority_status.A2` | `P00_DECISION_LOG.md:157,:224` — `a2_person_named: false` |

⚠ **Role clearance is not a person designation, and neither is certification.**
*"Certification must never be inferred from authority approval."* (`P00_AUTHORITY_REGISTER.md` §7)

**C8 scope:** *"Provenance/quality/freshness derivation"* (`D4_11_CERTIFICATION_MATRIX.md:46`) —
⚠ that line's *"UNKNOWN"* is **historical wording, quoted not adopted** (`P03_SCOPE_AND_BOUNDARY.md` §3.1).

> ### ▢ **DECISION 5 — AWAITING AUTHORITY**
> **A2 person for C8 certification:** ▢ `________________`
> **If not explicitly designated: `C8 = OPEN — ROLE CLEARED, PERSON NOT NAMED`**

---

## 6. DECISION 6 — SUFFICIENCY TEST FOR CLOSING O-1

**O-1 becomes `RESOLVED` only when all five decisions are explicitly supplied.** Partial supply
leaves O-1 `OPEN`; there is no partial closure.

| # | Required element | Supplied? |
|---|---|---|
| **D1** | Threshold-adopting authority explicitly designated | ▢ |
| **D2** | Scoping model explicitly selected (or explicitly defined under option D) | ▢ |
| **D3** | Complete versioned threshold set — all 8 fields per threshold + set-level fields | ▢ |
| **D4** | Negative-age treatment explicitly selected | ▢ |
| **D5** | A2 person explicitly named for C8 | ▢ |

> ### 🔴 **CAN O-1 BE RESOLVED NOW FROM EXISTING AUTHORITY? — NO**
>
> **All five cells are unsupplied.** No existing record supplies any of them, and none may be
> inferred. **`O-1 = OPEN`.**
>
> **Note on D5:** naming the A2 person is required for **C8 certification** of the P07 gate. It
> is **not** required for the threshold values themselves to be *adopted* — but the P07 gate
> cannot be certified without it (`P00_GATE_MODEL.md:44`, certification before progression
> **YES (C7, C8)**).

---

## 7. COMPACT DECISION TABLE — for the program authority

| ID | Decision | Valid choices | **AUTHORITY INPUT** |
|---|---|---|---|
| **D1** | Threshold-adopting authority | **M1** explicit value-adoption decision · **M2** name a person for an existing cleared role · **M3** new G-A-style named-authority rule · other (define) | ▢ `__________` |
| **D2** | Threshold scoping | **A** global · **B** domain/instrument · **C** venue/session · **D** other (define) | ▢ `__________` |
| **D3** | Versioned threshold set | authority-supplied rows, 8 mandatory fields each | ▢ `__________` |
| **D4** | Negative-age treatment | **N1** reject/invalid · **N2** clamp · **N3** zero · **N4** other (define) | ▢ `__________` |
| **D5** | A2 person for C8 | explicit name, or explicit refusal to designate | ▢ `__________` |

**Nothing in this table is pre-filled. Nothing is recommended.**

---

## 8. Consequence for P07-02 — unchanged, unsoftened

| | |
|---|---|
| Entry *"Time semantics stable"* | **NOT blocked by O-1** |
| Can P07-02 start? | **NO** — **Hard** dep **P07-01** `NOT STARTED` **and** `IMPLEMENTATION = NOT YET PERMITTED` |
| Exit *"Freshness state reproducible"* | **BLOCKED** by O-1 / **RP-4** |
| Downstream | **P07-04** (Hard on P07-02) → **P13-01** (Hard, Critical, on P07-04) |

**No Hard dependency weakened, relaxed or reordered. No tracker status altered.**

---

## 9. NO IMPLEMENTATION — attestation

| | |
|---|---|
| P07 source / tests / fixtures | **none created, none modified** — no `docs/p07`, no P07 implementation exists |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` | **untouched** |
| Provider integrations | **untouched** — no provider selected, no connectivity |
| Tracker statuses · P07-01 / P07-02 / P07-04 dependency state | **unmodified** |
| Implementation commit | **none** |
| Acceptance / certification granted | **none** |

### 9.1 Implementation-gate closure rule — recorded, not satisfied

> **IMPLEMENTATION COMMITTED + PUSHED TO AUTHORITATIVE REMOTE + LOCAL SHA == REMOTE SHA
> INDEPENDENTLY VERIFIED = DURABLE IMPLEMENTATION CLOSURE.**
> `/tmp` and sandbox artifacts alone **never** satisfy this.
>
> ⚠ **This act is not an implementation act and closes no implementation gate.** No P07
> implementation exists to commit, push or verify. **`P07 IMPLEMENTATION = NOT YET PERMITTED`
> is unchanged.** No state below may be reported: `P07 IMPLEMENTATION CLOSED` · `P07 ACCEPTED` ·
> `P07 CERTIFIED` · `O-1 IMPLEMENTED`.

---

## 10. Is a further durable authority record required?

**YES — after an actual decision, not now.** This record is the **input**; it records **no
decision**. When the program authority supplies the Decision Table in §7:

1. **A new append-only record is required** — the adoption act itself, capturing the selected
   options, the exact values, the designated authority and the effective version. **It must not
   be created by editing this file, `12254bc` or `e806e63`** (append-only discipline).
2. That record becomes the **authority of record for O-1**, at which point **O-1 may move to
   `RESOLVED`** — and only if **all five** elements are supplied.
3. **A threshold-set adoption does not by itself authorize P07 implementation.** Implementation
   permission requires its own explicit authority act.
4. Its filename must satisfy the repository guards verified for this file: no `P07[_-]`, no
   `docs/p07/`, and **not** `D16`/`D17`/`D20` as a decision number (`D16`/`D17`/`D20` are
   occupied by frozen-methodology identifiers).

---

## 11. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — `12254bc`, `e806e63` and every historical record left **unedited** |
| Source / test / fixture / evidence changes | **0** |
| Numeric threshold values supplied | **none** |
| Persons named or inferred | **none** |
| Options selected on the authority's behalf | **none** |
| Guards weakened, bypassed or varied | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every constraint above cites a line in an existing record or a tracked source file.*
