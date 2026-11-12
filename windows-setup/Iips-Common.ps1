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
# No preferred installation path is hardcoded: an installation that exists on one host and not on
# another turns a deterministic resolver into a machine-specific one. Candidates come from
# -NodeExecutable or from PATH (Get-Command node.exe -All), and each is verified end-to-end.

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
    Decides whether a Node.js version satisfies the IIPS floor (22.13.0, flag-free node:sqlite).

.NOTES
    Parsing is defensive: an unexpected shape returns $false rather than throwing, so a broken
    probe can never be mistaken for a valid toolchain.
#>
function Test-IipsNodeVersionAtOrAboveFloor {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Version
    )

    $text = $Version.Trim()
    if ($text.StartsWith('v')) { $text = $text.Substring(1) }
    $parts = @($text.Split('.'))
    if ($parts.Count -lt 3) { return $false }

    $major = 0
    $minor = 0
    $patch = 0
    if (-not [int]::TryParse($parts[0], [ref] $major)) { return $false }
    if (-not [int]::TryParse($parts[1], [ref] $minor)) { return $false }
    $patchText = [regex]::Match($parts[2], '^\d+').Value
    if (-not [int]::TryParse($patchText, [ref] $patch)) { return $false }

    if ($major -ne $script:IipsMinimumNodeMajor) { return ($major -gt $script:IipsMinimumNodeMajor) }
    if ($minor -ne $script:IipsMinimumNodeMinor) { return ($minor -gt $script:IipsMinimumNodeMinor) }
    return ($patch -ge $script:IipsMinimumNodePatch)
}

<#
.SYNOPSIS
    Resolves node.exe, npm.cmd and npx.cmd from ONE installation and verifies them.

.DESCRIPTION
    Candidates are the explicitly supplied -NodeExecutable, or every node.exe that PATH resolves
    (`Get-Command node.exe -All`). NO machine-specific installation path is assumed: a hardcoded
    preferred directory is exactly what made the previous version work on one host and fail on
    another.

    For each candidate the SAME directory must hold node.exe, npm.cmd and npx.cmd. That co-location
    is the single-installation guarantee: a runtime and a shim from two installations cannot be
    mixed. Every version probe goes through Invoke-IipsProcess (bounded, async streams, kill on
    timeout) and the shims are invoked through cmd.exe /d /s /c, never directly and never through
    `npm exec` / `npx` discovery.

    A candidate that fails any step is skipped with a reason code; when no candidate survives, the
    failure is reported with those codes only - no personal paths, no machine names.

.OUTPUTS
    [pscustomobject] with NodeExe, NpmCmd, NpxCmd, NodeDir, InstallRoot, NodeVersion, NpmVersion
#>
function Resolve-IipsNodeToolchain {
    param(
        [Parameter(Mandatory = $false)]
        [string] $NodeExecutable = ''
    )

    $nodeCandidates = New-Object System.Collections.Generic.List[string]
    $reasons = New-Object System.Collections.Generic.List[string]

    if (-not [string]::IsNullOrWhiteSpace($NodeExecutable)) {
        $nodeCandidates.Add($NodeExecutable)
    }
    if ([string]::IsNullOrWhiteSpace($NodeExecutable)) {
        $commands = @(Get-Command node.exe -All -ErrorAction SilentlyContinue)
        foreach ($command in $commands) {
            if ($command.Source) { $nodeCandidates.Add($command.Source) }
        }
        if ($commands.Count -eq 0) { $reasons.Add('node-not-on-path') }
    }
    if ($nodeCandidates.Count -eq 0) { $reasons.Add('no-candidate') }

    foreach ($candidate in $nodeCandidates) {
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $reasons.Add('node-not-a-file')
            continue
        }

        $nodePath = (Resolve-Path -LiteralPath $candidate).Path
        $installDirectory = Split-Path -Parent $nodePath

        # node.exe, npm.cmd and npx.cmd MUST come from the same directory. This is what prevents
        # two Node.js installations from being mixed: the shims and the runtime are one unit.
        $npmPath = Join-Path $installDirectory 'npm.cmd'
        $npxPath = Join-Path $installDirectory 'npx.cmd'
        if (-not (Test-Path -LiteralPath $npmPath -PathType Leaf)) {
            $reasons.Add('npm-missing-beside-node')
            continue
        }
        if (-not (Test-Path -LiteralPath $npxPath -PathType Leaf)) {
            $reasons.Add('npx-missing-beside-node')
            continue
        }

        $nodeProbe = $null
        try {
            $nodeProbe = Invoke-IipsProcess -FilePath $nodePath -Arguments '--version' -TimeoutMilliseconds $script:IipsVersionProbeTimeoutMilliseconds
        }
        catch {
            $reasons.Add('node-version-probe-failed')
            continue
        }
        if ($nodeProbe.ExitCode -ne 0) {
            $reasons.Add('node-version-probe-nonzero')
            continue
        }

        $nodeVersion = $nodeProbe.StdOut.Trim()
        if ([string]::IsNullOrWhiteSpace($nodeVersion)) {
            $reasons.Add('node-version-empty')
            continue
        }
        if (-not (Test-IipsNodeVersionAtOrAboveFloor -Version $nodeVersion)) {
            $reasons.Add('node-version-below-floor')
            continue
        }

        # The shims are batch files: cmd.exe /d /s /c through the bounded runner, never a direct
        # start (CreateProcess cannot execute a .cmd) and never as an npm/npx discovery mechanism.
        $npmProbe = $null
        try {
            $npmProbe = Invoke-IipsCmdShim -ShimPath $npmPath -Arguments @('--version') -TimeoutMilliseconds $script:IipsVersionProbeTimeoutMilliseconds
        }
        catch {
            $reasons.Add('npm-version-probe-failed')
            continue
        }
        if ($npmProbe.ExitCode -ne 0) {
            $reasons.Add('npm-version-probe-nonzero')
            continue
        }
        $npmVersion = $npmProbe.StdOut.Trim()
        if ([string]::IsNullOrWhiteSpace($npmVersion)) {
            $reasons.Add('npm-version-empty')
            continue
        }

        $npxProbe = $null
        try {
            $npxProbe = Invoke-IipsCmdShim -ShimPath $npxPath -Arguments @('--version') -TimeoutMilliseconds $script:IipsVersionProbeTimeoutMilliseconds
        }
        catch {
            $reasons.Add('npx-version-probe-failed')
            continue
        }
        if ($npxProbe.ExitCode -ne 0) {
            $reasons.Add('npx-version-probe-nonzero')
            continue
        }
        $npxVersion = $npxProbe.StdOut.Trim()
        if ([string]::IsNullOrWhiteSpace($npxVersion)) {
            $reasons.Add('npx-version-empty')
            continue
        }

        # This installation first on PATH for every child process, so the internal `node` lookup
        # performed by the npm/npx shims resolves to the runtime resolved here.
        $env:PATH = $installDirectory + [System.IO.Path]::PathSeparator + $env:PATH

        Write-IipsOk "node.exe : $nodePath ($nodeVersion)"
        Write-IipsOk "npm.cmd  : $npmPath ($npmVersion)"
        Write-IipsOk "npx.cmd  : $npxPath ($npxVersion)"
        Write-IipsInfo 'single-installation check: VERIFIED (same directory, bounded probes)'

        return [pscustomobject]@{
            NodeExe     = $nodePath
            NpmCmd      = $npmPath
            NpxCmd      = $npxPath
            NodeDir     = $installDirectory
            InstallRoot = $installDirectory
            NodeVersion = $nodeVersion
            NpmVersion  = $npmVersion
        }
    }

    $reasonText = 'no-candidate'
    if ($reasons.Count -gt 0) { $reasonText = (@($reasons | Select-Object -Unique) -join ', ') }
    throw ('NODE_TOOLCHAIN_NOT_RESOLVED: no Node.js installation with node.exe, npm.cmd and npx.cmd in one directory could be verified ({0}). Node.js >= {1}.{2}.{3} is required (flag-free node:sqlite). Pass -NodeExecutable with the full path to node.exe.' -f $reasonText, $script:IipsMinimumNodeMajor, $script:IipsMinimumNodeMinor, $script:IipsMinimumNodePatch)
}


# ----------------------------------------------------------------------------------------------
# Command invocation
# ----------------------------------------------------------------------------------------------
<#
.SYNOPSIS
    Facts about a failed process creation, with no path, no arguments and no payload.

.DESCRIPTION
    `Process.Start()` throws `System.ComponentModel.Win32Exception` and the native code is the
    only thing that distinguishes "the image is missing" from "access denied" from "invalid
    command line". That code was previously discarded by a bare `catch { $started = $false }`,
    which left the caller with an opaque PROCESS_START_FAILED and no evidence. It is reported
    here as `win32=<code> (<category>)`, or `type=<ExceptionType>` when no native code exists.

    Deliberately NOT included: the executable path, the argument line, the stdin payload, or the
    exception message (a message can carry a path).
#>
function Get-IipsStartFailureDetail {
    param(
        [Parameter(Mandatory = $false)]
        $ErrorRecord = $null
    )

    if ($null -eq $ErrorRecord) {
        return 'the operating system reported no process (Process.Start() returned false)'
    }

    $exception = $ErrorRecord.Exception
    if ($null -eq $exception) { return 'the failure carried no exception object' }
    if ($null -ne $exception.InnerException) { $exception = $exception.InnerException }

    $nativeProperty = $exception.PSObject.Properties['NativeErrorCode']
    if ($null -ne $nativeProperty) {
        $code = [int] $nativeProperty.Value
        return ('win32={0} ({1})' -f $code, (Get-IipsWin32Reason -Code $code))
    }

    return ('type=' + $exception.GetType().Name)
}

<#
.SYNOPSIS
    A fixed category for the Win32 codes that process creation actually produces.
#>
function Get-IipsWin32Reason {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Code
    )

    if ($Code -eq 2) { return 'file-not-found' }
    if ($Code -eq 3) { return 'path-not-found' }
    if ($Code -eq 5) { return 'access-denied' }
    if ($Code -eq 87) { return 'invalid-parameter' }
    if ($Code -eq 193) { return 'not-a-valid-application' }
    if ($Code -eq 206) { return 'filename-too-long' }
    if ($Code -eq 267) { return 'invalid-directory' }
    if ($Code -eq 740) { return 'elevation-required' }
    return 'unclassified'
}

<#
.SYNOPSIS
    Runs a native executable with bounded execution and captures stdout and stderr SEPARATELY.

.DESCRIPTION
    PowerShell 5.1 compatible. `System.Diagnostics.Process` with UseShellExecute = $false is used
    directly, never Start-Process -Wait and never `& $exe 2>&1 | ...`:

    * Start-Process -Wait waits for the ENTIRE process tree and has no timeout. That is what hung
      toolchain discovery at `[01-preconditions]`: a shim that leaves a grandchild behind blocks
      the wait forever, and there is nothing to interrupt it.
    * Under $ErrorActionPreference = 'Stop', merging stderr into the pipeline turns every stderr
      line into an ErrorRecord and the first one terminates the caller.

    Both streams are read ASYNCHRONOUSLY and BOTH reads start before the wait. Draining one stream
    while the child fills the other is the classic pipe deadlock: a child that writes more than
    one pipe buffer of stderr while stdout is being read blocks forever, and the reverse.

    A child that exceeds its timeout is KILLED, and the failure is reported as PROCESS_TIMEOUT. A
    child that cannot start is PROCESS_START_FAILED. Neither message carries the child's output,
    its arguments, or the stdin payload: none of those may reach a log.

    Resource disposal is explicit on both the success and the failure path. The repository forbids
    `finally`, so the body is wrapped in try/catch and the process is disposed once afterwards.

.PARAMETER StandardInput
    Payload written to the child's stdin, which is then CLOSED so a child that reads to end-of-file
    (the W-02 harness does exactly that) is released. Passing this parameter is the only way data
    reaches a child: never argv, never a temporary file. The payload is never echoed, logged, or
    placed in an exception message.

.OUTPUTS
    [pscustomobject] with ExitCode, StdOut, StdErr, StdErrByteLength, TimedOut, StdinFailed, DurationMs
#>
function Invoke-IipsProcess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $FilePath,

        [Parameter(Mandatory = $false)]
        [string] $Arguments = '',

        [Parameter(Mandatory = $false)]
        [string] $WorkingDirectory = '',

        [Parameter(Mandatory = $false)]
        [ValidateRange(1, 600000)]
        [int] $TimeoutMilliseconds = 15000,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [string] $StandardInput = ''
    )

    if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
        throw 'PROCESS_EXECUTABLE_NOT_FOUND: the executable does not exist at the explicit path given.'
    }

    $wantsStdin = $PSBoundParameters.ContainsKey('StandardInput')

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = $Arguments
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.RedirectStandardInput = $wantsStdin
    if ($WorkingDirectory.Length -gt 0) { $startInfo.WorkingDirectory = $WorkingDirectory }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo

    $startedUtc = [DateTime]::UtcNow
    $failure = $null
    $result = $null
    $stdinFailed = $false

    try {
        $started = $false
        $startError = $null
        try { $started = $process.Start() }
        catch {
            $started = $false
            $startError = $_
        }
        if (-not $started) {
            throw ('PROCESS_START_FAILED: {0}' -f (Get-IipsStartFailureDetail -ErrorRecord $startError))
        }

        # Begin BOTH reads immediately, before waiting. Waiting first can deadlock on a full pipe.
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()

        if ($wantsStdin) {
            try {
                $process.StandardInput.Write($StandardInput)
                $process.StandardInput.Close()
            }
            catch {
                # The child may have exited before reading its stdin. That is recorded, not hidden:
                # the exit code and the captured streams remain authoritative.
                $stdinFailed = $true
            }
        }

        $completed = $process.WaitForExit($TimeoutMilliseconds)
        if (-not $completed) {
            try {
                $process.Kill()
                $process.WaitForExit()
            }
            catch {
                # Kill can fail if the child exited between the timeout and the kill. The timeout
                # remains the primary failure.
                $null = $_.Exception.Message
            }
            throw ('PROCESS_TIMEOUT: the child process exceeded {0} ms and was terminated.' -f $TimeoutMilliseconds)
        }

        # The child has exited, but a grandchild that inherited the pipe handles can keep a read
        # open. Waiting for the reads without a bound would reintroduce exactly the hang this
        # runner exists to remove, so completion is bounded too.
        $stdoutReady = $stdoutTask.Wait(5000)
        $stderrReady = $stderrTask.Wait(5000)
        if (-not $stdoutReady -or -not $stderrReady) {
            throw 'PROCESS_OUTPUT_INCOMPLETE: the child exited but its output pipes were still held open (a descendant process most likely inherited them).'
        }

        $stdout = [string] $stdoutTask.GetAwaiter().GetResult()
        $stderr = [string] $stderrTask.GetAwaiter().GetResult()

        $result = [pscustomobject]@{
            ExitCode         = [int] $process.ExitCode
            StdOut           = $stdout
            StdErr           = $stderr
            StdErrByteLength = [int] [System.Text.Encoding]::UTF8.GetByteCount($stderr)
            TimedOut         = $false
            StdinFailed      = $stdinFailed
            DurationMs       = [int] (([DateTime]::UtcNow - $startedUtc).TotalMilliseconds)
        }
    }
    catch {
        $failure = $_
    }

    $process.Dispose()

    if ($null -ne $failure) { throw $failure }
    return $result
}

<#
.SYNOPSIS
    Quotes one argument vector for a Win32 command line (CommandLineToArgvW rules).

.NOTES
    Every backslash that precedes a quote is doubled, inner quotes are escaped, and the token is
    wrapped in quotes when it contains whitespace or a quote. No secret is ever placed on a
    command line by this repository; this exists so that PATHS with spaces survive intact.
#>
function Get-IipsQuotedArguments {
    param(
        [Parameter(Mandatory = $false)]
        [string[]] $Arguments = @()
    )

    $tokens = New-Object System.Collections.Generic.List[string]
    foreach ($argument in $Arguments) {
        $token = [string] $argument
        if ($token.Length -eq 0) {
            $tokens.Add('""')
            continue
        }
        if ($token -notmatch '[\s"]') {
            $tokens.Add($token)
            continue
        }

        $builder = New-Object System.Text.StringBuilder
        [void] $builder.Append('"')
        $backslashes = 0
        foreach ($character in $token.ToCharArray()) {
            if ($character -eq '\') {
                $backslashes = $backslashes + 1
                continue
            }
            if ($character -eq '"') {
                [void] $builder.Append(('\' * (($backslashes * 2) + 1)))
                [void] $builder.Append('"')
                $backslashes = 0
                continue
            }
            if ($backslashes -gt 0) {
                [void] $builder.Append(('\' * $backslashes))
                $backslashes = 0
            }
            [void] $builder.Append($character)
        }
        if ($backslashes -gt 0) { [void] $builder.Append(('\' * ($backslashes * 2))) }
        [void] $builder.Append('"')
        $tokens.Add($builder.ToString())
    }

    return ($tokens -join ' ')
}

<#
.SYNOPSIS
    Runs a .cmd / .bat shim through cmd.exe with bounded execution.

.DESCRIPTION
    A batch shim is not a valid CreateProcess target when UseShellExecute = $false, so it is
    invoked as `cmd.exe /d /s /c "<shim>" <args>`. `/d` skips AutoRun commands and `/s` makes cmd
    strip exactly the outer quotes, which is what allows a quoted shim path containing spaces.
    This is the ONLY place a shim is started, and it is started by explicit absolute path.
#>
function Invoke-IipsCmdShim {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $ShimPath,

        [Parameter(Mandatory = $false)]
        [string[]] $Arguments = @(),

        [Parameter(Mandatory = $false)]
        [string] $WorkingDirectory = '',

        [Parameter(Mandatory = $false)]
        [ValidateRange(1, 600000)]
        [int] $TimeoutMilliseconds = 15000
    )

    $cmdExe = Join-Path $env:SystemRoot 'System32\cmd.exe'
    if (-not (Test-Path -LiteralPath $cmdExe -PathType Leaf)) {
        $comspec = [string] $env:ComSpec
        if ([string]::IsNullOrWhiteSpace($comspec)) {
            throw 'CMD_EXE_NOT_FOUND: cmd.exe could only be located through SystemRoot or ComSpec, and neither is usable.'
        }
        $cmdExe = $comspec
    }

    $inner = '"' + $ShimPath + '"'
    foreach ($argument in $Arguments) {
        $inner = $inner + ' ' + (Get-IipsQuotedArguments -Arguments @([string] $argument))
    }

    $commandLine = '/d /s /c "' + $inner + '"'
    return Invoke-IipsProcess -FilePath $cmdExe -Arguments $commandLine -WorkingDirectory $WorkingDirectory -TimeoutMilliseconds $TimeoutMilliseconds
}

<#
.SYNOPSIS
    Runs a native executable by explicit path and returns its exit code with stdout and stderr
    captured SEPARATELY.

.DESCRIPTION
    Thin compatibility wrapper over Invoke-IipsProcess: same bounded execution, same asynchronous
    stream capture, same timeout kill. Nothing is written to a temporary file any more, so a child
    that emits sensitive data cannot leave it on disk - a property the acceptance launcher depends
    on for its stdin-only secret delivery.

    Kept under this name because every setup script calls it, and because its four-field result
    (ExitCode / StdOut / StdErr / Combined) is the shape those scripts consume.

.PARAMETER TempRoot
    Accepted for call-site compatibility only. No temporary files are created.
#>
function Invoke-IipsCapture {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Executable,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments,

        [Parameter(Mandatory = $false)]
        [string] $WorkingDirectory = '',

        [Parameter(Mandatory = $false)]
        [string] $TempRoot = '',

        [Parameter(Mandatory = $false)]
        [ValidateRange(1, 600000)]
        [int] $TimeoutMilliseconds = 600000
    )

    if (-not (Test-Path -LiteralPath $Executable -PathType Leaf)) {
        throw "executable not found at the explicit path '$Executable'. A bare command name is never resolved for IIPS setup."
    }

    $isBatch = $false
    if ($Executable -match '\.(cmd|bat)$') { $isBatch = $true }

    $captured = $null
    if ($isBatch) {
        $captured = Invoke-IipsCmdShim -ShimPath $Executable -Arguments $Arguments -WorkingDirectory $WorkingDirectory -TimeoutMilliseconds $TimeoutMilliseconds
    }
    if (-not $isBatch) {
        $captured = Invoke-IipsProcess -FilePath $Executable -Arguments (Get-IipsQuotedArguments -Arguments $Arguments) -WorkingDirectory $WorkingDirectory -TimeoutMilliseconds $TimeoutMilliseconds
    }

    $stdout = [string] $captured.StdOut
    $stderr = [string] $captured.StdErr

    return [pscustomobject]@{
        ExitCode = [int] $captured.ExitCode
        StdOut   = $stdout.Trim()
        StdErr   = $stderr.Trim()
        Combined = (($stdout + "`n" + $stderr).Trim())
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
