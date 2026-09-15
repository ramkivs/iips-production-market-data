/**
 * D106 Dedicated Verification Test Suite: Operator-Drop Workflow & Integrity Controls.
 *
 * Verifies all 14 mandatory operational conditions:
 * 1. Valid operator ZIP drop
 * 2. Valid operator CSV drop
 * 3. Wrong filename pattern handling
 * 4. Wrong / malformed schema rejection (column count mismatch)
 * 5. Corrupt / truncated ZIP rejection
 * 6. Non-CM segment filtering
 * 7. Non-equity series filtering (e.g. debt, corporate bonds)
 * 8. Invalid OHLC relationships (High < Low)
 * 9. Duplicate replay idempotency
 * 10. Conflicting record quarantine
 * 11. Missing expected file fail-closed behavior
 * 12. Source file immutability (SHA-256 unchanged)
 * 13. Provenance tracking ([OFFLINE_LOCAL] vs [OFFLINE_LOCAL_ZIP])
 * 14. Fail-closed error handling
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NseSftpAcquisitionAdapter } from './nse-sftp-adapter';
import { ArchiveExtractor } from './archive-extractor';
import { MarketDataStore } from './market-data-store';
import { EodIngestionPipeline } from './eod-pipeline';
import { parseUdiffCsv } from './cm-udiff-parser';
import { validateAndNormalizeRecord } from './normalizer';
import { CM_UDIFF_HEADER, SYNTHETIC_VALID_BHAVCOPY_2026_09_14 } from './fixtures/synthetic-fixtures';

function computeSha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

describe('D106 Operator-Drop Workflow & Integrity Controls', () => {
  let tempDropDir: string;
  let store: MarketDataStore;

  beforeEach(() => {
    tempDropDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-d106-drop-'));
    store = new MarketDataStore();
  });

  afterEach(() => {
    if (fs.existsSync(tempDropDir)) {
      fs.rmSync(tempDropDir, { recursive: true, force: true });
    }
  });

  it('1. ingests a valid operator-dropped .csv.zip archive with proper provenance', async () => {
    const zipName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip';
    const csvName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
    const zipBytes = ArchiveExtractor.createZipBuffer(csvName, SYNTHETIC_VALID_BHAVCOPY_2026_09_14);
    const dropPath = path.join(tempDropDir, zipName);
    fs.writeFileSync(dropPath, zipBytes);

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const pipeline = new EodIngestionPipeline(store, adapter);
    const result = await pipeline.executeBackfill(['2026-09-14']);

    expect(result.successfulDays).toBe(1);
    expect(result.totalRecordsAccepted).toBe(5);
    const records = store.getEodHistory('RELIANCE');
    expect(records.length).toBe(1);
    expect(records[0].sourceFile).toBe(`[OFFLINE_LOCAL_ZIP] ${csvName}`);
    expect(records[0].sourceIdentifier).toBe('NSE_CM_UDIFF');
  });

  it('2. ingests a valid operator-dropped uncompressed .csv file with proper provenance', async () => {
    const csvName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
    const dropPath = path.join(tempDropDir, csvName);
    fs.writeFileSync(dropPath, SYNTHETIC_VALID_BHAVCOPY_2026_09_14, 'utf8');

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const pipeline = new EodIngestionPipeline(store, adapter);
    const result = await pipeline.executeBackfill(['2026-09-14']);

    expect(result.successfulDays).toBe(1);
    expect(result.totalRecordsAccepted).toBe(5);
    const records = store.getEodHistory('TCS');
    expect(records.length).toBe(1);
    expect(records[0].sourceFile).toBe(`[OFFLINE_LOCAL] ${csvName}`);
  });

  it('3. rejects files with incorrect naming patterns fail-closed', async () => {
    const wrongName = 'legacy_bhavcopy_20260914.csv';
    fs.writeFileSync(path.join(tempDropDir, wrongName), SYNTHETIC_VALID_BHAVCOPY_2026_09_14, 'utf8');

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const result = await adapter.fetchEodBhavcopy('2026-09-14');
    expect(result.success).toBe(false);
    expect(result.error).toContain('EXTERNALLY_BLOCKED');
  });

  it('4. fails closed on malformed schema / column mismatch', () => {
    const badSchemaCsv = `${CM_UDIFF_HEADER}\n2026-09-14,2026-09-14,CM,NSE,STK,1001`; // Missing rest of columns
    const parseResult = parseUdiffCsv(badSchemaCsv);
    expect(parseResult.parseErrors.length).toBeGreaterThan(0);
    expect(parseResult.parseErrors[0]).toContain('column count mismatch');
  });

  it('5. rejects corrupt or truncated ZIP files fail-closed', async () => {
    const zipName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip';
    const corruptBytes = Buffer.from('PK\x03\x04' + 'CORRUPTED_TRUNCATED_PAYLOAD');
    fs.writeFileSync(path.join(tempDropDir, zipName), corruptBytes);

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const result = await adapter.fetchEodBhavcopy('2026-09-14');
    expect(result.success).toBe(false);
    expect(result.error).toContain('OFFLINE_ZIP_EXTRACTION_FAILED');
  });

  it('6 & 7. filters out non-CM segments and non-equity instruments', async () => {
    const mixedCsv = `${CM_UDIFF_HEADER}
2026-09-14,2026-09-14,CM,NSE,STK,1001,INE002A01018,RELIANCE,EQ,Reliance Industries,2950.00,2985.50,2940.00,2972.25,2970.00,2945.00,4521000,13420000000,145200
2026-09-14,2026-09-14,CM,NSE,DBT,9001,IN0020200018,718GS2033,GS,Government of India Bond,98.50,99.00,98.20,98.75,98.70,98.60,50000,4900000,120
2026-09-14,2026-09-14,FO,NSE,FUT,8001,INE002A01018,RELIANCE26SEPFUT,FUT,Reliance Future,2960.00,2995.00,2950.00,2980.00,2982.00,2955.00,20000,59000000,500`;

    const csvName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
    fs.writeFileSync(path.join(tempDropDir, csvName), mixedCsv, 'utf8');

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const pipeline = new EodIngestionPipeline(store, adapter);
    const result = await pipeline.executeBackfill(['2026-09-14']);

    expect(result.successfulDays).toBe(1);
    // Only 1 record (RELIANCE EQ in CM) should be accepted; DBT and FO filtered
    expect(result.totalRecordsAccepted).toBe(1);
    expect(store.getEodHistory('718GS2033').length).toBe(0);
    expect(store.getEodHistory('RELIANCE26SEPFUT').length).toBe(0);
    expect(store.getEodHistory('RELIANCE').length).toBe(1);
  });

  it('8. quarantines invalid OHLC relationships (High < Low)', () => {
    const invalidOhlcRow = {
      TradDt: '2026-09-14',
      BizDt: '2026-09-14',
      Sgmt: 'CM',
      Src: 'NSE',
      FinInstrmTp: 'STK',
      FinInstrmId: '1001',
      ISIN: 'INE002A01018',
      TckrSymb: 'RELIANCE',
      SctySrs: 'EQ',
      FinInstrmNm: 'Reliance Industries',
      OpnPric: '2950.00',
      HghPric: '2900.00', // Impossible: High (2900) < Low (2940)
      LwPric: '2940.00',
      ClsPric: '2920.00',
      LastPric: '2920.00',
      PrvsClsgPric: '2945.00',
      TtlTradgVol: '1000',
      TtlTrfVal: '2920000',
      TtlNbOfTxsExctd: '100',
    };

    const normResult = validateAndNormalizeRecord(invalidOhlcRow, 'test.csv');
    expect(normResult.valid).toBe(false);
    if (!normResult.valid) {
      expect(normResult.quarantine.rule).toBe('OHLC_SANITY');
      expect(normResult.quarantine.reason).toContain('Impossible OHLC relationship');
    }
  });

  it('9. enforces 100% duplicate replay suppression (idempotency)', async () => {
    const csvName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
    fs.writeFileSync(path.join(tempDropDir, csvName), SYNTHETIC_VALID_BHAVCOPY_2026_09_14, 'utf8');

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const pipeline = new EodIngestionPipeline(store, adapter);
    const run1 = await pipeline.executeBackfill(['2026-09-14']);
    expect(run1.totalRecordsAccepted).toBe(5);

    const run2 = await pipeline.executeBackfill(['2026-09-14']);
    expect(run2.successfulDays).toBe(1);
    // Count of stored bars remains exactly 1 per symbol
    expect(store.getEodHistory('RELIANCE').length).toBe(1);
    expect(store.getDistinctTradeDates()).toEqual(['2026-09-14']);
  });

  it('10. quarantines contradictory duplicate records for the same session', () => {
    const initialRecord = {
      tradeDate: '2026-09-14',
      exchange: 'NSE' as const,
      isin: 'INE002A01018',
      symbol: 'RELIANCE',
      securityName: 'Reliance Industries',
      securitySeries: 'EQ',
      open: 2950,
      high: 2985.5,
      low: 2940,
      close: 2972.25,
      lastPrice: 2970,
      previousClose: 2945,
      volume: 4521000,
      tradedValue: 13420000000,
      transactionCount: 145200,
      sourceIdentifier: 'NSE_CM_UDIFF',
      sourceFile: 'file_v1.csv',
      sourceTimestamp: '2026-09-14T16:00:00Z',
      ingestionTimestamp: '2026-09-14T17:00:00Z',
      quality: 'good' as const,
    };

    store.ingestEodRecords([initialRecord], '2026-09-14', 'file_v1.csv');

    // Conflicting incoming record with different close price
    const contradictoryRecord = {
      ...initialRecord,
      close: 2999.0, // Different close!
      sourceFile: 'file_v2.csv',
    };

    const res = store.ingestEodRecords([contradictoryRecord], '2026-09-14', 'file_v2.csv');
    expect(res.quarantined.length).toBe(1);
    expect(res.quarantined[0].rule).toBe('RECONCILIATION_CONFLICT');
  });

  it('11. fails closed when an expected date archive is missing from the drop directory', async () => {
    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const res = await adapter.fetchEodBhavcopy('2026-09-15');
    expect(res.success).toBe(false);
    expect(res.error).toContain('EXTERNALLY_BLOCKED');
  });

  it('12. ensures source archive on disk is not mutated (immutability)', async () => {
    const zipName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip';
    const csvName = 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv';
    const zipBytes = ArchiveExtractor.createZipBuffer(csvName, SYNTHETIC_VALID_BHAVCOPY_2026_09_14);
    const dropPath = path.join(tempDropDir, zipName);
    fs.writeFileSync(dropPath, zipBytes);

    const preSha = computeSha256(fs.readFileSync(dropPath));

    const adapter = new NseSftpAcquisitionAdapter({
      userId: '',
      privateKeyPath: '',
      offlineDropDir: tempDropDir,
    });

    const pipeline = new EodIngestionPipeline(store, adapter);
    await pipeline.executeBackfill(['2026-09-14']);

    const postSha = computeSha256(fs.readFileSync(dropPath));
    expect(postSha).toBe(preSha);
  });
});
