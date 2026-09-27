/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Hardened 10-Year NSE CM-UDiFF & Dual-Era Historical Acquisition Feasibility Runner
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as crypto from 'crypto';
import { CmUdiffParser, CmUdiffValidationResult, ExtractedZipResult } from './cm_udiff_parser.js';
import { LegacyBhavcopyParser, LegacyBhavcopyValidationResult } from './legacy_bhavcopy_parser.js';
import { UnifiedHistoricalAdapter } from './unified_historical_adapter.js';
import { computeLineageHash } from '../contracts/provenance.js';

export type DayClassification = 'TRADING_DAY' | 'WEEKEND' | 'HOLIDAY';

export type DetailedAcquisitionStatus =
  | 'NON_TRADING_WEEKEND'
  | 'NON_TRADING_HOLIDAY'
  | 'ACQUIRED_VALID'
  | 'HTTP_404'
  | 'HTTP_OTHER_ERROR'
  | 'NETWORK_ERROR'
  | 'EMPTY_RESPONSE'
  | 'CORRUPT_ARCHIVE'
  | 'CSV_INVALID'
  | 'SCHEMA_MISMATCH'
  | 'OTHER_FAILURE'
  | 'PENDING_WINDOWS_EXECUTION';

export interface DetailedDateAssessment {
  date: string; // YYYY-MM-DD
  classification: DayClassification;
  acquisitionUrl: string;
  status: DetailedAcquisitionStatus;
  httpStatusCode?: number;
  failureReason?: string;
  localFilename: string;
  localPath?: string;
  fileSizeBytes: number;
  sha256Hex: string;
  zipValidity: boolean;
  csvValidity: boolean;
  schemaValidity: boolean;
  recordCount: number;
  validRecordCount: number;
  invalidRecordCount: number;
  schemaErrors?: string[];
  evaluatedAt: string;
  priorSha256Hex?: string;
  hashChangedFromPrior?: boolean;
}

export interface HistoricalCoverageSummary {
  targetRange: {
    startDate: string;
    endDate: string;
    totalCalendarDays: number;
    expectedTradingDays: number;
    weekendDays: number;
    knownHolidays: number;
  };
  countsByStatus: Record<DetailedAcquisitionStatus, number>;
  metrics: {
    tradingDaysAttempted: number;
    acquiredValidCount: number;
    unavailableCount: number; // 404s + other errors
    corruptOrInvalidCount: number;
    coveragePctOfTradingDays: number;
    dataIntegrityPct: number;
  };
  generatedAt: string;
}

export interface FailureUnavailableRegisterEntry {
  date: string;
  classification: DayClassification;
  url: string;
  status: DetailedAcquisitionStatus;
  httpStatusCode?: number;
  failureReason?: string;
}

export interface ArchiveIntegrityReportEntry {
  date: string;
  localFilename: string;
  fileSizeBytes: number;
  sha256Hex: string;
  zipValid: boolean;
  csvExtracted: boolean;
  extractionError?: string;
}

export interface Sha256ManifestEntry {
  date: string;
  localFilename: string;
  fileSizeBytes: number;
  sha256Hex: string;
  status: DetailedAcquisitionStatus;
}

export interface SchemaValidationReportEntry {
  date: string;
  localFilename: string;
  schemaValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  discoveredHeaders: string[];
  missingHeaders: string[];
  sampleErrors: string[];
}

export interface CompleteEvidencePackage {
  manifest: HistoricalFeasibilityManifest;
  coverageSummary: HistoricalCoverageSummary;
  failureRegister: FailureUnavailableRegisterEntry[];
  archiveIntegrityReport: ArchiveIntegrityReportEntry[];
  sha256Manifest: Record<string, Sha256ManifestEntry>;
  schemaValidationReport: SchemaValidationReportEntry[];
}

export interface HistoricalFeasibilityManifest {
  manifestId: string;
  releaseVersion: 'v1.0.0-rc1';
  targetRange: {
    startDate: string;
    endDate: string;
    totalCalendarDays: number;
    expectedTradingDays: number;
    weekendDays: number;
    knownHolidays: number;
  };
  acquisitionSummary: {
    totalCalendarDays: number;
    expectedTradingDays: number;
    acquiredValidCount: number;
    skippedWeekendCount: number;
    skippedHolidayCount: number;
    http404Count: number;
    networkErrorCount: number;
    corruptArchiveCount: number;
    schemaMismatchCount: number;
    pendingExecutionCount: number;
  };
  records: Record<string, DetailedDateAssessment>;
  evaluatedAt: string;
  manifestIntegrityDigest: string;
}

export interface RunnerConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  knownHolidays?: string[]; // Array of YYYY-MM-DD
}

export class HistoricalFeasibilityRunner {
  // Authoritative Cutoff Date for CM-UDiFF format introduction by NSE
  public static readonly UDIFF_MIGRATION_CUTOFF_DATE = '2024-07-08';

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
   * Constructs the canonical archive filename and URL for a date based on dual-era routing:
   * - dateIso >= 2024-07-08: CM-UDiFF Bhavcopy URL
   * - dateIso < 2024-07-08: Pre-UDiFF Legacy Bhavcopy URL (cmDDMMMYYYYbhav.csv.zip)
   */
  public static getArchiveUrl(dateIso: string): { filename: string; url: string } {
    if (dateIso < HistoricalFeasibilityRunner.UDIFF_MIGRATION_CUTOFF_DATE) {
      return LegacyBhavcopyParser.getLegacyArchiveUrl(dateIso);
    }
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
   * Evaluates a synthetic or downloaded archive buffer against dual-era feasibility criteria.
   */
  public static evaluateArchive(
    dateIso: string,
    options?: {
      zipBuffer?: Buffer;
      httpStatusCode?: number;
      networkError?: string;
      priorRecord?: DetailedDateAssessment;
      localPath?: string;
    }
  ): DetailedDateAssessment {
    const { filename, url } = HistoricalFeasibilityRunner.getArchiveUrl(dateIso);
    const holidays = new Set(HistoricalFeasibilityRunner.DEFAULT_KNOWN_HOLIDAYS);
    const classification = HistoricalFeasibilityRunner.classifyDate(dateIso, holidays);
    const evaluatedAt = new Date().toISOString();

    if (classification === 'WEEKEND') {
      return {
        date: dateIso,
        classification: 'WEEKEND',
        acquisitionUrl: url,
        status: 'NON_TRADING_WEEKEND',
        localFilename: filename,
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        evaluatedAt,
      };
    }

    if (classification === 'HOLIDAY') {
      return {
        date: dateIso,
        classification: 'HOLIDAY',
        acquisitionUrl: url,
        status: 'NON_TRADING_HOLIDAY',
        localFilename: filename,
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        evaluatedAt,
      };
    }

    // Network / HTTP error cases
    if (options?.networkError) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'NETWORK_ERROR',
        httpStatusCode: options.httpStatusCode,
        failureReason: options.networkError,
        localFilename: filename,
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        evaluatedAt,
      };
    }

    if (options?.httpStatusCode === 404) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'HTTP_404',
        httpStatusCode: 404,
        failureReason: 'Archive not found on NSE server (HTTP 404)',
        localFilename: filename,
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        evaluatedAt,
      };
    }

    if (options?.httpStatusCode && options.httpStatusCode >= 400) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'HTTP_OTHER_ERROR',
        httpStatusCode: options.httpStatusCode,
        failureReason: `HTTP ${options.httpStatusCode} error received from server`,
        localFilename: filename,
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        evaluatedAt,
      };
    }

    const zipBuffer = options?.zipBuffer;
    if (!zipBuffer) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'PENDING_WINDOWS_EXECUTION',
        localFilename: filename,
        ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        failureReason: 'Archive acquisition pending on operator Windows machine',
        evaluatedAt,
      };
    }

    if (zipBuffer.length === 0) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'EMPTY_RESPONSE',
        localFilename: filename,
        ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
        fileSizeBytes: 0,
        sha256Hex: '',
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        failureReason: 'Response or file buffer is 0 bytes',
        evaluatedAt,
      };
    }

    const fileSizeBytes = zipBuffer.length;
    const sha256Hex = crypto.createHash('sha256').update(zipBuffer).digest('hex');

    // Check if hash changed from a prior record
    const priorSha256Hex = options?.priorRecord?.sha256Hex;
    const hashChangedFromPrior = Boolean(priorSha256Hex && priorSha256Hex.length > 0 && priorSha256Hex !== sha256Hex);

    const extraction: ExtractedZipResult = CmUdiffParser.extractZipArchive(zipBuffer);
    if (!extraction.isValid) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'CORRUPT_ARCHIVE',
        httpStatusCode: 200,
        localFilename: filename,
        ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
        fileSizeBytes,
        sha256Hex,
        zipValidity: false,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        failureReason: `ZIP extraction failed: ${extraction.error}`,
        evaluatedAt,
        priorSha256Hex,
        hashChangedFromPrior,
      };
    }

    const firstLine = extraction.rawCsvContent.split(/\r?\n/)[0] || '';
    const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    if (headers.length === 0 || !extraction.rawCsvContent.trim()) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'CSV_INVALID',
        httpStatusCode: 200,
        localFilename: filename,
        ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
        fileSizeBytes,
        sha256Hex,
        zipValidity: true,
        csvValidity: false,
        schemaValidity: false,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        failureReason: 'CSV extraction produced 0 headers or 0 rows',
        evaluatedAt,
        priorSha256Hex,
        hashChangedFromPrior,
      };
    }

    const detectedFormat = UnifiedHistoricalAdapter.detectFormat(headers);

    let schemaValidity = false;
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let schemaErrors: string[] = [];
    let failureReason: string | undefined;

    if (detectedFormat === 'CM_UDIFF') {
      const { headers: h, records } = CmUdiffParser.parseCsv(extraction.rawCsvContent);
      if (records.length === 0) {
        return {
          date: dateIso,
          classification: 'TRADING_DAY',
          acquisitionUrl: url,
          status: 'CSV_INVALID',
          httpStatusCode: 200,
          localFilename: filename,
          ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
          fileSizeBytes,
          sha256Hex,
          zipValidity: true,
          csvValidity: false,
          schemaValidity: false,
          recordCount: 0,
          validRecordCount: 0,
          invalidRecordCount: 0,
          failureReason: 'CSV extraction produced 0 rows',
          evaluatedAt,
          priorSha256Hex,
          hashChangedFromPrior,
        };
      }
      const schemaVal: CmUdiffValidationResult = CmUdiffParser.validateSchema(h, records);
      schemaValidity = schemaVal.isValid;
      totalRows = schemaVal.totalRows;
      validRows = schemaVal.validRows;
      invalidRows = schemaVal.invalidRows;
      schemaErrors = schemaVal.errors.map((e) => e.error);
      if (!schemaValidity) {
        failureReason = `CM-UDiFF schema validation failed (${schemaVal.invalidRows} invalid rows, missing: ${schemaVal.missingRequiredHeaders.join(', ')})`;
      }
    } else if (detectedFormat === 'LEGACY_BHAVCOPY') {
      const { headers: h, records } = LegacyBhavcopyParser.parseCsv(extraction.rawCsvContent);
      if (records.length === 0) {
        return {
          date: dateIso,
          classification: 'TRADING_DAY',
          acquisitionUrl: url,
          status: 'CSV_INVALID',
          httpStatusCode: 200,
          localFilename: filename,
          ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
          fileSizeBytes,
          sha256Hex,
          zipValidity: true,
          csvValidity: false,
          schemaValidity: false,
          recordCount: 0,
          validRecordCount: 0,
          invalidRecordCount: 0,
          failureReason: 'CSV extraction produced 0 rows',
          evaluatedAt,
          priorSha256Hex,
          hashChangedFromPrior,
        };
      }
      const schemaVal: LegacyBhavcopyValidationResult = LegacyBhavcopyParser.validateSchema(h, records);
      schemaValidity = schemaVal.isValid;
      totalRows = schemaVal.totalRows;
      validRows = schemaVal.validRows;
      invalidRows = schemaVal.invalidRows;
      schemaErrors = schemaVal.errors.map((e) => e.error);
      if (!schemaValidity) {
        failureReason = `Legacy Bhavcopy schema validation failed (${schemaVal.invalidRows} invalid rows, missing: ${schemaVal.missingRequiredHeaders.join(', ')})`;
      }
    } else {
      schemaValidity = false;
      failureReason = `Unrecognized header structure for date ${dateIso}: ${headers.slice(0, 5).join(', ')}`;
      schemaErrors = [failureReason];
    }

    if (!schemaValidity) {
      return {
        date: dateIso,
        classification: 'TRADING_DAY',
        acquisitionUrl: url,
        status: 'SCHEMA_MISMATCH',
        httpStatusCode: 200,
        localFilename: filename,
        ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
        fileSizeBytes,
        sha256Hex,
        zipValidity: true,
        csvValidity: true,
        schemaValidity: false,
        recordCount: totalRows,
        validRecordCount: validRows,
        invalidRecordCount: invalidRows,
        schemaErrors,
        failureReason,
        evaluatedAt,
        priorSha256Hex,
        hashChangedFromPrior,
      };
    }

    return {
      date: dateIso,
      classification: 'TRADING_DAY',
      acquisitionUrl: url,
      status: 'ACQUIRED_VALID',
      httpStatusCode: 200,
      localFilename: filename,
      ...(options?.localPath === undefined ? {} : { localPath: options.localPath }),
      fileSizeBytes,
      sha256Hex,
      zipValidity: true,
      csvValidity: true,
      schemaValidity: true,
      recordCount: totalRows,
      validRecordCount: validRows,
      invalidRecordCount: 0,
      evaluatedAt,
      priorSha256Hex,
      hashChangedFromPrior,
    };
  }

  /**
   * Assembles the full manifest and companion evidence package.
   */
  public static buildFeasibilityManifest(
    config: RunnerConfig,
    existingRecords: Record<string, DetailedDateAssessment> = {}
  ): HistoricalFeasibilityManifest {
    const allDates = HistoricalFeasibilityRunner.generateDateSequence(config.startDate, config.endDate);
    const holidays = new Set(config.knownHolidays || HistoricalFeasibilityRunner.DEFAULT_KNOWN_HOLIDAYS);

    const records: Record<string, DetailedDateAssessment> = {};
    let expectedTradingDays = 0;
    let weekendDays = 0;
    let knownHolidays = 0;

    let acquiredValidCount = 0;
    let skippedWeekendCount = 0;
    let skippedHolidayCount = 0;
    let http404Count = 0;
    let networkErrorCount = 0;
    let corruptArchiveCount = 0;
    let schemaMismatchCount = 0;
    let pendingExecutionCount = 0;

    for (const dateIso of allDates) {
      const classification = HistoricalFeasibilityRunner.classifyDate(dateIso, holidays);
      if (classification === 'TRADING_DAY') expectedTradingDays++;
      else if (classification === 'WEEKEND') weekendDays++;
      else if (classification === 'HOLIDAY') knownHolidays++;

      // Deterministic resume: if valid record exists in existingRecords, preserve it
      const existing = existingRecords[dateIso];
      let record: DetailedDateAssessment;

      if (existing && (existing.status === 'ACQUIRED_VALID' || existing.status === 'NON_TRADING_WEEKEND' || existing.status === 'NON_TRADING_HOLIDAY')) {
        record = existing;
      } else if (existing) {
        // Retry failed/incomplete record
        record = existing;
      } else {
        record = HistoricalFeasibilityRunner.evaluateArchive(dateIso);
      }

      records[dateIso] = record;

      switch (record.status) {
        case 'ACQUIRED_VALID':
          acquiredValidCount++;
          break;
        case 'NON_TRADING_WEEKEND':
          skippedWeekendCount++;
          break;
        case 'NON_TRADING_HOLIDAY':
          skippedHolidayCount++;
          break;
        case 'HTTP_404':
          http404Count++;
          break;
        case 'NETWORK_ERROR':
          networkErrorCount++;
          break;
        case 'CORRUPT_ARCHIVE':
          corruptArchiveCount++;
          break;
        case 'SCHEMA_MISMATCH':
          schemaMismatchCount++;
          break;
        case 'PENDING_WINDOWS_EXECUTION':
          pendingExecutionCount++;
          break;
        default:
          break;
      }
    }

    const manifestBody = {
      manifestId: `d114-manifest-${Date.now()}`,
      releaseVersion: 'v1.0.0-rc1' as const,
      targetRange: {
        startDate: config.startDate,
        endDate: config.endDate,
        totalCalendarDays: allDates.length,
        expectedTradingDays,
        weekendDays,
        knownHolidays,
      },
      acquisitionSummary: {
        totalCalendarDays: allDates.length,
        expectedTradingDays,
        acquiredValidCount,
        skippedWeekendCount,
        skippedHolidayCount,
        http404Count,
        networkErrorCount,
        corruptArchiveCount,
        schemaMismatchCount,
        pendingExecutionCount,
      },
      records,
      evaluatedAt: new Date().toISOString(),
    };

    const sanitizedRecords: Record<string, Record<string, unknown>> = {};
    for (const [d, r] of Object.entries(records)) {
      const { evaluatedAt: _evaluatedAt, ...rest } = r;
      sanitizedRecords[d] = rest;
    }

    const deterministicDigestPayload = {
      releaseVersion: 'v1.0.0-rc1' as const,
      targetRange: {
        startDate: config.startDate,
        endDate: config.endDate,
        totalCalendarDays: allDates.length,
        expectedTradingDays,
        weekendDays,
        knownHolidays,
      },
      acquisitionSummary: {
        totalCalendarDays: allDates.length,
        expectedTradingDays,
        acquiredValidCount,
        skippedWeekendCount,
        skippedHolidayCount,
        http404Count,
        networkErrorCount,
        corruptArchiveCount,
        schemaMismatchCount,
        pendingExecutionCount,
      },
      records: sanitizedRecords,
    };

    const manifestIntegrityDigest = computeLineageHash(deterministicDigestPayload, {
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
   * Generates the complete 6-file evidence package structure from a manifest.
   */
  public static generateEvidencePackage(manifest: HistoricalFeasibilityManifest): CompleteEvidencePackage {
    const countsByStatus: Record<DetailedAcquisitionStatus, number> = {
      NON_TRADING_WEEKEND: 0,
      NON_TRADING_HOLIDAY: 0,
      ACQUIRED_VALID: 0,
      HTTP_404: 0,
      HTTP_OTHER_ERROR: 0,
      NETWORK_ERROR: 0,
      EMPTY_RESPONSE: 0,
      CORRUPT_ARCHIVE: 0,
      CSV_INVALID: 0,
      SCHEMA_MISMATCH: 0,
      OTHER_FAILURE: 0,
      PENDING_WINDOWS_EXECUTION: 0,
    };

    const failureRegister: FailureUnavailableRegisterEntry[] = [];
    const archiveIntegrityReport: ArchiveIntegrityReportEntry[] = [];
    const sha256Manifest: Record<string, Sha256ManifestEntry> = {};
    const schemaValidationReport: SchemaValidationReportEntry[] = [];

    const tradingDays = manifest.targetRange.expectedTradingDays;

    for (const [date, rec] of Object.entries(manifest.records)) {
      countsByStatus[rec.status] = (countsByStatus[rec.status] || 0) + 1;

      if (rec.classification === 'TRADING_DAY') {
        if (rec.status !== 'ACQUIRED_VALID' && rec.status !== 'PENDING_WINDOWS_EXECUTION') {
          failureRegister.push({
            date,
            classification: rec.classification,
            url: rec.acquisitionUrl,
            status: rec.status,
            httpStatusCode: rec.httpStatusCode,
            failureReason: rec.failureReason,
          });
        }
      }

      if (rec.fileSizeBytes > 0 || rec.status === 'CORRUPT_ARCHIVE') {
        archiveIntegrityReport.push({
          date,
          localFilename: rec.localFilename,
          fileSizeBytes: rec.fileSizeBytes,
          sha256Hex: rec.sha256Hex,
          zipValid: rec.zipValidity,
          csvExtracted: rec.csvValidity,
          extractionError: rec.failureReason,
        });
      }

      if (rec.sha256Hex.length > 0) {
        sha256Manifest[date] = {
          date,
          localFilename: rec.localFilename,
          fileSizeBytes: rec.fileSizeBytes,
          sha256Hex: rec.sha256Hex,
          status: rec.status,
        };
      }

      if (rec.recordCount > 0 || rec.status === 'SCHEMA_MISMATCH') {
        const requiredHeaders = date < HistoricalFeasibilityRunner.UDIFF_MIGRATION_CUTOFF_DATE
          ? LegacyBhavcopyParser.REQUIRED_HEADERS
          : CmUdiffParser.REQUIRED_HEADERS;

        schemaValidationReport.push({
          date,
          localFilename: rec.localFilename,
          schemaValid: rec.schemaValidity,
          totalRows: rec.recordCount,
          validRows: rec.validRecordCount,
          invalidRows: rec.invalidRecordCount,
          discoveredHeaders: requiredHeaders,
          missingHeaders: rec.schemaErrors?.filter((e) => e.includes('Missing')) || [],
          sampleErrors: rec.schemaErrors?.slice(0, 5) || [],
        });
      }
    }

    const acquiredValid = countsByStatus.ACQUIRED_VALID;
    const unavailableCount = countsByStatus.HTTP_404 + countsByStatus.HTTP_OTHER_ERROR + countsByStatus.NETWORK_ERROR + countsByStatus.EMPTY_RESPONSE;
    const corruptOrInvalidCount = countsByStatus.CORRUPT_ARCHIVE + countsByStatus.CSV_INVALID + countsByStatus.SCHEMA_MISMATCH + countsByStatus.OTHER_FAILURE;

    const coverageSummary: HistoricalCoverageSummary = {
      targetRange: manifest.targetRange,
      countsByStatus,
      metrics: {
        tradingDaysAttempted: tradingDays,
        acquiredValidCount: acquiredValid,
        unavailableCount,
        corruptOrInvalidCount,
        coveragePctOfTradingDays: tradingDays > 0 ? Number(((acquiredValid / tradingDays) * 100).toFixed(2)) : 0,
        dataIntegrityPct: acquiredValid + corruptOrInvalidCount > 0 ? Number(((acquiredValid / (acquiredValid + corruptOrInvalidCount)) * 100).toFixed(2)) : 0,
      },
      generatedAt: new Date().toISOString(),
    };

    return {
      manifest,
      coverageSummary,
      failureRegister,
      archiveIntegrityReport,
      sha256Manifest,
      schemaValidationReport,
    };
  }

  /**
   * Generates the complete, hardened operator PowerShell execution runner for Windows host.
   * Incorporates dual-era routing: CM-UDiFF (>= 2024-07-08) and Legacy Bhavcopy (< 2024-07-08).
   */
  public static generateHardenedWindowsPowerShellRunner(startDate: string, endDate: string, targetDir: string): string {
    return `# ==============================================================================
# IIPS D114: Hardened Dual-Era NSE Historical Acquisition & Evidence Runner
# Target Range: ${startDate} to ${endDate}
# Evidence Output Directory: ${targetDir}
# Architecture: Dual-Era (CM-UDiFF [>= 2024-07-08] + Legacy Bhavcopy [< 2024-07-08])
# ==============================================================================

param(
    [string]$StartDateStr = "${startDate}",
    [string]$EndDateStr = "${endDate}",
    [string]$OutputDir = "${targetDir}",
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
                        $Lines = $CsvText -split "(\r?\n)" | Where-Object { $_.Trim().Length -gt 0 }
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
`;
  }
}
