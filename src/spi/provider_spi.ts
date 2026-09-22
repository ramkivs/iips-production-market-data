/**
 * Institutional Investment Platform System (IIPS)
 * Provider-Neutral Service Provider Interface (SPI) (P02)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import { DataDomain, SourceClassification } from '../contracts/types.js';

export interface SnapshotQuery {
  companyId: string;
  domain: DataDomain;
  asOf?: string; // ISO-8601 UTC
  parameters?: Record<string, unknown>;
}

export interface StreamSubscription {
  subscriptionId: string;
  companyIds: string[];
  domain: DataDomain;
}

export interface ProviderHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  lastHeartbeat: string;
}

/**
 * Provider-Neutral Ingress SPI.
 * Public implementations must NOT leak vendor-specific endpoints or formats.
 */
export interface MarketDataSource<T> {
  readonly providerId: string; // Symbolic internal provider ID (e.g. "MOCK_FIXTURE_PROVIDER")

  getSourceClassification(): SourceClassification;

  fetchSnapshot(query: SnapshotQuery): Promise<CanonicalEnvelope<T>>;

  subscribeStream(
    subscription: StreamSubscription,
    handler: (envelope: CanonicalEnvelope<T>) => void
  ): () => void; // Returns unsubscribe callback

  healthCheck(): Promise<ProviderHealth>;
}
