/**
 * Current NSE CM-UDiFF Common Bhavcopy Final schema and equity eligibility filter.
 *
 * CM-UDiFF is the Unified Distilled File Format mandated by SEBI/NSE since July 08, 2024,
 * replacing the discontinued legacy Bhavcopy CSV.
 *
 * In CM-UDiFF:
 * - Segment: Sgmt === 'CM' (Capital Market)
 * - Instrument Type: FinInstrmTp === 'STK' or 'EQ' (Equity shares)
 * - Security Series: SctySrs === 'EQ' (normal equity) or 'BE' (trade-for-trade equity)
 * - Non-equity instruments: debt (GB, GS, SG, NH, etc.), bonds, mutual funds, warrants, futures, options must be filtered out.
 */

export interface RawUdiffRecord {
  TradDt?: string;
  BizDt?: string;
  Sgmt?: string;
  Src?: string;
  FinInstrmTp?: string;
  FinInstrmId?: string;
  ISIN?: string;
  TckrSymb?: string;
  SctySrs?: string;
  FinInstrmNm?: string;
  OpnPric?: string | number;
  HghPric?: string | number;
  LwPric?: string | number;
  ClsPric?: string | number;
  LastPric?: string | number;
  PrvsClsgPric?: string | number;
  TtlTradgVol?: string | number;
  TtlTrfVal?: string | number;
  TtlNbOfTxsExctd?: string | number;
  [key: string]: unknown;
}

export const ELIGIBLE_EQUITY_SERIES = Object.freeze(new Set(['EQ', 'BE', 'BZ', 'SM']));
export const ELIGIBLE_FIN_INSTRM_TP = Object.freeze(new Set(['STK', 'EQ']));

/**
 * Checks if a CM-UDiFF record qualifies as an eligible NSE equity.
 * Debt, NCDs, mutual funds, derivatives, warrants, and indices are strictly excluded.
 */
export function isEligibleEquity(row: RawUdiffRecord): boolean {
  if (!row) return false;

  const segment = String(row.Sgmt || '').trim().toUpperCase();
  if (segment && segment !== 'CM') {
    return false;
  }

  const instType = String(row.FinInstrmTp || '').trim().toUpperCase();
  if (instType && !ELIGIBLE_FIN_INSTRM_TP.has(instType)) {
    return false;
  }

  const series = String(row.SctySrs || '').trim().toUpperCase();
  if (!ELIGIBLE_EQUITY_SERIES.has(series)) {
    return false;
  }

  const isin = String(row.ISIN || '').trim();
  // Valid Indian equity ISINs begin with INE (or IN9 for partly paid)
  if (!isin || !isin.startsWith('IN')) {
    return false;
  }

  const symbol = String(row.TckrSymb || '').trim();
  if (!symbol) {
    return false;
  }

  return true;
}

export interface ParseResult {
  readonly rows: RawUdiffRecord[];
  readonly rawCount: number;
  readonly parseErrors: string[];
}

/**
 * Parses a CM-UDiFF CSV string into raw record objects.
 * Handles header normalization and trims whitespace.
 */
export function parseUdiffCsv(csvContent: string): ParseResult {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], rawCount: 0, parseErrors: ['Empty CSV content'] };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: RawUdiffRecord[] = [];
  const parseErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle standard CSV commas while preserving quoted strings
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    if (values.length !== headers.length) {
      parseErrors.push(`Line ${i + 1}: column count mismatch (expected ${headers.length}, got ${values.length})`);
      continue;
    }

    const rowObj: RawUdiffRecord = {};
    for (let h = 0; h < headers.length; h++) {
      rowObj[headers[h]] = values[h];
    }
    rows.push(rowObj);
  }

  return {
    rows,
    rawCount: rows.length,
    parseErrors,
  };
}
