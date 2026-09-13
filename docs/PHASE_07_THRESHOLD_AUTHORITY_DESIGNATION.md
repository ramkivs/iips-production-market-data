# PHASE 07 — O-1 THRESHOLD-ADOPTING AUTHORITY DESIGNATION

> **ACT TYPE:** Append-only **authority designation** record. **NO IMPLEMENTATION.**
> **SCOPE:** Records **exactly one** resolved decision — **D1**, the threshold-adopting
> authority — on the basis of an explicit program-authority statement.
> **RECORDS NO VALUE, NO SCOPING MODEL, NO NEGATIVE-AGE TREATMENT AND NO PERSON.**
> **Supersedes nothing. Edits nothing.** Prior records `12254bc`, `e806e63`, `8ae4b60` are
> preserved byte-for-byte.

---

## 0. Controlling boundary — unchanged

| | |
|---|---|
| **P07 ENTRY** | **`AUTHORIZED`** |
| **P07 CONTRACT / DESIGN** | **`ESTABLISHED`** |
| **P07 IMPLEMENTATION** | ⛔ **`NOT YET PERMITTED`** |
| **P07 ACCEPTANCE** | **`NOT ESTABLISHED`** |
| **P07 CERTIFICATION** | **`NONE GRANTED`** |

Baseline of record: Track B `8ae4b60475c702e0dbda38d6f77a13d43cef6aec`.

---

## 1. The explicit authority statement — captured verbatim

> *"We are the authority for O-1. We designate the threshold-adopting authority, choose the
> scoping model, adopt these exact threshold values, decide negative-age semantics, and
> designate the A2/C8 certification person."*

Recorded as an **explicit program-authority designation for O-1**.

---

## 2. D1 — THRESHOLD-ADOPTING AUTHORITY = ✅ **RESOLVED**

| Field | Recorded value |
|---|---|
| **Decision** | **D1 — Threshold-adopting authority** |
| **Selected mechanism** | **M1** — an explicit program-authority decision (`PHASE_07_THRESHOLD_DECISION_INPUT.md` §1) |
| **Designated authority** | **The program authority** — the party making the statement in §1, referring to itself as *"we"* |
| **Basis** | The explicit statement in §1. **Not** inferred from role name, precedent, prior acceptance, A2/A3/C7/C8, or repository/commit/document authorship |
| **Prior state** | `NO DESIGNATED AUTHORITY — EXPLICIT AUTHORITY DESIGNATION REQUIRED` |
| **New state** | ✅ **`DESIGNATED — PROGRAM AUTHORITY`** |
| **Individual named?** | ⚠ **NO.** The designation is of the **program authority as such**. **No individual is named, and none is inferred** — `P00_AUTHORITY_REGISTER.md:67`: *"No individual names are recorded. None may be inferred from commit messages, repository ownership, code authorship or document authorship."* |
| **Effective authority boundary** | Adoption of **O-1 freshness/staleness threshold policy and values only** — i.e. decisions **D2, D3, D4** below |

### 2.1 ⚠ What D1 does **NOT** confer

| ✗ | Why |
|---|---|
| **P07 implementation permission** | O-1 resolution is **not** implementation authorization. A separate explicit act is required |
| **Any threshold value** | §3 of `P00_DECISION_LOG.md:53` — the general authority form *"**Does NOT confer** … a namespace token string"*; exact values must be **stated**, never implied by the designation |
| **A scoping model** | D2 unsupplied — §3 below |
| **A negative-age treatment** | D4 unsupplied — §3 below |
| **The A2 / C8 certification person** | ⚠ **The threshold-adopting authority is NOT the certification authority.** These are **distinct**. The A2 role is *"Implementation / Certification Authority"*; `person_named: false` remains. **The designation of the program authority as threshold-adopting authority does not name, and must not be read as naming, the A2/C8 person** |
| **Gate acceptance or certification** | `P00_AUTHORITY_REGISTER.md` §7 — *"Certification must never be inferred from authority approval."* |

---

## 3. The authority statement does **NOT** contain D2–D5

Each clause was tested against what it actually supplies:

| Decision | Clause in the statement | Does it supply the decision? | State |
|---|---|---|---|
| **D2** scoping | *"choose the scoping model"* | ❌ **declares intent to choose; names no model** — no **A / B / C / D** | 🔴 **`UNSUPPLIED`** |
| **D3** values | *"adopt these exact threshold values"* | ❌ **refers to "these" values but states none** — no dimension, scope, value, unit, comparison semantics, effective version or evidence identity | 🔴 **`UNSUPPLIED`** |
| **D4** negative age | *"decide negative-age semantics"* | ❌ **declares intent to decide; selects no treatment** — no **N1 / N2 / N3 / N4** | 🔴 **`UNSUPPLIED`** |
| **D5** A2/C8 person | *"designate the A2/C8 certification person"* | ❌ **declares intent to designate; names no person** | 🔴 **`UNSUPPLIED`** |

> **A declaration of intent to decide is not a decision.** Recording any of D2–D5 from this
> statement would be invention.

---

## 4. Inference prohibitions honoured

| Prohibition | Honoured |
|---|---|
| Do not choose global / domain / venue / session scope | ✅ none chosen |
| Do not invent threshold values | ✅ none supplied |
| Do not choose a negative-age treatment | ✅ none chosen |
| Do not name an A2/C8 person | ✅ none named |
| Do not infer a person from *"we"* | ✅ recorded as *the program authority*; **no individual named or inferred** |
| Do not infer any individual named in prior authority records | ✅ **no individual is named anywhere in this record** as the O-1 designee or otherwise |
| Do not infer a threshold unit or value | ✅ none |
| Do not infer implementation permission | ✅ `IMPLEMENTATION = NOT YET PERMITTED` preserved |
| Do not treat P07 ownership as value-adoption authority | ✅ D1 rests on the **explicit statement**, not on `thresholdOwner: 'P07'` |
| Do not treat prior P05/P06 acceptors as P07 authorities | ✅ none carried forward |
| Do not treat the cleared A2 role as a named person | ✅ `person_named: false` preserved |
| Do not treat §3 general approval as conferring exact values | ✅ §2.1 records this expressly |

---

## 5. What the program authority must still supply

| ID | Required input | Choices |
|---|---|---|
| **D2** | exactly one scoping model | **A** global · **B** domain/instrument · **C** venue/session · **D** other (define) |
| **D3** | the actual threshold rows | **8 mandatory fields each** — dimension · scope · exact value · declared unit · comparison semantics · effective version · adopting authority · evidence identity — **plus** set-level identity · version · effective date · supersession relationship |
| **D4** | exactly one treatment for `receivedAt > asOf` | **N1** reject/invalid · **N2** clamp · **N3** zero · **N4** other (define) |
| **D5** | the named A2/C8 certification person | explicit name, **or** an explicit refusal to name — which preserves **`C8 = OPEN — ROLE CLEARED, PERSON NOT NAMED`** |

**Constraints already binding and unchanged:** **UN-1** / **UN-2** (units declared, from a
versioned enumeration; free-text units invalid) · **Q-1** quality enum unchanged
`good|stale|partial|unavailable` · **INV-7** quality never coerced · **Q-5** a contract
violation is not a quality state · **E1** the only quality-bearing class · session/calendar
baseline (**Q-4**, **SE-3**).

---

## 6. Resulting O-1 state

| | |
|---|---|
| **D1** adopting authority | ✅ **`RESOLVED`** — program authority |
| **D2** scoping | 🔴 **`UNSUPPLIED`** |
| **D3** threshold values | 🔴 **`UNSUPPLIED`** |
| **D4** negative-age semantics | 🔴 **`UNSUPPLIED`** |
| **D5** A2/C8 person | 🔴 **`UNSUPPLIED`** |

> # 🔴 **O-1 = OPEN — PARTIAL AUTHORITY DECISION ONLY**
>
> **One of five decisions is resolved. Four remain unsupplied.** O-1 becomes `RESOLVED` only
> when **D1–D5 are all explicitly supplied**. **There is no partial closure.**
>
> **D1 alone unblocks nothing operationally** — no threshold value exists, so **RP-4** stands
> and P07-02's exit criterion *"Freshness state reproducible"* remains unevidenceable.

### 6.1 P07-02 consequence — unchanged, unsoftened

Entry *"Time semantics stable"* **not blocked by O-1** · **cannot start** (Hard dep **P07-01**
`NOT STARTED` **and** `IMPLEMENTATION = NOT YET PERMITTED`) · exit **BLOCKED** by O-1 / **RP-4** ·
downstream **P07-04** → **P13-01**. **No Hard dependency weakened, relaxed or reordered. No
tracker status altered.**

---

## 7. Mutation statement

| | |
|---|---|
| Artifacts created | **exactly one** — this file |
| Files modified | **0** — `12254bc`, `e806e63`, `8ae4b60` and every historical record **unedited** |
| Source / test / fixture / evidence changes | **0** |
| `LiveDataRuntime` · `PluginLoader` · `PluginNamespace` · provider integrations · tracker | **untouched** |
| Numeric threshold values supplied | **none** |
| Persons named or inferred | **none** |
| D2 / D3 / D4 / D5 selected on the authority's behalf | **none** |
| Guards weakened, bypassed or varied | **none** |
| Acceptance / certification granted | **none** |
| `origin/main` | **untouched** |

*Append-only. Every constraint above cites a line in an existing record or a tracked source file.*
