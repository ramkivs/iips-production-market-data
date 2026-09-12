/**
 * P13 — EXTEND SURFACES (UI08, UI11, UI16)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2
 *
 *   UI08 Reports        — EXTEND: PIT reproducibility (pin dataVersion/asOf)
 *   UI11 Administration — EXTEND: real feed health replaces literals
 *   UI16 EvidenceExplorer — EXTEND: show contributing snapshot IDs
 *
 * Boundaries (hard):
 *   ⚠ **ES-1** Reports pin dataVersion/asOf for PIT (no replay claim)
 *   ⚠ **ES-2** Admin replaces literal provenance with real feed health
 *   ⚠ **ES-3** Evidence shows contributing snapshot IDs
 *   ⚠ **ES-4** No fabricated provenance (U1)
 *   ⚠ **ES-5** No C9/C10 certification broadened
 */

import {
  assertNoFabricatedProvenance,
  getDegradationDisplay,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';

export const P13_ES_MODULE = 'P13-EXTEND-SURFACES';

/**
 * UI08 Reports — EXTEND.
 * Pin dataVersion/asOf for PIT reproducibility.
 *
 * @param {object} args
 * @param {string} args.reportId
 * @param {object} args.reportBody — the report content
 * @param {Readonly<object>} args.provenance — P12 provenance DTO
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildReportView(args) {
  const { reportId, reportBody, provenance, tenantId } = args;

  assertNoFabricatedProvenance(provenance);

  return Object.freeze({
    surfaceName: 'UI08',
    disposition: 'EXTEND',
    reportId,
    tenantId,
    reportBody: Object.freeze({ ...reportBody }),
    // ES-1: pin dataVersion/asOf for PIT
    pitPinning: Object.freeze({
      dataVersion: provenance.dataVersion,
      asOf: provenance.asOf,
      mode: provenance.mode,
    }),
    provenanceView: buildProvenanceView(provenance),
    // ES-1: NOT a replay claim
    pitReproducible: true,
    replayReproducibilityClaimed: false, // AD-17/M-2 preserved
  });
}

/**
 * UI11 Administration — EXTEND.
 * Replace literal feed-health values with governed real feed health.
 *
 * @param {object} args
 * @param {object[]} args.feedHealthEntries — real feed health data
 * @param {Readonly<object>} args.provenance — provenance for admin data
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildAdminView(args) {
  const { feedHealthEntries, provenance, tenantId } = args;

  assertNoFabricatedProvenance(provenance);

  // ES-2: real feed health replaces literals
  const realFeedHealth = feedHealthEntries.map((entry) =>
    Object.freeze({
      ...entry,
      _source: 'governed', // not literal
      _classification: provenance.classification,
    })
  );

  return Object.freeze({
    surfaceName: 'UI11',
    disposition: 'EXTEND',
    tenantId,
    feedHealth: Object.freeze(realFeedHealth),
    provenanceView: buildProvenanceView(provenance),
    // ES-5: no C9/C10 certification broadened
    c9Certified: false,
    c10Certified: false,
  });
}

/**
 * UI16 EvidenceExplorer — EXTEND.
 * Show contributing snapshot IDs and provenance.
 *
 * @param {object} args
 * @param {Readonly<object>} args.evidenceLinkage — P12-05 evidence linkage DTO
 * @param {Readonly<object>} args.provenance — provenance DTO
 * @param {string} args.tenantId
 * @returns {Readonly<object>}
 */
export function buildEvidenceExplorerView(args) {
  const { evidenceLinkage, provenance, tenantId } = args;

  assertNoFabricatedProvenance(provenance);

  return Object.freeze({
    surfaceName: 'UI16',
    disposition: 'EXTEND',
    tenantId,
    evidenceId: evidenceLinkage.evidenceId,
    // ES-3: show contributing snapshot IDs
    contributingSnapshotIds: evidenceLinkage.contributingSnapshotIds,
    dataVersion: evidenceLinkage.dataVersion,
    asOf: evidenceLinkage.asOf,
    mode: evidenceLinkage.mode,
    engineId: evidenceLinkage.engineId,
    engineVersion: evidenceLinkage.engineVersion,
    provenanceView: buildProvenanceView(provenance),
  });
}
