/**
 * P13 — UI05 SCREENER SURFACE
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.2 (UI05: NEW)
 *
 * Purpose:
 *   UI05 Screener surface — consumes certified P12 C6 screener contract.
 *   Provides governed screener UI with provenance, degradation, and PIT semantics.
 *
 * Boundaries (hard):
 *   ⚠ **SS-1** Consumes C6 ONLY — does not redefine screener behavior
 *   ⚠ **SS-2** C6 certification scope is P12 API/DTO Gate only — NOT broadened
 *   ⚠ **SS-3** AD-9 satisfied — C6 certified before UI05
 *   ⚠ **SS-4** Degraded rows are visually distinct (U2)
 *   ⚠ **SS-5** No fabricated provenance (U1)
 *   ⚠ **SS-6** As-of displayed (U8)
 */

import {
  executeScreen,
  saveScreenDefinition,
  classifyRowDegradation,
} from '../../p12/src/screenerContract.js';
import {
  buildUIView,
  getDegradationDisplay,
  assertNoFabricatedProvenance,
  CrossSurfaceViolation,
} from './crossSurfaceRules.js';
import { buildProvenanceView } from './provenanceView.js';

export const P13_UI05_MODULE = 'P13-UI05-SCREENER-SURFACE';

/**
 * SS-1/SS-4 — Build a screener UI view from a C6 screen result.
 *
 * Consumes the C6 executeScreen result and adds UI display metadata:
 *   - Degradation display per row (U2)
 *   - Provenance view (U1)
 *   - As-of display (U8)
 *
 * @param {object} args
 * @param {Readonly<object>} args.screenResult — result from P12 executeScreen
 * @param {Readonly<object>} args.provenance — P12 provenance DTO for the screen
 * @returns {Readonly<object>} frozen screener UI view
 */
export function buildScreenerView(args) {
  const { screenResult, provenance } = args;

  // SS-5: verify provenance
  assertNoFabricatedProvenance(provenance);

  const provenanceView = buildProvenanceView(provenance);

  // SS-4: add degradation display per row
  const rowsWithDisplay = screenResult.rows.map((row) => {
    const degradation = getDegradationDisplay(row._rowQuality || 'unavailable');
    return Object.freeze({
      ...row,
      _degradationDisplay: degradation,
    });
  });

  return Object.freeze({
    surfaceName: 'UI05',
    disposition: 'NEW',
    screenId: screenResult.screenId,
    tenantId: screenResult.tenantId,
    asOf: screenResult.asOf,
    mode: screenResult.mode,
    totalRows: screenResult.totalRows,
    quality: screenResult.quality,
    filters: screenResult.filters,
    sort: screenResult.sort,
    provenanceView,
    rows: Object.freeze(rowsWithDisplay),
  });
}

/**
 * SS-1 — Execute a screen and build the UI view in one step.
 *
 * @param {object} args — same as P12 executeScreen + provenance
 * @param {object[]} args.universe
 * @param {Array} args.filters
 * @param {Array} args.sort
 * @param {string} args.tieBreakField
 * @param {string} args.asOf
 * @param {string} args.screenId
 * @param {string} args.tenantId
 * @param {Readonly<object>} args.provenance
 * @returns {Readonly<object>}
 */
export function executeAndBuildScreen(args) {
  const { provenance, ...screenArgs } = args;
  const screenResult = executeScreen(screenArgs);
  return buildScreenerView({ screenResult, provenance });
}

/**
 * SS-3 — Save a screen for re-execution (PIT-capable).
 *
 * @param {object} args
 * @returns {Readonly<object>}
 */
export function saveScreen(args) {
  return saveScreenDefinition(args);
}
