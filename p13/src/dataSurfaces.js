/**
 * P13 — DATA SURFACES (UI01, UI02, UI03, UI04, UI06, UI12, UI15)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2
 *
 * Covers: REUSE / ADAPT / EXTEND surfaces that consume governed data.
 *
 *   UI01 Dashboard       — REUSE
 *   UI02 Company Workspace — REUSE cmp · ADAPT identity
 *   UI03 Portfolio       — REUSE
 *   UI04 Research        — ADAPT
 *   UI06 Decision Center — EXTEND
 *   UI12 Settings        — ADAPT
 *   UI15 CrossSector     — REUSE
 *
 * Boundaries (hard):
 *   ⚠ **DS-1** Provenance is DERIVED, never fabricated (U1)
 *   ⚠ **DS-2** Degradation is visible (U2)
 *   ⚠ **DS-3** As-of displayed (U8)
 *   ⚠ **DS-4** No P04 identity redefinition (UI02)
 *   ⚠ **DS-5** OI-08 cardinality respected (UI02, UI15)
 */

import {
  buildUIView,
  assertNoFabricatedProvenance,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';

export const P13_DS_MODULE = 'P13-DATA-SURFACES';

/** Surface dispositions — from D4_10 L.2. */
export const DATA_SURFACE_DISPOSITIONS = Object.freeze({
  UI01: 'REUSE',
  UI02: 'REUSE_ADAPT',
  UI03: 'REUSE',
  UI04: 'ADAPT',
  UI06: 'EXTEND',
  UI12: 'ADAPT',
  UI15: 'REUSE',
});

/**
 * DS-1/DS-2/DS-3 — Build a governed data surface view.
 *
 * Generic builder for REUSE/ADAPT/EXTEND surfaces. Each surface gets:
 *   - Provenance view (U1)
 *   - Degradation display (U2)
 *   - As-of display (U8)
 *
 * @param {object} args
 * @param {string} args.surfaceName — UI01/UI02/UI03/UI04/UI06/UI12/UI15
 * @param {object} args.data — the data payload
 * @param {Readonly<object>} args.provenance — P12 provenance DTO
 * @returns {Readonly<object>}
 */
export function buildDataSurfaceView(args) {
  const { surfaceName, data, provenance } = args;

  const disposition = DATA_SURFACE_DISPOSITIONS[surfaceName];
  if (!disposition) {
    throw new CrossSurfaceViolation(
      ['DS-1'],
      `surface '${surfaceName}' is not an authorized data surface`
    );
  }

  return buildUIView({
    surfaceName,
    disposition,
    data,
    provenance,
  });
}

/**
 * UI01 Dashboard — REUSE.
 * Replace literal provenance with derived; add quality/asOf badges.
 */
export function buildDashboardView(data, provenance) {
  return buildDataSurfaceView({ surfaceName: 'UI01', data, provenance });
}

/**
 * UI02 Company Workspace — REUSE cmp · ADAPT identity.
 * Uses canonical security ID; preserves OI-08 cardinality.
 */
export function buildCompanyWorkspaceView(data, provenance, canonicalSecurityId) {
  if (typeof canonicalSecurityId !== 'string' || canonicalSecurityId.length === 0) {
    throw new CrossSurfaceViolation(
      ['DS-4', 'OI-08'],
      'canonicalSecurityId must be a non-empty string — P04 identity is the authority'
    );
  }
  const view = buildDataSurfaceView({ surfaceName: 'UI02', data, provenance });
  return Object.freeze({ ...view, canonicalSecurityId });
}

/**
 * UI03 Portfolio — REUSE.
 * Holdings priced from governed D01 data; per-holding quality.
 */
export function buildPortfolioView(holdings, provenances) {
  if (!Array.isArray(holdings)) {
    throw new CrossSurfaceViolation(['DS-1'], 'holdings must be an array');
  }

  const holdingsWithProvenance = holdings.map((holding, i) => {
    const prov = provenances[i] || provenances[0];
    assertNoFabricatedProvenance(prov);
    return Object.freeze({
      ...holding,
      _provenanceView: buildProvenanceView(prov),
    });
  });

  return Object.freeze({
    surfaceName: 'UI03',
    disposition: 'REUSE',
    holdings: Object.freeze(holdingsWithProvenance),
    totalHoldings: holdings.length,
  });
}

/**
 * UI04 Research — ADAPT.
 * Attach data vintage to research artifacts.
 */
export function buildResearchView(researchArtifact, provenance) {
  const view = buildDataSurfaceView({ surfaceName: 'UI04', data: researchArtifact, provenance });
  return Object.freeze({
    ...view,
    dataVintage: Object.freeze({
      dataVersion: provenance.dataVersion,
      asOf: provenance.asOf,
      mode: provenance.mode,
    }),
  });
}

/**
 * UI06 Decision Center — EXTEND.
 * Cell-level provenance and as-of semantics.
 */
export function buildDecisionCenterView(decisionCells, provenances) {
  const cellsWithProvenance = decisionCells.map((cell, i) => {
    const prov = provenances[i] || provenances[0];
    assertNoFabricatedProvenance(prov);
    return Object.freeze({
      ...cell,
      _cellProvenance: buildProvenanceView(prov),
    });
  });

  return Object.freeze({
    surfaceName: 'UI06',
    disposition: 'EXTEND',
    cells: Object.freeze(cellsWithProvenance),
  });
}

/**
 * UI12 Settings — ADAPT.
 * Data-source events and preferences.
 */
export function buildSettingsView(settings, provenance) {
  return buildDataSurfaceView({ surfaceName: 'UI12', data: settings, provenance });
}

/**
 * UI15 CrossSectorIntelligence — REUSE.
 * Mark snapshot-sourced inputs; OI-08 cardinality.
 */
export function buildCrossSectorView(inputs, provenances) {
  const markedInputs = inputs.map((input, i) => {
    const prov = provenances[i] || provenances[0];
    assertNoFabricatedProvenance(prov);
    return Object.freeze({
      ...input,
      _sourceType: prov.classification,
      _isSnapshotSourced: prov.contributingSnapshotIds && prov.contributingSnapshotIds.length > 0,
      _provenanceView: buildProvenanceView(prov),
    });
  });

  return Object.freeze({
    surfaceName: 'UI15',
    disposition: 'REUSE',
    inputs: Object.freeze(markedInputs),
  });
}
