import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { SecurityMasterService, SECTOR_DIR_FAMILIES } from './security-master-service.ts';
import type { SecurityMasterRegistry } from './security-master-contract.ts';

describe('D112-A Security Master Verification & Negative Controls', () => {
  const service = new SecurityMasterService();

  it('1. [CANONICAL ID UNIQUENESS] loads registry without canonicalSecurityId collisions', () => {
    const entries = service.getAllEntries();
    const ids = new Set<string>();
    for (const e of entries) {
      assert.equal(ids.has(e.canonicalSecurityId), false, `Duplicate canonical ID: ${e.canonicalSecurityId}`);
      ids.add(e.canonicalSecurityId);
    }
    assert.equal(entries.length >= 3, true);
  });

  it('2. [TICKER UNIQUENESS] ensures each (exchange, tickerSymbol) is strictly unique', () => {
    const entries = service.getAllEntries();
    const tickers = new Set<string>();
    for (const e of entries) {
      const key = `${e.exchange}:${e.tickerSymbol}`;
      assert.equal(tickers.has(key), false, `Duplicate ticker key: ${key}`);
      tickers.add(key);
    }
  });

  it('3. [ISIN UNIQUENESS] ensures each ISIN appears exactly once', () => {
    const entries = service.getAllEntries();
    const isins = new Set<string>();
    for (const e of entries) {
      assert.equal(isins.has(e.isin), false, `Duplicate ISIN: ${e.isin}`);
      isins.add(e.isin);
    }
  });

  it('4. [ISIN FORMAT] validates standard ISO 6166 12-char format with country prefix IN', () => {
    const entries = service.getAllEntries();
    const isinRegex = /^IN[A-Z0-9]{9}[0-9]$/;
    for (const e of entries) {
      assert.equal(isinRegex.test(e.isin), true, `ISIN ${e.isin} violates ISO 6166 format`);
    }
  });

  it('5. [SERIES CONFORMANCE] ensures equity series is strictly in permitted set', () => {
    const entries = service.getAllEntries();
    const permittedSeries = ['EQ', 'BE', 'SM', 'ST'];
    for (const e of entries) {
      assert.equal(permittedSeries.includes(e.series), true, `Series ${e.series} not permitted`);
    }
  });

  it('6. [SECTOR CONFORMANCE] ensures target sector engine conforms to certified SECTOR_DIR', () => {
    const entries = service.getAllEntries();
    for (const e of entries) {
      assert.equal(
        SECTOR_DIR_FAMILIES.includes(e.sector as (typeof SECTOR_DIR_FAMILIES)[number]),
        true,
        `Sector ${e.sector} is not a certified engine family`
      );
    }
  });

  it('7. [BIDIRECTIONAL RESOLUTION] resolves identically via Ticker and ISIN', () => {
    const relianceByTicker = service.resolveByTicker('RELIANCE');
    const relianceByIsin = service.resolveByIsin('INE002A01018');
    assert.ok(relianceByTicker);
    assert.ok(relianceByIsin);
    assert.equal(relianceByTicker.canonicalSecurityId, 'ENERGY-H1');
    assert.equal(relianceByIsin.canonicalSecurityId, 'ENERGY-H1');
    assert.equal(relianceByTicker.companyName, relianceByIsin.companyName);

    const tcsByTicker = service.resolveByTicker('TCS');
    const tcsByIsin = service.resolveByIsin('INE467B01029');
    assert.ok(tcsByTicker);
    assert.ok(tcsByIsin);
    assert.equal(tcsByTicker.canonicalSecurityId, 'TECH-H1');
    assert.equal(tcsByIsin.canonicalSecurityId, 'TECH-H1');

    const hdfcByTicker = service.resolveByTicker('HDFCBANK');
    const hdfcByIsin = service.resolveByIsin('INE040A01034');
    assert.ok(hdfcByTicker);
    assert.ok(hdfcByIsin);
    assert.equal(hdfcByTicker.canonicalSecurityId, 'BANK-H1');
    assert.equal(hdfcByIsin.canonicalSecurityId, 'BANK-H1');
  });

  it('8. [FAIL-CLOSED RESOLUTION] returns null for unmapped, non-evidenced securities', () => {
    // Unmapped candidates fail closed
    assert.equal(service.resolveByTicker('TATAMOTORS'), null);
    assert.equal(service.resolveByTicker('HINDUNILVR'), null);
    assert.equal(service.resolveByTicker('UNKNOWN_TICKER'), null);
    assert.equal(service.resolveByIsin('INE999A01099'), null);
  });

  it('9. [NO FABRICATED IDENTITIES] synthetic fixture provider IDs never resolve to real entities', () => {
    assert.equal(service.resolveByTicker('TE-001'), null);
    assert.equal(service.resolveByTicker('BA-001'), null);
    assert.equal(service.resolveByTicker('EN-001'), null);
    assert.equal(service.resolveByIsin('TE-001'), null);
  });

  it('10. [TEMPORAL & LIFECYCLE BOUNDARIES] enforces effective dates and listing status', () => {
    // TCS effectiveFrom is 2004-08-25
    assert.equal(service.resolveByTicker('TCS', '2000-01-01'), null); // Inactive before IPO/listing
    assert.ok(service.resolveByTicker('TCS', '2026-09-14')); // Active on trade date

    // Test registry with inactive and suspended records
    const customRegistry: SecurityMasterRegistry = {
      schemaVersion: '1.0.0',
      publishedDate: '2026-09-16',
      authoritativeSource: 'Test',
      description: 'Test',
      entries: [
        {
          canonicalSecurityId: 'TEST-ACTIVE',
          tickerSymbol: 'TESTA',
          isin: 'INTEST000001',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Technology',
          companyName: 'Test Active Ltd',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2020-01-01',
          effectiveTo: '2025-12-31',
          mappingVersion: '1.0.0',
          evidenceSource: 'Test',
        },
        {
          canonicalSecurityId: 'TEST-SUSPENDED',
          tickerSymbol: 'TESTS',
          isin: 'INTEST000002',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Energy',
          companyName: 'Test Suspended Ltd',
          listingStatus: 'SUSPENDED',
          effectiveFrom: '2020-01-01',
          mappingVersion: '1.0.0',
          evidenceSource: 'Test',
        },
      ],
    };

    const customService = new SecurityMasterService(customRegistry);

    // Active during window
    assert.ok(customService.resolveByTicker('TESTA', '2024-06-01'));
    // Inactive after effectiveTo
    assert.equal(customService.resolveByTicker('TESTA', '2026-01-01'), null);
    // Suspended fails closed
    assert.equal(customService.resolveByTicker('TESTS', '2024-06-01'), null);
  });

  it('11. [NEGATIVE COLLISION REJECTION] throws error on duplicate canonical IDs or tickers', () => {
    const collisionRegistry: SecurityMasterRegistry = {
      schemaVersion: '1.0.0',
      publishedDate: '2026-09-16',
      authoritativeSource: 'Test',
      description: 'Test',
      entries: [
        {
          canonicalSecurityId: 'DUPLICATE-ID',
          tickerSymbol: 'SYM1',
          isin: 'INTEST000011',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Technology',
          companyName: 'Test 1',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2020-01-01',
          mappingVersion: '1.0.0',
          evidenceSource: 'Test',
        },
        {
          canonicalSecurityId: 'DUPLICATE-ID', // Colliding ID
          tickerSymbol: 'SYM2',
          isin: 'INTEST000012',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Technology',
          companyName: 'Test 2',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2020-01-01',
          mappingVersion: '1.0.0',
          evidenceSource: 'Test',
        },
      ],
    };

    assert.throws(
      () => new SecurityMasterService(collisionRegistry),
      /SECURITY_MASTER_COLLISION_ERROR: Duplicate canonicalSecurityId DUPLICATE-ID/
    );
  });
});
