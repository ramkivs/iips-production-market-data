/**
 * Stage 4 — normal-application composition of the broker-import identity
 * dependencies (P04 security master + P7 instrument registry).
 *
 * WHAT THIS MODULE IS
 *   The single place where the shipped application resolves the SAME governed
 *   dependencies the Stage 4 qualification service already requires, so that
 *   `createBrokerImportConsumer` is composed with `{ securityMaster, registry }`
 *   in the normal process path instead of the pre-Stage-4 fallback.
 *
 *   It composes existing, already-tested pieces and adds no qualification logic:
 *     - `getGovernedBroadSecurityMaster()` — the governed D05 authenticated
 *       universe master (P04), the identical accessor the market-data daemon
 *       uses (`src/providers/dhan/dhan_local_daemon.ts`);
 *     - `loadGovernedP7InstrumentRegistry()` — the retained governed P7
 *       qualification manifest reader (P7), again the identical loader the
 *       daemon uses.
 *   Neither loader invents, infers or fabricates an identity mapping. When the
 *   retained P7 manifest is absent the registry is simply empty, so every
 *   qualification fails closed with `MISSING_P7_MAPPING`.
 *
 * WHAT IT DOES NOT DO
 *   - It does not qualify, map or resolve anything itself; that remains
 *     `qualifyHoldingSecurityIdentity` (P04 → P7 joint path) reached through
 *     `mapBrokerImportHoldings`.
 *   - It does not construct a provider client, open a socket, read a credential
 *     or start a network call. The manifest read is a local file read of a
 *     retained evidence artifact.
 *   - It does not authorize a write. Gate E W-1(3)/W-1(4) are unchanged, so the
 *     consumer still refuses every import with `WRITE_NOT_AUTHORIZED`.
 *   - It does not add an IPC operation, route or caller surface.
 */
import type { SecurityMaster } from '../identity/security_master.js';
import { getGovernedBroadSecurityMaster } from '../identity/governed_fixture_master.js';
import type { DhanInstrumentRegistry } from '../providers/dhan/dhan_instrument_map.js';
import {
  loadGovernedP7InstrumentRegistry,
} from '../providers/dhan/dhan_local_daemon.js';
import type { MapBrokerImportHoldingsOptions } from '../persistence/brokerImportPersistence.js';

/** The two governed identity dependencies Stage 4 qualification requires. */
export interface BrokerImportIdentityDependencies {
  readonly securityMaster: SecurityMaster;
  readonly registry: DhanInstrumentRegistry;
}

/** Optional seams for callers that already hold, or deliberately narrow, the dependencies. */
export interface ComposeBrokerImportIdentityDependenciesOptions {
  readonly securityMaster?: SecurityMaster;
  readonly registry?: DhanInstrumentRegistry;
}

/**
 * Resolves the governed P04 + P7 identity dependencies for broker-import
 * qualification. Explicit dependencies win; otherwise the governed defaults
 * are loaded. Throws if a governed default cannot be constructed — the caller
 * decides how a governed-source failure is surfaced, and never substitutes an
 * empty or permissive master to paper over it.
 */
export function composeBrokerImportIdentityDependencies(
  options: ComposeBrokerImportIdentityDependenciesOptions = {},
): BrokerImportIdentityDependencies {
  return Object.freeze({
    securityMaster: options.securityMaster ?? getGovernedBroadSecurityMaster(),
    registry: options.registry ?? loadGovernedP7InstrumentRegistry(),
  });
}

/**
 * The composition-root options object handed to `createBrokerImportConsumer`.
 * The consumer's own `MapBrokerImportHoldingsOptions` contract is reused
 * verbatim — Stage 4 qualification semantics are neither duplicated nor
 * widened here.
 */
export function brokerImportConsumerOptions(
  dependencies?: BrokerImportIdentityDependencies,
): MapBrokerImportHoldingsOptions {
  const resolved = dependencies ?? composeBrokerImportIdentityDependencies();
  return { securityMaster: resolved.securityMaster, registry: resolved.registry };
}
