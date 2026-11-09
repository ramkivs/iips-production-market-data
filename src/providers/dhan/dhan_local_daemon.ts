import { DhanIdentityApiService } from './dhan_identity_api.js';
/**
 * Institutional Investment Platform System (IIPS)
 * IPD-Owned Local Market-Data HTTP Daemon Launcher (Stage 1 Operational Wiring)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 *
 * PURPOSE:
 *  Starts IPD's local, single-user, non-production `createMarketDataHttpServer`
 *  composed with `DhanMarketDataService` and `LocalHostVaultDhanCredentialResolver`.
 *
 * BOUNDARY & SECURITY GUARANTEES:
 *  - IPD-internal only: NOT exported from `iips-production-market-data/dhan-server`
 *    and NEVER included in browser bundles. Keeps `DhanServerHttpsTransport` and
 *    `LocalHostVaultDhanCredentialResolver` strictly internal to IPD.
 *  - Loopback-only listener (`127.0.0.1`, `::1`, `localhost`); external interface
 *    bindings (`0.0.0.0`, `::`, LAN IPs) are refused before opening any socket.
 *  - Requires non-empty `IIPS_MARKET_DATA_TRANSPORT_TOKEN` via server environment.
 *  - Refuses production mode (`NODE_ENV=production` / `IIPS_DEPLOYMENT_ENV=production`).
 *  - Rejects all command-line arguments fail-closed without echoing argument values,
 *    preventing accidental secret leakage through process argv or diagnostic logs.
 *  - Keeps outbound Dhan vendor egress disabled (`PreAccessNoNetworkTransport`)
 *    whenever the host-vault backend reports `liveResolutionSupported === false`.
 *  - Deterministic graceful startup failure and bounded idempotent shutdown.
 */

import { existsSync, readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGovernedBroadSecurityMaster } from '../../identity/governed_fixture_master.js';
import type { SecurityMaster } from '../../identity/security_master.js';
import {
  DhanApiClient,
  DhanHttpTransport,
  PreAccessNoNetworkTransport,
} from './dhan_api_client.js';
import {
  DhanCredentialReadiness,
  DhanEnvSource,
  isDhanProductionEnvironment,
  resolveDhanProviderConfig,
} from './dhan_config.js';
import {
  DhanInstrumentMapping,
  DhanInstrumentRegistry,
} from './dhan_instrument_map.js';
import {
  LocalHostVaultDhanCredentialResolver,
  type LocalHostVaultSecretBackend,
} from './dhan_local_vault_resolver.js';
import {
  createMarketDataHttpServer,
  isLoopbackTransportHost,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
} from './dhan_market_data_http.js';
import { DhanMarketDataService } from './dhan_market_data_service.js';
import { DhanServerHttpsTransport } from './dhan_server_egress.js';

export const MARKET_DATA_DAEMON_HOST_ENV = 'IIPS_MARKET_DATA_DAEMON_HOST';
export const MARKET_DATA_DAEMON_PORT_ENV = 'IIPS_MARKET_DATA_DAEMON_PORT';
export const DEFAULT_MARKET_DATA_DAEMON_HOST = '127.0.0.1';
export const DEFAULT_MARKET_DATA_DAEMON_PORT = 8791;
export const DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS = 5_000;

export type MarketDataDaemonStartupPhase = 'validate' | 'configure' | 'bind';

export type MarketDataDaemonFailureCode =
  | 'PRODUCTION_NOT_AUTHORIZED'
  | 'CLI_ARGUMENTS_FORBIDDEN'
  | 'NON_LOOPBACK_HOST_REFUSED'
  | 'INVALID_PORT'
  | 'TRANSPORT_TOKEN_MISSING'
  | 'CONFIGURATION_INCOMPLETE'
  | 'BIND_FAILED';

export interface MarketDataDaemonDiagnostics {
  readonly status: 'LISTENING';
  readonly host: string;
  readonly boundAddress: string;
  readonly port: number;
  readonly baseUrl: string;
  readonly providerReadiness: DhanCredentialReadiness;
  readonly vaultBackendId: string;
  readonly liveCredentialResolutionSupported: boolean;
  readonly vendorEgressMode: 'DISABLED_PRE_ACCESS' | 'IPD_SERVER_HTTPS' | 'SYNTHETIC_INJECTED';
  readonly qualifiedMappingsLoaded: number;
  readonly liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS';
  readonly providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED';
}

export interface MarketDataDaemonHandle {
  readonly diagnostics: MarketDataDaemonDiagnostics;
  readonly service: DhanMarketDataService;
  readonly server: Server;
  shutdown(): Promise<void>;
}

export type MarketDataDaemonStartupOutcome =
  | {
      readonly ok: true;
      readonly handle: MarketDataDaemonHandle;
      readonly diagnostics: MarketDataDaemonDiagnostics;
    }
  | {
      readonly ok: false;
      readonly phase: MarketDataDaemonStartupPhase;
      readonly code: MarketDataDaemonFailureCode;
      readonly error: string;
    };

export interface StartMarketDataDaemonOptions {
  readonly env?: DhanEnvSource;
  readonly argv?: readonly string[];
  readonly host?: string;
  readonly port?: number;
  readonly transportToken?: string;
  readonly requestTimeoutMs?: number;
  readonly shutdownTimeoutMs?: number;
  readonly vaultBackend?: LocalHostVaultSecretBackend;
  readonly credentialResolver?: LocalHostVaultDhanCredentialResolver;
  /** Controlled test seam only; never used to bypass IPD's egress guard in live operation. */
  readonly providerTransport?: DhanHttpTransport;
  readonly securityMaster?: SecurityMaster;
  readonly instrumentRegistry?: DhanInstrumentRegistry;
  readonly p7ManifestPath?: string;
  readonly now?: () => Date;
}

function isVerifiedLoopbackBoundAddress(address: string): boolean {
  const normalized = address.trim().toLowerCase();
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1'
  );
}

function parseEnvPort(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return DEFAULT_MARKET_DATA_DAEMON_PORT;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const port = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return port;
}

/**
 * Loads the governed P7 qualified instrument mappings from IPD's retained
 * `evidence/dhan-p7/qualification-manifest.json` when available.
 * Never downloads from the network and never infers unverified mappings.
 */
export function loadGovernedP7InstrumentRegistry(explicitManifestPath?: string): DhanInstrumentRegistry {
  const registry = new DhanInstrumentRegistry();
  const candidates: string[] = [];
  if (explicitManifestPath) {
    candidates.push(explicitManifestPath);
  } else {
    candidates.push(resolve(process.cwd(), 'evidence/dhan-p7/qualification-manifest.json'));
    try {
      candidates.push(
        fileURLToPath(new URL('../../../../evidence/dhan-p7/qualification-manifest.json', import.meta.url))
      );
    } catch {
      // ignore URL resolution edge cases
    }
    try {
      candidates.push(
        fileURLToPath(new URL('../../../evidence/dhan-p7/qualification-manifest.json', import.meta.url))
      );
    } catch {
      // ignore URL resolution edge cases
    }
  }

  const manifestFile = candidates.find((p) => existsSync(p));
  if (!manifestFile) {
    return registry;
  }

  const parsed = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
    records?: ReadonlyArray<{
      disposition?: string;
      mapping?: DhanInstrumentMapping;
    }>;
  };
  if (!Array.isArray(parsed.records)) {
    return registry;
  }

  for (const record of parsed.records) {
    if (record.disposition === 'QUALIFIED' && record.mapping) {
      registry.register(record.mapping);
    }
  }
  return registry;
}

/**
 * Formats an operator-safe startup log line containing zero secret material.
 */
export function formatDaemonStartupLine(diagnostics: MarketDataDaemonDiagnostics): string {
  return (
    `[ipd-market-data-daemon] listening on ${diagnostics.baseUrl} ` +
    `(providerReadiness=${diagnostics.providerReadiness}, ` +
    `vaultBackend=${diagnostics.vaultBackendId}, ` +
    `liveCredentialResolution=${diagnostics.liveCredentialResolutionSupported}, ` +
    `vendorEgress=${diagnostics.vendorEgressMode}, ` +
    `qualifiedMappings=${diagnostics.qualifiedMappingsLoaded})`
  );
}

/**
 * Starts the local IPD market-data HTTP daemon with fail-closed preflight
 * validation and bounded graceful shutdown.
 */
export async function startMarketDataDaemon(
  options: StartMarketDataDaemonOptions = {}
): Promise<MarketDataDaemonStartupOutcome> {
  const env: DhanEnvSource =
    options.env ?? (typeof process !== 'undefined' && process.env ? process.env : {});
  const argv = options.argv ?? [];
  const now = options.now ?? (() => new Date());

  // 1. Refuse command-line arguments unconditionally without echoing argv values.
  if (argv.length > 0) {
    return {
      ok: false,
      phase: 'validate',
      code: 'CLI_ARGUMENTS_FORBIDDEN',
      error:
        `Command-line arguments are forbidden on the IPD market-data daemon ` +
        `(received ${argv.length} argument(s)); configure via governed environment variables only.`,
    };
  }

  // 2. Refuse production mode before resolving config, credentials, or sockets.
  if (isDhanProductionEnvironment(env)) {
    return {
      ok: false,
      phase: 'validate',
      code: 'PRODUCTION_NOT_AUTHORIZED',
      error:
        'Production market-data daemon startup is not authorized; Stage 1 scope is restricted to local non-production execution.',
    };
  }

  // 3. Validate loopback-only listener host & port.
  const host = (options.host ?? env[MARKET_DATA_DAEMON_HOST_ENV] ?? DEFAULT_MARKET_DATA_DAEMON_HOST).trim();
  if (!isLoopbackTransportHost(host)) {
    return {
      ok: false,
      phase: 'validate',
      code: 'NON_LOOPBACK_HOST_REFUSED',
      error:
        `Market-data daemon must bind to local loopback only (127.0.0.1, ::1, or localhost); refusing host '${host}'.`,
    };
  }

  let port: number | null;
  if (options.port !== undefined) {
    port = Number.isInteger(options.port) && options.port >= 0 && options.port <= 65535 ? options.port : null;
  } else {
    port = parseEnvPort(env[MARKET_DATA_DAEMON_PORT_ENV]);
  }
  if (port === null) {
    return {
      ok: false,
      phase: 'validate',
      code: 'INVALID_PORT',
      error: `${MARKET_DATA_DAEMON_PORT_ENV} must be a valid TCP port integer (1..65535).`,
    };
  }

  // 4. Require non-empty server-side transport token.
  const transportToken = options.transportToken ?? env[MARKET_DATA_TRANSPORT_TOKEN_ENV];
  if (!transportToken || !transportToken.trim()) {
    return {
      ok: false,
      phase: 'validate',
      code: 'TRANSPORT_TOKEN_MISSING',
      error: `${MARKET_DATA_TRANSPORT_TOKEN_ENV} is not set; refusing to start an unauthenticated market-data daemon.`,
    };
  }

  // 5. Resolve Dhan provider configuration (SecretRef pointers only).
  const cfgResolution = resolveDhanProviderConfig(env, now());
  if (!cfgResolution.ok) {
    if (cfgResolution.failure.code === 'PRODUCTION_NOT_AUTHORIZED') {
      return {
        ok: false,
        phase: 'validate',
        code: 'PRODUCTION_NOT_AUTHORIZED',
        error: cfgResolution.failure.message,
      };
    }
    if (cfgResolution.failure.code === 'CONFIGURATION_INCOMPLETE') {
      return {
        ok: false,
        phase: 'configure',
        code: 'CONFIGURATION_INCOMPLETE',
        error: cfgResolution.failure.message,
      };
    }
    // CREDENTIALS_UNAVAILABLE and CREDENTIALS_EXPIRED are valid pre-access / expired
    // states: the local daemon starts on loopback, reports honest health, and fails
    // closed per quote/historical call with the typed DhanFailureCode.
  }

  // 6. Compose approved IPD-internal vault resolver, transport, registry & service.
  let securityMaster: SecurityMaster;
  let instrumentRegistry: DhanInstrumentRegistry;
  try {
    securityMaster = options.securityMaster ?? getGovernedBroadSecurityMaster();
    instrumentRegistry =
      options.instrumentRegistry ?? loadGovernedP7InstrumentRegistry(options.p7ManifestPath);
  } catch {
    return {
      ok: false,
      phase: 'configure',
      code: 'CONFIGURATION_INCOMPLETE',
      error: 'Failed to initialize governed SecurityMaster or P7 instrument registry.',
    };
  }

  const resolver =
    options.credentialResolver ??
    new LocalHostVaultDhanCredentialResolver({
      ...(options.vaultBackend !== undefined ? { backend: options.vaultBackend } : {}),
      now,
      env,
    });
  const vaultReadiness = resolver.describeBackendReadiness();

  let providerTransport: DhanHttpTransport;
  let vendorEgressMode: MarketDataDaemonDiagnostics['vendorEgressMode'];
  if (options.providerTransport !== undefined) {
    providerTransport = options.providerTransport;
    vendorEgressMode = 'SYNTHETIC_INJECTED';
  } else if (vaultReadiness.liveResolutionSupported && cfgResolution.ok) {
    providerTransport = new DhanServerHttpsTransport({
      allowedBaseUrl: cfgResolution.config.baseUrl,
      env,
    });
    vendorEgressMode = 'IPD_SERVER_HTTPS';
  } else {
    providerTransport = new PreAccessNoNetworkTransport();
    vendorEgressMode = 'DISABLED_PRE_ACCESS';
  }

  const apiClient = new DhanApiClient({
    config: cfgResolution.config,
    credentialResolver: resolver,
    transport: providerTransport,
    now: () => now().getTime(),
  });

  const service = new DhanMarketDataService({
    client: apiClient,
    securityMaster,
    instrumentRegistry,
    now,
  });
  service.start();

  // 7. Create and bind loopback HTTP server with clean rollback on bind failure.
  let server: Server;
  try {
    server = createMarketDataHttpServer({
      service,
      identityService: new DhanIdentityApiService(securityMaster, instrumentRegistry),
      token: transportToken,
      host,
      ...(options.requestTimeoutMs !== undefined ? { requestTimeoutMs: options.requestTimeoutMs } : {}),
      env,
    });
  } catch (err: unknown) {
    service.stop();
    return {
      ok: false,
      phase: 'bind',
      code: 'BIND_FAILED',
      error: err instanceof Error ? err.message : 'Failed to construct market-data HTTP server',
    };
  }

  const listenHost = host === '[::1]' ? '::1' : host;
  try {
    await new Promise<void>((resolveListen, rejectListen) => {
      const onError = (err: Error): void => {
        server.removeListener('listening', onListening);
        rejectListen(err);
      };
      const onListening = (): void => {
        server.removeListener('error', onError);
        resolveListen();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      try {
        server.listen(port, listenHost);
      } catch (syncErr) {
        server.removeListener('error', onError);
        server.removeListener('listening', onListening);
        rejectListen(syncErr instanceof Error ? syncErr : new Error(String(syncErr)));
      }
    });
  } catch (err: unknown) {
    service.stop();
    try {
      server.close();
    } catch {
      // ignore close on unbound server
    }
    const code = (err as NodeJS.ErrnoException | null)?.code;
    return {
      ok: false,
      phase: 'bind',
      code: 'BIND_FAILED',
      error: `Failed to bind market-data HTTP daemon on ${host}:${port}${code ? ` (${code})` : ''}.`,
    };
  }

  const addr = server.address();
  if (!addr || typeof addr === 'string' || !isVerifiedLoopbackBoundAddress((addr as AddressInfo).address)) {
    service.stop();
    await new Promise<void>((r) => server.close(() => r()));
    return {
      ok: false,
      phase: 'bind',
      code: 'NON_LOOPBACK_HOST_REFUSED',
      error: 'Bound socket address failed post-listen loopback verification; closed immediately.',
    };
  }

  const addressInfo = addr as AddressInfo;
  const formattedHost = addressInfo.family === 'IPv6' ? '[::1]' : '127.0.0.1';
  const diagnostics: MarketDataDaemonDiagnostics = {
    status: 'LISTENING',
    host,
    boundAddress: addressInfo.address,
    port: addressInfo.port,
    baseUrl: `http://${formattedHost}:${addressInfo.port}`,
    providerReadiness: cfgResolution.config.readiness,
    vaultBackendId: vaultReadiness.backendId,
    liveCredentialResolutionSupported: vaultReadiness.liveResolutionSupported,
    vendorEgressMode,
    qualifiedMappingsLoaded: instrumentRegistry.list().length,
    liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS',
    providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
  };

  const shutdownTimeoutMs = options.shutdownTimeoutMs ?? DEFAULT_DAEMON_SHUTDOWN_TIMEOUT_MS;
  let shutdownPromise: Promise<void> | null = null;

  const shutdown = (): Promise<void> => {
    if (shutdownPromise) return shutdownPromise;
    shutdownPromise = new Promise<void>((resolveShutdown) => {
      service.stop();
      if (!server.listening) {
        resolveShutdown();
        return;
      }
      server.closeIdleConnections?.();
      const forceTimer = setTimeout(() => {
        server.closeAllConnections?.();
        resolveShutdown();
      }, shutdownTimeoutMs);
      forceTimer.unref?.();
      server.close(() => {
        clearTimeout(forceTimer);
        resolveShutdown();
      });
    });
    return shutdownPromise;
  };

  return {
    ok: true,
    handle: {
      diagnostics,
      service,
      server,
      shutdown,
    },
    diagnostics,
  };
}

export interface DaemonCliIo {
  writeStderr(line: string): void;
}

/**
 * CLI runner invoked when `dhan_local_daemon.js` is executed directly by Node.
 * Installs graceful SIGINT/SIGTERM handlers and never writes credentials to logs.
 */
export async function runMarketDataDaemonCli(
  options: {
    readonly env?: DhanEnvSource;
    readonly argv?: readonly string[];
    readonly io?: DaemonCliIo;
  } = {}
): Promise<{ readonly exitCode: number; readonly handle?: MarketDataDaemonHandle }> {
  const io = options.io ?? { writeStderr: (line: string) => console.error(line) };
  const outcome = await startMarketDataDaemon({
    env: options.env ?? process.env,
    argv: options.argv ?? process.argv.slice(2),
  });

  if (!outcome.ok) {
    io.writeStderr(
      `[ipd-market-data-daemon] startup refused at phase ${outcome.phase} [${outcome.code}]: ${outcome.error}`
    );
    return { exitCode: 1 };
  }

  io.writeStderr(formatDaemonStartupLine(outcome.diagnostics));
  return { exitCode: 0, handle: outcome.handle };
}

const isMain = (): boolean => {
  if (!process.argv[1]) return false;
  return (
    process.argv[1].endsWith('dhan_local_daemon.js') ||
    process.argv[1].endsWith('dhan_local_daemon.ts')
  );
};

if (isMain()) {
  runMarketDataDaemonCli()
    .then((res) => {
      if (res.exitCode !== 0 || !res.handle) {
        process.exit(res.exitCode || 1);
      }
      const activeHandle = res.handle;
      let stopping = false;
      const onSignal = (sig: NodeJS.Signals): void => {
        if (stopping) return;
        stopping = true;
        process.off('SIGINT', onSigInt);
        process.off('SIGTERM', onSigTerm);
        console.error(`[ipd-market-data-daemon] received ${sig}, shutting down cleanly`);
        void activeHandle.shutdown().finally(() => {
          console.error('[ipd-market-data-daemon] stopped');
          process.exit(0);
        });
      };
      const onSigInt = (): void => onSignal('SIGINT');
      const onSigTerm = (): void => onSignal('SIGTERM');
      process.on('SIGINT', onSigInt);
      process.on('SIGTERM', onSigTerm);
    })
    .catch(() => {
      console.error('[ipd-market-data-daemon] startup refused: unexpected internal error');
      process.exit(1);
    });
}
