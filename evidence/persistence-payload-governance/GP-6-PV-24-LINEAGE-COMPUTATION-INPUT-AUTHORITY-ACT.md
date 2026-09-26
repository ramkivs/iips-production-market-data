# GP-6 — PV-24 LINEAGE COMPUTATION INPUT AUTHORITY ACT
# EXPLICIT RAMKI DESIGNATION / NO INFERENCE / NO ALGORITHM SELECTION / NO IMPLEMENTATION

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-pv-24-lineage-computation-input-authority-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : LINEAGE INPUT DESIGNATION AUTHORITY ACT (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : 31b6e657f35573438d2e73d599c4f469fa72827e

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

Every value below was re-derived from the repository and the authoritative remote during this
execution. No value was taken from any prompt, prior output, or memory.

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit | `31b6e657f35573438d2e73d599c4f469fa72827e` |
| Antecedent tree | `58d61b6f0fb959838167a50985afdcec3bf489ff` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| Worktree at entry | CLEAN |
| E1 record blob | `a98ff50214d1cef3134b5527c8b559af43979184` |
| E2 record blob | `cb14a44808305e84659727b832dc03340ed5e5f8` |
| E4 record blob | `20e08e650fb74fff09d66ddd3961417cf4050f91` |
| E6 specification blob | `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0` |
| E6 vocabulary preparation blob | `4efaca6593ad9f7faf44a46deda460dc61034254` |
| E6 vocabulary assignment act blob | `df89ae6879f7a094728619d6b3522170bf9b49bc` |
| `src/contracts` tree | `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — byte-identical to authoritative `main` |
| `src/transports` tree | `b2369fa57b16c99878639cf645b15da2ef358a86` — byte-identical to authoritative `main` |
| E6 lineage decision sheet | **NOT A REPOSITORY RECORD** — produced by a read-only gate that created no file; its findings are re-derived live in section 3 |

## 2. AUTHORITY BASIS

| Item | State |
| --- | --- |
| Governing authority | **RAMKI** |
| Authority act | PV-24 Lineage Computation Input Designation |
| Authority to record this artifact | **GRANTED BY RAMKI IN THIS ACT** |
| Disposition values | **SUPPLIED VERBATIM BY RAMKI** |
| Arena role | Recording agent only |
| Arena recommendation contributing to these dispositions | **NONE** |

The E6 provenance dimension **PV-24 — "Lineage computation inputs for a workspace payload"** was
recorded in the E6 specification (blob `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0`) with state `NOT DESIGNATED` and dependency
"Separate RAMKI act". This act discharges that dependency.

## 3. EXISTING LINEAGE IMPLEMENTATION — REFERENCE ONLY

The following was re-read from the live frozen contract in this execution. It is recorded as
**OBSERVATION ONLY**. Nothing in this section is designated, selected, adopted, or authorized.

| Observed property | Observed value |
| --- | --- |
| Function | `computeLineageHash` — `src/contracts/provenance.ts:117` |
| Observed input positions | `payload`, `sourceClassification`, `asOf`, `dataVersion`, `parentHash` |
| Live call expressions | 31 |
| Importing non-test files | 18 |
| Workspace call sites (P-B/P-C/P-D/P-E) | **0** |
| Algorithm observed | **OBSERVATION ONLY — NOT SELECTED BY THIS ACT** |
| Serialization observed | **OBSERVATION ONLY — NOT SELECTED BY THIS ACT** |
| Field ordering observed | **OBSERVATION ONLY — NOT DESIGNATED BY THIS ACT** |
| Parent chaining observed | **OBSERVATION ONLY — NOT DESIGNATED BY THIS ACT** |

```text
EXISTING LINEAGE IMPLEMENTATION = REFERENCE ONLY
```

## 4. PV-24 DESIGNATION MATRIX

The 20 dispositions below were supplied verbatim by RAMKI and are transcribed without alteration.
No input was invented; every input name is one of the five observed lineage input positions.

| Domain | Lineage input | Disposition |
| --- | --- | --- |
| P-B Watchlists | payload | **DESIGNATED** |
| P-B Watchlists | sourceClassification | **NOT DESIGNATED** |
| P-B Watchlists | asOf | **DESIGNATED** |
| P-B Watchlists | dataVersion | **NOT DESIGNATED** |
| P-B Watchlists | parentHash | **NOT DESIGNATED** |
| P-C Reports | payload | **DESIGNATED** |
| P-C Reports | sourceClassification | **NOT DESIGNATED** |
| P-C Reports | asOf | **DESIGNATED** |
| P-C Reports | dataVersion | **NOT DESIGNATED** |
| P-C Reports | parentHash | **NOT DESIGNATED** |
| P-D Collaboration | payload | **DESIGNATED** |
| P-D Collaboration | sourceClassification | **NOT DESIGNATED** |
| P-D Collaboration | asOf | **DESIGNATED** |
| P-D Collaboration | dataVersion | **NOT DESIGNATED** |
| P-D Collaboration | parentHash | **NOT DESIGNATED** |
| P-E Settings | payload | **DESIGNATED** |
| P-E Settings | sourceClassification | **NOT DESIGNATED** |
| P-E Settings | asOf | **DESIGNATED** |
| P-E Settings | dataVersion | **NOT DESIGNATED** |
| P-E Settings | parentHash | **NOT DESIGNATED** |

## 5. DESIGNATION TOTALS

```text
DOMAINS                = 4
LINEAGE INPUTS         = 5
CELLS                  = 20
DESIGNATED             = 8
NOT DESIGNATED         = 12
PLACEHOLDERS           = 0
UNKNOWN TOKENS         = 0
INVENTED INPUTS        = 0
```

## 6. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| Existing lineage implementation = **reference only** |
| **No workspace lineage implementation created** |
| **No algorithm selected** |
| **No serialization protocol selected** |
| **No vocabulary values assigned** |
| **No dataVersion semantics assigned** |
| **No ownership semantics assigned** |
| **No E5 authority created** |
| **No E10 authority created** |
| `PV-24 INPUT DESIGNATION` **!=** `LINEAGE IMPLEMENTATION` |
| No source, contract, transport, test, fixture, schema, DTO, or configuration file is modified |
| No persistence, UI, API, or provider adapter is created or altered |

A disposition of `DESIGNATED` records that RAMKI has designated that input position as in scope
for the named domain. It does **not** authorize computing a digest, does not select how the input
is serialized or hashed, and does not create a call site.

## 7. STRICT NON-INFERENCE

| Statement | State |
| --- | --- |
| Dispositions originate from RAMKI authority | **YES** — supplied verbatim |
| Any disposition inferred by Arena | **NO** — 0 |
| Any disposition derived from existing implementation behaviour | **NO** — 0 |
| Any disposition derived from prior records or D8 history | **NO** — 0 |
| Any disposition derived from model judgement | **NO** — 0 |
| Any lineage input invented | **NO** — 0 |
| Any algorithm, serialization, ordering or chaining selected | **NO** — 0 |
| Any vocabulary member assigned | **NO** — 0 |
| Recommendation recorded as a designation | **NO** — 0 |

The E6 provenance vocabulary assignment remains authoritative and unchanged: SourceClassification,
VendorTier, QualityState and the `dataVersion` semantic are **UNASSIGNED** for P-B, P-C, P-D and
P-E. The appearance of `sourceClassification` and `dataVersion` as **input names** in the matrix
is a lineage-input disposition and is **not** a vocabulary value assignment.

## 8. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E1 — payload interface specification | **UNCHANGED** — referenced, not modified |
| E2 — designated field semantics | **UNCHANGED** — referenced, not modified |
| E4 — validation semantic specification | **UNCHANGED** — referenced, not modified |
| E6 — provenance semantic specification | **UNCHANGED** — referenced, not modified |
| E6 — provenance vocabulary assignment | **UNCHANGED** — all values remain UNASSIGNED |
| E3 — ownership / identity | **BLOCKED** — D115 C/D UNRESOLVED, `runtimeCompanyId` UNRESOLVED, GP-4 BLOCKED |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E7 — persistence implementation | **NOT GRANTED** |
| E8 — numeric retention | **NOT DESIGNATED** |
| E9 — transport / serialization | **GP-3 NOT AUTHORIZED**, transport authority NOT GRANTED |
| E10 — frozen contract infrastructure | Authority to modify **NOT CREATED** |
| `D115` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** — unchanged |
| D115 production activation | **NOT AUTHORIZED** — unchanged |
| `productionEligible` | **UNCHANGED** |
| `GP-3` | **NOT AUTHORIZED** — unchanged |
| `GP-4` | **UNRESOLVED / BLOCKED** — unchanged |
| `runtimeCompanyId` | **UNRESOLVED** — unchanged |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** — unchanged |
| `P-A` / `P-F` | **OUTSIDE GP-6** — unchanged |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this act exercises it, it does not extend it |

## 9. EXPLICIT NON-AUTHORIZATIONS

| Item | State after this act |
| --- | --- |
| `LINEAGE_ALGORITHM_SELECTION` | **NOT PERFORMED** |
| `SERIALIZATION_SELECTION` | **NOT PERFORMED** |
| `WORKSPACE_LINEAGE_IMPLEMENTATION` | **0** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS RECORD** |
| `E1_CONTRACT_COMPLETION` | **NOT PERFORMED** |
| `E4_VALIDATOR_IMPLEMENTATION` | **NOT PERFORMED** |
| `E5_AUTHORITY` | **NOT CREATED** |
| `E10_AUTHORITY` | **NOT CREATED** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 10. SUPERSESSION

This act supersedes no prior record. It discharges the PV-24 dependency named by the E6
provenance semantic specification. All antecedent records remain in force, unmodified, at the
blobs recorded in section 1.

## 11. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
PV-24_LINEAGE_INPUT_AUTHORITY = ESTABLISHED

DESIGNATED                  = 8
NOT_DESIGNATED              = 12
LINEAGE_ALGORITHM_SELECTION = NOT PERFORMED
SERIALIZATION_SELECTION     = NOT PERFORMED
IMPLEMENTATION              = 0
VOCABULARY_ASSIGNMENT       = 0
```

```text
LINEAGE INPUT DESIGNATION   !=   LINEAGE IMPLEMENTATION
NO WORKSPACE LINEAGE IMPLEMENTATION EXISTS OR IS AUTHORIZED.
```
