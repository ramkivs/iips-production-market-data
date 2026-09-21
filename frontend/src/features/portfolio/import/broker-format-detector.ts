/**
 * Institutional Investment Platform System (IIPS)
 * Broker Format Detector (BI-04)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-04-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import {
  BrokerDetectionResult,
  BrokerFileFormat,
  FinappBrokerAdapter,
  FinappBrokerType,
} from './types.js';
import { parseCsvRows } from './adapters/csv-parser-helper.js';
import { ZerodhaHoldingsAdapter } from './adapters/zerodha-holdings-adapter.js';
import { DhanHoldingsAdapter } from './adapters/dhan-holdings-adapter.js';
import { GrowwHoldingsAdapter } from './adapters/groww-holdings-adapter.js';

export class BrokerFormatDetector {
  /**
   * Deterministically inspects input content and file metadata to identify the broker source format.
   * Fails closed with brokerType: 'UNKNOWN' if headers are ambiguous, corrupted, or unsupported.
   */
  public static detectFormat(
    content: string | Uint8Array | ArrayBuffer | any,
    fileName?: string
  ): BrokerDetectionResult {
    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(content);
    const isUint8Array = content instanceof Uint8Array;
    const isArrayBuffer = content instanceof ArrayBuffer;

    let binaryBytes: Uint8Array | undefined = undefined;
    if (isBuffer) {
      binaryBytes = new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
    } else if (isUint8Array) {
      binaryBytes = content;
    } else if (isArrayBuffer) {
      binaryBytes = new Uint8Array(content);
    }

    const fileNameLower = (fileName || '').toLowerCase().trim();

    // Check for ZIP/XLSX binary magic numbers (PK\x03\x04)
    const isZipBinary = binaryBytes !== undefined && binaryBytes.length >= 4 && binaryBytes[0] === 0x50 && binaryBytes[1] === 0x4b;
    const isXlsxExt = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');

    if (isZipBinary || isXlsxExt) {
      // Determine broker hint from filename if present
      let hintBroker: FinappBrokerType = 'UNKNOWN';
      if (fileNameLower.includes('groww')) {
        hintBroker = 'GROWW';
      } else if (fileNameLower.includes('dhan')) {
        hintBroker = 'DHAN';
      } else if (fileNameLower.includes('zerodha') || fileNameLower.includes('kite')) {
        hintBroker = 'ZERODHA';
      }

      return {
        brokerType: hintBroker,
        confidence: hintBroker !== 'UNKNOWN' ? 0.8 : 0.0,
        format: 'XLSX',
        detectedHeaders: [],
        requiresXlsx: true,
        details: hintBroker !== 'UNKNOWN'
          ? `Detected ${hintBroker} XLSX export. Binary parsing is QUALIFICATION-BLOCKED / DEFERRED TO BI-06 under zero-dependency rule.`
          : 'Detected binary XLSX/Spreadsheet file. Binary parsing is QUALIFICATION-BLOCKED / DEFERRED TO BI-06.',
      };
    }

    // Convert text content
    const textContent = typeof content === 'string'
      ? content
      : binaryBytes !== undefined
        ? new TextDecoder('utf-8').decode(binaryBytes)
        : String(content);

    const rows = parseCsvRows(textContent);
    if (rows.length === 0) {
      return {
        brokerType: 'UNKNOWN',
        confidence: 0.0,
        format: 'UNKNOWN',
        detectedHeaders: [],
        requiresXlsx: false,
        details: 'Content is empty or contains no parseable text lines.',
      };
    }

    // Inspect first row (or first 3 rows in case of title banners)
    let headerRow: string[] = [];
    let detectedBroker: FinappBrokerType = 'UNKNOWN';
    let confidence = 0.0;
    let details = '';

    for (let r = 0; r < Math.min(rows.length, 3); r++) {
      const candidateHeaders = rows[r].map((h) => h.toLowerCase().trim());
      const rawHeaders = rows[r];

      // 1. Check Zerodha Kite Signature
      // Key columns: 'instrument' and ('qty.' or 'qty') and ('avg. cost' or 'avg cost' or 'ltp' or 'cur. val')
      const hasZerodhaInst = candidateHeaders.includes('instrument');
      const hasZerodhaQty = candidateHeaders.some((h) => h === 'qty.' || h === 'qty');
      const hasZerodhaCost = candidateHeaders.some((h) => h === 'avg. cost' || h === 'avg cost' || h === 'cur. val' || h === 'ltp');

      if (hasZerodhaInst && (hasZerodhaQty || hasZerodhaCost)) {
        headerRow = rawHeaders;
        detectedBroker = 'ZERODHA';
        confidence = 1.0;
        details = 'Exact match for Zerodha Kite Holdings CSV schema.';
        break;
      }

      // 2. Check Dhan Signatures
      // Variant A: DHAN_DETAILED_HOLDINGS_V1
      // Key columns: ('trading symbol' or 'dp qty' or 'available qty') and ('isin' or 'average buy price' or 'last traded price')
      const hasDhanDetailedSymbol = candidateHeaders.includes('trading symbol') || candidateHeaders.includes('dp qty') || candidateHeaders.includes('available qty');
      const hasDhanDetailedPrice = candidateHeaders.includes('average buy price') || candidateHeaders.includes('last traded price');

      // Variant B: DHAN_WEB_UI_SUMMARY_V1 (Governed under BI-04 Amendment / BI-07 Acceptance)
      // Governed canonical layout: 'Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %'
      // Distinctive signature requirement: must contain 'name', 'quantity' (or 'qty'), 'avg price' (or 'avg. price'), 'last traded' (or 'last traded price'), 'investment' (or 'invested'), 'current value' (or 'market value')
      const hasDhanWebUi = candidateHeaders.includes('name') &&
        (candidateHeaders.includes('quantity') || candidateHeaders.includes('qty')) &&
        (candidateHeaders.includes('avg price') || candidateHeaders.includes('avg. price')) &&
        (candidateHeaders.includes('last traded') || candidateHeaders.includes('last traded price')) &&
        (candidateHeaders.includes('investment') || candidateHeaders.includes('invested')) &&
        (candidateHeaders.includes('current value') || candidateHeaders.includes('market value'));

      if (hasDhanDetailedSymbol || hasDhanDetailedPrice) {
        headerRow = rawHeaders;
        detectedBroker = 'DHAN';
        confidence = 1.0;
        details = 'Exact match for Dhan Holdings CSV schema (DHAN_DETAILED_HOLDINGS_V1).';
        break;
      } else if (hasDhanWebUi) {
        headerRow = rawHeaders;
        detectedBroker = 'DHAN';
        confidence = 1.0;
        details = 'Exact match for Dhan Web UI Summary CSV schema (DHAN_WEB_UI_SUMMARY_V1).';
        break;
      }

      // 3. Check Groww Signature
      // Key columns: ('stock name' or 'shares' or 'total returns' or 'xirr') and ('symbol' or 'isin' or 'average price')
      const hasGrowwStockName = candidateHeaders.includes('stock name');
      const hasGrowwShares = candidateHeaders.includes('shares') || candidateHeaders.includes('total shares');
      const hasGrowwReturns = candidateHeaders.includes('total returns') || candidateHeaders.includes('total returns %') || candidateHeaders.includes('xirr');

      if ((hasGrowwStockName && (hasGrowwShares || hasGrowwReturns)) || (hasGrowwShares && hasGrowwReturns)) {
        headerRow = rawHeaders;
        detectedBroker = 'GROWW';
        confidence = 1.0;
        details = 'Exact match for Groww Holdings CSV schema.';
        break;
      }
    }

    if (detectedBroker === 'UNKNOWN') {
      return {
        brokerType: 'UNKNOWN',
        confidence: 0.0,
        format: 'CSV',
        detectedHeaders: rows[0] || [],
        requiresXlsx: false,
        details: 'Fail closed: Header signature does not unambiguously match Zerodha, Dhan, or Groww specifications.',
      };
    }

    return {
      brokerType: detectedBroker,
      confidence,
      format: 'CSV',
      detectedHeaders: headerRow,
      requiresXlsx: false,
      details,
    };
  }

  /**
   * Instantiates the appropriate broker adapter for detected format.
   */
  public static getAdapterForBroker(brokerType: FinappBrokerType): FinappBrokerAdapter | undefined {
    switch (brokerType) {
      case 'ZERODHA':
        return new ZerodhaHoldingsAdapter();
      case 'DHAN':
        return new DhanHoldingsAdapter();
      case 'GROWW':
        return new GrowwHoldingsAdapter();
      default:
        return undefined;
    }
  }

  /**
   * Detects format and returns paired adapter instance if supported.
   */
  public static detectAndGetAdapter(
    content: string | Uint8Array | ArrayBuffer | any,
    fileName?: string
  ): { detection: BrokerDetectionResult; adapter?: FinappBrokerAdapter } {
    const detection = BrokerFormatDetector.detectFormat(content, fileName);
    const adapter = detection.brokerType !== 'UNKNOWN'
      ? BrokerFormatDetector.getAdapterForBroker(detection.brokerType)
      : undefined;

    return { detection, adapter };
  }
}
