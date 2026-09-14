# IES-010 — Hospitality Implementation Reuse Report

**Standard:** IES-010 — Hospitality Sector Engine
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
| CSIP capability | — | 0 | **0** |
| **Hospitality Engine** | **NEW** | new | **new** |

## 2. New Hospitality code (sector-specific only)

- `metrics/HospitalityMetrics.ts`
- `scoring/HospitalityScoreEngine.ts`
- `calibration/HospitalityCalibration.ts`
- `decision/HospitalityDecision.ts`
- `evidence/HospitalityEvidence.ts`
- `HospitalityEngine.ts`

## 3. Reuse metrics

- Platform services reused: runtime, plugin-loader, snapshot, replay, evidence, transport, manifest, diagnostics, qualification, activation
- Platform/framework/engine/CSIP files modified: **0**
- New Hospitality source modules: 6
- New Hospitality regression tests: WP-1 (4) + WP-2 (7) + WP-3 (5) + WP-4 (5) = 21

## 4. Statement

Hospitality reuses the platform unchanged; all differences expressed via methodology + calibration + ontology registration (CSIP compatible, zero change).
