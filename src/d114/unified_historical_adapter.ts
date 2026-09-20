/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Unified Historical Archive Adapter (Dual Era Bridge)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { CmUdiffParser, CmUdiffRawRecord } from './cm_udiff_parser.js';
import { LegacyBhavcopyParser, LegacyBhavcopyRawRecord } from './legacy_bhavcopy_parser.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { OHLCVCandle } from '../contracts/d02_ohlcv.js';

export type HistoricalArchiveFormat = 'CM_UDIFF' | 'LEGACY_BHAVCOPY' | 'UNKNOWN';

export interface UnifiedParsedArchive {
  format: HistoricalArchiveFormat;
  isValid: boolean;
  totalRecords: number;
  quotes: MarketQuotePayload[];
  candles: OHLCVCandle[];
  error?: string;
}

export class UnifiedHistoricalAdapter {
  /**
   * Fingerprints CSV headers to determine archive format era.
   */
  public static detectFormat(headers: string[]): HistoricalArchiveFormat {
    if (headers.includes('TradDt') && headers.includes('TckrSymb') && headers.includes('ClsPric')) {
      return 'CM_UDIFF';
    }
    if (headers.includes('SYMBOL') && headers.includes('CLOSE') && headers.includes('TIMESTAMP')) {
      return 'LEGACY_BHAVCOPY';
    }
    return 'UNKNOWN';
  }

  /**
   * Parses raw CSV content from either era into canonical D01/D02 representations.
   */
  public static parseAndNormalize(csvText: string): UnifiedParsedArchive {
    if (!csvText || csvText.trim().length === 0) {
      return {
        format: 'UNKNOWN',
        isValid: false,
        totalRecords: 0,
        quotes: [],
        candles: [],
        error: 'Empty CSV content',
      };
    }

    const firstLine = csvText.split(/\r?\n/)[0] || '';
    const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const format = UnifiedHistoricalAdapter.detectFormat(headers);

    if (format === 'CM_UDIFF') {
      const { headers: h, records } = CmUdiffParser.parseCsv(csvText);
      const validation = CmUdiffParser.validateSchema(h, records);
      if (!validation.isValid) {
        return {
          format: 'CM_UDIFF',
          isValid: false,
          totalRecords: records.length,
          quotes: [],
          candles: [],
          error: `CM-UDiFF schema validation failed: ${validation.errors.map((e) => e.error).join('; ')}`,
        };
      }

      const quotes = records.map((r) => CmUdiffParser.toCanonicalQuote(r));
      const candles = records.map((r) => CmUdiffParser.toCanonicalOHLCV(r));

      return {
        format: 'CM_UDIFF',
        isValid: true,
        totalRecords: records.length,
        quotes,
        candles,
      };
    }

    if (format === 'LEGACY_BHAVCOPY') {
      const { headers: h, records } = LegacyBhavcopyParser.parseCsv(csvText);
      const validation = LegacyBhavcopyParser.validateSchema(h, records);
      if (!validation.isValid) {
        return {
          format: 'LEGACY_BHAVCOPY',
          isValid: false,
          totalRecords: records.length,
          quotes: [],
          candles: [],
          error: `Legacy Bhavcopy schema validation failed: ${validation.errors.map((e) => e.error).join('; ')}`,
        };
      }

      const quotes = records.map((r) => LegacyBhavcopyParser.toCanonicalQuote(r));
      const candles = records.map((r) => LegacyBhavcopyParser.toCanonicalOHLCV(r));

      return {
        format: 'LEGACY_BHAVCOPY',
        isValid: true,
        totalRecords: records.length,
        quotes,
        candles,
      };
    }

    return {
      format: 'UNKNOWN',
      isValid: false,
      totalRecords: 0,
      quotes: [],
      candles: [],
      error: `Unrecognized archive header structure: ${headers.slice(0, 5).join(', ')}...`,
    };
  }
}
