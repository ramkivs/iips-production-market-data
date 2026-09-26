# Institutional Investment Platform System (IIPS)
# GP-6 — Persistence Contract-Designation Authority — ESTABLISHMENT ACT

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-contract-designation-authority-establishment-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — the establishment below is RAMKI's)
**Recording Agent:** Arena (recording only — no domain, contract, mechanism, or technology selected or inferred)
**Act Type:** ESTABLISHMENT ACT (non-executable; governance authority only)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `4d7c0e1503a4474d65718277eb883c265e93de58`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `4d7c0e1503a4474d65718277eb883c265e93de58` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API, queried directly |
| Worktree | CLEAN |
| GP-6 scope act | COMMITTED · blob `5cb067659b0a6ef7b517d17fe92a8783f73e50bc` · touched by exactly one commit |
| GP-6 authority prior state | NOT ESTABLISHED — 0 prior GP-6 authority acts · 0 unnegated establishment claims across 49 GP-6 mentions |
| Individual contract designations prior state | NONE |

## 2. ESTABLISHMENT

RAMKI establishes GP-6 contract-designation authority, bounded to the four-domain GP-6 scope
already recorded in `gp-6-scope-designation-2026-09-26-001`.

```text
GP-6_CONTRACT_DESIGNATION_AUTHORITY = ESTABLISHED
GP-6_AUTHORITY_SCOPE                = P-B, P-C, P-D, P-E  (FOUR DOMAINS ONLY)
INDIVIDUAL_CONTRACT_DESIGNATIONS    = NONE
CONTRACT_CREATION                   = NOT AUTHORIZED
IMPLEMENTATION                      = NOT AUTHORIZED
```

| ID | Domain | GP-6 authority | Contract state |
| --- | --- | --- | --- |
| P-B | Watchlists | **WITHIN GP-6 AUTHORITY** | **NOT DESIGNATED** |
| P-C | Reports | **WITHIN GP-6 AUTHORITY** | **NOT DESIGNATED** |
| P-D | Collaboration | **WITHIN GP-6 AUTHORITY** | **NOT DESIGNATED** |
| P-E | Settings | **WITHIN GP-6 AUTHORITY** | **NOT DESIGNATED** |

### 2.1 Domains outside this authority — preserved

| ID | Domain | Disposition |
| --- | --- | --- |
| P-A | Persistence Foundation | **OUTSIDE GP-6** — persistence-foundation prerequisite / boundary; no contract-designation authority conferred |
| P-F | Governed Screener | **OUTSIDE GP-6** — retains its separate `ScreenerCandidate` authority boundary; no contract-designation authority conferred |

## 3. WHAT THIS ACT AUTHORIZES

```text
AUTHORIZED = governance authority to designate persistence contracts
             for exactly P-B, P-C, P-D, P-E
```

Nothing else. The authority is the power to make a future designation decision for those four
domains. It is not the decision, and it is not permission to build.

## 4. WHAT THIS ACT DOES NOT AUTHORIZE

| Item | State |
| --- | --- |
| `CONTRACT_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `CONTRACT_CREATION_WITHOUT_SUBSEQUENT_DESIGNATION` | **NOT AUTHORIZED** |
| `DTO_CREATION` | **NOT AUTHORIZED** |
| `SCHEMA_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `VIEW_MODEL_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `PERSISTENCE_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `DATABASE_PROVISIONING` | **NOT AUTHORIZED** |
| `HOSTING` | **NOT AUTHORIZED** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `TRANSPORT` | **NOT AUTHORIZED** |
| `PAYLOAD_GOVERNANCE` | **NOT AUTHORIZED** |
| `D115` | **NOT AUTHORIZED** |
| `PRODUCTION` | **NOT AUTHORIZED** |
| `PROVIDER_ACTIVATION` | **NOT AUTHORIZED** |
| `CREDENTIALS` | **NOT AUTHORIZED** |
| `GATE-Y` | **NOT AUTHORIZED** |
| `P-A_CONTRACT_DESIGNATION` | **NOT AUTHORIZED** |
| `P-F_CONTRACT_DESIGNATION` | **NOT AUTHORIZED** |

## 5. EXPLICIT STATEMENTS

1. **GP-6 authority is now established only for the bounded four-domain scope** — P-B, P-C, P-D, P-E.
2. **Establishing authority does not designate any individual contract.**
3. **Each individual domain contract requires a subsequent explicit designation decision.**
4. **No implementation authority is conferred.**
5. **No technology or contract mechanism is selected by this act.**
6. **No database, provider, hosting, or transport is selected.**
7. **No D115 authority is conferred.**
8. **No production authority is conferred.**
9. **GATE-Y remains unopened.**
10. **Existing historical records remain unmodified.**
11. **M-2's six-domain persistence scope remains unchanged and is not overwritten by the narrower GP-6 contract-authority scope.**
12. **The existing GP-6 scope designation act remains historical and byte-identical.**

## 6. AUTHORITY IS NOT DESIGNATION

```text
AUTHORITY TO DESIGNATE  !=  DESIGNATION
DESIGNATION             !=  CONTRACT
CONTRACT                !=  DTO / SCHEMA / VIEW MODEL
ANY OF THE ABOVE        !=  IMPLEMENTATION
IMPLEMENTATION          !=  PERSISTENCE / TRANSPORT / PAYLOAD / PRODUCTION
```

This act moves exactly one step: the first line, left to right, for four named domains. No
subsequent line is reached, entered, or implied.

## 7. RELATIONSHIP TO M-2 — NO OVERWRITE

The M-1/M-2/M-3 Determination Act records, verbatim, `M-2 = DESIGNATED` over **ALL SIX GATE-P
DOMAINS**, listing P-A, P-B, P-C, P-D, P-E, P-F. That record stands unchanged and unreinterpreted.

| Question | Scope | Source |
| --- | --- | --- |
| Persistence domain scope | **SIX** — P-A through P-F | M-1/M-2/M-3 Determination Act (unchanged) |
| GP-6 contract-designation authority | **FOUR** — P-B, P-C, P-D, P-E | this act |

These answer different questions and both stand without conflict. The narrower GP-6 authority
scope does not reduce, amend, or supersede M-2's six-domain persistence scope.

## 8. SUPERSESSION — ADDITIVE, NOT REWRITTEN

| Record | Prior statement | Disposition |
| --- | --- | --- |
| `GP-6-SCOPE-DESIGNATION-ACT.md` | `GP-6_CONTRACT_DESIGNATION_AUTHORITY` NOT ESTABLISHED | **SUPERSEDED** as to authority state only — reason RESOLVED by this explicit RAMKI act; evidence VALID at its own antecedent checkpoint `1c576b80…`; bytes UNCHANGED |
| `GP-5-...-ESTABLISHMENT-ACT.md` | `GP-6` NOT AUTHORIZED | **SUPERSEDED** as to GP-6 row only — same basis; bytes UNCHANGED |
| `GP-2-...-ESTABLISHMENT-ACT.md` | `GP-6` NOT AUTHORIZED — contract designation remains separate | **SUPERSEDED** as to GP-6 row only — same basis; bytes UNCHANGED |
| `GP-2-M1-M2-M3-RAMKI-DETERMINATION-ACT.md` | `GP-6` NOT AUTHORIZED unless explicitly established by a later act | **CONDITION SATISFIED** — this is that later act; bytes UNCHANGED |
| All other records | — | **UNCHANGED** |

No historical record is edited. Each prior statement remains true at its own checkpoint.

## 9. AUTHORITY STATES

| Gate | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** |
| `GP-2` | **ESTABLISHED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `GP-5` | **ESTABLISHED** |
| `GP-6` | **ESTABLISHED — CONTRACT-DESIGNATION AUTHORITY ONLY, BOUNDED TO P-B, P-C, P-D, P-E** |

| Authority | State |
| --- | --- |
| `GP-6_CONTRACT_DESIGNATION_AUTHORITY` | **ESTABLISHED BY THIS ACT** (four domains only) |
| `INDIVIDUAL_CONTRACT_DESIGNATIONS` | **NONE** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_PROVISIONING_AUTHORITY` | **NOT GRANTED** |
| `DATABASE_CREATION_AUTHORITY` | **NOT GRANTED** |
| `DEPENDENCY_INSTALLATION_AUTHORITY` | **NOT GRANTED** |
| `DEPLOYMENT_AUTHORITY` | **NOT GRANTED** |
| `HOSTING_AUTHORITY` | **NOT GRANTED** |
| `CREDENTIAL_AUTHORITY` | **NOT GRANTED** |
| `PROVIDER_ACTIVATION` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |
| `GATE-Y` | **NOT SELECTED / NOT OPENED** |

| Item | State |
| --- | --- |
| M-1 | **DESIGNATED** — unchanged |
| M-2 | **DESIGNATED** — ALL SIX GATE-P DOMAINS, unchanged |
| M-3 | **DESIGNATED** — unchanged |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** |
| M-5 | **GP-5 — ESTABLISHED** (by the GP-5 establishment act, later than the determination act) |
| M-6 | **GP-3 — NOT AUTHORIZED** |

## 10. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, all three `GP-2` records, the M-1/M-2/M-3 Determination
Act, both `GP-5` records, the GP-6 scope designation act, the D8 historical position, and all
frozen qualification, certification, and release records remain byte-identical. No source, test,
configuration, deployment, runtime, package-manifest, infrastructure, or contract file was
touched. No contract, DTO, schema, view model, or code artifact was created. This act is purely
additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 11. NEXT AUTHORITY ACTION (not authorized by this act)

A separate explicit RAMKI designation decision for each individual domain contract within P-B,
P-C, P-D, P-E. Until each such decision is recorded, that domain's contract remains NOT
DESIGNATED, and no contract, DTO, schema, view model, or code may be created for it.

---

**End of Establishment Act. Authority only, four domains only. No contract designated. No implementation authorized, performed, or implied.**
