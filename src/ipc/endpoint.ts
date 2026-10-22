/**
 * Gate 3 — same-host IPC endpoint (act §4.2 item 12; contract v1 T-1; C1; T-F).
 *
 * POSIX: an AF_UNIX socket inside an owner-only 0700 state directory, socket mode
 * 0600, with owner verification. A pre-existing state directory that is not
 * owner-owned 0700 is REFUSED, never silently chmod-repaired; only directories this
 * process creates are made 0700 and re-verified.
 *
 * Windows: the target is a named pipe under \\.\pipe. Node/libuv binds with a NULL
 * security descriptor, so the platform default pipe DACL applies and the
 * application cannot narrow it; readableAll/writableAll (which only widen access)
 * are never passed. The descriptor below states honestly what the application does
 * and does not enforce; the DACL itself is Gate 4 host evidence, not claimed here.
 *
 * Creates no TCP, HTTP or URL listener on any platform: listen() receives only a
 * path string and server.address() is always a string. All path handling here is
 * platform-explicit (posix vs win32) so the module behaves identically on a native
 * Windows host and under Linux CI.
 *
 * Readiness and shutdown: listenIpc resolves only after the OS confirms the bind
 * at exactly the configured local path (and, on POSIX, after the socket mode is
 * set to 0600 and read back). Any failure after the OS bind tears the endpoint
 * down before rejecting, so a half-bound listener is never observable. The
 * returned handle's stop() is idempotent, destroys live connections so an idle
 * or half-open peer cannot block shutdown, and removes the POSIX socket file
 * only when this handle owned the successful bind.
 */
import { createServer, type Server, type Socket } from 'node:net';
import { chmodSync, lstatSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { posix as posixPath, win32 as win32Path } from 'node:path';
import type { FrameSettlementPolicy } from './protocol.js';

export const IPC_ENDPOINT_SETTING = 'IIPS_G2_IPC_ENDPOINT';
export const IPC_STATE_DIR_SETTING = 'IIPS_G3_LOCAL_STATE_DIR';

export class EndpointConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EndpointConfigurationError';
  }
}
export class EndpointCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EndpointCollisionError';
  }
}
export class UnsafeEndpointDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeEndpointDirectoryError';
  }
}

export interface EndpointTarget {
  readonly kind: 'unix-socket' | 'windows-named-pipe';
  readonly path: string;
  readonly source: 'absolute-path' | 'name-in-state-directory';
}

export interface WindowsPipeSecurityDescriptor {
  readonly platform: 'win32';
  readonly endpoint: string;
  readonly enforcedByApplication: false;
  readonly applicationControls: readonly string[];
  readonly platformDefault: 'named-pipe default DACL (libuv binds with NULL security attributes)';
  readonly notVerifiableHere: readonly string[];
  readonly gate4EvidenceItems: readonly string[];
}

/**
 * Resolver rules kept byte-identical to the IRR client `resolveIpcEndpoint`:
 * same URL / host:port / relative-path refusals, same bare-name resolution.
 * Path absoluteness is always judged with the TARGET platform's path module, so a
 * Windows path is validated correctly even when the code runs on Linux, and a
 * POSIX-style path never leaks into the win32 branch.
 */
export function resolveEndpointTarget(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): EndpointTarget {
  const raw = env[IPC_ENDPOINT_SETTING];
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new EndpointConfigurationError(`${IPC_ENDPOINT_SETTING} is not set`);
  }
  const value = raw.trim();

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.includes('://')) {
    throw new EndpointConfigurationError('the endpoint setting must not be a URL');
  }
  if (/^[^/\\]+:\d+$/.test(value)) {
    throw new EndpointConfigurationError('the endpoint setting must not be a host:port');
  }

  const isAbsoluteTarget = platform === 'win32' ? win32Path.isAbsolute : posixPath.isAbsolute;
  if (isAbsoluteTarget(value)) {
    if (platform === 'win32') {
      if (!value.startsWith('\\\\.\\pipe\\')) {
        throw new EndpointConfigurationError('on Windows the endpoint path must be a named pipe under \\\\.\\pipe');
      }
      return { kind: 'windows-named-pipe', path: value, source: 'absolute-path' };
    }
    if (value.startsWith('\\\\')) {
      throw new EndpointConfigurationError('a named-pipe path is not a valid POSIX endpoint');
    }
    return { kind: 'unix-socket', path: value, source: 'absolute-path' };
  }

  if (!/^[A-Za-z0-9._-]+$/.test(value) || value.includes('..')) {
    throw new EndpointConfigurationError(
      'the endpoint name may contain only letters, digits, dot, underscore and hyphen',
    );
  }
  const directory = env[IPC_STATE_DIR_SETTING];
  if (typeof directory !== 'string' || directory.trim().length === 0) {
    throw new EndpointConfigurationError(`a bare endpoint name requires ${IPC_STATE_DIR_SETTING}`);
  }
  const isAbsoluteFor = platform === 'win32' ? win32Path.isAbsolute : posixPath.isAbsolute;
  if (!isAbsoluteFor(directory.trim())) {
    throw new EndpointConfigurationError(`${IPC_STATE_DIR_SETTING} must be absolute`);
  }
  if (platform === 'win32') {
    // The pipe namespace is kernel-managed; the state directory is not part of the
    // pipe path but its absoluteness is still validated above.
    return { kind: 'windows-named-pipe', path: `\\\\.\\pipe\\${value}`, source: 'name-in-state-directory' };
  }
  const base = directory.trim().replace(/\/+$/, '');
  return { kind: 'unix-socket', path: `${base}/${value}.sock`, source: 'name-in-state-directory' };
}

/**
 * The settlement policy that matches an endpoint's transport. A Windows named
 * pipe cannot deliver a usable half-close EOF before the pipe breaks, so it
 * uses the flush guard; AF_UNIX keeps the airtight half-close gate.
 */
export function settlementPolicyForEndpoint(target: EndpointTarget): FrameSettlementPolicy {
  return target.kind === 'windows-named-pipe' ? 'flush-guard' : 'half-close-required';
}

export function windowsPipeDescriptor(target: EndpointTarget): WindowsPipeSecurityDescriptor {
  return {
    platform: 'win32',
    endpoint: target.path,
    enforcedByApplication: false,
    applicationControls: [
      'same-host pipe namespace only; no TCP, HTTP or URL listener',
      'pipe name confined to \\\\.\\pipe with fail-closed name collision (FILE_FLAG_FIRST_PIPE_INSTANCE)',
      'single concurrent connection and 64 KiB / 256 KiB frame caps',
      'readableAll/writableAll are never passed to the bind call',
      'zero bytes before any valid, authorized request',
    ],
    platformDefault: 'named-pipe default DACL (libuv binds with NULL security attributes)',
    notVerifiableHere: [
      'effective DACL/SDDL contents',
      'second-account write denial',
      'remote/SMB reachability',
      'clean-shutdown pipe disappearance and host collision lifecycle',
    ],
    gate4EvidenceItems: ['V-1', 'V-2', 'V-3', 'V-4', 'Q9'],
  };
}

/**
 * True when the endpoint lives solely in the Windows kernel named-pipe
 * namespace. The namespace is flat and non-persistent: a live pipe name can
 * answer generic existence/attribute probes (GetFileAttributesW), so a plain
 * `existsSync(pipePath)` is NOT a filesystem-artifact check on Windows. The
 * actual no-filesystem-artifact invariant is: the target kind is a named pipe,
 * the path matches the \\.\pipe\ namespace, and no endpoint directory or
 * socket file is created on disk (verified separately against the state dir).
 */
export function isWindowsPipeNamespaceOnly(target: EndpointTarget): boolean {
  return target.kind === 'windows-named-pipe' && /^\\\\\.\\pipe\\[^\\/]+$/.test(target.path);
}

function currentUid(): number {
  if (typeof process.getuid === 'function') return process.getuid();
  return -1;
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Bind-failure codes that mean the endpoint name is already claimed. On a
 * Windows named pipe the FILE_FLAG_FIRST_PIPE_INSTANCE rejection of a second
 * instance surfaces through libuv as EACCES/EPERM/EBUSY as well as EADDRINUSE,
 * so the pipe namespace treats all of them as the occupied-name outcome rather
 * than an untyped transport error. POSIX keeps the exact pair.
 */
function collisionCodeFor(target: EndpointTarget, error: unknown): string | undefined {
  const code = errorCode(error);
  if (code === undefined) return undefined;
  const codes =
    target.kind === 'windows-named-pipe'
      ? ['EADDRINUSE', 'EEXIST', 'EACCES', 'EPERM', 'EBUSY']
      : ['EADDRINUSE', 'EEXIST'];
  return codes.includes(code) ? code : undefined;
}

/**
 * Validates a POSIX state directory. A pre-existing directory must already be
 * owner-owned 0700; an unsafe one is refused, not repaired. A missing directory is
 * created 0700 by this process and re-verified. POSIX-only: never invoked for a
 * Windows named-pipe target, which has no filesystem endpoint directory.
 */
export function preparePosixEndpoint(target: EndpointTarget, platform: NodeJS.Platform = process.platform): string {
  if (platform === 'win32') {
    throw new EndpointConfigurationError('a POSIX socket endpoint cannot be prepared on win32');
  }
  const stateDir = target.path.slice(0, target.path.lastIndexOf('/'));
  let createdHere = false;
  try {
    lstatSync(stateDir);
  } catch {
    mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    createdHere = true;
  }

  // lstat semantics are deliberate: a symlinked state directory must not pass
  // as the owner-only real directory it points at.
  const dirStat = lstatSync(stateDir);
  if (dirStat.isSymbolicLink()) {
    throw new UnsafeEndpointDirectoryError(`the state path is a symbolic link, not a real directory: ${stateDir}`);
  }
  if (!dirStat.isDirectory()) {
    throw new UnsafeEndpointDirectoryError(`the state path is not a directory: ${stateDir}`);
  }
  const ownerUid = currentUid();
  if (ownerUid >= 0 && dirStat.uid !== ownerUid) {
    throw new UnsafeEndpointDirectoryError(`the state directory is owned by uid ${dirStat.uid}, not ${ownerUid}`);
  }
  const mode = dirStat.mode & 0o777;
  if (mode !== 0o700) {
    throw new UnsafeEndpointDirectoryError(
      `the state directory mode is ${mode.toString(8)}; only an owner-only 0700 directory is accepted`,
    );
  }
  if (createdHere) {
    chmodSync(stateDir, 0o700);
    const reStat = lstatSync(stateDir);
    if ((reStat.mode & 0o777) !== 0o700) {
      throw new UnsafeEndpointDirectoryError('the newly created state directory could not be locked to 0700');
    }
  }

  try {
    // lstat, not stat: a dangling symlink still occupies the endpoint name.
    const existing = lstatSync(target.path);
    const kind = existing.isSocket() ? 'socket' : existing.isSymbolicLink() ? 'symlink' : 'file';
    throw new EndpointCollisionError(
      `an entry already exists at the endpoint path (${kind}): ${target.path}`,
    );
  } catch (error) {
    if (error instanceof EndpointCollisionError) throw error;
    if (errorCode(error) !== 'ENOENT') {
      // Only ENOENT is the collision-free state; an uninspectable path (for
      // example EACCES) fails closed instead of proceeding to bind.
      throw new EndpointConfigurationError(
        `the endpoint path could not be inspected (${errorCode(error) ?? 'unknown'}): ${target.path}`,
      );
    }
  }
  return target.path;
}

export interface IpcHandle {
  readonly server: Server;
  readonly target: EndpointTarget;
  stop(): Promise<void>;
}

export interface ListenOptions {
  platform?: NodeJS.Platform;
  /**
   * Test seam: inject a server that fails its bind with EADDRINUSE (F7). The
   * dispatcher (onConnection) is wired onto the injected server exactly as on
   * the production server, so a seam bind that succeeds still serves requests.
   */
  serverFactory?: (path: string) => Server;
  maxConnections?: number;
}

/**
 * Binds the same-host endpoint. The server option set contains no
 * readableAll/writableAll and no numeric port: the only listen argument is the
 * local socket/pipe path. A second simultaneous connection is refused by the
 * one-connection capacity cap (C5.4). On Windows the same call binds a named pipe;
 * no filesystem path, chmod or uid check is involved on that platform.
 *
 * The promise resolves only once the OS has confirmed the bind at exactly the
 * configured path; configuration, preparation and bind failures all surface as
 * rejections (never synchronous throws), and a failure after the OS bind first
 * tears the endpoint down so no half-ready listener remains.
 */
export async function listenIpc(
  target: EndpointTarget,
  onConnection: (socket: Socket) => void,
  options: ListenOptions = {},
): Promise<IpcHandle> {
  const platform = options.platform ?? process.platform;
  if (target.kind === 'unix-socket') {
    preparePosixEndpoint(target, platform);
  }
  if (platform === 'win32' && process.platform !== 'win32' && !options.serverFactory) {
    // A backslash pipe path is a legal literal filename on POSIX, so binding it
    // here would silently create an ordinary AF_UNIX socket with a strange name.
    // Windows targets may only be exercised off-host through the injected seam.
    throw new EndpointConfigurationError(
      'a Windows named-pipe endpoint cannot be bound on a non-Windows host without an injected test server',
    );
  }

  const liveSockets = new Set<Socket>();
  let boundHere = false;
  let stopPromise: Promise<void> | null = null;

  const onTrackedConnection = (socket: Socket): void => {
    liveSockets.add(socket);
    socket.once('close', () => liveSockets.delete(socket));
    try {
      onConnection(socket);
    } catch {
      // A throwing dispatcher fails this connection closed, with zero bytes.
      socket.destroy();
    }
  };

  const server = options.serverFactory
    ? options.serverFactory(target.path)
    : // allowHalfOpen: the reference client half-closes its write side after the
      // single request frame and still expects a response. With the default
      // (false) Node auto-ends the server writable side on the peer's FIN, which
      // would make the response write fail after the frame reader has observed
      // the clean half-close. Half-open mode keeps the writable side under
      // explicit server control; the reader's idle timeout still closes idle
      // peers, so this opens no lingering-connection path.
      createServer({ allowHalfOpen: true }, onTrackedConnection);
  if (options.serverFactory) {
    // Injected seam servers are constructed without our connection handler;
    // attach the dispatcher explicitly so the seam cannot silently drop it.
    server.on('connection', onTrackedConnection);
  }
  server.maxConnections = options.maxConnections ?? 1;

  const removeOwnedSocketFile = (): void => {
    if (target.kind !== 'unix-socket' || !boundHere) {
      return;
    }
    try {
      // Only the socket this handle bound may be removed — never a foreign
      // entry (for example the live socket of the endpoint we collided with).
      if (lstatSync(target.path).isSocket()) {
        unlinkSync(target.path);
      }
    } catch {
      // Already gone: Node removes the socket file on a clean close.
    }
  };

  const stop = (): Promise<void> => {
    if (stopPromise) {
      return stopPromise;
    }
    stopPromise = new Promise<void>((resolveStop, rejectStop) => {
      // server.close() alone waits for existing connections, so an idle or
      // half-open peer would block shutdown indefinitely; destroy them first.
      for (const socket of liveSockets) {
        socket.destroy();
      }
      if (!server.listening) {
        removeOwnedSocketFile();
        resolveStop();
        return;
      }
      try {
        server.close((error) => {
          removeOwnedSocketFile();
          if (error && errorCode(error) !== 'ERR_SERVER_NOT_RUNNING') {
            rejectStop(error);
            return;
          }
          resolveStop();
        });
      } catch (error) {
        rejectStop(error instanceof Error ? error : new Error(String(error)));
      }
    });
    return stopPromise;
  };

  return new Promise<IpcHandle>((resolve, reject) => {
    let settled = false;

    const rejectAfterClose = (error: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      void stop().then(
        () => reject(error),
        (closeError: unknown) =>
          reject(
            new EndpointConfigurationError(
              `${error.message}; endpoint cleanup also failed: ${closeError instanceof Error ? closeError.message : String(closeError)}`,
            ),
          ),
      );
    };

    const onError = (error: Error & { code?: string }): void => {
      if (settled) {
        // A post-bind server fault must not surface as an unhandled 'error'
        // event (which would throw out of the process): tear the endpoint down.
        void stop().catch(() => undefined);
        return;
      }
      server.removeListener('listening', onListening);
      const collisionCode = collisionCodeFor(target, error);
      const mapped =
        collisionCode !== undefined
          ? new EndpointCollisionError(`the endpoint is already occupied: ${target.path} (${collisionCode})`)
          : error;
      if (server.listening) {
        rejectAfterClose(mapped);
        return;
      }
      settled = true;
      reject(mapped);
    };

    const onListening = (): void => {
      if (settled) {
        return;
      }
      const address = server.address();
      if (typeof address !== 'string' || address !== target.path) {
        rejectAfterClose(
          new EndpointConfigurationError(
            'the bound endpoint did not resolve to the configured local path; refusing readiness',
          ),
        );
        return;
      }
      // Only from here is the socket file at target.path known to be ours.
      boundHere = true;
      if (target.kind === 'unix-socket' && typeof process.getuid === 'function') {
        try {
          chmodSync(target.path, 0o600);
          // C5.3: the mode is set and then read back, not assumed.
          if ((statSync(target.path).mode & 0o777) !== 0o600) {
            throw new Error('mode read-back mismatch');
          }
        } catch {
          // A chmod failure leaves the default umask-protected socket; refuse
          // the bind instead, after closing the just-bound listener.
          rejectAfterClose(
            new UnsafeEndpointDirectoryError('the socket could not be restricted to mode 0600'),
          );
          return;
        }
      }
      settled = true;
      resolve({ server, target, stop });
    };

    // Persistent (not once): the handler stays attached after a successful
    // bind so a later server fault tears down instead of throwing unhandled.
    server.on('error', onError);
    server.once('listening', onListening);
    try {
      // Path-only listen. A numeric argument would create a TCP listener and is never used.
      server.listen(target.path);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
