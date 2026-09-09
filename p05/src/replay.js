/**
 * P05-01 — DETERMINISTIC REPLAY AND IDEMPOTENCY (local evidence harness)
 *
 * Authority:
 *   SI-4  snapshotId is deterministic: identical (provider, dataVersion, asOf) ⇒ identical id
 *   DV-5  identical inputs must yield an identical snapshotId
 *   D-2   identical payload + identical adapterVersion + identical schemaVersion ⇒
 *         IDENTICAL canonical snapshot, byte-for-byte
 *   INV-2 snapshots are immutable and versioned; corrections produce a NEW dataVersion,
 *         never mutation
 *   SN-4  an execution may consume multiple contributing snapshots; the set is ORDERED and
 *         DETERMINISTIC; flattening into one opaque bag is prohibited
 *   RI-2  order participates in identity because merge order is significant
 *   RI-4  two executions differing in ANY contributing vintage must have different effective
 *         replay identities
 *   RI-6  deterministic serialization
 *
 * ⚠ S-8 / AD-17: this is NOT the existing-IIPS `ReplayService`. `ReplayService`,
 *   `DataBoundExecutor`, `LiveDataRuntime.ts` and `PROGRAM_v1.1_REPLAY_BASELINE.json` are
 *   UNTOUCHED. AD-17 (literal `reproduced:true` / `byteIdentical:true`) remains UNRESOLVED and
 *   is an existing-IIPS authority matter. Nothing here claims to verify replay adequacy;
 *   it demonstrates deterministic re-derivation of the P05-01 canonical surface only.
 */

import { canonicalDigest, canonicalJson } from './serialize.js';

/** Immutable canonical record store, keyed by snapshotId. */
export class CanonicalRecordStore {
  constructor() {
    /** @type {Map<string, {snapshotId:string, digest:string, snapshot:object, ingestSeq:number}>} */
    this.records = new Map();
    /** Deterministic, insertion-ordered — no wall-clock. */
    this.sequence = 0;
    /** @type {Array<Record<string, unknown>>} */
    this.events = [];
  }

  /**
   * Ingest a canonical snapshot idempotently.
   *
   * Semantics:
   *  - same snapshotId + same canonical digest  ⇒ NO-OP, no duplicate record (idempotent)
   *  - same snapshotId + DIFFERENT digest       ⇒ CONFLICT. INV-2 forbids mutation: a
   *    correction must be a new `dataVersion`, i.e. a different snapshotId. Never overwritten.
   *
   * @param {object} snapshot
   * @returns {{outcome: 'INSERTED'|'IDEMPOTENT_NOOP'|'CONFLICT_REJECTED',
   *            snapshotId: string, digest: string, recordCount: number}}
   */
  ingest(snapshot) {
    const digest = canonicalDigest(snapshot);
    const existing = this.records.get(snapshot.snapshotId);
    this.sequence += 1;

    if (existing === undefined) {
      this.records.set(snapshot.snapshotId, {
        snapshotId: snapshot.snapshotId, digest, snapshot, ingestSeq: this.sequence,
      });
      this.events.push(Object.freeze({
        type: 'INSERTED', snapshotId: snapshot.snapshotId, digest, ingestSeq: this.sequence,
      }));
      return { outcome: 'INSERTED', snapshotId: snapshot.snapshotId, digest, recordCount: this.records.size };
    }

    if (existing.digest === digest) {
      this.events.push(Object.freeze({
        type: 'IDEMPOTENT_NOOP', snapshotId: snapshot.snapshotId, digest, ingestSeq: this.sequence,
        existingIngestSeq: existing.ingestSeq,
      }));
      return { outcome: 'IDEMPOTENT_NOOP', snapshotId: snapshot.snapshotId, digest, recordCount: this.records.size };
    }

    // INV-2 / A-22: no mutation, no silent overwrite, no "last wins" (RJ-6).
    this.events.push(Object.freeze({
      type: 'CONFLICT_REJECTED', snapshotId: snapshot.snapshotId,
      existingDigest: existing.digest, attemptedDigest: digest, ingestSeq: this.sequence,
      reason: 'INV-2: a correction must be a NEW dataVersion, never a mutation of an existing snapshot',
    }));
    return { outcome: 'CONFLICT_REJECTED', snapshotId: snapshot.snapshotId, digest, recordCount: this.records.size };
  }

  /** @returns {number} */
  get size() { return this.records.size; }

  /**
   * Deterministic replay of an ORDERED contributing set (SN-4, RI-2).
   * @param {string[]} snapshotIds
   * @returns {{contributing: Array<{dataSnapshotId:string,digest:string}>,
   *            effectiveReplayIdentity: string, canonicalSerialization: string}}
   */
  replay(snapshotIds) {
    const contributing = snapshotIds.map((id) => {
      const rec = this.records.get(id);
      if (rec === undefined) {
        throw new Error(`replay: snapshotId '${id}' is not present in the canonical store`);
      }
      // RI-1: every entry supplies the full ADR-02 contributingData element set.
      return Object.freeze({
        dataSnapshotId: rec.snapshot.snapshotId,
        provider: rec.snapshot.provider,
        dataVersion: rec.snapshot.dataVersion,
        asOf: rec.snapshot.asOf,
        receivedAt: rec.snapshot.receivedAt,
        mode: rec.snapshot.mode,
        quality: rec.snapshot.quality,
        completenessPct: rec.snapshot.completenessPct,
        lineage: rec.snapshot.lineage,
        digest: rec.digest,
      });
    });
    const payload = {
      contributing,
      identityMappingVersion: contributing[0]?.lineage?.identityMappingVersion ?? null,
      namespaceVersion: contributing[0]?.lineage?.namespaceVersion ?? null,
    };
    return Object.freeze({
      contributing: Object.freeze(contributing),
      canonicalSerialization: canonicalJson(payload),
      effectiveReplayIdentity: canonicalDigest(payload),
    });
  }
}

/**
 * Prove D-2 / SI-4 / DV-5: two independent acquisitions of the same fixture must be
 * byte-identical and share one snapshotId.
 * @param {object} a @param {object} b
 * @returns {{identical: boolean, snapshotIdMatch: boolean, digestA: string, digestB: string,
 *            canonicalA: string, canonicalB: string}}
 */
export function compareAcquisitions(a, b) {
  const canonicalA = canonicalJson(a);
  const canonicalB = canonicalJson(b);
  return Object.freeze({
    identical: canonicalA === canonicalB,
    snapshotIdMatch: a.snapshotId === b.snapshotId,
    digestA: canonicalDigest(a),
    digestB: canonicalDigest(b),
    canonicalA,
    canonicalB,
  });
}

/**
 * RI-4 — two executions differing in ANY contributing vintage must have DIFFERENT effective
 * replay identities. Silent vintage drift is prohibited.
 * @param {CanonicalRecordStore} store
 * @param {string[]} setA @param {string[]} setB
 * @returns {{differ: boolean, identityA: string, identityB: string}}
 */
export function compareReplayIdentities(store, setA, setB) {
  const a = store.replay(setA);
  const b = store.replay(setB);
  return Object.freeze({
    differ: a.effectiveReplayIdentity !== b.effectiveReplayIdentity,
    identityA: a.effectiveReplayIdentity,
    identityB: b.effectiveReplayIdentity,
  });
}
