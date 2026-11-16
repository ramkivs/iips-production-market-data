#Requires -Version 5.1
<#
.SYNOPSIS
    Executes the approved (2026-11-16) Level E strictly read-only D5/D16 SQLite inventory
    against the Principal's local Windows IPD database.

.DESCRIPTION
    Windows-host operator script for ramkivs/iips-production-market-data (D02 D5/D16 read-only
    inventory). Targets C:\iips-data\iips\user-portfolio.sqlite by default and emits a complete,
    timestamped, SHA-256-manifested evidence directory outside the live database directory and
    outside the Git worktree.

    Mandatory safety guarantees enforced fail-closed:
      - Never starts IPD/IRR servers or normal startup paths
      - Never calls openDatabase(), ensureMigrations(), binding resolvers, or Direct P1 provisioning
      - Never runs npm/npx or installs dependencies
      - Never creates a missing database file or parent directory
      - Refuses missing, non-regular, symlink/reparse, invalid-header, WAL-header, active-writer,
        running-service, or -wal/-shm/-journal sidecar databases before SQLite open
      - Probes local Windows Node >= 22.13.0 + node:sqlite readOnly API contract before DB open
      - Executes ONLY the exact Q01-Q14 read-only catalog inside BEGIN DEFERRED ... ROLLBACK with
        { open: true, readOnly: true }, PRAGMA query_only = ON, and PRAGMA temp_store = MEMORY
      - Independently verifies exact pre/post SHA-256 equality and zero sidecar creation in both
        Node.js and Windows PowerShell/.NET
      - Preserves full diagnostic evidence on any precondition or postcondition failure without
        attempting repair or read-write fallback

.PARAMETER DatabasePath
    Full Windows drive-qualified path to the existing SQLite database file.
    Defaults to C:\iips-data\iips\user-portfolio.sqlite.

.PARAMETER RepositoryRoot
    Path to the local IPD repository checkout containing scripts\d02-d5-d16-readonly-inventory-runner.mjs
    and scripts\d02-d5-d16-query-catalog.mjs. Defaults to the parent of $PSScriptRoot.

.PARAMETER NodeExecutable
    Optional explicit full path to node.exe (>= 22.13.0). When omitted, resolves
    C:\Node22\node-v22.16.0-win-x64\node.exe first and then node.exe on PATH.

.PARAMETER EvidenceRoot
    Parent folder under which the timestamped evidence directory will be created. Defaults to
    %LOCALAPPDATA%\IIPS\d02-d5-d16-readonly-inventory (outside both the DB directory and repo).

.PARAMETER ExpectedCommit
    Optional 40-hex Git commit SHA assertion for RepositoryRoot.

.PARAMETER NoPause
    Suppresses the interactive Read-Host prompt at script completion.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string] $DatabasePath = 'C:\iips-data\iips\user-portfolio.sqlite',

    [Parameter(Mandatory = $false)]
    [string] $RepositoryRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [string] $EvidenceRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $ExpectedCommit = '',

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:OperatorPackageVersion = '2026-11-16.1'
$script:MinimumNodeMajor = 22
$script:MinimumNodeMinor = 13
$script:MinimumNodePatch = 0
$script:PreferredWindowsNodeExe = 'C:\Node22\node-v22.16.0-win-x64\node.exe'
$script:DesignatedDefaultDbPath = 'C:\iips-data\iips\user-portfolio.sqlite'
$script:DesignatedIpdPipeName = 'iips-user-portfolio-v1'
$script:StepLog = New-Object System.Collections.Generic.List[string]
$script:CurrentStep = '00-bootstrap'
$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-IipsStep {
    param(
        [Parameter(Mandatory = $true)][string] $Id,
        [Parameter(Mandatory = $true)][string] $Message
    )
    $script:CurrentStep = $Id
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    $line = "[$stamp] [$Id] $Message"
    Write-Host ''
    Write-Host "==> [$Id] $Message" -ForegroundColor Cyan
    $script:StepLog.Add($line)
}

function Write-IipsOk {
    param([Parameter(Mandatory = $true)][string] $Message)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    Write-Host "    OK   $Message" -ForegroundColor Green
    $script:StepLog.Add("[$stamp]     OK   $Message")
}

function Write-IipsInfo {
    param([Parameter(Mandatory = $true)][string] $Message)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    Write-Host "         $Message" -ForegroundColor Gray
    $script:StepLog.Add("[$stamp]          $Message")
}

function Write-IipsWarn {
    param([Parameter(Mandatory = $true)][string] $Message)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    Write-Host "    WARN $Message" -ForegroundColor Yellow
    $script:StepLog.Add("[$stamp]     WARN $Message")
}

function Write-IipsPause {
    param([Parameter(Mandatory = $false)][switch] $SkipPause)
    if ($SkipPause) { return }
    Write-Host ''
    Write-Host 'Press Enter to finish...' -ForegroundColor Yellow
    try { $null = Read-Host }
    catch { Write-Host '(non-interactive session - continuing without pause)' -ForegroundColor DarkGray }
}

function Write-IipsFinalStatus {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'FAIL')][string] $Outcome,
        [Parameter(Mandatory = $true)][string] $Disposition,
        [Parameter(Mandatory = $true)][string] $Message,
        [Parameter(Mandatory = $false)][string] $EvidenceDir = '',
        [Parameter(Mandatory = $false)][string] $PreSha256 = 'N/A',
        [Parameter(Mandatory = $false)][string] $PostSha256 = 'N/A',
        [Parameter(Mandatory = $false)][string] $ManifestSha256 = 'N/A',
        [Parameter(Mandatory = $false)][int] $ExitCode = 0,
        [Parameter(Mandatory = $false)][switch] $SkipPause
    )
    $color = 'Green'
    if ($Outcome -eq 'FAIL') { $color = 'Red' }
    Write-Host ''
    Write-Host '================================================================================' -ForegroundColor $color
    Write-Host ("RESULT:          {0} (exit code {1})" -f $Outcome, $ExitCode) -ForegroundColor $color
    Write-Host ("DISPOSITION:     {0}" -f $Disposition) -ForegroundColor $color
    Write-Host ("SUMMARY:         {0}" -f $Message) -ForegroundColor $color
    Write-Host ("EVIDENCE_DIR:    {0}" -f $EvidenceDir) -ForegroundColor Yellow
    Write-Host ("DB_PRE_SHA256:   {0}" -f $PreSha256) -ForegroundColor Gray
    Write-Host ("DB_POST_SHA256:  {0}" -f $PostSha256) -ForegroundColor Gray
    Write-Host ("MANIFEST_SHA256: {0}" -f $ManifestSha256) -ForegroundColor Gray
    Write-Host '================================================================================' -ForegroundColor $color
    Write-IipsPause -SkipPause:$SkipPause
    return $ExitCode
}

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)][string] $LiteralPath,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string] $Content
    )
    $normalized = $Content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($LiteralPath, $normalized, $script:Utf8NoBom)
}

function Write-JsonNoBomFile {
    param(
        [Parameter(Mandatory = $true)][string] $LiteralPath,
        [Parameter(Mandatory = $true)][object] $InputObject
    )
    $json = ConvertTo-Json -InputObject $InputObject -Depth 16
    Write-Utf8NoBomFile -LiteralPath $LiteralPath -Content ($json + "`n")
}

function Get-FileSha256Hex {
    param([Parameter(Mandatory = $true)][string] $LiteralPath)
    $stream = $null
    $sha = $null
    $hex = ''
    try {
        $stream = [System.IO.File]::Open(
            $LiteralPath,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            [System.IO.FileShare]::ReadWrite
        )
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $bytes = $sha.ComputeHash($stream)
        $hex = ([System.BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
    }
    catch {
        if ($null -ne $sha) { $sha.Dispose(); $sha = $null }
        if ($null -ne $stream) { $stream.Dispose(); $stream = $null }
        throw
    }
    if ($null -ne $sha) { $sha.Dispose(); $sha = $null }
    if ($null -ne $stream) { $stream.Dispose(); $stream = $null }
    return $hex
}

function Format-WindowsArgument {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Value)
    if ($Value.Length -eq 0) { return '""' }
    if ($Value -notmatch '[\s"]') { return $Value }
    $sb = New-Object System.Text.StringBuilder
    [void] $sb.Append('"')
    $backslashCount = 0
    foreach ($ch in $Value.ToCharArray()) {
        if ($ch -eq '\') {
            $backslashCount += 1
            continue
        }
        if ($ch -eq '"') {
            [void] $sb.Append(('\' * ($backslashCount * 2 + 1)))
            [void] $sb.Append('"')
            $backslashCount = 0
            continue
        }
        if ($backslashCount -gt 0) {
            [void] $sb.Append(('\' * $backslashCount))
            $backslashCount = 0
        }
        [void] $sb.Append($ch)
    }
    if ($backslashCount -gt 0) {
        [void] $sb.Append(('\' * ($backslashCount * 2)))
    }
    [void] $sb.Append('"')
    return $sb.ToString()
}

function Invoke-NativeBinaryCapture {
    param(
        [Parameter(Mandatory = $true)][string] $ExecutablePath,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][string[]] $ArgumentList,
        [Parameter(Mandatory = $true)][string] $WorkingDirectory
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $ExecutablePath
    $quotedArgs = New-Object System.Collections.Generic.List[string]
    foreach ($arg in $ArgumentList) {
        $quotedArgs.Add((Format-WindowsArgument -Value $arg))
    }
    $psi.Arguments = [string]::Join(' ', $quotedArgs)
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $started = $proc.Start()
    if (-not $started) {
        $proc.Dispose()
        throw "PROCESS_START_FAILED: Unable to launch $ExecutablePath"
    }
    $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
    $stderrTask = $proc.StandardError.ReadToEndAsync()
    $proc.WaitForExit()
    $stdoutText = $stdoutTask.GetAwaiter().GetResult()
    $stderrText = $stderrTask.GetAwaiter().GetResult()
    $code = [int] $proc.ExitCode
    $proc.Dispose()

    return [pscustomobject]@{
        ExitCode = $code
        StdOut   = $stdoutText
        StdErr   = $stderrText
    }
}

function Test-PathHasReparsePointInChain {
    param([Parameter(Mandatory = $true)][string] $FullPath)
    $current = $FullPath
    while (-not [string]::IsNullOrWhiteSpace($current)) {
        if ([System.IO.File]::Exists($current) -or [System.IO.Directory]::Exists($current)) {
            $attrs = [System.IO.File]::GetAttributes($current)
            $isReparse = (($attrs -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
            if ($isReparse) {
                return [pscustomobject]@{
                    HasReparsePoint = $true
                    ReparsePath     = $current
                }
            }
        }
        $parent = [System.IO.Path]::GetDirectoryName($current)
        if ([string]::IsNullOrWhiteSpace($parent) -or ($parent -ceq $current)) {
            break
        }
        $current = $parent
    }
    return [pscustomobject]@{
        HasReparsePoint = $false
        ReparsePath     = $null
    }
}

function Test-PathInsideGitWorktree {
    param([Parameter(Mandatory = $true)][string] $CandidateDir)
    $cursor = $CandidateDir
    while (-not [string]::IsNullOrWhiteSpace($cursor)) {
        $gitMarker = Join-Path $cursor '.git'
        if (Test-Path -LiteralPath $gitMarker) {
            return $true
        }
        $next = [System.IO.Path]::GetDirectoryName($cursor)
        if ([string]::IsNullOrWhiteSpace($next) -or ($next -ceq $cursor)) {
            break
        }
        $cursor = $next
    }
    return $false
}

function Get-DatabaseSidecarSnapshot {
    param([Parameter(Mandatory = $true)][string] $FullDbPath)
    $parentDir = [System.IO.Path]::GetDirectoryName($FullDbPath)
    $dbLeaf = [System.IO.Path]::GetFileName($FullDbPath)
    $found = New-Object System.Collections.Generic.List[object]

    $explicitSuffixes = @('-wal', '-shm', '-journal')
    foreach ($suffix in $explicitSuffixes) {
        $candidate = $FullDbPath + $suffix
        if ([System.IO.File]::Exists($candidate) -or [System.IO.Directory]::Exists($candidate)) {
            $len = $null
            if ([System.IO.File]::Exists($candidate)) {
                $len = (New-Object System.IO.FileInfo($candidate)).Length
            }
            $found.Add([pscustomobject]@{
                kind      = $suffix
                name      = [System.IO.Path]::GetFileName($candidate)
                sizeBytes = $len
            })
        }
    }

    if ([System.IO.Directory]::Exists($parentDir)) {
        $children = @(Get-ChildItem -LiteralPath $parentDir -Force -ErrorAction Stop)
        $lowerLeaf = $dbLeaf.ToLowerInvariant()
        foreach ($child in $children) {
            $lowerName = $child.Name.ToLowerInvariant()
            $isSidecar = (
                ($lowerName -eq ($lowerLeaf + '-wal')) -or
                ($lowerName -eq ($lowerLeaf + '-shm')) -or
                ($lowerName -eq ($lowerLeaf + '-journal')) -or
                $lowerName.StartsWith($lowerLeaf + '-mj')
            )
            if (-not $isSidecar) { continue }
            $alreadyListed = $false
            foreach ($existing in $found) {
                if ($existing.name.ToLowerInvariant() -eq $lowerName) {
                    $alreadyListed = $true
                }
            }
            if (-not $alreadyListed) {
                $childLen = $null
                if (-not $child.PSIsContainer) { $childLen = $child.Length }
                $found.Add([pscustomobject]@{
                    kind      = 'directory_scan_sidecar'
                    name      = $child.Name
                    sizeBytes = $childLen
                })
            }
        }
    }

    return [pscustomobject]@{
        checkedAtUtc      = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        anySidecarPresent = ($found.Count -gt 0)
        detectedSidecars  = @($found.ToArray())
    }
}

function Resolve-IipsNodeToolchain {
    param([Parameter(Mandatory = $false)][string] $RequestedNodePath = '')
    $candidatePath = ''
    $hasRequested = (-not [string]::IsNullOrWhiteSpace($RequestedNodePath))
    if ($hasRequested) {
        $candidatePath = $RequestedNodePath.Trim()
    }
    if (-not $hasRequested) {
        if ([System.IO.File]::Exists($script:PreferredWindowsNodeExe)) {
            $candidatePath = $script:PreferredWindowsNodeExe
        }
    }
    if ([string]::IsNullOrWhiteSpace($candidatePath)) {
        $cmd = Get-Command -Name 'node.exe' -CommandType Application -ErrorAction SilentlyContinue
        if ($null -ne $cmd) {
            $candidatePath = $cmd.Source
        }
    }
    if ([string]::IsNullOrWhiteSpace($candidatePath) -or (-not [System.IO.File]::Exists($candidatePath))) {
        throw "NODE_EXECUTABLE_NOT_FOUND: Could not locate node.exe (checked explicit parameter, $($script:PreferredWindowsNodeExe), and PATH)."
    }

    $fullNodeExe = [System.IO.Path]::GetFullPath($candidatePath)
    $verRun = Invoke-NativeBinaryCapture -ExecutablePath $fullNodeExe -ArgumentList @('--version') -WorkingDirectory ([System.IO.Path]::GetDirectoryName($fullNodeExe))
    if ($verRun.ExitCode -ne 0) {
        throw "NODE_VERSION_COMMAND_FAILED: $fullNodeExe --version exited with $($verRun.ExitCode)."
    }
    $rawVersion = ($verRun.StdOut.Trim())
    if ($rawVersion -notmatch '^v?(\d+)\.(\d+)\.(\d+)') {
        throw "NODE_VERSION_UNPARSEABLE: Unexpected version string '$rawVersion' from $fullNodeExe."
    }
    $maj = [int] $Matches[1]
    $min = [int] $Matches[2]
    $pat = [int] $Matches[3]

    $versionSupported = $false
    if ($maj -gt $script:MinimumNodeMajor) { $versionSupported = $true }
    if (($maj -eq $script:MinimumNodeMajor) -and ($min -gt $script:MinimumNodeMinor)) { $versionSupported = $true }
    if (($maj -eq $script:MinimumNodeMajor) -and ($min -eq $script:MinimumNodeMinor) -and ($pat -ge $script:MinimumNodePatch)) { $versionSupported = $true }

    if (-not $versionSupported) {
        throw ("NODE_VERSION_TOO_OLD: {0} reported {1}; Node.js >= {2}.{3}.{4} is required." -f $fullNodeExe, $rawVersion, $script:MinimumNodeMajor, $script:MinimumNodeMinor, $script:MinimumNodePatch)
    }

    return [pscustomobject]@{
        NodeExe       = $fullNodeExe
        VersionString = ($rawVersion -replace '^v', '')
        Major         = $maj
        Minor         = $min
        Patch         = $pat
    }
}

function Write-SealedSha256Manifest {
    param([Parameter(Mandatory = $true)][string] $TargetEvidenceDir)
    $manifestPath = Join-Path $TargetEvidenceDir 'sha256s.txt'
    if ([System.IO.File]::Exists($manifestPath)) {
        Remove-Item -LiteralPath $manifestPath -Force
    }
    $files = @(Get-ChildItem -LiteralPath $TargetEvidenceDir -File -Recurse -Force | Sort-Object -Property FullName)
    $manifestLines = New-Object System.Collections.Generic.List[string]
    foreach ($file in $files) {
        if ($file.Name -ieq 'sha256s.txt') { continue }
        $rel = $file.FullName.Substring($TargetEvidenceDir.Length).TrimStart('\', '/') -replace '\\', '/'
        $hashHex = Get-FileSha256Hex -LiteralPath $file.FullName
        $manifestLines.Add(("{0}  {1}" -f $hashHex, $rel))
    }
    $manifestBody = ([string]::Join("`n", $manifestLines)) + "`n"
    Write-Utf8NoBomFile -LiteralPath $manifestPath -Content $manifestBody

    # Self-verify every recorded digest immediately after writing sha256s.txt
    $verifyLines = @((Get-Content -LiteralPath $manifestPath -Encoding UTF8))
    foreach ($line in $verifyLines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -notmatch '^([0-9a-f]{64})  (.+)$') {
            throw "MANIFEST_FORMAT_INVALID: '$line'"
        }
        $expectedHex = $Matches[1]
        $relPath = $Matches[2] -replace '/', '\'
        $checkFull = Join-Path $TargetEvidenceDir $relPath
        $actualHex = Get-FileSha256Hex -LiteralPath $checkFull
        if ($actualHex -cne $expectedHex) {
            throw "MANIFEST_SELF_VERIFICATION_FAILED: $relPath expected $expectedHex got $actualHex"
        }
    }
    return (Get-FileSha256Hex -LiteralPath $manifestPath)
}

function Write-FallbackStopArtifactsIfMissing {
    param(
        [Parameter(Mandatory = $true)][string] $TargetEvidenceDir,
        [Parameter(Mandatory = $true)][string] $Disposition,
        [Parameter(Mandatory = $true)][int] $ExitCode,
        [Parameter(Mandatory = $true)][string] $InspectedDbPath,
        [Parameter(Mandatory = $true)][object] $HostPreflight,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][object[]] $Failures
    )
    $summaryPath = Join-Path $TargetEvidenceDir 'd5-d16-inventory-summary.json'
    if ([System.IO.File]::Exists($summaryPath)) { return }

    $nowUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    $metaPath = Join-Path $TargetEvidenceDir '01-preflight-and-database-metadata.json'
    $metaPayload = [ordered]@{
        operatorPackageVersion      = $script:OperatorPackageVersion
        completedAtUtc              = $nowUtc
        disposition                 = $Disposition
        exitCode                    = $ExitCode
        inspectedDatabasePath       = $InspectedDbPath
        evidenceDirectory           = $TargetEvidenceDir
        powerShellHostPreflight     = $HostPreflight
        nodeRunnerExecutedInventory = $false
        failureRecords              = $Failures
    }
    Write-JsonNoBomFile -LiteralPath $metaPath -InputObject $metaPayload

    $summaryPayload = [ordered]@{
        schemaVersion                   = 'ipd.d02.d5_d16.readonly_inventory_summary.v1'
        operatorPackageVersion          = $script:OperatorPackageVersion
        completedAtUtc                  = $nowUtc
        disposition                     = $Disposition
        exitCode                        = $ExitCode
        inspectedDatabasePath           = $InspectedDbPath
        databasePreSha256               = $HostPreflight.psPreSha256
        databasePostSha256              = $HostPreflight.psPostSha256
        databasePrePostSha256Identical  = (
            (-not [string]::IsNullOrWhiteSpace($HostPreflight.psPreSha256)) -and
            ($HostPreflight.psPreSha256 -ceq $HostPreflight.psPostSha256)
        )
        gateSeparationStatus            = [ordered]@{
            narrowReadOnlyInventoryApprovalDate       = '2026-11-16'
            d5Accepted                                = $false
            d16DetailedSchemaApproved                 = $false
            implementationAuthorized                  = $false
            provisioningOrOwnerReassignmentExecuted   = $false
            d6IrrIntegrationStarted                   = $false
        }
        highLevelCounts                 = $null
        failureRecords                  = $Failures
    }
    Write-JsonNoBomFile -LiteralPath $summaryPath -InputObject $summaryPayload

    $mdLines = New-Object System.Collections.Generic.List[string]
    $mdLines.Add('# IPD D02 — Level E Read-Only D5 / D16 Live Inventory Evidence Report (Stopped Before SQLite Open)')
    $mdLines.Add('')
    $mdLines.Add("- **Generated (UTC):** ``$nowUtc``")
    $mdLines.Add("- **Disposition:** ``$Disposition`` (exit code ``$ExitCode``)")
    $mdLines.Add("- **Target SQLite Path:** ``$InspectedDbPath``")
    $mdLines.Add("- **Evidence Directory:** ``$TargetEvidenceDir``")
    $mdLines.Add('')
    $mdLines.Add('## Fail-Closed Stop Reasons')
    $mdLines.Add('')
    foreach ($failure in $Failures) {
        $mdLines.Add(("- **``{0}``** (``{1}``): {2}" -f $failure.code, $failure.phase, $failure.detail))
    }
    $mdLines.Add('')
    $mdLines.Add('No repair, file creation, dependency install, migration, or read-write fallback was attempted.')
    Write-Utf8NoBomFile -LiteralPath (Join-Path $TargetEvidenceDir 'd5-d16-inventory-report.md') -Content (([string]::Join("`n", $mdLines)) + "`n")
}

# ==============================================================================================
# Main Execution Flow
# ==============================================================================================
$startedAtUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$failures = New-Object System.Collections.Generic.List[object]
$evidenceDir = ''
$manifestSha256 = 'N/A'
$resolvedRepoRoot = $RepositoryRoot
if ([string]::IsNullOrWhiteSpace($resolvedRepoRoot)) {
    $resolvedRepoRoot = Split-Path -Parent $PSScriptRoot
}
$resolvedRepoRoot = [System.IO.Path]::GetFullPath($resolvedRepoRoot)

$psScriptSelfPath = $MyInvocation.MyCommand.Path
$runnerMjsPath = Join-Path (Join-Path $resolvedRepoRoot 'scripts') 'd02-d5-d16-readonly-inventory-runner.mjs'
$catalogMjsPath = Join-Path (Join-Path $resolvedRepoRoot 'scripts') 'd02-d5-d16-query-catalog.mjs'

$detectedPsEdition = 'Desktop'
if ($PSVersionTable.ContainsKey('PSEdition')) {
    $detectedPsEdition = [string] $PSVersionTable.PSEdition
}

$hostPreflight = [ordered]@{
    operatorPackageVersion         = $script:OperatorPackageVersion
    startedAtUtc                   = $startedAtUtc
    completedAtUtc                 = $null
    passed                         = $false
    hostPlatform                   = [System.Environment]::OSVersion.Platform.ToString()
    osVersionString                = [System.Environment]::OSVersion.VersionString
    psVersion                      = $PSVersionTable.PSVersion.ToString()
    psEdition                      = $detectedPsEdition
    repositoryRoot                 = $resolvedRepoRoot
    gitHeadCommit                  = $null
    gitTrackedClean                = $null
    powerShellScriptSha256         = $null
    nodeRunnerMjsSha256            = $null
    queryCatalogMjsSha256          = $null
    inspectedDatabasePath          = $DatabasePath
    parentDirectoryExists          = $false
    databaseFileExists             = $false
    reparsePointDetected           = $false
    reparsePointPath               = $null
    fixedLocalDriveVerified        = $false
    namedPipeActiveDetected        = $false
    detectedIpdPipes               = @()
    potentialWriterProcessDetected = $false
    potentialWriterProcessCount    = 0
    potentialWriterRoleLabels      = @()
    exclusiveNoWriterShareCheckOk  = $false
    sqliteHeaderValid              = $false
    sqliteHeaderRollbackFormatOk   = $false
    sqliteHeaderWriteVersion       = $null
    sqliteHeaderReadVersion        = $null
    sqliteHeaderPageSize           = $null
    preSidecarCheck                = $null
    postSidecarCheck               = $null
    psPreSizeBytes                 = $null
    psPostSizeBytes                = $null
    psPreLastWriteUtc              = $null
    psPostLastWriteUtc             = $null
    psPreSha256                    = $null
    psPostSha256                   = $null
    nodeExecutable                 = $null
    nodeVersion                    = $null
}

# ----------------------------------------------------------------------------------------------
# Step 01 - Initialize isolated timestamped evidence directory
# ----------------------------------------------------------------------------------------------
try {
    Write-IipsStep -Id '01-init-evidence' -Message 'Initializing isolated timestamped evidence directory'
    $effectiveEvidenceRoot = $EvidenceRoot
    if ([string]::IsNullOrWhiteSpace($effectiveEvidenceRoot)) {
        $baseLocal = $env:LOCALAPPDATA
        if ([string]::IsNullOrWhiteSpace($baseLocal)) {
            $baseLocal = [System.IO.Path]::GetTempPath()
        }
        $effectiveEvidenceRoot = Join-Path (Join-Path $baseLocal 'IIPS') 'd02-d5-d16-readonly-inventory'
    }
    $effectiveEvidenceRoot = [System.IO.Path]::GetFullPath($effectiveEvidenceRoot)

    $rngBytes = New-Object byte[] 4
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($rngBytes)
    $rng.Dispose()
    $randHex = ([System.BitConverter]::ToString($rngBytes) -replace '-', '').ToLowerInvariant()
    $stampFolder = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')
    $evidenceDir = Join-Path $effectiveEvidenceRoot ("d02-d5-d16-inventory-{0}-{1}" -f $stampFolder, $randHex)

    if (Test-PathInsideGitWorktree -CandidateDir $evidenceDir) {
        throw "EVIDENCE_DIR_INSIDE_GIT_WORKTREE: Evidence directory '$evidenceDir' must be outside any Git worktree."
    }

    if (-not [string]::IsNullOrWhiteSpace($DatabasePath) -and ($DatabasePath -match '^[A-Za-z]:\\')) {
        $candidateDbFull = [System.IO.Path]::GetFullPath($DatabasePath)
        $candidateDbParent = [System.IO.Path]::GetDirectoryName($candidateDbFull)
        $normEv = $evidenceDir.TrimEnd('\').ToLowerInvariant()
        $normDbParent = $candidateDbParent.TrimEnd('\').ToLowerInvariant()
        $overlapsDbDir = (
            ($normEv -eq $normDbParent) -or
            $normEv.StartsWith($normDbParent + '\') -or
            $normDbParent.StartsWith($normEv + '\')
        )
        if ($overlapsDbDir) {
            throw "EVIDENCE_DIR_OVERLAPS_DB_DIR: Evidence directory '$evidenceDir' must not overlap live database directory '$candidateDbParent'."
        }
    }

    $null = New-Item -ItemType Directory -Path $evidenceDir -Force
    Write-IipsOk -Message "Evidence directory created: $evidenceDir"
}
catch {
    $errMsg = $_.Exception.Message
    Write-IipsWarn -Message "Failed to initialize evidence directory: $errMsg"
    $code = Write-IipsFinalStatus `
        -Outcome 'FAIL' `
        -Disposition 'STOPPED_EVIDENCE_DIR_INIT_FAILED' `
        -Message $errMsg `
        -EvidenceDir $evidenceDir `
        -ExitCode 2 `
        -SkipPause:$NoPause
    exit $code
}

# ----------------------------------------------------------------------------------------------
# Step 02 - Validate Windows host, PowerShell 5.1+, and repository runner integrity
# ----------------------------------------------------------------------------------------------
Write-IipsStep -Id '02-host-and-package' -Message 'Validating Windows host, PowerShell runtime, and operator package files'
try {
    $isWin32Nt = ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)
    if (-not $isWin32Nt) {
        throw "HOST_PLATFORM_UNSUPPORTED: This operator script must run on Windows NT (observed $($hostPreflight.hostPlatform))."
    }
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        throw "POWERSHELL_VERSION_UNSUPPORTED: PowerShell 5.1+ is required."
    }
    if (($PSVersionTable.PSVersion.Major -eq 5) -and ($PSVersionTable.PSVersion.Minor -lt 1)) {
        throw "POWERSHELL_VERSION_UNSUPPORTED: PowerShell 5.1+ is required."
    }
    if (-not [System.IO.File]::Exists($psScriptSelfPath)) {
        throw "OPERATOR_SCRIPT_MISSING: Cannot locate running PowerShell script '$psScriptSelfPath'."
    }
    if (-not [System.IO.File]::Exists($runnerMjsPath)) {
        throw "RUNNER_MJS_MISSING: Missing '$runnerMjsPath'."
    }
    if (-not [System.IO.File]::Exists($catalogMjsPath)) {
        throw "CATALOG_MJS_MISSING: Missing '$catalogMjsPath'."
    }

    $hostPreflight.powerShellScriptSha256 = Get-FileSha256Hex -LiteralPath $psScriptSelfPath
    $hostPreflight.nodeRunnerMjsSha256 = Get-FileSha256Hex -LiteralPath $runnerMjsPath
    $hostPreflight.queryCatalogMjsSha256 = Get-FileSha256Hex -LiteralPath $catalogMjsPath
    Write-IipsOk -Message "Package hashes recorded (runner=$($hostPreflight.nodeRunnerMjsSha256.Substring(0, 12))..., catalog=$($hostPreflight.queryCatalogMjsSha256.Substring(0, 12))...)"

    $gitCmd = Get-Command -Name 'git.exe' -CommandType Application -ErrorAction SilentlyContinue
    $hasExpectedCommit = (-not [string]::IsNullOrWhiteSpace($ExpectedCommit))
    if ($hasExpectedCommit -and ($ExpectedCommit -notmatch '^[0-9a-fA-F]{40}$')) {
        throw "EXPECTED_COMMIT_INVALID_FORMAT: -ExpectedCommit must be a 40-character hex SHA."
    }
    if (($null -eq $gitCmd) -and $hasExpectedCommit) {
        throw "GIT_NOT_FOUND_FOR_EXPECTED_COMMIT: git.exe is required when -ExpectedCommit is specified."
    }
    if ($null -ne $gitCmd) {
        $headRes = Invoke-NativeBinaryCapture -ExecutablePath $gitCmd.Source -ArgumentList @('-C', $resolvedRepoRoot, 'rev-parse', 'HEAD') -WorkingDirectory $resolvedRepoRoot
        if ($headRes.ExitCode -eq 0) {
            $hostPreflight.gitHeadCommit = $headRes.StdOut.Trim()
            Write-IipsInfo -Message "Repository HEAD commit: $($hostPreflight.gitHeadCommit)"
        }
        $statusRes = Invoke-NativeBinaryCapture -ExecutablePath $gitCmd.Source -ArgumentList @('-C', $resolvedRepoRoot, 'status', '--porcelain', '--untracked-files=no') -WorkingDirectory $resolvedRepoRoot
        if ($statusRes.ExitCode -eq 0) {
            $hostPreflight.gitTrackedClean = [string]::IsNullOrWhiteSpace($statusRes.StdOut)
        }
        if ($hasExpectedCommit) {
            $expectedLower = $ExpectedCommit.ToLowerInvariant()
            $actualLower = ([string] $hostPreflight.gitHeadCommit).ToLowerInvariant()
            if ($actualLower -cne $expectedLower) {
                throw "EXPECTED_COMMIT_MISMATCH: Repository HEAD '$actualLower' does not match required '$expectedLower'."
            }
            Write-IipsOk -Message "Repository HEAD matches -ExpectedCommit ($expectedLower)"
        }
    }
}
catch {
    $msg = $_.Exception.Message
    Write-IipsWarn -Message $msg
    $failures.Add([pscustomobject]@{
        phase  = '02-host-and-package'
        code   = 'HOST_OR_PACKAGE_PRECONDITION_FAILED'
        detail = $msg
    })
}

# ----------------------------------------------------------------------------------------------
# Step 03 - Preflight database path, reparse points, sidecars, active writers, and pre-SHA256
# ----------------------------------------------------------------------------------------------
$dbFullPath = $DatabasePath
if ($failures.Count -eq 0) {
    Write-IipsStep -Id '03-db-preflight' -Message "Running zero-mutation preflight on '$DatabasePath'"
    $readStream = $null
    $shaEngine = $null
    try {
        if ([string]::IsNullOrWhiteSpace($DatabasePath)) {
            throw 'DB_PATH_EMPTY: -DatabasePath must not be empty.'
        }
        if ($DatabasePath -match '[\x00-\x1F]') {
            throw 'DB_PATH_CONTROL_CHARS: -DatabasePath contains control characters.'
        }
        if ($DatabasePath -notmatch '^[A-Za-z]:\\') {
            throw "DB_PATH_NOT_DRIVE_QUALIFIED: -DatabasePath must be a Windows drive-qualified path (got '$DatabasePath')."
        }
        $rawSegments = @($DatabasePath -split '[\\/]+')
        if ($rawSegments -contains '..') {
            throw 'DB_PATH_TRAVERSAL_DISALLOWED: -DatabasePath must not contain .. segments.'
        }

        $dbFullPath = [System.IO.Path]::GetFullPath($DatabasePath)
        $hostPreflight.inspectedDatabasePath = $dbFullPath

        $driveRoot = [System.IO.Path]::GetPathRoot($dbFullPath)
        $driveInfo = New-Object System.IO.DriveInfo($driveRoot)
        if ($driveInfo.DriveType -ne [System.IO.DriveType]::Fixed) {
            throw "DB_DRIVE_NOT_FIXED_LOCAL: Drive '$driveRoot' has DriveType '$($driveInfo.DriveType)'; fixed local disk required."
        }
        $hostPreflight.fixedLocalDriveVerified = $true

        $dbParentDir = [System.IO.Path]::GetDirectoryName($dbFullPath)
        if (-not [System.IO.Directory]::Exists($dbParentDir)) {
            throw "PARENT_DIRECTORY_MISSING: Parent directory '$dbParentDir' does not exist (creating missing directories is prohibited)."
        }
        $hostPreflight.parentDirectoryExists = $true

        if ([System.IO.Directory]::Exists($dbFullPath)) {
            throw "DATABASE_PATH_IS_DIRECTORY: '$dbFullPath' is a directory, not a SQLite file."
        }
        if (-not [System.IO.File]::Exists($dbFullPath)) {
            throw "DATABASE_FILE_MISSING: SQLite file '$dbFullPath' does not exist (creating a missing database is prohibited)."
        }
        $hostPreflight.databaseFileExists = $true

        $reparseCheck = Test-PathHasReparsePointInChain -FullPath $dbFullPath
        $hostPreflight.reparsePointDetected = [bool] $reparseCheck.HasReparsePoint
        $hostPreflight.reparsePointPath = $reparseCheck.ReparsePath
        if ($reparseCheck.HasReparsePoint) {
            throw "REPARSE_POINT_DISALLOWED: Reparse point or symlink detected at '$($reparseCheck.ReparsePath)'."
        }

        $preSidecars = Get-DatabaseSidecarSnapshot -FullDbPath $dbFullPath
        $hostPreflight.preSidecarCheck = $preSidecars
        if ($preSidecars.anySidecarPresent) {
            $names = @($preSidecars.detectedSidecars | ForEach-Object { $_.name }) -join ', '
            throw "DISALLOWED_SIDECAR_PRESENT: Found SQLite sidecar file(s) [$names] next to '$dbFullPath'. Stop without opening SQLite."
        }
        Write-IipsOk -Message 'Zero -wal, -shm, or -journal sidecar files present'

        # Check named pipes for a live IPD IPC server
        $detectedPipes = New-Object System.Collections.Generic.List[string]
        try {
            $pipeEntries = @([System.IO.Directory]::GetFiles('\\.\pipe\'))
            foreach ($pipeEntry in $pipeEntries) {
                if ($pipeEntry -match 'iips-user-portfolio') {
                    $detectedPipes.Add([System.IO.Path]::GetFileName($pipeEntry))
                }
            }
        }
        catch {
            Write-IipsInfo -Message 'Named-pipe directory enumeration unavailable; relying on process and FileShare::Read writer lock checks.'
        }
        $hostPreflight.detectedIpdPipes = @($detectedPipes.ToArray())
        $hostPreflight.namedPipeActiveDetected = ($detectedPipes.Count -gt 0)
        if ($hostPreflight.namedPipeActiveDetected) {
            $pipeList = [string]::Join(', ', $detectedPipes)
            throw "ACTIVE_IPD_NAMED_PIPE_DETECTED: Running IPD IPC pipe(s) detected [$pipeList]. Stop IPD/IRR services before read-only inventory."
        }

        # Check running node.exe processes for IPD/provisioning/DB references (record sanitized role labels only)
        $writerRoles = New-Object System.Collections.Generic.List[string]
        $dbLeafEscaped = [regex]::Escape([System.IO.Path]::GetFileName($dbFullPath))
        $nodeProcs = @()
        try {
            $nodeProcs = @(Get-CimInstance -ClassName Win32_Process -Filter "Name = 'node.exe'")
        }
        catch {
            throw "PROCESS_INSPECTION_UNAVAILABLE: Unable to inspect running node.exe processes via Win32_Process ($($_.Exception.Message))."
        }
        foreach ($np in $nodeProcs) {
            if ([int] $np.ProcessId -eq [int] $PID) { continue }
            $cmdLine = [string] $np.CommandLine
            if ([string]::IsNullOrWhiteSpace($cmdLine)) { continue }
            if ($cmdLine -match 'd02-d5-d16-readonly-inventory-runner\.mjs') { continue }
            if (($cmdLine -match 'src[\\/]ipc[\\/]entrypoint') -or ($cmdLine -match 'dist[\\/]src[\\/]ipc[\\/]entrypoint') -or ($cmdLine -match 'iips-user-portfolio')) {
                $writerRoles.Add(("PID:{0}:ipd-ipc-service" -f $np.ProcessId))
                continue
            }
            if ($cmdLine -match 'directP1Provisioning') {
                $writerRoles.Add(("PID:{0}:direct-p1-provisioning" -f $np.ProcessId))
                continue
            }
            if ($cmdLine -match $dbLeafEscaped) {
                $writerRoles.Add(("PID:{0}:references-target-db" -f $np.ProcessId))
            }
        }
        $hostPreflight.potentialWriterProcessCount = $writerRoles.Count
        $hostPreflight.potentialWriterRoleLabels = @($writerRoles.ToArray())
        $hostPreflight.potentialWriterProcessDetected = ($writerRoles.Count -gt 0)
        if ($hostPreflight.potentialWriterProcessDetected) {
            $roleSummary = [string]::Join(', ', $writerRoles)
            throw "POTENTIAL_WRITER_PROCESS_RUNNING: Detected active Node process(es) [$roleSummary]. Refuse concurrent inspection."
        }
        Write-IipsOk -Message 'No active IPD named pipe or writer Node process detected'

        # Open strictly Read with FileShare::Read (fails immediately if any handle holds write access)
        $preInfoBeforeStream = New-Object System.IO.FileInfo($dbFullPath)
        if ($preInfoBeforeStream.Length -lt 100) {
            throw "DATABASE_FILE_TOO_SMALL: '$dbFullPath' is $($preInfoBeforeStream.Length) bytes (< 100-byte SQLite header)."
        }

        try {
            $readStream = [System.IO.File]::Open(
                $dbFullPath,
                [System.IO.FileMode]::Open,
                [System.IO.FileAccess]::Read,
                [System.IO.FileShare]::Read
            )
        }
        catch {
            throw "ACTIVE_WRITER_OR_LOCK_CONFLICT: Unable to acquire read-only FileShare::Read lock on '$dbFullPath' ($($_.Exception.Message))."
        }
        $hostPreflight.exclusiveNoWriterShareCheckOk = $true

        $headerBytes = New-Object byte[] 100
        $headerRead = $readStream.Read($headerBytes, 0, 100)
        if ($headerRead -lt 100) {
            throw "SQLITE_HEADER_SHORT_READ: Read only $headerRead bytes from '$dbFullPath'."
        }

        $expectedMagic = [byte[]](0x53,0x51,0x4C,0x69,0x74,0x65,0x20,0x66,0x6F,0x72,0x6D,0x61,0x74,0x20,0x33,0x00)
        $magicMatches = $true
        for ($idx = 0; $idx -lt 16; $idx += 1) {
            if ($headerBytes[$idx] -ne $expectedMagic[$idx]) {
                $magicMatches = $false
            }
        }
        if (-not $magicMatches) {
            throw "INVALID_SQLITE_MAGIC_HEADER: '$dbFullPath' does not begin with 'SQLite format 3\0'."
        }

        $rawPageSize = ([int] $headerBytes[16] -shl 8) -bor ([int] $headerBytes[17])
        $pageSize = $rawPageSize
        if ($rawPageSize -eq 1) { $pageSize = 65536 }
        $isPow2 = (($pageSize -band ($pageSize - 1)) -eq 0)
        if (($pageSize -lt 512) -or ($pageSize -gt 65536) -or (-not $isPow2)) {
            throw "INVALID_SQLITE_PAGE_SIZE: Header reported invalid page size $pageSize."
        }
        $writeVer = [int] $headerBytes[18]
        $readVer = [int] $headerBytes[19]
        $hostPreflight.sqliteHeaderValid = $true
        $hostPreflight.sqliteHeaderPageSize = $pageSize
        $hostPreflight.sqliteHeaderWriteVersion = $writeVer
        $hostPreflight.sqliteHeaderReadVersion = $readVer
        $hostPreflight.sqliteHeaderRollbackFormatOk = (($writeVer -eq 1) -and ($readVer -eq 1))

        if (-not $hostPreflight.sqliteHeaderRollbackFormatOk) {
            throw "SQLITE_WAL_OR_UNSUPPORTED_HEADER_VERSION: Header versions (write=$writeVer, read=$readVer) are not legacy rollback (1,1); refusing open so SQLite cannot create -shm/-wal sidecars."
        }

        $null = $readStream.Seek(0, [System.IO.SeekOrigin]::Begin)
        $shaEngine = [System.Security.Cryptography.SHA256]::Create()
        $preHashBytes = $shaEngine.ComputeHash($readStream)
        $hostPreflight.psPreSha256 = ([System.BitConverter]::ToString($preHashBytes) -replace '-', '').ToLowerInvariant()

        $shaEngine.Dispose(); $shaEngine = $null
        $readStream.Dispose(); $readStream = $null

        $preInfoAfterStream = New-Object System.IO.FileInfo($dbFullPath)
        $hostPreflight.psPreSizeBytes = [int64] $preInfoAfterStream.Length
        $hostPreflight.psPreLastWriteUtc = $preInfoAfterStream.LastWriteTimeUtc.ToString('yyyy-MM-ddTHH:mm:ss.fffffffZ')

        Write-IipsOk -Message "Valid SQLite 3 rollback-mode file verified (size=$($hostPreflight.psPreSizeBytes) bytes, pre-SHA256=$($hostPreflight.psPreSha256))"
    }
    catch {
        if ($null -ne $shaEngine) { $shaEngine.Dispose(); $shaEngine = $null }
        if ($null -ne $readStream) { $readStream.Dispose(); $readStream = $null }
        $msg = $_.Exception.Message
        Write-IipsWarn -Message $msg
        $failures.Add([pscustomobject]@{
            phase  = '03-db-preflight'
            code   = 'DB_PREFLIGHT_FAILED'
            detail = $msg
        })
    }
    if ($null -ne $shaEngine) { $shaEngine.Dispose(); $shaEngine = $null }
    if ($null -ne $readStream) { $readStream.Dispose(); $readStream = $null }
}

# ----------------------------------------------------------------------------------------------
# Step 04 - Resolve Node >= 22.13.0 and verify node:sqlite readOnly API BEFORE touching DB
# ----------------------------------------------------------------------------------------------
$toolchain = $null
if ($failures.Count -eq 0) {
    Write-IipsStep -Id '04-node-capability' -Message 'Inspecting local Windows Node.js runtime and node:sqlite readOnly API contract'
    try {
        $toolchain = Resolve-IipsNodeToolchain -RequestedNodePath $NodeExecutable
        $hostPreflight.nodeExecutable = $toolchain.NodeExe
        $hostPreflight.nodeVersion = $toolchain.VersionString
        Write-IipsOk -Message "Resolved Node.js $($toolchain.VersionString) at $($toolchain.NodeExe)"

        $probeArgs = @(
            $runnerMjsPath,
            '--mode=capability-probe',
            "--evidence-dir=$evidenceDir"
        )
        $probeRes = Invoke-NativeBinaryCapture -ExecutablePath $toolchain.NodeExe -ArgumentList $probeArgs -WorkingDirectory $evidenceDir
        Write-Utf8NoBomFile -LiteralPath (Join-Path $evidenceDir 'node-capability-probe.stdout.txt') -Content $probeRes.StdOut
        Write-Utf8NoBomFile -LiteralPath (Join-Path $evidenceDir 'node-capability-probe.stderr.txt') -Content $probeRes.StdErr

        if ($probeRes.ExitCode -ne 0) {
            $errTrim = ($probeRes.StdErr.Trim())
            throw "NODE_SQLITE_CAPABILITY_PROBE_FAILED: Exit code $($probeRes.ExitCode). $errTrim"
        }
        Write-IipsOk -Message ($probeRes.StdOut.Trim())
        $hostPreflight.passed = $true
    }
    catch {
        $msg = $_.Exception.Message
        Write-IipsWarn -Message $msg
        $failures.Add([pscustomobject]@{
            phase  = '04-node-capability'
            code   = 'NODE_CAPABILITY_PROBE_FAILED'
            detail = $msg
        })
    }
}

$hostPreflight.completedAtUtc = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$psPreflightPath = Join-Path $evidenceDir 'ps-host-preflight.json'
Write-JsonNoBomFile -LiteralPath $psPreflightPath -InputObject $hostPreflight

# ----------------------------------------------------------------------------------------------
# Step 05 - Execute strictly read-only Q01-Q14 inventory via repository runner
# ----------------------------------------------------------------------------------------------
$runnerExitCode = -1
if ($failures.Count -eq 0) {
    Write-IipsStep -Id '05-run-inventory' -Message 'Executing exact Q01-Q14 read-only query catalog inside BEGIN DEFERRED ... ROLLBACK'
    try {
        $inventoryArgs = @(
            $runnerMjsPath,
            '--mode=inventory',
            "--db-path=$dbFullPath",
            "--evidence-dir=$evidenceDir",
            "--ps-preflight-file=$psPreflightPath"
        )
        $invRes = Invoke-NativeBinaryCapture -ExecutablePath $toolchain.NodeExe -ArgumentList $inventoryArgs -WorkingDirectory $evidenceDir
        $runnerExitCode = $invRes.ExitCode
        Write-Utf8NoBomFile -LiteralPath (Join-Path $evidenceDir 'node-runner.stdout.txt') -Content $invRes.StdOut
        Write-Utf8NoBomFile -LiteralPath (Join-Path $evidenceDir 'node-runner.stderr.txt') -Content $invRes.StdErr

        if ($runnerExitCode -ne 0) {
            $stderrShort = ($invRes.StdErr.Trim())
            throw "NODE_RUNNER_NONZERO_EXIT: Runner exited with code $runnerExitCode. $stderrShort"
        }
        Write-IipsOk -Message ($invRes.StdOut.Trim())
    }
    catch {
        $msg = $_.Exception.Message
        Write-IipsWarn -Message $msg
        $failures.Add([pscustomobject]@{
            phase  = '05-run-inventory'
            code   = 'NODE_INVENTORY_RUNNER_FAILED'
            detail = $msg
        })
    }
}

# ----------------------------------------------------------------------------------------------
# Step 06 - Independent PowerShell postflight SHA-256 and zero-sidecar verification
# ----------------------------------------------------------------------------------------------
$postconditionViolation = $false
if ($hostPreflight.databaseFileExists -and (-not [string]::IsNullOrWhiteSpace($hostPreflight.psPreSha256))) {
    Write-IipsStep -Id '06-postflight-verify' -Message 'Running independent PowerShell postflight SHA-256 and sidecar verification'
    try {
        $postSidecars = Get-DatabaseSidecarSnapshot -FullDbPath $dbFullPath
        $hostPreflight.postSidecarCheck = $postSidecars
        if ($postSidecars.anySidecarPresent) {
            $postconditionViolation = $true
            $sNames = @($postSidecars.detectedSidecars | ForEach-Object { $_.name }) -join ', '
            $failures.Add([pscustomobject]@{
                phase  = '06-postflight-verify'
                code   = 'POSTFLIGHT_SIDECAR_DETECTED'
                detail = "Sidecar file(s) [$sNames] present after read-only inspection."
            })
        }

        $postInfo = New-Object System.IO.FileInfo($dbFullPath)
        $hostPreflight.psPostSizeBytes = [int64] $postInfo.Length
        $hostPreflight.psPostLastWriteUtc = $postInfo.LastWriteTimeUtc.ToString('yyyy-MM-ddTHH:mm:ss.fffffffZ')
        $hostPreflight.psPostSha256 = Get-FileSha256Hex -LiteralPath $dbFullPath

        if ($hostPreflight.psPostSha256 -cne $hostPreflight.psPreSha256) {
            $postconditionViolation = $true
            $failures.Add([pscustomobject]@{
                phase  = '06-postflight-verify'
                code   = 'POSTFLIGHT_SHA256_MISMATCH'
                detail = "Database SHA-256 changed (pre=$($hostPreflight.psPreSha256), post=$($hostPreflight.psPostSha256))."
            })
        }
        if ($hostPreflight.psPostSizeBytes -ne $hostPreflight.psPreSizeBytes) {
            $postconditionViolation = $true
            $failures.Add([pscustomobject]@{
                phase  = '06-postflight-verify'
                code   = 'POSTFLIGHT_SIZE_MISMATCH'
                detail = "Database byte length changed (pre=$($hostPreflight.psPreSizeBytes), post=$($hostPreflight.psPostSizeBytes))."
            })
        }
        if ($hostPreflight.psPostLastWriteUtc -cne $hostPreflight.psPreLastWriteUtc) {
            $postconditionViolation = $true
            $failures.Add([pscustomobject]@{
                phase  = '06-postflight-verify'
                code   = 'POSTFLIGHT_MTIME_MISMATCH'
                detail = "Database LastWriteTimeUtc changed (pre=$($hostPreflight.psPreLastWriteUtc), post=$($hostPreflight.psPostLastWriteUtc))."
            })
        }

        $summaryJsonPath = Join-Path $evidenceDir 'd5-d16-inventory-summary.json'
        if ([System.IO.File]::Exists($summaryJsonPath)) {
            $parsedSummary = Get-Content -LiteralPath $summaryJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ([string] $parsedSummary.databasePreSha256 -cne $hostPreflight.psPreSha256) {
                $postconditionViolation = $true
                $failures.Add([pscustomobject]@{
                    phase  = '06-postflight-verify'
                    code   = 'CROSS_LAYER_PRE_SHA256_MISMATCH'
                    detail = "PowerShell pre-SHA256 ($($hostPreflight.psPreSha256)) disagreed with Node runner pre-SHA256 ($($parsedSummary.databasePreSha256))."
                })
            }
            if ([string] $parsedSummary.databasePostSha256 -cne $hostPreflight.psPostSha256) {
                $postconditionViolation = $true
                $failures.Add([pscustomobject]@{
                    phase  = '06-postflight-verify'
                    code   = 'CROSS_LAYER_POST_SHA256_MISMATCH'
                    detail = "PowerShell post-SHA256 ($($hostPreflight.psPostSha256)) disagreed with Node runner post-SHA256 ($($parsedSummary.databasePostSha256))."
                })
            }
        }

        $postPayload = [ordered]@{
            verifiedAtUtc           = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
            inspectedDatabasePath   = $dbFullPath
            psPreSha256             = $hostPreflight.psPreSha256
            psPostSha256            = $hostPreflight.psPostSha256
            exactSha256Match        = ($hostPreflight.psPreSha256 -ceq $hostPreflight.psPostSha256)
            psPreSizeBytes          = $hostPreflight.psPreSizeBytes
            psPostSizeBytes         = $hostPreflight.psPostSizeBytes
            exactSizeMatch          = ($hostPreflight.psPreSizeBytes -eq $hostPreflight.psPostSizeBytes)
            psPreLastWriteUtc       = $hostPreflight.psPreLastWriteUtc
            psPostLastWriteUtc      = $hostPreflight.psPostLastWriteUtc
            exactLastWriteTimeMatch = ($hostPreflight.psPreLastWriteUtc -ceq $hostPreflight.psPostLastWriteUtc)
            postSidecarCheck        = $postSidecars
            postconditionViolation  = $postconditionViolation
        }
        Write-JsonNoBomFile -LiteralPath (Join-Path $evidenceDir '07-independent-powershell-postflight.json') -InputObject $postPayload

        if (-not $postconditionViolation) {
            Write-IipsOk -Message "Postflight verified: exact SHA-256 match ($($hostPreflight.psPostSha256)) and zero sidecars"
        }
    }
    catch {
        $postconditionViolation = $true
        $msg = $_.Exception.Message
        Write-IipsWarn -Message "Postflight verification threw error: $msg"
        $failures.Add([pscustomobject]@{
            phase  = '06-postflight-verify'
            code   = 'POSTFLIGHT_VERIFICATION_EXCEPTION'
            detail = $msg
        })
    }
}

# ----------------------------------------------------------------------------------------------
# Step 07 - Seal operator log, fallback stop summaries (if needed), and sha256s.txt manifest
# ----------------------------------------------------------------------------------------------
Write-IipsStep -Id '07-seal-manifest' -Message 'Sealing evidence bundle and verifying SHA-256 manifest'

$finalExitCode = 0
$finalOutcome = 'PASS'
$finalDisposition = 'INVENTORY_COMPLETE_READ_ONLY_VERIFIED'
$finalMessage = 'Read-only Q01-Q14 inventory completed with exact pre/post SHA-256 equality and zero sidecars.'

if ($failures.Count -gt 0) {
    $finalOutcome = 'FAIL'
    $finalExitCode = 2
    $finalDisposition = 'STOPPED_PRECONDITION_FAILED'
    $finalMessage = "Stopped fail-closed with $($failures.Count) recorded failure(s); all diagnostic evidence preserved."
}
if (($runnerExitCode -eq 3) -or $postconditionViolation) {
    $finalOutcome = 'FAIL'
    $finalExitCode = 3
    $finalDisposition = 'STOPPED_POSTCONDITION_OR_INTEGRITY_FAILED'
    $finalMessage = 'Stopped due to postcondition or database structural/audit-chain integrity check failure; all evidence preserved.'
}

Write-JsonNoBomFile -LiteralPath $psPreflightPath -InputObject $hostPreflight

if ($finalExitCode -ne 0) {
    Write-FallbackStopArtifactsIfMissing `
        -TargetEvidenceDir $evidenceDir `
        -Disposition $finalDisposition `
        -ExitCode $finalExitCode `
        -InspectedDbPath $dbFullPath `
        -HostPreflight $hostPreflight `
        -Failures @($failures.ToArray())
}

$logBody = ([string]::Join("`n", $script:StepLog)) + "`n"
Write-Utf8NoBomFile -LiteralPath (Join-Path $evidenceDir 'operator-execution.log') -Content $logBody

try {
    $manifestSha256 = Write-SealedSha256Manifest -TargetEvidenceDir $evidenceDir
    Write-IipsOk -Message "sha256s.txt sealed and self-verified (manifest SHA-256: $manifestSha256)"
}
catch {
    $mErr = $_.Exception.Message
    Write-IipsWarn -Message "Manifest sealing failed: $mErr"
    $finalOutcome = 'FAIL'
    if ($finalExitCode -eq 0) { $finalExitCode = 3 }
    $finalDisposition = 'STOPPED_MANIFEST_SEAL_FAILED'
    $finalMessage = "Evidence manifest verification failed: $mErr"
}

$preHexOut = 'N/A'
if (-not [string]::IsNullOrWhiteSpace($hostPreflight.psPreSha256)) {
    $preHexOut = $hostPreflight.psPreSha256
}
$postHexOut = 'N/A'
if (-not [string]::IsNullOrWhiteSpace($hostPreflight.psPostSha256)) {
    $postHexOut = $hostPreflight.psPostSha256
}

$exitCode = Write-IipsFinalStatus `
    -Outcome $finalOutcome `
    -Disposition $finalDisposition `
    -Message $finalMessage `
    -EvidenceDir $evidenceDir `
    -PreSha256 $preHexOut `
    -PostSha256 $postHexOut `
    -ManifestSha256 $manifestSha256 `
    -ExitCode $finalExitCode `
    -SkipPause:$NoPause

exit $exitCode
