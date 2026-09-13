/**
 * P14-04 — ACCESSIBILITY CONFORMANCE VALIDATION
 *
 * Authority:
 *   D36 P14 Work-Item Definition (commit df73d3e)
 *   D38 P14 Implementation Authorization (commit 22bf59e)
 *
 * Purpose:
 *   Validate P13 UI surfaces for accessibility conformance against
 *   WCAG 2.1 AA target. Validate keyboard navigation, semantic/
 *   accessibility behavior, and screen-reader-relevant behavior.
 *
 * Boundaries (hard):
 *   ⚠ **ACV-1** WCAG 2.1 AA is the target (not AAA)
 *   ⚠ **ACV-2** View model layer only — no DOM/runtime validation
 *   ⚠ **ACV-3** Accessibility metadata must be present in view models
 *   ⚠ **ACV-4** Actual conformance claims require runtime validation (future)
 *   ⚠ **ACV-5** Record actual evidence; do not claim unsupported conformance
 */

export const P14_04_MODULE = 'P14-04-ACCESSIBILITY-VALIDATION';

/**
 * ACV-6: WCAG 2.1 AA accessibility criteria applicable to view model layer.
 *
 * These are the criteria that CAN be validated at the view model level.
 * Full WCAG conformance requires runtime/DOM validation (not in P14 scope).
 */
export const WCAG_21_AA_VIEW_MODEL_CRITERIA = Object.freeze([
  {
    id: '1.1.1',
    name: 'Non-text Content',
    level: 'A',
    viewModelCheck: 'Alternative text / aria-label metadata present for data visualizations',
    applicableToViewModels: true,
  },
  {
    id: '1.3.1',
    name: 'Info and Relationships',
    level: 'A',
    viewModelCheck: 'Semantic structure (headings, lists, tables) described in view model',
    applicableToViewModels: true,
  },
  {
    id: '1.3.2',
    name: 'Meaningful Sequence',
    level: 'A',
    viewModelCheck: 'Reading order / display order specified in view model',
    applicableToViewModels: true,
  },
  {
    id: '2.1.1',
    name: 'Keyboard',
    level: 'A',
    viewModelCheck: 'Interactive elements have keyboard navigation hints',
    applicableToViewModels: true,
  },
  {
    id: '2.4.6',
    name: 'Headings and Labels',
    level: 'AA',
    viewModelCheck: 'Section headings and labels present in view model',
    applicableToViewModels: true,
  },
  {
    id: '3.3.2',
    name: 'Labels or Instructions',
    level: 'A',
    viewModelCheck: 'Input fields have associated labels in view model',
    applicableToViewModels: true,
  },
  {
    id: '4.1.2',
    name: 'Name, Role, Value',
    level: 'A',
    viewModelCheck: 'ARIA-like role/name/value metadata in view model',
    applicableToViewModels: true,
  },
]);

/**
 * ACV-7: Required accessibility metadata properties for P13 view models.
 */
export const REQUIRED_A11Y_PROPERTIES = Object.freeze([
  'a11y',              // accessibility metadata object
]);

/**
 * ACV-8: Required properties within the a11y metadata object.
 */
export const REQUIRED_A11Y_METADATA = Object.freeze([
  'role',              // ARIA-like role
  'label',             // accessible name
  'description',       // accessible description (optional but recommended)
]);

/**
 * ACV-9: Validate accessibility metadata in a view model.
 *
 * @param {object} viewModel — P13 view model
 * @param {string} surfaceId — surface identifier
 * @returns {{ valid: boolean, violations: string[], surface: string, criteria: Array }}
 */
export function validateAccessibilityMetadata(viewModel, surfaceId = 'UNKNOWN') {
  const violations = [];
  const criteriaResults = [];

  if (!viewModel || typeof viewModel !== 'object') {
    violations.push('ACV-3: view model is not a valid object');
    return { valid: false, violations, surface: surfaceId, criteria: [] };
  }

  // Check for a11y metadata
  if (!viewModel.a11y) {
    violations.push('ACV-3: accessibility metadata (a11y) missing from view model');
  } else {
    // Check required a11y properties
    for (const prop of REQUIRED_A11Y_METADATA) {
      if (!viewModel.a11y[prop]) {
        violations.push(`ACV-3: a11y.${prop} missing from ${surfaceId}`);
      }
    }
  }

  // Check WCAG criteria applicable to view models
  for (const criterion of WCAG_21_AA_VIEW_MODEL_CRITERIA) {
    const hasMetadata = viewModel.a11y && viewModel.a11y[criterion.id];
    criteriaResults.push({
      id: criterion.id,
      name: criterion.name,
      level: criterion.level,
      satisfied: !!hasMetadata,
      note: hasMetadata ? 'metadata present' : 'metadata not present at view model level',
    });
  }

  // Check degradation accessibility (degradation states must be accessible)
  if (viewModel.degradationDisplay) {
    if (!viewModel.degradationDisplay.a11yLabel) {
      violations.push(`ACV-3: degradation display missing accessible label for ${surfaceId}`);
    }
  }

  // Check provenance accessibility (provenance badge must be accessible)
  if (viewModel.provenanceBadge) {
    if (!viewModel.provenanceBadge.a11yLabel) {
      violations.push(`ACV-3: provenance badge missing accessible label for ${surfaceId}`);
    }
  }

  return { valid: violations.length === 0, violations, surface: surfaceId, criteria: criteriaResults };
}

/**
 * ACV-10: Run accessibility validation across all surfaces.
 *
 * @param {Array<{surfaceId: string, viewModel: object}>} surfaces
 * @returns {{ total: number, passed: number, failed: number, results: Array }}
 */
export function validateAllSurfacesAccessibility(surfaces) {
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const { surfaceId, viewModel } of surfaces) {
    const result = validateAccessibilityMetadata(viewModel, surfaceId);
    if (result.valid) passed++;
    else failed++;
    results.push(result);
  }

  return {
    total: surfaces.length,
    passed,
    failed,
    results,
  };
}
