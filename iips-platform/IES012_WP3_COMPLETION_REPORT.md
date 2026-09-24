# IES-012 — WP-3: Utilities Engine (Completion Report)

**Milestone:** IES-012.2 (WP-3)
**Repository:** `iips-platform`
**Status:** COMPLETE — `tsc` clean, **173/173 tests pass**, **11/11 frozen outputs reproduced**, **zero platform/framework/engine/CSIP changes**. Awaiting approval before WP-4 (Validation, Replay, Regression, Independent Verification, Release).
**Date:** 2026-08-08
**Baseline:** IES-012 v1.0 (frozen) + Deterministic Execution Trace + Plugin Startup Sequence

---

## 1. Objective

Implement the Utilities Engine (`sector.utilities`) reproducing the frozen IES-012 baseline exactly: metric library, D15 scoring pipeline, segment + regulatory calibration, override precedence, evidence, ontology registration.

## 2. Deliverables (`src/sector-engines/utilities/`)

| Module | Purpose |
|---|---|
| `metrics/UtilitiesMetrics.ts` | metric evaluation (UM-001..UM-012) |
| `scoring/UtilitiesScoreEngine.ts` | band→score→pillar→composite (D15, round-half-to-even) |
| `calibration/UtilitiesCalibration.ts` | segment + regulatory calibration loader (frozen) |
| `decision/UtilitiesDecision.ts` | verdict + override precedence (D10) |
| `evidence/UtilitiesEvidence.ts` | evidence packages (D11) |
| `UtilitiesEngine.ts` | plugin + 8-dimension ontology registration |
| 4 frozen asset JSONs | calibration/golden/expected/fixtures |
| `tests/regression/utilities-acceptance.test.ts` | 7 WP-3 tests |
| `UTILITIES_DETERMINISTIC_EXECUTION_TRACE.md` + `PLUGIN_STARTUP_SEQUENCE.md` | recommended design artifacts |

## 3. WP-3 acceptance criteria (all PASS)

| # | Criterion | Result |
|---|---|---|
| 1 | Metric evaluation | ✅ |
| 2-6 | **Golden Dataset Reproducibility (11/11)** — all frozen expected outputs | ✅ |
| 7 | Override precedence deterministic (D10) | ✅ |
| 5 | Segment + regulatory calibration isolation | ✅ |
| 8 | Evidence generated via shared pipeline | ✅ |
| 9 | Ontology registration (8/8, CSIP-compatible) | ✅ |
| 10 | Replay determinism via shared services | ✅ |
| 11 | **Zero platform / framework / engine / CSIP modifications** | ✅ |

## 4. Evidence

- `tsc --noEmit` → clean (exit 0).
- `tsx --test` → **173/173 PASS** (166 prior + 7 WP-3).
- **All 11 frozen expected outputs reproduced exactly** (UT-001..011), including 5 override cases (UT-007/008/009/010/011 → Watch).
- Composite uses **round-half-to-even**; segment weights match frozen outputs.
- WP-1/WP-2 tests updated to the WP-3 engine's full-input + metadata contract (their assertions verified; all still pass).
- `git status` confirms only Utilities-specific files changed; no platform/runtime/framework/engine/CSIP file modified.

## 5. Program status

| Milestone | Status |
|---|---|
| IES-012 v1.0 Specification + Freeze | ✅ Frozen |
| Implementation Plan | ✅ Approved |
| WP-1 — Platform Reuse Verification | ✅ Complete (156/156) |
| WP-2 — Framework Integration | ✅ Complete (166/166) |
| **WP-3 — Utilities Engine** | **▶ COMPLETE — 173/173 tests, 11/11 golden outputs, zero platform changes, awaiting approval** |
| WP-4 — Validation / Independent Verification / Release | Pending |

**STOP — awaiting approval of WP-3 before WP-4 (Validation, Replay, Regression, Independent Verification, Release).**
