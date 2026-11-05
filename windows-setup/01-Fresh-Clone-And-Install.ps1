#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 1 of 7: fresh clone, commit verification and dependency installation.

.DESCRIPTION
    Creates a brand-new project directory under H:\IIPS with separate IRR and IPD subdirectories,
    fresh-clones both repositories from authoritative main, VERIFIES THE CLONES AGAINST THE PINNED
    COMMITS these scripts were prepared against, installs every applicable dependency, builds every
    required generated artifact, and verifies the result.

    HARD GUARANTEES
      * Never reuses, overwrites, modifies or deletes an existing checkout. If a target directory
        already exists the script refuses to run and exits 2. Nothing is ever deleted.
      * Never force-pushes, never rewrites history, never moves a ref or a tag.
      * Uses npm.cmd with the committed package-lock.json files (npm ci), never npm install, and
        never a bare `npm`.
      * No Python virtual environment is created: neither repository contains a requirements.txt,
        pyproject.toml, setup.py or environment.yml. This was verified, not assumed.
      * Every critical operation is explicitly validated, with a specific message and a distinct
        exit code. There are no silent failures and no false success messages.

    REPOSITORY VERSION VERIFICATION
      The clones are compared against the pinned commits:
        IRR  9e0a0415b76571fc4db1747b2da63c73fa0447d3
        IPD  b605a61458a655bb555c6f340332fcf77a85c870
      If either repository has advanced, the script prints the exact commit range and the
      ahead/behind counts, then STOPS. Pass -AllowCommitDrift only after you have read the
      differences and decided they are acceptable.

    EXIT CODES
      0  success - all steps completed and verified
      1  unhandled failure (see the console log for the specific step)
      2  precondition failure - target directory exists, or a required tool is missing
      3  clone, commit-pin or working-tree verification failure
      4  dependency installation failure
      5  build or artifact verification failure

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\01-Fresh-Clone-And-Install.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\01-Fresh-Clone-And-Install.ps1 -InstallRoot 'H:\IIPS-2026-11-05' -NodeExecutable 'C:\Node22\node-v22.16.0-win-x64\node.exe'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $IrrRepo = 'https://github.com/ramkivs/iips-review-recovered.git',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $IpdRepo = 'https://github.com/ramkivs/iips-production-market-data.git',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [switch] $AllowCommitDrift,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

$script:IrrDirName = 'iips-review-recovered'
$script:IpdDirName = 'iips-production-market-data'

if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }

function Fail {
    param([Parameter(Mandatory = $true)][string] $Message, [Parameter(Mandatory = $true)][int] $Code)
    Write-Host ''
    Write-Host "FAILED at step [$($script:IipsCurrentStep)]: $Message" -ForegroundColor Red
    Write-Host "Exit code: $Code" -ForegroundColor Red
    $script:IipsStepLog.Add("FAILED [$($script:IipsCurrentStep)]: $Message (exit $Code)")
    Write-IipsStepLog -LogRoot $LogRoot -Prefix '01-install' | Out-Null
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Fresh clone, commit verification, install and build: stopped with exit $Code. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit $Code
}

try {
    $startedAt = Get-Date
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Fresh Clone and Dependency Installation ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-IipsInfo "Host        : $env:COMPUTERNAME"
    Write-IipsInfo "User        : $env:USERNAME"
    Write-IipsInfo "PowerShell  : $($PSVersionTable.PSVersion)"
    Write-IipsInfo "InstallRoot : $InstallRoot"

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '01-preconditions' 'Verifying required tools and the Node.js installation'

    $gitCmd = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($null -eq $gitCmd) { Fail 'git.exe was not found on PATH. Install Git for Windows and retry.' 2 }
    $gitExe = $gitCmd.Source
    Write-IipsOk "git.exe  : $gitExe"

    # node.exe, npm.cmd and npx.cmd resolved from ONE installation, version-checked, mixing-checked.
    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '02-target-guard' 'Confirming no existing checkout will be touched'

    $drive = [System.IO.Path]::GetPathRoot($InstallRoot)
    if (-not (Test-Path -LiteralPath $drive)) { Fail "drive $drive does not exist. Mount the target volume or pass -InstallRoot." 2 }

    $irrDir = Join-Path $InstallRoot $script:IrrDirName
    $ipdDir = Join-Path $InstallRoot $script:IpdDirName

    # Refuse, never overwrite. No cleanup, no deletion, no -Force on the clones.
    if (Test-Path -LiteralPath $irrDir) { Fail "target already exists: $irrDir - this script never overwrites an existing checkout. Choose a different -InstallRoot or remove the directory yourself." 2 }
    if (Test-Path -LiteralPath $ipdDir) { Fail "target already exists: $ipdDir - this script never overwrites an existing checkout. Choose a different -InstallRoot or remove the directory yourself." 2 }
    Write-IipsOk 'neither target exists; nothing will be overwritten'

    if (-not (Test-Path -LiteralPath $InstallRoot)) {
        New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
        Write-IipsOk "created $InstallRoot"
    }
    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '03-clone' 'Fresh-cloning both repositories from authoritative main'

    Invoke-IipsCommand -Executable $gitExe -Arguments @('clone', '--branch', 'main', $IrrRepo, $irrDir) -WorkingDirectory $InstallRoot -Purpose 'IRR clone'
    Invoke-IipsCommand -Executable $gitExe -Arguments @('clone', '--branch', 'main', $IpdRepo, $ipdDir) -WorkingDirectory $InstallRoot -Purpose 'IPD clone'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '04-verify-commits' 'Verifying the clones against the pinned authoritative commits'

    $pins = @(
        @{ Name = 'IRR'; Dir = $irrDir; Expected = $script:IipsExpectedIrrCommit },
        @{ Name = 'IPD'; Dir = $ipdDir; Expected = $script:IipsExpectedIpdCommit }
    )
    $drifted = $false

    foreach ($p in $pins) {
        $result = Test-IipsCommitPin -RepoDir $p.Dir -Label $p.Name -ExpectedCommit $p.Expected -GitExe $gitExe
        Assert-IipsCleanTree -RepoDir $p.Dir -Label $p.Name -GitExe $gitExe

        if (-not $result.Drifted) {
            Write-IipsOk "$($p.Name) is at the pinned commit $($result.Head)"
        }
        if ($result.Drifted) {
            $drifted = $true
            Write-IipsWarn "$($p.Name) has ADVANCED past the pinned commit."
            Write-IipsInfo "     pinned    : $($result.Expected)"
            Write-IipsInfo "     cloned    : $($result.Head)"
            Write-IipsInfo "     ahead/behind (left=pinned, right=cloned): $($result.AheadBehind)"
            Write-IipsInfo '     commits added since the pin:'
            foreach ($line in ($result.LogRange -split "`r?`n")) {
                if ($line.Trim().Length -gt 0) { Write-IipsInfo "       $line" }
            }
        }
    }

    if ($drifted -and -not $AllowCommitDrift) {
        Write-Host ''
        Write-Host 'One or both repositories have advanced beyond the commits these scripts were prepared' -ForegroundColor Yellow
        Write-Host 'against. The differences are listed above. Review them before proceeding: a changed' -ForegroundColor Yellow
        Write-Host 'manifest, port, environment variable or route can invalidate a step below.' -ForegroundColor Yellow
        Write-Host ''
        Write-Host 'To proceed anyway, re-run with -AllowCommitDrift.' -ForegroundColor Yellow
        Fail 'repository commit drift detected and -AllowCommitDrift was not supplied.' 3
    }
    if ($drifted) { Write-IipsWarn 'proceeding past commit drift because -AllowCommitDrift was supplied.' }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '05-install-ipd' 'Installing IPD backend + frontend dependencies'

    $ipdLock = Join-Path $ipdDir 'package-lock.json'
    if (-not (Test-Path -LiteralPath $ipdLock)) { Fail "IPD package-lock.json is missing at $ipdLock - cannot use npm ci." 4 }
    Invoke-IipsCommand -Executable $toolchain.NpmCmd -Arguments @('ci') -WorkingDirectory $ipdDir -Purpose 'IPD npm ci'

    $ipdModules = Join-Path $ipdDir 'node_modules'
    if (-not (Test-Path -LiteralPath $ipdModules)) { Fail 'IPD npm ci reported success but node_modules was not created.' 4 }
    Write-IipsOk 'IPD node_modules created'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '06-install-irr' 'Installing IRR frontend dependencies'

    $irrFrontend = Join-Path $irrDir 'frontend'
    if (-not (Test-Path -LiteralPath $irrFrontend)) { Fail "IRR frontend directory is missing at $irrFrontend." 4 }

    $irrLock = Join-Path $irrFrontend 'package-lock.json'
    if (-not (Test-Path -LiteralPath $irrLock)) { Fail "IRR frontend package-lock.json is missing at $irrLock - cannot use npm ci." 4 }

    # The IRR frontend pins three IPD packages by commit over github: specifiers, so npm invokes
    # git during install. That is expected and is the reason git.exe is a hard precondition.
    Invoke-IipsCommand -Executable $toolchain.NpmCmd -Arguments @('ci') -WorkingDirectory $irrFrontend -Purpose 'IRR frontend npm ci'

    $irrModules = Join-Path $irrFrontend 'node_modules'
    if (-not (Test-Path -LiteralPath $irrModules)) { Fail 'IRR npm ci reported success but node_modules was not created.' 4 }

    foreach ($pkg in @('iips-production-market-data', 'iips-np04-governed-persistence', 'iips-broker-import')) {
        $pkgDir = Join-Path $irrModules $pkg
        if (-not (Test-Path -LiteralPath $pkgDir)) { Fail "IRR dependency '$pkg' was not installed - the github: pinned IPD package did not resolve." 4 }
        Write-IipsOk "IRR pinned IPD package present: $pkg"
    }

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '07-python-check' 'Confirming no Python environment is required'

    $pythonManifests = @()
    foreach ($root in @($irrDir, $ipdDir)) {
        $found = @(Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue -Include 'requirements*.txt', 'pyproject.toml', 'setup.py', 'environment.yml' |
            Where-Object { $_.FullName -notmatch '\\node_modules\\' })
        foreach ($f in $found) { $pythonManifests += $f.FullName }
    }
    if ($pythonManifests.Count -gt 0) {
        Write-Host '    Python manifests were found - a venv may be required:' -ForegroundColor Yellow
        foreach ($m in $pythonManifests) { Write-Host "      $m" -ForegroundColor Yellow }
        Fail 'unexpected Python manifests were found; this script does not guess a venv layout. Add an explicit venv step for these files.' 5
    }
    Write-IipsOk 'no requirements.txt / pyproject.toml / setup.py / environment.yml - no venv created (by design)'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '08-build-artifacts' 'Building required generated artifacts'

    # IRR: .cache/broker-import is produced by build:broker-import and is a hard prerequisite for
    # dev, build, test and typecheck (predev/prebuild/pretest/pretypecheck all invoke it).
    Invoke-IipsCommand -Executable $toolchain.NpmCmd -Arguments @('run', 'build:broker-import') -WorkingDirectory $irrFrontend -Purpose 'IRR build:broker-import'
    $brokerCache = Join-Path $irrFrontend '.cache\broker-import'
    if (-not (Test-Path -LiteralPath $brokerCache)) { Fail "build:broker-import succeeded but $brokerCache was not created." 5 }
    Write-IipsOk "IRR broker-import artifact: $brokerCache"

    # IPD: full build = tsc + vite build + portfolio-ui package + pit package.
    Invoke-IipsCommand -Executable $toolchain.NpmCmd -Arguments @('run', 'build') -WorkingDirectory $ipdDir -Purpose 'IPD build'

    $ipdDist = Join-Path $ipdDir 'dist'
    if (-not (Test-Path -LiteralPath $ipdDist)) { Fail 'IPD build succeeded but dist/ was not created.' 5 }
    Write-IipsOk 'IPD dist/ created'

    foreach ($sub in @('ui\portfolio_ui_package.js', 'pit\package.js')) {
        $p = Join-Path $ipdDist "package\src\$sub"
        if (-not (Test-Path -LiteralPath $p)) { Fail "IPD public package entry is missing: $p" 5 }
        Write-IipsOk "IPD package entry: dist\package\src\$sub"
    }

    # The compiled Gate-3 IPC entrypoint is what step 03 starts for the named pipe.
    $ipcEntrypoint = Join-Path $ipdDist 'src\ipc\entrypoint.js'
    if (-not (Test-Path -LiteralPath $ipcEntrypoint)) { Fail "IPD build succeeded but the IPC entrypoint is missing at $ipcEntrypoint - step 03 -StartIpdIpc would fail." 5 }
    Write-IipsOk "IPD IPC entrypoint: $ipcEntrypoint"

    $ipdFrontendDist = Join-Path $ipdDir 'dist-frontend'
    if (-not (Test-Path -LiteralPath $ipdFrontendDist)) { Fail 'IPD vite build succeeded but dist-frontend/ was not created.' 5 }
    Write-IipsOk 'IPD dist-frontend/ created'

    # -----------------------------------------------------------------------------------------
    Write-IipsStep '09-final-verification' 'Verifying the installation'

    # A fresh checkout plus build artifacts must not have dirtied either tracked tree.
    foreach ($p in $pins) {
        $status = (Invoke-IipsCapture -Executable $gitExe -Arguments @('-C', $p.Dir, 'status', '--porcelain')).Combined
        if ($status.Length -gt 0) {
            Write-Host '    NOTE - untracked build output is present (expected):' -ForegroundColor Yellow
            foreach ($line in ($status -split "`r?`n")) { Write-Host "      $line" -ForegroundColor Yellow }
            $tracked = @($status -split "`r?`n" | Where-Object { $_ -notmatch '^\?\?' })
            if ($tracked.Count -gt 0) { Fail "$($p.Name) has tracked modifications after build - this must not happen:`n$($tracked -join "`n")" 3 }
        }
        Write-IipsOk "$($p.Name) tracked tree still clean"
    }

    Write-IipsStep '10-summary' 'Installation complete'
    Write-Host ''
    Write-Host '  IRR checkout : ' -NoNewline -ForegroundColor White; Write-Host $irrDir -ForegroundColor Green
    Write-Host '  IPD checkout : ' -NoNewline -ForegroundColor White; Write-Host $ipdDir -ForegroundColor Green
    Write-Host '  Node.js      : ' -NoNewline -ForegroundColor White; Write-Host "$($toolchain.NodeExe) ($($toolchain.NodeVersion))" -ForegroundColor Green
    Write-Host '  npm.cmd      : ' -NoNewline -ForegroundColor White; Write-Host $toolchain.NpmCmd -ForegroundColor Green
    Write-Host '  Logs         : ' -NoNewline -ForegroundColor White; Write-Host $LogRoot -ForegroundColor Green
    Write-Host ''
    Write-Host '  Next: 02-Provision-OwnerContext.ps1' -ForegroundColor Yellow
    Write-Host ''
    $elapsed = (Get-Date) - $startedAt
    Write-IipsOk "completed in $([int]$elapsed.TotalSeconds) seconds"
    Write-IipsStepLog -LogRoot $LogRoot -Prefix '01-install' | Out-Null
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'Fresh clone, commit verification, install and build: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    $message = $_.Exception.Message
    $code = 1
    if ($message -match 'never overwrites an existing checkout|could not be found|did not run|below the required floor|installation mixing|is incomplete') { $code = 2 }
    if ($message -match 'not a 40-character SHA|working tree is not clean|tracked modifications|commit drift|rev-parse') { $code = 3 }
    if ($message -match 'npm ci|node_modules|pinned IPD package') { $code = 4 }
    if ($message -match 'build:broker-import|dist|package entry|IPC entrypoint|Python') { $code = 5 }
    Write-Host ''
    Write-Host "Unhandled failure at step [$($script:IipsCurrentStep)]:" -ForegroundColor Red
    Write-Host "  $message" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsStepLog -LogRoot $LogRoot -Prefix '01-install' | Out-Null
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Fresh clone, commit verification, install and build: stopped with exit $code. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit $code
}
