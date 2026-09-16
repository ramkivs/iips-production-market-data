import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { BatchIngestionHarness, computeFileSha256 } from './batch-ingestion-harness';
import { ArchiveExtractor } from './archive-extractor';
import { MarketDataStore } from './market-data-store';
import { CM_UDIFF_HEADER } from './fixtures/synthetic-fixtures';

// Helper to construct a synthetic Bhavcopy CSV for a specific trade date
function makeBhavcopy(tradeDate: string, relClose: number = 2950.0, tcsClose: number = 4150.0): string {
  return `${CM_UDIFF_HEADER}
${tradeDate},${tradeDate},CM,NSE,STK,1001,INE002A01018,RELIANCE,EQ,Reliance Industries,${relClose - 10},${relClose + 10},${relClose - 15},${relClose},${relClose},${relClose - 5},1000000,2950000000,50000
${tradeDate},${tradeDate},CM,NSE,STK,1002,INE467B01029,TCS,EQ,Tata Consultancy Services,${tcsClose - 10},${tcsClose + 15},${tcsClose - 20},${tcsClose},${tcsClose},${tcsClose - 5},500000,2075000000,25000`;
}

describe('D114 Batch Ingestion Harness Invariant Suite', () => {
  it('A. Multi-archive sequential ingestion: ingests multi-day history sequentially', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-a-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      // Create 3 days of valid ZIP archives
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv.zip';
      const d2 = 'BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv.zip';
      const d3 = 'BhavCopy_NSE_CM_0_0_0_20260912_F_0000.csv.zip';

      fs.writeFileSync(path.join(tempDir, d1), ArchiveExtractor.createZipBuffer(d1.replace('.zip', ''), makeBhavcopy('2026-09-10')));
      fs.writeFileSync(path.join(tempDir, d2), ArchiveExtractor.createZipBuffer(d2.replace('.zip', ''), makeBhavcopy('2026-09-11')));
      fs.writeFileSync(path.join(tempDir, d3), ArchiveExtractor.createZipBuffer(d3.replace('.zip', ''), makeBhavcopy('2026-09-12')));

      const summary = await harness.executeBatch({ inputDir: tempDir });

      expect(summary.totalFilesDiscovered).toBe(3);
      expect(summary.totalFilesSuccessful).toBe(3);
      expect(summary.totalFilesFailed).toBe(0);
      expect(summary.totalRecordsAccepted).toBe(6); // 2 equities * 3 days
      expect(summary.earliestTradeDate).toBe('2026-09-10');
      expect(summary.latestTradeDate).toBe('2026-09-12');

      const relHistory = store.getEodHistory('RELIANCE');
      expect(relHistory.length).toBe(3);
      expect(relHistory[0].tradeDate).toBe('2026-09-10');
      expect(relHistory[1].tradeDate).toBe('2026-09-11');
      expect(relHistory[2].tradeDate).toBe('2026-09-12');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('B. Mixed ZIP + CSV input: correctly processes both formats within the same directory', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-b-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      // Day 1 as ZIP
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv.zip';
      fs.writeFileSync(path.join(tempDir, d1), ArchiveExtractor.createZipBuffer('BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv', makeBhavcopy('2026-09-10')));

      // Day 2 as raw CSV
      const d2 = 'BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv';
      fs.writeFileSync(path.join(tempDir, d2), makeBhavcopy('2026-09-11'), 'utf8');

      const summary = await harness.executeBatch({ inputDir: tempDir });

      expect(summary.totalFilesDiscovered).toBe(2);
      expect(summary.totalFilesSuccessful).toBe(2);
      expect(summary.totalRecordsAccepted).toBe(4);

      expect(summary.fileResults[0].isZip).toBe(true);
      expect(summary.fileResults[1].isZip).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('C. Out-of-order filenames are processed chronologically ascending', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-c-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      // Intentionally create later date first
      const d3 = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260901_F_0000.csv';
      const d2 = 'BhavCopy_NSE_CM_0_0_0_20260907_F_0000.csv';

      fs.writeFileSync(path.join(tempDir, d3), makeBhavcopy('2026-09-14'), 'utf8');
      fs.writeFileSync(path.join(tempDir, d1), makeBhavcopy('2026-09-01'), 'utf8');
      fs.writeFileSync(path.join(tempDir, d2), makeBhavcopy('2026-09-07'), 'utf8');

      const summary = await harness.executeBatch({ inputDir: tempDir });

      // Verifies processing order is chronologically sorted: 09-01, 09-07, 09-14
      expect(summary.fileResults[0].tradeDate).toBe('2026-09-01');
      expect(summary.fileResults[1].tradeDate).toBe('2026-09-07');
      expect(summary.fileResults[2].tradeDate).toBe('2026-09-14');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('D. Corrupt ZIP fails closed while later valid archives continue', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-d-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv.zip';
      const d2Corrupt = 'BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv.zip';
      const d3 = 'BhavCopy_NSE_CM_0_0_0_20260912_F_0000.csv.zip';

      fs.writeFileSync(path.join(tempDir, d1), ArchiveExtractor.createZipBuffer('file.csv', makeBhavcopy('2026-09-10')));
      fs.writeFileSync(path.join(tempDir, d2Corrupt), Buffer.from('NOT_A_VALID_ZIP_BUFFER'));
      fs.writeFileSync(path.join(tempDir, d3), ArchiveExtractor.createZipBuffer('file.csv', makeBhavcopy('2026-09-12')));

      const summary = await harness.executeBatch({ inputDir: tempDir, stopOnError: false });

      expect(summary.totalFilesDiscovered).toBe(3);
      expect(summary.totalFilesSuccessful).toBe(2);
      expect(summary.totalFilesFailed).toBe(1);
      expect(summary.fileResults[1].success).toBe(false);
      expect(summary.fileResults[1].error).toMatch(/ARCHIVE_EXTRACTOR_ERROR/);

      // Store received valid records for d1 and d3
      expect(store.getDistinctTradeDates().length).toBe(2);
      expect(store.getDistinctTradeDates()).toEqual(['2026-09-10', '2026-09-12']);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('E. Duplicate second run suppresses 100% of already-ingested records', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-e-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv.zip';
      fs.writeFileSync(path.join(tempDir, d1), ArchiveExtractor.createZipBuffer('file.csv', makeBhavcopy('2026-09-10')));

      // First run: accepts records
      const run1 = await harness.executeBatch({ inputDir: tempDir });
      expect(run1.totalRecordsAccepted).toBe(2);
      expect(run1.totalDuplicatesSuppressed).toBe(0);

      // Second run: 100% duplicate suppression
      const run2 = await harness.executeBatch({ inputDir: tempDir });
      expect(run2.totalRecordsAccepted).toBe(0);
      expect(run2.totalDuplicatesSuppressed).toBe(2);
      expect(store.getEodHistory('RELIANCE').length).toBe(1); // exactly 1 observation stored
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('F. Source-file SHA-256 hashes are unchanged before and after processing (immutability)', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-f-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      const d1 = 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv.zip';
      const d2 = 'BhavCopy_NSE_CM_0_0_0_20260911_F_0000.csv';
      const file1Path = path.join(tempDir, d1);
      const file2Path = path.join(tempDir, d2);

      fs.writeFileSync(file1Path, ArchiveExtractor.createZipBuffer('file.csv', makeBhavcopy('2026-09-10')));
      fs.writeFileSync(file2Path, makeBhavcopy('2026-09-11'), 'utf8');

      const preHash1 = computeFileSha256(file1Path);
      const preHash2 = computeFileSha256(file2Path);

      const summary = await harness.executeBatch({ inputDir: tempDir });

      expect(summary.allFilesImmutable).toBe(true);
      expect(computeFileSha256(file1Path)).toBe(preHash1);
      expect(computeFileSha256(file2Path)).toBe(preHash2);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('G. --from-date filtering: processes only files on or after the specified date', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-g-'));
    const harness = new BatchIngestionHarness(new MarketDataStore());

    try {
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260901_F_0000.csv'), makeBhavcopy('2026-09-01'));
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv'), makeBhavcopy('2026-09-10'));
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv'), makeBhavcopy('2026-09-15'));

      const summary = await harness.executeBatch({ inputDir: tempDir, fromDate: '2026-09-10' });

      expect(summary.totalFilesProcessed).toBe(2);
      expect(summary.earliestTradeDate).toBe('2026-09-10');
      expect(summary.latestTradeDate).toBe('2026-09-15');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('H. --to-date filtering: processes only files on or before the specified date', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-h-'));
    const harness = new BatchIngestionHarness(new MarketDataStore());

    try {
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260901_F_0000.csv'), makeBhavcopy('2026-09-01'));
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv'), makeBhavcopy('2026-09-10'));
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv'), makeBhavcopy('2026-09-15'));

      const summary = await harness.executeBatch({ inputDir: tempDir, toDate: '2026-09-10' });

      expect(summary.totalFilesProcessed).toBe(2);
      expect(summary.earliestTradeDate).toBe('2026-09-01');
      expect(summary.latestTradeDate).toBe('2026-09-10');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('I. --dry-run performs discovery and validation without store persistence', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-i-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260910_F_0000.csv'), makeBhavcopy('2026-09-10'));

      const summary = await harness.executeBatch({ inputDir: tempDir, dryRun: true });

      expect(summary.dryRun).toBe(true);
      expect(summary.totalFilesSuccessful).toBe(1);
      expect(summary.totalRecordsAccepted).toBe(2);

      // Store remains completely empty because dryRun was active
      expect(store.getAllCurrentState().length).toBe(0);
      expect(store.getDistinctTradeDates().length).toBe(0);
      expect(store.getEodHistory('RELIANCE').length).toBe(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('J. --stop-on-error stops immediately after the first failed archive', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-j-'));
    const store = new MarketDataStore();
    const harness = new BatchIngestionHarness(store);

    try {
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260901_F_0000.csv.zip'), Buffer.from('CORRUPT_ZIP'));
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260902_F_0000.csv'), makeBhavcopy('2026-09-02'));

      const summary = await harness.executeBatch({ inputDir: tempDir, stopOnError: true });

      expect(summary.totalFilesDiscovered).toBe(2);
      // Stopped after 1st failure, so only 1 file processed
      expect(summary.totalFilesProcessed).toBe(1);
      expect(summary.totalFilesFailed).toBe(1);
      expect(summary.totalFilesSuccessful).toBe(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('K. Empty/no-match directory produces an explicit zero-work audit result', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-k-'));
    const harness = new BatchIngestionHarness(new MarketDataStore());

    try {
      const summary = await harness.executeBatch({ inputDir: tempDir });

      expect(summary.totalFilesDiscovered).toBe(0);
      expect(summary.totalFilesProcessed).toBe(0);
      expect(summary.totalRecordsAccepted).toBe(0);
      expect(summary.earliestTradeDate).toBe(null);
      expect(summary.latestTradeDate).toBe(null);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('L. Invalid or non-NSE filenames are ignored deterministically', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd114-test-l-'));
    const harness = new BatchIngestionHarness(new MarketDataStore());

    try {
      // Ignored filenames (wrong prefixes, formats, or extensions)
      fs.writeFileSync(path.join(tempDir, 'legacy_cm14SEP2026bhav.csv'), makeBhavcopy('2026-09-14'));
      fs.writeFileSync(path.join(tempDir, 'notes.txt'), 'hello world');
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_BSE_0_0_0_20260914_F_0000.csv'), makeBhavcopy('2026-09-14'));

      // One valid archive
      fs.writeFileSync(path.join(tempDir, 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv'), makeBhavcopy('2026-09-14'));

      const summary = await harness.executeBatch({ inputDir: tempDir });

      expect(summary.totalFilesDiscovered).toBe(1);
      expect(summary.totalFilesProcessed).toBe(1);
      expect(summary.fileResults[0].fileName).toBe('BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

