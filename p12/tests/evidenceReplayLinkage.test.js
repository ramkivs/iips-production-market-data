/**
 * P12-05 — Evidence / Replay Linkage tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvidenceLinkage,
  buildReplayLinkage,
  assertAd17ConstraintPreserved,
  EvidenceViolation,
  AD17_CONSTRAINT,
} from '../src/evidenceReplayLinkage.js';
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { AS_OF, DATA_VERSION } from './helpers.js';

describe('P12-05 Evidence / Replay Linkage', () => {
  describe('buildEvidenceLinkage', () => {
    const validArgs = {
      evidenceId: 'evidence-001',
      contributingSnapshotIds: ['snap-001', 'snap-002'],
      provider: 'LocalFixture',
      dataVersion: DATA_VERSION,
      asOf: AS_OF,
      mode: 'SNAPSHOT',
      engineId: 'OpportunityEngine',
      engineVersion: '1.0.0',
    };

    it('builds a valid evidence DTO', () => {
      const dto = buildEvidenceLinkage(validArgs);
      assert.equal(dto.evidenceId, 'evidence-001');
      assert.deepEqual(dto.contributingSnapshotIds, ['snap-001', 'snap-002']);
      assert.equal(dto.provider, 'LocalFixture');
      assert.equal(dto.dataVersion, DATA_VERSION);
      assert.equal(dto.asOf, AS_OF);
      assert.equal(dto.mode, 'SNAPSHOT');
      assert.equal(dto.namespaceVersion, NAMESPACE_VERSION);
    });

    it('is frozen (ER-6)', () => {
      const dto = buildEvidenceLinkage(validArgs);
      assert.ok(Object.isFrozen(dto));
      assert.ok(Object.isFrozen(dto.contributingSnapshotIds));
    });

    it('reproducibilityClaimed is false (ER-5)', () => {
      const dto = buildEvidenceLinkage(validArgs);
      assert.equal(dto.reproducibilityClaimed, false);
    });

    it('rejects empty evidenceId', () => {
      assert.throws(() => buildEvidenceLinkage({ ...validArgs, evidenceId: '' }), EvidenceViolation);
    });

    it('rejects empty contributingSnapshotIds', () => {
      assert.throws(
        () => buildEvidenceLinkage({ ...validArgs, contributingSnapshotIds: [] }),
        EvidenceViolation
      );
    });

    it('rejects empty provider (ER-2)', () => {
      assert.throws(
        () => buildEvidenceLinkage({ ...validArgs, provider: '' }),
        EvidenceViolation
      );
    });

    it('carries executionId when provided', () => {
      const dto = buildEvidenceLinkage({ ...validArgs, executionId: 'exec-001' });
      assert.equal(dto.executionId, 'exec-001');
    });
  });

  describe('buildReplayLinkage', () => {
    const validArgs = {
      replayId: 'replay-001',
      originalExecutionId: 'exec-001',
      contributingSnapshotIds: ['snap-001'],
      dataVersion: DATA_VERSION,
      asOf: AS_OF,
      mode: 'SNAPSHOT',
    };

    it('builds a valid replay DTO', () => {
      const dto = buildReplayLinkage(validArgs);
      assert.equal(dto.replayId, 'replay-001');
      assert.equal(dto.originalExecutionId, 'exec-001');
      assert.equal(dto.asOf, AS_OF);
    });

    it('is frozen', () => {
      const dto = buildReplayLinkage(validArgs);
      assert.ok(Object.isFrozen(dto));
    });

    it('verifiedReproduction is false (ER-1/ER-5)', () => {
      const dto = buildReplayLinkage(validArgs);
      assert.equal(dto.verifiedReproduction, false);
      assert.equal(dto.verifiedByteIdentical, false);
    });

    it('carries ReplayService literals without claiming verification (ER-1)', () => {
      const dto = buildReplayLinkage({
        ...validArgs,
        replayServiceReproduced: true,
        replayServiceByteIdentical: true,
      });
      // Literals are carried
      assert.equal(dto.replayServiceLiterals.reproduced, true);
      assert.equal(dto.replayServiceLiterals.byteIdentical, true);
      // But NOT verified
      assert.equal(dto.verifiedReproduction, false);
      assert.equal(dto.verifiedByteIdentical, false);
    });

    it('carries AD-17 constraint (ER-1)', () => {
      const dto = buildReplayLinkage(validArgs);
      assert.deepEqual(dto.ad17Constraint, AD17_CONSTRAINT);
      assert.equal(dto.ad17Constraint.ad17Status, 'UNRESOLVED');
    });

    it('AD17_CONSTRAINT is frozen', () => {
      assert.ok(Object.isFrozen(AD17_CONSTRAINT));
    });

    // D71 (Tier 1 / L-8): regression guard. m2Defect previously stated that
    // ReplayService "returns reproduced/byteIdentical as literals". That is false:
    // ReplayService COMPUTES them; the UI-facing values are hardcoded by
    // executive-transport. This string is serialized on every P12 governance payload.
    it('AD-17 m2Defect states the accurate basis, not the stale literal claim (D71)', () => {
      assert.match(AD17_CONSTRAINT.m2Defect, /hardcoded by executive-transport/);
      assert.doesNotMatch(AD17_CONSTRAINT.m2Defect, /returns\s+reproduced\/byteIdentical\s+as\s+literals/i);
      // AD-17 firewall unchanged: still no verified-replay claim.
      assert.equal(AD17_CONSTRAINT.ad17Status, 'UNRESOLVED');
    });

    it('rejects empty replayId', () => {
      assert.throws(
        () => buildReplayLinkage({ ...validArgs, replayId: '' }),
        EvidenceViolation
      );
    });
  });

  describe('assertAd17ConstraintPreserved', () => {
    it('passes for valid replay DTO', () => {
      const dto = buildReplayLinkage({
        replayId: 'r1', originalExecutionId: 'e1',
        contributingSnapshotIds: ['s1'], dataVersion: 'v1',
        asOf: AS_OF, mode: 'SNAPSHOT',
      });
      assert.equal(assertAd17ConstraintPreserved(dto), true);
    });

    it('fails if verifiedReproduction is true', () => {
      assert.throws(
        () => assertAd17ConstraintPreserved({ verifiedReproduction: true, verifiedByteIdentical: false }),
        EvidenceViolation
      );
    });

    it('fails if verifiedByteIdentical is true', () => {
      assert.throws(
        () => assertAd17ConstraintPreserved({ verifiedReproduction: false, verifiedByteIdentical: true }),
        EvidenceViolation
      );
    });
  });
});
