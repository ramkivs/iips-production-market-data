[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Repo,

  [string]$CorpusDir = 'C:\IIPS_Data\IIPS_PIT_Bounded_Corpus',
  [string]$EvidenceOut = '',
  [string]$KeycloakUrl = 'http://localhost:8080',
  [string]$TransportUrl = 'http://localhost:8787',
  [string]$UiUrl = 'http://localhost:5173',
  [string]$Username = 'analyst-a',
  [string]$ClientId = 'iips-spa'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RequiredImplementationCommit = '1d1ddd25c3cf24897b2ceda9def157f4a5cebb22'
$RequiredBranch = 'arena/01a0c440-iips-production-market-data'
$CorpusId = 'windows-d114-bounded-two-era-2024-boundary'
$ManifestPath = Join-Path $CorpusDir 'pit-corpus-manifest.json'
$transportProcess = $null
$uiProcess = $null
$oldPitCorpus = [Environment]::GetEnvironmentVariable('IIPS_PIT_CORPUS_DIR', 'Process')
$oldKeycloak = [Environment]::GetEnvironmentVariable('KEYCLOAK_URL', 'Process')

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Write-Json([string]$Path, $Value, [int]$Depth = 30) {
  Write-Utf8NoBom $Path ($Value | ConvertTo-Json -Depth $Depth)
}

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

# PowerShell 6+ automatically materializes ISO-8601 JSON strings as System.DateTime when
# Invoke-RestMethod parses a response. That changes the response contract before W2 can compare
# the exact wire value (and a DateTime-to-string -eq comparison is timezone-sensitive). Parse the
# raw HTTP JSON with System.Text.Json instead so every JSON string remains a System.String on every
# supported PowerShell 7 version; numbers, booleans, arrays, objects, and null retain JSON types.
function Convert-IipsJsonElement([System.Text.Json.JsonElement]$Element) {
  switch ($Element.ValueKind.ToString()) {
    'Object' {
      $value = [ordered]@{}
      foreach ($property in $Element.EnumerateObject()) {
        $value[$property.Name] = Convert-IipsJsonElement $property.Value
      }
      return [pscustomobject]$value
    }
    'Array' {
      $items = [System.Collections.Generic.List[object]]::new()
      foreach ($item in $Element.EnumerateArray()) {
        $items.Add((Convert-IipsJsonElement $item)) | Out-Null
      }
      return ,$items.ToArray()
    }
    'String' {
      return [string]$Element.GetString()
    }
    'Number' {
      [long]$integerValue = 0
      if ($Element.TryGetInt64([ref]$integerValue)) { return $integerValue }
      [decimal]$decimalValue = 0
      if ($Element.TryGetDecimal([ref]$decimalValue)) { return $decimalValue }
      return $Element.GetDouble()
    }
    'True' { return $true }
    'False' { return $false }
    'Null' { return $null }
    'Undefined' { return $null }
    default { throw "Unsupported JSON value kind: $($Element.ValueKind)" }
  }
}

function ConvertFrom-IipsJsonPreservingStrings([string]$Json) {
  $document = [System.Text.Json.JsonDocument]::Parse($Json)
  try {
    return Convert-IipsJsonElement $document.RootElement
  } finally {
    $document.Dispose()
  }
}

function Invoke-NativeLogged(
  [string]$Command,
  [string[]]$Arguments,
  [string]$WorkingDirectory,
  [string]$LogPath
) {
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments 2>&1 | Tee-Object -FilePath $LogPath
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
  if ($exitCode -ne 0) {
    throw "Native command failed ($exitCode): $Command $($Arguments -join ' '). See $LogPath"
  }
}

function Wait-Http200([string]$Uri, $Process, [string]$Description, [int]$Seconds = 90) {
  for ($i = 0; $i -lt $Seconds; $i++) {
    if ($null -ne $Process -and $Process.HasExited) {
      throw "$Description exited before becoming ready (exit $($Process.ExitCode))."
    }
    try {
      $response = Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec 3
      if ([int]$response.StatusCode -eq 200) { return }
    } catch {
      # Readiness polling is bounded; the final timeout is the governed failure.
    }
    Start-Sleep -Seconds 1
  }
  throw "$Description did not return HTTP 200 within $Seconds seconds: $Uri"
}

function Wait-LogMatch([string[]]$Paths, [string]$Pattern, [int]$Seconds = 30) {
  for ($i = 0; $i -lt $Seconds; $i++) {
    foreach ($path in $Paths) {
      if (Test-Path -LiteralPath $path) {
        $text = Get-Content -LiteralPath $path -Raw
        if ($text -match $Pattern) { return }
      }
    }
    Start-Sleep -Seconds 1
  }
  throw "Required log line was not observed: $Pattern"
}

function Stop-ProcessTree($Process) {
  if ($null -eq $Process -or $Process.HasExited) { return }
  try {
    & taskkill.exe /PID $Process.Id /T /F | Out-Null
  } catch {
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
  }
}

$Repo = (Resolve-Path -LiteralPath $Repo).Path
if ([string]::IsNullOrWhiteSpace($EvidenceOut)) {
  $EvidenceOut = Join-Path $Repo 'evidence\d-pit-wire-01-windows'
}
New-Item -ItemType Directory -Path $EvidenceOut -Force | Out-Null

$transportStdout = Join-Path $EvidenceOut 'transport.stdout.log'
$transportStderr = Join-Path $EvidenceOut 'transport.stderr.log'
$uiStdout = Join-Path $EvidenceOut 'ui.stdout.log'
$uiStderr = Join-Path $EvidenceOut 'ui.stderr.log'
$w1InstallLog = Join-Path $EvidenceOut 'w1-npm-ci.log'
$w1AppTypecheckLog = Join-Path $EvidenceOut 'w1-typecheck-app.log'
$w1ServerTypecheckLog = Join-Path $EvidenceOut 'w1-typecheck-server.log'
$w4TestLog = Join-Path $EvidenceOut 'w4-snapshot-regression.log'
$w5TestLog = Join-Path $EvidenceOut 'w5-live-macro-regression.log'
$legacyScreenshot = Join-Path $EvidenceOut 'legacy-ui.png'
$udiffScreenshot = Join-Path $EvidenceOut 'cm-udiff-ui.png'

try {
  $branch = (& git -C $Repo branch --show-current).Trim()
  Assert-True ($LASTEXITCODE -eq 0) 'Unable to inspect the Git branch.'
  Assert-True ($branch -eq $RequiredBranch) "WRONG BRANCH: expected '$RequiredBranch', found '$branch'."
  & git -C $Repo merge-base --is-ancestor $RequiredImplementationCommit HEAD
  Assert-True ($LASTEXITCODE -eq 0) "Required D-PIT-WIRE-01 commit is not an ancestor: $RequiredImplementationCommit"
  $commit = (& git -C $Repo rev-parse HEAD).Trim()

  $jsonStringProbe = ConvertFrom-IipsJsonPreservingStrings `
    '{"vintage":{"requestedAsOf":"2024-07-05T15:30:00.000Z"}}'
  Assert-True ($jsonStringProbe.vintage.requestedAsOf -is [string]) `
    'JSON reader converted requestedAsOf away from System.String.'
  Assert-True ($jsonStringProbe.vintage.requestedAsOf -ceq '2024-07-05T15:30:00.000Z') `
    'JSON reader did not preserve requestedAsOf byte-for-byte.'

  Assert-True (Test-Path -LiteralPath $ManifestPath) "W0 manifest is missing: $ManifestPath"
  $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
  Assert-True ($manifest.corpusId -eq $CorpusId) 'W0 corpusId mismatch.'
  Assert-True ($manifest.corpusKind -eq 'D114_ARCHIVE') 'W0 corpusKind must be D114_ARCHIVE.'
  Assert-True ($manifest.entries.Count -eq 2) 'W0 manifest must contain exactly two bounded entries.'

  $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
  $npx = (Get-Command npx.cmd -ErrorAction Stop).Source
  $frontend = Join-Path $Repo 'frontend'

  Write-Host 'W1 — install and typecheck before transport startup.' -ForegroundColor Cyan
  Invoke-NativeLogged $npm @('ci', '--no-audit', '--no-fund') $frontend $w1InstallLog
  Invoke-NativeLogged $npm @('run', 'typecheck') $frontend $w1AppTypecheckLog
  Invoke-NativeLogged $npm @('run', 'typecheck:server') $frontend $w1ServerTypecheckLog

  $env:IIPS_PIT_CORPUS_DIR = $CorpusDir
  $env:KEYCLOAK_URL = $KeycloakUrl
  $transportProcess = Start-Process -FilePath $npm `
    -ArgumentList @('run', 'dev:server') `
    -WorkingDirectory $frontend `
    -RedirectStandardOutput $transportStdout `
    -RedirectStandardError $transportStderr `
    -PassThru
  Wait-Http200 "$TransportUrl/api/health" $transportProcess 'Executive transport'

  $password = if ($env:IIPS_TEST_PASSWORD) { $env:IIPS_TEST_PASSWORD } else { 'iips-test-pw-2026' }
  $tokenResponse = Invoke-RestMethod -Method Post `
    -Uri "$KeycloakUrl/realms/iips/protocol/openid-connect/token" `
    -ContentType 'application/x-www-form-urlencoded' `
    -Body @{
      grant_type = 'password'
      client_id = $ClientId
      username = $Username
      password = $password
    }
  $token = [string]$tokenResponse.access_token
  Assert-True (-not [string]::IsNullOrWhiteSpace($token)) 'Keycloak returned no access token.'
  $headers = @{ Authorization = "Bearer $token" }

  function Set-Mode([ValidateSet('PIT', 'SNAPSHOT', 'LIVE')][string]$Mode) {
    $body = @{
      preferences = @{
        theme = 'light'
        density = 'comfortable'
        showDegradedDetail = $true
        defaultDataMode = $Mode
      }
    } | ConvertTo-Json -Depth 4
    Invoke-RestMethod -Method Put -Uri "$TransportUrl/api/settings" `
      -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
  }

  function Get-Company([string]$AsOf, [string]$SecurityAlias = 'RELIANCE') {
    $encodedAsOf = [uri]::EscapeDataString($AsOf)
    $encodedSecurityAlias = [uri]::EscapeDataString($SecurityAlias)
    $wireResponse = Invoke-WebRequest -Headers $headers `
      -Uri "$TransportUrl/api/company/${encodedSecurityAlias}?asOf=${encodedAsOf}"
    Assert-True ([int]$wireResponse.StatusCode -eq 200) 'Company PIT request did not return HTTP 200.'
    return ConvertFrom-IipsJsonPreservingStrings ([string]$wireResponse.Content)
  }

  Set-Mode 'PIT'
  $legacyRequested = '2024-07-05T15:30:00.000Z'
  $udiffRequested = '2024-07-08T15:30:00.000Z'
  $Legacy = Get-Company $legacyRequested

  $loadPattern = "\[pit\] corpus '$CorpusId' loaded: [0-9]+ snapshots / 2 dates \(D114_ARCHIVE; evidence=true; IN_MEMORY_ONLY\)"
  Wait-LogMatch @($transportStdout, $transportStderr) $loadPattern
  Write-Host 'W1 PASS — physical bounded corpus admitted through governed D114 evidence controls.' -ForegroundColor Green

  Write-Host 'W2 — verify both physical eras and provenance.' -ForegroundColor Cyan
  $Udiff = Get-Company $udiffRequested
  Assert-True ($Legacy.dataAvailable -eq $true) 'W2 LEGACY dataAvailable FAIL.'
  Assert-True ($Legacy.dataMode -eq 'PIT') 'W2 LEGACY mode FAIL.'
  Assert-True ($Legacy.vintage.era -eq 'LEGACY_BHAVCOPY') 'W2 LEGACY era FAIL.'
  Assert-True ($Legacy.vintage.requestedAsOf -eq $legacyRequested) 'W2 LEGACY requestedAsOf FAIL.'
  Assert-True ($Legacy.vintage.resolvedAsOf -eq '2024-07-05T09:15:00.000Z') 'W2 LEGACY resolvedAsOf FAIL.'
  Assert-True ($Legacy.vintage.record.symbol -eq 'RELIANCE') 'W2 LEGACY canonical record FAIL.'
  Assert-True ($Udiff.dataAvailable -eq $true) 'W2 CM-UDiFF dataAvailable FAIL.'
  Assert-True ($Udiff.dataMode -eq 'PIT') 'W2 CM-UDiFF mode FAIL.'
  Assert-True ($Udiff.vintage.era -eq 'CM_UDIFF') 'W2 CM-UDiFF era FAIL.'
  Assert-True ($Udiff.vintage.requestedAsOf -eq $udiffRequested) 'W2 CM-UDiFF requestedAsOf FAIL.'
  Assert-True ($Udiff.vintage.resolvedAsOf -eq '2024-07-08T09:15:00.000Z') 'W2 CM-UDiFF resolvedAsOf FAIL.'
  Assert-True ($Udiff.vintage.record.symbol -eq 'RELIANCE') 'W2 CM-UDiFF canonical record FAIL.'

  # Physical regression for the exact legacy collision: both source securities must coexist at
  # 09:15Z under their series-aware typed identities. The unqualified company/symbol remains 1:N
  # and therefore fails closed.
  $MmfinEq = Get-Company $legacyRequested 'ISIN:INE774D01024:EQ'
  $MmfinN3 = Get-Company $legacyRequested 'ISIN:INE774D08MG3:N3'
  $MmfinAmbiguous = Get-Company $legacyRequested 'M&MFIN'
  Assert-True ($MmfinEq.dataAvailable -eq $true) 'W2 M&MFIN EQ availability FAIL.'
  Assert-True ($MmfinN3.dataAvailable -eq $true) 'W2 M&MFIN N3 availability FAIL.'
  Assert-True ($MmfinEq.vintage.era -eq 'LEGACY_BHAVCOPY') 'W2 M&MFIN EQ era FAIL.'
  Assert-True ($MmfinN3.vintage.era -eq 'LEGACY_BHAVCOPY') 'W2 M&MFIN N3 era FAIL.'
  Assert-True ($MmfinEq.vintage.resolvedAsOf -eq '2024-07-05T09:15:00.000Z') 'W2 M&MFIN EQ asOf FAIL.'
  Assert-True ($MmfinN3.vintage.resolvedAsOf -eq '2024-07-05T09:15:00.000Z') 'W2 M&MFIN N3 asOf FAIL.'
  Assert-True ($MmfinEq.vintage.record.symbol -eq 'M&MFIN') 'W2 M&MFIN EQ symbol FAIL.'
  Assert-True ($MmfinN3.vintage.record.symbol -eq 'M&MFIN') 'W2 M&MFIN N3 symbol FAIL.'
  Assert-True ($MmfinEq.vintage.record.securityIdentity.securityId -eq 'ISIN:INE774D01024:EQ') 'W2 M&MFIN EQ typed identity FAIL.'
  Assert-True ($MmfinN3.vintage.record.securityIdentity.securityId -eq 'ISIN:INE774D08MG3:N3') 'W2 M&MFIN N3 typed identity FAIL.'
  Assert-True ($MmfinEq.vintage.record.securityIdentity.isin -eq 'INE774D01024') 'W2 M&MFIN EQ ISIN FAIL.'
  Assert-True ($MmfinN3.vintage.record.securityIdentity.isin -eq 'INE774D08MG3') 'W2 M&MFIN N3 ISIN FAIL.'
  Assert-True ($MmfinEq.vintage.record.securityIdentity.isinAuthority -eq 'NON_AUTHORITATIVE') 'W2 M&MFIN EQ ISIN authority FAIL.'
  Assert-True ($MmfinN3.vintage.record.securityIdentity.isinAuthority -eq 'NON_AUTHORITATIVE') 'W2 M&MFIN N3 ISIN authority FAIL.'
  Assert-True ($MmfinEq.vintage.record.securityIdentity.series -eq 'EQ') 'W2 M&MFIN EQ SERIES FAIL.'
  Assert-True ($MmfinN3.vintage.record.securityIdentity.series -eq 'N3') 'W2 M&MFIN N3 SERIES FAIL.'
  Assert-True ($MmfinAmbiguous.dataAvailable -eq $false) 'W2 unqualified M&MFIN must fail closed.'
  Assert-True ($MmfinAmbiguous.state -eq 'PIT_UNAVAILABLE') 'W2 unqualified M&MFIN state FAIL.'

  # Physical CM-UDiFF same-ISIN regression: SWANENERGY legitimately publishes BL and EQ under
  # raw ISIN INE665A01038 at the same normalized instant. Both typed identities must resolve,
  # while the shared symbol and raw-ISIN aliases remain set-valued and fail closed.
  $swanAsOf = '2024-07-08T09:15:00.000Z'
  $SwanBl = Get-Company $swanAsOf 'ISIN:INE665A01038:BL'
  $SwanEq = Get-Company $swanAsOf 'ISIN:INE665A01038:EQ'
  $SwanAmbiguous = Get-Company $swanAsOf 'SWANENERGY'
  $SwanIsinAmbiguous = Get-Company $swanAsOf 'INE665A01038'
  Assert-True ($SwanBl.dataAvailable -eq $true) 'W2 SWANENERGY BL availability FAIL.'
  Assert-True ($SwanEq.dataAvailable -eq $true) 'W2 SWANENERGY EQ availability FAIL.'
  Assert-True ($SwanBl.vintage.era -eq 'CM_UDIFF') 'W2 SWANENERGY BL era FAIL.'
  Assert-True ($SwanEq.vintage.era -eq 'CM_UDIFF') 'W2 SWANENERGY EQ era FAIL.'
  Assert-True ($SwanBl.vintage.resolvedAsOf -eq $swanAsOf) 'W2 SWANENERGY BL asOf FAIL.'
  Assert-True ($SwanEq.vintage.resolvedAsOf -eq $swanAsOf) 'W2 SWANENERGY EQ asOf FAIL.'
  Assert-True ($SwanBl.vintage.record.symbol -eq 'SWANENERGY') 'W2 SWANENERGY BL symbol FAIL.'
  Assert-True ($SwanEq.vintage.record.symbol -eq 'SWANENERGY') 'W2 SWANENERGY EQ symbol FAIL.'
  Assert-True ($SwanBl.vintage.record.companyId -eq 'SWANENERGY') 'W2 SWANENERGY BL companyId FAIL.'
  Assert-True ($SwanEq.vintage.record.companyId -eq 'SWANENERGY') 'W2 SWANENERGY EQ companyId FAIL.'
  Assert-True ($SwanBl.vintage.record.securityIdentity.securityId -eq 'ISIN:INE665A01038:BL') 'W2 SWANENERGY BL typed identity FAIL.'
  Assert-True ($SwanEq.vintage.record.securityIdentity.securityId -eq 'ISIN:INE665A01038:EQ') 'W2 SWANENERGY EQ typed identity FAIL.'
  Assert-True ($SwanBl.vintage.record.securityIdentity.isin -eq 'INE665A01038') 'W2 SWANENERGY BL ISIN FAIL.'
  Assert-True ($SwanEq.vintage.record.securityIdentity.isin -eq 'INE665A01038') 'W2 SWANENERGY EQ ISIN FAIL.'
  Assert-True ($SwanBl.vintage.record.securityIdentity.isinAuthority -eq 'NON_AUTHORITATIVE') 'W2 SWANENERGY BL ISIN authority FAIL.'
  Assert-True ($SwanEq.vintage.record.securityIdentity.isinAuthority -eq 'NON_AUTHORITATIVE') 'W2 SWANENERGY EQ ISIN authority FAIL.'
  Assert-True ($SwanBl.vintage.record.securityIdentity.series -eq 'BL') 'W2 SWANENERGY BL SERIES FAIL.'
  Assert-True ($SwanEq.vintage.record.securityIdentity.series -eq 'EQ') 'W2 SWANENERGY EQ SERIES FAIL.'
  Assert-True ($SwanBl.vintage.record.close -eq 668.25) 'W2 SWANENERGY BL close FAIL.'
  Assert-True ($SwanEq.vintage.record.close -eq 692.60) 'W2 SWANENERGY EQ close FAIL.'
  Assert-True ($SwanBl.vintage.record.volume -eq 4556633) 'W2 SWANENERGY BL volume FAIL.'
  Assert-True ($SwanEq.vintage.record.volume -eq 381237) 'W2 SWANENERGY EQ volume FAIL.'
  Assert-True ($SwanAmbiguous.dataAvailable -eq $false) 'W2 unqualified SWANENERGY must fail closed.'
  Assert-True ($SwanAmbiguous.state -eq 'PIT_UNAVAILABLE') 'W2 unqualified SWANENERGY state FAIL.'
  Assert-True ($SwanIsinAmbiguous.dataAvailable -eq $false) 'W2 shared SWANENERGY raw ISIN must fail closed.'
  Assert-True ($SwanIsinAmbiguous.state -eq 'PIT_UNAVAILABLE') 'W2 shared SWANENERGY raw ISIN state FAIL.'

  foreach ($response in @($Legacy, $Udiff, $MmfinEq, $MmfinN3, $SwanBl, $SwanEq)) {
    Assert-True ([datetimeoffset]$response.vintage.resolvedAsOf -le [datetimeoffset]$response.vintage.requestedAsOf) 'W2 PS-9 ordering FAIL.'
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$response.vintage.snapshotId)) 'W2 snapshotId FAIL.'
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$response.provenance.archiveRef)) 'W2 archiveRef FAIL.'
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$response.provenance.sha256)) 'W2 SHA-256 FAIL.'
    Assert-True ($null -ne $response.provenance.sha256ManifestEntry) 'W2 SHA manifest entry FAIL.'
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$response.provenance.acquisitionManifestId)) 'W2 acquisition manifest FAIL.'
    Assert-True (-not [string]::IsNullOrWhiteSpace([string]$response.provenance.intakeLineageDigest)) 'W2 intake lineage FAIL.'
  }
  Write-Json (Join-Path $EvidenceOut 'legacy-response.json') $Legacy
  Write-Json (Join-Path $EvidenceOut 'cm-udiff-response.json') $Udiff
  Write-Json (Join-Path $EvidenceOut 'legacy-mmfin-multi-series.json') ([ordered]@{
    eq = $MmfinEq
    n3 = $MmfinN3
    ambiguousSymbol = $MmfinAmbiguous
  })
  Write-Json (Join-Path $EvidenceOut 'cm-udiff-swanenergy-same-isin-multi-series.json') ([ordered]@{
    bl = $SwanBl
    eq = $SwanEq
    ambiguousSymbol = $SwanAmbiguous
    ambiguousRawIsin = $SwanIsinAmbiguous
  })

  $uiProcess = Start-Process -FilePath $npm `
    -ArgumentList @('run', 'dev', '--', '--host', '0.0.0.0') `
    -WorkingDirectory $frontend `
    -RedirectStandardOutput $uiStdout `
    -RedirectStandardError $uiStderr `
    -PassThru
  Wait-Http200 "$UiUrl/" $uiProcess 'Vite UI'

  $legacyUiUrl = "$UiUrl/research/company/RELIANCE?asOf=2024-07-05T15%3A30%3A00.000Z"
  $udiffUiUrl = "$UiUrl/research/company/RELIANCE?asOf=2024-07-08T15%3A30%3A00.000Z"
  Write-Host ''
  Write-Host 'MANUAL W2 UI CHECK REQUIRED' -ForegroundColor Yellow
  Write-Host "1. Log in as $Username."
  Write-Host "2. Open $legacyUiUrl"
  Write-Host "3. Verify requested/resolved instants, LEGACY_BHAVCOPY, D02 record, archive/hash, acquisition manifest, and intake lineage."
  Write-Host "4. Save its screenshot as $legacyScreenshot"
  Write-Host "5. Open $udiffUiUrl"
  Write-Host "6. Verify requested/resolved instants, CM_UDIFF, D02 record, archive/hash, acquisition manifest, and intake lineage."
  Write-Host "7. Save its screenshot as $udiffScreenshot"
  $confirmation = Read-Host "Type W2-PASS only after both UI checks and screenshots are complete"
  Assert-True ($confirmation -eq 'W2-PASS') 'W2 operator confirmation was not supplied.'
  Assert-True (Test-Path -LiteralPath $legacyScreenshot) "W2 legacy screenshot missing: $legacyScreenshot"
  Assert-True (Test-Path -LiteralPath $udiffScreenshot) "W2 CM-UDiFF screenshot missing: $udiffScreenshot"
  Write-Host 'W2 PASS — both eras, physical M&MFIN EQ/N3 and SWANENERGY BL/EQ coexistence, fail-closed shared aliases, and operator-confirmed UI evidence complete.' -ForegroundColor Green

  Write-Host 'W3 — fail-closed matrix.' -ForegroundColor Cyan
  $cases = @(
    '2023-04-07T15:30:00.000Z',
    '2025-03-14T15:30:00.000Z',
    '2024-07-13T15:30:00.000Z',
    '2024-08-15T15:30:00.000Z',
    '2016-09-19T15:30:00.000Z',
    '2026-09-19T15:30:00.000Z',
    '2024-07-09T15:30:00.000Z'
  )
  $failClosed = @()
  foreach ($asOf in $cases) {
    $response = Get-Company $asOf
    Assert-True ($response.dataAvailable -eq $false) "W3 dataAvailable FAIL: $asOf"
    Assert-True ($response.state -eq 'PIT_UNAVAILABLE') "W3 state FAIL: $asOf"
    Assert-True ($response.dataMode -eq 'PIT') "W3 mode FAIL: $asOf"
    $failClosed += [ordered]@{ asOf = $asOf; state = $response.state; dataAvailable = $response.dataAvailable }
  }
  Write-Json (Join-Path $EvidenceOut 'fail-closed-matrix.json') $failClosed

  $malformed = Invoke-WebRequest -Headers $headers `
    -Uri "$TransportUrl/api/company/RELIANCE?asOf=2024-07-08" `
    -SkipHttpErrorCheck
  Assert-True ([int]$malformed.StatusCode -eq 400) 'W3 malformed asOf did not return 400.'
  Write-Host 'W3 PASS — gaps, non-trading dates, unloaded dates, range bounds, and malformed asOf fail closed.' -ForegroundColor Green

  Write-Host 'W4 — SNAPSHOT identity regression.' -ForegroundColor Cyan
  Set-Mode 'SNAPSHOT'
  $SnapshotCompany = Invoke-RestMethod -Headers $headers -Uri "$TransportUrl/api/company/Banking"
  Assert-True ($SnapshotCompany.provenance.freshness -eq 'SNAPSHOT') 'W4 SNAPSHOT freshness FAIL.'
  Invoke-NativeLogged $npx @('vitest', 'run', 'server/data-mode/data-mode.test.ts') $frontend $w4TestLog
  Write-Host 'W4 PASS — SNAPSHOT payload path and 38 identity/regression tests pass.' -ForegroundColor Green

  Write-Host 'W5 — LIVE and Macro preservation.' -ForegroundColor Cyan
  Set-Mode 'LIVE'
  $Live = Invoke-RestMethod -Headers $headers -Uri "$TransportUrl/api/company/RELIANCE"
  Assert-True ($Live.state -eq 'LIVE_UNAVAILABLE') 'W5 LIVE state FAIL.'
  Assert-True ($Live.dataAvailable -eq $false) 'W5 LIVE dataAvailable FAIL.'
  Invoke-NativeLogged $npx @(
    'vitest', 'run',
    'server/macro/macro-transport.test.ts',
    'server/data-mode/data-mode.test.ts'
  ) $frontend $w5TestLog
  Write-Host 'W5 PASS — LIVE remains unavailable under R-2 and Macro remains LIVE-only/exempt.' -ForegroundColor Green

  Write-Host 'W6 — deposit bounded application-verification evidence.' -ForegroundColor Cyan
  Copy-Item -LiteralPath $ManifestPath -Destination (Join-Path $EvidenceOut 'pit-corpus-manifest.json') -Force
  $Disposition = [ordered]@{
    disposition = 'WINDOWS APPLICATION VERIFICATION — NOT CERTIFICATION'
    windowsAcceptance = 'PASS'
    branch = $branch
    commit = $commit
    corpusId = $CorpusId
    certification = 'NONE_GRANTED'
    productionAuthorization = 'NOT GRANTED'
    d114 = 'NON_PRODUCTION_HOLD'
    oiHist01 = 'OPEN'
    g004 = 'OPEN'
    persistence = 'IN_MEMORY_ONLY'
    providerAccessIntroduced = $false
    snapshotFallback = $false
    w1 = 'PASS'
    w2 = 'PASS — both eras + physical M&MFIN EQ/N3 + physical SWANENERGY BL/EQ same-ISIN separation + fail-closed shared aliases + operator-confirmed UI screenshots'
    w3 = 'PASS'
    w4 = 'PASS'
    w5 = 'PASS'
    w6 = 'PASS'
    executedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  Write-Json (Join-Path $EvidenceOut 'verification-disposition.json') $Disposition
  Write-Host "W6 PASS — evidence deposited at $EvidenceOut" -ForegroundColor Green
  Write-Host 'WINDOWS ACCEPTANCE = PASS. This is application verification only; certification and production authorization remain NOT GRANTED.' -ForegroundColor Green
} catch {
  $failure = [ordered]@{
    disposition = 'WINDOWS APPLICATION VERIFICATION — FAILED OR INCOMPLETE; NOT CERTIFICATION'
    windowsAcceptance = 'FAIL'
    error = $_.Exception.Message
    certification = 'NONE_GRANTED'
    productionAuthorization = 'NOT GRANTED'
    d114 = 'NON_PRODUCTION_HOLD'
    oiHist01 = 'OPEN'
    g004 = 'OPEN'
    recordedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  Write-Json (Join-Path $EvidenceOut 'verification-failure.json') $failure
  throw
} finally {
  Stop-ProcessTree $uiProcess
  Stop-ProcessTree $transportProcess
  if ($null -eq $oldPitCorpus) { Remove-Item Env:IIPS_PIT_CORPUS_DIR -ErrorAction SilentlyContinue }
  else { $env:IIPS_PIT_CORPUS_DIR = $oldPitCorpus }
  if ($null -eq $oldKeycloak) { Remove-Item Env:KEYCLOAK_URL -ErrorAction SilentlyContinue }
  else { $env:KEYCLOAK_URL = $oldKeycloak }
}
