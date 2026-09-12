/**
 * P11-04 — ENGINE REGISTRY (13 Certified Engines, REUSE)
 *
 * Authority:
 *   D26 P11 Entry Authorization Adjudication (2026-09-12, Program Authority)
 *   D4_08 §J.2 — Certified engine scope (AD-8)
 *   EngineRegistry.CERTIFIED_ENGINES — existing-IIPS (UNTOUCHED)
 *   E2E-030 §12 — 13-engine delta @ 67e89aa
 *
 * Purpose:
 *   Document the 13 certified engines for P11 integration. This registry is
 *   SPECIFICATION ONLY — it does NOT modify, reimplement, or wrap the existing
 *   engine code. It provides metadata for the ingress path to dispatch correctly.
 *
 * Boundaries (hard):
 *   ⚠ **ER-1** REUSE only — no engine modification, no reimplementation
 *   ⚠ **ER-2** Frozen methodologies preserved verbatim (D16, D17, D20)
 *   ⚠ **ER-3** No scoring/calibration/taxonomy changes
 *   ⚠ **ER-4** AD-4 revalidation DEFERRED to P15 — this registry does NOT claim
 *     the 13-engine baseline is certified through the new ingress
 *   ⚠ **ER-5** engineVersion 1.0.0, calibrationVersion 1.0.0 for all engines
 *   ⚠ **ER-6** ontologyDimensions 8 for all engines
 */

export const P11_04_MODULE = 'P11-04-ENGINE-REGISTRY';

/**
 * ER-1/ER-5/ER-6 — Certified engine metadata (REUSE, specification only).
 *
 * Each engine entry documents:
 *   - engineId: the engine's canonical identifier
 *   - ies: the IES certification document
 *   - sector: the sector name
 *   - inputStyle: 'coded' or 'free-form' (determines collision risk)
 *   - inputKeys: the engine's expected input keys (UNCHANGED)
 *   - engineVersion: frozen at 1.0.0
 *   - calibrationVersion: frozen at 1.0.0
 *   - ontologyDimensions: frozen at 8
 *
 * ⚠ This is NOT a reimplementation. The actual engine code is in existing-IIPS
 * and is UNTOUCHED by this program.
 */
export const CERTIFIED_ENGINES = Object.freeze([
  Object.freeze({
    engineId: 'sector.banking',
    ies: 'IES-006',
    sector: 'Banking',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['BM-001', 'BM-002', 'BM-003', 'BM-004', 'BM-005', 'BM-006', 'BM-014', 'BM-015']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.insurance',
    ies: 'IES-007',
    sector: 'Insurance',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['IM-001', 'IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.capital-markets',
    ies: 'IES-008',
    sector: 'Capital Markets',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['CM-001', 'CM-002', 'CM-003', 'CM-004', 'CM-005', 'CM-006', 'CM-008']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.healthcare',
    ies: 'IES-009',
    sector: 'Healthcare',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['HC-001', 'HC-002', 'HC-004', 'HC-005', 'HC-007']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.hospitality',
    ies: 'IES-010',
    sector: 'Hospitality',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'adr', 'occupancy', 'revpar', 'revparGrowth', 'gopMargin', 'feeMix',
      'demandQualityMix', 'businessModel', 'debtEbitda', 'ebitdaMargin', 'roic', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.energy',
    ies: 'IES-011',
    sector: 'Energy',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'liftingCost', 'reserveReplacement', 'productionGrowth', 'commodityExposure',
      'transitionMix', 'evEbitda', 'fcfYield', 'roce', 'debtEbitda', 'ebitdaMargin',
      'revenueGrowth', 'segment', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.utilities',
    ies: 'IES-012',
    sector: 'Utilities',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'allowedRoe', 'rateBaseGrowth', 'regulatoryPosture', 'ffoDebt', 'saidi',
      'omEfficiency', 'transitionCapexIntensity', 'demandGrowth', 'peRatio', 'roe',
      'debtEbitda', 'ebitdaMargin', 'revenueGrowth', 'segment', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.consumer',
    ies: 'IES-013',
    sector: 'Consumer',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'brandLoyalty', 'dtcShare', 'innovationIntensity', 'marginResilience',
      'priceContribution', 'privateLabelExposure', 'peRatio', 'fcfYield', 'roic',
      'debtEbitda', 'ebitdaMargin', 'revenueGrowth', 'businessModel', 'segment', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.industrials',
    ies: 'IES-014',
    sector: 'Industrials',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'backlog', 'bookToBill', 'orderGrowth', 'aftermarketShare', 'projectRiskExposure',
      'operatingMargin', 'evEbitda', 'fcfYield', 'roce', 'debtEbitda', 'ebitdaMargin',
      'revenueGrowth', 'archetype', 'subsegment', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.technology',
    ies: 'IES-015',
    sector: 'Technology',
    inputStyle: 'free-form',
    inputKeys: Object.freeze([
      'nrr', 'recurringRevenuePct', 'usageGrowth', 'rdIntensity', 'customerConcentration',
      'capexIntensity', 'grossMargin', 'evRevenue', 'fcfYield', 'debtEbitda', 'ebitdaMargin',
      'revenueGrowth', 'archetype', 'subsegment', 'id',
    ]),
    collisionRisk: 'HIGH',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.telecom',
    ies: 'IES-016',
    sector: 'Telecommunications',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['TL-001', 'TL-002', 'TL-003', 'TL-004', 'TL-005', 'TL-006', 'TL-007', 'TL-008']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.auto',
    ies: 'IES-017',
    sector: 'Automobile',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['AU-001', 'AU-002', 'AU-003', 'AU-004', 'AU-005', 'AU-006', 'AU-007', 'AU-008']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
  Object.freeze({
    engineId: 'sector.materials',
    ies: 'IES-020',
    sector: 'Materials & Metals',
    inputStyle: 'coded',
    inputKeys: Object.freeze(['MM-001', 'MM-002', 'MM-003', 'MM-004', 'MM-005', 'MM-006', 'MM-007', 'MM-008']),
    collisionRisk: 'Low',
    engineVersion: '1.0.0',
    calibrationVersion: '1.0.0',
    ontologyDimensions: 8,
  }),
]);

/** ER-1 — Total certified engine count. */
export const CERTIFIED_ENGINE_COUNT = 13;

/** ER-1 — Lookup engine metadata by engineId. */
export function getEngine(engineId) {
  const engine = CERTIFIED_ENGINES.find((e) => e.engineId === engineId);
  if (!engine) {
    throw new Error(`Engine '${engineId}' not found in certified registry (13 engines)`);
  }
  return engine;
}

/** ER-1 — List all engine IDs. */
export function listEngineIds() {
  return CERTIFIED_ENGINES.map((e) => e.engineId);
}

/** ER-1 — List engines by input style. */
export function listEnginesByInputStyle(style) {
  return CERTIFIED_ENGINES.filter((e) => e.inputStyle === style);
}

/** ER-1 — List HIGH collision-risk engines (free-form input style). */
export function listHighCollisionRiskEngines() {
  return CERTIFIED_ENGINES.filter((e) => e.collisionRisk === 'HIGH');
}

/**
 * ER-4 — Explicit statement that this registry does NOT claim the 13-engine
 * baseline is certified through the new ingress. AD-4 revalidation is DEFERRED
 * to P15.
 */
export const AD4_REVALIDATION_CLAIM = Object.freeze({
  claimed: false,
  reason: 'AD-4 revalidation is DEFERRED to P15 (E2E Certification). ' +
    'This registry documents the 13 engines for P11 integration but does NOT ' +
    'claim they remain certified through the new ingress path. AD-4 revalidation ' +
    '(including M-1 repair) must be completed before P15 can certify the ' +
    '13-engine baseline.',
  deferredTo: 'P15',
  module: P11_04_MODULE,
});
