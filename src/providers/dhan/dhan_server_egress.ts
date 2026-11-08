/**
 * Institutional Investment Platform System (IIPS)
 * IPD-Owned Non-Production Server-Side Dhan HTTPS Egress Transport (Stage 1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 *
 * OWNERSHIP & ISOLATION POLICY:
 *  - Exclusively owned by IPD server-side code.
 *  - Deliberately NOT exported from `iips-production-market-data/dhan-server`
 *    (`src/providers/dhan/package.ts`) and NEVER included in browser closures:
 *    external consumers (IRR) may only consume `MarketDataTransportClient` and
 *    must never instantiate Dhan vendor egress transports.
 *  - NOT the default transport on `DhanApiClient` (`PreAccessNoNetworkTransport`
 *    remains the unconditional default).
 *  - Restricted strictly to local, single-user, non-production execution;
 *    production mode is refused fail-closed before any socket is opened.
 *  - Enforces HTTPS-only, origin-pinned egress, intact TLS certificate
 *    verification (`NODE_TLS_REJECT_UNAUTHORIZED !== '0'`), `redirect: 'error'`
 *    (preventing credential header forwarding across redirects), and bounded
 *    request timeouts.
 */

import {
  DHAN_DEFAULT_BASE_URL,
  DhanEnvSource,
  isDhanProductionEnvironment,
} from './dhan_config.js';
import {
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  DhanProductionNotAuthorizedError,
  DhanTransportTimeoutError,
  DhanTransportUnavailableError,
} from './dhan_api_client.js';

export interface DhanServerHttpsTransportOptions {
  /** Allowed HTTPS base URL (origin + path prefix); defaults to DHAN_DEFAULT_BASE_URL. */
  readonly allowedBaseUrl?: string;
  /** Optional injected fetch implementation for deterministic unit verification. */
  readonly fetchImpl?: typeof fetch;
  /** Optional environment map override (defaults to process.env). */
  readonly env?: DhanEnvSource;
}

export class DhanServerHttpsTransport implements DhanHttpTransport {
  private readonly allowedBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly envOverride?: DhanEnvSource;

  constructor(options: DhanServerHttpsTransportOptions = {}) {
    this.allowedBaseUrl = (options.allowedBaseUrl ?? DHAN_DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (options.env !== undefined) {
      this.envOverride = options.env;
    }
  }

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    const env: DhanEnvSource =
      this.envOverride ?? (typeof process !== 'undefined' && process.env ? process.env : {});

    if (isDhanProductionEnvironment(env)) {
      throw new DhanProductionNotAuthorizedError(
        'Production Dhan vendor egress is not authorized; Stage 1 is restricted to local non-production execution'
      );
    }

    if (env['NODE_TLS_REJECT_UNAUTHORIZED']?.trim() === '0') {
      throw new DhanTransportUnavailableError(
        'TLS certificate verification is disabled (NODE_TLS_REJECT_UNAUTHORIZED=0); refusing Dhan vendor egress'
      );
    }

    let allowedUrl: URL;
    let targetUrl: URL;
    try {
      allowedUrl = new URL(this.allowedBaseUrl);
      targetUrl = new URL(request.url);
    } catch {
      throw new DhanTransportUnavailableError('Dhan vendor egress URL is malformed');
    }

    if (allowedUrl.protocol !== 'https:' || targetUrl.protocol !== 'https:') {
      throw new DhanTransportUnavailableError('Dhan vendor egress requires HTTPS');
    }

    if (targetUrl.username || targetUrl.password || targetUrl.search) {
      throw new DhanTransportUnavailableError(
        'Dhan vendor egress URL must not carry embedded credentials or query strings'
      );
    }

    const allowedPathPrefix = allowedUrl.pathname.replace(/\/+$/, '');
    if (
      targetUrl.origin !== allowedUrl.origin ||
      (allowedPathPrefix !== '' &&
        targetUrl.pathname !== allowedPathPrefix &&
        !targetUrl.pathname.startsWith(`${allowedPathPrefix}/`))
    ) {
      throw new DhanTransportUnavailableError(
        'Dhan vendor egress URL is outside the permitted IPD provider origin boundary'
      );
    }

    try {
      const response = await this.fetchImpl(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        ...(request.body !== undefined ? { body: request.body } : {}),
        redirect: 'error',
        signal: AbortSignal.timeout(request.timeoutMs),
      });
      const bodyText = await response.text();
      return { status: response.status, bodyText };
    } catch (err: unknown) {
      const name = (err as { name?: unknown } | null)?.name;
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new DhanTransportTimeoutError();
      }
      throw new DhanTransportUnavailableError('Dhan HTTPS vendor request failed closed');
    }
  }
}
