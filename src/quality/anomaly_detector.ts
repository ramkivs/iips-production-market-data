/**
 * Institutional Investment Platform System (IIPS)
 * 12-Category Data Quality Anomaly Detector (P07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

export type AnomalyCategory =
  | 'MISSING_MANDATORY_FIELD'
  | 'OUT_OF_RANGE_VALUE'
  | 'STALE_DATA_TIMESTAMP'
  | 'OUT_OF_ORDER_SEQUENCE'
  | 'STRUCTURAL_MALFORMATION'
  | 'NAMESPACE_COLLISION_OR_VIOLATION'
  | 'IDENTITY_AMBIGUITY'
  | 'CONTRADICTORY_CROSS_FIELD'
  | 'CORPORATE_ACTION_UNADJUSTED_SPIKE'
  | 'UNRECOGNIZED_ENUM_OR_CODE'
  | 'CURRENCY_MISMATCH'
  | 'UNAUTHORIZED_SOURCE_LEAK';

export interface AnomalyReport {
  detected: boolean;
  categories: AnomalyCategory[];
  details: string[];
}

export class AnomalyDetector {
  /**
   * Evaluates generic object payloads against all 12 anomaly categories.
   */
  public evaluatePayload(
    payload: Record<string, unknown>,
    context: {
      expectedDomain: string;
      previousTimestamp?: string;
      currentTimestamp?: string;
      previousClose?: number;
      currentPrice?: number;
      isCorporateActionAdjusted?: boolean;
    }
  ): AnomalyReport {
    const categories: AnomalyCategory[] = [];
    const details: string[] = [];

    // 1. MISSING_MANDATORY_FIELD
    if (!payload || Object.keys(payload).length === 0) {
      categories.push('MISSING_MANDATORY_FIELD');
      details.push('Payload is empty or missing mandatory fields');
    }

    // 2. OUT_OF_RANGE_VALUE
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'number' && (isNaN(v) || !isFinite(v))) {
        categories.push('OUT_OF_RANGE_VALUE');
        details.push(`Field '${k}' contains NaN or non-finite number`);
      }
    }

    // 3. STALE_DATA_TIMESTAMP & 4. OUT_OF_ORDER_SEQUENCE
    if (context.previousTimestamp && context.currentTimestamp) {
      const prevMs = Date.parse(context.previousTimestamp);
      const currMs = Date.parse(context.currentTimestamp);
      if (currMs < prevMs) {
        categories.push('OUT_OF_ORDER_SEQUENCE');
        details.push(`Timestamp regressed from ${context.previousTimestamp} to ${context.currentTimestamp}`);
      }
    }

    // 5. STRUCTURAL_MALFORMATION
    if (typeof payload !== 'object' || Array.isArray(payload)) {
      categories.push('STRUCTURAL_MALFORMATION');
      details.push('Payload must be a key-value object');
    }

    // 6. NAMESPACE_COLLISION_OR_VIOLATION
    for (const key of Object.keys(payload)) {
      if (
        key.includes('__proto__') ||
        key.includes('constructor') ||
        key.includes('prototype') ||
        key.startsWith('RAW_VENDOR_') ||
        key.startsWith('PROPRIETARY_')
      ) {
        categories.push('NAMESPACE_COLLISION_OR_VIOLATION');
        details.push(`Namespace collision or forbidden property key detected: ${key}`);
      }
    }

    // 7. IDENTITY_AMBIGUITY
    if (payload.symbol && !payload.exchange && !payload.companyId) {
      categories.push('IDENTITY_AMBIGUITY');
      details.push('Symbol provided without exchange namespace or companyId');
    }

    // 8. CONTRADICTORY_CROSS_FIELD
    if (
      typeof payload.high === 'number' &&
      typeof payload.low === 'number' &&
      payload.high < payload.low
    ) {
      categories.push('CONTRADICTORY_CROSS_FIELD');
      details.push(`High (${payload.high}) < Low (${payload.low})`);
    }

    // 9. CORPORATE_ACTION_UNADJUSTED_SPIKE
    // If price moved >50% overnight without corporate action adjustment flag
    if (
      context.previousClose &&
      context.currentPrice &&
      !context.isCorporateActionAdjusted
    ) {
      const priceChangePct = Math.abs(context.currentPrice - context.previousClose) / context.previousClose;
      if (priceChangePct > 0.5) {
        categories.push('CORPORATE_ACTION_UNADJUSTED_SPIKE');
        details.push(`Price moved ${Math.round(priceChangePct * 100)}% without corporate action flag`);
      }
    }

    // 10. UNRECOGNIZED_ENUM_OR_CODE
    if (payload.exchange && !['NSE', 'BSE'].includes(String(payload.exchange))) {
      categories.push('UNRECOGNIZED_ENUM_OR_CODE');
      details.push(`Unrecognized exchange: ${payload.exchange}`);
    }

    // 11. CURRENCY_MISMATCH
    if (payload.currency && !['INR', 'USD'].includes(String(payload.currency))) {
      categories.push('CURRENCY_MISMATCH');
      details.push(`Unsupported currency: ${payload.currency}`);
    }

    // 12. UNAUTHORIZED_SOURCE_LEAK (NFR-06)
    const jsonStr = JSON.stringify(payload).toLowerCase();
    const vendorPatterns = ['bloomberg', 'refinitiv', 'factset', 'spcapitaliq', 'cmie_prowess_direct'];
    for (const v of vendorPatterns) {
      if (jsonStr.includes(v)) {
        categories.push('UNAUTHORIZED_SOURCE_LEAK');
        details.push(`Commercial vendor token '${v}' leaked in payload`);
      }
    }

    return {
      detected: categories.length > 0,
      categories: Array.from(new Set(categories)),
      details,
    };
  }
}
