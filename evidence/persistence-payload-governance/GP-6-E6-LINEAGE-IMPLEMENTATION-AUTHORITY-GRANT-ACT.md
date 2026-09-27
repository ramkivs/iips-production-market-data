# GP-6 — E6 LINEAGE IMPLEMENTATION AUTHORITY GRANT ACT
# EXPLICIT RAMKI GRANT / AUTHORITY RECORD ONLY / NO IMPLEMENTATION PERFORMED

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-lineage-implementation-authority-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : IMPLEMENTATION AUTHORITY GRANT ACT (authority record only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : f1b2ee593196c31d4aa7698908df8dd751700de1

---

## 1. AUTHORITY

```text
AUTHORITY = RAMKI

IMPLEMENTATION_AUTHORITY = GRANTED

SRC_CONTRACTS_MODIFICATION_AUTHORITY = GRANTED

SRC_CONTRACTS_MODIFICATION_AUTHORIZED = YES
```

All four values were supplied verbatim by RAMKI. Arena inferred none of them, and no value was
derived from a prior record, from the E6 serialization designation, from GP-6, from D115, or
from the size of the required change.

## 2. SCOPE

```text
E6_LINEAGE_IMPLEMENTATION_SCOPE =
Implement the already-established E6 lineage serialization contract in
src/contracts/provenance.ts, specifically computeLineageHash, including the
designated payload serialization, metadata serialization, field ordering,
framing, key canonicalization, null/undefined treatment, Unicode treatment,
number normalization, and disabled parent-hash chaining policy.
```

## 3. EXCLUSIONS

```text
No unrelated source, contract, transport, workspace, persistence, production,
Dhan/NSE, D115, or E10 changes are authorized.
```

## 4. TARGET

```text
TARGET_FILE     = src/contracts/provenance.ts
TARGET_FUNCTION = computeLineageHash
```

```text
PURPOSE:
Implement the already-established E6 lineage serialization contract.
```

| Item | Verified value |
| --- | --- |
| Target file | `src/contracts/provenance.ts` |
| Target function | `computeLineageHash` — defined at line 117 |
| Target file blob at grant time | `459c77a430f00e5b20fa1f80cc1a3b780165444a` — byte-identical to authoritative `main` |
| Other `src/contracts` files authorized | **0** (13 tracked) |
| `src/contracts/types.ts` | **NOT IN SCOPE** |
| `src/contracts/envelope.ts` | **NOT IN SCOPE** |
| `src/transports` | **NOT IN SCOPE** |
| Non-test call sites | **31 — CALLERS ONLY**, modification NOT authorized by this act |
| Workspace P-B / P-C / P-D / P-E call sites | **0 / 0 / 0 / 0** |

## 5. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit | `f1b2ee593196c31d4aa7698908df8dd751700de1` |
| Antecedent tree | `e7081e1d438fd72010572232ae1eea7f79ef4616` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| Worktree at entry | CLEAN |
| E6 algorithm act blob | `4045c50eb1ba2557368c05022da1a476fe3cdab9` — **NOT MODIFIED** |
| E6 serialization contract act blob | `448f2b88639b867464829f59a0d58797a838e98b` — **NOT MODIFIED** |
| `src/contracts` tree | `3a2b5c23ac3cd5783e21c4d531f6baffe14a2aeb` — byte-identical to authoritative `main` |
| `src/transports` tree | `b2369fa57b16c99878639cf645b15da2ef358a86` — byte-identical to authoritative `main` |

## 6. PRESERVATION

```text
E6_LINEAGE_ALGORITHM_AUTHORITY    = ESTABLISHED
E6_LINEAGE_SERIALIZATION_CONTRACT = ESTABLISHED

IMPLEMENTATION_AUTHORITY = NOW ESTABLISHED
IMPLEMENTATION = NOT YET PERFORMED
```

The already-established E6 contract is the **sole** implementation target. This act grants
implementation authority; it does **not** authorize selecting, altering, weakening or
substituting a different serialization contract. The ten designated dimensions in blob
`448f2b88639b867464829f59a0d58797a838e98b` and the two cryptographic designations in blob `4045c50eb1ba2557368c05022da1a476fe3cdab9` remain binding and unaltered.

## 7. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `IMPLEMENTATION AUTHORITY` **!=** `IMPLEMENTATION PERFORMED` |
| No modification of `src/contracts/provenance.ts` in this gate |
| No modification of `computeLineageHash` in this gate |
| No RFC 8785 / JCS code added |
| No dependency added; no package manifest or lockfile modified |
| No test created or modified |
| No caller modified |
| No `types.ts` / `envelope.ts` / `src/transports` modification |
| No workspace, persistence, transport or production implementation |
| No E10 authority created |
| No digest recomputed; no migration executed |
| No D115 or Dhan/NSE state altered |

## 8. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E1 / E2 / E4 / E6 specification | **UNCHANGED** |
| E6 — provenance vocabulary assignment | **UNCHANGED** — 13/13 UNASSIGNED |
| PV-24 — lineage computation inputs | **UNCHANGED** — 8 DESIGNATED / 12 NOT DESIGNATED |
| E3 — ownership / identity | **BLOCKED** |
| E5 — envelope / schema / domain infrastructure | **BLOCKED** |
| E7 — persistence implementation | **NOT GRANTED** |
| E8 — numeric retention | **NOT DESIGNATED** |
| E9 — transport / serialization authority | **GP-3 NOT AUTHORIZED** |
| E10 — frozen contract infrastructure | Authority to modify **NOT CREATED** |
| `D115` | **WITHHELD / UNRESOLVED / NOT AUTHORIZED** |
| D115 production activation | **NOT AUTHORIZED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `runtimeCompanyId` | **UNRESOLVED** |
| `GATE-Y` | **NOT SELECTED / UNINVESTIGATED** |
| `P-A` / `P-F` | **OUTSIDE GP-6** |
| Dhan / NSE provider access | **NOT AUTHORIZED** |

## 9. EXPLICIT NON-AUTHORIZATIONS (unchanged by this grant)

| Item | State after this act |
| --- | --- |
| `WORKSPACE_LINEAGE_IMPLEMENTATION` | **NOT AUTHORIZED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `E5_AUTHORITY` | **NOT CREATED** |
| `E10_AUTHORITY` | **NOT CREATED** |
| `DEPENDENCY_ADDITION` | **NOT AUTHORIZED** unless separately authorized |
| `CALL_SITE_MODIFICATION` | **NOT AUTHORIZED** |
| `TEST_MODIFICATION` | **NOT AUTHORIZED BY THIS ACT** |
| `DATABASE_SELECTION` / `ORM_SELECTION` | **NOT MADE** |
| `HOSTING_PROVIDER` | **NOT SELECTED** |
| `DEPLOYMENT` | **NOT AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |

## 10. SUPERSESSION

This act supersedes **only** the prior state `IMPLEMENTATION_AUTHORITY = NOT GRANTED` and
`SRC_CONTRACTS_MODIFICATION_AUTHORITY = NOT CREATED` as they apply to the target named in
section 4. No prior record is modified. Both antecedent E6 authority records remain in force
at blobs `4045c50eb1ba2557368c05022da1a476fe3cdab9` and `448f2b88639b867464829f59a0d58797a838e98b`.

## 11. PRESERVATION OF D8

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_IMPLEMENTATION_AUTHORITY = ESTABLISHED

IMPLEMENTATION_AUTHORITY             = GRANTED
SRC_CONTRACTS_MODIFICATION_AUTHORITY = GRANTED
SRC_CONTRACTS_MODIFICATION_AUTHORIZED = YES

TARGET_FILE     = src/contracts/provenance.ts
TARGET_FUNCTION = computeLineageHash

IMPLEMENTATION = 0
SOURCE_MUTATION = 0
AUTHORITY_RECORD_MUTATION = 1
```

```text
IMPLEMENTATION AUTHORITY   !=   IMPLEMENTATION PERFORMED
NO SOURCE FILE WAS MODIFIED BY THIS ACT.
```
