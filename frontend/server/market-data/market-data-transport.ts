/**
 * Market Data HTTP Transport Handlers (Read/Status endpoints).
 *
 * Implements:
 * - GET /api/market-data/status  (Status, licensing gate, freshness, historical count)
 * - GET /api/market-data/current (Current canonical equity state)
 * - GET /api/market-data/history (EOD history for symbol, date range)
 *
 * Adheres to repository pattern:
 * - Read authorization using existing `guardRead` from admin-transport.
 * - JSON responses carrying canonical types and freshness.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { guardRead, TransportError } from '../admin-transport';
import type { SecuredExecutor } from '../secured-executor';
import { defaultMarketDataStore } from './market-data-store';

export async function handleMarketDataRequest(
  req: IncomingMessage,
  res: ServerResponse,
  executor: SecuredExecutor
): Promise<void> {
  const url = req.url ?? '';
  const [pathname, search] = url.split('?');
  const params = new URLSearchParams(search ?? '');
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Guard read entitlement
  try {
    await guardRead(executor, token, 'market-data');
  } catch (err) {
    if (err instanceof TransportError) {
      res.writeHead(err.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'forbidden: insufficient market data read privileges' }));
    return;
  }

  // Route: /api/market-data/status
  if (pathname === '/api/market-data/status') {
    const status = defaultMarketDataStore.getStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }

  // Route: /api/market-data/current
  if (pathname === '/api/market-data/current') {
    const symbol = params.get('symbol');
    if (symbol) {
      const record = defaultMarketDataStore.getCurrentStateRecord(symbol);
      if (!record) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Symbol '${symbol}' not found in current market state` }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          record,
          freshness: defaultMarketDataStore.getCurrentStateFreshness(),
        })
      );
      return;
    }

    const all = defaultMarketDataStore.getAllCurrentState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        records: all,
        total: all.length,
        freshness: defaultMarketDataStore.getCurrentStateFreshness(),
      })
    );
    return;
  }

  // Route: /api/market-data/history
  if (pathname === '/api/market-data/history') {
    const symbol = params.get('symbol');
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Query parameter "symbol" is required' }));
      return;
    }

    const startDate = params.get('startDate') ?? undefined;
    const endDate = params.get('endDate') ?? undefined;
    const history = defaultMarketDataStore.getEodHistory(symbol, startDate, endDate);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        symbol: symbol.toUpperCase(),
        records: history,
        count: history.length,
        startDate: startDate ?? (history.length > 0 ? history[0].tradeDate : null),
        endDate: endDate ?? (history.length > 0 ? history[history.length - 1].tradeDate : null),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}
