#Requires -Version 5.1
<#
.SYNOPSIS
Offline, bounded IPD Stage 4 evidence collection. Does not execute product code.
.DESCRIPTION
Run as the ordinary service operator. Supply existing local log directories and
an existing dedicated output directory. No recursion, probes, database handles,
or environment collection. Raw command arguments and log values are not emitted.
Exit 0: bounded collection complete (historical evidence can remain unavailable).
Exit 2: missing inputs, denied access, instability, or configured limits reached.
Exit 3: invalid configuration or report publication failure.
#>
[CmdletBinding()]
param(
    [string] $RepositoryRoot = 'H:\IIPS\iips-production-market-data',
    [ValidateCount(1, 8)] [string[]] $LogDirectories = @(),
    [string] $OutputDirectory = '',
    [ValidateRange(1, 128)] [int] $MaxFiles = 64,
    [ValidateRange(1024, 4194304)] [int] $MaxLogBytes = 1048576,
    [ValidateRange(1, 100)] [int] $MaxMatchesPerFile = 20,
    [ValidateRange(1, 500)] [int] $MaxMatchesTotal = 100
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:Incomplete = $false
$script:Issues = New-Object System.Collections.Generic.List[object]
$script:TotalMatchCount = 0
$script:KnownKeys = @('v','op','payload','requestId','portfolioId','expectedRevision','holdings','contentDigest','fileName','sourceBroker','importedAt','mode','symbol','isin','exchange','series','quantity','averageBuyPrice','currentPrice','marketValue','weightPercentage','active','lineageDigest','owner','ownerId','tenant','tenantId','companyId','runtimeCompanyId','identityStatus','resolutionDisposition','identity','scope','request','metadata','declaredLength','actualUtf8Length','trailingData','connectedAt','writeAt','closedAt','commit','headCommit','buildCommit','protocolVersion','operation')
$script:Signals = @('MALFORMED_FRAME','OVERSIZE_FRAME','PROTOCOL_VERSION_UNSUPPORTED','UNKNOWN_OPERATION','CALLER_SUPPLIED_AUTHORITY','BINDING_ABSENT','BINDING_INVALID','CAPACITY_EXCEEDED','IDLE_TIMEOUT','UNAVAILABLE','WRITE_NOT_AUTHORIZED','ipc-class-p-refusal','EPIPE','ECONNRESET','ETIMEDOUT','ERR_STREAM_DESTROYED','UnhandledPromiseRejection','unhandled rejection','socket error','connection drop','write failed','startup refused','listening on')

function Add-Issue {
    param([string] $Subject, [string] $Reason)
    $script:Incomplete = $true
    $script:Issues.Add([ordered]@{ classification = 'UNAVAILABLE'; subject = $Subject; reason = $Reason })
}

function Get-ErrorKind {
    param($Record)
    if ($Record.Exception -is [System.UnauthorizedAccessException]) { return 'ACCESS_DENIED' }
    if ($Record.CategoryInfo.Category -eq 'PermissionDenied') { return 'ACCESS_DENIED' }
    if ($Record.CategoryInfo.Category -eq 'ObjectNotFound') { return 'FILE_OR_DIRECTORY_MISSING' }
    if (@('INVALID_LOCAL_PATH','LOCAL_FIXED_DRIVE_REQUIRED','REPARSE_POINT_REFUSED','FILE_SIZE_LIMIT','OUTPUT_MUST_BE_OUTSIDE_LOG_DIRECTORIES') -contains $Record.Exception.Message) { return $Record.Exception.Message }
    return ('READ_FAILED_' + $Record.Exception.GetType().Name + '_AT_LINE_' + $Record.InvocationInfo.ScriptLineNumber)
}

function Get-LocalPath {
    param([string] $Path)
    if ($Path -notmatch '^[A-Za-z]:\\' -or $Path -match '[\x00-\x1f]' -or $Path.Substring(2).Contains(':')) { throw 'INVALID_LOCAL_PATH' }
    $Full = [System.IO.Path]::GetFullPath($Path)
    $Drive = New-Object System.IO.DriveInfo ([System.IO.Path]::GetPathRoot($Full))
    if ($Drive.DriveType -ne [System.IO.DriveType]::Fixed) { throw 'LOCAL_FIXED_DRIVE_REQUIRED' }
    $Cursor = $Full
    while ($Cursor.Length -gt 0) {
        if (Test-Path -LiteralPath $Cursor) {
            $Item = Get-Item -LiteralPath $Cursor -Force
            if (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'REPARSE_POINT_REFUSED' }
        }
        $Parent = [System.IO.Path]::GetDirectoryName($Cursor)
        if ([string]::IsNullOrEmpty($Parent)) { break }
        $Cursor = $Parent
    }
    return $Full
}

function Read-BoundedBytes {
    param([string] $Path, [int] $Limit)
    $Safe = Get-LocalPath $Path
    $Stream = [System.IO.File]::Open($Safe, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, ([System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete))
    try {
        $Bytes = New-Object byte[] ($Limit + 1)
        $Total = 0
        while ($Total -lt $Bytes.Length) {
            $Read = $Stream.Read($Bytes, $Total, ($Bytes.Length - $Total))
            if ($Read -eq 0) { break }
            $Total += $Read
        }
        $Stream.Dispose()
        if ($Total -gt $Limit) { throw 'FILE_SIZE_LIMIT' }
        $Copy = New-Object byte[] $Total
        [Array]::Copy($Bytes, $Copy, $Total)
        return ,$Copy
    }
    catch { $Stream.Dispose(); throw }
}

function Get-FileEvidence {
    param([string] $Path, [long] $Limit)
    try {
        $Safe = Get-LocalPath $Path
        $Item = Get-Item -LiteralPath $Safe -Force
        if ($Item.PSIsContainer) { throw 'EXPECTED_FILE' }
        if ($Item.Length -gt $Limit) { Add-Issue $Safe 'FILE_SIZE_LIMIT'; return $null }
        $Data = Read-BoundedBytes $Safe ([int] $Limit)
        $Hasher = [System.Security.Cryptography.SHA256]::Create()
        try { $Hash = [BitConverter]::ToString($Hasher.ComputeHash($Data)).Replace('-', ''); $Hasher.Dispose() }
        catch { $Hasher.Dispose(); throw }
        $After = Get-Item -LiteralPath $Safe -Force
        if ($Item.Length -ne $After.Length -or $Item.LastWriteTimeUtc -ne $After.LastWriteTimeUtc) { Add-Issue $Safe 'FILE_CHANGED_DURING_HASH'; return $null }
        return [ordered]@{ classification = 'CONFIRMED'; path = $Safe; bytes = $Item.Length; creationTimeUtc = $Item.CreationTimeUtc.ToString('o'); lastWriteTimeUtc = $Item.LastWriteTimeUtc.ToString('o'); sha256 = $Hash; provenance = 'CURRENT_FILE_ONLY_NOT_PROOF_OF_LOADED_INCIDENT_ARTIFACT' }
    }
    catch { Add-Issue $Path (Get-ErrorKind $_); return $null }
}

function Get-SafeTimestamp {
    param($Value)
    if ($Value -isnot [string] -or $Value -notmatch '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?(?:Z|[+-]\d\d:\d\d)$') { return $null }
    $Parsed = [DateTimeOffset]::MinValue
    if ([DateTimeOffset]::TryParse($Value, [ref] $Parsed)) { return $Parsed.ToUniversalTime().ToString('o') }
    return $null
}

function Get-RetainedMetadata {
    param($Json)
    $Result = [ordered]@{ classification = 'INCONCLUSIVE'; source = 'RETAINED_JSON_ONLY_NOT_RECONSTRUCTED'; protocolVersion = $null; operation = $null; requestIdType = 'UNAVAILABLE'; keyNames = @(); declaredLength = $null; actualUtf8Length = $null; trailingData = $null; connectedAt = $null; writeAt = $null; closedAt = $null; claimedCommit = $null }
    $Names = New-Object 'System.Collections.Generic.HashSet[string]'
    $Queue = New-Object System.Collections.Queue
    $Queue.Enqueue(@{ value = $Json; depth = 0 })
    $Visited = 0
    while ($Queue.Count -gt 0 -and $Visited -lt 512) {
        $Entry = $Queue.Dequeue(); $Visited++
        if ($Entry.depth -gt 12) { Add-Issue 'retained-json' 'METADATA_DEPTH_LIMIT'; continue }
        $Value = $Entry.value
        if ($Value -is [System.Array]) {
            foreach ($Child in $Value) { if ($Queue.Count -lt 512) { $Queue.Enqueue(@{ value = $Child; depth = ($Entry.depth + 1) }) } }
            if ($Value.Count -gt 512) { Add-Issue 'retained-json' 'METADATA_ARRAY_LIMIT' }
            continue
        }
        if ($Value -isnot [System.Management.Automation.PSCustomObject]) { continue }
        foreach ($Property in $Value.PSObject.Properties) {
            $Key = $Property.Name; $Raw = $Property.Value
            $Label = '[unrecognized-key-redacted]'
            if ($script:KnownKeys -contains $Key) { $Label = $Key }
            [void] $Names.Add(('depth' + $Entry.depth + ':' + $Label))
            if (@('v','protocolVersion') -contains $Key) { if ($Raw -is [int] -and @(1,2) -contains $Raw) { $Result.protocolVersion = $Raw } }
            if (@('op','operation') -contains $Key) { if (@('portfolio.importBroker','portfolio.get','portfolio.list','portfolio.revisions') -contains $Raw) { $Result.operation = $Raw } }
            if ($Key -eq 'requestId') {
                $Result.requestIdType = 'null'
                if ($null -ne $Raw) { $Result.requestIdType = $Raw.GetType().Name }
            }
            if (@('declaredLength','actualUtf8Length') -contains $Key) {
                if (($Raw -is [int] -or $Raw -is [long]) -and $Raw -ge 0 -and $Raw -le 16777216) { $Result[$Key] = $Raw }
            }
            if ($Key -eq 'trailingData' -and $Raw -is [bool]) { $Result.trailingData = $Raw }
            if (@('connectedAt','writeAt','closedAt') -contains $Key) { $Result[$Key] = Get-SafeTimestamp $Raw }
            if (@('commit','headCommit','buildCommit') -contains $Key -and $Raw -is [string] -and $Raw -cmatch '^[0-9a-f]{40}$') { $Result.claimedCommit = $Raw }
            if (($Raw -is [System.Array] -or $Raw -is [System.Management.Automation.PSCustomObject]) -and $Queue.Count -lt 512) { $Queue.Enqueue(@{ value = $Raw; depth = ($Entry.depth + 1) }) }
        }
    }
    if ($Queue.Count -gt 0) { Add-Issue 'retained-json' 'METADATA_NODE_LIMIT' }
    $Result.keyNames = @($Names | Sort-Object)
    return $Result
}

function Get-LogEvidence {
    param([string] $Path)
    $Info = Get-FileEvidence $Path $MaxLogBytes
    if ($null -eq $Info) { return $null }
    $Hits = New-Object System.Collections.Generic.List[object]
    $Metadata = $null
    try {
        $Text = [System.Text.Encoding]::UTF8.GetString((Read-BoundedBytes $Path $MaxLogBytes))
        $Number = 0
        foreach ($Line in ($Text -split '\r?\n')) {
            $Number++
            $Found = @($script:Signals | Where-Object { $Line.IndexOf($_, [StringComparison]::OrdinalIgnoreCase) -ge 0 })
            if ($Found.Count -eq 0) { continue }
            if ($Hits.Count -ge $MaxMatchesPerFile -or $script:TotalMatchCount -ge $MaxMatchesTotal) { Add-Issue $Path 'MATCH_LIMIT_REACHED'; break }
            $Timestamp = $null
            if ($Line -match '(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?(?:Z|[+-]\d\d:\d\d))') { $Timestamp = Get-SafeTimestamp $Matches[1] }
            $Hits.Add([ordered]@{ lineNumber = $Number; timestampUtc = $Timestamp; matchingLine = '[VALUES REDACTED] ' + ($Found -join ' | '); classification = 'CONFIRMED' })
            $script:TotalMatchCount++
        }
        if ([System.IO.Path]::GetExtension($Path) -eq '.json') {
            try { $Metadata = Get-RetainedMetadata ($Text | ConvertFrom-Json) }
            catch { Add-Issue $Path 'INVALID_OR_UNREADABLE_RETAINED_JSON' }
        }
        $After = Get-Item -LiteralPath $Path -Force
        if ($After.Length -ne $Info.bytes -or $After.LastWriteTimeUtc.ToString('o') -ne $Info.lastWriteTimeUtc) { Add-Issue $Path 'FILE_CHANGED_DURING_READ' }
        return [ordered]@{ file = $Info; matches = @($Hits.ToArray()); retainedMetadata = $Metadata }
    }
    catch { Add-Issue $Path (Get-ErrorKind $_); return $null }
}

function Get-ProcessEvidence {
    param([string] $EntryPath)
    $Result = New-Object System.Collections.Generic.List[object]
    try {
        $Candidates = @(Get-CimInstance -ClassName Win32_Process -Filter "Name='node.exe'")
        if ($Candidates.Count -gt 128) { Add-Issue 'process-query' 'PROCESS_COUNT_LIMIT'; return @() }
        foreach ($Process in ($Candidates | Sort-Object ProcessId)) {
            $Command = [string] $Process.CommandLine
            $Pattern = '(?i)(?:^|[\s"' + "'" + '])' + [regex]::Escape($EntryPath) + '(?:$|[\s"' + "'" + '])'
            if ($Command -notmatch $Pattern) { continue }
            if ([string]::IsNullOrEmpty([string] $Process.ExecutablePath) -or [System.IO.Path]::GetFileName($Process.ExecutablePath) -ine 'node.exe') { Add-Issue 'process-query' 'EXECUTABLE_IDENTITY_UNAVAILABLE'; continue }
            $Again = Get-CimInstance -ClassName Win32_Process -Filter ('ProcessId=' + [int] $Process.ProcessId)
            if ($null -eq $Again -or $Again.CreationDate -ne $Process.CreationDate -or $Again.CommandLine -cne $Process.CommandLine) { Add-Issue 'process-query' 'PROCESS_IDENTITY_CHANGED'; continue }
            $ParentEvidence = [ordered]@{ classification = 'UNAVAILABLE'; reason = 'PARENT_EXITED_OR_PID_REUSED' }
            $Parent = Get-CimInstance -ClassName Win32_Process -Filter ('ProcessId=' + [int] $Process.ParentProcessId)
            if ($null -ne $Parent -and $null -ne $Parent.CreationDate -and $Parent.CreationDate -le $Process.CreationDate) {
                $ParentName = '[NAME REDACTED]'
                if (@('powershell.exe','pwsh.exe','cmd.exe','node.exe','explorer.exe','services.exe') -contains $Parent.Name) { $ParentName = $Parent.Name }
                $ParentEvidence = [ordered]@{ classification = 'INCONCLUSIVE'; pid = $Parent.ProcessId; name = $ParentName; startTimeUtc = $Parent.CreationDate.ToUniversalTime().ToString('o'); executable = '[PATH REDACTED]'; commandLine = '[ARGUMENTS REDACTED]'; reason = 'CURRENT_PARENT_CANDIDATE_NOT_HISTORICAL_PROOF' }
            }
            $Result.Add([ordered]@{ classification = 'CONFIRMED'; pid = $Process.ProcessId; incidentPidMatches = ($Process.ProcessId -eq 14484); executable = $Process.ExecutablePath; commandLine = ('node.exe "' + $EntryPath + '" [OTHER ARGUMENTS REDACTED]'); startTimeUtc = $Process.CreationDate.ToUniversalTime().ToString('o'); workingDirectory = 'UNAVAILABLE: Win32_Process does not expose process working directory'; parent = $ParentEvidence; historicalIdentity = 'INCONCLUSIVE: current path and PID do not certify loaded incident-time bytes' })
        }
        if ($Result.Count -eq 0) { Add-Issue 'IPD-provider' 'NO_VERIFIED_CURRENT_PROVIDER_OR_COMMAND_LINE_INACCESSIBLE' }
    }
    catch { Add-Issue 'process-query' (Get-ErrorKind $_) }
    return @($Result.ToArray())
}

try {
    if ($LogDirectories.Count -lt 1) { throw 'EXPLICIT_LOG_DIRECTORIES_REQUIRED' }
    $Repo = Get-LocalPath $RepositoryRoot
    $Output = Get-LocalPath $OutputDirectory
    if (-not (Test-Path -LiteralPath $Repo -PathType Container) -or -not (Test-Path -LiteralPath $Output -PathType Container)) { throw 'EXISTING_REPOSITORY_AND_OUTPUT_DIRECTORIES_REQUIRED' }
    if ($Output.Equals($Repo, [StringComparison]::OrdinalIgnoreCase) -or $Output.StartsWith($Repo.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'OUTPUT_MUST_BE_OUTSIDE_REPOSITORY' }
    if ([System.IO.Path]::GetFileName($Output.TrimEnd('\')) -ne 'ipd-stage4-evidence') { throw 'DEDICATED_OUTPUT_DIRECTORY_NAME_REQUIRED' }
    $Logs = New-Object System.Collections.Generic.List[object]
    $Artifacts = New-Object System.Collections.Generic.List[object]
    $Names = @('ipc\entrypoint.js','ipc\dispatch.js','ipc\protocol.js','ipc\endpoint.js','ipc\brokerImportConsumer.js','ipc\brokerImportComposition.js','persistence\brokerImportPersistence.js','persistence\durablePortfolioStorePort.js','persistence\localSingleUserAuthorization.js','persistence\portfolio_store.js','persistence\binding.js')
    foreach ($Name in $Names) { $Evidence = Get-FileEvidence (Join-Path $Repo ('dist\src\' + $Name)) 16777216; if ($null -ne $Evidence) { $Artifacts.Add($Evidence) } }
    $Processes = @(Get-ProcessEvidence (Join-Path $Repo 'dist\src\ipc\entrypoint.js'))
    $Seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $Count = 0
    foreach ($Directory in ($LogDirectories | Sort-Object -Unique)) {
        try {
            $SafeDirectory = Get-LocalPath $Directory
            if ($SafeDirectory.TrimEnd('\') -eq [System.IO.Path]::GetPathRoot($SafeDirectory).TrimEnd('\')) { throw 'LOG_DRIVE_ROOT_REFUSED' }
            if ($Output.Equals($SafeDirectory, [StringComparison]::OrdinalIgnoreCase) -or $Output.StartsWith($SafeDirectory.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'OUTPUT_MUST_BE_OUTSIDE_LOG_DIRECTORIES' }
            if (-not (Test-Path -LiteralPath $SafeDirectory -PathType Container)) { Add-Issue $Directory 'LOG_DIRECTORY_MISSING'; continue }
            # Enumerate only this explicitly selected directory, never descendants.
            $Iterator = [System.IO.Directory]::EnumerateFiles($SafeDirectory).GetEnumerator()
            $Scanned = 0
            $LocalMatched = 0
            $Selected = New-Object System.Collections.Generic.List[string]
            while ($Iterator.MoveNext()) {
                $Scanned++
                if ($Scanned -gt 1024) { Add-Issue $Directory 'DIRECTORY_ENTRY_LIMIT'; break }
                $Path = $Iterator.Current
                $Leaf = [System.IO.Path]::GetFileName($Path)
                if ($Leaf -notmatch '(?i)^(?:irr-transport\.err\.log|03-start-[0-9-]+\.log|[a-z0-9_.-]*(?:ipc|broker|build|start|provenance|request)[a-z0-9_.-]*\.(?:log|json|txt))$') { continue }
                $LocalMatched++
                $Selected.Add($Path)
            }
            $Iterator.Dispose()
            foreach ($Path in ($Selected | Sort-Object)) {
                if (-not $Seen.Add($Path)) { continue }
                if ($Count -ge $MaxFiles) { Add-Issue $Directory 'FILE_COUNT_LIMIT'; break }
                $Count++
                $Log = Get-LogEvidence $Path
                if ($null -ne $Log) { $Logs.Add($Log) }
            }
            if ($LocalMatched -eq 0) { Add-Issue $Directory 'NO_ALLOWLISTED_FILES_IN_DIRECTORY' }
        }
        catch { Add-Issue $Directory (Get-ErrorKind $_) }
    }
    if ($Count -eq 0) { Add-Issue 'logs' 'NO_ALLOWLISTED_FILES_FOUND' }
    $State = 'COLLECTION_COMPLETE_NOT_INCIDENT_RESOLVED'
    $ExitCode = 0
    if ($script:Incomplete) { $State = 'PARTIAL_COLLECTION'; $ExitCode = 2 }
    $Report = [ordered]@{
        formatVersion = 1; collectedAtUtc = [DateTime]::UtcNow.ToString('o'); state = $State
        sourceAuthority = '29a789a07132c03ebb43bdfa862d113b04f4d924 (incident reference, not verification of current HEAD)'
        incident = 'PID 14484; 2026-11-11 startup evidence; original trigger NOT YET PROVEN'
        processes = $Processes; artifacts = @($Artifacts.ToArray()); logs = @($Logs.ToArray()); issues = @($script:Issues.ToArray())
        limitations = @('CONFIRMED means observed now, not incident attribution','Current artifact hashes cannot recover incident-time loaded bytes','Working directory and raw command arguments are not collected via invasive process reads','Class P sink is bounded process memory; cannot recover it from a different process','Absent retained frame lengths and timing remain UNAVAILABLE; requests are never reconstructed','Unknown JSON keys and all raw log values are suppressed; key paths include depth only','Both existing import IDs remain quarantined; no reproduction authorized')
    }
    $ReportPath = Join-Path $Output ('ipd-stage4-class-p-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N') + '.json')
    $Bytes = (New-Object System.Text.UTF8Encoding($false)).GetBytes(($Report | ConvertTo-Json -Depth 16))
    $Stream = [System.IO.File]::Open($ReportPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try { $Stream.Write($Bytes, 0, $Bytes.Length); $Stream.Dispose() }
    catch { $Stream.Dispose(); throw 'REPORT_WRITE_FAILED' }
    Write-Output ('IPD evidence: ' + $State + '; report: ' + $ReportPath)
    exit $ExitCode
}
catch {
    Write-Error 'Evidence collection failed (configuration or publication). No product action was performed. Check explicit local paths, permissions and available disk space.' -ErrorAction Continue
    exit 3
}
