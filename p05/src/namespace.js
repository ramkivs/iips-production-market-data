/**
 * P05-01 — FIELD NAMESPACE AND ADR-01 COLLISION GUARD (C1–C6)
 *
 * Authority:
 *   OI-10 RESOLVED — exact token `MD:`, canonical form `MD:<domain>.<field>`
 *     docs/CHECKPOINT-03.md:75-77
 *   ADR-01 C1–C6 — UNCHANGED
 *     docs/CHECKPOINT-03.md §3.2 (6 of 6 UNCHANGED)
 *     docs/p01/P01_VALIDATION_RULES.md §3
 *   Domain-segment vocabulary: taken verbatim from the ACCEPTED P01 field dictionary
 *     docs/p01/P01_FIELD_DICTIONARY.md §3–§12
 *
 * ⚠ NO domain-segment label is invented here. Every segment below is read out of the
 *   accepted dictionary; `tests/namespace.test.js` proves that mechanically by parsing
 *   the dictionary and comparing sets.
 *
 * ⚠ OI-D9-01 CORRECTION: the dictionary expresses these segments with the `<NS>`
 *   placeholder, which CHECKPOINT-03 §3.3(5) / recovery rule 14 binds to `MD:` for NEW
 *   work. The vocabulary is therefore COMPLETE for D01–D10 — see docs/p05/P05_01_OPEN_ITEMS.md.
 */

/** OI-10 token of record. UPPERCASE 'M','D' then ASCII colon. */
export const NAMESPACE_TOKEN = 'MD:';

/** Separator between domain segment and field segment (OI-10 canonical form). */
export const SEGMENT_SEPARATOR = '.';

/** Namespace scheme version — participates in replay identity (ADR-02). */
export const NAMESPACE_VERSION = '1.0';

/**
 * Domain-segment vocabulary, per domain, verbatim from P01_FIELD_DICTIONARY.md.
 * D01 carries TWO segments (price + valuation) — the valuation slots are the
 * collision-critical price-derived ratios (dictionary §3, D4_07 §I.1).
 */
export const DOMAIN_SEGMENTS = Object.freeze({
  D01: Object.freeze(['price', 'valuation']),
  D02: Object.freeze(['ohlcv']),
  D03: Object.freeze(['fundamentals']),
  D04: Object.freeze(['corpaction']),
  D05: Object.freeze(['identity']),
  D06: Object.freeze(['news']),
  D07: Object.freeze(['estimates']),
  D08: Object.freeze(['macro']),
  D09: Object.freeze(['alt']),
  D10: Object.freeze(['venue']),
});

/** Every permitted domain segment, flattened and sorted (deterministic). */
export const ALL_DOMAIN_SEGMENTS = Object.freeze(
  [...new Set(Object.values(DOMAIN_SEGMENTS).flat())].sort(),
);

/** D01–D10 only (P01_DATA_CONTRACT.md §3.1 row 15; ST-8). No new domains. */
export const VALID_DOMAINS = Object.freeze(Object.keys(DOMAIN_SEGMENTS).sort());

/** Typed namespace/contract violation. Carries rule IDs for RJ-4 evidence events. */
export class NamespaceViolation extends Error {
  /**
   * @param {string[]} rules  violated rule IDs (C1..C6, FD-1..)
   * @param {string} message
   * @param {Record<string, unknown>} detail
   */
  constructor(rules, message, detail = {}) {
    super(message);
    this.name = 'NamespaceViolation';
    this.rules = Object.freeze([...rules]);
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * True iff `key` carries the mandatory namespace (ADR-01 C1 structural property).
 * @param {string} key
 * @returns {boolean}
 */
export function isNamespaced(key) {
  return typeof key === 'string' && key.startsWith(NAMESPACE_TOKEN);
}

/**
 * Parse a canonical key into its segments.
 * @param {string} key
 * @returns {{token: string, domain: string, field: string}}
 * @throws {NamespaceViolation} C1 / FD-1 when the key is not well-formed namespaced
 */
export function parseKey(key) {
  if (!isNamespaced(key)) {
    throw new NamespaceViolation(['C1', 'FD-1'],
      `key '${key}' does not carry the mandatory namespace '${NAMESPACE_TOKEN}'`,
      { offendingKey: key });
  }
  const body = key.slice(NAMESPACE_TOKEN.length);
  const sep = body.indexOf(SEGMENT_SEPARATOR);
  if (sep <= 0 || sep === body.length - 1) {
    throw new NamespaceViolation(['C1', 'FD-1'],
      `key '${key}' is not of the canonical form ${NAMESPACE_TOKEN}<domain>.<field>`,
      { offendingKey: key });
  }
  return Object.freeze({
    token: NAMESPACE_TOKEN,
    domain: body.slice(0, sep),
    field: body.slice(sep + 1),
  });
}

/**
 * Build a canonical key. Rejects any domain segment not in the accepted vocabulary,
 * so an unresolved/invented label can never be silently produced.
 * @param {string} domainSegment
 * @param {string} fieldSegment
 * @returns {string}
 * @throws {NamespaceViolation}
 */
export function buildKey(domainSegment, fieldSegment) {
  if (!ALL_DOMAIN_SEGMENTS.includes(domainSegment)) {
    throw new NamespaceViolation(['FD-1'],
      `domain segment '${domainSegment}' is not in the accepted P01 field-dictionary vocabulary ` +
      `[${ALL_DOMAIN_SEGMENTS.join(', ')}]. Refusing to invent a label (OI-D9-01).`,
      { domainSegment, permitted: [...ALL_DOMAIN_SEGMENTS] });
  }
  if (typeof fieldSegment !== 'string' || fieldSegment.length === 0 ||
      fieldSegment.includes(SEGMENT_SEPARATOR) || fieldSegment.includes(NAMESPACE_TOKEN)) {
    throw new NamespaceViolation(['FD-1'],
      `field segment '${fieldSegment}' is not a single plain segment`,
      { fieldSegment });
  }
  return `${NAMESPACE_TOKEN}${domainSegment}${SEGMENT_SEPARATOR}${fieldSegment}`;
}

/**
 * ADR-01 C1 — namespace partition.
 * Every key in `data.fields` MUST carry the namespace; a non-namespaced key is a hard error.
 * @param {Iterable<string>} fieldKeys
 * @throws {NamespaceViolation}
 */
export function assertC1(fieldKeys) {
  const offenders = [...fieldKeys].filter((k) => !isNamespaced(k)).sort();
  if (offenders.length > 0) {
    throw new NamespaceViolation(['C1'],
      `C1 namespace partition violated: ${offenders.length} non-namespaced key(s)`,
      { offendingKeys: offenders });
  }
  return true;
}

/**
 * ADR-01 C2 — reverse partition.
 * No key in `companyInputs` may carry the namespace.
 * @param {Iterable<string>} companyInputKeys
 * @throws {NamespaceViolation}
 */
export function assertC2(companyInputKeys) {
  const offenders = [...companyInputKeys].filter((k) => isNamespaced(k)).sort();
  if (offenders.length > 0) {
    throw new NamespaceViolation(['C2'],
      `C2 reverse partition violated: ${offenders.length} namespaced key(s) in companyInputs`,
      { offendingKeys: offenders });
  }
  return true;
}

/**
 * ADR-01 C3 — intersection test.
 * keys(data.fields) ∩ keys(companyInputs) MUST be empty; non-empty lists every colliding key.
 * @param {Iterable<string>} fieldKeys
 * @param {Iterable<string>} companyInputKeys
 * @throws {NamespaceViolation}
 */
export function assertC3(fieldKeys, companyInputKeys) {
  const ci = new Set(companyInputKeys);
  const collisions = [...fieldKeys].filter((k) => ci.has(k)).sort();
  if (collisions.length > 0) {
    throw new NamespaceViolation(['C3'],
      `C3 intersection violated: ${collisions.length} colliding key(s)`,
      { collidingKeys: collisions });
  }
  return true;
}

/**
 * ADR-01 C4 — cross-snapshot test.
 * Pairwise key intersections across contributing snapshots MUST be empty;
 * non-empty names BOTH snapshot IDs and the keys.
 * @param {Array<{snapshotId: string, keys: Iterable<string>}>} contributing
 * @throws {NamespaceViolation}
 */
export function assertC4(contributing) {
  const list = [...contributing];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const a = new Set(list[i].keys);
      const shared = [...list[j].keys].filter((k) => a.has(k)).sort();
      if (shared.length > 0) {
        throw new NamespaceViolation(['C4'],
          `C4 cross-snapshot intersection violated between '${list[i].snapshotId}' and ` +
          `'${list[j].snapshotId}': ${shared.length} shared key(s)`,
          {
            snapshotIdA: list[i].snapshotId,
            snapshotIdB: list[j].snapshotId,
            collidingKeys: shared,
          });
      }
    }
  }
  return true;
}

/**
 * ADR-01 C5 — fail-closed.
 * Runs C1–C4 as one gate. ANY violation aborts: no partial merge, no precedence,
 * no coercion, no warning-and-continue. Nothing is returned on failure.
 * @param {{fields: Iterable<string>, companyInputs: Iterable<string>,
 *          contributing: Array<{snapshotId: string, keys: Iterable<string>}>}} input
 * @returns {true}
 * @throws {NamespaceViolation}
 */
export function assertCollisionGuard({ fields, companyInputKeys = [], contributing = [] }) {
  assertC1(fields);
  assertC2(companyInputKeys);
  assertC3(fields, companyInputKeys);
  assertC4(contributing);
  return true;
}

/**
 * ADR-01 C6 — deterministic merge order.
 * Where merging is legal, order is canonical and specified — never implementation-incidental.
 * Canonical order: ascending byte order of the full namespaced key.
 * @param {Iterable<string>} keys
 * @returns {string[]}
 */
export function canonicalKeyOrder(keys) {
  return [...keys].sort();
}

/**
 * Deterministic, order-canonical merge of several field maps (C6).
 * Runs the full C1–C6 guard first (C5 fail-closed) and only then merges.
 * @param {Array<{snapshotId: string, fields: Record<string, unknown>}>} snapshots
 * @param {Iterable<string>} companyInputKeys
 * @returns {Record<string, unknown>} merged, canonically ordered
 * @throws {NamespaceViolation}
 */
export function mergeFieldMaps(snapshots, companyInputKeys = []) {
  const contributing = snapshots.map((s) => ({ snapshotId: s.snapshotId, keys: Object.keys(s.fields) }));
  const allKeys = snapshots.flatMap((s) => Object.keys(s.fields));
  assertCollisionGuard({ fields: allKeys, companyInputKeys, contributing });

  /** @type {Record<string, unknown>} */
  const merged = {};
  for (const key of canonicalKeyOrder(allKeys)) {
    for (const snap of snapshots) {
      if (Object.prototype.hasOwnProperty.call(snap.fields, key)) {
        merged[key] = snap.fields[key];
        break; // legal merge: C4 already proved the key is unique across snapshots
      }
    }
  }
  return merged;
}
