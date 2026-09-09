/**
 * P05-03-A — HISTORICAL OHLCV INGESTION CONTRACT (`HA-*`)
 *
 * ⚠ **THIS IS A SPECIFICATION AND AN ADAPTER-CONTRACT MODULE. IT IS NOT AN ADAPTER.**
 *
 * Authority: `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-3** —
 *   *"Specification and adapter-contract only — historical OHLCV ingestion contract,
 *    reproducibility and load/reconcile requirements."* ⚠ *No licensed or deeper historical
 *    acquisition* (**N-2**, constrained by **OI-P04-04**).
 *
 * It declares what a conforming **historical** market-data adapter must publish, accept, reject,
 * emit and prove. It contacts nothing, resolves nothing over a network, and holds no credential.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT DO ────────────────────────────────────────────────
 *   • No provider is selected, named or bound. No vendor SDK. No endpoint. No credential.
 *   • No licensed or deeper historical acquisition (**D9 N-2** / **OI-P04-04** OPEN).
 *   • No adjusted-series generation, no adjustment engine, no corporate-action processing.
 *     **RC-5: the adjustment engine is P08.** This contract *declares* adjustment obligations.
 *   • No series-level storage model, no PIT storage, no PIT query.
 *     **PC-6: PIT storage is P08.** **DEP-P01-04** (the series-structure decision) is
 *     **UNRESOLVED** and is a **P08** decision. It is **not** resolved here.
 *   • No scheduling, no orchestration, no retry execution, no checkpointing — those are **P05-04**
 *     (**D9 N-3**).
 *   • No tenant or region attribute (**D9 N-4/N-5**; **OI-P04-03** OPEN, bounded by **IB-1…IB-5**).
 *
 * ── WHAT IT REUSES RATHER THAN REINVENTS ─────────────────────────────────────────────────────
 *   The nine-phase shape, the sole `snapshot(request)` ingress, the E1–E8 taxonomy, the `MD:`
 *   canonical envelope, the snapshotId composition and the ADR-01 C1–C6 collision guards all come
 *   from accepted P01/P02 and from the P05-01 canonical surfaces. **Nothing is forked.** The
 *   `CANONICAL_OUTPUT_BOUNDARY` re-export below asserts `forked: false`.
 *
 * ── THE SERIES-STRUCTURE BOUNDARY (read this before adding anything) ─────────────────────────
 *   `P01_SCHEMA_CATALOG.md` D02 records that `DataSnapshot.asOf` is a **single scalar**, not a
 *   series, and that how a series is delivered *"is a P08 storage decision, recorded here as
 *   DEP-P01-04, not resolved"*. The accepted **P05-01 precedent is one bar per snapshot**
 *   (`localFeed.js mapOhlcv()`). That precedent is **reused** here because it keeps `asOf` scalar
 *   and therefore **does not pre-empt** the P08 decision. ⚠ It must **not** be read as resolving
 *   DEP-P01-04. **HA-3** and **HA-18** encode exactly that.
 */

import {
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  DOMAIN_SEGMENTS,
  VALID_DOMAINS,
  buildKey,
  isNamespaced,
  parseKey,
  assertC1,
  assertC2,
  assertC3,
  assertC4,
  assertCollisionGuard,
  canonicalKeyOrder,
} from './namespace.js';
import {
  buildSnapshot, buildField, buildSnapshotId, assertSnapshotIdConsistent,
  AVAILABILITY, MODES, DATA_TYPES,
} from './contract.js';
import { validateSnapshot } from './validate.js';
import {
  ErrorClass, DISPOSITION, CLASSIFICATION_GATE_ORDER, RETRY_PROHIBITED,
  ClassifiedFailure, failureRecord,
} from './errors.js';
import { canonicalJson, canonicalDigest, assertIsoUtc } from './serialize.js';

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 0. CONTRACT IDENTITY AND VERSIONING
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** HA-1 — The contract is versioned (mirrors AV-3 / AV-4 / AV-5). */
export const P05_03_CONTRACT_VERSION = '1.0';
export const HISTORICAL_CONTRACT_ID = 'P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT';

export const CONTRACT_VERSIONING = Object.freeze({
  contractId: HISTORICAL_CONTRACT_ID,
  contractVersion: P05_03_CONTRACT_VERSION,
  minorChangeRule: 'AV-3 — shape, phase, gate-order or conformance-rule change',
  majorChangeRule: 'AV-4 — change to the canonical output a conforming adapter must produce',
  immutableOnceReleased: 'AV-5 — corrections produce a new contract version, never an edit',
});

/**
 * HA-2 — Two provider kinds exist. The historical surface is required **only** for `LIVE`.
 * A `LOCAL_FIXTURE` adapter is permanently out of scope for licensed historical acquisition and
 * must never be presented as satisfying it. Reuses the P05-02 vocabulary verbatim.
 */
export const PROVIDER_KINDS = Object.freeze(['LOCAL_FIXTURE', 'LIVE']);

/**
 * HA-3 — **THE SERIES-STRUCTURE BOUNDARY.**
 *
 * `snapshot(request)` remains the **sole** public ingress (**P02 B-4 / AD-2**). A historical load
 * is an **ordered sequence of per-bar snapshots**, one snapshot per bar, each with its own scalar
 * `asOf`. This reuses the accepted P05-01 precedent (`localFeed.js mapOhlcv()`).
 *
 * ⚠ It does **NOT** resolve **DEP-P01-04** — the series-structure/storage decision, which
 * `P01_SCHEMA_CATALOG.md` D02 assigns to **P08**. No series-carrying snapshot shape, no
 * series-storage model and no PIT query surface is defined here.
 */
export const SERIES_STRUCTURE_CONTRACT = Object.freeze({
  representation: 'ORDERED_SEQUENCE_OF_PER_BAR_SNAPSHOTS',
  barsPerSnapshot: 1,
  asOfIsScalar: true,
  precedent: 'P05-01 localFeed.js mapOhlcv() — one bar per snapshot',
  resolvesDepP01_04: false,
  depP01_04Owner: 'P08',
  depP01_04Status: 'UNRESOLVED — P01_SCHEMA_CATALOG.md D02 contract note',
  seriesStorageModelDefined: false,
  pitStorageDefined: false,
  pitQueryDefined: false,
  pitStorageOwner: 'P08 (PC-6)',
});

/**
 * HA-4 — Gate order is **unchanged**. A historical adapter reproduces the existing
 * `CLASSIFICATION_GATE_ORDER` (E6 → E3 → E2 → E1); it does not invent an order.
 */
export const HISTORICAL_PHASES = Object.freeze([
  Object.freeze({
    order: 1, phase: 'declare', op: 'declare', liveOnly: false, performsIO: false,
    purpose: 'Publish the static, I/O-free HISTORICAL capability declaration',
    authority: ['P02 A-1…A-8', 'P02_PROVIDER_CAPABILITY_MODEL C-8, PC-1…PC-6, RC-1…RC-5'],
    failureClass: null,
  }),
  Object.freeze({
    order: 2, phase: 'preflight', op: 'preflight', liveOnly: false, performsIO: false,
    purpose: 'Reject an unsupported request or out-of-range historical request BEFORE any call',
    authority: ['P02 A-10', 'P02_PROVIDER_CAPABILITY_MODEL CE-1…CE-8, UC-1…UC-5'],
    failureClass: 'E6',
  }),
  Object.freeze({
    order: 3, phase: 'entitlement', op: 'checkEntitlement', liveOnly: true, performsIO: false,
    purpose: 'Default-deny entitlement evaluation — licensed depth is entitlement-bearing',
    authority: ['P02 A-11', 'P02_ENTITLEMENT_MODEL EV-1…EV-8'],
    failureClass: 'E3',
  }),
  Object.freeze({
    order: 4, phase: 'authenticate', op: 'authenticate', liveOnly: true, performsIO: true,
    purpose: 'Establish provider identity/credential validity — credential VALUE never crosses',
    authority: ['P02_ERROR_TAXONOMY E2', 'P02_ENTITLEMENT_MODEL SP-1…SP-6'],
    failureClass: 'E2',
  }),
  Object.freeze({
    order: 5, phase: 'fetch', op: 'fetch', liveOnly: true, performsIO: true,
    purpose: 'Acquire the provider-native historical payload for the requested range',
    authority: ['P02 A-12, A-13'],
    failureClass: 'E1|E4|E5|E7',
  }),
  Object.freeze({
    order: 6, phase: 'normalize', op: 'normalize', liveOnly: false, performsIO: false,
    purpose: 'Validate the payload against the declared provider wire schema; record ignored elements',
    authority: ['P02 A-13', 'P02_COMPATIBILITY_AND_SUBSTITUTION IC-4, IC-5'],
    failureClass: 'E5',
  }),
  Object.freeze({
    order: 7, phase: 'map', op: 'map', liveOnly: false, performsIO: false,
    purpose: 'Declared provider-native → canonical MD:ohlcv.* mapping, one bar per snapshot',
    authority: ['P02 A-14, A-15', 'P02_PROVIDER_MAPPING_RULES MD-1…MD-8, MR-1…MR-5'],
    failureClass: 'E8',
  }),
  Object.freeze({
    order: 8, phase: 'validate', op: 'validate', liveOnly: false, performsIO: false,
    purpose: 'P01 S1…S4 validation of each constructed canonical snapshot',
    authority: ['P01_VALIDATION_RULES S1…S4, SM-11'],
    failureClass: 'RJ',
  }),
  Object.freeze({
    order: 9, phase: 'emit', op: 'emit', liveOnly: false, performsIO: false,
    purpose: 'Produce each immutable snapshot plus the load reconciliation record',
    authority: ['P02 A-16, A-18', 'P02_OBSERVABILITY_REQUIREMENTS R-1…R-15, SL-1…SL-4'],
    failureClass: null,
  }),
]);

export const LIVE_ONLY_OPERATIONS = Object.freeze(
  HISTORICAL_PHASES.filter((p) => p.liveOnly).map((p) => p.op),
);
export const COMMON_OPERATIONS = Object.freeze(
  HISTORICAL_PHASES.filter((p) => !p.liveOnly).map((p) => p.op),
);

/**
 * HA-5 — A historical adapter adds **NO** error class. The E1–E8 taxonomy is reused unchanged
 * (mirrors the identity-failure rule FC-6: a new concern is not a new class).
 */
export const ERROR_CLASSES = Object.freeze(Object.keys(ErrorClass).sort());
export const HISTORICAL_ERROR_CLASS_ADDITIONS = Object.freeze([]);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 1. HISTORICAL CAPABILITY DECLARATION
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-6 — **Granularity vocabulary is DECLARED and VERSIONED, not enumerated here.**
 *
 * `P01_FIELD_DICTIONARY.md` §4 types `ohlcv.barInterval` as an `enum` but **never enumerates its
 * values**, and no accepted artifact defines a bar-interval vocabulary. Per **D9 N-6** labels are
 * enumerated by authority, not derived — so this contract does **not** invent `1H`, `5M`, `15M`,
 * `1W` or any other interval.
 *
 * ⚠ **`1D` is the only currently authorized and exercised value**, inherited from the accepted
 * P05-01 fixture. This is the direct analogue of **LA-31 / BD-P05-02-05** for currency, and is
 * recorded as an open item, not silently closed.
 */
export const GRANULARITY_VOCABULARY_CONTRACT = Object.freeze({
  declaredNotInvented: true,
  currentlyAuthorizedValues: Object.freeze(['1D']),
  source: 'P05-01 feed-fixtures.json interval="1D" — the only concretely represented value',
  enumeratedByAcceptedArtifact: false,
  gapDisposition: 'OPEN — recorded as BD-P05-03-03. Adding an interval requires an authority act.',
  prohibitedHere: Object.freeze(['1H', '5M', '15M', '1W', '1M', '3M', '1Y']),
  rule: 'A declared-but-unenumerated enum is a DECLARED, VERSIONED capability — never a shape test '
    + 'and never an invitation to invent values.',
});

/**
 * HA-7 — **PIT capability is declared per PC-1…PC-6. PIT storage is P08.**
 *
 * PC-2 is the load-bearing rule: **depth ≠ point-in-time**. A provider that returns only
 * latest-known values has **no** PIT capability however deep its history.
 */
export const PIT_CAPABILITY_CONTRACT = Object.freeze({
  claimMustState: Object.freeze([
    'earliestPitBoundary', 'boundaryGranularity', 'pubAndEffTimeSeparatelyPreserved',
  ]),
  depthIsNotPit: 'PC-2 — a provider returning only latest-known values has NO PIT capability, however deep its history',
  repeatabilityRequired: 'PC-3 — same boundary ⇒ same result ⇒ same snapshot identity',
  noRetroactiveAlteration: 'PC-4 — a later correction must not retroactively alter a past boundary result',
  pitEligibleFieldsOnly: 'PC-5 — only pitEligible canonical fields may be claimed under PIT',
  storageOwner: 'P08 (PC-6)',
  storageDefinedHere: false,
  queryDefinedHere: false,
});

/** HA-8 — Revision capability per RC-1…RC-2. */
export const REVISION_CAPABILITY_CONTRACT = Object.freeze({
  claimMustState: Object.freeze(['vintagesAddressable']),
  latestOnlyToken: 'LATEST_ONLY',
  rule: 'RC-2 — restatement-bearing domains (D03, D07, D08) without vintage addressability declare '
    + 'revisionCapability: LATEST_ONLY — a LIMITATION, not a PIT capability.',
  /**
   * HA-9 — **D02 is NOT restatement-bearing.** RC-2 enumerates D03, D07 and D08. A change to a
   * historical OHLCV series is an **adjustment** event (D04 / AJ-1…AJ-3), not a restatement.
   * Treating an OHLCV correction as a restatement would be a taxonomy error, not a contract choice.
   */
  restatementBearingDomains: Object.freeze(['D03', 'D07', 'D08']),
  d02IsRestatementBearing: false,
  d02CorrectionIsAn: 'ADJUSTMENT (D04 / AJ-1…AJ-3), never a restatement',
});

/**
 * HA-10 — Adjustment / corporate-action capability per RC-3…RC-5.
 *
 * ⚠ **This contract declares adjustment obligations. It computes nothing.** RC-4: adjustment
 * factors are **evidence-bearing and never silently applied**. **RC-5: the adjustment engine is
 * P08.** No adjusted-series generation, no factor computation and no corporate-action processing
 * exists in this module.
 */
export const ADJUSTMENT_CONTRACT = Object.freeze({
  bothRetained: 'AJ-1 — adjusted and unadjusted are BOTH retained; adjusted never replaces unadjusted',
  invalidWithoutBasis: 'AJ-3 / SM-11 — adjusted = true without adjustmentBasisRef is INVALID (REJECT)',
  basisRefRequiredForAdjusted: 'L-11 — adjustmentBasisRef is REQUIRED for adjusted series (D02/D04)',
  evidenceBearing: 'RC-4 — adjustment factors are evidence-bearing, never silently applied',
  engineOwner: 'P08 (RC-5)',
  engineImplementedHere: false,
  adjustedSeriesGeneratedHere: false,
  corporateActionProcessedHere: false,
});

/**
 * Build a HISTORICAL adapter capability declaration.
 *
 * HA-11 — The declaration is static and I/O-free (CD-1), in canonical vocabulary only (CD-4), and
 * contains no endpoint, hostname, account or credential (SP-2 / A-23). It extends P02 A-1…A-8 with
 * the historical block; it does **not** replace them.
 *
 * HA-12 — `entitlementRequirements` and `credentialRequirements` are **requirements**, not grants
 * and not values. Licensed depth is entitlement-bearing (**INV-10: the matrix is EMPTY**).
 *
 * @param {object} cfg
 * @returns {Readonly<Record<string, unknown>>}
 */
export function declareHistoricalCapability(cfg) {
  const required = ['provider', 'adapterId', 'adapterVersion', 'providerSchemaVersion', 'schemaVersion'];
  const missing = required.filter((k) => cfg[k] === undefined);
  if (missing.length > 0) {
    throw new ClassifiedFailure('E8', `historical capability config missing ${missing.join(', ')}`, { missing });
  }

  return Object.freeze({
    // ── P02 A-1…A-8 core — identical shape to P05-01 and P05-02, never a parallel model ──────
    'A-1': Object.freeze({ provider: cfg.provider, providerKind: 'LIVE' }),
    'A-2': Object.freeze({ adapterId: cfg.adapterId, adapterVersion: cfg.adapterVersion }),
    'A-3': cfg.providerSchemaVersion,
    'A-4': Object.freeze([cfg.schemaVersion]),
    'A-5': NAMESPACE_VERSION,
    'A-6': Object.freeze({
      domains: Object.freeze([...cfg.domains].sort()),
      modes: Object.freeze([...cfg.modes].sort()),
      granularities: Object.freeze([...cfg.granularities].sort()),
      identifierInputs: Object.freeze([...(cfg.identifierInputs ?? [])].sort()),
      liveConnectivity: true,
    }),
    'A-7': Object.freeze({
      entitlementRequired: true,
      credentialsRequired: true,
      entitlementRequirements: Object.freeze(cfg.entitlementRequirements ?? []),
      credentialRequirements: Object.freeze(cfg.credentialRequirements ?? []),
    }),
    'A-8': Object.freeze([...cfg.knownLimitations]),

    // ── P05-03 historical extension ──────────────────────────────────────────────────────────
    'HA-EXT': Object.freeze({
      contractId: HISTORICAL_CONTRACT_ID,
      contractVersion: P05_03_CONTRACT_VERSION,
      seriesStructure: SERIES_STRUCTURE_CONTRACT,
      /**
       * HA-13 — **Declared historical capability.** `historicalRanges[]` is the accepted
       * representation of partial history (**P02_PROVIDER_CAPABILITY_MODEL §6**: *"Partial
       * history → Bounded/gapped `historicalRanges[]`"*). Each entry is bounded and may declare
       * gaps explicitly.
       */
      historicalRanges: Object.freeze((cfg.historicalRanges ?? []).map((r) => Object.freeze({
        domain: r.domain,
        granularity: r.granularity,
        from: r.from,
        to: r.to,
        gaps: Object.freeze([...(r.gaps ?? [])].map((g) => Object.freeze({ ...g }))),
        completenessBasis: r.completenessBasis ?? 'DECLARED_RANGE_ONLY',
      }))),
      granularityVocabulary: GRANULARITY_VOCABULARY_CONTRACT,
      pitCapability: Object.freeze(cfg.pitCapability ?? { claimed: false }),
      revisionCapability: Object.freeze(cfg.revisionCapability ?? { vintagesAddressable: false, token: 'LATEST_ONLY' }),
      corporateActionCapability: Object.freeze(cfg.corporateActionCapability ?? {
        supportedActionTypes: Object.freeze([]),
        effectiveDatingComplete: false,
        suppliesAdjustmentFactors: false,
      }),
      adjustment: ADJUSTMENT_CONTRACT,
      deterministicReplayable: Boolean(cfg.deterministicReplayable),
      rateLimits: Object.freeze(cfg.rateLimits ?? { declared: false, value: 'UNKNOWN' }),
      transport: Object.freeze({
        // The transport is described by CLASS, never by endpoint (SP-2).
        class: cfg.transportClass ?? 'UNKNOWN',
        endpointDeclared: false,
        credentialValuePresent: false,
      }),
      internalFailoverImplemented: false,
      substitutionOwner: 'PROGRAM_GOVERNANCE',
      failoverOwner: 'P07/P17',
      orchestrationOwner: 'P05-04 (D9 N-3 — NOT AUTHORIZED)',
      orchestrationImplemented: false,
      tenantOrRegionAttributePresent: false,
    }),
  });
}

/**
 * HA-14 — Conformance of a historical capability declaration. Returns a violation list; it never
 * throws for a *content* shortfall, because the shortfall is itself the finding.
 *
 * @param {object} decl
 * @returns {{ok: boolean, violations: string[], checked: string[]}}
 */
export function assertHistoricalCapabilityConformance(decl) {
  const violations = [];
  const checked = [];
  const want = (label, cond, msg) => { checked.push(label); if (!cond) violations.push(`${label}: ${msg}`); };
  const ext = decl?.['HA-EXT'];

  want('C-1', typeof decl?.['A-1']?.provider === 'string' && decl['A-1'].provider.length > 0,
    'provider identity is REQUIRED');
  want('HA-2', PROVIDER_KINDS.includes(decl?.['A-1']?.providerKind),
    `providerKind must be one of ${PROVIDER_KINDS.join('|')}`);
  want('C-2', typeof decl?.['A-2']?.adapterId === 'string'
    && /^\d+\.\d+/.test(String(decl?.['A-2']?.adapterVersion ?? '')),
    'adapterId REQUIRED and adapterVersion must be MAJOR.MINOR at minimum (AV-2)');
  want('C-5', decl?.['A-5'] === NAMESPACE_VERSION,
    `namespaceVersion must be the one in force (${NAMESPACE_VERSION}) — CT-3`);

  const domains = decl?.['A-6']?.domains ?? [];
  want('C-6', Array.isArray(domains) && domains.length > 0 && domains.every((d) => VALID_DOMAINS.includes(d)),
    'domains[] must be a non-empty subset of D01…D10 — no new domains (ST-8)');
  want('HA-15', domains.includes('D02'),
    'a HISTORICAL OHLCV adapter must declare D02 — P01_FIELD_DICTIONARY §4 is the D02 authority');
  want('HA-6', Array.isArray(decl?.['A-6']?.granularities)
    && decl['A-6'].granularities.every((g) => GRANULARITY_VOCABULARY_CONTRACT.currentlyAuthorizedValues.includes(g)),
    'granularities[] may only contain currently AUTHORIZED values '
    + `(${GRANULARITY_VOCABULARY_CONTRACT.currentlyAuthorizedValues.join('|')}) — HA-6 prohibits inventing intervals`);

  // ── historical range declaration ───────────────────────────────────────────────────────────
  const ranges = ext?.historicalRanges ?? [];
  want('HA-13', Array.isArray(ranges) && ranges.length > 0,
    'historicalRanges[] is REQUIRED — partial history is declared, never implied (§6 gap table)');
  for (const [i, r] of ranges.entries()) {
    want(`HA-13[${i}].bounded`, typeof r?.from === 'string' && typeof r?.to === 'string',
      'a historical range must be BOUNDED (from and to) — an unbounded range is not a declaration');
    want(`HA-13[${i}].domain`, VALID_DOMAINS.includes(r?.domain), 'range domain must be D01…D10');
    want(`HA-13[${i}].granularity`,
      GRANULARITY_VOCABULARY_CONTRACT.currentlyAuthorizedValues.includes(r?.granularity),
      'range granularity must be a currently AUTHORIZED value (HA-6)');
    want(`HA-13[${i}].basis`, typeof r?.completenessBasis === 'string' && r.completenessBasis.length > 0,
      'a range must declare its completenessBasis — HA-28 reconciliation needs it');
  }

  // ── PC-1…PC-6 ─────────────────────────────────────────────────────────────────────────────
  const pit = ext?.pitCapability ?? {};
  if (pit.claimed === true) {
    for (const k of PIT_CAPABILITY_CONTRACT.claimMustState) {
      want(`PC-1.${k}`, pit[k] !== undefined,
        `a PIT claim must state ${k} (PC-1)`);
    }
  }
  want('PC-6', ext?.seriesStructure?.pitStorageDefined === false
    && ext?.seriesStructure?.pitQueryDefined === false,
    'PIT storage and PIT query are P08 (PC-6) — the declaration must not define them');

  // ── RC-1…RC-5 ─────────────────────────────────────────────────────────────────────────────
  const rev = ext?.revisionCapability ?? {};
  want('RC-1', rev.vintagesAddressable !== undefined,
    'a revision claim must state whether vintages are addressable (RC-1)');
  want('HA-9', REVISION_CAPABILITY_CONTRACT.d02IsRestatementBearing === false,
    'D02 is not restatement-bearing — an OHLCV correction is an adjustment, not a restatement');
  want('RC-5', ext?.adjustment?.engineImplementedHere === false
    && ext?.adjustment?.adjustedSeriesGeneratedHere === false,
    'the adjustment engine is P08 (RC-5) — nothing may be implemented here');

  // ── absolute boundaries ───────────────────────────────────────────────────────────────────
  want('DEP-P01-04', ext?.seriesStructure?.resolvesDepP01_04 === false,
    'DEP-P01-04 is a P08 storage decision and must remain UNRESOLVED here');
  want('HA-3', ext?.seriesStructure?.barsPerSnapshot === 1 && ext?.seriesStructure?.asOfIsScalar === true,
    'one bar per snapshot with a scalar asOf — the accepted P05-01 precedent (HA-3)');
  want('HA-34', ext?.tenantOrRegionAttributePresent === false,
    'no tenant or region attribute — D9 N-4/N-5, OI-P04-03 OPEN, IB-1…IB-5');
  want('HA-33', ext?.orchestrationImplemented === false,
    'orchestration/scheduling/retry execution is P05-04 (D9 N-3)');
  want('SP-2', ext?.transport?.endpointDeclared === false && ext?.transport?.credentialValuePresent === false,
    'no endpoint and no credential value may appear in a declaration (SP-2 / A-23)');

  return Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations), checked: Object.freeze(checked) });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 2. RANGE SEMANTICS — requested vs supported, gaps, boundaries
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-16 — **Requested range vs supported range.**
 *
 * **UC-2 prohibits** silent narrowing of the field set, substituting a nearer granularity,
 * substituting a nearer as-of, or falling back to a different source. A request that exceeds the
 * declared range therefore **fails E6** (`UNSUPPORTED_CAPABILITY`, **CE-4/CE-5**); it is never
 * silently clipped to what happens to be available.
 *
 * Pure: no I/O, no clock, no provider.
 *
 * @param {object} decl  a historical capability declaration
 * @param {{domain:string, granularity:string, from:string, to:string}} request
 * @returns {Readonly<{supported: boolean, violations: string[], clipped: boolean}>}
 */
export function evaluateRangeRequest(decl, request) {
  const violations = [];
  const ext = decl?.['HA-EXT'];
  const ranges = ext?.historicalRanges ?? [];
  const declaredGranularities = decl?.['A-6']?.granularities ?? [];

  // CE-4 — requested granularity must be declared.
  if (!declaredGranularities.includes(request.granularity)) {
    violations.push(`CE-4: granularity '${request.granularity}' is outside the declared `
      + `[${declaredGranularities.join(', ')}]`);
  }
  // HA-6 — and it must be a currently AUTHORIZED value.
  if (!GRANULARITY_VOCABULARY_CONTRACT.currentlyAuthorizedValues.includes(request.granularity)) {
    violations.push(`HA-6: granularity '${request.granularity}' is not a currently authorized value `
      + `(${GRANULARITY_VOCABULARY_CONTRACT.currentlyAuthorizedValues.join('|')})`);
  }

  const matching = ranges.filter((r) => r.domain === request.domain && r.granularity === request.granularity);
  if (matching.length === 0) {
    violations.push(`HA-13: no declared historicalRange for ${request.domain}/${request.granularity}`);
  } else {
    // UC-2 — a requested range outside the declared range fails; it is NEVER silently clipped.
    const covered = matching.some((r) => request.from >= r.from && request.to <= r.to);
    if (!covered) {
      violations.push(`UC-2: requested range [${request.from} .. ${request.to}] exceeds the declared `
        + `range(s) ${matching.map((r) => `[${r.from} .. ${r.to}]`).join(', ')} — silent narrowing is prohibited`);
    }
  }

  return Object.freeze({
    supported: violations.length === 0,
    violations: Object.freeze(violations),
    // HA-16 — the contract never clips. A caller that clips is non-conforming.
    clipped: false,
  });
}

/**
 * HA-17 — **A gap is first-class content.**
 *
 * **P02_PROVIDER_CAPABILITY_MODEL §6**: a gap is *"Bounded/gapped `historicalRanges[]`"* at the
 * capability level, and at the bar level it is an absence marker. *"A gap is never expressed as a
 * lower `quality` value."* And per the accepted absence semantics a gap is **never** a zero, an
 * empty string, a carried-forward value, or an omission of the field entirely.
 *
 * @param {string[]} requestedBarDates
 * @param {string[]} emittedBarDates
 * @returns {Readonly<{gaps: string[], gapCount: number, representation: string}>}
 */
export function declareBarGaps(requestedBarDates, emittedBarDates) {
  const emitted = new Set(emittedBarDates);
  const gaps = requestedBarDates.filter((d) => !emitted.has(d));
  return Object.freeze({
    gaps: Object.freeze([...gaps]),
    gapCount: gaps.length,
    representation: 'NOT_PROVIDED at the bar level; a declared gap bound at the range level',
    prohibitedRepresentations: Object.freeze([
      'zero', 'empty string', 'carried-forward value', 'omission of the bar entirely',
      'a lower quality value',
    ]),
  });
}

/**
 * HA-18 — **Load identity is the ordered digest of its per-bar snapshot identities.**
 *
 * ⚠ **No third identity layer.** SN-4/SN-5 preserve exactly two identifiers (the market-data
 * `snapshotId` and the engine `SNAP_*`). A load identifier is a **derived digest over existing
 * snapshot identities**, never a new identity and never an input to `snapshotId`.
 *
 * @param {string[]} perBarSnapshotIds  in bar order
 * @returns {Readonly<{loadDigest: string, barCount: number, addsIdentityLayer: boolean}>}
 */
export function buildLoadIdentity(perBarSnapshotIds) {
  return Object.freeze({
    loadDigest: canonicalDigest(Object.freeze({ ids: Object.freeze([...perBarSnapshotIds]) })),
    barCount: perBarSnapshotIds.length,
    addsIdentityLayer: false,
    derivedFrom: 'per-bar snapshotId (data-${provider}-${dataVersion}-${asOf}) — INV-2 / SN-1 / ST-2',
    inputsToSnapshotId: Object.freeze(['provider', 'dataVersion', 'asOf']),
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 3. REPRODUCIBILITY (PC-3 / PC-4) AND CORRECTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-19 — **Reproducibility: PC-3 — same boundary ⇒ same result ⇒ same snapshot identity.**
 *
 * Reproducibility is a consequence of the accepted determinism rules (D-1: identical
 * (provider, dataVersion, asOf) ⇒ identical snapshotId) plus PC-3. It is **not** a new rule and it
 * is **not** a claim about real data.
 *
 * ⚠ This asserts **synthetic contract behaviour only**. It is **CONTRACT_VALIDATION**, never
 * PROVIDER_EVIDENCE, and it does **not** satisfy the tracker exit criterion *"Historical load
 * reproducible"*, which requires a licensed real-data load (D9 N-2 / OI-P04-04).
 *
 * @param {Array<{provider:string,dataVersion:string,asOf:string}>} runs
 * @returns {Readonly<{reproducible: boolean, distinctSnapshotIds: string[], evidenceClass: string}>}
 */
export function assertReproducibility(runs) {
  const ids = runs.map((r) => {
    assertIsoUtc(r.asOf, 'asOf');
    const id = buildSnapshotId(r.provider, r.dataVersion, r.asOf);
    assertSnapshotIdConsistent(id, r);
    return id;
  });
  return Object.freeze({
    reproducible: new Set(ids).size === 1,
    distinctSnapshotIds: Object.freeze([...new Set(ids)]),
    rule: 'PC-3 — same boundary ⇒ same result ⇒ same snapshot identity; D-1 supplies the mechanism',
    evidenceClass: 'CONTRACT_VALIDATION',
    isProviderEvidence: false,
    satisfiesTrackerExitCriterion: false,
    trackerExitCriteriaNote: '⚠ "Historical load reproducible" requires a licensed real-data load — '
      + 'D9 N-2 / OI-P04-04 OPEN. Not satisfied here.',
  });
}

/**
 * HA-20 — **Corrections are additive; a past boundary result is never retroactively altered.**
 *
 * **PC-4**: a PIT claim requires that a later correction does not retroactively alter a past
 * boundary result. **ED-5 / MP-3**: corrections are additive — a wrong record is closed and a new
 * one opened; history is never rewritten.
 *
 * For D02 specifically (**HA-9**) a correction is an **adjustment** event, not a restatement.
 *
 * @param {Array<{asOf:string, digest:string, supersededBy?: string}>} boundaryResults
 * @returns {Readonly<{stable: boolean, violations: string[]}>}
 */
export function assertNoRetroactiveAlteration(boundaryResults) {
  const violations = [];
  const byAsOf = new Map();
  for (const r of boundaryResults) {
    const prior = byAsOf.get(r.asOf);
    if (prior !== undefined && prior.digest !== r.digest && prior.supersededBy === undefined) {
      violations.push(`PC-4: boundary ${r.asOf} was altered in place `
        + `(${prior.digest.slice(0, 12)}… → ${r.digest.slice(0, 12)}…) without an additive supersession`);
    }
    byAsOf.set(r.asOf, r);
  }
  return Object.freeze({
    stable: violations.length === 0,
    violations: Object.freeze(violations),
    rule: 'PC-4 + ED-5/MP-3 — corrections are additive; history is never rewritten',
    d02CorrectionKind: REVISION_CAPABILITY_CONTRACT.d02CorrectionIsAn,
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 4. ADJUSTMENT DECLARATIONS (AJ-1 / AJ-3 / SM-11 / L-11 / RC-4 / RC-5)
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-21 — **Adjustment declaration conformance.**
 *
 *   AJ-1  adjusted and unadjusted are BOTH retained; adjusted never replaces unadjusted
 *   AJ-3  `adjusted = true` without `adjustmentBasisRef` is **invalid**
 *   SM-11 the validation disposition for that case is **REJECT**
 *   L-11  `adjustmentBasisRef` is REQUIRED for adjusted series and is evidence-bearing
 *   RC-4  adjustment factors are never silently applied
 *   RC-5  ⚠ the adjustment **engine** is P08 — this function validates a *declaration* only
 *
 * @param {{adjusted: boolean, adjustmentBasisRef?: string, adjustmentFactor?: unknown,
 *          unadjustedAlsoRetained: boolean, engineAppliedSilently?: boolean}} bar
 * @returns {Readonly<{ok: boolean, violations: string[], disposition: string}>}
 */
export function assertAdjustmentDeclaration(bar) {
  const violations = [];
  if (bar.adjusted === true) {
    if (typeof bar.adjustmentBasisRef !== 'string' || bar.adjustmentBasisRef.length === 0) {
      violations.push('AJ-3 / SM-11 / L-11: adjusted = true without adjustmentBasisRef is INVALID');
    }
  }
  if (bar.adjusted === true && bar.unadjustedAlsoRetained !== true) {
    violations.push('AJ-1: adjusted must never REPLACE unadjusted — both are retained');
  }
  if (bar.adjustmentFactor !== undefined && bar.engineAppliedSilently === true) {
    violations.push('RC-4: an adjustment factor is evidence-bearing and must never be silently applied');
  }
  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations),
    disposition: violations.length === 0 ? 'ACCEPT' : 'REJECT',
    dispositionAuthority: 'SM-11 — P01_VALIDATION_RULES',
    engineOwner: 'P08 (RC-5)',
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 5. IDENTITY STABILITY ACROSS A LOAD (LC-2 / OI-08 / RF-3)
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-22 — **Identity is stable across the whole load.**
 *
 * **LC-2**: a lifecycle transition **never** mutates the canonical security ID — it changes state
 * and relationships only. So a load spanning a lifecycle transition still carries **one**
 * canonical identity. **LC-3**: a retired identity stays resolvable for historical/PIT queries,
 * which is precisely what a historical load needs.
 *
 * ⚠ **LC-6**: a state is **never inferred from absence of data**. A bar that is missing is not a
 * delisting, a merger or a supersession.
 *
 * @param {Array<{canonicalSecurityId: string, lifecycleStatus: string}>} perBarIdentities
 * @returns {Readonly<{stable: boolean, violations: string[], distinctIds: string[]}>}
 */
export function assertIdentityStability(perBarIdentities, lifecycleStates) {
  const violations = [];
  const ids = [...new Set(perBarIdentities.map((b) => b.canonicalSecurityId))];
  if (ids.length !== 1) {
    violations.push(`LC-2 / CS-5: a single-instrument load must carry ONE canonical security ID, `
      + `found ${ids.length} [${ids.join(', ')}]`);
  }
  for (const b of perBarIdentities) {
    if (!lifecycleStates.includes(b.lifecycleStatus)) {
      violations.push(`LC vocabulary: '${b.lifecycleStatus}' is not one of ${lifecycleStates.join('|')}`);
    }
  }
  return Object.freeze({
    stable: violations.length === 0,
    violations: Object.freeze(violations),
    distinctIds: Object.freeze(ids),
    rule: 'LC-2 — a transition changes state and relationships, never the immutable anchor; '
      + 'LC-3 — a retired identity stays resolvable; LC-6 — never inferred from absence',
    lifecycleVocabularyUnchanged: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 6. COMPLETENESS AND RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-23 — **The reconciliation record.**
 *
 * A load must report what was requested, what was supported, what was emitted, and what was
 * missing — with the **basis** on which completeness was judged.
 *
 * ⚠ **The contract does not invent a trading calendar.** `expectedBarCountBasis` must be supplied
 * by the caller (declared range, declared session calendar, or provider-declared count). A
 * completeness figure computed from an invented calendar would be a fabricated number.
 *
 * @param {object} input
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildLoadReconciliation(input) {
  const {
    requestedRange, supportedRange, expectedBarCount, expectedBarCountBasis,
    barsEmitted, requestedBarDates, emittedBarDates, loadDigest,
  } = input;

  if (typeof expectedBarCountBasis !== 'string' || expectedBarCountBasis.length === 0) {
    throw new ClassifiedFailure('E8',
      'HA-23: expectedBarCountBasis is REQUIRED — completeness is never computed from an invented calendar',
      { violatedRules: ['HA-23'] });
  }

  const gaps = declareBarGaps(requestedBarDates, emittedBarDates);
  const expected = typeof expectedBarCount === 'number' ? expectedBarCount : requestedBarDates.length;
  const reconciled = barsEmitted === expected - gaps.gapCount;

  return Object.freeze({
    requestedRange: Object.freeze({ ...requestedRange }),
    supportedRange: Object.freeze({ ...supportedRange }),
    expectedBarCount: expected,
    expectedBarCountBasis,
    barsEmitted,
    gaps,
    /**
     * HA-24 — **Reconciliation never silently reconciles.** A mismatch is **reported**, never
     * repaired: no auto-fill, no interpolation, no carried-forward bar.
     */
    reconciled,
    reconciliationPolicy: 'REPORT_ONLY — no auto-fill, no interpolation, no carry-forward',
    repairedAnything: false,
    loadDigest,
    completenessPct: expected === 0 ? null
      : Number((((expected - gaps.gapCount) / expected) * 100).toFixed(2)),
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 7. ABSENCE AND FAILURE SEMANTICS
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-25 — **Absence semantics reuse the accepted AVAILABILITY enumeration unchanged.**
 *
 * A missing bar or a missing element within a bar uses the same four-state vocabulary P05-01 and
 * P05-02 use. Nothing historical-specific is added, because adding one would conflate absence
 * with something else.
 */
export const ABSENCE_CONTRACT = Object.freeze({
  vocabulary: AVAILABILITY,
  vocabularyChanged: false,
  missingBar: 'NOT_PROVIDED at the bar level, plus a declared gap bound (HA-17)',
  absentElement: 'NOT_PROVIDED — the source said nothing (A-20, NL-4)',
  explicitNullElement: 'NULL_ASSERTED — the source explicitly asserted null (NL-1)',
  unentitledElement: 'WITHHELD — suppressed by entitlement, carries an entitlementRef (EV-8, NL-5)',
  prohibitedSubstitutes: Object.freeze([
    'zero', 'empty string', 'carried-forward value', 'omission of the field entirely',
    'a lower quality value', 'interpolation',
  ]),
});

/**
 * HA-26 — **Error mapping reuses E1–E8; a historical contract adds no class.**
 * Mirrors FC-6: a new concern is not a new class.
 */
export const HISTORICAL_ERROR_MAPPING = Object.freeze({
  classes: ERROR_CLASSES,
  additions: HISTORICAL_ERROR_CLASS_ADDITIONS,
  gateOrder: CLASSIFICATION_GATE_ORDER,
  gateOrderReproduced: true,
  scenarios: Object.freeze({
    granularityNotDeclared: 'E6 (CE-4)',
    rangeExceedsDeclaration: 'E6 (UC-2 / CE-5)',
    domainOutsideCapability: 'E6 (CE-1)',
    unentitledHistoricalDepth: 'E3 (EV-3 default deny)',
    authenticationFailure: 'E2',
    sourceUnreachable: 'E1 — the ONLY quality-bearing class',
    rateLimited: 'E7',
    transientFailure: 'E4',
    payloadShapeViolation: 'E5',
    unmappableIdentityOrUnit: 'E8',
    identityUnresolved: 'E8 + FC-1…FC-7 — explicit, deterministic, named, NOT a quality state',
    missingBar: 'NOT a failure — NOT_PROVIDED + declared gap (HA-17)',
  }),
});

/**
 * HA-27 — **Retry semantics at the contract level only.** The retryable set is unchanged
 * (E4, E7). ⚠ Retry **execution** — policy, backoff, budget, checkpointing — is **P05-04**
 * (**D9 N-3, NOT AUTHORIZED**). No loop, no timer and no attempt counter exists here.
 */
export const RETRY_CONTRACT = Object.freeze({
  retryableClasses: Object.freeze(['E4', 'E7']),
  prohibitedClasses: RETRY_PROHIBITED,
  overlapWithProhibited: Object.freeze([]),
  executionOwner: 'P05-04',
  executionAuthorized: false,
  authority: 'D9 N-3 — P05-04 ingestion orchestration build-out is NOT authorized',
  implementsPolicy: false,
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// 8. CANONICAL BOUNDARY, AUTHORIZATION MATRIX, SUMMARY
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * HA-28 — **The canonical output boundary is the P05-01 surface, re-exported verbatim.**
 * ⚠ `forked: false` is load-bearing: P05-03 must not create a competing canonical model.
 */
export const CANONICAL_OUTPUT_BOUNDARY = Object.freeze({
  buildSnapshot,
  buildField,
  buildSnapshotId,
  assertSnapshotIdConsistent,
  validateSnapshot,
  buildKey,
  isNamespaced,
  parseKey,
  assertC1,
  assertC2,
  assertC3,
  assertC4,
  assertCollisionGuard,
  canonicalKeyOrder,
  canonicalJson,
  canonicalDigest,
  failureRecord,
  ClassifiedFailure,
  ErrorClass,
  DISPOSITION,
  RETRY_PROHIBITED,
  CLASSIFICATION_GATE_ORDER,
  AVAILABILITY,
  MODES,
  DATA_TYPES,
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  DOMAIN_SEGMENTS,
  VALID_DOMAINS,
  owner: 'P05-01 (p05/src/{contract,namespace,identity,validate,errors,serialize}.js)',
  forked: false,
});

/**
 * HA-29 — **The D02 canonical field set is the accepted P01 dictionary, unchanged.**
 * `P01_FIELD_DICTIONARY.md` §4. Every key is built with `buildKey('ohlcv', …)` so it carries the
 * `MD:` token and the `MD:<domain>.<field>` form.
 */
export const D02_CANONICAL_FIELDS = Object.freeze({
  domain: 'D02',
  domainSegment: DOMAIN_SEGMENTS.D02[0],
  required: Object.freeze(['open', 'high', 'low', 'close', 'volume', 'barInterval', 'adjusted']),
  conditional: Object.freeze(['adjustedClose', 'adjustmentFactor', 'adjustmentBasisRef']),
  keys: Object.freeze([
    ...['open', 'high', 'low', 'close', 'volume', 'barInterval', 'adjusted',
      'adjustedClose', 'adjustmentFactor', 'adjustmentBasisRef'].map((f) => buildKey('ohlcv', f)),
  ]),
  authority: 'P01_FIELD_DICTIONARY.md §4 — D02 historical OHLCV',
  vocabularyAdded: Object.freeze([]),
  catalogOnlyNotInDictionary: Object.freeze(['sessionRef']),
  catalogDiscrepancy: '⚠ P01_SCHEMA_CATALOG.md D02 lists `sessionRef` among the canonical field '
    + 'classes but P01_FIELD_DICTIONARY.md §4 does not define it. Recorded as BD-P05-03-06; NOT '
    + 'invented here.',
});

/** HA-30 — Observability: the load record reports inputs; it sets no threshold. */
export const OBSERVABILITY_CONTRACT = Object.freeze({
  requiredInputs: Object.freeze([
    'requestedRange', 'supportedRange', 'expectedBarCount', 'expectedBarCountBasis', 'barsEmitted',
    'gaps', 'loadDigest', 'perBarProvenanceRefs', 'asOf', 'receivedAt',
  ]),
  perBarProvenance: 'RF-7 — each CanonicalField.provenance is a REFERENCE INTO the lineage block',
  setsThresholds: false,
  thresholdOwner: 'P07 (MQ-1 / MQ-2)',
  authority: 'P02_OBSERVABILITY_REQUIREMENTS R-1…R-15, SL-1…SL-4',
});

/** HA-31 — `receivedAt` is taken from the request and never recomputed (D-4 / TS-6). */
export const RECEIVED_AT_CONTRACT = Object.freeze({
  source: 'the request',
  recomputed: false,
  clockRead: false,
  authority: 'D-4 / TS-6',
});

/**
 * HA-32 — **The four-way distinction this work package is required to make explicit.**
 */
export const HISTORICAL_AUTHORIZATION_MATRIX = Object.freeze([
  Object.freeze({
    layer: 'ADAPTER_SPECIFICATION',
    what: 'The provider-neutral historical-adapter specification (docs/p05/P05_03_SPECIFICATION.md)',
    authorized: true, authority: 'D9 A-3',
  }),
  Object.freeze({
    layer: 'ADAPTER_CONTRACT',
    what: 'The executable contract/conformance surface (this module) + contract validation tests',
    authorized: true, authority: 'D9 A-3',
  }),
  Object.freeze({
    layer: 'PROVIDER_SPECIFIC_CONFIGURATION',
    what: 'Real provider identity, endpoint, schema binding, entitlement values, credentials, licensed depth',
    authorized: false,
    authority: 'D9 N-2 — OI-P04-04 OPEN (FIGI/licensing/coverage); provider selection NONE MADE; '
      + 'entitlement matrix EMPTY (INV-10); credentials NONE; P16 authority not held',
  }),
  Object.freeze({
    layer: 'LICENSED_HISTORICAL_EXECUTION',
    what: 'Acquiring licensed or deeper historical data; producing a real historical sample',
    authorized: false, authority: 'D9 N-2 — ⚠ No licensed or deeper historical acquisition',
  }),
  Object.freeze({
    layer: 'ORCHESTRATION',
    what: 'Scheduling, retry execution, checkpointing, batch execution infrastructure',
    authorized: false, authority: 'D9 N-3 — P05-04 NOT AUTHORIZED',
  }),
  Object.freeze({
    layer: 'STORAGE_AND_ADJUSTMENT',
    what: 'Series storage, PIT storage/query, adjusted-series generation, adjustment engine',
    authorized: false,
    authority: 'P08 — PC-6, RC-5, DEP-P01-04 (UNRESOLVED). P08 is NOT_STARTED',
  }),
]);

/** HA-33 — Orchestration: scheduling, retry execution, checkpointing and batch infrastructure are P05-04. */
export const ORCHESTRATION_CONTRACT = Object.freeze({
  schedulingImplemented: false,
  retryExecutionImplemented: false,
  checkpointingImplemented: false,
  batchInfrastructureImplemented: false,
  owner: 'P05-04',
  authority: 'D9 N-3 — P05-04 ingestion orchestration build-out is NOT authorized',
  loopsOrTimersPresent: false,
});

/** HA-34 — Tenant/region: no attribute, no default, no inference. */
export const TENANT_REGION_CONTRACT = Object.freeze({
  attributePresent: false,
  defaultInvented: false,
  inferred: false,
  authority: 'D9 N-4 / N-5 — OI-P04-03 OPEN, bounded by IB-1…IB-5. Lifting IB-1 requires an explicit A1 act',
});

/**
 * HA-35 — Summary of the contract for evidence purposes. Deterministic; no clock.
 */
export function contractSummary() {
  return Object.freeze({
    contractId: HISTORICAL_CONTRACT_ID,
    contractVersion: P05_03_CONTRACT_VERSION,
    phases: Object.freeze(HISTORICAL_PHASES.map((p) => Object.freeze({
      order: p.order, phase: p.phase, op: p.op, liveOnly: p.liveOnly,
      performsIO: p.performsIO, failureClass: p.failureClass,
    }))),
    liveOnlyOperations: LIVE_ONLY_OPERATIONS,
    commonOperations: COMMON_OPERATIONS,
    soleIngress: 'snapshot(request) — P02 B-4 / AD-2; the phases above are internal, not a second ingress',
    rulePrefix: 'HA-',
    ruleCount: 35,
    errorClasses: ERROR_CLASSES,
    errorClassAdditions: HISTORICAL_ERROR_CLASS_ADDITIONS,
    retryableClasses: RETRY_CONTRACT.retryableClasses,
    granularityVocabulary: GRANULARITY_VOCABULARY_CONTRACT,
    seriesStructure: SERIES_STRUCTURE_CONTRACT,
    authorizationMatrix: HISTORICAL_AUTHORIZATION_MATRIX,
    providerSelected: false,
    credentialsProvisioned: false,
    networkUsed: false,
    licensedAcquisitionPerformed: false,
    realHistoricalSampleProduced: false,
    claimsAuthenticatedIngestionWorks: false,
    claimsRealDataLoadReproducible: false,
    trackerExitCriterionSatisfied: false,
    canonicalModelForked: false,
    p05_04Started: false,
    p08WorkPerformed: false,
    tenantOrRegionAttributePresent: false,
  });
}
