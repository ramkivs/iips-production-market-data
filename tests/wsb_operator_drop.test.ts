/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: OPERATOR_DROP Offline Ingestion & Checksum Verification
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { OperatorDropParser, OperatorDropPayload } from '../src/index.js';

describe('WS-B / OPERATOR_DROP Offline Bootstrap Parser', () => {
  const dropFixture = fs.readFileSync(path.resolve('tests/fixtures/operator_drop_fixtures.json'), 'utf-8');
  const records = JSON.parse(dropFixture).dropRecords;
  const serializedContent = JSON.stringify(records);
  const correctChecksum = crypto.createHash('sha256').update(serializedContent).digest('hex');

  it('OPERATOR_DROP-01: should accept valid drop package with matching SHA-256 checksum', () => {
    const parser = new OperatorDropParser();
    const pkg: OperatorDropPayload = {
      manifest: {
        batchId: 'BATCH-20260918-01',
        domain: 'D01_QUOTES',
        fileChecksumSha256: correctChecksum,
        recordCount: records.length,
        droppedAt: '2026-09-18T10:00:00.000Z',
        operatorId: 'operator-governed-01',
      },
      rawContent: serializedContent,
    };

    const res = parser.processDropPackage(pkg);
    assert.strictEqual(res.status, 'ACCEPTED');
    assert.strictEqual(res.checksumVerified, true);
    assert.strictEqual(res.successfulEnvelopes.length, records.length);
    assert.strictEqual(res.quarantinedCount, 0);

    // Verify vendor tier is stamped as OFFLINE_BOOTSTRAP
    assert.strictEqual(res.successfulEnvelopes[0].provenance.vendorTier, 'OFFLINE_BOOTSTRAP');
  });

  it('OPERATOR_DROP-02: should reject drop package on checksum mismatch and fail closed', () => {
    const parser = new OperatorDropParser();
    const pkg: OperatorDropPayload = {
      manifest: {
        batchId: 'BATCH-TAMPERED-01',
        domain: 'D01_QUOTES',
        fileChecksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Invalid/mismatched hash
        recordCount: records.length,
        droppedAt: '2026-09-18T10:00:00.000Z',
        operatorId: 'operator-governed-01',
      },
      rawContent: serializedContent,
    };

    const res = parser.processDropPackage(pkg);
    assert.strictEqual(res.status, 'REJECTED');
    assert.strictEqual(res.checksumVerified, false);
    assert.strictEqual(res.successfulEnvelopes.length, 0);
    assert.ok(res.rejectionReason?.includes('Checksum mismatch'));
  });

  it('OPERATOR_DROP-03: should reject unparseable/corrupted JSON drop file', () => {
    const parser = new OperatorDropParser();
    const corruptedContent = '{ "bad": "json" truncated... ';
    const badChecksum = crypto.createHash('sha256').update(corruptedContent).digest('hex');

    const pkg: OperatorDropPayload = {
      manifest: {
        batchId: 'BATCH-CORRUPT-01',
        domain: 'D01_QUOTES',
        fileChecksumSha256: badChecksum,
        recordCount: 1,
        droppedAt: '2026-09-18T10:00:00.000Z',
        operatorId: 'operator-governed-01',
      },
      rawContent: corruptedContent,
    };

    const res = parser.processDropPackage(pkg);
    assert.strictEqual(res.status, 'REJECTED');
    assert.ok(res.rejectionReason?.includes('JSON parse error'));
  });
});
