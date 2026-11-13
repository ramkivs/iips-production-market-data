/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: W04 — staging, IRR loader gate, installation and endpoint summary (IIP-*)
 *
 * Covers `src/identity/irr_identity_provisioning.ts` and the command line
 * `scripts/provision-irr-identity-sources.mjs`.
 *
 * TEST INPUTS. Exports are built from the tracked P04 master. Every directory is a temporary
 * directory created by the test and removed afterwards.
 *
 * WHAT THIS SUITE DOES NOT SHOW. The IRR loader is not available to this repository's tests. Where
 * a test needs "the answer the IRR loader gave", it builds a document of the same shape from the
 * staged export (`loaderAnswerFor`). That exercises this repository's decision logic only. Whether
 * IRR really accepts the files is established by `validate` against an IRR checkout, and the
 * recorded runs are in `evidence/integration/w04-identity-source-provisioning-2026-11-13/`.
 */
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  D05_AUTHENTICATED_UNIVERSE_ENTITIES,
  D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
  type SecurityMasterEntity,
} from '../src/identity/index.js';
import {
  IRR_IDENTITY_FILE_NAMES,
  buildIrrIdentitySources,
  computeSecurityMasterChecksum,
  type IrrIdentityExportResult,
} from '../src/identity/irr_identity_source_export.js';
import {
  GATE_RECEIPT_SCHEMA,
  INSTALL_RECEIPT_SCHEMA,
  LOADER_GATE_SCHEMA,
  ProvisioningError,
  STAGED_GATE_FILE,
  STAGED_INSTALL_RECEIPT_FILE,
  STAGED_REPORT_FILE,
  evaluateLoaderGate,
  identityDirOf,
  installStagedIdentity,
  readGateReceipt,
  readIdentityDirectoryDigests,
  readStagedExport,
  recordGate,
  stageExport,
  summariseIdentitiesAnswer,
  writeInstallReceipt,
  type StagedExport,
} from '../src/identity/irr_identity_provisioning.js';

const ROOT = process.cwd();
const CLI = join(ROOT, 'scripts', 'provision-irr-identity-sources.mjs');
const FILES = [IRR_IDENTITY_FILE_NAMES.roster, IRR_IDENTITY_FILE_NAMES.listingMap, IRR_IDENTITY_FILE_NAMES.corporateActions] as const;
const scratch = mkdtempSync(join(tmpdir(), 'ipd-irr-provisioning-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

let counter = 0;
function freshDir(name: string): string {
  counter += 1;
  const dir = join(scratch, `${String(counter).padStart(3, '0')}-${name}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function exportOfSlice(from: number, to: number): IrrIdentityExportResult {
  const entities: SecurityMasterEntity[] = D05_AUTHENTICATED_UNIVERSE_ENTITIES.slice(from, to);
  return buildIrrIdentitySources({
    masterEntities: entities,
    masterRevision: { ...D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION, recordCount: entities.length, fileChecksumSha256: computeSecurityMasterChecksum(entities) },
  });
}

/** A document of the shape `scripts/irr-identity-loader-gate.mts` prints when IRR accepts the files. */
function loaderAnswerFor(staged: StagedExport): Record<string, any> {
  const n = staged.report.coverage.securities.exported;
  return {
    gate: LOADER_GATE_SCHEMA,
    ran: true,
    asOf: '2026-11-13',
    files: JSON.parse(JSON.stringify(staged.digests)),
    available: true,
    issueCount: 0,
    rosterLabel: staged.report.outputs!.rosterLabel,
    rosterDataClass: 'OPERATOR_SUPPLIED',
    versions: {
      rosterVersion: `sha256:${'1'.repeat(64)}`,
      listingMapVersion: `sha256:${'2'.repeat(64)}`,
      corporateActionTableVersion: `sha256:${'3'.repeat(64)}`,
    },
    counts: { issuers: n, securities: n, listings: n, corporateActions: 0 },
    resolverSelfCheck: {
      byIsin: { observed: n, resolvedToTheSameRecord: n },
      byExchangeAndSymbol: { observed: n, resolvedToTheSameRecord: n },
    },
  };
}

const CONTEXT = { irrCommit: 'c'.repeat(40), irrWorktreeClean: true, asOf: '2026-11-13' };

/** A staging directory holding a passing export and an accepted gate record. */
function gatedStaging(name: string, from = 0, to = 5): { stagingDir: string; staged: StagedExport } {
  const stagingDir = freshDir(name);
  stageExport(stagingDir, exportOfSlice(from, to));
  const staged = readStagedExport(stagingDir);
  recordGate(staged, loaderAnswerFor(staged), CONTEXT);
  return { stagingDir, staged };
}

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof ProvisioningError, `expected a ProvisioningError, got ${String(error)}`);
    return error.code;
  }
  return 'NO_ERROR';
}

function sha(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('W04 IRR identity provisioning — staging', () => {
  it('IIP-01 stages a passing export and reads it back with the digests of the report', () => {
    const stagingDir = freshDir('stage');
    const result = exportOfSlice(0, 5);
    const outcome = stageExport(stagingDir, result);
    assert.equal(outcome.result, 'PASS');
    assert.deepEqual(readdirSync(outcome.identityDir!).sort(), [...FILES].sort());
    const staged = readStagedExport(stagingDir);
    for (const name of FILES) {
      assert.equal(staged.digests[name].sha256, result.report.outputs!.files[name].sha256);
      assert.equal(readFileSync(join(staged.identityDir, name), 'utf8'), result.artifacts!.files[name]);
    }
  });

  it('IIP-02 a run that does not pass leaves no installable file, even over an earlier passing run', () => {
    const { stagingDir } = gatedStaging('restage');
    writeFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), '{}\n');
    // The tracked master has withheld records; without acknowledgement the result is INCOMPLETE.
    const incomplete = buildIrrIdentitySources({
      masterEntities: D05_AUTHENTICATED_UNIVERSE_ENTITIES,
      masterRevision: D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
    });
    const outcome = stageExport(stagingDir, incomplete);
    assert.equal(outcome.result, 'INCOMPLETE');
    assert.equal(outcome.identityDir, null);
    assert.deepEqual(readdirSync(stagingDir), [STAGED_REPORT_FILE]);
    assert.equal(codeOf(() => readStagedExport(stagingDir)), 'STAGED_EXPORT_NOT_PASS');
    const dataDir = freshDir('data');
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir })), 'STAGED_EXPORT_NOT_PASS');
    assert.deepEqual(readdirSync(dataDir), []);
  });

  it('IIP-03 refuses a staging directory that is empty, unreadable, incomplete or altered', () => {
    assert.equal(codeOf(() => readStagedExport(freshDir('empty'))), 'STAGING_REPORT_ABSENT');

    const unreadable = freshDir('unreadable');
    writeFileSync(join(unreadable, STAGED_REPORT_FILE), '{ not json');
    assert.equal(codeOf(() => readStagedExport(unreadable)), 'STAGING_REPORT_UNREADABLE');

    const otherSchema = freshDir('schema');
    writeFileSync(join(otherSchema, STAGED_REPORT_FILE), JSON.stringify({ schemaVersion: 'OTHER', result: 'PASS' }));
    assert.equal(codeOf(() => readStagedExport(otherSchema)), 'STAGING_REPORT_UNREADABLE');

    const missing = freshDir('missing');
    stageExport(missing, exportOfSlice(0, 5));
    rmSync(join(missing, 'identity', IRR_IDENTITY_FILE_NAMES.listingMap));
    assert.equal(codeOf(() => readStagedExport(missing)), 'STAGED_FILES_ABSENT');

    const altered = freshDir('altered');
    stageExport(altered, exportOfSlice(0, 5));
    const rosterPath = join(altered, 'identity', IRR_IDENTITY_FILE_NAMES.roster);
    writeFileSync(rosterPath, readFileSync(rosterPath, 'utf8').replace('"ELIGIBLE"', '"EXCLUDED"'));
    assert.equal(codeOf(() => readStagedExport(altered)), 'STAGED_FILES_ALTERED');
  });
});

describe('W04 IRR identity provisioning — IRR loader gate decision', () => {
  const stagingDir = freshDir('gate');
  stageExport(stagingDir, exportOfSlice(0, 5));
  const staged = readStagedExport(stagingDir);

  it('IIP-10 accepts an answer that matches the staged export in every respect', () => {
    assert.deepEqual(evaluateLoaderGate(loaderAnswerFor(staged), staged), { accepted: true, failures: [] });
  });

  const refusals: ReadonlyArray<readonly [string, (answer: Record<string, any>) => void]> = [
    ['the loader did not run', (answer) => { answer.ran = false; answer.error = 'IRR_RUNNER_NOT_FOUND'; }],
    ['the loader refused the files', (answer) => { answer.available = false; answer.issueCount = 3; }],
    ['another output schema', (answer) => { answer.gate = 'OTHER'; }],
    ['the loader read other bytes', (answer) => { answer.files[IRR_IDENTITY_FILE_NAMES.roster].sha256 = 'f'.repeat(64); }],
    ['no file digests', (answer) => { delete answer.files; }],
    ['the roster classed as a synthetic fixture', (answer) => { answer.rosterDataClass = 'SYNTHETIC_FIXTURE'; }],
    ['another roster label', (answer) => { answer.rosterLabel = 'other'; }],
    ['one issuer fewer', (answer) => { answer.counts.issuers -= 1; }],
    ['one listing more', (answer) => { answer.counts.listings += 1; }],
    ['a corporate action that was not exported', (answer) => { answer.counts.corporateActions = 1; }],
    ['a count that is not a number', (answer) => { answer.counts.securities = '5'; }],
    ['one security not resolved by ISIN', (answer) => { answer.resolverSelfCheck.byIsin.resolvedToTheSameRecord -= 1; }],
    ['one listing not resolved by exchange and symbol', (answer) => { answer.resolverSelfCheck.byExchangeAndSymbol.resolvedToTheSameRecord -= 1; }],
    ['no resolver self-check', (answer) => { delete answer.resolverSelfCheck; }],
    ['a source version missing', (answer) => { delete answer.versions.listingMapVersion; }],
    ['an empty source version', (answer) => { answer.versions.rosterVersion = ''; }],
  ];
  for (const [name, change] of refusals) {
    it(`IIP-11 refuses: ${name}`, () => {
      const answer = loaderAnswerFor(staged);
      change(answer);
      const decision = evaluateLoaderGate(answer, staged);
      assert.equal(decision.accepted, false);
      assert.ok(decision.failures.length > 0);
    });
  }

  it('IIP-12 records the decision with the digests it was taken on, and removes an earlier install receipt', () => {
    const dir = freshDir('record');
    stageExport(dir, exportOfSlice(0, 5));
    const here = readStagedExport(dir);
    assert.equal(readGateReceipt(dir), null);
    writeFileSync(join(dir, STAGED_INSTALL_RECEIPT_FILE), '{}\n');
    const receipt = recordGate(here, loaderAnswerFor(here), CONTEXT);
    assert.equal(receipt.schemaVersion, GATE_RECEIPT_SCHEMA);
    assert.equal(receipt.accepted, true);
    assert.deepEqual(receipt.stagedFiles, here.digests);
    assert.deepEqual(receipt.irr, { commit: CONTEXT.irrCommit, worktreeClean: true });
    assert.deepEqual(readGateReceipt(dir), JSON.parse(JSON.stringify(receipt)));
    assert.equal(existsSync(join(dir, STAGED_INSTALL_RECEIPT_FILE)), false);

    writeFileSync(join(dir, STAGED_GATE_FILE), '{ not json');
    assert.equal(readGateReceipt(dir), null);
    writeFileSync(join(dir, STAGED_GATE_FILE), JSON.stringify({ schemaVersion: 'OTHER', accepted: true }));
    assert.equal(readGateReceipt(dir), null);
  });
});

describe('W04 IRR identity provisioning — installation', () => {
  it('IIP-20 installs into an existing data root that has no identity directory', () => {
    const { stagingDir, staged } = gatedStaging('install');
    const dataDir = freshDir('data');
    const outcome = installStagedIdentity({ stagingDir, dataDir });
    assert.equal(outcome.action, 'INSTALLED');
    assert.equal(outcome.identityDir, identityDirOf(dataDir));
    assert.equal(outcome.identityDir, join(dataDir, 'investment', 'identity'));
    assert.equal(outcome.previousFilesBackup, null);
    assert.deepEqual(readdirSync(outcome.identityDir).sort(), [...FILES].sort());
    assert.deepEqual(readIdentityDirectoryDigests(outcome.identityDir), staged.digests);
    assert.deepEqual(readdirSync(join(dataDir, 'investment')), ['identity'], 'no working directory is left behind');

    const receipt = writeInstallReceipt(stagingDir, outcome, '2026-11-13T00:00:00.000Z');
    assert.equal(receipt.schemaVersion, INSTALL_RECEIPT_SCHEMA);
    assert.equal(receipt.irrCommit, CONTEXT.irrCommit);
    assert.deepEqual(receipt.installedFiles, staged.digests);
    assert.equal(receipt.export.securities, 5);
    assert.ok(!readFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), 'utf8').includes(dataDir), 'the receipt holds no path');
  });

  it('IIP-21 keeps other content of the data root untouched', () => {
    const { stagingDir } = gatedStaging('neighbours');
    const dataDir = freshDir('data');
    mkdirSync(join(dataDir, 'investment', 'theses'), { recursive: true });
    writeFileSync(join(dataDir, 'investment', 'theses', 'kept.json'), '{"kept":true}\n');
    writeFileSync(join(dataDir, 'other.txt'), 'kept\n');
    installStagedIdentity({ stagingDir, dataDir });
    assert.equal(readFileSync(join(dataDir, 'investment', 'theses', 'kept.json'), 'utf8'), '{"kept":true}\n');
    assert.equal(readFileSync(join(dataDir, 'other.txt'), 'utf8'), 'kept\n');
    assert.deepEqual(readdirSync(join(dataDir, 'investment')).sort(), ['identity', 'theses']);
  });

  it('IIP-22 is idempotent: a second run changes nothing', () => {
    const { stagingDir } = gatedStaging('again');
    const dataDir = freshDir('data');
    installStagedIdentity({ stagingDir, dataDir });
    const second = installStagedIdentity({ stagingDir, dataDir });
    assert.equal(second.action, 'ALREADY_INSTALLED');
    assert.equal(second.previousFilesBackup, null);
    assert.deepEqual(readdirSync(stagingDir).filter((name) => name.startsWith('replaced-')), []);
  });

  it('IIP-23 does not create the data root', () => {
    const { stagingDir } = gatedStaging('no-root');
    const dataDir = join(freshDir('parent'), 'absent');
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir })), 'DATA_DIR_ABSENT');
    assert.equal(existsSync(dataDir), false);
    const file = join(freshDir('parent'), 'a-file');
    writeFileSync(file, 'x');
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir: file })), 'DATA_DIR_ABSENT');
  });

  it('IIP-24 requires an accepted gate taken on the same bytes', () => {
    const dataDir = freshDir('data');

    const notRun = freshDir('gate-not-run');
    stageExport(notRun, exportOfSlice(0, 5));
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: notRun, dataDir })), 'GATE_NOT_RUN');

    const refused = freshDir('gate-refused');
    stageExport(refused, exportOfSlice(0, 5));
    const staged = readStagedExport(refused);
    recordGate(staged, { ...loaderAnswerFor(staged), available: false, issueCount: 1 }, CONTEXT);
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: refused, dataDir })), 'GATE_REFUSED');

    // A gate record edited to say "accepted" is not believed: the decision is recomputed.
    const edited = JSON.parse(readFileSync(join(refused, STAGED_GATE_FILE), 'utf8')) as Record<string, unknown>;
    edited.accepted = true;
    edited.failures = [];
    writeFileSync(join(refused, STAGED_GATE_FILE), JSON.stringify(edited));
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: refused, dataDir })), 'GATE_REFUSED');

    // The gate was taken on one export; the staging directory now holds another.
    const stale = gatedStaging('gate-stale').stagingDir;
    const gateOfFirstExport = readFileSync(join(stale, STAGED_GATE_FILE), 'utf8');
    stageExport(stale, exportOfSlice(5, 10));
    writeFileSync(join(stale, STAGED_GATE_FILE), gateOfFirstExport);
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: stale, dataDir })), 'GATE_STALE');

    // A staged file edited after the gate.
    const tampered = gatedStaging('tampered').stagingDir;
    const path = join(tampered, 'identity', IRR_IDENTITY_FILE_NAMES.listingMap);
    writeFileSync(path, readFileSync(path, 'utf8').replace('"NSE"', '"BSE"'));
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: tampered, dataDir })), 'STAGED_FILES_ALTERED');

    assert.deepEqual(readdirSync(dataDir), [], 'no refusal wrote anything');
  });

  it('IIP-25 does not replace different existing files unless replacement is requested', () => {
    const first = gatedStaging('first', 0, 5).stagingDir;
    const second = gatedStaging('second', 5, 10);
    const dataDir = freshDir('data');
    installStagedIdentity({ stagingDir: first, dataDir });
    const target = identityDirOf(dataDir);
    const before = Object.fromEntries(FILES.map((name) => [name, sha(join(target, name))]));

    assert.equal(codeOf(() => installStagedIdentity({ stagingDir: second.stagingDir, dataDir })), 'TARGET_HAS_OTHER_FILES');
    assert.deepEqual(Object.fromEntries(FILES.map((name) => [name, sha(join(target, name))])), before, 'the existing files are untouched');
    assert.deepEqual(readdirSync(join(dataDir, 'investment')), ['identity']);

    const outcome = installStagedIdentity({ stagingDir: second.stagingDir, dataDir, replace: true });
    assert.equal(outcome.action, 'REPLACED');
    assert.deepEqual(readIdentityDirectoryDigests(target), second.staged.digests);
    assert.ok(outcome.previousFilesBackup !== null && outcome.previousFilesBackup.startsWith(second.stagingDir));
    assert.deepEqual(Object.fromEntries(FILES.map((name) => [name, sha(join(outcome.previousFilesBackup!, name))])), before, 'the previous files are kept in the staging directory');
    assert.deepEqual(readdirSync(join(dataDir, 'investment')), ['identity']);
    assert.equal(writeInstallReceipt(second.stagingDir, outcome, '2026-11-13T00:00:00.000Z').previousFilesBackedUp, true);
  });

  it('IIP-26 treats a partly populated or foreign identity directory as different files', () => {
    const { stagingDir } = gatedStaging('partial');
    const dataDir = freshDir('data');
    const target = identityDirOf(dataDir);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'notes.txt'), 'operator note\n');
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir })), 'TARGET_HAS_OTHER_FILES');
    assert.deepEqual(readdirSync(target), ['notes.txt']);

    const withSubdir = freshDir('data');
    mkdirSync(join(identityDirOf(withSubdir), 'nested'), { recursive: true });
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir: withSubdir, replace: true })), 'TARGET_HAS_UNEXPECTED_CONTENT');

    const asFile = freshDir('data');
    mkdirSync(join(asFile, 'investment'));
    writeFileSync(join(asFile, 'investment', 'identity'), 'x');
    assert.equal(codeOf(() => installStagedIdentity({ stagingDir, dataDir: asFile, replace: true })), 'TARGET_NOT_A_DIRECTORY');

    // An empty identity directory holds nothing to protect.
    const empty = freshDir('data');
    mkdirSync(identityDirOf(empty), { recursive: true });
    assert.equal(installStagedIdentity({ stagingDir, dataDir: empty }).action, 'INSTALLED');
  });

  it('IIP-27 an installation interrupted before the swap leaves the previous state exactly as it was', () => {
    const first = gatedStaging('first', 0, 5).stagingDir;
    const second = gatedStaging('second', 5, 10).stagingDir;
    const interrupt = () => { throw new Error('interrupted'); };

    // No identity directory before: none afterwards, and no working directory.
    const fresh = freshDir('data');
    assert.throws(() => installStagedIdentity({ stagingDir: first, dataDir: fresh, beforeSwap: interrupt }), /interrupted/);
    assert.deepEqual(readdirSync(join(fresh, 'investment')), []);

    // Identity files before: the same files afterwards.
    const dataDir = freshDir('data');
    installStagedIdentity({ stagingDir: first, dataDir });
    const target = identityDirOf(dataDir);
    const before = Object.fromEntries(FILES.map((name) => [name, sha(join(target, name))]));
    assert.throws(() => installStagedIdentity({ stagingDir: second, dataDir, replace: true, beforeSwap: interrupt }), /interrupted/);
    assert.deepEqual(Object.fromEntries(FILES.map((name) => [name, sha(join(target, name))])), before);
    assert.deepEqual(readdirSync(join(dataDir, 'investment')), ['identity']);
  });
});

describe('W04 IRR identity provisioning — endpoint answer reduced to counts', () => {
  const GATED = `sha256:${'1'.repeat(64)}`;
  const identity = (state: string, extra: Record<string, unknown> = {}) => ({
    symbol: 'HOLDING-SYMBOL',
    isin: 'HOLDING-ISIN',
    state,
    reason: null,
    resolutionBasis: null,
    issuerId: null,
    securityId: null,
    assessable: false,
    ...extra,
  });

  it('IIP-30 summarises an operational answer and names no holding', () => {
    const body = {
      status: 'OK',
      portfolioId: 'PORTFOLIO-IDENTIFIER',
      identities: [
        identity('RESOLVED', { resolutionBasis: 'ISIN', issuerId: 'IN:EQISIN:HOLDING-ISSUER', securityId: 'IN:ISIN:HOLDING-ISIN', assessable: true }),
        identity('UNMATCHED', { reason: 'NO_IDENTIFIER_PROVIDED' }),
        identity('UNMATCHED', { reason: 'NO_IDENTIFIER_PROVIDED' }),
        identity('AMBIGUOUS_LISTING', { reason: 'MULTIPLE_SECURITIES_SHARE_LISTING' }),
      ],
      directory: { rosterVersion: GATED, rosterDigest: GATED, rosterDataClass: 'OPERATOR_SUPPLIED' },
    };
    const summary = summariseIdentitiesAnswer(200, body, GATED);
    assert.deepEqual(summary, {
      httpStatus: 200,
      operational: true,
      error: null,
      issuesByFileAndCode: {},
      holdings: 4,
      byState: { AMBIGUOUS_LISTING: 1, RESOLVED: 1, UNMATCHED: 2 },
      byReason: { MULTIPLE_SECURITIES_SHARE_LISTING: 1, NONE: 1, NO_IDENTIFIER_PROVIDED: 2 },
      byResolutionBasis: { ISIN: 1, NONE: 3 },
      resolvedWithIssuer: 1,
      assessable: 1,
      rosterDataClass: 'OPERATOR_SUPPLIED',
      rosterVersion: GATED,
      servesTheGatedRoster: true,
    });
    const text = JSON.stringify(summary);
    for (const secret of ['HOLDING-SYMBOL', 'HOLDING-ISIN', 'HOLDING-ISSUER', 'PORTFOLIO-IDENTIFIER']) assert.ok(!text.includes(secret));
  });

  it('IIP-31 an answer from another roster is not the gated roster', () => {
    const body = { identities: [], directory: { rosterVersion: `sha256:${'9'.repeat(64)}`, rosterDataClass: 'SYNTHETIC_FIXTURE' } };
    const summary = summariseIdentitiesAnswer(200, body, GATED);
    assert.equal(summary.operational, true);
    assert.equal(summary.servesTheGatedRoster, false);
    assert.equal(summary.rosterDataClass, 'SYNTHETIC_FIXTURE');
    assert.equal(summariseIdentitiesAnswer(200, body, null).servesTheGatedRoster, null);
  });

  it('IIP-32 summarises the 503 answers by file and code', () => {
    const missing = summariseIdentitiesAnswer(
      503,
      { error: 'identity-sources-unavailable', issues: [{ file: 'eligible-roster.json', code: 'IDENTITY_SOURCE_MISSING', subject: 'a path' }] },
      GATED,
    );
    assert.equal(missing.operational, false);
    assert.equal(missing.error, 'identity-sources-unavailable');
    assert.deepEqual(missing.issuesByFileAndCode, { 'eligible-roster.json:IDENTITY_SOURCE_MISSING': 1 });
    assert.equal(missing.holdings, null);
    assert.equal(missing.servesTheGatedRoster, null);
    assert.ok(!JSON.stringify(missing).includes('a path'));

    for (const body of [null, 'text', [], { identities: 'x' }, { identities: [] }]) {
      assert.equal(summariseIdentitiesAnswer(200, body, GATED).operational, false, 'a 200 without identities and a roster version is not operational');
    }
    assert.equal(summariseIdentitiesAnswer(503, { error: 'holdings-unavailable' }, GATED).error, 'holdings-unavailable');
  });
});

describe('W04 IRR identity provisioning — command line', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

  it('IIP-40 generate fails closed until the withheld count is acknowledged exactly, then is repeatable', () => {
    const stagingDir = freshDir('cli');
    const first = run('generate', '--staging', stagingDir);
    assert.equal(first.status, 3, first.stderr);
    assert.match(first.stdout, /^RESULT: INCOMPLETE$/m);
    assert.match(first.stdout, /^identity files: none written$/m);
    assert.equal(existsSync(join(stagingDir, 'identity')), false);

    assert.equal(run('generate', '--staging', stagingDir, '--accept-withheld', '1').status, 3);
    assert.equal(existsSync(join(stagingDir, 'identity')), false);

    const pass = run('generate', '--staging', stagingDir, '--accept-withheld', '2');
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /^RESULT: PASS$/m);
    assert.match(pass.stdout, /^master records: 2390; exported: 2388; withheld: 2$/m);
    assert.match(pass.stdout, /^P04 master: 2390 records, checksum verified: true$/m);

    const other = freshDir('cli-again');
    assert.equal(run('generate', '--staging', other, '--accept-withheld', '2', '--no-p7').status, 0);
    for (const name of FILES) assert.equal(sha(join(other, 'identity', name)), sha(join(stagingDir, 'identity', name)), `${name} is the same with and without P7`);
    assert.equal(sha(join(stagingDir, 'identity', IRR_IDENTITY_FILE_NAMES.roster)), '078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937');
  });

  it('IIP-41 required ISINs are reported by count; the list is shown only on request and never stored', () => {
    const stagingDir = freshDir('cli-required');
    const listPath = join(freshDir('host-only'), 'required.txt');
    const covered = D05_AUTHENTICATED_UNIVERSE_ENTITIES[0]!.isin;
    writeFileSync(listPath, `\uFEFF# held ISINs\r\n${covered.toLowerCase()}\r\nUS0378331005  # not an Indian listing\r\n\r\n`);

    const gap = run('generate', '--staging', stagingDir, '--accept-withheld', '2', '--required-isins', listPath);
    assert.equal(gap.status, 3, gap.stderr);
    assert.match(gap.stdout, /^required ISINs: 2; covered: 1; not covered: 1$/m);
    assert.ok(!gap.stdout.includes('US0378331005'));
    assert.ok(!readFileSync(join(stagingDir, STAGED_REPORT_FILE), 'utf8').includes('US0378331005'));

    const listed = run('generate', '--staging', stagingDir, '--accept-withheld', '2', '--required-isins', listPath, '--list-uncovered');
    assert.match(listed.stdout, /^ {2}not covered: US0378331005$/m);
    assert.ok(!readFileSync(join(stagingDir, STAGED_REPORT_FILE), 'utf8').includes('US0378331005'));

    const accepted = run('generate', '--staging', stagingDir, '--accept-withheld', '2', '--required-isins', listPath, '--accept-uncovered', '1');
    assert.equal(accepted.status, 0, accepted.stderr);
    for (const name of [...FILES.map((file) => join('identity', file)), STAGED_REPORT_FILE]) {
      assert.ok(!readFileSync(join(stagingDir, name), 'utf8').includes('US0378331005'), `${name} does not hold the uncovered ISIN`);
    }
  });

  it('IIP-42 without an IRR checkout the gate fails, and nothing can be installed', () => {
    const stagingDir = freshDir('cli-gate');
    const dataDir = freshDir('cli-data');
    assert.equal(run('generate', '--staging', stagingDir, '--accept-withheld', '2').status, 0);

    const ungated = run('install', '--staging', stagingDir, '--data-dir', dataDir);
    assert.equal(ungated.status, 5);
    assert.match(ungated.stdout, /^RESULT: FAIL \(GATE_NOT_RUN\)/m);

    const gate = run('validate', '--staging', stagingDir, '--irr-root', join(dataDir, 'no-irr-checkout-here'), '--as-of', '2026-11-13');
    assert.equal(gate.status, 4, gate.stderr);
    assert.match(gate.stdout, /^RESULT: FAIL$/m);
    assert.match(gate.stdout, /IRR_RUNNER_NOT_FOUND/);
    assert.equal(readGateReceipt(stagingDir)!.accepted, false);

    const refused = run('install', '--staging', stagingDir, '--data-dir', dataDir);
    assert.equal(refused.status, 5);
    assert.match(refused.stdout, /^RESULT: FAIL \(GATE_REFUSED\)/m);
    assert.deepEqual(readdirSync(dataDir), []);
  });

  it('IIP-43 installs a gated export, reports ALREADY_INSTALLED on repetition, and keeps the first receipt', () => {
    const { stagingDir } = gatedStaging('cli-install');
    const dataDir = freshDir('cli-data');
    const first = run('install', '--staging', stagingDir, '--data-dir', dataDir);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /^RESULT: PASS \(INSTALLED\)$/m);
    const receipt = readFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), 'utf8');
    assert.equal((JSON.parse(receipt) as { action: string }).action, 'INSTALLED');

    const second = run('install', '--staging', stagingDir, '--data-dir', dataDir);
    assert.equal(second.status, 0);
    assert.match(second.stdout, /^RESULT: PASS \(ALREADY_INSTALLED\)$/m);
    assert.equal(readFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), 'utf8'), receipt);
  });

  it('IIP-44 refuses unknown options, a missing command and a non-loopback endpoint', () => {
    assert.equal(run().status, 64);
    assert.equal(run('generate').status, 64);
    assert.equal(run('generate', '--staging', freshDir('x'), '--force').status, 64);
    assert.equal(run('generate', '--staging', freshDir('x'), '--accept-withheld', 'all').status, 64);
    assert.equal(run('validate', '--staging', freshDir('x'), '--irr-root', freshDir('y'), '--as-of', 'today').status, 64);
    assert.equal(run('verify-endpoint', '--staging', freshDir('x'), '--portfolio-id', 'P', '--base-url', 'http://example.com:8787').status, 64);
    assert.equal(run('verify-endpoint', '--staging', freshDir('x'), '--portfolio-id', 'P', '--base-url', 'https://127.0.0.1:8787').status, 64);
  });

  it('IIP-45 verify-endpoint reports an unreachable server as a failure', async () => {
    const { stagingDir } = gatedStaging('cli-endpoint');
    // A loopback port that was just free: bind it, read the number, release it.
    const probe = createServer();
    await new Promise<void>((done) => probe.listen(0, '127.0.0.1', () => done()));
    const port = (probe.address() as AddressInfo).port;
    await new Promise<void>((done) => probe.close(() => done()));
    const result = run('verify-endpoint', '--staging', stagingDir, '--portfolio-id', 'P', '--base-url', `http://127.0.0.1:${String(port)}`);
    assert.equal(result.status, 6);
    assert.match(result.stdout, /^RESULT: FAIL \(ENDPOINT_UNREACHABLE\)/m);
  });
});
