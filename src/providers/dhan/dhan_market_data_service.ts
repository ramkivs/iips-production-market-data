import { parseTradingCalendar, type TradingCalendar } from '../../quality/trading_calendar.js';
/**
 * Institutional Investment Platform System (IIPS)
 * IPD-Owned Composed Dhan Market-Data Service (DHAN-P5)
 *
 * Gate: DHAN-P5 COMPOSED SERVICE — composes the EXISTING Dhan provider
 * primitives (client, quote source, historical adapter, governed mapping,
 * Prompt 4 operational controls) into one IPD-owned service. It introduces no
 * duplicate DTOs, normalizers, caches, limiters or registries, and exposes
 * ONLY canonical provider-neutral contracts outward (D01/D02 envelopes).
 *
 * PRE-ACCESS: no live Dhan call is possible; all behaviour is synthetic-safe.
 */

import { freshnessStatus, type FreshnessStatus, type RefreshStatus } from './dhan_freshness_status.js';
import { CanonicalEnvelope } from '../../contracts/envelope.js';
import { isD114SecurityIdentity, type D114SecurityIdentity, type DataDomain } from '../../contracts/types.js';
import { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import { SecurityMaster } from '../../identity/security_master.js';
import {
  DhanApiClient,
  type DhanVendorEgressMode,
  sanitizeVaultBackendId,
} from './dhan_api_client.js';
import {
  type DhanCredentialReadiness,
  isDhanProductionEnvironment,
} from './dhan_config.js';
import { DhanHistoricalAdapter, DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
import { DhanHistoricalRequest } from './dhan_historical_dto.js';
import { DhanExchangeSegment } from './dhan_dto.js';
import { DhanFailure, dhanFailure } from './dhan_failures.js';
import { DhanInstrumentResolutionService } from './dhan_instrument_mapping_integration.js';
import { DhanInstrumentRegistry } from './dhan_instrument_map.js';
import { DhanMarketDataSource } from './dhan_market_data_source.js';
import { DHAN_PROVIDER_STATES, type DhanProviderState } from './dhan_provider_state.js';
import {
  isGovernedProviderFailureCategory,
  type DhanAuthOutcome,
  type DhanObservedFailureCategory,
  type DhanProviderObservedState,
  type DhanRecordedFailure,
  type DhanVerificationMode,
  type DhanVerificationOutcomeCode,
  type ProviderVerificationResult,
  type VerifyProviderConnectionOptions,
} from './dhan_provider_state_recorder.js';
import { parseStrictUtcTimestamp } from './dhan_utc_timestamp.js';
import {
  DhanBoundedCache,
  DhanConcurrencyLimiter,
  DhanHistoricalCache,
  DhanRateLimiter,
  DhanRefreshOrchestrator,
  DhanRequestCoalescer,
  DhanSecurityScope,
  dhanHistoricalCacheKey,
  dhanQuoteCacheKey,
  type DhanAggregateCacheState,
  type DhanHistoricalCacheEntry,
  type DhanQuoteCacheDiagnostics,
} from './dhan_operational_controls.js';
import {
  projectHistoricalFreshness,
  type HistoricalFreshnessEvidence,
} from './dhan_historical_freshness.js';
import {
  dhanFreshnessTimestamps,
  NO_DHAN_FRESHNESS_TIMESTAMPS,
} from './dhan_historical_provenance.js';
import {
  DHAN_PERSISTED_STATE_SCHEMA_VERSION,
  NOOP_DHAN_STATE_STORE,
  parseDhanPersistedState,
  type DhanPersistedRefreshEntry,
  type DhanPersistedState,
  type DhanStateLoadOutcome,
  type DhanStateStorePort,
} from './dhan_state_store.js';
import {
  FRESHNESS_DOMAINS,
  resolveFreshnessThresholds,
  type FreshnessEnvSource,
  type FreshnessThresholdOverrides,
  type FreshnessThresholdOverrideReport,
  type ResolvedFreshnessThresholds,
} from '../../quality/freshness_thresholds.js';

// ── Consumer-facing (provider-neutral) request/response contracts ────────────

export interface QuoteRequest {
  companyId: string;
  /**
   * The complete canonical P04 `D114SecurityIdentity` (`ISIN:<isin>:<series>`).
   * Quote resolution REQUIRES it: companyId, ISIN-only or segment-only requests
   * fail closed before any provider invocation. Typically sourced from the
   * G-2 persisted holding identity.
   */
  securityIdentity: D114SecurityIdentity;
  exchangeSegment?: DhanExchangeSegment;
}

export type QuoteResponse =
  | { ok: true; envelope: CanonicalEnvelope<MarketQuotePayload>; freshness: 'CURRENT' | 'STALE' }
  | { ok: false; failure: DhanFailure };

export interface HistoricalServiceRequest extends DhanHistoricalRequest {}

export type HistoricalResponse =
  | { ok: true; result: DhanHistoricalNormalizationResult }
  | { ok: false; failure: DhanFailure };

/** W-07 governed D-7 wire values; independent wire fields do not establish a live claim by themselves. */
export type DhanLiveProviderConnectivity = 'NOT_CHECKED_PRE_ACCESS' | 'CONNECTED_LIVE';
export type DhanProviderQualification = 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' | 'LIVE_QUALIFIED';
export const DHAN_HEALTH_CONTRACT_VERSION = 2 as const;
export const DHAN_HEALTH_CONTRACT_LEGACY_VERSION = 1 as const;
export type DhanHealthContractVersion =
  | typeof DHAN_HEALTH_CONTRACT_VERSION
  | typeof DHAN_HEALTH_CONTRACT_LEGACY_VERSION;

export interface ServiceHealth {
  /** Absent in legacy payloads; numeric 1 (legacy) or 2 (W-07) when present. */
  contractVersion?: DhanHealthContractVersion;
  /** Process-level availability of the composed service. */
  service: 'UP' | 'DOWN';
  /** Provider credential configuration state (never the credentials). */
  providerConfiguration: 'CONFIGURED' | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE';
  /** Governed D-7 connectivity state derived from observed W-08 provider interactions. */
  liveProviderConnectivity: DhanLiveProviderConnectivity;
  /** Governed D-7 qualification state; closed only by M2/M3 live qualification evidence. */
  providerQualification: DhanProviderQualification;
}

/** Validate an untrusted wire payload without reflecting fields or inferring live evidence. */
export function validateDhanServiceHealth(input: unknown): ServiceHealth | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  if ((p.ok !== undefined && p.ok !== true) || p.error !== undefined || p.failure !== undefined) return null;
  if (p.service !== 'UP' && p.service !== 'DOWN') return null;
  if (p.providerConfiguration !== 'CONFIGURED' && p.providerConfiguration !== 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
    return null;
  }
  if (p.liveProviderConnectivity !== 'NOT_CHECKED_PRE_ACCESS' && p.liveProviderConnectivity !== 'CONNECTED_LIVE') {
    return null;
  }
  if (
    p.providerQualification !== 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' &&
    p.providerQualification !== 'LIVE_QUALIFIED'
  ) {
    return null;
  }
  if (
    p.contractVersion !== undefined &&
    p.contractVersion !== DHAN_HEALTH_CONTRACT_LEGACY_VERSION &&
    p.contractVersion !== DHAN_HEALTH_CONTRACT_VERSION
  ) {
    return null;
  }
  return {
    service: p.service,
    providerConfiguration: p.providerConfiguration,
    liveProviderConnectivity: p.liveProviderConnectivity,
    providerQualification: p.providerQualification,
    ...(p.contractVersion !== undefined ? { contractVersion: p.contractVersion } : {}),
  };
}

// ── W-09 / D-7 governed diagnostics contract (MAY list only) ─────────────────

/**
 * Version history:
 *   1 — W-09 baseline.
 *   2 — W-25 adds the required `freshness` block (effective thresholds + override dispositions).
 *   3 — W-23 adds the required `persistence` block (start-up restore outcome).
 *
 * Additive-but-required fields move the version, following the W-07 precedent for
 * `ServiceHealth`: the validator rejects every earlier version, so the constant and the
 * validator must agree rather than one describing the other's input.
 */
export const DHAN_DIAGNOSTICS_CONTRACT_VERSION = 3 as const;
export type DhanDiagnosticsContractVersion = typeof DHAN_DIAGNOSTICS_CONTRACT_VERSION;

/** Normative D-7 §2 eight-state provider vocabulary (re-exported from dhan_provider_state). */
export type { DhanProviderState };

/** Enumerated D-7 §4.1 credential-resolution status codes (never locations or URIs). */
export type DhanCredentialResolutionOutcome =
  | 'UNCONFIGURED'
  | 'CONFIGURATION_INCOMPLETE'
  | 'PRODUCTION_NOT_AUTHORIZED'
  | 'CREDENTIALS_UNAVAILABLE'
  | 'CREDENTIALS_EXPIRED'
  | 'CONFIGURED_NOT_RESOLVED'
  | 'CREDENTIALS_RESOLVED';

export interface DhanDiagnosticsRequestCounters {
  readonly quoteRequests: number;
  readonly quoteCacheHits: number;
  readonly historicalRequests: number;
  readonly verificationProbes: number;
  readonly vendorRequestsTotal: number;
  readonly vendorSuccesses: number;
  readonly providerFailures: number;
}

/**
 * Governed `/v1/diagnostics` payload (W-09 / D-7 §4.1 MAY list).
 * By construction contains only closed enumerations, non-locating backend IDs,
 * canonical ISO-8601 UTC timestamps, counts, and booleans — never secret values,
 * `vault://` references, filesystem/carrier paths, child-process output, or
 * raw provider error messages (D-7 §4.2).
 */
export interface DhanDiagnosticsFreshnessThresholdOverride {
  readonly domain: DataDomain;
  /** Effective threshold after validation. */
  readonly seconds: number;
  readonly source: 'DEFAULT' | 'ENVIRONMENT' | 'OPTION';
  /** The supplied literal, echoed so the operator can see what was ignored. */
  readonly raw: string;
  /** `null` means the override was accepted and applied. */
  readonly issue: 'INVALID_NUMBER' | 'OUT_OF_RANGE' | null;
}

export interface DhanDiagnosticsFreshnessConfig {
  /** Effective threshold per domain, complete for every `DataDomain`. */
  readonly thresholds: Readonly<Record<DataDomain, number>>;
  /** Only domains configuration mentioned; an absent domain is unmentioned, not rejected. */
  readonly overrides: readonly DhanDiagnosticsFreshnessThresholdOverride[];
}

export interface ServiceDiagnostics {
  readonly contractVersion: DhanDiagnosticsContractVersion;
  readonly service: 'UP' | 'DOWN';
  readonly providerState: DhanProviderState;
  readonly providerConfiguration: 'CONFIGURED' | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE';
  readonly providerReadiness: DhanCredentialReadiness;
  readonly vaultBackendId: string;
  readonly liveCredentialResolutionSupported: boolean;
  readonly vendorEgressMode: DhanVendorEgressMode;
  readonly credentialResolutionOutcome: DhanCredentialResolutionOutcome;
  readonly liveProviderConnectivity: DhanLiveProviderConnectivity;
  readonly providerQualification: DhanProviderQualification;
  readonly lastSuccessAt: string | null;
  readonly lastFailureCategory: DhanObservedFailureCategory | null;
  readonly lastFailure: DhanRecordedFailure | null;
  readonly lastAuthOutcome: DhanAuthOutcome;
  readonly lastLatencyMs: number | null;
  readonly consecutiveAuthFailures: number;
  readonly authLatched: boolean;
  readonly requestCounters: DhanDiagnosticsRequestCounters;
  readonly qualifiedMappingsLoaded: number;
  readonly quoteCache: DhanQuoteCacheDiagnostics;
  /**
   * W-25: the effective freshness configuration.
   *
   * `thresholds` is complete for every `DataDomain`, so a consumer never has to merge the
   * response with a compiled-in default to learn the value the evaluator actually used.
   * `overrides` lists only domains configuration *mentioned*, accepted or rejected, so
   * "my override did not apply" is answerable from the payload itself.
   */
  readonly freshness: DhanDiagnosticsFreshnessConfig;
  /**
   * W-23: what persistence did at start-up.
   *
   * Always present so a consumer can distinguish a first-ever cold start from a restored
   * process from a cold start caused by a corrupt store. Absent-store and failed-restore are
   * different operational facts and collapsing them is how a broken store stays invisible.
   */
  readonly persistence: DhanDiagnosticsPersistenceState;
}

export interface DhanDiagnosticsPersistenceState {
  readonly enabled: boolean;
  /** `DISABLED` when no store is configured; otherwise the outcome of the start-up load. */
  readonly restoreStatus: 'DISABLED' | 'ABSENT' | 'LOADED' | 'CORRUPT';
  /** Failure reason, or `null`. Never a filesystem message — those can carry a path. */
  readonly restoreReason: string | null;
  readonly quotesRestored: number;
  readonly quotesDroppedAsUnavailable: number;
  readonly refreshEntriesRestored: number;
  readonly observedStateRestored: boolean;
  readonly authLatchClearedByRestart: boolean;
}

const VALID_PROVIDER_STATES: ReadonlySet<DhanProviderState> = new Set(DHAN_PROVIDER_STATES);

const VALID_CREDENTIAL_RESOLUTION_OUTCOMES: ReadonlySet<DhanCredentialResolutionOutcome> = new Set([
  'UNCONFIGURED',
  'CONFIGURATION_INCOMPLETE',
  'PRODUCTION_NOT_AUTHORIZED',
  'CREDENTIALS_UNAVAILABLE',
  'CREDENTIALS_EXPIRED',
  'CONFIGURED_NOT_RESOLVED',
  'CREDENTIALS_RESOLVED',
]);

const VALID_VENDOR_EGRESS_MODES: ReadonlySet<DhanVendorEgressMode> = new Set([
  'DISABLED_PRE_ACCESS',
  'IPD_SERVER_HTTPS',
  'SYNTHETIC_INJECTED',
]);

const VALID_AUTH_OUTCOMES: ReadonlySet<DhanAuthOutcome> = new Set([
  'NOT_CHECKED',
  'AUTHENTICATED',
  'AUTHENTICATION_FAILURE',
  'CREDENTIALS_EXPIRED',
  'CREDENTIALS_UNAVAILABLE',
]);

const VALID_CACHE_STATES: ReadonlySet<DhanAggregateCacheState> = new Set([
  'EMPTY',
  'CURRENT',
  'STALE',
  'UNAVAILABLE',
  'MIXED',
]);

const CANONICAL_ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isCanonicalIsoUtc(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    CANONICAL_ISO_UTC_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

const VALID_FRESHNESS_OVERRIDE_SOURCES: ReadonlySet<string> = new Set([
  'DEFAULT',
  'ENVIRONMENT',
  'OPTION',
]);
const VALID_FRESHNESS_OVERRIDE_ISSUES: ReadonlySet<string> = new Set([
  'INVALID_NUMBER',
  'OUT_OF_RANGE',
]);
const FRESHNESS_DOMAIN_SET: ReadonlySet<string> = new Set(FRESHNESS_DOMAINS);

/**
 * Validates the W-25 `freshness` block. Returns `null` for any payload that is not a
 * complete, whitelisted configuration statement.
 *
 * Completeness is checked against `FRESHNESS_DOMAINS` rather than a literal list, so
 * adding a domain cannot leave a hole here that a truncated payload would satisfy.
 */
export function validateDhanDiagnosticsFreshness(input: unknown): DhanDiagnosticsFreshnessConfig | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const f = input as Record<string, unknown>;

  const thresholds = f.thresholds;
  if (!thresholds || typeof thresholds !== 'object' || Array.isArray(thresholds)) return null;
  const t = thresholds as Record<string, unknown>;
  const keys = Object.keys(t);
  if (keys.length !== FRESHNESS_DOMAINS.length) return null;
  const cleanThresholds = {} as Record<DataDomain, number>;
  for (const domain of FRESHNESS_DOMAINS) {
    const value = t[domain];
    if (!Number.isSafeInteger(value) || (value as number) <= 0) return null;
    cleanThresholds[domain] = value as number;
  }
  // Any key outside `DataDomain` would have made the count check pass by displacing a real
  // domain, so membership is verified rather than assumed from the length.
  if (keys.some((key) => !FRESHNESS_DOMAIN_SET.has(key))) return null;

  if (!Array.isArray(f.overrides)) return null;
  const cleanOverrides: DhanDiagnosticsFreshnessThresholdOverride[] = [];
  const seen = new Set<string>();
  for (const entry of f.overrides) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const o = entry as Record<string, unknown>;
    if (typeof o.domain !== 'string' || !FRESHNESS_DOMAIN_SET.has(o.domain)) return null;
    if (seen.has(o.domain)) return null;
    seen.add(o.domain);
    if (!Number.isSafeInteger(o.seconds) || (o.seconds as number) <= 0) return null;
    if (typeof o.source !== 'string' || !VALID_FRESHNESS_OVERRIDE_SOURCES.has(o.source)) return null;
    // `raw` is always a string: the emitter supplies `String(value)`, so a null or a
    // non-string is not a shape this contract produces and is rejected rather than coerced.
    if (typeof o.raw !== 'string' || o.raw.length > 64) return null;
    if (o.issue !== null && (typeof o.issue !== 'string' || !VALID_FRESHNESS_OVERRIDE_ISSUES.has(o.issue))) {
      return null;
    }
    // An accepted override's value IS the threshold; a rejected one reports the fallback.
    // Either way the reported value must equal what `thresholds` states for the domain.
    if (o.seconds !== cleanThresholds[o.domain as DataDomain]) return null;
    if (o.issue === null && o.source === 'DEFAULT') return null;
    if (o.issue !== null && o.source !== 'DEFAULT') return null;
    cleanOverrides.push({
      domain: o.domain as DataDomain,
      seconds: o.seconds as number,
      source: o.source as DhanDiagnosticsFreshnessThresholdOverride['source'],
      raw: o.raw,
      issue: o.issue as DhanDiagnosticsFreshnessThresholdOverride['issue'],
    });
  }

  return { thresholds: Object.freeze(cleanThresholds), overrides: Object.freeze(cleanOverrides) };
}

const VALID_PERSISTENCE_RESTORE_STATUS: ReadonlySet<string> = new Set([
  'DISABLED',
  'ABSENT',
  'LOADED',
  'CORRUPT',
]);
const VALID_PERSISTENCE_RESTORE_REASONS: ReadonlySet<string> = new Set([
  'FILE_ABSENT',
  'INVALID_JSON',
  'SCHEMA_MISMATCH',
  'INVALID_SHAPE',
  'TOO_LARGE',
  'READ_ERROR',
]);

/** Validates the W-23 `persistence` block fail-closed. Returns `null` on any defect. */
export function validateDhanDiagnosticsPersistence(input: unknown): DhanDiagnosticsPersistenceState | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  if (typeof p.enabled !== 'boolean') return null;
  if (typeof p.restoreStatus !== 'string' || !VALID_PERSISTENCE_RESTORE_STATUS.has(p.restoreStatus)) return null;
  if (p.restoreReason !== null && (typeof p.restoreReason !== 'string' || !VALID_PERSISTENCE_RESTORE_REASONS.has(p.restoreReason))) {
    return null;
  }
  for (const field of ['quotesRestored', 'quotesDroppedAsUnavailable', 'refreshEntriesRestored'] as const) {
    if (!isNonNegativeInt(p[field])) return null;
  }
  if (typeof p.observedStateRestored !== 'boolean') return null;
  if (typeof p.authLatchClearedByRestart !== 'boolean') return null;

  // Consistency the emitter guarantees and a consumer must be able to rely on.
  if (p.restoreStatus === 'DISABLED' && p.enabled) return null;
  if (!p.enabled && p.restoreStatus !== 'DISABLED') return null;
  if (p.restoreStatus === 'CORRUPT' && p.restoreReason === null) return null;
  if (p.restoreStatus === 'LOADED' && p.restoreReason !== null) return null;
  if (p.restoreStatus === 'LOADED' && p.quotesRestored === 0 && p.refreshEntriesRestored === 0 && p.observedStateRestored === false) {
    // A LOADED outcome that admitted nothing is a statement the emitter never makes.
    return null;
  }

  return Object.freeze({
    enabled: p.enabled,
    restoreStatus: p.restoreStatus as DhanDiagnosticsPersistenceState['restoreStatus'],
    restoreReason: p.restoreReason as string | null,
    quotesRestored: p.quotesRestored as number,
    quotesDroppedAsUnavailable: p.quotesDroppedAsUnavailable as number,
    refreshEntriesRestored: p.refreshEntriesRestored as number,
    observedStateRestored: p.observedStateRestored,
    authLatchClearedByRestart: p.authLatchClearedByRestart,
  });
}

/**
 * Validates an untrusted `/v1/diagnostics` wire payload fail-closed without
 * reflecting unknown fields or accepting unwhitelisted identifiers/strings.
 */
export function validateDhanServiceDiagnostics(input: unknown): ServiceDiagnostics | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  if ((p.ok !== undefined && p.ok !== true) || p.error !== undefined || p.failure !== undefined) {
    return null;
  }
  if (p.contractVersion !== DHAN_DIAGNOSTICS_CONTRACT_VERSION) return null;
  if (p.service !== 'UP' && p.service !== 'DOWN') return null;
  if (typeof p.providerState !== 'string' || !VALID_PROVIDER_STATES.has(p.providerState as DhanProviderState)) {
    return null;
  }
  if (p.providerConfiguration !== 'CONFIGURED' && p.providerConfiguration !== 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
    return null;
  }
  if (
    p.providerReadiness !== 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE' &&
    p.providerReadiness !== 'CREDENTIAL_REFERENCES_CONFIGURED'
  ) {
    return null;
  }
  if (
    typeof p.vaultBackendId !== 'string' ||
    sanitizeVaultBackendId(p.vaultBackendId) !== p.vaultBackendId
  ) {
    return null;
  }
  if (typeof p.liveCredentialResolutionSupported !== 'boolean') return null;
  if (
    typeof p.vendorEgressMode !== 'string' ||
    !VALID_VENDOR_EGRESS_MODES.has(p.vendorEgressMode as DhanVendorEgressMode)
  ) {
    return null;
  }
  if (
    typeof p.credentialResolutionOutcome !== 'string' ||
    !VALID_CREDENTIAL_RESOLUTION_OUTCOMES.has(
      p.credentialResolutionOutcome as DhanCredentialResolutionOutcome
    )
  ) {
    return null;
  }
  if (p.liveProviderConnectivity !== 'NOT_CHECKED_PRE_ACCESS' && p.liveProviderConnectivity !== 'CONNECTED_LIVE') {
    return null;
  }
  if (
    p.providerQualification !== 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED' &&
    p.providerQualification !== 'LIVE_QUALIFIED'
  ) {
    return null;
  }
  if (p.lastSuccessAt !== null && !isCanonicalIsoUtc(p.lastSuccessAt)) return null;
  if (p.lastFailureCategory !== null && !isGovernedProviderFailureCategory(p.lastFailureCategory)) {
    return null;
  }

  let validatedLastFailure: DhanRecordedFailure | null = null;
  if (p.lastFailure !== null) {
    if (!p.lastFailure || typeof p.lastFailure !== 'object' || Array.isArray(p.lastFailure)) {
      return null;
    }
    const lf = p.lastFailure as Record<string, unknown>;
    if (!isGovernedProviderFailureCategory(lf.category) || !isCanonicalIsoUtc(lf.at)) {
      return null;
    }
    validatedLastFailure = { category: lf.category, at: lf.at };
  }
  if ((validatedLastFailure?.category ?? null) !== p.lastFailureCategory) return null;

  if (typeof p.lastAuthOutcome !== 'string' || !VALID_AUTH_OUTCOMES.has(p.lastAuthOutcome as DhanAuthOutcome)) {
    return null;
  }
  if (
    p.lastLatencyMs !== null &&
    (typeof p.lastLatencyMs !== 'number' || !Number.isFinite(p.lastLatencyMs) || p.lastLatencyMs < 0)
  ) {
    return null;
  }
  if (!isNonNegativeInt(p.consecutiveAuthFailures)) return null;
  if (typeof p.authLatched !== 'boolean') return null;
  if (!isNonNegativeInt(p.qualifiedMappingsLoaded)) return null;

  if (!p.requestCounters || typeof p.requestCounters !== 'object' || Array.isArray(p.requestCounters)) {
    return null;
  }
  const rc = p.requestCounters as Record<string, unknown>;
  if (
    !isNonNegativeInt(rc.quoteRequests) ||
    !isNonNegativeInt(rc.quoteCacheHits) ||
    !isNonNegativeInt(rc.historicalRequests) ||
    !isNonNegativeInt(rc.verificationProbes) ||
    !isNonNegativeInt(rc.vendorRequestsTotal) ||
    !isNonNegativeInt(rc.vendorSuccesses) ||
    !isNonNegativeInt(rc.providerFailures)
  ) {
    return null;
  }

  if (!p.quoteCache || typeof p.quoteCache !== 'object' || Array.isArray(p.quoteCache)) {
    return null;
  }
  const qc = p.quoteCache as Record<string, unknown>;
  if (
    !isNonNegativeInt(qc.size) ||
    !isNonNegativeInt(qc.capacity) ||
    qc.capacity <= 0 ||
    typeof qc.state !== 'string' ||
    !VALID_CACHE_STATES.has(qc.state as DhanAggregateCacheState) ||
    !isNonNegativeInt(qc.currentEntries) ||
    !isNonNegativeInt(qc.staleEntries) ||
    !isNonNegativeInt(qc.unavailableEntries) ||
    qc.currentEntries + qc.staleEntries + qc.unavailableEntries !== qc.size
  ) {
    return null;
  }

  // W-25: the effective freshness configuration is validated fail-closed. A payload that
  // omits a domain, invents one, or carries a non-integer threshold is rejected outright —
  // a partial map would silently reintroduce the guess this field exists to remove.
  const freshness = validateDhanDiagnosticsFreshness(p.freshness);
  if (freshness === null) return null;

  // W-23: persistence state is validated the same fail-closed way. A consumer that cannot
  // trust these counts must not be handed them; they decide whether a "restored" process is
  // actually reporting restored evidence.
  const persistence = validateDhanDiagnosticsPersistence(p.persistence);
  if (persistence === null) return null;

  return {
    contractVersion: DHAN_DIAGNOSTICS_CONTRACT_VERSION,
    service: p.service,
    providerState: p.providerState as DhanProviderState,
    providerConfiguration: p.providerConfiguration,
    providerReadiness: p.providerReadiness,
    vaultBackendId: p.vaultBackendId,
    liveCredentialResolutionSupported: p.liveCredentialResolutionSupported,
    vendorEgressMode: p.vendorEgressMode as DhanVendorEgressMode,
    credentialResolutionOutcome: p.credentialResolutionOutcome as DhanCredentialResolutionOutcome,
    liveProviderConnectivity: p.liveProviderConnectivity,
    providerQualification: p.providerQualification,
    lastSuccessAt: p.lastSuccessAt,
    lastFailureCategory: p.lastFailureCategory,
    lastFailure: validatedLastFailure,
    lastAuthOutcome: p.lastAuthOutcome as DhanAuthOutcome,
    lastLatencyMs: p.lastLatencyMs,
    consecutiveAuthFailures: p.consecutiveAuthFailures,
    authLatched: p.authLatched,
    requestCounters: {
      quoteRequests: rc.quoteRequests,
      quoteCacheHits: rc.quoteCacheHits,
      historicalRequests: rc.historicalRequests,
      verificationProbes: rc.verificationProbes,
      vendorRequestsTotal: rc.vendorRequestsTotal,
      vendorSuccesses: rc.vendorSuccesses,
      providerFailures: rc.providerFailures,
    },
    qualifiedMappingsLoaded: p.qualifiedMappingsLoaded,
    freshness,
    persistence,
    quoteCache: {
      size: qc.size,
      capacity: qc.capacity,
      state: qc.state as DhanAggregateCacheState,
      currentEntries: qc.currentEntries,
      staleEntries: qc.staleEntries,
      unavailableEntries: qc.unavailableEntries,
    },
  };
}

// ── Operator-initiated loopback connection verification contract (D-7 §3 / W-08 / W-10) ──

export const DHAN_VERIFICATION_CONTRACT_VERSION = 1 as const;
export type DhanVerificationContractVersion = typeof DHAN_VERIFICATION_CONTRACT_VERSION;

/**
 * Governed `/v1/connection/verify` response payload (D-7 §3 & §4.1 MAY list).
 * Carries only enumerated outcome/state codes, booleans, bounded counts,
 * non-negative latency, canonical ISO-8601 UTC timestamps, and the validated
 * post-verification `ServiceDiagnostics` snapshot — never secrets, prefixes,
 * `vault://` references, carrier paths, child-process output, or vendor messages.
 */
export interface ServiceConnectionVerification {
  readonly contractVersion: DhanVerificationContractVersion;
  readonly mode: DhanVerificationMode;
  readonly outcome: DhanVerificationOutcomeCode;
  readonly providerState: DhanProviderState;
  readonly localReadinessEstablished: boolean;
  readonly probeAttempted: boolean;
  readonly probeCount: 0 | 1;
  readonly failureCategory: DhanObservedFailureCategory | null;
  readonly checkedAt: string;
  readonly latencyMs: number | null;
  readonly observedState: DhanProviderObservedState;
  readonly diagnostics: ServiceDiagnostics;
}

const VALID_VERIFICATION_MODES: ReadonlySet<DhanVerificationMode> = new Set([
  'LIVE_PROBE',
  'LOCAL_ONLY',
]);

const VALID_VERIFICATION_OUTCOMES: ReadonlySet<DhanVerificationOutcomeCode> = new Set([
  'VERIFIED_VENDOR_ACCEPTED',
  'VERIFIED_LOCAL_ONLY',
  'AUTH_REJECTED',
  'EXPIRED_LOCAL',
  'NOT_ATTEMPTED_NOT_READY',
  'FAILED_TRANSPORT',
  'FAILED_VENDOR_RESPONSE',
]);

/**
 * Determines whether V1 local credential readiness succeeded during this
 * single verification attempt (`DhanApiClient.probeOnce`), without conflating
 * local credential readiness with V2 vendor authentication (D-7 §3 rule 5).
 */
export function deriveLocalReadinessEstablished(result: ProviderVerificationResult): boolean {
  return (
    result.outcome === 'VERIFIED_LOCAL_ONLY' ||
    result.outcome === 'VERIFIED_VENDOR_ACCEPTED' ||
    result.probeAttempted === true ||
    (result.outcome === 'NOT_ATTEMPTED_NOT_READY' &&
      (result.failureCategory === 'TRANSPORT_FAILURE' ||
        result.failureCategory === 'RATE_LIMITED'))
  );
}

/**
 * Projects a W-08 `ProviderVerificationResult` and post-verification
 * `ServiceDiagnostics` snapshot into a frozen, canonical wire payload.
 */
export function buildServiceConnectionVerification(
  mode: DhanVerificationMode,
  verification: ProviderVerificationResult,
  diagnostics: ServiceDiagnostics
): ServiceConnectionVerification {
  const checkedAtParsed = Date.parse(verification.checkedAt);
  const checkedAt = Number.isFinite(checkedAtParsed)
    ? new Date(checkedAtParsed).toISOString()
    : diagnostics.lastSuccessAt ?? new Date(0).toISOString();

  const observedFailure: DhanRecordedFailure | null =
    verification.observedState.lastFailure === null
      ? null
      : Object.freeze({
          category: verification.observedState.lastFailure.category,
          at: verification.observedState.lastFailure.at,
        });

  const observedState: DhanProviderObservedState = Object.freeze({
    lastSuccessAt: verification.observedState.lastSuccessAt,
    lastFailure: observedFailure,
    lastAuthOutcome: verification.observedState.lastAuthOutcome,
    lastLatencyMs: verification.observedState.lastLatencyMs,
    consecutiveAuthFailures: verification.observedState.consecutiveAuthFailures,
    authLatched: verification.observedState.authLatched,
  });

  return Object.freeze({
    contractVersion: DHAN_VERIFICATION_CONTRACT_VERSION,
    mode,
    outcome: verification.outcome,
    providerState: diagnostics.providerState,
    localReadinessEstablished: deriveLocalReadinessEstablished(verification),
    probeAttempted: verification.probeAttempted,
    probeCount: verification.probeCount,
    failureCategory: verification.failureCategory,
    checkedAt,
    latencyMs: verification.latencyMs,
    observedState,
    diagnostics,
  });
}

function validateObservedProviderState(input: unknown): DhanProviderObservedState | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  if (o.lastSuccessAt !== null && !isCanonicalIsoUtc(o.lastSuccessAt)) return null;

  let validatedLastFailure: DhanRecordedFailure | null = null;
  if (o.lastFailure !== null) {
    if (!o.lastFailure || typeof o.lastFailure !== 'object' || Array.isArray(o.lastFailure)) {
      return null;
    }
    const lf = o.lastFailure as Record<string, unknown>;
    if (!isGovernedProviderFailureCategory(lf.category) || !isCanonicalIsoUtc(lf.at)) {
      return null;
    }
    validatedLastFailure = Object.freeze({ category: lf.category, at: lf.at });
  }

  if (typeof o.lastAuthOutcome !== 'string' || !VALID_AUTH_OUTCOMES.has(o.lastAuthOutcome as DhanAuthOutcome)) {
    return null;
  }
  if (
    o.lastLatencyMs !== null &&
    (typeof o.lastLatencyMs !== 'number' || !Number.isFinite(o.lastLatencyMs) || o.lastLatencyMs < 0)
  ) {
    return null;
  }
  if (!isNonNegativeInt(o.consecutiveAuthFailures)) return null;
  if (typeof o.authLatched !== 'boolean') return null;

  return Object.freeze({
    lastSuccessAt: o.lastSuccessAt,
    lastFailure: validatedLastFailure,
    lastAuthOutcome: o.lastAuthOutcome as DhanAuthOutcome,
    lastLatencyMs: o.lastLatencyMs,
    consecutiveAuthFailures: o.consecutiveAuthFailures,
    authLatched: o.authLatched,
  });
}

/**
 * Validates an untrusted `/v1/connection/verify` wire payload fail-closed without
 * reflecting unknown fields or accepting contradictory V1/V2 claims (D-7 §3 / §5).
 */
export function validateDhanConnectionVerification(
  input: unknown
): ServiceConnectionVerification | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  if ((p.ok !== undefined && p.ok !== true) || p.error !== undefined || p.failure !== undefined) {
    return null;
  }
  if (p.contractVersion !== DHAN_VERIFICATION_CONTRACT_VERSION) return null;
  if (typeof p.mode !== 'string' || !VALID_VERIFICATION_MODES.has(p.mode as DhanVerificationMode)) {
    return null;
  }
  if (
    typeof p.outcome !== 'string' ||
    !VALID_VERIFICATION_OUTCOMES.has(p.outcome as DhanVerificationOutcomeCode)
  ) {
    return null;
  }
  if (
    typeof p.providerState !== 'string' ||
    !VALID_PROVIDER_STATES.has(p.providerState as DhanProviderState)
  ) {
    return null;
  }
  if (typeof p.localReadinessEstablished !== 'boolean') return null;
  if (typeof p.probeAttempted !== 'boolean') return null;
  if (p.probeCount !== 0 && p.probeCount !== 1) return null;
  if (p.probeCount !== (p.probeAttempted ? 1 : 0)) return null;
  if (p.mode === 'LOCAL_ONLY' && p.probeAttempted) return null;
  if (p.failureCategory !== null && !isGovernedProviderFailureCategory(p.failureCategory)) {
    return null;
  }
  if (!isCanonicalIsoUtc(p.checkedAt)) return null;
  if (
    p.latencyMs !== null &&
    (typeof p.latencyMs !== 'number' || !Number.isFinite(p.latencyMs) || p.latencyMs < 0)
  ) {
    return null;
  }
  if (!p.probeAttempted && p.latencyMs !== null) return null;

  const observedState = validateObservedProviderState(p.observedState);
  if (!observedState) return null;

  const diagnostics = validateDhanServiceDiagnostics(p.diagnostics);
  if (!diagnostics) return null;
  if (diagnostics.providerState !== p.providerState) return null;

  // Enforce D-7 §3 V1/V2 invariants so local readiness is never misrepresented as vendor auth.
  const outcome = p.outcome as DhanVerificationOutcomeCode;
  if (outcome === 'VERIFIED_VENDOR_ACCEPTED') {
    if (
      p.mode !== 'LIVE_PROBE' ||
      !p.localReadinessEstablished ||
      !p.probeAttempted ||
      p.probeCount !== 1 ||
      p.failureCategory !== null
    ) {
      return null;
    }
  } else if (outcome === 'VERIFIED_LOCAL_ONLY') {
    if (
      !p.localReadinessEstablished ||
      p.probeAttempted ||
      p.probeCount !== 0 ||
      p.failureCategory !== null
    ) {
      return null;
    }
    if (
      observedState.lastSuccessAt === null &&
      (p.providerState === 'AUTHENTICATED' ||
        p.providerState === 'OPERATIONAL' ||
        diagnostics.liveProviderConnectivity === 'CONNECTED_LIVE')
    ) {
      return null;
    }
  } else if (outcome === 'EXPIRED_LOCAL') {
    if (
      p.localReadinessEstablished ||
      p.probeAttempted ||
      p.probeCount !== 0 ||
      p.failureCategory !== 'CREDENTIALS_EXPIRED'
    ) {
      return null;
    }
  } else {
    if (p.failureCategory === null) return null;
    if (outcome === 'NOT_ATTEMPTED_NOT_READY') {
      if (p.probeAttempted || p.probeCount !== 0) return null;
    } else if (outcome === 'FAILED_TRANSPORT' || outcome === 'FAILED_VENDOR_RESPONSE') {
      if (!p.localReadinessEstablished || !p.probeAttempted || p.probeCount !== 1) return null;
    } else if (outcome === 'AUTH_REJECTED') {
      if (p.failureCategory !== 'AUTHENTICATION_FAILURE') return null;
      if (p.probeAttempted && !p.localReadinessEstablished) return null;
    }
  }

  return Object.freeze({
    contractVersion: DHAN_VERIFICATION_CONTRACT_VERSION,
    mode: p.mode as DhanVerificationMode,
    outcome,
    providerState: p.providerState as DhanProviderState,
    localReadinessEstablished: p.localReadinessEstablished,
    probeAttempted: p.probeAttempted,
    probeCount: p.probeCount,
    failureCategory: p.failureCategory,
    checkedAt: p.checkedAt,
    latencyMs: p.latencyMs,
    observedState,
    diagnostics,
  });
}

/**
 * W-23: what the last store load did.
 *
 * Public because an operator must be able to tell a genuinely first-ever cold start from a
 * restore that failed: those are different operational facts and the difference is exactly
 * what a corrupt store would otherwise hide.
 */
export interface DhanStateRestoreReport {
  /** `ABSENT` / `CORRUPT` both mean the process started cold; `reason` says which. */
  readonly status: DhanStateLoadOutcome['status'] | 'NO_STORE';
  readonly reason: string | null;
  /** Entries admitted after re-classification under the current clock and thresholds. */
  readonly quotesRestored: number;
  /** Entries DROPPED because they had aged past suppression during the outage. */
  readonly quotesDroppedAsUnavailable: number;
  readonly refreshEntriesRestored: number;
  readonly observedStateRestored: boolean;
  /**
   * The previous process was auth-latched and this one is not.
   *
   * Surfaced so the deliberate W-23 decision (a restart clears the latch so the documented
   * credential-rotation route stays reachable) can never be mistaken for a lost latch.
   */
  readonly authLatchClearedByRestart: boolean;
}

export interface DhanMarketDataServiceOptions {
  /** Explicit offline calendar; absent means legacy elapsed-time mode, not guessed sessions. */
  tradingCalendar?: TradingCalendar;
  client: DhanApiClient;
  securityMaster: SecurityMaster;
  instrumentRegistry: DhanInstrumentRegistry;
  cache?: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  /** W-19: bounded historical observation cache; defaults to 256 entries. */
  historicalCache?: DhanHistoricalCache;
  limiter?: DhanRateLimiter;
  concurrency?: DhanConcurrencyLimiter;
  coalescer?: DhanRequestCoalescer;
  now?: () => Date;
  /**
   * W-25: explicit per-domain freshness thresholds. Validated by the same rules as the
   * environment source and takes precedence over it. Omitted domains use the compiled
   * default in `DEFAULT_FRESHNESS_CONFIG`.
   */
  freshnessThresholds?: FreshnessThresholdOverrides;
  /**
   * W-25: the environment map to read threshold overrides from.
   *
   * Supplied by the caller — never read from `process.env` implicitly — matching the rest
   * of the provider, where `resolveDhanProviderConfig(env)` and `DhanApiClient`'s
   * `envOverride` also receive their environment explicitly. The daemon passes its own
   * resolved environment; a consumer with no environment passes nothing. Configuration is
   * read once at construction, so a threshold cannot change under a request that is
   * mid-flight, and tests stay hermetic regardless of the ambient environment.
   */
  freshnessEnv?: FreshnessEnvSource;
  /**
   * W-23: where retained state is read at start and written on demand.
   *
   * Absent means `NOOP_DHAN_STATE_STORE`: the process starts cold and saves nothing, which
   * is the pre-W-23 behaviour exactly. The daemon supplies a file-backed store; a test
   * supplies an in-memory one. The provider never chooses a path and never imports
   * `src/persistence/**` — see `dhan_state_store.ts`.
   */
  stateStore?: DhanStateStorePort;
}

/**
 * Composed IPD-owned market-data service. Consumers (e.g. IRR backend) call
 * this service or its transport — they never construct Dhan primitives.
 */
export class DhanMarketDataService {
  private readonly tradingCalendar?: TradingCalendar;
  private readonly source: DhanMarketDataSource;
  private readonly historical: DhanHistoricalAdapter;
  private readonly resolution: DhanInstrumentResolutionService;
  private readonly instrumentRegistry: DhanInstrumentRegistry;
  private readonly orchestrator: DhanRefreshOrchestrator;
  private readonly cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  private readonly historicalCache: DhanHistoricalCache;
  private readonly limiter: DhanRateLimiter;
  private readonly client: DhanApiClient;
  private readonly now: () => Date;
  // Bounded diagnostic history, separate from observation cache; never affects execution.
  private readonly refreshStatus = new Map<string, RefreshStatus>();
  private quoteRequests = 0;
  private quoteCacheHits = 0;
  private historicalRequests = 0;
  private historicalCacheHits = 0;
  /** W-19: retained per-identity content digest so a revision is reported, never silently overwritten. */
  private readonly historicalDigests = new Map<string, string>();
  /** W-19: outcome of the most recent historical attempt; never inferred from the cache. */
  private lastHistoricalRefresh: RefreshStatus | null = null;
  /** W-19: the retention the freshness projection reads (identity + storage instant). */
  private lastHistoricalEvidence: { cacheKey: string; cachedAt: string | null } | null = null;
  private verificationProbes = 0;
  private running = false;
  /** W-25: effective thresholds, resolved once at construction (configuration never drifts). */
  private readonly freshnessThresholds: ResolvedFreshnessThresholds;
  /** W-25: only the domains configuration mentioned, accepted or rejected. */
  private readonly freshnessThresholdOverrides: readonly FreshnessThresholdOverrideReport[];
  /** W-23: the storage seam. NOOP when unconfigured, so an unconfigured process is unchanged. */
  private readonly stateStore: DhanStateStorePort;
  /** W-23: what the last load attempt did, and what it admitted. Reported, never inferred. */
  private stateRestoreReport: DhanStateRestoreReport;

  constructor(options: DhanMarketDataServiceOptions) {
    this.tradingCalendar = options.tradingCalendar ? parseTradingCalendar(options.tradingCalendar) : undefined;
    this.client = options.client;
    this.instrumentRegistry = options.instrumentRegistry;
    this.now = options.now ?? (() => new Date());
    // W-25: resolve once. An invalid override is rejected per domain and falls back to the
    // compiled default; the rejection is retained for diagnostics rather than logged and lost.
    const resolvedThresholds = resolveFreshnessThresholds(
      options.freshnessEnv ?? {},
      options.freshnessThresholds ?? {}
    );
    this.freshnessThresholds = resolvedThresholds.thresholds;
    this.freshnessThresholdOverrides = resolvedThresholds.overrides;
    this.stateStore = options.stateStore ?? NOOP_DHAN_STATE_STORE;
    // W-23: restore BEFORE the first request can be served. The cache is constructed after
    // this point, so the restore is handed the reference it needs below.
    this.stateRestoreReport = {
      status: 'NO_STORE',
      reason: null,
      quotesRestored: 0,
      quotesDroppedAsUnavailable: 0,
      refreshEntriesRestored: 0,
      observedStateRestored: false,
      authLatchClearedByRestart: false,
    };
    this.source = new DhanMarketDataSource({
      tradingCalendar: this.tradingCalendar,
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
      now: this.now,
    });
    this.historical = new DhanHistoricalAdapter({
      tradingCalendar: this.tradingCalendar,
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
    });
    this.resolution = new DhanInstrumentResolutionService(options.securityMaster, options.instrumentRegistry);
    this.cache = options.cache ?? new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(256);
    this.cache.setTradingCalendar(this.tradingCalendar);
    // W-23: restore now that the cache and calendar exist. Restoring AFTER setTradingCalendar
    // matters: re-classification of a restored entry must use the same session policy a live
    // entry would, or a restored quote could be judged on a different basis than a fetched one.
    this.stateRestoreReport = this.restoreRetainedState();
    this.historicalCache = options.historicalCache ?? new DhanHistoricalCache(256);
    this.limiter = options.limiter ?? new DhanRateLimiter({ maxRequests: 60, windowMs: 60_000, now: () => this.now().getTime() });
    const concurrency = options.concurrency ?? new DhanConcurrencyLimiter(8);
    const coalescer = options.coalescer ?? new DhanRequestCoalescer();
    this.orchestrator = new DhanRefreshOrchestrator({
      cache: this.cache,
      limiter: this.limiter,
      concurrency,
      coalescer,
      now: this.now,
      fetchQuote: async (scope: DhanSecurityScope) => {
        try {
          const envelope = await this.source.fetchSnapshot({
            companyId: scope.companyId,
            domain: 'D01_QUOTES',
            parameters: { exchangeSegment: scope.exchangeSegment, isin: scope.isin, series: scope.series },
          });
          return { ok: true as const, value: envelope };
        } catch (err) {
          const failure = (err as { failure?: DhanFailure }).failure;
          return { ok: false as const, failure: failure ?? dhanFailure('TRANSPORT_FAILURE', 'unknown provider failure').failure };
        }
      },
    });
  }

  /** Deterministic lifecycle. */
  public start(): void {
    this.running = true;
  }

  public stop(): void {
    this.running = false;
    this.orchestrator.stop();
  }

  public get isRunning(): boolean {
    return this.running;
  }

  /**
   * Canonical quote request. Identity is validated first; ambiguous or
   * incomplete identity fails closed before any provider invocation.
   * Goes through the Prompt 4 orchestrator (cache, rate limit, coalescing,
   * concurrency), never directly to the provider.
   */
  public async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    this.quoteRequests += 1;
    if (!this.running) return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'service not started').failure };
    if (!request || typeof request.companyId !== 'string' || !request.companyId.trim()) {
      return { ok: false, failure: dhanFailure('MISSING_REQUIRED_FIELD', 'companyId is required', { field: 'companyId' }).failure };
    }
    // The exact canonical D114 identity is MANDATORY — validated with the
    // authoritative P04 validator before anything else, never reconstructed.
    if (!request.securityIdentity || !isD114SecurityIdentity(request.securityIdentity)) {
      return {
        ok: false,
        failure: dhanFailure('MISSING_REQUIRED_FIELD', 'a valid canonical D114 securityIdentity (ISIN:<isin>:<series>) is required', { field: 'securityIdentity' }).failure,
      };
    }
    if (request.exchangeSegment !== undefined && request.exchangeSegment !== 'NSE_EQ' && request.exchangeSegment !== 'BSE_EQ') {
      return { ok: false, failure: dhanFailure('MALFORMED_RESPONSE', 'unsupported exchangeSegment', { field: 'exchangeSegment' }).failure };
    }

    // Fail closed on missing/ambiguous/inconsistent identity at the governed
    // mapping boundary: resolve the EXACT identity (ISIN + series bound to the
    // company and segment) BEFORE any provider call.
    const identity = request.securityIdentity;
    const segment = request.exchangeSegment ?? 'NSE_EQ';
    const mapping = this.resolution.resolveExactIdentity(request.companyId, segment, identity);
    if (!mapping.ok) {
      return { ok: false, failure: mapping.failure };
    }
    const scope: DhanSecurityScope = {
      companyId: request.companyId,
      exchangeSegment: segment,
      isin: identity.isin.toUpperCase(),
      series: identity.series.toUpperCase(),
    };

    const outcomes = await this.orchestrator.refresh([scope]);
    const outcome = outcomes[0]!;
    if (outcome.status === 'SKIPPED_FRESH') {
      this.quoteCacheHits += 1;
    }
    const key = dhanQuoteCacheKey(scope);
    const previous = this.refreshStatus.get(key);
    this.refreshStatus.delete(key);
    this.refreshStatus.set(key, {
      outcome: outcome.status,
      lastFailure: outcome.status === 'FAILURE'
        ? { code: 'REFRESH_FAILED', priorPreserved: outcome.priorPreserved }
        : previous?.lastFailure ?? null,
    });
    if (this.refreshStatus.size > 256) this.refreshStatus.delete(this.refreshStatus.keys().next().value!);
    if (outcome.status === 'SKIPPED_FRESH' || outcome.status === 'SUCCESS') {
      const entry = this.cache.get(dhanQuoteCacheKey(scope), this.now().toISOString());
      if (entry.entry) {
        return { ok: true, envelope: entry.entry, freshness: entry.state === 'CURRENT' ? 'CURRENT' : 'STALE' };
      }
    }
    if (outcome.status === 'FAILURE') {
      return {
        ok: false,
        failure: {
          code: outcome.code,
          message: outcome.message ?? 'quote refresh failed',
          ...(outcome.httpStatus !== undefined ? { httpStatus: outcome.httpStatus } : {}),
        },
      };
    }
    return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'no quote produced').failure };
  }

  /** Read-only status: never touches LRU order, refreshes or invokes the provider. */
  public getFreshness(request: { domain: 'D01_QUOTES'; companyId: string; exchangeSegment: DhanExchangeSegment; securityIdentity: D114SecurityIdentity } | { domain: 'D02_OHLCV' }): FreshnessStatus {
    const evaluatedAt = this.now().toISOString();
    const unknown: RefreshStatus = { outcome: 'UNKNOWN', lastFailure: null };
    if (request.domain === 'D02_OHLCV') {
      // W-19 / D-4.3: D02 freshness is reported from retained IPD evidence only. Until a
      // historical observation exists in this process, it stays honestly unknown — never
      // SNAPSHOT, never inferred from a candle. `refreshOutcome` of the last historical
      // attempt is reported alongside, and only when an attempt actually happened.
      const retained = this.historicalEvidence();
      const refresh = retained.lastRefresh ?? unknown;
      // W-25: the reported threshold is the EFFECTIVE one. With no override configured this
      // is byte-identical to the previous `D02_NOMINAL_THRESHOLD_SECONDS`; with one, the
      // report no longer contradicts the threshold the projection was classified against.
      const d02Threshold = this.freshnessThresholds.D02_OHLCV;
      if (!retained.projection) {
        // No observation means no evaluation, so the only honest statement is the
        // configured nominal threshold for this domain.
        return {
          ...freshnessStatus(request.domain, null, evaluatedAt, refresh, undefined, this.freshnessThresholds),
          thresholdSeconds: d02Threshold,
          timestamps: retained.timestamps,
          timestampStates: retained.timestamps.evidence,
          evidenceSource: 'NO_OBSERVATION',
          refreshOutcome: refresh.outcome,
        };
      }
      return {
        ...retained.projection,
        domain: request.domain,
        evaluatedAt,
        thresholdSeconds: d02Threshold,
        lastRefresh: refresh,
        refreshOutcome: refresh.outcome,
      };
    }
    const scope: DhanSecurityScope = { companyId: request.companyId, exchangeSegment: request.exchangeSegment, isin: request.securityIdentity.isin, series: request.securityIdentity.series };
    const key = dhanQuoteCacheKey(scope);
    return freshnessStatus(request.domain, this.cache.peek(key, evaluatedAt), evaluatedAt, this.refreshStatus.get(key) ?? unknown, this.tradingCalendar ? { kind: 'QUOTE', calendar: this.tradingCalendar, exchange: request.exchangeSegment === 'NSE_EQ' ? 'NSE' : 'BSE' } : undefined, this.freshnessThresholds);
  }

  /**
   * Canonical historical request through the existing D02 adapter path.
   *
   * W-19: the composed path now retains its own observations. Cache identity is the
   * complete resolved request identity (security + segment + interval + range +
   * adjustment), so different intervals and ranges never coalesce. Only validated,
   * successful results are stored — failures are never cached and never overwrite a
   * retained observation. A retained observation is reused without any provider call.
   */
  public async getHistorical(request: HistoricalServiceRequest): Promise<HistoricalResponse> {
    this.historicalRequests += 1;
    if (!this.running) return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'service not started').failure };

    const cacheKey = this.historicalIdentity(request);
    const retained = cacheKey === null ? undefined : this.historicalCache.get(cacheKey);
    if (retained) {
      this.historicalCacheHits += 1;
      // Session history: something was served, and nothing was fetched.
      this.recordHistoricalRefresh('SKIPPED_FRESH');
      return { ok: true, result: retained.provenance ? this.asCachedServed(retained) : retained.result };
    }

    if (!this.limiter.tryAcquire()) {
      // A request refused before the provider path is not a refresh failure, exactly as
      // on the D01 path: no attempt was made, so no outcome is claimed.
      this.recordHistoricalRefresh('BLOCKED');
      return { ok: false, failure: dhanFailure('RATE_LIMITED', 'provider request budget exhausted').failure };
    }
    const result = await this.historical.fetchDailyCandles(
      request,
      cacheKey === null ? undefined : { priorContentDigest: this.historicalDigests.get(cacheKey) ?? null }
    );
    if (!result.ok) {
      this.recordHistoricalRefresh('FAILURE');
      return { ok: false, failure: result.failure };
    }

    this.recordHistoricalRefresh('SUCCESS');
    const provenance = result.value.provenance ?? null;
    if (cacheKey !== null && provenance) {
      // The cache instant is the storage instant — never the retrieval instant re-used
      // as a stand-in, which would misreport when the observation became available here.
      this.historicalCache.set(cacheKey, result.value, this.now().toISOString(), provenance);
      this.historicalDigests.set(cacheKey, provenance.revision.contentDigest);
      this.lastHistoricalEvidence = { cacheKey, cachedAt: this.historicalCache.peek(cacheKey)?.cachedAt ?? null };
    }
    return { ok: true, result: result.value };
  }

  /**
   * The cache identity of a historical request, using the identity the governed registry
   * resolved — never a caller-supplied vendor id. `null` means the request cannot be
   * keyed, in which case nothing is cached and nothing is served from cache.
   */
  private historicalIdentity(request: HistoricalServiceRequest): string | null {
    const resolution = request.exchangeSegment
      ? request.isin
        ? this.instrumentRegistry.resolveSecurity(request.companyId, request.exchangeSegment, request.isin)
        : this.instrumentRegistry.resolveListing(request.companyId, request.exchangeSegment)
      : this.instrumentRegistry.resolve(request.companyId);
    if (resolution.status === 'UNRESOLVED') return null;
    return dhanHistoricalCacheKey({
      companyId: resolution.mapping.companyId,
      exchangeSegment: resolution.mapping.exchangeSegment,
      ...(resolution.mapping.isin ? { isin: resolution.mapping.isin } : {}),
      interval: request.interval,
      fromDate: request.fromDate,
      toDate: request.toDate,
      isAdjusted: false,
    });
  }

  /**
   * A cache hit is reported as a served observation, not as a new retrieval. The cached
   * body keeps its original `retrievalTimestamp` and gains the cache instant; it is
   * never re-stamped as if the provider had just replied.
   */
  private asCachedServed(entry: DhanHistoricalCacheEntry): DhanHistoricalNormalizationResult {
    const provenance = entry.provenance!;
    const timestamps = dhanFreshnessTimestamps({
      marketTimestamp: provenance.timestamps.marketTimestamp,
      marketTimestampDerivation: provenance.timestamps.marketTimestampDerivation,
      retrievalTimestamp: provenance.timestamps.retrievalTimestamp,
      cacheTimestamp: entry.cachedAt,
    });
    return {
      ...entry.result,
      provenance: Object.freeze({
        ...provenance,
        timestamps,
        servedFromCache: true,
        // The revision state observed when the entry was stored; a re-read is not a revision.
        revision: provenance.revision,
      }),
    };
  }

  /**
   * Records session history only. `BLOCKED` means the request never reached the provider,
   * so it is not a refresh failure and no failure detail is claimed.
   */
  private recordHistoricalRefresh(outcome: 'SUCCESS' | 'SKIPPED_FRESH' | 'FAILURE' | 'BLOCKED'): void {
    this.lastHistoricalRefresh = outcome === 'BLOCKED'
      ? { outcome: 'UNKNOWN', lastFailure: null }
      : {
          outcome,
          lastFailure: outcome === 'FAILURE' ? { code: 'REFRESH_FAILED', priorPreserved: this.historicalCache.size > 0 } : null,
        };
  }

  /**
   * Retained D02 evidence for the freshness projection, without touching LRU order or
   * invoking any provider path.
   *
   * The identity served by the most recent successful fetch is preferred, because that is
   * the observation a caller most recently asked about. If it has since been evicted, the
   * most recently stored retained observation is used instead, so a real observation is
   * not hidden by LRU churn. With nothing retained, the caller reports honestly unknown.
   */
  private historicalEvidence():
    | { projection: HistoricalFreshnessEvidence | null; lastRefresh: RefreshStatus | null; timestamps: ReturnType<typeof dhanFreshnessTimestamps> } {
    const unknownTimestamps = NO_DHAN_FRESHNESS_TIMESTAMPS;
    const evidence = this.lastHistoricalEvidence;
    if (!evidence) return { projection: null, lastRefresh: this.lastHistoricalRefresh, timestamps: unknownTimestamps };
    const tracked = this.historicalCache.peek(evidence.cacheKey);
    const entry = tracked ?? this.historicalCache.mostRecent();
    const cachedAt = tracked ? evidence.cachedAt : entry?.cachedAt ?? null;
    const projection = projectHistoricalFreshness(
      entry,
      cachedAt,
      this.now().toISOString(),
      this.tradingCalendar,
      entry?.provenance?.revision ?? null,
      this.freshnessThresholds
    );
    return {
      projection,
      lastRefresh: this.lastHistoricalRefresh,
      timestamps: projection ? projection.timestamps : unknownTimestamps,
    };
  }

  /**
   * W-23: the last store load outcome. Never inferred — a cold process that lost a corrupt
   * store and a cold process on its first ever run report different `reason`s here.
   */
  public getStateRestoreReport(): DhanStateRestoreReport {
    return this.stateRestoreReport;
  }

  /**
   * W-23: everything this process would need to come back after a restart.
   *
   * Pure read: never mutates the cache, the refresh map or the recorder, never calls the
   * provider and never touches the store. Persisting is the caller's job (`persistRetainedState`),
   * so a snapshot can be inspected in a test without writing anything.
   *
   * Entries are emitted in LRU order with an explicit `order` so a restore preserves which
   * quote would have been evicted next.
   */
  public snapshotRetainedState(): DhanPersistedState {
    const quotes = this.cache.snapshotInLruOrder().map((row, index) => ({
      key: row.key,
      envelope: row.entry,
      order: index,
    }));
    const refresh: DhanPersistedRefreshEntry[] = Array.from(this.refreshStatus.entries(), ([key, status]) => ({
      key,
      outcome: status.outcome,
      lastFailure: status.lastFailure,
    }));
    const observed = this.client.getObservedState();
    return {
      schemaVersion: DHAN_PERSISTED_STATE_SCHEMA_VERSION,
      writtenAt: this.now().toISOString(),
      quotes,
      refresh,
      observed: {
        lastSuccessAt: observed.lastSuccessAt,
        lastFailure: observed.lastFailure,
        lastAuthOutcome: observed.lastAuthOutcome,
        lastLatencyMs: observed.lastLatencyMs,
        authLatched: observed.authLatched,
        consecutiveAuthFailures: observed.consecutiveAuthFailures,
      },
    };
  }

  /**
   * W-23: snapshots and writes through the configured store.
   *
   * A store failure is REPORTED, never thrown: persistence must not be able to fail a
   * shutdown, because a daemon that cannot stop is a worse outcome than one that lost a
   * cache. The caller (the daemon) surfaces the outcome.
   */
  public persistRetainedState(): { readonly snapshot: DhanPersistedState; readonly outcome: ReturnType<DhanStateStorePort['save']> } {
    const snapshot = this.snapshotRetainedState();
    return { snapshot, outcome: this.stateStore.save(snapshot) };
  }

  /**
   * W-23: admits persisted state, fail-closed and freshness-consistent.
   *
   * Three rules, all from the W-23 contract:
   *
   *  1. **Nothing is invented.** A CORRUPT/ABSENT outcome leaves the process exactly as it
   *     would be on a first run. The parser already refused any partial payload, so by the
   *     time state is here it is whole.
   *  2. **Verdicts are recomputed, not replayed.** Each entry is classified under THIS
   *     process's clock and thresholds. A quote that was CURRENT at shutdown is STALE or
   *     UNAVAILABLE after an outage, because that is the truth now.
   *  3. **Suppressed evidence is dropped, not admitted.** An entry that has aged past
   *     suppression is counted and discarded, so the cache size never includes evidence no
   *     caller may use.
   *
   * The provenance instants are never re-stamped: `asOf` keeps its original value, so age is
   * measured from when the quote was actually observed.
   */
  private restoreRetainedState(): DhanStateRestoreReport {
    const base: DhanStateRestoreReport = {
      status: 'NO_STORE',
      reason: null,
      quotesRestored: 0,
      quotesDroppedAsUnavailable: 0,
      refreshEntriesRestored: 0,
      observedStateRestored: false,
      authLatchClearedByRestart: false,
    };
    if (this.stateStore === NOOP_DHAN_STATE_STORE) return base;

    let outcome: DhanStateLoadOutcome;
    try {
      outcome = this.stateStore.load();
    } catch {
      // A port implementation that throws is a defect, but it must not stop the boot.
      return { ...base, status: 'CORRUPT', reason: 'READ_ERROR' };
    }
    if (outcome.status === 'ABSENT') return { ...base, status: 'ABSENT' };
    if (outcome.status === 'CORRUPT') return { ...base, status: 'CORRUPT', reason: outcome.reason };

    // Re-validate: a port is untrusted input like any other boundary, even an in-process one.
    const parsed = parseDhanPersistedState(outcome.state);
    if (!parsed) return { ...base, status: 'CORRUPT', reason: 'INVALID_SHAPE' };

    const nowIso = this.now().toISOString();
    let quotesRestored = 0;
    let quotesDropped = 0;
    // Ascending `order` = least-recently-used first, so re-admission rebuilds the same LRU
    // shape and the next eviction lands where it would have.
    for (const row of [...parsed.quotes].sort((a, b) => a.order - b.order)) {
      const lookup = this.cache.classify(row.envelope, nowIso);
      // `classify` only yields MISS for an absent key, and this entry is in hand, so the
      // admission state is one of the three real classifications.
      const classification = lookup.state === 'MISS' ? 'UNAVAILABLE' : lookup.state;
      if (this.cache.restoreEntry(row.key, row.envelope, classification)) {
        quotesRestored += 1;
      } else {
        quotesDropped += 1;
      }
    }

    let refreshEntriesRestored = 0;
    for (const entry of parsed.refresh) {
      // A refresh status describes an ATTEMPT, not an observation, so it does not age out.
      this.refreshStatus.set(entry.key, { outcome: entry.outcome, lastFailure: entry.lastFailure });
      refreshEntriesRestored += 1;
    }

    let observedStateRestored = false;
    let authLatchClearedByRestart = false;
    if (parsed.observed) {
      const restored = this.client.getStateRecorder().restoreObservedState(parsed.observed);
      observedStateRestored = restored.restored;
      authLatchClearedByRestart = restored.restored && restored.priorAuthLatched;
    }

    return {
      status: 'LOADED',
      reason: null,
      quotesRestored,
      quotesDroppedAsUnavailable: quotesDropped,
      refreshEntriesRestored,
      observedStateRestored,
      authLatchClearedByRestart,
    };
  }

  /**
   * W-19 observational summary of IPD's retained historical observations.
   *
   * Observation-only: never invokes a provider, never reads credentials, never touches
   * LRU order. Deliberately NOT part of the governed `/v1/diagnostics` contract — the
   * governed wire contract is unchanged by W-19 — and it exposes no identities or
   * payloads, only counts and the retention capacity.
   */
  public getHistoricalRetentionSummary(): {
    readonly retained: number;
    readonly capacity: number;
    readonly cacheHits: number;
  } {
    return Object.freeze({
      retained: this.historicalCache.size,
      capacity: this.historicalCache.maxEntries,
      cacheHits: this.historicalCacheHits,
    });
  }

  /**
   * Pure observation-only read of the bounded W-08 in-process provider state recorder.
   * Never triggers a provider call, credential read, or state mutation.
   */
  public getObservedProviderState(): DhanProviderObservedState {
    return this.client.getObservedState();
  }

  /**
   * Separate explicit operator-initiated connection verification action (D-7 §3 / W-08).
   * Performs V1 local readiness checks and at most ONE authenticated V2 probe,
   * records its outcome in the shared W-08 recorder, and performs no automatic
   * retry, background polling, or credential re-reading.
   */
  public async verifyConnection(
    options?: VerifyProviderConnectionOptions
  ): Promise<ProviderVerificationResult> {
    const checkedAt = this.now().toISOString();
    if (!this.running) {
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: 'PROVIDER_STATUS_FAILURE',
        latencyMs: null,
        checkedAt,
        observedState: this.client.getObservedState(),
      };
    }

    const activeMapping =
      this.instrumentRegistry.list().find((m) => m.active !== false) ?? null;
    const probeInstrument = activeMapping
      ? {
          exchangeSegment: activeMapping.exchangeSegment,
          dhanSecurityId: activeMapping.dhanSecurityId,
        }
      : null;

    const result = await this.client.probeOnce(probeInstrument, {
      localOnly: options?.mode === 'LOCAL_ONLY',
      checkedAt,
      acquireProbePermit: () => this.limiter.tryAcquire(),
    });
    this.verificationProbes += result.probeCount;
    return result;
  }

  /**
   * Observational readiness/health (W-07 / W-08 / D-7).
   * Reports the last observed recorder state; NEVER initiates a provider request,
   * NEVER resolves credentials, and NEVER mutates recorder state.
   */
  public async health(): Promise<ServiceHealth> {
    const config = this.client.getConfig();
    const observed = this.client.getObservedState();
    const connectedLive =
      this.running &&
      config.readiness === 'CREDENTIAL_REFERENCES_CONFIGURED' &&
      observed.lastSuccessAt !== null &&
      observed.lastAuthOutcome === 'AUTHENTICATED' &&
      observed.lastFailure === null &&
      !observed.authLatched;

    return {
      service: this.running ? 'UP' : 'DOWN',
      providerConfiguration:
        config.readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
          ? 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
          : 'CONFIGURED',
      liveProviderConnectivity: connectedLive ? 'CONNECTED_LIVE' : 'NOT_CHECKED_PRE_ACCESS',
      providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
      contractVersion: DHAN_HEALTH_CONTRACT_VERSION,
    };
  }

  /**
   * Pure observation-only diagnostics snapshot (W-09 / D-7 §4.1 MAY list).
   * Reads existing authoritative runtime components without duplicating state,
   * resolving credentials, invoking vendor transport, or mutating any counter,
   * cache LRU order, or recorder state.
   */
  public async getDiagnostics(): Promise<ServiceDiagnostics> {
    const nowDate = this.now();
    const nowMs = nowDate.getTime();
    const nowIso = nowDate.toISOString();
    const health = await this.health();
    const config = this.client.getConfig();
    const vaultReadiness = this.client.describeVaultBackendReadiness();
    const vendorEgressMode = this.client.getVendorEgressMode();
    const observed = this.client.getObservedState();
    const counts = this.client.getStateRecorder().getInteractionCounts();
    const vendorRequestsTotal = this.client.getVendorRequestsTotal();

    // Evaluate static config metadata without reading or exposing SecretRef.keyPath (`vault://`).
    const runtimeEnv = typeof process !== 'undefined' && process.env ? process.env : {};
    let staticAnomaly:
      | 'PRODUCTION_NOT_AUTHORIZED'
      | 'CONFIGURATION_INCOMPLETE'
      | 'CREDENTIALS_EXPIRED'
      | 'UNCONFIGURED'
      | null = null;
    if (isDhanProductionEnvironment(runtimeEnv)) {
      staticAnomaly = 'PRODUCTION_NOT_AUTHORIZED';
    } else {
      for (const ref of [config.accessTokenRef, config.clientIdRef]) {
        if (!ref) continue;
        if (ref.status === 'EXPIRED' || ref.status === 'REVOKED') {
          staticAnomaly = 'CREDENTIALS_EXPIRED';
          break;
        }
        if (ref.expiresAt !== undefined) {
          const expiry = parseStrictUtcTimestamp(ref.expiresAt);
          if (!expiry.ok) {
            staticAnomaly = 'CONFIGURATION_INCOMPLETE';
            break;
          }
          if (expiry.epochMs <= nowMs) {
            staticAnomaly = 'CREDENTIALS_EXPIRED';
            break;
          }
        }
      }
      if (staticAnomaly === null && config.readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
        staticAnomaly = config.missingKeys.length === 1 ? 'CONFIGURATION_INCOMPLETE' : 'UNCONFIGURED';
      }
    }

    let credentialResolutionOutcome: DhanCredentialResolutionOutcome;
    if (
      staticAnomaly === 'PRODUCTION_NOT_AUTHORIZED' ||
      observed.lastFailure?.category === 'PRODUCTION_NOT_AUTHORIZED'
    ) {
      credentialResolutionOutcome = 'PRODUCTION_NOT_AUTHORIZED';
    } else if (
      staticAnomaly === 'CONFIGURATION_INCOMPLETE' ||
      observed.lastFailure?.category === 'CONFIGURATION_INCOMPLETE'
    ) {
      credentialResolutionOutcome = 'CONFIGURATION_INCOMPLETE';
    } else if (
      staticAnomaly === 'CREDENTIALS_EXPIRED' ||
      observed.lastAuthOutcome === 'CREDENTIALS_EXPIRED'
    ) {
      credentialResolutionOutcome = 'CREDENTIALS_EXPIRED';
    } else if (staticAnomaly === 'UNCONFIGURED') {
      credentialResolutionOutcome = 'UNCONFIGURED';
    } else if (
      !vaultReadiness.liveResolutionSupported ||
      observed.lastAuthOutcome === 'CREDENTIALS_UNAVAILABLE'
    ) {
      credentialResolutionOutcome = 'CREDENTIALS_UNAVAILABLE';
    } else if (
      counts.localReadinessVerified ||
      observed.lastAuthOutcome === 'AUTHENTICATED' ||
      observed.lastAuthOutcome === 'AUTHENTICATION_FAILURE' ||
      vendorRequestsTotal > 0
    ) {
      credentialResolutionOutcome = 'CREDENTIALS_RESOLVED';
    } else {
      credentialResolutionOutcome = 'CONFIGURED_NOT_RESOLVED';
    }

    let providerState: DhanProviderState;
    if (
      !this.running ||
      credentialResolutionOutcome === 'PRODUCTION_NOT_AUTHORIZED' ||
      credentialResolutionOutcome === 'CONFIGURATION_INCOMPLETE'
    ) {
      providerState = 'UNAVAILABLE';
    } else if (credentialResolutionOutcome === 'CREDENTIALS_EXPIRED') {
      providerState = 'EXPIRED';
    } else if (credentialResolutionOutcome === 'UNCONFIGURED') {
      providerState = 'UNCONFIGURED';
    } else if (observed.authLatched) {
      providerState = 'DEGRADED';
    } else if (observed.lastFailure !== null) {
      if (observed.lastFailure.category === 'CREDENTIALS_UNAVAILABLE') {
        providerState = vaultReadiness.liveResolutionSupported ? 'CONFIGURED' : 'UNAVAILABLE';
      } else {
        providerState = 'DEGRADED';
      }
    } else if (
      observed.lastSuccessAt !== null &&
      observed.lastAuthOutcome === 'AUTHENTICATED' &&
      health.liveProviderConnectivity === 'CONNECTED_LIVE'
    ) {
      providerState = counts.marketDataSuccesses > 0 ? 'OPERATIONAL' : 'AUTHENTICATED';
    } else if (!vaultReadiness.liveResolutionSupported) {
      providerState = 'UNAVAILABLE';
    } else if (counts.localReadinessVerified) {
      providerState = 'CREDENTIALS_RESOLVED';
    } else {
      providerState = 'CONFIGURED';
    }

    const requestCounters: DhanDiagnosticsRequestCounters = Object.freeze({
      quoteRequests: this.quoteRequests,
      quoteCacheHits: this.quoteCacheHits,
      historicalRequests: this.historicalRequests,
      verificationProbes: this.verificationProbes,
      vendorRequestsTotal,
      vendorSuccesses: counts.vendorSuccesses,
      providerFailures: counts.providerFailures,
    });

    const quoteCache = this.cache.inspectStateSummary(nowIso);
    const qualifiedMappingsLoaded = this.instrumentRegistry.list().length;

    return Object.freeze({
      contractVersion: DHAN_DIAGNOSTICS_CONTRACT_VERSION,
      service: health.service,
      providerState,
      providerConfiguration: health.providerConfiguration,
      providerReadiness: config.readiness,
      vaultBackendId: vaultReadiness.backendId,
      liveCredentialResolutionSupported: vaultReadiness.liveResolutionSupported,
      vendorEgressMode,
      credentialResolutionOutcome,
      liveProviderConnectivity: health.liveProviderConnectivity,
      providerQualification: health.providerQualification,
      lastSuccessAt: observed.lastSuccessAt,
      lastFailureCategory: observed.lastFailure?.category ?? null,
      lastFailure: observed.lastFailure,
      lastAuthOutcome: observed.lastAuthOutcome,
      lastLatencyMs: observed.lastLatencyMs,
      consecutiveAuthFailures: observed.consecutiveAuthFailures,
      authLatched: observed.authLatched,
      requestCounters,
      qualifiedMappingsLoaded,
      quoteCache,
      freshness: this.describeFreshnessConfig(),
      persistence: this.describePersistenceState(),
    });
  }

  /**
   * W-25: the effective freshness configuration.
   *
   * Built from the values resolved once at construction, so what is published is exactly
   * what the evaluator applies — not a re-read of the environment that could disagree.
   * Thresholds are configuration, never credential-adjacent, so every value is publishable.
   */
  /**
   * W-23: publish what the start-up restore did.
   *
   * `restoreReason` is a declared enum value, never a filesystem error string: those can
   * carry the path, and the path is not something this payload should echo.
   */
  private describePersistenceState(): DhanDiagnosticsPersistenceState {
    const report = this.stateRestoreReport;
    const enabled = this.stateStore !== NOOP_DHAN_STATE_STORE;
    return Object.freeze({
      enabled,
      restoreStatus: !enabled ? 'DISABLED' : report.status === 'NO_STORE' ? 'DISABLED' : report.status,
      restoreReason: report.reason,
      quotesRestored: report.quotesRestored,
      quotesDroppedAsUnavailable: report.quotesDroppedAsUnavailable,
      refreshEntriesRestored: report.refreshEntriesRestored,
      observedStateRestored: report.observedStateRestored,
      authLatchClearedByRestart: report.authLatchClearedByRestart,
    });
  }

  private describeFreshnessConfig(): DhanDiagnosticsFreshnessConfig {
    return Object.freeze({
      thresholds: Object.freeze({ ...this.freshnessThresholds }),
      overrides: Object.freeze(
        this.freshnessThresholdOverrides.map((o) => Object.freeze({ ...o }))
      ),
    });
  }
}
