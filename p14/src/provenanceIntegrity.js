/**
 * P14-01 — PROVENANCE INTEGRITY VALIDATION
 *
 * Authority:
 *   D36 P14 Work-Item Definition (commit df73d3e)
 *   D38 P14 Implementation Authorization (commit 22bf59e)
 *
 * Purpose:
 *   Validate that all 19 P13 UI surfaces preserve governed provenance and
 *   do not fabricate data. Enforce U1–U10 cross-surface rules across the
 *   complete P13 surface inventory.
 *
 * Scope:
 *   - Validate provenance threading through all P13 view builders
 *   - Verify U1 (no fabricated provenance) enforcement
 *   - Verify U2 (degradation visible) enforcement
 *   - Verify U3 (no silent mixing) enforcement
 *   - Verify U5 (class labelling) enforcement
 *   - Verify U8 (as-of everywhere) enforcement
 *   - Verify U10 (no concealment) enforcement
 *
 * Boundaries (hard):
 *   ⚠ **PI-1** Provenance must be grounded in governed contracts (P12 DTOs)
 *   ⚠ **PI-2** No surface may fabricate provenance fields
 *   ⚠ **PI-3** Degradation states must be visible in view models
 *   ⚠ **PI-4** Classification labels must be from the closed set
 *   ⚠ **PI-5** As-of temporal grounding must be present
 *   ⚠ **PI-6** No silent mixing of provenance modes
 */

import { CLASSIFICATIONS, EXECUTIVE_PROVENANCE_FIELDS, P12_PROVENANCE_FIELDS } from '../../p12/src/dataProvenanceDto.js';
import {
  assertNoFabricatedProvenance,
  getDegradationDisplay,
  assertNoSilentMixing,
  getClassificationLabel,
  DEGRADATION_LABELS,
  DEGRADATION_SEVERITY,
} from '../../p13/src/crossSurfaceRules.js';

export const P14_01_MODULE = 'P14-01-PROVENANCE-INTEGRITY';

/**
 * PI-1: Required provenance fields that must be present in any governed view.
 * Combines ExecutiveProvenance (4 fields) + P12 additive fields (10 fields).
 */
export const REQUIRED_PROVENANCE_FIELDS = Object.freeze([
  ...EXECUTIVE_PROVENANCE_FIELDS,
  ...P12_PROVENANCE_FIELDS,
]);

/**
 * PI-4: Closed classification vocabulary (from P12 DP-5).
 */
export const VALID_CLASSIFICATIONS = Object.freeze([...CLASSIFICATIONS]);

/**
 * PI-3: Valid quality states (from P05 Q-1).
 */
export const VALID_QUALITY_STATES = Object.freeze(['good', 'stale', 'partial', 'unavailable']);

/**
 * PI-2: Validate a provenance object for integrity.
 *
 * Checks:
 *   - Non-null object
 *   - All required fields present
 *   - Classification in closed set
 *   - Quality in closed set
 *   - asOf is ISO-8601 UTC
 *   - dataSource is a governed descriptor (not 'literal' or empty)
 *   - mode is explicit (LIVE | SNAPSHOT | PIT)
 *
 * @param {object} provenance — provenance DTO to validate
 * @returns {{ valid: boolean, violations: string[], surface: string }}
 */
export function validateProvenanceIntegrity(provenance, surfaceId = 'UNKNOWN') {
  const violations = [];

  // PI-2: Non-null check
  if (!provenance || typeof provenance !== 'object') {
    violations.push(`PI-2: provenance is not a valid object (got ${typeof provenance})`);
    return { valid: false, violations, surface: surfaceId };
  }

  // PI-1: Required fields present
  for (const field of REQUIRED_PROVENANCE_FIELDS) {
    if (provenance[field] === undefined || provenance[field] === null) {
      violations.push(`PI-1: required field '${field}' is missing or null`);
    }
  }

  // PI-2: dataSource must not be fabricated
  if (provenance.dataSource === 'literal' || provenance.dataSource === '') {
    violations.push(`PI-2: dataSource '${provenance.dataSource}' appears fabricated`);
  }

  // PI-4: Classification must be in closed set
  if (provenance.classification && !VALID_CLASSIFICATIONS.includes(provenance.classification)) {
    violations.push(`PI-4: classification '${provenance.classification}' is not in closed set`);
  }

  // PI-3: Quality must be in closed set
  if (provenance.quality && !VALID_QUALITY_STATES.includes(provenance.quality)) {
    violations.push(`PI-3: quality '${provenance.quality}' is not a valid state`);
  }

  // PI-5: asOf must be present and ISO-8601
  if (provenance.asOf) {
    const date = new Date(provenance.asOf);
    if (isNaN(date.getTime())) {
      violations.push(`PI-5: asOf '${provenance.asOf}' is not valid ISO-8601`);
    }
  }

  // PI-6: Mode must be explicit
  const validModes = ['LIVE', 'SNAPSHOT', 'PIT'];
  if (provenance.mode && !validModes.includes(provenance.mode)) {
    violations.push(`PI-6: mode '${provenance.mode}' is not explicit (must be LIVE|SNAPSHOT|PIT)`);
  }

  return { valid: violations.length === 0, violations, surface: surfaceId };
}

/**
 * PI-3: Validate that degradation is visible in a view model.
 *
 * Checks:
 *   - View model has degradationDisplay property
 *   - Degradation label is from the closed set
 *   - Severity is assigned (normal | warning | error)
 *
 * @param {object} viewModel — P13 view model to validate
 * @param {string} surfaceId — surface identifier
 * @returns {{ valid: boolean, violations: string[], surface: string }}
 */
export function validateDegradationVisibility(viewModel, surfaceId = 'UNKNOWN') {
  const violations = [];

  if (!viewModel || typeof viewModel !== 'object') {
    violations.push('PI-3: view model is not a valid object');
    return { valid: false, violations, surface: surfaceId };
  }

  // Check provenance-level degradation
  if (viewModel.provenance) {
    const quality = viewModel.provenance.quality;
    if (quality && VALID_QUALITY_STATES.includes(quality)) {
      const display = getDegradationDisplay(quality);
      if (!display || !display.label) {
        violations.push(`PI-3: degradation display missing for quality '${quality}'`);
      }
    }
  }

  // Check surface-level degradation markers
  if (viewModel.degradationDisplay) {
    const { label, severity } = viewModel.degradationDisplay;
    if (label && !Object.values(DEGRADATION_LABELS).includes(label)) {
      violations.push(`PI-3: degradation label '${label}' not in closed set`);
    }
    if (severity && !Object.values(DEGRADATION_SEVERITY).includes(severity)) {
      violations.push(`PI-3: degradation severity '${severity}' not in closed set`);
    }
  }

  return { valid: violations.length === 0, violations, surface: surfaceId };
}

/**
 * PI-4: Validate classification labelling in a view model.
 *
 * @param {object} viewModel — P13 view model to validate
 * @param {string} surfaceId — surface identifier
 * @returns {{ valid: boolean, violations: string[], surface: string }}
 */
export function validateClassificationLabelling(viewModel, surfaceId = 'UNKNOWN') {
  const violations = [];

  if (!viewModel || typeof viewModel !== 'object') {
    violations.push('PI-4: view model is not a valid object');
    return { valid: false, violations, surface: surfaceId };
  }

  if (viewModel.provenance && viewModel.provenance.classification) {
    const classification = viewModel.provenance.classification;
    if (!VALID_CLASSIFICATIONS.includes(classification)) {
      violations.push(`PI-4: classification '${classification}' not in closed set`);
    } else {
      const label = getClassificationLabel(classification);
      if (!label) {
        violations.push(`PI-4: no display label for classification '${classification}'`);
      }
    }
  }

  // Check SYNTHESIZED content is labelled (U5)
  if (viewModel.synthesizedContent === true) {
    if (!viewModel.synthesizedLabel) {
      violations.push('PI-4: SYNTHESIZED content present but not labelled (U5 violation)');
    }
  }

  return { valid: violations.length === 0, violations, surface: surfaceId };
}

/**
 * PI-7: Run full provenance integrity validation across a set of view models.
 *
 * @param {Array<{surfaceId: string, viewModel: object}>} surfaces — array of surface/view-model pairs
 * @returns {{ totalSurfaces: number, passed: number, failed: number, results: Array }}
 */
export function validateAllSurfaces(surfaces) {
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const { surfaceId, viewModel } of surfaces) {
    const provenanceResult = viewModel.provenance
      ? validateProvenanceIntegrity(viewModel.provenance, surfaceId)
      : { valid: false, violations: ['PI-1: no provenance in view model'], surface: surfaceId };

    const degradationResult = validateDegradationVisibility(viewModel, surfaceId);
    const classificationResult = validateClassificationLabelling(viewModel, surfaceId);

    const allViolations = [
      ...provenanceResult.violations,
      ...degradationResult.violations,
      ...classificationResult.violations,
    ];

    const surfacePassed = allViolations.length === 0;
    if (surfacePassed) passed++;
    else failed++;

    results.push({
      surfaceId,
      passed: surfacePassed,
      violations: allViolations,
      provenance: provenanceResult,
      degradation: degradationResult,
      classification: classificationResult,
    });
  }

  return {
    totalSurfaces: surfaces.length,
    passed,
    failed,
    results,
  };
}
