/**
 * NP-04 — Common Governed Persistence: public surface.
 *
 * Consumers (currently: the NP-06 Reports P2 contract) import from this barrel only.
 *
 * Authority : IIPS_v3.0_NP04_COMMON_GOVERNED_PERSISTENCE_IMPLEMENTATION_AUTHORITY.md
 * Contract  : IIPS_v3.0_NP06_REPORTS_GOVERNANCE_DECISIONS.md (section 5.1)
 */
export { openDatabase, type GovernedDatabase, type OpenOptions } from './db.js';
export { MIGRATIONS, runMigrations, inspectLedger, type Migration } from './schema.js';
export {
  GovernedArtifactStore,
  type GovernedArtifact,
  type ArtifactContent,
  type QueryOptions,
  type QueryPage,
  type StoreHooks,
} from './store.js';
export {
  canonicalizeReportKey,
  deriveReportKey,
  compareByCodePoint,
  CANONICAL_SCHEMA_VERSION,
  type CanonicalReportKeyInput,
  type CanonicalParameterValue,
} from './reportKey.js';
export {
  mintReportId,
  assertOwner,
  sameOwner,
  type AuthenticatedOwner,
  type ReportId,
} from './identity.js';
export {
  PersistenceError,
  PersistenceValidationError,
  PersistenceNotFoundError,
  PersistenceOwnershipError,
  PersistenceImmutableError,
  PersistenceSupersessionError,
  PersistenceTransactionError,
  PersistenceSchemaError,
  type PersistenceErrorCode,
} from './errors.js';
