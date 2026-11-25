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
  CUSTOM_INJECTED_VAULT_BACKEND_ID,
  UNKNOWN_VAULT_BACKEND_ID,
  sanitizeVaultBackendId,
} from './dhan_api_client.js';
export type {
  DhanApiClientOptions,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  DhanVendorEgressMode,
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
  DhanProviderStateRecorder,
  DHAN_AUTH_LATCH_THRESHOLD,
  GOVERNED_PROVIDER_FAILURE_CATEGORIES,
  isGovernedProviderFailureCategory,
} from './dhan_provider_state_recorder.js';
export type {
  DhanObservedFailureCategory,
  DhanRecordedFailure,
  DhanAuthOutcome,
  DhanProviderObservedState,
  DhanVerificationMode,
  DhanVerificationOutcomeCode,
  VerifyProviderConnectionOptions,
  ProviderVerificationResult,
  DhanProviderStateRecorderOptions,
  RecordProviderSuccessInput,
  RecordProviderFailureInput,
} from './dhan_provider_state_recorder.js';
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
// W-19 / D-4.3 four-timestamp provenance and D02 freshness projection.
export {
  dhanFreshnessTimestamps,
  dhanHistoricalContentDigest,
  NO_DHAN_FRESHNESS_TIMESTAMPS,
} from './dhan_historical_provenance.js';
export type {
  DhanFreshnessTimestamps,
  DhanHistoricalProvenance,
  DhanHistoricalRevision,
  DhanHistoricalRevisionState,
  DhanMarketTimestampDerivation,
  DhanObservationScope,
  DhanTimestampEvidence,
  DhanTimestampState,
} from './dhan_historical_provenance.js';
export { projectHistoricalFreshness } from './dhan_historical_freshness.js';
export type { HistoricalFreshnessEvidence } from './dhan_historical_freshness.js';
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
export type {
  DhanSecurityScope,
  CacheLookup,
  RefreshOutcome,
  RetryOptions,
  DhanAggregateCacheState,
  DhanQuoteCacheDiagnostics,
} from './dhan_operational_controls.js';
// Composed IPD-owned service + authenticated server-to-server transport (DHAN-P5).
export {
  DhanMarketDataService,
  DHAN_HEALTH_CONTRACT_VERSION,
  DHAN_HEALTH_CONTRACT_LEGACY_VERSION,
  DHAN_DIAGNOSTICS_CONTRACT_VERSION,
  DHAN_VERIFICATION_CONTRACT_VERSION,
  validateDhanServiceHealth,
  validateDhanServiceDiagnostics,
  validateDhanDiagnosticsFreshness,
  validateDhanConnectionVerification,
} from './dhan_market_data_service.js';
export type {
  QuoteRequest,
  QuoteResponse,
  HistoricalServiceRequest,
  HistoricalResponse,
  ServiceHealth,
  ServiceDiagnostics,
  ServiceConnectionVerification,
  DhanProviderState,
  DhanCredentialResolutionOutcome,
  DhanDiagnosticsRequestCounters,
  DhanDiagnosticsContractVersion,
  DhanVerificationContractVersion,
  DhanLiveProviderConnectivity,
  DhanProviderQualification,
  DhanHealthContractVersion,
  DhanDiagnosticsFreshnessConfig,
  DhanDiagnosticsFreshnessThresholdOverride,
} from './dhan_market_data_service.js';
export {
  createMarketDataHttpServer,
  isLoopbackTransportHost,
  MarketDataTransportClient,
  MARKET_DATA_ROUTES,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
} from './dhan_market_data_http.js';
export type {
  FreshnessRequest,
  MarketDataHttpOptions,
  MarketDataTransportClientOptions,
  MarketDataTransportFailure,
  MarketDataTransportFailureCode,
  MarketDataTransportFreshnessOutcome,
  MarketDataTransportQuoteOutcome,
  MarketDataTransportHistoricalOutcome,
  MarketDataTransportHealthOutcome,
  MarketDataTransportDiagnosticsOutcome,
  MarketDataTransportVerifyOutcome,
} from './dhan_market_data_http.js';

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
export * from './dhan_instrument_master_source.js';
export * from './dhan_instrument_master_parser.js';
export * from './dhan_instrument_master_qualification.js';

export { DhanIdentityApiService } from './dhan_identity_api.js';
export type { IdentityApiResult, ExactIdentityRequest, InstrumentSearchResult } from './dhan_identity_api.js';
export type { HoldingIdentityInput, SecurityIdentityQualificationResult, SecurityIdentityQualified, SecurityIdentityUnresolved } from './dhan_security_identity_service.js';

export { validateDhanFreshnessStatus } from './dhan_freshness_status.js';
export type { FreshnessDomain, FreshnessStatus, RefreshStatus } from './dhan_freshness_status.js';

// Offline session-calendar input; no calendar service or implicit market coverage.
export { parseTradingCalendar } from '../../quality/trading_calendar.js';
export type { TradingCalendar, TradingCalendarDay, SessionFreshnessContext } from '../../quality/trading_calendar.js';
