/**
 * Deterministic NSE Capital Market Trading Session Calendar.
 *
 * Requirements:
 * - Generates valid trading session dates between start and end dates.
 * - Excludes standard statutory weekend sessions (Saturdays & Sundays).
 * - Excludes known statutory NSE equity market holidays (Republic Day, Independence Day,
 *   Diwali, Mahavir Jayanti, Good Friday, Eid, Gandhi Jayanti, Christmas, etc.).
 * - Configurable for arbitrary historical ranges (e.g. 10 years / 2016–2026).
 * - Deterministic, pure functions with no network dependency.
 */

export class NseTradingCalendar {
  // Known fixed-date national holidays (MM-DD)
  private static readonly FIXED_HOLIDAYS = new Set([
    '01-26', // Republic Day
    '05-01', // Maharashtra Day / Labour Day
    '08-15', // Independence Day
    '10-02', // Mahatma Gandhi Jayanti
    '12-25', // Christmas
  ]);

  // Specific annual holidays (YYYY-MM-DD) for festival holidays with variable dates
  private static readonly OBSERVED_HOLIDAYS = new Set([
    // 2024
    '2024-01-22', // Ram Mandir Consecration
    '2024-03-08', // Mahashivratri
    '2024-03-25', // Holi
    '2024-03-29', // Good Friday
    '2024-04-11', // Id-Ul-Fitr
    '2024-04-17', // Shri Ram Navami
    '2024-06-17', // Bakri Id
    '2024-07-17', // Muharram
    '2024-11-01', // Diwali Laxmi Pujan
    '2024-11-15', // Gurunanak Jayanti
    '2024-11-20', // Maharashtra Assembly Election
    // 2025
    '2025-02-26', // Mahashivratri
    '2025-03-14', // Holi
    '2025-03-31', // Id-Ul-Fitr
    '2025-04-10', // Shri Mahavir Jayanti
    '2025-04-14', // Dr. Baba Saheb Ambedkar Jayanti
    '2025-04-18', // Good Friday
    '2025-08-27', // Ganesh Chaturthi
    '2025-10-21', // Diwali Laxmi Pujan
    '2025-10-22', // Diwali Balipratipada
    '2025-11-05', // Prakash Gurpurb
    // 2026
    '2026-03-03', // Holi
    '2026-03-20', // Id-Ul-Fitr
    '2026-04-03', // Good Friday
    '2026-04-14', // Ambedkar Jayanti
    '2026-05-27', // Bakri Id
    '2026-11-08', // Diwali
    '2026-11-24', // Gurunanak Jayanti
  ]);

  /**
   * Evaluates if a given date string (YYYY-MM-DD) is a valid NSE trading session.
   */
  public static isTradingDay(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = date.getUTCDay();

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (this.FIXED_HOLIDAYS.has(mmdd)) {
      return false;
    }

    if (this.OBSERVED_HOLIDAYS.has(dateStr)) {
      return false;
    }

    return true;
  }

  /**
   * Generates a sorted array of trading session date strings (YYYY-MM-DD) between startDate and endDate.
   */
  public static generateTradingDays(startDate: string, endDate: string): string[] {
    if (startDate > endDate) {
      return [];
    }

    const sessions: string[] = [];
    let current = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (this.isTradingDay(dateStr)) {
        sessions.push(dateStr);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return sessions;
  }

  /**
   * Generates trading days for the default 10-year historical backfill window.
   */
  public static generate10YearWindow(asOfDate: string = new Date().toISOString().split('T')[0]): string[] {
    const d = new Date(`${asOfDate}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - 10);
    const startDate = d.toISOString().split('T')[0];
    return this.generateTradingDays(startDate, asOfDate);
  }
}
