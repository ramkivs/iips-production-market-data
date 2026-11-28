#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS D-18 Diagnostic A - Environment, daemon process, compiled module, and filesystem audit.

.DESCRIPTION
    Strictly read-only by default (zero vendor requests, zero service restarts, zero repository
    changes, zero secret disclosure). Inspects:
      1. Active PowerShell session environment variables (exact non-secret D-18 target/path values;
         boolean SET/UNSET presence only for tokens and secret paths - never prints secret values).
      2. Process owning TCP port 8791 (PID, parent PID, executable, creation time UTC, redacted
         command line) plus any other running dhan_local_daemon.js processes.
      3. Newest H:\IIPS\logs\iips-pids-*.json manifest and ipd-market-data-daemon.*.log tails
         (sanitized), including whether [dhan-depth-capture] startup/outcome lines are present.
      4. IPD git checkout commit/branch/status, companion IRR checkout presence/HEAD, authoritative
         tracked scripts under H:\IIPS\iips-production-market-data\windows-setup (plus optional
         external copy drift comparison ONLY when -ScriptsRoot is explicitly provided), and exact
         sizes/timestamps/SHA-256/capability fingerprints for compiled dist\ modules
         (dhan_depth_capture.js, dhan_api_client.js, dhan_local_daemon.js), comparing daemon
         process creation time against dist\ build timestamps.
      5. Capture directory contents, marker/output files, ACL summary, and optional write probe
         (only if -TestDirectoryWrite is explicitly supplied).
      6. W-23 persisted market-data state file presence and non-secret metadata (to detect
         restart-restored cached quotes that can bypass Dhan egress).

    EXIT CODES
      0  diagnostic completed with no FAIL-level blockers detected
      1  unhandled error
      2  precondition failure (missing install root, missing IPD checkout, or invalid output path)
      3  diagnostic completed and detected one or more FAIL-level blockers

.EXAMPLE
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Test-D18EnvironmentAndProcess.ps1 -NoPause

.EXAMPLE
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Test-D18EnvironmentAndProcess.ps1 `
      -InstallRoot 'H:\IIPS' -CapturePath 'H:\IIPS\runtime\dhan-d18-depth-capture\agi-depth.json' `
      -ExpectedSegment 'NSE_EQ' -ExpectedSecurityId '1412' `
      -OutputFile 'H:\IIPS\runtime\dhan-d18-diagnostics\env-proc.json' -NoPause
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
    [string] $OutputFile = '',

    [Parameter(Mandatory = $false)]
    [switch] $TestDirectoryWrite,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:Findings = New-Object System.Collections.Generic.List[object]

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

function Add-D18Finding {
    param(
        [ValidateSet('PASS', 'WARN', 'FAIL', 'INFO')]
        [string] $Severity,
        [string] $Code,
        [string] $Message
    )
    $script:Findings.Add([pscustomobject]@{
        severity = $Severity
        code     = $Code
        message  = $Message
    })
    if ($Severity -eq 'PASS') { Write-D18Ok "[$Code] $Message" }
    if ($Severity -eq 'WARN') { Write-D18Warn "[$Code] $Message" }
    if ($Severity -eq 'FAIL') { Write-D18Fail "[$Code] $Message" }
    if ($Severity -eq 'INFO') { Write-D18Info "[$Code] $Message" }
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

function Invoke-D18BoundedCommand {
    param(
        [string] $Executable,
        [string[]] $Arguments,
        [string] $WorkingDirectory,
        [int] $TimeoutMs = 15000
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Executable
    $quoted = @()
    foreach ($a in $Arguments) {
        $s = [string]$a
        if ($s -match '[\s"]') { $quoted += ('"' + $s.Replace('"', '\"') + '"') }
        if ($s -notmatch '[\s"]') { $quoted += $s }
    }
    $psi.Arguments = ($quoted -join ' ')
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $started = $false
    try { $started = $proc.Start() } catch { $started = $false }
    if (-not $started) {
        try { $proc.Dispose() } catch { }
        return [pscustomobject]@{ ok = $false; exitCode = -1; stdout = ''; stderr = 'START_FAILED' }
    }
    $outTask = $proc.StandardOutput.ReadToEndAsync()
    $errTask = $proc.StandardError.ReadToEndAsync()
    $exited = $proc.WaitForExit($TimeoutMs)
    if (-not $exited) {
        try { $proc.Kill() } catch { }
        try { $proc.Dispose() } catch { }
        return [pscustomobject]@{ ok = $false; exitCode = -2; stdout = ''; stderr = 'TIMEOUT' }
    }
    $null = $outTask.Wait(3000)
    $null = $errTask.Wait(3000)
    $code = $proc.ExitCode
    $stdout = ''
    $stderr = ''
    if ($outTask.IsCompleted) { $stdout = [string]$outTask.Result }
    if ($errTask.IsCompleted) { $stderr = [string]$errTask.Result }
    try { $proc.Dispose() } catch { }
    return [pscustomobject]@{ ok = ($code -eq 0); exitCode = $code; stdout = $stdout; stderr = $stderr }
}

function Get-D18FileMetadataSafe {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{
            path             = $Path
            exists           = $false
            isDirectory      = $false
            sizeBytes        = $null
            lastWriteTimeUtc = $null
            sha256           = $null
        }
    }
    $item = Get-Item -LiteralPath $Path
    $isDir = [bool]$item.PSIsContainer
    $sizeVal = $null
    $hashVal = $null
    if (-not $isDir) {
        $sizeVal = [int64]$item.Length
        try { $hashVal = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() } catch { $hashVal = $null }
    }
    return [pscustomobject]@{
        path             = $Path
        exists           = $true
        isDirectory      = $isDir
        sizeBytes        = $sizeVal
        lastWriteTimeUtc = $item.LastWriteTimeUtc.ToString('o')
        sha256           = $hashVal
    }
}

function Get-D18PortOwners {
    param([int] $Port)
    $owners = New-Object System.Collections.Generic.List[object]
    $seen = New-Object System.Collections.Generic.HashSet[string]

    try {
        $conns = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
        foreach ($c in $conns) {
            $stateStr = [string]$c.State
            if ($stateStr -and $stateStr -ne 'Listen' -and $stateStr -ne 'Bound' -and $stateStr -ne '2') { continue }
            $k = "$($c.OwningProcess)|$($c.LocalAddress)|$($c.LocalPort)"
            if ($seen.Add($k)) {
                $owners.Add([pscustomobject]@{
                    source        = 'Get-NetTCPConnection'
                    owningProcess = [int]$c.OwningProcess
                    localAddress  = [string]$c.LocalAddress
                    localPort     = [int]$c.LocalPort
                    state         = $stateStr
                })
            }
        }
    } catch { }

    if ($owners.Count -eq 0) {
        $netstatExe = Join-Path $env:SystemRoot 'System32\netstat.exe'
        if (Test-Path -LiteralPath $netstatExe) {
            $ns = Invoke-D18BoundedCommand -Executable $netstatExe -Arguments @('-ano', '-p', 'TCP') -WorkingDirectory $env:SystemRoot -TimeoutMs 10000
            if ($ns.ok) {
                $lines = @($ns.stdout -split "`r?`n")
                $pat = "^\s*TCP\s+(\S+):$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
                foreach ($line in $lines) {
                    if ($line -match $pat) {
                        $addr = $Matches[1]
                        $pidVal = [int]$Matches[2]
                        $k = "$pidVal|$addr|$Port"
                        if ($seen.Add($k)) {
                            $owners.Add([pscustomobject]@{
                                source        = 'netstat'
                                owningProcess = $pidVal
                                localAddress  = $addr
                                localPort     = $Port
                                state         = 'LISTENING'
                            })
                        }
                    }
                }
            }
        }
    }
    return @($owners)
}

function Get-D18ProcessDetail {
    param([int] $ProcessId)
    $cim = $null
    try { $cim = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue } catch { $cim = $null }
    if ($null -eq $cim) { return $null }

    $createdUtc = $null
    if ($null -ne $cim.CreationDate) {
        try { $createdUtc = ([datetime]$cim.CreationDate).ToUniversalTime().ToString('o') } catch { $createdUtc = [string]$cim.CreationDate }
    }
    $parentInfo = $null
    if ($null -ne $cim.ParentProcessId -and [int]$cim.ParentProcessId -gt 0) {
        try {
            $pCim = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId = $([int]$cim.ParentProcessId)" -ErrorAction SilentlyContinue
            if ($null -ne $pCim) {
                $pCreatedUtc = $null
                if ($null -ne $pCim.CreationDate) {
                    try { $pCreatedUtc = ([datetime]$pCim.CreationDate).ToUniversalTime().ToString('o') } catch { $pCreatedUtc = [string]$pCim.CreationDate }
                }
                $parentInfo = [pscustomobject]@{
                    processId       = [int]$pCim.ProcessId
                    name            = [string]$pCim.Name
                    executablePath  = [string]$pCim.ExecutablePath
                    creationDateUtc = $pCreatedUtc
                }
            }
        } catch { }
    }
    $rawCmd = [string]$cim.CommandLine
    $hasCaptureOnCmdLine = ($rawCmd -match 'IIPS_DHAN_DEPTH_CAPTURE')
    return [pscustomobject]@{
        processId           = [int]$cim.ProcessId
        parentProcessId     = [int]$cim.ParentProcessId
        name                = [string]$cim.Name
        executablePath      = [string]$cim.ExecutablePath
        creationDateUtc     = $createdUtc
        commandLineRedacted = (Redact-D18Text -Text $rawCmd)
        hasCaptureOnCmdLine = [bool]$hasCaptureOnCmdLine
        parent              = $parentInfo
    }
}

function Get-D18PropertyValue {
    param($Object, [string] $Name)
    if ($null -eq $Object) { return $null }
    $prop = $Object.PSObject.Properties[$Name]
    if ($null -eq $prop) { return $null }
    return $prop.Value
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

    $ipdRoot = Join-Path $InstallRoot 'iips-production-market-data'
    $irrRoot = Join-Path $InstallRoot 'iips-review-recovered'
    $repoSetupDir = Join-Path $ipdRoot 'windows-setup'
    $armMarkerPath = "$CapturePath.arm"
    $captureDir = Split-Path -Parent $CapturePath
    $collectedAtUtc = [datetime]::UtcNow.ToString('o')

    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS D-18 Diagnostic A - Environment & Process Audit ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-D18Info "Collected UTC : $collectedAtUtc"
    Write-D18Info "InstallRoot   : $InstallRoot"
    Write-D18Info "IPD Checkout  : $ipdRoot"
    Write-D18Info "IRR Checkout  : $irrRoot"
    Write-D18Info "Setup Scripts : $repoSetupDir"
    Write-D18Info "RuntimeRoot   : $RuntimeRoot"
    Write-D18Info "LogRoot       : $LogRoot"
    Write-D18Info "CapturePath   : $CapturePath"
    Write-D18Info "ArmMarker     : $armMarkerPath"
    Write-D18Info "Target        : $ExpectedSegment / $ExpectedSecurityId"
    Write-D18Info "Port          : $MarketDataPort"

    if (-not (Test-Path -LiteralPath $ipdRoot)) {
        Add-D18Finding -Severity 'FAIL' -Code 'IPD_CHECKOUT_MISSING' -Message "IPD checkout not found at $ipdRoot"
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Precondition failed: IPD checkout missing.' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }

    if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
        if (Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $captureDir) {
            Write-D18Fail "Refusing to write diagnostic output inside D-18 capture directory ($captureDir): $OutputFile"
            Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Precondition failed: -OutputFile must be separate from the D-18 capture directory.' -ExitCode 2 -NoPause:$NoPause | Out-Null
            exit 2
        }
        if ((Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $ipdRoot) -or (Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $irrRoot)) {
            Write-D18Fail "Refusing to write diagnostic output inside a git repository working tree: $OutputFile"
            Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Precondition failed: -OutputFile must be outside both git repositories.' -ExitCode 2 -NoPause:$NoPause | Out-Null
            exit 2
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '01-session-env' 'Inspecting active PowerShell session environment (secrets redacted)'

    $envPath    = [string]$env:IIPS_DHAN_DEPTH_CAPTURE_PATH
    $envSeg     = [string]$env:IIPS_DHAN_DEPTH_CAPTURE_SEGMENT
    $envSecId   = [string]$env:IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID
    $envLabel   = [string]$env:IIPS_DHAN_DEPTH_CAPTURE_LABEL
    $envDebug   = [string]$env:IIPS_DHAN_DEPTH_CAPTURE_DEBUG
    $envDataDir = [string]$env:IIPS_DATA_DIR
    $envState   = [string]$env:IIPS_MARKET_DATA_STATE_PATH
    $envCal     = [string]$env:IIPS_TRADING_CALENDAR_PATH
    $envVault   = [string]$env:IIPS_DHAN_VAULT_BACKEND
    $envHost    = [string]$env:IIPS_MARKET_DATA_DAEMON_HOST
    $envPort    = [string]$env:IIPS_MARKET_DATA_DAEMON_PORT
    $envNodeEnv = [string]$env:NODE_ENV
    $envDeploy  = [string]$env:IIPS_DEPLOYMENT_ENV

    $tokenSet = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN)
    $clientRefSet = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_DHAN_CLIENT_ID_SECRET_PATH)
    $accessRefSet = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH)
    $rawTokenEnvSet = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_DHAN_ACCESS_TOKEN)
    $rawClientEnvSet = -not [string]::IsNullOrWhiteSpace([string]$env:IIPS_DHAN_CLIENT_ID)

    $pathIsRooted = $false
    if (-not [string]::IsNullOrWhiteSpace($envPath)) {
        $pathIsRooted = [System.IO.Path]::IsPathRooted($envPath.Trim())
    }

    $sessionEnvReport = [pscustomobject]@{
        captureVariables = [pscustomobject]@{
            IIPS_DHAN_DEPTH_CAPTURE_PATH        = [pscustomobject]@{ isSet = (-not [string]::IsNullOrWhiteSpace($envPath)); value = $envPath; isRooted = $pathIsRooted }
            IIPS_DHAN_DEPTH_CAPTURE_SEGMENT     = [pscustomobject]@{ isSet = (-not [string]::IsNullOrWhiteSpace($envSeg)); value = $envSeg }
            IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID = [pscustomobject]@{ isSet = (-not [string]::IsNullOrWhiteSpace($envSecId)); value = $envSecId }
            IIPS_DHAN_DEPTH_CAPTURE_LABEL       = [pscustomobject]@{ isSet = (-not [string]::IsNullOrWhiteSpace($envLabel)); value = $envLabel }
            IIPS_DHAN_DEPTH_CAPTURE_DEBUG       = [pscustomobject]@{ isSet = (-not [string]::IsNullOrWhiteSpace($envDebug)); value = $envDebug }
        }
        daemonNonSecretVariables = [pscustomobject]@{
            IIPS_DATA_DIR               = $envDataDir
            IIPS_MARKET_DATA_STATE_PATH = $envState
            IIPS_TRADING_CALENDAR_PATH  = $envCal
            IIPS_DHAN_VAULT_BACKEND     = $envVault
            IIPS_MARKET_DATA_DAEMON_HOST = $envHost
            IIPS_MARKET_DATA_DAEMON_PORT = $envPort
            NODE_ENV                    = $envNodeEnv
            IIPS_DEPLOYMENT_ENV         = $envDeploy
        }
        secretPresenceOnly = [pscustomobject]@{
            IIPS_MARKET_DATA_TRANSPORT_TOKEN    = $tokenSet
            IIPS_DHAN_CLIENT_ID_SECRET_PATH     = $clientRefSet
            IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH  = $accessRefSet
            IIPS_DHAN_ACCESS_TOKEN_UNEXPECTED   = $rawTokenEnvSet
            IIPS_DHAN_CLIENT_ID_UNEXPECTED      = $rawClientEnvSet
        }
        note = 'Values reflect THIS PowerShell process only. Windows does not expose another running process environment block via Win32_Process; daemon inheritance must match launch-time session.'
    }

    if ([string]::IsNullOrWhiteSpace($envPath)) {
        Add-D18Finding -Severity 'WARN' -Code 'SESSION_CAPTURE_PATH_UNSET' -Message 'IIPS_DHAN_DEPTH_CAPTURE_PATH is not set in THIS PowerShell session (if the daemon was launched from a different window, that window determined its env).'
    }
    if (-not [string]::IsNullOrWhiteSpace($envPath)) {
        $trimmedPath = $envPath.Trim()
        if ($trimmedPath -ne $CapturePath) {
            Add-D18Finding -Severity 'WARN' -Code 'SESSION_CAPTURE_PATH_MISMATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_PATH ('$trimmedPath') differs from expected -CapturePath ('$CapturePath')."
        }
        if ($trimmedPath -eq $CapturePath) {
            Add-D18Finding -Severity 'PASS' -Code 'SESSION_CAPTURE_PATH_MATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_PATH matches expected path ($CapturePath)."
        }
        if ($trimmedPath -match "^['""]|['""]$") {
            Add-D18Finding -Severity 'FAIL' -Code 'SESSION_CAPTURE_PATH_LITERAL_QUOTES' -Message 'Session IIPS_DHAN_DEPTH_CAPTURE_PATH contains literal quote characters.'
        }
    }

    if ([string]::IsNullOrWhiteSpace($envSeg) -or $envSeg.Trim() -cne $ExpectedSegment) {
        Add-D18Finding -Severity 'WARN' -Code 'SESSION_SEGMENT_MISMATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_SEGMENT is '$envSeg' (expected exact case-sensitive '$ExpectedSegment')."
    }
    if (-not [string]::IsNullOrWhiteSpace($envSeg) -and $envSeg.Trim() -ceq $ExpectedSegment) {
        Add-D18Finding -Severity 'PASS' -Code 'SESSION_SEGMENT_MATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_SEGMENT matches '$ExpectedSegment'."
    }

    if ([string]::IsNullOrWhiteSpace($envSecId) -or $envSecId.Trim() -ne $ExpectedSecurityId) {
        Add-D18Finding -Severity 'WARN' -Code 'SESSION_SECURITY_ID_MISMATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID is '$envSecId' (expected '$ExpectedSecurityId')."
    }
    if (-not [string]::IsNullOrWhiteSpace($envSecId) -and $envSecId.Trim() -eq $ExpectedSecurityId) {
        Add-D18Finding -Severity 'PASS' -Code 'SESSION_SECURITY_ID_MATCH' -Message "Session IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID matches '$ExpectedSecurityId'."
    }

    if (-not $tokenSet) {
        Add-D18Finding -Severity 'WARN' -Code 'SESSION_TRANSPORT_TOKEN_UNSET' -Message 'IIPS_MARKET_DATA_TRANSPORT_TOKEN is unset in this session (authenticated HTTP probes cannot run from this window).'
    }
    if ($tokenSet) {
        Add-D18Finding -Severity 'PASS' -Code 'SESSION_TRANSPORT_TOKEN_SET' -Message 'IIPS_MARKET_DATA_TRANSPORT_TOKEN is present in this session (value redacted).'
    }

    if (-not [string]::IsNullOrWhiteSpace($envDataDir) -or -not [string]::IsNullOrWhiteSpace($envState)) {
        Add-D18Finding -Severity 'INFO' -Code 'SESSION_W23_STATE_ENV_PRESENT' -Message "Session has W-23 persistence env set (IIPS_DATA_DIR='$envDataDir', IIPS_MARKET_DATA_STATE_PATH='$envState'); a daemon inheriting this restores persisted quotes on startup."
    }
    if (-not [string]::IsNullOrWhiteSpace($envCal)) {
        Add-D18Finding -Severity 'INFO' -Code 'SESSION_TRADING_CALENDAR_SET' -Message "Session has IIPS_TRADING_CALENDAR_PATH='$envCal'; after market close, persisted/cached quotes from near close remain CURRENT all evening."
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '02-port-and-process' "Inspecting port $MarketDataPort listener and daemon processes"

    $portOwners = @(Get-D18PortOwners -Port $MarketDataPort)
    $ownerProcessDetails = New-Object System.Collections.Generic.List[object]
    foreach ($o in $portOwners) {
        $detail = Get-D18ProcessDetail -ProcessId $o.owningProcess
        $ownerProcessDetails.Add([pscustomobject]@{
            listener = $o
            process  = $detail
        })
    }

    $allDaemonProcs = New-Object System.Collections.Generic.List[object]
    try {
        $candidates = @(Get-CimInstance -ClassName Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue)
        foreach ($p in $candidates) {
            $cmd = [string]$p.CommandLine
            if ($cmd -match 'dhan_local_daemon') {
                $d = Get-D18ProcessDetail -ProcessId ([int]$p.ProcessId)
                if ($null -ne $d) { $allDaemonProcs.Add($d) }
            }
        }
    } catch { }

    $primaryOwnerPid = $null
    $primaryOwnerCreatedUtc = $null
    if ($portOwners.Count -eq 0) {
        Add-D18Finding -Severity 'FAIL' -Code 'DAEMON_PORT_NOT_LISTENING' -Message "No listener found on port $MarketDataPort."
    }
    if ($portOwners.Count -gt 0) {
        $primaryOwnerPid = [int]$portOwners[0].owningProcess
        $primaryDetail = $ownerProcessDetails[0].process
        if ($null -ne $primaryDetail) {
            $primaryOwnerCreatedUtc = $primaryDetail.creationDateUtc
            Add-D18Finding -Severity 'PASS' -Code 'DAEMON_PORT_LISTENING' -Message "Port $MarketDataPort owned by PID $primaryOwnerPid ($($primaryDetail.name)), started UTC $primaryOwnerCreatedUtc, parent PID $($primaryDetail.parentProcessId)."
            if ($primaryDetail.hasCaptureOnCmdLine) {
                Add-D18Finding -Severity 'FAIL' -Code 'CAPTURE_ENV_ON_COMMAND_LINE' -Message 'IIPS_DHAN_DEPTH_CAPTURE_* appeared on the daemon command line (must be environment only).'
            }
            if ($primaryDetail.commandLineRedacted -notmatch [regex]::Escape($ipdRoot)) {
                Add-D18Finding -Severity 'WARN' -Code 'DAEMON_CMDLINE_CHECKOUT_MISMATCH' -Message "Daemon command line does not reference $ipdRoot : $($primaryDetail.commandLineRedacted)"
            }
        }
    }
    if ($allDaemonProcs.Count -gt 1) {
        Add-D18Finding -Severity 'WARN' -Code 'MULTIPLE_DAEMON_PROCESSES' -Message "Found $($allDaemonProcs.Count) node.exe processes matching dhan_local_daemon."
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '03-manifest-and-logs' "Inspecting newest PID manifest and daemon logs under $LogRoot"

    $newestManifest = $null
    $manifestDaemonPid = $null
    $manifestDaemonErrLog = $null
    $manifestDaemonOutLog = $null
    $manifestParsed = $null

    if (Test-Path -LiteralPath $LogRoot) {
        $manifests = @(Get-ChildItem -LiteralPath $LogRoot -Filter 'iips-pids-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending)
        if ($manifests.Count -gt 0) {
            $newestManifest = $manifests[0]
            try {
                $manifestParsed = Get-Content -LiteralPath $newestManifest.FullName -Raw | ConvertFrom-Json
                $procsProp = Get-D18PropertyValue -Object $manifestParsed -Name 'processes'
                if ($null -ne $procsProp) {
                    foreach ($row in @($procsProp)) {
                        $lbl = [string](Get-D18PropertyValue -Object $row -Name 'label')
                        if ($lbl -eq 'ipd-market-data-daemon') {
                            $manifestDaemonPid = [int](Get-D18PropertyValue -Object $row -Name 'pid')
                            $manifestDaemonErrLog = [string](Get-D18PropertyValue -Object $row -Name 'errLog')
                            $manifestDaemonOutLog = [string](Get-D18PropertyValue -Object $row -Name 'outLog')
                        }
                    }
                }
            } catch {
                Add-D18Finding -Severity 'WARN' -Code 'MANIFEST_PARSE_FAILED' -Message "Could not parse newest manifest $($newestManifest.FullName)."
            }
        }
    }

    if ($null -eq $newestManifest) {
        Add-D18Finding -Severity 'WARN' -Code 'PID_MANIFEST_ABSENT' -Message "No iips-pids-*.json manifest found under $LogRoot."
    }
    if ($null -ne $newestManifest) {
        Write-D18Info "Newest manifest: $($newestManifest.FullName) ($($newestManifest.LastWriteTimeUtc.ToString('o')))"
        if ($null -eq $manifestDaemonPid) {
            Add-D18Finding -Severity 'FAIL' -Code 'MANIFEST_NO_DAEMON_ROW' -Message 'Newest PID manifest has no ipd-market-data-daemon row (daemon was not started with -StartMarketDataDaemon).'
        }
        if ($null -ne $manifestDaemonPid -and $null -ne $primaryOwnerPid) {
            if ($manifestDaemonPid -ne $primaryOwnerPid) {
                Add-D18Finding -Severity 'FAIL' -Code 'MANIFEST_PID_MISMATCH' -Message "Manifest records ipd-market-data-daemon PID $manifestDaemonPid, but port $MarketDataPort is owned by PID $primaryOwnerPid (unmanaged or stale daemon)."
            }
            if ($manifestDaemonPid -eq $primaryOwnerPid) {
                Add-D18Finding -Severity 'PASS' -Code 'MANIFEST_PID_MATCH' -Message "Port $MarketDataPort owner PID $primaryOwnerPid matches newest PID manifest."
            }
        }
    }

    $newestErrLogPath = $manifestDaemonErrLog
    $newestOutLogPath = $manifestDaemonOutLog
    if ([string]::IsNullOrWhiteSpace($newestErrLogPath) -and (Test-Path -LiteralPath $LogRoot)) {
        $svcDirs = @(Get-ChildItem -LiteralPath $LogRoot -Filter 'services-*' -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending)
        foreach ($sd in $svcDirs) {
            $cand = Join-Path $sd.FullName 'ipd-market-data-daemon.err.log'
            if (Test-Path -LiteralPath $cand) {
                $newestErrLogPath = $cand
                $newestOutLogPath = Join-Path $sd.FullName 'ipd-market-data-daemon.out.log'
                break
            }
        }
    }

    $errTailLines = @()
    $outTailLines = @()
    $d18StartupLines = @()
    $d18OutcomeLines = @()

    if (-not [string]::IsNullOrWhiteSpace($newestErrLogPath) -and (Test-Path -LiteralPath $newestErrLogPath)) {
        $rawErrLines = @(Get-Content -LiteralPath $newestErrLogPath -Tail 80 -ErrorAction SilentlyContinue)
        $errTailLines = @($rawErrLines | ForEach-Object { Redact-D18Text -Text ([string]$_) })
        $d18StartupLines = @($errTailLines | Where-Object { $_ -match '\[dhan-depth-capture\] startup' })
        $d18OutcomeLines = @($errTailLines | Where-Object { $_ -match '\[dhan-depth-capture\] outcome=' })
        Write-D18Info "Daemon err log : $newestErrLogPath ($($errTailLines.Count) tail line(s))"
        if ($d18StartupLines.Count -gt 0) {
            Add-D18Finding -Severity 'PASS' -Code 'DAEMON_LOG_D18_STARTUP_SEEN' -Message "Found D-18 startup line in daemon stderr: $($d18StartupLines[-1])"
        }
        if ($d18StartupLines.Count -eq 0) {
            Add-D18Finding -Severity 'INFO' -Code 'DAEMON_LOG_NO_D18_STARTUP_LINE' -Message 'No [dhan-depth-capture] startup line in daemon stderr (expected on pre-instrumentation builds, OR means IIPS_DHAN_DEPTH_CAPTURE_PATH was unset in the daemon env on instrumented builds).'
        }
        if ($d18OutcomeLines.Count -gt 0) {
            Add-D18Finding -Severity 'INFO' -Code 'DAEMON_LOG_D18_OUTCOMES_SEEN' -Message "Latest D-18 outcome line in daemon stderr: $($d18OutcomeLines[-1])"
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($newestOutLogPath) -and (Test-Path -LiteralPath $newestOutLogPath)) {
        $rawOutLines = @(Get-Content -LiteralPath $newestOutLogPath -Tail 40 -ErrorAction SilentlyContinue)
        $outTailLines = @($rawOutLines | ForEach-Object { Redact-D18Text -Text ([string]$_) })
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '04-repo-and-compiled-modules' 'Checking git state, compiled dist\ modules, and script-copy drift'

    $gitExe = $null
    $gitCmd = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($null -ne $gitCmd) { $gitExe = $gitCmd.Source }

    $gitHead = $null
    $gitBranch = $null
    $gitStatusShort = @()
    $has036374 = $null
    $has452c03 = $null

    if (-not [string]::IsNullOrWhiteSpace($gitExe)) {
        $rHead = Invoke-D18BoundedCommand -Executable $gitExe -Arguments @('rev-parse', 'HEAD') -WorkingDirectory $ipdRoot
        if ($rHead.ok) { $gitHead = $rHead.stdout.Trim() }
        $rBranch = Invoke-D18BoundedCommand -Executable $gitExe -Arguments @('rev-parse', '--abbrev-ref', 'HEAD') -WorkingDirectory $ipdRoot
        if ($rBranch.ok) { $gitBranch = $rBranch.stdout.Trim() }
        $rStatus = Invoke-D18BoundedCommand -Executable $gitExe -Arguments @('status', '--short') -WorkingDirectory $ipdRoot
        if ($rStatus.ok -and -not [string]::IsNullOrWhiteSpace($rStatus.stdout)) {
            $gitStatusShort = @($rStatus.stdout -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        }
        $rAnc1 = Invoke-D18BoundedCommand -Executable $gitExe -Arguments @('merge-base', '--is-ancestor', '036374cf', 'HEAD') -WorkingDirectory $ipdRoot
        $has036374 = [bool]$rAnc1.ok
        $rAnc2 = Invoke-D18BoundedCommand -Executable $gitExe -Arguments @('merge-base', '--is-ancestor', '452c0302', 'HEAD') -WorkingDirectory $ipdRoot
        $has452c03 = [bool]$rAnc2.ok
        Write-D18Info "Git HEAD   : $gitHead ($gitBranch)"
        if ($has036374 -eq $false) {
            Add-D18Finding -Severity 'FAIL' -Code 'GIT_PRE_036374CF' -Message 'IPD checkout does NOT contain commit 036374cf (configurable depth-capture target); AGI capture cannot match.'
        }
        if ($has036374 -eq $true) {
            Add-D18Finding -Severity 'PASS' -Code 'GIT_HAS_036374CF' -Message 'IPD checkout includes commit 036374cf (configurable depth-capture target).'
        }
        if ($has452c03 -eq $false) {
            Add-D18Finding -Severity 'WARN' -Code 'GIT_PRE_452C0302' -Message 'IPD checkout does not include commit 452c0302 (detached-stdin Start-IipsService launcher update).'
        }
    }

    $trackedModules = @(
        @{ name = 'dhan_depth_capture.ts'; rel = 'src\providers\dhan\dhan_depth_capture.ts' },
        @{ name = 'dhan_api_client.ts';    rel = 'src\providers\dhan\dhan_api_client.ts' },
        @{ name = 'dhan_local_daemon.ts';  rel = 'src\providers\dhan\dhan_local_daemon.ts' },
        @{ name = 'dhan_depth_capture.js'; rel = 'dist\src\providers\dhan\dhan_depth_capture.js' },
        @{ name = 'dhan_api_client.js';    rel = 'dist\src\providers\dhan\dhan_api_client.js' },
        @{ name = 'dhan_local_daemon.js';  rel = 'dist\src\providers\dhan\dhan_local_daemon.js' }
    )
    $moduleInventory = @{}
    foreach ($m in $trackedModules) {
        $full = Join-Path $ipdRoot $m.rel
        $moduleInventory[$m.name] = Get-D18FileMetadataSafe -Path $full
    }

    $dcJs = $moduleInventory['dhan_depth_capture.js']
    $acJs = $moduleInventory['dhan_api_client.js']
    $dcTs = $moduleInventory['dhan_depth_capture.ts']
    $acTs = $moduleInventory['dhan_api_client.ts']

    $dcFingerprint = [pscustomobject]@{
        classification              = 'MISSING'
        hasConfigurableSegmentEnv   = $false
        hasResolveDepthCaptureTarget = $false
        hasLegacyReliance2885Gate   = $false
        hasDiagnosticObservability  = $false
        sizeBytes                   = $dcJs.sizeBytes
        sha256                      = $dcJs.sha256
    }

    if (-not $dcJs.exists) {
        Add-D18Finding -Severity 'FAIL' -Code 'DIST_DEPTH_CAPTURE_MISSING' -Message "Compiled module missing: $($dcJs.path)"
    }
    if ($dcJs.exists) {
        $dcText = Get-Content -LiteralPath $dcJs.path -Raw
        $hasSegEnv = ($dcText -match 'IIPS_DHAN_DEPTH_CAPTURE_SEGMENT')
        $hasResolveTarget = ($dcText -match 'resolveDepthCaptureTarget')
        $hasLegacy2885 = ($dcText -match 'isRelianceNseDepthCaptureRequest')
        $hasDiagObs = ($dcText -match 'formatDepthCaptureAttemptDiagnosticLine')

        $classLabel = 'UNKNOWN_BUILD'
        if ($hasLegacy2885 -and -not $hasResolveTarget) { $classLabel = 'LEGACY_HARDCODED_RELIANCE_2885' }
        if ($hasSegEnv -and $hasResolveTarget -and -not $hasDiagObs) { $classLabel = 'CONFIGURABLE_TARGET_PRE_INSTRUMENTATION' }
        if ($hasSegEnv -and $hasResolveTarget -and $hasDiagObs) { $classLabel = 'CONFIGURABLE_TARGET_WITH_DIAGNOSTICS' }

        $dcFingerprint = [pscustomobject]@{
            classification               = $classLabel
            hasConfigurableSegmentEnv    = [bool]$hasSegEnv
            hasResolveDepthCaptureTarget = [bool]$hasResolveTarget
            hasLegacyReliance2885Gate    = [bool]$hasLegacy2885
            hasDiagnosticObservability   = [bool]$hasDiagObs
            sizeBytes                    = $dcJs.sizeBytes
            sha256                       = $dcJs.sha256
        }

        if ($classLabel -eq 'LEGACY_HARDCODED_RELIANCE_2885') {
            Add-D18Finding -Severity 'FAIL' -Code 'COMPILED_LEGACY_2885_MODULE' -Message "Compiled dhan_depth_capture.js ($($dcJs.sizeBytes) bytes) is the legacy hardcoded NSE_EQ/2885 build; it can NEVER capture AGI (1412)."
        }
        if ($classLabel -ne 'LEGACY_HARDCODED_RELIANCE_2885') {
            Add-D18Finding -Severity 'PASS' -Code 'COMPILED_CONFIGURABLE_MODULE' -Message "Compiled dhan_depth_capture.js ($($dcJs.sizeBytes) bytes) fingerprint=$classLabel."
        }

        if ($dcTs.exists -and ([datetime]$dcJs.lastWriteTimeUtc -lt [datetime]$dcTs.lastWriteTimeUtc)) {
            Add-D18Finding -Severity 'FAIL' -Code 'DIST_OLDER_THAN_SRC' -Message "dist dhan_depth_capture.js ($($dcJs.lastWriteTimeUtc)) is older than src dhan_depth_capture.ts ($($dcTs.lastWriteTimeUtc)). Rebuild required."
        }
        if ($acJs.exists -and $acTs.exists -and ([datetime]$acJs.lastWriteTimeUtc -lt [datetime]$acTs.lastWriteTimeUtc)) {
            Add-D18Finding -Severity 'FAIL' -Code 'DIST_API_CLIENT_OLDER_THAN_SRC' -Message "dist dhan_api_client.js ($($acJs.lastWriteTimeUtc)) is older than src dhan_api_client.ts ($($acTs.lastWriteTimeUtc)). Rebuild required."
        }
        if ($null -ne $primaryOwnerCreatedUtc) {
            if ([datetime]$primaryOwnerCreatedUtc -lt [datetime]$dcJs.lastWriteTimeUtc) {
                Add-D18Finding -Severity 'FAIL' -Code 'DAEMON_OLDER_THAN_DIST_BUILD' -Message "Running daemon (started $primaryOwnerCreatedUtc) is OLDER than compiled dhan_depth_capture.js ($($dcJs.lastWriteTimeUtc)). Running process is executing pre-rebuild code."
            }
            if ([datetime]$primaryOwnerCreatedUtc -ge [datetime]$dcJs.lastWriteTimeUtc) {
                Add-D18Finding -Severity 'PASS' -Code 'DAEMON_NEWER_THAN_DIST_BUILD' -Message "Running daemon (started $primaryOwnerCreatedUtc) was launched after compiled dhan_depth_capture.js ($($dcJs.lastWriteTimeUtc))."
            }
        }
    }

    $irrExists = Test-Path -LiteralPath $irrRoot
    $irrGitHead = $null
    $irrGitBranch = $null
    if ($irrExists) {
        try { $irrGitHead = (& git -C $irrRoot rev-parse HEAD 2>$null | Select-Object -First 1) } catch { $irrGitHead = $null }
        try { $irrGitBranch = (& git -C $irrRoot rev-parse --abbrev-ref HEAD 2>$null | Select-Object -First 1) } catch { $irrGitBranch = $null }
        Write-D18Info "IRR Checkout  : present (HEAD=$irrGitHead, branch=$irrGitBranch)"
    }
    if (-not $irrExists) {
        Add-D18Finding -Severity 'INFO' -Code 'IRR_CHECKOUT_ABSENT' -Message "Companion IRR checkout not present at $irrRoot."
    }

    $trackedSetupScripts = New-Object System.Collections.Generic.List[object]
    $setupScriptNames = @('03-Start-IipsServers.ps1', '06-Stop-IipsServers.ps1', '07-Prepare-DepthCapture.ps1', 'Iips-Common.ps1')
    foreach ($sName in $setupScriptNames) {
        $sMeta = Get-D18FileMetadataSafe -Path (Join-Path $repoSetupDir $sName)
        $trackedSetupScripts.Add([pscustomobject]@{
            file             = $sName
            path             = $sMeta.path
            exists           = $sMeta.exists
            sizeBytes        = $sMeta.sizeBytes
            lastWriteTimeUtc = $sMeta.lastWriteTimeUtc
            sha256           = $sMeta.sha256
        })
        if (-not $sMeta.exists) {
            Add-D18Finding -Severity 'FAIL' -Code 'TRACKED_SETUP_SCRIPT_MISSING' -Message "Required tracked setup script missing under ${repoSetupDir}: $sName"
        }
    }

    $scriptDrift = New-Object System.Collections.Generic.List[object]
    if (-not [string]::IsNullOrWhiteSpace($ScriptsRoot)) {
        if (-not (Test-Path -LiteralPath $ScriptsRoot)) {
            Add-D18Finding -Severity 'WARN' -Code 'EXPLICIT_SCRIPTS_ROOT_MISSING' -Message "Explicitly supplied -ScriptsRoot does not exist: $ScriptsRoot (tracked setup scripts live under $repoSetupDir)."
        }
        if ((Test-Path -LiteralPath $ScriptsRoot) -and (Test-Path -LiteralPath $repoSetupDir)) {
            $resolvedScripts = (Resolve-Path -LiteralPath $ScriptsRoot).Path
            $resolvedRepoSetup = (Resolve-Path -LiteralPath $repoSetupDir).Path
            if ($resolvedScripts -ne $resolvedRepoSetup) {
                foreach ($sName in $setupScriptNames) {
                    $aMeta = Get-D18FileMetadataSafe -Path (Join-Path $resolvedScripts $sName)
                    $bMeta = Get-D18FileMetadataSafe -Path (Join-Path $resolvedRepoSetup $sName)
                    $matchesHash = ($aMeta.exists -and $bMeta.exists -and $aMeta.sha256 -eq $bMeta.sha256)
                    $scriptDrift.Add([pscustomobject]@{
                        file             = $sName
                        scriptsRootHash  = $aMeta.sha256
                        repoSetupHash    = $bMeta.sha256
                        identical        = [bool]$matchesHash
                    })
                    if (-not $matchesHash) {
                        Add-D18Finding -Severity 'WARN' -Code 'SCRIPTS_ROOT_DRIFT' -Message "$sName in $resolvedScripts differs from $resolvedRepoSetup (stale launcher copy risk)."
                    }
                }
            }
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '05-capture-directory' "Inspecting capture directory $captureDir"

    $captureDirExists = Test-Path -LiteralPath $captureDir
    $captureFiles = New-Object System.Collections.Generic.List[object]
    $aclSummary = $null
    $writeProbeResult = 'SKIPPED_READ_ONLY'

    if (-not $captureDirExists) {
        Add-D18Finding -Severity 'WARN' -Code 'CAPTURE_DIR_MISSING' -Message "Capture directory does not exist: $captureDir"
    }
    if ($captureDirExists) {
        $entries = @(Get-ChildItem -LiteralPath $captureDir -Force -ErrorAction SilentlyContinue | Sort-Object Name)
        foreach ($e in $entries) {
            $captureFiles.Add((Get-D18FileMetadataSafe -Path $e.FullName))
        }
        try {
            $acl = Get-Acl -LiteralPath $captureDir
            $rules = @($acl.Access | ForEach-Object {
                [pscustomobject]@{
                    identity = [string]$_.IdentityReference
                    rights   = [string]$_.FileSystemRights
                    type     = [string]$_.AccessControlType
                }
            })
            $aclSummary = [pscustomobject]@{
                owner = [string]$acl.Owner
                rules = $rules
            }
        } catch {
            $aclSummary = [pscustomobject]@{ error = 'ACL_READ_FAILED' }
        }
        if ($TestDirectoryWrite) {
            $probeFile = Join-Path $captureDir ('.d18-write-probe-' + [guid]::NewGuid().ToString('N') + '.tmp')
            try {
                Set-Content -LiteralPath $probeFile -Value 'probe' -Encoding ASCII -NoNewline
                Remove-Item -LiteralPath $probeFile -Force
                $writeProbeResult = 'WRITABLE_OK'
                Add-D18Finding -Severity 'PASS' -Code 'CAPTURE_DIR_WRITABLE' -Message "Capture directory write probe succeeded ($captureDir)."
            } catch {
                $writeProbeResult = 'WRITE_FAILED'
                Add-D18Finding -Severity 'FAIL' -Code 'CAPTURE_DIR_NOT_WRITABLE' -Message "Capture directory write probe failed ($captureDir)."
            }
        }
    }

    $targetJsonMeta = Get-D18FileMetadataSafe -Path $CapturePath
    $targetArmMeta  = Get-D18FileMetadataSafe -Path $armMarkerPath
    $defaultJsonMeta = Get-D18FileMetadataSafe -Path (Join-Path $captureDir 'depth-capture.json')
    $defaultArmMeta  = Get-D18FileMetadataSafe -Path (Join-Path $captureDir 'depth-capture.json.arm')

    if ($targetJsonMeta.exists -and $targetJsonMeta.isDirectory) {
        Add-D18Finding -Severity 'FAIL' -Code 'CAPTURE_PATH_IS_DIRECTORY' -Message "Capture path $CapturePath is a directory, not a file (writeDepthCapture fails with EISDIR)."
    }
    if ($targetJsonMeta.exists -and -not $targetJsonMeta.isDirectory) {
        Add-D18Finding -Severity 'PASS' -Code 'CAPTURE_FILE_PRESENT' -Message "Capture file exists: $CapturePath ($($targetJsonMeta.sizeBytes) bytes, $($targetJsonMeta.lastWriteTimeUtc))."
    }
    if (-not $targetJsonMeta.exists) {
        Add-D18Finding -Severity 'INFO' -Code 'CAPTURE_FILE_ABSENT' -Message "Capture file absent: $CapturePath"
    }
    if ($targetArmMeta.exists) {
        Add-D18Finding -Severity 'INFO' -Code 'ARM_MARKER_PRESENT' -Message "Arm marker present: $armMarkerPath ($($targetArmMeta.lastWriteTimeUtc))."
    }
    if (-not $targetArmMeta.exists) {
        Add-D18Finding -Severity 'WARN' -Code 'ARM_MARKER_ABSENT' -Message "Arm marker absent: $armMarkerPath (capture will not fire until armed)."
    }
    if ($defaultArmMeta.exists -and ($armMarkerPath -ne $defaultArmMeta.path)) {
        Add-D18Finding -Severity 'WARN' -Code 'DEFAULT_ARM_MARKER_ALSO_PRESENT' -Message "Legacy default marker $($defaultArmMeta.path) also exists (check for path mismatch between daemon env and armed file)."
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '06-w23-state-file' 'Inspecting W-23 persisted market-data state file (cache-restore check)'

    $stateCandidates = New-Object System.Collections.Generic.List[string]
    $defaultStatePath = Join-Path (Join-Path (Join-Path $RuntimeRoot 'iips-data') 'dhan') 'market-data-state.json'
    $stateCandidates.Add($defaultStatePath)
    if (-not [string]::IsNullOrWhiteSpace($envState) -and $envState.Trim() -ne $defaultStatePath) {
        $stateCandidates.Add($envState.Trim())
    }
    $stateReports = New-Object System.Collections.Generic.List[object]
    foreach ($sp in $stateCandidates) {
        $meta = Get-D18FileMetadataSafe -Path $sp
        $agiEntry = $null
        $quoteCount = $null
        $savedAtUtc = $null
        if ($meta.exists -and -not $meta.isDirectory) {
            try {
                $parsedState = Get-Content -LiteralPath $sp -Raw | ConvertFrom-Json
                $savedAtUtc = Get-D18PropertyValue -Object $parsedState -Name 'savedAtUtc'
                $quotesProp = Get-D18PropertyValue -Object $parsedState -Name 'quotes'
                if ($null -ne $quotesProp) {
                    $qArr = @($quotesProp)
                    $quoteCount = $qArr.Count
                    foreach ($q in $qArr) {
                        $qk = [string](Get-D18PropertyValue -Object $q -Name 'key')
                        if ($qk -match 'EQ_AGI_IN') {
                            $envObj = Get-D18PropertyValue -Object $q -Name 'envelope'
                            $provObj = Get-D18PropertyValue -Object $envObj -Name 'provenance'
                            $agiEntry = [pscustomobject]@{
                                key        = $qk
                                asOf       = Get-D18PropertyValue -Object $provObj -Name 'asOf'
                                receivedAt = Get-D18PropertyValue -Object $provObj -Name 'receivedAt'
                            }
                        }
                    }
                }
            } catch { }
        }
        $stateReports.Add([pscustomobject]@{
            metadata        = $meta
            savedAtUtc      = $savedAtUtc
            persistedQuotes = $quoteCount
            agiPersistedRow = $agiEntry
        })
        if ($null -ne $agiEntry) {
            Add-D18Finding -Severity 'WARN' -Code 'W23_PERSISTED_AGI_QUOTE_FOUND' -Message "W-23 state file $sp contains a persisted EQ_AGI_IN quote (asOf=$($agiEntry.asOf)). If restored as CURRENT on restart, POST /v1/quotes will hit SKIPPED_FRESH and bypass Dhan!"
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '07-summary' 'Compiling structured diagnostic report'

    $failCount = @($script:Findings | Where-Object { $_.severity -eq 'FAIL' }).Count
    $warnCount = @($script:Findings | Where-Object { $_.severity -eq 'WARN' }).Count

    $newestManifestPathValue = $null
    if ($null -ne $newestManifest) { $newestManifestPathValue = $newestManifest.FullName }
    $summaryOutcome = 'NO_FAIL_BLOCKERS_DETECTED'
    if ($failCount -gt 0) { $summaryOutcome = 'FAIL_BLOCKERS_DETECTED' }

    $report = [pscustomobject]@{
        schemaVersion    = 1
        diagnostic       = 'D18_ENVIRONMENT_AND_PROCESS'
        collectedAtUtc   = $collectedAtUtc
        readOnlyMode     = (-not [bool]$TestDirectoryWrite)
        noVendorRequests = $true
        noSecretsEmitted = $true
        parameters       = [pscustomobject]@{
            installRoot        = $InstallRoot
            runtimeRoot        = $RuntimeRoot
            logRoot            = $LogRoot
            scriptsRoot        = $ScriptsRoot
            marketDataPort     = $MarketDataPort
            capturePath        = $CapturePath
            expectedSegment    = $ExpectedSegment
            expectedSecurityId = $ExpectedSecurityId
        }
        sessionEnvironment = $sessionEnvReport
        portOwnership      = @($ownerProcessDetails)
        allDaemonProcesses = @($allDaemonProcs)
        manifest           = [pscustomobject]@{
            newestManifestPath   = $newestManifestPathValue
            manifestDaemonPid    = $manifestDaemonPid
            manifestDaemonErrLog = $manifestDaemonErrLog
            manifestDaemonOutLog = $manifestDaemonOutLog
        }
        daemonLogs         = [pscustomobject]@{
            errLogPath      = $newestErrLogPath
            outLogPath      = $newestOutLogPath
            errTailRedacted = @($errTailLines)
            outTailRedacted = @($outTailLines)
            d18StartupLines = @($d18StartupLines)
            d18OutcomeLines = @($d18OutcomeLines)
        }
        repository         = [pscustomobject]@{
            ipdRoot             = $ipdRoot
            irrRoot             = $irrRoot
            irrExists           = [bool]$irrExists
            irrGitHead          = $irrGitHead
            irrGitBranch        = $irrGitBranch
            windowsSetupDir     = $repoSetupDir
            windowsSetupScripts = @($trackedSetupScripts)
            gitHead             = $gitHead
            gitBranch           = $gitBranch
            gitStatusShort      = @($gitStatusShort)
            hasCommit036374cf   = $has036374
            hasCommit452c0302   = $has452c03
            modules             = $moduleInventory
            depthCaptureModule  = $dcFingerprint
            scriptsRootDrift    = @($scriptDrift)
        }
        captureDirectory   = [pscustomobject]@{
            directoryPath    = $captureDir
            exists           = [bool]$captureDirExists
            writeProbeResult = $writeProbeResult
            targetJson       = $targetJsonMeta
            targetArmMarker  = $targetArmMeta
            defaultJson      = $defaultJsonMeta
            defaultArmMarker = $defaultArmMeta
            files            = @($captureFiles)
            aclSummary       = $aclSummary
        }
        w23StateFiles      = @($stateReports)
        findings           = @($script:Findings)
        summary            = [pscustomobject]@{
            failCount = $failCount
            warnCount = $warnCount
            outcome   = $summaryOutcome
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
        $outDir = Split-Path -Parent $OutputFile
        if (-not [string]::IsNullOrWhiteSpace($outDir) -and -not (Test-Path -LiteralPath $outDir)) {
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
        $jsonText = $report | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($OutputFile, ($jsonText + "`n"), (New-Object System.Text.UTF8Encoding($false)))
        Write-D18Ok "Report written: $OutputFile"
    }

    if ($failCount -gt 0) {
        Write-IipsFinalStatus -Outcome 'FAIL' -Message "D-18 environment/process audit found $failCount FAIL blocker(s) and $warnCount WARN item(s)." -ExitCode 3 -NoPause:$NoPause | Out-Null
        exit 3
    }
    Write-IipsFinalStatus -Outcome 'PASS' -Message "D-18 environment/process audit completed with 0 FAIL blockers ($warnCount WARN item(s))." -ExitCode 0 -NoPause:$NoPause | Out-Null
    exit 0
} catch {
    $safeErr = Redact-D18Text -Text ([string]$_.Exception.Message)
    Write-D18Fail "Unhandled diagnostic error: $safeErr"
    Write-IipsFinalStatus -Outcome 'FAIL' -Message "D-18 environment/process audit failed unexpectedly: $safeErr" -ExitCode 1 -NoPause:$NoPause | Out-Null
    exit 1
}
