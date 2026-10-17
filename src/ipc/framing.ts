/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Strict IPC Framing (L-IPC-1 C5.1, C5.4, C7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * Wire format (the ONLY accepted shape):
 *
 *   +--------------------+------------------------------+
 *   | uint32 BE length   | UTF-8 JSON envelope          |
 *   +--------------------+------------------------------+
 *
 * Invariants:
 *  - NO greeting, banner, version string or preamble is ever emitted (C5.1). A peer that
 *    connects and says nothing receives nothing.
 *  - A frame is refused when it is zero-length, oversized, not valid JSON, not a plain
 *    object, carries an unknown envelope key, carries an unsupported protocol version, or
 *    names an operation outside the fixed set.
 *  - CALLER-SUPPLIED AUTHORITY (C7) is refused, not ignored: any key anywhere in the
 *    envelope that could assert a principal, tenant, membership, credential, scope or
 *    canonical-identity value causes a refusal before any authority is consulted.
 *  - Exactly ONE request is accepted per connection, and the connection is closed after
 *    the single response. There is no pipelining, no upgrade, and no long-lived session.
 */

import { IpcRefusal } from './errors.js';

/** Protocol version carried in every envelope. Any other value is refused. */
export const IPC_PROTOCOL_VERSION = 1;

/** Default hard cap on a single request frame (C5.4). */
export const DEFAULT_MAX_REQUEST_BYTES = 64 * 1024;

/** Default hard cap on a single response frame. */
export const DEFAULT_MAX_RESPONSE_BYTES = 256 * 1024;

/** uint32 big-endian length prefix. */
export const FRAME_HEADER_BYTES = 4;

/** The fixed operation set. No dynamic dispatch, no plugin surface. */
export const IPC_OPERATIONS = [
  'portfolio.list',
  'portfolio.get',
  'portfolio.analytics',
  'portfolio.save',
] as const;

export type IpcOperation = (typeof IPC_OPERATIONS)[number];

const ALLOWED_OPERATIONS: ReadonlySet<string> = new Set<string>(IPC_OPERATIONS);

/** Envelope keys a caller may send. Everything else is refused. */
const ALLOWED_ENVELOPE_KEYS: ReadonlySet<string> = new Set(['v', 'op', 'payload', 'requestId']);

/**
 * Keys that constitute a caller-supplied authority claim (C7). Matched case-insensitively
 * after stripping `_` and `-`, so `tenantId`, `tenant_id` and `Tenant-Id` are one key.
 */
const FORBIDDEN_AUTHORITY_KEYS: ReadonlySet<string> = new Set([
  'principal',
  'principalid',
  'applicationuser',
  'applicationuserid',
  'user',
  'userid',
  'username',
  'subject',
  'sub',
  'issuer',
  'iss',
  'credential',
  'credentials',
  'token',
  'accesstoken',
  'idtoken',
  'authorization',
  'auth',
  'authheader',
  'owner',
  'ownerid',
  'owneruserid',
  'tenant',
  'tenantid',
  'membership',
  'memberships',
  'membershipid',
  'scope',
  'scopes',
  'requestedscope',
  'requestedtenant',
  'role',
  'roles',
  'permission',
  'permissions',
  'elevated',
  'admin',
  'bypass',
  'operatorbypass',
  'nonproductionoperatorbypass',
  'companyid',
  'runtimecompanyid',
  'companyids',
  'identitystatus',
  'resolutiondisposition',
  'canonicalcompanyid',
  'resolvedcompanyid',
  'session',
  'sessionid',
]);

/** The bypass token must never appear as a value either (C12 item 3). */
const FORBIDDEN_VALUE_TOKENS: readonly string[] = ['NON_PRODUCTION_OPERATOR_BYPASS', 'OPERATOR_BYPASS'];

const MAX_SCAN_DEPTH = 12;

function normalizeKey(key: string): string {
  return key.replace(/[_-]/g, '').toLowerCase();
}

/** Request envelope. `payload` is operation-specific and is validated per operation. */
export interface IpcEnvelope {
  readonly v: typeof IPC_PROTOCOL_VERSION;
  readonly op: IpcOperation;
  readonly payload?: unknown;
  readonly requestId?: string;
}

/** Success response envelope. Refusals are NEVER represented on the wire (C6). */
export interface IpcSuccessResponse {
  readonly v: typeof IPC_PROTOCOL_VERSION;
  readonly ok: true;
  readonly requestId?: string;
  readonly result: unknown;
}

/**
 * Depth-first refusal scan for caller-supplied authority (C7).
 *
 * Refuses (does not strip) so a caller cannot learn which field was rejected by observing a
 * partially-applied request. Throws `IpcRefusal('CALLER_SUPPLIED_AUTHORITY')`.
 */
export function assertNoCallerSuppliedAuthority(value: unknown, depth = 0): void {
  if (depth > MAX_SCAN_DEPTH) {
    throw new IpcRefusal('MALFORMED_REQUEST', 'Request nesting exceeds the permitted depth.');
  }

  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    for (const token of FORBIDDEN_VALUE_TOKENS) {
      if (upper.includes(token)) {
        throw new IpcRefusal('CALLER_SUPPLIED_AUTHORITY', 'A caller-supplied authority token was refused.');
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      assertNoCallerSuppliedAuthority(entry, depth + 1);
    }
    return;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_AUTHORITY_KEYS.has(normalizeKey(key))) {
        throw new IpcRefusal('CALLER_SUPPLIED_AUTHORITY', 'A caller-supplied authority field was refused.');
      }
      assertNoCallerSuppliedAuthority(entry, depth + 1);
    }
  }
}

/** Encodes one length-prefixed frame, enforcing the response cap. */
export function encodeFrame(payload: unknown, maxBytes: number = DEFAULT_MAX_RESPONSE_BYTES): Buffer {
  let body: Buffer;
  try {
    body = Buffer.from(JSON.stringify(payload), 'utf8');
  } catch (error) {
    throw new IpcRefusal('OPERATION_FAILED', 'Response could not be encoded.');
  }

  if (body.length === 0 || body.length > maxBytes) {
    throw new IpcRefusal('OVERSIZE_FRAME', 'Response exceeds the permitted frame size.');
  }

  const header = Buffer.alloc(FRAME_HEADER_BYTES);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

/** Encodes a success response. There is no refusal encoder: refusals emit no bytes. */
export function encodeResponse(
  response: IpcSuccessResponse,
  maxBytes: number = DEFAULT_MAX_RESPONSE_BYTES
): Buffer {
  return encodeFrame(response, maxBytes);
}

/**
 * Incremental, strict frame decoder. Holds at most one partial frame.
 * Throws `IpcRefusal` on any protocol violation; the caller closes without emitting.
 */
export class FrameDecoder {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(private readonly maxBytes: number = DEFAULT_MAX_REQUEST_BYTES) {
    if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
      throw new IpcRefusal('MALFORMED_FRAME', 'Invalid maximum request size.');
    }
  }

  public get pendingBytes(): number {
    return this.buffer.length;
  }

  /** Appends bytes and returns every COMPLETE frame body decoded so far. */
  public push(chunk: Buffer): Buffer[] {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);

    const frames: Buffer[] = [];
    for (;;) {
      if (this.buffer.length < FRAME_HEADER_BYTES) {
        break;
      }
      const length = this.buffer.readUInt32BE(0);
      if (length === 0) {
        throw new IpcRefusal('MALFORMED_FRAME', 'Zero-length frame refused.');
      }
      if (length > this.maxBytes) {
        throw new IpcRefusal('OVERSIZE_FRAME', 'Request frame exceeds the permitted size.');
      }
      if (this.buffer.length < FRAME_HEADER_BYTES + length) {
        break;
      }
      frames.push(Buffer.from(this.buffer.subarray(FRAME_HEADER_BYTES, FRAME_HEADER_BYTES + length)));
      this.buffer = Buffer.from(this.buffer.subarray(FRAME_HEADER_BYTES + length));
    }
    return frames;
  }
}

/**
 * Parses and validates one request frame.
 *
 * Refuses: invalid UTF-8/JSON, non-object envelopes, unknown envelope keys, unsupported
 * version, non-fixed operation names, and any caller-supplied authority anywhere inside.
 */
export function decodeEnvelope(frame: Buffer): IpcEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(frame.toString('utf8'));
  } catch (error) {
    throw new IpcRefusal('MALFORMED_FRAME', 'Request frame is not valid JSON.');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new IpcRefusal('MALFORMED_FRAME', 'Request envelope must be a plain object.');
  }

  const record = parsed as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!ALLOWED_ENVELOPE_KEYS.has(key)) {
      throw new IpcRefusal('MALFORMED_REQUEST', 'Request envelope carries an unsupported field.');
    }
  }

  if (record.v !== IPC_PROTOCOL_VERSION) {
    throw new IpcRefusal('PROTOCOL_VERSION_UNSUPPORTED', 'Unsupported protocol version.');
  }

  const op = record.op;
  if (typeof op !== 'string' || !ALLOWED_OPERATIONS.has(op)) {
    throw new IpcRefusal('UNKNOWN_OPERATION', 'Request names an operation outside the fixed set.');
  }

  if (record.requestId !== undefined && typeof record.requestId !== 'string') {
    throw new IpcRefusal('MALFORMED_REQUEST', 'requestId must be a string when present.');
  }
  if (typeof record.requestId === 'string' && record.requestId.length > 128) {
    throw new IpcRefusal('MALFORMED_REQUEST', 'requestId exceeds the permitted length.');
  }

  // C7 — refuse caller-supplied authority anywhere in the envelope (keys AND values).
  assertNoCallerSuppliedAuthority(record);

  return {
    v: IPC_PROTOCOL_VERSION,
    op: op as IpcOperation,
    payload: record.payload,
    ...(record.requestId !== undefined ? { requestId: record.requestId as string } : {}),
  };
}
