/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P7 Transport Authentication Parsing & Startup Credential Validation
 *
 * WHY THIS SUITE EXISTS
 * The W-06 investigation found the daemon refusing every `Authorization: Bearer …` request with
 * `401 UNAUTHENTICATED` while the operator re-entered the same token repeatedly. The gate was
 * correct and useless at the same time: it compared bytes exactly, told the caller nothing, and
 * could be defeated by a single invisible character in either copy of the secret. Three concrete
 * defects came out of that:
 *
 *   1. the auth-scheme test was `startsWith('Bearer ')` — case-sensitive, one literal space, and
 *      stricter than RFC 7235 §2.1, which makes the scheme case-insensitive;
 *   2. the configured value was never checked for transmittability, so a NBSP, a zero-width space
 *      or a trailing CR produced a listener that rejected every request forever, with a diagnostic
 *      identical to a wrong token;
 *   3. because the value is captured at startup and never re-read, no amount of client-side
 *      re-entry could fix (2) — and nothing said so.
 *
 * This suite pins the parse rules, the startup refusal, the client-side preflight and the
 * capture-at-startup semantics. Everything here is synthetic: a real `node:http` server on
 * loopback with a stub provider transport. No vendor, no credential, no DPAPI, no carrier.
 *
 * The Windows operator procedure (§7 of the W-06 recovery doc) is covered structurally by the
 * `W06-WIN-xx` cases and executed for real by the `W06-PS-xx` cases where a PowerShell executable
 * is present (opt-in, exactly like `w02_acceptance_process.test.ts`, because whether a CI image
 * ships `pwsh` is not this repository's contract).
 */
import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as net from 'node:net';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import {
  createMarketDataHttpServer,
  parseBearerAuthorization,
  validateTransportToken,
  MARKET_DATA_ROUTES,
  MarketDataTransportClient,
} from '../src/providers/dhan/dhan_market_data_http.js';
import { startMarketDataDaemon } from '../src/providers/dhan/dhan_local_daemon.js';
import type { DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import { DhanApiClient } from '../src/providers/dhan/dhan_api_client.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

/** Synthetic, obvious, and never a real secret. ASCII by construction. */
const TOKEN = 'p7-synthetic-transport-token-0001';
const RECOVERY_DOC = 'docs/integration/DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md';

const MAPPING = {
  companyId: 'COMP-SYNTH-P7',
  isin: 'INE000SYNT71',
  securityId: 'ISIN:INE000SYNT71:EQ',
  exchange: 'NSE' as const,
  symbol: 'SYNT7',
  exchangeSegment: 'NSE_EQ' as const,
  dhanSecurityId: 'SYNTH-NSE-EQ-7001',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const,
  instrumentType: 'EQUITY' as const,
  active: true,
};

/** A provider transport that records calls and never leaves the process. */
function countingTransport(): DhanHttpTransport & { readonly calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async send() {
      calls += 1;
      return { status: 200, bodyText: '{"status":"success","data":{}}' };
    },
  };
}

function makeService(transport: DhanHttpTransport): DhanMarketDataService {
  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);
  const master = new SecurityMaster();
  master.registerEntity({
    companyId: 'COMP-SYNTH-P7',
    isin: 'INE000SYNT71',
    companyName: 'Synth P7',
    industry: 'T',
    sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [{ exchange: 'NSE', symbol: 'SYNT7', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });
  const client = new DhanApiClient({
    config: {
      baseUrl: 'https://synthetic.invalid',
      timeoutMs: 1000,
      readiness: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
    } as never,
    transport,
    credentialResolver: {
      resolve: async () => ({ accessToken: 'synthetic-dhan-token', clientId: 'synthetic-client' }),
    } as never,
  });
  return new DhanMarketDataService({
    client,
    securityMaster: master,
    instrumentRegistry: registry,
    now: () => new Date('2026-09-25T10:00:00.000Z'),
  });
}

async function withServer(
  options: { token?: string; env?: Record<string, string | undefined> },
  fn: (port: number) => Promise<void>
): Promise<void> {
  const server: Server = createMarketDataHttpServer({
    service: makeService(countingTransport()),
    ...(options.token !== undefined ? { token: options.token } : {}),
    env: options.env ?? {},
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/** `fetch` cannot express the raw header forms this suite needs, so the socket is written directly. */
function rawStatus(port: number, requestHead: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => socket.write(requestHead));
    let buffer = '';
    socket.on('data', (chunk) => (buffer += chunk.toString('latin1')));
    socket.on('end', () => {
      const statusLine = buffer.split('\r\n')[0] ?? '';
      const status = Number(statusLine.split(' ')[1]);
      Number.isInteger(status) ? resolve(status) : reject(new Error('no status line'));
    });
    socket.on('error', reject);
  });
}

function healthHead(headerLines: string): string {
  return `GET ${MARKET_DATA_ROUTES.health} HTTP/1.1\r\nHost: 127.0.0.1\r\n${headerLines}Connection: close\r\n\r\n`;
}

async function statusFor(port: number, authorization: string | null): Promise<number> {
  return rawStatus(port, healthHead(authorization === null ? '' : `Authorization: ${authorization}\r\n`));
}

describe('DHAN-P7 transport authentication parsing (synthetic)', () => {
  it('P7-01: the Bearer scheme is matched case-insensitively (RFC 7235 §2.1)', () => {
    for (const scheme of ['Bearer', 'bearer', 'BEARER', 'BeArEr']) {
      assert.strictEqual(
        parseBearerAuthorization(`${scheme} ${TOKEN}`),
        TOKEN,
        `the ${scheme} scheme must be accepted`
      );
    }
    // A scheme that is not Bearer is still refused, in any case.
    for (const scheme of ['Basic', 'Token', 'bearerx', 'xBearer']) {
      assert.strictEqual(parseBearerAuthorization(`${scheme} ${TOKEN}`), undefined, `${scheme} must be refused`);
    }
  });

  it('P7-02: valid SP/HTAB separators are accepted and surrounding whitespace is tolerated', () => {
    for (const header of [
      `Bearer ${TOKEN}`,
      `Bearer\t${TOKEN}`,
      `Bearer  ${TOKEN}`,
      `Bearer \t ${TOKEN}`,
      `  Bearer ${TOKEN}`,
      `Bearer ${TOKEN}  `,
      `Bearer ${TOKEN}\t`,
    ]) {
      assert.strictEqual(parseBearerAuthorization(header), TOKEN, `must parse: ${JSON.stringify(header)}`);
    }
  });

  it('P7-03: malformed credentials yield undefined and never a partial value', () => {
    for (const header of [
      '',
      'Bearer',
      'Bearer ',
      'Bearer  ',
      TOKEN,
      `Bearer${TOKEN}`,
      'Bearer: ' + TOKEN,
      `Bearer ${TOKEN} extra`,
      'Bearer\ttab\tinside',
    ]) {
      assert.strictEqual(
        parseBearerAuthorization(header),
        undefined,
        `must not parse: ${JSON.stringify(header)}`
      );
    }
    // A repeated header is joined by Node as `a, b`; that is not one credential.
    assert.strictEqual(parseBearerAuthorization(`${TOKEN}, ${TOKEN}`), undefined);
    assert.strictEqual(parseBearerAuthorization([`Bearer ${TOKEN}`, `Bearer ${TOKEN}`]), undefined);
    assert.strictEqual(parseBearerAuthorization(undefined), undefined);
  });

  it('P7-04: the header forms the investigation captured now authenticate, and only those', async () => {
    await withServer({ token: TOKEN }, async (port) => {
      // Accepted: every RFC-valid spelling of the same credential.
      for (const header of [
        `Bearer ${TOKEN}`,
        `bearer ${TOKEN}`,
        `BEARER ${TOKEN}`,
        `Bearer\t${TOKEN}`,
        `Bearer  ${TOKEN}`,
      ]) {
        assert.strictEqual(await statusFor(port, header), 200, `must authenticate: ${JSON.stringify(header)}`);
      }
      // Refused: wrong credential, absent header, malformed scheme, empty credential.
      for (const header of [
        `Bearer ${TOKEN}x`,
        `Bearer ${TOKEN.slice(0, -1)}`,
        `Bearer wrong`,
        '',
        `Basic ${TOKEN}`,
        `Bearer ${TOKEN} extra`,
        null,
      ]) {
        assert.strictEqual(await statusFor(port, header), 401, `must refuse: ${JSON.stringify(header)}`);
      }
    });
  });

  it('P7-05: the credential comparison is constant-time, and that is pinned structurally', () => {
    // WHY STRUCTURAL. `timingSafeEqual(a, b)` and `a === b` are behaviourally identical; no
    // black-box test can tell them apart, so a suite that claims to cover this by behaviour is
    // lying. The property is therefore pinned where it lives — in the source — because the
    // realistic future regression is a "simplification" of exactly this function. A source
    // assertion is not a proof of timing behaviour; it is proof that the constant-time primitive
    // is still the one in use.
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_market_data_http.ts'),
      'utf8'
    );
    const match = /function tokenMatches\([\s\S]*?\n}/.exec(source);
    assert.ok(match, 'tokenMatches must still exist');
    const body = match[0];

    assert.ok(/a\.length !== b\.length/.test(body), 'the explicit length guard must precede the compare');
    assert.ok(
      /return timingSafeEqual\(a, b\)/.test(body),
      'the comparison must delegate to crypto.timingSafeEqual'
    );
    // No string equality on the credential anywhere in the comparison, in either direction.
    const withoutLengthGuard = body.replace(/a\.length !== b\.length/g, '');
    assert.ok(
      !/===|!==/.test(withoutLengthGuard),
      'the credential must never be compared with === / !== (not constant-time)'
    );
    // Anticipate the obvious wrong fix: comparing `provided` to `expected` directly.
    assert.ok(!/provided\s*===|===\s*expected/.test(body), 'direct string comparison is forbidden');

    // And the lengths used by the guard are byte lengths, not UTF-16 code-unit counts, so the
    // guard cannot admit two different byte sequences.
    assert.ok(/Buffer\.from\(provided\)/.test(body) && /Buffer\.from\(expected\)/.test(body));
  });

  it('P7-06: a same-length wrong credential is refused (constant-time path exercised)', async () => {
    await withServer({ token: TOKEN }, async (port) => {
      assert.strictEqual(
        await statusFor(port, `Bearer ${'p7-synthetic-transport-token-0002'}`),
        401,
        'a same-length, one-character-different credential must be refused'
      );
      assert.strictEqual(await statusFor(port, `Bearer ${TOKEN}`), 200);
    });
  });

  it('P7-07: startup refuses a missing, blank or whitespace-only transport token', () => {
    for (const token of [undefined, '', '   ', '\t', '\r\n', ' \t \r\n ']) {
      assert.throws(
        () => createMarketDataHttpServer({ service: makeService(countingTransport()), token, env: {} }),
        /is not set; refusing to start an unauthenticated market-data transport/,
        `must refuse: ${JSON.stringify(token)}`
      );
    }
    // Unset in the environment is the same refusal, which is what keeps a misconfigured host
    // from ever exposing an unauthenticated endpoint.
    assert.throws(
      () => createMarketDataHttpServer({ service: makeService(countingTransport()), env: {} }),
      /is not set; refusing to start/
    );
  });

  it('P7-08: startup refuses whitespace-contaminated values, and says which kind', () => {
    for (const token of [`${TOKEN} `, ` ${TOKEN}`, `${TOKEN}\r`, `${TOKEN}\n`, `${TOKEN}\r\n`, `${TOKEN}  `, 'abc def']) {
      assert.strictEqual(
        validateTransportToken(token),
        'TRANSPORT_TOKEN_WHITESPACE',
        `must classify as whitespace: ${JSON.stringify(token)}`
      );
      assert.throws(
        () => createMarketDataHttpServer({ service: makeService(countingTransport()), token, env: {} }),
        /contains whitespace/,
        `must refuse: ${JSON.stringify(token)}`
      );
    }
  });

  it('P7-09: startup refuses non-ASCII and control characters, including invisible ones', () => {
    const nonAscii = [
      'p7-token-\u00e9', // é
      'p7-token-\u00a0x', // NBSP (also whitespace; ASCII is the accurate diagnosis)
      'p7-token-\u200bx', // zero-width space
      'p7-token-\u2019x', // right single quote pasted from a document
      'p7-token-\u2013x', // en dash
      'p7-token-\u0000x', // NUL
      'p7-token-\u007fx', // DEL
      '\ufeffp7-token', // BOM
    ];
    for (const token of nonAscii) {
      assert.strictEqual(
        validateTransportToken(token),
        'TRANSPORT_TOKEN_NOT_ASCII',
        `must classify as non-ASCII: ${JSON.stringify(token)}`
      );
      assert.throws(
        () => createMarketDataHttpServer({ service: makeService(countingTransport()), token, env: {} }),
        /contains non-ASCII or control characters/,
        `must refuse: ${JSON.stringify(token)}`
      );
    }
    // The refusal must never echo the value it refused.
    for (const token of nonAscii) {
      try {
        createMarketDataHttpServer({ service: makeService(countingTransport()), token, env: {} });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        assert.ok(!message.includes('p7-token'), 'the refused value must not be echoed');
        assert.ok(!message.includes(token.slice(0, 23)), 'not even the token prefix');
      }
    }
  });

  it('P7-10: an ASCII token is accepted and reported as usable', () => {
    for (const token of [TOKEN, 'a', 'A1', 'token.with.dots-and_underscores~!@#$%^&*()']) {
      assert.strictEqual(validateTransportToken(token), null, `must accept: ${JSON.stringify(token)}`);
    }
    assert.strictEqual(validateTransportToken(undefined), 'TRANSPORT_TOKEN_MISSING');
    assert.strictEqual(validateTransportToken(''), 'TRANSPORT_TOKEN_MISSING');
    assert.strictEqual(validateTransportToken('  '), 'TRANSPORT_TOKEN_MISSING');
  });

  it('P7-11: the daemon captures the token once at startup and never re-reads it', async () => {
    const env: Record<string, string | undefined> = {
      IIPS_MARKET_DATA_TRANSPORT_TOKEN: TOKEN,
      IIPS_MARKET_DATA_DAEMON_HOST: '127.0.0.1',
      IIPS_MARKET_DATA_DAEMON_PORT: '0',
    };
    const started = await startMarketDataDaemon({ env, port: 0 });
    assert.strictEqual(started.ok, true);
    if (!started.ok) return;
    try {
      const port = started.diagnostics.port;
      assert.strictEqual(await statusFor(port, `Bearer ${TOKEN}`), 200, 'the captured value authenticates');

      // Mutate the source object the daemon was started from: a running process cannot be
      // repaired by re-entering the token, which is the whole point of validating it at startup.
      env.IIPS_MARKET_DATA_TRANSPORT_TOKEN = 'rotated-after-start';
      assert.strictEqual(await statusFor(port, `Bearer ${TOKEN}`), 200, 'still the captured value');
      assert.strictEqual(
        await statusFor(port, 'Bearer rotated-after-start'),
        401,
        'the new value is not observed by the running daemon'
      );

      // And the diagnostics never contain the credential.
      assert.ok(!JSON.stringify(started.diagnostics).includes(TOKEN));
    } finally {
      await started.handle.shutdown();
    }
  });

  it('P7-12: the daemon refuses to start on an untransmittable token rather than listening', async () => {
    for (const [token, code] of [
      [`${TOKEN} `, 'TRANSPORT_TOKEN_WHITESPACE'],
      ['p7-token-\u00e9', 'TRANSPORT_TOKEN_NOT_ASCII'],
      [undefined, 'TRANSPORT_TOKEN_MISSING'],
    ] as const) {
      const started = await startMarketDataDaemon({
        env: { ...(token === undefined ? {} : { IIPS_MARKET_DATA_TRANSPORT_TOKEN: token }) },
        port: 0,
      });
      assert.strictEqual(started.ok, false, `must refuse startup for ${JSON.stringify(token)}`);
      if (started.ok) continue;
      assert.strictEqual(started.code, code);
      assert.strictEqual(started.phase, 'validate');
      assert.ok(!started.error.includes(TOKEN), 'the refusal must not echo the value');
    }
  });

  it('P7-13: /v1/health is behind the same gate as every other route', async () => {
    const transport = countingTransport();
    const service = makeService(transport);
    const server = createMarketDataHttpServer({ service, token: TOKEN, env: {} });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    try {
      // Unauthenticated health must not answer 200 and must not reach the service.
      assert.strictEqual(await statusFor(port, null), 401);
      const body = await new Promise<string>((resolve, reject) => {
        const socket = net.connect(port, '127.0.0.1', () => socket.write(healthHead('')));
        let buffer = '';
        socket.on('data', (chunk) => (buffer += chunk.toString('utf8')));
        socket.on('end', () => resolve(buffer));
        socket.on('error', reject);
      });
      assert.ok(body.includes('{"error":{"code":"UNAUTHENTICATED","message":"missing or invalid transport credential"}}'));

      // The same uniform body protects /v1/quotes and /v1/freshness: the gate precedes routing.
      for (const routePath of [MARKET_DATA_ROUTES.quotes, MARKET_DATA_ROUTES.freshness, '/v1/does-not-exist']) {
        const status = await rawStatus(
          port,
          `${routePath === MARKET_DATA_ROUTES.freshness ? 'GET' : 'POST'} ${routePath} HTTP/1.1\r\nHost: 127.0.0.1\r\nAuthorization: Bearer wrong\r\nContent-Length: 0\r\nConnection: close\r\n\r\n`
        );
        assert.strictEqual(status, 401, `${routePath} must be gated before routing`);
      }

      // Authenticated health answers normally, and still opens no vendor socket.
      assert.strictEqual(await statusFor(port, `Bearer ${TOKEN}`), 200);
      assert.strictEqual(transport.calls, 0, 'health must never call the provider');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('P7-14: the consumer client refuses an untransmittable credential before sending', async () => {
    for (const token of [`${TOKEN} `, 'p7-token-\u00e9', '']) {
      const client = new MarketDataTransportClient('http://127.0.0.1:1', token, { env: {} });
      const outcome = await client.getQuote({
        companyId: 'COMP-SYNTH-P7',
        securityIdentity: buildD114SecurityIdentity('INE000SYNT71', 'EQ')!,
      });
      assert.strictEqual(outcome.ok, false);
      if (outcome.ok) continue;
      assert.strictEqual(outcome.failure.code, 'UNAUTHENTICATED');
      // A preflight refusal carries no HTTP status: no request was made.
      assert.strictEqual(outcome.failure.httpStatus, undefined);
    }
  });

  it('P7-15: the client and server agree on what a usable token is', () => {
    // One validator, two callers. Anything the server refuses at startup must also be refused
    // by the client's preflight, or the operator gets a 401 they cannot explain.
    for (const token of [TOKEN, `${TOKEN} `, ' x', 'p7-\u00e9', 'a\tb', '']) {
      const serverSide = validateTransportToken(token);
      const clientSide = validateTransportToken(token);
      assert.strictEqual(serverSide, clientSide, `classification must not depend on the caller: ${token}`);
    }
  });
});

// ---------------------------------------------------------------------------------------------
// Operator workflow. The structural cases always run; the executed cases need PowerShell.
// ---------------------------------------------------------------------------------------------

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function whichPowerShell(): string | null {
  for (const candidate of ['pwsh', 'powershell']) {
    const probe = spawnSync(
      candidate,
      ['-NoProfile', '-NonInteractive', '-Command', '[Console]::Out.Write((Get-Process -Id $PID).Path)'],
      { encoding: 'utf8', timeout: 20_000 }
    );
    if (probe.status !== 0) continue;
    const absolute = String(probe.stdout ?? '').trim();
    if (absolute.length > 0) return absolute;
  }
  return null;
}

describe('DHAN-P7 Windows operator workflow', () => {
  it('W06-WIN-01: the procedure enters the token once and shares it with the daemon and the client', () => {
    const doc = repoText(RECOVERY_DOC);

    // One hidden-input prompt per session, and it writes a session variable — not a file, not an
    // argument. Two sessions exist (the daemon's and the health check's); neither ever asks twice.
    assert.strictEqual(
      (doc.match(/Read-Host -AsSecureString/g) ?? []).length,
      2,
      'each session must prompt exactly once'
    );
    assert.ok(doc.includes('[System.Net.NetworkCredential]::new('), 'the secure string must be converted in-process');
    assert.ok(doc.includes('$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN'), 'it must land in the session environment');

    // The daemon is launched from the same session, so it inherits that exact value.
    assert.ok(
      /Start-Process[^\n]*npm|npm run start:market-data-daemon/.test(doc),
      'the daemon must be launched from the session that holds the value'
    );
    // The health check reads the same variable; it is never re-typed.
    assert.ok(doc.includes('Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN"'));
  });

  it('W06-WIN-02: the procedure never persists the token or touches the Dhan credential lifecycle', () => {
    const doc = repoText(RECOVERY_DOC);
    // No write of the transport token to disk, no DPAPI command, no credential rotation.
    assert.ok(!/Set-Content[^\n]*TRANSPORT_TOKEN/i.test(doc), 'the token must never be written to a file');
    assert.ok(!/Out-File[^\n]*TRANSPORT_TOKEN/i.test(doc), 'the token must never be written to a file');
    assert.ok(!/Export-Clixml/i.test(doc), 'the token must never be serialised');
    // The credential CLI may be *named* (in the "do not do this" table) but must never be
    // executed by any command the procedure gives the operator.
    const executable = [...doc.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1] ?? '').join('\n');
    assert.ok(!/dhan:credential/.test(executable), 'the Dhan credential store must not be touched');
    // And it says so, so the next operator does not "helpfully" rotate something.
    assert.ok(
      /rotation is not remediation/.test(doc),
      'the procedure must state that rotating the transport token is not the remedy'
    );
    assert.ok(/does not rotate, replace or disturb/.test(doc), 'restarting must be stated as harmless to DPAPI');
    assert.ok(/DPAPI[^\n]*unchanged|unchanged[^\n]*DPAPI/i.test(doc));
  });

  it('W06-WIN-03: the procedure records a value-free fingerprint step, not the value', () => {
    const doc = repoText(RECOVERY_DOC);
    assert.ok(/SHA256|sha256/.test(doc), 'the fingerprint must be a hash, not the value');
    assert.ok(/length|Length/.test(doc), 'the length is the cheap first discriminator');
    // No command in the procedure echoes the variable itself (only derived values are printed).
    for (const line of doc.split('\n')) {
      if (!/^\s*(Write-(Host|Output)|echo)\b/.test(line)) continue;
      assert.ok(
        !line.includes('$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN'),
        `the token must never be printed: ${line.trim().slice(0, 60)}`
      );
    }
  });

  it('W06-PS-01: the one-entry procedure authenticates a real daemon (executed where PowerShell exists)', async (t) => {
    if (process.env.IIPS_POWERSHELL_RUNTIME_TESTS !== '1') {
      t.skip('set IIPS_POWERSHELL_RUNTIME_TESTS=1 on a host with PowerShell to execute the real client');
      return;
    }
    const shell = whichPowerShell();
    if (shell === null) {
      t.skip('IIPS_POWERSHELL_RUNTIME_TESTS=1 was set but no PowerShell executable could be resolved');
      return;
    }

    await withServer({ token: TOKEN }, async (port) => {
      // The exact client expression the procedure documents, executed for real. The token
      // arrives through the child's environment so it never appears on a command line.
      const script = [
        '$headers = @{ Authorization = "Bearer $env:IIPS_MARKET_DATA_TRANSPORT_TOKEN" }',
        `$r = Invoke-WebRequest -Uri 'http://127.0.0.1:${port}${MARKET_DATA_ROUTES.health}' -Headers $headers -UseBasicParsing`,
        '[Console]::Out.Write($r.StatusCode)',
      ].join('; ');
      const run = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf8',
        timeout: 30_000,
        env: { ...process.env, IIPS_MARKET_DATA_TRANSPORT_TOKEN: TOKEN },
      });
      assert.strictEqual(run.status, 0, `PowerShell failed: ${run.stderr}`);
      assert.strictEqual(String(run.stdout).trim(), '200', 'the documented client must authenticate');
      assert.ok(!String(run.stdout).includes(TOKEN), 'the client must not echo the token');
    });
  });

  it('W06-PS-02: a whitespace-contaminated value fails the same way the operator saw (executed where PowerShell exists)', (t) => {
    if (process.env.IIPS_POWERSHELL_RUNTIME_TESTS !== '1') {
      t.skip('set IIPS_POWERSHELL_RUNTIME_TESTS=1 on a host with PowerShell to execute the real client');
      return;
    }
    const shell = whichPowerShell();
    if (shell === null) {
      t.skip('IIPS_POWERSHELL_RUNTIME_TESTS=1 was set but no PowerShell executable could be resolved');
      return;
    }
    // Reproduces the W-06 symptom and proves the new startup refusal catches the cause first:
    // the same contaminated value that used to yield an unexplainable 401 is now refused at
    // launch with a typed code. Nothing is sent.
    const script = [
      `$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN = '${TOKEN} '`,
      `node -e "const { validateTransportToken } = require('./dist/src/providers/dhan/dhan_market_data_http.js'); process.stdout.write(String(validateTransportToken(process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN)))"`,
    ].join('; ');
    const run = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', script], {
      encoding: 'utf8',
      timeout: 30_000,
      cwd: process.cwd(),
    });
    assert.strictEqual(run.status, 0, `PowerShell failed: ${run.stderr}`);
    assert.strictEqual(String(run.stdout).trim(), 'TRANSPORT_TOKEN_WHITESPACE');
  });
});
