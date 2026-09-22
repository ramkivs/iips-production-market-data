/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-A Test Suite: P03 SecretRef Architecture & Security Scanner
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'path';

import {
  validateSecretRef,
  createMockSecretRef,
  scanTextForSecrets,
  scanDirectoryForSecrets,
} from '../src/index.js';

describe('WS-A / P03 SecretRef Architecture & Security Scanner', () => {
  it('P03-01: should validate well-formed SecretRefs and reject direct credentials', () => {
    const validRef = createMockSecretRef('nse-market-data-key');
    const res = validateSecretRef(validRef);
    assert.strictEqual(res.isValid, true);

    const invalidRef1 = {
      secretId: 'sec-1',
      vaultProvider: 'INVALID_VAULT',
      keyPath: 'http://api.vendor.com/key',
      version: 'v1',
      status: 'ACTIVE',
    };
    assert.strictEqual(validateSecretRef(invalidRef1).isValid, false);

    const invalidRef2 = {
      secretId: 'sec-2',
      vaultProvider: 'LOCAL_MOCK_VAULT',
      keyPath: 'plaintext_password_123',
      version: 'v1',
      status: 'ACTIVE',
    };
    assert.strictEqual(validateSecretRef(invalidRef2).isValid, false);
  });

  it('P03-02: static scanner should detect hardcoded AWS keys, private keys, and passwords', () => {
    const safeContent = [
      'const config = {',
      '  secretRef: "vault://market-data/mock/key",',
      '  timeoutMs: 5000',
      '};',
    ].join('\n');
    assert.strictEqual(scanTextForSecrets(safeContent).length, 0);

    // Dynamically construct simulated patterns for testing scanner
    const fakeAwsPrefix = 'AKIA';
    const fakeAwsSuffix = 'IOSFODNN7EXAMPLE';
    const leakyContentAWS = 'const accessKey = "' + fakeAwsPrefix + fakeAwsSuffix + '";';
    const violationsAWS = scanTextForSecrets(leakyContentAWS);
    assert.ok(violationsAWS.length > 0);
    assert.strictEqual(violationsAWS[0].patternName, 'AWS_ACCESS_KEY');

    const fakeKeyHeader = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
    const leakyContentKey = 'const key = "' + fakeKeyHeader + '...";';
    const violationsKey = scanTextForSecrets(leakyContentKey);
    assert.ok(violationsKey.length > 0);
    assert.strictEqual(violationsKey[0].patternName, 'PRIVATE_KEY_PEM');
  });

  it('P03-03: static scanner should verify entire workspace source directory is free of plaintext secrets', () => {
    const srcDir = path.resolve('src');
    const report = scanDirectoryForSecrets(srcDir);
    assert.strictEqual(report.passed, true, `Expected zero secret violations in src, found: ${JSON.stringify(report.violations)}`);
    assert.ok(report.scannedFiles >= 15, `Expected at least 15 files scanned, got ${report.scannedFiles}`);
  });
});
