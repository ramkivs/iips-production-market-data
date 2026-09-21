/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Legacy NSE Bhavcopy Parser (Pre-July 2024 Format)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { OHLCVCandle } from '../contracts/d02_ohlcv.js';
import { buildD114SecurityIdentity } from '../contracts/types.js';
import { normalizeToUtcIso } from '../normalization/time_normalizer.js';

export interface LegacyBhavcopyRawRecord {
  SYMBOL: string;
  SERIES: string;
  OPEN: string;
  HIGH: string;
  LOW: string;
  CLOSE: string;
  LAST: string;
  PREVCLOSE: string;
  TOTTRDQTY: string;
  TOTTRDVAL: string;
  TIMESTAMP: string; // DD-MMM-YYYY (e.g. 15-SEP-2023)
  TOTALTRADES?: string;
  ISIN: string;
  [key: string]: string | undefined;
}

export interface LegacyBhavcopyValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{ row: number; field: string; error: string }>;
  headerPresent: boolean;
  discoveredHeaders: string[];
  missingRequiredHeaders: string[];
}

export class LegacyBhavcopyParser {
  public static readonly REQUIRED_HEADERS = [
    'SYMBOL',
    'SERIES',
    'OPEN',
    'HIGH',
    'LOW',
    'CLOSE',
    'LAST',
    'PREVCLOSE',
    'TOTTRDQTY',
    'TOTTRDVAL',
    'TIMESTAMP',
    'ISIN',
  ];

  private static readonly MONTH_MAP: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  /**
   * Converts legacy DD-MMM-YYYY timestamp (e.g. 15-SEP-2023) into strict ISO YYYY-MM-DD.
   */
  public static parseLegacyDate(dateStr: string): string {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = LegacyBhavcopyParser.MONTH_MAP[parts[1].toUpperCase()] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  /**
   * Constructs legacy archive URL and filename for a given ISO date.
   * Format: https://nsearchives.nseindia.com/content/historical/EQUITIES/YYYY/MMM/cmDDMMMYYYYbhav.csv.zip
   */
  public static getLegacyArchiveUrl(dateIso: string): { filename: string; url: string } {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    const year = d.getUTCFullYear().toString();
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[d.getUTCMonth()];
    const dayStr = d.getUTCDate().toString().padStart(2, '0');

    const filename = `cm${dayStr}${monthStr}${year}bhav.csv.zip`;
    const url = `https://nsearchives.nseindia.com/content/historical/EQUITIES/${year}/${monthStr}/${filename}`;
    return { filename, url };
  }

  /**
   * Parses raw legacy CSV text into structured records.
   */
  public static parseCsv(csvText: string): { headers: string[]; records: LegacyBhavcopyRawRecord[] } {
    if (!csvText || csvText.trim().length === 0) {
      return { headers: [], records: [] };
    }

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { headers: [], records: [] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const records: LegacyBhavcopyRawRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = cols[j] !== undefined ? cols[j] : '';
      }
      records.push(record as unknown as LegacyBhavcopyRawRecord);
    }

    return { headers, records };
  }

  /**
   * Validates schema conformance of legacy Bhavcopy records.
   */
  public static validateSchema(headers: string[], records: LegacyBhavcopyRawRecord[]): LegacyBhavcopyValidationResult {
    const missingHeaders = LegacyBhavcopyParser.REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    const headerPresent = missingHeaders.length === 0;
    const errors: Array<{ row: number; field: string; error: string }> = [];

    if (!headerPresent) {
      errors.push({
        row: 0,
        field: 'headers',
        error: `Missing required legacy Bhavcopy headers: ${missingHeaders.join(', ')}`,
      });
    }

    let validRows = 0;
    let invalidRows = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      let rowValid = true;

      if (!row.SYMBOL || row.SYMBOL.trim().length === 0) {
        errors.push({ row: i + 1, field: 'SYMBOL', error: 'Missing symbol' });
        rowValid = false;
      }
      if (!row.SERIES || row.SERIES.trim().length === 0) {
        errors.push({ row: i + 1, field: 'SERIES', error: 'Missing security series' });
        rowValid = false;
      }
      if (!row.ISIN || row.ISIN.length !== 12) {
        errors.push({ row: i + 1, field: 'ISIN', error: `Invalid ISIN: ${row.ISIN}` });
        rowValid = false;
      }
      if (isNaN(parseFloat(row.CLOSE))) {
        errors.push({ row: i + 1, field: 'CLOSE', error: `Non-numeric close price: ${row.CLOSE}` });
        rowValid = false;
      }

      if (rowValid) validRows++;
      else invalidRows++;
    }

    return {
      isValid: headerPresent && invalidRows === 0 && records.length > 0,
      totalRows: records.length,
      validRows,
      invalidRows,
      errors,
      headerPresent,
      discoveredHeaders: headers,
      missingRequiredHeaders: missingHeaders,
    };
  }

  /**
   * Normalizes a legacy Bhavcopy record into a canonical D01 MarketQuotePayload.
   */
  public static toCanonicalQuote(row: LegacyBhavcopyRawRecord): MarketQuotePayload {
    const ltp = parseFloat(row.LAST || row.CLOSE || '0');
    const prevClose = parseFloat(row.PREVCLOSE || '0');
    const change = Number((ltp - prevClose).toFixed(2));
    const pctChange = prevClose !== 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    return {
      companyId: row.SYMBOL,
      symbol: row.SYMBOL,
      securityIdentity: buildD114SecurityIdentity(row.ISIN, row.SERIES),
      exchange: 'NSE',
      currency: 'INR',
      bid: ltp,
      ask: ltp,
      ltp,
      open: parseFloat(row.OPEN || row.CLOSE || '0'),
      high: parseFloat(row.HIGH || row.CLOSE || '0'),
      low: parseFloat(row.LOW || row.CLOSE || '0'),
      previousClose: prevClose,
      volume: parseInt(row.TOTTRDQTY || '0', 10),
      change,
      pctChange,
    };
  }

  /**
   * Normalizes a legacy Bhavcopy record into a canonical D02 OHLCVCandle (1D).
   */
  public static toCanonicalOHLCV(row: LegacyBhavcopyRawRecord): OHLCVCandle {
    const isoDate = LegacyBhavcopyParser.parseLegacyDate(row.TIMESTAMP);
    const candleStart = `${isoDate}T09:15:00.000Z`;
    const candleEnd = `${isoDate}T15:30:00.000Z`;

    return {
      companyId: row.SYMBOL,
      symbol: row.SYMBOL,
      securityIdentity: buildD114SecurityIdentity(row.ISIN, row.SERIES),
      interval: '1d',
      candleStart,
      candleEnd,
      open: parseFloat(row.OPEN || row.CLOSE || '0'),
      high: parseFloat(row.HIGH || row.CLOSE || '0'),
      low: parseFloat(row.LOW || row.CLOSE || '0'),
      close: parseFloat(row.CLOSE || '0'),
      volume: parseInt(row.TOTTRDQTY || '0', 10),
      isAdjusted: false,
    };
  }
}
