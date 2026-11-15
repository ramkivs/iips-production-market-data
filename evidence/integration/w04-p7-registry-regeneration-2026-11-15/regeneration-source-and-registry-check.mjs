#!/usr/bin/env node
/**
 * W04 P7 registry regeneration — evidence check, route (a). READ-ONLY, OFFLINE.
 *
 * Two facts about this checkout, each recomputed here from the tracked files:
 *
 *   1. SOURCE BLOBS. The 16 source files whose Git blob ids the W04 P7 mapping
 *      gap diagnostic pins (identity decision and registry generator) carry those
 *      same ids at this checkout's commit — nothing that decides an identity was
 *      edited for the regeneration. The ids are shown per file, both as committed
 *      (git rev-parse <commit>:<path>) and as they are on disk (the diagnostic's
 *      CRLF-as-LF Git blob id). No source file is written.
 *
 *   2. ELEVEN-MEMBERS EQUALITY. The generator re-run in memory — with its own
 *      sourceEvidence object, exactly as the gap diagnostic performs it — gives
 *      the same mappings as the committed qualification manifest, in the same
 *      order, equal in all 11 members of every mapping (companyId, isin,
 *      securityId, exchange, symbol, exchangeSegment, dhanSecurityId,
 *      mappingProvenance, instrumentType, active, lastVerifiedAt). The committed
 *      manifest is the runner's call, so this repeats the diagnostic's finding
 *      against the committed artifact.
 *
 * Also reported (information): the manifest's p04SourceRevision against the
 * compiled master's sourceRevision in the three members they share.
 *
 * Node built-ins only (node:crypto, node:fs, node:path, node:url,
 * node:child_process). No network module, no write, no registry change. The
 * compiled modules it loads are the same six-entry set the gap diagnostic
 * loads; it never loads the runner (scripts/dhan-p7-qualify.mjs) or the daemon.
 *
 * Usage: node regeneration-source-and-registry-check.mjs [--commit <ref>] [--ipd-root <dir>]
 *   --commit   ref whose committed blob ids are shown (default HEAD).
 *   --ipd-root checkout to examine (default: the repository this file sits in).
 *
 * Exit: 0 all checks pass; 1 a check failed; 2 stopped before the checks.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const USAGE = [
  'usage: node regeneration-source-and-registry-check.mjs [--commit <ref>] [--ipd-root <dir>]',
].join('\n');

function parseArguments(argv) {
  const options = { commit: 'HEAD', ipdRoot: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--commit') options.commit = argv[(i += 1)] ?? options.commit;
    else if (arg === '--ipd-root') options.ipdRoot = argv[(i += 1)] ?? options.ipdRoot;
    else {
      process.stderr.write(`unknown argument: ${arg}\n${USAGE}\n`);
      process.exit(2);
    }
  }
  return options;
}

/* ---------------------------------------------------------------- output */
const counters = { PASS: 0, FAIL: 0, WARN: 0, INFO: 0 };
const unresolved = [];
function line(level, id, text) {
  counters[level] += 1;
  process.stdout.write(`[${level}] ${id}: ${text}\n`);
}
function check(id, ok, text) {
  line(ok ? 'PASS' : 'FAIL', `${id}`, `${text}: ${ok ? 'yes' : 'no'}`);
  if (!ok) unresolved.push(`CHECK_FAILED:${id}`);
  return ok;
}
function section(title) {
  process.stdout.write(`\n== ${title}\n`);
}
class Stop extends Error {}

/* ---------------------------------------------------------------- helpers */
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const isHex64 = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
function readFileReadOnly(file) {
  const fd = openSync(file, 'r');
  try {
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}
const isFile = (file) => existsSync(file) && statSync(file).isFile();
const withoutCrlf = (bytes) => Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
/** The Git blob id of a file's content, with CRLF read as LF (a Windows checkout may convert). */
function gitBlobId(bytes) {
  const hasCrlf = bytes.includes(Buffer.from('\r\n'));
  const content = hasCrlf ? withoutCrlf(bytes) : bytes;
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

/* ---------------------------------------------------------------- SOURCE_BLOBS
 * Verbatim from the W04 P7 mapping gap diagnostic (copied from 3a656c2). Each id is the
 * reviewed blob; the second entry, where present, is the additionally accepted version. */
const SOURCE_BLOBS = Object.freeze({
  'src/identity/d05_authenticated_universe_data.ts': ['b8f0ec8da046b66768f265f649476a819de67b65'],
  'src/identity/d05_broad_universe_data.ts': ['ad097ab511b947e318f07d8ce60ea9732e1f921e'],
  'src/identity/d05_listing_corrections.ts': ['1c6b42483240e59e21fe73f8bb4a5ec26fb75774'],
  'src/identity/mapping_store.ts': ['eec60c09e08ec45a29979abf25b21efddef448ae'],
  'src/identity/quarantine.ts': ['70c6f6580f6ade66eb31e7dee3adc4b52b10b010'],
  'src/identity/security_master.ts': ['60030e0c17f8b2a31977ce598c80b18dc52d6727'],
  'src/identity/governed_fixture_master.ts': ['fbdb54b0a3c6b83a5ed3f1fc6ff21dae0121f2de'],
  'src/identity/broker_observation_resolver.ts': ['e426d3d58208e551dd7ca196740fca9cd456b974'],
  'src/contracts/types.ts': ['a644c83351b030b0e76d76642475420ea7ef07c0'],
  'src/providers/dhan/dhan_instrument_map.ts': ['32113a687ae3002f883a2c3fae9b863cec99be45'],
  'src/providers/dhan/dhan_security_identity_service.ts': ['ef18605a6b33d3347c60eeb57639e0a453f44cb3'],
  'src/providers/dhan/dhan_instrument_master_parser.ts': ['25aeb86fb9bc7a40da9c20a2572f9be4c194cfd4'],
  'src/providers/dhan/dhan_instrument_master_qualification.ts': ['08090103c6d5245989847609458029b27281f97b'],
  'src/ipc/brokerImportComposition.ts': ['b6acecd92acab211ae325b750b5780b466bfd3b2'],
  'src/ipc/brokerImportConsumer.ts': ['975db3767ecf3fe60df95da6859c54943ac22b65'],
  'src/persistence/brokerImportPersistence.ts': ['72d88d1c3d1c74c12bd3840d8d03636ae88cee14', 'bec1dc814800612d013dac81d769decc134e3926'],
});

const ENTRY_MODULES = Object.freeze({
  master: 'dist/src/identity/governed_fixture_master.js',
  parser: 'dist/src/providers/dhan/dhan_instrument_master_parser.js',
  generator: 'dist/src/providers/dhan/dhan_instrument_master_qualification.js',
});
const MANIFEST_RELATIVE = 'evidence/dhan-p7/qualification-manifest.json';
const SOURCE_RELATIVE = 'evidence/dhan-p7/source/api-scrip-master-detailed.csv';
const RETRIEVAL_RELATIVE = 'evidence/dhan-p7/source-retrieval-manifest.json';

/** The 11 members of a mapping, in the order the gap diagnostic compares them. */
const mappingText = (m) =>
  JSON.stringify([
    m.companyId, m.isin, m.securityId, m.exchange, m.symbol, m.exchangeSegment,
    m.dhanSecurityId, m.mappingProvenance, m.instrumentType, m.active, m.lastVerifiedAt,
  ]);

function committedBlobIds(root, commit, relPaths) {
  // One `git rev-parse <commit>:<path>` per file. Null when git or the path is absent.
  const ids = new Map();
  for (const rel of relPaths) {
    try {
      const out = execFileSync('git', ['rev-parse', `${commit}:${rel}`], { cwd: root, encoding: 'utf8' }).trim();
      ids.set(rel, out);
    } catch {
      ids.set(rel, null);
    }
  }
  return ids;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(options.ipdRoot ?? path.join(scriptDir, '..', '..', '..'));
  if (!isFile(path.join(root, MANIFEST_RELATIVE))) {
    throw new Stop('IPD_ROOT_NOT_FOUND');
  }
  process.stdout.write(`ipd-root: ${path.basename(root)}\ncommit: ${options.commit}\n`);

  /* ---- 1. the 16 pinned source files ---- */
  section('1. SOURCE_BLOBS: the 16 pinned source files at this commit');
  const relPaths = Object.keys(SOURCE_BLOBS);
  const committed = committedBlobIds(root, options.commit, relPaths);
  let committedEqual = 0;
  let committedMissing = 0;
  let diskEqual = 0;
  let diskMissing = 0;
  for (const rel of relPaths) {
    const accepted = SOURCE_BLOBS[rel];
    const atCommit = committed.get(rel) ?? null;
    const file = path.join(root, ...rel.split('/'));
    const onDisk = isFile(file) ? gitBlobId(readFileReadOnly(file)) : null;
    const commitOk = atCommit !== null && accepted.includes(atCommit);
    const diskOk = onDisk !== null && accepted.includes(onDisk);
    if (commitOk) committedEqual += 1;
    else if (atCommit === null) committedMissing += 1;
    if (diskOk) diskEqual += 1;
    else if (onDisk === null) diskMissing += 1;
    line(commitOk && diskOk ? 'PASS' : 'FAIL', 'source', `${rel} committed=${atCommit ?? 'MISSING'} disk=${onDisk ?? 'MISSING'} accepted=${accepted.join('|')}`);
  }
  const total = relPaths.length;
  check('sourceBlobs.atCommit', committedEqual === total, `all ${total} files carry an accepted blob id at ${options.commit} (${committedEqual} equal, ${committedMissing} missing)`);
  check('sourceBlobs.onDisk', diskEqual === total, `all ${total} files on disk carry an accepted blob id (${diskEqual} equal, ${diskMissing} missing)`);

  /* ---- 2. load the compiled generator (the gap diagnostic's entry set) ---- */
  section('2. In-memory generator re-run vs the committed manifest');
  const load = async (rel) => {
    const file = path.join(root, ...rel.split('/'));
    if (!isFile(file)) throw new Stop(`COMPILED_MODULE_NOT_FOUND:${rel}`);
    return import(pathToFileURL(file).href);
  };
  const masterModule = await load(ENTRY_MODULES.master);
  const parserModule = await load(ENTRY_MODULES.parser);
  const generatorModule = await load(ENTRY_MODULES.generator);

  const master = masterModule.getGovernedBroadSecurityMaster();
  const revision = master.sourceRevision;
  line('INFO', 'master', `compiled P04 master: batch=${revision?.batchId ?? 'NONE'} records=${revision?.recordCount ?? 'NONE'}`);

  /* Retained source, hash-verified against source-retrieval-manifest.json. */
  const retrieval = JSON.parse(readFileReadOnly(path.join(root, RETRIEVAL_RELATIVE)).toString('utf8').replace(/^\uFEFF/, ''));
  const sourceEntry = retrieval.files.find((f) => f.filename === path.basename(SOURCE_RELATIVE));
  if (!sourceEntry) throw new Stop('SOURCE_ENTRY_NOT_FOUND');
  const sourceBytes = readFileReadOnly(path.join(root, SOURCE_RELATIVE));
  const sourceSha = sha256(sourceBytes);
  if (sourceSha !== sourceEntry.sha256.toLowerCase()) throw new Stop('SOURCE_MASTER_SHA256_NOT_EXPECTED');
  line('INFO', 'source', `retained detailed master verified: sha256=${sourceSha} rows=${sourceEntry.dataRows}`);

  /* The committed manifest. */
  const manifestFile = path.join(root, MANIFEST_RELATIVE);
  const manifestBytes = readFileReadOnly(manifestFile);
  const manifestSha = sha256(manifestBytes);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new Stop('MANIFEST_NOT_JSON');
  }
  const trackedMappings = (Array.isArray(manifest.records) ? manifest.records : [])
    .filter((r) => r && r.disposition === 'QUALIFIED' && r.mapping)
    .map((r) => r.mapping);
  line('INFO', 'manifest', `committed manifest sha256=${manifestSha} qualified records=${trackedMappings.length} pipelineCommit=${manifest.pipelineCommit ?? 'NONE'}`);

  /* The manifest on disk must be the committed one (clean tree), when git can say. */
  const manifestBlobCommit = committedBlobIds(root, options.commit, [MANIFEST_RELATIVE]).get(MANIFEST_RELATIVE);
  const manifestBlobDisk = gitBlobId(manifestBytes);
  if (manifestBlobCommit !== null) {
    check('manifest.committed', manifestBlobCommit === manifestBlobDisk, `the manifest examined is the one committed at ${options.commit}`);
  } else {
    line('WARN', 'manifest.committed', 'git could not read the manifest at this commit; the disk file was examined');
  }

  /* Re-run A: the diagnostic's own sourceEvidence object, in memory. */
  const parsed = parserModule.parseInstrumentMasterCsv(sourceBytes.toString('utf8'), parserModule.DETAILED_REQUIRED_COLUMNS);
  if (parsed.schemaError) throw new Stop('SOURCE_MASTER_SCHEMA_ERROR');
  const sourceEvidence = {
    url: 'RETAINED_SNAPSHOT',
    retrievedAtUtc: sourceEntry.retrievedAtUtc,
    httpStatus: 200,
    contentType: 'text/csv',
    contentLength: 0,
    rawSha256: '',
    byteSize: 0,
    ok: true,
  };
  const rerun = generatorModule.qualifyInstrumentMaster(parsed, master, sourceEvidence);
  const rerunText = rerun.registry.list().map(mappingText);
  const trackedText = trackedMappings.map(mappingText);

  check('rerun.count', rerun.manifest.qualified === trackedMappings.length, `the in-memory re-run and the committed manifest give the same number of mappings (${rerun.manifest.qualified} vs ${trackedMappings.length})`);
  let equalInAllMembers = rerunText.length === trackedText.length;
  let firstDivergence = null;
  if (equalInAllMembers) {
    for (let i = 0; i < rerunText.length; i += 1) {
      if (rerunText[i] !== trackedText[i]) {
        equalInAllMembers = false;
        firstDivergence = i;
        break;
      }
    }
  }
  check('rerun.elevenMembers', equalInAllMembers, `every mapping is equal in all 11 members, in the same order${firstDivergence === null ? '' : ` (first divergence at index ${firstDivergence})`}`);
  const coverage = Object.entries(rerun.manifest.coverageByExchangeSeries)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
  line('INFO', 'rerun.coverage', `exchange:series: ${coverage}`);
  line('INFO', 'rerun.counts', JSON.stringify(rerun.manifest.counts));

  /* Information: the manifest's recorded P04 revision vs the compiled master. */
  const recorded = manifest.p04SourceRevision;
  if (!recorded) {
    line('WARN', 'p04SourceRevision', 'the committed manifest records no p04SourceRevision');
  } else {
    const three = recorded.batchId === revision?.batchId
      && recorded.fileChecksumSha256 === revision?.fileChecksumSha256
      && recorded.recordCount === revision?.recordCount;
    line(three ? 'PASS' : 'FAIL', 'p04SourceRevision', `the manifest's recorded revision equals the compiled master's, in batchId, fileChecksumSha256 and recordCount: ${three ? 'yes' : 'no'}`);
    if (!three) unresolved.push('CHECK_FAILED:p04SourceRevision');
  }

  /* ---- verdict ---- */
  section('Result');
  const failed = unresolved.length > 0;
  process.stdout.write(`counts: PASS ${counters.PASS} FAIL ${counters.FAIL} WARN ${counters.WARN} INFO ${counters.INFO}\n`);
  process.stdout.write(`RESULT: ${failed ? `ANALYSED_WITH_FAILED_CHECKS (${unresolved.join('; ')})` : 'ANALYSED'}\n`);
  return failed ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    if (error instanceof Stop) {
      process.stdout.write(`[STOP] ${error.message}\nRESULT: INCONCLUSIVE\n`);
      process.exit(2);
    }
    process.stdout.write(`[STOP] ${error instanceof Error ? error.message : String(error)}\nRESULT: INCONCLUSIVE\n`);
    process.exit(2);
  });
