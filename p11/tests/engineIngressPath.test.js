import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDataBoundRequest,
  executeDataBound,
  executeIngressPath,
  P11_01_MODULE,
} from '../src/engineIngressPath.js';
import { testSnapshot, testCompanyInputs, testSnapshotWithValuation } from './helpers.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';

const NS = NAMESPACE_TOKEN;

describe('P11-01 engineIngressPath', () => {
  describe('buildDataBoundRequest', () => {
    it('builds a frozen DataBoundRequest from snapshot + company inputs', () => {
      const snapshot = testSnapshot();
      const companyInputs = testCompanyInputs();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs,
        engineId: 'sector.banking',
      });

      assert.ok(Object.isFrozen(request));
      assert.equal(request.engineId, 'sector.banking');
      assert.equal(request.engineVersion, '1.0.0');
      assert.equal(request.snapshotId, snapshot.snapshotId);
      assert.ok(request.inputs);
      assert.ok(request.provenance);
    });

    it('merges snapshot fields and company inputs deterministically', () => {
      const snapshot = testSnapshot();
      const companyInputs = testCompanyInputs();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs,
        engineId: 'sector.banking',
      });

      // Snapshot fields (namespaced) should be present
      assert.ok(request.inputs[`${NS}fundamentals.revenue`]);
      assert.ok(request.inputs[`${NS}fundamentals.ebitda`]);

      // Company inputs (non-namespaced) should be present
      assert.equal(request.inputs.id, 'COMP-001');
      assert.equal(request.inputs.segment, 'enterprise');
    });

    it('records contributing snapshot IDs in provenance', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      assert.deepEqual(
        request.provenance.contributingSnapshots,
        [snapshot.snapshotId],
      );
    });

    it('records provider, dataVersion, asOf in provenance', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      assert.equal(request.provenance.provider, 'LocalFixture');
      assert.equal(request.provenance.dataVersion, 'v1');
      assert.equal(request.provenance.asOf, '2026-09-12T10:00:00.000Z');
    });

    it('throws for unknown engine ID', () => {
      assert.throws(() => buildDataBoundRequest({
        snapshot: testSnapshot(),
        companyInputs: testCompanyInputs(),
        engineId: 'sector.unknown',
      }));
    });

    it('throws when field keys are not namespaced (C1)', () => {
      const snapshot = {
        ...testSnapshot(),
        fields: { revenue: { value: 1000 } },
      };
      assert.throws(() => buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      }));
    });
  });

  describe('executeDataBound', () => {
    it('executes a DataBoundRequest and returns a frozen result', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      const result = executeDataBound(request);
      assert.ok(Object.isFrozen(result));
      assert.equal(result.engineId, 'sector.banking');
      assert.equal(result.snapshotId, snapshot.snapshotId);
      assert.ok(result.executionId);
    });

    it('calls engine dispatch function when provided', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      let dispatched = false;
      const result = executeDataBound(request, ({ engineId, inputs }) => {
        dispatched = true;
        assert.equal(engineId, 'sector.banking');
        assert.ok(inputs);
        return { score: 85 };
      });

      assert.ok(dispatched);
      assert.deepEqual(result.engineResult, { score: 85 });
    });

    it('does NOT claim replay reproducibility (AD-17/M-2 UNRESOLVED)', () => {
      const snapshot = testSnapshot();
      const request = buildDataBoundRequest({
        snapshot,
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      const result = executeDataBound(request);
      assert.equal(result.provenance.replayReproducibilityClaimed, false);
      assert.equal(result.provenance.ad17Status, 'UNRESOLVED');
    });

    it('produces deterministic executionId for same inputs', () => {
      const snapshot = testSnapshot();
      const companyInputs = testCompanyInputs();

      const request1 = buildDataBoundRequest({ snapshot, companyInputs, engineId: 'sector.banking' });
      const request2 = buildDataBoundRequest({ snapshot, companyInputs, engineId: 'sector.banking' });

      const result1 = executeDataBound(request1);
      const result2 = executeDataBound(request2);

      assert.equal(result1.executionId, result2.executionId);
    });
  });

  describe('executeIngressPath', () => {
    it('executes the full ingress path and returns provenance chain', () => {
      const snapshot = testSnapshot();
      const companyInputs = testCompanyInputs();

      const result = executeIngressPath({
        snapshot,
        companyInputs,
        engineId: 'sector.banking',
      });

      assert.ok(Object.isFrozen(result));
      assert.equal(result.ingressPath, 'MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor');
      assert.equal(result.module, P11_01_MODULE);
      assert.ok(result.stage1_dataSnapshot);
      assert.ok(result.stage2_dataBoundRequest);
      assert.ok(result.stage3_executionResult);
    });

    it('records C1 and C2 certification evidence', () => {
      const result = executeIngressPath({
        snapshot: testSnapshot(),
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      assert.equal(result.certification.c1_ingressPath, true);
      assert.equal(result.certification.c2_namespaceGuard, true);
    });

    it('does NOT claim AD-4 or AD-17 certification', () => {
      const result = executeIngressPath({
        snapshot: testSnapshot(),
        companyInputs: testCompanyInputs(),
        engineId: 'sector.banking',
      });

      assert.equal(result.certification.ad4_revalidationClaimed, false);
      assert.equal(result.certification.ad17_replayClaimed, false);
    });

    it('works with valuation-domain snapshots (HIGH collision risk)', () => {
      const snapshot = testSnapshotWithValuation();
      const companyInputs = { id: 'COMP-001', segment_code: 'enterprise' };

      const result = executeIngressPath({
        snapshot,
        companyInputs,
        engineId: 'sector.utilities',
      });

      assert.ok(result.stage3_executionResult);
      assert.equal(result.stage3_executionResult.engineId, 'sector.utilities');
    });

    it('produces byte-identical results for same inputs (determinism)', () => {
      const snapshot = testSnapshot();
      const companyInputs = testCompanyInputs();

      const r1 = executeIngressPath({ snapshot, companyInputs, engineId: 'sector.banking' });
      const r2 = executeIngressPath({ snapshot, companyInputs, engineId: 'sector.banking' });

      assert.equal(
        r1.stage3_executionResult.executionId,
        r2.stage3_executionResult.executionId,
      );
    });
  });

  describe('module identity', () => {
    it('has correct module identifier', () => {
      assert.equal(P11_01_MODULE, 'P11-01-ENGINE-INGRESS-PATH');
    });
  });
});
