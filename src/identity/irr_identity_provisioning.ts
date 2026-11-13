/**
 * Institutional Investment Platform System (IIPS)
 * W04 — staging, acceptance gate and installation of IRR identity sources.
 *
 * Three steps, each of which refuses to proceed past a failure of the one before:
 *
 *   1. STAGE     write the export of `irr_identity_source_export.ts` into a staging directory that
 *                belongs to the operator. Nothing under an IRR data directory is touched.
 *   2. GATE      IRR's own loader and resolver are run on the staged files
 *                (`scripts/irr-identity-loader-gate.mts`). The answer is recorded beside the staged
 *                files, bound to their digests.
 *   3. INSTALL   only files that passed the gate, byte for byte, are placed in
 *                `<IIPS_DATA_DIR>/investment/identity/`. The directory appears in one rename, so
 *                the IRR server, which reads the files on every request, never sees a partial set.
 *
 * WRITE BOUNDARY
 *   The only location written outside the staging directory is the identity directory of the data
 *   root the operator names. The data root itself must already exist: a mistyped path is refused,
 *   not created. No portfolio, revision, broker-import or other IRR or IPD data is read or written.
 */
import { createHash, randomBytes } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import {
  IRR_IDENTITY_EXPORT_REPORT_SCHEMA,
  IRR_IDENTITY_FILE_NAMES,
  serialiseExportReport,
  type FileDigest,
  type IrrIdentityExportReport,
  type IrrIdentityExportResult,
  type IrrIdentityFileName,
} from './irr_identity_source_export.js';

export const STAGED_IDENTITY_SUBDIR = 'identity' as const;
export const STAGED_REPORT_FILE = 'provisioning-report.json' as const;
export const STAGED_GATE_FILE = 'irr-loader-gate.json' as const;
export const STAGED_INSTALL_RECEIPT_FILE = 'install-receipt.json' as const;
export const GATE_RECEIPT_SCHEMA = 'IPD_IRR_IDENTITY_GATE_RECEIPT_V1' as const;
export const INSTALL_RECEIPT_SCHEMA = 'IPD_IRR_IDENTITY_INSTALL_RECEIPT_V1' as const;
export const LOADER_GATE_SCHEMA = 'IPD_IRR_IDENTITY_LOADER_GATE_V1' as const;

const IDENTITY_FILES: ReadonlyArray<IrrIdentityFileName> = Object.freeze([
  IRR_IDENTITY_FILE_NAMES.roster,
  IRR_IDENTITY_FILE_NAMES.listingMap,
  IRR_IDENTITY_FILE_NAMES.corporateActions,
]);

export class ProvisioningError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProvisioningError';
  }
}

function sha256OfFile(path: string): FileDigest {
  const bytes = readFileSync(path);
  return { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
}

function sameDigests(
  a: Readonly<Record<IrrIdentityFileName, FileDigest>>,
  b: Readonly<Record<IrrIdentityFileName, FileDigest>>,
): boolean {
  return IDENTITY_FILES.every((name) => a[name]?.sha256 === b[name]?.sha256 && a[name]?.bytes === b[name]?.bytes);
}

/** Digests of the three identity files in a directory, or null when any of them is absent. */
export function readIdentityDirectoryDigests(dir: string): Record<IrrIdentityFileName, FileDigest> | null {
  if (!IDENTITY_FILES.every((name) => existsSync(join(dir, name)))) return null;
  return Object.fromEntries(IDENTITY_FILES.map((name) => [name, sha256OfFile(join(dir, name))])) as Record<
    IrrIdentityFileName,
    FileDigest
  >;
}

/* ------------------------------------------------------------------------------------------ *
 * 1. Stage
 * ------------------------------------------------------------------------------------------ */

export interface StageOutcome {
  readonly stagingDir: string;
  readonly identityDir: string | null;
  readonly reportPath: string;
  readonly result: IrrIdentityExportReport['result'];
}

/**
 * Write an export into the staging directory. A result other than PASS writes the report only and
 * removes identity files staged earlier, so a refused run can never leave installable files behind.
 * Any earlier gate record and install receipt are removed: they describe other bytes.
 */
export function stageExport(stagingDir: string, result: IrrIdentityExportResult): StageOutcome {
  const root = resolve(stagingDir);
  mkdirSync(root, { recursive: true });
  const identityDir = join(root, STAGED_IDENTITY_SUBDIR);
  rmSync(identityDir, { recursive: true, force: true });
  rmSync(join(root, STAGED_GATE_FILE), { force: true });
  rmSync(join(root, STAGED_INSTALL_RECEIPT_FILE), { force: true });

  const reportPath = join(root, STAGED_REPORT_FILE);
  writeFileSync(reportPath, serialiseExportReport(result.report), 'utf8');

  if (result.report.result !== 'PASS' || result.artifacts === null) {
    return { stagingDir: root, identityDir: null, reportPath, result: result.report.result };
  }
  mkdirSync(identityDir, { recursive: true });
  for (const name of IDENTITY_FILES) writeFileSync(join(identityDir, name), result.artifacts.files[name], 'utf8');
  return { stagingDir: root, identityDir, reportPath, result: 'PASS' };
}

export interface StagedExport {
  readonly stagingDir: string;
  readonly identityDir: string;
  readonly report: IrrIdentityExportReport;
  readonly digests: Readonly<Record<IrrIdentityFileName, FileDigest>>;
}

/** Read a staged export back and confirm the staged bytes are the bytes the report describes. */
export function readStagedExport(stagingDir: string): StagedExport {
  const root = resolve(stagingDir);
  const reportPath = join(root, STAGED_REPORT_FILE);
  if (!existsSync(reportPath)) {
    throw new ProvisioningError('STAGING_REPORT_ABSENT', 'the staging directory has no provisioning report; run generate first');
  }
  let report: IrrIdentityExportReport;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8')) as IrrIdentityExportReport;
  } catch {
    throw new ProvisioningError('STAGING_REPORT_UNREADABLE', 'the provisioning report is not valid JSON');
  }
  if (report.schemaVersion !== IRR_IDENTITY_EXPORT_REPORT_SCHEMA) {
    throw new ProvisioningError('STAGING_REPORT_UNREADABLE', 'the provisioning report has an unknown schema');
  }
  if (report.result !== 'PASS' || report.outputs === null || report.outputs === undefined) {
    throw new ProvisioningError('STAGED_EXPORT_NOT_PASS', `the staged export result is ${String(report.result)}; nothing can be validated or installed`);
  }
  const identityDir = join(root, STAGED_IDENTITY_SUBDIR);
  const digests = readIdentityDirectoryDigests(identityDir);
  if (digests === null) {
    throw new ProvisioningError('STAGED_FILES_ABSENT', 'the staging directory does not hold all three identity files');
  }
  if (!sameDigests(digests, report.outputs.files)) {
    throw new ProvisioningError('STAGED_FILES_ALTERED', 'the staged identity files do not match the digests in the provisioning report');
  }
  return { stagingDir: root, identityDir, report, digests };
}

/* ------------------------------------------------------------------------------------------ *
 * 2. Gate
 * ------------------------------------------------------------------------------------------ */

/** The document `scripts/irr-identity-loader-gate.mts` prints. Everything is checked before use. */
export type LoaderGateOutput = Readonly<Record<string, unknown>>;

export interface GateDecision {
  readonly accepted: boolean;
  readonly failures: ReadonlyArray<string>;
}

function numberAt(value: unknown, ...path: string[]): number | null {
  let current: unknown = value;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'number' && Number.isFinite(current) ? current : null;
}

/**
 * Decide whether the IRR loader's answer accepts the staged export. Every condition must hold:
 * the loader ran and loaded the set; it read the staged bytes; it classed the roster as operator
 * supplied; it counted what the report counted; and IRR's resolver resolved every exported
 * security by ISIN, and every exported listing by exchange and symbol, to that same record.
 */
export function evaluateLoaderGate(output: LoaderGateOutput, staged: StagedExport): GateDecision {
  const failures: string[] = [];
  const report = staged.report;
  if (output.gate !== LOADER_GATE_SCHEMA) failures.push('the gate output has an unknown schema');
  if (output.ran !== true) failures.push(`the IRR loader did not run (${String(output.error ?? 'no reason given')})`);
  if (output.available !== true) {
    failures.push(`the IRR loader refused the identity files (${String(output.issueCount ?? 'unknown number of')} issues)`);
  }
  if (failures.length > 0) return { accepted: false, failures };

  const gatedFiles = typeof output.files === 'object' && output.files !== null ? (output.files as Record<string, unknown>) : {};
  for (const name of IDENTITY_FILES) {
    const gated = gatedFiles[name];
    const gatedSha = typeof gated === 'object' && gated !== null ? (gated as Record<string, unknown>).sha256 : null;
    if (gatedSha !== staged.digests[name].sha256) {
      failures.push(`the IRR loader did not read the staged ${name}`);
    }
  }
  if (output.rosterDataClass !== 'OPERATOR_SUPPLIED') failures.push('IRR did not class the roster as OPERATOR_SUPPLIED');
  if (output.rosterLabel !== report.outputs!.rosterLabel) failures.push('the roster label IRR loaded is not the exported label');

  const expected = report.coverage;
  const pairs: ReadonlyArray<readonly [string, number | null, number]> = [
    ['issuers', numberAt(output, 'counts', 'issuers'), expected.issuers.exported],
    ['securities', numberAt(output, 'counts', 'securities'), expected.securities.exported],
    ['listings', numberAt(output, 'counts', 'listings'), expected.listings.nse.exported],
    ['corporate actions', numberAt(output, 'counts', 'corporateActions'), expected.corporateActions.exported],
    ['securities resolved by ISIN', numberAt(output, 'resolverSelfCheck', 'byIsin', 'resolvedToTheSameRecord'), expected.securities.exported],
    ['listings resolved by exchange and symbol', numberAt(output, 'resolverSelfCheck', 'byExchangeAndSymbol', 'resolvedToTheSameRecord'), expected.listings.nse.exported],
  ];
  for (const [label, actual, wanted] of pairs) {
    if (actual !== wanted) failures.push(`${label}: IRR reports ${actual === null ? 'no value' : String(actual)}, the export has ${String(wanted)}`);
  }

  const versions = output.versions;
  const versionOk =
    typeof versions === 'object' &&
    versions !== null &&
    ['rosterVersion', 'listingMapVersion', 'corporateActionTableVersion'].every(
      (key) => typeof (versions as Record<string, unknown>)[key] === 'string' && ((versions as Record<string, unknown>)[key] as string).length > 0,
    );
  if (!versionOk) failures.push('IRR did not report the three source versions');

  return { accepted: failures.length === 0, failures };
}

export interface GateReceipt {
  readonly schemaVersion: typeof GATE_RECEIPT_SCHEMA;
  readonly accepted: boolean;
  readonly failures: ReadonlyArray<string>;
  /** Digests of the staged files the gate was run on. Installation requires the same digests. */
  readonly stagedFiles: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  readonly irr: { readonly commit: string | null; readonly worktreeClean: boolean | null };
  readonly asOf: string;
  readonly loaderOutput: LoaderGateOutput;
}

export function recordGate(
  staged: StagedExport,
  output: LoaderGateOutput,
  context: { readonly irrCommit: string | null; readonly irrWorktreeClean: boolean | null; readonly asOf: string },
): GateReceipt {
  const decision = evaluateLoaderGate(output, staged);
  const receipt: GateReceipt = {
    schemaVersion: GATE_RECEIPT_SCHEMA,
    accepted: decision.accepted,
    failures: decision.failures,
    stagedFiles: staged.digests,
    irr: { commit: context.irrCommit, worktreeClean: context.irrWorktreeClean },
    asOf: context.asOf,
    loaderOutput: output,
  };
  // An install receipt written before this gate describes an earlier decision.
  rmSync(join(staged.stagingDir, STAGED_INSTALL_RECEIPT_FILE), { force: true });
  writeFileSync(join(staged.stagingDir, STAGED_GATE_FILE), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return receipt;
}

export function readGateReceipt(stagingDir: string): GateReceipt | null {
  const path = join(resolve(stagingDir), STAGED_GATE_FILE);
  if (!existsSync(path)) return null;
  try {
    const receipt = JSON.parse(readFileSync(path, 'utf8')) as GateReceipt;
    return receipt.schemaVersion === GATE_RECEIPT_SCHEMA ? receipt : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------------------------ *
 * 3. Install
 * ------------------------------------------------------------------------------------------ */

export type InstallAction = 'INSTALLED' | 'ALREADY_INSTALLED' | 'REPLACED';

export interface InstallOutcome {
  readonly action: InstallAction;
  readonly identityDir: string;
  readonly installedFiles: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  /** Where the previous files were copied before a replacement, inside the staging directory. */
  readonly previousFilesBackup: string | null;
}

export interface InstallOptions {
  readonly stagingDir: string;
  /** The IRR data root, the value of `IIPS_DATA_DIR` for the IRR server. It must already exist. */
  readonly dataDir: string;
  /** Allow different existing identity files to be replaced. Default false. */
  readonly replace?: boolean;
  /** Test seam: called between writing the incoming directory and making it live. */
  readonly beforeSwap?: () => void;
}

/** `<data root>/investment/identity`, exactly as IRR resolves it. */
export function identityDirOf(dataDir: string): string {
  return join(resolve(dataDir), 'investment', 'identity');
}

function renameWithRetry(from: string, to: string): void {
  // On Windows a rename fails while another process holds a file of the directory open. The IRR
  // server opens the files only for the duration of one read, so a short retry is sufficient.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      renameSync(from, to);
      return;
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES') break;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  throw lastError;
}

export function installStagedIdentity(options: InstallOptions): InstallOutcome {
  const staged = readStagedExport(options.stagingDir);

  const gate = readGateReceipt(staged.stagingDir);
  if (gate === null) {
    throw new ProvisioningError('GATE_NOT_RUN', 'the staged files have not been validated by the IRR loader; run validate first');
  }
  if (!gate.accepted) {
    throw new ProvisioningError('GATE_REFUSED', 'the IRR loader gate did not accept the staged files; nothing is installed');
  }
  if (!sameDigests(gate.stagedFiles, staged.digests)) {
    throw new ProvisioningError('GATE_STALE', 'the staged files changed after the IRR loader gate was run; run validate again');
  }
  // The decision is recomputed from the recorded loader output rather than trusted from the flag.
  if (!evaluateLoaderGate(gate.loaderOutput, staged).accepted) {
    throw new ProvisioningError('GATE_REFUSED', 'the recorded IRR loader output does not accept the staged files; nothing is installed');
  }

  const dataRoot = resolve(options.dataDir);
  if (!existsSync(dataRoot) || !statSync(dataRoot).isDirectory()) {
    throw new ProvisioningError('DATA_DIR_ABSENT', 'the data directory does not exist; it is not created by this tool');
  }
  const investmentDir = join(dataRoot, 'investment');
  const targetDir = identityDirOf(dataRoot);

  let previousFilesBackup: string | null = null;
  let action: InstallAction = 'INSTALLED';
  const targetExists = existsSync(targetDir);
  if (targetExists) {
    if (!statSync(targetDir).isDirectory()) {
      throw new ProvisioningError('TARGET_NOT_A_DIRECTORY', 'the identity path exists and is not a directory');
    }
    const existing = readIdentityDirectoryDigests(targetDir);
    const names = readdirSync(targetDir);
    if (existing !== null && sameDigests(existing, staged.digests) && names.length === IDENTITY_FILES.length) {
      return { action: 'ALREADY_INSTALLED', identityDir: targetDir, installedFiles: existing, previousFilesBackup: null };
    }
    if (names.length > 0) {
      if (names.some((name) => !statSync(join(targetDir, name)).isFile())) {
        throw new ProvisioningError('TARGET_HAS_UNEXPECTED_CONTENT', 'the identity directory holds something other than files; nothing was changed');
      }
      if (options.replace !== true) {
        throw new ProvisioningError(
          'TARGET_HAS_OTHER_FILES',
          'the identity directory already holds different files; they are not replaced unless replacement is requested explicitly',
        );
      }
      const tag = createHash('sha256').update(names.sort().map((name) => `${name}:${sha256OfFile(join(targetDir, name)).sha256}`).join('\n')).digest('hex').slice(0, 16);
      previousFilesBackup = join(staged.stagingDir, `replaced-${tag}`);
      rmSync(previousFilesBackup, { recursive: true, force: true });
      cpSync(targetDir, previousFilesBackup, { recursive: true });
      for (const name of names) {
        if (sha256OfFile(join(previousFilesBackup, name)).sha256 !== sha256OfFile(join(targetDir, name)).sha256) {
          throw new ProvisioningError('BACKUP_FAILED', 'the copy of the existing identity files could not be verified; nothing was changed');
        }
      }
      action = 'REPLACED';
    }
  }

  mkdirSync(investmentDir, { recursive: true });
  const suffix = randomBytes(6).toString('hex');
  const incomingDir = join(investmentDir, `.identity-incoming-${suffix}`);
  const outgoingDir = join(investmentDir, `.identity-outgoing-${suffix}`);
  try {
    mkdirSync(incomingDir);
    for (const name of IDENTITY_FILES) cpSync(join(staged.identityDir, name), join(incomingDir, name));
    const incoming = readIdentityDirectoryDigests(incomingDir);
    if (incoming === null || !sameDigests(incoming, staged.digests)) {
      throw new ProvisioningError('COPY_FAILED', 'the files written beside the identity directory do not match the staged files');
    }
    options.beforeSwap?.();
    if (targetExists) renameWithRetry(targetDir, outgoingDir);
    try {
      renameWithRetry(incomingDir, targetDir);
    } catch (error) {
      // Put the previous directory back rather than leave the server without identity files.
      if (targetExists && existsSync(outgoingDir) && !existsSync(targetDir)) renameWithRetry(outgoingDir, targetDir);
      throw error;
    }
  } finally {
    rmSync(incomingDir, { recursive: true, force: true });
  }
  rmSync(outgoingDir, { recursive: true, force: true });

  const installed = readIdentityDirectoryDigests(targetDir);
  if (installed === null || !sameDigests(installed, staged.digests)) {
    throw new ProvisioningError('INSTALL_VERIFICATION_FAILED', 'the installed identity files do not match the staged files');
  }
  return { action, identityDir: targetDir, installedFiles: installed, previousFilesBackup };
}

export interface InstallReceipt {
  readonly schemaVersion: typeof INSTALL_RECEIPT_SCHEMA;
  readonly action: InstallAction;
  readonly installedAtUtc: string;
  readonly installedFiles: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  readonly previousFilesBackedUp: boolean;
  readonly irrVersions: unknown;
  readonly irrCommit: string | null;
  readonly export: {
    readonly mappingVersion: string;
    readonly masterBatchId: string;
    readonly masterChecksumSha256: string;
    readonly issuers: number;
    readonly securities: number;
    readonly listings: number;
    readonly corporateActions: number;
    readonly withheld: number;
  };
}

/** Record an installation in the staging directory. The receipt holds no path and no portfolio data. */
export function writeInstallReceipt(stagingDir: string, outcome: InstallOutcome, installedAtUtc: string): InstallReceipt {
  const staged = readStagedExport(stagingDir);
  const gate = readGateReceipt(staged.stagingDir);
  const receipt: InstallReceipt = {
    schemaVersion: INSTALL_RECEIPT_SCHEMA,
    action: outcome.action,
    installedAtUtc,
    installedFiles: outcome.installedFiles,
    previousFilesBackedUp: outcome.previousFilesBackup !== null,
    irrVersions: gate?.loaderOutput.versions ?? null,
    irrCommit: gate?.irr.commit ?? null,
    export: {
      mappingVersion: staged.report.mappingVersion,
      masterBatchId: staged.report.inputs.p04SecurityMaster.batchId,
      masterChecksumSha256: staged.report.inputs.p04SecurityMaster.observedChecksumSha256,
      issuers: staged.report.coverage.issuers.exported,
      securities: staged.report.coverage.securities.exported,
      listings: staged.report.coverage.listings.nse.exported,
      corporateActions: staged.report.coverage.corporateActions.exported,
      withheld: staged.report.coverage.master.withheld,
    },
  };
  writeFileSync(join(staged.stagingDir, STAGED_INSTALL_RECEIPT_FILE), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return receipt;
}

/* ------------------------------------------------------------------------------------------ *
 * Endpoint answer
 * ------------------------------------------------------------------------------------------ */

export interface EndpointSummary {
  readonly httpStatus: number;
  readonly operational: boolean;
  readonly error: string | null;
  readonly issuesByFileAndCode: Readonly<Record<string, number>>;
  readonly holdings: number | null;
  readonly byState: Readonly<Record<string, number>>;
  readonly byReason: Readonly<Record<string, number>>;
  readonly byResolutionBasis: Readonly<Record<string, number>>;
  readonly resolvedWithIssuer: number | null;
  readonly assessable: number | null;
  readonly rosterDataClass: string | null;
  readonly rosterVersion: string | null;
  /** True when the endpoint reports the roster version the IRR loader gate computed for the staged files. */
  readonly servesTheGatedRoster: boolean | null;
}

function tally(values: ReadonlyArray<string>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Reduce one answer of `GET /api/investment/portfolio/<id>/identities` to counts. The summary names
 * no holding: no symbol, ISIN, issuer, security or portfolio identifier is copied into it.
 */
export function summariseIdentitiesAnswer(httpStatus: number, body: unknown, gatedRosterVersion: string | null): EndpointSummary {
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const issues = Array.isArray(record.issues) ? (record.issues as Record<string, unknown>[]) : [];
  const identities = Array.isArray(record.identities) ? (record.identities as Record<string, unknown>[]) : null;
  const directory = typeof record.directory === 'object' && record.directory !== null ? (record.directory as Record<string, unknown>) : {};
  const rosterVersion = typeof directory.rosterVersion === 'string' ? directory.rosterVersion : null;
  const operational = httpStatus === 200 && identities !== null && rosterVersion !== null;
  return {
    httpStatus,
    operational,
    error: typeof record.error === 'string' ? record.error : null,
    issuesByFileAndCode: tally(issues.map((issue) => `${String(issue.file)}:${String(issue.code)}`)),
    holdings: identities === null ? null : identities.length,
    byState: identities === null ? {} : tally(identities.map((identity) => String(identity.state))),
    byReason: identities === null ? {} : tally(identities.map((identity) => String(identity.reason ?? 'NONE'))),
    byResolutionBasis: identities === null ? {} : tally(identities.map((identity) => String(identity.resolutionBasis ?? 'NONE'))),
    resolvedWithIssuer:
      identities === null
        ? null
        : identities.filter((identity) => identity.state === 'RESOLVED' && typeof identity.issuerId === 'string').length,
    assessable: identities === null ? null : identities.filter((identity) => identity.assessable === true).length,
    rosterDataClass: typeof directory.rosterDataClass === 'string' ? directory.rosterDataClass : null,
    rosterVersion,
    servesTheGatedRoster: rosterVersion === null || gatedRosterVersion === null ? null : rosterVersion === gatedRosterVersion,
  };
}
