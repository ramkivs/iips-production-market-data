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
import { isD114SecurityIdentity, type D114SecurityIdentity } from '../../contracts/types.js';
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
  DhanRateLimiter,
  DhanRefreshOrchestrator,
  DhanRequestCoalescer,
  DhanSecurityScope,
  dhanQuoteCacheKey,
  type DhanAggregateCacheState,
  type DhanQuoteCacheDiagnostics,
} from './dhan_operational_controls.js';

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

export const DHAN_DIAGNOSTICS_CONTRACT_VERSION = 1 as const;
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

export interface DhanMarketDataServiceOptions {
  client: DhanApiClient;
  securityMaster: SecurityMaster;
  instrumentRegistry: DhanInstrumentRegistry;
  cache?: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  limiter?: DhanRateLimiter;
  concurrency?: DhanConcurrencyLimiter;
  coalescer?: DhanRequestCoalescer;
  now?: () => Date;
}

/**
 * Composed IPD-owned market-data service. Consumers (e.g. IRR backend) call
 * this service or its transport — they never construct Dhan primitives.
 */
export class DhanMarketDataService {
  private readonly source: DhanMarketDataSource;
  private readonly historical: DhanHistoricalAdapter;
  private readonly resolution: DhanInstrumentResolutionService;
  private readonly instrumentRegistry: DhanInstrumentRegistry;
  private readonly orchestrator: DhanRefreshOrchestrator;
  private readonly cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  private readonly limiter: DhanRateLimiter;
  private readonly client: DhanApiClient;
  private readonly now: () => Date;
  // Bounded diagnostic history, separate from observation cache; never affects execution.
  private readonly refreshStatus = new Map<string, RefreshStatus>();
  private quoteRequests = 0;
  private quoteCacheHits = 0;
  private historicalRequests = 0;
  private verificationProbes = 0;
  private running = false;

  constructor(options: DhanMarketDataServiceOptions) {
    this.client = options.client;
    this.instrumentRegistry = options.instrumentRegistry;
    this.now = options.now ?? (() => new Date());
    this.source = new DhanMarketDataSource({
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
      now: this.now,
    });
    this.historical = new DhanHistoricalAdapter({
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
    });
    this.resolution = new DhanInstrumentResolutionService(options.securityMaster, options.instrumentRegistry);
    this.cache = options.cache ?? new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(256);
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
    // The composed D02 adapter does not use DhanHistoricalCache or the refresh orchestrator.
    if (request.domain === 'D02_OHLCV') return freshnessStatus(request.domain, null, evaluatedAt, unknown);
    const scope: DhanSecurityScope = { companyId: request.companyId, exchangeSegment: request.exchangeSegment, isin: request.securityIdentity.isin, series: request.securityIdentity.series };
    const key = dhanQuoteCacheKey(scope);
    return freshnessStatus(request.domain, this.cache.peek(key, evaluatedAt), evaluatedAt, this.refreshStatus.get(key) ?? unknown);
  }

  /** Canonical historical request through the existing D02 adapter path. */
  public async getHistorical(request: HistoricalServiceRequest): Promise<HistoricalResponse> {
    this.historicalRequests += 1;
    if (!this.running) return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'service not started').failure };
    if (!this.limiter.tryAcquire()) {
      return { ok: false, failure: dhanFailure('RATE_LIMITED', 'provider request budget exhausted').failure };
    }
    const result = await this.historical.fetchDailyCandles(request);
    if (result.ok) return { ok: true, result: result.value };
    return { ok: false, failure: result.failure };
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
    });
  }
}
