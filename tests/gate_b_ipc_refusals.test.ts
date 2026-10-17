/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Refusal, No-Bytes and Cap Tests (L-IPC-1 C5.1, C5.4, C6, C7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * The defining assertion of this suite: **every refusal emits ZERO bytes**. That is what
 * makes C6 (`unauthorized ≡ missing`) structural rather than stylistic — a caller cannot
 * distinguish a refused principal, a refused claim, a foreign resource or a missing resource,
 * because in all four cases it receives nothing but a closed socket.
 *
 * Gate B implementation evidence ONLY. This is NOT Gate C qualification and does NOT
 * constitute the mandatory C5.1/Q9 zero-bytes probe against a realized production endpoint.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { IPC_PROTOCOL_VERSION } from '../src/ipc/framing.js';

import {
  connectSilent,
  createFixture,
  exchange,
  frame,
  listRequest,
  provisionSecondPrincipal,
  rawFrame,
  startEndpoint,
  type StartedEndpoint,
} from './gate_b_support.test.js';

async function withEndpoint(
  run: (started: StartedEndpoint) => Promise<void>,
  options?: {
    limits?: {
      maxRequestBytes?: number;
      maxResponseBytes?: number;
      maxConcurrentConnections?: number;
      idleTimeoutMs?: number;
    };
  }
): Promise<void> {
  const fixture = createFixture();
  let started: StartedEndpoint | null = null;
  try {
    started = await startEndpoint(fixture, options);
    await run(started);
  } finally {
    if (started) {
      await started.close();
    }
    fixture.cleanup();
  }
}

test('GATE-B-R1: a silent connection receives ZERO bytes (C5.1 — no greeting, no banner)', async () => {
  await withEndpoint(async (started) => {
    const result = await connectSilent(started.socketPath, 300);
    assert.equal(result.bytes.length, 0, 'the server must emit nothing before a valid request');
    assert.equal(result.closed, false, 'a live idle connection is still open (timeout not reached)');
  });
});

test('GATE-B-R2: an idle connection is dropped by the idle timeout with ZERO bytes', async () => {
  await withEndpoint(
    async (started) => {
      const result = await connectSilent(started.socketPath, 900);
      assert.equal(result.bytes.length, 0);
      assert.equal(result.closed, true, 'the idle connection must be dropped');
      assert.ok(started.refusals.count('IDLE_TIMEOUT') >= 1);
    },
    { limits: { idleTimeoutMs: 150 } }
  );
});

test('GATE-B-R3: framing violations are refused with ZERO bytes', async () => {
  await withEndpoint(async (started) => {
    const cases: Array<{ name: string; payload: Buffer }> = [
      { name: 'invalid JSON', payload: rawFrame('{not json') },
      { name: 'zero-length frame', payload: rawFrame(Buffer.alloc(0), 0) },
      { name: 'non-object envelope', payload: rawFrame('[]') },
      { name: 'non-object envelope (scalar)', payload: rawFrame('42') },
      { name: 'unsupported protocol version', payload: frame({ v: 99, op: 'portfolio.list' }) },
      { name: 'unknown operation', payload: frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.deleteAll' }) },
      { name: 'unknown envelope key', payload: frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.list', extra: 1 }) },
      { name: 'non-string requestId', payload: frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.list', requestId: 7 }) },
      { name: 'pipelined double frame', payload: Buffer.concat([listRequest('a'), listRequest('b')]) },
    ];

    for (const testCase of cases) {
      const result = await exchange(started.socketPath, testCase.payload);
      assert.equal(result.bytes.length, 0, `${testCase.name} must emit zero bytes`);
    }
  });
});

test('GATE-B-R4: an oversize request frame is refused with ZERO bytes (C5.4 cap)', async () => {
  await withEndpoint(
    async (started) => {
      // Declare a length beyond the cap without sending that many bytes.
      const result = await exchange(started.socketPath, rawFrame('{}', 9_999));
      assert.equal(result.bytes.length, 0);
      assert.ok(started.refusals.count('OVERSIZE_FRAME') >= 1);
    },
    { limits: { maxRequestBytes: 1_024 } }
  );
});

test('GATE-B-R5: every caller-supplied authority field is REFUSED, not ignored (C7)', async () => {
  await withEndpoint(async (started) => {
    const forbiddenFields: Array<Record<string, unknown>> = [
      { principal: 'someone' },
      { principalId: 'p-1' },
      { applicationUserId: 'u-1' },
      { userId: 'u-1' },
      { subject: 'sub-1' },
      { issuer: 'https://issuer' },
      { token: 'abc' },
      { credential: 'abc' },
      { authorization: 'Bearer abc' },
      { owner: 'u-1' },
      { ownerId: 'u-1' },
      { tenantId: 'T-1' },
      { tenant: 'T-1' },
      { tenant_id: 'T-1' },
      { membership: 'M-1' },
      { scope: ['portfolio:read'] },
      { role: 'admin' },
      { permission: 'PORTFOLIO_WRITE' },
      { session: 'S-1' },
      { companyId: 'C-1' },
      { runtimeCompanyId: 'C-1' },
      { identityStatus: 'RESOLVED' },
      { resolutionDisposition: 'CANONICAL_P04' },
      { canonicalCompanyId: 'C-1' },
      { bypass: true },
    ];

    for (const extra of forbiddenFields) {
      const payload = frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.list', payload: extra });
      const result = await exchange(started.socketPath, payload);
      const key = Object.keys(extra)[0];
      assert.equal(result.bytes.length, 0, `field ${key} must be refused with zero bytes`);
    }

    // C7 applies to nested payloads too: a claim buried inside a holding is still a claim.
    const nested = frame({
      v: IPC_PROTOCOL_VERSION,
      op: 'portfolio.save',
      payload: { portfolioId: 'P-1', holdings: [{ symbol: 'X', companyId: 'C-1' }] },
    });
    assert.equal((await exchange(started.socketPath, nested)).bytes.length, 0);

    assert.ok(
      started.refusals.count('CALLER_SUPPLIED_AUTHORITY') >= forbiddenFields.length + 1,
      'each claim must be recorded as CALLER_SUPPLIED_AUTHORITY'
    );
  });
});

test('GATE-B-R6: the operator-bypass token is refused as a VALUE as well as a key (C12 item 3)', async () => {
  await withEndpoint(async (started) => {
    const asValue = frame({
      v: IPC_PROTOCOL_VERSION,
      op: 'portfolio.save',
      payload: { portfolioId: 'P-1', note: 'NON_PRODUCTION_OPERATOR_BYPASS' },
    });
    assert.equal((await exchange(started.socketPath, asValue)).bytes.length, 0);

    const asKey = frame({
      v: IPC_PROTOCOL_VERSION,
      op: 'portfolio.list',
      payload: { operatorBypass: true },
    });
    assert.equal((await exchange(started.socketPath, asKey)).bytes.length, 0);

    assert.ok(started.refusals.count('CALLER_SUPPLIED_AUTHORITY') >= 2);
  });
});

test('GATE-B-R7: WRITES are refused with ZERO bytes (Gate E owns the write policy)', async () => {
  await withEndpoint(async (started) => {
    const payload = frame({
      v: IPC_PROTOCOL_VERSION,
      op: 'portfolio.save',
      payload: { portfolioId: 'P-1', holdings: [{ symbol: 'INFY', weightPercentage: 100 }] },
    });
    const result = await exchange(started.socketPath, payload);
    assert.equal(result.bytes.length, 0);
    assert.ok(started.refusals.count('WRITE_NOT_AUTHORIZED') >= 1);
  });
});

test('GATE-B-R8: a FOREIGN resource and a MISSING resource are indistinguishable (C6)', async () => {
  const fixture = createFixture();
  const second = provisionSecondPrincipal(fixture);
  let started: StartedEndpoint | null = null;
  try {
    // One portfolio owned by someone else; one id that does not exist at all.
    fixture.store.createPortfolio({
      applicationUserId: second.applicationUserId,
      tenantId: second.tenantId,
      portfolioId: 'P-FOREIGN',
      portfolioName: 'Not yours',
    });

    started = await startEndpoint(fixture);

    const request = (portfolioId: string): Buffer =>
      frame({ v: IPC_PROTOCOL_VERSION, op: 'portfolio.get', payload: { portfolioId } });

    const foreign = await exchange(started.socketPath, request('P-FOREIGN'));
    const missing = await exchange(started.socketPath, request('P-ABSENT'));

    assert.equal(foreign.bytes.length, 0);
    assert.equal(missing.bytes.length, 0);
    assert.deepEqual(foreign, missing, 'foreign and missing must be indistinguishable on the wire');
    assert.ok(started.refusals.count('RESOURCE_UNAVAILABLE') >= 2);
  } finally {
    if (started) {
      await started.close();
    }
    fixture.cleanup();
  }
});

test('GATE-B-R9: concurrent connections are capped (C5.4) and the excess receives ZERO bytes', async () => {
  await withEndpoint(
    async (started) => {
      // Fill the cap with silent connections, then attempt one more while they are held.
      const held = [connectSilent(started.socketPath, 1_200), connectSilent(started.socketPath, 1_200)];
      await new Promise((resolve) => setTimeout(resolve, 200));

      const overflow = await exchange(started.socketPath, listRequest('overflow'));
      assert.equal(overflow.bytes.length, 0, 'an over-capacity caller receives nothing');
      assert.ok(started.refusals.count('CAPACITY_EXCEEDED') >= 1);

      await Promise.all(held);

      // The counter decrements on the SERVER's close event, which lags the client's teardown.
      const deadline = Date.now() + 2_000;
      while (started.endpoint.server.stats.activeConnections > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.equal(started.endpoint.server.stats.activeConnections, 0, 'capacity must be released');

      // Functional proof: a normal request succeeds again after the held connections close.
      const recovered = await exchange(started.socketPath, listRequest('recovered'));
      assert.ok(recovered.bytes.length > 0, 'the endpoint must accept work once capacity is free');
    },
    { limits: { maxConcurrentConnections: 2, idleTimeoutMs: 5_000 } }
  );
});

test('GATE-B-R10: a VALID, authorized request DOES receive bytes (the suite is not trivially silent)', async () => {
  await withEndpoint(async (started) => {
    const result = await exchange(started.socketPath, listRequest());
    assert.ok(result.bytes.length > 0);
    const length = result.bytes.readUInt32BE(0);
    const decoded = JSON.parse(result.bytes.subarray(4, 4 + length).toString('utf8')) as {
      ok?: boolean;
      v?: number;
    };
    assert.equal(decoded.ok, true);
    assert.equal(decoded.v, IPC_PROTOCOL_VERSION);
    assert.equal(result.bytes.length, 4 + length, 'no bytes may follow the single response frame');
  });
});
