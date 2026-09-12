import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEngineExecutionProvenance,
  computeReplayIdentity,
  buildEvidenceRecord,
  AD17_M2_STATUS,
  AD4_STATUS,
  P11_03_MODULE,
} from '../src/evidenceSnapshotReplay.js';
import { buildDataBoundRequest, executeDataBound } from '../src/engineIngressPath.js';
import { testSnapshot, testCompanyInputs } from './helpers.js';

describe('P11-03 evidenceSnapshotReplay', () => {
  describe('buildEngineExecutionProvenance', () => {
    it('builds frozen provenance with contributing snapshots', () => {
      const provenance = buildEngineExecutionProvenance({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['data-LocalFixture-v1-2026-09-12T10:00:00.000Z'],
        snapshotProvenance: {
          provider: 'LocalFixture',
          dataVersion: 'v1',
          asOf: '2026-09-12T10:00:00.000Z',
        },
      });

      assert.ok(Object.isFrozen(provenance));
      assert.equal(provenance.engineId, 'sector.banking');
      assert.equal(provenance.provider, 'LocalFixture');
      assert.equal(provenance.treatment, 'ADAPT');
      assert.equal(provenance.intRef, 'INT-003');
    });

    it('carries namespace version', () => {
      const provenance = buildEngineExecutionProvenance({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        snapshotProvenance: { provider: 'P', dataVersion: 'v1', asOf: '2026-09-12T10:00:00.000Z' },
      });
      assert.equal(provenance.namespaceVersion, '1.0');
    });
  });

  describe('computeReplayIdentity', () => {
    it('produces deterministic replay identity', () => {
      const r1 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        companyInputs: { id: 'COMP-001' },
      });
      const r2 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        companyInputs: { id: 'COMP-001' },
      });

      assert.equal(r1.replayIdentity, r2.replayIdentity);
    });

    it('produces different identity for different inputs', () => {
      const r1 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        companyInputs: { id: 'COMP-001' },
      });
      const r2 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        companyInputs: { id: 'COMP-002' },
      });

      assert.notEqual(r1.replayIdentity, r2.replayIdentity);
    });

    it('produces different identity for different contributing snapshots', () => {
      const r1 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-1'],
        companyInputs: { id: 'COMP-001' },
      });
      const r2 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-2'],
        companyInputs: { id: 'COMP-001' },
      });

      assert.notEqual(r1.replayIdentity, r2.replayIdentity);
    });

    it('sorts contributing snapshot IDs deterministically', () => {
      const r1 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-b', 'snap-a'],
        companyInputs: { id: 'COMP-001' },
      });
      const r2 = computeReplayIdentity({
        engineId: 'sector.banking',
        engineVersion: '1.0.0',
        contributingSnapshotIds: ['snap-a', 'snap-b'],
        companyInputs: { id: 'COMP-001' },
      });

      assert.equal(r1.replayIdentity, r2.replayIdentity);
    });
  });

  describe('buildEvidenceRecord', () => {
    it('builds a frozen evidence record', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });
      const result = executeDataBound(request);

      const evidence = buildEvidenceRecord({
        executionResult: result,
        companyInputs: testCompanyInputs(),
      });

      assert.ok(Object.isFrozen(evidence));
      assert.ok(evidence.evidenceId);
      assert.ok(evidence.replayIdentity);
      assert.equal(evidence.engineId, 'sector.banking');
    });

    it('does NOT claim replay reproducibility or AD-4 certification', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });
      const result = executeDataBound(request);

      const evidence = buildEvidenceRecord({
        executionResult: result,
        companyInputs: testCompanyInputs(),
      });

      assert.equal(evidence.claims.replayReproducibilityCertified, false);
      assert.equal(evidence.claims.ad4RevalidationCertified, false);
      assert.equal(evidence.claims.ad17Resolved, false);
      assert.equal(evidence.claims.m2Repaired, false);
    });
  });

  describe('AD17_M2_STATUS', () => {
    it('records AD-17 as UNRESOLVED', () => {
      assert.equal(AD17_M2_STATUS.ad17, 'UNRESOLVED');
    });

    it('records M-2 as not repaired', () => {
      assert.ok(AD17_M2_STATUS.m2.includes('not repaired'));
    });

    it('does NOT claim replay reproducibility', () => {
      assert.equal(AD17_M2_STATUS.replayReproducibilityClaimed, false);
    });

    it('is frozen', () => {
      assert.ok(Object.isFrozen(AD17_M2_STATUS));
    });
  });

  describe('AD4_STATUS', () => {
    it('records AD-4 as DEFERRED', () => {
      assert.equal(AD4_STATUS.status, 'DEFERRED');
    });

    it('is deferred to P15', () => {
      assert.equal(AD4_STATUS.deferredTo, 'P15 (E2E Certification)');
    });

    it('does NOT claim 13-engine baseline certification', () => {
      assert.equal(AD4_STATUS.thirteenEngineBaselineCertified, false);
    });

    it('is frozen', () => {
      assert.ok(Object.isFrozen(AD4_STATUS));
    });
  });

  describe('module identity', () => {
    it('has correct module identifier', () => {
      assert.equal(P11_03_MODULE, 'P11-03-EVIDENCE-SNAPSHOT-REPLAY-ADAPTATION');
    });
  });
});
