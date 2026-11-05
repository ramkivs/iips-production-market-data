#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 5 of 6: verify local persistence, durability and restart recovery.

.DESCRIPTION
    Exercises the repository's OWN restart harnesses - the same code paths the product uses - rather
    than a re-implementation:

      server/persistence/consumer-restart-writer.ts    argv [consumer, tenantId, ownerUserId]
      server/persistence/consumer-restart-recoverer.ts argv [consumer, tenantId, ownerUserId]

    Process A writes through the production resolution path (IIPS_DATA_DIR -> resolveDataDir() ->
    the consumer subdirectory), exits, and Process B - a genuinely separate process - recovers every
    field from the durable journal alone. Nothing is passed across the boundary except the store
    address, which the recoverer resolves itself.

    VERIFIED CONTRACT this script asserts:
      * writer exits 0 and emits one JSON line on stdout
      * the journal is written to <IIPS_DATA_DIR>\<consumer>\journal.ndjson
      * the journal's first line is the format header {"journalFormatVersion":...}
      * the recoverer exits 0 and returns the SAME watchlistId / items the writer created
      * with IIPS_DATA_DIR unset the recoverer fails closed with exit 1

    ISOLATION: this script uses its own scratch data directory under the runtime root. It never
    reads, writes, moves or deletes the live application data directory, and it never touches the
    user-portfolio SQLite database.

    EXIT CODES
      0  every persistence and recovery assertion held
      1  unhandled failure
      2  precondition failure
      3  a write, recovery or fail-closed assertion did not hold

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\05-Validate-PersistenceRestart.ps1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $RuntimeRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $TenantId = 'irr-domain-4b82d6e1',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $OwnerUserId = 'owner-7f3a91c2',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [switch] $KeepScratch,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }

$script:Checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][bool] $Passed,
        [Parameter(Mandatory = $false)][string] $Detail = ''
    )
    $script:Checks.Add([pscustomobject]@{ Name = $Name; Passed = $Passed; Detail = $Detail })
    $colour = 'Red'
    $verdict = 'FAIL'
    if ($Passed) { $colour = 'Green'; $verdict = 'PASS' }
    Write-Host ("    {0,-46} {1}  {2}" -f $Name, $verdict, $Detail) -ForegroundColor $colour
}

<#
.SYNOPSIS
    Runs a repository TypeScript harness in its own process and returns its exit code plus
    separately captured stdout and stderr.

.NOTES
    WHY Start-Process WITH FILE REDIRECTION, NOT `& $npx ... 2>&1 | Out-String`

    Under $ErrorActionPreference = 'Stop', redirecting a native command's stderr into the
    PowerShell pipeline makes PowerShell wrap every stderr line in an ErrorRecord, and the first
    one TERMINATES the calling script. The fail-closed recoverer writes its diagnostic to stderr
    and exits 1 BY DESIGN, so the pipeline form reported a correctly fail-closed result as a
    validator crash and no assertion was ever evaluated.

    Start-Process with separate stdout and stderr files keeps native stderr entirely out of the
    PowerShell pipeline, so an expected non-zero exit and an expected stderr diagnostic can be
    inspected as data.

    Every argument is individually quoted so a path containing spaces cannot split into extra
    arguments, and no two executable paths are ever concatenated into one token.
#>
function Invoke-Harness {
    param(
        [Parameter(Mandatory = $true)][string] $Script,
        [Parameter(Mandatory = $true)][string[]] $Arguments,
        [Parameter(Mandatory = $true)][string] $WorkingDirectory,
        [Parameter(Mandatory = $true)][string] $NpxCmd,
        [Parameter(Mandatory = $true)][hashtable] $Environment,
        [Parameter(Mandatory = $false)][string[]] $RemoveEnvironment = @(),
        [Parameter(Mandatory = $false)][string] $TempRoot = ''
    )

    if (-not (Test-Path -LiteralPath $NpxCmd)) {
        throw "npx.cmd was not found at the explicit path '$NpxCmd'. A bare command name is never resolved for IIPS setup."
    }

    $tmp = $TempRoot
    if ($tmp.Length -eq 0) { $tmp = Join-Path $env:TEMP 'iips-harness' }
    if (-not (Test-Path -LiteralPath $tmp)) { New-Item -ItemType Directory -Path $tmp -Force | Out-Null }
    $stamp = (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
    $outFile = Join-Path $tmp ("harness-$stamp-out.txt")
    $errFile = Join-Path $tmp ("harness-$stamp-err.txt")

    $tokens = New-Object System.Collections.Generic.List[string]
    $tokens.Add('tsx')
    $tokens.Add('"' + $Script.Replace('"', '\"') + '"')
    foreach ($a in $Arguments) { $tokens.Add('"' + "$a".Replace('"', '\"') + '"') }

    foreach ($k in $Environment.Keys) { Set-Item -Path "Env:\$k" -Value $Environment[$k] }
    foreach ($k in $RemoveEnvironment) { Remove-Item -Path "Env:\$k" -ErrorAction SilentlyContinue }

    $proc = Start-Process -FilePath $NpxCmd -ArgumentList ($tokens -join ' ') `
        -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput $outFile -RedirectStandardError $errFile

    $stdout = ''
    $stderr = ''
    if (Test-Path -LiteralPath $outFile) { $raw = Get-Content -LiteralPath $outFile -Raw; if ($null -ne $raw) { $stdout = $raw } }
    if (Test-Path -LiteralPath $errFile) { $raw = Get-Content -LiteralPath $errFile -Raw; if ($null -ne $raw) { $stderr = $raw } }

    return [pscustomobject]@{
        ExitCode = [int]$proc.ExitCode
        Output   = $stdout.Trim()
        StdOut   = $stdout.Trim()
        StdErr   = $stderr.Trim()
        Combined = ($stdout + "`n" + $stderr).Trim()
    }
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Persistence and Restart Recovery ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ''

    # -----------------------------------------------------------------------------------------
    $irrFrontend = Join-Path $InstallRoot 'iips-review-recovered\frontend'
    if (-not (Test-Path -LiteralPath $irrFrontend)) {
        Write-Host "FAILED: IRR frontend not found at $irrFrontend - run step 01." -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Persistence and restart recovery validation: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }
    $writer = Join-Path $irrFrontend 'server\persistence\consumer-restart-writer.ts'
    $recoverer = Join-Path $irrFrontend 'server\persistence\consumer-restart-recoverer.ts'
    if (-not (Test-Path -LiteralPath $writer)) { Write-Host "FAILED: missing $writer" -ForegroundColor Red; exit 2 }
    if (-not (Test-Path -LiteralPath $recoverer)) { Write-Host "FAILED: missing $recoverer" -ForegroundColor Red; exit 2 }

    # npx.cmd resolved from the SAME Node.js installation as node.exe and npm.cmd. A bare `npx`
    # is never invoked; the call operator and an explicit absolute path are used below.
    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable

    # Scratch only - never the live data directory.
    $scratch = Join-Path $RuntimeRoot ("persistence-verify-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $scratch -Force | Out-Null
    Write-Host "Scratch data root (isolated from live data): $scratch" -ForegroundColor Gray
    Write-Host ''

    $envForRun = @{ 'IIPS_DATA_DIR' = $scratch }

    # -----------------------------------------------------------------------------------------
    Write-Host 'Process A - write through the production persistence path' -ForegroundColor Cyan
    $consumers = @('watchlists', 'collaboration', 'settings')
    $writerResults = @{}

    foreach ($c in $consumers) {
        $r = Invoke-Harness -Script $writer -Arguments @($c, $TenantId, $OwnerUserId) -WorkingDirectory $irrFrontend -NpxCmd $toolchain.NpxCmd -Environment $envForRun
        $writerResults[$c] = $r
        Add-Check -Name "writer[$c] exits 0" -Passed ($r.ExitCode -eq 0) -Detail "exit $($r.ExitCode)"
        if ($r.ExitCode -ne 0) {
            Write-Host "      output: $($r.Output)" -ForegroundColor Red
            continue
        }
        $parsed = $null
        try { $parsed = $r.Output | ConvertFrom-Json } catch { $parsed = $null }
        Add-Check -Name "writer[$c] emits one JSON line" -Passed ($null -ne $parsed) -Detail ''
    }

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host 'Durable journal on disk' -ForegroundColor Cyan
    foreach ($c in $consumers) {
        $journal = Join-Path $scratch "$c\journal.ndjson"
        $exists = Test-Path -LiteralPath $journal
        Add-Check -Name "journal written: $c\journal.ndjson" -Passed $exists -Detail $journal
        if (-not $exists) { continue }

        # @( ) is mandatory: a journal with exactly one line makes Get-Content return a scalar
        # string, and $lines[0] on a string yields the first CHARACTER, not the first line - which
        # would silently fail the header match instead of reporting the real state.
        $lines = @(Get-Content -LiteralPath $journal)
        $firstLine = ''
        if ($lines.Count -ge 1) { $firstLine = "$($lines[0])" }
        Add-Check -Name "journal[$c] has a format header" -Passed ($lines.Count -ge 1 -and $firstLine -match 'journalFormatVersion') -Detail "first line: $firstLine"
        Add-Check -Name "journal[$c] has entry lines" -Passed ($lines.Count -ge 2) -Detail "$($lines.Count) line(s)"
    }

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host 'Process B - restart and recover from the journal alone' -ForegroundColor Cyan
    foreach ($c in $consumers) {
        $r = Invoke-Harness -Script $recoverer -Arguments @($c, $TenantId, $OwnerUserId) -WorkingDirectory $irrFrontend -NpxCmd $toolchain.NpxCmd -Environment $envForRun
        Add-Check -Name "recoverer[$c] exits 0" -Passed ($r.ExitCode -eq 0) -Detail "exit $($r.ExitCode)"
        if ($r.ExitCode -ne 0) {
            Write-Host "      output: $($r.Output)" -ForegroundColor Red
            continue
        }
        $rec = $null
        try { $rec = $r.Output | ConvertFrom-Json } catch { $rec = $null }
        if ($null -eq $rec) {
            Add-Check -Name "recoverer[$c] emits JSON" -Passed $false -Detail 'could not parse stdout'
            continue
        }

        # The writer's PID lives INSIDE the JSON the harness emits - { role, pid, consumer,
        # journalLines, evidence }. $writerResults[$c] is the PowerShell result object returned by
        # Invoke-Harness, which has ExitCode/Output but NO pid property, so comparing
        # $writerResults[$c].pid compared against nothing. Parse the writer JSON first.
        $w = $null
        try { $w = $writerResults[$c].Output | ConvertFrom-Json } catch { $w = $null }
        if ($null -eq $w) {
            Add-Check -Name "writer[$c] emits JSON for process comparison" -Passed $false -Detail 'could not parse writer stdout'
            continue
        }

        Add-Check -Name "recoverer[$c] ran in a different process" -Passed ([int]$rec.pid -ne [int]$w.pid) -Detail "writer pid $($w.pid); recoverer pid $($rec.pid)"

        $wJson = ($w.evidence | ConvertTo-Json -Depth 12 -Compress)
        $rJson = ($rec.evidence | ConvertTo-Json -Depth 12 -Compress)
        Add-Check -Name "recoverer[$c] payload equals the written payload" -Passed ($wJson -eq $rJson) -Detail "$($rJson.Length) bytes compared"
    }

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host 'Fail-closed discipline' -ForegroundColor Cyan
    Write-Host '  the recoverer is expected to REFUSE and exit 1 - that is the correct result,' -ForegroundColor Gray
    Write-Host '  not a test infrastructure failure.' -ForegroundColor Gray

    # IIPS_DATA_DIR is removed from the CHILD process environment deterministically, rather than
    # relying on whatever the parent happens to hold. It is restored afterwards so later steps in
    # the same session are unaffected.
    $priorDataDir = $null
    if (Test-Path -Path 'Env:\IIPS_DATA_DIR') { $priorDataDir = (Get-Item -Path 'Env:\IIPS_DATA_DIR').Value }

    $r = Invoke-Harness -Script $recoverer -Arguments @('watchlists', $TenantId, $OwnerUserId) `
        -WorkingDirectory $irrFrontend -NpxCmd $toolchain.NpxCmd -Environment @{} `
        -RemoveEnvironment @('IIPS_DATA_DIR') -TempRoot $scratch

    if ($null -ne $priorDataDir) { Set-Item -Path 'Env:\IIPS_DATA_DIR' -Value $priorDataDir }

    # stdout and stderr are inspected SEPARATELY and then together: the diagnostic is written to
    # stderr by design, so matching stdout alone would report a correct refusal as a failure.
    Add-Check -Name 'recoverer without IIPS_DATA_DIR exits 1' -Passed ($r.ExitCode -eq 1) -Detail "exit $($r.ExitCode)"
    $diagnosticOk = ($r.Combined -match 'IIPS_DATA_DIR must be set')
    Add-Check -Name 'recoverer states the missing variable' -Passed $diagnosticOk -Detail $r.Combined.Substring(0, [Math]::Min(120, $r.Combined.Length))
    Add-Check -Name 'fail-closed refusal is not a 0-exit success' -Passed ($r.ExitCode -ne 0) -Detail "exit $($r.ExitCode) - a zero exit here would mean the guard did not fire"

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host '-------------------------------------------------------------' -ForegroundColor DarkGray
    $pass = @($script:Checks | Where-Object { $_.Passed }).Count
    $fail = @($script:Checks | Where-Object { -not $_.Passed }).Count
    $summaryColour = 'Red'
    if ($fail -eq 0) { $summaryColour = 'Green' }
    Write-Host "    PASS: $pass    FAIL: $fail" -ForegroundColor $summaryColour
    Write-Host ''

    if (-not $KeepScratch) {
        # Only the scratch directory this run created is removed. Live data is never touched.
        if ($scratch -like (Join-Path $RuntimeRoot 'persistence-verify-*')) {
            Remove-Item -LiteralPath $scratch -Recurse -Force
            Write-Host "Scratch directory removed: $scratch" -ForegroundColor Gray
        }
    }
    if ($KeepScratch) { Write-Host "Scratch directory kept: $scratch" -ForegroundColor Yellow }

    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $csvPath = Join-Path $LogRoot ("05-persistence-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".csv")
    $script:Checks | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
    Write-Host "Result CSV: $csvPath" -ForegroundColor Yellow
    Write-Host ''

    if ($fail -gt 0) {
        Write-Host "FAILED: $fail persistence/recovery assertion(s) did not hold." -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Persistence and restart recovery validation: stopped with exit 3. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 3
    }

    Write-Host 'Persistence and restart recovery verified.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'REMAINING MANUAL CHECK: in the browser, create a watchlist, stop the servers with' -ForegroundColor Cyan
    Write-Host '06-Stop-IipsServers.ps1, restart with 03-Start-IipsServers.ps1, and confirm the' -ForegroundColor Cyan
    Write-Host 'watchlist is still listed at http://localhost:5176/watchlists' -ForegroundColor Cyan
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'Persistence and restart recovery validation: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    Write-Host ''
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Persistence and restart recovery validation: stopped with exit 1. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 1
}
