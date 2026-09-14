/**
 * ReplayService M-2 Repair — Test Suite
 *
 * Authority: D41 External Remediation Work Request (Workstream C, E-C1 through E-C4)
 *
 * Tests prove:
 *   - V-C1: Replay of known-good snapshot produces computed reproduced=true, byteIdentical=true
 *   - V-C2: Replay with modified input produces byteIdentical=false
 *   - V-C3: Replay with missing snapshot returns undefined
 *   - V-C4: Replay without executor returns reproduced=false
 *   - V-C5: Replay across multiple engines produces computed results
 *   - V-C6: Mutation test — tests detect literal returns
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReplayService } from './ReplayService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { SnapshotService } from '../snapshot/SnapshotService';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';

function makeTestExecutor() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const store = new SnapshotStore();
  const snap = new SnapshotService(clock, id);
  const replay = new ReplayService(store);
  return { clock, id, store, snap, replay };
}

describe('ReplayService M-2 Repair', () => {
  describe('V-C1: Known-good replay produces computed results', () => {
    it('reproduced=true and byteIdentical=true when re-execution matches', () => {
      const { store, snap, replay } = makeTestExecutor();

      // Create a snapshot with execution context
      const inputs = { revenue: 1000, ebitda: 200, debt: 500 };
      const metrics = { revenue: 1000, ebitda: 200 };
      const scores = { composite: 75 };
      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics,
        scores,
        verdict: 'BUY',
        executionContext: {
          requestId: 'req-1',
          inputs,
          contractVersion: 'v1.0',
          calibrationVersion: 'v1.0',
        },
      });
      store.append(snapshot);

      // Register executor that reproduces the same output
      replay.setExecutor((engineId, requestId, execInputs) => {
        return {
          metrics: { revenue: Number(execInputs.revenue), ebitda: Number(execInputs.ebitda) },
          scores: { composite: 75 },
          verdict: 'BUY',
        };
      });

      const result = replay.replay(snapshot.snapshotId)!;
      assert.equal(result.reproduced, true, 'reproduced should be computed true');
      assert.equal(result.byteIdentical, true, 'byteIdentical should be computed true');
      assert.ok(result.recomputedMetrics, 'should include recomputed metrics');
      assert.equal(result.diagnostic, 'Replay successful — byte-identical');
    });
  });

  describe('V-C2: Modified input detection', () => {
    it('byteIdentical=false when re-execution produces different output', () => {
      const { store, snap, replay } = makeTestExecutor();

      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics: { revenue: 1000, ebitda: 200 },
        scores: { composite: 75 },
        verdict: 'BUY',
        executionContext: {
          requestId: 'req-2',
          inputs: { revenue: 1000, ebitda: 200 },
        },
      });
      store.append(snapshot);

      // Register executor that produces DIFFERENT output
      replay.setExecutor((engineId, requestId, execInputs) => {
        return {
          metrics: { revenue: 999, ebitda: 199 }, // Different!
          scores: { composite: 74 }, // Different!
          verdict: 'HOLD', // Different!
        };
      });

      const result = replay.replay(snapshot.snapshotId)!;
      assert.equal(result.reproduced, true, 'reproduced should be true (execution completed)');
      assert.equal(result.byteIdentical, false, 'byteIdentical should be false (output differs)');
      assert.ok(result.diagnostic?.includes('differs'));
    });
  });

  describe('V-C3: Missing snapshot', () => {
    it('returns undefined for non-existent snapshot', () => {
      const { replay } = makeTestExecutor();
      replay.setExecutor(() => ({ metrics: {}, scores: {} }));
      const result = replay.replay('non-existent-id');
      assert.equal(result, undefined);
    });
  });

  describe('V-C4: No executor registered', () => {
    it('reproduced=false when no executor is registered', () => {
      const { store, snap, replay } = makeTestExecutor();

      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics: { revenue: 1000 },
        scores: { composite: 75 },
        executionContext: { requestId: 'req-3', inputs: { revenue: 1000 } },
      });
      store.append(snapshot);

      // Do NOT register executor
      const result = replay.replay(snapshot.snapshotId)!;
      assert.equal(result.reproduced, false);
      assert.equal(result.byteIdentical, false);
      assert.ok(result.diagnostic?.includes('No executor'));
    });
  });

  describe('V-C5: Multi-engine replay', () => {
    it('replayAll produces computed results for all snapshots', () => {
      const { store, snap, replay } = makeTestExecutor();

      const engines = ['sector.banking', 'sector.insurance', 'sector.healthcare'];
      for (const engineId of engines) {
        const snapshot = snap.create({
          engineId,
          metrics: { score: 80 },
          scores: { composite: 80 },
          verdict: 'BUY',
          executionContext: {
            requestId: `req-${engineId}`,
            inputs: { score: 80 },
          },
        });
        store.append(snapshot);
      }

      replay.setExecutor((engineId, requestId, execInputs) => ({
        metrics: { score: Number(execInputs.score) },
        scores: { composite: 80 },
        verdict: 'BUY',
      }));

      const results = replay.replayAll();
      assert.equal(results.length, 3);
      for (const r of results) {
        assert.equal(r.reproduced, true);
        assert.equal(r.byteIdentical, true);
      }
    });
  });

  describe('V-C6: Mutation proof — tests detect literal returns', () => {
    it('test would FAIL if replay returned literal reproduced=true without recomputation', () => {
      const { store, snap, replay } = makeTestExecutor();

      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics: { revenue: 1000 },
        scores: { composite: 75 },
        verdict: 'BUY',
        executionContext: { requestId: 'req-mutation', inputs: { revenue: 1000 } },
      });
      store.append(snapshot);

      // Register executor that produces DIFFERENT output
      replay.setExecutor(() => ({
        metrics: { revenue: 999 }, // Different!
        scores: { composite: 74 }, // Different!
        verdict: 'HOLD', // Different!
      }));

      const result = replay.replay(snapshot.snapshotId)!;
      // If replay returned literal true/true without recomputation,
      // this assertion would fail because byteIdentical should be false
      assert.equal(result.byteIdentical, false,
        'MUTATION PROOF: byteIdentical must be computed false when output differs');
    });

    it('test would FAIL if replay returned literal true without executor', () => {
      const { store, snap, replay } = makeTestExecutor();

      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics: { revenue: 1000 },
        scores: { composite: 75 },
        executionContext: { requestId: 'req-mutation-2', inputs: { revenue: 1000 } },
      });
      store.append(snapshot);

      // Do NOT register executor
      const result = replay.replay(snapshot.snapshotId)!;
      // If replay returned literal true without recomputation,
      // this assertion would fail
      assert.equal(result.reproduced, false,
        'MUTATION PROOF: reproduced must be false when no executor is registered');
    });

    it('test would FAIL if replay did not actually compare outputs', () => {
      const { store, snap, replay } = makeTestExecutor();

      const snapshot = snap.create({
        engineId: 'sector.banking',
        metrics: { a: 1, b: 2, c: 3 },
        scores: { x: 10, y: 20 },
        verdict: 'BUY',
        executionContext: { requestId: 'req-mutation-3', inputs: { v: 1 } },
      });
      store.append(snapshot);

      // Executor returns same metrics but different scores
      replay.setExecutor(() => ({
        metrics: { a: 1, b: 2, c: 3 }, // Same
        scores: { x: 10, y: 99 }, // Different!
        verdict: 'BUY', // Same
      }));

      const result = replay.replay(snapshot.snapshotId)!;
      assert.equal(result.reproduced, true);
      assert.equal(result.byteIdentical, false,
        'MUTATION PROOF: byteIdentical must detect score difference');
    });
  });
});
