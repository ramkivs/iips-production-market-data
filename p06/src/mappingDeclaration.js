/**
 * P06-01 — NORMALIZATION MAPPING **DECLARATION** (data, never imperative code)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P06-01 — *Normalization pipeline*:
 *     Requirement     **Convert provider payloads into canonical records.**
 *     Deliverable     Normalization pipeline
 *     Dependencies    `P01,P04,P05` (Hard) — all ACCEPTED
 *     Entry Criteria  Input fixtures available
 *     Exit Criteria   **Canonical output deterministic**
 *     Test/Validation **Golden tests**
 *     Evidence        **Canonical fixtures**
 *   Authorized by **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1), scope `P06-01` / `P06-02` /
 *   `P06-03` ONLY. This module is **P06-01 only**.
 *
 *   The two artifacts that make "mapping execution is P06-01" authoritative rather than inferred:
 *     · `docs/p02/P02_PROVIDER_MAPPING_RULES.md` **MR-5** — *"Mapping execution is P06. P02 defines
 *       only the rules the execution must obey."*
 *     · `docs/p01/P01_FIELD_DICTIONARY.md` **FD-7** — *"This dictionary declares contract slots, not
 *       provider mappings. Provider-to-canonical mapping is P06."*
 *   `docs/p04/P04_SCOPE_AND_BOUNDARY.md` **X-4** excludes the normalization pipeline from P04.
 *
 * ── What this module is ────────────────────────────────────────────────────────────────────
 *   The **declaration half** of P06-01. A mapping is DATA (M-6, MR-4: *"Mapping declarations are
 *   reviewable without reading code"*), carrying the eight elements P02 §5 mandates — **MD-1…MD-8**.
 *   Execution lives in `./normalizationPipeline.js` (MR-5).
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P06-02.** No raw/canonical **storage boundary** is built here. This module declares a
 *     mapping and holds no raw store, no persistence and no bypass-detection surface.
 *   ⚠ **NOT P06-03.** No deduplication or cross-retry/replay/provider duplicate-prevention rules.
 *   ⚠ **NO provider execution, no credentials, no entitlements** (D9 N-1 / D10 §8.2).
 *   ⚠ **NO engine-input mapping.** N-5: a namespaced canonical field never reaches an engine by
 *     name coincidence; engine-input mapping is an explicit declared transformation owned by **P11**.
 *   ⚠ **NO new namespace, collision or fail-closed logic.** The `MD:` token, the domain-segment
 *     vocabulary and C1–C6 are IMPORTED from `p05/src/namespace.js` — the ADR-01 machinery is
 *     reused, never duplicated or varied (D8:35 *"no variation authorized"*).
 */

import {
  ALL_DOMAIN_SEGMENTS,
  NAMESPACE_TOKEN,
  SEGMENT_SEPARATOR,
} from '../../p05/src/namespace.js';
import { AVAILABILITY, DATA_TYPES, QUALITY } from '../../p05/src/contract.js';
import { canonicalDigest } from '../../p05/src/serialize.js';

export const P06_01_MODULE = 'P06-01-NORMALIZATION-PIPELINE';
export const MAPPING_DECLARATION_SCHEMA_VERSION = '1.0';

/** The eight declaration elements mandated by `P02_PROVIDER_MAPPING_RULES.md` §5. */
export const MAPPING_DECLARATION_ELEMENTS = Object.freeze([
  'MD-1', 'MD-2', 'MD-3', 'MD-4', 'MD-5', 'MD-6', 'MD-7', 'MD-8',
]);

/**
 * The CLOSED transformation vocabulary (MR-2: *"An undeclared mapping is prohibited — no
 * heuristic, fuzzy or name-similarity matching"*). A transformation outside this list is refused;
 * nothing is inferred from a field's name or shape.
 */
export const TRANSFORMATIONS = Object.freeze([
  'identity',     // pass the value through unchanged
  'string',       // require a non-empty string
  'decimal',      // numeric-string → canonical decimal at the declared precision
  'integer',      // require an integer
  'boolean',      // require a boolean
  'dateToIsoUtc', // 'YYYY-MM-DD' → 'YYYY-MM-DDT00:00:00.000Z' (TS-4 explicit UTC convention)
  'enum',         // map through a DECLARED table; an undeclared member is a failure, never a guess
]);

/** MD-5: the only timestamp slots a mapping may assign (P01 §3.2 rows 7–9), or 'none'. */
export const TIMESTAMP_SLOTS = Object.freeze(['observationTime', 'effectiveTime', 'publicationTime', 'none']);

/** Availability markers a mapping may assign when the source is absent or a sentinel. */
export const NON_PRESENT_AVAILABILITY = Object.freeze(AVAILABILITY.filter((a) => a !== 'PRESENT'));

export class MappingDeclarationError extends Error {
  /** @param {string[]} rules @param {string} message @param {Record<string, unknown>} [detail] */
  constructor(rules, message, detail = {}) {
    super(`[${rules.join(', ')}] ${message}`);
    this.name = 'MappingDeclarationError';
    this.rules = Object.freeze([...rules]);
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * Validate and freeze a mapping declaration. Every rule below is a rule the execution must obey
 * (MR-5) — enforced at declaration time so a non-conforming mapping cannot be executed at all.
 *
 * @param {Record<string, unknown>} cfg
 * @returns {Readonly<Record<string, unknown>>}
 */
export function declareNormalizationMapping(cfg) {
  const required = ['mappingId', 'mappingVersion', 'domain', 'providerKind', 'entries'];
  for (const k of required) {
    if (cfg?.[k] === undefined) {
      throw new MappingDeclarationError(['MR-4'], `a mapping declaration must declare '${k}'`, { missing: k });
    }
  }
  if (!Array.isArray(cfg.entries) || cfg.entries.length === 0) {
    throw new MappingDeclarationError(['MR-2'], 'a mapping declaration must contain at least one entry');
  }
  if (cfg.providerKind !== 'LOCAL_FIXTURE') {
    throw new MappingDeclarationError(['MR-5'],
      `P06-01 declares mappings for providerKind '${String(cfg.providerKind)}' — only LOCAL_FIXTURE is permitted; `
      + 'live provider execution is NOT_AUTHORIZED (D9 N-1, D10 §8.2)', { providerKind: cfg.providerKind });
  }

  const entries = cfg.entries.map((e, i) => assertEntry(e, i));

  // A canonical slot may be declared exactly once: two entries emitting one key would be a C1/C3
  // collision, so it is refused at declaration time rather than at execution time.
  const slots = entries.map((e) => `${e['MD-1'].domainSegment}${SEGMENT_SEPARATOR}${e['MD-1'].fieldSegment}`);
  const dupSlot = slots.find((s, i) => slots.indexOf(s) !== i);
  if (dupSlot !== undefined) {
    throw new MappingDeclarationError(['MD-1', 'C3', 'FD-1'],
      `canonical slot '${dupSlot}' is declared more than once — one slot, one source`, { slot: dupSlot });
  }
  // One provider-native element may feed at most one canonical slot: an undeclared fan-out would
  // be a heuristic, which MR-2 prohibits.
  const sources = entries.map((e) => e['MD-2'].providerElement);
  const dupSource = sources.find((s, i) => sources.indexOf(s) !== i);
  if (dupSource !== undefined) {
    throw new MappingDeclarationError(['MD-2', 'MR-2'],
      `provider element '${dupSource}' feeds more than one canonical slot — undeclared fan-out is prohibited`,
      { providerElement: dupSource });
  }

  const decl = Object.freeze({
    declarationSchemaVersion: MAPPING_DECLARATION_SCHEMA_VERSION,
    mappingId: cfg.mappingId,
    mappingVersion: cfg.mappingVersion,
    domain: cfg.domain,
    providerKind: cfg.providerKind,
    ...(cfg.provider !== undefined ? { provider: cfg.provider } : {}),
    envelope: Object.freeze({ ...(cfg.envelope ?? {}) }),
    contractedFieldCount: Number.isInteger(cfg.contractedFieldCount) ? cfg.contractedFieldCount : entries.length,
    knownLimitations: Object.freeze([...(cfg.knownLimitations ?? [])]),
    entries: Object.freeze(entries),
  });

  // MR-4 — a declaration must be reviewable as DATA: it round-trips through JSON without loss.
  const roundTripped = JSON.parse(JSON.stringify(decl));
  if (canonicalDigest(roundTripped) !== canonicalDigest(decl)) {
    throw new MappingDeclarationError(['MR-4'],
      'a mapping declaration must be pure data (JSON round-trip stable) so it is reviewable without reading code');
  }
  return decl;
}

/** Validate a single MD-1…MD-8 entry. */
function assertEntry(entry, index) {
  const where = `entry[${index}]`;
  for (const el of MAPPING_DECLARATION_ELEMENTS) {
    if (entry[el] === undefined) {
      throw new MappingDeclarationError(['MD-1', 'MR-4'],
        `${where} is missing required declaration element '${el}' (P02 §5)`, { index });
    }
  }

  // ── MD-1 canonical field slot (from P01_FIELD_DICTIONARY.md) ──
  const { domainSegment, fieldSegment } = entry['MD-1'];
  if (!ALL_DOMAIN_SEGMENTS.includes(domainSegment)) {
    // FD-7 / OI-D9-01: the dictionary vocabulary is imported, never extended here.
    throw new MappingDeclarationError(['MD-1', 'FD-1'],
      `${where} domain segment '${String(domainSegment)}' is not in the accepted P01 field-dictionary `
      + `vocabulary [${ALL_DOMAIN_SEGMENTS.join(', ')}] — refusing to invent a label`, { index, domainSegment });
  }
  if (typeof fieldSegment !== 'string' || fieldSegment.length === 0
      || fieldSegment.includes(SEGMENT_SEPARATOR) || fieldSegment.includes(NAMESPACE_TOKEN)) {
    throw new MappingDeclarationError(['MD-1', 'FD-1'],
      `${where} field segment '${String(fieldSegment)}' is not a single plain segment`, { index, fieldSegment });
  }

  // ── MD-2 provider-native source element (internal to the adapter) ──
  const providerElement = entry['MD-2'].providerElement;
  if (typeof providerElement !== 'string' || providerElement.length === 0) {
    throw new MappingDeclarationError(['MD-2'], `${where} must name a provider-native source element`, { index });
  }
  // M-3: a provider-native name is never namespaced; if it carries the token, the declaration is
  // claiming a canonical key as a provider input, which is incoherent.
  if (providerElement.includes(NAMESPACE_TOKEN)) {
    throw new MappingDeclarationError(['MD-2', 'M-3'],
      `${where} provider element '${providerElement}' must not carry the namespace token — `
      + 'provider-native names exist only inside the adapter', { index, providerElement });
  }

  // ── MD-3 transformation chain, ordered (closed vocabulary — MR-2) ──
  const transformations = entry['MD-3'].transformations;
  if (!Array.isArray(transformations) || transformations.length === 0) {
    throw new MappingDeclarationError(['MD-3', 'MR-1'],
      `${where} must declare a non-empty ordered transformation chain`, { index });
  }
  for (const t of transformations) {
    if (!TRANSFORMATIONS.includes(t)) {
      throw new MappingDeclarationError(['MD-3', 'MR-2'],
        `${where} transformation '${String(t)}' is not in the closed vocabulary `
        + `[${TRANSFORMATIONS.join(', ')}] — no heuristic or inferred transformation is permitted`, { index, t });
    }
  }
  if (transformations.includes('decimal') && !Number.isInteger(entry['MD-3'].precision)) {
    throw new MappingDeclarationError(['MD-3', 'MD-4', 'SM-5'],
      `${where} declares a 'decimal' transformation but no integer precision`, { index });
  }
  if (transformations.includes('enum') && (entry['MD-3'].enumTable === undefined
      || Object.keys(entry['MD-3'].enumTable).length === 0)) {
    throw new MappingDeclarationError(['MD-3', 'MR-2'],
      `${where} declares an 'enum' transformation but no declared table — an undeclared member must fail, not be guessed`,
      { index });
  }

  // ── MD-4 unit / currency / scale / precision handling ──
  const { dataType, monetary, dimension, currencySource, unit } = entry['MD-4'];
  if (!DATA_TYPES.includes(dataType)) {
    throw new MappingDeclarationError(['MD-4', 'ST-11'],
      `${where} dataType '${String(dataType)}' is not one of ${DATA_TYPES.join('|')}`, { index, dataType });
  }
  if (monetary !== 'yes' && monetary !== 'no') {
    throw new MappingDeclarationError(['MD-4'], `${where} monetary must be 'yes' or 'no'`, { index });
  }
  if (dimension !== 'dimensionless' && dimension !== 'dimensioned') {
    throw new MappingDeclarationError(['MD-4'], `${where} dimension must be 'dimensionless' or 'dimensioned'`, { index });
  }
  // SM-1 / CU-2 / FD-5: monetary ⇒ a currency SOURCE must be declared; never defaulted.
  if (monetary === 'yes' && (typeof currencySource !== 'string' || currencySource.length === 0)) {
    throw new MappingDeclarationError(['MD-4', 'SM-1', 'CU-2', 'FD-5'],
      `${where} is monetary but declares no currency source — a currency is never defaulted`, { index });
  }
  // SM-3 / UN-1 / FD-5: dimensioned ⇒ unit REQUIRED; dimensionless ⇒ PROHIBITED.
  if (dimension === 'dimensioned' && (typeof unit !== 'string' || unit.length === 0)) {
    throw new MappingDeclarationError(['MD-4', 'SM-3', 'UN-1', 'FD-5'],
      `${where} is dimensioned but declares no unit`, { index });
  }
  if (dimension === 'dimensionless' && unit !== undefined) {
    throw new MappingDeclarationError(['MD-4', 'SM-3', 'UN-1', 'FD-5'],
      `${where} is dimensionless but declares a unit — both are PROHIBITED together`, { index, unit });
  }

  // ── MD-5 timestamp slot assignment ──
  const { timestampSlot, timestampSource } = entry['MD-5'];
  if (!TIMESTAMP_SLOTS.includes(timestampSlot)) {
    throw new MappingDeclarationError(['MD-5'],
      `${where} timestampSlot '${String(timestampSlot)}' is not one of ${TIMESTAMP_SLOTS.join('|')}`, { index });
  }
  if (timestampSlot !== 'none' && (typeof timestampSource !== 'string' || timestampSource.length === 0)) {
    throw new MappingDeclarationError(['MD-5'],
      `${where} assigns timestamp slot '${timestampSlot}' but declares no source`, { index });
  }
  // TS-4: any reshaping of a timestamp source must be DECLARED, never assumed from its shape.
  const timestampTransform = entry['MD-5'].timestampTransform ?? 'identity';
  if (!TRANSFORMATIONS.includes(timestampTransform)) {
    throw new MappingDeclarationError(['MD-5', 'MD-3', 'MR-2'],
      `${where} timestampTransform '${String(timestampTransform)}' is not in the closed vocabulary`,
      { index, timestampTransform });
  }

  // ── MD-6 sentinel and null handling → availability ──
  const md6 = entry['MD-6'];
  const onAbsent = md6.onAbsent ?? 'NOT_PROVIDED';
  if (!NON_PRESENT_AVAILABILITY.includes(onAbsent)) {
    // M-5: a canonical slot the provider cannot supply is NOT emitted with a fabricated value.
    throw new MappingDeclarationError(['MD-6', 'M-5', 'NL-3'],
      `${where} onAbsent '${String(onAbsent)}' would fabricate a value for an absent source — `
      + `only ${NON_PRESENT_AVAILABILITY.join('|')} are permitted`, { index, onAbsent });
  }
  for (const [sentinel, marker] of Object.entries(md6.sentinels ?? {})) {
    if (!NON_PRESENT_AVAILABILITY.includes(marker)) {
      throw new MappingDeclarationError(['MD-6', 'NL-1'],
        `${where} maps sentinel '${sentinel}' to '${String(marker)}', which is not a valid availability marker`,
        { index, sentinel, marker });
    }
  }
  if (md6.nullMarker !== undefined && !NON_PRESENT_AVAILABILITY.includes(md6.nullMarker)) {
    throw new MappingDeclarationError(['MD-6', 'NL-1'],
      `${where} nullMarker '${String(md6.nullMarker)}' is not a valid availability marker`, { index });
  }

  // ── MD-7 pitEligible disposition ──
  if (typeof entry['MD-7'].pitEligible !== 'boolean') {
    throw new MappingDeclarationError(['MD-7'], `${where} pitEligible must be a boolean`, { index });
  }

  // ── MD-8 known fidelity limitations ──
  if (!Array.isArray(entry['MD-8'].knownLimitations)) {
    throw new MappingDeclarationError(['MD-8'], `${where} knownLimitations must be an array`, { index });
  }

  return Object.freeze({
    'MD-1': Object.freeze({ domainSegment, fieldSegment }),
    'MD-2': Object.freeze({ providerElement }),
    'MD-3': Object.freeze({
      transformations: Object.freeze([...transformations]),
      ...(entry['MD-3'].precision !== undefined ? { precision: entry['MD-3'].precision } : {}),
      ...(entry['MD-3'].enumTable !== undefined ? { enumTable: Object.freeze({ ...entry['MD-3'].enumTable }) } : {}),
    }),
    'MD-4': Object.freeze({
      dataType, monetary, dimension,
      ...(currencySource !== undefined ? { currencySource } : {}),
      ...(unit !== undefined ? { unit } : {}),
    }),
    'MD-5': Object.freeze({
      timestampSlot,
      timestampTransform,
      ...(timestampSource !== undefined ? { timestampSource } : {}),
    }),
    'MD-6': Object.freeze({
      onAbsent,
      sentinels: Object.freeze({ ...(md6.sentinels ?? {}) }),
      ...(md6.nullMarker !== undefined ? { nullMarker: md6.nullMarker } : {}),
    }),
    'MD-7': Object.freeze({ pitEligible: entry['MD-7'].pitEligible }),
    'MD-8': Object.freeze({ knownLimitations: Object.freeze([...entry['MD-8'].knownLimitations]) }),
  });
}

/** Every canonical slot a declaration emits, as `segment.field` (deterministic order). */
export function declaredCanonicalSlots(decl) {
  return Object.freeze(decl.entries
    .map((e) => `${e['MD-1'].domainSegment}${SEGMENT_SEPARATOR}${e['MD-1'].fieldSegment}`)
    .sort());
}

/** Every provider-native element a declaration consumes (deterministic order). */
export function declaredProviderElements(decl) {
  return Object.freeze(decl.entries.map((e) => e['MD-2'].providerElement).sort());
}

/**
 * Every provider-native element a declaration READS — the MD-2 data sources plus the MD-4 currency
 * source and the MD-5 timestamp sources. A source that is read but not a data slot is still
 * declared, and must not be reported as dropped.
 */
export function consumedProviderElements(decl) {
  const set = new Set(decl.entries.map((e) => e['MD-2'].providerElement));
  for (const e of decl.entries) {
    if (typeof e['MD-4'].currencySource === 'string') set.add(e['MD-4'].currencySource);
    if (typeof e['MD-5'].timestampSource === 'string') set.add(e['MD-5'].timestampSource);
  }
  for (const v of Object.values(decl.envelope ?? {})) {
    const src = typeof v === 'string' ? v : v?.source;
    if (typeof src === 'string' && src.length > 0) set.add(src);
  }
  return Object.freeze([...set].sort());
}

/**
 * M-4 — provider payload elements with **no** declared counterpart. These are DROPPED inside the
 * adapter and recorded as a known limitation; they are never smuggled through a free-form bag,
 * `extras` map, metadata blob or provenance string.
 *
 * Envelope/control elements (declared in `decl.envelope.*Source` and the fixture control keys) are
 * not data elements and are excluded.
 *
 * @param {Readonly<Record<string, unknown>>} decl
 * @param {Record<string, unknown>} payload
 * @returns {ReadonlyArray<string>}
 */
export function undeclaredProviderElements(decl, payload) {
  const consumed = new Set(consumedProviderElements(decl));
  return Object.freeze(Object.keys(payload)
    .filter((k) => !k.startsWith('_') && !consumed.has(k))
    .sort());
}

/** Deterministic identity of a declaration (participates in the canonical output digest). */
export function mappingDigest(decl) {
  return canonicalDigest({
    mappingId: decl.mappingId,
    mappingVersion: decl.mappingVersion,
    declarationSchemaVersion: decl.declarationSchemaVersion,
    domain: decl.domain,
    slots: declaredCanonicalSlots(decl),
    sources: declaredProviderElements(decl),
    entries: decl.entries,
  });
}

/** Re-exported so callers never import the token from two places. */
export { QUALITY };
