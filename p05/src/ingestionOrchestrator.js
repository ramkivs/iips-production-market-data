/**
 * P05-04 — INGESTION ORCHESTRATION (scheduling · retries · idempotency · checkpointing)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   D10-1  `docs/p00/P00_DECISION_LOG.md` §8.1 — *"P05-04 — ingestion orchestration — is
 *          AUTHORIZED … Scheduling · retry execution · idempotent checkpointing · the tracker
 *          Work Tracker!P05-04 exit criterion 'Replay does not duplicate data' with
 *          failure/replay tests and run logs."*
 *   D10-1 is the *"further explicit act"* that D9 §3.1 **N-3** required
 *   (`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`:89).
 *
 *   TRACKER `Work Tracker`!P05-04 (authoritative scope — nothing here is invented):
 *     Requirement    Scheduling, retries, idempotency and checkpointing.
 *     Deliverable    Ingestion orchestrator
 *     Entry Criteria Adapters conform
 *     Exit Criteria  **Replay does not duplicate data**
 *     Test/Validation Failure/replay tests
 *     Evidence       **Run logs**
 *   Recorded verbatim at `docs/p05/P05_ACCEPTANCE_CRITERIA.md`:63 as criteria **C-4**.
 *
 * ── What this module does NOT do (hard boundaries) ─────────────────────────────────────────
 *   ⚠ **NO LIVE PROVIDER EXECUTION.** D9 **N-1** and D10 §8.2 leave P05-02 live provider
 *     execution `NOT_AUTHORIZED`. This orchestrator FAILS CLOSED on any adapter that declares
 *     live connectivity or a non-`LOCAL_FIXTURE` provider kind — see
 *     `assertOrchestrationPermitted`. That refusal is behavioural, not documentary.
 *   ⚠ **NO LICENSED / DEEPER HISTORICAL ACQUISITION.** D9 **N-2** / D10 §8.2. Nothing here
 *     widens an adapter's declared capability; the P05-01 pre-flight (A-10 / E6) still governs
 *     what may be requested.
 *   ⚠ **NO CREDENTIALS, NO ENTITLEMENTS, NO PROVIDER CONFIGURATION.** No ambient environment
 *     lookup, no secret handling, no endpoint. The adapter is INJECTED by the caller; this
 *     module neither constructs nor configures one.
 *   ⚠ **NO PRODUCTION ACTIVATION** (A4 — P16 only) and **NO CERTIFICATION** claim
 *     (`NONE_GRANTED`).
 *   ⚠ **NOT P06.** No normalization, no raw/canonical separation, no canonical deduplication of
 *     *provider payloads*. The idempotency here is at the **canonical record / checkpoint**
 *     level and is P05-04 orchestration state, not P06 normalization.
 *   ⚠ **NOT the existing-IIPS `ReplayService`.** S-8 / AD-17: `ReplayService`,
 *     `DataBoundExecutor` and `LiveDataRuntime.ts` are UNTOUCHED.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   Retryability is NOT re-decided here. It is read from the accepted P02 taxonomy already
 *   implemented in `./errors.js` — `DISPOSITION[code].retryable` and `RETRY_PROHIBITED` (ES-4).
 *   Canonical-record idempotency is NOT re-implemented: the P05-01 `CanonicalRecordStore`
 *   (`./replay.js`) is injected and is the sole authority on record identity, INV-2 immutability
 *   and conflict rejection. Namespace / C1–C6 collision guarding stays where it belongs, in
 *   `./namespace.js`, reached through the feed's existing validation. **No methodology
 *   variation** (D8:35 *"no variation authorized"*).
 *
 * ── Determinism ────────────────────────────────────────────────────────────────────────────
 *   Fully **synchronous**. There is no wall clock, no randomness and no ambient input (D-3):
 *   time is a **virtual clock** advanced by declared, explicit increments, and backoff delays
 *   are COMPUTED AND RECORDED as virtual milliseconds — never slept. The same plan and the same
 *   fault plan therefore produce a byte-identical run log on every execution.
 */

import { canonicalDigest, canonicalJson } from './serialize.js';
import { ClassifiedFailure, DISPOSITION, RETRY_PROHIBITED } from './errors.js';
import { NAMESPACE_VERSION } from './namespace.js';

export const P05_04_MODULE = 'P05-04-INGESTION-ORCHESTRATOR';
export const P05_04_VERSION = '1.0';

/**
 * The only provider kind this orchestrator may drive.
 *
 * ⚠ A `LIVE` adapter is REFUSED, not merely avoided: P05-02 live provider execution remains
 * `NOT_AUTHORIZED` (D9 N-1, D10 §8.2), so orchestration must be structurally incapable of
 * performing it.
 */
export const PERMITTED_PROVIDER_KIND = 'LOCAL_FIXTURE';

/**
 * Deterministic retry policy. Deliberately data, not code: the policy is recorded in the run
 * log so the log alone is sufficient to explain every attempt.
 */
export const DEFAULT_RETRY_POLICY = Object.freeze({
  maxAttempts: 3,
  baseBackoffMs: 250,
  backoffGrowth: 2,
  maxBackoffMs: 2000,
});

/**
 * Fail closed on any adapter that could reach a provider, and on any adapter that is not the
 * P05-01 deterministic local feed surface.
 *
 * @param {{capability?: object}} adapter
 * @returns {true}
 * @throws {Error} when live provider execution would be implied
 */
export function assertOrchestrationPermitted(adapter) {
  const cap = adapter?.capability;
  if (cap === undefined || cap === null) {
    throw new Error(`${P05_04_MODULE}: the injected adapter declares no capability; refusing to orchestrate an undeclared surface`);
  }
  const kind = cap['A-1']?.providerKind;
  if (kind !== PERMITTED_PROVIDER_KIND) {
    throw new Error(
      `${P05_04_MODULE}: refuses an adapter of providerKind '${String(kind)}' — P05-02 live provider execution is NOT_AUTHORIZED (D9 N-1, D10 §8.2)`,
    );
  }
  if (cap['A-6']?.liveConnectivity !== false) {
    throw new Error(
      `${P05_04_MODULE}: refuses an adapter declaring live connectivity — live provider execution is NOT_AUTHORIZED (D9 N-1, D10 §8.2)`,
    );
  }
  if (cap['A-7']?.credentialsRequired !== false || cap['A-7']?.entitlementRequired !== false) {
    throw new Error(
      `${P05_04_MODULE}: refuses an adapter requiring credentials or entitlement — no credential or entitlement handling is authorized in P05-04`,
    );
  }
  if (typeof adapter.snapshot !== 'function') {
    throw new Error(`${P05_04_MODULE}: the injected adapter exposes no snapshot() ingress`);
  }
  return true;
}

/**
 * The ONLY authority consulted for retryability is the accepted P02 taxonomy in `./errors.js`.
 * ES-4: retry must never be applied to a deterministic failure.
 *
 * @param {'E1'|'E2'|'E3'|'E4'|'E5'|'E6'|'E7'|'E8'} code
 * @returns {boolean}
 */
export function isRetryableCode(code) {
  if (RETRY_PROHIBITED.includes(code)) return false;
  const disposition = DISPOSITION[code];
  return disposition !== undefined && disposition.retryable === true;
}

/**
 * Deterministic exponential backoff in VIRTUAL milliseconds. Computed and recorded — never slept.
 *
 * @param {object} policy @param {number} attemptIndex zero-based
 * @returns {number}
 */
export function backoffForAttempt(policy, attemptIndex) {
  if (attemptIndex <= 0) return 0;
  const raw = policy.baseBackoffMs * policy.backoffGrowth ** (attemptIndex - 1);
  return Math.min(raw, policy.maxBackoffMs);
}

/**
 * ── SCHEDULING ─────────────────────────────────────────────────────────────────────────────
 *
 * Builds a deterministic run plan: a fixed, ordered table of ticks over a virtual timeline.
 * The plan is DATA. Nothing is armed on a timer and nothing waits on the wall clock — the
 * executor walks the table in order, which is what makes the run log reproducible.
 *
 * @param {object} cfg
 * @param {Array<Record<string, unknown>>} cfg.tasks  ordered task requests
 * @param {number} [cfg.runsPerTask=1]                rounds; each round visits every task
 * @param {number} [cfg.intervalMs=0]                 virtual spacing between ticks
 * @param {number} [cfg.startVirtualMs=0]
 * @returns {Readonly<{planId: string, taskCount: number, tickCount: number,
 *                     intervalMs: number, startVirtualMs: number,
 *                     taskRefs: string[], ticks: Array<Readonly<Record<string, unknown>>>}>}
 */
export function buildRunPlan(cfg) {
  const { tasks, runsPerTask = 1, intervalMs = 0, startVirtualMs = 0 } = cfg;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error(`${P05_04_MODULE}: buildRunPlan requires at least one task`);
  }
  if (!Number.isInteger(runsPerTask) || runsPerTask < 1) {
    throw new Error(`${P05_04_MODULE}: runsPerTask must be a positive integer`);
  }
  if (!Number.isInteger(intervalMs) || intervalMs < 0) {
    throw new Error(`${P05_04_MODULE}: intervalMs must be a non-negative integer`);
  }
  if (!Number.isInteger(startVirtualMs) || startVirtualMs < 0) {
    throw new Error(`${P05_04_MODULE}: startVirtualMs must be a non-negative integer`);
  }

  const taskRefs = tasks.map((t) => t.taskRef);
  const duplicate = taskRefs.find((ref, i) => taskRefs.indexOf(ref) !== i);
  if (duplicate !== undefined) {
    throw new Error(`${P05_04_MODULE}: taskRef '${duplicate}' is not unique; a run plan must be unambiguous`);
  }

  const ticks = [];
  let tickIndex = 0;
  // Round-major order: each round visits every task in declaration order, exactly as a
  // periodic scheduler would. Deterministic and independent of any wall clock.
  for (let round = 0; round < runsPerTask; round += 1) {
    for (let t = 0; t < tasks.length; t += 1) {
      const task = tasks[t];
      ticks.push(Object.freeze({
        tickIndex,
        runIndex: round,
        taskRef: task.taskRef,
        virtualTimeMs: startVirtualMs + tickIndex * intervalMs,
        request: Object.freeze({ ...task.request }),
      }));
      tickIndex += 1;
    }
  }

  const planSpec = { taskRefs, runsPerTask, intervalMs, startVirtualMs };
  return Object.freeze({
    planId: canonicalDigest(planSpec),
    taskCount: tasks.length,
    tickCount: ticks.length,
    runsPerTask,
    intervalMs,
    startVirtualMs,
    taskRefs: Object.freeze([...taskRefs]),
    ticks: Object.freeze(ticks),
  });
}

/**
 * ── IDEMPOTENT CHECKPOINT LEDGER ───────────────────────────────────────────────────────────
 *
 * A checkpoint is the durable statement "tick N of run R was completed, and its canonical
 * outcome digest was D". Because the identity is a pure function of (runId, tickIndex, taskRef)
 * and the payload digest is recorded alongside it, replaying a completed tick is a NO-OP and an
 * attempt to record a DIFFERENT outcome for the same tick is a CONFLICT — the same INV-2
 * discipline `CanonicalRecordStore` applies to canonical records, applied to orchestration
 * state. Nothing is overwritten and nothing "last wins".
 *
 * The ledger is INJECTED across orchestrator instances so that a resumed run and a replayed run
 * share one checkpoint history — which is what makes "replay does not duplicate data" testable.
 */
export class CheckpointLedger {
  /** @param {{runId: string}} opts */
  constructor(opts) {
    if (typeof opts?.runId !== 'string' || opts.runId.length === 0) {
      throw new Error(`${P05_04_MODULE}: a ledger requires an explicit runId`);
    }
    this.runId = opts.runId;
    /** @type {Map<string, {checkpointId:string,outcomeDigest:string,tickIndex:number,taskRef:string}>} */
    this.entries = new Map();
    this.sequence = 0;
    /** @type {Array<Readonly<Record<string, unknown>>>} */
    this.events = [];
  }

  /**
   * Deterministic identity for a tick. Depends on the run, the tick position and the task — NOT
   * on any attempt counter, so a retry of the same tick has the SAME checkpoint identity and
   * cannot create a second record.
   *
   * @param {{tickIndex: number, taskRef: string}} tick
   * @returns {string}
   */
  checkpointIdFor(tick) {
    return canonicalDigest({
      runId: this.runId,
      tickIndex: tick.tickIndex,
      taskRef: tick.taskRef,
    });
  }

  /** @param {object} tick @returns {boolean} */
  has(tick) {
    return this.entries.has(this.checkpointIdFor(tick));
  }

  /** @returns {number} */
  get size() { return this.entries.size; }

  /**
   * @param {object} tick
   * @param {Record<string, unknown>} outcome
   * @returns {{outcome: 'RECORDED'|'IDEMPOTENT_NOOP'|'CONFLICT_REJECTED',
   *            checkpointId: string, entryCount: number}}
   */
  recordCheckpoint(tick, outcome) {
    const checkpointId = this.checkpointIdFor(tick);
    const outcomeDigest = canonicalDigest(outcome);
    const existing = this.entries.get(checkpointId);
    this.sequence += 1;

    if (existing === undefined) {
      this.entries.set(checkpointId, Object.freeze({
        checkpointId,
        outcomeDigest,
        tickIndex: tick.tickIndex,
        runIndex: tick.runIndex,
        taskRef: tick.taskRef,
        virtualTimeMs: tick.virtualTimeMs,
        recordSeq: this.sequence,
      }));
      this.events.push(Object.freeze({
        type: 'RECORDED', checkpointId, tickIndex: tick.tickIndex, taskRef: tick.taskRef,
        outcomeDigest, recordSeq: this.sequence,
      }));
      return { outcome: 'RECORDED', checkpointId, entryCount: this.entries.size };
    }

    if (existing.outcomeDigest === outcomeDigest) {
      this.events.push(Object.freeze({
        type: 'IDEMPOTENT_NOOP', checkpointId, tickIndex: tick.tickIndex, taskRef: tick.taskRef,
        outcomeDigest, existingRecordSeq: existing.recordSeq, recordSeq: this.sequence,
      }));
      return { outcome: 'IDEMPOTENT_NOOP', checkpointId, entryCount: this.entries.size };
    }

    // INV-2 discipline applied to orchestration state: no mutation, no silent overwrite.
    this.events.push(Object.freeze({
      type: 'CONFLICT_REJECTED', checkpointId, tickIndex: tick.tickIndex, taskRef: tick.taskRef,
      existingDigest: existing.outcomeDigest, attemptedDigest: outcomeDigest,
      recordSeq: this.sequence,
      reason: 'INV-2: a completed checkpoint is immutable; a differing outcome for the same tick is a conflict, never a correction',
    }));
    return { outcome: 'CONFLICT_REJECTED', checkpointId, entryCount: this.entries.size };
  }

  /** Canonical, digest-stable ledger history. */
  canonicalHistory() {
    const entries = [...this.entries.values()]
      .sort((a, b) => a.tickIndex - b.tickIndex)
      .map((e) => Object.freeze({
        checkpointId: e.checkpointId,
        tickIndex: e.tickIndex,
        runIndex: e.runIndex,
        taskRef: e.taskRef,
        virtualTimeMs: e.virtualTimeMs,
        outcomeDigest: e.outcomeDigest,
      }));
    return Object.freeze({
      runId: this.runId,
      entryCount: entries.length,
      entries: Object.freeze(entries),
      digest: canonicalDigest({ runId: this.runId, entries }),
    });
  }
}

/**
 * Wrap an adapter with a FIXED, explicit fault plan so that transient and permanent failures can
 * be exercised deterministically. There is no randomness and no wall-clock: the plan is a table.
 *
 * @param {object} adapter
 * @param {Record<string, string[]>} faultPlan  taskRef → error class per attempt (1-based)
 * @returns {object} an adapter exposing the same sole ingress shape
 */
export function withDeterministicFaults(adapter, faultPlan = {}) {
  assertOrchestrationPermitted(adapter);
  return Object.freeze({
    capability: adapter.capability,
    snapshot(request, meta = {}) {
      const faults = faultPlan[meta.taskRef];
      if (Array.isArray(faults)) {
        const code = faults[meta.attempt - 1];
        if (code !== undefined) {
          throw new ClassifiedFailure(code, `injected deterministic fault for attempt ${meta.attempt} of ${meta.taskRef}`, {
            injected: true, taskRef: meta.taskRef, attempt: meta.attempt,
          });
        }
      }
      return adapter.snapshot(request);
    },
  });
}

/**
 * Raised to model a run being INTERRUPTED mid-flight. It propagates out of `run()` BEFORE any
 * checkpoint for the in-flight tick is written — the honest model of a crash, in which work in
 * flight is lost and only checkpointed ticks survive. Used by the failure/replay tests to prove
 * that resuming completes the remaining work WITHOUT duplicating the records already ingested.
 */
export class RunAbortedError extends Error {
  /** @param {number} tickIndex @param {string} taskRef @param {string} reason */
  constructor(tickIndex, taskRef, reason) {
    super(`run interrupted at tick ${tickIndex} (${taskRef}): ${reason}`);
    this.name = 'RunAbortedError';
    this.tickIndex = tickIndex;
    this.taskRef = taskRef;
  }
}

/**
 * ── THE ORCHESTRATOR ───────────────────────────────────────────────────────────────────────
 *
 * Executes a run plan against an injected adapter with bounded deterministic retries, an
 * idempotent checkpoint ledger and an injected canonical record store. Synchronous throughout.
 */
export class IngestionOrchestrator {
  /**
   * @param {object} opts
   * @param {object} opts.adapter                    must satisfy `assertOrchestrationPermitted`
   * @param {CheckpointLedger} opts.ledger
   * @param {import('./replay.js').CanonicalRecordStore} opts.store
   * @param {object} [opts.retryPolicy]
   * @param {Record<string, string[]>} [opts.faultPlan]
   * @param {Record<number, string>} [opts.interruptPlan]  tickIndex → reason; models a crash
   */
  constructor(opts) {
    assertOrchestrationPermitted(opts?.adapter);
    if (!(opts.ledger instanceof CheckpointLedger)) {
      throw new Error(`${P05_04_MODULE}: a CheckpointLedger is required`);
    }
    if (opts.store === undefined || typeof opts.store.ingest !== 'function') {
      throw new Error(`${P05_04_MODULE}: a CanonicalRecordStore is required`);
    }
    this.adapter = opts.faultPlan === undefined
      ? opts.adapter
      : withDeterministicFaults(opts.adapter, opts.faultPlan);
    this.ledger = opts.ledger;
    this.store = opts.store;
    this.retryPolicy = Object.freeze({ ...DEFAULT_RETRY_POLICY, ...(opts.retryPolicy ?? {}) });
    this.interruptPlan = Object.freeze({ ...(opts.interruptPlan ?? {}) });
    /** Virtual clock only — reset from the plan at `run()`. Never a wall clock (D-3). */
    this.virtualClockMs = 0;
    /** @type {Array<Readonly<Record<string, unknown>>>} */
    this.tickLog = [];
    this.summary = null;
  }

  /**
   * Execute every tick of the plan in order. A tick whose checkpoint already exists is SKIPPED
   * before any adapter work occurs — this is the idempotency guarantee that makes a replay
   * non-duplicating, and it holds even when the previous run was interrupted part-way.
   *
   * @param {ReturnType<typeof buildRunPlan>} plan
   * @returns {Readonly<Record<string, unknown>>} the run result summary
   */
  run(plan) {
    this.virtualClockMs = plan.startVirtualMs;
    let skipped = 0;
    let succeeded = 0;
    let rejected = 0;
    let retried = 0;
    let recordsInserted = 0;
    let recordsIdempotent = 0;
    let recordsConflict = 0;

    for (const tick of plan.ticks) {
      this.virtualClockMs = Math.max(this.virtualClockMs, tick.virtualTimeMs);

      // ⚠ Checkpoint-first. A completed tick performs NO adapter work on replay.
      if (this.ledger.has(tick)) {
        this.tickLog.push(Object.freeze({
          tickIndex: tick.tickIndex, taskRef: tick.taskRef, runIndex: tick.runIndex,
          virtualTimeMs: this.virtualClockMs, status: 'SKIPPED_CHECKPOINTED',
          attempts: 0, retries: 0,
        }));
        skipped += 1;
        continue;
      }

      // ⚠ Interruption point. Thrown BEFORE the tick is executed and before its checkpoint is
      // written, so the tick is genuinely un-done and a resume must redo it exactly once.
      const interruptReason = this.interruptPlan[tick.tickIndex];
      if (interruptReason !== undefined) {
        throw new RunAbortedError(tick.tickIndex, tick.taskRef, interruptReason);
      }

      const attempt = this.executeTick(tick);
      if (attempt.retries > 0) retried += attempt.retries;
      if (attempt.status === 'ACQUIRED') succeeded += 1; else rejected += 1;
      if (attempt.storeOutcome === 'INSERTED') recordsInserted += 1;
      if (attempt.storeOutcome === 'IDEMPOTENT_NOOP') recordsIdempotent += 1;
      if (attempt.storeOutcome === 'CONFLICT_REJECTED') recordsConflict += 1;

      // The checkpoint records the OUTCOME DIGEST only — never provider-native content (FR-2).
      const cp = this.ledger.recordCheckpoint(tick, {
        status: attempt.status,
        snapshotId: attempt.snapshotId,
        canonicalDigest: attempt.canonicalDigest,
        errorClass: attempt.errorClass,
        attempts: attempt.attempts,
      });

      this.tickLog.push(Object.freeze({
        tickIndex: tick.tickIndex, taskRef: tick.taskRef, runIndex: tick.runIndex,
        virtualTimeMs: this.virtualClockMs, status: attempt.status,
        attempts: attempt.attempts, retries: attempt.retries,
        backoffVirtualMs: attempt.backoffVirtualMs,
        snapshotId: attempt.snapshotId, canonicalDigest: attempt.canonicalDigest,
        errorClass: attempt.errorClass, storeOutcome: attempt.storeOutcome ?? null,
        checkpoint: cp.outcome, checkpointId: cp.checkpointId,
      }));
    }

    this.summary = Object.freeze({
      module: P05_04_MODULE,
      moduleVersion: P05_04_VERSION,
      runId: this.ledger.runId,
      planId: plan.planId,
      namespaceVersion: NAMESPACE_VERSION,
      retryPolicy: Object.freeze({ ...this.retryPolicy }),
      virtualClockMs: this.virtualClockMs,
      tickCount: plan.ticks.length,
      skippedCheckpointed: skipped,
      acquired: succeeded,
      rejected,
      ticksRetried: retried,
      recordsInserted,
      recordsIdempotentNoop: recordsIdempotent,
      recordsConflictRejected: recordsConflict,
      canonicalRecordCount: this.store.size,
      checkpointCount: this.ledger.size,
    });
    return this.summary;
  }

  /**
   * Bounded deterministic retry loop for ONE tick. Retryability is delegated entirely to the
   * accepted taxonomy (`isRetryableCode`); a non-retryable class aborts on the first attempt
   * (ES-4: retrying a deterministic failure is prohibited).
   *
   * @param {object} tick
   * @returns {Readonly<Record<string, unknown>>}
   */
  executeTick(tick) {
    const policy = this.retryPolicy;
    let attempts = 0;
    let retries = 0;
    let backoffVirtualMs = 0;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      attempts = attempt;
      if (attempt > 1) {
        const wait = backoffForAttempt(policy, attempt - 1);
        // ⚠ VIRTUAL wait: the clock is advanced and the delay RECORDED. Nothing sleeps.
        backoffVirtualMs += wait;
        this.virtualClockMs += wait;
        retries += 1;
      }
      try {
        const result = this.adapter.snapshot(tick.request, {
          taskRef: tick.taskRef, attempt, tickIndex: tick.tickIndex,
        });
        if (result.ok === true) {
          const snapshot = result.snapshot;
          const storeOutcome = this.store.ingest(snapshot);
          return Object.freeze({
            status: 'ACQUIRED', attempts, retries, backoffVirtualMs,
            snapshotId: snapshot.snapshotId,
            canonicalDigest: storeOutcome.digest,
            storeOutcome: storeOutcome.outcome,
            errorClass: null,
          });
        }
        // RJ-2: a rejection is classified, never silently swallowed and never quality-faked.
        const code = result.failure?.code ?? 'E8';
        if (!isRetryableCode(code)) {
          return Object.freeze({
            status: 'REJECTED', attempts, retries, backoffVirtualMs,
            snapshotId: null, canonicalDigest: null, storeOutcome: null, errorClass: code,
          });
        }
      } catch (err) {
        const code = err instanceof ClassifiedFailure ? err.code : 'E8';
        if (!isRetryableCode(code)) {
          return Object.freeze({
            status: 'REJECTED', attempts, retries, backoffVirtualMs,
            snapshotId: null, canonicalDigest: null, storeOutcome: null, errorClass: code,
          });
        }
      }
    }

    // Attempts exhausted while the class was retryable — recorded, not hidden.
    return Object.freeze({
      status: 'EXHAUSTED', attempts, retries, backoffVirtualMs,
      snapshotId: null, canonicalDigest: null, storeOutcome: null, errorClass: null,
      exhausted: true,
    });
  }

  /**
   * The tracker's required **run log** evidence artifact. Canonicalized and digest-stable: the
   * same plan, policy and fault plan produce a byte-identical log on every execution.
   *
   * @param {ReturnType<typeof buildRunPlan>} plan
   */
  runLog(plan) {
    const history = this.ledger.canonicalHistory();
    const log = Object.freeze({
      artifact: 'P05-04-RUN-LOG',
      artifactVersion: '1.0',
      module: P05_04_MODULE,
      moduleVersion: P05_04_VERSION,
      runId: this.ledger.runId,
      plan: Object.freeze({
        planId: plan.planId,
        taskRefs: plan.taskRefs,
        runsPerTask: plan.runsPerTask,
        intervalMs: plan.intervalMs,
        startVirtualMs: plan.startVirtualMs,
        tickCount: plan.tickCount,
      }),
      retryPolicy: Object.freeze({ ...this.retryPolicy }),
      namespaceVersion: NAMESPACE_VERSION,
      // ⚠ Determinism statement, not a claim of provider execution.
      executionMode: 'LOCAL_FIXTURE_SYNTHETIC',
      liveProviderExecution: false,
      licensedHistoricalAcquisition: false,
      productionActivation: false,
      certificationClaim: false,
      // ⚠ The artifact states its own phase scope, so no reader can mistake orchestration state
      // for P06 normalization. NOT P06 — P06-01/P06-02/P06-03 are authorized for ENTRY by D10-2
      // and are not implemented here.
      phaseScope: 'P05-04',
      p06Implemented: false,
      ticks: Object.freeze([...this.tickLog]),
      summary: this.summary,
      checkpointHistory: history,
      canonicalRecordCount: this.store.size,
    });
    return Object.freeze({
      log,
      canonicalSerialization: canonicalJson(log),
      runLogDigest: canonicalDigest(log),
    });
  }
}
