/**
 * Institutional Investment Platform System (IIPS)
 * Workstream A - Dhan Broker Holdings Import: identity resolution, P04 quarantine and
 * refusal-evidence completeness (BI-03 / BI-05 / P04 / P12).
 *
 * FIXTURE PROVENANCE
 *   The 68 rows are the operator-observed `DHAN_WEB_UI_SUMMARY_V1` holdings surface of
 *   2026-11-05T07:50:49.090Z (68 native rows, 0 resolved, 0 saved, content digest
 *   `468441dfd0264fddc1e8a7160ebc7c3e5239fa97d13c7545743d1500eb6264b1`). The running system never
 *   retained the original CSV bytes, so this file reconstructs the surface from the supplied row
 *   evidence: every NAME is verbatim, and each row's three numeric fields are the de-concatenated
 *   reading of that row's digit string. Each row's raw digit string and its alternative readings
 *   are retained in `evidence/integration/ws-a-dhan-68-row/rows.json`, so no source evidence is
 *   discarded. The reconstructed digest is therefore NOT the observed digest and is never
 *   asserted to be. ISIN and Exchange were blank in the observed surface and are asserted to
 *   remain absent.
 *
 * WHAT THIS SUITE PROVES
 *   1. All 68 rows parse without loss or duplication.
 *   2. Names, quantities, average prices and current prices are preserved exactly.
 *   3. Missing ISIN / exchange values stay explicitly missing (never invented).
 *   4. Parsing does not imply validation, authorization or saving.
 *   5. Every row receives an independent identity assessment: identifier class, the ordered
 *      lookups actually performed, each outcome, the quarantine records and the missing evidence.
 *   6. The observed P04 refusal for 'AGI GREENPAC' is reproduced verbatim when the mapping is
 *      genuinely absent, and P04 still refuses the whole import.
 *   7. Only rows with authoritative mapping evidence resolve (governed alias AGI GREENPAC ->
 *      EQ_AGI_IN, plus GHCL and KROSS — NSE CM EQ listings carried natively by the authenticated
 *      universe); the other 65 remain unresolved with the precise reason.
 *   8. The digest is deterministic and content-sensitive.
 *   9. Exchange-scoped identifiers are never resolved through the other exchange.
 *  10. No master supplied is NOT_EVALUATED, never a resolved identity claim.
 *  11. The durable leg refuses an unresolved import with zero store effect.
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01 / BI-05-AUTH-2026-01 /
 * P04-P12-IDENTITY-GOVERNANCE / AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001
 * (runtime resolution under the one-time replacement; AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
 *  pinned separately by the rollback drill).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { BrokerImportIngressOrchestrator } from '../frontend/src/features/portfolio/import/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import { assessBrokerRowIdentity } from '../frontend/src/features/portfolio/import/broker-identity-assessment.js';
import {
  evaluateBrokerImportIdentityGate,
  persistBrokerImport,
  type BrokerImportHolding,
  type BrokerImportWriter,
} from '../src/persistence/brokerImportPersistence.js';
import type { OwnerRef } from '../src/persistence/portfolio_store.js';

const AS_OF = '2026-11-05T07:50:49.090Z';
const OBSERVED_DIGEST = '468441dfd0264fddc1e8a7160ebc7c3e5239fa97d13c7545743d1500eb6264b1';

/** The 68-row Dhan Web UI summary surface (see FIXTURE PROVENANCE above). */
const DHAN_68_CSV = `Name,Quantity,Avg Price,Last Traded,Investment,Current Value,P&L,P&L %
AGI GREENPAC,25,89.65,631.65,2241.25,15791.25,13550.00,604.57
ASK AUTOMOTIVE,7,431.29,592.95,3019.03,4150.65,1131.62,37.48
AJAX ENGINEERING,10,467.05,550.10,4670.50,5501.00,830.50,17.78
ARIHANT CAPITAL MARKETS,50,67.92,86.23,3396.00,4311.50,915.50,26.96
ARKADE DEVELOPERS,30,115.71,106.21,3471.30,3186.30,-285.00,-8.21
ARROW GREENTECH,12,388.02,715.00,4656.24,8580.00,3923.76,84.27
ASHOKA BUILDCON,100,126.08,100.45,12608.00,10045.00,-2563.00,-20.33
BANK OF BARODA,100,259.03,243.30,25903.00,24330.00,-1573.00,-6.07
BHARAT COKING COAL,300,36.45,30.35,10935.00,9105.00,-1830.00,-16.74
BLUE JET HEALTHCARE,15,411.83,496.40,6177.45,7446.00,1268.55,20.54
CANARA ROBECO ASSET MANAGEMENT COMPANY,55,252.83,217.36,13905.65,11954.80,-1950.85,-14.03
CREDO BRANDS MARKETING (MUFTI),30,96.83,75.96,2904.90,2278.80,-626.10,-21.55
DAM CAPITAL ADVISORS,150,149.30,133.43,22395.00,20014.50,-2380.50,-10.63
ECOS MOBILITY & HOSPITALITY,100,126.42,111.07,12642.00,11107.00,-1535.00,-12.14
EMS,15,312.52,289.15,4687.80,4337.25,-350.55,-7.48
EPACK PREFAB TECHNOLOGIES,10,192.75,201.51,1927.50,2015.10,87.60,4.54
ELECON ENGINEERING COMPANY,22,426.02,427.95,9372.44,9414.90,42.46,0.45
EMAMI,25,404.23,382.00,10105.75,9550.00,-555.75,-5.50
ENGINEERS INDIA,10,168.00,289.25,1680.00,2892.50,1212.50,72.17
FINEOTEX CHEMICAL,100,22.03,49.15,2203.00,4915.00,2712.00,123.10
GHCL,27,450.31,403.00,12158.37,10881.00,-1277.37,-10.51
GMR POWER & URBAN INFRA,110,98.97,91.77,10886.70,10094.70,-792.00,-7.27
GATEWAY DISTRIPARKS,90,56.04,46.39,5043.60,4175.10,-868.50,-17.22
GEEKAY WIRES,160,22.93,26.91,3668.80,4305.60,636.80,17.36
GENUS POWER INFRASTRUCTURES,10,305.00,270.90,3050.00,2709.00,-341.00,-11.18
GRAUER & WEIL,50,67.79,74.16,3389.50,3708.00,318.50,9.40
GUJARAT PIPAVAV PORT,160,150.65,163.33,24104.00,26132.80,2028.80,8.42
HIMADRI SPECIALITY CHEMICAL,15,443.17,529.00,6647.55,7935.00,1287.45,19.37
IDFC FIRST BANK,50,64.33,73.20,3216.50,3660.00,443.50,13.79
IIFL CAPITAL SERVICES,15,314.40,347.95,4716.00,5219.25,503.25,10.67
INDRAPRASTHA MEDICAL CORPORATION,40,368.99,318.40,14759.60,12736.00,-2023.60,-13.71
INTERNATIONAL CONVEYORS,100,78.07,75.17,7807.00,7517.00,-290.00,-3.71
INTERNATIONAL GEMOLOGICAL INSTITUTE,15,314.67,407.85,4720.05,6117.75,1397.70,29.61
J KUMAR INFRAPROJECTS,20,448.50,405.85,8970.00,8117.00,-853.00,-9.51
JAI BALAJI INDUSTRIES,110,67.84,69.70,7462.40,7667.00,204.60,2.74
JAMNA AUTO INDUSTRIES,33,111.61,122.98,3683.13,4058.34,375.21,10.19
JIO PLATFORMS,12,1119.00,1437.40,13428.00,17248.80,3820.80,28.45
KM SUGAR MILLS,14,227.33,32.23,3182.62,451.22,-2731.40,-85.82
KP ENERGY,40,325.12,159.38,13004.80,6375.20,-6629.60,-50.98
KROSS,5,161.00,272.20,805.00,1361.00,556.00,69.07
LANDMARK CARS,20,386.15,456.05,7723.00,9121.00,1398.00,18.10
MATRIMONY.COM,20,403.08,550.00,8061.60,11000.00,2938.40,36.45
MONARCH NETWORTH CAPITAL,10,272.50,345.70,2725.00,3457.00,732.00,26.86
NATIONAL STOCK EXCHANGE OF INDIA,8,1785.00,1803.80,14280.00,14430.40,150.40,1.05
OSWAL PUMPS,35,373.99,209.54,13089.65,7333.90,-5755.75,-43.97
PANAMA PETROCHEM,10,295.00,465.85,2950.00,4658.50,1708.50,57.92
PARADEEP PHOSPHATES,20,109.00,133.85,2180.00,2677.00,497.00,22.80
PRECISION WIRES INDIA,5,214.00,403.60,1070.00,2018.00,948.00,88.60
PREMIER POLYFILM,10,50.60,90.91,506.00,909.10,403.10,79.66
PUDUMJEE PAPER PRODUCTS,50,82.99,87.28,4149.50,4364.00,214.50,5.17
RADHIKA JEWELTECH,100,56.90,61.87,5690.00,6187.00,497.00,8.73
RAJOO ENGINEERS,200,52.60,55.48,10520.00,11096.00,576.00,5.48
RATEGAIN TRAVEL,10,522.50,820.25,5225.00,8202.50,2977.50,56.99
SALASAR TECHNO ENGINEERING,33,67.11,4.10,2214.63,135.30,-2079.33,-93.89
SHAKTI PUMPS,7,483.79,357.00,3386.53,2499.00,-887.53,-26.21
SHARDA MOTOR,10,822.60,856.40,8226.00,8564.00,338.00,4.11
SIGMA SOLVE,70,46.94,43.03,3285.80,3012.10,-273.70,-8.33
SIYARAM SILK MILLS,10,526.40,473.40,5264.00,4734.00,-530.00,-10.07
STEELCAST,10,183.50,369.15,1835.00,3691.50,1856.50,101.17
SUZLON ENERGY,70,43.54,35.75,3047.80,2502.50,-545.30,-17.89
THYROCARE TECHNOLOGIES,13,440.89,482.90,5731.57,6277.70,546.13,9.53
TITAGARH RAIL SYSTEMS,4,741.88,683.75,2967.52,2735.00,-232.52,-7.84
UNIVASTU,20,76.80,129.14,1536.00,2582.80,1046.80,68.15
VARDHMAN SPECIAL STEELS,15,274.30,350.05,4114.50,5250.75,1136.25,27.62
VISHAL MEGA MART,100,110.30,90.70,11030.00,9070.00,-1960.00,-17.77
VISHNU CHEMICALS,15,504.13,519.05,7561.95,7785.75,223.80,2.96
WAAREE RENEWABLE TECHNOLOGIES,20,951.40,697.50,19028.00,13950.00,-5078.00,-26.69
WEBSOL ENERGY SYSTEM,100,107.09,67.15,10709.00,6715.00,-3994.00,-37.30
`;

/** Expected native values, row order preserved: [rowIndex, name, quantity, avgPrice, lastTraded]. */
const EXPECTED_ROWS: ReadonlyArray<readonly [number, string, number, string, string]> = [
[1, "AGI GREENPAC", 25, "89.65", "631.65"],
  [2, "ASK AUTOMOTIVE", 7, "431.29", "592.95"],
  [3, "AJAX ENGINEERING", 10, "467.05", "550.10"],
  [4, "ARIHANT CAPITAL MARKETS", 50, "67.92", "86.23"],
  [5, "ARKADE DEVELOPERS", 30, "115.71", "106.21"],
  [6, "ARROW GREENTECH", 12, "388.02", "715.00"],
  [7, "ASHOKA BUILDCON", 100, "126.08", "100.45"],
  [8, "BANK OF BARODA", 100, "259.03", "243.30"],
  [9, "BHARAT COKING COAL", 300, "36.45", "30.35"],
  [10, "BLUE JET HEALTHCARE", 15, "411.83", "496.40"],
  [11, "CANARA ROBECO ASSET MANAGEMENT COMPANY", 55, "252.83", "217.36"],
  [12, "CREDO BRANDS MARKETING (MUFTI)", 30, "96.83", "75.96"],
  [13, "DAM CAPITAL ADVISORS", 150, "149.30", "133.43"],
  [14, "ECOS MOBILITY & HOSPITALITY", 100, "126.42", "111.07"],
  [15, "EMS", 15, "312.52", "289.15"],
  [16, "EPACK PREFAB TECHNOLOGIES", 10, "192.75", "201.51"],
  [17, "ELECON ENGINEERING COMPANY", 22, "426.02", "427.95"],
  [18, "EMAMI", 25, "404.23", "382.00"],
  [19, "ENGINEERS INDIA", 10, "168.00", "289.25"],
  [20, "FINEOTEX CHEMICAL", 100, "22.03", "49.15"],
  [21, "GHCL", 27, "450.31", "403.00"],
  [22, "GMR POWER & URBAN INFRA", 110, "98.97", "91.77"],
  [23, "GATEWAY DISTRIPARKS", 90, "56.04", "46.39"],
  [24, "GEEKAY WIRES", 160, "22.93", "26.91"],
  [25, "GENUS POWER INFRASTRUCTURES", 10, "305.00", "270.90"],
  [26, "GRAUER & WEIL", 50, "67.79", "74.16"],
  [27, "GUJARAT PIPAVAV PORT", 160, "150.65", "163.33"],
  [28, "HIMADRI SPECIALITY CHEMICAL", 15, "443.17", "529.00"],
  [29, "IDFC FIRST BANK", 50, "64.33", "73.20"],
  [30, "IIFL CAPITAL SERVICES", 15, "314.40", "347.95"],
  [31, "INDRAPRASTHA MEDICAL CORPORATION", 40, "368.99", "318.40"],
  [32, "INTERNATIONAL CONVEYORS", 100, "78.07", "75.17"],
  [33, "INTERNATIONAL GEMOLOGICAL INSTITUTE", 15, "314.67", "407.85"],
  [34, "J KUMAR INFRAPROJECTS", 20, "448.50", "405.85"],
  [35, "JAI BALAJI INDUSTRIES", 110, "67.84", "69.70"],
  [36, "JAMNA AUTO INDUSTRIES", 33, "111.61", "122.98"],
  [37, "JIO PLATFORMS", 12, "1119.00", "1437.40"],
  [38, "KM SUGAR MILLS", 14, "227.33", "32.23"],
  [39, "KP ENERGY", 40, "325.12", "159.38"],
  [40, "KROSS", 5, "161.00", "272.20"],
  [41, "LANDMARK CARS", 20, "386.15", "456.05"],
  [42, "MATRIMONY.COM", 20, "403.08", "550.00"],
  [43, "MONARCH NETWORTH CAPITAL", 10, "272.50", "345.70"],
  [44, "NATIONAL STOCK EXCHANGE OF INDIA", 8, "1785.00", "1803.80"],
  [45, "OSWAL PUMPS", 35, "373.99", "209.54"],
  [46, "PANAMA PETROCHEM", 10, "295.00", "465.85"],
  [47, "PARADEEP PHOSPHATES", 20, "109.00", "133.85"],
  [48, "PRECISION WIRES INDIA", 5, "214.00", "403.60"],
  [49, "PREMIER POLYFILM", 10, "50.60", "90.91"],
  [50, "PUDUMJEE PAPER PRODUCTS", 50, "82.99", "87.28"],
  [51, "RADHIKA JEWELTECH", 100, "56.90", "61.87"],
  [52, "RAJOO ENGINEERS", 200, "52.60", "55.48"],
  [53, "RATEGAIN TRAVEL", 10, "522.50", "820.25"],
  [54, "SALASAR TECHNO ENGINEERING", 33, "67.11", "4.10"],
  [55, "SHAKTI PUMPS", 7, "483.79", "357.00"],
  [56, "SHARDA MOTOR", 10, "822.60", "856.40"],
  [57, "SIGMA SOLVE", 70, "46.94", "43.03"],
  [58, "SIYARAM SILK MILLS", 10, "526.40", "473.40"],
  [59, "STEELCAST", 10, "183.50", "369.15"],
  [60, "SUZLON ENERGY", 70, "43.54", "35.75"],
  [61, "THYROCARE TECHNOLOGIES", 13, "440.89", "482.90"],
  [62, "TITAGARH RAIL SYSTEMS", 4, "741.88", "683.75"],
  [63, "UNIVASTU", 20, "76.80", "129.14"],
  [64, "VARDHMAN SPECIAL STEELS", 15, "274.30", "350.05"],
  [65, "VISHAL MEGA MART", 100, "110.30", "90.70"],
  [66, "VISHNU CHEMICALS", 15, "504.13", "519.05"],
  [67, "WAAREE RENEWABLE TECHNOLOGIES", 20, "951.40", "697.50"],
  [68, "WEBSOL ENERGY SYSTEM", 100, "107.09", "67.15"]
];

function runIngress(master?: SecurityMaster) {
  return BrokerImportIngressOrchestrator.executeIngress({
    content: DHAN_68_CSV,
    fileName: 'Portfolio(2).csv',
    asOf: AS_OF,
    securityMaster: master as SecurityMaster,
    failOnUnmappedIdentity: true,
    allowNonProductionBypass: false,
    allowPartialRejection: false,
    executionEnvironment: 'NON_PRODUCTION',
  });
}

function emptyMaster(): SecurityMaster {
  return new SecurityMaster();
}

describe('WS-A / Dhan 68-row import: evidence, identity, P04', () => {
  it('WS-A-01: all 68 native rows parse without loss or duplication', () => {
    const result = runIngress(emptyMaster());
    assert.equal(result.detection.brokerType, 'DHAN');
    assert.equal(result.detection.details.includes('DHAN_WEB_UI_SUMMARY_V1'), true);
    assert.equal(result.parseResult?.metadata?.dhanVariant, 'DHAN_WEB_UI_SUMMARY_V1');
    assert.equal(result.parseResult?.holdings.length, 68, 'exactly 68 native rows');
    assert.equal(result.totalHoldingsCount, 68);
    const names = result.parseResult!.holdings.map((h) => h.symbol);
    assert.equal(new Set(names).size, 68, 'no row is duplicated');
    assert.deepEqual(names, EXPECTED_ROWS.map((r) => r[1]), 'row order and names are preserved');
  });

  it('WS-A-02: names, quantities, average prices and current prices are preserved exactly', () => {
    const warnings = runIngress(emptyMaster()).warnings;
    assert.deepEqual(warnings, [], 'no parser warning is raised for any of the 68 rows');
    const holdings = runIngress(emptyMaster()).parseResult!.holdings;
    EXPECTED_ROWS.forEach(([rowIndex, name, quantity, avg, last], i) => {
      assert.equal(holdings[i].symbol, name, `row ${rowIndex} name`);
      assert.equal(holdings[i].quantity, quantity, `row ${rowIndex} quantity`);
      assert.equal(holdings[i].averagePrice, Number(avg), `row ${rowIndex} average price`);
      assert.equal(holdings[i].currentPrice, Number(last), `row ${rowIndex} current price`);
    });
  });

  it('WS-A-03: ISIN and exchange stay explicitly missing; nothing is invented', () => {
    const result = runIngress(emptyMaster());
    for (const [i, holding] of result.parseResult!.holdings.entries()) {
      assert.equal(holding.isin, undefined, `row ${i + 1} must not carry an invented ISIN`);
      assert.equal(holding.exchange, undefined, `row ${i + 1} must not carry an invented exchange`);
    }
  });

  it('WS-A-04: parsing does not imply validation, authorization or saving', () => {
    const result = runIngress(emptyMaster());
    assert.equal(result.disposition, 'REJECTED');
    assert.notEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.equal(result.stageReached, 'NORMALIZE');
    assert.equal(result.userHoldings.length, 0, 'no saveable holding vector is produced');
    assert.equal(result.mappingResult, undefined, 'no mapping result is published');
  });

  it('WS-A-05: content digest is deterministic and content-sensitive', () => {
    const a = runIngress(emptyMaster());
    const b = runIngress(emptyMaster());
    assert.equal(a.provenance.contentDigest, b.provenance.contentDigest, 'same bytes -> same digest');
    const expected = createHash('sha256').update(DHAN_68_CSV, 'utf8').digest('hex');
    assert.equal(a.provenance.contentDigest, expected, 'digest is the SHA-256 of the native content');
    const mutated = DHAN_68_CSV.replace('AGI GREENPAC,25,', 'AGI GREENPAC,26,');
    const c = BrokerImportIngressOrchestrator.executeIngress({
      content: mutated, fileName: 'Portfolio(2).csv', asOf: AS_OF, securityMaster: emptyMaster(),
      failOnUnmappedIdentity: true, allowNonProductionBypass: false, executionEnvironment: 'NON_PRODUCTION',
    });
    assert.notEqual(c.provenance.contentDigest, a.provenance.contentDigest, 'one changed byte changes the digest');
    assert.notEqual(a.provenance.contentDigest, OBSERVED_DIGEST,
      'the reconstructed fixture is NOT the original file and must not claim its digest');
  });

  it('WS-A-06: every row receives an independent identity assessment', () => {
    const result = runIngress(emptyMaster());
    const assessments = result.identityAssessments ?? [];
    assert.equal(assessments.length, 68, 'one assessment per native row, even after the refusal');
    assert.deepEqual(assessments.map((x) => x.rowIndex), EXPECTED_ROWS.map((r) => r[0]));
    for (const [i, assessment] of assessments.entries()) {
      assert.equal(assessment.suppliedIdentifier, EXPECTED_ROWS[i][1]);
      assert.equal(assessment.identifierClass, 'UNSCOPED_NAME_OR_SYMBOL');
      assert.equal(assessment.identitySource, 'GOVERNED_SECURITY_MASTER');
      assert.deepEqual(
        assessment.lookups.map((l) => l.identifierType),
        ['NSE_SYMBOL', 'BSE_SYMBOL'],
        'each identifier namespace is recorded in the order it was queried',
      );
      assert.deepEqual(assessment.lookups.map((l) => l.outcome), ['UNMAPPED_IDENTIFIER', 'UNMAPPED_IDENTIFIER']);
      assert.equal(assessment.status, 'UNRESOLVED');
      assert.equal(assessment.refusalCode, 'NO_AUTHORITATIVE_IDENTIFIER_MATCH');
      assert.match(assessment.missingEvidence ?? '', /neither an ISIN nor an exchange/);
      assert.ok(assessment.quarantineRecords.length >= 1, 'the quarantine decisions are retained');
      assert.match(assessment.quarantineRecords[0].quarantineId, /^ident-quar-/);
    }
    assert.equal(result.identitySummary?.unresolved, 68);
    assert.equal(result.identitySummary?.resolved, 0);
    assert.equal(result.identitySummary?.saveable, false);
  });

  it('WS-A-07: the observed AGI GREENPAC P04 refusal is reproduced verbatim when the mapping is absent', () => {
    const result = runIngress(emptyMaster());
    assert.deepEqual(result.rejections, [{
      reason: 'UNMAPPED_IDENTITY',
      details: `P04 Identity Ambiguity Quarantine: Identity ambiguity detected for 'AGI GREENPAC': UNMAPPED_IDENTIFIER (No active mapping found for BSE_SYMBOL:AGI GREENPAC at asOf ${AS_OF})`,
      stage: 'NORMALIZE',
    }]);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /AGI GREENPAC/);
  });

  it('WS-A-08: P04 refuses the whole import and produces no persistence request', () => {
    const result = runIngress(emptyMaster());
    assert.equal(result.success, false);
    assert.equal(result.userHoldings.length, 0);
    assert.equal(result.identityAssessments?.every((a) => a.status !== 'RESOLVED'), true);
  });

  it('WS-A-09: only rows with authoritative mapping evidence resolve', () => {
    const governed = getGovernedBroadSecurityMaster();
    const result = runIngress(governed);
    const assessments = result.identityAssessments ?? [];
    assert.equal(assessments.length, 68);
    const resolved = assessments.filter((a) => a.status === 'RESOLVED');
    assert.deepEqual(
      resolved.map((a) => [a.rowIndex, a.suppliedIdentifier, a.companyId]),
      [
        [1, 'AGI GREENPAC', 'EQ_AGI_IN'],
        [21, 'GHCL', 'EQ_GHCL_IN'],
        [40, 'KROSS', 'EQ_KROSS_IN'],
      ],
      'exactly three rows have authoritative mapping evidence (the governed AGI GREENPAC alias, plus GHCL and KROSS carried natively by the authenticated universe)',
    );
    assert.equal(result.identitySummary?.resolved, 3);
    assert.equal(result.identitySummary?.unresolved, 65);
    assert.equal(
      result.identitySummary?.masterRevision,
      'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001:b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4',
    );
    // The import is STILL refused: one resolved row does not authorize the other 67.
    assert.equal(result.disposition, 'REJECTED');
    assert.equal(result.userHoldings.length, 0);
    assert.match(result.errors[0], /ASK AUTOMOTIVE/);
  });

  it('WS-A-10: an exchange-scoped identifier is never resolved through the other exchange', () => {
    const master = new SecurityMaster();
    master.registerEntity({
      companyId: 'EQ_ONLY_BSE',
      isin: 'INE000A01001',
      companyName: 'Only BSE Listed Limited',
      industry: 'Test',
      sector: 'TEST',
      listings: [{ exchange: 'BSE', symbol: 'ONLYBSE', scripCode: '500001', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    const asBse = assessBrokerRowIdentity({ rowIndex: 1, symbol: 'ONLYBSE', exchange: 'BSE', master, asOf: AS_OF });
    assert.equal(asBse.status, 'RESOLVED');
    assert.equal(asBse.companyId, 'EQ_ONLY_BSE');
    const asNse = assessBrokerRowIdentity({ rowIndex: 1, symbol: 'ONLYBSE', exchange: 'NSE', master, asOf: AS_OF });
    assert.equal(asNse.status, 'UNRESOLVED');
    assert.deepEqual(
      asNse.lookups.map((l) => l.identifierType),
      ['NSE_SYMBOL'],
      'a declared NSE row queries only the NSE namespace',
    );
  });

  it('WS-A-11: no master supplied is NOT_EVALUATED, never a resolved identity claim', () => {
    const assessment = assessBrokerRowIdentity({ rowIndex: 7, symbol: 'AGI GREENPAC', asOf: AS_OF });
    assert.equal(assessment.status, 'NOT_EVALUATED');
    assert.equal(assessment.refusalCode, 'IDENTITY_NOT_EVALUATED');
    assert.equal(assessment.companyId, undefined);
    assert.equal(assessment.lookups.length, 0);
  });

  it('WS-A-12: the durable leg refuses an unresolved import with zero store effect', () => {
    const nativeRows: BrokerImportHolding[] = [
      { symbol: 'AGI GREENPAC', quantity: 25, averageBuyPrice: 89.65, currentPrice: 631.65,
        marketValue: 15791.25, weightPercentage: 100, active: true, sourceBroker: 'DHAN', lineageDigest: 'x' },
      { symbol: 'ASK AUTOMOTIVE', quantity: 7, averageBuyPrice: 431.29, currentPrice: 592.95,
        marketValue: 4150.65, weightPercentage: 0, active: true, sourceBroker: 'DHAN', lineageDigest: 'y' },
    ];
    const gate = evaluateBrokerImportIdentityGate(nativeRows, undefined, AS_OF);
    assert.equal(gate.saveable, false);
    assert.equal(gate.assessments.length, 2, 'both rows are assessed independently');
    assert.deepEqual(gate.refusedHoldings.map((h) => h.symbol).sort(), ['AGI GREENPAC', 'ASK AUTOMOTIVE']);

    let storeCalls = 0;
    const writer: BrokerImportWriter = {
      list: () => [],
      create: () => { storeCalls += 1; return 1; },
      save: () => { storeCalls += 1; return 1; },
      withBrokerImportTransaction: () => { storeCalls += 1; throw new Error('must not open a transaction'); },
      contributions: () => [],
    };
    const owner: OwnerRef = { canonicalOwnerId: 'ws-a-owner', tenantId: 'ws-a-tenant' };
    const outcome = persistBrokerImport(writer, owner, {
      portfolioId: 'WS-A-FIXTURE',
      expectedRevision: 0,
      holdings: nativeRows,
      contentDigest: OBSERVED_DIGEST,
      fileName: 'Portfolio(2).csv',
      sourceBroker: 'DHAN',
      importedAt: AS_OF,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false && outcome.code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.equal(outcome.storeEffect, 'NONE');
    assert.equal(storeCalls, 0, 'no store call was made at all');
  });
});
