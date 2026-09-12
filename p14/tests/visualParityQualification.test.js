/**
 * P14-03 — Visual Parity Qualification Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  qualifySurfaceParity,
  qualifyAllSurfacesParity,
  generateParityReport,
} from '../src/visualParityQualification.js';
import { p14ViewModel, buildAllSurfaceViewModels } from './helpers.js';

describe('P14-03 Visual Parity Qualification', () => {
  describe('VPQ-5: Single surface qualification', () => {
    it('valid UI01 view model qualifies', () => {
      const vm = p14ViewModel('UI01', {
        data: { key: 'value' },
        classificationDisplay: { label: 'REAL' },
      });
      const result = qualifySurfaceParity(vm, 'UI01');
      assert.equal(result.qualified, true);
      assert.equal(result.violations.length, 0);
    });

    it('unknown surface fails', () => {
      const vm = p14ViewModel('UI99');
      const result = qualifySurfaceParity(vm, 'UI99');
      assert.equal(result.qualified, false);
      assert.ok(result.violations.some(v => v.includes('not found in baseline')));
    });

    it('bounded surfaces record concessions', () => {
      const vm = p14ViewModel('UI17', {
        replay: { data: 'test' },
        ad17Constraint: { status: 'UNRESOLVED' },
      });
      const result = qualifySurfaceParity(vm, 'UI17');
      assert.ok(result.concessions.length > 0);
      assert.ok(result.concessions.some(c => c.includes('AD-17')));
    });
  });

  describe('VPQ-6: All surfaces qualification', () => {
    it('all 19 surfaces can be qualified', () => {
      const surfaces = buildAllSurfaceViewModels();
      // Add required properties for specific surfaces
      const enriched = surfaces.map(({ surfaceId, viewModel }) => {
        const enriched = { ...viewModel };
        // Add surface-specific properties
        if (surfaceId === 'UI01') { enriched.data = {}; enriched.classificationDisplay = { label: 'REAL' }; }
        if (surfaceId === 'UI02') { enriched.data = {}; enriched.canonicalSecurityId = 'SEC-001'; }
        if (surfaceId === 'UI03') { enriched.holdings = []; enriched.provenances = []; enriched.aggregateQuality = 'good'; }
        if (surfaceId === 'UI04') enriched.researchArtifact = {};
        if (surfaceId === 'UI05') { enriched.rows = []; enriched.filters = []; enriched.sortOrder = {}; }
        if (surfaceId === 'UI06') { enriched.decisionCells = []; enriched.provenances = []; }
        if (surfaceId === 'UI07') enriched.watchlist = [];
        if (surfaceId === 'UI08') { enriched.report = {}; enriched.pitPinDisplay = {}; }
        if (surfaceId === 'UI09') enriched.alerts = [];
        if (surfaceId === 'UI10') { enriched.collaboration = {}; enriched.vintagePinDisplay = {}; }
        if (surfaceId === 'UI11') { enriched.admin = {}; enriched.feedHealthDisplay = {}; }
        if (surfaceId === 'UI12') enriched.settings = {};
        if (surfaceId === 'UI13') { enriched.results = []; enriched.resolverContract = 'P12-C7'; }
        if (surfaceId === 'UI14') { enriched.results = []; enriched.resolverContract = 'P12-C7'; }
        if (surfaceId === 'UI15') { enriched.inputs = []; enriched.provenances = []; }
        if (surfaceId === 'UI16') { enriched.evidence = {}; enriched.contributingSnapshotIds = []; }
        if (surfaceId === 'UI17') { enriched.replay = {}; enriched.ad17Constraint = {}; }
        if (surfaceId === 'UI18') { enriched.engines = []; enriched.ad4Constraint = {}; }
        if (surfaceId === 'UI19') { enriched.advisory = {}; enriched.synthesizedLabel = 'AI-generated'; enriched.groundingVintage = '2026-09-13'; }
        return { surfaceId, viewModel: enriched };
      });
      const result = qualifyAllSurfacesParity(enriched);
      assert.equal(result.total, 19);
      assert.equal(result.qualified, 19);
      assert.equal(result.failed, 0);
    });
  });

  describe('VPQ-7: Parity report generation', () => {
    it('report has correct structure', () => {
      const surfaces = buildAllSurfaceViewModels();
      const qualResult = qualifyAllSurfacesParity(surfaces);
      const report = generateParityReport(qualResult);
      assert.ok(report.module);
      assert.ok(report.summary);
      assert.ok(report.parityRules);
      assert.equal(report.parityRules.functionalParityOverPixelSimilarity, true);
    });
  });
});
