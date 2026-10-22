/**
 * Gate 3 — closed operation dispatch (act §4.2 item 13; contract v1 §5/§6; C6/C7).
 *
 * Per connection: read exactly one frame, enforce C7 caller-authority refusal at
 * any depth, resolve the owner binding afresh from the database, then route the
 * closed read/write set. Every pre-authorization failure is Class P: zero bytes
 * and connection close, with the reason confined to the bounded local diagnostic
 * sink. Post-authorization failures are Class A typed, non-disclosing envelopes.
 * All four writes return WRITE_NOT_AUTHORIZED before any store mutation while the
 * W-1 conjunction is unmet.
 *
 * This module deliberately has no import edge to persistence/provisioning.ts:
 * Gate A′ provisioning is unreachable from every IPC operation (static regression).
 */
import type { DatabaseSync } from 'node:sqlite';
import type { Socket } from 'node:net';
import {
  ClassPError,
  classAFrame,
  diagnosticSink,
  findRefusedWireKeys,
  IPC_WRITE_OPERATIONS,
  readSingleFrame,
  successFrame,
  type ClassAOutcome,
  type ClassPReason,
  type FrameReader,
  type FrameSettlementPolicy,
  type RequestEnvelope,
} from './protocol.js';
import { BindingAbsentError, BindingInvalidError, resolveActiveBinding } from '../persistence/binding.js';
import {
  DurablePortfolioStore,
  ResourceUnavailableError,
} from '../persistence/portfolio_store.js';

const RESOURCE_UNAVAILABLE_DETAIL = 'the requested resource is not available';

export interface ConnectionHandlerOptions {
  /**
   * Transport settlement policy. AF_UNIX uses the airtight half-close gate;
   * Windows named pipes use the flush guard because a pipe half-close EOF is
   * only delivered when libuv force-breaks the pipe 50 ms after shutdown.
   */
  readonly settlement?: FrameSettlementPolicy;
  readonly idleTimeoutMs?: number;
}

function refuseClassP(socket: Socket, reason: ClassPReason, detail: string): void {
  diagnosticSink.record(reason, detail);
  // Class P is zero bytes: destroy without writing anything. Destroy also
  // cancels any pending write, so a response queued before the guard tripped
  // never reaches a pipelining peer.
  socket.destroy();
}

/**
 * Writes exactly one frame WITHOUT half-closing the writable side.
 *
 * Used on the flush-guard (Windows named-pipe) path only. A libuv pipe has no
 * half-close primitive: `end()` there is a FlushFileBuffers that neither signals
 * EOF to the peer nor closes the handle. Writing and then closing the handle
 * explicitly states what actually happens on that transport.
 */
function writeFrame(socket: Socket, frame: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(frame, (error?: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Writes exactly one frame and half-closes the writable side, surfacing write
 * failures instead of swallowing them. The frame reader's flush guard is raced
 * against this write so trailing data arriving before the flush still produces
 * a zero-byte Class P refusal.
 */
function endFrame(socket: Socket, frame: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.end(frame, (error?: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export function createConnectionHandler(
  db: DatabaseSync,
  options: ConnectionHandlerOptions = {},
): (socket: Socket) => void {
  const store = new DurablePortfolioStore(db);
  const settlement: FrameSettlementPolicy = options.settlement ?? 'half-close-required';

  return (socket: Socket): void => {
    socket.on('error', () => {
      // A peer reset is a transport event; nothing may be written after it.
      socket.destroy();
    });

    void (async () => {
      let reader: FrameReader;
      let envelope: RequestEnvelope;
      try {
        reader = await readSingleFrame(socket, {
          settlement,
          ...(options.idleTimeoutMs ? { idleTimeoutMs: options.idleTimeoutMs } : {}),
        });
        envelope = reader.envelope;
      } catch (error) {
        if (error instanceof ClassPError) {
          refuseClassP(socket, error.reason, error.message);
          return;
        }
        refuseClassP(socket, 'MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
        return;
      }

      // Declared outside the try so Class A error frames in the catch block
      // use the same guarded single-response write path. Before assignment
      // (a fault during the pre-write validation) it stays a zero-byte no-op.
      let writeGuarded: (frame: Buffer) => Promise<boolean> = () => Promise.resolve(false);
      try {
        // C7: caller-supplied authority/identity at any depth is refused before any
        // store access, at top level and inside payload/options alike.
        const refusedKeys = findRefusedWireKeys(envelope);
        if (refusedKeys.length > 0) {
          refuseClassP(socket, 'CALLER_SUPPLIED_AUTHORITY', `refused keys: ${refusedKeys.join(', ')}`);
          return;
        }

        // Per-request binding resolution; no cache, no process-global owner.
        let owner;
        try {
          owner = resolveActiveBinding(db);
        } catch (error) {
          if (error instanceof BindingAbsentError) {
            refuseClassP(socket, 'BINDING_ABSENT', error.message);
            return;
          }
          if (error instanceof BindingInvalidError) {
            refuseClassP(socket, 'BINDING_INVALID', error.message);
            return;
          }
          refuseClassP(socket, 'BINDING_INVALID', 'binding resolution failed');
          return;
        }

        // One-request-per-connection gate (T-2).
        //
        // AF_UNIX ('half-close-required'): withhold the response until the clean
        // half-close proves no second frame follows; a later data/error event
        // rejects whenSettled and the connection ends as a zero-byte refusal.
        //
        // Windows named pipe ('flush-guard'): a usable half-close EOF does not
        // exist (libuv delivers EOF only by force-breaking the pipe 50 ms after
        // client shutdown, when writes can no longer succeed), so the response
        // is written immediately while the guard stays attached; the write is
        // raced against whenGuardTripped below. A reference client cannot emit
        // bytes after its own half-close, so only a pipelining peer can trip it.
        if (reader.settlement === 'half-close-required') {
          try {
            await reader.whenSettled;
          } catch (error) {
            if (error instanceof ClassPError) {
              refuseClassP(socket, error.reason, error.message);
              return;
            }
            refuseClassP(socket, 'MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
            return;
          }
        }

        // Single response-writing path for both policies. Under flush-guard the
        // write races the guard: any trailing byte or transport fault before the
        // flush completes turns into a zero-byte Class P refusal. Under
        // half-close-required, settlement was awaited above and this is a plain
        // write whose transport errors are still refused with zero bytes.
        writeGuarded = async (frame: Buffer): Promise<boolean> => {
          if (!reader.isGuardIntact()) {
            const fault = await reader.whenGuardTripped;
            refuseClassP(socket, fault.reason, fault.message);
            return false;
          }
          try {
            if (reader.settlement === 'flush-guard') {
              await Promise.race([
                writeFrame(socket, frame),
                reader.whenGuardTripped.then((fault) => {
                  throw fault;
                }),
              ]);
              // The single response has flushed. Close the server handle now:
              // `listenIpc` sets maxConnections = 1 (C5.4) and Node decrements
              // `server._connections` only in Socket._destroy, so an open handle
              // would consume the one capacity slot for the server's lifetime and
              // every later connection would be dropped before 'connection'.
              // Closing also delivers the peer's EOF: on a libuv pipe `end()` is
              // a FlushFileBuffers with no half-close, so the peer observes
              // ERROR_BROKEN_PIPE only on handle close. The frame is already
              // flushed, so the peer drains it first.
              //
              // Consequence (contract position, act §4.2 item 11 / §4.3 T-A):
              // a frame delivered after this point cannot reach a closed handle,
              // so the one-request/at-most-one-response invariant is enforced
              // structurally. The pipelined-frame refusal — the case T-A governs
              // ("zero bytes; connection closed (Class P)") — still happens before
              // the flush and is unchanged below.
              socket.destroy();
              return true;
            }
            await endFrame(socket, frame);
            return true;
          } catch (error) {
            if (error instanceof ClassPError) {
              refuseClassP(socket, error.reason, error.message);
              return false;
            }
            refuseClassP(socket, 'MALFORMED_FRAME', error instanceof Error ? error.message : String(error));
            return false;
          }
        };

        const requestId = envelope.requestId;
        const payload = envelope.payload ?? {};

        if ((IPC_WRITE_OPERATIONS as readonly string[]).includes(envelope.op)) {
          // Gate E W-1(3) and W-1(4) are false: refuse before any mutation. No
          // environment flag, test result or operator assertion can enable writes.
          await writeGuarded(classAFrame(envelope.op, 'WRITE_NOT_AUTHORIZED', requestId));
          return;
        }

        let result: unknown;
        switch (envelope.op) {
          case 'portfolio.list':
            // Contract v1 §6: the `portfolio.list` result IS `PortfolioSummary[]`.
            // The result is the array itself, not an envelope wrapped around it.
            // The effective Gate 3 act fixes the wire property names by reference
            // to contract v1 and requires them to be implemented exactly.
            result = store.list(owner);
            break;
          case 'portfolio.get': {
            const portfolioId = String(payload.portfolioId ?? 'DEFAULT_PORTFOLIO');
            // Contract v1 §6: the `portfolio.get` result IS `PortfolioDetail`.
            result = store.get(owner, portfolioId);
            break;
          }
          case 'portfolio.revisions': {
            const portfolioId = String(payload.portfolioId ?? 'DEFAULT_PORTFOLIO');
            // Contract v1 §6: the `portfolio.revisions` result IS `RevisionEntry[]`.
            result = store.revisions(owner, portfolioId);
            break;
          }
          default:
            // The parser already closes the operation set; stay fail-closed.
            refuseClassP(socket, 'UNKNOWN_OPERATION', `not dispatched: ${envelope.op}`);
            return;
        }
        await writeGuarded(successFrame(envelope.op, result, requestId));
      } catch (error) {
        // A throw before the writer is assigned (e.g. the C7 scan itself)
        // cannot produce a frame; the no-op writer keeps the path zero-byte.
        const write = writeGuarded;
        if (error instanceof ResourceUnavailableError) {
          // Missing, foreign and tombstoned portfolios share one byte-stable outcome.
          await write(classAFrame(envelope.op, 'RESOURCE_UNAVAILABLE', envelope.requestId, RESOURCE_UNAVAILABLE_DETAIL));
          return;
        }
        const outcome: ClassAOutcome = 'UNAVAILABLE';
        await write(classAFrame(envelope.op, outcome, envelope.requestId, 'the request could not be completed'));
      } finally {
        // Detach exactly the reader-owned listeners; the caller's socket error
        // handler registered above remains available for transmission faults.
        reader.release();
        // Flush-guard transports (Windows named pipes): every path must leave
        // the capacity slot free. A successful response closes the handle in
        // writeGuarded; a Class P refusal or transport fault closes it in
        // refuseClassP. This guard covers any remaining flush-guard exit so no
        // path can hold the single connection slot open.
        if (reader.settlement === 'flush-guard' && !socket.destroyed) {
          socket.destroy();
        }
      }
    })();
  };
}
