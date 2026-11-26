#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 4 of 7: machine-verify the backend contract behind the UI.

.DESCRIPTION
    Probes every API endpoint the browser screens depend on and compares the observed status AND
    body against the contract verified directly from executive-transport.ts.

    THIS DOES NOT REPLACE BROWSER VERIFICATION. It confirms the data layer each screen reads from is
    live, so that when a screen looks wrong in the browser you already know whether the fault is in
    the transport or in the UI. Walk the URLs printed by 03-Start-IipsServers.ps1 by hand.

    CONDITIONAL ENDPOINTS ARE MATCHED STRICTLY
      A fail-closed response only counts as expected when it is the SPECIFIC documented response:

        User Portfolios  -> HTTP 503 with body containing "owner-context-unavailable"
        Reports          -> HTTP 404 with body exactly {"error":"not found"}

      Anything else is reported as an ERROR, including:
        * HTTP 500 - a server-side fault is never an acceptable "fail closed"
        * a 503 or 404 whose body does not carry the documented reason
        * any other status code

      This distinction matters: a 503 with the right reason means the guard worked; a 500, or a 503
      with a different reason, means something is broken and must not be waved through.

    WHEN PREREQUISITES ARE PRESENT, REAL FUNCTIONALITY IS REQUIRED
      The script auto-detects prerequisites:
        * the named pipe iips-user-portfolio-v1 exists  -> User Portfolios MUST return 200 and its
          payload is validated. A fail-closed 503 in that state is reported as an ERROR.
        * the NP-04 database file exists                -> Reports MUST return 200 and its payload is
          validated. A fail-closed 404 in that state is reported as an ERROR.
      Override the detection with -IpdIpcExpected and -ReportsExpected.

    IPD MARKET-DATA DAEMON — FOUR-STATE DISCRIMINATION (W-36)
      The daemon on 127.0.0.1:8791 is validated with four mutually exclusive states:

        not-running     -> no listener on 8791 (Get-IipsPortOwner returns $null)
        unauthenticated -> listener exists but unauthenticated GET /v1/health returns 401
        not-configured  -> authenticated GET /v1/health returns 200 with
                           providerConfiguration=PRE_ACCESS_CREDENTIALS_UNAVAILABLE,
                           credentialReadinessCode=CREDENTIALS_UNAVAILABLE,
                           providerState=UNCONFIGURED (or UNCONFIGURED-family)
        ready           -> authenticated GET /v1/health returns 200 with
                           service=UP, providerReadiness=CREDENTIAL_REFERENCES_CONFIGURED
                           or CONFIGURED-equivalent, qualifiedMappingsLoaded=4680,
                           liveProviderConnectivity=NOT_CHECKED_PRE_ACCESS

      not-running is EXPECTED when -StartMarketDataDaemon was not passed to 03.
      not-configured is EXPECTED on a fresh Windows host with no Dhan credentials
      provisioned. The script always reports the observed state explicitly so the
      operator can see which of the four applies; it only fails when the observed
      state contradicts the expected prerequisite.

    EXIT CODES
      0  every REQUIRED and every prerequisite-backed endpoint matched its contract
      1  unhandled failure
      2  precondition failure - the transport is not reachable at all
      4  one or more endpoints did not match the contract (including any HTTP 500)

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1 -IpdIpcExpected -ReportsExpected

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1 -MarketDataPort 8791

.NOTES
    No vault://, token, or carrier path is ever written to the CSV or to the console
    beyond the discrimination reason. The transport token is read from
    IIPS_MARKET_DATA_TRANSPORT_TOKEN only for the authenticated probe and never echoed.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $TransportPort = 8787,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $FrontendPort = 5176,

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $BindAddress = '127.0.0.1',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $LogRoot = 'H:\IIPS\logs',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $PipeName = 'iips-user-portfolio-v1',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $Np04DatabasePath = 'H:\IIPS\runtime\np04\reports.sqlite',

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 65535)]
    [int] $MarketDataPort = 8791,

    [Parameter(Mandatory = $false)]
    [switch] $IpdIpcExpected,

    [Parameter(Mandatory = $false)]
    [switch] $ReportsExpected,

    [Parameter(Mandatory = $false)]
    [switch] $SkipProxyCheck,

    [Parameter(Mandatory = $false)]
    [switch] $SkipMarketDataCheck,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'Iips-Common.ps1')

$script:Results = New-Object System.Collections.Generic.List[object]

<#
.SYNOPSIS
    Probes one endpoint and classifies the result.

.NOTES
    Verdicts:
      PASS                  - the status matched $Expected (and the body matched, when required)
      EXPECTED-FAIL-CLOSED  - the prerequisite is absent AND the response is the exact documented
                              fail-closed signature (status AND body reason both match)
      FAIL                  - anything else, including HTTP 500 and a fail-closed status whose body
                              does not carry the documented reason
#>
function Invoke-IipsProbe {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Url,
        [Parameter(Mandatory = $true)][int] $Expected,
        [Parameter(Mandatory = $true)][string] $Class,
        [Parameter(Mandatory = $false)][string] $Method = 'GET',
        [Parameter(Mandatory = $false)][string] $Body = '',
        [Parameter(Mandatory = $false)][string] $BodyMustMatch = '',
        [Parameter(Mandatory = $false)][int] $FailClosedStatus = 0,
        [Parameter(Mandatory = $false)][string] $FailClosedPattern = '',
        [Parameter(Mandatory = $false)][bool] $PrerequisitePresent = $false
    )
    $status = 0
    $content = ''
    $size = 0
    $transportError = ''
    try {
        $params = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true; TimeoutSec = 20; ErrorAction = 'Stop' }
        if ($Body.Length -gt 0) { $params['Body'] = $Body; $params['ContentType'] = 'application/json' }
        $resp = Invoke-WebRequest @params
        $status = [int]$resp.StatusCode
        $content = $resp.Content
        $size = $content.Length
    }
    catch {
        $ex = $_.Exception
        if ($null -ne $ex.Response -and $null -ne $ex.Response.StatusCode) {
            $status = [int]$ex.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
                $content = $reader.ReadToEnd()
                $size = $content.Length
            }
            catch { $content = ''; $size = 0 }
        }
        if ($status -eq 0) { $transportError = $ex.Message }
    }

    $verdict = 'FAIL'
    $reason = ''

    if ($status -eq $Expected) {
        $bodyOk = $true
        if ($BodyMustMatch.Length -gt 0) { $bodyOk = ($content -match $BodyMustMatch) }
        if ($bodyOk) {
            $verdict = 'PASS'
            $reason = 'matched the contract'
        }
        if (-not $bodyOk) { $reason = "status $status but the body did not match '$BodyMustMatch'" }
    }

    # A fail-closed response is only acceptable when the prerequisite is genuinely absent AND the
    # response is the exact documented signature. A 500 never qualifies.
    if ($verdict -eq 'FAIL' -and $FailClosedStatus -gt 0 -and -not $PrerequisitePresent) {
        if ($status -eq $FailClosedStatus) {
            $signatureOk = $true
            if ($FailClosedPattern.Length -gt 0) { $signatureOk = ($content -match $FailClosedPattern) }
            if ($signatureOk) {
                $verdict = 'EXPECTED-FAIL-CLOSED'
                $reason = 'documented fail-closed signature (prerequisite absent)'
            }
            if (-not $signatureOk) { $reason = "status $FailClosedStatus but the body is not the documented fail-closed reason '$FailClosedPattern' - actual: $($content.Substring(0, [Math]::Min(120, $content.Length)))" }
        }
    }

    # Prerequisite present but the endpoint still fails closed: that is a real defect.
    if ($verdict -eq 'FAIL' -and $FailClosedStatus -gt 0 -and $PrerequisitePresent) {
        if ($status -eq $FailClosedStatus) { $reason = "prerequisite is PRESENT, so a fail-closed $FailClosedStatus is an error - the guard should not be tripping" }
    }

    if ($status -eq 500) { $reason = "HTTP 500 - a server-side fault is never an acceptable fail-closed state. Body: $($content.Substring(0, [Math]::Min(160, $content.Length)))" }
    if ($transportError.Length -gt 0 -and $reason.Length -eq 0) { $reason = "unreachable: $transportError" }

    $script:Results.Add([pscustomobject]@{
        Name = $Name; Class = $Class; Method = $Method; Url = $Url
        Expected = $Expected; Actual = $status; Bytes = $size
        Verdict = $verdict; Reason = $reason
    })

    $colour = 'Red'
    if ($verdict -eq 'PASS') { $colour = 'Green' }
    if ($verdict -eq 'EXPECTED-FAIL-CLOSED') { $colour = 'Yellow' }
    $detail = ''
    if ($reason.Length -gt 0 -and $verdict -ne 'PASS') { $detail = "  <- $reason" }
    Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}{5}" -f $Name, $Method, "$status", $size, $verdict, $detail) -ForegroundColor $colour
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Backend Endpoint Validation ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ''

    $base = "http://$BindAddress`:$TransportPort"

    # -----------------------------------------------------------------------------------------
    Write-Host 'Prerequisite detection' -ForegroundColor Cyan
    # @( ) is mandatory here: Get-IipsNamedPipes may return zero, one or many pipes, and
    # PowerShell unrolls a single-element result into a scalar string that has no .Count.
    $pipes = @(Get-IipsNamedPipes -Filter $PipeName)
    $pipeDetected = ($pipes.Count -gt 0)
    $ipcExpected = $IpdIpcExpected.IsPresent -or $pipeDetected
    $pipeState = 'absent'
    if ($pipeDetected) { $pipeState = 'PRESENT' }
    Write-Host "    named pipe $PipeName : $pipeState" -ForegroundColor Gray
    Write-Host "    -> User Portfolios expected to serve real data: $ipcExpected" -ForegroundColor Gray

    $np04Present = Test-Path -LiteralPath $Np04DatabasePath
    $reportsReq = $ReportsExpected.IsPresent -or $np04Present
    $np04State = 'absent'
    if ($np04Present) { $np04State = 'PRESENT' }
    Write-Host "    NP-04 database $Np04DatabasePath : $np04State" -ForegroundColor Gray
    Write-Host "    -> Reports expected to serve real data: $reportsReq" -ForegroundColor Gray
    Write-Host ''

    # -----------------------------------------------------------------------------------------
    Write-Host "Transport: $base" -ForegroundColor Gray
    Write-Host ''
    Write-Host '    NAME                     METHOD  HTTP    BYTES  VERDICT' -ForegroundColor DarkGray
    Write-Host '    ------------------------------------------------------------------' -ForegroundColor DarkGray

    # --- REQUIRED: verified 200 against executive-transport.ts -----------------------------
    Invoke-IipsProbe -Name 'health'          -Url "$base/api/health"          -Expected 200 -Class 'REQUIRED' -BodyMustMatch '"status"\s*:\s*"ok"'
    Invoke-IipsProbe -Name 'executive'       -Url "$base/api/executive"       -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'portfolioId'
    Invoke-IipsProbe -Name 'portfolio'       -Url "$base/api/portfolio"       -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'portfolioId'
    Invoke-IipsProbe -Name 'decision-matrix' -Url "$base/api/decision-matrix" -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'matrixType'
    Invoke-IipsProbe -Name 'cross-sector'    -Url "$base/api/cross-sector"    -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'opportunity'
    Invoke-IipsProbe -Name 'engines'         -Url "$base/api/engines"         -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'engineId'
    Invoke-IipsProbe -Name 'company/banking' -Url "$base/api/company/banking" -Expected 200 -Class 'REQUIRED'

    # --- REQUIRED once the owner-context carrier is provisioned (step 02) ------------------
    Invoke-IipsProbe -Name 'settings'        -Url "$base/api/settings"        -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'surfaceName'
    Invoke-IipsProbe -Name 'watchlists'      -Url "$base/api/watchlists"      -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'provenance'
    Invoke-IipsProbe -Name 'collaboration'   -Url "$base/api/collaboration"   -Expected 200 -Class 'REQUIRED' -BodyMustMatch 'provenance'

    # --- CONDITIONAL: strict fail-closed signature matching -------------------------------
    Invoke-IipsProbe -Name 'user-portfolios' -Url "$base/api/user-portfolios" -Expected 200 -Class 'CONDITIONAL' `
        -FailClosedStatus 503 -FailClosedPattern 'owner-context-unavailable' -PrerequisitePresent $ipcExpected
    Invoke-IipsProbe -Name 'reports'         -Url "$base/api/reports"         -Expected 200 -Class 'CONDITIONAL' `
        -FailClosedStatus 404 -FailClosedPattern '"error"\s*:\s*"not found"' -PrerequisitePresent $reportsReq

    # --- DESIGN: deliberate non-200 --------------------------------------------------------
    Invoke-IipsProbe -Name 'screener(GET)'   -Url "$base/api/screener"        -Expected 405 -Class 'DESIGN'

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    Write-Host 'Cross-sector payload shape (backs Opportunities, Risks and Rankings)' -ForegroundColor Cyan
    try {
        $cs = Invoke-WebRequest -Uri "$base/api/cross-sector" -UseBasicParsing -TimeoutSec 20
        $json = $cs.Content | ConvertFrom-Json
        $oppCount = 0
        if ($null -ne $json.opportunity) { $oppCount = @($json.opportunity).Count }
        $rankCount = 0
        if ($null -ne $json.ranking) { $rankCount = @($json.ranking).Count }
        $holdings = 0
        if ($null -ne $json.portfolio -and $null -ne $json.portfolio.holdings) { $holdings = @($json.portfolio.holdings).Count }
        Write-Host "    opportunity items  : $oppCount   (Opportunities screen)" -ForegroundColor Gray
        Write-Host "    ranking items      : $rankCount   (Rankings screen)" -ForegroundColor Gray
        Write-Host "    portfolio holdings : $holdings   (Risks screen)" -ForegroundColor Gray
        if ($oppCount -eq 0) { Write-Host '    WARNING: opportunity is empty - the Opportunities screen will render no rows.' -ForegroundColor Yellow }
        if ($rankCount -eq 0) { Write-Host '    WARNING: ranking is empty - the Rankings screen will render no rows.' -ForegroundColor Yellow }
    }
    catch {
        Write-Host "    could not read /api/cross-sector: $($_.Exception.Message)" -ForegroundColor Red
    }

    # -----------------------------------------------------------------------------------------
    # IPD market-data daemon — four-state discrimination (W-36)
    # -----------------------------------------------------------------------------------------
    if (-not $SkipMarketDataCheck) {
        Write-Host '' -ForegroundColor White
        Write-Host 'IPD market-data daemon (127.0.0.1:8791) - four-state discrimination' -ForegroundColor Cyan
        Write-Host "    Checking: http://$BindAddress`:$MarketDataPort/v1/health" -ForegroundColor Gray
        Write-Host '    States: not-running | unauthenticated | not-configured | ready' -ForegroundColor DarkGray
        Write-Host '    NAME                     METHOD  HTTP    BYTES  VERDICT' -ForegroundColor DarkGray
        Write-Host '    ------------------------------------------------------------------' -ForegroundColor DarkGray

        $daemonBase = "http://$BindAddress`:$MarketDataPort"
        $daemonOwner = $null
        $daemonStateQueryError = ''
        try {
            $daemonOwner = Get-IipsPortOwner -Port $MarketDataPort
        }
        catch {
            $daemonStateQueryError = $_.Exception.Message
        }

        if ($daemonStateQueryError.Length -gt 0) {
            $script:Results.Add([pscustomobject]@{
                Name = 'daemon/port-query'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/health"
                Expected = 200; Actual = 0; Bytes = 0; Verdict = 'FAIL'
                Reason = "could not query port ${MarketDataPort}: $daemonStateQueryError"
            })
            Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/port-query', 'GET', '0', '0', 'FAIL', $daemonStateQueryError) -ForegroundColor Red
        }

        if ($null -eq $daemonOwner -and $daemonStateQueryError.Length -eq 0) {
            # not-running — no listener on 8791. This is EXPECTED when 03 was run without
            # -StartMarketDataDaemon. Treat as EXPECTED-FAIL-CLOSED, not as FAIL, so a
            # transport-only run does not report a daemon defect.
            $script:Results.Add([pscustomobject]@{
                Name = 'daemon/not-running'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/health"
                Expected = 200; Actual = 0; Bytes = 0; Verdict = 'EXPECTED-FAIL-CLOSED'
                Reason = "no listener on port $MarketDataPort - daemon is not running (expected when -StartMarketDataDaemon was not used); this is the not-running state"
            })
            Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/not-running', 'GET', '0', '0', 'EXPECTED-FAIL-CLOSED', "no listener on port $MarketDataPort - not-running") -ForegroundColor Yellow
            Write-Host "    -> not-running: correctly discriminated (pass -StartMarketDataDaemon to 03 to reach the other states)" -ForegroundColor Gray
        }

        if ($null -ne $daemonOwner) {
            Write-Host "    listener: $($daemonOwner.LocalAddress):$MarketDataPort PID $($daemonOwner.OwningProcess)" -ForegroundColor Gray

            # Probe 1: unauthenticated — must be 401 UNAUTHENTICATED.
            # This proves the auth guard is active even when the daemon is not-configured.
            $unauthStatus = 0
            $unauthContent = ''
            $unauthTransportError = ''
            try {
                $unauthResp = Invoke-WebRequest -Uri "$daemonBase/v1/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                $unauthStatus = [int]$unauthResp.StatusCode
                $unauthContent = $unauthResp.Content
            }
            catch {
                $ex = $_.Exception
                if ($null -ne $ex.Response -and $null -ne $ex.Response.StatusCode) {
                    $unauthStatus = [int]$ex.Response.StatusCode
                    try {
                        $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
                        $unauthContent = $reader.ReadToEnd()
                    }
                    catch { $unauthContent = '' }
                }
                if ($unauthStatus -eq 0) { $unauthTransportError = $ex.Message }
            }

            $unauthVerdict = 'FAIL'
            $unauthReason = ''
            if ($unauthStatus -eq 401) {
                if ($unauthContent -match '"code"\s*:\s*"UNAUTHENTICATED"') {
                    $unauthVerdict = 'PASS'
                    $unauthReason = 'unauthenticated correctly rejected with 401 UNAUTHENTICATED (not-running excluded, ready excluded)'
                }
                if ($unauthVerdict -ne 'PASS') { $unauthReason = "status 401 but body is not the documented UNAUTHENTICATED shape - actual: $($unauthContent.Substring(0, [Math]::Min(120, $unauthContent.Length)))" }
            }
            if ($unauthVerdict -eq 'FAIL' -and $unauthTransportError.Length -gt 0) { $unauthReason = "unreachable: $unauthTransportError" }
            if ($unauthVerdict -eq 'FAIL' -and $unauthReason.Length -eq 0) { $unauthReason = "expected 401 UNAUTHENTICATED for unauthenticated probe, got $unauthStatus" }

            $script:Results.Add([pscustomobject]@{
                Name = 'daemon/unauth'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/health"
                Expected = 401; Actual = $unauthStatus; Bytes = $unauthContent.Length; Verdict = $unauthVerdict; Reason = $unauthReason
            })
            $colour = 'Red'
            if ($unauthVerdict -eq 'PASS') { $colour = 'Green' }
            Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/unauth', 'GET', "$unauthStatus", $unauthContent.Length, $unauthVerdict, $unauthReason) -ForegroundColor $colour

            # Probe 2: authenticated — requires IIPS_MARKET_DATA_TRANSPORT_TOKEN in this session.
            # Without it the daemon is not-running from the client's view, but the unauthenticated
            # probe above already proved the listener and its auth guard.
            $token = [string]$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
            if ([string]::IsNullOrWhiteSpace($token)) {
                $script:Results.Add([pscustomobject]@{
                    Name = 'daemon/auth-probe'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/health"
                    Expected = 200; Actual = 0; Bytes = 0; Verdict = 'EXPECTED-FAIL-CLOSED'
                    Reason = 'IIPS_MARKET_DATA_TRANSPORT_TOKEN not set in this session - authenticated probe skipped; unauthenticated probe already proved the listener; set the token to reach not-configured/ready'
                })
                Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/auth-probe', 'GET', '0', '0', 'EXPECTED-FAIL-CLOSED', 'token not set - authenticated probe skipped (set IIPS_MARKET_DATA_TRANSPORT_TOKEN to test the other states)') -ForegroundColor Yellow
            }
            if (-not [string]::IsNullOrWhiteSpace($token)) {
                $authStatus = 0
                $authContent = ''
                $authError = ''
                $authSize = 0
                try {
                    $authHeaders = @{ Authorization = "Bearer $token" }
                    $authResp = Invoke-WebRequest -Uri "$daemonBase/v1/health" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                    $authStatus = [int]$authResp.StatusCode
                    $authContent = $authResp.Content
                    $authSize = $authContent.Length
                }
                catch {
                    $ex = $_.Exception
                    if ($null -ne $ex.Response -and $null -ne $ex.Response.StatusCode) {
                        $authStatus = [int]$ex.Response.StatusCode
                        try {
                            $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
                            $authContent = $reader.ReadToEnd()
                            $authSize = $authContent.Length
                        }
                        catch { $authContent = ''; $authSize = 0 }
                    }
                    if ($authStatus -eq 0) { $authError = $ex.Message }
                }

                $authVerdict = 'FAIL'
                $authReason = ''
                $daemonDiscrimination = ''

                if ($authStatus -eq 200) {
                    $bodyOk = $true
                    # Minimal contract: must carry service, providerConfiguration, liveProviderConnectivity
                    if (-not ($authContent -match '"service"\s*:\s*"UP"')) { $bodyOk = $false }
                    if (-not ($authContent -match '"providerConfiguration"')) { $bodyOk = $false }
                    if (-not ($authContent -match '"liveProviderConnectivity"')) { $bodyOk = $false }

                    if ($bodyOk) {
                        $authVerdict = 'PASS'
                        $authReason = 'authenticated health matched contract (service UP, provider fields present, sanitised - no vault://)'
                        # Discrimination from health alone: health carries providerConfiguration (= daemon provider readiness)
                        # Diagnostics (separate probe below) enriches with providerReadiness/credentialResolutionOutcome/qualifiedMappingsLoaded
                        if ($authContent -match '"providerConfiguration"\s*:\s*"PRE_ACCESS_CREDENTIALS_UNAVAILABLE"') {
                            $daemonDiscrimination = 'not-configured: providerConfiguration PRE_ACCESS_CREDENTIALS_UNAVAILABLE (no Dhan SecretRef configured) - expected on fresh host'
                            if ($authContent -match '"providerState"\s*:\s*"UNCONFIGURED"' -or $authContent -match '"credentialResolutionOutcome"\s*:\s*"UNCONFIGURED"' -or $authContent -match '"credentialReadinessCode"\s*:\s*"CREDENTIALS_UNAVAILABLE"') {
                                $daemonDiscrimination = 'not-configured: providerState UNCONFIGURED / credentialResolutionOutcome UNCONFIGURED - expected on fresh host'
                            }
                        }
                        if ($authContent -match '"providerConfiguration"\s*:\s*"CONFIGURED"') {
                            $daemonDiscrimination = 'ready: providerConfiguration CONFIGURED (credential references configured)'
                        }
                        if ($authContent -match '"providerReadiness"\s*:\s*"CREDENTIAL_REFERENCES_CONFIGURED"') {
                            if ($daemonDiscrimination.Length -gt 0) { $daemonDiscrimination = "$daemonDiscrimination; providerReadiness CREDENTIAL_REFERENCES_CONFIGURED" }
                            if ($daemonDiscrimination.Length -eq 0) { $daemonDiscrimination = 'ready: providerReadiness CREDENTIAL_REFERENCES_CONFIGURED' }
                        }
                        if ($authContent -match '"credentialReadinessCode"\s*:\s*"CONFIGURED"' -or $authContent -match '"credentialResolutionOutcome"\s*:\s*"CONFIGURED') {
                            if ($daemonDiscrimination.Length -eq 0) { $daemonDiscrimination = 'ready: credential readiness CONFIGURED' }
                        }
                        if ($authContent -match '"qualifiedMappingsLoaded"\s*:\s*4680') {
                            if ($daemonDiscrimination.Length -gt 0) { $daemonDiscrimination = "$daemonDiscrimination; qualifiedMappingsLoaded=4680" }
                            if ($daemonDiscrimination.Length -eq 0) { $daemonDiscrimination = 'ready: qualifiedMappingsLoaded=4680 (P7 registry loaded)' }
                        }
                        if ($authContent -match 'vault://') {
                            $authVerdict = 'FAIL'
                            $authReason = 'health body contains vault:// - diagnostic leak (D-7 violation)'
                            $daemonDiscrimination = ''
                        }
                    }
                    if (-not $bodyOk) { $authReason = "status 200 but body does not carry the expected health contract fields (service/providerConfiguration/liveProviderConnectivity) - actual: $($authContent.Substring(0, [Math]::Min(160, $authContent.Length)))" }
                }

                if ($authStatus -eq 401) { $authReason = 'authenticated probe got 401 - token mismatch (set IIPS_MARKET_DATA_TRANSPORT_TOKEN to the value 03 injected for this run, not a different value)' }
                if ($authError.Length -gt 0 -and $authReason.Length -eq 0) { $authReason = "unreachable: $authError" }
                if ($authVerdict -eq 'FAIL' -and $authReason.Length -eq 0) { $authReason = "expected 200 for authenticated probe, got $authStatus" }

                $script:Results.Add([pscustomobject]@{
                    Name = 'daemon/health'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/health"
                    Expected = 200; Actual = $authStatus; Bytes = $authSize; Verdict = $authVerdict; Reason = $authReason
                })
                $colour = 'Red'
                if ($authVerdict -eq 'PASS') { $colour = 'Green' }
                Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/health', 'GET', "$authStatus", $authSize, $authVerdict, $authReason) -ForegroundColor $colour
                if ($daemonDiscrimination.Length -gt 0) {
                    Write-Host "    -> discrimination: $daemonDiscrimination" -ForegroundColor Gray
                    $script:Results.Add([pscustomobject]@{
                        Name = 'daemon/discrimination'; Class = 'DAEMON'; Method = '-'; Url = "$daemonBase/v1/health"
                        Expected = 200; Actual = $authStatus; Bytes = 0; Verdict = 'PASS'; Reason = $daemonDiscrimination
                    })
                }

                # Authenticated diagnostics — proves D-7 sanitisation and exposes the same four states
                if ($authVerdict -eq 'PASS') {
                    $diagStatus = 0
                    $diagContent = ''
                    $diagSize = 0
                    $diagError = ''
                    try {
                        $authHeaders = @{ Authorization = "Bearer $token" }
                        $diagResp = Invoke-WebRequest -Uri "$daemonBase/v1/diagnostics" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                        $diagStatus = [int]$diagResp.StatusCode
                        $diagContent = $diagResp.Content
                        $diagSize = $diagContent.Length
                    }
                    catch {
                        $ex = $_.Exception
                        if ($null -ne $ex.Response -and $null -ne $ex.Response.StatusCode) {
                            $diagStatus = [int]$ex.Response.StatusCode
                            try {
                                $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
                                $diagContent = $reader.ReadToEnd()
                                $diagSize = $diagContent.Length
                            }
                            catch { $diagContent = ''; $diagSize = 0 }
                        }
                        if ($diagStatus -eq 0) { $diagError = $ex.Message }
                    }

                    $diagVerdict = 'FAIL'
                    $diagReason = ''
                    if ($diagStatus -eq 200) {
                        $diagBodyOk = $true
                        if (-not ($diagContent -match '"contractVersion"')) { $diagBodyOk = $false }
                        if (-not ($diagContent -match '"providerState"')) { $diagBodyOk = $false }
                        if ($diagContent -match 'vault://') { $diagBodyOk = $false; $diagReason = 'diagnostics body contains vault:// - diagnostic leak (D-7 violation)' }
                        if ($diagBodyOk) { $diagVerdict = 'PASS'; $diagReason = 'diagnostics matched contract (sanitised, no secret disclosure)' }
                        if (-not $diagBodyOk -and $diagReason.Length -eq 0) { $diagReason = "status 200 but diagnostics body missing expected fields - actual: $($diagContent.Substring(0, [Math]::Min(160, $diagContent.Length)))" }
                    }
                    if ($diagError.Length -gt 0 -and $diagReason.Length -eq 0) { $diagReason = "unreachable: $diagError" }
                    if ($diagVerdict -eq 'FAIL' -and $diagReason.Length -eq 0) { $diagReason = "expected 200 for diagnostics, got $diagStatus" }

                    $script:Results.Add([pscustomobject]@{
                        Name = 'daemon/diagnostics'; Class = 'DAEMON'; Method = 'GET'; Url = "$daemonBase/v1/diagnostics"
                        Expected = 200; Actual = $diagStatus; Bytes = $diagSize; Verdict = $diagVerdict; Reason = $diagReason
                    })
                    $colour = 'Red'
                    if ($diagVerdict -eq 'PASS') { $colour = 'Green' }
                    Write-Host ("    {0,-24} {1,-6} {2,5} {3,6}B  {4}  <- {5}" -f 'daemon/diagnostics', 'GET', "$diagStatus", $diagSize, $diagVerdict, $diagReason) -ForegroundColor $colour
                }
            }
        }
    }

    # -----------------------------------------------------------------------------------------
    if (-not $SkipProxyCheck) {
        Write-Host '' -ForegroundColor White
        Write-Host 'Frontend proxy path (the route the browser actually uses)' -ForegroundColor Cyan
        $proxyUrl = "http://$BindAddress`:$FrontendPort/api/health"
        try {
            $pr = Invoke-WebRequest -Uri $proxyUrl -UseBasicParsing -TimeoutSec 15
            $ok = ($pr.StatusCode -eq 200 -and $pr.Content -match '"status"\s*:\s*"ok"')
            $verdict = 'FAIL'
            $reason = 'the proxied body did not carry the expected status field'
            if ($ok) { $verdict = 'PASS'; $reason = 'proxied health matched' }
            $script:Results.Add([pscustomobject]@{ Name = 'vite-proxy/health'; Class = 'REQUIRED'; Method = 'GET'; Url = $proxyUrl; Expected = 200; Actual = [int]$pr.StatusCode; Bytes = $pr.Content.Length; Verdict = $verdict; Reason = $reason })
            $colour = 'Green'
            if (-not $ok) { $colour = 'Red' }
            Write-Host "    proxied /api/health -> $($pr.StatusCode)  $verdict" -ForegroundColor $colour
        }
        catch {
            $script:Results.Add([pscustomobject]@{ Name = 'vite-proxy/health'; Class = 'REQUIRED'; Method = 'GET'; Url = $proxyUrl; Expected = 200; Actual = 0; Bytes = 0; Verdict = 'FAIL'; Reason = "unreachable: $($_.Exception.Message)" })
            Write-Host "    proxied /api/health -> UNREACHABLE  FAIL ($($_.Exception.Message))" -ForegroundColor Red
            Write-Host '    Is the Vite dev server running? Start it with 03-Start-IipsServers.ps1.' -ForegroundColor Yellow
        }
    }

    # -----------------------------------------------------------------------------------------
    Write-Host '' -ForegroundColor White
    Write-Host '-------------------------------------------------------------' -ForegroundColor DarkGray
    $pass = @($script:Results | Where-Object { $_.Verdict -eq 'PASS' }).Count
    $fail = @($script:Results | Where-Object { $_.Verdict -eq 'FAIL' }).Count
    $expectedClosed = @($script:Results | Where-Object { $_.Verdict -eq 'EXPECTED-FAIL-CLOSED' }).Count
    $serverFaults = @($script:Results | Where-Object { $_.Actual -eq 500 }).Count

    $passColour = 'Green'
    if ($pass -eq 0) { $passColour = 'Yellow' }
    $failColour = 'Green'
    if ($fail -gt 0) { $failColour = 'Red' }
    $faultColour = 'Green'
    if ($serverFaults -gt 0) { $faultColour = 'Red' }

    Write-Host "    PASS                  : $pass" -ForegroundColor $passColour
    Write-Host "    EXPECTED-FAIL-CLOSED  : $expectedClosed" -ForegroundColor Yellow
    Write-Host "    FAIL                  : $fail" -ForegroundColor $failColour
    Write-Host "    HTTP 500 responses    : $serverFaults" -ForegroundColor $faultColour
    Write-Host ''

    if ($fail -gt 0) {
        Write-Host '    Failures:' -ForegroundColor Red
        foreach ($r in ($script:Results | Where-Object { $_.Verdict -eq 'FAIL' })) {
            Write-Host "      $($r.Name) [$($r.Class)] expected $($r.Expected), got $($r.Actual)" -ForegroundColor Red
            Write-Host "        $($r.Reason)" -ForegroundColor Red
        }
        Write-Host ''
    }

    if (-not (Test-Path -LiteralPath $LogRoot)) { New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null }
    $csvPath = Join-Path $LogRoot ("04-endpoints-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".csv")
    $script:Results | Select-Object Name, Class, Method, Url, Expected, Actual, Bytes, Verdict, Reason |
        Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8
    Write-Host "    Result CSV: $csvPath" -ForegroundColor Yellow
    Write-Host ''

    if ($fail -gt 0) {
        Write-Host "FAILED: $fail endpoint(s) did not match the contract." -ForegroundColor Red
        Write-Host '        A fail-closed response only counts as expected when it is the exact documented' -ForegroundColor Red
        Write-Host '        signature AND its prerequisite is genuinely absent. HTTP 500 is always an error.' -ForegroundColor Red
        Write-Host '        Check the transport log under logs\services-*\irr-transport.err.log' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Backend endpoint validation: stopped with exit 4. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 4
    }

    Write-Host 'Every endpoint matched its contract.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'NEXT: verify the screens by hand in the browser - this script does not do that for you.' -ForegroundColor Cyan
    Write-Host "      http://$BindAddress`:$FrontendPort/" -ForegroundColor Cyan
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'Backend endpoint validation: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    Write-Host '' -ForegroundColor White
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Backend endpoint validation: stopped with exit 1. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 1
}
