# CHECKPOINT-03 — POST-P04 / OI-10 RESOLVED / PRE-P05 BOUNDARY

> **Reconciliation and preservation artifact only.** It introduces **no new methodology, no new
> scope, and no gate promotion**. It records one authority state change that was decided
> **outside** this artifact (OI-10) and reconciles the program ledger to it. Every other
> statement is a pointer to, or a restatement of, an already-committed artifact.
>
> **Companion index:** `docs/PROGRAM_STATE.md` (session recovery manifest).
> **Predecessor:** CHECKPOINT-02 — P03 accepted state (`docs/CHECKPOINT-02.md`).
> **Git-history provenance qualification:** `docs/INCIDENT-01_HISTORY_LOSS.md`.

⚠ **This checkpoint is BEFORE P05 entry.** It performs **no P05 entry assessment**, grants
**no P05 authorization**, creates **no P05 work package**, and performs **no P05
implementation**.

---

## 1. Checkpoint identity

| Field | Value |
|---|---|
| **Checkpoint** | **CHECKPOINT-03** |
| **Name** | Post-P04 / OI-10 Resolution / Pre-P05 Boundary |
| **Purpose** | Preserve the authoritative state **immediately after P04 formal acceptance and OI-10 resolution, and before any P05 entry assessment** |
| **Source acceptance commit** | **`faf1317eccaf77dbdab2a520899802043c851cca`** — *"P04 GATE ACCEPTED: Identity/master gate (5 of 18)"* |
| **P04 work-package commit** | **`6ec3b288c8deeee317a63341297bd33b9a090f4f`** — *"P04: instrument/security master work package (specification only)"* |
| **Predecessor checkpoint** | CHECKPOINT-02 — commit pin **not independently establishable** (INCIDENT-01); content authority is `docs/CHECKPOINT-02.md` |
| **Branch** | `arena/01a0814b-iips-production-market-data` |
| **Nature** | **Reconciliation + preservation only.** No P05 work, no implementation, no gate promotion |

### 1.1 Predecessor pin — honest statement

CHECKPOINT-02's own commit, and the acceptance commits for P00–P03, are **permanently
unavailable** (`docs/INCIDENT-01_HISTORY_LOSS.md`). Per rule **O-4**, no substitute hash is
invented. Those gates are pinned **by artifact**, not by hash. The two commits pinned in §1
above are independently verified live objects on this branch.

---

## 2. Accepted-gate chain

**P00 → P01 → P02 → P03 → P04** — **5 of 18 accepted.**

| Gate | Name | Acceptance record | Acceptance commit |
|---|---|---|---|
| **P00** | Governance | `docs/p00/P00_GATE_ACCEPTANCE.md` | commit not independently established (INCIDENT-01) |
| **P01** | Data Contract | `docs/p01/P01_GATE_ACCEPTANCE.md` | commit not independently established (INCIDENT-01) |
| **P02** | Provider Abstraction | `docs/p02/P02_GATE_ACCEPTANCE.md` | commit not independently established (INCIDENT-01) |
| **P03** | Secrets / Security | `docs/p03/P03_GATE_ACCEPTANCE.md` | commit not independently established (INCIDENT-01) |
| **P04** | Security Master / Identity | `docs/p04/P04_GATE_ACCEPTANCE.md` | **`faf1317eccaf77dbdab2a520899802043c851cca`** ✅ live |

**P05–P17 remain NOT ACCEPTED.**

### 2.1 Commit chain CHECKPOINT-02 → CHECKPOINT-03

```
eae2ff6  chore: align program baseline with IIPS integration boundary   (grafted root)
9a26ac7  RESTORE: accepted P00-P03 + CHECKPOINT-02 after sandbox re-clone
6ec3b28  P04: instrument/security master work package (specification only)
faf1317  P04 GATE ACCEPTED: Identity/master gate (5 of 18)               ← state preserved here
```

### 2.2 No historical rewriting

The P04 acceptance commit `faf1317` changed exactly three files —
`docs/p04/P04_GATE_ACCEPTANCE.md` (new), `docs/p00/P00_GATE_MODEL.md`,
`docs/PROGRAM_STATE.md`. The 12 P04 work-package artifacts, the P00–P03 acceptance records,
CHECKPOINT-02, INCIDENT-01 and all of `docs/d4/ d5/ d7/ d8/` were **byte-identical** across
it. This checkpoint preserves that property.

---

## 3. OI-10 — RESOLVED

> ## **OI-10 STATUS: RESOLVED**
> ## **Exact namespace token: `MD:`**
> ## **Canonical field-key form: `MD:<domain>.<field>`**

| Field | Content |
|---|---|
| **Prior status** | `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` — authority cleared, literal token **not recorded** |
| **Current status** | **RESOLVED — exact token recorded** |
| **Token** | **`MD:`** |
| **Canonical form** | **`MD:<domain>.<field>`** |
| **Resolution instrument** | Explicit program-authority recording act, external to this artifact. Recorded here; **not decided here** |
| **Authority** | ADR-01 token authority (Ramki / Sai as recorded in `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:193`). ⚠ **No individual is named as having personally signed** — the clearance model is A1–A4, `person_named: false` |
| **Design basis (unchanged)** | `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.2–I.3 — `MD:` was the measured recommendation because no existing engine input key contains `:`; the **partition property** is what is load-bearing |
| **Blocked phases released** | P05, P06, P11 — **released from the OI-10 blocker only**, not from their other preconditions |

### 3.1 The recommendation → decision transition

`MD:` was **already the recorded recommendation** in `D4_07_FIELD_NAMESPACE.md` and
`ADR-01_NAMESPACE_COLLISION_GUARD.md` §C.1. This resolution **adopts the existing
recommendation**; it introduces **no new token, no new form and no design change**. There is
**no competing or alternative namespace token** anywhere in the corpus — ADR-01 §C.1 states
only that *an* alternative satisfying the same disjointness property would have been equally
acceptable to the design; **none was ever proposed or recorded**.

### 3.2 Collision rules C1–C6 — UNCHANGED

Verified verbatim against `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` §C.2:

| # | Rule | Status |
|---|---|---|
| **C1** | Namespace partition — every `data.fields` key MUST carry the namespace; non-namespaced = hard error | **UNCHANGED** |
| **C2** | Reverse partition — no `companyInputs` key may carry the namespace | **UNCHANGED** |
| **C3** | Intersection test — `keys(data.fields) ∩ keys(companyInputs)` MUST be empty | **UNCHANGED** |
| **C4** | Cross-snapshot test — pairwise key intersections MUST be empty | **UNCHANGED** |
| **C5** | **Fail-closed abort** — any C1–C4 violation aborts execution; no partial merge, no precedence, no coercion | **UNCHANGED** |
| **C6** | Deterministic merge order where merging is legal | **UNCHANGED** |

Resolving the token **changes no rule**. It makes C1/C2 **mechanically checkable**, which they
previously were not (`docs/p01/P01_VALIDATION_RULES.md:53`,
`docs/p02/P02_DEPENDENCY_REGISTER.md` DEP-P02-01). ⚠ Mechanical checking becoming *possible*
is **not** the same as it being *implemented* — no executable guard exists, and none is
authorized here.

### 3.3 What OI-10 resolution does NOT do

| # | It does **not** mean |
|---|---|
| 1 | That P05 is authorized, started or accepted |
| 2 | That P06 or P11 are unblocked in any sense beyond the OI-10 blocker itself |
| 3 | That the collision guard is implemented — **`DataBoundExecutor` / `LiveDataRuntime.ts` remain untouched** |
| 4 | That `namespaceVersion`'s first recorded value is set (`P01_VERSIONING_COMPATIBILITY.md` VA-3 — the axis exists; its first value is a P05/P06 artifact) |
| 5 | That any accepted P01/P02 canonical key is rewritten from `<NS>` to a literal — **those records are NOT edited** (§10) |
| 6 | That certification C1/C2 (`D4_11_CERTIFICATION_MATRIX.md`) are satisfied |
| 7 | That OI-P04-04, provider selection or entitlement are affected in any way |
| 8 | That AD-16's ADR is closed beyond its token sub-decision |

---

## 4. OI-08 and OI-09 — unchanged, not reopened

| Item | Status | Content | Touched here |
|---|---|---|---|
| **OI-08** identity cardinality | **RESOLVED** | **1:N** — one canonical security identity to N provider/listing identities | **NO** |
| **OI-09** external identifier standard | **RESOLVED** | **FIGI / OpenFIGI** authoritative; canonical ID remains **distinct from** FIGI; `companyId` unchanged as CSIP join key | **NO** |

Both were resolved by explicit program authority prior to P04 acceptance and are recorded in
`docs/p04/P04_GATE_ACCEPTANCE.md` §3. This checkpoint **does not reopen, reinterpret,
downgrade or substitute** either.

---

## 5. P05 boundary — the load-bearing section

### 5.1 Precondition evaluation

P05's recorded entry precondition (`docs/d8/D8_EXECUTION_AUTHORIZATION.md:90`):

> *"P05 Acquisition | P02 + P04 complete **and exact namespace token recorded**"*

| Precondition | State | Verdict |
|---|---|---|
| P02 complete | **ACCEPTED** — `docs/p02/P02_GATE_ACCEPTANCE.md` | **MET** |
| P04 complete | **ACCEPTED** — `docs/p04/P04_GATE_ACCEPTANCE.md`, `faf1317` | **MET** |
| Exact namespace token recorded | **`MD:`** recorded — §3 | **MET** |

> ### **P05 ENTRY PRECONDITIONS: MET**

### 5.2 ⚠ Preconditions MET ≠ authorization

| Statement | Assertion |
|---|---|
| **P05 status** | **NOT_STARTED · NOT_ACCEPTED · NOT_AUTHORIZED** |
| Preconditions met means | The **recorded blockers to *assessing* P05 entry** are cleared |
| Preconditions met does **not** mean | Entry assessed · entry granted · work package created · implementation authorized · gate accepted |
| **What is still required** | An **explicit P05 entry/authorization act** by the A3 gate-acceptance authority, preceded by a P05 entry assessment — exactly as P04 required after CHECKPOINT-02 |
| Performed by this checkpoint | **NONE of it** |

The program's own convention is decisive here: after CHECKPOINT-02, P00–P03 were accepted and
P04's dependencies were listed — and P04 still required a **separate entry assessment** (which
returned `P04 ENTRY BLOCKED — CONTENT DECISION`), a **separate authority act** on OI-08/OI-09,
a **separate work package**, and a **separate acceptance act**. P05 gets the same treatment.

### 5.3 P05 constraints carried forward — NOT cleared by OI-10

⚠ **These are independent of OI-10 and remain open.** Resolving the token does **not** touch
any of them.

| # | Constraint | Status | Source |
|---|---|---|---|
| **1** | **OI-P04-04 — FIGI source availability, licensing, coverage** | **OPEN**. OI-09 selected FIGI as the *standard*; **how FIGI values are obtained** — source, licensing, coverage gaps, refresh cadence — is **unspecified** | `docs/p04/P04_OPEN_ITEMS.md` §OI-P04-04; `DEP-P04-10` |
| **2** | **Provider selection** | **NONE MADE.** No vendor is selected; selecting one is expressly prohibited | `P04_OPEN_ITEMS.md` INV-10 |
| **3** | **Entitlement matrix** | **EMPTY** | `P04_OPEN_ITEMS.md` INV-10 |
| **4** | Credentials / secrets material | **NONE.** P03 is specification only; no secret exists or may be exposed | `docs/p03/` |
| **5** | **OI-P04-03 — governance attribute set** | **OPEN**, owner A1, `person_named:false`. **Implementation-bounded** per `P04_GATE_ACCEPTANCE.md` §4 IB-1…IB-5 | `P04_GATE_ACCEPTANCE.md` §4 |
| **6** | **OI-P04-01** taxonomy · **OI-P04-02** 1:N downstream (P11/12/13) · **OI-P04-05** executable validation | **OPEN** | `docs/p04/P04_OPEN_ITEMS.md` |
| **7** | **DO-1…DO-5 · DO-P04-1…DO-P04-5** | **DEFERRED — NOT PASSED** | `P04_GATE_ACCEPTANCE.md` §8 |
| **8** | Sole production ingress `MarketDataSource<T> → DataSnapshot<T>` | **INVARIANT** — P05 may not introduce a second ingress | AD-2 |
| **9** | P02 six version axes; E1–E8 error taxonomy | **INVARIANT** — no seventh axis, no provider-native shape leakage | `docs/p02/` |

⚠ **Explicit warning:** OI-P04-04 and the provider/entitlement dependencies **must not be
treated as resolved merely because OI-10 is resolved.** They are unrelated decision surfaces.

---

## 6. Downstream boundary — nothing promoted

| Phase | Status after this checkpoint | Note |
|---|---|---|
| **P05** Acquisition | **NOT_STARTED / NOT_ACCEPTED / NOT_AUTHORIZED** | Preconditions MET; entry act required |
| **P06** Normalization | **DOWNSTREAM — NOT PROMOTED** | Requires **P05 complete**; OI-10 blocker cleared but P05 dependency stands |
| **P07** Data Quality | **DOWNSTREAM — NOT PROMOTED** | Requires P05 + P06 complete |
| **P08** Historical / PIT | **NOT_STARTED — dependency-controlled** | ⚠ **Not started by this checkpoint.** No PIT storage, replay or corporate-action implementation is pulled forward. **AD-17 replay firewall preserved** |
| **P09–P13** | **NOT_STARTED / NOT_ACCEPTED** | P11 released from the OI-10 blocker only; still requires P05/P06/P09 and inherits AD-4; ⚠ OI-08 downstream effects = OI-P04-02 |
| **P14** UX / visual / browser gate | **NOT_STARTED / NOT_ACCEPTED — UNCHANGED** | Requires P13 |
| **P15** Full E2E certification | **BLOCKED — UNCHANGED** | Blocked by **M-1 repair + revalidation** of existing-IIPS; AD-4 = revalidation, not revocation |
| **P16 / P17** | **NOT_STARTED** | — |

### 6.1 ⚠ Observation — "Track C" is not a recorded construct

The checkpoint instruction refers to *"Track C remains paused at P14 unless its own explicitly
defined P15 prerequisites have independently been reconciled."* **No Track A / Track B / Track
C construct exists anywhere in this repository** — a full-corpus search returns zero matches.

Per the standing rule *"do not invent … UNKNOWN is preferable to guessing"*, **no track model
is created here.** What this checkpoint can and does assert from the recorded corpus:

- **P14 status is UNCHANGED by this checkpoint** — NOT_STARTED, NOT_ACCEPTED.
- **P15 remains BLOCKED** on M-1 repair + revalidation, independently of everything in §3–§5.
- **No P15 prerequisite has been reconciled** by this checkpoint, and none is claimed.

If "Track C" is an external planning construct, it is **not reconcilable against this
repository** and its status must be maintained wherever it is actually defined.

---

## 7. Authority state — preserved, no person assigned

| Dimension | State | Person named |
|---|---|---|
| **A1** security / identity authority | **CLEARED** | **NO** — `person_named: false` |
| **A2** | **CLEARED** | **NO** |
| **A3** gate acceptance | **CLEARED** — exercised for P00–P04 | **NO** |
| **A4** | **CLEARED** | **NO** |

⚠ **OI-P04-03's owner is A1, unnamed.** No individual is named or inferred anywhere.

---

## 8. Certification and activation — UNCHANGED

| Field | Value |
|---|---|
| `certification_status` | **`NONE_GRANTED`** |
| C12 | **BLOCKED** on M-5 |
| M-1 | **`OPEN_REVALIDATION_REQUIRED`** — E2E-030 **not revoked, not renewed** |
| `production_activation_status` | **`NOT_AUTHORIZED`** |
| Program + implementation authority | `AUTHORIZED_TO_PROCEED` — ⚠ never certification, never activation |

---

## 9. Existing-IIPS boundary — UNTOUCHED

| Component | State |
|---|---|
| `iips-review-recovered`, existing source, tests, methodology | **UNTOUCHED** |
| 13 certified engines · scoring · calibration · taxonomy | **UNCHANGED** |
| `LiveDataRuntime.ts` · `DataBoundExecutor` · `ReplayService` | **UNCHANGED** — ⚠ notably **not** modified by OI-10 resolution |
| `NormalizedHolding` (`cross-sector/types.ts:7`) · `companyId` join key | **UNCHANGED** — no CSIP revalidation triggered |
| Auto Option-A · Materials G1–G6 · Telecom D16 | **UNCHANGED** |
| E2E-030 · `PROGRAM_v1.1_REPLAY_BASELINE.json` · certification artifacts | **UNCHANGED** |
| Tracker XLSX · SPEC DOCX | **UNCHANGED** |
| Executable source files in repo | **ZERO** |

---

## 10. Documentation debt — recorded, NOT corrected

⚠ OI-10 resolution makes a **large number of committed statements stale**. Per the standing
rules — *do not rewrite accepted historical gate records; corrections go in new artifacts that
cite the original* — **none of the following is edited.** This section is the correction, by
addition.

| Artifact | Stale statement | Superseded by |
|---|---|---|
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:98,203` | *"NOT approved (OI-10 remains open)"* | §3 — historical record of its own moment |
| `docs/d4/D4_07_FIELD_NAMESPACE.md:168` | *"`MD:` is a recommendation … Not assumed approved"* | §3 |
| `docs/d4/D4_12_PHASE_SEQUENCE.md:29,30,35` | P05/P06/P11 *"BLOCKED — AUTHORITY"* by OI-10 | §3, §6 — ⚠ already superseded by D8; **never carry forward as current** |
| `docs/d4/D4_14_…:65` · `D4_15_…:19,53,67` · `docs/d5/D5_REGISTER.md:35` · `D5_DEPENDENCY_MAP.md:55,98` · `D5_HANDOFF.md:17` · `docs/d7/D7_BLOCKER_MATRIX.md:84` · `docs/d7/D7_STATUS.json` · `docs/d8/D8_STATUS.json` · `D8_AUTHORITY_RECONCILIATION.md:37,178,179,184` | OI-10 PENDING / token not recorded | §3 — **immutable historical records** |
| `docs/p00/P00_AUTHORITY_REGISTER.md:36,95` · `P00_OPEN_ITEMS_REGISTER.md:37,128` | `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` | §3 |
| `docs/p00/P00_GATE_ACCEPTANCE.md:97,114` · `p01/P01_GATE_ACCEPTANCE.md:58,111,127` · `p02/P02_GATE_ACCEPTANCE.md:67,117,136` · `p03/P03_GATE_ACCEPTANCE.md:115,141` · `p04/P04_GATE_ACCEPTANCE.md:131,152,186,187` | OI-10 open / token not invented | §3 — ⚠ **accepted gate records; MUST NOT be rewritten.** Each was **true when written** |
| `docs/p01/` `<NS>` placeholder throughout (`P01_DATA_CONTRACT.md` §4, `P01_FIELD_DICTIONARY.md:5`, `P01_SCHEMA_CATALOG.md:6`, `P01_VALIDATION_RULES.md:53`, `P01_VERSIONING_COMPATIBILITY.md` VA-3) | Token unrecorded; `<NS>` unresolved | §3 — `<NS>` now **binds to `MD:`**. ⚠ The literal-key rewrite is **P05/P06 work, not authorized here** |
| `docs/p02/` DEP-P02-01, DEP-P02-09, N-3/N-4, §7 | Literal keys / mechanical C1–C2 blocked | §3, §3.2 — blocker cleared, **implementation still prohibited** |
| `docs/PROGRAM_STATE.md` rows 8, 22 and §4 | OI-10 unrecorded / P05 blocked on token | **Corrected in this checkpoint's ledger update** (row 22, §4, new row 8b) — row 8 remains unedited |
| Pre-existing, unchanged | `P02_GATE_ACCEPTANCE.md` §5/§7 · `D4_12:27,28` · `D5/E-01:11,78` · `D7_AUTHORITY_ROLE_ASSIGNMENT.md:15,16,84` · `D7_BLOCKER_MATRIX.md:23,67,78` · `D8_STATUS.json A3.gates_accepted:0` · `P01_FIELD_DICTIONARY.md` §7 / `D4_05` §G.2 | Previously recorded debt |

---

## 11. Recovery procedure from CHECKPOINT-03

1. **Read `docs/PROGRAM_STATE.md`** — the session recovery index.
2. **Read this file** — the post-P04 / post-OI-10 authoritative state summary.
3. **Read `docs/p00/P00_GATE_MODEL.md`** — 18 gates; **5 accepted (P00–P04)**.
4. **Read `docs/p04/P04_GATE_ACCEPTANCE.md`** — what P04 acceptance does and does not mean; §4 OI-P04-03 implementation bound.
5. **Read `docs/p04/P04_OPEN_ITEMS.md`** — OI-P04-01…05, especially **OI-P04-04**.
6. **Read `docs/INCIDENT-01_HISTORY_LOSS.md`** before trusting any pre-`9a26ac7` commit pin.
7. Consult `docs/d4/` for specification, `docs/d5/` for ADRs, `docs/d7/` for the authority hold, `docs/d8/` for the reconciliation that authorized execution — **all immutable**.

### Recovery rules — CHECKPOINT-02 rules 1–8 carry forward unchanged, plus:

| # | Rule |
|---|---|
| 1–8 | **Unchanged from CHECKPOINT-02 §11** — immutable D4/D5/D7/D8; no AD-14 application; no tracker/SPEC edits; **do not invent authority, evidence, dates or names**; pinned-commit evidence convention; approval ≠ certification ≠ acceptance ≠ activation; **do not rewrite accepted gate records** |
| **9** | **P00, P01, P02, P03, P04 are ACCEPTED — 5 of 18.** P04 is **specification only**; ⚠ **OI-P04-03 bounds implementation** |
| **10** | **OI-10 is RESOLVED. The exact token is `MD:`; canonical form `MD:<domain>.<field>`.** ⚠ **This is now a recorded fact — it must NOT be re-derived, re-recommended, re-opened, or replaced with an alternative token.** The C1–C6 rules are unchanged |
| **11** | **The next program action is a P05 ENTRY ASSESSMENT. P05 is NOT authorized.** Preconditions are MET; an explicit entry/authorization act is still required |
| **12** | ⚠ **OI-P04-04 (FIGI sourcing/licensing/coverage), provider selection and the empty entitlement matrix are NOT resolved by OI-10.** Do not treat them as cleared |
| **13** | **P08 is not started.** Do not pull PIT / replay / corporate-action work forward. **AD-17 replay firewall preserved** |
| **14** | **`<NS>` → `MD:` literal-key rewriting in accepted P01/P02 artifacts is NOT authorized.** Those records stand; the binding is recorded here and applies to **new** P05/P06 work |
| **15** | ⚠ **No Track A/B/C construct exists in this repository** (§6.1). Do not invent one |

---

## 12. Checkpoint integrity

| Check | Result |
|---|---|
| HEAD before checkpoint | **`faf1317eccaf77dbdab2a520899802043c851cca`** — the P04 acceptance commit ✅ |
| Parent of HEAD | **`6ec3b288c8deeee317a63341297bd33b9a090f4f`** — the P04 work package ✅ |
| Branch | `arena/01a0814b-iips-production-market-data` ✅ |
| Working tree before checkpoint | **clean** ✅ |
| Uncommitted P04 changes | **none** ✅ |
| P00 / P01 / P02 / P03 / P04 accepted artifacts | **unchanged** — verified by checksum ✅ |
| `docs/p04/` package (12 artifacts) | **unchanged** — verified by checksum ✅ |
| CHECKPOINT-02 · INCIDENT-01 | **unchanged** — verified by checksum ✅ |
| D4 / D5 / D7 / D8 | **unchanged** ✅ |
| Tracker XLSX / SPEC DOCX | **unchanged** ✅ |
| Existing-IIPS | **untouched** ✅ |
| Executable source / implementation files created | **NONE** ✅ |
| P05 artifacts created | **NONE** ✅ |
| Certification / activation state | **unchanged** ✅ |
| Files changed by this checkpoint | **documentation / governance only** — this file (new) + `docs/PROGRAM_STATE.md` ✅ |

---

## 13. Program state transition — recorded without collapse

```
P04 ACCEPTED
    +
OI-10 RESOLVED  (token = MD: ,  form = MD:<domain>.<field>)
    ↓
P05 ENTRY PRECONDITIONS MET
    ↓
P05 ENTRY / AUTHORIZATION ASSESSMENT REQUIRED NEXT
    ↓
P05 IMPLEMENTATION NOT YET AUTHORIZED
```

⚠ **These four states are distinct and are NOT collapsed.** Being at state 2 is not being at
state 3; reaching state 3 is not passing it; and nothing here reaches state 4.

---

**CHECKPOINT-03 — POST-P04 / OI-10 RESOLVED / PRE-P05 STATE PRESERVED.**
**5 of 18 gates accepted · OI-10 RESOLVED (`MD:`) · P05 entry preconditions MET.**
**Next: P05 ENTRY ASSESSMENT. P05 is NOT authorized, NOT started, NOT accepted.**
**Certification NONE_GRANTED · Activation NOT_AUTHORIZED · Existing-IIPS untouched.**
