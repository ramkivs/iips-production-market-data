# Offline Windows Stage 4 evidence collector

Script: `scripts/Collect-Stage4ClassPEvidence.ps1` (Windows PowerShell 5.1).
Related incident: PR #153. Incident remains OPEN; both import IDs remain quarantined.
This is operator tooling, not a change to accepted product authorization or IPC.

## Preconditions and invocation

Use the ordinary service operator account. No elevation is requested. Do not stop,
start, restart or probe anything to use this collector. Do not rebuild `dist`.
Supply the EXISTING directories containing the retained `03-start-20261111-162917.log`,
`irr-transport.err.log`, and any retained IPD IPC/build/provenance JSON/log files.
Their actual directory paths were not supplied in the incident evidence; no path
is invented or automatically searched. Read-only access to explicitly selected
service logs outside the checkout is allowed; no IRR files are modified.

The output directory must already exist on a fixed local drive, be named
`ipd-stage4-evidence`, and be outside the checkout and all selected log directories.
Creating/preparing that directory is an operator prerequisite, not a collector
side effect. All path components must be free of reparse points (including mounted
or junction-backed paths). Supply dedicated log directories, not drive roots.
Local paths are recorded as provenance; do not put secret values in supplied paths.

Run from ANY current directory; variables below are ordinary PowerShell variables,
not environment changes. Assign actual approved directory paths before invoking:

```powershell
# Set these two variables to existing absolute local paths; no prompts or discovery.
# $IncidentLogDirectories = @('the actual retained service-log directory', ...)
# $EvidenceOutputDirectory = 'the existing dedicated directory ending in ipd-stage4-evidence'
& 'H:\IIPS\iips-production-market-data\scripts\Collect-Stage4ClassPEvidence.ps1' `
    -RepositoryRoot 'H:\IIPS\iips-production-market-data' `
    -LogDirectories $IncidentLogDirectories `
    -OutputDirectory $EvidenceOutputDirectory
$LASTEXITCODE
```

To use a separate Windows PowerShell process with a single known log directory:

```text
powershell.exe -NoLogo -NoProfile -NonInteractive -File "H:\IIPS\iips-production-market-data\scripts\Collect-Stage4ClassPEvidence.ps1" -RepositoryRoot "H:\IIPS\iips-production-market-data" -LogDirectories "<actual existing log directory>" -OutputDirectory "<existing dedicated ipd-stage4-evidence directory>"
```

Angle-bracket arguments are mandatory operator-supplied paths, not literal paths.
There is no execution-policy bypass, interactive prompt, or fallback scan. If local
policy prohibits this script, follow the host's approved script policy separately.

## Output and interpretation

One new UTF-8 JSON report:
`<OutputDirectory>\ipd-stage4-class-p-<UTC timestamp>-<unique id>.json`.
CreateNew prevents replacement; reruns create independent reports. No other file
is written. Report publication failure may leave its new partial report; no cleanup
or deletion is attempted. Inputs are never written; Windows can manage last-access
times on reads, so the tool does not claim to freeze OS-managed access timestamps.
It never sets creation/modification timestamps or restores them with a write.

Exit codes:
- **0:** configured bounded collection completed, NOT evidence of incident closure.
  Explicit historical limitations still apply.
- **2:** partial collection: missing/inaccessible files/process identity, malformed
  retained JSON, no original IPC metadata found, changed files, or any collection limit. Inspect `issues`; do not
  describe this as complete collection.
- **3:** invalid configuration or inability to publish a report. Console error is
  deliberately non-sensitive. No product action is attempted.

Findings classify current observations as CONFIRMED, historical/uncorrelated
metadata as INCONCLUSIVE, and missing/denied/limited evidence as UNAVAILABLE.

Collected evidence:
- Current `node.exe` providers whose command line contains this exact checkout's
  entrypoint as the script argument (not merely text inside another argument), rechecked by PID/start time/command line. PID 14484 is a marker,
  not an identity assumption. Current parent candidate is checked against child
  start time. Parent name is allowlisted; raw parent paths/arguments are suppressed.
- Provider executable, sanitized command shape, PID and UTC process start. Working
  directory is explicitly UNAVAILABLE: Win32_Process has no supported CWD field.
  No invasive process-memory reads are used to fill that gap. Command-path aliases
  or Node flags before the script can prevent exact recognition and are reported
  as unavailable rather than guessed.
- Eleven fixed compiled artifact paths, sizes, creation/write timestamps, SHA-256,
  and explicit current-file-only provenance. Files are not imported or executed.
- Selected direct-child retained logs/manifests: path, timestamps, SHA-256, line
  number, recognized timestamp and fixed matching diagnostic tokens. Raw line
  values, command arguments, request IDs, holdings values and exception messages
  are suppressed, NOT regex-redacted and then dumped.
- Allowlisted retained JSON metadata: v/op, request ID TYPE, depth-tagged nested key
  names (unrecognized names redacted), recorded frame lengths, trailing-data flag,
  recorded connection/write/close ISO timestamps, claimed build commit. Claims
  are uncorrelated, not verified loaded-artifact provenance. Missing fields are
  null/UNAVAILABLE; no request or frame bytes are reconstructed or replayed.

## Bounds and suppression

No recursion: only direct files in 1-8 explicit directories. Only log/json/txt
basenames matching ipc/broker/build/start/provenance/request, the exact IRR error
log name, or the specified startup-log filename pattern are eligible. No SQLite
or arbitrary paths extracted from content are opened. Per-directory enumeration
caps at 1,024 files; selected entries are sorted before bounded reading. Hitting
a limit is reported as partial. With >1,024 directory entries, the filesystem
may determine which prefix was seen; complete coverage is NOT claimed.

Defaults: 64 selected files total, 1 MiB/log (configurable up to 4 MiB), 16 MiB per
fixed runtime artifact, 20 matched lines/file, 100 matches total. JSON traversal is
bounded to 512 nodes/depth 12. Reads are byte-bounded even when files grow; files
are checked for size/write-time changes. A live writer or concurrent path change
can still prevent an atomic snapshot; operate on trusted directories and treat
instability as incomplete evidence. This is not a forensic disk acquisition.

Signals include Class P reason enums, binding failures, frame errors, socket errors,
connection drops, timeout/write failures, unhandled rejection indicators and startup
status. Unknown free-text diagnostics are intentionally not copied; no matches
is not proof that no error occurred. No raw request files are copied.

## Targeted validation

`node --test tests/stage4_evidence_collector.test.mjs` runs static safety checks
on any platform and native parser/synthetic execution cases under Windows
PowerShell 5.1. Windows cases use temporary fake artifacts/logs, a mocked read-only
process query, secret canaries and a simulated access-denied exception. They never
load product code or access operator databases. The dedicated PR workflow
`.github/workflows/stage4-evidence-collector.yml` runs these tests on windows-latest;
it performs no incident reproduction. Native checks are explicitly skipped on
non-Windows hosts, not counted as executed successes.

## Evidence that cannot be manufactured

A stopped process's unpersisted diagnostic sink, historical CWD, loaded artifact
bytes, original timing or frame metadata cannot be recovered from current files
alone. An empty new sink or healthy pipe does not supply that evidence. Do not
connect to a pipe to fill these gaps. Review the report and retained evidence;
any future diagnostics change or controlled reproduction needs separate authority.
