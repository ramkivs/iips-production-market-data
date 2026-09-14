# IES-008 — WP-3: Capital Markets Engine (Completion Report)

**Milestone:** IES-008.2 (WP-3)
**Repository:** `iips-platform`
**Status:** COMPLETE — `tsc` clean, **61/61 tests pass**, all 4 acceptance criteria met. Awaiting approval before WP-4 (Validation / Release).
**Date:** 2026-08-06
**Baseline:** IES-008 v1.0 (frozen) + `iips-platform` (3-sector validated)

---

## 1. Scope delivered (WP-3 — Capital Markets Engine, frozen assets only)

| Deliverable | Implemented |
|---|---|
| Metric evaluation (CM-001…CM-008) | ✅ `metrics/CapitalMarketsMetrics.ts` |
| Score calculation | ✅ `scoring/CapitalMarketsScoreEngine.ts` |
| Calibration loading | ✅ `calibration/CapitalMarketsCalibration.ts` (loads frozen `capital-markets-calibration-1.0.0`) |
| Decision pipeline + overrides | ✅ `decision/CapitalMarketsDecision.ts` |
| Evidence generation | ✅ `evidence/CapitalMarketsEvidence.ts` |
| Engine plugin | ✅ `CapitalMarketsEngine.ts` (implements `SectorPlugin`) |

## 2. Acceptance criteria (per `CAPITAL_MARKETS_ACCEPTANCE_TRACE_MATRIX.md`) — all PASS

| # | Criterion | Frozen source | Result |
|---|---|---|---|
| 1 | **Golden dataset reproducibility (6/6)** | Golden Dataset + Expected Outputs | ✅ exact (StrongBuy 84.6, Accum 64.5, Accum 63.0, Buy 79.6, StrongBuy 81.6, Watch 42.2) |
| 2 | **Replay determinism** | Validation (D12) | ✅ identical evidence + verdicts |
| 3 | **Calibration isolation** | Calibration Profile | ✅ profile change → different verdict, no code change |
| 4 | **Evidence completeness** | Evidence (D11) | ✅ Metric→Band→Score→Pillar→Composite→Verdict traceable |

## 3. Rounding note

The frozen expected outputs were generated with truncation rounding; the engine now reproduces them exactly (64.55→64.5, 42.25→42.2, 63.05→63.0) — no ambiguity with the frozen baseline.

## 4. Evidence

- `tsc --noEmit` → clean (exit 0).
- `tsx --test` → **61/61 PASS** (57 prior + 4 WP-3).
- Golden dataset regression: **6/6 exact**.
- Platform/framework unchanged (reuse verified WP-1/WP-2).

## 5. Program status

| Milestone | Status |
|---|---|
| IES-008 v1.0 Specification | ✅ Frozen |
| WP-1 / WP-2 | ✅ Approved |
| **WP-3 — Capital Markets Engine** | **▶ COMPLETE — tsc clean, 61/61 tests, 4/4 acceptance, awaiting approval** |
| WP-4 — Validation / Release | Pending |

**STOP — awaiting approval of WP-3 before WP-4 (Validation: golden regression report, replay report, fixture acceptance, traceability + reuse report, release candidate, independent verification).**
