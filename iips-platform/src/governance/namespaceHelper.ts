/**
 * Helper function to namespace baseline input fields for test compatibility.
 * 
 * Converts bare field names to MD:<domain>.<field> format.
 * This is a test utility — production code should receive already-namespaced fields
 * from the market-data ingestion layer.
 * 
 * Format: MD:<domain>.<field> where field is the bare field name.
 */
import { NAMESPACE_TOKEN } from './NamespaceCollisionGuard';

/** Map field names to their appropriate domain. */
const FIELD_DOMAIN_MAP: Record<string, string> = {
  // D01: price/valuation
  'price': 'D01', 'open': 'D01', 'high': 'D01', 'low': 'D01', 'close': 'D01',
  'peRatio': 'D01', 'evEbitda': 'D01', 'evRevenue': 'D01', 'fcfYield': 'D01',
  'pbRatio': 'D01', 'psRatio': 'D01', 'dividendYield': 'D01',
  // D02: OHLCV
  'volume': 'D02', 'vwap': 'D02', 'turnover': 'D02',
  // D03: fundamentals
  'revenue': 'D03', 'netIncome': 'D03', 'ebitda': 'D03',
  'totalAssets': 'D03', 'totalLiabilities': 'D03', 'equity': 'D03',
  'cash': 'D03', 'debt': 'D03', 'roic': 'D03', 'roce': 'D03',
  'ebitdaMargin': 'D03', 'debtEbitda': 'D03', 'revenueGrowth': 'D03',
  'grossMargin': 'D03', 'operatingMargin': 'D03', 'netMargin': 'D03',
  'currentRatio': 'D03', 'quickRatio': 'D03', 'assetTurnover': 'D03',
  'inventoryTurnover': 'D03', 'receivablesTurnover': 'D03',
  'returnOnAssets': 'D03', 'returnOnEquity': 'D03',
  // D04: corporate actions
  'dividend': 'D04', 'split': 'D04', 'merger': 'D04',
  // D05: identity
  'id': 'D05', 'ticker': 'D05', 'name': 'D05', 'sector': 'D05',
  'industry': 'D05', 'segment': 'D05', 'subsegment': 'D05',
  'archetype': 'D05', 'businessModel': 'D05', 'companyName': 'D05',
  // D06: news
  'headline': 'D06', 'sentiment': 'D06',
  // D07: estimates
  'consensus': 'D07', 'estimate': 'D07', 'target': 'D07',
  // D08: macro
  'gdp': 'D08', 'inflation': 'D08', 'interestRate': 'D08',
  // D09: alternative data
  'webTraffic': 'D09', 'appDownloads': 'D09',
  // D10: venue
  'exchange': 'D10', 'mic': 'D10', 'country': 'D10', 'currency': 'D10',
};

/**
 * Namespace a record of bare field names for test compatibility.
 * Unknown fields are placed in D03 as a default.
 * 
 * Format: MD:<domain>.<field> where field is the bare field name.
 */
export function namespaceFields(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith(NAMESPACE_TOKEN)) {
      // Already namespaced
      result[key] = value;
    } else {
      const domain = FIELD_DOMAIN_MAP[key] || 'D03';
      result[`${NAMESPACE_TOKEN}${domain}.${key}`] = value;
    }
  }
  return result;
}
