/**
 * Dhan W-14 — Batch Quote Payload Builder (Scope B, 96 instruments)
 *
 * Pure, deterministic builder for the Dhan `POST /marketfeed/quote` request body.
 * No credentials, no transport, no live call. Validates every instrument against
 * the rules the vendor boundary enforces and produces a reproducible JSON payload.
 *
 * Scope B is the approved 96-instrument E4 sample with six corrected companyIds
 * (BLK-2). Each record is an independent quote target; dual-listed ISINs appear
 * twice with different exchange segments and Dhan IDs.
 */

import { DhanExchangeSegment } from './dhan_dto.js';

export type DhanBatchExchangeSegment = Extract<DhanExchangeSegment, 'NSE_EQ' | 'BSE_EQ'>;

export interface DhanBatchQuoteInstrument {
  /** Corrected company identity (P04 current, e.g. EQ_TMPV_IN). */
  companyId: string;
  /** Original sample companyId where it differed (e.g. EQ_TATAMOTORS_IN), else same as companyId. */
  originalCompanyId: string;
  /** True when BLK-2 renamed this row. */
  identityCorrected: boolean;
  isin: string;
  exchange: 'NSE' | 'BSE';
  exchangeSegment: DhanBatchExchangeSegment;
  /** P04 series (EQ for NSE, A for BSE:A, B for BSE:B). */
  series: string;
  canonicalSecurityIdentity: string; // ISIN:<isin>:<series>
  dhanSecurityId: string; // numeric string
}

export type DhanBatchQuotePayload = Partial<Record<DhanBatchExchangeSegment, number[]>>;

/**
 * Validates a single instrument in the builder's strict pre-conditions.
 * Throws TypeError with explicit field when violated.
 */
function assertValidInstrument(instrument: DhanBatchQuoteInstrument, index: number): void {
  const prefix = `instruments[${index}]`;
  if (!instrument.companyId || typeof instrument.companyId !== 'string' || !instrument.companyId.trim()) {
    throw new TypeError(`${prefix}.companyId is required`);
  }
  if (!instrument.isin || !/^INE[0-9A-Z]{6,}$/.test(instrument.isin)) {
    throw new TypeError(`${prefix}.isin must be a valid ISIN`);
  }
  if (instrument.exchangeSegment !== 'NSE_EQ' && instrument.exchangeSegment !== 'BSE_EQ') {
    throw new TypeError(`${prefix}.exchangeSegment must be NSE_EQ or BSE_EQ`);
  }
  if (typeof instrument.dhanSecurityId !== 'string' || !/^[1-9][0-9]*$/.test(instrument.dhanSecurityId)) {
    throw new TypeError(`${prefix}.dhanSecurityId must be a positive decimal integer string`);
  }
  const n = Number(instrument.dhanSecurityId);
  if (!Number.isSafeInteger(n)) {
    throw new TypeError(`${prefix}.dhanSecurityId exceeds safe integer range`);
  }
  if (!instrument.canonicalSecurityIdentity || !instrument.canonicalSecurityIdentity.startsWith('ISIN:')) {
    throw new TypeError(`${prefix}.canonicalSecurityIdentity must be ISIN:<isin>:<series>`);
  }
}

/**
 * Builds the deterministic grouped payload for Dhan `POST /marketfeed/quote`.
 *
 * - Groups by exchangeSegment (NSE_EQ / BSE_EQ)
 * - De-duplicates within a segment (same numeric ID must not appear twice)
 * - Sorts each segment's IDs ascending for reproducibility
 * - Returns a plain object suitable for JSON.stringify; numeric IDs.
 *
 * Throws if instruments empty, or duplicate (segment, securityId) detected.
 */
export function buildDhanBatchQuotePayload(
  instruments: readonly DhanBatchQuoteInstrument[]
): DhanBatchQuotePayload {
  if (instruments.length === 0) throw new TypeError('At least one instrument is required');

  const grouped: Partial<Record<DhanBatchExchangeSegment, number[]>> = {};
  const seen = new Set<string>();

  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i];
    assertValidInstrument(inst, i);
    const key = `${inst.exchangeSegment}:${inst.dhanSecurityId}`;
    if (seen.has(key)) {
      throw new TypeError(`Duplicate instrument in payload: ${key} at index ${i}`);
    }
    seen.add(key);
    const numericId = Number(inst.dhanSecurityId);
    const bucket = grouped[inst.exchangeSegment] ?? (grouped[inst.exchangeSegment] = []);
    bucket.push(numericId);
  }

  // Deterministic ordering
  for (const seg of Object.keys(grouped) as DhanBatchExchangeSegment[]) {
    grouped[seg]!.sort((a, b) => a - b);
  }

  // Canonical key order: BSE_EQ before NSE_EQ? Use lexical for reproducibility.
  // Dhan accepts either; we emit BSE_EQ then NSE_EQ to match illustrative examples.
  const ordered: DhanBatchQuotePayload = {};
  if (grouped.BSE_EQ) ordered.BSE_EQ = grouped.BSE_EQ;
  if (grouped.NSE_EQ) ordered.NSE_EQ = grouped.NSE_EQ;
  // Include any future segment in sorted order
  for (const k of Object.keys(grouped).sort()) {
    const seg = k as DhanBatchExchangeSegment;
    if (seg !== 'BSE_EQ' && seg !== 'NSE_EQ') ordered[seg] = grouped[seg];
  }

  return ordered;
}

/**
 * Serializes the batch payload to JSON exactly as Dhan expects.
 * Validates numeric IDs; never emits strings for security IDs.
 */
export function buildDhanBatchQuoteRequestBody(
  instruments: readonly DhanBatchQuoteInstrument[]
): string {
  const payload = buildDhanBatchQuotePayload(instruments);
  return JSON.stringify(payload);
}

// ── Response reconciliation (synthetic / live) ───────────────────────────────

/**
 * A parsed Dhan quote response shape (synthetic or live).
 * Mirrors DhanMarketQuoteResponseDto but is deliberately minimal for reconciliation.
 */
export interface DhanBatchQuoteResponse {
  status: string;
  data: Record<string, Record<string, unknown>>;
}

export type ReconcileIssueCode =
  | 'MISSING_INSTRUMENT'
  | 'UNEXPECTED_INSTRUMENT'
  | 'DUPLICATE_RESPONSE_IDENTITY'
  | 'INVALID_RESPONSE_STRUCTURE'
  | 'SEGMENT_MISMATCH';

export interface ReconcileIssue {
  code: ReconcileIssueCode;
  exchangeSegment: DhanBatchExchangeSegment;
  dhanSecurityId: string;
  detail: string;
}

export interface BatchReconcileResult {
  requested: number;
  returned: number;
  matched: number;
  missing: ReconcileIssue[];
  unexpected: ReconcileIssue[];
  duplicates: ReconcileIssue[];
  invalid: ReconcileIssue[];
  ok: boolean;
}

/**
 * Reconciles a Dhan batch quote response against the requested 96.
 *
 * Rules:
 * - Every requested (segment, securityId) must appear once in data[segment][securityId]
 * - An instrument in the response that was not requested is unexpected
 * - Duplicate keys cannot occur in JSON, but we detect multiple manifest entries mapping to same response key as logical duplicate
 * - Invalid response structure (missing status/data, non-success) is reported as INVALID_RESPONSE_STRUCTURE
 * - Zero / unavailable market values are NOT failures here — only presence/identity is checked
 */
export function reconcileDhanBatchQuoteResponse(
  requested: readonly DhanBatchQuoteInstrument[],
  response: unknown
): BatchReconcileResult {
  const requestedSet = new Set<string>();
  for (const inst of requested) {
    requestedSet.add(`${inst.exchangeSegment}:${inst.dhanSecurityId}`);
  }

  const result: BatchReconcileResult = {
    requested: requested.length,
    returned: 0,
    matched: 0,
    missing: [],
    unexpected: [],
    duplicates: [],
    invalid: [],
    ok: false,
  };

  // Validate response structure (mirrors parseDhanMarketQuoteResponse but without value validation)
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    result.invalid.push({ code: 'INVALID_RESPONSE_STRUCTURE', exchangeSegment: 'NSE_EQ', dhanSecurityId: '', detail: 'Response is not an object' });
    return result;
  }
  const raw = response as Record<string, unknown>;
  if (typeof raw.status !== 'string' || !raw.status.trim()) {
    result.invalid.push({ code: 'INVALID_RESPONSE_STRUCTURE', exchangeSegment: 'NSE_EQ', dhanSecurityId: '', detail: 'Missing status field' });
    return result;
  }
  if (raw.status.toLowerCase() !== 'success') {
    result.invalid.push({ code: 'INVALID_RESPONSE_STRUCTURE', exchangeSegment: 'NSE_EQ', dhanSecurityId: '', detail: `Non-success status: ${raw.status}` });
    return result;
  }
  if (!raw.data || typeof raw.data !== 'object' || Array.isArray(raw.data)) {
    result.invalid.push({ code: 'INVALID_RESPONSE_STRUCTURE', exchangeSegment: 'NSE_EQ', dhanSecurityId: '', detail: 'Missing data block' });
    return result;
  }

  const data = raw.data as Record<string, Record<string, unknown>>;

  // Count returned instruments and detect unexpected
  const seenResponseKeys = new Set<string>();
  let returned = 0;
  for (const [segment, block] of Object.entries(data)) {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      result.invalid.push({ code: 'INVALID_RESPONSE_STRUCTURE', exchangeSegment: segment as DhanBatchExchangeSegment, dhanSecurityId: '', detail: `Segment block not an object: ${segment}` });
      continue;
    }
    for (const secId of Object.keys(block as Record<string, unknown>)) {
      const key = `${segment}:${secId}`;
      returned += 1;
      if (seenResponseKeys.has(key)) {
        result.duplicates.push({ code: 'DUPLICATE_RESPONSE_IDENTITY', exchangeSegment: segment as DhanBatchExchangeSegment, dhanSecurityId: secId, detail: 'Duplicate response identity' });
      } else {
        seenResponseKeys.add(key);
      }
      if (!requestedSet.has(key)) {
        result.unexpected.push({ code: 'UNEXPECTED_INSTRUMENT', exchangeSegment: segment as DhanBatchExchangeSegment, dhanSecurityId: secId, detail: 'Response instrument was not requested' });
      }
    }
  }
  result.returned = returned;

  // Missing: requested but not in response
  for (const inst of requested) {
    const key = `${inst.exchangeSegment}:${inst.dhanSecurityId}`;
    if (!seenResponseKeys.has(key)) {
      result.missing.push({ code: 'MISSING_INSTRUMENT', exchangeSegment: inst.exchangeSegment, dhanSecurityId: inst.dhanSecurityId, detail: `Missing response for ${inst.companyId} ${inst.isin}` });
    }
  }

  // Duplicates: logical duplicate where two requested entries map to same response key (should be impossible if payload unique, but check)
  const reqKeys = requested.map((i) => `${i.exchangeSegment}:${i.dhanSecurityId}`);
  const reqCount = new Map<string, number>();
  for (const k of reqKeys) reqCount.set(k, (reqCount.get(k) ?? 0) + 1);
  for (const [k, c] of reqCount.entries()) {
    if (c > 1) {
      const [seg, id] = k.split(':') as [DhanBatchExchangeSegment, string];
      result.duplicates.push({ code: 'DUPLICATE_RESPONSE_IDENTITY', exchangeSegment: seg, dhanSecurityId: id, detail: `Requested duplicate: ${c} entries for same identity` });
    }
  }

  // Segment mismatch: requested segment differs from where response placed it (covered by missing+unexpected but flagged if same secId different segment)
  // If a securityId appears under wrong segment, it will be both missing (correct segment) and unexpected (wrong segment).

  result.matched = requested.length - result.missing.length;
  result.ok = result.missing.length === 0 && result.unexpected.length === 0 && result.duplicates.length === 0 && result.invalid.length === 0;

  return result;
}

/**
 * Validates that payload JSON matches the requested instruments exactly.
 * Used by tests to ensure payload <-> manifest agreement.
 */
export function validatePayloadMatchesInstruments(
  payloadJson: string,
  instruments: readonly DhanBatchQuoteInstrument[]
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return { ok: false, issues: ['Payload is not valid JSON'] };
  }

  const expected = buildDhanBatchQuotePayload(instruments);
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(payload).sort();

  if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) {
    issues.push(`Segment keys mismatch: expected ${JSON.stringify(expectedKeys)} got ${JSON.stringify(actualKeys)}`);
  }

  for (const seg of expectedKeys) {
    const exp = (expected as Record<string, number[]>)[seg] ?? [];
    const act = (payload as Record<string, unknown>)[seg];
    if (!Array.isArray(act)) {
      issues.push(`Segment ${seg} is not an array`);
      continue;
    }
    const expSorted = [...exp].sort((a, b) => a - b);
    const actSorted = [...(act as number[])].sort((a, b) => a - b);
    if (JSON.stringify(expSorted) !== JSON.stringify(actSorted)) {
      issues.push(`Segment ${seg} IDs mismatch: expected ${JSON.stringify(expSorted)} got ${JSON.stringify(actSorted)}`);
    }
    // Ensure all are numbers (not strings)
    for (const id of act as unknown[]) {
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
        issues.push(`Segment ${seg} contains non-numeric ID: ${String(id)} (${typeof id})`);
      }
    }
  }

  // Check for unexpected extra segments
  for (const k of actualKeys) {
    if (!expectedKeys.includes(k)) {
      issues.push(`Unexpected segment in payload: ${k}`);
    }
  }

  return { ok: issues.length === 0, issues };
}
