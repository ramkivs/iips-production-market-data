/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Hardened Historical Feasibility & Evidence Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as zlib from 'zlib';
import {
  CmUdiffParser,
  LegacyBhavcopyParser,
  UnifiedHistoricalAdapter,
  HistoricalFeasibilityRunner,
  HistoricalEvidenceReconciler,
  DetailedDateAssessment,
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

describe('WS-H / D114: Hardened 10-Year Historical Acquisition Feasibility & Evidence Suite', () => {
  const sampleValidUdiffCsv = `TradDt,BizDt,Sgmt,Src,ISIN,TckrSymb,SctySrs,ClsPric,LastPric,PrvsClsgPric,SttlmPric,OpnPric,HghPric,LwPric,TtlTradgVol
2026-09-15,2026-09-15,CM,NSE,INE795G01014,HDFCLIFE,EQ,516.10,516.10,530.00,516.09,530.00,532.00,515.00,1500000
2026-09-15,2026-09-15,CM,NSE,INE009A01021,INFY,EQ,1850.00,1850.00,1830.00,1850.00,1835.00,1860.00,1830.00,4500000`;

  const sampleValidLegacyCsv = `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN
HDFCLIFE,EQ,530.00,532.00,515.00,516.10,516.10,530.00,1500000,774150000.00,15-SEP-2023,45000,INE795G01014
INFY,EQ,1450.00,1475.00,1440.00,1460.00,1462.00,1445.00,3200000,4672000000.00,15-SEP-2023,85000,INE009A01021`;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Valid Acquisition Record & Extraction
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-01: produces valid ACQUIRED_VALID record from conforming synthetic archive', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });

    assert.strictEqual(rec.date, '2026-09-15');
    assert.strictEqual(rec.classification, 'TRADING_DAY');
    assert.strictEqual(rec.status, 'ACQUIRED_VALID');
    assert.strictEqual(rec.zipValidity, true);
    assert.strictEqual(rec.csvValidity, true);
    assert.strictEqual(rec.schemaValidity, true);
    assert.strictEqual(rec.validRecordCount, 2);
    assert.strictEqual(rec.sha256Hex.length, 64);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. HTTP 404 Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-02: classifies HTTP 404 response accurately without conflating with weekend/holiday', () => {
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { httpStatusCode: 404 });

    assert.strictEqual(rec.date, '2026-09-15');
    assert.strictEqual(rec.classification, 'TRADING_DAY');
    assert.strictEqual(rec.status, 'HTTP_404');
    assert.strictEqual(rec.httpStatusCode, 404);
    assert.ok(rec.failureReason?.includes('404'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Network Failure Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-03: classifies network connection failure accurately', () => {
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', {
      networkError: 'ECONNRESET: connection reset by peer',
    });

    assert.strictEqual(rec.status, 'NETWORK_ERROR');
    assert.ok(rec.failureReason?.includes('ECONNRESET'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Empty Response Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-04: classifies 0-byte downloaded file as EMPTY_RESPONSE', () => {
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: Buffer.alloc(0) });

    assert.strictEqual(rec.status, 'EMPTY_RESPONSE');
    assert.strictEqual(rec.fileSizeBytes, 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Corrupt ZIP Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-05: classifies corrupted ZIP bytes as CORRUPT_ARCHIVE and fails closed', () => {
    const corruptBuf = Buffer.from('NOT_A_VALID_ZIP_ARCHIVE_DATA_HEADER_EXTRA_PADDING_123456');
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: corruptBuf });

    assert.strictEqual(rec.status, 'CORRUPT_ARCHIVE');
    assert.strictEqual(rec.zipValidity, false);
    assert.ok(rec.failureReason?.includes('extraction failed'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Invalid CSV Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-06: classifies empty or unparseable CSV extraction as CSV_INVALID', () => {
    const emptyCsvZip = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', '\n\n');
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: emptyCsvZip });

    assert.strictEqual(rec.status, 'CSV_INVALID');
    assert.strictEqual(rec.csvValidity, false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Schema Mismatch Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-07: classifies missing mandatory UDiFF headers as SCHEMA_MISMATCH', () => {
    const badHeaderCsv = `TradDt,BizDt,Sgmt,ISIN\n2026-09-15,2026-09-15,CM,INE795G01014\n`;
    const badZip = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', badHeaderCsv);
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: badZip });

    assert.strictEqual(rec.status, 'SCHEMA_MISMATCH');
    assert.strictEqual(rec.schemaValidity, false);
    assert.ok(rec.schemaErrors && rec.schemaErrors.length > 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. SHA-256 Generation & Integrity Tracking
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-08: generates valid SHA-256 and detects unexpected hash changes', () => {
    const zipBuf1 = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const rec1 = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf1 });

    const zipBuf2 = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv + '\n2026-09-15,2026-09-15,CM,NSE,INE002A01018,RELIANCE,EQ,2500,2500,2480,2500,2485,2510,2480,1000000');
    const rec2 = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', {
      zipBuffer: zipBuf2,
      priorRecord: rec1,
    });

    assert.strictEqual(rec2.hashChangedFromPrior, true);
    assert.strictEqual(rec2.priorSha256Hex, rec1.sha256Hex);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Manifest Determinism
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-09: generates deterministic manifest with identical lineage hash for identical inputs', () => {
    const config = { startDate: '2026-09-14', endDate: '2026-09-18' };
    const manifest1 = HistoricalFeasibilityRunner.buildFeasibilityManifest(config);
    const manifest2 = HistoricalFeasibilityRunner.buildFeasibilityManifest(config);

    assert.strictEqual(manifest1.manifestIntegrityDigest, manifest2.manifestIntegrityDigest);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Resume Behavior
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-10: preserves existing ACQUIRED_VALID records during resume', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const validRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });

    const existing: Record<string, DetailedDateAssessment> = {
      '2026-09-15': validRec,
    };

    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(
      { startDate: '2026-09-14', endDate: '2026-09-16' },
      existing
    );

    assert.strictEqual(manifest.records['2026-09-15'].status, 'ACQUIRED_VALID');
    assert.strictEqual(manifest.records['2026-09-14'].status, 'PENDING_WINDOWS_EXECUTION');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Weekend Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-11: classifies Saturdays and Sundays as NON_TRADING_WEEKEND', () => {
    const recSat = HistoricalFeasibilityRunner.evaluateArchive('2026-09-19');
    const recSun = HistoricalFeasibilityRunner.evaluateArchive('2026-09-20');

    assert.strictEqual(recSat.status, 'NON_TRADING_WEEKEND');
    assert.strictEqual(recSun.status, 'NON_TRADING_WEEKEND');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Holiday Classification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-12: classifies standard NSE holidays as NON_TRADING_HOLIDAY', () => {
    const recHol = HistoricalFeasibilityRunner.evaluateArchive('2026-01-26');
    assert.strictEqual(recHol.status, 'NON_TRADING_HOLIDAY');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Complete 6-File Evidence Package Generation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-13: generates full 6-file evidence package structure from manifest', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const validRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });
    const notFoundRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-16', { httpStatusCode: 404 });

    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(
      { startDate: '2026-09-14', endDate: '2026-09-20' },
      { '2026-09-15': validRec, '2026-09-16': notFoundRec }
    );

    const pkg = HistoricalFeasibilityRunner.generateEvidencePackage(manifest);

    assert.ok(pkg.manifest);
    assert.ok(pkg.coverageSummary);
    assert.strictEqual(pkg.coverageSummary.metrics.acquiredValidCount, 1);
    assert.strictEqual(pkg.failureRegister.length, 1);
    assert.strictEqual(pkg.failureRegister[0].date, '2026-09-16');
    assert.strictEqual(pkg.failureRegister[0].status, 'HTTP_404');
    assert.ok(pkg.archiveIntegrityReport.length >= 1);
    assert.ok(pkg.sha256Manifest['2026-09-15']);
    assert.ok(pkg.schemaValidationReport.length >= 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Hardened PowerShell Runner Generation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-14: generates hardened PowerShell execution runner with 6-file output and resume support', () => {
    const script = HistoricalFeasibilityRunner.generateHardenedWindowsPowerShellRunner(
      '2016-09-20',
      '2026-09-20',
      'C:\\IIPS_Data\\NSE_CM_UDiFF_10Y'
    );

    assert.ok(script.includes('historical-acquisition-manifest.json'));
    assert.ok(script.includes('historical-coverage-summary.json'));
    assert.ok(script.includes('failure-unavailable-date-register.json'));
    assert.ok(script.includes('archive-integrity-report.json'));
    assert.ok(script.includes('sha256-manifest.json'));
    assert.ok(script.includes('schema-validation-report.json'));
    assert.ok(script.includes('ACQUIRED_VALID'));
    assert.ok(script.includes('HTTP_404'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Legacy Pre-July-2024 Bhavcopy Parsing & Normalization
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-15: parses and validates legacy Pre-July-2024 NSE Bhavcopy format', () => {
    const { headers, records } = LegacyBhavcopyParser.parseCsv(sampleValidLegacyCsv);
    const schema = LegacyBhavcopyParser.validateSchema(headers, records);

    assert.strictEqual(schema.isValid, true);
    assert.strictEqual(schema.totalRows, 2);

    const quote = LegacyBhavcopyParser.toCanonicalQuote(records[0]);
    assert.strictEqual(quote.symbol, 'HDFCLIFE');
    assert.strictEqual(quote.ltp, 516.10);

    const candle = LegacyBhavcopyParser.toCanonicalOHLCV(records[0]);
    assert.strictEqual(candle.symbol, 'HDFCLIFE');
    assert.strictEqual(candle.interval, '1d');
    assert.strictEqual(candle.candleStart, '2023-09-15T09:15:00.000Z');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 16. Unified Historical Adapter Auto-Detection
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-16: auto-detects archive era and unifies normalization into canonical D01/D02', () => {
    const udiffParsed = UnifiedHistoricalAdapter.parseAndNormalize(sampleValidUdiffCsv);
    assert.strictEqual(udiffParsed.format, 'CM_UDIFF');
    assert.strictEqual(udiffParsed.isValid, true);

    const legacyParsed = UnifiedHistoricalAdapter.parseAndNormalize(sampleValidLegacyCsv);
    assert.strictEqual(legacyParsed.format, 'LEGACY_BHAVCOPY');
    assert.strictEqual(legacyParsed.isValid, true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 17. Evidence Reconciliation Engine Evaluation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-17: reconciles complete evidence package and produces cryptographic report', () => {
    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const validRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });
    const notFoundRec = HistoricalFeasibilityRunner.evaluateArchive('2023-09-15', { httpStatusCode: 404 });

    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(
      { startDate: '2023-09-14', endDate: '2026-09-20' },
      { '2026-09-15': validRec, '2023-09-15': notFoundRec }
    );

    const pkg = HistoricalFeasibilityRunner.generateEvidencePackage(manifest);
    const report = HistoricalEvidenceReconciler.reconcileEvidencePackage(pkg);

    assert.ok(report.reconciliationId);
    assert.strictEqual(report.sourceManifestId, manifest.manifestId);
    assert.strictEqual(report.hashAudit.isCryptographicallyConsistent, true);
    assert.strictEqual(report.hashAudit.totalHashesChecked, 1);
    assert.strictEqual(report.hashAudit.mismatchesDetected, 0);
    assert.strictEqual(report.governanceDisposition.oiHist01Status, 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED');
    assert.strictEqual(report.governanceDisposition.productionEligibility, 'NOT AUTHORIZED');
    assert.strictEqual(report.governanceDisposition.programDisposition, 'NON_PRODUCTION_HOLD');
    assert.strictEqual(report.reconciliationLineageDigest.length, 64);
  });
});
