#Requires -Version 5.1
<#
.SYNOPSIS
    Direct local P1 user-portfolio SQLite provisioning and verification for IPD on Windows PowerShell 5.1.

.DESCRIPTION
    Authority: IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01

    Provisions and independently verifies the designated single-user SQLite
    user-portfolio database (default C:\iips-data\iips\user-portfolio.sqlite)
    directly from an existing local checkout of ramkivs/iips-production-market-data
    at the exact merged IPD commit.

    Operational guarantees:
      - Windows PowerShell 5.1 compatible.
      - Single outer try/catch control structure.
      - Explicit prerequisite checks before any database mutation.
      - Standard user account operation (no administrator elevation required or requested).
      - Uses existing local IPD checkout (never clones repositories).
      - Never overwrites, truncates, or replaces an existing database file.
      - Supports safe repeat invocation via read-only verification of an already-provisioned database.
      - Preserves step logs, process outputs, and structured JSON diagnostic summaries.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string] $ExpectedCommit,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $RepositoryRoot = (Split-Path -Parent $PSScriptRoot),

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $DatabasePath = 'C:\iips-data\iips\user-portfolio.sqlite',

    [Parameter(Mandatory = $false)]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $DiagnosticRoot = (Join-Path ([System.IO.Path]::GetTempPath()) 'iips-direct-p1-provisioning'),

    [Parameter(Mandatory = $false)]
    [switch] $RequireFreshDatabase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:AuthorityId = 'IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01'
$script:DefaultPreferredNodePath = 'C:\Node22\node-v22.16.0-win-x64\node.exe'
$script:CurrentStep = '00-bootstrap'
$script:RunId = ('direct-p1-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + ([guid]::NewGuid().ToString('N').Substring(0, 8)))
$script:RunLogDir = Join-Path $DiagnosticRoot $script:RunId
$script:LogLines = New-Object System.Collections.Generic.List[string]
$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$script:Diag = [ordered]@{
    authorityId        = $script:AuthorityId
    runId              = $script:RunId
    state              = 'INITIALIZING'
    disposition        = 'NONE'
    startedAtUtc       = [DateTime]::UtcNow.ToString('o')
    completedAtUtc     = $null
    diagnosticDir      = $script:RunLogDir
    hostName           = $env:COMPUTERNAME
    userName           = $env:USERNAME
    psVersion          = $PSVersionTable.PSVersion.ToString()
    isAdministrator    = $false
    repositoryRoot     = $RepositoryRoot
    expectedCommit     = $ExpectedCommit.ToLowerInvariant()
    actualCommit       = $null
    actualTree         = $null
    sourceModulePath   = $null
    sourceModuleSha256 = $null
    compiledCliPath    = $null
    compiledCliSha256  = $null
    nodeExecutable     = $null
    nodeVersion        = $null
    sqliteVersion      = $null
    databasePath       = $DatabasePath
    dbExistedBefore    = $false
    mutated            = $false
    preSha256          = $null
    preSizeBytes       = $null
    finalSha256        = $null
    finalSizeBytes     = $null
    verification       = $null
    failureStep        = $null
    failureMessage     = $null
    failureDetail      = $null
}

function Write-StepLog {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [string] $Message
    )
    $timestamp = [DateTime]::UtcNow.ToString('o')
    $entry = "[$timestamp] [$Step] $Message"
    $script:LogLines.Add($entry)
    Write-Host $entry
}

function Format-ProcessArgument {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Value
    )
    if ($Value.Length -eq 0) {
        return '""'
    }
    $requiresQuotes = ($Value -match '[\s"]')
    if (-not $requiresQuotes) {
        return $Value
    }
    $builder = New-Object System.Text.StringBuilder
    [void] $builder.Append('"')
    $pendingBackslashes = 0
    for ($idx = 0; $idx -lt $Value.Length; $idx += 1) {
        $ch = $Value[$idx]
        $isBackslash = ($ch -eq '\')
        $isQuote = ($ch -eq '"')
        if ($isBackslash) {
            $pendingBackslashes += 1
        }
        if ($isQuote) {
            [void] $builder.Append(('\' * ($pendingBackslashes * 2 + 1)))
            [void] $builder.Append('"')
            $pendingBackslashes = 0
        }
        if ((-not $isBackslash) -and (-not $isQuote)) {
            if ($pendingBackslashes -gt 0) {
                [void] $builder.Append(('\' * $pendingBackslashes))
                $pendingBackslashes = 0
            }
            [void] $builder.Append($ch)
        }
    }
    if ($pendingBackslashes -gt 0) {
        [void] $builder.Append(('\' * ($pendingBackslashes * 2)))
    }
    [void] $builder.Append('"')
    return $builder.ToString()
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]] $ArgumentValues,

        [Parameter(Mandatory = $true)]
        [string] $WorkingDirectory
    )
    $formatted = New-Object System.Collections.Generic.List[string]
    foreach ($argItem in $ArgumentValues) {
        $formatted.Add((Format-ProcessArgument -Value $argItem))
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.Arguments = ($formatted -join ' ')
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    $started = $proc.Start()
    if (-not $started) {
        $proc.Dispose()
        throw "Unable to launch native executable: $FilePath"
    }

    $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
    $stderrTask = $proc.StandardError.ReadToEndAsync()
    $proc.WaitForExit()
    [System.Threading.Tasks.Task]::WaitAll(@($stdoutTask, $stderrTask))

    $returnCode = $proc.ExitCode
    $stdoutText = $stdoutTask.Result
    $stderrText = $stderrTask.Result
    $proc.Dispose()

    return [PSCustomObject]@{
        FilePath   = $FilePath
        ReturnCode = $returnCode
        StdOut     = $stdoutText
        StdErr     = $stderrText
    }
}

function Test-InsideGitWorktree {
    param(
        [Parameter(Mandatory = $true)]
        [string] $CandidateDirectory
    )
    $cursor = [System.IO.Path]::GetFullPath($CandidateDirectory)
    $keepClimbing = $true
    while ($keepClimbing) {
        $gitEntry = Join-Path $cursor '.git'
        if (Test-Path -LiteralPath $gitEntry) {
            return $true
        }
        $parent = [System.IO.Path]::GetDirectoryName($cursor)
        $hasDistinctParent = (-not [string]::IsNullOrEmpty($parent)) -and ($parent -ne $cursor)
        if (-not $hasDistinctParent) {
            $keepClimbing = $false
        }
        if ($hasDistinctParent) {
            $cursor = $parent
        }
    }
    return $false
}

function Test-HasReparsePointOrFileAncestor {
    param(
        [Parameter(Mandatory = $true)]
        [string] $TargetFilePath
    )
    $fullTarget = [System.IO.Path]::GetFullPath($TargetFilePath)
    $parentDir = [System.IO.Path]::GetDirectoryName($fullTarget)
    $segments = New-Object System.Collections.Generic.List[string]
    $cursor = $parentDir
    $keepClimbing = $true
    while ($keepClimbing) {
        $segments.Add($cursor)
        $nextParent = [System.IO.Path]::GetDirectoryName($cursor)
        $hasDistinctParent = (-not [string]::IsNullOrEmpty($nextParent)) -and ($nextParent -ne $cursor)
        if (-not $hasDistinctParent) {
            $keepClimbing = $false
        }
        if ($hasDistinctParent) {
            $cursor = $nextParent
        }
    }

    for ($idx = ($segments.Count - 1); $idx -ge 0; $idx -= 1) {
        $seg = $segments[$idx]
        if (Test-Path -LiteralPath $seg) {
            $item = Get-Item -LiteralPath $seg -Force
            $isReparse = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
            if ($isReparse) {
                throw "STORE_PATH_SYMLINK_UNSUPPORTED: Directory ancestor '$seg' is a symbolic link or junction."
            }
            if (-not $item.PSIsContainer) {
                throw "STORE_PARENT_NOT_DIRECTORY: Ancestor '$seg' exists and is a file rather than a directory."
            }
        }
    }

    if (Test-Path -LiteralPath $fullTarget) {
        $targetItem = Get-Item -LiteralPath $fullTarget -Force
        $targetIsReparse = (($targetItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
        if ($targetIsReparse) {
            throw "STORE_PATH_SYMLINK_UNSUPPORTED: Target path '$fullTarget' is a symbolic link or reparse point."
        }
        if ($targetItem.PSIsContainer) {
            throw "EXISTING_PATH_NOT_REGULAR_FILE: Target path '$fullTarget' is an existing directory, not a regular file."
        }
    }
}

function Save-DiagnosticBundle {
    if (-not (Test-Path -LiteralPath $script:RunLogDir -PathType Container)) {
        [void] (New-Item -ItemType Directory -Path $script:RunLogDir -Force)
    }
    $logFile = Join-Path $script:RunLogDir 'provisioning.log'
    $summaryFile = Join-Path $script:RunLogDir 'diagnostic-summary.json'
    [System.IO.File]::WriteAllLines($logFile, $script:LogLines.ToArray(), $script:Utf8NoBom)
    $summaryJson = ($script:Diag | ConvertTo-Json -Depth 16)
    [System.IO.File]::WriteAllText($summaryFile, ($summaryJson + [Environment]::NewLine), $script:Utf8NoBom)
}

try {
    $script:CurrentStep = '01-init-diagnostics'
    [void] (New-Item -ItemType Directory -Path $script:RunLogDir -Force)
    Write-StepLog -Step $script:CurrentStep -Message "Initialized diagnostic directory at '$($script:RunLogDir)' under authority $($script:AuthorityId)."

    $script:CurrentStep = '02-validate-powershell-and-host'
    $isWindowsPlatform = ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)
    if (-not $isWindowsPlatform) {
        throw 'HOST_UNSUPPORTED: Direct P1 Windows provisioning script requires Windows NT.'
    }
    $isPs51 = (($PSVersionTable.PSVersion.Major -eq 5) -and ($PSVersionTable.PSVersion.Minor -ge 1))
    if (-not $isPs51) {
        throw "POWERSHELL_VERSION_UNSUPPORTED: Expected Windows PowerShell 5.1, observed $($PSVersionTable.PSVersion)."
    }
    $windowsIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $windowsPrincipal = New-Object Security.Principal.WindowsPrincipal($windowsIdentity)
    $script:Diag.isAdministrator = $windowsPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    Write-StepLog -Step $script:CurrentStep -Message "Validated Windows PowerShell $($PSVersionTable.PSVersion) on host '$($env:COMPUTERNAME)' (isAdministrator=$($script:Diag.isAdministrator); administrator elevation is not required)."

    $script:CurrentStep = '03-validate-repository-and-commit'
    if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
        throw 'REPOSITORY_ROOT_INVALID: RepositoryRoot must not be empty.'
    }
    $repoFullPath = [System.IO.Path]::GetFullPath($RepositoryRoot)
    $script:Diag.repositoryRoot = $repoFullPath
    if (-not (Test-Path -LiteralPath $repoFullPath -PathType Container)) {
        throw "REPOSITORY_NOT_FOUND: Existing local IPD checkout was not found at '$repoFullPath'. No repository cloning is performed."
    }

    $gitCmd = Get-Command git.exe -ErrorAction SilentlyContinue
    $gitPath = ''
    if ($null -ne $gitCmd) {
        $gitPath = $gitCmd.Source
    }
    if ([string]::IsNullOrEmpty($gitPath)) {
        $fallbackGit = 'C:\Program Files\Git\cmd\git.exe'
        if (Test-Path -LiteralPath $fallbackGit -PathType Leaf) {
            $gitPath = $fallbackGit
        }
    }
    if ([string]::IsNullOrEmpty($gitPath)) {
        throw 'GIT_DEPENDENCY_MISSING: git.exe was not found on PATH or standard install path.'
    }

    $insideRepo = Invoke-NativeCommand -FilePath $gitPath -ArgumentValues @('-C', $repoFullPath, 'rev-parse', '--is-inside-work-tree') -WorkingDirectory $repoFullPath
    if (($insideRepo.ReturnCode -ne 0) -or ($insideRepo.StdOut.Trim() -cne 'true')) {
        throw "REPOSITORY_INVALID: '$repoFullPath' is not a valid Git working tree."
    }

    $dirtyCheck = Invoke-NativeCommand -FilePath $gitPath -ArgumentValues @('-C', $repoFullPath, 'status', '--porcelain', '--untracked-files=no') -WorkingDirectory $repoFullPath
    if ($dirtyCheck.ReturnCode -ne 0) {
        throw "GIT_STATUS_FAILED: Unable to inspect working tree cleanliness in '$repoFullPath'."
    }
    if (-not [string]::IsNullOrWhiteSpace($dirtyCheck.StdOut)) {
        throw "REPOSITORY_DIRTY: Tracked files in '$repoFullPath' have local modifications. Refusing to run against an altered checkout."
    }

    $headCommitRes = Invoke-NativeCommand -FilePath $gitPath -ArgumentValues @('-C', $repoFullPath, 'rev-parse', '--verify', 'HEAD^{commit}') -WorkingDirectory $repoFullPath
    if ($headCommitRes.ReturnCode -ne 0) {
        throw "GIT_HEAD_RESOLVE_FAILED: Unable to resolve HEAD commit in '$repoFullPath'."
    }
    $actualCommit = $headCommitRes.StdOut.Trim().ToLowerInvariant()
    $expectedCommitNormalized = $ExpectedCommit.Trim().ToLowerInvariant()
    $script:Diag.actualCommit = $actualCommit
    if ($actualCommit -cne $expectedCommitNormalized) {
        throw "COMMIT_MISMATCH: Local IPD HEAD is '$actualCommit', expected exact merged IPD commit '$expectedCommitNormalized'."
    }

    $headTreeRes = Invoke-NativeCommand -FilePath $gitPath -ArgumentValues @('-C', $repoFullPath, 'rev-parse', '--verify', 'HEAD^{tree}') -WorkingDirectory $repoFullPath
    if ($headTreeRes.ReturnCode -ne 0) {
        throw "GIT_TREE_RESOLVE_FAILED: Unable to resolve HEAD tree in '$repoFullPath'."
    }
    $script:Diag.actualTree = $headTreeRes.StdOut.Trim().ToLowerInvariant()

    $sourceModule = Join-Path $repoFullPath 'src\persistence\directP1Provisioning.ts'
    if (-not (Test-Path -LiteralPath $sourceModule -PathType Leaf)) {
        throw "SOURCE_MODULE_MISSING: Expected '$sourceModule' at commit '$actualCommit'."
    }
    $script:Diag.sourceModulePath = $sourceModule
    $script:Diag.sourceModuleSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceModule).Hash.ToLowerInvariant()
    Write-StepLog -Step $script:CurrentStep -Message "Verified clean local IPD checkout at commit '$actualCommit' (tree '$($script:Diag.actualTree)')."

    $script:CurrentStep = '04-validate-node-and-sqlite'
    $resolvedNode = ''
    $hasExplicitNode = (-not [string]::IsNullOrWhiteSpace($NodeExecutable))
    if ($hasExplicitNode) {
        if (-not (Test-Path -LiteralPath $NodeExecutable -PathType Leaf)) {
            throw "NODE_EXECUTABLE_NOT_FOUND: Explicit NodeExecutable '$NodeExecutable' does not exist."
        }
        $resolvedNode = [System.IO.Path]::GetFullPath($NodeExecutable)
    }
    if (-not $hasExplicitNode) {
        if (Test-Path -LiteralPath $script:DefaultPreferredNodePath -PathType Leaf) {
            $resolvedNode = $script:DefaultPreferredNodePath
        }
        if ([string]::IsNullOrEmpty($resolvedNode)) {
            $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
            if ($null -ne $nodeCmd) {
                $resolvedNode = $nodeCmd.Source
            }
        }
    }
    if ([string]::IsNullOrEmpty($resolvedNode)) {
        throw 'NODE_DEPENDENCY_MISSING: Node.js (>= 22.13.0) was not found at C:\Node22\node-v22.16.0-win-x64\node.exe or on PATH.'
    }
    $script:Diag.nodeExecutable = $resolvedNode

    $nodeProbeScript = "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys = ON;'); const fk = db.prepare('PRAGMA foreign_keys').get().foreign_keys; const sv = db.prepare('SELECT sqlite_version() AS v').get().v; db.close(); process.stdout.write(JSON.stringify({ node: process.versions.node, sqlite: sv, fk }) + String.fromCharCode(10));"
    $nodeProbe = Invoke-NativeCommand -FilePath $resolvedNode -ArgumentValues @('-e', $nodeProbeScript) -WorkingDirectory $repoFullPath
    if ($nodeProbe.ReturnCode -ne 0) {
        throw "NODE_SQLITE_PROBE_FAILED: '$resolvedNode' failed built-in node:sqlite probe. StdErr: $($nodeProbe.StdErr.Trim())"
    }
    $probeData = $nodeProbe.StdOut.Trim() | ConvertFrom-Json
    $script:Diag.nodeVersion = [string] $probeData.node
    $script:Diag.sqliteVersion = [string] $probeData.sqlite
    $verParts = $script:Diag.nodeVersion.Split('.')
    $major = [int] ($verParts[0] -replace '[^0-9].*$', '')
    $minor = [int] ($verParts[1] -replace '[^0-9].*$', '')
    $patch = [int] ($verParts[2] -replace '[^0-9].*$', '')
    $versionSupported = ($major -gt 22) -or (($major -eq 22) -and ($minor -gt 13)) -or (($major -eq 22) -and ($minor -eq 13) -and ($patch -ge 0))
    if (-not $versionSupported) {
        throw "NODE_VERSION_UNSUPPORTED: Node.js $($script:Diag.nodeVersion) is below minimum required 22.13.0."
    }
    if ([int] $probeData.fk -ne 1) {
        throw 'SQLITE_FOREIGN_KEYS_UNSUPPORTED: Built-in SQLite did not enable PRAGMA foreign_keys=ON.'
    }
    Write-StepLog -Step $script:CurrentStep -Message "Validated Node.js $($script:Diag.nodeVersion) and built-in SQLite $($script:Diag.sqliteVersion) at '$resolvedNode'."

    $script:CurrentStep = '05-ensure-compiled-entrypoint'
    $tscScript = Join-Path $repoFullPath 'node_modules\typescript\bin\tsc'
    if (-not (Test-Path -LiteralPath $tscScript -PathType Leaf)) {
        throw "TYPESCRIPT_DEPENDENCY_MISSING: '$tscScript' is missing. Run 'npm ci' inside '$repoFullPath' before executing provisioning."
    }
    $compiledCli = Join-Path $repoFullPath 'dist\src\persistence\directP1Provisioning.js'
    $needsCompile = (-not (Test-Path -LiteralPath $compiledCli -PathType Leaf))
    if (-not $needsCompile) {
        $srcTime = (Get-Item -LiteralPath $sourceModule).LastWriteTimeUtc
        $distTime = (Get-Item -LiteralPath $compiledCli).LastWriteTimeUtc
        if ($distTime -lt $srcTime) {
            $needsCompile = $true
        }
    }
    if ($needsCompile) {
        Write-StepLog -Step $script:CurrentStep -Message 'Compiling TypeScript sources into dist/ via local TypeScript compiler before database inspection.'
        $tsconfigPath = Join-Path $repoFullPath 'tsconfig.json'
        $tscRun = Invoke-NativeCommand -FilePath $resolvedNode -ArgumentValues @($tscScript, '-p', $tsconfigPath, '--pretty', 'false') -WorkingDirectory $repoFullPath
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'tsc-stdout.txt'), $tscRun.StdOut, $script:Utf8NoBom)
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'tsc-stderr.txt'), $tscRun.StdErr, $script:Utf8NoBom)
        if ($tscRun.ReturnCode -ne 0) {
            throw "TYPESCRIPT_BUILD_FAILED: tsc returned code $($tscRun.ReturnCode). StdOut: $($tscRun.StdOut.Trim()) StdErr: $($tscRun.StdErr.Trim())"
        }
    }
    if (-not (Test-Path -LiteralPath $compiledCli -PathType Leaf)) {
        throw "COMPILED_CLI_MISSING: Expected compiled entrypoint at '$compiledCli'."
    }
    $script:Diag.compiledCliPath = $compiledCli
    $script:Diag.compiledCliSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $compiledCli).Hash.ToLowerInvariant()
    Write-StepLog -Step $script:CurrentStep -Message "Verified compiled provisioning entrypoint '$compiledCli' (sha256=$($script:Diag.compiledCliSha256))."

    $script:CurrentStep = '06-validate-database-destination'
    if ([string]::IsNullOrWhiteSpace($DatabasePath)) {
        throw 'STORE_PATH_INVALID: DatabasePath must not be empty.'
    }
    if ($DatabasePath.StartsWith('\\')) {
        throw "STORE_PATH_INVALID: UNC, device, and named-pipe paths are refused: '$DatabasePath'."
    }
    if ($DatabasePath -notmatch '^[A-Za-z]:[\\/]') {
        throw "STORE_PATH_INVALID: DatabasePath must be a drive-qualified Windows path: '$DatabasePath'."
    }
    if ($DatabasePath -match '(?:^|[\\/])\.\.(?:[\\/]|$)') {
        throw "STORE_PATH_INVALID: DatabasePath must not contain '..' traversal segments: '$DatabasePath'."
    }
    if ($DatabasePath.EndsWith('\') -or $DatabasePath.EndsWith('/')) {
        throw "STORE_PATH_INVALID: DatabasePath must specify a file name, not a directory: '$DatabasePath'."
    }

    $dbFullPath = [System.IO.Path]::GetFullPath($DatabasePath)
    $dbParentDir = [System.IO.Path]::GetDirectoryName($dbFullPath)
    $driveRoot = [System.IO.Path]::GetPathRoot($dbFullPath)
    $script:Diag.databasePath = $dbFullPath

    $driveInfo = New-Object System.IO.DriveInfo($driveRoot)
    if (-not $driveInfo.IsReady) {
        throw "STORE_DRIVE_NOT_READY: Target drive '$driveRoot' is not ready."
    }
    if ($driveInfo.DriveType -eq [System.IO.DriveType]::Network) {
        throw "STORE_DRIVE_NETWORK_UNSUPPORTED: Network drive '$driveRoot' is not supported for SQLite durability."
    }

    Test-HasReparsePointOrFileAncestor -TargetFilePath $dbFullPath

    if (Test-InsideGitWorktree -CandidateDirectory $dbParentDir) {
        throw "STORE_PATH_IN_GIT_WORKTREE: DatabasePath '$dbFullPath' lies inside a Git worktree."
    }

    $dbExistedBefore = (Test-Path -LiteralPath $dbFullPath -PathType Leaf)
    $script:Diag.dbExistedBefore = $dbExistedBefore

    if ($dbExistedBefore) {
        $existingFileItem = Get-Item -LiteralPath $dbFullPath -Force
        $script:Diag.preSizeBytes = $existingFileItem.Length
        $script:Diag.preSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dbFullPath).Hash.ToLowerInvariant()
        Write-StepLog -Step $script:CurrentStep -Message "Detected existing file at '$dbFullPath' (bytes=$($script:Diag.preSizeBytes), sha256=$($script:Diag.preSha256)); write overwrite is strictly prohibited."
        if ($RequireFreshDatabase.IsPresent) {
            throw "EXISTING_DATABASE_PROTECTED: Database already exists at '$dbFullPath' and -RequireFreshDatabase was specified; existing file preserved untouched."
        }
    }
    if (-not $dbExistedBefore) {
        Write-StepLog -Step $script:CurrentStep -Message "Validated fresh database destination '$dbFullPath' outside Git worktrees."
    }

    $script:Diag.state = 'PREREQUISITES_PASSED'

    $script:CurrentStep = '07-provision-or-protect-existing'
    if ($dbExistedBefore) {
        Write-StepLog -Step $script:CurrentStep -Message "Inspecting existing database strictly read-only (--mode=verify) without opening any write handle."
        $existingVerifyRun = Invoke-NativeCommand -FilePath $resolvedNode -ArgumentValues @($compiledCli, '--mode=verify', "--store=$dbFullPath", '--pretty') -WorkingDirectory $repoFullPath
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'existing-verify-stdout.json'), $existingVerifyRun.StdOut, $script:Utf8NoBom)
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'existing-verify-stderr.txt'), $existingVerifyRun.StdErr, $script:Utf8NoBom)

        $postCheckSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dbFullPath).Hash.ToLowerInvariant()
        if ($postCheckSha256 -cne $script:Diag.preSha256) {
            throw "EXISTING_DATABASE_INTEGRITY_ALERT: Digest changed unexpectedly from '$($script:Diag.preSha256)' to '$postCheckSha256'."
        }
        if ($existingVerifyRun.ReturnCode -ne 0) {
            throw "EXISTING_DATABASE_PROTECTED: Existing file at '$dbFullPath' is not a validly provisioned IPD user-portfolio database and was left completely untouched (sha256=$postCheckSha256). Details: $($existingVerifyRun.StdOut.Trim())"
        }
        $script:Diag.disposition = 'ALREADY_PROVISIONED_VERIFIED'
        $script:Diag.mutated = $false
        Write-StepLog -Step $script:CurrentStep -Message "Existing database is already validly provisioned and passed read-only protection check with identical SHA-256 ($postCheckSha256)."
    }

    if (-not $dbExistedBefore) {
        Write-StepLog -Step $script:CurrentStep -Message "Executing direct local provisioning (--mode=provision) against '$dbFullPath'."
        $provisionRun = Invoke-NativeCommand -FilePath $resolvedNode -ArgumentValues @($compiledCli, '--mode=provision', "--store=$dbFullPath", '--require-fresh', '--pretty') -WorkingDirectory $repoFullPath
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'provision-stdout.json'), $provisionRun.StdOut, $script:Utf8NoBom)
        [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'provision-stderr.txt'), $provisionRun.StdErr, $script:Utf8NoBom)

        if ($provisionRun.ReturnCode -ne 0) {
            throw "DIRECT_PROVISIONING_FAILED: Provisioner returned code $($provisionRun.ReturnCode). Output: $($provisionRun.StdOut.Trim()) StdErr: $($provisionRun.StdErr.Trim())"
        }
        $provisionReport = $provisionRun.StdOut | ConvertFrom-Json
        if ((-not $provisionReport.ok) -or ($provisionReport.status -cne 'PROVISIONED')) {
            throw "DIRECT_PROVISIONING_UNEXPECTED_STATUS: Provisioner reported ok=$($provisionReport.ok), status=$($provisionReport.status)."
        }
        $script:Diag.disposition = 'PROVISIONED'
        $script:Diag.mutated = $true
        Write-StepLog -Step $script:CurrentStep -Message "Fresh user-portfolio SQLite database initialized and provisioned at '$dbFullPath'."
    }

    $script:CurrentStep = '08-independent-post-verification'
    if (-not (Test-Path -LiteralPath $dbFullPath -PathType Leaf)) {
        throw "POST_VERIFICATION_FILE_MISSING: Expected database file at '$dbFullPath'."
    }
    $beforeVerifySha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dbFullPath).Hash.ToLowerInvariant()
    $verifyRun = Invoke-NativeCommand -FilePath $resolvedNode -ArgumentValues @($compiledCli, '--mode=verify', "--store=$dbFullPath", '--pretty') -WorkingDirectory $repoFullPath
    [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'verify-stdout.json'), $verifyRun.StdOut, $script:Utf8NoBom)
    [System.IO.File]::WriteAllText((Join-Path $script:RunLogDir 'verify-stderr.txt'), $verifyRun.StdErr, $script:Utf8NoBom)

    if ($verifyRun.ReturnCode -ne 0) {
        throw "POST_VERIFICATION_FAILED: Independent verifier returned code $($verifyRun.ReturnCode). Output: $($verifyRun.StdOut.Trim())"
    }

    $verifyReport = $verifyRun.StdOut | ConvertFrom-Json
    if ((-not $verifyReport.ok) -or ($verifyReport.status -cne 'VERIFIED')) {
        throw "POST_VERIFICATION_INVALID_STATUS: Verifier reported ok=$($verifyReport.ok), status=$($verifyReport.status)."
    }
    if ([int] $verifyReport.schema.migrationCount -ne 4) {
        throw "POST_VERIFICATION_MIGRATION_COUNT: Expected 4 applied migrations, observed $($verifyReport.schema.migrationCount)."
    }
    if ([string] $verifyReport.schema.integrityCheck -cne 'ok') {
        throw "POST_VERIFICATION_INTEGRITY_CHECK: Expected PRAGMA integrity_check='ok', observed '$($verifyReport.schema.integrityCheck)'."
    }
    if ([int] $verifyReport.schema.foreignKeyViolations -ne 0) {
        throw "POST_VERIFICATION_FK_VIOLATIONS: Observed $($verifyReport.schema.foreignKeyViolations) foreign-key violation(s)."
    }
    if (-not [bool] $verifyReport.schema.writeGuardEnforced) {
        throw 'POST_VERIFICATION_WRITE_GUARD: Expected W-1 write guard enforcement.'
    }
    if ([string] $verifyReport.provisioning.principalLabel -cne 'ramki-personal-local') {
        throw "POST_VERIFICATION_PRINCIPAL_MISMATCH: Observed '$($verifyReport.provisioning.principalLabel)'."
    }
    if ([string] $verifyReport.provisioning.tenantId -cne 'ipd-personal-local') {
        throw "POST_VERIFICATION_TENANT_MISMATCH: Observed '$($verifyReport.provisioning.tenantId)'."
    }
    if ([string] $verifyReport.provisioning.canonicalOwnerId -cne 'ipd-owner-ramki-personal') {
        throw "POST_VERIFICATION_OWNER_MISMATCH: Observed '$($verifyReport.provisioning.canonicalOwnerId)'."
    }
    if ([string] $verifyReport.provisioning.bindingId -cne 'c5808abaffd072d6401ce63ad86c6ac0') {
        throw "POST_VERIFICATION_BINDING_ID_MISMATCH: Observed '$($verifyReport.provisioning.bindingId)'."
    }
    if ([string] $verifyReport.provisioning.membershipId -cne 'd25dcc5370100b00766efc5166f65cf3') {
        throw "POST_VERIFICATION_MEMBERSHIP_ID_MISMATCH: Observed '$($verifyReport.provisioning.membershipId)'."
    }
    if (-not [bool] $verifyReport.provisioning.auditChainValid) {
        throw 'POST_VERIFICATION_AUDIT_CHAIN_INVALID: Audit chain verification did not pass.'
    }

    $afterVerifySha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dbFullPath).Hash.ToLowerInvariant()
    if ($afterVerifySha256 -cne $beforeVerifySha256) {
        throw "POST_VERIFICATION_MUTATION_DETECTED: Read-only verification altered file digest from '$beforeVerifySha256' to '$afterVerifySha256'."
    }
    if ($dbExistedBefore -and ($afterVerifySha256 -cne $script:Diag.preSha256)) {
        throw "EXISTING_DATABASE_MUTATION_DETECTED: Repeat invocation altered existing database digest from '$($script:Diag.preSha256)' to '$afterVerifySha256'."
    }

    $finalItem = Get-Item -LiteralPath $dbFullPath -Force
    $script:Diag.finalSha256 = $afterVerifySha256
    $script:Diag.finalSizeBytes = $finalItem.Length
    $script:Diag.verification = $verifyReport

    $script:CurrentStep = '09-complete'
    $script:Diag.state = 'SUCCESS'
    $script:Diag.completedAtUtc = [DateTime]::UtcNow.ToString('o')
    Save-DiagnosticBundle

    Write-StepLog -Step $script:CurrentStep -Message "Direct P1 provisioning workflow succeeded (disposition=$($script:Diag.disposition), sha256=$afterVerifySha256, bytes=$($finalItem.Length))."
    Write-Host 'DIRECT_P1_PROVISIONING_STATE=SUCCESS'
    Write-Host "DIRECT_P1_PROVISIONING_DISPOSITION=$($script:Diag.disposition)"
    Write-Host "DIRECT_P1_DATABASE_PATH=$dbFullPath"
    Write-Host "DIRECT_P1_DATABASE_SHA256=$afterVerifySha256"
    Write-Host "DIRECT_P1_DIAGNOSTIC_DIR=$($script:RunLogDir)"

    $global:LASTEXITCODE = 0
    return ([PSCustomObject] $script:Diag)
}
catch {
    $errMsg = $_.Exception.Message
    $errFull = ($_ | Out-String).Trim()
    $script:Diag.state = 'FAILURE'
    $script:Diag.completedAtUtc = [DateTime]::UtcNow.ToString('o')
    $script:Diag.failureStep = $script:CurrentStep
    $script:Diag.failureMessage = $errMsg
    $script:Diag.failureDetail = $errFull

    Write-StepLog -Step $script:CurrentStep -Message "FAILURE: $errMsg"
    try {
        Save-DiagnosticBundle
    }
    catch {
        Write-Warning "Secondary error while saving diagnostic bundle to '$($script:RunLogDir)': $($_.Exception.Message)"
    }

    Write-Host 'DIRECT_P1_PROVISIONING_STATE=FAILURE'
    Write-Host "DIRECT_P1_FAILURE_STEP=$($script:CurrentStep)"
    Write-Host "DIRECT_P1_FAILURE_MESSAGE=$errMsg"
    Write-Host "DIRECT_P1_DIAGNOSTIC_DIR=$($script:RunLogDir)"

    $global:LASTEXITCODE = 1
    throw $_
}
