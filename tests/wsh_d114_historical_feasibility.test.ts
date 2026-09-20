/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Historical Feasibility & CM-UDiFF Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as zlib from 'zlib';
import {
  CmUdiffParser,
  HistoricalFeasibilityRunner,
  DateAssessmentRecord,
} from '../src/index.js';

function createSyntheticUdiffZip(filename: string, csvContent: string): Buffer {
  const contentBuf = Buffer.from(csvContent, 'utf8');
  const compressed = zlib.deflateRawSync(contentBuf);
  const fnBuf = Buffer.from(filename, 'utf8');

  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // magic
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(8, 8); // compression: deflate
  header.writeUInt16LE(0, 10); // time
  header.writeUInt16LE(0, 12); // date
  header.writeUInt32LE(0, 14); // crc32
  header.writeUInt32LE(compressed.length, 18); // comp size
  header.writeUInt32LE(contentBuf.length, 22); // uncomp size
  header.writeUInt16LE(fnBuf.length, 26); // fn len
  header.writeUInt16LE(0, 28); // extra len

  return Buffer.concat([header, fnBuf, compressed]);
}

describe('WS-H / D114: 10-Year NSE CM-UDiFF Historical Acquisition Feasibility Suite', () => {
  const sampleValidCsv = `TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol
2026-09-15,2026-09-15,CM,NSE,INE795G01014,HDFCLIFE,EQ,516.10,516.10,530.00,516.09,530.00,532.00,515.00,1500000
2026-09-15,2026-09-15,CM,NSE,INE009A01021,INFY,EQ,1850.00,1850.00,1830.00,1850.00,1835.00,1860.00,1830.00,4500000`;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CM-UDiFF Zip Extraction & CSV Parsing
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-01: extracts and parses valid CM-UDiFF ZIP archive buffer', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidCsv);
    const extraction = CmUdiffParser.extractZipArchive(zipBuf);

    assert.strictEqual(extraction.isValid, true);
    assert.strictEqual(extraction.filename, 'BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv');
    assert.ok(extraction.uncompressedBytes > 0);
    assert.strictEqual(extraction.uncompressedSha256.length, 64);

    const { headers, records } = CmUdiffParser.parseCsv(extraction.rawCsvContent);
    assert.strictEqual(headers.length, 15);
    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[0].TckrSymb, 'HDFCLIFE');
    assert.strictEqual(records[1].TckrSymb, 'INFY');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Fail-Closed Malformed Zip Archive Handling
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-02: fails closed on corrupted or invalid ZIP headers', () => {
    const corruptBuf = Buffer.from('NOT_A_VALID_ZIP_ARCHIVE_DATA_HEADER_EXTRA_PADDING_123456');
    const extraction = CmUdiffParser.extractZipArchive(corruptBuf);

    assert.strictEqual(extraction.isValid, false);
    assert.ok(extraction.error?.includes('Invalid PKZIP header signature'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Schema Validation & Missing Header Detection
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-03: enforces CM-UDiFF required headers and detects missing fields', () => {
    const invalidHeadersCsv = `TradDt,BizDt,Sgmt,ISIN\n2026-09-15,2026-09-15,CM,INE795G01014\n`;
    const { headers, records } = CmUdiffParser.parseCsv(invalidHeadersCsv);
    const schemaResult = CmUdiffParser.validateSchema(headers, records);

    assert.strictEqual(schemaResult.isValid, false);
    assert.strictEqual(schemaResult.headerPresent, false);
    assert.ok(schemaResult.missingRequiredHeaders.includes('TckrSymb'));
    assert.ok(schemaResult.missingRequiredHeaders.includes('ClsPric'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Canonical D01 Quote & D02 OHLCV Normalization
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-04: normalizes CM-UDiFF record to canonical D01 quote and D02 OHLCV candle', () => {
    const { headers, records } = CmUdiffParser.parseCsv(sampleValidCsv);
    const quote = CmUdiffParser.toCanonicalQuote(records[0]);

    assert.strictEqual(quote.symbol, 'HDFCLIFE');
    assert.strictEqual(quote.ltp, 516.10);
    assert.strictEqual(quote.previousClose, 530.00);
    assert.strictEqual(quote.currency, 'INR');
    assert.strictEqual(quote.exchange, 'NSE');

    const candle = CmUdiffParser.toCanonicalOHLCV(records[0]);
    assert.strictEqual(candle.symbol, 'HDFCLIFE');
    assert.strictEqual(candle.interval, '1d');
    assert.strictEqual(candle.open, 530.00);
    assert.strictEqual(candle.high, 532.00);
    assert.strictEqual(candle.low, 515.00);
    assert.strictEqual(candle.close, 516.10);
    assert.strictEqual(candle.volume, 1500000);
    assert.strictEqual(candle.isAdjusted, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Date Classification (Trading Day vs Weekend vs Holiday)
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-05: correctly classifies trading days, weekends, and holidays', () => {
    const holidays = new Set(['2026-01-26', '2026-10-02']);

    // 2026-09-15 was Tuesday -> TRADING_DAY
    assert.strictEqual(HistoricalFeasibilityRunner.classifyDate('2026-09-15', holidays), 'TRADING_DAY');
    // 2026-09-19 was Saturday -> WEEKEND
    assert.strictEqual(HistoricalFeasibilityRunner.classifyDate('2026-09-19', holidays), 'WEEKEND');
    // 2026-09-20 was Sunday -> WEEKEND
    assert.strictEqual(HistoricalFeasibilityRunner.classifyDate('2026-09-20', holidays), 'WEEKEND');
    // 2026-01-26 is Republic Day (Monday) -> HOLIDAY
    assert.strictEqual(HistoricalFeasibilityRunner.classifyDate('2026-01-26', holidays), 'HOLIDAY');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Archive URL Formation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-06: constructs exact canonical CM-UDiFF archive URL pattern', () => {
    const { filename, url } = HistoricalFeasibilityRunner.getArchiveUrl('2026-09-15');
    assert.strictEqual(filename, 'BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv.zip');
    assert.strictEqual(url, 'https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv.zip');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Feasibility Evaluation of Synthetic Archive
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-07: evaluates synthetic archive buffer and returns ACQUIRED record', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidCsv);
    const assessment = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', zipBuf);

    assert.strictEqual(assessment.date, '2026-09-15');
    assert.strictEqual(assessment.classification, 'TRADING_DAY');
    assert.strictEqual(assessment.status, 'ACQUIRED');
    assert.strictEqual(assessment.zipValidity, true);
    assert.strictEqual(assessment.csvValidity, true);
    assert.strictEqual(assessment.schemaValidation.isValid, true);
    assert.strictEqual(assessment.schemaValidation.validRows, 2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Feasibility Manifest Assembly & Resume Mechanics
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-08: builds deterministic feasibility manifest and supports resume', () => {
    const config = {
      startDate: '2026-09-14',
      endDate: '2026-09-20',
    };

    // Pre-evaluate 2026-09-15
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidCsv);
    const existingRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', zipBuf);

    const existingMap: Record<string, DateAssessmentRecord> = {
      '2026-09-15': existingRec,
    };

    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(config, existingMap);

    assert.strictEqual(manifest.targetRange.totalCalendarDays, 7);
    assert.strictEqual(manifest.targetRange.weekendDays, 2); // 19th & 20th
    assert.strictEqual(manifest.acquisitionSummary.acquiredCount, 1); // 15th
    assert.strictEqual(manifest.acquisitionSummary.skippedCount, 2); // 19th & 20th
    assert.strictEqual(manifest.acquisitionSummary.pendingCount, 4); // 14th, 16th, 17th, 18th
    assert.strictEqual(manifest.manifestIntegrityDigest.length, 64);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Windows Operator Script Generation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-09: generates deterministic operator PowerShell script for Windows execution', () => {
    const script = HistoricalFeasibilityRunner.generateWindowsPowerShellScript(
      '2016-09-20',
      '2026-09-20',
      'C:\\IIPS_Data\\Bhavcopy'
    );

    assert.ok(script.includes('BhavCopy_NSE_CM_0_0_0_'));
    assert.ok(script.includes('https://nsearchives.nseindia.com/content/cm/'));
    assert.ok(script.includes('Invoke-WebRequest'));
  });
});
