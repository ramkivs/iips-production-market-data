# IES-009 — WP-3: Healthcare Engine (Completion Report)

**Milestone:** IES-009.2 (WP-3)
**Repository:** `iips-platform`
**Status:** COMPLETE — `tsc` clean, **74/74 tests pass**, all acceptance criteria met. Awaiting approval before WP-4 (Validation / Release).
**Date:** 2026-08-06
**Baseline:** IES-009 v1.0 (frozen) + `iips-platform` (4-sector validated)

---

## 1. Scope delivered (WP-3 — Healthcare Engine, frozen assets only)

| Deliverable | Implemented |
|---|---|
| Metric evaluation (HC-001…HC-012) | ✅ `metrics/HealthcareMetrics.ts` |
| Score calculation + clinical-quality pillar | ✅ `scoring/HealthcareScoreEngine.ts` |
| Clinical-quality constraint | ✅ post-composite (D15) |
| Calibration loading | ✅ `calibration/HealthcareCalibration.ts` |
| Decision + overrides + precedence | ✅ `decision/HealthcareDecision.ts` |
| Evidence generation | ✅ `evidence/HealthcareEvidence.ts` |
| Engine plugin | ✅ `HealthcareEngine.ts` |

## 2. Acceptance criteria (per `HEALTHCARE_ENGINE_ACCEPTANCE_MATRIX.md`) — all PASS

| # | Criterion | Frozen source | Result |
|---|---|---|---|
| 1 | **Golden dataset reproducibility (7/7)** | Golden Dataset + Expected Outputs | ✅ exact (Buy 75.5, Accum 68.8, Buy 74.8, Accum 67.8, Buy 74.8, StrongBuy 81.8, Avoid 53.0) |
| 2 | **Replay determinism** | Validation (D12) | ✅ identical evidence + verdicts |
| 3 | **Calibration isolation** | Calibration Profile | ✅ profile change → different verdict, no code change |
| 4 | **Evidence completeness** | Evidence (D11) | ✅ Metric→Band→Score→Pillar→Composite→Override→Verdict traceable |
| 5 | **Clinical-quality constraint applied** | D15 + Override Precedence | ✅ HC-007 composite 53 (→Hold) capped to **Avoid** |

## 3. Rounding note

The frozen baseline uses round-half-to-even (Python default); the engine now implements round-half-to-even to reproduce all 7 frozen outputs exactly.

## 4. Evidence

- `tsc --noEmit` → clean (exit 0).
- `tsx --test` → **74/74 PASS** (70 prior + 4 WP-3).
- Golden dataset regression: **7/7 exact**.
- Platform/framework unchanged (reuse verified WP-1/WP-2).

## 5. Program status

| Milestone | Status |
|---|---|
| IES-009 v1.0 Specification | ✅ Frozen |
| WP-1 / WP-2 | ✅ Approved |
| **WP-3 — Healthcare Engine** | **▶ COMPLETE — tsc clean, 74/74 tests, 5/5 acceptance, awaiting approval** |
| WP-4 — Validation / Release | Pending |

**STOP — awaiting approval of WP-3 before WP-4 (Validation: golden regression report, replay report, fixture acceptance, traceability + reuse report, release candidate, independent verification + Four-Sector Platform Certification).**
