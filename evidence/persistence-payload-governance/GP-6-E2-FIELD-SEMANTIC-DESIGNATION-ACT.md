# Institutional Investment Platform System (IIPS)
# GP-6 — E2 Field Semantic Designation — DESIGNATION ACT

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-e2-field-semantic-designation-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — the designations below are RAMKI's alone)
**Recording Agent:** Arena (transcription only — did not add, remove, rename, reorder, or infer)
**Act Type:** E2 FIELD SEMANTIC DESIGNATION ACT (semantic designation only; authors no contract)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `12615bb8b88f89f55d6942d3a1d554e64739bb35`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `12615bb8b88f89f55d6942d3a1d554e64739bb35` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and the GitHub API, queried directly and independently |
| Worktree | CLEAN · 17/17 governance records byte-identical |
| `src/contracts` | tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — UNCHANGED |
| `src/transports` | tree `b2369fa57b16c99878639cf645b15da2ef358a86` — UNCHANGED |

A local checkout divergence was detected and repaired before this act by fetching the
authoritative commit, verifying the commit and tree objects, realigning the local branch
reference by compare-and-swap, and resetting the index only. No file content, no governance
record, and no remote state was altered by that repair.

## 2. AUTHORITY BASIS

| Element | Evidence |
| --- | --- |
| Authoring authority | `GP-6_CONTRACT_CONTENT_AUTHORING_AUTHORITY = ESTABLISHED` — `GP-6-CONTRACT-CONTENT-AUTHORING-AUTHORITY-ESTABLISHMENT-ACT.md` |
| Authority scope | `AUTHORING_AUTHORITY_SCOPE                 = P-B, P-C, P-D, P-E` — same record |
| Domain designation | `GP-6-INDIVIDUAL-CONTRACT-DESIGNATION-ACT.md` — P-B/P-C/P-D/P-E ESTABLISHED |
| Prior E2 state | `E2 FIELD EVIDENCE = ZERO`, `E2_FIELD_DESIGNATION = NOT PERFORMED` — `GP-6-E1-E2-E4-E6-SEMANTIC-CENSUS-RECORD.md`, durably committed at `12615bb8…` |
| Designation source | RAMKI E2 DESIGNATION DECISION — 20 field designations supplied explicitly by RAMKI |

The census established that E2 was NOT SPECIFIABLE from repository evidence. That finding is
unchanged as a statement about repository evidence. The designations below do not derive from
repository evidence; they derive from RAMKI's explicit act, which is their sole authority.

```text
E2_FIELD_SEMANTIC_DESIGNATION = ESTABLISHED
DESIGNATION_SCOPE             = P-B, P-C, P-D, P-E
DESIGNATED_FIELD_COUNT        = 20
DESIGNATION_SOURCE            = RAMKI EXPLICIT ACT
IMPLEMENTATION                = NOT AUTHORIZED
```

## 3. DESIGNATED E2 FIELD SEMANTICS

Transcribed exactly as supplied. No field was added, removed, renamed, reordered, normalized,
corrected, or reconciled. Every attribute RAMKI marked `NOT DESIGNATED` remains `NOT DESIGNATED`.

### 3.1 P-B — Watchlists

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PB-001 | watchlistId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Watchlist within the application domain. | NOT DESIGNATED |
| PB-002 | name | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable name of the Watchlist. | MUST NOT be empty when supplied |
| PB-003 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the Watchlist. | NOT DESIGNATED |
| PB-004 | symbols | string[] | REQUIRED | 0..1 | NOT DESIGNATED | Collection of security identifiers represented by the Watchlist. | Individual symbol semantics are NOT DESIGNATED |
| PB-005 | active | boolean | REQUIRED | 1 | NOT DESIGNATED | Indicates whether the Watchlist is currently active within the workspace domain. | NOT DESIGNATED |

### 3.2 P-C — Reports

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PC-001 | reportId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Report within the application domain. | NOT DESIGNATED |
| PC-002 | title | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable title of the Report. | MUST NOT be empty when supplied |
| PC-003 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the Report. | NOT DESIGNATED |
| PC-004 | reportType | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined classification identifying the kind of Report. | Enumeration members NOT DESIGNATED |
| PC-005 | status | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined state of the Report. | Enumeration members NOT DESIGNATED |

### 3.3 P-D — Collaboration

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-001 | collaborationId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Collaboration workspace object. | NOT DESIGNATED |
| PD-002 | title | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable title of the Collaboration object. | MUST NOT be empty when supplied |
| PD-003 | content | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-authored textual content associated with the Collaboration object. | NOT DESIGNATED |
| PD-004 | status | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined state of the Collaboration object. | Enumeration members NOT DESIGNATED |
| PD-005 | activity | string[] | OPTIONAL | 0..1 | NOT DESIGNATED | Ordered textual activity entries associated with the Collaboration object. | Entry structure NOT DESIGNATED |

### 3.4 P-E — Settings

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PE-001 | settingKey | string | REQUIRED | 1 | NOT DESIGNATED | Stable key identifying an application setting. | MUST NOT be empty when supplied |
| PE-002 | value | string | OPTIONAL | 0..1 | NOT DESIGNATED | Serialized application setting value. | Interpretation determined by valueType |
| PE-003 | valueType | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined classification of the setting value representation. | Enumeration members NOT DESIGNATED |
| PE-004 | active | boolean | REQUIRED | 1 | NOT DESIGNATED | Indicates whether the setting is currently active. | NOT DESIGNATED |
| PE-005 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the setting. | NOT DESIGNATED |

### 3.5 Designation census

```text
DESIGNATED FIELDS (P-B) = 5
DESIGNATED FIELDS (P-C) = 5
DESIGNATED FIELDS (P-D) = 5
DESIGNATED FIELDS (P-E) = 5
DESIGNATED FIELDS TOTAL = 20
ENUMERATION DESIGNATED  = 0 of 20
```

### 3.6 Transcription fidelity note

Two supplied rows pair an array type with a `0..1` cardinality (`PB-004 symbols`, REQUIRED, and
`PD-005 activity`, OPTIONAL). They are recorded exactly as supplied. Arena did not normalize,
reinterpret, or reconcile any supplied value, and does not treat the pairing as an error to be
corrected. Any adjustment is RAMKI's to make in a separate act.

## 4. ATTRIBUTES THAT REMAIN NOT DESIGNATED

- `ENUMERATION` members for every one of the 20 fields, including for `reportType`, `status`
  (P-C and P-D) and `valueType`, whose cross-field cells state that enumeration members are
  NOT DESIGNATED.
- Individual symbol semantics for `PB-004 symbols`.
- Entry structure for `PD-005 activity`.
- Cross-field rules for every field whose cross-field cell reads `NOT DESIGNATED`.
- Any field, attribute, rule or vocabulary not appearing in section 3.

No unspecified attribute was completed by inference.

## 5. NO INFERRED AND NO DONOR-DERIVED FIELDS

Every designated field originates solely from RAMKI's explicit act. None was derived from route
names, navigation labels, unavailable-state labels, donor API names, donor filenames, donor UI
numbering, generic English words, existing market-data field names, presumed CRUD shapes,
presumed timestamps, presumed identifiers, presumed status fields, or presumed ownership fields.

No ownership or identity field is designated. Consistent with E3 remaining blocked, this act
designates no `companyId`, no `runtimeCompanyId`, no `tenantId`, no user identity, and no
company or security mapping. No retention, persistence, transport, serialization or provenance
vocabulary is designated.

## 6. E2 SEMANTIC DESIGNATION IS NOT CONTRACT IMPLEMENTATION

```text
E2 SEMANTIC DESIGNATION   !=   CONTRACT IMPLEMENTATION
```

| Distinction | State |
| --- | --- |
| Semantic designation of E2 fields | **ESTABLISHED BY THIS ACT** |
| Authoring of contract content | **NOT PERFORMED BY THIS ACT** |
| Contract interfaces created | **NONE** |
| Source, DTO, schema, view-model or fixture changes | **NONE** |
| Implementation | **NOT AUTHORIZED** |

A designated field is a governed semantic statement. It is not a declaration in source code, not
a payload interface, not a persisted column, not a serialized wire field, and not an authorization
to create any of those.

## 7. EXPLICIT NON-AUTHORIZATIONS

```text
NO CONTRACT CONTENT AUTHORED BY THIS ACT
NO IMPLEMENTATION AUTHORIZED BY THIS ACT
NO MODIFICATION OF FROZEN CONTRACT INFRASTRUCTURE
```

| Item | State after this act |
| --- | --- |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS ACT** |
| `CONTRACT_CONTENT_AUTHORED` | **NONE** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 8. PRESERVED INDEPENDENT BLOCKERS

This designation relieves none of the following. Each remains exactly as before this act.

| Element | State |
| --- | --- |
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
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** — unchanged |
| `P-A` / `P-F` | **OUTSIDE GP-6** — unchanged |

## 9. UNCHANGED GATE STATE

| Gate | State |
| --- | --- |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this act exercises it, it does not extend it |

## 10. AUTHORITY STILL REQUIRED

Each requires a separate, explicit RAMKI act. None is created or implied here, and no ordering
among them is expressed:

- authoring the E1 payload interfaces from these designated semantics
- E4 validation rule creation
- E6 provenance vocabulary assignment
- enumeration member designation for the fields whose enumerations remain NOT DESIGNATED
- E3 ownership and identity resolution, including D115 C/D and `runtimeCompanyId`
- E5 and E10 relief for the envelope, the domain union and the contract index
- persistence implementation authority
- retention designation
- GP-3 transport authorization
- production activation
- GATE-Y selection
- P-A / P-F designation

## 11. SUPERSESSION

No prior record is superseded, amended, reopened, or transferred. The census record's statement
that E2 was NOT SPECIFIABLE FROM CURRENT AUTHORITY/EVIDENCE remains true at its own checkpoint
and as a statement about repository evidence: this act supplies designation by RAMKI authority,
not by repository evidence. No historical record is edited. This act is purely additive.

## 12. PRESERVATION

No existing record was modified. No source, test, configuration, deployment, runtime,
package-manifest, infrastructure, contract, or transport file was touched. `src/contracts` is
unchanged at tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb`. `src/transports` is unchanged at
tree `b2369fa57b16c99878639cf645b15da2ef358a86`. No fixture, DTO, schema or view model was
created or altered.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

---

**End of Designation Act. 20 E2 field semantics designated by RAMKI and transcribed exactly. No contract authored or modified. No implementation authorized, performed, or implied.**
