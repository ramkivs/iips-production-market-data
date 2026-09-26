# Institutional Investment Platform System (IIPS)
# GP-6 — Contract Content Authoring Authority — ESTABLISHMENT ACT

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-contract-content-authoring-authority-establishment-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — Decision B is RAMKI's alone)
**Recording Agent:** Arena (recording only — did not select, recommend, rank, or sequence)
**Act Type:** AUTHORING AUTHORITY ESTABLISHMENT ACT (governance act only; authors no contract content)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `476990b0de0298f7f8afca33d860d88f93c40570`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `476990b0de0298f7f8afca33d860d88f93c40570` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API, queried directly |
| Worktree | CLEAN · 15/15 governance records byte-identical |
| Individual contract designation | ESTABLISHED for P-B, P-C, P-D, P-E |
| Prior authoring-authority state | **NOT AUTHORIZED** — 0 authoring grants in any durable record |

A local checkout divergence was detected and repaired before this act by fetching the
authoritative commit and realigning the local branch reference. No file content, no governance
record, and no remote state was altered by that repair.

## 2. ESTABLISHMENT

```text
GP-6_CONTRACT_CONTENT_AUTHORING_AUTHORITY = ESTABLISHED
AUTHORING_AUTHORITY_SCOPE                 = P-B, P-C, P-D, P-E
AUTHORING                                 = YES
IMPLEMENTATION                            = NOT AUTHORIZED
```

RAMKI Decision **B — AUTHORING AUTHORITY, ALL FOUR DESIGNATED DOMAINS**.

| ID | Domain | Contract designation | Contract content authoring authority |
| --- | --- | --- | --- |
| P-B | Watchlists | ESTABLISHED (prior act) | **ESTABLISHED BY THIS ACT** |
| P-C | Reports | ESTABLISHED (prior act) | **ESTABLISHED BY THIS ACT** |
| P-D | Collaboration | ESTABLISHED (prior act) | **ESTABLISHED BY THIS ACT** |
| P-E | Settings | ESTABLISHED (prior act) | **ESTABLISHED BY THIS ACT** |

The four domains are treated identically. No domain is ranked, sequenced, or prioritised
relative to another; the authority applies to all four simultaneously.

## 3. EXACT MEANING AND LIMIT OF THIS ACT

1. **Contract designation is already established separately** by
   `gp-6-individual-contract-designation-2026-09-26-001`. This act does not re-designate, extend,
   narrow, or restate that designation.
2. **This act grants authority to AUTHOR contract content only.**
3. **This act does NOT itself create contract content.** No contract, DTO, schema, view model,
   type, interface, field, or line of source code is created, specified, or implied here.
4. Authoring authority is **not** implementation authority, persistence authority, storage
   authority, transport authority, payload-data authority, or production authority.
5. Authority to author is not authority to apply, wire, register, deploy, or activate.

```text
DESIGNATION          ≠  AUTHORING AUTHORITY
AUTHORING AUTHORITY  ≠  IMPLEMENTATION AUTHORITY
AUTHORED CONTENT     ≠  APPLIED CONTENT
```

## 4. INDEPENDENT BLOCKERS — PRESERVED, NOT RELIEVED

This act relieves **none** of the following. Each remains in force exactly as previously
recorded, and each continues to constrain any future authoring performed under this authority.

### 4.1 E3 / E5 — ownership and identity

| Input | Preserved state |
| --- | --- |
| `D115 C` (authoritative companyId) | **UNRESOLVED** |
| `D115 D` (Company/Security mapping) | **UNRESOLVED** |
| `runtimeCompanyId` | **UNRESOLVED** (`docs/PHASE1_AUTHORIZATION_PREPARATION.md` lines 437, 669) |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `M-4` | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** |

No ownership or identity field may be defined, defaulted, bound, or implied for any domain.

### 4.2 E7 — persistence shape

| Item | Preserved state |
| --- | --- |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |

### 4.3 E8 — retention

| Item | Preserved state |
| --- | --- |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `M-3` | **DESIGNATED** — qualitative governed retention only |

No numeric retention period may be introduced, inferred, defaulted, or invented.

### 4.4 E9 — transport

| Item | Preserved state |
| --- | --- |
| `GP-3` | **NOT AUTHORIZED** |
| `M-6` | **GP-3 — NOT AUTHORIZED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |

### 4.5 E10 — frozen contract infrastructure

| Item | Preserved state |
| --- | --- |
| `src/contracts` | **GOVERNED BUT NOT APPLIED** — tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` |
| Authority to modify `src/contracts` | **NOT CREATED BY THIS ACT** |
| Authority to modify `src/transports` | **NOT CREATED BY THIS ACT** |

**No authority to modify frozen contract infrastructure is created merely by this authoring
act.** Recorded as verified fact, not as a proposal: the existing envelope mechanism requires an
ownership field and a closed domain enumeration, and the existing index is a fixed export
surface. Those are E3/E5/E10 matters and remain governed by their own authorities.

### 4.6 GP-5

| Item | Preserved state |
| --- | --- |
| `GP-5` | **ESTABLISHED** — unchanged by this act |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| GP-5 → implementation or GP-6 realization | **NOT AUTHORIZED** — GP-5 authorizes neither |

## 5. EXPLICIT NON-AUTHORIZATIONS

```text
NO CONTRACT CREATED BY THIS ACT
NO DTO CREATED BY THIS ACT
NO SCHEMA CREATED BY THIS ACT
NO VIEW MODEL CREATED BY THIS ACT
NO IMPLEMENTATION AUTHORIZED BY THIS ACT
NO PRODUCTION AUTHORITY
NO D115 AUTHORITY
NO GP-3 AUTHORITY
NO PERSISTENCE IMPLEMENTATION AUTHORITY
```

| Excluded item | State |
| --- | --- |
| `CONTRACT_CREATION_BY_THIS_ACT` | **NONE** |
| `DTO_CREATION_BY_THIS_ACT` | **NONE** |
| `SCHEMA_CREATION_BY_THIS_ACT` | **NONE** |
| `VIEW_MODEL_CREATION_BY_THIS_ACT` | **NONE** |
| `PERSISTENCE_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `DATABASE_PROVISIONING` | **NOT AUTHORIZED** |
| `STORAGE_PROVISIONING` | **NOT AUTHORIZED** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `CREDENTIALS` | **NOT AUTHORIZED** |
| `PROVIDER_ACTIVATION` | **NOT AUTHORIZED** |
| `TECHNOLOGY_SELECTION` | **NOT MADE** |
| `DATABASE_SELECTION` | **NOT MADE** |
| `ORM_SELECTION` | **NOT MADE** |
| `PROVIDER_SELECTION` | **NOT MADE** |
| `HOSTING_SELECTION` | **NOT MADE** |
| `TRANSPORT_SELECTION` | **NOT MADE** |
| `SERIALIZATION_PROTOCOL_SELECTION` | **NOT MADE** |
| `D115_RESOLUTION` | **NOT MADE** |
| `RUNTIME_COMPANY_ID_RESOLUTION` | **NOT MADE** |
| `NUMERIC_RETENTION_PERIOD` | **NOT DESIGNATED** |
| `GATE-Y_OPENING` | **NOT AUTHORIZED** |
| `P-A_AUTHORING_AUTHORITY` | **NOT AUTHORIZED** — outside GP-6 |
| `P-F_AUTHORING_AUTHORITY` | **NOT AUTHORIZED** — outside GP-6 |

## 6. FUTURE AUTHORING REMAINS CONSTRAINED

Any contract content authored under this authority remains constrained by every blocker in
section 4 for as long as those blockers stand. Specifically, and without ranking or sequencing:

- ownership and identity content remains blocked by **D115 C/D**, `runtimeCompanyId`, **GP-4**;
- persistence-shape content remains blocked by **persistence implementation authority**;
- retention content remains limited to **qualitative M-3** with no numeric period;
- transport and serialization content remains blocked by **GP-3**;
- modification, extension, or registration within frozen contract infrastructure remains
  **unauthorized**.

Whether to relieve any of these, and in what form, is reserved to RAMKI. No relief is proposed,
recommended, ranked, or sequenced by this act.

## 7. DOMAINS OUTSIDE THIS AUTHORITY

| ID | Domain | State |
| --- | --- | --- |
| P-A | Persistence Foundation | **OUTSIDE GP-6** · designation NONE · authoring authority NONE |
| P-F | Governed Screener | **OUTSIDE GP-6** · designation NONE · authoring authority NONE |

## 8. UNCHANGED STATES

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
| M-2 | **DESIGNATED** — unchanged |
| M-3 | **DESIGNATED** — qualitative; numeric period still undesignated |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** — unchanged |
| M-5 | **GP-5 — ESTABLISHED** |
| M-6 | **GP-3 — NOT AUTHORIZED** |

## 9. SUPERSESSION — ADDITIVE, NOT REWRITTEN

| Record | Prior statement | Disposition |
| --- | --- | --- |
| `GP-6-INDIVIDUAL-CONTRACT-DESIGNATION-ACT.md` | `CONTRACT_CONTENT_AUTHORING = NOT AUTHORIZED` | **SUPERSEDED** as to authoring-authority state only — reason RESOLVED by this explicit RAMKI act; evidence VALID at its own antecedent checkpoint `e175008b…`; bytes UNCHANGED; its designation content remains fully in force |
| All other records | — | **UNCHANGED** |

No historical record is edited. Each prior statement remains true at its own checkpoint.

## 10. PRESERVATION

No existing record was modified. No source, test, configuration, deployment, runtime,
package-manifest, infrastructure, contract, or transport file was touched. `src/contracts` is
unchanged at tree `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` and remains GOVERNED BUT NOT
APPLIED. `src/transports` is unchanged. This act is purely additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

---

**End of Establishment Act. Authority to author established. No contract content authored. No implementation authorized, performed, or implied.**
