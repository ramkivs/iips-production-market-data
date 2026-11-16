# IPD D02 — Windows-Host Operator Execution Package for Level E Read-Only D5 / D16 SQLite Inventory

**Document ID:** `IPD-D02-D5-D16-WINDOWS-HOST-OPERATOR-PACKAGE-2026-11-16`  
**Date:** `2026-11-16`  
**Repository:** `ramkivs/iips-production-market-data` (`IPD`)  
**Branch:** `arena/c32aea42-iips-production-market-data`  
**Operator Package Version:** `2026-11-16.1`  
**Execution Scope:** **Windows-Host Operator Package Prepared — Live Inventory NOT Yet Executed**  
**Governing Approval:** Narrow Program Authority approval (`2026-11-16`) for **Level E strictly read-only D5 / D16 SQLite inventory and provenance discovery ONLY** ([`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](./IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md))  
**Authoritative Query Catalog Source:** [`IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md`](./IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md) (`§2.3` & `§3.9.B`)

---

## 1. Purpose & Honest Execution Status

Because `C:\iips-data\iips\user-portfolio.sqlite` resides exclusively on the Principal's physical Windows host (see [`evidence/d02-inventory-2026-11-16/README.md`](../../evidence/d02-inventory-2026-11-16/README.md)), this package provides the complete, repository-owned, zero-dependency **Windows PowerShell 5.1 + Node.js (`>= 22.13.0`) read-only execution package** so the Principal can run the approved `Q01`–`Q14` inventory directly on the Windows host with fail-closed preflight and postflight integrity proof.

- **Linux sandbox execution status:** **NOT EXECUTED** (by explicit instruction and enforced fail-closed by host-platform guards in both PowerShell and Node).
- **Live SQLite inventory status:** **NOT YET COMPLETED** (`LIVE COUNTS REMAIN UNKNOWN` until the Principal executes this package on the Windows host and returns the emitted evidence bundle).
- **Downstream gate separation (unchanged):**
  - **D5 (`D5-T1`–`D5-T5`) acceptance:** remains a separate gate (`BLOCKED` pending Principal-returned Windows evidence)
  - **D16 detailed schema & idempotency specification approval:** remains a separate gate
  - **Implementation authority:** remains a separate gate
  - **Live provisioning / owner reassignment / migration execution:** remains a separate gate
  - **D6 (`IRR` integration):** remains `NOT STARTED`

---

## 2. Repository-Owned Deliverable Files & Pinned SHA-256 Digests

| File | Role | Pinned SHA-256 |
|---|---|---|
| [`scripts/Invoke-D02D5D16ReadOnlyInventory.ps1`](../../scripts/Invoke-D02D5D16ReadOnlyInventory.ps1) | Windows PowerShell 5.1 operator entrypoint targeting `C:\iips-data\iips\user-portfolio.sqlite` | `e86286ef5390c6f87bffece176ee4534d79a608676d1d2a0799b8efded0e7f29` |
| [`scripts/d02-d5-d16-readonly-inventory-runner.mjs`](../../scripts/d02-d5-d16-readonly-inventory-runner.mjs) | Zero-dependency Node.js (`>= 22.13.0`) `node:sqlite` read-only runner (`capability-probe` + `inventory` modes) | `7d92d11fe970a55c1fb3274e635525af8f779257487546fd4d2d63effb288f77` |
| [`scripts/d02-d5-d16-query-catalog.mjs`](../../scripts/d02-d5-d16-query-catalog.mjs) | Verbatim `Q01`–`Q14` SQL catalog (`21` statements across `14` query groups) from [`IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md`](./IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md) `§3.9.B` | `484640be587c88bec90239d05fb983205125070aea3e023b4b9b35eb561002fe` |

---

## 3. Windows-Host Prerequisites & Exact Operator Commands

### 3.1 Before Running on the Windows Host

1. **Stop any running IPD / IRR processes** so `C:\iips-data\iips\user-portfolio.sqlite` has zero active writers, zero open `\\.\pipe\iips-user-portfolio*` named pipes, and zero `-wal` / `-shm` / `-journal` sidecars. *(If any service or sidecar is present, the script will detect it and stop immediately without opening SQLite.)*
2. **Pull or fetch branch `arena/c32aea42-iips-production-market-data`** in a local Windows checkout of `ramkivs/iips-production-market-data`. **No `npm install`, `npm ci`, or TypeScript build is required or permitted** for this runner — it uses only built-in PowerShell 5.1 / `.NET` APIs and built-in Node.js (`>= 22.13.0`) ESM + `node:sqlite`.

### 3.2 Standard Execution Command (Windows PowerShell 5.1)

Run from **Windows PowerShell 5.1** (`powershell.exe`):

```powershell
Set-Location -LiteralPath '<PATH_TO_LOCAL_IPD_CHECKOUT>'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-D02D5D16ReadOnlyInventory.ps1 -NoPause
```

### 3.3 Optional Parameters

| Parameter | Default | Purpose |
|---|---|---|
| `-DatabasePath <string>` | `C:\iips-data\iips\user-portfolio.sqlite` | Full Windows drive-qualified path to the existing SQLite database file |
| `-NodeExecutable <string>` | Auto-resolves `C:\Node22\node-v22.16.0-win-x64\node.exe`, then `node.exe` on `PATH` | Explicit full path to `node.exe` (`>= 22.13.0`) |
| `-EvidenceRoot <string>` | `%LOCALAPPDATA%\IIPS\d02-d5-d16-readonly-inventory` | Parent folder under which `d02-d5-d16-inventory-<UTC>-<rand8>` is created (must lie outside both the live DB folder and any Git worktree) |
| `-ExpectedCommit <40-hex>` | *(optional)* | Fails closed before touching the database if `git rev-parse HEAD` in `-RepositoryRoot` does not match |
| `-RepositoryRoot <string>` | Parent of `scripts\` | Path to the local IPD checkout |
| `-NoPause` | `$false` | Skips the interactive `Press Enter to finish...` prompt |

### 3.4 Exit Codes

| Exit Code | Disposition | Meaning |
|---:|---|---|
| `0` | `INVENTORY_COMPLETE_READ_ONLY_VERIFIED` | All preflight checks passed, `Q01`–`Q14` executed inside read-only `BEGIN DEFERRED ... ROLLBACK`, and independent Node + PowerShell postflight checks confirmed **exact pre/post SHA-256 equality** and **zero sidecar creation** |
| `2` | `STOPPED_PRECONDITION_FAILED` | Stopped fail-closed before (or on) query execution (e.g., missing DB/parent dir, `-wal`/`-shm`/`-journal` sidecar present, active writer/pipe/process detected, invalid/WAL SQLite header, or incompatible Node/`node:sqlite` runtime); full diagnostic evidence preserved |
| `3` | `STOPPED_POSTCONDITION_OR_INTEGRITY_FAILED` | Stopped fail-closed due to `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, `audit_events` SHA-256 chain mismatch, `Q14` `query_only != 1`, or any postflight hash/size/mtime/sidecar discrepancy; full diagnostic evidence preserved |

---

## 4. Mandatory Safety Requirements Traceability (`1`–`14` + Runtime API Probe)

| # | Safety Requirement | Enforcement in PowerShell (`Invoke-D02D5D16ReadOnlyInventory.ps1`) & Node (`d02-d5-d16-readonly-inventory-runner.mjs`) |
|---:|---|---|
| 1 | Do **not** start the application or run any normal startup path | Zero server startup, zero pipe binding, zero imports from `src/` or `dist/` |
| 2 | Do **not** call `openDatabase()`, runtime binding resolvers, migration runners, or Direct P1 provisioning | Runner imports **only** Node built-ins (`node:crypto`, `node:fs`, `node:path`, `node:url`, `node:sqlite`) and `./d02-d5-d16-query-catalog.mjs` |
| 3 | Do **not** install dependencies | Zero `npm` / `npx` calls anywhere; verified statically by `.validate-scripts.py` and conformance tests |
| 4 | Do **not** create a missing database or parent directory | Both PowerShell (`[System.IO.Directory]::Exists` / `[System.IO.File]::Exists`) and Node (`existsSync` / `lstatSync`) verify pre-existence before SQLite open; missing paths stop immediately with exit code `2` |
| 5 | Do **not** open the database in read-write mode | PowerShell preflight opens only `[FileMode]::Open, [FileAccess]::Read, [FileShare]::Read`; Node opens only `new DatabaseSync(dbPath, { open: true, readOnly: true })` |
| 6 | Do **not** execute schema, migration, ledger, journal, or data-changing SQL | `assertApprovedReadOnlySql()` rejects any SQL outside single-statement `SELECT` or `PRAGMA integrity_check;` / `PRAGMA foreign_key_check;` / `PRAGMA query_only;` |
| 7 | Do **not** perform provisioning, reassignment, reset, restore, re-key, or portfolio/holding writes | Enforced at three independent layers: SQL allowlist, `DatabaseSync(..., { readOnly: true })`, and `PRAGMA query_only = ON;` |
| 8 | Do **not** ignore `-wal`, `-shm`, or `-journal` sidecars | Both PowerShell (`Get-DatabaseSidecarSnapshot`) and Node (`inspectDisallowedSidecars`) inspect explicit `-wal`, `-shm`, `-journal`, and `<db>-mj*` files preflight and postflight, plus verify SQLite header bytes `18=1, 19=1` (legacy rollback format, refusing WAL-flagged headers) |
| 9 | Refuse missing, non-regular, invalid-header, active-writer, or sidecar-bearing DB | Refuses missing/directory/reparse/symlink paths, non-fixed drives, `<100`-byte files, invalid `'SQLite format 3\0'` magic or page size, WAL header `(2,2)`, active `\\.\pipe\iips-user-portfolio*` pipe, running writer `node.exe`, or `FileShare::Read` lock conflict |
| 10 | Open strictly in verified read-only mode and enforce `query_only` | Before touching the live DB, Step `04` runs `--mode=capability-probe` verifying `:memory:` `PRAGMA query_only = ON` write-rejection and confirming `new DatabaseSync(nonexistentPath, { open: true, readOnly: true })` throws without creating a file; Step `05` sets `PRAGMA query_only = ON; PRAGMA temp_store = MEMORY;` and verifies `PRAGMA query_only === 1` both before `BEGIN DEFERRED;` and in `Q14` |
| 11 | Execute **only** the approved `Q01`–`Q14` catalog inside a documented read transaction | Runs exact `Q01`–`Q14` statements (`21` read-only statements; `Q10` conditional on `portfolio_restore_receipts` presence in `Q02`) inside `BEGIN DEFERRED; ... ROLLBACK;` |
| 12 | Verify pre-inspection and post-inspection SHA-256 are identical | Computed independently by PowerShell (`.NET` `SHA256`) before Step `04` and after Step `05`, and by Node (`node:crypto` streaming `sha256`) before `DatabaseSync` open and after `db.close()`; cross-checked across both layers |
| 13 | Verify no sidecar files were created or changed | Both Node and PowerShell re-scan the database directory after `db.close()` to confirm zero `-wal`, `-shm`, `-journal`, or `-mj*` files exist |
| 14 | Stop and preserve all evidence on any precondition or postcondition failure without repair or read-write fallback | Every failure path writes full structured JSON/Markdown/log diagnostics and seals `sha256s.txt` without attempting recovery, checkpointing, or read-write open |

---

## 5. Emitted Timestamped Evidence Directory Layout

Each run creates `%LOCALAPPDATA%\IIPS\d02-d5-d16-readonly-inventory\d02-d5-d16-inventory-<yyyyMMddTHHmmssfffZ>-<8hex>\` containing:

| File | Contents | External Sharing Guidance |
|---|---|---|
| `00-node-sqlite-capability-probe.json` | Windows Node runtime version, bundled `sqlite_version()`, `:memory:` `query_only` DDL-block proof, and missing-file `readOnly: true` non-creation proof | Safe to return |
| `ps-host-preflight.json` | Windows OS / PowerShell 5.1 details, package file SHA-256s, Git `HEAD`, fixed-drive / reparse / named-pipe / running-process / `FileShare::Read` writer-lock checks, SQLite header verification, and PowerShell pre/post SHA-256 | Safe to return |
| `01-preflight-and-database-metadata.json` | Consolidated DB file metadata, pre/post SHA-256, byte size, timestamps, pre/post sidecar checks, script/catalog SHA-256s, and invariant booleans | Safe to return |
| `02-q01-q14-query-results.json` | Exact statement-by-statement `Q01`–`Q14` SQL, SQL SHA-256, status, row counts, and raw result rows | **Review locally before sharing:** `Q09` omits raw `file_name` by design, whereas `Q04` includes `principal_label`, `Q06` includes `portfolio_name`, and `Q13` includes `audit_events.detail_json` |
| `03-migration-ledger-and-schema-evidence.json` | `_migration_ledger` comparison against repository `001`–`006` checksums, `006_portfolio_restore` state, candidate D02 table absence check, and `Q03` `integrity_check` / `foreign_key_check` results | Safe to return |
| `04-counts-and-relationship-summary.json` | Sanitized binding/membership/portfolio/revision/holding/contribution/restore-receipt/audit counts, owner/tenant relationship matrix, and in-memory `audit_events` SHA-256 chain verification | Safe to return |
| `05-collision-duplicate-orphan-null-findings.json` | `Q11a` S1-vs-D02 `portfolio_id` collisions, `Q11b` duplicate normalized symbols, `Q11c` active-row invariants, `Q12a`–`Q12c` orphan/pointer/count checks, `Q07` digest NULLs, `Q08` `005` identity states, and `Q09` `004` provenance NULL counts | Safe to return |
| `06-provenance-and-unresolved-records.json` | Explicit non-inference attestation, per-portfolio non-inferential provenance/readiness classifications (keyed strictly by SQL IDs without `portfolio_name` or `file_name`), and explicit list of all blocker unresolved records and non-inferential observations | Safe to return |
| `07-independent-powershell-postflight.json` | Independent PowerShell postflight SHA-256, byte-length, `LastWriteTimeUtc`, and sidecar verification | Safe to return |
| `d5-d16-inventory-summary.json` | Machine-readable executive JSON summary across all counts, hashes, runtime details, findings, and gate-separation flags | Safe to return |
| `d5-d16-inventory-report.md` | Human-readable Markdown inventory report | Safe to return |
| `node-capability-probe.stdout.txt` / `.stderr.txt` | Captured stdout/stderr from Step `04` capability probe | Safe to return |
| `node-runner.stdout.txt` / `.stderr.txt` | Captured stdout/stderr from Step `05` read-only inventory run | Safe to return |
| `operator-execution.log` | Timestamped step-by-step PowerShell execution log | Safe to return |
| `sha256s.txt` | Self-verified SHA-256 manifest covering every file in the evidence directory | Safe to return |

---

## 6. Related Governance & Technical Artifacts

- [`IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md`](./IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md)
- [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](./IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md)
- [`IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](./IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md)
- [`IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`](./IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md)
- [`evidence/d02-inventory-2026-11-16/README.md`](../../evidence/d02-inventory-2026-11-16/README.md)
