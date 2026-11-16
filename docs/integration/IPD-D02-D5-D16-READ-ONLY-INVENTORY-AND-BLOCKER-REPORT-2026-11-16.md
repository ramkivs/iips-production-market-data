# IPD D02 — D5/D16 read-only evidence inventory preflight, host-access blocker report, and read-only SQL specification

**Date:** 2026-11-16
**Authority:** Program Authority approval dated 2026-11-16 ([recorded approval](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md#2-narrow-level-e-read-only-d5d16-evidence-inventory-approved-on-2026-11-16))
**Owner:** IPD (`ramkivs/iips-production-market-data`)
**Related register and tracker:** [D02 Program Authority Decision Package](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md) · [Stage 5 D5 Identity Mapping Tracker](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md)
**Machine-readable status artifact:** [`evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json`](../../evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json)
**Execution outcome:** **PA APPROVAL RECORDED; READ-ONLY ACCESS METHOD VERIFIED; LIVE INVENTORY SAFELY STOPPED AND BLOCKED BY WINDOWS HOST DATABASE UNREACHABILITY IN THE ARENA LINUX SANDBOX (`B02_WINDOWS_HOST_DATABASE_UNREACHABLE_IN_LINUX_SANDBOX`).**

---

## 1. Recorded Program Authority authorization and strict scope boundary

On **2026-11-16**, the Program Authority authorized a narrowly scoped, strictly non-mutating **Level E read-only D5/D16 evidence inventory** of the existing local SQLite database solely to collect evidence required for:

- **D5 identity-mapping evidence** (`local_principal_bindings`, `local_principal_memberships`, `audit_events`, and presence/absence of candidate D02 relationship or owner-registry tables).
- **D16 historical inventory and collision assessment** (`portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`, `portfolio_restore_receipts`, `_migration_ledger`, candidate historical portfolios, duplicate identifiers/collisions against destination `owner-4dc756b3` / `ipd-personal-local`, NULL relationships/provenance, orphan records, and historical ownership/provenance evidence without inferring ownership from source labels).

The approval is recorded in [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md), [`IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md), and [`IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md).

**Retained prohibitions enforced throughout this execution:**

- No schema changes, DDL execution, migration execution, or `_migration_ledger` writes.
- No portfolio, revision, holding, contribution, restore-receipt, or audit-event writes.
- No identity, relationship, owner-registry, provider-catalog, or source-record provisioning or reassignment.
- No historical re-keying, ownership movement, tombstone restoration, reset, or replacement operations.
- No application startup (`src/ipc/entrypoint.ts`), dependency installation (`npm install` / `npm ci`), database creation/modification, IRR repository modification, or PR merge.
- No D5 acceptance, Level C detailed schema approval, Level D implementation grant, mutating Level E authorization, or D6 authorization.

---

## 2. Safe execution preflight (Section 4 requirements 1–6)

Before attempting any database access, all six mandatory safety checks were executed in order:

### 2.1 Exact database path and current state in this environment

| Check | Observed fact (`2026-11-16T12:55:24.779Z` UTC) | Source / verification |
|---|---|---|
| Designated Windows database path | `C:\iips-data\iips\user-portfolio.sqlite` | `DESIGNATED_USER_PORTFOLIO_DB_PATH` in [`src/persistence/directP1Provisioning.ts:69`](../../src/persistence/directP1Provisioning.ts) and [`docs/DIRECT_P1_PROVISIONING.md`](../DIRECT_P1_PROVISIONING.md) |
| Runtime path environment variable | `IIPS_G3_DATABASE_PATH` = `UNSET` (`null`) | `DATABASE_PATH_SETTING` in [`src/ipc/entrypoint.ts:44`](../../src/ipc/entrypoint.ts); verified via `process.env` |
| Other `IIPS_*` / `IPD_*` / `G2_*` / `G3_*` / `PORTFOLIO_*` / `DHAN_*` variables | All `UNSET` | Environment check |
| Execution host | Ephemeral Linux container (`Linux 6.1.158+ x86_64`, Node `v22.22.3`, bundled `node:sqlite` SQLite `3.51.3`) — **not** the Principal's local Windows host | `uname -a`, `process.platform`, `process.versions.node`, `SELECT sqlite_version()` on `:memory:` |
| Designated database path present here | `false` (`existsSync('C:\\iips-data\\iips\\user-portfolio.sqlite') === false`) | Read-only `node:fs` check |
| Any `.sqlite*`, `.db`, `-wal`, `-shm`, `-journal`, or `user-portfolio*` files anywhere in the container | **None (`0` files)** | Read-only `find /` scan across worktree, `/home/user`, and container filesystem |

### 2.2 Inspection of application startup and migration code paths

Checked-in source modules were audited to verify which code paths can mutate or create a database or execute migrations:

| Code path | Checked-in location | Behavior on invocation | Safe for read-only D5/D16 inventory? |
|---|---|---|---|
| **Normal IPC server startup** (`startIpcServer` / CLI `entrypoint.js`) | [`src/ipc/entrypoint.ts:116–243`](../../src/ipc/entrypoint.ts) | Calls `openDatabase(env.IIPS_G3_DATABASE_PATH)` → `ensureMigrations(db, GATE3_MIGRATIONS)` (`001`..`006`) → `verifyAuditChain(db)` → `new ClassPJournal(...)` (creates `ipc-diagnostics` directory) → binds endpoint; CLI wrapper forces `IIPS_LOCAL_PERSONAL_USE=1`. | **NO — PROHIBITED.** Creates missing directories/database files, sets persistent journal pragmas, and executes pending migrations `001`–`006` with `_migration_ledger` inserts. |
| **Shared connection helper** (`openDatabase`) | [`src/persistence/connection.ts:68–94`](../../src/persistence/connection.ts) | Runs `mkdirSync(dirname(filePath), { recursive: true })`, opens `new DatabaseSync(filePath)` in default **read-write / create** mode, and executes `PRAGMA journal_mode = DELETE;` and `PRAGMA synchronous = FULL;`. | **NO — PROHIBITED.** Creates an empty database if absent and opens a write-capable handle that can alter journal/header state. |
| **Migration runner** (`ensureMigrations`) | [`src/persistence/migration_ledger.ts:46–96`](../../src/persistence/migration_ledger.ts) | Executes `CREATE TABLE IF NOT EXISTS _migration_ledger ...` unconditionally and runs `BEGIN IMMEDIATE; db.exec(migration.sql); INSERT INTO _migration_ledger ...; COMMIT;` for any unapplied migration. | **NO — PROHIBITED.** Executes DDL and writes `_migration_ledger`. Note: `readLedger(db)` at line 99 is a pure `SELECT`, safe only if `_migration_ledger` already exists on a read-only handle. |
| **Runtime binding resolvers** (`resolveActiveBinding`, `resolveActiveHoldingsBinding`) | [`src/persistence/binding.ts:75–166`](../../src/persistence/binding.ts) | Wraps reads inside `db.exec('BEGIN IMMEDIATE;') ... db.exec('COMMIT;')` to serialize against concurrent writes. | **NO — DO NOT CALL.** Acquires a SQLite write lock (`SQLITE_READONLY` failure on a read-only handle; write-lock acquisition if opened read-write). Pure `SELECT` inspection (`inspectBindings` or `Q04`–`Q05` below) must be used instead. |
| **Direct P1 verification CLI** (`verifyProvisionedDatabase` / `--mode=verify`) | [`src/persistence/directP1Provisioning.ts:815–1330`](../../src/persistence/directP1Provisioning.ts) | Opens `new DatabaseSync(storePath, { readOnly: true })` and verifies pre/post file SHA-256, **but** validates against `gateAPrimeValidation.ts` `GATE3_MIGRATIONS` (`001`..`004` only). | **INSUFFICIENT / DO NOT USE AS INVENTORY RUNNER.** On a store migrated through `005_holding_security_identity` and `006_portfolio_restore`, `DP-V1` (`expected 4 ledger rows`) and `DP-V2` (`unexpected table portfolio_restore_receipts`, `security_identity` column) fail; it also neither checks pre-open `-wal`/`-shm`/`-journal` sidecars nor collects the D16 portfolio/collision/orphan/NULL inventory. |

### 2.3 Confirmed genuinely read-only inspection method

To guarantee zero possibility of schema mutation, migration execution, journal recovery writes, or file creation when executed on the Principal's Windows host, the required inspection method is:

1. **Offline pre-open filesystem and sidecar refusal (zero SQLite calls until passed):**
   - Confirm no running IPD (`entrypoint.js`) or IRR process holds `C:\iips-data\iips\user-portfolio.sqlite` open.
   - Check `fs.existsSync` for `<db>-wal`, `<db>-shm`, and `<db>-journal`; if **any** sidecar exists, **STOP immediately** before opening SQLite so SQLite cannot attempt hot-journal/WAL recovery or observe an uncommitted/uncheckpointed state.
   - Verify via `fs.lstatSync(dbPath)` that the file exists, `isFile() === true`, `isSymbolicLink() === false`, and `size >= 100` bytes; read the first 16 bytes with `fs.openSync(dbPath, 'r')` and verify exact `SQLite format 3\0` magic header.
   - Record pre-inspection `fileSizeBytes`, `mtimeUtc`, and full-file `SHA-256`.
2. **Strict read-only `node:sqlite` connection (Node `>= 22.13.0`, built-in `node:sqlite`, zero npm dependencies):**
   - Open strictly via `new DatabaseSync(dbPath, { open: true, readOnly: true })` (`SQLITE_OPEN_READONLY` without `SQLITE_OPEN_CREATE`). Verified empirically in Node `v22.22.3` / SQLite `3.51.3`: opening a missing path throws `ERR_SQLITE_ERROR` (`errcode: 14`, `unable to open database file`) and creates **no** file; any write or `BEGIN IMMEDIATE` throws `SQLITE_READONLY`.
   - Immediately execute connection-local `PRAGMA query_only = ON;` and `PRAGMA temp_store = MEMORY;`. Never execute `PRAGMA journal_mode`, `PRAGMA synchronous`, `PRAGMA wal_checkpoint`, `openDatabase()`, `ensureMigrations()`, or `resolveActiveBinding()`.
3. **Single read-snapshot SQL inspection (`BEGIN DEFERRED; ... ROLLBACK;`):**
   - Wrap read-only `SELECT` and read-only `PRAGMA` queries (`Q01`–`Q14` in §3.9) inside `BEGIN DEFERRED;` ... `ROLLBACK;` so every count, key, FK check, collision check, and ledger row comes from one consistent snapshot and explicitly rolls back without committing.
4. **Post-close byte-immutability proof:**
   - Call `db.close()`, verify `<db>-wal`, `<db>-shm`, and `<db>-journal` remain absent, recompute `fileSizeBytes`, `mtimeUtc`, and full-file `SHA-256`, and assert `preInspectionSha256 === postInspectionSha256`.

### 2.4 Safe stop determination in this environment

Because `C:\iips-data\iips\user-portfolio.sqlite` resides exclusively on the Principal's local Windows host and no SQLite database exists in (or is reachable from) this Linux sandbox, **execution stopped safely at the host-availability gate** per Section 4(5) and Section 7 of the Program Authority instruction. No empty/synthetic database was created, no normal startup was attempted, and no dependencies were installed.

---

## 3. Required D5/D16 evidence report (Section 5 items 1–10)

Where live SQLite inspection is required, results are reported strictly as **`NOT OBTAINED (blocked by Windows host database unreachability in Linux sandbox)`**. Checked-in schema facts and prior published IPC host-capture records are separated explicitly and are **never** presented as live SQLite table observations.

### 3.1 Database identity and file metadata

| Field | Value in this execution (`2026-11-16`) |
|---|---|
| Designated Windows database path | `C:\iips-data\iips\user-portfolio.sqlite` (`IIPS_G3_DATABASE_PATH`) |
| Live database reachable in Linux sandbox | **NO** (`existsSync === false`; `IIPS_G3_DATABASE_PATH` unset; `0` SQLite files on sandbox filesystem) |
| Live file byte size | `NOT OBTAINED` |
| Live file `mtime` (UTC) | `NOT OBTAINED` |
| Sidecar files (`-wal`, `-shm`, `-journal`) | `NOT OBTAINED` |
| SQLite header / page size / journal mode / encoding | `NOT OBTAINED` |
| Pre-inspection / post-inspection file SHA-256 | `NOT OBTAINED` |

### 3.2 Existing portfolio and ownership record counts

| Table | Origin in repository | Live row count (`2026-11-16`) | Notes |
|---|---|---|---|
| `_migration_ledger` | `src/persistence/migration_ledger.ts` | `NOT OBTAINED` | Expected `4` rows if only Direct P1 (`001`–`004`) ran, or `6` rows if `entrypoint.ts` (`001`–`006`) ran on the host. |
| `local_principal_bindings` | Migration `003` | `NOT OBTAINED` | Expected S1 binding `c5808abaffd072d6401ce63ad86c6ac0` (`ramki-personal-local`) if Direct P1 provisioned; actual ACTIVE/REVOKED counts unverified here. |
| `local_principal_memberships` | Migration `003` | `NOT OBTAINED` | Expected S1 membership `d25dcc5370100b00766efc5166f65cf3` (`ipd-personal-local` / `ipd-owner-ramki-personal`) if Direct P1 provisioned; actual counts/values unverified here. |
| `portfolios` | Migration `001` | `NOT OBTAINED` | Partitioned by `(canonical_owner_id, tenant_id, status)` in query `Q06`. |
| `portfolio_revisions` | Migrations `001` / `006` | `NOT OBTAINED` | Partitioned by `(canonical_owner_id, portfolio_id, operation)` in query `Q07`. |
| `portfolio_holdings` | Migrations `001` / `005` / `006` | `NOT OBTAINED` | Partitioned by revision, `active`, `source_broker`, `identity_status`, `resolution_disposition`, and `security_identity IS NULL` in query `Q08`. |
| `portfolio_contributions` | Migrations `001` / `004` | `NOT OBTAINED` | Includes nullable provenance columns added by migration `004` (`Q09`). |
| `portfolio_restore_receipts` | Migration `006` | `NOT OBTAINED` | Present only if migration `006` has been applied on the host (`Q10`). |
| `audit_events` | Migration `002` | `NOT OBTAINED` | Append-only hash chain (`Q05`, `Q13`). |
| Candidate D02 tables (`portfolio_owner_registry`, `personal_identity_owner_relationships`, `portfolio_source_provider_catalog`, `portfolio_source_records`, `portfolio_holding_source_links`, `portfolio_contribution_source_links`) | Proposed in technical design §13 (unimplemented) | `NOT OBTAINED` (expected absent in `sqlite_master`) | Must be verified via `Q02` against `sqlite_master` on the live host store rather than assumed absent. |

**Separation from prior published IPC v1 capture:** [`IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md`](IIPS-W11-DEP1-CAPTURE-EVIDENCE-DISPOSITION-2026-11-13.md) recorded an operator-reported protocol v1 IPC read on `2026-11-13` returning `1` active portfolio at `revision = 1` with `64` holdings (`1` populated `securityIdentity`, `63` `null`). By contract, protocol v1 omits `canonical_owner_id`, `tenant_id`, binding/membership IDs, tombstoned portfolios, `_migration_ledger`, `portfolio_restore_receipts`, and `audit_events`, and reflects only that earlier instant. Accordingly, those IPC v1 counts are **not** reported as live SQLite D5/D16 counts.

### 3.3 Candidate historical portfolios

- **Live candidate historical portfolios:** **`NOT OBTAINED`** (host database unreachable).
- **Non-inferential identification rule (`Q06`–`Q07`):** When executed on the Windows host, candidate historical portfolios are enumerated strictly from stored `(canonical_owner_id, tenant_id, portfolio_id, status, current_revision, created_at, updated_at, deleted_at)` rows—specifically distinguishing:
  1. Rows keyed under the established S1 owner/tenant (`canonical_owner_id = 'ipd-owner-ramki-personal'`, `tenant_id = 'ipd-personal-local'`), both `ACTIVE` and `TOMBSTONED`;
  2. Any rows already keyed under the D02 target owner/tenant (`canonical_owner_id = 'owner-4dc756b3'`, `tenant_id = 'ipd-personal-local'`); and
  3. Any rows under any unexpected `canonical_owner_id` or `tenant_id` (which must remain unresolved/quarantined for PA review rather than assumed personal).

### 3.4 Duplicate identifiers and collisions

- **Live duplicate/collision results:** **`NOT OBTAINED`** (host database unreachable).
- **Exact collision checks specified (`Q11`):**
  1. **Destination `(canonical_owner_id, portfolio_id)` collision:** Whether any candidate historical `portfolio_id` under `ipd-owner-ramki-personal` (e.g., `DEFAULT_PORTFOLIO` or a broker-import portfolio ID) already exists in `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`, or `portfolio_restore_receipts` under `owner-4dc756b3`.
  2. **Single-ACTIVE identity collisions:** Whether more than one `ACTIVE` row exists in `local_principal_bindings` or `local_principal_memberships`, or whether duplicate `principal_label` / `(tenant_id, canonical_owner_id)` histories exist.
  3. **Within-revision symbol / holding-key duplicates:** Whether any `(canonical_owner_id, portfolio_id, revision, upper(symbol))` appears more than once in `portfolio_holdings`.
  4. **Restore-receipt idempotency / fingerprint collisions:** Whether any `portfolio_restore_receipts` rows exist whose owner-bound `request_fingerprint` or `(portfolio_id, idempotency_key)` / `(portfolio_id, restored_revision)` keys would collide or invalidate retry semantics under a future re-key.

### 3.5 Orphan and NULL relationship records

- **Live orphan and NULL-relationship results:** **`NOT OBTAINED`** (host database unreachable).
- **Exact checks specified (`Q03`, `Q04`, `Q08`, `Q09`, `Q12`):**
  1. **SQLite FK integrity (`PRAGMA foreign_key_check`):** Any child row violating declared foreign keys across `local_principal_memberships`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`, and `portfolio_restore_receipts`.
  2. **Logical parent/state orphans:** `ACTIVE` membership pointing to a `REVOKED` or missing binding; `portfolios` row whose `current_revision > 0` has no matching `(canonical_owner_id, portfolio_id, current_revision)` row in `portfolio_revisions` (or `ACTIVE` status whose current revision operation is `DELETE`, or `TOMBSTONED` status with `deleted_at IS NULL`); `portfolio_revisions.holdings_count` disagreeing with `COUNT(*)` in `portfolio_holdings`.
  3. **NULL provenance and identity columns:** Counts of `portfolio_contributions` rows with `NULL` in migration-004 columns (`file_name`, `source_broker`, `content_digest`, `lineage_digest`, `imported_at`, `contribution_semantics`), and `portfolio_holdings` rows with `NULL` in `identity_status`, `resolution_disposition`, or migration-005 `security_identity`.
  4. **Unprovisioned S1-to-D02 relationship state:** Confirmation of whether any S1-to-D02 relationship table or row exists in `sqlite_master` (none exists in checked-in migrations `001`–`006`).

### 3.6 Existing migration ledger contents

- **Live `_migration_ledger` rows:** **`NOT OBTAINED`** (host database unreachable).
- **Pinned repository migration set and verified SQL SHA-256 checksums** (computed read-only from checked-in `src/persistence/migrations/001..006` via `migrationChecksum` in `src/persistence/migration_ledger.ts` on `2026-11-16T12:55:24.779Z`):

| Order | `migration_id` | Expected SQL SHA-256 (`_migration_ledger.checksum`) | Included in `directP1Provisioning.ts`? | Included in `entrypoint.ts`? |
|---|---|---|---|---|
| 1 | `001_initial_schema` | `08e712fd323f547413618f0443ec361015b136285c28b519d967f02b6d9580ab` | Yes | Yes |
| 2 | `002_audit_event_sequence` | `01892a862c8a877c97403a938123fb575cb43f9445d4c5345aa209f5adae47ed` | Yes | Yes |
| 3 | `003_local_principal_bindings` | `7967acc06584811df9cf37e05b84d78d6126b6dae979ee79e0523dfce924004e` | Yes | Yes |
| 4 | `004_portfolio_contribution_provenance` | `0dbf90c129154d8c547b6c5876157877c5e12790ebf2b35c741640751ea7b0ac` | Yes | Yes |
| 5 | `005_holding_security_identity` | `09fb8b68775a3c6cf799852a0c5c0146ea6971911097cb006a1782a9d415ec04` | **No** | Yes |
| 6 | `006_portfolio_restore` | `989a75518ca2fb4803a037e4e59df9053a2e10f38b42a40e67fa4bea01e3f342` | **No** | Yes |

When `Q01` runs on the Windows host, the live ledger must be compared against both the `4`-migration (`001`–`004`) and `6`-migration (`001`–`006`) prefixes without executing any pending migration.

### 3.7 Historical ownership and provenance evidence

- **Live historical ownership and provenance rows:** **`NOT OBTAINED`** (host database unreachable).
- **Non-inference rule enforced:** Historical ownership may **only** be evidenced by stored `portfolios.canonical_owner_id`, `portfolios.tenant_id`, `local_principal_bindings` / `local_principal_memberships` state, and chained `audit_events` records (`Q04`–`Q06`, `Q13`). Provenance fields—such as `portfolio_holdings.source_broker` (`dhan`, `manual-personal`, etc.), `company_id` (`MANUAL:<SYMBOL>` vs `EQ_<NAME>_IN`), `portfolio_contributions.source_broker`, `file_name` (redacted to presence/hash on publication if sensitive), `content_digest`, and `lineage_digest`—identify **source/import lineage only** and **never** establish or imply owner identity. Any row with `NULL`, mismatched, or non-S1 ownership/provenance must be documented as `UNKNOWN / AMBIGUOUS` without assigning inferred ownership.

### 3.8 Unresolved records and their reasons

| Unresolved evidence scope | Status | Exact reason |
|---|---|---|
| D5 live SQLite identity-mapping state (`local_principal_bindings`, `local_principal_memberships`, `audit_events` hash-chain verification, absence/presence of D02 relationship rows) | **UNRESOLVED / NOT OBTAINED** | Designated database `C:\iips-data\iips\user-portfolio.sqlite` resides on the Principal's local Windows host and does not exist in the Arena Linux sandbox (`IIPS_G3_DATABASE_PATH` unset; `0` SQLite files present). |
| D16 live portfolio, revision, holding, contribution, and restore-receipt counts and candidate historical portfolio list | **UNRESOLVED / NOT OBTAINED** | Same Windows host-access boundary (`B02`); prior protocol v1 IPC capture summary cannot substitute for SQLite owner/tenant/tombstone/receipt inspection. |
| D16 destination collision, orphan, FK, and `NULL` provenance/security-identity assessment | **UNRESOLVED / NOT OBTAINED** | Same Windows host-access boundary (`B02`); fabricating or assuming zero collisions/orphans without inspecting the live file is prohibited. |
| Live `_migration_ledger` state (`001`–`004` vs `001`–`006` or unexpected rows) | **UNRESOLVED / NOT OBTAINED** | Same Windows host-access boundary (`B02`); starting `entrypoint.ts` is prohibited and no live file is present here. |

### 3.9 Exact queries and inspection methods used (and prepared for Windows host execution)

#### A. Non-mutating sandbox preflight probe executed on 2026-11-16

Executed from `/home/user/iips-production-market-data` with zero files created or modified (`node --experimental-strip-types -e ...` reading checked-in migration definitions and probing `:memory:` plus `{ open: true, readOnly: true }` missing-file refusal):

```json
{
  "observedAtUtc": "2026-11-16T12:55:24.779Z",
  "platform": "linux",
  "arch": "x64",
  "nodeVersion": "22.22.3",
  "sqliteVersion": "3.51.3",
  "designatedWindowsDbPath": "C:\\iips-data\\iips\\user-portfolio.sqlite",
  "designatedWindowsDbPathExistsHere": false,
  "databasePathEnvSetting": "IIPS_G3_DATABASE_PATH",
  "databasePathEnvValue": null,
  "readOnlyMissingFileCheck": {
    "threw": true,
    "name": "Error",
    "code": "ERR_SQLITE_ERROR",
    "errcode": 14,
    "errstr": "unable to open database file",
    "message": "unable to open database file"
  }
}
```

#### B. Exact read-only SQL query set (`Q01`–`Q14`) for Windows host inspection

To be executed on the Principal's Windows host **only** after passing the offline pre-open checks in §2.3 (no running writer, zero `-wal`/`-shm`/`-journal` sidecars, regular file + 16-byte SQLite header verified, pre-open SHA-256 recorded), over `new DatabaseSync(dbPath, { open: true, readOnly: true })` with `PRAGMA query_only = ON; PRAGMA temp_store = MEMORY;` inside `BEGIN DEFERRED; ... ROLLBACK;`:

```sql
-- Q01: Existing migration ledger state (without creating or modifying _migration_ledger)
SELECT migration_id, checksum, applied_at
FROM _migration_ledger
ORDER BY migration_id ASC;

-- Q02: Complete schema object inventory (including check for any candidate D02 tables)
SELECT type, name, tbl_name, sql
FROM sqlite_master
WHERE name NOT LIKE 'sqlite_autoindex_%'
ORDER BY type ASC, name ASC;

-- Q03: Read-only SQLite integrity and foreign-key checks
PRAGMA integrity_check;
PRAGMA foreign_key_check;

-- Q04: D5 local principal bindings and memberships inventory
SELECT binding_id, principal_label, status, created_at, updated_at, revoked_at
FROM local_principal_bindings
ORDER BY binding_id ASC;

SELECT m.membership_id, m.binding_id, m.tenant_id, m.canonical_owner_id, m.status,
       m.created_at, m.updated_at, m.revoked_at,
       b.principal_label AS parent_principal_label, b.status AS parent_binding_status
FROM local_principal_memberships m
LEFT JOIN local_principal_bindings b ON b.binding_id = m.binding_id
ORDER BY m.membership_id ASC;

-- Q05: Audit-event count, bounds, and event-type breakdown (hash chain verified in memory via SHA-256)
SELECT COUNT(*) AS total_events, MIN(id) AS min_id, MAX(id) AS max_id
FROM audit_events;

SELECT event_type, subject_type, COUNT(*) AS row_count
FROM audit_events
GROUP BY event_type, subject_type
ORDER BY event_type ASC, subject_type ASC;

-- Q06: Existing portfolios and candidate historical portfolios by owner, tenant, and lifecycle status
SELECT canonical_owner_id, tenant_id, portfolio_id, portfolio_name,
       current_revision, status, created_at, updated_at, deleted_at,
       CASE
         WHEN canonical_owner_id = 'ipd-owner-ramki-personal' AND tenant_id = 'ipd-personal-local'
           THEN 'CANDIDATE_S1_HISTORICAL_PORTFOLIO'
         WHEN canonical_owner_id = 'owner-4dc756b3' AND tenant_id = 'ipd-personal-local'
           THEN 'EXISTING_D02_OWNER_PORTFOLIO'
         ELSE 'UNRESOLVED_OTHER_OWNER_OR_TENANT'
       END AS d16_classification
FROM portfolios
ORDER BY canonical_owner_id ASC, tenant_id ASC, portfolio_id ASC;

-- Q07: Portfolio revision counts, operations, holdings_count, and digests per portfolio
SELECT canonical_owner_id, portfolio_id, revision, operation,
       holdings_count, total_market_value, weight_sum_percentage,
       provenance_digest, content_digest, created_at
FROM portfolio_revisions
ORDER BY canonical_owner_id ASC, portfolio_id ASC, revision ASC;

-- Q08: Holdings summary by owner, portfolio, revision, source_broker, identity_status, resolution_disposition, and NULL security_identity
SELECT canonical_owner_id, portfolio_id, revision,
       source_broker, active, identity_status, resolution_disposition,
       CASE WHEN security_identity IS NULL THEN 'NULL' ELSE 'POPULATED' END AS security_identity_state,
       COUNT(*) AS holding_rows
FROM portfolio_holdings
GROUP BY canonical_owner_id, portfolio_id, revision,
         source_broker, active, identity_status, resolution_disposition, security_identity_state
ORDER BY canonical_owner_id ASC, portfolio_id ASC, revision ASC, source_broker ASC;

-- Q09: Contributions and NULL provenance column inventory (file_name not projected raw in public summaries)
SELECT canonical_owner_id, portfolio_id, contribution_id,
       contributed_at, created_at, source_broker, contribution_semantics,
       content_digest, lineage_digest, imported_at,
       CASE WHEN file_name IS NULL THEN 1 ELSE 0 END AS file_name_is_null,
       CASE WHEN source_broker IS NULL THEN 1 ELSE 0 END AS source_broker_is_null,
       CASE WHEN content_digest IS NULL THEN 1 ELSE 0 END AS content_digest_is_null,
       CASE WHEN lineage_digest IS NULL THEN 1 ELSE 0 END AS lineage_digest_is_null,
       CASE WHEN imported_at IS NULL THEN 1 ELSE 0 END AS imported_at_is_null,
       CASE WHEN contribution_semantics IS NULL THEN 1 ELSE 0 END AS semantics_is_null
FROM portfolio_contributions
ORDER BY canonical_owner_id ASC, portfolio_id ASC, created_at ASC, contribution_id ASC;

-- Q10: Portfolio restore receipts inventory (execute only if portfolio_restore_receipts exists in Q02)
SELECT canonical_owner_id, tenant_id, portfolio_id, idempotency_key,
       request_fingerprint, restored_revision, restored_at, is_saved
FROM portfolio_restore_receipts
ORDER BY canonical_owner_id ASC, portfolio_id ASC, restored_revision ASC;

-- Q11: D16 duplicate identifier and destination collision checks
-- (a) Portfolio ID collision between S1 owner ('ipd-owner-ramki-personal') and D02 owner ('owner-4dc756b3')
SELECT s1.portfolio_id,
       s1.tenant_id AS s1_tenant_id, s1.status AS s1_status, s1.current_revision AS s1_revision,
       d02.tenant_id AS d02_tenant_id, d02.status AS d02_status, d02.current_revision AS d02_revision
FROM portfolios s1
INNER JOIN portfolios d02
  ON d02.portfolio_id = s1.portfolio_id
WHERE s1.canonical_owner_id = 'ipd-owner-ramki-personal'
  AND d02.canonical_owner_id = 'owner-4dc756b3';

-- (b) Duplicate normalized symbol within one (owner, portfolio, revision)
SELECT canonical_owner_id, portfolio_id, revision, upper(trim(symbol)) AS norm_symbol, COUNT(*) AS dup_count
FROM portfolio_holdings
GROUP BY canonical_owner_id, portfolio_id, revision, upper(trim(symbol))
HAVING COUNT(*) > 1;

-- (c) Multiple ACTIVE bindings or memberships check
SELECT 'ACTIVE_BINDINGS' AS check_name, COUNT(*) AS active_count
FROM local_principal_bindings WHERE status = 'ACTIVE'
UNION ALL
SELECT 'ACTIVE_MEMBERSHIPS' AS check_name, COUNT(*) AS active_count
FROM local_principal_memberships WHERE status = 'ACTIVE';

-- Q12: Logical orphan and state-consistency checks
-- (a) ACTIVE membership attached to missing or non-ACTIVE binding
SELECT m.membership_id, m.binding_id, m.status AS membership_status, b.status AS binding_status
FROM local_principal_memberships m
LEFT JOIN local_principal_bindings b ON b.binding_id = m.binding_id
WHERE b.binding_id IS NULL OR (m.status = 'ACTIVE' AND b.status <> 'ACTIVE');

-- (b) Portfolio current_revision pointer missing in portfolio_revisions or status/operation mismatch
SELECT p.canonical_owner_id, p.portfolio_id, p.status, p.current_revision, p.deleted_at,
       r.revision AS matched_revision, r.operation AS current_operation
FROM portfolios p
LEFT JOIN portfolio_revisions r
  ON r.canonical_owner_id = p.canonical_owner_id
 AND r.portfolio_id = p.portfolio_id
 AND r.revision = p.current_revision
WHERE (p.current_revision > 0 AND r.revision IS NULL)
   OR (p.status = 'ACTIVE' AND r.operation = 'DELETE')
   OR (p.status = 'TOMBSTONED' AND (p.deleted_at IS NULL OR r.operation <> 'DELETE'));

-- (c) Revision holdings_count mismatch against actual portfolio_holdings rows
SELECT r.canonical_owner_id, r.portfolio_id, r.revision, r.operation,
       r.holdings_count AS declared_count, COUNT(h.holding_key) AS actual_count
FROM portfolio_revisions r
LEFT JOIN portfolio_holdings h
  ON h.canonical_owner_id = r.canonical_owner_id
 AND h.portfolio_id = r.portfolio_id
 AND h.revision = r.revision
GROUP BY r.canonical_owner_id, r.portfolio_id, r.revision, r.operation, r.holdings_count
HAVING r.holdings_count <> COUNT(h.holding_key);

-- Q13: Full audit_events read for in-memory SHA-256 hash-chain verification (mirroring verifyAuditChain in src/persistence/audit.ts without opening a write connection)
SELECT id, event_type, subject_type, subject_id, detail_json, prev_checksum, entry_checksum, created_at
FROM audit_events
ORDER BY id ASC;

-- Q14: Confirm connection remained strictly read-only throughout snapshot
PRAGMA query_only;
```

### 3.10 Evidence hashes and durable evidence locations

| Durable repository path | Role | SHA-256 |
|---|---|---|
| [`docs/integration/IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md) | Authoritative PA approval record (D01–D03 on 2026-11-15; narrow Level E read-only D5/D16 inventory on 2026-11-16) | `e8b3be245f7499dd17cb4faa95a87761f9383dfdc4f0a0f5515d1706295a3aa3` |
| [`docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md) | Authoritative D02 PA decision package (22 items; D01–D03 approved; narrow 2026-11-16 read-only inventory approved; D04–D22 pending) | `15939002fb1973739a81ce83ab32f96cf640124f019a33b06c7c73c7cdbe8960` |
| [`docs/integration/IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md`](IPD-STAGE5-D5-IDENTITY-MAPPING-TRACKER-2026-11-15.md) | Authoritative IPD Stage 5 D5 blocker and resolution tracker | `a2df840dc11662acd8e07c1fd434f7a1edad6b2a432f59a8c6577239cbc43084` |
| [`evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json`](../../evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json) | Machine-readable D5/D16 read-only preflight, pinned migration checksums, `NOT_OBTAINED` live-DB slots, and blocker record | `03f19477eac987ed11e2037eb4986c961868455193eb1ae8c61df97dd32b1735` |
| [`docs/integration/IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md`](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md) | This durable D5/D16 read-only evidence inventory & host-blocker report | Recorded in [`evidence/d02-inventory-2026-11-16/sha256s.txt`](../../evidence/d02-inventory-2026-11-16/sha256s.txt) |
| [`evidence/d02-inventory-2026-11-16/sha256s.txt`](../../evidence/d02-inventory-2026-11-16/sha256s.txt) | Complete SHA-256 manifest over all updated/created D02 approval, package, tracker, and evidence artifacts | Self-verifying via `sha256sum -c` |

---

## 4. Acceptance boundary and status summary (Section 6)

Neither the recording of the 2026-11-16 Program Authority approval nor any subsequent completion of the read-only inventory constitutes:

- **D5 acceptance** (`D5` remains **BLOCKED**).
- **Detailed schema approval** (Level C remains **PENDING / AWAITING APPROVAL**; `D04`–`D20` remain **PENDING**).
- **Implementation authorization** (`D21` / Level D remains **NOT GRANTED**; zero runtime, migration, or verifier code was added or changed).
- **Provisioning or migration authorization** (all mutating Level E operations under `D22` and `D15`–`D19` remain **NOT AUTHORIZED**).
- **D6 authorization** (`D6` remains **NOT STARTED**).

Once the Principal executes the read-only SQL query set (`Q01`–`Q14`) against `C:\iips-data\iips\user-portfolio.sqlite` on the local Windows host under the §2.3 read-only safeguards and records pre/post file SHA-256 equality, the resulting sanitized D5/D16 evidence must be presented for separate Program Authority review and disposition.
