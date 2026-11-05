#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 7 of 7: stop only the IIPS application processes.

.DESCRIPTION
    Stops the IRR/IPD services started by 03-Start-IipsServers.ps1 and nothing else.

    IDENTIFICATION IS DELIBERATELY NARROW. A process is stopped only if BOTH hold:
      1. its PID appears in a PID manifest written by a start run under <InstallRoot>\logs, OR it is
         listening on one of the IIPS ports; AND
      2. its full command line contains the IRR or IPD checkout path under <InstallRoot>, AND names
         an IIPS entrypoint (executive-transport.ts, dist\src\ipc\entrypoint.js, or vite).

    Processes are NEVER selected by bare executable name. Unrelated node.exe, python.exe, npm,
    editors, browsers and build daemons are left running.

    CHILD PROCESSES ARE TERMINATED TOO. `npm.cmd run dev` spawns node.exe children, and Stop-Process
    does not touch them - which would orphan the real server and leave the port held. Termination
    uses taskkill /PID <pid> /T /F, which walks the whole child tree.

    NOTHING IS DELETED. No file, directory, journal, SQLite database or owner-context carrier is
    touched. Stopping the IPC provider removes its named pipe on its own, because the pipe namespace
    is kernel-managed and non-persistent.

    After stopping, the script VERIFIES that every IIPS port is released and that the named pipe has
    disappeared, and reports the final state. A stop that reports success but leaves a port held is
    reported as a failure, not as success.

    EXIT CODES
      0  all identified IIPS processes stopped, all IIPS ports released, pipe released
      1  unhandled failure
      2  precondition failure - InstallRoot not found, or taskkill.exe unavailable
      3  a process refused to stop, or a port / the pipe is still held after the stop

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\06-Stop-IipsServers.ps1 -WhatIfStyle
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [int[]] $Ports = @(8787, 5176, 5174),

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $PipeName = 'iips-user-portfolio-v1',

    [Parameter(Mandatory = $false)]
    [int] $StopTimeoutSeconds = 45,

    [Parameter(Mandatory = $false)]
    [switch] $WhatIfStyle,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }

function Log {
    param([Parameter(Mandatory = $true)][string] $Message, [Parameter(Mandatory = $false)][string] $Colour = 'Gray')
    Write-Host $Message -ForegroundColor $Colour
    $script:IipsStepLog.Add($Message)
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Service Shutdown ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Log ''
    Log "InstallRoot : $InstallRoot"
    Log "Ports       : $($Ports -join ', ')"
    Log "Pipe        : $PipeName"
    if ($WhatIfStyle) { Log 'MODE        : report only - nothing will be stopped' 'Yellow' }
    Log ''

    if (-not (Test-Path -LiteralPath $InstallRoot)) {
        Write-Host "FAILED: InstallRoot not found at $InstallRoot" -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'IIPS service shutdown: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }
    $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    if (-not (Test-Path -LiteralPath $taskkill)) {
        Write-Host "FAILED: taskkill.exe was not found at $taskkill - cannot terminate process trees safely." -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'IIPS service shutdown: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }

    # -----------------------------------------------------------------------------------------
    Log '==> 01-collect  Gathering candidate processes'

    $irrPath = (Join-Path $InstallRoot 'iips-review-recovered').ToLowerInvariant()
    $ipdPath = (Join-Path $InstallRoot 'iips-production-market-data').ToLowerInvariant()
    $entrypoints = @('executive-transport.ts', 'dist\src\ipc\entrypoint.js', 'vite')

    $manifestPids = New-Object System.Collections.Generic.List[int]
    if (Test-Path -LiteralPath $LogRoot) {
        $manifests = @(Get-ChildItem -LiteralPath $LogRoot -Filter 'iips-pids-*.json' -File -ErrorAction SilentlyContinue)
        foreach ($m in $manifests) {
            try {
                $parsed = Get-Content -LiteralPath $m.FullName -Raw | ConvertFrom-Json
                foreach ($p in $parsed.processes) {
                    if ($null -ne $p.pid) { $manifestPids.Add([int]$p.pid) }
                }
                Log "  manifest: $($m.Name) -> $(@($parsed.processes).Count) recorded process(es)"
            }
            catch {
                Log "  manifest $($m.Name) could not be parsed and was skipped: $($_.Exception.Message)" 'Yellow'
            }
        }
    }
    if ($manifestPids.Count -eq 0) { Log '  no PID manifest found - falling back to port and command-line matching' 'Yellow' }

    $portPids = New-Object System.Collections.Generic.List[int]
    foreach ($port in $Ports) {
        $owner = Get-IipsPortOwner -Port $port
        if ($null -ne $owner) { $portPids.Add([int]$owner.OwningProcess) }
    }

    $candidateIds = @($manifestPids + $portPids | Sort-Object -Unique)
    Log "  candidate PIDs: $($candidateIds.Count)"

    # -----------------------------------------------------------------------------------------
    Log ''
    Log '==> 02-verify   Confirming each candidate really belongs to this application'

    $targets = New-Object System.Collections.Generic.List[object]
    $skipped = New-Object System.Collections.Generic.List[object]

    foreach ($id in $candidateIds) {
        $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
        if ($null -eq $proc) { Log "  PID $id is no longer running - nothing to do"; continue }

        $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $id" -ErrorAction SilentlyContinue
        $cmd = ''
        if ($null -ne $cim -and $null -ne $cim.CommandLine) { $cmd = $cim.CommandLine }
        $cmdLower = $cmd.ToLowerInvariant()

        $pathMatch = ($cmdLower -like "*$irrPath*") -or ($cmdLower -like "*$ipdPath*")
        $entryMatch = $false
        foreach ($e in $entrypoints) { if ($cmdLower -like "*$($e.ToLowerInvariant())*") { $entryMatch = $true } }

        # Both conditions must hold. A bare node.exe or python.exe never matches on name alone.
        if ($pathMatch -and $entryMatch) {
            $targets.Add([pscustomobject]@{ Pid = $id; Name = $proc.ProcessName; Cmd = $cmd })
            Log "  MATCH    PID $id  $($proc.ProcessName)" 'Green'
            Log "           $cmd"
            continue
        }
        $skipped.Add([pscustomobject]@{ Pid = $id; Name = $proc.ProcessName; Cmd = $cmd })
        Log "  PRESERVE PID $id  $($proc.ProcessName) - not an IIPS process" 'Yellow'
        if ($cmd.Length -gt 0) { Log "           $cmd" }
    }

    Log ''
    Log "  identified : $($targets.Count)" 'Green'
    Log "  preserved  : $($skipped.Count)" 'Yellow'

    # -----------------------------------------------------------------------------------------
    Log ''
    Log '==> 03-stop     Stopping the identified process trees'

    if ($targets.Count -eq 0) { Log '  nothing to stop - no IIPS process was identified' 'Yellow' }

    foreach ($t in $targets) {
        if ($WhatIfStyle) {
            Log "  WOULD STOP PID $($t.Pid)  $($t.Name) and its children" 'Cyan'
            continue
        }
        Log "  stopping PID $($t.Pid)  $($t.Name)  (taskkill /T /F - children included)"
        Stop-IipsProcessTree -ProcessId $t.Pid -Label $t.Name
    }

    if ($targets.Count -gt 0 -and -not $WhatIfStyle) {
        Log "  all $($targets.Count) process tree(s) terminated" 'Green'
    }

    # -----------------------------------------------------------------------------------------
    Log ''
    Log '==> 04-ports    Verifying the IIPS ports are released'

    $held = New-Object System.Collections.Generic.List[int]
    foreach ($port in $Ports) {
        $released = Wait-IipsPortReleased -Port $port -TimeoutSeconds $StopTimeoutSeconds
        if ($released) {
            Log "  port $port  RELEASED" 'Green'
            continue
        }
        $owner = Get-IipsPortOwner -Port $port
        $ownerName = (Get-Process -Id $owner.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        Log "  port $port  STILL HELD by PID $($owner.OwningProcess) ($ownerName)" 'Red'
        $held.Add($port)
    }

    # -----------------------------------------------------------------------------------------
    Log ''
    Log '==> 05-pipes    Verifying the named pipe is released'

    $pipeGone = Wait-IipsPipeAbsent -PipeName $PipeName -TimeoutSeconds $StopTimeoutSeconds
    $pipeStillPresent = $false
    if ($pipeGone) {
        Log "  pipe $PipeName  RELEASED - clean shutdown confirmed" 'Green'
    }
    if (-not $pipeGone) {
        $found = @(Get-IipsNamedPipes -Filter $PipeName)
        foreach ($f in $found) { Log "  pipe STILL PRESENT: $f" 'Red' }
        Log '  a lingering pipe usually means an IPC provider process is still running' 'Yellow'
        $pipeStillPresent = $true
    }

    # -----------------------------------------------------------------------------------------
    Log ''
    Log '==> 06-state    Final state'
    $portsColour = 'Green'
    if ($held.Count -gt 0) { $portsColour = 'Red' }
    $pipeColour = 'Green'
    if ($pipeStillPresent) { $pipeColour = 'Red' }

    Log "  processes stopped   : $($targets.Count)" 'Green'
    Log "  processes preserved : $($skipped.Count)" 'Yellow'
    Log "  ports released      : $($Ports.Count - $held.Count) / $($Ports.Count)" $portsColour
    Log "  named pipe released : $(-not $pipeStillPresent)" $pipeColour
    Log '  data preserved      : journals, SQLite databases and carriers were not touched' 'Green'

    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $logPath = Join-Path $LogRoot ("06-stop-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
    $script:IipsStepLog | Set-Content -LiteralPath $logPath -Encoding UTF8
    Write-Host ''
    Write-Host "Execution log written to: $logPath" -ForegroundColor Yellow

    if ($held.Count -gt 0 -or $pipeStillPresent) {
        Write-Host ''
        Write-Host 'FAILED: one or more IIPS ports, or the named pipe, are still held.' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'IIPS service shutdown: stopped with exit 3. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 3
    }
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'IIPS service shutdown: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    Write-Host ''
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    $code = 1
    if ($_.Exception.Message -match 'InstallRoot not found|taskkill\.exe was not found') { $code = 2 }
    if ($_.Exception.Message -match 'did not terminate within') { $code = 3 }
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'IIPS service shutdown: stopped with exit $code. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit $code
}
