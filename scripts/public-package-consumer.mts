/**
 * Isolated public-package consumer fixture. This file is typechecked and executed
 * only after installation from npm pack; it never imports IPD source paths.
 */
import {
  PointInTimeStore,
  PitReadService,
  type CanonicalEnvelope,
  type DataDomain,
  type DataProvenanceDTO,
  type PITQuery,
  type PitReadRequest,
  type PitReadResult,
} from 'iips-production-market-data/pit';
import {
  createNonProductionD114PitStore,
  populateNonProductionD114Pit,
  ingestNonProductionD114Archives,
  NON_PRODUCTION_D114_EQ,
  NON_PRODUCTION_D114_BL,
  NON_PRODUCTION_D114_VINTAGE_1,
  NON_PRODUCTION_D114_VINTAGE_2,
  NON_PRODUCTION_D114_VINTAGE_3,
  type NonProductionD114Population,
  type ArchiveIngestionResult,
} from 'iips-production-market-data/d114-non-production';
import {
  SessionPortfolioStorePort,
  type PortfolioCommitDisposition,
  type PortfolioCommitReceipt,
  type PortfolioPortRefusalCode,
  type PortfolioPortSaveOutcome,
  type PortfolioPortSaveOutcomeUnknown,
  type PortfolioStorePort,
} from 'iips-production-market-data/portfolio-ui';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const domain: DataDomain = 'D01_QUOTES';
const provenance: DataProvenanceDTO = {
  sourceClassification: 'DERIVED',
  vendorTier: 'MOCK_FIXTURE',
  asOf: NON_PRODUCTION_D114_VINTAGE_1,
  receivedAt: NON_PRODUCTION_D114_VINTAGE_1,
  evaluatedAt: NON_PRODUCTION_D114_VINTAGE_1,
  dataVersion: 'public-consumer',
  lineageHash: 'public-consumer-lineage',
  qualityState: 'GOOD',
};
const envelope: CanonicalEnvelope<unknown> = {
  envelopeId: 'public-consumer-envelope',
  domain,
  mode: 'PIT',
  companyId: 'NON_PRODUCTION_COMPANY_KEY',
  securityId: NON_PRODUCTION_D114_EQ,
  payload: { ltp: 1 },
  provenance,
  timestamp: NON_PRODUCTION_D114_VINTAGE_1,
  schemaVersion: '1.0.0',
};

const directStore = new PointInTimeStore<unknown>();
directStore.append(envelope);
const directQuery: PITQuery = {
  companyId: 'NON_PRODUCTION_COMPANY_KEY',
  domain,
  securityId: NON_PRODUCTION_D114_EQ,
  asOf: NON_PRODUCTION_D114_VINTAGE_1,
};
check(directStore.queryAsOf(directQuery)?.payload !== undefined, 'public PIT store query failed');

const population: NonProductionD114Population = createNonProductionD114PitStore();
check(population.store.getRecordCount() === 12, 'D114 population must contain 12 records');
check(population.results.length === 3, 'D114 population must process three archives');
check(population.store.listAdmittedSeriesKeys().some((key) => key.endsWith(NON_PRODUCTION_D114_BL)), 'BL key missing');

const service = new PitReadService(population.store);
const request: PitReadRequest = {
  securityId: NON_PRODUCTION_D114_EQ,
  domain,
  asOf: NON_PRODUCTION_D114_VINTAGE_3,
};
const result: PitReadResult<unknown> = service.queryAsOf(request);
check(result.found, `public PIT read failed: ${JSON.stringify(result)}`);
check(result.resolvedAsOf === NON_PRODUCTION_D114_VINTAGE_3, 'wrong resolved vintage');
check((result.payload as { ltp: number }).ltp === 4125.6, 'wrong D114 payload');
check(result.provenance.dataVersion === 'v1.0.0-d114-historical', 'provenance was not preserved');

const replay: ReadonlyArray<ArchiveIngestionResult> = ingestNonProductionD114Archives(population.loader);
check(replay.every((item) => item.success && item.d01Count === 0 && item.d02Count === 0), 'D114 replay was not idempotent');
check(population.store.getRecordCount() === 12, 'D114 replay changed the store');

const secondStore = new PointInTimeStore<unknown>();
const secondPopulation = populateNonProductionD114Pit(secondStore);
check(secondPopulation.store === secondStore, 'population did not use the supplied store');
check(secondStore.getRecordCount() === 12, 'second population count mismatch');
check(NON_PRODUCTION_D114_VINTAGE_1 < NON_PRODUCTION_D114_VINTAGE_2, 'vintage constants are not ordered');

const disposition: PortfolioCommitDisposition = 'SAVED_NEW_BATCH';
const receipt: PortfolioCommitReceipt = {
  disposition,
  revision: 1,
  durability: 'SESSION_ONLY',
  durable: false,
};
const receiptOnlyPort: PortfolioStorePort = {
  durability: 'SESSION_ONLY',
  durable: false,
  async getPortfolio() { return undefined; },
  // getAnalytics is deliberately absent.
  async getRevision() { return receipt.revision; },
  async saveHoldings(): Promise<PortfolioPortSaveOutcome> {
    return {
      ok: true,
      receipt,
      durability: receipt.durability,
      durable: receipt.durable,
      revision: receipt.revision,
    };
  },
};
check(receiptOnlyPort.getAnalytics === undefined, 'getAnalytics must remain optional');

const refusalCodes: PortfolioPortRefusalCode[] = ['WRITE_NOT_AUTHORIZED', 'RESOURCE_UNAVAILABLE'];
const refusals: PortfolioPortSaveOutcome[] = refusalCodes.map((code) => ({
  ok: false,
  code,
  message: code,
  refusedHoldings: [],
}));
check(refusals.every((outcome) => outcome.ok === false && !('receipt' in outcome)), 'refusal acquired a receipt');
const unknown: PortfolioPortSaveOutcomeUnknown = {
  ok: 'unknown',
  code: 'OUTCOME_UNKNOWN',
  message: 'outcome unavailable',
  portfolioId: 'DEFAULT_PORTFOLIO',
  reconciliationRequired: true,
};
check(unknown.ok === 'unknown' && unknown.receipt === undefined, 'unknown outcome is not distinct');

const shippedPort = new SessionPortfolioStorePort();
check(shippedPort.durability === 'SESSION_ONLY' && shippedPort.durable === false, 'session-only safeguard changed');
const portfolioUi = await import('iips-production-market-data/portfolio-ui');
check(Object.keys(portfolioUi).length === 22, 'portfolio-ui runtime export count changed');
check(typeof portfolioUi.BrokerImportModal === 'function', 'BrokerImportModal missing');
check(!('PortfolioWorkspace' in portfolioUi), 'PortfolioWorkspace must remain private');

console.log(JSON.stringify({
  runtime: 'PASS',
  declarations: 'PASS',
  pitRecords: directStore.getRecordCount(),
  d114Records: population.store.getRecordCount(),
  replayDuplicates: replay.reduce((sum, item) => sum + item.duplicateCount, 0),
  uiRuntimeExports: Object.keys(portfolioUi).length,
  durability: shippedPort.durability,
  durable: shippedPort.durable,
  refusalCodes,
}));
