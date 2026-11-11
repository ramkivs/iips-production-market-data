#requires -Version 7.2
$ErrorActionPreference='Stop'; Set-StrictMode -Version Latest
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$temp=Join-Path ([IO.Path]::GetTempPath()) ('iips-stage2-test-'+[guid]::NewGuid().ToString('N'));[IO.Directory]::CreateDirectory($temp)|Out-Null
$ready=Join-Path $temp 'ready.json';$pipe='iips-collector-test-'+[guid]::NewGuid().ToString('N');$mock=Join-Path $PSScriptRoot 'mock-windows-collector.cjs'
$server=Start-Process node -ArgumentList @('"'+$mock+'"',$pipe,'"'+$ready+'"') -PassThru -WindowStyle Hidden
try {
  for($i=0;$i -lt 100 -and -not (Test-Path -LiteralPath $ready);$i++){ Start-Sleep -Milliseconds 100 }
  if (-not (Test-Path -LiteralPath $ready)) {throw 'mock server did not start'}
  $ports=Get-Content -Raw -LiteralPath $ready | ConvertFrom-Json
  $dir=Join-Path $temp 'data/investment/dataset';[IO.Directory]::CreateDirectory($dir)|Out-Null
  $periods='[{"period":{"periodType":"ANNUAL","statementScope":"CONSOLIDATED"},"basis":"AS_FILED"}]';[IO.File]::WriteAllText((Join-Path $dir 'periods.json'),$periods,[Text.UTF8Encoding]::new($false))
  $hash=(Get-FileHash -LiteralPath (Join-Path $dir 'periods.json')).Hash.ToLowerInvariant()
  $manifest=@{datasetVersion=('b'*64);contentDigest=('b'*64);provider='PRIVATE_PROVIDER';licence='PRIVATE_LICENCE';sourceRights=@{state='OPERATOR_ASSERTED';basis='PRIVATE_BASIS';note='PRIVATE_NOTE'};coverage=@{issuers=1;annualPeriods=1};files=@{'periods.json'=$hash}}
  [IO.File]::WriteAllText((Join-Path $dir 'manifest.json'),($manifest|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
  $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN='SECRET_TOKEN';$output=Join-Path $temp 'evidence.json'
  & (Join-Path $root 'scripts/Collect-IipsStage2Evidence.ps1') -IrrPort $ports.irr -MarketPort $ports.market -PipeName $pipe -DataRoot (Join-Path $temp 'data') -OutputFile $output -ConfirmNonProduction
  $raw=Get-Content -LiteralPath $output -Raw; $e=$raw|ConvertFrom-Json
  if($e.W03.portfolioCount -ne 1 -or $e.W03.portfolios[0].reconciled -ne 'MATCHED_AT_READS') { throw 'portfolio reconciliation failed' }
  if($e.W03.portfolios[0].consumer -ne 'MATCHED_AT_READ' -or $e.W04.outcomes.RESOLVED -ne 1) {throw 'identity or consumer failed'}
  if($e.W05.rightsState -ne 'OPERATOR_ASSERTED' -or $e.W05.independentPermission -ne 'UNKNOWN' -or $e.W05.periods.count -ne 1) {throw 'dataset failed'}
  if($e.W06.observations[0].ipdIdentity -ne 'QUALIFIED' -or $e.W06.observations[0].market -ne 'GOOD' -or $e.W06.historical -ne 'NOT_AVAILABLE') {throw 'freshness failed'}
  foreach($secret in @('SENSITIVE_SYNTHETIC_SYMBOL','PORTFOLIO-SECRET','COMP-SECRET','ISSUER-SECRET','SECRET_TOKEN','PRIVATE_PROVIDER','PRIVATE_LICENCE','PRIVATE_BASIS','PRIVATE_NOTE')) {if($raw.Contains($secret)){throw 'sanitization failed'}}
  $failed=$false;try {& (Join-Path $root 'scripts/Collect-IipsStage2Evidence.ps1') -IrrPort $ports.irr -OutputFile $output -ConfirmNonProduction } catch {$failed=$true};if(-not $failed){throw 'existing output overwritten'}
  $manifest.sourceRights.basis='';[IO.File]::WriteAllText((Join-Path $dir 'manifest.json'),($manifest|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
  $second=Join-Path $temp 'missing.json'; Remove-Item Env:IIPS_MARKET_DATA_TRANSPORT_TOKEN
  & (Join-Path $root 'scripts/Collect-IipsStage2Evidence.ps1') -IrrPort $ports.irr -MarketPort $ports.market -PipeName ('missing-'+[guid]::NewGuid().ToString('N')) -DataRoot (Join-Path $temp 'data') -OutputFile $second -ConfirmNonProduction
  $missing=Get-Content -LiteralPath $second -Raw|ConvertFrom-Json
  if($missing.W03.portfolioStatus -ne 'UNKNOWN' -or $missing.W03.portfolioCount -ne 'UNKNOWN' -or $missing.W06.historical -ne 'UNKNOWN') {throw 'unavailable became empty or fresh'}
  if($missing.W05.rightsState -ne 'UNKNOWN' -or $missing.W05.rightsDeclarationValidity -ne 'INVALID') {throw 'malformed rights not disclosed'}
  # Each server is a fresh synthetic endpoint. No real portfolio DB is opened.
  foreach($case in @('initial','empty','multi','invalid-shape','closed','class-a','bad-json','mismatch')) {
    $caseReady=Join-Path $temp ($case+'-ready.json');$casePipe='iips-stage2-'+[guid]::NewGuid().ToString('N')
    $caseServer=Start-Process node -ArgumentList @('"'+$mock+'"',$casePipe,'"'+$caseReady+'"',$case) -PassThru -WindowStyle Hidden
    try {
      for($i=0;$i -lt 100 -and -not (Test-Path -LiteralPath $caseReady);$i++){Start-Sleep -Milliseconds 100}
      if(-not (Test-Path -LiteralPath $caseReady)){throw "fixture not ready: $case"}
      $cp=Get-Content -Raw -LiteralPath $caseReady|ConvertFrom-Json
      $caseOutput=Join-Path $temp ($case+'.json')
      & (Join-Path $root 'scripts/Collect-IipsStage2Evidence.ps1') -IrrPort $cp.irr -PipeName $casePipe -OutputFile $caseOutput -ConfirmNonProduction
      $caseRaw=Get-Content -LiteralPath $caseOutput -Raw;$ce=$caseRaw|ConvertFrom-Json
      if($case -eq 'initial') {
        $p=$ce.W03.portfolios[0]
        if($ce.W03.portfolioStatus -ne 'AVAILABLE' -or $ce.W03.portfolioCount -ne 1 -or -not $ce.W03.discovery.enumerationObserved){throw 'INITIAL not discovered'}
        if($p.persistenceStatus -ne 'PERSISTED' -or $p.operation -ne 'INITIAL' -or $p.isSaved -ne $false -or $p.revision -ne 1 -or $p.holdings -ne 64 -or $p.active -ne 64 -or $p.inactive -ne 0 -or $p.weightSumPercentage -ne 100 -or $p.provenanceDigest -ne ('c'*64) -or $p.committedAt -notlike '2026-01-01T00:00:00*'){throw 'INITIAL persisted facts misclassified'}
      } elseif($case -eq 'empty') {
        if($ce.W03.portfolioCount -ne 0 -or $ce.W03.portfolioStatus -ne 'AVAILABLE' -or @($ce.W03.portfolios).Count -ne 0){throw 'observed empty list lost'}
      } elseif($case -eq 'multi') {
        if($ce.W03.portfolioCount -ne 2 -or @($ce.W03.portfolios).Count -ne 2){throw 'multiple portfolios lost'}
      } elseif($case -eq 'mismatch') {
        if($ce.W03.portfolios[0].persistenceStatus -ne 'UNKNOWN'){throw 'revision mismatch classified persisted'}
      } else {
        $expected=@{'invalid-shape'='RESPONSE_RESULT_NOT_ARRAY';closed='RESPONSE_CLOSED_BEFORE_COMPLETE_FRAME';'class-a'='CLASS_A_RESOURCE_UNAVAILABLE';'bad-json'='RESPONSE_JSON_INVALID'}[$case]
        if($ce.W03.portfolioStatus -ne 'UNKNOWN' -or $ce.W03.portfolioCount -ne 'UNKNOWN' -or $null -ne $ce.W03.portfolios -or $ce.W03.discovery.enumerationObserved -ne $false -or $ce.W03.discovery.reason -ne $expected){throw "unavailable discovery failed: $case"}
      }
      foreach($secret in @('PORTFOLIO-SECRET','PORTFOLIO-SECOND','SENSITIVE_SYNTHETIC_SYMBOL')){if($caseRaw.Contains($secret)){throw 'portfolio identifiers leaked'}}
    } finally {Stop-Process -Id $caseServer.Id -Force -ErrorAction SilentlyContinue}
  }
  $unset=Join-Path $temp 'unset.json'
  & (Join-Path $root 'scripts/Collect-IipsStage2Evidence.ps1') -IrrPort $ports.irr -PipeName '' -OutputFile $unset -ConfirmNonProduction
  $ue=Get-Content -Raw -LiteralPath $unset|ConvertFrom-Json
  if($ue.W03.discovery.reason -ne 'ENDPOINT_NOT_CONFIGURED' -or $null -ne $ue.W03.portfolios){throw 'missing endpoint reason lost'}
  Write-Output 'Windows synthetic collector assertions passed (INITIAL64, empty, multiple, mismatch and explicit discovery failures).'

} finally { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue; Remove-Item Env:IIPS_MARKET_DATA_TRANSPORT_TOKEN -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue }
