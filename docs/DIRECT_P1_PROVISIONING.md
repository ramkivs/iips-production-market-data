# Direct P1 Local User-Portfolio Provisioning (IPD)

- **Repository:** `ramkivs/iips-production-market-data` (`main` authoritative)
- **Authority:** `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01`
- **Effective Date:** `2026-11-01`
- **Designated Windows Database Path:** `C:\iips-data\iips\user-portfolio.sqlite`

---

## 1. Purpose & Governance Transition

Under Program Authority order `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01`, the ceremonial **P1-F governance, certification, single-attempt claim/marker, retry-reconciliation, S2 historical commit/tree pin, and standalone preflight workflows** are **discontinued as prerequisites** for initializing the local single-user portfolio database on the personal Windows installation.

Historical records, prior Program Authority acts, and legacy modules (`src/persistence/provisioning.ts`, `src/persistence/gateAPrimeProvisioning.ts`, `src/persistence/gateAPrimeValidation.ts`, and `evidence/cross-repository/*`) are **preserved verbatim** as historical audit artifacts and are neither rewritten nor falsified.

For actual local database initialization and verification, IPD provides a straightforward, self-contained direct provisioning implementation:

1. **Core TypeScript Module & CLI Entrypoint:** `src/persistence/directP1Provisioning.ts` (compiled to `dist/src/persistence/directP1Provisioning.js`)
2. **Windows PowerShell 5.1 Execution Script:** `scripts/Invoke-DirectP1Provisioning.ps1`
3. **Automated Test Suite:** `tests/direct_p1_provisioning.test.ts`

---

## 2. Reused IPD Persistence Primitives

`src/persistence/directP1Provisioning.ts` reuses IPD's existing, production-tested SQLite persistence primitives without duplicating schema definitions or weakening database safeguards:

| Existing IPD Module | Reused Primitive(s) | Role in Direct P1 Provisioning |
|---|---|---|
| `src/persistence/connection.ts` | `assertSupportedRuntime`, `openDatabase`, `closeDatabase`, `MINIMUM_NODE_*` | Enforces Node.js `>= 22.13.0` (flag-free `node:sqlite`), opens SQLite with `PRAGMA foreign_keys = ON`, `journal_mode = DELETE`, `synchronous = FULL`. |
| `src/persistence/migration_ledger.ts` | `ensureMigrations`, `migrationChecksum`, `MigrationIntegrityError` | Applies each pending migration together with its SHA-256 ledger entry inside an atomic `BEGIN IMMEDIATE ... COMMIT` transaction. |
| `src/persistence/migrations/001..004` | `001_initial_schema`, `002_audit_event_sequence`, `003_local_principal_bindings`, `004_portfolio_contribution_provenance` | Authoritative 4-migration user-portfolio, audit-chain, local-binding, and broker-import provenance DDL. |
| `src/persistence/gateAPrimeValidation.ts` | `GATE3_MIGRATIONS`, `PRINCIPAL_LABEL`, `TENANT_ID`, `CANONICAL_OWNER_ID`, `bindingIdFor`, `membershipIdFor` | Supplies the ordered migration list and PA-determined S1 identity constants (`IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`). |
| `src/persistence/audit.ts` | `AUDIT_GENESIS`, `appendAuditEvent`, `readAuditEvents`, `verifyAuditChain` | Writes the genesis provisioning audit event and verifies the local SHA-256 hash chain. |
| `src/persistence/binding.ts` | `resolveActiveBindingInCurrentTransaction` | Verifies transactional resolution of the single `ACTIVE` local principal binding and membership. |
| `src/persistence/portfolio_store.ts` | `evaluatePortSaveGuard` | Confirms the Gate E W-1 `Port.save` write guard remains active (`authorized === false`). |

---

## 3. Initialized Schema & Provisioning Records

### 3.1 Ordered Migrations (`_migration_ledger`)

1. `001_initial_schema` — Creates `portfolios`, `portfolio_revisions`, `portfolio_holdings`, `portfolio_contributions`, plus `idx_portfolios_owner` and `idx_portfolio_holdings_symbol`.
2. `002_audit_event_sequence` — Creates append-only `audit_events` (`INTEGER PRIMARY KEY AUTOINCREMENT`) plus `idx_audit_events_subject` and `idx_audit_events_entry_checksum`.
3. `003_local_principal_bindings` — Creates `local_principal_bindings` and `local_principal_memberships` plus single-`ACTIVE` partial unique indexes (`idx_local_principal_bindings_single_active`, `idx_local_principal_memberships_single_active`) and `idx_local_principal_memberships_binding`.
4. `004_portfolio_contribution_provenance` — Adds additive broker-import provenance columns (`file_name`, `source_broker`, `content_digest`, `lineage_digest`, `imported_at`, `contribution_semantics` with `CHECK` constraint) to `portfolio_contributions`.

### 3.2 Initial Provisioning Records (Single Atomic Transaction)

| Table | Primary Key | Key Columns & Values |
|---|---|---|
| `local_principal_bindings` | `binding_id = 'c5808abaffd072d6401ce63ad86c6ac0'` | `principal_label = 'ramki-personal-local'`, `status = 'ACTIVE'`, `revoked_at = NULL` |
| `local_principal_memberships` | `membership_id = 'd25dcc5370100b00766efc5166f65cf3'` | `binding_id = 'c5808abaffd072d6401ce63ad86c6ac0'`, `tenant_id = 'ipd-personal-local'`, `canonical_owner_id = 'ipd-owner-ramki-personal'`, `status = 'ACTIVE'`, `revoked_at = NULL` |
| `audit_events` | `id = 1` | `event_type = 'local_principal_binding.provisioned'`, `subject_type = 'local_principal_binding'`, `subject_id = 'ramki-personal-local'`, `prev_checksum = '0000...0000'` (64 zeros), `detail_json = '{"tenantId":"ipd-personal-local","canonicalOwnerId":"ipd-owner-ramki-personal"}'` |

---

## 4. Existing-Database Protection & Safe Repeat Invocation

Direct P1 provisioning **never overwrites, unlinks, truncates, or replaces an existing database file**:

1. **Fresh Destination (`storeExistedBefore === false`):**
   - Validates runtime, `node:sqlite`, migrations, and destination path (drive-absolute on Windows, outside all Git worktrees, free of symlinks/reparse points, writable parent directory).
   - Creates `C:\iips-data\iips` if absent, initializes the SQLite database, applies migrations `001`–`004` in order, commits initial binding/membership/audit records in one `BEGIN IMMEDIATE ... COMMIT` transaction, closes the write connection, and runs full read-only verification (`DP-V1`..`DP-V9`).
   - If an unexpected fault occurs mid-transaction on a newly created file, rolls back the transaction and removes the incomplete newly created file so no broken database lingers.
   - Returns `ok: true`, `status: 'PROVISIONED'`, `mutated: true`.
2. **Repeat Invocation on Valid Provisioned Store (`storeExistedBefore === true`, `--require-fresh` not set):**
   - Opens the existing file strictly `{ readOnly: true }` (never opens a write handle).
   - Verifies migration ledger, schema, indexes, constraints, `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, initial binding/membership records, and `audit_events` hash chain — **including when user portfolio rows already exist in `portfolios`, `portfolio_revisions`, `portfolio_holdings`, and `portfolio_contributions`**.
   - Asserts byte-for-byte SHA-256 equality before and after read-only inspection.
   - Returns `ok: true`, `status: 'ALREADY_PROVISIONED'`, `mutated: false`.
3. **Existing Non-SQLite, Empty, Foreign, Corrupt, Tampered, or Mismatched File (or `--require-fresh`):**
   - Fails closed with `errorCode: 'EXISTING_DATABASE_PROTECTED'`, `mutated: false`, exit code `1`, leaving the existing file byte-for-byte untouched.

---

## 5. CLI & Windows PowerShell 5.1 Usage

### 5.1 Node CLI (`dist/src/persistence/directP1Provisioning.js`)

```text
node dist/src/persistence/directP1Provisioning.js [--mode=provision|verify] [--store=<absolute-path>] [--require-fresh] [--pretty]
```

- On Windows (`win32`), `--store` defaults to `C:\iips-data\iips\user-portfolio.sqlite`.
- Machine-readable JSON diagnostics are always emitted to `stdout`; process exit code is `0` on `ok: true` and `1` on `ok: false`.

### 5.2 Windows PowerShell 5.1 Script (`scripts/Invoke-DirectP1Provisioning.ps1`)

```powershell
& "<IPD_REPO_ROOT>\scripts\Invoke-DirectP1Provisioning.ps1" -ExpectedCommit "<40_HEX_MERGED_COMMIT>"
```

Script parameters:

- `-ExpectedCommit` *(Mandatory, 40-char lowercase hex SHA-1)*: Verifies the local IPD checkout `HEAD` matches the exact merged IPD commit before any mutation.
- `-RepositoryRoot` *(Optional)*: Defaults to parent of `scripts\` (`Split-Path -Parent $PSScriptRoot`). Never clones repositories.
- `-DatabasePath` *(Optional)*: Defaults to `C:\iips-data\iips\user-portfolio.sqlite`.
- `-NodeExecutable` *(Optional)*: Auto-discovers `C:\Node22\node-v22.16.0-win-x64\node.exe` when present, falling back to `node.exe` on `PATH` (`>= 22.13.0`).
- `-DiagnosticRoot` *(Optional)*: Defaults to `%TEMP%\iips-direct-p1-provisioning`; writes `provisioning.log`, child stdout/stderr captures, and `diagnostic-summary.json` (BOM-free UTF-8).
- `-RequireFreshDatabase` *(Optional switch)*: Refuses if `-DatabasePath` already exists even when validly provisioned.


---

## 6. Starting the IPD IPC Provider on Windows (Post-Provisioning)

Provisioning creates the database; it does **not** start a server. The same-host G3 IPC provider
is a separate compiled entrypoint and is launched by the operator as a foreground process.

### 6.1 Exact Supported Command

```powershell
$env:IIPS_G3_DATABASE_PATH = 'C:\iips-data\iips\user-portfolio.sqlite'
$env:IIPS_G2_IPC_ENDPOINT  = '\\.\pipe\iips-user-portfolio-v1'

& 'C:\Node22\node-v22.16.0-win-x64\node.exe' '<IPD_REPO_ROOT>\dist\src\ipc\entrypoint.js'
```

Substitute `<IPD_REPO_ROOT>` with the absolute path of the local IPD checkout. If Node is on
`PATH` at `>= 22.13.0`, the bare form is equivalent:

```powershell
node "<IPD_REPO_ROOT>\dist\src\ipc\entrypoint.js"
```

### 6.2 Prerequisites

| # | Prerequisite | Verified by |
|---|---|---|
| 1 | Node.js **>= 22.13.0** (flag-free `node:sqlite`). The provisioning script prefers `C:\Node22\node-v22.16.0-win-x64\node.exe` and falls back to `node.exe` on `PATH`. | `assertSupportedRuntime` in `src/persistence/connection.ts` (`MINIMUM_NODE_MAJOR/MINOR/PATCH = 22/13/0`) |
| 2 | `npm ci` inside the IPD checkout (the build needs `node_modules\typescript`). | `scripts/Invoke-DirectP1Provisioning.ps1` throws `TYPESCRIPT_DEPENDENCY_MISSING` otherwise |
| 3 | The compiled entrypoint `dist\src\ipc\entrypoint.js` exists. Run **`npm run build:tsc`** to emit it. | `tsconfig.json` `include` covers `src/**/*`; `build:tsc` is plain `tsc` |
| 4 | The database is already provisioned at `IIPS_G3_DATABASE_PATH`. | Startup phase `verify` re-verifies the `audit_events` hash chain and refuses if it does not verify |
| 5 | `IIPS_G3_DATABASE_PATH` is set and **absolute**. | Startup phase `validate`; otherwise `IIPS_G3_DATABASE_PATH must be set to an absolute path` |
| 6 | `IIPS_G2_IPC_ENDPOINT` is set to the **absolute** named-pipe form `\\.\pipe\<name>`. | `resolveEndpointTarget`; a bare name additionally requires an absolute `IIPS_G3_LOCAL_STATE_DIR` |

Prerequisite 3 is normally already satisfied: `Invoke-DirectP1Provisioning.ps1` step
`05-ensure-compiled-entrypoint` runs `tsc -p tsconfig.json` when the compiled CLI is absent, and
that same compilation emits `dist\src\ipc\entrypoint.js`.

### 6.3 Two Operator-Relevant Facts

1. **The provider is not published to npm.** `package.json#files` is `["dist/package"]`, and
   `dist/package/` contains only the public package boundaries — it has **no** `ipc/` directory.
   The provider must therefore be launched from a **local IPD checkout** built with
   `npm run build:tsc`; installing `iips-production-market-data` from npm will not supply it.
2. **The owner-only `0700` state-directory rule is POSIX-only.** It applies to AF_UNIX sockets and
   is never invoked for a Windows named pipe, whose namespace is kernel-managed. Windows operators
   do not need to create or chmod a state directory when using the absolute `\\.\pipe\...` form.

### 6.4 Startup Order, Diagnostics and Exit Codes

Startup order is fixed: **validate → connect → migrate → verify → bind**. There is no fallback,
retry or downgrade; any fault returns a phase-coded outcome and creates no endpoint.

- All diagnostics are written to **stderr**, never stdout.
- Success prints `[g3] listening on windows-named-pipe \\.\pipe\iips-user-portfolio-v1` and the
  process stays in the foreground serving one request per connection.
- Refusal prints `[g3] startup refused at phase <phase>: <error>` and exits with code **1**.
- A second provider on the same pipe fails at phase `bind` with
  `the endpoint is already occupied: <path>`.

### 6.5 What the Provider Does and Does Not Authorize

The provider serves the three v1 read operations (`portfolio.list`, `portfolio.get`,
`portfolio.revisions`) and refuses all four write operations with `WRITE_NOT_AUTHORIZED` before
any store mutation, because Gate E W-1(3) and W-1(4) remain false. **Starting the provider does
not authorize a durable portfolio write**, does not change Gate 4 or Gate 5 status, and does not
constitute production activation.
