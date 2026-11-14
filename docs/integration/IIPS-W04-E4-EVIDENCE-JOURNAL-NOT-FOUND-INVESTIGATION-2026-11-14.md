# Snapshot-to-Live W04 — E4: why the Broker Import evidence journal was not found

**Date:** 2026-11-14
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Follows:** the [E4 record](IIPS-W04-E4-IDENTIFIER-SUPPLY-DIAGNOSIS-HOST-PROBE-PREPARED-2026-11-14.md) (probe prepared for the host)
**Repositories read:** IPD `ramkivs/iips-production-market-data` at `9956a9b`; the Windows launcher at the head of IPD PR #156 (`a93278f`, open); IRR `ramkivs/iips-review-recovered` at `main` `08411bc`. All read-only.
**Type:** read-only investigation. No Broker Import code, portfolio, import, registry or Windows checkout was changed.

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.**

## 1. Result

1. **The probe searched the right place.** The authoritative journal is `journal.ndjson` at the root of the IRR data directory. The launcher sets that directory to `H:\IIPS\runtime\iips-data`, which is the directory the probe was given.
2. **The most probable reason the journal is absent is that it was never written.** As the Windows launcher starts it, the IRR transport refuses every evidence submission before any write, because the launcher never supplies the evidence-owner carrier. IRR's import screen still allows the commit. This is shown by the source and reproduced in the sandbox with synthetic input. **It is not confirmed on the host.**
3. **No original evidence was recovered.** The import content digest equals no file in any history of either repository. Neither repository holds the per-row inputs of the import.
4. **No record shows that an owner reset occurred**, and the governed reset tool cannot run on Windows. A manual deletion on the host cannot be excluded from here.
5. **The 63 holdings are classified UNDETERMINED.** No lineage digest was reproduced, because there was no original evidence to reproduce it from. Nothing was reconstructed or substituted.

## 2. What was supplied

| Item | State |
|---|---|
| Import content digest | `a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107`, supplied by the Principal |
| Statement that the E4 probe did not find the journal | Supplied by the Principal |
| The probe's output (`RESULT` line, `E4_RESULT_JSON`, exit code) | **Not supplied.** This report cannot tell apart "data directory absent", "journal absent" and "journal present with no matching record"; the output states which |
| Access to the Windows host, its backups and its logs | None from this environment |

Evidence labels below: **S** read in source at the commits above; **R** reproduced in the sandbox; **O** operator-reported in an earlier record; **U** not confirmed on the host.

## 3. Findings

**F1. Authoritative location, and the probe's search (S, O).**
`BrokerImportEvidenceStore` writes through `PersistenceService` to `<data directory>\journal.ndjson`. The data directory is `IIPS_DATA_DIR`, or `<working directory>\.iips-data` when the variable is unset (`frontend/server/persistence/persistence-service.ts` lines 42 and 108–110). The launcher sets `IIPS_DATA_DIR` to `<RuntimeRoot>\iips-data` for the transport and for Vite, and `RuntimeRoot` defaults to `H:\IIPS\runtime` (`windows-setup/03-Start-IipsServers.ps1` lines 59, 119, 224, 248, 334). The probe opens `journal.ndjson` in each `--data-dir`, and the E4 command passed `H:\IIPS\runtime\iips-data`. The host completion record reports identity files installed and loaded under `H:\IIPS\runtime\iips-data\investment\identity`, which is the same data directory.

The search location would be wrong only if the servers were started another way: with different launcher roots, or by hand without `IIPS_DATA_DIR`, in which case the directory is `H:\IIPS\iips-review-recovered\frontend\.iips-data`. Section 6 checks both.

**F2. Evidence submission is refused before any write when the carrier is not configured (S, R).**
`handleEvidenceSubmission` calls `resolveBrokerEvidenceOwnerContext(env)` and answers `503 owner-context-unavailable` when it returns nothing (`brokerImportEvidenceSubmission.ts` lines 47–48). It returns nothing with reason `path-not-configured` when `IIPS_BROKER_EVIDENCE_OWNER_PATH` is unset (`brokerImportEvidenceOwnerResolver.ts` line 183). The store is created only after that point.

**F3. The Windows launcher never supplies that variable (S).**
The transport's environment block sets `EXEC_TRANSPORT_PORT`, `IIPS_DATA_DIR`, `IIPS_OWNER_CONTEXT_PATH`, `NODE_ENV`, the optional reports and NP-04 variables and the IPC variables. `IIPS_BROKER_EVIDENCE_OWNER_PATH` appears in no file under `windows-setup/` and in no commit that touched it. The launcher file at the host's IPD checkout `1fded9d` is identical to the PR #156 head. The launcher creates the empty `iips-data` directory and nothing writes the carrier file.

Two other routes could supply the variable, and neither is visible from here (U): the PowerShell session that ran the launcher (child processes inherit it), and an untracked `.env.local` in the IRR checkout (`npm run server:dev` loads `../.env.local` and `.env.local` when present).

**F4. Reproduction (R).** Unmodified IRR code at `08411bc`, synthetic two-row statement, Linux sandbox:

| Case | Environment | Response | Data directory afterwards |
|---|---|---|---|
| 1 | The launcher's variables, no carrier variable | `503 owner-context-unavailable` | empty |
| 2 | Case 1 plus the carrier written by IRR's own materialiser | `201 EVIDENCE_RETAINED` | `journal.ndjson` |

Script and output: [`evidence/integration/w04-e4-journal-not-found-2026-11-14/`](../../evidence/integration/w04-e4-journal-not-found-2026-11-14/). The carrier check has no operating-system-specific code, but the reproduction did not run on Windows.

**F5. The commit does not depend on retention (S).**
`BrokerHoldingsPreview.tsx` prepares the commit payload when the file is parsed (lines 172–175) and renders the commit control whenever a preview exists (line 640). `BrokerImportCommit.tsx` does not read the retention state. On a 503 the screen shows retention as `UNAVAILABLE` with "Owner context unavailable" and the commit stays available. A revision can therefore be committed to IPD with no evidence retained. The refusal writes no line to the transport log: the classified log line exists only for the stages `commit`, `revision-read` and `legacy-commit`.

The same holds at the IRR merge of 2026-11-11 (`08cdf49`) and at `08411bc`, so the finding does not depend on which of those commits the host ran at import time.

**F6. Owner reset (S, U).**
The reset tool (`ownerEvidenceReset.ts`) refuses unless `process.platform` is `linux` (line 116, `UNQUALIFIED_OS`) and it needs the same carrier variable. It cannot have run on the Windows host as built. When it does run, it removes only `journal.ndjson`, after writing a verified copy and an audit file under `<data directory>\broker-evidence-reset\`. The IRR runbook states the procedure was "not executed on operational evidence", and the only reset evidence in either repository is the synthetic qualification of 2026-11-06. No record in either repository reports a reset on the host.

The probe counts the entries of `broker-evidence-reset` without opening them; that count is in the output that was not supplied. A deletion made by hand leaves no record and cannot be excluded from here.

**F7. Search for the original evidence (R).**

| Location | Result |
|---|---|
| Every blob in every branch and all history of IPD (4,864 blobs) and IRR (7,247 blobs): raw bytes and five text forms each | None equals the digest |
| The digest as text, any commit of either repository | Not present before this report |
| IRR journal or journal backup committed to either repository | None |
| IPD portfolio store | Holds the digest only. `portfolio_contributions` keeps the file name, broker, content digest, lineage digest and import instant. It keeps neither the file nor any row's ISIN or exchange |
| Host: data directories, backups made under runbook section 10.4, reset copies, the original statement file | **Not searchable from here** |

Fifteen blobs larger than 4 MiB were not compared. Pull-request-only refs were not fetched. Script and output are in the same evidence folder.

**F8. The IRR runbook is out of date on this point (S).** Section 3.3 says the carrier variable is required "for `GET …/evidence/:importId` only". At `08411bc` the `POST` that retains evidence requires it too. Section 10.2 says the live import path writes no evidence; the code retains it when the carrier is configured.

## 4. Classification of the 63 holdings

**UNDETERMINED: 63 of 63.**

- No original evidence was recovered, so its digest could not be verified and none of the 64 lineage digests was reproduced.
- Classes A to D of the E4 record are not assigned. Whether any of the 63 lacked an ISIN, lacked an exchange, or carried both, is not known.
- F2 to F5 explain why the evidence is probably absent. They say nothing about what the import contained.
- If the probe's output shows that it reproduced lineage digests from the capture alone, that is a separate result and must be read from the output itself. It was not available for this report.

## 5. Blockers

1. **Host confirmation of the cause.** Whether the transport ran without the carrier at import time is not confirmed. The refusal is not logged (F5), so the logs cannot settle it; the configuration can.
2. **The probe output was not supplied.**
3. **Recovery depends on host-only material.** If the journal was never written there is no retained record to recover, and it cannot be recreated: IRR's runbook (section 10.4) states that rebuilding a record from a digest, or re-importing the file in place of the retained original, is not a recovery path.
4. **A new import would retain nothing either** until the carrier is provisioned for the transport. That is a change to host setup and needs its own approval. It was not made.

## 6. Justified next action

**One read-only host check, run by the Principal.** It confirms or refutes the cause, looks for journal copies, and looks for the original statement file by digest equality. It opens files for reading only and prints names, counts and paths; it prints no file content.

This block is written for Windows PowerShell 5.1. **It has not been executed: this environment has no PowerShell.** Read it before running it. The import digest is the SHA-256 of the file's text as UTF-8, so step 4 hashes each file's bytes without a leading byte-order mark.

```powershell
$want = 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107'
$var  = 'IIPS_BROKER_EVIDENCE_OWNER_PATH'

# 1. Data directories: entry names only
foreach ($d in 'H:\IIPS\runtime\iips-data', 'H:\IIPS\iips-review-recovered\frontend\.iips-data') {
  if (Test-Path -LiteralPath $d) { "DIR $d : " + (@(Get-ChildItem -LiteralPath $d -Force | ForEach-Object { $_.Name }) -join ', ') }
  else { "DIR $d : absent" }
}

# 2. Was the evidence-owner carrier configured anywhere the transport could read it
"VAR in this session : " + (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($var, 'Process')))
"VAR at user level   : " + (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($var, 'User')))
"VAR at machine level: " + (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($var, 'Machine')))
foreach ($f in 'H:\IIPS\iips-review-recovered\.env.local', 'H:\IIPS\iips-review-recovered\frontend\.env.local') {
  if (Test-Path -LiteralPath $f) { "ENVFILE $f names the variable: " + [bool](Select-String -LiteralPath $f -Pattern ('^\s*' + $var + '\s*=') -Quiet) }
  else { "ENVFILE $f : absent" }
}
"CARRIER files under H:\IIPS\runtime: " + @(Get-ChildItem -LiteralPath 'H:\IIPS\runtime' -Recurse -File -Filter 'broker-evidence-owner-context.json' -ErrorAction SilentlyContinue).Count

# 3. Journal copies, backups and reset artefacts, by name
$roots = @(@('H:\IIPS\runtime', 'H:\IIPS\iips-review-recovered\frontend\.iips-data', (Join-Path $env:USERPROFILE 'iips-backup')) | Where-Object { Test-Path -LiteralPath $_ })
$named = @()
if ($roots.Count -gt 0) {
  $named = @(Get-ChildItem -LiteralPath $roots -Recurse -File -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq 'journal.ndjson' -or $_.Name -like 'evidence-*.ndjson' -or $_.Name -like '*.recovery.ndjson' -or $_.Name -like '*.audit.ndjson' })
}
"JOURNAL-LIKE files: " + $named.Count
$named | ForEach-Object { "  " + $_.FullName + " (" + $_.Length + " bytes)" }

# 4. The original statement file, by digest equality only
$sha = [System.Security.Cryptography.SHA256]::Create()
$seen = 0; $hits = 0
$places = @(@('Downloads', 'Documents', 'Desktop') | ForEach-Object { Join-Path $env:USERPROFILE $_ } | Where-Object { Test-Path -LiteralPath $_ })
if ($places.Count -gt 0) {
  Get-ChildItem -LiteralPath $places -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { ($_.Extension -eq '.csv' -or $_.Extension -eq '.txt') -and $_.Length -gt 3 -and $_.Length -le 4MB } |
    ForEach-Object {
      $seen++
      $b = [System.IO.File]::ReadAllBytes($_.FullName)
      $skip = 0
      if ($b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) { $skip = 3 }   # a byte-order mark is not part of the text
      $h = -join ($sha.ComputeHash($b, $skip, $b.Length - $skip) | ForEach-Object { $_.ToString('x2') })
      if ($h -eq $want) { $hits++; "MATCH: " + $_.FullName }
    }
}
"FILES compared: $seen ; equal to the import content digest: $hits"
```

How to read it:

| Output | Meaning |
|---|---|
| Step 2 all `False`, both files absent or `False`, carrier count 0 | The cause in section 1 item 2 is confirmed for the host as configured now, and nothing indicates the journal was ever written. The "session" line speaks only for the window the block runs in; run it in the window that starts the servers if that window is still open |
| Step 2 shows the variable or a carrier | The cause is **not** confirmed. The journal may have existed; steps 1 and 3 then matter, and the finding is reopened |
| Step 1 or 3 lists a journal, a backup or a reset copy | Re-run the E4 probe with `--data-dir` pointing at the directory that holds it (for a backup or reset copy, a read-only copy named `journal.ndjson` in an empty directory outside the runtime tree) |
| Step 4 prints `MATCH` | The original statement file exists and is identified by digest. It is the import's input, **not** the retained IRR record, and it does not restore the journal. Whether it may be used to test the lineage digests of the capture is the Principal's decision; until then the 63 stay UNDETERMINED |
| Step 4 prints 0 matches | The file is not in those three folders in a form whose UTF-8 text gives the digest. Not proof that it no longer exists |

Please also send the `RESULT` line and the `E4_RESULT_JSON` block of the probe run. They contain no holdings data by design.

**Decisions this report raises, none taken here:**

- Provisioning the evidence-owner carrier in the Windows launcher (IPD PR #156, `windows-setup/`), with IRR runbook section 3.3 as the procedure. Without it, step 4 of the C4/C5 assessment (a new governed import) would again retain nothing.
- Whether IRR should refuse the commit unless retention is verified, and should log the refusal. Both are Broker Import changes and need the exception already pending for C4/C5 steps 2, 3, 4 and 7.
- Correcting IRR runbook sections 3.3 and 10.2.

## 7. Boundaries observed

- Read-only. No Broker Import change, no portfolio modification, no new import, no registry change, no Windows checkout synchronization.
- Nothing was run on the host. The sandbox reproduction used synthetic rows and temporary directories, and left the IRR worktree unchanged.
- No evidence was reconstructed or substituted. No holdings data was read into or printed from this investigation.
- No IRR commit or push. No pull request was merged, closed or retargeted.
- W04 is not declared accepted.
