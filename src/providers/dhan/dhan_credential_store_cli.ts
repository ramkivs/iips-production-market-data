/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Credential Store CLI — W-04 operator surface
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), W-04
 *
 * WHAT THIS IS
 *  The local command an owner runs to install, replace or inspect the two Dhan credential
 *  carriers. It is a thin surface: every decision lives in `dhan_credential_store_utility.ts`, and
 *  every store rule is W-02's.
 *
 * HOW A SECRET GETS IN (the whole point of the command)
 *  - Interactive: the secret is typed at a hidden prompt (no echo), twice, and never appears in
 *    the shell, in PSReadLine history, in argv or in an environment variable.
 *  - Piped: it arrives on **stdin**. `echo`-style framing (trailing newlines) is removed; anything
 *    else is stored exactly or refused.
 *  - Never: `--secret`, `--token`, `--value`, any other flag, any environment variable. A command
 *    line that tries is refused, and the refused token is not echoed.
 *
 * WHAT IT PRINTS
 *  The fingerprint (`sha256:<12 hex>`), the envelope metadata and the outcome. Never the secret,
 *  never a `vault://` path, never a carrier path — the location is reported as "withheld".
 *
 * WHAT IT NEVER DOES
 *  No network, no cloud, no temporary file, no argv or environment hand-off of a secret, and no
 *  change to the daemon, to D-7 provider states or to any diagnostics surface.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import {
  DHAN_CREDENTIAL_LABELS,
  DHAN_CREDENTIAL_ROLES,
  DEFAULT_DHAN_CREDENTIAL_VERSION,
  DhanCredentialProvisionError,
  type DhanCredentialStoreVerificationReport,
  type DhanCredentialVerification,
  type DpapiCredentialProvisionReport,
  provisionDhanCredential,
  stripSecretTransportFraming,
  verifyDhanCredentialStore,
} from './dhan_credential_store_utility.js';
import { type DpapiAclApplier } from './dhan_dpapi_acl.js';
import { type DpapiProcessRunner } from './dhan_dpapi_process.js';
import { type DpapiCarrierRole } from './dhan_dpapi_carrier.js';

export const DHAN_CREDENTIAL_CLI_PREFIX = '[ipd-dhan-credential]';

/** Process exit codes. Distinct so a launcher or the owner can branch without parsing text. */
export const DHAN_CREDENTIAL_EXIT = Object.freeze({
  OK: 0,
  USAGE: 2,
  INPUT_INVALID: 3,
  ENVIRONMENT: 4,
  WRITE_FAILED: 5,
  VERIFY_FAILED: 6,
  STATE_REFUSED: 7,
});

/** Flags that name a secret. Refused explicitly, so the refusal names the rule, not the value. */
const FORBIDDEN_SECRET_FLAGS = ['--secret', '--value', '--token', '--client-id', '--access-token'];

const USAGE = [
  'usage:',
  '  dhan-credential-store provision <client-id|access-token> [options]   install a new secret',
  '  dhan-credential-store rotate    <client-id|access-token> [options]   replace an existing secret',
  '  dhan-credential-store verify    [<client-id|access-token|all>] [options]',
  '',
  'the secret is read from stdin: type it at the hidden prompt, or pipe it in.',
  'it is never accepted as an argument or an environment variable.',
  '',
  'options:',
  '  --carrier-directory <dir>   carrier directory (default: the governed D-1 location)',
  '  --version <tag>             SecretRef version stamped into the envelope (default: v1)',
  '  --expires-at <iso-utc>      access token only; must be in the future',
  '  --expires-in-hours <n>      access token only; convenience for --expires-at',
  '  --json                      machine-readable output',
  '  --help                      this text',
].join('\n');

export interface DhanCredentialStoreCliIo {
  writeStdout(line: string): void;
  writeStderr(line: string): void;
}

export interface DhanCredentialStoreCliOptions {
  readonly argv?: readonly string[];
  readonly io?: DhanCredentialStoreCliIo;
  readonly now?: () => Date;
  readonly runner?: DpapiProcessRunner;
  readonly platform?: () => NodeJS.Platform;
  readonly applyOwnerOnlyAcl?: DpapiAclApplier;
  /**
   * Secret acquisition seam. Production reads stdin; tests inject. The `confirm` flag is true when
   * the caller must ask twice (every path that writes).
   */
  readonly readSecret?: (context: {
    readonly role: DpapiCarrierRole;
    readonly confirm: boolean;
  }) => Promise<string>;
  /** Overrides the piped-stdin read. */
  readonly readPipedStdin?: () => Promise<string>;
  /** Whether stdin is a terminal. Defaults to `process.stdin.isTTY === true`. */
  readonly isInteractive?: boolean;
}

export interface DhanCredentialStoreCliResult {
  readonly exitCode: number;
}

type ParsedArguments =
  | {
      readonly ok: true;
      readonly command: 'provision' | 'rotate' | 'verify' | 'help';
      readonly role: DpapiCarrierRole | 'all';
      readonly carrierDirectory?: string;
      readonly version?: string;
      readonly expiresAtUtc?: string;
      readonly expiresInHours?: number;
      readonly json: boolean;
    }
  | { readonly ok: false; readonly message: string; readonly forbiddenFlag?: string };

/** Resolves the operator-facing role name. Unknown names are refused by name only. */
function parseRole(token: string | undefined): DpapiCarrierRole | 'all' | null {
  if (token === undefined) return null;
  const normalized = token.trim().toLowerCase();
  if (normalized === 'all') return 'all';
  for (const role of DHAN_CREDENTIAL_ROLES) {
    if (DHAN_CREDENTIAL_LABELS[role] === normalized) return role;
    if (role.toLowerCase() === normalized) return role;
  }
  return null;
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  if (argv.length === 0) return { ok: false, message: 'no command given' };

  const commandToken = argv[0] ?? '';
  if (commandToken === '--help' || commandToken === '-h' || commandToken === 'help') {
    return { ok: true, command: 'help', role: 'all', json: false };
  }
  if (commandToken !== 'provision' && commandToken !== 'rotate' && commandToken !== 'verify') {
    // The command token is a fixed vocabulary, so it is safe to name; anything else is refused.
    return { ok: false, message: 'the command must be one of: provision, rotate, verify' };
  }

  let role: DpapiCarrierRole | 'all' | null = commandToken === 'verify' ? 'all' : null;
  let roleSeen = false;
  let carrierDirectory: string | undefined;
  let version: string | undefined;
  let expiresAtUtc: string | undefined;
  let expiresInHours: number | undefined;
  let json = false;

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index] ?? '';

    const forbidden = FORBIDDEN_SECRET_FLAGS.find(
      (flag) => token === flag || token.startsWith(`${flag}=`)
    );
    if (forbidden !== undefined) {
      return {
        ok: false,
        message: `secrets are never accepted on the command line (${forbidden}); provide the secret on stdin`,
        forbiddenFlag: forbidden,
      };
    }

    if (token === '--json') {
      json = true;
      continue;
    }
    if (token === '--help' || token === '-h') {
      return { ok: true, command: 'help', role: 'all', json: false };
    }

    const expectsValue = (flag: string): string | null => {
      if (token === flag) {
        const next = argv[index + 1];
        if (next === undefined) return null;
        index += 1;
        return next;
      }
      if (token.startsWith(`${flag}=`)) return token.slice(flag.length + 1);
      return null;
    };

    const directory = expectsValue('--carrier-directory');
    if (directory !== null) {
      if (directory.length === 0) return { ok: false, message: 'the carrier directory is empty' };
      carrierDirectory = directory;
      continue;
    }
    const versionValue = expectsValue('--version');
    if (versionValue !== null) {
      version = versionValue;
      continue;
    }
    const expiresAt = expectsValue('--expires-at');
    if (expiresAt !== null) {
      expiresAtUtc = expiresAt;
      continue;
    }
    const expiresHours = expectsValue('--expires-in-hours');
    if (expiresHours !== null) {
      const hours = Number(expiresHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        return { ok: false, message: 'the expiry in hours must be a positive number' };
      }
      expiresInHours = hours;
      continue;
    }

    if (token.startsWith('-')) {
      // An unrecognised option is never echoed: a mistyped flag is the one place a pasted secret
      // could reach the command line, and it must not reach the terminal or the history file.
      return { ok: false, message: 'an unrecognised option was supplied and is not echoed' };
    }

    if (roleSeen) {
      return { ok: false, message: 'only one credential role may be named' };
    }
    const parsedRole = parseRole(token);
    if (parsedRole === null) {
      return {
        ok: false,
        message: 'the credential role must be client-id, access-token or all',
      };
    }
    role = parsedRole;
    roleSeen = true;
  }

  if (commandToken === 'verify') {
    if (role === null) role = 'all';
  } else {
    if (role === null || role === 'all') {
      return { ok: false, message: 'name exactly one credential role to provision or rotate' };
    }
  }

  if ((expiresAtUtc !== undefined || expiresInHours !== undefined) && commandToken === 'verify') {
    return { ok: false, message: 'an expiry applies to provisioning or rotation, not to verify' };
  }
  if (expiresAtUtc !== undefined && expiresInHours !== undefined) {
    return { ok: false, message: 'give either an expiry timestamp or a duration, not both' };
  }

  return {
    ok: true,
    command: commandToken,
    role,
    ...(carrierDirectory !== undefined ? { carrierDirectory } : {}),
    ...(version !== undefined ? { version } : {}),
    ...(expiresAtUtc !== undefined ? { expiresAtUtc } : {}),
    ...(expiresInHours !== undefined ? { expiresInHours } : {}),
    json,
  };
}

/** Reads all of stdin as UTF-8. Used for the piped path only. */
async function readAllStdin(): Promise<string> {
  const stream = process.stdin;
  stream.setEncoding('utf8');
  return new Promise<string>((resolveInput, rejectInput) => {
    let text = '';
    stream.on('data', (chunk: string) => {
      text += chunk;
    });
    stream.on('end', () => resolveInput(text));
    stream.on('error', () => rejectInput(new Error('stdin could not be read')));
  });
}

/**
 * Hidden interactive prompt.
 *
 * Echo is disabled while the secret is typed, the characters never leave this function, and the
 * prompt text itself goes to stderr so that stdout carries only the report. Ctrl-C aborts without
 * writing anything.
 */
async function promptHidden(prompt: string): Promise<string> {
  const stream = process.stdin;
  process.stderr.write(prompt);
  stream.setRawMode?.(true);
  stream.resume();
  stream.setEncoding('utf8');

  return new Promise<string>((resolveInput, rejectInput) => {
    let buffer = '';
    const finish = (): void => {
      stream.setRawMode?.(false);
      stream.pause();
      stream.removeListener('data', onData);
      process.stderr.write('\n');
    };
    const onData = (chunk: string): void => {
      for (const char of chunk) {
        if (char === '\u0003') {
          finish();
          rejectInput(new Error('aborted'));
          return;
        }
        if (char === '\r' || char === '\n') {
          finish();
          resolveInput(buffer);
          return;
        }
        if (char === '\u007f' || char === '\b') {
          buffer = buffer.slice(0, -1);
          continue;
        }
        if (char === '\u0016') continue; // Ctrl-V paste framing
        buffer += char;
      }
    };
    stream.on('data', onData);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

function renderProvisionReport(
  command: 'provision' | 'rotate',
  report: DpapiCredentialProvisionReport
): string[] {
  return [
    `${DHAN_CREDENTIAL_CLI_PREFIX} ${command} ${report.label}: OK`,
    `  secretId     : ${report.secretId}`,
    `  version      : ${report.version}`,
    `  fingerprint  : ${report.fingerprint}`,
    `  createdAtUtc : ${report.createdAtUtc}`,
    `  rotatedAtUtc : ${report.rotatedAtUtc}`,
    ...(report.expiresAtUtc !== undefined ? [`  expiresAtUtc : ${report.expiresAtUtc}`] : []),
    `  replaced     : ${report.replaced ? 'yes' : 'no'}`,
    `  aclRewritten : ${report.directoryAclRewritten ? 'yes' : 'no'}`,
    '  roundTrip    : verified before swap',
    '  location     : withheld',
  ];
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function renderVerificationEntry(entry: DhanCredentialVerification): string {
  return (
    `  ${entry.label.padEnd(13)}: ${entry.status} ` +
    `(present=${yesNo(entry.present)} readable=${yesNo(entry.readable)} ` +
    `aclOwnerOnly=${yesNo(entry.aclOwnerOnly)} schemaValid=${yesNo(entry.schemaValid)} ` +
    `expired=${yesNo(entry.expired)}` +
    `${entry.version !== undefined ? ` version=${entry.version}` : ''}` +
    `${entry.expiresAtUtc !== undefined ? ` expiresAtUtc=${entry.expiresAtUtc}` : ''})`
  );
}

function renderVerificationReport(report: DhanCredentialStoreVerificationReport): string[] {
  return [
    `${DHAN_CREDENTIAL_CLI_PREFIX} verify: platformAdmissible=${yesNo(report.platformAdmissible)} ` +
      `locationAdmissible=${yesNo(report.locationAdmissible)}`,
    ...report.entries.map(renderVerificationEntry),
  ];
}

function exitCodeForProvisionError(error: DhanCredentialProvisionError): number {
  switch (error.code) {
    case 'SECRET_INVALID':
    case 'VERSION_INVALID':
    case 'EXPIRY_INVALID':
    case 'ROLE_INVALID':
      return DHAN_CREDENTIAL_EXIT.INPUT_INVALID;
    case 'NOT_WINDOWS':
    case 'CARRIER_DIRECTORY_INVALID':
      return DHAN_CREDENTIAL_EXIT.ENVIRONMENT;
    case 'ALREADY_PROVISIONED':
    case 'NOT_PROVISIONED':
      return DHAN_CREDENTIAL_EXIT.STATE_REFUSED;
    case 'DPAPI_PROTECT_FAILED':
    case 'ACL_FAILED':
    case 'ROUND_TRIP_FAILED':
    case 'WRITE_FAILED':
      return DHAN_CREDENTIAL_EXIT.WRITE_FAILED;
    default:
      return DHAN_CREDENTIAL_EXIT.WRITE_FAILED;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs one command. Never throws: every failure is a rendered line and an exit code, so the
 * caller (a launcher, a test, or the owner's terminal) always sees a typed outcome.
 */
export async function runDhanCredentialStoreCli(
  options: DhanCredentialStoreCliOptions = {}
): Promise<DhanCredentialStoreCliResult> {
  const io: DhanCredentialStoreCliIo = options.io ?? {
    writeStdout: (line: string) => process.stdout.write(`${line}\n`),
    writeStderr: (line: string) => process.stderr.write(`${line}\n`),
  };
  const now = options.now ?? (() => new Date());
  const argv = options.argv ?? process.argv.slice(2);
  const isInteractive = options.isInteractive ?? process.stdin.isTTY === true;
  const parsed = parseArguments(argv);

  if (!parsed.ok) {
    io.writeStderr(`${DHAN_CREDENTIAL_CLI_PREFIX} refused: ${parsed.message}`);
    io.writeStderr(USAGE);
    return { exitCode: DHAN_CREDENTIAL_EXIT.USAGE };
  }

  if (parsed.command === 'help') {
    io.writeStdout(USAGE);
    return { exitCode: DHAN_CREDENTIAL_EXIT.OK };
  }

  if (parsed.command === 'verify') {
    const roles =
      parsed.role === 'all' ? DHAN_CREDENTIAL_ROLES : [parsed.role as DpapiCarrierRole];
    let report;
    try {
      report = await verifyDhanCredentialStore({
        roles,
        ...(parsed.carrierDirectory !== undefined
          ? { carrierDirectory: parsed.carrierDirectory }
          : {}),
        now: now(),
        ...(options.runner !== undefined ? { runner: options.runner } : {}),
        ...(options.platform !== undefined ? { platform: options.platform } : {}),
      });
    } catch {
      io.writeStderr(`${DHAN_CREDENTIAL_CLI_PREFIX} verify: UNREADABLE (the store could not be read)`);
      return { exitCode: DHAN_CREDENTIAL_EXIT.VERIFY_FAILED };
    }

    if (parsed.json) {
      io.writeStdout(JSON.stringify(report));
    } else {
      for (const line of renderVerificationReport(report)) io.writeStdout(line);
    }
    const healthy =
      report.platformAdmissible &&
      report.locationAdmissible &&
      report.entries.every((entry) => entry.status === 'PRESENT_OK');
    return { exitCode: healthy ? DHAN_CREDENTIAL_EXIT.OK : DHAN_CREDENTIAL_EXIT.VERIFY_FAILED };
  }

  const role = parsed.role as DpapiCarrierRole;

  // Secret acquisition. Interactive callers are asked twice; piped input is framed-stripped.
  let secretValue: string;
  try {
    if (options.readSecret !== undefined) {
      secretValue = stripSecretTransportFraming(
        await options.readSecret({ role, confirm: isInteractive })
      );
    } else if (isInteractive) {
      const first = await promptHidden(`Dhan ${DHAN_CREDENTIAL_LABELS[role]} (input hidden): `);
      const second = await promptHidden('repeat to confirm: ');
      if (first !== second) {
        io.writeStderr(
          `${DHAN_CREDENTIAL_CLI_PREFIX} refused: the two entries did not match; nothing was written`
        );
        return { exitCode: DHAN_CREDENTIAL_EXIT.INPUT_INVALID };
      }
      secretValue = stripSecretTransportFraming(first);
    } else {
      const piped = options.readPipedStdin ?? readAllStdin;
      secretValue = stripSecretTransportFraming(await piped());
    }
  } catch {
    io.writeStderr(`${DHAN_CREDENTIAL_CLI_PREFIX} refused: the secret could not be read; nothing was written`);
    return { exitCode: DHAN_CREDENTIAL_EXIT.INPUT_INVALID };
  }

  const expiry = resolveExpiry(parsed.expiresAtUtc, parsed.expiresInHours, now());

  try {
    const report = await provisionDhanCredential({
      role,
      secretValue,
      mode: parsed.command === 'rotate' ? 'rotate' : 'provision',
      ...(parsed.carrierDirectory !== undefined
        ? { carrierDirectory: parsed.carrierDirectory }
        : {}),
      ...(parsed.version !== undefined ? { version: parsed.version } : {}),
      ...(expiry !== undefined ? { expiresAtUtc: expiry } : {}),
      now: now(),
      ...(options.runner !== undefined ? { runner: options.runner } : {}),
      ...(options.platform !== undefined ? { platform: options.platform } : {}),
      ...(options.applyOwnerOnlyAcl !== undefined
        ? { applyOwnerOnlyAcl: options.applyOwnerOnlyAcl }
        : {}),
    });

    if (parsed.json) {
      io.writeStdout(JSON.stringify(report));
    } else {
      for (const line of renderProvisionReport(parsed.command, report)) io.writeStdout(line);
    }
    return { exitCode: DHAN_CREDENTIAL_EXIT.OK };
  } catch (error) {
    if (error instanceof DhanCredentialProvisionError) {
      io.writeStderr(`${DHAN_CREDENTIAL_CLI_PREFIX} refused [${error.code}]: ${error.message}`);
      return { exitCode: exitCodeForProvisionError(error) };
    }
    io.writeStderr(
      `${DHAN_CREDENTIAL_CLI_PREFIX} refused [WRITE_FAILED]: the credential could not be written`
    );
    return { exitCode: DHAN_CREDENTIAL_EXIT.WRITE_FAILED };
  }
}

function resolveExpiry(
  expiresAtUtc: string | undefined,
  expiresInHours: number | undefined,
  now: Date
): string | undefined {
  if (expiresAtUtc !== undefined) return expiresAtUtc;
  if (expiresInHours !== undefined) {
    return new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();
  }
  return undefined;
}

/**
 * True only when this file is the process entry point (`npm run dhan:credential`, or
 * `node dist/src/providers/dhan/dhan_credential_store_cli.js`). Importing the module for tests
 * must never touch stdin, stderr or the exit code.
 */
const isMain = (): boolean => {
  if (!process.argv[1]) return false;
  return (
    process.argv[1].endsWith('dhan_credential_store_cli.js') ||
    process.argv[1].endsWith('dhan_credential_store_cli.ts')
  );
};

if (isMain()) {
  runDhanCredentialStoreCli()
    .then((result) => {
      process.exitCode = result.exitCode;
    })
    .catch(() => {
      process.stderr.write(`${DHAN_CREDENTIAL_CLI_PREFIX} refused: unexpected internal error\n`);
      process.exitCode = DHAN_CREDENTIAL_EXIT.WRITE_FAILED;
    });
}
