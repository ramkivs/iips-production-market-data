/**
 * Institutional Investment Platform System (IIPS)
 * Zero-Dependency CSV Parsing Utility for Broker Adapters (BI-04)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-04-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

/**
 * Splits CSV line into cells while respecting quotes and commas inside quotes.
 */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

/**
 * Parses full CSV text into array of rows (each row is string array).
 */
export function parseCsvRows(csvText: string): string[][] {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const rows: string[][] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(parseCsvLine(trimmed));
  }

  return rows;
}

/**
 * Parses CSV text into header list and structured key-value object rows.
 */
export function parseCsvToObjects(
  csvText: string,
  options?: { skipHeaderRows?: number }
): { headers: string[]; rows: Array<Record<string, string>> } {
  const allRows = parseCsvRows(csvText);
  const skip = options?.skipHeaderRows ?? 0;

  if (allRows.length <= skip) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = allRows[skip];
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const resultRows: Array<Record<string, string>> = [];

  for (let i = skip + 1; i < allRows.length; i++) {
    const row = allRows[i];
    const rowObj: Record<string, string> = {};
    let hasData = false;

    for (let j = 0; j < headers.length; j++) {
      const headerKey = headers[j];
      const val = row[j] !== undefined ? row[j].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[headerKey] = val;
      if (val !== '') hasData = true;
    }

    if (hasData) {
      resultRows.push(rowObj);
    }
  }

  return { headers, rows: resultRows };
}

/**
 * Robust numeric parser that handles comma separators, currency symbols, and percentages.
 */
export function parseNumericCell(val: unknown, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  const str = String(val).replace(/[₹$,%\s]/g, '').trim();
  if (!str) return fallback;

  const parsed = Number(str);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Cleans and trims string cell values.
 */
export function parseStringCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/^["']|["']$/g, '').trim();
}
