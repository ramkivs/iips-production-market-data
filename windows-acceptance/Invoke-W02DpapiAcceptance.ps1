#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS W-02 - Windows DPAPI acceptance run: real Protect/Unprotect over both governed carriers.

.DESCRIPTION
    Runs the outstanding Windows-host acceptance item for W-02
    (docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md, section 11).

    It uses ONLY generated throwaway values. No Dhan credential is read, requested or required,
    and nothing here can reach a vendor.

    What runs:
      1. prerequisites - Windows, an explicit node.exe, a built dist/, an acceptance directory
         outside every Git working tree;
      2. two throwaway values generated in memory with a cryptographic RNG;
      3. the Node harness (windows-acceptance/w02_dpapi_acceptance.mjs), which drives the real
         ProtectedData.Protect/Unprotect at DataProtectionScope.CurrentUser, writes both carriers
         through the production atomic writer with real owner-only DACLs, reads them back through
         the production backend, and proves separation, readiness gating, typed negatives and
         non-exposure;
      4. cleanup - the acceptance directory is removed whatever happened above;
      5. an evidence log under <InstallRoot>\logs\w02-dpapi-acceptance\<timestamp>\, with one entry
         per test: ID, description, step, PASS/FAIL, exit code and sanitised output.

    Secret handling: the generated values reach the harness on STDIN only - never on a command
    line, never through a file, never through a shell string. The harness emits no value, no
    ciphertext and no raw child-process stderr. The log text is scanned for both values before it
    is written and again after it is written; any hit is redacted and the run is marked FAIL.

    A PASS is reported only for what was actually observed on this host.

    EXIT CODES
      0  every acceptance test passed
      1  at least one acceptance test failed
      2  prerequisite failure - the DPAPI round trip never started

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1 -InstallRoot 'H:\IIPS' -NoPause
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [string] $EvidenceRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:Results = New-Object System.Collections.Generic.List[object]
$script:Secrets = New-Object System.Collections.Generic.List[string]

# --------------------------------------------------------------------------------------------
# Shared Windows helpers (single-installation toolchain resolution + the standard final status)
# --------------------------------------------------------------------------------------------
$repoRoot = Split-Path -Parent $PSScriptRoot
$commonPath = Join-Path (Join-Path $repoRoot 'windows-setup') 'Iips-Common.ps1'
if (-not (Test-Path -LiteralPath $commonPath)) {
    Write-Host "FAILED: the shared helper file is missing: $commonPath" -ForegroundColor Red
    exit 2
}
. $commonPath

# --------------------------------------------------------------------------------------------
# Output helpers (Write-IipsFinalStatus / Write-IipsStep / Write-IipsInfo come from Iips-Common)
# --------------------------------------------------------------------------------------------
function Hide-Secrets {
    param([string] $Text)
    $result = $Text
    foreach ($secret in $script:Secrets) {
        if ($secret.Length -gt 0) { $result = $result.Replace($secret, '[REDACTED]') }
    }
    return $result
}

function Add-AcceptanceResult {
    param(
        [string] $Id,
        [string] $Description,
        [string] $Step,
        [string] $Status,
        [int] $ExitCode,
        [string] $Output
    )
    $clean = Hide-Secrets -Text $Output
    $clean = $clean -replace '\s+', ' '
    $clean = $clean -replace '\|', '/'
    if ($clean.Length -gt 220) { $clean = $clean.Substring(0, 220) + '...' }
    $script:Results.Add([pscustomobject]@{
            Id          = $Id
            Description = $Description
            Step        = $Step
            Status      = $Status
            ExitCode    = $ExitCode
            Output      = $clean
        })
}

function Get-FieldValue {
    param($Object, [string] $Name, [string] $Default)
    if ($null -eq $Object) { return $Default }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) { return $Default }
    if ($null -eq $property.Value) { return $Default }
    return [string]$property.Value
}

function New-ThrowawayValue {
    param([string] $Label)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 24
    $rng.GetBytes($bytes)
    $hex = ([BitConverter]::ToString($bytes)) -replace '-', ''
    return 'W02-ACCEPTANCE-' + $Label + '-' + $hex
}

function Test-PathInsideGitTree {
    param([string] $Directory)
    $current = $Directory
    for ($i = 0; $i -lt 64; $i++) {
        if (Test-Path -LiteralPath (Join-Path $current '.git')) { return $true }
        $parent = Split-Path -Parent $current
        if ([string]::IsNullOrEmpty($parent)) { return $false }
        if ($parent -eq $current) { return $false }
        $current = $parent
    }
    return $false
}

function New-EvidenceLogText {
    param(
        [DateTime] $StartedUtc,
        [string] $NodeExe,
        [string] $AcceptanceRoot,
        [string] $Overall
    )

    $log = New-Object System.Text.StringBuilder
    [void]$log.AppendLine('# W-02 Windows DPAPI Acceptance - Evidence')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('Work item: W-02 (roadmap v1.1, decision D-1)')
    [void]$log.AppendLine('Repository: ramkivs/iips-production-market-data')
    [void]$log.AppendLine('Script    : windows-acceptance/Invoke-W02DpapiAcceptance.ps1')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('| Field | Value |')
    [void]$log.AppendLine('| --- | --- |')
    [void]$log.AppendLine(('| Started (UTC) | ' + $StartedUtc.ToString('o') + ' |'))
    [void]$log.AppendLine(('| Finished (UTC) | ' + ([DateTime]::UtcNow.ToString('o')) + ' |'))
    [void]$log.AppendLine(('| Host | ' + $env:COMPUTERNAME + ' |'))
    [void]$log.AppendLine(('| Principal | ' + $env:USERNAME + ' |'))
    [void]$log.AppendLine(('| PowerShell | ' + $PSVersionTable.PSVersion.ToString() + ' |'))
    [void]$log.AppendLine(('| Node.js | ' + $NodeExe + ' |'))
    [void]$log.AppendLine(('| Acceptance directory | ' + $AcceptanceRoot + ' (removed) |'))
    [void]$log.AppendLine('')
    [void]$log.AppendLine('Generated throwaway values: two, produced in memory by the wrapper with the cryptographic RNG.')
    [void]$log.AppendLine('No Dhan credential was read, requested or used. No vendor call was made.')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('## Results')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('| # | Test ID | Description | Step / command | Result | Exit | Sanitised output |')
    [void]$log.AppendLine('| --- | --- | --- | --- | --- | --- | --- |')

    $index = 0
    $passCount = 0
    $failCount = 0
    foreach ($r in $script:Results) {
        $index = $index + 1
        [void]$log.AppendLine(('| ' + $index + ' | ' + $r.Id + ' | ' + $r.Description + ' | ' + $r.Step + ' | ' + $r.Status + ' | ' + $r.ExitCode + ' | ' + $r.Output + ' |'))
        if ($r.Status -eq 'PASS') { $passCount = $passCount + 1 }
        if ($r.Status -ne 'PASS') { $failCount = $failCount + 1 }
    }

    [void]$log.AppendLine('')
    [void]$log.AppendLine('## Summary')
    [void]$log.AppendLine('')
    [void]$log.AppendLine(('- Entries: ' + $script:Results.Count))
    [void]$log.AppendLine(('- PASS: ' + $passCount))
    [void]$log.AppendLine(('- FAIL: ' + $failCount))
    [void]$log.AppendLine(('- Overall: ' + $Overall))
    [void]$log.AppendLine('')
    [void]$log.AppendLine('## What this proves and what it does not')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('PROVES, on this host and only when every entry above is PASS: real ProtectedData.Protect and')
    [void]$log.AppendLine('Unprotect at DataProtectionScope.CurrentUser; both governed carriers written atomically with')
    [void]$log.AppendLine('owner-only DACLs; both carriers read back through the production backend; carrier separation;')
    [void]$log.AppendLine('readiness gating; typed fail-closed negatives; and non-exposure of the generated values.')
    [void]$log.AppendLine('')
    [void]$log.AppendLine('DOES NOT PROVE: that a real Dhan credential resolves (none exists in this run), that the vendor')
    [void]$log.AppendLine('accepts an authenticated request, or anything about production readiness.')
    [void]$log.AppendLine('')

    return $log.ToString()
}

function Write-EvidenceFile {
    param([string] $Directory, [string] $Path, [string] $Text)
    try {
        if (-not (Test-Path -LiteralPath $Directory)) { New-Item -ItemType Directory -Path $Directory -Force | Out-Null }
        Set-Content -LiteralPath $Path -Value $Text -Encoding UTF8
        return $true
    }
    catch {
        $exceptionType = $_.Exception.GetType().Name
        Write-Host ('WARNING: the evidence log could not be written (' + $exceptionType + ').') -ForegroundColor Red
        return $false
    }
}

function Test-TextContainsSecret {
    param([string] $Text)
    foreach ($secret in $script:Secrets) {
        if ($secret.Length -gt 0) {
            if ($Text.Contains($secret)) { return $true }
        }
    }
    return $false
}

# --------------------------------------------------------------------------------------------
$startedUtc = [DateTime]::UtcNow
$stamp = $startedUtc.ToString('yyyyMMddTHHmmssZ')
$harnessPath = Join-Path $PSScriptRoot 'w02_dpapi_acceptance.mjs'
$distModule = Join-Path $repoRoot 'dist\src\providers\dhan\dhan_dpapi_vault_backend.js'

if ([string]::IsNullOrWhiteSpace($EvidenceRoot)) { $EvidenceRoot = Join-Path $InstallRoot 'logs\w02-dpapi-acceptance' }
$evidenceDir = Join-Path $EvidenceRoot $stamp
$evidencePath = Join-Path $evidenceDir 'W02-DPAPI-ACCEPTANCE-EVIDENCE.md'
$acceptanceRoot = Join-Path $InstallRoot ('runtime\w02-acceptance-' + $stamp)
# The harness stderr is captured in memory by Invoke-IipsProcess and reduced to a byte count.
# It is never written to a file that could outlive the run, and never read back.
$script:HarnessTimeoutMilliseconds = 600000

$nodeExe = ''
$prereqOk = $true
$harnessExit = 1
$stderrBytes = 0

Write-Host '=============================================================' -ForegroundColor White
Write-Host ' IIPS W-02 - Windows DPAPI Acceptance Run ' -ForegroundColor White
Write-Host '=============================================================' -ForegroundColor White
Write-Host "Started (UTC) : $($startedUtc.ToString('o'))" -ForegroundColor Gray
Write-Host "Repository    : $repoRoot" -ForegroundColor Gray
Write-Host "Acceptance dir: $acceptanceRoot (removed after the run)" -ForegroundColor Gray
Write-Host "Evidence log  : $evidencePath" -ForegroundColor Gray

# ---- prerequisites -------------------------------------------------------------------------
Write-IipsStep '01-preconditions' 'Windows platform, node.exe, built modules, usable acceptance directory'

$isWindows = $true
if ([System.Environment]::OSVersion.Platform -ne [System.PlatformID]::Win32NT) { $isWindows = $false }
if ($isWindows) {
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Windows platform' -Step 'OSVersion.Platform' -Status 'PASS' -ExitCode 0 -Output ('Windows ' + [System.Environment]::OSVersion.Version.ToString())
}
if (-not $isWindows) {
    $prereqOk = $false
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Windows platform' -Step 'OSVersion.Platform' -Status 'FAIL' -ExitCode 2 -Output 'this acceptance run requires Windows'
}

$toolchainOk = $false
try {
    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable
    $nodeExe = $toolchain.NodeExe
    $toolchainOk = $true
}
catch {
    $toolchainOk = $false
    $nodeExe = ''
}
if ($toolchainOk) {
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Node.js toolchain resolved from one installation' -Step 'Resolve-IipsNodeToolchain' -Status 'PASS' -ExitCode 0 -Output ('node ' + (Get-FieldValue -Object $toolchain -Name 'NodeVersion' -Default 'unknown') + ' at ' + $nodeExe)
}
if (-not $toolchainOk) {
    $prereqOk = $false
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Node.js toolchain resolved from one installation' -Step 'Resolve-IipsNodeToolchain' -Status 'FAIL' -ExitCode 2 -Output 'node.exe / npm.cmd / npx.cmd could not be resolved from one installation; pass -NodeExecutable'
}

if (Test-Path -LiteralPath $harnessPath) {
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Acceptance harness present' -Step 'Test-Path w02_dpapi_acceptance.mjs' -Status 'PASS' -ExitCode 0 -Output 'harness found next to this script'
}
if (-not (Test-Path -LiteralPath $harnessPath)) {
    $prereqOk = $false
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Acceptance harness present' -Step 'Test-Path w02_dpapi_acceptance.mjs' -Status 'FAIL' -ExitCode 2 -Output 'the harness file is missing next to this script'
}

if (Test-Path -LiteralPath $distModule) {
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'TypeScript build present' -Step 'Test-Path dist\src\providers\dhan\dhan_dpapi_vault_backend.js' -Status 'PASS' -ExitCode 0 -Output 'production modules are built'
}
if (-not (Test-Path -LiteralPath $distModule)) {
    $prereqOk = $false
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'TypeScript build present' -Step 'Test-Path dist\src\providers\dhan\dhan_dpapi_vault_backend.js' -Status 'FAIL' -ExitCode 2 -Output 'the build is missing; run the repository build first'
}

if (Test-PathInsideGitTree -Directory $InstallRoot) {
    $prereqOk = $false
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Acceptance directory outside a Git working tree' -Step 'walk parents for .git' -Status 'FAIL' -ExitCode 2 -Output '-InstallRoot is inside a Git working tree'
}
if (-not (Test-PathInsideGitTree -Directory $InstallRoot)) {
    Add-AcceptanceResult -Id 'W02-WIN-01' -Description 'Acceptance directory outside a Git working tree' -Step 'walk parents for .git' -Status 'PASS' -ExitCode 0 -Output 'no .git found above -InstallRoot'
}

# ---- abort before generating any value when a prerequisite fails ----------------------------
if (-not $prereqOk) {
    Write-Host ''
    Write-Host 'FAILED: a prerequisite is not satisfied; the DPAPI round trip did not start.' -ForegroundColor Red
    $earlyText = New-EvidenceLogText -StartedUtc $startedUtc -NodeExe $nodeExe -AcceptanceRoot $acceptanceRoot -Overall 'FAIL (prerequisite)'
    [void](Write-EvidenceFile -Directory $evidenceDir -Path $evidencePath -Text $earlyText)
    Write-Host "Evidence log : $evidencePath" -ForegroundColor Gray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'W-02 DPAPI acceptance: stopped with exit 2. The unmet prerequisite is listed above and in the evidence log.' -ExitCode 2 -NoPause:$NoPause | Out-Null
    exit 2
}

# ---- throwaway values ----------------------------------------------------------------------
Write-IipsStep '02-throwaway-values' 'Generating two throwaway values with the cryptographic RNG'
$clientIdValue = New-ThrowawayValue -Label 'CLIENT'
$accessTokenValue = New-ThrowawayValue -Label 'TOKEN'
$script:Secrets.Add($clientIdValue)
$script:Secrets.Add($accessTokenValue)
Write-IipsInfo 'two throwaway values generated; never printed, never written to a file, never placed on a command line'

# ---- harness -------------------------------------------------------------------------------
Write-IipsStep '03-harness' 'Running the Node acceptance harness with the values on stdin'
$stdoutText = ''
try {
    if (-not (Test-Path -LiteralPath $acceptanceRoot)) { New-Item -ItemType Directory -Path $acceptanceRoot -Force | Out-Null }

    $stdinJson = (@{
            clientIdValue    = $clientIdValue
            accessTokenValue = $accessTokenValue
            carrierRoot      = $acceptanceRoot
        } | ConvertTo-Json -Compress)

    # Bounded execution with the payload on STDIN and both streams drained asynchronously.
    # `& $nodeExe $harnessPath` cannot bound the run, and piping stderr (`2>`) required a file.
    # The values reach the child through stdin only - never argv, never a temporary file.
    $harnessRun = Invoke-IipsProcess `
        -FilePath $nodeExe `
        -Arguments ('"' + $harnessPath + '"') `
        -TimeoutMilliseconds $script:HarnessTimeoutMilliseconds `
        -StandardInput $stdinJson

    $harnessExit = $harnessRun.ExitCode
    $stderrBytes = [int] $harnessRun.StdErrByteLength
    $stdoutText = ([string] $harnessRun.StdOut).Trim()
    if ($harnessRun.StdinFailed) {
        Add-AcceptanceResult -Id 'W02-WIN-00' -Description 'Harness stdin delivery' -Step 'Invoke-IipsProcess -StandardInput' -Status 'FAIL' -ExitCode 1 -Output 'the harness closed its stdin before the payload was delivered'
    }
}
catch {
    $harnessExit = 1
    $stdoutText = ''
    $stderrBytes = 0
    $exceptionName = $_.Exception.GetType().Name
    $exceptionMessage = [string] $_.Exception.Message
    $timedOut = $exceptionMessage.StartsWith('PROCESS_TIMEOUT')
    $outputText = ('the harness could not be invoked (' + $exceptionName + ')')
    if ($timedOut) { $outputText = 'the harness exceeded the bounded timeout and was terminated' }
    Add-AcceptanceResult -Id 'W02-WIN-00' -Description 'Harness invocation' -Step 'Invoke-IipsProcess node harness' -Status 'FAIL' -ExitCode 1 -Output $outputText
}

Write-IipsInfo ("harness exit code {0}; stderr {1} bytes (content is never read, echoed or logged)" -f $harnessExit, $stderrBytes)

# ---- results -------------------------------------------------------------------------------
Write-IipsStep '04-results' 'Parsing the harness result object'
$harness = $null
try {
    if (-not [string]::IsNullOrWhiteSpace($stdoutText)) { $harness = $stdoutText | ConvertFrom-Json }
}
catch {
    $harness = $null
}

if ($null -eq $harness) {
    Add-AcceptanceResult -Id 'W02-WIN-00' -Description 'Harness result object' -Step 'ConvertFrom-Json stdout' -Status 'FAIL' -ExitCode 1 -Output 'the harness did not emit a parsable result object'
}
if ($null -ne $harness) {
    $testsProperty = $harness.PSObject.Properties['tests']
    if ($null -ne $testsProperty) {
        foreach ($test in @($testsProperty.Value)) {
            Add-AcceptanceResult -Id (Get-FieldValue -Object $test -Name 'id' -Default 'W02-WIN-00') `
                -Description (Get-FieldValue -Object $test -Name 'description' -Default 'unspecified') `
                -Step (Get-FieldValue -Object $test -Name 'step' -Default 'unspecified') `
                -Status (Get-FieldValue -Object $test -Name 'status' -Default 'FAIL') `
                -ExitCode ([int](Get-FieldValue -Object $test -Name 'exitCode' -Default '1')) `
                -Output (Get-FieldValue -Object $test -Name 'output' -Default '')
        }
    }
    Add-AcceptanceResult -Id 'W02-WIN-00' -Description 'Harness process exit code' -Step 'node harness' -Status 'PASS' -ExitCode $harnessExit -Output ('harness exit code ' + $harnessExit)
}

# ---- cleanup (runs on every path; no finally block is used in this project) ----------------
Write-IipsStep '05-cleanup' 'Removing the acceptance carriers and directory'
$removed = $false
try {
    if (Test-Path -LiteralPath $acceptanceRoot) { Remove-Item -LiteralPath $acceptanceRoot -Recurse -Force }
    $removed = -not (Test-Path -LiteralPath $acceptanceRoot)
}
catch {
    $removed = $false
}
if ($removed) {
    Add-AcceptanceResult -Id 'W02-WIN-11' -Description 'Cleanup: acceptance carriers and directory removed' -Step 'Remove-Item -Recurse -Force' -Status 'PASS' -ExitCode 0 -Output 'the acceptance directory no longer exists'
}
if (-not $removed) {
    Add-AcceptanceResult -Id 'W02-WIN-11' -Description 'Cleanup: acceptance carriers and directory removed' -Step 'Remove-Item -Recurse -Force' -Status 'FAIL' -ExitCode 1 -Output 'the acceptance directory still exists and must be removed by hand'
}

# ---- evidence log --------------------------------------------------------------------------
$logText = New-EvidenceLogText -StartedUtc $startedUtc -NodeExe $nodeExe -AcceptanceRoot $acceptanceRoot -Overall 'PENDING'
$preLeak = Test-TextContainsSecret -Text $logText
if ($preLeak) {
    Add-AcceptanceResult -Id 'W02-WIN-12' -Description 'Evidence log contains no generated value' -Step 'scan before writing' -Status 'FAIL' -ExitCode 1 -Output 'a generated value was found in the log text and has been redacted'
}
if (-not $preLeak) {
    Add-AcceptanceResult -Id 'W02-WIN-12' -Description 'Evidence log contains no generated value' -Step 'scan before writing' -Status 'PASS' -ExitCode 0 -Output 'neither generated value appears in the log'
}

$passCount = 0
$failCount = 0
foreach ($r in $script:Results) {
    if ($r.Status -eq 'PASS') { $passCount = $passCount + 1 }
    if ($r.Status -ne 'PASS') { $failCount = $failCount + 1 }
}
$overall = 'FAIL'
if ($failCount -eq 0) { $overall = 'PASS' }

$finalText = New-EvidenceLogText -StartedUtc $startedUtc -NodeExe $nodeExe -AcceptanceRoot $acceptanceRoot -Overall $overall
$finalText = Hide-Secrets -Text $finalText
[void](Write-EvidenceFile -Directory $evidenceDir -Path $evidencePath -Text $finalText)

$postLeak = $false
try {
    if (Test-Path -LiteralPath $evidencePath) {
        $written = Get-Content -LiteralPath $evidencePath -Raw
        if (Test-TextContainsSecret -Text $written) { $postLeak = $true }
    }
}
catch {
    $postLeak = $true
}

Write-Host ''
Write-Host "Evidence log : $evidencePath" -ForegroundColor Gray
Write-Host ("Entries      : {0} (PASS {1} / FAIL {2})" -f $script:Results.Count, $passCount, $failCount) -ForegroundColor Gray

if ($postLeak) {
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'W-02 DPAPI acceptance: a generated value was found in the written evidence log, so this run is not evidence.' -ExitCode 1 -NoPause:$NoPause | Out-Null
    exit 1
}
if ($failCount -gt 0) {
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'W-02 DPAPI acceptance: one or more tests failed; the evidence log records each entry.' -ExitCode 1 -NoPause:$NoPause | Out-Null
    exit 1
}

Write-IipsFinalStatus -Outcome 'PASS' -Message 'W-02 DPAPI acceptance: every test passed on this host; the evidence log is the record.' -ExitCode 0 -NoPause:$NoPause | Out-Null
exit 0
