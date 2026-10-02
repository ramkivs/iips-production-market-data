/**
 * Public NP-04 governed-persistence package boundary.
 *
 * Exposes the already-authorized NP-04 common governed persistence capability so a consumer
 * outside this repository (currently: the NP-06 Reports persistence binding in IRR) can construct
 * the AUTHORITATIVE store and drive the five governed operations:
 *
 *   createInstance · appendVersion · resolveById · queryByOwner · listSupersededBy
 *
 * Deliberately a thin boundary, in the same shape as `./pit` and `./d114-non-production`:
 *   - it defines NO store, NO schema, NO migration and NO persistence semantics of its own;
 *   - every symbol below is re-exported from the authoritative implementation untouched;
 *   - it is NOT a second persistence surface — it is the same one, reachable by subpath.
 *
 * A consumer is expected to `openDatabase()` and inject the resulting store; ownership,
 * instance identity, version numbering, supersession and durability all remain owned here.
 */
export { openDatabase } from './db.js';
export type { GovernedDatabase, OpenOptions } from './db.js';
export { GovernedArtifactStore } from './store.js';
export type {
  GovernedArtifact,
  ArtifactContent,
  QueryOptions,
  QueryPage,
  StoreHooks,
} from './store.js';
export {
  PersistenceError,
  PersistenceValidationError,
  PersistenceNotFoundError,
  PersistenceOwnershipError,
  PersistenceImmutableError,
  PersistenceSupersessionError,
  PersistenceTransactionError,
  PersistenceSchemaError,
} from './errors.js';
export type { PersistenceErrorCode } from './errors.js';
export type { AuthenticatedOwner, ReportId } from './identity.js';
