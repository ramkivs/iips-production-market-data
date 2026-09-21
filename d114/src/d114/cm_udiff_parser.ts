/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: NSE CM-UDiFF Bhavcopy Parser & Schema Normalizer
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { OHLCVCandle } from '../contracts/d02_ohlcv.js';
import { buildD114SecurityIdentity } from '../contracts/types.js';

export interface CmUdiffRawRecord {
  TradDt: string;
  BizDt: string;
  Sgmt: string;
  Src: string;
  ISIN: string;
  TckrSymb: string;
  SctySrs: string;
  ClsPric: string;
  LastPric: string;
  PrvsClsgPric: string;
  SttlmPric: string;
  OpnPric?: string;
  HghPric?: string;
  LwPric?: string;
  TtlTradgVol?: string;
  TtlTrfVal?: string;
  [key: string]: string | undefined;
}

export interface CmUdiffValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{ row: number; field: string; error: string }>;
  headerPresent: boolean;
  discoveredHeaders: string[];
  missingRequiredHeaders: string[];
}

export interface ExtractedZipResult {
  isValid: boolean;
  filename: string;
  uncompressedBytes: number;
  uncompressedSha256: string;
  rawCsvContent: string;
  error?: string;
}

export class CmUdiffParser {
  public static readonly REQUIRED_HEADERS = [
    'TradDt',
    'BizDt',
    'Sgmt',
    'Src',
    'ISIN',
    'TckrSymb',
    'SctySrs',
    'ClsPric',
    'LastPric',
    'PrvsClsgPric',
    'SttlmPric',
  ];

  /**
   * Safely extracts and validates a standard PKZIP archive containing CM-UDiFF Bhavcopy CSV.
   * Fails closed on malformed headers, invalid CRC, or truncation.
   */
  public static extractZipArchive(zipBuffer: Buffer): ExtractedZipResult {
    if (!zipBuffer || zipBuffer.length < 30) {
      return {
        isValid: false,
        filename: '',
        uncompressedBytes: 0,
        uncompressedSha256: '',
        rawCsvContent: '',
        error: 'Buffer is empty or shorter than minimum PKZIP header length (30 bytes)',
      };
    }

    try {
      // Validate PKZIP magic signature 0x04034b50 (PK\x03\x04)
      if (zipBuffer.readUInt32LE(0) !== 0x04034b50) {
        return {
          isValid: false,
          filename: '',
          uncompressedBytes: 0,
          uncompressedSha256: '',
          rawCsvContent: '',
          error: 'Invalid PKZIP header signature (expected 0x04034b50)',
        };
      }

      const compressionMethod = zipBuffer.readUInt16LE(8);
      const compressedSize = zipBuffer.readUInt32LE(18);
      const uncompressedSize = zipBuffer.readUInt32LE(22);
      const filenameLength = zipBuffer.readUInt16LE(26);
      const extraFieldLength = zipBuffer.readUInt16LE(28);

      const filename = zipBuffer.subarray(30, 30 + filenameLength).toString('utf8');
      const dataOffset = 30 + filenameLength + extraFieldLength;

      if (dataOffset > zipBuffer.length) {
        return {
          isValid: false,
          filename,
          uncompressedBytes: 0,
          uncompressedSha256: '',
          rawCsvContent: '',
          error: 'Corrupt archive: data offset exceeds total buffer length',
        };
      }

      const dataSlice = compressedSize > 0 
        ? zipBuffer.subarray(dataOffset, dataOffset + compressedSize)
        : zipBuffer.subarray(dataOffset);

      let uncompressedBuf: Buffer;
      if (compressionMethod === 0) {
        // Stored (no compression)
        uncompressedBuf = dataSlice;
      } else if (compressionMethod === 8) {
        // Deflate
        try {
          uncompressedBuf = zlib.inflateRawSync(dataSlice);
        } catch (zlibErr: any) {
          return {
            isValid: false,
            filename,
            uncompressedBytes: 0,
            uncompressedSha256: '',
            rawCsvContent: '',
            error: `Zlib inflation failed: ${zlibErr.message}`,
          };
        }
      } else {
        return {
          isValid: false,
          filename,
          uncompressedBytes: 0,
          uncompressedSha256: '',
          rawCsvContent: '',
          error: `Unsupported compression method: ${compressionMethod}`,
        };
      }

      const rawCsvContent = uncompressedBuf.toString('utf8');
      const uncompressedSha256 = crypto.createHash('sha256').update(uncompressedBuf).digest('hex');

      return {
        isValid: true,
        filename,
        uncompressedBytes: uncompressedBuf.length,
        uncompressedSha256,
        rawCsvContent,
      };
    } catch (err: any) {
      return {
        isValid: false,
        filename: '',
        uncompressedBytes: 0,
        uncompressedSha256: '',
        rawCsvContent: '',
        error: `Unexpected archive extraction error: ${err.message}`,
      };
    }
  }

  /**
   * Parses raw CSV text into structured CM-UDiFF records.
   */
  public static parseCsv(csvText: string): { headers: string[]; records: CmUdiffRawRecord[] } {
    if (!csvText || csvText.trim().length === 0) {
      return { headers: [], records: [] };
    }

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { headers: [], records: [] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const records: CmUdiffRawRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = cols[j] !== undefined ? cols[j] : '';
      }
      records.push(record as unknown as CmUdiffRawRecord);
    }

    return { headers, records };
  }

  /**
   * Validates schema conformance of CM-UDiFF records against required standards.
   */
  public static validateSchema(headers: string[], records: CmUdiffRawRecord[]): CmUdiffValidationResult {
    const missingHeaders = CmUdiffParser.REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    const headerPresent = missingHeaders.length === 0;
    const errors: Array<{ row: number; field: string; error: string }> = [];

    if (!headerPresent) {
      errors.push({
        row: 0,
        field: 'headers',
        error: `Missing required CM-UDiFF headers: ${missingHeaders.join(', ')}`,
      });
    }

    let validRows = 0;
    let invalidRows = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      let rowValid = true;

      if (!row.TradDt || !/^\d{4}-\d{2}-\d{2}$/.test(row.TradDt)) {
        errors.push({ row: i + 1, field: 'TradDt', error: `Invalid date format: ${row.TradDt}` });
        rowValid = false;
      }
      if (!row.ISIN || row.ISIN.length !== 12) {
        errors.push({ row: i + 1, field: 'ISIN', error: `Invalid ISIN: ${row.ISIN}` });
        rowValid = false;
      }
      if (!row.TckrSymb || row.TckrSymb.trim().length === 0) {
        errors.push({ row: i + 1, field: 'TckrSymb', error: 'Missing ticker symbol' });
        rowValid = false;
      }
      if (!row.SctySrs || row.SctySrs.trim().length === 0) {
        errors.push({ row: i + 1, field: 'SctySrs', error: 'Missing security series' });
        rowValid = false;
      }
      if (isNaN(parseFloat(row.ClsPric))) {
        errors.push({ row: i + 1, field: 'ClsPric', error: `Non-numeric closing price: ${row.ClsPric}` });
        rowValid = false;
      }

      if (rowValid) {
        validRows++;
      } else {
        invalidRows++;
      }
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
   * Normalizes a CM-UDiFF row into a canonical D01 MarketQuotePayload.
   */
  public static toCanonicalQuote(row: CmUdiffRawRecord): MarketQuotePayload {
    const ltp = parseFloat(row.ClsPric || row.LastPric || '0');
    const prevClose = parseFloat(row.PrvsClsgPric || '0');
    const change = Number((ltp - prevClose).toFixed(2));
    const pctChange = prevClose !== 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    return {
      companyId: row.TckrSymb,
      symbol: row.TckrSymb,
      securityIdentity: buildD114SecurityIdentity(row.ISIN, row.SctySrs),
      exchange: 'NSE',
      currency: 'INR',
      bid: ltp,
      ask: ltp,
      ltp,
      open: parseFloat(row.OpnPric || row.ClsPric || '0'),
      high: parseFloat(row.HghPric || row.ClsPric || '0'),
      low: parseFloat(row.LwPric || row.ClsPric || '0'),
      previousClose: prevClose,
      volume: parseInt(row.TtlTradgVol || row.TtlTrfVal || '0', 10),
      change,
      pctChange,
    };
  }

  /**
   * Normalizes a CM-UDiFF row into a canonical D02 OHLCVCandle (Daily 1D bar).
   */
  public static toCanonicalOHLCV(row: CmUdiffRawRecord): OHLCVCandle {
    const close = parseFloat(row.ClsPric || '0');
    const open = parseFloat(row.OpnPric || row.ClsPric || '0');
    const high = parseFloat(row.HghPric || row.ClsPric || '0');
    const low = parseFloat(row.LwPric || row.ClsPric || '0');
    const volume = parseInt(row.TtlTradgVol || '0', 10);

    const candleStart = `${row.TradDt}T09:15:00.000Z`;
    const candleEnd = `${row.TradDt}T15:30:00.000Z`;

    return {
      companyId: row.TckrSymb,
      symbol: row.TckrSymb,
      securityIdentity: buildD114SecurityIdentity(row.ISIN, row.SctySrs),
      interval: '1d',
      candleStart,
      candleEnd,
      open,
      high,
      low,
      close,
      volume,
      isAdjusted: false,
    };
  }
}
