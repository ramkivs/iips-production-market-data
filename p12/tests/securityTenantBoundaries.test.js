/**
 * P12-06 — Security / Tenant Boundaries tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  enforceTenantScoping,
  assertTenantAuthorized,
  applyClassification,
  checkProviderEntitlement,
  sanitizeForTransport,
  assertNoSecurityCertificationClaimed,
  SecurityViolation,
  SECURITY_LIMITATION,
  GOVERNANCE_CLASSIFICATIONS,
} from '../src/securityTenantBoundaries.js';

describe('P12-06 Security / Tenant Boundaries', () => {
  describe('enforceTenantScoping (ST-1)', () => {
    it('authorizes matching tenant', () => {
      const result = enforceTenantScoping({
        requestingTenantId: 'tenant-A',
        dataTenantId: 'tenant-A',
        endpoint: '/api/screener/execute',
      });
      assert.equal(result.authorized, true);
      assert.equal(result.enforcementLocation, 'server');
    });

    it('denies mismatched tenant', () => {
      const result = enforceTenantScoping({
        requestingTenantId: 'tenant-A',
        dataTenantId: 'tenant-B',
        endpoint: '/api/screener/execute',
      });
      assert.equal(result.authorized, false);
    });

    it('result is frozen', () => {
      const result = enforceTenantScoping({
        requestingTenantId: 'A', dataTenantId: 'A', endpoint: '/api/x',
      });
      assert.ok(Object.isFrozen(result));
    });

    it('rejects empty requestingTenantId', () => {
      assert.throws(
        () => enforceTenantScoping({ requestingTenantId: '', dataTenantId: 'A', endpoint: '/api/x' }),
        SecurityViolation
      );
    });

    it('rejects empty dataTenantId', () => {
      assert.throws(
        () => enforceTenantScoping({ requestingTenantId: 'A', dataTenantId: '', endpoint: '/api/x' }),
        SecurityViolation
      );
    });
  });

  describe('assertTenantAuthorized', () => {
    it('passes for authorized result', () => {
      const result = enforceTenantScoping({
        requestingTenantId: 'A', dataTenantId: 'A', endpoint: '/api/x',
      });
      assert.equal(assertTenantAuthorized(result), true);
    });

    it('fails closed for unauthorized result', () => {
      const result = enforceTenantScoping({
        requestingTenantId: 'A', dataTenantId: 'B', endpoint: '/api/x',
      });
      assert.throws(() => assertTenantAuthorized(result), SecurityViolation);
    });

    it('fails for null result', () => {
      assert.throws(() => assertTenantAuthorized(null), SecurityViolation);
    });
  });

  describe('applyClassification (ST-2)', () => {
    it('applies valid classification', () => {
      const dto = { data: 'test' };
      const classified = applyClassification(dto, 'CONFIDENTIAL');
      assert.equal(classified._governanceClassification, 'CONFIDENTIAL');
      assert.ok(Object.isFrozen(classified));
    });

    it('rejects unknown classification', () => {
      assert.throws(
        () => applyClassification({}, 'TOP_SECRET'),
        SecurityViolation
      );
    });

    it('accepts all valid classifications', () => {
      for (const c of GOVERNANCE_CLASSIFICATIONS) {
        const result = applyClassification({ x: 1 }, c);
        assert.equal(result._governanceClassification, c);
      }
    });
  });

  describe('checkProviderEntitlement (ST-3)', () => {
    const register = {
      LocalFixture: { capabilities: ['market-data', 'fundamentals'] },
      RemoteProvider: { capabilities: ['market-data'] },
    };

    it('entitled when capability matches', () => {
      const result = checkProviderEntitlement({
        providerToken: 'LocalFixture',
        capability: 'market-data',
        entitlementRegister: register,
      });
      assert.equal(result.entitled, true);
      assert.equal(result.enforcementLocation, 'server-behind-data-plane');
    });

    it('not entitled when capability missing', () => {
      const result = checkProviderEntitlement({
        providerToken: 'RemoteProvider',
        capability: 'fundamentals',
        entitlementRegister: register,
      });
      assert.equal(result.entitled, false);
    });

    it('not entitled when provider unknown', () => {
      const result = checkProviderEntitlement({
        providerToken: 'UnknownProvider',
        capability: 'market-data',
        entitlementRegister: register,
      });
      assert.equal(result.entitled, false);
    });

    it('result is frozen', () => {
      const result = checkProviderEntitlement({
        providerToken: 'LocalFixture', capability: 'market-data', entitlementRegister: register,
      });
      assert.ok(Object.isFrozen(result));
    });
  });

  describe('sanitizeForTransport (ST-4)', () => {
    it('redacts sensitive keys', () => {
      const dto = { data: 'safe', apiKey: 'secret123', token: 'abc' };
      const sanitized = sanitizeForTransport(dto);
      assert.equal(sanitized.data, 'safe');
      assert.equal(sanitized.apiKey, '[REDACTED]');
      assert.equal(sanitized.token, '[REDACTED]');
    });

    it('result is frozen', () => {
      const result = sanitizeForTransport({ x: 1 });
      assert.ok(Object.isFrozen(result));
    });

    it('accepts custom sensitive keys', () => {
      const dto = { data: 'safe', mySecret: 'hidden' };
      const sanitized = sanitizeForTransport(dto, ['mySecret']);
      assert.equal(sanitized.mySecret, '[REDACTED]');
    });
  });

  describe('SECURITY_LIMITATION (ST-5/ST-7)', () => {
    it('C12 is BLOCKED', () => assert.equal(SECURITY_LIMITATION.c12Status, 'BLOCKED'));
    it('M5 is NOT_WIRED', () => assert.equal(SECURITY_LIMITATION.m5Status, 'NOT_WIRED'));
    it('security authority is UNKNOWN', () => assert.equal(SECURITY_LIMITATION.securityAuthority, 'UNKNOWN'));
    it('is frozen', () => assert.ok(Object.isFrozen(SECURITY_LIMITATION)));
  });

  describe('assertNoSecurityCertificationClaimed (ST-6)', () => {
    it('returns true (no claim made)', () => {
      assert.equal(assertNoSecurityCertificationClaimed(), true);
    });
  });
});
