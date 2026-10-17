/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — IPC Connection Lifecycle & Refusal Enforcement
 * (L-IPC-1 C1, C3, C5.1, C5.4, C5.5, C6, C7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * C5.1 — NO BYTES BEFORE A VALID, AUTHORIZED REQUEST.
 *   The server never writes a greeting, banner, protocol string or acknowledgement. Bytes are
 *   written ONLY after (a) a complete frame arrives, (b) the envelope validates, (c) no
 *   caller-supplied authority is present, and (d) the single ACTIVE binding authorizes the
 *   request. Every other outcome is a silent close.
 *
 * C6 — FAIL CLOSED, UNIFORMLY. Unauthorized ≡ missing: the caller cannot distinguish a
 *   refused principal, a refused claim, a foreign resource and a nonexistent resource,
 *   because in all of those cases it receives exactly zero bytes and a closed socket.
 *
 * C7 — Refusals are enforced here as well as in framing; the server refuses rather than
 *   ignores, and never falls back to another transport, another principal or a retry.
 */

import net from 'node:net';

import { bindEndpoint, closeEndpoint, type EndpointLayout } from './endpoint.js';
import {
  DEFAULT_MAX_REQUEST_BYTES,
  DEFAULT_MAX_RESPONSE_BYTES,
  FrameDecoder,
  decodeEnvelope,
  encodeResponse,
  IPC_PROTOCOL_VERSION,
} from './framing.js';
import { IpcRefusal, IpcRefusalSink, isIpcRefusal, type IpcRefusalReason } from './errors.js';

/** The single provisioned principal, resolved from the binding — never from the wire. */
export interface IpcPrincipal {
  readonly applicationUserId: string;
  readonly tenantId: string;
  readonly endpointId: string;
}

export interface IpcOperationContext {
  readonly principal: IpcPrincipal;
}

/** Fixed operation dispatcher. Implementations must refuse, never silently succeed. */
export interface IpcOperationDispatcher {
  readonly operations: readonly string[];
  execute(operation: string, payload: unknown, context: IpcOperationContext): unknown;
}

export interface IpcServerLimits {
  /** Hard cap on one request frame (C5.4). */
  readonly maxRequestBytes: number;
  /** Hard cap on one response frame. */
  readonly maxResponseBytes: number;
  /** Hard cap on concurrent connections (C5.4). */
  readonly maxConcurrentConnections: number;
  /** Idle timeout: a connection that sends no complete frame is closed (C5.4). */
  readonly idleTimeoutMs: number;
}

export const DEFAULT_IPC_LIMITS: IpcServerLimits = {
  maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
  maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES,
  maxConcurrentConnections: 8,
  idleTimeoutMs: 5_000,
};

export interface IpcServerDependencies {
  /**
   * Resolves the single ACTIVE provisioned binding. MUST throw `IpcRefusal` when the
   * binding is absent, malformed, ambiguous or not ACTIVE (C5.5). Never returns a guess.
   */
  readonly resolvePrincipal: () => IpcPrincipal;
  /** Fixed dispatcher for the operation set. */
  readonly operations: IpcOperationDispatcher;
  /** Optional limit overrides (tests, operator tuning). */
  readonly limits?: Partial<IpcServerLimits>;
  /** Optional local refusal sink. Never durable, never transmitted. */
  readonly refusalSink?: IpcRefusalSink;
}

export interface IpcServerStats {
  readonly acceptedConnections: number;
  readonly refusedConnections: number;
  readonly activeConnections: number;
}

function reasonOf(error: unknown): IpcRefusalReason {
  if (isIpcRefusal(error)) {
    return error.reason;
  }
  return 'OPERATION_FAILED';
}

/**
 * One listener, one endpoint, one principal. The class owns no durable state and performs
 * no writes: every operation it dispatches is read-only by construction (Gate E owns writes).
 */
export class IpcServer {
  private readonly server: net.Server;
  private readonly limits: IpcServerLimits;
  private readonly sink: IpcRefusalSink;
  private layout: EndpointLayout | null = null;
  private activeConnections = 0;
  private acceptedConnections = 0;
  private refusedConnections = 0;
  private connectionSequence = 0;
  private closed = false;

  constructor(private readonly dependencies: IpcServerDependencies) {
    this.limits = { ...DEFAULT_IPC_LIMITS, ...(dependencies.limits ?? {}) };
    this.sink = dependencies.refusalSink ?? new IpcRefusalSink();
    this.server = net.createServer((socket) => this.onConnection(socket));
  }

  public get refusalSink(): IpcRefusalSink {
    return this.sink;
  }

  public get stats(): IpcServerStats {
    return {
      acceptedConnections: this.acceptedConnections,
      refusedConnections: this.refusedConnections,
      activeConnections: this.activeConnections,
    };
  }

  /** Binds the endpoint. Fails closed when it cannot be bound exactly once (C5.3). */
  public async listen(layout: EndpointLayout): Promise<void> {
    if (this.closed) {
      throw new IpcRefusal('BINDING_INVALID', 'Server has been closed.');
    }
    await bindEndpoint(this.server, layout);
    this.layout = layout;
  }

  public get endpointLayout(): EndpointLayout | null {
    return this.layout;
  }

  public async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    const layout = this.layout;
    if (layout) {
      await closeEndpoint(this.server, layout);
    } else {
      await new Promise<void>((resolve) => this.server.close(() => resolve()));
    }
  }

  // ---------------------------------------------------------------------------------------

  private refuse(reason: IpcRefusalReason, connectionId: string): void {
    this.refusedConnections += 1;
    this.sink.record(reason, connectionId);
  }

  private onConnection(socket: net.Socket): void {
    const connectionId = `conn-${++this.connectionSequence}`;

    // C5.4 — bounded concurrency. Over-capacity connections are dropped WITHOUT bytes.
    if (this.activeConnections >= this.limits.maxConcurrentConnections) {
      this.refuse('CAPACITY_EXCEEDED', connectionId);
      socket.destroy();
      return;
    }

    this.activeConnections += 1;
    this.acceptedConnections += 1;
    socket.setNoDelay(true);

    const decoder = new FrameDecoder(this.limits.maxRequestBytes);
    let settled = false;

    const release = (): void => {
      this.activeConnections -= 1;
      socket.setTimeout(0);
    };

    /** Settles the connection. `response` is written ONLY on a fully authorized success. */
    const finish = (reason?: IpcRefusalReason, response?: Buffer): void => {
      if (settled) {
        return;
      }
      settled = true;
      release();
      if (reason !== undefined || response === undefined) {
        if (reason !== undefined) {
          this.refuse(reason, connectionId);
        }
        socket.destroy();
        return;
      }
      // Success is the ONLY path that emits bytes.
      socket.end(response);
    };

    socket.on('error', () => {
      if (!settled) {
        settled = true;
        release();
      }
    });

    socket.on('close', () => {
      if (!settled) {
        settled = true;
        release();
      }
    });

    // C5.4 — idle timeout. Nothing is written; the connection is simply dropped.
    socket.setTimeout(this.limits.idleTimeoutMs, () => finish('IDLE_TIMEOUT'));

    socket.on('data', (chunk: Buffer) => {
      if (settled) {
        return;
      }

      let frames: Buffer[];
      try {
        frames = decoder.push(chunk);
      } catch (error) {
        finish(reasonOf(error));
        return;
      }

      if (frames.length === 0) {
        return; // partial frame: still no bytes emitted
      }

      // Exactly one request per connection: extra pipelined frames are a protocol violation.
      if (frames.length > 1) {
        finish('MALFORMED_FRAME');
        return;
      }

      let response: Buffer;
      try {
        response = this.handleFrame(frames[0]!);
      } catch (error) {
        finish(reasonOf(error));
        return;
      }

      finish(undefined, response);
    });
  }

  /**
   * Validates and authorizes exactly one frame.
   * Returns the response bytes ONLY when the request is valid and authorized; throws
   * `IpcRefusal` otherwise (caller closes with zero bytes).
   */
  private handleFrame(frame: Buffer): Buffer {
    const envelope = decodeEnvelope(frame);

    if (!this.dependencies.operations.operations.includes(envelope.op)) {
      throw new IpcRefusal('UNKNOWN_OPERATION', 'Operation is not dispatched by this endpoint.');
    }

    // C3 / C5.2 / C5.5 — authority is resolved from the provisioned binding, after the
    // frame validated. A missing/ambiguous/inactive binding refuses before dispatch.
    const principal = this.dependencies.resolvePrincipal();

    const result = this.dependencies.operations.execute(envelope.op, envelope.payload, { principal });

    return encodeResponse(
      {
        v: IPC_PROTOCOL_VERSION,
        ok: true,
        ...(envelope.requestId !== undefined ? { requestId: envelope.requestId } : {}),
        result,
      },
      this.limits.maxResponseBytes
    );
  }
}
