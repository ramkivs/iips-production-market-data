#Requires -Version 5.1
<#
.SYNOPSIS
    Provisions the three IRR identity source files on the Windows host from the governed IPD P04
    security master, and checks that the running IRR transport loads them.

.DESCRIPTION
    Runs the tracked tool scripts\provision-irr-identity-sources.mjs of THIS checkout in four steps
    and stops at the first step that does not pass.

      1. generate   Export the P04 master into eligible-roster.json, listing-map.json and
                    corporate-actions.json in a staging directory. Master records that cannot be
                    exported faithfully are withheld and counted. Nothing is written until the
                    withheld count is acknowledged exactly with -AcceptWithheld.
      2. validate   Run the IRR checkout's own loader and resolver on the staged files.
      3. install    Copy the staged files into <RuntimeRoot>\iips-data\investment\identity. The
                    data directory must already exist. Different existing identity files are
                    refused unless -Replace is given, and are then copied into the staging
                    directory first.
      4. endpoint   Ask the running IRR transport whether it loads the identity sources. With
                    -PortfolioId it also reports how many holdings resolved, as counts.

    The run is idempotent. A second run with the same inputs produces the same bytes, reports
    ALREADY_INSTALLED and repeats the endpoint check.

    WHAT IT CHANGES. It writes the staging directory (default <RuntimeRoot>\identity-provisioning)
    and the identity directory. It changes no repository, no configuration, no environment
    variable, and starts, stops or restarts no service. IRR reads the identity files on every
    request, so no restart is needed.

    WHAT IT DOES NOT DO. It installs nothing that the IRR loader has not accepted. It does not
    make holdings resolve: a holding resolves only when it carries an ISIN or an exchange and
    symbol, and IRR passes that identifier to its resolver.

    SANITIZED OUTPUT. Result words, counts, the three fixed file names, SHA-256 digests, commit
    identifiers and withheld master records (public reference data). No path, no portfolio
    identifier, no holding. The one exception is -ListUncovered, which prints on the console the
    ISINs of the list given with -RequiredIsinsPath that the roster does not cover; they are
    written to no file.

    EXIT CODES
      0  PASS        installed (or already installed) and the running transport loads the files
      1  FAIL        a step refused; the reason is printed
      2  NOT RUN     a precondition is not met; nothing was changed
      3  INCOMPLETE  an acknowledgement is required, or the files are installed but the running
                     transport could not be asked

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-IrrIdentityProvisioning.ps1 -AcceptWithheld 2
#>
[CmdletBinding()]
param(
    # The defaults are those of the tracked launcher windows-setup\03-Start-IipsServers.ps1.
    [ValidateNotNullOrEmpty()][string] $InstallRoot = 'H:\IIPS',
    [string] $RuntimeRoot = '',
    [string] $IrrRoot = '',
    [string] $StagingRoot = '',
    [string] $NodeExecutable = '',
    [ValidateRange(-1, 100000)][int] $AcceptWithheld = -1,
    [string] $RequiredIsinsPath = '',
    [ValidateRange(-1, 100000)][int] $AcceptUncovered = -1,
    [switch] $ListUncovered,
    [switch] $Replace,
    [ValidateRange(1, 65535)][int] $TransportPort = 8787,
    [ValidateNotNullOrEmpty()][string] $BindAddress = '127.0.0.1',
    [ValidatePattern('^$|^[A-Za-z0-9._-]{1,128}$')][string] $PortfolioId = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Any error the steps below do not handle themselves ends the run here, with its type only.
trap {
    Write-Host ('RESULT: FAIL - unexpected script error ({0})' -f $_.Exception.GetType().Name)
    exit 1
}

$AbsentPortfolioProbeId = 'PROBE-ABSENT-PORTFOLIO-DO-NOT-CREATE'
$PathLabels = @(
    'report', 'identity files', 'gate record', 'identity directory', 'receipt',
    'previous files copied to', 'record (counts only)'
)

function Write-Step {
    param([string] $Text)
    Write-Host ''
    Write-Host ('== {0}' -f $Text) -ForegroundColor Cyan
}

function Stop-NotRun {
    param([string] $Reason)
    Write-Host ('RESULT: NOT RUN - {0}. Nothing was changed.' -f $Reason) -ForegroundColor Yellow
    exit 2
}

# One command-line argument, quoted for the Windows C runtime rules when it needs quoting.
function ConvertTo-Argument {
    param([string] $Value)
    if ($Value -match '^[A-Za-z0-9_.:=\\/-]+$') { return $Value }
    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    $escaped = $escaped -replace '(\\+)$', '$1$1'
    return ('"{0}"' -f $escaped)
}

# Bounded child process: both streams read asynchronously, reads started before the wait, the
# wait bounded, a timed-out child killed. ExitCode is -1 when the process could not be run.
function Invoke-BoundedProcess {
    param([string] $FilePath, [string[]] $ArgumentList, [string] $WorkingDirectory, [int] $TimeoutMilliseconds)
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = (@($ArgumentList | ForEach-Object { ConvertTo-Argument $_ }) -join ' ')
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $startInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    $child = New-Object System.Diagnostics.Process
    $child.StartInfo = $startInfo
    $result = @{ ExitCode = -1; Output = ''; TimedOut = $false }
    try {
        $null = $child.Start()
        $stdoutTask = $child.StandardOutput.ReadToEndAsync()
        $stderrTask = $child.StandardError.ReadToEndAsync()
        $finished = $child.WaitForExit($TimeoutMilliseconds)
        if (-not $finished) {
            $child.Kill()
            $result.TimedOut = $true
        }
        if ($finished) {
            $stdoutReady = $stdoutTask.Wait(5000)
            $stderrReady = $stderrTask.Wait(5000)
            if ($stdoutReady -and $stderrReady) {
                $result.Output = [string] $stdoutTask.GetAwaiter().GetResult()
                $result.ExitCode = [int] $child.ExitCode
            }
        }
    }
    catch { $result.ExitCode = -1 }
    try { $child.Dispose() }
    catch { $null = $_ }
    return $result
}

# Prints the tool's lines. A line that carries a path keeps its label and loses the path.
function Write-ToolOutput {
    param([string] $Output)
    foreach ($line in @($Output -split "`r?`n")) {
        if ($line.Trim().Length -eq 0) { continue }
        $shown = $line
        foreach ($label in $PathLabels) {
            $prefix = $label + ': '
            if ($line.StartsWith($prefix) -and ($line -ne 'identity files: none written')) { $shown = $prefix + '(path not shown)' }
        }
        $shown = $shown -replace '[A-Za-z]:\\[^\s"]*', '(path not shown)'
        Write-Host ('   ' + $shown)
    }
}

function Invoke-Tool {
    param([string[]] $ToolArguments, [int] $TimeoutMilliseconds)
    $all = @($script:ToolPath) + $ToolArguments
    $run = Invoke-BoundedProcess -FilePath $script:NodePath -ArgumentList $all -WorkingDirectory $script:IpdRoot -TimeoutMilliseconds $TimeoutMilliseconds
    Write-ToolOutput $run.Output
    if ($run.TimedOut) { Write-Host '   the step did not finish within its time limit and was stopped' }
    return [int] $run.ExitCode
}

# GET that returns the status and the body for error statuses too.
function Invoke-LoopbackGet {
    param([string] $Url)
    $response = $null
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = 'GET'
        $request.Timeout = 60000
        $request.ReadWriteTimeout = 60000
        $request.Accept = 'application/json'
        $response = $request.GetResponse()
    }
    catch {
        $failure = $_.Exception
        while (($null -ne $failure) -and (-not ($failure -is [System.Net.WebException]))) { $failure = $failure.InnerException }
        if ($null -ne $failure) { $response = $failure.Response }
    }
    if ($null -eq $response) { return @{ Status = 0; Body = '' } }

    $status = 0
    $body = ''
    try {
        $status = [int] $response.StatusCode
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
    }
    catch { $body = '' }
    try { $response.Close() }
    catch { $null = $_ }
    return @{ Status = $status; Body = $body }
}

# ---------- preconditions ----------------------------------------------------------------------
Write-Host 'IRR identity-source provisioning (sanitized output)'
if ($PSVersionTable.PSVersion.Major -eq 6) { Stop-NotRun 'run this in Windows PowerShell 5.1 or in PowerShell 7' }
if (@('127.0.0.1', 'localhost') -notcontains $BindAddress) { Stop-NotRun 'the transport address must be a loopback address' }

if ($RuntimeRoot.Length -eq 0) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
if ($IrrRoot.Length -eq 0) { $IrrRoot = Join-Path $InstallRoot 'iips-review-recovered' }
if ($StagingRoot.Length -eq 0) { $StagingRoot = Join-Path $RuntimeRoot 'identity-provisioning' }
$dataDir = Join-Path $RuntimeRoot 'iips-data'
$script:IpdRoot = Split-Path -Parent $PSScriptRoot
$script:ToolPath = Join-Path $PSScriptRoot 'provision-irr-identity-sources.mjs'
$script:NodePath = $NodeExecutable

Write-Step 'Preconditions'
if (-not (Test-Path -LiteralPath $script:ToolPath -PathType Leaf)) { Stop-NotRun 'the provisioning tool is not beside this script' }
$builtModule = Join-Path $script:IpdRoot 'dist\src\identity\irr_identity_provisioning.js'
if (-not (Test-Path -LiteralPath $builtModule -PathType Leaf)) { Stop-NotRun 'this IPD checkout is not built (run npm.cmd ci, then npm.cmd run build:tsc, in it)' }
$irrRunner = Join-Path $IrrRoot 'frontend\node_modules\tsx\dist\cli.mjs'
if (-not (Test-Path -LiteralPath $irrRunner -PathType Leaf)) { Stop-NotRun 'the IRR checkout or its installed frontend packages were not found' }
if (-not (Test-Path -LiteralPath $dataDir -PathType Container)) { Stop-NotRun 'the runtime data directory does not exist (the launcher creates it; start the services once)' }
if ($script:NodePath.Length -eq 0) {
    $onPath = @(Get-Command 'node.exe' -CommandType Application -ErrorAction SilentlyContinue)
    if ($onPath.Count -gt 0) { $script:NodePath = [string] $onPath[0].Path }
}
if (($script:NodePath.Length -eq 0) -or (-not (Test-Path -LiteralPath $script:NodePath -PathType Leaf))) { Stop-NotRun 'node.exe was not found (pass -NodeExecutable)' }
if (($RequiredIsinsPath.Length -gt 0) -and (-not (Test-Path -LiteralPath $RequiredIsinsPath -PathType Leaf))) { Stop-NotRun 'the required-ISIN list was not found' }
Write-Host '   tool, IPD build, IRR checkout, runtime data directory and node.exe: found'

# ---------- 1. generate ------------------------------------------------------------------------
Write-Step 'Step 1 of 4: generate from the P04 security master'
$generateArguments = @('generate', '--staging', $StagingRoot)
if ($AcceptWithheld -ge 0) { $generateArguments += @('--accept-withheld', [string] $AcceptWithheld) }
if ($RequiredIsinsPath.Length -gt 0) { $generateArguments += @('--required-isins', $RequiredIsinsPath) }
if ($AcceptUncovered -ge 0) { $generateArguments += @('--accept-uncovered', [string] $AcceptUncovered) }
if ($ListUncovered) { $generateArguments += '--list-uncovered' }
$generateExit = Invoke-Tool -ToolArguments $generateArguments -TimeoutMilliseconds 180000
if ($generateExit -eq 3) {
    Write-Host ''
    Write-Host 'RESULT: INCOMPLETE - no identity file was written. Review the counts above; to proceed with them, run again and state each number exactly (-AcceptWithheld <n>, -AcceptUncovered <n>).' -ForegroundColor Yellow
    exit 3
}
if ($generateExit -eq 64) { Stop-NotRun 'the tool refused to start (a missing or stale IPD build is the usual reason: run npm.cmd run build:tsc in this checkout)' }
if ($generateExit -ne 0) {
    Write-Host ''
    Write-Host ('RESULT: FAIL - generation was refused (tool exit code {0}). No identity file was written.' -f $generateExit) -ForegroundColor Red
    exit 1
}

# ---------- 2. validate ------------------------------------------------------------------------
Write-Step 'Step 2 of 4: validate with the loader and resolver of the IRR checkout'
$validateExit = Invoke-Tool -ToolArguments @('validate', '--staging', $StagingRoot, '--irr-root', $IrrRoot) -TimeoutMilliseconds 600000
if ($validateExit -ne 0) {
    Write-Host ''
    Write-Host ('RESULT: FAIL - the IRR loader gate did not accept the staged files (tool exit code {0}). Nothing was installed.' -f $validateExit) -ForegroundColor Red
    exit 1
}

# ---------- 3. install -------------------------------------------------------------------------
Write-Step 'Step 3 of 4: install into the runtime data directory'
$installArguments = @('install', '--staging', $StagingRoot, '--data-dir', $dataDir)
if ($Replace) { $installArguments += '--replace' }
$installExit = Invoke-Tool -ToolArguments $installArguments -TimeoutMilliseconds 180000
if ($installExit -ne 0) {
    Write-Host ''
    Write-Host ('RESULT: FAIL - installation was refused (tool exit code {0}). The reason is on the RESULT line above.' -f $installExit) -ForegroundColor Red
    exit 1
}

# ---------- 4. endpoint ------------------------------------------------------------------------
Write-Step 'Step 4 of 4: the running IRR transport'
$base = 'http://{0}:{1}' -f $BindAddress, $TransportPort
$health = Invoke-LoopbackGet ($base + '/api/health')
if ($health.Status -ne 200) {
    Write-Host ('   GET /api/health returned status {0}' -f $health.Status)
    Write-Host ''
    Write-Host 'RESULT: INCOMPLETE - the files are installed, but the IRR transport did not answer, so it could not be asked. Start the services and run this again; it will report ALREADY_INSTALLED and repeat this step.' -ForegroundColor Yellow
    exit 3
}
# The route loads the identity files before it reads any portfolio, so an absent portfolio is
# enough to learn whether the running process loads them.
$probe = Invoke-LoopbackGet ($base + '/api/investment/portfolio/' + $AbsentPortfolioProbeId + '/identities')
$refused = ($probe.Status -eq 503) -and ($probe.Body -match '"identity-sources-unavailable"')
$loaded = ($probe.Status -eq 200) -or (($probe.Status -eq 503) -and ($probe.Body -match '"holdings-unavailable"'))
Write-Host ('   absent-portfolio probe: status {0}; identity sources refused: {1}; identity sources loaded: {2}' -f $probe.Status, $refused.ToString().ToLowerInvariant(), $loaded.ToString().ToLowerInvariant())
if ($refused) {
    Write-Host ''
    Write-Host 'RESULT: FAIL - the files are installed in the launcher data directory, but the running transport still reports its identity sources unavailable. It reads another directory or refuses the files. Run Test-IrrIdentitySources.ps1 for the cause.' -ForegroundColor Red
    exit 1
}
if (-not $loaded) {
    Write-Host ''
    Write-Host 'RESULT: FAIL - the identities route gave an answer this script does not recognise. Run Test-IrrIdentitySources.ps1.' -ForegroundColor Red
    exit 1
}
if ($PortfolioId.Length -gt 0) {
    Write-Host '   holdings of the given portfolio, as counts:'
    $verifyExit = Invoke-Tool -ToolArguments @('verify-endpoint', '--staging', $StagingRoot, '--portfolio-id', $PortfolioId, '--base-url', $base) -TimeoutMilliseconds 180000
    if ($verifyExit -ne 0) {
        Write-Host ''
        Write-Host ('RESULT: FAIL - the identities route did not answer for the given portfolio from the installed roster (tool exit code {0}).' -f $verifyExit) -ForegroundColor Red
        exit 1
    }
}

Write-Host ''
Write-Host 'RESULT: PASS - the identity files are installed and the running IRR transport loads them.' -ForegroundColor Green
Write-Host 'PASS does not mean that holdings resolved. Run again with -PortfolioId <id> for the counts.'
exit 0
