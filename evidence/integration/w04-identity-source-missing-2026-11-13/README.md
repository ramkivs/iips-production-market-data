# W04 — IRR identities endpoint 503 `IDENTITY_SOURCE_MISSING`: evidence and diagnostic

Evidence for [`docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-MISSING-ROOT-CAUSE-2026-11-13.md`](../../../docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-MISSING-ROOT-CAUSE-2026-11-13.md).

Produced on 2026-11-13 in a Linux sandbox. **Every input is synthetic.** Nothing here was read from the Windows host, and nothing here contacts a running IRR or IPD service on it. The outputs contain no absolute path.

## Files

| File | What it is |
|---|---|
| `Test-IrrIdentitySources.ps1` | The read-only Windows diagnostic for the operator. **Not executed here**: no PowerShell runtime is available in the sandbox. See "Checks made on the diagnostic". |
| `irr-identity-source-missing-probe.ts` | Starts IRR's exported HTTP server, unmodified, on a loopback port and requests the identities route in eight identity-directory states (S0–S7). Also runs IRR's readiness CLI on each state. |
| `irr-main-08411bc-probe-output.txt` | Its output at IRR `main` `08411bcd6d782a601fe5c82cc9983d076831148d`. Byte-identical across two runs. |
| `irr-pr563-d10afbb-probe-output.txt` | Its output at the head of IRR PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`. The synthetic IPC peer does not exist at that commit, so IPC activity is "not observed" and a valid identity set ends in `holdings-unavailable`. |
| `irr-tracked-identity-sets.mts` | Loads every tracked identity directory through the checkout's own loader and prints validity and counts. |
| `irr-loader-edge-cases.mts` | Loads the synthetic fixture with one change at a time: an absent or empty required array, a top-level array. |
| `irr-loader-checks-output.txt` | Output of the two scripts above at both commits. |

## What the outputs show

- With no `investment/identity` directory, IRR `main` answers 503 `identity-sources-unavailable` with one issue: file `eligible-roster.json`, code `IDENTITY_SOURCE_MISSING`, and the absolute directory as `subject`. No IPC request is made and nothing is created.
- The same single issue, still naming `eligible-roster.json`, is returned when only `corporate-actions.json` is absent. On `main` the body does not identify the missing file.
- With `IIPS_DATA_DIR` not set, the directory is `.iips-data/investment/identity` under the working directory of the server.
- Content problems give other codes: `INVALID_JSON` (also for a UTF-8 byte-order mark) and `SCHEMA_MISMATCH`. On `main`, a roster path that is a directory gives `holdings-unavailable` with no issue.
- At the head of PR #563 the file names and the directory are the same. Missing files are reported one issue per file, with the file name and no path as `subject`, and an unreadable file gives `IDENTITY_SOURCE_UNREADABLE`.
- The states were applied in sequence to one running server. Each answer followed the files as they were at that moment, so no restart is involved.
- The tracked synthetic fixture loads at both commits. The seven tracked single-issuer sets load on `main`; one is refused on PR #563 with `MISSING_REQUIRED_ARRAY`.
- IRR's readiness CLI reports `IDENTITY_SOURCE_MISSING (n of 3 files absent)`, `IDENTITY_SOURCE_INVALID (<codes>)` or `IDENTITY_SOURCES_VALID`, assigns the action to `USER_HOST`, and never prints the data directory.

## Reproduce

From `<irr checkout>/frontend` with its dependencies installed, at either commit:

```sh
./node_modules/.bin/tsx <this folder>/irr-identity-source-missing-probe.ts <irr checkout>
./node_modules/.bin/tsx <this folder>/irr-tracked-identity-sets.mts <irr checkout>
./node_modules/.bin/tsx <this folder>/irr-loader-edge-cases.mts <irr checkout>
```

The probe exits 0 when every state was exercised. It writes only under the system temporary directory.

## The diagnostic

Run on the Windows host, with the IIPS services running, from a PowerShell console:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-IrrIdentitySources.ps1
$LASTEXITCODE
```

Parameters, needed only if the launcher was not run with its defaults: `-InstallRoot` (`H:\IIPS`), `-RuntimeRoot` (`<InstallRoot>\runtime`), `-LogRoot` (`<InstallRoot>\logs`), `-TransportPort` (`8787`), `-BindAddress` (`127.0.0.1`). `-SkipLoaderValidation` omits the one step that starts a Node.js process.

It sends two HTTP `GET` requests to the loopback transport and reads files. It writes nothing, sets nothing, and starts, stops or restarts no service. It prints status words, counts, the three fixed file names, bounded codes, yes/no answers, file sizes and SHA-256 digests of the identity files; it prints no path, response body, portfolio id, holding or ISIN. The last line is `RESULT: PASS`, `FAIL` or `INCONCLUSIVE`, with exit code 0, 1 or 2. The record lists the `ROOT CAUSE` values.

Report the console output as printed, with the exit code.

### Checks made on the diagnostic

| Check | Result |
|---|---|
| Executed in PowerShell | **No.** No PowerShell runtime can be obtained in the sandbox. |
| Parse under a PowerShell grammar (`tree-sitter-pwsh` with `web-tree-sitter`) | No error node. A copy with one closing brace removed is reported as an error. The grammar is an approximation: it reports two errors in one tracked IRR script. |
| IPD `windows-setup/.validate-scripts.py` (from PR #156), run on a directory holding only this script | 30 of 32 checks pass. The two that do not are `declares the -NoPause switch parameter` and `ends through Write-IipsFinalStatus`, which belong to scripts that load the shared launcher library. This script is standalone by design. |
| Text | ASCII only, LF line endings, no tab. |
| Claims the script prints about IRR behaviour | Each checked against IRR's loader: see the two output files. |
| The Node.js step writes nothing | Checked: the readiness CLI run with `--no-cache` leaves the temporary directory empty; without the flag the TypeScript runner writes a cache there. |

SHA-256 of `Test-IrrIdentitySources.ps1` as committed, with LF line endings: `57a3c140742348b2ab3b89a89d90a9f9d3eb4a6598ec1a6dc046eaf29d87344f`. The repository `.gitattributes` keeps LF line endings on checkout.
