/**
 * P05-01 — IDENTITY AND GOVERNED MAPPING SURFACE (P04 contract, fixture-backed)
 *
 * Authority: docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md
 *   ADP-1…ADP-8 mandatory adapter properties
 *   MC-1…MC-7   cardinality rule 1:N (OI-08 RESOLVED)
 *   MP-1…MP-5   mapping provenance
 *   PN-1…PN-6   provider neutrality — no provider-ID promotion
 *   FC-1…FC-7   unresolved/unmapped behaviour — FAIL-CLOSED
 *   SEC-4       AD-11 mechanism unchanged; ⚠ OI-P04-03 bounds per-record governance (IB-1)
 * Authority: docs/p04/P04_CANONICAL_SECURITY_MODEL.md  CS-1…CS-6, XI-1…XI-8
 * Authority: docs/p01/P01_IDENTITY_AND_LINEAGE.md      ID-1…ID-6
 *
 * ⚠ P04 is a SPECIFICATION, not an implementation. This module does NOT build the security
 *   master. It consumes a local, synthetic, fixture-declared mapping register whose records
 *   conform to the P04 mapping-record shape (§5) and enforces the P04 rules mechanically.
 *
 * ⚠ OI-P04-03 (IB-1): per-record tenant/region governance application is NOT implemented.
 *   No governance attribute is invented, inferred or defaulted.
 */

/** OI-09: FIGI/OpenFIGI is the authoritative external identifier standard. */
export const AUTHORITATIVE_EXTERNAL_IDENTIFIER = 'FIGI';
/** XI-1 / PN-6: other standards may be carried but are explicitly NON-authoritative. */
export const NON_AUTHORITATIVE_IDENTIFIERS = Object.freeze(['ISIN', 'CUSIP', 'SEDOL']);

/** MP-2: permitted mapping methods. ⚠ "inferred from symbol" is NOT permitted (ADP-1). */
export const MAPPING_METHODS = Object.freeze([
  'AUTHORITATIVE_IDENTIFIER_MATCH',
  'REGISTRY_ASSERTION',
  'MANUAL_APPROVAL',
]);

/** CS-6 / P01 dictionary §7: the five fixed lifecycle states. */
export const LIFECYCLE_STATES = Object.freeze(['active', 'suspended', 'delisted', 'merged', 'superseded']);

/** Typed fail-closed identity outcome (FC-1, FC-3, FC-4). */
export class IdentityResolutionFailure extends Error {
  /**
   * @param {string[]} rules
   * @param {string} direction   'canonical->companyId' | 'companyId->canonical' | 'external->canonical'
   * @param {string} element     the unresolved element, named (FC-4)
   * @param {string} asOf
   */
  constructor(rules, direction, element, asOf) {
    super(`${rules.join(',')}: unresolved ${direction} for '${element}' as of ${asOf} — ` +
      'fail-closed; no coercion, no placeholder, no synthesised companyId, no fallback');
    this.name = 'IdentityResolutionFailure';
    this.rules = Object.freeze([...rules]);
    this.direction = direction;
    this.unresolvedElement = element;
    this.asOf = asOf;
    // FC-5: fail-closed is NOT degradation — never reported as quality/staleness/unavailability.
    this.isQualityState = false;
    // FC-6: E1–E8 is UNCHANGED; an identity failure is NOT E1 and adds no new class.
    this.errorTaxonomyClassAdded = false;
  }
}

/** @param {string} asOf @param {{from:string,to:string}} window @returns {boolean} */
function withinEffectiveWindow(asOf, window) {
  const t = Date.parse(asOf);
  const from = Date.parse(window.from);
  const to = window.to === undefined || window.to === null ? Number.POSITIVE_INFINITY : Date.parse(window.to);
  return t >= from && t <= to;
}

/**
 * A governed mapping register. Records conform to P04_IDENTITY_ADAPTER_CONTRACT.md §5:
 *   canonical security ID · canonical issuer ID · target companyId · mapping version ·
 *   effective from/to · mapping method · source/provider · confidence ·
 *   approval/authority reference · audit reference
 */
export class MappingRegister {
  /**
   * @param {{version: string, records: Array<Record<string, unknown>>}} spec
   */
  constructor({ version, records }) {
    if (typeof version !== 'string' || version.length === 0) {
      throw new Error('ADP-4: the mapping set MUST be versioned');
    }
    /** @type {string} ADP-4 — the version an execution records as the one it used. */
    this.version = version;
    this.records = Object.freeze(records.map((r) => Object.freeze({ ...r })));
    for (const r of this.records) validateMappingRecord(r);
  }

  /**
   * MC-1 / MC-2 — canonical → companyId. Many canonical security IDs may resolve to ONE
   * companyId: an expected N:1 projection, not an error.
   * FC-1 — an unmapped canonical identity FAILS EXPLICITLY.
   * @param {string} canonicalSecurityId
   * @param {string} asOf
   * @returns {Readonly<{companyId: string, mappingVersion: string, record: Record<string, unknown>}>}
   * @throws {IdentityResolutionFailure}
   */
  resolveCanonicalToCompany(canonicalSecurityId, asOf) {
    const candidates = this.records.filter(
      (r) => r.canonicalSecurityId === canonicalSecurityId && withinEffectiveWindow(asOf, r.effective),
    );
    if (candidates.length === 0) {
      throw new IdentityResolutionFailure(['FC-1', 'ADP-2', 'MC-7'],
        'canonical->companyId', canonicalSecurityId, asOf);
    }
    if (candidates.length > 1) {
      throw new IdentityResolutionFailure(['ADP-7', 'MC-5'],
        'canonical->companyId', `${canonicalSecurityId} (${candidates.length} overlapping effective windows)`, asOf);
    }
    const rec = candidates[0];
    // MP-5: confidence never substitutes for approval.
    if (rec.approvalRef === undefined || rec.approvalRef === null) {
      throw new IdentityResolutionFailure(['MP-5', 'ADP-3'],
        'canonical->companyId', `${canonicalSecurityId} (unapproved mapping)`, asOf);
    }
    return Object.freeze({ companyId: rec.targetCompanyId, mappingVersion: this.version, record: rec });
  }

  /**
   * MC-3 — companyId → canonical returns a SET (zero, one or many), never a scalar.
   * @param {string} companyId
   * @param {string} asOf
   * @returns {ReadonlyArray<{canonicalSecurityId: string, canonicalIssuerId: string, mappingVersion: string}>}
   */
  resolveCompanyToCanonical(companyId, asOf) {
    return Object.freeze(
      this.records
        .filter((r) => r.targetCompanyId === companyId && withinEffectiveWindow(asOf, r.effective))
        .map((r) => Object.freeze({
          canonicalSecurityId: r.canonicalSecurityId,
          canonicalIssuerId: r.canonicalIssuerId,
          mappingVersion: this.version,
        })),
    );
  }

  /**
   * XI-1 / XI-6 / FC-2 — resolve through the AUTHORITATIVE external identifier (FIGI).
   * An unresolved FIGI is an EXPLICIT unresolved state: never a fallback to ISIN/CUSIP/SEDOL
   * as authoritative, never a fallback to a provider symbol (PN-2).
   * @param {string} figi
   * @param {string} asOf
   * @returns {Readonly<{canonicalSecurityId: string, identifierType: string, authorityFlag: string}>}
   * @throws {IdentityResolutionFailure}
   */
  resolveExternalIdentifier(figi, asOf) {
    const rec = this.records.find(
      (r) => r.externalIdentifier?.type === AUTHORITATIVE_EXTERNAL_IDENTIFIER &&
             r.externalIdentifier.value === figi &&
             withinEffectiveWindow(asOf, r.effective),
    );
    if (rec === undefined) {
      throw new IdentityResolutionFailure(['FC-2', 'XI-6', 'PN-2'],
        'external->canonical', `FIGI ${figi}`, asOf);
    }
    // MP-4: the identifier type and its authority flag are recorded.
    return Object.freeze({
      canonicalSecurityId: rec.canonicalSecurityId,
      identifierType: rec.externalIdentifier.type,
      authorityFlag: rec.externalIdentifier.authority,
    });
  }
}

/**
 * Validate a mapping record against P04 §5 + ADP-1…ADP-8 + MP-1…MP-5.
 * @param {Record<string, unknown>} r
 */
export function validateMappingRecord(r) {
  const required = ['canonicalSecurityId', 'canonicalIssuerId', 'targetCompanyId',
    'effective', 'mappingMethod', 'source', 'confidence', 'approvalRef', 'auditRef'];
  const missing = required.filter((k) => r[k] === undefined);
  if (missing.length > 0) {
    throw new Error(`MP-1: mapping record for '${r.canonicalSecurityId ?? '?'}' is missing ${missing.join(', ')}`);
  }
  if (!MAPPING_METHODS.includes(r.mappingMethod)) {
    // MP-2 / ADP-1: "inferred from symbol" is not a permitted method.
    throw new Error(`MP-2/ADP-1: mappingMethod '${r.mappingMethod}' is not permitted ` +
      `(permitted: ${MAPPING_METHODS.join(', ')}). "inferred from symbol" is prohibited.`);
  }
  if (typeof r.effective?.from !== 'string') {
    throw new Error('ADP-7: mappings must be effective-dated (effective.from required)');
  }
  if (r.externalIdentifier !== undefined) {
    // XI-1 / PN-6 / MP-4
    if (!['FIGI', ...NON_AUTHORITATIVE_IDENTIFIERS].includes(r.externalIdentifier.type)) {
      throw new Error(`XI-1: external identifier type '${r.externalIdentifier.type}' is not a recognised standard`);
    }
    if (r.externalIdentifier.type === AUTHORITATIVE_EXTERNAL_IDENTIFIER &&
        r.externalIdentifier.authority !== 'AUTHORITATIVE') {
      throw new Error('XI-1/MP-4: a FIGI identifier must carry authority=AUTHORITATIVE');
    }
    if (NON_AUTHORITATIVE_IDENTIFIERS.includes(r.externalIdentifier.type) &&
        r.externalIdentifier.authority === 'AUTHORITATIVE') {
      throw new Error('XI-1/MP-4: ISIN/CUSIP/SEDOL are explicitly NON-authoritative (OI-09)');
    }
  }
}

/**
 * Build the D05 identity reference for a snapshot (P01 dictionary §7 slots).
 *
 * ⚠ RF-3: `mappedCompanyId` may ONLY be written by the P04-shaped adapter path below — never
 *   by the data plane, never coerced (ID-1, ADP-2).
 *
 * @param {object} spec
 * @param {string} spec.canonicalSecurityId  CS-1 immutable, unique, program-internal
 * @param {string} spec.canonicalIssuerId
 * @param {string} spec.instrumentType
 * @param {string} spec.lifecycleStatus
 * @param {string} spec.validFrom
 * @param {string} [spec.validTo]
 * @param {Array<{type:string,value:string,authority:string}>} [spec.externalIdentifiers]
 * @param {string} [spec.localSymbol]  explicitly NON-authoritative (ID-6, PN-4)
 * @param {string} [spec.listingRef]
 * @param {string} [spec.venueRef]
 * @param {{companyId: string, mappingVersion: string}|null} [spec.resolvedMapping]
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildIdentityRef(spec) {
  const {
    canonicalSecurityId, canonicalIssuerId, instrumentType, lifecycleStatus,
    validFrom, validTo, externalIdentifiers = [], localSymbol, listingRef, venueRef,
    resolvedMapping = null,
  } = spec;

  if (!LIFECYCLE_STATES.includes(lifecycleStatus)) {
    throw new Error(`lifecycleStatus '${lifecycleStatus}' is not one of ${LIFECYCLE_STATES.join('|')}`);
  }
  for (const xi of externalIdentifiers) {
    if (NON_AUTHORITATIVE_IDENTIFIERS.includes(xi.type) && xi.authority === 'AUTHORITATIVE') {
      throw new Error(`XI-1: ${xi.type} must not be marked AUTHORITATIVE (OI-09 = FIGI/OpenFIGI only)`);
    }
  }

  return Object.freeze({
    canonicalSecurityId,
    canonicalIssuerId,
    instrumentType,
    lifecycleStatus,
    validFrom,
    ...(validTo !== undefined ? { validTo } : {}),
    externalIdentifiers: Object.freeze(externalIdentifiers.map((x) => Object.freeze({ ...x }))),
    ...(localSymbol !== undefined ? { localSymbol, localSymbolAuthoritative: false } : {}),
    ...(listingRef !== undefined ? { listingRef } : {}),
    ...(venueRef !== undefined ? { venueRef } : {}),
    // RF-3: written ONLY here, from a resolved P04-shaped mapping — never by the data plane.
    ...(resolvedMapping ? Object.freeze({
      mappedCompanyId: resolvedMapping.companyId,
      adapterCrossing: true,
    }) : {}),
    ...(resolvedMapping ? { identityMappingVersion: resolvedMapping.mappingVersion } : {}),
  });
}

/**
 * PN-5 — two providers asserting the same instrument produce ONE canonical security ID with
 * per-source attribution. Never two canonical identities, never a silent merge.
 * @param {Array<{canonicalSecurityId: string, provider: string, localSymbol: string,
 *               externalIdentifier?: {type:string,value:string}}>} assertions
 * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
 */
export function reconcileMultiProviderAssertions(assertions) {
  /** @type {Map<string, {canonicalSecurityId:string, sources:Array<unknown>}>} */
  const byCanonical = new Map();
  /** @type {Map<string, Set<string>>} */
  const canonicalPerFigi = new Map();

  for (const a of assertions) {
    // PN-2: a provider symbol is never promoted to canonical identity.
    if (a.canonicalSecurityId === a.localSymbol) {
      throw new Error(`PN-2/ID-6: provider symbol '${a.localSymbol}' must never be promoted to canonical identity`);
    }
    if (a.externalIdentifier?.type === AUTHORITATIVE_EXTERNAL_IDENTIFIER) {
      const key = `${a.externalIdentifier.type}:${a.externalIdentifier.value}`;
      if (!canonicalPerFigi.has(key)) canonicalPerFigi.set(key, new Set());
      canonicalPerFigi.get(key).add(a.canonicalSecurityId);
    }
    if (!byCanonical.has(a.canonicalSecurityId)) {
      byCanonical.set(a.canonicalSecurityId, { canonicalSecurityId: a.canonicalSecurityId, sources: [] });
    }
    byCanonical.get(a.canonicalSecurityId).sources.push(
      Object.freeze({ provider: a.provider, localSymbol: a.localSymbol, localSymbolAuthoritative: false }),
    );
  }
  // U-7 / PR-7: no silent merge of two canonical identities on identifier collision.
  for (const [figi, ids] of canonicalPerFigi) {
    if (ids.size > 1) {
      throw new Error(`U-7/PR-7: identifier '${figi}' asserts ${ids.size} distinct canonical identities ` +
        `(${[...ids].sort().join(', ')}) — silent merge is prohibited; this is an explicit unresolved state`);
    }
  }
  return Object.freeze([...byCanonical.values()]
    .sort((a, b) => a.canonicalSecurityId.localeCompare(b.canonicalSecurityId))
    .map((v) => Object.freeze({ canonicalSecurityId: v.canonicalSecurityId, sources: Object.freeze(v.sources) })));
}
