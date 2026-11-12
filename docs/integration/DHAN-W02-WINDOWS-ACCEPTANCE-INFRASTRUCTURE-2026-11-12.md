# DHAN W-02 — Repository-Owned Windows Acceptance Infrastructure

**Status:** IMPLEMENTED AND VERIFIED IN ARENA — **the fresh Windows-host acceptance run is now ready**
**Work item:** W-02 (roadmap v1.1), decision D-1
**Repository:** `ramkivs/iips-production-market-data`
**Branch:** `arena/84d1e063-iips-production-market-data` · **PR:** #156
**Predecessor:** `4446c1e` (production DACL idempotency — preserved unchanged)
**Date:** 2026-11-12 (UTC)

> Arena has no PowerShell and no Windows. **(A)** the operator's Windows evidence is user-supplied;
> **(B)** everything below marked Arena is what this environment actually executed; **(C)** the fresh
> Windows acceptance run is still outstanding and is not claimed.

---

## 1. The two confirmed Windows-host failures

### 1.1 Toolchain discovery hung at `[01-preconditions]`

The acceptance launcher dot-sourced `windows-setup/Iips-Common.ps1` and called
`Resolve-IipsNodeToolchain`, which never returned. Root cause, in three parts:

| Cause | Detail |
| --- | --- |
| `Start-Process -Wait` in the capture helper | On Windows, `-Wait` waits for the **entire process tree** and there is **no timeout**. A shim that leaves a grandchild behind blocks the caller indefinitely. `Invoke-IipsCapture` used it for every probe, including the version checks. |
| `npm exec` discovery | The resolver proved "single installation" by running `npm.cmd exec -- node <probe.js>`. That adds cmd → npm → node layers, each with its own tree, on top of an unbounded wait. It is also a discovery mechanism the roadmap forbids. |
| A hardcoded preferred installation | `$script:IipsPreferredNodePath = 'C:\Node22\node-v22.16.0-win-x64\node.exe'` made the resolver deterministic on one machine and wrong on every other. |

### 1.2 The launcher crashed on `-ForegroundColor`

```powershell
Write-IipsInfo '...' -ForegroundColor Gray
```

`Write-IipsInfo` declares exactly one parameter, `-Message`. Passing `-ForegroundColor` is a
parameter-binding error, and under `$ErrorActionPreference = 'Stop'` it terminates the run. Both call
sites in the launcher had it.

## 2. Repository-owned helper changes — `windows-setup/Iips-Common.ps1`

| Function | Change |
| --- | --- |
| **`Invoke-IipsProcess`** (new) | `System.Diagnostics.Process` with `UseShellExecute = $false`; **both** streams begin `ReadToEndAsync()` **before** the bounded `WaitForExit($TimeoutMilliseconds)`; a timeout kills the child and reports `PROCESS_TIMEOUT`; `StandardInput` delivers a payload that the child then sees closed; `ExitCode`, `StdOut`, `StdErr`, `StdErrByteLength`, `TimedOut`, `StdinFailed`, `DurationMs`. No `npm exec`, no `Wait-Process`, no shell. |
| **`Get-IipsQuotedArguments`** (new) | Win32 `CommandLineToArgvW` quoting (backslashes before a quote doubled, inner quotes escaped) so paths with spaces survive. |
| **`Invoke-IipsCmdShim`** (new) | The single place a `.cmd`/`.bat` is started: `cmd.exe /d /s /c "<shim>" <args>`, resolved from `%SystemRoot%` (fallback `%ComSpec%`), through `Invoke-IipsProcess`. |
| **`Invoke-IipsCapture`** (rewritten) | Now a thin compatibility wrapper over `Invoke-IipsProcess`: same bounded execution and async capture, **no temporary files at all** (previously `Start-Process` with redirected files), automatic `cmd.exe` routing for shims, `-TimeoutMilliseconds` (default 600000). Its four-field result shape is unchanged, so every setup script keeps working. |
| **`Resolve-IipsNodeToolchain`** (rewritten) | Candidates: `-NodeExecutable`, else every `node.exe` from `Get-Command node.exe -All`. For each, `node.exe` + `npm.cmd` + `npx.cmd` must be in **one** directory; each is verified through the bounded runner (10 s per probe); the 22.13.0 floor is still enforced; the resolved directory is prepended to `PATH`; failure is `NODE_TOOLCHAIN_NOT_RESOLVED` with **reason codes only**. |
| `$script:IipsPreferredNodePath` | **Removed.** Replaced by documented "no hardcoded installation path" constants and a comment explaining why. |

Design notes:

* The process is disposed on **both** paths. The repository forbids `finally` (the structural
  validator enforces it), so the body is wrapped in `try/catch`, the failure is stored, the process
  is disposed once, and only then is the failure rethrown — the same guarantee without `finally`.
* A failed stdin write is recorded as `StdinFailed`, never silently swallowed and never allowed to
  mask the exit code.
* No exception message contains a child's output, its arguments, the stdin payload, or a personal
  path.

## 3. Acceptance launcher changes — `windows-acceptance/Invoke-W02DpapiAcceptance.ps1`

| Change | Detail |
| --- | --- |
| Bounded harness execution | `$stdinJson \| & $nodeExe $harnessPath 2> $stderrPath` → `Invoke-IipsProcess -FilePath $nodeExe -Arguments '"<harness>"' -TimeoutMilliseconds 600000 -StandardInput $stdinJson` |
| Stdin-only secrets preserved | The two throwaway values still reach the harness **only** on stdin: never argv, never a temporary file. |
| No stderr file | `harness.stderr.tmp` is gone. stderr is captured in memory and reduced to `StdErrByteLength`, which is all the evidence records. |
| Fail-closed on timeout | `PROCESS_TIMEOUT` becomes a failed `W02-WIN-00` entry ("the harness exceeded the bounded timeout and was terminated") and exit 1 — never a pass. A `StdinFailed` result is a separate failed entry. |
| `-ForegroundColor` call sites | Both removed; every `Write-IipsInfo` call now matches the declared parameter set. |
| Helper resolution | Unchanged and repository-relative: `Join-Path (Join-Path $repoRoot 'windows-setup') 'Iips-Common.ps1'`. **No personal helper path is required anywhere.** |

Preserved: the evidence log format, the per-test entries, the pre/post secret scan, the cleanup of
the acceptance directory, `-NoPause`, and the exit codes 0/1/2.

## 4. What protects this from regressing

**`windows-setup/.validate-scripts.py`** (the repository's own structural validator) gained a rule
block that can actually fail — every rule maps to one of the two defects:

* no `npm exec`, no `Wait-Process`, no `Start-Process -Wait`, no hardcoded `C:\Node22`, no `C:\Users\`;
* `Invoke-IipsProcess` must read **both** streams asynchronously and start those reads **before** the
  bounded wait, kill on timeout, dispose, bound every timeout, and support stdin;
* `.cmd` shims must go through `cmd.exe /d /s /c` by absolute path;
* `Resolve-IipsNodeToolchain` must enumerate `node.exe` from `PATH`, require the shims beside it and
  report `NODE_TOOLCHAIN_NOT_RESOLVED`;
* no `Write-IipsInfo` / `Write-IipsOk` / `Write-IipsWarn` call may pass `-ForegroundColor`;
* the launcher must resolve the helper repository-relatively, use `-StandardInput`, keep no stderr
  file and read no `$LASTEXITCODE`.

Negative controls were run: re-introducing `Start-Process -Wait` in the helper, and
`-ForegroundColor` + a missing `-StandardInput` in the launcher, each make the validator **fail**
with a named rule.

**`tests/w02_acceptance_process.test.ts`** (new, 5 tests):

| Test | Proves |
| --- | --- |
| `W-02-INF-01` | the helper carries the bounded runner with async reads before the wait, kill, dispose, and sanitized failures |
| `W-02-INF-02` | deterministic PATH-based resolution, no `npm exec`, no hardcoded install path, shims via `cmd.exe /d /s /c` |
| `W-02-INF-03` | the launcher resolves the helper locally, calls it with declared parameters only, and uses stdin + byte count |
| `W-02-INF-04` | the structural validator enforces those contracts and passes for both directories |
| `W-02-INF-06` | the generated child command lines are correct and carry no data (pure; runs everywhere) |
| `W-02-INF-07` | an explicit `-NodeExecutable` is propagated and every script-scope constant is defined (pure; runs everywhere) |
| `W-02-INF-05` | **the real runner executed** (CI sets `IIPS_POWERSHELL_RUNTIME_TESTS=1` on both platforms): non-zero exit, separate streams, 200 KB on each stream simultaneously, stdin delivery absent from the child's command line, timeout with a **killed child** (pid verified gone), a resolved toolchain that is one installation, and a resolver failure that echoes no path |

`W-02-INF-05` resolves the interpreter to an **absolute path** before driving it, because the runner
deliberately rejects a bare command name. It skips where PowerShell is absent — this sandbox. It runs wherever `pwsh` exists (the
CI image); on Windows it defers to the acceptance run, because the runner deliberately requires an
absolute executable path.

## 4a. Windows-host result for `W-02-INF-05`, and the correction (2026-11-12)

The operator ran `node --test dist/tests/w02_acceptance_process.test.js` on the Windows host:

| Test | Result |
| --- | --- |
| `W-02-INF-01` | PASS |
| `W-02-INF-02` | PASS |
| `W-02-INF-03` | PASS |
| `W-02-INF-04` | SKIPPED (no Python 3 on that host) |
| `W-02-INF-05` | **FAIL — `case 'large' failed: CASE_ERROR: PROCESS_START_FAILED`** |

### What that message actually is

`PROCESS_START_FAILED` is this repository's own code, thrown by `Invoke-IipsProcess` when
`Process.Start()` returns `false` **or throws**. The old code caught the exception with a bare
`catch { $started = $false }` and threw a bare string — so **the one piece of evidence that matters,
the Win32 error code, was discarded by us.** That is a defect in the runner, not in the test: a
failure that cannot name its cause cannot be fixed from the message.

### Where the failure is localised

Three of the five runtime cases passed on that host (`nonZeroExit`, `streams`, and — before them —
the resolver case is independent), and **the two that failed are exactly the two that passed an
external script path to the child through `-File`.** The inline `-Command` cases passed. The child
command line was therefore the differing factor, and it was built like this:

```powershell
-Arguments '-NoProfile -NonInteractive -File '{0}'child-streams.ps1' -TimeoutMilliseconds 120000
```

That is a **PowerShell single-quoted literal nested inside a PowerShell single-quoted literal**. In
argument mode the segments concatenate, so the value that reached `ProcessStartInfo.Arguments` is not
the value intended: the path ends up unquoted, and on a host whose temporary path contains a space
the interpreter's own argument parsing splits it. The runner was handed a command line that differed
from the one the test meant to pass.

### The correction

1. **The native failure is never suppressed again.** `Process.Start()` failures are captured and
   reported as
   `PROCESS_START_FAILED: win32=<code> (<category>)`, where the category is one of
   `file-not-found`, `path-not-found`, `access-denied`, `invalid-parameter`, `not-a-valid-application`,
   `filename-too-long`, `invalid-directory`, `elevation-required`, `unclassified` — or
   `type=<ExceptionType>` when there is no native code. No path, no arguments, no payload.
2. **A missing executable is a different code.** The pre-check now throws
   `PROCESS_EXECUTABLE_NOT_FOUND`, so "Test-Path said no" can never be mistaken for "the OS refused
   to create the process".
3. **Child programs are inline and encoded.** Every runtime case now passes
   `-NoProfile -NonInteractive -EncodedCommand <base64 UTF-16LE>` — the same mechanism the production
   DPAPI child boundary uses. There is no script path on any command line and no token that a parser
   can re-split.
4. **A platform-independent guard replaces trust.** `W-02-INF-06` asserts the *generated* suite text:
   no `-File`, no `-Command`, exactly five `-Arguments` values each a single quoted literal starting
   with `-EncodedCommand`, no path inside any of them, balanced quotes, and the stdin payload
   appearing exactly once (as `-StandardInput`). That test runs everywhere, including here, and would
   have caught the nested-quote defect before the host ever saw it.

### Executed evidence, after the correction

The case is no longer only-on-request. It is executed in CI, on both PowerShell hosts:

| Where | Host | PowerShell | Result |
| --- | --- | --- | --- |
| `CI` → `Test (guarded)` | `ubuntu-latest` | `pwsh` | **PASS** — executed, not skipped (1535 tests executed, 1534 passed, 0 failed) |
| `W-02 process runner (PowerShell)` | `ubuntu-latest` | `pwsh` | **PASS** |
| `W-02 process runner (PowerShell)` | `windows-latest` | **Windows PowerShell 5.1** | **PASS** |

All six runner cases pass on Windows PowerShell 5.1: non-zero exit reported as data, stdout and
stderr captured separately, **200 KB on both streams at the same time** (the case that failed on the
operator's host), stdin delivery with the payload provably absent from the child's command line, a
bounded timeout whose child pid is gone afterwards, a resolved toolchain that is one installation,
and a sanitized resolver failure that never echoes the path it was given.

The local suite still skips the case when PowerShell is not present (`IIPS_POWERSHELL_RUNTIME_TESTS`
unset) — a developer machine without PowerShell should not fail on a missing interpreter — but CI
never relies on that: both workflows set the flag, and the Windows job is the 5.1 authority.

### Remaining acceptance

`W-02-INF-05` still has to pass on the **operator's** host, which is the environment the launcher
actually runs in (its own `H:\IIPS` layout, its own Node installation):

```powershell
npm run build:tsc
$env:IIPS_POWERSHELL_RUNTIME_TESTS='1'; node --test dist/tests/w02_acceptance_process.test.js
```

If anything still refuses, the message now carries `win32=<code> (<category>)`, which names the
exact Windows error instead of hiding it. Arena does not execute PowerShell 5.1 itself and does not
claim the operator's run passes.

## 4b. `-NodeExecutable` never took effect: the probe bound was undefined (2026-11-12)

**Symptom.** Two consecutive Windows acceptance runs failed identically at `[01-preconditions]`,
reporting

```text
node.exe / npm.cmd / npx.cmd could not be resolved from one installation; pass -NodeExecutable
```

**even when the script was invoked with `-NodeExecutable C:\Node22\node-v22.16.0-win-x64\node.exe`.**
The evidence's Node.js field stayed blank and DPAPI never started.

**Root cause.** Parameter binding and propagation were correct: the launcher declares
`[string] $NodeExecutable` and passes it verbatim as the resolver's first candidate. The failure was
one line further down the resolver:

```powershell
$nodeProbe = Invoke-IipsProcess -FilePath $nodePath -Arguments '--version' \
    -TimeoutMilliseconds $script:IipsVersionProbeTimeoutMilliseconds
```

`$script:IipsVersionProbeTimeoutMilliseconds` **was never assigned anywhere in `Iips-Common.ps1`.**
Both scripts run `Set-StrictMode -Version Latest`, under which reading an unset variable throws — and
that throw happens while the call's **arguments are being evaluated**, i.e. before
`Invoke-IipsProcess` is entered. The resolver's per-candidate `catch` therefore recorded
`node-version-probe-failed` for the `node.exe` probe of **every** candidate, every candidate was
skipped, and `NODE_TOOLCHAIN_NOT_RESOLVED` was thrown no matter what the caller supplied. The
`-NodeExecutable` path was examined and rejected for a reason that had nothing to do with the path.

The launcher then discarded the exception and printed a canned sentence, which is why both runs
showed the same text with no cause in it.

**Correction.**

1. `$script:IipsVersionProbeTimeoutMilliseconds = 10000` is defined in the library's pinned-constants
   block, with a comment stating why the definition is load-bearing.
2. The launcher records the resolver's **own** sanitized message (`$toolchainError`) in the
   `W02-WIN-01` failure row instead of a canned line, so the next failure names its reason codes.
3. The evidence header records the **resolved Node.js version** next to the path
   (`| Node.js | <node.exe> (node v22.16.0) |`), and `(not resolved)` when nothing resolved.
4. Deterministic PATH discovery, the co-location rule, the bounded probes and the floor check are
   unchanged; an explicit executable is still only accepted after all three probes pass.

**Tests.** `W-02-INF-07` (structural, runs everywhere) pins the property that failed: every
`$script:` variable the library reads is assigned in it, the probe bound is a positive integer used by
all three probes, `-NodeExecutable` is the first candidate, `npm.cmd`/`npx.cmd` are derived from that
executable's directory with named failures (`npm-missing-beside-node`, `npx-missing-beside-node`),
and the launcher propagates, records and reports as described above. `W-02-INF-05` now also executes,
against the real helper: an absent explicit path (must report `node-not-a-file`, proving the path was
used), a directory holding only `node.exe` (must report `npm-missing-beside-node`), a directory with
`node.exe` + `npm.cmd` only (must report `npx-missing-beside-node`), and — where the host has a
colocated trio — the operator's exact call shape, which must resolve **that** installation and report
its version. The structural validator gained rule 13 (StrictMode variable safety, allow-listed to
values the dot-sourced library assigns), proven by a negative control: deleting the definition fails
`every $script: variable is assigned before it is read (StrictMode safety)` and
`defines the toolchain version-probe bound` by name.

**Still required.** The acceptance run itself on the operator's host. Nothing here claims 19/19.

## 5. A. User-supplied Windows evidence (not executed by Arena)

The operator's earlier acceptance run on `DESKTOP-NO0NHTP` produced **18 entries, 18 PASS**, with a
locally patched helper and a locally patched launcher. That run proves the *approach*. It does not
cover the repository-owned helper rewritten here, so it is not a basis for closing W-02.

## 6. B. Arena-executed validation

| Check | Result |
| --- | --- |
| Structural validator, `windows-setup` | **PASS — 291 checks, 0 failed** |
| Structural validator, `windows-acceptance` | **PASS — 36 checks, 0 failed** |
| Negative controls (injected regressions) | **FAIL as intended**, on the exact named rules |
| `tests/w02_acceptance_process.test.ts` | **4 passed, 1 skipped** (PowerShell absent) |
| `tests/w02_acceptance_harness.test.ts` | **5/5** (updated to the stdin/runner contract) |
| `tests/dhan_w02_dpapi_acl.test.ts` | **16/16** (production ACL correction intact) |
| `tests/dhan_w02_dpapi_backend.test.ts` | **12/12** |
| `tsc` ×4, `vite` build | **PASS** |
| Package consumer (strict typecheck, `forbiddenHits`) | **PASS**, `[]` |
| Full suite | recorded with the commit |

Not proven in Arena: PowerShell 5.1 execution, the timeout/kill path on Windows, `cmd.exe` shim
startup, DPAPI, Windows ACLs.

## 7. C. Remaining Windows-host acceptance — ready to run

```powershell
cd H:\IIPS\iips-production-market-data
git pull
npm ci
npm run build:tsc
powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1
```

Expected evidence log:
`H:\IIPS\logs\w02-dpapi-acceptance\<yyyyMMddTHHmmssZ>\W02-DPAPI-ACCEPTANCE-EVIDENCE.md`

What the run must show:

* `[01-preconditions]` completes — toolchain resolution returns `node v…`, `npm.cmd`, `npx.cmd` from
  one directory, with no hang and no `NODE_TOOLCHAIN_NOT_RESOLVED`;
* **19 entries, all PASS**, including `W02-WIN-08B`;
* `W02-WIN-03` reports `directory DACL rewritten: yes`; `W02-WIN-04` reports `no` (the exact
  sequence that failed with `PrivilegeNotHeldException`), and the beside-file DACL is still applied
  and verified for both writes;
* no `-ForegroundColor` binding error, no `PROCESS_TIMEOUT`, no `ACL_APPLY_FAILED`, no raw stderr in
  the log.

Until that log exists, W-02 remains **PENDING** on Windows-host acceptance.

## 8. Scope

W-02 only. The production ACL correction (`dhan_dpapi_acl.ts`, `dhan_dpapi_process.ts`,
`dhan_dpapi_carrier.ts`, `index.ts`, the acceptance harness) is **unchanged**. W-03, W-04 and W-05 are
untouched; IRR and the IPO Screening Engine are untouched.
