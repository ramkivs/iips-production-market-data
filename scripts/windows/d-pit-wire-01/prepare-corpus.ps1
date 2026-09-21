[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Repo,

  [string]$LegacyRoot = 'C:\IIPS_Data\NSE_Legacy_Acquisition\archives',
  [string]$UdiffRoot = 'C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives',
  [string]$CorpusDir = 'C:\IIPS_Data\IIPS_PIT_Bounded_Corpus',
  [string]$LegacyFile = 'cm05JUL2024bhav.csv.zip',
  [string]$UdiffFile = 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip',
  [string]$EvidenceOut = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RequiredImplementationCommit = '331dbed3bf640b34c6de526126cceb88a65067e6'
$RequiredBranch = 'arena/01a0c440-iips-production-market-data'
$RequiredEvidenceFiles = @(
  'archive-integrity-report.json',
  'failure-unavailable-date-register.json',
  'historical-acquisition-manifest.json',
  'historical-coverage-summary.json',
  'schema-validation-report.json',
  'sha256-manifest.json'
)

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Assert-Exists([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "MISSING: $Path"
  }
}

$Repo = (Resolve-Path -LiteralPath $Repo).Path
if ([string]::IsNullOrWhiteSpace($EvidenceOut)) {
  $EvidenceOut = Join-Path $Repo 'evidence\d-pit-wire-01-windows'
}

$branch = (& git -C $Repo branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the Git branch.' }
if ($branch -ne $RequiredBranch) {
  throw "WRONG BRANCH: expected '$RequiredBranch', found '$branch'."
}

& git -C $Repo merge-base --is-ancestor $RequiredImplementationCommit HEAD
if ($LASTEXITCODE -ne 0) {
  throw "The checkout does not contain required D-PIT-WIRE-01 implementation commit $RequiredImplementationCommit."
}

$dirty = @(& git -C $Repo status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect Git status.' }
if ($dirty.Count -ne 0) {
  throw "The checkout must be clean before W0. Dirty paths:`n$($dirty -join "`n")"
}

$nodeText = (& node --version).Trim().TrimStart('v')
if ($LASTEXITCODE -ne 0) { throw 'Node.js is unavailable.' }
if ([version]$nodeText -lt [version]'22.0.0') {
  throw "Node.js 22+ is required; found $nodeText."
}
& npm --version | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'npm is unavailable.' }

$LegacyEvidence = Join-Path $Repo 'evidence\d114-legacy'
$UdiffEvidence = Join-Path $Repo 'evidence\d114'

@(
  $LegacyRoot,
  $UdiffRoot,
  (Join-Path $LegacyRoot $LegacyFile),
  (Join-Path $UdiffRoot $UdiffFile),
  $LegacyEvidence,
  $UdiffEvidence
) | ForEach-Object { Assert-Exists $_ }

foreach ($file in $RequiredEvidenceFiles) {
  Assert-Exists (Join-Path $LegacyEvidence $file)
  Assert-Exists (Join-Path $UdiffEvidence $file)
}

if (Test-Path -LiteralPath $CorpusDir) {
  $unexpected = @(Get-ChildItem -LiteralPath $CorpusDir -Force |
    Where-Object { $_.Name -ne 'pit-corpus-manifest.json' })
  if ($unexpected.Count -ne 0) {
    throw "Corpus directory must remain manifest-only. Unexpected entries: $($unexpected.Name -join ', ')"
  }
} else {
  New-Item -ItemType Directory -Path $CorpusDir -Force | Out-Null
}
New-Item -ItemType Directory -Path $EvidenceOut -Force | Out-Null

$Manifest = [ordered]@{
  corpusId = 'windows-d114-bounded-two-era-2024-boundary'
  corpusKind = 'D114_ARCHIVE'
  provider = 'NSE_D114'
  dataVersion = 'd114-dualera-v1'
  archiveRoots = [ordered]@{
    LEGACY_BHAVCOPY = $LegacyRoot
    CM_UDIFF = $UdiffRoot
  }
  evidenceIntakes = @(
    [ordered]@{ era = 'LEGACY_BHAVCOPY'; directory = $LegacyEvidence },
    [ordered]@{ era = 'CM_UDIFF'; directory = $UdiffEvidence }
  )
  entries = @(
    [ordered]@{
      file = $LegacyFile
      source = 'ZIP'
      era = 'LEGACY_BHAVCOPY'
      tradeDate = '2024-07-05'
    },
    [ordered]@{
      file = $UdiffFile
      source = 'ZIP'
      era = 'CM_UDIFF'
      tradeDate = '2024-07-08'
    }
  )
}

$ManifestPath = Join-Path $CorpusDir 'pit-corpus-manifest.json'
Write-Utf8NoBom $ManifestPath ($Manifest | ConvertTo-Json -Depth 8)
$parsed = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
if ($parsed.corpusKind -ne 'D114_ARCHIVE' -or $parsed.entries.Count -ne 2) {
  throw 'W0 manifest self-check failed.'
}

$commit = (& git -C $Repo rev-parse HEAD).Trim()
$Context = [ordered]@{
  disposition = 'W0 PREPARED — WINDOWS APPLICATION VERIFICATION NOT YET EXECUTED'
  branch = $branch
  commit = $commit
  corpusManifest = $ManifestPath
  corpusKind = 'D114_ARCHIVE'
  archiveHandling = 'READ_IN_PLACE — NO COPY, MOVE, MERGE, OR MUTATION'
  legacyRoot = $LegacyRoot
  udiffRoot = $UdiffRoot
  legacyFile = $LegacyFile
  udiffFile = $UdiffFile
  certification = 'NONE_GRANTED'
  productionAuthorization = 'NOT GRANTED'
  d114 = 'NON_PRODUCTION_HOLD'
  oiHist01 = 'OPEN'
  g004 = 'OPEN'
  preparedAt = (Get-Date).ToUniversalTime().ToString('o')
}
Write-Utf8NoBom (Join-Path $EvidenceOut 'w0-handoff-context.json') ($Context | ConvertTo-Json -Depth 8)

Write-Host 'W0 PASS — bounded D114 manifest prepared.' -ForegroundColor Green
Write-Host "Manifest: $ManifestPath"
Write-Host "Evidence output: $EvidenceOut"
Write-Host 'The two ZIP archives remain in their separate physical roots and were not copied or modified.'
Write-Host 'Next: run verify-w0-w6.ps1 from PowerShell 7 while the configured local Keycloak realm is available.'
