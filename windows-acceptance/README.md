# W-02 Windows DPAPI acceptance

This directory holds the **Windows-host acceptance run** for W-02
(`docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md`, section 11). It closes the one
item the authoring environment could not prove: a real `ProtectedData.Protect` /
`Unprotect` round trip at `DataProtectionScope.CurrentUser` over both governed carriers.

Nothing here is part of the shipped product. `src/` never imports it, and it is not exported on any
package subpath.

## Run it

From the repository clone on the Windows machine, with `dist/` built:

```powershell
cd H:\IIPS\iips-production-market-data
powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1
```

Options: `-InstallRoot` (default `H:\IIPS`), `-EvidenceRoot` (default
`<InstallRoot>\logs\w02-dpapi-acceptance`), `-NodeExecutable` (full path to `node.exe`; otherwise
the shared `Resolve-IipsNodeToolchain` resolves one installation), `-NoPause`.

Prerequisites: Windows, PowerShell 5.1+, Node.js ≥ 22.13.0 (resolved from one installation by
`Resolve-IipsNodeToolchain`; pass `-NodeExecutable` to pin one), and `dist/` built
(`npm run build:tsc`).

The shared helper is resolved **inside the clone** (`<$repoRoot>\windows-setup\Iips-Common.ps1`),
so no personal copy and no machine-specific path is required. The harness runs through
`Invoke-IipsProcess`: explicit timeout, both streams drained asynchronously, the child killed on
timeout, and the generated values delivered on **stdin** only. No stderr file is written — stderr is
reduced to a byte count.
The acceptance directory is created under `<InstallRoot>\runtime\w02-acceptance-<UTC stamp>` —
outside every Git working tree — and is deleted again at the end of the run.

**Evidence log:** `<InstallRoot>\logs\w02-dpapi-acceptance\<UTC stamp>\W02-DPAPI-ACCEPTANCE-EVIDENCE.md`
(default `H:\IIPS\logs\w02-dpapi-acceptance\...`). The script prints the exact path at the end.

Exit codes: `0` every test passed · `1` at least one test failed · `2` prerequisite failure (the
DPAPI round trip never started).

## What it proves

Run only on a Windows host, and only if every entry in the evidence log is `PASS`:

| Test | Proves |
| --- | --- |
| `W02-WIN-01` | Windows, one resolved Node.js installation, built modules, acceptance directory outside Git |
| `W02-WIN-02` | real `ProtectedData.Protect` → production `Unprotect` child process → recovered value equal |
| `W02-WIN-03` | client id carrier written through the production atomic writer at `vault://dhan/client-id` |
| `W02-WIN-04` | access token carrier written through the production atomic writer at `vault://dhan/access-token` |
| `W02-WIN-05` | client carrier read back through `WindowsDpapiHostVaultBackend` and compared |
| `W02-WIN-06/06B` | token carrier read back, expiry metadata preserved |
| `W02-WIN-07` | carriers are distinct files with distinct ciphertext; a cross-read is refused (`SECRET_ID_MISMATCH`) |
| `W02-WIN-08` | directory and both carriers are owner-only (inheritance off, owner + SYSTEM); readiness is gated on the probe |
| `W02-WIN-08B` | the second carrier write does **not** rewrite an already-correct directory DACL, and a repeated application reports `changed=false` |
| `W02-WIN-09` | tampered ciphertext → `CARRIER_UNREADABLE`; missing carrier → `CARRIER_MISSING` |
| `W02-WIN-10` | no value in the result object, no plaintext on disk, no data on argv |
| `W02-WIN-11` | the acceptance directory and both carriers were removed |
| `W02-WIN-12` | the evidence log contains neither generated value |

## DACL application is production code

The owner-only DACL is applied by `src/providers/dhan/dhan_dpapi_acl.ts`
(`createWindowsDpapiAclApplier`), not by this directory. The applier reads the observed
descriptor, evaluates the exact policy and issues `Set-Acl` only when the descriptor really
differs — an unconditional second rewrite of an already-correct directory DACL raised
`PrivilegeNotHeldException` (HRESULT -2147024891) on the operator's host. Only the DPAPI
`protect` step (W-04 enrolment) remains a local static program in the harness.

## What it does not prove

That a real Dhan credential resolves (none exists in this run), that the vendor accepts an
authenticated request, or anything about production readiness. It is a store-level acceptance test.

## Safety properties

* **Throwaway values only.** Two values are generated in memory with a cryptographic RNG. No Dhan
  credential is read, requested or required.
* **No value on a command line.** The values reach the harness on **stdin**. Nothing is written to a
  file for the harness to read and no shell string is built.
* **No value in the evidence.** The harness emits no value, no ciphertext and no raw child-process
  stderr; the wrapper scans the whole log for both values before writing it and again after writing
  it. A hit is redacted and the run is marked `FAIL`.
* **No repair.** The run writes only inside the acceptance directory and deletes it afterwards.

## Exercise the process runner itself

The bounded runner (`Invoke-IipsProcess`) and the deterministic resolver can be executed directly,
without any DPAPI or Windows ACL involvement:

```powershell
$env:IIPS_POWERSHELL_RUNTIME_TESTS='1'; npm test
```

That runs `W-02-INF-05` against the real helper (timeout with a killed child, non-zero exit, both
streams, 200 KB on both streams at once, stdin delivery absent from the child's command line, a
resolved toolchain that is one installation, and a resolver failure that echoes no path).

CI always runs it: the main job sets the flag on `ubuntu-latest` (`pwsh`), and the
`W-02 process runner (PowerShell)` workflow runs the same case on `windows-latest`, i.e. on Windows
PowerShell 5.1 — the interpreter the launcher targets. The skip only applies to a local run on a host
with no PowerShell at all, so a developer machine without one does not fail on a missing interpreter.

If the case fails, the message names the cause: a child that could not be created reports
`PROCESS_START_FAILED: win32=<code> (<category>)` (or `type=<ExceptionType>`), and a child that never
appeared at its path reports `PROCESS_EXECUTABLE_NOT_FOUND`.

## Relationship to the automated suite

`tests/w02_dpapi_backend.test.ts` proves the backend's logic and every failure path with an injected
runner — deterministically, on any platform. `tests/w02_acceptance_harness.test.ts` proves this
directory's structure and that the harness refuses to run off Windows. Neither of them is a
substitute for the acceptance run on the Windows host.
