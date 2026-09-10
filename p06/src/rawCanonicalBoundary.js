/**
 * P06-02 — RAW / CANONICAL **STORAGE BOUNDARY**
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P06-02 — *Raw/canonical separation*:
 *     Requirement     **Keep raw provider payloads separate from governed canonical data.**
 *     Deliverable     **Storage boundary**
 *     Dependencies    `P05-04,P06-01` (Hard) — **both COMPLETE**
 *     Entry Criteria  **Pipeline exists** — satisfied by P06-01
 *     Exit Criteria   **"Raw data never bypasses validation"**
 *     Test/Validation **Architecture + negative tests**
 *     Evidence        **Boundary evidence**
 *   Authorized by **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1), scope `P06-01`/`P06-02`/
 *   `P06-03` ONLY. This module is **P06-02 only**.
 *
 *   Governing contract, REUSED — not invented here:
 *     · `docs/p02/P02_PROVIDER_MAPPING_RULES.md` §1 **M-1…M-6** — provider-specific schemas, field
 *       names, symbols, enums, units, time conventions and error codes exist **ONLY inside the
 *       adapter**; the adapter's **output boundary is the P01 canonical schema**; no
 *       provider-specific field name may appear in a canonical snapshot, a lineage record, an
 *       engine input, a DTO, a UI surface or an evidence artifact; unmapped native content is never
 *       smuggled through a free-form bag.
 *     · `Phase Gates`!P06 intent — *"without feeding raw provider data directly to engines."*
 *     · `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md`:216 / `D4_03_UI_BASELINE.md`:114 **INT-013**
 *       — must reference **governed IIPS objects**, never raw provider records.
 *     · `docs/p01/P01_VALIDATION_RULES.md` — the accepted S1–S4 validation set, invoked by reuse.
 *
 * ── The measured defect this closes ─────────────────────────────────────────────────────────
 *   Before this act, `CanonicalRecordStore.ingest()` (a **P05-04 accepted component, deliberately
 *   left unchanged**) performs **no validation**: it ingests any object carrying a `snapshotId`.
 *   Measured at commit `b6160cb`, a raw provider payload with provider-native fields, a **bare
 *   engine key** (`peRatio`), **no `MD:` namespace** and a fabricated `snapshotId` was
 *   **`INSERTED`** and read back intact. Four further paths were open (see
 *   `p06/evidence-p06-02/02-bypass-inventory-before.json`).
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ **NO validation logic is implemented here.** `validateSnapshot` is IMPORTED from
 *     `p05/src/validate.js`, so S1–S4 run exactly as accepted.
 *   ⚠ **NO canonical construction or namespace logic.** The record is produced by the **P06-01
 *     pipeline** (`./normalizationPipeline.js`), which itself reuses `p05/src/contract.js` and
 *     `p05/src/namespace.js`. ADR-01 **C1–C6** are enforced there by import and re-asserted here.
 *   ⚠ **NO new canonical store.** The accepted `CanonicalRecordStore` (`p05/src/replay.js`) is
 *     reused **unchanged** and **ENCAPSULATED** behind a private field.
 *   ⚠ **NO engine-boundary logic is duplicated.** `assertNoEngineDirectPath` (P06-01) is reused.
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P06-03.** No deduplication, no duplicate detection across retries/replays/providers,
 *     no idempotency key. The store's own idempotency (a P05-04 property) is inherited, not
 *     extended, and is deliberately NOT presented as P06-03.
 *   ⚠ **NO provider execution, credentials, entitlements or connectivity** (D9 N-1, D10 §8.2).
 *   ⚠ **NO scheduling, retries or checkpointing** — those are P05-04, unchanged.
 *   ⚠ **NO wall clock, no randomness, no ambient input.**
 *   ⚠ **NO certification** (`NONE_GRANTED`) and **NO production activation** (`NOT_AUTHORIZED`).
 *   ⚠ **NOT P06 ACCEPTANCE** — P06 remains `NOT_ACCEPTED`; no `P06_GATE_ACCEPTANCE.md` is created.
 */

import { CanonicalRecordStore } from '../../p05/src/replay.js';
import { validateSnapshot, rejectionEvent } from '../../p05/src/validate.js';
import { canonicalJson, canonicalDigest } from '../../p05/src/serialize.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { deepFreeze } from '../../p05/src/contract.js';
import {
  normalizePayload,
  assertNoEngineDirectPath,
  NormalizationRejection,
} from './normalizationPipeline.js';
import { declaredProviderElements } from './mappingDeclaration.js';

export const P06_02_MODULE = 'P06-02-RAW-CANONICAL-STORAGE-BOUNDARY';
export const BOUNDARY_SCHEMA_VERSION = '1.0';

/** Marks an object as RAW. Raw is never canonical and is never admitted downstream. */
export const RAW_ENVELOPE_TYPE = 'RAW_PROVIDER_PAYLOAD';
/** Marks a canonical record as having traversed the governed boundary. */
export const ATTESTATION_TYPE = 'P06-02-BOUNDARY-ATTESTATION';

/** Members whose presence on a "canonical" record betrays raw or free-form provider content (M-4). */
export const FORBIDDEN_FREE_FORM_MEMBERS = Object.freeze([
  'extras', 'rawPayload', 'nativePayload', 'metadata', 'bag', 'additionalProperties', 'raw',
]);

export class BoundaryViolation extends Error {
  /** @param {string[]} rules @param {string} stage @param {string} reason @param {object} [detail] */
  constructor(rules, stage, reason, detail = {}) {
    super(`[${rules.join(', ')}] ${stage}: ${reason}`);
    this.name = 'BoundaryViolation';
    this.rules = Object.freeze([...rules]);
    this.stage = stage;
    this.reason = reason;
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * ── THE RAW COMPARTMENT ────────────────────────────────────────────────────────────────────
 *
 * Raw provider payloads live here and **nowhere else**. Everything stored is deep-frozen, wrapped
 * in an envelope explicitly marked `isCanonical: false`, and can only be read back **as raw**.
 * There is no method that returns a canonical record, and no method that forwards a payload to
 * storage or to an engine.
 */
export class RawCompartment {
  constructor() {
    /** @type {Map<string, object>} */
    this.#envelopes = new Map();
    this.sequence = 0;
  }

  /** @type {Map<string, object>} */
  #envelopes;

  /**
   * Accept a raw provider payload. Acceptance is **not** validation and confers nothing: a payload
   * in this compartment has no canonical standing whatsoever.
   * @param {string} rawRef  caller-chosen stable reference
   * @param {Record<string, unknown>} payload  provider-native payload
   */
  accept(rawRef, payload) {
    if (typeof rawRef !== 'string' || rawRef.length === 0) {
      throw new BoundaryViolation(['M-1'], 'raw-accept', 'a rawRef is required');
    }
    if (payload === undefined || payload === null || typeof payload !== 'object') {
      throw new BoundaryViolation(['M-1'], 'raw-accept', `rawRef '${rawRef}' carries no payload`);
    }
    if (this.#envelopes.has(rawRef)) {
      throw new BoundaryViolation(['M-1'], 'raw-accept',
        `rawRef '${rawRef}' already exists — raw is append-only and never overwritten`);
    }
    this.sequence += 1;
    const envelope = deepFreeze({
      envelopeType: RAW_ENVELOPE_TYPE,
      isCanonical: false,
      isGovernedCanonicalRecord: false,
      rawRef,
      rawDigest: canonicalDigest(payload),
      payload: deepFreeze({ ...payload }),
      acceptSeq: this.sequence,
      // ⚠ Recorded on the raw itself so raw can never be mistaken for canonical data downstream.
      warning: 'RAW PROVIDER PAYLOAD — NOT CANONICAL. May reach canonical storage ONLY through '
        + 'CanonicalStorageBoundary.admit().',
    });
    this.#envelopes.set(rawRef, envelope);
    return Object.freeze({ rawRef, rawDigest: envelope.rawDigest, acceptSeq: envelope.acceptSeq, isCanonical: false });
  }

  /** Read a raw payload back **as raw**. Never returns a canonical record. */
  read(rawRef) {
    const env = this.#envelopes.get(rawRef);
    if (env === undefined) {
      throw new BoundaryViolation(['M-1'], 'raw-read', `no raw payload is held for rawRef '${rawRef}'`);
    }
    return env;
  }

  has(rawRef) { return this.#envelopes.has(rawRef); }
  get size() { return this.#envelopes.size; }
  refs() { return Object.freeze([...this.#envelopes.keys()].sort()); }
}

/**
 * ── CANONICAL SHAPE ASSERTIONS ─────────────────────────────────────────────────────────────
 */

/**
 * Fail closed unless `candidate` is a governed canonical record. This is what prevents an
 * unvalidated or raw-shaped object from **masquerading** as canonical data.
 *
 * @param {unknown} candidate
 * @param {string[]} [providerVocabulary]  provider-native names that must be absent (M-3)
 * @returns {true}
 */
export function assertCanonicalShape(candidate, providerVocabulary = []) {
  if (candidate === undefined || candidate === null || typeof candidate !== 'object') {
    throw new BoundaryViolation(['M-2', 'ST-1'], 'canonical-shape',
      `not an object — got ${typeof candidate}`);
  }
  // A raw envelope is explicitly not canonical.
  if (candidate.envelopeType === RAW_ENVELOPE_TYPE || candidate.isCanonical === false) {
    throw new BoundaryViolation(['M-1', 'M-2'], 'canonical-shape',
      'a RAW envelope was presented where a canonical record is required');
  }
  if (typeof candidate.snapshotId !== 'string' || !/^data-[^-]+-.+-\d{4}-\d{2}-\d{2}T/.test(candidate.snapshotId)) {
    throw new BoundaryViolation(['ST-1', 'AD-6'], 'canonical-shape',
      `snapshotId '${String(candidate.snapshotId)}' is not the frozen 'data-<provider>-<dataVersion>-<asOf>' form`);
  }
  if (candidate.fields === undefined || typeof candidate.fields !== 'object') {
    throw new BoundaryViolation(['ST-11', 'FD-1'], 'canonical-shape', 'no canonical field map');
  }
  const keys = Object.keys(candidate.fields);
  if (keys.length === 0 && candidate.quality !== 'unavailable') {
    throw new BoundaryViolation(['ST-9'], 'canonical-shape',
      'empty field set with a quality other than "unavailable"');
  }
  // C1 / FD-1: every field key carries the exact namespace token.
  const bare = keys.filter((k) => !k.startsWith(NAMESPACE_TOKEN));
  if (bare.length > 0) {
    throw new BoundaryViolation(['C1', 'FD-1'], 'canonical-shape',
      `${bare.length} field key(s) do not carry the namespace '${NAMESPACE_TOKEN}'`, { keys: bare.sort() });
  }
  // The snapshot must be immutable (ST-10): a mutable object is not a governed record.
  if (!Object.isFrozen(candidate)) {
    throw new BoundaryViolation(['ST-10'], 'canonical-shape',
      'the candidate is not frozen — a governed canonical record is deeply immutable');
  }
  // M-4: no free-form member that could carry raw provider content.
  for (const m of FORBIDDEN_FREE_FORM_MEMBERS) {
    if (Object.prototype.hasOwnProperty.call(candidate, m)) {
      throw new BoundaryViolation(['M-4'], 'canonical-shape',
        `the candidate carries a free-form '${m}' member`, { member: m });
    }
  }
  // M-3: no provider-native name anywhere in the serialized record. Canonical keys are stripped
  // first and matching is on WORD BOUNDARIES — exactly as the P06-01 engine guard does — so that a
  // legitimate namespaced key such as MD:price.venueRef is not mistaken for the provider element
  // 'venue', while a name smuggled into a lineage or provenance string IS caught.
  const withoutCanonicalKeys = canonicalJson(candidate).replace(/"MD:[a-z]+\.[A-Za-z0-9]*"/g, '');
  const leaked = [...providerVocabulary]
    .filter((n) => typeof n === 'string' && n.length > 0
      && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(withoutCanonicalKeys));
  if (leaked.length > 0) {
    throw new BoundaryViolation(['M-3', 'LA-18'], 'canonical-shape',
      `${leaked.length} provider-native name(s) appear in the candidate`, { leaked: leaked.sort() });
  }
  return true;
}

/**
 * THE ENGINE BOUNDARY. Fail closed unless a value offered to a downstream consumer/engine is a
 * governed canonical record. This is what prevents **raw → engine**.
 *
 * INT-013: consumers must reference governed IIPS objects, never raw provider records.
 *
 * @param {unknown} offered
 * @param {string[]} [providerVocabulary]
 * @returns {Readonly<{ok: boolean, isCanonical: boolean}>}
 */
export function assertEngineInputIsCanonical(offered, providerVocabulary = []) {
  if (offered === undefined || offered === null || typeof offered !== 'object') {
    throw new BoundaryViolation(['M-2', 'INT-013'], 'engine-input',
      `an engine input must be a governed canonical record — got ${typeof offered}`);
  }
  if (offered.envelopeType === RAW_ENVELOPE_TYPE || offered.isCanonical === false) {
    throw new BoundaryViolation(['M-1', 'INT-013'], 'engine-input',
      'a RAW envelope may never be offered to an engine');
  }
  // A provider-shaped object is recognisable by the ABSENCE of the governed shape, not by a
  // marker an attacker could add. Assert the real thing.
  assertCanonicalShape(offered, providerVocabulary);
  return Object.freeze({ ok: true, isCanonical: true });
}

/**
 * ── BOUNDARY ATTESTATION ───────────────────────────────────────────────────────────────────
 *
 * ⚠ **There is no secret in this system, so an attestation is NOT a cryptographic proof.** It is a
 *   *re-derivable* binding. The boundary never **trusts** one: `verifyAttestation` re-executes the
 *   governed path from the raw payload and the declared mapping and requires the result to be
 *   **byte-identical** to the presented record. To get a record admitted you must therefore supply
 *   a raw payload and a declared mapping that genuinely produce it. That is the property that is
 *   actually enforced, and it is stated here rather than overstated.
 */
export function buildAttestation({ rawRef, rawDigest, mapping, canonical, validation }) {
  const mappingDigest = canonicalDigest({
    mappingId: mapping.mappingId,
    mappingVersion: mapping.mappingVersion,
    entries: mapping.entries,
  });
  const canonicalDigestValue = canonicalDigest(canonical);
  return Object.freeze({
    attestationType: ATTESTATION_TYPE,
    boundarySchemaVersion: BOUNDARY_SCHEMA_VERSION,
    boundaryModule: P06_02_MODULE,
    rawRef,
    rawDigest,
    mappingId: mapping.mappingId,
    mappingVersion: mapping.mappingVersion,
    mappingDigest,
    canonicalDigest: canonicalDigestValue,
    snapshotId: canonical.snapshotId,
    validationPassed: validation !== undefined,
    validationQuality: validation?.quality,
    // ⚠ Phase scope, carried in the artifact itself.
    phaseScope: 'P06-02',
    p06_03Implemented: false,
    liveProviderExecution: false,
    licensedHistoricalAcquisition: false,
    productionActivation: false,
    certificationClaim: false,
  });
}

/**
 * Re-derive the attestation from first principles and require an exact match.
 * @returns {Readonly<Record<string, unknown>>} the verified attestation
 */
export function verifyAttestation(attestation, { rawRef, rawDigest, mapping, canonical }) {
  if (attestation?.attestationType !== ATTESTATION_TYPE) {
    throw new BoundaryViolation(['M-2'], 'attest-verify',
      'no boundary attestation was presented — an unattested record cannot be admitted');
  }
  if (attestation.boundarySchemaVersion !== BOUNDARY_SCHEMA_VERSION) {
    throw new BoundaryViolation(['M-2'], 'attest-verify',
      `attestation schema '${String(attestation.boundarySchemaVersion)}' does not match boundary '${BOUNDARY_SCHEMA_VERSION}'`);
  }
  // Checked FIRST: the specific, informative failure. Otherwise an attestation that does not
  // record a passed validation would always be reported as a generic re-derivation mismatch, and
  // this branch would be unreachable.
  if (attestation.validationPassed !== true) {
    throw new BoundaryViolation(['M-2'], 'attest-verify',
      'the attestation does not record a passed validation — validation is never waived');
  }
  const expected = buildAttestation({
    rawRef, rawDigest, mapping, canonical, validation: { quality: attestation.validationQuality },
  });
  // Null-safe: a field absent on either side is a MISMATCH, not a crash. Comparing undefined
  // directly would throw a TypeError out of the hash, which is a fail-open-shaped accident.
  const safe = (v) => canonicalDigest(v === undefined ? null : v);
  const mismatches = Object.keys(expected)
    .filter((k) => safe(expected[k]) !== safe(attestation[k])
      || (expected[k] === undefined) !== (attestation[k] === undefined));
  if (mismatches.length > 0) {
    throw new BoundaryViolation(['M-2', 'M-3'], 'attest-verify',
      `the attestation does not re-derive from the presented raw + mapping + record (${mismatches.join(', ')}) `
      + '— a forged or tampered attestation is rejected, not repaired',
      { mismatchedFields: mismatches.sort() });
  }
  return attestation;
}

/**
 * ── THE STORAGE BOUNDARY ───────────────────────────────────────────────────────────────────
 *
 * The governed path, and the ONLY supported one:
 *
 *     raw input
 *        ↓  acceptRaw()            → RawCompartment (separate, frozen, marked NOT canonical)
 *        ↓  admit()                → P06-01 normalizePayload  (validation + normalization)
 *        ↓                         → validateSnapshot         (S1–S4, by reuse)
 *        ↓                         → assertNoEngineDirectPath (P06-01 engine guard, by reuse)
 *        ↓                         → assertCanonicalShape     (M-1…M-4)
 *        ↓                         → buildAttestation + verifyAttestation (re-derived)
 *     canonical governed record
 *        ↓  private CanonicalRecordStore  (P05-04, unchanged, ENCAPSULATED)
 *     downstream consumers  ← only via canonicalRecords() / verifiedDigests()
 *
 * ⚠ **There is deliberately NO public method that accepts a pre-built record.** That is the
 *   architectural enforcement of *"Raw data never bypasses validation"*: the raw payload and the
 *   declared mapping are **required inputs** to canonical admission.
 */
export class CanonicalStorageBoundary {
  constructor({ providerVocabulary = [] } = {}) {
    this.raw = new RawCompartment();
    /** @type {CanonicalRecordStore} the accepted P05-04 store, reused UNCHANGED and encapsulated. */
    this.#store = new CanonicalRecordStore();
    /** @type {Map<string, object>} canonicalDigest → attestation */
    this.#attestations = new Map();
    this.providerVocabulary = Object.freeze([...providerVocabulary]);
    this.boundaryId = P06_02_MODULE;
  }

  /** @type {CanonicalRecordStore} */
  #store;
  /** @type {Map<string, object>} */
  #attestations;

  /** Raw in. Confers nothing; the payload has no canonical standing. */
  acceptRaw(rawRef, payload) {
    return this.raw.accept(rawRef, payload);
  }

  /**
   * THE GOVERNED PATH. Raw → validation/normalization boundary → canonical governed record →
   * canonical storage. There is no other way in.
   *
   * @param {object} args
   * @param {string} args.rawRef       a payload previously accepted into the raw compartment
   * @param {Readonly<Record<string, unknown>>} args.mapping  a declared P06-01 mapping
   * @param {object} args.context      provider/adapter identity, receivedAt, mode, identity refs
   * @returns {Readonly<{record: object, report: object, attestation: object,
   *                     storageOutcome: string, canonicalDigest: string}>}
   */
  admit({ rawRef, mapping, context }) {
    // ── 1. The raw must already be in the RAW compartment. Admission consumes raw from there and
    //       from nowhere else, so raw and canonical are separated by construction.
    const envelope = this.raw.read(rawRef);
    if (envelope.isCanonical !== false) {
      throw new BoundaryViolation(['M-1'], 'admit', 'the raw compartment returned a non-raw envelope');
    }
    if (mapping?.entries === undefined) {
      throw new BoundaryViolation(['MR-2'], 'admit',
        'a DECLARED mapping is required — an undeclared or heuristic mapping is prohibited');
    }

    // ── 2. VALIDATION + NORMALIZATION, by reuse. Throws fail-closed on any invalid raw.
    let out;
    try {
      out = normalizePayload({ payload: envelope.payload, mapping, context });
    } catch (err) {
      // RJ-4/RJ-5: a rejection is a data-quality FAILURE, propagated — never coerced or swallowed.
      if (err instanceof NormalizationRejection || err?.name === 'ContractViolation'
        || err?.name === 'SnapshotRejection' || err?.name === 'NamespaceViolation') {
        throw new BoundaryViolation([...(err.rules ?? ['M-2']), 'RJ-5'], 'admit-validation',
          `raw '${rawRef}' failed the governed validation/normalization boundary — ${err.message}`,
          { rawRef, stage: err.stage ?? 'normalization' });
      }
      throw err;
    }
    const { record, report } = out;

    // ── 3. Re-validate at the boundary (defence in depth — the store itself validates nothing).
    let validation;
    try {
      validation = validateSnapshot(record, {
        companyInputKeys: context.companyInputKeys ?? [],
        contributing: context.contributing ?? [],
      });
    } catch (err) {
      throw new BoundaryViolation([...(err.rules ?? ['M-2']), 'RJ-5'], 'admit-validation',
        `the normalized record for raw '${rawRef}' failed S1–S4 validation`, { rawRef });
    }

    // ── 4. Engine boundary + canonical shape, by reuse / by M-1…M-4.
    assertNoEngineDirectPath(record, mapping, this.providerVocabulary);
    assertCanonicalShape(record, this.providerVocabulary);

    // ── 5. Attest, then VERIFY by re-derivation. Never trusted.
    const attestation = buildAttestation({
      rawRef, rawDigest: envelope.rawDigest, mapping, canonical: record, validation,
    });
    verifyAttestation(attestation, {
      rawRef, rawDigest: envelope.rawDigest, mapping, canonical: record,
    });

    // ── 6. Only now does the record reach canonical storage — the private, encapsulated store.
    const storage = this.#store.ingest(record);
    if (storage.outcome === 'CONFLICT_REJECTED') {
      throw new BoundaryViolation(['INV-2', 'RJ-6'], 'admit-storage',
        `the canonical store rejected '${record.snapshotId}' — INV-2 forbids mutation`,
        { snapshotId: record.snapshotId });
    }
    this.#attestations.set(attestation.canonicalDigest, attestation);

    return Object.freeze({
      record,
      report,
      attestation,
      storageOutcome: storage.outcome,
      canonicalDigest: attestation.canonicalDigest,
      traversedBoundary: true,
      phaseScope: 'P06-02',
    });
  }

  /** Canonical records, in deterministic order. The ONLY way canonical data leaves the boundary. */
  canonicalRecords() {
    return Object.freeze([...this.#store.records.values()]
      .sort((a, b) => a.ingestSeq - b.ingestSeq)
      .map((e) => e.snapshot));
  }

  get canonicalCount() { return this.#store.size; }
  get rawCount() { return this.raw.size; }
  get events() { return Object.freeze([...this.#store.events]); }
  attestations() { return Object.freeze([...this.#attestations.values()]); }

  /**
   * Can this record be shown to have traversed the governed boundary? Consumers use this instead
   of trusting a record's shape.
   */
  isAttested(record) {
    return this.#attestations.has(canonicalDigest(record));
  }

  /**
   * ⚠ BYPASS DETECTION. Audits the encapsulated store and proves every record in it is canonical
   *   AND attested. A store contaminated by any path other than `admit()` is detected here even if
   *   the contamination happened outside this architecture.
   *
   * @returns {Readonly<{ok: boolean, recordCount: number, unattested: string[],
   *                     nonCanonical: string[]}>}
   */
  auditBoundary() {
    const unattested = [];
    const nonCanonical = [];
    for (const entry of this.#store.records.values()) {
      const digest = canonicalDigest(entry.snapshot);
      if (!this.#attestations.has(digest)) unattested.push(entry.snapshotId);
      try {
        assertCanonicalShape(entry.snapshot, this.providerVocabulary);
      } catch {
        nonCanonical.push(entry.snapshotId);
      }
    }
    return Object.freeze({
      ok: unattested.length === 0 && nonCanonical.length === 0,
      recordCount: this.#store.size,
      rawCount: this.raw.size,
      attestedCount: this.#attestations.size,
      unattested: Object.freeze(unattested.sort()),
      nonCanonical: Object.freeze(nonCanonical.sort()),
    });
  }
}

export { rejectionEvent };
