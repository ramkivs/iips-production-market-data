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

    EXIT CODES
      0  every REQUIRED and every prerequisite-backed endpoint matched its contract
      1  unhandled failure
      2  precondition failure - the transport is not reachable at all
      4  one or more endpoints did not match the contract (including any HTTP 500)

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\04-Validate-BackendEndpoints.ps1 -IpdIpcExpected -ReportsExpected
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
    [switch] $IpdIpcExpected,

    [Parameter(Mandatory = $false)]
    [switch] $ReportsExpected,

    [Parameter(Mandatory = $false)]
    [switch] $SkipProxyCheck,

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
    if (-not $SkipProxyCheck) {
        Write-Host ''
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
    Write-Host ''
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
    Write-Host ''
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'Backend endpoint validation: stopped with exit 1. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 1
}
