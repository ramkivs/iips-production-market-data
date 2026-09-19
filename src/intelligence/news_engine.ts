/**
 * Institutional Investment Platform System (IIPS)
 * Corporate News & Events Ingestion Engine (P10 / D06)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { NewsEventPayload } from '../contracts/d06_news.js';
import { QualityState } from '../contracts/types.js';

export interface FilteredNewsResult {
  newsItems: NewsEventPayload[];
  totalAvailable: number;
  filteredCount: number;
  dominantSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  averageSentimentScore: number;
  qualityState: QualityState;
}

export class NewsEngine {
  private newsStore: NewsEventPayload[] = [];

  public ingestNews(item: NewsEventPayload): void {
    // Validate sentiment score invariant (-1.0 to +1.0)
    if (item.sentimentScore < -1.0 || item.sentimentScore > 1.0) {
      throw new Error(`Sentiment score out of range: ${item.sentimentScore}`);
    }

    // Freeze for immutability
    this.newsStore.push(Object.freeze({ ...item }));
  }

  /**
   * Queries news items for a company strictly as of a point in time (PIT).
   * Filters by minimum relevance and orders official exchange disclosures first.
   */
  public queryNews(params: {
    companyId?: string;
    asOf: string;
    minRelevance?: number;
    category?: NewsEventPayload['category'];
    limit?: number;
  }): FilteredNewsResult {
    const { companyId, asOf, minRelevance = 0.5, category, limit = 20 } = params;
    const asOfMs = Date.parse(asOf);

    // 1. PIT filtering: publishedAt <= asOf
    let eligible = this.newsStore.filter((item) => {
      const pubMs = Date.parse(item.publishedAt);
      if (pubMs > asOfMs) return false;
      if (companyId && item.companyId && item.companyId !== companyId) return false;
      if (category && item.category !== category) return false;
      if (item.relevanceScore < minRelevance) return false;
      return true;
    });

    const totalAvailable = eligible.length;

    // 2. Precedence ordering: Official Exchange Disclosures rank highest
    eligible.sort((a, b) => {
      const isAOfficial = a.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE' ? 1 : 0;
      const isBOfficial = b.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE' ? 1 : 0;
      if (isAOfficial !== isBOfficial) {
        return isBOfficial - isAOfficial; // Official first
      }
      // Then sort by latest publishedAt
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    });

    const items = eligible.slice(0, limit);

    // Calculate aggregate sentiment
    let avgSentiment = 0;
    if (items.length > 0) {
      const sum = items.reduce((acc, curr) => acc + curr.sentimentScore, 0);
      avgSentiment = Math.round((sum / items.length) * 100) / 100;
    }

    let dominantSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (avgSentiment >= 0.15) dominantSentiment = 'BULLISH';
    else if (avgSentiment <= -0.15) dominantSentiment = 'BEARISH';

    return {
      newsItems: items,
      totalAvailable,
      filteredCount: items.length,
      dominantSentiment,
      averageSentimentScore: avgSentiment,
      qualityState: items.length > 0 ? 'GOOD' : 'PARTIAL',
    };
  }
}
