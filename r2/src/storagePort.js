/**
 * R-2 — STORAGE PORT (durable technology choice DEFERRED under §D.23)
 *
 * ── ⚠ THE §D.23 STOP CONDITION WAS TRIGGERED — READ THIS FIRST ───────────────────────────────
 *   R-2 §D.21 requires the use of the repository's **existing** database, persistence technology,
 *   migration framework, naming conventions, transaction patterns and schema-evolution
 *   conventions "EXCLUSIVELY wherever suitable". Those do not exist. Verified this turn against
 *   the full repository (all 7 remote branches, 154-commit history):
 *
 *     · database/ORM dependencies in any `package.json` — **0 hits**
 *       (pg, postgres, sqlite3, better-sqlite3, mysql2, mongodb, prisma, @prisma/client,
 *        typeorm, sequelize, knex, drizzle-orm, ioredis, redis)
 *     · migration directories — **0**
 *     · `.sql` files — **0**
 *     · schema files — **0**
 *     · the only two paths matching `migrat` are
 *       `iips-platform/src/distributed/MigrationRuntime.ts` and its regression test — a v1.1↔v2.0
 *       **runtime coexistence/rollback** experiment, not a database migration framework.
 *
 *   Furthermore an existing accepted authority decision **prohibits** introducing one:
 *     · `docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md`:139 —
 *       "`p08/src/**` permitted, but **no disk persistence** and ⚠ **no network/credential access**"
 *     · the same decision's guard **M3** (`:177`) — "`p08/src` writes to disk → **FAIL**".
 *   The established `p06/package.json` description likewise states "NO durable persistence", and
 *   P15 record R-07 notes PIT durable persistence is OPEN with in-memory operation **by mandate**
 *   (D22 §5).
 *
 *   R-2 §D.23 therefore applies: *"If the repository genuinely has no suitable persistence
 *   mechanism for market data: STOP before introducing a new persistence technology. Report the
 *   architectural gap for explicit authority review. Do NOT silently introduce a new persistence
 *   stack."*
 *
 * ── What this module does instead ────────────────────────────────────────────────────────────
 *   It defines the **port** (the persistence interface the rest of R-2 depends on) and supplies a
 *   deterministic **in-memory reference adapter** for it. That satisfies §S — "do not stop the
 *   entire workstream" — without breaching §D.23:
 *     · every pipeline, test and metric in R-2 is written against the port, so the durable
 *       implementation is a drop-in substitution and **no** R-2 logic needs rewriting later;
 *     · no persistence technology is chosen, added or implied;
 *     · the decision is escalated, not made.
 *   The in-memory adapter is explicitly labelled as a REFERENCE implementation and is **not**
 *   production storage: it does not survive process exit and must not be represented as doing so.
 *
 * ── What an authority decision must settle ───────────────────────────────────────────────────
 *   See `docs/r2/R2_READINESS_REPORT.md` §16 and §24. In short: either (a) authorise a specific
 *   durable persistence technology and its migration framework, expressly varying D22 §5's
 *   no-disk-persistence mandate for this scope, or (b) confirm that market data remains
 *   in-memory/externally-managed and R-2 must consume it read-only from an external store.
 */

/**
 * The persistence port. Implementations must be idempotent under `putCurrent` and `putDaily`
 * (§E.31, §F.42, §F.43) and must never partially apply a batch (§D.24 transaction patterns).
 *
 * @typedef {object} MarketDataStore
 * @property {(rec: object) => {status: 'inserted'|'updated'|'unchanged'}} putDaily
 * @property {(batch: object[]) => {inserted: number, updated: number, unchanged: number}} putDailyBatch
 * @property {(key: string) => object|null} getDaily
 * @property {(range: {from: string, to: string}) => object[]} queryDailyRange
 * @property {(rec: object) => {status: 'updated'|'unchanged'}} putCurrent
 * @property {() => object|null} getCurrent
 * @property {(rec: object, reason: string) => void} quarantine
 * @property {() => object[]} quarantined
 * @property {(sourceRef: string) => {status: 'recorded'|'duplicate'}} recordSourceFile
 * @property {() => number} dailyCount
 */

/**
 * Deterministic in-memory REFERENCE implementation of `MarketDataStore`.
 *
 * ⚠ NOT PRODUCTION STORAGE. Process-lifetime only. See the header.
 *
 * Idempotency semantics, which §F.43 depends on:
 *   · `putDaily` keyed by `canonicalRecordKey` (exchange|isin|tradeDate). Re-processing the same
 *     logical bar at a new `dataVersion` **replaces** it and reports `updated`; re-processing an
 *     identical record reports `unchanged` and mutates nothing. A second canonical row is never
 *     created.
 *   · `putCurrent` replaces the single current-state row; it never appends. §E.30 — every
 *     15-minute snapshot is **not** persisted; the current state is refreshed in place and only
 *     the ingestion/freshness metadata accumulates for audit (§A.10).
 *
 * @param {object} [opts]
 * @param {string[]} [opts.order]  reserved for deterministic iteration guarantees
 * @returns {MarketDataStore}
 */
export function createInMemoryStore(opts = {}) {
  const daily = new Map();
  const order = [];
  let current = null;
  const quarantinedRows = [];
  const sourceFiles = new Map();
  const auditTrail = [];

  function signature(rec) {
    // Content signature excluding volatile ingestion metadata, so "same content, re-ingested"
    // is correctly reported as `unchanged` rather than as an update.
    const { ingestionTimestamp, freshness, ...rest } = rec;
    return JSON.stringify(rest, Object.keys(rest).sort());
  }

  return Object.freeze({
    kind: 'in-memory-reference',
    durable: false,

    putDaily(rec) {
      const key = dailyKey(rec);
      const prev = daily.get(key);
      if (prev === undefined) {
        daily.set(key, rec);
        order.push(key);
        auditTrail.push({ op: 'inserted', key, at: rec.ingestionTimestamp });
        return { status: 'inserted' };
      }
      if (signature(prev) === signature(rec)) {
        auditTrail.push({ op: 'unchanged', key, at: rec.ingestionTimestamp });
        return { status: 'unchanged' };
      }
      daily.set(key, rec);
      auditTrail.push({ op: 'updated', key, at: rec.ingestionTimestamp, previousDataVersion: prev.dataVersion });
      return { status: 'updated' };
    },

    putDailyBatch(batch) {
      const out = { inserted: 0, updated: 0, unchanged: 0 };
      for (const rec of batch) out[this.putDaily(rec).status] += 1;
      return out;
    },

    getDaily(key) {
      return daily.get(key) ?? null;
    },

    queryDailyRange({ from, to }) {
      return order
        .map((k) => daily.get(k))
        .filter((r) => r && r.tradeDate >= from && r.tradeDate <= to);
    },

    putCurrent(rec) {
      if (current !== null && signature(current) === signature(rec)) {
        auditTrail.push({ op: 'current-unchanged', at: rec.ingestionTimestamp });
        return { status: 'unchanged' };
      }
      const previous = current;
      current = rec;
      auditTrail.push({ op: 'current-updated', at: rec.ingestionTimestamp, previousAsOf: previous ? previous.asOf : null });
      return { status: 'updated' };
    },

    getCurrent() {
      return current;
    },

    quarantine(rec, reason) {
      quarantinedRows.push(Object.freeze({ rec, reason, at: rec ? rec.ingestionTimestamp : null }));
    },

    quarantined() {
      return quarantinedRows.slice();
    },

    /**
     * §J — duplicate source-file detection. Recording the same `sourceRef` twice is a
     * duplicate, not an error: the file is recognised and processing is skipped.
     */
    recordSourceFile(sourceRef) {
      if (sourceFiles.has(sourceRef)) return { status: 'duplicate' };
      sourceFiles.set(sourceRef, true);
      return { status: 'recorded' };
    },

    dailyCount() {
      return daily.size;
    },

    /** Non-port diagnostics used by tests and evidence. */
    _auditTrail() {
      return auditTrail.slice();
    },
    _sourceFileCount() {
      return sourceFiles.size;
    },
    _opts() {
      return opts;
    },
  });
}

function dailyKey(rec) {
  return `${rec.exchange}|${rec.isin}|${rec.tradeDate}`;
}

/**
 * Assert that a candidate object actually satisfies the port. Used by
 * `providerAdapter.test.js` / store tests so a future durable implementation cannot be wired in
 * while missing a method — the failure surfaces at construction, not mid-ingestion.
 *
 * @param {object} store
 * @returns {true}
 * @throws {Error} listing every missing member
 */
export function assertStoreShape(store) {
  const required = [
    'putDaily', 'putDailyBatch', 'getDaily', 'queryDailyRange', 'putCurrent', 'getCurrent',
    'quarantine', 'quarantined', 'recordSourceFile', 'dailyCount',
  ];
  const missing = required.filter((m) => typeof store?.[m] !== 'function');
  if (missing.length > 0) {
    throw new Error(`R-2: MarketDataStore implementation is missing: ${missing.join(', ')}`);
  }
  return true;
}
