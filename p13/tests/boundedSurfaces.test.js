/**
 * P13 — Bounded Surfaces (UI17, UI18, UI19) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReplayExplorerView,
  buildEngineRegistryView,
  buildAiAdvisoryView,
  UI17_AD17_CONSTRAINT,
  UI18_AD4_CONSTRAINT,
} from '../src/boundedSurfaces.js';
import { buildReplayLinkage } from '../../p12/src/evidenceReplayLinkage.js';
import { CrossSurfaceViolation } from '../src/crossSurfaceRules.js';
import { testProvenance, TENANT_ID, AS_OF, DATA_VERSION } from './helpers.js';

describe('P13 Bounded Surfaces', () => {
  const prov = testProvenance();

  describe('UI17 ReplayExplorer (AD-17 bounded)', () => {
    const replayLinkage = buildReplayLinkage({
      replayId: 'replay-001',
      originalExecutionId: 'exec-001',
      contributingSnapshotIds: ['snap-001'],
      dataVersion: DATA_VERSION,
      asOf: AS_OF,
      mode: 'SNAPSHOT',
    });

    it('builds a replay view with AD-17 constraint', () => {
      const view = buildReplayExplorerView({ replayLinkage, provenance: prov, tenantId: TENANT_ID });
      assert.equal(view.surfaceName, 'UI17');
      assert.equal(view.disposition, 'EXTEND');
      assert.ok(view.ad17Constraint);
      assert.equal(view.ad17Constraint.ad17Status, 'UNRESOLVED');
    });

    it('does NOT assert verified reproduction (BS-1)', () => {
      const view = buildReplayExplorerView({ replayLinkage, provenance: prov, tenantId: TENANT_ID });
      assert.equal(view.verifiedReproduction, false);
      assert.equal(view.verifiedByteIdentical, false);
    });

    it('rejects verified reproduction (BS-1)', () => {
      const badLinkage = { ...replayLinkage, verifiedReproduction: true };
      assert.throws(
        () => buildReplayExplorerView({ replayLinkage: badLinkage, provenance: prov, tenantId: TENANT_ID }),
        CrossSurfaceViolation
      );
    });

    it('carries replay service literals without verification', () => {
      const literalLinkage = buildReplayLinkage({
        replayId: 'r1', originalExecutionId: 'e1',
        contributingSnapshotIds: ['s1'], dataVersion: 'v1',
        asOf: AS_OF, mode: 'SNAPSHOT',
        replayServiceReproduced: true, replayServiceByteIdentical: true,
      });
      const view = buildReplayExplorerView({ replayLinkage: literalLinkage, provenance: prov, tenantId: TENANT_ID });
      assert.equal(view.replayServiceLiterals.reproduced, true);
      assert.equal(view.verifiedReproduction, false);
    });

    it('UI17_AD17_CONSTRAINT is frozen', () => {
      assert.ok(Object.isFrozen(UI17_AD17_CONSTRAINT));
    });
  });

  describe('UI18 EngineRegistry (AD-4 bounded)', () => {
    const engines = [
      { id: 'OpportunityEngine', version: '1.0.0' },
      { id: 'RankingEngine', version: '1.0.0' },
    ];

    it('builds engine registry with AD-4 constraint', () => {
      const view = buildEngineRegistryView({ engines, provenance: prov, tenantId: TENANT_ID });
      assert.equal(view.surfaceName, 'UI18');
      assert.equal(view.disposition, 'REUSE');
      assert.ok(view.ad4Constraint);
      assert.equal(view.ad4Constraint.ad4Status, 'DEFERRED');
    });

    it('does NOT imply AD-4 revalidation (BS-2)', () => {
      const view = buildEngineRegistryView({ engines, provenance: prov, tenantId: TENANT_ID });
      assert.equal(view.ad4RevalidationOccurred, false);
      for (const engine of view.engines) {
        assert.equal(engine._ad4Revalidated, false);
        assert.equal(engine._certificationStatus, 'CERTIFIED_REVALIDATION_PENDING');
      }
    });

    it('UI18_AD4_CONSTRAINT is frozen', () => {
      assert.ok(Object.isFrozen(UI18_AD4_CONSTRAINT));
    });
  });

  describe('UI19 AiAdvisory (SYNTHESIZED labelling)', () => {
    it('labels narrative as SYNTHESIZED (BS-3)', () => {
      const view = buildAiAdvisoryView({
        advisoryContent: { text: 'Based on analysis...' },
        groundingProvenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI19');
      assert.equal(view.disposition, 'ADAPT');
      assert.equal(view.narrativeClassification, 'SYNTHESIZED');
      assert.ok(view.synthesizedLabel);
      assert.equal(view.advisory.classification, 'SYNTHESIZED');
      assert.equal(view.advisory.isLabelled, true);
    });

    it('pins grounding vintage (BS-4)', () => {
      const view = buildAiAdvisoryView({
        advisoryContent: { text: 'Analysis' },
        groundingProvenance: prov,
        tenantId: TENANT_ID,
      });
      assert.ok(view.groundingVintage);
      assert.equal(view.groundingVintage.dataVersion, DATA_VERSION);
      assert.equal(view.groundingVintage.asOf, AS_OF);
    });

    it('is frozen', () => {
      const view = buildAiAdvisoryView({
        advisoryContent: { text: 'x' },
        groundingProvenance: prov,
        tenantId: TENANT_ID,
      });
      assert.ok(Object.isFrozen(view));
    });
  });
});
