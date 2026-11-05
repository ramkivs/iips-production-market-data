#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 2 of 6: provision the personal application principal (owner context).

.DESCRIPTION
    IIPS has no login screen. routes.ts states: "No session or identity gate is part of route
    resolution." The single authorised user is expressed as a governed OWNER-CONTEXT CARRIER - a
    byte-exact JSON file materialised from merged repository code and bound to a pinned SHA-256.

    This script materialises both carriers by calling the repositories' own exported functions, so
    the bytes can never be hand-typed or drift:
      * materialiseOwnerContextCarrier(dir)  -> <dir>\owner-context.json          (363 bytes)
      * materialiseReportsOwnerCarrier(dir)  -> <dir>\reports-owner-context.json  (384 bytes)

    Both functions REFUSE a target inside a Git working tree (owner-context-carrier.ts:110-124), so
    the carriers are written to <InstallRoot>\runtime\ - outside both clones - and can never be
    committed.

    The script then verifies each file against the byte length and SHA-256 constant that the
    repository itself pins, read live from the source rather than hardcoded here.

    It is non-destructive: an existing carrier with the correct digest is accepted as-is; a file
    with a WRONG digest is reported and the script exits without overwriting it.

    EXIT CODES
      0  both carriers present and verified
      1  unhandled failure
      2  precondition failure - checkout missing, tool missing, or runtime root unusable
      3  materialisation or digest verification failure

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\02-Provision-OwnerContext.ps1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $RuntimeRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $NodeExecutable = '',

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

$script:CurrentStep = '00-bootstrap'
$script:StepLog = New-Object System.Collections.Generic.List[string]

if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
if ([string]::IsNullOrWhiteSpace($LogRoot)) { $LogRoot = Join-Path $InstallRoot 'logs' }

function Write-Step {
    param([Parameter(Mandatory = $true)][string] $Id, [Parameter(Mandatory = $true)][string] $Message)
    $script:CurrentStep = $Id
    $line = "[$Id] $Message"
    Write-Host ''
    Write-Host "==> $line" -ForegroundColor Cyan
    $script:StepLog.Add($line)
}
function Write-Ok {
    param([Parameter(Mandatory = $true)][string] $Message)
    Write-Host "    OK   $Message" -ForegroundColor Green
    $script:StepLog.Add("    OK   $Message")
}
function Write-Info {
    param([Parameter(Mandatory = $true)][string] $Message)
    Write-Host "         $Message" -ForegroundColor Gray
    $script:StepLog.Add("         $Message")
}
function Write-StepLogFile {
    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $path = Join-Path $LogRoot ("02-owner-context-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
    $script:StepLog | Set-Content -LiteralPath $path -Encoding UTF8
    Write-Host ''
    Write-Host "Execution log written to: $path" -ForegroundColor Yellow
}

# Reads a single exported string/number constant straight out of a TypeScript source file.
function Read-RepoConstant {
    param(
        [Parameter(Mandatory = $true)][string] $Path,
        [Parameter(Mandatory = $true)][string] $Name
    )
    if (-not (Test-Path -LiteralPath $Path)) { throw "source file not found: $Path" }
    $text = Get-Content -LiteralPath $Path -Raw
    $m = [regex]::Match($text, "export\s+const\s+$Name\s*(:\s*[^=]+)?=\s*'([^']+)'")
    if ($m.Success) { return $m.Groups[2].Value }
    $m2 = [regex]::Match($text, "export\s+const\s+$Name\s*(:\s*[^=]+)?=\s*(\d+)")
    if ($m2.Success) { return $m2.Groups[2].Value }
    throw "could not read the constant '$Name' from $Path - refusing to guess a value."
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Owner Context Provisioning ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-Info "RuntimeRoot : $RuntimeRoot"

    # -----------------------------------------------------------------------------------------
    Write-Step '01-preconditions' 'Locating the IRR checkout'

    $irrFrontend = Join-Path $InstallRoot 'iips-review-recovered\frontend'
    if (-not (Test-Path -LiteralPath $irrFrontend)) {
        Write-Host "FAILED: IRR frontend not found at $irrFrontend" -ForegroundColor Red
        Write-Host '        Run 01-Fresh-Clone-And-Install.ps1 first, or pass -InstallRoot.' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Owner-context provisioning: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }
    Write-Ok "IRR frontend: $irrFrontend"

    # npx.cmd resolved from the SAME Node.js installation as node.exe and npm.cmd, with the
    # version floor and the anti-mixing check applied. A bare `npx` is never invoked.
    $toolchain = Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable

    $ownerCarrierSrc = Join-Path $irrFrontend 'server\owner-context-carrier.ts'
    $reportsCarrierSrc = Join-Path $irrFrontend 'server\reports-owner-carrier.ts'
    if (-not (Test-Path -LiteralPath $ownerCarrierSrc)) { Write-Host "FAILED: missing $ownerCarrierSrc" -ForegroundColor Red; exit 2 }
    if (-not (Test-Path -LiteralPath $reportsCarrierSrc)) { Write-Host "FAILED: missing $reportsCarrierSrc" -ForegroundColor Red; exit 2 }

    # -----------------------------------------------------------------------------------------
    Write-Step '02-read-contracts' 'Reading the pinned carrier contracts from repository source'

    $ownerBytes = [int](Read-RepoConstant -Path $ownerCarrierSrc -Name 'CANONICAL_CARRIER_BYTE_LENGTH')
    $ownerSha = (Read-RepoConstant -Path $ownerCarrierSrc -Name 'OWNER_CONTEXT_CARRIER_SHA256').ToLowerInvariant()
    $ownerFile = Read-RepoConstant -Path $ownerCarrierSrc -Name 'OWNER_CONTEXT_CARRIER_FILENAME'
    $ownerUser = Read-RepoConstant -Path $ownerCarrierSrc -Name 'APPROVED_OWNER_USER_ID'
    $ownerTenant = Read-RepoConstant -Path $ownerCarrierSrc -Name 'APPROVED_TENANT_ID'

    $reportsBytes = [int](Read-RepoConstant -Path $reportsCarrierSrc -Name 'CANONICAL_REPORTS_CARRIER_BYTE_LENGTH')
    $reportsSha = (Read-RepoConstant -Path $reportsCarrierSrc -Name 'REPORTS_OWNER_CARRIER_SHA256').ToLowerInvariant()
    $reportsFile = Read-RepoConstant -Path $reportsCarrierSrc -Name 'REPORTS_OWNER_CARRIER_FILENAME'

    Write-Ok "owner-context.json    : $ownerBytes bytes, sha256 $($ownerSha.Substring(0,16))..."
    Write-Ok "reports-owner-*.json  : $reportsBytes bytes, sha256 $($reportsSha.Substring(0,16))..."
    Write-Info "principal: ownerUserId=$ownerUser  tenantId=$ownerTenant"

    # -----------------------------------------------------------------------------------------
    Write-Step '03-prepare-dirs' 'Preparing the runtime directories outside both Git trees'

    $ownerDir = Join-Path $RuntimeRoot 'owner-context'
    $reportsDir = Join-Path $RuntimeRoot 'reports-owner'
    $dataDir = Join-Path $RuntimeRoot 'iips-data'
    $np04Dir = Join-Path $RuntimeRoot 'np04'

    foreach ($d in @($RuntimeRoot, $ownerDir, $reportsDir, $dataDir, $np04Dir)) {
        if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    }
    Write-Ok "runtime tree ready under $RuntimeRoot"
    Write-Info 'iips-data, owner-context, reports-owner, np04'

    # -----------------------------------------------------------------------------------------
    Write-Step '04-materialise' 'Materialising both carriers via the repositories own functions'

    $targets = @(
        @{ Name = 'owner-context'; Dir = $ownerDir; Module = './server/owner-context-carrier.ts'; Fn = 'materialiseOwnerContextCarrier'; File = $ownerFile; Bytes = $ownerBytes; Sha = $ownerSha },
        @{ Name = 'reports-owner'; Dir = $reportsDir; Module = './server/reports-owner-carrier.ts'; Fn = 'materialiseReportsOwnerCarrier'; File = $reportsFile; Bytes = $reportsBytes; Sha = $reportsSha }
    )

    foreach ($t in $targets) {
        $targetPath = Join-Path $t.Dir $t.File

        # Non-destructive: verify an existing file instead of overwriting it.
        $alreadyGood = $false
        if (Test-Path -LiteralPath $targetPath) {
            $existing = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash.ToLowerInvariant()
            $existingLen = (Get-Item -LiteralPath $targetPath).Length
            if ($existing -eq $t.Sha -and $existingLen -eq $t.Bytes) {
                Write-Ok "$($t.Name): already present and digest-verified - left untouched"
                $alreadyGood = $true
            }
            if (-not $alreadyGood) {
                Write-Host "FAILED: $targetPath exists but does NOT match the pinned digest." -ForegroundColor Red
                Write-Host "        expected sha256 $($t.Sha) / $($t.Bytes) bytes" -ForegroundColor Red
                Write-Host "        actual   sha256 $existing / $existingLen bytes" -ForegroundColor Red
                Write-Host '        This script never overwrites a file. Remove it yourself if you intend to re-materialise.' -ForegroundColor Red
                Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Owner-context provisioning: stopped with exit 3. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
                exit 3
            }
        }

        if (-not $alreadyGood) {
            # Forward slashes are used deliberately: Node accepts them on Windows, and it removes
            # every backslash-escape ambiguity from the generated JavaScript string literal.
            $jsDir = $t.Dir -replace '\\', '/'
            $expr = "import('$($t.Module)').then(m => { process.stdout.write(m.$($t.Fn)('$jsDir')); }).catch(e => { process.stderr.write(String(e)); process.exit(1); })"
            # The absolute npx.cmd path is verified BEFORE the location is pushed, so the invocation
            # cannot fail to start and strand the location stack (no `finally` is permitted here).
            if (-not (Test-Path -LiteralPath $toolchain.NpxCmd)) { throw "npx.cmd was resolved to '$($toolchain.NpxCmd)' but that file does not exist." }
            Write-Info "RUN  & '$($toolchain.NpxCmd)' tsx -e <materialise $($t.Name)>"
            Write-Info "     from: $irrFrontend   (node.exe: $($toolchain.NodeExe))"
            # Start-Process based capture: the materialiser writes to stderr on failure, and under
            # $ErrorActionPreference = 'Stop' a piped 2>&1 would abort this script instead of
            # reporting the failure.
            $cap = Invoke-IipsCapture -Executable $toolchain.NpxCmd -Arguments @('tsx', '-e', $expr) -WorkingDirectory $irrFrontend -TempRoot $RuntimeRoot
            $out = $cap.Combined
            $code = $cap.ExitCode
            if ($code -ne 0) { throw "materialise$($t.Name) failed (exit $code): $($out.Trim())" }
            Write-Info "     returned: $($out.Trim())"

            if (-not (Test-Path -LiteralPath $targetPath)) { throw "materialisation reported success but $targetPath was not created." }

            $actualLen = (Get-Item -LiteralPath $targetPath).Length
            if ($actualLen -ne $t.Bytes) { throw "$($t.Name) byte length is $actualLen, expected $($t.Bytes). Canonical bytes must be byte-exact." }
            $actualSha = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($actualSha -ne $t.Sha) { throw "$($t.Name) digest mismatch: got $actualSha, expected $($t.Sha)." }

            Write-Ok "$($t.Name): $targetPath"
            Write-Info "     $actualLen bytes, sha256 verified against the repository constant"
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-Step '05-content-check' 'Confirming the personal principal values'

    $ownerJson = Get-Content -LiteralPath (Join-Path $ownerDir $ownerFile) -Raw | ConvertFrom-Json
    if ($ownerJson.ownerUserId -ne $ownerUser) { throw "ownerUserId is '$($ownerJson.ownerUserId)', expected '$ownerUser'." }
    if ($ownerJson.tenantId -ne $ownerTenant) { throw "tenantId is '$($ownerJson.tenantId)', expected '$ownerTenant'." }
    Write-Ok "ownerUserId = $($ownerJson.ownerUserId)"
    Write-Ok "tenantId    = $($ownerJson.tenantId)"

    # -----------------------------------------------------------------------------------------
    Write-Step '06-summary' 'Owner context provisioned'
    Write-Host ''
    Write-Host '  Set these for the IRR transport:' -ForegroundColor White
    Write-Host "    IIPS_OWNER_CONTEXT_PATH = $(Join-Path $ownerDir $ownerFile)" -ForegroundColor Green
    Write-Host "    IIPS_REPORTS_OWNER_PATH = $(Join-Path $reportsDir $reportsFile)" -ForegroundColor Green
    Write-Host "    IIPS_DATA_DIR           = $dataDir" -ForegroundColor Green
    Write-Host "    IIPS_NP04_DATABASE_PATH = $(Join-Path $np04Dir 'reports.sqlite')" -ForegroundColor Green
    Write-Host ''
    Write-Host '  03-Start-IipsServers.ps1 sets all of these automatically.' -ForegroundColor Yellow
    Write-Host ''
    Write-StepLogFile
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'Owner-context provisioning: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    Write-Host ''
    Write-Host "Unhandled failure at step [$($script:CurrentStep)]:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-StepLogFile
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Owner-context provisioning: stopped with exit 1. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 1
}
