/**
 * P05-02 — OFFLINE TEST DOUBLE for the live market-data adapter contract.
 *
 * ⚠ THIS IS A TEST DOUBLE, NOT A PROVIDER ADAPTER.
 *   · It contacts nothing. It performs no I/O of any kind beyond reading committed fixtures.
 *   · `mocklive` is NOT an issuance from the governed provider-identity register
 *     (`p05/fixtures/provider-register.json`, which is left UNMODIFIED with exactly one
 *     issued identity, `localfix`). PG-1 governs real sources.
 *   · Results produced through this double are **CONTRACT VALIDATION ONLY**. They are NOT
 *     live-provider evidence, NOT provider integration tests, and do NOT establish that
 *     "authenticated ingestion works". The tracker's P05-02 exit criteria remain UNMET.
 *
 * PURPOSE
 *   To prove the P05-02 contract (`src/liveAdapterContract.js`) is *locally testable*: that an
 *   implementation satisfying the phase decomposition, gate order, canonical output boundary,
 *   namespace, identity, provenance, error-taxonomy and redaction rules can be exercised
 *   deterministically without a provider.
 *
 * P05-01 INTEGRATION
 *   The canonical envelope, namespace, identity, provenance, validation and error surfaces are
 *   imported verbatim from the P05-01 package. Nothing is forked (LA-27). Identity is resolved
 *   through the SAME `identity-fixtures.json` mapping register P05-01 uses, so a P05-02 adapter
 *   and the P05-01 local feed resolve identity identically.
 *
 * DETERMINISM — no wall-clock, no randomness, no environment, no network.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildKey, NAMESPACE_VERSION } from '../src/namespace.js';
import { buildField, buildSnapshot, computeCompletenessPct } from '../src/contract.js';
import { validateSnapshot } from '../src/validate.js';
import { ClassifiedFailure } from '../src/errors.js';
import { canonicalDecimal, canonicalDigest, assertIsoUtc } from '../src/serialize.js';
import { MappingRegister, buildIdentityRef } from '../src/identity.js';
import {
  declareLiveCapability,
  evaluateEntitlement,
  freshnessInput,
  buildAttemptRecord,
  runAdapterPipeline,
  ADAPTER_CONTRACT_ID,
  P05_02_CONTRACT_VERSION,
} from '../src/liveAdapterContract.js';

const here = dirname(fileURLToPath(import.meta.url));
const p05Root = join(here, '..');
const read = (name) => JSON.parse(readFileSync(join(p05Root, 'fixtures', name), 'utf8'));

const CONTRACT_FX = read('adapter-contract-fixtures.json');
const IDENTITY_FX = read('identity-fixtures.json');

/**
 * A FIXED ingest instant, chosen to be at or after the latest fixture `obsTime`
 * (2026-03-04T09:36:00.000Z) so SM-9 does not correctly reject it. Deliberately a literal —
 * never `Date.now()` (D-4 stamps `receivedAt` once at the ingest boundary; TS-6 forbids
 * recomputation or back-filling).
 */
export const P05_02_RECEIVED_AT = '2026-03-04T10:00:00.000Z';

const PRICE_PRECISION = 4;

/** The declared provider wire schema, taken from the fixture (A-3 / A-13). */
const QUOTE_WIRE = Object.freeze(CONTRACT_FX.providerWireSchema.QUOTE_WIRE);

/**
 * Three distinct absence semantics, all from the accepted P01 AVAILABILITY enum. Conflating any
 * two is prohibited: silence, an explicit null and an entitlement suppression are different facts.
 */
const ABSENCE = Object.freeze({ SILENT: 'NOT_PROVIDED', EXPLICIT_NULL: 'NULL_ASSERTED' });

const WIRE_TYPES = Object.freeze({
  string: (v) => typeof v === 'string' && v.length > 0,
  'numeric-string': (v) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v),
  integer: (v) => Number.isInteger(v),
  'iso-utc': (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v),
});

/**
 * A-13 — validate the provider-native payload against the DECLARED wire schema.
 * A presence or type violation is E5 (a REJECTION), evaluated BEFORE any mapping is attempted,
 * so E5 is never confused with E8 (CL-6).
 *
 * ⚠ REQUIRED vs OPTIONAL: an absent OPTIONAL element is provider SILENCE and maps to
 *   NOT_PROVIDED (A-20 / NL-4) — it is a data condition, NOT a contract condition, so it must not
 *   be reported as E5. An absent REQUIRED element IS a schema violation (IC-5).
 *
 * ⚠ RD-4 / M-3 — the message names the **declared schema element** and the rule violated. It
 * must not echo a native value or a native error string into a contract-level record.
 */
function assertWireShape(payload, schema, fixtureId) {
  const missing = [];
  const wrongType = [];
  for (const [key, type] of Object.entries(schema.required)) {
    const v = payload[key];
    if (v === undefined || v === null) { missing.push(key); continue; }
    if (!WIRE_TYPES[type](v)) wrongType.push(`${key} (expected ${type})`);
  }
  // OPTIONAL elements are type-checked only when the source actually supplies them.
  for (const [key, type] of Object.entries(schema.optional ?? {})) {
    const v = payload[key];
    if (v === undefined || v === null) continue;
    if (!WIRE_TYPES[type](v)) wrongType.push(`${key} (expected ${type})`);
  }
  if (missing.length > 0 || wrongType.length > 0) {
    throw new ClassifiedFailure('E5',
      `fixture ${fixtureId} violates the declared provider wire schema` +
      `${missing.length > 0 ? ` — missing ${missing.join(', ')}` : ''}` +
      `${wrongType.length > 0 ? ` — wrong type: ${wrongType.join('; ')}` : ''}`,
      { fixtureId, missingKeys: missing, wrongType, violatedRules: ['A-13', 'IC-5'] });
  }
}

/** Identity resolution through the SAME P04-shaped register P05-01 uses (LA-27, I-1…I-3). */
function resolveIdentity(canonicalSecurityId, asOf, venueRef) {
  const register = new MappingRegister({
    version: IDENTITY_FX.mappingRegisterVersion,
    records: IDENTITY_FX.mappings,
  });
  const sec = IDENTITY_FX.securities.find((s) => s.canonicalSecurityId === canonicalSecurityId);
  if (sec === undefined) {
    throw new ClassifiedFailure('E8', `unknown canonical security '${canonicalSecurityId}'`,
      { canonicalSecurityId, violatedRules: ['RF-1'] });
  }
  let resolved;
  try {
    resolved = register.resolveCanonicalToCompany(canonicalSecurityId, asOf);
  } catch (err) {
    if (err.name === 'IdentityResolutionFailure') {
      // FC-1…FC-7 — explicit, deterministic, named, NOT a quality state.
      throw new ClassifiedFailure('E8', `${err.message}`, {
        canonicalSecurityId, unresolvedElement: err.unresolvedElement, direction: err.direction,
        asOf, violatedRules: [...err.rules], identityFailClosed: true, isQualityState: false,
      });
    }
    throw err;
  }
  return buildIdentityRef({
    canonicalSecurityId: sec.canonicalSecurityId,
    canonicalIssuerId: sec.canonicalIssuerId,
    instrumentType: sec.instrumentType,
    lifecycleStatus: sec.lifecycleStatus,
    validFrom: sec.validFrom,
    validTo: sec.validTo ?? undefined,
    externalIdentifiers: sec.externalIdentifiers,
    venueRef,
    resolvedMapping: { companyId: resolved.companyId, mappingVersion: resolved.mappingVersion },
  });
}

function buildLineage(cfg, receivedAt, identityMappingVersion, provenanceRefs) {
  return {
    sourceRef: cfg.sourceRef,
    adapterId: cfg.adapterId,
    adapterVersion: cfg.adapterVersion,
    transformationChainRef: cfg.transformationChainRef,
    receivedAt,
    namespaceVersion: NAMESPACE_VERSION,
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}),
    ...(provenanceRefs.length > 0 ? { fieldProvenance: Object.freeze([...provenanceRefs].sort()) } : {}),
  };
}

/**
 * THE OFFLINE TEST DOUBLE.
 *
 * Emits through the SAME sole ingress as P05-01 — `snapshot(request)` (P02 B-4 / AD-2). The
 * phase methods below are the adapter's internal decomposition, not a second public contract.
 */
export class MockLiveAdapter {
  /**
   * @param {{
   *   entitlementFixture?: string, authFixture?: string, forceError?: string,
   *   payloadOverride?: object, leakNative?: boolean
   * }} [overrides]
   */
  constructor(overrides = {}) {
    this.fx = CONTRACT_FX;
    this.cfg = Object.freeze({ ...CONTRACT_FX.testDouble });
    this.overrides = Object.freeze({ ...overrides });
    this.capability = declareLiveCapability(this.cfg);
    this.failureLog = [];
    this.attemptLog = [];
  }

  // ── Phase 1: declare (static, I/O-free — CD-1) ──────────────────────────────────────────
  declare() { return this.capability; }

  // ── Phase 2: preflight — BEFORE any provider call (A-10, CE-1…CE-8, UC-1…UC-5) ─────────
  preflight(request, decl = this.capability) {
    const cap = decl['A-6'];
    if (!cap.domains.includes(request.domain)) {
      throw new ClassifiedFailure('E6',
        `domain ${request.domain} is outside the declared capability [${cap.domains.join(', ')}]`,
        { requestedDomain: request.domain, violatedRules: ['CE-1', 'UC-1', 'UC-3'] });
    }
    if (!cap.modes.includes(request.mode)) {
      throw new ClassifiedFailure('E6',
        `mode ${request.mode} is outside the declared capability [${cap.modes.join(', ')}]`,
        { requestedMode: request.mode, violatedRules: ['CE-3', 'A-24', 'UC-2'] });
    }
    if (request.granularity !== undefined && !cap.granularities.includes(request.granularity)) {
      throw new ClassifiedFailure('E6',
        `granularity ${request.granularity} is outside the declared capability`,
        { requestedGranularity: request.granularity, violatedRules: ['CE-4'] });
    }
    // CE-7 — the identity input kind must be declared. ⚠ OI-09: FIGI is authoritative;
    // OI-P04-04 (FIGI sourcing/licensing/coverage) remains OPEN and is NOT resolved here.
    if (request.identifierInput !== undefined && !cap.identifierInputs.includes(request.identifierInput)) {
      throw new ClassifiedFailure('E6',
        `identity input '${request.identifierInput}' is outside the declared identifierInputs`,
        { identifierInput: request.identifierInput, violatedRules: ['CE-7'] });
    }
    return true;
  }

  // ── Phase 3: entitlement — default deny, before acquisition (EV-1…EV-8) ────────────────
  checkEntitlement(request) {
    const id = request.entitlementFixture ?? this.overrides.entitlementFixture ?? 'ENT-0001';
    const fx = this.fx.entitlementFixtures.find((f) => f._fixtureId === id) ?? {};
    return {
      status: fx.status,
      entitlementRef: fx.entitlementRef ?? request.entitlementRef ?? null,
      withheldFields: fx.withheldFields ?? [],
    };
  }

  // ── Phase 4: authenticate — the credential VALUE never crosses (SP-5, A-23) ────────────
  authenticate(request) {
    const id = request.authFixture ?? this.overrides.authFixture ?? 'AUTH-OK';
    const fx = this.fx.authFixtures.find((f) => f._fixtureId === id)
      ?? this.fx.authFixtures[0];
    // ⚠ Only a `credentialRef` is returned. No key, token, secret or endpoint is present,
    // read, derived or logged anywhere in this method.
    return Object.freeze({
      status: fx.status,
      credentialRef: fx.credentialRef,
      valuePresent: false,
      endpointPresent: false,
    });
  }

  // ── Phase 5: fetch — the ONLY phase that would perform I/O in a real adapter ───────────
  //
  // ⚠ Here it reads committed fixture bytes. In a real live adapter this is where a provider
  //   call would occur, and that is precisely what D9 N-1 does NOT authorize.
  fetch(request) {
    if (this.overrides.payloadOverride !== undefined) {
      return { payload: this.overrides.payloadOverride, providerSchemaVersion: this.cfg.providerSchemaVersion };
    }
    const forced = this.overrides.forceError ?? request.forceError;
    if (forced === 'E1') {
      throw new ClassifiedFailure('E1', 'source unreachable — the ONLY quality-bearing class',
        { fixtureId: request.fixtureId, violatedRules: ['E1'] });
    }
    if (forced === 'E4') {
      throw new ClassifiedFailure('E4', 'transient failure — retryable, rejection after policy exhaustion',
        { fixtureId: request.fixtureId, retryable: true, violatedRules: ['E4'] });
    }
    if (forced === 'E7') {
      throw new ClassifiedFailure('E7', 'rate limit exceeded — retryable',
        { fixtureId: request.fixtureId, retryable: true, violatedRules: ['E7'] });
    }
    const payload = this.fx.responses.find((r) => r._fixtureId === request.fixtureId);
    if (payload === undefined) {
      throw new ClassifiedFailure('E5', `no fixture response for '${request.fixtureId}'`,
        { fixtureId: request.fixtureId, violatedRules: ['A-13'] });
    }
    return Object.freeze({ payload, providerSchemaVersion: this.cfg.providerSchemaVersion });
  }

  // ── Phase 6: normalize — declared wire-schema validation (A-13, IC-4, IC-5) ────────────
  normalize(fetched, request) {
    const payload = fetched.payload;
    const fixtureId = request.fixtureId ?? payload._fixtureId;
    assertWireShape(payload, QUOTE_WIRE, fixtureId);

    // IC-4 — elements the adapter does not consume are recorded as IGNORED, never silently
    // discarded. The leading-underscore keys are fixture bookkeeping, not provider content.
    const consumed = new Set([...Object.keys(QUOTE_WIRE.required), ...Object.keys(QUOTE_WIRE.optional ?? {})]);
    const ignoredElements = Object.keys(payload).filter((k) => !consumed.has(k) && !k.startsWith('_')).sort();

    return Object.freeze({ wire: Object.freeze({ ...payload }), fixtureId, ignoredElements: Object.freeze(ignoredElements) });
  }

  // ── Phase 7: map — DECLARED mapping, namespace applied here (A-14, A-15, MD-1…MD-8) ────
  map(normalized, request) {
    const p = normalized.wire;
    const fixtureId = normalized.fixtureId;
    const asOf = p.obsTime;
    assertIsoUtc(asOf, 'obsTime');

    // T-6 — a timestamp whose slot cannot be established is E8, never a guess (T-1: the five
    // P01 times are never collapsed).
    if (p._ambiguousTimestampSlot === true) {
      throw new ClassifiedFailure('E8',
        `fixture ${fixtureId}: provider timestamp cannot be assigned to a canonical time slot`,
        { fixtureId, violatedRules: ['T-1', 'T-2', 'T-6'] });
    }

    // C-1 / C-2 — an unmappable currency is E8; never defaulted, never inferred from the venue.
    const ccy = p.pxCcy;
    if (typeof ccy !== 'string' || !/^[A-Z]{3}$/.test(ccy)) {
      throw new ClassifiedFailure('E8',
        `fixture ${fixtureId}: currency is not ISO-4217 and cannot be established`,
        { fixtureId, violatedRules: ['C-1', 'C-2', 'C-3'] });
    }

    // VN-5 / PN-2 — the provider's own market code is NEVER venue identity. `venueRef` comes
    // from the P04-resolved venue reference carried by the request.
    const venueRef = request.venueRef ?? IDENTITY_FX.venues[0].micCode;
    const identity = resolveIdentity(request.canonicalSecurityId, asOf, venueRef);

    // LA-18 leak mode 2 — a native token smuggled into a PROVENANCE STRING while every field key
    // stays correctly namespaced. C1…C4 would NOT catch this; only the native-vocabulary scan
    // does. This is the case P02 M-4 prohibits ("never smuggled through in a free-form bag,
    // extras map, metadata blob or provenance string") and RD-4 forbids in a contract record.
    const prov = this.overrides.leakInProvenance === true
      ? `lineage:${this.cfg.sourceRef}:${fixtureId}:${this.fx.leakageFixture.leakedCanonicalKey}`
      : `lineage:${this.cfg.sourceRef}:${fixtureId}`;

    // Entitlement: PARTIAL yields WITHHELD markers with an entitlementRef (EV-8, RD-1, NL-5).
    const entOutcome = evaluateEntitlement(this.checkEntitlement(request));
    const withheld = new Set(entOutcome.withheldFields.map((f) => f));
    const entitlementRef = request.entitlementRef ?? this.checkEntitlement(request).entitlementRef ?? null;

    /** @type {Record<string, unknown>} */
    const fields = {};

    // LA-18 / A-19 / M-3 — the DELIBERATELY NON-CONFORMING variant, exercised only to prove the
    // leakage guard detects a violation. Never presented as conforming.
    if (this.overrides.leakNative === true) {
      const leakedKey = this.fx.leakageFixture.leakedCanonicalKey;
      fields[leakedKey] = { key: leakedKey, value: p.qBid, dataType: 'decimal', availability: 'PRESENT', provenance: prov, pitEligible: false };
    }

    for (const entry of this.fx.fieldMap) {
      const key = buildKey(entry.domainSegment, entry.fieldSegment);
      if (fields[key] !== undefined) continue;
      const raw = p[entry.native];

      // EV-8 / RD-1 — an unentitled field is WITHHELD with an entitlementRef, never absent and
      // never conflated with NOT_PROVIDED.
      if (withheld.has(entry.fieldSegment)) {
        fields[key] = buildField({
          key, dataType: entry.dataType, availability: 'WITHHELD',
          precision: entry.precision ?? undefined,
          observationTime: asOf, provenance: prov, pitEligible: entry.pitEligible,
          entitlementRef,
        });
        continue;
      }

      // NL-1 / NL-4 — three distinct states, never conflated:
      //   value present  → PRESENT
      //   explicit null  → NULL_ASSERTED (the source asserted null)
      //   key absent     → NOT_PROVIDED  (the source said nothing)
      const present = raw !== undefined && raw !== null;
      const availability = present ? 'PRESENT'
        : (Object.prototype.hasOwnProperty.call(p, entry.native) ? ABSENCE.EXPLICIT_NULL : ABSENCE.SILENT);

      if (entry.dataType === 'decimal') {
        fields[key] = buildField({
          key, dataType: 'decimal', availability,
          value: present ? this.mapDecimal(raw, entry.precision, key, fixtureId) : undefined,
          currency: present ? ccy : undefined,
          precision: entry.precision,
          monetary: present ? 'yes' : 'no', dimension: 'dimensionless',
          observationTime: asOf, provenance: prov, pitEligible: entry.pitEligible,
        });
      } else {
        fields[key] = buildField({
          key, dataType: 'integer', availability,
          value: present ? raw : undefined,
          dimension: 'dimensionless',
          observationTime: asOf, provenance: prov, pitEligible: entry.pitEligible,
        });
      }
    }

    // price.venueRef — R (required) in P01_FIELD_DICTIONARY §3; points at D10.
    const venueKey = buildKey('price', 'venueRef');
    fields[venueKey] = buildField({
      key: venueKey, dataType: 'identifier', availability: 'PRESENT', value: venueRef,
      dimension: 'dimensionless', effectiveTime: asOf, provenance: prov, pitEligible: true,
    });

    const contractedFieldCount = this.fx.fieldMap.length + 1;
    const completenessPct = computeCompletenessPct(fields, contractedFieldCount);
    const quality = completenessPct < 100 ? 'partial' : 'good';

    const provenanceRefs = [...new Set(Object.values(fields).map((f) => f.provenance))].sort();
    const snapshot = buildSnapshot({
      provider: this.cfg.provider,
      dataVersion: this.dataVersionFor(p),
      schemaVersion: this.cfg.schemaVersion,
      asOf,
      receivedAt: request.receivedAt,
      mode: request.mode,
      quality,
      completenessPct,
      domain: request.domain,
      identity,
      identityMappingVersion: identity.identityMappingVersion,
      lineage: buildLineage(this.cfg, request.receivedAt, identity.identityMappingVersion, provenanceRefs),
      fields,
    });

    return Object.freeze({
      snapshot, quality, completenessPct,
      freshness: freshnessInput({ asOf, receivedAt: request.receivedAt }),
    });
  }

  // ── Phase 8: validate — the P05-01 validator, verbatim (LA-27) ─────────────────────────
  validate(snapshot) { return validateSnapshot(snapshot); }

  // ── Phase 9: emit ─────────────────────────────────────────────────────────────────────
  emit(snapshot, record) {
    const receipt = Object.freeze({
      snapshotId: snapshot.snapshotId,
      digest: canonicalDigest(snapshot),
      contractId: ADAPTER_CONTRACT_ID,
      contractVersion: P05_02_CONTRACT_VERSION,
      adapterId: this.cfg.adapterId,
      adapterVersion: this.cfg.adapterVersion,
    });
    this.attemptLog.push(record);
    return Object.freeze({ receipt });
  }

  /** DV-1/DV-2 — content vintage, derived deterministically. No wall-clock (D-3). */
  dataVersionFor(payload) {
    const stripped = JSON.parse(JSON.stringify(payload, (k, v) => (k.startsWith('_') ? undefined : v)));
    return `v${canonicalDigest(stripped).slice(0, 16)}`;
  }

  mapDecimal(raw, precision, fieldKey, fixtureId) {
    try {
      return canonicalDecimal(raw, precision);
    } catch (err) {
      throw new ClassifiedFailure('E8',
        `fixture ${fixtureId}: cannot map a provider-native numeric to ${fieldKey} at precision ${precision}`,
        { fixtureId, offendingFieldSlot: fieldKey, violatedRules: [...(err.rules ?? []), 'NP-2', 'NP-3'] });
    }
  }

  /** E1 → snapshot with EMPTY fields and quality 'unavailable' (ST-9 permits empty only here). */
  emptySnapshot(request, ctx) {
    const asOf = request.asOf ?? '1970-01-01T00:00:00.000Z';
    return buildSnapshot({
      provider: this.cfg.provider,
      dataVersion: `e1-${request.fixtureId ?? 'unknown'}`,
      schemaVersion: this.cfg.schemaVersion,
      asOf,
      receivedAt: request.receivedAt,
      mode: request.mode,
      quality: 'unavailable',
      completenessPct: 0,
      domain: request.domain,
      lineage: buildLineage(this.cfg, request.receivedAt, undefined, []),
      fields: {},
    });
  }

  /**
   * THE SOLE INGRESS (P02 B-4 / AD-2) — same shape as the P05-01 local feed's `snapshot()`,
   * which is what makes the two adapters substitutable behind `MarketDataSource<T>` (B-3).
   */
  snapshot(request) {
    const result = runAdapterPipeline(this, request);
    if (result.ok === false) this.failureLog.push(result.record);
    return result;
  }
}

/** Build a request against the offline double. Every value is a fixed literal (D-3). */
export function mockRequest(over = {}) {
  return Object.freeze({
    domain: 'D01',
    mode: 'LIVE',
    fixtureId: 'LQ-0001',
    canonicalSecurityId: 'CS-LOCAL-0001',
    venueRef: 'XSYN',
    identifierInput: 'CANONICAL_SECURITY_ID',
    requestedFields: ['bid', 'ask', 'last', 'bidSize', 'askSize', 'venueRef'],
    receivedAt: P05_02_RECEIVED_AT,
    entitlementFixture: 'ENT-0001',
    entitlementRef: 'ENT-REQ-D01-QUOTE',
    authFixture: 'AUTH-OK',
    ...over,
  });
}

export { CONTRACT_FX, IDENTITY_FX, QUOTE_WIRE };
