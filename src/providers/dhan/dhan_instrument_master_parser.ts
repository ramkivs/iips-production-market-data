/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P7 — parser for the official Dhan instrument master (detailed CSV).
 *
 * The parser trusts the OBSERVED header row, never a hardcoded positional
 * schema. OBSERVED on the published snapshots (evidence/dhan-p7/source,
 * retrieved 2026-11-06, hashes in source-retrieval-manifest.json):
 *   detailed: EXCH_ID, SEGMENT, SECURITY_ID, ISIN, INSTRUMENT,
 *             UNDERLYING_SECURITY_ID, UNDERLYING_SYMBOL, SYMBOL_NAME,
 *             DISPLAY_NAME, INSTRUMENT_TYPE, SERIES, LOT_SIZE, ...
 *             (SECURITY_ID, NOT SEM_SMST_SECURITY_ID; carries ISIN + SERIES)
 *   compact:  SEM_EXM_EXCH_ID, SEM_SEGMENT, SEM_SMST_SECURITY_ID,
 *             SEM_INSTRUMENT_NAME, ..., SEM_SERIES, SM_SYMBOL_NAME
 *             (carries NO ISIN column)
 */

export const DETAILED_REQUIRED_COLUMNS = [
  'EXCH_ID',
  'SEGMENT',
  'SECURITY_ID',
  'ISIN',
  'INSTRUMENT',
  'SERIES',
] as const;

export const COMPACT_REQUIRED_COLUMNS = [
  'SEM_EXM_EXCH_ID',
  'SEM_SEGMENT',
  'SEM_SMST_SECURITY_ID',
  'SEM_SERIES',
  'SEM_INSTRUMENT_NAME',
] as const;

export interface RawInstrumentRecord {
  readonly lineNumber: number;
  readonly values: Record<string, string>;
}

export interface ParsedInstrumentMaster {
  readonly headers: readonly string[];
  readonly records: readonly RawInstrumentRecord[];
  readonly schemaError: string | null;
}

/** Minimal RFC-4180-style CSV splitter (quoted fields, escaped quotes, CRLF). */
export function splitCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseInstrumentMasterCsv(
  text: string,
  requiredColumns: readonly string[] = DETAILED_REQUIRED_COLUMNS,
): ParsedInstrumentMaster {
  const rows = splitCsv(text);
  if (rows.length === 0) {
    return { headers: [], records: [], schemaError: 'empty CSV: no header row' };
  }
  const headers = rows[0]!.map((h) => h.trim());
  const missing = requiredColumns.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    return {
      headers,
      records: [],
      schemaError: `missing required columns: ${missing.join(', ')}; observed: ${headers.join(', ')}`,
    };
  }
  const records: RawInstrumentRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const values: Record<string, string> = {};
    const row = rows[i]!;
    for (let c = 0; c < headers.length; c++) {
      values[headers[c]!] = (row[c] ?? '').trim();
    }
    records.push({ lineNumber: i + 1, values });
  }
  return { headers, records, schemaError: null };
}
