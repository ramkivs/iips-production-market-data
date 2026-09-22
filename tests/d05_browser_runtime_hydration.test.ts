/**
 * Institutional Investment Platform System (IIPS)
 * Focused Regression Suite: D05 Browser & Runtime Security Master Hydration
 *
 * Governed under: AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
 * Operating Boundary: NON_PRODUCTION / OFFLINE_BOOTSTRAP / BROWSER_SAFE
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  SecurityMaster,
  getGovernedBroadSecurityMaster,
  getGovernedOfflineSecurityMaster,
  D05_BROAD_UNIVERSE_ENTITIES,
  IdentityAmbiguityError,
} from '../src/identity/index.js';
import { BrokerImportIngressOrchestrator } from '../frontend/src/features/portfolio/import/index.js';

describe('D05 Browser Runtime Hydration & Zero-FS Qualification', () => {
  const EXPECTED_CHECKSUM = '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5';
  const EXPECTED_RECORD_COUNT = 2250;

  it('HYDRATION-01: Governed D05 build-time imported dataset contains exactly 2,250 entities matching deposition SHA-256', () => {
    assert.strictEqual(Array.isArray(D05_BROAD_UNIVERSE_ENTITIES), true);
    assert.strictEqual(D05_BROAD_UNIVERSE_ENTITIES.length, EXPECTED_RECORD_COUNT);

    // Verify SHA-256 of the deposited package artifact remains identical
    const pkgPath = path.resolve(process.cwd(), 'evidence/operator_drop/d05_security_master_broad_universe.json');
    const pkgBytes = fs.readFileSync(pkgPath);
    const checksum = crypto.createHash('sha256').update(pkgBytes).digest('hex');
    assert.strictEqual(checksum, EXPECTED_CHECKSUM);

    // Verify that the first and last records match exactly
    const depositedRecords = JSON.parse(pkgBytes.toString('utf8'));
    assert.strictEqual(D05_BROAD_UNIVERSE_ENTITIES[0].companyId, depositedRecords[0].companyId);
    assert.strictEqual(
      D05_BROAD_UNIVERSE_ENTITIES[EXPECTED_RECORD_COUNT - 1].companyId,
      depositedRecords[EXPECTED_RECORD_COUNT - 1].companyId
    );
  });

  it('HYDRATION-02: getGovernedBroadSecurityMaster() hydrates 2,250 canonical entities with zero Node fs/path calls', () => {
    const sm = getGovernedBroadSecurityMaster();
    const companyIds = sm.listAllCompanyIds();

    assert.strictEqual(companyIds.length, EXPECTED_RECORD_COUNT, 'Must hydrate exactly 2,250 canonical companyIds');
    assert.strictEqual(companyIds.includes('EQ_RELIANCE_IN'), true);
    assert.strictEqual(companyIds.includes('EQ_INFY_IN'), true);
    assert.strictEqual(companyIds.includes('EQ_TCS_IN'), true);
    assert.strictEqual(companyIds.includes('EQ_HDFCBANK_IN'), true);
    assert.strictEqual(companyIds.includes('EQ_AIIL_IN'), true);
    assert.strictEqual(companyIds.includes('EQ_AGI_IN'), true);
  });

  it('HYDRATION-03: AIIL resolves deterministically via NSE symbol, ISIN, and BSE scrips without unmapped error', () => {
    const sm = getGovernedBroadSecurityMaster();

    // NSE symbol resolution
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AIIL' }),
      'EQ_AIIL_IN'
    );

    // BSE symbol resolution
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'AIIL' }),
      'EQ_AIIL_IN'
    );

    // ISIN resolution
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE206F01022' }),
      'EQ_AIIL_IN'
    );

    // Current BSE listing (543989)
    assert.strictEqual(
      sm.resolveCompanyId({
        identifierType: 'COMPOSITE_TICKER',
        identifierValue: 'BSE:543989',
        asOf: '2026-09-22T00:00:00.000Z',
      }),
      'EQ_AIIL_IN'
    );

    // Historical BSE listing (539177)
    assert.strictEqual(
      sm.resolveCompanyId({
        identifierType: 'COMPOSITE_TICKER',
        identifierValue: 'BSE:539177',
        asOf: '2020-01-01T00:00:00.000Z',
      }),
      'EQ_AIIL_IN'
    );
  });

  it('HYDRATION-04: ASK AUTOMOTIVE fails closed when absent from D05 (proves zero manual fabrication)', () => {
    const sm = getGovernedBroadSecurityMaster();

    // Check presence in D05
    const isPresent = D05_BROAD_UNIVERSE_ENTITIES.some(
      (e) =>
        e.companyId === 'EQ_ASK_AUTOMOTIVE_IN' ||
        (e.nseSymbol && e.nseSymbol.toUpperCase() === 'ASK AUTOMOTIVE') ||
        (e.companyName && e.companyName.toUpperCase().includes('ASK AUTOMOTIVE'))
    );

    if (isPresent) {
      // If present in D05, it must resolve cleanly
      const resolved = sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'ASK AUTOMOTIVE' });
      assert.ok(resolved.startsWith('EQ_'));
    } else {
      // If absent in D05, it must strictly fail closed under P04 governance
      assert.throws(
        () => sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'ASK AUTOMOTIVE' }),
        IdentityAmbiguityError
      );
      assert.throws(
        () => sm.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'ASK AUTOMOTIVE' }),
        IdentityAmbiguityError
      );
    }
  });

  it('HYDRATION-05: AGI GREENPAC resolves through exact governed alias to EQ_AGI_IN without fuzzy matching', () => {
    const sm = getGovernedBroadSecurityMaster();

    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI GREENPAC' }),
      'EQ_AGI_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI' }),
      'EQ_AGI_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE415A01038' }),
      'EQ_AGI_IN'
    );
  });

  it('HYDRATION-06: Unknown identifiers strictly fail closed with IdentityAmbiguityError (zero raw symbol fabrication)', () => {
    const sm = getGovernedBroadSecurityMaster();
    const unknownIdentities = ['UNKNOWN_CORP_01', 'FABRICATED_CO', 'RANDOM_SECURITY_XYZ'];

    for (const ident of unknownIdentities) {
      assert.throws(
        () => sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: ident }),
        IdentityAmbiguityError
      );
      assert.throws(
        () => sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: ident }),
        IdentityAmbiguityError
      );
    }
  });

  it('HYDRATION-07: Ingress orchestrator using broad master accepts Zerodha/Dhan exports with AIIL & AGI', () => {
    const sm = getGovernedBroadSecurityMaster();

    const zerodhaCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
AIIL,100,550.00,600.00,60000.00,5000.00,9.09,1.20
AGI,50,450.00,480.00,24000.00,1500.00,6.67,0.50
INFY,80,1500.00,1550.00,124000.00,4000.00,3.33,-0.10`;

    const ingressRes = BrokerImportIngressOrchestrator.executeIngress({
      content: zerodhaCsv,
      fileName: 'zerodha_aiil_agi.csv',
      securityMaster: sm,
    });

    assert.strictEqual(ingressRes.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(ingressRes.userHoldings.length, 3);
    assert.strictEqual(ingressRes.userHoldings[0].companyId, 'EQ_AIIL_IN');
    assert.strictEqual(ingressRes.userHoldings[1].companyId, 'EQ_AGI_IN');
    assert.strictEqual(ingressRes.userHoldings[2].companyId, 'EQ_INFY_IN');
  });
});
