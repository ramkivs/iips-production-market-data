/**
 * P05-01 — LOCAL DETERMINISTIC MARKET FEED ADAPTER
 *
 * Authority: docs/p02/P02_PROVIDER_ABSTRACTION_CONTRACT.md  A-1…A-25, B-1…B-6, D-1…D-6, S-1…S-9
 *            docs/p02/P02_ERROR_TAXONOMY.md                 E1–E8, CL-1…CL-7, PR-1…PR-9
 *            docs/p02/P02_PROVIDER_MAPPING_RULES.md         provider-native → canonical
 *            docs/p01/P01_FIELD_DICTIONARY.md §3, §4, §12   canonical key vocabulary
 *            docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md      identity resolution, FC-1…FC-7
 *
 * SCOPE (D9 §3 A-1): P05-01 local deterministic feed ONLY.
 *   ⚠ NO live provider, NO network, NO credential, NO entitlement, NO connectivity.
 *   ⚠ P05-02 live execution and P05-03 licensed historical depth are NOT performed here.
 *   ⚠ P05-04 orchestration (scheduling/retries/idempotent checkpointing) is NOT implemented.
 *
 * DETERMINISM (D-3): mapping is a PURE FUNCTION of the provider payload plus declared
 * configuration. The only non-payload input is the single `receivedAt` supplied by the caller,
 * stamped once at the ingest boundary and never recomputed (D-4, TS-6).
 */

import { ClassifiedFailure, DISPOSITION, ErrorClass, failureRecord, RETRY_PROHIBITED } from './errors.js';
import {
  buildField, buildSnapshot, buildSnapshotId, computeCompletenessPct,
} from './contract.js';
import { buildKey, DOMAIN_SEGMENTS, NAMESPACE_VERSION } from './namespace.js';
import { assertIsoUtc, canonicalDecimal, canonicalDigest, ContractViolation } from './serialize.js';
import { buildIdentityRef, MappingRegister } from './identity.js';

/** Declared price decimal scale (NP-1). Fixed, not inferred. */
const PRICE_PRECISION = 2;
const RATIO_PRECISION = 4;

/**
 * Provider-native payload collections, in a FIXED search order (D-5: ordering is canonical
 * and specified, never implementation-incidental). `malformed` holds provider-native payloads
 * that violate the declared wire schema — they take the same mapping path as good payloads.
 */
const PROVIDER_NATIVE_COLLECTIONS = Object.freeze(['quotes', 'closes', 'valuations', 'ohlcv', 'malformed']);

/**
 * Static declaration obligations A-1…A-8. No I/O, no wall-clock.
 * @param {{provider:string, adapterId:string, adapterVersion:string,
 *          providerSchemaVersion:string, schemaVersion:string, sourceRef:string,
 *          transformationChainRef:string}} cfg
 */
export function declareCapability(cfg) {
  return Object.freeze({
    'A-1': Object.freeze({ provider: cfg.provider, providerKind: 'LOCAL_FIXTURE' }),
    'A-2': Object.freeze({ adapterId: cfg.adapterId, adapterVersion: cfg.adapterVersion }), // AV-1, AV-2 MAJOR.MINOR
    'A-3': cfg.providerSchemaVersion,
    'A-4': Object.freeze([cfg.schemaVersion]),
    'A-5': NAMESPACE_VERSION, // OI-10 token is now RECORDED (MD:), so this is concrete
    'A-6': Object.freeze({
      domains: Object.freeze(['D01', 'D02', 'D10']),
      modes: Object.freeze(['LIVE', 'SNAPSHOT']),
      // ⚠ PIT deliberately NOT declared: PIT storage is P08 and not started.
      granularities: Object.freeze(['1D']),
      liveConnectivity: false,
    }),
    'A-7': Object.freeze({ entitlementRequired: false, credentialsRequired: false }),
    // A-8: known limitations are first-class content, not omissions.
    'A-8': Object.freeze([
      'Local synthetic fixture source only — no live provider, no network access.',
      'PIT mode not supported: PIT storage is P08, which is NOT_STARTED.',
      'D03–D09 not served by this feed.',
      'No adjusted series: adjustment modelling is P08.',
      'Per-record tenant/region governance NOT applied — OI-P04-03 open, bounded by IB-1.',
    ]),
  });
}

/**
 * A-10 / CL-4 — pre-flight capability check, BEFORE any provider call.
 * An unsupported request fails as E6; it is never silently narrowed, substituted or
 * best-effort served (A-24: no mode inference).
 */
function preflight(capability, request) {
  if (!capability['A-6'].domains.includes(request.domain)) {
    throw new ClassifiedFailure('E6',
      `domain ${request.domain} is outside the declared capability [${capability['A-6'].domains.join(', ')}]`,
      { requestedDomain: request.domain });
  }
  if (!capability['A-6'].modes.includes(request.mode)) {
    throw new ClassifiedFailure('E6',
      `mode ${request.mode} is outside the declared capability [${capability['A-6'].modes.join(', ')}]`,
      { requestedMode: request.mode });
  }
  if (request.granularity !== undefined && !capability['A-6'].granularities.includes(request.granularity)) {
    throw new ClassifiedFailure('E6',
      `granularity ${request.granularity} is outside the declared capability`, { requestedGranularity: request.granularity });
  }
  return true;
}

/**
 * Declared provider wire schema (A-3 / A-13). Types are checked BEFORE mapping so that a
 * payload violating the provider's own schema is E5, while a well-formed payload that cannot
 * be mapped to the canonical contract is E8 (CL-6: E8 is evaluated AFTER response validation).
 */
const WIRE_TYPES = Object.freeze({
  string: (v) => typeof v === 'string' && v.length > 0,
  'numeric-string': (v) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v),
  integer: (v) => Number.isInteger(v),
  'iso-utc': (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v),
  date: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  boolean: (v) => typeof v === 'boolean',
  array: (v) => Array.isArray(v),
});

/**
 * A-13 — validate the provider-native payload against the declared provider schema.
 * A presence OR type violation is E5 MALFORMED_RESPONSE: a REJECTION, never a quality state.
 * @param {Record<string, unknown>} payload
 * @param {Record<string, keyof typeof WIRE_TYPES>} schema  key -> declared wire type
 * @param {string} fixtureId
 */
function assertWireShape(payload, schema, fixtureId) {
  const missing = [];
  const wrongType = [];
  for (const [key, type] of Object.entries(schema)) {
    const v = payload[key];
    if (v === undefined || v === null) { missing.push(key); continue; }
    if (!WIRE_TYPES[type](v)) wrongType.push(`${key} (expected ${type}, got ${JSON.stringify(v)})`);
  }
  if (missing.length > 0 || wrongType.length > 0) {
    throw new ClassifiedFailure('E5',
      `fixture ${fixtureId} violates the declared provider wire schema` +
      `${missing.length > 0 ? ` — missing ${missing.join(', ')}` : ''}` +
      `${wrongType.length > 0 ? ` — wrong type: ${wrongType.join('; ')}` : ''}`,
      { fixtureId, missingKeys: missing, wrongType });
  }
}

/** Declared wire schemas per provider-native collection. */
const QUOTE_WIRE = Object.freeze({
  sym: 'string', venue: 'string', tradePrice: 'numeric-string',
  ccy: 'string', quoteTs: 'iso-utc', canonicalSecurityId: 'string',
});
const CLOSE_WIRE = Object.freeze({
  sym: 'string', venue: 'string', officialClose: 'numeric-string', prevClose: 'numeric-string',
  vol: 'integer', ccy: 'string', sessionDate: 'date', canonicalSecurityId: 'string',
});
const VALUATION_WIRE = Object.freeze({
  sym: 'string', pe: 'numeric-string', canonicalSecurityId: 'string', asOfTs: 'iso-utc',
});
const OHLCV_WIRE = Object.freeze({
  sym: 'string', interval: 'string', bars: 'array', ccy: 'string', canonicalSecurityId: 'string',
});
const BAR_WIRE = Object.freeze({
  barDate: 'date', o: 'numeric-string', h: 'numeric-string', l: 'numeric-string',
  c: 'numeric-string', v: 'integer', adj: 'boolean',
});

/**
 * Parse a provider-native price string, surfacing NP-2/NP-3 as E8 (a mapping failure,
 * distinct from a malformed response — CL-6).
 */
function mapDecimal(raw, precision, fieldKey, fixtureId) {
  try {
    return canonicalDecimal(raw, precision);
  } catch (err) {
    if (err instanceof ContractViolation) {
      throw new ClassifiedFailure('E8',
        `fixture ${fixtureId}: cannot map '${raw}' to ${fieldKey} at precision ${precision} — ${err.message}`,
        { fixtureId, offendingFieldSlot: fieldKey, violatedRules: [...err.rules] });
    }
    throw err;
  }
}

/**
 * Resolve the identity reference for a fixture through the P04-shaped mapping register.
 * FC-1: an unmapped canonical identity FAILS EXPLICITLY — never coerced.
 */
function resolveIdentity(securities, register, canonicalSecurityId, asOf, venueRef) {
  const sec = securities.find((s) => s.canonicalSecurityId === canonicalSecurityId);
  if (sec === undefined) {
    throw new ClassifiedFailure('E8',
      `fixture references unknown canonical security '${canonicalSecurityId}'`,
      { canonicalSecurityId, violatedRules: ['RF-1'] });
  }
  let resolved = null;
  try {
    resolved = register.resolveCanonicalToCompany(canonicalSecurityId, asOf);
  } catch (err) {
    if (err.name === 'IdentityResolutionFailure') {
      // FC-1 / FC-3 / FC-4 / FC-5 / FC-7: explicit, deterministic, named, NOT a quality state,
      // and never written into a snapshot as though it were data.
      throw new ClassifiedFailure('E8',
        `${err.message}`,
        {
          canonicalSecurityId,
          unresolvedElement: err.unresolvedElement,
          direction: err.direction,
          asOf,
          violatedRules: [...err.rules],
          identityFailClosed: true,
          isQualityState: false,
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

/** Shared lineage block builder (L-1…L-11, S-5). */
function buildLineage(cfg, receivedAt, identityMappingVersion, provenanceRefs = []) {
  return {
    sourceRef: cfg.sourceRef,                       // L-1
    adapterId: cfg.adapterId,                       // L-2
    adapterVersion: cfg.adapterVersion,             // L-3 / SI-5 hard requirement
    transformationChainRef: cfg.transformationChainRef, // L-4
    receivedAt,                                     // L-5
    namespaceVersion: NAMESPACE_VERSION,            // L-10
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}), // L-9
    // P01 §4.1: each CanonicalField.provenance is a REFERENCE INTO this block. The block holds
    // the entries; each field points at exactly one. This makes RF-7 mechanically checkable.
    ...(provenanceRefs.length > 0 ? { fieldProvenance: Object.freeze([...provenanceRefs].sort()) } : {}),
  };
}

/** Distinct provenance references used by a field map (deterministic order). */
function provenanceRefsOf(fields) {
  return [...new Set(Object.values(fields).map((f) => f.provenance))].sort();
}

/**
 * THE LOCAL DETERMINISTIC MARKET FEED.
 *
 * Emits through a single MarketDataSource-shaped boundary (INV-1 / AD-2 — no second ingress).
 */
export class LocalDeterministicMarketFeed {
  /**
   * @param {object} deps
   * @param {Record<string, unknown>} deps.config          provider/adapter declaration values
   * @param {Record<string, unknown>} deps.fixtures        parsed feed-fixtures.json
   * @param {Record<string, unknown>} deps.identityFixtures parsed identity-fixtures.json
   */
  constructor({ config, fixtures, identityFixtures }) {
    this.config = Object.freeze({ ...config });
    this.fixtures = Object.freeze(fixtures);
    this.identityFixtures = Object.freeze(identityFixtures);
    /** PG-1: provider identities come from the governed register, never ad hoc. */
    this.register = new MappingRegister({
      version: identityFixtures.mappingRegisterVersion,
      records: identityFixtures.mappings,
    });
    this.capability = declareCapability(config);
    /** FR-1: failure records are counted and reportable. */
    this.failureLog = [];
  }

  /** MarketDataSource<T> shape — the sole ingress abstraction (AD-2, B-4). */
  get source() {
    return Object.freeze({
      kind: 'MarketDataSource',
      provider: this.config.provider,
      capability: this.capability,
      snapshot: (request) => this.snapshot(request),
    });
  }

  /**
   * Produce ONE immutable, versioned canonical snapshot for a capability-scoped request.
   *
   * @param {object} request
   * @param {'D01'|'D02'|'D10'} request.domain
   * @param {'LIVE'|'SNAPSHOT'} request.mode
   * @param {string} request.fixtureId
   * @param {string} request.receivedAt   stamped once at the ingest boundary (D-4)
   * @param {string} [request.granularity]
   * @returns {{ok: true, snapshot: Record<string, unknown>, quality: string,
   *            completenessPct: number} |
   *           {ok: false, failure: ClassifiedFailure, record: Record<string, unknown>}}
   */
  snapshot(request) {
    const ctx = {
      provider: this.config.provider,
      adapterId: this.config.adapterId,
      adapterVersion: this.config.adapterVersion,
      domain: request.domain,
      mode: request.mode,
      requestedFields: request.requestedFields ?? [],
      identityRef: request.canonicalSecurityId ?? null,
      receivedAt: request.receivedAt,
      attemptCount: 1,
      schemaVersion: this.config.schemaVersion,
      namespaceVersion: NAMESPACE_VERSION,
    };

    try {
      assertIsoUtc(request.receivedAt, 'receivedAt');
      preflight(this.capability, request);          // A-10 / E6 — pre-flight
      this.assertSourceAvailable(request);          // E1 — the only quality-bearing class
      const result = this.acquireAndMap(request);   // A-13 → A-14 → A-15 → A-16
      return { ok: true, ...result };
    } catch (err) {
      const failure = err instanceof ClassifiedFailure
        ? err
        : new ClassifiedFailure('E8', err.message, { violatedRules: err.rules ?? [] });
      const record = failureRecord(failure, {
        ...ctx,
        offendingFieldSlots: failure.detail.offendingFieldSlot ? [failure.detail.offendingFieldSlot] : [],
        violatedRules: failure.detail.violatedRules ?? [],
        snapshotProduced: failure.producesSnapshot,
      });
      this.failureLog.push(record);                 // FR-1: counted and reportable
      // E1 is the ONLY quality-bearing class: it yields a snapshot with EMPTY fields.
      if (failure.code === 'E1') {
        const snap = this.emptySnapshot(request, ctx);
        return { ok: true, snapshot: snap, quality: 'unavailable', completenessPct: 0, classified: 'E1' };
      }
      return { ok: false, failure, record };        // RJ-2: nothing admitted downstream
    }
  }

  /** E1 → snapshot with EMPTY fields and quality 'unavailable' (ST-9 permits empty only here). */
  emptySnapshot(request, ctx) {
    const asOf = request.asOf ?? '1970-01-01T00:00:00.000Z';
    const dataVersion = `e1-${request.fixtureId}`;
    return buildSnapshot({
      provider: this.config.provider,
      dataVersion,
      schemaVersion: this.config.schemaVersion,
      asOf,
      receivedAt: ctx.receivedAt,
      mode: request.mode,
      quality: 'unavailable',
      completenessPct: 0,
      domain: request.domain,
      identity: undefined,
      lineage: buildLineage(this.config, ctx.receivedAt, undefined),
      fields: {},
    });
  }

  /**
   * E1 PROVIDER_UNAVAILABLE — the ONLY quality-bearing class (P02 §1.2). The source genuinely
   * has nothing to give; this is a statement about the DATA, not about us, so it yields a
   * snapshot with EMPTY fields and quality 'unavailable' (ST-9 permits empty only here).
   * ⚠ E2–E8 are rejections and are never expressed as a quality value (PR-2).
   */
  assertSourceAvailable(request) {
    const unavailable = (this.fixtures.providerUnavailable ?? []).some((x) => x._fixtureId === request.fixtureId);
    if (unavailable) {
      throw new ClassifiedFailure('E1',
        `fixture ${request.fixtureId}: the source has nothing to give for this request`,
        { fixtureId: request.fixtureId });
    }
  }

  /** A-13 → A-16. */
  acquireAndMap(request) {
    switch (request.domain) {
      case 'D01': return request.fixtureKind === 'valuation'
        ? this.mapValuation(request)
        : (request.mode === 'LIVE' ? this.mapQuote(request) : this.mapClose(request));
      case 'D02': return this.mapOhlcv(request);
      case 'D10': return this.mapVenue(request);
      default:
        throw new ClassifiedFailure('E6', `domain ${request.domain} is not served by this feed`, {});
    }
  }

  /** D01 LIVE quote → MD:price.* */
  mapQuote(request) {
    const p = this.findFixture('quotes', request.fixtureId);
    assertWireShape(p, QUOTE_WIRE, p._fixtureId);
    this.assertIso(p.quoteTs, 'quoteTs', p._fixtureId);

    const asOf = p.quoteTs;
    const identity = resolveIdentity(this.identityFixtures.securities, this.register,
      p.canonicalSecurityId, asOf, p.venue);
    const prov = `lineage:${this.config.sourceRef}:${p._fixtureId}`;

    /** @type {Record<string, unknown>} */
    const fields = {};
    const priceKey = buildKey('price', 'last');
    fields[priceKey] = buildField({
      key: priceKey, dataType: 'decimal', availability: 'PRESENT',
      value: mapDecimal(p.tradePrice, PRICE_PRECISION, priceKey, p._fixtureId),
      currency: this.assertCurrency(p.ccy, p._fixtureId), precision: PRICE_PRECISION,
      monetary: 'yes', dimension: 'dimensionless',
      observationTime: p.quoteTs, provenance: prov, pitEligible: false,
    });

    // NL-4 / A-20: absent bid/ask is SILENCE (NOT_PROVIDED), never zero, never empty string.
    for (const [native, seg] of [['bidPx', 'bid'], ['askPx', 'ask']]) {
      const key = buildKey('price', seg);
      const present = p[native] !== undefined && p[native] !== null;
      fields[key] = buildField({
        key, dataType: 'decimal',
        availability: present ? 'PRESENT' : 'NOT_PROVIDED',
        value: present ? mapDecimal(p[native], PRICE_PRECISION, key, p._fixtureId) : undefined,
        currency: present ? this.assertCurrency(p.ccy, p._fixtureId) : undefined,
        precision: PRICE_PRECISION,
        monetary: present ? 'yes' : 'no', dimension: 'dimensionless',
        observationTime: p.quoteTs, provenance: prov, pitEligible: false,
      });
    }
    for (const [native, seg] of [['bidSz', 'bidSize'], ['askSz', 'askSize']]) {
      const key = buildKey('price', seg);
      const present = p[native] !== undefined && p[native] !== null;
      fields[key] = buildField({
        key, dataType: 'integer',
        availability: present ? 'PRESENT' : 'NOT_PROVIDED',
        value: present ? p[native] : undefined,
        dimension: 'dimensionless',
        observationTime: p.quoteTs, provenance: prov, pitEligible: false,
      });
    }
    const venueKey = buildKey('price', 'venueRef');
    fields[venueKey] = buildField({
      key: venueKey, dataType: 'identifier', availability: 'PRESENT', value: p.venue,
      dimension: 'dimensionless', effectiveTime: p.quoteTs, provenance: prov, pitEligible: true,
    });

    return this.finish(request, p, asOf, fields, identity, 'D01', 8);
  }

  /** D01 SNAPSHOT official close → MD:price.* (PIT-eligible marks) */
  mapClose(request) {
    const p = this.findFixture('closes', request.fixtureId);
    assertWireShape(p, CLOSE_WIRE, p._fixtureId);
    // TS-4: a date-only session boundary is represented at an explicit UTC convention.
    const asOf = `${p.sessionDate}T00:00:00.000Z`;
    const effectiveTime = asOf;

    const identity = resolveIdentity(this.identityFixtures.securities, this.register,
      p.canonicalSecurityId, asOf, p.venue);
    const prov = `lineage:${this.config.sourceRef}:${p._fixtureId}`;

    /** @type {Record<string, unknown>} */
    const fields = {};
    const dec = (seg, raw, opts = {}) => {
      const key = buildKey('price', seg);
      fields[key] = buildField({
        key, dataType: 'decimal', availability: 'PRESENT',
        value: mapDecimal(raw, PRICE_PRECISION, key, p._fixtureId),
        currency: this.assertCurrency(p.ccy, p._fixtureId), precision: PRICE_PRECISION,
        monetary: 'yes', dimension: 'dimensionless',
        effectiveTime, provenance: prov, pitEligible: true, ...opts,
      });
    };
    dec('close', p.officialClose);
    dec('previousClose', p.prevClose);
    if (p.vwap !== undefined) dec('vwap', p.vwap);

    const volKey = buildKey('price', 'volume');
    fields[volKey] = buildField({
      key: volKey, dataType: 'integer', availability: 'PRESENT', value: p.vol,
      dimension: 'dimensionless', effectiveTime, provenance: prov, pitEligible: true,
    });
    const tcKey = buildKey('price', 'tradeCount');
    const hasTc = p.trades !== undefined && p.trades !== null;
    fields[tcKey] = buildField({
      key: tcKey, dataType: 'integer', availability: hasTc ? 'PRESENT' : 'NOT_PROVIDED',
      value: hasTc ? p.trades : undefined, dimension: 'dimensionless',
      effectiveTime, provenance: prov, pitEligible: true,
    });
    const venueKey = buildKey('price', 'venueRef');
    fields[venueKey] = buildField({
      key: venueKey, dataType: 'identifier', availability: 'PRESENT', value: p.venue,
      dimension: 'dimensionless', effectiveTime, provenance: prov, pitEligible: true,
    });

    return this.finish(request, p, asOf, fields, identity, 'D01', 7);
  }

  /** D01 valuation ratios → MD:valuation.* (collision-critical, D4_07 §I.1) */
  mapValuation(request) {
    const p = this.findFixture('valuations', request.fixtureId);
    assertWireShape(p, VALUATION_WIRE, p._fixtureId);
    this.assertIso(p.asOfTs, 'asOfTs', p._fixtureId);
    const asOf = p.asOfTs;
    const identity = resolveIdentity(this.identityFixtures.securities, this.register,
      p.canonicalSecurityId, asOf, undefined);
    const prov = `lineage:${this.config.sourceRef}:${p._fixtureId}`;

    /** @type {Record<string, unknown>} */
    const fields = {};
    for (const [native, seg] of [['pe', 'peRatio'], ['evEbitda', 'evEbitda'], ['evRevenue', 'evRevenue'], ['fcfYield', 'fcfYield']]) {
      const key = buildKey('valuation', seg);
      const present = p[native] !== undefined && p[native] !== null;
      fields[key] = buildField({
        key, dataType: 'decimal',
        availability: present ? 'PRESENT' : 'NOT_PROVIDED',
        value: present ? mapDecimal(p[native], RATIO_PRECISION, key, p._fixtureId) : undefined,
        precision: RATIO_PRECISION,
        // UN-3: ratios are DIMENSIONLESS — no currency, no unit.
        monetary: 'no', dimension: 'dimensionless',
        effectiveTime: asOf, provenance: prov, pitEligible: true,
      });
    }
    return this.finish(request, p, asOf, fields, identity, 'D01', 4);
  }

  /** D02 historical OHLCV → MD:ohlcv.* (unadjusted bars; AJ-1 both retained) */
  mapOhlcv(request) {
    const p = this.findFixture('ohlcv', request.fixtureId);
    assertWireShape(p, OHLCV_WIRE, p._fixtureId);
    if (!Array.isArray(p.bars) || p.bars.length === 0) {
      throw new ClassifiedFailure('E5', `fixture ${p._fixtureId} has no bars`, { fixtureId: p._fixtureId });
    }
    const bar = p.bars[request.barIndex ?? p.bars.length - 1];
    assertWireShape(bar, BAR_WIRE, p._fixtureId);
    const asOf = `${bar.barDate}T00:00:00.000Z`;
    const effectiveTime = asOf;
    const identity = resolveIdentity(this.identityFixtures.securities, this.register,
      p.canonicalSecurityId, asOf, undefined);
    const prov = `lineage:${this.config.sourceRef}:${p._fixtureId}:bar:${bar.barDate}`;

    /** @type {Record<string, unknown>} */
    const fields = {};
    for (const [native, seg] of [['o', 'open'], ['h', 'high'], ['l', 'low'], ['c', 'close']]) {
      const key = buildKey('ohlcv', seg);
      fields[key] = buildField({
        key, dataType: 'decimal', availability: 'PRESENT',
        value: mapDecimal(bar[native], PRICE_PRECISION, key, p._fixtureId),
        currency: this.assertCurrency(p.ccy, p._fixtureId), precision: PRICE_PRECISION,
        monetary: 'yes', dimension: 'dimensionless',
        effectiveTime, provenance: prov, pitEligible: true,
      });
    }
    const volKey = buildKey('ohlcv', 'volume');
    fields[volKey] = buildField({
      key: volKey, dataType: 'integer', availability: 'PRESENT', value: bar.v,
      dimension: 'dimensionless', effectiveTime, provenance: prov, pitEligible: true,
    });
    const intervalKey = buildKey('ohlcv', 'barInterval');
    fields[intervalKey] = buildField({
      key: intervalKey, dataType: 'enum', availability: 'PRESENT', value: p.interval,
      dimension: 'dimensionless', provenance: prov, pitEligible: true,
    });
    const adjKey = buildKey('ohlcv', 'adjusted');
    fields[adjKey] = buildField({
      key: adjKey, dataType: 'boolean', availability: 'PRESENT', value: bar.adj === true,
      dimension: 'dimensionless', provenance: prov, pitEligible: true,
      // AJ-3 / SM-11: adjusted=true without adjustmentBasisRef is invalid.
      ...(bar.adj === true ? { adjusted: true, adjustmentBasisRef: undefined } : {}),
    });
    return this.finish(request, p, asOf, fields, identity, 'D02', 7);
  }

  /** D10 venue reference → MD:venue.* (MIC-based, VN-1) */
  mapVenue(request) {
    const v = this.identityFixtures.venues.find((x) => x.micCode === request.micCode);
    if (v === undefined) {
      throw new ClassifiedFailure('E8', `unknown venue MIC '${request.micCode}'`, { violatedRules: ['RF-5', 'VN-1'] });
    }
    const asOf = v.validFrom;
    const prov = `lineage:${this.config.sourceRef}:venue:${v.micCode}`;
    /** @type {Record<string, unknown>} */
    const fields = {};
    const put = (seg, dataType, value, opts = {}) => {
      const key = buildKey('venue', seg);
      fields[key] = buildField({
        key, dataType, availability: 'PRESENT', value,
        dimension: 'dimensionless', effectiveTime: asOf, provenance: prov, pitEligible: true, ...opts,
      });
    };
    put('micCode', 'identifier', v.micCode);
    put('name', 'string', v.name);
    put('timezone', 'string', v.timezone);
    put('quotationCurrency', 'string', v.quotationCurrency);
    if (v.settlementCycle !== undefined) put('settlementCycle', 'enum', v.settlementCycle);
    put('validFrom', 'timestamp', v.validFrom);

    const snapshot = buildSnapshot({
      provider: this.config.provider,
      dataVersion: this.dataVersionFor(v),
      schemaVersion: this.config.schemaVersion,
      asOf,
      receivedAt: request.receivedAt,
      mode: 'SNAPSHOT',
      quality: 'good',
      completenessPct: computeCompletenessPct(fields, Object.keys(fields).length),
      domain: 'D10',
      // §1.2: D10 uses VENUE identity, not instrument identity.
      identity: Object.freeze({ venueIdentity: v.micCode, micKind: v.micKind, adapterCrossing: false }),
      lineage: buildLineage(this.config, request.receivedAt, undefined, provenanceRefsOf(fields)),
      fields,
    });
    return { snapshot, quality: 'good', completenessPct: snapshot.completenessPct };
  }

  /**
   * A-16 — construct the immutable, versioned snapshot.
   * @param {object} request @param {object} payload @param {string} asOf
   * @param {Record<string, unknown>} fields @param {object} identity
   * @param {string} domain @param {number} contractedFieldCount
   */
  finish(request, payload, asOf, fields, identity, domain, contractedFieldCount) {
    const completenessPct = computeCompletenessPct(fields, contractedFieldCount);
    // Q-1 / S5: 'partial' when the source was silent about contracted fields.
    const quality = completenessPct < 100 ? 'partial' : 'good';
    const snapshot = buildSnapshot({
      provider: this.config.provider,
      dataVersion: this.dataVersionFor(payload),
      schemaVersion: this.config.schemaVersion,
      asOf,
      receivedAt: request.receivedAt,
      mode: request.mode,
      quality,
      completenessPct,
      domain,
      identity,
      identityMappingVersion: identity.identityMappingVersion,
      lineage: buildLineage(this.config, request.receivedAt, identity.identityMappingVersion,
        provenanceRefsOf(fields)),
      fields,
    });
    return { snapshot, quality, completenessPct };
  }

  /**
   * DV-1/DV-2 — `dataVersion` identifies the VINTAGE OF THE SOURCE CONTENT.
   * Derived deterministically from the payload, so identical content yields an identical
   * version and any content change yields a new one. No wall-clock (D-3).
   */
  dataVersionFor(payload) {
    const stripped = JSON.parse(JSON.stringify(payload, (k, v) => (k.startsWith('_') ? undefined : v)));
    return `v${canonicalDigest(stripped).slice(0, 16)}`;
  }

  findFixture(collection, fixtureId) {
    // A provider payload arrives as a payload: the adapter does not know in advance whether it
    // is well-formed. Search the declared provider-native collections in a FIXED, deterministic
    // order so that a malformed payload takes exactly the same mapping path as a good one
    // (A-13 validates BEFORE mapping — CL-6: E8 is evaluated AFTER response validation).
    const order = [collection, ...PROVIDER_NATIVE_COLLECTIONS.filter((c) => c !== collection)];
    for (const c of order) {
      const found = (this.fixtures[c] ?? []).find((x) => x._fixtureId === fixtureId);
      if (found !== undefined) return found;
    }
    throw new ClassifiedFailure('E5', `fixture '${fixtureId}' not found in any provider-native collection`, { fixtureId });
  }

  assertCurrency(ccy, fixtureId) {
    if (typeof ccy !== 'string' || !/^[A-Z]{3}$/.test(ccy)) {
      // SM-2 / CU-1: not ISO-4217 → mapping failure, rejected not defaulted.
      throw new ClassifiedFailure('E8',
        `fixture ${fixtureId}: currency '${ccy}' is not ISO-4217`,
        { fixtureId, violatedRules: ['SM-2', 'CU-1', 'CU-2'] });
    }
    return ccy;
  }

  assertIso(value, label, fixtureId) {
    try {
      return assertIsoUtc(value, label);
    } catch (err) {
      throw new ClassifiedFailure('E5',
        `fixture ${fixtureId}: ${label} '${value}' is not ISO-8601 UTC`,
        { fixtureId, violatedRules: [...err.rules] });
    }
  }
}

export { DISPOSITION, ErrorClass, RETRY_PROHIBITED, DOMAIN_SEGMENTS, buildSnapshotId };
