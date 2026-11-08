/**
 * Institutional Investment Platform System (IIPS)
 * Governed Offline Fixture & Universe Security Master Providers (P04 / P12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / BI-07-AUTH-2026-01
 *   D05 legacy:  AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (Wave-1, 2,250 — retained as legacy)
 *   D05 current: AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001 (one-time authenticated universe, 2026-11-08)
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / BROWSER_AND_NODE_SAFE
 *
 * Provides canonical, deterministic offline reference and the D05 authenticated Tier-2
 * universe Security Master provider populated exclusively with governed, reconstructed
 * source facts (see AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001).
 *
 * FAIL-CLOSED GOVERNANCE POLICY:
 * - Real-world broker securities not present in this authoritative master
 *   are deliberately LEFT UNMAPPED and fail closed with IdentityAmbiguityError(UNMAPPED_IDENTIFIER).
 * - Under NO circumstances are identifiers fabricated or inferred via fuzzy matching.
 * - Browser runtime uses build-time imported canonical D05 dataset with zero dynamic Node fs/path dependencies.
 */

import { SecurityMaster, SecurityMasterEntity, GovernedSourceRevision } from './security_master.js';
import { D05_BROAD_UNIVERSE_ENTITIES } from './d05_broad_universe_data.js';
import { D05_AUTHENTICATED_UNIVERSE_ENTITIES } from './d05_authenticated_universe_data.js';
import { applyD05AiilListingCorrection } from './d05_listing_corrections.js';

export { D05_BROAD_UNIVERSE_ENTITIES, D05_AUTHENTICATED_UNIVERSE_ENTITIES };

/**
 * Governed deposition identity of the D05 broad-universe corpus, transcribed verbatim from
 * evidence/operator_drop/d05_security_master_manifest.json (equality with the manifest and
 * with the SHA-256 of the deposited JSON is enforced by
 * tests/d05_security_master_integrity_semantics.test.ts). Provenance only — this records
 * which governed revision is resolved, not that any record is real-market (C1/C2/C3).
 */
export const D05_BROAD_UNIVERSE_SOURCE_REVISION: Readonly<GovernedSourceRevision> = Object.freeze({
  batchId: 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001',
  fileChecksumSha256: '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5',
  recordCount: 2250,
  authorizationRef: 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001',
  operatingMode: 'OFFLINE_BOOTSTRAP',
});

/**
 * Governed deposition identity of the D05 authenticated-universe corpus (one-time replacement,
 * 2026-11-08), transcribed verbatim from
 * evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json
 * (equality with the manifest and with the SHA-256 of the deposited JSON is enforced by
 * tests/d05_security_master_authenticated_universe.test.ts). Provenance only.
 */
export const D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION: Readonly<GovernedSourceRevision> = Object.freeze({
  batchId: 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001',
  fileChecksumSha256: 'b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4',
  recordCount: 2390,
  authorizationRef: 'AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001',
  operatingMode: 'OFFLINE_BOOTSTRAP',
});

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

let cachedLegacyWave1Master: SecurityMaster | null = null;

/**
 * Instantiates the LEGACY Wave-1 Tier-2 broad-universe SecurityMaster (2,250 canonical
 * active NSE CM equity instruments, as-deposited bytes plus the narrowly-scoped AIIL
 * runtime overlay correction, AGI GREENPAC alias and the effective-dated UTIBANK alias).
 *
 * LEGACY ONLY — retained exclusively for the one-time Wave-1 rollback drill and for
 * evidentiary comparison. Runtime resolution MUST use getGovernedAuthenticatedSecurityMaster().
 * Isomorphic & Browser-Safe.
 */
export function getGovernedLegacyWave1SecurityMaster(): SecurityMaster {
  if (cachedLegacyWave1Master) {
    return cachedLegacyWave1Master;
  }

  if (!D05_BROAD_UNIVERSE_ENTITIES || !Array.isArray(D05_BROAD_UNIVERSE_ENTITIES) || D05_BROAD_UNIVERSE_ENTITIES.length !== 2250) {
    throw new Error(
      `Bootstrap Error: Governed D05 Broad Universe (legacy) dataset missing or invalid. Expected 2,250 records, found ${D05_BROAD_UNIVERSE_ENTITIES?.length ?? 0}. Application failed closed.`
    );
  }

  const sm = new SecurityMaster({ sourceRevision: D05_BROAD_UNIVERSE_SOURCE_REVISION });

  for (const record of D05_BROAD_UNIVERSE_ENTITIES) {
    // Preserve the as-deposited D05 array; apply the narrowly-scoped, evidence-backed
    // AIIL scrip correction only to the runtime SecurityMaster projection.
    sm.registerEntity(applyD05AiilListingCorrection(record));
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

  cachedLegacyWave1Master = sm;
  return sm;
}

let cachedAuthenticatedMaster: SecurityMaster | null = null;

/**
 * Instantiates and returns the GOVERNED D05 Authenticated Universe SecurityMaster
 * (one-time replacement, 2026-11-08) pre-populated with all 2,390 canonical
 * active NSE CM equity instruments reconstructed from the pinned supplied masters:
 * NSE CM EQ (universe of record; ISIN/order/symbol parity verified), BSE supplied
 * active-equity export (2,290 exact-ISIN scrip joins + 100 UNLISTED-BSE governed
 * exclusions — never six-digit claims), MCA bridge verbatim with the task-bound
 * classes preserved, taxonomy verbatim (B3), uniform 0.05 tick (D-9 limitation),
 * faceValue ← NSE listing master, EQ_<TOKEN>_IN ids (D-4).
 *
 * EQ_AIIL_IN is carried NATIVELY (BSE 539177 per the supplied master) — the Wave-1
 * AIIL runtime overlay does NOT apply here (D-5/D-6).
 *
 * Isomorphic & Browser-Safe:
 * - Operates identically in browser and Node runtimes with zero dynamic fs/path dependencies.
 * - Fails closed if the canonical dataset is missing or corrupt (does not silently fall back).
 */
export function getGovernedAuthenticatedSecurityMaster(): SecurityMaster {
  if (cachedAuthenticatedMaster) {
    return cachedAuthenticatedMaster;
  }

  if (!D05_AUTHENTICATED_UNIVERSE_ENTITIES || !Array.isArray(D05_AUTHENTICATED_UNIVERSE_ENTITIES) || D05_AUTHENTICATED_UNIVERSE_ENTITIES.length !== 2390) {
    throw new Error(
      `Bootstrap Error: Governed D05 Authenticated Universe dataset missing or invalid. Expected 2,390 records, found ${D05_AUTHENTICATED_UNIVERSE_ENTITIES?.length ?? 0}. Application failed closed under AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001 governance.`
    );
  }

  const sm = new SecurityMaster({ sourceRevision: D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION });

  // As-deposited records are registered WITHOUT any runtime overlay correction.
  for (const record of D05_AUTHENTICATED_UNIVERSE_ENTITIES) {
    sm.registerEntity(record);
  }

  // Governed Alias Mapping: AGI GREENPAC -> EQ_AGI_IN (carried forward from the broad-universe deposition)
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

  cachedAuthenticatedMaster = sm;
  return sm;
}

/**
 * Backwards-compatible alias retained for existing consumers (broker resolver,
 * portfolio UI package, app surfaces). Since the one-time replacement act of
 * 2026-11-08 (IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT)
 * this resolves to the authenticated universe (2,390 records). Callers seeking the
 * frozen Wave-1 evidence universe must use getGovernedLegacyWave1SecurityMaster().
 */
export function getGovernedBroadSecurityMaster(): SecurityMaster {
  return getGovernedAuthenticatedSecurityMaster();
}

export function resetGovernedBroadSecurityMasterCache(): void {
  resetGovernedAuthenticatedSecurityMasterCache();
}

export function resetGovernedAuthenticatedSecurityMasterCache(): void {
  cachedAuthenticatedMaster = null;
}

export function resetGovernedLegacyWave1SecurityMasterCache(): void {
  cachedLegacyWave1Master = null;
}
