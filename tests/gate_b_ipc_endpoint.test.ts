/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Endpoint Bind / Close / Permission Tests (L-IPC-1 C2, C5.3, C5.5)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Covers: the fixed startup order; owner-only POSIX permissions set AND read back; a single
 * bind with a LIVE endpoint refused rather than unlinked; stale-socket cleanup after an
 * unclean shutdown; a non-socket path refused rather than deleted; a refused startup leaving
 * no socket behind; and the name rule that prevents traversal.
 *
 * LIMITATION (accepted): Windows named-pipe ACL/SDDL enforcement and collision/re-bind
 * behaviour are NOT measured — V-1 and V-4 were PA-WAIVED and are waivers, not proof.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { IPC_STARTUP_PHASES, startIpcEndpoint, type IpcEndpointHandle } from '../src/ipc/entrypoint.js';
import { endpointLayout, readEndpointMode, UNIX_DIRECTORY_MODE, UNIX_SOCKET_MODE } from '../src/ipc/endpoint.js';
import { isIpcRefusal } from '../src/ipc/errors.js';

import {
  createFixture,
  createStaleSocket,
  exchange,
  listRequest,
  startEndpoint,
  type Fixture,
  type StartedEndpoint,
} from './gate_b_support.test.js';

function refusedWith(reason: string) {
  return (error: unknown): boolean =>
    isIpcRefusal(error) && (error as { reason: string }).reason === reason;
}

test('GATE-B-E1: startup executes validate -> connect -> migrate -> verify -> principal -> bind, in order', async () => {
  const fixture: Fixture = createFixture();
  const observed: string[] = [];
  let endpoint: IpcEndpointHandle | null = null;
  try {
    endpoint = await startIpcEndpoint({
      endpointName: fixture.endpointName,
      directory: fixture.socketDirectory,
      handle: fixture.handle,
      onPhase: (phase) => observed.push(phase),
    });
    assert.deepEqual(observed, [...IPC_STARTUP_PHASES]);
    assert.deepEqual([...endpoint.phases], [...IPC_STARTUP_PHASES]);
    assert.equal(endpoint.schemaVersion, '003');
    assert.equal(endpoint.layout.kind, 'UNIX_SOCKET');
  } finally {
    if (endpoint) {
      await endpoint.close();
    }
    fixture.cleanup();
  }
});

test('GATE-B-E2: the endpoint directory and socket are owner-only (set and read back)', async () => {
  const fixture = createFixture();
  let started: StartedEndpoint | null = null;
  try {
    started = await startEndpoint(fixture);

    const directoryMode = fs.statSync(fixture.socketDirectory).mode & 0o777;
    assert.equal(
      directoryMode,
      UNIX_DIRECTORY_MODE,
      `directory mode must be 0700, observed ${directoryMode.toString(8)}`
    );

    assert.equal(readEndpointMode(started.endpoint.layout), UNIX_SOCKET_MODE);
    assert.equal(started.endpoint.layout.modeEnforced, true);
    assert.equal(started.endpoint.layout.kind, 'UNIX_SOCKET');
  } finally {
    if (started) {
      await started.close();
    }
    fixture.cleanup();
  }
});

test('GATE-B-E3: a second bind against a LIVE endpoint is refused, and the first keeps serving', async () => {
  const fixture = createFixture();
  let first: StartedEndpoint | null = null;
  try {
    first = await startEndpoint(fixture);

    await assert.rejects(
      () =>
        startIpcEndpoint({
          endpointName: fixture.endpointName,
          directory: fixture.socketDirectory,
          handle: fixture.handle,
        }),
      refusedWith('BINDING_INVALID')
    );

    // The live endpoint was NOT unlinked and still answers.
    const result = await exchange(first.socketPath, listRequest());
    assert.ok(result.bytes.length > 0, 'the original endpoint must still serve');
    assert.equal(fs.existsSync(first.socketPath), true);
  } finally {
    if (first) {
      await first.close();
    }
    fixture.cleanup();
  }
});

test('GATE-B-E4: a STALE socket left by an unclean shutdown is removed and rebound', async () => {
  const fixture = createFixture();
  createStaleSocket(fixture.socketPath);
  assert.equal(fs.existsSync(fixture.socketPath), true, 'precondition: a stale socket file exists');
  assert.equal(fs.lstatSync(fixture.socketPath).isSocket(), true);

  let started: StartedEndpoint | null = null;
  try {
    started = await startEndpoint(fixture);
    assert.equal(started.endpoint.layout.path, fixture.socketPath);
    const result = await exchange(started.socketPath, listRequest());
    assert.ok(result.bytes.length > 0, 'the rebound endpoint must serve');
  } finally {
    if (started) {
      await started.close();
    }
    fixture.cleanup();
  }
});

test('GATE-B-E5: a NON-socket file at the endpoint path is refused, never deleted', async () => {
  const fixture = createFixture();
  fs.mkdirSync(fixture.socketDirectory, { recursive: true });
  fs.writeFileSync(fixture.socketPath, 'not a socket');

  try {
    await assert.rejects(() => startEndpoint(fixture), refusedWith('BINDING_INVALID'));
    assert.equal(fs.readFileSync(fixture.socketPath, 'utf8'), 'not a socket', 'the file must be untouched');
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-E6: no ACTIVE binding refuses startup before bind and leaves NO socket behind (C5.5)', async () => {
  const fixture = createFixture({ withBinding: false });
  try {
    await assert.rejects(
      () =>
        startIpcEndpoint({
          endpointName: fixture.endpointName,
          directory: fixture.socketDirectory,
          handle: fixture.handle,
        }),
      refusedWith('BINDING_ABSENT')
    );
    assert.equal(fs.existsSync(fixture.socketPath), false, 'a refused startup must not leave an endpoint');
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-E7: close removes the socket and is idempotent', async () => {
  const fixture = createFixture();
  const started = await startEndpoint(fixture);
  try {
    assert.equal(fs.existsSync(started.socketPath), true);
    await started.close();
    assert.equal(fs.existsSync(started.socketPath), false, 'close must remove the socket');
    await started.close(); // idempotent: a second close must not throw
  } finally {
    fixture.cleanup();
  }
});

test('GATE-B-E8: the name rule rejects traversal, uppercase and oversize names', () => {
  const directory = path.join('/tmp', 'gate-b-layout');
  assert.equal(endpointLayout('local-principal-ipc', directory).path, path.join(directory, 'local-principal-ipc.sock'));
  assert.equal(endpointLayout('a.b_c-d', directory).kind, process.platform === 'win32' ? 'NAMED_PIPE' : 'UNIX_SOCKET');

  for (const invalid of ['../escape', 'UPPERCASE', 'a'.repeat(80), '', 'with space', 'trailing/']) {
    assert.throws(() => endpointLayout(invalid, directory), isIpcRefusal, `"${invalid}" must be refused`);
  }
});
