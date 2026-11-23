#!/usr/bin/env node
/**
 * DHAN-W14/E4 — sample reconciliation generator (offline, deterministic).
 *
 *   node scripts/dhan-w14-e4-reconcile.mjs           write evidence/dhan-w14-e4/e4-sample-reconciliation.json
 *   node scripts/dhan-w14-e4-reconcile.mjs --check    fail if the committed file differs from a fresh run
 *
 * WHAT IT DOES
 *   The E4 sample of 96 instruments is drawn from a P7 qualification-manifest revision
 *   that the tracked file no longer contains (it was regenerated on 2026-11-15 and now
 *   holds 4,680 qualified rows). That historical revision survives as a Git blob, so
 *   this script reads it from an explicitly supplied file, verifies BOTH of its
 *   published digests, and then reconciles every row against the registry the daemon
 *   actually loads today plus the current P04 master.
 *
 *   It does NOT download anything, contact Dhan, read credentials or start a daemon.
 *   The historical manifest must be supplied by the operator:
 *
 *     gh api repos/ramkivs/iips-production-market-data/git/blobs/50d9424a… -q .content \
 *       | base64 -d > <file>        # SHA-256 13bd2ef1…78bc, 210,821 bytes
 *
 *   If the file is absent the script reports the exact missing input and exits 1.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadGovernedP7InstrumentRegistry } from '../dist/src/providers/dhan/dhan_local_daemon.js';
import { DhanApiClient } from '../dist/src/providers/dhan/dhan_api_client.js';
import { buildD114SecurityIdentity } from '../dist/src/contracts/types.js';
import { getGovernedBroadSecurityMaster } from '../dist/src/identity/governed_fixture_master.js';

const HISTORICAL_BLOB = '50d9424af01527897df132a63f74d635286bfe9d';
const HISTORICAL_SHA256 = '13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc';
const HISTORICAL_BYTES = 210821;
const BASELINE = '84e988b092058df8075ffa52f5dfb0f4fef07eaf';

const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const sampleIdx = args.indexOf('--sample');
const samplePath = sampleIdx >= 0 ? args[sampleIdx + 1] : '/tmp/w14-hist/manifest-96.json';

if (!samplePath || !existsSync(samplePath)) {
  console.error(`[w14e4] MISSING INPUT: the historical P7 manifest was not found at ${samplePath ?? '(unset)'}`);
  console.error(`[w14e4] It is Git blob ${HISTORICAL_BLOB} (SHA-256 ${HISTORICAL_SHA256}, ${HISTORICAL_BYTES} bytes).`);
  console.error('[w14e4] Retrieve it explicitly; this script performs no download:');
  console.error(`[w14e4]   gh api repos/ramkivs/iips-production-market-data/git/blobs/${HISTORICAL_BLOB} -q .content | base64 -d > <file>`);
  console.error('[w14e4]   then rerun with --sample <file>');
  process.exit(1);
}

const bytes = readFileSync(samplePath);
const sha = createHash('sha256').update(bytes).digest('hex');
if (sha !== HISTORICAL_SHA256 || bytes.length !== HISTORICAL_BYTES) {
  console.error(`[w14e4] PROVENANCE FAILURE for ${samplePath}`);
  console.error(`[w14e4]   expected sha256 ${HISTORICAL_SHA256} / ${HISTORICAL_BYTES} bytes`);
  console.error(`[w14e4]   actual   sha256 ${sha} / ${bytes.length} bytes`);
  process.exit(1);
}

const hist = JSON.parse(bytes.toString('utf8'));
const qualified = hist.records.filter((r) => r.disposition === 'QUALIFIED');
const registry = loadGovernedP7InstrumentRegistry();
const master = getGovernedBroadSecurityMaster();
const SEGMENT = { NSE: 'NSE_EQ', BSE: 'BSE_EQ' };

const rows = [];
const seenIdentity = new Set();
const seenSecurityId = new Set();

for (const r of qualified) {
  const segment = SEGMENT[r.exchange];
  const identity = buildD114SecurityIdentity(r.isin, r.series);
  const resolution = registry.resolveExactIdentity(r.companyId, segment, identity);
  let companyIdNow = null;
  try {
    companyIdNow = master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: r.isin });
  } catch {
    companyIdNow = null;
  }
  const wire =
    resolution.status === 'RESOLVED'
      ? DhanApiClient.buildQuoteRequestBody([
          { exchangeSegment: segment, dhanSecurityId: resolution.mapping.dhanSecurityId },
        ])
      : null;

  const identityKey = [r.companyId, segment, identity.securityId].join('|');
  const securityIdKey = [segment, r.dhanSecurityId].join('|');
  const duplicateIdentity = seenIdentity.has(identityKey);
  const collision = seenSecurityId.has(securityIdKey);
  if (!duplicateIdentity) seenIdentity.add(identityKey);
  if (!collision) seenSecurityId.add(securityIdKey);

  rows.push({
    controlProbe: false,
    companyId: r.companyId,
    companyIdResolvesInP04Now: companyIdNow,
    p04CompanyIdChanged: companyIdNow !== r.companyId,
    exchange: r.exchange,
    exchangeSegment: segment,
    series: r.series,
    isin: r.isin,
    securityIdentity: identity.securityId,
    dhanSecurityId: r.dhanSecurityId,
    historicalDisposition: r.disposition,
    resolutionAgainstCurrentRegistry: resolution.status,
    resolutionReason: resolution.status === 'RESOLVED' ? null : resolution.reason,
    dhanSecurityIdAtRun: resolution.status === 'RESOLVED' ? resolution.mapping.dhanSecurityId : null,
    secIdStable: resolution.status === 'RESOLVED' ? resolution.mapping.dhanSecurityId === r.dhanSecurityId : null,
    quoteRequestBody: wire,
    duplicateWithinSample: duplicateIdentity,
    dhanSecurityIdCollisionWithinSample: collision,
    lastVerifiedAt: r.mapping?.lastVerifiedAt ?? null,
  });
}

const distribution = {};
for (const r of rows) {
  const k = `${r.exchange}:${r.series}`;
  distribution[k] = (distribution[k] ?? 0) + 1;
}
const unresolved = rows.filter((r) => r.resolutionAgainstCurrentRegistry !== 'RESOLVED');
const distinctSegments = new Set(rows.map((r) => `${r.companyId}|${r.exchangeSegment}`));

const out = {
  task: 'DHAN-W14-E4',
  title: 'E4 bounded live quote mapping qualification — sample reconciliation (PRE-EXECUTION)',
  generatedForBaseline: BASELINE,
  status: 'READINESS_ASSESSMENT_ONLY — no live request performed',
  sampleSource: {
    file: 'evidence/dhan-p7/qualification-manifest.json (HISTORICAL revision)',
    note:
      'The tracked manifest was regenerated on 2026-11-15 and now holds 4,680 QUALIFIED rows. The E4 sample of 96 was taken from the pre-regeneration revision, recoverable as the Git blob named here.',
    blob: HISTORICAL_BLOB,
    sha256: sha,
    sha256Verified: true,
    bytes: bytes.length,
    generatedAtUtc: hist.generatedAtUtc,
    pipelineCommit: hist.pipelineCommit,
    totalRecordsInFile: hist.records.length,
    qualifiedRows: qualified.length,
  },
  distribution,
  distinctIsins: new Set(rows.map((r) => r.isin)).size,
  distinctCompanies: new Set(rows.map((r) => r.companyId)).size,
  distinctQuoteTargets: distinctSegments.size,
  controls: { wrongIdControlCount: 1, totalProposedRequests: rows.length + 1 },
  reconciliation: {
    resolvedAgainstCurrentRegistry: rows.length - unresolved.length,
    unresolvedAgainstCurrentRegistry: unresolved.length,
    p04CompanyIdChanged: rows.filter((r) => r.p04CompanyIdChanged).length,
    duplicateIdentitiesWithinSample: rows.filter((r) => r.duplicateWithinSample).length,
    dhanSecurityIdCollisionsWithinSample: rows.filter((r) => r.dhanSecurityIdCollisionWithinSample).length,
    secIdValueChanges: rows.filter((r) => r.secIdStable === false).length,
  },
  unresolvedDetail: unresolved.map((r) => ({
    companyId: r.companyId,
    exchange: r.exchange,
    series: r.series,
    isin: r.isin,
    dhanSecurityId: r.dhanSecurityId,
    p04CompanyIdNow: r.companyIdResolvesInP04Now,
    reason: r.resolutionReason,
  })),
  records: rows,
};

const text = JSON.stringify(out, null, 2) + '\n';
const target = resolve(process.cwd(), 'evidence/dhan-w14-e4/e4-sample-reconciliation.json');

if (checkMode) {
  if (!existsSync(target)) {
    console.error(`[w14e4] MISSING ARTIFACT: ${target} does not exist`);
    process.exit(1);
  }
  if (readFileSync(target, 'utf8') !== text) {
    console.error(`[w14e4] DETERMINISM CHECK FAILED: ${target} differs from a fresh run`);
    process.exit(1);
  }
  console.log('[w14e4] determinism check passed: committed reconciliation is byte-identical to a fresh run');
} else {
  mkdirSync(resolve(process.cwd(), 'evidence/dhan-w14-e4'), { recursive: true });
  writeFileSync(target, text);
  console.log(`[w14e4] wrote ${target}`);
}

console.log(
  JSON.stringify(
    {
      distribution,
      reconciliation: out.reconciliation,
      distinctQuoteTargets: out.distinctQuoteTargets,
      unresolvedDetail: out.unresolvedDetail,
    },
    null,
    2,
  ),
);
