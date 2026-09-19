/**
 * Institutional Investment Platform System (IIPS)
 * Cross-Cutting Security, Governance & Non-Regression Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'path';

import {
  scanDirectoryForSecrets,
  sanitizeProvenanceForConsumer,
  DataProvenanceDTO,
  PointInTimeStore,
  IngestionPipeline,
  DeadLetterQueue,
  SecurityMaster,
  IdentityAmbiguityError,
  rollupQuality,
  createCanonicalEnvelope,
  computeLineageHash,
} from '../src/index.js';

describe('Cross-Cutting Security & Governance Invariants', () => {
  it('SEC-01: Workspace static AST scan must confirm zero plaintext credentials', () => {
    const srcDir = path.resolve('src');
    const testsDir = path.resolve('tests');

    const srcReport = scanDirectoryForSecrets(srcDir);
    assert.strictEqual(srcReport.passed, true, `Secrets detected in src: ${JSON.stringify(srcReport.violations)}`);

    const testsReport = scanDirectoryForSecrets(testsDir);
    assert.strictEqual(testsReport.passed, true, `Secrets detected in tests: ${JSON.stringify(testsReport.violations)}`);
  });

  it('GOV-01: Provider Masking (NFR-06) must sanitize internal vendor details for consumers', () => {
    const provenance: DataProvenanceDTO = {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      vendorTier: 'TIER_1_EXCHANGE',
      asOf: '2026-09-18T10:00:00.000Z',
      receivedAt: '2026-09-18T10:00:00.000Z',
      evaluatedAt: '2026-09-18T10:00:00.000Z',
      dataVersion: 'v1.0.0',
      lineageHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      qualityState: 'GOOD',
      traceId: 'tr-001',
      correlationId: 'corr-001',
      tenantId: 'tenant-inst-1',
    };

    const sanitized = sanitizeProvenanceForConsumer(provenance);
    const jsonStr = JSON.stringify(sanitized).toLowerCase();

    // Verify allowed classifications and absence of vendor strings
    assert.strictEqual(sanitized.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.ok(!jsonStr.includes('bloomberg'));
    assert.ok(!jsonStr.includes('refinitiv'));
    assert.ok(!jsonStr.includes('sftp://'));
  });

  it('GOV-02: Invalid / Quarantined records must NEVER enter canonical PIT storage', () => {
    const dlq = new DeadLetterQueue();
    const pipeline = new IngestionPipeline(dlq);
    const pitStore = new PointInTimeStore();

    // Submit malformed quote
    const malformedQuote = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE',
      currency: 'INR',
      bid: -100, // Invalid negative
      ask: 1500,
      ltp: 1500,
      open: 1500,
      high: 1500,
      low: 1500,
      volume: -50,
      previousClose: 1500,
      change: 0,
      pctChange: 0,
    };

    const result = pipeline.process({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'INFY',
      rawPayload: malformedQuote,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(dlq.getCount(), 1);

    // Attempting to append only if successful
    if (result.success) {
      pitStore.append((result as { envelope: any }).envelope);
    }

    // Verify PIT store remains completely empty
    assert.strictEqual(pitStore.getRecordCount(), 0);
    const queryRes = pitStore.queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-09-18T10:00:00.000Z',
    });
    assert.strictEqual(queryRes, undefined);
  });

  it('GOV-03: Identity ambiguity must fail closed without silent ticker-only guessing', () => {
    const sm = new SecurityMaster();

    // Ambiguous query for non-existent or conflicting ticker
    assert.throws(() => {
      sm.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: 'NONEXISTENT_TICKER',
      });
    }, IdentityAmbiguityError);
  });

  it('GOV-04: Quality floor rollup must guarantee monotonic quality degradation', () => {
    // If one field is UNAVAILABLE, overall quality MUST be UNAVAILABLE
    const compositeQuality = rollupQuality(['GOOD', 'GOOD', 'UNAVAILABLE', 'STALE']);
    assert.strictEqual(compositeQuality, 'UNAVAILABLE');

    // If one field is PARTIAL and rest GOOD, overall quality MUST be PARTIAL
    const partialQuality = rollupQuality(['GOOD', 'GOOD', 'PARTIAL']);
    assert.strictEqual(partialQuality, 'PARTIAL');
  });

  it('GOV-05: Lineage hash must change deterministically if any payload value is altered', () => {
    const payload1 = { ltp: 1500.0, volume: 1000 };
    const payload2 = { ltp: 1500.01, volume: 1000 }; // 1 paisa difference

    const meta = {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf: '2026-09-18T10:00:00.000Z',
      dataVersion: 'v1.0.0',
    };

    const hash1 = computeLineageHash(payload1, meta);
    const hash2 = computeLineageHash(payload2, meta);

    assert.notStrictEqual(hash1, hash2, 'Hash must detect alterations');
    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash2.length, 64);
  });
});
