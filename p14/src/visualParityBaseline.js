/**
 * P14-02 — VISUAL PARITY BASELINE ESTABLISHMENT
 *
 * Authority:
 *   D36 P14 Work-Item Definition (commit df73d3e)
 *   D38 P14 Implementation Authorization (commit 22bf59e)
 *
 * Purpose:
 *   Establish visual parity baseline from INT-017 reference screenshot and
 *   P13 UI surfaces. Create reproducible screenshot/reference evidence and
 *   document what is reference material versus generated validation evidence.
 *
 * Scope:
 *   - Extract reference targets from INT-017 (word/media/image1.png)
 *   - Define visual parity criteria for each P13 surface
 *   - Establish golden screenshot set (view model structural baselines)
 *   - Create baseline manifest
 *
 * Boundaries (hard):
 *   ⚠ **VPB-1** INT-017 is REFERENCE ONLY — not newly captured evidence
 *   ⚠ **VPB-2** Functional parity governs over pixel similarity
 *   ⚠ **VPB-3** Baseline is structural (view model shape), not pixel-level
 *   ⚠ **VPB-4** No visual-only rebuild authorized
 *   ⚠ **VPB-5** Reference vs. generated evidence must be distinguished
 */

export const P14_02_MODULE = 'P14-02-VISUAL-PARITY-BASELINE';

/**
 * VPB-1: INT-017 reference artifact metadata.
 * This is the EXISTING reference screenshot embedded in the SPEC.
 * It is NOT newly captured evidence.
 */
export const INT_017_REFERENCE = Object.freeze({
  source: 'SPEC_INTEGRATION_ALIGNED.docx',
  path: 'word/media/image1.png',
  sizeBytes: 1851396,
  disposition: 'REUSE (reference only)',
  authority: 'D4_01_INTEGRATION_REUSE_BASELINE.md INT-017',
  constraint: 'Screenshot defines target product surface coverage; it does not authorize a visual-only rebuild.',
  parityRule: 'Functional parity governs over pixel similarity.',
  isNewlyCaptured: false,
});

/**
 * VPB-3: Complete P13 surface inventory with expected visual characteristics.
 * Each surface is described by its structural view model shape, not pixel content.
 */
export const P13_SURFACE_BASELINE = Object.freeze([
  {
    surfaceId: 'UI01',
    name: 'Dashboard',
    disposition: 'REUSE',
    module: 'dataSurfaces.js',
    builder: 'buildDashboardView',
    expectedProperties: ['data', 'provenance', 'asOfDisplay', 'degradationDisplay', 'classificationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI02',
    name: 'Company Workspace',
    disposition: 'REUSE_ADAPT',
    module: 'dataSurfaces.js',
    builder: 'buildCompanyWorkspaceView',
    expectedProperties: ['data', 'provenance', 'canonicalSecurityId', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI03',
    name: 'Portfolio',
    disposition: 'REUSE',
    module: 'dataSurfaces.js',
    builder: 'buildPortfolioView',
    expectedProperties: ['holdings', 'provenances', 'asOfDisplay', 'degradationDisplay', 'aggregateQuality'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI04',
    name: 'Research',
    disposition: 'ADAPT',
    module: 'dataSurfaces.js',
    builder: 'buildResearchView',
    expectedProperties: ['researchArtifact', 'provenance', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI05',
    name: 'Screener',
    disposition: 'NEW',
    module: 'screenerSurface.js',
    builder: 'buildScreenerView',
    expectedProperties: ['rows', 'provenance', 'asOfDisplay', 'degradationDisplay', 'filters', 'sortOrder'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI06',
    name: 'Decision Center',
    disposition: 'EXTEND',
    module: 'dataSurfaces.js',
    builder: 'buildDecisionCenterView',
    expectedProperties: ['decisionCells', 'provenances', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI07',
    name: 'Watchlists',
    disposition: 'NEW',
    module: 'newSurfaces.js',
    builder: 'buildWatchlistView',
    expectedProperties: ['watchlist', 'provenance', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI08',
    name: 'Reports',
    disposition: 'EXTEND',
    module: 'extendSurfaces.js',
    builder: 'buildReportView',
    expectedProperties: ['report', 'provenance', 'asOfDisplay', 'pitPinDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI09',
    name: 'Alerts',
    disposition: 'NEW',
    module: 'newSurfaces.js',
    builder: 'buildAlertsView',
    expectedProperties: ['alerts', 'provenance', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI10',
    name: 'Collaboration',
    disposition: 'NEW',
    module: 'newSurfaces.js',
    builder: 'buildCollaborationView',
    expectedProperties: ['collaboration', 'provenance', 'asOfDisplay', 'vintagePinDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI11',
    name: 'Administration',
    disposition: 'EXTEND',
    module: 'extendSurfaces.js',
    builder: 'buildAdminView',
    expectedProperties: ['admin', 'provenance', 'feedHealthDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: false,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI12',
    name: 'Settings',
    disposition: 'ADAPT',
    module: 'dataSurfaces.js',
    builder: 'buildSettingsView',
    expectedProperties: ['settings', 'provenance'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: false,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI13',
    name: 'Global Search',
    disposition: 'NEW',
    module: 'resolverSurface.js',
    builder: 'buildSearchView',
    expectedProperties: ['results', 'provenance', 'resolverContract', 'asOfDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI14',
    name: 'Command Palette',
    disposition: 'NEW',
    module: 'resolverSurface.js',
    builder: 'resolveAndBuildView',
    expectedProperties: ['results', 'provenance', 'resolverContract', 'asOfDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI15',
    name: 'CrossSectorIntelligence',
    disposition: 'REUSE',
    module: 'dataSurfaces.js',
    builder: 'buildCrossSectorView',
    expectedProperties: ['inputs', 'provenances', 'asOfDisplay', 'degradationDisplay'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: true,
  },
  {
    surfaceId: 'UI16',
    name: 'EvidenceExplorer',
    disposition: 'EXTEND',
    module: 'extendSurfaces.js',
    builder: 'buildEvidenceExplorerView',
    expectedProperties: ['evidence', 'provenance', 'asOfDisplay', 'contributingSnapshotIds'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
  },
  {
    surfaceId: 'UI17',
    name: 'ReplayExplorer',
    disposition: 'EXTEND',
    module: 'boundedSurfaces.js',
    builder: 'buildReplayExplorerView',
    expectedProperties: ['replay', 'provenance', 'ad17Constraint'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
    boundedCondition: 'AD-17/M-2 — MUST NOT assert verified replay',
  },
  {
    surfaceId: 'UI18',
    name: 'EngineRegistry',
    disposition: 'REUSE',
    module: 'boundedSurfaces.js',
    builder: 'buildEngineRegistryView',
    expectedProperties: ['engines', 'provenance', 'ad4Constraint'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: false,
    hasDegradationIndicator: false,
    boundedCondition: 'AD-4 — MUST NOT imply revalidation',
  },
  {
    surfaceId: 'UI19',
    name: 'AiAdvisory',
    disposition: 'ADAPT',
    module: 'boundedSurfaces.js',
    builder: 'buildAiAdvisoryView',
    expectedProperties: ['advisory', 'provenance', 'synthesizedLabel', 'groundingVintage'],
    hasProvenanceBadge: true,
    hasAsOfDisplay: true,
    hasDegradationIndicator: false,
    boundedCondition: 'SYNTHESIZED — output must be labelled',
  },
]);

/**
 * VPB-6: Build the baseline manifest.
 *
 * @returns {object} baseline manifest
 */
export function buildBaselineManifest() {
  return Object.freeze({
    manifestVersion: '1.0.0',
    module: P14_02_MODULE,
    date: new Date().toISOString(),
    int017Reference: INT_017_REFERENCE,
    totalSurfaces: P13_SURFACE_BASELINE.length,
    surfaces: P13_SURFACE_BASELINE.map(s => ({
      surfaceId: s.surfaceId,
      name: s.name,
      disposition: s.disposition,
      module: s.module,
      builder: s.builder,
      expectedPropertyCount: s.expectedProperties.length,
      hasProvenanceBadge: s.hasProvenanceBadge,
      hasAsOfDisplay: s.hasAsOfDisplay,
      hasDegradationIndicator: s.hasDegradationIndicator,
      boundedCondition: s.boundedCondition || null,
    })),
    parityRules: Object.freeze({
      functionalParityOverPixelSimilarity: true,
      referenceScreenshotIsNotOracle: true,
      viewModelStructureIsBaseline: true,
      degradationMarkersRequired: true,
      provenanceBadgesRequired: true,
    }),
  });
}

/**
 * VPB-7: Validate that a view model matches its baseline surface definition.
 *
 * @param {object} viewModel — P13 view model
 * @param {object} surfaceDef — surface definition from P13_SURFACE_BASELINE
 * @returns {{ valid: boolean, violations: string[], surface: string }}
 */
export function validateAgainstBaseline(viewModel, surfaceDef) {
  const violations = [];

  if (!viewModel || typeof viewModel !== 'object') {
    violations.push(`VPB-3: view model is not a valid object for ${surfaceDef.surfaceId}`);
    return { valid: false, violations, surface: surfaceDef.surfaceId };
  }

  // Check expected properties exist
  for (const prop of surfaceDef.expectedProperties) {
    if (!(prop in viewModel)) {
      violations.push(`VPB-3: expected property '${prop}' missing from ${surfaceDef.surfaceId} view model`);
    }
  }

  // Check provenance badge if required
  if (surfaceDef.hasProvenanceBadge && !viewModel.provenance) {
    violations.push(`VPB-3: provenance badge required but missing for ${surfaceDef.surfaceId}`);
  }

  // Check as-of display if required
  if (surfaceDef.hasAsOfDisplay && !viewModel.asOfDisplay) {
    violations.push(`VPB-3: as-of display required but missing for ${surfaceDef.surfaceId}`);
  }

  // Check degradation indicator if required
  if (surfaceDef.hasDegradationIndicator && !viewModel.degradationDisplay) {
    violations.push(`VPB-3: degradation indicator required but missing for ${surfaceDef.surfaceId}`);
  }

  return { valid: violations.length === 0, violations, surface: surfaceDef.surfaceId };
}
