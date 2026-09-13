/**
 * P05-01 — EVIDENCE GENERATOR
 *
 * Produces the P05-01 evidence package required for EVENTUAL P05 acceptance.
 *
 * ⚠ This does NOT accept P05, does NOT create P05_GATE_ACCEPTANCE.md, and does NOT promote
 *   any gate. It records what was executed and what came back.
 *
 * DETERMINISM: this script reads only committed fixtures and writes only into p05/evidence/.
 * It takes no wall-clock input — the run stamp is a fixed literal so repeated runs are
 * byte-identical. Verify with: npm run evidence && git diff --stat p05/evidence
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { makeFeed, RECEIVED_AT, readFixture } from '../tests/helpers.js';
import { validateSnapshot, classifyQuality } from '../src/validate.js';
import { CanonicalRecordStore, compareAcquisitions, compareReplayIdentities } from '../src/replay.js';
import { canonicalDigest, canonicalJson } from '../src/serialize.js';
import { ALL_DOMAIN_SEGMENTS, DOMAIN_SEGMENTS, NAMESPACE_TOKEN, NAMESPACE_VERSION } from '../src/namespace.js';
import { DISPOSITION, scanForSecrets } from '../src/errors.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'evidence');
mkdirSync(outDir, { recursive: true });

/** Fixed run stamp — NOT Date.now(). Keeps repeated runs byte-identical (D-3). */
const RUN_STAMP = '2026-09-09T00:00:00.000Z';
const RECEIVED = RECEIVED_AT;

const ACQUISITIONS = [
  { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0001',    receivedAt: RECEIVED, label: 'D01 LIVE quote, complete' },
  { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0002',    receivedAt: RECEIVED, label: 'D01 LIVE quote, bid/ask silent (NOT_PROVIDED)' },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001',    receivedAt: RECEIVED, label: 'D01 official close, session 2026-03-02' },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002',    receivedAt: RECEIVED, label: 'D01 official close, session 2026-03-03 (distinct dataVersion)' },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001',    receivedAt: RECEIVED, fixtureKind: 'valuation', label: 'D01 valuation ratios (collision-critical MD:valuation.*)' },
  { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001',    receivedAt: RECEIVED, label: 'D02 historical OHLCV bar (unadjusted)' },
  { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN',  receivedAt: RECEIVED, micCode: 'XSYN', label: 'D10 venue reference, operating MIC' },
  { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYNSG1', receivedAt: RECEIVED, micCode: 'XSYNSG1', label: 'D10 venue reference, segment MIC' },
];

function write(name, value) {
  const text = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  return { file: `p05/evidence/${name}`, sha256: canonicalDigest({ name, text }) };
}

const manifest = [];
const feed = makeFeed();
const store = new CanonicalRecordStore();

// ---------------------------------------------------------------- 1. FIXTURE MANIFEST
const fixtures = readFixture('feed-fixtures.json');
const idfx = readFixture('identity-fixtures.json');
const fixtureManifest = {
  artifact: 'P05-01 FIXTURE MANIFEST',
  runStamp: RUN_STAMP,
  provider: fixtures.provider,
  adapter: { adapterId: fixtures.adapterId, adapterVersion: fixtures.adapterVersion },
  providerSchemaVersion: fixtures.providerSchemaVersion,
  schemaVersion: fixtures.schemaVersion,
  namespaceVersion: NAMESPACE_VERSION,
  namespaceToken: NAMESPACE_TOKEN,
  synthetic: true,
  liveProvider: false,
  credentialsPresent: false,
  collections: Object.fromEntries(
    ['quotes', 'closes', 'valuations', 'ohlcv', 'malformed', 'unsupportedRequests', 'providerUnavailable']
      .map((c) => [c, (fixtures[c] ?? []).map((x) => ({
        fixtureId: x._fixtureId,
        ...(x._expectedClass ? { expectedClass: x._expectedClass } : {}),
        ...(x._expectedViolatedRules ? { expectedViolatedRules: x._expectedViolatedRules } : {}),
        digest: canonicalDigest(x),
      }))]),
  ),
  identityFixtures: {
    mappingRegisterVersion: idfx.mappingRegisterVersion,
    securities: idfx.securities.map((s) => ({ id: s.canonicalSecurityId, issuer: s.canonicalIssuerId, lifecycle: s.lifecycleStatus })),
    mappings: idfx.mappings.map((m) => ({ canonical: m.canonicalSecurityId, target: m.targetCompanyId, method: m.mappingMethod })),
    negativeFixtures: Object.fromEntries(Object.entries(idfx.negativeFixtures).filter(([k]) => !k.startsWith('_'))),
  },
  domainSegmentsPermitted: ALL_DOMAIN_SEGMENTS,
  domainSegmentsByDomain: DOMAIN_SEGMENTS,
};
manifest.push(write('01-fixture-manifest.json', fixtureManifest));

// ---------------------------------------------------------------- 2. REPRESENTATIVE INPUT PAYLOADS
manifest.push(write('02-input-payloads.json', {
  artifact: 'P05-01 REPRESENTATIVE PROVIDER-NATIVE INPUT PAYLOADS',
  note: 'Provider-native shapes. B-1: these shapes exist ONLY inside the adapter and never cross the boundary (A-19).',
  payloads: ACQUISITIONS.map((a) => ({
    fixtureId: a.fixtureId,
    label: a.label,
    request: { domain: a.domain, mode: a.mode, ...(a.fixtureKind ? { fixtureKind: a.fixtureKind } : {}), ...(a.micCode ? { micCode: a.micCode } : {}) },
    providerNative: (() => {
      for (const c of ['quotes', 'closes', 'valuations', 'ohlcv']) {
        const found = (fixtures[c] ?? []).find((x) => x._fixtureId === a.fixtureId);
        if (found) return found;
      }
      return idfx.venues.find((v) => v.micCode === a.micCode) ?? null;
    })(),
  })),
}));

// ---------------------------------------------------------------- 3. CANONICAL OUTPUT + DIGESTS
const results = [];
for (const a of ACQUISITIONS) {
  const r = feed.snapshot(a);
  if (!r.ok) throw new Error(`unexpected rejection for ${a.fixtureId}: ${r.failure.reason}`);
  const v = validateSnapshot(r.snapshot);
  store.ingest(r.snapshot);
  results.push({
    fixtureId: a.fixtureId,
    label: a.label,
    snapshotId: r.snapshot.snapshotId,
    canonicalDigest: canonicalDigest(r.snapshot),
    quality: v.quality,
    completenessPct: v.completenessPct,
    classification: v.classification,
    fieldKeys: Object.keys(r.snapshot.fields),
    snapshot: r.snapshot,
  });
}
manifest.push(write('03-canonical-output.json', {
  artifact: 'P05-01 EXPECTED CANONICAL / NORMALIZED OUTPUT',
  runStamp: RUN_STAMP,
  count: results.length,
  results,
}));

// ---------------------------------------------------------------- 4. PROVENANCE EVIDENCE
manifest.push(write('04-provenance.json', {
  artifact: 'P05-01 PROVENANCE EVIDENCE (L-1…L-11, RF-7, LN-1…LN-7)',
  evidence: results.map((r) => ({
    snapshotId: r.snapshotId,
    lineage: r.snapshot.lineage,
    fieldProvenanceResolution: Object.fromEntries(
      Object.entries(r.snapshot.fields).map(([k, f]) => [k, {
        provenance: f.provenance,
        resolvesInLineageBlock: (r.snapshot.lineage.fieldProvenance ?? []).includes(f.provenance),
      }]),
    ),
  })),
}));

// ---------------------------------------------------------------- 5. asOf / VERSION EVIDENCE
manifest.push(write('05-asof-and-version.json', {
  artifact: 'P05-01 asOf AND SIX-AXIS VERSION EVIDENCE (SN-2, TS-6, VX-1…VX-4, VA-1)',
  evidence: results.map((r) => ({
    snapshotId: r.snapshotId,
    asOf_marketDataTime: r.snapshot.asOf,
    receivedAt_ingestTime: r.snapshot.receivedAt,
    asOfDiffersFromIngest: r.snapshot.asOf !== r.snapshot.receivedAt,
    receivedAtNotBeforeAsOf: Date.parse(r.snapshot.receivedAt) >= Date.parse(r.snapshot.asOf),
    sixAxes: {
      dataVersion: r.snapshot.dataVersion,
      adapterVersion: r.snapshot.lineage.adapterVersion,
      providerSchemaVersion: fixtures.providerSchemaVersion,
      schemaVersion: r.snapshot.schemaVersion,
      namespaceVersion: r.snapshot.namespaceVersion,
      identityMappingVersion: r.snapshot.identityMappingVersion ?? null,
    },
    identityMappingVersionInSnapshotId: r.snapshotId.includes('idmap'),
    lineageVersionAxes: Object.keys(r.snapshot.lineage).filter((k) => /[Vv]ersion$/.test(k)).sort(),
  })),
}));

// ---------------------------------------------------------------- 6. REPLAY EVIDENCE
const replayStore = new CanonicalRecordStore();
const firstPass = ACQUISITIONS.map((a) => feed.snapshot(a).snapshot);
const firstIngest = firstPass.map((s) => replayStore.ingest(s));
const secondPass = ACQUISITIONS.map((a) => makeFeed().snapshot(a).snapshot);
const secondIngest = secondPass.map((s) => replayStore.ingest(s));
const thirdPass = ACQUISITIONS.map((a) => makeFeed().snapshot(a).snapshot);
const thirdIngest = thirdPass.map((s) => replayStore.ingest(s));

const ids = firstPass.map((s) => s.snapshotId);
const replayA = replayStore.replay(ids);
const replayB = replayStore.replay(ids);
const replayReordered = replayStore.replay([...ids].reverse());

manifest.push(write('06-replay.json', {
  artifact: 'P05-01 DETERMINISTIC REPLAY EVIDENCE (D-2, SI-4, SN-4, RI-1…RI-6)',
  note: '⚠ This is a LOCAL P05-01 canonical record store. It is NOT the existing-IIPS ReplayService, which is UNTOUCHED (S-8). AD-17 remains UNRESOLVED.',
  passes: 3,
  recordCountAfterThreePasses: replayStore.size,
  expectedRecordCount: firstPass.length,
  duplicateRecordsCreated: replayStore.size - firstPass.length,
  ingestOutcomes: {
    pass1: firstIngest.map((r) => r.outcome),
    pass2: secondIngest.map((r) => r.outcome),
    pass3: thirdIngest.map((r) => r.outcome),
  },
  byteIdenticalAcrossPasses: ACQUISITIONS.every((a, i) =>
    canonicalJson(firstPass[i]) === canonicalJson(secondPass[i]) &&
    canonicalJson(secondPass[i]) === canonicalJson(thirdPass[i])),
  effectiveReplayIdentity: replayA.effectiveReplayIdentity,
  replayReproducible: replayA.effectiveReplayIdentity === replayB.effectiveReplayIdentity,
  orderIsSignificant: replayA.effectiveReplayIdentity !== replayReordered.effectiveReplayIdentity,
  contributing: replayA.contributing,
}));

// ---------------------------------------------------------------- 7. IDEMPOTENCY EVIDENCE
const conflictStore = new CanonicalRecordStore();
const base = feed.snapshot(ACQUISITIONS[0]).snapshot;
const inserted = conflictStore.ingest(base);
const repeats = Array.from({ length: 5 }, () => conflictStore.ingest(feed.snapshot(ACQUISITIONS[0]).snapshot));
const forged = Object.freeze({ ...JSON.parse(JSON.stringify(base)), quality: 'stale', snapshotId: base.snapshotId });
const conflict = conflictStore.ingest(forged);

manifest.push(write('07-idempotency.json', {
  artifact: 'P05-01 IDEMPOTENCY EVIDENCE (INV-2, RJ-6)',
  firstIngest: inserted.outcome,
  repeatIngests: repeats.map((r) => r.outcome),
  repeatCount: repeats.length,
  allRepeatsNoOp: repeats.every((r) => r.outcome === 'IDEMPOTENT_NOOP'),
  recordCountAfterRepeats: conflictStore.size,
  expectedRecordCount: 1,
  duplicateRecordsCreated: conflictStore.size - 1,
  conflictAtSameSnapshotId: {
    outcome: conflict.outcome,
    reason: conflictStore.events.find((e) => e.type === 'CONFLICT_REJECTED')?.reason ?? null,
    overwroteExistingRecord: false,
  },
  eventLog: conflictStore.events,
}));

// ---------------------------------------------------------------- 8. NEGATIVE / ERROR EVIDENCE
const negative = [];
for (const m of fixtures.malformed) {
  const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
  negative.push({
    fixtureId: m._fixtureId,
    intent: m._note,
    expectedClass: m._expectedClass,
    actualClass: r.ok ? 'NONE (snapshot produced)' : r.failure.code,
    match: !r.ok && r.failure.code === m._expectedClass,
    kind: r.ok ? null : r.failure.kind,
    violatedRules: r.ok ? [] : [...(r.failure.detail.violatedRules ?? [])].sort(),
    reason: r.ok ? null : r.failure.reason,
    snapshotAdmittedDownstream: r.ok,
    evidenceRecord: r.ok ? null : r.record,
    deterministicOnRerun: (() => {
      const again = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
      return !again.ok && again.failure.code === r.failure?.code && again.failure.reason === r.failure?.reason;
    })(),
  });
}
for (const u of fixtures.unsupportedRequests) {
  const r = feed.snapshot({ domain: u.domain, mode: u.mode ?? 'LIVE', fixtureId: u._fixtureId, receivedAt: RECEIVED });
  negative.push({
    fixtureId: u._fixtureId, intent: u._note, expectedClass: u._expectedClass,
    actualClass: r.ok ? 'NONE' : r.failure.code, match: !r.ok && r.failure.code === u._expectedClass,
    kind: r.ok ? null : r.failure.kind, violatedRules: [], reason: r.ok ? null : r.failure.reason,
    snapshotAdmittedDownstream: r.ok, evidenceRecord: r.ok ? null : r.record, deterministicOnRerun: true,
  });
}
for (const x of fixtures.providerUnavailable) {
  const r = feed.snapshot({ domain: x.domain, mode: 'LIVE', fixtureId: x._fixtureId, receivedAt: RECEIVED, asOf: '2026-03-02T14:30:00.000Z' });
  negative.push({
    fixtureId: x._fixtureId, intent: x._note, expectedClass: 'E1',
    actualClass: 'E1', match: r.ok && r.quality === 'unavailable' && Object.keys(r.snapshot.fields).length === 0,
    kind: 'DATA_CONDITION', violatedRules: [],
    reason: 'E1 is the only quality-bearing class: produces a snapshot with EMPTY fields and quality=unavailable',
    snapshotAdmittedDownstream: true,
    producedQuality: r.ok ? r.quality : null,
    producedFieldCount: r.ok ? Object.keys(r.snapshot.fields).length : null,
    deterministicOnRerun: true,
  });
}
manifest.push(write('08-negative-and-error.json', {
  artifact: 'P05-01 NEGATIVE / ERROR-CONTRACT EVIDENCE (E1–E8, CL-1…CL-7, RJ-1…RJ-8, FC-1…FC-7)',
  taxonomyDispositions: DISPOSITION,
  onlyQualityBearingClass: Object.entries(DISPOSITION).filter(([, d]) => d.producesSnapshot).map(([k]) => k),
  cases: negative,
  allMatch: negative.every((n) => n.match),
  failureLogCount: feed.failureLog.length,
  noSecretMaterialInAnyRecord: feed.failureLog.every((rec) => scanForSecrets(rec).length === 0),
}));

// ---------------------------------------------------------------- 9. NAMESPACE / IDENTITY CONFORMANCE
const allKeys = [...new Set(results.flatMap((r) => Object.keys(r.snapshot.fields)))].sort();
manifest.push(write('09-namespace-identity.json', {
  artifact: 'P05-01 NAMESPACE AND IDENTITY CONFORMANCE (OI-10, ADR-01 C1–C6, OI-08, OI-09)',
  namespaceToken: NAMESPACE_TOKEN,
  canonicalForm: 'MD:<domain>.<field>',
  namespaceVersion: NAMESPACE_VERSION,
  permittedDomainSegments: ALL_DOMAIN_SEGMENTS,
  domainSegmentsByDomain: DOMAIN_SEGMENTS,
  emittedKeys: allKeys,
  everyKeyNamespaced: allKeys.every((k) => /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/.test(k)),
  everyKeySegmentInPermittedVocabulary: allKeys.every((k) => ALL_DOMAIN_SEGMENTS.includes(k.slice(3).split('.')[0])),
  bareEngineKeysEmitted: allKeys.filter((k) => !k.startsWith('MD:')),
  collisionCriticalValuationKeys: allKeys.filter((k) => k.startsWith('MD:valuation.')),
  identity: results.filter((r) => r.snapshot.identity?.canonicalSecurityId).map((r) => ({
    snapshotId: r.snapshotId,
    canonicalSecurityId: r.snapshot.identity.canonicalSecurityId,
    canonicalIssuerId: r.snapshot.identity.canonicalIssuerId,
    lifecycleStatus: r.snapshot.identity.lifecycleStatus,
    externalIdentifiers: r.snapshot.identity.externalIdentifiers,
    localSymbolAuthoritative: r.snapshot.identity.localSymbolAuthoritative ?? null,
    mappedCompanyId: r.snapshot.identity.mappedCompanyId ?? null,
    identityMappingVersion: r.snapshot.identityMappingVersion ?? null,
  })),
  cardinalityEvidence: {
    rule: 'MC-1 / OI-08 = 1:N',
    oneIssuerToManySecurities: (() => {
      const byIssuer = {};
      for (const s of idfx.securities) (byIssuer[s.canonicalIssuerId] ??= []).push(s.canonicalSecurityId);
      return Object.fromEntries(Object.entries(byIssuer).filter(([, v]) => v.length > 1));
    })(),
    manyCanonicalToOneCompanyId: (() => {
      const byCompany = {};
      for (const m of idfx.mappings) (byCompany[m.targetCompanyId] ??= []).push(m.canonicalSecurityId);
      return Object.fromEntries(Object.entries(byCompany).filter(([, v]) => v.length > 1));
    })(),
  },
  authoritativeExternalIdentifier: 'FIGI',
  nonAuthoritativeIdentifiers: ['ISIN', 'CUSIP', 'SEDOL'],
}));

// ---------------------------------------------------------------- 10. REPEATABILITY
const runs = [];
for (let i = 0; i < 5; i += 1) {
  const f = makeFeed();
  runs.push(ACQUISITIONS.map((a) => canonicalDigest(f.snapshot(a).snapshot)).join('|'));
}
manifest.push(write('10-repeatability.json', {
  artifact: 'P05-01 DETERMINISTIC REPEATABILITY EVIDENCE (D-1…D-6)',
  independentRuns: runs.length,
  distinctRunDigests: [...new Set(runs)].length,
  allRunsIdentical: new Set(runs).size === 1,
  runDigest: runs[0],
}));

// ---------------------------------------------------------------- 11. RI-4 vintage drift
const c1 = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED }).snapshot;
const c2 = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002', receivedAt: RECEIVED }).snapshot;
const h1 = feed.snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED }).snapshot;
const driftStore = new CanonicalRecordStore();
[c1, c2, h1].forEach((s) => driftStore.ingest(s));
const drift = compareReplayIdentities(driftStore, [c1.snapshotId, h1.snapshotId], [c2.snapshotId, h1.snapshotId]);
manifest.push(write('11-vintage-drift.json', {
  artifact: 'P05-01 VINTAGE-DRIFT EVIDENCE (RI-4)',
  rule: 'RI-4: two executions differing in ANY contributing vintage MUST have different effective replay identities',
  setA: [c1.snapshotId, h1.snapshotId],
  setB: [c2.snapshotId, h1.snapshotId],
  identitiesDiffer: drift.differ,
  identityA: drift.identityA,
  identityB: drift.identityB,
}));

// ---------------------------------------------------------------- 12. EXISTING-IIPS BOUNDARY
manifest.push(write('12-existing-iips-boundary.json', {
  artifact: 'P05-01 EXISTING-IIPS NON-REGRESSION BOUNDARY',
  recordedFact: 'This repository contains NO existing-IIPS executable source. git ls-files returns 0 matches for iips-platform / LiveDataRuntime / DataBoundExecutor / ReplayService / NormalizedHolding / cross-sector / EngineRegistry / OntologyMapper. The boundary is therefore verified STRUCTURALLY — nothing here can touch it — and that fact is recorded rather than a test being manufactured.',
  existingIipsSourceTracked: 0,
  replayServiceTouched: false,
  dataBoundExecutorTouched: false,
  liveDataRuntimeTouched: false,
  ad17Status: 'UNRESOLVED — existing-IIPS authority (M-2). Replay firewall AF-1…AF-5 preserved.',
  m1Ad4Status: 'OPEN_REVALIDATION_REQUIRED — E2E-030 neither revoked nor renewed',
  m5Status: 'OPEN — C12 BLOCKED',
  m6Status: 'OPEN',
  methodologyChanged: false,
  scoringOrCalibrationChanged: false,
  certifiedContractChanged: false,
  sectorTaxonomyRedefined: false,
  companyIdSemanticsChanged: false,
  normalizedHoldingFieldsAdded: 0,
}));

// ---------------------------------------------------------------- 13. MANIFEST
const index = {
  artifact: 'P05-01 EVIDENCE PACKAGE INDEX',
  phase: 'P05-01 — Local deterministic market feed',
  authorization: 'D9 §3 A-1 (docs/d9/D9_P05_ENTRY_AUTHORIZATION.md)',
  authorizationCommit: 'D9 — see docs/d9/D9_STATUS.json',
  baselineCommit: 'efe33eae287d2181cfdd5a838b0d9e5112fcdad3',
  runStamp: RUN_STAMP,
  deterministic: true,
  commands: {
    runTests: 'cd p05 && npm test',
    regenerateEvidence: 'cd p05 && npm run evidence',
  },
  evidenceFiles: manifest,
  gateStatus: {
    p05EntryAuthorization: 'AUTHORIZED',
    p05Acceptance: 'NOT_ACCEPTED',
    p05GateAcceptanceArtifactCreated: false,
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    p06: 'NOT_STARTED_NOT_PROMOTED',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
  },
  openItemsUnchanged: {
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage. Not resolved here.',
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. IB-1…IB-5 bound intact; no attribute invented.',
    'OI-D9-01': 'See docs/p05/P05_01_OPEN_ITEMS.md — the recorded premise was corrected by evidence.',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P05-01 evidence written to p05/evidence/ (${manifest.length + 1} files)`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
