# W04 E4 — host run of the lineage reproduction utility, 2026-11-14

**State: the complete host output is NOT in this folder yet.**

The Principal ran `w04-e4-csv-lineage-reproduction.mjs` on the Windows host and reported the result. The run was not made in the environment that maintains this repository, and that environment has no access to the host, to the CSV or to the capture.

| Item | State |
|---|---|
| Figures of the run | Reported by the Principal in the task brief of 2026-11-14. Transcribed in the [record](../../../../docs/integration/IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md), section 12 |
| Complete sanitized output (`w04-e4-csv-lineage-output.txt`: the check lines, 64 `[ROW]` lines, `E4_CSV_LINEAGE_RESULT_JSON` and its SHA-256, the `checks:`, `unresolved:` and `RESULT:` lines) | **Not received.** The brief states it was attached; no attachment was delivered. The Principal chose to attach it again |
| The CSV and the capture | Never requested, never received. They stay on the host |

## When the output arrives

1. Commit it here verbatim as `w04-e4-csv-lineage-output.txt`. Change no byte. Record its SHA-256 in this file.
2. Recompute the SHA-256 of the text after `E4_CSV_LINEAGE_RESULT_JSON: ` and compare it with the `E4_CSV_LINEAGE_RESULT_JSON_SHA256` line.
3. Check every figure below against the output and against the result JSON. A difference is recorded and the record is corrected; the output is not edited.
4. Check that the output holds what the utility is designed to print and nothing else: counts, the two whole-file digests, ordinals, CSV line numbers and closed-vocabulary values. This repository is public.

## Figures the output must agree with

| Figure | Reported |
|---|---|
| Utility SHA-256, printed at step 3 of the command | `901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c` |
| CSV import-content SHA-256; raw-byte SHA-256 | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107`; the same |
| CSV encoding | Valid UTF-8, no byte-order mark, CRLF, within 1 MiB |
| Capture SHA-256 | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` |
| Capture | Schema v1; `CONSISTENT_CAPTURE`; `DHAN_PORTFOLIO`; revision 1; 64 holdings; 64 distinct lineage digests; one committed import; operation `INITIAL`; source broker `DHAN` |
| `securityIdentity` | object 1; `null` 63; other 0 |
| `identityStatus`; `resolutionDisposition` | `{"RESOLVED":64}`; `{"CANONICAL_P04":64}` |
| Link | Exactly one committed import with the CSV's content digest; ISO-8601 UTC instant; file name equal; `SAVED_NEW_BATCH` |
| CSV layout | `DHAN_DETAILED_HOLDINGS_V1`; 64 data rows; 64 native rows; 0 skipped, 0 aggregated, 0 excluded; 64 holdings; 64 distinct ISINs |
| Row identifiers | ISIN and NSE 63; ISIN and BSE 1; every other class 0 |
| Reproduction | 64 targets; 64 reproduced one-to-one, `MAPPER_BI03`; 0 ambiguous; 0 not reproduced; 0 identifiers-only; 0 CSV holdings matching no stored digest; stored members equal on 64 |
| Whole-import digest | Equals the import evidence: PASS. Equals the revision provenance: PASS |
| Input of the reproduced holdings, identity `null` | `ISIN+EXCHANGE_NSE` 62; `ISIN+EXCHANGE_BSE` 1 |
| Input of the reproduced holdings, identity object | `ISIN+EXCHANGE_NSE` 1 |
| Final line; exit code | `RESULT: REPRODUCED_ALL`; 0 |

Not reported in the brief, to be read from the output: the totals of the `checks:` line, any `[WARN]` line, the `unresolved:` line, the 64 `[ROW]` lines, the result JSON and its SHA-256.
