/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — IPC Refusal Taxonomy (L-IPC-1 C6)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * C6 — FAIL CLOSED, UNIFORMLY. Every refusal below is indistinguishable ON THE WIRE: the
 * server emits ZERO bytes and closes the connection. The reason is recorded ONLY in an
 * in-memory sink for local tests and operator diagnosis; it is never serialized, never
 * written to the durable store, and never disclosed to a caller.
 *
 * This module performs no I/O and holds no state beyond the caller-supplied sink.
 */

/**
 * Internal refusal vocabulary. None of these values ever reaches the wire.
 *
 * `RESOURCE_UNAVAILABLE` deliberately covers "does not exist", "belongs to another
 * principal", "tenant mismatch" and "tombstoned" so that C6 (`unauthorized ≡ missing`)
 * is structural rather than a convention each call site must remember.
 */
export type IpcRefusalReason =
  | 'MALFORMED_FRAME'
  | 'OVERSIZE_FRAME'
  | 'PROTOCOL_VERSION_UNSUPPORTED'
  | 'IDLE_TIMEOUT'
  | 'CAPACITY_EXCEEDED'
  | 'CALLER_SUPPLIED_AUTHORITY'
  | 'BINDING_ABSENT'
  | 'BINDING_INVALID'
  | 'UNKNOWN_OPERATION'
  | 'MALFORMED_REQUEST'
  | 'RESOURCE_UNAVAILABLE'
  | 'WRITE_NOT_AUTHORIZED'
  | 'CANONICAL_IDENTITY_UNRESOLVED'
  | 'OPERATION_FAILED';

/** A governed refusal. Carries a reason for the local sink only — never a wire payload. */
export class IpcRefusal extends Error {
  public readonly reason: IpcRefusalReason;

  constructor(reason: IpcRefusalReason, message?: string) {
    super(message ?? `IPC request refused: ${reason}`);
    this.name = 'IpcRefusal';
    this.reason = reason;
  }
}

export function isIpcRefusal(error: unknown): error is IpcRefusal {
  return error instanceof IpcRefusal;
}

/** One locally recorded refusal. Never transmitted. */
export interface IpcRefusalEvent {
  readonly reason: IpcRefusalReason;
  readonly connectionId: string;
  readonly at: string;
}

/**
 * In-memory refusal sink used by tests and operator diagnostics.
 *
 * Deliberately NOT durable: writing refusal rows would create a second record of caller
 * activity outside the accepted A-3 audit line (C11) and would require a write path that
 * Gate E, not Gate B, owns. Bounded so a hostile caller cannot grow memory without limit.
 */
export class IpcRefusalSink {
  private events: IpcRefusalEvent[] = [];

  constructor(private readonly capacity: number = 512) {}

  public record(reason: IpcRefusalReason, connectionId: string, at: string = new Date().toISOString()): void {
    if (this.events.length >= this.capacity) {
      this.events.shift();
    }
    this.events.push({ reason, connectionId, at });
  }

  public snapshot(): readonly IpcRefusalEvent[] {
    return this.events.slice();
  }

  public reasons(): readonly IpcRefusalReason[] {
    return this.events.map((event) => event.reason);
  }

  public count(reason?: IpcRefusalReason): number {
    if (!reason) {
      return this.events.length;
    }
    return this.events.filter((event) => event.reason === reason).length;
  }

  public clear(): void {
    this.events = [];
  }
}
