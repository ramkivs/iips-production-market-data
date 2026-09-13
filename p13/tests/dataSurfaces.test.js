/**
 * P13 — Data Surfaces (UI01, UI02, UI03, UI04, UI06, UI12, UI15) tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDashboardView,
  buildCompanyWorkspaceView,
  buildPortfolioView,
  buildResearchView,
  buildDecisionCenterView,
  buildSettingsView,
  buildCrossSectorView,
  DATA_SURFACE_DISPOSITIONS,
} from '../src/dataSurfaces.js';
import { CrossSurfaceViolation } from '../src/crossSurfaceRules.js';
import { testProvenance } from './helpers.js';

describe('P13 Data Surfaces', () => {
  const prov = testProvenance();

  describe('UI01 Dashboard', () => {
    it('builds a REUSE view', () => {
      const view = buildDashboardView({ revenue: 1000 }, prov);
      assert.equal(view.surfaceName, 'UI01');
      assert.equal(view.disposition, 'REUSE');
    });
  });

  describe('UI02 Company Workspace', () => {
    it('builds with canonical security ID', () => {
      const view = buildCompanyWorkspaceView({ name: 'Test' }, prov, 'SEC-001');
      assert.equal(view.surfaceName, 'UI02');
      assert.equal(view.canonicalSecurityId, 'SEC-001');
    });

    it('rejects empty canonical security ID', () => {
      assert.throws(
        () => buildCompanyWorkspaceView({}, prov, ''),
        CrossSurfaceViolation
      );
    });
  });

  describe('UI03 Portfolio', () => {
    it('builds with per-holding provenance', () => {
      const holdings = [{ id: 'H1', value: 1000 }, { id: 'H2', value: 2000 }];
      const provs = [prov, testProvenance({ quality: 'stale' })];
      const view = buildPortfolioView(holdings, provs);
      assert.equal(view.surfaceName, 'UI03');
      assert.equal(view.totalHoldings, 2);
      assert.ok(view.holdings[0]._provenanceView);
    });
  });

  describe('UI04 Research', () => {
    it('attaches data vintage', () => {
      const view = buildResearchView({ title: 'Report' }, prov);
      assert.equal(view.surfaceName, 'UI04');
      assert.equal(view.disposition, 'ADAPT');
      assert.ok(view.dataVintage);
      assert.equal(view.dataVintage.dataVersion, 'v1');
    });
  });

  describe('UI06 Decision Center', () => {
    it('adds cell-level provenance', () => {
      const cells = [{ id: 'C1', value: 100 }];
      const view = buildDecisionCenterView(cells, [prov]);
      assert.equal(view.surfaceName, 'UI06');
      assert.equal(view.disposition, 'EXTEND');
      assert.ok(view.cells[0]._cellProvenance);
    });
  });

  describe('UI12 Settings', () => {
    it('builds ADAPT view', () => {
      const view = buildSettingsView({ theme: 'dark' }, prov);
      assert.equal(view.surfaceName, 'UI12');
      assert.equal(view.disposition, 'ADAPT');
    });
  });

  describe('UI15 CrossSectorIntelligence', () => {
    it('marks snapshot-sourced inputs', () => {
      const inputs = [{ id: 'I1', sector: 'banking' }];
      const view = buildCrossSectorView(inputs, [prov]);
      assert.equal(view.surfaceName, 'UI15');
      assert.equal(view.inputs[0]._isSnapshotSourced, true);
      assert.equal(view.inputs[0]._sourceType, 'REAL');
    });
  });

  describe('DATA_SURFACE_DISPOSITIONS', () => {
    it('covers all 7 data surfaces', () => {
      assert.equal(Object.keys(DATA_SURFACE_DISPOSITIONS).length, 7);
    });
  });
});
