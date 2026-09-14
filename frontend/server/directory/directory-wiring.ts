/**
 * Program v3.0 — PF-2 Trigger Wiring (composition factory) — TW-1…TW-5.
 *
 * COMPOSITION ONLY. This module wires already-promoted authorities together; it introduces
 * NO new authority, NO new RBAC model, NO credential creation, NO scheduler/worker, and
 * NO roster HTTP view (TD-6 preserved — the sync endpoint returns counts only).
 *
 * Binding decisions realized here:
 *   TW-1  continue-degraded — a failed startup seed is audited and swallowed; the roster stays
 *         NO_SYNC / fail-closed and the server still listens.
 *   TW-3  environment-configured IdP settings + SecretAuthority credential; no literals, no
 *         defaults, no dev-admin-credential fallback; fail closed on missing configuration.
 *   TW-4  await-before-listen — `startupSeed()` is awaited by the transport bootstrap before
 *         `server.listen`; it never throws.
 *   TW-5  single in-flight guard — one process-level boolean; a concurrent trigger is rejected
 *         deterministically with SYNC_IN_PROGRESS.
 *
 * Preserved: TD-5a (startup seed + operator trigger, no scheduler) · TD-5c (whole-snapshot) ·
 * TD-6 (server-internal-only roster; no roster HTTP view) · TD-7b deferred (single process,
 * no distributed lock) · PF-1 / SecretAuthority / RosterDirectory / idp-sync UNMODIFIED.
 *
 * Secret handling (SM2/SM3/SM10): the service-account secret is resolved ONLY inside
 * `SecretAuthority.useSecret(...)` and handed straight to the reader's token request. It is
 * never returned, retained, logged, audited, or placed in any DTO.
 */
import { PersistenceService, resolveDataDir } from '../persistence/persistence-service';
import { SecretAuthority, EnvSecretStore, FileSecretStore, type SecretStore } from '../secrets/secret-authority';
import { RosterDirectory } from './roster-directory';
import { KeycloakAdminReader, syncDirectory, type IdpReader, type SyncAuditEvent, type SyncResult } from './idp-sync';

/** TW-3 — pinned environment variable names. */
export const ENV_KEYCLOAK_URL = 'KEYCLOAK_URL';
export const ENV_REALM = 'IIPS_KEYCLOAK_REALM';
export const ENV_CLIENT_ID = 'IIPS_KEYCLOAK_CLIENT_ID';
export const ENV_SECRET_NAME = 'IIPS_SYNC_SECRET_NAME';
export const ENV_SECRET_VALUE = 'IIPS_SYNC_SECRET';

/** Scope recorded against the sync service-account secret (SM3). */
export const SYNC_SECRET_SCOPE = 'pf2-directory-sync';

/** Configuration error — TW-3 fail-closed. Never carries a secret value. */
export class DirectoryConfigError extends Error {
  constructor(readonly code: 'CONFIG_MISSING', message: string) {
    super(message);
    this.name = 'DirectoryConfigError';
  }
}

/** TW-5 — deterministic concurrent-trigger rejection. */
export class SyncInProgressError extends Error {
  readonly code = 'SYNC_IN_PROGRESS' as const;
  constructor() {
    super('a directory sync is already in progress');
    this.name = 'SyncInProgressError';
  }
}

export interface DirectoryConfig {
  readonly baseUrl: string;
  readonly realm: string;
  readonly clientId: string;
  readonly secretName: string;
  readonly dataDir: string;
  /** Which SecretStore realization is wired (recorded per the specification, §2). */
  readonly secretStore: 'env' | 'file';
}

/**
 * TW-3: resolve configuration from the environment, fail-closed.
 *
 * `EnvSecretStore` (valueVar `IIPS_SYNC_SECRET`) is the v1 wiring; when that variable is
 * absent the equally-allowed `FileSecretStore` under `IIPS_DATA_DIR` is selected instead.
 * A missing secret then fails closed at use time as `SECRET_MISSING` (SM6) — never a default.
 */
export function resolveDirectoryConfig(env: NodeJS.ProcessEnv = process.env): DirectoryConfig {
  const require = (name: string): string => {
    const v = env[name];
    if (v === undefined || v.trim() === '') {
      throw new DirectoryConfigError('CONFIG_MISSING', `${name} is required for PF-2 directory sync`);
    }
    return v.trim();
  };
  return {
    baseUrl: require(ENV_KEYCLOAK_URL),
    realm: require(ENV_REALM),
    clientId: require(ENV_CLIENT_ID),
    secretName: require(ENV_SECRET_NAME),
    dataDir: resolveDataDir(env),
    secretStore: env[ENV_SECRET_VALUE] !== undefined && env[ENV_SECRET_VALUE] !== '' ? 'env' : 'file',
  };
}

/** Build the SecretStore selected by the resolved configuration (TW-3). */
export function createSecretStore(config: DirectoryConfig, env: NodeJS.ProcessEnv = process.env): SecretStore {
  if (config.secretStore === 'env') {
    return new EnvSecretStore(env, {
      [config.secretName]: { valueVar: ENV_SECRET_VALUE, scope: SYNC_SECRET_SCOPE },
    });
  }
  return new FileSecretStore(config.dataDir);
}

export interface DirectoryWiring {
  readonly directory: RosterDirectory;
  readonly idp: IdpReader;
  readonly config: DirectoryConfig;
}

/**
 * Build the composed wiring: PF-1 persistence → RosterDirectory, SecretAuthority → the
 * reader's `getSecret` seam, KeycloakAdminReader as the IdP source.
 *
 * `getSecret` delegates to `SecretAuthority.useSecret`, which fails closed on a
 * missing/expired/empty secret. The value escapes only as the resolved promise consumed
 * immediately by the reader's token request.
 */
export function createDirectoryWiring(
  opts: {
    readonly env?: NodeJS.ProcessEnv;
    readonly config?: DirectoryConfig;
    readonly fetchImpl?: typeof fetch;
  } = {},
): DirectoryWiring {
  const env = opts.env ?? process.env;
  const config = opts.config ?? resolveDirectoryConfig(env);

  const persistence = new PersistenceService({ dataDir: config.dataDir });
  const directory = new RosterDirectory({ persistence });

  const secrets = new SecretAuthority({
    store: createSecretStore(config, env),
    scope: SYNC_SECRET_SCOPE,
  });

  const idp = new KeycloakAdminReader({
    baseUrl: config.baseUrl,
    realm: config.realm,
    clientId: config.clientId,
    // SM3/SM10: the value lives only inside the callback; it is returned to the reader's
    // token request and never retained, logged, or audited here.
    getSecret: () => secrets.useSecret(config.secretName, (value) => value),
    ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
  });

  return { directory, idp, config };
}

// --- Lazy process singletons ------------------------------------------------------------

let wiring: DirectoryWiring | null = null;
let syncInFlight = false;

/** Lazily construct (once per process) the shared wiring. */
export function getDirectoryWiring(env: NodeJS.ProcessEnv = process.env): DirectoryWiring {
  if (!wiring) wiring = createDirectoryWiring({ env });
  return wiring;
}

/** Test seam: reset the process singletons and the in-flight guard. */
export function resetDirectoryWiring(): void {
  wiring = null;
  syncInFlight = false;
}

/** TW-5: observable in-flight state (used by tests and the 409 mapping). */
export function isSyncInFlight(): boolean {
  return syncInFlight;
}

/**
 * TW-5 — run the whole-snapshot sync under the single in-flight guard.
 *
 * Throws `SyncInProgressError` when a sync is already running (deterministic; the caller maps
 * it to 409). Any `SyncError` from the reader/sync propagates unchanged so the transport can
 * map it per the pinned error table.
 */
export async function runGuardedSync(
  opts: {
    readonly wiring?: DirectoryWiring;
    readonly audit?: (event: SyncAuditEvent) => void;
  } = {},
): Promise<SyncResult> {
  if (syncInFlight) throw new SyncInProgressError();
  syncInFlight = true;
  try {
    const w = opts.wiring ?? getDirectoryWiring();
    return await syncDirectory({
      directory: w.directory,
      idp: w.idp,
      ...(opts.audit ? { audit: opts.audit } : {}),
    });
  } finally {
    syncInFlight = false;
  }
}

/** Result of the TW-4 startup seed attempt. Never throws — TW-1 continue-degraded. */
export interface StartupSeedOutcome {
  readonly attempted: boolean;
  readonly outcome: 'success' | 'failed';
  readonly result?: SyncResult;
  /** Failure classification only — never a secret value. */
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

/**
 * TW-4 + TW-1 — the startup seed.
 *
 * Awaited by the transport bootstrap BEFORE `server.listen`. On failure (configuration,
 * secret, token, users, roles, malformed) the failure is reported and the roster is left
 * NO_SYNC / fail-closed. This function NEVER throws, so it can never crash boot.
 */
export async function startupSeed(
  opts: {
    readonly env?: NodeJS.ProcessEnv;
    readonly wiring?: DirectoryWiring;
    readonly audit?: (event: SyncAuditEvent) => void;
    readonly log?: (message: string) => void;
  } = {},
): Promise<StartupSeedOutcome> {
  const log = opts.log ?? (() => {});
  try {
    const w = opts.wiring ?? getDirectoryWiring(opts.env ?? process.env);
    const result = await runGuardedSync({ wiring: w, ...(opts.audit ? { audit: opts.audit } : {}) });
    log(`PF-2 directory startup seed: success (realm=${result.realm} tenants=${result.tenantCount} users=${result.userCount})`);
    return { attempted: true, outcome: 'success', result };
  } catch (e) {
    // TW-1: continue-degraded. Classify without ever surfacing a secret.
    const code = (e as { code?: string }).code ?? 'SEED_FAILED';
    const message = e instanceof Error ? e.message : String(e);
    log(`PF-2 directory startup seed: FAILED (${code}) — roster remains fail-closed (NO_SYNC); server continues`);
    return { attempted: true, outcome: 'failed', errorCode: code, errorMessage: message };
  }
}
