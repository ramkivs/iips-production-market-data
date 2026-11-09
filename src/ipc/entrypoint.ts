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
import { assertSupportedRuntime, openDatabase, RuntimeUnsupportedError } from '../persistence/connection.js';
import {
  ensureMigrations,
  MigrationIntegrityError,
  type Migration,
} from '../persistence/migration_ledger.js';
import { migration001InitialSchema } from '../persistence/migrations/001_initial_schema.js';
import { migration002AuditEventSequence } from '../persistence/migrations/002_audit_event_sequence.js';
import { migration003LocalPrincipalBindings } from '../persistence/migrations/003_local_principal_bindings.js';
import { migration004PortfolioContributionProvenance } from '../persistence/migrations/004_portfolio_contribution_provenance.js';
import { migration005HoldingSecurityIdentity } from '../persistence/migrations/005_holding_security_identity.js';
import { verifyAuditChain } from '../persistence/audit.js';
import {
  EndpointCollisionError,
  EndpointConfigurationError,
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  UnsafeEndpointDirectoryError,
  type EndpointTarget,
  type IpcHandle,
} from './endpoint.js';
import { createConnectionHandler } from './dispatch.js';
import { LOCAL_PERSONAL_USE_SETTING, revisionCapFor } from './localPersonalUse.js';
import { createBrokerImportConsumer, type BrokerImportConsumer } from './brokerImportConsumer.js';
import {
  brokerImportConsumerOptions,
  composeBrokerImportIdentityDependencies,
  type BrokerImportIdentityDependencies,
  type ComposeBrokerImportIdentityDependenciesOptions,
} from './brokerImportComposition.js';

export const DATABASE_PATH_SETTING = 'IIPS_G3_DATABASE_PATH';

export const GATE3_MIGRATIONS: readonly Migration[] = [
  migration001InitialSchema,
  migration002AuditEventSequence,
  migration003LocalPrincipalBindings,
  migration004PortfolioContributionProvenance,
  migration005HoldingSecurityIdentity,
];

export type StartupPhase = 'validate' | 'connect' | 'migrate' | 'verify' | 'compose' | 'bind';

export interface StartupOutcome {
  readonly ok: boolean;
  readonly phase?: StartupPhase;
  readonly error?: string;
  readonly target?: EndpointTarget;
  readonly handle?: IpcHandle;
  /**
   * O5-A (PA act `IIPS-V3-O05-PRODUCTION-CONSUMER-PA-DECISION-2026-10-30-01`
   * clause 1(b)): the durable broker-import consumer this process constructed
   * over its own handle. Present on success only. Its every write attempt is
   * refused by the frozen Gate E W-1 conjunction with zero store effect; it
   * exists to make the durable leg reachable from shipped code, not to enable a
   * write. Nothing dispatches to it.
   *
   * Stage 4: this consumer is composed with the governed P04 security master
   * and retained P7 instrument registry, so importing holdings qualifies each
   * security identity through the existing joint P04 → P7 path. The write gate
   * is unchanged: qualification never implies authorization.
   */
  readonly brokerImportConsumer?: BrokerImportConsumer;
  /**
   * The identity dependencies the consumer above was actually composed with,
   * so the composed path is inspectable rather than inferred. Provenance only:
   * it records which governed sources were wired, not that any holding
   * qualified and not that any write is authorized.
   */
  readonly brokerImportIdentity?: BrokerImportIdentityProvenance;
}

/** Provenance of the composed broker-import identity dependencies. */
export interface BrokerImportIdentityProvenance {
  /** Governed P04 corpus revision, when the master carries one. */
  readonly securityMasterRevision: string | null;
  /** Instrument mappings actually available for P7 series evidence. */
  readonly registryMappingCount: number;
}

export interface StartupOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  serverFactory?: (path: string) => import('node:net').Server;
  /**
   * Explicit governed identity dependencies for broker-import qualification.
   * Omitted in normal operation, where the composition root loads the governed
   * P04 master and retained P7 registry itself. Tests use this seam to supply
   * fixtures; it can never weaken qualification, because the consumer's Stage 4
   * path fails closed on any unresolved evidence.
   */
  brokerImportIdentity?: ComposeBrokerImportIdentityDependenciesOptions;
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
    db = openDatabase(env[DATABASE_PATH_SETTING] as string);
  } catch (error) {
    return fail('connect', error);
  }

  // 3. verify and apply the fixed migration set
  try {
    ensureMigrations(db, GATE3_MIGRATIONS);
  } catch (error) {
    return fail('migrate', error);
  }

  // 4. verify the local audit chain
  try {
    if (!verifyAuditChain(db)) {
      return fail('verify', new MigrationIntegrityError('the audit-event hash chain does not verify'));
    }
  } catch (error) {
    return fail('verify', error);
  }

  // 4b. Stage 4 composition of the governed identity dependencies, then the
  // O5-A single authorized call site (PA act `...-PA-DECISION-2026-10-30-01`
  // clause 1(b)): construct the durable broker-import consumer over the handle
  // this process already opened, now supplied with the SAME governed P04
  // security master and retained P7 registry the rest of the application uses,
  // so broker-import holdings are qualified through the existing joint
  // P04 → P7 path instead of the pre-Stage-4 fallback.
  //
  // Construction opens no file other than the retained P7 qualification
  // manifest, begins no transaction and writes nothing. The consumer still
  // refuses every import at the write-gate boundary: composing qualification
  // does not authorize a write, and no route, endpoint or operation is added.
  let brokerImportConsumer: BrokerImportConsumer;
  let brokerImportIdentity: BrokerImportIdentityProvenance;
  try {
    const identityDependencies: BrokerImportIdentityDependencies =
      composeBrokerImportIdentityDependencies(options.brokerImportIdentity ?? {});
    // The authorization half is supplied from SERVER-OWNED state only: the
    // process environment (`IIPS_LOCAL_PERSONAL_USE`) and the ACTIVE local
    // principal binding, which the durable port resolves per call and must
    // match the owner the import targets. Absent the switch or a matching
    // binding, the port still supplies no context and the guard still returns
    // its unchanged hard-false Gate 4 / Gate 5 refusal.
    brokerImportConsumer = createBrokerImportConsumer(db, {
      ...brokerImportConsumerOptions(identityDependencies),
      authorization: { env, revisionCap: revisionCapFor(env) },
    });
    brokerImportIdentity = Object.freeze({
      securityMasterRevision: identityDependencies.securityMaster.sourceRevision?.batchId ?? null,
      registryMappingCount: identityDependencies.registry.list().length,
    });
  } catch (error) {
    // Fail closed at a bounded, explicitly named phase. There is no fallback to
    // an unqualified consumer: a governed identity source that cannot be
    // composed refuses startup rather than silently reverting to pre-Stage-4
    // identity construction.
    return fail('compose', error);
  }

  // 5. bind the same-host endpoint
  try {
    // Windows named pipes cannot deliver a usable half-close EOF before the
    // pipe breaks, so the pipe transport settles via the flush guard; AF_UNIX
    // keeps the airtight half-close gate.
    const settlement = settlementPolicyForEndpoint(target);
    const handle: IpcHandle = await listenIpc(target, createConnectionHandler(db, { settlement, env }), {
      platform,
      ...(options.serverFactory ? { serverFactory: options.serverFactory } : {}),
    });
    return { ok: true, target: handle.target, handle, brokerImportConsumer, brokerImportIdentity };
  } catch (error) {
    if (
      error instanceof EndpointCollisionError ||
      error instanceof UnsafeEndpointDirectoryError ||
      error instanceof EndpointConfigurationError
    ) {
      return { ...fail('bind', error), target };
    }
    return { ...fail('bind', error), target };
  }
}

const isMain = (): boolean => {
  if (!process.argv[1]) return false;
  return process.argv[1].endsWith('entrypoint.js') || process.argv[1].endsWith('entrypoint.ts');
};

if (isMain()) {
  startIpcServer({ env: { ...process.env, [LOCAL_PERSONAL_USE_SETTING]: '1' } })
    .then((outcome) => {
      if (!outcome.ok) {
        console.error(`[g3] startup refused at phase ${outcome.phase}: ${outcome.error}`);
        process.exit(1);
      }
      console.error(`[g3] listening on ${outcome.target?.kind} ${outcome.target?.path}`);
    })
    .catch((error: unknown) => {
      console.error(`[g3] startup refused: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
