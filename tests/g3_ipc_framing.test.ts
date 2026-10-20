/**
 * Gate 3 T-A — IPC framing regressions (host-adaptive).
 *
 * The live endpoint follows the HOST platform: an AF_UNIX socket on POSIX, a
 * named pipe under \\.\pipe on native Windows. Framing behavior is
 * platform-independent, so every malformed/oversize/version/unknown/truncated/
 * pipelined frame must produce zero bytes and a closed connection on both hosts,
 * with the reason recorded only in the bounded local diagnostic sink (C6).
 *
 * Paths fed to the resolver are built with the same platform semantics as the
 * simulated target: native join() plus HOST_PLATFORM, never a Windows-native
 * temp path paired with a POSIX absolute-path check.
 *
 * Windows named-pipe event ordering cannot be observed on a Linux host, so the
 * libuv byte-mode pipe sequence (client shutdown = FlushFileBuffers; EOF only
 * when the 50 ms eof timer force-breaks the pipe) is emulated deterministically
 * with an EventEmitter fake in the flush-guard suite. The emulation is labeled
 * and is NOT native-Windows evidence.
 */
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createConnection, type Socket } from 'node:net';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import {
  ClassPError,
  diagnosticSink,
  IPC_LENGTH_PREFIX_BYTES,
  IPC_REQUEST_MAX_BYTES,
  readSingleFrame,
  successFrame,
  type FrameReader,
  type RequestEnvelope,
} from '../src/ipc/protocol.js';
import {
  IPC_ENDPOINT_SETTING,
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';

const drainTicks = (ticks = 4): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ticks * 5));

/**
 * Deterministic in-memory socket: event delivery is controlled explicitly by
 * the test, so "the second frame arrives in a separate data event" does not
 * depend on kernel/stream coalescing behavior. readSingleFrame only uses the
 * EventEmitter surface (on/off/emit).
 *
 * Writes are acknowledged after `ackTicks` event-loop turns, which models the
 * asynchronous flush of a real socket/pipe: a frame lands in `written` only
 * once its write callback would have fired, and destroy() cancels writes that
 * have not flushed yet (so `written` always means bytes the peer actually
 * received). `forceBrokenPipeEof()` models the libuv Windows named-pipe
 * sequence where the only server-visible EOF is the 50 ms forced pipe break,
 * after which every write fails with EPIPE.
 */
class FakeSocket extends EventEmitter {
  public readonly written: Buffer[] = [];
  private readonly pending: { chunk: Buffer; cb: (error?: Error | null) => void }[] = [];
  public destroyed = false;
  public broken = false;
  // Mirrors stream.Readable.readableEnded: true once the pipe-break 'end' has
  // been emitted, after which no further data event can arrive.
  public readableEnded = false;

  constructor(private readonly ackTicks = 1) {
    super();
  }

  private queue(chunk: Buffer, cb?: (error?: Error | null) => void): void {
    if (this.broken) {
      const error = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });
      setImmediate(() => {
        this.emit('error', error);
        cb?.(error);
      });
      return;
    }
    const entry = { chunk, cb: cb ?? (() => undefined) };
    this.pending.push(entry);
    let remaining = this.ackTicks;
    const tick = (): void => {
      if (this.destroyed) {
        entry.cb(Object.assign(new Error('socket destroyed before flush'), { code: 'ECANCELED' }));
        return;
      }
      remaining -= 1;
      if (remaining > 0) {
        setImmediate(tick);
        return;
      }
      this.written.push(entry.chunk);
      this.pending.splice(this.pending.indexOf(entry), 1);
      entry.cb();
    };
    setImmediate(tick);
  }

  end(chunk?: Buffer, cb?: (error?: Error | null) => void): this {
    if (chunk) this.queue(chunk, cb);
    else setImmediate(() => cb?.());
    return this;
  }

  write(chunk: Buffer, cb?: (error?: Error | null) => void): boolean {
    this.queue(chunk, cb);
    return !this.broken;
  }

  destroy(): this {
    this.destroyed = true;
    for (const entry of this.pending) {
      entry.cb(Object.assign(new Error('socket destroyed before flush'), { code: 'ECANCELED' }));
    }
    this.pending.length = 0;
    return this;
  }

  /** libuv Windows: FlushFileBuffers delivers no EOF; the 50ms eof timer breaks the pipe. */
  forceBrokenPipeEof(): void {
    this.broken = true;
    this.readableEnded = true;
    this.emit('end');
  }
}

function makeFrame(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(IPC_LENGTH_PREFIX_BYTES);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const IS_WINDOWS_HOST = HOST_PLATFORM === 'win32';
const ENDPOINT_NAME = `iips-g3-framing-${process.pid}`;

function frame(body: Buffer): Buffer {
  const prefix = Buffer.allocUnsafe(IPC_LENGTH_PREFIX_BYTES);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function jsonFrame(value: unknown): Buffer {
  return frame(Buffer.from(JSON.stringify(value), 'utf8'));
}

function rawRoundTrip(socketPath: string, payload: Buffer | null, idleMs = 0): Promise<Buffer> {
  return new Promise((resolve) => {
    const socket = createConnection({ path: socketPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', () => resolve(Buffer.concat(chunks)));
    socket.on('close', () => resolve(Buffer.concat(chunks)));
    socket.on('connect', () => {
      if (idleMs > 0) {
        setTimeout(() => socket.end(), idleMs);
        return;
      }
      if (payload) {
        socket.write(payload, () => socket.end());
      } else {
        socket.end();
      }
    });
  });
}

describe('g3 / T-A ipc framing', () => {
  let root: string;
  let handle: IpcHandle;
  let endpointPath: string;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-framing-'));
    const env = {
      IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME,
      IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
    };
    const target = resolveEndpointTarget(env, HOST_PLATFORM);
    assert.equal(target.kind, IS_WINDOWS_HOST ? 'windows-named-pipe' : 'unix-socket');
    endpointPath = target.path;

    const settlement = target.kind === 'windows-named-pipe' ? 'flush-guard' : 'half-close-required';
    handle = await listenIpc(
      target,
      (socket: Socket) => {
        socket.on('error', () => socket.destroy());
        readSingleFrame(socket, { idleTimeoutMs: 2000, settlement })
          .then(async (reader) => {
            try {
              if (reader.settlement === 'half-close-required') {
                await reader.whenSettled;
              }
              socket.end(
                successFrame(reader.envelope.op, { echoed: reader.envelope.op }, reader.envelope.requestId),
              );
            } finally {
              reader.release();
            }
          })
          .catch((error: unknown) => {
            if (error instanceof ClassPError) {
              diagnosticSink.record(error.reason, error.message);
            }
            socket.destroy();
          });
      },
      { platform: HOST_PLATFORM },
    );
  });

  after(async () => {
    await handle.stop();
    rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    diagnosticSink.drain();
  });

  it('binds the platform-correct endpoint family', () => {
    if (IS_WINDOWS_HOST) {
      assert.match(endpointPath, /^\\\\\.\\pipe\\/);
    } else {
      assert.ok(endpointPath.endsWith('.sock'));
      assert.ok(existsSync(endpointPath));
    }
    assert.equal(typeof handle.server.address(), 'string');
  });

  it('a valid frame receives exactly one response frame', async () => {
    const response = await rawRoundTrip(endpointPath, jsonFrame({ v: 1, op: 'portfolio.list' }));
    assert.ok(response.byteLength > IPC_LENGTH_PREFIX_BYTES);
    const declared = response.readUInt32BE(0);
    assert.equal(declared, response.byteLength - IPC_LENGTH_PREFIX_BYTES);
    const body = JSON.parse(response.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.op, 'portfolio.list');
  });

  it('oversize declared length -> zero bytes, OVERSIZE_FRAME in the local sink', async () => {
    const prefix = Buffer.allocUnsafe(4);
    prefix.writeUInt32BE(IPC_REQUEST_MAX_BYTES + 1, 0);
    const response = await rawRoundTrip(endpointPath, Buffer.concat([prefix, Buffer.from('x')]));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'OVERSIZE_FRAME');
  });

  it('an oversize buffered body -> zero bytes, OVERSIZE_FRAME', async () => {
    const response = await rawRoundTrip(endpointPath, jsonFrame({ v: 1, op: 'portfolio.list', payload: { big: 'x'.repeat(IPC_REQUEST_MAX_BYTES) } }));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'OVERSIZE_FRAME');
  });

  it('malformed JSON body -> zero bytes, MALFORMED_FRAME', async () => {
    const response = await rawRoundTrip(endpointPath, frame(Buffer.from('x', 'utf8')));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  it('protocol version other than 1 -> zero bytes, PROTOCOL_VERSION_UNSUPPORTED', async () => {
    const response = await rawRoundTrip(endpointPath, jsonFrame({ v: 9, op: 'portfolio.list' }));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'PROTOCOL_VERSION_UNSUPPORTED');
  });

  it('unknown operation -> zero bytes, UNKNOWN_OPERATION', async () => {
    const response = await rawRoundTrip(endpointPath, jsonFrame({ v: 1, op: 'nope' }));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'UNKNOWN_OPERATION');
  });

  it('truncated frame closed early -> zero bytes, MALFORMED_FRAME', async () => {
    const full = jsonFrame({ v: 1, op: 'portfolio.list' });
    const response = await rawRoundTrip(endpointPath, full.subarray(0, full.byteLength - 3));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  it('pipelined second frame -> zero bytes, MALFORMED_FRAME', async () => {
    const response = await rawRoundTrip(
      endpointPath,
      Buffer.concat([jsonFrame({ v: 1, op: 'portfolio.list' }), jsonFrame({ v: 1, op: 'portfolio.get' })]),
    );
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  it('an unexpected envelope key -> zero bytes, MALFORMED_FRAME', async () => {
    const response = await rawRoundTrip(endpointPath, jsonFrame({ v: 1, op: 'portfolio.list', tenant: 'x' }));
    assert.equal(response.byteLength, 0);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'CALLER_SUPPLIED_AUTHORITY');
  });

  it('an idle connection receives no banner, greeting or any byte', async () => {
    const response = await rawRoundTrip(endpointPath, null, 150);
    assert.equal(response.byteLength, 0);
  });

  it('the diagnostic reason never appears on the wire across all refusals', async () => {
    const refused = [
      frame(Buffer.from('x', 'utf8')),
      jsonFrame({ v: 9, op: 'portfolio.list' }),
      jsonFrame({ v: 1, op: 'nope' }),
    ];
    for (const payload of refused) {
      const response = await rawRoundTrip(endpointPath, payload);
      assert.equal(response.byteLength, 0);
      assert.equal(response.toString('utf8'), '');
    }
  });

  it('a second frame delivered in a separate write/event is refused over a real socket', async () => {
    diagnosticSink.drain();
    const f1 = jsonFrame({ v: 1, op: 'portfolio.list' });
    const f2 = jsonFrame({ v: 1, op: 'portfolio.get' });
    const received = await new Promise<Buffer>((resolve) => {
      const socket = createConnection({ path: endpointPath });
      const chunks: Buffer[] = [];
      socket.on('data', (chunk) => chunks.push(chunk));
      socket.on('error', () => resolve(Buffer.concat(chunks)));
      socket.on('close', () => resolve(Buffer.concat(chunks)));
      socket.on('connect', () => {
        socket.write(f1, () => {
          setTimeout(() => socket.write(f2, () => socket.end()), 25);
        });
      });
    });

    if (!IS_WINDOWS_HOST) {
      // AF_UNIX delivers a usable half-close, so the airtight gate withholds
      // the response entirely: zero bytes plus a Class P diagnostic.
      assert.equal(received.byteLength, 0);
      assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
      return;
    }

    // Windows named pipes provide no pre-break half-close signal (libuv:
    // FlushFileBuffers only; EOF arrives when the 50 ms timer force-breaks
    // the pipe, when writes can no longer succeed). A second frame delayed
    // past the response flush therefore cannot make the first response
    // undispatched. The enforceable Windows guarantees are asserted instead:
    // exactly one well-formed response, the guard still trips on the second
    // frame, and it is never dispatched (no second response).
    assert.ok(received.byteLength > IPC_LENGTH_PREFIX_BYTES, 'one response frame was delivered before the pipe broke');
    const declared = received.readUInt32BE(0);
    assert.equal(declared, received.byteLength - IPC_LENGTH_PREFIX_BYTES);
    const body = JSON.parse(received.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.op, 'portfolio.list', 'the second frame is never dispatched');
    // Allow the trailing guard event to land before inspecting the sink.
    await drainTicks(4);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });
});

describe('g3 / T-A frame reader internals (deterministic event ordering)', () => {
  const f1 = makeFrame({ v: 1, op: 'portfolio.list' });
  const f2 = makeFrame({ v: 1, op: 'portfolio.get' });

  it('rejects whenSettled when a second frame arrives in a separate data event', async () => {
    const socket = new FakeSocket();
    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', f1);
    const reader = await pending;
    assert.equal(reader.envelope.op, 'portfolio.list');

    socket.emit('data', f2);
    await assert.rejects(reader.whenSettled, (error: unknown) => {
      assert.ok(error instanceof ClassPError);
      assert.equal((error as ClassPError).reason, 'MALFORMED_FRAME');
      return true;
    });
    reader.release();
    assert.equal(socket.destroyed, false);
  });

  it('rejects partial trailing bytes delivered after the complete frame', async () => {
    const socket = new FakeSocket();
    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', f1);
    const reader = await pending;
    socket.emit('data', Buffer.from([0x00, 0x01]));
    await assert.rejects(reader.whenSettled, ClassPError);
    reader.release();
  });

  it('accepts a single frame split across arbitrary chunk boundaries, then half-close', async () => {
    const socket = new FakeSocket();
    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    for (let i = 0; i < f1.byteLength; i++) {
      socket.emit('data', f1.subarray(i, i + 1));
    }
    const reader = await pending;
    assert.equal(reader.envelope.op, 'portfolio.list');
    socket.emit('end');
    await reader.whenSettled;
    reader.release();
  });

  it('IDLE_TIMEOUT fires in the guard phase when the peer never half-closes', async () => {
    const socket = new FakeSocket();
    const pending = readSingleFrame(socket as unknown as Socket, 40);
    socket.emit('data', f1);
    const reader = await pending;
    await assert.rejects(reader.whenSettled, (error: unknown) => {
      assert.ok(error instanceof ClassPError);
      assert.equal((error as ClassPError).reason, 'IDLE_TIMEOUT');
      return true;
    });
    reader.release();
  });

  it('release preserves the caller-owned error listener and removes only reader listeners', async () => {
    const socket = new FakeSocket();
    let callerErrors = 0;
    const callerErrorHandler = (): void => {
      callerErrors += 1;
    };
    socket.on('error', callerErrorHandler);

    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', f1);
    const reader = await pending;
    assert.equal(socket.listenerCount('data'), 1);
    assert.equal(socket.listenerCount('end'), 1);
    assert.equal(socket.listenerCount('error'), 2);

    socket.emit('end');
    await reader.whenSettled;
    reader.release();

    assert.equal(socket.listenerCount('data'), 0);
    assert.equal(socket.listenerCount('end'), 0);
    assert.equal(socket.listenerCount('error'), 1);
    let threw = false;
    try {
      socket.emit('error', Object.assign(new Error('EPIPE during response'), { code: 'EPIPE' }));
    } catch {
      threw = true;
    }
    assert.equal(threw, false, 'the caller-owned error handler absorbs the fault');
    assert.equal(callerErrors, 1);
  });

  it('a transport error after frame parse rejects whenSettled without removing the caller handler', async () => {
    const socket = new FakeSocket();
    let callerErrors = 0;
    socket.on('error', () => {
      callerErrors += 1;
    });

    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', f1);
    const reader = await pending;
    socket.emit('error', Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }));

    await assert.rejects(reader.whenSettled, (error: unknown) => {
      assert.ok(error instanceof ClassPError);
      assert.equal((error as ClassPError).reason, 'MALFORMED_FRAME');
      return true;
    });
    reader.release();
    assert.equal(callerErrors, 1, 'the caller-owned error listener still fired');
    assert.equal(socket.listenerCount('error'), 1);
    assert.equal(socket.written.length, 0, 'no response is written after a transport fault');
  });

  it('release is idempotent and leaves no listeners behind', async () => {
    const socket = new FakeSocket();
    const pending = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', f1);
    const reader = await pending;
    socket.emit('end');
    await reader.whenSettled;
    reader.release();
    reader.release();
    assert.equal(socket.listenerCount('data'), 0);
    assert.equal(socket.listenerCount('end'), 0);
    assert.equal(socket.listenerCount('error'), 0);
  });
});

describe('g3 / T-A flush-guard settlement (Windows named-pipe transport emulation)', () => {
  let root: string;
  let db: DatabaseSync;
  const listFrame = makeFrame({ v: 1, op: 'portfolio.list' });
  const secondFrame = makeFrame({ v: 1, op: 'portfolio.get' });

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'g3-flush-guard-'));
    db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-1', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-1', 'b-1', 'tenant-local', 'owner-local', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    diagnosticSink.drain();
  });

  it('exposes the requested settlement policy and defaults to half-close-required', async () => {
    const socket = new FakeSocket();
    const halfClose = readSingleFrame(socket as unknown as Socket, 2000);
    socket.emit('data', listFrame);
    const reader = await halfClose;
    assert.equal(reader.settlement, 'half-close-required');
    reader.release();

    const guarded = readSingleFrame(socket as unknown as Socket, {
      idleTimeoutMs: 2000,
      settlement: 'flush-guard',
    });
    socket.emit('data', listFrame);
    const guardedReader = await guarded;
    assert.equal(guardedReader.settlement, 'flush-guard');
    guardedReader.release();
  });

  it('delivers exactly one response even though pipe EOF only arrives via the forced 50 ms break', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    setImmediate(() => socket.forceBrokenPipeEof());
    await drainTicks(6);

    assert.equal(socket.written.length, 1, 'exactly one response frame is delivered');
    assert.equal(socket.destroyed, false, 'a successful response never destroys the socket');
    const response = socket.written[0];
    const declared = response.readUInt32BE(0);
    assert.ok(declared > 0 && declared === response.byteLength - IPC_LENGTH_PREFIX_BYTES);
    const body = JSON.parse(response.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.op, 'portfolio.list');
    assert.equal(socket.listenerCount('data'), 0);
    assert.equal(socket.listenerCount('end'), 0);
    assert.equal(socket.listenerCount('error'), 1);
  });

  it('refuses a second frame delivered in a later event before the write flushes, zero bytes', async () => {
    const socket = new FakeSocket(3);
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    setImmediate(() => socket.emit('data', secondFrame));
    await drainTicks(8);

    assert.equal(socket.written.length, 0, 'no response byte reaches a pipelining peer');
    assert.equal(socket.destroyed, true);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  it('refuses a second frame emitted immediately after frame 1, zero bytes', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    socket.emit('data', secondFrame);
    await drainTicks(4);

    assert.equal(socket.written.length, 0);
    assert.equal(socket.destroyed, true);
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  it('a transport error before the response flush yields zero bytes and no throw', async () => {
    const socket = new FakeSocket(3);
    socket.on('error', () => undefined);
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    setImmediate(() =>
      socket.emit('error', Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })),
    );
    try {
      await drainTicks(8);
    } catch {
      assert.fail('the transport error must not throw out of the handler');
    }
    assert.equal(socket.written.length, 0);
    assert.equal(socket.destroyed, true);
  });

  it('the broken-pipe EOF after a successful flush is harmless and leaves no reader listeners', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    await drainTicks(2);
    assert.equal(socket.written.length, 1);
    socket.forceBrokenPipeEof();
    await drainTicks(2);
    assert.equal(socket.written.length, 1, 'the committed response is not retracted or duplicated');
    assert.equal(socket.listenerCount('data'), 0);
    assert.equal(socket.listenerCount('end'), 0);
    assert.equal(socket.listenerCount('error'), 1, 'the dispatcher error handler remains owner-attached');
  });

  // Round-4 defect regression (Windows-transport emulation, not native evidence):
  // a connection handler constructed without the transport-derived settlement
  // policy defaults to half-close-required and therefore withholds its response
  // until the only EOF a Windows byte-mode pipe ever delivers — the 50 ms
  // forced break, when writes fail. The peer receives zero bytes. This is the
  // exact mechanism behind the native-Windows empty-response failures.
  it('a default-policy handler withholds every response byte on the Windows pipe timeline', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { idleTimeoutMs: 2000 })(socket as unknown as Socket);
    socket.emit('data', listFrame);
    setImmediate(() => socket.forceBrokenPipeEof());
    await drainTicks(6);

    assert.equal(socket.written.length, 0, 'the half-close gate never opens on a Windows pipe');
    assert.equal(socket.destroyed, true, 'the failed response write fails closed with a teardown');
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
  });

  // Companion regression: deriving the policy from the actual endpoint target
  // (as startIpcServer does, and as every direct handler construction must)
  // selects flush-guard for a named pipe and the response is delivered in full
  // before the forced break.
  it('an endpoint-derived flush-guard handler delivers the full response on the same timeline', async () => {
    const pipeTarget = resolveEndpointTarget(
      { [IPC_ENDPOINT_SETTING]: '\\\\.\\pipe\\g3-round4-emulation' },
      'win32',
    );
    const socketTarget = resolveEndpointTarget(
      { [IPC_ENDPOINT_SETTING]: '/tmp/g3-round4-emulation.sock' },
      'linux',
    );
    assert.equal(settlementPolicyForEndpoint(pipeTarget), 'flush-guard');
    assert.equal(settlementPolicyForEndpoint(socketTarget), 'half-close-required');

    const socket = new FakeSocket();
    createConnectionHandler(db, {
      settlement: settlementPolicyForEndpoint(pipeTarget),
      idleTimeoutMs: 2000,
    })(socket as unknown as Socket);
    socket.emit('data', listFrame);
    setImmediate(() => socket.forceBrokenPipeEof());
    await drainTicks(6);

    assert.equal(socket.written.length, 1, 'exactly one response frame reaches the peer');
    const body = JSON.parse(socket.written[0].subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.op, 'portfolio.list');
  });

  // §E boundary (Windows-transport emulation, not native evidence): frame 2 is
  // delivered in a separate data event only AFTER the response has flushed.
  // Zero-byte refusal is impossible once the response is irreversibly flushed,
  // but the one-frame invariant stays enforceable: frame 2 is never dispatched
  // (no second response), it trips MALFORMED_FRAME in the bounded sink, and the
  // connection is destroyed. The watchdog then detaches on terminal EOF.
  it('a post-flush second frame is recorded and torn down without a second response', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    await drainTicks(2);
    assert.equal(socket.written.length, 1, 'the frame-1 response has already flushed');

    socket.emit('data', secondFrame);
    await drainTicks(4);

    assert.equal(socket.written.length, 1, 'the second frame is never dispatched or answered');
    assert.equal(socket.destroyed, true, 'the post-flush violation tears the connection down');
    assert.equal(diagnosticSink.peek().at(-1)?.reason, 'MALFORMED_FRAME');
    const firstBody = JSON.parse(socket.written[0].subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(firstBody.op, 'portfolio.list');

    socket.forceBrokenPipeEof();
    await drainTicks(2);
    assert.equal(socket.listenerCount('data'), 0);
    assert.equal(socket.listenerCount('end'), 0);
    assert.equal(socket.listenerCount('error'), 1, 'only the caller-owned error handler remains');
  });

  it('a clean post-flush EOF with no trailing frame leaves the sink empty', async () => {
    const socket = new FakeSocket();
    createConnectionHandler(db, { settlement: 'flush-guard', idleTimeoutMs: 2000 })(
      socket as unknown as Socket,
    );
    socket.emit('data', listFrame);
    await drainTicks(2);
    assert.equal(socket.written.length, 1);
    assert.equal(socket.destroyed, false);

    socket.forceBrokenPipeEof();
    await drainTicks(2);
    assert.equal(socket.written.length, 1);
    assert.equal(socket.destroyed, false, 'a well-behaved single-frame peer is not torn down');
    assert.equal(diagnosticSink.peek().length, 0);
  });
});
