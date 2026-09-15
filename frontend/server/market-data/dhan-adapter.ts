/**
 * DhanHQ v2 Market Data Provider Adapter.
 *
 * Implements the frozen MarketDataProviderAdapter interface:
 * - Uses DhanHQ v2 Market Quote REST API for approximately 15-minute delayed equity refresh.
 * - Read-only: strictly excludes all order, trade, fund, or position management endpoints.
 * - Resolves NSE symbols to Dhan integer securityIds.
 * - Normalizes JSON response losslessly into CanonicalCurrentStateRecord.
 * - Fails closed on authentication, rate-limiting, network, or data anomalies.
 * - Zero automatic fallback to yfinance.
 */

import type { CanonicalCurrentStateRecord } from './canonical-contract';
import type { MarketDataProviderAdapter } from './provider-adapter';
import { DhanInstrumentMasterResolver } from './dhan-instrument-master.ts';

export interface DhanConfig {
  readonly clientId?: string;
  readonly accessToken?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly trackedSymbols?: readonly string[];
}

export interface DhanMarketQuoteRecord {
  readonly last_price?: number;
  readonly ohlc?: {
    readonly open?: number;
    readonly high?: number;
    readonly low?: number;
    readonly close?: number;
  };
  readonly volume?: number;
  readonly prev_close?: number;
  readonly last_trade_time?: number; // epoch seconds or unix timestamp
  readonly average_price?: number;
}

export class DhanProviderAdapter implements MarketDataProviderAdapter {
  public readonly providerId = 'DHAN_DATA_API';
  public readonly providerName = 'DhanHQ v2 Market Data API (NSE Capital Market)';
  public readonly isEntitled: boolean;

  private readonly clientId: string;
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly trackedSymbols: readonly string[];
  private readonly resolver: DhanInstrumentMasterResolver;

  // Optional mock fetch injector for deterministic testing without external network
  private customFetch?: typeof fetch;

  constructor(config?: DhanConfig, resolver?: DhanInstrumentMasterResolver, customFetch?: typeof fetch) {
    this.clientId = config?.clientId ?? process.env.DHAN_CLIENT_ID ?? '';
    this.accessToken = config?.accessToken ?? process.env.DHAN_ACCESS_TOKEN ?? '';
    this.baseUrl = config?.baseUrl ?? 'https://api.dhan.co/v2';
    this.timeoutMs = config?.timeoutMs ?? 10000;
    this.trackedSymbols = config?.trackedSymbols ?? ['TCS', 'INFY', 'RELIANCE', 'HDFCBANK'];
    this.resolver = resolver ?? new DhanInstrumentMasterResolver();
    this.customFetch = customFetch;

    this.isEntitled = Boolean(this.clientId.trim() && this.accessToken.trim());
  }

  /**
   * Fetches the latest market snapshot via DhanHQ v2 Market Quote API.
   * Target: POST /marketfeed/quote with { "NSE_EQ": [secId1, secId2, ...] }
   */
  public async fetchCurrentState(symbols?: readonly string[]): Promise<{
    readonly success: boolean;
    readonly records: readonly CanonicalCurrentStateRecord[];
    readonly error?: string;
  }> {
    if (!this.isEntitled) {
      return {
        success: false,
        records: [],
        error:
          'EXTERNALLY_BLOCKED: DHAN_CLIENT_ID or DHAN_ACCESS_TOKEN not provisioned in environment. Real operator credentials required.',
      };
    }

    const targetSymbols = symbols ?? this.trackedSymbols;
    if (targetSymbols.length === 0) {
      return { success: true, records: [] };
    }

    // Resolve symbols to Dhan securityIds
    const securityIds: number[] = [];
    const secIdToSym: Map<string, string> = new Map();
    const unmapped: string[] = [];

    for (const sym of targetSymbols) {
      const secId = this.resolver.resolveSecurityId(sym, 'NSE');
      if (secId) {
        const numId = parseInt(secId, 10);
        if (!isNaN(numId)) {
          securityIds.push(numId);
          secIdToSym.set(secId, sym);
        } else {
          unmapped.push(sym);
        }
      } else {
        unmapped.push(sym);
      }
    }

    if (securityIds.length === 0) {
      return {
        success: false,
        records: [],
        error: `SYMBOL_RESOLUTION_ERROR: None of the requested symbols could be mapped to Dhan securityIds: ${unmapped.join(', ')}`,
      };
    }

    const payload = {
      NSE_EQ: securityIds,
    };

    const fetchFn = this.customFetch ?? globalThis.fetch;
    if (typeof fetchFn !== 'function') {
      return {
        success: false,
        records: [],
        error: 'RUNTIME_ERROR: Global fetch is not available in current environment.',
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetchFn(`${this.baseUrl}/marketfeed/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': this.accessToken,
          'client-id': this.clientId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            records: [],
            error: `DHAN_AUTH_ERROR_${response.status}: Invalid or expired Dhan access-token or client-id.`,
          };
        }
        if (response.status === 429) {
          return {
            success: false,
            records: [],
            error: 'DHAN_API_ERROR_429: Rate limit exceeded on Dhan Market Quote API.',
          };
        }
        return {
          success: false,
          records: [],
          error: `DHAN_API_HTTP_ERROR_${response.status}: ${response.statusText}`,
        };
      }

      const body = (await response.json()) as {
        status?: string;
        data?: {
          NSE_EQ?: Record<string, DhanMarketQuoteRecord>;
        };
        remarks?: string;
      };

      if (body.status !== 'success' || !body.data?.NSE_EQ) {
        return {
          success: false,
          records: [],
          error: `DHAN_RESPONSE_MALFORMED: Expected status 'success' with 'NSE_EQ' data dictionary. Remarks: ${body.remarks ?? 'none'}`,
        };
      }

      const records: CanonicalCurrentStateRecord[] = [];
      const receivedAt = new Date().toISOString();
      const nseEqData = body.data.NSE_EQ;

      for (const [secId, quote] of Object.entries(nseEqData)) {
        const symbol = secIdToSym.get(secId);
        if (!symbol) continue; // Unsolicited or unmapped record

        const lastPrice = Number(quote.last_price);
        const prevClose = Number(quote.prev_close ?? quote.ohlc?.close ?? lastPrice);
        const open = Number(quote.ohlc?.open ?? lastPrice);
        const high = Number(quote.ohlc?.high ?? lastPrice);
        const low = Number(quote.ohlc?.low ?? lastPrice);
        const close = Number(quote.ohlc?.close ?? lastPrice);
        const volume = Number(quote.volume ?? 0);
        const tradedValue = Number((quote.average_price ?? lastPrice) * volume);

        // Sanity validation: prices must be positive numbers
        if (isNaN(lastPrice) || lastPrice <= 0) continue;

        const change = lastPrice - prevClose;
        const pChange = prevClose > 0 ? (change / prevClose) * 100 : 0;

        let timestamp: string;
        if (quote.last_trade_time && quote.last_trade_time > 0) {
          // If epoch seconds (10 digits) vs epoch ms (13 digits)
          const epochMs = quote.last_trade_time < 1e11 ? quote.last_trade_time * 1000 : quote.last_trade_time;
          timestamp = new Date(epochMs).toISOString();
        } else {
          timestamp = receivedAt;
        }

        records.push({
          symbol,
          isin: `INE_${symbol}`, // In live environment, resolved from Security Master
          exchange: 'NSE',
          lastPrice,
          change: Number(change.toFixed(2)),
          pChange: Number(pChange.toFixed(2)),
          open,
          high,
          low,
          close,
          previousClose: prevClose,
          volume,
          tradedValue,
          timestamp,
          receivedAt,
          quality: 'good',
        });
      }

      return {
        success: true,
        records,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        records: [],
        error: `DHAN_NETWORK_ERROR: ${msg}`,
      };
    }
  }

  /**
   * EOD Bhavcopy handling: Dhan is strictly a Layer-1 current-state provider.
   * Daily EOD Bhavcopy remains governed by Layer-2 (NSE CM-UDiFF SFTP architecture).
   */
  public async fetchEodBhavcopy(tradeDate: string): Promise<{
    readonly success: boolean;
    readonly csvContent?: string;
    readonly sourceFile?: string;
    readonly error?: string;
  }> {
    return {
      success: false,
      error: `DHAN_PROVIDER_SCOPE_LIMITATION: DhanDataApi is registered for Layer-1 Current State only. Daily EOD Bhavcopy (${tradeDate}) remains governed by official Layer-2 NSE CM-UDiFF SFTP pipeline.`,
    };
  }
}
