/**
 * P13 — PROVENANCE VIEW (classification + degradation display)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.1, L.3
 *
 * Purpose:
 *   Transform P12 provenance DTOs into UI-ready view models with
 *   governed classification labels, degradation display, and as-of semantics.
 *
 * Boundaries (hard):
 *   ⚠ **PV-1** Provenance is DERIVED from P12 DTOs — never fabricated
 *   ⚠ **PV-2** SYNTHESIZED content is always labelled as such (U5)
 *   ⚠ **PV-3** Classification labels are CLOSED — no invented labels
 *   ⚠ **PV-4** Degradation is always visible (U2)
 */

import { CLASSIFICATIONS } from '../../p12/src/dataProvenanceDto.js';
import {
  getDegradationDisplay,
  getClassificationLabel,
  assertNoFabricatedProvenance,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';

export const P13_PV_MODULE = 'P13-PROVENANCE-VIEW';

/**
 * PV-1/PV-2/PV-3 — Build a provenance view model from a P12 provenance DTO.
 *
 * @param {Readonly<object>} provenance — P12-01 provenance DTO
 * @returns {Readonly<object>} provenance view model for UI display
 */
export function buildProvenanceView(provenance) {
  // PV-1: verify provenance is genuine
  assertNoFabricatedProvenance(provenance);

  const degradation = getDegradationDisplay(provenance.quality);
  const classificationLabel = getClassificationLabel(provenance.classification);

  // PV-2: SYNTHESIZED must be explicitly flagged
  const isSynthesized = provenance.classification === 'SYNTHESIZED';

  return Object.freeze({
    // Source identity (governed, not raw provider)
    dataSource: provenance.dataSource,
    classification: provenance.classification,
    classificationLabel,

    // Temporal grounding
    asOf: provenance.asOf,
    receivedAt: provenance.receivedAt,
    dataVersion: provenance.dataVersion,
    mode: provenance.mode,

    // Quality / degradation
    quality: provenance.quality,
    completenessPct: provenance.completenessPct,
    degradation,

    // Lineage
    contributingSnapshotIds: provenance.contributingSnapshotIds,
    identityMappingVersion: provenance.identityMappingVersion,
    namespaceVersion: provenance.namespaceVersion,

    // SYNTHESIZED flag
    isSynthesized,
    synthesizedWarning: isSynthesized
      ? 'This data is synthesized — not sourced from a governed provider'
      : null,
  });
}

/**
 * PV-4 — Build a multi-source provenance summary for a view.
 *
 * Aggregates provenance from multiple data sources into a single display model.
 * Worst-case quality is propagated (U4).
 *
 * @param {Readonly<object>[]} provenances — array of P12 provenance DTOs
 * @returns {Readonly<object>} aggregated provenance view
 */
export function buildMultiSourceProvenanceView(provenances) {
  if (!Array.isArray(provenances) || provenances.length === 0) {
    throw new CrossSurfaceViolation(
      ['PV-1'],
      'provenances must be a non-empty array'
    );
  }

  const views = provenances.map(buildProvenanceView);
  const qualities = views.map((v) => v.quality);
  const modes = [...new Set(views.map((v) => v.mode))];

  // U4: worst-case aggregation
  let worstQ = qualities[0];
  let worstRank = { good: 0, stale: 1, partial: 2, unavailable: 3 }[worstQ];
  for (let i = 1; i < qualities.length; i++) {
    const rank = { good: 0, stale: 1, partial: 2, unavailable: 3 }[qualities[i]];
    if (rank > worstRank) {
      worstQ = qualities[i];
      worstRank = rank;
    }
  }

  return Object.freeze({
    sourceCount: views.length,
    sources: Object.freeze(views),
    aggregateQuality: worstQ,
    aggregateDegradation: getDegradationDisplay(worstQ),
    modes: Object.freeze(modes),
    hasMixedModes: modes.length > 1,
  });
}
