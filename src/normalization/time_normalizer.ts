/**
 * Institutional Investment Platform System (IIPS)
 * Timestamp & Timezone Normalization Engine (P06 / P01-02)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

/**
 * Normalizes any timestamp representation into a strict ISO-8601 UTC string.
 * Supports Unix epoch seconds, epoch milliseconds, ISO strings, and IST strings.
 */
export function normalizeToUtcIso(input: string | number | Date): string {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error('Invalid Date object provided');
    }
    return input.toISOString();
  }

  if (typeof input === 'number') {
    // Determine whether seconds or milliseconds
    const ms = input < 1e11 ? input * 1000 : input;
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid numeric timestamp: ${input}`);
    }
    return date.toISOString();
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();

    // Check DD/MM/YYYY format commonly used in Indian disclosures
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      return d.toISOString();
    }

    const parsedMs = Date.parse(trimmed);
    if (isNaN(parsedMs)) {
      throw new Error(`Unparseable date/timestamp string: ${input}`);
    }
    return new Date(parsedMs).toISOString();
  }

  throw new Error(`Unsupported timestamp input type: ${typeof input}`);
}

/**
 * Returns whether a given string is a valid ISO-8601 UTC timestamp ending in 'Z'.
 */
export function isStrictUtcIso(timestamp: string): boolean {
  if (typeof timestamp !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp) && !isNaN(Date.parse(timestamp));
}
