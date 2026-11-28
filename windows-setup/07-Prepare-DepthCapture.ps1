#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS D-18 evidence capture - deploy the depth-capture diagnostic and prepare one-shot arming.

.DESCRIPTION
    This is a SUPPORT PROCEDURE for a single temporary diagnostic. It prepares the ground for one
    captured Dhan quote response; it does NOT run the capture and does NOT issue any vendor request.

    WHAT IT DOES
      1. Verifies the IPD checkout holds the depth-capture source and compiled module.
      2. When -Build is passed, builds the IPD checkout so dist\ reflects that source. Without
         -Build it only VERIFIES and reports; it never assumes the build is current.
      3. Creates the capture directory OUTSIDE the git working tree, under
         <InstallRoot>\runtime\ (the existing runtime convention on this host).
      4. Clears any stale capture and arm marker so the one-shot starts from a known state.
      5. When -Arm (and not -Disarm) is passed, creates the arm marker for exactly one capture.
      6. Reports the state that 03-Start-IipsServers.ps1 must be launched in, including the
         explicit target instrument env vars (segment + security ID).

    WHAT IT DELIBERATELY DOES NOT DO
      * No process is started, stopped or restarted. Starting the services - and restarting them so
        the daemon picks up its environment - is 03-Start-IipsServers.ps1's job, with 06 for the
        stop. This script never introduces a second, unmanaged daemon launch.
      * No external vendor request is made. The single quote that produces the evidence is
        issued by the operator, deliberately and separately.
      * No source file, database, carrier or journal is modified.

    THE ENVIRONMENT PROBLEM THIS SCRIPT EXISTS TO SOLVE
      A running Windows process cannot receive a new environment variable. The market-data daemon
      therefore only sees IIPS_DHAN_DEPTH_CAPTURE_* variables if they were present in the environment
      of the PowerShell window that launched it. Arming, by contrast, is a filesystem marker read on
      every request, so arming and re-arming need no restart at all.

      Consequence: 03-Start-IipsServers.ps1 must be launched FROM the same window in which the
      variables below are set, in the same invocation - not from a second window that inherits
      nothing. See the -ShowLaunchCommand output and section 8 of
      docs/integration/DHAN-D18-RAW-DEPTH-CAPTURE-ACTIVATION-2026-11-20.md.

.EXAMPLE
    # First run (from H:\IIPS\iips-production-market-data\windows-setup): build and clear state.
    Set-Location 'H:\IIPS\iips-production-market-data\windows-setup'
    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Build

.EXAMPLE
    # Arm the one-shot immediately before the single configured-target request.
    Set-Location 'H:\IIPS\iips-production-market-data\windows-setup'
    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Arm

.EXAMPLE
    # Configure AGI Greenpac (NSE_EQ / 1412) instead of the default Reliance target.
    Set-Location 'H:\IIPS\iips-production-market-data\windows-setup'
    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Build -CaptureSegment NSE_EQ -CaptureSecurityId 1412 -CapturePath 'H:\IIPS\runtime\dhan-d18-depth-capture\agi-depth.json'

.EXAMPLE
    # Report state only - changes nothing.
    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1

.EXAMPLE
    # Retire the diagnostic: remove the marker and the captured evidence.
    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Disarm -ClearCapture

.OUTPUTS
    Exit 0 = the requested preparation succeeded. Exit 1 = unhandled failure.
    Exit 2 = a precondition failed (missing checkout, source, build, or directory).
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
    [string] $CapturePath = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $CaptureSegment = 'NSE_EQ',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $CaptureSecurityId = '2885',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $Label = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [switch] $Build,

    [Parameter(Mandatory = $false)]
    [switch] $Arm,

    [Parameter(Mandatory = $false)]
    [switch] $Disarm,

    [Parameter(Mandatory = $false)]
    [switch] $ClearCapture,

    [Parameter(Mandatory = $false)]
    [int] $MarketDataPort = 8791,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [switch] $Verify,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
# The manifest lives where 03-Start-IipsServers.ps1 writes it: <LogRoot>\iips-pids-<stamp>.json,
# where LogRoot defaults to <InstallRoot>\logs. This is derived the same way, never assumed.
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }
if ([string]::IsNullOrWhiteSpace($CapturePath)) {
    $CapturePath = Join-Path (Join-Path $RuntimeRoot 'dhan-d18-depth-capture') 'depth-capture.json'
}
if ([string]::IsNullOrWhiteSpace($Label)) {
    $Label = "D-18 depth capture $CaptureSegment $CaptureSecurityId, one market-closed quote"
}

# Absolute by construction: a relative capture path would resolve against whatever directory the
# daemon happened to be started in, which is not something the operator can reason about.
if (-not [System.IO.Path]::IsPathRooted($CapturePath)) {
    throw "the capture path must be absolute so the daemon resolves it unambiguously: '$CapturePath'"
}
$CaptureSegment = $CaptureSegment.Trim()
$CaptureSecurityId = $CaptureSecurityId.Trim()
$allowedCaptureSegments = @('NSE_EQ', 'BSE_EQ')
if ($allowedCaptureSegments -notcontains $CaptureSegment) {
    throw "CaptureSegment must be one of: $($allowedCaptureSegments -join ', ') (got '$CaptureSegment')."
}
if ($CaptureSecurityId -notmatch '^[1-9][0-9]*$') {
    throw "CaptureSecurityId must be a positive integer string (got '$CaptureSecurityId')."
}
$armMarker = "$CapturePath.arm"
$captureDir = Split-Path -Parent $CapturePath

$ipdRoot = Join-Path $InstallRoot 'iips-production-market-data'

function Show-LaunchInstruction {
    param([string] $CaptureFile)

    Write-Host ''
    Write-Host '  NEXT: the daemon must be started by 03-Start-IipsServers.ps1 -StartMarketDataDaemon' -ForegroundColor Yellow
    Write-Host '  FROM THE SAME WINDOW that holds the capture variables.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Two reasons, both hard:' -ForegroundColor Gray
    Write-Host '    1. Only a managed launch records the daemon PID in the run manifest, which is what' -ForegroundColor Gray
    Write-Host '       makes 06-Stop-IipsServers.ps1 able to stop it. A separate launch is unmanaged.' -ForegroundColor Gray
    Write-Host '    2. A running Windows process cannot be given a new environment. The variables must' -ForegroundColor Gray
    Write-Host '       exist when the daemon is created, or the capture silently does nothing.' -ForegroundColor Gray
    Write-Host ''
    Write-Host ("    `$env:IIPS_DHAN_DEPTH_CAPTURE_PATH        = '{0}'" -f $CaptureFile) -ForegroundColor Cyan
    Write-Host ("    `$env:IIPS_DHAN_DEPTH_CAPTURE_SEGMENT     = '{0}'" -f $CaptureSegment) -ForegroundColor Cyan
    Write-Host ("    `$env:IIPS_DHAN_DEPTH_CAPTURE_SECURITY_ID = '{0}'" -f $CaptureSecurityId) -ForegroundColor Cyan
    Write-Host ("    `$env:IIPS_DHAN_DEPTH_CAPTURE_LABEL       = '{0}'" -f $Label) -ForegroundColor Cyan
    Write-Host '    (IIPS_MARKET_DATA_TRANSPORT_TOKEN must also be set in this window)' -ForegroundColor Cyan
    Write-Host ''
    Write-Host ("    Set-Location '{0}'" -f (Join-Path $ipdRoot 'windows-setup')) -ForegroundColor Cyan
    Write-Host '    powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1' -ForegroundColor Cyan
    Write-Host '    powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc -StartMarketDataDaemon' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  Then verify ownership - the daemon row must exist and own port 8791:' -ForegroundColor Yellow
    Write-Host '    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Verify' -ForegroundColor Cyan
    Write-Host ''
    Write-Host "  Then arm and issue exactly one request:" -ForegroundColor Gray
    Write-Host ("    powershell -ExecutionPolicy Bypass -File .\07-Prepare-DepthCapture.ps1 -Arm -CaptureSegment {0} -CaptureSecurityId {1} -CapturePath '{2}'" -f $CaptureSegment, $CaptureSecurityId, $CaptureFile) -ForegroundColor Gray
    Write-Host "    POST http://127.0.0.1:8791/v1/quotes for the configured target ($CaptureSegment / security ID $CaptureSecurityId)" -ForegroundColor Gray
    Write-Host ''
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS D-18 - Depth Capture Preparation ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-IipsInfo "InstallRoot : $InstallRoot"
    Write-IipsInfo "RuntimeRoot : $RuntimeRoot"
    Write-IipsInfo "CapturePath : $CapturePath"
    Write-IipsInfo "Segment     : $CaptureSegment"
    Write-IipsInfo "Security ID : $CaptureSecurityId"
    Write-IipsInfo "Arm marker  : $armMarker"
    Write-IipsInfo "Label       : $Label"

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '01-preconditions' 'Verifying the IPD checkout and the diagnostic source'

    if (-not (Test-Path -LiteralPath $ipdRoot)) {
        throw "the IPD checkout is missing at $ipdRoot - run 01-Fresh-Clone-And-Install.ps1 first."
    }
    $captureSource = Join-Path $ipdRoot 'src\providers\dhan\dhan_depth_capture.ts'
    if (-not (Test-Path -LiteralPath $captureSource)) {
        throw "the depth-capture source is missing at $captureSource, so this checkout predates the diagnostic or is on the wrong branch. Check out the branch that carries it before deploying."
    }
    Write-IipsOk "diagnostic source present: $captureSource"

    $captureModule = Join-Path $ipdRoot 'dist\src\providers\dhan\dhan_depth_capture.js'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '02-build' 'Ensuring the compiled module matches the source'

    if ($Build) {
        $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable
        Write-IipsInfo "building with node $($toolchain.NodeVersion)"
        # The npm shim is started through cmd.exe by absolute path by Invoke-IipsCmdShim; a bare
        # `npm` would resolve to whichever script happens to win PATH. The runner throws on timeout
        # and returns the exit code otherwise, so a non-zero build is checked explicitly.
        $buildResult = Invoke-IipsCmdShim -ShimPath $toolchain.NpmCmd -Arguments @('run', 'build:tsc') `
            -WorkingDirectory $ipdRoot -TimeoutMilliseconds 600000
        if ([int] $buildResult.ExitCode -ne 0) {
            $tail = [string] $buildResult.StdErr
            if ($tail.Length -gt 1200) { $tail = $tail.Substring($tail.Length - 1200) }
            throw "the IPD build failed with exit code $($buildResult.ExitCode). Fix it before deploying; a stale dist\ would deploy the previous implementation. Error tail: $tail"
        }
        Write-IipsOk 'IPD build completed (tsc)'
    }
    if (-not $Build) {
        Write-IipsInfo 'build not requested (-Build not passed) - verifying the existing output only'
    }

    if (-not (Test-Path -LiteralPath $captureModule)) {
        throw "the compiled module is missing at $captureModule. Re-run with -Build. Until it exists the daemon has no diagnostic to load."
    }
    $moduleItem = Get-Item -LiteralPath $captureModule
    Write-IipsOk "compiled module present: $captureModule ($($moduleItem.Length) bytes)"
    Write-IipsInfo 'note: -Build rebuilds; without it this check confirms presence, not freshness'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '03-directory' 'Creating the capture directory outside the git working tree'

    if ($captureDir.ToLowerInvariant().StartsWith($ipdRoot.ToLowerInvariant())) {
        throw "the capture path is inside the IPD git working tree ($captureDir). Captured evidence must not land in a checkout. Choose a path under $RuntimeRoot."
    }
    if (-not (Test-Path -LiteralPath $captureDir)) {
        New-Item -ItemType Directory -Path $captureDir -Force | Out-Null
    }
    Write-IipsOk "capture directory ready: $captureDir"
    Write-IipsInfo 'the directory is outside the repository, so nothing here can be committed or pushed'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '04-state' 'Clearing stale state before arming'

    $hadCapture = Test-Path -LiteralPath $CapturePath
    $hadMarker = Test-Path -LiteralPath $armMarker

    if ($Disarm -or $ClearCapture -or $Arm) {
        if ($hadMarker) {
            Remove-Item -LiteralPath $armMarker -Force
            Write-IipsOk 'removed a pre-existing arm marker'
        }
        if ($hadCapture -and ($ClearCapture -or $Arm)) {
            Remove-Item -LiteralPath $CapturePath -Force
            Write-IipsOk 'removed a previous capture so the evidence is unambiguous'
        }
    }
    if (-not ($Disarm -or $ClearCapture -or $Arm)) {
        Write-IipsInfo 'report-only run - neither the marker nor the capture was touched'
    }

    # -----------------------------------------------------------------------------------------
    if ($Verify) {
        Write-IipsStep '04b-verify' 'Verifying daemon ownership and the inherited capture environment'

        # 1. The manifest must exist where 03 writes it, and must contain a market-data row.
        $manifestFiles = @()
        if (Test-Path -LiteralPath $LogRoot) {
            $manifestFiles = @(Get-ChildItem -LiteralPath $LogRoot -Filter 'iips-pids-*.json' -File -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending)
        }
        if ($manifestFiles.Count -eq 0) {
            throw "no PID manifest found under $LogRoot. 03-Start-IipsServers.ps1 writes iips-pids-<stamp>.json there; without one the daemon was not started as a managed child."
        }
        $manifestPath = $manifestFiles[0].FullName
        Write-IipsInfo "manifest: $manifestPath"
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

        $daemonRow = @($manifest.processes) | Where-Object { $_.label -eq 'ipd-market-data-daemon' }
        if (@($daemonRow).Count -eq 0) {
            throw "the manifest $manifestPath contains no ipd-market-data-daemon row. The daemon was NOT started by 03-Start-IipsServers.ps1 -StartMarketDataDaemon, so it is unmanaged. Do not arm: stop it with 06-Stop-IipsServers.ps1 (which will not match it either) or end that process deliberately, then start the stack through 03."
        }
        $daemonPid = [int] @($daemonRow)[0].pid
        Write-IipsOk "daemon recorded in the manifest: PID $daemonPid"

        # 2. That PID must still be alive.
        $daemonProcess = Get-Process -Id $daemonPid -ErrorAction SilentlyContinue
        if ($null -eq $daemonProcess) {
            throw "the manifest records PID $daemonPid but that process is no longer running. The stack has exited or was replaced; start it again through 03-Start-IipsServers.ps1."
        }
        Write-IipsOk "daemon process is alive: $($daemonProcess.ProcessName) PID $daemonPid"

        # 3. And it must actually own the listener - a manifest entry alone proves nothing.
        $owner = Get-IipsPortOwner -Port $MarketDataPort
        if ($null -eq $owner) {
            throw "nothing is listening on port $MarketDataPort, so the daemon recorded as PID $daemonPid is not serving. Start it through 03-Start-IipsServers.ps1 -StartMarketDataDaemon."
        }
        if ([int] $owner.OwningProcess -ne $daemonPid) {
            throw "port $MarketDataPort is owned by PID $($owner.OwningProcess), but the manifest records PID $daemonPid. The listener and the manifest disagree; do not arm."
        }
        Write-IipsOk "listener ownership verified: port $MarketDataPort -> PID $daemonPid (matches the manifest)"
        Write-IipsInfo "bound address: $($owner.LocalAddress) (must be a loopback address)"

        # 4. Report the command line so the entrypoint is visible, and confirm the capture variable
        #    was NOT put on it. The environment is inherited, and a Windows process environment
        #    cannot be read back from outside - so this is the strongest available check.
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $daemonPid" -ErrorAction SilentlyContinue
        if ($null -ne $cim -and $null -ne $cim.CommandLine) {
            $cmdLine = [string] $cim.CommandLine
            if ($cmdLine -like '*IIPS_DHAN_DEPTH_CAPTURE*') {
                throw "the daemon command line mentions IIPS_DHAN_DEPTH_CAPTURE. Environment variables must never travel on a command line; investigate before arming."
            }
            Write-IipsInfo "command line: $cmdLine"
        }

        Write-IipsWarn 'the daemon environment cannot be read back from outside the process.'
        Write-IipsWarn 'If the capture variables were not set in the session that launched 03, the capture will'
        Write-IipsWarn 'silently produce no file. The only positive evidence is a capture file appearing after the'
        Write-IipsWarn 'single quote; a missing file is not proof of anything (see section 8 of the activation record).'
        Write-IipsOk 'ownership chain verified: manifest row -> live PID -> bound listener'
    }
    if (-not $Verify) {
        Write-IipsStep '04b-verify' 'Skipped - pass -Verify to check manifest ownership and the listener PID before arming'
    }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '05-arm' 'Arming exactly one capture'

    if ($Disarm) {
        Write-IipsOk 'disarmed - the diagnostic will capture nothing until an arm marker is recreated'
    }
    if ($Arm -and -not $Disarm) {
        New-Item -ItemType File -Force -Path $armMarker | Out-Null
        if (-not (Test-Path -LiteralPath $armMarker)) {
            throw "the arm marker could not be created at $armMarker"
        }
        Write-IipsOk "armed: $armMarker"
        Write-IipsInfo 'the marker is deleted automatically when the selected quote is captured'
        Write-IipsInfo 'a second quote cannot overwrite that evidence - re-arm explicitly to capture again'
    }
    if (-not $Arm -and -not $Disarm) {
        Write-IipsInfo 'not armed by this run - pass -Arm to arm now'
    }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '06-state' 'State after this run'

    $captureExists = Test-Path -LiteralPath $CapturePath
    $armedNow = Test-Path -LiteralPath $armMarker
    Write-IipsInfo "capture file present : $captureExists"
    Write-IipsInfo "arm marker present   : $armedNow"
    if ($captureExists -and $armedNow) {
        Write-IipsWarn 'a capture AND an arm marker both exist: the marker will be consumed by the next selected quote, overwriting that capture'
    }

    Show-LaunchInstruction -CaptureFile $CapturePath

    Write-Host '  Reminder: no vendor request has been made and no service was restarted.' -ForegroundColor Yellow
    Write-Host ''
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'D-18 depth capture preparation: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'D-18 depth capture preparation: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 2
}
