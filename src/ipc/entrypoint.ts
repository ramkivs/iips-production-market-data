/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Operator-Run Endpoint Startup (L-IPC-1 C2, C5.3, C5.5, C11)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * C2 — the endpoint is created ONLY after the fixed startup sequence succeeds:
 *
 *      1. VALIDATE    configuration (absolute durable path; no defaults, no in-memory fallback)
 *      2. CONNECT     the single durable store
 *      3. MIGRATE     apply the append-only migration ledger
 *      4. VERIFY      schema version matches the registry AND the A-2 binding table exists
 *      5. PRINCIPAL   exactly one ACTIVE binding resolves (C5.5); otherwise refuse
 *      6. BIND        the same-host endpoint, exactly once
 *
 * Any failure closes everything opened so far and refuses to serve. There is no partial
 * startup, no retry loop and no degraded mode.
 *
 * C11 — this module never opens a second portfolio store: it either opens THE configured
 * store or accepts an already-open handle and reuses its connection.
 */

import type { PersistenceConnection } from '../persistence/connection.js';
import type { PersistenceConfig } from '../persistence/config.js';
import { loadPersistenceConfig } from '../persistence/config.js';
import { runMigrations, readSchemaVersion } from '../persistence/migrations/index.js';
import { SCHEMA_VERSION_TARGET, MIGRATIONS } from '../persistence/migrations/registry.js';
import type { PersistenceHandle } from '../persistence/bootstrap.js';
import { initializePersistenceWithConfig } from '../persistence/bootstrap.js';
import { LocalPrincipalService } from '../app_identity/local_principal.js';
import { DurablePortfolioStore } from '../portfolio/durable-store.js';
import type { EffectiveDatedMapping } from '../identity/mapping_store.js';

import { endpointLayout, type EndpointLayout } from './endpoint.js';
import { IpcRefusal, IpcRefusalSink } from './errors.js';
import {
  IpcServer,
  type IpcOperationDispatcher,
  type IpcPrincipal,
  type IpcServerLimits,
} from './server.js';
import { CanonicalIdentityBoundary } from '../user_portfolio/canonical_identity.js';
import { UserPortfolioOperations, assertListPayload } from '../user_portfolio/operations.js';
import { isUserPortfolioRefusal } from '../user_portfolio/errors.js';

/** The startup order, exported so evidence can assert it rather than describe it. */
export const IPC_STARTUP_PHASES = [
  'VALIDATE_CONFIGURATION',
  'CONNECT_STORE',
  'APPLY_MIGRATIONS',
  'VERIFY_SCHEMA',
  'RESOLVE_PRINCIPAL',
  'BIND_ENDPOINT',
] as const;

export type IpcStartupPhase = (typeof IPC_STARTUP_PHASES)[number];

export interface IpcEndpointOptions {
  /** Endpoint name (opaque, bounded). Same name on both processes. */
  readonly endpointName: string;
  /** POSIX parent directory. Ignored on Windows (named pipe namespace). */
  readonly directory?: string;
  /** Environment source when no handle is supplied. Defaults to `process.env`. */
  readonly env?: NodeJS.ProcessEnv;
  /** Already-open store handle. When supplied it is REUSED (never a second store). */
  readonly handle?: PersistenceHandle;
  /** Optional limit overrides. */
  readonly limits?: Partial<IpcServerLimits>;
  /** Optional local refusal sink. */
  readonly refusalSink?: IpcRefusalSink;
  /** Authoritative identity mappings consumed read-only by the C12 boundary. */
  readonly identityMappings?: readonly EffectiveDatedMapping[];
  /** Optional phase observer (tests / operator diagnostics). Receives phase names only. */
  readonly onPhase?: (phase: IpcStartupPhase) => void;
}

export interface IpcEndpointHandle {
  readonly layout: EndpointLayout;
  readonly principal: IpcPrincipal;
  readonly schemaVersion: string;
  readonly server: IpcServer;
  readonly operations: UserPortfolioOperations;
  readonly canonicalIdentity: CanonicalIdentityBoundary;
  readonly phases: readonly IpcStartupPhase[];
  close(): Promise<void>;
}

/** Reads the single ACTIVE binding and refuses anything else (C3, C5.5). */
export function resolveProvisionedPrincipal(connection: PersistenceConnection): IpcPrincipal {
  try {
    const binding = new LocalPrincipalService(connection).resolveActiveBinding();
    if (
      typeof binding.endpointId !== 'string' ||
      binding.endpointId.trim() === '' ||
      typeof binding.applicationUserId !== 'string' ||
      binding.applicationUserId.trim() === '' ||
      typeof binding.tenantId !== 'string' ||
      binding.tenantId.trim() === '' ||
      binding.state !== 'ACTIVE'
    ) {
      throw new IpcRefusal('BINDING_INVALID', 'The provisioned binding is malformed or not ACTIVE.');
    }
    return {
      endpointId: binding.endpointId,
      applicationUserId: binding.applicationUserId,
      tenantId: binding.tenantId,
    };
  } catch (error) {
    if (error instanceof IpcRefusal) {
      throw error;
    }
    // Zero or more than one ACTIVE binding, or a store failure: refuse, disclose nothing.
    throw new IpcRefusal('BINDING_ABSENT', 'No single active local principal binding is resolvable.');
  }
}

/** Translates the portfolio refusal vocabulary onto the IPC refusal vocabulary. */
function toIpcRefusal(error: unknown): never {
  if (isUserPortfolioRefusal(error)) {
    const code = error.code;
    if (code === 'RESOURCE_UNAVAILABLE') {
      throw new IpcRefusal('RESOURCE_UNAVAILABLE', error.message);
    }
    if (code === 'WRITE_NOT_AUTHORIZED') {
      throw new IpcRefusal('WRITE_NOT_AUTHORIZED', error.message);
    }
    if (code === 'CALLER_SUPPLIED_AUTHORITY') {
      throw new IpcRefusal('CALLER_SUPPLIED_AUTHORITY', error.message);
    }
    if (code === 'CANONICAL_IDENTITY_UNRESOLVED') {
      throw new IpcRefusal('CANONICAL_IDENTITY_UNRESOLVED', error.message);
    }
    throw new IpcRefusal('MALFORMED_REQUEST', error.message);
  }
  throw error;
}

/** Fixed dispatcher: four operations, no dynamic routing, scope always from the binding. */
export function createPortfolioDispatcher(operations: UserPortfolioOperations): IpcOperationDispatcher {
  const OPERATIONS = ['portfolio.list', 'portfolio.get', 'portfolio.analytics', 'portfolio.save'] as const;

  return {
    operations: OPERATIONS,
    execute(operation: string, payload: unknown, context): unknown {
      const scope = {
        applicationUserId: context.principal.applicationUserId,
        tenantId: context.principal.tenantId,
      };
      try {
        switch (operation) {
          case 'portfolio.list':
            // C7 — a scope cannot ride along on a list request; it is refused, not dropped.
            assertListPayload(payload);
            return operations.list(scope);
          case 'portfolio.get':
            return operations.get(scope, payload);
          case 'portfolio.analytics':
            return operations.analytics(scope, payload);
          case 'portfolio.save':
            return operations.save(scope, payload);
          default:
            throw new IpcRefusal('UNKNOWN_OPERATION', 'Operation is not dispatched by this endpoint.');
        }
      } catch (error) {
        if (error instanceof IpcRefusal) {
          throw error;
        }
        return toIpcRefusal(error);
      }
    },
  };
}

/**
 * Starts the endpoint. Executes the phases IN ORDER and refuses on the first failure.
 *
 * When `handle` is supplied the caller owns the store's lifetime and this function does not
 * close it; otherwise the function opens THE configured store and owns it.
 */
export async function startIpcEndpoint(options: IpcEndpointOptions): Promise<IpcEndpointHandle> {
  const phases: IpcStartupPhase[] = [];
  const note = (phase: IpcStartupPhase): void => {
    phases.push(phase);
    options.onPhase?.(phase);
  };

  let ownedHandle: PersistenceHandle | null = null;
  let connection: PersistenceConnection;
  let schemaVersion: string;

  // ── 1. VALIDATE ───────────────────────────────────────────────────────────────────────
  note('VALIDATE_CONFIGURATION');
  let config: PersistenceConfig;
  if (options.handle) {
    if (!options.handle.isOpen) {
      throw new IpcRefusal('BINDING_INVALID', 'The supplied persistence handle is closed.');
    }
    config = options.handle.config;
  } else {
    // Fails closed on missing / relative paths before any connection is attempted.
    config = loadPersistenceConfig(options.env ?? process.env);
  }

  // ── 2. CONNECT ────────────────────────────────────────────────────────────────────────
  note('CONNECT_STORE');
  if (options.handle) {
    connection = options.handle.connection;
  } else {
    // `initializePersistenceWithConfig` is the accepted single-open path (pragmas verified).
    ownedHandle = initializePersistenceWithConfig(config);
    connection = ownedHandle.connection;
  }

  try {
    // ── 3. MIGRATE ─────────────────────────────────────────────────────────────────────
    note('APPLY_MIGRATIONS');
    runMigrations(connection);

    // ── 4. VERIFY ──────────────────────────────────────────────────────────────────────
    note('VERIFY_SCHEMA');
    schemaVersion = readSchemaVersion(connection);
    if (schemaVersion !== SCHEMA_VERSION_TARGET) {
      throw new IpcRefusal('BINDING_INVALID', 'Schema version does not match the migration registry.');
    }
    if (MIGRATIONS.length === 0) {
      throw new IpcRefusal('BINDING_INVALID', 'Migration registry is empty.');
    }
    try {
      // The A-2 binding table must exist before any principal can be resolved.
      connection.prepare('SELECT 1 FROM local_principal_bindings LIMIT 1').get();
    } catch {
      throw new IpcRefusal('BINDING_INVALID', 'The local principal binding table is not present.');
    }

    // ── 5. PRINCIPAL (before binding the endpoint) ────────────────────────────────────
    note('RESOLVE_PRINCIPAL');
    const principal = resolveProvisionedPrincipal(connection);

    // ── 6. BIND ────────────────────────────────────────────────────────────────────────
    note('BIND_ENDPOINT');
    const layout = endpointLayout(options.endpointName, options.directory);

    const canonicalIdentity = new CanonicalIdentityBoundary();
    if (options.identityMappings && options.identityMappings.length > 0) {
      canonicalIdentity.seed(options.identityMappings);
    }

    const store = new DurablePortfolioStore(connection);
    const operations = new UserPortfolioOperations(store, canonicalIdentity);

    const server = new IpcServer({
      resolvePrincipal: () => resolveProvisionedPrincipal(connection),
      operations: createPortfolioDispatcher(operations),
      ...(options.limits ? { limits: options.limits } : {}),
      ...(options.refusalSink ? { refusalSink: options.refusalSink } : {}),
    });

    await server.listen(layout);

    let closed = false;
    return {
      layout,
      principal,
      schemaVersion,
      server,
      operations,
      canonicalIdentity,
      phases,
      async close(): Promise<void> {
        if (closed) {
          return;
        }
        closed = true;
        await server.close();
        if (ownedHandle) {
          ownedHandle.close();
        }
      },
    };
  } catch (error) {
    // Fail closed: never leave a half-initialised store open.
    if (ownedHandle) {
      try {
        ownedHandle.close();
      } catch {
        /* swallow: the original failure is authoritative */
      }
    }
    if (error instanceof IpcRefusal) {
      throw error;
    }
    throw new IpcRefusal('BINDING_INVALID', 'Endpoint startup refused.');
  }
}
