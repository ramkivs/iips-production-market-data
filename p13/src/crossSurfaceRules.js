/**
 * P13 — CROSS-SURFACE RULES (U1–U10)
 *
 * Authority:
 *   D32 P13 Implementation Authorization (commit 2f131d9)
 *   D4_10_P13_UI_DELTA.md L.3
 *
 * Purpose:
 *   Enforce the 10 cross-surface UI rules that govern how all 19 UI surfaces
 *   consume, display, and propagate governed data.
 *
 *   U1 — No fabricated provenance
 *   U2 — Degradation is visible
 *   U3 — No silent mixing
 *   U4 — Worst-case aggregation
 *   U5 — Class labelling
 *   U6 — Single resolver
 *   U7 — No client-side entitlement
 *   U8 — As-of everywhere
 *   U9 — No component rebuild without cause
 *   U10 — No concealment
 *
 * Boundaries (hard):
 *   ⚠ **CSR-1** Rules are BINDING on all 19 surfaces
 *   ⚠ **CSR-2** No rule may be waived or weakened by a surface
 *   ⚠ **CSR-3** Violations are explicit typed errors, not silent defaults
 */

import { QUALITY, QUALITY_RANK } from '../../p05/src/contract.js';
import { CLASSIFICATIONS } from '../../p12/src/dataProvenanceDto.js';
import { worstQuality } from '../../p12/src/qualityPropagation.js';

export const P13_CSR_MODULE = 'P13-CROSS-SURFACE-RULES';

/** U5: Provenance classification labels for UI display. */
export const CLASSIFICATION_LABELS = Object.freeze({
  REAL: 'Real — governed market-data provider',
  'CERTIFIED-ENGINE': 'Certified Engine — 13 certified sector engines',
  'CERTIFIED-PRODUCT': 'Certified Product — certified product-plane mechanism',
  DERIVED: 'Derived — computed from governed inputs',
  SYNTHESIZED: 'Synthesized — generated/fabricated in product plane',
  PRESENTATIONAL: 'Presentational — layout, labels, formatting',
});

/** U2: Degradation display labels. */
export const DEGRADATION_LABELS = Object.freeze({
  good: 'Current',
  stale: 'Stale — data may be outdated',
  partial: 'Partial — some data missing',
  unavailable: 'Unavailable — data not available',
});

/** U2: Degradation severity for visual rendering. */
export const DEGRADATION_SEVERITY = Object.freeze({
  good: 'normal',
  stale: 'warning',
  partial: 'warning',
  unavailable: 'error',
});

/**
 * U1 — Assert no fabricated provenance.
 *
 * A surface must not display dataSource/freshness/confidence unless derived
 * from real lineage. Literal/hard-coded provenance values are SYNTHESIZED.
 *
 * @param {object} provenance — the provenance DTO to validate
 * @returns {boolean} true if provenance is genuine (not fabricated)
 */
export function assertNoFabricatedProvenance(provenance) {
  if (!provenance || typeof provenance !== 'object') {
    throw new CrossSurfaceViolation(
      ['U1'],
      'provenance must be a non-null object — fabricated provenance is prohibited'
    );
  }

  // Check that provenance has real fields (not empty/literal)
  if (!provenance.dataSource || provenance.dataSource === 'literal') {
    throw new CrossSurfaceViolation(
      ['U1'],
      `dataSource '${provenance.dataSource}' appears fabricated — must be a governed descriptor`
    );
  }

  if (!provenance.asOf) {
    throw new CrossSurfaceViolation(
      ['U1'],
      'asOf is missing — provenance without temporal grounding is fabricated'
    );
  }

  if (!provenance.classification) {
    throw new CrossSurfaceViolation(
      ['U1'],
      'classification is missing — all provenance must be classified'
    );
  }

  return true;
}

/**
 * U2 — Get degradation display for a quality value.
 *
 * @param {string} quality — P05 quality value
 * @returns {Readonly<object>} display metadata
 */
export function getDegradationDisplay(quality) {
  if (!QUALITY.includes(quality)) {
    throw new CrossSurfaceViolation(
      ['U2', 'Q-1'],
      `unknown quality '${quality}' — cannot render degradation`
    );
  }

  return Object.freeze({
    quality,
    label: DEGRADATION_LABELS[quality],
    severity: DEGRADATION_SEVERITY[quality],
    isDegraded: quality !== 'good',
  });
}

/**
 * U3 — Assert no silent mixing of modes.
 *
 * LIVE and SNAPSHOT/PIT data must not be blended in one view without
 * an explicit mode indicator.
 *
 * @param {string[]} modes — array of modes in a view
 * @returns {boolean} true if modes are consistent or explicitly indicated
 */
export function assertNoSilentMixing(modes) {
  const uniqueModes = [...new Set(modes)];

  if (uniqueModes.length > 1) {
    throw new CrossSurfaceViolation(
      ['U3'],
      `silent mixing prohibited: view contains [${uniqueModes.join(', ')}]. ` +
      'All data in a view must share the same mode, or an explicit mode indicator must be present.'
    );
  }

  return true;
}

/**
 * U4 — Compute worst-case quality for aggregation display.
 *
 * An aggregate inherits the worst quality of its contributors.
 *
 * @param {string[]} qualities — array of P05 quality values
 * @returns {string} worst quality
 */
export function worstCaseAggregation(qualities) {
  return worstQuality(qualities);
}

/**
 * U5 — Get classification label for display.
 *
 * @param {string} classification — one of CLASSIFICATIONS
 * @returns {string} human-readable label
 */
export function getClassificationLabel(classification) {
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new CrossSurfaceViolation(
      ['U5'],
      `unknown classification '${classification}'`
    );
  }
  return CLASSIFICATION_LABELS[classification];
}

/**
 * U5 — Assert SYNTHESIZED content is labelled.
 *
 * @param {object} content — the content to check
 * @param {string} content.classification — the classification
 * @param {boolean} content.isLabelled — whether SYNTHESIZED label is shown
 * @returns {boolean}
 */
export function assertSynthesizedLabelled(content) {
  if (content.classification === 'SYNTHESIZED' && !content.isLabelled) {
    throw new CrossSurfaceViolation(
      ['U5'],
      'SYNTHESIZED content must be labelled as such — no concealed fabrication'
    );
  }
  return true;
}

/**
 * U7 — Assert server-enforced entitlement (no client-side filtering).
 *
 * @param {object} args
 * @param {string} args.enforcementLocation — 'server' | 'client'
 * @returns {boolean}
 */
export function assertServerEnforcedEntitlement(args) {
  if (args.enforcementLocation !== 'server') {
    throw new CrossSurfaceViolation(
      ['U7'],
      `entitlement must be server-enforced, not '${args.enforcementLocation}' — ` +
      'client-side filtering is prohibited'
    );
  }
  return true;
}

/**
 * U8 — Build as-of display metadata.
 *
 * Every data-bearing surface displays the effective as-of.
 *
 * @param {string} asOf — ISO-8601 UTC
 * @param {string} [mode] — LIVE | SNAPSHOT | PIT
 * @returns {Readonly<object>}
 */
export function buildAsOfDisplay(asOf, mode) {
  if (typeof asOf !== 'string' || asOf.length === 0) {
    throw new CrossSurfaceViolation(
      ['U8'],
      'asOf must be a non-empty ISO-8601 string — every data surface must display as-of'
    );
  }

  return Object.freeze({
    asOf,
    mode: mode || 'SNAPSHOT',
    displayText: `As of ${asOf}${mode ? ` (${mode})` : ''}`,
  });
}

/**
 * U9 — Determine if a component rebuild is needed.
 *
 * 13/19 surfaces need no new component — integrate transport/data-source instead.
 *
 * @param {string} disposition — REUSE | ADAPT | EXTEND | NEW
 * @returns {boolean} true if component rebuild is needed
 */
export function needsComponentRebuild(disposition) {
  return disposition === 'NEW';
}

/**
 * U10 — Assert no concealment of work disposition.
 *
 * REUSE UI / INTEGRATE DATA never hides NEW or ADAPT work.
 *
 * @param {string} surfaceName
 * @param {string} declaredDisposition — what the spec says
 * @param {string} actualDisposition — what the implementation does
 * @returns {boolean}
 */
export function assertNoConcealment(surfaceName, declaredDisposition, actualDisposition) {
  if (declaredDisposition !== actualDisposition) {
    throw new CrossSurfaceViolation(
      ['U10'],
      `${surfaceName}: declared disposition '${declaredDisposition}' does not match ` +
      `actual '${actualDisposition}' — concealment is prohibited`
    );
  }
  return true;
}

/**
 * Build a governed UI view model with cross-surface rules enforced.
 *
 * @param {object} args
 * @param {string} args.surfaceName — UI surface identifier
 * @param {string} args.disposition — REUSE | ADAPT | EXTEND | NEW
 * @param {object} args.data — the data payload
 * @param {Readonly<object>} args.provenance — P12 provenance DTO
 * @param {string} [args.mode] — data mode
 * @returns {Readonly<object>} governed UI view model
 */
export function buildUIView(args) {
  const { surfaceName, disposition, data, provenance, mode } = args;

  // U1: No fabricated provenance
  assertNoFabricatedProvenance(provenance);

  // U2: Degradation display
  const degradation = getDegradationDisplay(provenance.quality);

  // U5: Classification label
  const classificationLabel = getClassificationLabel(provenance.classification);

  // U8: As-of display
  const asOfDisplay = buildAsOfDisplay(provenance.asOf, mode || provenance.mode);

  return Object.freeze({
    surfaceName,
    disposition,
    data: Object.freeze({ ...data }),
    provenance,
    degradation,
    classificationLabel,
    asOfDisplay,
    renderedAt: new Date().toISOString(),
  });
}

/**
 * CSR-typed error.
 */
export class CrossSurfaceViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'CrossSurfaceViolation';
    this.rules = Object.freeze([...rules]);
  }
}
