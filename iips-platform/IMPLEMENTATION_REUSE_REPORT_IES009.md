# IES-009 — Healthcare Implementation Reuse Report

**Repository:** `iips-platform`
**Date:** 2026-08-06
**Purpose:** Records reused vs new components for the Healthcare engine — a reuse KPI.

---

## 1. Reuse metrics

| Category | Count |
|---|---|
| Platform files reused unchanged | ~20 (runtime, infrastructure, contracts, registries, replay, transport core) |
| Framework services reused | 6 (Manifest, Evidence, Transport, Diagnostics, Qualification, Activation) |
| New sector-specific files | 6 modules + engine + 4 frozen assets |
| **Platform modifications required** | **0** |

## 2. Platform files reused (no modification)

`src/runtime/`, `src/plugin-loader/`, `src/registry/`, `src/snapshot/`, `src/replay/`, `src/di/`, `src/infrastructure/`, `src/framework/*` — all reused unchanged.

## 3. New sector-specific files

`src/sector-engines/healthcare/` (metrics, scoring, calibration, decision, evidence, engine, index, frozen assets).

## 4. Platform modifications

**0** — validated by WP-1 (reuse) + WP-2 (framework) + git status.

## 5. KPI

High reuse ratio; engineering effort concentrated in the sector methodology (WP-3). Consistent with all prior sectors.
