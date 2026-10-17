/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Same-Host Endpoint Ownership (L-IPC-1 C2, C5.3, C8)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * Deployment host:  Windows named pipe — `\\.\pipe\<name>`.
 * Dev / CI (POSIX): UNIX domain socket inside an owner-only directory.
 *
 * Operating-system facts this module relies on, and their limits (accepted, not mitigated):
 *  - libuv creates the Windows pipe with a NULL security descriptor (default DACL) and does
 *    not pass `PIPE_REJECT_REMOTE_CLIENTS`. Effective ACL/SDDL enforcement is therefore NOT
 *    demonstrated; Gate V measurements V-1 (ACL/SDDL capture) and V-4 (collision/re-bind)
 *    were PA-WAIVED and are waivers, not technical proof.
 *  - On POSIX the socket mode IS enforceable and is set to 0600 and then read back; group
 *    and other permissions must be absent or the endpoint refuses to serve (C5.3).
 *  - `FILE_FLAG_FIRST_PIPE_INSTANCE` semantics (single bind, name already taken fails closed)
 *    are obtained from the single `listen()` attempt: `EADDRINUSE` refuses the endpoint.
 */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { IpcRefusal } from './errors.js';

/** Name rule: bounded, opaque, no separators — prevents path traversal on POSIX. */
const ENDPOINT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

/** POSIX socket mode: owner read/write only. */
export const UNIX_SOCKET_MODE = 0o600;
/** POSIX directory mode: owner only. */
export const UNIX_DIRECTORY_MODE = 0o700;

export type EndpointKind = 'NAMED_PIPE' | 'UNIX_SOCKET';

export interface EndpointLayout {
  readonly kind: EndpointKind;
  /** The exact path handed to `net.Server.listen`. */
  readonly path: string;
  /** POSIX parent directory (undefined for named pipes). */
  readonly directory: string | undefined;
  /** Whether this platform can enforce and verify endpoint permissions (POSIX only). */
  readonly modeEnforced: boolean;
}

export function isWindowsHost(): boolean {
  return process.platform === 'win32';
}

/** Computes the endpoint layout without touching the filesystem. */
export function endpointLayout(name: string, directory?: string): EndpointLayout {
  if (!ENDPOINT_NAME_PATTERN.test(name)) {
    throw new IpcRefusal('MALFORMED_REQUEST', 'Endpoint name is not a permitted identifier.');
  }

  if (isWindowsHost()) {
    return {
      kind: 'NAMED_PIPE',
      path: `\\\\.\\pipe\\${name}`,
      directory: undefined,
      // Documented limitation: the OS permissions of a named pipe cannot be verified from
      // Node/libuv here (V-1 PA-WAIVED). Gate C owns any measurement.
      modeEnforced: false,
    };
  }

  const parent = directory ?? path.join(os.tmpdir(), 'iips-ipc');
  return {
    kind: 'UNIX_SOCKET',
    path: path.join(parent, `${name}.sock`),
    directory: parent,
    modeEnforced: true,
  };
}

/**
 * Prepares the POSIX endpoint directory: created owner-only, then read back.
 * Fails closed when the effective mode is wider than owner-only.
 */
export function prepareEndpointDirectory(layout: EndpointLayout): void {
  if (layout.kind !== 'UNIX_SOCKET' || layout.directory === undefined) {
    return;
  }
  try {
    fs.mkdirSync(layout.directory, { recursive: true, mode: UNIX_DIRECTORY_MODE });
    fs.chmodSync(layout.directory, UNIX_DIRECTORY_MODE);
    const stat = fs.statSync(layout.directory);
    if ((stat.mode & 0o077) !== 0) {
      throw new IpcRefusal('BINDING_INVALID', 'Endpoint directory permissions are wider than owner-only.');
    }
  } catch (error) {
    if (error instanceof IpcRefusal) {
      throw error;
    }
    throw new IpcRefusal('BINDING_INVALID', 'Endpoint directory could not be prepared.');
  }
}

/**
 * Removes a STALE socket left by an unclean shutdown — but never a regular file.
 * A non-socket path at the endpoint location is refused, not deleted.
 */
export function removeStaleEndpoint(layout: EndpointLayout): void {
  if (layout.kind !== 'UNIX_SOCKET') {
    return;
  }
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(layout.path);
  } catch {
    return; // absent: nothing to do
  }
  if (!stat.isSocket()) {
    throw new IpcRefusal('BINDING_INVALID', 'Endpoint path exists and is not a stale socket.');
  }
  try {
    fs.unlinkSync(layout.path);
  } catch {
    throw new IpcRefusal('BINDING_INVALID', 'Stale endpoint could not be removed.');
  }
}

/**
 * Probe: is the endpoint CURRENTLY served?
 *
 * A POSIX socket file proves nothing on its own — an unclean shutdown also leaves one. The
 * only reliable discriminator is a connection attempt: success means a live listener owns
 * the name, `ECONNREFUSED`/`ENOENT` means it is stale. Any other error is treated as LIVE
 * (fail closed) so an unreadable state can never be converted into a successful bind.
 */
export async function isEndpointLive(socketPath: string, timeoutMs = 250): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const socket = net.createConnection(socketPath);
    const finish = (live: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(live);
    };
    const timer = setTimeout(() => finish(true), timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOENT') {
        finish(false);
        return;
      }
      finish(true);
    });
  });
}

/**
 * Binds exactly one listener to the endpoint. Non-forced, single attempt.
 * A LIVE endpoint is refused (never unlinked); `EADDRINUSE` (including a live named-pipe
 * instance) fails closed — there is no retry loop and no "first caller wins" fallback.
 */
export async function bindEndpoint(server: net.Server, layout: EndpointLayout): Promise<void> {
  prepareEndpointDirectory(layout);

  if (layout.kind === 'UNIX_SOCKET' && (await isEndpointLive(layout.path))) {
    throw new IpcRefusal('BINDING_INVALID', 'Endpoint is already served; refusing a second bind.');
  }

  removeStaleEndpoint(layout);

  await new Promise<void>((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException): void => {
      server.removeListener('listening', onListening);
      if (error.code === 'EADDRINUSE') {
        reject(new IpcRefusal('BINDING_INVALID', 'Endpoint name is already in use; refusing to serve.'));
        return;
      }
      reject(new IpcRefusal('BINDING_INVALID', 'Endpoint could not be bound.'));
    };
    const onListening = (): void => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(layout.path);
  });

  // C5.3 — permissions are SET and then VERIFIED, not assumed.
  if (layout.kind === 'UNIX_SOCKET') {
    try {
      fs.chmodSync(layout.path, UNIX_SOCKET_MODE);
      const stat = fs.statSync(layout.path);
      const mode = stat.mode & 0o777;
      if (mode !== UNIX_SOCKET_MODE) {
        await closeEndpoint(server, layout);
        throw new IpcRefusal('BINDING_INVALID', 'Endpoint permissions could not be restricted to owner-only.');
      }
    } catch (error) {
      if (error instanceof IpcRefusal) {
        throw error;
      }
      await closeEndpoint(server, layout);
      throw new IpcRefusal('BINDING_INVALID', 'Endpoint permissions could not be verified.');
    }
  }
}

/** Reports the effective POSIX mode of the bound endpoint (diagnostics; no disclosure). */
export function readEndpointMode(layout: EndpointLayout): number | null {
  if (layout.kind !== 'UNIX_SOCKET') {
    return null;
  }
  try {
    return fs.statSync(layout.path).mode & 0o777;
  } catch {
    return null;
  }
}

/** Closes the listener and removes the POSIX socket file. Idempotent. */
export async function closeEndpoint(server: net.Server, layout: EndpointLayout): Promise<void> {
  await new Promise<void>((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });

  if (layout.kind === 'UNIX_SOCKET') {
    try {
      const stat = fs.lstatSync(layout.path);
      if (stat.isSocket()) {
        fs.unlinkSync(layout.path);
      }
    } catch {
      /* absent: nothing to remove */
    }
  }
}
