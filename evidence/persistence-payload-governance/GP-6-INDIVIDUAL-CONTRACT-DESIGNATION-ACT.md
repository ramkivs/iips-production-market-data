# Institutional Investment Platform System (IIPS)
# GP-6 — Individual Persistence Contract Designation — DESIGNATION ACT

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-individual-contract-designation-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — the domain selection below is RAMKI's)
**Recording Agent:** Arena (recording only — did not select, rank, sequence, or infer the designated domains)
**Act Type:** DESIGNATION ACT (non-executable; designation only — contract authoring NOT authorized)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `e175008b54f11a6cb0af1ad9a2a9be18eb1f8ca2`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `e175008b54f11a6cb0af1ad9a2a9be18eb1f8ca2` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API, queried directly |
| Worktree | CLEAN · 14/14 governance records byte-identical |
| GP-6 authority | ESTABLISHED for exactly P-B, P-C, P-D, P-E |
| Prior designation state | ALL FOUR **NOT DESIGNATED** · `INDIVIDUAL_CONTRACT_DESIGNATIONS = NONE` |

## 2. DESIGNATION

RAMKI designates the persistence contract for **all four** domains within the established GP-6
authority scope.

```text
DOMAINS_DESIGNATED               = P-B, P-C, P-D, P-E
CONTRACT_DESIGNATION             = ESTABLISHED for each named domain
CONTRACT_CONTENT_AUTHORING       = NOT AUTHORIZED
IMPLEMENTATION                   = NOT AUTHORIZED
```

| ID | Domain | Persistence contract designation |
| --- | --- | --- |
| P-B | Watchlists | **ESTABLISHED BY THIS ACT** |
| P-C | Reports | **ESTABLISHED BY THIS ACT** |
| P-D | Collaboration | **ESTABLISHED BY THIS ACT** |
| P-E | Settings | **ESTABLISHED BY THIS ACT** |

## 3. PER-DOMAIN TREATMENT

The four domains are treated identically under this act. No domain is ranked, sequenced, or
prioritised relative to another; the designation applies to all four simultaneously.

### 3.1 Exact domain scope

Each domain's scope is its governed identity as already recorded — the GATE-P domain identifier
and name, and the structural route anchor present in the repository. **This act defines no data
shape, no fields, no entities, and no relationships for any domain.** Scope here means *which
domain is designated*, not *what the contract contains*.

| ID | Domain | Governed identity | Structural route anchor |
| --- | --- | --- | --- |
| P-B | Watchlists | GATE-P domain P-B | `/watchlists` (fail-closed, `status: 'unavailable'`) |
| P-C | Reports | GATE-P domain P-C | `/reports` (fail-closed, `status: 'unavailable'`) |
| P-D | Collaboration | GATE-P domain P-D | `/collaboration` (fail-closed, `status: 'unavailable'`) |
| P-E | Settings | GATE-P domain P-E | `/settings` (fail-closed, `status: 'unavailable'`) |

The route anchors are recorded as identity evidence only. They are presentation structure that
performs no fetch, holds no data, and fabricates no values. They are not a contract and confer no
data shape.

### 3.2 Persistence contract authority / designation

| Item | State |
| --- | --- |
| Persistence contract designation, per domain | **ESTABLISHED** for P-B, P-C, P-D, P-E |
| Designation basis | GP-6 contract-designation authority, `gp-6-contract-designation-authority-establishment-2026-09-26-001` |
| Persistence implementation authority | **NOT GRANTED** |
| Storage provisioning authority | **NOT GRANTED** |

### 3.3 Whether contract content may now be authored

```text
CONTRACT_CONTENT_AUTHORING = NOT AUTHORIZED
```

**No.** For every designated domain, contract content may **not** be authored under this act. No
contract file, DTO, schema, view model, type, interface, or code may be created. Authoring
requires a separate explicit RAMKI act. The designation records *that* each domain has a
designated persistence contract; it does not create, specify, or permit the writing of one.

### 3.4 Ownership / identity requirements — BLOCKED

| Input | State | Consequence for every designated domain |
| --- | --- | --- |
| `D115_IDENTITY_AUTHORITY` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** | ownership scoping cannot be specified |
| `runtimeCompanyId` | **UNRESOLVED** (`docs/PHASE1_AUTHORIZATION_PREPARATION.md` lines 437, 669) | owner binding cannot be specified |
| `GP-4` | **UNRESOLVED / BLOCKED** | owner identity remains unavailable |
| `M-4` | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** | ownership scoping milestone unmet |

The ownership/identity requirement is **recorded as blocked and is not resolved, relaxed, or
worked around by this act.** No ownership field is defined, defaulted, or implied for any
designated domain.

### 3.5 Retention treatment

| Item | State |
| --- | --- |
| Retention semantics | **GOVERNED RETENTION**, qualitative, per `M-3 = DESIGNATED` — durable, transactional, explicit ownership scoping, no silent loss of committed application records |
| Numeric retention period | **NOT DESIGNATED** |

Each designated domain inherits the qualitative M-3 retention semantics and nothing more. **No
numeric retention period is designated, inferred, defaulted, or invented by this act** for any
domain. A retention period remains a subsequent governance decision.

### 3.6 Transport treatment

| Item | State |
| --- | --- |
| `GP-3` transport relief | **NOT AUTHORIZED** — unchanged by this act |
| `M-6` | **GP-3 — NOT AUTHORIZED** |
| Transport boundary for designated domains | **NOT SELECTED / NOT AUTHORIZED** |

No transport mechanism, protocol, serialization boundary, or API surface is selected or
authorized for any designated domain. GP-3 remains NOT AUTHORIZED unless separately changed by an
explicit RAMKI act.

### 3.7 Explicit exclusions — applying to every designated domain

| Excluded item | State |
| --- | --- |
| `CONTRACT_CONTENT_AUTHORING` | **NOT AUTHORIZED** |
| `CONTRACT_FILE_CREATION` | **NOT AUTHORIZED** |
| `DTO_CREATION` | **NOT AUTHORIZED** |
| `SCHEMA_CREATION` | **NOT AUTHORIZED** |
| `VIEW_MODEL_CREATION` | **NOT AUTHORIZED** |
| `SOURCE_CODE_CREATION` | **NOT AUTHORIZED** |
| `PERSISTENCE_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `DATABASE_PROVISIONING` | **NOT AUTHORIZED** |
| `STORAGE_PROVISIONING` | **NOT AUTHORIZED** |
| `TECHNOLOGY_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `HOSTING_SELECTION` | **NOT MADE** |
| `TRANSPORT_SELECTION` | **NOT MADE** |
| `PAYLOAD_GOVERNANCE` | **NOT AUTHORIZED** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `CREDENTIALS` | **NOT AUTHORIZED** |
| `PROVIDER_ACTIVATION` | **NOT AUTHORIZED** |
| `D115_RESOLUTION` | **NOT MADE** |
| `RUNTIME_COMPANY_ID_RESOLUTION` | **NOT MADE** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `GATE-Y_OPENING` | **NOT AUTHORIZED** |
| `P-A_CONTRACT_DESIGNATION` | **NOT AUTHORIZED** — outside GP-6 |
| `P-F_CONTRACT_DESIGNATION` | **NOT AUTHORIZED** — outside GP-6 |

## 4. DOMAINS NOT DESIGNATED

All four domains inside GP-6 scope are designated by this act. The domains that remain
undesignated are those **outside** GP-6 scope, and this act confers no authority over them.

| ID | Domain | State |
| --- | --- | --- |
| P-A | Persistence Foundation | **OUTSIDE GP-6** · contract designation **NONE** · no authority conferred |
| P-F | Governed Screener | **OUTSIDE GP-6** · contract designation **NONE** · retains its separate `ScreenerCandidate` authority boundary |

## 5. UNCHANGED STATES

| Gate | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** — unchanged |
| `GP-2` | **ESTABLISHED** — unchanged |
| `GP-3` | **NOT AUTHORIZED** — unchanged |
| `GP-4` | **UNRESOLVED / BLOCKED** — unchanged |
| `GP-5` | **ESTABLISHED** — unchanged |
| `GP-6` | **ESTABLISHED** — unchanged; this act exercises it, it does not extend it |

| Authority | State |
| --- | --- |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `runtimeCompanyId` | **UNCHANGED** — UNRESOLVED |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |
| `GATE-Y` | **NOT SELECTED / NOT OPENED** |

| Item | State |
| --- | --- |
| M-1 | **DESIGNATED** — unchanged |
| M-2 | **DESIGNATED** — ALL SIX GATE-P DOMAINS, unchanged and not narrowed by this act |
| M-3 | **DESIGNATED** — unchanged; numeric retention period still undesignated |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** — unchanged |
| M-5 | **GP-5 — ESTABLISHED** |
| M-6 | **GP-3 — NOT AUTHORIZED** |

## 6. SUPERSESSION — ADDITIVE, NOT REWRITTEN

| Record | Prior statement | Disposition |
| --- | --- | --- |
| `GP-6-PERSISTENCE-CONTRACT-DESIGNATION-AUTHORITY-ACT.md` | four domains `NOT DESIGNATED`; `INDIVIDUAL_CONTRACT_DESIGNATIONS` NONE | **SUPERSEDED** as to designation state only — reason RESOLVED by this explicit RAMKI act; evidence VALID at its own antecedent checkpoint `4d7c0e15…`; bytes UNCHANGED |
| `GP-6-CONTRACT-DESIGNATION-PREREQUISITE-RECORD.md` | `THIS_RECORD_DESIGNATES = NOTHING`; designations NONE | **SUPERSEDED** as to designation state only — same basis; its recorded prerequisites remain UNRESOLVED and in force; bytes UNCHANGED |
| All other records | — | **UNCHANGED** |

No historical record is edited. Each prior statement remains true at its own checkpoint.

## 7. PRESERVATION

No existing record was modified. The GP-6 scope act, the GP-6 authority act, the prerequisite
record, the M-1/M-2/M-3 Determination Act, all `GP-2` records, both `GP-5` records, `A-1`, the
GATE-P selection, findings and packet records, the D8 historical position, and all frozen
qualification, certification, and release records remain byte-identical. No source, test,
configuration, deployment, runtime, package-manifest, infrastructure, or contract file was
touched. `src/contracts` is unchanged at tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` and
remains GOVERNED BUT NOT APPLIED. This act is purely additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 8. NEXT AUTHORITY ACTION (not authorized by this act)

A separate explicit RAMKI act authorizing contract content authoring for one or more designated
domains. Whether such authoring can proceed while D115, `runtimeCompanyId`, numeric retention,
and GP-3 remain unresolved is a decision reserved to RAMKI and is not proposed, ranked, or
sequenced here.

---

**End of Designation Act. Designation only. No contract content authored. No implementation authorized, performed, or implied.**
