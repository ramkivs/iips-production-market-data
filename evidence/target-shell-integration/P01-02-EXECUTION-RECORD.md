# Institutional Investment Platform System (IIPS)
# P01-02 — Timestamp/as-of semantics — EXECUTION RECORD

**Record ID:** `p01-02-execution-record-2026-09-28-001`
**Act Type:** GOVERNED EXECUTION RECORD (execution only)
**Gate:** `P01-02 — Timestamp/as-of semantics — EXECUTE THE AUTHORIZED WORK ITEM`
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Executor:** Arena (Recording Agent / execution agent)
**Authority Holder:** **RAMKI — Program Authority**
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

> # `P01-02 ACCEPTANCE = NOT PERFORMED IN THIS GATE`
>
> # `P01-02 CERTIFICATION = NOT PERFORMED IN THIS GATE`
>
> # `DEP-P01-07 = OUTSTANDING (NOT DISCHARGED)`

---

## 0. AUTHORITY USED (pre-existing; NOT re-designated)

| Dimension | Artifact | Ref | Status |
|---|---|---|---|
| **Execution authority** | `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` | `6b7552b642b92c0b783d4c190e409c4ce116e932` (blob `1bfa9eff…`) | **USED** — bounded P01 Wave-1 = P01-01 + P01-02; holder RAMKI, executor Arena |
| **Acceptance-criteria authority** | `P01-02-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` | `d712c31beac4568c45ab4823ef127225a9f80464` | **USED** — Work Tracker authorized for P01-02 only |
| **A3 acceptance authority** | `P01-02-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` | `26b6def23f29daac2ba676656612951b0f02c09f` | **PRESERVED, NOT INVOKED** — SAI, P01-02 only |
| **Certification-scope determination** | `P01-02-CERTIFICATION-SCOPE-DETERMINATION-AUTHORITY-ACT.md` | `53f01f8caff7274f9b3a370c87f872704429d281` | **PRESERVED** — `ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING` |

No new execution-authority designation was created. No authority contradiction was discovered.

**No tracker was used as authority for this execution.** The tracker was used only as the
acceptance-criteria source already authorized at `d712c31`. The authoritative domain inventory was
derived from the tracker's `Data Domains` sheet and cross-validated against the repository's own
`DataDomain` enum and contract modules.

---

## 1. AUTHORITATIVE RECONCILIATION — IS THE EXISTING DOCUMENT THE P01-02 DELIVERABLE?

### 1.1 Artifacts inspected

| Artifact | Location | Role |
|---|---|---|
| `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` | branch `arena/01a0ae80` (`b0fdd8d`), 129 lines / 8,578 B, blob `e21312123c2f1800ccd09856181c034b` | **The P01-02 deliverable** |
| `docs/p01/P01_EVIDENCE.md` | branch `arena/01a0ae80` | Authoritative traceability matrix |
| `docs/p01/P01_GATE_ACCEPTANCE.md` | branch `arena/01a0ae80` | P01 specification-level gate acceptance (24/24 PASS) |
| `docs/p01/P01_VALIDATION_RULES.md` | branch `arena/01a0ae80` | Validation obligations incl. §9 and line 147 |
| `docs/p01/P01_DEPENDENCY_REGISTER.md` | branch `arena/01a0ae80` | DEP-P01-07, OI-05 routing |
| `docs/p01/P01_FIELD_DICTIONARY.md` §11–12 | branch `arena/01a0ae80` | D09 / D10 authoritative field definitions |
| `docs/p01/P01_SCHEMA_CATALOG.md` D09 | branch `arena/01a0ae80` | D09 authoritative contract disposition |
| `IIPS_…_TRACKER_INTEGRATION_ALIGNED.xlsx` — `Data Domains` sheet | worktree / PMD `main` | Authoritative domain inventory |
| `src/contracts/d09_altdata.ts` | PMD `main` (blob on `main`) | D09 canonical contract |
| `src/contracts/provenance.ts` | PMD `main` | `DataProvenanceDTO.asOf` / `.receivedAt` |
| `src/contracts/envelope.ts` | PMD `main` | Canonical envelope, mode, provenance |
| `src/contracts/types.ts` | PMD `main` | `DataDomain` enum |

### 1.2 Determination — the existing document IS the P01-02 deliverable

**Authoritative evidence, not filename similarity:**

`docs/p01/P01_EVIDENCE.md` §2 traceability matrix, verbatim:

> | Tracker P01 row | Deliverable named in tracker | Covered by |
> | `P01-02` Timestamp/as-of semantics | "Time semantics specification" | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3 |

The repository's own authoritative traceability record maps the authorized P01-02 deliverable
**"Time semantics specification"** to `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` **§1–3**. The document
is also self-declared as satisfying tracker row `P01-02`:

> **SPECIFICATION ONLY.** Satisfies tracker rows `P01-02` (time semantics), `P01-03`
> (units/currency/adjustment) and `P01-04` (LIVE/SNAPSHOT/PIT modes), sheet `Work Tracker`.

**Conclusion: the existing document is the actual P01-02 deliverable.** It was produced under the
prior governed P01 phase (documentation-only) and accepted at specification level by
`P01_GATE_ACCEPTANCE.md` (24/24 PASS, criterion 4 PASS citing §1–2). It was **not** overwritten,
replaced, or re-authored by this execution.

### 1.3 Requirement satisfaction

Authorized Requirement (verbatim): *"Define event time, received time, publication time, effective
time and as-of semantics."*

| Requirement term | Satisfied by | Evidence |
|---|---|---|
| **as-of** | **T1 `asOf`** | §1 table row T1 — *"Market-data time — the snapshot point"*, Snapshot envelope, REQUIRED |
| **received time** | **T2 `receivedAt`** | §1 row T2 — *"Acquisition / ingest time"*, REQUIRED; TS-6 clock source = ingest boundary, recorded once, never back-filled |
| **event time** | **T3 `observationTime`** | §1 row T3 — *"**Event time** — when the datum was observed/traded"* |
| **effective time** | **T4 `effectiveTime`** | §1 row T4 — *"When the datum becomes economically effective (fiscal period end, ex-date, validFrom)"* |
| **publication time** | **T5 `publicationTime`** | §1 row T5 — *"When the source published/released it"* |

**All five authorized terms are defined.** The document additionally defines **T6 `evaluationTime`**
(*"Evaluation / scoring / threshold-assessment instant"*), which the six-time model requires and
which TS-7 governs (always an explicit input; reading a system clock in its place violates the rule).

**Requirement: SATISFIED.**

### 1.4 Deliverable satisfaction

Authorized Deliverable: **"Time semantics specification"**.

`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3 delivers:
- §1 — the six distinct times and their non-collapse rule;
- §1.1 — obligations by data class;
- §2 — timezone and representation (TS-1…TS-7);
- §3 — mode semantics (MD-1…MD-7).

**Deliverable: SATISFIED.**

### 1.5 Preserved semantics (all verified present)

| Required semantics | Rule | Present |
|---|---|---|
| UTC representation | TS-1 — ISO-8601 in UTC with explicit `Z`; local-time-only values invalid | ✓ |
| Explicit `Z` | TS-1 | ✓ |
| Fixed, declared precision | TS-2 — variable precision breaks byte-stable identity | ✓ |
| Venue timezone **alongside**, never instead of | TS-3 (`<NS>venue.timezone`) | ✓ |
| Date-only semantics | TS-4 — explicit date type at a declared UTC convention, not ambiguous midnight-local | ✓ |
| Deterministic serialization | TS-5 — required for snapshot and replay identity byte-stability | ✓ |
| `receivedAt` recorded once at ingest, never back-filled | TS-6 | ✓ |
| Explicit `evaluationTime` | TS-7 — always an explicit input | ✓ |
| LIVE / SNAPSHOT / PIT modes | MD-1 — exactly one declared `mode`, never implicit | ✓ |
| No silent mode combination | MD-2 | ✓ |
| `pitBoundary` required iff PIT | MD-3 | ✓ |
| Only `pitEligible` fields in a PIT snapshot | MD-4 | ✓ |
| Same PIT boundary ⇒ same replay identity | MD-5 | ✓ |
| Later corrections never retroactively alter a past PIT result | MD-6 | ✓ |
| Mode in lineage / `contributingData` | MD-7 | ✓ |

**All required semantics are preserved. None were invented, narrowed, or reinterpreted.**

---

## 2. DOMAIN MAPPING — EXIT CRITERION

Authorized Exit Criterion: **"All domains mapped to time semantics"**

### 2.1 Authoritative domain inventory (derived, not guessed)

| Source | Inventory |
|---|---|
| Tracker `Data Domains` sheet | **D01–D10** — ten domains |
| `src/contracts/types.ts` `DataDomain` enum | D01_QUOTES, D02_OHLCV, D03_FUNDAMENTALS, D04_CORPORATE_ACTIONS, D05_SECURITY_MASTER, D06_NEWS, D07_ESTIMATES, D08_MACRO, **D09_ALTDATA** |
| Tracker `Program Overview` sheet — "Data domains" | market prices/quotes; OHLCV; fundamentals; corporate actions; instrument master; news/events; estimates; macro; **alternative data**; exchange/reference metadata |

**The authoritative inventory is D01–D10 (ten domains).** (Recorded observation: the
`DataDomain` enum enumerates nine values and omits `D10`; D10 is nonetheless an authoritative
tracker domain and is mapped in §1.1. This discrepancy is recorded, not resolved here.)

### 2.2 Gap identified

`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1.1 mapped **nine** of the ten authoritative domains:

| Mapped in §1.1 | D01 | D02 | D03 | D04 | D05 | D06 | D07 | D08 | ~~D09~~ | D10 |
|---|---|---|---|---|---|---|---|---|---|---|

> **`D09` — Alternative data was NOT mapped to time semantics.**

This was the demonstrable unexecuted portion of the P01-02 exit criterion. Confirmed by exhaustive
search: `D09` appears nowhere in `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md`.

### 2.3 D09 obligation derivation — from authoritative repository evidence only

| Time | Basis | Derivation |
|---|---|---|
| **T1 `asOf`** | `DataProvenanceDTO.asOf` (`src/contracts/provenance.ts:13`) — *"ISO-8601 UTC"* | Carried on **every** canonical envelope's provenance. Unconditionally required, exactly as for every other domain in §1.1. |
| **T2 `receivedAt`** | `DataProvenanceDTO.receivedAt` (`provenance.ts:14`) — *"ISO-8601 UTC"* | Carried on **every** canonical envelope's provenance; TS-6 governs its clock source. Unconditionally required. |
| **T3 `observationTime`** | `AlternativeDataPayload.observedAt` (`src/contracts/d09_altdata.ts:14`) — *"ISO-8601 UTC"*, validated at line 33 via `Date.parse` | The D09 contract's own event-time field. Required. |
| T4 `effectiveTime` | **No basis** — D09 contract has no effective-date field | **Not asserted.** |
| T5 `publicationTime` | **No basis** — D09 contract has no publication-time field | **Not asserted.** |
| T6 `evaluationTime` | §1.1 convention; D09 consumers per tracker = *"Research/engines where approved"* | Conditional, following the established §1.1 pattern. |

**No obligation was invented.** T4 and T5 are explicitly recorded as having no basis rather than
being asserted by analogy.

### 2.4 D09 governing qualifiers (preserved verbatim from authoritative records)

| Qualifier | Authoritative source |
|---|---|
| **Conditional-by-applicability** — "required by applicability", unlike D01–D08/D10 | Tracker `Data Domains` sheet D09; `P01_SCHEMA_CATALOG.md` D09 |
| **OI-05 OPEN** — *"alt-data applicability \| OPEN \| D09 is conditional-by-applicability; criteria undefined \| NO \| P10"* | `P01_DEPENDENCY_REGISTER.md:19`; `P01_EVIDENCE.md:82` |
| **PIT is dataset-dependent; must be declared per dataset** | `P01_SCHEMA_CATALOG.md` D09 — *"PIT? Dataset-dependent; must be declared per dataset"* |
| **Every D09 field requires a governance classification attribute** | `P01_SCHEMA_CATALOG.md` D09 — *"every field REQUIRES a governance classification attribute"* |
| **M-6 limitation recorded** — retention not enforced; `isWithinRetention()` is a stub; **must NOT be silently fixed by this program** | `P01_SCHEMA_CATALOG.md` D09; `P01_DEPENDENCY_REGISTER.md:18` |

### 2.5 Executed domain mapping — the delta this execution establishes

> ## **Alternative data (D09): T1, T2, T3 (+ T6 where evaluation/scoring contributes)**
>
> **Applicability:** D09 is **conditional-by-applicability**; its applicability criteria are
> **undefined** and remain **OPEN as OI-05**, routed to **P10** — **not resolved by this execution**.
> This mapping therefore applies **wherever D09 is admitted into governed scope**.
>
> **PIT:** dataset-dependent; `pitBoundary`/`pitEligible` (MD-3, MD-4) are declared **per dataset**.
> MD-1 and MD-2 (mode declared; no silent mode combination) apply unconditionally.
>
> **T4 `effectiveTime` and T5 `publicationTime`: no basis in the D09 contract — not asserted.**

**With this delta, all ten authoritative domains (D01–D10) are mapped to time semantics.**

| Domain | Required times |
|---|---|
| D01 Live quote | T1, T2, T3 (+ T6 where threshold evaluation contributes) |
| D02 Session mark / OHLCV bar | T1, T2, T4 |
| D03 Fundamentals | T1, T2, T4, T5 (+ T6 where scoring contributes) |
| D04 Corporate action | T1, T2, T4 (+ ex/record/pay as distinct contract fields) |
| D05 Identity attribute | T1, T2, T4 (`validFrom`/`validTo`) |
| D06 News / event | T1, T2, T5 (+ T3 where occurrence differs) |
| D07 Estimates | T1, T2, T4, T5 (+ T6 where evaluation contributes) |
| D08 Macro | T1, T2, T4, T5 (+ vintage) |
| **D09 Alternative data** | **T1, T2, T3 (+ T6 where evaluation/scoring contributes)** — **ESTABLISHED BY THIS EXECUTION** |
| D10 Venue / calendar | T1, T2, T4 |

---

## 3. WHY THIS MUTATION WAS REQUIRED, AND ITS SHAPE

The P01-02 exit criterion is *"All domains mapped to time semantics."* Nine of ten authoritative
domains were mapped; **D09 was not**. The exit criterion was therefore **not** satisfied. The minimum
mutation necessary to execute that missing portion was to **establish the D09 time-semantics
obligation** and record it durably.

**Shape of the mutation, and why:**

The existing deliverable `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` resides on branch
`arena/01a0ae80` and is an **accepted** P01 artifact (`P01_GATE_ACCEPTANCE.md` 24/24 PASS).
Cross-branch amendment of an accepted artifact was **not** performed. Instead the D09 delta is
recorded **here, on the session branch, alongside the P01-02 governance chain**, leaving the accepted
P01 package byte-identical. The accepted document's §1.1 remains unchanged; this record supplies the
missing row authoritatively for P01-02 acceptance purposes.

**Explicitly not done:** the accepted P01 document was **not** overwritten, re-authored, narrowed, or
reformatted to manufacture a new implementation. Its blob is unchanged (§4).

---

## 4. WHAT WAS NOT EXECUTED — REMAINING GAPS

### 4.1 `DEP-P01-07 = OUTSTANDING` — NOT DISCHARGED

| Obligation | Status | Authoritative routing |
|---|---|---|
| **P01-02 contract tests** | **OUTSTANDING** | `docs/p01/P01_DEPENDENCY_REGISTER.md` DEP-P01-07 → **P05/P06 execution + P15** |
| **Time-semantics executable validation** | **OUTSTANDING** | same |
| **P05/P06 execution obligations** | **OUTSTANDING — unchanged** | same |
| **P15 obligations** | **OUTSTANDING — unchanged** | same |

The authorized criteria name `Test / Validation = Contract tests`, and `P01_EVIDENCE.md` §3 records
that these are executable/implementation artifacts specified as obligations under DEP-P01-07 and
**not produced**. **This execution did not create contract tests, fixtures, or executable validation,
and did not prematurely discharge DEP-P01-07.** No P05/P06/P15 execution was performed.

### 4.2 Other recorded gaps (not closed by this execution)

| Gap | Status |
|---|---|
| **OI-05** — D09 applicability criteria undefined | **OPEN** — routed to **P10**; not resolved here |
| **M-6** — retention not enforced (`isWithinRetention()` stub) | **OPEN** — existing-IIPS defect, **must not be silently fixed** |
| **D10 absent from the `DataDomain` enum** | **RECORDED, not resolved** — outside P01-02 scope |
| **P01-02 implementation status** | Remains `NOT STARTED` in the tracker row; this execution changed no status field and no tracker |

### 4.3 Separation preserved

| Concept | State |
|---|---|
| **Specification execution** | **EXECUTED BY THIS RECORD** (D09 domain-mapping delta) |
| **P01-02 acceptance** | **NOT PERFORMED** |
| **Executable contract testing** | **DEFERRED — DEP-P01-07** |
| **P05/P06/P15 obligations** | **DEFERRED — OUTSTANDING** |

---

## 5. EXPLICIT NON-AUTHORIZATIONS

This execution did **not** authorize or perform: P01-02 acceptance · A3 acceptance (SAI was **not**
invoked) · certification · A2 designation · P05/P06 execution · P15 execution · production
activation · Dhan activation · NSE activation · integration into PMD `main` · cross-platform
integration · modification of P01-01 · modification of D4/D7/D8 framework records · modification of
C1–C12 · modification of frozen trees · unrelated refactoring · unrelated source changes · unrelated
test/fixture changes.

**SAI remains the P01-02 A3 acceptor, but A3 acceptance was not invoked in this gate.**

---

## 6. REPOSITORY INTEGRITY VERIFICATION

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** ✓ |
| Candidate `arena/01a0e30c` | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **UNCHANGED** ✓ |
| P01-WAVE1 execution authority @ `6b7552b` | blob `1bfa9eff…` — **INTACT** ✓ |
| P01-02 criteria-authority @ `d712c31` | **INTACT** ✓ |
| P01-02 A3 designation @ `26b6def` | **INTACT** ✓ |
| P01-02 cert-scope determination @ `53f01f8` | **INTACT** ✓ |
| P01-01 chain (5 artifacts) | **all INTACT** ✓ |
| **`P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` blob on `ae80`** | **`e21312123c2f1800ccd09856181c034b` — UNCHANGED, NOT OVERWRITTEN** ✓ |
| **Accepted P01 package (`docs/p01/**`) on `ae80`** | **UNTOUCHED — not amended cross-branch** ✓ |
| Source / tests / fixtures | **UNCHANGED** ✓ |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` — **UNCHANGED** ✓ |
| Tracker file | blob `6f4abdbc…`, MD5 `f0bd7b97…` — **UNCHANGED, read-only** ✓ |
| Unauthorized diff count | **0** ✓ |

---

## 7. NEXT GOVERNED GATE

> ## `P01-02 ACCEPTANCE RE-EXERCISE AGAINST AUTHORIZED CRITERIA`

**Not performed in this execution.**

**Material note for that gate:** P01-02 acceptance is **NOT PERFORMED** and must not be inferred
from this execution record. The specification deliverable exists and its requirement and domain
mapping are now complete for all ten authoritative domains; however the authorized
`Test / Validation` criterion (`Contract tests`) remains governed by **DEP-P01-07** and is routed to
**P05/P06 + P15**. The acceptance re-exercise must therefore adjudicate against the authorized
criteria at `d712c31` and must explicitly account for the deferred DEP-P01-07 portion rather than
treat it as satisfied. **This execution record is not a PASS of the acceptance gate.**

---

**Execution attestation:** Executed by **Arena** (execution agent) under the pre-existing bounded
P01-WAVE1 execution authority (holder RAMKI), using the authorized P01-02 acceptance criteria at
`d712c31`, with the A3 designation and certification-scope determination preserved and uninvoked.
The execution reconciled the existing authoritative specification, confirmed it as the P01-02
deliverable on authoritative traceability evidence rather than filename similarity, verified full
requirement coverage and all fifteen required semantic rules, identified the single demonstrable
unexecuted portion of the exit criterion (the missing D09 domain mapping), derived the D09
time-semantics obligation strictly from authoritative repository evidence without inventing T4/T5
obligations, and recorded that delta. No accepted P01 artifact, frozen tree, framework record,
P01-01 artifact, source file, test, or fixture was modified. **DEP-P01-07 remains outstanding.**
