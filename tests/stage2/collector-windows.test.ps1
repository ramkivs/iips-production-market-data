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
  Write-Output 'Windows synthetic collector assertions passed.'
} finally { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue; Remove-Item Env:IIPS_MARKET_DATA_TRANSPORT_TOKEN -ErrorAction SilentlyContinue; Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue }
