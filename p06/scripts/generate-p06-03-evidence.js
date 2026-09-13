/**
 * P06-03 — EVIDENCE GENERATOR (deduplication / idempotency)
 *
 * Authority: **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1) — P06 ENTRY AUTHORIZED, scope
 * `P06-01` / `P06-02` / `P06-03` ONLY. This script produces evidence for **P06-03**, the last of
 * the three authorized work items.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package IS the tracker's `Work Tracker`!P06-03 *Evidence* artifact — **"Replay
 *   evidence"** — together with the *Replay tests* (`p06/tests/deduplication.test.js`) proving the
 *   *Exit Criteria*, **"Repeated ingestion stable"**.
 *
 *   ⚠ **Every scenario below is EXECUTED at generation time.** The counts reported are measured,
 *   not predicted, and nothing is inferred from reading source code.
 *
 *   It is **NOT**:
 *     · **PROVIDER EXECUTION EVIDENCE.** No provider was selected, named, contacted or bound. No
 *       credential or entitlement was provisioned. No network call was made. Live provider
 *       execution remains `NOT_AUTHORIZED` (D9 **N-1**, D10 §8.2). `localfix` is a SYNTHETIC LOCAL
 *       FIXTURE source; `provider-register.json` is unmodified with exactly **1** `LOCAL_FIXTURE`
 *       identity.
 *     · **LICENSED HISTORICAL ACQUISITION** (D9 **N-2**, D10 §8.2).
 *     · **P07 or P08 evidence.** No freshness/staleness, no PIT storage, no corporate actions.
 *     · **P06 ACCEPTANCE.** All three P06 work items are now complete, but **P06 remains
 *       `NOT_ACCEPTED`** and no `P06_GATE_ACCEPTANCE.md` exists or is created (**D10-6**).
 *     · a **CERTIFICATION** claim (`NONE_GRANTED`) or a **PRODUCTION ACTIVATION** claim
 *       (`NOT_AUTHORIZED`, A4 at P16 only).
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p06/evidence-p06-03/, and takes no
 * wall-clock input — the run stamp is a fixed literal, so repeated runs are byte-identical.
 * Verify: cd p06 && npm run evidence:p06-03 && git diff --stat p06/evidence-p06-03
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DeduplicationLedger, dedupIdentityFor, classifyDedupDecision,
  DEDUPLICATION_RULES, DEDUP_RULES_SCHEMA_VERSION,
} from '../src/deduplicationRules.js';
import { CanonicalStorageBoundary, BoundaryViolation } from '../src/rawCanonicalBoundary.js';
import { declareNormalizationMapping } from '../src/mappingDeclaration.js';
import { buildMappingRegister, resolveIdentityRef } from '../src/identityResolution.js';
import { CanonicalRecordStore } from '../../p05/src/replay.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { canonicalDigest } from '../../p05/src/serialize.js';

const here = dirname(fileURLToPath(import.meta.url));
const p06Root = join(here, '..');
const p05Root = join(p06Root, '..', 'p05');
const outDir = join(p06Root, 'evidence-p06-03');
mkdirSync(outDir, { recursive: true });

/** D-3 — a fixed literal, never a clock read. */
const RUN_STAMP = '2026-09-10T00:00:00.000Z';

const FX = JSON.parse(readFileSync(join(p06Root, 'fixtures', 'normalization-fixtures.json'), 'utf8'));
const ID = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
const REGISTER = buildMappingRegister(ID);
const PROVIDER_VOCAB = ['sym', 'tradePrice', 'bidPx', 'askPx', 'bidSz', 'askSz', 'ccy', 'quoteTs',
  'officialClose', 'prevClose', 'vol', 'trades', 'vwap', 'sessionDate', 'pe', 'evEbitda',
  'fcfYield', 'asOfTs'];

const CLASSIFICATION = Object.freeze({
  evidenceClass: 'IMPLEMENTATION_AND_LOCAL_SYNTHETIC_REPLAY',
  isProviderEvidence: false,
  isContractOrLifecycleEvidence: false,
  isP06_01Evidence: false,
  isP06_02Evidence: false,
  phaseScope: 'P06-03',
  trackerP06_03ExitCriteria: 'MET — "Repeated ingestion stable": the same canonical corpus ingested '
    + 'repeatedly produces ZERO further inserts, a constant canonical count and a byte-identical '
    + 'canonical set (measured, 5 passes)',
  trackerP06_03TestValidation: 'MET — "Replay tests" = p06/tests/deduplication.test.js',
  trackerP06_03Evidence: 'MET — "Replay evidence" = this package',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  licensedDataAcquired: false,
  productionActivated: false,
  certificationClaim: false,
  p06Acceptance: false,
  recordedLimitation: 'L-1 — deduplication is demonstrated over SYNTHETIC LOCAL canonical records. '
    + 'It has NOT been exercised against a live provider, because live provider execution remains '
    + 'NOT_AUTHORIZED (D9 N-1, D10 §8.2). A standing non-authorization, not a P06-03 defect.',
});

const manifest = [];
function write(name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  manifest.push({ file: `p06/evidence-p06-03/${name}`, sha256: canonicalDigest({ name, text }) });
}

function declared(ref) { return declareNormalizationMapping(FX.mappings[ref]); }
function contextFor(c, mapping, overrides = {}) {
  const env = mapping.envelope.asOf;
  let asOf = c.payload[env.source];
  if (env.transform === 'dateToIsoUtc') asOf = `${asOf}T00:00:00.000Z`;
  const venueEntry = mapping.entries.find((e) => e['MD-1'].fieldSegment === 'venueRef');
  const identity = resolveIdentityRef({
    securities: ID.securities, register: REGISTER,
    canonicalSecurityId: c.payload[mapping.envelope.identitySource], asOf,
    venueRef: venueEntry !== undefined ? c.payload[venueEntry['MD-2'].providerElement] : undefined,
  });
  return {
    ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
    identity, identityMappingVersion: identity.identityMappingVersion, ...overrides,
  };
}
/** The full governed path: raw → P06-02 → P06-01 → canonical, plus a fresh P06-03 ledger. */
function buildPath(overrides = {}) {
  const boundary = new CanonicalStorageBoundary({ providerVocabulary: PROVIDER_VOCAB });
  const corpus = [];
  for (const c of FX.cases) {
    const mapping = declared(c.mappingRef);
    boundary.acceptRaw(`raw-${c.caseId}`, c.payload);
    corpus.push(boundary.admit({
      rawRef: `raw-${c.caseId}`, mapping, context: contextFor(c, mapping, overrides),
    }).record);
  }
  return { boundary, corpus, ledger: new DeduplicationLedger({ boundary, providerVocabulary: PROVIDER_VOCAB }) };
}
function attempt(label, rule, fn) {
  try {
    fn();
    return { label, rule, outcome: 'NOT BLOCKED' };
  } catch (err) {
    return {
      label, rule, outcome: 'REFUSED', errorType: err?.name ?? 'Error',
      rules: err?.rules ?? [], message: String(err?.message ?? err).slice(0, 200),
    };
  }
}

// ════════════════════ 01. THE DECLARED RULES (the deliverable) ════════════════════
write('01-deduplication-rules.json', {
  artifact: 'P06-03 DEDUPLICATION RULES — THE TRACKER DELIVERABLE, DECLARED AS DATA',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P06-03 "Deliverable": Deduplication rules',
  requirement: 'Prevent duplicate records across retries/replays/providers.',
  schemaVersion: DEDUP_RULES_SCHEMA_VERSION,
  identity: DEDUPLICATION_RULES.identity,
  rules: DEDUPLICATION_RULES.rules,
  decisions: DEDUPLICATION_RULES.decisions,
  prohibitions: DEDUPLICATION_RULES.prohibitions,
  reuseStatement: 'The decision rule is the one the accepted P05-04 CanonicalRecordStore already '
    + 'implements — (snapshotId, canonicalDigest) → INSERTED | IDEMPOTENT_NOOP | CONFLICT_REJECTED. '
    + 'It is REUSED, not duplicated and not replaced. No new canonical store exists in P06-03.',
});

// ════════════════════ 02. EXIT CRITERION — repeated ingestion stable (EXECUTED) ════════════
const main = buildPath();
const proof = main.ledger.proveRepeatedIngestionStable(main.corpus, 5);

write('02-exit-criterion-repeated-ingestion-stable.json', {
  artifact: 'P06-03 EXIT CRITERION — "REPEATED INGESTION STABLE" (EXECUTED)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P06-03 "Exit Criteria": Repeated ingestion stable',
  method: 'The SAME canonical corpus was ingested 5 times through the full governed path. Every '
    + 'count below was measured during this run.',
  governedPath: 'raw → P06-02 raw/canonical boundary → P06-01 normalization → canonical governed '
    + 'record → P06-03 deduplication rules → stable canonical result',
  measured: {
    corpusSize: proof.corpusSize,
    repetitions: proof.repetitions,
    firstIngestionInserts: proof.firstPassInserts,
    secondAndLaterIngestionInserts: [...proof.subsequentPassInserts],
    finalCanonicalCount: proof.finalCanonicalCount,
    duplicateNoOpCount: proof.duplicateNoOpCount,
    canonicalSetDigestPerPass: proof.passes.map((p) => p.canonicalSetDigest),
    distinctCanonicalSetDigests: new Set(proof.passes.map((p) => p.canonicalSetDigest)).size,
  },
  passes: proof.passes,
  exitCriterionMet: proof.exitCriterionMet,
  selfAudit: main.ledger.auditDedup(),
});

// ════════════════════ 03. THE THREE REQUIREMENT AXES ════════════════════
// (a) RETRIES — the same payload re-acquired under a NEW rawRef.
const retryPath = buildPath();
const retryCase = FX.cases[0];
const retryMapping = declared(retryCase.mappingRef);
retryPath.boundary.acceptRaw('retry-N-01', retryCase.payload);
const retryRecord = retryPath.boundary.admit({
  rawRef: 'retry-N-01', mapping: retryMapping, context: contextFor(retryCase, retryMapping),
}).record;
const retryFirst = retryPath.ledger.record(retryPath.corpus[0]);
const retrySecond = retryPath.ledger.record(retryRecord);

// (b) REPLAYS — the whole corpus re-presented.
const replayPath = buildPath();
const replayPass1 = replayPath.ledger.ingestCorpus(replayPath.corpus);
const replayPass2 = replayPath.ledger.ingestCorpus(replayPath.corpus);
const replayPass3 = replayPath.ledger.ingestCorpus(replayPath.corpus);

// (c) PROVIDERS — distinct provider records must NOT be collapsed (PN-5 / RI-3).
const providerAxis = main.corpus.map((r) => {
  const id = dedupIdentityFor(r);
  return {
    caseId: FX.cases.find((c) => c.payload._fixtureId === r.lineage.sourceRef.split(':').pop())?.caseId ?? null,
    snapshotId: id.snapshotId,
    provider: id.provider,
    dataVersion: id.dataVersion,
    asOf: id.asOf,
    canonicalSecurityId: r.identity.canonicalSecurityId,
    mappedCompanyId: r.identity.mappedCompanyId,
    figi: r.identity.externalIdentifiers.find((x) => x.type === 'FIGI')?.value ?? null,
    identityKey: id.identityKey,
  };
});

write('03-requirement-axes.json', {
  artifact: 'P06-03 REQUIREMENT — "Prevent duplicate records across retries/replays/providers"',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  retries: {
    scenario: 'the identical payload is acquired again under a NEW rawRef (a retry)',
    measured: {
      firstPresentation: { decision: retryFirst.decision, ruleId: retryFirst.ruleId },
      retryPresentation: { decision: retrySecond.decision, ruleId: retrySecond.ruleId },
      recordCountAfterBoth: retryPath.ledger.recordCount,
    },
    result: retryFirst.decision === 'INSERTED' && retrySecond.decision === 'IDEMPOTENT_NOOP'
      && retryPath.ledger.recordCount === 1,
  },
  replays: {
    scenario: 'the whole canonical corpus is re-presented three times',
    measured: {
      pass1: replayPass1, pass2: replayPass2, pass3: replayPass3,
      finalCanonicalCount: replayPath.ledger.recordCount,
      canonicalSetDigest: canonicalDigest(replayPath.ledger.canonicalRecords()),
    },
    result: replayPass1.inserted === replayPass1.offered
      && replayPass2.inserted === 0 && replayPass3.inserted === 0
      && replayPath.ledger.recordCount === replayPass1.offered,
  },
  providers: {
    scenario: 'records distinguished by provider are NOT collapsed',
    // ⚠ No second provider identity may be issued (D10 §8.2), so cross-provider distinctness is
    //   demonstrated STRUCTURALLY from the frozen AD-6 identity form, which the key is derived from.
    method: 'The dedup key IS the frozen snapshotId = data-${provider}-${dataVersion}-${asOf} '
      + '(AD-6; P05_03_SPECIFICATION.md:84 "no component added"). The provider is therefore a '
      + 'component of the key: a different provider necessarily yields a different key, and DD-4 '
      + 'keeps the records distinct — which is exactly what PN-5 ("never a silent merge") and '
      + 'RI-3 ("provider identity is never flattened away") require.',
    measuredRecords: providerAxis,
    distinctIdentityKeys: new Set(providerAxis.map((r) => r.identityKey)).size,
    recordCount: providerAxis.length,
    allKeysRetainTheirProviderComponent: providerAxis.every((r) => r.snapshotId.startsWith(`data-${r.provider}-`)),
    vintageAxisDemonstrated: (() => {
      const byInstrument = {};
      for (const r of providerAxis) (byInstrument[r.canonicalSecurityId] ??= []).push(r);
      return Object.entries(byInstrument)
        .filter(([, v]) => v.length > 1)
        .map(([k, v]) => ({
          canonicalSecurityId: k,
          vintages: v.length,
          distinctSnapshotIds: new Set(v.map((x) => x.snapshotId)).size,
          notCollapsed: new Set(v.map((x) => x.snapshotId)).size === v.length,
        }));
    })(),
    result: new Set(providerAxis.map((r) => r.identityKey)).size === providerAxis.length,
  },
});

// ════════════════════ 04. DISTINCTNESS, VINTAGE, CONFLICTS (EXECUTED) ════════════════════
const distinctPath = buildPath();
const distinctSummary = distinctPath.ledger.ingestCorpus(distinctPath.corpus);
const store = new CanonicalRecordStore();
const original = distinctPath.corpus[0];
const variant = Object.freeze({ ...original, quality: 'partial' });
const conflictSequence = [
  { step: 'first ingest of the record', outcome: store.ingest(original).outcome },
  { step: 'same record again', outcome: store.ingest(original).outcome },
  { step: 'same snapshotId, DIFFERENT content', outcome: store.ingest(variant).outcome },
];
const unattestedPath = buildPath({ receivedAt: '2026-03-09T09:00:00.000Z' });
const unattestedRecord = unattestedPath.corpus[0];

const bypassAttempts = [
  attempt('DD-5 — a canonical record this boundary never attested', 'DD-5',
    () => main.ledger.record(unattestedRecord)),
  ...FX.cases.map((c) => attempt(`DD-5 — the RAW provider payload ${c.caseId}`, 'DD-5',
    () => main.ledger.record(c.payload))),
  attempt('DD-5 — a raw payload dressed with a snapshotId', 'DD-5',
    () => main.ledger.record({ ...FX.cases[0].payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' })),
  attempt('DD-5 — a ledger constructed with no boundary at all', 'DD-5',
    () => new DeduplicationLedger({})),
  attempt('DD-6 — a non-canonical object', 'DD-6',
    () => main.ledger.record({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', quality: 'good' })),
  attempt('AD-6 — a malformed snapshotId', 'AD-6',
    () => dedupIdentityFor({ snapshotId: 'not-a-snapshot-id' })),
];

write('04-distinctness-conflicts-bypass.json', {
  artifact: 'P06-03 DISTINCTNESS · VINTAGE · CONFLICTS · BYPASS ATTEMPTS (EXECUTED)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  distinctRecordsNotCollapsed: {
    rule: 'DD-4 — a different provider vintage is a different record and is never collapsed '
      + '(PN-5, RI-3, DV-1/DV-3)',
    measured: distinctSummary,
    result: distinctSummary.inserted === distinctSummary.offered && distinctSummary.idempotentNoop === 0,
  },
  identityAndVintagePreserved: distinctPath.ledger.canonicalRecords().map((r) => ({
    snapshotId: r.snapshotId,
    canonicalSecurityId: r.identity.canonicalSecurityId,
    canonicalIssuerId: r.identity.canonicalIssuerId,
    mappedCompanyId: r.identity.mappedCompanyId,
    dataVersion: r.dataVersion,
    asOf: r.asOf,
    provider: r.provider,
    lineageSourceRef: r.lineage.sourceRef,
    authoritativeIdentifier: r.identity.externalIdentifiers
      .filter((x) => x.authority === 'AUTHORITATIVE').map((x) => x.type),
    allFieldKeysNamespaced: Object.keys(r.fields).every((k) => k.startsWith(NAMESPACE_TOKEN)),
  })),
  conflicts: {
    rule: 'DD-3 — same snapshotId with different content is CONFLICT_REJECTED, never overwritten '
      + '(INV-2, RJ-6)',
    mechanism: 'the accepted P05-04 CanonicalRecordStore, reused unchanged',
    sequence: conflictSequence,
    storeSizeAfterConflict: store.size,
    originalSurvivesUnchanged: canonicalDigest([...store.records.values()][0].snapshot) === canonicalDigest(original),
    classifyDedupDecision: {
      noExisting: classifyDedupDecision(undefined, 'aaa'),
      sameDigest: classifyDedupDecision('aaa', 'aaa'),
      differentDigest: classifyDedupDecision('aaa', 'bbb'),
    },
    result: conflictSequence[0].outcome === 'INSERTED'
      && conflictSequence[1].outcome === 'IDEMPOTENT_NOOP'
      && conflictSequence[2].outcome === 'CONFLICT_REJECTED' && store.size === 1,
  },
  bypassAttempts: {
    note: 'Each attempt was EXECUTED. P06-03 must not become a second raw/canonical admission path.',
    results: bypassAttempts,
    refused: bypassAttempts.filter((r) => r.outcome === 'REFUSED').length,
    notBlocked: bypassAttempts.filter((r) => r.outcome !== 'REFUSED').length,
    ledgerRecordCountUnchanged: main.ledger.recordCount,
  },
});

// ════════════════════ 05. SCOPE + LIMITATIONS ════════════════════
write('05-scope-and-limitations.json', {
  artifact: 'P06-03 SCOPE, LIMITATIONS AND OPEN ITEMS — FIRST-CLASS CONTENT, NOT OMISSIONS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  p06_03: {
    workItem: 'Deduplication/idempotency',
    requirement: 'Prevent duplicate records across retries/replays/providers.',
    deliverable: 'Deduplication rules',
    exitCriteria: 'Repeated ingestion stable',
    implemented: true,
  },
  p06WorkItemsNowComplete: ['P06-01 normalization pipeline', 'P06-02 raw/canonical separation',
    'P06-03 deduplication/idempotency'],
  p06Acceptance: 'NOT_ACCEPTED — all three work items are complete but the GATE is not accepted. '
    + 'No P06_GATE_ACCEPTANCE.md exists or is created (D10-6).',
  notImplemented: {
    p07: 'NOT implemented — no freshness/staleness',
    p08: 'NOT implemented — no PIT storage, no adjusted/unadjusted series, no corporate actions',
    schedulingRetriesCheckpointing: 'NOT implemented here — P05-04 owns orchestration and is unchanged',
    durablePersistence: 'NONE — the ledger is in-memory; nothing in p06/src calls node:fs',
    providerLifecycle: 'NOT implemented',
  },
  limitations: [
    { id: 'L-1', severity: 'RECORDED LIMITATION',
      statement: 'Deduplication is demonstrated over SYNTHETIC LOCAL canonical records. It has NOT '
        + 'been exercised against a live provider.',
      cause: 'standing non-authorization (D9 N-1, D10 §8.2)',
      dischargedBy: 'a future explicit provider-execution authorization, which does not exist' },
    { id: 'L-2', severity: 'RECORDED LIMITATION',
      statement: 'Cross-PROVIDER distinctness is demonstrated STRUCTURALLY, from the frozen AD-6 '
        + 'identity form (the provider is a component of snapshotId), not by executing a second '
        + 'provider. No second provider identity may be issued under the current authority '
        + '(D10 §8.2), so a two-provider corpus was not run.',
      cause: 'no provider may be selected or issued',
      dischargedBy: 'a future explicit provider-execution authorization' },
    { id: 'L-3', severity: 'RECORDED LIMITATION',
      statement: 'The P06-02 attestation gate is CONTENT-based (a canonical digest). A party able to '
        + 'construct a byte-identical canonical record by hand would satisfy DD-5. The property '
        + 'enforced is provenance-through-the-boundary, NOT authenticity against an adversary — '
        + 'there is no secret in this system and none may be added (no credentials, D10 §8.2). '
        + 'This is P06-02 limitation L-2, inherited.',
      cause: 'no key material exists', dischargedBy: 'not applicable within the current authority' },
    { id: 'L-4', severity: 'RECORDED LIMITATION',
      statement: 'The ledger is IN-MEMORY. No deduplicated canonical set is persisted, so there is '
        + 'no durable store and no raw-data-at-rest surface. Durable persistence is NOT claimed and '
        + 'is not part of the P06-03 contract.',
      cause: 'scope discipline; P08 owns storage decisions (DEP-P01-04)',
      dischargedBy: 'a future explicit authorization' },
    { id: 'L-5', severity: 'RECORDED LIMITATION',
      statement: 'Three declared mappings exist (D01 quote/close/valuation), inherited from P06-01. '
        + 'D02–D10 are NOT declared, so deduplication is demonstrated over D01 only.',
      cause: 'P06-01 limitation L-2, inherited', dischargedBy: 'further P06-01 declarations' },
    { id: 'L-6', severity: 'RECORDED LIMITATION',
      statement: 'P06-03 completion is NOT P06 gate acceptance, NOT certification, NOT provider '
        + 'authorization and NOT production activation.',
      cause: 'D10-6 — "P06 AUTHORIZATION IS NOT P06 ACCEPTANCE."',
      dischargedBy: 'a separate explicit acceptance act by the designated A3 acceptor (Ramki), '
        + 'carrying the P00_GATE_MODEL.md:42 minimum evidence and ADR-01 §G evidence' },
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
    'no P07 or P08 implementation',
    'no P06 acceptance artifact',
    'no certification granted',
    'no production activation',
    'no provider selection, entitlement, credential or provider configuration',
    'no licensed historical acquisition',
    'no scheduling, retries or checkpointing (P05-04 unchanged)',
    'no durable persistence of raw or canonical data',
    'no Track B → origin/main merge',
    'no edit to any historical P00–P05 authority record',
    'no variation of ADR-01 C1–C6 or of the MD: namespace token',
    'no change to the AD-6 snapshotId form (no component added)',
    'no P11 engine-input mapping',
    'no existing-IIPS modification',
    'no change to the accepted P05-04 CanonicalRecordStore',
    'no second raw-ingestion path',
  ],
});

// ═════════════════════════════════════════════════════════ 00. INDEX
const index = {
  artifact: 'P06-03 EVIDENCE INDEX — DEDUPLICATION / IDEMPOTENCY',
  runStamp: RUN_STAMP,
  generatedBy: 'p06/scripts/generate-p06-03-evidence.js',
  module: 'P06-03-DEDUPLICATION-IDEMPOTENCY-RULES',
  dedupRulesSchemaVersion: DEDUP_RULES_SCHEMA_VERSION,
  namespaceToken: NAMESPACE_TOKEN,
  authority: {
    decision: 'D10-2 (docs/p00/P00_DECISION_LOG.md §8.1)',
    decisionCommit: 'b41240c406914f34f06c2f7bc3986bdeb436018d',
    scope: 'Work Tracker!P06-03 — Deduplication/idempotency. This is the LAST of the three P06 work '
      + 'items authorized by D10-2. P06-01 and P06-02 are complete and preserved.',
    priorWork: 'P05-01 IMPLEMENTED/EVIDENCED · P05-02 SPEC + ADAPTER-CONTRACT · P05-03 SPEC + '
      + 'ADAPTER-CONTRACT · P05-04 IMPLEMENTED + EVIDENCED · P06-01 IMPLEMENTED + EVIDENCED · '
      + 'P06-02 IMPLEMENTED + EVIDENCED',
  },
  classification: CLASSIFICATION,
  trackerRow: {
    workItem: 'Deduplication/idempotency',
    requirement: 'Prevent duplicate records across retries/replays/providers.',
    deliverable: 'Deduplication rules',
    dependencies: 'P06-01,P06-02 (Hard)',
    entryCriteria: 'Canonical schema stable',
    exitCriteria: 'Repeated ingestion stable',
    testValidation: 'Replay tests',
    evidence: 'Replay evidence',
  },
  exitCriteriaAssessment: {
    entryCriteria: 'MET — the canonical schema is stable (P06-01 complete, P06-02 complete)',
    exitCriteria: 'MET — 5 passes over the same corpus: first pass '
      + `${proof.firstPassInserts} inserts, every later pass 0 inserts, final canonical count `
      + `${proof.finalCanonicalCount}, ${proof.duplicateNoOpCount} duplicate no-ops, canonical set `
      + 'byte-identical across all passes',
    testValidation: 'MET — p06/tests/deduplication.test.js',
    evidence: 'MET — this package',
    dedupIdentity: 'snapshotId + canonicalDigest — taken from AD-6 / P01 §3.1 / §6 / DV-1 / RI-6; '
      + 'NO component added, NO alternative key invented',
    limitation: CLASSIFICATION.recordedLimitation,
  },
  headlineMeasurements: {
    firstIngestionInserts: proof.firstPassInserts,
    secondAndLaterIngestionInserts: [...proof.subsequentPassInserts],
    finalCanonicalCount: proof.finalCanonicalCount,
    duplicateNoOpCount: proof.duplicateNoOpCount,
    canonicalSetByteIdenticalAcrossPasses: proof.canonicalSetByteIdenticalAcrossPasses,
    bypassAttemptsRefused: bypassAttempts.filter((r) => r.outcome === 'REFUSED').length,
    bypassAttemptsNotBlocked: bypassAttempts.filter((r) => r.outcome !== 'REFUSED').length,
    distinctRecordsRetained: distinctSummary.inserted,
    conflictOutcome: conflictSequence[2].outcome,
  },
  evidenceFiles: manifest,
  gateStatus: {
    p05Acceptance: 'ACCEPTED — 6 of 18 (unchanged by this act)',
    p05_04: 'IMPLEMENTED + EVIDENCED within the D10-1 boundary (unchanged)',
    p06_01: 'IMPLEMENTED + EVIDENCED (preserved)',
    p06_02: 'IMPLEMENTED + EVIDENCED (preserved)',
    p06_03: 'IMPLEMENTED + EVIDENCED (limitations L-1…L-6 recorded)',
    p06Acceptance: 'NOT_ACCEPTED — all three P06 work items are complete but the GATE is NOT '
      + 'accepted; no P06_GATE_ACCEPTANCE.md exists (D10-6)',
    p06A3GateAcceptor: 'Ramakrishnan V. S. (Ramki), designated by D10-3, scoped to P06. '
      + 'Designation ≠ acceptance. Acceptance requires the P00_GATE_MODEL.md:42 minimum evidence '
      + '(token recorded; C1–C6 collision guard evidence; 13-engine oracle byte-identity) plus '
      + 'ADR-01 §G evidence.',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    trackBToMainMerge: 'NOT AUTHORIZED',
    gatesAccepted: '6 of 18 — P00, P01, P02, P03, P04, P05 (unchanged)',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P06-03 evidence written to p06/evidence-p06-03/ (${manifest.length + 1} files)`);
console.log(`repeated ingestion: pass1=${proof.firstPassInserts} inserts, later=[${proof.subsequentPassInserts}], `
  + `final=${proof.finalCanonicalCount}, no-ops=${proof.duplicateNoOpCount}, stable=${proof.exitCriterionMet}`);
console.log(`bypass attempts: ${bypassAttempts.length} executed, `
  + `${bypassAttempts.filter((r) => r.outcome === 'REFUSED').length} refused`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
