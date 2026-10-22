/**
 * Gate 3 — process entrypoint (act §4.2 item 14; C2/C5.3; T-E).
 *
 * Startup order is fixed: validate -> connect -> migrate -> verify -> bind. Any
 * fault returns a bounded phase-coded outcome and creates no endpoint; there is
 * no fallback, retry or downgrade. This module never imports
 * persistence/provisioning.ts, so Gate A′ code is unreachable from startup.
 */
import type { DatabaseSync } from 'node:sqlite';
import { isAbsolute } from 'node:path';
import {
  assertSupportedRuntime,
  closeDatabase,
  getProcessConnection,
  openDatabase,
  RuntimeUnsupportedError,
} from '../persistence/connection.js';
import {
  ensureMigrations,
  MigrationIntegrityError,
  type Migration,
} from '../persistence/migration_ledger.js';
import { migration001InitialSchema } from '../persistence/migrations/001_initial_schema.js';
import { migration002AuditEventSequence } from '../persistence/migrations/002_audit_event_sequence.js';
import { migration003LocalPrincipalBindings } from '../persistence/migrations/003_local_principal_bindings.js';
import { verifyAuditChain } from '../persistence/audit.js';
import {
  EndpointConfigurationError,
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  type EndpointTarget,
  type IpcHandle,
} from './endpoint.js';
import { createConnectionHandler } from './dispatch.js';

export const DATABASE_PATH_SETTING = 'IIPS_G3_DATABASE_PATH';

export const GATE3_MIGRATIONS: readonly Migration[] = [
  migration001InitialSchema,
  migration002AuditEventSequence,
  migration003LocalPrincipalBindings,
];

export type StartupPhase = 'validate' | 'connect' | 'migrate' | 'verify' | 'bind';

export interface StartupOutcome {
  readonly ok: boolean;
  readonly phase?: StartupPhase;
  readonly error?: string;
  readonly target?: EndpointTarget;
  readonly handle?: IpcHandle;
}

export interface StartupOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  serverFactory?: (path: string) => import('node:net').Server;
}

function fail(phase: StartupPhase, error: unknown): StartupOutcome {
  return {
    ok: false,
    phase,
    error: error instanceof Error ? error.message : String(error),
  };
}

export async function startIpcServer(options: StartupOptions = {}): Promise<StartupOutcome> {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  let db: DatabaseSync | undefined;
  // True only when this call opened the process connection itself. A startup
  // failure closes a connection it owns (never a half-initialised store left
  // open), but must not close one a caller had already opened and lent via
  // the idempotent open.
  let ownsDatabase = false;
  const failAndCloseOwnedDatabase = (phase: StartupPhase, error: unknown): StartupOutcome => {
    if (ownsDatabase) {
      try {
        closeDatabase();
      } catch {
        // The startup failure is authoritative; a cleanup fault must not mask it.
      }
      ownsDatabase = false;
    }
    return fail(phase, error);
  };

  // 1. validate configuration and runtime
  let target: EndpointTarget;
  try {
    assertSupportedRuntime();
    target = resolveEndpointTarget(env, platform);
    const databasePath = env[DATABASE_PATH_SETTING];
    if (typeof databasePath !== 'string' || !isAbsolute(databasePath)) {
      throw new EndpointConfigurationError(`${DATABASE_PATH_SETTING} must be set to an absolute path`);
    }
  } catch (error) {
    return fail('validate', error);
  }

  // 2. connect to the local database
  try {
    const preExisting = getProcessConnection();
    db = openDatabase(env[DATABASE_PATH_SETTING] as string);
    ownsDatabase = preExisting === null;
  } catch (error) {
    return fail('connect', error);
  }

  // 3. verify and apply the fixed migration set
  try {
    ensureMigrations(db, GATE3_MIGRATIONS);
  } catch (error) {
    return failAndCloseOwnedDatabase('migrate', error);
  }

  // 4. verify the local audit chain
  try {
    if (!verifyAuditChain(db)) {
      return failAndCloseOwnedDatabase(
        'verify',
        new MigrationIntegrityError('the audit-event hash chain does not verify'),
      );
    }
  } catch (error) {
    return failAndCloseOwnedDatabase('verify', error);
  }

  // 5. bind the same-host endpoint
  try {
    // Windows named pipes cannot deliver a usable half-close EOF before the
    // pipe breaks, so the pipe transport settles via the flush guard; AF_UNIX
    // keeps the airtight half-close gate.
    const settlement = settlementPolicyForEndpoint(target);
    const handle: IpcHandle = await listenIpc(target, createConnectionHandler(db, { settlement }), {
      platform,
      ...(options.serverFactory ? { serverFactory: options.serverFactory } : {}),
    });
    return { ok: true, target: handle.target, handle };
  } catch (error) {
    // Typed bind refusals (EndpointCollisionError and peers) and every other
    // bind fault share the one bounded phase-coded outcome; no endpoint exists.
    return { ...failAndCloseOwnedDatabase('bind', error), target };
  }
}

const isMain = (): boolean => {
  if (!process.argv[1]) return false;
  return process.argv[1].endsWith('entrypoint.js') || process.argv[1].endsWith('entrypoint.ts');
};

if (isMain()) {
  startIpcServer()
    .then((outcome) => {
      if (!outcome.ok) {
        console.error(`[g3] startup refused at phase ${outcome.phase}: ${outcome.error}`);
        process.exit(1);
      }
      // Readiness is reported only here: startIpcServer resolves after the
      // OS-confirmed bind (listenIpc), never before it.
      console.error(`[g3] listening on ${outcome.target?.kind} ${outcome.target?.path}`);

      // Safe shutdown: one idempotent teardown that stops the endpoint
      // (destroying live connections) before closing the database. The
      // process then exits by draining, with exitCode set only on a
      // teardown fault — cleanup is never truncated by process.exit().
      let shutdownPromise: Promise<void> | null = null;
      const shutdown = (): Promise<void> => {
        if (shutdownPromise) {
          return shutdownPromise;
        }
        shutdownPromise = (async () => {
          try {
            await outcome.handle?.stop();
          } catch (error) {
            console.error(
              `[g3] endpoint shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            process.exitCode = 1;
          }
          try {
            closeDatabase();
          } catch (error) {
            console.error(
              `[g3] database shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            process.exitCode = 1;
          }
        })();
        return shutdownPromise;
      };
      process.once('SIGTERM', () => {
        void shutdown();
      });
      process.once('SIGINT', () => {
        void shutdown();
      });
    })
    .catch((error: unknown) => {
      console.error(`[g3] startup refused: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
