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
  PreAccessDhanCredentialResolver,
} from './dhan_config.js';
import {
  DhanExchangeSegment,
  DhanMarketQuoteResponseDto,
  parseDhanMarketQuoteResponse,
} from './dhan_dto.js';
import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';

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

export interface DhanApiClientOptions {
  config: DhanProviderConfig;
  transport?: DhanHttpTransport;
  credentialResolver?: DhanCredentialResolver;
  /** Injected clock for deterministic latency measurement in tests. */
  now?: () => number;
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

  constructor(options: DhanApiClientOptions) {
    this.config = options.config;
    this.transport = options.transport ?? new PreAccessNoNetworkTransport();
    this.credentialResolver = options.credentialResolver ?? new PreAccessDhanCredentialResolver();
    this.now = options.now ?? (() => Date.now());
  }

  public getConfig(): DhanProviderConfig {
    return this.config;
  }

  /**
   * Builds the Dhan market-quote request body:
   *   { "NSE_EQ": ["<securityId>", ...], ... }
   */
  public static buildQuoteRequestBody(instruments: readonly DhanQuoteRequestInstrument[]): string {
    const grouped: Record<string, string[]> = {};
    for (const instrument of instruments) {
      const bucket = grouped[instrument.exchangeSegment] || (grouped[instrument.exchangeSegment] = []);
      if (!bucket.includes(instrument.dhanSecurityId)) bucket.push(instrument.dhanSecurityId);
    }
    return JSON.stringify(grouped);
  }

  /**
   * Fetches market quotes for the supplied instruments.
   * Returns a deterministic result; never throws for expected failure modes.
   */
  public async fetchMarketQuotes(
    instruments: readonly DhanQuoteRequestInstrument[]
  ): Promise<DhanResult<DhanQuoteCallOutcome>> {
    if (instruments.length === 0) {
      return dhanFailure('MISSING_REQUIRED_FIELD', 'At least one instrument is required for a Dhan quote request', {
        field: 'instruments',
      });
    }

    const call = await this.executeJsonPost(
      DHAN_MARKET_QUOTE_PATH,
      DhanApiClient.buildQuoteRequestBody(instruments)
    );
    if (!call.ok) return call;

    const parsed = parseDhanMarketQuoteResponse(call.value.json);
    if (!parsed.ok) {
      return {
        ok: false,
        failure: { ...parsed.failure, httpStatus: call.value.metrics.httpStatus },
      };
    }

    return dhanOk({ dto: parsed.value, metrics: call.value.metrics });
  }

  /**
   * DHAN-D2: shared credential-ready POST execution used by every Dhan endpoint.
   * Performs credential resolution, header injection, timeout, HTTP status mapping and
   * JSON decoding. Endpoint-specific structural validation happens in the callers.
   */
  public async executeJsonPost(
    pathSuffix: string,
    body: string
  ): Promise<DhanResult<{ json: unknown; metrics: DhanApiCallMetrics }>> {
    let credentials;
    try {
      credentials = await this.credentialResolver.resolve(this.config);
    } catch {
      // Credential resolution internals are deliberately not echoed.
      return dhanFailure('CREDENTIALS_UNAVAILABLE', 'Dhan credential resolution failed closed');
    }

    if (!credentials || !credentials.accessToken || !credentials.clientId) {
      return dhanFailure(
        'CREDENTIALS_UNAVAILABLE',
        'Dhan credentials are not available; provider is operating in pre-access mode'
      );
    }

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
      response = await this.withTimeout(this.transport.send(request), this.config.timeoutMs);
    } catch (err: unknown) {
      const latencyMs = Math.max(0, this.now() - startedAt);
      if (err instanceof DhanTransportTimeoutError) {
        return dhanFailure('TIMEOUT', `Dhan request exceeded the configured timeout of ${this.config.timeoutMs}ms`);
      }
      if (err instanceof DhanTransportUnavailableError) {
        return dhanFailure('TRANSPORT_FAILURE', 'Dhan transport is unavailable');
      }
      void latencyMs;
      return dhanFailure('TRANSPORT_FAILURE', 'Dhan transport failed before a response was received');
    }

    const latencyMs = Math.max(0, this.now() - startedAt);
    const statusFailure = DhanApiClient.mapHttpStatus(response.status);
    if (statusFailure) return statusFailure;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.bodyText);
    } catch {
      return dhanFailure('MALFORMED_RESPONSE', 'Dhan response body is not valid JSON', {
        httpStatus: response.status,
      });
    }

    return dhanOk({ json: parsedJson, metrics: { latencyMs, httpStatus: response.status } });
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
