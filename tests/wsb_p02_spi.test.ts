/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: P02 Provider-Neutral SPI Compliance
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  MarketDataSource,
  SnapshotQuery,
  StreamSubscription,
  ProviderHealth,
  CanonicalEnvelope,
  createCanonicalEnvelope,
  computeLineageHash,
  MarketQuotePayload,
} from '../src/index.js';

class MockFixtureMarketDataSource implements MarketDataSource<MarketQuotePayload> {
  public readonly providerId = 'MOCK_FIXTURE_PROVIDER';
  private quotes: Map<string, MarketQuotePayload> = new Map();

  constructor() {
    const d01Data = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/d01_fixtures.json'), 'utf-8'));
    for (const q of d01Data.validQuotes) {
      this.quotes.set(q.companyId, q);
    }
  }

  public getSourceClassification() {
    return 'CANONICAL_MARKET_DATA' as const;
  }

  public async fetchSnapshot(query: SnapshotQuery): Promise<CanonicalEnvelope<MarketQuotePayload>> {
    const payload = this.quotes.get(query.companyId);
    if (!payload) {
      throw new Error(`Company not found in fixture: ${query.companyId}`);
    }

    const asOf = query.asOf || '2026-09-18T10:00:00.000Z';
    const dataVersion = 'v1.0.0';
    const lineageHash = computeLineageHash(payload, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf,
      dataVersion,
    });

    return createCanonicalEnvelope({
      envelopeId: `snap-${query.companyId}-${Date.now()}`,
      domain: query.domain,
      mode: 'SNAPSHOT',
      companyId: query.companyId,
      payload,
      provenance: {
        sourceClassification: 'CANONICAL_MARKET_DATA',
        vendorTier: 'MOCK_FIXTURE',
        asOf,
        receivedAt: asOf,
        evaluatedAt: asOf,
        dataVersion,
        lineageHash,
        qualityState: 'GOOD',
      },
    });
  }

  public subscribeStream(
    subscription: StreamSubscription,
    handler: (envelope: CanonicalEnvelope<MarketQuotePayload>) => void
  ): () => void {
    let active = true;
    const interval = setInterval(() => {
      if (!active) return;
      for (const cid of subscription.companyIds) {
        const payload = this.quotes.get(cid);
        if (payload) {
          const asOf = new Date().toISOString();
          const envelope = createCanonicalEnvelope({
            envelopeId: `stream-${cid}-${Date.now()}`,
            domain: subscription.domain,
            mode: 'LIVE',
            companyId: cid,
            payload,
            provenance: {
              sourceClassification: 'CANONICAL_MARKET_DATA',
              vendorTier: 'MOCK_FIXTURE',
              asOf,
              receivedAt: asOf,
              evaluatedAt: asOf,
              dataVersion: 'v1-live',
              lineageHash: computeLineageHash(payload, {
                sourceClassification: 'CANONICAL_MARKET_DATA',
                asOf,
                dataVersion: 'v1-live',
              }),
              qualityState: 'GOOD',
            },
          });
          handler(envelope);
        }
      }
    }, 50);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      status: 'HEALTHY',
      latencyMs: 1.5,
      lastHeartbeat: new Date().toISOString(),
    };
  }
}

describe('WS-B / P02 Provider-Neutral SPI Compliance', () => {
  it('P02-01: should implement MarketDataSource interface and fetch snapshots with valid provenance', async () => {
    const ds = new MockFixtureMarketDataSource();
    assert.strictEqual(ds.getSourceClassification(), 'CANONICAL_MARKET_DATA');

    const snap = await ds.fetchSnapshot({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
    });

    assert.strictEqual(snap.companyId, 'INFY');
    assert.strictEqual(snap.domain, 'D01_QUOTES');
    assert.strictEqual(snap.payload.symbol, 'INFY');
    assert.strictEqual(snap.provenance.qualityState, 'GOOD');
    assert.ok(snap.provenance.lineageHash.length === 64);
  });

  it('P02-02: should support stream subscription and unsubscription lifecycle', async () => {
    const ds = new MockFixtureMarketDataSource();
    const received: CanonicalEnvelope<MarketQuotePayload>[] = [];

    const unsubscribe = ds.subscribeStream(
      {
        subscriptionId: 'sub-001',
        companyIds: ['INFY', 'TCS'],
        domain: 'D01_QUOTES',
      },
      (envelope) => {
        received.push(envelope);
      }
    );

    // Wait 120ms to collect stream items
    await new Promise((r) => setTimeout(r, 120));
    unsubscribe();
    const countAfterUnsub = received.length;
    assert.ok(countAfterUnsub >= 2, `Expected at least 2 stream messages, got ${countAfterUnsub}`);

    // Wait another 100ms to verify no further messages arrive after unsubscription
    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(received.length, countAfterUnsub, 'Unsubscribe should stop stream callbacks');
  });

  it('P02-03: should return healthy heartbeat from provider SPI health check', async () => {
    const ds = new MockFixtureMarketDataSource();
    const health = await ds.healthCheck();
    assert.strictEqual(health.status, 'HEALTHY');
    assert.ok(health.latencyMs < 10);
  });
});
