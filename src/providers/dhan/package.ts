/**
 * Institutional Investment Platform System (IIPS)
 * Public server-side Dhan market-data boundary (DHAN-D3-A packaging).
 *
 * Server-side only: this subpath (`iips-production-market-data/dhan-server`)
 * performs credential resolution and vendor HTTP transport. It must NEVER be
 * imported from frontend packages, browser bundles, or the `./portfolio-ui`
 * subpath. IRR and other consumers should depend on the provider-neutral
 * contract re-exported here (MarketDataSource SPI, MarketDataDTO,
 * ProviderMarketDataRoute) and construct the provider through this entry only.
 *
 * Deliberately NOT exported (provider-internal): dhan_dto, dhan_normalizer and
 * the raw historical DTO parser — vendor DTO shapes are implementation details
 * behind the canonical contracts. Mapping row loading/validation is exported server-side only, so
 * consumers wire the provider but never handle raw vendor identifiers.
 */

// Provider construction surface (server-side).
export { DhanMarketDataSource } from './dhan_market_data_source.js';
export type { DhanMarketDataSourceOptions } from './dhan_market_data_source.js';
export {
  DhanApiClient,
  PreAccessNoNetworkTransport,
  DhanTransportTimeoutError,
  DhanTransportUnavailableError,
  DHAN_MARKET_QUOTE_PATH,
} from './dhan_api_client.js';
export type {
  DhanApiClientOptions,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
} from './dhan_api_client.js';
export {
  DHAN_PROVIDER_ID,
  DHAN_DEFAULT_BASE_URL,
  DHAN_DEFAULT_TIMEOUT_MS,
  resolveDhanProviderConfig,
  describeDhanConfig,
} from './dhan_config.js';
export type {
  DhanProviderConfig,
  DhanConfigResolution,
  DhanCredentialReadiness,
  DhanEnvSource,
} from './dhan_config.js';
export { DhanProviderError } from './dhan_failures.js';
export type { DhanFailure, DhanFailureCode, DhanResult } from './dhan_failures.js';
export {
  DhanInstrumentRegistry,
  DhanInstrumentMappingError,
  DhanInstrumentMappingConflictError,
} from './dhan_instrument_map.js';
export type {
  DhanInstrumentMapping,
  DhanInstrumentResolution,
  DhanMappingProvenance,
  DhanInstrumentType,
  DhanMappingValidationStatus,
} from './dhan_instrument_map.js';
export {
  validateDhanInstrumentMappingRow,
  loadDhanInstrumentMappings,
  DhanInstrumentResolutionService,
} from './dhan_instrument_mapping_integration.js';
export type {
  DhanMappingLoadReport,
  DhanMappingRejection,
  DhanMappingCoverageReport,
  CanonicalInstrumentIdentity,
} from './dhan_instrument_mapping_integration.js';
// Historical adapter (server-side only); vendor historical DTO stays internal.
export { DhanHistoricalAdapter, normalizeDhanHistoricalToCandles } from './dhan_historical_adapter.js';
export type { DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
export type {
  DhanHistoricalRequest,
  DhanHistoricalInterval,
  DhanNormalizedDateRange,
} from './dhan_historical_dto.js';
export { DHAN_SUPPORTED_HISTORICAL_INTERVALS, DHAN_HISTORICAL_PATH } from './dhan_historical_dto.js';
// Provider-side operational controls (DHAN-P4), server-only.
export {
  DhanBoundedCache,
  DhanHistoricalCache,
  DhanRateLimiter,
  DhanConcurrencyLimiter,
  DhanRequestCoalescer,
  DhanRefreshOrchestrator,
  withBoundedRetry,
  isTransientFailure,
  dhanQuoteCacheKey,
  dhanHistoricalCacheKey,
} from './dhan_operational_controls.js';
export type { DhanSecurityScope, CacheLookup, RefreshOutcome, RetryOptions } from './dhan_operational_controls.js';

// Provider-neutral consumption contract (what downstream apps actually use).
export {
  ProviderMarketDataRoute,
  deriveMarketDataState,
  buildProviderRouteDataStateView,
} from '../market_data_route.js';
export type {
  MarketDataPresentationState,
  ProviderRouteQuoteResult,
  ProviderRouteDataStateView,
} from '../market_data_route.js';
export type { MarketDataSource, SnapshotQuery } from '../../spi/provider_spi.js';
export type { MarketDataDTO } from '../../transports/market_data_dto.js';
