/**
 * Institutional Investment Platform System (IIPS)
 * Dhan API Client Foundation (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * PRE-ACCESS NOTICE:
 *  This client is credential-READY but performs NO authentication and NO live
 *  Dhan call in this gate. Transport is injected; with the default pre-access
 *  credential resolver every request short-circuits to the deterministic
 *  CREDENTIALS_UNAVAILABLE failure before any transport invocation.
 *
 * SECURITY:
 *  - Credentials are resolved per request and never stored on the instance.
 *  - Credentials are never logged, never placed in error messages and never
 *    returned to callers. The client performs no console output at all.
 */

import {
  DhanCredentialResolver,
  DhanProviderConfig,
  DhanVaultBackendReadinessSummary,
  PreAccessDhanCredentialResolver,
  isDhanProductionEnvironment,
} from './dhan_config.js';
import {
  DhanExchangeSegment,
  DhanMarketQuoteResponseDto,
  parseDhanMarketQuoteResponse,
} from './dhan_dto.js';
import {
  DHAN_DEPTH_CAPTURE_LABEL_ENV,
  captureDhanQuoteDepth,
  claimDepthCaptureSlot,
  disarmDepthCapture,
  isDepthCaptureArmed,
  resolveDepthCapturePath,
  writeDepthCapture,
} from './dhan_depth_capture.js';
import { DhanFailureCode, DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';
import {
  DhanProviderObservedState,
  DhanProviderStateRecorder,
  ProviderVerificationResult,
} from './dhan_provider_state_recorder.js';
import { describeUtcTimestampRejection, parseStrictUtcTimestamp } from './dhan_utc_timestamp.js';

export interface DhanHttpRequest {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeoutMs: number;
}

export interface DhanHttpResponse {
  status: number;
  /** Raw response body text; parsed by the client, never by the transport. */
  bodyText: string;
}

/**
 * Injected transport seam. Keeping transport abstract is what allows the entire
 * client to be exercised deterministically without network access or credentials.
 */
export interface DhanHttpTransport {
  send(request: DhanHttpRequest): Promise<DhanHttpResponse>;
}

/** Transport error classes the client maps into deterministic failure codes. */
export class DhanTransportTimeoutError extends Error {
  constructor(message = 'Dhan transport timed out') {
    super(message);
    this.name = 'DhanTransportTimeoutError';
  }
}

export class DhanTransportUnavailableError extends Error {
  constructor(message = 'Dhan transport is unavailable') {
    super(message);
    this.name = 'DhanTransportUnavailableError';
  }
}

export class DhanProductionNotAuthorizedError extends Error {
  constructor(message = 'Production Dhan egress and credentials are not authorized') {
    super(message);
    this.name = 'DhanProductionNotAuthorizedError';
  }
}

/**
 * Default transport for the pre-access gate.
 * It never opens a socket: it fails closed with TRANSPORT_FAILURE semantics so
 * that no accidental live Dhan call can originate from this gate.
 */
export class PreAccessNoNetworkTransport implements DhanHttpTransport {
  public async send(): Promise<DhanHttpResponse> {
    throw new DhanTransportUnavailableError(
      'Live Dhan transport is disabled in the pre-access gate; inject a transport to execute requests.'
    );
  }
}

export interface DhanQuoteRequestInstrument {
  exchangeSegment: DhanExchangeSegment;
  dhanSecurityId: string;
}

export const DHAN_MARKET_QUOTE_PATH = '/marketfeed/quote';

export type DhanVendorEgressMode =
  | 'DISABLED_PRE_ACCESS'
  | 'IPD_SERVER_HTTPS'
  | 'SYNTHETIC_INJECTED';

export const CUSTOM_INJECTED_VAULT_BACKEND_ID = 'CUSTOM_INJECTED_RESOLVER';
export const UNKNOWN_VAULT_BACKEND_ID = 'UNKNOWN_VAULT_BACKEND';

const GOVERNED_VAULT_BACKEND_ID_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

/**
 * Enforces D-7 §4.1/§4.2 non-locating backend identifier format by construction.
 * Any string containing path separators, URI schemes, punctuation, whitespace,
 * or non-governed characters is coerced fail-closed to `UNKNOWN_VAULT_BACKEND`.
 */
export function sanitizeVaultBackendId(candidate: unknown): string {
  if (typeof candidate === 'string' && GOVERNED_VAULT_BACKEND_ID_PATTERN.test(candidate)) {
    return candidate;
  }
  return UNKNOWN_VAULT_BACKEND_ID;
}

export interface DhanApiClientOptions {
  config: DhanProviderConfig;
  transport?: DhanHttpTransport;
  credentialResolver?: DhanCredentialResolver;
  /** Injected clock for deterministic latency measurement in tests. */
  now?: () => number;
  /** Optional shared W-08 in-process observed state recorder. */
  stateRecorder?: DhanProviderStateRecorder;
}

export interface DhanExecuteOptions {
  /**
   * Internal composition hook allowing higher-level adapters (quote / historical)
   * to complete vendor payload validation before recording a successful interaction.
   */
  readonly deferSuccessRecording?: boolean;
}

export interface DhanProbeOnceOptions {
  readonly localOnly?: boolean;
  readonly checkedAt?: string;
  readonly acquireProbePermit?: () => boolean;
}

export interface DhanApiCallMetrics {
  latencyMs: number;
  httpStatus?: number;
}

export interface DhanQuoteCallOutcome {
  dto: DhanMarketQuoteResponseDto;
  metrics: DhanApiCallMetrics;
}

/**
 * Deterministic, credential-ready Dhan HTTP client.
 */
export class DhanApiClient {
  private readonly config: DhanProviderConfig;
  private readonly transport: DhanHttpTransport;
  private readonly credentialResolver: DhanCredentialResolver;
  private readonly now: () => number;
  private readonly stateRecorder: DhanProviderStateRecorder;
  private vendorRequestsTotal = 0;

  constructor(options: DhanApiClientOptions) {
    this.config = options.config;
    this.transport = options.transport ?? new PreAccessNoNetworkTransport();
    this.credentialResolver = options.credentialResolver ?? new PreAccessDhanCredentialResolver();
    this.now = options.now ?? (() => Date.now());
    this.stateRecorder =
      options.stateRecorder ?? new DhanProviderStateRecorder({ now: this.now });
  }

  public getConfig(): DhanProviderConfig {
    return this.config;
  }

  /** Shared W-08 in-process observed state recorder. */
  public getStateRecorder(): DhanProviderStateRecorder {
    return this.stateRecorder;
  }

  /** Observation-only snapshot of recorded provider state; never triggers I/O or mutates state. */
  public getObservedState(): DhanProviderObservedState {
    return this.stateRecorder.snapshot();
  }

  /**
   * Pure observation-only read of the vault backend identifier and readiness (W-09 / D-7 §4.1).
   * Never resolves secrets, touches carriers, or spawns child processes.
   */
  public describeVaultBackendReadiness(): DhanVaultBackendReadinessSummary {
    if (typeof this.credentialResolver.describeBackendReadiness === 'function') {
      try {
        const described = this.credentialResolver.describeBackendReadiness();
        return Object.freeze({
          backendId: sanitizeVaultBackendId(described?.backendId),
          liveResolutionSupported: described?.liveResolutionSupported === true,
        });
      } catch {
        return Object.freeze({
          backendId: UNKNOWN_VAULT_BACKEND_ID,
          liveResolutionSupported: false,
        });
      }
    }
    return Object.freeze({
      backendId: CUSTOM_INJECTED_VAULT_BACKEND_ID,
      liveResolutionSupported: this.config.readiness === 'CREDENTIAL_REFERENCES_CONFIGURED',
    });
  }

  /** Pure observation-only classification of configured outbound vendor transport mode (D-7 §4.1). */
  public getVendorEgressMode(): DhanVendorEgressMode {
    if (this.transport instanceof PreAccessNoNetworkTransport) {
      return 'DISABLED_PRE_ACCESS';
    }
    if (this.transport.constructor?.name === 'DhanServerHttpsTransport') {
      return 'IPD_SERVER_HTTPS';
    }
    return 'SYNTHETIC_INJECTED';
  }

  /** Total outbound vendor transport invocations attempted in this process lifetime. */
  public getVendorRequestsTotal(): number {
    return this.vendorRequestsTotal;
  }

  public nowIso(): string {
    return new Date(this.now()).toISOString();
  }

  /**
   * Keep registry identifiers as strings; serialize cash-equity IDs as JSON integers at the
   * vendor boundary. Reject non-canonical or unsafe values instead of rounding or guessing.
   */
  public static buildQuoteRequestBody(instruments: readonly DhanQuoteRequestInstrument[]): string {
    const grouped: Partial<Record<DhanExchangeSegment, number[]>> = {};
    for (const instrument of instruments) {
      const id = instrument.dhanSecurityId;
      if (typeof id !== 'string' || !/^[1-9][0-9]*$/.test(id)) {
        throw new TypeError('Dhan quote security ID must be a positive decimal integer');
      }
      const numericId = Number(id);
      if (!Number.isSafeInteger(numericId)) {
        throw new TypeError('Dhan quote security ID exceeds the safe integer range');
      }
      const bucket = grouped[instrument.exchangeSegment] ?? (grouped[instrument.exchangeSegment] = []);
      if (!bucket.includes(numericId)) bucket.push(numericId);
    }
    return JSON.stringify(grouped);
  }

  /**
   * Fetches market quotes for the supplied instruments.
   * Returns a deterministic result; never throws for expected failure modes.
   */
  public async fetchMarketQuotes(
    instruments: readonly DhanQuoteRequestInstrument[],
    options?: DhanExecuteOptions
  ): Promise<DhanResult<DhanQuoteCallOutcome>> {
    if (instruments.length === 0) {
      return dhanFailure('MISSING_REQUIRED_FIELD', 'At least one instrument is required for a Dhan quote request', {
        field: 'instruments',
      });
    }

    let body: string;
    try {
      body = DhanApiClient.buildQuoteRequestBody(instruments);
    } catch {
      return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'Dhan quote security ID is not a valid safe positive integer');
    }
    const call = await this.executeJsonPost(DHAN_MARKET_QUOTE_PATH, body, { deferSuccessRecording: true });
    if (!call.ok) return call;

    const parsed = parseDhanMarketQuoteResponse(call.value.json);
    if (!parsed.ok) {
      this.stateRecorder.recordFailure({
        category: parsed.failure.code,
        at: this.nowIso(),
        latencyMs: call.value.metrics.latencyMs,
      });
      return {
        ok: false,
        failure: { ...parsed.failure, httpStatus: call.value.metrics.httpStatus },
      };
    }

    if (!options?.deferSuccessRecording) {
      this.stateRecorder.recordSuccess({
        at: this.nowIso(),
        latencyMs: call.value.metrics.latencyMs,
      });
    }

    return dhanOk({ dto: parsed.value, metrics: call.value.metrics });
  }

  /**
   * Resolves and locally validates Dhan credentials once (D-2 / D-7 V1).
   * Performs zero network calls and never retains or echoes credential material.
   */
  private async resolveReadyCredentials(
    nowMs: number
  ): Promise<DhanResult<{ accessToken: string; clientId: string; expiresAt?: string }>> {
    const runtimeEnv = typeof process !== 'undefined' && process.env ? process.env : {};
    if (isDhanProductionEnvironment(runtimeEnv)) {
      return dhanFailure(
        'PRODUCTION_NOT_AUTHORIZED',
        'Production Dhan credentials and vendor egress are not authorized'
      );
    }

    for (const ref of [this.config.accessTokenRef, this.config.clientIdRef]) {
      if (!ref) continue;
      if (ref.status === 'EXPIRED' || ref.status === 'REVOKED') {
        return dhanFailure('CREDENTIALS_EXPIRED', 'Dhan credential reference is expired or revoked');
      }
      if (ref.expiresAt !== undefined) {
        // Strict UTC: a zone-less value is refused rather than read as host-local time (W-06).
        const expiry = parseStrictUtcTimestamp(ref.expiresAt);
        if (!expiry.ok) {
          return dhanFailure(
            'CONFIGURATION_INCOMPLETE',
            `Dhan SecretRef expiresAt ${describeUtcTimestampRejection(expiry.reason)}`
          );
        }
        if (expiry.epochMs <= nowMs) {
          return dhanFailure('CREDENTIALS_EXPIRED', 'Dhan credential reference has expired');
        }
      }
    }

    let credentials;
    try {
      credentials = await this.credentialResolver.resolve(this.config);
    } catch (err: unknown) {
      if (err instanceof DhanProductionNotAuthorizedError) {
        return dhanFailure('PRODUCTION_NOT_AUTHORIZED', 'Production Dhan credentials are not authorized');
      }
      const candidate = err as { reason?: unknown; code?: unknown } | null;
      if (
        candidate?.reason === 'EXPIRED' ||
        candidate?.reason === 'REVOKED' ||
        candidate?.code === 'CREDENTIALS_EXPIRED'
      ) {
        return dhanFailure('CREDENTIALS_EXPIRED', 'Dhan credentials are expired or revoked');
      }
      if (candidate?.code === 'PRODUCTION_NOT_AUTHORIZED') {
        return dhanFailure('PRODUCTION_NOT_AUTHORIZED', 'Production Dhan credentials are not authorized');
      }
      if (candidate?.code === 'CONFIGURATION_INCOMPLETE') {
        return dhanFailure('CONFIGURATION_INCOMPLETE', 'Dhan credential configuration is invalid or incomplete');
      }
      // Credential resolution internals are deliberately not echoed.
      return dhanFailure('CREDENTIALS_UNAVAILABLE', 'Dhan credential resolution failed closed');
    }

    if (!credentials || !credentials.accessToken || !credentials.clientId) {
      return dhanFailure(
        'CREDENTIALS_UNAVAILABLE',
        'Dhan credentials are not available; provider is operating in pre-access mode'
      );
    }

    if (credentials.expiresAt !== undefined) {
      // A malformed expiry stays CREDENTIALS_EXPIRED here (pre-existing behaviour): the resolver has
      // already rejected unusable metadata above, so this guard enforces the token's own deadline.
      const expiry = parseStrictUtcTimestamp(credentials.expiresAt);
      if (!expiry.ok || expiry.epochMs <= nowMs) {
        return dhanFailure('CREDENTIALS_EXPIRED', 'Resolved Dhan access token has expired');
      }
    }

    return dhanOk(credentials);
  }

  /**
   * DHAN-D2 / W-08: shared credential-ready POST execution used by every Dhan endpoint.
   * Performs auth-latch enforcement, credential resolution, header injection, timeout,
   * HTTP status mapping, JSON decoding, and W-08 state recording.
   */
  public async executeJsonPost(
    pathSuffix: string,
    body: string,
    options?: DhanExecuteOptions
  ): Promise<DhanResult<{ json: unknown; metrics: DhanApiCallMetrics }>> {
    // D-2 / D-7 §2.2–§2.3: latched auth failure blocks further credential reads and vendor calls
    // until operator intervention and restart.
    if (this.stateRecorder.isAuthLatched()) {
      return dhanFailure(
        'AUTHENTICATION_FAILURE',
        'Dhan authentication is latched after repeated rejections; operator intervention and restart required'
      );
    }

    const nowMs = this.now();
    const resolved = await this.resolveReadyCredentials(nowMs);
    if (!resolved.ok) {
      this.stateRecorder.recordFailure({
        category: resolved.failure.code,
        at: new Date(nowMs).toISOString(),
      });
      return resolved;
    }

    const credentials = resolved.value;
    const request: DhanHttpRequest = {
      method: 'POST',
      url: `${this.config.baseUrl}${pathSuffix}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      // Credential headers are constructed per request and discarded with it.
        'access-token': credentials.accessToken,
        'client-id': credentials.clientId,
      },
      body,
      timeoutMs: this.config.timeoutMs,
    };

    const startedAt = this.now();
    let response: DhanHttpResponse;
    try {
      if (!(this.transport instanceof PreAccessNoNetworkTransport)) {
        this.vendorRequestsTotal += 1;
      }
      response = await this.withTimeout(this.transport.send(request), this.config.timeoutMs);
    } catch (err: unknown) {
      const finishedAt = this.now();
      const latencyMs = Math.max(0, finishedAt - startedAt);
      const at = new Date(finishedAt).toISOString();
      if (err instanceof DhanProductionNotAuthorizedError) {
        this.stateRecorder.recordFailure({ category: 'PRODUCTION_NOT_AUTHORIZED', at });
        return dhanFailure('PRODUCTION_NOT_AUTHORIZED', 'Production Dhan vendor egress is not authorized');
      }
      if (err instanceof DhanTransportTimeoutError) {
        this.stateRecorder.recordFailure({ category: 'TIMEOUT', at, latencyMs });
        return dhanFailure('TIMEOUT', `Dhan request exceeded the configured timeout of ${this.config.timeoutMs}ms`);
      }
      if (err instanceof DhanTransportUnavailableError) {
        const recordLatency = this.transport instanceof PreAccessNoNetworkTransport ? undefined : latencyMs;
        this.stateRecorder.recordFailure({
          category: 'TRANSPORT_FAILURE',
          at,
          ...(recordLatency !== undefined ? { latencyMs: recordLatency } : {}),
        });
        return dhanFailure('TRANSPORT_FAILURE', 'Dhan transport is unavailable');
      }
      this.stateRecorder.recordFailure({ category: 'TRANSPORT_FAILURE', at, latencyMs });
      return dhanFailure('TRANSPORT_FAILURE', 'Dhan transport failed before a response was received');
    }

    const finishedAt = this.now();
    const latencyMs = Math.max(0, finishedAt - startedAt);
    const at = new Date(finishedAt).toISOString();
    const statusFailure = DhanApiClient.mapHttpStatus(response.status);
    if (statusFailure) {
      this.stateRecorder.recordFailure({
        category: statusFailure.failure.code,
        at,
        latencyMs,
      });
      return statusFailure;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.bodyText);
    } catch {
      this.stateRecorder.recordFailure({
        category: 'MALFORMED_RESPONSE',
        at,
        latencyMs,
      });
      return dhanFailure('MALFORMED_RESPONSE', 'Dhan response body is not valid JSON', {
        httpStatus: response.status,
      });
    }

    // TEMPORARY DIAGNOSTIC (D-18 evidence capture). Off unless explicitly
    // configured. Purely observational: the parsed body is passed by reference and
    // never mutated, the return value is discarded, and every failure inside the
    // capture is swallowed so it cannot change this call's outcome. Normalisation
    // and D-5 validation are untouched.
    this.captureRawDepthIfEnabled(pathSuffix, parsedJson, response.status);

    if (!options?.deferSuccessRecording) {
      this.stateRecorder.recordSuccess({ at, latencyMs });
    }

    return dhanOk({ json: parsedJson, metrics: { latencyMs, httpStatus: response.status } });
  }

  /**
   * TEMPORARY DIAGNOSTIC — writes the original `depth` block of one quote
   * response when `IIPS_DHAN_DEPTH_CAPTURE_PATH` is set. Applies to the market
   * quote endpoint only. Never throws and never affects the caller.
   */
  private captureRawDepthIfEnabled(pathSuffix: string, parsedJson: unknown, httpStatus: number): void {
    if (pathSuffix !== DHAN_MARKET_QUOTE_PATH) return;
    try {
      const runtimeEnv = typeof process !== 'undefined' && process.env ? process.env : {};
      const targetPath = resolveDepthCapturePath(runtimeEnv);
      if (!targetPath) return;

      // Arming gate: capture only when the sibling `.arm` marker exists. The
      // marker is how one-shot is armed/re-armed without an env change (which a
      // running daemon cannot observe) and without a restart.
      if (!isDepthCaptureArmed(targetPath)) return;

      // One-shot: claim the single slot before writing. A second matching quote
      // in the same process can never overwrite the captured evidence.
      if (!claimDepthCaptureSlot(targetPath)) return;

      const document = captureDhanQuoteDepth(parsedJson, {
        httpStatus,
        label: runtimeEnv[DHAN_DEPTH_CAPTURE_LABEL_ENV] ?? null,
        capturedAtUtc: new Date(this.now()).toISOString(),
      });

      if (writeDepthCapture(targetPath, document) === undefined) return;

      // Captured: disarm so the next quote needs an explicit re-arm.
      disarmDepthCapture(targetPath);
    } catch {
      // Diagnostics must never affect quote processing.
    }
  }

  /**
   * D-7 §3 / W-08 single-shot operator verification probe (V1 local check + at most one V2 probe).
   * - Never retries, never loops, never polls, and resolves credentials at most once.
   * - Records V1 expiry and all V2 outcomes in the shared `DhanProviderStateRecorder`.
   */
  public async probeOnce(
    probeInstrument: DhanQuoteRequestInstrument | null,
    options?: DhanProbeOnceOptions
  ): Promise<ProviderVerificationResult> {
    const nowMs = this.now();
    const checkedAt = options?.checkedAt ?? new Date(nowMs).toISOString();

    if (this.stateRecorder.isAuthLatched()) {
      return {
        outcome: 'AUTH_REJECTED',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: 'AUTHENTICATION_FAILURE',
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    // V1 static readiness check before invoking credential resolver.
    if (this.config.readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: 'CREDENTIALS_UNAVAILABLE',
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    // V1 local credential check (single resolution, zero re-reads).
    const resolved = await this.resolveReadyCredentials(nowMs);
    if (!resolved.ok) {
      if (resolved.failure.code === 'CREDENTIALS_EXPIRED') {
        const observedState = this.stateRecorder.recordFailure({
          category: 'CREDENTIALS_EXPIRED',
          at: checkedAt,
        });
        return {
          outcome: 'EXPIRED_LOCAL',
          probeAttempted: false,
          probeCount: 0,
          failureCategory: 'CREDENTIALS_EXPIRED',
          latencyMs: null,
          checkedAt,
          observedState,
        };
      }
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: resolved.failure.code,
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    if (options?.localOnly === true || probeInstrument === null) {
      this.stateRecorder.recordLocalReadinessVerified();
      return {
        outcome: 'VERIFIED_LOCAL_ONLY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: null,
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    if (this.transport instanceof PreAccessNoNetworkTransport) {
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: 'TRANSPORT_FAILURE',
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    let body: string;
    try {
      body = DhanApiClient.buildQuoteRequestBody([probeInstrument]);
    } catch {
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY', probeAttempted: false, probeCount: 0,
        failureCategory: 'MALFORMED_INSTRUMENT_MAPPING', latencyMs: null, checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    if (options?.acquireProbePermit && !options.acquireProbePermit()) {
      return {
        outcome: 'NOT_ATTEMPTED_NOT_READY',
        probeAttempted: false,
        probeCount: 0,
        failureCategory: 'RATE_LIMITED',
        latencyMs: null,
        checkedAt,
        observedState: this.stateRecorder.snapshot(),
      };
    }

    // V2: single bounded authenticated probe using the already-resolved credentials (zero re-reads, zero retries).
    const credentials = resolved.value;
    const request: DhanHttpRequest = {
      method: 'POST',
      url: `${this.config.baseUrl}${DHAN_MARKET_QUOTE_PATH}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'access-token': credentials.accessToken,
        'client-id': credentials.clientId,
      },
      body,
      timeoutMs: this.config.timeoutMs,
    };

    const startedAt = this.now();
    let response: DhanHttpResponse;
    try {
      this.vendorRequestsTotal += 1;
      response = await this.withTimeout(this.transport.send(request), this.config.timeoutMs);
    } catch (err: unknown) {
      const finishedAt = this.now();
      const latencyMs = Math.max(0, finishedAt - startedAt);
      const at = new Date(finishedAt).toISOString();
      if (err instanceof DhanProductionNotAuthorizedError) {
        const observedState = this.stateRecorder.recordFailure({
          category: 'PRODUCTION_NOT_AUTHORIZED',
          at,
        });
        return {
          outcome: 'NOT_ATTEMPTED_NOT_READY',
          probeAttempted: false,
          probeCount: 0,
          failureCategory: 'PRODUCTION_NOT_AUTHORIZED',
          latencyMs: null,
          checkedAt: at,
          observedState,
        };
      }
      const category: DhanFailureCode =
        err instanceof DhanTransportTimeoutError ? 'TIMEOUT' : 'TRANSPORT_FAILURE';
      const observedState = this.stateRecorder.recordFailure({ category, at, latencyMs });
      return {
        outcome: 'FAILED_TRANSPORT',
        probeAttempted: true,
        probeCount: 1,
        failureCategory: category,
        latencyMs,
        checkedAt: at,
        observedState,
      };
    }

    const finishedAt = this.now();
    const latencyMs = Math.max(0, finishedAt - startedAt);
    const at = new Date(finishedAt).toISOString();
    const statusFailure = DhanApiClient.mapHttpStatus(response.status);
    if (statusFailure) {
      const category = statusFailure.failure.code;
      const observedState = this.stateRecorder.recordFailure({ category, at, latencyMs });
      const outcome =
        category === 'AUTHENTICATION_FAILURE'
          ? 'AUTH_REJECTED'
          : category === 'TIMEOUT'
            ? 'FAILED_TRANSPORT'
            : 'FAILED_VENDOR_RESPONSE';
      return {
        outcome,
        probeAttempted: true,
        probeCount: 1,
        failureCategory: category,
        latencyMs,
        checkedAt: at,
        observedState,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.bodyText);
    } catch {
      const observedState = this.stateRecorder.recordFailure({
        category: 'MALFORMED_RESPONSE',
        at,
        latencyMs,
      });
      return {
        outcome: 'FAILED_VENDOR_RESPONSE',
        probeAttempted: true,
        probeCount: 1,
        failureCategory: 'MALFORMED_RESPONSE',
        latencyMs,
        checkedAt: at,
        observedState,
      };
    }

    const parsedQuote = parseDhanMarketQuoteResponse(parsedJson);
    if (!parsedQuote.ok) {
      const category = parsedQuote.failure.code;
      const observedState = this.stateRecorder.recordFailure({ category, at, latencyMs });
      return {
        outcome: 'FAILED_VENDOR_RESPONSE',
        probeAttempted: true,
        probeCount: 1,
        failureCategory: category,
        latencyMs,
        checkedAt: at,
        observedState,
      };
    }

    const observedState = this.stateRecorder.recordSuccess({
      at,
      latencyMs,
      kind: 'VERIFICATION_PROBE',
    });
    return {
      outcome: 'VERIFIED_VENDOR_ACCEPTED',
      probeAttempted: true,
      probeCount: 1,
      failureCategory: null,
      latencyMs,
      checkedAt: at,
      observedState,
    };
  }

  /**
   * Maps an HTTP status to a deterministic failure, or null when the call succeeded.
   * Error bodies are never echoed back, preventing credential reflection.
   */
  public static mapHttpStatus(status: number): { ok: false; failure: import('./dhan_failures.js').DhanFailure } | null {
    if (status >= 200 && status < 300) return null;
    if (status === 401 || status === 403) {
      return dhanFailure('AUTHENTICATION_FAILURE', 'Dhan rejected the request credentials', { httpStatus: status });
    }
    if (status === 408 || status === 504) {
      return dhanFailure('TIMEOUT', 'Dhan reported a request timeout', { httpStatus: status });
    }
    if (status === 429) {
      return dhanFailure('RATE_LIMITED', 'Dhan rate limit exceeded', { httpStatus: status });
    }
    return dhanFailure('HTTP_ERROR', `Dhan returned a non-success HTTP status (${status})`, { httpStatus: status });
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new DhanTransportTimeoutError()), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => {
      if (timer) clearTimeout(timer);
    }) as Promise<T>;
  }
}
