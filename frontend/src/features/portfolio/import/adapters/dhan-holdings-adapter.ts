/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Holdings CSV Adapter (BI-04)
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

export class DhanHoldingsAdapter implements FinappBrokerAdapter {
  public readonly brokerType = 'DHAN';
  public readonly brokerName = 'Dhan';
  public readonly supportedFormats = ['csv'] as const;

  /**
   * Parses Dhan holdings CSV export.
   * Note: Dhan XLSX format is deferred to BI-06 under zero-dependency governance.
   */
  public parse(
    content: string | Uint8Array | ArrayBuffer | any,
    options?: BrokerAdapterParseOptions
  ): FinappBrokerParseResult {
    const asOf = options?.asOf || new Date().toISOString();
    const sourceFileName = options?.fileName || 'dhan-holdings.csv';
    const warnings: string[] = [];
    const errors: string[] = [];

    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(content);
    const isUint8Array = content instanceof Uint8Array;
    const isArrayBuffer = content instanceof ArrayBuffer;

    let binaryBytes: Uint8Array | undefined = undefined;
    if (isBuffer) {
      binaryBytes = new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
    } else if (isUint8Array) {
      binaryBytes = content;
    } else if (isArrayBuffer) {
      binaryBytes = new Uint8Array(content);
    }

    const isZipBinary = binaryBytes !== undefined && binaryBytes.length >= 4 && binaryBytes[0] === 0x50 && binaryBytes[1] === 0x4b;
    const isXlsxExt = sourceFileName.toLowerCase().endsWith('.xlsx') || sourceFileName.toLowerCase().endsWith('.xls');

    // Check if binary XLSX input is passed
    if (isXlsxExt || isZipBinary) {
      return {
        success: false,
        brokerType: 'DHAN',
        holdings: [],
        totalHoldings: 0,
        totalValue: 0,
        errors: ['Dhan XLSX format parsing is QUALIFICATION-BLOCKED / DEFERRED TO BI-06 under zero-dependency rule.'],
        warnings: ['XLSX binary parsing requires xlsx package qualification in BI-06.'],
        metadata: {
          fileFormat: 'xlsx',
          parsedAt: asOf,
          sourceFileName,
          requiresXlsx: true,
          qualificationStatus: 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06',
        },
      };
    }

    const textContent = typeof content === 'string'
      ? content
      : binaryBytes !== undefined
        ? new TextDecoder('utf-8').decode(binaryBytes)
        : String(content);

    const { headers, rows } = parseCsvToObjects(textContent, {
      skipHeaderRows: options?.skipHeaderRows ?? 0,
    });

    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        brokerType: 'DHAN',
        holdings: [],
        totalHoldings: 0,
        totalValue: 0,
        errors: ['Dhan CSV content is empty or contains no data rows.'],
        warnings,
        metadata: {
          fileFormat: 'csv',
          parsedAt: asOf,
          sourceFileName,
        },
      };
    }

    const headerMap = new Map<string, string>();
    for (const h of headers) {
      headerMap.set(h.toLowerCase().trim(), h);
    }

    // Locate Dhan specific columns
    const symbolCol = headerMap.get('trading symbol') || headerMap.get('symbol') || headerMap.get('stock name');
    const isinCol = headerMap.get('isin');
    const exchangeCol = headerMap.get('exchange');
    const qtyCol = headerMap.get('total qty') || headerMap.get('quantity') || headerMap.get('available qty') || headerMap.get('dp qty') || headerMap.get('total quantity');
    const avgBuyPriceCol = headerMap.get('average buy price') || headerMap.get('average price') || headerMap.get('avg buy price') || headerMap.get('avg price');
    const ltpCol = headerMap.get('last traded price') || headerMap.get('ltp') || headerMap.get('current price');
    const curValCol = headerMap.get('current value') || headerMap.get('market value');
    const pnlCol = headerMap.get('profit / loss') || headerMap.get('profit/loss') || headerMap.get('p&l');
    const pnlPctCol = headerMap.get('p&l %') || headerMap.get('profit / loss %') || headerMap.get('p&l(%)');

    if (!symbolCol || (!qtyCol && !avgBuyPriceCol && !ltpCol)) {
      return {
        success: false,
        brokerType: 'DHAN',
        holdings: [],
        totalHoldings: 0,
        totalValue: 0,
        errors: [`Invalid Dhan CSV schema: missing mandatory 'Trading Symbol' or 'Total Qty' columns. Found headers: ${headers.join(', ')}`],
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
      const rawSymbol = parseStringCell(row[symbolCol]);
      if (!rawSymbol) {
        warnings.push(`Row ${i + 1}: Skipped row with empty Symbol.`);
        continue;
      }

      const isin = isinCol ? parseStringCell(row[isinCol]) : undefined;
      const rawExchange = exchangeCol ? parseStringCell(row[exchangeCol]).toUpperCase() : 'NSE';
      const exchange: 'NSE' | 'BSE' = rawExchange.includes('BSE') ? 'BSE' : 'NSE';

      const quantity = qtyCol ? parseNumericCell(row[qtyCol], 0) : 0;
      const averagePrice = avgBuyPriceCol ? parseNumericCell(row[avgBuyPriceCol], 0) : 0;
      const ltp = ltpCol ? parseNumericCell(row[ltpCol], 0) : averagePrice;
      const curVal = curValCol ? parseNumericCell(row[curValCol], 0) : (quantity * ltp);
      const pnl = pnlCol ? parseNumericCell(row[pnlCol], 0) : (curVal - (quantity * averagePrice));
      const pnlPct = pnlPctCol ? parseNumericCell(row[pnlPctCol], 0) : (averagePrice > 0 ? ((ltp - averagePrice) / averagePrice) * 100 : 0);

      const holding: FinappHolding = {
        symbol: rawSymbol.toUpperCase(),
        isin: isin ? isin.toUpperCase() : undefined,
        quantity,
        averagePrice,
        currentPrice: ltp,
        closePrice: ltp,
        pnl,
        pnlPercentage: pnlPct,
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
      brokerType: 'DHAN',
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
