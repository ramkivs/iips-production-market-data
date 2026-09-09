# P05 — ACCEPTANCE CRITERIA

> ⚠ **This artifact DEFINES the criteria a future P05 gate review would assess.**
> **It does NOT accept the P05 gate.** No criterion below is marked satisfied, met or passed by
> its own definition — **including where implementation evidence already exists.** Evidence is
> recorded as *available for review*, never as a verdict.
> **P05 is NOT ACCEPTED**; formal gate status remains **5 of 18**.
> Acceptance requires a **separate explicit act** by the designated **A3** gate acceptor,
> **Ramakrishnan V. S. (Ramki)** — *"Explicit gate acceptance; no automatic promotion."*
> ⚠ **The A3 designation (`A3-P05-GATE-ACCEPTOR-DESIGNATION`, `docs/p00/P00_DECISION_LOG.md` §7)
> is a designation of the person authorized to perform the acceptance decision. It is NOT
> acceptance, and it confers nothing on P05.**

**Gate:** Acquisition gate.
**Gate intent** (`docs/p00/P00_GATE_MODEL.md`:40): *"Deterministic/local ingestion first, then
provider"* — TRACKER *Phase Gates*!P05 in full: *"Implement deterministic/local ingestion first,
then provider adapters for quotes, prices and historical market data."*
**Minimum evidence** (`docs/p00/P00_GATE_MODEL.md`:40): *"**Exact namespace token recorded**; PIT
repeatability; degraded-state classification"* — plus TRACKER *Phase Gates*!P05:
*"Phase-specific tests + artifacts + lineage/evidence + concessions where applicable"*, and the
six evidence items of `docs/p00/P00_EVIDENCE_CONVENTIONS.md` §6.

> ### ⚠ BD-1 SAFEGUARD — this artifact does not narrow anything
>
> `docs/p04/P04_GATE_ACCEPTANCE.md` §4.1 establishes that an open item does not block acceptance
> where **"no acceptance criterion requires"** it (**BD-1**), determined *"from the acceptance
> criteria themselves, **not by a new rule**"*. **BD-1 is therefore evaluated against this
> document.** Accordingly this artifact **reproduces the accepted P00 and TRACKER requirements in
> full and narrows none of them**: every `P00_GATE_MODEL.md`:40 minimum-evidence item and every
> P05-01…P05-04 TRACKER exit criterion is carried below verbatim in substance, whether or not
> current evidence supports it. **Omitting an inconvenient requirement from this list would
> silently change what a future review could find, and is prohibited.**

---

## A. Gate scope and boundary

| # | Criterion |
|---|---|
| A-1 | **P05 is ONE gate — the Acquisition gate — spanning work items `P05-01`, `P05-02`, `P05-03` and `P05-04` together.** TRACKER *Phase Gates* defines a single P05 row with one promotion rule |
| A-2 | ⚠ **Completion of a subset of P05-01…P05-04 is not gate acceptance.** No work item is severable from the gate by this artifact |
| A-3 | The accepted gate intent is preserved in both halves: **deterministic/local ingestion first, *then provider*.** Neither half is dropped, deferred by implication, or treated as satisfied by the other |
| A-4 | Upstream gates **P02** and **P04** are themselves ACCEPTED (`docs/p00/P00_GATE_MODEL.md`:40) — a precondition of acceptance, not evidence for it |
| A-5 | Exclusions explicit — P06, P07, P08, P09–P17, certification, production activation |
| A-6 | ⚠ **A concession cannot sever a work item from this gate, and cannot authorize work that is not authorized** — see G-4 |

## B. Minimum evidence (`docs/p00/P00_GATE_MODEL.md`:40) — reproduced without narrowing

| # | Criterion |
|---|---|
| B-1 | **Exact namespace token recorded.** The token is recorded exactly, not approximately; `MD:<domain>.<field>` with namespace version stated; no placeholder left unresolved |
| B-2 | ⚠ **PIT repeatability.** Point-in-time repeatability is demonstrated for the phase. ⚠ **This item is carried in full. It is NOT satisfied by snapshot-level repeatability, replay idempotency, or deterministic re-runs, none of which is point-in-time.** Where PIT capability is declared unsupported, the review must determine whether the requirement is met, unmet, or requires an explicit authority decision — **this artifact does not decide which** |
| B-3 | **Degraded-state classification.** Degraded data is classified, not silently coerced; the quality-bearing surface is bounded and stated |
| B-4 | ⚠ **No minimum-evidence item above may be omitted, restated more weakly, or substituted by an adjacent achievement** |

## C. TRACKER work-item exit criteria (`Work Tracker`!P05-01…P05-04) — recorded, not adjudicated

| # | Work item | Exit criterion | Test / validation | Evidence | Current committed status |
|---|---|---|---|---|---|
| C-1 | **P05-01** | *Repeatable fixture ingestion* | *Repeat-run tests* | *Fixture dataset* | Evidence **available for review** — §D |
| C-2 | **P05-02** | *Authenticated ingestion works* | *Integration tests* | *Provider evidence* | ⚠ **UNMET** — declared by `p05/evidence-p05-02/` itself |
| C-3 | **P05-03** | *Historical load reproducible* | *Load/reconcile tests* | *Historical sample* | ⚠ **UNMET** — declared by `p05/evidence-p05-03/` itself |
| C-4 | **P05-04** | *Replay does not duplicate data* | *Failure/replay tests* | *Run logs* | ⚠ **NO EVIDENCE EXISTS** — work not authorized (§G) |

| # | Determination this artifact deliberately does NOT make |
|---|---|
| C-5 | ⚠ **Whether the TRACKER work-item exit criteria are binding *gate* acceptance criteria is not resolved by the accepted corpus.** `P00_GATE_MODEL.md`:40 fixes the three minimum-evidence items; the TRACKER *Phase Gates* baseline names *"phase-specific tests + artifacts"* without mapping them to individual work items. **This artifact records the exit criteria and their status. It does not decide their binding effect.** If the accepted corpus does not already settle the question, **the formal P05 acceptance review must determine it explicitly and on the record** |
| C-6 | ⚠ **No exit criterion is dropped, softened, re-scoped or re-labelled here.** A criterion whose status is `UNMET` is recorded as `UNMET` |
| C-7 | ⚠ **A status of `UNMET` is a statement about evidence, not a finding of defect.** P05-02 and P05-03 were authorized as **specification / adapter-contract only** (D9 A-2, A-3); their exit criteria are unmet because the unauthorized work was correctly not performed |

## D. P05-01 — local deterministic market feed

*Evidence basis recorded for review. Nothing below is an assessment.*

| # | Criterion |
|---|---|
| D-1 | Deterministic local feed implemented; **0 external dependencies**; no network; no credentials |
| D-2 | Test evidence **available for review**: **228 / 228** suite passing at the pinned baseline |
| D-3 | Fixture corpus **available for review**: **11 securities / 10 mappings**, and the committed evidence manifest is set-equal to the fixtures in both directions |
| D-4 | Evidence determinism **available for review**: repeated regeneration of `p05/evidence/` is byte-identical, and the committed set matches a fresh regeneration |
| D-5 | **OI-08** 1:N cardinality, **OI-09** FIGI/OpenFIGI authority and **OI-10** namespace token preserved; none reopened |
| D-6 | **ADR-01 C1–C6** preserved unchanged |
| D-7 | Lifecycle coverage **available for review**: **5 of 5** states exercised (`active`, `suspended`, `delisted`, `merged`, `superseded`); `LIFECYCLE_STATES` unchanged |
| D-8 | Replay and idempotency evidence **available for review**: repeated passes create **0 duplicates**; repeated ingests are no-ops |
| D-9 | ⚠ **D-2…D-8 are statements that evidence exists. None is a determination that C-1 or B-1…B-3 is satisfied** |

## E. P05-02 — LIVE market adapter (specification / adapter-contract only)

| # | Criterion |
|---|---|
| E-1 | **Completed deterministic / local contract evidence exists** — `P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` v1.0, **LA-1…LA-31**; adapter-contract tests **available for review** |
| E-2 | Local/deterministic **contract validation** exists, classified by its own evidence as **`CONTRACT_VALIDATION`** |
| E-3 | Absence semantics distinguished — present / asserted-null / not-provided / withheld — and never conflated |
| E-4 | ⚠ **Provider selection = NONE MADE.** No provider is selected, named, inferred or implied by this artifact |
| E-5 | ⚠ **Entitlement matrix = EMPTY** (INV-10). No entitlement is held, granted or implied |
| E-6 | ⚠ **Credentials and connectivity are NOT held.** P03 is accepted as **specification only**; no secret is provisioned |
| E-7 | ⚠ **`Authenticated ingestion works` (C-2) = UNMET.** Declared `UNMET` by `p05/evidence-p05-02/` |
| E-8 | ⚠ **`Provider evidence` (C-2) = UNMET.** No provider evidence exists and none may be synthesized |
| E-9 | ⚠ **Live provider execution is NOT AUTHORIZED** (D9 **N-1**). Its absence is correct behaviour, not a defect |
| E-10 | **ISO-4217 currency vocabulary is provider-specific configuration** (LA-31); shape-only validation is a recorded limitation, not a completed vocabulary check |
| E-11 | ⚠ **No provider, credential, endpoint, account or licensed source is invented, inferred or defaulted anywhere in this review** |

## F. P05-03 — historical market adapter (specification / adapter-contract only)

| # | Criterion |
|---|---|
| F-1 | **Historical adapter contract exists** — `P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT` v1.0, **HA-1…HA-35**; **28** tests **available for review** |
| F-2 | A **synthetic** load/reconcile demonstration exists and is classified by its own evidence as **`CONTRACT_VALIDATION`**: requested range, expected bar count with a declared basis, bars emitted, declared gaps, `REPORT_ONLY` policy, nothing repaired |
| F-3 | ⚠ **A real historical sample does NOT exist.** `isRealHistoricalSample: false` |
| F-4 | ⚠ **No licensed or deeper historical load has occurred.** `licensedDataAcquired: false` |
| F-5 | ⚠ **`Historical load reproducible` (C-3) = UNMET.** `establishesReproducibleLicensedLoad: false`, declared by `p05/evidence-p05-03/` |
| F-6 | ⚠ **The distinction between a deterministic synthetic contract demonstration and actual historical-load reproducibility must be preserved by the review.** The former must never be offered as evidence of the latter |
| F-7 | ⚠ **PIT remains unresolved** for this phase — see B-2. Depth is not PIT (PC-2) |
| F-8 | ⚠ **`DEP-P01-04`** — historical series structure / storage — **remains UNRESOLVED**; owner **P08** |
| F-9 | ⚠ **Adjusted-series generation remains P08 scope** (RC-5). Not performed, and not required of P05 by this artifact |
| F-10 | ⚠ **`barInterval`: the only currently authorized concrete value is `1D`.** It is a **declared/versioned capability**, not an accepted enumeration — `enumeratedByAcceptedArtifact: false`. **No other interval is enumerated, exemplified, implied or invented here.** Adding one requires an authority act |
| F-11 | ⚠ **`sessionRef`** is listed for D02 by `P01_SCHEMA_CATALOG.md` but is **not defined** by `P01_FIELD_DICTIONARY.md` §4. **Recorded, NOT invented** — no session semantics are assumed |
| F-12 | ⚠ **One bar per snapshot** is a reused P05-01 representation. It **must not be read as resolving** the P08 series-structure decision |

## G. P05-04 — ingestion orchestration

| # | Criterion |
|---|---|
| G-1 | ⚠ **P05-04 is NOT AUTHORIZED.** D9 **N-3**: *"Not included in the approved scope … requires a further explicit act"* |
| G-2 | ⚠ **No P05-04 implementation exists and no replay / failure-test / run-log evidence exists.** C-4 has no evidence of any kind |
| G-3 | ⚠ **The acceptance review must NOT treat P05-04 as completed, partially completed, or implied by P05-01 replay idempotency.** P05-01 replay idempotency is a different claim about a different component |
| G-4 | ⚠ **A concession cannot authorize P05-04.** Authorization requires an explicit authority act. Any proposal to accept P05 while P05-04 is unbuilt is a **gate-scope decision for the A3 acceptor**, is not made here, and must not be recorded as a mere concession |

## H. Namespace and canonical-contract integrity

| # | Criterion |
|---|---|
| H-1 | Namespace token `MD:` and canonical form `MD:<domain>.<field>` preserved exactly; namespace version stated |
| H-2 | Implementation vocabulary equals the accepted `P01_FIELD_DICTIONARY` set exactly — mechanically asserted, not asserted in prose |
| H-3 | ⚠ **No vocabulary added, no canonical field key renamed, retyped or removed** |
| H-4 | **ADR-01 C1–C6** unchanged; collision guard fail-closed |
| H-5 | Provider-native payloads remain confined to adapters; no provider vocabulary reaches the canonical model |

## I. Identity, cardinality and lifecycle

| # | Criterion |
|---|---|
| I-1 | **OI-08** 1:N cardinality preserved; **OI-09** FIGI/OpenFIGI authority preserved; neither reopened |
| I-2 | Lifecycle vocabulary unchanged — the accepted five states; a transition never mutates the canonical ID; state never inferred from absence |
| I-3 | `snapshotId` composition unchanged — `data-${provider}-${dataVersion}-${asOf}`; **no component added**; no additional identity layer introduced |
| I-4 | Unmapped identity fails explicitly — no coercion, no placeholder, no synthesized join key |

## J. Validation, error taxonomy and degraded-state classification

| # | Criterion |
|---|---|
| J-1 | **P02 error taxonomy E1–E8 unchanged**; no parallel or additional taxonomy created |
| J-2 | **Degraded state is classified, not coerced** (B-3); rejection and quality are never conflated |
| J-3 | The quality-bearing class surface is bounded and stated; empty fields permitted only where the accepted contract permits them |
| J-4 | Failures are deterministic, named and reproducible |

## K. D9 authorization boundary — preserved exactly

| # | Criterion |
|---|---|
| K-1 | **A-1** P05-01 local deterministic feed — authorized **FULL** |
| K-2 | **A-2** P05-02 LIVE market adapter — authorized **specification / adapter-contract ONLY** |
| K-3 | **A-3** P05-03 historical market adapter — authorized **specification / adapter-contract ONLY** |
| K-4 | ⚠ **P05-04 — NOT AUTHORIZED** |
| K-5 | ⚠ **N-1** live provider execution **not authorized** |
| K-6 | ⚠ **N-2** licensed / deeper historical acquisition **not authorized** |
| K-7 | ⚠ **N-3** P05-04 ingestion-orchestration build-out **not authorized** |
| K-8 | ⚠ **N-4 / N-5** per-record tenant/region governance **not authorized**; the attribute set is not invented or defaulted |
| K-9 | ⚠ **No criterion in this artifact may be read as asserting that unauthorized work was performed.** The absence of provider execution, licensed acquisition and orchestration is **correct compliance with D9**, and must not be recharacterized as a shortfall of the implementers, nor as work silently conceded |

## L. Upstream and downstream dependencies

| # | Criterion |
|---|---|
| L-1 | ⚠ **P16 — production activation authority gate**: licensing, credentials, production connectivity, entitlement validation. **Not reached.** The A4 activation control applies at P16 only |
| L-2 | ⚠ **P15 — Full E2E certification gate**: **BLOCKED** on M-1/AD-4 revalidation (existing-IIPS). P16 depends on P15 |
| L-3 | ⚠ **OI-P04-04** — FIGI source availability, licensing and coverage: **OPEN — downstream**. Recorded *"Blocks preparation? NO"*. Not resolved here |
| L-4 | ⚠ **OI-P04-03** — tenant / region governance attribute set: **OPEN — content**, owner A1, bounded by IB-1…IB-5. Not resolved here |
| L-5 | ⚠ **DEP-P01-04** — historical series structure / storage: **UNRESOLVED**, owner **P08**. Not resolved here |
| L-6 | ⚠ **None of L-1…L-5 is resolved, decided, bounded differently, or converted into an assumption by this artifact** |

## M. Open-item discipline

| # | Criterion |
|---|---|
| M-1 | **Open items remain recorded.** Every P05 open item is present in the record at the time of the review |
| M-2 | ⚠ **Items requiring an authority decision remain explicitly `NOT DECIDED`.** Recording an item is not resolving it |
| M-3 | ⚠ **No open item is silently converted to `PASS`, `SATISFIED` or `MET`** — including by omission from this criteria list |
| M-4 | **Deferred items remain `DEFERRED — NOT PASSED`.** No deferred obligation is marked discharged |
| M-5 | ⚠ **No criterion is weakened, restated more loosely, or removed merely because an open item is inconvenient.** See the BD-1 safeguard |
| M-6 | Historical artifacts recording an item as OPEN — including the records naming the A3 gate acceptor as `UNKNOWN` — are **left unedited** as the record of their own moment |
| M-7 | Existing-IIPS items **M-1 / AD-4**, **M-5**, **M-6**, **AD-17 / M-2** and deferred obligations **DO-P04-1…5 / DO-1…DO-5** remain open or deferred; none is repaired, revalidated, waived or reclassified by a P05 review |
| M-8 | ⚠ **BD-P05-01-01…10, BD-P05-02-01…10 and BD-P05-03-01…10 remain recorded.** This artifact resolves none of them |

## N. Non-goals honoured

| # | Criterion |
|---|---|
| NG-1 | ⚠ **No P05 acceptance.** This artifact does not accept the P05 gate |
| NG-2 | ⚠ **No `P05_GATE_ACCEPTANCE.md` created.** It does not exist and must not exist until an acceptance act occurs |
| NG-3 | ⚠ **No certification granted or implied**; no certification evidence created |
| NG-4 | ⚠ **No production activation** |
| NG-5 | ⚠ **No P05-04 authorization**, and no P05-04 implementation |
| NG-6 | ⚠ **No provider selected**; no provider named, inferred or implied |
| NG-7 | ⚠ **No provider credentials** provisioned, referenced or exemplified |
| NG-8 | ⚠ **No licensed-data acquisition** |
| NG-9 | ⚠ **No P16 execution** |
| NG-10 | ⚠ **No P08 implementation** — no PIT storage, no PIT query, no series-storage model, no adjusted-series generation |
| NG-11 | ⚠ **OI-P04-03 not resolved**; the governance attribute set is not invented or defaulted |
| NG-12 | ⚠ **OI-P04-04 not resolved** |
| NG-13 | ⚠ **DEP-P01-04 not resolved** |
| NG-14 | ⚠ **No concession decision is made by this artifact**, and no concessions register is created or amended by it |
| NG-15 | ⚠ **No existing-IIPS modification**; no methodology, scoring, calibration or taxonomy change |
| NG-16 | ⚠ **No authority decision of any kind is taken here** — including the binding effect of the TRACKER exit criteria (C-5) |

## O. Evidence and traceability

| # | Criterion |
|---|---|
| O-1 | **Pinned baseline HEAD** recorded: **`7bc747b43e54ea2c70620fb8ac62a0078bd3f1f6`** (`P00_EVIDENCE_CONVENTIONS.md` §1.3 — a pinned commit is mandatory) |
| O-2 | **Artifact inventory with checksums** for every artifact the review relies on (`P00_EVIDENCE_CONVENTIONS.md` §6.1) |
| O-3 | ⚠ **Non-circular evidence.** An artifact's own integrity claim may not be the sole proof of that integrity; digest self-consistency must be independently recomputed |
| O-4 | **Integrity proof that forbidden files are unchanged** — accepted P00–P04 artifacts, checkpoint records, `p05/src`, `p05/tests`, `p05/fixtures`, `p05/evidence`, `p05/evidence-p05-02`, `p05/evidence-p05-03` (`P00_EVIDENCE_CONVENTIONS.md` §6.2) |
| O-5 | **Traceability matrix: each claim → its cited source** (`P00_EVIDENCE_CONVENTIONS.md` §6.3) |
| O-6 | **Open-item status at the time of the gate** recorded (`P00_EVIDENCE_CONVENTIONS.md` §6.4) |
| O-7 | **Explicit boundary / integrity statement** (`P00_EVIDENCE_CONVENTIONS.md` §6.5) |
| O-8 | **Execution evidence where the phase produces runnable behaviour** (`P00_EVIDENCE_CONVENTIONS.md` §6.6) |
| O-9 | ⚠ **`reproduced` / `byteIdentical` literals must not be presented as verified reproduction** — `P00_EVIDENCE_CONVENTIONS.md` §4 prohibition 4 (**AD-17 unresolved**). Reproducibility claims must be demonstrated, not asserted |
| O-10 | Traceability to **`docs/p00/P00_GATE_MODEL.md`**:40 (gate intent, minimum evidence) and :58-65 (six acceptance requirements) |
| O-11 | Traceability to **`docs/p00/P00_EVIDENCE_CONVENTIONS.md`** §1, §4, §6 |
| O-12 | Traceability to **D9** — `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 (A-1, A-2, A-3) and N-1…N-5; `docs/d9/D9_STATUS.json` |
| O-13 | Traceability to **P05-01 evidence** — `p05/evidence/` (13 artifacts) and `docs/p05/P05_01_EVIDENCE.md` |
| O-14 | Traceability to **P05-02 evidence** — `p05/evidence-p05-02/` (13 artifacts) and `docs/p05/P05_02_EVIDENCE.md` |
| O-15 | Traceability to **P05-03 evidence** — `p05/evidence-p05-03/` (13 artifacts) and `docs/p05/P05_03_EVIDENCE.md` |
| O-16 | Traceability to **TRACKER** *Work Tracker*!P05-01…P05-04 and *Phase Gates*!P05 |
| O-17 | ⚠ **No evidence is invented.** Where evidence does not exist, the criterion records that it does not exist |

---

## Status of this artifact

| Field | Value |
|---|---|
| Criteria **defined** | **YES** |
| Criteria **assessed** | **NOT PERFORMED** |
| P05 gate | **NOT ACCEPTED** |
| Formal gates | **5 of 18** |
| Certification | **`NONE_GRANTED`** |
| Activation | **`NOT_AUTHORIZED`** |
| P05-04 | **`NOT_AUTHORIZED`** |
| A3 P05 gate acceptor | **Ramakrishnan V. S. (Ramki)** — designated; **designation ≠ acceptance** |
| Pinned baseline | `7bc747b43e54ea2c70620fb8ac62a0078bd3f1f6` |
| Decisions taken by this artifact | **NONE** |
