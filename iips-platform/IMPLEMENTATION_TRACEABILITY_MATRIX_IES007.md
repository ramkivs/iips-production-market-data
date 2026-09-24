# IIPS Platform — Implementation Traceability Matrix (IES-007 Insurance)

**Repository:** `iips-platform`
**Status:** FROZEN (traceability record)
**Date:** 2026-08-06
**Purpose:** Maps every frozen Insurance specification artifact to its implementation and verification test.

---

| # | Frozen Spec Artifact | Implementation | Verification Test |
|---|---|---|---|
| 1 | IM-001 Combined Ratio | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` (ACC1/ACC4) |
| 2 | IM-002 Solvency | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 3 | IM-003 APE | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 4 | IM-004 VNB | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 5 | IM-005 Persistency | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 6 | IM-006 Embedded Value | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 7 | IM-007 Expense Ratio | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 8 | IM-008 Investment Yield | `InsuranceMetrics.ts` | `insurance-acceptance.test.ts` |
| 9 | Score Engine (band→score) | `scoring/InsuranceScoreEngine.ts` | `insurance-acceptance.test.ts` |
| 10 | Pillar composition (weights) | `scoring/InsuranceScoreEngine.ts` | ACC4 |
| 11 | Composite Score | `scoring/InsuranceScoreEngine.ts` | ACC1 |
| 12 | Calibration Profile v1.0 | `calibration/InsuranceCalibration.ts` | ACC3 |
| 13 | Verdict Mapping | `decision/InsuranceDecision.ts` | ACC1 |
| 14 | Override Rules | `decision/InsuranceDecision.ts` | fixtures FIX-I-02/03/05/07/08 |
| 15 | Decision Engine | `decision/InsuranceDecision.ts` | `insurance-acceptance.test.ts` |
| 16 | Evidence Framework | `evidence/InsuranceEvidence.ts` + `framework/evidence/EvidencePipeline.ts` | ACC4 |
| 17 | Golden Reference Dataset | `insurance-golden-reference-1.0.0.json` | ACC1 |
| 18 | Frozen Expected Outputs | `insurance-expected-outputs-1.0.0.json` | ACC1 |
| 19 | Validation Fixtures | `insurance-validation-fixtures-1.0.0.json` | WP-4 fixture acceptance |
| 20 | Replay Requirement | `replay/ReplayService.ts` | `insurance-acceptance.test.ts` (ACC2) |
| 21 | SEC / Plugin Contract | `plugin-loader/PluginContract.ts` | `insurance-reuse-verification.test.ts` |
| 22 | Runtime Coordinator | `runtime/RuntimeCoordinator.ts` | `insurance-reuse-verification.test.ts` |
| 23 | Registry Manager | `registry/RegistryManager.ts` | reuse-verification (ACC4) |
| 24 | Framework services (manifest/evidence/transport/diagnostics/qual/activation) | `framework/*` | `insurance-framework-integration.test.ts` |

## Platform reuse

The Insurance engine consumes existing platform services; no platform code changed (reuse verified in WP-1/WP-2).

## Audit / onboarding

Any reviewer can trace frozen requirement → implementation → test. Reusable template for future sectors.
