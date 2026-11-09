#Requires -Version 5.1
<#
.SYNOPSIS
    Starts every IIPS service/server on a personal, local, single-user Windows host.

.DESCRIPTION
    Full stop-and-restart lifecycle with preflight verification:

      0. Preflight - IRR checkout, IPD checkout, Node.js toolchain, branch/commit/tree,
         origin URLs, configurations, owner-context, Direct P1 database
      1. Detect and validate any existing IPD IPC provider before stopping any service
      2. Stop any remaining existing listeners on IIPS ports (port 8787, 5176, 5174)
      3. Start IPD Gate-3 IPC provider on a Windows named pipe (if not reused)
      4. Start IRR executive transport (HTTP API, port 8787)
      5. Start IRR Vite dev server (port 5176, 127.0.0.1 only)
      6. Optionally start IPD structural shell (port 5174, 127.0.0.1 only)
      7. Health checks on all started services

    Every step is inside try/catch. There is no `else`, `elseif` or `finally` anywhere.
    Precondition failures throw, which always reaches the catch handler, which rolls back
    only the processes THIS run started, then exits with a meaningful code.

    LOCALHOST-ONLY BINDING
      All servers are bound to 127.0.0.1 only. The bind address is hard-coded - it is not
      a parameter. A bind to 0.0.0.0 or any other address is a hard failure, not a warning.
      The actual listener address is verified, not merely the configured value.

    DIRECT P1 (already provisioned - preserved, never repeated)
      The user-portfolio SQLite database at C:\iips-data\iips\user-portfolio.sqlite was
      provisioned successfully on native Windows. This script verifies it exists and is
      non-empty, then passes it to the IPD IPC provider. node:sqlite opens it via
      `new DatabaseSync(filePath)` in src/persistence/connection.ts - a read-write local
      file binding. This script never creates, recreates, migrates, truncates or replaces it.

    IPC PROVIDER REUSE
      Before stopping any service, the script checks whether an IPD IPC provider is already
      running on the expected named pipe. If it is, the provider's process command line is
      inspected to confirm it belongs to the expected IPD checkout. If the identity and
      readiness are verified, the existing provider is reused. If it is incompatible, it is
      stopped through the existing process-ownership safety rules.

    PATHS
      IRR  = C:\tmp\iips-review-recovered\
      IPD  = H:\IIPS\iips-production-market-data\
      DB   = C:\iips-data\iips\user-portfolio.sqlite (Direct P1, preserved)

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Start-All-IIPS-Services.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Start-All-IIPS-Services.ps1 -NoPause -StartIpdShell
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $IrrRoot = 'C:\tmp\iips-review-recovered',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $IpdRoot = 'H:\IIPS\iips-production-market-data',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $DatabasePath = 'C:\iips-data\iips\user-portfolio.sqlite',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $RuntimeRoot = 'H:\IIPS\runtime',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = 'H:\IIPS\logs',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $TransportPort = 8787,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $FrontendPort = 5176,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $IpdShellPort = 5174,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $PipeName = 'iips-user-portfolio-v1',

    [Parameter(Mandatory = $false)]
    [int] $ReadyTimeoutSeconds = 180,

    [Parameter(Mandatory = $false)]
    [int] $CleanupTimeoutSeconds = 45,

    [Parameter(Mandatory = $false)]
    [switch] $StartIpdShell,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Dot-source the shared helpers from the same directory as this script.
$common = Join-Path $PSScriptRoot 'Iips-Common.ps1'
if (-not (Test-Path -LiteralPath $common)) { throw "Iips-Common.ps1 not found at $common" }
. $common

# Bind address is hard-coded to 127.0.0.1 for the personal single-user application.
# It is NOT a parameter - no other interface is permitted. All references use the
# literal script-scoped address below; no configurable bind address exists.
$script:BindAddress = '127.0.0.1'

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = 'H:\IIPS\runtime' }
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = 'H:\IIPS\logs' }

$script:RunStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$script:ServiceLogDir = Join-Path $LogRoot ("services-$($script:RunStamp)")
$script:Started = New-Object System.Collections.Generic.List[object]
$script:RollbackDone = $false
$script:IipsCurrentStep = '00-bootstrap'
$script:IpcProviderReused = $false

function Invoke-IipsRollback {
    param([Parameter(Mandatory = $true)][string] $Reason)
    if ($script:RollbackDone) { return }
    $script:RollbackDone = $true

    Write-Host ''
    Write-Host "Rolling back - $Reason" -ForegroundColor Yellow
    Write-Host "  only the $($script:Started.Count) process(es) started by this run are targeted" -ForegroundColor Yellow

    for ($i = $script:Started.Count - 1; $i -ge 0; $i--) {
        $p = $script:Started[$i]
        try {
            Stop-IipsProcessTree -ProcessId $p.Pid -Label $p.Label
            Write-Host "  stopped $($p.Label) (PID $($p.Pid)) and its children" -ForegroundColor Yellow
        }
        catch {
            Write-Host "  could not stop $($p.Label) (PID $($p.Pid)): $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host ''
    Write-Host '  verifying release:' -ForegroundColor Yellow
    foreach ($port in @($TransportPort, $FrontendPort, $IpdShellPort)) {
        $released = Wait-IipsPortReleased -Port $port -TimeoutSeconds $CleanupTimeoutSeconds
        $verdict = 'STILL HELD'
        $portColour = 'Red'
        if ($released) { $verdict = 'released'; $portColour = 'Yellow' }
        Write-Host "    port $port : $verdict" -ForegroundColor $portColour
    }
    if (-not $script:IpcProviderReused) {
        $gone = Wait-IipsPipeAbsent -PipeName $PipeName -TimeoutSeconds $CleanupTimeoutSeconds
        $verdict = 'STILL PRESENT'
        $pipeColour = 'Red'
        if ($gone) { $verdict = 'released'; $pipeColour = 'Yellow' }
        Write-Host "    pipe $PipeName : $verdict" -ForegroundColor $pipeColour
    }
    if ($script:IpcProviderReused) {
        Write-Host "    pipe $PipeName : preserved (existing IPC provider was reused)" -ForegroundColor Yellow
    }
}

function Wait-IipsHttpReady {
    param(
        [Parameter(Mandatory = $true)][string] $Url,
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][int] $TimeoutSeconds,
        [Parameter(Mandatory = $false)][int] $ExpectedStatus = 200
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $attempt = 0
    while ((Get-Date) -lt $deadline) {
        $attempt++
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($resp.StatusCode -eq $ExpectedStatus) {
                Write-IipsOk "$Label ready after $attempt attempt(s): $Url -> $($resp.StatusCode)"
                return $resp
            }
            Write-IipsInfo "     attempt $attempt : HTTP $($resp.StatusCode), waiting..."
        }
        catch {
            if ($attempt % 5 -eq 0) { Write-IipsInfo "     attempt $attempt : not ready yet ($($_.Exception.Message))" }
        }
        Start-Sleep -Seconds 2
    }
    throw "$Label did not become ready at $Url within $TimeoutSeconds seconds."
}

function Stop-IipsProcessOnPort {
    param(
        [Parameter(Mandatory = $true)][int] $Port,
        [Parameter(Mandatory = $true)][string] $Label
    )
    $listeners = Get-IipsAllPortListeners -Port $Port
    if ($null -eq $listeners) { return $false }

    foreach ($l in $listeners) {
        $listenerPid = [int]$l.OwningProcess
        $name = (Get-Process -Id $listenerPid -ErrorAction SilentlyContinue).ProcessName
        $addr = $l.LocalAddress
        Write-IipsInfo "$Label is already running on $addr:$Port as PID $listenerPid ($name) - stopping it first"

        # Verify this is an IIPS process before terminating - never kill unrelated applications.
        $cmdLine = ''
        try {
            $wmiProc = Get-CimInstance Win32_Process -Filter "ProcessId = $listenerPid" -ErrorAction Stop
            $cmdLine = $wmiProc.CommandLine
        }
        catch {
            throw "PID $listenerPid $Label: could not inspect process command line. Refusing to terminate an unverified process."
        }

        $isIisProcess = $false
        if ($null -ne $cmdLine -and $cmdLine.Length -gt 0) {
            if ($cmdLine -like '*iips-production-market-data*') { $isIisProcess = $true }
            if ($cmdLine -like '*iips-review-recovered*') { $isIisProcess = $true }
            if ($cmdLine -like '*executive-transport*') { $isIisProcess = $true }
            if ($cmdLine -like '*dist\src\ipc\entrypoint*') { $isIisProcess = $true }
        }
        if (-not $isIisProcess) {
            throw "PID $listenerPid $Label is not an IIPS process (command line: $cmdLine). Refusing to terminate unrelated applications. Free port $Port manually before running this script."
        }

        Stop-IipsProcessTree -ProcessId $listenerPid -Label "$Label (port $Port)"
    }

    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
        $still = Get-IipsAllPortListeners -Port $Port
        if ($null -eq $still) { break }
    }
    $still = Get-IipsAllPortListeners -Port $Port
    if ($null -ne $still) { throw "could not stop the existing $Label on port $Port. Free it manually before running this script." }
    Write-IipsOk "existing $Label on port $Port stopped"
    return $true
}

function Test-IipsIpcApplicationReadiness {
    param(
        [Parameter(Mandatory = $true)][string] $PipeName,
        [Parameter(Mandatory = $true)][int] $TimeoutSeconds
    )
    $pipePath = "\\.\pipe\$PipeName"

    # Verify the pipe exists in the Windows namespace.
    $found = Wait-IipsPipePresent -PipeName $PipeName -TimeoutSeconds 5
    if ($null -eq $found) { throw "the named pipe $pipePath is not visible in the \\.\pipe\ namespace." }

    # Connect to the named pipe and send a read-only portfolio.list request to verify
    # application-level IPC readiness. This does NOT create, replace, delete or modify
    # any user portfolio data.
    try {
        $client = New-Object System.IO.Pipes.NamedPipeClientStream('.', $PipeName, [System.IO.Pipes.PipeDirection]::InOut)
        $client.Connect($TimeoutSeconds * 1000)

        try {
            # Build a v1 portfolio.list request frame (length-prefixed JSON).
            $request = @{
                v = 1
                op = 'portfolio.list'
                payload = $null
                requestId = 'iips-readiness-' + ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
            }
            $json = $request | ConvertTo-Json -Depth 3
            $body = [System.Text.Encoding]::UTF8.GetBytes($json)
            $header = [BitConverter]::GetBytes($body.Length)

            $client.Write($header, 0, 4)
            $client.Write($body, 0, $body.Length)

            # Bounded IPC exchange: enforce a per-read timeout and an overall deadline
            # so the readiness check can never block indefinitely.
            $client.ReadTimeout = 5000
            $readDeadline = (Get-Date).AddSeconds($TimeoutSeconds)

            # Read the response length header (exactly 4 bytes).
            $lenBuf = New-Object byte[] 4
            $totalRead = 0
            while ($totalRead -lt 4) {
                if ((Get-Date) -gt $readDeadline) { throw "the IPC provider did not send the response length header within $TimeoutSeconds seconds." }
                $read = $client.Read($lenBuf, $totalRead, 4 - $totalRead)
                if ($read -eq 0) { throw "the IPC provider closed the connection before sending the response length." }
                $totalRead += $read
            }
            $respLen = [BitConverter]::ToInt32($lenBuf, 0)

            # Validate response length before allocating the buffer.
            # Reject negative, zero, or oversized lengths - a malformed provider must
            # never cause us to allocate an unreasonably large buffer.
            $maxResponseBytes = 1048576  # 1 MiB upper bound for a readiness response
            if ($respLen -le 0) { throw "the IPC provider returned an invalid response length: $respLen." }
            if ($respLen -gt $maxResponseBytes) { throw "the IPC provider returned an oversized response length: $respLen bytes (maximum $maxResponseBytes)." }

            # Read the response body (exactly $respLen bytes) within the overall deadline.
            $respBuf = New-Object byte[] $respLen
            $totalRead = 0
            while ($totalRead -lt $respLen) {
                if ((Get-Date) -gt $readDeadline) { throw "the IPC provider did not send the complete response body within $TimeoutSeconds seconds." }
                $read = $client.Read($respBuf, $totalRead, $respLen - $totalRead)
                if ($read -eq 0) { throw "the IPC provider closed the connection before sending the complete response body." }
                $totalRead += $read
            }
            if ($totalRead -ne $respLen) { throw "the IPC provider returned a truncated response: expected $respLen bytes, received $totalRead." }

            $respJson = [System.Text.Encoding]::UTF8.GetString($respBuf)
            # ConvertFrom-Json -Depth is not supported in Windows PowerShell 5.1.
            $resp = $respJson | ConvertFrom-Json

            # Verify the response is a success, not an error.
            if ($null -eq $resp -or $null -eq $resp.outcome) {
                throw "the IPC provider returned an unparseable response: $respJson"
            }
            if ($resp.outcome -ne 'success') {
                throw "the IPC provider returned outcome '$($resp.outcome)' - application-level IPC is not ready."
            }

            Write-IipsOk "application-level IPC readiness verified via named pipe $pipePath"
            $client.Close()
        }
        catch {
            try { $client.Close() } catch {}
            throw
        }
    }
    catch {
        throw "application-level IPC readiness check failed: $($_.Exception.Message)"
    }
}

try {
    # ============================================================================================
    # 00 - PREFLIGHT: configurations, checkouts, toolchain, branch/commit/tree, origin URLs
    # ============================================================================================
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS - Start All Services (preflight + stop/restart + health) ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-IipsInfo "IRR root  : $IrrRoot"
    Write-IipsInfo "IPD root  : $IpdRoot"
    Write-IipsInfo "Database  : $DatabasePath (Direct P1, preserved, never provisioned here)"
    Write-IipsInfo "Bind addr : $script:BindAddress (localhost only - personal single-user application)"
    Write-IipsInfo "Run stamp : $($script:RunStamp)"

    # --- Preflight 01: checkouts ---------------------------------------------------------------
    Write-IipsStep '01-checkouts' 'Verifying IRR and IPD checkouts exist'

    $irrFrontend = Join-Path $IrrRoot 'frontend'
    if (-not (Test-Path -LiteralPath $irrFrontend)) { throw "IRR frontend missing at $irrFrontend - the IRR checkout at $IrrRoot is incomplete." }
    Write-IipsOk "IRR frontend present: $irrFrontend"

    if (-not (Test-Path -LiteralPath $IpdRoot)) { throw "IPD checkout missing at $IpdRoot." }
    Write-IipsOk "IPD checkout present: $IpdRoot"

    # --- Preflight 02: git executable ----------------------------------------------------------
    Write-IipsStep '01-git' 'Verifying Git and repository identity'

    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($null -eq $git) { throw 'git.exe was not found on PATH. Git is required for branch/commit verification.' }

    # --- Preflight 03: branch, commit, clean working tree -------------------------------------
    Write-IipsStep '01-branch' 'Verifying branch, commit and clean working tree'

    $irrBranch = (Invoke-IipsCapture -Executable $git.Source -Arguments @('-C', $IrrRoot, 'rev-parse', '--abbrev-ref', 'HEAD')).StdOut.Trim()
    if ($irrBranch -ne 'main') { throw "IRR is on branch '$irrBranch', expected 'main'. Checkout main before running this script." }
    Write-IipsOk "IRR branch: $irrBranch"

    $ipdBranch = (Invoke-IipsCapture -Executable $git.Source -Arguments @('-C', $IpdRoot, 'rev-parse', '--abbrev-ref', 'HEAD')).StdOut.Trim()
    if ($ipdBranch -ne 'main') { throw "IPD is on branch '$ipdBranch', expected 'main'. Checkout main before running this script." }
    Write-IipsOk "IPD branch: $ipdBranch"

    # Verify origin URLs match the expected authoritative repositories.
    $irrOrigin = Test-IipsOriginUrl -RepoDir $IrrRoot -Label 'IRR' -ExpectedOrigin $script:IipsExpectedIrrOrigin -GitExe $git.Source
    if (-not $irrOrigin.Matched) { throw "IRR origin is '$($irrOrigin.Origin)', expected '$($script:IipsExpectedIrrOrigin)'." }
    Write-IipsOk "IRR origin verified: $($irrOrigin.Origin)"

    $ipdOrigin = Test-IipsOriginUrl -RepoDir $IpdRoot -Label 'IPD' -ExpectedOrigin $script:IipsExpectedIpdOrigin -GitExe $git.Source
    if (-not $ipdOrigin.Matched) { throw "IPD origin is '$($ipdOrigin.Origin)', expected '$($script:IipsExpectedIpdOrigin)'." }
    Write-IipsOk "IPD origin verified: $($ipdOrigin.Origin)"

    # Enforce approved commit identities via pinned commit verification.
    $irrPin = Test-IipsCommitPin -RepoDir $IrrRoot -Label 'IRR' -ExpectedCommit $script:IipsExpectedIrrCommit -GitExe $git.Source
    if ($irrPin.Drifted) {
        throw "IRR commit drift detected. Expected $($script:IipsExpectedIrrCommit), head is $($irrPin.Head).`n$($irrPin.AheadBehind)"
    }
    Write-IipsOk "IRR commit approved: $($irrPin.Head)"

    $ipdPin = Test-IipsCommitPin -RepoDir $IpdRoot -Label 'IPD' -ExpectedCommit $script:IipsExpectedIpdCommit -GitExe $git.Source
    if ($ipdPin.Drifted) {
        throw "IPD commit drift detected. Expected $($script:IipsExpectedIpdCommit), head is $($ipdPin.Head).`n$($ipdPin.AheadBehind)"
    }
    Write-IipsOk "IPD commit approved: $($ipdPin.Head)"

    # Reject dirty working trees.
    Assert-IipsCleanTree -RepoDir $IrrRoot -Label 'IRR' -GitExe $git.Source
    Assert-IipsCleanTree -RepoDir $IpdRoot -Label 'IPD' -GitExe $git.Source

    # --- Preflight 04: broker-import artifact --------------------------------------------------
    $brokerCache = Join-Path $irrFrontend '.cache\broker-import'
    if (-not (Test-Path -LiteralPath $brokerCache)) { throw "$brokerCache is missing. Run 'npm.cmd run build:broker-import' in the IRR frontend. Vite and the test suite both require it." }
    Write-IipsOk "broker-import artifact present: $brokerCache"

    # --- Preflight 05: Node.js toolchain (verifies node.exe, npm.cmd, npx.cmd same install) ---
    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable

    # --- Preflight 06: owner-context content validation ----------------------------------------
    $runtimeOwnerContext = Join-Path $RuntimeRoot 'owner-context\owner-context.json'
    $ownerCtx = Test-IipsOwnerContext -Path $runtimeOwnerContext -Label 'owner-context'
    Write-IipsOk "owner-context validated: operatingContext=$($ownerCtx.OperatingContext), ownerId=$($ownerCtx.OwnerId), tenantId=$($ownerCtx.TenantId)"

    $dataDir = Join-Path $RuntimeRoot 'iips-data'
    $np04Dir = Join-Path $RuntimeRoot 'np04'
    if (-not (Test-Path -LiteralPath $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $np04Dir)) { New-Item -ItemType Directory -Path $np04Dir -Force | Out-Null }

    $reportsOwnerPath = Join-Path $RuntimeRoot 'reports-owner\reports-owner-context.json'
    $np04Db = Join-Path $np04Dir 'reports.sqlite'

    if (Test-Path -LiteralPath $reportsOwnerPath) { Write-IipsInfo "reports-owner carrier present: $reportsOwnerPath" }
    if (-not (Test-Path -LiteralPath $reportsOwnerPath)) { Write-IipsInfo 'reports-owner carrier absent - Reports will fail closed (404). Reports is parked.' }
    if (Test-Path -LiteralPath $np04Db) { Write-IipsInfo "NP-04 database present: $np04Db" }
    if (-not (Test-Path -LiteralPath $np04Db)) { Write-IipsInfo "NP-04 database absent at $np04Db - Reports will fail closed (404). Not created here." }

    # --- Preflight 07: Direct P1 database (preserved, never provisioned) -----------------------
    if (-not (Test-Path -LiteralPath $DatabasePath)) { throw "Direct P1 user-portfolio database missing at $DatabasePath. It was provisioned previously on native Windows and this script never creates, recreates or migrates it." }
    $dbItem = Get-Item -LiteralPath $DatabasePath
    if ($dbItem.Length -eq 0) { throw "Direct P1 database at $DatabasePath is zero bytes. This script never provisions or repairs it - investigate before proceeding." }
    Write-IipsOk "Direct P1 database verified (not modified): $DatabasePath ($($dbItem.Length) bytes)"
    Write-IipsInfo 'node:sqlite opens the database via new DatabaseSync(filePath) in src/persistence/connection.ts - no provisioning, migration or schema change is performed by this script'

    # --- Preflight 08: IPC provider detection (BEFORE port guard) ------------------------------
    Write-IipsStep '01-ipc-detect' 'Detecting and validating any existing IPD IPC provider'

    $pipePath = "\\.\pipe\$PipeName"
    $existingPipe = @(Get-IipsNamedPipes -Filter $PipeName)
    $ipcReusable = $false

    if ($existingPipe.Count -gt 0) {
        Write-IipsInfo "existing named pipe detected: $($existingPipe[0])"

        # A named-pipe provider does not listen on TCP ports, so scanning TCP listeners
        # cannot identify its owning process. Instead, connect to the pipe and send a
        # read-only portfolio.list readiness request to verify the provider is alive.
        $ipcReadinessOk = $false
        try {
            Test-IipsIpcApplicationReadiness -PipeName $PipeName -TimeoutSeconds 5
            $ipcReadinessOk = $true
        }
        catch {
            Write-IipsInfo "existing pipe is not ready: $($_.Exception.Message)"
        }

        if ($ipcReadinessOk) {
            # Pipe exists and responds. Verify the owning process identity by finding
            # the node.exe process that runs the IPC entrypoint from the expected IPD checkout.
            $ipcProcesses = Get-CimInstance Win32_Process | Where-Object {
                $_.Name -eq 'node.exe' -and
                $null -ne $_.CommandLine -and $_.CommandLine.Length -gt 0 -and
                $_.CommandLine -like '*dist\src\ipc\entrypoint*' -and
                $_.CommandLine -like "*$IpdRoot*"
            }
            if ($ipcProcesses.Count -eq 1) {
                $ipcPid = [int]$ipcProcesses[0].ProcessId
                $ipcReusable = $true
                Write-IipsOk "existing IPC provider verified at PID $ipcPid, belongs to expected IPD checkout"
            }
            if ($ipcProcesses.Count -ne 1) {
                throw "pipe exists and responds but cannot uniquely identify the provider process (found $($ipcProcesses.Count) candidates). Failing closed."
            }
        }
        if (-not $ipcReadinessOk) {
            # Pipe exists but provider is not ready or not from the expected checkout.
            # Stop incompatible provider processes through the safety rules.
            $ipcProcesses = Get-CimInstance Win32_Process | Where-Object {
                $_.Name -eq 'node.exe' -and
                $null -ne $_.CommandLine -and $_.CommandLine.Length -gt 0 -and
                $_.CommandLine -like '*dist\src\ipc\entrypoint*'
            }
            foreach ($proc in $ipcProcesses) {
                $procPid = [int]$proc.ProcessId
                $procCmdLine = $proc.CommandLine
                # Verify this is an IIPS process before terminating - never kill unrelated applications.
                $isIisProcess = $false
                if ($null -ne $procCmdLine -and $procCmdLine.Length -gt 0) {
                    if ($procCmdLine -like "*$IpdRoot*") { $isIisProcess = $true }
                    if ($procCmdLine -like '*iips-production-market-data*') { $isIisProcess = $true }
                    if ($procCmdLine -like '*iips-review-recovered*') { $isIisProcess = $true }
                    if ($procCmdLine -like '*executive-transport*') { $isIisProcess = $true }
                    if ($procCmdLine -like '*dist\src\ipc\entrypoint*') { $isIisProcess = $true }
                }
                if (-not $isIisProcess) {
                    throw "PID $procPid is not an IIPS process (command line: $procCmdLine). Refusing to terminate unrelated applications."
                }
                Stop-IipsProcessTree -ProcessId $procPid -Label 'incompatible IPC provider'
                Write-IipsOk "stopped incompatible IPC provider at PID $procPid"
            }
        }
    }

    if ($existingPipe.Count -eq 0) {
        Write-IipsInfo 'no existing named pipe found - will start a new IPC provider'
    }

    # --- Preflight 09: port guard --------------------------------------------------------------
    Write-IipsStep '02-port-guard' 'Confirming required ports are free (stopping any remaining IIPS listeners first)'

    # Only stop listeners on ports that are NOT already handled by a reused IPC provider.
    # The IPC provider uses a named pipe, not a TCP port, so it doesn't occupy any TCP port.
    Stop-IipsProcessOnPort -Port $TransportPort -Label 'the IRR executive transport'
    Stop-IipsProcessOnPort -Port $FrontendPort -Label 'the IRR Vite dev server'
    if ($StartIpdShell) { Stop-IipsProcessOnPort -Port $IpdShellPort -Label 'the IPD shell' }

    Assert-IipsPortFree -Port $TransportPort -Label 'the IRR executive transport'
    Assert-IipsPortFree -Port $FrontendPort -Label 'the IRR Vite dev server'
    if ($StartIpdShell) { Assert-IipsPortFree -Port $IpdShellPort -Label 'the IPD shell' }

    $transportEnv = @{
        'EXEC_TRANSPORT_PORT'     = "$TransportPort"
        'IIPS_DATA_DIR'           = $dataDir
        'IIPS_OWNER_CONTEXT_PATH' = $runtimeOwnerContext
        'NODE_ENV'                = 'development'
    }
    if (Test-Path -LiteralPath $reportsOwnerPath) { $transportEnv['IIPS_REPORTS_OWNER_PATH'] = $reportsOwnerPath }
    if (Test-Path -LiteralPath $np04Db) { $transportEnv['IIPS_NP04_DATABASE_PATH'] = $np04Db }

    # ============================================================================================
    # 01 - IPC PROVIDER (Direct P1 database, preserved read-write via node:sqlite)
    # ============================================================================================
    if (-not $ipcReusable) {
        Write-IipsStep '03-ipd-ipc' 'Starting the IPD Gate-3 IPC provider on a Windows named pipe'

        $stateDir = Join-Path $RuntimeRoot 'ipd-state'
        if (-not (Test-Path -LiteralPath $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }

        $existingPipe = @(Get-IipsNamedPipes -Filter $PipeName)
        if ($existingPipe.Count -gt 0) { throw "the named pipe $($existingPipe[0]) already exists, so an IPC provider is already running. Stop it first with 06-Stop-IipsServers.ps1." }

        $entrypoint = Join-Path $IpdRoot 'dist\src\ipc\entrypoint.js'
        # Avoid unnecessary rebuilds: only compile if the entrypoint is missing.
        if (-not (Test-Path -LiteralPath $entrypoint)) {
            Write-IipsInfo "IPC entrypoint missing at $entrypoint - running TypeScript build."
            Invoke-IipsCommand -Executable $toolchain.NpmCmd -Arguments @('run', 'build:tsc') -WorkingDirectory $IpdRoot -Purpose 'IPD TypeScript build'
            Write-IipsOk 'IPD TypeScript build complete'
        }
        if (-not (Test-Path -LiteralPath $entrypoint)) { throw "compiled IPC entrypoint missing at $entrypoint after build." }
        Write-IipsOk "IPC entrypoint compiled: $entrypoint"

        $ipcEnv = @{
            'IIPS_G2_IPC_ENDPOINT'    = $pipePath
            'IIPS_G3_DATABASE_PATH'   = $DatabasePath
            'IIPS_G3_LOCAL_STATE_DIR' = $stateDir
        }

        $ipc = Start-IipsService -Label 'ipd-ipc' -Executable $toolchain.NodeExe -Arguments @($entrypoint) -WorkingDirectory $IpdRoot -LogDirectory $script:ServiceLogDir -Environment $ipcEnv
        $script:Started.Add($ipc)

        $deadline = (Get-Date).AddSeconds(60)
        $bound = $false
        while ((Get-Date) -lt $deadline) {
            Start-Sleep -Seconds 2
            if (-not (Test-Path -LiteralPath $ipc.ErrLog)) { continue }
            $content = Get-Content -LiteralPath $ipc.ErrLog -Raw -ErrorAction SilentlyContinue
            if ($null -eq $content) { continue }
            if ($content -match '\[g3\] listening on windows-named-pipe') { $bound = $true; break }
            if ($content -match '\[g3\] startup refused') { throw "the IPC provider refused to start:`n$content" }
        }
        if (-not $bound) { throw "the IPC provider did not report a bound named pipe within 60 seconds. Log: $($ipc.ErrLog)" }
        Write-IipsOk "IPC provider bound: $pipePath (PID $($ipc.Pid))"
    }
    if ($ipcReusable) {
        Write-IipsStep '03-ipd-ipc' 'Reusing existing IPD IPC provider (verified identity and readiness)'
        $script:IpcProviderReused = $true
    }

    # Verify application-level IPC readiness (not just pipe existence or log marker).
    Test-IipsIpcApplicationReadiness -PipeName $PipeName -TimeoutSeconds 10

    $transportEnv['IIPS_G3_IPC_BINDING_PROVISIONED'] = 'true'
    $transportEnv['IIPS_G2_IPC_ENDPOINT'] = $pipePath
    Write-IipsOk 'IRR transport environment configured with IPC binding provisioned'
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray

    foreach ($p in $script:Started) {
        if (Test-Path -LiteralPath $p.ErrLog) {
            Write-Host ''
            Write-Host "  --- tail of $($p.Label) error log ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $p.ErrLog -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
    }

    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete|executable not found') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|bound to|must bind') { $code = 4 }

    Write-IipsFinalStatus -Outcome 'FAIL' -Message "IIPS service startup: stopped with exit $code. The specific reason is printed immediately above." -NoPause:$NoPause | Out-Null
    exit $code
}

# ============================================================================================
# 02 - TRANSPORT (IRR executive HTTP API)
# ============================================================================================
try {
    Write-IipsStep '04-transport' 'Starting the IRR executive transport'

    $transport = Start-IipsService -Label 'irr-transport' -Executable $toolchain.NpmCmd `
        -Arguments @('run', 'server:dev') -WorkingDirectory $irrFrontend `
        -LogDirectory $script:ServiceLogDir -Environment $transportEnv
    $script:Started.Add($transport)

    $health = Wait-IipsHttpReady -Url "http://$script:BindAddress`:$TransportPort/api/health" -Label 'the IRR transport' -TimeoutSeconds $ReadyTimeoutSeconds
    if ($health.Content -notmatch '"status"\s*:\s*"ok"') { throw "health endpoint returned an unexpected body: $($health.Content)" }
    Write-IipsOk "health body verified: $($health.Content)"

    $listen = Wait-IipsPortListening -Port $TransportPort -Label 'the IRR transport' -TimeoutSeconds 30 -ExpectedAddress $script:BindAddress
    Write-IipsOk "transport bound loopback-only: $($listen.LocalAddress):$TransportPort"
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray

    foreach ($p in $script:Started) {
        if (Test-Path -LiteralPath $p.ErrLog) {
            Write-Host ''
            Write-Host "  --- tail of $($p.Label) error log ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $p.ErrLog -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
    }

    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete|executable not found') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|bound to|must bind') { $code = 4 }

    Write-IipsFinalStatus -Outcome 'FAIL' -Message "IIPS service startup: stopped with exit $code. The specific reason is printed immediately above." -NoPause:$NoPause | Out-Null
    exit $code
}

# ============================================================================================
# 03 - FRONTEND (IRR Vite dev server)
# ============================================================================================
try {
    Write-IipsStep '05-frontend' 'Starting the IRR Vite dev server on 127.0.0.1 only'

    $viteEnv = @{
        'EXEC_TRANSPORT_PORT' = "$TransportPort"
        'IIPS_DATA_DIR'       = $dataDir
    }

    $vite = Start-IipsService -Label 'irr-frontend' -Executable $toolchain.NpmCmd `
        -Arguments @('run', 'dev', '--', '--host', $script:BindAddress, '--port', "$FrontendPort", '--strictPort') `
        -WorkingDirectory $irrFrontend -LogDirectory $script:ServiceLogDir -Environment $viteEnv
    $script:Started.Add($vite)

    $viteListen = Wait-IipsPortListening -Port $FrontendPort -Label 'the IRR Vite dev server' -TimeoutSeconds $ReadyTimeoutSeconds -ExpectedAddress $script:BindAddress
    Write-IipsOk "Vite bound loopback-only: $($viteListen.LocalAddress):$FrontendPort"

    # Verify frontend root route - must be the actual Vite-served SPA, not a generic fallback.
    $doc = Wait-IipsHttpReady -Url "http://$script:BindAddress`:$FrontendPort/" -Label 'the IRR Vite document' -TimeoutSeconds 60
    if ($doc.Content -notmatch '<div id="root">') {
        $head = $doc.Content.Substring(0, [Math]::Min(200, $doc.Content.Length))
        throw "the Vite document did not contain the React root element. Body head: $head"
    }
    if ($doc.Content -notmatch '<script type="module"') {
        throw "the Vite document did not contain a Vite module script reference - this may be a generic fallback page, not the actual SPA."
    }
    Write-IipsOk 'Vite is serving the application shell at root route /'

    # Verify frontend Personal Portfolio route /portfolio through the frontend server/proxy.
    $portfolio = Wait-IipsHttpReady -Url "http://$script:BindAddress`:$FrontendPort/portfolio" -Label 'the IRR Vite portfolio route' -TimeoutSeconds 60
    if ($portfolio.Content -notmatch '<div id="root">') {
        $head = $portfolio.Content.Substring(0, [Math]::Min(200, $portfolio.Content.Length))
        throw "the /portfolio route did not contain the React root element. Body head: $head"
    }
    if ($portfolio.Content -notmatch '<script type="module"') {
        throw "the /portfolio document did not contain a Vite module script reference - this may be a generic fallback page, not the actual SPA."
    }
    Write-IipsOk 'Personal Portfolio route /portfolio verified through frontend proxy'

    # Verify the frontend-to-IRR API health path through the proxy.
    $proxied = Wait-IipsHttpReady -Url "http://$script:BindAddress`:$FrontendPort/api/health" -Label 'the proxied health check' -TimeoutSeconds 60
    if ($proxied.Content -notmatch '"status"\s*:\s*"ok"') { throw "the proxied health check returned an unexpected body: $($proxied.Content). The Vite /api proxy is not reaching the transport." }
    Write-IipsOk "proxied /api/health -> $($proxied.StatusCode) with the expected body"
    Write-IipsOk 'the browser path to the backend is confirmed working'
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray

    foreach ($p in $script:Started) {
        if (Test-Path -LiteralPath $p.ErrLog) {
            Write-Host ''
            Write-Host "  --- tail of $($p.Label) error log ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $p.ErrLog -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
    }

    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete|executable not found') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|bound to|must bind') { $code = 4 }

    Write-IipsFinalStatus -Outcome 'FAIL' -Message "IIPS service startup: stopped with exit $code. The specific reason is printed immediately above." -NoPause:$NoPause | Out-Null
    exit $code
}

# ============================================================================================
# 04 - IPD SHELL (optional)
# ============================================================================================
try {
    if ($StartIpdShell) {
        Write-IipsStep '07-ipd-shell' 'Starting the IPD structural shell on 127.0.0.1 only'

        $ipdShell = Start-IipsService -Label 'ipd-shell' -Executable $toolchain.NpmCmd `
            -Arguments @('run', 'dev', '--', '--host', $script:BindAddress, '--port', "$IpdShellPort", '--strictPort') `
            -WorkingDirectory $IpdRoot -LogDirectory $script:ServiceLogDir -Environment @{}
        $script:Started.Add($ipdShell)

        $shellListen = Wait-IipsPortListening -Port $IpdShellPort -Label 'the IPD shell' -TimeoutSeconds $ReadyTimeoutSeconds -ExpectedAddress $script:BindAddress
        Write-IipsOk "IPD shell bound loopback-only: $($shellListen.LocalAddress):$IpdShellPort"
    }
    if (-not $StartIpdShell) {
        Write-IipsStep '07-ipd-shell' 'Skipped - pass -StartIpdShell for the IPD structural shell'
    }
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray

    foreach ($p in $script:Started) {
        if (Test-Path -LiteralPath $p.ErrLog) {
            Write-Host ''
            Write-Host "  --- tail of $($p.Label) error log ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $p.ErrLog -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
    }

    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete|executable not found') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|bound to|must bind') { $code = 4 }

    Write-IipsFinalStatus -Outcome 'FAIL' -Message "IIPS service startup: stopped with exit $code. The specific reason is printed immediately above." -NoPause:$NoPause | Out-Null
    exit $code
}

# ============================================================================================
# 09 - PID record and final status
# ============================================================================================
try {
    Write-IipsStep '08-pid-record' 'Recording process IDs'

    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $pidFile = Join-Path $LogRoot ("iips-pids-$($script:RunStamp).json")
    $record = @()
    foreach ($p in $script:Started) {
        $record += [pscustomobject]@{ label = $p.Label; pid = $p.Pid; outLog = $p.OutLog; errLog = $p.ErrLog }
        Write-IipsOk "$($p.Label) -> PID $($p.Pid)"
    }

    $manifestShellPort = $null
    if ($StartIpdShell) { $manifestShellPort = $IpdShellPort }

    $manifest = [pscustomobject]@{
        runStamp      = $script:RunStamp
        irrRoot       = $IrrRoot
        ipdRoot       = $IpdRoot
        bindAddress   = $script:BindAddress
        transportPort = $TransportPort
        frontendPort  = $FrontendPort
        ipdShellPort  = $manifestShellPort
        pipeName      = $PipeName
        databasePath  = $DatabasePath
        ipcReused     = $script:IpcProviderReused
        processes     = $record
    }
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $pidFile -Encoding UTF8
    Write-IipsOk "PID manifest: $pidFile"

    # ============================================================================================
    # 10 - URLs
    # ============================================================================================
    Write-IipsStep '09-urls' 'BROWSER URLS'

    Write-Host ''
    Write-Host '  APPLICATION  ' -NoNewline -ForegroundColor White
    Write-Host "http://$script:BindAddress`:$FrontendPort/" -ForegroundColor Cyan
    Write-Host ''
    $urls = @(
        @('Executive Dashboard',      '/executive'),
        @('Portfolio',                '/portfolio'),
        @('Broker Holdings',          '/broker-holdings'),
        @('User Portfolios',          '/user-portfolios'),
        @('Broker Import',            '/user-portfolios/import'),
        @('Watchlists',               '/watchlists'),
        @('Collaboration',            '/collaboration'),
        @('Company Intelligence',     '/research/company/banking'),
        @('Sector Intelligence',      '/research/sector/Banking'),
        @('Cross-Sector Intelligence','/research/cross-sector'),
        @('Macro',                    '/research/macro'),
        @('Engines',                  '/research/engines'),
        @('Screener',                 '/screener'),
        @('Opportunities',            '/intelligence/opportunities'),
        @('Risks',                    '/intelligence/risks'),
        @('Rankings',                 '/intelligence/rankings'),
        @('Decision Matrix',          '/intelligence/decision-matrix'),
        @('AI Advisory',              '/ai-advisory'),
        @('Evidence',                 '/evidence'),
        @('Reports (parked)',         '/reports'),
        @('Settings',                 '/settings')
    )
    foreach ($u in $urls) {
        $label = $u[0].PadRight(26)
        Write-Host "    $label" -NoNewline -ForegroundColor Gray
        Write-Host "http://$script:BindAddress`:$FrontendPort$($u[1])" -ForegroundColor Green
    }
    if ($StartIpdShell) {
        Write-Host ''
        Write-Host '    IPD structural shell        ' -NoNewline -ForegroundColor Gray
        Write-Host "http://$script:BindAddress`:$IpdShellPort/" -ForegroundColor Green
    }
    Write-Host ''
    Write-Host '  Conditional screens:' -ForegroundColor Yellow
    Write-Host '    User Portfolios / Broker Import -> require IPC provider on named pipe (started or reused above)' -ForegroundColor Yellow
    Write-Host '    Reports -> parked; needs a separately provisioned NP-04 governed database' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Stop everything with: 06-Stop-IipsServers.ps1' -ForegroundColor Yellow
    Write-Host ''
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'IIPS service startup: all services started and health-verified.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    $message = $_.Exception.Message
    Write-Host ''
    Write-Host "FAILURE at step [$($script:IipsCurrentStep)]: $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray

    foreach ($p in $script:Started) {
        if (Test-Path -LiteralPath $p.ErrLog) {
            Write-Host ''
            Write-Host "  --- tail of $($p.Label) error log ---" -ForegroundColor Yellow
            Get-Content -LiteralPath $p.ErrLog -Tail 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
    }

    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix 'start-all-iips-services' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete|executable not found') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|bound to|must bind') { $code = 4 }

    Write-IipsFinalStatus -Outcome 'FAIL' -Message "IIPS service startup: stopped with exit $code. The specific reason is printed immediately above." -NoPause:$NoPause | Out-Null
    exit $code
}