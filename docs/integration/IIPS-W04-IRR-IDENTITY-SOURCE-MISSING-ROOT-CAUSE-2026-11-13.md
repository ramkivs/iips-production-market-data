# Snapshot-to-Live W04 — IRR identities endpoint returns 503 `IDENTITY_SOURCE_MISSING`: root cause

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)); follows the [identities-endpoint assessment](IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md) and the [W04 evidence assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md)
**Subject:** on the Windows host, `GET /api/investment/portfolio/<portfolioId>/identities` answers HTTP 503 with `IDENTITY_SOURCE_MISSING`
**Repositories read:** IRR `ramkivs/iips-review-recovered` at `main` `08411bcd6d782a601fe5c82cc9983d076831148d` (the build the host reported) and at the head of open PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`; IPD `ramkivs/iips-production-market-data` at `main` `a624d06f66c376f03a29571cb24c3f0f77f0c24d`, at the host-reported checkout `1fded9d3fb75df99e9c008176ecc6407645ceb70`, and at the head of PR #156, `c260a82`

**Root cause.** The IRR server reads three JSON files from `<IIPS_DATA_DIR>\investment\identity` on every identities request. On `main`, `IDENTITY_SOURCE_MISSING` has exactly one meaning: at least one of those three files does not exist in the directory the server process resolved. Neither repository tracks these files for operational use, and no setup script, launcher step or IPD artifact creates them. They are operator-provisioned data, and the 503 is the designed fail-closed answer for a host on which they have not been placed. It is not a service fault, and it is not a defect in either repository.

**Not determined here.** Which of the three files is absent, which directory the host process actually resolved, and whether the files exist anywhere else on the host. The repositories cannot answer these. Section 9 gives a read-only diagnostic that does.

**W04 status is unchanged: PARTIALLY COMPLETE and NOT ACCEPTED** until actual host identity evidence is collected and independently reviewed.

Nothing on the Windows host was read or requested. No identity data was created or downloaded. No configuration, portfolio data, source, test, contract or acceptance criterion was changed, and no service was restarted.

**Later record (2026-11-14, host completion).** The condition this record explains no longer holds on the host. The operator reports that the identity directory was provisioned on 2026-11-14 and that the running transport loads the files; the identities route no longer answers `identity-sources-unavailable`. The analysis below is kept as the record of the state before that. See [host completion and reconciliation](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md).

## 1. How to read this record

| Label | Meaning |
|---|---|
| **R** | Verified here from tracked repository content: by reading source, by running the repository's own tests, or by running unmodified application code on synthetic input. |
| **D** | Derived by reasoning from **R**. The condition it depends on is stated. |
| **H** | Reported by the operator from the Windows host. Not verified here. |
| **U** | Not observable from the repositories. |

Line numbers refer to IRR `08411bc` unless PR #563 is named, and to IPD `a624d06` for `windows-setup/03-Start-IipsServers.ps1`, which is identical at `a624d06`, at `1fded9d` and on this branch (**R**).

Host facts used (**H**): five services running under the labels `ipd-market-data`, `ipd-ipc`, `irr-transport`, `irr-frontend`, `ipd-shell`; a PID manifest named `iips-pids-20261113-182754.json` in the log directory; the identities route answers 503 with `IDENTITY_SOURCE_MISSING`; host checkouts IRR `08411bc` and IPD `1fded9d`.

## 2. Answers

| Question | Answer | Label |
|---|---|---|
| Why 503? | A required identity file is absent from the directory the server resolved. The check is made before any portfolio is read. | **R** |
| Is it a service availability problem? | No. The route answered, with its own bounded error. The IPD IPC service is not contacted on this path. | **R** |
| How many mandatory sources? | Three files, all required together: `eligible-roster.json`, `listing-map.json`, `corporate-actions.json`. | **R** |
| What configuration does the process need? | One variable, `IIPS_DATA_DIR`, in the environment of the IRR server process. Without it the directory is `.iips-data` under the process working directory. | **R** |
| Are the sources repository-tracked? | No. The runtime files are host-local. IRR tracks a synthetic test fixture and seven single-issuer evidence sets; neither is an operational roster. IPD tracks none. | **R** |
| Does PR #563 change this? | Not the cause. Same three files, same directory. It changes the error detail: one issue per missing file, and no path in the body. | **R** |
| Does the data already exist on the host? | Unknown. | **U** |
| Can it be fixed by configuration alone? | Only if the three files already exist on the host in another directory. Otherwise it needs data, and the choice of the data source is the owner's. | **D** |
| Is a restart needed once the files are in place? | No. The files are read on every request. | **R** |

## 3. The error path

| Step | Where | What happens | Label |
|---|---|---|---|
| 1 | `frontend/server/executive-transport.ts` l.929–936 | A URL matching `/api/investment/portfolio/<id>/identities` is passed to `handleHoldingIdentityRequest` with the portfolio holdings provider. | **R** |
| 2 | `frontend/server/investment/holding-identity-transport.ts` l.152–168 | Method other than `GET`/`HEAD` → 405. Unparseable portfolio id → 400. | **R** |
| 3 | same, l.170 | `loadRuntimeIdentitySources()` is called. No resolver or source object is cached between requests. | **R** |
| 4 | `iips-platform/src/investment/identity/runtime.ts` l.30–31 | `loadIdentitySourcesFromDir(resolveIdentityDir(dataRoot))`, with no `dataRoot` on this path. | **R** |
| 5 | `iips-platform/src/investment/identity/sources.ts` l.557–560 | Root = `process.env.IIPS_DATA_DIR`, or `.iips-data` under `process.cwd()` when the variable is not set. Directory = `<root>/investment/identity`. | **R** |
| 6 | same, l.563–579 | `existsSync` on the three file paths. If any is absent: one issue, `file: 'eligible-roster.json'`, `code: 'IDENTITY_SOURCE_MISSING'`, `subject: <the directory>`. The files are not opened. | **R** |
| 7 | `holding-identity-transport.ts` l.171–181 | Not available → 503, `error: 'identity-sources-unavailable'`, with `issues` reduced to `file`, `code`, `subject`. Return. | **R** |
| 8 | same, l.184–191 | Only now are the holdings read (one IPC `portfolio.get`). Failure → 503 `holdings-unavailable`. | **R** |
| 9 | same, l.193–214 | 200 with the resolved identities and `directory.rosterVersion`, `rosterDigest`, `rosterDataClass`. | **R** |

Three properties of step 6 on `main` matter for reading the host result (**R**, reproduced in section 6):

1. The single issue always names `eligible-roster.json`, whichever file is absent, and for any number of absent files. The body does not say which file is missing.
2. `subject` is the absolute directory the process resolved. It is the one place where the running process states its effective `IIPS_DATA_DIR`. It is a host path and must not be published.
3. The code is produced by absence only. A file that exists but is not JSON gives `INVALID_JSON`; a different `schemaVersion` gives `SCHEMA_MISMATCH`. Neither is reported as missing.

The same loader gates `GET /api/investment/companies?q=` (`frontend/server/investment/discovery-transport.ts` l.175), which returns the same 503 in the same state (**R**).

## 4. The mandatory sources

| File | Top-level shape | Schema | Version and digest | Tracked for runtime use? |
|---|---|---|---|---|
| `eligible-roster.json` | `schemaVersion`, `rosterLabel`, `issuers[]`, `securities[]` | `IIPS_INVESTMENT_IDENTITY_V1` | None declared in the file. Computed at load. | No |
| `listing-map.json` | `schemaVersion`, `entries[]` | `IIPS_INVESTMENT_IDENTITY_V1` | Same | No |
| `corporate-actions.json` | `schemaVersion`, `actions[]` | `IIPS_INVESTMENT_IDENTITY_V1` | Same | No |

- **Schema.** One constant for all three, `IDENTITY_SCHEMA` (`iips-platform/src/investment/identity/types.ts` l.158) (**R**).
- **Version and digest.** No file carries a version field, and no expected digest is pinned anywhere in IRR or IPD. The loader computes a canonical `sha256:` digest of each parsed source and uses the same value as its version (`sources.ts` l.524–540). So the loader accepts any set that validates; it does not check that the set is a particular one (**R**).
- **Data class.** `rosterDataClass` is `SYNTHETIC_FIXTURE` when `rosterLabel` matches `synthetic` (any case), otherwise `OPERATOR_SUPPLIED` (`sources.ts` l.542–544) (**R**).
- **All or nothing.** The three load together. One absent or invalid file makes the whole set unavailable (**R**).
- **Host-local by design.** `.iips-data/` is git-ignored (`.gitignore` l.153). `.env.example` l.49 carries `IIPS_DATA_DIR` commented out. No `.env.local` is tracked (**R**).

What the repositories do track (**R**, `irr-loader-checks-output.txt`):

| Set | Content | On `main` | On PR #563 |
|---|---|---|---|
| `iips-platform/tests/investment/fixtures/identity` | Synthetic: 8 issuers, 11 securities, 15 listings, 9 actions | Valid, `SYNTHETIC_FIXTURE` | Valid |
| Seven directories under `evidence/real-issuer/` | One issuer and one security each, 1–2 listings, 0 actions | All valid, `OPERATOR_SUPPLIED` | Six valid; `WI8-INDUSTRIALS-KEC` refused (`MISSING_REQUIRED_ARRAY`) |

None is a roster for a 64-holding portfolio. IRR has no tool that produces operational identity files; `writeM1IdentityDir` (`frontend/server/investment/demo/m1Data.ts` l.215) writes synthetic demo data only (**R**).

IPD has no producer, schema or contract for these files: a search of `origin/main` and PR #156 for the schema name and the three file names finds only an audit document (**R**). The IPD P04 security master and the P7 registry are IPD's own sources in IPD's own formats. The [W04 evidence assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md) §7 records how little they overlap with the tracked IRR rosters.

IRR's own documents assign the files to the host (**R**):

- `docs/integration/IID-P6A-RUNTIME-DEPENDENCY-ASSESSMENT-2026-11-09.md` l.52, dependency D1: "Absent by default", required "from the authoritative issuer source", execution owner "User host".
- same, l.167: "Place the three authoritative identity files (D1). Do not copy test fixtures into an operational data domain."
- `docs/OPERATOR_RUNBOOK.md` l.863: `identity-files` is a user-host action, "place the three governed JSON files in `<IIPS_DATA_DIR>/investment/identity/`".

## 5. Location and process configuration on Windows

IRR has no launcher. The tracked launcher is IPD `windows-setup/03-Start-IipsServers.ps1` (**R**):

| Fact | Where |
|---|---|
| Defaults: `-InstallRoot 'H:\IIPS'`, `-RuntimeRoot <InstallRoot>\runtime`, `-LogRoot <InstallRoot>\logs`, `-TransportPort 8787`, `-BindAddress 127.0.0.1` | parameter block |
| `$dataDir = <RuntimeRoot>\iips-data`. The launcher creates this directory and nothing beneath it. | l.224, l.230 |
| The transport environment sets `IIPS_DATA_DIR = $dataDir`. | l.246–251 |
| `irr-transport` is `npm.cmd run server:dev` with working directory `<InstallRoot>\iips-review-recovered\frontend`. | l.317–319 |
| `server:dev` is `tsx --env-file-if-exists=../.env.local --env-file-if-exists=.env.local server/executive-transport.ts`. | IRR `frontend/package.json` l.14 |
| The PID manifest `<LogRoot>\iips-pids-<stamp>.json` records labels, PIDs, ports and log files. It records neither `RuntimeRoot` nor any environment value. | l.378 onward |

Consequences:

- With the tracked launcher and default parameters, the directory the server reads is `<InstallRoot>\runtime\iips-data\investment\identity`. No tracked step creates `investment\identity` (**D**, from the rows above).
- A value in the process environment takes precedence over `.env.local`; the file applies only when the variable is not already set. Checked with Node.js 22 on a scratch directory (**R**). So with the tracked launcher, `.env.local` cannot redirect the directory.
- If the server were started without `IIPS_DATA_DIR`, it would read `<InstallRoot>\iips-review-recovered\frontend\.iips-data\investment\identity` (**D**).

**One discrepancy to resolve on the host.** Every tracked version of the launcher starts four labels: `ipd-ipc`, `irr-transport`, `irr-frontend`, `ipd-shell`. None starts `ipd-market-data`. A search of all 301 fetched IPD refs under `windows-setup`, and of all IRR refs, finds no such label (**R**). The host reported five (**H**). The host launcher is therefore a variant that is not in either repository, and what it puts in the `irr-transport` environment cannot be read from here (**U**). The diagnostic of section 9 settles it by asking the running process.

## 6. Reproduction on IRR's real server

`irr-identity-source-missing-probe.ts` starts IRR's exported HTTP server, unmodified, on a loopback port and sends real HTTP requests. Every input is synthetic. Output is byte-identical across two runs on `main`.

| State | `main` `08411bc` | PR #563 `d10afbb` |
|---|---|---|
| S0. `investment\identity` does not exist | 503 `identity-sources-unavailable`; 1 issue, `eligible-roster.json` / `IDENTITY_SOURCE_MISSING`; `subject` is the absolute directory; no IPC request; nothing created | 503; 3 issues, one per file; `subject` is the file name |
| S1. `IIPS_DATA_DIR` not set | Same as S0; the directory is under the working directory | Same as S0 |
| S2. Two files present, `corporate-actions.json` absent | Same single issue, still naming `eligible-roster.json` | 1 issue naming `corporate-actions.json` |
| S3. Valid synthetic set | 200, `SYNTHETIC_FIXTURE`, one IPC `portfolio.get` | Sources load (the probe has no IPC peer at this commit, so 503 `holdings-unavailable`) |
| S4. Roster is not JSON | 503 `INVALID_JSON` | Same |
| S5. Roster has another `schemaVersion` | 503 `SCHEMA_MISMATCH` | Same |
| S6. Roster path is a directory | 503 `holdings-unavailable`, no issue (the read error is not classified) | 503 `IDENTITY_SOURCE_UNREADABLE` |
| S7. Roster saved with a UTF-8 byte-order mark | 503 `INVALID_JSON` | Same |

The states were applied one after another to one running server, and each answer followed the files as they were at that moment. That is the evidence that no restart is needed (**R**).

S6 and S7 are worth knowing before files are placed: on `main` an unreadable file is not reported as an identity problem at all, and a file saved by an editor that adds a byte-order mark is refused.

## 7. `main` against PR #563

PR #563 is open and mergeable, 6 commits ahead of and 2 behind `main` (**R**).

| Aspect | `main` `08411bc` | PR #563 `d10afbb` |
|---|---|---|
| File names, schema, directory resolution, `IIPS_DATA_DIR` | — | Unchanged. `runtime.ts` has no difference. |
| Missing-file report | One issue, always `eligible-roster.json`, `subject` = absolute directory | One issue per missing file, `subject` = file name, no path |
| Unreadable file | Falls through to `holdings-unavailable` | `IDENTITY_SOURCE_UNREADABLE` |
| Validation | Missing or empty arrays in the listing map and the action table are accepted | Adds `INVALID_ROOT_TYPE`, `MISSING_REQUIRED_ARRAY`, `INVALID_ARRAY_TYPE`, `INVALID_RECORD_TYPE`, `INVALID_FIELD_TYPE`, `INVALID_DATE`, `MISSING_ROSTER_LABEL`, `EMPTY_ROSTER_ISSUERS`, `EMPTY_ROSTER_SECURITIES`, `EMPTY_LISTING_MAP` |
| 200 response | Identity fields as assessed earlier | Adds `series`, `d114SecurityIdentity`, `outcomeClass`, `listingId` and directory counts |
| New source or new location | — | None |

So (**D**): merging PR #563 would not clear the host 503, because it adds no data and no new location. It would make the answer more useful, and it would be stricter about what it accepts: a set that loads on `main` can be refused on PR #563, as the tracked `WI8-INDUSTRIALS-KEC` set is. Files placed on the host should be checked against both.

## 8. Does the data already exist on the host?

Unknown (**U**). What the repositories establish:

- Nothing tracked creates the files, so they are on the host only if someone placed them (**R**).
- The earlier host capture reported `securityIdentity` populated for 1 of 64 holdings (**H**). That field comes from the IPD capture path, not from these files, and says nothing about them (**R**, previous assessment).
- The files could be present in a directory other than the one the process reads: the launcher runtime directory when the process uses the working-directory default, or the reverse. The diagnostic checks each directory the implementation can resolve under the install root, and reports a count for each.

## 9. Windows scripts inspected, and the diagnostic

Existing scripts (**R**):

| Script | Relevance |
|---|---|
| IPD `windows-setup/03-Start-IipsServers.ps1` | Starts the services, sets `IIPS_DATA_DIR`, writes the PID manifest. Does not check the identity files. |
| IPD `windows-setup/04-Validate-BackendEndpoints.ps1` | Probes backend routes. No `/api/investment/*` route is among them. |
| IPD `windows-setup/06-Stop-IipsServers.ps1`, `Iips-Common.ps1` | Read the PID manifest; shared helpers. |
| IRR `tools/windows/diagnose-personal-portfolio.ps1` and two siblings | Personal-portfolio and owner-context diagnostics. None covers the identity files. |
| IRR `frontend/server/investment/cli/iid-readiness.ts` (`npm run iid:readiness`) | Read-only readiness report. Its `identity-files` finding runs the real loader and never prints the data path. Not a PowerShell script, and it reads its own environment, not that of the running server. |

No existing script answers the question, so one is provided: [`Test-IrrIdentitySources.ps1`](../../evidence/integration/w04-identity-source-missing-2026-11-13/Test-IrrIdentitySources.ps1).

**What it does.**

1. `GET /api/health` on the loopback transport; identifies the listening process and whether it descends from the `irr-transport` PID in the newest PID manifest.
2. One `GET` of the identities route with the absent-portfolio probe id that IRR's own diagnostic uses. The identity files are loaded before any portfolio is read, so no real portfolio id is needed.
3. On `main`, takes the resolved directory from `issues[].subject` and compares it with the launcher directory and with the working-directory default. This is the check of the running process's configuration. The directory is used and never printed.
4. For each of the three files: present, a regular file, readable, non-empty, no byte-order mark, JSON, top-level object, `schemaVersion`, required arrays, counts, file SHA-256.
5. When all three pass, runs IRR's readiness CLI on that directory and reports the loader's verdict.
6. Counts the files present in each other directory the implementation can resolve under the install root.

**Read-only.** Two HTTP `GET` requests and file reads. No file is written, no environment variable set, no service started or stopped. Step 5 starts one short-lived Node.js process with the TypeScript runner cache disabled; that this writes nothing was checked here (**R**).

**Sanitized.** It prints status words, counts, the three fixed file names, bounded codes, yes/no answers, sizes and SHA-256 digests. Values taken from a response or from the CLI are printed only if they match a fixed code pattern.

**Run it** on the host, with the services running, from a PowerShell console:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-IrrIdentitySources.ps1
$LASTEXITCODE
```

Parameters, only if the launcher was not run with its defaults: `-InstallRoot`, `-RuntimeRoot`, `-LogRoot`, `-TransportPort`, `-BindAddress`. `-SkipLoaderValidation` omits step 5.

**Result.** The last line is `RESULT: PASS`, `FAIL` or `INCONCLUSIVE` (exit code 0, 1 or 2), and a `ROOT CAUSE:` line gives one of:

| `ROOT CAUSE` | Meaning |
|---|---|
| `NONE` | The identity sources load in the running server. |
| `IDENTITY_DIRECTORY_ABSENT` | The process reads the expected data directory, and `investment\identity` does not exist in it. |
| `IDENTITY_FILES_ABSENT (n of 3 absent)` | The directory exists; the listed files are absent. |
| `RUNNING_PROCESS_USES_THE_WORKING_DIRECTORY_DEFAULT` | `IIPS_DATA_DIR` did not reach the server process. |
| `IDENTITY_FILE_UNREADABLE_OR_NOT_VALID` | A file is present but unreadable, empty, not JSON, or of another schema. |
| `IDENTITY_FILES_REFUSED_BY_THE_IRR_LOADER` | The files pass the basic checks and IRR's loader refuses them; the bounded reason is printed. |
| `FILES_VISIBLE_TO_THIS_USER_BUT_NOT_TO_THE_RUNNING_PROCESS` | The files are there for the console user, and the server still reports them missing. |
| `NOT_DETERMINED` | The server answered in a way that leaves the cause open. |

If the host matches the tracked launcher, the expected result is `IDENTITY_DIRECTORY_ABSENT` with three `absent` lines (**D**).

**Verification status of the script. It has not been executed.** No PowerShell runtime can be obtained in this sandbox. What was done instead (**R**):

- It parses without error under a PowerShell grammar (`tree-sitter-pwsh`). The same check reports a deliberately removed brace, and parses the tracked `03-Start-IipsServers.ps1`, `04-Validate-BackendEndpoints.ps1`, `Iips-Common.ps1` and IRR `capture-owner-bound-portfolio.ps1` without error. It reports two errors in the tracked IRR `diagnose-personal-portfolio.ps1`, at a one-line `switch`, so the grammar is an approximation of PowerShell and not the PowerShell parser.
- It passes 30 of the 32 checks of the repository's own structural validator, `windows-setup/.validate-scripts.py` (PR #156). The two it does not pass require the `-NoPause` switch and the final-status helper of the shared launcher library. They do not apply: the script is deliberately standalone, because the launcher set on the host is not the tracked one.
- It follows the rules that validator records from earlier host failures: no `else`, `elseif` or `finally`; no listener lookup filtered on the connection state; child process output read asynchronously with bounded waits.
- Every claim it prints about IRR behaviour was checked against IRR's loader in sections 4 and 6.

The first run on the host is therefore also its first execution. This repository already runs Windows PowerShell 5.1 on a hosted Windows runner for one other script (`.github/workflows/stage4-evidence-collector.yml`). Executing the diagnostic there against a synthetic server would need a workflow or test change, which is outside what this branch may change, so it was not done.

An unhandled error ends the run with `RESULT: INCONCLUSIVE` and the error type only. If that happens, this one command gives the essential answer with the launcher defaults, and prints file names with `True` or `False` only:

```powershell
'eligible-roster.json','listing-map.json','corporate-actions.json' | ForEach-Object { '{0}: {1}' -f $_, (Test-Path -LiteralPath (Join-Path 'H:\IIPS\runtime\iips-data\investment\identity' $_) -PathType Leaf) }
```

**Limits.** The script cannot read another process's environment; it infers `IIPS_DATA_DIR` from the directory the server reports, which only `main` does and only for the missing-file case. On PR #563 it assumes the launcher directory and says so. It checks only directories the implementation can resolve under the install root; it does not search the disk.

## 10. Recovery feasibility

| Host finding | Recovery | Who | Label |
|---|---|---|---|
| The process uses the working-directory default, and the files are in the launcher directory (or the reverse) | Configuration only: start `irr-transport` with `IIPS_DATA_DIR` pointing at the directory that holds the files | Operator | **D** |
| The files are absent everywhere checked | Data is required. Nothing in either repository can supply it. | Owner decides the source; operator places the files | **D** |
| The files are present but refused | Correct the files at their source | Owner of the data | **D** |

For the second row, which is the expected one:

- IRR's rule is that the files come "from the authoritative issuer source" and that test fixtures are not copied into an operational data domain (section 4). Installing the synthetic fixture would clear the 503 and produce `SYNTHETIC_FIXTURE` answers that resolve none of the real holdings. It would not be W04 evidence.
- The seven tracked single-issuer sets are evidence for other work items. Together they hold 5 distinct real ISINs (W04 evidence assessment §7.2). They are not a roster for this portfolio.
- IPD holds governed identity data (the P04 master and the P7 registry), but no tracked contract or tool converts it into IRR's three files. Building one would be new work across both repositories and needs its own authority. It was not attempted. *(Later addition: such a tool was since built in IPD at the owner's direction, without an IRR change; see the [provisioning record](IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md).)*
- Placing files clears the 503. It does not by itself give coverage: a holding resolves only if its listing is in the listing map and its issuer in the roster. Measuring that is W04 host item E1.

No recovery was performed here, and none can be performed from the repositories.

## 11. The next Windows operator action

1. Leave the services running. Do not create `investment\identity`, do not copy any fixture into it, and do not restart anything.
2. Obtain `Test-IrrIdentitySources.ps1` from this branch and run it as in section 9.
3. Report the console output as printed, and the exit code. The output is already sanitized; do not add paths, response bodies or portfolio content.
4. Stop there. What follows depends on the `ROOT CAUSE` line (section 10), and for the expected result it is a decision about the data source, not an operator command.

## 12. Verification

| Check | Result |
|---|---|
| IRR `main` `08411bc`, platform identity suites (`tests/investment/identity-*.test.ts`) | 104 tests, 104 passed |
| IRR `main` `08411bc`, server and client identity tests (5 vitest files) | 110 tests, 110 passed |
| IRR PR #563 `d10afbb`, platform identity suites and `phase1IdentityReadiness` | 116 tests, 116 passed |
| IRR PR #563 `d10afbb`, server and client identity tests (6 vitest files) | 116 tests, 116 passed |
| Probe on `main`, twice | Exit 0, byte-identical output |
| Probe on PR #563 | Exit 0 |
| IRR readiness CLI on an empty data directory | `IDENTITY_SOURCE_MISSING (3 of 3 files absent)`, `USER_HOST`, no path in the output |
| IPD `npm test` on this branch | 1,487 executed, 1,486 passed, 1 skipped, 0 failed |

This branch adds documentation and evidence only.

## 13. Status and next activity

- **W04: PARTIALLY COMPLETE, NOT ACCEPTED.** The identities route cannot yield host identity evidence until the three files are on the host and load in the running server.
- Next: the operator action of section 11, then the owner's decision on the identity data source if the result is the expected one, then W04 host items E1–E4.
- W03, W08 and W11 are not accepted. IRR PR #563 is unmerged.

## 14. Not examined

- The Windows host: its files, its launcher variant, the environment of its processes.
- The content of any identity file other than the tracked synthetic fixture and the tracked evidence sets, and those only for counts and validity.
- Which source the owner regards as the authoritative issuer source.
- `GET /api/investment/coverage`, which reads more than the identity files and was excluded from host operations earlier.
