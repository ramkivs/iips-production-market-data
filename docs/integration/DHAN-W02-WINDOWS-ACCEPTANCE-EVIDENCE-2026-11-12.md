# DHAN W-02 — Windows DPAPI Acceptance Script and Evidence

**Status:** SCRIPT AND ARENA EVIDENCE COMPLETE — **Windows-host acceptance NOT EXECUTED (PENDING)**
**Work item:** W-02 (roadmap v1.1), closing section 11 of
`docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md`
**Implementation repository:** `ramkivs/iips-production-market-data`
**Branch:** `arena/84d1e063-iips-production-market-data`
**Arena verification commit:** `7aaa350` (W-02 backend) plus this item's commit (recorded below)
**Date:** 2026-11-12 (UTC)

> **The real Windows DPAPI acceptance test was NOT run in Arena.** The Arena environment is Linux and
> has no PowerShell, so no `ProtectedData.Protect`/`Unprotect` call was made, no carrier was written
> to a real DPAPI store, and no result is claimed for it. Section B is the procedure the operator
> runs on the Windows machine; it stays PENDING until that evidence log exists.

---

## A. What was executed in Arena

Arena has no Windows and no PowerShell. Everything below is what this environment can actually
prove, and it is recorded separately from the Windows-host acceptance.

| # | Check | Command | Result |
| --- | --- | --- | --- |
| A-1 | W-02 backend suite (injected runner; every failure path, readiness gate, atomicity, resolver integration) | `npm test` (or `node --test dist/tests/dhan_w02_dpapi_backend.test.js`) | **PASS — 12 tests, 12 passed, 0 failed** |
| A-2 | Acceptance artefacts: structure, rules compliance, harness drives production modules, off-Windows fail-closed behaviour | `node --test dist/tests/w02_acceptance_harness.test.js` | **PASS — 5 tests, 5 passed, 0 failed** |
| A-2b | Owner-only DACL policy, idempotent application, carrier regression (production applier; the Windows boundary is emulated) | `node --test dist/tests/dhan_w02_dpapi_acl.test.js` | **PASS — 16 tests, 16 passed, 0 failed** |
| A-3 | PowerShell structural validation (repo validator: forbidden constructs, brace balance, try/catch pairing, strict mode, stop preference, toolchain rule, final status, `-NoPause`, no bare node/npm/npx, no session exit) | `python3 windows-setup/.validate-scripts.py windows-acceptance` | **PASS — 26 checks passed, 0 failed** |
| A-4 | Harness JavaScript syntax | `node --check windows-acceptance/w02_dpapi_acceptance.mjs` | **PASS** |
| A-5 | TypeScript typecheck (all four project configs) + `vite` build + package consumer verification (strict typecheck, `forbiddenHits: []`) | `npm run build` then `npm run test:package-consumer` | **PASS** |
| A-6 | Full repository regression suite | `npm test` | **PASS — 1529 executed, 1528 passed, 0 failed, 1 pre-existing skip** |

### What A-1…A-6 do not prove

* No DPAPI call of any kind was made. `CryptProtectData` / `CryptUnprotectData` behaviour on a real
  Windows host is **unproven**.
* No real Windows ACL (`Get-Acl` / `Set-Acl`) was exercised; the DACL logic was proven only against
  injected evidence.
* The PowerShell wrapper has never been parsed or executed by PowerShell. A-3 is a structural
  validator, not a parse and not a run: **runtime behaviour of the wrapper is unproven** until the
  Windows run.

---

## B. Windows-host acceptance — PENDING (not executed)

### Exact execution command

From the repository clone on the Windows machine, after `dist/` is built:

```powershell
cd H:\IIPS\iips-production-market-data
powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1
```

Optional parameters: `-InstallRoot` (default `H:\IIPS`), `-EvidenceRoot` (default
`<InstallRoot>\logs\w02-dpapi-acceptance`), `-NodeExecutable` (full path to `node.exe`),
`-NoPause`. `-NoPause` is recommended for automation.

Prerequisites: Windows; PowerShell 5.1+; Node.js ≥ 22.13.0 resolvable by
`Resolve-IipsNodeToolchain`; `dist/` built (`npm run build:tsc`).

### Expected evidence-log location

```
H:\IIPS\logs\w02-dpapi-acceptance\<UTC yyyyMMddTHHmmssZ>\W02-DPAPI-ACCEPTANCE-EVIDENCE.md
```

The exact path is printed at the end of the run and recorded in the log header. The acceptance
directory `<InstallRoot>\runtime\w02-acceptance-<UTC stamp>\` is deleted by the script.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | every acceptance test passed on that host |
| `1` | at least one acceptance test failed (each entry is in the log) |
| `2` | prerequisite failure — the DPAPI round trip never started |

### The tests that log will contain

| Test ID | Description | PASS means |
| --- | --- | --- |
| `W02-WIN-01` | Prerequisites | Windows, one resolved Node.js installation, built modules, acceptance directory outside Git |
| `W02-WIN-02` | Real DPAPI round trip | `ProtectedData.Protect` → production `Unprotect` child process returns the generated value |
| `W02-WIN-03` | Client id carrier write | written atomically at `vault://dhan/client-id`, schema 1 accepted, no plaintext in the file |
| `W02-WIN-04` | Access token carrier write | written atomically at `vault://dhan/access-token`, schema 1 accepted, no plaintext in the file |
| `W02-WIN-05` | Client carrier read | production backend returns the generated client value |
| `W02-WIN-06` / `06B` | Token carrier read | production backend returns the generated token value; expiry metadata preserved |
| `W02-WIN-07` | Carrier separation | distinct files and ciphertext; a cross-read is refused with `SECRET_ID_MISMATCH` |
| `W02-WIN-08` | DACL + readiness | directory and both carriers owner-only (inheritance off, owner + SYSTEM); unprobed verdict false, probed verdict true |
| `W02-WIN-09` | Typed negatives | tampered ciphertext → `CARRIER_UNREADABLE`; missing carrier → `CARRIER_MISSING` |
| `W02-WIN-10` | Non-exposure | no value in the result object, no plaintext on disk, no data on argv |
| `W02-WIN-11` | Cleanup | the acceptance directory and both carriers are gone |
| `W02-WIN-12` | Evidence scan | the written log contains neither generated value |

Each entry carries the test ID, a description, the step or command, PASS/FAIL, an exit code and
sanitised output. The log never contains a generated value, a ciphertext or raw child-process
stderr.

### How this item is closed

W-02 becomes evidence-complete for the Windows round trip only when the operator returns the
`W02-DPAPI-ACCEPTANCE-EVIDENCE.md` file from that host with `Overall: PASS`. Until then the
disposition stays **PENDING**, exactly as section 11 of the W-02 record states.

---

## C. Artefacts added by this item

| File | Purpose |
| --- | --- |
| `windows-acceptance/Invoke-W02DpapiAcceptance.ps1` | Windows entry point: prerequisites, throwaway values, harness run over stdin, cleanup, evidence log |
| `windows-acceptance/w02_dpapi_acceptance.mjs` | Node harness: real DPAPI protect/unprotect, both carriers through the production atomic writer, reads through the production backend, separation, readiness, negatives, non-exposure |
| `windows-acceptance/README.md` | Operator instructions, command, evidence location, what is and is not proven |
| `tests/w02_acceptance_harness.test.ts` | Arena checks: artefact structure, project PowerShell rules, production-module wiring, off-Windows fail-closed behaviour, no product dependency |
| `docs/integration/DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md` | This record |

No production module changed. `src/` does not reference the acceptance harness, and no package
export surface changed (`forbiddenHits: []`).

## D. Blockers and remaining work

1. **Windows execution** — the only blocker for closing W-02's last verification item. Requires the
   operator's Windows host; nothing else is outstanding.
2. **W-04** still owns the interactive provisioning/rotation utility that will produce real carriers;
   the acceptance script's `protect` step is a deliberate local stand-in for that utility
   (documented in the harness header). The DACL step is no longer a stand-in: since the
   idempotency correction it is production code (`dhan_dpapi_acl.ts`), see
   `DHAN-W02-WINDOWS-ACL-IDEMPOTENCY-2026-11-12.md`.
3. **W-03** remains the consumer-side dependency recorded in the W-02 record: the allow-listed
   backend selector, an awaited `probeReadiness()` at daemon startup, and removal of key-path
   material from diagnostics.
