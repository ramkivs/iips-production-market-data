#requires -Version 7.2
<# Read-only non-production evidence collection. See docs/integration/IIPS-STAGE2-EVIDENCE-COLLECTOR.md. #>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateRange(1,65535)][int]$IrrPort,
  [ValidateRange(0,65535)][int]$MarketPort = 0,
  [string]$PipeName = $env:IIPS_G2_IPC_ENDPOINT,
  [string]$DataRoot = $env:IIPS_DATA_DIR,
  [string]$ReportDatabase = $env:IIPS_NP04_DATABASE_PATH,
  [string]$ReportOwnerCarrier = $env:IIPS_REPORTS_OWNER_PATH,
  [string]$FinancialRightsDocument,
  [string]$MarketRightsDocument,
  [Parameter(Mandatory)][string]$OutputFile,
  [Parameter(Mandatory)][switch]$ConfirmNonProduction
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $ConfirmNonProduction) { throw 'Explicit non-production confirmation is required.' }
$started = [DateTime]::UtcNow.ToString('o')
function Prop($o,[string]$name) { if ($null -ne $o -and $o.Contains($name)) { return $o[$name] }; return $null }
function SafeTime($v) { $d=[datetimeoffset]::MinValue; if ($v -is [string] -and [datetimeoffset]::TryParse($v,[ref]$d)) { return $d.ToUniversalTime().ToString('o') }; return 'UNKNOWN' }
function DocumentHash($p) { if (-not $p -or -not [IO.Path]::IsPathFullyQualified($p)) {return 'UNKNOWN'}; try { return (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() } catch { return 'UNKNOWN' } }
function TextHash($v) { if ($v -isnot [string] -or -not $v.Trim()) { return 'UNKNOWN' }; $bytes=[Text.Encoding]::UTF8.GetBytes($v); return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant() }
function SafeHash($v) { if ($v -is [string] -and $v -cmatch '^[a-f0-9]{64}$') { return $v }; return 'UNKNOWN' }
function SafeNum($v) { if ($v -is [int] -or $v -is [long]) { if ($v -ge 0) { return $v } }; return 'UNKNOWN' }
function CountState($map,[string]$s) { if (-not $map.Contains($s)) { $map[$s]=0 }; $map[$s]++ }
function GetLocal([int]$port,[string]$path,[hashtable]$headers=@{}) {
  try { return Invoke-RestMethod -Uri "http://127.0.0.1:$port$path" -Method Get -Headers $headers -TimeoutSec 10 -MaximumRedirection 0 -NoProxy } catch { return $null }
}
function PostIdentity([int]$port,[hashtable]$headers,[hashtable]$body) {
  try { return Invoke-RestMethod -Uri "http://127.0.0.1:$port/v1/identity/resolve" -Method Post -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress) -TimeoutSec 10 -MaximumRedirection 0 -NoProxy } catch { return $null }
}
function PipeRead([string]$op,[string]$id='') {
  # The server's named-pipe flush guard permits one request and answers before close.
  if ([string]::IsNullOrWhiteSpace($PipeName)) { return $null }
  $name=$PipeName
  if ($name.StartsWith('\\.\pipe\')) { $name=$name.Substring(9) }
  if ($name -notmatch '^[A-Za-z0-9_.-]+$') { return $null }
  $pipe=$null
  try {
    $pipe=[System.IO.Pipes.NamedPipeClientStream]::new('.', $name, [System.IO.Pipes.PipeDirection]::InOut, [System.IO.Pipes.PipeOptions]::Asynchronous)
    $pipe.Connect(2500)
    $r=@{v=1;op=$op}; if ($op -ne 'portfolio.list') {$r.payload=@{portfolioId=$id}}
    $body=[Text.Encoding]::UTF8.GetBytes(($r | ConvertTo-Json -Compress -Depth 5)); $prefix=[BitConverter]::GetBytes([int]$body.Length); if ([BitConverter]::IsLittleEndian) {[array]::Reverse($prefix)}
    $pipe.Write($prefix,0,4);$pipe.Write($body,0,$body.Length);$pipe.Flush()
    function ReadExact($stream,[int]$n) { $buf=[byte[]]::new($n); $offset=0; while($offset -lt $n) { $task=$stream.ReadAsync($buf,$offset,$n-$offset); if(-not $task.Wait(5000)) {throw 'timeout'}; $read=$task.Result; if($read -le 0){throw 'closed'}; $offset += $read }; return ,$buf }
    $head=ReadExact $pipe 4; if([BitConverter]::IsLittleEndian){[array]::Reverse($head)}; $len=[BitConverter]::ToInt32($head,0); if($len -le 0 -or $len -gt 16777216){throw 'frame'}
    $reply=[Text.Encoding]::UTF8.GetString((ReadExact $pipe $len)) | ConvertFrom-Json -AsHashtable
    if ((Prop $reply 'ok') -ne $true -or (Prop $reply 'op') -ne $op -or (Prop $reply 'v') -ne 1) {return $null}; return ,$reply.result
  } catch { return $null } finally { if ($null -ne $pipe) {$pipe.Dispose()} }
}
function AsMap($value) { if ($null -eq $value) { return $null }; try { return ($value | ConvertTo-Json -Depth 60 -Compress | ConvertFrom-Json -AsHashtable) } catch { return $null } }
function ReadReportInventory {
  # NP-06 GET opens NP-04 with migrate:true. Use only an already existing DB in SQLite read-only mode.
  if (-not $ReportDatabase -or -not $ReportOwnerCarrier -or -not (Get-Command node -ErrorAction SilentlyContinue)) { return @{status='UNKNOWN';reason='NOT_CONFIGURED';chains='UNKNOWN';versions='UNKNOWN'} }
  if (-not [IO.Path]::IsPathFullyQualified($ReportDatabase) -or -not [IO.Path]::IsPathFullyQualified($ReportOwnerCarrier)) {return @{status='UNKNOWN';reason='INVALID_PATH';chains='UNKNOWN';versions='UNKNOWN'}}
  $helper=Join-Path $PSScriptRoot 'stage2/readonly-reports.cjs'
  try {
    $env:IIPS_COLLECT_REPORT_DB=$ReportDatabase; $env:IIPS_COLLECT_REPORT_OWNER=$ReportOwnerCarrier
    $raw = & node --no-warnings $helper 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'unavailable' }
    $result=$raw | ConvertFrom-Json -AsHashtable
    if ((Prop $result 'status') -ne 'AVAILABLE') {throw 'unavailable'}
    return $result
  } catch {return @{status='UNKNOWN';reason='UNAVAILABLE_OR_UNVERIFIED';chains='UNKNOWN';versions='UNKNOWN'}} finally {Remove-Item Env:IIPS_COLLECT_REPORT_DB,Env:IIPS_COLLECT_REPORT_OWNER -ErrorAction SilentlyContinue}
}
$e=[ordered]@{
 schema='IIPS_STAGE2_SANITIZED_EVIDENCE_V1'; startedAt=$started; completedAt='UNKNOWN';
 sources=@{ portfolio='IPD v1 owner-scoped named pipe'; consumer='IRR GET /api/user-portfolios'; identities='IRR GET /api/investment/portfolio/:id/identities and IPD exact identity'; market='IPD GET /v1/freshness'; dataset='IRR investment/dataset manifest and periods'; reports='NP-04 pinned schema read-only owner-filtered SQLite'; crossServiceAtomic=$false };
 W03=@{ portfolioStatus='UNKNOWN';portfolioCount='UNKNOWN';portfolios=@();reports=(ReadReportInventory) };
 W04=@{outcomes='UNKNOWN';note='IRR identity reads lack a revision; before/after checks do not prove an atomic join.'};
 W05=@{status='UNKNOWN';rightsState='UNKNOWN';independentPermission='UNKNOWN';coverage='UNKNOWN';periods='UNKNOWN'};
 W06=@{status='UNKNOWN';observations=@();historical='UNKNOWN';rights='UNKNOWN'};
 W07=@{ 'L-038'='OPEN';'L-039'='OPEN';'L-040'='RESOLVED';actualIssuerEvidence='UNKNOWN' };
 W08=@{bridge='UNKNOWN';note='IRR resolver results require same-revision evidence; symbol alone is not issuer proof.'};
 W09=@{consumer='UNKNOWN';note='Separate list/detail/history/identity reads are independently timed; recapture on revision mismatch.'}
}
$token=$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
$headers=@{}; if ($MarketPort -gt 0 -and -not [string]::IsNullOrWhiteSpace($token)) {$headers.Authorization="Bearer $token"}
$ipdList=PipeRead 'portfolio.list'
$irrList=AsMap (GetLocal $IrrPort '/api/user-portfolios')
$ports=[System.Collections.Generic.List[object]]::new(); $identityCounts=[ordered]@{}; $identityReasons=[ordered]@{}; $bridgeBasis=[ordered]@{}; $financialCounts=[ordered]@{}; $market=[System.Collections.Generic.List[object]]::new()
$investment=AsMap (GetLocal $IrrPort '/api/investment/coverage/investment'); $issuerRows=Prop $investment 'issuers'
if ($null -ne $ipdList -and $ipdList -is [array]) {
  $e.W03.portfolioStatus='AVAILABLE';$e.W03.portfolioCount=$ipdList.Count; $idx=0
  foreach($summary in $ipdList) {
    $idx++;$id=Prop $summary 'portfolioId'; if ($id -isnot [string] -or [string]::IsNullOrWhiteSpace($id)) { $e.W03.portfolioStatus='INVALID'; continue }
    $before=[DateTime]::UtcNow.ToString('o');$detail=PipeRead 'portfolio.get' $id;$history=PipeRead 'portfolio.revisions' $id
    $url=[uri]::EscapeDataString($id);$consumer=AsMap (GetLocal $IrrPort "/api/user-portfolios/$url");$identities=AsMap (GetLocal $IrrPort "/api/investment/portfolio/$url/identities")
    $after=PipeRead 'portfolio.get' $id;$end=[DateTime]::UtcNow.ToString('o')
    $entry=[ordered]@{token="portfolio-$idx";readStartedAt=$before;readCompletedAt=$end;revision='UNKNOWN';holdings='UNKNOWN';active='UNKNOWN';inactive='UNKNOWN';contributions='UNKNOWN';historyCount='UNKNOWN';reconciled='UNKNOWN';consumer='UNKNOWN';identity='UNKNOWN'}
    if ($null -ne $detail -and (Prop $detail 'holdings') -is [array]) {
      $holds=$detail.holdings;$entry.revision=SafeNum (Prop $detail 'revision');$entry.holdings=$holds.Count;$entry.active=@($holds | Where-Object { (Prop $_ 'active') -eq $true }).Count;$entry.inactive=@($holds | Where-Object { (Prop $_ 'active') -eq $false }).Count
      if ((Prop $detail 'contributions') -is [array]) {$entry.contributions=$detail.contributions.Count}
      if ($history -is [array]) {$entry.historyCount=$history.Count}
      $historyEntry=@($history | Where-Object { (Prop $_ 'revision') -eq $entry.revision })
      if ($null -ne $after -and (Prop $summary 'revision') -eq $entry.revision -and (Prop $after 'revision') -eq $entry.revision -and (Prop $summary 'holdingsCount') -eq $holds.Count -and (Prop $detail 'holdingsCount') -eq $holds.Count -and $historyEntry.Count -eq 1 -and (Prop $historyEntry[0] 'holdingsCount') -eq $holds.Count) {$entry.reconciled='MATCHED_AT_READS'} else {$entry.reconciled='MISMATCH_OR_UNAVAILABLE'}
      $c=Prop $consumer 'portfolio';if ($null -ne $c) { if ((Prop $c 'revision') -eq $entry.revision -and (Prop $c 'totalHoldingsCount') -eq $holds.Count) {$entry.consumer='MATCHED_AT_READ'} else {$entry.consumer='MISMATCH'} }
      $items=Prop $identities 'identities'; if ($items -is [array] -and $items.Count -eq $holds.Count) {
        $entry.identity='OBSERVED_UNVERSIONED';foreach($row in $items){
          $state=Prop $row 'state'; if ($state -notin @('RESOLVED','AMBIGUOUS','UNMATCHED','INELIGIBLE','OUT_OF_SCOPE_SECURITY','STALE_REFERENCE','REJECTED_MALFORMED_ISIN','ISSUER_KEY_CONFLICT','AMBIGUOUS_LISTING')) {$state='UNKNOWN'}; CountState $identityCounts $state
          $reason=Prop $row 'reason'; if ($reason -notin @('SECTOR_REFERENCE_NOT_AN_IDENTITY','NO_IDENTIFIER_PROVIDED','ISIN_FORMAT_INVALID','ISIN_CHECK_DIGIT_FAILED','ISIN_NOT_IN_ROSTER','SYMBOL_NOT_IN_LISTING_MAP','DUPLICATE_ACTIVE_SYMBOL','SYMBOL_REUSED_BY_OTHER_SECURITY','LISTING_WINDOW_EXPIRED','LISTING_NOT_YET_EFFECTIVE','MULTIPLE_SECURITIES_SHARE_LISTING','NO_LISTING_FOR_SECURITY','SECURITY_NOT_LISTED','INSTRUMENT_NOT_ASSESSABLE','NON_INDIAN_ISSUER','EXCHANGE_NOT_SUPPORTED','ISSUER_KEY_CONFLICT','ISSUER_NOT_ELIGIBLE')) {$reason='UNKNOWN_OR_NONE'}; CountState $identityReasons $reason
          $basis=Prop $row 'resolutionBasis'; if($basis -notin @('ISIN','EXCHANGE_SYMBOL')) {$basis='UNKNOWN'}; CountState $bridgeBasis $basis
          $issuer=Prop $row 'issuerId';$financial='UNKNOWN'; if ($state -eq 'RESOLVED' -and $issuer -is [string] -and $issuerRows -is [array]) {$matches=@($issuerRows | Where-Object { (Prop $_ 'issuerId') -eq $issuer }); if ($matches.Count -eq 0) {$financial='NOT_IN_DATASET'} elseif($matches.Count -eq 1) {$financial=Prop $matches[0] 'state';if($financial -notin @('COVERED','NO_FINANCIALS','SECTOR_NOT_MEASURED','ISSUED_DATA')){$financial='UNKNOWN'}}};CountState $financialCounts $financial
        }
        $directory=Prop $identities 'directory'; $entry.identityRosterVersion=SafeHash (Prop $directory 'rosterVersion'); $entry.identityRosterDigest=SafeHash (Prop $directory 'rosterDigest')
      }
      $hidx=0
      foreach($h in $holds) {
        $hidx++;$ob=[ordered]@{portfolio=$entry.token;holding="row-$hidx";ipdIdentity='UNKNOWN';ipdReason='UNKNOWN';market='UNKNOWN';asOf='UNKNOWN';receivedAt='UNKNOWN';evaluatedAt='UNKNOWN';observationEvaluatedAt='UNKNOWN';eligibleForUse='UNKNOWN';source='UNKNOWN'}
        $sec=Prop $h 'securityIdentity';$sid=Prop $sec 'securityId';$exchange=Prop $h 'exchange';$company=Prop $h 'companyId'
        if ($MarketPort -gt 0 -and $headers.Count -gt 0 -and $exchange -in @('NSE','BSE') -and $sid -is [string] -and $sid -cmatch '^ISIN:[A-Za-z0-9]{12}:[^:]+$' -and $company -is [string] -and $company.Length -gt 0) {
          $res=AsMap (PostIdentity $MarketPort $headers @{companyId=$company;exchange=$exchange;securityId=$sid});$state=Prop $res 'status';if($state -in @('QUALIFIED','UNRESOLVED','AMBIGUOUS')) {$ob.ipdIdentity=$state}
          $reason=Prop $res 'reason';if($reason -in @('MISSING_P7_MAPPING','MISSING_P04_CORRESPONDENCE','INACTIVE_OR_MISSING_LISTING','STALE_SOURCE_EVIDENCE','AMBIGUOUS_PROVIDER_MAPPING','CONFLICTING_SERIES','MISSING_SERIES_EVIDENCE')) {$ob.ipdReason=$reason}
          $seg=if($exchange -eq 'NSE'){'NSE_EQ'}else{'BSE_EQ'};$q="/v1/freshness?domain=D01_QUOTES&companyId=$([uri]::EscapeDataString($company))&exchangeSegment=$seg&securityId=$([uri]::EscapeDataString($sid))"
          $fs=AsMap (GetLocal $MarketPort $q $headers);$verdict=Prop $fs 'verdict'; if($verdict -in @('GOOD','STALE','UNAVAILABLE','UNKNOWN')) {$ob.market=$verdict};foreach($key in @('asOf','receivedAt','evaluatedAt','observationEvaluatedAt')){$ob[$key]=SafeTime (Prop $fs $key)}; $elig=Prop $fs 'eligibleForUse';if($elig -is [bool]){$ob.eligibleForUse=$elig}
        }
        $market.Add($ob)
      }
    }
    $ports.Add($entry)
  }
  $e.W03.portfolios=@($ports.ToArray());$e.W04.outcomes=$identityCounts;$e.W04.reasons=$identityReasons;$e.W08.resolutionBasisCounts=$bridgeBasis;$e.W08.bridge='OBSERVED_UNVERSIONED_NOT_QUALIFIED';$e.W05.issuerHoldingCoverage=$financialCounts;$e.W06.observations=@($market.ToArray());$e.W06.status='PER_ROW_PARTIAL'
  if ($null -ne $irrList -and (Prop $irrList 'portfolios') -is [array]) {$e.W09.consumer='LIST_OBSERVED';$e.W09.irrPortfolioCount=$irrList.portfolios.Count}
}
if ($MarketPort -gt 0 -and $headers.Count -gt 0) {$hist=AsMap (GetLocal $MarketPort '/v1/freshness?domain=D02_OHLCV' $headers);if ((Prop $hist 'cacheState') -in @('NOT_AVAILABLE','MISS','CURRENT','STALE','UNAVAILABLE')) {$e.W06.historical=Prop $hist 'cacheState'}}
if ($DataRoot -and [IO.Path]::IsPathFullyQualified($DataRoot)) {
 try {
  $dir=Join-Path $DataRoot 'investment/dataset';$manifestPath=Join-Path $dir 'manifest.json';$periodsPath=Join-Path $dir 'periods.json';$m=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json -AsHashtable
  $state=Prop (Prop $m 'sourceRights') 'state';$basis=Prop (Prop $m 'sourceRights') 'basis'
  if($state -notin @('SYNTHETIC','OPERATOR_ASSERTED','UNKNOWN') -or ($state -eq 'OPERATOR_ASSERTED' -and ($basis -isnot [string] -or -not $basis.Trim()))) {$state='UNKNOWN'}
  $coverage=Prop $m 'coverage';$cov=[ordered]@{};foreach($k in @('issuers','securities','listings','annualPeriods','quarterlyPeriods','operatingMetricRecords','corporateActions','prices')) {$cov[$k]=SafeNum (Prop $coverage $k)}
  $e.W05=@{status='MANIFEST_READ_UNVERIFIED';manifestSha256=(Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant();datasetVersion=SafeHash (Prop $m 'datasetVersion');contentDigest=SafeHash (Prop $m 'contentDigest');dataAsOf=SafeTime (Prop $m 'dataAsOf');knownAsOf=SafeTime (Prop $m 'knownAsOf');lastImportAt=SafeTime (Prop $m 'lastImportAt');rightsState=$state;rightsBasisPresent=($state -eq 'OPERATOR_ASSERTED');independentPermission='UNKNOWN';coverage=$cov;periods='UNKNOWN';sourceAndLicence='UNKNOWN';issuerHoldingCoverage=$financialCounts;providerLabelSha256=TextHash (Prop $m 'provider');licenceLabelSha256=TextHash (Prop $m 'licence');rightsBasisSha256=TextHash $basis}
  $expected=SafeHash (Prop (Prop $m 'files') 'periods.json'); if ($expected -ne 'UNKNOWN' -and (Get-FileHash -LiteralPath $periodsPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expected) {
    $periods=Get-Content -LiteralPath $periodsPath -Raw | ConvertFrom-Json -AsHashtable; if ($periods -is [array]) {$groups=[ordered]@{};foreach($p in $periods){$pd=Prop $p 'period';$type=Prop $pd 'periodType';$scope=Prop $pd 'statementScope';$basis=Prop $p 'basis';if($type -notin @('ANNUAL','QUARTER','TTM')){$type='UNKNOWN'};if($scope -notin @('CONSOLIDATED','STANDALONE')){$scope='UNKNOWN'};if($basis -notin @('AS_FILED','RESTATED')){$basis='UNKNOWN'};CountState $groups "$type/$scope/$basis"};$e.W05.periods=@{count=$periods.Count;classification=$groups;fileSha256=$expected;earliestPeriodEnd=SafeTime (Prop $coverage 'earliestPeriodEnd');latestPeriodEnd=SafeTime (Prop $coverage 'latestPeriodEnd')}}
  }
 } catch { }
}
$e.W05.supportingDocumentSha256=DocumentHash $FinancialRightsDocument
$e.W06.supportingDocumentSha256=DocumentHash $MarketRightsDocument
$e.completedAt=[DateTime]::UtcNow.ToString('o')
# CreateNew ensures no existing database, source file or evidence is ever overwritten.
$json=$e | ConvertTo-Json -Depth 50
$stream=[IO.File]::Open([IO.Path]::GetFullPath($OutputFile),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
try {$bytes=[Text.UTF8Encoding]::new($false).GetBytes($json+"`n");$stream.Write($bytes,0,$bytes.Length)} finally {$stream.Dispose()}
Write-Output 'Sanitized evidence file created. Review before sharing; UNKNOWN is not a pass.'
