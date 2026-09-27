# GP-6 — E6 RUNTIME COMPATIBILITY RESOLUTION AUTHORITY ACT
# EXPLICIT RAMKI DESIGNATION / AUTHORITY RECORD ONLY / NO REMEDIATION PERFORMED

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-runtime-compatibility-resolution-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : RESOLUTION PATH DESIGNATION + CALLER REMEDIATION AUTHORITY GRANT
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : d66650ea9ac36645a5f3bc43b695c495d2783897

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Antecedent commit (durable evidence) | `d66650ea9ac36645a5f3bc43b695c495d2783897` |
| E6 implementation commit | `c4149198f58f0ecd21f84b777103090656537fa8` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| `src/contracts/provenance.ts` blob | `1bd9fe01f354e60f9acd53513fa23f6f6fc88306` — unchanged |
| E6 serialization contract act blob | `448f2b88639b867464829f59a0d58797a838e98b` — unchanged |
| Worktree at entry | CLEAN |

## 2. FORENSIC BASIS (re-verified from the durable evidence artifact)

Source: `evidence/persistence-payload-governance/e6-runtime-regression-evidence/`

```text
BASELINE = 542 tests / 542 PASS / 0 FAIL
E6       = 542 tests / 467 PASS / 75 FAIL

DIRECT_E6_REJECTION      = 19   (19/19 are 'undefined')
SWALLOWED_E6_REJECTION   = 54
ROLLUP_CASCADE           = 2
DIGEST_CHANGE_DOWNSTREAM = 0

DISTINCT_ROOT_CAUSES = 1
ROOT_CAUSE = present property with runtime value undefined; rejected under null_undefined_treatment
```

## 3. AUTHORITY

All values below were supplied verbatim by RAMKI and are transcribed without alteration.

| Key | Designated value |
| --- | --- |
| `E6_RESOLUTION_PATH` | **CURRENT_CONTRACT_RETAINED** |
| `CALLER_REMEDIATION_AUTHORITY` | **GRANTED** |
| `CONTRACT_MODIFICATION` | **NOT AUTHORIZED** |
| `TEST_MODIFICATION` | **NOT AUTHORIZED unless separately designated** |
| `UNRELATED_SOURCE_CHANGES` | **NOT AUTHORIZED** |
| `E6_NULL_UNDEFINED_TREATMENT` | **PRESERVED** |
| `NO_CHANGE_TO_E6_LINEAGE_ALGORITHM` | **REQUIRED** |
| `NO_DIGEST_EXPECTATION_REWRITE` | **AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |
| `D115_AUTHORITY` | **NOT GRANTED BY THIS ACT** |
| `DHAN_AUTHORITY` | **NOT GRANTED BY THIS ACT** |
| `NSE_AUTHORITY` | **NOT GRANTED BY THIS ACT** |

## 4. TARGET SCOPE

Supplied verbatim: the 7 proven affected field paths across the 6 proven affected payload
construction sites only.

| # | Field path | Payload construction site |
| --- | --- | --- |
| 1 | `$.exchange` | `broker-holdings-mapper.ts` |
| 2 | `$.isin` | `broker-holdings-mapper.ts` |
| 3 | `$.records.<date>.localPath` | `historical_feasibility_runner.ts` |
| 4 | `$.responsiveLayout.pinnedColumn` | UI02 view model / `lineage_verifier.ts` |
| 5 | `$.options` | `portfolio-store.ts` |
| 6 | `$.cashFlow` | fundamentals DTO chain |
| 7 | `$.ttmStatement` | `engine_api_adapter.ts` |

```text
AFFECTED_FIELD_PATHS       = 7
AFFECTED_CONSTRUCTION_SITES = 6
```

Paths 1 and 2 share a single construction site (`broker-holdings-mapper.ts`); this is why 7
field paths map onto 6 construction sites. Both counts are recorded because the grant states
both. No site has been added or removed.

## 5. PURPOSE

```text
make the 7 affected field paths across the 6 affected payload construction sites compatible with the existing authoritative E6 `null_undefined_treatment` contract.
```

## 6. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `CALLER REMEDIATION AUTHORITY` **!=** `REMEDIATION PERFORMED` |
| No caller modified in this gate |
| No source, test, fixture or configuration file modified in this gate |
| No change to `src/contracts/provenance.ts` |
| No change to the E6 lineage algorithm, JCS serialization, framing, field ordering or parentHash policy |
| No change to `null_undefined_treatment` |
| No digest expectation rewritten |
| No dependency added, no build, no test execution authorized by this act |
| No production activation |

## 7. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E6 serialization contract (10 dimensions) | **UNCHANGED** — act blob `448f2b88639b867464829f59a0d58797a838e98b` |
| `null_undefined_treatment` | **PRESERVED** — undefined rejected, not omitted or coerced |
| E6 lineage algorithm / digest encoding | **UNCHANGED** — SHA-256 / 64-char lowercase hex |
| E6 vocabulary assignment | **UNCHANGED** — 13/13 UNASSIGNED |
| PV-24 lineage computation inputs | **UNCHANGED** — 8 DESIGNATED / 12 NOT DESIGNATED |
| E3 / E5 | **BLOCKED** |
| E7 persistence | **NOT GRANTED** |
| E8 numeric retention | **NOT DESIGNATED** |
| E9 transport / GP-3 | **NOT AUTHORIZED** |
| E10 frozen contract authority | **NOT CREATED** |
| `D115` | **NOT GRANTED BY THIS ACT** |
| Dhan / NSE provider access | **NOT GRANTED BY THIS ACT** |
| Production activation | **NOT GRANTED** |
| Workspace P-B / P-C / P-D / P-E lineage call sites | **0 / 0 / 0 / 0** |

## 8. STRICT NON-INFERENCE

| Statement | State |
| --- | --- |
| Resolution path selected by RAMKI | **YES** — explicit declarative designation |
| Path inferred by Arena from the 7 affected callers | **NO** |
| Path inferred from the contract being authoritative | **NO** |
| Path inferred from remediation being technically possible | **NO** |
| Path inferred from prior implementation or test-execution authority | **NO** |
| Path inferred from Arena's own analysis | **NO** |
| Arena recommendation contributing to this designation | **NONE** |

## 9. SUPERSESSION

This act supersedes no prior record. It resolves the open decision surface recorded by the E6
runtime regression census by designating PATH A. The E6 serialization contract act
(`448f2b88639b867464829f59a0d58797a838e98b`) and all other antecedent records remain in force, unmodified.

## 10. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_RESOLUTION_PATH           = CURRENT_CONTRACT_RETAINED
CALLER_REMEDIATION_AUTHORITY = GRANTED
E6_NULL_UNDEFINED_TREATMENT  = PRESERVED

AFFECTED_FIELD_PATHS        = 7
AFFECTED_CONSTRUCTION_SITES = 6

REMEDIATION_PERFORMED = 0
SOURCE_CHANGES        = 0
TEST_CHANGES          = 0
CONTRACT_CHANGES      = 0
```

```text
CALLER REMEDIATION AUTHORITY   !=   REMEDIATION PERFORMED
NO CALLER WAS MODIFIED BY THIS ACT.
```
