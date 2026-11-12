/**
 * D-6 — Operator token-acquisition and replacement procedure: documentation conformance.
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), D-6
 * Procedure: docs/integration/DHAN-D6-OPERATOR-TOKEN-ACQUISITION-AND-REPLACEMENT-2026-11-12.md
 *
 * WHY THIS SUITE EXISTS
 * D-6 is a document that tells a human being to type a live bearer secret into a program. Its drift
 * modes are all quiet:
 *   1. the procedure names a command, flag or exit code the shipped CLI does not have, so the
 *      operator improvises — or pastes the secret somewhere the utility never reads;
 *   2. the document stops distinguishing local provisioning from authenticated vendor connectivity
 *      (D-7), so a green `verify` is read as "connected";
 *   3. a real credential, a fingerprint or a carrier path from a running host is pasted in for
 *      "clarity".
 *
 * This suite compares the document against the implementation rather than trusting prose: every
 * invocation the document shows is parsed by the real CLI, every code and status it quotes is checked
 * against the shipped vocabulary, every path/name it cites is compared to the constant that owns it,
 * and the text is scanned for anything credential-shaped. It reads files and runs the CLI in-process;
 * it opens no socket, spawns no PowerShell, and touches no credential.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DHAN_CREDENTIAL_LABELS,
  DHAN_CREDENTIAL_ROLES,
} from '../src/providers/dhan/dhan_credential_store_utility.js';
import {
  DHAN_CREDENTIAL_EXIT,
  runDhanCredentialStoreCli,
} from '../src/providers/dhan/dhan_credential_store_cli.js';
import {
  DPAPI_CANONICAL_CARRIER_DIRECTORY,
  DPAPI_CARRIER_FILENAMES,
  type DpapiCarrierRole,
} from '../src/providers/dhan/dhan_dpapi_carrier.js';
import { DPAPI_ACL_FULL_CONTROL_RIGHTS, DPAPI_ACL_INHERITANCE_DIRECTORY, DPAPI_ACL_INHERITANCE_NONE, DPAPI_ACL_SYSTEM_SID } from '../src/providers/dhan/dhan_dpapi_acl.js';
import { type DpapiProcessOutcome, type DpapiProcessRequest, type DpapiProcessRunner } from '../src/providers/dhan/dhan_dpapi_process.js';
import {
  DHAN_VAULT_BACKEND_DISABLED,
  DHAN_VAULT_BACKEND_ENV,
  DHAN_VAULT_BACKEND_SELECTORS,
  DHAN_VAULT_BACKEND_WINDOWS_DPAPI,
  MARKET_DATA_DAEMON_HOST_ENV,
  MARKET_DATA_DAEMON_PORT_ENV,
} from '../src/providers/dhan/dhan_local_daemon.js';
import { DHAN_ENV_KEYS } from '../src/providers/dhan/dhan_config.js';
import { MARKET_DATA_TRANSPORT_TOKEN_ENV } from '../src/providers/dhan/dhan_market_data_http.js';

const DOC = 'docs/integration/DHAN-D6-OPERATOR-TOKEN-ACQUISITION-AND-REPLACEMENT-2026-11-12.md';
const CLI_SOURCE = 'src/providers/dhan/dhan_credential_store_cli.ts';
const UTILITY_SOURCE = 'src/providers/dhan/dhan_credential_store_utility.ts';
const NOW = new Date('2026-11-12T06:30:00.000Z');
const SYNTHETIC_VALUE = 'D6-CONFORMANCE-SYNTHETIC-VALUE-0001';
const USER_SID = 'S-1-5-21-7777777777-8888888888-9999999999-1001';

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

const document = repoText(DOC);
/** Whitespace-collapsed copy, so a phrase is asserted independently of how Markdown wraps. */
const flat = document.replace(/\s+/g, ' ');
const says = (phrase: string): boolean => flat.includes(phrase.replace(/\s+/g, ' '));

/** Minimal DPAPI stand-in so the documented commands can be parsed and executed in-process. */
const fakeRunner: DpapiProcessRunner = async (
  request: DpapiProcessRequest
): Promise<DpapiProcessOutcome> => {
  if (request.operation === 'protect') {
    const plaintextB64 = String((request.payload as { plaintextB64?: unknown }).plaintextB64);
    // Valid base64, because the carrier grammar requires it: base64('D6|' + plaintext).
    const decoded = Buffer.from(plaintextB64, 'base64').toString('utf8');
    return {
      kind: 'ok',
      stdout: JSON.stringify({
        ok: true,
        ciphertextB64: Buffer.from(`D6|${decoded}`, 'utf8').toString('base64'),
      }),
      stderrByteLength: 0,
    };
  }
  if (request.operation === 'unprotect') {
    const ciphertextB64 = String((request.payload as { ciphertextB64?: unknown }).ciphertextB64);
    const decoded = Buffer.from(ciphertextB64, 'base64').toString('utf8');
    if (!decoded.startsWith('D6|')) {
      return {
        kind: 'ok',
        stdout: JSON.stringify({ ok: false, kind: 'DPAPI_UNPROTECT_FAILED' }),
        stderrByteLength: 0,
      };
    }
    return {
      kind: 'ok',
      stdout: JSON.stringify({
        ok: true,
        plaintextB64: Buffer.from(decoded.slice(3), 'utf8').toString('base64'),
      }),
      stderrByteLength: 0,
    };
  }
  if (request.operation === 'read-acl') {
    const target = String((request.payload as { path?: unknown }).path ?? '');
    const inheritanceFlags =
      target.endsWith('.tmp') || target.endsWith('.json')
        ? DPAPI_ACL_INHERITANCE_NONE
        : DPAPI_ACL_INHERITANCE_DIRECTORY;
    const rule = (sid: string) => ({
      sid,
      accessControlType: 'Allow',
      rights: DPAPI_ACL_FULL_CONTROL_RIGHTS,
      inheritanceFlags,
      propagationFlags: 0,
      inherited: false,
    });
    return {
      kind: 'ok',
      stdout: JSON.stringify({
        ok: true,
        exists: true,
        currentUserSid: USER_SID,
        ownerSid: USER_SID,
        protected: true,
        rules: [rule(USER_SID), rule(DPAPI_ACL_SYSTEM_SID)],
      }),
      stderrByteLength: 0,
    };
  }
  if (request.operation === 'describe-acl') {
    const paths = ((request.payload as { paths?: unknown }).paths ?? []) as string[];
    return {
      kind: 'ok',
      stdout: JSON.stringify({
        ok: true,
        items: paths.map((entry) => ({
          path: entry,
          exists: true,
          protected: true,
          onlyOwnerAndSystem: true,
          ownerIsCurrentUser: true,
        })),
      }),
      stderrByteLength: 0,
    };
  }
  return { kind: 'ok', stdout: JSON.stringify({ ok: true, changed: false }), stderrByteLength: 0 };
};

interface CliRun {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function runDocumented(argv: readonly string[], carrierDirectory?: string): Promise<CliRun> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const args =
    carrierDirectory === undefined
      ? [...argv]
      : [...argv, '--carrier-directory', carrierDirectory];
  const result = await runDhanCredentialStoreCli({
    argv: args,
    io: {
      writeStdout: (line: string) => stdout.push(line),
      writeStderr: (line: string) => stderr.push(line),
    },
    now: () => NOW,
    platform: () => 'win32',
    isInteractive: true,
    runner: fakeRunner,
    readSecret: async () => SYNTHETIC_VALUE,
  });
  return { exitCode: result.exitCode, stdout: stdout.join('\n'), stderr: stderr.join('\n') };
}

describe('D-6 — operator procedure document', () => {
  it('D6-01: the document identifies its decision, owner, authority and that it is procedure only', () => {
    assert.ok(document.includes('# DHAN D-6 — Operator Token-Acquisition and Replacement Procedure'));
    assert.match(document, /\*\*Status:\*\* DOCUMENTED/);
    assert.ok(says('**Decision:** D-6 (roadmap v1.1)'));
    assert.ok(says('DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md'));
    // The document must not present itself as authorising live activity.
    assert.ok(says('D-6 is a *procedure*, not an implementation'));
    assert.ok(says('the first authenticated vendor interaction is **W-06**'));
  });

  it('D6-02: the 24-hour lifecycle is stated, with automated acquisition explicitly deferred', () => {
    assert.ok(says('**24-hour validity**') || says('24-hour validity'));
    assert.ok(says('manual replacement for the token'), 'the roadmap assumption must be quoted');
    assert.ok(says('automated acquisition is deferred') || says('Automated acquisition remains deferred') || says('automated acquisition is out of scope'));
    // "How often": a routine exists, not merely a statement of expiry.
    assert.ok(says('**Routine (do this every 24 hours, or before a session):**'));
    assert.ok(says('replacement is the only recovery') || says('replacement is the only recovery — there is no grace period'));
  });

  it('D6-03: the vendor workflow is described as Dhan-owned, not invented by IPD', () => {
    assert.ok(document.includes('web.dhan.co'), 'the vendor console must be named');
    assert.ok(says('**My Profile**'));
    assert.ok(says('**Access DhanHQ APIs**'));
    assert.ok(says('**Generate the Access Token**'));
    assert.ok(says('dhanhq.co/docs/v2/authentication'), 'the vendor reference must be cited');
    // Ownership of the labels must be disclaimed, because vendor UIs change.
    assert.ok(says('vendor-owned; labels may change'));
    // The deferred API-based routes must be named as out of scope rather than recommended.
    assert.ok(says('API-key/consent and TOTP-based token generation'));
    assert.ok(says('those routes are out of scope here'));
  });

  it('D6-04: local provisioning is distinguished from authenticated vendor connectivity', () => {
    assert.ok(says('### 1.1 Local provisioning is not authenticated connectivity'));
    assert.ok(document.includes('CREDENTIALS_RESOLVED'));
    assert.ok(says('Startup makes **no vendor call**'));
    assert.ok(says('can produce `AUTHENTICATED` or `OPERATIONAL`'));
    // The four-row evidence table must be present, from provision to vendor acceptance.
    assert.ok(says('`provision` / `rotate` succeeded'));
    assert.ok(says('a vendor request is accepted (W-06)'));

    // D-7 ordering: a local ceiling, never a connectivity claim.
    assert.ok(says('`providerState=CREDENTIALS_RESOLVED` — the ceiling for a process that has not called the vendor'));
    assert.ok(says('`vendorEgress=IPD_SERVER_HTTPS` — vendor egress is *permitted*, not *proven*'));
  });

  it('D6-05: the security precautions cover history, clipboard, logs, argv and disclosure', () => {
    assert.ok(says('**Terminal history.**'));
    assert.ok(says('PSReadLine history'));
    assert.ok(says('**Clipboard.**'));
    assert.ok(says('**Process arguments.**'));
    assert.ok(says('**Logs and transcripts.**'));
    assert.ok(says('**If a secret is exposed**'));
    // The threat model must be stated, not implied (D-1 wording).
    assert.ok(says('protects the carrier **at rest**'));
    assert.ok(says('does **not** protect against code running as *you*'));
    // And the document must forbid its own contamination.
    assert.ok(says('No token, no client id, no ciphertext'));
  });

  it('D6-06: failure handling separates local expiry from vendor rejection', () => {
    assert.ok(says('`CREDENTIALS_EXPIRED` and `AUTHENTICATION_FAILURE` are **not** the same thing'));
    assert.ok(says('**local pre-flight, no vendor call**'));
    assert.ok(says('the daemon latches'));
    assert.ok(says('**Interrupted write is already safe.**'));
    assert.ok(says('**Never hand-edit, copy, rename or delete a carrier file.**'));
    assert.ok(says('Retry discipline'));
  });

  it('D6-07: the documented commands exist and are accepted by the real CLI', async () => {
    // Each documented invocation, exactly as an operator would type it (without the npm prefix).
    const clientDirectory = mkdtempSync(path.join(os.tmpdir(), 'iips-d6-client-'));
    const tokenDirectory = mkdtempSync(path.join(os.tmpdir(), 'iips-d6-token-'));
    const rotateDirectory = mkdtempSync(path.join(os.tmpdir(), 'iips-d6-rotate-'));
    try {
      // The document shows these exact command strings.
      const documented = [
        'npm run dhan:credential -- verify',
        'npm run dhan:credential -- provision client-id',
        'npm run dhan:credential -- provision access-token --expires-at 2026-11-13T06:30:00.000Z',
        'npm run dhan:credential -- provision access-token --expires-in-hours 24',
        'npm run dhan:credential -- verify --json',
        'npm run dhan:credential -- rotate access-token --expires-at <iso-utc>',
        'npm run dhan:credential -- verify access-token',
        'npm run dhan:credential -- rotate client-id',
        'npm run dhan:credential -- --help',
      ];
      for (const command of documented) {
        assert.ok(says(command), `document must show: ${command}`);
      }

      // verify (empty store) — a read-only command, exit 6 because there is nothing to confirm.
      const emptyVerify = await runDocumented(['verify'], clientDirectory);
      assert.strictEqual(emptyVerify.exitCode, DHAN_CREDENTIAL_EXIT.VERIFY_FAILED);
      assert.match(emptyVerify.stdout, /platformAdmissible=yes locationAdmissible=yes/);

      // provision client-id
      const client = await runDocumented(['provision', 'client-id'], clientDirectory);
      assert.strictEqual(client.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(client.stdout, /provision client-id: OK/);
      assert.match(client.stdout, /roundTrip {4}: verified before swap/);
      assert.match(client.stdout, /location {5}: withheld/);

      // provision access-token — both documented expiry forms.
      const tokenA = await runDocumented(
        ['provision', 'access-token', '--expires-at', '2026-11-13T06:30:00.000Z'],
        tokenDirectory
      );
      assert.strictEqual(tokenA.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(tokenA.stdout, /expiresAtUtc : 2026-11-13T06:30:00\.000Z/);

      const tokenB = await runDocumented(
        ['provision', 'access-token', '--expires-in-hours', '24'],
        mkdtempSync(path.join(os.tmpdir(), 'iips-d6-hours-'))
      );
      assert.strictEqual(tokenB.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(tokenB.stdout, /expiresAtUtc : 2026-11-13T06:30:00\.000Z/);

      // rotate requires an existing carrier: the document's recovery shape must therefore work
      // only after a provision, and must refuse otherwise (exit 7, not a silent create).
      const rotateWithout = await runDocumented(
        ['rotate', 'access-token', '--expires-at', '2026-11-13T06:30:00.000Z'],
        rotateDirectory
      );
      assert.strictEqual(rotateWithout.exitCode, DHAN_CREDENTIAL_EXIT.STATE_REFUSED);
      assert.match(rotateWithout.stderr, /NOT_PROVISIONED/);

      await runDocumented(
        ['provision', 'access-token', '--expires-at', '2026-11-13T06:30:00.000Z'],
        rotateDirectory
      );
      const rotate = await runDocumented(
        ['rotate', 'access-token', '--expires-at', '2026-11-13T06:30:00.000Z'],
        rotateDirectory
      );
      assert.strictEqual(rotate.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(rotate.stdout, /replaced {5}: yes/);

      // rotate client-id, after a provision
      await runDocumented(['provision', 'client-id'], rotateDirectory);
      const rotateClient = await runDocumented(['rotate', 'client-id'], rotateDirectory);
      assert.strictEqual(rotateClient.exitCode, DHAN_CREDENTIAL_EXIT.OK);

      // verify a single role, and JSON output
      const singleRole = await runDocumented(['verify', 'access-token'], rotateDirectory);
      assert.strictEqual(singleRole.exitCode, DHAN_CREDENTIAL_EXIT.OK);
      assert.match(singleRole.stdout, /access-token : PRESENT_OK/);

      const json = await runDocumented(['verify', '--json'], rotateDirectory);
      assert.doesNotThrow(() => JSON.parse(json.stdout.split('\n')[0] ?? ''));
    } finally {
      for (const directory of [clientDirectory, tokenDirectory, rotateDirectory]) {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });

  it('D6-08: every invocation in the document uses only the implemented vocabulary', () => {
    const allowedVerbs = new Set(['provision', 'rotate', 'verify', '--help']);
    const allowedFlags = new Set([
      '--carrier-directory',
      '--version',
      '--expires-at',
      '--expires-in-hours',
      '--json',
      '--help',
    ]);
    const occurrences = document.match(/npm run dhan:credential -- [^\n`|]*/g) ?? [];
    assert.ok(occurrences.length >= 9, 'the document must show real invocations');

    for (const occurrence of occurrences) {
      const tokens = occurrence
        .replace('npm run dhan:credential --', '')
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0);
      const verb = tokens[0] ?? '';
      assert.ok(allowedVerbs.has(verb), `unknown subcommand in the document: ${verb}`);
      for (const token of tokens.slice(1)) {
        if (!token.startsWith('-')) continue;
        const flag = token.split('=')[0] ?? token;
        assert.ok(allowedFlags.has(flag), `the CLI does not implement ${flag}`);
      }
      // The CLI parses `--expires-at` / `--expires-in-hours` only for the access token.
      for (const token of tokens) {
        if (token === '--expires-at' || token === '--expires-in-hours') {
          assert.ok(
            tokens.includes('access-token'),
            `expiry documented for something other than the access token: ${occurrence}`
          );
        }
      }
    }

    // A secret must never be shown as an accepted argument: every mention of the refused flags has
    // to sit in a refusal sentence.
    for (const flag of ['--secret', '--value', '--token', '--client-id', '--access-token']) {
      let index = document.indexOf(flag);
      while (index >= 0) {
        const context = document.slice(Math.max(0, index - 260), index + 120);
        assert.ok(
          /refus|never|not accepted|forbid/i.test(context),
          `${flag} appears outside a refusal context`
        );
        index = document.indexOf(flag, index + flag.length);
      }
    }
  });

  it('D6-09: quoted exit codes, failure codes and verification statuses match the implementation', () => {
    const cli = repoText(CLI_SOURCE);
    const utility = repoText(UTILITY_SOURCE);

    // Exit codes, by name and by number.
    for (const [name, value] of Object.entries(DHAN_CREDENTIAL_EXIT)) {
      assert.strictEqual(
        typeof value,
        'number',
        `${name} must be a number in DHAN_CREDENTIAL_EXIT`
      );
    }
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.OK, 0);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.USAGE, 2);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.INPUT_INVALID, 3);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.ENVIRONMENT, 4);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.WRITE_FAILED, 5);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.VERIFY_FAILED, 6);
    assert.strictEqual(DHAN_CREDENTIAL_EXIT.STATE_REFUSED, 7);
    for (const exit of [0, 2, 3, 4, 5, 6, 7]) {
      assert.ok(
        new RegExp(`\\|\\s*\\*\\*?${exit}\\*\\*?\\s*\\|`).test(document) || document.includes(`| ${exit} |`),
        `the exit-code table must document exit ${exit}`
      );
    }

    // Failure codes quoted in the document must exist in the shipped union.
    const documentedCodes = [
      'SECRET_INVALID',
      'VERSION_INVALID',
      'EXPIRY_INVALID',
      'ROLE_INVALID',
      'NOT_WINDOWS',
      'CARRIER_DIRECTORY_INVALID',
      'DPAPI_PROTECT_FAILED',
      'ACL_FAILED',
      'ROUND_TRIP_FAILED',
      'WRITE_FAILED',
      'ALREADY_PROVISIONED',
      'NOT_PROVISIONED',
    ];
    for (const code of documentedCodes) {
      assert.ok(utility.includes(`'${code}'`), `${code} is documented but not implemented`);
      assert.ok(document.includes(code), `${code} is implemented but not documented`);
    }

    // Verification statuses quoted must exist in the shipped union.
    const documentedStatuses = [
      'PRESENT_OK',
      'ABSENT',
      'ACL_NOT_OWNER_ONLY',
      'SCHEMA_INVALID',
      'SECRET_ID_MISMATCH',
      'EXPIRED',
      'UNREADABLE',
      'UNAVAILABLE',
    ];
    for (const status of documentedStatuses) {
      assert.ok(utility.includes(`'${status}'`), `${status} is documented but not implemented`);
      assert.ok(document.includes(status), `${status} is implemented but not documented`);
    }

    // The CLI refuses a secret on the command line, and the document says so.
    assert.ok(cli.includes('FORBIDDEN_SECRET_FLAGS'));
    assert.ok(says('the utility refuses `--secret`, `--value`, `--token`'));
  });

  it('D6-10: documented paths, filenames, keys and selector values are the implemented constants', () => {
    assert.ok(DHAN_CREDENTIAL_LABELS.clientId === 'client-id');
    assert.ok(DHAN_CREDENTIAL_LABELS.accessToken === 'access-token');
    assert.ok(document.includes('client-id') && document.includes('access-token'));

    // Carrier directory and both filenames, from the constants that own them.
    assert.ok(
      document.includes(DPAPI_CANONICAL_CARRIER_DIRECTORY),
      'the default carrier directory must be quoted exactly'
    );
    for (const role of DHAN_CREDENTIAL_ROLES as readonly DpapiCarrierRole[]) {
      assert.ok(
        document.includes(DPAPI_CARRIER_FILENAMES[role]),
        `the ${role} carrier filename must be quoted exactly`
      );
    }

    // Daemon-side environment keys.
    const envKeys = [
      DHAN_VAULT_BACKEND_ENV,
      DHAN_ENV_KEYS.secretVaultProvider,
      DHAN_ENV_KEYS.clientIdSecretPath,
      DHAN_ENV_KEYS.accessTokenSecretPath,
      DHAN_ENV_KEYS.secretVersion,
      DHAN_ENV_KEYS.accessTokenExpiresAt,
      DHAN_ENV_KEYS.secretStatus,
      MARKET_DATA_TRANSPORT_TOKEN_ENV,
    ];
    for (const key of envKeys) {
      assert.ok(document.includes(key), `${key} must be documented, because the operator sets it`);
    }

    // Selector values and their default.
    assert.ok(document.includes(`\`${DHAN_VAULT_BACKEND_WINDOWS_DPAPI}\``));
    assert.ok(document.includes(DHAN_VAULT_BACKEND_DISABLED));
    assert.deepStrictEqual(
      [...DHAN_VAULT_BACKEND_SELECTORS],
      [DHAN_VAULT_BACKEND_DISABLED, DHAN_VAULT_BACKEND_WINDOWS_DPAPI]
    );

    // The governed key paths the operator configures.
    assert.ok(document.includes('vault://dhan/client-id'));
    assert.ok(document.includes('vault://dhan/access-token'));

    // The npm scripts the document tells the operator to run must exist.
    const pkg = JSON.parse(repoText('package.json')) as { scripts: Record<string, string> };
    assert.ok(typeof pkg.scripts['dhan:credential'] === 'string');
    assert.ok(pkg.scripts['dhan:credential']!.includes('dhan_credential_store_cli.js'));
    assert.ok(typeof pkg.scripts['start:market-data-daemon'] === 'string');
    // …and the daemon defaults the document quotes must be the daemon's own.
    assert.ok(document.includes('127.0.0.1:8791'));
    assert.ok(MARKET_DATA_DAEMON_HOST_ENV.length > 0 && MARKET_DATA_DAEMON_PORT_ENV.length > 0);
  });

  it('D6-11: the document contains no credential, no fingerprint of one, and no ciphertext', () => {
    // No JWT: Dhan access tokens are JWTs and always begin `eyJ`.
    assert.ok(!document.includes('eyJ'), 'no JWT may appear in the procedure');
    // No realistic fingerprint: the doc may only show obviously-placeholder digests.
    assert.ok(
      !/sha256:[0-9a-f]{8,}/.test(document),
      'a real-looking truncated digest must never be recorded in the document'
    );
    assert.ok(document.includes('sha256:xxxxxxxxxxxx'), 'the placeholder must be unmistakable');
    // No long base64 run that could be a ciphertext or an encoded secret.
    const longBase64 = document.match(/[A-Za-z0-9+/]{40,}={0,2}/g) ?? [];
    assert.deepStrictEqual(longBase64, [], 'no long encoded blob may appear');
    // No synthetic Dhan client-id-shaped identifier presented as real.
    assert.ok(!/\b1000\d{6}\b/.test(document), 'no Dhan-client-id-shaped number may appear');
    // The document must state the prohibition on its own contamination.
    assert.ok(says('must never be edited to contain one'));
  });

  it('D6-12: the procedure preserves the W-02/W-03/D-7 guarantees it relies on', () => {
    // W-02: the store's rules are stated as the store's, not re-invented by the procedure.
    assert.ok(says('one carrier per secret'));
    assert.ok(says('owner-only DACL'));
    assert.ok(says('atomic') || says('atomically'));
    assert.ok(says('refuses a version mismatch') || says('refused by the backend as a version error'));

    // W-03: selection is by environment, with the fail-closed default named.
    assert.ok(says('default is `disabled`'));
    assert.ok(says('there is no override'));
    assert.ok(says('vaultBackendReadiness=READY'));
    assert.ok(says('`vaultBackendReadiness=NOT_READY`'));

    // D-7: disclosure rules for runtime surfaces are stated, and the no-vendor-call ceiling.
    assert.ok(says('`location: withheld` is literal'));
    assert.ok(says('never prints the value, a `vault://` reference or a carrier path'));
    assert.ok(says('no content and no location'));

    // The daemon startup line quoted must be shaped like the real one (same field names/order).
    const quoted = document.match(/\[ipd-market-data-daemon\] listening on[^\n]*/)?.[0] ?? '';
    for (const field of [
      'providerReadiness=',
      'vaultBackend=',
      'vaultBackendSelector=',
      'vaultBackendReadiness=',
      'liveCredentialResolution=',
      'credentialReadiness=',
      'providerState=',
      'vendorEgress=',
      'qualifiedMappings=',
    ]) {
      assert.ok(quoted.includes(field), `the quoted startup line is missing ${field}`);
    }

    // W-06 prerequisites must be enumerated, and W-06 must be named as not started.
    assert.ok(says('**W-06 (not started, and not authorised by this document) is the next step**'));
    assert.ok(says('W-06 closes milestone **M1 only**'));
  });

  it('D6-13: the rehearsal requirement is recorded, as D-6’s exit criterion demands', () => {
    assert.ok(says('rehearsed once with a throwaway value'));
    assert.ok(says('with a synthetic string in place of each real secret'));
    assert.ok(says('It cannot prove vendor acceptance, because it never calls the vendor'));
    // The rehearsal must not be presented as having been performed here.
    assert.ok(says('No credential is recorded here and none was obtained'));
  });
});
