/**
 * P05-01 — VALIDATION AND REJECTION ENGINE (P01 S1–S5)
 *
 * Authority: docs/p01/P01_VALIDATION_RULES.md
 *   S1 structural   → REJECT          S2 namespace partition → REJECT (fail-closed)
 *   S3 semantic     → REJECT          S4 referential         → REJECT
 *   S5 quality      → CLASSIFY (degraded state, NOT rejection)
 *
 *   RJ-1  rejection is explicit and typed; no partial acceptance
 *   RJ-2  a rejected snapshot is never admitted downstream in any degraded form
 *   RJ-3  fail-closed: on doubt, reject — never admit-and-warn
 *   RJ-4  every rejection emits an evidence-bearing event
 *   RJ-6  PROHIBITED: silent overwrite · precedence · "last wins" · dropping a field ·
 *         substituting a default · downgrading a rejection to quality:'partial'
 *   Q-5   a contract violation is NOT a quality state
 */

import { ContractViolation } from './serialize.js';
import {
  findFieldQualityViolations, MODES, QUALITY, QUALITY_RANK, SNAPSHOT_ID_PATTERN,
} from './contract.js';
import { assertC1, assertC2, assertC3, assertC4, isNamespaced, VALID_DOMAINS } from './namespace.js';

/** Domains whose fields are keyed by instrument identity (RF-1). D08 macro and D10 venue are not. */
export const INSTRUMENT_KEYED_DOMAINS = Object.freeze(['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D09']);
/** Domains whose content is licence-restricted and additionally needs governance classification (RF-8, E-5). */
export const LICENCE_RESTRICTED_DOMAINS = Object.freeze(['D06', 'D09']);

/** Typed rejection carrying the violated rule IDs and offending keys (RJ-1, RJ-4). */
export class SnapshotRejection extends Error {
  /**
   * @param {string} stage   S1 | S2 | S3 | S4
   * @param {string[]} rules
   * @param {string} reason
   * @param {Record<string, unknown>} [detail]
   */
  constructor(stage, rules, reason, detail = {}) {
    super(`[${stage}] ${rules.join(',')}: ${reason}`);
    this.name = 'SnapshotRejection';
    this.stage = stage;
    this.rules = Object.freeze([...rules]);
    this.reason = reason;
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * S1 — structural validation (ST-1…ST-12).
 * @param {Record<string, unknown>} s  a built snapshot
 * @throws {SnapshotRejection}
 */
export function validateS1(s) {
  const required = ['snapshotId', 'provider', 'dataVersion', 'schemaVersion', 'namespaceVersion',
    'asOf', 'receivedAt', 'mode', 'quality', 'completenessPct', 'domain', 'lineage', 'fields'];
  const missing = required.filter((k) => s[k] === undefined);
  if (missing.length > 0) {
    throw new SnapshotRejection('S1', ['ST-1'], `missing REQUIRED envelope slot(s): ${missing.join(', ')}`, { missing });
  }
  if (!SNAPSHOT_ID_PATTERN.test(s.snapshotId)) {
    throw new SnapshotRejection('S1', ['ST-2'], `snapshotId '${s.snapshotId}' does not match the frozen format`, { snapshotId: s.snapshotId });
  }
  const expected = `data-${s.provider}-${s.dataVersion}-${s.asOf}`;
  if (s.snapshotId !== expected) {
    throw new SnapshotRejection('S1', ['ST-3'],
      `snapshotId '${s.snapshotId}' is inconsistent with its own provider/dataVersion/asOf ('${expected}')`,
      { snapshotId: s.snapshotId, expected });
  }
  if (!MODES.includes(s.mode)) throw new SnapshotRejection('S1', ['ST-4'], `mode '${s.mode}' invalid`, { mode: s.mode });
  if (s.mode === 'PIT' && s.pitBoundary === undefined) throw new SnapshotRejection('S1', ['ST-5'], 'PIT requires pitBoundary', {});
  if (s.mode !== 'PIT' && s.pitBoundary !== undefined) throw new SnapshotRejection('S1', ['ST-5'], `${s.mode} prohibits pitBoundary`, { mode: s.mode });
  if (!QUALITY.includes(s.quality)) throw new SnapshotRejection('S1', ['ST-6'], `quality '${s.quality}' invalid`, { quality: s.quality });
  if (typeof s.completenessPct !== 'number' || s.completenessPct < 0 || s.completenessPct > 100) {
    throw new SnapshotRejection('S1', ['ST-7'], `completenessPct ${s.completenessPct} outside [0,100]`, { completenessPct: s.completenessPct });
  }
  if (!VALID_DOMAINS.includes(s.domain)) throw new SnapshotRejection('S1', ['ST-8'], `domain '${s.domain}' not D01…D10`, { domain: s.domain });

  const keys = Object.keys(s.fields);
  if (keys.length === 0 && s.quality !== 'unavailable') {
    throw new SnapshotRejection('S1', ['ST-9'], `empty fields with quality '${s.quality}'`, { quality: s.quality });
  }
  // ST-10: frozen — an unfrozen snapshot is a structural defect, not a warning.
  if (!Object.isFrozen(s) || !Object.isFrozen(s.fields)) {
    throw new SnapshotRejection('S1', ['ST-10', 'SN-1'], 'snapshot or fields are not frozen — mutation must be impossible', {});
  }
  for (const key of keys) {
    const f = s.fields[key];
    const needed = ['key', 'dataType', 'availability', 'provenance'];
    const absent = needed.filter((k) => f[k] === undefined);
    if (absent.length > 0 || typeof f.pitEligible !== 'boolean') {
      throw new SnapshotRejection('S1', ['ST-11'],
        `field '${key}' is missing ${[...absent, ...(typeof f.pitEligible === 'boolean' ? [] : ['pitEligible'])].join(', ')}`,
        { key, absent });
    }
    if (f.key !== key) {
      throw new SnapshotRejection('S1', ['ST-11'], `field record key '${f.key}' disagrees with its map key '${key}'`, { key, recordKey: f.key });
    }
  }
  return true;
}

/**
 * S2 — namespace partition (ADR-01 C1–C6), FAIL-CLOSED.
 * @param {Record<string, unknown>} s
 * @param {Iterable<string>} [companyInputKeys]
 * @param {Array<{snapshotId: string, keys: Iterable<string>}>} [contributing]
 * @throws {SnapshotRejection}
 */
export function validateS2(s, companyInputKeys = [], contributing = []) {
  const keys = Object.keys(s.fields);
  try {
    assertC1(keys);
    assertC2(companyInputKeys);
    assertC3(keys, companyInputKeys);
    assertC4(contributing);
  } catch (err) {
    // C5: any C1–C4 violation ABORTS. No partial merge, no precedence, no coercion.
    if (err && err.rules) {
      throw new SnapshotRejection('S2', err.rules, err.message, { ...err.detail, snapshotId: s.snapshotId });
    }
    throw err;
  }
  // FD-1 structural: every key parses as MD:<domain>.<field>
  for (const key of keys) {
    if (!isNamespaced(key) || !/^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/.test(key)) {
      throw new SnapshotRejection('S2', ['C1', 'FD-1'],
        `key '${key}' is not of the canonical form MD:<domain>.<field>`, { key, snapshotId: s.snapshotId });
    }
  }
  return true;
}

/**
 * S3 — semantic validation (SM-1…SM-14, NL-1…NL-7, FD-5, FD-6).
 * @param {Record<string, unknown>} s
 * @throws {SnapshotRejection}
 */
export function validateS3(s) {
  for (const [key, f] of Object.entries(s.fields)) {
    if (f.availability === 'PRESENT') {
      if (f.monetary === 'yes' && !/^[A-Z]{3}$/.test(f.currency ?? '')) {
        throw new SnapshotRejection('S3', ['SM-1', 'SM-2', 'CU-2'], `monetary field '${key}' lacks ISO-4217 currency`, { key, currency: f.currency });
      }
      if (f.monetary !== 'yes' && f.currency !== undefined) {
        throw new SnapshotRejection('S3', ['FD-5'], `non-monetary field '${key}' carries a currency`, { key });
      }
      if (f.dimension === 'dimensioned' && !f.unit) {
        throw new SnapshotRejection('S3', ['SM-3', 'UN-1'], `dimensioned field '${key}' lacks a unit`, { key });
      }
      if (f.dimension !== 'dimensioned' && f.unit !== undefined) {
        throw new SnapshotRejection('S3', ['SM-3', 'UN-1'], `dimensionless field '${key}' carries a unit`, { key });
      }
      if (f.dataType === 'decimal' && f.precision === undefined) {
        throw new SnapshotRejection('S3', ['SM-5', 'NP-1'], `decimal field '${key}' lacks declared precision`, { key });
      }
    }
    // NL-2 / NL-3 / NL-4 / NL-7
    if (f.availability === 'PRESENT' && (f.value === undefined || f.value === null)) {
      throw new SnapshotRejection('S3', ['NL-2'], `field '${key}' PRESENT without a value`, { key });
    }
    if (f.availability !== 'PRESENT' && f.value !== undefined && f.value !== null) {
      throw new SnapshotRejection('S3', ['NL-3', 'NL-7'], `field '${key}' ${f.availability} carries a substituted value`, { key });
    }
    if (f.availability === 'WITHHELD' && !f.entitlementRef) {
      throw new SnapshotRejection('S3', ['NL-5'], `field '${key}' WITHHELD without entitlementRef`, { key });
    }
    // SM-7 / FD-6 / MD-4: a PIT snapshot may not carry a non-PIT-eligible field.
    if (s.mode === 'PIT' && f.pitEligible === false) {
      throw new SnapshotRejection('S3', ['SM-7', 'FD-6', 'MD-4'],
        `mode PIT contains non-PIT-eligible field '${key}'`, { key, snapshotId: s.snapshotId });
    }
    // SM-10: effective-dated data needs effectiveTime; revision-bearing needs publicationTime.
    if (f.effectiveDated === true && f.effectiveTime === undefined) {
      throw new SnapshotRejection('S3', ['SM-10'], `effective-dated field '${key}' lacks effectiveTime`, { key });
    }
    if (f.revisionBearing === true && f.publicationTime === undefined) {
      throw new SnapshotRejection('S3', ['SM-10', 'PIT-4'], `revision-bearing field '${key}' lacks publicationTime`, { key });
    }
    // SM-11 / AJ-3
    if (f.value !== null && typeof f.value === 'object' && f.adjusted === true && !f.adjustmentBasisRef) {
      throw new SnapshotRejection('S3', ['SM-11', 'AJ-3'], `adjusted field '${key}' lacks adjustmentBasisRef`, { key });
    }
    if (f.adjusted === true && !f.adjustmentBasisRef) {
      throw new SnapshotRejection('S3', ['SM-11', 'AJ-3'], `adjusted field '${key}' lacks adjustmentBasisRef`, { key });
    }
  }
  // SM-13 / Q-6
  const offenders = findFieldQualityViolations(s.quality, s.fields);
  if (offenders.length > 0) {
    throw new SnapshotRejection('S3', ['SM-13', 'Q-6'],
      `field-level quality better than snapshot quality '${s.quality}': ${offenders.join(', ')}`,
      { offendingKeys: offenders, snapshotQuality: s.quality });
  }
  // SM-9: receivedAt earlier than asOf without declared justification.
  if (Date.parse(s.receivedAt) < Date.parse(s.asOf) && s.lineage?.receivedBeforeAsOfJustification === undefined) {
    throw new SnapshotRejection('S3', ['SM-9'],
      `receivedAt '${s.receivedAt}' is earlier than asOf '${s.asOf}' without a declared justification`,
      { receivedAt: s.receivedAt, asOf: s.asOf });
  }
  return true;
}

/**
 * S4 — referential validation (RF-1…RF-9).
 * @param {Record<string, unknown>} s
 * @throws {SnapshotRejection}
 */
export function validateS4(s) {
  // RF-1: instrument-keyed domain requires an identity reference.
  if (INSTRUMENT_KEYED_DOMAINS.includes(s.domain) && s.identity === undefined) {
    throw new SnapshotRejection('S4', ['RF-1'],
      `instrument-keyed domain ${s.domain} has no identity reference`, { domain: s.domain, snapshotId: s.snapshotId });
  }
  // RF-9: D08 macro must use series identity, never instrument identity or companyId.
  if (s.domain === 'D08') {
    if (s.identity?.canonicalSecurityId !== undefined || s.identity?.mappedCompanyId !== undefined) {
      throw new SnapshotRejection('S4', ['RF-9'],
        'D08 macro must use series identity — never instrument identity or companyId', { snapshotId: s.snapshotId });
    }
    if (s.identity?.seriesId === undefined) {
      throw new SnapshotRejection('S4', ['RF-9'], 'D08 macro requires a seriesId identity', { snapshotId: s.snapshotId });
    }
  }
  // RF-2: identity crossing the AD-1 adapter requires identityMappingVersion.
  const crosses = s.identity?.mappedCompanyId !== undefined || s.identity?.adapterCrossing === true;
  if (crosses && s.identityMappingVersion === undefined) {
    throw new SnapshotRejection('S4', ['RF-2', 'L-9', 'ID-3'],
      'identity crosses the AD-1 adapter without identityMappingVersion', { snapshotId: s.snapshotId });
  }
  // RF-4: a provider symbol must never be used as an identity.
  if (s.identity?.canonicalSecurityId !== undefined && s.identity.providerSymbolAsIdentity === true) {
    throw new SnapshotRejection('S4', ['RF-4', 'ID-6', 'PN-2'],
      'a provider symbol is being used as an identity — prohibited', { snapshotId: s.snapshotId });
  }
  // RF-5: venue-scoped price data requires a venueRef.
  if (s.domain === 'D01' && Object.keys(s.fields).some((k) => k.startsWith('MD:price.')) &&
      s.fields['MD:price.venueRef'] === undefined && s.identity?.venueRef === undefined) {
    throw new SnapshotRejection('S4', ['RF-5'],
      'venue-scoped price data has no venueRef', { snapshotId: s.snapshotId });
  }
  // RF-6: complete lineage block.
  const required = ['sourceRef', 'adapterId', 'adapterVersion', 'transformationChainRef', 'receivedAt', 'namespaceVersion'];
  const missing = required.filter((k) => s.lineage?.[k] === undefined);
  if (missing.length > 0) {
    throw new SnapshotRejection('S4', ['RF-6', 'LN-1'], `lineage block missing ${missing.join(', ')}`, { missing, snapshotId: s.snapshotId });
  }
  // RF-7: every field provenance must resolve inside the snapshot lineage block.
  const lineageIds = new Set(collectLineageRefs(s.lineage));
  const unresolvable = Object.entries(s.fields)
    .filter(([, f]) => !lineageIds.has(f.provenance))
    .map(([k]) => k).sort();
  if (unresolvable.length > 0) {
    throw new SnapshotRejection('S4', ['RF-7'],
      `field provenance not resolvable within the snapshot lineage block: ${unresolvable.join(', ')}`,
      { offendingKeys: unresolvable, snapshotId: s.snapshotId });
  }
  // RF-8: licence-restricted content requires governance classification.
  if (LICENCE_RESTRICTED_DOMAINS.includes(s.domain) && s.lineage?.governanceClassification === undefined) {
    throw new SnapshotRejection('S4', ['RF-8', 'E-5'],
      `licence-restricted domain ${s.domain} has no governanceClassification (AD-11)`, { domain: s.domain });
  }
  return true;
}

/** @param {Record<string, unknown>} lineage @returns {string[]} */
function collectLineageRefs(lineage) {
  const refs = [];
  const walk = (node) => {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') { refs.push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node === 'object') {
      if (typeof node.ref === 'string') refs.push(node.ref);
      if (typeof node.refId === 'string') refs.push(node.refId);
      Object.values(node).forEach(walk);
    }
  };
  walk(lineage);
  return refs;
}

/**
 * S5 — quality classification. NOT a rejection (Q-5).
 * @param {Record<string, unknown>} s
 * @returns {{quality: string, completenessPct: number, classification: string}}
 */
export function classifyQuality(s) {
  const keys = Object.keys(s.fields);
  if (keys.length === 0) {
    return { quality: 'unavailable', completenessPct: 0, classification: 'PROVIDER_UNAVAILABLE (E1)' };
  }
  const withheld = keys.filter((k) => s.fields[k].availability === 'WITHHELD');
  const notProvided = keys.filter((k) => s.fields[k].availability === 'NOT_PROVIDED');
  const asserted = keys.filter((k) => s.fields[k].availability === 'NULL_ASSERTED');
  const applicable = keys.length - asserted.length;
  const completenessPct = applicable === 0 ? 100
    : Number((((applicable - withheld.length - notProvided.length) / applicable) * 100).toFixed(2));

  let quality = s.quality;
  let classification = 'COMPLETE_VALID';
  if (withheld.length > 0 || notProvided.length > 0) {
    quality = QUALITY_RANK[s.quality] > QUALITY_RANK.partial ? s.quality : 'partial';
    classification = withheld.length > 0 ? 'PARTIAL_WITH_WITHHELD' : 'PARTIAL_NOT_PROVIDED';
  }
  // Q-3: quality is propagated, never coerced or dropped.
  return { quality, completenessPct, classification };
}

/**
 * Run the full S1→S4 rejection pipeline, then S5 classification.
 * RJ-2: on rejection NOTHING is admitted — the function throws and returns no snapshot.
 *
 * @param {Record<string, unknown>} snapshot
 * @param {{companyInputKeys?: Iterable<string>,
 *          contributing?: Array<{snapshotId: string, keys: Iterable<string>}>}} [opts]
 * @returns {{snapshot: Record<string, unknown>, quality: string,
 *            completenessPct: number, classification: string}}
 * @throws {SnapshotRejection}
 */
export function validateSnapshot(snapshot, opts = {}) {
  validateS1(snapshot);
  validateS2(snapshot, opts.companyInputKeys ?? [], opts.contributing ?? []);
  validateS3(snapshot);
  validateS4(snapshot);
  const q = classifyQuality(snapshot);
  return { snapshot, ...q };
}

/**
 * RJ-4 — the mandatory evidence-bearing rejection event.
 * @param {SnapshotRejection} rejection
 * @param {Record<string, unknown>} ctx
 * @returns {Readonly<Record<string, unknown>>}
 */
export function rejectionEvent(rejection, ctx) {
  return Object.freeze({
    stage: rejection.stage,
    violatedRules: rejection.rules,
    reason: rejection.reason,
    offendingKeys: Object.freeze([...(rejection.detail.offendingKeys ?? [])].sort()),
    snapshotIds: Object.freeze([...(ctx.snapshotIds ?? (rejection.detail.snapshotId ? [rejection.detail.snapshotId] : []))].sort()),
    provider: ctx.provider ?? null,
    domain: ctx.domain ?? null,
    schemaVersion: ctx.schemaVersion ?? null,
    namespaceVersion: ctx.namespaceVersion ?? null,
    engineId: ctx.engineId ?? null,
    requestId: ctx.requestId ?? null,
    // RJ-5: a rejection is a data-quality FAILURE, propagated — never coerced to 'partial'.
    disposition: 'REJECTED_FAIL_CLOSED',
    admittedDownstream: false,
  });
}

export { ContractViolation };
