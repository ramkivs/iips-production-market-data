/**
 * Institutional Investment Platform System (IIPS)
 * Governed Offline Fixture Security Master Provider (P04 / P12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / OFFLINE_FIXTURE / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * Provides a canonical, deterministic offline reference Security Master populated
 * exclusively with governed reference entities.
 *
 * FAIL-CLOSED GOVERNANCE POLICY:
 * - Real-world broker securities not present in this authoritative offline fixture
 *   (including AIIL and AGI GREENPAC) are deliberately LEFT UNMAPPED and fail closed
 *   with IdentityAmbiguityError(UNMAPPED_IDENTIFIER) until an authoritative master
 *   data ingestion wave is authorized and completed.
 * - Under NO circumstances are identifiers fabricated or inferred via fuzzy matching.
 */

import { SecurityMaster, SecurityMasterEntity } from './security_master.js';

/**
 * Governed reference entities authorized for offline non-production development
 * and product qualification.
 */
export const GOVERNED_OFFLINE_REFERENCE_ENTITIES: ReadonlyArray<SecurityMasterEntity> = [
  {
    companyId: 'EQ_RELIANCE_IN',
    companyName: 'Reliance Industries Limited',
    isin: 'INE002A01018',
    cin: 'L17110MH1973PLC019786',
    industry: 'Oil & Gas',
    sector: 'ENERGY',
    listings: [
      { exchange: 'NSE', symbol: 'RELIANCE', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      { exchange: 'BSE', symbol: 'RELIANCE', scripCode: '500325', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
    ],
    effectiveFrom: '2000-01-01T00:00:00.000Z',
  },
  {
    companyId: 'EQ_INFY_IN',
    companyName: 'Infosys Limited',
    isin: 'INE009A01021',
    cin: 'L85110KA1981PLC013115',
    industry: 'IT Services',
    sector: 'IT',
    listings: [
      { exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      { exchange: 'BSE', symbol: 'INFY', scripCode: '500209', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
    ],
    effectiveFrom: '1981-07-02T00:00:00.000Z',
  },
  {
    companyId: 'EQ_TCS_IN',
    companyName: 'Tata Consultancy Services Limited',
    isin: 'INE467B01029',
    cin: 'L22210MH1995PLC084781',
    industry: 'IT Services',
    sector: 'IT',
    listings: [
      { exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      { exchange: 'BSE', symbol: 'TCS', scripCode: '532540', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
    ],
    effectiveFrom: '2004-08-25T00:00:00.000Z',
  },
  {
    companyId: 'EQ_HDFCBANK_IN',
    companyName: 'HDFC Bank Limited',
    isin: 'INE040A01034',
    cin: 'L65110MH1994PLC080618',
    industry: 'Private Bank',
    sector: 'BANKING',
    listings: [
      { exchange: 'NSE', symbol: 'HDFCBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      { exchange: 'BSE', symbol: 'HDFCBANK', scripCode: '500180', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
    ],
    effectiveFrom: '1995-01-01T00:00:00.000Z',
  },
  {
    companyId: 'EQ_AXISBANK_IN',
    companyName: 'Axis Bank Limited',
    isin: 'INE238A01034',
    industry: 'Banking',
    sector: 'BANKING',
    listings: [
      { exchange: 'NSE', symbol: 'AXISBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
      { exchange: 'BSE', symbol: 'AXISBANK', scripCode: '532215', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' },
    ],
    effectiveFrom: '2007-07-30T00:00:00.000Z',
  },
];

/**
 * Instantiates and returns a governed offline fixture SecurityMaster pre-populated
 * with authoritative reference entities.
 *
 * UNMAPPED STATUS NOTICE:
 * Securities such as AIIL and AGI GREENPAC are NOT present in this fixture and
 * will strictly trigger IdentityAmbiguityError under fail-closed governance.
 */
export function getGovernedOfflineSecurityMaster(): SecurityMaster {
  const sm = new SecurityMaster();

  for (const entity of GOVERNED_OFFLINE_REFERENCE_ENTITIES) {
    sm.registerEntity(entity);
  }

  // Historic effective-dated alias: UTIBANK -> EQ_AXISBANK_IN (prior to 2007-07-30)
  sm.mappingStore.addMapping({
    companyId: 'EQ_AXISBANK_IN',
    identifierType: 'NSE_SYMBOL',
    identifierValue: 'UTIBANK',
    effectiveFrom: '1998-01-01T00:00:00.000Z',
    effectiveTo: '2007-07-29T23:59:59.999Z',
  });

  return sm;
}
