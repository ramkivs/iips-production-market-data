# IIPS Windows Setup & Functional Validation

Personal, local, single-user application. PA/PO: **Ramki**. No production environment, no
multi-tenant infrastructure, no cloud or container dependency.

**IRR** `ramkivs/iips-review-recovered` @ `9e0a0415b76571fc4db1747b2da63c73fa0447d3`
**IPD** `ramkivs/iips-production-market-data` @ `b605a61458a655bb555c6f340332fcf77a85c870`

Every path, port, environment variable, endpoint and expected value here was read from the
repositories at those commits, or executed against them.

---

## Files

| File | Purpose |
|---|---|
| `WINDOWS-VALIDATION-CHECKLIST.md` | the full Windows functionality checklist |
| `Iips-Common.ps1` | shared toolchain resolution and helpers (dot-sourced by every script) |
| **`00-Validate-PowerShell-Syntax.ps1`** | **native PowerShell parse of every script — run this first** |
| `01-Fresh-Clone-And-Install.ps1` | fresh clone to `H:\IIPS`, commit verification, install, build |
| `02-Provision-OwnerContext.ps1` | materialise the personal application principal |
| `03-Start-IipsServers.ps1` | start services on 127.0.0.1, wait for readiness, print URLs |
| `04-Validate-BackendEndpoints.ps1` | strict API contract validation |
| `05-Validate-PersistenceRestart.ps1` | durability + restart recovery |
| `06-Stop-IipsServers.ps1` | stop only IIPS process trees, verify ports and pipe released |
| `Make-SetupBundle.ps1` | build and verify the distributable bundle from this source |
| `IRR-PORT-5176.patch` | the IRR-side port change, pending publication to that repository |
| `.validate-scripts.py` | structural validator (Arena-side; 233 checks, 0 failures) |

---

## Prerequisites

| Requirement | Verified source |
|---|---|
| Git for Windows on `PATH` | the IRR frontend pins three IPD packages by `github:` commit |
| Node.js **>= 22.13.0** | `src/persistence/connection.ts` `MINIMUM_NODE_*`; flag-free `node:sqlite` |
| Write access to `H:\` | install root |
| **No Python** | neither repo has a `requirements.txt`, `pyproject.toml`, `setup.py` or `environment.yml` |

Scripts prefer `C:\Node22\node-v22.16.0-win-x64\node.exe` when present and fall back to `PATH`.

### Port plan

| Port | Owner | Used by |
|---|---|---|
| `8787` | IIPS | IRR executive transport (API) |
| **`5176`** | IIPS | IRR frontend (Vite dev server) |
| `5174` | IIPS | optional IPD structural shell |
| `5173` | **ArthaVault** | **not IIPS - never bound, probed or terminated** |

The IRR frontend originally defaulted to `5173`, which collided with the separately running
ArthaVault application on the same host. `5176` is the corrected allocation and is enforced by
`--host 127.0.0.1 --port 5176 --strictPort` at startup, so the setup does not depend on the
repository default.

**IRR repository status.** The setup does not depend on the repository default, because it passes
`--port 5176 --strictPort` explicitly. Separately, `IRR-PORT-5176.patch` aligns
`frontend/vite.config.ts` and `docs/OPERATOR_RUNBOOK.md` in `iips-review-recovered` so the default
agrees. It was verified to apply cleanly against a fresh clone of `main` at
`9e0a0415b76571fc4db1747b2da63c73fa0447d3`, producing `port: 5176`. It is **not yet merged** - the
publishing credential available here can write to `iips-production-market-data` but not to
`iips-review-recovered`, so the change is delivered as a patch rather than an open pull request.

### Mandatory Node.js command handling

**No script ever invokes a bare `npm` or `npx`.** `Iips-Common.ps1` resolves all three from one
installation and every call uses an explicit absolute path with the call operator:

```powershell
$toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable
& $toolchain.NpmCmd @Arguments          # never: npm @Arguments
& $toolchain.NpxCmd tsx $Script @Args   # never: npx tsx ...
```

`Resolve-IipsNodeToolchain` guarantees:

1. `node.exe`, `npm.cmd` and `npx.cmd` are resolved from the **same directory** — one installation.
2. That directory is prepended to `PATH` for child processes, so the shims' internal `node` lookup
   cannot pick up a different installation.
3. `node --version` is **>= 22.13.0**.
4. **Anti-mixing proof:** `npm.cmd exec -- node -e process.execPath` must report the *same*
   `node.exe`. A mismatch throws `Node.js installation mixing detected` and setup stops.

Script `00` enforces this statically too — a bare `npm` or `npx` anywhere fails validation.

---

## Execution order

```powershell
cd H:\IIPS-scripts

# 0. FIRST - native PowerShell parse of every script. Nothing else runs until this passes.
powershell -ExecutionPolicy Bypass -File .\00-Validate-PowerShell-Syntax.ps1

# 1. ONCE - fresh clone + commit verification + install + build
powershell -ExecutionPolicy Bypass -File .\01-Fresh-Clone-And-Install.ps1

# 2. ONCE - provision the personal application principal
powershell -ExecutionPolicy Bypass -File .\02-Provision-OwnerContext.ps1

# 3. EACH SESSION - start the services (-StartIpdIpc uses the already-provisioned Direct P1 DB)
powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc

# 4. NOW - verify every screen by hand in the browser (the actual objective)
start http://127.0.0.1:5176/

# 5. ANY TIME - strict backend contract validation
powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1

# 6. ANY TIME - durability and restart recovery
powershell -ExecutionPolicy Bypass -File .\05-Validate-PersistenceRestart.ps1

# 7. END OF SESSION - stop only the IIPS process trees
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1
```

Optional:

```powershell
.\03-Start-IipsServers.ps1 -StartIpdIpc -StartIpdShell   # also the IPD shell on 5174
.\03-Start-IipsServers.ps1                               # without User Portfolios / Broker Import
.\01-Fresh-Clone-And-Install.ps1 -AllowCommitDrift       # only after reviewing the listed drift
```

---

## Browser URLs

Application root: **http://127.0.0.1:5176/** — bound to loopback only, never `0.0.0.0`.

| Screen | URL |
|---|---|
| Executive Dashboard | http://127.0.0.1:5176/executive |
| Portfolio | http://127.0.0.1:5176/portfolio |
| Broker Holdings | http://127.0.0.1:5176/broker-holdings |
| User Portfolios | http://127.0.0.1:5176/user-portfolios |
| Broker Import | http://127.0.0.1:5176/user-portfolios/import |
| Watchlists | http://127.0.0.1:5176/watchlists |
| Collaboration | http://127.0.0.1:5176/collaboration |
| Company Intelligence | http://127.0.0.1:5176/research/company/banking |
| Sector Intelligence | http://127.0.0.1:5176/research/sector/Banking |
| Cross-Sector Intelligence | http://127.0.0.1:5176/research/cross-sector |
| Macro | http://127.0.0.1:5176/research/macro |
| Engines | http://127.0.0.1:5176/research/engines |
| Screener | http://127.0.0.1:5176/screener |
| **Opportunities** | http://127.0.0.1:5176/intelligence/opportunities |
| **Risks** | http://127.0.0.1:5176/intelligence/risks |
| **Rankings** | http://127.0.0.1:5176/intelligence/rankings |
| **Decision Matrix** | http://127.0.0.1:5176/intelligence/decision-matrix |
| AI Advisory | http://127.0.0.1:5176/ai-advisory |
| Evidence | http://127.0.0.1:5176/evidence |
| Reports *(parked)* | http://127.0.0.1:5176/reports |
| Settings | http://127.0.0.1:5176/settings |
| IPD shell *(needs `-StartIpdShell`)* | http://127.0.0.1:5174/ |

---

## Direct P1 — already provisioned, never repeated

The user-portfolio SQLite database at **`C:\iips-data\iips\user-portfolio.sqlite`** was provisioned
successfully on native Windows.

With `-StartIpdIpc`, script 03 **verifies** the file exists and is non-empty, then uses it read-only:

- it never creates, recreates, truncates or replaces the database
- it never runs a migration or a schema change
- if the file is missing, startup **stops with an explicit message** instead of provisioning anything

The remaining IPD-1 validation is exactly what `-StartIpdIpc` exercises: **IPC provider startup and
named-pipe functionality** — the `[g3] listening on windows-named-pipe …` banner, visibility of the
pipe in the `\\.\pipe\` namespace, refusal of a second instance, and disappearance on clean shutdown.

## Reports — parked

Reports requires a separately provisioned NP-04 governed database. These scripts **do not create an
artificial database** and **do not treat Reports as a mandatory functional check**. Without the
database it fails closed with HTTP 404, which is the correct behaviour.

---

## Directory layout created

```
H:\IIPS\
├── iips-review-recovered\          IRR clone (authoritative main)
├── iips-production-market-data\    IPD clone (authoritative main)
├── runtime\                        OUTSIDE both git trees - carriers must live here
│   ├── owner-context\owner-context.json          363 bytes, SHA-256 pinned
│   ├── reports-owner\reports-owner-context.json  384 bytes, SHA-256 pinned
│   ├── iips-data\                  persistence journals (<consumer>\journal.ndjson)
│   ├── np04\                       NP-04 database location (Reports - parked, not created)
│   └── ipd-state\                  IPD IPC state directory
└── logs\                           per-run logs, service logs, PID manifests, result CSVs

C:\iips-data\iips\user-portfolio.sqlite   Direct P1 - pre-existing, never touched
```

---

## Expected conditional behaviour (not defects)

| Screen | Without its prerequisite | Why |
|---|---|---|
| Settings, Watchlists, Collaboration | `503 owner-context-unavailable` | fail-closed without the carrier; step 02 fixes it |
| User Portfolios, Broker Import | `503 owner-context-unavailable` | needs `-StartIpdIpc` |
| Reports | `404 {"error":"not found"}` | parked; needs a provisioned NP-04 database |
| Evidence Snapshots, Evidence Replay | `FeaturePlaceholder` | deliberate — `App.tsx:64-65` |
| Screener via GET | `405` | POST-only; needs `{"definition":{...}}` |

**Script 04 matches these strictly.** A fail-closed response only counts as expected when the status
**and** the documented body reason both match, **and** the prerequisite is genuinely absent:

- User Portfolios → `503` **and** body contains `owner-context-unavailable`
- Reports → `404` **and** body is `{"error":"not found"}`

**HTTP 500 is always an error.** So is a 503/404 whose body carries a different reason. And when a
prerequisite *is* present (pipe exists, NP-04 file exists), the endpoint **must** return 200 with a
validated payload — a fail-closed response in that state is reported as a defect.

---

## What these scripts never do

- Never delete, overwrite or reuse an existing checkout — step 01 refuses and exits 2.
- Never force-push, rewrite history, or move a ref or tag.
- Never provision, migrate or overwrite the Direct P1 database.
- Never create an artificial NP-04 database for Reports.
- Never weaken a write guard or bypass authorisation.
- Never `npm install` over a committed lockfile — always `npm ci` via `npm.cmd`.
- Never invoke a bare `npm` or `npx`.
- Never guess a Python environment — there is none, and step 01 fails loudly if one appears.
- Never kill a process by bare executable name — step 06 requires both a path match and an
  entrypoint match, so unrelated `node.exe` and `python.exe` survive.
- Never substitute an API probe for UI verification.

---

## Three levels of verification — do not conflate them

| Level | What it is | Status here |
|---|---|---|
| **1. Structural checks** | `.validate-scripts.py` - forbidden constructs, brace balance outside strings/comments, try/catch pairing, explicit-node-path rule, forced localhost binding, plus a regression rule for every defect found on the real Windows host. Mechanical, runs on any OS. | **233 checks, 0 failures**, and mutation-tested: all **12** injected defects are caught from a verified-clean baseline (see the table below) |
| **2. Native PowerShell parsing** | `00-Validate-PowerShell-Syntax.ps1` using `Parser::ParseFile` on the operator's own engine, plus AST walks for the same structural rules. | **Script written; NOT executed** — no PowerShell runtime exists in the authoring sandbox |
| **3. Actual Windows execution** | Running the scripts on the workstation: named-pipe binding, `Get-NetTCPConnection`, `Win32_Process`, `taskkill /T`, browser UI. | **NOT performed.** No Windows-native execution has occurred |

Level 1 is the weakest and the only one completed. **Run step 00 before anything else** — it is the
first real gate, and it is the one that can catch what the structural checks cannot.

What *was* verified against the live repositories during authoring: `npm ci` + `npm run build` in
IPD (exit 0), `npm ci` + `build:broker-import` in IRR (exit 0), live transport probes returning 200
for `health`/`executive`/`portfolio`/`decision-matrix`/`cross-sector`/`engines`/`company/banking`,
the 503→200 owner-context transition, both carriers materialised at 363 and 384 bytes, and the
restart harness round-tripping a watchlist through `journal.ndjson`.

---

## Defects found on the real Windows host, and their permanent corrections

These were discovered during the 5 November 2026 native Windows PowerShell 5.1 execution and are now
fixed in the authoritative source, not merely documented. Each has a regression rule in
`.validate-scripts.py` **and** in `00-Validate-PowerShell-Syntax.ps1`.

| # | Defect | Permanent correction |
|---|---|---|
| A | Window closed before the result could be read; no unambiguous final status | every script ends through `Write-IipsFinalStatus` (`PASS`/`FAIL` + reason) then pauses on `Read-Host`; `-NoPause` skips it. `Read-Host` never closes the session and is guarded for non-interactive runs |
| B | Node.js toolchain could resolve inconsistently | `Resolve-IipsNodeToolchain` resolves `node.exe`/`npm.cmd`/`npx.cmd` from one directory, reports all three paths and versions, enforces `>= 22.13.0`, and proves non-mixing via `npm.cmd exec -- node <probe.js>`. Bare `node`/`npm`/`npx` are forbidden |
| C | Frontend port `5173` collided with ArthaVault | IRR frontend is `5176`; forced with `--host 127.0.0.1 --port 5176 --strictPort`; readiness, proxy checks and printed URLs all use `5176`; `5173` is never touched |
| D | `Get-IipsPortOwner` filtered on `-State Listen`, but the real host returned an active listener with a **blank** `State`, `RemoteAddress 0.0.0.0`, `RemotePort 0` | `Test-IipsIsListener` treats an explicit `Listen` state as definitive, otherwise requires the wildcard remote endpoint; an explicit non-`Listen` state is never a listener. `Get-NetTCPConnection` is wrapped in try/catch, so `No MSFT_NetTCPConnection objects found` means "free", not failure. Release now uses `Get-IipsPortOccupantCount` |
| E | `$pipes.Count` threw because a single pipe unrolled to a scalar string | every collection-returning call is wrapped in `@( )` - audited across all nine scripts, not just the reported site |
| F | `$writerResults[$c].pid` compared against a property that does not exist | the writer JSON emitted by the harness is parsed first; PIDs compared as `[int]$rec.pid -ne [int]$w.pid`. The TypeScript harnesses were **not** modified |
| G | An expected fail-closed exit 1 with a stderr diagnostic was treated as a validator crash | `Invoke-Harness` and `Invoke-IipsCapture` use `Start-Process` with separate stdout/stderr files, so native stderr never enters the pipeline. Exit code and diagnostic are asserted separately; `IIPS_DATA_DIR` is removed for the child and restored afterwards |
| H | - | isolation model unchanged: unique scratch dir per run, no writes to live data, P1 database untouched, journals retained |

### Mutation-tested regression rules

Every rule was verified by injecting the defect and confirming detection from a clean baseline:

| Injected defect | Caught by |
|---|---|
| `-State Listen` reintroduced | `port owner lookup does not filter on -State Listen` |
| `2>&1 \| Out-String` reintroduced | `no native stderr piped into the pipeline` |
| `@( )` removed from a collection call | `collection-returning calls are normalised with @( )` |
| bare `node` / bare `npm` | `no bare npm / npx / node` |
| `[Environment]::Exit` | `never force-closes the user's PowerShell session` |
| `5173` in a script | `no stale 5173 (ArthaVault owns it; IIPS uses 5176)` |
| `$writerResults[..].pid` | `writer PID is not read off the result object` |
| `Write-IipsFinalStatus` removed | `ends through Write-IipsFinalStatus` |
| `-NoPause` declaration removed | `declares the -NoPause switch parameter` |
| `else` reintroduced | `no else / elseif / finally` |

## Regenerating the bundle

The bundle is **generated, never hand-edited**:

```powershell
powershell -ExecutionPolicy Bypass -File .\Make-SetupBundle.ps1
```

It inventories the source against a fixed file list, writes `MANIFEST.txt` (file count, pinned
commits, port plan, SHA-256 and size per file), builds the ZIP and tar.gz, then **reopens the archive
and compares every entry against the source byte for byte**. A mismatch, a missing file or an
unexpected extra file stops publication with exit 3. This is what prevents a stale bundle from
reaching an operator again.
