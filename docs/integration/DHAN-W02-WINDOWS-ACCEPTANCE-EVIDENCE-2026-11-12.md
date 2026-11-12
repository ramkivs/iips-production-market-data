# DHAN W-02 — Windows DPAPI Acceptance Script and Evidence

**Status:** **WINDOWS-HOST ACCEPTANCE EXECUTED — 19/19 PASS** (operator host, 2026-11-12). Reviewed
against roadmap v1.1 §5 (W-02) and §11; disposition **W-02 ACCEPTED** (section F).
**Work item:** W-02 (roadmap v1.1), closing section 11 of
`docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md`
**Implementation repository:** `ramkivs/iips-production-market-data`
**Branch:** `arena/84d1e063-iips-production-market-data`
**Reviewed head:** `0ea5bb112355a5dc5f9cb78f5dd8b7706f629ed6`
**Arena verification commit:** `7aaa350` (W-02 backend) plus this item's commits (recorded below)
**Date:** 2026-11-12 (UTC)

> **Arena did not run the Windows acceptance test.** This environment is Linux with no PowerShell, so
> no `ProtectedData.Protect`/`Unprotect` call, no real carrier write and no Windows ACL operation was
> performed here. The executed run recorded in section B was performed by the operator on the Windows
> host, and its evidence log is the primary record. Section A is what Arena can prove; section C is
> the procedure for a repeat run.

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
| A-7 | Current head `0ea5bb1` — targeted re-verification (rows A-1…A-6 record the earlier commit) | `node --test dist/tests/dhan_*.test.js`; `node --test dist/tests/w02_acceptance_process.test.js dist/tests/w02_acceptance_harness.test.js dist/tests/dhan_w02_dpapi_acl.test.js dist/tests/dhan_w02_dpapi_backend.test.js`; both validators | **PASS — Dhan 180/180; W-02 harness 5/5, ACL 16/16, backend 12/12, process 6 pass + 1 CI-executed; validator 310/0 (`windows-setup`) and 43/0 (`windows-acceptance`)** |
| A-8 | CI on head `0ea5bb1` (guarded suite, Windows PowerShell 5.1 runner job, executed-test-count check) | GitHub Actions | **PASS — 1536 executed / 0 failed; `runner (windows-latest)`, `runner (ubuntu-latest)`, `typecheck · build · test`, `executed test count` all green** |

### What A-1…A-6 do not prove

* No DPAPI call of any kind was made. `CryptProtectData` / `CryptUnprotectData` behaviour on a real
  Windows host is **unproven**.
* No real Windows ACL (`Get-Acl` / `Set-Acl`) was exercised; the DACL logic was proven only against
  injected evidence.
* The PowerShell wrapper has never been parsed or executed by PowerShell. A-3 is a structural
  validator, not a parse and not a run: **runtime behaviour of the wrapper is unproven** until the
  Windows run.

---

## B. Windows-host acceptance — EXECUTED (operator host, 2026-11-12)

Run facts, transcribed from the evidence log the script wrote on the host:

| Field | Value |
| --- | --- |
| Started (UTC) | `2026-11-12T14:56:40.7865894Z` |
| Finished (UTC) | `2026-11-12T14:57:03.1898297Z` |
| Host | `DESKTOP-NO0NHTP`, principal `USER` |
| PowerShell | `5.1.26100.9818` (Windows PowerShell 5.1 — the host the launcher targets) |
| Node.js | `C:\Node22\node-v22.16.0-win-x64\node.exe (node v22.16.0)` |
| Acceptance directory | `H:\IIPS\runtime\w02-acceptance-20261112T145640Z` (removed) |
| Values | two, generated in memory with the cryptographic RNG; no Dhan credential read, requested or used; no vendor call |

### B.1 Results — 19 entries, 19 PASS, 0 FAIL, overall PASS

| # | Test ID | Step / command | Result | Sanitised output |
| --- | --- | --- | --- | --- |
| 1 | `W02-WIN-01` | `OSVersion.Platform` | PASS | Windows 10.0.26300.0 |
| 2 | `W02-WIN-01` | `Resolve-IipsNodeToolchain -NodeExecutable` | PASS | node v22.16.0 at `C:\Node22\node-v22.16.0-win-x64\node.exe` |
| 3 | `W02-WIN-01` | `Test-Path w02_dpapi_acceptance.mjs` | PASS | harness found next to this script |
| 4 | `W02-WIN-01` | `Test-Path dist\src\providers\dhan\dhan_dpapi_vault_backend.js` | PASS | production modules are built |
| 5 | `W02-WIN-01` | walk parents for `.git` | PASS | no `.git` found above `-InstallRoot` |
| 6 | `W02-WIN-02` | `ProtectedData.Protect` → production unprotect child → compare | PASS | ciphertext produced and decrypted by the OS; recovered value equals the generated value |
| 7 | `W02-WIN-03` | `writeDpapiCarrierAtomically(clientId)` → parse → plaintext scan | PASS | carrier written, schema version accepted, no plaintext in the carrier file, directory DACL rewritten: **yes** |
| 8 | `W02-WIN-04` | `writeDpapiCarrierAtomically(accessToken)` → parse → plaintext scan | PASS | carrier written, schema version accepted, no plaintext in the carrier file, directory DACL rewritten: **no** |
| 9 | `W02-WIN-05` | `WindowsDpapiHostVaultBackend.readSecret` (client) | PASS | decrypted value equals the generated value |
| 10 | `W02-WIN-06` | `WindowsDpapiHostVaultBackend.readSecret` (token) | PASS | decrypted value equals the generated value |
| 11 | `W02-WIN-06B` | `record.expiresAt` vs enrolled `expiresAtUtc` | PASS | expiry metadata matched |
| 12 | `W02-WIN-07` | carrier paths / ciphertext / cross-read | PASS | carriers are distinct and a cross-read is refused with `SECRET_ID_MISMATCH` |
| 13 | `W02-WIN-08` | `describeReadiness` → `probeReadiness` → production `describe-acl` | PASS | unprobed verdict false, probed verdict true, directory and both carriers owner-only |
| 14 | `W02-WIN-08B` | second `writeDpapiCarrierAtomically` + second applier | PASS | the second carrier write did not rewrite the directory DACL; second application reported `changed=false, verified=true` |
| 15 | `W02-WIN-09` | tampered carrier + missing carrier through the production backend | PASS | tampered → `CARRIER_UNREADABLE`, missing → `CARRIER_MISSING` |
| 16 | `W02-WIN-10` | serialise result, walk every file, inspect production argv | PASS | no value in the result object, no plaintext on disk, no data on argv |
| 17 | `W02-WIN-00` | node harness exit code | PASS | harness exit code 0 |
| 18 | `W02-WIN-11` | `Remove-Item -Recurse -Force` | PASS | the acceptance directory no longer exists |
| 19 | `W02-WIN-12` | scan before writing | PASS | neither generated value appears in the log |

### B.2 Independent checks performed on this evidence (not acceptance by summary)

The summary line is not accepted on its own. Each of the following was checked against the published
code at `0ea5bb1`:

1. **Row accounting is exact.** The published launcher emits 8 pass-path rows (`W02-WIN-01` ×5,
   `W02-WIN-00`, `W02-WIN-11`, `W02-WIN-12`) and the published harness emits 11 (`W02-WIN-02`…`-10`).
   8 + 11 = 19, which is the number of entries supplied — no row is missing and none is invented. The
   harness also contains `W02-WIN-10B`, but it is appended **only** when the pre-emit leak guard
   fires; its absence is the expected pass-path outcome, not a skipped check.
2. **Every sanitised phrase is traceable.** All 16 non-numeric output strings were matched to the
   published launcher or harness text (e.g. `harness found next to this script`,
   `ciphertext produced and decrypted by the OS; recovered value equals the generated value`,
   `carriers are distinct and a cross-read is refused`, `changed=false, verified=true`,
   `neither generated value appears in the log`). No output in the evidence is unattributable.
3. **The run used the corrected launcher, not an older copy.** The header field
   `…\node.exe (node v22.16.0)` and the row-2 text `node v22.16.0 at …` can only be produced by the
   `-NodeVersion` propagation added in `0ea5bb1`; the pre-fix script printed only the path. The
   toolchain row also proves the `-NodeExecutable` propagation defect is fixed **on the host**: an
   explicitly supplied `node.exe` resolved, its directory supplied `npm.cmd`/`npx.cmd`, and the
   version passed the floor check.
4. **The evidence matches the production code, row by row.** `SECRET_ID_MISMATCH`,
   `CARRIER_UNREADABLE`, `CARRIER_MISSING`, `UNKNOWN_SCHEMA_VERSION`, `VERSION_MISMATCH`,
   `EXPIRED`/`REVOKED` and the `{changed, verified}` result shape all exist in
   `dhan_dpapi_vault_backend.ts` / `dhan_dpapi_acl.ts`; the "unprobed verdict false / probed verdict
   true" semantics are the `lastProbe` contract in that backend. The harness imports
   `dist/src/providers/dhan/{dhan_dpapi_carrier,dhan_dpapi_process,dhan_dpapi_acl,dhan_dpapi_vault_backend,dhan_local_vault_resolver}`,
   `src/security/secret_ref` and `dhan_config` — the production tree, not a stand-in.
5. **Idempotency is evidenced, not asserted.** Row 7 `directory DACL rewritten: yes` on the first
   write and row 8 `no` on the second, plus row 14's `changed=false, verified=true`, are three
   independent observations of the same invariant.
6. **No bypass, no network.** The harness has no `fetch`/`http`/`net` import, no environment switch,
   no dry-run path, no mock, and no skip: a failing row sets exit code 1 and the launcher copies the
   failure into the log. The ACL *application* is production code (`createWindowsDpapiAclApplier`);
   only `Protect` and the stand-in `Set-Acl` program text are harness-local, which is exactly the
   boundary W-02 draws (provisioning is W-04).
7. **Cleanup and non-exposure are terminal, not best-effort.** Rows 18 and 19 run after the harness
   and before the log is finalised; the log text is scanned for both generated values before it is
   written.
8. **Nothing beyond E3 is claimed.** The run is local Windows operational verification (roadmap §8,
   class E3) of the secret store. It says nothing about Dhan authentication (M1), any quote or
   history response, or production readiness — the evidence's own *does not prove* section is
   accurate and is retained as written.

### B.3 What this run does not prove

Real `ProtectedData` behaviour for a genuine Dhan credential (none exists in the run), vendor
acceptance of a credential (M1, E4), any quote/historical payload, and production readiness. It also
does not re-run the standalone process-runner suite (`W-02-INF-05`) on that host; that case is
executed in CI on `windows-latest` (Windows PowerShell 5.1) and `ubuntu-latest`, and the resolver half
of it is additionally proven on the host by row 2.

---

## C. Repeat-run procedure (the procedure this run followed)

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
| `W02-WIN-08B` | Idempotent re-application | a repeated directory-DACL application reports `changed=false, verified=true` and issues no `Set-Acl` |
| `W02-WIN-10B` | (conditional) output guard | present **only** when the pre-emit scan detects a value; its absence is the pass-path outcome |
| `W02-WIN-09` | Typed negatives | tampered ciphertext → `CARRIER_UNREADABLE`; missing carrier → `CARRIER_MISSING` |
| `W02-WIN-10` | Non-exposure | no value in the result object, no plaintext on disk, no data on argv |
| `W02-WIN-11` | Cleanup | the acceptance directory and both carriers are gone |
| `W02-WIN-12` | Evidence scan | the written log contains neither generated value |

Each entry carries the test ID, a description, the step or command, PASS/FAIL, an exit code and
sanitised output. The log never contains a generated value, a ciphertext or raw child-process
stderr.

### How this item was closed

W-02 became evidence-complete for the Windows round trip when the operator returned the
`W02-DPAPI-ACCEPTANCE-EVIDENCE.md` file from that host with `Overall: PASS` (2026-11-12, section B).
The disposition is **ACCEPTED** (section F). A repeat run is still the correct way to re-verify after
any change to the backend, the carrier grammar or the DACL policy.

---

## D. Artefacts added by this item

| File | Purpose |
| --- | --- |
| `windows-acceptance/Invoke-W02DpapiAcceptance.ps1` | Windows entry point: prerequisites, throwaway values, harness run over stdin, cleanup, evidence log |
| `windows-acceptance/w02_dpapi_acceptance.mjs` | Node harness: real DPAPI protect/unprotect, both carriers through the production atomic writer, reads through the production backend, separation, readiness, negatives, non-exposure |
| `windows-acceptance/README.md` | Operator instructions, command, evidence location, what is and is not proven |
| `tests/w02_acceptance_harness.test.ts` | Arena checks: artefact structure, project PowerShell rules, production-module wiring, off-Windows fail-closed behaviour, no product dependency |
| `docs/integration/DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md` | This record |

No production module changed. `src/` does not reference the acceptance harness, and no package
export surface changed (`forbiddenHits: []`).

## E. Blockers and remaining work

1. ~~**Windows execution**~~ — **CLOSED 2026-11-12**: executed on the operator's host, 19/19 PASS
   (section B). No blocker remains against the W-02 exit criteria.
2. **W-04** still owns the interactive provisioning/rotation utility that will produce real carriers;
   the acceptance script's `protect` step is a deliberate local stand-in for that utility
   (documented in the harness header). The DACL step is no longer a stand-in: since the
   idempotency correction it is production code (`dhan_dpapi_acl.ts`), see
   `DHAN-W02-WINDOWS-ACL-IDEMPOTENCY-2026-11-12.md`.
3. **W-03** remains the consumer-side dependency recorded in the W-02 record: the allow-listed
   backend selector, an awaited `probeReadiness()` at daemon startup, and removal of key-path
   material from diagnostics.

---

## F. Independent review and W-02 gate decision (2026-11-12)

Reviewed against roadmap v1.1 (`DHAN-LIVE-ROADMAP-2026-11-11`, IRR `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`,
blob `4bea162db299cab844edf7d0d025dd5a56c81d0e`) §5 W-02 (scope, verification, exit criteria), §8
(evidence ladder), §9.1 (L3), and §11 (recommended work item). Every criterion below was checked
against the published implementation at `0ea5bb1` and the executed evidence in section B.

| # | W-02 criterion (roadmap) | Evidence | Verdict |
| --- | --- | --- | --- |
| 1 | New `LocalHostVaultSecretBackend` with `backendId`, `describeReadiness()`, `readSecret(ref, asOfUtc)` | `WindowsDpapiHostVaultBackend` in `dhan_dpapi_vault_backend.ts`; exercised rows 9–10, 13 | met |
| 2 | `liveResolutionSupported: true` only when **both** carriers exist, satisfy the D-1 DACL, parse against a known schema, and a probe read succeeds; otherwise `false` with a **non-locating** summary | row 13 (unprobed false → probed true); fixed `MESSAGES`/`SUMMARY_OK` strings carry no path; backend suite W-02-08 | met |
| 3 | Two independent carriers, versioned envelope, unknown `schemaVersion` refused (D-1) | rows 7, 8, 12; grammar pinned in the backend record §2; backend suite W-02-02/W-02-05 | met |
| 4 | Metadata validation: `secretId`, `vaultProvider`, envelope `version`, `expiresAtUtc` ISO-8601, `rotatedAtUtc` sanity | row 11 (`expiry metadata matched`), row 12 (`SECRET_ID_MISMATCH`); `VERSION_MISMATCH`/`UNKNOWN_SCHEMA_VERSION` covered by injected-runner tests | met |
| 5 | Distinct, scrubbed outcomes for missing / unreadable / corrupt / expired / version mismatch / child failure, each a `DhanVaultResolutionError` with its own `reason`, never the underlying message | rows 15 (`CARRIER_UNREADABLE`, `CARRIER_MISSING`); 13 fixed reasons in `MESSAGES`, all mapped to a `DhanVaultMappedCode`; backend suite W-02-05/W-02-07 | met |
| 6 | Secret held in one short-lived binding; never in a field, log, diagnostic or error | row 16 (`no value in the result object`), row 19 (`neither generated value appears in the log`); no instance field holds material | met |
| 7 | Child-process communication on **stdin**, **stdout only**; never argv, temp file or shell history; stderr only to classify, never surfaced | row 16 (`no data on argv`); `dhan_dpapi_process.ts` writes the request to stdin (`dpapiPowerShellArgs`, `-EncodedCommand`); backend suite W-02-11/W-02-12 | met |
| 8 | Atomicity awareness: a carrier failing validation is reported invalid, never silently repaired; rotation is write-beside → verify → swap | rows 7/8 (two atomic writes), row 14 (no-op re-application); backend suite W-02-04 and ACL suite W-02-ACL-13 | met |
| 9 | **Verification:** injected-runner unit tests for every failure path **+ one real Windows round trip with a generated throwaway secret**, proving store→read→compare and non-appearance in argv, test stdout, logs and errors | rows 6 (round trip), 9–10 (read through the production backend), 16, 19; injected-runner suites (backend 12, ACL 16) | met |
| 10 | **Exit:** backend resolves a synthetic secret on Windows; every failure path distinct and fail-closed; no secret in test output; existing Dhan suites green | rows 6, 9, 10, 15, 16, 19; A-7 Dhan 180/180; A-8 CI 1536/0 | met |
| 11 | `DisabledWindowsHostVaultBackend` remains the default and is not deleted | `dhan_local_vault_resolver.ts:174` (`options.backend ?? new DisabledWindowsHostVaultBackend()`); backend suite W-02-09 | met |
| 12 | D-1 DACL requirement: directory **and** carriers owner-only (inheritance off; owner + SYSTEM); a carrier readable by another principal is unusable | row 13 (owner-only, directory and both carriers), rows 7/8/14 (idempotent rewrite); ACL suite 16/16 incl. deviations failing closed | met |
| 13 | Changes confined to the item and its dependencies; no IRR change; no unrelated functionality; no credential use | branch diff `a624d06..0ea5bb1` (28 files) is confined to `src/providers/dhan/`, `src/security/`, `tests/`, `windows-setup/`, `windows-acceptance/`, `docs/integration/`, `.github/workflows/` — i.e. W-01/W-02 and their tooling; no Broker Import, Portfolio, IPC or Dhan Stage 1 file; no IRR file changed; rows 1–19 record throwaway values and no vendor call | met |

**Decision: W-02 ACCEPTED.** All 13 criteria are met; the exit criteria are satisfied by executed
evidence at class E3 (§8) plus E1 for the injected-runner failure paths. No unmet criterion, no
evidence gap and no implementation defect was found in this review.

**What this decision does not say.** It does not advance any milestone. M1 (first live
authentication) requires real credentials and a real vendor interaction (E4) and is untouched by this
run. No production readiness and no Dhan connectivity is claimed.

### F.1 Next roadmap item — W-03 (not started, not implemented here)

W-03 · *Add daemon backend selection and honest egress diagnostics* (roadmap §5, Phase 1,
Appendix A). It is the next sequential item: W-01 and W-02 are complete, W-03 is the only Phase 1
item whose prerequisites are now satisfied, and M1's critical path
(`D-1 → D-2 → W-01 → W-02 → **W-03** → W-04 → D-6 → W-06`) continues there.

| Element | Roadmap content |
| --- | --- |
| Objective | Let the operator select the real backend without code edits, and show the selection without revealing locations |
| Repository owner | IPD |
| Prerequisites | **W-02** (satisfied — this record) and **D-7** |
| Scope | Allow-listed selector (e.g. `IIPS_DHAN_VAULT_BACKEND=disabled/windows-dpapi`, default `disabled`) threaded into `startMarketDataDaemon`, unknown values refuse startup; extend `MarketDataDaemonDiagnostics` and the startup line with backend id, backend readiness, egress mode and credential-readiness code; **remove the key-path material derivable from `describeDhanConfig`**, per D-7. Covers B-3, B-15 |
| Verification | Unknown selector refused; `disabled` still yields `vendorEgress=DISABLED_PRE_ACCESS`; `windows-dpapi` with a fake backend yields `IPD_SERVER_HTTPS`; an assertion that the diagnostics object and startup line contain no `vault://` string, no path and no secret |
| Exit criteria | Operator can switch backends by environment; the startup line states which egress is active and reveals no location |
| Enables | W-06, W-36 |

**Prerequisite D-7 is unrecorded in IPD.** The roadmap requires D-7 (provider state model, the
meaning of "verify connection", and the normative diagnostics disclosure policy) to exist as a
decision record before W-03. At this head there is **no D-7 artefact in this repository** — the
roadmap text (IRR §5 D-7) defines it, but the IPD record it requires has not been written. This does
not affect the W-02 decision (D-7 is not a W-02 prerequisite, and W-02's own prerequisites W-01, D-1
and D-2 are satisfied and recorded); it is the first step W-03 must take. No D-7 content is invented
or assumed here.
