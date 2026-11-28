#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS D-18 Diagnostic B - Authenticated capture-path diagnostic for AGI Greenpac (NSE_EQ / 1412).

.DESCRIPTION
    Inspects the IPD market-data daemon on loopback (default 127.0.0.1:8791) across:
      - GET  /v1/health
      - GET  /v1/diagnostics
      - GET  /v1/freshness (scoped to D01_QUOTES / EQ_AGI_IN / NSE_EQ / ISIN:INE415A01038:EQ)
      - GET  /v1/trace/ring
      - Capture output file and sibling .arm marker
      - Newest ipd-market-data-daemon.err.log sanitized lines (looking for [dhan-depth-capture])

    READ-ONLY BY DEFAULT:
      Without -SendSingleQuote, this script performs ZERO vendor requests and ZERO quote requests.
      It evaluates whether the daemon is ready to capture or whether a pre-existing blocker
      (cached CURRENT quote, absent .arm marker, DISABLED_PRE_ACCESS egress, auth latch, etc.)
      would prevent capture.

    CONTROLLED SINGLE-QUOTE MODE (-SendSingleQuote):
      Sends EXACTLY ONE authenticated POST /v1/quotes for AGI Greenpac, captures full BEFORE
      and AFTER snapshots of /v1/diagnostics (including vendorRequestsTotal and quoteCacheHits),
      /v1/freshness, /v1/trace/ring, agi-depth.json, agi-depth.json.arm, and newly appended
      daemon stderr lines, then outputs a deterministic diagnosis code distinguishing:
        - CAPTURE_SUCCEEDED
        - CACHE_HIT_NO_VENDOR_CALL (HTTP 200 served from cache; Dhan never called)
        - VENDOR_REQUEST_FAILED_NON_2XX (HTTP != 200 or provider failure before capture hook)
        - VENDOR_CALL_SUCCEEDED_BUT_CAPTURE_NOT_WRITTEN (Dhan returned 200, capture hook skipped/failed)
        - PREFLIGHT_ABORT_CACHE_CURRENT (refused before quote because cache already CURRENT)

    SECURITY:
      - Reads $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN only to build the loopback Authorization header.
      - Never prints, logs, or writes tokens, client IDs, access tokens, or vault references.

    EXIT CODES
      0  completed cleanly (read-only preflight done, OR -SendSingleQuote captured successfully)
      1  unhandled error
      2  precondition failure (missing transport token, invalid output path, or daemon unreachable)
      3  diagnostic detected a capture-path failure or refusal

.EXAMPLE
    # Read-only preflight (zero vendor requests):
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Test-D18CapturePath.ps1 -NoPause

.EXAMPLE
    # Controlled single-quote test (issues exactly one POST /v1/quotes for AGI) with JSON report:
    Set-Location 'H:\IIPS\iips-production-market-data'
    powershell -ExecutionPolicy Bypass -File .\scripts\Test-D18CapturePath.ps1 `
      -InstallRoot 'H:\IIPS' -SendSingleQuote `
      -OutputFile 'H:\IIPS\runtime\dhan-d18-diagnostics\capture-path.json' -NoPause
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $InstallRoot = 'H:\IIPS',

    [Parameter(Mandatory = $false)]
    [string] $RuntimeRoot = '',

    [Parameter(Mandatory = $false)]
    [string] $LogRoot = '',

    [Parameter(Mandatory = $false)]
    [ValidateSet('127.0.0.1', 'localhost')]
    [string] $BindAddress = '127.0.0.1',

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $MarketDataPort = 8791,

    [Parameter(Mandatory = $false)]
    [string] $CapturePath = '',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $CompanyId = 'EQ_AGI_IN',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $SecurityId = 'ISIN:INE415A01038:EQ',

    [Parameter(Mandatory = $false)]
    [ValidateSet('NSE_EQ', 'BSE_EQ')]
    [string] $ExchangeSegment = 'NSE_EQ',

    [Parameter(Mandatory = $false)]
    [ValidatePattern('^[1-9][0-9]*$')]
    [string] $ExpectedDhanSecurityId = '1412',

    [Parameter(Mandatory = $false)]
    [switch] $SendSingleQuote,

    [Parameter(Mandatory = $false)]
    [switch] $ForceQuoteWhenCached,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeTraceHeaders,

    [Parameter(Mandatory = $false)]
    [string] $OutputFile = '',

    [Parameter(Mandatory = $false)]
    [switch] $NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-D18Step {
    param([string] $Id, [string] $Title)
    Write-Host ''
    Write-Host "[$Id] $Title" -ForegroundColor Cyan
}

function Write-D18Info {
    param([string] $Message)
    Write-Host "  INFO  $Message" -ForegroundColor Gray
}

function Write-D18Ok {
    param([string] $Message)
    Write-Host "  OK    $Message" -ForegroundColor Green
}

function Write-D18Warn {
    param([string] $Message)
    Write-Host "  WARN  $Message" -ForegroundColor Yellow
}

function Write-D18Fail {
    param([string] $Message)
    Write-Host "  FAIL  $Message" -ForegroundColor Red
}

function Write-IipsPause {
    param([switch] $NoPause)
    if ($NoPause) { return }
    Write-Host ''
    Write-Host 'Press Enter to close this window...' -ForegroundColor Yellow
    try { $null = Read-Host }
    catch { Write-Host '(no interactive input available - continuing without a pause)' -ForegroundColor DarkGray }
}

function Write-IipsFinalStatus {
    param(
        [ValidateSet('PASS', 'FAIL')] [string] $Outcome,
        [string] $Message,
        [int] $ExitCode = 0,
        [switch] $NoPause
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

function Redact-D18Text {
    param([string] $Text)
    if ([string]::IsNullOrEmpty($Text)) { return '' }
    $out = $Text
    $sessionToken = [string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
    if (-not [string]::IsNullOrWhiteSpace($sessionToken) -and $sessionToken.Length -ge 4) {
        $out = $out.Replace($sessionToken, '[REDACTED_SESSION_TOKEN]')
    }
    $out = [regex]::Replace($out, '(?i)(Bearer\s+)[^\s''"`]+', '$1[REDACTED]')
    $out = [regex]::Replace($out, '(?i)(access-token|client-id|authorization)\s*[:=]\s*[^\s,;''"`]+', '$1=[REDACTED]')
    $out = [regex]::Replace($out, '(?i)vault://[^\s''"`),;]+', 'vault://[REDACTED]')
    $out = [regex]::Replace($out, '\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b', '[REDACTED_JWT]')
    return $out
}

function Get-D18Prop {
    param($Object, [string] $Name)
    if ($null -eq $Object) { return $null }
    $p = $Object.PSObject.Properties[$Name]
    if ($null -eq $p) { return $null }
    return $p.Value
}

function Get-D18FileState {
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{
            path             = $Path
            exists           = $false
            isDirectory      = $false
            sizeBytes        = $null
            lastWriteTimeUtc = $null
            sha256           = $null
        }
    }
    $item = Get-Item -LiteralPath $Path
    $isDir = [bool]$item.PSIsContainer
    $sizeVal = $null
    $hashVal = $null
    if (-not $isDir) {
        $sizeVal = [int64]$item.Length
        try { $hashVal = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() } catch { $hashVal = $null }
    }
    return [pscustomobject]@{
        path             = $Path
        exists           = $true
        isDirectory      = $isDir
        sizeBytes        = $sizeVal
        lastWriteTimeUtc = $item.LastWriteTimeUtc.ToString('o')
        sha256           = $hashVal
    }
}

function Invoke-D18HttpJsonClean {
    param(
        [ValidateSet('GET', 'POST')] [string] $Method,
        [string] $Url,
        [hashtable] $Headers,
        [string] $Body = '',
        [int] $TimeoutSec = 15
    )
    $statusCode = $null
    $rawBody = ''
    $parsedBody = $null
    $errorKind = $null

    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            Headers         = $Headers
            TimeoutSec      = $TimeoutSec
            UseBasicParsing = $true
        }
        if ($Method -eq 'POST') {
            $params['ContentType'] = 'application/json'
            $params['Body'] = $Body
        }
        $resp = Invoke-WebRequest @params
        $statusCode = [int]$resp.StatusCode
        $rawBody = [string]$resp.Content
    } catch {
        $webResp = $null
        if ($_.Exception -is [System.Net.WebException]) {
            $webResp = $_.Exception.Response
        }
        if ($null -ne $webResp) {
            try { $statusCode = [int]$webResp.StatusCode } catch { $statusCode = -1 }
            try {
                $stream = $webResp.GetResponseStream()
                if ($null -ne $stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $rawBody = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            } catch { $rawBody = '' }
        }
        if ($null -eq $webResp) {
            $errorKind = 'CONNECTION_FAILED'
            if ($_.Exception -isnot [System.Net.WebException]) { $errorKind = 'REQUEST_ERROR' }
            $rawBody = Redact-D18Text -Text ([string]$_.Exception.Message)
        }
    }

    $safeBody = Redact-D18Text -Text $rawBody
    if (-not [string]::IsNullOrWhiteSpace($safeBody)) {
        try { $parsedBody = $safeBody | ConvertFrom-Json } catch { $parsedBody = $null }
    }
    $fallbackRaw = $null
    if ($null -eq $parsedBody -and -not [string]::IsNullOrWhiteSpace($safeBody)) {
        $fallbackRaw = $safeBody.Substring(0, [Math]::Min(500, $safeBody.Length))
    }

    return [pscustomobject]@{
        ok          = ($statusCode -eq 200)
        statusCode  = $statusCode
        errorKind   = $errorKind
        body        = $parsedBody
        rawRedacted = $fallbackRaw
    }
}

function Find-D18DaemonErrLog {
    param([string] $LogsDir)
    if ([string]::IsNullOrWhiteSpace($LogsDir) -or -not (Test-Path -LiteralPath $LogsDir)) { return $null }
    $manifests = @(Get-ChildItem -LiteralPath $LogsDir -Filter 'iips-pids-*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending)
    if ($manifests.Count -gt 0) {
        try {
            $m = Get-Content -LiteralPath $manifests[0].FullName -Raw | ConvertFrom-Json
            $procs = Get-D18Prop -Object $m -Name 'processes'
            if ($null -ne $procs) {
                foreach ($row in @($procs)) {
                    if ([string](Get-D18Prop -Object $row -Name 'label') -eq 'ipd-market-data-daemon') {
                        $p = [string](Get-D18Prop -Object $row -Name 'errLog')
                        if (-not [string]::IsNullOrWhiteSpace($p) -and (Test-Path -LiteralPath $p)) { return $p }
                    }
                }
            }
        } catch { }
    }
    $svcDirs = @(Get-ChildItem -LiteralPath $LogsDir -Filter 'services-*' -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending)
    foreach ($sd in $svcDirs) {
        $cand = Join-Path $sd.FullName 'ipd-market-data-daemon.err.log'
        if (Test-Path -LiteralPath $cand) { return $cand }
    }
    return $null
}

function Get-D18Snapshot {
    param(
        [string] $BaseUrl,
        [hashtable] $Headers,
        [string] $FreshnessQuery,
        [string] $CaptureFile,
        [string] $ArmMarkerFile,
        [string] $DaemonErrLogPath
    )
    $healthRes    = Invoke-D18HttpJsonClean -Method 'GET' -Url "$BaseUrl/v1/health" -Headers $Headers
    $diagRes      = Invoke-D18HttpJsonClean -Method 'GET' -Url "$BaseUrl/v1/diagnostics" -Headers $Headers
    $freshRes     = Invoke-D18HttpJsonClean -Method 'GET' -Url "$BaseUrl/v1/freshness?$FreshnessQuery" -Headers $Headers
    $traceRes     = Invoke-D18HttpJsonClean -Method 'GET' -Url "$BaseUrl/v1/trace/ring?limit=50" -Headers $Headers
    $captureState = Get-D18FileState -Path $CaptureFile
    $armState     = Get-D18FileState -Path $ArmMarkerFile

    $errLineCount = 0
    if (-not [string]::IsNullOrWhiteSpace($DaemonErrLogPath) -and (Test-Path -LiteralPath $DaemonErrLogPath)) {
        $allLines = @(Get-Content -LiteralPath $DaemonErrLogPath -ErrorAction SilentlyContinue)
        $errLineCount = $allLines.Count
    }

    return [pscustomobject]@{
        capturedAtUtc   = [datetime]::UtcNow.ToString('o')
        health          = $healthRes
        diagnostics     = $diagRes
        freshness       = $freshRes
        traceRing       = $traceRes
        captureFile     = $captureState
        armMarker       = $armState
        errLogPath      = $DaemonErrLogPath
        errLogLineCount = $errLineCount
    }
}

function Test-D18PathInsideRoot {
    param(
        [string] $CandidatePath,
        [string] $RootPath
    )
    if ([string]::IsNullOrWhiteSpace($CandidatePath) -or [string]::IsNullOrWhiteSpace($RootPath)) {
        return $false
    }
    try {
        $candFull = [System.IO.Path]::GetFullPath($CandidatePath).TrimEnd('\', '/')
        $rootFull = [System.IO.Path]::GetFullPath($RootPath).TrimEnd('\', '/')
        if ($candFull.Equals($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
        $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar
        return $candFull.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)
    } catch {
        return $false
    }
}

try {
    if ([string]::IsNullOrWhiteSpace($RuntimeRoot)) { $RuntimeRoot = Join-Path $InstallRoot 'runtime' }
    if ([string]::IsNullOrWhiteSpace($LogRoot))     { $LogRoot     = Join-Path $InstallRoot 'logs' }
    if ([string]::IsNullOrWhiteSpace($CapturePath)) {
        $CapturePath = Join-Path (Join-Path $RuntimeRoot 'dhan-d18-depth-capture') 'agi-depth.json'
    }

    $ipdRoot = Join-Path $InstallRoot 'iips-production-market-data'
    $irrRoot = Join-Path $InstallRoot 'iips-review-recovered'
    $captureDir = Split-Path -Parent $CapturePath
    $startedAtUtc = [datetime]::UtcNow.ToString('o')
    $baseUrl = "http://${BindAddress}:${MarketDataPort}"
    $armMarkerPath = "$CapturePath.arm"
    $freshnessQuery = "domain=D01_QUOTES&companyId=$([uri]::EscapeDataString($CompanyId))&exchangeSegment=$([uri]::EscapeDataString($ExchangeSegment))&securityId=$([uri]::EscapeDataString($SecurityId))"

    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS D-18 Diagnostic B - Capture-Path Diagnostic ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-D18Info "Started UTC     : $startedAtUtc"
    Write-D18Info "InstallRoot     : $InstallRoot"
    Write-D18Info "RuntimeRoot     : $RuntimeRoot"
    Write-D18Info "LogRoot         : $LogRoot"
    Write-D18Info "Daemon Base URL : $baseUrl"
    Write-D18Info "Instrument      : $CompanyId | $ExchangeSegment | $SecurityId (Dhan ID $ExpectedDhanSecurityId)"
    Write-D18Info "CapturePath     : $CapturePath"
    Write-D18Info "ArmMarker       : $armMarkerPath"
    $modeLabel = 'READ_ONLY_PREFLIGHT'
    if ($SendSingleQuote) { $modeLabel = 'CONTROLLED_SINGLE_QUOTE' }
    Write-D18Info "Effective Mode  : $modeLabel"

    if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
        if (Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $captureDir) {
            Write-D18Fail "Refusing to write diagnostic output inside D-18 capture directory ($captureDir): $OutputFile"
            Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Precondition failed: -OutputFile must be separate from the D-18 capture directory.' -ExitCode 2 -NoPause:$NoPause | Out-Null
            exit 2
        }
        if ((Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $ipdRoot) -or (Test-D18PathInsideRoot -CandidatePath $OutputFile -RootPath $irrRoot)) {
            Write-D18Fail "Refusing to write diagnostic output inside a git repository working tree: $OutputFile"
            Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Precondition failed: -OutputFile must be outside both git repositories.' -ExitCode 2 -NoPause:$NoPause | Out-Null
            exit 2
        }
    }

    $token = [string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
    if ([string]::IsNullOrWhiteSpace($token)) {
        Write-D18Fail 'IIPS_MARKET_DATA_TRANSPORT_TOKEN is not set in this PowerShell session.'
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Set IIPS_MARKET_DATA_TRANSPORT_TOKEN in this window and re-run.' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }

    $authHeaders = @{ 'Authorization' = "Bearer $token" }
    $daemonErrLog = Find-D18DaemonErrLog -LogsDir $LogRoot

    # -----------------------------------------------------------------------------------------
    Write-D18Step '01-before-snapshot' 'Capturing BEFORE state (health, diagnostics, freshness, trace ring, files)'

    $before = Get-D18Snapshot -BaseUrl $baseUrl -Headers $authHeaders -FreshnessQuery $freshnessQuery `
        -CaptureFile $CapturePath -ArmMarkerFile $armMarkerPath -DaemonErrLogPath $daemonErrLog

    if (-not $before.health.ok) {
        Write-D18Fail "GET /v1/health failed (status=$($before.health.statusCode), error=$($before.health.errorKind))."
        Write-IipsFinalStatus -Outcome 'FAIL' -Message "Daemon health check failed at $baseUrl/v1/health." -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }
    Write-D18Ok "GET /v1/health -> 200"

    if (-not $before.diagnostics.ok) {
        Write-D18Fail "GET /v1/diagnostics failed (status=$($before.diagnostics.statusCode))."
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Authenticated /v1/diagnostics failed.' -ExitCode 2 -NoPause:$NoPause | Out-Null
        exit 2
    }

    $diagBefore = $before.diagnostics.body
    $countersBefore = Get-D18Prop -Object $diagBefore -Name 'requestCounters'
    $cacheBefore    = Get-D18Prop -Object $diagBefore -Name 'quoteCache'
    $persistBefore  = Get-D18Prop -Object $diagBefore -Name 'persistence'
    $freshBefore    = $before.freshness.body

    $vendorEgressMode = [string](Get-D18Prop -Object $diagBefore -Name 'vendorEgressMode')
    $providerState    = [string](Get-D18Prop -Object $diagBefore -Name 'providerState')
    $credOutcome      = [string](Get-D18Prop -Object $diagBefore -Name 'credentialResolutionOutcome')
    $authLatched      = [bool](Get-D18Prop -Object $diagBefore -Name 'authLatched')
    $vendorReqBefore  = [int](Get-D18Prop -Object $countersBefore -Name 'vendorRequestsTotal')
    $vendorOkBefore   = [int](Get-D18Prop -Object $countersBefore -Name 'vendorSuccesses')
    $quoteReqBefore   = [int](Get-D18Prop -Object $countersBefore -Name 'quoteRequests')
    $cacheHitsBefore  = [int](Get-D18Prop -Object $countersBefore -Name 'quoteCacheHits')
    $provFailBefore   = [int](Get-D18Prop -Object $countersBefore -Name 'providerFailures')
    $agiCacheStateBefore = [string](Get-D18Prop -Object $freshBefore -Name 'cacheState')
    $agiVerdictBefore    = [string](Get-D18Prop -Object $freshBefore -Name 'verdict')
    $agiCalModeBefore    = [string](Get-D18Prop -Object $freshBefore -Name 'calendarMode')
    $agiCalAssessBefore  = [string](Get-D18Prop -Object $freshBefore -Name 'calendarAssessment')
    $persistStatus       = [string](Get-D18Prop -Object $persistBefore -Name 'restoreStatus')
    $persistQuotes       = [int](Get-D18Prop -Object $persistBefore -Name 'quotesRestored')

    Write-D18Info "providerState=$providerState | vendorEgressMode=$vendorEgressMode | credOutcome=$credOutcome | authLatched=$authLatched"
    Write-D18Info "counters BEFORE: quoteRequests=$quoteReqBefore quoteCacheHits=$cacheHitsBefore vendorRequestsTotal=$vendorReqBefore vendorSuccesses=$vendorOkBefore providerFailures=$provFailBefore"
    Write-D18Info "persistence    : restoreStatus=$persistStatus quotesRestored=$persistQuotes"
    Write-D18Info "AGI freshness  : cacheState=$agiCacheStateBefore verdict=$agiVerdictBefore calendarMode=$agiCalModeBefore calendarAssessment=$agiCalAssessBefore"
    Write-D18Info "captureFile    : exists=$($before.captureFile.exists) size=$($before.captureFile.sizeBytes)"
    Write-D18Info "armMarker      : exists=$($before.armMarker.exists)"

    # -----------------------------------------------------------------------------------------
    Write-D18Step '02-preflight-analysis' 'Evaluating preflight blockers before any quote request'

    $preflightBlockers = New-Object System.Collections.Generic.List[string]
    if ($vendorEgressMode -eq 'DISABLED_PRE_ACCESS') {
        $preflightBlockers.Add('VENDOR_EGRESS_DISABLED_PRE_ACCESS')
        Write-D18Fail 'vendorEgressMode is DISABLED_PRE_ACCESS (daemon cannot contact Dhan).'
    }
    if ($authLatched) {
        $preflightBlockers.Add('AUTH_LATCHED_RESTART_REQUIRED')
        Write-D18Fail 'Daemon authLatched is true (no vendor calls possible until re-provision + restart).'
    }
    if (-not $before.armMarker.exists) {
        $preflightBlockers.Add('ARM_MARKER_MISSING')
        Write-D18Warn "Arm marker is absent: $armMarkerPath"
    }
    if ($before.captureFile.isDirectory) {
        $preflightBlockers.Add('CAPTURE_PATH_IS_DIRECTORY')
        Write-D18Fail "CapturePath is a directory: $CapturePath"
    }
    if ($agiCacheStateBefore -eq 'CURRENT') {
        $preflightBlockers.Add('AGI_QUOTE_ALREADY_CACHED_CURRENT')
        Write-D18Warn "AGI quote is ALREADY cached with cacheState=CURRENT (asOf=$(Get-D18Prop -Object $freshBefore -Name 'asOf')). A POST /v1/quotes will hit SKIPPED_FRESH and NEVER call Dhan!"
    }
    if ($preflightBlockers.Count -eq 0) {
        Write-D18Ok 'No preflight blockers detected on daemon state, AGI freshness, or arm marker.'
    }

    $quoteAttempt = $null
    $after = $null
    $deltas = $null
    $newErrLogLines = @()
    $capturedDocSummary = $null
    $diagnosisCode = 'READ_ONLY_PREFLIGHT_READY'
    $diagnosisDetail = 'Read-only preflight completed with no blockers. Re-run with -SendSingleQuote when ready to test one controlled AGI quote.'

    if (-not $SendSingleQuote) {
        if ($preflightBlockers.Count -gt 0) {
            $diagnosisCode = 'READ_ONLY_PREFLIGHT_BLOCKERS_DETECTED'
            $diagnosisDetail = 'Read-only preflight detected blocker(s): ' + ($preflightBlockers -join ', ')
        }
    }

    # -----------------------------------------------------------------------------------------
    if ($SendSingleQuote) {
        Write-D18Step '03-single-quote' 'Controlled single AGI quote request'

        $abortDueToCache = ($agiCacheStateBefore -eq 'CURRENT' -and -not $ForceQuoteWhenCached)
        if ($abortDueToCache) {
            $diagnosisCode = 'PREFLIGHT_ABORT_CACHE_CURRENT'
            $diagnosisDetail = 'Aborted BEFORE sending POST /v1/quotes because GET /v1/freshness already reports cacheState=CURRENT for EQ_AGI_IN. Sending a quote now would hit SKIPPED_FRESH without calling Dhan. Clear/disable W-23 persisted state or wait for cache expiry and restart cleanly (or pass -ForceQuoteWhenCached to observe the cache hit directly).'
            Write-D18Warn $diagnosisDetail
        }

        if (-not $abortDueToCache) {
            $quoteHeaders = @{ 'Authorization' = "Bearer $token" }
            $traceActionId = $null
            if ($IncludeTraceHeaders) {
                $traceActionId = [guid]::NewGuid().ToString()
                $quoteHeaders['X-IIPS-Trace-Version'] = '1'
                $quoteHeaders['X-IIPS-Action-Id'] = $traceActionId
                Write-D18Info "Trace headers enabled: actionId=$traceActionId"
            }

            $quoteBodyObj = [ordered]@{
                companyId       = $CompanyId
                securityId      = $SecurityId
                exchangeSegment = $ExchangeSegment
            }
            $quoteBodyJson = $quoteBodyObj | ConvertTo-Json -Compress
            Write-D18Info "Sending EXACTLY ONE POST $baseUrl/v1/quotes body=$quoteBodyJson"

            $quoteRes = Invoke-D18HttpJsonClean -Method 'POST' -Url "$baseUrl/v1/quotes" -Headers $quoteHeaders -Body $quoteBodyJson -TimeoutSec 20
            $quoteAttempt = [pscustomobject]@{
                sentAtUtc     = [datetime]::UtcNow.ToString('o')
                requestBody   = $quoteBodyObj
                traceActionId = $traceActionId
                statusCode    = $quoteRes.statusCode
                ok            = $quoteRes.ok
                errorKind     = $quoteRes.errorKind
                responseBody  = $quoteRes.body
                rawRedacted   = $quoteRes.rawRedacted
            }
            Write-D18Info "POST /v1/quotes HTTP status -> $($quoteRes.statusCode)"

            # ---------------------------------------------------------------------------------
            Write-D18Step '04-after-snapshot' 'Capturing AFTER state and computing exact deltas'

            Start-Sleep -Milliseconds 300
            $after = Get-D18Snapshot -BaseUrl $baseUrl -Headers $authHeaders -FreshnessQuery $freshnessQuery `
                -CaptureFile $CapturePath -ArmMarkerFile $armMarkerPath -DaemonErrLogPath $daemonErrLog

            $diagAfter = $after.diagnostics.body
            $countersAfter = Get-D18Prop -Object $diagAfter -Name 'requestCounters'
            $vendorReqAfter  = [int](Get-D18Prop -Object $countersAfter -Name 'vendorRequestsTotal')
            $vendorOkAfter   = [int](Get-D18Prop -Object $countersAfter -Name 'vendorSuccesses')
            $quoteReqAfter   = [int](Get-D18Prop -Object $countersAfter -Name 'quoteRequests')
            $cacheHitsAfter  = [int](Get-D18Prop -Object $countersAfter -Name 'quoteCacheHits')
            $provFailAfter   = [int](Get-D18Prop -Object $countersAfter -Name 'providerFailures')

            $deltaQuoteReq  = $quoteReqAfter - $quoteReqBefore
            $deltaCacheHits = $cacheHitsAfter - $cacheHitsBefore
            $deltaVendorReq = $vendorReqAfter - $vendorReqBefore
            $deltaVendorOk  = $vendorOkAfter - $vendorOkBefore
            $deltaProvFail  = $provFailAfter - $provFailBefore

            $captureCreated = (-not $before.captureFile.exists) -and $after.captureFile.exists -and (-not $after.captureFile.isDirectory)
            $captureUpdated = $before.captureFile.exists -and $after.captureFile.exists -and ($before.captureFile.sha256 -ne $after.captureFile.sha256)
            $armConsumed    = $before.armMarker.exists -and (-not $after.armMarker.exists)

            $deltas = [pscustomobject]@{
                quoteRequestsDelta       = $deltaQuoteReq
                quoteCacheHitsDelta      = $deltaCacheHits
                vendorRequestsTotalDelta = $deltaVendorReq
                vendorSuccessesDelta     = $deltaVendorOk
                providerFailuresDelta    = $deltaProvFail
                captureFileCreated       = [bool]$captureCreated
                captureFileHashChanged   = [bool]$captureUpdated
                armMarkerConsumed        = [bool]$armConsumed
            }

            Write-D18Info "DELTAS: quoteReq=+$deltaQuoteReq cacheHits=+$deltaCacheHits vendorReq=+$deltaVendorReq vendorOk=+$deltaVendorOk provFail=+$deltaProvFail"
            Write-D18Info "FILES : captureCreated=$captureCreated captureHashChanged=$captureUpdated armConsumed=$armConsumed"

            if (-not [string]::IsNullOrWhiteSpace($daemonErrLog) -and (Test-Path -LiteralPath $daemonErrLog)) {
                $allErrAfter = @(Get-Content -LiteralPath $daemonErrLog -ErrorAction SilentlyContinue)
                if ($allErrAfter.Count -gt $before.errLogLineCount) {
                    $newSlice = @($allErrAfter[$before.errLogLineCount..($allErrAfter.Count - 1)])
                    $newErrLogLines = @($newSlice | ForEach-Object { Redact-D18Text -Text ([string]$_) })
                    foreach ($nl in $newErrLogLines) {
                        Write-D18Info "NEW DAEMON STDERR: $nl"
                    }
                }
            }

            if ($after.captureFile.exists -and -not $after.captureFile.isDirectory) {
                try {
                    $doc = Get-Content -LiteralPath $CapturePath -Raw | ConvertFrom-Json
                    $quotesArr = @(Get-D18Prop -Object $doc -Name 'quotes')
                    $firstQuote = $null
                    if ($quotesArr.Count -gt 0) { $firstQuote = $quotesArr[0] }
                    $capturedDocSummary = [pscustomobject]@{
                        captureSchemaVersion  = Get-D18Prop -Object $doc -Name 'captureSchemaVersion'
                        capturedAtUtc         = Get-D18Prop -Object $doc -Name 'capturedAtUtc'
                        httpStatus            = Get-D18Prop -Object $doc -Name 'httpStatus'
                        responseStatus        = Get-D18Prop -Object $doc -Name 'responseStatus'
                        requestedSecurityIds  = @(Get-D18Prop -Object $doc -Name 'requestedSecurityIds')
                        instrumentsInResponse = Get-D18Prop -Object $doc -Name 'instrumentsInResponse'
                        firstQuoteSegment     = Get-D18Prop -Object $firstQuote -Name 'segment'
                        firstQuoteSecurityId  = Get-D18Prop -Object $firstQuote -Name 'securityId'
                        firstQuoteDepthState  = Get-D18Prop -Object $firstQuote -Name 'depthState'
                    }
                } catch {
                    $capturedDocSummary = [pscustomobject]@{ parseError = 'INVALID_JSON' }
                }
            }

            # Deterministic diagnosis classification
            $d18NewLines = @($newErrLogLines | Where-Object { $_ -match '\[dhan-depth-capture\] outcome=' })

            if ($captureCreated -or $captureUpdated) {
                $diagnosisCode = 'CAPTURE_SUCCEEDED'
                $diagnosisDetail = "Capture file written at $CapturePath (armConsumed=$armConsumed, vendorReq=+$deltaVendorReq)."
                Write-D18Ok $diagnosisDetail
            }
            if (-not ($captureCreated -or $captureUpdated)) {
                if ($quoteRes.statusCode -eq 200 -and $deltaVendorReq -eq 0) {
                    $diagnosisCode = 'CACHE_HIT_NO_VENDOR_CALL'
                    $diagnosisDetail = "POST /v1/quotes returned HTTP 200 with vendorRequestsTotalDelta=0 (quoteCacheHitsDelta=+$deltaCacheHits). The response was served from cache (SKIPPED_FRESH / W-23 restored cache) and NEVER reached DhanApiClient.executeJsonPost or captureRawDepthIfEnabled."
                    Write-D18Fail $diagnosisDetail
                }
                if ($quoteRes.statusCode -ne 200) {
                    $diagnosisCode = 'VENDOR_REQUEST_FAILED_NON_2XX'
                    $diagnosisDetail = "POST /v1/quotes returned HTTP $($quoteRes.statusCode) (vendorReq=+$deltaVendorReq, provFail=+$deltaProvFail). captureRawDepthIfEnabled only runs after a 2xx JSON response from Dhan."
                    Write-D18Fail $diagnosisDetail
                }
                if ($quoteRes.statusCode -eq 200 -and $deltaVendorReq -gt 0) {
                    $diagnosisCode = 'VENDOR_CALL_SUCCEEDED_BUT_CAPTURE_NOT_WRITTEN'
                    $stderrHint = 'No [dhan-depth-capture] stderr line emitted (either running pre-instrumentation build or IIPS_DHAN_DEPTH_CAPTURE_PATH was unset in daemon process environment).'
                    if ($d18NewLines.Count -gt 0) {
                        $stderrHint = 'Daemon emitted: ' + ($d18NewLines -join ' | ')
                    }
                    $diagnosisDetail = "POST /v1/quotes reached Dhan and succeeded (HTTP 200, vendorReq=+$deltaVendorReq, vendorOk=+$deltaVendorOk), yet $CapturePath was NOT created/updated (armConsumed=$armConsumed). $stderrHint"
                    Write-D18Fail $diagnosisDetail
                }
            }
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-D18Step '05-report' 'Finalizing capture-path diagnostic output'

    $report = [pscustomobject]@{
        schemaVersion      = 1
        diagnostic         = 'D18_CAPTURE_PATH'
        startedAtUtc       = $startedAtUtc
        completedAtUtc     = [datetime]::UtcNow.ToString('o')
        mode               = $modeLabel
        noSecretsEmitted   = $true
        target             = [pscustomobject]@{
            installRoot            = $InstallRoot
            runtimeRoot            = $RuntimeRoot
            logRoot                = $LogRoot
            baseUrl                = $baseUrl
            companyId              = $CompanyId
            securityId             = $SecurityId
            exchangeSegment        = $ExchangeSegment
            expectedDhanSecurityId = $ExpectedDhanSecurityId
            capturePath            = $CapturePath
            armMarkerPath          = $armMarkerPath
        }
        preflightBlockers  = @($preflightBlockers)
        before             = $before
        quoteAttempt       = $quoteAttempt
        after              = $after
        deltas             = $deltas
        newDaemonErrLines  = @($newErrLogLines)
        capturedDocSummary = $capturedDocSummary
        diagnosis          = [pscustomobject]@{
            code   = $diagnosisCode
            detail = $diagnosisDetail
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
        $outDir = Split-Path -Parent $OutputFile
        if (-not [string]::IsNullOrWhiteSpace($outDir) -and -not (Test-Path -LiteralPath $outDir)) {
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
        $jsonText = $report | ConvertTo-Json -Depth 12
        [System.IO.File]::WriteAllText($OutputFile, ($jsonText + "`n"), (New-Object System.Text.UTF8Encoding($false)))
        Write-D18Ok "Report written: $OutputFile"
    }

    $isPass = ($diagnosisCode -eq 'CAPTURE_SUCCEEDED') -or ($diagnosisCode -eq 'READ_ONLY_PREFLIGHT_READY')
    if ($isPass) {
        Write-IipsFinalStatus -Outcome 'PASS' -Message "$diagnosisCode : $diagnosisDetail" -ExitCode 0 -NoPause:$NoPause | Out-Null
        exit 0
    }
    Write-IipsFinalStatus -Outcome 'FAIL' -Message "$diagnosisCode : $diagnosisDetail" -ExitCode 3 -NoPause:$NoPause | Out-Null
    exit 3
} catch {
    $safeErr = Redact-D18Text -Text ([string]$_.Exception.Message)
    Write-D18Fail "Unhandled diagnostic error: $safeErr"
    Write-IipsFinalStatus -Outcome 'FAIL' -Message "D-18 capture-path diagnostic failed unexpectedly: $safeErr" -ExitCode 1 -NoPause:$NoPause | Out-Null
    exit 1
}
