/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-A Test Suite: P01 Canonical Contracts & Schema Validation
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  createCanonicalEnvelope,
  validateEnvelopeStructure,
  validateMarketQuotePayload,
  validateOHLCVCandle,
  validateFundamentalStatement,
  validateCorporateAction,
  validateInstrumentMaster,
  validateNewsEvent,
  validateAnalystEstimate,
  validateMacroData,
  validateAlternativeData,
  computeLineageHash,
  DataProvenanceDTO,
} from '../src/index.js';

describe('WS-A / P01 Canonical Contracts & Schema Validation', () => {
  const d01Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d01_fixtures.json'), 'utf-8'));
  const d02Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d02_fixtures.json'), 'utf-8'));
  const d03Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d03_fixtures.json'), 'utf-8'));
  const d04Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d04_fixtures.json'), 'utf-8'));
  const d05Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d05_fixtures.json'), 'utf-8'));
  const d06Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d06_fixtures.json'), 'utf-8'));
  const d07Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d07_fixtures.json'), 'utf-8'));
  const d08Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d08_fixtures.json'), 'utf-8'));
  const d09Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d09_fixtures.json'), 'utf-8'));

  it('P01-D01: should validate valid market quotes and reject invalid quotes', () => {
    for (const q of d01Data.validQuotes) {
      const res = validateMarketQuotePayload(q);
      assert.strictEqual(res.isValid, true, `Expected valid quote for ${q.symbol}`);
      assert.strictEqual(res.quality, 'GOOD');
    }

    for (const q of d01Data.invalidQuotes) {
      const res = validateMarketQuotePayload(q);
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.quality, 'UNAVAILABLE');
      assert.ok(res.errors.length > 0);
    }
  });

  it('P01-D02: should validate OHLCV candle invariants (High >= max(O,C,L) and start < end)', () => {
    for (const c of d02Data.validCandles) {
      const res = validateOHLCVCandle(c);
      assert.strictEqual(res.isValid, true);
    }
    for (const c of d02Data.invalidCandles) {
      const res = validateOHLCVCandle(c);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.anomalyCodes.includes('STRUCTURAL_MALFORMATION') || res.anomalyCodes.includes('CONTRADICTORY_CROSS_FIELD'));
    }
  });

  it('P01-D03: should validate fundamental financial statements and balance sheet identity', () => {
    for (const f of d03Data.validFundamentals) {
      const res = validateFundamentalStatement(f);
      assert.strictEqual(res.isValid, true);
    }
    for (const f of d03Data.invalidFundamentals) {
      const res = validateFundamentalStatement(f);
      assert.strictEqual(res.isValid, false);
    }
  });

  it('P01-D04: should validate corporate action adjustment factors and split ratios', () => {
    for (const ca of d04Data.validCorporateActions) {
      const res = validateCorporateAction(ca);
      assert.strictEqual(res.isValid, true);
    }
    for (const ca of d04Data.invalidCorporateActions) {
      const res = validateCorporateAction(ca);
      assert.strictEqual(res.isValid, false);
    }
  });

  it('P01-D05: should validate instrument master payload and standard ISIN format', () => {
    for (const inst of d05Data.validInstruments) {
      const res = validateInstrumentMaster(inst);
      assert.strictEqual(res.isValid, true);
    }
    for (const inst of d05Data.invalidInstruments) {
      const res = validateInstrumentMaster(inst);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.anomalyCodes.includes('STRUCTURAL_MALFORMATION'));
    }
  });

  it('P01-D06..D09: should validate news, analyst estimates, macro and alternative data', () => {
    for (const n of d06Data.validNews) assert.strictEqual(validateNewsEvent(n).isValid, true);
    for (const n of d06Data.invalidNews) assert.strictEqual(validateNewsEvent(n).isValid, false);

    for (const e of d07Data.validEstimates) assert.strictEqual(validateAnalystEstimate(e).isValid, true);
    for (const e of d07Data.invalidEstimates) assert.strictEqual(validateAnalystEstimate(e).isValid, false);

    for (const m of d08Data.validMacro) assert.strictEqual(validateMacroData(m).isValid, true);
    for (const m of d08Data.invalidMacro) assert.strictEqual(validateMacroData(m).isValid, false);

    for (const a of d09Data.validAltData) assert.strictEqual(validateAlternativeData(a).isValid, true);
    for (const a of d09Data.invalidAltData) assert.strictEqual(validateAlternativeData(a).isValid, false);
  });

  it('P01-Envelope: should construct, hash, and round-trip canonical envelopes', () => {
    const payload = d01Data.validQuotes[0];
    const asOf = '2026-09-18T10:00:00.000Z';
    const dataVersion = 'v1.0.0';
    const lineageHash = computeLineageHash(payload, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf,
      dataVersion,
    });

    const provenance: DataProvenanceDTO = {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      vendorTier: 'MOCK_FIXTURE',
      asOf,
      receivedAt: asOf,
      evaluatedAt: asOf,
      dataVersion,
      lineageHash,
      qualityState: 'GOOD',
      correlationId: 'corr-test-01',
      tenantId: 'tenant-default',
    };

    const envelope = createCanonicalEnvelope({
      envelopeId: 'env-test-001',
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: payload.companyId,
      payload,
      provenance,
    });

    const validation = validateEnvelopeStructure(envelope);
    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(envelope.companyId, 'INFY');
    assert.strictEqual(envelope.provenance.lineageHash.length, 64); // Valid SHA-256 hex length
  });
});
