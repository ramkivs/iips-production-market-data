/**
 * Institutional Investment Platform System (IIPS)
 * W-24 — Trace Context and Header Validation (D-7 §4.2.1, §4.6, §4.9, §4.10)
 *
 * Governed under: D-7 §4.5–§4.10 (amended 2026-11-20) / AD-CHARTER
 *
 * PURPOSE:
 *  Defines the approved W-24 trace contract for IRR→IPD loopback transport:
 *  three opaque lowercase UUIDv4 identifiers, validated headers, and the
 *  trace version. No credential material is ever inspected, derived, or
 *  compared here (§4.10 rule 3).
 *
 * SECURITY:
 *  - Generation uses `node:crypto.randomUUID` (cryptographically secure).
 *  - Validation never reads credential material and never compares against it.
 *  - Headers are never logged and never serialized into diagnostic events
 *    beyond the allowlisted `actionId` field.
 *  - No trace header is ever sent to Dhan.
 */

import { randomUUID } from 'node:crypto';

export const W24_TRACE_CONTRACT_VERSION = 1 as const;
export type W24TraceContractVersion = typeof W24_TRACE_CONTRACT_VERSION;

export const TRACE_HEADER_VERSION = 'X-IIPS-Trace-Version' as const;
export const TRACE_HEADER_ACTION = 'X-IIPS-Action-Id' as const;

/** Lowercase header aliases as Node normalizes incoming headers to lowercase */
export const TRACE_HEADER_VERSION_LOWER = 'x-iips-trace-version' as const;
export const TRACE_HEADER_ACTION_LOWER = 'x-iips-action-id' as const;

export const TRACE_VERSION_VALUE = '1' as const;

const LOWERCASE_UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Validates a string is a lowercase UUIDv4.
 *
 * Strict: 36 chars, lowercase hex, version 4, variant 89ab.
 * Never inspects secret material.
 */
export function isLowercaseUuidV4(value: unknown): value is string {
  return typeof value === 'string' && LOWERCASE_UUID_V4_PATTERN.test(value);
}

/**
 * Generates a new opaque lowercase UUIDv4 using cryptographically secure randomness.
 *
 * Never derived from payload, business identifier, or secret material (§4.6 rule 1, §4.10 rule 3).
 */
export function generateTraceId(): string {
  return randomUUID();
}

export function generateWorkId(): string {
  return randomUUID();
}

export function generateAttemptId(): string {
  return randomUUID();
}

export type TraceContext = {
  readonly traceVersion: typeof TRACE_VERSION_VALUE;
  readonly actionId: string;
};

export type TraceHeaderRejection = {
  readonly code: 'CONTRACT_MISMATCH';
  readonly reason: 'MISSING_HEADERS' | 'INVALID_VERSION' | 'INVALID_ACTION_ID';
};

export function validateTraceHeaders(
  headers: Record<string, string | string[] | undefined>
): { ok: true; context: TraceContext } | { ok: false; rejection: TraceHeaderRejection } {
  // Node lowercases headers; check both casings.
  const rawVersion =
    headers[TRACE_HEADER_VERSION_LOWER] ??
    headers[TRACE_HEADER_VERSION] ??
    headers[TRACE_HEADER_VERSION.toLowerCase()];
  const rawAction =
    headers[TRACE_HEADER_ACTION_LOWER] ??
    headers[TRACE_HEADER_ACTION] ??
    headers[TRACE_HEADER_ACTION.toLowerCase()];

  const versionValue = Array.isArray(rawVersion) ? rawVersion[0] : rawVersion;
  const actionValue = Array.isArray(rawAction) ? rawAction[0] : rawAction;

  if (versionValue === undefined || actionValue === undefined) {
    return { ok: false, rejection: { code: 'CONTRACT_MISMATCH', reason: 'MISSING_HEADERS' } };
  }

  // Exact string "1" — no whitespace, no numeric coercion, no trim.
  if (versionValue !== TRACE_VERSION_VALUE) {
    return { ok: false, rejection: { code: 'CONTRACT_MISMATCH', reason: 'INVALID_VERSION' } };
  }

  if (!isLowercaseUuidV4(actionValue)) {
    return { ok: false, rejection: { code: 'CONTRACT_MISMATCH', reason: 'INVALID_ACTION_ID' } };
  }

  return { ok: true, context: { traceVersion: TRACE_VERSION_VALUE, actionId: actionValue } };
}

/**
 * Builds the trace headers to send on loopback transport.
 * Never logs, never exposes secret.
 */
export function buildTraceHeaders(context: TraceContext): Record<string, string> {
  return {
    [TRACE_HEADER_VERSION]: context.traceVersion,
    [TRACE_HEADER_ACTION]: context.actionId,
  };
}
