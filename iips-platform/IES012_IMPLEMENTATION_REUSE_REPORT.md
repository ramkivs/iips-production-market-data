# IES-012 — Utilities Implementation Reuse Report

**Standard:** IES-012 — Utilities Sector Engine
**Milestone:** WP-4 — Release
**Date:** 2026-08-08

---

## 1. Reuse summary

| Component | Modified? | Expected | Actual |
|---|---|---|---|
| Platform runtime | — | 0 | **0** |
| Framework services | — | 0 | **0** |
| Contracts / schemas | — | 0 | **0** |
| Banking Engine | — | 0 | **0** |
| Insurance Engine | — | 0 | **0** |
| Capital Markets Engine | — | 0 | **0** |
| Healthcare Engine | — | 0 | **0** |
| Hospitality Engine | — | 0 | **0** |
| Energy Engine | — | 0 | **0** |
| CSIP capability | — | 0 | **0** |
| **Utilities Engine** | **NEW** | new | **new** |

## 2. New Utilities code (sector-specific only)

- `metrics/UtilitiesMetrics.ts`
- `scoring/UtilitiesScoreEngine.ts`
- `calibration/UtilitiesCalibration.ts`
- `decision/UtilitiesDecision.ts`
- `evidence/UtilitiesEvidence.ts`
- `UtilitiesEngine.ts`

## 3. Reuse metrics

- Platform services reused: runtime, plugin-loader, snapshot, replay, evidence, transport, manifest, diagnostics, qualification, activation
- Platform/framework/engine/CSIP files modified: **0**
- New Utilities source modules: 6
- New Utilities regression tests: WP-1 (4) + WP-2 (10) + WP-3 (7) + WP-4 (7) = 28

## 4. Statement

Utilities reuses the platform unchanged; all differences expressed via methodology + calibration + ontology registration (CSIP compatible, zero change).
