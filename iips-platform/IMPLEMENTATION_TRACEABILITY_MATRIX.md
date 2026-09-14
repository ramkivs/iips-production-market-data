# IIPS Platform — Implementation Traceability Matrix

**Repository:** `iips-platform`
**Status:** FROZEN (traceability record for the Banking Engine implementation)
**Date:** 2026-08-06
**Purpose:** Maps every frozen specification artifact to its implementation and its verification test. Enables audits, future maintenance, and contributor onboarding.

---

## 1. Frozen specification → Implementation → Test

| # | Frozen Spec Artifact | Implementation | Verification Test |
|---|---|---|---|
| 1 | BM-001 ROA (metric) | `BankingMetrics.ts` | `banking-acceptance.test.ts` (ACC1/ACC4) |
| 2 | BM-002 ROE | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 3 | BM-003 NIM | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 4 | BM-004 CASA | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 5 | BM-005 GNPA | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 6 | BM-006 NNPA | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 7 | BM-014 CET1 | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 8 | BM-015 CAR | `BankingMetrics.ts` | `banking-acceptance.test.ts` |
| 9 | Score Engine (band→score) | `scoring/BankingScoreEngine.ts` | `banking-acceptance.test.ts` |
| 10 | Pillar composition (weights) | `scoring/BankingScoreEngine.ts` | `banking-acceptance.test.ts` (ACC4 pillars) |
| 11 | Composite Score | `scoring/BankingScoreEngine.ts` | `banking-acceptance.test.ts` (ACC1) |
| 12 | Calibration Profile v1.0 | `calibration/BankingCalibration.ts` (loads `banking-calibration-1.0.0.json`) | `banking-acceptance.test.ts` (ACC3) |
| 13 | Verdict Mapping | `decision/BankingDecision.ts` | `banking-acceptance.test.ts` (ACC1) |
| 14 | Override Rules | `decision/BankingDecision.ts` | validation fixtures (FIX-02/03/07) |
| 15 | Decision Engine | `decision/BankingDecision.ts` | `banking-acceptance.test.ts` |
| 16 | Evidence Framework | `evidence/BankingEvidence.ts` + `framework/evidence/EvidencePipeline.ts` | `banking-acceptance.test.ts` (ACC4) |
| 17 | Golden Reference Dataset | `frozen-assets/banking-golden-reference-1.0.0.json` | `banking-acceptance.test.ts` (ACC1) |
| 18 | Frozen Expected Outputs | `frozen-assets/banking-expected-outputs-1.0.0.json` | `banking-acceptance.test.ts` (ACC1) |
| 19 | Validation Fixtures | `fixtures/banking-validation-fixtures-1.0.0.json` | validation fixture acceptance (WP-4) |
| 20 | Replay Requirement | `replay/ReplayService.ts` | `snapshot-replay.test.ts`, `banking-acceptance.test.ts` (ACC2) |
| 21 | SEC / Plugin Contract | `plugin-loader/PluginContract.ts` | `plugin-registration.test.ts` |
| 22 | Runtime Coordinator | `runtime/RuntimeCoordinator.ts` | `runtime-lifecycle.test.ts` |
| 23 | Registry Manager | `registry/RegistryManager.ts` | `registry-immutability.test.ts` |
| 24 | Transport Framework | `framework/transport/Transport.ts` | `framework-sector-neutral.test.ts` (B) |
| 25 | Evidence Pipeline | `framework/evidence/EvidencePipeline.ts` | `framework-sector-neutral.test.ts` |

## 2. Implementation API Baseline (WP-3 consumption)

The Banking Engine consumes (does not reimplement): `Container`, `RuntimeCoordinator`, `EvidencePipeline`, `PluginLoader`, `SectorPlugin`. Confirmed in `IMPLEMENTATION_API_BASELINE.md`.

## 3. Audit / onboarding use

- Any reviewer can trace a frozen requirement → its code → its test.
- Future sector engines (Insurance, Capital Markets, …) reuse rows 21–25 unchanged and add their own metric/scoring/calibration/decision/evidence rows.

## 4. Repository separation

`iips-engineering-standards` (the truth, frozen) is untouched; `iips-platform` implements and consumes the frozen assets read-only.
