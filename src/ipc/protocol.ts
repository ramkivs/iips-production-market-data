/**
 * Gate 3 — IPC frame protocol (act §4.2 item 11; contract v1 T-2…T-4; L-IPC-1).
 *
 * Frame = uint32 big-endian length prefix + UTF-8 JSON object. Request cap 64 KiB,
 * response cap 256 KiB. Envelope keys are exactly v / op / payload / requestId on
 * the request and v / ok / op / requestId / result|outcome / detail on responses.
 * One request and at most one response per connection; pipelined frames are
 * refused. Class P refusals emit zero bytes and record the reason only in the
 * bounded in-memory diagnostic sink — never on the wire (C6).
 */
import type { Socket } from 'node:net';

export const IPC_PROTOCOL_VERSION = 1;
export const IPC_LENGTH_PREFIX_BYTES = 4;
export const IPC_REQUEST_MAX_BYTES = 64 * 1024;
export const IPC_RESPONSE_MAX_BYTES = 256 * 1024;
export const IPC_MAX_SCAN_DEPTH = 12;
const DIAGNOSTIC_SINK_LIMIT = 256;

export type IpcOperation =
  | 'portfolio.list'
  | 'portfolio.get'
  | 'portfolio.revisions'
  | 'portfolio.create'
  | 'portfolio.save'
  | 'portfolio.reset'
  | 'portfolio.delete';

export const IPC_READ_OPERATIONS: readonly IpcOperation[] = [
  'portfolio.list',
  'portfolio.get',
  'portfolio.revisions',
];
export const IPC_WRITE_OPERATIONS: readonly IpcOperation[] = [
  'portfolio.create',
  'portfolio.save',
  'portfolio.reset',
  'portfolio.delete',
];
export const IPC_OPERATIONS: readonly IpcOperation[] = [...IPC_READ_OPERATIONS, ...IPC_WRITE_OPERATIONS];
export const IPC_RESERVED_OPERATIONS: readonly string[] = ['portfolio.analytics'];

export type ClassPReason =
  | 'MALFORMED_FRAME'
  | 'OVERSIZE_FRAME'
  | 'PROTOCOL_VERSION_UNSUPPORTED'
  | 'UNKNOWN_OPERATION'
  | 'CALLER_SUPPLIED_AUTHORITY'
  | 'BINDING_ABSENT'
  | 'BINDING_INVALID'
  | 'CAPACITY_EXCEEDED'
  | 'IDLE_TIMEOUT';

export type ClassAOutcome =
  | 'RESOURCE_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'REVISION_CONFLICT'
  | 'REFUSED_UNRESOLVED_IDENTITY'
  | 'REFUSED_STORE_GUARD'
  | 'WRITE_NOT_AUTHORIZED'
  | 'UNAVAILABLE';

export class ClassPError extends Error {
  constructor(readonly reason: ClassPReason, message: string) {
    super(message);
    this.name = 'ClassPError';
  }
}

/** The 29 certified caller-identity keys plus the C7 canonical/tenant additions. */
export const IPC_REFUSED_WIRE_KEYS: readonly string[] = Array.from(
  new Set([
    'owner', 'ownerId', 'tenant', 'tenantId', 'applicationUserId', 'applicationUser', 'userId', 'user',
    'principal', 'principalId', 'membership', 'membershipId', 'credential', 'credentials', 'password',
    'secret', 'token', 'accessToken', 'refreshToken', 'authorization', 'authHeader', 'claims', 'scope',
    'scopes', 'role', 'roles', 'identity', 'sessionId', 'applicationPrincipal',
    'companyId', 'runtimeCompanyId', 'identityStatus', 'resolutionDisposition', 'tenantHint',
  ]),
).sort();

export function findRefusedWireKeys(value: unknown, depth = 0): string[] {
  if (depth > IPC_MAX_SCAN_DEPTH) return ['(depth-limit-exceeded)'];
  if (value === null || typeof value !== 'object') return [];
  const found = new Set<string>();
  if (Array.isArray(value)) {
    for (const item of value) for (const key of findRefusedWireKeys(item, depth + 1)) found.add(key);
    return Array.from(found).sort();
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (IPC_REFUSED_WIRE_KEYS.includes(key)) found.add(key);
    for (const nested of findRefusedWireKeys(record[key], depth + 1)) found.add(nested);
  }
  return Array.from(found).sort();
}

/* ------------------------------------------------------------- diagnostic sink */

export interface DiagnosticEntry {
  readonly at: string;
  readonly reason: ClassPReason;
  readonly detail: string;
}

class DiagnosticSink {
  private entries: DiagnosticEntry[] = [];

  record(reason: ClassPReason, detail: string): void {
    this.entries.push({ at: new Date().toISOString(), reason, detail });
    if (this.entries.length > DIAGNOSTIC_SINK_LIMIT) {
      this.entries = this.entries.slice(-DIAGNOSTIC_SINK_LIMIT);
    }
  }

  drain(): DiagnosticEntry[] {
    const copy = [...this.entries];
    this.entries = [];
    return copy;
  }

  peek(): readonly DiagnosticEntry[] {
    return this.entries;
  }
}

export const diagnosticSink = new DiagnosticSink();

/* ------------------------------------------------------------------ framing */

export interface RequestEnvelope {
  v: 1;
  op: IpcOperation;
  payload?: Record<string, unknown>;
  requestId?: string;
}

export function encodeResponse(frame: Record<string, unknown>): Buffer {
  const body = Buffer.from(JSON.stringify(frame), 'utf8');
  if (body.byteLength > IPC_RESPONSE_MAX_BYTES) {
    throw new Error('response exceeds the 256 KiB cap');
  }
  const prefix = Buffer.allocUnsafe(IPC_LENGTH_PREFIX_BYTES);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

export function classAFrame(op: string, outcome: ClassAOutcome, requestId: string | undefined, detail?: string): Buffer {
  return encodeResponse({
    v: IPC_PROTOCOL_VERSION,
    ok: false,
    op,
    ...(requestId ? { requestId } : {}),
    outcome,
    ...(detail ? { detail } : {}),
  });
}

export function successFrame(op: IpcOperation, result: unknown, requestId: string | undefined): Buffer {
  return encodeResponse({
    v: IPC_PROTOCOL_VERSION,
    ok: true,
    op,
    ...(requestId ? { requestId } : {}),
    result,
  });
}

/**
 * Parses one complete frame from a buffer. Returns null when more bytes are
 * needed. A declared length over the cap, a truncated body or trailing bytes
 * after the first frame are Class P protocol violations.
 */
export function parseSingleFrame(buffer: Buffer): { envelope: RequestEnvelope; totalLength: number } | null {
  if (buffer.byteLength < IPC_LENGTH_PREFIX_BYTES) return null;
  const declared = buffer.readUInt32BE(0);
  if (declared > IPC_REQUEST_MAX_BYTES) {
    throw new ClassPError('OVERSIZE_FRAME', `declared frame length ${declared} exceeds ${IPC_REQUEST_MAX_BYTES}`);
  }
  const totalLength = IPC_LENGTH_PREFIX_BYTES + declared;
  if (buffer.byteLength < totalLength) return null;
  if (buffer.byteLength > totalLength) {
    throw new ClassPError('MALFORMED_FRAME', 'pipelined or trailing bytes after a single frame are refused');
  }

  let body: unknown;
  try {
    body = JSON.parse(buffer.subarray(IPC_LENGTH_PREFIX_BYTES, totalLength).toString('utf8'));
  } catch {
    throw new ClassPError('MALFORMED_FRAME', 'the frame body is not valid UTF-8 JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ClassPError('MALFORMED_FRAME', 'the frame body is not a JSON object');
  }
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!['v', 'op', 'payload', 'requestId'].includes(key)) {
      // A certified caller-identity/authority key at the envelope level is the
      // specific C7 violation, not a generic grammar error.
      if (IPC_REFUSED_WIRE_KEYS.includes(key)) {
        throw new ClassPError('CALLER_SUPPLIED_AUTHORITY', `refused caller-supplied authority key: ${key}`);
      }
      throw new ClassPError('MALFORMED_FRAME', `unexpected envelope key: ${key}`);
    }
  }
  if (record.v !== IPC_PROTOCOL_VERSION) {
    throw new ClassPError('PROTOCOL_VERSION_UNSUPPORTED', `unsupported protocol version: ${String(record.v)}`);
  }
  if (typeof record.op !== 'string' || !(IPC_OPERATIONS as readonly string[]).includes(record.op)) {
    throw new ClassPError('UNKNOWN_OPERATION', `operation outside the closed v1 set: ${String(record.op)}`);
  }
  if (record.payload !== undefined && (typeof record.payload !== 'object' || record.payload === null || Array.isArray(record.payload))) {
    throw new ClassPError('MALFORMED_FRAME', 'payload must be an object');
  }
  if (record.requestId !== undefined && typeof record.requestId !== 'string') {
    throw new ClassPError('MALFORMED_FRAME', 'requestId must be a string');
  }
  return { envelope: record as unknown as RequestEnvelope, totalLength };
}

/**
 * Settlement policy for the one-request-per-connection guard that follows the
 * single parsed frame. The policy differs by transport because half-close is
 * not observable in the same way on every supported IPC family:
 *
 * - 'half-close-required' (AF_UNIX): a peer FIN is delivered as a clean 'end'
 *   while the writable side stays open, so the response is withheld until that
 *   half-close proves no second frame follows. This is the airtight gate.
 *
 * - 'flush-guard' (Windows named pipe, libuv byte mode): a client shutdown is
 *   only a FlushFileBuffers; no EOF is delivered to the server. The pipe EOF
 *   arrives solely when libuv's 50 ms eof timer force-closes the client handle
 *   (ERROR_BROKEN_PIPE), after which every server write fails. Waiting for
 *   'end' would therefore make a response physically undeliverable. Instead
 *   the response is written immediately while the guard listeners stay
 *   attached through the write: any trailing byte or transport error before
 *   the write flushes trips `whenGuardTripped`, and the dispatcher destroys
 *   the socket for a zero-byte Class P refusal. A reference client that
 *   half-closes after its single frame cannot send further bytes, so the
 *   guard can only be tripped by a prohibited pipelining peer.
 */
export type FrameSettlementPolicy = 'half-close-required' | 'flush-guard';

export interface ReadFrameOptions {
  readonly idleTimeoutMs?: number;
  readonly settlement?: FrameSettlementPolicy;
}

/**
 * Handle to one successfully parsed frame.
 *
 * `readSingleFrame` resolves as soon as a complete, alone-in-the-buffer frame
 * has been parsed, but the one-request-per-connection contract (T-2) is not yet
 * fully established at that instant: a second frame or trailing bytes can
 * arrive in a LATER data event. Under 'half-close-required' a response must be
 * written only after `whenSettled` resolves (clean half-close with no trailing
 * data); under 'flush-guard' the caller races the response write against
 * `whenGuardTripped`. Any later byte, transport error or idle-timeout breach
 * rejects the settlement promise with a ClassPError so the caller fails closed
 * (zero bytes).
 *
 * Edge case explicitly specified here rather than left implicit: a peer that
 * sends one valid frame but never half-closes receives no response under the
 * half-close policy; after the idle deadline the connection is refused with
 * IDLE_TIMEOUT. The accepted IRR reference client always half-closes after its
 * single request frame.
 *
 * Transport-imposed residual (Windows named pipes): because the pipe gives no
 * pre-break half-close signal, a non-conforming peer that keeps the pipe open
 * and delivers a second frame only AFTER the single response has already
 * flushed to the OS cannot have that delivery prevented; its connection is
 * still closed after exactly one response and its second frame is never
 * dispatched. AF_UNIX retains the airtight gate. This is a platform limit, not
 * a protocol change.
 */
export interface FrameReader {
  readonly envelope: RequestEnvelope;
  readonly settlement: FrameSettlementPolicy;
  /** Resolves on a clean half-close after exactly one frame; rejects on any trailing data or fault. */
  readonly whenSettled: Promise<void>;
  /**
   * Resolves with the Class P fault if the guard is tripped (trailing data or
   * transport error after the parsed frame); never resolves while the guard
   * stays intact. Used to race the response write under 'flush-guard'.
   */
  readonly whenGuardTripped: Promise<ClassPError>;
  /** True until a guard-phase fault (trailing data or transport error) occurs. */
  isGuardIntact(): boolean;
  /** Detach exactly the reader-owned listeners and clear its timer; caller-owned listeners survive. */
  release(): void;
}

/**
 * Reads exactly one frame from a socket, enforcing the request cap while
 * buffering across arbitrary stream chunk boundaries.
 *
 * Listener ownership is explicit: this function registers named `data` /
 * `end` / `error` listeners and removes only those (never
 * `removeAllListeners`), so a caller-owned socket `error` handler — e.g. the
 * one registered by the dispatch connection handler — stays in force for
 * faults that occur while the response is being transmitted.
 */
export function readSingleFrame(
  socket: Socket,
  options: ReadFrameOptions | number = {},
): Promise<FrameReader> {
  // Backward-compatible positional form: readSingleFrame(socket, idleTimeoutMs).
  const normalized: ReadFrameOptions =
    typeof options === 'number' ? { idleTimeoutMs: options } : options;
  const idleTimeoutMs = normalized.idleTimeoutMs ?? 5000;
  const settlement: FrameSettlementPolicy = normalized.settlement ?? 'half-close-required';

  return new Promise((resolveReader, rejectReader) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let phase: 'reading' | 'guarding' | 'done' = 'reading';
    let timer: NodeJS.Timeout | undefined;
    let settledResolve: (() => void) | undefined;
    let settledReject: ((error: Error) => void) | undefined;
    const whenSettled = new Promise<void>((resolve, reject) => {
      settledResolve = resolve;
      settledReject = reject;
    });
    // Guard trip notification: resolves (never rejects) with the Class P
    // fault so a response write can be raced against it without creating an
    // unhandled rejection path of its own.
    let tripResolve: ((error: ClassPError) => void) | undefined;
    const whenGuardTripped = new Promise<ClassPError>((resolve) => {
      tripResolve = resolve;
    });
    let guardError: ClassPError | null = null;
    // The settle promise is observed by the dispatcher; attach a defensive
    // handler so an early Class-P destroy (which releases the reader without
    // awaiting whenSettled) can never surface as an unhandled rejection.
    whenSettled.catch(() => undefined);

    const armTimer = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fail(
          new ClassPError(
            'IDLE_TIMEOUT',
            phase === 'reading'
              ? 'no complete frame arrived before the idle deadline'
              : 'the peer did not half-close after its single frame before the idle deadline',
          ),
        );
      }, idleTimeoutMs);
    };

    const detach = (): void => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      // Remove only the listeners owned by this reader; caller-registered
      // listeners (notably the caller's error handler) are preserved.
      socket.off('data', onData);
      socket.off('end', onEnd);
      socket.off('error', onError);
    };

    function fail(error: ClassPError): void {
      if (phase === 'done') return;
      const wasReading = phase === 'reading';
      phase = 'done';
      detach();
      if (wasReading) {
        rejectReader(error);
      } else {
        // A guarding-phase fault trips the flush guard and rejects the
        // half-close settlement promise (the defensive .catch above keeps
        // the latter safe when a flush-guard caller only races whenGuardTripped).
        guardError = error;
        tripResolve?.(error);
        settledReject?.(error);
      }
    }

    function onData(chunk: Buffer): void {
      if (phase === 'done') return;

      // Guarding: the single permitted frame already parsed. Any further byte
      // — a whole second frame, a partial prefix, or stray trailing data — is a
      // pipelining violation regardless of which data event delivers it.
      if (phase === 'guarding') {
        fail(
          new ClassPError(
            'MALFORMED_FRAME',
            'a second frame or trailing data after the single permitted frame is refused',
          ),
        );
        return;
      }

      total += chunk.byteLength;
      if (total > IPC_LENGTH_PREFIX_BYTES + IPC_REQUEST_MAX_BYTES) {
        fail(new ClassPError('OVERSIZE_FRAME', `frame exceeds the ${IPC_REQUEST_MAX_BYTES}-byte request cap`));
        return;
      }
      chunks.push(chunk);
      try {
        const parsed = parseSingleFrame(Buffer.concat(chunks));
        if (!parsed) {
          // Still incomplete; chunk boundaries need not match write boundaries.
          armTimer();
          return;
        }
        // Keep the reader-owned listeners attached and enter the guard phase:
        // the half-close (half-close-required) or the response flush
        // (flush-guard) must now prove that no second frame follows.
        phase = 'guarding';
        armTimer();
        resolveReader({
          envelope: parsed.envelope,
          settlement,
          whenSettled,
          whenGuardTripped,
          // A clean half-close or an explicit release() is not a fault; only
          // a recorded guarding-phase error makes the guard non-intact.
          isGuardIntact: () => guardError === null,
          release: () => {
            if (phase === 'done') return;
            phase = 'done';
            detach();
          },
        });
      } catch (error) {
        fail(
          error instanceof ClassPError
            ? error
            : new ClassPError(
                'MALFORMED_FRAME',
                error instanceof Error ? error.message : String(error),
              ),
        );
      }
    }

    function onEnd(): void {
      if (phase === 'done') return;
      if (phase === 'reading') {
        fail(new ClassPError('MALFORMED_FRAME', 'connection ended before a complete frame arrived'));
        return;
      }
      // Clean FIN after exactly one frame, with no trailing data: the
      // one-request-per-connection contract is satisfied.
      phase = 'done';
      detach();
      settledResolve?.();
    }

    function onError(error: Error): void {
      if (phase === 'done') return;
      fail(new ClassPError('MALFORMED_FRAME', `transport error: ${error.message}`));
    }

    socket.on('data', onData);
    socket.on('end', onEnd);
    socket.on('error', onError);
    armTimer();
  });
}
