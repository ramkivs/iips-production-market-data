# GP-6 — E6 PROVENANCE VOCABULARY ASSIGNMENT ACT
# EXPLICIT RAMKI DESIGNATION / NO INFERENCE / NO SELECTION / NO IMPLEMENTATION

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-provenance-vocabulary-assignment-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : VOCABULARY ASSIGNMENT AUTHORITY ACT (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : 19158540090de33daffec54898c97f855a220a7f

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

Every value below was re-derived from the repository and the authoritative remote during this
execution. No value was taken from any prompt, prior output, or memory.

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit | `19158540090de33daffec54898c97f855a220a7f` |
| Antecedent tree | `36a7d69c044b66a54ecc34d0d03df62689ec85a8` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| Worktree at entry | CLEAN |
| E1 record blob | `a98ff50214d1cef3134b5527c8b559af43979184` |
| E2 record blob | `cb14a44808305e84659727b832dc03340ed5e5f8` |
| E4 record blob | `20e08e650fb74fff09d66ddd3961417cf4050f91` |
| E6 specification blob | `f81ebdef499100f23dff9fd4d8f34e13fb9b97d0` |
| E6 vocabulary preparation blob | `4efaca6593ad9f7faf44a46deda460dc61034254` |
| `src/contracts` tree | `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — byte-identical to authoritative `main` |
| `src/transports` tree | `b2369fa57b16c99878639cf645b15da2ef358a86` — byte-identical to authoritative `main` |

## 2. AUTHORITY BASIS

| Item | State |
| --- | --- |
| Governing authority | **RAMKI** |
| Authority act | E6 Provenance Vocabulary Assignment |
| Authority to record this artifact | **GRANTED BY RAMKI IN THIS ACT** |
| Assignment values | **SUPPLIED VERBATIM BY RAMKI** |
| Arena role | Recording agent only |
| Arena recommendation contributing to these values | **NONE** — the preceding read-only decision sheet reported `RECOMMENDATION = NONE` |

## 3. EXACT VOCABULARY MEMBERS (mechanically established from the frozen contract)

The member sets below were extracted from `src/contracts/types.ts` at commit `19158540090de33daffec54898c97f855a220a7f`
in this execution. No member was invented, renamed, reordered, or omitted.

### 3.1 SourceClassification — `src/contracts/types.ts:20`

```text
CANONICAL_MARKET_DATA
REAL
DERIVED
CERTIFIED_ENGINE
```

### 3.2 VendorTier — `src/contracts/types.ts:26`

```text
TIER_1_EXCHANGE
TIER_2_COMMERCIAL
OFFLINE_BOOTSTRAP
MOCK_FIXTURE
```

### 3.3 QualityState — `src/contracts/types.ts:11`

```text
GOOD
STALE
PARTIAL
UNAVAILABLE
```

## 4. dataVersion EVIDENCE

| Probe | Result |
| --- | --- |
| `export type *DataVersion*` | **0** — ABSENT |
| `export enum *DataVersion*` | **0** — ABSENT |
| `export interface *DataVersion*` | **0** — ABSENT |
| `export const *DataVersion*` | **0** — ABSENT |
| Contract / schema / governance semantic definition | **ABSENT** |
| Existing declaration sites | `provenance.ts:16,provenance.ts:122` — `dataVersion: string` |
| Distinct observed literals in the tracked tree | **26** — OBSERVATION ONLY |

Observed literals are historical market-data and engine strings. They are **not** a vocabulary,
**not** candidate values, and confer no semantic meaning. No vocabulary was constructed from them.

## 5. RAMKI ASSIGNMENTS

The following 13 assignments were supplied verbatim by RAMKI in the authority act and are
transcribed without alteration.

| Domain | Vocabulary | Assignment |
| --- | --- | --- |
| P-B Watchlists | SourceClassification | **UNASSIGNED** |
| P-C Reports | SourceClassification | **UNASSIGNED** |
| P-D Collaboration | SourceClassification | **UNASSIGNED** |
| P-E Settings | SourceClassification | **UNASSIGNED** |
| P-B Watchlists | VendorTier | **UNASSIGNED** |
| P-C Reports | VendorTier | **UNASSIGNED** |
| P-D Collaboration | VendorTier | **UNASSIGNED** |
| P-E Settings | VendorTier | **UNASSIGNED** |
| P-B Watchlists | QualityState | **UNASSIGNED** |
| P-C Reports | QualityState | **UNASSIGNED** |
| P-D Collaboration | QualityState | **UNASSIGNED** |
| P-E Settings | QualityState | **UNASSIGNED** |
| (not domain-scoped) | dataVersion semantic | **UNASSIGNED** |

## 6. RAMKI RATIONALE (transcribed verbatim)

```text
The available vocabulary members were mechanically established in the
frozen contract, but the current GP-6 evidence does not establish
domain-specific semantic ownership or applicability for P-B, P-C, P-D,
or P-E. Existing dataVersion literals have no authoritative semantic
definition. Therefore the conservative authority disposition is explicit
UNASSIGNED for every E6 vocabulary-assignment slot. No vocabulary member
is inferred or selected.
```

## 7. ORIGIN OF THE ASSIGNMENTS — STRICT NON-INFERENCE

| Statement | State |
| --- | --- |
| Assignments originate from RAMKI authority | **YES** — supplied verbatim in the authority act |
| Any assignment inferred by Arena | **NO** — 0 |
| Any assignment derived from observed literals | **NO** — 0 |
| Any assignment derived from naming conventions | **NO** — 0 |
| Any assignment derived from prior records or D8 history | **NO** — 0 |
| Any assignment derived from model judgement | **NO** — 0 |
| Any vocabulary member selected for any domain | **NO** — 0 |
| Any vocabulary member invented | **NO** — 0 |
| Any value ranked, defaulted, normalized, or preferred | **NO** — 0 |
| Recommendation recorded as an assignment | **NO** — 0 |

`UNASSIGNED` is an explicit RAMKI designation recorded as supplied. It is not a default chosen
by the recording agent, and it is not an assertion that any vocabulary member is unsuitable.

## 8. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `E6 VOCABULARY ASSIGNMENT` **!=** `PROVENANCE IMPLEMENTATION` |
| No implementation authority is created by this act |
| No validator, provenance handler, API behaviour, UI behaviour, persistence, or provider behaviour is implemented |
| No source, contract, transport, test, or configuration file is modified |
| No schema, migration, storage, or transport artifact is created |
| No provider, database, ORM, hosting, or credential selection is made |
| No gate beyond the selected gate is created, opened, ranked, or sequenced |
| E6 remains exercised, not extended |

## 9. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

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
| `productionEligible` | **UNCHANGED** |
| `GP-3` | **NOT AUTHORIZED** — unchanged |
| `GP-4` | **UNRESOLVED / BLOCKED** — unchanged |
| `runtimeCompanyId` | **UNRESOLVED** — unchanged |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** — unchanged |
| `P-A` / `P-F` | **OUTSIDE GP-6** — unchanged |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this act exercises it, it does not extend it |

## 10. EXPLICIT NON-AUTHORIZATIONS

| Item | State after this act |
| --- | --- |
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

## 11. SUPERSESSION

This act supersedes no prior record. The E6 provenance semantic specification and the E6
vocabulary assignment preparation record remain in force, unmodified, at the blobs recorded
in section 1. This act discharges the vocabulary-assignment dependency those records named.

## 12. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_VOCABULARY_ASSIGNMENT = ESTABLISHED

SourceClassification:
P-B = UNASSIGNED
P-C = UNASSIGNED
P-D = UNASSIGNED
P-E = UNASSIGNED

VendorTier:
P-B = UNASSIGNED
P-C = UNASSIGNED
P-D = UNASSIGNED
P-E = UNASSIGNED

QualityState:
P-B = UNASSIGNED
P-C = UNASSIGNED
P-D = UNASSIGNED
P-E = UNASSIGNED

dataVersion semantic = UNASSIGNED

VOCABULARY_VALUES_DESIGNATED = 0
INFERRED_VALUES              = 0
RECOMMENDATIONS_IN_RECORD    = 0
IMPLEMENTATION               = 0
```

```text
VOCABULARY ASSIGNMENT   !=   PROVENANCE IMPLEMENTATION
NO PROVENANCE VOCABULARY MEMBER HAS BEEN ASSIGNED TO ANY GP-6 DOMAIN.
NO IMPLEMENTATION IS AUTHORIZED.
```
