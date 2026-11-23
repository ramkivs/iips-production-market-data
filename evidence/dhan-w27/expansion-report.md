# DHAN-W27 Mapping Expansion Report

Proposal generator only. PROPOSED rows are not qualified mappings and are never loaded by the runtime daemon.

## Inputs (repository-held snapshots, SHA-256 provenance)

| Role | File | Rows | SHA-256 |
|---|---|---|---|
| PRIMARY_QUALIFICATION_SOURCE | `api-scrip-master-detailed.csv` | 217104 | `6f19feb4abd513843eaf2f139a27f17ccb660233f95ad385d11aa92c322a010d` |
| RECONCILIATION_ONLY_NO_ISIN | `api-scrip-master.csv` | 217104 | `4366e41b115b00b7a84225d3506a3dbb6ef483cb3ba4d32ad5f23d72e9edcddd` |

## Dispositions (every input row is accounted for)

- Input rows: **217104**
- In cash-equity scope: 23764
- Out of scope (non-equity): 193340
- Proposed additions: **0**
- Distinct cash-equity ISINs the vendor offers: 18697
- Of those, ISINs with no P04 company (universe gap, W-28): **16307**
- Already qualified: 4680
- Rejected: 212424 (of which conflicts/ambiguity: 0)
- Reconciliation holds: yes

| Disposition | Rows |
|---|---|
| PROPOSED_ADDITION | 0 |
| ALREADY_QUALIFIED | 4680 |
| REJECTED_NOT_EQUITY | 193340 |
| REJECTED_INVALID_FIELD | 24 |
| REJECTED_NO_P04_CORRESPONDENCE | 19060 |
| REJECTED_AMBIGUOUS_IDENTITY | 0 |
| REJECTED_DUPLICATE_IDENTITY | 0 |
| REJECTED_CONFLICTING_PROVIDER_ID | 0 |
| REJECTED_WRONG_SERIES | 0 |

## Why rows were not mapped

| Reason code | Rows | Explanation |
|---|---|---|
| OUT_OF_CASH_EQUITY_SCOPE | 193340 | The row is not a cash-equity row (segment, instrument or exchange outside NSE/BSE equity); it is counted and never proposed. |
| MALFORMED_PROVIDER_IDENTITY | 24 | A required provider field (security id, ISIN grammar, exchange series) is missing or malformed, so no exact identity can be formed. |
| NO_P04_COMPANY_FOR_ISIN | 18960 | The Dhan master carries the ISIN but the P04 master has no company with that ISIN, so no companyId can be assigned. The blocking authority is P04 coverage (universe expansion), not this pipeline. |
| NO_ACTIVE_P04_LISTING_FOR_EXCHANGE | 100 | The ISIN resolves to a P04 company, but that company has no ACTIVE listing on the row exchange, so the identity would contradict P04 listing evidence. |

## Proposed mappings (review list for W-14 — not applied here)

None. Every exact-identity row this snapshot offers is already qualified, so this run proposes no change.

## Coverage

- Qualified mappings before: 4680
- Potential gain from this snapshot: 0
- Coverage if every proposal were promoted (NOT done here): 4680
- Baseline by exchange:series: {"BSE:A":700,"BSE:B":1590,"NSE:EQ":2390}
- Proposed by exchange:series: {}

## Operator rerun

```
npm run dhan:w27-expand            # write evidence/dhan-w27/{expansion-manifest.json,expansion-report.md}
npm run dhan:w27-expand -- --check # verify a rerun is byte-identical; non-zero exit on drift
```
