# D02 D5/D16 read-only inventory evidence — Windows host (`2026-11-16`)

This directory holds the published artifacts of the narrowly scoped, strictly non-mutating Level E read-only D5 / D16 SQLite inventory executed on the Principal's Windows host (`C:\iips-data\iips\user-portfolio.sqlite`) on `2026-11-16` under the Program Authority approval recorded in [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](../../docs/integration/IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16).

| File | Role |
|---|---|
| `windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip` | Published read-only inventory archive (17 verified entries: preflight metadata, `Q01`–`Q14` query results, schema/migration ledger evidence, counts/relationship summary, collision/null findings, provenance/unresolved records, PowerShell postflight, inventory report and summary JSON, captured stdout/stderr, execution log, and the run's internal `sha256s.txt`) |
| `sha256s.txt` | Published 5-line SHA-256 manifest for the pinned IPD documents and historical status JSON below (asserted by `tests/ipd_d02_d5_d16_operator_package_conformance.test.ts`: exactly 5 lines) |
| `d5-d16-readonly-inventory-status-2026-11-16.json` | Historical Linux-sandbox preflight / blocker status (kept untouched; the sandbox run stopped on Windows-host database absence) |

**Read-only evidence only.** This directory records inspection output. No database mutation, provisioning, migration, or D5 acceptance is implied by these artifacts. Detailed per-run findings are reconciled in [`IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md`](../../docs/integration/IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md).
