#!/usr/bin/env node
/**
 * W04 — provision the IRR identity sources from the governed P04 security master.
 *
 *   node scripts/provision-irr-identity-sources.mjs generate --staging <dir>
 *        [--p7 <manifest.json> | --no-p7] [--issuer-key-supplement <file.json>]
 *        [--required-isins <file.txt>] [--accept-withheld <n>] [--accept-uncovered <n>]
 *        [--list-uncovered]
 *   node scripts/provision-irr-identity-sources.mjs validate --staging <dir> --irr-root <IRR checkout>
 *        [--as-of YYYY-MM-DD]
 *   node scripts/provision-irr-identity-sources.mjs install  --staging <dir> --data-dir <IIPS_DATA_DIR>
 *        [--replace]
 *   node scripts/provision-irr-identity-sources.mjs verify-endpoint --staging <dir> --portfolio-id <id>
 *        [--base-url http://127.0.0.1:8787]
 *
 * generate         Builds eligible-roster.json, listing-map.json and corporate-actions.json in
 *                  <staging>/identity and a provisioning report in <staging>. Deterministic: the
 *                  same inputs give the same bytes. Writes nothing outside <staging>.
 * validate         Runs IRR's own loader and resolver on the staged files, using the TypeScript
 *                  runner of the IRR checkout, and records the answer in <staging>.
 * install          Places the staged files in <data-dir>/investment/identity, only if the gate
 *                  accepted exactly those bytes. Never creates <data-dir>.
 * verify-endpoint  One GET of the identities route of the running IRR server. Prints counts only.
 *
 * EXIT CODES
 *   0  the step succeeded
 *   2  generate: REFUSED (an input failed its integrity check)
 *   3  generate: INCOMPLETE (withheld records or uncovered ISINs were not acknowledged)
 *   4  validate: the IRR loader gate did not accept the staged files, or could not be run
 *   5  install: refused or failed
 *   6  verify-endpoint: the endpoint is not operational or does not serve the gated roster
 *   64 the invocation was invalid
 *
 * The compiled modules under dist/ are used, as by the other scripts in this directory. Run
 * `npm run build:tsc` first. A build older than its source is refused.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXIT = Object.freeze({ OK: 0, REFUSED: 2, INCOMPLETE: 3, GATE: 4, INSTALL: 5, ENDPOINT: 6, USAGE: 64 });
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

// A reader that stops early (for example `| Select-Object -First 5`) must not turn into a stack trace.
process.stdout.on('error', (error) => {
  if (error.code !== 'EPIPE') throw error;
});

function say(text = '') {
  process.stdout.write(`${text}\n`);
}

function usage(message) {
  process.stderr.write(`${message}\n`);
  process.stderr.write('usage: provision-irr-identity-sources.mjs <generate|validate|install|verify-endpoint> [options]\n');
  process.exit(EXIT.USAGE);
}

/** Options are `--name value` pairs or bare `--flag`s. Unknown options are refused. */
function parseOptions(argv, valued, flags) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (flags.includes(arg)) {
      options[arg.slice(2)] = true;
      continue;
    }
    if (valued.includes(arg)) {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) usage(`${arg} requires a value`);
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    usage(`unknown option ${arg}`);
  }
  return options;
}

function requireOption(options, name) {
  if (typeof options[name] !== 'string' || options[name].length === 0) usage(`--${name} is required`);
  return options[name];
}

function nonNegativeInteger(text, name) {
  if (text === undefined) return 0;
  if (!/^\d+$/.test(text)) usage(`--${name} must be a non-negative integer`);
  return Number(text);
}

/** Import a compiled module, refusing a missing or stale build. */
async function importBuilt(relativeSource) {
  const source = join(repoRoot, relativeSource);
  const built = join(repoRoot, 'dist', relativeSource.replace(/\.ts$/, '.js'));
  if (!existsSync(built)) {
    process.stderr.write(`not built: ${relativeSource}. Run \`npm run build:tsc\` in the IPD checkout first.\n`);
    process.exit(EXIT.USAGE);
  }
  if (existsSync(source) && statSync(source).mtimeMs > statSync(built).mtimeMs) {
    process.stderr.write(`stale build: ${relativeSource} is newer than its compiled file. Run \`npm run build:tsc\` first.\n`);
    process.exit(EXIT.USAGE);
  }
  return import(pathToFileURL(built).href);
}

function sha256OfBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readJsonFile(path, what) {
  if (!existsSync(path)) usage(`${what} not found`);
  const bytes = readFileSync(path);
  try {
    return { bytes, json: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) };
  } catch {
    return usage(`${what} is not valid JSON`);
  }
}

/* ------------------------------------------------------------------------------ generate */

async function generate(argv) {
  const options = parseOptions(
    argv,
    ['--staging', '--p7', '--issuer-key-supplement', '--required-isins', '--accept-withheld', '--accept-uncovered'],
    ['--no-p7', '--list-uncovered'],
  );
  const stagingDir = requireOption(options, 'staging');
  if (options['no-p7'] === true && options.p7 !== undefined) usage('--p7 and --no-p7 cannot be combined');

  const exporter = await importBuilt('src/identity/irr_identity_source_export.ts');
  const provisioning = await importBuilt('src/identity/irr_identity_provisioning.ts');
  const master = await importBuilt('src/identity/governed_fixture_master.ts');

  let p7 = null;
  if (options['no-p7'] !== true) {
    const p7Path = resolve(options.p7 ?? join(repoRoot, 'evidence', 'dhan-p7', 'qualification-manifest.json'));
    const { bytes, json } = readJsonFile(p7Path, 'the P7 qualification manifest');
    p7 = {
      sha256: sha256OfBytes(bytes),
      generatedAtUtc: typeof json.generatedAtUtc === 'string' ? json.generatedAtUtc : null,
      records: json.records,
    };
  }

  let issuerKeySupplement = null;
  if (options['issuer-key-supplement'] !== undefined) {
    const { bytes, json } = readJsonFile(resolve(options['issuer-key-supplement']), 'the issuer-key supplement');
    issuerKeySupplement = { ...json, sha256: sha256OfBytes(bytes) };
  }

  let requiredIsins = null;
  if (options['required-isins'] !== undefined) {
    const path = resolve(options['required-isins']);
    if (!existsSync(path)) usage('the required-ISIN list was not found');
    requiredIsins = readFileSync(path, 'utf8')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*$/, '').trim().toUpperCase())
      .filter((line) => line.length > 0);
  }

  const result = exporter.buildIrrIdentitySources({
    masterEntities: master.D05_AUTHENTICATED_UNIVERSE_ENTITIES,
    masterRevision: master.D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
    p7,
    issuerKeySupplement,
    requiredIsins,
    acceptedWithheld: nonNegativeInteger(options['accept-withheld'], 'accept-withheld'),
    acceptedUncovered: nonNegativeInteger(options['accept-uncovered'], 'accept-uncovered'),
  });
  const staged = provisioning.stageExport(stagingDir, result);
  const report = result.report;

  say(`RESULT: ${report.result}`);
  say(`mapping: ${report.mappingVersion}`);
  say(`P04 master: batch ${report.inputs.p04SecurityMaster.batchId}`);
  say(`P04 master: ${report.inputs.p04SecurityMaster.observedRecordCount} records, checksum verified: ${report.inputs.p04SecurityMaster.checksumVerified}`);
  say(`P7 manifest: ${report.inputs.p7QualificationManifest.supplied ? 'used for corroboration only' : 'not used'}`);
  say(`issuer-key supplement: ${report.inputs.issuerKeySupplement.supplied ? `${report.inputs.issuerKeySupplement.entries} entries` : 'none'}`);
  if (report.result === 'PASS') {
    say(`master records: ${report.coverage.master.records}; exported: ${report.coverage.master.exported}; withheld: ${report.coverage.master.withheld}`);
  } else {
    // Nothing is exported by a run that did not pass. The exportable number is what a passing run would export.
    say(`master records: ${report.coverage.master.records}; exportable: ${report.coverage.master.records - report.coverage.master.withheld}; withheld: ${report.coverage.master.withheld}; exported by this run: 0`);
  }
  for (const [reason, count] of Object.entries(report.coverage.master.withheldByReason)) say(`  withheld, ${reason}: ${count}`);
  if (report.result === 'PASS') {
    say(`issuers: ${report.coverage.issuers.exported} (keyed by CIN ${report.coverage.issuers.keyedByCin}, by equity ISIN ${report.coverage.issuers.keyedByEquityIsin})`);
    say(`listings: NSE ${report.coverage.listings.nse.exported} of ${report.coverage.listings.nse.inMaster}; BSE 0 of ${report.coverage.listings.bse.inMaster}`);
    say(`corporate actions: ${report.coverage.corporateActions.exported}`);
  }
  if (report.coverage.requiredIsins !== null) {
    const required = report.coverage.requiredIsins;
    say(`required ISINs: ${required.requested}; covered: ${required.covered}; not covered: ${required.uncovered}`);
    if (options['list-uncovered'] === true) {
      // Host-local display only. These values are never written to a file.
      for (const isin of result.uncoveredRequiredIsins) say(`  not covered: ${isin}`);
    }
  }
  // Withheld records are public master records, not portfolio data. The full list is in the report.
  for (const record of report.withheld.slice(0, 20)) say(`  withheld: ${record.isin} ${record.nseSymbol ?? '(no NSE symbol)'}: ${record.reasons.join(', ')}`);
  if (report.withheld.length > 20) say(`  ... and ${report.withheld.length - 20} more, listed in the report`);
  for (const refusal of report.refusals) say(`REFUSED, ${refusal.code}: ${refusal.detail}`);
  for (const item of report.incomplete) say(`INCOMPLETE, ${item.code}: ${item.detail}`);
  if (report.outputs !== null) {
    for (const [name, digest] of Object.entries(report.outputs.files)) say(`${name}: sha256 ${digest.sha256}, ${digest.bytes} bytes`);
  }
  say('limitations of this export (each is explained in the report):');
  for (const limitation of report.limitations) say(`  ${limitation.code}`);
  say(`report: ${staged.reportPath}`);
  say(staged.identityDir === null ? 'identity files: none written' : `identity files: ${staged.identityDir}`);

  if (report.result === 'INCOMPLETE') {
    say('Nothing was written. Review the counts above. To proceed with them, repeat the command and state each number exactly:');
    if (report.incomplete.some((item) => item.code === 'WITHHELD_NOT_ACKNOWLEDGED')) say(`  --accept-withheld ${report.coverage.master.withheld}`);
    if (report.incomplete.some((item) => item.code === 'REQUIRED_ISINS_NOT_COVERED')) say(`  --accept-uncovered ${report.coverage.requiredIsins?.uncovered ?? 0}`);
  }
  if (report.result === 'PASS') return EXIT.OK;
  return report.result === 'INCOMPLETE' ? EXIT.INCOMPLETE : EXIT.REFUSED;
}

/* ------------------------------------------------------------------------------ validate */

function gitFact(irrRoot, args) {
  try {
    const result = spawnSync('git', ['-C', irrRoot, ...args], { encoding: 'utf8', windowsHide: true });
    return result.status === 0 ? result.stdout : null;
  } catch {
    return null;
  }
}

async function validate(argv) {
  const options = parseOptions(argv, ['--staging', '--irr-root', '--as-of'], []);
  const stagingDir = requireOption(options, 'staging');
  const irrRoot = resolve(requireOption(options, 'irr-root'));
  const asOf = options['as-of'] ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) usage('--as-of must be YYYY-MM-DD');

  const provisioning = await importBuilt('src/identity/irr_identity_provisioning.ts');
  let staged;
  try {
    staged = provisioning.readStagedExport(stagingDir);
  } catch (error) {
    say(`RESULT: FAIL (${error.code ?? 'ERROR'}) ${error.message}`);
    return EXIT.GATE;
  }

  const frontendDir = join(irrRoot, 'frontend');
  const runner = join(frontendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const gateScript = join(repoRoot, 'scripts', 'irr-identity-loader-gate.mts');
  let output;
  if (!existsSync(runner)) {
    output = { gate: provisioning.LOADER_GATE_SCHEMA, ran: false, error: 'IRR_RUNNER_NOT_FOUND' };
  } else {
    // The IRR checkout's own TypeScript runner, started with this Node executable. No shell.
    const run = spawnSync(process.execPath, [runner, '--no-cache', gateScript, irrRoot, staged.identityDir, asOf], {
      cwd: frontendDir,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    });
    try {
      output = JSON.parse(run.stdout);
    } catch {
      output = { gate: provisioning.LOADER_GATE_SCHEMA, ran: false, error: 'IRR_GATE_OUTPUT_UNREADABLE', exitCode: run.status };
    }
  }

  const commit = gitFact(irrRoot, ['rev-parse', 'HEAD']);
  const status = gitFact(irrRoot, ['status', '--porcelain']);
  const receipt = provisioning.recordGate(staged, output, {
    irrCommit: commit === null ? null : commit.trim(),
    irrWorktreeClean: status === null ? null : status.trim().length === 0,
    asOf,
  });

  say(`RESULT: ${receipt.accepted ? 'PASS' : 'FAIL'}`);
  say(`IRR commit: ${receipt.irr.commit ?? 'not determined'}; worktree clean: ${receipt.irr.worktreeClean ?? 'not determined'}`);
  say(`as of: ${asOf}`);
  if (output.available === true) {
    say(`IRR loader: accepted the three files; roster class ${output.rosterDataClass}`);
    say(`IRR counts: issuers ${output.counts?.issuers}, securities ${output.counts?.securities}, listings ${output.counts?.listings}, corporate actions ${output.counts?.corporateActions}`);
    say(`IRR resolver, by ISIN: ${output.resolverSelfCheck?.byIsin?.resolvedToTheSameRecord} of ${output.resolverSelfCheck?.byIsin?.observed} resolved to the same record`);
    say(`IRR resolver, by exchange and symbol: ${output.resolverSelfCheck?.byExchangeAndSymbol?.resolvedToTheSameRecord} of ${output.resolverSelfCheck?.byExchangeAndSymbol?.observed} resolved to the same record`);
    say(`IRR roster version: ${output.versions?.rosterVersion}`);
    say(`IRR listing-map version: ${output.versions?.listingMapVersion}`);
    say(`IRR corporate-action table version: ${output.versions?.corporateActionTableVersion}`);
  } else if (output.ran === true) {
    say(`IRR loader: refused the files, ${output.issueCount} issues`);
    for (const [key, count] of Object.entries(output.issuesByFileAndCode ?? {})) say(`  ${key}: ${count}`);
  }
  for (const failure of receipt.failures) say(`FAIL: ${failure}`);
  say(`gate record: ${join(staged.stagingDir, provisioning.STAGED_GATE_FILE)}`);
  return receipt.accepted ? EXIT.OK : EXIT.GATE;
}

/* ------------------------------------------------------------------------------- install */

async function install(argv) {
  const options = parseOptions(argv, ['--staging', '--data-dir'], ['--replace']);
  const stagingDir = requireOption(options, 'staging');
  const dataDir = requireOption(options, 'data-dir');
  const provisioning = await importBuilt('src/identity/irr_identity_provisioning.ts');
  try {
    const outcome = provisioning.installStagedIdentity({ stagingDir, dataDir, replace: options.replace === true });
    const receiptPath = join(resolve(stagingDir), provisioning.STAGED_INSTALL_RECEIPT_FILE);
    // A repeated run that changes nothing keeps the receipt of the run that installed the files.
    if (outcome.action !== 'ALREADY_INSTALLED' || !existsSync(receiptPath)) {
      provisioning.writeInstallReceipt(stagingDir, outcome, new Date().toISOString());
    }
    say(`RESULT: PASS (${outcome.action})`);
    say(`identity directory: ${outcome.identityDir}`);
    for (const [name, digest] of Object.entries(outcome.installedFiles)) say(`${name}: sha256 ${digest.sha256}, ${digest.bytes} bytes`);
    if (outcome.previousFilesBackup !== null) say(`previous files copied to: ${outcome.previousFilesBackup}`);
    say(`receipt: ${receiptPath}`);
    say('The IRR server reads these files on every request. No restart is needed.');
    return EXIT.OK;
  } catch (error) {
    say(`RESULT: FAIL (${error.code ?? 'ERROR'}) ${error.message}`);
    return EXIT.INSTALL;
  }
}

/* ----------------------------------------------------------------------- verify-endpoint */

async function verifyEndpoint(argv) {
  const options = parseOptions(argv, ['--staging', '--portfolio-id', '--base-url'], []);
  const stagingDir = requireOption(options, 'staging');
  const portfolioId = requireOption(options, 'portfolio-id');
  let base;
  try {
    base = new URL(options['base-url'] ?? 'http://127.0.0.1:8787');
  } catch {
    return usage('--base-url is not a URL');
  }
  // The portfolio identifier is sent to the local IRR server only.
  if (base.protocol !== 'http:' || !LOOPBACK_HOSTS.has(base.host.replace(/:\d+$/, ''))) usage('--base-url must be an http loopback address');

  const provisioning = await importBuilt('src/identity/irr_identity_provisioning.ts');
  const gate = provisioning.readGateReceipt(stagingDir);
  const gatedRosterVersion = gate !== null && gate.accepted ? (gate.loaderOutput.versions?.rosterVersion ?? null) : null;

  let httpStatus = 0;
  let body = null;
  try {
    const response = await fetch(new URL(`/api/investment/portfolio/${encodeURIComponent(portfolioId)}/identities`, base), {
      signal: AbortSignal.timeout(60_000),
    });
    httpStatus = response.status;
    body = await response.json().catch(() => null);
  } catch {
    say('RESULT: FAIL (ENDPOINT_UNREACHABLE) the IRR server did not answer');
    return EXIT.ENDPOINT;
  }

  const summary = provisioning.summariseIdentitiesAnswer(httpStatus, body, gatedRosterVersion);
  const pass = summary.operational && summary.servesTheGatedRoster === true;
  const record = { schemaVersion: 'IPD_IRR_IDENTITY_ENDPOINT_CHECK_V1', checkedAtUtc: new Date().toISOString(), result: pass ? 'PASS' : 'FAIL', ...summary };
  writeFileSync(join(resolve(stagingDir), 'endpoint-check.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  say(`RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  say('PASS means: the endpoint answers 200 from the roster the IRR loader gate accepted. It is not a statement that holdings resolved; see the counts.');
  say(`HTTP status: ${summary.httpStatus}`);
  if (summary.error !== null) say(`error: ${summary.error}`);
  for (const [key, count] of Object.entries(summary.issuesByFileAndCode)) say(`  issue ${key}: ${count}`);
  if (summary.holdings !== null) {
    say(`holdings: ${summary.holdings}`);
    for (const [state, count] of Object.entries(summary.byState)) say(`  state ${state}: ${count}`);
    for (const [reason, count] of Object.entries(summary.byReason)) say(`  reason ${reason}: ${count}`);
    for (const [basis, count] of Object.entries(summary.byResolutionBasis)) say(`  resolution basis ${basis}: ${count}`);
    say(`resolved with an issuer: ${summary.resolvedWithIssuer} of ${summary.holdings}`);
    say(`assessable: ${summary.assessable} of ${summary.holdings}`);
    const noIdentifier = summary.byReason.NO_IDENTIFIER_PROVIDED ?? 0;
    if (noIdentifier > 0) {
      say(`NOTE: ${noIdentifier} holdings reached the IRR resolver with no ISIN and no exchange. No roster content can resolve them; the identifier has to be supplied by the holding (IPD qualification) and passed on by IRR.`);
    }
  }
  say(`roster class: ${summary.rosterDataClass ?? 'not reported'}`);
  say(`roster version: ${summary.rosterVersion ?? 'not reported'}`);
  say(`serves the roster the IRR loader gate accepted: ${summary.servesTheGatedRoster ?? 'not determined'}`);
  say(`record (counts only): ${join(resolve(stagingDir), 'endpoint-check.json')}`);
  return pass ? EXIT.OK : EXIT.ENDPOINT;
}

/* ---------------------------------------------------------------------------------- main */

const [command, ...rest] = process.argv.slice(2);
const commands = { generate, validate, install, 'verify-endpoint': verifyEndpoint };
if (command === undefined || !(command in commands)) usage('a command is required');
process.exitCode = await commands[command](rest);
