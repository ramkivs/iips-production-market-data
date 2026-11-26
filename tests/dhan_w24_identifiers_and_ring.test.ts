/**
 * W-24 — Identifiers, contract version, and bounded ring
 * D-7 §4.6, §4.8 | Readiness §3.8 rows: Ring boundedness, Ring size ceiling, identifier lifecycle
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { W24_TRACE_CONTRACT_VERSION } from '../src/providers/dhan/dhan_trace.js';
import {
  DhanDiagnosticRing,
  validateDhanDiagnosticEvent,
  W24_RING_CAPACITY_IPD,
  W24_RING_CAPACITY_IRR,
  W24_MAX_EVENT_BYTES,
  W24_EVENT_SCHEMA_VERSION,
} from '../src/providers/dhan/dhan_diagnostic_ring.js';
import {
  generateTraceId,
  generateWorkId,
  generateAttemptId,
  isLowercaseUuidV4,
  validateTraceHeaders,
  TRACE_HEADER_VERSION_LOWER,
  TRACE_HEADER_ACTION_LOWER,
} from '../src/providers/dhan/dhan_trace.js';

describe('W-24 identifiers and ring', () => {
  it('contract version is 1', () => {
    assert.equal(W24_TRACE_CONTRACT_VERSION, 1);
    assert.equal(W24_RING_CAPACITY_IPD, 1024);
    assert.equal(W24_RING_CAPACITY_IRR, 512);
    assert.equal(W24_MAX_EVENT_BYTES, 1024);
    assert.equal(W24_EVENT_SCHEMA_VERSION, 1);
  });

  it('generated identifiers are opaque lowercase UUIDv4', () => {
    for (let i = 0; i < 10; i++) {
      for (const gen of [generateTraceId, generateWorkId, generateAttemptId]) {
        const id = gen();
        assert.ok(isLowercaseUuidV4(id), `expected lowercase UUIDv4 got ${id}`);
        assert.equal(id, id.toLowerCase());
        assert.equal(id.length, 36);
      }
    }
  });

  it('generated identifiers never collide in a burst', () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(generateTraceId());
    assert.equal(set.size, 200);
  });

  it('UUID validation rejects non-canonical', () => {
    const bad: unknown[] = [
      'not-a-uuid',
      '550E8400-E29B-41D4-A716-446655440000',
      '550e8400-e29b-41d4-a716-44665544000',
      '550e8400-e29b-41d4-a716-44665544000x',
      '550e8400-e29b-11d4-a716-446655440000',
      '550e8400-e29b-41d4-0716-446655440000',
      '',
      null,
      123,
    ];
    for (const v of bad) assert.equal(isLowercaseUuidV4(v), false, `should reject ${String(v)}`);
    assert.equal(isLowercaseUuidV4(generateTraceId()), true);
    assert.equal(isLowercaseUuidV4('550e8400-e29b-41d4-a716-446655440000'), true);
  });

  it('validateTraceHeaders: happy path', () => {
    const id = generateTraceId();
    const res = validateTraceHeaders({ [TRACE_HEADER_VERSION_LOWER]: '1', [TRACE_HEADER_ACTION_LOWER]: id });
    assert.equal(res.ok, true);
    if (res.ok) { assert.equal(res.context.actionId, id); assert.equal(res.context.traceVersion, '1'); }
  });

  it('validateTraceHeaders: fail-closed', () => {
    const goodId = generateTraceId();
    const miss = validateTraceHeaders({});
    assert.equal(miss.ok, false);
    if (!miss.ok) assert.equal(miss.rejection.reason, 'MISSING_HEADERS');
    const badVersion = validateTraceHeaders({ [TRACE_HEADER_VERSION_LOWER]: '2', [TRACE_HEADER_ACTION_LOWER]: goodId });
    assert.equal(badVersion.ok, false);
    if (!badVersion.ok) assert.equal(badVersion.rejection.reason, 'INVALID_VERSION');
    const badId = validateTraceHeaders({ [TRACE_HEADER_VERSION_LOWER]: '1', [TRACE_HEADER_ACTION_LOWER]: 'NOT-UUID' });
    assert.equal(badId.ok, false);
    if (!badId.ok) assert.equal(badId.rejection.reason, 'INVALID_ACTION_ID');
    const upperId = validateTraceHeaders({ [TRACE_HEADER_VERSION_LOWER]: '1', [TRACE_HEADER_ACTION_LOWER]: goodId.toUpperCase() });
    assert.equal(upperId.ok, false);
    if (!upperId.ok) assert.equal(upperId.rejection.reason, 'INVALID_ACTION_ID');
  });

  it('validateTraceHeaders: CONTRACT_MISMATCH code', () => {
    const res = validateTraceHeaders({});
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.rejection.code, 'CONTRACT_MISMATCH');
  });

  it('ring: capacity 1024, oldest eviction', () => {
    const ring = new DhanDiagnosticRing(4);
    const base = () => ({
      schemaVersion: 1 as const,
      timestampUtc: new Date().toISOString(),
      component: 'IPD' as const,
      operation: 'QUOTE' as const,
      event: 'REQUEST_ADMITTED' as const,
      actionId: generateTraceId(),
      workId: generateWorkId(),
      attemptId: generateAttemptId(),
      outcome: 'UNKNOWN' as const,
      failureCategory: null as null,
      durationMs: 0,
    });
    for (let i = 0; i < 4; i++) ring.record(base());
    assert.equal(ring.getStats().size, 4);
    assert.equal(ring.getStats().capacity, 4);
    assert.equal(ring.getStats().evictedCount, 0);
    const firstSeq = ring.list()[0]!.sequence;
    ring.record(base());
    assert.equal(ring.getStats().size, 4);
    assert.equal(ring.getStats().evictedCount, 1);
    assert.equal(ring.list()[0]!.sequence, firstSeq + 1);
    const seqs = ring.list().map((e) => e.sequence);
    assert.deepEqual(seqs, [firstSeq + 1, firstSeq + 2, firstSeq + 3, firstSeq + 4]);
  });

  it('ring: sequence monotonically increasing', () => {
    const ring = new DhanDiagnosticRing(10);
    const events: number[] = [];
    for (let i = 0; i < 20; i++) {
      const ev = ring.record({
        schemaVersion: 1 as const, timestampUtc: new Date().toISOString(), component: 'IPD' as const, operation: 'QUOTE' as const,
        event: 'REQUEST_ADMITTED' as const, actionId: generateTraceId(), workId: generateWorkId(), attemptId: generateAttemptId(),
        outcome: 'UNKNOWN' as const, failureCategory: null as null, durationMs: 0,
      });
      events.push(ev!.sequence);
    }
    for (let i = 1; i < events.length; i++) assert.equal(events[i], (events[i - 1] as number) + 1);
  });

  it('ring: withLimit and withSinceSequence', () => {
    const ring = new DhanDiagnosticRing(10);
    for (let i = 0; i < 5; i++) {
      ring.record({
        schemaVersion: 1 as const, timestampUtc: new Date().toISOString(), component: 'IPD' as const, operation: 'QUOTE' as const,
        event: 'REQUEST_ADMITTED' as const, actionId: generateTraceId(), workId: generateWorkId(), attemptId: generateAttemptId(),
        outcome: 'UNKNOWN' as const, failureCategory: null as null, durationMs: 0,
      });
    }
    assert.equal(ring.list({ limit: 2 }).length, 2);
    const since = ring.list()[2]!.sequence;
    const filtered = ring.list({ sinceSequence: since });
    assert.ok(filtered.every((e) => e.sequence >= since));
    assert.equal(filtered.length, 3);
  });

  it('ring: normal event stays within 1 KiB', () => {
    const ring = new DhanDiagnosticRing(10);
    const normal = ring.record({
      schemaVersion: 1 as const, timestampUtc: new Date().toISOString(), component: 'IPD' as const, operation: 'QUOTE' as const,
      event: 'REQUEST_ADMITTED' as const, actionId: generateTraceId(), workId: generateWorkId(), attemptId: generateAttemptId(),
      outcome: 'UNKNOWN' as const, failureCategory: null as null, durationMs: 0,
    });
    assert.ok(normal !== null);
    assert.ok(JSON.stringify(normal).length <= W24_MAX_EVENT_BYTES);
  });

  it('validateDhanDiagnosticEvent rejects extra fields and wrong enums', () => {
    const good = {
      schemaVersion: 1, timestampUtc: new Date().toISOString(), component: 'IPD', operation: 'QUOTE', event: 'REQUEST_ADMITTED',
      actionId: generateTraceId(), workId: generateWorkId(), attemptId: generateAttemptId(), outcome: 'UNKNOWN', failureCategory: null, durationMs: 0, sequence: 0,
    };
    assert.ok(validateDhanDiagnosticEvent(good) !== null);
    assert.equal(validateDhanDiagnosticEvent({ ...good, extra: 'field' }), null);
    assert.equal(validateDhanDiagnosticEvent({ ...good, component: 'SPOOF' }), null);
    assert.equal(validateDhanDiagnosticEvent({ ...good, schemaVersion: 2 }), null);
    assert.equal(validateDhanDiagnosticEvent({ ...good, actionId: (good.actionId as string).toUpperCase() }), null);
    assert.equal(validateDhanDiagnosticEvent({ ...good, failureCategory: 'MADE_UP' }), null);
    assert.ok(validateDhanDiagnosticEvent({ ...good, failureCategory: 'INTERNAL_ERROR' }) !== null);
  });
});
