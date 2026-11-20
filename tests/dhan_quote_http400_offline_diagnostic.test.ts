/**
 * Offline quote-400 diagnostic safety contracts. No Dhan credentials, DPAPI reads,
 * vendor requests, or Windows processes are involved in this suite.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SCRIPT = resolve(ROOT, 'scripts/diagnose-dhan-quote-http400.mjs');
// Dynamic URL import keeps the standalone .mjs outside the compiled dist/ tree.
const tool = await import(pathToFileURL(SCRIPT).href);

const goodGit = { headMatchesPin: true, treeMatchesPin: true, clean: true };
const goodBuild = { parity: { classification: 'MATCHES_FRESH_LOCAL_EMIT' }, diskChangedAfterProcessStart: false };
const goodManifest = { classification: 'CURRENT_CHECKED_IN_MANIFEST_NOT_PROOF_OF_PROCESS_LOADED_FILE' };
const goodProcess = {
  nodeExecutable: true, listenerOwnedByPid: true, onlyLoopback: true,
  entrypointEvidence: 'ABSOLUTE_PATH_MATCH', loopbackHost: '127.0.0.1',
};

const opts = (overrides: Record<string, unknown> = {}) => ({
  gitEvidence: goodGit, buildEvidence: goodBuild, manifestEvidence: goodManifest,
  processEvidence: goodProcess, port: 8791,
  env: { IIPS_MARKET_DATA_TRANSPORT_TOKEN: 'LOCAL_ONLY_SYNTHETIC_TOKEN' },
  ...overrides,
});

describe('reported quote-400 offline diagnostic', () => {
  it('uses compiled service, governed Reliance mapping, fake credential resolver AND fake transport to witness a single mapped 400 with a NUMERIC security ID', async () => {
    const result = await tool.inspectSyntheticQuote(ROOT);
    assert.deepEqual(result, {
      classification: 'SYNTHETIC_COMPILED_WITNESS_NOT_INCIDENT_REQUEST',
      simulatedRequestCount: 1,
      postToExpectedEndpoint: true,
      expectedHeaderNames: true,
      relianceBody: true,
      securityIdSerializedAsNumber: true,
      simulated400MappedToHttpError: true,
    });
    assert.doesNotMatch(JSON.stringify(result), /SYNTHETIC_VENDOR_BODY_MUST_NOT_SURFACE/);
  });

  it('expects the post-PR #176 wire body, and the pre-#176 string form is NOT the expected body', () => {
    // PR #176 (merge 2685562) established that Dhan rejects the string form with HTTP 400 and
    // that buildQuoteRequestBody serializes security IDs as JSON numbers. This pins that
    // distinction so a regression to string serialization fails here rather than at the vendor.
    assert.equal(tool.EXPECTED_BODY, '{"NSE_EQ":[2885]}');
    assert.equal(typeof JSON.parse(tool.EXPECTED_BODY).NSE_EQ[0], 'number');
    assert.notEqual(tool.EXPECTED_BODY, '{"NSE_EQ":["2885"]}');
    assert.equal(typeof JSON.parse('{"NSE_EQ":["2885"]}').NSE_EQ[0], 'string');
  });

  it('compares all runtime JS against a clean temporary emit without modifying dist/', () => {
    const result = tool.compareDiskBuild(ROOT);
    assert.equal(result.classification, 'MATCHES_FRESH_LOCAL_EMIT');
    assert.ok(result.sourceJsCount > 100);
    assert.equal(result.changedCount + result.missingCount + result.extraCount, 0);
  });

  it('the manifest check is public metadata, and it does not claim that the live daemon loaded this file', () => {
    assert.deepEqual(tool.inspectManifest(ROOT), {
      classification: 'CURRENT_CHECKED_IN_MANIFEST_NOT_PROOF_OF_PROCESS_LOADED_FILE',
      qualifiedCount: 4680,
      relianceNse2885: true,
      relianceBse500325: true,
    });
  });

  it('refuses a non-pinned or dirty checkout before compilation, process probing, or local reads', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'ipd-quote-git-'));
    try {
      const init = spawnSync('git', ['init', '-q', scratch], { stdio: 'ignore' });
      assert.equal(init.status, 0);
      mkdirSync(join(scratch, 'private'), { recursive: true });
      writeFileSync(join(scratch, 'private', 'DO-NOT-PRINT-TOKEN-PATH.txt'), 'SENTINEL_CREDENTIAL_VALUE');
      const result = await tool.main(['--repo', scratch, '--read-local-status']);
      assert.equal(result.exitCode, 2);
      assert.equal(result.output.classification, 'REFUSED_UNVERIFIED_PIN_OR_DIRTY_TREE');
      assert.equal(result.output.localStatus.classification, 'NOT_REQUESTED_NO_HTTP');
      assert.doesNotMatch(JSON.stringify(result), /SENTINEL_CREDENTIAL_VALUE|DO-NOT-PRINT-TOKEN-PATH/);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it('classifies only the diagnostic shell, validates expiry and reference roles via pure compiled validators, and withholds values', async () => {
    const env = {
      IIPS_DHAN_BASE_URL: 'https://private.invalid/secret-value',
      IIPS_DHAN_VAULT_BACKEND: 'windows-dpapi', IIPS_DHAN_VAULT_PROVIDER: 'WINDOWS_DPAPI',
      IIPS_DHAN_CLIENT_ID_SECRET_PATH: 'vault://synthetic-scope/client-id',
      IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH: 'vault://synthetic-scope/access-token',
      IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: '2099-11-18T10:00:00.000Z',
      IIPS_MARKET_DATA_TRANSPORT_TOKEN: 'SENTINEL_CREDENTIAL_VALUE',
      IIPS_MARKET_DATA_DAEMON_PORT: '8791',
    };
    const result = await tool.inspectCurrentShell(env, ROOT, true);
    assert.equal(result.classification, 'DIAGNOSTIC_SHELL_ONLY_NOT_DAEMON_CONFIG');
    assert.equal(result.expiry, 'VALID_FUTURE_IN_THIS_SHELL');
    assert.equal(result.credentialRolesValid, true);
    assert.equal(result.portMatchesRequested, true);
    assert.equal(result.vaultBackend, 'windows-dpapi');
    assert.doesNotMatch(JSON.stringify(result), /SENTINEL_CREDENTIAL_VALUE|private\.invalid|synthetic-scope|vault:\/\//);
    const expired = await tool.inspectCurrentShell({ ...env, IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: '2020-11-18T10:00:00Z' }, ROOT, true);
    assert.equal(expired.expiry, 'EXPIRED_IN_THIS_SHELL');
    const invalid = await tool.inspectCurrentShell({ ...env, IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT: 'SENTINEL_CREDENTIAL_VALUE' }, ROOT, true);
    assert.equal(invalid.expiry, 'INVALID_IN_THIS_SHELL');
  });

  it('passes only constrained process inputs to PowerShell and never forwards any credential env variable', () => {
    const token = 'SENTINEL_CREDENTIAL_VALUE';
    const original = process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN;
    process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN = token;
    try {
      let calls = 0;
      const result = tool.inspectProcess({ platform: 'win32', pid: 317, port: 8791, repo: ROOT,
        runner: (_exe: string, argv: string[], options: { env: Record<string, string> }) => {
          calls++;
          assert.equal(argv[0], '-NoProfile');
          assert.equal(argv[1], '-NonInteractive');
          assert.equal(argv[2], '-EncodedCommand');
          assert.doesNotMatch(Buffer.from(argv[3]!, 'base64').toString('utf16le'), /SENTINEL_CREDENTIAL_VALUE/);
          assert.equal(options.env.IPD_DIAG_PID, '317');
          assert.equal(options.env.IPD_DIAG_PORT, '8791');
          assert.equal(options.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN, undefined);
          return { status: 0, stdout: JSON.stringify({ classification: 'WINDOWS_PROCESS_PROBE',
            pidFound: true, nodeExecutable: true, listenerOwnedByPid: true, onlyLoopback: true,
            entrypointEvidence: 'RELATIVE_PATH_CWD_UNKNOWN', loopbackHost: '127.0.0.1',
            processStartedAtUtc: '2026-11-18T04:00:00.000Z', rawCommandLine: token }), };
        },
      });
      assert.equal(calls, 1);
      assert.equal(result.entrypointEvidence, 'RELATIVE_PATH_CWD_UNKNOWN');
      assert.equal(result.processCwdObserved, false);
      assert.doesNotMatch(JSON.stringify(result), /SENTINEL_CREDENTIAL_VALUE|rawCommandLine/);
      const unsafe = tool.projectProcessProbe(JSON.stringify({
        classification: 'WINDOWS_PROCESS_PROBE', pidFound: true, nodeExecutable: true,
        listenerOwnedByPid: true, onlyLoopback: true, entrypointEvidence: 'ABSOLUTE_PATH_MATCH',
        loopbackHost: 'api.dhan.co', processStartedAtUtc: token,
      }));
      assert.equal(unsafe.loopbackHost, null);
      assert.equal(unsafe.processStartedAtUtc, null);
    } finally {
      if (original === undefined) delete process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN;
      else process.env.IIPS_MARKET_DATA_TRANSPORT_TOKEN = original;
    }
  });

  it('refuses optional local reads if any pin, build, process, port or CWD proof is absent', async () => {
    let calls = 0;
    const readJson = async () => { calls++; return {}; };
    const invalid = [
      { gitEvidence: { ...goodGit, clean: false } },
      { buildEvidence: { ...goodBuild, parity: { classification: 'DIFFERS_FROM_FRESH_LOCAL_EMIT' } } },
      { buildEvidence: { ...goodBuild, diskChangedAfterProcessStart: null } },
      { processEvidence: { ...goodProcess, entrypointEvidence: 'RELATIVE_PATH_CWD_UNKNOWN' } },
      { processEvidence: { ...goodProcess, listenerOwnedByPid: false } },
      { processEvidence: { ...goodProcess, loopbackHost: 'api.dhan.co' } },
      { port: 0 },
    ];
    for (const over of invalid) {
      const out = await tool.inspectLocalStatus(opts({ ...over, readJson }));
      assert.equal(out.classification, 'BLOCKED_UNVERIFIED_PROCESS_OR_BUILD');
    }
    assert.equal(calls, 0, 'no loopback read, and certainly no vendor read, before proof');
  });

  it('optional local mode sends ONLY two direct GETs to verified loopback, sanitizes response, and never follows redirects', async () => {
    const localBearerCanary = 'SENTINEL_CREDENTIAL_VALUE';
    const seen: { method?: string; url?: string; authorised: boolean }[] = [];
    const server = createServer((req, res) => {
      seen.push({ method: req.method, url: req.url, authorised: req.headers.authorization === `Bearer ${localBearerCanary}` });
      res.setHeader('content-type', 'application/json');
      if (req.url === '/v1/health') {
        res.end(JSON.stringify({ service: 'UP', providerConfiguration: 'CONFIGURED',
          liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS', unsafeBody: localBearerCanary }));
      } else {
        res.end(JSON.stringify({ vendorEgressMode: 'IPD_SERVER_HTTPS',
          credentialResolutionOutcome: 'CREDENTIALS_RESOLVED', qualifiedMappingsLoaded: 4680,
          requestCounters: { vendorRequestsTotal: 2, quoteRequests: 2 }, lastFailureCategory: 'HTTP_ERROR',
          authLatched: false, unsafeBody: localBearerCanary }));
      }
    });
    server.listen(0, '127.0.0.1');
    try {
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('local test server did not bind');
      const result = await tool.inspectLocalStatus(opts({
        port: address.port, env: { IIPS_MARKET_DATA_TRANSPORT_TOKEN: localBearerCanary },
      }));
      assert.equal(result.classification, 'OBSERVED_LOCAL_GETS_NOT_VENDOR_CONNECTIVITY_PROOF');
      assert.deepEqual(seen, [
        { method: 'GET', url: '/v1/health', authorised: true },
        { method: 'GET', url: '/v1/diagnostics', authorised: true },
      ]);
      assert.equal(result.diagnostics.vendorRequestsTotal, 2);
      assert.doesNotMatch(JSON.stringify(result), /SENTINEL_CREDENTIAL_VALUE|unsafeBody/);
    } finally {
      await new Promise<void>((done) => server.close(() => done()));
    }
  });

  it('a local redirect is not followed or mistaken for a successful diagnostic', async () => {
    const seen: string[] = [];
    const server = createServer((req, res) => {
      seen.push(req.url ?? '');
      if (req.url === '/v1/health') {
        res.writeHead(302, { location: '/redirected' });
        res.end();
      } else {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{}');
      }
    });
    server.listen(0, '127.0.0.1');
    try {
      await once(server, 'listening');
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('local test server did not bind');
      const result = await tool.inspectLocalStatus(opts({ port: address.port }));
      assert.equal(result.classification, 'UNAVAILABLE_LOCAL_READS');
      assert.deepEqual(seen, ['/v1/health', '/v1/diagnostics']);
    } finally {
      await new Promise<void>((done) => server.close(() => done()));
    }
  });

  it('does not echo invalid CLI arguments or accidentally run an HTTP request', () => {
    const canary = 'SENTINEL_CREDENTIAL_VALUE';
    const result = spawnSync(process.execPath, [SCRIPT, '--token', canary], {
      encoding: 'utf8', env: { ...process.env, IIPS_MARKET_DATA_TRANSPORT_TOKEN: canary },
    });
    assert.equal(result.status, 2);
    assert.deepEqual(JSON.parse(result.stdout), { classification: 'INVALID_OPTIONS_VALUES_WITHHELD' });
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /SENTINEL_CREDENTIAL_VALUE/);
  });
});
