/**
 * P13 — Extend Surfaces (UI08, UI11, UI16) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReportView,
  buildAdminView,
  buildEvidenceExplorerView,
} from '../src/extendSurfaces.js';
import { testProvenance, TENANT_ID, AS_OF, DATA_VERSION } from './helpers.js';

describe('P13 Extend Surfaces', () => {
  const prov = testProvenance();

  describe('UI08 Reports', () => {
    it('pins dataVersion/asOf for PIT', () => {
      const view = buildReportView({
        reportId: 'RPT-001',
        reportBody: { title: 'Q4 Report' },
        provenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI08');
      assert.equal(view.disposition, 'EXTEND');
      assert.ok(view.pitPinning);
      assert.equal(view.pitPinning.dataVersion, DATA_VERSION);
      assert.equal(view.pitPinning.asOf, AS_OF);
    });

    it('does NOT claim replay reproducibility', () => {
      const view = buildReportView({
        reportId: 'RPT-001',
        reportBody: {},
        provenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.replayReproducibilityClaimed, false);
    });

    it('is frozen', () => {
      const view = buildReportView({
        reportId: 'RPT-001', reportBody: {}, provenance: prov, tenantId: TENANT_ID,
      });
      assert.ok(Object.isFrozen(view));
    });
  });

  describe('UI11 Administration', () => {
    it('replaces literals with real feed health', () => {
      const view = buildAdminView({
        feedHealthEntries: [{ provider: 'LocalFixture', status: 'healthy' }],
        provenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI11');
      assert.equal(view.feedHealth[0]._source, 'governed');
    });

    it('does not broaden C9/C10', () => {
      const view = buildAdminView({
        feedHealthEntries: [],
        provenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.c9Certified, false);
      assert.equal(view.c10Certified, false);
    });
  });

  describe('UI16 EvidenceExplorer', () => {
    it('shows contributing snapshot IDs', () => {
      const linkage = {
        evidenceId: 'E-001',
        contributingSnapshotIds: ['snap-001', 'snap-002'],
        dataVersion: DATA_VERSION,
        asOf: AS_OF,
        mode: 'SNAPSHOT',
        engineId: 'OpportunityEngine',
        engineVersion: '1.0.0',
      };
      const view = buildEvidenceExplorerView({
        evidenceLinkage: linkage,
        provenance: prov,
        tenantId: TENANT_ID,
      });
      assert.equal(view.surfaceName, 'UI16');
      assert.deepEqual(view.contributingSnapshotIds, ['snap-001', 'snap-002']);
      assert.equal(view.evidenceId, 'E-001');
    });
  });
});
