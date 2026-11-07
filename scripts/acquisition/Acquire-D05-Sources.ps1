# D05 Wave-3 — Acquisition TOOL (CORRECTED, 2026-11-07)
# Supersedes the input selection of the bundle's D05_Source_Acquisition_Tools:
#   - REMOVED: NSE Indices classification PDF file-picker (no PDF input exists in the implementation).
#   - REMOVED: separate ISIN->industry mapping CSV picker (the single taxonomy CSV IS that mapping).
#   - ADDED: explicit single taxonomy CSV spec (industry+sector keyed by isin|cin).
#   - MCA prompt: current-as-of-act-date, licensed; ISIN/SYMBOL bridge column strongly preferred.
# Correctness contract = merged PR #138 (acquisition contract) + record Amendment A-2.
# Original bundle scripts are retained UNMODIFIED inside evidence/D05-Wave3/...bundle for provenance.
# This script performs basic file-signature/content checks and SHA-256 registration ONLY — it does not
# authenticate the publisher, validate schemas, produce DEPOSITION_READY, alter IPD, construct a
# replacement corpus, or authorize deposition. Record source export date, effective/as-of date, exact
# source URL and licensing basis separately. Hash confirms post-acquisition integrity, not authenticity.
[CmdletBinding()]
param(
    [string]$Root,
    [switch]$IncludeSME
)
$ErrorActionPreference = 'Stop'

function Select-FolderPath([string]$Prompt) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = $Prompt
        $d.ShowNewFolderButton = $true
        if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { return $d.SelectedPath }
    } catch {}
    return (Read-Host "$Prompt (enter path)").Trim('"')
}
function Select-SourceFile([string]$Prompt, [string]$Filter) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.OpenFileDialog
        $d.Title = $Prompt; $d.Filter = $Filter; $d.Multiselect = $false
        if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { return $d.FileName }
    } catch {}
    $p = Read-Host "$Prompt (full path; blank to skip)"
    if ([string]::IsNullOrWhiteSpace($p)) { return $null }
    return $p.Trim('"')
}
function Test-DownloadedFile([string]$Path, [string]$Kind) {
    $b = [System.IO.File]::ReadAllBytes($Path)
    if ($b.Length -eq 0) { throw "Empty download: $Path" }
    $n = [Math]::Min(2048, $b.Length)
    $s = [System.Text.Encoding]::UTF8.GetString($b, 0, $n)
    if ($s -match '(?is)^\s*(<!doctype\s+html|<html)|access denied|captcha|request rejected') {
        throw "Server returned HTML/error content, not the requested file: $Path"
    }
    if ($Kind -eq 'PDF' -and [System.Text.Encoding]::ASCII.GetString($b,0,5) -ne '%PDF-') {
        throw "PDF signature check failed: $Path"
    }
    if ($Kind -eq 'CSV' -and $s -notmatch ',') { throw "CSV header check failed: $Path" }
}
$manifest = [System.Collections.Generic.List[object]]::new()
function Register-File([string]$Category,[string]$Path,[string]$Source,[string]$Method,[string]$Kind) {
    if (!(Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing file: $Path" }
    Test-DownloadedFile -Path $Path -Kind $Kind
    $f = Get-Item -LiteralPath $Path
    $manifest.Add([pscustomobject]@{
        Category=$Category; FileName=$f.Name; FullPath=$f.FullName; Bytes=$f.Length
        SHA256=(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
        SourceURL=$Source; Method=$Method; RegisteredUTC=[DateTime]::UtcNow.ToString('o')
        Note='Hash confirms post-acquisition integrity, not publisher authenticity.'
    })
    Write-Host "REGISTERED $($f.Name)" -ForegroundColor Green
}
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Select-FolderPath 'Choose the D05 source-drop destination folder' }
if ([string]::IsNullOrWhiteSpace($Root)) { throw 'No destination selected.' }
$Root = [IO.Path]::GetFullPath($Root)
$dirs = @{}
foreach ($name in @('01-NSE','02-BSE','03-MCA','04-TAXONOMY','05-TICK-RULES','06-MANIFEST','07-REPORTS')) {
    $dirs[$name] = Join-Path $Root $name
    New-Item -ItemType Directory -Path $dirs[$name] -Force | Out-Null
}
function Download-Official([string]$Url,[string]$Path,[string]$Category,[string]$Kind) {
    Write-Host "Downloading $Category ..."
    Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing -Headers @{
        'User-Agent'='Mozilla/5.0'; 'Accept'='*/*'
    }
    Register-File $Category $Path $Url 'Direct HTTP download' $Kind
}
# Main-board NSE master. SME is excluded unless explicitly requested (D-8 remains open).
Download-Official 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv' `
    (Join-Path $dirs['01-NSE'] 'EQUITY_L.csv') 'NSE_MAIN_EQUITY' 'CSV'
if ($IncludeSME) {
    Download-Official 'https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv' `
        (Join-Path $dirs['01-NSE'] 'SME_EQUITY_L.csv') 'NSE_SME_EQUITY' 'CSV'
}
# Policy circular only; this is NOT a per-ISIN tick-rule extract.
Download-Official 'https://nsearchives.nseindia.com/content/circulars/CMTR67133.pdf' `
    (Join-Path $dirs['05-TICK-RULES'] 'NSE_TICK_POLICY_CIRCULAR.pdf') 'NSE_TICK_POLICY_CIRCULAR' 'PDF'
# Operator chooses files from their actual locations; no Downloads path is assumed.
$manual = @(
    @{Cat='BSE_ACTIVE_EQUITY'; Dir='02-BSE'; Ext='.csv'; Kind='CSV'; Filter='CSV (*.csv)|*.csv|All files (*.*)|*.*'; Url='https://www.bseindia.com/corporates/List_Scrips.html'; Prompt='Select official BSE Equity/Active CSV (scrip code, ISIN, issuer name — any face value column is advisory-only downstream)'},
    @{Cat='MCA_COMPANY_MASTER'; Dir='03-MCA'; Ext='.csv'; Kind='CSV'; Filter='CSV (*.csv)|*.csv|All files (*.*)|*.*'; Url='https://www.mca.gov.in (MCA Services -> Master Data; licensed bulk extract preferred)'; Prompt='Select CURRENT (as-of act date) official/licensed MCA company-master CSV — CIN + company name + face value columns; ISIN or SYMBOL bridge column strongly preferred'},
    @{Cat='TAXONOMY'; Dir='04-TAXONOMY'; Ext='.csv'; Kind='CSV'; Filter='CSV (*.csv)|*.csv|All files (*.*)|*.*'; Url='Operator-supplied authoritative taxonomy (owner-licensed or official)'; Prompt='Select SINGLE taxonomy CSV: industry + sector (required, non-blank) keyed by isin OR cin (at least one) — this file IS the ISIN/CIN -> industry/sector mapping; basicIndustry optional'},
    @{Cat='ISIN_TICK_RULES'; Dir='05-TICK-RULES'; Ext='.csv'; Kind='CSV'; Filter='CSV (*.csv)|*.csv|All files (*.*)|*.*'; Url='Operator-supplied dated official tick-rule evidence'; Prompt='Select dated per-ISIN tick-rules CSV (isin,tickSize) or leave blank to bind a uniform tickSize in the deposition act'}
)
foreach ($m in $manual) {
    $src = Select-SourceFile $m.Prompt $m.Filter
    if ([string]::IsNullOrWhiteSpace($src)) { Write-Host "SKIPPED $($m.Cat)" -ForegroundColor Yellow; continue }
    if (!(Test-Path -LiteralPath $src -PathType Leaf)) { throw "Selected file not found: $src" }
    $dest = Join-Path $dirs[$m.Dir] ($m.Cat + $m.Ext)
    Copy-Item -LiteralPath $src -Destination $dest -Force
    Register-File $m.Cat $dest $m.Url 'Operator-selected local file; copied without transformation' $m.Kind
}
$csv = Join-Path $dirs['06-MANIFEST'] 'source_manifest.csv'
$json = Join-Path $dirs['06-MANIFEST'] 'source_manifest.json'
$manifest | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -Path $json
@"
D05 SOURCE CUSTODY REPORT
Generated UTC: $([DateTime]::UtcNow.ToString('o'))
Destination: $Root
Registered files: $($manifest.Count)
Manifest CSV: $csv
Manifest JSON: $json

This script performs basic file-signature/content checks and SHA-256 registration only.
It does not authenticate the publisher, validate schemas, establish per-ISIN tick sizes,
produce DEPOSITION_READY, modify IPD, construct a replacement corpus, or authorize deposition.
Record source export date, effective/as-of date, exact source URL and licensing basis separately.
"@ | Set-Content -Encoding UTF8 (Join-Path $dirs['07-REPORTS'] 'acquisition_report.txt')
Write-Host "`nACQUISITION/CUSTODY COMPLETE: $Root" -ForegroundColor Green
Write-Host "Registered files: $($manifest.Count)"
Write-Host "Manifest: $csv"
