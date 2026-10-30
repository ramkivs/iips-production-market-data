/**
 * O5-A — the single authorized shipped-code consumer of the durable
 * broker-import leg.
 *
 * Authority: PA decision act `IIPS-V3-O05-PRODUCTION-CONSUMER-PA-DECISION-2026-10-30-01`
 * (option `O5-A`), clause 1(a). Scope is fixed by that act: this module and its
 * one call site make the durable leg reachable from shipped code and
 * demonstrate, in the product path, that every write is refused.
 *
 * What this module is:
 *   - a factory over the caller's ALREADY-OPEN `node:sqlite` handle. It opens no
 *     connection, no file, no directory and no transaction;
 *   - a consumer that constructs `DurablePortfolioStorePort` — the designated
 *     write-gate boundary — and delegates every import to `persistBrokerImport`.
 *
 * What it is not, and must not become:
 *   - not a write authorization. `evaluatePortSaveGuard()` is hard-false for
 *     W-1(3)/W-1(4), so the port refuses before a transaction begins and
 *     `persistBrokerImport` returns `WRITE_NOT_AUTHORIZED` with
 *     `storeEffect: 'NONE'`;
 *   - not an IPC operation, route, endpoint or caller surface: `dispatch.ts` and
 *     `protocol.ts` are untouched and the closed operation set is unchanged;
 *   - not a second identity source: the owner is supplied by the in-repository
 *     caller and is never derived from request content;
 *   - never a direct construction of `DurablePortfolioStore`. That class is the
 *     lower-level component used by qualification fixtures; constructing it here
 *     would step around the W-1 boundary the port enforces.
 */
import type { DatabaseSync } from 'node:sqlite';
import { DurablePortfolioStorePort } from '../persistence/durablePortfolioStorePort.js';
import {
  persistBrokerImport,
  type BrokerImportOutcome,
  type BrokerImportRequest,
} from '../persistence/brokerImportPersistence.js';
import type { OwnerRef } from '../persistence/portfolio_store.js';

/**
 * The whole consumer surface: one callable. Deliberately not an object with
 * several members — every extra member would be another way for an unauthorized
 * write path to grow out of authorized code.
 */
export type BrokerImportConsumer = (owner: OwnerRef, request: BrokerImportRequest) => BrokerImportOutcome;

/**
 * The one factory (act clause 1(a)). Binds the port to the caller's existing
 * handle and returns the consumer. Pure construction: no I/O, no migration, no
 * guard evaluation, no transaction.
 */
export function createBrokerImportConsumer(db: DatabaseSync): BrokerImportConsumer {
  const port = new DurablePortfolioStorePort(db);
  return (owner, request) => submitBrokerImport(port, owner, request);
}

/**
 * The one delegating function (act clause 1(a)). The port's own mutating methods
 * evaluate the frozen Gate E W-1 conjunction first, so an otherwise saveable
 * import still returns `WRITE_NOT_AUTHORIZED` with `storeEffect: 'NONE'` and no
 * row is touched.
 */
export function submitBrokerImport(
  port: DurablePortfolioStorePort,
  owner: OwnerRef,
  request: BrokerImportRequest,
): BrokerImportOutcome {
  return persistBrokerImport(port, owner, request);
}
