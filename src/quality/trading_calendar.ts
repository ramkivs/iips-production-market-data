/** Offline, explicit-date equity calendar. No weekday/holiday inference or network IO. */
export type EquityExchange = 'NSE' | 'BSE';
export interface TradingCalendarDay {
  readonly exchange: EquityExchange;
  readonly date: string; // Asia/Kolkata YYYY-MM-DD
  readonly status: 'OPEN' | 'CLOSED' | 'UNKNOWN';
  /** UTC/offset-qualified instants; OPEN days can include an exceptional short session. */
  readonly sessions: readonly { readonly opensAt: string; readonly closesAt: string }[];
  readonly source: string;
}
export interface TradingCalendar {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: string;
  readonly reviewedBy: string;
  readonly days: readonly TradingCalendarDay[];
}
export const istDate = (ms: number): string => new Date(ms + 330 * 60_000).toISOString().slice(0, 10);
export const explicitInstant = (s: string): boolean => typeof s === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s));
export function validCalendarDate(s: string): boolean {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
}

/** Validate and detach/freeze an input snapshot. A bad local file must fail startup, not guess. */
export function parseTradingCalendar(raw: unknown): TradingCalendar {
  const c = raw as TradingCalendar;
  if (!c || c.schemaVersion !== 1 || typeof c.id !== 'string' || !c.id.trim() || typeof c.version !== 'string' || !c.version.trim() || typeof c.reviewedBy !== 'string' || !c.reviewedBy.trim() || !Array.isArray(c.days)) throw new Error('INVALID_TRADING_CALENDAR');
  const seen = new Set<string>();
  for (const d of c.days) {
    if (!d || !['NSE', 'BSE'].includes(d.exchange) || !validCalendarDate(d.date) || !['OPEN', 'CLOSED', 'UNKNOWN'].includes(d.status) || typeof d.source !== 'string' || !d.source.trim() || !Array.isArray(d.sessions)) throw new Error('INVALID_TRADING_CALENDAR_DAY');
    const key = `${d.exchange}:${d.date}`;
    if (seen.has(key)) throw new Error('DUPLICATE_TRADING_CALENDAR_DAY');
    seen.add(key);
    if ((d.status === 'OPEN') !== (d.sessions.length > 0)) throw new Error('INVALID_TRADING_CALENDAR_SESSIONS');
    let previousClose = -Infinity;
    for (const s of d.sessions) {
      if (!s || !explicitInstant(s.opensAt) || !explicitInstant(s.closesAt)) throw new Error('INVALID_TRADING_CALENDAR_SESSION');
      const open = Date.parse(s.opensAt), close = Date.parse(s.closesAt);
      if (open >= close || open < previousClose || istDate(open) !== d.date || istDate(close) !== d.date) throw new Error('INVALID_TRADING_CALENDAR_SESSION');
      previousClose = close;
    }
  }
  return Object.freeze({ ...c, days: Object.freeze(c.days.map(d => Object.freeze({ ...d, sessions: Object.freeze(d.sessions.map((s: TradingCalendarDay['sessions'][number]) => Object.freeze({ ...s }))) }))) });
}

export type SessionFreshnessContext = {
  readonly calendar: TradingCalendar;
  readonly exchange: EquityExchange;
} & ({ readonly kind: 'QUOTE' } | { readonly kind: 'DAILY_CLOSE'; readonly observationDate: string; readonly completed: boolean });
