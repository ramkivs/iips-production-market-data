# ==============================================================================
# IIPS D114: Hardened Dual-Era NSE Historical Acquisition & Evidence Runner
# Target Range: 2016-09-20 to 2024-07-07
# Evidence Output Directory: C:\IIPS_Data\NSE_Legacy_Acquisition
# Architecture: Dual-Era (CM-UDiFF [>= 2024-07-08] + Legacy Bhavcopy [< 2024-07-08])
# ==============================================================================

param(
    [string]$StartDateStr = "2016-09-20",
    [string]$EndDateStr = "2024-07-07",
    [string]$OutputDir = "C:\IIPS_Data\NSE_Legacy_Acquisition",
    [switch]$Resume = $true
)

$ErrorActionPreference = "Continue"

$StartDate = [DateTime]::Parse($StartDateStr)
$EndDate = [DateTime]::Parse($EndDateStr)

$ArchivesDir = Join-Path $OutputDir "archives"
$EvidenceDir = Join-Path $OutputDir "evidence"

if (!(Test-Path -Path $ArchivesDir)) { New-Item -ItemType Directory -Path $ArchivesDir -Force | Out-Null }
if (!(Test-Path -Path $EvidenceDir)) { New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null }

$ManifestPath = Join-Path $EvidenceDir "historical-acquisition-manifest.json"
$CoveragePath = Join-Path $EvidenceDir "historical-coverage-summary.json"
$FailurePath = Join-Path $EvidenceDir "failure-unavailable-date-register.json"
$IntegrityPath = Join-Path $EvidenceDir "archive-integrity-report.json"
$Sha256Path = Join-Path $EvidenceDir "sha256-manifest.json"
$SchemaPath = Join-Path $EvidenceDir "schema-validation-report.json"

# Load existing manifest if resuming
$ExistingRecords = @{}
if ($Resume -and (Test-Path -Path $ManifestPath)) {
    try {
        $PrevJson = Get-Content -Raw -Path $ManifestPath | ConvertFrom-Json
        foreach ($prop in $PrevJson.records.PSObject.Properties) {
            $ExistingRecords[$prop.Name] = $prop.Value
        }
        Write-Host "Resuming from existing manifest with $($ExistingRecords.Count) records."
    } catch {
        Write-Host "Warning: Could not parse existing manifest. Starting clean."
    }
}

$KnownHolidays = @(
    "2016-01-26","2016-08-15","2016-10-02","2016-11-01",
    "2017-01-26","2017-08-15","2017-10-02","2017-10-19",
    "2018-01-26","2018-08-15","2018-10-02","2018-11-07",
    "2019-01-26","2019-08-15","2019-10-02","2019-10-27",
    "2020-01-26","2020-08-15","2020-10-02","2020-11-14",
    "2021-01-26","2021-08-15","2021-10-02","2021-11-04",
    "2022-01-26","2022-08-15","2022-10-02","2022-10-24",
    "2023-01-26","2023-08-15","2023-10-02","2023-11-12",
    "2024-01-26","2024-08-15","2024-10-02","2024-11-01",
    "2025-01-26","2025-08-15","2025-10-02","2025-10-20",
    "2026-01-26","2026-08-15","2026-10-02"
)

$Records = @{}
$CurrentDate = $StartDate

Write-Host "Starting Hardened D114 Dual-Era Historical Acquisition ($StartDateStr to $EndDateStr)..."

while ($CurrentDate -le $EndDate) {
    $DateIso = $CurrentDate.ToString("yyyy-MM-dd")
    $DayOfWeek = $CurrentDate.DayOfWeek

    # 1. Weekend Guard Clause
    if ($DayOfWeek -eq "Saturday" -or $DayOfWeek -eq "Sunday") {
        $FileName = ""
        $Url = ""
        if ($DateIso -ge "2024-07-08") {
            $DateYMD = $CurrentDate.ToString("yyyyMMdd")
            $FileName = "BhavCopy_NSE_CM_0_0_0_" + $DateYMD + "_F_0000.csv.zip"
            $Url = "https://nsearchives.nseindia.com/content/cm/" + $FileName
        }
        if ($DateIso -lt "2024-07-08") {
            $MonthNames = @("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC")
            $MonthStr = $MonthNames[$CurrentDate.Month - 1]
            $YearStr = $CurrentDate.ToString("yyyy")
            $DayStr = $CurrentDate.ToString("dd")
            $FileName = "cm" + $DayStr + $MonthStr + $YearStr + "bhav.csv.zip"
            $Url = "https://nsearchives.nseindia.com/content/historical/EQUITIES/" + $YearStr + "/" + $MonthStr + "/" + $FileName
        }
        $Records[$DateIso] = [PSCustomObject]@{
            date = $DateIso
            classification = "WEEKEND"
            acquisitionUrl = $Url
            status = "NON_TRADING_WEEKEND"
            localFilename = $FileName
            fileSizeBytes = 0
            sha256Hex = ""
            zipValidity = $false
            csvValidity = $false
            schemaValidity = $false
            recordCount = 0
            validRecordCount = 0
            invalidRecordCount = 0
            evaluatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        $CurrentDate = $CurrentDate.AddDays(1)
        continue
    }

    # 2. Holiday Guard Clause
    if ($KnownHolidays -contains $DateIso) {
        $FileName = ""
        $Url = ""
        if ($DateIso -ge "2024-07-08") {
            $DateYMD = $CurrentDate.ToString("yyyyMMdd")
            $FileName = "BhavCopy_NSE_CM_0_0_0_" + $DateYMD + "_F_0000.csv.zip"
            $Url = "https://nsearchives.nseindia.com/content/cm/" + $FileName
        }
        if ($DateIso -lt "2024-07-08") {
            $MonthNames = @("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC")
            $MonthStr = $MonthNames[$CurrentDate.Month - 1]
            $YearStr = $CurrentDate.ToString("yyyy")
            $DayStr = $CurrentDate.ToString("dd")
            $FileName = "cm" + $DayStr + $MonthStr + $YearStr + "bhav.csv.zip"
            $Url = "https://nsearchives.nseindia.com/content/historical/EQUITIES/" + $YearStr + "/" + $MonthStr + "/" + $FileName
        }
        $Records[$DateIso] = [PSCustomObject]@{
            date = $DateIso
            classification = "HOLIDAY"
            acquisitionUrl = $Url
            status = "NON_TRADING_HOLIDAY"
            localFilename = $FileName
            fileSizeBytes = 0
            sha256Hex = ""
            zipValidity = $false
            csvValidity = $false
            schemaValidity = $false
            recordCount = 0
            validRecordCount = 0
            invalidRecordCount = 0
            evaluatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        $CurrentDate = $CurrentDate.AddDays(1)
        continue
    }

    # 3. Dual-Era URL & Schema Resolution for Trading Day
    $FileName = ""
    $Url = ""
    $RequiredHeaders = @()

    if ($DateIso -ge "2024-07-08") {
        $DateYMD = $CurrentDate.ToString("yyyyMMdd")
        $FileName = "BhavCopy_NSE_CM_0_0_0_" + $DateYMD + "_F_0000.csv.zip"
        $Url = "https://nsearchives.nseindia.com/content/cm/" + $FileName
        $RequiredHeaders = @("TradDt","BizDt","Sgmt","Src","ISIN","TckrSymb","SctySrs","ClsPric","LastPric","PrvsClsgPric","SttlmPric")
    }

    if ($DateIso -lt "2024-07-08") {
        $MonthNames = @("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC")
        $MonthStr = $MonthNames[$CurrentDate.Month - 1]
        $YearStr = $CurrentDate.ToString("yyyy")
        $DayStr = $CurrentDate.ToString("dd")
        $FileName = "cm" + $DayStr + $MonthStr + $YearStr + "bhav.csv.zip"
        $Url = "https://nsearchives.nseindia.com/content/historical/EQUITIES/" + $YearStr + "/" + $MonthStr + "/" + $FileName
        $RequiredHeaders = @("SYMBOL","SERIES","OPEN","HIGH","LOW","CLOSE","LAST","PREVCLOSE","TOTTRDQTY","TOTTRDVAL","TIMESTAMP","ISIN")
    }

    $FilePath = Join-Path $ArchivesDir $FileName

    # Resume Guard Clause
    $Existing = $ExistingRecords[$DateIso]
    if ($Existing -and $Existing.status -eq "ACQUIRED_VALID" -and (Test-Path -Path $FilePath)) {
        $Records[$DateIso] = $Existing
        Write-Host "[REUSED] $DateIso : Already ACQUIRED_VALID ($FileName)"
        $CurrentDate = $CurrentDate.AddDays(1)
        continue
    }

    $Status = "PENDING_WINDOWS_EXECUTION"
    $FailureReason = $null
    $HttpStatusCode = 0
    $FileSizeBytes = 0
    $Sha256Hex = ""
    $ZipValid = $false
    $CsvValid = $false
    $SchemaValid = $false
    $RecordCount = 0
    $ValidRecordCount = 0
    $InvalidRecordCount = 0
    $SchemaErrors = @()

    # Attempt Download if not on disk
    if (!(Test-Path -Path $FilePath)) {
        try {
            $Headers = @{
                "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                "Accept" = "*/*"
            }
            $Resp = Invoke-WebRequest -Uri $Url -OutFile $FilePath -Headers $Headers -TimeoutSec 15 -PassThru
            $HttpStatusCode = $Resp.StatusCode
        } catch {
            if ($_.Exception.Response) {
                $HttpStatusCode = [int]$_.Exception.Response.StatusCode
            }
            if (!$FailureReason) {
                $FailureReason = $_.Exception.Message
            }
        }
    }

    if (Test-Path -Path $FilePath) {
        $Item = Get-Item $FilePath
        $FileSizeBytes = $Item.Length

        if ($FileSizeBytes -eq 0) {
            $Status = "EMPTY_RESPONSE"
            $FailureReason = "Downloaded file has 0 bytes"
            Remove-Item $FilePath -Force
        }

        if ($FileSizeBytes -gt 0) {
            # Compute SHA-256
            $Sha256Hex = (Get-FileHash -Path $FilePath -Algorithm SHA256).Hash.ToLower()

            # Test PKZIP integrity using .NET ZipArchive
            try {
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                $ZipArchive = [System.IO.Compression.ZipFile]::OpenRead($FilePath)
                $CsvEntry = $ZipArchive.Entries | Where-Object { $_.Name.EndsWith(".csv") } | Select-Object -First 1

                if ($CsvEntry) {
                    $ZipValid = $true
                    $Stream = $CsvEntry.Open()
                    $Reader = New-Object System.IO.StreamReader($Stream)
                    $CsvText = $Reader.ReadToEnd()
                    $Reader.Close()
                    $Stream.Close()
                    $ZipArchive.Dispose()

                    if ($CsvText.Length -gt 0) {
                        $CsvValid = $true
                        $Lines = $CsvText -split "(?
)" | Where-Object { $_.Trim().Length -gt 0 }
                        if ($Lines.Count -gt 1) {
                            $HeadersLine = $Lines[0]
                            $ParsedHeaders = $HeadersLine -split "," | ForEach-Object { $_.Trim().Trim('"') }
                            
                            $MissingHeaders = @($RequiredHeaders | Where-Object { $ParsedHeaders -notcontains $_ })
                            if ($MissingHeaders.Count -eq 0) {
                                $SchemaValid = $true
                                $Status = "ACQUIRED_VALID"
                                $RecordCount = $Lines.Count - 1
                                $ValidRecordCount = $Lines.Count - 1
                                Write-Host "[ACQUIRED_VALID] $DateIso : $RecordCount records ($FileSizeBytes bytes) -> $FileName"
                            }
                            if ($MissingHeaders.Count -gt 0) {
                                $Status = "SCHEMA_MISMATCH"
                                $SchemaErrors += "Missing required headers: " + ($MissingHeaders -join ", ")
                                $FailureReason = $SchemaErrors[0]
                                Write-Host "[SCHEMA_MISMATCH] $DateIso : $($MissingHeaders -join ', ')"
                            }
                        }
                        if ($Lines.Count -le 1) {
                            $Status = "CSV_INVALID"
                            $FailureReason = "CSV contains no data rows"
                        }
                    }
                    if ($CsvText.Length -eq 0) {
                        $Status = "CSV_INVALID"
                        $FailureReason = "Extracted CSV is empty"
                    }
                }
                if (!$CsvEntry) {
                    $ZipArchive.Dispose()
                    $Status = "CORRUPT_ARCHIVE"
                    $FailureReason = "No .csv file found in ZIP archive"
                }
            } catch {
                $Status = "CORRUPT_ARCHIVE"
                $FailureReason = "ZIP read failed: " + $_.Exception.Message
            }
        }
    }

    if (!(Test-Path -Path $FilePath)) {
        if ($HttpStatusCode -eq 404) {
            $Status = "HTTP_404"
            $FailureReason = "Archive not found on server (HTTP 404)"
            Write-Host "[HTTP_404] $DateIso : Not found on archive server ($Url)"
        }
        if ($HttpStatusCode -gt 0 -and $HttpStatusCode -ne 404) {
            $Status = "HTTP_OTHER_ERROR"
            $FailureReason = "HTTP $HttpStatusCode error"
        }
        if ($HttpStatusCode -eq 0) {
            $Status = "NETWORK_ERROR"
            if (!$FailureReason) { $FailureReason = "Network connection failed" }
        }
    }

    $Records[$DateIso] = [PSCustomObject]@{
        date = $DateIso
        classification = "TRADING_DAY"
        acquisitionUrl = $Url
        status = $Status
        httpStatusCode = $HttpStatusCode
        failureReason = $FailureReason
        localFilename = $FileName
        fileSizeBytes = $FileSizeBytes
        sha256Hex = $Sha256Hex
        zipValidity = $ZipValid
        csvValidity = $CsvValid
        schemaValidity = $SchemaValid
        recordCount = $RecordCount
        validRecordCount = $ValidRecordCount
        invalidRecordCount = $InvalidRecordCount
        schemaErrors = $SchemaErrors
        evaluatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    Start-Sleep -Milliseconds 150
    $CurrentDate = $CurrentDate.AddDays(1)
}

# Generate 6-File Evidence Package
Write-Host "Assembling 6-file evidence package into $EvidenceDir..."

# 1. Manifest
$ManifestObj = [PSCustomObject]@{
    manifestId = "d114-manifest-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    releaseVersion = "v1.0.0-rc1"
    targetRange = [PSCustomObject]@{
        startDate = $StartDateStr
        endDate = $EndDateStr
        totalCalendarDays = $Records.Count
    }
    records = $Records
    evaluatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}
$ManifestObj | ConvertTo-Json -Depth 5 | Set-Content -Path $ManifestPath

# 2. Coverage Summary
$Counts = @{}
foreach ($rec in $Records.Values) {
    $st = $rec.status
    if (!$Counts[$st]) { $Counts[$st] = 0 }
    $Counts[$st]++
}
$CoverageObj = [PSCustomObject]@{
    targetRange = $ManifestObj.targetRange
    countsByStatus = $Counts
    generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}
$CoverageObj | ConvertTo-Json -Depth 5 | Set-Content -Path $CoveragePath

# 3. Failure Register
$Failures = @()
foreach ($rec in $Records.Values) {
    if ($rec.classification -eq "TRADING_DAY" -and $rec.status -ne "ACQUIRED_VALID") {
        $Failures += [PSCustomObject]@{
            date = $rec.date
            url = $rec.acquisitionUrl
            status = $rec.status
            httpStatusCode = $rec.httpStatusCode
            failureReason = $rec.failureReason
        }
    }
}
$Failures | ConvertTo-Json -Depth 5 | Set-Content -Path $FailurePath

# 4. SHA-256 Manifest
$ShaMap = @{}
foreach ($rec in $Records.Values) {
    if ($rec.sha256Hex -and $rec.sha256Hex.Length -gt 0) {
        $ShaMap[$rec.date] = [PSCustomObject]@{
            date = $rec.date
            filename = $rec.localFilename
            bytes = $rec.fileSizeBytes
            sha256 = $rec.sha256Hex
            status = $rec.status
        }
    }
}
$ShaMap | ConvertTo-Json -Depth 5 | Set-Content -Path $Sha256Path

# 5. Archive Integrity Report
$IntegrityReports = @()
foreach ($rec in $Records.Values) {
    if ($rec.fileSizeBytes -gt 0 -or $rec.status -eq "CORRUPT_ARCHIVE") {
        $IntegrityReports += [PSCustomObject]@{
            date = $rec.date
            localFilename = $rec.localFilename
            fileSizeBytes = $rec.fileSizeBytes
            sha256Hex = $rec.sha256Hex
            zipValid = $rec.zipValidity
            csvExtracted = $rec.csvValidity
            extractionError = $rec.failureReason
        }
    }
}
$IntegrityReports | ConvertTo-Json -Depth 5 | Set-Content -Path $IntegrityPath

# 6. Schema Validation Report
$SchemaReports = @()
foreach ($rec in $Records.Values) {
    if ($rec.recordCount -gt 0 -or $rec.status -eq "SCHEMA_MISMATCH") {
        $ReqH = @("TradDt","BizDt","Sgmt","Src","ISIN","TckrSymb","SctySrs","ClsPric","LastPric","PrvsClsgPric","SttlmPric")
        if ($rec.date -lt "2024-07-08") {
            $ReqH = @("SYMBOL","SERIES","OPEN","HIGH","LOW","CLOSE","LAST","PREVCLOSE","TOTTRDQTY","TOTTRDVAL","TIMESTAMP","ISIN")
        }
        $SchemaReports += [PSCustomObject]@{
            date = $rec.date
            localFilename = $rec.localFilename
            schemaValid = $rec.schemaValidity
            totalRows = $rec.recordCount
            validRows = $rec.validRecordCount
            invalidRows = $rec.invalidRecordCount
            discoveredHeaders = $ReqH
            missingHeaders = @($rec.schemaErrors | Where-Object { $_ -like "Missing*" })
            sampleErrors = @($rec.schemaErrors)
        }
    }
}
$SchemaReports | ConvertTo-Json -Depth 5 | Set-Content -Path $SchemaPath

Write-Host "=============================================================================="
Write-Host "D114 Dual-Era Evidence Runner Complete (6/6 Artifacts Emitted)."
Write-Host "Manifest:          $ManifestPath"
Write-Host "Coverage Summary:  $CoveragePath"
Write-Host "Failure Register:  $FailurePath"
Write-Host "SHA-256 Manifest:  $Sha256Path"
Write-Host "Archive Integrity: $IntegrityPath"
Write-Host "Schema Validation: $SchemaPath"
Write-Host "=============================================================================="
