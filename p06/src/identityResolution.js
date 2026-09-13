/**
 * P06-01 — IDENTITY RESOLUTION (**reuse only**; no identity logic is implemented here)
 *
 * ⚠ **This module implements NOTHING.** It is a thin pass-through onto the accepted P04-shaped
 *   identity machinery in `p05/src/identity.js`:
 *     · `MappingRegister` — ADP-4 versioned register; MC-1/MC-2 canonical→companyId; **FC-1 an
 *       unmapped canonical identity FAILS CLOSED**; ADP-7/MC-5 overlapping windows fail; MP-5/ADP-3
 *       confidence never substitutes for approval.
 *     · `buildIdentityRef` — **RF-3**: `mappedCompanyId` is written ONLY here, from a resolved
 *       P04-shaped mapping, never by the data plane. **XI-1 / OI-09**: FIGI/OpenFIGI is the sole
 *       authoritative external identifier; ISIN/CUSIP/SEDOL may never be marked AUTHORITATIVE.
 *
 *   The identity/cardinality contract, FIGI authority and fail-closed behaviour are therefore
 *   **preserved exactly**, because the same code runs.
 *
 * P06-01 needs this only because `docs/p01/P01_VALIDATION_RULES.md` **RF-1** requires an identity
 * reference for instrument-keyed domains (D01…D07, D09). Inventing a P06 identity path would
 * duplicate P04 authority and is prohibited.
 */

import { MappingRegister, buildIdentityRef, IdentityResolutionFailure } from '../../p05/src/identity.js';

/**
 * Build the P04-shaped register from the accepted identity fixtures (REUSE).
 * @param {{mappingRegisterVersion: string, mappings: Array<Record<string, unknown>>}} identityFixtures
 * @returns {MappingRegister}
 */
export function buildMappingRegister(identityFixtures) {
  return new MappingRegister({
    version: identityFixtures.mappingRegisterVersion,
    records: identityFixtures.mappings,
  });
}

/**
 * Resolve a canonical security ID to a full `IdentityRef`.
 *
 * FC-1 / FC-3 / FC-4 / FC-5 / FC-7: an unresolved identity is an explicit, deterministic, named
 * **failure** — never a quality state and never silently dropped.
 *
 * @param {object} args
 * @param {Array<Record<string, unknown>>} args.securities
 * @param {MappingRegister} args.register
 * @param {string} args.canonicalSecurityId
 * @param {string} args.asOf
 * @param {string} [args.venueRef]
 * @returns {Readonly<Record<string, unknown>>} an `IdentityRef`
 */
export function resolveIdentityRef({ securities, register, canonicalSecurityId, asOf, venueRef }) {
  const sec = securities.find((s) => s.canonicalSecurityId === canonicalSecurityId);
  if (sec === undefined) {
    // RF-1: an unknown canonical security is a hard failure, never a passthrough.
    throw new IdentityResolutionFailure(['RF-1', 'FC-1'],
      'canonical security lookup', canonicalSecurityId, asOf);
  }
  // FC-1 — fails closed inside the register; the throw is deliberately NOT caught here.
  const resolved = register.resolveCanonicalToCompany(canonicalSecurityId, asOf);
  return buildIdentityRef({
    canonicalSecurityId: sec.canonicalSecurityId,
    canonicalIssuerId: sec.canonicalIssuerId,
    instrumentType: sec.instrumentType,
    lifecycleStatus: sec.lifecycleStatus,
    validFrom: sec.validFrom,
    validTo: sec.validTo ?? undefined,
    externalIdentifiers: sec.externalIdentifiers,
    ...(venueRef !== undefined ? { venueRef } : {}),
    resolvedMapping: { companyId: resolved.companyId, mappingVersion: resolved.mappingVersion },
  });
}

export { MappingRegister, buildIdentityRef, IdentityResolutionFailure };
