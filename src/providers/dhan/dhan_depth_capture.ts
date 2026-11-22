/**
 * Institutional Investment Platform System (IIPS)
 * Dhan depth capture — TEMPORARY DIAGNOSTIC
 *
 * Purpose
 *   Capture the *original* `depth` block of one Dhan quote response exactly as
 *   the vendor sent it, so the unavailable-depth question in D-18 (the REST Full
 *   Quote depth structure is documented nowhere) can be answered from evidence
 *   instead of inference.
 *
 * Scope and guarantees
 *   - Read-only and side-effect free unless a target path is supplied.
 *   - **Never** alters quote processing: it does not transform the response, does
 *     not influence normalisation, and does not change D-5 validation. Callers pass
 *     the already-parsed JSON and discard the return value.
 *   - Preserves received values exactly: zero, negative, missing, empty arrays and
 *     non-numeric prices are recorded verbatim. Nothing is coerced, defaulted,
 *     filled in or re-derived (in particular, no depth value is ever synthesised
 *     from `last_price`).
 *   - Records no credential material: only depth price/quantity/orders, the
 *     securities requested, and the count of instruments in the response.
 *   - Temporary by construction: the whole feature is opt-in on one environment
 *     variable and is intended for removal once D-18 is resolved.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Environment variable that switches the diagnostic on. Off by default. */
export const DHAN_DEPTH_CAPTURE_ENV = 'IIPS_DHAN_DEPTH_CAPTURE_PATH';

/** Environment variable used only to label which request this capture belongs to. */
export const DHAN_DEPTH_CAPTURE_LABEL_ENV = 'IIPS_DHAN_DEPTH_CAPTURE_LABEL';

/**
 * The single Dhan security ID this one-shot diagnostic will capture.
 *
 * Reliance on NSE_EQ is Dhan ID `2885` (see the P7 qualification manifest, as recorded in
 * DHAN-QUOTE-NUMERIC-SERIALIZATION-COMPLETION-RECORD-2026-11-18). Scoping the capture to
 * this ID — rather than to the quote endpoint — is what stops any other instrument's quote
 * from consuming the one-shot slot.
 */
export const DHAN_DEPTH_CAPTURE_SECURITY_ID = '2885';

/** One depth level, with each field preserved exactly as received. */
export interface CapturedDepthLevel {
  /** `present` when the field existed, `missing` when the key was absent or null. */
  readonly price: { readonly state: 'present' | 'missing'; readonly value?: unknown };
  readonly quantity: { readonly state: 'present' | 'missing'; readonly value?: unknown };
  readonly orders: { readonly state: 'present' | 'missing'; readonly value?: unknown };
}

export interface CapturedDepthSide {
  readonly state: 'array' | 'missing' | 'not_array';
  /** Length as received; present only for the `array` state. */
  readonly count?: number;
  /** Levels in received order; present only for the `array` state. */
  readonly levels?: readonly CapturedDepthLevel[];
  /** The verbatim value when the side was not an array (e.g. an object). */
  readonly rawValue?: unknown;
}

export interface CapturedQuoteDepth {
  readonly segment: string;
  readonly securityId: string;
  readonly depthState: 'object' | 'missing' | 'not_object';
  readonly buy: CapturedDepthSide;
  readonly sell: CapturedDepthSide;
  /** The complete original depth value, when it was an object. */
  readonly rawDepth?: unknown;
}

export interface CapturedDepthDocument {
  readonly captureSchemaVersion: 2;
  readonly capturedAtUtc: string;
  readonly label: string | null;
  readonly httpStatus: number | null;
  readonly responseStatus: string | null;
  readonly requestedSecurityIds: readonly string[];
  /** Count only — no other response field is recorded. */
  readonly instrumentsInResponse: number;
  readonly quotes: readonly CapturedQuoteDepth[];
}

function readField(source: Record<string, unknown>, key: string): { state: 'present' | 'missing'; value?: unknown } {
  if (!Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined || source[key] === null) {
    return { state: 'missing' };
  }
  return { state: 'present', value: source[key] };
}

function captureLevel(level: unknown): CapturedDepthLevel {
  if (typeof level !== 'object' || level === null || Array.isArray(level)) {
    // A malformed level must not be silently shaped into an object; record the
    // three fields as missing so the caller sees the anomaly in the capture.
    return {
      price: { state: 'missing' },
      quantity: { state: 'missing' },
      orders: { state: 'missing' },
    };
  }
  const record = level as Record<string, unknown>;
  return {
    price: readField(record, 'price'),
    quantity: readField(record, 'quantity'),
    orders: readField(record, 'orders'),
  };
}

function captureSide(side: unknown): CapturedDepthSide {
  if (side === undefined || side === null) return { state: 'missing' };
  if (!Array.isArray(side)) return { state: 'not_array', rawValue: side };
  return {
    state: 'array',
    count: side.length,
    levels: side.map((level) => captureLevel(level)),
  };
}

/** True when the value is a plain JSON object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One instrument named in a Dhan quote request body. */
export interface DepthCaptureRequestInstrument {
  readonly segment: string;
  readonly securityId: string;
}

/**
 * Reads the instruments from a parsed Dhan quote request body.
 *
 * The request body is `{"<segment>":[<id>,...],...}` (see `buildQuoteRequestBody`). Any other
 * shape yields an empty list, which can never match the target — the safe direction, because a
 * failed read must not consume the one-shot slot.
 */
export function readQuoteRequestInstruments(parsedRequestBody: unknown): DepthCaptureRequestInstrument[] {
  if (!isRecord(parsedRequestBody)) return [];
  const instruments: DepthCaptureRequestInstrument[] = [];
  for (const [segment, segmentValue] of Object.entries(parsedRequestBody)) {
    if (!Array.isArray(segmentValue)) continue;
    for (const entry of segmentValue) {
      if (typeof entry === 'number' && Number.isSafeInteger(entry) && entry > 0) {
        instruments.push({ segment, securityId: String(entry) });
        continue;
      }
      if (typeof entry === 'string' && entry.trim() !== '') {
        instruments.push({ segment, securityId: entry.trim() });
      }
    }
  }
  return instruments;
}

/**
 * True when this request is the selected one — exactly one instrument, `NSE_EQ`, Dhan ID `2885`.
 *
 * Requiring the segment as well as the ID means a same-numbered security on another exchange
 * segment cannot be mistaken for Reliance. Deliberately strict: an ambiguous body returns
 * `false`, so the slot survives for the request the operator intended.
 */
export function isSelectedDepthCaptureRequest(instruments: readonly DepthCaptureRequestInstrument[]): boolean {
  if (instruments.length !== 1) return false;
  const only = instruments[0]!;
  return only.segment === 'NSE_EQ' && only.securityId === DHAN_DEPTH_CAPTURE_SECURITY_ID;
}

/**
 * Extracts the received depth blocks from an already-parsed Dhan response body.
 *
 * Pure: performs no IO and never mutates its input. Safe to call with any value,
 * including a non-object, in which case the document records zero quotes.
 */
export function captureDhanQuoteDepth(
  parsedBody: unknown,
  context: {
    readonly httpStatus?: number;
    readonly label?: string | null;
    readonly capturedAtUtc: string;
    readonly requestedSecurityIds?: readonly string[];
  }
): CapturedDepthDocument {
  const quotes: CapturedQuoteDepth[] = [];
  let instrumentsInResponse = 0;
  let responseStatus: string | null = null;

  if (isRecord(parsedBody)) {
    const status = parsedBody['status'];
    if (typeof status === 'string') responseStatus = status;

    const data = parsedBody['data'];
    if (isRecord(data)) {
      for (const [segment, segmentBlock] of Object.entries(data)) {
        if (!isRecord(segmentBlock)) continue;
        for (const [securityId, quoteBlock] of Object.entries(segmentBlock)) {
          instrumentsInResponse += 1;
          const depth = isRecord(quoteBlock) ? quoteBlock['depth'] : undefined;
          const isObject = isRecord(depth);
          quotes.push({
            segment,
            securityId,
            depthState: depth === undefined || depth === null ? 'missing' : isObject ? 'object' : 'not_object',
            buy: captureSide(isObject ? (depth as Record<string, unknown>)['buy'] : undefined),
            sell: captureSide(isObject ? (depth as Record<string, unknown>)['sell'] : undefined),
            ...(isObject ? { rawDepth: depth } : {}),
          });
        }
      }
    }
  }

  return {
    captureSchemaVersion: DEPTH_CAPTURE_SCHEMA_VERSION,
    capturedAtUtc: context.capturedAtUtc,
    label: context.label ?? null,
    httpStatus: context.httpStatus ?? null,
    responseStatus,
    requestedSecurityIds: [...(context.requestedSecurityIds ?? [])],
    instrumentsInResponse,
    quotes,
  };
}

/** Reads the configured capture target, or `undefined` when the diagnostic is off. */
export function resolveDepthCapturePath(env: Record<string, string | undefined>): string | undefined {
  const configured = env[DHAN_DEPTH_CAPTURE_ENV];
  if (typeof configured !== 'string') return undefined;
  const trimmed = configured.trim();
  return trimmed === '' ? undefined : trimmed;
}

/** Document schema version written by the current capture. */
export const DEPTH_CAPTURE_SCHEMA_VERSION = 2;

/**
 * In-process one-shot latch, keyed by absolute target path.
 *
 * The latch is what makes the capture one-shot: the first successful write
 * disables every later capture for the lifetime of the process, regardless of
 * the environment variable. This is process-lifetime state only — no file, no
 * registry, no external sink — so it clears on restart by construction.
 */
const latchedTargets = new Set<string>();

/** True when a capture has already been taken for this target in this process. */
export function isDepthCaptureLatched(targetPath: string): boolean {
  return latchedTargets.has(targetPath);
}

/** Clears the in-process latch. Test-only helper; production never calls this. */
export function resetDepthCaptureLatchForTests(): void {
  latchedTargets.clear();
}

/**
 * Attempts to consume the single capture slot for `targetPath`.
 *
 * Returns `true` only for the first caller per target per process. The slot is
 * claimed *before* the write so that two concurrent requests can never both
 * capture; if the write then fails the slot stays consumed, which is the
 * fail-safe choice — a broken diagnostic is not retried on every later quote.
 */
export function claimDepthCaptureSlot(targetPath: string): boolean {
  if (latchedTargets.has(targetPath)) return false;
  latchedTargets.add(targetPath);
  return true;
}

/**
 * Writes a capture document. Best effort and never throws: a failed diagnostic
 * write must not affect quote processing or surface as a vendor failure.
 *
 * Returns the path written, or `undefined` when nothing was written.
 */
export function writeDepthCapture(
  targetPath: string,
  document: CapturedDepthDocument
): string | undefined {
  try {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return targetPath;
  } catch {
    // Diagnostics are never allowed to change the outcome of a quote request.
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Arm / disarm via a sibling marker file (no environment change, no restart)
// ---------------------------------------------------------------------------

/**
 * Sidecar marker that arms a one-shot capture.
 *
 * Why a file rather than an environment variable: a running Windows daemon
 * snapshots `process.env` at startup, so an environment change requires a
 * restart. The operator can instead create `<capture>.arm` next to the capture
 * file to arm the *next* matching quote, and the diagnostic deletes it as it
 * captures. Nothing is written to the marker; its mere existence means "armed".
 */
export function depthCaptureArmMarkerPath(targetPath: string): string {
  return `${targetPath}.arm`;
}

/**
 * Arms a one-shot capture by creating the marker file.
 *
 * Fails safe: returns `false` (and does not arm) when the parent directory
 * cannot be created or written.
 */
export function armDepthCapture(targetPath: string): boolean {
  try {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(depthCaptureArmMarkerPath(targetPath), '', 'utf8');
    return true;
  } catch {
    return false;
  }
}

/** True when the arm marker exists. Never throws. */
export function isDepthCaptureArmed(targetPath: string): boolean {
  try {
    return existsSync(depthCaptureArmMarkerPath(targetPath));
  } catch {
    return false;
  }
}

/**
 * Disarms after a capture: removes the marker and clears the in-process latch.
 *
 * Removing the marker means a later run needs an explicit re-arm, so a stray
 * quote an hour later cannot silently overwrite the evidence.
 */
export function disarmDepthCapture(targetPath: string): void {
  try {
    rmSync(depthCaptureArmMarkerPath(targetPath), { force: true });
  } catch {
    // Best effort; the latch below is authoritative for this process.
  }
  latchedTargets.delete(targetPath);
}
