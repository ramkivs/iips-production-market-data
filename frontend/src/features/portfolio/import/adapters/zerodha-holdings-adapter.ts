/**
 * Institutional Investment Platform System (IIPS)
 * Zerodha Kite Holdings CSV Adapter (BI-04)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-04-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import {
  FinappBrokerAdapter,
  FinappBrokerParseResult,
  FinappHolding,
  BrokerAdapterParseOptions,
} from '../types.js';
import {
  parseCsvToObjects,
  parseNumericCell,
  parseStringCell,
} from './csv-parser-helper.js';

export class ZerodhaHoldingsAdapter implements FinappBrokerAdapter {
  public readonly brokerType = 'ZERODHA';
  public readonly brokerName = 'Zerodha Kite';
  public readonly supportedFormats = ['csv'] as const;

  /**
   * Parses Zerodha Kite holdings CSV export.
   */
  public parse(
    content: string | Buffer | ArrayBuffer,
    options?: BrokerAdapterParseOptions
  ): FinappBrokerParseResult {
    const textContent = typeof content === 'string'
      ? content
      : Buffer.isBuffer(content)
        ? content.toString('utf-8')
        : new TextDecoder().decode(content);

    const asOf = options?.asOf || new Date().toISOString();
    const sourceFileName = options?.fileName || 'zerodha-holdings.csv';
    const warnings: string[] = [];
    const errors: string[] = [];

    const { headers, rows } = parseCsvToObjects(textContent, {
      skipHeaderRows: options?.skipHeaderRows ?? 0,
    });

    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        brokerType: 'ZERODHA',
        holdings: [],
        totalHoldings: 0,
        totalValue: 0,
        errors: ['Zerodha CSV content is empty or contains no data rows.'],
        warnings,
        metadata: {
          fileFormat: 'csv',
          parsedAt: asOf,
          sourceFileName,
        },
      };
    }

    // Normalize header map
    const headerMap = new Map<string, string>();
    for (const h of headers) {
      headerMap.set(h.toLowerCase().trim(), h);
    }

    // Locate Zerodha specific column names
    const instrumentCol = headerMap.get('instrument') || headerMap.get('symbol');
    const qtyCol = headerMap.get('qty.') || headerMap.get('qty') || headerMap.get('quantity') || headerMap.get('quantity available');
    const avgCostCol = headerMap.get('avg. cost') || headerMap.get('avg cost') || headerMap.get('avg. price') || headerMap.get('average price');
    const ltpCol = headerMap.get('ltp') || headerMap.get('last price') || headerMap.get('current price');
    const curValCol = headerMap.get('cur. val') || headerMap.get('cur val') || headerMap.get('current value');
    const isinCol = headerMap.get('isin');
    const pnlCol = headerMap.get('p&l') || headerMap.get('pnl') || headerMap.get('profit/loss');
    const netChgCol = headerMap.get('net chg.') || headerMap.get('net chg') || headerMap.get('net change');

    if (!instrumentCol || (!qtyCol && !avgCostCol && !ltpCol)) {
      return {
        success: false,
        brokerType: 'ZERODHA',
        holdings: [],
        totalHoldings: 0,
        totalValue: 0,
        errors: [`Invalid Zerodha CSV schema: missing mandatory 'Instrument' or 'Qty.' columns. Found headers: ${headers.join(', ')}`],
        warnings,
        metadata: {
          fileFormat: 'csv',
          parsedAt: asOf,
          sourceFileName,
        },
      };
    }

    const holdings: FinappHolding[] = [];
    let totalValue = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawSymbol = parseStringCell(row[instrumentCol]);
      if (!rawSymbol) {
        warnings.push(`Row ${i + 1}: Skipped row with empty Instrument/Symbol.`);
        continue;
      }

      const isin = isinCol ? parseStringCell(row[isinCol]) : undefined;
      const quantity = qtyCol ? parseNumericCell(row[qtyCol], 0) : 0;
      const averagePrice = avgCostCol ? parseNumericCell(row[avgCostCol], 0) : 0;
      const ltp = ltpCol ? parseNumericCell(row[ltpCol], 0) : averagePrice;
      const curVal = curValCol ? parseNumericCell(row[curValCol], 0) : (quantity * ltp);
      const pnl = pnlCol ? parseNumericCell(row[pnlCol], 0) : (curVal - (quantity * averagePrice));
      const netChg = netChgCol ? parseNumericCell(row[netChgCol], 0) : 0;

      // Extract symbol clean name (strip exchange prefix/suffix if present, e.g. NSE:INFY -> INFY)
      const cleanSymbol = rawSymbol.includes(':') ? rawSymbol.split(':')[1].trim() : rawSymbol;
      const exchange = rawSymbol.startsWith('BSE:') ? 'BSE' : 'NSE';

      const holding: FinappHolding = {
        symbol: cleanSymbol.toUpperCase(),
        isin: isin ? isin.toUpperCase() : undefined,
        quantity,
        averagePrice,
        currentPrice: ltp,
        closePrice: ltp,
        pnl,
        pnlPercentage: averagePrice > 0 ? ((ltp - averagePrice) / averagePrice) * 100 : netChg,
        exchange,
        assetClass: 'EQUITY',
        marketValue: curVal,
        raw: { ...row, rowIndex: i + 1 },
      };

      holdings.push(holding);
      totalValue += curVal;
    }

    return {
      success: errors.length === 0 && holdings.length > 0,
      brokerType: 'ZERODHA',
      holdings,
      totalHoldings: holdings.length,
      totalValue,
      errors,
      warnings,
      metadata: {
        fileFormat: 'csv',
        parsedAt: asOf,
        sourceFileName,
      },
    };
  }
}
