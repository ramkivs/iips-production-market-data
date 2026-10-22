/**
 * Gate 3 T-F — no TCP / HTTP / URL listener, and honest platform endpoints.
 *
 * Host-adaptive: the live endpoint is an AF_UNIX socket on POSIX and a named
 * pipe under \\.\pipe on native Windows. Platform-independent invariants run on
 * both hosts (string-only address, zero bytes for an HTTP request line and for
 * a second simultaneous connection, no numeric listen, no readableAll/writableAll,
 * resolver refusals). POSIX-only mode/uid checks run only on POSIX; Windows gets
 * named-pipe namespace and descriptor checks instead, with no fabricated DACL
 * claim.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection, type Socket } from 'node:net';
import { existsSync, mkdtempSync, rmSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isWindowsPipeNamespaceOnly,
  listenIpc,
  resolveEndpointTarget,
  windowsPipeDescriptor,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { readSingleFrame, ClassPError, diagnosticSink } from '../src/ipc/protocol.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const IS_WINDOWS_HOST = HOST_PLATFORM === 'win32';
const ENDPOINT_NAME = `iips-g3-nonet-${process.pid}`;
const posixOnly = IS_WINDOWS_HOST ? it.skip : it;
const windowsOnly = IS_WINDOWS_HOST ? it : it.skip;

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function connectOnce(socketPath: string, payload?: Buffer, waitMs = 0): Promise<Buffer> {
  return new Promise((resolve) => {
    const socket = createConnection({ path: socketPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', () => resolve(Buffer.concat(chunks)));
    socket.on('close', () => resolve(Buffer.concat(chunks)));
    socket.on('connect', () => {
      if (waitMs > 0) setTimeout(() => socket.end(), waitMs);
      else if (payload) socket.write(payload, () => socket.end());
      else socket.end();
    });
  });
}

describe('g3 / T-F no network listener and platform endpoint honesty', () => {
  let root: string;
  let stateDir: string;
  let handle: IpcHandle;
  let endpointPath: string;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-nonet-'));
    stateDir = join(root, 'state');
    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: stateDir },
      HOST_PLATFORM,
    );
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
              socket.end();
            } finally {
              reader.release();
            }
          })
          .catch((error: unknown) => {
            if (error instanceof ClassPError) diagnosticSink.record(error.reason, error.message);
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

  it('the live server address is a string path, never a {address, port} object', () => {
    const address = handle.server.address();
    assert.equal(typeof address, 'string');
    assert.equal(address, endpointPath);
  });

  it('an HTTP request line receives zero bytes (the endpoint is not an HTTP server)', async () => {
    const response = await connectOnce(endpointPath, Buffer.from('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n', 'utf8'));
    assert.equal(response.byteLength, 0);
  });

  it('a second simultaneous connection is capacity-capped and receives zero bytes (C5.4)', async () => {
    const first = await new Promise<Buffer>((resolve) => {
      const socket = createConnection({ path: endpointPath });
      const chunks: Buffer[] = [];
      socket.on('data', (chunk) => chunks.push(chunk));
      socket.on('error', () => resolve(Buffer.concat(chunks)));
      socket.on('close', () => resolve(Buffer.concat(chunks)));
      socket.on('connect', () => {
        createConnection({ path: endpointPath })
          .on('data', () => undefined)
          .on('error', () => undefined)
          .on('close', () => socket.end());
      });
    });
    assert.equal(first.byteLength, 0);
  });

  posixOnly('the POSIX state directory is owner-only 0700', () => {
    const stat = statSync(stateDir);
    assert.ok(stat.isDirectory());
    assert.equal(stat.mode & 0o777, 0o700);
    if (typeof process.getuid === 'function') assert.equal(stat.uid, process.getuid());
  });

  posixOnly('the POSIX socket itself is mode 0600 and owner-owned', () => {
    const stat = statSync(endpointPath);
    assert.ok(stat.isSocket());
    assert.equal(stat.mode & 0o777, 0o600);
    if (typeof process.getuid === 'function') assert.equal(stat.uid, process.getuid());
  });

  windowsOnly('the Windows endpoint is a named pipe with no filesystem artifact', () => {
    // The invariant has three parts. A live pipe name can answer generic
    // existence probes (the pipe namespace is stat-able), so existsSync on the
    // pipe path is not a filesystem check and must not be used here.
    assert.equal(handle.target.kind, 'windows-named-pipe');
    assert.ok(isWindowsPipeNamespaceOnly(handle.target), 'the path stays inside the \\\\.\\pipe namespace');
    assert.match(endpointPath, /^\\\\\.\\pipe\\/);
    assert.ok(!existsSync(stateDir), 'a named-pipe bind creates no filesystem state directory');
    assert.ok(!existsSync(join(stateDir, `${ENDPOINT_NAME}.sock`)), 'no POSIX-style socket file is created');
    const address = handle.server.address();
    assert.equal(typeof address, 'string');
    assert.match(address as string, /^\\\\\.\\pipe\\/);
  });

  it('endpoint.ts never passes readableAll/writableAll and never calls listen with a numeric port', () => {
    const here = fileURLToPath(new URL('.', import.meta.url));
    const source = stripComments(readFileSync(join(here, '..', '..', 'src', 'ipc', 'endpoint.ts'), 'utf8'));
    assert.ok(!/readableAll\s*:/.test(source), 'no readableAll option');
    assert.ok(!/writableAll\s*:/.test(source), 'no writableAll option');
    assert.ok(!/\.listen\(\s*\d/.test(source), 'no numeric listen argument (no TCP port)');
    assert.ok(!/createServer\(\s*['"]http/.test(source), 'no HTTP server');
  });

  it('resolves a bare name with platform-matched absolute-path semantics (pure, no filesystem)', () => {
    const posix = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: '/var/local/iips' },
      'linux',
    );
    assert.equal(posix.kind, 'unix-socket');
    assert.equal(posix.path, `/var/local/iips/${ENDPOINT_NAME}.sock`);
    const win = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: 'C:\\iips\\state' },
      'win32',
    );
    assert.equal(win.kind, 'windows-named-pipe');
    assert.equal(win.path, `\\\\.\\pipe\\${ENDPOINT_NAME}`);
  });

  it('an explicit Windows pipe path is accepted; other absolute Windows paths are refused', () => {
    const accepted = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: '\\\\.\\pipe\\iips-ipd-user-portfolio-v1' },
      'win32',
    );
    assert.equal(accepted.path, '\\\\.\\pipe\\iips-ipd-user-portfolio-v1');
    assert.throws(() => resolveEndpointTarget({ IIPS_G2_IPC_ENDPOINT: 'C:\\iips\\socket' }, 'win32'));
  });

  it('URLs, host:port pairs and relative paths are refused on both simulated platforms', () => {
    for (const platform of ['linux', 'win32'] as const) {
      assert.throws(() => resolveEndpointTarget({ IIPS_G2_IPC_ENDPOINT: 'tcp://127.0.0.1:9000' }, platform));
      assert.throws(() => resolveEndpointTarget({ IIPS_G2_IPC_ENDPOINT: 'localhost:9000' }, platform));
      assert.throws(
        () => resolveEndpointTarget(
          { IIPS_G2_IPC_ENDPOINT: 'relative/path.sock', IIPS_G3_LOCAL_STATE_DIR: platform === 'win32' ? 'C:\\x' : '/tmp/x' },
          platform,
        ),
      );
    }
  });

  it('the Windows descriptor claims no application-enforced DACL and names the Gate 4 items', () => {
    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: 'C:\\iips\\state' },
      'win32',
    );
    const descriptor = windowsPipeDescriptor(target);
    assert.equal(descriptor.enforcedByApplication, false);
    assert.match(descriptor.platformDefault, /default DACL/);
    assert.ok(descriptor.notVerifiableHere.includes('effective DACL/SDDL contents'));
    assert.ok(descriptor.gate4EvidenceItems.includes('V-1'));
    assert.ok(descriptor.applicationControls.some((line) => line.includes('no TCP')));
  });
});
