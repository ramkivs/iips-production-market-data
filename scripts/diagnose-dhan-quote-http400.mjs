#!/usr/bin/env node
/**
 * Offline-first, operator-side evidence for the reported Dhan quote HTTP 400.
 * Run this file OUTSIDE the incident's commit-pinned working tree, pointing --repo at it.
 * This tool never reads DPAPI carriers, resolves Dhan credentials, writes to the repo,
 * starts/stops a daemon, or sends a quote. Its synthetic request witness uses a fake
 * resolver AND a fake transport, so it cannot reach Dhan. No secret/response values,
 * environment dumps, process command lines, or vault locations are printed.
 *
 * Default: local Git, disk/build, manifest, and (on Windows) process/port checks.
 * --read-local-status: two explicit GETs to a verified loopback daemon ONLY. This
 * option reads the existing *local transport* bearer from this shell's environment
 * in memory; it does not read Dhan credentials. No redirects or POSTs are possible.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const INCIDENT_COMMIT = 'bfd83216f738a8cb6ad893f57934a582902bbdac';
const ENTRYPOINT = 'src/providers/dhan/dhan_local_daemon.js';
const QUOTE_PATH = 'https://api.dhan.co/v2/marketfeed/quote';
// Vendor-correct body since PR #176: the security ID is a JSON NUMBER, not a string.
// The pre-#176 serializer emitted {"NSE_EQ":["2885"]} and that string form is the
// established serialization defect this diagnostic was originally pinned to.
export const EXPECTED_BODY = '{"NSE_EQ":[2885]}';
const EXPECTED_HEADERS = ['accept', 'client-id', 'content-type', 'access-token'].sort();
const MAX_LOCAL_RESPONSE_BYTES = 16 * 1024;
const ALLOWED_LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1']);

function git(repo, args) {
  const result = spawnSync('git', ['-C', repo, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8_000, maxBuffer: 1024 * 1024,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function inspectGit(repo) {
  const head = git(repo, ['rev-parse', '--verify', 'HEAD']);
  const headTree = git(repo, ['rev-parse', '--verify', 'HEAD^{tree}']);
  const expectedTree = git(repo, ['rev-parse', '--verify', `${INCIDENT_COMMIT}^{tree}`]);
  // Read filenames into memory only; never publish even a dirty path.
  const porcelain = git(repo, ['status', '--porcelain=v1', '--untracked-files=normal']);
  return {
    expectedCommit: INCIDENT_COMMIT,
    head: /^[0-9a-f]{40}$/.test(head ?? '') ? head : null,
    headMatchesPin: head === INCIDENT_COMMIT,
    tree: /^[0-9a-f]{40}$/.test(headTree ?? '') ? headTree : null,
    expectedTree: /^[0-9a-f]{40}$/.test(expectedTree ?? '') ? expectedTree : null,
    treeMatchesPin: headTree !== null && expectedTree !== null && headTree === expectedTree,
    clean: porcelain === null ? null : porcelain.length === 0,
  };
}

function allJs(root) {
  if (!existsSync(root)) return null;
  const result = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const pathname = join(dir, entry.name);
      if (entry.isDirectory()) walk(pathname);
      if (entry.isFile() && entry.name.endsWith('.js')) {
        result.set(relative(root, pathname), readFileSync(pathname));
      }
    }
  };
  walk(root);
  return result;
}

/** Compile into a private temporary folder; do not touch dist/ while a daemon may be using it. */
export function compareDiskBuild(repo) {
  const compiler = join(repo, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(compiler)) return { classification: 'UNAVAILABLE_COMPILER' };
  let output;
  try {
    const root = realpathSync(repo).toLowerCase();
    const temporaryRoot = realpathSync(tmpdir());
    if (temporaryRoot.toLowerCase() === root || temporaryRoot.toLowerCase().startsWith(root + sep)) {
      return { classification: 'UNAVAILABLE_TEMP_DIR_INSIDE_PINNED_REPO' };
    }
    output = mkdtempSync(join(temporaryRoot, 'ipd-quote-offline-'));
    const result = spawnSync(process.execPath, [compiler, '-p', join(repo, 'tsconfig.json'), '--outDir', output], {
      cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000,
      maxBuffer: 1024 * 1024,
    });
    if (result.status !== 0) return { classification: 'UNAVAILABLE_COMPILATION' };
    const actual = allJs(join(repo, 'dist', 'src'));
    const fresh = allJs(join(output, 'src'));
    if (actual === null || fresh === null) return { classification: 'UNAVAILABLE_RUNTIME_OUTPUT' };
    let changed = 0;
    let missing = 0;
    let extra = 0;
    for (const [name, bytes] of fresh) {
      const installed = actual.get(name);
      if (!installed) missing++;
      else if (!bytes.equals(installed)) changed++;
    }
    for (const name of actual.keys()) if (!fresh.has(name)) extra++;
    return {
      classification: changed === 0 && missing === 0 && extra === 0 ? 'MATCHES_FRESH_LOCAL_EMIT' : 'DIFFERS_FROM_FRESH_LOCAL_EMIT',
      sourceJsCount: fresh.size,
      changedCount: changed,
      missingCount: missing,
      extraCount: extra,
    };
  } catch {
    return { classification: 'UNAVAILABLE_COMPILATION' };
  } finally {
    if (output) rmSync(output, { recursive: true, force: true });
  }
}

export function inspectBuild(repo, allowCompile, processStartedAtUtc = null) {
  const entry = join(repo, 'dist', ENTRYPOINT);
  const entryPresent = existsSync(entry);
  const lastWrite = entryPresent ? statSync(entry).mtime.toISOString() : null;
  let compilerVersion = null;
  try {
    const version = JSON.parse(readFileSync(join(repo, 'node_modules', 'typescript', 'package.json'), 'utf8')).version;
    if (/^\d+\.\d+\.\d+$/.test(version)) compilerVersion = version;
  } catch { /* no installed compiler */ }
  const startedAt = Date.parse(processStartedAtUtc ?? '');
  return {
    entrypointPresent: entryPresent,
    entrypointLastWriteUtc: lastWrite,
    diskChangedAfterProcessStart: lastWrite !== null && Number.isFinite(startedAt)
      ? Date.parse(lastWrite) > startedAt : null,
    compilerVersion,
    ...(
      allowCompile
        ? { parity: compareDiskBuild(repo) }
        : { parity: { classification: 'NOT_RUN_UNVERIFIED_GIT_TREE' } }
    ),
  };
}

export function inspectManifest(repo) {
  try {
    const manifest = JSON.parse(readFileSync(join(repo, 'evidence/dhan-p7/qualification-manifest.json'), 'utf8'));
    if (!Array.isArray(manifest.records)) throw new Error('invalid manifest');
    const qualified = manifest.records.filter((r) => r.disposition === 'QUALIFIED' && r.mapping);
    const reliance = qualified.filter((r) => r.mapping.companyId === 'EQ_RELIANCE_IN');
    const matches = (segment, identity, id) =>
      reliance.filter((r) => r.mapping.exchangeSegment === segment &&
        r.mapping.securityId === identity && r.mapping.dhanSecurityId === id).length === 1;
    return {
      classification: 'CURRENT_CHECKED_IN_MANIFEST_NOT_PROOF_OF_PROCESS_LOADED_FILE',
      qualifiedCount: qualified.length,
      relianceNse2885: matches('NSE_EQ', 'ISIN:INE002A01018:EQ', '2885'),
      relianceBse500325: matches('BSE_EQ', 'ISIN:INE002A01018:A', '500325'),
    };
  } catch {
    return { classification: 'UNAVAILABLE_MANIFEST' };
  }
}

/** Nothing here is the daemon process's environment; only this diagnostic shell is observed. */
export async function inspectCurrentShell(env, repo, verifiedBuild, requestedPort = 8791) {
  const selector = env.IIPS_DHAN_VAULT_BACKEND;
  const expiry = env.IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT;
  let expiryClass = expiry ? 'NOT_VALIDATED_WITHOUT_TRUSTED_BUILD' : 'UNSET';
  let credentialRolesValid = null;
  if (verifiedBuild) {
    try {
      // Both compiled modules are pure validators. Neither reads a carrier or resolves a credential.
      const [{ parseStrictUtcTimestamp }, { validateDhanSecretKeyPaths }] = await Promise.all([
        import(pathToFileURL(join(repo, 'dist/src/providers/dhan/dhan_utc_timestamp.js')).href),
        import(pathToFileURL(join(repo, 'dist/src/security/secret_ref.js')).href),
      ]);
      if (expiry) {
        const parsed = parseStrictUtcTimestamp(expiry);
        expiryClass = parsed.ok ? (parsed.epochMs > Date.now() ? 'VALID_FUTURE_IN_THIS_SHELL' : 'EXPIRED_IN_THIS_SHELL')
          : 'INVALID_IN_THIS_SHELL';
      }
      credentialRolesValid = validateDhanSecretKeyPaths({
        clientIdKeyPath: env.IIPS_DHAN_CLIENT_ID_SECRET_PATH,
        accessTokenKeyPath: env.IIPS_DHAN_ACCESS_TOKEN_SECRET_PATH,
      }).isValid;
    } catch {
      expiryClass = expiry ? 'VALIDATION_UNAVAILABLE' : 'UNSET';
    }
  }
  const port = env.IIPS_MARKET_DATA_DAEMON_PORT;
  return {
    classification: 'DIAGNOSTIC_SHELL_ONLY_NOT_DAEMON_CONFIG',
    baseUrl: env.IIPS_DHAN_BASE_URL ? 'OVERRIDDEN_VALUE_WITHHELD' : 'DEFAULT_OR_UNSET',
    vaultBackend: selector === 'windows-dpapi' || selector === 'disabled' ? selector : 'OTHER_OR_UNSET',
    vaultProviderIsWindowsDpapi: env.IIPS_DHAN_VAULT_PROVIDER === 'WINDOWS_DPAPI',
    credentialRolesValid,
    secretVersionPresent: !!env.IIPS_DHAN_SECRET_VERSION,
    secretStatusActive: env.IIPS_DHAN_SECRET_STATUS === 'ACTIVE',
    expiry: expiryClass,
    timeoutConfigured: !!env.IIPS_DHAN_TIMEOUT_MS,
    portMatchesRequested: !port ? requestedPort === 8791 : /^\d+$/.test(port) && Number(port) === requestedPort,
    nonProduction: !['NODE_ENV', 'IIPS_DEPLOYMENT_ENV'].some((key) => env[key]?.trim().toLowerCase() === 'production'),
    tlsDisabled: env.NODE_TLS_REJECT_UNAUTHORIZED === '0',
    proxyVariablePresent: ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']
      .some((key) => !!env[key]),
    transportBearerPresent: !!env.IIPS_MARKET_DATA_TRANSPORT_TOKEN,
  };
}

// Windows PowerShell 5.1 reads ONLY a requested PID, its command line (compares it
// in memory; never serializes it) and the listener for one port. It writes only the
// fixed, enumerated summary below. No vault, environment dump, or HTTP request.
const WINDOWS_PROCESS_PROBE = String.raw`
$ErrorActionPreference = 'Stop'
try {
  $wantedPid = [int]$env:IPD_DIAG_PID
  $wantedPort = [int]$env:IPD_DIAG_PORT
  $expectedEntry = [IO.Path]::GetFullPath($env:IPD_DIAG_ENTRY)
  $launchCwd = $env:IPD_DIAG_LAUNCH_CWD
  $p = Get-CimInstance -ClassName Win32_Process -Filter ("ProcessId={0}" -f $wantedPid)
  $listeners = @(Get-NetTCPConnection -LocalPort $wantedPort -State Listen -ErrorAction Stop)
  $sameOwner = @($listeners | Where-Object { $_.OwningProcess -eq $wantedPid })
  $onlyOwner = $listeners.Count -gt 0 -and $sameOwner.Count -eq $listeners.Count
  $onlyLoopback = $sameOwner.Count -gt 0 -and @($sameOwner | Where-Object {
    $_.LocalAddress -notin @('127.0.0.1', '::1')
  }).Count -eq 0
  $selectedHost = $null
  if (@($sameOwner | Where-Object { $_.LocalAddress -eq '127.0.0.1' }).Count -gt 0) {
    $selectedHost = '127.0.0.1'
  } elseif (@($sameOwner | Where-Object { $_.LocalAddress -eq '::1' }).Count -gt 0) {
    $selectedHost = '::1'
  }
  $nodeExe = $null -ne $p -and [IO.Path]::GetFileName([string]$p.ExecutablePath) -ieq 'node.exe'
  $entry = 'UNVERIFIED'
  if ($nodeExe) {
    $line = [string]$p.CommandLine
    $match = [regex]::Match($line,
      '^\s*(?:"[^"]*\bnode(?:\.exe)?"|[^\s"]*node(?:\.exe)?)\s+(?:"(?<file>[^"]+)"|(?<file>\S+))(?=\s|$)',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($match.Success) {
      $actualEntry = $match.Groups['file'].Value
      if ([IO.Path]::IsPathRooted($actualEntry)) {
        if ([IO.Path]::GetFullPath($actualEntry).Equals($expectedEntry, [StringComparison]::OrdinalIgnoreCase)) {
          $entry = 'ABSOLUTE_PATH_MATCH'
        }
      } elseif (-not [string]::IsNullOrWhiteSpace($launchCwd)) {
        if ([IO.Path]::GetFullPath((Join-Path $launchCwd $actualEntry)).Equals($expectedEntry, [StringComparison]::OrdinalIgnoreCase)) {
          $entry = 'RELATIVE_PATH_WITH_OPERATOR_ATTESTED_CWD'
        }
      } else { $entry = 'RELATIVE_PATH_CWD_UNKNOWN' }
    }
  }
  $startUtc = $null
  if ($null -ne $p -and $null -ne $p.CreationDate) { $startUtc = $p.CreationDate.ToUniversalTime().ToString('o') }
  [pscustomobject]@{
    classification = 'WINDOWS_PROCESS_PROBE'
    pidFound = ($null -ne $p)
    nodeExecutable = [bool]$nodeExe
    listenerOwnedByPid = [bool]$onlyOwner
    onlyLoopback = [bool]$onlyLoopback
    entrypointEvidence = $entry
    loopbackHost = $selectedHost
    processStartedAtUtc = $startUtc
  } | ConvertTo-Json -Compress
} catch {
  '{"classification":"UNAVAILABLE_PROCESS_PROBE"}'
}
`;

const ALLOWED_ENTRYPOINT_EVIDENCE = new Set([
  'ABSOLUTE_PATH_MATCH', 'RELATIVE_PATH_WITH_OPERATOR_ATTESTED_CWD',
  'RELATIVE_PATH_CWD_UNKNOWN', 'UNVERIFIED',
]);

export function projectProcessProbe(raw) {
  try {
    const p = JSON.parse(raw);
    if (p.classification !== 'WINDOWS_PROCESS_PROBE' ||
        typeof p.pidFound !== 'boolean' || typeof p.nodeExecutable !== 'boolean' ||
        typeof p.listenerOwnedByPid !== 'boolean' || typeof p.onlyLoopback !== 'boolean' ||
        !ALLOWED_ENTRYPOINT_EVIDENCE.has(p.entrypointEvidence)) throw new Error('invalid probe');
    const start = typeof p.processStartedAtUtc === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(p.processStartedAtUtc) &&
      Number.isFinite(Date.parse(p.processStartedAtUtc)) ? new Date(p.processStartedAtUtc).toISOString() : null;
    return {
      classification: 'WINDOWS_PROCESS_PROBE',
      pidFound: p.pidFound,
      nodeExecutable: p.nodeExecutable,
      listenerOwnedByPid: p.listenerOwnedByPid,
      onlyLoopback: p.onlyLoopback,
      entrypointEvidence: p.entrypointEvidence,
      loopbackHost: ALLOWED_LOOPBACK_HOSTS.has(p.loopbackHost) ? p.loopbackHost : null,
      processStartedAtUtc: start,
      // Even a matching command line + operator-attested CWD is not an OS read of process CWD.
      processCwdObserved: false,
    };
  } catch {
    return { classification: 'UNAVAILABLE_PROCESS_PROBE' };
  }
}

export function inspectProcess({ pid, port, launchCwd, platform = process.platform, runner = spawnSync, repo }) {
  if (platform !== 'win32') return { classification: 'UNAVAILABLE_NOT_WINDOWS' };
  if (!Number.isInteger(pid) || pid < 1) return { classification: 'UNAVAILABLE_PID_NOT_SUPPLIED' };
  const safeEnv = {};
  for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'PATHEXT', 'ComSpec', 'PSModulePath', 'TEMP', 'TMP', 'USERPROFILE']) {
    if (process.env[key] !== undefined) safeEnv[key] = process.env[key];
  }
  Object.assign(safeEnv, {
    IPD_DIAG_PID: String(pid), IPD_DIAG_PORT: String(port),
    IPD_DIAG_ENTRY: join(repo, 'dist', ENTRYPOINT),
    IPD_DIAG_LAUNCH_CWD: launchCwd ?? '',
  });
  try {
    const result = runner('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-EncodedCommand',
      Buffer.from(WINDOWS_PROCESS_PROBE, 'utf16le').toString('base64'),
    ], { env: safeEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000, maxBuffer: 16_384 });
    return result.status === 0 ? projectProcessProbe(result.stdout.trim()) : { classification: 'UNAVAILABLE_PROCESS_PROBE' };
  } catch {
    return { classification: 'UNAVAILABLE_PROCESS_PROBE' };
  }
}

/** Synthesized, in-memory one-shot: uses the real compiled service but NO real resolver/egress. */
export async function inspectSyntheticQuote(repo) {
  try {
    const js = (path) => import(pathToFileURL(join(repo, 'dist', 'src', path)).href);
    const [{ DhanApiClient }, { DhanMarketDataService }, { loadGovernedP7InstrumentRegistry },
      { buildD114SecurityIdentity }, { getGovernedBroadSecurityMaster }] = await Promise.all([
      js('providers/dhan/dhan_api_client.js'), js('providers/dhan/dhan_market_data_service.js'),
      js('providers/dhan/dhan_local_daemon.js'), js('contracts/types.js'), js('identity/governed_fixture_master.js'),
    ]);
    const requests = [];
    const transport = {
      send: async (request) => {
        // Values are never retained or reported, even though they are only synthetic here.
        requests.push({
          method: request.method, url: request.url, headerNames: Object.keys(request.headers).map((name) => name.toLowerCase()).sort(),
          contentType: request.headers['Content-Type'], accept: request.headers.Accept,
          body: request.body,
        });
        return { status: 400, bodyText: 'SYNTHETIC_VENDOR_BODY_MUST_NOT_SURFACE' };
      },
    };
    const client = new DhanApiClient({
      config: { providerId: 'DHAN_PROVIDER', readiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
        baseUrl: 'https://api.dhan.co/v2', timeoutMs: 5000, missingKeys: [] },
      credentialResolver: { resolve: async () => ({ clientId: 'synthetic-client', accessToken: 'synthetic-token' }) },
      transport,
    });
    const service = new DhanMarketDataService({
      client, securityMaster: getGovernedBroadSecurityMaster(),
      instrumentRegistry: loadGovernedP7InstrumentRegistry(join(repo, 'evidence/dhan-p7/qualification-manifest.json')),
    });
    service.start();
    const outcome = await service.getQuote({
      companyId: 'EQ_RELIANCE_IN', exchangeSegment: 'NSE_EQ',
      securityIdentity: buildD114SecurityIdentity('INE002A01018', 'EQ'),
    });
    service.stop();
    const sent = requests[0];
    // Serialization branch witness. The compiled serializer must emit a JSON number for the
    // security ID. A string here would be the pre-#176 defect and must not be reported as a match.
    let securityIdSerializedAsNumber = false;
    try {
      const group = JSON.parse(sent?.body ?? '{}');
      securityIdSerializedAsNumber = Array.isArray(group?.NSE_EQ) && group.NSE_EQ.length === 1 &&
        typeof group.NSE_EQ[0] === 'number' && group.NSE_EQ[0] === 2885;
    } catch {
      securityIdSerializedAsNumber = false;
    }
    return {
      classification: 'SYNTHETIC_COMPILED_WITNESS_NOT_INCIDENT_REQUEST',
      simulatedRequestCount: requests.length,
      postToExpectedEndpoint: sent?.method === 'POST' && sent?.url === QUOTE_PATH,
      expectedHeaderNames: JSON.stringify(sent?.headerNames) === JSON.stringify(EXPECTED_HEADERS) &&
        sent?.contentType === 'application/json' && sent?.accept === 'application/json',
      relianceBody: sent?.body === EXPECTED_BODY,
      securityIdSerializedAsNumber,
      simulated400MappedToHttpError: !outcome.ok && outcome.failure.code === 'HTTP_ERROR' && outcome.failure.httpStatus === 400,
    };
  } catch {
    return { classification: 'UNAVAILABLE_SYNTHETIC_WITNESS' };
  }
}

const HEALTH_VALUES = {
  service: new Set(['UP', 'DOWN']),
  providerConfiguration: new Set(['CONFIGURED', 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE']),
  liveProviderConnectivity: new Set(['CONNECTED_LIVE', 'NOT_CHECKED_PRE_ACCESS']),
};
const DIAGNOSTIC_VALUES = {
  vendorEgressMode: new Set(['IPD_SERVER_HTTPS', 'DISABLED_PRE_ACCESS', 'SYNTHETIC_INJECTED']),
  credentialResolutionOutcome: new Set(['UNCONFIGURED', 'CONFIGURATION_INCOMPLETE', 'PRODUCTION_NOT_AUTHORIZED',
    'CREDENTIALS_UNAVAILABLE', 'CREDENTIALS_EXPIRED', 'CONFIGURED_NOT_RESOLVED', 'CREDENTIALS_RESOLVED']),
};
function enumOrUnknown(value, allowed) { return allowed.has(value) ? value : 'UNKNOWN'; }
function countOrNull(value) { return Number.isSafeInteger(value) && value >= 0 ? value : null; }

function getLocalJson(host, port, route, bearer) {
  return new Promise((resolveResponse) => {
    const req = httpRequest({ hostname: host, port, path: route, method: 'GET', timeout: 3000,
      signal: AbortSignal.timeout(3000),
      headers: { authorization: `Bearer ${bearer}`, accept: 'application/json' } }, (res) => {
      if (res.statusCode !== 200 || !String(res.headers['content-type'] ?? '').startsWith('application/json')) {
        res.resume(); resolveResponse(null); return;
      }
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_LOCAL_RESPONSE_BYTES) { req.destroy(); resolveResponse(null); return; }
        chunks.push(chunk);
      });
      res.on('end', () => {
        try { resolveResponse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch { resolveResponse(null); }
      });
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolveResponse(null));
    req.end();
  });
}

/** Explicit local-status option; no redirect, query, POST, proxy, or non-loopback hostname. */
export async function inspectLocalStatus({ gitEvidence, buildEvidence, processEvidence, manifestEvidence,
  port, env = process.env, readJson = getLocalJson }) {
  if (!gitEvidence.headMatchesPin || !gitEvidence.treeMatchesPin || !gitEvidence.clean ||
      buildEvidence.parity.classification !== 'MATCHES_FRESH_LOCAL_EMIT' ||
      manifestEvidence.classification !== 'CURRENT_CHECKED_IN_MANIFEST_NOT_PROOF_OF_PROCESS_LOADED_FILE' ||
      !processEvidence.nodeExecutable || !processEvidence.listenerOwnedByPid || !processEvidence.onlyLoopback ||
      !['ABSOLUTE_PATH_MATCH', 'RELATIVE_PATH_WITH_OPERATOR_ATTESTED_CWD'].includes(processEvidence.entrypointEvidence) ||
      !ALLOWED_LOOPBACK_HOSTS.has(processEvidence.loopbackHost) ||
      buildEvidence.diskChangedAfterProcessStart !== false || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { classification: 'BLOCKED_UNVERIFIED_PROCESS_OR_BUILD' };
  }
  const bearer = env.IIPS_MARKET_DATA_TRANSPORT_TOKEN;
  // Use the already-injected local IPC token in this shell, never command-line input.
  if (typeof bearer !== 'string' || !bearer || /\s/.test(bearer)) {
    return { classification: 'BLOCKED_NO_VALID_LOCAL_BEARER_IN_THIS_SHELL' };
  }
  const health = await readJson(processEvidence.loopbackHost, port, '/v1/health', bearer);
  const diag = await readJson(processEvidence.loopbackHost, port, '/v1/diagnostics', bearer);
  if (!health || !diag) return { classification: 'UNAVAILABLE_LOCAL_READS' };
  return {
    classification: 'OBSERVED_LOCAL_GETS_NOT_VENDOR_CONNECTIVITY_PROOF',
    health: {
      service: enumOrUnknown(health.service, HEALTH_VALUES.service),
      providerConfiguration: enumOrUnknown(health.providerConfiguration, HEALTH_VALUES.providerConfiguration),
      liveProviderConnectivity: enumOrUnknown(health.liveProviderConnectivity, HEALTH_VALUES.liveProviderConnectivity),
    },
    diagnostics: {
      vendorEgressMode: enumOrUnknown(diag.vendorEgressMode, DIAGNOSTIC_VALUES.vendorEgressMode),
      credentialResolutionOutcome: enumOrUnknown(diag.credentialResolutionOutcome, DIAGNOSTIC_VALUES.credentialResolutionOutcome),
      qualifiedMappingsLoaded: countOrNull(diag.qualifiedMappingsLoaded),
      vendorRequestsTotal: countOrNull(diag.requestCounters?.vendorRequestsTotal),
      quoteRequests: countOrNull(diag.requestCounters?.quoteRequests),
      lastFailureCategory: diag.lastFailureCategory === 'HTTP_ERROR' ? 'HTTP_ERROR' : 'OTHER_OR_NONE',
      authLatched: typeof diag.authLatched === 'boolean' ? diag.authLatched : null,
    },
  };
}

export function parseArgs(argv) {
  const parsed = { repo: process.cwd(), pid: null, port: 8791, launchCwd: null, readLocalStatus: false };
  const seen = new Set();
  for (let index = 0; index < argv.length; index++) {
    const option = argv[index];
    if (seen.has(option)) return null;
    seen.add(option);
    if (option === '--read-local-status') { parsed.readLocalStatus = true; continue; }
    if (!['--repo', '--pid', '--port', '--launch-cwd'].includes(option)) return null;
    const value = argv[++index];
    if (!value) return null;
    if (option === '--repo') parsed.repo = resolve(value);
    if (option === '--launch-cwd') parsed.launchCwd = resolve(value);
    if (option === '--pid' || option === '--port') {
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return null;
      parsed[option === '--pid' ? 'pid' : 'port'] = Number(value);
    }
  }
  if (parsed.pid !== null && parsed.pid < 1) return null;
  if (parsed.port < 1 || parsed.port > 65535) return null;
  return parsed;
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (!opts) return { exitCode: 2, output: { classification: 'INVALID_OPTIONS_VALUES_WITHHELD' } };
  const repo = opts.repo;
  const gitEvidence = inspectGit(repo);
  const trustedTree = gitEvidence.headMatchesPin && gitEvidence.treeMatchesPin && gitEvidence.clean === true;
  // Preserve the original commit pin and clean-tree guard. A mismatch is a refusal,
  // not permission to inspect a different checkout, compile it, or call loopback.
  if (!trustedTree) {
    return { exitCode: 2, output: {
      classification: 'REFUSED_UNVERIFIED_PIN_OR_DIRTY_TREE',
      git: gitEvidence,
      localStatus: { classification: 'NOT_REQUESTED_NO_HTTP' },
      credentialEquality: 'UNPROVEN_NOT_INSPECTED',
    } };
  }
  const processEvidence = inspectProcess({ pid: opts.pid, port: opts.port, launchCwd: opts.launchCwd, repo });
  const buildEvidence = inspectBuild(repo, true, processEvidence.processStartedAtUtc);
  const manifestEvidence = inspectManifest(repo);
  const postGit = inspectGit(repo);
  if (!postGit.headMatchesPin || !postGit.treeMatchesPin || postGit.clean !== true ||
      postGit.head !== gitEvidence.head || postGit.tree !== gitEvidence.tree) {
    return { exitCode: 2, output: {
      classification: 'REFUSED_PIN_OR_TREE_CHANGED_DURING_INSPECTION',
      git: postGit,
      localStatus: { classification: 'NOT_REQUESTED_NO_HTTP' },
      credentialEquality: 'UNPROVEN_NOT_INSPECTED',
    } };
  }
  const verifiedBuild = buildEvidence.parity.classification === 'MATCHES_FRESH_LOCAL_EMIT';
  const output = {
    classification: 'OPERATOR_SIDE_OFFLINE_FIRST_NOT_INCIDENT_CAUSE',
    git: gitEvidence,
    build: buildEvidence,
    manifest: manifestEvidence,
    process: processEvidence,
    launchCwd: opts.launchCwd ? { source: 'OPERATOR_ATTESTATION_NOT_OS_PROCESS_CWD',
      equalsRepo: opts.launchCwd.toLowerCase() === repo.toLowerCase() } : { source: 'UNAVAILABLE_NO_LAUNCH_RECORD' },
    currentShell: await inspectCurrentShell(process.env, repo, verifiedBuild, opts.port),
    // Never invoke compiled provider code from an unverified disk image.
    outboundMetadata: verifiedBuild &&
      manifestEvidence.classification === 'CURRENT_CHECKED_IN_MANIFEST_NOT_PROOF_OF_PROCESS_LOADED_FILE'
      ? await inspectSyntheticQuote(repo) : { classification: 'NOT_RUN_UNVERIFIED_GIT_OR_BUILD' },
    credentialEquality: 'UNPROVEN_NOT_INSPECTED',
  };
  if (!opts.readLocalStatus) {
    output.localStatus = { classification: 'NOT_REQUESTED_NO_HTTP' };
  } else {
    // Verify immediately before use of the local bearer, not before the synthetic
    // witness (which may take time). A stopped/replaced PID or altered tree must
    // not silently retarget an observational GET.
    const statusGit = inspectGit(repo);
    const statusProcess = inspectProcess({ pid: opts.pid, port: opts.port, launchCwd: opts.launchCwd, repo });
    const processStable = processEvidence.classification === 'WINDOWS_PROCESS_PROBE' &&
      statusProcess.classification === 'WINDOWS_PROCESS_PROBE' &&
      processEvidence.processStartedAtUtc !== null &&
      statusProcess.processStartedAtUtc === processEvidence.processStartedAtUtc &&
      statusProcess.entrypointEvidence === processEvidence.entrypointEvidence &&
      statusProcess.listenerOwnedByPid === processEvidence.listenerOwnedByPid &&
      statusProcess.onlyLoopback === processEvidence.onlyLoopback &&
      statusProcess.loopbackHost === processEvidence.loopbackHost;
    const gitStable = statusGit.headMatchesPin && statusGit.treeMatchesPin && statusGit.clean === true &&
      statusGit.head === gitEvidence.head && statusGit.tree === gitEvidence.tree;
    let diskStable = false;
    try {
      diskStable = statSync(join(repo, 'dist', ENTRYPOINT)).mtime.toISOString() === buildEvidence.entrypointLastWriteUtc;
    } catch { /* absent or unreadable entrypoint blocks the local request */ }
    output.localStatus = !gitStable || !processStable || !diskStable
      ? { classification: 'BLOCKED_PROCESS_GIT_OR_DISK_CHANGED' }
      : await inspectLocalStatus({ gitEvidence: statusGit, buildEvidence,
        processEvidence: statusProcess, manifestEvidence, port: opts.port, env: process.env });
  }
  return { exitCode: 0, output };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await main();
    console.log(JSON.stringify(result.output, null, 2));
    process.exitCode = result.exitCode;
  } catch {
    // Never echo arbitrary errors: they may carry command lines, URLs, or credentials.
    console.error('Diagnostic unavailable; details withheld. No vendor request was made.');
    process.exitCode = 2;
  }
}
