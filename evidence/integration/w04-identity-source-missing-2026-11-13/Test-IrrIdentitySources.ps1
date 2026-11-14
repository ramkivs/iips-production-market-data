#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only diagnostic for HTTP 503 IDENTITY_SOURCE_MISSING on the IRR route
    GET /api/investment/portfolio/<portfolioId>/identities.

.DESCRIPTION
    Run it on the Windows host while the IIPS services are running. It answers four questions.

      1. Which identity directory did the RUNNING IRR transport resolve?
         IRR main (08411bc) names that directory in issues[].subject of the 503 body. The script
         reads it from the response, uses it, and never prints it.
      2. Is that the directory the tracked launcher configures (IIPS_DATA_DIR =
         <RuntimeRoot>\iips-data), or the working-directory default the loader falls back to
         when IIPS_DATA_DIR is not set in the process (.iips-data under the IRR frontend)?
      3. Are the three mandatory files there, readable, JSON, and of schema
         IIPS_INVESTMENT_IDENTITY_V1?
      4. Does IRR's own loader accept them? This runs the tracked read-only readiness CLI
         (frontend\server\investment\cli\iid-readiness.ts) and reads only its identity-files
         finding. It runs only when all three files passed question 3.

    READ-ONLY. The script sends two HTTP GET requests to the loopback transport and reads files.
    It writes no file, sets no environment variable, changes no configuration, and starts, stops
    or restarts no service. Question 4 starts one short-lived Node.js process with the TypeScript
    runner cache disabled, so that it writes nothing either.

    The default portfolio id is the absent-portfolio probe id that IRR's tracked diagnostic
    tools\windows\diagnose-personal-portfolio.ps1 already uses. The route loads the identity
    files before it reads any portfolio, so no real portfolio id is needed.

    SANITIZED OUTPUT. Status words, counts, the three fixed file names, bounded codes, yes/no
    answers, file sizes and SHA-256 digests of the identity files. No path, no response body, no
    portfolio id, no holding, no ISIN, no environment value.

    EXIT CODES
      0  PASS          the identity sources load in the running transport
      1  FAIL          a cause was identified (see ROOT CAUSE)
      2  INCONCLUSIVE  the transport was not reachable, or the cause could not be determined

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-IrrIdentitySources.ps1

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-IrrIdentitySources.ps1 -InstallRoot D:\IIPS -TransportPort 8787
#>
[CmdletBinding()]
param(
    # The defaults are those of the tracked launcher windows-setup\03-Start-IipsServers.ps1.
    [ValidateNotNullOrEmpty()][string] $InstallRoot = 'H:\IIPS',
    [string] $RuntimeRoot = '',
    [string] $LogRoot = '',
    [ValidateRange(1, 65535)][int] $TransportPort = 8787,
    [ValidateNotNullOrEmpty()][string] $BindAddress = '127.0.0.1',
    [ValidatePattern('^[A-Za-z0-9._-]{1,128}$')][string] $PortfolioId = 'PROBE-ABSENT-PORTFOLIO-DO-NOT-CREATE',
    [switch] $SkipLoaderValidation
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Any error the checks below do not handle themselves ends the run here, with its type only.
trap {
    Write-Host ('RESULT: INCONCLUSIVE - unexpected script error ({0})' -f $_.Exception.GetType().Name)
    exit 2
}

$IdentitySchema = 'IIPS_INVESTMENT_IDENTITY_V1'
$IdentityFiles = @(
    @{ Name = 'eligible-roster.json'; Arrays = @('issuers', 'securities') },
    @{ Name = 'listing-map.json'; Arrays = @('entries') },
    @{ Name = 'corporate-actions.json'; Arrays = @('actions') }
)
$script:Counts = @{ PASS = 0; FAIL = 0; WARN = 0; INFO = 0; SKIP = 0 }

# ---------- output -----------------------------------------------------------------------------
function Write-Check {
    param([string] $Status, [string] $Id, [string] $Text)
    $script:Counts[$Status] = $script:Counts[$Status] + 1
    $colour = 'Gray'
    if ($Status -eq 'PASS') { $colour = 'Green' }
    if ($Status -eq 'FAIL') { $colour = 'Red' }
    if ($Status -eq 'WARN') { $colour = 'Yellow' }
    Write-Host ('[{0}] {1} - {2}' -f $Status, $Id, $Text) -ForegroundColor $colour
}

function ConvertTo-YesNo {
    param([bool] $Value)
    if ($Value) { return 'yes' }
    return 'no'
}

function Get-StatusWord {
    param([bool] $Good, [string] $WhenBad)
    if ($Good) { return 'PASS' }
    return $WhenBad
}

# Lets a value from a response or a child process reach the console only when it has the shape
# of a bounded code. Anything else is replaced, so no path or free text can be echoed.
function Protect-Token {
    param($Value, [string] $Pattern)
    if (($Value -is [string]) -and ($Value -cmatch $Pattern)) { return $Value }
    return 'unrecognised'
}

# ---------- JSON -------------------------------------------------------------------------------
# Objects come back as dictionaries and arrays as arrays, in Windows PowerShell 5.1 and in
# PowerShell 7 alike, without the 2 MB limit of the 5.1 ConvertFrom-Json. The leading comma keeps
# PowerShell from unrolling an array result, so ASSIGN the result; do not pipe it or wrap it.
function ConvertFrom-JsonText {
    param([string] $Text)
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        $modern = ConvertFrom-Json -InputObject $Text -AsHashtable -NoEnumerate
        return , $modern
    }
    Add-Type -AssemblyName System.Web.Extensions
    $serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $serializer.MaxJsonLength = [int]::MaxValue
    $classic = $serializer.DeserializeObject($Text)
    return , $classic
}

# Member access that never throws under strict mode. Same rule: assign the result.
function Get-JsonMember {
    param($Object, [string] $Name)
    if (-not ($Object -is [System.Collections.IDictionary])) { return $null }
    if (-not $Object.ContainsKey($Name)) { return $null }
    return , $Object[$Name]
}

# ---------- HTTP -------------------------------------------------------------------------------
# GET that returns the status and the body for error statuses too.
function Invoke-LoopbackGet {
    param([string] $Url)
    $response = $null
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = 'GET'
        $request.Timeout = 20000
        $request.ReadWriteTimeout = 20000
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

# ---------- paths ------------------------------------------------------------------------------
function Get-NormalizedPath {
    param([string] $Path)
    return [System.IO.Path]::GetFullPath($Path).TrimEnd([char[]] '\/')
}

function Test-SamePath {
    param([string] $Left, [string] $Right)
    return [string]::Equals((Get-NormalizedPath $Left), (Get-NormalizedPath $Right), [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-PresentFileCount {
    param([string] $Directory)
    $present = 0
    foreach ($file in $IdentityFiles) {
        if (Test-Path -LiteralPath (Join-Path $Directory $file.Name) -PathType Leaf) { $present = $present + 1 }
    }
    return $present
}

# ---------- processes --------------------------------------------------------------------------
function Get-ProcessRecord {
    param([int] $Id)
    $found = @()
    try { $found = @(Get-CimInstance -ClassName Win32_Process -Filter ('ProcessId = {0}' -f $Id) -ErrorAction Stop) }
    catch { $found = @() }
    if ($found.Count -eq 0) { return $null }
    return $found[0]
}

# The listener on a port. A real listener can be reported with a BLANK State on this host (the
# launcher library documents it), so the query does not filter on the state: an explicit Listen
# state qualifies, and so does a blank state with remote port 0.
function Get-ListenerProcessId {
    param([int] $Port)
    $rows = @()
    try { $rows = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop) }
    catch { return 0 }
    foreach ($row in $rows) {
        $state = ''
        try { $state = [string] $row.State }
        catch { $state = '' }
        $remotePort = -1
        try { $remotePort = [int] $row.RemotePort }
        catch { $remotePort = -1 }
        $isListener = ($state -eq 'Listen') -or (($state.Length -eq 0) -and ($remotePort -eq 0))
        if ($isListener) { return [int] $row.OwningProcess }
    }
    return 0
}

function Test-DescendsFrom {
    param([int] $ProcessId, [int] $AncestorId)
    $cursor = $ProcessId
    for ($hop = 0; $hop -lt 12; $hop = $hop + 1) {
        if ($cursor -eq $AncestorId) { return $true }
        $record = Get-ProcessRecord $cursor
        if ($null -eq $record) { return $false }
        $cursor = [int] $record.ParentProcessId
        if ($cursor -le 0) { return $false }
    }
    return $false
}

# PID recorded for irr-transport in the newest launcher PID manifest, or 0.
function Get-RecordedTransportPid {
    param([string] $Directory)
    try {
        $manifests = @(Get-ChildItem -LiteralPath $Directory -Filter 'iips-pids-*.json' -File -ErrorAction Stop | Sort-Object -Property Name -Descending)
        if ($manifests.Count -eq 0) { return 0 }
        $manifest = ConvertFrom-JsonText ([System.IO.File]::ReadAllText($manifests[0].FullName))
        $entries = Get-JsonMember $manifest 'processes'
        foreach ($entry in $entries) {
            $label = Get-JsonMember $entry 'label'
            if ($label -eq 'irr-transport') { return [int] (Get-JsonMember $entry 'pid') }
        }
        return 0
    }
    catch { return 0 }
}

# Bounded child process: both streams read asynchronously, reads started before the wait, the
# wait bounded, a timed-out child killed. Returns standard output, or $null on any failure.
function Invoke-BoundedProcess {
    param([string] $FilePath, [string] $Arguments, [string] $WorkingDirectory, [int] $TimeoutMilliseconds)
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = $Arguments
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $child = New-Object System.Diagnostics.Process
    $child.StartInfo = $startInfo
    $output = $null
    try {
        $null = $child.Start()
        $stdoutTask = $child.StandardOutput.ReadToEndAsync()
        $stderrTask = $child.StandardError.ReadToEndAsync()
        $finished = $child.WaitForExit($TimeoutMilliseconds)
        if (-not $finished) {
            $child.Kill()
            throw 'timeout'
        }
        $stdoutReady = $stdoutTask.Wait(5000)
        $stderrReady = $stderrTask.Wait(5000)
        if ($stdoutReady -and $stderrReady) { $output = [string] $stdoutTask.GetAwaiter().GetResult() }
    }
    catch { $output = $null }
    try { $child.Dispose() }
    catch { $null = $_ }
    return $output
}

# ---------- the checks -------------------------------------------------------------------------
# One identity file. Returns ABSENT, UNSOUND or SOUND.
function Test-IdentityFile {
    param([string] $Directory, [hashtable] $File)
    $name = $File.Name
    $path = Join-Path $Directory $name
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Check 'FAIL' $name 'absent'
        return 'ABSENT'
    }
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Write-Check 'FAIL' $name 'exists but is a directory, not a file'
        return 'ABSENT'
    }
    $bytes = $null
    try { $bytes = [System.IO.File]::ReadAllBytes($path) }
    catch { $bytes = $null }
    if ($null -eq $bytes) {
        Write-Check 'FAIL' $name 'present but could not be read by this user'
        return 'UNSOUND'
    }
    if ($bytes.Length -eq 0) {
        Write-Check 'FAIL' $name 'present, 0 bytes'
        return 'UNSOUND'
    }
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $digest = [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    $sha.Dispose()
    $facts = 'present, readable, {0} bytes, file SHA-256 {1}' -f $bytes.Length, $digest

    $hasMark = ($bytes.Length -ge 3) -and ($bytes[0] -eq 0xEF) -and ($bytes[1] -eq 0xBB) -and ($bytes[2] -eq 0xBF)
    if ($hasMark) {
        Write-Check 'FAIL' $name ($facts + '; starts with a UTF-8 byte-order mark, which the IRR loader refuses as INVALID_JSON')
        return 'UNSOUND'
    }
    $root = $null
    $parsedOk = $true
    try { $root = ConvertFrom-JsonText ([System.Text.Encoding]::UTF8.GetString($bytes)) }
    catch { $parsedOk = $false }
    if (-not $parsedOk) {
        Write-Check 'FAIL' $name ($facts + '; NOT valid JSON')
        return 'UNSOUND'
    }
    if (-not ($root -is [System.Collections.IDictionary])) {
        Write-Check 'FAIL' $name ($facts + '; JSON, but the top level is not an object')
        return 'UNSOUND'
    }
    $schema = Get-JsonMember $root 'schemaVersion'
    if ((-not ($schema -is [string])) -or ($schema -cne $IdentitySchema)) {
        Write-Check 'FAIL' $name ($facts + '; JSON, but schemaVersion is not ' + $IdentitySchema)
        return 'UNSOUND'
    }

    $parts = New-Object System.Collections.Generic.List[string]
    $thin = $false
    foreach ($arrayName in $File.Arrays) {
        $array = Get-JsonMember $root $arrayName
        $isArray = $array -is [System.Collections.IList]
        if ($isArray) { $parts.Add(('{0}: {1}' -f $arrayName, $array.Count)) }
        if (-not $isArray) { $parts.Add(('{0}: not an array' -f $arrayName)) }
        if (-not $isArray) { $thin = $true }
        if ($isArray -and ($array.Count -eq 0) -and ($arrayName -ne 'actions')) { $thin = $true }
    }
    Write-Check 'PASS' $name ($facts + '; JSON; schemaVersion ' + $IdentitySchema + '; ' + ($parts -join '; '))
    if ($thin) {
        Write-Check 'WARN' ($name + ' content') 'a required array is missing or empty: IRR PR #563 refuses that; IRR main can accept it as an empty source (the loader check is the authority)'
    }
    if ($name -eq 'eligible-roster.json') {
        $label = Get-JsonMember $root 'rosterLabel'
        $hasLabel = ($label -is [string]) -and ($label.Trim().Length -gt 0)
        $synthetic = $hasLabel -and ($label -match 'synthetic')
        $labelStatus = 'INFO'
        if ($synthetic -or (-not $hasLabel)) { $labelStatus = 'WARN' }
        Write-Check $labelStatus 'roster-label' ('rosterLabel present: {0}; label says synthetic, which gives data class SYNTHETIC_FIXTURE: {1}' -f (ConvertTo-YesNo $hasLabel), (ConvertTo-YesNo $synthetic))
    }
    return 'SOUND'
}

# IRR's own loader, through the tracked read-only readiness CLI. Returns the identity-files
# reason, or an empty string when the CLI was not run or gave no usable answer.
function Get-LoaderVerdict {
    param([string] $FrontendDirectory, [string] $DataRoot, [string] $NodePath, [int] $FilesSound)
    if ($SkipLoaderValidation) {
        Write-Check 'SKIP' 'loader-validation' 'skipped by -SkipLoaderValidation'
        return ''
    }
    if ($FilesSound -lt 3) {
        Write-Check 'SKIP' 'loader-validation' 'not run: the three files are not all present, readable and of the expected schema'
        return ''
    }
    $cli = Join-Path $FrontendDirectory 'server\investment\cli\iid-readiness.ts'
    $runner = Join-Path $FrontendDirectory 'node_modules\tsx\dist\cli.mjs'
    $ready = ($NodePath.Length -gt 0) -and (Test-Path -LiteralPath $cli -PathType Leaf) -and (Test-Path -LiteralPath $runner -PathType Leaf)
    if (-not $ready) {
        Write-Check 'SKIP' 'loader-validation' 'not run: Node.js, the TypeScript runner or the IRR readiness CLI was not found'
        return ''
    }
    $arguments = '"{0}" --no-cache "{1}" --json --data-dir "{2}"' -f $runner, $cli, $DataRoot
    $stdout = Invoke-BoundedProcess -FilePath $NodePath -Arguments $arguments -WorkingDirectory $FrontendDirectory -TimeoutMilliseconds 120000
    $reason = ''
    try {
        $report = ConvertFrom-JsonText $stdout
        $findings = Get-JsonMember $report 'findings'
        foreach ($finding in $findings) {
            $findingId = Get-JsonMember $finding 'id'
            if ($findingId -eq 'identity-files') { $reason = [string] (Get-JsonMember $finding 'reason') }
        }
    }
    catch { $reason = '' }
    if ($reason.Length -eq 0) {
        Write-Check 'WARN' 'loader-validation' 'the IRR readiness CLI could not be run, or its output could not be read'
        return ''
    }
    $shown = Protect-Token $reason '^[A-Z_]+( \([A-Za-z0-9_, ]+\))?$'
    Write-Check (Get-StatusWord ($reason -eq 'IDENTITY_SOURCES_VALID') 'FAIL') 'loader-validation' ('IRR loader result: {0}' -f $shown)
    return $reason
}

function Get-EndpointClass {
    param([int] $Status, $ErrorCode)
    if ($Status -eq 200) { return 'LOADED' }
    if (($Status -eq 503) -and ($ErrorCode -eq 'identity-sources-unavailable')) { return 'REFUSED' }
    if (($Status -eq 503) -and ($ErrorCode -eq 'holdings-unavailable')) { return 'NOT_REFUSED' }
    return 'UNEXPECTED'
}

function Get-RootCause {
    param([string] $Preset, [string] $EndpointClass, [bool] $SaysMissing, [bool] $DirectoryExists, [int] $Present, [int] $Sound, [string] $LoaderReason)
    if ($EndpointClass -eq 'UNEXPECTED') { return 'NOT_DETERMINED' }
    if ($Preset.Length -gt 0) { return $Preset }
    if (-not $DirectoryExists) { return 'IDENTITY_DIRECTORY_ABSENT' }
    if ($Present -lt 3) { return ('IDENTITY_FILES_ABSENT ({0} of 3 absent)' -f (3 - $Present)) }
    if ($Sound -lt 3) { return 'IDENTITY_FILE_UNREADABLE_OR_NOT_VALID' }
    $loaderRan = $LoaderReason.Length -gt 0
    if ($loaderRan -and ($LoaderReason -ne 'IDENTITY_SOURCES_VALID')) { return 'IDENTITY_FILES_REFUSED_BY_THE_IRR_LOADER' }
    if (($EndpointClass -eq 'REFUSED') -and $SaysMissing) { return 'FILES_VISIBLE_TO_THIS_USER_BUT_NOT_TO_THE_RUNNING_PROCESS' }
    if ($EndpointClass -eq 'REFUSED') { return 'IDENTITY_FILES_REFUSED_BY_THE_RUNNING_PROCESS' }
    if ($loaderRan) { return 'NONE' }
    return 'NOT_DETERMINED'
}

# ---------- main -------------------------------------------------------------------------------
Write-Host 'IRR identity-source diagnostic (read-only, sanitized)'
if ($PSVersionTable.PSVersion.Major -eq 6) {
    Write-Host 'RESULT: INCONCLUSIVE - run this in Windows PowerShell 5.1 or in PowerShell 7.'
    exit 2
}
if ($RuntimeRoot.Length -eq 0) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
if ($LogRoot.Length -eq 0) { $LogRoot = Join-Path $InstallRoot 'logs' }
$irrRoot = Join-Path $InstallRoot 'iips-review-recovered'
$irrFrontend = Join-Path $irrRoot 'frontend'
$conventionDir = Join-Path $RuntimeRoot 'iips-data\investment\identity'
$frontendDefaultDir = Join-Path $irrFrontend '.iips-data\investment\identity'
$base = 'http://{0}:{1}' -f $BindAddress, $TransportPort

# 1. The running transport.
$health = Invoke-LoopbackGet ($base + '/api/health')
if ($health.Status -ne 200) {
    Write-Check 'FAIL' 'transport-reachable' ('GET /api/health returned status {0}' -f $health.Status)
    Write-Host 'ROOT CAUSE: NOT_DETERMINED - the IRR transport did not answer; nothing else was checked.'
    Write-Host 'RESULT: INCONCLUSIVE'
    exit 2
}
Write-Check 'PASS' 'transport-reachable' 'GET /api/health returned 200'

$nodePath = ''
$listenerPid = Get-ListenerProcessId $TransportPort
$listener = $null
if ($listenerPid -gt 0) { $listener = Get-ProcessRecord $listenerPid }
if ($null -eq $listener) {
    Write-Check 'INFO' 'transport-process' 'the listener process could not be inspected from this session'
}
if ($null -ne $listener) {
    $isTransport = ([string] $listener.CommandLine) -match 'executive-transport'
    Write-Check (Get-StatusWord $isTransport 'WARN') 'transport-process' ('the listener command line names executive-transport: {0}' -f (ConvertTo-YesNo $isTransport))
    if (([string] $listener.Name) -eq 'node.exe') { $nodePath = [string] $listener.ExecutablePath }
    $recordedPid = Get-RecordedTransportPid $LogRoot
    $fromLauncher = ($recordedPid -gt 0) -and (Test-DescendsFrom $listenerPid $recordedPid)
    Write-Check 'INFO' 'transport-launcher' ('newest PID manifest records irr-transport: {0}; the listener descends from it: {1}' -f (ConvertTo-YesNo ($recordedPid -gt 0)), (ConvertTo-YesNo $fromLauncher))
}
if ($nodePath.Length -eq 0) {
    $onPath = @(Get-Command 'node.exe' -CommandType Application -ErrorAction SilentlyContinue)
    if ($onPath.Count -gt 0) { $nodePath = [string] $onPath[0].Path }
}

# 2. What the running transport says about its identity sources.
$answer = Invoke-LoopbackGet ($base + '/api/investment/portfolio/' + $PortfolioId + '/identities')
$parsed = $null
try { $parsed = ConvertFrom-JsonText $answer.Body }
catch { $parsed = $null }
$errorCode = Get-JsonMember $parsed 'error'
$issues = @()
$rawIssues = Get-JsonMember $parsed 'issues'
if ($rawIssues -is [System.Collections.IList]) { $issues = @($rawIssues) }

$codes = New-Object System.Collections.Generic.List[string]
$named = New-Object System.Collections.Generic.List[string]
$reportedDir = ''
foreach ($issue in $issues) {
    $code = Protect-Token (Get-JsonMember $issue 'code') '^[A-Z_]{1,64}$'
    $fileName = Protect-Token (Get-JsonMember $issue 'file') '^(eligible-roster|listing-map|corporate-actions)\.json$'
    if (-not $codes.Contains($code)) { $codes.Add($code) }
    if (-not $named.Contains($fileName)) { $named.Add($fileName) }
    $subject = Get-JsonMember $issue 'subject'
    $isDirectory = ($code -eq 'IDENTITY_SOURCE_MISSING') -and ($subject -is [string]) -and ($subject -match '^([A-Za-z]:\\|\\\\)')
    if ($isDirectory) { $reportedDir = $subject }
}
$saysMissing = $codes.Contains('IDENTITY_SOURCE_MISSING')
$endpointClass = Get-EndpointClass $answer.Status $errorCode

if ($endpointClass -eq 'LOADED') {
    $directory = Get-JsonMember $parsed 'directory'
    $dataClass = Protect-Token (Get-JsonMember $directory 'rosterDataClass') '^[A-Z_]{1,64}$'
    $rosterDigest = Protect-Token (Get-JsonMember $directory 'rosterDigest') '^sha256:[0-9a-f]{64}$'
    Write-Check 'PASS' 'endpoint' ('status 200: the identity sources loaded; rosterDataClass {0}; rosterDigest {1}' -f $dataClass, $rosterDigest)
    Write-Host ''
    Write-Host 'ROOT CAUSE: NONE'
    Write-Host ('CHECKS: PASS {0}, FAIL {1}, WARN {2}, INFO {3}, SKIP {4}' -f $script:Counts.PASS, $script:Counts.FAIL, $script:Counts.WARN, $script:Counts.INFO, $script:Counts.SKIP)
    Write-Host 'Nothing was written, changed, started or stopped. No path, body, portfolio or identifier was printed.'
    Write-Host 'RESULT: PASS'
    exit 0
}
if ($endpointClass -eq 'REFUSED') {
    Write-Check 'FAIL' 'endpoint' ('status 503 identity-sources-unavailable; issues: {0}; codes: {1}; files named: {2}' -f $issues.Count, ($codes -join ', '), ($named -join ', '))
}
if (($endpointClass -eq 'REFUSED') -and $saysMissing -and ($issues.Count -eq 1)) {
    Write-Check 'INFO' 'endpoint-note' 'IRR main returns ONE issue for any number of missing files and always names eligible-roster.json; the file checks below show which are absent'
}
if ($endpointClass -eq 'NOT_REFUSED') {
    Write-Check 'INFO' 'endpoint' 'status 503 holdings-unavailable: the identity sources were not refused as missing or invalid (on IRR main an unreadable identity file also gives this answer)'
}
if ($endpointClass -eq 'UNEXPECTED') {
    Write-Check 'WARN' 'endpoint' ('unexpected answer: status {0}, error {1}' -f $answer.Status, (Protect-Token $errorCode '^[a-z-]{1,64}$'))
}

# 3. Which directory the running process resolved, and what that says about IIPS_DATA_DIR.
$presetCause = ''
$targetDir = $conventionDir
$directoryBasis = 'ASSUMED from the launcher convention <RuntimeRoot>\iips-data\investment\identity'
if ($reportedDir.Length -eq 0) {
    Write-Check 'INFO' 'resolved-directory' 'the running transport did not report its identity directory; the launcher convention is ASSUMED below'
}
if ($reportedDir.Length -gt 0) {
    $targetDir = $reportedDir
    $directoryBasis = 'reported by the running transport'
    Write-Check 'PASS' 'resolved-directory' 'the running transport reported the identity directory it resolved (used below, not printed)'
    $isConvention = Test-SamePath $reportedDir $conventionDir
    $isDefault = Test-SamePath $reportedDir $frontendDefaultDir
    if ($isConvention) {
        Write-Check 'PASS' 'data-dir-setting' 'the running process resolves the launcher runtime data directory: IIPS_DATA_DIR reached the process as the launcher sets it'
    }
    if ($isDefault) {
        Write-Check 'FAIL' 'data-dir-setting' 'the running process resolves the working-directory default (.iips-data under the IRR frontend): IIPS_DATA_DIR is not set in it'
        $presetCause = 'RUNNING_PROCESS_USES_THE_WORKING_DIRECTORY_DEFAULT'
    }
    if ((-not $isConvention) -and (-not $isDefault)) {
        Write-Check 'WARN' 'data-dir-setting' 'the running process resolves a data directory that is neither the launcher convention for these parameters nor the working-directory default'
    }
}
$envFiles = @(
    @{ Label = 'repository root'; Path = (Join-Path $irrRoot '.env.local') },
    @{ Label = 'frontend'; Path = (Join-Path $irrFrontend '.env.local') }
)
foreach ($envFile in $envFiles) {
    $defines = $false
    if (Test-Path -LiteralPath $envFile.Path -PathType Leaf) {
        $lines = @(Get-Content -LiteralPath $envFile.Path)
        $defines = @($lines | Where-Object { $_ -match '^\s*(export\s+)?IIPS_DATA_DIR\s*=' }).Count -gt 0
    }
    Write-Check 'INFO' 'env-file' ('.env.local ({0}) defines IIPS_DATA_DIR: {1}; a value already in the process environment wins over the file' -f $envFile.Label, (ConvertTo-YesNo $defines))
}

# 4. The directory and the three files.
$dataRoot = Split-Path -Parent (Split-Path -Parent (Get-NormalizedPath $targetDir))
$rootExists = Test-Path -LiteralPath $dataRoot -PathType Container
$dirExists = Test-Path -LiteralPath $targetDir -PathType Container
Write-Check (Get-StatusWord $rootExists 'FAIL') 'data-root' ('the data root directory exists: {0}' -f (ConvertTo-YesNo $rootExists))
Write-Check (Get-StatusWord $dirExists 'FAIL') 'identity-directory' ('investment\identity exists under the data root: {0}' -f (ConvertTo-YesNo $dirExists))
$filesPresent = 0
$filesSound = 0
foreach ($file in $IdentityFiles) {
    $state = Test-IdentityFile $targetDir $file
    if ($state -ne 'ABSENT') { $filesPresent = $filesPresent + 1 }
    if ($state -eq 'SOUND') { $filesSound = $filesSound + 1 }
}

# 5. IRR's own loader.
$loaderReason = Get-LoaderVerdict $irrFrontend $dataRoot $nodePath $filesSound

# 6. Do the files exist in another place the implementation would resolve?
$elsewhere = 0
$candidates = @(
    @{ Label = 'launcher runtime data directory'; Path = $conventionDir },
    @{ Label = 'IRR frontend working-directory default'; Path = $frontendDefaultDir },
    @{ Label = 'IRR repository-root working-directory default'; Path = (Join-Path $irrRoot '.iips-data\investment\identity') },
    @{ Label = 'IRR iips-platform working-directory default'; Path = (Join-Path $irrRoot 'iips-platform\.iips-data\investment\identity') }
)
foreach ($candidate in $candidates) {
    if (Test-SamePath $candidate.Path $targetDir) { continue }
    $count = Get-PresentFileCount $candidate.Path
    if ($count -gt $elsewhere) { $elsewhere = $count }
    Write-Check 'INFO' 'other-location' ('{0}: {1} of 3 files present' -f $candidate.Label, $count)
}

# Verdict.
$rootCause = Get-RootCause $presetCause $endpointClass $saysMissing $dirExists $filesPresent $filesSound $loaderReason
$exitCode = 1
if ($rootCause -eq 'NONE') { $exitCode = 0 }
if ($rootCause -eq 'NOT_DETERMINED') { $exitCode = 2 }
# A finding about a directory the running process did not itself report is not proof about it.
if (($exitCode -eq 1) -and ($endpointClass -ne 'REFUSED')) { $exitCode = 2 }
$result = 'FAIL'
if ($exitCode -eq 0) { $result = 'PASS' }
if ($exitCode -eq 2) { $result = 'INCONCLUSIVE' }

Write-Host ''
Write-Host ('ROOT CAUSE: {0}' -f $rootCause)
Write-Host ('IDENTITY DIRECTORY CHECKED: {0}' -f $directoryBasis)
Write-Host ('IDENTITY FILES THERE: {0} of 3 present; {1} of 3 readable, JSON and of the expected schema' -f $filesPresent, $filesSound)
Write-Host ('IDENTITY FILES IN ANOTHER CHECKED LOCATION: at most {0} of 3' -f $elsewhere)
Write-Host ('CHECKS: PASS {0}, FAIL {1}, WARN {2}, INFO {3}, SKIP {4}' -f $script:Counts.PASS, $script:Counts.FAIL, $script:Counts.WARN, $script:Counts.INFO, $script:Counts.SKIP)
Write-Host 'Nothing was written, changed, started or stopped. No path, body, portfolio or identifier was printed.'
Write-Host ('RESULT: {0}' -f $result)
exit $exitCode
