/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: P05 Ingress Pipeline Execution & Dead-Letter Quarantine
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  IngestionPipeline,
  DeadLetterQueue,
  MarketQuotePayload,
} from '../src/index.js';

describe('WS-B / P05 Ingress Pipeline & Dead-Letter Routing', () => {
  const d01Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d01_fixtures.json'), 'utf-8'));

  it('P05-01: should process valid payload through all 4 stages into canonical envelope', () => {
    const dlq = new DeadLetterQueue();
    const pipeline = new IngestionPipeline(dlq);

    const validQuote = d01Data.validQuotes[0];
    const result = pipeline.process<MarketQuotePayload>({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'INFY',
      rawPayload: validQuote,
      asOf: '2026-09-18T10:00:00.000Z',
      receivedAt: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.envelope.companyId, 'INFY');
      assert.strictEqual(result.envelope.domain, 'D01_QUOTES');
      assert.strictEqual(result.envelope.payload.ltp, 1520.35);
      assert.strictEqual(result.envelope.provenance.qualityState, 'GOOD');
    }
    assert.strictEqual(dlq.getCount(), 0);
  });

  it('P05-02: should divert malformed/invalid payload to DeadLetterQueue at Stage 2', () => {
    const dlq = new DeadLetterQueue();
    const pipeline = new IngestionPipeline(dlq);

    const invalidQuote = d01Data.invalidQuotes[0];
    const result = pipeline.process<MarketQuotePayload>({
      domain: 'D01_QUOTES',
      mode: 'SNAPSHOT',
      companyId: 'INFY',
      rawPayload: invalidQuote,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(dlq.getCount(), 1);

    const qRecord = dlq.getAll()[0];
    assert.strictEqual(qRecord.domain, 'D01_QUOTES');
    assert.strictEqual(qRecord.failureStage, 'STAGE_2_STRUCTURAL');
    assert.ok(qRecord.anomalyCodes.length > 0);
  });

  it('P05-03: should divert commercial vendor identity leakage to DeadLetterQueue at Stage 4 (NFR-06)', () => {
    const dlq = new DeadLetterQueue();
    const pipeline = new IngestionPipeline(dlq);

    // Payload containing forbidden vendor string
    const leakyPayload = {
      ...d01Data.validQuotes[0],
      sourceNotes: 'Feed ingested directly from bloomberg gateway terminal',
    };

    const result = pipeline.process({
      domain: 'D01_QUOTES',
      mode: 'LIVE',
      companyId: 'INFY',
      rawPayload: leakyPayload,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(dlq.getCount(), 1);

    const qRecord = dlq.getAll()[0];
    assert.strictEqual(qRecord.failureStage, 'STAGE_4_INVARIANT');
    assert.ok(qRecord.anomalyCodes.includes('UNAUTHORIZED_SOURCE_LEAK'));
  });
});
