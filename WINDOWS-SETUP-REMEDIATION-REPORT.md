# IIPS Windows Setup — Consolidated Script Corrections and Permanent Remediation

**Date:** 2026-11-05 · **Branch:** `arena/b5b0c6e2-iips-production-market-data` · **PR:** [#126](https://github.com/ramkivs/iips-production-market-data/pull/126)

---

## 1. Repository ownership and authoritative locations

Ownership was established from actual structure and history, not assumed.

| Repository | Role | PowerShell present before this work |
|---|---|---|
| `ramkivs/iips-production-market-data` (IPD) | persistence, DB transactions, services, IPC provider | `scripts/Invoke-DirectP1Provisioning.ps1`, `run-d114-legacy-acquisition.ps1` — **operational** |
| `ramkivs/iips-review-recovered` (IRR) | application UI, routes, integration consumers | 16 `.ps1`, all under `docs/integration/` and `evidence/integration/` — **CAP03/P-1 evidence records only** |

**IPD owns the Windows setup bundle.** It already owns operational PowerShell and owns the
persistence, database and IPC surfaces being provisioned and validated. IRR holds no setup bundle.
No packaging logic existed outside `windows-setup/` in either repository.

**Authoritative locations now:**

- `windows-setup/` in IPD — the 13-file source set. The bundle is generated from it, never hand-edited.
- `frontend/vite.config.ts:14` in IRR — the frontend port default.

## 2. Defects and their exact permanent corrections

| # | Defect (observed on the real Windows host) | Correction |
|---|---|---|
| **A** | Terminal closed before the result could be read; no unambiguous final status | `Write-IipsPause` / `Write-IipsFinalStatus` in `Iips-Common.ps1`; standalone inline copies in `00` (it cannot dot-source the library it validates); `-NoPause` declared on all 7 scripts; `[Environment]::Exit` forbidden |
| **B** | Toolchain could resolve inconsistently | `Resolve-IipsNodeToolchain` resolves `node.exe`/`npm.cmd`/`npx.cmd` from one directory, reports all paths and versions, enforces `>= 22.13.0`, and proves non-mixing via `npm.cmd exec -- node <probe.js>`. Bare `node`/`npm`/`npx` never invoked. A no-op `.Replace('\','\')` was also fixed |
| **C** | Frontend `5173` collided with the separately running ArthaVault app | IRR frontend is `5176`; forced with `--host 127.0.0.1 --port 5176 --strictPort`; readiness, proxy checks, printed URLs and the route list all use `5176`. `5173` is never bound, probed or terminated |
| **D** | `Get-IipsPortOwner` filtered on `-State Listen`, but the host returned an active listener with a **blank** `State`, `RemoteAddress 0.0.0.0`, `RemotePort 0` — a live port was reported free | `Test-IipsIsListener` treats an explicit `Listen` state as definitive, otherwise requires the wildcard remote endpoint; an explicit non-`Listen` state is never a listener. `Get-NetTCPConnection` wrapped in try/catch so `No MSFT_NetTCPConnection objects found` means *free*. Release uses `Get-IipsPortOccupantCount` |
| **E** | `$pipes.Count` threw — a single pipe unrolled to a scalar string | Every collection-returning call wrapped in `@( )`, audited across all 9 scripts (7 sites), not only the reported one |
| **F** | `$writerResults[$c].pid` compared a property that does not exist | Writer harness JSON parsed first; `[int]$rec.pid -ne [int]$w.pid`. **TypeScript harnesses unchanged** |
| **G** | An expected fail-closed exit 1 with a stderr diagnostic was treated as a validator crash | `Invoke-IipsCapture` uses `Start-Process` with separate stdout/stderr files, so native stderr never enters the pipeline under `ErrorActionPreference='Stop'`. `05` removes `IIPS_DATA_DIR` for the child, restores it after, and asserts exit **exactly 1** *and* the diagnostic `IIPS_DATA_DIR must be set to the data root under recovery` |
| **H** | — | Isolation model preserved: unique scratch dir per run, no live-data writes, P1 database untouched, journals retained, per-consumer results + summary |
| **I** | — | `03` retains API/frontend/proxy 200 checks, listener ownership, loopback, pipe availability; rollback limited to processes that invocation started; PID manifest; logs retained; `06` stops only manifest-owned processes |
| **J** | — | `04` unchanged — already distinguishes expected HTTP contracts, expected fail-closed, and unexpected 4xx/5xx. Not weakened |

**Root cause of G, worth recording:** `2>&1 | Out-String` on a native command under
`$ErrorActionPreference='Stop'` wraps each stderr line in an `ErrorRecord`, and the first one throws.
`npm ci` writes progress to stderr routinely, so install was one warning away from aborting.

## 3. Files changed

**IPD — `windows-setup/` (13 files, committed):**

| File | Lines | Role |
|---|---|---|
| `Iips-Common.ps1` | 702 | shared library: toolchain, ports, listeners, capture, pause, final status |
| `00-Validate-PowerShell-Syntax.ps1` | 386 | operator's AST syntax gate |
| `01-Fresh-Clone-And-Install.ps1` | 309 | clone, pin, install, build |
| `02-Provision-OwnerContext.ps1` | 261 | owner-context + reports-owner materialisation |
| `03-Start-IipsServers.ps1` | 477 | startup, readiness, PID manifest, rollback |
| `04-Validate-BackendEndpoints.ps1` | 356 | endpoint contract validation |
| `05-Validate-PersistenceRestart.ps1` | 336 | persistence writers/recoverers + fail-closed |
| `06-Stop-IipsServers.ps1` | 266 | manifest-scoped shutdown, release verification |
| `Make-SetupBundle.ps1` | 262 | bundle generator with byte-comparison gate |
| `IRR-PORT-5176.patch` | 59 | IRR-side port change, pending publication |
| `.validate-scripts.py` | — | structural validator (233 checks) |
| `README.md` | 306 | operator guide, port plan, defect register |
| `WINDOWS-VALIDATION-CHECKLIST.md` | 388 | 27-route checklist |

This report lives at the repository root, not inside `windows-setup/`, so that it does not
change the bundle file count the generator enforces.

**IRR — committed locally, delivered as a patch (see §8):** `frontend/vite.config.ts` (5173→5176),
`docs/OPERATOR_RUNBOOK.md` (live instruction → `http://localhost:5176`).

**Deliberately unchanged:** dated evidence and governance records under `docs/integration/` and the
E2E master tracker — they record what was actually executed at the time and would become false if
rewritten; and `frontend/server/user-portfolio/ipcPortAdapter.test.ts`, where `5173` is an arbitrary
origin/host fixture with no port-allocation meaning.

## 4. Targeted tests and results

| Test | Result |
|---|---|
| Structural validator, source tree | **233 pass / 0 fail** across 9 `.ps1` |
| Structural validator, **extracted copy of the served archive** | **233 pass / 0 fail** |
| Mutation coverage | **12 / 12 injected defects caught**, each from a verified-clean baseline |
| Bundle byte-comparison (zip) | **14 / 14 entries identical** to source |
| Bundle byte-comparison (tar.gz) | **14 / 14 entries identical** to source |
| `IRR-PORT-5176.patch` applied to fresh IRR `main` @ `9e0a0415…` | `port: 5176` at line 16 |
| Generator guard: expected count 12 | **REFUSED, exit 1** |
| Generator guard: archive missing | **REFUSED, exit 1** |
| Served download headers | `Content-Type: application/zip`, `Content-Disposition: attachment`, `Cache-Control: no-store`, `200 OK` |
| Downloaded SHA-256 vs advertised | **MATCH** |
| IPD PR #126 CI | **`typecheck · build · test` SUCCESS**, `executed test count` SUCCESS |

**Mutation coverage detail** — each injected from a clean baseline, restored, and re-confirmed clean:

`-State Listen` · `2>&1 | Out-String` · unnormalised `@( )` · bare `node` · bare `npm` ·
`[Environment]::Exit` · stale `5173` · `$writerResults[..].pid` (×2) · `Write-IipsFinalStatus`
removed · `-NoPause` declaration removed · `else` reintroduced.

> A clean tally alone is not evidence. Four silent false negatives were found in the validator
> itself by mutation testing — loop-variable shadowing that stopped a rule running at all, checks
> emitted before their accumulators were populated, a rule scoped away from the library, and a
> port rule scanning string-stripped text so URL literals were invisible.

## 5. PowerShell parser results

**No PowerShell engine is reachable in this environment**, confirmed four ways: the GitHub release
tarball fails with `curl (35) SSL_ERROR_SYSCALL`; `apt-get` hits a dpkg lock; `pwsh` and `dotnet` are
absent; PyPI has no PowerShell distribution.

- `00-Validate-PowerShell-Syntax.ps1` is **delivered, not executed**. It is the operator's parser
  gate and now carries a regression rule for every defect class above.
- **No delivered `.ps1` has been parsed or executed by a real PowerShell engine in this session.**
- All validation performed here is **structural**.

**What was proven about PS 5.1 compatibility structurally:** all 9 `.ps1` files are pure ASCII,
LF line endings, no BOM, no tabs — safe for Windows PowerShell 5.1, which reads `.ps1` as ANSI
without a BOM.

## 6. Bundle generation and SHA-256

```
source inventory : 13 files (matches $script:ExpectedFiles)
MANIFEST.txt     : written (count, pins, port plan, per-file SHA-256 and size)
zip              : 14 entries, reopened and byte-compared to source — 14/14 identical
tar.gz           : 14 entries, reopened and byte-compared to source — 14/14 identical
```

| Artifact | Size | SHA-256 |
|---|---|---|
| `IIPS_WINDOWS_SETUP.zip` | 75,648 B | `a6f401a84cbcab256f020cd26bd234b36723c2a97b6f2a0d73991083a51711c7` |
| `IIPS_WINDOWS_SETUP.tar.gz` | 62,159 B | `923691409981033f47a526b33d08d4c04d8f71fd2c4fbc6385f8b7a0b2efd8ca` |

`Make-SetupBundle.ps1` performs the same procedure natively and **refuses publication on any
mismatch** (exit 3). An earlier bundle was assembled by hand outside the repository — that is how a
stale 9-file archive reached an operator.

## 7. Commit IDs, branch and PR references

| Item | Value |
|---|---|
| IPD branch | `arena/b5b0c6e2-iips-production-market-data` |
| Commit 1 | `fe66bead5868070c485d6d9c3ae53fb251ff280e` |
| Commit 2 | `8ed3459823f4a22e61e49da6cc4cf76c9b2cdc2f` (remote HEAD, verified via `git ls-remote`) |
| IPD PR | **#126** — OPEN, MERGEABLE, CI SUCCESS |
| IPD base | `main` @ `b605a61458a655bb555c6f340332fcf77a85c870` |
| IRR commit | `78f24b81546dabd808c4017eaf01d5e5eba38a60` on `windows-setup/irr-frontend-port-5176` |
| IRR PR | **NOT OPENED** — see §8 |
| IRR base | `main` @ `9e0a0415b76571fc4db1747b2da63c73fa0447d3` |

## 8. Remaining verification — Windows host only, plus one publishing gap

### Publishing gap (real, not a test limitation)

The IRR change **could not be published**. `git push` to `ramkivs/iips-review-recovered` returns
`403 Permission denied`. The credential here is a GitHub **App installation token**: `gh api` reports
`push: true`, but that describes the repository's permission model, not the installation's granted
repository set — and `/installation/repositories` returns `403 Resource not accessible by integration`.
IPD writes succeed; IRR writes do not.

The change is therefore delivered as `IRR-PORT-5176.patch` inside the bundle, verified to apply
cleanly to a fresh clone of IRR `main`. **This is the one item that needs your action:**

```bash
git clone https://github.com/ramkivs/iips-review-recovered.git
cd iips-review-recovered
git checkout -b windows-setup/irr-frontend-port-5176
git am IRR-PORT-5176.patch
git push -u origin windows-setup/irr-frontend-port-5176
```

It is **not functionally blocking**: the setup passes `--host 127.0.0.1 --port 5176 --strictPort`
explicitly, so it does not depend on the repository default.

### Windows-host-only verification still required

No native Windows execution occurred while authoring this change. Required on the host:

1. **Parser gate** — `00-Validate-PowerShell-Syntax.ps1` under Windows PowerShell 5.1. This is the
   only thing that can confirm the 9 scripts actually parse.
2. **`Get-IipsPortOwner` against a live listener** — confirm the blank-`State` listener is detected,
   an occupied port is reported occupied with its PID, a free port is reported free, and no
   unrelated process is killed.
3. **Port release** — `Wait-IipsPortReleased` after `06`, confirming 8787/5176/5174 and
   `\\.\pipe\iips-user-portfolio-v1` are released.
4. **Fail-closed recovery** — step `05` must report PASS on exit 1 plus the exact diagnostic, not an
   infrastructure failure.
5. **Toolchain probe** — the anti-mixing `npm.cmd exec -- node <probe.js>` check must pass on the
   real `C:\Node22\node-v22.16.0-win-x64` installation.
6. **Terminal survival** — each script's final status readable before the window closes.
7. **Bundle generation** — run `Make-SetupBundle.ps1` natively and confirm its own byte-comparison
   gate passes and produces the same hashes.

**Browser UI verification is a host activity and is not claimed here.** No UI verification has
passed in this session; there is no browser evidence and none is asserted.

## 9. Fresh download and execution instructions

The bundle is served live from this session's preview (port 8000).

```powershell
# 1. Download and verify
Invoke-WebRequest http://<preview-host>/files/IIPS_WINDOWS_SETUP.zip -OutFile bundle.zip
(Get-FileHash bundle.zip -Algorithm SHA256).Hash
# expect a6f401a84cbcab256f020cd26bd234b36723c2a97b6f2a0d73991083a51711c7

# 2. Extract
Expand-Archive bundle.zip -DestinationPath C:\iips-setup
cd C:\iips-setup\windows-setup

# 3. Confirm the bundle is complete before running anything
Get-Content .\MANIFEST.txt          # must show 13 files and per-file SHA-256
Get-FileHash .\Iips-Common.ps1 -Algorithm SHA256   # compare against MANIFEST.txt

# 4. Parse gate (native PowerShell 5.1 — this is the first real parse)
powershell -ExecutionPolicy Bypass -File .\00-Validate-PowerShell-Syntax.ps1

# 5. Run in order
powershell -ExecutionPolicy Bypass -File .\01-Fresh-Clone-And-Install.ps1
powershell -ExecutionPolicy Bypass -File .\02-Provision-OwnerContext.ps1
powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1
powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1
powershell -ExecutionPolicy Bypass -File .\05-Validate-PersistenceRestart.ps1
powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1
```

A bundle with any file count other than **14 archive entries / 13 source files** is stale — do not
run it. Add `-NoPause` to any script to skip the closing pause.

**Ports:** 8787 transport · 5176 IRR frontend · 5174 IPD shell. **5173 belongs to ArthaVault and is
never bound, probed or terminated.**

**Untouched by design:** the Direct P1 database at `C:\iips-data\iips\user-portfolio.sqlite` is
verified read-only and never created, recreated, overwritten or migrated. NP-04 Reports remains
parked and fail-closed; no database is manufactured for it.
