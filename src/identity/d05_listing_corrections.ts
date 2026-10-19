/**
 * Evidence-backed, runtime-only corrections to the deposited D05 listing projection.
 *
 * The source deposition remains byte-for-byte preserved. Corrections are applied only
 * after hydration and never invent listing dates or add a missing issuer to the universe.
 */
import { SecurityMasterEntity } from './security_master.js';

/**
 * BSE scrip 543989 is Sai Silks (Kalamandir), not Authum Investment & Infrastructure.
 * BSE-hosted issuer filing and current BSE security detail are recorded in
 * evidence/cross-repository/IIPS_V3_IPD_AIIL_IDENTITY_AND_PROVENANCE_FOLLOWUP_2026-10-19.md.
 */
export const AIIL_BSE_543989_CORRECTION_ID = 'IPD-AIIL-BSE-SCRIP-CORRECTION-2026-10-19-001';

/**
 * Correct the one known issuer-code collision in the runtime view of the frozen deposit.
 * This function intentionally leaves the deposited module untouched and assigns no
 * listing-level effectiveFrom/effectiveTo dates. It removes 543989 from Authum and
 * retains the independently evidenced 539177 association. It does not create a Sai Silks
 * entity because that would expand the governed D05 universe.
 */
export function applyD05AiilListingCorrection(entity: SecurityMasterEntity): SecurityMasterEntity {
  if (entity.companyId !== 'EQ_AIIL_IN') return entity;

  const incorrectCodeRows = entity.listings.filter(
    (listing) => listing.exchange === 'BSE' && listing.scripCode === '543989'
  );
  const retainedAuthumCodeRows = entity.listings.filter(
    (listing) => listing.exchange === 'BSE' && listing.scripCode === '539177'
  );

  if (entity.bseScripCode !== '543989' || incorrectCodeRows.length !== 1 || retainedAuthumCodeRows.length !== 1) {
    throw new Error(
      `${AIIL_BSE_543989_CORRECTION_ID}: expected the deposited EQ_AIIL_IN record to contain top-level BSE code 543989 and exactly one BSE listing each for 543989 and 539177.`
    );
  }

  return {
    ...entity,
    bseScripCode: '539177',
    listings: entity.listings.filter(
      (listing) => !(listing.exchange === 'BSE' && listing.scripCode === '543989')
    ),
  };
}
