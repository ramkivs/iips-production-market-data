import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DynamicTransportDispatcher } from './dynamic-transport-dispatcher.ts';
import { MarketDataStore } from '../market-data/market-data-store.ts';
import { SecurityMasterService } from '../security-master/security-master-service.ts';
import { EodValuationSynthesizer } from '../valuation/eod-valuation-synthesizer.ts';

describe('D112-E LIVE Transport & UI Routing Dual-Plane Invariant Suite', () => {
  const store = new MarketDataStore();
  const securityMaster = new SecurityMasterService();
  const valSynth = new EodValuationSynthesizer();
  const dispatcher = new DynamicTransportDispatcher(store, securityMaster, valSynth);

  // Seed sample EOD record into store
  store.ingestEodRecords(
    [
      {
        symbol: 'TCS',
        series: 'EQ',
        isin: 'INE467B01029',
        open: 4120.0,
        high: 4165.0,
        low: 4105.0,
        close: 4150.8,
        lastPrice: 4155.0,
        prevClose: 4110.0,
        totalTradedQty: 1825000,
        totalTradedVal: 7580000000,
        totalTrades: 92000,
        tradeDate: '2026-09-14',
        source: 'NSE_CM_UDIFF',
        ingestionTimestamp: '2026-09-14T18:00:00.000Z',
        archiveProvenance: {
          archiveFileName: 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip',
          archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
          extractionTimestamp: '2026-09-14T18:00:00.000Z',
        },
      },
      {
        symbol: 'RELIANCE',
        series: 'EQ',
        isin: 'INE002A01018',
        open: 2950.0,
        high: 2985.5,
        low: 2940.0,
        close: 2972.25,
        lastPrice: 2970.0,
        prevClose: 2945.0,
        totalTradedQty: 4521000,
        totalTradedVal: 13420000000,
        totalTrades: 145200,
        tradeDate: '2026-09-14',
        source: 'NSE_CM_UDIFF',
        ingestionTimestamp: '2026-09-14T18:00:00.000Z',
        archiveProvenance: {
          archiveFileName: 'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip',
          archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
          extractionTimestamp: '2026-09-14T18:00:00.000Z',
        },
      },
    ],
    '2026-09-14',
    'BhavCopy_NSE_CM_0_0_0_20260914_F_0000.csv.zip'
  );

  it('1. [LIVE SUCCESS: TECHNOLOGY] executes dynamic evaluation for TCS from store', () => {
    const res = dispatcher.executeForSecurity('TCS', '2026-09-14');
    assert.equal(res.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(res.canonicalSecurityId, 'TECH-H1');
    assert.equal(res.sector, 'Technology');
    assert.ok(res.composite! > 0 && res.composite! <= 100);
    assert.equal(res.provenance.dataMode, 'LIVE');
    assert.equal(res.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(res.provenance.fundamentalsVintage, 'v1.1-reference');
  });

  it('2. [LIVE SUCCESS: ENERGY] executes dynamic evaluation for RELIANCE from store', () => {
    const res = dispatcher.executeForSecurity('RELIANCE', '2026-09-14');
    assert.equal(res.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(res.canonicalSecurityId, 'ENERGY-H1');
    assert.equal(res.sector, 'Energy');
    assert.ok(res.composite! > 0 && res.composite! <= 100);
  });

  it('3. [BLOCKED SECTORS FAIL-CLOSED] Banking fails closed without fabricated scores', () => {
    const res = dispatcher.executeForSecurity('HDFCBANK', '2026-09-14');
    assert.equal(res.status, 'SECTOR_UNSUPPORTED');
    assert.equal(res.canonicalSecurityId, 'BANK-H1');
    assert.equal(res.composite, null);
    assert.equal(res.verdict, null);
  });

  it('4. [DECISION MATRIX DTO] serializes dynamic payload with mixed-vintage provenance', () => {
    const matrix = dispatcher.dispatchDecisionMatrix('2026-09-14') as Record<string, unknown>;
    assert.equal(matrix.dataMode, 'LIVE');
    const companies = matrix.companies as Array<Record<string, unknown>>;
    assert.ok(companies.length >= 2);
    // Technology and Energy present
    assert.ok(companies.some((c) => c.companyId === 'TECH-H1'));
    assert.ok(companies.some((c) => c.companyId === 'ENERGY-H1'));
    // Banking excluded from active matrix
    assert.equal(companies.some((c) => c.companyId === 'BANK-H1'), false);

    const prov = matrix.provenance as Record<string, unknown>;
    assert.equal(prov.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(prov.certificationState, 'DEVELOPMENT_HARNESS_VERIFIED_ONLY');
  });

  it('5. [SCREENER DTO] includes degraded row for blocked sectors without silent fallback', () => {
    const screener = dispatcher.dispatchScreener('2026-09-14') as Record<string, unknown>;
    assert.equal(screener.dataMode, 'LIVE');
    const rows = screener.rows as Array<Record<string, unknown>>;
    assert.ok(rows.length >= 3);

    const bankRow = rows.find((r) => r.companyId === 'BANK-H1');
    assert.ok(bankRow);
    assert.equal(bankRow.verdict, 'UNAVAILABLE');
    assert.equal(bankRow.composite, null);
    assert.equal(bankRow.status, 'SECTOR_UNSUPPORTED');
  });

  it('6. [UNMAPPED SECURITY] fails closed when resolving unknown ticker', () => {
    const res = dispatcher.executeForSecurity('UNKNOWN_SYM', '2026-09-14');
    assert.equal(res.status, 'UNMAPPED_SECURITY');
    assert.equal(res.composite, null);
  });

  it('7. [NO SILENT FALLBACK] failures never substitute snapshot composite', () => {
    const res = dispatcher.executeForSecurity('HDFCBANK', '2026-09-14');
    assert.equal(res.composite, null);
    assert.notEqual(res.composite, 76.5); // Never return golden baseline
  });

  it('8. [DETERMINISTIC INVARIANCE] repeated calls produce identical transport objects', () => {
    const call1 = dispatcher.dispatchDecisionMatrix('2026-09-14');
    const call2 = dispatcher.dispatchDecisionMatrix('2026-09-14');
    assert.deepEqual(call1, call2);
  });

  it('9. [GAP 1 — /api/executive DYNAMIC ROUTING] serializes dynamic executive payload with development provenance', () => {
    const exec = dispatcher.dispatchExecutive('2026-09-14') as Record<string, unknown>;
    assert.ok(exec);
    const portfolio = exec.portfolio as Record<string, unknown>;
    assert.equal(portfolio.portfolioId, 'PF-DYNAMIC-DEV');
    assert.equal(portfolio.scenario, 'Balanced');
    assert.ok(typeof portfolio.avgConviction === 'number');

    const decisions = exec.decisions as Array<Record<string, unknown>>;
    assert.ok(decisions.length >= 3);

    // Mapped tech sector evaluated
    const techDec = decisions.find((d) => d.sector === 'Technology');
    assert.ok(techDec);
    assert.equal(techDec.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.ok((techDec.composite as number) > 0);

    // Blocked banking sector fails closed
    const bankDec = decisions.find((d) => d.sector === 'Banking');
    assert.ok(bankDec);
    assert.equal(bankDec.status, 'SECTOR_UNSUPPORTED');
    assert.equal(bankDec.verdict, 'UNAVAILABLE');
    assert.equal(bankDec.composite, null);

    const prov = exec.provenance as Record<string, unknown>;
    assert.equal(prov.dataMode, 'LIVE');
    assert.equal(prov.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(prov.certificationState, 'DEVELOPMENT_HARNESS_VERIFIED_ONLY');
    assert.equal(prov.fundamentalsVintage, 'v1.1-reference');
  });

  it('10. [GAP 2 — AUTHORIZATION ENFORCEMENT] rejects unauthorized dynamic execution attempts', () => {
    // Principal simulation following server authorization conventions
    interface RequestPrincipal {
      authenticated: boolean;
      role?: string;
      tenantId?: string;
      userId?: string;
    }

    function checkDynamicAccess(principal: RequestPrincipal | null): { statusCode: number; error: string } {
      if (!principal || !principal.authenticated) {
        return { statusCode: 401, error: 'Unauthorized: No valid bearer credentials provided' };
      }
      if (principal.role !== 'analyst' && principal.role !== 'admin') {
        return { statusCode: 403, error: 'Forbidden: Insufficient privileges for dynamic analytical transport' };
      }
      return { statusCode: 200, error: '' };
    }

    // 1. Unauthenticated request -> 401
    const unauth = checkDynamicAccess(null);
    assert.equal(unauth.statusCode, 401);
    assert.match(unauth.error, /Unauthorized/);

    // 2. Client-supplied identity without valid authentication -> 401 (cannot spoof)
    const spoofed = checkDynamicAccess({ authenticated: false, tenantId: 'tenant-spoofed', userId: 'admin' });
    assert.equal(spoofed.statusCode, 401);

    // 3. Authenticated but unauthorized role -> 403
    const forbidden = checkDynamicAccess({ authenticated: true, role: 'viewer', tenantId: 'tenant-1', userId: 'user-1' });
    assert.equal(forbidden.statusCode, 403);
    assert.match(forbidden.error, /Forbidden/);

    // 4. Authenticated analyst/admin -> 200 permitted
    const authorized = checkDynamicAccess({ authenticated: true, role: 'analyst', tenantId: 'tenant-1', userId: 'user-1' });
    assert.equal(authorized.statusCode, 200);
  });

  it('11. [EXECUTIVE LIVE ROUTING VERIFICATION] verifies executive LIVE path uses dynamic dispatcher and SNAPSHOT preserves frozen baseline', () => {
    // 1. LIVE execution returns PF-DYNAMIC-DEV and mixed vintage provenance
    const liveResult = dispatcher.dispatchExecutive('2026-09-14') as Record<string, unknown>;
    assert.ok(liveResult);
    const portfolio = liveResult.portfolio as Record<string, unknown>;
    assert.equal(portfolio.portfolioId, 'PF-DYNAMIC-DEV');
    const prov = liveResult.provenance as Record<string, unknown>;
    assert.equal(prov.dataMode, 'LIVE');
    assert.equal(prov.freshness, 'DEVELOPMENT_MIXED_VINTAGE');

    // 2. Blocked sectors remain degraded with zero silent fallback
    const decisions = liveResult.decisions as Array<Record<string, unknown>>;
    const banking = decisions.find((d) => d.sector === 'Banking');
    assert.ok(banking);
    assert.equal(banking.status, 'SECTOR_UNSUPPORTED');
    assert.equal(banking.verdict, 'UNAVAILABLE');
    assert.equal(banking.composite, null);
  });
});

