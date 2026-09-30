/**
 * Institutional Investment Platform System (IIPS)
 * Trusted JWKS Resolution (NP04-G24 / Phase H)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Resolves signing keys from the configured trusted JWKS endpoint only.
 * Keys are never accepted from the token itself.
 */

import { createPublicKey, type JsonWebKey, type KeyObject } from 'node:crypto';
import { OidcJwksUnavailableError, OidcKeyUnavailableError } from './errors.js';

export interface JsonWebKeyRecord {
  readonly kty?: string;
  readonly kid?: string;
  readonly alg?: string;
  readonly use?: string;
  readonly n?: string;
  readonly e?: string;
  readonly crv?: string;
  readonly x?: string;
  readonly y?: string;
  readonly [key: string]: unknown;
}

export interface JwksDocument {
  readonly keys: readonly JsonWebKeyRecord[];
}

/** Injectable fetch for deterministic tests. */
export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const DEFAULT_CACHE_TTL_MS = 300_000;

export class JwksClient {
  private cachedDocument: JwksDocument | null = null;
  private cachedAt = 0;
  private inFlight: Promise<JwksDocument> | null = null;

  constructor(
    private readonly jwksUri: string,
    private readonly fetchImpl: FetchLike = (url) => fetch(url) as unknown as ReturnType<FetchLike>,
    private readonly cacheTtlMs: number = DEFAULT_CACHE_TTL_MS,
    private readonly clock: () => number = () => Date.now()
  ) {}

  private async load(force: boolean): Promise<JwksDocument> {
    const age = this.clock() - this.cachedAt;
    if (!force && this.cachedDocument && age < this.cacheTtlMs) {
      return this.cachedDocument;
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = (async () => {
      try {
        const response = await this.fetchImpl(this.jwksUri);
        if (!response.ok) {
          throw new OidcJwksUnavailableError(`HTTP ${response.status}`);
        }
        const body = (await response.json()) as JwksDocument;
        if (!body || !Array.isArray(body.keys)) {
          throw new OidcJwksUnavailableError('document is not a JWKS');
        }
        this.cachedDocument = body;
        this.cachedAt = this.clock();
        return body;
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  /**
   * Resolves the public key for a key id.
   * A cache refresh is attempted once when the kid is unknown (key rotation).
   */
  public async getKey(kid: string): Promise<KeyObject> {
    let document = await this.load(false);
    let record = document.keys.find((k) => k.kid === kid);

    if (!record) {
      document = await this.load(true);
      record = document.keys.find((k) => k.kid === kid);
    }

    if (!record) {
      throw new OidcKeyUnavailableError(kid);
    }

    try {
      return createPublicKey({
        format: 'jwk',
        key: record as unknown as JsonWebKey,
      });
    } catch {
      throw new OidcKeyUnavailableError(kid);
    }
  }
}
