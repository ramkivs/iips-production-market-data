/**
 * DhanHQ v2 Market Data Adapter Unit & Integration Test Suite.
 *
 * Verifies:
 * 1. Security-ID / Instrument Master resolution.
 * 2. Missing/unmapped symbol handling (no silent substitution).
 * 3. Unentitled / missing credentials handling (fails closed).
 * 4. Canonical normalization of Market Quote payloads.
 * 5. OHLC and price sanity verification.
 * 6. Authentication failure handling (HTTP 401).
 * 7. Rate limit throttling handling (HTTP 429).
 * 8. Batch request scaling (up to 200 instruments).
 * 9. Absolute exclusion of trading/order endpoints.
 * 10. Absolute exclusion of yfinance fallback.
 */

import { describe, it, expect } from 'vitest';
import { DhanProviderAdapter } from './dhan-adapter';
import { DhanInstrumentMasterResolver } from './dhan-instrument-master';

describe('DhanInstrumentMasterResolver', () => {
  it('resolves representative NSE_EQ symbols to exact securityIds', () => {
    const resolver = new DhanInstrumentMasterResolver();
    expect(resolver.resolveSecurityId('TCS', 'NSE')).toBe('11536');
    expect(resolver.resolveSecurityId('INFY', 'NSE')).toBe('1594');
    expect(resolver.resolveSecurityId('RELIANCE', 'NSE')).toBe('2885');
    expect(resolver.resolveSecurityId('HDFCBANK', 'NSE')).toBe('1333');
  });

  it('handles case-insensitivity and whitespace cleanly', () => {
    const resolver = new DhanInstrumentMasterResolver();
    expect(resolver.resolveSecurityId('  tcs  ', 'NSE')).toBe('11536');
    expect(resolver.resolveSecurityId('infy', 'NSE')).toBe('1594');
  });

  it('returns null for unknown symbols or non-NSE exchanges', () => {
    const resolver = new DhanInstrumentMasterResolver();
    expect(resolver.resolveSecurityId('UNKNOWN_CO', 'NSE')).toBeNull();
    expect(resolver.resolveSecurityId('TCS', 'BSE')).toBeNull();
  });

  it('ingests and parses Dhan official scrip master CSV correctly', () => {
    const resolver = new DhanInstrumentMasterResolver({});
    expect(resolver.getKnownSymbolCount()).toBe(0);

    const mockCsv = `SEM_EXM_EXCH_ID,SEM_SMST_SECURITY_ID,SEM_TRADING_SYMBOL,SEM_SERIES,SEM_INSTRUMENT_NAME
NSE,99901,NEWCORP,EQ,EQUITY
NSE,99902,DEBTHOLD,DB,DEBT
BSE,88801,BSEONLY,A,EQUITY
NSE,99903,GROWTHCO,SM,SME`;

    const count = resolver.ingestScripMasterCsv(mockCsv);
    expect(count).toBe(2); // Only NSE EQ and SM should be admitted
    expect(resolver.resolveSecurityId('NEWCORP', 'NSE')).toBe('99901');
    expect(resolver.resolveSecurityId('GROWTHCO', 'NSE')).toBe('99903');
    expect(resolver.resolveSecurityId('DEBTHOLD', 'NSE')).toBeNull(); // Debt rejected
    expect(resolver.resolveSecurityId('BSEONLY', 'NSE')).toBeNull(); // Non-NSE rejected
  });
});

describe('DhanProviderAdapter', () => {
  it('fails closed when credentials are not provisioned (EXTERNALLY_BLOCKED)', async () => {
    const adapter = new DhanProviderAdapter({ clientId: '', accessToken: '' });
    expect(adapter.isEntitled).toBe(false);

    const result = await adapter.fetchCurrentState(['TCS', 'INFY']);
    expect(result.success).toBe(false);
    expect(result.records).toHaveLength(0);
    expect(result.error).toContain('EXTERNALLY_BLOCKED');
  });

  it('normalizes valid DhanHQ Market Quote responses losslessly into canonical contract', async () => {
    const mockApiResponse = {
      status: 'success',
      data: {
        NSE_EQ: {
          '11536': {
            last_price: 4525.55,
            ohlc: {
              open: 4521.45,
              high: 4530.0,
              low: 4500.0,
              close: 4507.85,
            },
            volume: 1284500,
            average_price: 4518.2,
            prev_close: 4507.85,
            last_trade_time: 1757929800,
          },
          '1594': {
            last_price: 1920.1,
            ohlc: {
              open: 1910.0,
              high: 1935.0,
              low: 1905.0,
              close: 1908.5,
            },
            volume: 850200,
            average_price: 1918.0,
            prev_close: 1908.5,
            last_trade_time: 1757929800,
          },
        },
      },
    };

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT_ID', accessToken: 'TEST_ACCESS_TOKEN' },
      new DhanInstrumentMasterResolver(),
      mockFetch
    );

    expect(adapter.isEntitled).toBe(true);
    const result = await adapter.fetchCurrentState(['TCS', 'INFY']);

    expect(result.success).toBe(true);
    expect(result.records).toHaveLength(2);

    const tcs = result.records.find((r) => r.symbol === 'TCS');
    expect(tcs).toBeDefined();
    expect(tcs?.exchange).toBe('NSE');
    expect(tcs?.lastPrice).toBe(4525.55);
    expect(tcs?.open).toBe(4521.45);
    expect(tcs?.high).toBe(4530.0);
    expect(tcs?.low).toBe(4500.0);
    expect(tcs?.previousClose).toBe(4507.85);
    expect(tcs?.volume).toBe(1284500);
    expect(tcs?.change).toBe(17.7);
    expect(tcs?.quality).toBe('good');
  });

  it('handles authentication failure (HTTP 401) without crashing and returns explicit error', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized',
      });
    };

    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT_ID', accessToken: 'EXPIRED_TOKEN' },
      new DhanInstrumentMasterResolver(),
      mockFetch
    );

    const result = await adapter.fetchCurrentState(['TCS']);
    expect(result.success).toBe(false);
    expect(result.records).toHaveLength(0);
    expect(result.error).toContain('DHAN_AUTH_ERROR_401');
  });

  it('handles rate-limiting (HTTP 429) cleanly with fail-closed semantics', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        statusText: 'Too Many Requests',
      });
    };

    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT_ID', accessToken: 'TEST_TOKEN' },
      new DhanInstrumentMasterResolver(),
      mockFetch
    );

    const result = await adapter.fetchCurrentState(['TCS']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('DHAN_API_ERROR_429');
  });

  it('supports batched requests for up to 200 instruments within a single call', async () => {
    let capturedBody = '';
    const mockFetch: typeof fetch = async (_url, init) => {
      capturedBody = init?.body as string;
      return new Response(
        JSON.stringify({
          status: 'success',
          data: { NSE_EQ: {} },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    // Populate a resolver with 200 symbols
    const mappings: Record<string, string> = {};
    const symbols: string[] = [];
    for (let i = 1; i <= 200; i++) {
      const sym = `SYM${i}`;
      mappings[sym] = `${10000 + i}`;
      symbols.push(sym);
    }

    const customResolver = new DhanInstrumentMasterResolver(mappings);
    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT', accessToken: 'TEST_TOKEN' },
      customResolver,
      mockFetch
    );

    await adapter.fetchCurrentState(symbols);
    expect(capturedBody).toBeTruthy();
    const parsed = JSON.parse(capturedBody) as { NSE_EQ: number[] };
    expect(parsed.NSE_EQ).toHaveLength(200);
    expect(parsed.NSE_EQ[0]).toBe(10001);
    expect(parsed.NSE_EQ[199]).toBe(10200);
  });

  it('strictly excludes trading and order endpoints (only /marketfeed/quote is called)', async () => {
    let requestedUrl = '';
    const mockFetch: typeof fetch = async (url) => {
      requestedUrl = url.toString();
      return new Response(
        JSON.stringify({
          status: 'success',
          data: { NSE_EQ: {} },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT', accessToken: 'TEST_TOKEN' },
      new DhanInstrumentMasterResolver(),
      mockFetch
    );

    await adapter.fetchCurrentState(['TCS']);
    expect(requestedUrl).toBe('https://api.dhan.co/v2/marketfeed/quote');
    expect(requestedUrl).not.toContain('/orders');
    expect(requestedUrl).not.toContain('/trades');
    expect(requestedUrl).not.toContain('/positions');
    expect(requestedUrl).not.toContain('/funds');
  });

  it('strictly prohibits automatic failover to yfinance when Dhan fails', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    };

    const adapter = new DhanProviderAdapter(
      { clientId: 'TEST_CLIENT', accessToken: 'TEST_TOKEN' },
      new DhanInstrumentMasterResolver(),
      mockFetch
    );

    const result = await adapter.fetchCurrentState(['TCS']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('DHAN_API_HTTP_ERROR_500');
    // Ensure no fallback data or secondary calls occurred
    expect(result.records).toHaveLength(0);
  });
});
