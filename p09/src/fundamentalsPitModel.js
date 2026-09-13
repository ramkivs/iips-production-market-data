/**
 * P09-03 — FUNDAMENTALS PIT MODEL (restatement tracking)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P09: Minimum evidence *Fundamentals lineage; publication vs
 *   effective time*. Gate intent *"Statements, ratios, valuation inputs"*.
 *
 *   `P01_SCHEMA_CATALOG.md` D03: **PIT? Yes — mandatory (restatements are routine)**.
 *
 *   `P01_DATA_CONTRACT.md` §10:
 *     PIT-1: mode = PIT requires explicit pitBoundary
 *     PIT-2: PIT queries are repeatable
 *     PIT-3: A later correction (new dataVersion) must not retroactively alter a past PIT result
 *     PIT-4: Publication time and effective time are both preserved
 *     PIT-5: Each field declares pitEligible
 *     PIT-6: PIT storage is P08
 *
 *   `P01_FIELD_DICTIONARY.md` §5:
 *     restatementSeq (R, int, publicationTime, PIT: Yes)
 *
 * ── Restatement model ──────────────────────────────────────────────────────────────────────
 *   Fundamentals data is routinely restated. A company may:
 *     1. File initial Q1 results (restatementSeq = 0)
 *     2. Restate Q1 results due to accounting correction (restatementSeq = 1)
 *     3. Restate again (restatementSeq = 2)
 *
 *   Each restatement has:
 *     - The SAME effectiveTime (fiscal period end)
 *     - A NEW publicationTime (filing date of the restatement)
 *     - A HIGHER restatementSeq
 *     - A NEW dataVersion (per PIT-3)
 *
 *   ⚠ **RP-1** restatementSeq is monotonically increasing within a (provider, identity,
 *     fiscalPeriod, statementType) group.
 *   ⚠ **RP-2** A restatement is a NEW snapshot, never a mutation of an existing one (PIT-3).
 *   ⚠ **RP-3** The latest restatement (highest restatementSeq) is the "current" view.
 *   ⚠ **RP-4** A prior restatement is the "as originally filed" view.
 *   ⚠ **RP-5** PIT queries at a given pitBoundary return the latest restatement knowable
 *     at that boundary (publicationTime ≤ pitBoundary).
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P08-01.** No PIT storage implementation. P08 owns the durable store; P09 declares
 *     the restatement model and provides query logic over an in-memory store.
 *   ⚠ **NOT P08-02.** No corporate-action ingestion.
 *   ⚠ **NOT P08-03.** No adjusted/unadjusted series.
 *   ⚠ **In-memory only.** No disk persistence.
 *   ⚠ **No wall clock, no randomness, no ambient input.**
 *   ⚠ **No acceptance, no certification, no production activation.**
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ `PitStorageError` imported from `p08/src/pitStorageModel.js`.
 *   ⚠ `deepFreeze` imported from `p05/src/contract.js`.
 *   ⚠ `assertIsoUtc`, `canonicalDigest` imported from `p05/src/serialize.js`.
 */

import { PitStorageError } from '../../p08/src/pitStorageModel.js';
import { deepFreeze } from '../../p05/src/contract.js';
import { assertIsoUtc, canonicalDigest } from '../../p05/src/serialize.js';
import {
  fundamentalsKey,
  FUNDAMENTALS_DOMAIN,
  STATEMENT_TYPES,
  FISCAL_PERIODS,
} from './fundamentalsModel.js';

export const P09_03_MODULE = 'P09-03-FUNDAMENTALS-PIT-MODEL';

/**
 * RP-1 — Build a restatement identity key.
 * This is the grouping key for restatement sequences.
 *
 * @param {object} args
 * @param {string} args.provider
 * @param {string} args.identityKey    canonical security identity
 * @param {string} args.fiscalPeriod   one of FISCAL_PERIODS
 * @param {string} args.statementType  one of STATEMENT_TYPES
 * @returns {string}
 */
export function restatementGroupKey({ provider, identityKey, fiscalPeriod, statementType }) {
  if (typeof provider !== 'string' || provider.length === 0) {
    throw new PitStorageError('RP-1', 'provider is required for restatement group key');
  }
  if (typeof identityKey !== 'string' || identityKey.length === 0) {
    throw new PitStorageError('RP-1', 'identityKey is required for restatement group key');
  }
  if (!FISCAL_PERIODS.includes(fiscalPeriod)) {
    throw new PitStorageError('RP-1',
      `fiscalPeriod '${fiscalPeriod}' is not in the closed set`);
  }
  if (!STATEMENT_TYPES.includes(statementType)) {
    throw new PitStorageError('RP-1',
      `statementType '${statementType}' is not in the closed set`);
  }
  return `${provider}:${identityKey}:${fiscalPeriod}:${statementType}`;
}

/**
 * RP-1/RP-2 — Extract the restatementSeq from a fundamentals snapshot.
 *
 * @param {Record<string, unknown>} snapshot
 * @returns {number}
 */
export function extractRestatementSeq(snapshot) {
  const rsKey = fundamentalsKey('restatementSeq');
  const field = snapshot?.fields?.[rsKey];
  if (field === undefined) {
    throw new PitStorageError('RP-1',
      `snapshot '${snapshot?.snapshotId}' has no restatementSeq field`);
  }
  if (field.availability !== 'PRESENT') {
    throw new PitStorageError('RP-1',
      `snapshot '${snapshot?.snapshotId}' restatementSeq is ${field.availability}, not PRESENT`);
  }
  if (!Number.isInteger(field.value) || field.value < 0) {
    throw new PitStorageError('RP-1',
      `restatementSeq must be a non-negative integer, got ${field.value}`);
  }
  return field.value;
}

/**
 * RP-5 — Query the latest restatement knowable at a given PIT boundary.
 *
 * @param {object[]} snapshots         array of fundamentals snapshots
 * @param {string} pitBoundary         ISO-8601 UTC
 * @param {string} groupKey            restatement group key
 * @returns {Readonly<Record<string, unknown>>}
 */
export function queryLatestRestatement(snapshots, pitBoundary, groupKey) {
  assertIsoUtc(pitBoundary, 'pitBoundary');
  const boundaryMs = Date.parse(pitBoundary);

  // Filter to the restatement group
  const group = snapshots.filter((s) => {
    const provider = s.provider;
    const fpKey = fundamentalsKey('fiscalPeriod');
    const stKey = fundamentalsKey('statementType');
    const fp = s.fields?.[fpKey]?.value;
    const st = s.fields?.[stKey]?.value;
    const identityKey = s.identity?.canonicalSecurityId ?? s.identity?.companyId ?? 'unknown';
    const key = restatementGroupKey({
      provider, identityKey, fiscalPeriod: fp, statementType: st,
    });
    return key === groupKey;
  });

  // Filter to snapshots knowable at the PIT boundary (publicationTime ≤ pitBoundary)
  const knowable = group.filter((s) => {
    const rsKey = fundamentalsKey('restatementSeq');
    const pubTime = s.fields?.[rsKey]?.publicationTime ?? s.receivedAt;
    return Date.parse(pubTime) <= boundaryMs;
  });

  if (knowable.length === 0) {
    return Object.freeze({
      found: false,
      pitBoundary,
      groupKey,
      knowableCount: 0,
      totalCount: group.length,
      module: P09_03_MODULE,
    });
  }

  // RP-3 — the latest restatement (highest restatementSeq) is the current view
  const latest = knowable.reduce((best, s) => {
    const seq = extractRestatementSeq(s);
    const bestSeq = extractRestatementSeq(best);
    return seq > bestSeq ? s : best;
  });

  return Object.freeze({
    found: true,
    pitBoundary,
    groupKey,
    snapshot: latest,
    restatementSeq: extractRestatementSeq(latest),
    knowableCount: knowable.length,
    totalCount: group.length,
    snapshotDigest: canonicalDigest(latest),
    module: P09_03_MODULE,
  });
}

/**
 * RP-1/RP-2 — Validate that a new restatement is properly sequenced.
 *
 * @param {Record<string, unknown>} newSnapshot     the proposed new restatement
 * @param {Record<string, unknown>[]} existingSnapshots  existing snapshots in the same group
 * @returns {Readonly<Record<string, unknown>>}
 */
export function validateRestatementSequence(newSnapshot, existingSnapshots) {
  const newSeq = extractRestatementSeq(newSnapshot);
  const violations = [];

  for (const existing of existingSnapshots) {
    const existingSeq = extractRestatementSeq(existing);

    // RP-1 — restatementSeq must be strictly greater than all existing
    if (newSeq <= existingSeq) {
      violations.push(
        `RP-1: new restatementSeq ${newSeq} is not greater than existing ${existingSeq} ` +
        `in snapshot '${existing.snapshotId}'`
      );
    }

    // RP-2 — a restatement must have a NEW dataVersion
    if (newSnapshot.dataVersion === existing.dataVersion) {
      violations.push(
        `RP-2: restatement must have a new dataVersion, but '${newSnapshot.dataVersion}' ` +
        `matches existing snapshot '${existing.snapshotId}'`
      );
    }
  }

  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
    newRestatementSeq: newSeq,
    existingCount: existingSnapshots.length,
    module: P09_03_MODULE,
  });
}

/**
 * Create a fundamentals-aware PIT store.
 * In-memory store for D03 fundamentals snapshots with restatement tracking.
 *
 * @returns {Readonly<Record<string, Function>>}
 */
export function createFundamentalsPitStore() {
  /** @type {Map<string, object>} snapshotId → snapshot */
  const store = new Map();
  /** @type {Map<string, string[]>} groupKey → snapshotId[] */
  const restatementGroups = new Map();

  return Object.freeze({
    /**
     * Admit a fundamentals snapshot with restatement tracking.
     * @param {Record<string, unknown>} snapshot
     * @returns {Readonly<Record<string, unknown>>}
     */
    admit(snapshot) {
      if (snapshot.domain !== FUNDAMENTALS_DOMAIN) {
        throw new PitStorageError('RP-1',
          `fundamentals PIT store admits only D03 snapshots, got '${snapshot.domain}'`);
      }
      if (snapshot.mode !== 'PIT') {
        throw new PitStorageError('FM-6',
          `fundamentals snapshot must be PIT mode, got '${snapshot.mode}'`);
      }

      const frozen = deepFreeze(structuredClone(snapshot));
      store.set(frozen.snapshotId, frozen);

      // Track restatement group
      const fpKey = fundamentalsKey('fiscalPeriod');
      const stKey = fundamentalsKey('statementType');
      const fp = frozen.fields?.[fpKey]?.value;
      const st = frozen.fields?.[stKey]?.value;
      const identityKey = frozen.identity?.canonicalSecurityId
        ?? frozen.identity?.companyId ?? 'unknown';
      const groupKey = restatementGroupKey({
        provider: frozen.provider,
        identityKey,
        fiscalPeriod: fp,
        statementType: st,
      });

      if (!restatementGroups.has(groupKey)) {
        restatementGroups.set(groupKey, []);
      }
      restatementGroups.get(groupKey).push(frozen.snapshotId);

      return Object.freeze({
        outcome: 'INSERTED',
        snapshotId: frozen.snapshotId,
        restatementGroupKey: groupKey,
        restatementSeq: extractRestatementSeq(frozen),
        module: P09_03_MODULE,
      });
    },

    /** Get all snapshots in a restatement group. */
    restatementGroup(groupKey) {
      const ids = restatementGroups.get(groupKey) ?? [];
      return Object.freeze(
        ids.map((id) => store.get(id)).filter(Boolean)
      );
    },

    /** Get all restatement group keys. */
    restatementGroupKeys() {
      return Object.freeze([...restatementGroups.keys()].sort());
    },

    /** Get all snapshots. */
    snapshots() {
      return Object.freeze([...store.values()]);
    },

    get size() { return store.size; },

    module: P09_03_MODULE,
  });
}
