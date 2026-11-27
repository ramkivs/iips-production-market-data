#requires -Version 7.2
<#
.SYNOPSIS
    W-14 Scope B — Hardened 96-instrument sequential live quote capture (local daemon).

.DESCRIPTION
    Sequential-only execution against POST http://127.0.0.1:8791/v1/quotes
    with the established three-field canonical contract:
      { companyId, securityId (ISIN:<isin>:<series>), exchangeSegment (NSE_EQ|BSE_EQ) }

    This script is preparation for the owner's later Windows market-hours execution.
    It does NOT perform live vendor qualification — it captures local daemon responses
    and records explicit limitations where vendor provenance cannot be established
    from the current envelope.

    Supported path: 96 sequential POSTs to /v1/quotes (one per canonical identity).
    BatchMode is NOT a supported execution path — see PARAMETER BatchMode.

    Every response is BOTH displayed (Write-Host) and written to file (mirrored).

.PARAMETER DaemonBaseUrl
    Daemon origin. Must be loopback http://. Default http://127.0.0.1:8791.

.PARAMETER TransportToken
    Bearer for IIPS_MARKET_DATA_TRANSPORT_TOKEN. Defaults to env var of same name.
    Presence alone does NOT prove authentication — the authenticated health and
    quote responses do. Empty => fail-closed before any I/O.

.PARAMETER IdentityJsonPath
    Defaults to <repo>/evidence/dhan-w14-e4/w14-scope-b-96-identities.json

.PARAMETER IdentityTxtPath
    Defaults to <repo>/evidence/dhan-w14-e4/w14-scope-b-96-identities.txt
    Used only to cross-check JSON — not as fallback for missing JSON.

.PARAMETER EvidenceMirrorDir
    Repo-auditable mirror. Defaults to <repo>/evidence/dhan-w14-e4

.PARAMETER RuntimeLogsDir
    Live machine log dir. Defaults to H:\IIPS\runtime\logs (Windows host).

.PARAMETER DelayMsBetweenQuotes
    Throttle between sequential requests. Default 250 ms.

.PARAMETER RequestTimeoutSec
    HttpClient.Timeout per request. Default 35 s.

.PARAMETER BatchMode
    DIAGNOSTIC PROBE ONLY — NOT a working 96-instrument batch operation.
    The daemon currently accepts only single-instrument POST /v1/quotes.
    If -BatchMode is specified the script stops fail-closed with an explanatory
    error before any preflight or quote request. Remove the flag to run the
    supported sequential sweep.

.NOTES
    Prerequisites: daemon running (dhan_local_daemon), env IIPS_MARKET_DATA_TRANSPORT_TOKEN set,
    Stage-1 non-production, loopback only. No Dhan credentials are read/echoed.
    No live vendor requests are made during script validation/testing.

.EXAMPLE
    .\scripts\Invoke-W14LiveQuotes.ps1

.EXAMPLE
    .\scripts\Invoke-W14LiveQuotes.ps1 -TransportToken $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN

#>
[CmdletBinding()]
param(
    [string]$DaemonBaseUrl = 'http://127.0.0.1:8791',
    [string]$TransportToken = $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN,
    [string]$IdentityJsonPath = '',
    [string]$IdentityTxtPath = '',
    [string]$EvidenceMirrorDir = '',
    [string]$RuntimeLogsDir = 'H:\IIPS\runtime\logs',
    [ValidateRange(0, 10000)][int]$DelayMsBetweenQuotes = 250,
    [ValidateRange(5, 120)][int]$RequestTimeoutSec = 35,
    [switch]$BatchMode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
# 0) BatchMode — explicit unsupported-path handling (no silent fallback)
# ─────────────────────────────────────────────────────────────────────────────
if ($BatchMode) {
    throw @"
BatchMode is NOT a supported execution path for W-14 Scope B capture.

The daemon currently implements only single-instrument POST /v1/quotes
{ companyId, securityId, exchangeSegment }. A grouped payload
{ NSE_EQ:[...], BSE_EQ:[...] } is the vendor batch shape and is not
accepted by the daemon (it will 400/404). Do NOT use -BatchMode as a
96-instrument batch operation.

Supported path: sequential sweep (default, no flag):
  .\scripts\Invoke-W14LiveQuotes.ps1

If you intended a diagnostic probe of POST /v1/quotes/batch, do it
explicitly with manual curl and do not treat its failure as a successful
batch capture. Remove -BatchMode to run the supported sequential workflow.
"@
}

# ─────────────────────────────────────────────────────────────────────────────
# Resolve repo-relative defaults (script lives in <repo>/scripts/)
# ─────────────────────────────────────────────────────────────────────────────
$RepoRoot = $null
try {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..') -ErrorAction Stop).Path
} catch {
    $RepoRoot = (Get-Location).Path
}
if (-not $IdentityJsonPath) { $IdentityJsonPath = Join-Path $RepoRoot 'evidence/dhan-w14-e4/w14-scope-b-96-identities.json' }
if (-not $IdentityTxtPath)  { $IdentityTxtPath  = Join-Path $RepoRoot 'evidence/dhan-w14-e4/w14-scope-b-96-identities.txt' }
if (-not $EvidenceMirrorDir){ $EvidenceMirrorDir = Join-Path $RepoRoot 'evidence/dhan-w14-e4' }

$DaemonBaseUrl = $DaemonBaseUrl.Trim().TrimEnd('/')
if (-not $DaemonBaseUrl) { $DaemonBaseUrl = 'http://127.0.0.1:8791' }

# ─────────────────────────────────────────────────────────────────────────────
# 1) Strict identity preflight — ALL checks before any I/O or network
# ─────────────────────────────────────────────────────────────────────────────
function Assert-StrictIdentityPreflight {
    param([string]$JsonPath, [string]$TxtPath)

    if (-not (Test-Path -LiteralPath $JsonPath)) {
        throw "IDENTITY PREFLIGHT FAILED: JSON not found at $JsonPath — published Scope B dataset is required."
    }

    $raw = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8
    try { $doc = $raw | ConvertFrom-Json -Depth 10 } catch { throw "IDENTITY PREFLIGHT FAILED: JSON is not valid JSON at $JsonPath — $($_.Exception.Message)" }

    if ($null -eq $doc.instruments -or $doc.instruments.Count -eq 0) {
        throw "IDENTITY PREFLIGHT FAILED: instruments[] missing or empty in $JsonPath"
    }

    $instruments = @($doc.instruments)

    # 1a) Exactly 96
    if ($instruments.Count -ne 96) {
        throw "IDENTITY PREFLIGHT FAILED: instrumentCount=$($instruments.Count), expected exactly 96 (Scope B). Source: $JsonPath"
    }

    # 1b) 48 NSE_EQ / 48 BSE_EQ
    $nse = @($instruments | Where-Object { $_.exchangeSegment -eq 'NSE_EQ' }).Count
    $bse = @($instruments | Where-Object { $_.exchangeSegment -eq 'BSE_EQ' }).Count
    if ($nse -ne 48 -or $bse -ne 48) {
        throw "IDENTITY PREFLIGHT FAILED: NSE_EQ=$nse BSE_EQ=$bse, expected 48/48. Source: $JsonPath"
    }

    # 1c) All three canonical fields present and non-empty for every instrument
    # 1d) SecurityId canonical format
    # 1e) No duplicates
    $seenTriple   = @{} # key = "companyId|securityId|exchangeSegment"
    $seenSecId    = @{} # securityId must be unique across 96 (BSE A/B vs NSE EQ are distinct)
    $seenCompanyBySegment = @{} # companyId+segment must be unique (company repeats across exchanges only)
    $distinctIsins = @{}

    $idx = 0
    foreach ($it in $instruments) {
        $idx++
        $prefix = "instrument[$idx]"

        foreach ($field in @('companyId','securityId','exchangeSegment')) {
            $val = $it.$field
            if ($null -eq $val -or -not ($val -is [string]) -or [string]::IsNullOrWhiteSpace($val)) {
                throw "IDENTITY PREFLIGHT FAILED: $prefix missing/empty canonical field '$field' — $($it | ConvertTo-Json -Compress)"
            }
            if ($val -ne $val.Trim()) {
                throw "IDENTITY PREFLIGHT FAILED: $prefix field '$field' has leading/trailing whitespace: '$val'"
            }
        }

        if ($it.exchangeSegment -notin @('NSE_EQ','BSE_EQ')) {
            throw "IDENTITY PREFLIGHT FAILED: $prefix exchangeSegment='$($it.exchangeSegment)' not in {NSE_EQ,BSE_EQ}"
        }

        # Canonical ISIN-based format: ISIN:<12 alnum>:<series>
        if ($it.securityId -notmatch '^ISIN:[A-Za-z0-9]{12}:[A-Za-z0-9_.-]+$') {
            throw "IDENTITY PREFLIGHT FAILED: $prefix securityId='$($it.securityId)' not canonical ISIN:<12 alnum>:<series>"
        }
        $parts = $it.securityId -split ':'
        $isin = $parts[1]
        $series = $parts[2]
        if ($isin.Length -ne 12 -or $isin -notmatch '^[A-Za-z0-9]{12}$') {
            throw "IDENTITY PREFLIGHT FAILED: $prefix ISIN length/charset invalid: '$isin'"
        }
        if ([string]::IsNullOrWhiteSpace($series)) {
            throw "IDENTITY PREFLIGHT FAILED: $prefix series is empty in securityId '$($it.securityId)'"
        }

        # Series expectation per exchange (BSE_EQ -> A|B, NSE_EQ -> EQ). Enforced strictly.
        if ($it.exchangeSegment -eq 'NSE_EQ' -and $series -ne 'EQ') {
            throw "IDENTITY PREFLIGHT FAILED: $prefix NSE_EQ series must be 'EQ', got '$series' for $($it.securityId)"
        }
        if ($it.exchangeSegment -eq 'BSE_EQ' -and $series -notin @('A','B')) {
            throw "IDENTITY PREFLIGHT FAILED: $prefix BSE_EQ series must be 'A' or 'B', got '$series' for $($it.securityId)"
        }

        $tripleKey = "$($it.companyId)|$($it.securityId)|$($it.exchangeSegment)"
        if ($seenTriple.ContainsKey($tripleKey)) {
            throw "IDENTITY PREFLIGHT FAILED: duplicate identity combination at $prefix: $tripleKey"
        }
        $seenTriple[$tripleKey] = $true

        if ($seenSecId.ContainsKey($it.securityId)) {
            throw "IDENTITY PREFLIGHT FAILED: duplicate securityId '$($it.securityId)' at $prefix"
        }
        $seenSecId[$it.securityId] = $true

        $companySegKey = "$($it.companyId)|$($it.exchangeSegment)"
        if ($seenCompanyBySegment.ContainsKey($companySegKey)) {
            throw "IDENTITY PREFLIGHT FAILED: duplicate companyId+exchangeSegment '$companySegKey' at $prefix"
        }
        $seenCompanyBySegment[$companySegKey] = $true

        # Track distinct ISINs (should be 48 distinct ISINs — each company has one ISIN, dual-listed)
        $distinctIsins[$isin] = $true
    }

    if ($distinctIsins.Keys.Count -ne 48) {
        throw "IDENTITY PREFLIGHT FAILED: distinct ISINs=$($distinctIsins.Keys.Count), expected 48 (Scope B dual-listed)."
    }
    if ($seenSecId.Keys.Count -ne 96) {
        throw "IDENTITY PREFLIGHT FAILED: distinct securityIds=$($seenSecId.Keys.Count), expected 96."
    }

    # 1f) Cross-check against TXT published dataset — no missing/unexpected
    if (Test-Path -LiteralPath $TxtPath) {
        $txtInstruments = Resolve-TxtIdentities -TxtPath $TxtPath
        if ($txtInstruments.Count -ne $instruments.Count) {
            throw "IDENTITY PREFLIGHT FAILED: TXT count $($txtInstruments.Count) != JSON count $($instruments.Count) — published datasets diverge."
        }
        $txtSet = @{}
        foreach ($t in $txtInstruments) { $txtSet["$($t.companyId)|$($t.securityId)|$($t.exchangeSegment)"] = $true }
        $jsonSet = @{}
        foreach ($j in $instruments) { $jsonSet["$($j.companyId)|$($j.securityId)|$($j.exchangeSegment)"] = $true }

        $missingInTxt = @($jsonSet.Keys | Where-Object { -not $txtSet.ContainsKey($_) })
        $unexpectedInJson = @($txtSet.Keys | Where-Object { -not $jsonSet.ContainsKey($_) })
        if ($missingInTxt.Count -gt 0 -or $unexpectedInJson.Count -gt 0) {
            $msg = "IDENTITY PREFLIGHT FAILED: JSON↔TXT mismatch — missing in TXT: $($missingInTxt -join ', '); unexpected in JSON: $($unexpectedInJson -join ', ')"
            throw $msg
        }
        Write-Host "TXT cross-check: 96/96 identities match JSON (no missing/unexpected)." -ForegroundColor Green
    } else {
        throw "IDENTITY PREFLIGHT FAILED: TXT published dataset not found at $TxtPath — both JSON and TXT are required for cross-check."
    }

    # Return as PSCustomObjects for downstream use
    $validated = foreach ($it in $instruments) {
        [pscustomobject]@{ companyId = [string]$it.companyId; securityId = [string]$it.securityId; exchangeSegment = [string]$it.exchangeSegment }
    }
    Write-Host "Identity preflight: 96 instruments validated (NSE_EQ=48 BSE_EQ=48, distinct ISINs=48, no duplicates, TXT cross-checked)." -ForegroundColor Green
    return ,@($validated)
}

function Resolve-TxtIdentities {
    param([string]$TxtPath)
    $lines = Get-Content -LiteralPath $TxtPath -Encoding UTF8
    $list = [System.Collections.Generic.List[object]]::new()
    $cur = @{}
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            if ($cur.Count -eq 3) {
                $list.Add([pscustomobject]@{ companyId = $cur['companyId']; securityId = $cur['securityId']; exchangeSegment = $cur['exchangeSegment'] })
                $cur = @{}
            } elseif ($cur.Count -ne 0) {
                throw "IDENTITY PREFLIGHT FAILED: TXT block incomplete: $($cur | ConvertTo-Json -Compress)"
            }
            continue
        }
        if ($line -match '^\s*companyId\s*=\s*(.+?)\s*$') { $cur['companyId'] = $Matches[1].Trim(); continue }
        if ($line -match '^\s*securityId\s*=\s*(.+?)\s*$') { $cur['securityId'] = $Matches[1].Trim(); continue }
        if ($line -match '^\s*exchangeSegment\s*=\s*(.+?)\s*$') { $cur['exchangeSegment'] = $Matches[1].Trim(); continue }
        throw "IDENTITY PREFLIGHT FAILED: unexpected TXT line: $line"
    }
    if ($cur.Count -eq 3) { $list.Add([pscustomobject]@{ companyId = $cur['companyId']; securityId = $cur['securityId']; exchangeSegment = $cur['exchangeSegment'] }) }
    elseif ($cur.Count -ne 0) { throw "IDENTITY PREFLIGHT FAILED: trailing TXT block incomplete" }
    return ,@($list.ToArray())
}

# ─────────────────────────────────────────────────────────────────────────────
# 2) Output preflight — mandatory destinations must be writable BEFORE any network
# ─────────────────────────────────────────────────────────────────────────────
function Assert-OutputPreflight {
    param([string[]]$Dirs)
    $validated = [System.Collections.Generic.List[string]]::new()
    foreach ($dir in $Dirs) {
        if ([string]::IsNullOrWhiteSpace($dir)) { continue }
        try {
            if (-not (Test-Path -LiteralPath $dir)) {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            }
            # Probe writability with a temp file that is immediately removed
            $probe = Join-Path $dir ".w14-write-probe-$([Guid]::NewGuid().ToString('N')).tmp"
            [IO.File]::WriteAllText($probe, "probe", [Text.Encoding]::UTF8)
            Remove-Item -LiteralPath $probe -Force -ErrorAction Stop
            $validated.Add($dir)
            Write-Host "Output preflight: writable $dir" -ForegroundColor Green
        } catch {
            throw "OUTPUT PREFLIGHT FAILED: directory '$dir' is not writable or cannot be created — $($_.Exception.Message). Stop before making requests."
        }
    }
    if ($validated.Count -eq 0) {
        throw "OUTPUT PREFLIGHT FAILED: no writable mandatory output location. Checked: $($Dirs -join ', ')"
    }
    return ,@($validated.ToArray())
}

# ─────────────────────────────────────────────────────────────────────────────
# 3) Transport helpers — same HttpClient pattern, fail-closed
# ─────────────────────────────────────────────────────────────────────────────
function New-DaemonClient {
    param([string]$Token, [int]$TimeoutSec)
    Add-Type -AssemblyName System.Net.Http -ErrorAction SilentlyContinue
    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)
    $client.DefaultRequestHeaders.Authorization =
        [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
    $client.DefaultRequestHeaders.Accept.Clear()
    $client.DefaultRequestHeaders.Accept.Add(
        [System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::new('application/json')
    )
    return $client
}

function Assert-HealthAndAuthPreflight {
    param([string]$BaseUrl, [string]$Token, [int]$TimeoutSec)

    if ([string]::IsNullOrWhiteSpace($Token)) {
        throw "HEALTH PREFLIGHT FAILED: transport token is missing. Set `$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN or pass -TransportToken."
    }
    # Token presence alone does not prove authentication — daemon's 401/403 does. We do not claim otherwise.

    $client = $null
    try {
        $client = New-DaemonClient -Token $Token -TimeoutSec $TimeoutSec
        $healthUrl = "$BaseUrl/v1/health"
        $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $healthUrl)
        try {
            $resp = $client.SendAsync($req).GetAwaiter().GetResult()
            $bodyText = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $status = [int]$resp.StatusCode
            $resp.Dispose()
            if ($status -lt 200 -or $status -ge 300) {
                throw "HEALTH PREFLIGHT FAILED: GET $healthUrl returned HTTP $status — body: $bodyText"
            }
            $parsed = $bodyText | ConvertFrom-Json -ErrorAction Stop
            if ($parsed.service -ne 'UP') {
                throw "HEALTH PREFLIGHT FAILED: service='$($parsed.service)' expected 'UP' — body: $bodyText"
            }
            # Validate is parsable but do not treat non-empty token as proof of Dhan auth; actual quote 502/401 does.
            Write-Host "Health preflight: HTTP 200 service=UP providerConfiguration=$($parsed.providerConfiguration) liveProviderConnectivity=$($parsed.liveProviderConnectivity) (token presence alone is not proof of Dhan auth)" -ForegroundColor Green
            return $parsed
        } finally { $req.Dispose() }
    } catch {
        if ($_.Exception.Message -match 'HEALTH PREFLIGHT FAILED') { throw }
        throw "HEALTH PREFLIGHT FAILED: transport error reaching $BaseUrl/v1/health — $($_.Exception.Message). Daemon must be running on loopback with a valid transport token."
    } finally {
        if ($null -ne $client) { $client.Dispose() }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 4) Quote response validation — HTTP 200 is NOT automatic success
# ─────────────────────────────────────────────────────────────────────────────
function Test-QuoteResponse {
    param(
        [pscustomobject]$RequestedIdentity,
        [Nullable[int]]$HttpStatus,
        [string]$BodyText
    )

    $result = [ordered]@{
        isValidQuote        = $false
        validationCode      = 'UNKNOWN'
        validationMessage   = ''
        envelopeCompanyId   = $null
        envelopeSecurityId  = $null
        freshness           = $null
        timestampUtc        = $null
        provenanceAsOfUtc   = $null
        provenanceReceivedAtUtc = $null
        provenanceQuality   = $null
        cacheVsVendor       = 'CANNOT_DISTINGUISH_FROM_ENVELOPE'
        limitationNote      = 'Cache-served (orchestrator) vs vendor-refreshed is not exposed in the quote envelope. Vendor provenance cannot be proven from a local 200 alone; see /v1/diagnostics quoteCache / freshness for indirect evidence.'
        rawParsed           = $null
    }

    if ($null -eq $HttpStatus) {
        $result.validationCode = 'TRANSPORT_FAILURE'
        $result.validationMessage = 'No HTTP status — request failed before daemon responded (transport/timeout).'
        return $result
    }

    if ($HttpStatus -ne 200) {
        $result.validationCode = 'HTTP_ERROR'
        $result.validationMessage = "HTTP $HttpStatus — not a successful quote capture."
        # Try to surface daemon error code for accounting
        try {
            $parsed = $BodyText | ConvertFrom-Json -ErrorAction Stop
            $result.rawParsed = $parsed
            if ($parsed.error -and $parsed.error.code) {
                $result.validationMessage += " daemon error code=$($parsed.error.code) vendorHttpStatus=$($parsed.error.vendorHttpStatus)"
            }
        } catch {}
        return $result
    }

    # HTTP 200 — must still validate contract
    try { $parsed = $BodyText | ConvertFrom-Json -ErrorAction Stop } catch {
        $result.validationCode = 'MALFORMED_RESPONSE'
        $result.validationMessage = "HTTP 200 but body is not valid JSON: $($_.Exception.Message)"
        return $result
    }
    $result.rawParsed = $parsed

    if ($parsed.ok -ne $true) {
        $result.validationCode = 'DAEMON_REPORTED_FAILURE'
        $result.validationMessage = "HTTP 200 but ok != true (daemon envelope reports failure). Code=$($parsed.error.code) message=$($parsed.error.message)"
        return $result
    }

    $envelope = $parsed.envelope
    if ($null -eq $envelope) {
        $result.validationCode = 'MISSING_ENVELOPE'
        $result.validationMessage = 'HTTP 200 ok:true but missing envelope object.'
        return $result
    }

    # Returned identity must match requested canonical identity
    $envCompany = $envelope.companyId
    $envSecId   = $envelope.securityId
    $result.envelopeCompanyId = $envCompany
    $result.envelopeSecurityId = $envSecId

    if ($envCompany -ne $RequestedIdentity.companyId) {
        $result.validationCode = 'IDENTITY_MISMATCH'
        $result.validationMessage = "Company mismatch: requested '$($RequestedIdentity.companyId)' envelope '$envCompany'"
        return $result
    }
    # securityId may be top-level envelope.securityId or inside payload.securityIdentity.securityId
    $candidateSecIds = @()
    if ($envSecId) { $candidateSecIds += $envSecId }
    if ($envelope.payload -and $envelope.payload.securityIdentity -and $envelope.payload.securityIdentity.securityId) {
        $candidateSecIds += $envelope.payload.securityIdentity.securityId
    }
    if ($candidateSecIds.Count -gt 0 -and $RequestedIdentity.securityId -notin $candidateSecIds) {
        $result.validationCode = 'IDENTITY_MISMATCH'
        $result.validationMessage = "SecurityId mismatch: requested '$($RequestedIdentity.securityId)' envelope/payload '$($candidateSecIds -join ',')'"
        return $result
    }
    if ($envSecId -and $envSecId -ne $RequestedIdentity.securityId -and $candidateSecIds.Count -eq 1) {
        $result.validationCode = 'IDENTITY_MISMATCH'
        $result.validationMessage = "SecurityId strict mismatch: requested '$($RequestedIdentity.securityId)' envelope '$envSecId'"
        return $result
    }

    # Usable quote present — ltp must be positive number, provenance present
    $payload = $envelope.payload
    if ($null -eq $payload) {
        $result.validationCode = 'MISSING_PAYLOAD'
        $result.validationMessage = 'Envelope missing payload (no quote data).'
        return $result
    }
    $ltp = $payload.ltp
    if ($null -eq $ltp) {
        # Some historical paths use different field, but D01 canonical requires ltp
        $result.validationCode = 'MISSING_LTP'
        $result.validationMessage = 'Payload missing ltp — not a usable quote.'
        return $result
    }
    if (-not ($ltp -is [double] -or $ltp -is [int] -or $ltp -is [long] -or $ltp -is [decimal])) {
        # JSON numbers may deserialize as Int64/Double — check numeric
        try { $asNum = [double]$ltp } catch {
            $result.validationCode = 'INVALID_LTP_TYPE'
            $result.validationMessage = "ltp is not numeric: $ltp ($($ltp.GetType().Name))"
            return $result
        }
    }
    if ([double]$ltp -le 0) {
        $result.validationCode = 'INVALID_LTP_VALUE'
        $result.validationMessage = "ltp must be >0, got $ltp"
        return $result
    }

    # Timestamp and freshness assessment — where supported, validated; otherwise limitation noted
    $freshness = $parsed.freshness
    $result.freshness = $freshness
    if ($freshness -notin @('CURRENT','STALE')) {
        $result.validationCode = 'INVALID_FRESHNESS'
        $result.validationMessage = "freshness='$freshness' expected CURRENT|STALE"
        return $result
    }

    $ts = $envelope.timestamp
    $result.timestampUtc = $ts
    if ($ts) {
        $parsedTs = [DateTime]::MinValue
        if (-not [DateTime]::TryParse($ts, [ref]$parsedTs)) {
            $result.validationCode = 'INVALID_TIMESTAMP'
            $result.validationMessage = "envelope.timestamp not parseable as ISO UTC: $ts"
            return $result
        }
        # Label correctly: envelope.timestamp is UTC ISO; record as such
    }

    $prov = $envelope.provenance
    if ($prov) {
        $result.provenanceQuality = $prov.qualityState
        $result.provenanceAsOfUtc = $prov.asOf
        $result.provenanceReceivedAtUtc = $prov.receivedAt
        # Validate canonical UTC shape where present, but do not fail on missing optional fields
        foreach ($field in @('asOf','receivedAt','evaluatedAt')) {
            $val = $prov.$field
            if ($val) {
                $dt = [DateTime]::MinValue
                if (-not [DateTime]::TryParse($val, [ref]$dt)) {
                    $result.validationCode = 'INVALID_PROVENANCE_TIMESTAMP'
                    $result.validationMessage = "provenance.$field not parseable: $val"
                    return $result
                }
            }
        }
    } else {
        $result.limitationNote += ' Provenance block absent in envelope — freshness/lineage cannot be assessed.'
    }

    # Cache vs vendor — not exposed in envelope (by design). Record limitation explicitly.
    # Do NOT label local 200 as proof of live vendor call.
    $result.cacheVsVendor = 'CANNOT_DISTINGUISH_FROM_ENVELOPE'
    if ($freshness -eq 'STALE') {
        $result.limitationNote += ' freshness=STALE indicates cached data beyond threshold — not a confirmed vendor refresh.'
    }

    $result.isValidQuote = $true
    $result.validationCode = 'VALID'
    $result.validationMessage = "Valid quote: ltp=$ltp freshness=$freshness identity matched."
    return $result
}

# ─────────────────────────────────────────────────────────────────────────────
# PREFLIGHTS (strict, fail-closed, before any quote request)
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== W-14 SCOPE B — 96-INSTRUMENT SEQUENTIAL CAPTURE (HARDENED) ===" -ForegroundColor Cyan
Write-Host "Daemon endpoint: POST $DaemonBaseUrl/v1/quotes  {companyId, securityId, exchangeSegment}" -ForegroundColor DarkGray
Write-Host "Request timeout: ${RequestTimeoutSec}s  Throttle: ${DelayMsBetweenQuotes}ms between quotes" -ForegroundColor DarkGray
Write-Host "BatchMode is NOT supported — sequential is the only execution path." -ForegroundColor DarkGray

# 1) Identity preflight — fail-closed
$identities = Assert-StrictIdentityPreflight -JsonPath $IdentityJsonPath -TxtPath $IdentityTxtPath

# 2) Output preflight — fail-closed (both mandatory destinations)
$writeTargets = Assert-OutputPreflight -Dirs @($RuntimeLogsDir, $EvidenceMirrorDir)
Write-Host "Output destinations: $($writeTargets -join ' | ')" -ForegroundColor DarkGray

# 3) Health + auth preflight — fail-closed (no quote requests after failed health)
$health = Assert-HealthAndAuthPreflight -BaseUrl $DaemonBaseUrl -Token $TransportToken -TimeoutSec 10
# Note: successful health proves local service is UP and transport token was accepted (200 + service=UP).
# It does NOT prove Dhan vendor authentication — that is determined by the quote response's ok/envelope/provenance.

# Prepare output filenames with correctly labelled UTC timestamps
$utcNowForFile = [DateTime]::UtcNow
$timestampFile = $utcNowForFile.ToString('yyyyMMdd-HHmmss')
$timestampUtcIso = $utcNowForFile.ToString('o') # 2026-...Z — UTC, labelled
$aggregateFileName = "w14-live-quotes-$timestampFile.json"
$summaryFileName   = "w14-live-quotes-$timestampFile.summary.txt"

function Write-MirroredFile {
    param([string]$FileName, [string]$Content)
    foreach ($dir in $writeTargets) {
        $p = Join-Path $dir $FileName
        Set-Content -LiteralPath $p -Value $Content -Encoding UTF8 -NoNewline:$false
    }
    Write-Host "Mirrored $FileName to $($writeTargets.Count) location(s)" -ForegroundColor DarkGray
}

function Write-MirroredPerInstrumentFile {
    param([pscustomobject]$Identity, [string]$Body, [string]$TimestampFile)
    $safeCompany = $Identity.companyId -replace '[^A-Za-z0-9_.-]', '_'
    $safeSeg     = $Identity.exchangeSegment
    $fileName = "w14-live-quote-${safeCompany}-${safeSeg}-$TimestampFile.json"
    foreach ($dir in $writeTargets) {
        $p = Join-Path $dir $fileName
        Set-Content -LiteralPath $p -Value $Body -Encoding UTF8
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# SEQUENTIAL SWEEP — 96 POST /v1/quotes
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== SEQUENTIAL SWEEP — 96 POST /v1/quotes ===" -ForegroundColor Cyan
Write-Host "Each response will be displayed AND written to file. No live vendor claim is made from local 200 alone." -ForegroundColor DarkGray

$runStartedAtUtc = [DateTime]::UtcNow
$runStartedAtUtcIso = $runStartedAtUtc.ToString('o')

$results = [System.Collections.Generic.List[object]]::new()
# Distinct counters — do NOT conflate
$localRequestsMade = 0
$localHttp200Count = 0
$validQuoteCount = 0
$invalidQuoteCount = 0
$transportFailureCount = 0
$httpErrorCount = 0
# Vendor refresh cannot be confirmed from envelope alone — track as limitation
$confirmedVendorRefreshes = 0
$vendorRefreshLimitation = 'CANNOT_CONFIRM_FROM_ENVELOPE: quote envelope does not expose cache vs vendor egress; see /v1/diagnostics quoteCache for indirect evidence. No local 200 is proof of a live Dhan vendor call.'

$client = New-DaemonClient -Token $TransportToken -TimeoutSec $RequestTimeoutSec
$quotesUrl = "$DaemonBaseUrl/v1/quotes"

try {
    $idx = 0
    foreach ($id in $identities) {
        $idx++
        $localRequestsMade++
        $label = "[$idx/96] $($id.companyId) $($id.securityId) $($id.exchangeSegment)"

        $body = @{
            companyId       = $id.companyId
            securityId      = $id.securityId
            exchangeSegment = $id.exchangeSegment
        } | ConvertTo-Json -Compress

        $requestAtUtc = [DateTime]::UtcNow
        $requestAtUtcIso = $requestAtUtc.ToString('o')
        $httpStatus = $null
        $responseBody = $null
        $transportError = $null
        $validation = $null

        try {
            $content = [System.Net.Http.StringContent]::new(
                $body,
                [System.Text.Encoding]::UTF8,
                'application/json'
            )
            try {
                $response = $client.PostAsync($quotesUrl, $content).GetAwaiter().GetResult()
                $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                $httpStatus = [int]$response.StatusCode
            } finally {
                if ($null -ne $response) { $response.Dispose() }
                $content.Dispose()
            }

            Write-Host "`n--- $label ---"
            $statusText = if ($null -eq $httpStatus) { 'null (transport failure)' } else { "$httpStatus" }
            Write-Host "HTTP STATUS: $statusText" -ForegroundColor $(if ($httpStatus -eq 200) { 'Green' } else { 'Red' })
            Write-Host 'QUOTE RESPONSE:'
            Write-Host $responseBody

            Write-MirroredPerInstrumentFile -Identity $id -Body $responseBody -TimestampFile $timestampFile
        } catch {
            $transportError = $_.Exception.Message
            $responseBody = if ($responseBody) { $responseBody } else { $transportError }
            Write-Host "`n--- $label ---" -ForegroundColor Yellow
            Write-Host "TRANSPORT FAILURE: $transportError" -ForegroundColor Red
            Write-Host "HTTP STATUS: null (no daemon response — transport/timeout)" -ForegroundColor Red
            Write-Host "CAPTURED ERROR BODY: $responseBody" -ForegroundColor Red
            # httpStatus stays $null — null-safe handling downstream
        }

        # Null-safe HTTP buckets — transport failures do not crash summary
        if ($null -eq $httpStatus) {
            $transportFailureCount++
        } elseif ($httpStatus -eq 200) {
            $localHttp200Count++
        } else {
            $httpErrorCount++
        }

        # Quote validation — 200 alone is not success
        $validation = Test-QuoteResponse -RequestedIdentity $id -HttpStatus $httpStatus -BodyText $responseBody

        if ($validation.isValidQuote) {
            $validQuoteCount++
            # Do NOT increment confirmedVendorRefreshes from envelope — not observable
        } else {
            $invalidQuoteCount++
        }

        $elapsedMs = [int](([DateTime]::UtcNow) - $requestAtUtc).TotalMilliseconds

        # Per-instrument accounting record — distinguish all four categories explicitly
        $results.Add([pscustomobject]@{
            index               = $idx
            requestedIdentity   = [pscustomobject]@{ companyId = $id.companyId; securityId = $id.securityId; exchangeSegment = $id.exchangeSegment }
            requestAtUtc        = $requestAtUtcIso
            requestBody         = ($body | ConvertFrom-Json)
            httpStatus          = $httpStatus  # nullable — null for transport failure
            httpStatusDisplay   = if ($null -eq $httpStatus) { 'null (transport failure — no daemon response)' } else { "$httpStatus" }
            responseBody        = (try { $responseBody | ConvertFrom-Json -ErrorAction Stop } catch { $responseBody })
            responseBodyRaw     = $responseBody
            transportError      = $transportError
            quoteValidation     = [pscustomobject]@{
                isValidQuote            = $validation.isValidQuote
                code                    = $validation.validationCode
                message                 = $validation.validationMessage
                envelopeCompanyId       = $validation.envelopeCompanyId
                envelopeSecurityId      = $validation.envelopeSecurityId
                freshness               = $validation.freshness
                timestampUtc            = $validation.timestampUtc
                provenanceAsOfUtc       = $validation.provenanceAsOfUtc
                provenanceReceivedAtUtc = $validation.provenanceReceivedAtUtc
                provenanceQuality       = $validation.provenanceQuality
                cacheVsVendor           = $validation.cacheVsVendor
                limitationNote          = $validation.limitationNote
            }
            durationMs          = $elapsedMs
            # Explicit cache/provenance fields — do not invent data
            freshness           = $validation.freshness
            provenance          = if ($validation.rawParsed -and $validation.rawParsed.envelope -and $validation.rawParsed.envelope.provenance) { $validation.rawParsed.envelope.provenance } else { $null }
            limitationNote      = $validation.limitationNote
        })

        if ($DelayMsBetweenQuotes -gt 0 -and $idx -lt $identities.Count) {
            Start-Sleep -Milliseconds $DelayMsBetweenQuotes
        }
    }
} finally {
    $client.Dispose()
}

$runEndedAtUtc = [DateTime]::UtcNow
$runEndedAtUtcIso = $runEndedAtUtc.ToString('o')
$duration = $runEndedAtUtc - $runStartedAtUtc

# ─────────────────────────────────────────────────────────────────────────────
# Aggregated artifact — mirrored to BOTH mandatory locations
# ─────────────────────────────────────────────────────────────────────────────
$aggregate = [ordered]@{
    run                        = 'W-14 Scope B 96 live quotes — sequential POST /v1/quotes (hardened)'
    daemonEndpoint             = 'POST /v1/quotes {companyId, securityId, exchangeSegment} (canonical 3-field contract)'
    daemonBaseUrl              = $DaemonBaseUrl
    identitySource             = $IdentityJsonPath
    txtCrossCheckSource        = $IdentityTxtPath
    preflight                  = [ordered]@{
        identityPreflight      = 'PASSED: 96 validated (48 NSE_EQ/48 BSE_EQ, all fields present, canonical ISIN format, series per exchange, no duplicates, TXT cross-check 0 missing/0 unexpected)'
        outputPreflight        = "PASSED: writable destinations $($writeTargets -join ', ')"
        healthPreflight        = "PASSED: HTTP 200 service=UP at $DaemonBaseUrl/v1/health (transport token accepted; vendor auth not inferred)"
    }
    startedAtUtc               = $runStartedAtUtcIso
    endedAtUtc                 = $runEndedAtUtcIso
    durationMs                 = [int]$duration.TotalMilliseconds
    instrumentCount            = $identities.Count
    # Request accounting — do NOT claim 96 local requests = 96 vendor requests
    accounting                 = [ordered]@{
        localRequestsMade      = $localRequestsMade
        localHttp200Responses  = $localHttp200Count
        httpErrorResponses     = $httpErrorCount
        transportFailures      = $transportFailureCount
        validQuoteResponses    = $validQuoteCount
        invalidOrFailedQuotes  = $invalidQuoteCount
        confirmedVendorRefreshes = $confirmedVendorRefreshes
        vendorRefreshLimitation  = $vendorRefreshLimitation
    }
    # Legacy flat fields for backwards compat with any parser expecting okCount/failCount
    localRequestsMade          = $localRequestsMade
    localHttp200Count          = $localHttp200Count
    validQuoteCount            = $validQuoteCount
    invalidQuoteCount          = $invalidQuoteCount
    transportFailureCount      = $transportFailureCount
    httpErrorCount             = $httpErrorCount
    results                    = @($results.ToArray())
    evidenceNote               = 'HTTP 200 alone is not proof of a usable quote; each response is validated for identity match, payload ltp, freshness, and timestamps. Cache vs vendor cannot be distinguished from the quote envelope alone — no local 200 is claimed as a live Dhan vendor call.'
}

try {
    $aggJson = $aggregate | ConvertTo-Json -Depth 20 -ErrorAction Stop
} catch {
    $aggJson = (@{ error = "Failed to serialize aggregate: $($_.Exception.Message)"; partial = $aggregate } | ConvertTo-Json -Depth 10)
}
Write-MirroredFile -FileName $aggregateFileName -Content $aggJson

# Summary — null-safe, correctly labelled UTC
$summary = @"
W-14 SCOPE B SEQUENTIAL CAPTURE SUMMARY — Generated at $timestampUtcIso (UTC)
Daemon endpoint : POST $DaemonBaseUrl/v1/quotes  { companyId, securityId, exchangeSegment }
Identities      : $($identities.Count) (BSE_EQ=$(@($identities | Where-Object exchangeSegment -EQ 'BSE_EQ').Count) NSE_EQ=$(@($identities | Where-Object exchangeSegment -EQ 'NSE_EQ').Count)) — preflight PASSED (48/48, distinct ISINs=48, TXT cross-check OK)
Sources         : $IdentityJsonPath
                | $IdentityTxtPath
Started (UTC)   : $runStartedAtUtcIso
Ended (UTC)     : $runEndedAtUtcIso
Duration        : $([int]$duration.TotalMilliseconds) ms (avg $(if ($identities.Count -gt 0) {[int]($duration.TotalMilliseconds / $identities.Count)} else {0}) ms/quote, throttle ${DelayMsBetweenQuotes}ms between)
Mode            : SEQUENTIAL — 96 × POST /v1/quotes (only supported execution path; BatchMode is diagnostic-probe-only and is blocked)

Accounting (do NOT conflate local requests with vendor requests):
  Local requests made        : $localRequestsMade
  Local HTTP 200 responses   : $localHttp200Count
  HTTP error (non-200)       : $httpErrorCount
  Transport failures (null)  : $transportFailureCount
  Valid quote responses      : $validQuoteCount   (identity matched, ltp>0, freshness CURRENT|STALE, timestamps assessed)
  Invalid/failed quotes      : $invalidQuoteCount
  Confirmed vendor refreshes : $confirmedVendorRefreshes — $vendorRefreshLimitation

Artifacts (mirrored to $($writeTargets.Count) mandatory location(s)):
  Aggregated    : $aggregateFileName — $($writeTargets -join ' | ')
  Per-instrument: w14-live-quote-<companyId>-<segment>-$timestampFile.json in same dirs
  Summary       : $summaryFileName

Per-instrument detail (HTTP status null-safe; transport failures cannot crash summary):
$(
    ($results | ForEach-Object {
        $statusDisplay = if ($null -eq $_.httpStatus) { 'null' } else { $_.httpStatus.ToString().PadLeft(4) }
        $validSym = if ($_.quoteValidation.isValidQuote) { '✓ VALID' } else { "✗ $($_.quoteValidation.code)" }
        $fresh = if ($_.freshness) { $_.freshness } else { '—' }
        "  $statusDisplay  $($_.requestedIdentity.companyId.PadRight(20)) $($_.requestedIdentity.securityId.PadRight(24)) $($_.requestedIdentity.exchangeSegment.PadRight(7))  $validSym  fresh=$fresh  $($_.durationMs)ms  at $($_.requestAtUtc) (UTC)"
    } | Out-String)
)
Notes:
  • HTTP 200 alone is NOT counted as success — each 200 is validated for identity match, usable ltp, and freshness.
  • Transport failures (HTTP null) are captured with error text and do not crash summary generation.
  • All timestamps are UTC (ISO-8601 Z) and labelled as such; no local timezone is implied.
  • Vendor refresh cannot be proven from the quote envelope alone — cache-served vs vendor-refreshed is not distinguished. See daemon /v1/diagnostics quoteCache for indirect evidence.
  • Existing cache/retry behavior is untouched — 96 local requests are NOT claimed as 96 Dhan vendor requests.
  • Per-instrument daemon bodies were Written to file (mirrored) AND displayed above.
"@

Write-Host "`n=========================================="
Write-Host $summary
Write-Host '==========================================' -ForegroundColor $(if ($invalidQuoteCount -eq 0 -and $transportFailureCount -eq 0) { 'Green' } else { 'Yellow' })

Write-MirroredFile -FileName $summaryFileName -Content $summary

# ─────────────────────────────────────────────────────────────────────────────
# Daemon log dump — still collected at end, now more explicit
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== DAEMON LOG DUMP — last 50 lines each (informational, not evidence of vendor call) ===" -ForegroundColor Cyan
$logFiles = @(
    'H:\IIPS\runtime\logs\dhan-daemon-live-quote.stdout.log',
    'H:\IIPS\runtime\logs\dhan-daemon-live-quote.stderr.log',
    (Join-Path $RuntimeLogsDir 'dhan-daemon-live-quote.stdout.log'),
    (Join-Path $RuntimeLogsDir 'dhan-daemon-live-quote.stderr.log')
) | Select-Object -Unique

$anyLog = $false
foreach ($file in $logFiles) {
    if (Test-Path -LiteralPath $file) {
        $anyLog = $true
        Write-Host "`n--- $file (last 50 lines) ---" -ForegroundColor DarkGray
        try { Get-Content -LiteralPath $file -Tail 50 -ErrorAction Stop } catch { Write-Host "(unreadable: $($_.Exception.Message))" -ForegroundColor Yellow }
    }
}
if (-not $anyLog) {
    Write-Host "(No daemon log files found at conventional paths.)" -ForegroundColor DarkGray
}

# Final verdict — honest about what was proven vs what is limitation
if ($invalidQuoteCount -eq 0 -and $transportFailureCount -eq 0 -and $httpErrorCount -eq 0) {
    Write-Host "`n✓ SWEEP COMPLETE — 96/96 local requests returned HTTP 200 with valid quote envelopes." -ForegroundColor Green
    Write-Host "  Each envelope's identity matched the request, ltp>0, and freshness/timestamps were assessed." -ForegroundColor Green
    Write-Host "  LIMITATION: Local HTTP 200 is NOT proof of 96 live Dhan vendor calls — vendor refresh cannot be confirmed from the envelope alone." -ForegroundColor Yellow
    Write-Host "  For operational assurance, inspect $aggregateFileName and daemon /v1/diagnostics / /v1/freshness." -ForegroundColor Green
} else {
    Write-Host "`n⚠ SWEEP COMPLETE WITH ISSUES — $validQuoteCount valid, $invalidQuoteCount invalid, $transportFailureCount transport failures, $httpErrorCount HTTP errors of 96." -ForegroundColor Yellow
    Write-Host "  See per-instrument detail above and aggregated JSON $aggregateFileName for full bodies/errors." -ForegroundColor Yellow
    Write-Host "  LIMITATION: Vendor refresh not confirmable from envelope — 96 local requests are NOT 96 vendor requests." -ForegroundColor Yellow
}
Write-Host "Artifacts mirrored to: $($writeTargets -join '  |  ')" -ForegroundColor DarkGray
Write-Host "All timestamps in artifacts are UTC (ISO-8601 Z) and labelled as such." -ForegroundColor DarkGray
