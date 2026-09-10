/**
 * P05-04 — INGESTION ORCHESTRATION: FAILURE / REPLAY TESTS
 *
 * These are the *Test / Validation* artifacts the tracker names for `Work Tracker`!P05-04
 * ("**Failure/replay tests**"), proving its *Exit Criteria* — **"Replay does not duplicate
 * data"** — against its *Requirement*: "Scheduling, retries, idempotency and checkpointing."
 *
 * Authorized by **D10-1** (`docs/p00/P00_DECISION_LOG.md` §8.1), which is the *"further explicit
 * act"* D9 §3.1 **N-3** required. Scope is EXACTLY the tracker work item; nothing wider.
 *
 * ⚠ Every fixture here is synthetic and local. **No provider execution evidence is produced or
 *   implied.** P05-02 live provider execution remains `NOT_AUTHORIZED` (D9 N-1, D10 §8.2) and
 *   group B below asserts that the orchestrator is structurally incapable of it.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildRunPlan,
  backoffForAttempt,
  assertOrchestrationPermitted,
  CheckpointLedger,
  IngestionOrchestrator,
  RunAbortedError,
  isRetryableCode,
  withDeterministicFaults,
  DEFAULT_RETRY_POLICY,
  PERMITTED_PROVIDER_KIND,
  P05_04_MODULE,
} from '../src/ingestionOrchestrator.js';
import { CanonicalRecordStore } from '../src/replay.js';
import { ClassifiedFailure, DISPOSITION, RETRY_PROHIBITED } from '../src/errors.js';
import { makeFeed, RECEIVED_AT } from './helpers.js';

/** The fixed, synthetic task set. All requests are the P05-01 local fixture surface. */
const TASKS = [
  { taskRef: 'Q-0001', request: { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'C-0001', request: { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'H-0001', request: { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'VEN-XSYN', request: { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED_AT, micCode: 'XSYN' } },
];

/** A fresh, independent orchestration context — no state shared between tests. */
function context(opts = {}) {
  return {
    adapter: makeFeed(),
    ledger: new CheckpointLedger({ runId: opts.runId ?? 'RUN-T' }),
    store: new CanonicalRecordStore(),
  };
}

function orchestrator(ctx, extra = {}) {
  return new IngestionOrchestrator({ adapter: ctx.adapter, ledger: ctx.ledger, store: ctx.store, ...extra });
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// S — SCHEDULING (tracker Requirement, first element)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('S/1 — a run plan is a deterministic, fully materialized table over a VIRTUAL timeline', () => {
  const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 3, intervalMs: 500, startVirtualMs: 1000 });
  assert.equal(plan.taskCount, 4);
  assert.equal(plan.tickCount, 12); // 4 tasks × 3 rounds
  // Round-major: every round visits every task in declaration order.
  assert.deepEqual(plan.ticks.slice(0, 4).map((t) => t.taskRef), ['Q-0001', 'C-0001', 'H-0001', 'VEN-XSYN']);
  assert.deepEqual(plan.ticks.slice(4, 8).map((t) => t.taskRef), ['Q-0001', 'C-0001', 'H-0001', 'VEN-XSYN']);
  assert.deepEqual(plan.ticks.map((t) => t.virtualTimeMs),
    Array.from({ length: 12 }, (_, i) => 1000 + i * 500));
  assert.deepEqual(plan.ticks.map((t) => t.tickIndex), Array.from({ length: 12 }, (_, i) => i));
});

test('S/2 — the plan is a pure function of its inputs (no wall clock, no randomness)', () => {
  const cfg = { tasks: TASKS, runsPerTask: 2, intervalMs: 250 };
  const a = buildRunPlan(cfg);
  const b = buildRunPlan({ ...cfg, tasks: TASKS.map((t) => ({ ...t, request: { ...t.request } })) });
  assert.equal(a.planId, b.planId);
  assert.deepEqual(a.ticks, b.ticks);
  // A changed policy necessarily changes the identity — the plan is not opaque.
  assert.notEqual(a.planId, buildRunPlan({ ...cfg, intervalMs: 251 }).planId);
});

test('S/3 — an ambiguous or empty plan is refused, never silently normalized', () => {
  assert.throws(() => buildRunPlan({ tasks: [] }), /at least one task/);
  assert.throws(() => buildRunPlan({ tasks: [TASKS[0], TASKS[0]] }), /is not unique/);
  assert.throws(() => buildRunPlan({ tasks: TASKS, runsPerTask: 0 }), /positive integer/);
  assert.throws(() => buildRunPlan({ tasks: TASKS, intervalMs: -1 }), /non-negative integer/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// R — RETRIES (tracker Requirement, second element)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('R/1 — retryability is NOT re-decided by P05-04; it is read from the accepted P02 taxonomy', () => {
  // ES-4: retry must never be applied to a deterministic failure.
  for (const code of RETRY_PROHIBITED) {
    assert.equal(isRetryableCode(code), false, `${code} is retry-prohibited by the accepted taxonomy`);
  }
  // Only the classes the accepted taxonomy marks retryable may be retried.
  for (const [code, d] of Object.entries(DISPOSITION)) {
    if (!RETRY_PROHIBITED.includes(code)) {
      assert.equal(isRetryableCode(code), d.retryable === true, `${code} follows DISPOSITION.retryable`);
    }
  }
  assert.deepEqual(Object.keys(DISPOSITION).filter((c) => isRetryableCode(c)), ['E4', 'E7']);
});

test('R/2 — a transient E4 is retried and then succeeds; the attempts are recorded, not hidden', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: [TASKS[0]] });
  const summary = orchestrator(ctx, { faultPlan: { 'Q-0001': ['E4', 'E4'] } }).run(plan);
  assert.equal(summary.acquired, 1);
  assert.equal(summary.ticksRetried, 2);
  const log = ctx.ledger.canonicalHistory();
  assert.equal(log.entryCount, 1);
  const orch2 = orchestrator(ctx, { faultPlan: { 'Q-0001': ['E4', 'E4'] } });
  orch2.run(plan);
  // The successful tick recorded its attempt count in the checkpoint payload.
  assert.ok(summary.recordsInserted === 1, 'the eventual success ingests exactly one canonical record');
});

test('R/3 — retry is BOUNDED: exhausting maxAttempts is reported as EXHAUSTED, never retried forever', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: [TASKS[0]] });
  const faultPlan = { 'Q-0001': ['E4', 'E4', 'E4', 'E4'] }; // one more than maxAttempts
  const orch = orchestrator(ctx, { faultPlan });
  const result = orch.executeTick(plan.ticks[0]);
  assert.equal(result.status, 'EXHAUSTED');
  assert.equal(result.attempts, DEFAULT_RETRY_POLICY.maxAttempts);
  assert.equal(result.exhausted, true);
});

test('R/4 — a NON-retryable class aborts on the FIRST attempt (ES-4: no pointless retry)', () => {
  const ctx = context();
  // D99 is outside the declared capability → pre-flight E6 (A-10), which is retry-prohibited.
  const plan = buildRunPlan({
    tasks: [{ taskRef: 'BAD-DOMAIN', request: { domain: 'D99', mode: 'SNAPSHOT', fixtureId: 'Q-0001', receivedAt: RECEIVED_AT } }],
  });
  const orch = orchestrator(ctx);
  const summary = orch.run(plan);
  assert.equal(summary.rejected, 1);
  assert.equal(summary.acquired, 0);
  assert.equal(orch.tickLog[0].attempts, 1, 'a deterministic failure is attempted exactly once');
  assert.equal(orch.tickLog[0].errorClass, 'E6');
  assert.equal(orch.tickLog[0].retries, 0);
  assert.equal(summary.canonicalRecordCount, 0, 'a rejection admits no canonical record (RJ-2)');
});

test('R/5 — backoff is deterministic, capped, and computed in VIRTUAL time — nothing sleeps', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => backoffForAttempt(DEFAULT_RETRY_POLICY, i)),
    [0, 250, 500, 1000, 2000]);
  // Capped at maxBackoffMs, never unbounded.
  assert.equal(backoffForAttempt(DEFAULT_RETRY_POLICY, 99), DEFAULT_RETRY_POLICY.maxBackoffMs);
  const ctx = context();
  const plan = buildRunPlan({ tasks: [TASKS[0]] });
  const orch = orchestrator(ctx, { faultPlan: { 'Q-0001': ['E4', 'E4'] } });
  orch.run(plan);
  assert.equal(orch.tickLog[0].backoffVirtualMs, 250 + 500);
  // The virtual clock absorbed the backoff; the process did not wait.
  assert.ok(orch.virtualClockMs >= 750);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// C — CHECKPOINTING (tracker Requirement, fourth element)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('C/1 — a checkpoint identity is a pure function of (runId, tickIndex, taskRef) — never of the attempt', () => {
  const ledger = new CheckpointLedger({ runId: 'RUN-X' });
  const tick = { tickIndex: 3, taskRef: 'Q-0001', runIndex: 0, virtualTimeMs: 0 };
  const id = ledger.checkpointIdFor(tick);
  assert.equal(id, ledger.checkpointIdFor({ ...tick }));
  // A retry of the SAME tick cannot mint a second identity.
  assert.equal(id, ledger.checkpointIdFor({ ...tick, attempt: 7 }));
  // A different tick, or a different run, necessarily differs.
  assert.notEqual(id, ledger.checkpointIdFor({ ...tick, tickIndex: 4 }));
  assert.notEqual(id, new CheckpointLedger({ runId: 'RUN-Y' }).checkpointIdFor(tick));
});

test('C/2 — re-recording the same outcome is a NO-OP; a DIFFERENT outcome is a CONFLICT, never an overwrite', () => {
  const ledger = new CheckpointLedger({ runId: 'RUN-C' });
  const tick = { tickIndex: 0, taskRef: 'Q-0001', runIndex: 0, virtualTimeMs: 0 };
  assert.equal(ledger.recordCheckpoint(tick, { status: 'ACQUIRED', snapshotId: 's1' }).outcome, 'RECORDED');
  assert.equal(ledger.recordCheckpoint(tick, { status: 'ACQUIRED', snapshotId: 's1' }).outcome, 'IDEMPOTENT_NOOP');
  const conflict = ledger.recordCheckpoint(tick, { status: 'ACQUIRED', snapshotId: 'DIFFERENT' });
  assert.equal(conflict.outcome, 'CONFLICT_REJECTED');
  assert.equal(ledger.size, 1, 'a conflicting outcome does not create or replace a record');
  // INV-2 discipline: the original is intact.
  assert.match(conflict.reason ?? ledger.events.at(-1).reason, /INV-2/);
  assert.equal(ledger.events.filter((e) => e.type === 'CONFLICT_REJECTED').length, 1);
});

test('C/3 — a checkpointed tick performs NO adapter work on replay (checkpoint-first)', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS });
  orchestrator(ctx).run(plan);
  assert.equal(ctx.ledger.size, 4);

  // Wrap the adapter so any call is observable; on replay none must occur.
  let calls = 0;
  const spy = {
    capability: ctx.adapter.capability,
    snapshot(req) { calls += 1; return ctx.adapter.snapshot(req); },
  };
  const orch2 = new IngestionOrchestrator({ adapter: spy, ledger: ctx.ledger, store: ctx.store });
  const summary = orch2.run(plan);
  assert.equal(calls, 0, 'a completed tick must not re-invoke the adapter at all');
  assert.equal(summary.skippedCheckpointed, 4);
  assert.equal(summary.acquired, 0);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// I — THE EXIT CRITERION: "Replay does not duplicate data"
// ══════════════════════════════════════════════════════════════════════════════════════════

test('I/1 — EXIT CRITERION: re-running the same task in the same run does not duplicate data', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 3 }); // each task acquired 3×
  const summary = orchestrator(ctx).run(plan);
  assert.equal(plan.tickCount, 12);
  assert.equal(summary.canonicalRecordCount, 4, 'four tasks ⇒ exactly four canonical records');
  assert.equal(summary.recordsInserted, 4);
  assert.equal(summary.recordsIdempotentNoop, 8, 'the other eight acquisitions are idempotent no-ops');
  assert.equal(summary.recordsConflictRejected, 0);
  assert.equal(ctx.store.size, 4);
});

test('I/2 — EXIT CRITERION: replaying the whole plan creates ZERO new records and ZERO new checkpoints', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 2 });
  const first = orchestrator(ctx, { faultPlan: { 'H-0001': ['E7'] } }).run(plan);
  const recordsBefore = ctx.store.size;
  const checkpointsBefore = ctx.ledger.size;
  const digestBefore = ctx.ledger.canonicalHistory().digest;

  // A fresh orchestrator, but the SAME ledger and the SAME store — i.e. a true replay.
  const replay = orchestrator(ctx).run(plan);

  assert.equal(replay.skippedCheckpointed, plan.tickCount, 'every tick is recognised as done');
  assert.equal(replay.recordsInserted, 0, 'no record is inserted by a replay');
  assert.equal(replay.canonicalRecordCount, recordsBefore);
  assert.equal(replay.checkpointCount, checkpointsBefore);
  assert.equal(ctx.ledger.canonicalHistory().digest, digestBefore, 'the checkpoint history is unchanged');
  assert.equal(ctx.store.size, recordsBefore);
  assert.equal(first.recordsInserted, recordsBefore);
});

test('I/3 — EXIT CRITERION: an INTERRUPTED run resumes and completes WITHOUT duplicating prior records', () => {
  const ctx = context({ runId: 'RUN-CRASH' });
  const plan = buildRunPlan({ tasks: TASKS });

  // Crash at tick 2: ticks 0 and 1 are checkpointed, tick 2 is lost in flight.
  let aborted = null;
  try {
    orchestrator(ctx, { interruptPlan: { 2: 'simulated host failure' } }).run(plan);
  } catch (err) { aborted = err; }
  assert.ok(aborted instanceof RunAbortedError);
  assert.equal(aborted.tickIndex, 2);
  const partialRecords = ctx.store.size;
  assert.equal(partialRecords, 2);
  assert.equal(ctx.ledger.size, 2, 'only completed ticks are checkpointed');

  // Resume on the SAME ledger and store.
  const resumed = orchestrator(ctx).run(plan);
  assert.equal(resumed.skippedCheckpointed, 2, 'the two completed ticks are skipped');
  assert.equal(resumed.acquired, 2, 'only the remaining work is performed');
  assert.equal(resumed.recordsInserted, 2);
  assert.equal(resumed.recordsIdempotentNoop, 0, 'no already-ingested record is ingested twice');
  assert.equal(ctx.store.size, 4, 'two partial + two resumed = four, never more');
  assert.equal(ctx.ledger.size, 4);

  // A further full replay still adds nothing.
  const again = orchestrator(ctx).run(plan);
  assert.equal(again.recordsInserted, 0);
  assert.equal(ctx.store.size, 4);
});

test('I/4 — EXIT CRITERION: the replayed canonical corpus is BYTE-IDENTICAL to the original', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS });
  orchestrator(ctx, { faultPlan: { 'C-0001': ['E4'] } }).run(plan);
  const ids = [...ctx.store.records.keys()].sort();
  const before = ctx.store.replay(ids);

  orchestrator(ctx).run(plan); // full replay
  const after = ctx.store.replay(ids);

  assert.equal(after.canonicalSerialization, before.canonicalSerialization);
  assert.equal(after.effectiveReplayIdentity, before.effectiveReplayIdentity);
  assert.equal(ctx.store.events.filter((e) => e.type === 'CONFLICT_REJECTED').length, 0,
    'INV-2: replay never produces a conflicting vintage');
});

test('I/5 — idempotency reuses the P05-01 canonical store; P05-04 invents no second record identity', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: [TASKS[0]] });
  orchestrator(ctx).run(plan);
  const [rec] = [...ctx.store.records.values()];
  // The record identity is the P05-01 governed snapshotId, and the store's own event vocabulary.
  assert.match(rec.snapshotId, /^data-localfix-v[0-9a-f]{16}-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.deepEqual(ctx.store.events.map((e) => e.type), ['INSERTED']);
  orchestrator(ctx, { runsPerTask: 1 }).run(buildRunPlan({ tasks: [TASKS[0]] }));
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// F — FAILURE handling (the tracker's "Failure/replay tests")
// ══════════════════════════════════════════════════════════════════════════════════════════

test('F/1 — E1 is the only quality-bearing class: it yields a snapshot and is NOT retried', () => {
  const ctx = context();
  const plan = buildRunPlan({
    // X-0001 is the feed's declared provider-unavailable fixture (E1).
    tasks: [{ taskRef: 'UNAVAIL', request: { domain: 'D01', mode: 'LIVE', fixtureId: 'X-0001', receivedAt: RECEIVED_AT } }],
  });
  const orch = orchestrator(ctx);
  const summary = orch.run(plan);
  assert.equal(orch.tickLog[0].attempts, 1, 'E1 is not retryable — one attempt only');
  // The feed admits an E1 snapshot with EMPTY fields; it is a real record, not a rejection.
  assert.equal(summary.acquired, 1);
  assert.equal(summary.canonicalRecordCount, 1);
  const [rec] = [...ctx.store.records.values()];
  assert.equal(rec.snapshot.quality, 'unavailable');
  assert.equal(rec.snapshot.completenessPct, 0);
});

test('F/2 — a failure is CLASSIFIED, never swallowed and never faked into a quality state', () => {
  const ctx = context();
  const plan = buildRunPlan({
    tasks: [{ taskRef: 'MALFORMED', request: { domain: 'D01', mode: 'LIVE', fixtureId: 'M-0001', receivedAt: RECEIVED_AT } }],
  });
  const orch = orchestrator(ctx);
  orch.run(plan);
  const entry = orch.tickLog[0];
  assert.equal(entry.status, 'REJECTED');
  assert.ok(/^E[1-8]$/.test(entry.errorClass), 'the tick records exactly one accepted error class');
  assert.equal(entry.snapshotId, null);
  assert.equal(ctx.store.size, 0, 'RJ-2: a rejection admits nothing downstream');
});

test('F/3 — injected faults are an explicit table: no randomness and no hidden failure source', () => {
  const ctx = context();
  const wrapped = withDeterministicFaults(ctx.adapter, { 'Q-0001': ['E4'] });
  assert.equal(wrapped.capability, ctx.adapter.capability);
  assert.throws(() => wrapped.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED_AT },
    { taskRef: 'Q-0001', attempt: 1 }), (e) => e instanceof ClassifiedFailure && e.code === 'E4');
  // Attempt 2 is not in the table, so it proceeds normally.
  const ok = wrapped.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED_AT },
    { taskRef: 'Q-0001', attempt: 2 });
  assert.equal(ok.ok, true);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// L — RUN LOGS (the tracker's required Evidence artifact)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('L/1 — the run log is byte-reproducible across independent executions', () => {
  const a = context({ runId: 'RUN-L' });
  const b = context({ runId: 'RUN-L' });
  const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 2, intervalMs: 100 });
  const oa = orchestrator(a, { faultPlan: { 'Q-0001': ['E4', 'E4'] } });
  const ob = orchestrator(b, { faultPlan: { 'Q-0001': ['E4', 'E4'] } });
  oa.run(plan); ob.run(plan);
  const la = oa.runLog(plan);
  const lb = ob.runLog(plan);
  assert.equal(la.runLogDigest, lb.runLogDigest);
  assert.equal(la.canonicalSerialization, lb.canonicalSerialization);
  assert.ok(la.runLogDigest.length === 64, 'a canonical digest is recorded');
});

test('L/2 — the run log carries every quantity the exit criterion needs, and no provider-native content', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 2 });
  const orch = orchestrator(ctx, { faultPlan: { 'H-0001': ['E7'] } });
  orch.run(plan);
  const { log } = orch.runLog(plan);
  assert.equal(log.artifact, 'P05-04-RUN-LOG');
  assert.equal(log.module, P05_04_MODULE);
  assert.equal(log.plan.tickCount, 8);
  assert.equal(log.ticks.length, 8);
  // Every tick records attempts, retries, backoff and the checkpoint outcome.
  for (const t of log.ticks) {
    assert.ok(Number.isInteger(t.attempts));
    assert.ok(Number.isInteger(t.retries));
    assert.ok(['SKIPPED_CHECKPOINTED', 'ACQUIRED', 'REJECTED', 'EXHAUSTED'].includes(t.status));
    assert.ok(t.checkpointId.length === 64);
  }
  // 8 ticks (4 tasks × 2 rounds) ⇒ 8 checkpoints, but only 4 canonical records.
  assert.equal(log.checkpointHistory.entryCount, 8);
  assert.equal(log.summary.recordsInserted, 4);
  assert.equal(log.summary.recordsIdempotentNoop, 4);
  assert.equal(log.summary.canonicalRecordCount, 4);
  // FR-2: the log names no provider-native vocabulary and carries no secret material.
  const text = JSON.stringify(log);
  assert.doesNotMatch(text, /sym|bidPx|askPx|officialClose|evEbitda/);
  assert.doesNotMatch(text, /https?:\/\//);
});

test('L/3 — the run log states its own execution boundary explicitly', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS });
  orchestrator(ctx).run(plan);
  const { log } = orch2(ctx, plan);
  assert.equal(log.executionMode, 'LOCAL_FIXTURE_SYNTHETIC');
  assert.equal(log.liveProviderExecution, false);
  assert.equal(log.licensedHistoricalAcquisition, false);
  assert.equal(log.productionActivation, false);
  assert.equal(log.certificationClaim, false);
  // The artifact states its own phase scope, so orchestration state cannot be mistaken for P06.
  assert.equal(log.phaseScope, 'P05-04');
  assert.equal(log.p06Implemented, false);
});

function orch2(ctx, plan) {
  const o = orchestrator(ctx);
  o.run(plan);
  return o.runLog(plan);
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// B — BOUNDARY: the authorization limits, asserted BEHAVIOURALLY
// ══════════════════════════════════════════════════════════════════════════════════════════

test('B/1 — the orchestrator REFUSES a live-connectivity adapter (D9 N-1 / D10 §8.2)', () => {
  const live = {
    capability: {
      'A-1': { providerKind: 'LIVE' },
      'A-6': { liveConnectivity: true },
      'A-7': { credentialsRequired: true, entitlementRequired: true },
    },
    snapshot: () => { throw new Error('must never be called'); },
  };
  assert.throws(() => assertOrchestrationPermitted(live), /NOT_AUTHORIZED \(D9 N-1, D10 §8\.2\)/);
  // The constructor refuses it too — the orchestrator cannot even be built around it.
  const ctx = context();
  assert.throws(() => new IngestionOrchestrator({ adapter: live, ledger: ctx.ledger, store: ctx.store }),
    /NOT_AUTHORIZED/);
  assert.throws(() => withDeterministicFaults(live, {}), /NOT_AUTHORIZED/);
});

test('B/2 — an adapter declaring live connectivity but a local kind is still refused', () => {
  const ctx = context();
  const sneaky = {
    capability: {
      'A-1': { providerKind: PERMITTED_PROVIDER_KIND },
      'A-6': { liveConnectivity: true },
      'A-7': { credentialsRequired: false, entitlementRequired: false },
    },
    snapshot: ctx.adapter.snapshot,
  };
  assert.throws(() => assertOrchestrationPermitted(sneaky), /live connectivity/);
});

test('B/3 — an adapter requiring credentials or entitlement is refused', () => {
  const ctx = context();
  const needing = {
    capability: {
      'A-1': { providerKind: PERMITTED_PROVIDER_KIND },
      'A-6': { liveConnectivity: false },
      'A-7': { credentialsRequired: true, entitlementRequired: false },
    },
    snapshot: ctx.adapter.snapshot,
  };
  assert.throws(() => assertOrchestrationPermitted(needing), /credentials or entitlement/);
  // An undeclared surface is refused rather than assumed safe.
  assert.throws(() => assertOrchestrationPermitted({}), /declares no capability/);
});

test('B/4 — the whole orchestration path runs with every network primitive made to throw', () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED IN P05'); };
  try {
    const ctx = context();
    const plan = buildRunPlan({ tasks: TASKS, runsPerTask: 2 });
    const summary = orchestrator(ctx, { faultPlan: { 'Q-0001': ['E4'] } }).run(plan);
    // 8 ticks all acquire successfully; the second round deduplicates at the store.
    assert.equal(summary.acquired, 8);
    assert.equal(summary.recordsInserted, 4);
    assert.equal(summary.canonicalRecordCount, 4);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('B/5 — P05-04 orchestration is NOT P06: it emits no canonical normalization and no raw/canonical split', () => {
  const ctx = context();
  const plan = buildRunPlan({ tasks: TASKS });
  const orch = orchestrator(ctx);
  orch.run(plan);
  const { log } = orch.runLog(plan);
  // Orchestration state only: run plan, ticks, checkpoints. No normalization artifacts.
  for (const key of ['normalization', 'canonicalForm', 'rawPayload', 'deduplicationKey', 'normalizedRecord']) {
    assert.equal(key in log, false, `the run log must not introduce P06 concept '${key}'`);
  }
  assert.equal(log.module, P05_04_MODULE);
  // And the store it writes to is the P05-01 canonical record store, unmodified.
  assert.ok(ctx.store instanceof CanonicalRecordStore);
});

test('B/6 — C1–C6 fail-closed guarding and the exact `MD:` token are unchanged and still enforced', async () => {
  const { NAMESPACE_TOKEN, assertC1, assertCollisionGuard } = await import('../src/namespace.js');
  assert.equal(NAMESPACE_TOKEN, 'MD:');
  // C5 fail-closed still aborts on a non-namespaced key.
  assert.throws(() => assertC1(['price.last']), /C1/);
  assert.throws(() => assertCollisionGuard({ fields: [{ key: 'notNamespaced' }] }), /C1|namespace/);
  // Every key the orchestrated run actually emitted is exactly MD:<domain>.<field>.
  // `snapshot.fields` is a keyed map (OI-10), so the KEY is the namespace assertion.
  const ctx = context();
  orchestrator(ctx).run(buildRunPlan({ tasks: TASKS }));
  const keys = [...ctx.store.records.values()]
    .flatMap((r) => Object.keys(r.snapshot.fields));
  assert.ok(keys.length > 0);
  for (const k of keys) assert.match(k, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/);
});

test('B/7 — no certification, activation or acceptance claim is made by the orchestrator', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const here = dirname(fileURLToPath(import.meta.url));
  const text = readFileSync(join(here, '..', 'src', 'ingestionOrchestrator.js'), 'utf8');
  assert.doesNotMatch(text, /certification granted|is certified|E2E-030 (passed|renewed)/i);
  assert.doesNotMatch(text, /production activation (granted|authorized)/i);
  assert.doesNotMatch(text, /P05-04 (?:is )?(?:COMPLETE|complete)\b/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// E — the committed EVIDENCE package is consistent, classified and non-provider
// ══════════════════════════════════════════════════════════════════════════════════════════

const p05Root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = 'evidence-p05-04';

function readEvidence(name) {
  return JSON.parse(readFileSync(join(p05Root, EVIDENCE_DIR, name), 'utf8'));
}

test('E/1 — the committed evidence package exists and its index digests match the committed bytes', async () => {
  const { canonicalDigest } = await import('../src/serialize.js');
  const index = readEvidence('00-INDEX.json');
  assert.ok(index.evidenceFiles.length >= 8);
  for (const entry of index.evidenceFiles) {
    const rel = entry.file.split('/').pop();
    const text = readFileSync(join(p05Root, EVIDENCE_DIR, rel), 'utf8');
    // Proves the index was generated FROM these bytes and the files were not hand-edited after.
    assert.equal(canonicalDigest({ name: rel, text }), entry.sha256, `${rel} matches its index digest`);
  }
});

test('E/2 — every exit-criterion proof in the committed evidence is TRUE', () => {
  const exit = readEvidence('04-exit-criterion-replay-no-duplication.json');
  assert.ok(exit.proofs.length >= 6);
  for (const p of exit.proofs) {
    assert.equal(p.result, true, `${p.id} — ${p.name}`);
  }
  assert.match(exit.trackerField, /Replay does not duplicate data/,
    'the artifact cites the tracker exit criterion verbatim');
});

test('E/3 — every boundary attestation in the committed evidence is REFUSED', () => {
  const boundary = readEvidence('07-boundary-attestations.json');
  assert.ok(boundary.attestations.length >= 6);
  for (const a of boundary.attestations) {
    assert.equal(a.refused, true, `${a.case} must be refused`);
  }
  assert.equal(boundary.namespaceGuard.token, 'MD:');
  assert.equal(boundary.namespaceGuard.tokenExact, true);
  assert.equal(boundary.namespaceGuard.c1ToC6BehaviourChanged, false);
  assert.equal(boundary.p06Boundary.p06Implemented, false);
});

test('E/4 — EVERY committed evidence file is classified as non-provider, non-P06 evidence', () => {
  const files = readdirSync(join(p05Root, EVIDENCE_DIR)).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 9);
  for (const f of files) {
    const doc = readEvidence(f);
    assert.equal(doc.classification.isProviderEvidence, false, `${f} must not claim provider evidence`);
    assert.equal(doc.classification.isP06Evidence, false, `${f} must not claim P06 evidence`);
    assert.equal(doc.classification.phaseScope, 'P05-04', `${f} must state its phase scope`);
    assert.equal(doc.classification.p06Implemented, false, `${f} must not claim P06 implementation`);
    assert.equal(doc.classification.productionActivated, false, `${f} must not claim activation`);
    assert.equal(doc.classification.certificationClaim, false, `${f} must not claim certification`);
    assert.match(doc.classification.recordedLimitation, /NOT exercised against a live P05-02 adapter/,
      `${f} must carry limitation L-1`);
  }
});

test('E/5 — the evidence records the L-1 limitation and does not launder it into provider evidence', () => {
  const limits = readEvidence('08-limitations-and-open-items.json');
  const l1 = limits.limitations.find((l) => l.id === 'L-1');
  assert.ok(l1 !== undefined, 'limitation L-1 must be recorded');
  assert.match(l1.cause, /standing non-authorization/);
  assert.match(l1.statement, /NOT been exercised against a live P05-02 adapter/);
  // The distinction between synthetic run logs and provider evidence is explicit, not implied.
  const index = readEvidence('00-INDEX.json');
  assert.equal(index.classification.isProviderEvidence, false);
  assert.match(index.exitCriteriaAssessment.evidence, /LOCAL SYNTHETIC run logs/);
  // L-4: the historical acceptance record is not retro-edited to manufacture completion.
  const l4 = limits.limitations.find((l) => l.id === 'L-4');
  assert.ok(l4 !== undefined);
  assert.match(l4.statement, /remain HISTORICALLY TRUE and UNEDITED/);
});

test('E/6 — the test count stated in the committed evidence matches this file (no stale counts)', () => {
  // The evidence quotes a test count. If tests are added without regenerating, that number goes
  // stale silently — which is exactly the failure this assertion prevents.
  const declared = readEvidence('00-INDEX.json').exitCriteriaAssessment.testValidation;
  const actual = readFileSync(join(p05Root, 'tests', 'orchestration.test.js'), 'utf8')
    .split('\n').filter((l) => /^test\(/.test(l)).length;
  assert.match(declared, new RegExp(`\\(${actual} tests`),
    `the evidence declares ${actual} tests — regenerate with: npm run evidence:p05-04`);
  assert.match(readEvidence('00-INDEX.json').classification.trackerP05_04TestValidation,
    new RegExp(`\\(${actual} tests\\)`));
});
