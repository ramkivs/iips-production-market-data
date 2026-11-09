#Requires -Version 5.1
<#
.SYNOPSIS
    Starts every IIPS service/server on a personal, local, single-user Windows host.

.DESCRIPTION
    Full stop-and-restart lifecycle with preflight verification:

      0. Preflight - IRR checkout, IPD checkout, Node.js toolchain, branch/commit/tree,
         configurations, Direct P1 database
      1. Stop any existing listeners on IIPS ports (port 8787, 5176, 5174)
      2. Start IPD Gate-3 IPC provider on a Windows named pipe
      3. Start IRR executive transport (HTTP API, port 8787)
      4. Start IRR Vite dev server (port 5176, 127.0.0.1 only)
      5. Optionally start IPD structural shell (port 5174, 127.0.0.1 only)
      6. Health checks on all started services

    Every step is inside try/catch. There is no `else`, `elseif` or `finally` anywhere.
    Precondition failures throw, which always reaches the catch handler, which rolls back
    only the processes THIS run started, then exits with a meaningful code.

    LOCALHOST-ONLY BINDING
      Both Vite servers are bound to 127.0.0.1 only. A bind to 0.0.0.0 or any other address
      is a hard failure, not a warning.

    DIRECT P1 (already provisioned - preserved, never repeated)
      The user-portfolio SQLite database at C:\iips-data\iips\user-portfolio.sqlite was
      provisioned successfully on native Windows. This script verifies it exists and is
      non-empty, then passes it to the IPD IPC provider. node:sqlite opens it via
      `new DatabaseSync(filePath)` in src/persistence/connection.ts - a read-write local
      file binding. This script never creates, recreates, migrates, truncates or replaces it.

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
    [string] $BindAddress = '127.0.0.1',

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

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = 'H:\IIPS\runtime' }
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = 'H:\IIPS\logs' }

$script:RunStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$script:ServiceLogDir = Join-Path $LogRoot ("services-$($script:RunStamp)")
$script:Started = New-Object System.Collections.Generic.List[object]
$script:RollbackDone = $false
$script:IipsCurrentStep = '00-bootstrap'

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
    $gone = Wait-IipsPipeAbsent -PipeName $PipeName -TimeoutSeconds $CleanupTimeoutSeconds
    $verdict = 'STILL PRESENT'
    $pipeColour = 'Red'
    if ($gone) { $verdict = 'released'; $pipeColour = 'Yellow' }
    Write-Host "    pipe $PipeName : $verdict" -ForegroundColor $pipeColour
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
    $owner = Get-IipsPortOwner -Port $Port
    if ($null -eq $owner) { return $false }
    $listenerPid = [int]$owner.OwningProcess
    $name = (Get-Process -Id $listenerPid -ErrorAction SilentlyContinue).ProcessName
    Write-IipsInfo "$Label is already running on port $Port as PID $listenerPid ($name) - stopping it first"

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
    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
        $still = Get-IipsPortOwner -Port $Port
        if ($null -eq $still) { break }
    }
    $still = Get-IipsPortOwner -Port $Port
    if ($null -ne $still) { throw "could not stop the existing $Label on port $Port (PID $listenerPid). Free it manually before running this script." }
    Write-IipsOk "existing $Label on port $Port stopped"
    return $true
}

try {
    # ============================================================================================
    # 00 - PREFLIGHT: configurations, checkouts, toolchain, branch/commit/tree, ports
    # ============================================================================================
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS - Start All Services (preflight + stop/restart + health) ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-IipsInfo "IRR root  : $IrrRoot"
    Write-IipsInfo "IPD root  : $IpdRoot"
    Write-IipsInfo "Database  : $DatabasePath (Direct P1, preserved, never provisioned here)"
    Write-IipsInfo "Bind addr : $BindAddress (localhost only - personal single-user application)"
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
    if ($irrBranch -eq 'HEAD' -or $irrBranch.Length -eq 0) { throw "IRR is in detached HEAD state or has no branch. Checkout a branch before running this script." }
    Write-IipsOk "IRR branch: $irrBranch"

    $ipdBranch = (Invoke-IipsCapture -Executable $git.Source -Arguments @('-C', $IpdRoot, 'rev-parse', '--abbrev-ref', 'HEAD')).StdOut.Trim()
    if ($ipdBranch -eq 'HEAD' -or $ipdBranch.Length -eq 0) { throw "IPD is in detached HEAD state or has no branch. Checkout a branch before running this script." }
    Write-IipsOk "IPD branch: $ipdBranch"

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

    # --- Preflight 06: owner-context carrier ---------------------------------------------------
    $runtimeOwnerContext = Join-Path $RuntimeRoot 'owner-context\owner-context.json'
    if (-not (Test-Path -LiteralPath $runtimeOwnerContext)) { throw "owner-context carrier missing at $runtimeOwnerContext - run 02-Provision-OwnerContext.ps1 first. Settings, Watchlists and Collaboration fail closed with HTTP 503 without it." }
    Write-IipsOk "owner-context carrier present: $runtimeOwnerContext"

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

    # --- Preflight 08: port guard --------------------------------------------------------------
    Write-IipsStep '02-port-guard' 'Confirming required ports are free (stopping any existing IIPS listeners first)'

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
    Write-IipsStep '03-ipd-ipc' 'Starting the IPD Gate-3 IPC provider on a Windows named pipe'

    $stateDir = Join-Path $RuntimeRoot 'ipd-state'
    if (-not (Test-Path -LiteralPath $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }

    $pipePath = "\\.\pipe\$PipeName"
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

    $found = Wait-IipsPipePresent -PipeName $PipeName -TimeoutSeconds 20
    if ($null -eq $found) { throw "the named pipe $pipePath is not visible in the \\.\pipe\ namespace after a successful bind." }
    Write-IipsOk "pipe visible in the Windows namespace: $found"

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

    $health = Wait-IipsHttpReady -Url "http://$BindAddress`:$TransportPort/api/health" -Label 'the IRR transport' -TimeoutSeconds $ReadyTimeoutSeconds
    if ($health.Content -notmatch '"status"\s*:\s*"ok"') { throw "health endpoint returned an unexpected body: $($health.Content)" }
    Write-IipsOk "health body verified: $($health.Content)"

    $listen = Wait-IipsPortListening -Port $TransportPort -Label 'the IRR transport' -TimeoutSeconds 30 -ExpectedAddress $BindAddress
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
        -Arguments @('run', 'dev', '--', '--host', $BindAddress, '--port', "$FrontendPort", '--strictPort') `
        -WorkingDirectory $irrFrontend -LogDirectory $script:ServiceLogDir -Environment $viteEnv
    $script:Started.Add($vite)

    $viteListen = Wait-IipsPortListening -Port $FrontendPort -Label 'the IRR Vite dev server' -TimeoutSeconds $ReadyTimeoutSeconds -ExpectedAddress $BindAddress
    Write-IipsOk "Vite bound loopback-only: $($viteListen.LocalAddress):$FrontendPort"

    $doc = Wait-IipsHttpReady -Url "http://$BindAddress`:$FrontendPort/" -Label 'the IRR Vite document' -TimeoutSeconds 60
    if ($doc.Content -notmatch '<div id="root">') {
        $head = $doc.Content.Substring(0, [Math]::Min(200, $doc.Content.Length))
        throw "the Vite document did not contain the React root element. Body head: $head"
    }
    Write-IipsOk 'Vite is serving the application shell'

    # --- Post-start health: proxy path ---------------------------------------------------------
    Write-IipsStep '06-connectivity' 'Verifying frontend-to-backend communication through the Vite proxy'

    $proxied = Wait-IipsHttpReady -Url "http://$BindAddress`:$FrontendPort/api/health" -Label 'the proxied health check' -TimeoutSeconds 60
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
            -Arguments @('run', 'dev', '--', '--host', $BindAddress, '--port', "$IpdShellPort", '--strictPort') `
            -WorkingDirectory $IpdRoot -LogDirectory $script:ServiceLogDir -Environment @{}
        $script:Started.Add($ipdShell)

        $shellListen = Wait-IipsPortListening -Port $IpdShellPort -Label 'the IPD shell' -TimeoutSeconds $ReadyTimeoutSeconds -ExpectedAddress $BindAddress
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
        bindAddress   = $BindAddress
        transportPort = $TransportPort
        frontendPort  = $FrontendPort
        ipdShellPort  = $manifestShellPort
        pipeName      = $PipeName
        databasePath  = $DatabasePath
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
    Write-Host "http://$BindAddress`:$FrontendPort/" -ForegroundColor Cyan
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
        Write-Host "http://$BindAddress`:$FrontendPort$($u[1])" -ForegroundColor Green
    }
    if ($StartIpdShell) {
        Write-Host ''
        Write-Host '    IPD structural shell        ' -NoNewline -ForegroundColor Gray
        Write-Host "http://$BindAddress`:$IpdShellPort/" -ForegroundColor Green
    }
    Write-Host ''
    Write-Host '  Conditional screens:' -ForegroundColor Yellow
    Write-Host '    User Portfolios / Broker Import -> require IPC provider on named pipe (started above)' -ForegroundColor Yellow
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
