[CmdletBinding()]
param([string]$Root)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $d = New-Object System.Windows.Forms.FolderBrowserDialog
        $d.Description = 'Select the D05 source-drop folder to verify'
        if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $Root = $d.SelectedPath }
    } catch {}
}
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = (Read-Host 'Enter the source-drop folder path').Trim('"') }
$manifestPath = Join-Path $Root '06-MANIFEST\source_manifest.csv'
if (!(Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "Manifest not found: $manifestPath" }
$manifest = Import-Csv -LiteralPath $manifestPath
$results = foreach ($row in $manifest) {
    if (!(Test-Path -LiteralPath $row.FullPath -PathType Leaf)) {
        [pscustomobject]@{Category=$row.Category;FileName=$row.FileName;Expected=$row.SHA256;Actual='';Status='MISSING'}
    } else {
        $actual = (Get-FileHash -LiteralPath $row.FullPath -Algorithm SHA256).Hash
        [pscustomobject]@{Category=$row.Category;FileName=$row.FileName;Expected=$row.SHA256;Actual=$actual;Status=$(if ($actual -eq $row.SHA256) {'MATCH'} else {'HASH_MISMATCH'})}
    }
}
$reportDir = Join-Path $Root '07-REPORTS'
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$out = Join-Path $reportDir 'custody_verification.csv'
$results | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $out
$results | Format-Table -AutoSize
$bad = @($results | Where-Object Status -ne 'MATCH')
Write-Host "Checked: $($results.Count); failures: $($bad.Count); report: $out"
if ($bad.Count -gt 0) { throw 'CUSTODY VERIFICATION FAILED.' }
Write-Host 'CUSTODY HASH VERIFICATION PASSED' -ForegroundColor Green
