# IIPS Platform — Implementation Traceability Matrix (IES-009 Healthcare)

**Repository:** `iips-platform`
**Status:** FROZEN (traceability record)
**Date:** 2026-08-06
**Purpose:** Maps every frozen Healthcare specification artifact to its implementation and verification test.

---

| # | Frozen Spec Artifact | Implementation | Verification Test |
|---|---|---|---|
| 1 | HC-001…HC-012 metrics | `HealthcareMetrics.ts` | `healthcare-acceptance.test.ts` (ACC1/ACC4) |
| 2 | Score Engine | `scoring/HealthcareScoreEngine.ts` | ACC1/ACC4 |
| 3 | Clinical-quality pillar | `scoring/HealthcareScoreEngine.ts` | ACC4 (constraint) |
| 4 | Calibration Profile | `calibration/HealthcareCalibration.ts` | ACC3 |
| 5 | Verdict Mapping | `decision/HealthcareDecision.ts` | ACC1 |
| 6 | Override Precedence | `decision/HealthcareDecision.ts` | fixtures FIX-HC-02/03/04/05 |
| 7 | Clinical-quality constraint | `HealthcareEngine.ts` (post-composite) | ACC4 + FIX-HC-02 |
| 8 | Evidence Framework | `evidence/HealthcareEvidence.ts` | ACC4 |
| 9 | Golden Dataset | `healthcare-golden-reference-1.0.0.json` | ACC1 |
| 10 | Expected Outputs | `healthcare-expected-outputs-1.0.0.json` | ACC1 |
| 11 | Validation Fixtures | `healthcare-validation-fixtures-1.0.0.json` | WP-4 fixture acceptance |
| 12 | SEC/Plugin + Runtime + Registry + Replay + Framework | reused platform | WP-1/WP-2 tests |

## Platform reuse

Engine consumes existing platform services; **no platform code changed** (reuse verified WP-1/WP-2).
