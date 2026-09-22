/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-A Test Suite: P04 Security Master & PIT Identity Resolution
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  SecurityMaster,
  IdentityAmbiguityError,
  SecurityMasterEntity,
} from '../src/index.js';

describe('WS-A / P04 Security Master & Identity Resolution', () => {
  const d05Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d05_fixtures.json'), 'utf-8'));

  it('P04-01: should register entities and resolve companyId from ISIN, CIN, NSE, BSE symbols', () => {
    const sm = new SecurityMaster();
    for (const ent of d05Data.validInstruments) {
      sm.registerEntity(ent);
    }

    // Resolve by ISIN
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE009A01021' }),
      'INFY'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE467B01029' }),
      'TCS'
    );

    // Resolve by NSE Symbol
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' }),
      'INFY'
    );

    // Resolve by BSE Scrip Code via Composite Ticker
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:532540' }),
      'TCS'
    );
  });

  it('P04-02: should resolve effective-dated symbol changes correctly at point in time', () => {
    const sm = new SecurityMaster();

    // Historic symbol change scenario: AXISBANK was previously UTIBANK prior to 2007-07-30
    const axisEntity: SecurityMasterEntity = {
      companyId: 'AXISBANK',
      isin: 'INE238A01034',
      companyName: 'Axis Bank Limited',
      industry: 'Banking',
      sector: 'Financial Services',
      effectiveFrom: '2007-07-30T00:00:00.000Z',
      listings: [
        { exchange: 'NSE', symbol: 'AXISBANK', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      ],
    };

    sm.registerEntity(axisEntity);

    // Add historical UTI Bank mapping for pre-2007
    sm.mappingStore.addMapping({
      companyId: 'AXISBANK',
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      effectiveFrom: '1998-01-01T00:00:00.000Z',
      effectiveTo: '2007-07-29T23:59:59.999Z',
    });

    // Query pre-change date (2005) -> UTIBANK resolves to AXISBANK
    const res2005 = sm.resolveCompanyId({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      asOf: '2005-06-15T00:00:00.000Z',
    });
    assert.strictEqual(res2005, 'AXISBANK');

    // Query post-change date (2026) with old symbol -> Fails closed
    assert.throws(
      () => {
        sm.resolveCompanyId({
          identifierType: 'NSE_SYMBOL',
          identifierValue: 'UTIBANK',
          asOf: '2026-09-18T00:00:00.000Z',
        });
      },
      IdentityAmbiguityError
    );
  });

  it('P04-03: should fail closed on unmapped identifiers or ambiguous collisions and record quarantine', () => {
    const sm = new SecurityMaster();
    for (const ent of d05Data.validInstruments) {
      sm.registerEntity(ent);
    }

    // Unmapped ISIN -> Throws IdentityAmbiguityError
    assert.throws(() => {
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE999999999' });
    }, IdentityAmbiguityError);

    const qRecords = sm.mappingStore.getQuarantinedRecords();
    assert.ok(qRecords.length > 0);
    assert.strictEqual(qRecords[qRecords.length - 1].reason, 'UNMAPPED_IDENTIFIER');

    // Ambiguous collision scenario: two different companies mapped to same symbol without date exclusivity
    sm.mappingStore.addMapping({
      companyId: 'COMP_A',
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'COLLISION',
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.mappingStore.addMapping({
      companyId: 'COMP_B',
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'COLLISION',
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });

    assert.throws(() => {
      sm.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: 'COLLISION',
        asOf: '2026-01-01T00:00:00.000Z',
      });
    }, IdentityAmbiguityError);

    const qRecordsAfter = sm.mappingStore.getQuarantinedRecords();
    assert.strictEqual(qRecordsAfter[qRecordsAfter.length - 1].reason, 'AMBIGUOUS_COLLISION');
  });
});
