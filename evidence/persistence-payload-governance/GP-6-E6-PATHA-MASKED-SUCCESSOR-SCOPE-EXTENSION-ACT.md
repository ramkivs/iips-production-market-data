# GP-6 — E6 PATH A MASKED SUCCESSOR SCOPE EXTENSION ACT
# EXPLICIT RAMKI DESIGNATION / AUTHORITY RECORD ONLY / NO REMEDIATION PERFORMED

Governing Standards   : AD-01..AD-18 / AD-CHARTER-2026-01
Act ID                : gp-6-e6-patha-masked-successor-scope-extension-2026-09-27-001
Governing Authority   : RAMKI
Recording Agent       : Arena (Arena.ai Agent Mode)
Act Type              : PATH A CALLER REMEDIATION SCOPE EXTENSION (governance only)
Recorded At           : 2026-09-27 (Asia/Calcutta)
Antecedent Checkpoint : 11e4d7f147afcb770d01027e27a353d4397879a3

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` — sole remote |
| Qualification evidence commit (HEAD) | `11e4d7f147afcb770d01027e27a353d4397879a3` |
| PATH A implementation commit | `6a1fda1be1f0757ac6bba3c69d736d6e626a95bd` |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — unmoved |
| `src/contracts/provenance.ts` | `1bd9fe01f354e60f9acd53513fa23f6f6fc88306` — UNCHANGED |
| E6 serialization contract act | `448f2b88639b867464829f59a0d58797a838e98b` — UNCHANGED |
| PATH A resolution authority act | `d8258b5042b2b2eda88e7d55afca3d1e58426a7a` — UNCHANGED |
| Original 7-path remediation | INTACT — 14 conditional-presence guards across 6 files |
| `tests/` tree | UNCHANGED (== `main`) |
| Worktree at entry | CLEAN |

## 2. QUALIFICATION RESULT THAT ESTABLISHED THIS EXTENSION

Re-read from the committed qualification evidence artifact:

```text
BASELINE     542 tests / 542 PASS /  0 FAIL
PREVIOUS_E6  542 tests / 467 PASS / 75 FAIL
PATH A       542 tests / 536 PASS /  6 FAIL

E6_RUNTIME_QUALIFICATION = FAIL
AUTHORIZED 7-PATH FAILURES REMAINING = 0
DIGEST CHANGES = 0
UNRELATED FAILURES = 0
```

## 3. FORENSIC BASIS — MASKED SUCCESSORS

The six remaining failures are on field paths that RFC 8785 JCS sorted-key traversal
previously concealed, because canonicalization throws on the first present-`undefined`
key it reaches in an object:

```text
record object    :  localPath (idx 6)  <  priorSha256Hex (idx 7)
statement object :  cashFlow  (idx 1)  <  quarter        (idx 6)
```

Remediating the authorized paths allowed the canonicalizer to advance to the next
present-`undefined` property in the same objects. This is a scope-extension fact.
**It is not evidence that the E6 contract is defective.**

## 4. CORRECTION OF THE PRIOR ATTEMPT

```text
PRIOR_SCOPE_EXTENSION_ATTEMPT   = NOT RECORDED
PRIOR_INCORRECT_COUNT           = NOT AUTHORITY
CORRECTED_PRIOR_SHA256HEX_COUNT = 6
CORRECTED_QUARTER_COUNT         = 1

TOTAL_AUTHORIZED_FIELD_PATHS      = 9
TOTAL_AFFECTED_CONSTRUCTION_SITES = 6
```

The previous scope-extension attempt was correctly NOT RECORDED: its stated count of five
construction points for `priorSha256Hex` was disproven by the authoritative checkout, which
measures six. The incorrect count carries no authority. The corrected count below is
authoritative for this scope extension.

## 5. ADDITIONAL AUTHORIZED TARGET SCOPE

Supplied verbatim by RAMKI and re-verified line-for-line against the current checkout.

| # | Field path | Construction site | Points | Lines |
| --- | --- | --- | --- | --- |
| 1 | `$.records.<date>.priorSha256Hex` | `src/d114/historical_feasibility_runner.ts` | 6 | 419, 445, 480, 514, 553, 575 |
| 2 | `$.quarter` | `src/fundamentals/statement_normalizer.ts` | 1 | 239 |

Both are declared optional (`priorSha256Hex?: string`, `quarter?: FiscalQuarter`) and both
sit inside files already within the authorized six construction sites. The
construction-site boundary is therefore unchanged at six.

The original seven PATH A field paths remain authorized and unchanged.

## 6. AUTHORITY

| Key | Designated value |
| --- | --- |
| `E6_RESOLUTION_PATH` | **CURRENT_CONTRACT_RETAINED** |
| `CALLER_REMEDIATION_AUTHORITY` | **GRANTED** |
| `TOTAL_AUTHORIZED_FIELD_PATHS` | **9** |
| `TOTAL_AFFECTED_CONSTRUCTION_SITES` | **6** |
| `CONTRACT_MODIFICATION` | **NOT AUTHORIZED** |
| `E6_NULL_UNDEFINED_TREATMENT` | **PRESERVED** |
| `NO_CHANGE_TO_E6_LINEAGE_ALGORITHM` | **REQUIRED** |
| `TEST_MODIFICATION` | **NOT AUTHORIZED unless separately designated** |
| `UNRELATED_SOURCE_CHANGES` | **NOT AUTHORIZED** |
| `NO_DIGEST_EXPECTATION_REWRITE` | **AUTHORIZED** |
| `PRODUCTION_AUTHORITY` | **NOT GRANTED** |
| `D115_AUTHORITY` | **NOT GRANTED BY THIS ACT** |
| `DHAN_AUTHORITY` | **NOT GRANTED BY THIS ACT** |
| `NSE_AUTHORITY` | **NOT GRANTED BY THIS ACT** |

## 7. REMEDIATION SEMANTICS (unchanged)

```text
Optional properties carrying runtime `undefined` must be omitted rather than assigned an invented value, coerced value, or substitute value.
```

`null` remains preserved and continues through the authoritative E6 canonicalization
contract unchanged.

## 8. WHAT THIS ACT DOES NOT DO

| Statement |
| --- |
| `SCOPE EXTENSION` **!=** `REMEDIATION PERFORMED` |
| Neither field path remediated in this gate |
| No source, test, fixture or configuration file modified |
| No change to `src/contracts/provenance.ts` |
| No change to the E6 lineage algorithm, JCS serialization, framing, ordering or parentHash policy |
| No change to `null_undefined_treatment` |
| No expected digest rewritten |
| No prior governance record altered, amended or rewritten |
| No scope broadened beyond the two named field paths |

## 9. NO AUTHORITY FOR FURTHER MASKED SUCCESSORS

```text
FURTHER_MASKED_SUCCESSOR_AUTHORITY = NOT GRANTED
```

The observation that JCS exposes only the first present-`undefined` property encountered in
an object is **forensic context only**. It is NOT authority for any additional path. Any
further newly exposed field path requires a separate explicit RAMKI designation.

## 10. PRESERVED INDEPENDENT BLOCKERS (unchanged by this act)

| Element | State |
| --- | --- |
| E6 serialization contract (10 dimensions) | **UNCHANGED** — `448f2b88639b867464829f59a0d58797a838e98b` |
| `null_undefined_treatment` | **PRESERVED** |
| E6 lineage algorithm / digest encoding | **UNCHANGED** |
| PATH A resolution authority act | **UNCHANGED** — `d8258b5042b2b2eda88e7d55afca3d1e58426a7a` |
| E6 vocabulary assignment | **UNCHANGED** — 13/13 UNASSIGNED |
| PV-24 lineage computation inputs | **UNCHANGED** |
| E3 / E5 | **BLOCKED** |
| E7 persistence | **NOT GRANTED** |
| E8 numeric retention | **NOT DESIGNATED** |
| E9 transport / GP-3 | **NOT AUTHORIZED** |
| E10 frozen contract authority | **NOT CREATED** |
| `D115` | **NOT GRANTED BY THIS ACT** |
| Dhan / NSE provider access | **NOT GRANTED BY THIS ACT** |
| Production activation | **NOT GRANTED** |
| Workspace P-B / P-C / P-D / P-E lineage call sites | **0 / 0 / 0 / 0** |

## 11. SUPERSESSION

This act extends, and does not replace, the PATH A resolution authority act (`d8258b5042b2b2eda88e7d55afca3d1e58426a7a`),
which remains in force unmodified. No prior governance record is altered.

## 12. PRESERVATION

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

```text
E6_SCOPE_EXTENSION_AUTHORITY = RECORDED
ADDITIONAL_FIELD_PATHS = 2

priorSha256Hex_CONSTRUCTION_POINTS = 6
quarter_CONSTRUCTION_POINTS        = 1

TOTAL_AUTHORIZED_FIELD_PATHS      = 9
TOTAL_AFFECTED_CONSTRUCTION_SITES = 6

REMEDIATION_PERFORMED  = 0
SOURCE_CHANGES         = 0
TEST_CHANGES           = 0
CONTRACT_CHANGES       = 0
IMPLEMENTATION_CHANGES = 0
```

```text
SCOPE EXTENSION   !=   REMEDIATION PERFORMED
NEITHER FIELD PATH WAS MODIFIED BY THIS ACT.
```
