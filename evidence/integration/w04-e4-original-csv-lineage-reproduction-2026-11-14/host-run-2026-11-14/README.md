# W04 E4 — host run of the lineage reproduction utility, 2026-11-14

**State: the complete host output is in this folder and is reconciled. No figure differs.**

The Principal ran `w04-e4-csv-lineage-reproduction.mjs` on the Windows host and reported the result. The run was not made in the environment that maintains this repository, and that environment has no access to the host, to the CSV or to the capture.

| Item | State |
|---|---|
| Figures of the run | First reported by the Principal in the task brief of 2026-11-14. Transcribed in the [record](../../../../docs/integration/IIPS-W04-E4-ORIGINAL-CSV-LINEAGE-REPRODUCTION-UTILITY-PREPARED-2026-11-14.md), sections 12.2 to 12.7 |
| Complete sanitized output | [`w04-e4-csv-lineage-output.txt`](w04-e4-csv-lineage-output.txt). Supplied by the Principal as text in the conversation, after the figures were recorded. Reconciled in the record, section 12.10 |
| The CSV and the capture | Never requested, never received. They stay on the host |

*History: this note was first committed at `4b90543`, when the output had not been received. It then listed the steps to take on arrival and the figures to compare. Those steps are now done and reported below.*

## The file

| | |
|---|---|
| Lines; bytes | 139; 27,123. ASCII only, LF line endings |
| SHA-256 of the committed file | `518d76c31fef9351175d179839322165432977dd04f9c69b6accd217597860de` |
| `E4_CSV_LINEAGE_RESULT_JSON_SHA256`, as printed in the file | `022154468fa27552cf7ac33fa2760000c6ccc94cc812a49da7064c7796f1358c` |
| Contents | The check lines of sections 1 to 6, 64 `[ROW]` lines, `E4_CSV_LINEAGE_RESULT_JSON`, its SHA-256, and the `checks:`, `unresolved:` and `RESULT:` lines |

The text is that of the Principal's message. It was written to the file from that message. The encoding and line endings of the file on the host are not known, so the SHA-256 of the committed file identifies this file, not the host file. The result JSON is different: its digest was printed by the utility and is reproduced here, so that line is byte-for-byte what the utility hashed.

## Checks made on arrival

| # | Check | Result |
|---|---|---|
| 1 | SHA-256 of the text after `E4_CSV_LINEAGE_RESULT_JSON: ` (14,024 bytes), recomputed | Equal to the printed `E4_CSV_LINEAGE_RESULT_JSON_SHA256` |
| 2 | The 64 `[ROW]` lines against the 64 `holdings` entries of the JSON | Equal, 64 of 64 |
| 3 | Lines tagged `[PASS]`, `[FAIL]`, `[WARN]`; the `checks` member; the `checks:` line | 19, 0, 0 in all three |
| 4 | Wording of the other 66 lines against the committed synthetic sample of the utility, numbers and digests masked | 64 identical; 2 differ only in a reported value (evidence eligibility; counts by input class) |
| 5 | Content, for a public repository | Counts, ordinals, CSV line numbers, closed-vocabulary values, the two whole-file digests and the result digest. No ISIN-shaped token, path, file name, symbol, quantity or price |

To repeat check 1 from the repository root:

```
grep '^E4_CSV_LINEAGE_RESULT_JSON: ' evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/w04-e4-csv-lineage-output.txt | sed 's/^E4_CSV_LINEAGE_RESULT_JSON: //' | tr -d '\n' | sha256sum
```

These checks show the text is internally consistent and has the form the published utility prints. It remains operator-reported host evidence.

## Reconciliation with the figures first reported

| Figure | Reported in the brief | In the output |
|---|---|---|
| CSV import-content SHA-256; raw-byte SHA-256 | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107`; the same | Equal |
| CSV encoding | Valid UTF-8, no byte-order mark, CRLF, within 1 MiB | Equal |
| Capture SHA-256 | `c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3` | Equal |
| Capture | Schema v1; `CONSISTENT_CAPTURE`; `DHAN_PORTFOLIO`; revision 1; 64 holdings; 64 distinct lineage digests; one committed import; operation `INITIAL`; source broker `DHAN` | Equal |
| `securityIdentity` | object 1; `null` 63; other 0 | Equal |
| `identityStatus`; `resolutionDisposition` | `{"RESOLVED":64}`; `{"CANONICAL_P04":64}` | Equal |
| Link | Exactly one committed import with the CSV's content digest; ISO-8601 UTC instant; file name equal; `SAVED_NEW_BATCH` | Equal |
| CSV layout | `DHAN_DETAILED_HOLDINGS_V1`; 64 data rows; 64 native rows; 0 skipped, 0 aggregated, 0 excluded; 64 holdings; 64 distinct ISINs | Equal |
| Row identifiers | ISIN and NSE 63; ISIN and BSE 1; every other class 0 | Equal |
| Reproduction | 64 targets; 64 reproduced one-to-one, `MAPPER_BI03`; 0 ambiguous; 0 not reproduced; 0 identifiers-only; 0 CSV holdings matching no stored digest; stored members equal on 64 | Equal |
| Whole-import digest | Equals the import evidence: PASS. Equals the revision provenance: PASS | Equal |
| Input of the reproduced holdings, identity `null` | `ISIN+EXCHANGE_NSE` 62; `ISIN+EXCHANGE_BSE` 1 | Equal |
| Input of the reproduced holdings, identity object | `ISIN+EXCHANGE_NSE` 1 | Equal |
| Final line | `RESULT: REPRODUCED_ALL` | Equal |

Read from the output, not in the brief: `checks: 19 pass, 0 fail, 0 warn`; `unresolved: none`; no `[WARN]` line and no digest override; `capture.evidenceEligibility: HOST_CAPTURE_SUBJECT_TO_REVIEW`; one capture file examined; 11 header columns; the 64 row records. The holding with the identity object is `H01` (CSV line 61); the BSE row is `H06` (CSV line 62).

Reported in the brief only, not printed by the utility: the utility SHA-256 observed on the host (`901a365c4dad816532fd244e9b17a7c7bb5cffbebff2a57bd4ad0f9f40c20a9c`, printed by step 3 of the command), the exit code (0), the CSV path and the PowerShell version.

## What this evidence is not

It does not show why no security identity was stored for the 63 holdings. It assigns no identity. It does not recover or recreate the IRR evidence journal. It is not an acceptance of W04.
