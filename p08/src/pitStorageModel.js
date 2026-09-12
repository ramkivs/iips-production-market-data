/**
 * P08-01 — PIT STORAGE MODEL (`PS-*`)
 *
 * Tracker (`Work Tracker` / `Dependency Matrix`, authoritative XLSX), verbatim:
 *   · Work item   : **P08-01** · P08 · Historical/PIT · *"PIT storage model"*
 *   · Requirement : *"Store data so prior-as-of states are reproducible."*
 *   · Deliverable : *"PIT model"*    · Dependencies: **P01-02, P06-01** (Hard)
 *   · Entry       : *"Time semantics stable"* · Exit: *"Historical query reproducible"*
 *   · Tests       : *"Backdated fixtures"*    · Evidence: *"PIT evidence"*
 *
 * Authority: **F-6 / D22** (`docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md`) §5.
 *
 * ── WHAT THIS MODULE DELIBERATELY DOES NOT DO ────────────────────────────────────────────────
 *   • **No disk persistence.** No `writeFileSync`, no `mkdirSync`, no stream. The store is an
 *     in-memory structure. Durable media selection is NOT authorized by F-6.
 *   • **No network, no credentials, no `process.env`.** No provider is selected, named or bound.
 *   • **No corporate actions** — dividends/splits/bonuses are **P08-02** (tracker; dep `P04-03`).
 *   • **No adjusted/unadjusted series, no adjustment engine** — that is **P08-03** (tracker;
 *     dep `P08-02`,`P07-03`). This module stores what it is given; it adjusts nothing.
 *   • **No acceptance, no certification, no activation.** `C7` remains **NOT CERTIFIED** and
 *     certification is **NONE_GRANTED**; `C3`/`C4`/`C11` are future **A2** acts.
 *   • **No repair of AD-17.** The replay firewall is untouched and not reinterpreted.
 *   • **No P05-04 reliance.** P05-04 is `NOT_AUTHORIZED` with no completion evidence; nothing
 *     here treats it as ingestion evidence, and no PIT claim is backfilled from P05.
 *
 * ── WHAT IT REUSES RATHER THAN REINVENTS ─────────────────────────────────────────────────────
 *   The canonical snapshot shape, the scalar `asOf`, the six version axes, `snapshotId`
 *   composition `data-${provider}-${dataVersion}-${asOf}`, the `MD:` namespace and the four-state
 *   quality vocabulary all come from accepted **P01/P02** and the **P05-01/P06-01** surfaces.
 *   Nothing is forked, redefined or widened.
 */

/**
 * PS-1 — **DEP-P01-04 IS RESOLVED HERE, AS A P08-OWNED DECISION.**
 *
 * `P01_SCHEMA_CATALOG.md` D02 records that `DataSnapshot.asOf` is a **scalar, not a series**, and
 * that whether a D02 series is *"an ordered set of snapshots or a bounded series inside `T`"* is a
 * **storage-model decision** assigned to **P08** (`P01_DEPENDENCY_REGISTER.md` DEP-P01-04:31 —
 * *"No — either satisfies the contract"*). `P05` explicitly declined to decide it
 * (`historicalAdapterContract.js` `SERIES_STRUCTURE_CONTRACT.resolvesDepP01_04 = false`,
 * `depP01_04Owner: 'P08'`).
 *
 * ⚠ **The decision is NOT defaulted from P05-01.** P05-01's one-bar-per-snapshot shape was a
 * *precedent that avoided pre-empting P08*, not a resolution. P08 now decides, and states why:
 *
 *   **DECISION — `ORDERED_SET_OF_SNAPSHOTS`.**
 *   A D02 series is stored as an **ordered set of immutable per-bar snapshots**, each retaining
 *   its own **scalar** `asOf`. The alternative (a bounded series inside `T`) is REJECTED because
 *   it would make `asOf` non-scalar inside the payload, contradicting the accepted P01 D02
 *   contract note and the P02 envelope, and would fork the canonical shape.
 *
 * ⚠ This resolves DEP-P01-04 **for the storage model only**. It grants no certification, and it
 * does not resolve adjusted/unadjusted series semantics (**P08-03**).
 */
export const SERIES_STRUCTURE_DECISION = Object.freeze({
  depP01_04: 'RESOLVED',
  owner: 'P08',
  resolvedBy: 'P08-01 PIT storage model',
  decision: 'ORDERED_SET_OF_SNAPSHOTS',
  rejectedAlternative: 'BOUNDED_SERIES_INSIDE_T',
  rejectionReason:
    'would make asOf non-scalar inside the payload, contradicting the accepted P01 D02 contract '
    + 'note and forking the P02 canonical envelope',
  asOfIsScalar: true,
  barsPerSnapshot: 1,
  defaultedFromP05: false,
  adjustedSeriesResolved: false,
  adjustedSeriesOwner: 'P08-03',
  certificationGranted: false,
});

/**
 * PS-2 — **PIT CAPABILITY DECLARATION.**
 *
 * `p05/src/localFeed.js` refuses `PIT` mode with *"PIT storage is P08, which is NOT_STARTED."*
 * ⚠ That P05 refusal is **NOT modified** by this module — P05 source is untouched. This declares
 * the P08-side capability only; wiring any P05 adapter to it is not authorized by F-6.
 */
export const PIT_CAPABILITY = Object.freeze({
  owner: 'P08-01',
  mode: 'PIT',
  storage: 'IN_MEMORY_ONLY',
  durableMediaAuthorized: false,
  persistenceAuthorized: false,
  networkAuthorized: false,
  credentialsAuthorized: false,
  p05RefusalModified: false,
});

/** PS-3 — the accepted `snapshotId` composition. Re-asserted, never re-derived. */
export const SNAPSHOT_ID_PATTERN =
  /^data-([A-Za-z0-9_]+)-([A-Za-z0-9_.\-]+)-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;

/** PS-4 — the four-state quality vocabulary. No fifth state may be introduced (P07 Q-1). */
export const QUALITY = Object.freeze(['good', 'stale', 'partial', 'unavailable']);

/** PS-5 — the six accepted version axes. ⚠ No seventh axis may be added. */
export const VERSION_AXES = Object.freeze([
  'schemaVersion', 'dataVersion', 'namespaceVersion',
  'contractVersion', 'providerVersion', 'ruleVersion',
]);

/** Structural error carrying a stable machine-readable code. */
export class PitStorageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PitStorageError';
    this.code = code;
  }
}

const ISO_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * PS-6 — Admission rules. A snapshot is admitted only if it is already canonical.
 *
 * ⚠ This module **validates and rejects**; it never coerces, repairs or defaults a value
 * (P07 `INV-7` no-coercion, reused). A rejected snapshot is not stored.
 */
function assertAdmissible(snapshot) {
  if (snapshot === null || typeof snapshot !== 'object') {
    throw new PitStorageError('PS-E1', 'snapshot must be an object');
  }
  for (const f of ['snapshotId', 'provider', 'dataVersion', 'asOf', 'domain', 'quality']) {
    if (typeof snapshot[f] !== 'string' || snapshot[f] === '') {
      throw new PitStorageError('PS-E2', `snapshot.${f} is required`);
    }
  }
  if (!ISO_MS.test(snapshot.asOf)) {
    throw new PitStorageError('PS-E3', 'asOf must be an ISO-8601 UTC instant with milliseconds');
  }
  if (!QUALITY.includes(snapshot.quality)) {
    throw new PitStorageError('PS-E4', `quality must be one of ${QUALITY.join('|')}`);
  }
  const m = SNAPSHOT_ID_PATTERN.exec(snapshot.snapshotId);
  if (m === null) {
    throw new PitStorageError('PS-E5', 'snapshotId does not match the accepted composition');
  }
  // PS-6a — snapshotId must agree with its own parts. No silent provider-ID promotion.
  if (m[1] !== snapshot.provider || m[2] !== snapshot.dataVersion || m[3] !== snapshot.asOf) {
    throw new PitStorageError(
      'PS-E6',
      'snapshotId is inconsistent with provider/dataVersion/asOf — data-${provider}-${dataVersion}-${asOf}',
    );
  }
  // PS-6b — the identity key must never be a provider symbol (OI-08 1:N, OI-09 FIGI/OpenFIGI).
  if (typeof snapshot.securityId !== 'undefined' && typeof snapshot.securityId !== 'string') {
    throw new PitStorageError('PS-E7', 'securityId must be a string when present');
  }
  // PS-6c — no seventh version axis may appear.
  for (const k of Object.keys(snapshot)) {
    if (k.endsWith('Version') && !VERSION_AXES.includes(k)) {
      throw new PitStorageError('PS-E8', `unknown version axis '${k}' — six axes are accepted`);
    }
  }
}

/** Deep-freeze so a stored vintage can never be mutated after admission (immutability, PS-7). */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const v of Object.values(value)) deepFreeze(v);
  return value;
}

/**
 * PS-7 — **THE PIT STORE.** Append-only, immutable, in-memory, deterministic.
 *
 * Exit criterion (*"Historical query reproducible"*) is met by `asOfQuery`: the same store and the
 * same `asOf` always return the same vintage, regardless of insertion order or call count.
 */
export function createPitStore() {
  /** @type {Map<string, Map<string, object>>} series key → (asOf → snapshot) */
  const series = new Map();

  function keyOf(snapshot) {
    // Series identity is domain + security identity. ⚠ The provider is NOT part of the key —
    // provider identifiers are never canonical identity (OI-08/OI-09 preserved).
    return `${snapshot.domain}::${snapshot.securityId ?? 'UNSPECIFIED'}`;
  }

  return Object.freeze({
    /**
     * PS-8 — Append a vintage. Re-appending a byte-identical snapshot is idempotent; appending a
     * DIFFERENT snapshot at an existing `asOf` is a **vintage ambiguity** and is rejected.
     * ⚠ Rejection is the point: silently overwriting a vintage would destroy reproducibility.
     */
    append(snapshot) {
      assertAdmissible(snapshot);
      const frozen = deepFreeze(structuredClone(snapshot));
      const k = keyOf(frozen);
      if (!series.has(k)) series.set(k, new Map());
      const byAsOf = series.get(k);
      const existing = byAsOf.get(frozen.asOf);
      if (existing !== undefined) {
        if (JSON.stringify(existing) !== JSON.stringify(frozen)) {
          throw new PitStorageError(
            'PS-E9',
            `vintage ambiguity at asOf=${frozen.asOf} for ${k} — a different snapshot already exists`,
          );
        }
        return frozen; // idempotent re-append
      }
      byAsOf.set(frozen.asOf, frozen);
      return frozen;
    },

    /**
     * PS-9 — **PRIOR-AS-OF REPRODUCIBILITY** — the tracker requirement itself.
     * Returns the latest vintage whose `asOf` is <= the requested instant, or `null`.
     * ⚠ Strictly `<=`: a query may never see data stamped after the instant asked for.
     */
    asOfQuery(domain, securityId, asOf) {
      if (!ISO_MS.test(asOf)) {
        throw new PitStorageError('PS-E3', 'asOf must be an ISO-8601 UTC instant with milliseconds');
      }
      const byAsOf = series.get(`${domain}::${securityId ?? 'UNSPECIFIED'}`);
      if (byAsOf === undefined) return null;
      let best = null;
      for (const [stamp, snap] of byAsOf) {
        if (stamp <= asOf && (best === null || stamp > best.asOf)) best = snap;
      }
      return best;
    },

    /** PS-10 — the ordered set of snapshots for a series (the DEP-P01-04 representation). */
    seriesOf(domain, securityId) {
      const byAsOf = series.get(`${domain}::${securityId ?? 'UNSPECIFIED'}`);
      if (byAsOf === undefined) return Object.freeze([]);
      return Object.freeze([...byAsOf.values()].sort((a, b) => (a.asOf < b.asOf ? -1 : 1)));
    },

    /**
     * PS-11 — **VINTAGE AMBIGUITY DETECTION** — the gate-model P08 evidence requirement
     * (`P00_GATE_MODEL.md`:45 *"vintage ambiguity detection"*). Reports every `asOf` carrying
     * more than one distinct payload across providers for the same series.
     * ⚠ It DETECTS and REPORTS. It does not resolve, rank or pick a winner — reconciliation
     * policy is P07-03's accepted contract, and adjustment is P08-03.
     */
    detectVintageAmbiguity(domain, securityId) {
      const snaps = this.seriesOf(domain, securityId);
      const byStamp = new Map();
      for (const s of snaps) {
        if (!byStamp.has(s.asOf)) byStamp.set(s.asOf, []);
        byStamp.get(s.asOf).push(s);
      }
      const findings = [];
      for (const [stamp, group] of byStamp) {
        const distinct = new Set(group.map((g) => JSON.stringify(g)));
        if (distinct.size > 1) {
          findings.push(Object.freeze({
            asOf: stamp, distinctPayloads: distinct.size, resolved: false, resolutionOwner: 'P07-03',
          }));
        }
      }
      return Object.freeze(findings);
    },

    /** PS-12 — deterministic size accessor, for evidence. */
    size() {
      let n = 0;
      for (const byAsOf of series.values()) n += byAsOf.size;
      return n;
    },
  });
}

/**
 * PS-13 — **EVIDENCE SURFACE** (tracker evidence column: *"PIT evidence"*).
 * ⚠ Implementation evidence is **NOT** certification evidence. This object states its own limits
 * so that no downstream reader can mistake it for a certification or acceptance claim.
 */
export const PIT_EVIDENCE = Object.freeze({
  workItem: 'P08-01',
  requirement: 'Store data so prior-as-of states are reproducible.',
  exitCriterion: 'Historical query reproducible',
  dependencies: Object.freeze(['P01-02', 'P06-01']),
  depP01_04: 'RESOLVED — ORDERED_SET_OF_SNAPSHOTS (PS-1)',
  pitEvidenceSource: 'P08-01 backdated fixtures — NOT P05, NOT P05-04',
  p05_04Relied: false,
  acceptance: 'NOT_ACCEPTED',
  a3Acceptor: 'NOT DESIGNATED',
  c7: 'NOT CERTIFIED',
  certification: 'NONE_GRANTED',
  productionActivation: 'NOT_AUTHORIZED',
  downstreamPhases: 'P09–P17 NOT_AUTHORIZED',
  deferred: Object.freeze(['P08-02 corporate actions', 'P08-03 adjusted/unadjusted series']),
});
