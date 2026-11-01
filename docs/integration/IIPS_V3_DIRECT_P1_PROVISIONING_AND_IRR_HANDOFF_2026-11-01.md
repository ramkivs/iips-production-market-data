# IPD Direct P1 Provisioning — IRR Integration Contract & Handoff Record

- **Authoritative Provider Repository:** `ramkivs/iips-production-market-data` (`main`)
- **Downstream Consumer Repository:** `ramkivs/iips-review-recovered` (separate session; not modified by IPD)
- **Governing Program Authority Order:** `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01`
- **Date:** `2026-11-01`

---

## 1. Governance Transition & Ownership Boundary

1. **Discontinued P1-F Prerequisites:** Under `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01`, the P1-F ceremonial governance, certification, single-attempt claim/execution markers (`execute-claim.json`), confirmation tokens, retry-history reconciliation verifiers, S2 historical commit/tree pins (`a891802e...` / `76f083d7...`), standalone Preflight workflows, and `H:\IIPS-P1-EVIDENCE` root requirements are **discontinued as prerequisites** for local P1 SQLite provisioning.
2. **Historical Record Preservation:** All prior CAP-02/CAP-03 governance records remain intact and unedited as historical records.
3. **Clear Ownership Split:**
   - **IPD (`ramkivs/iips-production-market-data`) owns:**
     - Local SQLite user-portfolio schema and ordered migrations (`001`–`004`).
     - Direct local P1 database provisioning and verification (`src/persistence/directP1Provisioning.ts`, `scripts/Invoke-DirectP1Provisioning.ps1`).
     - Local principal binding, membership, and hash-chained `audit_events` resolution (`src/persistence/{binding,audit,portfolio_store}.ts`).
     - Same-host G2/G3 IPC provider server (`src/ipc/{entrypoint,endpoint,protocol,dispatch}.ts`).
     - Public npm package subpaths (`./portfolio-ui`, `./pit`, `./d114-non-production`, `./operator-drop`).
   - **IRR (`ramkivs/iips-review-recovered`) consumes:**
     - Same-host IPC wire protocol v1 over Windows named pipe `\\.\pipe\iips-user-portfolio-v1` (or POSIX Unix domain socket in non-Windows tests).
     - IPD public npm package subpaths declared in `package.json#exports`.
     - IRR **does not** open `C:\iips-data\iips\user-portfolio.sqlite` directly and **does not** need to orchestrate P1-F ceremonial provisioning to use IPD's runtime IPC server.

---

## 2. Provisioned Database Contract (`C:\iips-data\iips\user-portfolio.sqlite`)

| Property | Value |
|---|---|
| Designated Windows SQLite Path (`IIPS_G3_DATABASE_PATH`) | `C:\iips-data\iips\user-portfolio.sqlite` |
| SQLite Engine | Node.js built-in `node:sqlite` (`DatabaseSync`, Node `>= 22.13.0`) |
| Connection Pragmas | `PRAGMA foreign_keys = ON`, `journal_mode = DELETE`, `synchronous = FULL` |
| Applied Migrations (`_migration_ledger`, `WITHOUT ROWID`) | `001_initial_schema`, `002_audit_event_sequence`, `003_local_principal_bindings`, `004_portfolio_contribution_provenance` |
| `principal_label` | `ramki-personal-local` |
| `binding_id` | `c5808abaffd072d6401ce63ad86c6ac0` (`ACTIVE`, `revoked_at = NULL`) |
| `tenant_id` | `ipd-personal-local` |
| `canonical_owner_id` | `ipd-owner-ramki-personal` |
| `membership_id` | `d25dcc5370100b00766efc5166f65cf3` (`ACTIVE`, `revoked_at = NULL`) |
| Genesis `audit_events` Row (`id = 1`) | `event_type = 'local_principal_binding.provisioned'`, `subject_type = 'local_principal_binding'`, `subject_id = 'ramki-personal-local'`, `prev_checksum = '0000...0000'` (64 zeros) |
| Gate E W-1 `Port.save` Write Guard | Enforced (`evaluatePortSaveGuard().authorized === false`; IPC write operations return `WRITE_NOT_AUTHORIZED`) |

---

## 3. IPD-to-IRR Runtime IPC Contract (Unchanged & Ready for Direct Use)

Once `C:\iips-data\iips\user-portfolio.sqlite` is provisioned locally via `scripts/Invoke-DirectP1Provisioning.ps1`, IPD's G3 IPC provider (`startIpcServer` in `src/ipc/entrypoint.ts`) and IRR's consumer (`frontend/server/user-portfolio/{ipcClient,ipcPortAdapter,ownerContextFromBinding}.ts`) interoperate directly over the existing G2/G3 + DR-2 contract:

### 3.1 Environment Settings

| Side | Environment Variable | Designated Windows Value | Notes |
|---|---|---|---|
| IPD Provider | `IIPS_G3_DATABASE_PATH` | `C:\iips-data\iips\user-portfolio.sqlite` | Must be an absolute path to the provisioned SQLite store. |
| IPD Provider & IRR Consumer | `IIPS_G2_IPC_ENDPOINT` | `\\.\pipe\iips-user-portfolio-v1` | PF-15 Option A explicit Windows named pipe (or bare pipe name `iips-user-portfolio-v1`). `IIPS_G3_LOCAL_STATE_DIR` is unused on `win32`. |
| IRR Consumer | `IIPS_G3_IPC_BINDING_PROVISIONED` | `true` | IRR local consumer precondition flag (`ownerContextFromBinding.ts`). |
| IRR Consumer *(optional)* | `IIPS_G2_IPC_TENANT_HINT` | `ipd-personal-local` | Optional local hint in IRR; **never** transmitted on the IPC wire. |

### 3.2 Framing & Transport Semantics (`src/ipc/protocol.ts`)

- **Frame Format:** `uint32` big-endian byte length prefix (`4` bytes) + UTF-8 JSON body.
- **Size Caps:** Request max `65,536` bytes (`64 KiB`); response max `262,144` bytes (`256 KiB`).
- **One Request Per Connection:** Strictly one request frame and at most one response frame per IPC connection.
  - On POSIX Unix sockets (`half-close-required`), the client half-closes (`socket.end(frame)`) after sending its single frame.
  - On Windows named pipes (`flush-guard`), IPD responds immediately while guarding against pipelined bytes.
- **Request Envelope Keys (Closed Set):** `{ v: 1, op, payload, requestId }` — **never** include caller-supplied authority/identity keys (`canonicalOwnerId`, `tenantId`, `userId`, `ownerId`, etc.), which trigger Class P `CALLER_SUPPLIED_AUTHORITY` zero-byte refusal.
- **Response Envelope Keys:** `{ v: 1, ok: boolean, op, requestId, result?, outcome?, detail? }`.

### 3.3 Operations & DR-2 Option A Read Shapes

| Operation (`op`) | Category | Request `payload` | Response (`ok: true` `result` or `ok: false` `outcome`) |
|---|---|---|---|
| `portfolio.list` | Read | `{}` | `PortfolioSummary[]` — exact 7 fields per item: `portfolioId`, `portfolioName`, `currentRevision`, `status`, `createdAt`, `updatedAt`, `deletedAt` (`canonicalOwnerId` and `tenantId` are intentionally omitted per DR-2 Option A). |
| `portfolio.get` | Read | `{ portfolioId: string }` | `PortfolioRecord \| null` — 7 summary fields plus `holdings: PortfolioHoldingRecord[]` and `contributions: PortfolioContributionRecord[]`. |
| `portfolio.revisions` | Read | `{ portfolioId: string }` | `PortfolioRevisionSummary[]` — `portfolioId`, `revision`, `operation`, `totalMarketValue`, `weightSumPercentage`, `holdingsCount`, `provenanceDigest`, `contentDigest`, `createdAt`. |
| `portfolio.create` / `portfolio.save` / `portfolio.reset` / `portfolio.delete` | Write | Operation payload | Refused fail-closed with `{ ok: false, outcome: 'WRITE_NOT_AUTHORIZED' }` while Gate E W-1 write guard remains in effect. |

---

## 4. Public npm Package Surface (`iips-production-market-data`)

IPD's public `package.json#exports` contract remains **100% unchanged** across all four subpaths consumed by IRR:

1. `iips-production-market-data/portfolio-ui`
2. `iips-production-market-data/pit`
3. `iips-production-market-data/d114-non-production`
4. `iips-production-market-data/operator-drop`

`src/persistence/directP1Provisioning.ts` is an internal/CLI IPD persistence module (`dist/src/persistence/directP1Provisioning.js`) and is intentionally excluded from `dist/package/` and browser bundles so zero `node:sqlite` or filesystem code leaks into client bundles.

---

## 5. Recommended Next Steps for the Separate IRR Session

When updating `ramkivs/iips-review-recovered` in a dedicated IRR session:

1. **Retire P1-F Ceremonial Prerequisite Gating in IRR:** IRR no longer needs `Invoke-Cap03P1Preflight.ps1`, `Invoke-Cap03P1Execute.ps1`, `execute-claim.json`, confirmation tokens, `H:\IIPS-P1-EVIDENCE` retry-chain verifiers, S04 dist-recovery archives, or historical IPD S2 commit/tree pins (`a891802e...`) as prerequisites for local P1 database readiness. Preserve historical IRR governance docs as archival records without falsifying prior history.
2. **Use Direct Provisioned Store Readiness:** Once the operator has provisioned `C:\iips-data\iips\user-portfolio.sqlite` from IPD (`scripts/Invoke-DirectP1Provisioning.ps1`), IRR only needs:
   - IPD's G3 IPC server running against `IIPS_G3_DATABASE_PATH=C:\iips-data\iips\user-portfolio.sqlite` and `IIPS_G2_IPC_ENDPOINT=\\.\pipe\iips-user-portfolio-v1`, and
   - IRR configured with `IIPS_G2_IPC_ENDPOINT=\\.\pipe\iips-user-portfolio-v1` and `IIPS_G3_IPC_BINDING_PROVISIONED=true`.
3. **Optional Dependency Pin Update:** IRR's `frontend/package.json` dependency on `ramkivs/iips-production-market-data` may either remain at its current public-package pin (since `exports` are unchanged) or advance to the merged IPD `main` commit from this implementation pass so both repositories reference a single current `main` baseline.
