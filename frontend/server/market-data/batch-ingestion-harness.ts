/**
 * D114: Automated Historical Bhavcopy Batch Ingestion Harness.
 *
 * Responsibilities:
 * - Scans local directories for NSE CM-UDiFF Bhavcopy files (.csv.zip and .csv).
 * - Enforces strict filename pattern recognition: BhavCopy_NSE_CM_0_0_0_YYYYMMDD_F_0000.csv(.zip).
 * - Extracts trade-date and sorts chronologically ascending.
 * - Extracts .csv.zip archives purely in-memory via ArchiveExtractor (zero disk writes).
 * - Ingests CSV payloads sequentially through EodIngestionPipeline and MarketDataStore.
 * - Collects comprehensive audit metrics, throughput statistics, and failure isolation logs.
 * - Guarantees 100% source file immutability (zero file modification or deletion).
 * - Strictly offline: zero network requests, zero web scraping, zero new DB technologies.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { ArchiveExtractor } from './archive-extractor';
import { EodIngestionPipeline } from './eod-pipeline';
import { MarketDataStore, defaultMarketDataStore } from './market-data-store';

export const NSE_UDIFF_FILENAME_REGEX = /^BhavCopy_NSE_CM_0_0_0_(\d{4})(\d{2})(\d{2})_F_0000\.csv(\.zip)?$/i;

export interface DiscoveredArchive {
  readonly fileName: string;
  readonly fullPath: string;
  readonly isZip: boolean;
  readonly tradeDate: string; // YYYY-MM-DD
  readonly fileSize: number;
  readonly initialSha256: string;
}

export interface FileIngestionResult {
  readonly fileName: string;
  readonly tradeDate: string;
  readonly isZip: boolean;
  readonly success: boolean;
  readonly acceptedCount: number;
  readonly duplicateCount: number;
  readonly quarantinedCount: number;
  readonly rejectedCount: number;
  readonly sourceRecordCount: number;
  readonly error?: string;
  readonly elapsedMs: number;
  readonly postSha256: string;
  readonly immutable: boolean;
}

export interface BatchIngestionOptions {
  readonly inputDir: string;
  readonly fromDate?: string; // YYYY-MM-DD (inclusive)
  readonly toDate?: string;   // YYYY-MM-DD (inclusive)
  readonly dryRun?: boolean;  // Validate and discover without writing to store
  readonly stopOnError?: boolean; // Halt immediately on first failed archive
  readonly store?: MarketDataStore;
}

export interface BatchIngestionSummary {
  readonly inputDir: string;
  readonly dryRun: boolean;
  readonly totalFilesDiscovered: number;
  readonly totalFilesEligible: number;
  readonly totalFilesProcessed: number;
  readonly totalFilesSuccessful: number;
  readonly totalFilesFailed: number;
  readonly totalRecordsAccepted: number;
  readonly totalDuplicatesSuppressed: number;
  readonly totalRecordsQuarantined: number;
  readonly earliestTradeDate: string | null;
  readonly latestTradeDate: string | null;
  readonly fileResults: readonly FileIngestionResult[];
  readonly totalElapsedMs: number;
  readonly throughputRecordsPerSec: number;
  readonly allFilesImmutable: boolean;
  readonly auditTimestamp: string;
}

export function computeFileSha256(filePath: string): string {
  const fileBytes = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBytes).digest('hex');
}

export class BatchIngestionHarness {
  private readonly store: MarketDataStore;
  private readonly pipeline: EodIngestionPipeline;

  constructor(store: MarketDataStore = defaultMarketDataStore) {
    this.store = store;
    this.pipeline = new EodIngestionPipeline(store);
  }

  /**
   * Discovers and parses valid NSE CM-UDiFF archives in the specified directory.
   */
  public discoverArchives(inputDir: string, fromDate?: string, toDate?: string): DiscoveredArchive[] {
    if (!fs.existsSync(inputDir)) {
      throw new Error(`BATCH_INGEST_ERROR: Input directory does not exist: '${inputDir}'`);
    }

    const entries = fs.readdirSync(inputDir, { withFileTypes: true });
    const discovered: DiscoveredArchive[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const match = NSE_UDIFF_FILENAME_REGEX.exec(entry.name);
      if (!match) continue; // Ignore non-matching filenames

      const year = match[1];
      const month = match[2];
      const day = match[3];
      const tradeDate = `${year}-${month}-${day}`;

      if (fromDate && tradeDate < fromDate) continue;
      if (toDate && tradeDate > toDate) continue;

      const fullPath = path.join(inputDir, entry.name);
      const stat = fs.statSync(fullPath);
      const isZip = entry.name.toLowerCase().endsWith('.zip');
      const initialSha256 = computeFileSha256(fullPath);

      discovered.push({
        fileName: entry.name,
        fullPath,
        isZip,
        tradeDate,
        fileSize: stat.size,
        initialSha256,
      });
    }

    // Deterministic chronological ordering (earliest tradeDate first)
    discovered.sort((a, b) => {
      const cmp = a.tradeDate.localeCompare(b.tradeDate);
      if (cmp !== 0) return cmp;
      return a.fileName.localeCompare(b.fileName);
    });

    return discovered;
  }

  /**
   * Executes batch ingestion over the discovered archives according to the specified options.
   */
  public async executeBatch(options: BatchIngestionOptions): Promise<BatchIngestionSummary> {
    const startTime = Date.now();
    const discovered = this.discoverArchives(options.inputDir, options.fromDate, options.toDate);

    const fileResults: FileIngestionResult[] = [];
    let totalAccepted = 0;
    let totalDuplicates = 0;
    let totalQuarantined = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let earliestDate: string | null = null;
    let latestDate: string | null = null;
    let allImmutable = true;

    for (const archive of discovered) {
      const fileStartTime = Date.now();
      let fileSuccess = false;
      let accepted = 0;
      let duplicates = 0;
      let quarantined = 0;
      let rejected = 0;
      let sourceCount = 0;
      let errorMessage: string | undefined;

      try {
        let csvContent: string;

        if (archive.isZip) {
          const zipBytes = fs.readFileSync(archive.fullPath);
          const extracted = ArchiveExtractor.extractCsvFromZip(zipBytes);
          csvContent = extracted.content;
        } else {
          csvContent = fs.readFileSync(archive.fullPath, 'utf8');
        }

        if (options.dryRun) {
          // Dry-run: parse & validate without writing to persistent store
          const tempStore = new MarketDataStore();
          const tempPipeline = new EodIngestionPipeline(tempStore);
          const res = tempPipeline.ingestBhavcopyCsv(
            csvContent,
            archive.isZip ? `[OFFLINE_LOCAL_ZIP] ${archive.fileName}` : `[OFFLINE_LOCAL] ${archive.fileName}`
          );
          accepted = res.metrics.acceptedCount;
          duplicates = res.metrics.duplicateCount;
          quarantined = res.metrics.quarantinedCount;
          rejected = res.metrics.rejectedCount;
          sourceCount = res.metrics.sourceRecordCount;
          fileSuccess = true;
        } else {
          // Live batch ingestion into configured MarketDataStore
          const res = this.pipeline.ingestBhavcopyCsv(
            csvContent,
            archive.isZip ? `[OFFLINE_LOCAL_ZIP] ${archive.fileName}` : `[OFFLINE_LOCAL] ${archive.fileName}`
          );
          accepted = res.metrics.acceptedCount;
          duplicates = res.metrics.duplicateCount;
          quarantined = res.metrics.quarantinedCount;
          rejected = res.metrics.rejectedCount;
          sourceCount = res.metrics.sourceRecordCount;
          fileSuccess = true;
        }
      } catch (err) {
        fileSuccess = false;
        errorMessage = err instanceof Error ? err.message : String(err);
      }

      // Verify file immutability post-processing
      const postSha256 = computeFileSha256(archive.fullPath);
      const isImmutable = postSha256 === archive.initialSha256;
      if (!isImmutable) {
        allImmutable = false;
      }

      const fileElapsed = Date.now() - fileStartTime;

      if (fileSuccess) {
        totalSuccessful++;
        totalAccepted += accepted;
        totalDuplicates += duplicates;
        totalQuarantined += quarantined;
        if (!earliestDate || archive.tradeDate < earliestDate) {
          earliestDate = archive.tradeDate;
        }
        if (!latestDate || archive.tradeDate > latestDate) {
          latestDate = archive.tradeDate;
        }
      } else {
        totalFailed++;
      }

      fileResults.push({
        fileName: archive.fileName,
        tradeDate: archive.tradeDate,
        isZip: archive.isZip,
        success: fileSuccess,
        acceptedCount: accepted,
        duplicateCount: duplicates,
        quarantinedCount: quarantined,
        rejectedCount: rejected,
        sourceRecordCount: sourceCount,
        error: errorMessage,
        elapsedMs: fileElapsed,
        postSha256,
        immutable: isImmutable,
      });

      if (!fileSuccess && options.stopOnError) {
        break;
      }
    }

    const totalElapsedMs = Math.max(1, Date.now() - startTime);
    const throughput = Number(((totalAccepted / totalElapsedMs) * 1000).toFixed(1));

    return {
      inputDir: options.inputDir,
      dryRun: Boolean(options.dryRun),
      totalFilesDiscovered: discovered.length,
      totalFilesEligible: discovered.length,
      totalFilesProcessed: fileResults.length,
      totalFilesSuccessful: totalSuccessful,
      totalFilesFailed: totalFailed,
      totalRecordsAccepted: totalAccepted,
      totalDuplicatesSuppressed: totalDuplicates,
      totalRecordsQuarantined: totalQuarantined,
      earliestTradeDate: earliestDate,
      latestTradeDate: latestDate,
      fileResults,
      totalElapsedMs,
      throughputRecordsPerSec: throughput,
      allFilesImmutable: allImmutable,
      auditTimestamp: new Date().toISOString(),
    };
  }
}
