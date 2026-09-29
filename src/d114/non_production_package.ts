/**
 * Public NON-PRODUCTION D114 -> PIT population package boundary (IU-6).
 *
 * Deliberately a SEPARATE subpath from `./pit`. The `./pit` subpath is the PIT
 * read authority and must not grow an ingestion surface; this subpath is the
 * explicitly non-production population path and is labelled as such in its own
 * name, so no consumer can import it by accident believing it to be production
 * ingestion.
 *
 * It exports no store of its own and no second PIT service. Everything it
 * returns is the authoritative `PointInTimeStore` from `../pit/pit_store.js`.
 */
export {
  createNonProductionD114PitStore,
  populateNonProductionD114Pit,
  ingestNonProductionD114Archives,
  NON_PRODUCTION_D114_ARCHIVES,
  NON_PRODUCTION_D114_DISPOSITION,
  NON_PRODUCTION_D114_ISIN,
  NON_PRODUCTION_D114_SYMBOL,
  NON_PRODUCTION_D114_EQ,
  NON_PRODUCTION_D114_BL,
  NON_PRODUCTION_D114_DATE_1,
  NON_PRODUCTION_D114_DATE_2,
  NON_PRODUCTION_D114_DATE_3,
  NON_PRODUCTION_D114_VINTAGE_1,
  NON_PRODUCTION_D114_VINTAGE_2,
  NON_PRODUCTION_D114_VINTAGE_3,
} from './non_production_pit_population.js';

export type {
  NonProductionD114Archive,
  NonProductionD114Population,
} from './non_production_pit_population.js';

export type { ArchiveIngestionResult } from './pit_ingestion_loader.js';
export { HistoricalPitIngestionLoader } from './pit_ingestion_loader.js';
