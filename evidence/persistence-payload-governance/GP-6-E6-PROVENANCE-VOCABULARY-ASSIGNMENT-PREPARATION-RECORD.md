# GP-6 — E6 PROVENANCE VOCABULARY ASSIGNMENT PREPARATION RECORD
# AUTHORITY-FIRST / NO INFERENCE / NO IMPLEMENTATION / NO SELECTION

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-provenance-vocabulary-assignment-preparation-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : PREPARATION EVIDENCE RECORD (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : 45305e91c5f1f1dc37048fe42b1ddb947db1e1ab

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

Every value below was re-derived from the repository and the authoritative remote in this
execution. No value was taken from any prompt, prior output, or memory.

| Item | Value |
| --- | --- |
| Authoritative remote | `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| Workstream HEAD | `45305e91c5f1f1dc37048fe42b1ddb947db1e1ab` (local == `ls-remote` == GitHub API) |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) |
| E6 specification commit | `45305e91c5f1f1dc37048fe42b1ddb947db1e1ab` |
| E6 specification blob | `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0` |
| E1 blob | `a98ff50214d1cef3134b5527c8b559af43979184` |
| E2 blob | `cb14a44808305e84659727b832dc03340ed5e5f8` |
| E4 blob | `20e08e650fb74fff09d66ddd3961417cf4050f91` |
| Semantic census blob | `ab8c37fbffd93a922774058469a84ced4bf52b1d` |
| Worktree | CLEAN before this record was written |

This record is **preparation evidence only**. It designates nothing.

---

## 2. AUTHORITY BASIS

| Question | Answer |
| --- | --- |
| Does this record designate provenance vocabulary? | **NO** |
| Does this record select, rank or recommend any member? | **NO** |
| Does this record create vocabulary? | **NO** |
| What does it do? | Enumerates the frozen vocabulary that already exists, and states the open questions |
| What authority performs the designation? | A separate explicit **RAMKI** E6 provenance vocabulary assignment act |
| Is that act present in the repository? | **NO** |

---

## 3. ACTUAL FROZEN PROVENANCE VOCABULARY (read-only inspection)

### 3.1 Which vocabularies are provenance vocabularies

Membership in this section was **not** inferred from type names. A vocabulary is listed here
only if it is the **declared type of a field of `DataProvenanceDTO`**.

| Vocabulary | Declared at | Member count | Members (exact) | Provenance field(s) using it | Application to GP-6 domains |
| --- | --- | --- | --- | --- | --- |
| `QualityState` | `src/contracts/types.ts:11` | 4 | `GOOD` · `STALE` · `PARTIAL` · `UNAVAILABLE` | `qualityState` | **NOT DESIGNATED** |
| `SourceClassification` | `src/contracts/types.ts:20` | 4 | `CANONICAL_MARKET_DATA` · `REAL` · `DERIVED` · `CERTIFIED_ENGINE` | `sourceClassification` | **NOT DESIGNATED** |
| `VendorTier` | `src/contracts/types.ts:26` | 4 | `TIER_1_EXCHANGE` · `TIER_2_COMMERCIAL` · `OFFLINE_BOOTSTRAP` · `MOCK_FIXTURE` | `vendorTier` | **NOT DESIGNATED** |

### 3.2 Exact members, enumerated

```text
QualityState  —  declared src/contracts/types.ts:11  —  4 members
  1. GOOD
  2. STALE
  3. PARTIAL
  4. UNAVAILABLE
```

```text
SourceClassification  —  declared src/contracts/types.ts:20  —  4 members
  1. CANONICAL_MARKET_DATA
  2. REAL
  3. DERIVED
  4. CERTIFIED_ENGINE
```

```text
VendorTier  —  declared src/contracts/types.ts:26  —  4 members
  1. TIER_1_EXCHANGE
  2. TIER_2_COMMERCIAL
  3. OFFLINE_BOOTSTRAP
  4. MOCK_FIXTURE
```

### 3.3 Provenance fields that have NO enumerated vocabulary

These fields are declared as unconstrained primitives. No member list exists to assign from.

| Field | Declared type | Declared at | Optionality | Enumerated vocabulary |
| --- | --- | --- | --- | --- |
| `asOf` | `string` | `src/contracts/provenance.ts:13` | required | **NONE** |
| `receivedAt` | `string` | `src/contracts/provenance.ts:14` | required | **NONE** |
| `evaluatedAt` | `string` | `src/contracts/provenance.ts:15` | required | **NONE** |
| `dataVersion` | `string` | `src/contracts/provenance.ts:16` | required | **NONE** |
| `lineageHash` | `string` | `src/contracts/provenance.ts:17` | required | **NONE** |
| `quarantineReason` | `string` | `src/contracts/provenance.ts:19` | optional | **NONE** |
| `traceId` | `string` | `src/contracts/provenance.ts:20` | optional | **NONE** |
| `correlationId` | `string` | `src/contracts/provenance.ts:21` | optional | **NONE** |
| `tenantId` | `string` | `src/contracts/provenance.ts:22` | optional | **NONE** |

### 3.4 Measurement method

| Property | Method |
| --- | --- |
| Member counts | Quoted string literals across the whole declaration — **not** line counts |
| Vocabulary selection | Declared field type of `DataProvenanceDTO`, read structurally |
| Controls | Positive control (synthetic 3-member union -> 3) and negative control (non-union -> 0) both executed |
| Alternative vocabulary forms | `export enum` = 0 files, `as const` = 0 files in `src/contracts` |

---

## 4. E6 DIMENSIONS REQUIRING SEPARATE VOCABULARY AUTHORITY

Selected mechanically from the durable E6 record `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0`: a dimension appears here only if its
recorded UNRESOLVED DEPENDENCY cell names a vocabulary authority or undetermined semantics.

| ID | E6 dimension | Existing vocabulary | Existing members | Current designation |
| --- | --- | --- | --- | --- |
| VA-01 | PV-01 `sourceClassification` | `SourceClassification` (`src/contracts/types.ts:20`) | 4 — `CANONICAL_MARKET_DATA` · `REAL` · `DERIVED` · `CERTIFIED_ENGINE` | **NOT DESIGNATED** |
| VA-02 | PV-02 `vendorTier` | `VendorTier` (`src/contracts/types.ts:26`) | 4 — `TIER_1_EXCHANGE` · `TIER_2_COMMERCIAL` · `OFFLINE_BOOTSTRAP` · `MOCK_FIXTURE` | **NOT DESIGNATED** |
| VA-03 | PV-03 `asOf` | **NONE** — declared `string` (`src/contracts/provenance.ts:13`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-04 | PV-04 `receivedAt` | **NONE** — declared `string` (`src/contracts/provenance.ts:14`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-05 | PV-05 `evaluatedAt` | **NONE** — declared `string` (`src/contracts/provenance.ts:15`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-06 | PV-06 `dataVersion` | **NONE** — declared `string` (`src/contracts/provenance.ts:16`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-07 | PV-08 `qualityState` | `QualityState` (`src/contracts/types.ts:11`) | 4 — `GOOD` · `STALE` · `PARTIAL` · `UNAVAILABLE` | **NOT DESIGNATED** |
| VA-08 | PV-09 `quarantineReason` | **NONE** — declared `string` (`src/contracts/provenance.ts:19`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-09 | PV-10 `traceId` | **NONE** — declared `string` (`src/contracts/provenance.ts:20`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |
| VA-10 | PV-11 `correlationId` | **NONE** — declared `string` (`src/contracts/provenance.ts:21`) | **NOT APPLICABLE** — no enumerated vocabulary exists | **NOT DESIGNATED** |

Every row is **NOT DESIGNATED**. No row carries a selected, preferred, default or suggested value.

---

## 5. DOMAIN APPLICABILITY SURFACE

The four GP-6 domains are distinguished. It is **not** assumed that any vocabulary applies to all
four, to any one, or to none. Applicability is an open question for RAMKI, recorded as unknown.

| ID | Provenance element | P-B Watchlists | P-C Reports | P-D Collaboration | P-E Settings |
| --- | --- | --- | --- | --- | --- |
| VA-01 | `sourceClassification` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-02 | `vendorTier` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-03 | `asOf` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-04 | `receivedAt` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-05 | `evaluatedAt` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-06 | `dataVersion` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-07 | `qualityState` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-08 | `quarantineReason` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-09 | `traceId` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |
| VA-10 | `correlationId` | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** | **NOT DESIGNATED** |

| Applicability question | State |
| --- | --- |
| Does any existing vocabulary apply to P-B? | **NOT DESIGNATED** |
| Does any existing vocabulary apply to P-C? | **NOT DESIGNATED** |
| Does any existing vocabulary apply to P-D? | **NOT DESIGNATED** |
| Does any existing vocabulary apply to P-E? | **NOT DESIGNATED** |
| Do the four domains share one assignment? | **NOT DESIGNATED** |
| May a domain carry no provenance at all? | **NOT DESIGNATED** |
| Repository evidence mapping any member to a GP-6 domain | **NONE FOUND** (0 occurrences of the four domain tokens in `src/contracts`) |

---

## 6. dataVersion EVIDENCE

| Question | Evidence | Result |
| --- | --- | --- |
| Declared type of the field | `src/contracts/provenance.ts:16` declares `dataVersion: string` | unconstrained primitive |
| Is there a `DataVersion` type / enum / interface / const anywhere in the tracked tree? | 0 declaration(s) found | **NONE EXISTS** |
| Is there a documented semantic definition? | No contract, schema or governance act defines it | **NONE EXISTS** |
| Observed literal values assigned in the existing codebase | 26 distinct strings, ad hoc, per subsystem | **OBSERVATION ONLY** |
| Meaning of `dataVersion` for P-B/P-C/P-D/P-E | No authoritative definition exists | **NOT DESIGNATED** |

The 26 distinct literals observed in the frozen tree are recorded as an observation of existing
market-data/engine behaviour. They are **not** a vocabulary, **not** a candidate list, and **not** a
recommendation. No meaning is inferred from their spelling.

```text
  v1
  v1-live
  v1.0
  v1.0.0
  v1.0.0-bi03
  v1.0.0-bi05
  v1.0.0-bi07
  v1.0.0-certified-frozen
  v1.0.0-csip-frozen
  v1.0.0-d114-dual-era-reconciliation
  v1.0.0-d114-feasibility
  v1.0.0-d114-handoff-accepted
  v1.0.0-d114-handoff-rejected
  v1.0.0-d114-historical
  v1.0.0-d114-reconciliation
  v1.0.0-d114-stage5-validation
  v1.0.0-e2e-evidence
  v1.0.0-kill-switch-empirical
  v1.0.0-oq-evidence
  v1.0.0-raw
  v1.0.0-rc1-manifest
  v1.0.0-score
  v1.0.0-screener
  v1.0.0-sec-master
  v1.0.0-transport
  v1.0.0-ui-viewmodel
```

---

## 7. STRICT NON-INFERENCE

| Item | State after this record |
| --- | --- |
| `SourceClassification` member designated | **NOT DESIGNATED** |
| `VendorTier` member designated | **NOT DESIGNATED** |
| `QualityState` member designated | **NOT DESIGNATED** |
| `dataVersion` semantics | **NOT DESIGNATED** |
| Provenance freshness rules | **NOT DESIGNATED** |
| Provenance confidence | **NOT DESIGNATED** |
| Source authority | **NOT DESIGNATED** |
| Provider preference | **NOT DESIGNATED** |
| Vendor preference | **NOT DESIGNATED** |
| Source ranking | **NOT DESIGNATED** |
| Domain applicability | **NOT DESIGNATED** |
| Recommendation offered | **NONE** |
| Ranking offered | **NONE** |
| Default proposed | **NONE** |
| New member invented | **NONE** |
| Existing member extended, renamed or re-scoped | **NONE** |

```text
ENUMERATION OF AN EXISTING VOCABULARY   !=   ASSIGNMENT OF THAT VOCABULARY
PREPARATION EVIDENCE                    !=   AUTHORITY
```

---

## 8. PRESERVED INDEPENDENT BLOCKERS

This preparation relieves none of the following. Each remains exactly as before this record.

| Element | State |
| --- | --- |
| E1 — payload interface specification | **UNCHANGED** — referenced, not modified |
| E2 — designated field semantics | **UNCHANGED** — referenced, not modified |
| E4 — validation semantic specification | **UNCHANGED** — referenced, not modified |
| E6 — provenance semantic specification | **UNCHANGED** — referenced, not modified |
| E3 — ownership / identity | **BLOCKED** — D115 C/D UNRESOLVED, `runtimeCompanyId` UNRESOLVED, GP-4 BLOCKED |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E7 — persistence implementation | **NOT GRANTED** |
| E8 — numeric retention | **NOT DESIGNATED** |
| E9 — transport / serialization | **GP-3 NOT AUTHORIZED**, transport authority NOT GRANTED |
| E10 — frozen contract infrastructure | Authority to modify **NOT CREATED** |
| `D115` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** — unchanged |
| D115 production activation | **NOT AUTHORIZED** — unchanged |
| `GP-3` | **NOT AUTHORIZED** — unchanged |
| `GP-4` | **UNRESOLVED / BLOCKED** — unchanged |
| `runtimeCompanyId` | **UNRESOLVED** — unchanged |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** — unchanged |
| `P-A` / `P-F` | **OUTSIDE GP-6** — unchanged |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this record exercises it, it does not extend it |

---

## 9. EXPLICIT NON-AUTHORIZATIONS

```text
NO PROVENANCE VOCABULARY DESIGNATED BY THIS RECORD
NO RECOMMENDATION OR SELECTION MADE BY THIS RECORD
NO IMPLEMENTATION AUTHORIZED BY THIS RECORD
NO MODIFICATION OF FROZEN CONTRACT INFRASTRUCTURE
```

| Item | State after this record |
| --- | --- |
| `E6_VOCABULARY_ASSIGNMENT` | **NOT PERFORMED** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS RECORD** |
| `E1_CONTRACT_COMPLETION` | **NOT PERFORMED** |
| `E4_VALIDATOR_IMPLEMENTATION` | **NOT PERFORMED** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

---

## 10. AUTHORITY STILL REQUIRED

| Requirement | Authority |
| --- | --- |
| Assign `SourceClassification` per domain | Separate explicit RAMKI E6 provenance vocabulary assignment act |
| Assign `VendorTier` per domain | Separate explicit RAMKI E6 provenance vocabulary assignment act |
| Assign `QualityState` applicability per domain | Separate explicit RAMKI E6 provenance vocabulary assignment act |
| Define `dataVersion` semantics | Separate explicit RAMKI act; no definition exists to reference |
| Define timestamp semantics (`asOf`, `receivedAt`, `evaluatedAt`) | Separate explicit RAMKI act |
| Define `quarantineReason`, `traceId`, `correlationId` semantics | Separate explicit RAMKI act |
| Decide whether a vocabulary applies to a domain at all | RAMKI alone |
| Bind provenance to ownership / tenancy | E3 + D115 C/D + GP-4 — all BLOCKED |
| Attach provenance to a workspace envelope | E5 + E10 relief — BLOCKED |

---

## 11. SUPERSESSION

This record supersedes nothing. It amends nothing. It reopens nothing.
The E6 specification `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0`, E1, E2, E4 and the semantic census remain byte-identical.

---

## 12. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_VOCABULARY_ASSIGNMENT_PREPARATION = ESTABLISHED (governance record only)
VOCABULARIES_ENUMERATED              = 3
VOCABULARY_MEMBERS_ENUMERATED        = 12
VOCABULARY_MEMBERS_INVENTED          = 0
VOCABULARY_VALUES_DESIGNATED         = 0
RECOMMENDATIONS_MADE                 = 0
DOMAIN_ASSIGNMENTS_CREATED           = 0
E6_VOCABULARY_ASSIGNMENT             = NOT PERFORMED
IMPLEMENTATION                       = 0
```

```text
PREPARATION EVIDENCE   !=   VOCABULARY DESIGNATION
NO E6 PROVENANCE VOCABULARY HAS BEEN DESIGNATED.
```
