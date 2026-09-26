# Institutional Investment Platform System (IIPS)
# GP-6 — E1 Payload Interface Specification — SPECIFICATION RECORD

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-e1-payload-interface-specification-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — the interface designations and this gate's scope are RAMKI's alone)
**Recording Agent:** Arena (derivation from the recorded E2 act only — did not add, remove, rename, reorder, normalize, reconcile, or infer)
**Act Type:** E1 PAYLOAD INTERFACE SPECIFICATION RECORD (governance specification only; authors no contract, creates no source)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `c868b7023444155e6f1d6a1b7f9b3d22f0b1641f`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `c868b7023444155e6f1d6a1b7f9b3d22f0b1641f` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and the GitHub API, queried directly and independently |
| Worktree | CLEAN · 18/18 governance records byte-identical |
| E2 designation record | present at HEAD, blob `cb14a44808305e84659727b832dc03340ed5e5f8` |
| `src/contracts` | tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — UNCHANGED |
| `src/transports` | tree `b2369fa57b16c99878639cf645b15da2ef358a86` — UNCHANGED |

A local checkout divergence was detected and repaired before this act by fetching the
authoritative commit, verifying the commit and tree objects, realigning the local branch
reference by compare-and-swap, and resetting the index only. No file content, no governance
record, and no remote state was altered by that repair. The full gate was then re-executed
from its first invariant.

## 2. AUTHORITY BASIS

| Element | Evidence |
| --- | --- |
| Authoring authority | `GP-6_CONTRACT_CONTENT_AUTHORING_AUTHORITY = ESTABLISHED` — `GP-6-CONTRACT-CONTENT-AUTHORING-AUTHORITY-ESTABLISHMENT-ACT.md`, blob `08caddd063f044d03f302d10e171abcb5b9e0fa5` |
| Authority scope | `AUTHORING_AUTHORITY_SCOPE                 = P-B, P-C, P-D, P-E` — same record |
| Domain designation | `GP-6-INDIVIDUAL-CONTRACT-DESIGNATION-ACT.md` — P-B/P-C/P-D/P-E ESTABLISHED |
| Member source | `GP-6-E2-FIELD-SEMANTIC-DESIGNATION-ACT.md`, blob `cb14a44808305e84659727b832dc03340ed5e5f8`, committed at `c868b7023444155e6f1d6a1b7f9b3d22f0b1641f` |
| Interface-name source | RAMKI EXPLICIT ACT — `WatchlistPayload`, `ReportPayload`, `CollaborationPayload`, `SettingsPayload` supplied by RAMKI in the gate instruction |
| Prior E1 state | `E1  PAYLOAD INTERFACE      = PARTIALLY SPECIFIABLE` — `GP-6-E1-E2-E4-E6-SEMANTIC-CENSUS-RECORD.md`, blob `ab8c37fbffd93a922774058469a84ced4bf52b1d` |

The census recorded E1 as PARTIALLY SPECIFIABLE for one stated reason: the interface members were
not specifiable. The members are now designated — by RAMKI's E2 act, not by repository evidence —
so the interface shape can be specified as a governance record. The census finding remains true at
its own checkpoint and as a statement about repository evidence; nothing in it is edited or
reopened.

```text
E1_PAYLOAD_INTERFACE_SPECIFICATION = ESTABLISHED (governance record only)
SPECIFICATION_SCOPE                = P-B, P-C, P-D, P-E
SPECIFIED_INTERFACE_COUNT          = 4
SPECIFIED_MEMBER_COUNT             = 20
MEMBER_SOURCE                      = GP-6-E2-FIELD-SEMANTIC-DESIGNATION-ACT.md (sole source)
INTERFACE_NAME_SOURCE              = RAMKI EXPLICIT ACT
E1_CONTRACT_COMPLETION             = NOT PERFORMED
CONTRACT_CONTENT_AUTHORED          = NONE
IMPLEMENTATION                     = NOT AUTHORIZED
```

## 3. DERIVATION RULE AND METHOD

The member tables in section 4 derive from exactly one source: the committed E2 designation
record at blob `cb14a44808305e84659727b832dc03340ed5e5f8`. No other repository file, no donor
material, no UI label, no route name, no existing market-data contract, and no prior
conversation contributed a single member, type, cardinality, enumeration, definition or rule.

Method, so that the result is verifiable rather than asserted:

1. The 20 designation rows were extracted from the committed E2 blob by exact structural match.
2. Each row was copied into this record **byte-for-byte**. No row was retyped.
3. The copy was then verified in the opposite direction: every designation row in this record
   was matched as a whole line against the committed E2 blob, and the row multisets of the two
   records were compared and found identical.
4. The eight-column header of each table was likewise copied from the E2 record, not retyped.

Consequently this record cannot silently disagree with the E2 act: any divergence in any cell of
any row would have failed step 3.

## 4. E1 PAYLOAD INTERFACE SPECIFICATIONS

Each interface below is specified as: an interface name supplied by RAMKI, and the member set
designated by the E2 act for that domain, reproduced in full and unchanged. Member order
reproduces the order recorded in the E2 act; no ordering semantics are designated.

### 4.1 P-B — Watchlists — `WatchlistPayload`

`PAYLOAD_INTERFACE_NAME = WatchlistPayload` · `MEMBER_COUNT = 5` · members = `PB-001`..`PB-005`

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PB-001 | watchlistId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Watchlist within the application domain. | NOT DESIGNATED |
| PB-002 | name | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable name of the Watchlist. | MUST NOT be empty when supplied |
| PB-003 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the Watchlist. | NOT DESIGNATED |
| PB-004 | symbols | string[] | REQUIRED | 0..1 | NOT DESIGNATED | Collection of security identifiers represented by the Watchlist. | Individual symbol semantics are NOT DESIGNATED |
| PB-005 | active | boolean | REQUIRED | 1 | NOT DESIGNATED | Indicates whether the Watchlist is currently active within the workspace domain. | NOT DESIGNATED |

### 4.2 P-C — Reports — `ReportPayload`

`PAYLOAD_INTERFACE_NAME = ReportPayload` · `MEMBER_COUNT = 5` · members = `PC-001`..`PC-005`

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PC-001 | reportId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Report within the application domain. | NOT DESIGNATED |
| PC-002 | title | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable title of the Report. | MUST NOT be empty when supplied |
| PC-003 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the Report. | NOT DESIGNATED |
| PC-004 | reportType | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined classification identifying the kind of Report. | Enumeration members NOT DESIGNATED |
| PC-005 | status | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined state of the Report. | Enumeration members NOT DESIGNATED |

### 4.3 P-D — Collaboration — `CollaborationPayload`

`PAYLOAD_INTERFACE_NAME = CollaborationPayload` · `MEMBER_COUNT = 5` · members = `PD-001`..`PD-005`

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-001 | collaborationId | string | REQUIRED | 1 | NOT DESIGNATED | Stable identifier for a Collaboration workspace object. | NOT DESIGNATED |
| PD-002 | title | string | REQUIRED | 1 | NOT DESIGNATED | Human-readable title of the Collaboration object. | MUST NOT be empty when supplied |
| PD-003 | content | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-authored textual content associated with the Collaboration object. | NOT DESIGNATED |
| PD-004 | status | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined state of the Collaboration object. | Enumeration members NOT DESIGNATED |
| PD-005 | activity | string[] | OPTIONAL | 0..1 | NOT DESIGNATED | Ordered textual activity entries associated with the Collaboration object. | Entry structure NOT DESIGNATED |

### 4.4 P-E — Settings — `SettingsPayload`

`PAYLOAD_INTERFACE_NAME = SettingsPayload` · `MEMBER_COUNT = 5` · members = `PE-001`..`PE-005`

| FIELD ID | FIELD NAME | TYPE | REQUIRED/OPTIONAL | CARDINALITY | ENUMERATION | SEMANTIC DEFINITION | CROSS-FIELD RULES |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PE-001 | settingKey | string | REQUIRED | 1 | NOT DESIGNATED | Stable key identifying an application setting. | MUST NOT be empty when supplied |
| PE-002 | value | string | OPTIONAL | 0..1 | NOT DESIGNATED | Serialized application setting value. | Interpretation determined by valueType |
| PE-003 | valueType | string | REQUIRED | 1 | NOT DESIGNATED | Application-defined classification of the setting value representation. | Enumeration members NOT DESIGNATED |
| PE-004 | active | boolean | REQUIRED | 1 | NOT DESIGNATED | Indicates whether the setting is currently active. | NOT DESIGNATED |
| PE-005 | description | string | OPTIONAL | 0..1 | NOT DESIGNATED | Human-readable description of the setting. | NOT DESIGNATED |

### 4.5 Specification census

| Domain | Payload interface | Members | `string` | `string[]` | `boolean` | REQUIRED | OPTIONAL | `1` | `0..1` | ENUMERATION DESIGNATED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-B | `WatchlistPayload` | 5 | 3 | 1 | 1 | 4 | 1 | 3 | 2 | 0 |
| P-C | `ReportPayload` | 5 | 5 | 0 | 0 | 4 | 1 | 4 | 1 | 0 |
| P-D | `CollaborationPayload` | 5 | 4 | 1 | 0 | 3 | 2 | 3 | 2 | 0 |
| P-E | `SettingsPayload` | 5 | 4 | 0 | 1 | 3 | 2 | 3 | 2 | 0 |
| **TOTAL** | **4 interfaces** | **20** | **16** | **2** | **2** | **14** | **6** | **13** | **7** | **0** |

These counts are measurements of the reproduced rows, not designations. They add nothing to the
E2 act and change nothing in it.

### 4.6 Fidelity note — the two array/cardinality pairings

Two designated members pair an array type with a `0..1` cardinality:

- `PB-004` · field name `symbols` · TYPE `string[]` · REQUIRED · CARDINALITY `0..1` — reproduced in full in section 4.1.
- `PD-005` · field name `activity` · TYPE `string[]` · OPTIONAL · CARDINALITY `0..1` — reproduced in full in section 4.3.

Both rows are reproduced exactly as designated. Arena did not normalize the cardinality, did not
widen or narrow the type, did not reconcile the pairing, and does not treat it as an error to be
corrected. How that pairing is to be encoded in any future interface declaration is **NOT
DESIGNATED** and must not be inferred. Any adjustment is RAMKI's to make in a separate act.

### 4.7 Field names repeated across domains

Four field names occur in more than one domain: `description` in P-B, P-C and P-E; `title` in
P-C and P-D; `status` in P-C and P-D; `active` in P-B and P-E. Repetition of a name is recorded
as observed. It is not a designation of shared meaning.

| Item | State |
| --- | --- |
| Shared, common or base payload interface | **NOT DESIGNATED** |
| Cross-domain type reuse or unification | **NOT DESIGNATED** |
| Equivalence of same-named fields across domains | **NOT DESIGNATED** |
| Renaming or disambiguation of repeated names | **NOT PERFORMED** |

Each interface's member set stands alone, exactly as designated.

## 5. MEMBER ATTRIBUTES THAT REMAIN NOT DESIGNATED

Reproduced from the E2 act and not completed here:

- `ENUMERATION` members for every one of the 20 members, including `reportType`, `status`
  (P-C and P-D) and `valueType`.
- Individual symbol semantics for `PB-004 symbols`.
- Entry structure for `PD-005 activity`.
- Cross-field rules for every member whose cross-field cell reads `NOT DESIGNATED`.

Not designated by this record, and not inferable from it:

| Interface-level attribute | State |
| --- | --- |
| Declaration syntax, optional-property syntax, nullability | **NOT DESIGNATED** |
| Encoding of `REQUIRED`/`OPTIONAL` in any declaration | **NOT DESIGNATED** |
| Encoding of `1` and `0..1` cardinality in any declaration | **NOT DESIGNATED** |
| Array bounds, element type constraints, ordering guarantees | **NOT DESIGNATED** |
| Default values, initial values, sentinel values | **NOT DESIGNATED** |
| File path, module, export site, index registration | **NOT DESIGNATED** |
| Generic parameters, extension, inheritance, composition | **NOT DESIGNATED** |
| Additional members of any kind | **NOT DESIGNATED** |

No unspecified attribute was completed by inference.

## 6. E1 BOUNDARY

This record specifies a payload interface shape. It establishes none of the following, and no
statement in it may be read as establishing them:

| Element | State after this record |
| --- | --- |
| Envelope structure | **NOT ESTABLISHED** |
| `CanonicalEnvelope` binding | **OUTSIDE THIS DESIGNATION** — E5 remains BLOCKED |
| `companyId` | **NOT ESTABLISHED** |
| `runtimeCompanyId` | **NOT ESTABLISHED** |
| Tenant ownership | **NOT ESTABLISHED** |
| D115 identity | **NOT ESTABLISHED** |
| Persistence model | **NOT ESTABLISHED** |
| Storage model | **NOT ESTABLISHED** |
| Retention | **NOT ESTABLISHED** |
| Transport | **NOT ESTABLISHED** |
| Serialization protocol | **NOT ESTABLISHED** |
| Provider | **NOT ESTABLISHED** |
| Database | **NOT ESTABLISHED** |
| ORM | **NOT ESTABLISHED** |
| Production activation | **NOT ESTABLISHED** |

`DataDomain` is not modified and gains no member. `envelope.ts` is not modified. `index.ts` is
not modified. `src/contracts` is not modified.

## 7. ENUMERATION BOUNDARY

```text
reportType enumeration = NOT DESIGNATED
P-C status enumeration = NOT DESIGNATED
P-D status enumeration = NOT DESIGNATED
valueType  enumeration = NOT DESIGNATED
```

No enumeration member is invented here. None is derived from market-data contracts, from UI
labels, from route names, from donor code, from donor filenames, from donor UI numbering, or
from generic English words. The `ENUMERATION` cell of all 20 reproduced rows reads
`NOT DESIGNATED`, exactly as designated.

## 8. VALIDATION BOUNDARY

```text
E1 SPECIFICATION   !=   E4 VALIDATION SPECIFICATION
```

E4 remains separately unresolved. This record creates no mandatory-field rule beyond the
`REQUIRED`/`OPTIONAL` attribute as already designated in E2, no range rule, no enumeration
validation, no cross-field validation, no normalization rule, and no coercion rule.

The cross-field-rule values appearing in section 4 are the values designated by the E2 act,
reproduced unchanged, including every occurrence of `NOT DESIGNATED`. They are reproductions of
a designation, not validation logic, and they authorize no validator.

| Item | State |
| --- | --- |
| `E4_VALIDATION_SPECIFICATION` | **NOT PERFORMED BY THIS RECORD** |
| Validation rules created | **NONE** |
| Validators created | **NONE** |

## 9. IMPLEMENTATION BOUNDARY

```text
E1 PAYLOAD INTERFACE SPECIFICATION   !=   CONTRACT IMPLEMENTATION
```

| Distinction | State |
| --- | --- |
| Specification of the E1 payload interface shape | **ESTABLISHED BY THIS RECORD** |
| Authoring of contract content in source | **NOT PERFORMED BY THIS RECORD** |
| TypeScript interfaces created | **NONE** |
| DTOs created | **NONE** |
| Schemas created | **NONE** |
| Validators created | **NONE** |
| View models created | **NONE** |
| Persistence models created | **NONE** |
| Fixtures created | **NONE** |
| Tests created | **NONE** |
| Source files created or modified | **NONE** |

`src/contracts` remains byte-identical at tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb`.
`src/transports` remains unchanged at tree `b2369fa57b16c99878639cf645b15da2ef358a86`.

A specified interface is a governed statement of shape. It is not a declaration in source code,
not a compiled type, not a persisted row, not a serialized wire message, and not an authorization
to create any of those.

## 10. EXPLICIT NON-AUTHORIZATIONS

```text
NO CONTRACT CONTENT AUTHORED BY THIS RECORD
NO IMPLEMENTATION AUTHORIZED BY THIS RECORD
NO MODIFICATION OF FROZEN CONTRACT INFRASTRUCTURE
```

| Item | State after this record |
| --- | --- |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `SRC_CONTRACTS_MODIFICATION_AUTHORITY` | **NOT CREATED BY THIS RECORD** |
| `CONTRACT_CONTENT_AUTHORED` | **NONE** |
| `E1_CONTRACT_COMPLETION` | **NOT PERFORMED** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 11. PRESERVED INDEPENDENT BLOCKERS

This specification relieves none of the following. Each remains exactly as before this record.

| Element | State |
| --- | --- |
| E2 — designated field semantics | **UNCHANGED** — reproduced, not modified |
| E3 — ownership / identity | **BLOCKED** — D115 C/D UNRESOLVED, `runtimeCompanyId` UNRESOLVED, GP-4 BLOCKED |
| E4 — validation semantics | **NOT SPECIFIED BY THIS GATE** |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E6 — provenance semantics | **NOT SPECIFIED BY THIS GATE** |
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

## 12. UNCHANGED GATE STATE

| Gate | State |
| --- | --- |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this record exercises it, it does not extend it |

## 13. AUTHORITY STILL REQUIRED

Each requires a separate, explicit RAMKI act. None is created or implied here, and no ordering
among them is expressed:

- authoring these specified interfaces into source, which requires E10 relief for `src/contracts`
- E4 validation rule creation
- E6 provenance vocabulary assignment
- enumeration member designation for the members whose enumerations remain NOT DESIGNATED
- symbol semantics for `PB-004` and entry structure for `PD-005`
- E3 ownership and identity resolution, including D115 C/D and `runtimeCompanyId`
- E5 relief for the envelope, the domain union and the contract index
- persistence implementation authority
- retention designation
- GP-3 transport authorization
- production activation
- GATE-Y selection
- P-A / P-F designation

## 14. SUPERSESSION

No prior record is superseded, amended, reopened, transferred, or edited. The E2 designation act
is reproduced, not replaced, and its blob is unchanged. The census record's E1 determination
remains true at its own checkpoint: it recorded what was specifiable from repository evidence,
whereas the members specified here derive from RAMKI's explicit E2 act. This record is purely
additive.

## 15. PRESERVATION

No existing record was modified. No source, test, configuration, deployment, runtime,
package-manifest, infrastructure, contract, or transport file was touched. `src/contracts` is
unchanged at tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb`. `src/transports` is unchanged at
tree `b2369fa57b16c99878639cf645b15da2ef358a86`. No fixture, DTO, schema, view model, validator
or persistence model was created or altered.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

---

**End of Specification Record. Four E1 payload interfaces specified from the 20 authoritative E2 field designations, reproduced byte-for-byte. No field added, removed, renamed, normalized, or reconciled. No enumeration inferred. No contract authored or modified. No implementation authorized, performed, or implied.**
