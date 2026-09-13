/**
 * P06-03 — DEDUPLICATION / IDEMPOTENCY **RULES**
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P06-03 — *Deduplication/idempotency*:
 *     Requirement     **Prevent duplicate records across retries/replays/providers.**
 *     Deliverable     **Deduplication rules**
 *     Dependencies    `P06-01,P06-02` (Hard) — **both COMPLETE**
 *     Entry Criteria  **Canonical schema stable**
 *     Exit Criteria   **"Repeated ingestion stable"**
 *     Test/Validation **Replay tests**
 *     Evidence        **Replay evidence**
 *   Authorized by **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1), scope `P06-01`/`P06-02`/
 *   `P06-03` ONLY. This module is **P06-03 only** — the last of the three authorized work items.
 *
 * ── ⚠ THE DEDUPLICATION IDENTITY IS TAKEN FROM EXISTING CONTRACTS, NOT INVENTED ─────────────
 *   The tracker requires dedup across *retries / replays / providers*. The identity used is the
 *   one the accepted corpus already fixes — **no new formula, no added component**:
 *
 *     · **`snapshotId = data-${provider}-${dataVersion}-${asOf}`** — AD-6, frozen format
 *       (`P01_DATA_CONTRACT.md` §3.1 row 1 and §6). `P05_03_SPECIFICATION.md`:84 is explicit:
 *       *"**no component added**"*. It is therefore NOT extended here.
 *     · **`dataVersion` = the vintage of the source content** (**DV-1**;
 *       `P01_VERSIONING_COMPATIBILITY.md` **V2**). A correction is a **new `dataVersion`**, hence a
 *       new `snapshotId` — never an edit (**INV-2**, **DV-3**).
 *     · **`canonicalDigest(record)`** — the content identity under **RI-6** deterministic
 *       serialization (canonical key order, ISO-8601 UTC at fixed precision, stable numerics).
 *     · The decision rule is the one the **accepted P05-04 `CanonicalRecordStore`** already
 *       implements — `(snapshotId, canonicalDigest)` → `INSERTED` | `IDEMPOTENT_NOOP` |
 *       `CONFLICT_REJECTED`. **It is REUSED, not duplicated and not replaced.**
 *
 *   ⚠ **Cross-provider records are deliberately NOT collapsed.** `P04_CANONICAL_SECURITY_MODEL.md`
 *     **PN-5**: *"two providers asserting the same instrument produce ONE canonical security ID with
 *     per-source attribution. **Never two canonical identities, never a silent merge.**"* And
 *     `P01_IDENTITY_AND_LINEAGE.md` **RI-3**: *"provider identity is **never flattened away**."*
 *     Two providers' observations of the same instrument are **distinct records**, correctly
 *     attributed — deduplicating them would be the prohibited silent merge. So "across providers"
 *     is satisfied by (a) suppressing a re-presented record of the *same* provider vintage, and
 *     (b) **proving** distinct-provider records stay distinct.
 *
 *   ⚠ **`RJ-6`** prohibits without exception: silent overwrite · precedence rules · "last wins" ·
 *     dropping a field · substituting a value. A conflicting record is **rejected**, never merged.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ **NO new canonical store.** The P05-04 `CanonicalRecordStore` inside the P06-02 boundary
 *     remains the sole store. This module is a **declared-rules + decision** layer over governed
 *     canonical records.
 *   ⚠ **NO namespace, collision or canonical-shape logic.** `NAMESPACE_TOKEN` ←
 *     `p05/src/namespace.js`; `canonicalDigest` ← `p05/src/serialize.js`; `assertCanonicalShape`
 *     and the boundary attestation ← `./rawCanonicalBoundary.js` (P06-02).
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NO second raw-ingestion path.** `record()` refuses any record that the P06-02 boundary has
 *     not attested. Raw can only ever reach here by first traversing P06-02 → P06-01.
 *   ⚠ **NO scheduling, retries, checkpointing or durable persistence** — P05-04 owns orchestration
 *     and is unchanged. "Retries/replays" here means *re-presentation of the same canonical
 *     record*, which is what the requirement is about.
 *   ⚠ **NO provider execution, credentials, entitlements or connectivity** (D9 N-1, D10 §8.2).
 *   ⚠ **NO P07/P08.** No freshness/staleness, no PIT storage, no corporate actions.
 *   ⚠ **NO wall clock, no randomness, no ambient input.**
 *   ⚠ **NO certification** (`NONE_GRANTED`) and **NO production activation** (`NOT_AUTHORIZED`).
 *   ⚠ **NOT P06 ACCEPTANCE** — P06 remains `NOT_ACCEPTED`; no `P06_GATE_ACCEPTANCE.md` is created.
 */

import { canonicalDigest } from '../../p05/src/serialize.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import {
  assertCanonicalShape,
  BoundaryViolation,
  P06_02_MODULE,
} from './rawCanonicalBoundary.js';

export const P06_03_MODULE = 'P06-03-DEDUPLICATION-IDEMPOTENCY-RULES';
export const DEDUP_RULES_SCHEMA_VERSION = '1.0';

/**
 * ── THE DELIVERABLE: deduplication rules, DECLARED AS DATA ─────────────────────────────────
 *
 * Inspectable without reading code (the same discipline P02 §5 imposes on mappings via M-6/MR-4).
 * Every rule cites the authority it comes from; none is invented here.
 */
export const DEDUPLICATION_RULES = Object.freeze({
  schemaVersion: DEDUP_RULES_SCHEMA_VERSION,
  module: P06_03_MODULE,
  identity: Object.freeze({
    name: 'snapshotId + canonicalDigest',
    components: Object.freeze(['snapshotId', 'canonicalDigest']),
    snapshotIdForm: 'data-${provider}-${dataVersion}-${asOf}',
    sources: Object.freeze([
      'AD-6 — snapshotId format frozen; authoritative for the market-data input layer',
      'P01_DATA_CONTRACT.md §3.1 row 1 and §6 — the frozen form, carried for ADR-02 linkage',
      'P05_03_SPECIFICATION.md:84 — "no component added"',
      'DV-1 — dataVersion identifies the vintage of the SOURCE CONTENT, not the schema',
      'P01_VERSIONING_COMPATIBILITY.md V2 — dataVersion is the provider content vintage',
      'RI-6 — deterministic serialization gives a stable content digest',
    ]),
    notInvented: 'This module adds NO component to snapshotId and defines NO alternative key.',
  }),
  rules: Object.freeze([
    Object.freeze({
      ruleId: 'DD-1',
      name: 'first presentation of a snapshotId inserts exactly one canonical record',
      condition: 'no existing record carries this snapshotId',
      decision: 'INSERTED',
      authority: 'P05-04 CanonicalRecordStore.ingest — reused, not replaced',
    }),
    Object.freeze({
      ruleId: 'DD-2',
      name: 're-presentation of an IDENTICAL record is a no-op, never a duplicate',
      condition: 'same snapshotId AND same canonicalDigest',
      decision: 'IDEMPOTENT_NOOP',
      authority: 'P05-04 CanonicalRecordStore.ingest — the tracker\'s retries/replays axis',
    }),
    Object.freeze({
      ruleId: 'DD-3',
      name: 'same snapshotId with DIFFERENT content is a conflict, never an overwrite',
      condition: 'same snapshotId AND different canonicalDigest',
      decision: 'CONFLICT_REJECTED',
      authority: 'INV-2 (immutable and versioned; a correction is a NEW dataVersion) · RJ-6 '
        + '(silent overwrite, precedence and "last wins" prohibited without exception)',
    }),
    Object.freeze({
      ruleId: 'DD-4',
      name: 'a DIFFERENT provider vintage is a DIFFERENT record and is never collapsed',
      condition: 'different snapshotId (provider, dataVersion or asOf differs)',
      decision: 'INSERTED',
      authority: 'PN-5 (never two canonical identities, never a silent merge) · RI-3 (provider '
        + 'identity is never flattened away) · DV-1/DV-3 (a correction is a new vintage)',
    }),
    Object.freeze({
      ruleId: 'DD-5',
      name: 'only a record the P06-02 boundary has ATTESTED may enter the deduplicated set',
      condition: 'boundary.isAttested(record) !== true',
      decision: 'REJECTED_NOT_ATTESTED',
      authority: 'P06-02 exit criterion "Raw data never bypasses validation" — P06-03 must not '
        + 'become a second raw/canonical admission path',
    }),
    Object.freeze({
      ruleId: 'DD-6',
      name: 'only a governed canonical record may enter the deduplicated set',
      condition: 'assertCanonicalShape(record) fails',
      decision: 'REJECTED_NOT_CANONICAL',
      authority: 'P02 §1 M-1…M-4 · C1/FD-1 (every key namespaced) · ST-10 (immutable) · M-4 (no '
        + 'free-form bag)',
    }),
  ]),
  decisions: Object.freeze(['INSERTED', 'IDEMPOTENT_NOOP', 'CONFLICT_REJECTED',
    'REJECTED_NOT_ATTESTED', 'REJECTED_NOT_CANONICAL']),
  prohibitions: Object.freeze([
    'RJ-6 — no silent overwrite, no precedence rule, no "last wins", no dropped field, no substituted value',
    'PN-5 — never a silent merge of two providers into one canonical record',
    'RI-3 — provider identity is never flattened away',
    'AD-6 / P05_03:84 — no component is added to snapshotId',
  ]),
});

/**
 * The deduplication identity of a governed canonical record.
 *
 * ⚠ Derived **only** from components the accepted contracts already fix. No new formula.
 *
 * @param {object} record  a governed canonical record
 * @returns {Readonly<{snapshotId: string, canonicalDigest: string, provider: string,
 *                     dataVersion: string, asOf: string, identityKey: string}>}
 */
export function dedupIdentityFor(record) {
  if (record === undefined || record === null || typeof record !== 'object') {
    throw new BoundaryViolation(['DD-6'], 'dedup-identity', 'not a record');
  }
  if (typeof record.snapshotId !== 'string' || !/^data-[^-]+-.+-\d{4}-\d{2}-\d{2}T/.test(record.snapshotId)) {
    throw new BoundaryViolation(['DD-6', 'ST-1', 'AD-6'], 'dedup-identity',
      `snapshotId '${String(record.snapshotId)}' is not the frozen 'data-<provider>-<dataVersion>-<asOf>' form`);
  }
  const digest = canonicalDigest(record);
  return Object.freeze({
    snapshotId: record.snapshotId,
    canonicalDigest: digest,
    provider: record.provider,
    dataVersion: record.dataVersion,
    asOf: record.asOf,
    // The decision key. snapshotId is the IDENTITY axis; the digest is the CONTENT axis.
    identityKey: record.snapshotId,
  });
}

/**
 * Classify a deduplication decision against an already-held record. Mirrors the accepted P05-04
 * store rule exactly, so the decision is inspectable BEFORE anything is stored.
 *
 * @param {string|undefined} existingDigest  digest of the record already held, if any
 * @param {string} candidateDigest
 * @returns {'INSERTED'|'IDEMPOTENT_NOOP'|'CONFLICT_REJECTED'}
 */
export function classifyDedupDecision(existingDigest, candidateDigest) {
  if (existingDigest === undefined) return 'INSERTED';            // DD-1
  if (existingDigest === candidateDigest) return 'IDEMPOTENT_NOOP'; // DD-2
  return 'CONFLICT_REJECTED';                                     // DD-3 (INV-2 / RJ-6)
}

/**
 * ── THE DEDUPLICATED CANONICAL SET ─────────────────────────────────────────────────────────
 *
 * Sits DOWNSTREAM of the P06-02 boundary and operates ONLY on governed canonical data:
 *
 *     raw → P06-02 boundary → P06-01 normalization → canonical governed record
 *         → **P06-03 dedup rules** → stable canonical result
 *
 * ⚠ **It cannot become a second admission path**: `record()` refuses anything the boundary has not
 *   attested (**DD-5**) and anything that is not a governed canonical record (**DD-6**).
 */
export class DeduplicationLedger {
  /**
   * @param {object} args
   * @param {import('./rawCanonicalBoundary.js').CanonicalStorageBoundary} args.boundary
   *        the P06-02 boundary whose attestations gate admission here
   * @param {string[]} [args.providerVocabulary]
   */
  constructor({ boundary, providerVocabulary = [] }) {
    if (boundary === undefined || typeof boundary.isAttested !== 'function') {
      throw new BoundaryViolation(['DD-5'], 'ledger-init',
        'a P06-02 CanonicalStorageBoundary is required — P06-03 operates only on governed canonical '
        + 'data and must not create a second raw-ingestion path');
    }
    this.boundary = boundary;
    this.providerVocabulary = Object.freeze([...providerVocabulary]);
    /** @type {Map<string, {identityKey: string, digest: string, record: object, seq: number}>} */
    this.held = new Map();
    /** @type {Array<Record<string, unknown>>} */
    this.decisions = [];
    this.sequence = 0;
    this.rules = DEDUPLICATION_RULES;
  }

  /**
   * Offer one governed canonical record to the deduplication rules.
   *
   * @param {object} record
   * @returns {Readonly<{decision: string, ruleId: string, identityKey: string,
   *                     canonicalDigest: string, recordCount: number}>}
   */
  record(record) {
    // ── DD-5: gate on the P06-02 attestation. This is what makes a second raw path impossible. ──
    if (this.boundary.isAttested(record) !== true) {
      this.#log('REJECTED_NOT_ATTESTED', 'DD-5', record?.snapshotId ?? null, null);
      throw new BoundaryViolation(['DD-5'], 'dedup-admit',
        'the record was not attested by the P06-02 boundary — P06-03 admits only governed canonical '
        + 'data and cannot become a second raw/canonical admission path',
        { snapshotId: record?.snapshotId ?? null });
    }
    // ── DD-6: it must actually BE a governed canonical record. ──
    try {
      assertCanonicalShape(record, this.providerVocabulary);
    } catch (err) {
      this.#log('REJECTED_NOT_CANONICAL', 'DD-6', record?.snapshotId ?? null, null);
      throw new BoundaryViolation(['DD-6', ...(err.rules ?? [])], 'dedup-admit',
        `the record is not a governed canonical record — ${err.message}`);
    }

    const id = dedupIdentityFor(record);
    const existing = this.held.get(id.identityKey);
    const decision = classifyDedupDecision(existing?.digest, id.canonicalDigest);

    if (decision === 'CONFLICT_REJECTED') {
      // DD-3 / INV-2 / RJ-6: rejected, never merged, never overwritten, never "last wins".
      this.#log(decision, 'DD-3', id.identityKey, id.canonicalDigest, {
        existingDigest: existing.digest, attemptedDigest: id.canonicalDigest,
        reason: 'INV-2: a correction must be a NEW dataVersion, never a mutation of an existing '
          + 'snapshot; RJ-6 prohibits silent overwrite, precedence and "last wins"',
      });
      return Object.freeze({
        decision, ruleId: 'DD-3', identityKey: id.identityKey,
        canonicalDigest: id.canonicalDigest, recordCount: this.held.size, overwritten: false,
      });
    }

    if (decision === 'INSERTED') {
      this.sequence += 1;
      this.held.set(id.identityKey, Object.freeze({
        identityKey: id.identityKey, digest: id.canonicalDigest, record, seq: this.sequence,
      }));
      this.#log(decision, 'DD-1', id.identityKey, id.canonicalDigest);
    } else {
      this.#log(decision, 'DD-2', id.identityKey, id.canonicalDigest, {
        existingSeq: existing.seq,
      });
    }
    return Object.freeze({
      decision,
      ruleId: decision === 'INSERTED' ? 'DD-1' : 'DD-2',
      identityKey: id.identityKey,
      canonicalDigest: id.canonicalDigest,
      recordCount: this.held.size,
      overwritten: false,
    });
  }

  /**
   * Offer a whole corpus. Returns measured counts — the tracker's exit-criterion evidence.
   * @param {object[]} records
   */
  ingestCorpus(records) {
    const counts = { INSERTED: 0, IDEMPOTENT_NOOP: 0, CONFLICT_REJECTED: 0 };
    for (const r of records) {
      const out = this.record(r);
      if (counts[out.decision] !== undefined) counts[out.decision] += 1;
    }
    return Object.freeze({
      offered: records.length,
      inserted: counts.INSERTED,
      idempotentNoop: counts.IDEMPOTENT_NOOP,
      conflictRejected: counts.CONFLICT_REJECTED,
      finalRecordCount: this.held.size,
      distinctIdentityKeys: this.held.size,
    });
  }

  /** The stable canonical set, in deterministic insertion order. */
  canonicalRecords() {
    return Object.freeze([...this.held.values()].sort((a, b) => a.seq - b.seq).map((e) => e.record));
  }

  get recordCount() { return this.held.size; }

  /**
   * ⚠ THE EXIT CRITERION: **"Repeated ingestion stable."**
   *
   * Ingests the SAME corpus `repetitions` times and proves the canonical set is unchanged in
   * count, in membership and **byte-for-byte** after the first pass.
   *
   * @param {object[]} corpus
   * @param {number} [repetitions]
   */
  proveRepeatedIngestionStable(corpus, repetitions = 3) {
    const passes = [];
    let baseline = null;
    for (let pass = 0; pass < repetitions; pass += 1) {
      const summary = this.ingestCorpus(corpus);
      const serialization = canonicalDigest(this.canonicalRecords());
      passes.push(Object.freeze({
        pass: pass + 1, ...summary, canonicalSetDigest: serialization,
        identicalToFirstPass: baseline === null ? true : serialization === baseline,
      }));
      if (baseline === null) baseline = serialization;
    }
    const stable = passes.every((p) => p.identicalToFirstPass)
      && passes.every((p) => p.finalRecordCount === passes[0].finalRecordCount)
      && passes.slice(1).every((p) => p.inserted === 0)
      && passes.slice(1).every((p) => p.idempotentNoop === corpus.length);
    return Object.freeze({
      repetitions,
      corpusSize: corpus.length,
      passes,
      firstPassInserts: passes[0].inserted,
      subsequentPassInserts: passes.slice(1).map((p) => p.inserted),
      finalCanonicalCount: passes[passes.length - 1].finalRecordCount,
      duplicateNoOpCount: passes.slice(1).reduce((a, p) => a + p.idempotentNoop, 0),
      canonicalSetByteIdenticalAcrossPasses: stable,
      exitCriterionMet: stable,
      phaseScope: 'P06-03',
    });
  }

  /** Self-audit: every held record is canonical, attested, namespaced and uniquely keyed. */
  auditDedup() {
    const notCanonical = [];
    const notAttested = [];
    const keys = new Set();
    const duplicateKeys = [];
    for (const entry of this.held.values()) {
      try { assertCanonicalShape(entry.record, this.providerVocabulary); } catch { notCanonical.push(entry.identityKey); }
      if (this.boundary.isAttested(entry.record) !== true) notAttested.push(entry.identityKey);
      if (keys.has(entry.identityKey)) duplicateKeys.push(entry.identityKey);
      keys.add(entry.identityKey);
      for (const k of Object.keys(entry.record.fields ?? {})) {
        if (!k.startsWith(NAMESPACE_TOKEN)) notCanonical.push(`${entry.identityKey}:${k}`);
      }
    }
    return Object.freeze({
      ok: notCanonical.length === 0 && notAttested.length === 0 && duplicateKeys.length === 0,
      recordCount: this.held.size,
      distinctIdentityKeys: keys.size,
      duplicateIdentityKeys: Object.freeze(duplicateKeys.sort()),
      notCanonical: Object.freeze(notCanonical.sort()),
      notAttested: Object.freeze(notAttested.sort()),
      boundaryModule: P06_02_MODULE,
      phaseScope: 'P06-03',
    });
  }

  #log(decision, ruleId, identityKey, digest, detail = {}) {
    this.decisions.push(Object.freeze({
      decision, ruleId, identityKey, canonicalDigest: digest, seq: this.sequence, ...detail,
    }));
  }
}
