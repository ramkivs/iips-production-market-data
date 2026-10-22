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
 */
import { createServer, type Server, type Socket } from 'node:net';
import { chmodSync, mkdirSync, statSync } from 'node:fs';
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
    statSync(stateDir);
  } catch {
    mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    createdHere = true;
  }

  const dirStat = statSync(stateDir);
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
    const reStat = statSync(stateDir);
    if ((reStat.mode & 0o777) !== 0o700) {
      throw new UnsafeEndpointDirectoryError('the newly created state directory could not be locked to 0700');
    }
  }

  try {
    const existing = statSync(target.path);
    throw new EndpointCollisionError(
      `an entry already exists at the endpoint path (${existing.isSocket() ? 'socket' : 'file'}): ${target.path}`,
    );
  } catch (error) {
    if (error instanceof EndpointCollisionError) throw error;
    // ENOENT is the expected, collision-free state.
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
  /** Test seam: inject a server that fails its bind with EADDRINUSE (F7). */
  serverFactory?: (path: string) => Server;
  maxConnections?: number;
}

/**
 * Binds the same-host endpoint. The server option set contains no
 * readableAll/writableAll and no numeric port: the only listen argument is the
 * local socket/pipe path. A second simultaneous connection is refused by the
 * one-connection capacity cap (C5.4). On Windows the same call binds a named pipe;
 * no filesystem path, chmod or uid check is involved on that platform.
 */
export function listenIpc(
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

  const server = options.serverFactory
    ? options.serverFactory(target.path)
    : // allowHalfOpen: the reference client half-closes its write side after the
      // single request frame and still expects a response. With the default
      // (false) Node auto-ends the server writable side on the peer's FIN, which
      // would make the response write fail after the frame reader has observed
      // the clean half-close. Half-open mode keeps the writable side under
      // explicit server control; the reader's idle timeout still closes idle
      // peers, so this opens no lingering-connection path.
      createServer({ allowHalfOpen: true }, (socket) => onConnection(socket));
  server.maxConnections = options.maxConnections ?? 1;

  return new Promise((resolve, reject) => {
    const onError = (error: Error & { code?: string }): void => {
      server.removeListener('listening', onListening);
      if (error.code === 'EADDRINUSE') {
        reject(new EndpointCollisionError(`the endpoint is already occupied: ${target.path}`));
        return;
      }
      reject(error);
    };
    const onListening = (): void => {
      server.removeListener('error', onError);
      if (target.kind === 'unix-socket' && typeof process.getuid === 'function') {
        try {
          chmodSync(target.path, 0o600);
        } catch {
          // A chmod failure leaves the default umask-protected socket; refuse the bind instead.
          server.close();
          reject(new UnsafeEndpointDirectoryError('the socket could not be restricted to mode 0600'));
          return;
        }
      }
      const address = server.address();
      if (typeof address !== 'string') {
        server.close();
        reject(new Error('the bound endpoint is not a local path; a network listener must not exist'));
        return;
      }
      resolve({
        server,
        target,
        stop: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    };
    server.once('error', onError);
    server.once('listening', onListening);
    // Path-only listen. A numeric argument would create a TCP listener and is never used.
    server.listen(target.path);
  });
}
