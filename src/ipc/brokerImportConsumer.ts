/**
 * The broker-import consumer surface: one callable plus its construction.
 *
 * It deliberately exposes only what the O5-A act authorizes. The consumer is
 * reachable from exactly one composed call site in `entrypoint.ts` and is not
 * an IPC operation.
 *
 * AUTHORIZATION (2026-11-09)
 *   The write gate is unchanged and still decides. What changed is that the
 *   durable port is now constructed with the SERVER-OWNED environment, so the
 *   explicit local single-user carve-out (`IIPS_LOCAL_PERSONAL_USE=1` plus a
 *   validated ACTIVE local principal binding that equals the owner the import
 *   targets) reaches `evaluatePortSaveGuard` through the port instead of being
 *   structurally unreachable.
 *
 *   A consumer constructed without options — the historical shape, and every
 *   pre-existing caller — still refuses every import with
 *   `WRITE_NOT_AUTHORIZED` and zero store effect. Qualification never implies
 *   authorization; this module never qualifies, maps or authorizes anything
 *   itself.
 */
import type { DatabaseSync } from 'node:sqlite';
import { DurablePortfolioStorePort, type DurablePortfolioStorePortOptions } from '../persistence/durablePortfolioStorePort.js';
import {
  persistBrokerImport,
  type BrokerImportOutcome,
  type BrokerImportRequest,
  type MapBrokerImportHoldingsOptions,
} from '../persistence/brokerImportPersistence.js';
import type { OwnerRef } from '../persistence/portfolio_store.js';
import type { SecurityMaster } from '../identity/security_master.js';
import type { DhanInstrumentRegistry } from '../providers/dhan/dhan_instrument_map.js';

/**
 * The whole consumer surface: one callable. Deliberately not an object with
 * several members — every extra member would be another way for an unauthorized
 * write path to grow out of authorized code.
 */
export type BrokerImportConsumer = (owner: OwnerRef, request: BrokerImportRequest) => BrokerImportOutcome;

/**
 * Construction options. `identity` is the Stage 4 governed P04 + P7 pair;
 * `authorization` carries the server-owned environment and the named write
 * scope for the durable port's write gate.
 */
export interface CreateBrokerImportConsumerOptions extends MapBrokerImportHoldingsOptions {
  readonly authorization?: Pick<DurablePortfolioStorePortOptions, 'env' | 'revisionCap'>;
}

/**
 * The one factory (act clause 1(a)). Binds the port to the caller's existing
 * handle and returns the consumer. Pure construction: no I/O, no migration, no
 * guard evaluation, no transaction.
 *
 * When `securityMaster` and `registry` are supplied, the consumer qualifies
 * each holding's security identity through the governed P04 → P7 joint path
 * before persistence. When absent, the pre-Stage-4 fallback behavior applies
 * (D114 identity built directly from broker-supplied ISIN + series).
 *
 * When `authorization` is supplied, the durable port resolves the write
 * authorization per call from that environment plus the ACTIVE binding. When
 * absent, the port is constructed exactly as before: no authorization context,
 * guard default-deny, `WRITE_NOT_AUTHORIZED`.
 */
export function createBrokerImportConsumer(
  db: DatabaseSync,
  options: CreateBrokerImportConsumerOptions = {},
): BrokerImportConsumer {
  const { authorization, ...identity } = options;
  const port = authorization
    ? new DurablePortfolioStorePort(db, {
        scope: 'BROKER_OBSERVED_IMPORT',
        ...(authorization.env !== undefined ? { env: authorization.env } : {}),
        ...(authorization.revisionCap !== undefined ? { revisionCap: authorization.revisionCap } : {}),
      })
    : new DurablePortfolioStorePort(db);
  return (owner, request) => submitBrokerImport(port, owner, request, identity);
}

/**
 * The one delegating function (act clause 1(a)). The port's own mutating methods
 * evaluate the frozen Gate E W-1 conjunction first, so an unauthorized import
 * returns `WRITE_NOT_AUTHORIZED` with `storeEffect: 'NONE'` and no row is
 * touched.
 */
export function submitBrokerImport(
  port: DurablePortfolioStorePort,
  owner: OwnerRef,
  request: BrokerImportRequest,
  options: MapBrokerImportHoldingsOptions = {},
): BrokerImportOutcome {
  return persistBrokerImport(port, owner, request, undefined, options);
}
