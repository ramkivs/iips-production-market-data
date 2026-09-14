# IIPS Platform — Implementation Traceability Matrix (IES-008 Capital Markets)

**Repository:** `iips-platform`
**Status:** FROZEN (traceability record)
**Date:** 2026-08-06
**Purpose:** Maps every frozen Capital Markets specification artifact to its implementation and verification test.

---

| # | Frozen Spec Artifact | Implementation | Verification Test |
|---|---|---|---|
| 1 | CM-001 AUM | `CapitalMarketsMetrics.ts` | `capital-markets-acceptance.test.ts` (ACC1/ACC4) |
| 2 | CM-002 AUM Growth | `CapitalMarketsMetrics.ts` | ACC1/ACC4 |
| 3 | CM-003 Expense Ratio | `CapitalMarketsMetrics.ts` | ACC |
| 4 | CM-004 Cost-to-Income | `CapitalMarketsMetrics.ts` | ACC |
| 5 | CM-005 Recurring % | `CapitalMarketsMetrics.ts` | ACC |
| 6 | CM-006 Market Share | `CapitalMarketsMetrics.ts` | ACC |
| 7 | CM-007 Brokerage Income | `CapitalMarketsMetrics.ts` | ACC |
| 8 | CM-008 Net Flows | `CapitalMarketsMetrics.ts` | ACC |
| 9 | Score Engine | `scoring/CapitalMarketsScoreEngine.ts` | ACC1/ACC4 |
| 10 | Calibration Profile | `calibration/CapitalMarketsCalibration.ts` | ACC3 |
| 11 | Verdict Mapping | `decision/CapitalMarketsDecision.ts` | ACC1 |
| 12 | Override Rules | `decision/CapitalMarketsDecision.ts` | fixtures FIX-CM-02/03/04/07/08 |
| 13 | Evidence Framework | `evidence/CapitalMarketsEvidence.ts` | ACC4 |
| 14 | Golden Dataset | `capital-markets-golden-reference-1.0.0.json` | ACC1 |
| 15 | Expected Outputs | `capital-markets-expected-outputs-1.0.0.json` | ACC1 |
| 16 | Validation Fixtures | `capital-markets-validation-fixtures-1.0.0.json` | WP-4 fixture acceptance |
| 17 | SEC/Plugin + Runtime + Registry + Replay + Framework | reused platform | WP-1/WP-2 tests |

## Platform reuse

Engine consumes existing platform services; **no platform code changed** (reuse verified WP-1/WP-2).

## Audit / onboarding

Any reviewer can trace frozen requirement → implementation → test. Reusable template.
