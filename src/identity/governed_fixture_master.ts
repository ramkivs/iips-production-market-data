/**
 * Institutional Investment Platform System (IIPS)
 * Governed Offline Fixture & Broad Universe Security Master Provider (P04 / P12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / BI-07-AUTH-2026-01 / AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / BROWSER_AND_NODE_SAFE
 *
 * Provides canonical, deterministic offline reference and Tier-2 expanded broad-universe
 * Security Master providers populated exclusively with governed, verified entities.
 *
 * FAIL-CLOSED GOVERNANCE POLICY:
 * - Real-world broker securities not present in this authoritative master
 *   are deliberately LEFT UNMAPPED and fail closed with IdentityAmbiguityError(UNMAPPED_IDENTIFIER).
 * - Under NO circumstances are identifiers fabricated or inferred via fuzzy matching.
 * - Browser runtime uses build-time imported canonical D05 dataset with zero dynamic Node fs/path dependencies.
 */

import { SecurityMaster, SecurityMasterEntity } from './security_master.js';
import { D05_BROAD_UNIVERSE_ENTITIES } from './d05_broad_universe_data.js';

export { D05_BROAD_UNIVERSE_ENTITIES };

/**
 * Governed baseline reference entities authorized for offline non-production development
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
 * Instantiates and returns a governed offline reference SecurityMaster pre-populated
 * with baseline reference entities (5 entities).
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

let cachedBroadMaster: SecurityMaster | null = null;

/**
 * Instantiates and returns the governed Tier-2 expanded broad-universe SecurityMaster
 * pre-populated with all 2,250 canonical active NSE CM equity instruments, multi-exchange listings,
 * governed alias mappings (AGI GREENPAC), and historical effective-dated entries.
 *
 * Isomorphic & Browser-Safe:
 * - Operates identically in browser and Node runtimes with zero dynamic fs/path dependencies.
 * - Fails closed if the canonical dataset is missing or corrupt (does not silently fall back).
 */
export function getGovernedBroadSecurityMaster(): SecurityMaster {
  if (cachedBroadMaster) {
    return cachedBroadMaster;
  }

  if (!D05_BROAD_UNIVERSE_ENTITIES || !Array.isArray(D05_BROAD_UNIVERSE_ENTITIES) || D05_BROAD_UNIVERSE_ENTITIES.length !== 2250) {
    throw new Error(
      `Bootstrap Error: Governed D05 Broad Universe dataset missing or invalid. Expected 2,250 records, found ${D05_BROAD_UNIVERSE_ENTITIES?.length ?? 0}. Application failed closed under P04 governance.`
    );
  }

  const sm = new SecurityMaster();

  for (const record of D05_BROAD_UNIVERSE_ENTITIES) {
    sm.registerEntity(record);
  }

  // Governed Alias Mapping: AGI GREENPAC -> EQ_AGI_IN
  sm.mappingStore.addMapping({
    companyId: 'EQ_AGI_IN',
    identifierType: 'NSE_SYMBOL',
    identifierValue: 'AGI GREENPAC',
    effectiveFrom: '2022-01-01T00:00:00.000Z',
  });

  // Historic effective-dated alias: UTIBANK -> EQ_AXISBANK_IN (prior to 2007-07-30)
  sm.mappingStore.addMapping({
    companyId: 'EQ_AXISBANK_IN',
    identifierType: 'NSE_SYMBOL',
    identifierValue: 'UTIBANK',
    effectiveFrom: '1998-01-01T00:00:00.000Z',
    effectiveTo: '2007-07-29T23:59:59.999Z',
  });

  cachedBroadMaster = sm;
  return sm;
}

export function resetGovernedBroadSecurityMasterCache(): void {
  cachedBroadMaster = null;
}
