/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: 10-Year NSE CM-UDiFF Historical Acquisition Feasibility Runner
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as crypto from 'crypto';
import { CmUdiffParser, CmUdiffValidationResult, ExtractedZipResult } from './cm_udiff_parser.js';
import { computeLineageHash } from '../contracts/provenance.js';

export type DayClassification = 'TRADING_DAY' | 'WEEKEND' | 'HOLIDAY';

export type AcquisitionStatus =
  | 'ACQUIRED'
  | 'SKIPPED_NON_TRADING'
  | 'NOT_FOUND_404'
  | 'NETWORK_ERROR'
  | 'CORRUPT_ARCHIVE'
  | 'SCHEMA_MISMATCH'
  | 'PENDING_WINDOWS_EXECUTION';

export interface DateAssessmentRecord {
  date: string; // YYYY-MM-DD
  classification: DayClassification;
  acquisitionUrl: string;
  status: AcquisitionStatus;
  fileSize: number;
  sha256: string;
  zipValidity: boolean;
  csvValidity: boolean;
  schemaValidation: {
    isValid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    error?: string;
  };
  failureReason?: string;
}

export interface HistoricalFeasibilityManifest {
  manifestId: string;
  targetRange: {
    startDate: string;
    endDate: string;
    totalCalendarDays: number;
    expectedTradingDays: number;
    weekendDays: number;
    knownHolidays: number;
  };
  acquisitionSummary: {
    totalAttempted: number;
    acquiredCount: number;
    skippedCount: number;
    failedCount: number;
    pendingCount: number;
    schemaValidCount: number;
  };
  records: Record<string, DateAssessmentRecord>;
  evaluatedAt: string;
  manifestIntegrityDigest: string;
}

export interface RunnerConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  knownHolidays?: string[]; // Array of YYYY-MM-DD
}

export class HistoricalFeasibilityRunner {
  // Canonical NSE CM-UDiFF Archive URL template
  public static readonly ARCHIVE_BASE_URL = 'https://nsearchives.nseindia.com/content/cm';

  // Standard national holidays observed by NSE (annual recurring baseline)
  public static readonly DEFAULT_KNOWN_HOLIDAYS = [
    '2016-01-26', '2016-08-15', '2016-10-02', '2016-11-01',
    '2017-01-26', '2017-08-15', '2017-10-02', '2017-10-19',
    '2018-01-26', '2018-08-15', '2018-10-02', '2018-11-07',
    '2019-01-26', '2019-08-15', '2019-10-02', '2019-10-27',
    '2020-01-26', '2020-08-15', '2020-10-02', '2020-11-14',
    '2021-01-26', '2021-08-15', '2021-10-02', '2021-11-04',
    '2022-01-26', '2022-08-15', '2022-10-02', '2022-10-24',
    '2023-01-26', '2023-08-15', '2023-10-02', '2023-11-12',
    '2024-01-26', '2024-08-15', '2024-10-02', '2024-11-01',
    '2025-01-26', '2025-08-15', '2025-10-02', '2025-10-20',
    '2026-01-26', '2026-08-15', '2026-10-02',
  ];

  /**
   * Constructs the canonical CM-UDiFF Bhavcopy filename and archive URL for a date.
   */
  public static getArchiveUrl(dateIso: string): { filename: string; url: string } {
    const yyyymmdd = dateIso.replace(/-/g, '');
    const filename = `BhavCopy_NSE_CM_0_0_0_${yyyymmdd}_F_0000.csv.zip`;
    const url = `${HistoricalFeasibilityRunner.ARCHIVE_BASE_URL}/${filename}`;
    return { filename, url };
  }

  /**
   * Classifies a date as TRADING_DAY, WEEKEND, or HOLIDAY.
   */
  public static classifyDate(dateIso: string, knownHolidays: Set<string>): DayClassification {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    const dayOfWeek = d.getUTCDay();

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'WEEKEND';
    }

    if (knownHolidays.has(dateIso)) {
      return 'HOLIDAY';
    }

    return 'TRADING_DAY';
  }

  /**
   * Generates date sequence between startDate and endDate inclusive.
   */
  public static generateDateSequence(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  /**
   * Evaluates a synthetic or downloaded archive buffer against feasibility criteria.
   */
  public static evaluateArchive(dateIso: string, zipBuffer?: Buffer): DateAssessmentRecord {
    const { url } = HistoricalFeasibilityRunner.getArchiveUrl(dateIso);
    const holidays = new Set(HistoricalFeasibilityRunner.DEFAULT_KNOWN_HOLIDAYS);
    const classification = HistoricalFeasibilityRunner.classifyDate(dateIso, holidays);

    if (classification !== 'TRADING_DAY') {
      return {
        date: dateIso,
        classification,
        acquisitionUrl: url,
        status: 'SKIPPED_NON_TRADING',
        fileSize: 0,
        sha256: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidation: {
          isValid: true,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
        },
      };
    }

    if (!zipBuffer || zipBuffer.length === 0) {
      return {
        date: dateIso,
        classification,
        acquisitionUrl: url,
        status: 'PENDING_WINDOWS_EXECUTION',
        fileSize: 0,
        sha256: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidation: {
          isValid: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          error: 'No archive buffer provided for assessment',
        },
        failureReason: 'Archive acquisition pending on operator Windows machine',
      };
    }

    const fileSize = zipBuffer.length;
    const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');

    const extraction: ExtractedZipResult = CmUdiffParser.extractZipArchive(zipBuffer);
    if (!extraction.isValid) {
      return {
        date: dateIso,
        classification,
        acquisitionUrl: url,
        status: 'CORRUPT_ARCHIVE',
        fileSize,
        sha256,
        zipValidity: false,
        csvValidity: false,
        schemaValidation: {
          isValid: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          error: extraction.error,
        },
        failureReason: extraction.error,
      };
    }

    const { headers, records } = CmUdiffParser.parseCsv(extraction.rawCsvContent);
    const schemaVal: CmUdiffValidationResult = CmUdiffParser.validateSchema(headers, records);

    if (!schemaVal.isValid) {
      return {
        date: dateIso,
        classification,
        acquisitionUrl: url,
        status: 'SCHEMA_MISMATCH',
        fileSize,
        sha256,
        zipValidity: true,
        csvValidity: false,
        schemaValidation: {
          isValid: false,
          totalRows: schemaVal.totalRows,
          validRows: schemaVal.validRows,
          invalidRows: schemaVal.invalidRows,
          error: schemaVal.errors.map((e) => e.error).join('; '),
        },
        failureReason: `Schema validation failed (${schemaVal.invalidRows} invalid rows)`,
      };
    }

    return {
      date: dateIso,
      classification,
      acquisitionUrl: url,
      status: 'ACQUIRED',
      fileSize,
      sha256,
      zipValidity: true,
      csvValidity: true,
      schemaValidation: {
        isValid: true,
        totalRows: schemaVal.totalRows,
        validRows: schemaVal.validRows,
        invalidRows: 0,
      },
    };
  }

  /**
   * Assembles a comprehensive historical feasibility manifest across a configured date range.
   * Supports incremental merge and deterministic resume.
   */
  public static buildFeasibilityManifest(
    config: RunnerConfig,
    existingRecords: Record<string, DateAssessmentRecord> = {}
  ): HistoricalFeasibilityManifest {
    const allDates = HistoricalFeasibilityRunner.generateDateSequence(config.startDate, config.endDate);
    const holidays = new Set(config.knownHolidays || HistoricalFeasibilityRunner.DEFAULT_KNOWN_HOLIDAYS);

    const records: Record<string, DateAssessmentRecord> = { ...existingRecords };
    let expectedTradingDays = 0;
    let weekendDays = 0;
    let knownHolidays = 0;

    let acquiredCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let schemaValidCount = 0;

    for (const dateIso of allDates) {
      const classification = HistoricalFeasibilityRunner.classifyDate(dateIso, holidays);
      if (classification === 'TRADING_DAY') expectedTradingDays++;
      else if (classification === 'WEEKEND') weekendDays++;
      else if (classification === 'HOLIDAY') knownHolidays++;

      // If record exists and is already evaluated, reuse it (deterministic resume)
      let record = records[dateIso];
      if (!record) {
        record = HistoricalFeasibilityRunner.evaluateArchive(dateIso);
        records[dateIso] = record;
      }

      if (record.status === 'ACQUIRED') acquiredCount++;
      else if (record.status === 'SKIPPED_NON_TRADING') skippedCount++;
      else if (record.status === 'PENDING_WINDOWS_EXECUTION') pendingCount++;
      else failedCount++;

      if (record.schemaValidation.isValid && record.status === 'ACQUIRED') {
        schemaValidCount++;
      }
    }

    const manifestBody = {
      manifestId: `d114-manifest-${Date.now()}`,
      targetRange: {
        startDate: config.startDate,
        endDate: config.endDate,
        totalCalendarDays: allDates.length,
        expectedTradingDays,
        weekendDays,
        knownHolidays,
      },
      acquisitionSummary: {
        totalAttempted: allDates.length,
        acquiredCount,
        skippedCount,
        failedCount,
        pendingCount,
        schemaValidCount,
      },
      records,
      evaluatedAt: new Date().toISOString(),
    };

    const manifestIntegrityDigest = computeLineageHash(manifestBody, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf: '2026-09-20T00:00:00.000Z',
      dataVersion: 'v1.0.0-d114-feasibility',
    });

    return {
      ...manifestBody,
      manifestIntegrityDigest,
    };
  }

  /**
   * Generates the standalone Windows PowerShell script for operator-controlled acquisition on Windows host.
   */
  public static generateWindowsPowerShellScript(startDate: string, endDate: string, targetDir: string): string {
    return `# ==============================================================================
# IIPS D114: 10-Year NSE CM-UDiFF Historical Archive Acquisition Script (PowerShell)
# Target Range: ${startDate} to ${endDate}
# Output Directory: ${targetDir}
# ==============================================================================

$ErrorActionPreference = "Continue"
$StartDate = [DateTime]::Parse("${startDate}")
$EndDate = [DateTime]::Parse("${endDate}")
$TargetDir = "${targetDir}"

if (!(Test-Path -Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$CurrentDate = $StartDate
$TotalDays = ($EndDate - $StartDate).Days + 1
$Processed = 0
$Acquired = 0

Write-Host "Starting D114 Historical CM-UDiFF Feasibility Acquisition ($StartDate to $EndDate)..."

while ($CurrentDate -le $EndDate) {
    $DateStr = $CurrentDate.ToString("yyyyMMdd")
    $DayOfWeek = $CurrentDate.DayOfWeek
    
    if ($DayOfWeek -ne "Saturday" -and $DayOfWeek -ne "Sunday") {
        $FileName = "BhavCopy_NSE_CM_0_0_0_" + $DateStr + "_F_0000.csv.zip"
        $Url = "https://nsearchives.nseindia.com/content/cm/" + $FileName
        $OutPath = Join-Path $TargetDir $FileName

        if (Test-Path -Path $OutPath) {
            Write-Host "[EXISTS] $FileName already downloaded."
            $Acquired++
        } else {
            try {
                $Headers = @{
                    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    "Accept" = "*/*"
                }
                Invoke-WebRequest -Uri $Url -OutFile $OutPath -Headers $Headers -TimeoutSec 30
                if ((Get-Item $OutPath).Length -gt 0) {
                    Write-Host "[SUCCESS] Downloaded $FileName"
                    $Acquired++
                } else {
                    Remove-Item $OutPath -Force
                    Write-Host "[EMPTY] $FileName (0 bytes, removed)"
                }
            } catch {
                Write-Host "[404 / SKIPPED] $FileName not found or holiday."
            }
            Start-Sleep -Milliseconds 250
        }
    }
    $CurrentDate = $CurrentDate.AddDays(1)
    $Processed++
}

Write-Host "D114 Acquisition Complete. Total Acquired: $Acquired files."
`;
  }
}
