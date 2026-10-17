/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Shared Test Harness
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * This file is one of the fifteen approved additions. It contains NO product logic: it
 * provisions a disposable store, resolves a disposable principal, starts the endpoint on a
 * POSIX socket, and offers raw exchange helpers so the suites assert BYTE-LEVEL behaviour
 * (notably: zero bytes on every refusal).
 *
 * Windows named pipes are NOT exercised here. ACL/SDDL capture (V-1) and collision/re-bind
 * measurement (V-4) were PA-WAIVED and remain waivers, not technical proof.
 */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

import test from 'node:test';
import assert from 'node:assert/strict';

import { initializePersistenceWithConfig, type PersistenceHandle } from '../src/persistence/bootstrap.js';
import { temporaryPersistenceConfig } from '../src/persistence/config.js';
import { IdentityService } from '../src/app_identity/service.js';
import { LocalPrincipalService } from '../src/app_identity/local_principal.js';
import { DurablePortfolioStore } from '../src/portfolio/durable-store.js';
import { startIpcEndpoint, type IpcEndpointHandle } from '../src/ipc/entrypoint.js';
import { encodeFrame, IPC_PROTOCOL_VERSION } from '../src/ipc/framing.js';
import { IpcRefusalSink } from '../src/ipc/errors.js';

export const ACTOR = { actor: 'gate-b-test-harness', context: 'Gate B implementation tests' };

export interface Fixture {
  readonly directory: string;
  readonly endpointName: string;
  readonly socketDirectory: string;
  readonly socketPath: string;
  readonly handle: PersistenceHandle;
  readonly store: DurablePortfolioStore;
  readonly applicationUserId: string;
  readonly tenantId: string;
  /** Empty when the fixture was created with `withBinding: false`. */
  readonly endpointId: string;
  cleanup(): void;
}

function shortTempDirectory(): string {
  // Deliberately short: POSIX socket paths are capped near 108 bytes.
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gb-'));
}

/**
 * Provisions a disposable durable store, one application user, one membership and (unless
 * suppressed) exactly one ACTIVE local principal binding — the sole authority source.
 */
export function createFixture(options?: { withBinding?: boolean; tenantId?: string }): Fixture {
  const directory = shortTempDirectory();
  const endpointName = `gateb-${randomBytes(4).toString('hex')}`;
  const socketDirectory = path.join(directory, 'iips-ipc');
  const handle = initializePersistenceWithConfig(
    temporaryPersistenceConfig(path.join(directory, 'portfolio.sqlite'))
  );

  const identity = new IdentityService(handle.connection);
  const user = identity.createApplicationUser(ACTOR);
  const tenantId = options?.tenantId ?? 'TENANT-GATE-B';
  identity.provisionTenantMembership({
    applicationUserId: user.applicationUserId,
    tenantId,
    actor: ACTOR.actor,
  });

  let endpointId = '';
  if (options?.withBinding !== false) {
    endpointId = new LocalPrincipalService(handle.connection).createBinding({
      applicationUserId: user.applicationUserId,
      tenantId,
      actor: ACTOR.actor,
    }).endpointId;
  }

  return {
    directory,
    endpointName,
    socketDirectory,
    socketPath: path.join(socketDirectory, `${endpointName}.sock`),
    handle,
    store: new DurablePortfolioStore(handle.connection),
    applicationUserId: user.applicationUserId,
    tenantId,
    endpointId,
    cleanup(): void {
      try {
        handle.close();
      } catch {
        /* already closed */
      }
      try {
        fs.rmSync(directory, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    },
  };
}

/** Provisions a second, independent principal inside the SAME store (cross-owner tests). */
export function provisionSecondPrincipal(
  fixture: Fixture,
  tenantId = 'TENANT-GATE-B-OTHER'
): { applicationUserId: string; tenantId: string } {
  const identity = new IdentityService(fixture.handle.connection);
  const user = identity.createApplicationUser(ACTOR);
  identity.provisionTenantMembership({
    applicationUserId: user.applicationUserId,
    tenantId,
    actor: ACTOR.actor,
  });
  return { applicationUserId: user.applicationUserId, tenantId };
}

/**
 * Writes a genuinely STALE socket: a child process binds it and exits WITHOUT closing, so
 * the kernel leaves the file behind exactly as an unclean shutdown would. `net.Server.close()`
 * removes the file cleanly, so it cannot be used to reproduce this state.
 */
export function createStaleSocket(socketPath: string): void {
  fs.mkdirSync(path.dirname(socketPath), { recursive: true, mode: 0o700 });
  execFileSync(
    process.execPath,
    [
      '-e',
      [
        "const net = require('node:net');",
        'const server = net.createServer();',
        'server.listen(process.argv[1], () => process.exit(0));',
      ].join('\n'),
      socketPath,
    ],
    { stdio: 'pipe' }
  );
}

export interface StartedEndpoint {
  readonly endpoint: IpcEndpointHandle;
  readonly socketPath: string;
  readonly refusals: IpcRefusalSink;
  close(): Promise<void>;
}

export async function startEndpoint(
  fixture: Fixture,
  options?: {
    socketDirectory?: string;
    limits?: {
      maxRequestBytes?: number;
      maxResponseBytes?: number;
      maxConcurrentConnections?: number;
      idleTimeoutMs?: number;
    };
    refusalSink?: IpcRefusalSink;
  }
): Promise<StartedEndpoint> {
  const refusals = options?.refusalSink ?? new IpcRefusalSink();
  const endpoint = await startIpcEndpoint({
    endpointName: fixture.endpointName,
    directory: options?.socketDirectory ?? fixture.socketDirectory,
    handle: fixture.handle,
    refusalSink: refusals,
    ...(options?.limits ? { limits: options.limits } : {}),
  });
  return {
    endpoint,
    socketPath: endpoint.layout.path,
    refusals,
    close: () => endpoint.close(),
  };
}

// ── Raw exchange helpers ─────────────────────────────────────────────────────────────────

export interface RawExchange {
  /** Exactly the bytes the server emitted. Zero bytes is the required refusal outcome. */
  readonly bytes: Buffer;
  /** True when the server closed (or destroyed) the connection before the client gave up. */
  readonly closed: boolean;
}

/** Sends raw bytes and collects everything the server emits until close/timeout. */
export function exchange(socketPath: string, payload: Buffer | string, timeoutMs = 4_000): Promise<RawExchange> {
  const body = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
  return new Promise<RawExchange>((resolve) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const socket = net.createConnection(socketPath);

    const done = (closed: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ bytes: Buffer.concat(chunks), closed });
    };

    const timer = setTimeout(() => done(false), timeoutMs);

    socket.once('connect', () => {
      if (body.length > 0) {
        socket.write(body);
      }
    });
    socket.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    socket.once('end', () => done(true));
    socket.once('close', () => done(true));
    socket.once('error', () => done(true));
  });
}

/** Connects and deliberately stays silent; used for the C5.1 and idle-timeout assertions. */
export function connectSilent(socketPath: string, waitMs = 400): Promise<RawExchange> {
  return new Promise<RawExchange>((resolve) => {
    const chunks: Buffer[] = [];
    let settled = false;
    const socket = net.createConnection(socketPath);

    const done = (closed: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ bytes: Buffer.concat(chunks), closed });
    };

    const timer = setTimeout(() => done(false), waitMs);
    socket.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    socket.once('end', () => done(true));
    socket.once('close', () => done(true));
    socket.once('error', () => done(true));
  });
}

/** Builds one length-prefixed request frame. */
export function frame(envelope: unknown, maxBytes = 64 * 1024): Buffer {
  return encodeFrame(envelope, maxBytes);
}

/** Builds a raw frame from arbitrary body bytes (for malformed-body tests). */
export function rawFrame(body: Buffer | string, declaredLength?: number): Buffer {
  const payload = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  const header = Buffer.alloc(4);
  header.writeUInt32BE(declaredLength ?? payload.length, 0);
  return Buffer.concat([header, payload]);
}

export interface DecodedResponse {
  readonly v: number;
  readonly ok: true;
  readonly result: unknown;
  readonly requestId?: string;
}

/** Decodes the single success response frame a server may emit. */
export function decodeResponse(bytes: Buffer): DecodedResponse {
  assert.ok(bytes.length > 4, 'expected a response frame');
  const length = bytes.readUInt32BE(0);
  assert.equal(bytes.length, 4 + length, 'response frame length must match its declared length');
  return JSON.parse(bytes.subarray(4).toString('utf8')) as DecodedResponse;
}

/** Convenience: a well-formed list request. */
export function listRequest(requestId = 'req-list'): Buffer {
  return frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.list', requestId });
}

// ── Harness self-check ───────────────────────────────────────────────────────────────────
// The harness runs under the same runner as the suites, so this single assertion proves it
// is wired correctly rather than silently provisioning nothing.
test('GATE-B-SUPPORT: the harness provisions one ACTIVE binding and a reachable endpoint', async () => {
  const fixture = createFixture();
  let started: StartedEndpoint | null = null;
  try {
    started = await startEndpoint(fixture);
    assert.equal(started.endpoint.principal.applicationUserId, fixture.applicationUserId);
    assert.equal(started.endpoint.principal.endpointId, fixture.endpointId);

    const result = await exchange(started.socketPath, listRequest());
    assert.equal(result.bytes.length > 0, true, 'a valid, authorized request must receive bytes');
    const response = decodeResponse(result.bytes);
    assert.equal(response.ok, true);
    assert.equal(response.requestId, 'req-list');
    assert.deepEqual(response.result, []);
  } finally {
    if (started) {
      await started.close();
    }
    fixture.cleanup();
  }
});
