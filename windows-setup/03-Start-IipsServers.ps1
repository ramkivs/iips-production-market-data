#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 3 of 7: start the backend and frontend services.

.DESCRIPTION
    Starts, in order:
      1. (with -StartIpdIpc) the IPD Gate-3 IPC provider on a Windows named pipe
      2. the IRR executive transport (HTTP, port 8787 by default)
      3. the IRR Vite dev server, bound to 127.0.0.1 only
      4. (with -StartIpdShell) the IPD structural shell, bound to 127.0.0.1 only

    LOCALHOST-ONLY BINDING
      This is a personal, local, single-user application. Both Vite servers are started with an
      explicit --host 127.0.0.1, and the actual listener address returned by
      Get-NetTCPConnection is verified to be 127.0.0.1. A bind to 0.0.0.0 or any other
      address is a hard failure, not a warning.

    RELIABLE STARTUP AND CLEANUP
      * There is NO `exit` anywhere inside the startup sequence. Every failure path throws, so
        control always reaches the catch handler, which rolls back and only then exits. A
        precondition failure can therefore never leave a half-started stack running.
      * Termination uses taskkill /PID <pid> /T /F, which walks the child tree. `npm.cmd run dev`
        spawns node.exe children; Stop-Process alone would orphan them and leave the port held.
      * After cleanup the script verifies that every port it asked for is released and, when the
        IPC provider was started, that the named pipe has disappeared.
      * Only PIDs recorded by THIS run are ever terminated. No process is selected by executable
        name, so unrelated Python and Node.js processes are never touched.

    DIRECT P1 (already provisioned - preserved, never repeated)
      The user-portfolio SQLite database at C:\iips-data\iips\user-portfolio.sqlite was provisioned
      successfully on native Windows. With -StartIpdIpc this script VERIFIES that the file exists
      and is non-empty, and then uses it read-only. It never creates, recreates, truncates,
      migrates or replaces it. If it is missing, startup stops with an explicit message rather than
      silently provisioning anything.

    REPORTS (parked)
      Reports requires a separately provisioned NP-04 governed database. This script does not create
      one and does not treat Reports as a required service. If IIPS_NP04_DATABASE_PATH points at a
      file that does not exist, Reports simply fails closed with 404 - which is correct.

    EXIT CODES
      0  all requested services are ready and verified
      1  unhandled failure
      2  precondition failure - missing checkout, tool, carrier, database, or a port already in use
      3  a service failed to become ready within its timeout
      4  a health, connectivity, listener-address or pipe check returned an unexpected result

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\03-Start-IipsServers.ps1 -StartIpdIpc -StartIpdShell
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
    [ValidateNotNullOrEmpty()]
    [string] $DatabasePath = '',

    [Parameter(Mandatory = $false)]
    [int] $ReadyTimeoutSeconds = 180,

    [Parameter(Mandatory = $false)]
    [int] $CleanupTimeoutSeconds = 45,

    [Parameter(Mandatory = $false)]
    [switch] $StartIpdIpc,

    [Parameter(Mandatory = $false)]
    [switch] $StartIpdShell,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }
if ([string]::IsNullOrWhiteSpace($DatabasePath)) { $DatabasePath = $script:IipsDirectP1DatabasePath }

$script:RunStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$script:ServiceLogDir = Join-Path $LogRoot "services-$($script:RunStamp)"
$script:Started = New-Object System.Collections.Generic.List[object]
$script:RollbackDone = $false

# ------------------------------------------------------------------------------------------------
# Rollback. Reached from the catch handler ONLY - never from an `exit` inside the startup sequence.
# ------------------------------------------------------------------------------------------------
function Invoke-IipsRollback {
    param([Parameter(Mandatory = $true)][string] $Reason)
    if ($script:RollbackDone) { return }
    $script:RollbackDone = $true

    Write-Host ''
    Write-Host "Rolling back - $Reason" -ForegroundColor Yellow
    Write-Host "  only the $($script:Started.Count) process(es) started by this run are targeted" -ForegroundColor Yellow

    # Reverse order: frontend before transport before IPC provider.
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

    # Verify release, because a stop that reports success but leaves a port held is a false success.
    Write-Host ''
    Write-Host '  verifying release:' -ForegroundColor Yellow
    foreach ($port in @($TransportPort, $FrontendPort, $IpdShellPort)) {
        $released = Wait-IipsPortReleased -Port $port -TimeoutSeconds $CleanupTimeoutSeconds
        $verdict = 'STILL HELD'
        $portColour = 'Red'
        if ($released) { $verdict = 'released'; $portColour = 'Yellow' }
        Write-Host "    port $port : $verdict" -ForegroundColor $portColour
    }
    if ($StartIpdIpc) {
        $gone = Wait-IipsPipeAbsent -PipeName $PipeName -TimeoutSeconds $CleanupTimeoutSeconds
        $verdict = 'STILL PRESENT'
        $pipeColour = 'Red'
        if ($gone) { $verdict = 'released'; $pipeColour = 'Yellow' }
        Write-Host "    pipe $PipeName : $verdict" -ForegroundColor $pipeColour
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

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Service Startup ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-IipsInfo "InstallRoot : $InstallRoot"
    Write-IipsInfo "RuntimeRoot : $RuntimeRoot"
    Write-IipsInfo "Bind address: $BindAddress (localhost only - personal single-user application)"
    Write-IipsInfo "Run stamp   : $($script:RunStamp)"

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '01-preconditions' 'Verifying checkouts, tools, Node.js and carriers'

    $irrFrontend = Join-Path $InstallRoot 'iips-review-recovered\frontend'
    $ipdRoot = Join-Path $InstallRoot 'iips-production-market-data'
    if (-not (Test-Path -LiteralPath $irrFrontend)) { throw "IRR frontend missing at $irrFrontend - run step 01." }
    if (-not (Test-Path -LiteralPath $ipdRoot)) { throw "IPD checkout missing at $ipdRoot - run step 01." }
    Write-IipsOk 'both checkouts present'

    $brokerCache = Join-Path $irrFrontend '.cache\broker-import'
    if (-not (Test-Path -LiteralPath $brokerCache)) { throw "$brokerCache is missing. Run 'npm.cmd run build:broker-import' in the IRR frontend (step 01 does this). Vite and the test suite both require it." }
    Write-IipsOk 'broker-import artifact present'

    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable

    $ownerContextPath = Join-Path $RuntimeRoot 'owner-context\owner-context.json'
    $reportsOwnerPath = Join-Path $RuntimeRoot 'reports-owner\reports-owner-context.json'
    $dataDir = Join-Path $RuntimeRoot 'iips-data'
    $np04Dir = Join-Path $RuntimeRoot 'np04'
    $np04Db = Join-Path $np04Dir 'reports.sqlite'

    if (-not (Test-Path -LiteralPath $ownerContextPath)) { throw "owner-context carrier missing at $ownerContextPath - run 02-Provision-OwnerContext.ps1. Without it Settings, Watchlists and Collaboration fail closed with HTTP 503." }
    Write-IipsOk "owner-context carrier: $ownerContextPath"
    if (-not (Test-Path -LiteralPath $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $np04Dir)) { New-Item -ItemType Directory -Path $np04Dir -Force | Out-Null }

    # Reports is parked. Report the state honestly; never fabricate a database.
    if (Test-Path -LiteralPath $reportsOwnerPath) { Write-IipsInfo "reports-owner carrier present: $reportsOwnerPath" }
    if (-not (Test-Path -LiteralPath $reportsOwnerPath)) { Write-IipsInfo 'reports-owner carrier absent - Reports will fail closed (404). This is expected; Reports is parked.' }
    if (Test-Path -LiteralPath $np04Db) { Write-IipsInfo "NP-04 database present: $np04Db" }
    if (-not (Test-Path -LiteralPath $np04Db)) { Write-IipsInfo "NP-04 database absent at $np04Db - Reports will fail closed (404). Not created here: Reports is parked pending separate NP-04 provisioning." }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '02-port-guard' 'Confirming the required ports are free'

    Assert-IipsPortFree -Port $TransportPort -Label 'the IRR executive transport'
    Assert-IipsPortFree -Port $FrontendPort -Label 'the IRR Vite dev server'
    if ($StartIpdShell) { Assert-IipsPortFree -Port $IpdShellPort -Label 'the IPD shell' }

    $transportEnv = @{
        'EXEC_TRANSPORT_PORT'     = "$TransportPort"
        'IIPS_DATA_DIR'           = $dataDir
        'IIPS_OWNER_CONTEXT_PATH' = $ownerContextPath
        'NODE_ENV'                = 'development'
    }
    if (Test-Path -LiteralPath $reportsOwnerPath) { $transportEnv['IIPS_REPORTS_OWNER_PATH'] = $reportsOwnerPath }
    if (Test-Path -LiteralPath $np04Db) { $transportEnv['IIPS_NP04_DATABASE_PATH'] = $np04Db }

    # -----------------------------------------------------------------------------------------
    if ($StartIpdIpc) {
        Write-IipsStep '03-ipd-ipc' 'Starting the IPD Gate-3 IPC provider on a Windows named pipe'

        $pipePath = "\\.\pipe\$PipeName"
        $stateDir = Join-Path $RuntimeRoot 'ipd-state'
        if (-not (Test-Path -LiteralPath $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }

        # DIRECT P1 WAS ALREADY PROVISIONED. Verify and use it. Never create or migrate it.
        if (-not (Test-Path -LiteralPath $DatabasePath)) {
            throw "the Direct P1 user-portfolio database is missing at $DatabasePath. It was provisioned previously on native Windows and this script never creates, recreates or migrates it. Restore it, or pass -DatabasePath, or omit -StartIpdIpc."
        }
        $dbItem = Get-Item -LiteralPath $DatabasePath
        if ($dbItem.Length -eq 0) { throw "the Direct P1 database at $DatabasePath is zero bytes. This script never provisions or repairs it - investigate before proceeding." }
        Write-IipsOk "Direct P1 database verified (not modified): $DatabasePath ($($dbItem.Length) bytes)"
        Write-IipsInfo 'no provisioning, no migration and no schema change is performed by this script'

        $existingPipe = @(Get-IipsNamedPipes -Filter $PipeName)
        if ($existingPipe.Count -gt 0) { throw "the named pipe $($existingPipe[0]) already exists, so an IPC provider is already running. Stop it first with 06-Stop-IipsServers.ps1. This script never kills a process it did not start." }

        $entrypoint = Join-Path $ipdRoot 'dist\src\ipc\entrypoint.js'
        if (-not (Test-Path -LiteralPath $entrypoint)) { throw "compiled IPC entrypoint missing at $entrypoint - run 'npm.cmd run build' in the IPD checkout (step 01 does this)." }

        $ipcEnv = @{
            'IIPS_G2_IPC_ENDPOINT'    = $pipePath
            'IIPS_G3_DATABASE_PATH'   = $DatabasePath
            'IIPS_G3_LOCAL_STATE_DIR' = $stateDir
        }
        $ipc = Start-IipsService -Label 'ipd-ipc' -Executable $toolchain.NodeExe -Arguments @($entrypoint) -WorkingDirectory $ipdRoot -LogDirectory $script:ServiceLogDir -Environment $ipcEnv
        $script:Started.Add($ipc)

        # The entrypoint prints "[g3] listening on windows-named-pipe \\.\pipe\<name>" to stderr.
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
        Write-IipsOk 'the IRR transport will be told the binding is provisioned'
    }
    if (-not $StartIpdIpc) {
        Write-IipsStep '03-ipd-ipc' 'Skipped - pass -StartIpdIpc to enable User Portfolios and Broker Import'
        Write-IipsInfo 'the Direct P1 database was provisioned previously; -StartIpdIpc uses it read-only and never re-provisions it'
        Write-IipsInfo 'without it /api/user-portfolios fails closed with HTTP 503 - which is correct behaviour'
    }

    # -----------------------------------------------------------------------------------------
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

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '05-frontend' 'Starting the IRR Vite dev server on 127.0.0.1 only'

    $viteEnv = @{
        'EXEC_TRANSPORT_PORT' = "$TransportPort"
        'IIPS_DATA_DIR'       = $dataDir
    }
    # --host is passed explicitly. vite.config.ts sets host 0.0.0.0 for sandbox preview use; on a
    # personal Windows workstation that must be overridden to loopback.
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

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '06-connectivity' 'Verifying frontend-to-backend communication through the Vite proxy'

    $proxied = Wait-IipsHttpReady -Url "http://$BindAddress`:$FrontendPort/api/health" -Label 'the proxied health check' -TimeoutSeconds 60
    if ($proxied.Content -notmatch '"status"\s*:\s*"ok"') { throw "the proxied health check returned an unexpected body: $($proxied.Content). The Vite /api proxy is not reaching the transport." }
    Write-IipsOk "proxied /api/health -> $($proxied.StatusCode) with the expected body"
    Write-IipsOk 'the browser path to the backend is confirmed working'

    # -----------------------------------------------------------------------------------------
    if ($StartIpdShell) {
        Write-IipsStep '07-ipd-shell' 'Starting the IPD structural shell on 127.0.0.1 only'
        $ipdShell = Start-IipsService -Label 'ipd-shell' -Executable $toolchain.NpmCmd `
            -Arguments @('run', 'dev', '--', '--host', $BindAddress, '--port', "$IpdShellPort", '--strictPort') `
            -WorkingDirectory $ipdRoot -LogDirectory $script:ServiceLogDir -Environment @{}
        $script:Started.Add($ipdShell)
        $shellListen = Wait-IipsPortListening -Port $IpdShellPort -Label 'the IPD shell' -TimeoutSeconds $ReadyTimeoutSeconds -ExpectedAddress $BindAddress
        Write-IipsOk "IPD shell bound loopback-only: $($shellListen.LocalAddress):$IpdShellPort"
    }
    if (-not $StartIpdShell) {
        Write-IipsStep '07-ipd-shell' 'Skipped - pass -StartIpdShell for the IPD structural shell'
    }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '08-pid-record' 'Recording process IDs'

    $pidFile = Join-Path $LogRoot "iips-pids-$($script:RunStamp).json"
    $record = @()
    foreach ($p in $script:Started) {
        $record += [pscustomobject]@{ label = $p.Label; pid = $p.Pid; outLog = $p.OutLog; errLog = $p.ErrLog }
        Write-IipsOk "$($p.Label) -> PID $($p.Pid)"
    }
    $manifestShellPort = $null
    if ($StartIpdShell) { $manifestShellPort = $IpdShellPort }
    $manifestPipeName = $null
    if ($StartIpdIpc) { $manifestPipeName = $PipeName }

    $manifest = [pscustomobject]@{
        runStamp      = $script:RunStamp
        installRoot   = $InstallRoot
        bindAddress   = $BindAddress
        transportPort = $TransportPort
        frontendPort  = $FrontendPort
        ipdShellPort  = $manifestShellPort
        pipeName      = $manifestPipeName
        processes     = $record
    }
    $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $pidFile -Encoding UTF8
    Write-IipsOk "PID manifest: $pidFile"

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '09-urls' 'BROWSER URLs'

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
    if (-not $StartIpdIpc) { Write-Host '    User Portfolios / Broker Import -> restart with -StartIpdIpc' -ForegroundColor Yellow }
    Write-Host '    Reports -> parked; needs a separately provisioned NP-04 governed database' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Stop everything with: 06-Stop-IipsServers.ps1' -ForegroundColor Yellow
    Write-Host ''
    Write-IipsStepLog -LogRoot $LogRoot -Prefix '03-start' | Out-Null
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'IIPS service startup: completed successfully.' -NoPause:$NoPause | Out-Null
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

    # ALWAYS roll back. Every failure path above throws rather than exiting, so this is reached.
    Invoke-IipsRollback -Reason 'a startup step failed'
    Write-IipsStepLog -LogRoot $LogRoot -Prefix '03-start' | Out-Null

    $code = 1
    if ($message -match 'already in use|missing at|run step 01|was not found|could not be found|is missing|never creates|zero bytes|already exists|did not run|below the required floor|installation mixing|is incomplete') { $code = 2 }
    if ($message -match 'did not become ready|did not open port|did not report a bound|refused to start|exited immediately') { $code = 3 }
    if ($message -match 'unexpected body|not visible in the|did not contain the React root|bound to|must bind') { $code = 4 }
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'IIPS service startup: stopped with exit $code. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit $code
}
