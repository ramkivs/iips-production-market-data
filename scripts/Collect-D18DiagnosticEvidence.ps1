#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS D-18 Diagnostic C - Consolidated read-only evidence collector for AGI raw-depth capture.

.DESCRIPTION
    Collects a self-contained, timestamped, strictly read-only diagnostic evidence bundle under:
        <OutputRoot>\<yyyyMMdd-HHmmssZ>\
    Default OutputRoot: <RuntimeRoot>\dhan-d18-diagnostics (i.e. H:\IIPS\runtime\dhan-d18-diagnostics),
    kept strictly separate from the D-18 raw-depth capture output directory
    (H:\IIPS\runtime\dhan-d18-depth-capture) and outside both git repositories
    (H:\IIPS\iips-production-market-data and H:\IIPS\iips-review-recovered).

    STRICT GUARANTEES:
      - ZERO vendor requests (never calls POST /v1/quotes or POST /v1/connection/verify).
      - ZERO repository writes, git mutations, builds, or service start/stop actions.
      - ZERO credential reads (never touches DPAPI carriers or decrypts secrets).
      - ZERO secret leakage (multi-pattern redaction + explicit stripping of any active session
        IIPS_MARKET_DATA_TRANSPORT_TOKEN before any file is written).
      - FAIL-CLOSED destination separation: refuses to write diagnostic bundles inside the D-18
        capture output directory or inside either git working tree.

    BUNDLE CONTENTS:
      01-environment-and-process.json   Output of Test-D18EnvironmentAndProcess.ps1
      02-capture-path-readonly.json     Output of Test-D18CapturePath.ps1 (read-only mode)
      03-daemon-logs-sanitized.txt      Redacted tails of newest daemon err/out logs
      04-newest-pid-manifest.json       Sanitized copy of newest iips-pids-*.json manifest (if any)
      05-summary.txt                    Human-readable diagnostic summary and next-step pointers
      manifest.json                     Bundle metadata, guarantees, and SHA-256 inventory
      SHA256SUMS.txt                    SHA-256 digests of all artifacts including manifest.json

    EXIT CODES
      0  evidence bundle collected, hashed, and verified cleanly
      1  unhandled error
      2  precondition failure (missing sibling diagnostic script or invalid output destination)

.EXAMPLE
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Collect-D18DiagnosticEvidence.ps1 -NoPause

.EXAMPLE
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Collect-D18DiagnosticEvidence.ps1 `
      -InstallRoot 'H:\IIPS' -OutputRoot 'H:\IIPS\runtime\dhan-d18-diagnostics' -NoPause
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [string] $RuntimeRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $ScriptsRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $OutputRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateSet('127.0.0.1', 'localhost')]
    [string] $BindAddress = '127.0.0.1',

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $MarketDataPort = 8791,

    [Parameter(Mandatory = $false)]
    [string] $CapturePath = '',

    [Parameter(Mandatory = $false)]
    [ValidateSet('NSE_EQ', 'BSE_EQ')]
    [string] $ExpectedSegment = 'NSE_EQ',

    [Parameter(Mandatory = $false)]
    [ValidatePattern('^[1-9][0-9]*$')]
    [string] $ExpectedSecurityId = '1412',

    [Parameter(Mandatory = $false)]
    [switch] $SkipDaemonHttpProbes,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-D18Step {
    param([string] $Id, [string] $Title)
    Write-Host ''
    Write-Host "[$Id] $Title" -ForegroundColor Cyan
}

function Write-D18Info {
    param([string] $Message)
    Write-Host "  INFO  $Message" -ForegroundColor Gray
}

function Write-D18Ok {
    param([string] $Message)
    Write-Host "  OK    $Message" -ForegroundColor Green
}

function Write-D18Warn {
    param([string] $Message)
    Write-Host "  WARN  $Message" -ForegroundColor Yellow
}

function Write-D18Fail {
    param([string] $Message)
    Write-Host "  FAIL  $Message" -ForegroundColor Red
}

function Write-IipsPause {
    param([switch] $NoPause)
    if ($NoPause) { return }
    Write-Host ''
    Write-Host 'Press Enter to close this window...' -ForegroundColor Yellow
    try { $null = Read-Host }
    catch { Write-Host '(no interactive input available - continuing without a pause)' -ForegroundColor DarkGray }
}

function Write-IipsFinalStatus {
    param(
        [ValidateSet('PASS', 'FAIL')] [string] $Outcome,
        [string] $Message,
        [int] $ExitCode = 0,
        [switch] $NoPause
    )
    $colour = 'Green'
    if ($Outcome -eq 'FAIL') { $colour = 'Red' }
    Write-Host ''
    Write-Host '=============================================================' -ForegroundColor $colour
    Write-Host " FINAL STATUS: $Outcome" -ForegroundColor $colour
    Write-Host " $Message" -ForegroundColor $colour
    Write-Host '=============================================================' -ForegroundColor $colour
    Write-IipsPause -NoPause:$NoPause
    return $ExitCode
}

function Redact-D18Text {
    param([string] $Text)
    if ([string]::IsNullOrEmpty($Text)) { return '' }
    $out = $Text
    $sessionToken = [string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
    if (-not [string]::IsNullOrWhiteSpace($sessionToken) -and $sessionToken.Length -ge 4) {
        $out = $out.Replace($sessionToken, '[REDACTED_SESSION_TOKEN]')
    }
    $out = [regex]::Replace($out, '(?i)(Bearer\s+)[^\s''"`]+', '$1[REDACTED]')
    $out = [regex]::Replace($out, '(?i)(access-token|client-id|authorization)\s*[:=]\s*[^\s,;''"`]+', '$1=[REDACTED]')
    $out = [regex]::Replace($out, '(?i)vault://[^\s''"`),;]+', 'vault://[REDACTED]')
    $out = [regex]::Replace($out, '\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b', '[REDACTED_JWT]')
    $out = [regex]::Replace($out, '(?i)(IIPS_MARKET_DATA_TRANSPORT_TOKEN|DHAN_ACCESS_TOKEN|DHAN_CLIENT_ID|TOKEN|SECRET|PASSWORD)\s*=\s*[^\s;''"`]+', '$1=[REDACTED]')
    return $out
}

function Write-D18Utf8File {
    param([string] $Path, [string] $Content)
    $safeContent = Redact-D18Text -Text $Content
    [System.IO.File]::WriteAllText($Path, $safeContent, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-D18Prop {
    param($Object, [string] $Name)
    if ($null -eq $Object) { return $null }
    $p = $Object.PSObject.Properties[$Name]
    if ($null -eq $p) { return $null }
    return $p.Value
}

function Test-D18PathInsideRoot {
    param(
        [string] $CandidatePath,
        [string] $RootPath
    )
    if ([string]::IsNullOrWhiteSpace($CandidatePath) -or [string]::IsNullOrWhiteSpace($RootPath)) {
        return $false
    }
    try {
        $candFull = [System.IO.Path]::GetFullPath($CandidatePath).TrimEnd('\', '/')
        $rootFull = [System.IO.Path]::GetFullPath($RootPath).TrimEnd('\', '/')
        if ($candFull.Equals($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
        $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar
        return $candFull.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
    } catch {
        return $false
    }
}

try {
    if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
    if ([string]::IsNullOrWhiteSpace($LogRoot))     { $LogRoot     = Join-Path $InstallRoot 'logs' }
    if ([string]::IsNullOrWhiteSpace($CapturePath)) {
        $CapturePath = Join-Path (Join-Path $RuntimeRoot 'dhan-d18-depth-capture') 'agi-depth.json'
    }
    if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
        $OutputRoot = Join-Path $RuntimeRoot 'dhan-d18-diagnostics'
    }

    $ipdRoot = Join-Path $InstallRoot 'iips-production-market-data'
    $irrRoot = Join-Path $InstallRoot 'iips-review-recovered'
    $captureDir = Split-Path -Parent $CapturePath
    $armMarkerPath = "$CapturePath.arm"

    if (Test-D18PathInsideRoot -CandidatePath $OutputRoot -RootPath $captureDir) {
        Write-D18Fail "Refusing -OutputRoot inside D-18 capture directory ($captureDir): $OutputRoot"
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Evidence bundle destination must remain strictly separate from the D-18 capture output directory.' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }
    if ((Test-D18PathInsideRoot -CandidatePath $OutputRoot -RootPath $ipdRoot) -or (Test-D18PathInsideRoot -CandidatePath $OutputRoot -RootPath $irrRoot)) {
        Write-D18Fail "Refusing -OutputRoot inside a git repository working tree: $OutputRoot"
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Evidence bundle destination must be outside both git repositories.' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }

    $scriptA = Join-Path $PSScriptRoot 'Test-D18EnvironmentAndProcess.ps1'
    $scriptB = Join-Path $PSScriptRoot 'Test-D18CapturePath.ps1'
    if (-not (Test-Path -LiteralPath $scriptA)) {
        Write-D18Fail "Required sibling script missing: $scriptA"
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Missing Test-D18EnvironmentAndProcess.ps1' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }
    if (-not (Test-Path -LiteralPath $scriptB)) {
        Write-D18Fail "Required sibling script missing: $scriptB"
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Missing Test-D18CapturePath.ps1' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }

    $stampUtc = [datetime]::UtcNow.ToString('yyyyMMdd-HHmmssZ')
    $collectedAtUtc = [datetime]::UtcNow.ToString('o')
    $bundleDir = Join-Path $OutputRoot $stampUtc
    New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null

    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS D-18 Diagnostic C - Read-Only Evidence Collector ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-D18Info "Collected UTC : $collectedAtUtc"
    Write-D18Info "Bundle Dir    : $bundleDir"
    Write-D18Info "InstallRoot   : $InstallRoot"
    Write-D18Info "IPD Repo      : $ipdRoot"
    Write-D18Info "IRR Repo      : $irrRoot"
    Write-D18Info "RuntimeRoot   : $RuntimeRoot"
    Write-D18Info "LogRoot       : $LogRoot"
    Write-D18Info "CapturePath   : $CapturePath"
    Write-D18Info "ArmMarker     : $armMarkerPath"
    Write-D18Info "Vendor Calls  : 0 (strictly read-only collector)"

    # -----------------------------------------------------------------------------------------
    Write-D18Step '01-run-env-process' 'Running Diagnostic A (environment, process, compiled modules, filesystem)'

    $envProcFile = Join-Path $bundleDir '01-environment-and-process.json'
    $envProcExit = 0
    $diagAParams = @{
        InstallRoot        = $InstallRoot
        RuntimeRoot        = $RuntimeRoot
        LogRoot            = $LogRoot
        MarketDataPort     = $MarketDataPort
        CapturePath        = $CapturePath
        ExpectedSegment    = $ExpectedSegment
        ExpectedSecurityId = $ExpectedSecurityId
        OutputFile         = $envProcFile
        NoPause            = $true
    }
    if (-not [string]::IsNullOrWhiteSpace($ScriptsRoot)) {
        $diagAParams['ScriptsRoot'] = $ScriptsRoot
    }
    try {
        & $scriptA @diagAParams
        $envProcExit = $LASTEXITCODE
    } catch {
        $envProcExit = 1
        Write-D18Warn ("Diagnostic A threw: " + (Redact-D18Text -Text ([string]$_.Exception.Message)))
    }
    Write-D18Info "Diagnostic A exit code: $envProcExit"

    # -----------------------------------------------------------------------------------------
    Write-D18Step '02-run-capture-path-readonly' 'Running Diagnostic B in strictly read-only mode (no quote sent)'

    $capturePathFile = Join-Path $bundleDir '02-capture-path-readonly.json'
    $capturePathExit = $null
    $tokenPresent = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN)

    if ($SkipDaemonHttpProbes) {
        $skipDoc = ([pscustomobject]@{
            schemaVersion    = 1
            diagnostic       = 'D18_CAPTURE_PATH'
            skipped          = $true
            reason           = 'SKIPPED_BY_OPERATOR_SWITCH'
            noVendorRequests = $true
        } | ConvertTo-Json -Depth 5) + "`n"
        Write-D18Utf8File -Path $capturePathFile -Content $skipDoc
        Write-D18Info 'Skipped daemon HTTP probes (-SkipDaemonHttpProbes).'
    }
    if (-not $SkipDaemonHttpProbes -and -not $tokenPresent) {
        $skipDoc = ([pscustomobject]@{
            schemaVersion    = 1
            diagnostic       = 'D18_CAPTURE_PATH'
            skipped          = $true
            reason           = 'IIPS_MARKET_DATA_TRANSPORT_TOKEN_UNSET_IN_COLLECTOR_SESSION'
            noVendorRequests = $true
        } | ConvertTo-Json -Depth 5) + "`n"
        Write-D18Utf8File -Path $capturePathFile -Content $skipDoc
        Write-D18Warn 'Skipped daemon HTTP probes because IIPS_MARKET_DATA_TRANSPORT_TOKEN is unset in this PowerShell window.'
    }
    if (-not $SkipDaemonHttpProbes -and $tokenPresent) {
        try {
            & $scriptB -InstallRoot $InstallRoot -RuntimeRoot $RuntimeRoot -LogRoot $LogRoot `
                -BindAddress $BindAddress -MarketDataPort $MarketDataPort -CapturePath $CapturePath `
                -ExchangeSegment $ExpectedSegment -ExpectedDhanSecurityId $ExpectedSecurityId `
                -OutputFile $capturePathFile -NoPause
            $capturePathExit = $LASTEXITCODE
        } catch {
            $capturePathExit = 1
            Write-D18Warn ("Diagnostic B threw: " + (Redact-D18Text -Text ([string]$_.Exception.Message)))
        }
        Write-D18Info "Diagnostic B (read-only) exit code: $capturePathExit"
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '03-collect-logs-and-manifest' 'Collecting redacted daemon logs and newest PID manifest'

    $envProcObj = $null
    if (Test-Path -LiteralPath $envProcFile) {
        try { $envProcObj = Get-Content -LiteralPath $envProcFile -Raw | ConvertFrom-Json } catch { $envProcObj = $null }
    }

    $logDumpLines = New-Object System.Collections.Generic.List[string]
    $logDumpLines.Add("# IIPS D-18 Sanitized Daemon Logs (collected $collectedAtUtc)")
    $logDumpLines.Add("# Redaction applied; zero secrets or bearer tokens retained.")
    $logDumpLines.Add('')

    $daemonLogsObj = Get-D18Prop -Object $envProcObj -Name 'daemonLogs'
    $errPath = [string](Get-D18Prop -Object $daemonLogsObj -Name 'errLogPath')
    $outPath = [string](Get-D18Prop -Object $daemonLogsObj -Name 'outLogPath')

    $logDumpLines.Add("=== STDERR LOG: $errPath ===")
    if (-not [string]::IsNullOrWhiteSpace($errPath) -and (Test-Path -LiteralPath $errPath)) {
        $rawErr = @(Get-Content -LiteralPath $errPath -Tail 200 -ErrorAction SilentlyContinue)
        foreach ($ln in $rawErr) { $logDumpLines.Add((Redact-D18Text -Text ([string]$ln))) }
    }
    if ([string]::IsNullOrWhiteSpace($errPath) -or -not (Test-Path -LiteralPath $errPath)) {
        $logDumpLines.Add('(no daemon stderr log found)')
    }
    $logDumpLines.Add('')
    $logDumpLines.Add("=== STDOUT LOG: $outPath ===")
    if (-not [string]::IsNullOrWhiteSpace($outPath) -and (Test-Path -LiteralPath $outPath)) {
        $rawOut = @(Get-Content -LiteralPath $outPath -Tail 100 -ErrorAction SilentlyContinue)
        foreach ($ln in $rawOut) { $logDumpLines.Add((Redact-D18Text -Text ([string]$ln))) }
    }
    if ([string]::IsNullOrWhiteSpace($outPath) -or -not (Test-Path -LiteralPath $outPath)) {
        $logDumpLines.Add('(no daemon stdout log found)')
    }

    $logsFile = Join-Path $bundleDir '03-daemon-logs-sanitized.txt'
    Write-D18Utf8File -Path $logsFile -Content (($logDumpLines -join "`n") + "`n")
    Write-D18Ok "Sanitized logs written: $logsFile"

    $manifestCopyFile = Join-Path $bundleDir '04-newest-pid-manifest.json'
    $manifestObj = Get-D18Prop -Object $envProcObj -Name 'manifest'
    $newestManifestPath = [string](Get-D18Prop -Object $manifestObj -Name 'newestManifestPath')
    if (-not [string]::IsNullOrWhiteSpace($newestManifestPath) -and (Test-Path -LiteralPath $newestManifestPath)) {
        $rawManifest = Get-Content -LiteralPath $newestManifestPath -Raw
        Write-D18Utf8File -Path $manifestCopyFile -Content ($rawManifest.TrimEnd() + "`n")
        Write-D18Ok "PID manifest snapshot written: $manifestCopyFile"
    }
    if ([string]::IsNullOrWhiteSpace($newestManifestPath) -or -not (Test-Path -LiteralPath $newestManifestPath)) {
        $absentManifest = ([pscustomobject]@{ present = $false; searchedLogRoot = $LogRoot } | ConvertTo-Json -Depth 3) + "`n"
        Write-D18Utf8File -Path $manifestCopyFile -Content $absentManifest
        Write-D18Info 'No PID manifest present; recorded explicit absence stub.'
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '04-summary-and-hashes' 'Writing human-readable summary, manifest.json, and SHA256SUMS.txt'

    $capturePathObj = $null
    if (Test-Path -LiteralPath $capturePathFile) {
        try { $capturePathObj = Get-Content -LiteralPath $capturePathFile -Raw | ConvertFrom-Json } catch { $capturePathObj = $null }
    }

    $summaryLines = New-Object System.Collections.Generic.List[string]
    $summaryLines.Add('IIPS D-18 AGI Greenpac Raw-Depth Capture - Read-Only Diagnostic Summary')
    $summaryLines.Add('=======================================================================')
    $summaryLines.Add("Collected UTC          : $collectedAtUtc")
    $summaryLines.Add("Bundle Directory       : $bundleDir")
    $summaryLines.Add("InstallRoot            : $InstallRoot")
    $summaryLines.Add("IPD Repository         : $ipdRoot")
    $summaryLines.Add("IRR Repository         : $irrRoot")
    $summaryLines.Add("RuntimeRoot            : $RuntimeRoot")
    $summaryLines.Add("LogRoot                : $LogRoot")
    $summaryLines.Add("CapturePath (separate) : $CapturePath")
    $summaryLines.Add("ArmMarker (separate)   : $armMarkerPath")
    $summaryLines.Add("PowerShell Engine      : $($PSVersionTable.PSVersion) ($($PSVersionTable.PSEdition))")
    $summaryLines.Add("Vendor Requests Issued : 0 (strictly read-only)")
    $summaryLines.Add("Secrets Collected      : none (strictly redacted)")
    $summaryLines.Add("Diagnostic A Exit Code : $envProcExit")
    $summaryLines.Add("Diagnostic B Exit Code : $capturePathExit")
    $summaryLines.Add('')

    $repoObj = Get-D18Prop -Object $envProcObj -Name 'repository'
    $dcModObj = Get-D18Prop -Object $repoObj -Name 'depthCaptureModule'
    $summaryLines.Add("IPD Git HEAD           : $(Get-D18Prop -Object $repoObj -Name 'gitHead') ($(Get-D18Prop -Object $repoObj -Name 'gitBranch'))")
    $summaryLines.Add("dhan_depth_capture.js  : $(Get-D18Prop -Object $dcModObj -Name 'classification') ($((Get-D18Prop -Object $dcModObj -Name 'sizeBytes')) bytes)")
    $summaryLines.Add("dhan_depth_capture sha : $(Get-D18Prop -Object $dcModObj -Name 'sha256')")

    $diagBRes = Get-D18Prop -Object $capturePathObj -Name 'diagnosis'
    if ($null -ne $diagBRes) {
        $summaryLines.Add("Capture-Path Preflight : $(Get-D18Prop -Object $diagBRes -Name 'code')")
        $summaryLines.Add("Preflight Detail       : $(Get-D18Prop -Object $diagBRes -Name 'detail')")
    }
    $summaryLines.Add('')
    $summaryLines.Add('Findings from Diagnostic A:')
    $findingsArr = @(Get-D18Prop -Object $envProcObj -Name 'findings')
    foreach ($f in $findingsArr) {
        $summaryLines.Add(("  [{0}] {1}: {2}" -f (Get-D18Prop -Object $f -Name 'severity'), (Get-D18Prop -Object $f -Name 'code'), (Get-D18Prop -Object $f -Name 'message')))
    }

    $summaryFile = Join-Path $bundleDir '05-summary.txt'
    Write-D18Utf8File -Path $summaryFile -Content (($summaryLines -join "`n") + "`n")

    $artifactNames = @(
        '01-environment-and-process.json',
        '02-capture-path-readonly.json',
        '03-daemon-logs-sanitized.txt',
        '04-newest-pid-manifest.json',
        '05-summary.txt'
    )

    $artifactEntries = New-Object System.Collections.Generic.List[object]
    foreach ($name in $artifactNames) {
        $full = Join-Path $bundleDir $name
        if (-not (Test-Path -LiteralPath $full)) { continue }
        $item = Get-Item -LiteralPath $full
        $sha = (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()
        $artifactEntries.Add([pscustomobject]@{
            file      = $name
            sizeBytes = [int64]$item.Length
            sha256    = $sha
        })
    }

    $bundleManifest = [pscustomobject]@{
        schemaVersion          = 1
        evidenceId             = 'IIPS-D18-AGI-DIAGNOSTIC-BUNDLE'
        collectedAtUtc         = $collectedAtUtc
        bundleStampUtc         = $stampUtc
        installRoot            = $InstallRoot
        ipdRoot                = $ipdRoot
        irrRoot                = $irrRoot
        runtimeRoot            = $RuntimeRoot
        logRoot                = $LogRoot
        capturePath            = $CapturePath
        armMarkerPath          = $armMarkerPath
        outputRoot             = $OutputRoot
        bundleDirectory        = $bundleDir
        powershellVersion      = [string]$PSVersionTable.PSVersion
        powershellEdition      = [string]$PSVersionTable.PSEdition
        noVendorRequestsIssued = $true
        noSecretsCollected     = $true
        noRepoMutations        = $true
        diagnosticAExitCode    = $envProcExit
        diagnosticBExitCode    = $capturePathExit
        artifacts              = @($artifactEntries)
    }

    $manifestFile = Join-Path $bundleDir 'manifest.json'
    Write-D18Utf8File -Path $manifestFile -Content (($bundleManifest | ConvertTo-Json -Depth 8) + "`n")

    $shaLines = New-Object System.Collections.Generic.List[string]
    foreach ($a in $artifactEntries) {
        $shaLines.Add(("{0}  {1}" -f $a.sha256, $a.file))
    }
    $manifestSha = (Get-FileHash -LiteralPath $manifestFile -Algorithm SHA256).Hash.ToLowerInvariant()
    $shaLines.Add(("{0}  manifest.json" -f $manifestSha))

    $shaFile = Join-Path $bundleDir 'SHA256SUMS.txt'
    Write-D18Utf8File -Path $shaFile -Content (($shaLines -join "`n") + "`n")

    Write-D18Ok "Bundle manifest : $manifestFile"
    Write-D18Ok "SHA-256 sums    : $shaFile"
    Write-IipsFinalStatus -Outcome 'PASS' -Message "Read-only D-18 diagnostic evidence collected in $bundleDir" -ExitCode 0 -NoPause:$NoPause | Out-Null
    exit 0
} catch {
    $safeErr = Redact-D18Text -Text ([string]$_.Exception.Message)
    Write-D18Fail "Unhandled collector error: $safeErr"
    Write-IipsFinalStatus -Outcome 'FAIL' -Message "D-18 diagnostic evidence collection failed: $safeErr" -ExitCode 1 -NoPause:$NoPause | Out-Null
    exit 1
}
