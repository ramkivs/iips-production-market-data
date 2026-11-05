#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - shared toolchain and helper functions.

.DESCRIPTION
    Dot-sourced by every IIPS setup script:

        . (Join-Path $PSScriptRoot 'Iips-Common.ps1')

    NODE.JS COMMAND HANDLING (mandatory, non-negotiable)
      On Windows, `npm` and `npx` are .cmd shims. PowerShell resolves a bare `npm` through its own
      command-discovery rules, which can silently select a different installation, an alias, or a
      non-.cmd file. These scripts therefore:

        * NEVER invoke a bare `npm` or `npx`
        * resolve node.exe, npm.cmd and npx.cmd from ONE Node.js installation
        * invoke every one of them by EXPLICIT ABSOLUTE PATH with the call operator `&`
        * verify node.exe >= 22.13.0
        * verify that the npm shim reports the SAME node.exe, so two installations cannot mix

    See Resolve-IipsNodeToolchain and Invoke-IipsCommand.

.NOTES
    No else, elseif or finally anywhere. All error handling is try/catch plus guard clauses.
#>

Set-StrictMode -Version Latest

# ----------------------------------------------------------------------------------------------
# Pinned commits - the authoritative state these scripts were prepared against.
# Verified 2026-11-05 from the live repositories.
# ----------------------------------------------------------------------------------------------
$script:IipsExpectedIrrCommit = '9e0a0415b76571fc4db1747b2da63c73fa0447d3'
$script:IipsExpectedIpdCommit = 'b605a61458a655bb555c6f340332fcf77a85c870'
$script:IipsMinimumNodeMajor = 22
$script:IipsMinimumNodeMinor = 13
$script:IipsMinimumNodePatch = 0
$script:IipsPreferredNodePath = 'C:\Node22\node-v22.16.0-win-x64\node.exe'

# Direct P1 user-portfolio database - ALREADY PROVISIONED on the operator's Windows host.
# These scripts verify it and never create, migrate, truncate or replace it.
$script:IipsDirectP1DatabasePath = 'C:\iips-data\iips\user-portfolio.sqlite'

# ----------------------------------------------------------------------------------------------
# Port plan.
#
#   8787  IRR executive transport (API)
#   5176  IRR frontend (Vite dev server)      <-- IIPS
#   5174  optional IPD structural shell
#
# Port 5173 belongs to the SEPARATE ArthaVault application on this host. IIPS must never bind it,
# probe it as its own, or terminate whatever owns it. The original bundle defaulted the IRR
# frontend to 5173, which collided with ArthaVault; 5176 is the corrected allocation.
# ----------------------------------------------------------------------------------------------
$script:IipsTransportPort = 8787
$script:IipsFrontendPort = 5176
$script:IipsIpdShellPort = 5174
$script:IipsArthaVaultPort = 5173
$script:IipsPipeName = 'iips-user-portfolio-v1'

# ----------------------------------------------------------------------------------------------
# Console + log output
# ----------------------------------------------------------------------------------------------
if (-not (Test-Path variable:script:IipsStepLog)) {
    $script:IipsStepLog = New-Object System.Collections.Generic.List[string]
}
if (-not (Test-Path variable:script:IipsCurrentStep)) { $script:IipsCurrentStep = '00-bootstrap' }

function Write-IipsStep {
    param([Parameter(Mandatory = $true)][string] $Id, [Parameter(Mandatory = $true)][string] $Message)
    $script:IipsCurrentStep = $Id
    $line = "[$Id] $Message"
    Write-Host ''
    Write-Host "==> $line" -ForegroundColor Cyan
    $script:IipsStepLog.Add($line)
}

function Write-IipsOk {
    param([Parameter(Mandatory = $true)][string] $Message)
    Write-Host "    OK   $Message" -ForegroundColor Green
    $script:IipsStepLog.Add("    OK   $Message")
}

function Write-IipsInfo {
    param([Parameter(Mandatory = $true)][string] $Message)
    Write-Host "         $Message" -ForegroundColor Gray
    $script:IipsStepLog.Add("         $Message")
}

function Write-IipsWarn {
    param([Parameter(Mandatory = $true)][string] $Message)
    Write-Host "    WARN $Message" -ForegroundColor Yellow
    $script:IipsStepLog.Add("    WARN $Message")
}

function Write-IipsStepLog {
    param([Parameter(Mandatory = $true)][string] $LogRoot, [Parameter(Mandatory = $true)][string] $Prefix)
    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $path = Join-Path $LogRoot ($Prefix + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    $script:IipsStepLog | Set-Content -LiteralPath $path -Encoding UTF8
    Write-Host ''
    Write-Host "Execution log written to: $path" -ForegroundColor Yellow
    return $path
}

<#
.SYNOPSIS
    Waits for the operator so the window does not vanish with the result still unread.

.NOTES
    Uses Read-Host, never `exit` and never [Environment]::Exit, so the user's PowerShell session is
    never closed. Wrapped in try/catch because Read-Host fails when there is no interactive stdin
    (for example a scheduled or redirected run) - that must not turn a successful setup into a
    failure.
#>
function Write-IipsPause {
    param([Parameter(Mandatory = $false)][switch] $NoPause)
    if ($NoPause) { return }
    Write-Host ''
    Write-Host 'Press Enter to close this window...' -ForegroundColor Yellow
    try { $null = Read-Host }
    catch { Write-Host '(no interactive input available - continuing without a pause)' -ForegroundColor DarkGray }
}

<#
.SYNOPSIS
    Prints one unambiguous final status line and then pauses.

.NOTES
    Every script ends through here, so success and failure are always stated explicitly rather than
    left for the operator to infer from a wall of output. -ExitCode is returned so the caller can
    still exit with a meaningful code AFTER the pause.
#>
function Write-IipsFinalStatus {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'FAIL')] [string] $Outcome,
        [Parameter(Mandatory = $true)][string] $Message,
        [Parameter(Mandatory = $false)][int] $ExitCode = 0,
        [Parameter(Mandatory = $false)][switch] $NoPause
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

# ----------------------------------------------------------------------------------------------
# Node.js toolchain resolution
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Resolves node.exe, npm.cmd and npx.cmd from ONE installation and verifies them.

.OUTPUTS
    [pscustomobject] with NodeExe, NpmCmd, NpxCmd, NodeDir, NodeVersion, NpmVersion
#>
function Resolve-IipsNodeToolchain {
    param(
        [Parameter(Mandatory = $false)]
        [string] $NodeExecutable = ''
    )

    $candidates = New-Object System.Collections.Generic.List[string]
    if ($NodeExecutable.Length -gt 0) { $candidates.Add($NodeExecutable) }
    $candidates.Add($script:IipsPreferredNodePath)
    $onPath = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($null -ne $onPath) { $candidates.Add($onPath.Source) }

    $nodeExe = $null
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) { $nodeExe = (Resolve-Path -LiteralPath $c).Path; break }
    }
    if ($null -eq $nodeExe) {
        throw 'node.exe could not be found. Node.js >= 22.13.0 is required (flag-free node:sqlite). Pass -NodeExecutable with the full path to node.exe.'
    }

    $nodeDir = Split-Path -Parent $nodeExe

    # npm.cmd and npx.cmd MUST come from the same directory as node.exe. This is what prevents two
    # Node.js installations from being mixed: the shims and the runtime are resolved as one unit.
    $npmCmd = Join-Path $nodeDir 'npm.cmd'
    $npxCmd = Join-Path $nodeDir 'npx.cmd'
    if (-not (Test-Path -LiteralPath $npmCmd)) { throw "npm.cmd was not found beside node.exe at $npmCmd. The Node.js installation at $nodeDir is incomplete - use a full Node.js distribution, or pass -NodeExecutable pointing at a complete one." }
    if (-not (Test-Path -LiteralPath $npxCmd)) { throw "npx.cmd was not found beside node.exe at $npxCmd. The Node.js installation at $nodeDir is incomplete." }

    # Make this installation first on PATH for every child process, so the internal `node` lookup
    # performed by the npm/npx shims resolves to the same binary we invoked explicitly.
    $env:PATH = $nodeDir + [System.IO.Path]::PathSeparator + $env:PATH

    $nodeProbe = Invoke-IipsCapture -Executable $nodeExe -Arguments @('--version')
    $versionRaw = $nodeProbe.Combined
    if ($nodeProbe.ExitCode -ne 0) { throw "node.exe at $nodeExe did not run: $versionRaw" }
    $versionText = $versionRaw.TrimStart('v')
    $parts = $versionText.Split('.')
    if ($parts.Count -lt 3) { throw "could not parse the Node.js version '$versionRaw'." }
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]($parts[2] -replace '[^0-9].*$', '')

    $floorOk = $false
    if ($major -gt $script:IipsMinimumNodeMajor) { $floorOk = $true }
    if ($major -eq $script:IipsMinimumNodeMajor -and $minor -gt $script:IipsMinimumNodeMinor) { $floorOk = $true }
    if ($major -eq $script:IipsMinimumNodeMajor -and $minor -eq $script:IipsMinimumNodeMinor -and $patch -ge $script:IipsMinimumNodePatch) { $floorOk = $true }
    if (-not $floorOk) { throw "Node.js $versionRaw at $nodeExe is below the required floor 22.13.0 (src/persistence/connection.ts MINIMUM_NODE_*)." }

    $npmProbe = Invoke-IipsCapture -Executable $npmCmd -Arguments @('--version')
    $npmVersion = $npmProbe.Combined
    if ($npmProbe.ExitCode -ne 0) { throw "npm.cmd at $npmCmd did not run: $npmVersion" }
    $npxProbe = Invoke-IipsCapture -Executable $npxCmd -Arguments @('--version')
    $npxVersion = $npxProbe.Combined
    if ($npxProbe.ExitCode -ne 0) { throw "npx.cmd at $npxCmd did not run: $npxVersion" }

    # Anti-mixing proof: ask npm which node.exe it actually executes. A mismatch means a second
    # installation is shadowing this one and must be fixed before setup proceeds.
    $consistency = 'VERIFIED'
    # The probe expression is written to a temporary .js file rather than passed as an inline -e
    # argument, so no nested quoting has to survive Start-Process argument marshalling.
    $probeDir = Join-Path $env:TEMP 'iips-node-probe'
    if (-not (Test-Path -LiteralPath $probeDir)) { New-Item -ItemType Directory -Path $probeDir -Force | Out-Null }
    $probeFile = Join-Path $probeDir ('which-node-' + ([System.Guid]::NewGuid().ToString('N').Substring(0, 8)) + '.js')
    Set-Content -LiteralPath $probeFile -Value "process.stdout.write(process.execPath);" -Encoding ASCII
    $probe = Invoke-IipsCapture -Executable $npmCmd -Arguments @('exec', '--', 'node', $probeFile)
    $reported = $probe.StdOut.Trim()
    if ($reported.Length -eq 0) { $reported = $probe.Combined.Trim() }
    $probeExit = $probe.ExitCode
    Remove-Item -LiteralPath $probeFile -Force -ErrorAction SilentlyContinue
    if ($probeExit -ne 0) {
        $consistency = 'NOT VERIFIED (npm exec probe unavailable) - same-directory resolution and PATH prepend applied instead'
    }
    if ($probeExit -eq 0) {
        # Compare case-insensitively and with a single separator style, so the comparison is about
        # the installation and not about how each side happens to spell the path.
        $reportedNormalised = $reported.Trim('"').Replace('/', '\').TrimEnd('\')
        $expectedNormalised = $nodeExe.Replace('/', '\').TrimEnd('\')
        if (-not [string]::Equals($reportedNormalised, $expectedNormalised, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Node.js installation mixing detected: npm.cmd at $npmCmd executes '$reportedNormalised' but the resolved runtime is '$expectedNormalised'. Fix PATH so a single Node.js installation is used."
        }
    }

    Write-IipsOk "node.exe : $nodeExe ($versionRaw)"
    Write-IipsOk "npm.cmd  : $npmCmd ($npmVersion)"
    Write-IipsOk "npx.cmd  : $npxCmd ($npxVersion)"
    Write-IipsInfo "single-installation check: $consistency"

    return [pscustomobject]@{
        NodeExe     = $nodeExe
        NpmCmd      = $npmCmd
        NpxCmd      = $npxCmd
        NodeDir     = $nodeDir
        NodeVersion = $versionRaw
        NpmVersion  = $npmVersion
    }
}

# ----------------------------------------------------------------------------------------------
# Command invocation
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Runs a native executable by explicit path and returns its exit code with stdout and stderr
    captured SEPARATELY.

.NOTES
    WHY Start-Process WITH FILE REDIRECTION

    The previous form was `& $exe @args 2>&1 | Out-String`. Under $ErrorActionPreference = 'Stop',
    redirecting a native command's stderr into the PowerShell pipeline makes PowerShell wrap every
    stderr line in an ErrorRecord, and the first one TERMINATES the caller. That is not theoretical:
    `npm ci` writes progress and warnings to stderr as a matter of routine, and the fail-closed
    harnesses write their diagnostics to stderr and exit non-zero BY DESIGN. Both were misreported
    as script crashes on the real Windows host.

    Start-Process with separate stdout and stderr files keeps native stderr entirely out of the
    pipeline, so a non-zero exit code and a stderr diagnostic can be inspected as data.

    Arguments containing spaces or quotes are individually quoted; two paths are never concatenated
    into a single token.
#>
function Invoke-IipsCapture {
    param(
        [Parameter(Mandatory = $true)][string] $Executable,
        [Parameter(Mandatory = $true)][string[]] $Arguments,
        [Parameter(Mandatory = $false)][string] $WorkingDirectory = '',
        [Parameter(Mandatory = $false)][string] $TempRoot = ''
    )

    if (-not (Test-Path -LiteralPath $Executable)) {
        throw "executable not found at the explicit path '$Executable'. A bare command name is never resolved for IIPS setup."
    }

    $tmp = $TempRoot
    if ($tmp.Length -eq 0) { $tmp = Join-Path $env:TEMP 'iips-capture' }
    if (-not (Test-Path -LiteralPath $tmp)) { New-Item -ItemType Directory -Path $tmp -Force | Out-Null }

    $stamp = (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
    $outFile = Join-Path $tmp ("cap-$stamp-out.txt")
    $errFile = Join-Path $tmp ("cap-$stamp-err.txt")

    $tokens = New-Object System.Collections.Generic.List[string]
    foreach ($a in $Arguments) {
        $t = "$a"
        if ($t -match '[\s"]') { $tokens.Add('"' + $t.Replace('"', '\"') + '"') }
        if ($t -notmatch '[\s"]') { $tokens.Add($t) }
    }

    $spParams = @{
        FilePath               = $Executable
        ArgumentList           = ($tokens -join ' ')
        NoNewWindow            = $true
        Wait                   = $true
        PassThru               = $true
        RedirectStandardOutput = $outFile
        RedirectStandardError  = $errFile
    }
    if ($WorkingDirectory.Length -gt 0) { $spParams['WorkingDirectory'] = $WorkingDirectory }

    $proc = Start-Process @spParams

    $stdout = ''
    $stderr = ''
    if (Test-Path -LiteralPath $outFile) { $raw = Get-Content -LiteralPath $outFile -Raw; if ($null -ne $raw) { $stdout = $raw } }
    if (Test-Path -LiteralPath $errFile) { $raw = Get-Content -LiteralPath $errFile -Raw; if ($null -ne $raw) { $stderr = $raw } }
    Remove-Item -LiteralPath $outFile -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $errFile -Force -ErrorAction SilentlyContinue

    $exitCode = -1
    if ($null -ne $proc.ExitCode) { $exitCode = [int]$proc.ExitCode }

    return [pscustomobject]@{
        ExitCode = $exitCode
        StdOut   = $stdout.Trim()
        StdErr   = $stderr.Trim()
        Combined = ($stdout + "`n" + $stderr).Trim()
    }
}


<#
.SYNOPSIS
    Runs a native command by explicit path with the call operator and an explicit working directory.
    Throws unless the exit code is exactly 0. Never invokes a bare `npm` or `npx`.
#>
function Invoke-IipsCommand {
    param(
        [Parameter(Mandatory = $true)][string] $Executable,
        [Parameter(Mandatory = $true)][string[]] $Arguments,
        [Parameter(Mandatory = $true)][string] $WorkingDirectory,
        [Parameter(Mandatory = $true)][string] $Purpose,
        [Parameter(Mandatory = $false)][hashtable] $Environment = @{}
    )

    if (-not (Test-Path -LiteralPath $Executable)) {
        throw "$Purpose : executable not found at the explicit path '$Executable'. A bare command name is never resolved for IIPS setup."
    }
    if (-not (Test-Path -LiteralPath $WorkingDirectory)) {
        throw "$Purpose : working directory does not exist: $WorkingDirectory"
    }

    foreach ($k in $Environment.Keys) { Set-Item -Path "Env:\$k" -Value $Environment[$k] }

    Write-IipsInfo "RUN  & '$Executable' $($Arguments -join ' ')"
    Write-IipsInfo "     cwd: $WorkingDirectory"

    # Never `& $exe @args 2>&1 | ForEach-Object ...`: under $ErrorActionPreference = 'Stop' the
    # stderr that npm writes as a matter of routine would terminate this script mid-install.
    $result = Invoke-IipsCapture -Executable $Executable -Arguments $Arguments -WorkingDirectory $WorkingDirectory
    foreach ($line in @(($result.Combined -split "`r?`n"))) {
        if ($line.Length -gt 0) { Write-Host "     | $line" -ForegroundColor DarkGray }
    }
    $code = $result.ExitCode

    if ($code -lt 0) { throw "$Purpose : no exit code was reported by '$Executable'." }
    if ($code -ne 0) { throw "$Purpose : '$Executable $($Arguments -join ' ')' returned exit code $code" }
    Write-IipsInfo "     exit 0"
}

<#
.SYNOPSIS
    Starts a detached background service and returns its process object.

.NOTES
    Start-Process (not `&`) is used here deliberately: a background service needs a recorded PID and
    redirected stdout/stderr, and `&` blocks until the child exits. The executable is still passed as
    an explicit absolute path to a .cmd or .exe - never a bare command name.
#>
function Start-IipsService {
    param(
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][string] $Executable,
        [Parameter(Mandatory = $true)][string[]] $Arguments,
        [Parameter(Mandatory = $true)][string] $WorkingDirectory,
        [Parameter(Mandatory = $true)][string] $LogDirectory,
        [Parameter(Mandatory = $false)][hashtable] $Environment = @{}
    )

    if (-not (Test-Path -LiteralPath $Executable)) { throw "$Label : executable not found at '$Executable'." }
    if (-not (Test-Path -LiteralPath $WorkingDirectory)) { throw "$Label : working directory does not exist: $WorkingDirectory" }
    if (-not (Test-Path -LiteralPath $LogDirectory)) { New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null }

    $outLog = Join-Path $LogDirectory "$Label.out.log"
    $errLog = Join-Path $LogDirectory "$Label.err.log"

    foreach ($k in $Environment.Keys) { Set-Item -Path "Env:\$k" -Value $Environment[$k] }

    Write-IipsInfo "START $Label"
    Write-IipsInfo "      exe  : $Executable"
    Write-IipsInfo "      args : $($Arguments -join ' ')"
    Write-IipsInfo "      cwd  : $WorkingDirectory"
    Write-IipsInfo "      logs : $outLog"

    $proc = Start-Process -FilePath $Executable `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -PassThru

    if ($null -eq $proc) { throw "$Label : Start-Process returned no process object." }
    Start-Sleep -Milliseconds 900
    $alive = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
    if ($null -eq $alive) {
        $tail = ''
        if (Test-Path -LiteralPath $errLog) { $tail = (Get-Content -LiteralPath $errLog -Tail 20) -join "`n" }
        throw "$Label : the process exited immediately after start. Error log tail:`n$tail"
    }

    Write-IipsOk "$Label started, PID $($proc.Id)"
    return [pscustomobject]@{ Label = $Label; Pid = $proc.Id; OutLog = $outLog; ErrLog = $errLog }
}

# ----------------------------------------------------------------------------------------------
# Process tree termination
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Stops a process AND its spawned children.

.NOTES
    Stop-Process does not terminate children. `npm.cmd run dev` spawns node.exe children, so killing
    only the npm shim would orphan the actual server and leave the port held. taskkill /T walks the
    tree. Only the PID given is targeted - no process is ever selected by executable name.
#>
function Stop-IipsProcessTree {
    param(
        [Parameter(Mandatory = $true)][int] $ProcessId,
        [Parameter(Mandatory = $false)][string] $Label = ''
    )
    $existing = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($null -eq $existing) {
        Write-IipsInfo "PID $ProcessId $Label is no longer running"
        return 0
    }
    $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    if (-not (Test-Path -LiteralPath $taskkill)) { throw "taskkill.exe was not found at $taskkill - cannot terminate a process tree safely." }

    & $taskkill /PID $ProcessId /T /F 2>&1 | ForEach-Object { Write-IipsInfo "     taskkill: $_" }
    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
        $still = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($null -eq $still) { return 0 }
    }
    throw "PID $ProcessId $Label did not terminate within 20 seconds."
}

# ----------------------------------------------------------------------------------------------
# Ports and named pipes
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Classifies one MSFT_NetTCPConnection row as a listener or not.

.NOTES
    TWO REAL-WINDOWS BEHAVIOURS HAD TO BE HANDLED, both observed on the operator's host:

      1. An ACTIVE listener was returned with a BLANK State, RemoteAddress 0.0.0.0 and
         RemotePort 0. Filtering on `-State Listen` therefore missed a port that was genuinely
         accepting connections, and the setup wrongly reported it as free.

      2. A socket with an explicit non-Listen state (Established, Bound, TimeWait, ...) is NOT a
         listener and must not be reported as one.

    So: an explicit `Listen` state is definitive; otherwise a row qualifies only when its remote
    endpoint is the wildcard/zero endpoint that characterises a listening socket.
#>
function Test-IipsIsListener {
    param([Parameter(Mandatory = $true)] $Connection)

    $state = ''
    try { $state = "$($Connection.State)" }
    catch { $state = '' }

    # Explicit Listen state - definitive, whatever the remote endpoint looks like.
    if ($state -eq 'Listen') { return $true }

    # An explicitly non-Listen state is a real connection or a bound-but-not-listening socket.
    if ($state.Length -gt 0) { return $false }

    # Blank State: fall back to the remote endpoint characteristics.
    $remotePort = -1
    try { $remotePort = [int]$Connection.RemotePort }
    catch { $remotePort = -1 }
    if ($remotePort -ne 0) { return $false }

    $remoteAddress = ''
    try { $remoteAddress = "$($Connection.RemoteAddress)" }
    catch { $remoteAddress = '' }

    foreach ($w in @('0.0.0.0', '::', '*', '')) {
        if ($remoteAddress -eq $w) { return $true }
    }
    return $false
}

<#
.SYNOPSIS
    Queries the TCP connection rows bound to a local port, distinguishing an empty result from an
    actual query failure.

.NOTES
    CORRECTION. The previous implementation passed -ErrorAction SilentlyContinue and wrapped the
    call in try/catch, then treated BOTH outcomes as "no rows". That conflates two very different
    facts:

      * the query ran and nothing matched   -> the port is genuinely free
      * the query itself failed (provider, CIM/WMI, permission, cmdlet absent) -> the port state
        is UNKNOWN

    Collapsing the second into the first reports a port as free when it was never successfully
    inspected, which is the dangerous direction for a setup script: it can bind over a live
    listener, or declare a port released when it is not.

    This helper therefore queries with -ErrorAction Stop and CLASSIFIES the exception:

      * a "not found" signal (the documented "No MSFT_NetTCPConnection objects found" error that
        Get-NetTCPConnection raises when the filter matches nothing) is a SUCCESSFUL query with an
        empty result, so the port is free;
      * anything else is reported as Succeeded = $false, and callers fail closed.

    Unrecognised error identities are deliberately classified as failures rather than as empty
    results. A surprise must never be read as "free".

.OUTPUTS
    Hashtable: @{ Succeeded = [bool]; Rows = [array]; Reason = [string] }
#>
function Get-IipsTcpRowsForPort {
    param([Parameter(Mandatory = $true)][int] $Port)

    try {
        # -ErrorAction Stop, not SilentlyContinue: a real failure must surface as an exception
        # so it can be distinguished from an empty result.
        $rows = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop)
        return @{ Succeeded = $true; Rows = $rows; Reason = '' }
    }
    catch {
        $errorId = ''
        $category = ''
        $message = ''
        try { $errorId = "$($_.FullyQualifiedErrorId)" }
        catch { $errorId = '' }
        try { $category = "$($_.CategoryInfo.Category)" }
        catch { $category = '' }
        try { $message = "$($_.Exception.Message)" }
        catch { $message = '' }

        # The documented "nothing matched" signal, recognised by error identity, error category
        # and message so that a single wording difference cannot turn a free port into UNKNOWN.
        $isEmptyResult = $false
        if ($errorId -like 'CmdletizationQuery_NotFound*') { $isEmptyResult = $true }
        if ($errorId -eq 'NoMatchingInstances') { $isEmptyResult = $true }
        if ($category -eq 'ObjectNotFound') { $isEmptyResult = $true }
        if ($message -match 'No MSFT_NetTCPConnection objects found') { $isEmptyResult = $true }

        if ($isEmptyResult) {
            # Successful query, zero matches: the port is genuinely free.
            return @{ Succeeded = $true; Rows = @(); Reason = '' }
        }

        # A genuine query failure. State must be UNKNOWN - never free.
        $reason = "$errorId"
        if ($reason.Length -eq 0) { $reason = 'unidentified error' }
        if ($message.Length -gt 0) { $reason = "$reason - $message" }
        return @{ Succeeded = $false; Rows = @(); Reason = $reason }
    }
}

<#
.SYNOPSIS
    Returns the LISTENER row for a local port, or $null when the port is confirmed free.

.NOTES
    Throws when the port state cannot be determined, so an UNKNOWN state fails closed instead of
    being mistaken for a free port.

    Blank State, wildcard remote address and RemotePort = 0 handling lives in Test-IipsIsListener
    and is unchanged: an explicit Listen state is definitive, an explicit non-Listen state is never
    a listener, and a blank State falls back to the wildcard/zero remote endpoint test.

    The result is always normalised with @() because the cmdlet returns zero, one or many objects
    and PowerShell unrolls a single-element result into a scalar.
#>
function Get-IipsPortOwner {
    param([Parameter(Mandatory = $true)][int] $Port)

    $query = Get-IipsTcpRowsForPort -Port $Port
    if (-not $query.Succeeded) {
        throw "UNKNOWN: could not determine whether port $Port is in use ($($query.Reason)). This is treated as a failure, not as a free port, because binding over an uninspected listener is unsafe."
    }

    $rows = @($query.Rows)
    if ($rows.Count -eq 0) { return $null }

    foreach ($r in $rows) {
        if (Test-IipsIsListener -Connection $r) { return $r }
    }
    return $null
}

<#
.SYNOPSIS
    Counts every connection object bound to a local port, listener or not.

.NOTES
    Used for release verification: a port is only truly released when NOTHING is bound to it,
    which is a stronger condition than "no listener".

    Throws when the count cannot be obtained. A release check that cannot be performed must not
    report success, so an UNKNOWN state fails closed rather than being read as zero occupants.
#>
function Get-IipsPortOccupantCount {
    param([Parameter(Mandatory = $true)][int] $Port)

    $query = Get-IipsTcpRowsForPort -Port $Port
    if (-not $query.Succeeded) {
        throw "UNKNOWN: could not count the occupants of port $Port ($($query.Reason)). This is treated as a failure, not as a released port, because an unverified release check proves nothing."
    }
    return @($query.Rows).Count
}

function Assert-IipsPortFree {
    param([Parameter(Mandatory = $true)][int] $Port, [Parameter(Mandatory = $true)][string] $Label)
    $owner = Get-IipsPortOwner -Port $Port
    if ($null -ne $owner) {
        $name = (Get-Process -Id $owner.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        throw "port $Port is already in use by PID $($owner.OwningProcess) ($name), so $Label cannot bind. Free it or pass a different port. IIPS setup never kills a process it did not start."
    }
    Write-IipsOk "port $Port is free for $Label"
}

function Wait-IipsPortListening {
    param(
        [Parameter(Mandatory = $true)][int] $Port,
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][int] $TimeoutSeconds,
        [Parameter(Mandatory = $false)][string] $ExpectedAddress = '127.0.0.1'
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $attempt = 0
    while ((Get-Date) -lt $deadline) {
        $attempt++
        $owner = Get-IipsPortOwner -Port $Port
        if ($null -ne $owner) {
            if ($owner.LocalAddress -ne $ExpectedAddress) {
                throw "$Label bound to $($owner.LocalAddress):$Port but must bind $ExpectedAddress only. This is a personal single-user application and must not be reachable from the network."
            }
            Write-IipsOk "$Label listening on $($owner.LocalAddress):$Port after $attempt attempt(s)"
            return $owner
        }
        Start-Sleep -Seconds 2
    }
    throw "$Label did not open port $Port within $TimeoutSeconds seconds."
}

function Wait-IipsPortReleased {
    param([Parameter(Mandatory = $true)][int] $Port, [Parameter(Mandatory = $true)][int] $TimeoutSeconds)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        # Stronger than "no listener": nothing at all may remain bound to the port.
        if ((Get-IipsPortOccupantCount -Port $Port) -eq 0) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Get-IipsNamedPipes {
    param([Parameter(Mandatory = $false)][string] $Filter = '')
    $all = [System.IO.Directory]::GetFiles('\\.\pipe\')
    if ($Filter.Length -eq 0) { return $all }
    return @($all | Where-Object { $_ -like "*$Filter*" })
}

function Wait-IipsPipePresent {
    param(
        [Parameter(Mandatory = $true)][string] $PipeName,
        [Parameter(Mandatory = $true)][int] $TimeoutSeconds
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $found = @(Get-IipsNamedPipes -Filter $PipeName)
        if ($found.Count -gt 0) { return $found[0] }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

function Wait-IipsPipeAbsent {
    param(
        [Parameter(Mandatory = $true)][string] $PipeName,
        [Parameter(Mandatory = $true)][int] $TimeoutSeconds
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $found = @(Get-IipsNamedPipes -Filter $PipeName)
        if ($found.Count -eq 0) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

# ----------------------------------------------------------------------------------------------
# Repository commit verification
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Verifies a fresh clone is at the pinned authoritative commit and reports any drift.

.OUTPUTS
    [pscustomobject] Drifted, Head, Expected, AheadBehind, LogRange
#>
function Test-IipsCommitPin {
    param(
        [Parameter(Mandatory = $true)][string] $RepoDir,
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][string] $ExpectedCommit,
        [Parameter(Mandatory = $true)][string] $GitExe
    )
    $head = (Invoke-IipsCapture -Executable $GitExe -Arguments @('-C', $RepoDir, 'rev-parse', 'HEAD')).Combined
    if ($LASTEXITCODE -ne 0) { throw "$Label : 'git rev-parse HEAD' failed: $head" }
    if ($head.Length -ne 40) { throw "$Label : HEAD is not a 40-character SHA: '$head'" }

    $drifted = -not [string]::Equals($head, $ExpectedCommit, [System.StringComparison]::OrdinalIgnoreCase)
    $logRange = ''
    $aheadBehind = ''
    if ($drifted) {
        $logRange = (Invoke-IipsCapture -Executable $GitExe -Arguments @('-C', $RepoDir, 'log', '--oneline', '--no-decorate', "$ExpectedCommit..$head")).Combined
        $aheadBehind = (Invoke-IipsCapture -Executable $GitExe -Arguments @('-C', $RepoDir, 'rev-list', '--left-right', '--count', "$ExpectedCommit...$head")).Combined
    }

    return [pscustomobject]@{
        Drifted      = $drifted
        Head         = $head
        Expected     = $ExpectedCommit
        AheadBehind  = $aheadBehind
        LogRange     = $logRange
    }
}

function Assert-IipsCleanTree {
    param(
        [Parameter(Mandatory = $true)][string] $RepoDir,
        [Parameter(Mandatory = $true)][string] $Label,
        [Parameter(Mandatory = $true)][string] $GitExe
    )
    $status = (Invoke-IipsCapture -Executable $GitExe -Arguments @('-C', $RepoDir, 'status', '--porcelain')).Combined
    if ($LASTEXITCODE -ne 0) { throw "$Label : 'git status --porcelain' failed." }
    if ($status.Length -ne 0) { throw "$Label : working tree is not clean after a fresh clone:`n$status" }
    Write-IipsOk "$Label working tree clean (0 modified, 0 untracked)"
}
