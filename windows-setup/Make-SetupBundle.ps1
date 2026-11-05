#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - build and verify the distributable setup bundle from this source tree.

.DESCRIPTION
    THE BUNDLE IS GENERATED, NEVER HAND-EDITED. This script is the single process that produces the
    distributable archive, its manifest and its checksums, and it refuses to publish anything it
    cannot verify.

    A previous bundle was assembled by hand outside the repository, which is how a downloaded
    archive came to contain a stale 9-file set while the source held 11. This script closes that
    gap: after building, it reopens the archive and compares EVERY entry against the authoritative
    source byte for byte. A mismatch, a missing file or an unexpected extra file stops publication.

    Produces, in -OutputDirectory:
        iips-windows-setup.zip        windows-setup\ (the scripts) + MANIFEST.txt at the root
        iips-windows-setup.tar.gz     same content
        MANIFEST.txt                  file count, pinned commits, SHA-256 and size per file
        SHA256SUMS.txt                SHA-256 for the archives, the manifest and every script

    EXIT CODES
      0  bundle built and independently verified against the source
      1  unhandled failure
      2  precondition failure - source directory or a required tool is missing
      3  verification failure - the built bundle does not match the authoritative source

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Make-SetupBundle.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Make-SetupBundle.ps1 -OutputDirectory H:\IIPS\dist
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $SourceDirectory = $PSScriptRoot,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $OutputDirectory = '',

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

# The bundle must contain exactly these files. Anything else is a packaging defect.
$script:ExpectedFiles = @(
    '00-Validate-PowerShell-Syntax.ps1',
    '01-Fresh-Clone-And-Install.ps1',
    '02-Provision-OwnerContext.ps1',
    '03-Start-IipsServers.ps1',
    '04-Validate-BackendEndpoints.ps1',
    '05-Validate-PersistenceRestart.ps1',
    '06-Stop-IipsServers.ps1',
    'Iips-Common.ps1',
    'Make-SetupBundle.ps1',
    'README.md',
    'WINDOWS-VALIDATION-CHECKLIST.md',
    '.validate-scripts.py'
)

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Bundle Build and Verification ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ''

    $src = (Resolve-Path -LiteralPath $SourceDirectory).Path
    Write-Host "Source : $src" -ForegroundColor Gray

    $out = $OutputDirectory
    if ($out.Length -eq 0) { $out = Join-Path (Split-Path -Parent $src) 'iips-setup-dist' }
    if (-not (Test-Path -LiteralPath $out)) { New-Item -ItemType Directory -Path $out -Force | Out-Null }
    $out = (Resolve-Path -LiteralPath $out).Path
    Write-Host "Output : $out" -ForegroundColor Gray
    Write-Host ''

    # -------------------------------------------------------------------------------------
    Write-IipsStep '01-inventory' 'Inventorying the authoritative source'

    $present = @(Get-ChildItem -LiteralPath $src -File -Force)
    $presentNames = @($present | ForEach-Object { $_.Name })

    $missing = New-Object System.Collections.Generic.List[string]
    foreach ($e in $script:ExpectedFiles) {
        if ($presentNames -notcontains $e) { $missing.Add($e) }
    }
    if ($missing.Count -gt 0) {
        throw "the source directory is missing required file(s): $($missing -join ', ')"
    }
    Write-IipsOk "all $($script:ExpectedFiles.Count) expected files are present"

    $unexpected = New-Object System.Collections.Generic.List[string]
    foreach ($n in $presentNames) {
        if ($script:ExpectedFiles -notcontains $n) { $unexpected.Add($n) }
    }
    if ($unexpected.Count -gt 0) {
        Write-IipsWarn "file(s) present in the source but not in the bundle manifest will be EXCLUDED: $($unexpected -join ', ')"
    }

    # -------------------------------------------------------------------------------------
    Write-IipsStep '02-manifest' 'Writing MANIFEST.txt'

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('IIPS Windows Setup - archive manifest')
    $lines.Add('generated ' + (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))
    $lines.Add('')
    $lines.Add("FILE COUNT: $($script:ExpectedFiles.Count)   (windows-setup\ must contain exactly this many files)")
    $lines.Add('')
    $lines.Add("IRR pin  $($script:IipsExpectedIrrCommit)")
    $lines.Add("IPD pin  $($script:IipsExpectedIpdCommit)")
    $lines.Add("ports    IRR frontend $($script:IipsFrontendPort), transport $($script:IipsTransportPort), IPD shell $($script:IipsIpdShellPort)")
    $lines.Add("         port $($script:IipsArthaVaultPort) belongs to ArthaVault and is never used by IIPS")
    $lines.Add('')
    $lines.Add('sha256                                                            size      file')
    foreach ($e in ($script:ExpectedFiles | Sort-Object)) {
        $bytes = [System.IO.File]::ReadAllBytes((Join-Path $src $e))
        $sha = (Get-FileHash -LiteralPath (Join-Path $src $e) -Algorithm SHA256).Hash.ToLowerInvariant()
        $lines.Add(('{0}  {1,8}  windows-setup/{2}' -f $sha, $bytes.Length, $e))
    }
    $lines.Add('')

    $manifestPath = Join-Path $out 'MANIFEST.txt'
    Set-Content -LiteralPath $manifestPath -Value ($lines -join "`r`n") -Encoding UTF8
    Write-IipsOk "MANIFEST.txt written for $($script:ExpectedFiles.Count) files"

    # -------------------------------------------------------------------------------------
    Write-IipsStep '03-stage' 'Staging the archive payload'

    $stage = Join-Path $out ('stage-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    $stagePkg = Join-Path $stage 'windows-setup'
    New-Item -ItemType Directory -Path $stagePkg -Force | Out-Null
    foreach ($e in $script:ExpectedFiles) {
        Copy-Item -LiteralPath (Join-Path $src $e) -Destination (Join-Path $stagePkg $e) -Force
    }
    Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $stage 'MANIFEST.txt') -Force
    $stagedCount = @(Get-ChildItem -LiteralPath $stagePkg -File -Force).Count
    if ($stagedCount -ne $script:ExpectedFiles.Count) {
        throw "staged $stagedCount files but expected $($script:ExpectedFiles.Count)"
    }
    Write-IipsOk "staged $stagedCount files under windows-setup\"

    # -------------------------------------------------------------------------------------
    Write-IipsStep '04-archive' 'Building the archives'

    $zipPath = Join-Path $out 'iips-windows-setup.zip'
    $tarPath = Join-Path $out 'iips-windows-setup.tar.gz'
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    if (Test-Path -LiteralPath $tarPath) { Remove-Item -LiteralPath $tarPath -Force }

    Compress-Archive -Path (Join-Path $stage 'windows-setup'), (Join-Path $stage 'MANIFEST.txt') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-IipsOk "zip  : $zipPath"

    $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
    if (-not (Test-Path -LiteralPath $tar)) { throw "tar.exe was not found at $tar. Windows 10 1803 and later ship it; without it the tar.gz cannot be produced." }
    Push-Location -LiteralPath $stage
    & $tar -czf $tarPath 'windows-setup' 'MANIFEST.txt'
    $tarExit = $LASTEXITCODE
    Pop-Location
    if ($tarExit -ne 0) { throw "tar.exe failed with exit $tarExit while building the tar.gz." }
    Write-IipsOk "tar  : $tarPath"

    # -------------------------------------------------------------------------------------
    Write-IipsStep '05-verify' 'Verifying the built bundle against the authoritative source'

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $verified = 0
    $problems = New-Object System.Collections.Generic.List[string]
    try {
        foreach ($entry in $archive.Entries) {
            if ($entry.FullName.EndsWith('/')) { continue }
            $relative = $entry.FullName -replace '^windows-setup/', ''
            if ($entry.FullName -eq 'MANIFEST.txt') { continue }
            if ($script:ExpectedFiles -notcontains $relative) {
                $problems.Add("unexpected entry in the archive: $($entry.FullName)")
                continue
            }
            $expected = Join-Path $src $relative
            if (-not (Test-Path -LiteralPath $expected)) {
                $problems.Add("archive entry $relative has no source counterpart")
                continue
            }
            $ms = New-Object System.IO.MemoryStream
            $es = $entry.Open()
            try { $es.CopyTo($ms) }
            catch { $problems.Add("could not read archive entry $relative : $($_.Exception.Message)") }
            $es.Dispose()
            $actualBytes = $ms.ToArray()
            $ms.Dispose()
            $sourceBytes = [System.IO.File]::ReadAllBytes($expected)
            $actualSha = [System.BitConverter]::ToString(([System.Security.Cryptography.SHA256]::Create()).ComputeHash($actualBytes)).Replace('-', '').ToLowerInvariant()
            $sourceSha = [System.BitConverter]::ToString(([System.Security.Cryptography.SHA256]::Create()).ComputeHash($sourceBytes)).Replace('-', '').ToLowerInvariant()
            if ($actualSha -ne $sourceSha) {
                $problems.Add("BYTE MISMATCH in $relative")
                continue
            }
            $verified++
        }
    }
    catch { $problems.Add("could not inspect the archive: $($_.Exception.Message)") }
    $archive.Dispose()

    if ($verified -ne $script:ExpectedFiles.Count) {
        $problems.Add("verified $verified entries but the source holds $($script:ExpectedFiles.Count) files")
    }
    if ($problems.Count -gt 0) {
        foreach ($p in $problems) { Write-IipsWarn $p }
        throw "the built bundle does not match the authoritative source ($($problems.Count) problem(s)). Nothing was published as verified."
    }
    Write-IipsOk "all $verified archive entries are byte-identical to the source"

    # -------------------------------------------------------------------------------------
    Write-IipsStep '06-checksums' 'Writing SHA256SUMS.txt'

    $sums = New-Object System.Collections.Generic.List[string]
    $sums.Add('# IIPS Windows Setup - SHA-256 checksums')
    $sums.Add('# generated ' + (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))
    $sums.Add('# verify:  Get-FileHash -Algorithm SHA256 <file>')
    $sums.Add('')
    foreach ($f in @('iips-windows-setup.zip', 'iips-windows-setup.tar.gz', 'MANIFEST.txt')) {
        $fp = Join-Path $out $f
        $sums.Add(((Get-FileHash -LiteralPath $fp -Algorithm SHA256).Hash.ToLowerInvariant()) + '  ' + $f)
    }
    foreach ($e in ($script:ExpectedFiles | Sort-Object)) {
        $sums.Add(((Get-FileHash -LiteralPath (Join-Path $src $e) -Algorithm SHA256).Hash.ToLowerInvariant()) + '  windows-setup/' + $e)
    }
    $sumsPath = Join-Path $out 'SHA256SUMS.txt'
    Set-Content -LiteralPath $sumsPath -Value ($sums -join "`r`n") -Encoding UTF8
    Write-IipsOk "SHA256SUMS.txt written"

    Remove-Item -LiteralPath $stage -Recurse -Force

    # -------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host 'Published artifacts:' -ForegroundColor Cyan
    foreach ($f in @('iips-windows-setup.zip', 'iips-windows-setup.tar.gz', 'MANIFEST.txt', 'SHA256SUMS.txt')) {
        $fp = Join-Path $out $f
        Write-Host ("  {0,-28} {1,10:N0} B  {2}" -f $f, (Get-Item -LiteralPath $fp).Length, (Get-FileHash -LiteralPath $fp -Algorithm SHA256).Hash.ToLowerInvariant()) -ForegroundColor Gray
    }

    $code = Write-IipsFinalStatus -Outcome 'PASS' -Message "bundle built and verified: $($script:ExpectedFiles.Count) files, byte-identical to $src" -NoPause:$NoPause
    exit $code
}
catch {
    Write-Host ''
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    $code = 1
    if ($_.Exception.Message -match 'missing required file|was not found') { $code = 2 }
    if ($_.Exception.Message -match 'does not match the authoritative source|BYTE MISMATCH|staged') { $code = 3 }
    $code = Write-IipsFinalStatus -Outcome 'FAIL' -Message 'bundle build stopped; nothing was published as verified.' -ExitCode $code -NoPause:$NoPause
    exit $code
}
