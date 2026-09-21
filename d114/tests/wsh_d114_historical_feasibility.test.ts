/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Hardened Historical Feasibility & Evidence Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / OI-HIST-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  CmUdiffParser,
  LegacyBhavcopyParser,
  UnifiedHistoricalAdapter,
  HistoricalFeasibilityRunner,
  HistoricalEvidenceReconciler,
  HistoricalEvidenceHandoff,
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

  // Exact identity/OHLCV collision case observed in governed cm05JUL2024bhav.csv.zip. This
  // regression excerpt is test-only and does not alter the physical archive or bounded corpus.
  const mmfinMultiSeriesLegacyCsv = `SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN
M&MFIN,EQ,299.80,302.10,297.75,300.50,300.70,298.20,3303110,992336000.00,05-JUL-2024,29778,INE774D01024
M&MFIN,N3,2048.00,2048.00,2048.00,2048.00,2048.00,2050.00,91,186368.00,05-JUL-2024,2,INE774D08MG3`;

  // Exact BL/EQ rows observed in governed BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip.
  // This regression excerpt is test-only and does not alter the physical archive or corpus.
  const swanEnergySameIsinUdiffCsv = `TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,XpryDt,FininstrmActlXpryDt,StrkPric,OptnTp,FinInstrmNm,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd1,Rsvd2,Rsvd3,Rsvd4
2024-07-08,2024-07-08,CM,NSE,STK,27098,INE665A01038,SWANENERGY,BL,,,,,SWAN ENERGY LIMITED,666.20,692.60,666.20,668.25,692.60,519.90,,692.60,,,4556633,3045044015.80,6,F1,999999999,,,,,
2024-07-08,2024-07-08,CM,NSE,STK,27095,INE665A01038,SWANENERGY,EQ,,,,,SWAN ENERGY LIMITED,692.60,692.60,692.60,692.60,692.60,659.65,,692.60,,,381237,264044746.20,3011,F1,1,,,,,`;

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

    // Assert definitions of all 6 output artifact paths
    assert.ok(script.includes('historical-acquisition-manifest.json'));
    assert.ok(script.includes('historical-coverage-summary.json'));
    assert.ok(script.includes('failure-unavailable-date-register.json'));
    assert.ok(script.includes('archive-integrity-report.json'));
    assert.ok(script.includes('sha256-manifest.json'));
    assert.ok(script.includes('schema-validation-report.json'));

    // Assert explicit disk serialization logic for all 6 artifacts
    assert.ok(script.includes('Set-Content -Path $ManifestPath'), 'Must serialize manifest');
    assert.ok(script.includes('Set-Content -Path $CoveragePath'), 'Must serialize coverage summary');
    assert.ok(script.includes('Set-Content -Path $FailurePath'), 'Must serialize failure register');
    assert.ok(script.includes('Set-Content -Path $Sha256Path'), 'Must serialize SHA-256 manifest');
    assert.ok(script.includes('Set-Content -Path $IntegrityPath'), 'Must serialize archive integrity report');
    assert.ok(script.includes('Set-Content -Path $SchemaPath'), 'Must serialize schema validation report');

    // Assert core classification and resume handlers
    assert.ok(script.includes('ACQUIRED_VALID'));
    assert.ok(script.includes('HTTP_404'));
    assert.ok(script.includes('$Resume'));
    assert.ok(script.includes('[REUSED]'));
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

  // ──────────────────────────────────────────────────────────────────────────
  // 18. Governed Evidence Handoff: Valid 6-Artifact Intake Validation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-18: accepts complete 6-file valid evidence package from deposit directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-d114-intake-test-'));

    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const validRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });
    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(
      { startDate: '2026-09-14', endDate: '2026-09-20' },
      { '2026-09-15': validRec }
    );
    const pkg = HistoricalFeasibilityRunner.generateEvidencePackage(manifest);

    // Write all 6 files to temp directory
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.MANIFEST_FILE), JSON.stringify(pkg.manifest, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE), JSON.stringify(pkg.coverageSummary, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE), JSON.stringify(pkg.failureRegister, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE), JSON.stringify(pkg.archiveIntegrityReport, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE), JSON.stringify(pkg.sha256Manifest, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE), JSON.stringify(pkg.schemaValidationReport, null, 2));

    const result = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage(tempDir);

    assert.strictEqual(result.status, 'ACCEPTED');
    assert.strictEqual(result.missingArtifacts.length, 0);
    assert.strictEqual(result.artifactsDiscovered.length, 6);
    assert.strictEqual(Object.keys(result.fileChecksumsSha256).length, 6);
    assert.ok(result.evidencePackage);
    assert.strictEqual(result.governanceDisposition.oiHist01Status, 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED');
    assert.strictEqual(result.governanceDisposition.productionEligibility, 'NOT AUTHORIZED');
    assert.strictEqual(result.intakeLineageDigest.length, 64);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 19. Governed Evidence Handoff: Missing Artifact Handling
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-19: rejects incomplete package with missing required artifacts and fails closed', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-d114-intake-missing-'));

    // Write only 3 out of 6 files
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.MANIFEST_FILE), JSON.stringify({ manifestId: 'm1' }));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE), JSON.stringify({ metrics: {} }));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE), JSON.stringify([]));

    const result = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage(tempDir);

    assert.strictEqual(result.status, 'REJECTED');
    assert.strictEqual(result.missingArtifacts.length, 3);
    assert.ok(result.quarantineReason?.includes('Incomplete evidence package'));
    assert.strictEqual(result.evidencePackage, undefined);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 20. Governed Evidence Handoff: Malformed JSON Handling
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-20: rejects malformed JSON artifact and prevents invalid package intake', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-d114-intake-malformed-'));

    // Write 5 valid files, 1 malformed JSON
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.MANIFEST_FILE), '{ "corrupt": "json" truncated...');
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE), JSON.stringify({ metrics: {} }));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE), JSON.stringify([]));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE), JSON.stringify([]));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE), JSON.stringify({}));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE), JSON.stringify([]));

    const result = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage(tempDir);

    assert.strictEqual(result.status, 'REJECTED');
    assert.ok(result.quarantineReason?.includes('Schema or syntax validation failure'));
    assert.strictEqual(result.evidencePackage, undefined);

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 21. Governed Pipeline: Deposit -> Validation -> Reconciliation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-21: executes full transition from deposited package to reconciliation report', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-d114-intake-pipeline-'));

    const zipBuf = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20260915_F_0000.csv', sampleValidUdiffCsv);
    const validRec = HistoricalFeasibilityRunner.evaluateArchive('2026-09-15', { zipBuffer: zipBuf });
    const manifest = HistoricalFeasibilityRunner.buildFeasibilityManifest(
      { startDate: '2026-09-14', endDate: '2026-09-20' },
      { '2026-09-15': validRec }
    );
    const pkg = HistoricalFeasibilityRunner.generateEvidencePackage(manifest);

    // Write all 6 files
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.MANIFEST_FILE), JSON.stringify(pkg.manifest, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.COVERAGE_SUMMARY_FILE), JSON.stringify(pkg.coverageSummary, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.FAILURE_REGISTER_FILE), JSON.stringify(pkg.failureRegister, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.ARCHIVE_INTEGRITY_FILE), JSON.stringify(pkg.archiveIntegrityReport, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SHA256_MANIFEST_FILE), JSON.stringify(pkg.sha256Manifest, null, 2));
    fs.writeFileSync(path.join(tempDir, HistoricalEvidenceHandoff.SCHEMA_VALIDATION_FILE), JSON.stringify(pkg.schemaValidationReport, null, 2));

    const summary = HistoricalEvidenceHandoff.executeGovernedIntakeAndReconciliation(tempDir);

    assert.strictEqual(summary.intakeResult.status, 'ACCEPTED');
    assert.strictEqual(summary.isReconciliationTriggered, true);
    assert.ok(summary.reconciliationReport);
    assert.strictEqual(summary.reconciliationReport.governanceDisposition.oiHist01Status, 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED');
    assert.strictEqual(summary.reconciliationReport.governanceDisposition.productionEligibility, 'NOT AUTHORIZED');

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 22. Legacy URL & Filename Dual-Era Construction
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-22: constructs legacy URLs and filenames for pre-2024 dates and UDiFF for contemporary dates', () => {
    // Representative pre-2024 date
    const legacyRes1 = HistoricalFeasibilityRunner.getArchiveUrl('2023-09-15');
    assert.strictEqual(legacyRes1.filename, 'cm15SEP2023bhav.csv.zip');
    assert.strictEqual(
      legacyRes1.url,
      'https://nsearchives.nseindia.com/content/historical/EQUITIES/2023/SEP/cm15SEP2023bhav.csv.zip'
    );

    // 2016 boundary date
    const legacyRes2 = HistoricalFeasibilityRunner.getArchiveUrl('2016-09-20');
    assert.strictEqual(legacyRes2.filename, 'cm20SEP2016bhav.csv.zip');
    assert.strictEqual(
      legacyRes2.url,
      'https://nsearchives.nseindia.com/content/historical/EQUITIES/2016/SEP/cm20SEP2016bhav.csv.zip'
    );

    // 2024 boundary dates: 2024-07-07 (Legacy) vs 2024-07-08 (UDiFF)
    const cutoffLegacy = HistoricalFeasibilityRunner.getArchiveUrl('2024-07-07');
    assert.strictEqual(cutoffLegacy.filename, 'cm07JUL2024bhav.csv.zip');
    assert.strictEqual(
      cutoffLegacy.url,
      'https://nsearchives.nseindia.com/content/historical/EQUITIES/2024/JUL/cm07JUL2024bhav.csv.zip'
    );

    const cutoffUdiff = HistoricalFeasibilityRunner.getArchiveUrl('2024-07-08');
    assert.strictEqual(cutoffUdiff.filename, 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip');
    assert.strictEqual(
      cutoffUdiff.url,
      'https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip'
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 23. Legacy Archive Evaluation & Schema Conformance
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-23: evaluates valid legacy archive to ACQUIRED_VALID without SCHEMA_MISMATCH, and detects malformed legacy fixture', () => {
    const legacyZip = createSyntheticUdiffZip('cm15SEP2023bhav.csv', sampleValidLegacyCsv);
    const rec = HistoricalFeasibilityRunner.evaluateArchive('2023-09-15', { zipBuffer: legacyZip });

    assert.strictEqual(rec.date, '2023-09-15');
    assert.strictEqual(rec.classification, 'TRADING_DAY');
    assert.strictEqual(rec.status, 'ACQUIRED_VALID');
    assert.strictEqual(rec.zipValidity, true);
    assert.strictEqual(rec.csvValidity, true);
    assert.strictEqual(rec.schemaValidity, true);
    assert.strictEqual(rec.validRecordCount, 2);
    assert.strictEqual(rec.localFilename, 'cm15SEP2023bhav.csv.zip');

    // Malformed legacy fixture (missing critical columns)
    const badLegacyCsv = `SYMBOL,SERIES,OPEN\nHDFCLIFE,EQ,530.00\n`;
    const badLegacyZip = createSyntheticUdiffZip('cm15SEP2023bhav.csv', badLegacyCsv);
    const badRec = HistoricalFeasibilityRunner.evaluateArchive('2023-09-15', { zipBuffer: badLegacyZip });

    assert.strictEqual(badRec.status, 'SCHEMA_MISMATCH');
    assert.strictEqual(badRec.schemaValidity, false);
    assert.ok(badRec.schemaErrors && badRec.schemaErrors.length > 0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 24. Dual-Era PowerShell Runner Generation
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-24: generates dual-era PowerShell runner supporting 2016-2024 legacy scope and 2024-07-08 boundary', () => {
    const script = HistoricalFeasibilityRunner.generateHardenedWindowsPowerShellRunner(
      '2016-09-20',
      '2024-07-07',
      'C:\\IIPS_Data\\NSE_Legacy_Acquisition'
    );

    // Range parameters
    assert.ok(script.includes('$StartDateStr = "2016-09-20"'));
    assert.ok(script.includes('$EndDateStr = "2024-07-07"'));

    // Boundary and dual-era checks
    assert.ok(script.includes('2024-07-08'), 'Must include 2024-07-08 cutoff');
    assert.ok(script.includes('content/historical/EQUITIES'), 'Must include legacy archive URL path');
    assert.ok(script.includes('"cm" + $DayStr + $MonthStr + $YearStr + "bhav.csv.zip"'), 'Must construct cmDDMMMYYYYbhav format');
    assert.ok(script.includes('content/cm/'), 'Must include UDiFF archive URL path');
    assert.ok(script.includes('BhavCopy_NSE_CM_0_0_0_'), 'Must construct UDiFF filename');

    // Dual-era header sets
    assert.ok(script.includes('SYMBOL'), 'Must validate legacy SYMBOL header');
    assert.ok(script.includes('TOTTRDQTY'), 'Must validate legacy TOTTRDQTY header');
    assert.ok(script.includes('TradDt'), 'Must validate UDiFF TradDt header');

    // 6-file evidence emission
    assert.ok(script.includes('historical-acquisition-manifest.json'));
    assert.ok(script.includes('historical-coverage-summary.json'));
    assert.ok(script.includes('failure-unavailable-date-register.json'));
    assert.ok(script.includes('archive-integrity-report.json'));
    assert.ok(script.includes('sha256-manifest.json'));
    assert.ok(script.includes('schema-validation-report.json'));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 25. Legacy Multi-Series Security Identity (D-PIT-WIRE-01 correction)
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-25: preserves M&MFIN EQ/N3 SERIES and ISIN as distinct 05-Jul-2024 identities', () => {
    const parsed = UnifiedHistoricalAdapter.parseAndNormalize(mmfinMultiSeriesLegacyCsv);
    assert.strictEqual(parsed.format, 'LEGACY_BHAVCOPY');
    assert.strictEqual(parsed.isValid, true);
    assert.strictEqual(parsed.totalRecords, 2);

    const eq = parsed.candles.find((c) => c.securityIdentity.series === 'EQ');
    const n3 = parsed.candles.find((c) => c.securityIdentity.series === 'N3');
    assert.ok(eq);
    assert.ok(n3);
    assert.strictEqual(eq.companyId, 'M&MFIN');
    assert.strictEqual(n3.companyId, 'M&MFIN');
    assert.strictEqual(eq.symbol, 'M&MFIN');
    assert.strictEqual(n3.symbol, 'M&MFIN');
    assert.strictEqual(eq.candleStart, '2024-07-05T09:15:00.000Z');
    assert.strictEqual(n3.candleStart, '2024-07-05T09:15:00.000Z');
    assert.deepStrictEqual(eq.securityIdentity, {
      securityId: 'ISIN:INE774D01024:EQ',
      isin: 'INE774D01024',
      isinAuthority: 'NON_AUTHORITATIVE',
      series: 'EQ',
    });
    assert.deepStrictEqual(n3.securityIdentity, {
      securityId: 'ISIN:INE774D08MG3:N3',
      isin: 'INE774D08MG3',
      isinAuthority: 'NON_AUTHORITATIVE',
      series: 'N3',
    });
    assert.notStrictEqual(eq.securityIdentity.securityId, n3.securityIdentity.securityId);

    // D01 and D02 carry the same security-level metadata; symbol/company compatibility remains.
    assert.deepStrictEqual(parsed.quotes[0]?.securityIdentity, eq.securityIdentity);
    assert.deepStrictEqual(parsed.quotes[1]?.securityIdentity, n3.securityIdentity);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 26. CM-UDiFF Same-ISIN Multi-Series Security Identity
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-26: preserves SWANENERGY BL/EQ as distinct 08-Jul-2024 identities despite a shared raw ISIN', () => {
    const parsed = UnifiedHistoricalAdapter.parseAndNormalize(swanEnergySameIsinUdiffCsv);
    assert.strictEqual(parsed.format, 'CM_UDIFF');
    assert.strictEqual(parsed.isValid, true);
    assert.strictEqual(parsed.totalRecords, 2);

    const bl = parsed.candles.find((c) => c.securityIdentity.series === 'BL');
    const eq = parsed.candles.find((c) => c.securityIdentity.series === 'EQ');
    assert.ok(bl);
    assert.ok(eq);
    assert.strictEqual(bl.companyId, 'SWANENERGY');
    assert.strictEqual(eq.companyId, 'SWANENERGY');
    assert.strictEqual(bl.symbol, 'SWANENERGY');
    assert.strictEqual(eq.symbol, 'SWANENERGY');
    assert.strictEqual(bl.candleStart, '2024-07-08T09:15:00.000Z');
    assert.strictEqual(eq.candleStart, '2024-07-08T09:15:00.000Z');
    assert.strictEqual(bl.close, 668.25);
    assert.strictEqual(eq.close, 692.60);
    assert.strictEqual(bl.volume, 4556633);
    assert.strictEqual(eq.volume, 381237);
    assert.deepStrictEqual(bl.securityIdentity, {
      securityId: 'ISIN:INE665A01038:BL',
      isin: 'INE665A01038',
      isinAuthority: 'NON_AUTHORITATIVE',
      series: 'BL',
    });
    assert.deepStrictEqual(eq.securityIdentity, {
      securityId: 'ISIN:INE665A01038:EQ',
      isin: 'INE665A01038',
      isinAuthority: 'NON_AUTHORITATIVE',
      series: 'EQ',
    });
    assert.notStrictEqual(bl.securityIdentity.securityId, eq.securityIdentity.securityId);

    const blQuote = parsed.quotes.find((q) => q.securityIdentity.series === 'BL');
    const eqQuote = parsed.quotes.find((q) => q.securityIdentity.series === 'EQ');
    assert.deepStrictEqual(blQuote?.securityIdentity, bl.securityIdentity);
    assert.deepStrictEqual(eqQuote?.securityIdentity, eq.securityIdentity);
  });
});
