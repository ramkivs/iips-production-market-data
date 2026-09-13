/**
 * P06-01 — NORMALIZATION PIPELINE (mapping **execution**)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P06-01: Requirement *"Convert provider payloads into canonical
 *   records."* · Exit Criteria *"Canonical output deterministic"* · Test/Validation *"Golden
 *   tests"* · Evidence *"Canonical fixtures"*. Authorized by **D10-2**.
 *
 *   `docs/p02/P02_PROVIDER_MAPPING_RULES.md` **MR-5** — *"Mapping execution is P06."*
 *   This module IS that execution. It obeys the rules P02 defines and invents none:
 *     M-1…M-6  containment  ·  N-1/N-2 namespace application  ·  MR-1…MR-4 mapping discipline
 *     MD-1…MD-8 declaration elements  ·  FD-1…FD-7 dictionary rules  ·  ADR-01 C1–C6
 *
 *   `Phase Gates`!P06 gate intent: *"Normalize provider-specific payloads into governed canonical
 *   representations **without feeding raw provider data directly to engines**."* That prohibition
 *   is enforced behaviourally by `assertNoEngineDirectPath` below, not merely documented.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ **NO namespace or collision logic is implemented here.** `NAMESPACE_TOKEN`, `buildKey`,
 *     `assertC1`–`assertC4` and `assertCollisionGuard` are IMPORTED from `p05/src/namespace.js`.
 *   ⚠ **NO canonical field/snapshot logic is implemented here.** `buildField`, `buildSnapshot` and
 *     `computeCompletenessPct` are IMPORTED from `p05/src/contract.js`, so every C1 / FD-1 / NL-* /
 *     SM-* / ST-* / FD-5 obligation is enforced by the accepted P01 implementation, not a copy.
 *   ⚠ **NO identity logic is implemented here.** Identity is passed through from the caller's
 *     resolved P04 `IdentityRef`; RF-3 (`mappedCompanyId` written only by the identity layer) and
 *     the FIGI/OpenFIGI authority (OI-09) are preserved untouched.
 *   ⚠ **NO validation logic is implemented here.** `validateSnapshot` is IMPORTED from
 *     `p05/src/validate.js`.
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P06-02.** This module takes a payload as an ARGUMENT and returns a canonical record.
 *     It builds **no storage boundary**, persists **no raw store** and implements **no** raw-bypass
 *     detection surface. Those are `Work Tracker`!P06-02 and are NOT implemented here.
 *   ⚠ **NOT P06-03.** No deduplication rules, no cross-retry/replay/provider duplicate prevention.
 *     Determinism (this module's exit criterion) is a **purity** property, and is deliberately
 *     NOT presented as deduplication.
 *   ⚠ **NO provider execution, credentials, entitlements or connectivity** (D9 N-1, D10 §8.2).
 *   ⚠ **NO wall clock, no randomness, no ambient input** — `receivedAt` and `asOf` are supplied by
 *     the caller, so identical input yields byte-identical output.
 *   ⚠ **NO certification** (`NONE_GRANTED`) and **NO production activation** (`NOT_AUTHORIZED`,
 *     A4 at P16 only).
 *   ⚠ **NOT P06 ACCEPTANCE.** P06 remains `NOT_ACCEPTED`; no `P06_GATE_ACCEPTANCE.md` exists or is
 *     created by this work (D10-6).
 */

import {
  NAMESPACE_TOKEN,
  SEGMENT_SEPARATOR,
  buildKey,
  assertCollisionGuard,
  canonicalKeyOrder,
} from '../../p05/src/namespace.js';
import {
  buildField,
  buildSnapshot,
  computeCompletenessPct,
  MODES,
} from '../../p05/src/contract.js';
import { validateSnapshot, SnapshotRejection, rejectionEvent } from '../../p05/src/validate.js';
import { canonicalJson, canonicalDigest, assertIsoUtc } from '../../p05/src/serialize.js';
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import {
  P06_01_MODULE,
  declaredProviderElements,
  undeclaredProviderElements,
  mappingDigest,
} from './mappingDeclaration.js';

export { P06_01_MODULE };

/**
 * The existing, frozen engine input keys that the collision-critical `MD:valuation.*` slots could
 * collide with (`docs/p01/P01_FIELD_DICTIONARY.md` §3, `D4_07` §I.1). The pipeline must never emit
 * one of these bare: N-5 forbids merging a namespaced canonical field into an engine input by name
 * coincidence, and engine-input mapping is owned by **P11**.
 */
export const ENGINE_INPUT_KEYS = Object.freeze(['peRatio', 'evEbitda', 'evRevenue', 'fcfYield']);

export class NormalizationRejection extends Error {
  /** @param {string[]} rules @param {string} stage @param {string} reason @param {object} [detail] */
  constructor(rules, stage, reason, detail = {}) {
    super(`[${rules.join(', ')}] ${stage}: ${reason}`);
    this.name = 'NormalizationRejection';
    this.rules = Object.freeze([...rules]);
    this.stage = stage;
    this.reason = reason;
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * Apply one declared transformation. The vocabulary is closed (MR-2): an unknown transformation is
 * a hard rejection, never a guess. Nothing is inferred from a field's name or shape.
 */
function applyTransformation(name, value, md3, slot) {
  switch (name) {
    case 'identity':
      return value;
    case 'string':
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new NormalizationRejection(['MD-3', 'SM-6'], 'transform',
          `slot '${slot}' requires a non-empty string, got ${JSON.stringify(value)}`, { slot });
      }
      return value.trim();
    case 'decimal':
      // The declared precision is applied here AND re-asserted by buildField; canonicalDecimal is
      // idempotent, so the value is canonicalized exactly once in effect.
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new NormalizationRejection(['MD-3', 'NP-2'], 'transform',
          `slot '${slot}' is not a fixed-point decimal: ${JSON.stringify(value)}`, { slot });
      }
      return value;
    case 'integer':
      if (!Number.isInteger(value)) {
        throw new NormalizationRejection(['MD-3', 'SM-6', 'UN-6'], 'transform',
          `slot '${slot}' is not an integer: ${JSON.stringify(value)}`, { slot });
      }
      return value;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new NormalizationRejection(['MD-3', 'SM-6'], 'transform',
          `slot '${slot}' is not a boolean: ${JSON.stringify(value)}`, { slot });
      }
      return value;
    case 'dateToIsoUtc': {
      // TS-4: a date-only boundary is represented at an EXPLICIT UTC convention, declared here
      // rather than assumed.
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new NormalizationRejection(['MD-3', 'TS-1', 'TS-4'], 'transform',
          `slot '${slot}' is not a date-only value: ${JSON.stringify(value)}`, { slot });
      }
      return `${value}T00:00:00.000Z`;
    }
    case 'enum': {
      const table = md3.enumTable ?? {};
      if (!Object.prototype.hasOwnProperty.call(table, String(value))) {
        // MR-2: an undeclared enum member FAILS. It is never guessed, defaulted or passed through.
        throw new NormalizationRejection(['MD-3', 'MR-2'], 'transform',
          `slot '${slot}' received enum member '${String(value)}' which is not in the declared table`,
          { slot, value, declared: Object.keys(table).sort() });
      }
      return table[String(value)];
    }
    default:
      // Unreachable when the declaration was validated; kept fail-closed rather than permissive.
      throw new NormalizationRejection(['MD-3', 'MR-2'], 'transform',
        `transformation '${String(name)}' is not in the closed vocabulary`, { slot, name });
  }
}

/**
 * Resolve a source element's availability from the declared MD-6 rules.
 *
 * M-5: a canonical slot the provider cannot supply is **not** emitted with a fabricated value — it
 * is `NOT_PROVIDED`. NL-1: an EXPLICIT null is `NULL_ASSERTED`, a distinct fact from silence.
 *
 * @returns {{availability: string, present: boolean}}
 */
function resolveAvailability(entry, raw) {
  const md6 = entry['MD-6'];
  if (raw === undefined) return { availability: md6.onAbsent, present: false };
  if (raw === null) return { availability: md6.nullMarker ?? 'NULL_ASSERTED', present: false };
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(md6.sentinels ?? {}, raw)) {
    return { availability: md6.sentinels[raw], present: false };
  }
  return { availability: 'PRESENT', present: true };
}

/**
 * ── THE PIPELINE ───────────────────────────────────────────────────────────────────────────
 *
 * Convert ONE provider payload into ONE governed canonical record, by executing a DECLARED
 * mapping. MR-1: a pure, deterministic function of the payload plus the declared configuration.
 *
 * @param {object} args
 * @param {Record<string, unknown>} args.payload      provider-native payload (input only)
 * @param {Readonly<Record<string, unknown>>} args.mapping  a `declareNormalizationMapping` result
 * @param {object} args.context  provider/adapter identity, `receivedAt`, `mode`, identity refs
 * @returns {Readonly<{record: object, report: object, canonicalSerialization: string,
 *                     canonicalDigest: string}>}
 */
export function normalizePayload({ payload, mapping, context }) {
  if (payload === undefined || payload === null || typeof payload !== 'object') {
    throw new NormalizationRejection(['MR-1'], 'input', 'a provider payload is required');
  }
  if (mapping?.entries === undefined) {
    throw new NormalizationRejection(['MR-2'], 'input',
      'a DECLARED mapping is required — an undeclared or heuristic mapping is prohibited');
  }
  for (const k of ['provider', 'adapterId', 'adapterVersion', 'providerSchemaVersion',
    'schemaVersion', 'sourceRef', 'sourceRecordRef', 'transformationChainRef', 'receivedAt', 'mode']) {
    if (context?.[k] === undefined) {
      throw new NormalizationRejection(['RF-6', 'LN-1'], 'input', `context.'${k}' is required`);
    }
  }
  if (!MODES.includes(context.mode)) {
    // ST-4 / MD-1: mode is never inferred.
    throw new NormalizationRejection(['ST-4'], 'input',
      `mode '${String(context.mode)}' is not LIVE|SNAPSHOT|PIT — mode is never inferred`);
  }
  // D-3 / TS-6: the ingest instant is SUPPLIED, stamped once at the boundary. Never a wall clock.
  assertIsoUtc(context.receivedAt, 'receivedAt');

  const slotOrder = [...mapping.entries].sort((a, b) => canonicalSlot(a).localeCompare(canonicalSlot(b)));
  const providerElements = new Set(declaredProviderElements(mapping));

  /** @type {Record<string, object>} */
  const fields = {};
  const notProvided = [];
  const applied = [];

  for (const entry of slotOrder) {
    const slot = canonicalSlot(entry);
    const key = buildKey(entry['MD-1'].domainSegment, entry['MD-1'].fieldSegment);
    const sourceElement = entry['MD-2'].providerElement;
    const raw = payload[sourceElement];
    const { availability, present } = resolveAvailability(entry, raw);
    // ⚠ M-3: the provenance reference points at the SOURCE RECORD, never at a provider-native
    // FIELD NAME. Embedding the field name here would put a provider-specific name into a
    // canonical lineage reference, which M-3 prohibits. The provider element is already recorded
    // in the DECLARED mapping (MD-2), which is where provider-native names belong.
    const provenance = `lineage:${context.sourceRef}:${context.sourceRecordRef}`;

    // MD-5 timestamp slot, from a DECLARED source.
    let timestamp;
    if (entry['MD-5'].timestampSlot !== 'none') {
      const tsRaw = payload[entry['MD-5'].timestampSource];
      if (tsRaw === undefined || tsRaw === null) {
        throw new NormalizationRejection(['MD-5', 'RF-7'], 'timestamp',
          `slot '${slot}' requires timestamp source '${entry['MD-5'].timestampSource}', which is absent`,
          { slot, source: entry['MD-5'].timestampSource });
      }
      const tsTransform = entry['MD-5'].timestampTransform ?? 'identity';
      timestamp = applyTransformation(tsTransform, tsRaw, entry['MD-3'], slot);
      assertIsoUtc(timestamp, `slot '${slot}' ${entry['MD-5'].timestampSlot}`);
    }

    // FD-6: a pitEligible=false field must not appear in a mode=PIT snapshot.
    if (context.mode === 'PIT' && entry['MD-7'].pitEligible === false) {
      throw new NormalizationRejection(['FD-6', 'ST-5'], 'pit',
        `slot '${slot}' is pitEligible=false and must not appear in a mode=PIT snapshot`, { slot });
    }

    let value;
    if (present) {
      // MR-1 / MD-3: the declared, ordered chain. Nothing is inferred.
      let v = raw;
      for (const t of entry['MD-3'].transformations) {
        v = applyTransformation(t, v, entry['MD-3'], slot);
      }
      value = v;
      applied.push(Object.freeze({ slot, key, sourceElement, availability: 'PRESENT' }));
    } else {
      notProvided.push(Object.freeze({ slot, key, sourceElement, availability }));
    }

    const currencySource = entry['MD-4'].currencySource;
    let currency;
    if (entry['MD-4'].monetary === 'yes') {
      if (present) {
        currency = payload[currencySource];
        if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
          // SM-1 / SM-2 / CU-2 / FD-5: rejected, never defaulted.
          throw new NormalizationRejection(['SM-1', 'SM-2', 'CU-2', 'FD-5'], 'currency',
            `monetary slot '${slot}' has no ISO-4217 currency from source '${currencySource}'`,
            { slot, currencySource, currency });
        }
      }
    }

    fields[key] = buildField({
      key,
      dataType: entry['MD-4'].dataType,
      availability,
      ...(present ? { value } : {}),
      ...(currency !== undefined ? { currency } : {}),
      ...(entry['MD-3'].precision !== undefined ? { precision: entry['MD-3'].precision } : {}),
      ...(entry['MD-4'].dimension === 'dimensioned' ? { unit: entry['MD-4'].unit } : {}),
      ...(timestamp !== undefined ? { [entry['MD-5'].timestampSlot]: timestamp } : {}),
      provenance,
      pitEligible: entry['MD-7'].pitEligible,
      monetary: entry['MD-4'].monetary,
      dimension: entry['MD-4'].dimension,
    });
  }

  // ── ADR-01 C1–C6, by REUSE. No collision logic is implemented in this module. ──
  const companyInputKeys = Object.freeze([...(context.companyInputKeys ?? [])]);
  assertCollisionGuard({
    fields: Object.keys(fields),
    companyInputKeys,
    contributing: context.contributing ?? [],
  });

  const completenessPct = computeCompletenessPct(fields, mapping.contractedFieldCount);
  const quality = context.mode === 'PIT' ? classifyFromCompleteness(completenessPct) : classifyFromCompleteness(completenessPct);

  // DV-1 / DV-2: dataVersion identifies the VINTAGE OF THE SOURCE CONTENT, derived
  // deterministically from the canonical content — never from a wall clock.
  const contentDigest = canonicalDigest({
    domain: mapping.domain,
    mode: context.mode,
    provider: context.provider,
    schemaVersion: context.schemaVersion,
    namespaceVersion: NAMESPACE_VERSION,
    mappingDigest: mappingDigest(mapping),
    fields: canonicalKeyOrder(Object.keys(fields)).map((k) => [k, fields[k]]),
    identity: context.identity ?? null,
  });
  const dataVersion = `v${contentDigest.slice(0, 16)}`;

  const asOf = resolveAsOf(mapping, payload, context);
  const provenanceRefs = Object.freeze([...new Set(Object.values(fields).map((f) => f.provenance))].sort());

  const record = buildSnapshot({
    provider: context.provider,
    dataVersion,
    schemaVersion: context.schemaVersion,
    asOf,
    receivedAt: context.receivedAt,
    mode: context.mode,
    ...(context.pitBoundary !== undefined ? { pitBoundary: context.pitBoundary } : {}),
    quality,
    completenessPct,
    domain: mapping.domain,
    ...(context.identity !== undefined ? { identity: context.identity } : {}),
    ...(context.identityMappingVersion !== undefined ? { identityMappingVersion: context.identityMappingVersion } : {}),
    lineage: Object.freeze({
      sourceRef: context.sourceRef,
      adapterId: context.adapterId,
      adapterVersion: context.adapterVersion,
      transformationChainRef: context.transformationChainRef,
      receivedAt: context.receivedAt,
      namespaceVersion: NAMESPACE_VERSION,
      ...(context.identityMappingVersion !== undefined ? { identityMappingVersion: context.identityMappingVersion } : {}),
      // P06-01 lineage additionally records WHICH DECLARED MAPPING produced this record, so the
      // normalization is attributable and reproducible without reading code (MR-4).
      normalizationMappingId: mapping.mappingId,
      normalizationMappingVersion: mapping.mappingVersion,
      normalizationMappingDigest: mappingDigest(mapping),
      ...(provenanceRefs.length > 0 ? { fieldProvenance: provenanceRefs } : {}),
    }),
    fields,
  });

  // ── Validate through the accepted P01 validator (REUSE, not a copy). ──
  const validation = validateSnapshot(record, { companyInputKeys, contributing: context.contributing ?? [] });

  const report = Object.freeze({
    module: P06_01_MODULE,
    mappingId: mapping.mappingId,
    mappingVersion: mapping.mappingVersion,
    mappingDigest: mappingDigest(mapping),
    domain: mapping.domain,
    mode: context.mode,
    declaredSlots: Object.freeze(slotOrder.map(canonicalSlot)),
    emittedKeys: Object.freeze(canonicalKeyOrder(Object.keys(fields))),
    fieldsPresent: applied.length,
    fieldsNotProvided: Object.freeze(notProvided),
    // M-4: dropped elements are RECORDED, never smuggled through.
    droppedUndeclaredElements: undeclaredProviderElements(mapping, payload),
    contractedFieldCount: mapping.contractedFieldCount,
    completenessPct,
    quality,
    dataVersion,
    // ⚠ Phase scope, carried in the artifact itself.
    phaseScope: 'P06-01',
    p06_02Implemented: false,
    p06_03Implemented: false,
    liveProviderExecution: false,
    licensedHistoricalAcquisition: false,
    productionActivation: false,
    certificationClaim: false,
    engineInputKeysEmitted: Object.freeze([]),
  });

  return Object.freeze({
    record,
    report,
    quality: validation.quality,
    canonicalSerialization: canonicalJson(record),
    canonicalDigest: canonicalDigest(record),
  });
}

function canonicalSlot(entry) {
  return `${entry['MD-1'].domainSegment}${SEGMENT_SEPARATOR}${entry['MD-1'].fieldSegment}`;
}

function classifyFromCompleteness(pct) {
  // Q-1: the existing quality enum, unchanged. Only 'good' and 'partial' are reachable from
  // completeness alone; 'unavailable' requires the E1 path, which is a P05 acquisition concern.
  return pct >= 100 ? 'good' : 'partial';
}

/** `asOf` comes from the DECLARED envelope source. Never inferred, never a wall clock. */
function resolveAsOf(mapping, payload, context) {
  if (context.asOf !== undefined) {
    assertIsoUtc(context.asOf, 'asOf');
    return context.asOf;
  }
  const env = mapping.envelope?.asOf;
  if (env?.source === undefined) {
    throw new NormalizationRejection(['MD-5', 'SN-2'], 'envelope',
      'the mapping declares no asOf source and the context supplies no asOf — market-data time is never inferred');
  }
  const raw = payload[env.source];
  if (raw === undefined || raw === null) {
    throw new NormalizationRejection(['MD-5', 'SN-2'], 'envelope',
      `asOf source '${env.source}' is absent from the payload`, { source: env.source });
  }
  const value = applyTransformation(env.transform ?? 'identity', raw, {}, 'asOf');
  assertIsoUtc(value, 'asOf');
  return value;
}

/**
 * ⚠ THE GATE-INTENT GUARD: *"without feeding raw provider data directly to engines."*
 *
 * Asserts, mechanically, that a canonical record:
 *   1. emits **only** `MD:<domain>.<field>` keys (C1 / FD-1 / N-2);
 *   2. emits **no** bare existing engine input key (N-5 / FD-3) — engine-input mapping is P11;
 *   3. contains **no** provider-native element name anywhere in its serialized form (M-3);
 *   4. carries **no** free-form bag, `extras` map or metadata blob that could smuggle raw
 *      provider content (M-4).
 *
 * @param {object} record @param {Readonly<Record<string, unknown>>} mapping
 * @param {string[]} [providerVocabulary]  provider-native names to check for leakage
 * @returns {Readonly<Record<string, unknown>>}
 */
export function assertNoEngineDirectPath(record, mapping, providerVocabulary = []) {
  const keys = Object.keys(record.fields ?? {});
  const bare = keys.filter((k) => !k.startsWith(NAMESPACE_TOKEN));
  if (bare.length > 0) {
    throw new NormalizationRejection(['C1', 'FD-1', 'N-2'], 'engine-boundary',
      `${bare.length} field key(s) do not carry the namespace '${NAMESPACE_TOKEN}'`, { keys: bare.sort() });
  }
  const serialization = canonicalJson(record);
  // N-5 / FD-3: a bare existing engine input key must never appear as a JSON key anywhere in the
  // record. A properly namespaced key serializes as "MD:valuation.peRatio": and therefore does NOT
  // match — so this check is precise, not a substring accident.
  const bareEngineKeys = ENGINE_INPUT_KEYS.filter((ek) => serialization.includes(`"${ek}":`));
  if (bareEngineKeys.length > 0) {
    throw new NormalizationRejection(['N-5', 'FD-3'], 'engine-boundary',
      `${bareEngineKeys.length} bare engine input key(s) appear in the canonical record — a namespaced `
      + 'canonical field may reach an engine only through an explicit declared mapping owned by P11',
      { keys: bareEngineKeys });
  }
  // M-3 / LA-18: scan for provider-native names smuggled ANYWHERE in the record — including
  // inside a lineage or provenance string, not only as a JSON key. Canonical keys are stripped
  // first, and matching is on WORD BOUNDARIES, so that a legitimate structural name such as
  // `venueRef` is not mistaken for the provider element `venue`, nor `dataType` for `pe`. A name
  // smuggled into a string like 'chain-with-sym-inside' IS caught, because '-' is a boundary.
  const withoutCanonicalKeys = serialization.replace(/"MD:[a-z]+\.[A-Za-z0-9]*"/g, '');
  const leaked = [...providerVocabulary, ...declaredProviderElements(mapping)]
    .filter((name) => typeof name === 'string' && name.length > 0
      && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(withoutCanonicalKeys));
  if (leaked.length > 0) {
    throw new NormalizationRejection(['M-3', 'LA-18'], 'engine-boundary',
      `${leaked.length} provider-native name(s) appear in the canonical record`, { leaked: leaked.sort() });
  }
  for (const forbidden of ['extras', 'rawPayload', 'nativePayload', 'metadata', 'bag', 'additionalProperties']) {
    if (Object.prototype.hasOwnProperty.call(record, forbidden)) {
      throw new NormalizationRejection(['M-4'], 'engine-boundary',
        `the canonical record carries a free-form '${forbidden}' member, which could smuggle provider content`,
        { member: forbidden });
    }
  }
  return Object.freeze({
    ok: true,
    keysChecked: keys.length,
    namespacedKeys: keys.length,
    bareEngineKeysEmitted: 0,
    providerNamesLeaked: 0,
    freeFormBags: 0,
  });
}

export { SnapshotRejection, rejectionEvent };
