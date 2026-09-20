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
  HistoricalPitIngestionLoader,
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
  // 25. Dual-Era Full-Horizon Reconciliation & Stage-4 Gate Closure
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-25: reconciles dual-era evidence packages into unified 10-year report and validates Stage-4 gate closure', () => {
    const contHandoff = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage('evidence/d114');
    const legHandoff = HistoricalEvidenceHandoff.validateAndLoadEvidencePackage('evidence/d114-legacy');

    assert.strictEqual(contHandoff.status, 'ACCEPTED');
    assert.strictEqual(legHandoff.status, 'ACCEPTED');
    assert.ok(contHandoff.evidencePackage);
    assert.ok(legHandoff.evidencePackage);

    const dualReport = HistoricalEvidenceReconciler.reconcileDualEraEvidencePackages(
      legHandoff.evidencePackage,
      contHandoff.evidencePackage,
      {
        contemporaryIntakeLineageDigest: contHandoff.intakeLineageDigest,
        contemporaryReconciliationLineageDigest: '221ab1036a6a1cf6a5c4cd71e3315cb936e523fc78fd33dbd8d77859253ae410',
        legacyIntakeLineageDigest: legHandoff.intakeLineageDigest,
        legacyReconciliationLineageDigest: 'c9da2047aedcc64a0e21eff6e3bb3d5beefdac7a56367b7552c849cb5f37906d',
        stage4AuthorityDecisionDigest: '2340667ece5edbeedbfa3199a4b79806433e8074f27b7037a35132df942677ce',
      }
    );

    // Date range
    assert.strictEqual(dualReport.fullDateRange.startDate, '2016-09-20');
    assert.strictEqual(dualReport.fullDateRange.endDate, '2026-09-20');
    assert.strictEqual(dualReport.fullDateRange.totalCalendarDays, 3653);

    // Combined statistics
    assert.strictEqual(dualReport.combinedStatistics.acquiredLegacyDays, 1919);
    assert.strictEqual(dualReport.combinedStatistics.acquiredContemporaryDays, 668);
    assert.strictEqual(dualReport.combinedStatistics.acquiredValidDays, 2587);
    assert.strictEqual(dualReport.combinedStatistics.expectedTradingDays, 2715);
    assert.strictEqual(dualReport.combinedStatistics.coveragePct, 95.29);
    assert.strictEqual(dualReport.combinedStatistics.integrityPct, 100);

    // Gate closure
    assert.strictEqual(dualReport.gateStatus, 'CLOSED');
    assert.strictEqual(dualReport.governanceDisposition.gateD114Stage4LegacyAcquisition, 'CLOSED');

    // Invariants
    assert.strictEqual(dualReport.governanceDisposition.oiHist01Status, 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED');
    assert.strictEqual(dualReport.governanceDisposition.masterGateG004, 'OPEN / PRESERVED');
    assert.strictEqual(dualReport.governanceDisposition.productionHistoricalEligibility, 'NOT AUTHORIZED');

    // Hash audit
    assert.strictEqual(dualReport.hashAudit.isCryptographicallyConsistent, true);
    assert.strictEqual(dualReport.hashAudit.mismatchesDetected, 0);
    assert.strictEqual(dualReport.hashAudit.totalHashesChecked, 2587);
    assert.strictEqual(dualReport.reconciliationLineageDigest.length, 64);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 26. Stage-5 PIT Ingestion: Dual-Era Canonical D01 Quotes & D02 OHLCV
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-26: ingests dual-era archives into canonical PointInTimeStore for D01 and D02', () => {
    const legacyCsv =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'TCS,EQ,3200.00,3250.00,3180.00,3240.00,3238.00,3190.00,1000000,3240000000,15-JUN-2022,25000,INE467B01029\n' +
      'INFY,EQ,1450.00,1475.00,1440.00,1465.00,1463.00,1445.00,2000000,2930000000,15-JUN-2022,40000,INE009A01021';
    const legacyZip = createSyntheticUdiffZip('cm15JUN2022bhav.csv', legacyCsv);

    const udiffCsv =
      'TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd01,Rsvd02,Rsvd03,Rsvd04\n' +
      '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE467B01029,TCS,EQ,4200.00,4280.00,4190.00,4260.00,4255.00,4180.00,0.0,4260.00,0,0,1500000,6390000000,50000,1,1,-,-,-,-,-\n' +
      '2024-08-01,2024-08-01,EQ,NSE,EQUITY,1594,INE009A01021,INFY,EQ,1800.00,1830.00,1790.00,1820.00,1815.00,1795.00,0.0,1820.00,0,0,3000000,5460000000,75000,1,1,-,-,-,-,-';
    const udiffZip = createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv', udiffCsv);

    const loader = new HistoricalPitIngestionLoader();
    const result = loader.ingestBatch([
      { date: '2022-06-15', buffer: legacyZip, filename: 'cm15JUN2022bhav.csv.zip' },
      { date: '2024-08-01', buffer: udiffZip, filename: 'BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip' },
    ]);

    assert.strictEqual(result.totalArchivesProcessed, 2);
    assert.strictEqual(result.successfulIngestions, 2);
    assert.strictEqual(result.quarantinedArchives, 0);
    assert.strictEqual(result.d01QuotesIngested, 4);
    assert.strictEqual(result.d02CandlesIngested, 4);

    const pitD01 = loader.getD01Store();
    const pitD02 = loader.getD02Store();

    // Verify TCS quotes and candles exist in PIT stores
    const tcsQuote2022 = pitD01.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2022-06-15T23:59:59.000Z' });
    assert.ok(tcsQuote2022);
    assert.strictEqual(tcsQuote2022.payload.ltp, 3238);

    const tcsQuote2024 = pitD01.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2024-08-01T23:59:59.000Z' });
    assert.ok(tcsQuote2024);
    assert.strictEqual(tcsQuote2024.payload.ltp, 4260);

    const tcsCandle2022 = pitD02.queryAsOf({ companyId: 'TCS', domain: 'D02_OHLCV', asOf: '2022-06-15T23:59:59.000Z' });
    assert.ok(tcsCandle2022);
    assert.strictEqual(tcsCandle2022.payload.high, 3250);
    assert.strictEqual(tcsCandle2022.payload.low, 3180);
    assert.strictEqual(tcsCandle2022.payload.close, 3240);

    const tcsCandle2024 = pitD02.queryAsOf({ companyId: 'TCS', domain: 'D02_OHLCV', asOf: '2024-08-01T23:59:59.000Z' });
    assert.ok(tcsCandle2024);
    assert.strictEqual(tcsCandle2024.payload.high, 4280);
    assert.strictEqual(tcsCandle2024.payload.low, 4190);
    assert.strictEqual(tcsCandle2024.payload.close, 4260);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 27. Stage-5 PIT Queries: Point-in-Time Point & Range Semantics (No Future Leakage)
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-27: guarantees strict chronological asOf query semantics without future data leakage', () => {
    const loader = new HistoricalPitIngestionLoader();

    const legacyCsv1 =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'TCS,EQ,3000.00,3050.00,2980.00,3020.00,3020.00,2990.00,100000,302000000,10-JAN-2020,1000,INE467B01029';
    const legacyCsv2 =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'TCS,EQ,3100.00,3150.00,3080.00,3120.00,3120.00,3020.00,120000,374400000,15-JAN-2020,1200,INE467B01029';

    loader.ingestSingleArchive('2020-01-10', createSyntheticUdiffZip('cm10JAN2020bhav.csv', legacyCsv1), 'cm10JAN2020bhav.csv.zip');
    loader.ingestSingleArchive('2020-01-15', createSyntheticUdiffZip('cm15JAN2020bhav.csv', legacyCsv2), 'cm15JAN2020bhav.csv.zip');

    const pitD01 = loader.getD01Store();

    // Query before 2020-01-10 -> undefined
    const beforeFirst = pitD01.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2020-01-09T23:59:59.000Z' });
    assert.strictEqual(beforeFirst, undefined);

    // Query on 2020-01-12 (between first and second) -> returns 2020-01-10 data
    const midQuery = pitD01.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2020-01-12T00:00:00.000Z' });
    assert.ok(midQuery);
    assert.strictEqual(midQuery.payload.ltp, 3020);

    // Query on 2020-01-16 -> returns 2020-01-15 data
    const afterSecond = pitD01.queryAsOf({ companyId: 'TCS', domain: 'D01_QUOTES', asOf: '2020-01-16T00:00:00.000Z' });
    assert.ok(afterSecond);
    assert.strictEqual(afterSecond.payload.ltp, 3120);

    // Range query across both dates
    const rangeResult = pitD01.queryRange('TCS', 'D01_QUOTES', '2020-01-01T00:00:00.000Z', '2020-01-20T00:00:00.000Z');
    assert.strictEqual(rangeResult.length, 2);
    assert.strictEqual(rangeResult[0].payload.ltp, 3020);
    assert.strictEqual(rangeResult[1].payload.ltp, 3120);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 28. Stage-5 PIT Ingestion: Idempotency & Deduplication
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-28: guarantees exact idempotency and zero duplicate insertions on repeated ingestion runs', () => {
    const loader = new HistoricalPitIngestionLoader();
    const legacyCsv =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'RELIANCE,EQ,2500.00,2550.00,2480.00,2520.00,2520.00,2490.00,500000,1260000000,20-MAY-2021,15000,INE002A01018';
    const legacyZip = createSyntheticUdiffZip('cm20MAY2021bhav.csv', legacyCsv);

    // First ingestion
    const firstRun = loader.ingestSingleArchive('2021-05-20', legacyZip, 'cm20MAY2021bhav.csv.zip');
    assert.strictEqual(firstRun.success, true);
    assert.strictEqual(firstRun.d01Count, 1);
    assert.strictEqual(firstRun.d02Count, 1);
    assert.strictEqual(loader.getD01Store().getRecordCount(), 1);
    assert.strictEqual(loader.getD02Store().getRecordCount(), 1);

    // Second ingestion with identical archive
    const secondRun = loader.ingestSingleArchive('2021-05-20', legacyZip, 'cm20MAY2021bhav.csv.zip');
    assert.strictEqual(secondRun.success, true);
    assert.strictEqual(secondRun.d01Count, 0); // deduplicated
    assert.strictEqual(secondRun.d02Count, 0); // deduplicated

    // Total records in PIT stores remain 1
    assert.strictEqual(loader.getD01Store().getRecordCount(), 1);
    assert.strictEqual(loader.getD02Store().getRecordCount(), 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 29. Stage-5 PIT Ingestion: Fail-Closed Quarantine Handling
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-29: fails closed on corrupted or unrecognized archive without corrupting PIT stores', () => {
    const loader = new HistoricalPitIngestionLoader();
    const corruptZip = Buffer.from('NOT_A_VALID_ZIP_FILE_DATA_HEX_CORRUPT');

    const result = loader.ingestSingleArchive('2023-01-10', corruptZip, 'cm10JAN2023bhav.csv.zip');
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.strictEqual(loader.getD01Store().getRecordCount(), 0);
    assert.strictEqual(loader.getD02Store().getRecordCount(), 0);

    // Ingest batch with one valid and one corrupt archive
    const validCsv =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'INFY,EQ,1400.00,1420.00,1390.00,1410.00,1410.00,1395.00,300000,423000000,11-JAN-2023,8000,INE009A01021';
    const validZip = createSyntheticUdiffZip('cm11JAN2023bhav.csv', validCsv);

    const batchResult = loader.ingestBatch([
      { date: '2023-01-10', buffer: corruptZip, filename: 'corrupt.zip' },
      { date: '2023-01-11', buffer: validZip, filename: 'cm11JAN2023bhav.csv.zip' },
    ]);

    assert.strictEqual(batchResult.totalArchivesProcessed, 2);
    assert.strictEqual(batchResult.successfulIngestions, 1);
    assert.strictEqual(batchResult.quarantinedArchives, 1);
    assert.strictEqual(loader.getD01Store().getRecordCount(), 1);
    assert.strictEqual(loader.getD02Store().getRecordCount(), 1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 30. Stage-5 Validation Report & Governance Invariant Verification
  // ──────────────────────────────────────────────────────────────────────────
  it('D114-30: generates complete Stage-5 Ingestion Validation Report and verifies all governance invariants', () => {
    const legacyCsv =
      'SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN\n' +
      'TCS,EQ,3200.00,3250.00,3180.00,3240.00,3238.00,3190.00,1000000,3240000000,15-JUN-2022,25000,INE467B01029';
    const udiffCsv =
      'TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd01,Rsvd02,Rsvd03,Rsvd04\n' +
      '2024-08-01,2024-08-01,EQ,NSE,EQUITY,11536,INE467B01029,TCS,EQ,4200.00,4280.00,4190.00,4260.00,4255.00,4180.00,0.0,4260.00,0,0,1500000,6390000000,50000,1,1,-,-,-,-,-\n' +
      '2024-08-01,2024-08-01,EQ,NSE,EQUITY,1594,INE009A01021,INFY,EQ,1800.00,1830.00,1790.00,1820.00,1815.00,1795.00,0.0,1820.00,0,0,3000000,5460000000,75000,1,1,-,-,-,-,-';

    const loader = new HistoricalPitIngestionLoader();
    loader.ingestBatch([
      { date: '2022-06-15', buffer: createSyntheticUdiffZip('cm15JUN2022bhav.csv', legacyCsv), filename: 'cm15JUN2022bhav.csv.zip' },
      { date: '2024-08-01', buffer: createSyntheticUdiffZip('BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv', udiffCsv), filename: 'BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip' },
    ]);

    const report = loader.generateValidationReport({
      corpusTotalValidArchives: 2587,
      corpusLegacyValidArchives: 1919,
      corpusContemporaryValidArchives: 668,
      fullHorizonStartDate: '2016-09-20',
      fullHorizonEndDate: '2026-09-20',
      dualEraReconciliationDigest: '378a7c6daec678a54316a0e192f7fcb0999d1bf6ad07a3a5d6643686687b1552',
    });

    assert.strictEqual(report.manifestHeader.package, 'WS-H / D114 Stage-5');
    assert.strictEqual(report.manifestHeader.stage, 'STAGE_5_PIT_INGESTION');
    assert.strictEqual(report.manifestHeader.status, 'PASSED');
    assert.strictEqual(report.manifestHeader.operatingMode, 'OFFLINE_BOOTSTRAP');

    // Invariant checks
    assert.strictEqual(report.governanceInvariants.oiHist01Status, 'OPEN / EXTERNAL / HISTORICAL ACQUISITION BLOCKED');
    assert.strictEqual(report.governanceInvariants.masterGateG004, 'OPEN / PRESERVED');
    assert.strictEqual(report.governanceInvariants.stage4LegacyGate, 'CLOSED');
    assert.strictEqual(report.governanceInvariants.productionHistoricalEligibility, 'NOT AUTHORIZED');
    assert.strictEqual(report.governanceInvariants.externalProviderCalls, 0);

    // Replay verification
    assert.strictEqual(report.replayVerification.replayDeterministic, true);
    assert.strictEqual(report.replayVerification.zeroFutureDataLeakage, true);
    assert.strictEqual(report.replayVerification.idempotencyVerified, true);
    assert.strictEqual(report.ingestionDigest.length, 64);
  });
});
