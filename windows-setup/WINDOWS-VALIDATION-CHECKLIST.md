# IIPS — Windows Setup & Functional Validation Checklist

**Prepared:** 2026-11-05 · **Scope:** personal, local, single-user workstation (PA/PO: Ramki)
**IRR:** `ramkivs/iips-review-recovered` @ `9e0a0415b76571fc4db1747b2da63c73fa0447d3`
**IPD:** `ramkivs/iips-production-market-data` @ `b605a61458a655bb555c6f340332fcf77a85c870`

Every command, path, port, environment variable and expected response in this document was read
from the repositories or executed against them. Nothing here is inferred from documentation alone.

---

## 0. What was inspected to produce this

| Fact | Source (verified) |
|---|---|
| IRR frontend package manager + lockfile | `frontend/package-lock.json`, `lockfileVersion: 3` → **npm ci** |
| IRR has **no** root `package.json` | repository root listing |
| IRR platform lib | `iips-platform/package.json` — `private`, `type: commonjs`, devDeps only (`tsx`, `typescript`) |
| IRR transport port / bind | `server/executive-transport.ts:558` `EXEC_TRANSPORT_PORT ?? 8787`; `:718` `EXEC_TRANSPORT_BIND_HOST = '127.0.0.1'`; `:1012` `server.listen` |
| IRR vite dev port + proxy | `frontend/vite.config.ts` — port **5176** (5173 belongs to ArthaVault), proxy `/api` → `http://localhost:8787` |
| Required pre-build artifact | `frontend/package.json` `predev`/`prebuild`/`pretest` → `build:broker-import`; `tsconfig.broker-import.json` `outDir: .cache/broker-import` |
| IPD build chain | `package.json` `build` = `tsc && vite build && build:portfolio-ui-package && build:pit-package` |
| IPD vite outDir | `vite.config.ts` — `dist-frontend`, Vite default port 5173 → **overridden to 5174** (see §3) |
| Node floor | `src/persistence/connection.ts` `MINIMUM_NODE_*` = **22.13.0** (flag-free `node:sqlite`) |
| **No Python runtime** | 0 `requirements*.txt` / `pyproject.toml` / `setup.py` in either repo → **no venv required** (see §2) |
| IPD consumed as a library | IRR imports `iips-production-market-data/{portfolio-ui,pit,d114-non-production}` and `iips-np04-governed-persistence/persistence` — **not** over IPC |

---

## 1. Windows functionality checklist

Legend — **MUST** = required for "delivered functionality works"; **CONDITIONAL** = works only when its
named prerequisite is provisioned; the application fails **closed and honestly** without it.

### 1.0 Node.js toolchain handling — MUST (non-negotiable)

Windows cannot reliably run a `.cmd` shim through PowerShell command resolution. **No script invokes
a bare `npm` or `npx`.** `Iips-Common.ps1` resolves all three binaries from one installation and
every call uses an explicit absolute path with the call operator.

| # | Validation | How | Expected |
|---|---|---|---|
| N-1 | No bare `npm` / `npx` anywhere | `00-Validate-PowerShell-Syntax.ps1` | `explicit-node-path` violations = **0** |
| N-2 | One installation | `Resolve-IipsNodeToolchain` | `node.exe`, `npm.cmd`, `npx.cmd` all in the same directory |
| N-3 | Call operator + absolute path | code review / AST rule | `& $toolchain.NpmCmd ...`, `& $toolchain.NpxCmd ...` |
| N-4 | Version floor | `node --version` | **>= 22.13.0** (`MINIMUM_NODE_MAJOR/MINOR/PATCH`) |
| N-5 | Anti-mixing proof | `npm.cmd exec -- node -e process.execPath` | equals the resolved `node.exe`; mismatch **throws** |
| N-6 | Child-process PATH | resolved dir prepended | shims' internal `node` lookup cannot find another install |

If N-5 fails, setup stops with `Node.js installation mixing detected`. Do not work around it.

### 1.1 Backend startup & health — MUST

| # | Validation | How | Expected |
|---|---|---|---|
| B-1 | Transport binds loopback only | `netstat -ano \| findstr :8787` | `127.0.0.1:8787`, never `0.0.0.0` |
| B-2 | Startup banner | log file | `Executive transport listening on 127.0.0.1:8787` |
| B-3 | Health endpoint | `GET /api/health` | `200` `{"status":"ok","transport":"program-v3.0 executive (dev)"}` (58 B, verified) |
| B-4 | No unhandled startup error | log file | no stack trace before the banner |

### 1.2 Frontend startup & backend connectivity — MUST

| # | Validation | How | Expected |
|---|---|---|---|
| F-1 | `predev` builds the broker-import artifact | install log | `.cache/broker-import` exists |
| F-2 | Vite binds loopback only | `netstat -ano \| findstr :5176` | `127.0.0.1:5176`, never `0.0.0.0` |
| F-3 | Binding is forced, not inherited | start script | `--host 127.0.0.1 --strictPort` passed explicitly; `vite.config.ts` says `0.0.0.0` |
| F-4 | Actual listener verified | `Get-NetTCPConnection -LocalPort 5176` | `LocalAddress` is `127.0.0.1`; any other address **fails hard** |
| F-5 | Vite serves | browser | `http://127.0.0.1:5176/` loads the shell |
| F-6 | Proxy reaches transport | DevTools Network | `/api/*` requests are same-origin, no CORS error |
| F-7 | Root redirect | navigate `/` | redirects to `/executive` (`App.tsx:39`) |
| F-8 | Optional IPD shell binds loopback | `netstat -ano \| findstr :5174` | `127.0.0.1:5174` when `-StartIpdShell` is used |

### 1.3 IPD-1 Windows IPC provider + named pipe — MUST

The IPD Gate-3 entrypoint is `src/ipc/entrypoint.ts`; it is a real CLI (`isMain()` matches
`entrypoint.js`). Phase order is fixed: **validate → connect → migrate → verify → bind**
(`entrypoint.ts:44`).

| # | Validation | How | Expected |
|---|---|---|---|
| I-1 | Refuses to start unconfigured | run with no env | `[g3] startup refused at phase validate: IIPS_G2_IPC_ENDPOINT is not set`, exit **1** |
| I-2 | Rejects a non-pipe endpoint on Windows | set a filesystem path | refusal at `validate`; Windows requires `\\.\pipe\` (`endpoint.ts:90-91`) |
| I-3 | Binds the named pipe | run configured | `[g3] listening on windows-named-pipe \\.\pipe\iips-user-portfolio-v1` |
| I-4 | Pipe visible to Windows | `[System.IO.Directory]::GetFiles('\\.\pipe\')` | the pipe name is listed |
| I-5 | No filesystem artifact | check the state dir | no socket/endpoint file (pipe namespace is kernel-managed, `endpoint.ts:156-165`) |
| I-6 | Clean shutdown removes the pipe | Ctrl-C / stop script | pipe name disappears |
| I-7 | Second instance refused | start a second | collision refusal (`FILE_FLAG_FIRST_PIPE_INSTANCE`) |
| I-8 | Migrations 001–004 already applied | DB inspect (read-only) | 4 ledger rows; `V-A2-1` requires exactly 4 |

> **Direct P1 provisioning was ALREADY COMPLETED SUCCESSFULLY on native Windows.** The database at
> `C:\iips-data\iips\user-portfolio.sqlite` is authoritative. These scripts **never** create,
> recreate, truncate, replace, migrate or re-provision it. Script 03 verifies the file exists and is
> non-empty and then uses it read-only; if it is missing, startup **stops** with an explicit message
> rather than provisioning anything.
>
> With `-StartIpdIpc`, the IPC provider starts at phase `migrate` against a schema that is already at
> the Gate-3 set, so no schema change is applied. I-8 above is a **read-only inspection**, not a
> provisioning step.
>
> The remaining IPD-1 validation is exactly I-3 through I-7: **IPC provider startup and named-pipe
> functionality**. Include `-StartIpdIpc` in the execution sequence to exercise it.

> `IIPS_G2_IPC_ENDPOINT` must be an **absolute named-pipe path**. `IIPS_G3_LOCAL_STATE_DIR` must be
> absolute. On POSIX hosts the same code refuses a pipe path — this is Windows-only by construction.

> **Reports is PARKED.** It requires a separately provisioned NP-04 governed database. Do **not**
> create an artificial database for it, and do **not** treat Reports as a mandatory functional check.
> Without the database it fails closed with HTTP 404 — the correct behaviour, validated in section 1.6.

### 1.4 Local persistence & durability — MUST

| # | Validation | How | Expected |
|---|---|---|---|
| P-1 | Journal created on first write | create a watchlist in the UI | `$IIPS_DATA_DIR\watchlists\journal.ndjson` (verified path pattern) |
| P-2 | Journal header | first line | `{"journalFormatVersion":…}` (`persistence-service.ts:41`) |
| P-3 | Default data dir when unset | — | `<cwd>\.iips-data` (`persistence-service.ts:109`) — **always set it explicitly** |
| P-4 | SQLite pragmas | open the DB | `foreign_keys=ON`, `journal_mode=DELETE`, `synchronous=FULL` |
| P-5 | Node floor enforced | run on older Node | `assertSupportedRuntime` refuses below 22.13.0 |

### 1.5 Restart & recovery — MUST

Verified working in-repo (writer exit 0 → `watchlists/journal.ndjson`, 3 lines → recoverer exit 0,
byte-identical payload):

| # | Validation | How | Expected |
|---|---|---|---|
| R-1 | Writer persists | `consumer-restart-writer.ts watchlists <tenant> <owner>` | exit 0, JSON on stdout |
| R-2 | Recoverer reads back | `consumer-restart-recoverer.ts watchlists <tenant> <owner>` | exit 0, same `watchlistId`/items |
| R-3 | Missing env fails closed | unset `IIPS_DATA_DIR` | `IIPS_DATA_DIR must be set to the data root under recovery`, exit 1 |
| R-4 | UI survives restart | create watchlist → stop → start | watchlist still listed |
| R-5 | Owner-context restart harness | `owner-context-restart-harness.ts` with `IIPS_RESTART_OP=write` then `read` | both exit 0 |

### 1.6 Authentication & personal application principal — MUST

There is **no login screen and no session gate** — `routes.ts` states "No session or identity gate is
part of route resolution". The principal is a governed **owner-context carrier**, materialised from
merged code, SHA-256-pinned, and it must live **outside any Git working tree**
(`owner-context-carrier.ts:110-124` throws otherwise).

| # | Validation | How | Expected |
|---|---|---|---|
| A-1 | Carrier materialises | `materialiseOwnerContextCarrier('<dir>')` — **takes a directory** | `<dir>\owner-context.json`, **363 bytes** (verified) |
| A-2 | Digest matches | `Get-FileHash -SHA256` | equals `OWNER_CONTEXT_CARRIER_SHA256` |
| A-3 | Principal values | file content | `ownerUserId = owner-7f3a91c2`, `tenantId = irr-domain-4b82d6e1` |
| A-4 | Carrier refused inside a repo | target a checkout dir | `OwnerContextCarrierLocationError` |
| A-5 | Fail-closed without carrier | unset the env, `GET /api/settings` | **503** `owner-context-unavailable` (verified) |
| A-6 | Carrier unlocks gated reads | set `IIPS_OWNER_CONTEXT_PATH` | `/api/settings`, `/api/watchlists`, `/api/collaboration` → **200** (verified 503→200) |
| A-7 | Reports principal | `materialiseReportsOwnerCarrier('<dir>')` | `reports-owner-context.json`, **384 bytes** (verified); `owner-irr-reports-personal` / `irr-reports-personal` |

### 1.6b Strict endpoint contract validation — MUST (`04-Validate-BackendEndpoints.ps1`)

A fail-closed response counts as **expected only when it is the specific documented response**. The
status **and** the body reason must both match, **and** the prerequisite must genuinely be absent.

| # | Endpoint | Expected | Only acceptable fail-closed | Always an error |
|---|---|---|---|---|
| E-1 | `/api/user-portfolios` | **200** + validated payload | **503** with body containing `owner-context-unavailable` | **HTTP 500**; a 503 with any other body; any other status |
| E-2 | `/api/reports` | **200** + validated payload | **404** with body exactly `{"error":"not found"}` | **HTTP 500**; a 404 with any other body; any other status |
| E-3 | `/api/settings`, `/api/watchlists`, `/api/collaboration` | **200** + `surfaceName` / `provenance` | 503 `owner-context-unavailable` **before** step 02 only | HTTP 500 |
| E-4 | `/api/health` | **200** + `"status":"ok"` | none | any non-200 |
| E-5 | `/api/screener` via GET | **405** | n/a — deliberate | any other status |

**Prerequisite reversal — the important half.** The script auto-detects prerequisites and *tightens*
the expectation when they are present:

| # | When | Then |
|---|---|---|
| E-6 | the named pipe `iips-user-portfolio-v1` exists (or `-IpdIpcExpected`) | `/api/user-portfolios` **must** be 200 with a validated payload. A 503 in this state is reported as **an error**, because the guard should not be tripping. |
| E-7 | the NP-04 database file exists (or `-ReportsExpected`) | `/api/reports` **must** be 200 with a validated payload. A 404 in this state is **an error**. |
| E-8 | neither is present | the strict fail-closed signature in E-1 / E-2 is accepted, and nothing else is |

| # | Validation | How | Expected |
|---|---|---|---|
| E-9 | Payload shape for Opportunities / Risks / Rankings | `GET /api/cross-sector` | `opportunity`, `ranking` and `portfolio.holdings` are **non-empty**; an empty array is warned about, because the screen will render no rows |
| E-10 | Proxied path the browser really uses | `GET http://127.0.0.1:5176/api/health` | 200 + `"status":"ok"` through the Vite proxy |
| E-11 | Verdict is machine-readable | run log / CSV | every probe reports `PASS`, `EXPECTED-FAIL-CLOSED` or `FAIL`; any `FAIL` exits **4** |

> **An API probe never substitutes for browser verification.** Section 1.7 is still manual.

### 1.7 Browser/UI functionality — MUST (manual, see §5)

### 1.8 Intelligence & research screens

| # | Screen | Route | Backing API | Verified status |
|---|---|---|---|---|
| S-1 | Company Intelligence | `/research/company/:id` | `GET /api/company/<id>` | **200** (973 B for `banking`) |
| S-2 | Sector Intelligence | `/research/sector/:id` | composes governed reads | nav default `Banking` |
| S-3 | Cross-Sector Intelligence | `/research/cross-sector` | `GET /api/cross-sector` | **200** (3,513 B) |
| S-4 | Decision Matrix | `/intelligence/decision-matrix` | `GET /api/decision-matrix` | **200** (2,192 B) |
| S-5 | Opportunities | `/intelligence/opportunities` | `GET /api/cross-sector` → `.opportunity` | **200**, 10 items |
| S-6 | Risks | `/intelligence/risks` | `GET /api/cross-sector` → `.correlation`/`.portfolio` | **200**, avgRisk 76.5, 13 holdings |
| S-7 | Rankings | `/intelligence/rankings` | `GET /api/cross-sector` → `.ranking` | **200**, 13 items |
| S-8 | Executive Dashboard | `/executive` | `GET /api/executive` | **200** (3,769 B) |
| S-9 | Portfolio | `/portfolio`, `/portfolio/*` | `GET /api/portfolio` | **200** (5,350 B) |
| S-10 | Engines registry | `/research/engines` | `GET /api/engines` | **200** (4,731 B) |
| S-11 | Macro | `/research/macro` | D89 disclosure DT-1…DT-8 | read-only |
| S-12 | AI Advisory | `/ai-advisory` | — | read-only, non-authoritative |
| S-13 | Settings | `/settings` | `GET /api/settings` | **200** with carrier (773 B) |
| S-14 | Watchlists | `/watchlists` | `GET /api/watchlists` | **200** with carrier (582 B) |
| S-15 | Collaboration | `/collaboration` | `GET /api/collaboration` | **200** with carrier (753 B) |
| S-16 | Screener | `/screener` | `POST /api/screener` | **GET → 405**; POST needs `{definition:{…}}` (empty `{}` → 400) |

> S-5/S-6/S-7 are the NP-18 views. In **IRR** they are implemented, bound (`App.tsx:59-61`) and
> navigable. In **IPD** the three route constants exist but are unbound by design — that is the
> documented donor-model scope, not a defect.

### 1.9 Conditional screens — fail closed until provisioned

| # | Screen | Route | Prerequisite | Without it (verified) |
|---|---|---|---|---|
| C-1 | User Portfolios | `/user-portfolios` | IPD IPC pipe **running** + `IIPS_G3_IPC_BINDING_PROVISIONED=true` | **503** `owner-context-unavailable` |
| C-2 | Broker Import | `/user-portfolios/import` | as C-1 | as C-1 |
| C-3 | Broker Holdings | `/broker-holdings` | broker CSV imported | honest empty state |
| C-4 | Reports | `/reports`, `/reports/:reportId` | provisioned **NP-04 governed SQLite** at `IIPS_NP04_DATABASE_PATH` + `IIPS_REPORTS_OWNER_PATH` | **404** `not found` (verified even with both env vars set and an empty DB path) |
| C-5 | Evidence Snapshots / Replay | `/evidence/snapshots`, `/evidence/replay` | — | `FeaturePlaceholder` by design (`App.tsx:64-65`) |

> Rows C-1, C-2 and C-4 are validated **strictly** per §1.6b: only the exact documented status and
> body qualify as expected, and once the prerequisite exists the endpoint must serve real data.
> **HTTP 500 is never acceptable** for any endpoint on this list.

### 1.10 Excluded — already verified, do not re-run

- IRR component suites: 4 files / **53 tests** (Opportunities 11, Risks 10, Rankings 11, `App.test.tsx` 21)
- IRR full suite at `fff8cf98`: 108 files / 1,377 tests / 0 failed; typecheck + build exit 0
- IPD full suite: **1033 / 1032 pass / 0 fail / 1 skipped** at `b605a614`
- These are **component-level**. They do not substitute for the browser checks in §1.7.

---

## 2. Python virtual environments — NOT REQUIRED

There is **no** `requirements.txt`, `pyproject.toml`, `setup.py` or `environment.yml` anywhere in
either repository (searched, excluding `node_modules`). IRR contains 75 `.py` files and IPD 5, but
all are one-off evidence/verification scripts under `docs/` and `evidence/`, not an application
runtime. **No venv is created by these scripts.** If a future Python dependency appears, it must be
added deliberately — not guessed.

---

## 3. Port plan (verified from config)

| Service | Port | Bind | Source |
|---|---|---|---|
| IRR executive transport | **8787** | `127.0.0.1` only | `executive-transport.ts:558,718` |
| IRR Vite dev server | **5176** | **`127.0.0.1`** (forced) | `frontend/vite.config.ts` host `0.0.0.0` — **overridden**; port 5176 because ArthaVault owns 5173 |
| IPD Vite dev server | **5174** | **`127.0.0.1`** (forced) | Vite default 5173 → **overridden**; 5173 belongs to ArthaVault |

> Both Vite configurations ship `host: '0.0.0.0'`. For a personal single-user application that is
> wrong: it exposes the app on every interface. Script 03 therefore passes
> `--host 127.0.0.1 --strictPort` explicitly and then **verifies the actual listener address** via
> `Get-NetTCPConnection`. A listener on any other address makes startup **fail hard** and roll back,
> rather than reporting success. `--strictPort` also prevents Vite from silently moving to the next
> port and invalidating the recorded URLs.

The IPD Vite server is the **structural fail-closed shell** (`frontend/src/app/` has 9 files, no
`server/`, no `api/`). It is optional for functional validation; IRR is the application UI.

---

## 4. Environment variables (complete inventory, non-test files)

| Variable | Owner | Purpose | Required for |
|---|---|---|---|
| `EXEC_TRANSPORT_PORT` | IRR | transport port (default 8787) | optional |
| `IIPS_DATA_DIR` | IRR | persistence journal root | P-1, R-1…R-5 |
| `IIPS_OWNER_CONTEXT_PATH` | IRR | owner-context carrier path | A-6 → Settings/Watchlists/Collaboration |
| `IIPS_REPORTS_OWNER_PATH` | IRR | reports owner carrier | C-4 |
| `IIPS_NP04_DATABASE_PATH` | IRR | NP-04 governed SQLite (absolute) | C-4 |
| `IIPS_G3_IPC_BINDING_PROVISIONED` | IRR | fail-closed precondition for Direct P1 reads | C-1, C-2 |
| `IIPS_G2_IPC_ENDPOINT` | IPD | `\\.\pipe\<name>` | I-3 |
| `IIPS_G3_DATABASE_PATH` | IPD | user-portfolio SQLite | I-3, C-1 |
| `IIPS_G3_LOCAL_STATE_DIR` | IPD | absolute state dir | I-3 |
| `IIPS_G2_IPC_TENANT_HINT` | IPD | tenant hint | optional |
| `IIPS_RESTART_OP` / `IIPS_RESTART_REPORT_ID` | IRR | restart harness only | R-5 |
| `IIPS_TENANT_MEMBERSHIP_PATH` | IRR | tenant membership seam | optional |

---

## 5. Browser URLs

Primary application: **http://localhost:5176/**

| Screen | URL |
|---|---|
| Executive Dashboard | `http://localhost:5176/executive` |
| Portfolio | `http://localhost:5176/portfolio` |
| Broker Holdings | `http://localhost:5176/broker-holdings` |
| User Portfolios *(C-1)* | `http://localhost:5176/user-portfolios` |
| Broker Import *(C-2)* | `http://localhost:5176/user-portfolios/import` |
| Watchlists | `http://localhost:5176/watchlists` |
| Collaboration | `http://localhost:5176/collaboration` |
| Company Intelligence | `http://localhost:5176/research/company/banking` |
| Sector Intelligence | `http://localhost:5176/research/sector/Banking` |
| Cross-Sector Intelligence | `http://localhost:5176/research/cross-sector` |
| Macro | `http://localhost:5176/research/macro` |
| Engines | `http://localhost:5176/research/engines` |
| Screener | `http://localhost:5176/screener` |
| **Opportunities** | `http://localhost:5176/intelligence/opportunities` |
| **Risks** | `http://localhost:5176/intelligence/risks` |
| **Rankings** | `http://localhost:5176/intelligence/rankings` |
| **Decision Matrix** | `http://localhost:5176/intelligence/decision-matrix` |
| AI Advisory | `http://localhost:5176/ai-advisory` |
| Evidence | `http://localhost:5176/evidence` |
| Reports *(C-4)* | `http://localhost:5176/reports` |
| Settings | `http://localhost:5176/settings` |
| IPD shell (optional) | `http://localhost:5174/` |

---

## 6. Execution order

```
0. 00-Validate-PowerShell-Syntax.ps1  FIRST — native parse of every script; nothing runs until 0 errors
1. 01-Fresh-Clone-And-Install.ps1     once — clone to H:\IIPS, verify commits, install, build
2. 02-Provision-OwnerContext.ps1      once — materialise both carriers outside the git trees
3. 03-Start-IipsServers.ps1 -StartIpdIpc   each session — transport + Vite + IPD IPC provider
4. browser: walk every URL in §5      manual UI verification (the actual objective)
5. 04-Validate-BackendEndpoints.ps1   any time — strict API contract validation
6. 05-Validate-PersistenceRestart.ps1 any time — durability + restart recovery
7. 06-Stop-IipsServers.ps1            end of session — stops only IIPS process trees
```

**`-StartIpdIpc` is the standard sequence**, because the Direct P1 database is already provisioned
and the remaining IPD-1 work is precisely IPC provider startup plus named-pipe functionality
(§1.3 I-3…I-7). Add `-StartIpdShell` only if you also want the IPD structural shell on 5174.

Steps 3–6 are repeatable. Step 1 never touches an existing checkout: it refuses to run if the target
directory already exists.

---

## 7. Commit pin verification (step 01, sub-step `04-verify-commits`)

A fresh clone must match the authoritative commits before anything is built on top of it.

| # | Validation | How | Expected |
|---|---|---|---|
| P-1 | IRR HEAD | `git rev-parse HEAD` | `9e0a0415b76571fc4db1747b2da63c73fa0447d3` |
| P-2 | IPD HEAD | `git rev-parse HEAD` | `b605a61458a655bb555c6f340332fcf77a85c870` |
| P-3 | Full 40-hex SHA form | pin regex `^[0-9a-f]{40}$` | a truncated SHA is rejected, not guessed |
| P-4 | Drift is identified, not assumed | `git log --oneline pin..HEAD` + `rev-list --left-right --count` | every added commit is **listed** before proceeding |
| P-5 | Drift is a hard gate | default behaviour | **exit 3** unless `-AllowCommitDrift` is passed explicitly |
| P-6 | Pinned `github:` dependencies resolved | `node_modules/<pkg>/package.json` | all three IPD packages present at their pinned commits |
| P-7 | Build output present | `dist/src/ipc/entrypoint.js` | exists — it is the IPC CLI that `-StartIpdIpc` runs |
| P-8 | Builds did not dirty the trees | `git status --porcelain` | both checkouts still clean after build |

> If the clones have advanced past the pins, review the listed commits **before** proceeding. Do not
> pass `-AllowCommitDrift` to silence the check without reading what it printed.

---

## 8. Shutdown safety (step 06)

| # | Validation | How | Expected |
|---|---|---|---|
| S-1 | Identification requires **two** conditions | PID from manifest or port **AND** command line matching the checkout path **AND** an IIPS entrypoint | a bare `node.exe` / `python.exe` never matches |
| S-2 | Unrelated processes survive | run alongside other node/python work | reported as `PRESERVE`, still running afterwards |
| S-3 | Child processes are terminated | `taskkill.exe /PID <p> /T /F` | the spawned `node.exe` under `npm.cmd run dev` dies too — `Stop-Process` alone would orphan it and hold the port |
| S-4 | Ports verified released | `Get-NetTCPConnection` poll | all three ports released; a held port exits **3** |
| S-5 | Named pipe verified released | `\\.\pipe\` namespace poll | pipe name disappears; a lingering pipe exits **3** |
| S-6 | Nothing is deleted | no destructive verb | journals, SQLite databases and carriers are untouched |
| S-7 | A failed stop is reported as a failure | exit code | 0 only when every port **and** the pipe are released |

`existsSync(pipePath)` is **not** a valid Windows pipe check — the namespace is enumerated via
`[System.IO.Directory]::GetFiles('\\.\pipe\')`.

---

## 9. Three levels of verification — do not conflate them

| Level | What it is | Status |
|---|---|---|
| **1. Structural checks** | `.validate-scripts.py`: forbidden constructs, brace balance outside strings/comments, try/catch pairing, explicit-node-path rule, forced localhost binding. Mechanical, runs on any OS. | **136 checks / 0 failures**, and mutation-tested — injecting a bare `npm ci` fails at L183, injecting an `else` fails at L204 |
| **2. Native PowerShell parsing** | `00-Validate-PowerShell-Syntax.ps1`, using `[System.Management.Automation.Language.Parser]::ParseFile` on the operator's own engine, then AST walks that re-apply the same structural rules against the real parse tree. | **Written; NOT executed** — no PowerShell runtime exists in the authoring sandbox |
| **3. Actual Windows execution** | Running the scripts on the workstation: named-pipe binding, `Get-NetTCPConnection`, `Win32_Process`, `taskkill /T`, and the browser UI. | **NOT performed.** No Windows-native execution has occurred anywhere |

Level 1 is the weakest and the only level completed. **Run step 00 before anything else** — it is the
first real gate and the one that can catch what structural text checks cannot.

What *was* verified against the live repositories while authoring: `npm ci` + `npm run build` in IPD
(exit 0); `npm ci` + `build:broker-import` in IRR (exit 0); live transport probes returning 200 for
`health`, `executive`, `portfolio`, `decision-matrix`, `cross-sector`, `engines`, `company/banking`;
the 503→200 owner-context transition; both carriers materialised at 363 and 384 bytes; and the
restart harness round-tripping a watchlist through `journal.ndjson` byte-identically.

**Every claim about Windows behaviour in this document is derived from reading the source at the
pinned commits, not from running it on Windows.**
