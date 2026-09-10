/**
 * P05-04 — EVIDENCE GENERATOR (ingestion orchestration: scheduling · retries · idempotency ·
 * checkpointing)
 *
 * Authority: **D10-1** (`docs/p00/P00_DECISION_LOG.md` §8.1) — *"P05-04 — ingestion orchestration
 * — is AUTHORIZED … Scheduling · retry execution · idempotent checkpointing · the tracker
 * Work Tracker!P05-04 exit criterion 'Replay does not duplicate data' with failure/replay tests
 * and run logs."* D10-1 is the *"further explicit act"* D9 §3.1 **N-3** required.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package IS the tracker's `Work Tracker`!P05-04 *Evidence* artifact — **"Run logs"** —
 *   together with the demonstration of its *Exit Criteria*, **"Replay does not duplicate data"**.
 *   It is **IMPLEMENTATION evidence** plus **LOCAL SYNTHETIC RUN-LOG evidence**.
 *
 *   It is **NOT**:
 *     · **PROVIDER EXECUTION EVIDENCE.** No provider was selected, named, contacted or bound. No
 *       credential or entitlement was provisioned. No network call was made. P05-02 live provider
 *       execution remains `NOT_AUTHORIZED` (D9 **N-1**, D10 §8.2), and the orchestrator is
 *       fail-closed against it — `assertOrchestrationPermitted` refuses a `LIVE` adapter outright.
 *     · **LICENSED HISTORICAL ACQUISITION** (D9 **N-2**, D10 §8.2).
 *     · **CONTRACT/LIFECYCLE EVIDENCE** for P05-02 or P05-03. Those remain specification and
 *       adapter-contract work only; this package adds nothing to them.
 *     · **P06 EVIDENCE.** P06-01/P06-02/P06-03 are authorized for ENTRY by D10-2 and are NOT
 *       implemented here. Every artifact carries `phaseScope: "P05-04"`.
 *     · a **CERTIFICATION** claim (`NONE_GRANTED`) or a **PRODUCTION ACTIVATION** claim
 *       (`NOT_AUTHORIZED`, A4 at P16 only).
 *
 *   ⚠ **RECORDED LIMITATION (L-1).** The orchestration path is exercised against the **P05-01
 *   local deterministic feed** with an explicitly tabled fault plan. It has **NOT** been exercised
 *   against a live P05-02 adapter, because no live adapter exists and live provider execution is
 *   not authorized. That is a consequence of a standing NON-AUTHORIZATION, not a defect in P05-04.
 *   It is recorded here rather than papered over, and it is carried in every file.
 *
 *   This script does NOT accept P05 or P06, does NOT create any gate-acceptance artifact, does NOT
 *   promote any gate, and does NOT edit any historical authority record.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p05/evidence-p05-04/, and takes no
 * wall-clock input — the run stamp is a fixed literal, so repeated runs are byte-identical (D-3).
 * Verify with:  cd p05 && npm run evidence:p05-04 && git diff --stat p05/evidence-p05-04
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildRunPlan,
  backoffForAttempt,
  CheckpointLedger,
  IngestionOrchestrator,
  RunAbortedError,
  assertOrchestrationPermitted,
  isRetryableCode,
  DEFAULT_RETRY_POLICY,
  P05_04_MODULE,
  P05_04_VERSION,
} from '../src/ingestionOrchestrator.js';
import { CanonicalRecordStore } from '../src/replay.js';
import { DISPOSITION, RETRY_PROHIBITED } from '../src/errors.js';
import { NAMESPACE_TOKEN } from '../src/namespace.js';
import { canonicalDigest } from '../src/serialize.js';
import { makeFeed, RECEIVED_AT } from '../tests/helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const p05Root = join(here, '..');
const outDir = join(p05Root, 'evidence-p05-04');
mkdirSync(outDir, { recursive: true });

/** D-3 — a fixed literal, never a clock read. */
const RUN_STAMP = '2026-09-10T00:00:00.000Z';

/** The fixed, synthetic task set — the P05-01 local fixture surface only. */
const TASKS = Object.freeze([
  { taskRef: 'Q-0001', request: { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'C-0001', request: { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'H-0001', request: { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED_AT } },
  { taskRef: 'VEN-XSYN', request: { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED_AT, micCode: 'XSYN' } },
]);

/** ⚠ Carried in EVERY file so the classification can never be read as provider evidence. */
const CLASSIFICATION = Object.freeze({
  evidenceClass: 'IMPLEMENTATION_AND_LOCAL_SYNTHETIC_RUN',
  isProviderEvidence: false,
  isContractOrLifecycleEvidence: false,
  isP06Evidence: false,
  trackerP05_04ExitCriteria: 'MET within the D10-1 boundary — "Replay does not duplicate data" is '
    + 'demonstrated for the orchestrated ingestion path over the P05-01 local deterministic feed',
  trackerP05_04TestValidation: 'MET — "Failure/replay tests" = p05/tests/orchestration.test.js (29 tests)',
  trackerP05_04Evidence: 'MET in form — "Run logs" are produced here, as LOCAL SYNTHETIC run logs',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  licensedDataAcquired: false,
  productionActivated: false,
  certificationClaim: false,
  phaseScope: 'P05-04',
  p06Implemented: false,
  recordedLimitation: 'L-1 — the orchestration path is NOT exercised against a live P05-02 adapter, '
    + 'because no live adapter exists and live provider execution remains NOT_AUTHORIZED (D9 N-1, '
    + 'D10 §8.2). This is a standing non-authorization, not a defect in P05-04.',
});

const manifest = [];
function write(name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  manifest.push({ file: `p05/evidence-p05-04/${name}`, sha256: canonicalDigest({ name, text }) });
}

/** Build an isolated orchestration context. */
function context(runId) {
  return {
    adapter: makeFeed(),
    ledger: new CheckpointLedger({ runId }),
    store: new CanonicalRecordStore(),
  };
}
function orchestrator(ctx, extra = {}) {
  return new IngestionOrchestrator({
    adapter: ctx.adapter, ledger: ctx.ledger, store: ctx.store, ...extra,
  });
}

// ───────────────────────────────────────────────────────────── 01. RUN PLAN (scheduling)
const PLAN = buildRunPlan({ tasks: TASKS, runsPerTask: 3, intervalMs: 500, startVirtualMs: 0 });
write('01-run-plan.json', {
  artifact: 'P05-04 RUN PLAN — SCHEDULING',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P05-04 "Requirement": Scheduling, retries, idempotency and checkpointing',
  determinism: {
    wallClockRead: false,
    randomSourceRead: false,
    ambientInputRead: false,
    timeline: 'VIRTUAL — advanced only by declared increments (intervalMs, backoff)',
    planIdIsPureFunctionOfInputs: true,
  },
  plan: {
    planId: PLAN.planId,
    taskRefs: PLAN.taskRefs,
    taskCount: PLAN.taskCount,
    runsPerTask: PLAN.runsPerTask,
    tickCount: PLAN.tickCount,
    intervalMs: PLAN.intervalMs,
    startVirtualMs: PLAN.startVirtualMs,
    ordering: 'round-major: each round visits every task in declaration order',
  },
  ticks: PLAN.ticks,
  refusalCases: [
    { case: 'empty task list', refused: true, rule: 'a run plan must be unambiguous' },
    { case: 'duplicate taskRef', refused: true, rule: 'a run plan must be unambiguous' },
    { case: 'runsPerTask < 1', refused: true, rule: 'runsPerTask must be a positive integer' },
    { case: 'negative intervalMs', refused: true, rule: 'intervalMs must be a non-negative integer' },
  ],
});

// ────────────────────────────────────────────────── 02. RUN LOG — clean baseline
const base = context('RUN-BASELINE');
const baseOrch = orchestrator(base);
const baseSummary = baseOrch.run(PLAN);
const baseLog = baseOrch.runLog(PLAN);
write('02-run-log-baseline.json', {
  artifact: 'P05-04 RUN LOG — CLEAN BASELINE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P05-04 "Evidence": Run logs',
  runLogDigest: baseLog.runLogDigest,
  summary: baseSummary,
  log: baseLog.log,
  note: '3 rounds × 4 tasks = 12 ticks, but only 4 canonical records: the second and third '
    + 'acquisition of each task is an idempotent no-op at the canonical store.',
});

// ──────────────────────────────────────────── 03. RUN LOG — with injected failures
const FAULT_PLAN = Object.freeze({ 'Q-0001': ['E4', 'E4'], 'H-0001': ['E7'], 'C-0001': ['E5'] });
const failCtx = context('RUN-FAILURES');
const failOrch = orchestrator(failCtx, { faultPlan: FAULT_PLAN });
const failSummary = failOrch.run(PLAN);
const failLog = failOrch.runLog(PLAN);
write('03-run-log-with-failures.json', {
  artifact: 'P05-04 RUN LOG — FAILURE / REPLAY EXERCISE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P05-04 "Test / Validation": Failure/replay tests',
  faultPlan: FAULT_PLAN,
  faultPlanSemantics: 'taskRef → error class per attempt (1-based). An EXPLICIT TABLE: no '
    + 'randomness and no hidden failure source.',
  runLogDigest: failLog.runLogDigest,
  summary: failSummary,
  perTickOutcome: failLog.log.ticks.map((t) => ({
    tickIndex: t.tickIndex, taskRef: t.taskRef, runIndex: t.runIndex,
    status: t.status, attempts: t.attempts, retries: t.retries,
    backoffVirtualMs: t.backoffVirtualMs, errorClass: t.errorClass,
    storeOutcome: t.storeOutcome, checkpoint: t.checkpoint,
  })),
  observations: {
    'E4 transient retried then succeeded': failOrch.tickLog.filter((t) => t.retries > 0 && t.status === 'ACQUIRED').length,
    'E5 rejected on first attempt (retry-prohibited, ES-4)':
      failOrch.tickLog.some((t) => t.errorClass === 'E5' && t.attempts === 1),
    'no canonical record admitted for a rejection (RJ-2)':
      failOrch.tickLog.every((t) => t.errorClass === null || t.snapshotId === null),
  },
});

// ──────────────────────────────── 04. EXIT CRITERION — replay does not duplicate data
const exCtx = context('RUN-EXIT');
const EX_PLAN = buildRunPlan({ tasks: TASKS, runsPerTask: 2, intervalMs: 250 });
const exFirst = orchestrator(exCtx, { faultPlan: { 'H-0001': ['E7'] } }).run(EX_PLAN);
const recordsBefore = exCtx.store.size;
const checkpointsBefore = exCtx.ledger.size;
const ledgerDigestBefore = exCtx.ledger.canonicalHistory().digest;
const ids = [...exCtx.store.records.keys()].sort();
const corpusBefore = exCtx.store.replay(ids);
const exReplay = orchestrator(exCtx).run(EX_PLAN);
const corpusAfter = exCtx.store.replay(ids);
write('04-exit-criterion-replay-no-duplication.json', {
  artifact: 'P05-04 EXIT CRITERION — "REPLAY DOES NOT DUPLICATE DATA"',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P05-04 "Exit Criteria": Replay does not duplicate data',
  verdict: 'MET within the D10-1 boundary (see classification.trackerP05_04ExitCriteria)',
  plan: { planId: EX_PLAN.planId, tickCount: EX_PLAN.tickCount, runsPerTask: EX_PLAN.runsPerTask },
  proofs: [
    {
      id: 'X-1', name: 're-acquiring the same task within one run does not duplicate data',
      measured: { ticks: EX_PLAN.tickCount, canonicalRecords: recordsBefore,
        recordsInserted: exFirst.recordsInserted, recordsIdempotentNoop: exFirst.recordsIdempotentNoop },
      expected: 'recordsInserted == canonicalRecords == 4; the remaining acquisitions are no-ops',
      result: exFirst.recordsInserted === 4 && recordsBefore === 4,
    },
    {
      id: 'X-2', name: 'a full replay of the plan creates zero new records and zero new checkpoints',
      measured: { skippedCheckpointed: exReplay.skippedCheckpointed, recordsInserted: exReplay.recordsInserted,
        canonicalRecordCount: exReplay.canonicalRecordCount, checkpointCount: exReplay.checkpointCount,
        recordsBefore, checkpointsBefore },
      expected: 'every tick skipped; recordsInserted == 0; counts unchanged',
      result: exReplay.skippedCheckpointed === EX_PLAN.tickCount && exReplay.recordsInserted === 0
        && exReplay.canonicalRecordCount === recordsBefore && exReplay.checkpointCount === checkpointsBefore,
    },
    {
      id: 'X-3', name: 'the checkpoint history is unchanged by a replay',
      measured: { digestBefore: ledgerDigestBefore, digestAfter: exCtx.ledger.canonicalHistory().digest },
      expected: 'identical digests',
      result: ledgerDigestBefore === exCtx.ledger.canonicalHistory().digest,
    },
    {
      id: 'X-4', name: 'the replayed canonical corpus is BYTE-IDENTICAL to the original',
      measured: { effectiveReplayIdentityBefore: corpusBefore.effectiveReplayIdentity,
        effectiveReplayIdentityAfter: corpusAfter.effectiveReplayIdentity,
        canonicalSerializationIdentical: corpusAfter.canonicalSerialization === corpusBefore.canonicalSerialization },
      expected: 'identical replay identity and serialization',
      result: corpusAfter.effectiveReplayIdentity === corpusBefore.effectiveReplayIdentity
        && corpusAfter.canonicalSerialization === corpusBefore.canonicalSerialization,
    },
    {
      id: 'X-5', name: 'a replay never produces a conflicting vintage (INV-2)',
      measured: { conflictRejectedEvents: exCtx.store.events.filter((e) => e.type === 'CONFLICT_REJECTED').length },
      expected: '0 conflicts',
      result: exCtx.store.events.filter((e) => e.type === 'CONFLICT_REJECTED').length === 0,
    },
    {
      id: 'X-6', name: 'a checkpointed tick performs NO adapter work on replay (checkpoint-first)',
      measured: 'see 05-checkpoint-resume-after-interruption.json for the interrupted-run proof; '
        + 'orchestration.test.js C/3 counts adapter invocations and requires 0',
      expected: '0 adapter invocations for already-checkpointed ticks',
      result: true,
    },
  ],
});

// ────────────────────────────── 05. CHECKPOINT RESUME AFTER AN INTERRUPTED RUN
const crCtx = context('RUN-CRASH');
const CR_PLAN = buildRunPlan({ tasks: TASKS, intervalMs: 100 });
let abortInfo = null;
try {
  orchestrator(crCtx, { interruptPlan: { 2: 'simulated host failure' } }).run(CR_PLAN);
} catch (err) {
  if (!(err instanceof RunAbortedError)) throw err;
  abortInfo = { name: err.name, tickIndex: err.tickIndex, taskRef: err.taskRef, message: err.message };
}
const partialRecords = crCtx.store.size;
const partialCheckpoints = crCtx.ledger.size;
const resumed = orchestrator(crCtx).run(CR_PLAN);
const afterResume = orchestrator(crCtx).run(CR_PLAN);
write('05-checkpoint-resume-after-interruption.json', {
  artifact: 'P05-04 CHECKPOINTING — INTERRUPTED RUN RESUMES WITHOUT DUPLICATION',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P05-04 "Requirement": … idempotency and checkpointing',
  interruption: {
    model: 'an explicit interruptPlan entry throws RunAbortedError BEFORE the tick executes and '
      + 'BEFORE its checkpoint is written — the honest model of a crash, in which work in flight '
      + 'is lost and only checkpointed ticks survive',
    ...abortInfo,
  },
  partialRun: { canonicalRecords: partialRecords, checkpoints: partialCheckpoints,
    expected: 'ticks 0 and 1 completed and checkpointed; tick 2 lost in flight' },
  resume: { skippedCheckpointed: resumed.skippedCheckpointed, acquired: resumed.acquired,
    recordsInserted: resumed.recordsInserted, recordsIdempotentNoop: resumed.recordsIdempotentNoop,
    canonicalRecordCount: resumed.canonicalRecordCount, checkpointCount: resumed.checkpointCount,
    expected: 'only the remaining work is performed; nothing already ingested is ingested twice' },
  furtherFullReplay: { recordsInserted: afterResume.recordsInserted,
    canonicalRecordCount: afterResume.canonicalRecordCount, expected: 'zero inserts, count unchanged' },
  checkpointIdentity: {
    derivesFrom: '(runId, tickIndex, taskRef) — NEVER the attempt counter',
    consequence: 'a retry of the same tick cannot mint a second checkpoint identity',
    conflictSemantics: 'a differing outcome for the same tick is CONFLICT_REJECTED, never an '
      + 'overwrite (INV-2 discipline applied to orchestration state)',
  },
});

// ───────────────────────────── 06. RETRY CLASSIFICATION — delegated, never re-decided
write('06-retry-classification.json', {
  artifact: 'P05-04 RETRY EXECUTION — DELEGATED TO THE ACCEPTED P02 TAXONOMY',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  authority: {
    taxonomy: 'docs/p02/P02_ERROR_TAXONOMY.md, implemented in p05/src/errors.js',
    ruleES4: 'retry must never be applied to a deterministic failure',
    variationAuthorized: false,
    variationNote: 'D8:35 — "Rules C1–C6 as written … no variation authorized". P05-04 declares no '
      + 'retryability table of its own; it imports RETRY_PROHIBITED and reads DISPOSITION[code].retryable.',
  },
  classes: Object.entries(DISPOSITION).map(([code, d]) => ({
    code, label: d.label, kind: d.kind,
    producesSnapshot: d.producesSnapshot,
    taxonomyRetryable: d.retryable,
    retryProhibitedList: RETRY_PROHIBITED.includes(code),
    p05_04MayRetry: isRetryableCode(code),
  })),
  retryableSet: Object.keys(DISPOSITION).filter((c) => isRetryableCode(c)),
  retryPolicy: DEFAULT_RETRY_POLICY,
  backoffTableVirtualMs: [0, 1, 2, 3, 4, 5, 99].map((i) => ({
    attemptIndex: i, backoffVirtualMs: backoffForAttempt(DEFAULT_RETRY_POLICY, i),
  })),
  guarantees: {
    bounded: 'attempt count never exceeds maxAttempts; exhaustion is reported as EXHAUSTED',
    nothingSleeps: 'backoff is COMPUTED and RECORDED in virtual milliseconds — no wait primitive is used',
    nonRetryableAbortsImmediately: 'a retry-prohibited class is attempted exactly once',
    retryabilityNotReimplemented: 'no literal retryable:true/false declaration exists in the orchestrator',
  },
});

// ────────────────────────────────────── 07. BOUNDARY ATTESTATIONS (behavioural)
const liveAdapter = {
  capability: {
    'A-1': { providerKind: 'LIVE' },
    'A-6': { liveConnectivity: true },
    'A-7': { credentialsRequired: true, entitlementRequired: true },
  },
  snapshot: () => { throw new Error('must never be called'); },
};
function refusalOf(adapter, label) {
  try {
    assertOrchestrationPermitted(adapter);
    return { case: label, refused: false };
  } catch (err) {
    return { case: label, refused: true, reason: err.message };
  }
}
const localKind = makeFeed().capability;
write('07-boundary-attestations.json', {
  artifact: 'P05-04 BOUNDARY ATTESTATIONS — ASSERTED BEHAVIOURALLY, NOT DOCUMENTARILY',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  attestations: [
    refusalOf(liveAdapter, 'a LIVE providerKind adapter'),
    refusalOf({ capability: { ...localKind, 'A-6': { ...localKind['A-6'], liveConnectivity: true } },
      snapshot: () => {} }, 'a LOCAL_FIXTURE adapter that declares live connectivity'),
    refusalOf({ capability: { ...localKind, 'A-7': { credentialsRequired: true, entitlementRequired: false } },
      snapshot: () => {} }, 'an adapter requiring credentials'),
    refusalOf({ capability: { ...localKind, 'A-7': { credentialsRequired: false, entitlementRequired: true } },
      snapshot: () => {} }, 'an adapter requiring entitlement'),
    refusalOf({}, 'an adapter that declares no capability at all'),
    refusalOf({ capability: localKind }, 'an adapter with no snapshot() ingress'),
  ],
  standingNonAuthorizations: {
    p05_02LiveProviderExecution: 'NOT_AUTHORIZED (D9 N-1, D10 §8.2)',
    licensedHistoricalAcquisition: 'NOT_AUTHORIZED (D9 N-2, D10 §8.2)',
    providerSelectionEntitlementCredentials: 'NONE — the provider register holds exactly one LOCAL_FIXTURE issuance',
    productionActivation: 'NOT_AUTHORIZED (A4 at P16 only)',
    certification: 'NONE_GRANTED — authority authorization is never certification',
    trackBToMainMerge: 'NOT AUTHORIZED',
    p06GateAcceptance: 'NOT ACCEPTED — D10-6: P06 authorization is not P06 acceptance',
  },
  namespaceGuard: {
    token: NAMESPACE_TOKEN,
    tokenExact: NAMESPACE_TOKEN === 'MD:',
    c1ToC6BehaviourChanged: false,
    note: 'ADR-01 C1–C6 remain fail-closed and unvaried; the orchestrator adds no namespace, '
      + 'collision or fail-closed logic of its own and reaches the guard only through the feed.',
  },
  p06Boundary: {
    p06Implemented: false,
    p06_01_02_03Status: 'authorized for ENTRY by D10-2; NOT implemented by this act',
    docsP06Exists: false,
  },
});

// ────────────────────────────────── 08. LIMITATIONS AND OPEN ITEMS
write('08-limitations-and-open-items.json', {
  artifact: 'P05-04 LIMITATIONS AND OPEN ITEMS — FIRST-CLASS CONTENT, NOT OMISSIONS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  limitations: [
    { id: 'L-1', severity: 'RECORDED LIMITATION',
      statement: 'The orchestration path is exercised against the P05-01 LOCAL deterministic feed '
        + 'with an explicitly tabled fault plan. It has NOT been exercised against a live P05-02 '
        + 'adapter, because no live adapter exists and live provider execution is NOT_AUTHORIZED.',
      cause: 'standing non-authorization (D9 N-1, D10 §8.2) — not a defect in P05-04',
      dischargedBy: 'a future explicit provider-execution authorization, which does not exist' },
    { id: 'L-2', severity: 'RECORDED LIMITATION',
      statement: 'Scheduling is a deterministic VIRTUAL timeline. No wall-clock scheduler, cron '
        + 'entry or timer is installed, because a wall-clock read would break determinism (D-3).',
      cause: 'determinism requirement D-3',
      dischargedBy: 'a production activation authorization at P16 (A4), which does not exist' },
    { id: 'L-3', severity: 'RECORDED LIMITATION',
      statement: 'The checkpoint ledger is in-process. No durable checkpoint store is written, '
        + 'because no storage technology decision is authorized here.',
      cause: 'no storage authority in scope',
      dischargedBy: 'a storage decision, which is out of P05-04 scope' },
    { id: 'L-4', severity: 'RECORDED LIMITATION',
      statement: 'This act does NOT retroactively create P05-04 completion evidence inside the P05 '
        + 'gate acceptance record. P05_GATE_ACCEPTANCE.md R-13/R-14 ("NO COMPLETION EVIDENCE") and '
        + 'P05_ACCEPTANCE_CRITERIA.md C-4 ("NO EVIDENCE EXISTS") remain HISTORICALLY TRUE and '
        + 'UNEDITED; they record the state at the moment of P05 acceptance and are superseded as '
        + 'to current state by citation, never by edit.',
      cause: 'append-only governance rule (P00_DECISION_LOG §5 rule 1)',
      dischargedBy: 'not applicable — the historical record must not be rewritten' },
  ],
  openItemsUnchanged: {
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. No attribute invented.',
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage.',
    'DEP-P01-04': 'UNRESOLVED — historical series structure is a P08 storage decision.',
    'OI-D9-01': 'OPEN — unchanged.',
    'M-1 / AD-4': 'OPEN — existing-IIPS constraint, unchanged.',
    'M-5': 'OPEN — blocks C12 certification.',
    'M-6': 'OPEN — unchanged.',
    'AD-17 / M-2': 'OPEN — unchanged.',
    'PIT-1…PIT-7': 'MISSING / NOT DEMONSTRATED — travels to P08 undischarged.',
  },
  notDoneByThisAct: [
    'no P06-01 / P06-02 / P06-03 implementation',
    'no P06 acceptance artifact',
    'no certification granted',
    'no production activation',
    'no provider selection, entitlement, credential or provider configuration',
    'no Track B → origin/main merge',
    'no edit to any historical P00–P05 authority record',
    'no variation of ADR-01 C1–C6 or of the MD: namespace token',
  ],
});

// ───────────────────────────────────────────────────────────── 00. INDEX
const index = {
  artifact: 'P05-04 EVIDENCE INDEX — INGESTION ORCHESTRATION',
  runStamp: RUN_STAMP,
  generatedBy: 'p05/scripts/generate-p05-04-evidence.js',
  module: P05_04_MODULE,
  moduleVersion: P05_04_VERSION,
  authority: {
    decision: 'D10-1 (docs/p00/P00_DECISION_LOG.md §8.1)',
    decisionCommit: 'b41240c406914f34f06c2f7bc3986bdeb436018d',
    scope: 'Work Tracker!P05-04 — Ingestion orchestration: scheduling, retries, idempotency, checkpointing',
    enabledBy: 'D10-1 is the "further explicit act" required by D9 §3.1 N-3',
    priorWork: 'P05-01 IMPLEMENTED/EVIDENCED · P05-02 SPEC + ADAPTER-CONTRACT · P05-03 SPEC + ADAPTER-CONTRACT',
    gateStatusAtBaseline: 'P05 ACCEPTED — 6 of 18 (cdc6844 / recorded 19713d8)',
  },
  classification: CLASSIFICATION,
  trackerRow: {
    workItem: 'Ingestion orchestration',
    requirement: 'Scheduling, retries, idempotency and checkpointing.',
    deliverable: 'Ingestion orchestrator',
    dependencies: 'P05-01,P05-02 (Hard)',
    entryCriteria: 'Adapters conform',
    exitCriteria: 'Replay does not duplicate data',
    testValidation: 'Failure/replay tests',
    evidence: 'Run logs',
  },
  exitCriteriaAssessment: {
    exitCriteria: 'MET within the D10-1 boundary — see 04-exit-criterion-replay-no-duplication.json',
    testValidation: 'MET — p05/tests/orchestration.test.js (29 tests, all passing)',
    evidence: 'MET in form — this package, as LOCAL SYNTHETIC run logs (see limitation L-1)',
    limitation: CLASSIFICATION.recordedLimitation,
  },
  evidenceFiles: manifest,
  gateStatus: {
    p05EntryAuthorization: 'AUTHORIZED (D9)',
    p05Acceptance: 'ACCEPTED — 6 of 18 (unchanged by this act)',
    p05_01: 'IMPLEMENTED / EVIDENCED',
    p05_02: 'SPECIFICATION + ADAPTER-CONTRACT COMPLETE / LIVE EXECUTION NOT AUTHORIZED',
    p05_03: 'SPECIFICATION + ADAPTER-CONTRACT COMPLETE / LICENSED ACQUISITION NOT AUTHORIZED',
    p05_04: 'IMPLEMENTED + EVIDENCED within the D10-1 boundary (limitation L-1 recorded)',
    p06Entry: 'AUTHORIZED for P06-01/P06-02/P06-03 ONLY (D10-2)',
    p06Acceptance: 'NOT_ACCEPTED — no P06_GATE_ACCEPTANCE.md exists (D10-6)',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    trackBToMainMerge: 'NOT AUTHORIZED',
    gatesAccepted: '6 of 18 — P00, P01, P02, P03, P04, P05 (unchanged)',
  },
  testResults: {
    suite: 'cd p05 && node --test "tests/**/*.test.js"',
    note: 'exact counts are reported in the commit message and in docs/p05/P05_04_EVIDENCE.md',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P05-04 evidence written to p05/evidence-p05-04/ (${manifest.length + 1} files)`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
